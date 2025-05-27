import { AppError } from "../utils/AppError.js";
import { logError, logWarn, logInfo } from "../utils/logger.js";

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler middleware
 * Provides different responses based on environment and error type
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error with appropriate level based on status code
  const logContext = {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    status: err.status,
    isOperational: err.isOperational,
    stack:
      process.env.NODE_ENV === "production"
        ? "Hidden in production"
        : err.stack,
    request: {
      method: req.method,
      path: req.path,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  };

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 422, true, "VALIDATION_ERROR");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new AppError(message, 409, true, "DUPLICATE_ERROR");
  }

  // Mongoose CastError (invalid ID)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400, true, "INVALID_ID");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError(
      "Invalid token. Please log in again.",
      401,
      true,
      "INVALID_TOKEN"
    );
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError(
      "Your token has expired. Please log in again.",
      401,
      true,
      "EXPIRED_TOKEN"
    );
  }

  // Determine if this is an operational error (expected) or programming error (unexpected)
  const isOperational =
    error.isOperational !== undefined ? error.isOperational : true;

  // Set status code
  const statusCode = error.statusCode || res.statusCode || 500;

  // Log error with appropriate level based on final status code
  if (statusCode >= 500) {
    logError("Server Error", logContext);
  } else if (statusCode >= 400) {
    logWarn("Client Error", logContext);
  } else {
    logInfo("Request Error", logContext);
  }

  // Create response based on environment
  const errorResponse = {
    status: error.status || "error",
    message: error.message || "Something went wrong",
    ...(error.errorCode && { code: error.errorCode }),
  };

  // Add additional details in development environment
  if (process.env.NODE_ENV !== "production") {
    if (!isOperational) {
      errorResponse.error = err;
    }
    errorResponse.stack = err.stack;

    // Add request details in development for easier debugging
    errorResponse.request = {
      method: req.method,
      path: req.path,
      body: req.body,
      params: req.params,
      query: req.query,
    };
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

export { notFoundHandler, errorHandler };
