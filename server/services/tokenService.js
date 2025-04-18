import jwt from "jsonwebtoken";

/**
 * Generates a JWT access token for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {string} The generated JWT access token.
 */
export const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new Error(
      "JWT secret or expiration time is not defined in environment variables."
    );
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Generates a JWT refresh token for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {string} The generated JWT refresh token.
 */
export const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_REFRESH_EXPIRES_IN) {
    throw new Error(
      "JWT refresh secret or expiration time is not defined in environment variables."
    );
  }
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT access token.
 * @param {string} token - The access token to verify.
 * @returns {Promise<object>} The decoded payload if verification is successful.
 * @throws {Error} If verification fails (e.g., invalid signature, expired).
 */
export const verifyAccessToken = async (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not defined in environment variables.");
  }
  try {
    // jwt.verify is synchronous if no callback is provided, wrap in promise for consistency
    // or handle potential errors directly
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    // Let the caller handle specific JWT errors (TokenExpiredError, JsonWebTokenError)
    throw error;
  }
};

/**
 * Verifies a JWT refresh token.
 * @param {string} token - The refresh token to verify.
 * @returns {Promise<object>} The decoded payload if verification is successful.
 * @throws {Error} If verification fails (e.g., invalid signature, expired).
 */
export const verifyRefreshToken = async (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT refresh secret is not defined in environment variables."
    );
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
};
