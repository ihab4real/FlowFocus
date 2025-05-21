import { io } from "socket.io-client";

// Socket instance
let socket = null;

/**
 * Initialize the socket connection with authentication
 * @param {string} token - JWT token for authentication
 * @returns {Object} - The socket instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // Close existing socket if it exists but is disconnected
  if (socket) {
    socket.close();
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Create new socket connection with auth token
  socket = io(apiUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Set up event handlers
  socket.on("connect", () => {
    console.log("Socket connected!");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${reason}`);
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {Object|null} - The socket instance or null if not initialized
 */
export const getSocket = () => socket;

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit a task drag start event
 * @param {Object} data - Task drag data
 */
export const emitTaskDragStart = (data) => {
  if (socket && socket.connected) {
    socket.emit("task:drag-start", data);
  }
};

/**
 * Emit a task drag move event
 * @param {Object} data - Task position data including absolute and relative positions,
 *                        task details, and column information
 */
export const emitTaskDragMove = (data) => {
  if (socket && socket.connected) {
    socket.emit("task:drag-move", data);
  }
};

/**
 * Emit a task drag end event
 * @param {Object} data - Task final position data
 */
export const emitTaskDragEnd = (data) => {
  if (socket && socket.connected) {
    socket.emit("task:drag-end", data);
  }
};

/**
 * Emit a task updated event
 * @param {string} taskId - The ID of the updated task
 */
export const emitTaskUpdated = (taskId) => {
  if (socket && socket.connected) {
    socket.emit("task:updated", taskId);
  }
};

/**
 * Subscribe to task events
 * @param {string} event - Event name to subscribe to
 * @param {Function} callback - Callback function to execute when event occurs
 */
export const onTaskEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Unsubscribe from task events
 * @param {string} event - Event name to unsubscribe from
 * @param {Function} callback - Callback function to remove
 */
export const offTaskEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};
