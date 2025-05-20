import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useTasksQuery,
  useTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} from "../../hooks/useTaskQueries";
import taskService from "../../services/taskService";
import { createMockTask, createMockTasks } from "../setup/testUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the taskService
jest.mock("../../services/taskService", () => ({
  __esModule: true,
  default: {
    getTasks: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    moveTask: jest.fn(),
  },
}));

// Create a wrapper for testing hooks with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useTaskQueries hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useTasksQuery", () => {
    it("should fetch tasks with the provided filters", async () => {
      // Arrange
      const mockTasks = createMockTasks(3);
      const mockResponse = { data: mockTasks };
      taskService.getTasks.mockResolvedValue(mockResponse);
      const filters = { status: "Todo" };

      // Act
      const { result } = renderHook(() => useTasksQuery(filters), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.getTasks).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual(mockTasks);
    });

    it("should fetch tasks with no filters when none provided", async () => {
      // Arrange
      const mockTasks = createMockTasks(3);
      const mockResponse = { data: mockTasks };
      taskService.getTasks.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useTasksQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.getTasks).toHaveBeenCalledWith({});
      expect(result.current.data).toEqual(mockTasks);
    });
  });

  describe("useTaskQuery", () => {
    it("should fetch a task by id", async () => {
      // Arrange
      const mockTask = createMockTask();
      const mockResponse = { data: mockTask };
      taskService.getById.mockResolvedValue(mockResponse);
      const taskId = "task-123";

      // Act
      const { result } = renderHook(() => useTaskQuery(taskId), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.getById).toHaveBeenCalledWith(taskId);
      expect(result.current.data).toEqual(mockTask);
    });

    it("should not fetch if id is not provided", async () => {
      // Act
      const { result } = renderHook(() => useTaskQuery(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
      expect(taskService.getById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateTaskMutation", () => {
    it("should create a task and invalidate queries", async () => {
      // Arrange
      const mockTask = createMockTask();
      const taskData = {
        title: "New Task",
        description: "Description",
        status: "Todo",
      };
      const mockResponse = { data: mockTask };
      taskService.create.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useCreateTaskMutation(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate(taskData);

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.create).toHaveBeenCalledWith(taskData);
      expect(result.current.data).toEqual(mockTask);
    });
  });

  describe("useUpdateTaskMutation", () => {
    it("should update a task and invalidate queries", async () => {
      // Arrange
      const taskId = "task-123";
      const updateData = { title: "Updated Task" };
      const mockTask = createMockTask({ _id: taskId, ...updateData });
      const mockResponse = { data: mockTask };
      taskService.update.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useUpdateTaskMutation(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate({ id: taskId, data: updateData });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.update).toHaveBeenCalledWith(taskId, updateData);
      expect(result.current.data).toEqual(mockTask);
    });
  });

  describe("useDeleteTaskMutation", () => {
    it("should delete a task and invalidate queries", async () => {
      // Arrange
      const taskId = "task-123";
      const mockResponse = { data: { success: true } };
      taskService.delete.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useDeleteTaskMutation(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate(taskId);

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.delete).toHaveBeenCalledWith(taskId);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe("useMoveTaskMutation", () => {
    it("should move a task to a different status and invalidate queries", async () => {
      // Arrange
      const taskId = "task-123";
      const newStatus = "Doing";
      const mockTask = createMockTask({ _id: taskId, status: newStatus });
      const mockResponse = { data: mockTask };
      taskService.moveTask.mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useMoveTaskMutation(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate({ id: taskId, status: newStatus });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(taskService.moveTask).toHaveBeenCalledWith(taskId, newStatus);
      expect(result.current.data).toEqual(mockTask);
    });
  });
});
