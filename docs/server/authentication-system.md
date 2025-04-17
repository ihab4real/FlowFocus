# FlowFocus Server Authentication System

This document provides an overview of the authentication and authorization system implemented for the FlowFocus application server.

## Core Concepts

-   **JWT Access/Refresh Tokens:** The system uses JSON Web Tokens (JWT) for managing user sessions.
    -   **Access Token:** Short-lived (~15 minutes), sent in the `Authorization: Bearer <token>` header. Used to access protected resources.
    -   **Refresh Token:** Longer-lived (~7 days), stored securely in an HTTP-only cookie. Used to obtain new access tokens without requiring the user to log in again.
-   **Service Layer:** Business logic is encapsulated within dedicated service modules (`authService`, `tokenService`, `userService`) to promote separation of concerns.
-   **HTTP-Only Cookies:** Refresh tokens are transmitted via cookies configured with `HttpOnly`, `Secure` (in production), and `SameSite=Strict` flags to mitigate cross-site scripting (XSS) and cross-site request forgery (CSRF) attacks.

## Features

-   User registration and login.
-   JWT-based authentication using Access and Refresh tokens.
-   Secure refresh token handling via HTTP-only cookies.
-   Password reset functionality (token generation, email simulation).
-   User profile retrieval and updates (name, email).
-   Password change functionality for logged-in users.
-   Role-based access control (`restrictTo` middleware).
-   Security features (rate limiting, password hashing, input sanitization).

## API Endpoints

### Authentication & Authorization

-   `POST /api/auth/register`: Register a new user.
-   `POST /api/auth/login`: Login a user, returns access token in body, sets refresh token cookie.
-   `POST /api/auth/logout`: Clears the refresh token cookie.
-   `POST /api/auth/refresh`: Uses refresh token from cookie to issue a new access token.
-   `POST /api/auth/forgot-password`: Request password reset (simulates email sending).
-   `PATCH /api/auth/reset-password/:token`: Reset password using token from simulated email.

### User Management (Protected Routes - Require Valid Access Token)

-   `GET /api/auth/me`: Get current user profile.
-   `PATCH /api/auth/update-profile`: Update user profile (name, email).
-   `PATCH /api/auth/change-password`: Change password for the logged-in user.

## Architecture Layers

1.  **Routes (`server/routes/`)**: Define API endpoints and link them to controller functions. Apply middleware (`protect`, `restrictTo`).
2.  **Middleware (`server/middleware/`)**: Handle cross-cutting concerns like authentication (`protect`), authorization (`restrictTo`), error handling, cookie parsing.
3.  **Controllers (`server/controllers/`)**: Parse requests, call services, format responses, set cookies.
4.  **Services (`server/services/`)**: Contain business logic.
    -   `authService.js`: User registration, login, password changes/resets.
    -   `tokenService.js`: JWT generation (access/refresh) and verification.
    -   `userService.js`: User profile updates.
5.  **Models (`server/models/`)**: Define Mongoose schemas (`User`) and handle data validation, password hashing (`bcrypt`), and specific data methods (`correctPassword`, `createPasswordResetToken`).
6.  **Utils (`server/utils/`)**: Helper functions (e.g., `asyncHandler`, `AppError`, `logger`).

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `config/config.env.example` template
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

Ensure the following environment variables are set in your `.env` file:

-   `PORT` - Server port (default: 3000)
-   `NODE_ENV` - Environment (development, production)
-   `MONGO_URI` - MongoDB connection string
-   `JWT_SECRET` - Secret key for **Access Token** signing (e.g., a long random string)
-   `JWT_EXPIRES_IN` - **Access Token** expiration time (e.g., `15m`, `1h`)
-   `JWT_REFRESH_SECRET` - **DIFFERENT** secret key for **Refresh Token** signing
-   `JWT_REFRESH_EXPIRES_IN` - **Refresh Token** expiration time (e.g., `7d`, `30d`)
-   `CORS_ORIGIN` - Allowed client origin for CORS (e.g., `http://localhost:5173`)

## Security Measures

-   Password hashing with `bcrypt`.
-   JWT authentication (separate Access/Refresh tokens).
-   Refresh tokens stored in secure `HttpOnly` cookies.
-   Rate limiting (`express-rate-limit`).
-   Secure HTTP headers (`helmet`).
-   Input sanitization (`express-mongo-sanitize`).
-   CORS protection.
-   Generic responses for `forgotPassword` to prevent email enumeration.

## Error Handling

The API uses a centralized error handling system with custom error classes. All errors are properly formatted and returned with appropriate HTTP status codes.

## Models

### User Model

- `name` - User's full name
- `email` - User's email (unique)
- `password` - Hashed password
- `role` - User role (user, admin)
- `active` - Account status
- `passwordChangedAt` - Timestamp of last password change
- `passwordResetToken` - Token for password reset
- `passwordResetExpires` - Expiration time for password reset token

## Authentication Flow

1.  **Registration/Login**: User provides credentials. Server validates via `authService`. On success, `tokenService` generates access and refresh tokens. Access token is sent in response body, refresh token is sent in an `HttpOnly` cookie.
2.  **Authenticated Request**: Client sends request to a protected route with Access Token in `Authorization: Bearer <token>` header.
3.  **Protection Middleware (`protect`)**: Middleware intercepts the request, extracts token, uses `tokenService.verifyAccessToken`. If valid and user exists, attaches user to `req.user` and allows access.
4.  **Access Token Expiry**: If `protect` middleware finds the access token is expired (or invalid), it returns a 401 error.
5.  **Token Refresh**: Client detects 401 error. Sends a request to `/api/auth/refresh`. This request automatically includes the `HttpOnly` refresh token cookie.
6.  **Refresh Endpoint**: Server verifies refresh token cookie using `tokenService.verifyRefreshToken`. If valid, `tokenService.generateAccessToken` creates a new access token, which is sent back in the response body.
7.  **Logout**: Client sends request to `/api/auth/logout`. Server clears the refresh token cookie.
8.  **Password Reset**: User requests reset (`/forgot-password`). `authService` generates token, saves hash to DB (token sent via simulated email). User clicks link (`/reset-password/:token`), provides new password. `authService` verifies token hash, updates password, user logs in again (or is issued new tokens).

## Future Enhancements

- Email verification
- OAuth integration (Google, GitHub)
- Two-factor authentication
- Session management
- Account lockout after failed attempts
