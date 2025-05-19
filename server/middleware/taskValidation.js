import { errorTypes } from "../utils/AppError.js";

/**
 * Validates create task request data
 */
export const validateCreateTask = (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    throw errorTypes.badRequest("Task title is required");
  }

  // Title should not be just whitespace
  if (title.trim() === "") {
    throw errorTypes.badRequest("Task title cannot be empty");
  }

  next();
};

/**
 * Validates update task request data
 * Less strict than create validation - only validates fields that are present
 */
export const validateUpdateTask = (req, res, next) => {
  const { title, status, priority } = req.body;

  // If title is provided, it shouldn't be empty
  if (title !== undefined && title.trim() === "") {
    throw errorTypes.badRequest("Task title cannot be empty");
  }

  // If status is provided, it should be valid
  if (status !== undefined && !["Todo", "Doing", "Done"].includes(status)) {
    throw errorTypes.badRequest("Status must be one of: Todo, Doing, Done");
  }

  // If priority is provided, it should be valid
  if (priority !== undefined && !["Low", "Medium", "High"].includes(priority)) {
    throw errorTypes.badRequest("Priority must be one of: Low, Medium, High");
  }

  next();
};

/**
 * Validates move task request data
 */
export const validateMoveTask = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    throw errorTypes.badRequest("Status is required");
  }

  if (!["Todo", "Doing", "Done"].includes(status)) {
    throw errorTypes.badRequest("Status must be one of: Todo, Doing, Done");
  }

  next();
};
