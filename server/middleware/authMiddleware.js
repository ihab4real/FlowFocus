import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import { verifyAccessToken } from "../services/tokenService.js";
import { logDebug } from "../utils/logger.js";

/**
 * Protect routes - middleware to check if user is authenticated via Access Token
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1) Get token from Authorization header and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw errorTypes.unauthorized(
      "You are not logged in. Please log in to get access."
    );
  }

  try {
    // 2) Verify access token using the service
    const decoded = await verifyAccessToken(token);

    // 3) Check if user associated with the token still exists
    // Note: User model's pre-find middleware already filters for active: true
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw errorTypes.unauthorized(
        "The user belonging to this token no longer exists."
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    // Handle specific JWT errors forwarded from verifyAccessToken
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      logDebug("Access token verification failed", { error: error.message });
      const message = error.name === "TokenExpiredError" ? "Your session has expired. Please log in again." : "Invalid session. Please log in again.";
      throw errorTypes.unauthorized(message);
    }
    // Re-throw other errors
    throw error;
  }
});

/**
 * Restrict access to certain roles
 * @param  {...String} roles - Roles allowed to access the route
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'user']
    // Assumes protect middleware has already run and attached req.user
    if (!req.user || !roles.includes(req.user.role)) {
      throw errorTypes.forbidden(
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};
