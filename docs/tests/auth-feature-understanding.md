# Understanding the User Authentication Feature for Testing

This document outlines the boundaries, components, and scenarios for testing the User Authentication feature in FlowFocus.

## 1. Feature Requirements & User Stories

- **Core Functionality:**
  - Users must be able to create a new account (Sign Up).
  - Registered users must be able to log in to their account (Login).
  - Logged-in users must be able to log out (Logout).
  - User sessions should persist between browser sessions using refresh tokens.
  - Certain application routes/API endpoints must be protected, accessible only to authenticated users.
- **Data:**
  - User accounts require at least an email and password.
  - Passwords must be securely hashed before storage.
- **Security:**
  - JSON Web Tokens (JWT) for authentication: short-lived access tokens and longer-lived refresh tokens.
  - Mechanisms to handle token expiration and renewal.
- **Future Enhancements:**
  - OAuth (Google/GitHub) login.

## 2. Component Mapping

### Backend (`server/`)

- **Routes:** `server/routes/authRoutes.js` - Defines endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
  - `POST /api/auth/forgot-password`
  - `PATCH /api/auth/reset-password/:token`
  - `GET /api/auth/me` (Protected)
  - `PATCH /api/auth/update-profile` (Protected)
  - `PATCH /api/auth/change-password` (Protected)
- **Controllers:** `server/controllers/authController.js` - Acts as the interface between routes and services:
  - Parses request data (`req.body`, `req.params`, `req.cookies`).
  - Calls appropriate service methods (`authService`, `userService`, `tokenService`).
  - Handles response formatting (`res.status().json()`) and cookie setting (`sendRefreshTokenCookie` helper).
  - Functions: `register`, `login`, `logout`, `refreshAccessToken`, `forgotPassword`, `resetPassword`, `getMe`, `updateProfile`, `changePassword`.
- **Services:**
  - `server/services/authService.js`: Contains core authentication business logic.
    - `registerUser`: Handles user existence check, delegates creation to `User.create`.
    - `loginUser`: Handles credential validation, user lookup, password comparison via `user.correctPassword`.
    - `requestPasswordReset`: Finds user, triggers `user.createPasswordResetToken`, saves user, returns token.
    - `resetUserPassword`: Finds user by hashed token, updates password fields, saves user.
    - `changeUserPassword`: Finds user, verifies current password, updates password fields, saves user.
  - `server/services/tokenService.js`: Manages JWT operations.
    - `generateAccessToken`: Creates short-lived access token.
    - `generateRefreshToken`: Creates long-lived refresh token.
    - `verifyAccessToken`: Verifies access token signature and expiry.
    - `verifyRefreshToken`: Verifies refresh token signature and expiry.
  - `server/services/userService.js`: Handles non-auth user operations.
    - `updateUserProfile`: Filters allowed fields, updates user profile data using `User.findByIdAndUpdate`.
- **Models:** `server/models/userModel.js` (`User` model) - Defines schema and handles data-level logic:
  - Schema includes fields like `password`, `passwordChangedAt`, `passwordResetToken`, etc.
  - `pre('save')` middleware for password hashing (`bcrypt`).
  - `pre('save')` middleware for updating `passwordChangedAt`.
  - `correctPassword` method for comparing passwords (`bcrypt`).
  - `createPasswordResetToken` method for generating/hashing reset token.
- **Middleware:**
  - `server/middleware/authMiddleware.js`:
    - `protect`: Verifies **access token** from `Authorization` header using `tokenService.verifyAccessToken`, fetches user, attaches user to `req.user`.
    - `restrictTo`: Middleware factory for role-based authorization.
  - `cookie-parser`: Used globally in `app.js` to parse `req.cookies`.

### Frontend (`client/src/`)

- **Feature Folder:** `client/src/features/authentication/` - Organized feature directory structure:
  - `components/`: UI components for authentication
  - `hooks/`: Custom hooks for authentication state management
  - `pages/`: Page-level components for different auth routes
  - `services/`: API service layer for auth requests
  - `store/`: Zustand store for centralized auth state management
  - `__tests__/`: Unit and integration tests for authentication
- **Components:**
  - `LoginForm.jsx`: Renders login form inputs, handles submission, displays errors
  - `RegisterForm.jsx`: Renders signup form inputs, handles submission, displays errors
  - `ForgotPasswordForm.jsx`: Form for requesting password reset emails
  - `ResetPasswordForm.jsx`: Form for setting a new password with a reset token
  - `ProtectedRoute.jsx`: HOC that redirects unauthenticated users to login
- **Hooks:** `useAuth.jsx` - Custom hook wrapper around the Zustand store for simplified API access
- **State Management:** Zustand store at `store/authStore.js`:
  - Provides persistent auth state (user, token, isAuthenticated)
  - Manages auth actions (login, register, logout, etc.)
  - Handles token refresh and authentication verification
  - Implements checkAuth for validating authentication state
- **Services:** `services/authService.js` - Interface for all auth-related API endpoints:
  - Registration, login, logout
  - Password reset flow
  - Profile management
  - Token refresh
- **API Client:** Enhanced axios instance at `src/services/api/apiClient.js`:
  - Automatically attaches auth tokens to requests
  - Handles token refresh on 401 responses from non-auth endpoints
  - Implements request queue for handling concurrent requests during token refresh
  - Provides consistent response transformations for both original and retried requests

## 3. Key Test Scenarios

