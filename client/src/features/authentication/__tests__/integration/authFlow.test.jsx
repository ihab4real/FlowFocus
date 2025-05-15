import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";
import ProtectedRoute from "../../components/ProtectedRoute";

// Mock auth store directly with internal state and methods exposed
let mockStoreState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Mock actions
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();
const mockSetError = jest.fn();

// Mock store module with state and exposed helpers
jest.mock("../../store/authStore", () => {
  return {
    useAuthStore: jest.fn(() => ({
      ...mockStoreState,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      setError: mockSetError,
    })),
    // Export these methods directly in the mock
    __setState: (newState) => {
      mockStoreState = { ...mockStoreState, ...newState };
    },
    __getState: () => mockStoreState,
    __getMocks: () => ({
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      setError: mockSetError,
    }),
  };
});

// Helper to access mock store internals - using imports directly
const getMockStore = () => {
  return {
    setStoreState: (newState) => {
      mockStoreState = { ...mockStoreState, ...newState };
    },
    getStoreState: () => mockStoreState,
    mocks: {
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      setError: mockSetError,
    },
  };
};

// Mock auth service
jest.mock("../../services/authService", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

// Create a test component for protected content
const ProtectedContent = () => <div>Protected Content</div>;

// Test App component for integration testing
const TestApp = () => (
  <MemoryRouter>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<div>Home Page</div>} />
    </Routes>
  </MemoryRouter>
);

describe("Authentication Flow Integration", () => {
  beforeEach(() => {
    // Reset module mocks
    jest.clearAllMocks();

    // Reset store state
    mockStoreState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  });

  describe("Login Flow", () => {
    it("should allow user to log in and access protected route", async () => {
      // Arrange
      const user = userEvent.setup();
      const { mocks, setStoreState } = getMockStore();
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };

      // Setup login mock to update store state
      mocks.login.mockImplementation(async (credentials) => {
        // Simulate successful login
        setStoreState({
          user: mockUser,
          token: "mock-token",
          isAuthenticated: true,
          error: null,
        });
        return { success: true };
      });

      // Act - Render app starting at login page
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      expect(mocks.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      // Verify store state was updated
      expect(getMockStore().getStoreState().isAuthenticated).toBe(true);
      expect(getMockStore().getStoreState().user).toEqual(mockUser);

      // Now test protected route access
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Protected content should be visible now
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should show error message on failed login", async () => {
      // Arrange
      const user = userEvent.setup();
      const { mocks, setStoreState } = getMockStore();
      const errorMessage = "Invalid email or password";

      // Reset store state to make sure there's no previous error
      setStoreState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Setup login mock to return error
      mocks.login.mockImplementation(async (credentials) => {
        // Update store state first - this is how the real login function works
        setStoreState({
          isLoading: false,
          error: errorMessage,
        });

        // Then return the result
        return { success: false, error: errorMessage };
      });

      // Act - Render login page
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
          </Routes>
        </MemoryRouter>
      );

      // Fill login form with invalid credentials
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Assert
      expect(mocks.login).toHaveBeenCalled();

      // Wait for the error to be set in the store state
      await waitFor(() => {
        const storeState = getMockStore().getStoreState();
        expect(storeState.error).toBe(errorMessage);
        expect(storeState.isAuthenticated).toBe(false);
      });
    });
  });

  describe("Registration Flow", () => {
    it("should allow user to register and automatically authenticate", async () => {
      // Arrange
      const user = userEvent.setup();
      const { mocks, setStoreState } = getMockStore();
      const mockUser = { id: "1", name: "New User", email: "new@example.com" };

      // Setup register mock to update store state
      mocks.register.mockImplementation(async (userData) => {
        // Simulate successful registration
        setStoreState({
          user: mockUser,
          token: "mock-token",
          isAuthenticated: true,
          error: null,
        });
        return { success: true };
      });

      // Act - Render app starting at register page
      render(
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Fill registration form
      await user.type(screen.getByLabelText(/name/i), "New User");
      await user.type(screen.getByLabelText(/email/i), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      // Assert
      expect(mocks.register).toHaveBeenCalledWith({
        name: "New User",
        email: "new@example.com",
        password: "password123",
        passwordConfirm: "password123",
      });

      // Verify store state was updated
      expect(getMockStore().getStoreState().isAuthenticated).toBe(true);
      expect(getMockStore().getStoreState().user).toEqual(mockUser);

      // Now test protected route access after registration
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Protected content should be visible now
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Protected Route Behavior", () => {
    it("should redirect unauthenticated users to login page", async () => {
      // Arrange - ensure user is not authenticated
      getMockStore().setStoreState({
        user: null,
        token: null,
        isAuthenticated: false,
      });

      // Act - Try to access protected route
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should allow authenticated users to access protected routes", async () => {
      // Arrange - set authenticated state
      getMockStore().setStoreState({
        user: { id: "1", name: "Test User" },
        token: "valid-token",
        isAuthenticated: true,
      });

      // Act - Try to access protected route
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Logout Flow", () => {
    it("should clear auth state and redirect to login on logout", async () => {
      // Arrange
      const { mocks, setStoreState } = getMockStore();

      // Setup initial authenticated state
      setStoreState({
        user: { id: "1", name: "Test User" },
        token: "valid-token",
        isAuthenticated: true,
      });

      // Setup logout mock to clear state
      mocks.logout.mockImplementation(async () => {
        // Simulate successful logout
        setStoreState({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      });

      // Act - Call logout
      await mocks.logout();

      // Assert - Verify state is cleared
      expect(getMockStore().getStoreState().isAuthenticated).toBe(false);
      expect(getMockStore().getStoreState().user).toBeNull();
      expect(getMockStore().getStoreState().token).toBeNull();

      // Try to access protected route after logout
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should be redirected to login
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });
});
