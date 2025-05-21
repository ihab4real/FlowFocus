import jwt from "jsonwebtoken";

/**
 * Verifies a JWT token (could be access or refresh token).
 * This is a synchronous version used for socket authentication.
 * @param {string} token - The token to verify.
 * @param {boolean} isRefreshToken - Whether this is a refresh token.
 * @returns {object|null} The decoded payload if verification is successful, or null if it fails.
 */
export const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        `JWT ${isRefreshToken ? "refresh " : ""}secret is not defined in environment variables.`
      );
      return null;
    }

    return jwt.verify(token, secret);
  } catch (error) {
    console.error(`Token verification failed: ${error.message}`);
    return null;
  }
};

/**
 * Extracts the JWT token from an Authorization header.
 * @param {string} authHeader - The Authorization header value.
 * @returns {string|null} - The token if present and valid format, or null.
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};
