import Habit from "../models/habitModel.js";
import HabitEntry from "../models/habitEntryModel.js";
import { errorTypes } from "../utils/AppError.js";

// Get user's habits
export const getUserHabits = async (userId, filters = {}) => {
  const query = { user: userId };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  return await Habit.find(query).sort({ createdAt: -1 });
};

// Get specific habit by ID
export const getUserHabitById = async (habitId, userId) => {
  const habit = await Habit.findOne({ _id: habitId, user: userId });

  if (!habit) {
    throw errorTypes.notFound("Habit not found");
  }

  return habit;
};

// Create new habit
export const createUserHabit = async (habitData, userId) => {
  const habit = new Habit({
    ...habitData,
    user: userId,
  });

  return await habit.save();
};

// Update habit
export const updateUserHabit = async (habitId, userId, updateData) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: habitId, user: userId },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!habit) {
    throw errorTypes.notFound("Habit not found");
  }

  return habit;
};

// Delete habit
export const deleteUserHabit = async (habitId, userId) => {
  const habit = await Habit.findOneAndDelete({ _id: habitId, user: userId });

  if (!habit) {
    throw errorTypes.notFound("Habit not found");
  }

  // Also delete all associated habit entries
  await HabitEntry.deleteMany({ habit: habitId, user: userId });

  return habit;
};

// Get habit entries for a date range
export const getHabitEntries = async (userId, filters = {}) => {
  const query = { user: userId };

  if (filters.habitId) {
    query.habit = filters.habitId;
  }

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }

  return await HabitEntry.find(query)
    .populate("habit", "name color type targetValue unit")
    .sort({ date: -1 });
};

// Get today's habit entries
export const getTodayHabitEntries = async (userId) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  return await HabitEntry.find({ user: userId, date: today }).populate(
    "habit",
    "name color type targetValue unit category"
  );
};

// Log habit completion
export const logHabitEntry = async (entryData, userId) => {
  const { habitId, date, currentValue, completed, notes } = entryData;

  // Verify habit belongs to user
  const habit = await getUserHabitById(habitId, userId);

  // Check if entry already exists
  const existingEntry = await HabitEntry.findOne({
    habit: habitId,
    user: userId,
    date: date,
  });

  if (existingEntry) {
    // Update existing entry
    existingEntry.currentValue =
      currentValue !== undefined ? currentValue : existingEntry.currentValue;
    existingEntry.completed =
      completed !== undefined ? completed : existingEntry.completed;
    existingEntry.notes = notes || existingEntry.notes;
    existingEntry.updatedAt = Date.now();

    return await existingEntry.save();
  } else {
    // Create new entry
    const entry = new HabitEntry({
      habit: habitId,
      user: userId,
      date,
      currentValue: currentValue || 0,
      completed: completed || false,
      notes: notes || "",
    });

    return await entry.save();
  }
};

// Update specific habit entry
export const updateHabitEntry = async (habitId, date, userId, updateData) => {
  // Verify habit belongs to user
  await getUserHabitById(habitId, userId);

  const entry = await HabitEntry.findOneAndUpdate(
    { habit: habitId, user: userId, date },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!entry) {
    throw errorTypes.notFound("Habit entry not found");
  }

  return entry;
};

// Delete habit entry
export const deleteHabitEntry = async (habitId, date, userId) => {
  // Verify habit belongs to user
  await getUserHabitById(habitId, userId);

  const entry = await HabitEntry.findOneAndDelete({
    habit: habitId,
    user: userId,
    date,
  });

  if (!entry) {
    throw errorTypes.notFound("Habit entry not found");
  }

  return entry;
};
