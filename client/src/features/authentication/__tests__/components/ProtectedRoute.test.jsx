import { jest, describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuthStore } from "../../store/authStore";

// Mock the auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

describe("ProtectedRoute Component", () => {
  it("should render children when user is authenticated", () => {
    // Arrange
    useAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", name: "Test User" },
    });

    // Act
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to login when user is not authenticated", () => {
    // Arrange
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    // Setup a mock for window.history.replaceState to track navigation
    const mockHistoryReplace = jest.fn();
    Object.defineProperty(window, "history", {
      writable: true,
      value: { replaceState: mockHistoryReplace },
    });

    // Act
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Dashboard")).not.toBeInTheDocument();
  });

  it("should redirect to login when user is null", () => {
    // Arrange
    useAuthStore.mockReturnValue({
      isAuthenticated: true, // true but user is null should still redirect
      user: null,
    });

    // Act
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Dashboard")).not.toBeInTheDocument();
  });
});
