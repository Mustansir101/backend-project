import { asyncHandler1 } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// 87654321

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went Wrong while generating tokens");
  }
};

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
  } catch (error) {
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

const loginUser = asyncHandler1(async (req, res) => {
  // get data from body
  const { email, username, password } = req.body;
  console.log(req.body);
  // validation
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) throw new ApiError(404, "User not found");

  // validate password
  const isPassValid = await user.isPasswordCorrect(password);
  if (!isPassValid) throw new ApiError(401, "incorrect password");

  // tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedUser) throw new ApiError(401, "Could not login");

  const options = {
    httpOnly: true, // makes cookie non-modifiable by user
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedUser, "User Logged in Successfully")); //or u can send tokens as response as well
});

const logoutUser = asyncHandler1(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged out Successfully"));
});

const refreshAccessToken = asyncHandler1(async (req, res) => {
  //for both web and mobile
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Refresh Token required");

  // decode this token to get _id
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid Refresh token");

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token Expired");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Tokens Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went Wrong while refreshing tokens");
  }
});

// CRUD operations
const changeCurrentPassword = asyncHandler1(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPassValid = await user.isPasswordCorrect(oldPassword);
  if (!isPassValid) throw new ApiError(401, "Incorrect Password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, "Password Changed"));
});

const getCurrentUser = asyncHandler1(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Details"));
});

const updateAccountDetails = asyncHandler1(async (req, res) => {
  const { username, fullname } = req.body;

  if (!username || !fullname) {
    throw new ApiError(401, "fullname and username are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        username: username,
        fullname: fullname,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated successfully"));
});

const updateAvatar = asyncHandler1(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(401, "Avatar File is missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new ApiError(500, "failed to upload avatar");

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, "Avatar updated"));
});

const updateCoverImage = asyncHandler1(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) throw new ApiError(401, "coverImg File is missing");

  const cover = await uploadOnCloudinary(coverLocalPath);
  if (!cover.url) throw new ApiError(500, "failed to upload avatar");

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: cover.url,
      },
    },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, "cover Image updated"));
});

// Mongo Aggregation Pipelines
const getUserChannelProfile = asyncHandler1(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "Username is required");

  // stage 1: find user
  // stage 2: local-User, get Subscriber base as array of object in User
  // stage 3: get all channels I have subscribed to as array of object in User
  // stage 4: and new field to User, that shows size of the 2 arrays
  // stage 5: project (projection) necessary data
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        ChannelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // checks if you are subscribed to your own channel, basically logged in
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        ChannelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  // channel is an array
  if (!channel?.length) throw new ApiError(404, "Channel not found");

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Profile Fetched !"));
});

const getWatchHistory = asyncHandler1(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(req.user?._id)),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "WatchedVideos",
        pipeline: [
          // get owner of video
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
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ["$owner", 0],
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0]?.WatchedVideos, "watch history fetched !!")
    );
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
