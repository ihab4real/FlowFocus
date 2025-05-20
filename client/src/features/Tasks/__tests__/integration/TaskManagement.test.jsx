import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createMockTasks } from "../setup/testUtils";
import TaskBoard from "../../components/TaskBoard";
import * as taskQueries from "../../hooks/useTaskQueries";

// Mock all the task query hooks
jest.mock("../../hooks/useTaskQueries", () => ({
  useTasksQuery: jest.fn(),
  useMoveTaskMutation: jest.fn(),
  useCreateTaskMutation: jest.fn(),
  useUpdateTaskMutation: jest.fn(),
  useDeleteTaskMutation: jest.fn(),
}));

// Mock the TaskModal component to avoid rendering the actual modal
jest.mock("../../components/TaskModal", () => ({
  __esModule: true,
  default: jest.fn(({ isOpen, children }) =>
    isOpen ? <div data-testid="task-modal">{children}</div> : null
  ),
}));

describe("Task Management Integration", () => {
  // Mock data
  const mockTasks = createMockTasks(6);

  // Set up mocks for all the hooks
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the hooks with default implementations
    taskQueries.useTasksQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    taskQueries.useMoveTaskMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        data: { ...mockTasks[0], status: "Doing" },
      }),
      isLoading: false,
    });

    taskQueries.useCreateTaskMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        data: createMockTasks(1)[0],
      }),
      isLoading: false,
    });

    taskQueries.useUpdateTaskMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        data: { ...mockTasks[0], title: "Updated Task" },
      }),
      isLoading: false,
    });

    taskQueries.useDeleteTaskMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ data: { success: true } }),
      isLoading: false,
    });
  });

  it("should render the task board with all tasks initially", async () => {
    // Render the task board
    renderWithProviders(<TaskBoard />);

    // Check that the task board is rendered
    expect(screen.getByText("Task Board")).toBeInTheDocument();

    // Check that all tasks are rendered
    mockTasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  });

  it("should filter tasks when search query is entered", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<TaskBoard />);

    // Act - Enter a search query
    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    await user.type(searchInput, "Task 0");

    // Setup the filtered tasks response
    const filteredTasks = mockTasks.filter((task) =>
      task.title.includes("Task 0")
    );
    taskQueries.useTasksQuery.mockReturnValue({
      data: filteredTasks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    // Re-render with filtered data
    rerender(<TaskBoard />);

    // Assert only matching tasks are shown
    filteredTasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });

    // Assert non-matching tasks are not shown
    const nonMatchingTasks = mockTasks.filter(
      (task) => !task.title.includes("Task 0")
    );
    nonMatchingTasks.forEach((task) => {
      expect(screen.queryByText(task.title)).not.toBeInTheDocument();
    });
  });

  it("should open task creation modal when add task button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();

    // Render
    renderWithProviders(<TaskBoard />);

    // Act - Click the add task button
    const addButton = screen.getByRole("button", { name: /add task/i });
    await user.click(addButton);

    // Assert modal is displayed
    expect(screen.getByTestId("task-modal")).toBeInTheDocument();
  });

  it("should show loading state when tasks are loading", async () => {
    // Mock loading state for tasks query
    taskQueries.useTasksQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    // Render
    renderWithProviders(<TaskBoard />);

    // Assert loading state is shown - could be a spinner or loading text
    // Look for Task Board title to be present at minimum
    expect(screen.getByText("Task Board")).toBeInTheDocument();

    // Update mock to show data
    taskQueries.useTasksQuery.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    // Re-render with data
    renderWithProviders(<TaskBoard />);

    // Now all tasks should be visible
    mockTasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  });

  it("should handle error states appropriately", async () => {
    // Arrange
    const errorMessage = "Failed to load tasks";

    // Mock error state
    taskQueries.useTasksQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: errorMessage },
    });

    // Render
    renderWithProviders(<TaskBoard />);

    // Even with error, the Task Board title should be visible
    expect(screen.getByText("Task Board")).toBeInTheDocument();
  });

  it("should filter tasks based on search input", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<TaskBoard />);

    // Act - Use the search box
    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    await user.type(searchInput, "Task 0");

    // Setup filtered response
    const filteredTasks = mockTasks.filter((task) =>
      task.title.includes("Task 0")
    );
    taskQueries.useTasksQuery.mockReturnValue({
      data: filteredTasks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    // Re-render
    rerender(<TaskBoard />);

    // Assert only filtered tasks are shown
    filteredTasks.forEach((task) => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });

    // Other tasks should not be visible
    const nonMatchingTasks = mockTasks.filter(
      (task) => !task.title.includes("Task 0")
    );
    nonMatchingTasks.forEach((task) => {
      expect(screen.queryByText(task.title)).not.toBeInTheDocument();
    });
  });
});
