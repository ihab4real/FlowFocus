// Service layer for note-related business logic
import Note from "../models/noteModel.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logDebug, logError } from "../utils/logger.js";

/**
 * Creates a new note for a user.
 * @param {Object} noteData - The note data (title, content, folder, tags).
 * @param {String} userId - ID of the user creating the note.
 * @returns {Promise<Note>} The newly created note.
 * @throws {AppError} If validation fails.
 */
export const createUserNote = async (noteData, userId) => {
  try {
    const note = await Note.create({
      ...noteData,
      user: userId,
    });

    logInfo("New note created via NoteService", {
      noteId: note._id,
      userId: userId,
    });

    return note;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      logDebug("Note creation failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid note data provided"
      );
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Retrieves all notes for a specific user.
 * @param {String} userId - ID of the user whose notes to retrieve.
 * @returns {Promise<Array<Note>>} Array of user's notes.
 */
export const getUserNotes = async (userId) => {
  try {
    const notes = await Note.find({ user: userId });
    return notes;
  } catch (error) {
    logError("Error fetching user notes", { userId, error });
    throw error;
  }
};

/**
 * Retrieves a specific note by ID, ensuring it belongs to the specified user.
 * @param {String} noteId - ID of the note to retrieve.
 * @param {String} userId - ID of the user who should own the note.
 * @returns {Promise<Note>} The requested note.
 * @throws {AppError} If note not found or doesn't belong to user.
 */
export const getUserNoteById = async (noteId, userId) => {
  const note = await Note.findOne({
    _id: noteId,
    user: userId,
  });

  if (!note) {
    logDebug("Note not found or doesn't belong to user", { noteId, userId });
    throw errorTypes.notFound("No note found with that ID");
  }

  return note;
};

/**
 * Updates a note, ensuring it belongs to the specified user.
 * @param {String} noteId - ID of the note to update.
 * @param {String} userId - ID of the user who should own the note.
 * @param {Object} updateData - Data to update the note with.
 * @returns {Promise<Note>} The updated note.
 * @throws {AppError} If note not found, doesn't belong to user, or validation fails.
 */
export const updateUserNote = async (noteId, userId, updateData) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: noteId,
        user: userId,
      },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run validators on update
      }
    );

    if (!note) {
      logDebug("Note not found or doesn't belong to user on update", {
        noteId,
        userId,
      });
      throw errorTypes.notFound("No note found with that ID");
    }

    logInfo("Note updated via NoteService", { noteId, userId });
    return note;
  } catch (error) {
    // Handle Mongoose validation errors on update
    if (error.name === "ValidationError") {
      logDebug("Note update failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid note data provided"
      );
    }
    // Re-throw NotFound or other errors
    throw error;
  }
};

/**
 * Deletes a note, ensuring it belongs to the specified user.
 * @param {String} noteId - ID of the note to delete.
 * @param {String} userId - ID of the user who should own the note.
 * @returns {Promise<Note>} The deleted note.
 * @throws {AppError} If note not found or doesn't belong to user.
 */
export const deleteUserNote = async (noteId, userId) => {
  const note = await Note.findOneAndDelete({
    _id: noteId,
    user: userId,
  });

  if (!note) {
    logDebug("Note not found or doesn't belong to user on delete", {
      noteId,
      userId,
    });
    throw errorTypes.notFound("No note found with that ID");
  }

  logInfo("Note deleted via NoteService", { noteId, userId });
  return note;
};

/**
 * Retrieves all unique folders for a specific user.
 * @param {String} userId - ID of the user whose folders to retrieve.
 * @returns {Promise<Array<String>>} Array of folder names.
 */
export const getUserFolders = async (userId) => {
  try {
    const folders = await Note.distinct("folder", { user: userId });
    return folders;
  } catch (error) {
    logError("Error fetching user folders", { userId, error });
    throw error;
  }
};

/**
 * Creates a new folder by creating a welcome note in it.
 * @param {String} folderName - Name of the folder to create.
 * @param {String} userId - ID of the user creating the folder.
 * @returns {Promise<Object>} Object containing folder name and the created welcome note.
 * @throws {AppError} If folder name is missing or folder already exists.
 */
