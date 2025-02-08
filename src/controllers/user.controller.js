import { asyncHandler1 } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const registerUser = asyncHandler1(async (req, res) => {
  // get user details
  const { username, email, fullname, password } = req.body;
  console.log(username, email, fullname, password);

  // validate - not empty
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check is user exists- username & email
  const ExistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (ExistedUser) throw new ApiError(409, "User already exists");

  // check for imgs and avatar
  console.log(req.files); // check multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) throw new ApiError(407, "Avatar File is missing");

  // cloudinary
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded Avatar", avatar);
  } catch (error) {
    console.log("error uploading avatar", error);
    throw new ApiError(500, "failed to upload avatar");
  }

  let coverImage;
  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverLocalPath);
      console.log("Uploaded coverImg", coverImage);
    } catch (error) {
      console.log("error uploading coverImg", error);
      throw new ApiError(500, "failed to upload coverImg");
    }
  }

  try {
    // create entry in db
    const user = await User.create({
      email,
      fullname,
      password,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    // remove password and refresh token from respond
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) throw new ApiError(500, "Couldn't Register User");

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User Registered Successfully!"));
  } 
  catch (error) {
    console.log("User creation failed");
    if (avatar) {
      deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, "Couldn't Register User, images deleted");
  }
});

export { registerUser };
