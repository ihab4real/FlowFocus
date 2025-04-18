import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logError, logDebug } from "../utils/logger.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService.js";
import {
  registerUser,
  loginUser,
  changeUserPassword,
  requestPasswordReset,
  resetUserPassword,
} from "../services/authService.js";
import { updateUserProfile } from "../services/userService.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

// Helper function to set refresh token cookie
const sendRefreshTokenCookie = (res, refreshToken) => {
  // Determine cookie expiration based on refresh token expiry
  // Example: Extract expiry from env var '7d' -> 7 days in ms
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  let maxAge;
  if (expiresIn.endsWith("d")) {
    maxAge = parseInt(expiresIn, 10) * 24 * 60 * 60 * 1000;
  } else if (expiresIn.endsWith("h")) {
    maxAge = parseInt(expiresIn, 10) * 60 * 60 * 1000;
  } else {
    maxAge = 7 * 24 * 60 * 60 * 1000; // Default to 7 days
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    sameSite: "strict", // Mitigate CSRF
    maxAge: maxAge, // Expires with the refresh token
    // path: '/api/auth', // Optional: Scope cookie to auth routes if needed
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  // Call the service to handle registration logic
  const newUser = await registerUser(req.body);

  // Generate tokens
  const accessToken = generateAccessToken(newUser._id);
  const refreshToken = generateRefreshToken(newUser._id);

  // Set refresh token in HTTP-only cookie
  sendRefreshTokenCookie(res, refreshToken);

  // Prepare user data for response
  newUser.password = undefined;

  // Send access token and user data in response body
  res.status(201).json({
    status: "success",
    token: accessToken,
    data: {
      user: newUser,
    },
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  // Call the service to handle login logic
  const user = await loginUser(req.body);

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set refresh token in HTTP-only cookie
  sendRefreshTokenCookie(res, refreshToken);

  // Prepare user data for response
  user.password = undefined;

  // Send access token and user data in response body
  res.status(200).json({
    status: "success",
    token: accessToken,
    data: {
      user,
    },
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
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
 * @route PATCH /api/auth/update-profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  // req.user is attached by the 'protect' middleware
  const userId = req.user.id;
  const updateData = req.body;

  const updatedUser = await updateUserProfile(userId, updateData);

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Change password
 * @route PATCH /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, password, passwordConfirm } =
    req.body;

  // Call service to handle password change logic
  const updatedUser = await changeUserPassword(
    userId,
    currentPassword,
    password,
    passwordConfirm
  );

  // Issue new tokens upon successful password change
  const accessToken = generateAccessToken(updatedUser._id);
  const refreshToken = generateRefreshToken(updatedUser._id);
  sendRefreshTokenCookie(res, refreshToken);

  // Prepare user data (service already removed password)
  res.status(200).json({
    status: "success",
    token: accessToken,
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw errorTypes.badRequest("Please provide an email address.");
  }

  try {
    // 1. Request password reset token from authService
    // This returns the unhashed token if user exists, throws error otherwise
    const user = await User.findOne({ email }); // Need user object for name
    if (!user) {
       // User not found, log and send generic response
       logDebug("Password reset request for non-existent user", { email });
    } else {
        // User found, proceed to generate token and send email
        const resetToken = await requestPasswordReset(email);

        // 2. Send the email using emailService
        await sendPasswordResetEmail(user.email, user.name, resetToken);

        logInfo("Password reset email initiated successfully", { email });
    }

    // 3. Always send a generic success response
    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });

  } catch (error) {
    // Log errors from requestPasswordReset or sendPasswordResetEmail
    logError("Error during password reset process", { email, error: error.message });

    // Still send a generic success response to prevent enumeration
    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }
});

/**
 * Reset password
 * @route PATCH /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    throw errorTypes.badRequest("Please provide new password and confirmation.");
  }

  // Call service to handle password reset logic
  const user = await resetUserPassword(token, password, passwordConfirm);

  // Issue new tokens after successful reset
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  sendRefreshTokenCookie(res, refreshToken);

  // Prepare response data (service already removed password)
  res.status(200).json({
    status: "success",
    token: accessToken,
    data: {
      user,
    },
  });
});

/**
 * Refresh access token using refresh token from cookie
 * @route POST /api/auth/refresh
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw errorTypes.unauthorized("Refresh token not found");
  }

  try {
    // 1. Verify the refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // 2. Find user based on decoded token ID
    const user = await User.findById(decoded.id);

    // 3. Check if user exists and is active
    // Note: User model's pre-find middleware already filters for active: true
    if (!user) {
      throw errorTypes.unauthorized("User belonging to this token no longer exists");
    }

    // Optional: Add check for password change after refresh token issued if needed
    // This adds complexity; often handled by shorter refresh token lifespans
    // or simply requiring re-login after password change.

    // 4. Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // 5. Send new access token in response
    res.status(200).json({
      status: "success",
      token: newAccessToken,
    });
  } catch (error) {
    // Handle specific JWT errors (expired, invalid signature)
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      logDebug("Refresh token verification failed", { error: error.message });
      // Clear potentially invalid cookie
      res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });
      throw errorTypes.unauthorized("Invalid or expired refresh token");
    }
    // Re-throw other errors
    throw error;
  }
});

/**
 * Logout user by clearing refresh token cookie
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear the refresh token cookie
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Set expiry to past date
  });

  res.status(200).json({ status: "success", message: "Logged out successfully" });
});
