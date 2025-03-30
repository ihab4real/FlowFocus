import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Custom format for development logs
const devLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaStr = Object.keys(metadata).length
    ? JSON.stringify(metadata, null, 2)
    : "";
  return `${timestamp} ${level}: ${message} ${metaStr}`;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");

// Configure file transport for production
const fileRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logsDir, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: combine(timestamp(), json()),
});

// Configure console transport for development
const consoleTransport = new transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    devLogFormat
  ),
});

// Create the logger instance
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    process.env.NODE_ENV === "production"
      ? fileRotateTransport
      : consoleTransport,
  ],
  // Handling uncaught exceptions and rejections
  exceptionHandlers: [
    process.env.NODE_ENV === "production"
      ? new transports.DailyRotateFile({
          filename: path.join(logsDir, "exceptions-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxFiles: "14d",
          format: combine(timestamp(), json()),
        })
      : new transports.Console({
          format: combine(colorize(), timestamp(), devLogFormat),
        }),
  ],
  rejectionHandlers: [
    process.env.NODE_ENV === "production"
      ? new transports.DailyRotateFile({
          filename: path.join(logsDir, "rejections-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxFiles: "14d",
          format: combine(timestamp(), json()),
        })
      : new transports.Console({
          format: combine(colorize(), timestamp(), devLogFormat),
        }),
  ],
  exitOnError: false,
});

// Export helper functions for different log levels
export const logError = (message, meta = {}) => logger.error(message, meta);
export const logWarn = (message, meta = {}) => logger.warn(message, meta);
export const logInfo = (message, meta = {}) => logger.info(message, meta);
export const logDebug = (message, meta = {}) => logger.debug(message, meta);

export default logger;
