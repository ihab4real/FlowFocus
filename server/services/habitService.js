import Habit from "../models/habitModel.js";
import HabitEntry from "../models/habitEntryModel.js";
import { errorTypes } from "../utils/AppError.js";
import {
  emitHabitCreated,
  emitHabitUpdated,
  emitHabitDeleted,
  emitHabitCompleted,
  emitProgressUpdated,
  emitStreakAchieved,
} from "./habitEventService.js";

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

  const savedHabit = await habit.save();

  // Emit habit created event for extensions
  const user = { _id: userId };
  await emitHabitCreated(savedHabit, user);

  return savedHabit;
};

// Update habit
export const updateUserHabit = async (habitId, userId, updateData) => {
  // Get the previous habit data for comparison
  const previousHabit = await getUserHabitById(habitId, userId);

  const habit = await Habit.findOneAndUpdate(
    { _id: habitId, user: userId },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!habit) {
    throw errorTypes.notFound("Habit not found");
  }

  // Emit habit updated event for extensions
  const user = { _id: userId };
  await emitHabitUpdated(habit, previousHabit.toObject(), user);

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

  // Emit habit deleted event for extensions
  const user = { _id: userId };
  await emitHabitDeleted(habit, user);

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

  let entry;
  let wasNewCompletion = false;
  let progressChanged = false;

  if (existingEntry) {
    // Track if this is a new completion or progress change
    const wasCompleted = existingEntry.completed;
    const oldValue = existingEntry.currentValue;

    // Update existing entry
    existingEntry.currentValue =
      currentValue !== undefined ? currentValue : existingEntry.currentValue;
    existingEntry.completed =
      completed !== undefined ? completed : existingEntry.completed;
    existingEntry.notes = notes || existingEntry.notes;
    existingEntry.updatedAt = Date.now();

    entry = await existingEntry.save();

    // Check if this was a new completion
    wasNewCompletion = !wasCompleted && entry.completed;
    progressChanged = oldValue !== entry.currentValue;
  } else {
    // Create new entry
    entry = new HabitEntry({
      habit: habitId,
      user: userId,
      date,
      currentValue: currentValue || 0,
      completed: completed || false,
      notes: notes || "",
    });

    entry = await entry.save();
    wasNewCompletion = entry.completed;
    progressChanged = true;
  }

  // Emit events for extensions
  const user = { _id: userId };

  if (progressChanged) {
    await emitProgressUpdated(habit, entry, user);
  }

  if (wasNewCompletion) {
    // Calculate streak data for completion event
    const streakData = await calculateStreakData(habit, userId, date);

    await emitHabitCompleted(habit, entry, user, streakData);

    // Check if this completion achieved a notable streak
    if (streakData && isNotableStreak(streakData.currentStreak)) {
      await emitStreakAchieved(habit, user, streakData);
    }
  }

  return entry;
};

// Update specific habit entry
export const updateHabitEntry = async (habitId, date, userId, updateData) => {
  // Verify habit belongs to user
  const habit = await getUserHabitById(habitId, userId);

  const oldEntry = await HabitEntry.findOne({
    habit: habitId,
    user: userId,
    date,
  });

  const entry = await HabitEntry.findOneAndUpdate(
    { habit: habitId, user: userId, date },
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!entry) {
    throw errorTypes.notFound("Habit entry not found");
  }

  // Emit events for extensions
  const user = { _id: userId };

  // Check if progress changed
  if (!oldEntry || oldEntry.currentValue !== entry.currentValue) {
    await emitProgressUpdated(habit, entry, user);
  }

  // Check if completion status changed to true
  if ((!oldEntry || !oldEntry.completed) && entry.completed) {
    const streakData = await calculateStreakData(habit, userId, date);
    await emitHabitCompleted(habit, entry, user, streakData);

    if (streakData && isNotableStreak(streakData.currentStreak)) {
      await emitStreakAchieved(habit, user, streakData);
    }
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

// Helper function to calculate streak data
const calculateStreakData = async (habit, userId, currentDate) => {
  try {
    // Import streak calculation service
    const { calculateStreakForHabit } = await import("./habitStreakService.js");
    return await calculateStreakForHabit(habit._id, userId, currentDate);
  } catch (error) {
    // Fallback if streak service doesn't exist yet
    return {
      currentStreak: 1,
      bestStreak: 1,
      totalCompletions: 1,
    };
  }
};

// Helper function to determine if a streak is notable
const isNotableStreak = (streakLength) => {
  // Consider streaks notable at 3, 7, 30, 100, 365 days
  const notableNumbers = [3, 7, 30, 100, 365];
  return notableNumbers.includes(streakLength);
};
