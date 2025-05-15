import { jest, describe, it, expect } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

// Mock the Zustand store
jest.mock("../../store/authStore", () => {
  // Create a mock store with the same structure
  const mockStore = {
    user: { id: "1", name: "Test User" },
    token: "mock-token",
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  return {
    useAuthStore: jest.fn(() => mockStore),
  };
});

describe("useAuth hook", () => {
  it("should return the auth store state and methods", () => {
    // Arrange & Act
    const { result } = renderHook(() => useAuth());

    // Assert
    // Verify all properties from the store are returned
    expect(result.current.user).toEqual({ id: "1", name: "Test User" });
    expect(result.current.token).toBe("mock-token");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify all methods from the store are returned
    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe("function");
    expect(result.current.register).toBeDefined();
    expect(typeof result.current.register).toBe("function");
    expect(result.current.logout).toBeDefined();
    expect(typeof result.current.logout).toBe("function");
    expect(result.current.checkAuth).toBeDefined();
    expect(typeof result.current.checkAuth).toBe("function");
    expect(result.current.updateProfile).toBeDefined();
    expect(typeof result.current.updateProfile).toBe("function");
    expect(result.current.changePassword).toBeDefined();
    expect(typeof result.current.changePassword).toBe("function");

    // Verify useAuthStore was called
    expect(useAuthStore).toHaveBeenCalled();
  });
});
