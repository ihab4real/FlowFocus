# Routing System Documentation

## Overview

The FlowFocus client uses React Router v6 with Data Router mode for handling navigation and routing. This setup provides a clean, hierarchical routing structure with built-in error handling and data loading capabilities.

## Key Components

### Router Configuration (`router.jsx`)

- Uses `createBrowserRouter` for client-side routing
- Implements a nested routing structure
- Includes error boundaries for graceful error handling

### Route Structure

```
/ (App)
├── / (RootLayout)
│   ├── / (Home)
│   └── * (NotFound - catches all unmatched routes)
```

### Main Components

- `App`: Root component that wraps the entire application
- `RootLayout`: Main layout component with header and navigation
- `ErrorBoundary`: Handles and displays route errors
- `Home`: Landing page component
- `NotFound`: 404 page for unmatched routes

## Data Loading

- Each route can have its own loader function for data fetching
- Loaders run before the route is rendered
- Example:
  ```javascript
  loader: async () => {
    // Fetch data here
    return {};
  };
  ```

## Adding New Routes

1. Create your new component in the `pages` directory
2. Import the component in `router.jsx`
3. Add a new route configuration under the RootLayout children:
   ```javascript
   {
     path: "/your-path",
     element: <YourComponent />,
     loader: async () => {
       // Optional: Add data loading logic
       return {};
     }
   }
   ```

## Best Practices

- Keep route components in the `pages` directory
- Implement loaders for data fetching needs
- Use nested routes for shared layouts
- Always handle loading and error states
- Use dynamic routes when needed (e.g., `/items/:id`)
