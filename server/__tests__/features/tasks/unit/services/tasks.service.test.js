import mongoose from "mongoose";
import Task from "../../../../../models/taskModel.js";
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
jest.unstable_mockModule("../../../utils/logger.js", () => ({
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
  createUserTask,
  getUserTasks,
  getUserTaskById,
  updateUserTask,
  deleteUserTask,
  moveUserTask,
} = await import("../../../../../services/taskService.js");

describe("Task Service", () => {
  let testUser;
  let anotherUser;

  // Setup: Create a test user before each test
  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      name: "Test User",
      email: "tasktest@example.com",
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

  describe("createUserTask", () => {
    it("should create a new task for the user", async () => {
      // Arrange
      const taskData = {
        title: "Test Task",
        description: "This is a test task",
        status: "Todo",
        priority: "Medium",
      };

      // Act
      const task = await createUserTask(taskData, testUser._id);

      // Assert
      expect(task).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.status).toBe(taskData.status);
      expect(task.priority).toBe(taskData.priority);
      expect(task.user.toString()).toBe(testUser._id.toString());

      // Verify task was saved to database
      const savedTask = await Task.findById(task._id);
      expect(savedTask).not.toBeNull();
    });

    it("should throw an error if required fields are missing", async () => {
      // Arrange
      const taskData = {
        // Missing title (required field)
        description: "This is a test task",
      };

      // Act & Assert
      await expect(createUserTask(taskData, testUser._id)).rejects.toThrow();
    });
  });

  describe("getUserTasks", () => {
    it("should return all tasks for a user", async () => {
      // Arrange - Create multiple tasks for the test user
      await Task.create([
        {
          title: "Task 1",
          user: testUser._id,
          status: "Todo",
        },
        {
          title: "Task 2",
          user: testUser._id,
          status: "Doing",
        },
      ]);

      // Create a task for another user (should not be returned)
      await Task.create({
        title: "Another User Task",
        user: anotherUser._id,
        status: "Todo",
      });

      // Act
      const tasks = await getUserTasks(testUser._id);

      // Assert
      expect(tasks).toHaveLength(2);
      expect(tasks[0].user.toString()).toBe(testUser._id.toString());
      expect(tasks[1].user.toString()).toBe(testUser._id.toString());
      // Verify the other user's task is not included
      const otherUserTaskIncluded = tasks.some(
        (task) => task.title === "Another User Task"
      );
      expect(otherUserTaskIncluded).toBe(false);
    });

    it("should return an empty array if user has no tasks", async () => {
      // Act
      const tasks = await getUserTasks(testUser._id);

      // Assert
      expect(tasks).toBeInstanceOf(Array);
      expect(tasks).toHaveLength(0);
    });
  });

  describe("getUserTaskById", () => {
    it("should return a specific task for a user", async () => {
      // Arrange
      const task = await Task.create({
        title: "Find Me Task",
        user: testUser._id,
        status: "Todo",
      });

      // Act
      const foundTask = await getUserTaskById(task._id, testUser._id);

      // Assert
      expect(foundTask).toBeDefined();
      expect(foundTask._id.toString()).toBe(task._id.toString());
      expect(foundTask.title).toBe("Find Me Task");
    });

    it("should throw a not found error if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(
        getUserTaskById(nonExistentId, testUser._id)
      ).rejects.toThrow("No task found with that ID");
    });

    it("should throw a not found error if task belongs to a different user", async () => {
      // Arrange - Create task for another user
      const task = await Task.create({
        title: "Other User Task",
        user: anotherUser._id,
        status: "Todo",
      });

      // Act & Assert
      await expect(getUserTaskById(task._id, testUser._id)).rejects.toThrow(
        "No task found with that ID"
      );
    });
  });

  describe("updateUserTask", () => {
    it("should update an existing task", async () => {
      // Arrange
      const task = await Task.create({
        title: "Original Title",
        description: "Original description",
        status: "Todo",
        priority: "Low",
        user: testUser._id,
      });

      const updateData = {
        title: "Updated Title",
        description: "Updated description",
        status: "Doing",
        priority: "High",
      };

      // Act
      const updatedTask = await updateUserTask(
        task._id,
        testUser._id,
        updateData
      );

      // Assert
      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.description).toBe(updateData.description);
      expect(updatedTask.status).toBe(updateData.status);
      expect(updatedTask.priority).toBe(updateData.priority);

      // Verify changes were saved to database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.title).toBe(updateData.title);
    });

    it("should throw a not found error if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: "New Title" };

      // Act & Assert
      await expect(
        updateUserTask(nonExistentId, testUser._id, updateData)
      ).rejects.toThrow("No task found with that ID");
    });

    it("should throw a not found error if task belongs to a different user", async () => {
      // Arrange - Create task for another user
      const task = await Task.create({
        title: "Other User Task",
        user: anotherUser._id,
        status: "Todo",
      });

      const updateData = { title: "Hacked Task" };

      // Act & Assert
      await expect(
        updateUserTask(task._id, testUser._id, updateData)
      ).rejects.toThrow("No task found with that ID");
    });
  });

  describe("deleteUserTask", () => {
    it("should delete an existing task", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task to Delete",
        user: testUser._id,
        status: "Todo",
      });

      // Act
      await deleteUserTask(task._id, testUser._id);

      // Assert - Verify task no longer exists in database
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it("should throw a not found error if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(deleteUserTask(nonExistentId, testUser._id)).rejects.toThrow(
        "No task found with that ID"
      );
    });

    it("should throw a not found error if task belongs to a different user", async () => {
      // Arrange - Create task for another user
      const task = await Task.create({
        title: "Other User Task to Delete",
        user: anotherUser._id,
        status: "Todo",
      });

      // Act & Assert
      await expect(deleteUserTask(task._id, testUser._id)).rejects.toThrow(
        "No task found with that ID"
      );
    });
  });

  describe("moveUserTask", () => {
    it("should update a task status", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task to Move",
        user: testUser._id,
        status: "Todo",
      });

      // Act
      const movedTask = await moveUserTask(task._id, testUser._id, "Doing");

      // Assert
      expect(movedTask.status).toBe("Doing");

      // Verify changes were saved to database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.status).toBe("Doing");
    });

    it("should throw a bad request error if status is invalid", async () => {
      // Arrange
      const task = await Task.create({
        title: "Task with Invalid Status",
        user: testUser._id,
        status: "Todo",
      });

      // Act & Assert
      await expect(
        moveUserTask(task._id, testUser._id, "InvalidStatus")
      ).rejects.toThrow("Invalid status value");
    });

    it("should throw a not found error if task does not exist", async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();

      // Act & Assert
      await expect(
        moveUserTask(nonExistentId, testUser._id, "Doing")
      ).rejects.toThrow("No task found with that ID");
    });
  });
});
