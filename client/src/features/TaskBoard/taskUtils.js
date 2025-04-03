/**
 * Utility functions for task management
 */

/**
 * Returns the appropriate CSS class for a task priority level
 * @param {string} priority - The priority level (high, medium, low)
 * @returns {string} CSS class string
 */
export const getPriorityColor = (priority) => {
  // Convert priority to lowercase for case-insensitive comparison
  const lowerPriority = priority.toLowerCase();
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
