import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';
import  dotenv from 'dotenv';

dotenv.config();

//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    // secure: true //use https
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
            const response = await cloudinary.uploader.upload(
                localFilePath,{
                    resource_type:"auto"
                }
            )
            console.log("File uploaded on Cloudinary File src:", +response.url);
        //once the file is uploaded, delete it from local server
        fs.unlinkSync(localFilePath); //delete the file from local storage
        return response.url; //return the url of the uploaded file
    }catch (error) {
        console.log("Error uploading file to Cloudinary:", error);
        fs.unlinkSync(localFilePath); //delete the file from local storage
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
       const result = cloudinary.uploader.destroy(publicId)
       console.log("File deleted from Cloudinary:", publicId);
       
    } catch (error) {
        console.log("Error deleting file from Cloudinary:", error);
        return null;
        
    }
}
export {uploadOnCloudinary,deleteFromCloudinary};