// Service layer for authentication-related business logic
import User from "../models/userModel.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logDebug, logError } from "../utils/logger.js";
import crypto from "crypto";

/**
 * Registers a new user.
 * @param {object} userData - User data (name, email, password, passwordConfirm).
 * @returns {Promise<User>} The newly created user object.
 * @throws {AppError} If email is already in use or validation fails.
 */
export const registerUser = async (userData) => {
  const { name, email, password, passwordConfirm } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logDebug("Registration attempt failed: Email already in use", { email });
    throw errorTypes.badRequest("Email already in use", "EMAIL_IN_USE");
  }

  // Create new user (validation happens in the model)
  try {
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });
    logInfo("New user registered via AuthService", {
      userId: newUser._id,
      email: newUser.email,
    });
    return newUser;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      // Extract validation messages if needed, or re-throw a generic bad request
      logDebug("Registration failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid user data provided"
      );
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Logs in a user.
 * @param {object} credentials - Login credentials (email, password).
 * @returns {Promise<User>} The authenticated user object.
 * @throws {AppError} If credentials are missing, user not found, or password incorrect.
 */
export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Check if email and password exist
  if (!email || !password) {
    throw errorTypes.badRequest("Please provide email and password");
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    logDebug("Failed login attempt: Incorrect email or password", { email });
    throw errorTypes.unauthorized("Incorrect email or password");
  }

  logInfo("User logged in via AuthService", {
    userId: user._id,
    email: user.email,
  });

  return user;
};

/**
 * Handles the forgot password request.
 * Finds user by email and generates a password reset token.
 * @param {string} email - The user's email address.
 * @returns {Promise<string>} The unhashed password reset token.
 * @throws {AppError} If user not found.
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Log the attempt but throw a specific error the controller can handle gracefully
    // (don't reveal if the user exists)
    logDebug("Password reset request failed: User not found", { email });
    throw errorTypes.notFound("User not found"); // Or a generic success message could be sent by controller
  }

  // Generate the random reset token (method is on the model)
  const resetToken = user.createPasswordResetToken();

  try {
    // Save the user with the reset token and expiry (disable validation for this save)
    await user.save({ validateBeforeSave: false });
    logInfo("Password reset token generated via AuthService", {
      userId: user._id,
    });
    return resetToken; // Return the unhashed token to be sent (e.g., via email)
  } catch (dbError) {
    // Clear fields if save fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Attempt to save again to clear fields, ignore secondary error if it occurs
    try {
      await user.save({ validateBeforeSave: false });
    } catch (secondaryError) {
      logError("Failed to clear reset token after initial save error", {
        userId: user._id,
        error: secondaryError,
      });
    }
    logError("Database error saving password reset token", {
      userId: user._id,
      error: dbError,
    });
    throw errorTypes.internal("Failed to process password reset request.");
  }
};

/**
 * Resets the user's password using a valid reset token.
 * @param {string} token - The unhashed password reset token.
 * @param {string} newPassword - The new password.
 * @param {string} passwordConfirm - The confirmation of the new password.
 * @returns {Promise<User>} The updated user object.
 * @throws {AppError} If token is invalid/expired or password validation fails.
 */
export const resetUserPassword = async (
  token,
  newPassword,
  passwordConfirm
) => {
  // 1) Get user based on the hashed token and expiry
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Check expiry
  });

  // 2) Check if user exists and token is valid
  if (!user) {
    throw errorTypes.badRequest("Token is invalid or has expired");
  }

  // 3) Set new password (validation happens on save)
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined; // Clear reset fields
  user.passwordResetExpires = undefined;

  try {
    // 4) Save the user (triggers validation and password hashing middleware)
    await user.save();
    logInfo("User password reset via AuthService", { userId: user._id });
    return user;
  } catch (error) {
    // Handle Mongoose validation errors (e.g., password mismatch, length)
    if (error.name === "ValidationError") {
      throw errorTypes.badRequest(error.message || "Invalid password data");
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Validates a password reset token without performing the actual reset.
 * @param {string} token - The unhashed password reset token.
 * @returns {Promise<boolean>} True if token is valid and not expired.
 * @throws {AppError} If token is invalid or expired.
 */
export const validateResetToken = async (token) => {
  // Hash the token to match against stored hashed version
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Check expiry
  });

  // Check if user exists and token is valid
  if (!user) {
    throw errorTypes.badRequest("Token is invalid or has expired");
  }

  logDebug("Reset token validated successfully", { userId: user._id });
  return true;
};

/**
 * Changes the password for an authenticated user.
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password.
 * @param {string} passwordConfirm - Confirmation of the new password.
 * @returns {Promise<User>} The updated user object.
 * @throws {AppError} If current password incorrect or validation fails.
 */
export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword,
  passwordConfirm
) => {
  // 1) Get user, ensuring password field is selected
  const user = await User.findById(userId).select("+password");
  if (!user) {
    // Should not happen if called after 'protect' middleware, but good practice
    throw errorTypes.notFound("User not found");
  }

  // 2) Check if current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    throw errorTypes.badRequest("Your current password is incorrect");
  }

  // 3) Set new password (validation happens on save)
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;

  try {
    // 4) Save the user (triggers validation and password hashing middleware)
    await user.save();
    logInfo("User password changed via AuthService", { userId });
    // Note: User object returned here might not have password selected depending on schema defaults
    // If controller needs user object after save, re-fetch or adjust select behavior.
    // For now, just return the user object we have (without password field).
    user.password = undefined; // Explicitly remove before returning
    return user;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      throw errorTypes.badRequest(error.message || "Invalid password data");
    }
    // Re-throw other errors
    throw error;
  }
};
