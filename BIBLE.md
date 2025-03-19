## Claude Bible

## Core Architecture Principles

1. **Separation of Concerns**
   - Strictly separate business logic (in .js files) from presentation (in .jsx files)
   - Use controllers for request/response, services for business logic, models for data
   - Extract complex state and effects into custom hooks (prefixed with "use")
   - Never exceed 300 lines per file – split large components into smaller ones

2. **Component Structure**
   - Organize related components in feature-based folders
   - Follow consistent folder pattern: `/ComponentName/{logic.js, presentation.jsx, styles.css, index.js}`
   - Place hooks in the same folder as the component that uses them
   - Organize specialized UI elements as sub-components with the same structure

3. **API Architecture**
   - Create service modules to encapsulate all external API calls
   - Implement consistent error handling for all requests
   - Separate API clients from business logic in service implementations
   - Use TypeScript interfaces or JSDoc to document all API parameters and responses

4. **Error Handling**
   - Use custom error classes with appropriate status codes
   - In services: throw specific error types (e.g., `NotFoundError`)
   - In controllers: use try/catch with global error handler
   - In frontend: use error boundary components and the errorHandler utility

5. **Security**
   - Validate all input on both client and server
   - Sanitize user input to prevent XSS and injection attacks
   - Use environment variables for all credentials and configuration
   - Implement proper authentication checks on all protected routes

6. **Performance**
   - Cache API responses where appropriate
   - Use pagination for all list views
   - Implement database indexes for frequently queried fields
   - Add appropriate loading states for async operations

## Naming Conventions

1. **Files**
   - React components: `ComponentNameComponent.{js,jsx,css}` 
   - Services: `EntityNameService.js` (e.g., `GitHubService.js`)
   - Routes: `EntityNameRoutes.js` (e.g., `AuthRoutes.js`)
   - Utilities: camelCase (e.g., `errorHandler.js`)
   - Models: PascalCase singular nouns (e.g., `User.js`)
   - Hooks: camelCase with 'use' prefix (e.g., `useReportForm.js`)

2. **Variables and Functions**
   - Variables and functions: camelCase 
   - Private functions: prefix with underscore (_functionName)
   - Constants: UPPER_SNAKE_CASE
   - Boolean variables: prefixed with 'is', 'has', 'should' (e.g., `isLoading`)
   - Event handlers: prefixed with 'handle' or 'on' (e.g., `handleSubmit`, `onClickOutside`)

3. **CSS Classes**
   - Use kebab-case for all class names (e.g., `header-container`)
   - Follow a component-based naming scheme: `{component-name}__{element}`
   - Use semantic class names that describe purpose, not appearance

## Documentation

1. **Code Comments**
   - Document all non-obvious code with clear comments
   - Add JSDoc comments for complex functions and all public API
   - Keep comments brief but informative, focusing on "why" not "what"

2. **Application Documentation**
   - Claude must update APP_DOCS.md after every change to the codebase
   - Keep the architecture diagram up to date with new components
   - Ensure all API endpoints are documented with examples
   - Include information about environment variables and configuration

## Database & Data Handling

1. **MongoDB Best Practices**
   - Define explicit schemas with validation for all models
   - Create indexes for all frequently queried fields
   - Use compound indexes for queries that filter on multiple fields
   - Implement data validation at the model level

2. **State Management**
   - Use React Context for global state that changes infrequently
   - Use Zustand for performance-critical global state
   - Keep local component state for UI-specific state
   - Extract complex state logic into custom hooks

## Backend Rules

1. **Express Organization**
   - Organize routes by domain/resource
   - Separate routing logic from controller implementation
   - Use middleware for cross-cutting concerns
   - Validate all request params and body with dedicated middleware

2. **Error Responses**
   - Return consistent error response format: `{error: {code, message, details}}`
   - Use appropriate HTTP status codes for different error types
   - Include validation details for validation errors
   - Sanitize error messages to avoid leaking sensitive information

## Frontend Rules

1. **React Component Organization**
   - Split code into smart (container) and dumb (presentational) components
   - Keep components small and focused on a single responsibility
   - Use a consistent pattern for component props
   - Add prop validation with PropTypes or TypeScript

2. **Forms and User Input**
   - Extract form logic into custom hooks
   - Implement client-side validation for all forms
   - Show helpful error messages for invalid input
   - Disable submission buttons when form is invalid or submitting