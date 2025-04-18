// Service layer for user-related operations (profile updates, etc.)
import User from "../models/userModel.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo } from "../utils/logger.js";

/**
 * Updates a user's profile information (name, email).
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - The data to update (e.g., { name, email }).
 * @returns {Promise<User>} The updated user object.
 * @throws {AppError} If attempting to update password or validation fails.
 */
export const updateUserProfile = async (userId, updateData) => {
  // 1) Prevent password updates via this route
  if (updateData.password || updateData.passwordConfirm) {
    throw errorTypes.badRequest(
      "This route is not for password updates. Please use /change-password."
    );
  }

  // 2) Filter out unwanted fields explicitly
  const filteredBody = {};
  const allowedFields = ["name", "email"];
  Object.keys(updateData).forEach((field) => {
    if (allowedFields.includes(field)) {
      filteredBody[field] = updateData[field];
    }
  });

  if (Object.keys(filteredBody).length === 0) {
    throw errorTypes.badRequest("No valid fields provided for update.");
  }

  // 3) Update user document
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
      new: true, // Return the updated document
      runValidators: true, // Ensure model validations run
    });

    if (!updatedUser) {
      throw errorTypes.notFound("User not found for update.");
    }

    logInfo("User profile updated via UserService", { userId });
    return updatedUser;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      throw errorTypes.badRequest(
        error.message || "Invalid profile data provided"
      );
    }
    // Re-throw other errors (like DB connection issues)
    throw error;
  }
};
