import Task from "../models/taskModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// Create a new task
const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    user: req.user._id, // Add the authenticated user's ID
  });

  res.status(201).json({
    status: "success",
    data: task,
  });
});

// Get all tasks for the authenticated user
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

// Get a single task
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    throw new AppError("No task found with that ID", 404);
  }

  res.status(200).json({
    status: "success",
    data: task,
  });
});

// Update a task
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!task) {
    throw new AppError("No task found with that ID", 404);
  }

  res.status(200).json({
    status: "success",
    data: task,
  });
});

// Delete a task
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    throw new AppError("No task found with that ID", 404);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Move a task to a different status
const moveTask = asyncHandler(async (req, res) => {
  const { status } = req.body;

  // Validate status
  if (!status || !["Todo", "Doing", "Done"].includes(status)) {
    throw new AppError("Invalid status value", 400);
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
    },
    { status, updatedAt: Date.now() },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!task) {
    throw new AppError("No task found with that ID", 404);
  }

  res.status(200).json({
    status: "success",
    data: task,
  });
});

export { createTask, getTasks, getTask, updateTask, deleteTask, moveTask };
