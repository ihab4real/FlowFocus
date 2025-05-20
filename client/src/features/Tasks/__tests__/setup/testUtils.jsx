import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Imports will be handled by mocks in test files
// import { DndProvider } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";

// Utility for rendering components with the Router, React Query, and DnD contexts
export function renderWithProviders(
  ui,
  {
    route = "/",
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    }),
  } = {}
) {
  window.history.pushState({}, "Test page", route);

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {/* DndProvider is mocked to directly render children */}
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });
}

// Mock task data factory
export const createMockTask = (overrides = {}) => ({
  _id: "task-123",
  title: "Test Task",
  description: "Test Description",
  status: "Todo",
  priority: "Medium",
  dueDate: new Date().toISOString(),
  tags: ["test", "important"],
  user: "user-123",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create a collection of mock tasks with different statuses
export const createMockTasks = (count = 5) => {
  const statuses = ["Todo", "Doing", "Done"];
  const priorities = ["Low", "Medium", "High"];

  return Array(count)
    .fill(null)
    .map((_, index) =>
      createMockTask({
        _id: `task-${index}`,
        title: `Task ${index}`,
        status: statuses[index % statuses.length],
        priority: priorities[index % priorities.length],
      })
    );
};

// Utility to create mock success response
export const createSuccessResponse = (data) => ({
  data,
  status: "success",
  ok: true,
});

// Utility to create mock error response
export const createErrorResponse = (message, status = 400) => {
  const error = new Error(message);
  error.response = {
    data: { message, status: "fail" },
    status,
  };
  return error;
};
