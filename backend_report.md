**Code Review**

File: backend/server.js - Line: 33 - Suggestion: The rate limiter's max value is set to 1000 for development. Consider making this configurable via environment variables rather than a hardcoded value, even for development environments.

File: backend/server.js - Line: 60 - Suggestion: Session secret uses a fallback value. In production, this should be strictly enforced via environment variables to prevent security vulnerabilities.

File: backend/config/passport.js - Line: 24 - Suggestion: The GitHub strategy includes 'repo' scope by default, which grants broad access. Consider making this scope configurable based on actual needs.

File: backend/routes/UsageStatsRoutes.js - Line: 10 - Suggestion: The admin stats route uses generic authenticate middleware instead of isAdmin. This could allow non-admin users to access admin analytics.

File: backend/middleware/rateLimiter.js - Line: 49 - Suggestion: Inconsistent report type checking ('big' vs 'large'). Standardize on one naming convention for report types.

File: backend/services/QueueService.js - Line: 13 - Suggestion: The dynamic import of PDFService using setTimeout could lead to race conditions. Use proper dependency injection instead.

File: backend/services/OpenAIService.js - Line: 232 - Suggestion: Hardcoded model names and token costs. Move these to configuration files for easier maintenance.

File: backend/services/PDFService.js - Line: 149 - Suggestion: HTML template directly inserts user-generated content without additional sanitization. Consider using DOMPurify here as well.

File: backend/models/User.js - Line: 40 - Suggestion: The hasExceededLimits method references UsageStats model but doesn't import it. This will cause runtime errors.

File: backend/controllers/ReportGenerationController.js - Line: 23 - Suggestion: Missing repository access validation - users could generate reports for repos they don't actually have access to.

**Rules for AI Assistant**

1. **Security First Principle**
- Always validate and sanitize inputs at both route and service layers
- Never hardcode secrets or credentials - use config/environment variables
- Maintain strict CSRF protection for all state-changing operations
- Follow principle of least privilege for OAuth scopes

2. **Error Handling Standards**
- Use custom error classes from utils/errors.js consistently
- Ensure all async operations have try/catch with proper error propagation
- Never expose stack traces in production responses
- Always handle third-party service failures gracefully

3. **Data Consistency Rules**
- Maintain single source of truth for business logic (e.g., plan limits)
- Use transactions for critical database operations
- Implement atomic updates for usage tracking
- Ensure cache invalidation follows write-through pattern

4. **Code Quality Requirements**
- Avoid nested promises - use async/await consistently
- Keep controller methods focused - move business logic to services
- Validate all JSDoc types match implementation
- Maintain 1:1 relationship between route handlers and controller methods

5. **Performance Guidelines**
- Implement Redis caching for all frequently accessed read operations
- Use streaming for large file operations
- Limit batch operations to configurable sizes
- Always include cleanup logic for temporary resources

6. **Configuration Management**
- Keep environment-specific settings in .env files
- Validate required environment variables at startup
- Use configuration objects instead of direct process.env access
- Maintain separate config files for third-party services

7. **Testing Requirements**
- Include integration tests for all third-party service integrations
- Maintain test coverage for error boundary conditions
- Validate all security middlewares with negative tests
- Implement performance testing for queue workers

8. **Documentation Standards**
- Keep OpenAPI documentation in sync with route handlers
- Maintain error code taxonomy in utils/errors.js
- Document all database schema decisions
- Keep architecture diagrams updated with service relationships

9. **Observability Rules**
- Include correlation IDs for all requests
- Log key decision points in business logic
- Track custom metrics for queue throughput
- Implement health checks for all external dependencies

10. **Migration Safety**
- Provide backward compatibility for schema changes
- Use database migration scripts for all schema modifications
- Include data validation in migration pipelines
- Maintain rollback procedures for all data transformations