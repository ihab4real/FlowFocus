import request from "supertest";
import mongoose from "mongoose";
import User from "../../../models/userModel.js";
import Note from "../../../models/noteModel.js";
import { generateAccessToken } from "../../../services/tokenService.js";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  jest,
} from "@jest/globals";

// This will ensure all tests in this file share the in-memory MongoDB
import "../../setup/db.js";

// Import app after mocks are set up
let app;

describe("Notes API Endpoints", () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;

  // Initialize app once before all tests
  beforeAll(async () => {
    app = (await import("../../../app.js")).app;
  });

  // Setup: Create test users and authenticate them before each test
  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      name: "Test Notes User",
      email: "notes-test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    anotherUser = await User.create({
      name: "Another Notes User",
      email: "another-notes@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    // Generate tokens for both users
    userToken = generateAccessToken(testUser._id);
    anotherUserToken = generateAccessToken(anotherUser._id);
  });

  describe("POST /api/notes", () => {
    it("should create a new note when authenticated", async () => {
      // Arrange
      const newNote = {
        title: "Test API Note",
        content: "This is a test note created via API",
        folder: "Work",
        tags: ["test", "api"],
      };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.note).toBeDefined();
      expect(response.body.data.note.title).toBe(newNote.title);
      expect(response.body.data.note.content).toBe(newNote.content);
      expect(response.body.data.note.folder).toBe(newNote.folder);
      expect(response.body.data.note.tags).toEqual(newNote.tags);
      expect(response.body.data.note.user.toString()).toBe(
        testUser._id.toString()
      );

      // Verify note exists in database
      const noteInDb = await Note.findById(response.body.data.note._id);
      expect(noteInDb).not.toBeNull();
      expect(noteInDb.title).toBe(newNote.title);
    });

    it("should create a note with default folder when folder not specified", async () => {
      // Arrange
      const newNote = {
        title: "Note without folder",
        content: "This note should go to General folder",
      };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.data.note.folder).toBe("General");
    });

    it("should create a note with empty content when content not specified", async () => {
      // Arrange
      const newNote = {
        title: "Note without content",
      };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.data.note.content).toBe("");
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const newNote = { title: "Unauthenticated Note" };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });

    it("should return 400 if title is missing", async () => {
      // Arrange
      const newNote = {
        // Missing title
        content: "Note without title",
      };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/title.*required/i);
    });

    it("should trim whitespace from title and folder", async () => {
      // Arrange
      const newNote = {
        title: "  Trimmed Title  ",
        folder: "  Work Folder  ",
        content: "Test content",
      };

      // Act
      const response = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newNote)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.data.note.title).toBe("Trimmed Title");
      expect(response.body.data.note.folder).toBe("Work Folder");
    });
  });

  describe("GET /api/notes", () => {
    it("should return all notes for the authenticated user", async () => {
      // Arrange - Create notes for test user
      await Note.create([
        {
          title: "User Note 1",
          content: "First note content",
          folder: "Work",
          user: testUser._id,
        },
        {
          title: "User Note 2",
          content: "Second note content",
          folder: "Personal",
          user: testUser._id,
        },
      ]);

      // Create a note for another user (should not be returned)
      await Note.create({
        title: "Other User Note",
        content: "Other user content",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .get("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data.notes).toHaveLength(2);

      // Check that we only got the current user's notes
      const noteTitles = response.body.data.notes.map((note) => note.title);
      expect(noteTitles).toContain("User Note 1");
      expect(noteTitles).toContain("User Note 2");
      expect(noteTitles).not.toContain("Other User Note");
    });

    it("should return an empty array if user has no notes", async () => {
      // Act
      const response = await request(app)
        .get("/api/notes")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data.notes).toHaveLength(0);
    });

    it("should return 401 if not authenticated", async () => {
      // Act
      const response = await request(app)
        .get("/api/notes")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("GET /api/notes/:id", () => {
    it("should return a specific note for the authenticated user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Specific Note",
        content: "Get this specific note",
        folder: "Work",
        tags: ["important"],
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .get(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.note).toBeDefined();
      expect(response.body.data.note._id).toBe(note._id.toString());
      expect(response.body.data.note.title).toBe("Specific Note");
      expect(response.body.data.note.content).toBe("Get this specific note");
      expect(response.body.data.note.folder).toBe("Work");
      expect(response.body.data.note.tags).toEqual(["important"]);
    });

    it("should return 404 if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act
      const response = await request(app)
        .get(`/api/notes/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);
    });

    it("should return 404 if note belongs to another user", async () => {
      // Arrange - Create note for another user
      const note = await Note.create({
        title: "Other User Note",
        content: "This belongs to another user",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .get(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);
    });

    it("should return 400 for invalid note ID format", async () => {
      // Act
      const response = await request(app)
        .get("/api/notes/invalid-id")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/invalid.*_id/i);
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const note = await Note.create({
        title: "Test Note",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .get(`/api/notes/${note._id}`)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("PATCH /api/notes/:id", () => {
    it("should update a note successfully", async () => {
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
      const response = await request(app)
        .patch(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe(updateData.content);
      expect(response.body.data.note.folder).toBe(updateData.folder);
      expect(response.body.data.note.tags).toEqual(updateData.tags);

      // Verify in database
      const updatedNote = await Note.findById(note._id);
      expect(updatedNote.title).toBe(updateData.title);
      expect(updatedNote.updatedAt).not.toEqual(note.updatedAt);
    });

    it("should update only specified fields", async () => {
      // Arrange
      const note = await Note.create({
        title: "Original Title",
        content: "Original content",
        folder: "Work",
        user: testUser._id,
      });

      const updateData = {
        title: "Updated Title Only",
      };

      // Act
      const response = await request(app)
        .patch(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe("Original content"); // Unchanged
      expect(response.body.data.note.folder).toBe("Work"); // Unchanged
    });

    it("should return 404 if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: "Updated Title" };

      // Act
      const response = await request(app)
        .patch(`/api/notes/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);
    });

    it("should return 404 if note belongs to another user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Other User Note",
        user: anotherUser._id,
      });

      const updateData = { title: "Trying to update" };

      // Act
      const response = await request(app)
        .patch(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);
    });

    it("should return 400 for validation errors", async () => {
      // Arrange
      const note = await Note.create({
        title: "Valid Note",
        user: testUser._id,
      });

      const updateData = {
        title: "", // Empty title should fail validation
      };

      // Act
      const response = await request(app)
        .patch(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const note = await Note.create({
        title: "Test Note",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .patch(`/api/notes/${note._id}`)
        .send({ title: "Updated" })
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should delete a note successfully", async () => {
      // Arrange
      const note = await Note.create({
        title: "Note to Delete",
        content: "This note will be deleted",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .delete(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(204);

      // Assert
      // Verify note is deleted from database
      const deletedNote = await Note.findById(note._id);
      expect(deletedNote).toBeNull();
    });

    it("should return 404 if note does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act
      const response = await request(app)
        .delete(`/api/notes/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);
    });

    it("should return 404 if note belongs to another user", async () => {
      // Arrange
      const note = await Note.create({
        title: "Other User Note",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .delete(`/api/notes/${note._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no note found with that id/i);

      // Verify note still exists
      const stillExists = await Note.findById(note._id);
      expect(stillExists).not.toBeNull();
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const note = await Note.create({
        title: "Test Note",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .delete(`/api/notes/${note._id}`)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("GET /api/notes/folders", () => {
    it("should return all folders for the authenticated user", async () => {
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
      const response = await request(app)
        .get("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.folders).toHaveLength(3); // Unique folders only
      expect(response.body.data.folders).toContain("Work");
      expect(response.body.data.folders).toContain("Personal");
      expect(response.body.data.folders).toContain("Projects");
      expect(response.body.data.folders).not.toContain("Other Folder");
    });

    it("should return empty array if user has no notes", async () => {
      // Act
      const response = await request(app)
        .get("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.folders).toHaveLength(0);
    });

    it("should return 401 if not authenticated", async () => {
      // Act
      const response = await request(app)
        .get("/api/notes/folders")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("POST /api/notes/folders", () => {
    it("should create a new folder with a welcome note", async () => {
      // Arrange
      const folderData = { name: "New Project" };

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.folder).toBe("New Project");
      expect(response.body.data.note).toBeDefined();
      expect(response.body.data.note.title).toBe("Welcome to New Project");
      expect(response.body.data.note.folder).toBe("New Project");
      expect(response.body.data.note.user.toString()).toBe(
        testUser._id.toString()
      );

      // Verify note exists in database
      const noteInDb = await Note.findById(response.body.data.note._id);
      expect(noteInDb).not.toBeNull();
      expect(noteInDb.folder).toBe("New Project");
    });

    it("should trim whitespace from folder name", async () => {
      // Arrange
      const folderData = { name: "  Trimmed Folder  " };

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.data.folder).toBe("Trimmed Folder");
      expect(response.body.data.note.title).toBe("Welcome to Trimmed Folder");
    });

    it("should return 400 if folder name is missing", async () => {
      // Arrange
      const folderData = {}; // Missing name

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder name is required/i);
    });

    it("should return 400 if folder name is empty string", async () => {
      // Arrange
      const folderData = { name: "   " }; // Empty after trim

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder name is required/i);
    });

    it("should return 400 if folder already exists", async () => {
      // Arrange - Create a note in the folder first
      await Note.create({
        title: "Existing Note",
        folder: "Existing Folder",
        user: testUser._id,
      });

      const folderData = { name: "Existing Folder" };

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder already exists/i);
    });

    it("should allow same folder name for different users", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "Shared Name",
        user: anotherUser._id,
      });

      const folderData = { name: "Shared Name" };

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .set("Authorization", `Bearer ${userToken}`)
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.folder).toBe("Shared Name");
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const folderData = { name: "New Folder" };

      // Act
      const response = await request(app)
        .post("/api/notes/folders")
        .send(folderData)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("DELETE /api/notes/folders/:name", () => {
    it("should delete a folder and move notes to General", async () => {
      // Arrange - Create notes in the folder to be deleted
      await Note.create([
        { title: "Note 1", folder: "ToDelete", user: testUser._id },
        { title: "Note 2", folder: "ToDelete", user: testUser._id },
        { title: "Note 3", folder: "KeepThis", user: testUser._id },
      ]);

      // Act
      const response = await request(app)
        .delete("/api/notes/folders/ToDelete")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toMatch(/folder "ToDelete" deleted/i);
      expect(response.body.data.notesUpdated).toBe(2);

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
    });

    it("should return 400 when trying to delete General folder", async () => {
      // Act
      const response = await request(app)
        .delete("/api/notes/folders/General")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(
        /cannot delete the general folder/i
      );
    });

    it("should return 404 if folder does not exist", async () => {
      // Act
      const response = await request(app)
        .delete("/api/notes/folders/NonExistent")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder not found/i);
    });

    it("should not delete folder belonging to another user", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "OtherFolder",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .delete("/api/notes/folders/OtherFolder")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder not found/i);

      // Verify other user's folder still exists
      const otherUserNote = await Note.findOne({
        user: anotherUser._id,
        folder: "OtherFolder",
      });
      expect(otherUserNote).not.toBeNull();
    });

    it("should return 401 if not authenticated", async () => {
      // Act
      const response = await request(app)
        .delete("/api/notes/folders/SomeFolder")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("PATCH /api/notes/folders/:name", () => {
    it("should rename a folder successfully", async () => {
      // Arrange - Create notes in the folder to be renamed
      await Note.create([
        { title: "Note 1", folder: "OldName", user: testUser._id },
        { title: "Note 2", folder: "OldName", user: testUser._id },
        { title: "Note 3", folder: "DifferentFolder", user: testUser._id },
      ]);

      const renameData = { name: "NewName" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OldName")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toMatch(
        /folder renamed from "OldName" to "NewName"/i
      );
      expect(response.body.data.oldName).toBe("OldName");
      expect(response.body.data.newName).toBe("NewName");
      expect(response.body.data.notesUpdated).toBe(2);

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
    });

    it("should trim whitespace from new folder name", async () => {
      // Arrange
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      const renameData = { name: "  New Name  " };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OldName")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.data.newName).toBe("New Name");
    });

    it("should return 400 when trying to rename General folder", async () => {
      // Arrange
      const renameData = { name: "NewGeneral" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/General")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(
        /cannot rename the general folder/i
      );
    });

    it("should return 400 if new folder name is missing", async () => {
      // Arrange
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      const renameData = {}; // Missing name

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OldName")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/new folder name is required/i);
    });

    it("should return 400 if new folder name is empty", async () => {
      // Arrange
      await Note.create({
        title: "Test Note",
        folder: "OldName",
        user: testUser._id,
      });

      const renameData = { name: "   " }; // Empty after trim

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OldName")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/new folder name is required/i);
    });

    it("should return 404 if folder does not exist", async () => {
      // Arrange
      const renameData = { name: "NewName" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/NonExistent")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder not found/i);
    });

    it("should return 400 if new folder name already exists", async () => {
      // Arrange - Create folders
      await Note.create([
        { title: "Note 1", folder: "OldName", user: testUser._id },
        { title: "Note 2", folder: "ExistingName", user: testUser._id },
      ]);

      const renameData = { name: "ExistingName" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OldName")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(
        /a folder with this name already exists/i
      );
    });

    it("should not rename folder belonging to another user", async () => {
      // Arrange - Create folder for another user
      await Note.create({
        title: "Other User Note",
        folder: "OtherFolder",
        user: anotherUser._id,
      });

      const renameData = { name: "NewName" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/OtherFolder")
        .set("Authorization", `Bearer ${userToken}`)
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/folder not found/i);

      // Verify other user's folder is unchanged
      const otherUserNote = await Note.findOne({
        user: anotherUser._id,
        folder: "OtherFolder",
      });
      expect(otherUserNote).not.toBeNull();
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const renameData = { name: "NewName" };

      // Act
      const response = await request(app)
        .patch("/api/notes/folders/SomeFolder")
        .send(renameData)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });
});
