# API Documentation Guide

## Overview

This guide explains how we document our APIs using Swagger/OpenAPI specifications in the FlowFocus project. Following these standards ensures consistency across all API endpoints and makes the API documentation maintainable and user-friendly.

## Swagger Setup

We use Swagger UI to provide interactive API documentation. The configuration is located in `server/config/swagger.js`. The documentation is automatically generated from JSDoc comments in our route files.

## Common Components

We have defined reusable components for common patterns:

### Parameters

- `PageParam`: Page number for pagination
- `LimitParam`: Number of items per page
- `SortParam`: Sorting criteria

### Response Schemas

- `SuccessResponse`: Standard success response wrapper
- `PaginatedResponse`: Wrapper for paginated data
- `ValidationError`: Validation error response
- `UnauthorizedError`: Authentication error response

## Route Documentation Example

Here's an example of how to document an API endpoint using our standardized approach:

```javascript
/**
 * @swagger
 * /api/examples:
 *   get:
 *     summary: Get all examples with pagination
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved examples
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

## Best Practices

1. Always include a clear summary for each endpoint
2. Use appropriate tags to group related endpoints
3. Document security requirements when authentication is needed
4. Reference common components instead of duplicating schemas
5. Include all possible response scenarios
6. Provide clear parameter descriptions

## Authentication

All protected routes should include the `security` section with `bearerAuth`. This indicates that a JWT token is required in the Authorization header.

## Pagination

For endpoints that return lists, always include:

- Page parameter
- Limit parameter
- Sort parameter
- Use the `PaginatedResponse` schema for the response

## Error Handling

Consistently use the predefined error response schemas:

- `400`: ValidationError
- `401`: UnauthorizedError
- `404`: NotFoundError
- `500`: ServerError

## Testing Documentation

After adding new endpoint documentation:

1. Start the server
2. Visit the Swagger UI endpoint (usually `/api-docs`)
3. Verify that the new endpoint appears and is correctly documented
4. Test the endpoint through the Swagger UI interface
