import { errorTypes } from "../utils/AppError.js";

/**
 * Validates create habit request data
 */
export const validateCreateHabit = (req, res, next) => {
  const { name, category, type, targetValue, unit } = req.body;

  if (!name) {
    throw errorTypes.badRequest("Habit name is required");
  }

  // Name should not be just whitespace
  if (name.trim() === "") {
    throw errorTypes.badRequest("Habit name cannot be empty");
  }

  // If category is provided, it should be valid
  if (
    category &&
    !["Health", "Productivity", "Learning", "Wellness", "Custom"].includes(
      category
    )
  ) {
    throw errorTypes.badRequest(
      "Category must be one of: Health, Productivity, Learning, Wellness, Custom"
    );
  }

  // If type is provided, it should be valid
  if (type && !["count", "time", "simple"].includes(type)) {
    throw errorTypes.badRequest("Type must be one of: count, time, simple");
  }

  // If targetValue is provided, it should be positive
  if (targetValue !== undefined && (isNaN(targetValue) || targetValue <= 0)) {
    throw errorTypes.badRequest("Target value must be a positive number");
  }

  // If unit is provided, it should not be empty
  if (unit !== undefined && unit.trim() === "") {
    throw errorTypes.badRequest("Unit cannot be empty");
  }

  next();
};

/**
 * Validates update habit request data
 * Less strict than create validation - only validates fields that are present
 */
export const validateUpdateHabit = (req, res, next) => {
  const { name, category, type, targetValue, unit, isActive } = req.body;

  // If name is provided, it shouldn't be empty
  if (name !== undefined && name.trim() === "") {
    throw errorTypes.badRequest("Habit name cannot be empty");
  }

  // If category is provided, it should be valid
  if (
    category !== undefined &&
    !["Health", "Productivity", "Learning", "Wellness", "Custom"].includes(
      category
    )
  ) {
    throw errorTypes.badRequest(
      "Category must be one of: Health, Productivity, Learning, Wellness, Custom"
    );
  }

  // If type is provided, it should be valid
  if (type !== undefined && !["count", "time", "simple"].includes(type)) {
    throw errorTypes.badRequest("Type must be one of: count, time, simple");
  }

  // If targetValue is provided, it should be positive
  if (targetValue !== undefined && (isNaN(targetValue) || targetValue <= 0)) {
    throw errorTypes.badRequest("Target value must be a positive number");
  }

  // If unit is provided, it should not be empty
  if (unit !== undefined && unit.trim() === "") {
    throw errorTypes.badRequest("Unit cannot be empty");
  }

  // If isActive is provided, it should be boolean
  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw errorTypes.badRequest("isActive must be a boolean value");
  }

  next();
};

/**
 * Validates habit entry request data
 */
export const validateHabitEntry = (req, res, next) => {
  const { habitId, date, currentValue, completed } = req.body;

  if (!habitId) {
    throw errorTypes.badRequest("Habit ID is required");
  }

  if (!date) {
    throw errorTypes.badRequest("Date is required");
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw errorTypes.badRequest("Date must be in YYYY-MM-DD format");
  }

  // If currentValue is provided, it should be non-negative
  if (currentValue !== undefined && (isNaN(currentValue) || currentValue < 0)) {
    throw errorTypes.badRequest("Current value must be a non-negative number");
  }

  // If completed is provided, it should be boolean
  if (completed !== undefined && typeof completed !== "boolean") {
    throw errorTypes.badRequest("Completed must be a boolean value");
  }

  next();
};

/**
 * Validates batch update entries request data
 */
export const validateBatchEntries = (req, res, next) => {
  const { entries } = req.body;

  if (!entries) {
    throw errorTypes.badRequest("Entries array is required");
  }

  if (!Array.isArray(entries)) {
    throw errorTypes.badRequest("Entries must be an array");
  }

  if (entries.length === 0) {
    throw errorTypes.badRequest("Entries array cannot be empty");
  }

  // Validate each entry
  for (const [index, entry] of entries.entries()) {
    if (!entry.habitId) {
      throw errorTypes.badRequest(`Entry ${index + 1}: Habit ID is required`);
    }

    if (!entry.date) {
      throw errorTypes.badRequest(`Entry ${index + 1}: Date is required`);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(entry.date)) {
      throw errorTypes.badRequest(
        `Entry ${index + 1}: Date must be in YYYY-MM-DD format`
      );
    }

    // If currentValue is provided, it should be non-negative
    if (
      entry.currentValue !== undefined &&
      (isNaN(entry.currentValue) || entry.currentValue < 0)
    ) {
      throw errorTypes.badRequest(
        `Entry ${index + 1}: Current value must be a non-negative number`
      );
    }

    // If completed is provided, it should be boolean
    if (entry.completed !== undefined && typeof entry.completed !== "boolean") {
      throw errorTypes.badRequest(
        `Entry ${index + 1}: Completed must be a boolean value`
      );
    }
  }

  next();
};
