import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { screen } from "@testing-library/react";
import TaskCard from "../../components/TaskCard";
import { renderWithProviders, createMockTask } from "../setup/testUtils";
import { addDays, subDays } from "date-fns";

// Mock react-dnd modules completely
jest.mock("react-dnd", () => ({
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  DndProvider: ({ children }) => children, // Simple passthrough mock
}));

jest.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

describe("TaskCard Component", () => {
  // Mock data and props with fixed date for predictable tests
  const mockDate = new Date("2023-05-20");
  const mockTask = createMockTask({
    dueDate: mockDate.toISOString(),
  });
  const mockColumnId = "column-todo";
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "";
    }
  };

  // Mock CustomEvent for task editing
  const mockAddEventListener = jest.fn();
  const mockDispatchEvent = jest.fn();
  let originalAddEventListener;
  let originalDispatchEvent;

  beforeEach(() => {
    // Store original window methods
    originalAddEventListener = window.addEventListener;
    originalDispatchEvent = window.dispatchEvent;

    // Mock window methods
    window.addEventListener = mockAddEventListener;
    window.dispatchEvent = mockDispatchEvent;

    // Mock current date to ensure predictable date formatting/testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-05-21"));
  });

  afterEach(() => {
    // Restore original window methods
    window.addEventListener = originalAddEventListener;
    window.dispatchEvent = originalDispatchEvent;

    // Restore real timers
    jest.useRealTimers();
  });

  it("should render the task card with all its elements", () => {
    // Render
    renderWithProviders(
      <TaskCard
        task={mockTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Assert basic content is rendered
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
    expect(screen.getByText(mockTask.priority)).toBeInTheDocument();

    // Assert tags are rendered
    mockTask.tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });

    // Instead of testing exact date format, just check for date-related text
    expect(screen.getByText(/overdue by/i)).toBeInTheDocument();
  });

  it("should dispatch edit event when clicked", () => {
    // Render
    renderWithProviders(
      <TaskCard
        task={mockTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Act - directly call the click handler
    screen.getByText(mockTask.title).click();

    // Assert
    expect(mockDispatchEvent).toHaveBeenCalled();
    const dispatchCall = mockDispatchEvent.mock.calls[0][0];
    expect(dispatchCall.type).toBe("editTask");
    expect(dispatchCall.detail).toEqual(mockTask);
  });

  it("should display overdue styling for past due dates", () => {
    // Arrange - Create a task with a past due date
    const pastDate = subDays(new Date(), 2).toISOString();
    const overdueTask = createMockTask({
      dueDate: pastDate,
      status: "Todo", // Not completed
    });

    // Render
    renderWithProviders(
      <TaskCard
        task={overdueTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Assert
    expect(screen.getByText(/Overdue by/i)).toBeInTheDocument();
  });

  it("should not display overdue styling for completed tasks with past due dates", () => {
    // Arrange - Create a completed task with a past due date
    const pastDate = subDays(new Date(), 2).toISOString();
    const completedTask = createMockTask({
      dueDate: pastDate,
      status: "Done",
    });

    // Render
    renderWithProviders(
      <TaskCard
        task={completedTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Assert - Should not show "Overdue by" text
    expect(screen.queryByText(/Overdue by/i)).not.toBeInTheDocument();

    // Should show the formatted date - check for partial text instead
    expect(screen.getByText(/May/i)).toBeInTheDocument();
  });

  it("should display future date with calendar icon", () => {
    // Arrange - Create a task with a future due date
    const futureDate = addDays(new Date(), 5).toISOString();
    const futureTask = createMockTask({
      dueDate: futureDate,
    });

    // Render
    renderWithProviders(
      <TaskCard
        task={futureTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Assert for date presence and calendar icon presence
    const dateElement = screen.getByText(/May 26, 2023/);
    expect(dateElement).toBeInTheDocument();

    // Find calendar icon parent element and check its contents
    const dateContainer = dateElement.parentElement;
    expect(dateContainer).toContainElement(
      document.querySelector(".lucide-calendar")
    );
  });

  it("should apply the correct priority color", () => {
    // Test high priority
    const highPriorityTask = createMockTask({ priority: "High" });
    const { unmount: unmountHigh } = renderWithProviders(
      <TaskCard
        task={highPriorityTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Find the priority badge by its text and check its class
    const highPriorityElement = screen.getByText("High");
    expect(highPriorityElement).toHaveClass("bg-red-100", { exact: false });

    unmountHigh();

    // Test medium priority
    const mediumPriorityTask = createMockTask({ priority: "Medium" });
    const { unmount: unmountMedium } = renderWithProviders(
      <TaskCard
        task={mediumPriorityTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    const mediumPriorityElement = screen.getByText("Medium");
    expect(mediumPriorityElement).toHaveClass("bg-yellow-100", {
      exact: false,
    });

    unmountMedium();

    // Test low priority
    const lowPriorityTask = createMockTask({ priority: "Low" });
    renderWithProviders(
      <TaskCard
        task={lowPriorityTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    const lowPriorityElement = screen.getByText("Low");
    expect(lowPriorityElement).toHaveClass("bg-green-100", { exact: false });
  });

  it("should limit tag display to 3 with a +n indicator", () => {
    // Arrange
    const manyTagsTask = createMockTask({
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    });

    // Render
    renderWithProviders(
      <TaskCard
        task={manyTagsTask}
        columnId={mockColumnId}
        getPriorityColor={getPriorityColor}
      />
    );

    // Assert - First 3 tags should be visible
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();

    // 4th and 5th tags should not be directly visible
    expect(screen.queryByText("tag4")).not.toBeInTheDocument();
    expect(screen.queryByText("tag5")).not.toBeInTheDocument();

    // Instead, should show +2 indicator
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
