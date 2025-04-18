# FlowFocus Testing Strategy

## 1. Philosophy & Goals

- **Test Early, Test Often:** Implement tests concurrently with feature development, not as an afterthought. This catches regressions early, improves code quality, and provides living documentation.
- **Confidence & Safety:** Tests provide confidence to refactor code and add new features without breaking existing functionality.
- **Feature-Focused:** Organize tests around application features (e.g., User Management, Task Management) rather than strictly separating by backend/frontend layers. This aligns tests more closely with user-facing functionality.
- **Pragmatic Approach:** Prioritize unit and integration tests during initial development for faster feedback loops. Defer full end-to-end (E2E) tests until major features are stable.

## 2. Types of Tests

- **Unit Tests:**
  - **Purpose:** Verify the smallest, isolated parts of the codebase (e.g., utility functions, individual React components, Mongoose model methods).
  - **Scope:** Test a single function or component in isolation, mocking dependencies.
  - **Tools:** Jest (Runner + Assertions), React Testing Library (for UI components).
- **Integration Tests:**
  - **Purpose:** Verify the interaction between different parts of a feature.
  - **Scope (Backend):** Test API endpoints. Ensure controllers/services interact correctly with models/database (using a test database) and return expected responses.
  - **Scope (Frontend):** Test how multiple components work together (e.g., a form submitting data and updating a list), interaction with state management, or component rendering based on mock API responses.
  - **Tools:** Jest, Supertest (for API testing), `mongodb-memory-server` (for test database), React Testing Library.
- **End-to-End (E2E) Tests (Deferred):**
  - **Purpose:** Simulate real user workflows across the entire application (frontend + backend).
  - **Scope:** Critical user paths (e.g., signup -> login -> create task -> logout).
  - **Tools:** Playwright (Planned).
  - **Priority:** Lower; implement towards the end of the project lifecycle.

## 3. Tools & Technologies

- **Test Runner & Framework:** **Jest** (for both Server and Client)
  - Provides test running, assertions, mocking, and code coverage.
- **Backend API Testing:** **Supertest**
  - Makes HTTP requests to Express API endpoints within tests.
- **Test Database:** **`mongodb-memory-server`**
  - Provides an in-memory MongoDB instance for fast, isolated backend tests.
- **Frontend Component Testing:** **React Testing Library (RTL)**
  - Encourages testing components based on user interaction and accessibility.
  - **`@testing-library/jest-dom`**: Adds useful DOM-specific matchers for Jest.
  - **`@testing-library/user-event`**: Simulates user interactions more realistically.
- **E2E Testing (Planned):** **Playwright**

## 4. Folder Structure & Organization

- **Co-location:** Tests reside within their respective project (`server` or `client`).
- **Server (`server/__tests__`):**
  - `server/__tests__/unit/`: Unit tests for utilities, helpers, model methods.
  - `server/__tests__/features/`: Integration tests, grouped by feature.
    - `features/auth/auth.test.js`
    - `features/tasks/tasks.routes.test.js`
    - `features/tasks/tasks.service.test.js`
    - `features/notes/...`
    - `features/pomodoro/...`
  - `server/__tests__/setup/`: Test setup files (e.g., database connection helper).
- **Client (`client/src/`):**
  - Tests can be placed alongside the code they test (`*.test.jsx` or `*.spec.jsx`) OR within a `__tests__` subfolder.
  - Group tests by feature within the `src/features/` directory:
    - `client/src/features/authentication/__tests__/LoginForm.test.jsx`
    - `client/src/features/tasks/components/__tests__/TaskCard.test.jsx`
    - `client/src/features/tasks/__tests__/useTasks.test.js` (custom hook)
    - `client/src/components/__tests__/`: Tests for shared/common components.
- **E2E (Planned - `client/e2e/`):**
  - Place Playwright test files here, likely grouped by user workflow.
    - `client/e2e/auth.spec.js`
    - `client/e2e/tasks.spec.js`

## 5. Running Tests

- **Server Tests:**
  - `cd server`
  - `npm test` or `yarn test` (Will run all tests in `server/__tests__`)
  - (Optional) `npm test -- --watch` for interactive watch mode.
  - (Optional) `npm test -- features/tasks` to run only task-related tests.
- **Client Tests:**
  - `cd client`
  - `npm test` or `yarn test` (Will run all tests in `client/src`)
  - (Optional) `npm test -- --watch` for interactive watch mode.
- **All Unit/Integration Tests (from Root):**
  - Add a script to the root `package.json`:
    `"test": "cd server && npm test && cd ../client && npm test"`
- **E2E Tests (from Client):**
  - `cd client`
  - `npm run test:e2e` or `yarn test:e2e` (Requires a dedicated script using Playwright CLI).

## 6. Implementation Plan

1.  **Phase 1: Setup & Configuration:**
    - Install dev dependencies (`jest`, `supertest`, `mongodb-memory-server` in `server`; `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom` in `client`).
    - Configure Jest for both `server` (Node env) and `client` (JSDOM env, via Vite config likely).
    - Add `test` scripts to `server/package.json` and `client/package.json`.
    - Create backend test setup helpers (e.g., in `server/__tests__/setup/`).
2.  **Phase 2: Feature Testing - User Authentication:**
    - Backend: Integration tests for signup, login, refresh token API endpoints.
    - Frontend: Unit/Integration tests for Login, Signup forms, related components, and auth context/store.
3.  **Phase 3: Feature Testing - Tasks:**
    - Backend: Integration tests for Task CRUD API endpoints. Unit tests for any complex service logic.
    - Frontend: Unit/Integration tests for Task components (list, card, form), drag-and-drop interactions (mocked), state management.
4.  **Phase 4: Feature Testing - Notes:**
    - Backend: Integration tests for Note CRUD API endpoints.
    - Frontend: Unit/Integration tests for Note components (editor, list, folders), state management.
5.  **Phase 5: Feature Testing - Pomodoro:**
    - Backend: Integration tests for Pomodoro session API endpoints.
    - Frontend: Unit/Integration tests for Timer component, settings, history display.
6.  **Phase 6: Habit Tracker & Ongoing Testing:**
    - Add tests for the Habit Tracker feature as it's developed.
    - Continue adding tests for new features and bug fixes.
    - Aim for reasonable code coverage.
7.  **Phase 7: E2E Testing (Later):**
    - Configure Playwright.
    - Implement E2E tests for critical user flows covering multiple features.
    - Integrate into CI/CD pipeline.

---

_This document outlines the strategy. Refer to specific test files for implementation details._
