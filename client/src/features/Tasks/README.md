# Tasks Feature

## Overview

The Tasks feature provides comprehensive task management capabilities for the FlowFocus application. It enables users to create, update, delete, organize and track their tasks through a flexible, customizable Kanban-style board interface.

## Architecture

The Tasks feature follows a feature-based architecture pattern with the following structure:

```
src/features/Tasks/
├── components/               # UI components related to tasks
│   ├── TaskBoard.jsx         # Main board component with columns
│   ├── TaskCard.jsx          # Individual task card with drag-drop
│   ├── TaskColumn.jsx        # Column container for tasks
│   ├── TaskFilters.jsx       # Filtering and sorting interface
│   ├── TaskForm.jsx          # Form for creating/editing tasks
│   ├── TaskModal.jsx         # Modal wrapper for task form
│   └── index.js              # Component exports
├── hooks/                    # Custom hooks
│   └── useTaskQueries.js     # React Query hooks for tasks
├── pages/                    # Page components
│   └── index.js              # Page exports
├── services/                 # API services
│   └── taskService.js        # Task API service
├── utils/                    # Helper utilities
│   └── taskUtils.js          # Task-specific utility functions
└── index.js                  # Feature exports
```

## State Management

FlowFocus's Tasks feature uses a combination of **React Query** for remote state and React's built-in state management for UI state:

### Key Decisions

1. **React Query for Remote State**:

   - Optimized data fetching with automatic caching
   - Built-in loading, error, and stale states
   - Automatic background refetching
   - Query invalidation on data mutations

2. **Component State for UI Elements**:
   - Local state for UI-specific data (modal visibility, selected tasks)
   - Memoization for derived calculations (filtered tasks, statistics)
3. **Why Not Zustand**:
   - Tasks are primarily remote data without global persistence needs
   - React Query provides sufficient caching and data synchronization
   - UI state is contained within relevant components

## Task Management Flow

1. **Creation**: User initiates task creation → Opens form → Submits data → React Query mutation creates task → Cache invalidation → Board refreshes
2. **Display**: TaskBoard fetches all tasks → Filters applied in-memory → Tasks distributed to columns by status
3. **Drag & Drop**: User drags task between columns → React DnD handles UI → React Query mutation updates status → Cache invalidation → Board refreshes
4. **Filtering**: User applies filters → Local state updates → In-memory filtering applied → Filtered tasks displayed
5. **Column Management**: Custom columns created/edited → Stored in localStorage → Tasks filtered by custom status

## Usage Examples

```jsx
// Using the task query hooks in components
import { useTasksQuery, useCreateTaskMutation } from "@/features/Tasks";

function MyComponent() {
  // Fetch tasks with optional filters
  const { data: tasks, isLoading } = useTasksQuery({ status: "Todo" });

  // Mutation for creating tasks
  const createMutation = useCreateTaskMutation();

  const handleCreateTask = async (taskData) => {
    await createMutation.mutateAsync(taskData);
  };

  // Render tasks...
}
```

```jsx
// Using the task board in another component
import { TaskBoard } from "@/features/Tasks";

function Dashboard() {
  return (
    <div className="dashboard-layout">
      <TaskBoard />
    </div>
  );
}
```