export const createUserFolder = async (folderName, userId) => {
  if (!folderName || folderName.trim() === "") {
    throw errorTypes.badRequest("Folder name is required");
  }

  // Check if folder already exists for this user
  const folderExists = await Note.findOne({
    user: userId,
    folder: folderName.trim(),
  });

  if (folderExists) {
    throw errorTypes.badRequest("Folder already exists");
  }

  try {
    // Create a default note in the folder
    const welcomeNote = await Note.create({
      title: `Welcome to ${folderName.trim()}`,
      content: "",
      folder: folderName.trim(),
      user: userId,
    });

    logInfo("Folder created via NoteService", {
      folder: folderName.trim(),
      userId: userId,
    });

    return {
      folder: folderName.trim(),
      note: welcomeNote,
    };
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      logDebug("Folder creation failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid folder data provided"
      );
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Deletes a folder and moves all notes to the General folder.
 * @param {String} folderName - Name of the folder to delete.
 * @param {String} userId - ID of the user who owns the folder.
 * @returns {Promise<Object>} Object containing deletion result and number of notes updated.
 * @throws {AppError} If trying to delete General folder or folder not found.
 */
export const deleteUserFolder = async (folderName, userId) => {
  // Don't allow deleting the default "General" folder
  if (folderName === "General") {
    throw errorTypes.badRequest("Cannot delete the General folder");
  }

  // Check if folder exists for this user
  const folderExists = await Note.findOne({
    user: userId,
    folder: folderName,
  });

  if (!folderExists) {
    throw errorTypes.notFound("Folder not found");
  }

  try {
    // Move all notes from this folder to the General folder
    const updateResult = await Note.updateMany(
      { user: userId, folder: folderName },
      { folder: "General" }
    );

    logInfo("Folder deleted via NoteService", {
      folder: folderName,
      userId: userId,
      notesUpdated: updateResult.modifiedCount,
    });

    return {
      message: `Folder "${folderName}" deleted. ${updateResult.modifiedCount} notes moved to General folder.`,
      notesUpdated: updateResult.modifiedCount,
    };
  } catch (error) {
    logError("Error deleting folder", { folderName, userId, error });
    throw error;
  }
};

/**
 * Renames a folder and updates all notes in it.
 * @param {String} oldFolderName - Current name of the folder.
 * @param {String} newFolderName - New name for the folder.
 * @param {String} userId - ID of the user who owns the folder.
 * @returns {Promise<Object>} Object containing rename result and number of notes updated.
 * @throws {AppError} If trying to rename General folder, folder not found, or new name already exists.
 */
export const renameUserFolder = async (
  oldFolderName,
  newFolderName,
  userId
) => {
  // Don't allow renaming the default "General" folder
  if (oldFolderName === "General") {
    throw errorTypes.badRequest("Cannot rename the General folder");
  }

  if (!newFolderName || newFolderName.trim() === "") {
    throw errorTypes.badRequest("New folder name is required");
  }

  const trimmedNewName = newFolderName.trim();

  // Check if folder exists for this user
  const folderExists = await Note.findOne({
    user: userId,
    folder: oldFolderName,
  });

  if (!folderExists) {
    throw errorTypes.notFound("Folder not found");
  }

  // Check if the new folder name already exists
  const newFolderExists = await Note.findOne({
    user: userId,
    folder: trimmedNewName,
  });

  if (newFolderExists) {
    throw errorTypes.badRequest("A folder with this name already exists");
  }

  try {
    // Update all notes in this folder with the new folder name
    const updateResult = await Note.updateMany(
      { user: userId, folder: oldFolderName },
      { folder: trimmedNewName }
    );

    logInfo("Folder renamed via NoteService", {
      oldName: oldFolderName,
      newName: trimmedNewName,
      userId: userId,
      notesUpdated: updateResult.modifiedCount,
    });

    return {
      message: `Folder renamed from "${oldFolderName}" to "${trimmedNewName}". ${updateResult.modifiedCount} notes updated.`,
      oldName: oldFolderName,
      newName: trimmedNewName,
      notesUpdated: updateResult.modifiedCount,
    };
  } catch (error) {
    logError("Error renaming folder", {
      oldFolderName,
      newFolderName: trimmedNewName,
      userId,
      error,
    });
    throw error;
  }
};
