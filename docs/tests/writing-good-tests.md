# FlowFocus: Writing Good Tests Guide

Writing tests is crucial, but writing _good_ tests is what truly adds value. Good tests are reliable, maintainable, and clearly communicate the intent of the code they cover. This guide provides principles and best practices for writing effective unit and integration tests in the FlowFocus project.

## Core Principles (FIRST)

A good test suite often adheres to the FIRST principles:

- **Fast:** Tests should run quickly. Slow tests disrupt the development workflow and are run less often. Unit tests should be milliseconds-fast. Integration tests will be slower but should still be optimized (e.g., using in-memory databases).
- **Independent/Isolated:** Tests should not depend on each other. The order in which tests run should not matter. Each test should set up its own preconditions and clean up afterwards, ensuring no side effects impact other tests.
- **Repeatable:** Tests should produce the same results every time they are run, regardless of the environment (local machine, CI server). Avoid dependencies on external factors like network availability (mock API calls), specific dates/times (unless testing time-based logic specifically, then control the time), or existing data in a development database.
- **Self-Validating:** Tests should have a clear boolean output: pass or fail. They shouldn't require manual interpretation of logs or output files. Assertions should clearly define the expected outcome.
- **Timely/Thorough:** Tests should be written _concurrently_ with the code they test (ideally just before or just after). They should cover the essential behaviors, including success paths, failure paths (errors, validation), and edge cases. Don't strive for 100% code coverage blindly; focus on covering critical logic and user-facing behavior.

## Qualities of a Good Test

### 1. Readability & Maintainability

- **Clear Descriptions:** Use descriptive names for your test suites (`describe(...)`) and individual tests (`it(...)` or `test(...)`). The description should clearly state what scenario or behavior is being tested. Example: `it('should return a 401 Unauthorized error if no token is provided')`.
- **Arrange-Act-Assert (AAA) Pattern:** Structure your tests logically:
  - **Arrange:** Set up the preconditions. Prepare inputs, mock dependencies, initialize components or database state.
  * **Act:** Execute the code being tested. Call the function, render the component, make the API request.
  * **Assert:** Verify the outcome. Check return values, state changes, DOM output, mock function calls, response status/body.
- **Keep Tests Simple:** Avoid complex logic, loops, or conditional statements within a test. If a test becomes too complex, it might be testing too many things or the underlying code needs simplification.
- **DRY (Don't Repeat Yourself) Wisely:** Use helper functions or `beforeEach`/`afterEach` hooks for common setup and teardown logic, but avoid excessive abstraction that makes individual tests hard to understand without jumping through multiple files.

### 2. Focus & Specificity

- **Test One Thing:** Each `it(...)` block should ideally test a single concept, behavior, or scenario. This makes failures easier to diagnose.
- **Behavior Over Implementation:** Test _what_ the code does (its public API or observable behavior) rather than _how_ it does it (internal implementation details). This makes tests less brittle to refactoring.
  - **Frontend (RTL):** Focus on what the user sees and interacts with. Find elements by accessible roles, text content, labels. Avoid testing internal component state directly if possible; test the resulting UI changes instead.
  - **Backend:** Test the contract of your API endpoints (request -> response) or the outcome of service functions, not the specific sequence of private function calls within them.

### 3. Reliability

- **Avoid Brittle Selectors (Frontend):** Prefer accessible queries (`getByRole`, `getByLabelText`, `getByText`) over CSS selectors or `getByTestId` where possible. Use `data-testid` sparingly as a last resort when semantic queries aren't feasible.
- **Proper Mocking:** Mock dependencies correctly and consistently. Ensure mocks accurately represent the dependency's behavior for the test scenario. Use `jest.fn()` for spies, `jest.mock()` for modules.
- **Handle Asynchronicity:** Use `async/await` with testing library utilities (like `waitFor`, `findBy*` queries in RTL, `supertest` requests) to handle promises and asynchronous updates correctly. Avoid arbitrary `setTimeout` waits.

## Specific Guidance

### Unit Tests (Jest, RTL for Components)

- **Isolation:** Ensure the unit under test is truly isolated. Mock all external dependencies (functions, modules, components, API calls, hooks).
- **Component Props:** Test how a component renders and behaves based on different sets of props.
- **Event Handlers:** Verify that event handlers passed as props are called when the user interacts with the component (using `user-event` and `expect(mockHandler).toHaveBeenCalled()`).
- **Custom Hooks:** Use `renderHook` from RTL to test the hook's logic, mocking any external calls it makes.

### Integration Tests (Jest, Supertest, RTL)

- **Focus on Interaction:** Verify that different units work together correctly (e.g., route -> controller -> service -> model for backend; multiple components + context/state for frontend).
- **Minimal Mocking:** Mock only at the boundaries of your integration layer (e.g., external third-party APIs). Let the internal components interact directly.
- **Backend API:** Test the full request-response cycle. Verify status codes, response bodies, and side effects (like database changes within the test database).
- **Frontend Feature:** Render a larger component tree representing a feature or page. Provide necessary context (mocked providers if needed). Simulate user flows and assert on the resulting UI across components.
- **Setup/Teardown:** Use `beforeAll`/`afterAll` for setting up/tearing down shared resources (like the test database connection) and `beforeEach`/`afterEach` for cleaning state between individual tests within a suite.

By following these guidelines, you'll build a valuable test suite that supports development, improves code quality, and gives you confidence in your application.
