# Input Validation in GitStatus

## Overview

GitStatus implements comprehensive input validation to ensure data integrity, prevent security vulnerabilities, and improve API reliability. This document outlines the validation approach and implementation details.

## Implementation Details

### Validation Middleware

All API endpoints in GitStatus use express-validator for request validation:

1. **Route-specific validation rules** are defined in `middleware/validationMiddleware.js`
2. **Global input sanitization** is applied via `middleware/sanitizationMiddleware.js`

### Validation Process Flow

1. **Request received** → Express parses the request body, query parameters, and URL parameters
2. **Sanitization middleware** removes potentially malicious content (HTML tags, excessive whitespace)
3. **Validation middleware** checks that all parameters meet the required constraints
4. **Controller action** processes the request only if validation passes

### Validation Rules

Each endpoint has specific validation rules tailored to its requirements. Common validation checks include:

- **Required fields**: Ensures mandatory parameters are present
- **Type checking**: Verifies parameters have the correct data type
- **Format validation**: Confirms data meets expected patterns (e.g., email format, date format)
- **Range validation**: Ensures numeric values fall within acceptable ranges
- **Logical validation**: Checks business logic constraints (e.g., end date after start date)

### Error Handling

When validation fails:

1. A 400 Bad Request response is returned
2. The response body contains detailed error information:
   ```json
   {
     "error": "Validation failed",
     "details": [
       {
         "param": "email",
         "msg": "Must be a valid email address",
         "location": "body"
       }
     ]
   }
   ```

## Sanitization Details

The sanitization middleware provides defense against common injection attacks by:

1. Removing HTML tags from string inputs
2. Normalizing whitespace
3. Recursively processing nested objects and arrays
4. Preserving non-string data types

## Testing Validation Rules

Validation rules are tested through:

1. Unit tests for each validation rule set
2. Integration tests that verify API behavior with valid and invalid input
3. Security tests that attempt common injection patterns

## Adding New Validation Rules

When adding new API endpoints, follow these steps:

1. Define validation rules in `middleware/validationMiddleware.js`
2. Apply validation middleware to the route in the appropriate route file
3. Update controller code to handle validation errors
4. Add tests to verify validation behavior

## Best Practices

- Always validate and sanitize all user input
- Apply the principle of least privilege - only accept what you expect
- Include validation in the API documentation to help client developers
- Return clear, helpful error messages 