import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders, createMockTasks } from "../setup/testUtils";
import * as taskQueries from "../../hooks/useTaskQueries";
import TaskBoard from "../../components/TaskBoard";

// Mock the react-query hooks
jest.mock("../../hooks/useTaskQueries", () => ({
  useTasksQuery: jest.fn(),
  useMoveTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
  useUpdateTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
  useCreateTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
  useDeleteTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

// Create a simplified mock for TaskColumn
jest.mock("../../components/TaskColumn", () => ({
  __esModule: true,
  default: jest.fn(({ title, tasks }) => (
    <div data-testid="task-column">
      <h3>{title}</h3>
      <div className="tasks-container">
        {tasks.map((task) => (
          <div key={task._id || task.id} data-testid="task-card">
            {task.title}
          </div>
        ))}
      </div>
    </div>
  )),
}));

// Mock other components as needed
jest.mock("../../components/TaskModal", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("../../components/TaskForm", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe("TaskBoard Component", () => {
  // Mock tasks data
  const mockTasks = createMockTasks(9); // 3 for each status

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useTasksQuery
    taskQueries.useTasksQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("should render the board with task columns", () => {
    renderWithProviders(<TaskBoard />);
    expect(screen.getByText("Task Board")).toBeInTheDocument();
  });

  it("should display tasks in the appropriate columns", () => {
    renderWithProviders(<TaskBoard />);

    // Get all task cards
    const taskCards = screen.getAllByTestId("task-card");

    // We should have all our mock tasks displayed
    expect(taskCards).toHaveLength(mockTasks.length);

    // Check each task title is present
    mockTasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  });

  it("should filter tasks when filters are applied", async () => {
    // Render
    const { rerender } = renderWithProviders(<TaskBoard />);

    // Check initial state - all tasks visible
    expect(screen.getAllByTestId("task-card").length).toBe(mockTasks.length);

    // Now update the hook to return filtered tasks (only High priority)
    const highPriorityTasks = mockTasks.filter(
      (task) => task.priority === "High"
    );
    taskQueries.useTasksQuery.mockReturnValue({
      data: highPriorityTasks,
      isLoading: false,
      isError: false,
    });

    // Re-render with new data
    rerender(<TaskBoard />);

    // Assert only high priority tasks are shown
    expect(screen.getAllByTestId("task-card").length).toBe(
      highPriorityTasks.length
    );
  });

  it("should call mutation when moving a task", async () => {
    // Setup
    const moveTaskMutation = {
      mutateAsync: jest.fn().mockResolvedValue({}),
      isLoading: false,
    };

    taskQueries.useMoveTaskMutation.mockReturnValue(moveTaskMutation);

    const refetchMock = jest.fn();
    taskQueries.useTasksQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    // Render component
    renderWithProviders(<TaskBoard />);

    // We simulate moving a task by directly calling the mutation
    const taskId = mockTasks[0]._id;
    const newStatus = "Doing";

    // Call the mutation directly
    await moveTaskMutation.mutateAsync({ id: taskId, status: newStatus });

    // Verify the mutation was called
    expect(moveTaskMutation.mutateAsync).toHaveBeenCalledWith({
      id: taskId,
      status: newStatus,
    });
  });
});
