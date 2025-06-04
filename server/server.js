import dotenv from "dotenv";
// Load environment variables
dotenv.config();
import { app, connectDB } from "./app.js";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "./utils/authUtils.js";

// Process-level error handlers

/**
 * Handle uncaught exceptions
 * These are synchronous errors that weren't caught in a try/catch block
 */
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);

  // Close database connection before exiting
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed due to uncaught exception");
    // Exit with failure code
    process.exit(1);
  });
});

// Get port from environment variables or use default
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

/**
 * Initialize Socket.IO with the HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.IO server instance
 */
const initializeSocketIO = (server) => {
  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Enable client-side polling only as a fallback
    transports: ["websocket", "polling"],
    // Increase ping timeouts for better stability
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error("Invalid token"));
      }

      // Attach user ID to socket for later use
      socket.userId = decoded.id;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Socket connection handling
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a room specific to this user for multi-instance sync
    socket.join(`user:${socket.userId}`);

    // Task drag events
    socket.on("task:drag-start", (data) => {
      // Broadcast to all this user's connected clients except sender
      socket.to(`user:${socket.userId}`).emit("task:drag-start", data);
    });

    socket.on("task:drag-move", (data) => {
      // Forward all position and task data in real-time
      socket.to(`user:${socket.userId}`).emit("task:drag-move", data);
    });

    socket.on("task:drag-end", (data) => {
      socket.to(`user:${socket.userId}`).emit("task:drag-end", data);
    });

    // Task updated event
    socket.on("task:updated", (taskId) => {
      socket.to(`user:${socket.userId}`).emit("task:updated", taskId);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  console.log(`Socket.IO server initialized`);
  return io;
};

// Start the server after database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("MongoDB connected successfully");

    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    // Start HTTP server
    const server = httpServer.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });

    /**
     * Handle unhandled promise rejections
     * These are asynchronous errors that weren't caught with try/catch or .catch()
     */
    process.on("unhandledRejection", (err, promise) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      console.error(err.stack);

      // Gracefully close server and database connection before exiting
      server.close(() => {
        console.log("Server closed.");
        // Close database connection
        mongoose.connection.close(() => {
          console.log("MongoDB connection closed due to unhandled rejection");
          // Exit with failure code
          process.exit(1);
        });
      });
    });
  } catch (err) {
    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  }
};

// Start the server
startServer();
