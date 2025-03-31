# API Service Layer

This directory contains the API service layer implementation for the FlowFocus client application. It provides a robust and consistent way to interact with the backend API.

## Structure

- `apiClient.js`: Configures and exports an Axios instance with interceptors for handling authentication, errors, and common request/response transformations.
- `apiService.js`: Provides a base service class with common CRUD operations and specialized API methods.

## Features

- Centralized API configuration
- Automatic token handling
- Comprehensive error handling
- Request/Response interceptors
- Standardized CRUD operations
- Support for custom endpoints and actions

## Usage Example

```javascript
import { exampleService } from "./services/api/apiService";

// Get all items
const items = await exampleService.getAll();

// Get item by ID
const item = await exampleService.getById(123);

// Create new item
const newItem = await exampleService.create({
  title: "New Item",
  description: "Description",
});

// Update item
const updatedItem = await exampleService.update(123, {
  title: "Updated Title",
});

// Delete item
await exampleService.delete(123);

// Custom query
const filteredItems = await exampleService.query({
  status: "active",
  category: "work",
});

// Execute custom action
const result = await exampleService.executeAction(123, "archive");
```

## Error Handling

The API client automatically handles common error scenarios:

- 401: Unauthorized (redirects to login)
- 403: Forbidden
- 404: Not Found
- 500: Server Error
- Network errors

Errors can be caught using try/catch:

```javascript
try {
  const data = await exampleService.getAll();
} catch (error) {
  console.error("API Error:", error);
}
```

## Environment Configuration

The API base URL can be configured using the `VITE_API_URL` environment variable. If not set, it defaults to `http://localhost:3000`.
