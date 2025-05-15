import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { authService } from "../../services/authService";
import apiClient from "@/services/api/apiClient";

// Mock the API client
jest.mock("@/services/api/apiClient", () => ({
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
}));

describe("authService", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should call apiClient.post with the correct parameters", async () => {
      // Arrange
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };
      const mockResponse = { data: { user: userData } };
      apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/auth/register",
        userData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("login", () => {
    it("should call apiClient.post with the correct parameters", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        data: { user: { email: credentials.email } },
        token: "mock-token",
      };
      apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/auth/login",
        credentials
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getCurrentUser", () => {
    it("should call apiClient.get with the correct path", async () => {
      // Arrange
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };
      const mockResponse = { data: { user: mockUser } };
      apiClient.get.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith("/api/auth/me");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateProfile", () => {
    it("should call apiClient.patch with the correct parameters", async () => {
      // Arrange
      const profileData = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const mockResponse = { data: { user: profileData } };
      apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.updateProfile(profileData);

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/auth/update-profile",
        profileData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("changePassword", () => {
    it("should call apiClient.patch with the correct parameters", async () => {
      // Arrange
      const passwordData = {
        currentPassword: "oldpassword",
        password: "newpassword",
        passwordConfirm: "newpassword",
      };
      const mockResponse = {
        data: { user: { id: "1" } },
        token: "new-token",
      };
      apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.changePassword(passwordData);

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/auth/change-password",
        passwordData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("forgotPassword", () => {
    it("should call apiClient.post with the correct parameters", async () => {
      // Arrange
      const data = { email: "test@example.com" };
      const mockResponse = { data: { message: "Password reset email sent" } };
      apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.forgotPassword(data);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        data
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("resetPassword", () => {
    it("should call apiClient.patch with the correct parameters", async () => {
      // Arrange
      const token = "reset-token";
      const passwordData = {
        password: "newpassword",
        passwordConfirm: "newpassword",
      };
      const mockResponse = {
        data: { user: { id: "1" } },
        token: "new-access-token",
      };
      apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.resetPassword(token, passwordData);

      // Assert
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/auth/reset-password/${token}`,
        passwordData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("logout", () => {
    it("should call apiClient.post with the correct path", async () => {
      // Arrange
      const mockResponse = { data: { message: "Logged out successfully" } };
      apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.logout();

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("refreshToken", () => {
    it("should call apiClient.post with the correct path", async () => {
      // Arrange
      const mockResponse = { token: "new-access-token" };
      apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith("/api/auth/refresh");
      expect(result).toEqual(mockResponse);
    });
  });
});
