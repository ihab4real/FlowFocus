import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { swaggerDocs } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import pomodoroRoutes from "./routes/pomodoroRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import passport from "passport";
import { configurePassport } from "./config/passport.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

// Trust the first hop from the proxy (e.g., apache2 on VPS)
app.set("trust proxy", 1);

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
  // Production CORS settings
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  console.log("✅ CORS configured for production");
}

// Development logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Initialize and configure Passport
const passportInstance = configurePassport();
app.use(passport.initialize());

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from client build
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Update helmet for serving static files
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for React app
      crossOriginEmbedderPolicy: false,
    })
  );
}

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
app.use("/api/habits", habitRoutes);

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Handle 404 errors for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Export app and connectDB for server.js
export { app, connectDB };
