import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiRespose} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
})

const publishAVideo = asyncHandler(async (req, res) => {
          
    // TODO: get video, upload to cloudinary, create video
    /*
    fetch required fields from the body of the request
    upload the video and thumbnail file to cloudinary
    fetch the required fields from cloudinary response --> like duration and urls
    create video document and upload on db
    send valid response
     */
        const { title, description} = req.body
        if(!(title && description)){
            throw new ApiError('title and description are required');
        }
        const videoLocalPath = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
        if(!(videoLocalPath && thumbnailLocalPath)){
            throw new ApiError("videos file and thumbnail are required");
        }
        const video = await uploadOnCloudinary(videoLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(!(video && thumbnail)){
            throw new ApiError(500, 'There was an error while uploading the file')
        }
        const publishVideo = await Video.create({
            videoFile : video.url,
            thumbnail : thumbnail.url,
            title : title,
            description : description,
            duration : video.duration,
            owner : req.user._id
        })
        if(!publishVideo){
            throw new ApiError(500, 'Something went wrong while uploading a video');
        }
        res.status(200).json(
            new ApiRespose(200, publishVideo, "video uploaded successfully")
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findOne({
        owner : req.user._id,
        _id : new mongoose.Types.ObjectId(videoId)
    })
    if(!video){
        throw new ApiError(404, 'Video not found')
    }
    return res.status(200).json(
        new ApiRespose(200,video, 'video fetched succesfully')
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!(title && description && thumbnailLocalPath)){
        throw new ApiError(400, 'all fields are required');
    }
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!newThumbnail){
        throw new ApiError(500, 'something went wrong while uploading thumbnail')
    }
    const video = Video.findOneAndUpdate({
        owner : req.user._id,
        _id : new mongoose.Types.ObjectId(videoId)
    },{
        $set : {
            title,
            description,
            thumbnail : newThumbnail.url
        }
    }, {
        new : true
    })
    if(!video){
        throw new ApiError(404, 'Video not found')
    }
    return res.status(200).json(
        new ApiRespose(200, video, 'video updated successfully')
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    let video = await Video.findOneAndDelete({
        owner : req.user._id,
        _id : new mongoose.Types.ObjectId(videoId)
    })
    if(!video){
        throw new ApiError(404, 'Video not found') 
    }
    return res.status(200).json(
        new ApiRespose(200,'video', 'video deleted successfully')
    )
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    let video = await Video.findOneAndUpdate({
        owner : req.user._id,
        _id : new mongoose.Types.ObjectId(videoId)
    })
    if(!video){
        throw new ApiError(404, 'Video not found') 
    }
    video.isPublished = !video.isPublished;

    await video.save();

    return res.status(200).json(new ApiRespose(
        200,
        {},
        "Toggle public status successfully"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}