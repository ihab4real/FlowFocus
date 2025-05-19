import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { errorTypes as originalErrorTypes } from "../../../../../utils/AppError.js";

// Use the unstable API for mocking ESM
jest.unstable_mockModule("../../../utils/AppError.js", () => {
  return {
    errorTypes: {
      badRequest: jest.fn((message) => {
        throw new Error(message);
      }),
    },
  };
});

// Dynamically import modules after mocks are set up
const { errorTypes } = await import("../../../../../utils/AppError.js");
const { validateCreateTask, validateUpdateTask, validateMoveTask } =
  await import("../../../../../middleware/taskValidation.js");

describe("Task Validation Middleware", () => {
  // Clear mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateCreateTask", () => {
    it("should call next() if task has a title", () => {
      // Arrange
      const req = {
        body: {
          title: "Valid Task Title",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateCreateTask(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(errorTypes.badRequest).not.toHaveBeenCalled();
    });

    it("should throw an error if title is missing", () => {
      // Arrange
      const req = {
        body: {
          description: "Task without title",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateCreateTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Task title is required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should throw an error if title is empty string", () => {
      // Arrange
      const req = {
        body: {
          title: "   ", // Just whitespace
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateCreateTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Task title cannot be empty"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateUpdateTask", () => {
    it("should call next() if update data is valid", () => {
      // Arrange
      const req = {
        body: {
          title: "Updated Title",
          status: "Doing",
          priority: "High",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateUpdateTask(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(errorTypes.badRequest).not.toHaveBeenCalled();
    });

    it("should call next() if no fields are provided (empty update)", () => {
      // Arrange
      const req = {
        body: {}, // Empty update
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateUpdateTask(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(errorTypes.badRequest).not.toHaveBeenCalled();
    });

    it("should throw an error if title is empty string", () => {
      // Arrange
      const req = {
        body: {
          title: "", // Empty string
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateUpdateTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Task title cannot be empty"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should throw an error if status is invalid", () => {
      // Arrange
      const req = {
        body: {
          status: "InvalidStatus",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateUpdateTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Status must be one of: Todo, Doing, Done"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should throw an error if priority is invalid", () => {
      // Arrange
      const req = {
        body: {
          priority: "InvalidPriority",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateUpdateTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Priority must be one of: Low, Medium, High"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateMoveTask", () => {
    it("should call next() if status is valid", () => {
      // Arrange
      const req = {
        body: {
          status: "Doing",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateMoveTask(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(errorTypes.badRequest).not.toHaveBeenCalled();
    });

    it("should throw an error if status is missing", () => {
      // Arrange
      const req = {
        body: {},
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateMoveTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith("Status is required");
      expect(next).not.toHaveBeenCalled();
    });

    it("should throw an error if status is invalid", () => {
      // Arrange
      const req = {
        body: {
          status: "InvalidStatus",
        },
      };
      const res = {};
      const next = jest.fn();

      // Act & Assert
      expect(() => validateMoveTask(req, res, next)).toThrow();
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Status must be one of: Todo, Doing, Done"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
