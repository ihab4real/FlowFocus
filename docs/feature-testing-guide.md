# FlowFocus: Feature-Based Testing Guide

This guide outlines the step-by-step process for comprehensively testing a single feature within the FlowFocus application, ensuring both its backend API and frontend UI components work correctly and reliably together.

## Core Principle: Test Pyramid within a Feature

For each feature (e.g., Tasks, Notes, Authentication), we aim to apply the testing pyramid concept:

1.  **Unit Tests (Foundation):** Test small, isolated pieces (utility functions, individual components, model methods) thoroughly.
2.  **Integration Tests (Middle):** Test the interaction between these pieces (API endpoints connecting controllers/services/models, groups of components interacting).
3.  **E2E Tests (Peak - Deferred):** Test complete user flows through the UI across the whole stack.

This guide focuses on the Unit and Integration test layers, which provide the most value during active development.

## Workflow for Testing a Feature

Let's use the **Task Management** feature as an example.

**1. Understand the Feature & Identify Test Boundaries:**

*   **Review Requirements:** Consult `docs/project-overview.md` and `docs/task-management.md`. What are the core user stories? (e.g., User can create, read, update, delete tasks; tasks have status, priority, due dates; tasks belong to a user).
*   **Identify Components:** Map the feature to code:
    *   **Backend (`server/`):**
        *   Routes: `routes/taskRoutes.js`
        *   Controllers: `controllers/taskController.js`
        *   Services: `services/taskService.js` (if complex logic exists)
        *   Models: `models/Task.js`
        *   Middleware: Any auth/validation middleware used in routes.
    *   **Frontend (`client/src/`):**
        *   Feature Folder: `features/tasks/`
        *   Components: `TaskList.jsx`, `TaskCard.jsx`, `TaskForm.jsx`, `TaskFilter.jsx`, etc.
        *   Hooks: `hooks/useTasks.js` (or similar for fetching/managing task state).
        *   State Management: Context API or Zustand store related to tasks.
        *   Shared Components: Buttons, Modals used by the feature.
*   **Define Scenarios:** List key scenarios to test:
    *   Successfully create a new task.
    *   Fail to create a task (invalid data, unauthorized).
    *   Fetch all tasks for the logged-in user.
    *   Fetch a single task by ID.
    *   Attempt to fetch a task belonging to another user (forbidden).
    *   Update a task's status/details.
    *   Delete a task.
    *   UI: Display tasks correctly, open/close form, form validation, state updates on CRUD.

**2. Backend Testing (`server/__tests__/features/tasks/`):**

*   **(Integration) API Endpoint Tests (`tasks.routes.test.js`):**
    *   **Tool:** `Jest` + `Supertest` + `mongodb-memory-server`.
    *   **Setup:** Before tests, connect to an in-memory MongoDB. After tests, disconnect and clear data. Use helper functions for creating authenticated user tokens/sessions for testing protected routes.
    *   **Goal:** Test each route (`POST /api/tasks`, `GET /api/tasks`, etc.).
    *   **Process:**
        *   Send HTTP requests using `supertest` to your Express app instance.
        *   Simulate different users (if applicable).
        *   Assert on: HTTP status code (e.g., `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`).
        *   Assert on: Response body (correct data shape, specific values).
        *   Assert on: Database state (e.g., after a POST, verify the task exists in the test DB).
    *   **Coverage:** Test success paths, validation errors, authorization errors, edge cases.
*   **(Unit) Service Logic Tests (`tasks.service.test.js` - If Applicable):**
    *   **Tool:** `Jest`.
    *   **Goal:** Test specific business logic functions within the service layer if they are complex and warrant isolated testing.
    *   **Process:** Import the service function, mock any dependencies (like database models using `jest.mock`), call the function with various inputs, assert on the return value or side effects (like mock function calls).
*   **(Unit) Model Tests (`Task.model.test.js` or similar):**
    *   **Tool:** `Jest`.
    *   **Goal:** Verify Mongoose schema works as expected.
    *   **Process:** Create instances of the `Task` model with valid/invalid data. Use Jest matchers to check for validation errors (`expect(task.validate()).rejects.toThrow()`), default values, virtuals, or custom static/instance methods.

**3. Frontend Testing (`client/src/features/tasks/`):**

*   **(Unit) Component Tests (`__tests__/TaskCard.test.jsx`, `__tests__/TaskForm.test.jsx`):**
    *   **Tool:** `Jest` + React Testing Library (RTL).
    *   **Goal:** Test individual components in isolation.
    *   **Process:**
        *   Render the component using RTL's `render()`.
        *   Pass necessary props (including mock functions for event handlers: `jest.fn()`).
        *   Use RTL queries (`getByText`, `getByRole`, etc.) to find elements.
        *   Use `user-event` to simulate interactions (click, type).
        *   Use `expect` (with `@testing-library/jest-dom` matchers like `toBeInTheDocument`, `toHaveValue`) to assert on the rendered output and mock function calls.
    *   **Focus:** Does it render correctly given props? Do event handlers get called when interacted with?
*   **(Unit) Custom Hook Tests (`__tests__/useTasks.test.js`):**
    *   **Tool:** `Jest` + RTL's `renderHook`.
    *   **Goal:** Test the logic within custom hooks.
    *   **Process:**
        *   Render the hook using `renderHook`.
        *   Mock API calls or other external dependencies used by the hook.
        *   Use `act()` to wrap state updates triggered asynchronously (like data fetching).
        *   Assert on the hook's return values (`result.current`) at different stages.
*   **(Integration) Feature/Component Group Tests (`__tests__/TaskManagement.integration.test.jsx`):**
    *   **Tool:** `Jest` + RTL.
    *   **Goal:** Test how multiple components related to the Task feature work together.
    *   **Process:**
        *   Render the main parent component for the feature view (e.g., the page component containing `TaskList`, `TaskForm`, etc.).
        *   Provide necessary context (e.g., Auth Provider, Task State Provider) wrapping the component, potentially with mock values.
        *   Mock API calls at a higher level (e.g., using `jest.mock` on the API client module or using `msw` later).
        *   Simulate a user flow: Fetch tasks -> See list -> Click 'Add Task' -> Fill form -> Submit -> Verify list updates.
        *   Assert on the overall state and visible UI changes across components.

**4. Iteration & Refinement:**

*   Run tests frequently as you develop the feature.
*   Use test failures to guide development and debugging (Test-Driven Development - TDD - principles can be applied here).
*   Refactor tests alongside code to keep them maintainable and relevant.
*   Aim for clear, readable tests that explain the intent of the scenario being tested.

By following this process for each feature, you build a robust safety net, ensuring that individual parts and their interactions work as expected. 