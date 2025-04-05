import Note from "../models/noteModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Get all notes for the current user
 * @route GET /api/notes
 */
export const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ user: req.user.id });

  res.status(200).json({
    status: "success",
    results: notes.length,
    data: {
      notes,
    },
  });
});

/**
 * Get a single note
 * @route GET /api/notes/:id
 */
export const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw errorTypes.notFound("No note found with that ID");
  }

  // Check if the note belongs to the user
  if (note.user.toString() !== req.user.id) {
    throw errorTypes.forbidden(
      "You do not have permission to access this note"
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      note,
    },
  });
});

/**
 * Create a new note
 * @route POST /api/notes
 */
export const createNote = asyncHandler(async (req, res) => {
  // Add user id to request body
  req.body.user = req.user.id;

  const newNote = await Note.create(req.body);

  logInfo("Note created", { noteId: newNote._id, userId: req.user.id });

  res.status(201).json({
    status: "success",
    data: {
      note: newNote,
    },
  });
});

/**
 * Update a note
 * @route PATCH /api/notes/:id
 */
export const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw errorTypes.notFound("No note found with that ID");
  }

  // Check if the note belongs to the user
  if (note.user.toString() !== req.user.id) {
    throw errorTypes.forbidden(
      "You do not have permission to update this note"
    );
  }

  // Update the note
  const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logInfo("Note updated", { noteId: updatedNote._id, userId: req.user.id });

  res.status(200).json({
    status: "success",
    data: {
      note: updatedNote,
    },
  });
});

/**
 * Delete a note
 * @route DELETE /api/notes/:id
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw errorTypes.notFound("No note found with that ID");
  }

  // Check if the note belongs to the user
  if (note.user.toString() !== req.user.id) {
    throw errorTypes.forbidden(
      "You do not have permission to delete this note"
    );
  }

  await Note.findByIdAndDelete(req.params.id);

  logInfo("Note deleted", { noteId: req.params.id, userId: req.user.id });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get all folders for the current user
 * @route GET /api/notes/folders
 */
export const getFolders = asyncHandler(async (req, res) => {
  // Get distinct folder names for the current user
  const folders = await Note.distinct("folder", { user: req.user.id });

  res.status(200).json({
    status: "success",
    data: {
      folders,
    },
  });
});

/**
 * Create a new folder
 * @route POST /api/notes/folders
 */
export const createFolder = asyncHandler(async (req, res) => {
  // Create a note with the folder name and minimal content
  // This approach keeps things simple without needing a separate Folder model
  const { name } = req.body;

  if (!name) {
    throw errorTypes.badRequest("Folder name is required");
  }

  // Check if folder already exists for this user
  const folderExists = await Note.findOne({
    user: req.user.id,
    folder: name,
  });

  if (folderExists) {
    throw errorTypes.badRequest("Folder already exists");
  }

  // Create a default note in the folder
  const newNote = await Note.create({
    title: `Welcome to ${name}`,
    content: "",
    folder: name,
    user: req.user.id,
  });

  logInfo("Folder created", { folder: name, userId: req.user.id });

  res.status(201).json({
    status: "success",
    data: {
      folder: name,
      note: newNote,
    },
  });
});

/**
 * Delete a folder
 * @route DELETE /api/notes/folders/:name
 */
export const deleteFolder = asyncHandler(async (req, res) => {
  const { name } = req.params;

  // Don't allow deleting the default "General" folder
  if (name === "General") {
    throw errorTypes.badRequest("Cannot delete the General folder");
  }

  // Check if folder exists for this user
  const folderExists = await Note.findOne({
    user: req.user.id,
    folder: name,
  });

  if (!folderExists) {
    throw errorTypes.notFound("Folder not found");
  }

  // Move all notes from this folder to the General folder
  const updateResult = await Note.updateMany(
    { user: req.user.id, folder: name },
    { folder: "General" }
  );

  logInfo("Folder deleted", {
    folder: name,
    userId: req.user.id,
    notesUpdated: updateResult.modifiedCount,
  });

  res.status(200).json({
    status: "success",
    data: {
      message: `Folder "${name}" deleted. ${updateResult.modifiedCount} notes moved to General folder.`,
      notesUpdated: updateResult.modifiedCount,
    },
  });
});

/**
 * Rename a folder
 * @route PATCH /api/notes/folders/:name
 */
export const renameFolder = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { name: newName } = req.body;

  // Don't allow renaming the default "General" folder
  if (name === "General") {
    throw errorTypes.badRequest("Cannot rename the General folder");
  }

  if (!newName || newName.trim() === "") {
    throw errorTypes.badRequest("New folder name is required");
  }

  // Check if folder exists for this user
  const folderExists = await Note.findOne({
    user: req.user.id,
    folder: name,
  });

  if (!folderExists) {
    throw errorTypes.notFound("Folder not found");
  }

  // Check if the new folder name already exists
  const newFolderExists = await Note.findOne({
    user: req.user.id,
    folder: newName,
  });

  if (newFolderExists) {
    throw errorTypes.badRequest("A folder with this name already exists");
  }

  // Update all notes in this folder with the new folder name
  const updateResult = await Note.updateMany(
    { user: req.user.id, folder: name },
    { folder: newName }
  );

  logInfo("Folder renamed", {
    oldName: name,
    newName: newName,
    userId: req.user.id,
    notesUpdated: updateResult.modifiedCount,
  });

  res.status(200).json({
    status: "success",
    data: {
      message: `Folder renamed from "${name}" to "${newName}". ${updateResult.modifiedCount} notes updated.`,
      oldName: name,
      newName: newName,
      notesUpdated: updateResult.modifiedCount,
    },
  });
});
