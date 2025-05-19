import asyncHandler from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createUserTask,
  getUserTasks,
  getUserTaskById,
  updateUserTask,
  deleteUserTask,
  moveUserTask,
} from "../services/taskService.js";

// Create a new task
const createTask = asyncHandler(async (req, res) => {
  const task = await createUserTask(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: task,
  });
});

// Get all tasks for the authenticated user
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await getUserTasks(req.user._id);

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

// Get a single task
const getTask = asyncHandler(async (req, res) => {
  const task = await getUserTaskById(req.params.id, req.user._id);

  res.status(200).json({
    status: "success",
    data: task,
  });
});

// Update a task
const updateTask = asyncHandler(async (req, res) => {
  const task = await updateUserTask(req.params.id, req.user._id, req.body);

  res.status(200).json({
    status: "success",
    data: task,
  });
});

// Delete a task
const deleteTask = asyncHandler(async (req, res) => {
  await deleteUserTask(req.params.id, req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Move a task to a different status
const moveTask = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await moveUserTask(req.params.id, req.user._id, status);

  res.status(200).json({
    status: "success",
    data: task,
  });
});

export { createTask, getTasks, getTask, updateTask, deleteTask, moveTask };