### Backend (API Integration Tests - `server/__tests__/features/auth/`)

- **Signup (`POST /api/auth/register`):**
  - Success (201): Returns user data and **access token** in body. Sets **refresh token** in secure HTTP-only cookie. Verify user in DB.
  - Failures (400, etc.): Invalid data (model validation), email already exists (service check).
- **Login (`POST /api/auth/login`):**
  - Success (200): Returns user data and **access token** in body. Sets **refresh token** cookie. Verify cookie attributes (HttpOnly, Secure, SameSite, MaxAge).
  - Failures (400, 401): Missing fields, user not found, incorrect password (service checks).
- **Logout (`POST /api/auth/logout`):**
  - Success (200): Clears the **refresh token** cookie. Verify cookie is cleared/expired.
- **Refresh Token (`POST /api/auth/refresh`):**
  - Success (200): Valid **refresh token** cookie sent, returns new **access token** in body.
  - Failure (401): No refresh token cookie sent.
  - Failure (401): Invalid or expired refresh token in cookie (service check). Verify cookie is cleared on failure.
  - Failure (401): User associated with refresh token not found.
- **Forgot Password (`POST /api/auth/forgot-password`):**
  - Success (200): Valid email provided, returns generic success message. Verify reset token fields set in DB (service logic). Verify email simulation logged (actual email sending TBD).
  - Success (200): Email not found, still returns generic success message (prevents enumeration).
- **Reset Password (`PATCH /api/auth/reset-password/:token`):**
  - Success (200): Valid (unhashed) token in URL finds user, updates password, returns new **access token** in body, sets new **refresh token** cookie. Verify password hash changed, reset fields cleared in DB.
  - Failure (400): Token invalid/expired (service check).
  - Failure (400): Password validation fails (model validation).
- **Protected Endpoint Access (`GET /api/auth/me`):**
  - Success (200): Valid **access token** in `Authorization` header allows access, returns user data.
  - Failure (401): Missing/invalid/expired **access token** (checked by `protect` middleware using `tokenService`).
  - Failure (401): User associated with access token deleted.
- **Update Profile (`PATCH /api/auth/update-profile`):**
  - Success (200): Authenticated user (valid access token), updates name/email, returns updated user (service logic).
  - Failure (401): Not authenticated.
  - Failure (400): Attempting to update password (service check).
  - Failure (400): Invalid data (model validation).
- **Change Password (`PATCH /api/auth/change-password`):**
  - Success (200): Authenticated user, correct `currentPassword`, valid new password, returns new **access token**, sets new **refresh token** cookie. Verify password hash changed, `passwordChangedAt` updated.
  - Failure (401): Not authenticated.
  - Failure (400): `currentPassword` incorrect (service check).
  - Failure (400): New password validation fails (model validation).

### Frontend (Component/Hook Unit & Integration Tests - `client/src/features/authentication/__tests__/`)

- **`LoginForm.jsx` (Unit):**
  - Renders correctly (email, password fields, submit button)
  - Displays validation errors for invalid inputs (e.g., invalid email format)
  - Calls the login function from authStore on submit with form data
  - Disables submit button during submission
  - Displays API error messages (e.g., "Invalid credentials")
- **`RegisterForm.jsx` (Unit):**
  - Renders correctly (email, password, confirm password fields, submit button)
  - Displays validation errors (email format, password mismatch, password length)
  - Calls register function from authStore on submit
  - Displays API error messages (e.g., "Email already exists")
- **`ForgotPasswordForm.jsx` (Unit):**
  - Renders email input and submit button
  - Validates email format
  - Calls authService.forgotPassword on submit
  - Shows success message after submission
  - Displays API error messages
- **`ResetPasswordForm.jsx` (Unit):**
  - Renders password inputs and submit button
  - Validates password length and matching
  - Calls authService.resetPassword with token and new password
  - Shows success message and redirects to login
  - Displays API error messages
- **`authStore.js` (Unit):**
  - Initial state is correct (e.g., `isAuthenticated: false`, `user: null`)
  - `login` action:
    - Sets loading state while in progress
    - Calls authService with correct arguments
    - Updates state correctly on success (sets user, token, isAuthenticated)
    - Handles errors correctly (sets error state)
  - `register` action functions similarly to login
  - `logout` action:
    - Calls authService.logout
    - Clears user, token, and isAuthenticated state
  - `checkAuth` action:
    - Verifies token validity with server
    - Attempts token refresh if original token is invalid
    - Updates auth state accordingly
- **`useAuth.js` Hook (Unit):**
  - Returns the same state and functions as authStore
- **Auth Integration (Integration):**
  - Components that depend on auth state (e.g., App layout, Navbar) respond to auth state changes
  - Simulate login: UI updates to show authenticated state
  - Simulate logout: UI reverts to unauthenticated state
- **API Client Integration (Integration):**
  - Attaches auth token to authenticated requests
  - Skips token refresh for authentication endpoints (login, register, etc.)
  - Handles 401 responses by refreshing token
  - Retries failed requests after successful token refresh
- **Protected Route Component (Integration):**
  - Renders child component when authenticated
  - Redirects to login page when not authenticated
- **Password Reset Flow (Integration):**
  - Request password reset sends email request to server
  - Reset password form updates password with valid token
  - User can login with new password after reset

This detailed breakdown provides a clear scope for the User Authentication feature tests covering both backend and frontend.
