import mongoose from "mongoose";
import Note from "../../../../../models/noteModel.js";
import User from "../../../../../models/userModel.js";
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

describe("Note Model", () => {
  let testUser;

  // Setup: Create a test user before each test
  beforeEach(async () => {
    testUser = await User.create({
      name: "Test User",
      email: "notemodel@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });
  });

  describe("Schema Validation", () => {
    it("should create a note with all required fields", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        content: "This is test content",
        folder: "Work",
        tags: ["test", "important"],
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(noteData.content);
      expect(note.folder).toBe(noteData.folder);
      expect(note.tags).toEqual(noteData.tags);
      expect(note.user.toString()).toBe(testUser._id.toString());
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
    });

    it("should create a note with only title and user (required fields)", async () => {
      // Arrange
      const noteData = {
        title: "Minimal Note",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(""); // Default value
      expect(note.folder).toBe("General"); // Default value
      expect(note.tags).toEqual([]); // Default value
      expect(note.user.toString()).toBe(testUser._id.toString());
    });

    it("should fail validation if title is missing", async () => {
      // Arrange
      const noteData = {
        content: "Content without title",
        user: testUser._id,
      };

      // Act & Assert
      await expect(Note.create(noteData)).rejects.toThrow(/title.*required/i);
    });

    it("should fail validation if user is missing", async () => {
      // Arrange
      const noteData = {
        title: "Note without user",
        content: "This note has no user",
      };

      // Act & Assert
      await expect(Note.create(noteData)).rejects.toThrow(/user.*required/i);
    });

    it("should fail validation if title is empty string", async () => {
      // Arrange
      const noteData = {
        title: "",
        user: testUser._id,
      };

      // Act & Assert
      await expect(Note.create(noteData)).rejects.toThrow();
    });

    it("should fail validation if title is only whitespace", async () => {
      // Arrange
      const noteData = {
        title: "   ",
        user: testUser._id,
      };

      // Act & Assert
      await expect(Note.create(noteData)).rejects.toThrow();
    });

    it("should fail validation if user is not a valid ObjectId", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        user: "invalid-user-id",
      };

      // Act & Assert
      await expect(Note.create(noteData)).rejects.toThrow();
    });
  });

  describe("Default Values", () => {
    it("should set default content to empty string", async () => {
      // Arrange
      const noteData = {
        title: "Note without content",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.content).toBe("");
    });

    it("should set default folder to 'General'", async () => {
      // Arrange
      const noteData = {
        title: "Note without folder",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.folder).toBe("General");
    });

    it("should set default tags to empty array", async () => {
      // Arrange
      const noteData = {
        title: "Note without tags",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.tags).toEqual([]);
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      // Arrange
      const noteData = {
        title: "Timestamped Note",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
      expect(note.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(note.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("Field Trimming", () => {
    it("should trim whitespace from title", async () => {
      // Arrange
      const noteData = {
        title: "  Trimmed Title  ",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.title).toBe("Trimmed Title");
    });

    it("should trim whitespace from folder", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        folder: "  Work Folder  ",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.folder).toBe("Work Folder");
    });

    it("should trim whitespace from tags", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        tags: ["  tag1  ", "  tag2  ", "tag3"],
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should not trim content (preserve formatting)", async () => {
      // Arrange
      const noteData = {
        title: "Test Note",
        content: "  This content should preserve  \n  whitespace  ",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.content).toBe(
        "  This content should preserve  \n  whitespace  "
      );
    });
  });

  describe("Pre-save Middleware", () => {
    it("should update updatedAt timestamp on save", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        user: testUser._id,
      });

      const originalUpdatedAt = note.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      note.title = "Updated Title";
      await note.save();

      // Assert
      expect(note.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it("should update updatedAt timestamp on multiple saves", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        user: testUser._id,
      });

      const timestamps = [note.updatedAt];

      // Act - Save multiple times
      for (let i = 1; i <= 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        note.title = `Updated Title ${i}`;
        await note.save();
        timestamps.push(note.updatedAt);
      }

      // Assert - Each timestamp should be greater than the previous
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThan(
          timestamps[i - 1].getTime()
        );
      }
    });

    it("should not change createdAt timestamp on update", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        user: testUser._id,
      });

      const originalCreatedAt = note.createdAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      note.title = "Updated Title";
      await note.save();

      // Assert
      expect(note.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe("Data Types and Constraints", () => {
    it("should accept valid tag arrays", async () => {
      // Arrange
      const noteData = {
        title: "Tagged Note",
        tags: ["work", "important", "project-alpha"],
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.tags).toEqual(["work", "important", "project-alpha"]);
    });

    it("should accept empty tag array", async () => {
      // Arrange
      const noteData = {
        title: "Untagged Note",
        tags: [],
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.tags).toEqual([]);
    });

    it("should handle long content", async () => {
      // Arrange
      const longContent = "A".repeat(10000); // 10KB of content
      const noteData = {
        title: "Long Note",
        content: longContent,
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.content).toBe(longContent);
      expect(note.content.length).toBe(10000);
    });

    it("should handle special characters in title and content", async () => {
      // Arrange
      const noteData = {
        title: "Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?",
        content: "Content with émojis 🚀 and unicode: ñáéíóú",
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.title).toBe("Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?");
      expect(note.content).toBe("Content with émojis 🚀 and unicode: ñáéíóú");
    });

    it("should handle HTML content", async () => {
      // Arrange
      const htmlContent =
        "<h1>Title</h1><p>This is <strong>bold</strong> text.</p>";
      const noteData = {
        title: "HTML Note",
        content: htmlContent,
        user: testUser._id,
      };

      // Act
      const note = await Note.create(noteData);

      // Assert
      expect(note.content).toBe(htmlContent);
    });
  });

  describe("User Reference", () => {
    it("should populate user reference", async () => {
      // Arrange
      const note = await Note.create({
        title: "Test Note",
        user: testUser._id,
      });

      // Act
      const populatedNote = await Note.findById(note._id).populate("user");

      // Assert
      expect(populatedNote.user).toBeDefined();
      expect(populatedNote.user.name).toBe(testUser.name);
      expect(populatedNote.user.email).toBe(testUser.email);
    });

    it("should maintain user reference integrity", async () => {
      // Arrange
      const note = await Note.create({
        title: "Test Note",
        user: testUser._id,
      });

      // Act - Delete the user
      await User.findByIdAndDelete(testUser._id);

      // Try to find the note
      const orphanedNote = await Note.findById(note._id);

      // Assert - Note should still exist but user reference will be invalid
      expect(orphanedNote).not.toBeNull();
      expect(orphanedNote.user.toString()).toBe(testUser._id.toString());
    });
  });

  describe("Query Operations", () => {
    it("should find notes by user", async () => {
      // Arrange - Create multiple notes for the user
      await Note.create([
        { title: "Note 1", user: testUser._id },
        { title: "Note 2", user: testUser._id },
        { title: "Note 3", user: testUser._id },
      ]);

      // Act
      const userNotes = await Note.find({ user: testUser._id });

      // Assert
      expect(userNotes).toHaveLength(3);
      userNotes.forEach((note) => {
        expect(note.user.toString()).toBe(testUser._id.toString());
      });
    });

    it("should find notes by folder", async () => {
      // Arrange - Create notes in different folders
      await Note.create([
        { title: "Work Note 1", folder: "Work", user: testUser._id },
        { title: "Work Note 2", folder: "Work", user: testUser._id },
        { title: "Personal Note", folder: "Personal", user: testUser._id },
      ]);

      // Act
      const workNotes = await Note.find({ user: testUser._id, folder: "Work" });

      // Assert
      expect(workNotes).toHaveLength(2);
      workNotes.forEach((note) => {
        expect(note.folder).toBe("Work");
      });
    });

    it("should find notes by tags", async () => {
      // Arrange - Create notes with different tags
      await Note.create([
        {
          title: "Important Note 1",
          tags: ["important", "work"],
          user: testUser._id,
        },
        {
          title: "Important Note 2",
          tags: ["important", "personal"],
          user: testUser._id,
        },
        { title: "Regular Note", tags: ["work"], user: testUser._id },
      ]);

      // Act
      const importantNotes = await Note.find({
        user: testUser._id,
        tags: { $in: ["important"] },
      });

      // Assert
      expect(importantNotes).toHaveLength(2);
      importantNotes.forEach((note) => {
        expect(note.tags).toContain("important");
      });
    });

    it("should sort notes by creation date", async () => {
      // Arrange - Create notes with delays to ensure different timestamps
      const note1 = await Note.create({
        title: "First Note",
        user: testUser._id,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      const note2 = await Note.create({
        title: "Second Note",
        user: testUser._id,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      const note3 = await Note.create({
        title: "Third Note",
        user: testUser._id,
      });

      // Act - Sort by createdAt descending (newest first)
      const sortedNotes = await Note.find({ user: testUser._id }).sort({
        createdAt: -1,
      });

      // Assert
      expect(sortedNotes).toHaveLength(3);
      expect(sortedNotes[0].title).toBe("Third Note");
      expect(sortedNotes[1].title).toBe("Second Note");
      expect(sortedNotes[2].title).toBe("First Note");
    });
  });

  describe("Update Operations", () => {
    it("should update note fields correctly", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        content: "Original content",
        folder: "Work",
        tags: ["old"],
        user: testUser._id,
      });

      // Act
      const updatedNote = await Note.findByIdAndUpdate(
        note._id,
        {
          title: "Updated Title",
          content: "Updated content",
          folder: "Personal",
          tags: ["new", "updated"],
        },
        { new: true, runValidators: true }
      );

      // Assert
      expect(updatedNote.title).toBe("Updated Title");
      expect(updatedNote.content).toBe("Updated content");
      expect(updatedNote.folder).toBe("Personal");
      expect(updatedNote.tags).toEqual(["new", "updated"]);
    });

    it("should run validators on update", async () => {
      // Arrange
      const note = await Note.create({
        title: "Valid Note",
        user: testUser._id,
      });

      // Act & Assert
      await expect(
        Note.findByIdAndUpdate(
          note._id,
          { title: "" }, // Invalid empty title
          { runValidators: true }
        )
      ).rejects.toThrow();
    });

    it("should allow partial updates", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        content: "Original content",
        folder: "Work",
        user: testUser._id,
      });

      // Act
      const updatedNote = await Note.findByIdAndUpdate(
        note._id,
        { title: "Updated Title Only" },
        { new: true }
      );

      // Assert
      expect(updatedNote.title).toBe("Updated Title Only");
      expect(updatedNote.content).toBe("Original content"); // Unchanged
      expect(updatedNote.folder).toBe("Work"); // Unchanged
    });
  });
});
