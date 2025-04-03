import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logError, logDebug } from "../utils/logger.js";

// Helper function to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw errorTypes.badRequest("Email already in use", "EMAIL_IN_USE");
  }

  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  logInfo("New user registered", { userId: newUser._id, email: newUser.email });

  // Sign token and send response
  createSendToken(newUser, 201, res);
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    throw errorTypes.badRequest("Please provide email and password");
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    logDebug("Failed login attempt", { email });
    throw errorTypes.unauthorized("Incorrect email or password");
  }

  logInfo("User logged in", { userId: user._id, email: user.email });

  // If everything is ok, send token to client
  createSendToken(user, 200, res);
});

/**
 * Restrict access to certain roles
 * @param  {...String} roles - Roles allowed to access the route
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      throw errorTypes.forbidden(
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};

/**
 * Get current user profile
 * @route GET /api/users/me
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

/**
 * Update user profile
 * @route PATCH /api/users/update-profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  // 1) Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    throw errorTypes.badRequest(
      "This route is not for password updates. Please use /change-password."
    );
  }

  // 2) Filter out unwanted fields that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = ["name", "email"];
  Object.keys(req.body).forEach((field) => {
    if (allowedFields.includes(field)) {
      filteredBody[field] = req.body[field];
    }
  });

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  logInfo("User profile updated", { userId: updatedUser._id });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Change password
 * @route PATCH /api/users/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    throw errorTypes.badRequest("Your current password is incorrect");
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  logInfo("User changed password", { userId: user._id });

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw errorTypes.notFound("There is no user with that email address");
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // In a real application, you would send an email here
    // For now, we'll just return the token in the response
    logInfo("Password reset token generated", { userId: user._id });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
      // In a real app, you would NOT include this in the response
      // This is just for development purposes
      resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logError("Error sending password reset email", { error: err.message });
    throw errorTypes.internal(
      "There was an error sending the email. Try again later!"
    );
  }
});

/**
 * Reset password
 * @route PATCH /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    throw errorTypes.badRequest("Token is invalid or has expired");
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logInfo("User reset password", { userId: user._id });

  // 3) Update changedPasswordAt property for the user
  // This is handled by a pre-save middleware

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
