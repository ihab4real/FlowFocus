import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { screen } from "@testing-library/react";
import TaskColumn from "../../components/TaskColumn";
import { renderWithProviders, createMockTasks } from "../setup/testUtils";

// Mock react-dnd modules completely
jest.mock("react-dnd", () => ({
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: true }, jest.fn()],
  DndProvider: ({ children }) => children, // Simple passthrough mock
}));

jest.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

// Mock TaskCard component to simplify testing
jest.mock("../../components/TaskCard", () => {
  return function MockTaskCard({ task }) {
    return <div data-testid={`task-card-${task._id}`}>{task.title}</div>;
  };
});

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  MoreHorizontal: () => <div data-testid="icon-more">MoreIcon</div>,
  Plus: () => <div data-testid="icon-plus">PlusIcon</div>,
  Pencil: () => <div data-testid="icon-pencil">PencilIcon</div>,
  Trash2: () => <div data-testid="icon-trash">TrashIcon</div>,
}));

describe("TaskColumn Component", () => {
  // Mock props
  const mockTasks = createMockTasks(5).filter((task) => task.status === "Todo");
  const mockColumn = {
    id: "column-todo",
    title: "To Do",
    status: "Todo",
    color: "bg-blue-500",
  };
  const mockHandleMoveTask = jest.fn();
  const mockHandleAddTask = jest.fn();
  const mockGetPriorityColor = jest.fn().mockReturnValue("bg-green-100");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render column with correct title and tasks", () => {
    // Render
    renderWithProviders(
      <TaskColumn
        id={mockColumn.id}
        title={mockColumn.title}
        tasks={mockTasks}
        onMoveTask={mockHandleMoveTask}
        getPriorityColor={mockGetPriorityColor}
      />
    );

    // Assert column title is rendered
    expect(screen.getByText(mockColumn.title)).toBeInTheDocument();

    // Assert all tasks are rendered by checking the rendered MockTaskCard components
    mockTasks.forEach((task) => {
      expect(screen.getByTestId(`task-card-${task._id}`)).toBeInTheDocument();
    });
  });

  it("should display empty state when no tasks", () => {
    // Render with empty tasks array
    renderWithProviders(
      <TaskColumn
        id={mockColumn.id}
        title={mockColumn.title}
        tasks={[]}
        onMoveTask={mockHandleMoveTask}
        getPriorityColor={mockGetPriorityColor}
      />
    );

    // Assert empty state message is shown
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  it("should have the plus button for adding tasks", () => {
    // Render with onAddTask handler
    renderWithProviders(
      <TaskColumn
        id={mockColumn.id}
        title={mockColumn.title}
        tasks={mockTasks}
        onMoveTask={mockHandleMoveTask}
        getPriorityColor={mockGetPriorityColor}
        onAddTask={mockHandleAddTask}
      />
    );

    // Find the add button by its icon
    const addButton = screen.getByTestId("icon-plus").closest("button");
    expect(addButton).toBeInTheDocument();

    // Trigger the add button
    addButton.click();

    // Check if the handler was called with the column id
    expect(mockHandleAddTask).toHaveBeenCalledWith(mockColumn.id);
  });

  it("should not allow adding tasks if onAddTask is not provided", () => {
    // Render without onAddTask handler
    renderWithProviders(
      <TaskColumn
        id={mockColumn.id}
        title={mockColumn.title}
        tasks={mockTasks}
        onMoveTask={mockHandleMoveTask}
        getPriorityColor={mockGetPriorityColor}
        // No onAddTask prop
      />
    );

    // The plus button still exists but clicking it shouldn't error
    const addButton = screen.getByTestId("icon-plus").closest("button");
    expect(addButton).toBeInTheDocument();

    // Click should not cause issues
    addButton.click();

    // No handler to check
  });

  it("should render tasks in order", () => {
    // Create tasks with different IDs
    const orderedTasks = [
      {
        _id: "task-1",
        title: "Task 1",
        status: "Todo",
      },
      {
        _id: "task-2",
        title: "Task 2",
        status: "Todo",
      },
      {
        _id: "task-3",
        title: "Task 3",
        status: "Todo",
      },
    ];

    // Render
    renderWithProviders(
      <TaskColumn
        id={mockColumn.id}
        title={mockColumn.title}
        tasks={orderedTasks}
        onMoveTask={mockHandleMoveTask}
        getPriorityColor={mockGetPriorityColor}
      />
    );

    // Get all task elements
    const taskElements = screen.getAllByTestId(/task-card-task-\d/);

    // Assert they're in the expected order
    expect(taskElements[0]).toHaveTextContent("Task 1");
    expect(taskElements[1]).toHaveTextContent("Task 2");
    expect(taskElements[2]).toHaveTextContent("Task 3");
  });
});
