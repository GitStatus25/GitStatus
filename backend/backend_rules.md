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