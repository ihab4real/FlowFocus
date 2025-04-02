# FlowFocus Server

## Authentication System Implementation

This document provides an overview of the authentication system implemented for the FlowFocus application.

## Features

- User registration and login
- JWT-based authentication
- Password reset functionality
- User profile management
- Role-based access control
- Security features (rate limiting, password hashing, etc.)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/forgot-password` - Request password reset
- `PATCH /api/auth/reset-password/:token` - Reset password using token

### User Management (Protected Routes)

- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/update-profile` - Update user profile
- `PATCH /api/auth/change-password` - Change password

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

Make sure to set the following environment variables in your `.env` file:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, production)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - JWT expiration time (e.g., '90d')

## Security Measures

- Password hashing with bcrypt
- JWT authentication
- Rate limiting to prevent brute force attacks
- Secure HTTP headers with Helmet
- Input validation and sanitization
- CORS protection

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

1. **Registration**: User provides name, email, and password
2. **Login**: User provides email and password, receives JWT token
3. **Authentication**: Protected routes require valid JWT token in Authorization header
4. **Password Reset**: User requests reset, receives token via email, then sets new password

## Future Enhancements

- Email verification
- OAuth integration (Google, GitHub)
- Two-factor authentication
- Session management
- Account lockout after failed attempts
