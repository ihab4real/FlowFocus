import { jest } from "@jest/globals"; // Use this for mocking ES modules

// --- Mock Dependencies ---
jest.unstable_mockModule("../../../models/userModel.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("../../../utils/AppError.js", () => ({
  __esModule: true,
  errorTypes: {
    badRequest: jest.fn((msg) => new Error(msg)),
    unauthorized: jest.fn((msg) => new Error(msg)),
    notFound: jest.fn((msg) => new Error(msg)),
    internal: jest.fn((msg) => new Error(msg)),
    forbidden: jest.fn((msg) => new Error(msg)),
  },
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  __esModule: true,
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

// Refactored Crypto Mock
const mockCryptoDigest = jest.fn();
const mockCryptoUpdate = jest.fn(() => ({ digest: mockCryptoDigest }));
const mockCryptoCreateHash = jest.fn(() => ({ update: mockCryptoUpdate }));

jest.unstable_mockModule("crypto", () => ({
  __esModule: true,
  default: {
    // Keep randomBytes mock if needed elsewhere, otherwise remove if only createHash is used
    randomBytes: jest.fn(() => ({ toString: jest.fn() })),
    createHash: mockCryptoCreateHash, // Use the pre-defined mock function
  },
}));

// --- Import Modules Under Test & Mocks ---
// Import the service functions we need AFTER mocks are defined
const {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetUserPassword,
  changeUserPassword,
} = await import("../../../services/authService.js");

// Import mocks for easy access in tests
const User = (await import("../../../models/userModel.js")).default;
const { errorTypes } = await import("../../../utils/AppError.js");

describe("Auth Service - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests for registerUser ---
  describe("registerUser", () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    };

    it("should register a new user successfully", async () => {
      // Arrange
      User.findOne.mockResolvedValue(null); // No existing user
      const mockNewUser = { _id: "userId123", ...userData };
      User.create.mockResolvedValue(mockNewUser);

      // Act
      const result = await registerUser(userData);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockNewUser);
      // Optionally check logger call
      // expect(logInfo).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });

    it("should throw badRequest if email already exists", async () => {
      // Arrange
      const existingUser = { _id: "existingId", ...userData };
      User.findOne.mockResolvedValue(existingUser); // User found

      // Act & Assert
      await expect(registerUser(userData)).rejects.toThrow(
        "Email already in use"
      );
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Email already in use",
        "EMAIL_IN_USE"
      );
      expect(User.create).not.toHaveBeenCalled(); // Should not attempt creation
      // Optionally check logger call
      // expect(logDebug).toHaveBeenCalledWith(expect.stringContaining("Email already in use"), { email: userData.email });
    });

    it("should throw badRequest on Mongoose validation error during create", async () => {
      // Arrange
      User.findOne.mockResolvedValue(null); // No existing user
      const validationError = new Error("Validation failed message");
      validationError.name = "ValidationError";
      User.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(registerUser(userData)).rejects.toThrow(
        "Validation failed message"
      );
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Validation failed message"
      );
    });

    it("should re-throw other errors during create", async () => {
      // Arrange
      User.findOne.mockResolvedValue(null);
      const genericError = new Error("Something else went wrong");
      User.create.mockRejectedValue(genericError);

      // Act & Assert
      await expect(registerUser(userData)).rejects.toThrow(
        "Something else went wrong"
      );
      expect(errorTypes.badRequest).not.toHaveBeenCalled(); // Ensure it wasn't treated as validation error
    });
  });

  // --- Tests for loginUser ---
  describe("loginUser", () => {
    const credentials = {
      email: "login@example.com",
      password: "password123",
    };
    const mockUser = {
      _id: "userId456",
      email: credentials.email,
      password: "hashedPassword", // Assume it's hashed in the mock DB
      correctPassword: jest.fn(),
    };

    it("should login a user successfully", async () => {
      // Arrange
      // Mock User.findOne().select() chaining
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findOne.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(true);

      // Act
      const result = await loginUser(credentials);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(mockQuery.select).toHaveBeenCalledWith("+password");
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw badRequest if email is missing", async () => {
      // Arrange
      const incompleteCredentials = { password: "password123" };

      // Act & Assert
      await expect(loginUser(incompleteCredentials)).rejects.toThrow(
        "Please provide email and password"
      );
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Please provide email and password"
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw badRequest if password is missing", async () => {
      // Arrange
      const incompleteCredentials = { email: "login@example.com" };

      // Act & Assert
      await expect(loginUser(incompleteCredentials)).rejects.toThrow(
        "Please provide email and password"
      );
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Please provide email and password"
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw unauthorized if user is not found", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(null) }; // User not found
      User.findOne.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(loginUser(credentials)).rejects.toThrow(
        "Incorrect email or password"
      );
      expect(errorTypes.unauthorized).toHaveBeenCalledWith(
        "Incorrect email or password"
      );
      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(mockQuery.select).toHaveBeenCalledWith("+password");
    });

    it("should throw unauthorized if password comparison fails", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findOne.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(false); // Password mismatch

      // Act & Assert
      await expect(loginUser(credentials)).rejects.toThrow(
        "Incorrect email or password"
      );
      expect(errorTypes.unauthorized).toHaveBeenCalledWith(
        "Incorrect email or password"
      );
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
    });
  });

  // --- Tests for requestPasswordReset (Reverted Logic) ---
  describe("requestPasswordReset", () => {
    const email = "reset@example.com";
    // Mock user instance needed by the service's findOne call
    const mockUser = {
      _id: "userId789",
      email: email,
      createPasswordResetToken: jest.fn(),
      save: jest.fn(),
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    };

    beforeEach(() => {
      // Ensure mocks used by this function are reset
      User.findOne.mockClear();
      // We don't mock the user instance methods directly here anymore
      // We mock the result of User.findOne which returns the mockUser
      if (mockUser.save) mockUser.save.mockClear();
      if (mockUser.createPasswordResetToken)
        mockUser.createPasswordResetToken.mockClear();
    });

    it("should find user, generate and save reset token successfully", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser); // Service finds the user
      const mockResetToken = "unhashedToken123";
      mockUser.createPasswordResetToken.mockReturnValue(mockResetToken);
      mockUser.save.mockResolvedValue(true); // Mock successful save on the found user

      // Act
      const result = await requestPasswordReset(email);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(mockUser.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
      expect(result).toBe(mockResetToken);
    });

    it("should throw notFound if user does not exist", async () => {
      // Arrange
      User.findOne.mockResolvedValue(null); // User not found by service

      // Act & Assert
      await expect(requestPasswordReset(email)).rejects.toThrow(
        "User not found"
      );
      expect(errorTypes.notFound).toHaveBeenCalledWith("User not found");
      // Ensure token generation/save wasn't attempted
      expect(mockUser.createPasswordResetToken).not.toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should handle DB error during save and throw internal error", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);
      mockUser.createPasswordResetToken.mockReturnValue("unhashedToken123");
      const dbError = new Error("DB save failed");
      // Configure the save mock on the user instance returned by findOne
      mockUser.save
        .mockRejectedValueOnce(dbError) // First save fails
        .mockResolvedValue(true); // Second save (to clear fields) succeeds

      // Act & Assert
      await expect(requestPasswordReset(email)).rejects.toThrow(
        "Failed to process password reset request."
      );
      expect(errorTypes.internal).toHaveBeenCalledWith(
        "Failed to process password reset request."
      );
      expect(mockUser.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledTimes(2); // Called once to save, once to clear
      expect(mockUser.save).toHaveBeenNthCalledWith(1, {
        validateBeforeSave: false,
      });
      expect(mockUser.save).toHaveBeenNthCalledWith(2, {
        validateBeforeSave: false,
      });
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
    });

    it("should still throw internal error even if clearing fields fails", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);
      mockUser.createPasswordResetToken.mockReturnValue("unhashedToken123");
      const dbError = new Error("DB save failed");
      const secondaryError = new Error("Failed to clear fields");
      mockUser.save
        .mockRejectedValueOnce(dbError) // First save fails
        .mockRejectedValueOnce(secondaryError); // Second save also fails

      // Act & Assert
      await expect(requestPasswordReset(email)).rejects.toThrow(
        "Failed to process password reset request."
      );
      expect(errorTypes.internal).toHaveBeenCalledWith(
        "Failed to process password reset request."
      );
      expect(mockUser.save).toHaveBeenCalledTimes(2);
    });
  });

  // --- Tests for resetUserPassword ---
  describe("resetUserPassword", () => {
    const token = "validResetToken123";
    const newPassword = "newPassword456";
    const passwordConfirm = "newPassword456";
    const hashedToken = "hashedTokenValue";

    // Mock user instance
    const mockUser = {
      _id: "userId101",
      password: "", // Will be set
      passwordConfirm: "", // Will be set
      passwordResetToken: hashedToken, // Assume it was set previously
      passwordResetExpires: Date.now() + 5 * 60 * 1000, // Expires in 5 mins
      save: jest.fn(),
    };

    beforeEach(() => {
      // Clear specific crypto mocks used in this block
      mockCryptoCreateHash.mockClear();
      mockCryptoUpdate.mockClear();
      mockCryptoDigest.mockClear();

      // Configure the mock digest function to return the expected hash
      mockCryptoDigest.mockReturnValue(hashedToken);

      // Reset user save mock
      mockUser.save.mockClear();
    });

    it("should reset password successfully with valid token", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser); // Found user with matching token
      mockUser.save.mockResolvedValue(true); // Successful save

      // Act
      const result = await resetUserPassword(
        token,
        newPassword,
        passwordConfirm
      );

      // Assert
      expect(mockCryptoCreateHash).toHaveBeenCalledWith("sha256");
      expect(mockCryptoUpdate).toHaveBeenCalledWith(token);
      expect(mockCryptoDigest).toHaveBeenCalledWith("hex");
      expect(User.findOne).toHaveBeenCalledWith({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: expect.any(Number) }, // Check expiry logic
      });
      expect(mockUser.password).toBe(newPassword);
      expect(mockUser.passwordConfirm).toBe(passwordConfirm);
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it("should throw badRequest if token is invalid or expired (user not found)", async () => {
      // Arrange
      User.findOne.mockResolvedValue(null); // No user found for the token/expiry

      // Act & Assert
      await expect(
        resetUserPassword(token, newPassword, passwordConfirm)
      ).rejects.toThrow("Token is invalid or has expired");
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Token is invalid or has expired"
      );
      expect(User.findOne).toHaveBeenCalledWith({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: expect.any(Number) },
      });
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should throw badRequest on validation error during save", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);
      const validationError = new Error("Passwords do not match");
      validationError.name = "ValidationError";
      mockUser.save.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        resetUserPassword(token, newPassword, passwordConfirm)
      ).rejects.toThrow("Passwords do not match");
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Passwords do not match"
      );
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it("should re-throw other errors during save", async () => {
      // Arrange
      User.findOne.mockResolvedValue(mockUser);
      const genericError = new Error("DB connection error");
      mockUser.save.mockRejectedValue(genericError);

      // Act & Assert
      await expect(
        resetUserPassword(token, newPassword, passwordConfirm)
      ).rejects.toThrow("DB connection error");
      expect(errorTypes.badRequest).not.toHaveBeenCalled(); // Ensure not treated as validation
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("changeUserPassword", () => {
    const userId = "userToChangePwd";
    const currentPassword = "oldPassword123";
    const newPassword = "newStrongerPassword456";
    const passwordConfirm = "newStrongerPassword456";

    // Mock user instance
    const mockUser = {
      _id: userId,
      password: "hashedOldPassword", // From DB
      correctPassword: jest.fn(),
      save: jest.fn(),
    };

    it("should change password successfully", async () => {
      // Arrange
      const expectedOriginalHashedPassword = mockUser.password; // Store the value *before* the call
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findById.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(true); // Current password matches
      mockUser.save.mockResolvedValue(true); // Save successful

      // Act
      const result = await changeUserPassword(
        userId,
        currentPassword,
        newPassword,
        passwordConfirm
      );

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockQuery.select).toHaveBeenCalledWith("+password");

      // Verify correctPassword call more robustly
      expect(mockUser.correctPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.correctPassword.mock.calls[0][0]).toBe(currentPassword); // Check first argument
      // Compare captured arg against the original value, not the potentially modified mockUser.password
      expect(mockUser.correctPassword.mock.calls[0][1]).toBe(
        expectedOriginalHashedPassword
      );

      expect(mockUser.passwordConfirm).toBe(passwordConfirm);
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      // Check that password property is removed *before* returning
      expect(result.password).toBeUndefined();
    });

    // --- test to explicitly check the password setting/unsetting timing ---
    it("should set new password on instance before save, and unset it before returning", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findById.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(true);
      // Mock save to check the state *during* the save call
      mockUser.save.mockImplementation(async function () {
        // Inside the mocked save, check the properties
        expect(this.password).toBe(newPassword); // 'this' refers to mockUser here
        expect(this.passwordConfirm).toBe(passwordConfirm);
        return true; // Simulate successful save
      });

      // Act
      const result = await changeUserPassword(
        userId,
        currentPassword,
        newPassword,
        passwordConfirm
      );

      // Assert
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result.password).toBeUndefined(); // Check the final returned state
    });

    it("should throw notFound if user is not found", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(null) }; // User not found
      User.findById.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(
        changeUserPassword(
          userId,
          currentPassword,
          newPassword,
          passwordConfirm
        )
      ).rejects.toThrow("User not found");
      expect(errorTypes.notFound).toHaveBeenCalledWith("User not found");
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.correctPassword).not.toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should throw badRequest if current password is incorrect", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findById.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(false); // Current password mismatch

      // Act & Assert
      await expect(
        changeUserPassword(
          userId,
          currentPassword,
          newPassword,
          passwordConfirm
        )
      ).rejects.toThrow("Your current password is incorrect");
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "Your current password is incorrect"
      );
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        currentPassword,
        mockUser.password
      );
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should throw badRequest on validation error during save", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findById.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(true); // Current password OK
      const validationError = new Error("New password too short");
      validationError.name = "ValidationError";
      mockUser.save.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        changeUserPassword(
          userId,
          currentPassword,
          newPassword,
          passwordConfirm
        )
      ).rejects.toThrow("New password too short");
      expect(errorTypes.badRequest).toHaveBeenCalledWith(
        "New password too short"
      );
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it("should re-throw other errors during save", async () => {
      // Arrange
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      User.findById.mockReturnValue(mockQuery);
      mockUser.correctPassword.mockResolvedValue(true);
      const genericError = new Error("Some DB issue");
      mockUser.save.mockRejectedValue(genericError);

      // Act & Assert
      await expect(
        changeUserPassword(
          userId,
          currentPassword,
          newPassword,
          passwordConfirm
        )
      ).rejects.toThrow("Some DB issue");
      expect(errorTypes.badRequest).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });
  });
});
