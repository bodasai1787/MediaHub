import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiRespose} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content){
        throw new ApiError(401, "Content is required")
    }
    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content
    })
    return res.status(200).json(
        new ApiRespose(200, {tweet}, "tweet posted successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const userTweets =  await Tweet.find({owner : userId});
    if(!userTweets){
        throw new ApiError(404, "Invalid user")
    }
    return res.status(200).json(new ApiRespose(200, {userTweets}, "tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!tweetId){
        throw new ApiError(400, "tweetID is required");
    }
    if(!content){
        throw new ApiError(400, "Content is required");
    }
    if(!await Tweet.find({owner : new mongoose.Types.ObjectId(req.user._id), _id : new mongoose.Types.ObjectId(tweetId)})){
        throw new ApiError(400, "Invalid Tweet")
    }
    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set : {
            content : content,
        }
    },{
        new : true
    })
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }
    else{
        return res.status(200).json(new ApiRespose(200, {
            tweet
        },
        "tweet updated successfully"))
    }
    
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.body;
    if(!tweetId){
        throw new ApiError(400, "tweetID is required");
    }
    if(!await Tweet.find({owner : mongoose.Types.ObjectId(req.user._id), _id : mongoose.Types.ObjectId(tweetId)})){
        throw new ApiError(400, "Invalid Tweet")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }
    else{
        return res.status(200).json(new ApiRespose(200, {
            tweet
        },
        "tweet updated successfully"))
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}