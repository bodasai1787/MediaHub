import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiRespose } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
const genrateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh token and access token")
    }

}
const registerUser = asyncHandler(async (req, res) => {
    /*
        1) take input details from user
            input : firstname, lastname, email id, password
        2) validate the fields
        3) check if user already exists // username or email
        4) check for images , check for avatar
        5) upload the files to cloudinary
        6) create user object -- create entry in db
        7) remove password and refresh token field from the respose
        8) check for user creation
        9) return res
    */
    const {fullName, email, username, password} = req.body;
    //console.log({"email": email})
    if([fullName, email, username, password].some((field)=> field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    //const coverImageLocalPath = req.files?.coverImage[0].path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullname : fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiRespose(200, createdUser, "User Registerd Successfully")
    )
})
const loginUser = asyncHandler(async (req,res)=>{
    /* TODO
      get user input for username/email address and password fields from request body
      validate for complete informatation
      check if the user with provided username exists
      if exist check for password
      throw error if password is not present or user does not exists
      else generate the refresh token and access token
      send it to cookies 
      if completed send success response
     */
    const {email, username, password} = req.body;
    if(!(username || email)){
        throw new ApiError(400, "username or password is required")
    }
    const user =  await User.findOne({$or:[{username}, {email}]});
    if(!user){
        throw new ApiError(404, "user does not exists")
    }
    const isPasswordValid = user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(404, "invalid user credentials")
    }
    const {accessToken, refreshToken} = await genrateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiRespose(200, {
                user: loggedInUser,
                refreshToken,
                accessToken
            }, "User logged in successfully")
    )
})

const logOutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(req.user._id,{
        $set : {
            refreshToken : undefined
        }
    },{
        new : true
    })
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiRespose(200, {}, "User logged Out"));
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError("401", "Unautherized Request");
        }
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used");
        }
        const {accessToken, refreshToken} = await genrateAccessAndRefreshToken(user._id);
        const options = {
            httpOnly : true,
            secure: true
        }
        return res
                .status(200)
                .cookie("accessToken",  accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(new ApiRespose("200",{accessToken, refreshToken},"access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    if(user.isPasswordCorrect(oldPassword)){
        throw new ApiError(400, "Invalid password");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res
        .status(200)
        .json(new ApiRespose(200, {}, " Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
            .status(200)
            .json((200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = User.findByIdAndUpdate(req.user?._id,{$set : {fullname : fullName, email : email }},{new : true}).select("-password")
    res.status(200)
       .json(new ApiRespose(200, user, "Account Detailsupdated successfull"));
})

const updateUserAvatar = asyncHandler(async (req, res) =>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar");
    }
    const user = await User.findByIdAndUpdate(req.user._id, {$set : {avatar : avatar.url}}, {new : true}).select("-password");
    return res.status(200).json(new ApiRespose("200", {
        user
    }), "avatar updated successfully")

})

const updateUserCoverImage = asyncHandler(async (req, res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover Image");
    }
    const user = await User.findByIdAndUpdate(req.user._id, {$set : {coverImage : coverImage}}, {new : true}).select("-password");
    return res.status(200).json(new ApiRespose("200", {
        user
    }), "Cover Image Updated Successfully")

})
export {registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar}