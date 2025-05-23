import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../../../../../models/userModel.js";
import { jest } from "@jest/globals";

// Mock bcrypt and crypto if necessary for isolated unit tests,
// but for model tests, letting them run might be acceptable
// depending on speed and isolation needs. Let's proceed without mocking for now.

// Re-define helper functions in test scope for direct testing
// (Copied from userModel.js after refactoring)
async function _hashPassword(userInstance, next) {
  if (!userInstance.isModified("password")) return next();
  try {
    userInstance.password = await bcrypt.hash(userInstance.password, 12);
    userInstance.passwordConfirm = undefined;
    next();
  } catch (error) {
    next(error);
  }
}

function _updatePasswordChangedAt(userInstance, next) {
  if (!userInstance.isModified("password") || userInstance.isNew) return next();
  userInstance.passwordChangedAt = new Date(Date.now() - 1000); // Use Date object
  next();
}

describe("User Model - Unit Tests", () => {
  // Helper function to create valid user data
  const createValidUserData = (overrides = {}) => ({
    name: "Test User",
    email: `test-${Date.now()}-${Math.random()}@example.com`, // Ensure unique email
    password: "password123",
    passwordConfirm: "password123",
    ...overrides,
  });

  beforeEach(() => {
    // Clear any potential spies or global mocks if used elsewhere
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Ensure Date mock is cleared
  });

  describe("Schema Validation", () => {
    it("should create a valid user with all required fields", async () => {
      const userData = createValidUserData();
      const user = new User(userData);
      await expect(user.validate()).resolves.toBeUndefined();
    });

    it("should fail if name is missing", async () => {
      const userData = createValidUserData({ name: undefined });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        mongoose.Error.ValidationError
      );
      await expect(user.validate()).rejects.toHaveProperty("errors.name");
    });

    it("should fail if email is missing", async () => {
      const userData = createValidUserData({ email: undefined });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        "Please provide your email"
      );
    });

    it("should fail if email is invalid", async () => {
      const userData = createValidUserData({ email: "invalid-email" });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        "Please provide a valid email address"
      );
    });

    // Note: Uniqueness is typically enforced by the database index, harder to test purely at the model level without DB interaction.
    // Integration tests are better suited for uniqueness checks.

    it("should fail if password is missing", async () => {
      const userData = createValidUserData({ password: undefined });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        "Please provide a password"
      );
    });

    it("should fail if password is too short", async () => {
      const userData = createValidUserData({
        password: "short",
        passwordConfirm: "short",
      });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        "Password must be at least 8 characters long"
      );
    });

    it("should fail if passwordConfirm is missing", async () => {
      const userData = createValidUserData({ passwordConfirm: undefined });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow(
        "Please confirm your password"
      );
    });

    it("should fail if passwords do not match", async () => {
      const userData = createValidUserData({
        passwordConfirm: "differentPassword",
      });
      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow("Passwords do not match");
    });

    it('should set default role to "user"', () => {
      const user = new User(createValidUserData());
      expect(user.role).toBe("user");
    });

    it("should fail if role is not in enum", async () => {
      const userData = createValidUserData({ role: "invalidRole" });
      const user = new User(userData);
      await expect(user.validate()).rejects.toHaveProperty("errors.role");
    });

    it("should set default active status to true", () => {
      const user = new User(createValidUserData());
      expect(user.active).toBe(true);
    });
  });

  // --- Test Helper Functions Directly ---
  describe("Helper Functions (Simulating Hook Logic)", () => {
    let mockNext;
    let userInstance;

    beforeEach(() => {
      mockNext = jest.fn();
      userInstance = {
        name: "Helper Test",
        email: "helper@test.com",
        password: "plainPassword",
        passwordConfirm: "plainPassword",
        passwordChangedAt: undefined,
        isModified: jest.fn(),
        isNew: false,
      };
    });

    describe("_hashPassword", () => {
      it("should hash password and unset passwordConfirm if password is modified", async () => {
        userInstance.isModified.mockReturnValue(true);

        await _hashPassword(userInstance, mockNext);

        expect(userInstance.isModified).toHaveBeenCalledWith("password");
        expect(userInstance.password).not.toBe("plainPassword");
        expect(
          await bcrypt.compare("plainPassword", userInstance.password)
        ).toBe(true);
        expect(userInstance.passwordConfirm).toBeUndefined();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it("should NOT hash password if password is not modified", async () => {
        userInstance.isModified.mockReturnValue(false);
        const originalPassword = userInstance.password;
        const originalConfirm = userInstance.passwordConfirm;

        await _hashPassword(userInstance, mockNext);

        expect(userInstance.isModified).toHaveBeenCalledWith("password");
        expect(userInstance.password).toBe(originalPassword);
        expect(userInstance.passwordConfirm).toBe(originalConfirm);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      });

      // We don't mock bcrypt, so testing its failure is less direct
      // We assume bcrypt works or throws a real error if configured badly
    });

    describe("_updatePasswordChangedAt", () => {
      it("should set passwordChangedAt if password modified and not new", () => {
        userInstance.isModified.mockReturnValue(true);
        userInstance.isNew = false;
        const now = Date.now();
        // Spy on Date.now ONLY for this test
        const dateSpy = jest.spyOn(Date, "now").mockImplementation(() => now);

        _updatePasswordChangedAt(userInstance, mockNext);

        expect(userInstance.isModified).toHaveBeenCalledWith("password");
        expect(userInstance.passwordChangedAt).toBeDefined();
        const expectedTime = now - 1000;
        // Check the time value accurately
        expect(userInstance.passwordChangedAt.getTime()).toBe(expectedTime);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();

        dateSpy.mockRestore(); // Restore Date.now immediately
      });

      it("should NOT set passwordChangedAt if password is not modified", () => {
        userInstance.isModified.mockReturnValue(false);
        userInstance.isNew = false;
        userInstance.passwordChangedAt = undefined;

        _updatePasswordChangedAt(userInstance, mockNext);

        expect(userInstance.isModified).toHaveBeenCalledWith("password");
        expect(userInstance.passwordChangedAt).toBeUndefined();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it("should NOT set passwordChangedAt if document is new", () => {
        userInstance.isModified.mockReturnValue(true);
        userInstance.isNew = true;
        userInstance.passwordChangedAt = undefined;

        _updatePasswordChangedAt(userInstance, mockNext);

        expect(userInstance.isModified).toHaveBeenCalledWith("password");
        expect(userInstance.passwordChangedAt).toBeUndefined();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      });
    });
  });

  // --- Test Instance Methods ---
  describe("Instance Methods", () => {
    let userInstance;
    const plainPassword = "password123";

    beforeEach(async () => {
      // Create a plain object and manually hash password using helper
      userInstance = createValidUserData({
        password: plainPassword,
        passwordConfirm: plainPassword,
      });
      userInstance.isModified = () => true; // Assume modified for hashing
      await _hashPassword(userInstance, () => {}); // Hash the password
      userInstance.isModified = jest.fn(); // Reset isModified for actual tests

      // Bind methods from prototype
      userInstance.correctPassword =
        User.schema.methods.correctPassword.bind(userInstance);
      userInstance.changedPasswordAfter =
        User.schema.methods.changedPasswordAfter.bind(userInstance);
      userInstance.createPasswordResetToken =
        User.schema.methods.createPasswordResetToken.bind(userInstance);
    });

    describe("correctPassword", () => {
      it("should return true for correct password", async () => {
        // Pass the plain password and the *now hashed* password from userInstance
        await expect(
          userInstance.correctPassword(plainPassword, userInstance.password)
        ).resolves.toBe(true);
      });

      it("should return false for incorrect password", async () => {
        await expect(
          userInstance.correctPassword("wrongPassword", userInstance.password)
        ).resolves.toBe(false);
      });
    });

    describe("changedPasswordAfter", () => {
      // Tests from previous version (slightly adapted for plain object)
      it("should return false if passwordChangedAt is undefined", () => {
        userInstance.passwordChangedAt = undefined;
        const jwtTimestamp = Math.floor(Date.now() / 1000);
        expect(userInstance.changedPasswordAfter(jwtTimestamp)).toBe(false);
      });

      it("should return false if password was changed BEFORE the token was issued", () => {
        userInstance.passwordChangedAt = new Date(Date.now() - 2 * 60 * 1000);
        const jwtTimestamp = Math.floor(Date.now() / 1000);
        expect(userInstance.changedPasswordAfter(jwtTimestamp)).toBe(false);
      });

      it("should return true if password was changed AFTER the token was issued", () => {
        const jwtTimestamp = Math.floor((Date.now() - 2 * 60 * 1000) / 1000);
        userInstance.passwordChangedAt = new Date(Date.now());
        expect(userInstance.changedPasswordAfter(jwtTimestamp)).toBe(true);
      });

      // Test the edge case corrected earlier (password change within same second)
      it("should return false if password changed within same second as token issue", () => {
        const now = Date.now();
        const jwtTimestamp = Math.floor(now / 1000);
        userInstance.passwordChangedAt = new Date(now + 100); // Changed 100ms later
        expect(userInstance.changedPasswordAfter(jwtTimestamp)).toBe(false);
      });
    });

    describe("createPasswordResetToken", () => {
      it("should generate a reset token and set related fields", () => {
        const now = Date.now();
        const dateSpy = jest.spyOn(Date, "now").mockImplementation(() => now);

        const resetToken = userInstance.createPasswordResetToken();

        expect(resetToken).toBeDefined();
        expect(typeof resetToken).toBe("string");
        expect(resetToken.length).toBe(64);

        expect(userInstance.passwordResetToken).toBeDefined();
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");
        expect(userInstance.passwordResetToken).toBe(hashedToken);

        expect(userInstance.passwordResetExpires).toBeDefined();
        const expectedExpiry = now + 10 * 60 * 1000;
        expect(userInstance.passwordResetExpires).toBe(expectedExpiry);

        dateSpy.mockRestore();
      });
    });
  });
});
