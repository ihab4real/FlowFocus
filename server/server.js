import { app, connectDB } from "./app.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get port from environment variables or use default
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error(`Server failed to start: ${err.message}`);
  });
