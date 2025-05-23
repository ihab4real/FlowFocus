import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { createSuccessResponse, createErrorResponse } from "../setup/testUtils";

// Mock the authService
jest.mock("../../services/authService", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    validateResetToken: jest.fn(),
  },
}));

describe("authStore", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isValidatingToken: false,
      isValidToken: false,
      tokenValidationError: null,
    });
  });

  // Test for initial state
  it("should have the correct initial state", () => {
    // Act
    const state = useAuthStore.getState();

    // Assert
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.isValidatingToken).toBe(false);
    expect(state.isValidToken).toBe(false);
    expect(state.tokenValidationError).toBeNull();
  });

  // Test login action - success
  it("should update state correctly on successful login", async () => {
    // Arrange
    const mockUser = { id: "1", name: "Test User", email: "test@example.com" };
    const mockCredentials = {
      email: "test@example.com",
      password: "password123",
    };
    const mockResponse = createSuccessResponse({ user: mockUser });

    authService.login.mockResolvedValue(mockResponse);

    // Act
    const result = await useAuthStore.getState().login(mockCredentials);
    const state = useAuthStore.getState();

    // Assert
    expect(authService.login).toHaveBeenCalledWith(mockCredentials);
    expect(result.success).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("mock-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  // Test login action - failure
  it("should update state correctly on failed login", async () => {
    // Arrange
    const mockCredentials = {
      email: "test@example.com",
      password: "wrongpassword",
    };
    const mockError = createErrorResponse("Invalid credentials");

    authService.login.mockRejectedValue(mockError);

    // Act
    const result = await useAuthStore.getState().login(mockCredentials);
    const state = useAuthStore.getState();

    // Assert
    expect(authService.login).toHaveBeenCalledWith(mockCredentials);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Invalid credentials");
  });

  // Test register action - success
  it("should update state correctly on successful registration", async () => {
    // Arrange
    const mockUser = { id: "1", name: "New User", email: "new@example.com" };
    const mockUserData = {
      name: "New User",
      email: "new@example.com",
      password: "password123",
      passwordConfirm: "password123",
    };
    const mockResponse = createSuccessResponse({ user: mockUser });

    authService.register.mockResolvedValue(mockResponse);

    // Act
    const result = await useAuthStore.getState().register(mockUserData);
    const state = useAuthStore.getState();

    // Assert
    expect(authService.register).toHaveBeenCalledWith(mockUserData);
    expect(result.success).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("mock-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  // Test register action - failure
  it("should update state correctly on failed registration", async () => {
    // Arrange
    const mockUserData = {
      name: "New User",
      email: "existing@example.com",
      password: "password123",
      passwordConfirm: "password123",
    };
    const mockError = createErrorResponse("Email already in use");

    authService.register.mockRejectedValue(mockError);

    // Act
    const result = await useAuthStore.getState().register(mockUserData);
    const state = useAuthStore.getState();

    // Assert
    expect(authService.register).toHaveBeenCalledWith(mockUserData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email already in use");
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Email already in use");
  });

  // Test logout action
  it("should clear auth state on logout", async () => {
    // Arrange - set authenticated state first
    useAuthStore.setState({
      user: { id: "1", name: "Test User" },
      token: "test-token",
      isAuthenticated: true,
    });

    // Act
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();

    // Assert
    expect(authService.logout).toHaveBeenCalled();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  // Test checkAuth action - already authenticated
  it("should return true when already authenticated with valid token", async () => {
    // Arrange
    const mockUser = { id: "1", name: "Test User" };
    useAuthStore.setState({
      user: mockUser,
      token: "valid-token",
      isAuthenticated: true,
    });

    const mockResponse = createSuccessResponse({ user: mockUser });
    authService.getCurrentUser.mockResolvedValue(mockResponse);

    // Act
    const result = await useAuthStore.getState().checkAuth();
    const state = useAuthStore.getState();

    // Assert
    expect(result).toBe(true);
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  // Test checkAuth with refresh
  it("should refresh token and return true when original token is expired", async () => {
    // Arrange
    useAuthStore.setState({
      user: { id: "1", name: "Test User" },
      token: "expired-token",
      isAuthenticated: true,
    });

    // Mock getCurrentUser to fail with 401
    const authError = createErrorResponse("Token expired");
    authError.response.status = 401;
    authService.getCurrentUser.mockRejectedValue(authError);

    // Mock refreshToken to succeed
    const refreshResponse = { token: "new-token" };
    authService.refreshToken.mockResolvedValue(refreshResponse);

    // Act
    const result = await useAuthStore.getState().checkAuth();
    const state = useAuthStore.getState();

    // Assert
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.refreshToken).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(state.token).toBe("new-token");
    expect(state.isAuthenticated).toBe(true);
  });

  // Test checkAuth with failed refresh
  it("should logout when token refresh fails", async () => {
    // Arrange
    useAuthStore.setState({
      user: { id: "1", name: "Test User" },
      token: "expired-token",
      isAuthenticated: true,
    });

    // Mock getCurrentUser to fail with 401
    const authError = createErrorResponse("Token expired");
    authError.response.status = 401;
    authService.getCurrentUser.mockRejectedValue(authError);

    // Mock refreshToken to fail
    authService.refreshToken.mockRejectedValue(new Error("Refresh failed"));

    // Act
    const result = await useAuthStore.getState().checkAuth();
    const state = useAuthStore.getState();

    // Assert
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.refreshToken).toHaveBeenCalled();
    expect(result).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // Test validateResetToken on reset password page email links
  describe("validateResetToken action", () => {
    const testToken = "test-reset-token-123";

    it("should update validation state correctly on successful token validation", async () => {
      // Arrange
      const mockResponse = {
        status: "success",
        message: "Reset token is valid",
      };
      authService.validateResetToken.mockResolvedValue(mockResponse);

      // Act
      await useAuthStore.getState().validateResetToken(testToken);
      const state = useAuthStore.getState();

      // Assert
      expect(authService.validateResetToken).toHaveBeenCalledWith(testToken);
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(true);
      expect(state.tokenValidationError).toBeNull();
    });

    it("should update validation state correctly on token validation failure", async () => {
      // Arrange
      const errorMessage = "Token is invalid or has expired";
      const mockError = createErrorResponse(errorMessage);
      authService.validateResetToken.mockRejectedValue(mockError);

      // Act
      await useAuthStore.getState().validateResetToken(testToken);
      const state = useAuthStore.getState();

      // Assert
      expect(authService.validateResetToken).toHaveBeenCalledWith(testToken);
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(false);
      expect(state.tokenValidationError).toBe(errorMessage);
    });

    it("should set loading state during validation", async () => {
      // Arrange
      let resolveValidation;
      const validationPromise = new Promise((resolve) => {
        resolveValidation = resolve;
      });
      authService.validateResetToken.mockReturnValue(validationPromise);

      // Act - start validation but don't wait
      const validatePromise = useAuthStore
        .getState()
        .validateResetToken(testToken);

      // Assert loading state
      const loadingState = useAuthStore.getState();
      expect(loadingState.isValidatingToken).toBe(true);
      expect(loadingState.isValidToken).toBe(false);
      expect(loadingState.tokenValidationError).toBeNull();

      // Complete the validation
      resolveValidation({ status: "success" });
      await validatePromise;

      // Assert final state
      const finalState = useAuthStore.getState();
      expect(finalState.isValidatingToken).toBe(false);
      expect(finalState.isValidToken).toBe(true);
    });

    it("should handle missing token parameter", async () => {
      // Act
      await useAuthStore.getState().validateResetToken();
      const state = useAuthStore.getState();

      // Assert
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(false);
      expect(state.tokenValidationError).toBe("No reset token provided");
      expect(authService.validateResetToken).not.toHaveBeenCalled();
    });

    it("should handle empty token parameter", async () => {
      // Act
      await useAuthStore.getState().validateResetToken("");
      const state = useAuthStore.getState();

      // Assert
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(false);
      expect(state.tokenValidationError).toBe("No reset token provided");
      expect(authService.validateResetToken).not.toHaveBeenCalled();
    });

    it("should handle generic error responses without specific message", async () => {
      // Arrange
      const genericError = new Error("Network error");
      authService.validateResetToken.mockRejectedValue(genericError);

      // Act
      await useAuthStore.getState().validateResetToken(testToken);
      const state = useAuthStore.getState();

      // Assert
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(false);
      expect(state.tokenValidationError).toBe("Network error");
    });

    it("should reset validation state between calls", async () => {
      // Arrange - Set some previous validation state
      useAuthStore.setState({
        isValidToken: true,
        tokenValidationError: null,
      });

      const errorMessage = "Token expired";
      const mockError = createErrorResponse(errorMessage);
      authService.validateResetToken.mockRejectedValue(mockError);

      // Act
      await useAuthStore.getState().validateResetToken(testToken);
      const state = useAuthStore.getState();

      // Assert - Previous state should be cleared
      expect(state.isValidatingToken).toBe(false);
      expect(state.isValidToken).toBe(false);
      expect(state.tokenValidationError).toBe(errorMessage);
    });
  });
});
