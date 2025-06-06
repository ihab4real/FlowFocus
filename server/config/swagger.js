import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlowFocus API Documentation",
      version: "1.0.0",
      description: "API documentation for the FlowFocus application",
      contact: {
        name: "FlowFocus Team",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.flowfocus.bestoneclinic.com"
            : `http://localhost:${process.env.PORT || 3000}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            stack: {
              type: "string",
              description: "Error stack trace (only in development)",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              default: true,
              description: "Indicates if the operation was successful",
            },
            data: {
              type: "object",
              description: "Response data",
            },
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
              },
            },
            pagination: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  description: "Total number of items",
                },
                page: {
                  type: "integer",
                  description: "Current page number",
                },
                limit: {
                  type: "integer",
                  description: "Number of items per page",
                },
                pages: {
                  type: "integer",
                  description: "Total number of pages",
                },
              },
            },
          },
        },
        PomodoroSettings: {
          type: "object",
          properties: {
            focusDuration: {
              type: "number",
              description: "Duration of focus sessions in minutes",
              default: 25,
              minimum: 1,
              maximum: 120,
            },
            shortBreakDuration: {
              type: "number",
              description: "Duration of short breaks in minutes",
              default: 5,
              minimum: 1,
              maximum: 30,
            },
            longBreakDuration: {
              type: "number",
              description: "Duration of long breaks in minutes",
              default: 15,
              minimum: 5,
              maximum: 60,
            },
            longBreakInterval: {
              type: "number",
              description: "Number of focus sessions before a long break",
              default: 4,
              minimum: 2,
              maximum: 10,
            },
            autoStartBreaks: {
              type: "boolean",
              description: "Whether to automatically start breaks",
              default: true,
            },
            autoStartPomodoros: {
              type: "boolean",
              description: "Whether to automatically start pomodoros",
              default: false,
            },
            soundEnabled: {
              type: "boolean",
              description: "Whether sound notifications are enabled",
              default: true,
            },
            soundVolume: {
              type: "number",
              description: "Sound volume percentage",
              default: 80,
              minimum: 0,
              maximum: 100,
            },
          },
        },
        PomodoroSession: {
          type: "object",
          required: ["startTime", "type"],
          properties: {
            startTime: {
              type: "string",
              format: "date-time",
              description: "Session start time",
            },
            endTime: {
              type: "string",
              format: "date-time",
              description: "Session end time",
            },
            type: {
              type: "string",
              enum: ["focus", "shortBreak", "longBreak"],
              description: "Type of session",
            },
            category: {
              type: "string",
              description: "Session category",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Session tags",
            },
            notes: {
              type: "string",
              description: "Session notes",
            },
            interruptions: {
              type: "number",
              description: "Number of interruptions during session",
              default: 0,
              minimum: 0,
            },
            productivityScore: {
              type: "number",
              description: "Calculated productivity score",
              minimum: 0,
              maximum: 100,
            },
          },
        },
      },
      parameters: {
        PageParam: {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1,
            minimum: 1,
          },
          description: "Page number for pagination",
        },
        LimitParam: {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 10,
            minimum: 1,
            maximum: 100,
          },
          description: "Number of items per page",
        },
        SortParam: {
          in: "query",
          name: "sort",
          schema: {
            type: "string",
            example: "-createdAt",
          },
          description: "Sort field and order (prefix with - for descending)",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "The requested resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./models/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const swaggerDocs = (app, port) => {
  // Swagger Page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

  // Docs in JSON format
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  // Get the base URL from the same configuration used in the Swagger options
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://api.flowfocus.bestoneclinic.com" // TODO: host this in the future
      : `http://localhost:${port}`;

  console.log(`📚 API Documentation available at ${baseUrl}/docs`);
};
