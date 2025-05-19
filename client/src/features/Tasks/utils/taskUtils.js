/**
 * Utility functions for task management
 */
import { isAfter, parseISO } from "date-fns";

/**
 * Returns the appropriate CSS class for a task priority level
 * @param {string} priority - The priority level (high, medium, low)
 * @returns {string} CSS class string
 */
export const getPriorityColor = (priority) => {
  // Convert priority to lowercase for case-insensitive comparison
  const lowerPriority = priority?.toLowerCase() || "";
  switch (lowerPriority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

/**
 * Maps column IDs to task status values
 */
export const statusMap = {
  todo: "Todo",
  "in-progress": "Doing",
  done: "Done",
};

/**
 * Groups tasks by their status
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Object with tasks grouped by status
 */
export const groupTasksByStatus = (tasks) => {
  const todoTasks = tasks.filter((task) => task.status === "Todo");
  const doingTasks = tasks.filter((task) => task.status === "Doing");
  const doneTasks = tasks.filter((task) => task.status === "Done");

  return [
    {
      id: "todo",
      title: "To Do",
      tasks: todoTasks,
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: doingTasks,
    },
    {
      id: "done",
      title: "Done",
      tasks: doneTasks,
    },
  ];
};

/**
 * Check if a task is overdue
 * @param {Object} task - Task object with dueDate and status properties
 * @returns {boolean} True if the task is overdue
 */
export const isTaskOverdue = (task) => {
  if (!task.dueDate) return false;
  try {
    const now = new Date();
    const dueDate = parseISO(task.dueDate);
    return isAfter(now, dueDate) && task.status !== "Done";
  } catch (error) {
    console.error("Error checking if task is overdue:", error);
    return false;
  }
};

/**
 * Sort tasks by a specific field
 * @param {Array} tasks - Array of task objects
 * @param {string} field - Field to sort by (e.g., priority, dueDate, title)
 * @param {string} order - Sort order (asc or desc)
 * @returns {Array} Sorted array of tasks
 */
export const sortTasks = (tasks, field, order = "asc") => {
  if (!field) return tasks;

  return [...tasks].sort((a, b) => {
    // Handle empty values
    if (!a[field] && !b[field]) return 0;
    if (!a[field]) return order === "asc" ? 1 : -1;
    if (!b[field]) return order === "asc" ? -1 : 1;

    // Sort by priority
    if (field === "priority") {
      const priorityValues = { High: 3, Medium: 2, Low: 1 };
      const valA = priorityValues[a.priority] || 0;
      const valB = priorityValues[b.priority] || 0;
      return order === "asc" ? valA - valB : valB - valA;
    }

    // Sort by due date
    if (field === "dueDate") {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return order === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    // Sort by text fields (title, etc)
    const valA = String(a[field]).toLowerCase();
    const valB = String(b[field]).toLowerCase();
    return order === "asc"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });
};

/**
 * Filter tasks by criteria
 * @param {Array} tasks - Array of task objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered array of tasks
 */
export const filterTasks = (tasks, filters = {}) => {
  let result = [...tasks];

  // Text search filter
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description &&
          task.description.toLowerCase().includes(searchLower))
    );
  }

  // Priority filter
  if (filters.priorities && filters.priorities.length > 0) {
    result = result.filter((task) =>
      filters.priorities.includes(task.priority)
    );
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter(
      (task) => task.tags && filters.tags.some((tag) => task.tags.includes(tag))
    );
  }

  // Overdue filter
  if (filters.showOverdue) {
    result = result.filter((task) => isTaskOverdue(task));
  }

  return result;
};

/**
 * Extract all unique tags from an array of tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Array of unique tags
 */
export const extractUniqueTags = (tasks) => {
  const tagSet = new Set();

  tasks.forEach((task) => {
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach((tag) => tagSet.add(tag));
    }
  });

  return Array.from(tagSet).sort();
};

/**
 * Group tasks by priority
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Tasks grouped by priority
 */
export const groupTasksByPriority = (tasks) => {
  return {
    high: tasks.filter((task) => task.priority === "High"),
    medium: tasks.filter((task) => task.priority === "Medium"),
    low: tasks.filter((task) => task.priority === "Low"),
  };
};

/**
 * Get stats for task priorities
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Statistics object
 */
export const getTaskStats = (tasks) => {
  return {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === "Todo").length,
    inProgress: tasks.filter((task) => task.status === "Doing").length,
    done: tasks.filter((task) => task.status === "Done").length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
    highPriority: tasks.filter((task) => task.priority === "High").length,
    mediumPriority: tasks.filter((task) => task.priority === "Medium").length,
    lowPriority: tasks.filter((task) => task.priority === "Low").length,
  };
};
