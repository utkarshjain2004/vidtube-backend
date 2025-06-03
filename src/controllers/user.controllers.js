    import { asyncHandler } from "../utils/asyncHandler.js";
    import { ApiError } from "../utils/apiError.js";
    import {User} from "../models/user.models.js";
    import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js";
    import { ApiResponse } from "../utils/ApiResponse.js";
    import jwt from "jsonwebtoken";

    const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user= await User.findById(userId)
    
        if(!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken =   user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken //save the refresh token in the user document
        await user.save({validateBeforeSave: false}) //save the user document with the new refresh token
        return {accessToken,refreshToken}
    } catch (error) {
        console.error("Error generating access and refresh token:", error);
        throw new ApiError(500, "Internal server error while generating tokens")
        
    }
    }

    const registerUser = asyncHandler(async (req, res) => {
        const {fullname, email, username, password} = req.body

        //validation
        if(
            [fullname, email, username, password].some(field => field?.trim() === "")
        )
            {
            throw new ApiError(400, "Full name is required")
        }
    const existedUser = await User.findOne({
            $or: [{username}, {email}]
        })

        if(existedUser){
        throw new ApiError(409, "Username or email already exists") 
        }

        console.warn(req.files);
        
    const avatarLocalPath =  req.files?.avatar?.[0]?.path
    const coverLocalPath =  req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    //   const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars")
    //   const coverImage = coverLocalPath ? await uploadOnCloudinary(coverLocalPath, "covers") : null

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Avatar uploaded successfully:", avatar);
    } catch (error) {
        console.log("Error uploading avatar:", error);
        throw new ApiError(500, "Avatar upload failed")
    }
        
    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("coverImage uploaded successfully:", coverImage);
    } catch (error) {
        console.log("Error uploading coverImage:", error);
        throw new ApiError(500, "coverImage upload failed")
    }

    try {
        const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        })
    
        const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        )
    
    
    
        if(!createdUser) {
            throw new ApiError(500, "User creation failed(Something went wrong)")
        }
        return res
        .status(201)
        .json(new ApiResponse(200, "User created successfully", createdUser))
    
    } catch (error) {
        console.log("User Creation failed");

        if(avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500, "User creation failed(Something went wrong) and images were deleted", error)
        
    }

    })

    const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const {email,username, password} = req.body

    //validation
    if(!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }
    const user = await User.findOne({
            $or: [{username}, {email}]
        })
        if(!user) {
            throw new ApiError(404, "User not found")
        }
        //check password
        const isPasswordValid = await user.isPasswordCorrect(password)

        if(!isPasswordValid) {
            throw new ApiError(401, "Invalid password")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
        if(!loggedInUser) {
            throw new ApiError(500, "Something went wrong while fetching user data")
        }
        const options ={
            httpOnly: true,
            SECURE: process.env.NODE_ENV === "production", //use secure cookies in production
        }
        return res 
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, 
                {user: loggedInUser, accessToken , refreshToken},
                "User logged in successfully"))


    })

    const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
    
    req.user._id,
        {
            $set: {
                refreshToken:undefined, //remove the refresh token from the user document
            }
        },
        {
            new:true
        }

    )

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", //use secure cookies in production
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
    })

    const refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken 

        if( !incomingRefreshToken) {
            throw new ApiError(401, "invalid Refresh token")
        }

        try {
        const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET,  
            )
            const user = await User.findById(decodeToken?._id)

            if(!user) {
                throw new ApiError(404, "invalid refresh token")
            }
            if(incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(403, "Invalid refresh token or refresh token expired")
            }

            const options ={
                httpOnly: true,
                SECURE: process.env.NODE_ENV === "production", //use secure cookies in production
            }

        const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed successfully"))
        } catch (error) {
            throw new ApiError(401, "Invalid refresh token or refresh token expired", error)
        }
    })

    const changeCurrentPassword = asyncHandler(async (req, res) => 
        {
            const {oldPassword, newPassword} = req.body
        const user =  await User.findById(req.user?._id)
            const isPasswordValid = await user.isPasswordCorrect(oldPassword)

            if(!isPasswordValid) {
                throw new ApiError(401, "Invalid old password")
            }
            user.password = newPassword //update the password
            await user.save({validateBeforeSave: false}) //save the user document with the new password

            return res.status(200).json( new ApiResponse(200, {}, "Password changed successfully"))
        }
    )


    const getCurrentUser = asyncHandler(async (req, res) => {
        return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
    })

    const updateAccountDetails = asyncHandler(async (req, res) => {
        const{fullname, email} = req.body

        if(!fullname || !email) {
            throw new ApiError(400, "Full name and email are required")
        }


    const user = await User.findByIdAndUpdate(
            req.user?._id ,
            {
                $set: {
                    fullname,
                    email
                }
            },
            {
                new:true,
            }       
        ).select("-password -refreshToken")

        return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))

    })

    const updateUserAvatar = asyncHandler(async (req, res) => {
        const avatarLocalPath = req.file?.path

        if(!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing")
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if(!avatar.url) {
            throw new ApiError(500, "Avatar upload failed due to absence of url")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new:true,
            }
        ).select("-password -refreshToken")

        res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
    })

    const updateUserCoverImage = asyncHandler(async (req, res) => {
        const coverImageLocalPath = req.file?.path

        if(!coverImageLocalPath) {
            throw new ApiError(400, "Cover image file is missing")
        }
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage.url) {
            throw new ApiError(500, "Cover image upload failed due to absence of url")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {
                new:true,
            }
        ).select("-password -refreshToken")
        res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))
    })

    // How to get complex data with aggregation pipeline in MongoDB
    const getUserChannelProfile = asyncHandler(async (req, res) => {

        const {username} = req.params
        if(!username?.trim()){
            throw new ApiError(400, "Username is required")
        }

        const channel = await User.aggregate(
            [
                {
                    $match: {
                        username: username?.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribedTo"
                    }
                },
                {
                    $addFields: {
                        subscribersCount: {$size: "$subscribers"},
                        channelSubscribedToCount: {$size: "$subscribedTo"},
                        isSubscribed: {
                            $cond: {
                                if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    //project only the necessary fields
                    $project: {
                        fullname: 1,
                        username: 1,
                        avatar: 1,
                        coverImage: 1,
                        subscribersCount: 1,
                        channelSubscribedToCount: 1,
                        isSubscribed: 1,
                        coverImage: 1,
                        email: 1
                    }
                }
            ]
        )
        if(!channel?.length) {
            throw new ApiError(404, "Channel not found")
        }
        return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
                
    })

    const getWatchHistory = asyncHandler(async (req, res) => {
        const user = await User.aggregate([
            {
                $match: {
                    //use moongoose id to design match
                    _id: new moongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",

                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    },
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner:{
                                    $first: "$owner"
                                }
                        }
                    }
                        
                    ]
                }
            },
            
        ])

        return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
    })

    // const getUserChannelProfile = asyncHandler(async (req, res) => {})

    // const getUserChannelProfile = asyncHandler(async (req, res) => {})


    export{
        registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
    }