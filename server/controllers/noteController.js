import asyncHandler from "../utils/asyncHandler.js";
import {
  createUserNote,
  getUserNotes,
  getUserNoteById,
  updateUserNote,
  deleteUserNote,
  getUserFolders,
  createUserFolder,
  deleteUserFolder,
  renameUserFolder,
} from "../services/noteService.js";

/**
 * Get all notes for the current user
 * @route GET /api/notes
 */
export const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await getUserNotes(req.user.id);

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
  const note = await getUserNoteById(req.params.id, req.user.id);

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
  const note = await createUserNote(req.body, req.user.id);

  res.status(201).json({
    status: "success",
    data: {
      note,
    },
  });
});

/**
 * Update a note
 * @route PATCH /api/notes/:id
 */
export const updateNote = asyncHandler(async (req, res) => {
  const note = await updateUserNote(req.params.id, req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      note,
    },
  });
});

/**
 * Delete a note
 * @route DELETE /api/notes/:id
 */
export const deleteNote = asyncHandler(async (req, res) => {
  await deleteUserNote(req.params.id, req.user.id);

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
  const folders = await getUserFolders(req.user.id);

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
  const result = await createUserFolder(req.body.name, req.user.id);

  res.status(201).json({
    status: "success",
    data: result,
  });
});

/**
 * Delete a folder
 * @route DELETE /api/notes/folders/:name
 */
export const deleteFolder = asyncHandler(async (req, res) => {
  const result = await deleteUserFolder(req.params.name, req.user.id);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Rename a folder
 * @route PATCH /api/notes/folders/:name
 */
export const renameFolder = asyncHandler(async (req, res) => {
  const result = await renameUserFolder(
    req.params.name,
    req.body.name,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});
