import { app, connectDB } from "./app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

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

// Connect to database
connectDB()
  .then(() => {
    // Start server
    const server = app.listen(PORT, () => {
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
  })
  .catch((err) => {
    console.error(`Server failed to start: ${err.message}`);
  });
