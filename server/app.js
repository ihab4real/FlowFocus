import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { swaggerDocs } from "./config/swagger.js";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Initialize Swagger documentation
const PORT = process.env.PORT || 3000;
swaggerDocs(app, PORT);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Development logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
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

// Routes (to be added as the application grows)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FlowFocus API" });
});

// Handle 404 errors for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

export { app, connectDB };
