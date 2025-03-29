/**
 * Custom error class for application-specific errors
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error (expected) or a programming error (unexpected)
   * @param {string} errorCode - Optional error code for client reference
   */
  constructor(message, statusCode = 500, isOperational = true, errorCode = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory function to create common error types
 */
const errorTypes = {
  // 400 - Bad Request
  badRequest: (message = "Bad request", errorCode = "BAD_REQUEST") =>
    new AppError(message, 400, true, errorCode),

  // 401 - Unauthorized
  unauthorized: (message = "Unauthorized access", errorCode = "UNAUTHORIZED") =>
    new AppError(message, 401, true, errorCode),

  // 403 - Forbidden
  forbidden: (message = "Forbidden access", errorCode = "FORBIDDEN") =>
    new AppError(message, 403, true, errorCode),

  // 404 - Not Found
  notFound: (message = "Resource not found", errorCode = "NOT_FOUND") =>
    new AppError(message, 404, true, errorCode),

  // 409 - Conflict
  conflict: (message = "Resource conflict", errorCode = "CONFLICT") =>
    new AppError(message, 409, true, errorCode),

  // 422 - Unprocessable Entity
  validationError: (
    message = "Validation failed",
    errorCode = "VALIDATION_ERROR"
  ) => new AppError(message, 422, true, errorCode),

  // 500 - Internal Server Error
  internal: (message = "Internal server error", errorCode = "INTERNAL_ERROR") =>
    new AppError(message, 500, true, errorCode),

  // Programming errors (not operational)
  programming: (message = "Something went wrong") =>
    new AppError(message, 500, false, "PROGRAMMING_ERROR"),
};

export { AppError, errorTypes };
