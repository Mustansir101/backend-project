import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler1 } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler1(async (req, res, next) => {
  const token =
    req.cookies.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Refresh Token required");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id)?.select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "Unauthorized");

    // add new paramater to request
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid Access Token");
  }
});
