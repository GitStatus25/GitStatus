## Claude Bible

### GitStatus Code Standards Bible

1. **Architecture Principles**
   - Follow clear separation of concerns between controllers, services, and models
   - Controllers handle request/response, services contain business logic, models define data structure
   - Keep components and functions small and focused on a single responsibility
   - Limit component files to 300 lines maximum; extract larger components into smaller ones

2. **Naming Conventions**
   - Use descriptive, consistent naming throughout the codebase
   - React components: PascalCase (e.g., `CommitList.js`)
   - JavaScript files: camelCase (e.g., `githubService.js`)
   - Functions and variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - MongoDB models: PascalCase singular nouns (e.g., `User.js`)

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
   - Use try/catch blocks for all async operations
   - Provide meaningful error messages to users
   - Log detailed errors on the server
   - Implement global error boundaries in React

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

