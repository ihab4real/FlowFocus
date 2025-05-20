import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import taskService from "../../services/taskService";
import { ApiService } from "../../../../services/api/apiService";

// Mock the ApiService methods
jest.mock("../../../../services/api/apiService", () => {
  const mockApiServiceInstance = {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    executeAction: jest.fn(),
  };

  return {
    ApiService: jest.fn(() => mockApiServiceInstance),
  };
});

describe("taskService", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTasks", () => {
    it("should call apiService.getAll with the correct parameters", async () => {
      // Arrange
      const filters = { status: "Todo" };
      const mockResponse = { data: [{ id: "1", title: "Test Task" }] };
      taskService.getAll.mockResolvedValue(mockResponse);

      // Act
      const result = await taskService.getTasks(filters);

      // Assert
      expect(taskService.getAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResponse);
    });

    it("should call getAll with empty object when no filters provided", async () => {
      // Arrange
      const mockResponse = { data: [{ id: "1", title: "Test Task" }] };
      taskService.getAll.mockResolvedValue(mockResponse);

      // Act
      const result = await taskService.getTasks();

      // Assert
      expect(taskService.getAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });
  });

  describe("moveTask", () => {
    it("should call executeAction with correct parameters", async () => {
      // Arrange
      const taskId = "task-123";
      const newStatus = "Doing";
      const mockResponse = { data: { id: taskId, status: newStatus } };
      taskService.executeAction.mockResolvedValue(mockResponse);

      // Act
      const result = await taskService.moveTask(taskId, newStatus);

      // Assert
      expect(taskService.executeAction).toHaveBeenCalledWith(
        taskId,
        "move",
        { status: newStatus },
        "PATCH"
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("API Service Inheritance", () => {
    it("should inherit methods from ApiService", () => {
      // Assert that taskService has the expected methods
      expect(typeof taskService.getAll).toBe("function");
      expect(typeof taskService.getById).toBe("function");
      expect(typeof taskService.create).toBe("function");
      expect(typeof taskService.update).toBe("function");
      expect(typeof taskService.delete).toBe("function");
      expect(typeof taskService.executeAction).toBe("function");
      expect(typeof taskService.moveTask).toBe("function");
    });
  });
});
