import { jest } from "@jest/globals"; // Import jest globals for ESM support

// Mock dependencies first using unstable_mockModule
jest.unstable_mockModule("../../../services/tokenService.js", () => ({
  __esModule: true,
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  __esModule: true,
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
}));

// Import the mocks and the module under test after mocking
let tokenService;
let logger;
let oauthService;

// Import the mocked dependencies and service under test
const setup = async () => {
  tokenService = await import("../../../services/tokenService.js");
  logger = await import("../../../utils/logger.js");
  oauthService = await import("../../../services/oauthService.js");
};

describe("OAuth Service", () => {
  beforeAll(async () => {
    await setup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleOAuthSuccess", () => {
    it("should generate tokens and return user data", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
      };
      tokenService.generateAccessToken.mockReturnValue("access-token-123");
      tokenService.generateRefreshToken.mockReturnValue("refresh-token-456");

      // Act
      const result = await oauthService.handleOAuthSuccess(mockUser);

      // Assert
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
        mockUser._id
      );
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(
        mockUser._id
      );
      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        user: mockUser,
      });
    });

    it("should log and rethrow errors", async () => {
      // Arrange
      const mockUser = { _id: "user123" };
      const mockError = new Error("Token generation failed");
      tokenService.generateAccessToken.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(oauthService.handleOAuthSuccess(mockUser)).rejects.toThrow(
        mockError
      );
      expect(logger.logError).toHaveBeenCalledWith(
        "Error handling OAuth success",
        expect.objectContaining({
          userId: mockUser._id,
          error: mockError.message,
        })
      );
    });
  });

  describe("processOAuthProfile", () => {
    it("should process Google profile correctly", () => {
      // Arrange
      const provider = "google";
      const profile = {
        id: "google123",
        displayName: "John Doe",
        emails: [{ value: "john@example.com" }],
        name: { givenName: "John", familyName: "Doe" },
      };

      // Act
      const result = oauthService.processOAuthProfile(provider, profile);

      // Assert
      expect(result).toEqual({
        provider: "google",
        providerId: "google123",
        email: "john@example.com",
        name: "John Doe",
      });
      expect(logger.logDebug).toHaveBeenCalledWith(
        "Processed OAuth profile",
        expect.objectContaining({
          provider: "google",
          profileId: "google123",
        })
      );
    });

    it("should process GitHub profile correctly", () => {
      // Arrange
      const provider = "github";
      const profile = {
        id: "github456",
        displayName: "Jane Smith",
        username: "janesmith",
        emails: [{ value: "jane@example.com" }],
      };

      // Act
      const result = oauthService.processOAuthProfile(provider, profile);

      // Assert
      expect(result).toEqual({
        provider: "github",
        providerId: "github456",
        email: "jane@example.com",
        name: "Jane Smith",
      });
    });

    it("should handle missing email in profile", () => {
      // Arrange
      const provider = "google";
      const profile = {
        id: "google123",
        displayName: "John Doe",
        // No emails array
      };

      // Act
      const result = oauthService.processOAuthProfile(provider, profile);

      // Assert
      expect(result).toEqual({
        provider: "google",
        providerId: "google123",
        name: "John Doe",
      });
      // No email property should be present
      expect(result.email).toBeUndefined();
    });

    it("should handle missing name in profile but with username (GitHub)", () => {
      // Arrange
      const provider = "github";
      const profile = {
        id: "github456",
        // No displayName
        username: "janesmith",
        emails: [{ value: "jane@example.com" }],
      };

      // Act
      const result = oauthService.processOAuthProfile(provider, profile);

      // Assert
      expect(result.name).toBe("janesmith");
    });

    it("should use fallback name when no name information is available", () => {
      // Arrange
      const provider = "github";
      const profile = {
        id: "github456",
        // No displayName or username
        emails: [{ value: "jane@example.com" }],
      };

      // Act
      const result = oauthService.processOAuthProfile(provider, profile);

      // Assert
      expect(result.name).toBe("GitHub User");
    });
  });
});
