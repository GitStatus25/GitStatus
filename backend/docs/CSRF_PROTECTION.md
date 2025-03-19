# CSRF Protection in GitStatus

## Overview

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to execute unwanted actions on a web application in which they're currently authenticated. GitStatus implements CSRF protection using the `csrf-csrf` package to prevent such attacks.

## Implementation Details

### Token-Based Protection

Our CSRF protection uses a double submit cookie pattern:

1. A secure, HTTP-only cookie containing a CSRF token is set on the client
2. For state-changing operations (POST, PUT, DELETE, PATCH), clients must include the CSRF token in the request headers
3. The server validates that the token in the request header matches the token in the cookie

### Selective Application

CSRF protection is selectively applied:

- Only state-changing HTTP methods (POST, PUT, DELETE, PATCH) require CSRF token validation
- GET requests and other read-only operations don't require token validation

This is implemented through the `selectiveCsrfProtection` middleware in `middleware/csrfMiddleware.js`.

## How to Use CSRF Protection in Frontend Code

### Getting a CSRF Token

To obtain a CSRF token, make a GET request to `/api/csrf-token`:

```javascript
// Example using fetch API
async function getCsrfToken() {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include', // Important: include cookies
  });
  const data = await response.json();
  return data.csrfToken;
}
```

### Including CSRF Token in Requests

For all state-changing operations, include the CSRF token in the request headers:

```javascript
// Example using fetch API
async function postData(url, data) {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'csrf-token': csrfToken, // Include CSRF token in header
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify(data),
  });
  
  return response.json();
}
```

## Best Practices

1. Always include the CSRF token for state-changing operations
2. Implement automatic token inclusion in your API client
3. Handle CSRF validation errors by refreshing the token and retrying the request
4. Consider adding CSRF token refresh logic in your error handling middleware

## Security Considerations

- The CSRF token is stored in an HTTP-only cookie to prevent access by JavaScript
- Token validation only happens for state-changing operations to avoid performance overhead
- The cookie has the `SameSite=Lax` attribute for additional protection
- In production environments, the `Secure` flag is set to ensure the cookie is only sent over HTTPS

## Configuration

The CSRF protection is configured in `server.js` with the following options:

- Token size: 64 bytes
- Cookie name: `csrf-token`
- Secret: Uses `CSRF_SECRET` environment variable or falls back to a default value
- Cookie options: `httpOnly`, `sameSite: 'lax'`, and `secure` in production 