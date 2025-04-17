import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { swaggerDocs } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import pomodoroRoutes from "./routes/pomodoroRoutes.js";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Initialize Swagger documentation
const PORT = process.env.PORT || 3000;
swaggerDocs(app, PORT);

// Security middleware
app.use(helmet()); // Set security HTTP headers

// Rate limiting
let limiter;
if (process.env.NODE_ENV === "development") {
  // More permissive rate limiting for development
  limiter = rateLimit({
    max: 1000, // 1000 requests from same IP
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP, please try again in an hour!",
  });
  console.log(
    "⚠️ Rate limiting configured with permissive settings for development"
  );
} else {
  // Stricter rate limiting for production
  limiter = rateLimit({
    max: 100, // 100 requests from same IP
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP, please try again in an hour!",
  });
}
app.use("/api", limiter);

// Body parser middleware
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true }));

// CORS middleware
if (process.env.NODE_ENV === "development") {
  // More permissive CORS settings for development
  app.use(
    cors({
      origin: true, // Allow any origin in development
      credentials: true, // Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  console.log("⚠️ CORS configured with permissive settings for development");
} else {
  // Default CORS settings for production
  app.use(cors());
}

// Development logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FlowFocus API" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/pomodoro", pomodoroRoutes);

// Handle 404 errors for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Export app and connectDB for server.js
export { app, connectDB };
