import request from "supertest";
import mongoose from "mongoose";
import User from "../../../models/userModel.js";
import Task from "../../../models/taskModel.js";
import { generateAccessToken } from "../../../services/tokenService.js";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";

// This will ensure all tests in this file share the in-memory MongoDB
import "../../setup/db.js";

// Import app after mocks are set up
let app;

describe("Task API Endpoints", () => {
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
      name: "Test Task User",
      email: "task-test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    anotherUser = await User.create({
      name: "Another Task User",
      email: "another-task@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    // Generate tokens for both users
    userToken = generateAccessToken(testUser._id);
    anotherUserToken = generateAccessToken(anotherUser._id);
  });

  describe("POST /api/tasks", () => {
    it("should create a new task when authenticated", async () => {
      // Arrange
      const newTask = {
        title: "Test API Task",
        description: "This is a test task created via API",
        status: "Todo",
        priority: "Medium",
        tags: ["test", "api"],
      };

      // Act
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newTask)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(newTask.title);
      expect(response.body.data.description).toBe(newTask.description);
      expect(response.body.data.user.toString()).toBe(testUser._id.toString());

      // Verify task exists in database
      const taskInDb = await Task.findById(response.body.data._id);
      expect(taskInDb).not.toBeNull();
    });

    it("should return 401 if not authenticated", async () => {
      // Arrange
      const newTask = { title: "Unauthenticated Task" };

      // Act
      const response = await request(app)
        .post("/api/tasks")
        .send(newTask)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });

    it("should return 400 if title is missing", async () => {
      // Arrange
      const newTask = {
        // Missing title
        description: "Task without title",
      };

      // Act
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newTask)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/title is required/i);
    });
  });

  describe("GET /api/tasks", () => {
    it("should return all tasks for the authenticated user", async () => {
      // Arrange - Create tasks for test user
      await Task.create([
        {
          title: "User Task 1",
          description: "First task",
          status: "Todo",
          user: testUser._id,
        },
        {
          title: "User Task 2",
          description: "Second task",
          status: "Doing",
          user: testUser._id,
        },
      ]);

      // Create a task for another user (should not be returned)
      await Task.create({
        title: "Other User Task",
        status: "Todo",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);

      // Check that we only got the current user's tasks
      const taskTitles = response.body.data.map((task) => task.title);
      expect(taskTitles).toContain("User Task 1");
      expect(taskTitles).toContain("User Task 2");
      expect(taskTitles).not.toContain("Other User Task");
    });

    it("should return an empty array if user has no tasks", async () => {
      // Act
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    it("should return 401 if not authenticated", async () => {
      // Act
      const response = await request(app)
        .get("/api/tasks")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not logged in/i);
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("should return a specific task for the authenticated user", async () => {
      // Arrange
      const task = await Task.create({
        title: "Specific Task",
        description: "Get this specific task",
        status: "Todo",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data._id.toString()).toBe(task._id.toString());
      expect(response.body.data.title).toBe(task.title);
    });

    it("should return 404 if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act
      const response = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no task found/i);
    });

    it("should return 404 if task belongs to another user", async () => {
      // Arrange
      const otherUserTask = await Task.create({
        title: "Other User Specific Task",
        status: "Todo",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .get(`/api/tasks/${otherUserTask._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no task found/i);
    });
  });

  describe("PATCH /api/tasks/:id", () => {
    it("should update a task", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task to Update",
        description: "Original description",
        status: "Todo",
        priority: "Low",
        user: testUser._id,
      });

      const updateData = {
        title: "Updated Task Title",
        description: "Updated description",
        status: "Doing",
        priority: "High",
      };

      // Act
      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);

      // Verify in database
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.title).toBe(updateData.title);
    });

    it("should return 400 if update data is invalid", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task with Invalid Update",
        status: "Todo",
        user: testUser._id,
      });

      const updateData = {
        status: "InvalidStatus", // Invalid status
      };

      // Act
      const response = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
    });

    it("should return 404 if task belongs to another user", async () => {
      // Arrange
      const otherUserTask = await Task.create({
        title: "Other User Task for Update",
        status: "Todo",
        user: anotherUser._id,
      });

      const updateData = { title: "Attempted Update" };

      // Act
      const response = await request(app)
        .patch(`/api/tasks/${otherUserTask._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no task found/i);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task to Delete via API",
        status: "Todo",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(204);

      // Assert - Check that no response body (204 No Content)
      expect(response.body).toEqual({});

      // Verify deletion in database
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it("should return 404 if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act
      const response = await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no task found/i);
    });

    it("should return 404 if task belongs to another user", async () => {
      // Arrange
      const otherUserTask = await Task.create({
        title: "Other User Task for Delete",
        status: "Todo",
        user: anotherUser._id,
      });

      // Act
      const response = await request(app)
        .delete(`/api/tasks/${otherUserTask._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no task found/i);
    });
  });

  describe("POST /api/tasks/:id/move", () => {
    it("should update a task status", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task to Move via API",
        status: "Todo",
        user: testUser._id,
      });

      const moveData = {
        status: "Doing",
      };

      // Act
      const response = await request(app)
        .post(`/api/tasks/${task._id}/move`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(moveData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.status).toBe("Doing");

      // Verify in database
      const movedTask = await Task.findById(task._id);
      expect(movedTask.status).toBe("Doing");
    });

    it("should return 400 if status is invalid", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task with Invalid Move",
        status: "Todo",
        user: testUser._id,
      });

      const moveData = {
        status: "InvalidStatus",
      };

      // Act
      const response = await request(app)
        .post(`/api/tasks/${task._id}/move`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(moveData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/status must be one of/i);
    });

    it("should return 400 if status is missing", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task with Missing Status",
        status: "Todo",
        user: testUser._id,
      });

      // Act
      const response = await request(app)
        .post(`/api/tasks/${task._id}/move`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({}) // Empty request body
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/status is required/i);
    });
  });
});
