import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiRespose} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "video does not exists");
    }
    const like = await Like.findOne({
        likedBy : userId,
        video : videoId
    })
    let likeStatus;
    if(!like){
        const addLike = await Like.create({
             likedBy : userId,
             video : videoId
         })
         if(!addLike){
            throw new ApiError(500, "There was an error while processing your request")
         }
         else{
            return res.status(200).json(new ApiRespose(200, {like}, "you liked the video"))
         }
    }
    else{
        const removeLike = await Like.findByIdAndDelete(like._id);
         likeStatus = "you disliked the video"
         if(!removeLike){
            throw new ApiError(500, "There was an error while processing your request")
         }
         else{
            return res.status(200).json(new ApiRespose(200, {removeLike}, "you disliked the video"))
         }
    }
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id;
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "video does not exists");
    }
    const like = await Like.findOne({
        likedBy : userId,
        tweet : tweetId
    })
    if(!like){
        const addLike = await Like.create({
             likedBy : userId,
             tweet : tweetId
         })
         if(!addLike){
            throw new ApiError(500, "There was an error while processing your request")
         }
         else{
            return res.status(200).json(new ApiRespose(200, {addLike}, "you liked the tweet"))
         }
    }
    else{
        const removeLike = await Like.findByIdAndDelete(like._id);
         if(!removeLike){
            throw new ApiError(500, "There was an error while processing your request")
         }
         else{
            return res.status(200).json(new ApiRespose(200, {removeLike}, "you disliked the tweet"))
         }
    }
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}