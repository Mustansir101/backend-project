import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"; // else issue happens
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// uploading
const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    console.log("file uploaded on cloudinary!", response.url);
    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    console.log("Error on Cloudinary", error);
    // del locally saved temp file as upload failed
    fs.unlinkSync(localfilepath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("deleted from cloudinary", result);
  } catch (error) {
    console.log("error deleting from cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
