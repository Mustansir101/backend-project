// checks if API is up and running, creates endpoint
// AWS and others load balancer depends on this

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler1 } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler1(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "OK", "Health Check passed"));
});

export { healthcheck };
