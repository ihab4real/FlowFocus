// Service layer for OAuth-related business logic
import { generateAccessToken, generateRefreshToken } from "./tokenService.js";
import { logInfo, logError, logDebug } from "../utils/logger.js";

/**
 * Handle OAuth authentication success
 * This is called after a successful OAuth authentication
 * @param {Object} user - The authenticated user
 * @returns {Object} - Access token and user data
 */
export const handleOAuthSuccess = async (user) => {
  try {
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return tokens and user data
    return {
      accessToken,
      refreshToken,
      user,
    };
  } catch (error) {
    logError("Error handling OAuth success", {
      userId: user?._id,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Processes a user profile received from an OAuth provider
 * Used for testing and consistency between different OAuth strategies
 * @param {string} provider - The OAuth provider (google, github)
 * @param {Object} profile - The user profile from the OAuth provider
 * @returns {Object} - Processed profile data
 */
export const processOAuthProfile = (provider, profile) => {
  let userData = {
    provider,
    providerId: profile.id,
  };

  // Extract email
  if (profile.emails && profile.emails.length > 0) {
    userData.email = profile.emails[0].value;
  }

  // Extract name based on provider
  switch (provider) {
    case "google":
      userData.name =
        profile.displayName ||
        (profile.name
          ? `${profile.name.givenName} ${profile.name.familyName}`
          : "Google User");
      break;
    case "github":
      userData.name = profile.displayName || profile.username || "GitHub User";
      break;
    default:
      userData.name = profile.displayName || "OAuth User";
  }

  logDebug("Processed OAuth profile", { provider, profileId: profile.id });
  return userData;
};
