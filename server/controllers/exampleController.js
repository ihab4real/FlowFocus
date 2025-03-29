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

  // Example: Validate input
  if (!resourceId) {
    throw errorTypes.badRequest("Resource ID is required");
  }

  // Example: Resource not found scenario
  if (resourceId === "999") {
    throw errorTypes.notFound(`Resource with ID ${resourceId} not found`);
  }

  // Example: Unauthorized access scenario
  if (resourceId === "888") {
    throw errorTypes.unauthorized(
      "You are not authorized to access this resource"
    );
  }

  // Example: Server error scenario
  if (resourceId === "777") {
    throw errorTypes.internal("Database connection failed");
  }

  // Example: Validation error
  if (resourceId === "666") {
    throw errorTypes.validationError("Invalid resource format");
  }

  // Success case
  res.status(200).json({
    status: "success",
    data: {
      id: resourceId,
      name: `Example Resource ${resourceId}`,
      createdAt: new Date().toISOString(),
    },
  });
});

// Example of a controller function with a programming error
const createResource = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Example: Validate input
  if (!name) {
    throw errorTypes.badRequest("Name is required");
  }

  // Example: Simulate a programming error (accessing undefined property)
  // This will be caught by asyncHandler and passed to the error middleware
  if (name === "trigger-error") {
    // This will cause a programming error
    const undefinedObject = undefined;
    undefinedObject.someProperty = "This will throw an error";
  }

  // Success case
  res.status(201).json({
    status: "success",
    data: {
      id: Math.floor(Math.random() * 1000),
      name,
      createdAt: new Date().toISOString(),
    },
  });
});

export { getResource, createResource };
