import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import {
  getUserHabits,
  getUserHabitById,
  createUserHabit,
  updateUserHabit,
  deleteUserHabit,
  getHabitEntries,
  getTodayHabitEntries,
  logHabitEntry,
  updateHabitEntry,
  deleteHabitEntry,
} from "../services/habitService.js";

/**
 * Create a new habit
 * @route POST /api/habits
 */
const createHabit = asyncHandler(async (req, res) => {
  const habit = await createUserHabit(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: habit,
  });
});

/**
 * Get all habits for the authenticated user
 * @route GET /api/habits
 */
const getHabits = asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const filters = {};

  if (category) filters.category = category;
  if (isActive !== undefined) filters.isActive = isActive === "true";

  const habits = await getUserHabits(req.user._id, filters);

  res.status(200).json({
    status: "success",
    results: habits.length,
    data: habits,
  });
});

/**
 * Get a single habit
 * @route GET /api/habits/:id
 */
const getHabit = asyncHandler(async (req, res) => {
  const habit = await getUserHabitById(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: habit,
  });
});

/**
 * Update a habit
 * @route PUT /api/habits/:id
 */
const updateHabit = asyncHandler(async (req, res) => {
  const habit = await updateUserHabit(req.params.id, req.user._id, req.body);

  res.status(200).json({
    status: "success",
    data: habit,
  });
});

/**
 * Delete a habit
 * @route DELETE /api/habits/:id
 */
const deleteHabit = asyncHandler(async (req, res) => {
  await deleteUserHabit(req.params.id, req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get habit entries with optional filtering
 * @route GET /api/habits/entries
 */
const getEntries = asyncHandler(async (req, res) => {
  const { habitId, startDate, endDate } = req.query;
  const filters = {};

  if (habitId) filters.habitId = habitId;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const entries = await getHabitEntries(req.user._id, filters);

  res.status(200).json({
    status: "success",
    results: entries.length,
    data: entries,
  });
});

/**
 * Get today's habit entries
 * @route GET /api/habits/entries/today
 */
const getTodayEntries = asyncHandler(async (req, res) => {
  const entries = await getTodayHabitEntries(req.user._id);

  res.status(200).json({
    status: "success",
    results: entries.length,
    data: entries,
  });
});

/**
 * Log habit completion
 * @route POST /api/habits/entries
 */
const logEntry = asyncHandler(async (req, res) => {
  const entry = await logHabitEntry(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: entry,
  });
});

/**
 * Update specific habit entry
 * @route PUT /api/habits/entries/:habitId/:date
 */
const updateEntry = asyncHandler(async (req, res) => {
  const { habitId, date } = req.params;
  const entry = await updateHabitEntry(habitId, date, req.user._id, req.body);

  res.status(200).json({
    status: "success",
    data: entry,
  });
});

/**
 * Delete habit entry
 * @route DELETE /api/habits/entries/:habitId/:date
 */
const deleteEntry = asyncHandler(async (req, res) => {
  const { habitId, date } = req.params;
  await deleteHabitEntry(habitId, date, req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Batch update multiple entries
 * @route POST /api/habits/entries/batch
 */
const batchUpdateEntries = asyncHandler(async (req, res) => {
  const { entries } = req.body; // Array of { habitId, date, ...updateData }

  if (!Array.isArray(entries)) {
    throw errorTypes.badRequest("Entries must be an array");
  }

  const updatedEntries = [];

  for (const entryData of entries) {
    const { habitId, date, ...updateData } = entryData;
    const entry = await logHabitEntry(
      { habitId, date, ...updateData },
      req.user._id
    );
    updatedEntries.push(entry);
  }

  res.status(200).json({
    status: "success",
    results: updatedEntries.length,
    data: updatedEntries,
  });
});

export {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  getEntries,
  getTodayEntries,
  logEntry,
  updateEntry,
  deleteEntry,
  batchUpdateEntries,
};
