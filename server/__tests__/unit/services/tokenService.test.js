import { jest } from "@jest/globals";

// Mock the jsonwebtoken library
jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    // Mock the default export
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

// Store original process.env for restoration
const originalEnv = process.env;

// Import the service *after* mocking
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = await import("../../../services/tokenService.js");
const jwt = (await import("jsonwebtoken")).default;

describe("Token Service - Unit Tests", () => {
  beforeEach(() => {
    // Reset mocks and restore environment variables before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env after all tests
    process.env = originalEnv;
  });

  const userId = "testUserId123";
  const mockSecret = "mock-access-secret";
  const mockRefreshSecret = "mock-refresh-secret";
  const mockExpiresIn = "15m";
  const mockRefreshExpiresIn = "7d";

  describe("generateAccessToken", () => {
    beforeEach(() => {
      process.env.JWT_SECRET = mockSecret;
      process.env.JWT_EXPIRES_IN = mockExpiresIn;
    });

    it("should generate an access token successfully", () => {
      const mockToken = "mockAccessToken";
      jwt.sign.mockReturnValue(mockToken);

      const token = generateAccessToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith({ id: userId }, mockSecret, {
        expiresIn: mockExpiresIn,
      });
      expect(token).toBe(mockToken);
    });

    it("should throw error if JWT_SECRET is missing", () => {
      delete process.env.JWT_SECRET;
      expect(() => generateAccessToken(userId)).toThrow(
        "JWT secret or expiration time is not defined"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw error if JWT_EXPIRES_IN is missing", () => {
      delete process.env.JWT_EXPIRES_IN;
      expect(() => generateAccessToken(userId)).toThrow(
        "JWT secret or expiration time is not defined"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("generateRefreshToken", () => {
    beforeEach(() => {
      process.env.JWT_REFRESH_SECRET = mockRefreshSecret;
      process.env.JWT_REFRESH_EXPIRES_IN = mockRefreshExpiresIn;
    });

    it("should generate a refresh token successfully", () => {
      const mockToken = "mockRefreshToken";
      jwt.sign.mockReturnValue(mockToken);

      const token = generateRefreshToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith({ id: userId }, mockRefreshSecret, {
        expiresIn: mockRefreshExpiresIn,
      });
      expect(token).toBe(mockToken);
    });

    it("should throw error if JWT_REFRESH_SECRET is missing", () => {
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => generateRefreshToken(userId)).toThrow(
        "JWT refresh secret or expiration time is not defined"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw error if JWT_REFRESH_EXPIRES_IN is missing", () => {
      delete process.env.JWT_REFRESH_EXPIRES_IN;
      expect(() => generateRefreshToken(userId)).toThrow(
        "JWT refresh secret or expiration time is not defined"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("verifyAccessToken", () => {
    const token = "validAccessToken";
    const decodedPayload = { id: userId, iat: 123, exp: 456 };

    beforeEach(() => {
      process.env.JWT_SECRET = mockSecret;
    });

    it("should verify an access token successfully", async () => {
      jwt.verify.mockReturnValue(decodedPayload);

      const result = await verifyAccessToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, mockSecret);
      expect(result).toEqual(decodedPayload);
    });

    it("should throw error if JWT_SECRET is missing", async () => {
      delete process.env.JWT_SECRET;
      await expect(verifyAccessToken(token)).rejects.toThrow(
        "JWT secret is not defined"
      );
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should re-throw JsonWebTokenError from jwt.verify", async () => {
      const jwtError = new Error("Invalid signature");
      jwtError.name = "JsonWebTokenError";
      jwt.verify.mockImplementation(() => {
        throw jwtError;
      });

      await expect(verifyAccessToken(token)).rejects.toThrow(
        "Invalid signature"
      );
      expect(jwt.verify).toHaveBeenCalledWith(token, mockSecret);
    });

    it("should re-throw TokenExpiredError from jwt.verify", async () => {
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await expect(verifyAccessToken(token)).rejects.toThrow("jwt expired");
      expect(jwt.verify).toHaveBeenCalledWith(token, mockSecret);
    });
  });

  describe("verifyRefreshToken", () => {
    const token = "validRefreshToken";
    const decodedPayload = { id: userId, iat: 789, exp: 101 };

    beforeEach(() => {
      process.env.JWT_REFRESH_SECRET = mockRefreshSecret;
    });

    it("should verify a refresh token successfully", async () => {
      jwt.verify.mockReturnValue(decodedPayload);

      const result = await verifyRefreshToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, mockRefreshSecret);
      expect(result).toEqual(decodedPayload);
    });

    it("should throw error if JWT_REFRESH_SECRET is missing", async () => {
      delete process.env.JWT_REFRESH_SECRET;
      await expect(verifyRefreshToken(token)).rejects.toThrow(
        "JWT refresh secret is not defined"
      );
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should re-throw errors from jwt.verify", async () => {
      const genericError = new Error("Verification failed");
      jwt.verify.mockImplementation(() => {
        throw genericError;
      });

      await expect(verifyRefreshToken(token)).rejects.toThrow(
        "Verification failed"
      );
      expect(jwt.verify).toHaveBeenCalledWith(token, mockRefreshSecret);
    });
  });
});
