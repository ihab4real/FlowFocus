import { logError, logInfo, logDebug } from "../utils/logger.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";

/**
 * Example controller to demonstrate error handling
 * Shows how to use asyncHandler and AppError in practice
 */

// Example of a controller function that might throw an error
const getResource = asyncHandler(async (req, res) => {
  // Simulate fetching a resource
  const resourceId = req.params.id;
  logDebug("Attempting to fetch resource", { resourceId });

  // Example: Validate input
  if (!resourceId) {
    logError("Resource ID missing in request");
    throw errorTypes.badRequest("Resource ID is required");
  }

  // Example: Resource not found scenario
  if (resourceId === "999") {
    logWarn("Resource not found", { resourceId });
    throw errorTypes.notFound(`Resource with ID ${resourceId} not found`);
  }

  // Example: Unauthorized access scenario
  if (resourceId === "888") {
    logWarn("Unauthorized access attempt", { resourceId });
    throw errorTypes.unauthorized(
      "You are not authorized to access this resource"
    );
  }

  // Example: Server error scenario
  if (resourceId === "777") {
    logError("Database connection failed", { resourceId });
    throw errorTypes.internal("Database connection failed");
  }

  // Example: Validation error
  if (resourceId === "666") {
    logWarn("Invalid resource format", { resourceId });
    throw errorTypes.validationError("Invalid resource format");
  }

  // Success case
  const responseData = {
    id: resourceId,
    name: `Example Resource ${resourceId}`,
    createdAt: new Date().toISOString(),
  };

  logInfo("Resource retrieved successfully", { resourceId, ...responseData });

  res.status(200).json({
    status: "success",
    data: responseData,
  });
});

// Example of a controller function with a programming error
const createResource = asyncHandler(async (req, res) => {
  const { name } = req.body;
  logDebug("Attempting to create resource", { name });

  // Example: Validate input
  if (!name) {
    logError("Name missing in request", { body: req.body });
    throw errorTypes.badRequest("Name is required");
  }

  // Example: Simulate a programming error (accessing undefined property)
  // This will be caught by asyncHandler and passed to the error middleware
  if (name === "trigger-error") {
    logDebug("Triggering simulated programming error", { name });
    // This will cause a programming error
    const undefinedObject = undefined;
    undefinedObject.someProperty = "This will throw an error";
  }

  // Success case
  const newResource = {
    id: Math.floor(Math.random() * 1000),
    name,
    createdAt: new Date().toISOString(),
  };

  logInfo("Resource created successfully", { ...newResource });

  res.status(201).json({
    status: "success",
    data: newResource,
  });
});

export { getResource, createResource };
