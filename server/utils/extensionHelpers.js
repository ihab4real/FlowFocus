/**
 * Extension Helper Utilities - Simple tools for building extensions
 *
 * These utilities make it easy to build extensions without dealing with
 * complex validation, data management, or event handling.
 */

import { getUserHabitById } from "../services/habitService.js";
import { logDebug, logWarn } from "./logger.js";

/**
 * Simple extension data validator
 * Much simpler than the previous enterprise version
 */
export class SimpleValidator {
  constructor() {
    this.rules = {};
  }

  /**
   * Add a validation rule
   * @param {string} field - Field name
   * @param {Function} validator - Validation function
   * @param {string} errorMessage - Error message if validation fails
   */
  addRule(field, validator, errorMessage) {
    this.rules[field] = { validator, errorMessage };
  }

  /**
   * Validate data against all rules
   * @param {Object} data - Data to validate
   * @returns {Object} - { isValid: boolean, errors: array }
   */
  validate(data) {
    const errors = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];

      try {
        if (!rule.validator(value)) {
          errors.push({
            field,
            message: rule.errorMessage || `${field} is invalid`,
          });
        }
      } catch (error) {
        errors.push({
          field,
          message: `Validation error for ${field}: ${error.message}`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Common validation functions
 */
export const validators = {
  required: (value) => value !== undefined && value !== null && value !== "",

  isNumber: (value) => typeof value === "number" && !isNaN(value),

  isString: (value) => typeof value === "string",

  isBoolean: (value) => typeof value === "boolean",

  isArray: (value) => Array.isArray(value),

  isObject: (value) =>
    value && typeof value === "object" && !Array.isArray(value),

  minLength: (min) => (value) =>
    typeof value === "string" && value.length >= min,

  maxLength: (max) => (value) =>
    typeof value === "string" && value.length <= max,

  range: (min, max) => (value) =>
    typeof value === "number" && value >= min && value <= max,

  oneOf: (options) => (value) => options.includes(value),

  email: (value) =>
    typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Simple data storage helper for extensions
 */
export class ExtensionDataManager {
  constructor(extensionName) {
    this.extensionName = extensionName;
  }

  /**
   * Get extension data from a habit
   * @param {Object} habit - Habit object
   * @returns {Object} - Extension data or empty object
   */
  getData(habit) {
    return habit.integrations?.[this.extensionName] || {};
  }

  /**
   * Set extension data on a habit (returns update object for habit service)
   * @param {Object} currentData - Current extension data
   * @param {Object} newData - New data to merge
   * @returns {Object} - Integration update object
   */
  updateData(currentData, newData) {
    return {
      [`integrations.${this.extensionName}`]: {
        ...currentData,
        ...newData,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Create initial data structure for new habits
   * @param {Object} initialData - Initial extension data
   * @returns {Object} - Formatted initial data
   */
  createInitialData(initialData = {}) {
    return {
      ...initialData,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }
}

/**
 * Simple event listener builder
 */
export class ExtensionEventHandler {
  constructor(extensionName) {
    this.extensionName = extensionName;
    this.handlers = {};
  }

  /**
   * Add event handler
   * @param {string} event - Event name (onHabitCreated, onHabitCompleted, etc.)
   * @param {Function} handler - Handler function
   */
  on(event, handler) {
    this.handlers[event] = handler;
  }

  /**
   * Get all handlers for building extension object
   * @returns {Object} - Handlers object
   */
  getHandlers() {
    return this.handlers;
  }

  /**
   * Create a safe handler wrapper that catches errors
   * @param {Function} handler - Original handler
   * @returns {Function} - Wrapped handler
   */
  safeHandler(handler) {
    return async (data) => {
      try {
        return await handler(data);
      } catch (error) {
        logWarn(`Extension ${this.extensionName} handler failed`, {
          error: error.message,
          extensionName: this.extensionName,
        });
        return null;
      }
    };
  }
}

/**
 * Extension builder - makes creating extensions super simple
 */
export class ExtensionBuilder {
  constructor(name) {
    this.extension = {
      name,
      version: "1.0.0",
      description: "",
      supportedHabitTypes: ["all"],
      config: {},
      hooks: {},
      apiEndpoints: {},
    };

    this.dataManager = new ExtensionDataManager(name);
    this.eventHandler = new ExtensionEventHandler(name);
  }

  /**
   * Set extension metadata
   * @param {Object} metadata - { version, description, author, etc. }
   * @returns {ExtensionBuilder} - For chaining
   */
  setMetadata(metadata) {
    Object.assign(this.extension, metadata);
    return this;
  }

  /**
   * Set supported habit types
   * @param {Array} types - Array of habit types or ['all']
   * @returns {ExtensionBuilder} - For chaining
   */
  forHabitTypes(types) {
    this.extension.supportedHabitTypes = types;
    return this;
  }

  /**
   * Set extension configuration
   * @param {Object} config - Configuration object
   * @returns {ExtensionBuilder} - For chaining
   */
  withConfig(config) {
    this.extension.config = config;
    return this;
  }

  /**
   * Add habit creation handler
   * @param {Function} handler - Handler function
   * @returns {ExtensionBuilder} - For chaining
   */
  onHabitCreated(handler) {
    this.eventHandler.on(
      "onHabitCreated",
      this.eventHandler.safeHandler(handler)
    );
    return this;
  }

  /**
   * Add habit completion handler
   * @param {Function} handler - Handler function
   * @returns {ExtensionBuilder} - For chaining
   */
  onHabitCompleted(handler) {
    this.eventHandler.on(
      "onHabitCompleted",
      this.eventHandler.safeHandler(handler)
    );
    return this;
  }

  /**
   * Add habit update handler
   * @param {Function} handler - Handler function
   * @returns {ExtensionBuilder} - For chaining
   */
  onHabitUpdated(handler) {
    this.eventHandler.on(
      "onHabitUpdated",
      this.eventHandler.safeHandler(handler)
    );
    return this;
  }

  /**
   * Add habit deletion handler
   * @param {Function} handler - Handler function
   * @returns {ExtensionBuilder} - For chaining
   */
  onHabitDeleted(handler) {
    this.eventHandler.on(
      "onHabitDeleted",
      this.eventHandler.safeHandler(handler)
    );
    return this;
  }

  /**
   * Add API endpoint
   * @param {string} name - Endpoint name
   * @param {Function} handler - Endpoint handler
   * @returns {ExtensionBuilder} - For chaining
   */
  addEndpoint(name, handler) {
    this.extension.apiEndpoints[name] = handler;
    return this;
  }

  /**
   * Add health check
   * @param {Function} healthCheck - Health check function
   * @returns {ExtensionBuilder} - For chaining
   */
  withHealthCheck(healthCheck) {
    this.extension.healthCheck = healthCheck;
    return this;
  }

  /**
   * Build the final extension object
   * @returns {Object} - Complete extension object
   */
  build() {
    this.extension.hooks = this.eventHandler.getHandlers();
    return this.extension;
  }

  /**
   * Get the data manager for this extension
   * @returns {ExtensionDataManager} - Data manager instance
   */
  getDataManager() {
    return this.dataManager;
  }
}

/**
 * Utility functions for common extension tasks
 */
export const extensionUtils = {
  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string} - Today's date
   */
  getTodayDate: () => new Date().toISOString().split("T")[0],

  /**
   * Get yesterday's date in YYYY-MM-DD format
   * @returns {string} - Yesterday's date
   */
  getYesterdayDate: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  },

  /**
   * Calculate days between two dates
   * @param {string} date1 - First date (YYYY-MM-DD)
   * @param {string} date2 - Second date (YYYY-MM-DD)
   * @returns {number} - Days difference
   */
  daysBetween: (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));
  },

  /**
   * Format date for display
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {string} - Formatted date
   */
  formatDate: (date) => {
    return new Date(date).toLocaleDateString();
  },

  /**
   * Check if date is today
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {boolean} - True if date is today
   */
  isToday: (date) => {
    return date === extensionUtils.getTodayDate();
  },

  /**
   * Check if date is yesterday
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {boolean} - True if date is yesterday
   */
  isYesterday: (date) => {
    return date === extensionUtils.getYesterdayDate();
  },

  /**
   * Safe JSON parse with fallback
   * @param {string} jsonString - JSON string to parse
   * @param {*} fallback - Fallback value if parsing fails
   * @returns {*} - Parsed object or fallback
   */
  safeJsonParse: (jsonString, fallback = null) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  },

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },
};

/**
 * Quick extension creation function for simple extensions
 * @param {string} name - Extension name
 * @param {Object} config - Extension configuration
 * @returns {Object} - Extension object
 */
export const createSimpleExtension = (name, config) => {
  const builder = new ExtensionBuilder(name);

  if (config.metadata) builder.setMetadata(config.metadata);
  if (config.habitTypes) builder.forHabitTypes(config.habitTypes);
  if (config.config) builder.withConfig(config.config);
  if (config.onHabitCreated) builder.onHabitCreated(config.onHabitCreated);
  if (config.onHabitCompleted)
    builder.onHabitCompleted(config.onHabitCompleted);
  if (config.onHabitUpdated) builder.onHabitUpdated(config.onHabitUpdated);
  if (config.onHabitDeleted) builder.onHabitDeleted(config.onHabitDeleted);
  if (config.healthCheck) builder.withHealthCheck(config.healthCheck);

  if (config.endpoints) {
    for (const [endpointName, handler] of Object.entries(config.endpoints)) {
      builder.addEndpoint(endpointName, handler);
    }
  }

  return builder.build();
};
