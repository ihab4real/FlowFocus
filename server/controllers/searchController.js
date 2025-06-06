import Task from "../models/taskModel.js";
import Note from "../models/noteModel.js";
import Habit from "../models/habitModel.js";
import { errorTypes } from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Global search across tasks, notes, and habits
 * @route GET /api/search
 * @access Private
 */
export const searchAll = asyncHandler(async (req, res, next) => {
  const { q: query } = req.query;
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type || "all"; // 'all', 'tasks', 'notes', 'habits'

  if (!query || query.trim() === "") {
    return res.status(200).json({
      tasks: [],
      notes: [],
      habits: [],
    });
  }

  // Create text search conditions
  const searchCondition = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
    user: userId,
  };

  const noteSearchCondition = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
    user: userId,
  };

  const habitSearchCondition = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
    user: userId,
  };

  // Initialize results object
  const results = {};

  // Execute searches in parallel based on requested type
  const searchPromises = [];

  if (type === "all" || type === "tasks") {
    searchPromises.push(
      Task.find(searchCondition)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .select("title description status priority dueDate updatedAt")
        .lean()
        .then((tasks) => {
          results.tasks = tasks;
        })
    );
  } else {
    results.tasks = [];
  }

  if (type === "all" || type === "notes") {
    searchPromises.push(
      Note.find(noteSearchCondition)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .select("title content folder updatedAt")
        .lean()
        .then((notes) => {
          // Process notes to extract snippets from content
          results.notes = notes.map((note) => {
            const plainTextContent = note.content
              ? note.content.replace(/<[^>]*>?/gm, "") // Remove HTML tags
              : "";

            return {
              ...note,
              snippet:
                plainTextContent.substring(0, 100) +
                (plainTextContent.length > 100 ? "..." : ""),
            };
          });
        })
    );
  } else {
    results.notes = [];
  }

  if (type === "all" || type === "habits") {
    searchPromises.push(
      Habit.find(habitSearchCondition)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .select("name description category type targetValue unit")
        .lean()
        .then((habits) => {
          results.habits = habits;
        })
    );
  } else {
    results.habits = [];
  }

  await Promise.all(searchPromises);

  res.status(200).json(results);
});
