# Authentication Feature

## Overview

The Authentication feature provides user authentication and authorization capabilities for the FlowFocus application. It handles user registration, login, session management, token-based authentication, and profile management.

## Architecture

The authentication feature follows a feature-based architecture pattern with the following structure:

```
src/features/authentication/
├── components/              # UI components related to authentication
│   ├── LoginForm.jsx        # Login form component
│   ├── RegisterForm.jsx     # Registration form component
│   ├── ProtectedRoute.jsx   # Route guard for authenticated routes
│   └── index.js             # Component exports
├── pages/                   # Page components
│   ├── Login.jsx            # Login page
│   ├── Register.jsx         # Registration page
│   └── index.js             # Page exports
├── hooks/                   # Custom hooks
│   └── useAuth.jsx          # Hook for accessing auth state and methods
├── services/                # API services
│   └── authService.js       # Authentication API service
├── store/                   # State management
│   └── authStore.js         # Zustand store for auth state
└── index.js                 # Feature exports
```

## State Management

FlowFocus uses **Zustand** for state management throughout the application, including authentication. Zustand was chosen for its simplicity, minimal boilerplate, and built-in persistence capabilities.

### Key Decisions

1. **Zustand over Context API**:

   - Simpler API with less boilerplate compared to Context + useReducer
   - Built-in persistence with the persist middleware
   - Consistent state management approach across features
   - Easier testing with direct store access

2. **useAuth Hook**:
   - Provides a consistent, feature-specific API for accessing auth state
   - Abstracts the underlying state management implementation
   - Makes testing components that use auth state simpler

## Authentication Flow

1. **Registration**: User submits registration form → API creates user → Returns user data and tokens → Store sets auth state
2. **Login**: User submits credentials → API validates → Returns user data and tokens → Store sets auth state
3. **Authentication Check**: Protected routes check auth state → Redirect to login if not authenticated
4. **Logout**: User clicks logout → API call to invalidate server session → Store clears auth state
5. **Token Management**: Access token stored in memory → Refresh token stored in HTTP-only cookie for security

## Usage Examples

```jsx
// Using the useAuth hook in components
import { useAuth } from "@/features/authentication";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use auth state and methods
}
```

```jsx
// Protecting routes
import { ProtectedRoute } from "@/features/authentication";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```
