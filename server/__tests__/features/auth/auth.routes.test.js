import request from "supertest";
import { app } from "../../../app.js"; // Adjust path based on actual app export location
import User from "../../../models/userModel.js";
import jwt from "jsonwebtoken";
import * as emailService from "../../../services/emailService.js"; // Import to mock
import * as authService from "../../../services/authService.js";

// Use an agent to persist cookies between requests in the same test suite if needed
// const agent = request.agent(app);

// Mock the email service
// jest.mock('../../../services/emailService.js'); // Alternative way to mock
const sendPasswordResetEmailMock = jest.spyOn(
  emailService,
  "sendPasswordResetEmail"
);

describe("Authentication API Endpoints", () => {
  // Setup: Ensure the database is clean before each test (likely handled by global setup)

  // Clear mocks before each test in this suite
  beforeEach(() => {
     sendPasswordResetEmailMock.mockClear();
  });

  describe("POST /api/auth/register", () => {
    // Test cases for registration will go here
    it("should register a new user successfully", async () => {
      // Arrange
      const newUser = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      // Act
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert
      // 1. Response body
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined(); // Check for access token
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.password).toBeUndefined(); // Ensure password is not returned

      // 2. Database state
      const dbUser = await User.findOne({ email: newUser.email }).select("+password");
      expect(dbUser).not.toBeNull();
      expect(dbUser.name).toBe(newUser.name);
      // Optionally check if password hash exists and is different from plain password
      expect(dbUser.password).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);

      // 3. Cookies (Refresh Token)
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("HttpOnly");
      expect(refreshTokenCookie).toContain("SameSite=Strict");
      // Check for Secure flag only in production (adjust based on NODE_ENV)
      if (process.env.NODE_ENV === "production") {
        expect(refreshTokenCookie).toContain("Secure");
      }
    });

    it("should return 400 if email already exists", async () => {
      // Arrange: Create a user first
      const existingUser = {
        name: "Existing User",
        email: "exists@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };
      await User.create(existingUser);

      const newUser = {
        name: "New User",
        email: "exists@example.com", // Same email
        password: "newpassword456",
        passwordConfirm: "newpassword456",
      };

      // Act
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(400); // Expecting Bad Request (or 409 Conflict depending on specific error handling)

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/email already in use/i);
    });

    it("should return 400 if passwords do not match", async () => {
      // Arrange
      const newUser = {
        name: "Test User Mismatch",
        email: "mismatch@example.com",
        password: "password123",
        passwordConfirm: "differentPassword", // Mismatch
      };

      // Act
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/passwords do not match/i);
    });

    it("should return 400 if password is too short", async () => {
      // Arrange
      const newUser = {
        name: "Test User Short",
        email: "short@example.com",
        password: "pass", // Too short
        passwordConfirm: "pass",
      };

      // Act
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(
        /password must be at least 8 characters/i
      );
    });

    it("should return 400 if required fields are missing", async () => {
      // Arrange
      const newUser = {
        name: "Test User Missing",
        // email is missing
        password: "password123",
        passwordConfirm: "password123",
      };

      // Act
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      // Check for a message indicating a missing field (e.g., email)
      expect(response.body.message).toMatch(/please provide your email/i);
    });
  });

  describe("POST /api/auth/login", () => {
    const testUser = {
      name: "Login User",
      email: "login@example.com",
      password: "password123",
    };

    // Arrange: Create the user fresh before each login test
    // This ensures the user exists after any global beforeEach cleanup
    beforeEach(async () => {
      // Create the user
      await User.create({ ...testUser, passwordConfirm: testUser.password });
    });

    it("should login an existing user successfully", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password })
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      // 1. Response body
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined(); // Access token
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();

      // 2. Cookies (Refresh Token)
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("HttpOnly");
    });

    it("should return 401 for incorrect password", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "wrongpassword" })
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/incorrect email or password/i);
      expect(response.headers["set-cookie"]).toBeUndefined(); // No cookie on failure
    });

    it("should return 401 for non-existent email", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "nosuchuser@example.com", password: "password123" })
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/incorrect email or password/i);
      expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("should return 400 if email field is missing", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({ password: "password123" }) // Missing email
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/please provide email and password/i);
      expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("should return 400 if password field is missing", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email }) // Missing password
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/please provide email and password/i);
      expect(response.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("POST /api/auth/logout", () => {
    let agent; // Use agent to persist login cookie
    const loginCredentials = {
      email: "logout@example.com",
      password: "password123",
    };

    // Arrange: Create user and log in before tests
    beforeAll(async () => {
      await User.create({
        name: "Logout User",
        ...loginCredentials,
        passwordConfirm: loginCredentials.password,
      });

      agent = request.agent(app); // Initialize agent
      await agent.post("/api/auth/login").send(loginCredentials); // Log in to get cookie
    });

    it("should logout the user by clearing the refresh token cookie", async () => {
      // Act
      const response = await agent // Use the logged-in agent
        .post("/api/auth/logout")
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.message).toMatch(/logged out successfully/i);

      // Check that the cookie is cleared (set to empty, expired)
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("refreshToken=;"); // Cleared value
      expect(refreshTokenCookie).toContain("Expires=Thu, 01 Jan 1970"); // Expired date
    });

    it("should return success even if already logged out (no cookie)", async () => {
      // Arrange: Ensure agent is logged out by calling logout again or using a fresh agent
      await agent.post("/api/auth/logout"); // Call logout first
      // Or: const freshAgent = request.agent(app);

      // Act
      const response = await agent // Use the (now logged out) agent
        .post("/api/auth/logout")
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      // Optionally check cookie header again, should still be cleared/expired
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(refreshTokenCookie).toContain("refreshToken=;");
    });
  });

  describe("POST /api/auth/refresh", () => {
    let agent;
    const loginCredentials = {
      email: "refresh@example.com",
      password: "password123",
    };
    let originalRefreshToken;

    // Arrange: Create user and log in before each refresh test
    beforeEach(async () => {
      // Create user
      await User.create({
        name: "Refresh User",
        ...loginCredentials,
        passwordConfirm: loginCredentials.password,
      });

      // Re-initialize agent and log in to get a fresh cookie for this user
      agent = request.agent(app);
      const loginRes = await agent
        .post("/api/auth/login")
        .send(loginCredentials);

      // Store the original refresh token if needed for specific assertions
      originalRefreshToken = loginRes.headers["set-cookie"]
          .find(cookie => cookie.startsWith("refreshToken="));
    });

    it("should refresh the access token successfully with a valid refresh token cookie", async () => {
      // Act: Make request using the agent which has the cookie
      const response = await agent
        .post("/api/auth/refresh")
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined(); // New access token
      // Ensure the refresh token cookie itself wasn't changed (it shouldn't be in this setup)
      expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("should return 401 if no refresh token cookie is sent", async () => {
      // Act: Use a fresh request object without the agent/cookie
      const response = await request(app)
        .post("/api/auth/refresh")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/refresh token not found/i);
    });

    it("should return 401 if the refresh token is invalid or expired", async () => {
      // Arrange: Manually set an invalid cookie
      const invalidToken = "invalid.token.signature";
      const response = await request(app) // Use fresh request
        .post("/api/auth/refresh")
        .set("Cookie", `refreshToken=${invalidToken}`)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(
        /invalid or expired refresh token/i
      );
      // Check that the invalid cookie was cleared
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(clearedCookie).toContain("refreshToken=;");
      expect(clearedCookie).toContain("Expires=Thu, 01 Jan 1970");
    });

    // Optional: Add test case where user is deleted after refresh token is issued
  });

  describe("GET /api/auth/me (Protected Route)", () => {
    let accessToken;
    let userId;
    const loginCredentials = {
      email: "protected@example.com",
      password: "password123",
    };

    // Arrange: Create user and log in before each test
    beforeEach(async () => {
      // Create user
      const user = await User.create({
        name: "Protected User",
        ...loginCredentials,
        passwordConfirm: loginCredentials.password,
      });
      userId = user._id;

      // Log in to get a fresh access token for this user
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send(loginCredentials);
      accessToken = loginRes.body.token;
    });

    it("should allow access with a valid access token", async () => {
      // Act
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert
      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user._id).toBe(String(userId));
      expect(response.body.data.user.email).toBe(loginCredentials.email);
    });

    it("should return 401 if no access token is provided", async () => {
      // Act
      const response = await request(app)
        .get("/api/auth/me")
        // No Authorization header
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/you are not logged in/i);
    });

    it("should return 401 if the access token is invalid/malformed", async () => {
      // Act
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.format")
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/invalid session/i); // Or specific jwt error
    });

    it("should return 401 if the access token is expired", async () => {
      // Arrange: Generate an expired token
      // Note: Requires jwt library and knowledge of the secret/expiry
      const expiredToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "-1s", // Expired 1 second ago
      });

      // Act
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/session has expired/i);
    });

    it("should return 401 if the user associated with the token is deleted", async () => {
      // Arrange: Create a temporary user, get token, then delete user
      const tempUserData = {
        name: "Temp User",
        email: "temp@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };
      const tempUser = await User.create(tempUserData);
      const tempLoginRes = await request(app)
        .post("/api/auth/login")
        .send(tempUserData);
      const tempAccessToken = tempLoginRes.body.token;
      await User.findByIdAndDelete(tempUser._id);

      // Act
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempAccessToken}`)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/token no longer exists/i);
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    const testUser = {
      name: "Forgot Pwd User",
      email: "forgot@example.com",
      password: "password123",
    };

    // Arrange: Create the user fresh before each test
    beforeEach(async () => {
      await User.create({ ...testUser, passwordConfirm: testUser.password });
    });

    // Mock implementation for successful email sending
    beforeEach(() => {
         sendPasswordResetEmailMock.mockClear();
         sendPasswordResetEmailMock.mockResolvedValue(); // Simulate successful send
    });

    it("should return 200 and trigger email sending if user exists", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email })
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response
      expect(response.body.status).toBe("success");
      expect(response.body.message).toMatch(/link has been sent/i);

      // Assert DB state (check if reset token fields were set)
      const dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser.passwordResetToken).toBeDefined();
      expect(dbUser.passwordResetExpires).toBeDefined();
      expect(dbUser.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());

      // Assert Email Service Interaction
      expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
      expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        expect.any(String) // Check that a reset token string was passed
      );
    });

    it("should return 200 but NOT trigger email sending if user does not exist", async () => {
      const nonExistentEmail = "nosuchuser@example.com";

      // Act
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: nonExistentEmail })
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response
      expect(response.body.status).toBe("success");
      expect(response.body.message).toMatch(/link has been sent/i);

       // Assert Email Service Interaction
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    });

    it("should return 400 if email field is missing", async () => {
       // Act
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({}) // Missing email
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/please provide an email/i);
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    });

     it("should still return 200 even if email sending fails internally", async () => {
      // Arrange: Mock email sending to fail
       sendPasswordResetEmailMock.mockRejectedValue(new Error("SMTP Error"));

      // Act
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email })
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response (should still be generic success)
      expect(response.body.status).toBe("success");
      expect(response.body.message).toMatch(/link has been sent/i);

      // Assert Email Service Interaction (it was called, but failed)
      expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
       expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        expect.any(String)
      );
    });
  });

  describe("PATCH /api/auth/reset-password/:token", () => {
    let resetToken; // Unhashed token
    const testUser = {
      name: "Reset Pwd User",
      email: "reset@example.com",
      password: "oldpassword123",
    };

    // Arrange: Create user and generate token before each test
    beforeEach(async () => {
      // Create user
      const user = await User.create({
        ...testUser,
        passwordConfirm: testUser.password,
      });
      // Generate a fresh token for this user instance
      resetToken = await authService.requestPasswordReset(testUser.email);
      sendPasswordResetEmailMock.mockClear(); // Clear mock calls from token generation
    });

    it("should reset password successfully with a valid token", async () => {
      const newPassword = "newStrongPassword456";

      // Act
      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: newPassword,
          passwordConfirm: newPassword,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined(); // New access token
      expect(response.body.data.user.email).toBe(testUser.email);

      // Assert Cookie (new refresh token)
       const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.find(c => c.startsWith("refreshToken="))).toBeDefined();

      // Assert DB state
      const dbUser = await User.findOne({ email: testUser.email }).select("+password");
      expect(dbUser.passwordResetToken).toBeUndefined();
      expect(dbUser.passwordResetExpires).toBeUndefined();
      // Check that the password was actually changed and hashed
      const isMatch = await dbUser.correctPassword(newPassword, dbUser.password);
      expect(isMatch).toBe(true);
    });

    it("should return 400 if token is invalid or expired", async () => {
      const newPassword = "newStrongPassword456";

      // Act
      const response = await request(app)
        .patch(`/api/auth/reset-password/invalidToken123`)
        .send({
          password: newPassword,
          passwordConfirm: newPassword,
        })
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/token is invalid or has expired/i);
    });

     it("should return 400 if token has expired (simulate expiry)", async () => {
        // Arrange: Manually set the expiry in the past for the user
        const user = await User.findOne({ email: testUser.email });
        user.passwordResetExpires = new Date(Date.now() - 10 * 60 * 1000); // Expired 10 mins ago
        await user.save({ validateBeforeSave: false });

        const newPassword = "newStrongPassword456";

        // Act
        const response = await request(app)
            .patch(`/api/auth/reset-password/${resetToken}`)
            .send({
                password: newPassword,
                passwordConfirm: newPassword,
            })
            .expect("Content-Type", /json/)
            .expect(400);

        // Assert
        expect(response.body.status).toBe("fail");
        expect(response.body.message).toMatch(/token is invalid or has expired/i);

         // Cleanup: Optionally reset expiry for other tests or rely on global cleanup
         user.passwordResetExpires = undefined;
         user.passwordResetToken = undefined; // Reset token too as it was consumed
         await user.save({ validateBeforeSave: false });
    });

    it("should return 400 if passwords do not match", async () => {
      // Act
      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: "newStrongPassword456",
          passwordConfirm: "mismatchedPassword",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/passwords do not match/i);
    });

    it("should return 400 if new password is too short", async () => {
        // Act
      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: "short",
          passwordConfirm: "short",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/password must be at least 8 characters/i);
    });

      it("should return 400 if password fields are missing", async () => {
        // Act
      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({}) // Missing passwords
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/provide new password and confirmation/i);
    });
  });

  describe("PATCH /api/auth/change-password", () => {
    let agent;
    let accessToken;
    const testUser = {
      name: "Change Pwd User",
      email: "changepwd@example.com",
      password: "oldpassword123",
    };

    // Arrange: Create user and log in
    beforeEach(async () => {
      await User.create({ ...testUser, passwordConfirm: testUser.password });
      agent = request.agent(app);
      const loginRes = await agent
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      accessToken = loginRes.body.token; // Store token if needed for non-agent requests
    });

    it("should change password successfully with valid token and current password", async () => {
      const changePayload = {
        currentPassword: testUser.password,
        password: "newStrongPassword789",
        passwordConfirm: "newStrongPassword789",
      };

      // Act: Use agent (which has cookie) OR set header manually
      const response = await agent // Using agent automatically includes cookies
        .patch("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`) // Still need access token header
        .send(changePayload)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined(); // New access token issued
      expect(response.body.data.user.email).toBe(testUser.email);

       // Assert Cookie (new refresh token)
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.find(c => c.startsWith("refreshToken="))).toBeDefined();

      // Assert DB state
      const dbUser = await User.findOne({ email: testUser.email }).select("+password");
      const isMatch = await dbUser.correctPassword(changePayload.password, dbUser.password);
      expect(isMatch).toBe(true);
      expect(dbUser.passwordChangedAt).toBeDefined();
    });

    it("should return 400 if current password is incorrect", async () => {
       const changePayload = {
        currentPassword: "wrongOldPassword",
        password: "newStrongPassword789",
        passwordConfirm: "newStrongPassword789",
      };

      // Act
      const response = await agent
        .patch("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePayload)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
       expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/current password is incorrect/i);
    });

    it("should return 400 if new passwords do not match", async () => {
      const changePayload = {
        currentPassword: testUser.password,
        password: "newStrongPassword789",
        passwordConfirm: "mismatchingNewPassword",
      };
       // Act
      const response = await agent
        .patch("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePayload)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/passwords do not match/i);
    });

    it("should return 400 if new password is too short", async () => {
       const changePayload = {
        currentPassword: testUser.password,
        password: "short",
        passwordConfirm: "short",
      };
       // Act
      const response = await agent
        .patch("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePayload)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/password must be at least 8 characters/i);
    });

    it("should return 401 if access token is missing/invalid", async () => {
       const changePayload = {
        currentPassword: testUser.password,
        password: "newStrongPassword789",
        passwordConfirm: "newStrongPassword789",
      };
      // Act
      const response = await request(app) // Use fresh request without auth header
        .patch("/api/auth/change-password")
        .send(changePayload)
        .expect("Content-Type", /json/)
        .expect(401);

       // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/you are not logged in/i);
    });
  });

  describe("PATCH /api/auth/update-profile", () => {
    let agent;
    let accessToken;
    let userId;
    const originalUserData = {
      name: "Update User",
      email: "update@example.com",
      password: "password123",
    };

    // Arrange: Create user and log in
    beforeEach(async () => {
      const user = await User.create({
        ...originalUserData,
        passwordConfirm: originalUserData.password,
      });
      userId = user._id;

      agent = request.agent(app);
      const loginRes = await agent
        .post("/api/auth/login")
        .send({ email: originalUserData.email, password: originalUserData.password });
      accessToken = loginRes.body.token;
    });

    it("should update user profile successfully with valid data", async () => {
      const updatePayload = {
        name: "Updated User Name",
        email: "updated.email@example.com",
      };

      // Act
      const response = await agent
        .patch("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response
      expect(response.body.status).toBe("success");
      expect(response.body.data.user.name).toBe(updatePayload.name);
      expect(response.body.data.user.email).toBe(updatePayload.email);
      expect(response.body.data.user._id).toBe(String(userId));

      // Assert DB state
      const dbUser = await User.findById(userId);
      expect(dbUser.name).toBe(updatePayload.name);
      expect(dbUser.email).toBe(updatePayload.email);
    });

     it("should only update provided allowed fields", async () => {
      const updatePayload = {
        name: "Only Name Updated",
        role: "admin", // Attempt to update disallowed field
      };

      // Act
      const response = await agent
        .patch("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert Response shows only name updated
      expect(response.body.status).toBe("success");
      expect(response.body.data.user.name).toBe(updatePayload.name);
      expect(response.body.data.user.role).toBe("user"); // Role should not have changed

      // Assert DB state confirms role didn't change
      const dbUser = await User.findById(userId);
      expect(dbUser.name).toBe(updatePayload.name);
      expect(dbUser.role).toBe("user");
    });

    it("should return 400 if attempting to update password", async () => {
      const updatePayload = {
        name: "Attempt Password Update",
        password: "newpassword123",
      };

       // Act
      const response = await agent
        .patch("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/not for password updates/i);
    });

    it("should return 400 for invalid email format", async () => {
      const updatePayload = { email: "invalid-email" };

      // Act
      const response = await agent
        .patch("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert (message from Mongoose validator)
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/provide a valid email address/i);
    });

    it("should return 400 if no valid fields are provided", async () => {
      const updatePayload = { role: "admin", unknownField: "abc" }; // Only invalid/disallowed fields

       // Act
      const response = await agent
        .patch("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(400);

        // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/no valid fields provided/i);
    });

    it("should return 401 if access token is missing/invalid", async () => {
      const updatePayload = { name: "New Name Fail" };

      // Act
      const response = await request(app) // Use fresh request
        .patch("/api/auth/update-profile")
        .send(updatePayload)
        .expect("Content-Type", /json/)
        .expect(401);

      // Assert
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toMatch(/you are not logged in/i);
    });

     // Restore original email after tests in this block if needed for subsequent blocks
    // afterAll(async () => { ... });
  });
});
