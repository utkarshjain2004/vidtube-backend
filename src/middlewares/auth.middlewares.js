import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async (req, _, next) => {

    const token = req.cookies.accessToken || req.headers("Authorization")?.replace("Bearer ", "");

    if(!token){
        throw new ApiError(401, "Access denied, Unauthorized token is missing");
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

       if(!user){
        throw new ApiError(404, "User not found, Invalid token");
       }

       req.user = user
       next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token, Access denied");
    }
})