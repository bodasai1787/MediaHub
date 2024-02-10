import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiRespose } from "../utils/apiResponse.js"
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

    const avatarLocalPath = req.files?.avatar[0].path;
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

export {registerUser}