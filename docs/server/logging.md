# Logging in FlowFocus

FlowFocus implements a robust logging system that helps track application behavior, debug issues, and monitor system health. This guide explains how to effectively use the logging system.

## Log Levels

The logging system supports multiple log levels, each serving a specific purpose:

### Debug

```javascript
logDebug("Attempting to fetch resource", { resourceId });
```

Use for detailed information, typically useful during debugging. These logs help track the flow of the application and variable states.

### Info

```javascript
logInfo("Resource retrieved successfully", { resourceId, ...responseData });
```

Use for general information about application operation. These logs confirm that things are working as expected.

### Warn

```javascript
logWarn("Resource not found", { resourceId });
```

Use for potentially harmful situations that don't prevent the application from working but should be noted.

### Error

```javascript
logError("Resource ID missing in request");
```

Use for error events that might still allow the application to continue running, but require attention.

## Best Practices

1. **Include Context**: Always add relevant data objects as the second parameter:

   ```javascript
   logInfo("User action completed", { userId, action, timestamp });
   ```

2. **Meaningful Messages**: Write clear, descriptive messages that help identify the situation:

   ```javascript
   // Good
   logError("Database connection failed", { resourceId });

   // Bad
   logError("Error occurred");
   ```

3. **Log Level Selection**: Choose the appropriate log level based on the situation's severity:

   - Debug: Detailed information for debugging
   - Info: Normal application behavior
   - Warn: Unexpected but handleable situations
   - Error: Issues requiring immediate attention

4. **Avoid Sensitive Data**: Never log sensitive information like passwords, tokens, or personal data:

   ```javascript
   // Bad
   logDebug("User login", { username, password });

   // Good
   logDebug("User login attempt", { username });
   ```

## Environment-Specific Behavior

The logging system behaves differently based on the environment:

- **Development**: All log levels are displayed for detailed debugging
- **Production**: Only important logs (info and above) are typically shown
- **Testing**: Log levels can be configured as needed for test scenarios

## Example Implementation

Here's a complete example from our `exampleController.js`:

```javascript
const getResource = asyncHandler(async (req, res) => {
  const resourceId = req.params.id;

  // Debug log for tracking function entry
  logDebug("Attempting to fetch resource", { resourceId });

  if (!resourceId) {
    // Error log for invalid input
    logError("Resource ID missing in request");
    throw errorTypes.badRequest("Resource ID is required");
  }

  // Info log for successful operation
  logInfo("Resource retrieved successfully", {
    resourceId,
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({
    status: "success",
    data: responseData,
  });
});
```

This example demonstrates proper log level usage, context inclusion, and meaningful messages.

## Integration with Error Handling

The logging system works seamlessly with our error handling system. When throwing errors, appropriate logs are automatically generated:

```javascript
if (!resourceId) {
  logError("Resource ID missing in request");
  throw errorTypes.badRequest("Resource ID is required");
}
```

This ensures that errors are both logged and properly handled by the error middleware.
