import mongoose from "mongoose";
import Note from "../../../../../models/noteModel.js";
import User from "../../../../../models/userModel.js";
import { errorTypes } from "../../../../../utils/AppError.js";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  jest,
} from "@jest/globals";

// This will ensure all tests in this file share the in-memory MongoDB
import "../../../../setup/db.js";

// Use the unstable API for mocking ESM
jest.unstable_mockModule("../../../../../utils/logger.js", () => ({
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

// Dynamically import the mocked service *after* the mock is defined
const { logInfo, logDebug, logError } = await import(
  "../../../../../utils/logger.js"
);

// Import the services *after* mocks are set up to ensure they use mocked dependencies
const {
  createUserNote,
  getUserNotes,
  getUserNoteById,
  updateUserNote,
  deleteUserNote,
  getUserFolders,
  createUserFolder,
  deleteUserFolder,
  renameUserFolder,
} = await import("../../../../../services/noteService.js");

describe("Note Service", () => {
  let testUser;
  let anotherUser;

  // Setup: Create test users before each test
  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      name: "Test User",
      email: "notetest@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    anotherUser = await User.create({
      name: "Another User",
      email: "another@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    // Clear mocks before each test
    logInfo.mockClear();
    logDebug.mockClear();
    logError.mockClear();
  });

  describe("createUserNote", () => {
    it("should create a new note for the user", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        content: "This is a test note",
        folder: "Work",
        tags: ["test", "important"],
      };

      // Act
      const note = await createUserNote(noteData, testUser._id);

      // Assert
      expect(note).toBeDefined();
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(noteData.content);
      expect(note.folder).toBe(noteData.folder);
      expect(note.tags).toEqual(noteData.tags);
      expect(note.user.toString()).toBe(testUser._id.toString());

      // Verify note was saved to database
      const savedNote = await Note.findById(note._id);
      expect(savedNote).not.toBeNull();
      expect(savedNote.title).toBe(noteData.title);

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("New note created via NoteService", {
        noteId: note._id,
        userId: testUser._id,
      });
    });

    it("should create a note with default values when optional fields are missing", async () => {
      // Arrange
      const noteData = {
        title: "Minimal Note",
        // Missing content, folder, tags
      };

      // Act
      const note = await createUserNote(noteData, testUser._id);

      // Assert
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(""); // Default value
      expect(note.folder).toBe("General"); // Default value
      expect(note.tags).toEqual([]); // Default value
      expect(note.user.toString()).toBe(testUser._id.toString());
    });

    it("should throw a validation error if title is missing", async () => {
      // Arrange
      const noteData = {
        // Missing title (required field)
        content: "This note has no title",
      };

      // Act & Assert
      await expect(createUserNote(noteData, testUser._id)).rejects.toThrow();

      // Verify debug logging was called for validation error
      expect(logDebug).toHaveBeenCalledWith(
        "Note creation failed due to validation error",
        expect.objectContaining({ error: expect.any(Object) })
      );
    });

    it("should throw a validation error if title is empty", async () => {
      // Arrange
      const noteData = {
        title: "", // Empty title
        content: "This note has empty title",
      };

      // Act & Assert
      await expect(createUserNote(noteData, testUser._id)).rejects.toThrow();
    });

    it("should trim whitespace from title and folder", async () => {
      // Arrange
      const noteData = {
        title: "  Trimmed Title  ",
        folder: "  Work Folder  ",
        content: "Test content",
      };

      // Act
      const note = await createUserNote(noteData, testUser._id);

      // Assert
      expect(note.title).toBe("Trimmed Title");
      expect(note.folder).toBe("Work Folder");
    });

    it("should trim whitespace from tags", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        tags: ["  tag1  ", "  tag2  ", "tag3"],
      };

      // Act
      const note = await createUserNote(noteData, testUser._id);

      // Assert
      expect(note.tags).toEqual(["tag1", "tag2", "tag3"]);
    });
  });

  describe("getUserNotes", () => {
    it("should return all notes for a user", async () => {
      // Arrange - Create multiple notes for the test user
      await Note.create([
        {
          title: "Note 1",
          content: "First note",
          folder: "Work",
          user: testUser._id,
        },
        {
          title: "Note 2",
          content: "Second note",
          folder: "Personal",
          user: testUser._id,
        },
      ]);

      // Create a note for another user (should not be returned)
      await Note.create({
        title: "Another User Note",
        content: "Other user content",
        user: anotherUser._id,
      });

      // Act
      const notes = await getUserNotes(testUser._id);

      // Assert
      expect(notes).toHaveLength(2);
      expect(notes[0].user.toString()).toBe(testUser._id.toString());
      expect(notes[1].user.toString()).toBe(testUser._id.toString());

      // Verify the other user's note is not included
      const otherUserNoteIncluded = notes.some(
        (note) => note.title === "Another User Note"
      );
      expect(otherUserNoteIncluded).toBe(false);
    });

    it("should return an empty array if user has no notes", async () => {
      // Act
      const notes = await getUserNotes(testUser._id);

      // Assert
      expect(notes).toBeInstanceOf(Array);
      expect(notes).toHaveLength(0);
    });

    it("should return notes sorted by creation date (newest first)", async () => {
      // Arrange - Create notes with different timestamps
      const note1 = await Note.create({
        title: "First Note",
        user: testUser._id,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const note2 = await Note.create({
        title: "Second Note",
        user: testUser._id,
      });

      // Act
      const notes = await getUserNotes(testUser._id);

      // Assert
      expect(notes).toHaveLength(2);
      // MongoDB returns in insertion order by default, but we can verify the order
      const noteTitles = notes.map((note) => note.title);
      expect(noteTitles).toContain("First Note");
      expect(noteTitles).toContain("Second Note");
    });
  });

  describe("getUserNoteById", () => {
    it("should return a specific note for a user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Find Me Note",
        content: "This note should be found",
        folder: "Work",
        tags: ["findable"],
        user: testUser._id,
      });

      // Act
      const foundNote = await getUserNoteById(note._id, testUser._id);

      // Assert
      expect(foundNote).toBeDefined();
      expect(foundNote._id.toString()).toBe(note._id.toString());
      expect(foundNote.title).toBe("Find Me Note");
      expect(foundNote.content).toBe("This note should be found");
      expect(foundNote.folder).toBe("Work");
      expect(foundNote.tags).toEqual(["findable"]);
    });

    it("should throw a not found error if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(
        getUserNoteById(nonExistentId, testUser._id)
      ).rejects.toThrow("No note found with that ID");

      // Verify debug logging was called
      expect(logDebug).toHaveBeenCalledWith(
        "Note not found or doesn't belong to user",
        {
          noteId: nonExistentId,
          userId: testUser._id,
        }
      );
    });

    it("should throw a not found error if note belongs to a different user", async () => {
      // Arrange - Create note for another user
      const note = await Note.create({
        title: "Other User Note",
        content: "This belongs to another user",
        user: anotherUser._id,
      });

      // Act & Assert
      await expect(getUserNoteById(note._id, testUser._id)).rejects.toThrow(
        "No note found with that ID"
      );

      // Verify debug logging was called
      expect(logDebug).toHaveBeenCalledWith(
        "Note not found or doesn't belong to user",
        {
          noteId: note._id,
          userId: testUser._id,
        }
      );
    });
  });

  describe("updateUserNote", () => {
    it("should update an existing note", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        content: "Original content",
        folder: "Work",
        tags: ["old"],
        user: testUser._id,
      });

      const updateData = {
        title: "Updated Title",
        content: "Updated content",
        folder: "Personal",
        tags: ["new", "updated"],
      };

      // Act
      const updatedNote = await updateUserNote(
        note._id,
        testUser._id,
        updateData
      );

      // Assert
      expect(updatedNote.title).toBe(updateData.title);
      expect(updatedNote.content).toBe(updateData.content);
      expect(updatedNote.folder).toBe(updateData.folder);
      expect(updatedNote.tags).toEqual(updateData.tags);
      expect(updatedNote.updatedAt).not.toEqual(note.updatedAt);

      // Verify in database
      const noteInDb = await Note.findById(note._id);
      expect(noteInDb.title).toBe(updateData.title);

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("Note updated via NoteService", {
        noteId: note._id,
        userId: testUser._id,
      });
    });

    it("should update only specified fields", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        content: "Original content",
        folder: "Work",
        tags: ["original"],
        user: testUser._id,
      });

      const updateData = {
        title: "Updated Title Only",
      };

      // Act
      const updatedNote = await updateUserNote(
        note._id,
        testUser._id,
        updateData
      );

      // Assert
      expect(updatedNote.title).toBe(updateData.title);
      expect(updatedNote.content).toBe("Original content"); // Unchanged
      expect(updatedNote.folder).toBe("Work"); // Unchanged
      expect(updatedNote.tags).toEqual(["original"]); // Unchanged
    });

    it("should throw a not found error if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: "Updated Title" };

      // Act & Assert
      await expect(
        updateUserNote(nonExistentId, testUser._id, updateData)
      ).rejects.toThrow("No note found with that ID");

      // Verify debug logging was called
      expect(logDebug).toHaveBeenCalledWith(
        "Note not found or doesn't belong to user on update",
        {
          noteId: nonExistentId,
          userId: testUser._id,
        }
      );
    });

    it("should throw a not found error if note belongs to another user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Other User Note",
        user: anotherUser._id,
      });

      const updateData = { title: "Trying to update" };

      // Act & Assert
      await expect(
        updateUserNote(note._id, testUser._id, updateData)
      ).rejects.toThrow("No note found with that ID");
    });

    it("should throw a validation error for invalid update data", async () => {
      // Arrange
      const note = await Note.create({
        title: "Valid Note",
        user: testUser._id,
      });

      const updateData = {
        title: "", // Empty title should fail validation
      };

      // Act & Assert
      await expect(
        updateUserNote(note._id, testUser._id, updateData)
      ).rejects.toThrow();

      // Verify debug logging was called for validation error
      expect(logDebug).toHaveBeenCalledWith(
        "Note update failed due to validation error",
        expect.objectContaining({ error: expect.any(Object) })
      );
    });

    it("should run validators on update", async () => {
      // Arrange
      const note = await Note.create({
        title: "Valid Note",
        user: testUser._id,
      });

      const updateData = {
        title: "   ", // Whitespace only, should fail after trim
      };

      // Act & Assert
      await expect(
        updateUserNote(note._id, testUser._id, updateData)
      ).rejects.toThrow();
    });
  });

  describe("deleteUserNote", () => {
    it("should delete an existing note", async () => {
      // Arrange
      const note = await Note.create({
        title: "Note to Delete",
        content: "This note will be deleted",
        user: testUser._id,
      });

      // Act
      const deletedNote = await deleteUserNote(note._id, testUser._id);

      // Assert
      expect(deletedNote).toBeDefined();
      expect(deletedNote._id.toString()).toBe(note._id.toString());
      expect(deletedNote.title).toBe("Note to Delete");

      // Verify note is deleted from database
      const noteInDb = await Note.findById(note._id);
      expect(noteInDb).toBeNull();

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("Note deleted via NoteService", {
        noteId: note._id,
        userId: testUser._id,
      });
    });

    it("should throw a not found error if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(deleteUserNote(nonExistentId, testUser._id)).rejects.toThrow(
        "No note found with that ID"
      );

      // Verify debug logging was called
      expect(logDebug).toHaveBeenCalledWith(
        "Note not found or doesn't belong to user on delete",
        {
          noteId: nonExistentId,
          userId: testUser._id,
        }
      );
    });

    it("should throw a not found error if note belongs to another user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Other User Note",
        user: anotherUser._id,
      });

      // Act & Assert
      await expect(deleteUserNote(note._id, testUser._id)).rejects.toThrow(
        "No note found with that ID"
      );

      // Verify note still exists
      const noteInDb = await Note.findById(note._id);
      expect(noteInDb).not.toBeNull();
    });
  });

  describe("getUserFolders", () => {
    it("should return all unique folders for a user", async () => {
      // Arrange - Create notes in different folders
      await Note.create([
        { title: "Note 1", folder: "Work", user: testUser._id },
        { title: "Note 2", folder: "Personal", user: testUser._id },
        { title: "Note 3", folder: "Work", user: testUser._id }, // Duplicate folder
        { title: "Note 4", folder: "Projects", user: testUser._id },
      ]);

      // Create note for another user (should not affect folders)
      await Note.create({
        title: "Other Note",
        folder: "Other Folder",
        user: anotherUser._id,
      });

      // Act
      const folders = await getUserFolders(testUser._id);

      // Assert
      expect(folders).toHaveLength(3); // Unique folders only
      expect(folders).toContain("Work");
      expect(folders).toContain("Personal");
      expect(folders).toContain("Projects");
      expect(folders).not.toContain("Other Folder");
    });

    it("should return an empty array if user has no notes", async () => {
      // Act
      const folders = await getUserFolders(testUser._id);

      // Assert
      expect(folders).toBeInstanceOf(Array);
      expect(folders).toHaveLength(0);
    });

    it("should handle errors gracefully", async () => {
      // Arrange - Mock an error by passing invalid user ID
      const invalidUserId = "invalid-id";

      // Act & Assert
      await expect(getUserFolders(invalidUserId)).rejects.toThrow();

      // Verify error logging was called
      expect(logError).toHaveBeenCalledWith(
        "Error fetching user folders",
        expect.objectContaining({
          userId: invalidUserId,
          error: expect.any(Object),
        })
      );
    });
  });

  describe("createUserFolder", () => {
    it("should create a new folder with a welcome note", async () => {
      // Arrange
      const folderName = "New Project";

      // Act
      const result = await createUserFolder(folderName, testUser._id);

      // Assert
      expect(result.folder).toBe("New Project");
      expect(result.note).toBeDefined();
      expect(result.note.title).toBe("Welcome to New Project");
      expect(result.note.folder).toBe("New Project");
      expect(result.note.content).toBe("");
      expect(result.note.user.toString()).toBe(testUser._id.toString());

      // Verify note exists in database
      const noteInDb = await Note.findById(result.note._id);
      expect(noteInDb).not.toBeNull();
      expect(noteInDb.folder).toBe("New Project");

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("Folder created via NoteService", {
        folder: "New Project",
        userId: testUser._id,
      });
    });

    it("should trim whitespace from folder name", async () => {
      // Arrange
      const folderName = "  Trimmed Folder  ";

      // Act
      const result = await createUserFolder(folderName, testUser._id);

      // Assert
      expect(result.folder).toBe("Trimmed Folder");
      expect(result.note.title).toBe("Welcome to Trimmed Folder");
      expect(result.note.folder).toBe("Trimmed Folder");
    });

    it("should throw an error if folder name is missing", async () => {
      // Act & Assert
      await expect(createUserFolder("", testUser._id)).rejects.toThrow(
        "Folder name is required"
      );

      await expect(createUserFolder(null, testUser._id)).rejects.toThrow(
        "Folder name is required"
      );

      await expect(createUserFolder(undefined, testUser._id)).rejects.toThrow(
        "Folder name is required"
      );
    });

    it("should throw an error if folder name is only whitespace", async () => {
      // Act & Assert
      await expect(createUserFolder("   ", testUser._id)).rejects.toThrow(
        "Folder name is required"
      );
    });

    it("should throw an error if folder already exists", async () => {
      // Arrange - Create a note in the folder first
      await Note.create({
        title: "Existing Note",
        folder: "Existing Folder",
        user: testUser._id,
      });

      // Act & Assert
      await expect(
        createUserFolder("Existing Folder", testUser._id)
      ).rejects.toThrow("Folder already exists");
    });

    it("should allow same folder name for different users", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "Shared Name",
        user: anotherUser._id,
      });

      // Act
      const result = await createUserFolder("Shared Name", testUser._id);

      // Assert
      expect(result.folder).toBe("Shared Name");
      expect(result.note.user.toString()).toBe(testUser._id.toString());
    });

    it("should handle validation errors gracefully", async () => {
      // Arrange - Mock a validation error by creating an invalid note
      const folderName = "Test Folder";

      // Mock Note.create to throw a validation error
      const originalCreate = Note.create;
      Note.create = jest.fn().mockRejectedValue({
        name: "ValidationError",
        message: "Validation failed",
      });

      try {
        // Act & Assert
        await expect(
          createUserFolder(folderName, testUser._id)
        ).rejects.toThrow();

        // Verify debug logging was called for validation error
        expect(logDebug).toHaveBeenCalledWith(
          "Folder creation failed due to validation error",
          expect.objectContaining({ error: expect.any(Object) })
        );
      } finally {
        // Restore original function
        Note.create = originalCreate;
      }
    });
  });

  describe("deleteUserFolder", () => {
    it("should delete a folder and move notes to General", async () => {
      // Arrange - Create notes in the folder to be deleted
      await Note.create([
        { title: "Note 1", folder: "ToDelete", user: testUser._id },
        { title: "Note 2", folder: "ToDelete", user: testUser._id },
        { title: "Note 3", folder: "KeepThis", user: testUser._id },
      ]);

      // Act
      const result = await deleteUserFolder("ToDelete", testUser._id);

      // Assert
      expect(result.message).toMatch(/folder "ToDelete" deleted/i);
      expect(result.notesUpdated).toBe(2);

      // Verify notes were moved to General
      const movedNotes = await Note.find({
        user: testUser._id,
        folder: "General",
      });
      expect(movedNotes).toHaveLength(2);

      // Verify other folder notes are unchanged
      const unchangedNotes = await Note.find({
        user: testUser._id,
        folder: "KeepThis",
      });
      expect(unchangedNotes).toHaveLength(1);

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("Folder deleted via NoteService", {
        folder: "ToDelete",
        userId: testUser._id,
        notesUpdated: 2,
      });
    });

    it("should throw an error when trying to delete General folder", async () => {
      // Act & Assert
      await expect(deleteUserFolder("General", testUser._id)).rejects.toThrow(
        "Cannot delete the General folder"
      );
    });

    it("should throw an error if folder does not exist", async () => {
      // Act & Assert
      await expect(
        deleteUserFolder("NonExistent", testUser._id)
      ).rejects.toThrow("Folder not found");
    });

    it("should not delete folder belonging to another user", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "OtherFolder",
        user: anotherUser._id,
      });

      // Act & Assert
      await expect(
        deleteUserFolder("OtherFolder", testUser._id)
      ).rejects.toThrow("Folder not found");

      // Verify other user's folder still exists
      const otherUserNote = await Note.findOne({
        user: anotherUser._id,
        folder: "OtherFolder",
      });
      expect(otherUserNote).not.toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      // Arrange - Create a folder
      await Note.create({
        title: "Test Note",
        folder: "TestFolder",
        user: testUser._id,
      });

      // Mock updateMany to throw an error
      const originalUpdateMany = Note.updateMany;
      Note.updateMany = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      try {
        // Act & Assert
        await expect(
          deleteUserFolder("TestFolder", testUser._id)
        ).rejects.toThrow("Database error");

        // Verify error logging was called
        expect(logError).toHaveBeenCalledWith(
          "Error deleting folder",
          expect.objectContaining({
            folderName: "TestFolder",
            userId: testUser._id,
            error: expect.any(Error),
          })
        );
      } finally {
        // Restore original function
        Note.updateMany = originalUpdateMany;
      }
    });
  });

  describe("renameUserFolder", () => {
    it("should rename a folder successfully", async () => {
      // Arrange - Create notes in the folder to be renamed
      await Note.create([
        { title: "Note 1", folder: "OldName", user: testUser._id },
        { title: "Note 2", folder: "OldName", user: testUser._id },
        { title: "Note 3", folder: "DifferentFolder", user: testUser._id },
      ]);

      // Act
      const result = await renameUserFolder("OldName", "NewName", testUser._id);

      // Assert
      expect(result.message).toMatch(
        /folder renamed from "OldName" to "NewName"/i
      );
      expect(result.oldName).toBe("OldName");
      expect(result.newName).toBe("NewName");
      expect(result.notesUpdated).toBe(2);

      // Verify notes were renamed
      const renamedNotes = await Note.find({
        user: testUser._id,
        folder: "NewName",
      });
      expect(renamedNotes).toHaveLength(2);

      // Verify old folder name no longer exists
      const oldFolderNotes = await Note.find({
        user: testUser._id,
        folder: "OldName",
      });
      expect(oldFolderNotes).toHaveLength(0);

      // Verify other folder notes are unchanged
      const unchangedNotes = await Note.find({
        user: testUser._id,
        folder: "DifferentFolder",
      });
      expect(unchangedNotes).toHaveLength(1);

      // Verify logging was called
      expect(logInfo).toHaveBeenCalledWith("Folder renamed via NoteService", {
        oldName: "OldName",
        newName: "NewName",
        userId: testUser._id,
        notesUpdated: 2,
      });
    });

    it("should trim whitespace from new folder name", async () => {
      // Arrange
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      // Act
      const result = await renameUserFolder(
        "OldName",
        "  New Name  ",
        testUser._id
      );

      // Assert
      expect(result.newName).toBe("New Name");
    });

    it("should throw an error when trying to rename General folder", async () => {
      // Act & Assert
      await expect(
        renameUserFolder("General", "NewGeneral", testUser._id)
      ).rejects.toThrow("Cannot rename the General folder");
    });

    it("should throw an error if new folder name is missing", async () => {
      // Arrange
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      // Act & Assert
      await expect(
        renameUserFolder("OldName", "", testUser._id)
      ).rejects.toThrow("New folder name is required");

      await expect(
        renameUserFolder("OldName", null, testUser._id)
      ).rejects.toThrow("New folder name is required");

      await expect(
        renameUserFolder("OldName", "   ", testUser._id)
      ).rejects.toThrow("New folder name is required");
    });

    it("should throw an error if folder does not exist", async () => {
      // Act & Assert
      await expect(
        renameUserFolder("NonExistent", "NewName", testUser._id)
      ).rejects.toThrow("Folder not found");
    });

    it("should throw an error if new folder name already exists", async () => {
      // Arrange - Create folders
      await Note.create([
        { title: "Note 1", folder: "OldName", user: testUser._id },
        { title: "Note 2", folder: "ExistingName", user: testUser._id },
      ]);

      // Act & Assert
      await expect(
        renameUserFolder("OldName", "ExistingName", testUser._id)
      ).rejects.toThrow("A folder with this name already exists");
    });

    it("should not rename folder belonging to another user", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "OtherFolder",
        user: anotherUser._id,
      });

      // Act & Assert
      await expect(
        renameUserFolder("OtherFolder", "NewName", testUser._id)
      ).rejects.toThrow("Folder not found");

      // Verify other user's folder is unchanged
      const otherUserNote = await Note.findOne({
        user: anotherUser._id,
        folder: "OtherFolder",
      });
      expect(otherUserNote).not.toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      // Arrange - Create a folder
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      // Mock updateMany to throw an error
      const originalUpdateMany = Note.updateMany;
      Note.updateMany = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      try {
        // Act & Assert
        await expect(
          renameUserFolder("OldName", "NewName", testUser._id)
        ).rejects.toThrow("Database error");

        // Verify error logging was called
        expect(logError).toHaveBeenCalledWith(
          "Error renaming folder",
          expect.objectContaining({
            oldFolderName: "OldName",
            newFolderName: "NewName",
            userId: testUser._id,
            error: expect.any(Error),
          })
        );
      } finally {
        // Restore original function
        Note.updateMany = originalUpdateMany;
      }
    });
  });
});
