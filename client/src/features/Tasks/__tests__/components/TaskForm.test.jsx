import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "../../components/TaskForm";
import { renderWithProviders, createMockTask } from "../setup/testUtils";
import * as taskQueries from "../../hooks/useTaskQueries";

// Mock react-query hooks
jest.mock("../../hooks/useTaskQueries", () => ({
  useCreateTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
    isPending: false,
  })),
  useUpdateTaskMutation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
    isPending: false,
  })),
}));

describe("TaskForm Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render form with empty values in create mode", () => {
      // Render
      renderWithProviders(
        <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Assert form elements are rendered
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      // Due date is a button with "Pick a date"
      expect(screen.getByText(/due date/i)).toBeInTheDocument();
      expect(screen.getByText(/pick a date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();

      // Assert buttons are rendered
      expect(
        screen.getByRole("button", { name: /create task/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();

      // Assert initial values are empty
      expect(screen.getByLabelText(/title/i)).toHaveValue("");
      expect(screen.getByLabelText(/description/i)).toHaveValue("");
    });

    it("should include required attribute on title field", () => {
      // Render
      renderWithProviders(
        <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Assert the title input has the required attribute
      const titleInput = screen.getByLabelText(/title \*/i);
      expect(titleInput).toBeRequired();
    });

    it("should call onSubmit when form is successfully submitted", async () => {
      // Arrange
      const user = userEvent.setup();

      // Setup the mock function for the hook
      const createMutation = {
        mutateAsync: jest
          .fn()
          .mockResolvedValue({ data: { _id: "new-task-123" } }),
        isLoading: false,
        isPending: false,
      };
      taskQueries.useCreateTaskMutation.mockReturnValue(createMutation);

      // Render
      renderWithProviders(
        <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Act - Fill out the form
      await user.type(screen.getByLabelText(/title/i), "New Test Task");
      await user.type(
        screen.getByLabelText(/description/i),
        "This is a test task"
      );

      // Find the submit button by text content
      const submitButtons = screen.getAllByRole("button");
      const createTaskButton = submitButtons.find(
        (button) => button.textContent === "Create Task"
      );
      expect(createTaskButton).toBeInTheDocument();

      // Submit the form
      await user.click(createTaskButton);

      // Assert
      await waitFor(() => {
        expect(createMutation.mutateAsync).toHaveBeenCalledWith({
          title: "New Test Task",
          description: "This is a test task",
          status: "Todo", // Default value
          priority: "Medium", // Default value
          tags: [], // Default value
          dueDate: undefined, // Default value
        });
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("should call onCancel when cancel button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();

      // Render
      renderWithProviders(
        <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Act - Find the cancel button by text
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Assert
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Edit Mode", () => {
    const mockTask = createMockTask({
      title: "Existing Task",
      description: "This is an existing task",
      status: "Doing",
      priority: "High",
      tags: ["important", "work"],
      dueDate: new Date("2023-12-31").toISOString(),
    });

    it("should render form with task values in edit mode", () => {
      // Render
      renderWithProviders(
        <TaskForm
          initialData={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Assert values are pre-filled
      expect(screen.getByLabelText(/title/i)).toHaveValue(mockTask.title);
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        mockTask.description
      );

      // We need to check the selected options for select fields
      // For status dropdown
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toHaveValue(mockTask.status);

      // For priority dropdown
      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toHaveValue(mockTask.priority);

      // Find the submit button by testing all buttons
      const submitButtons = screen.getAllByRole("button");
      const updateButton = submitButtons.find(
        (button) => button.textContent === "Update Task"
      );
      expect(updateButton).toBeInTheDocument();
    });

    it("should call updateTaskMutation when updating an existing task", async () => {
      // Arrange
      const user = userEvent.setup();

      // Setup the mock function for the hook
      const updateMutation = {
        mutateAsync: jest.fn().mockResolvedValue({ data: mockTask }),
        isLoading: false,
        isPending: false,
      };
      taskQueries.useUpdateTaskMutation.mockReturnValue(updateMutation);

      // Render
      renderWithProviders(
        <TaskForm
          initialData={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Act - Update the title
      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), "Updated Task Title");

      // Find submit button
      const submitButtons = screen.getAllByRole("button");
      const updateButton = submitButtons.find(
        (button) => button.textContent === "Update Task"
      );
      expect(updateButton).toBeInTheDocument();

      // Submit the form
      await user.click(updateButton);

      // Assert
      await waitFor(() => {
        expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
          id: mockTask._id,
          data: expect.objectContaining({
            title: "Updated Task Title",
            // Other properties from mockTask should be passed as is
            description: mockTask.description,
            status: mockTask.status,
            priority: mockTask.priority,
          }),
        });
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("should show a loading state when submitting", async () => {
      // Mock loading state
      const updateMutation = {
        mutateAsync: jest.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              // Don't resolve immediately to simulate loading
              setTimeout(() => resolve({ data: mockTask }), 500);
            })
        ),
        isLoading: true,
        isPending: true,
      };
      taskQueries.useUpdateTaskMutation.mockReturnValue(updateMutation);

      // Render with loading state pre-activated for simplicity
      renderWithProviders(
        <TaskForm
          initialData={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Check for loading indicators directly
      const loadingText = screen.getByText("Saving...");
      expect(loadingText).toBeInTheDocument();

      // Find the disabled buttons
      const allButtons = screen.getAllByRole("button");
      const submitButton = allButtons.find(
        (button) =>
          button.tagName === "BUTTON" &&
          button.type === "submit" &&
          button.disabled === true
      );

      // Assert button is disabled
      expect(submitButton).toBeDisabled();
    });
  });
});
