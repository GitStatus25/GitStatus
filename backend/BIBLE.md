## Claude Bible

### GitStatus Code Standards Bible

1. **Architecture Principles**
   - Follow clear separation of concerns between controllers, services, and models
   - Controllers handle request/response, services contain business logic, models define data structure
   - Keep components and functions small and focused on a single responsibility
   - Limit component files to 300 lines maximum; extract larger components into smaller ones
   - When splitting large files (services, components, routes, etc.) into multiple focused files, organize them in a dedicated folder with an index.js that re-exports the components
   - Import specific service modules directly where needed rather than through aggregating services, promoting clear dependencies and better modularity
   - When refactoring, update all existing references to use the new structure directly, rather than creating backward compatibility wrappers
   - Avoid circular dependencies by carefully planning the service hierarchy
   - Never implement controller logic directly in route files - always create a dedicated controller file and import it in the route file, even for simple endpoints
   - Route files should only define routes and connect them to controller methods, never handle business logic or data manipulation

2. **Naming Conventions**
   - Use descriptive, consistent naming throughout the codebase
   - React components: PascalCase (e.g., `CommitList.js`)
   - Service files: PascalCase (e.g., `GitHubService.js`)
   - Route files: PascalCase (e.g., `AuthRoutes.js`)
   - JavaScript files in utils/scripts/templates: camelCase (e.g., `errorHandler.js`)
   - Functions and variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - MongoDB models: PascalCase singular nouns (e.g., `User.js`)
   - Folders for grouped services/components: PascalCase (e.g., `GitHub/`, `UserProfile/`)
   - Always include provider/source prefix in file names (e.g., `GitHubRepositoryController.js`, `StripePaymentService.js`) even when inside a folder with the same prefix, to maintain clarity when the files are imported elsewhere
   - File names should indicate their type based on their purpose:
     - Page components: suffix with "Page" (e.g., `DashboardPage.js`, `LoginPage.js`)
     - Regular components: suffix with "Component" (e.g., `HeaderComponent.js`, `FooterComponent.js`)
     - Context providers: suffix with "Context" (e.g., `AuthContext.js`, `ThemeContext.js`)
     - Services: suffix with "Service" (e.g., `APIService.js`, `PDFService.js`)
     - Controllers: suffix with "Controller" (e.g., `UserController.js`, `ReportController.js`)
     - Routes: suffix with "Routes" (e.g., `AuthRoutes.js`, `AdminRoutes.js`)
     - Models: no suffix, use singular nouns in PascalCase (e.g., `User.js`, `Report.js`)
     - Utilities: no suffix, use camelCase (e.g., `errorHandler.js`, `dateFormatter.js`)

3. **State Management**
   - Use React Context for global state that changes infrequently
   - Use local component state for UI-specific state
   - Avoid prop drilling more than 2 levels deep
   - Extract complex state logic into custom hooks

4. **API and Data Handling**
   - Use service modules to encapsulate all API calls
   - Implement consistent error handling for all API requests
   - Cache API responses where appropriate
   - Use loading and error states for all asynchronous operations

5. **Security Practices**
   - Never store sensitive information in client-side code
   - Validate all user input on both client and server
   - Use environment variables for all configuration
   - Implement proper authentication checks on all protected routes

6. **Performance Considerations**
   - Implement pagination for all list views
   - Use memoization for expensive calculations
   - Optimize MongoDB queries with proper indexes
   - Implement request throttling and rate limiting

7. **Error Handling**
   - Use custom error classes from `utils/errors.js` for all error scenarios
   - In services: throw specific error types (e.g., NotFoundError, ValidationError)
   - In controllers: use try/catch and let the global error handler format responses
   - In frontend: use the errorHandler utility to process and display errors
   - Include relevant details in errors for debugging but sanitize sensitive information
   - Always log errors on the server with appropriate context
   - Use consistent error response format for all API endpoints
   - Return appropriate HTTP status codes that match the error type

8. **Code Organization**
   - Group related functionality in the same directory
   - Use index files to simplify imports
   - Keep configuration separate from business logic
   - Use consistent file structure across similar components

9. **Documentation**
   - Document all non-obvious code with comments
   - Keep README and setup guides up to date
   - Document API endpoints with examples
   - Include JSDoc comments for functions with complex parameters

10. **Testing**
    - Write tests for critical business logic
    - Implement integration tests for API endpoints
    - Use snapshot testing for UI components
    - Maintain high test coverage for core functionality

Claude must update APP_DOCS.md after every change to the codebase to ensure documentation remains current and accurate.

