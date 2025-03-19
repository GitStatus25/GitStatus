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
   - Maintain a clear component organization structure:
     - **Components**: Top-level components that represent entire routes/screens in the application
     - **PagePartials**: Smaller, reusable UI elements that compose the Components
     - **Modals**: Dialog components that appear over the main UI
     - Group related components in feature-based folders (e.g., `components/ViewReport/`)
     - Include an index.js in feature folders to re-export components for easier importing
   - Use a clear nested structure for component organization:
     - For PagePartials related to a specific parent component, use nested folders: `PagePartials/[ParentComponent]/[ChildComponent]/`
     - Name nested component files with both parent and child component names: `[ParentComponent][ChildComponent]Component.{js,jsx,css}`
     - Example: `PagePartials/ViewReport/CommitList/ViewReportCommitListComponent.{js,jsx,css}`
   - Separate logic from presentation in components:
     - Use the folder structure: `/ComponentName/ComponentName.js` (logic), `/ComponentName/ComponentName.jsx` (template), `/ComponentName/ComponentName.css` (styles), `/ComponentName/index.js` (export)
     - Keep business logic (state management, data fetching, event handlers) in .js files
     - Keep presentation (JSX markup) in .jsx files
     - Keep styles in separate CSS files, not inline styles or CSS-in-JS
     - Use className for styling instead of Material-UI's sx prop when possible
   - Extract complex state and business logic into custom hooks:
     - Place hooks in the same folder as the component that uses them
     - Name hooks using the 'use' prefix followed by a descriptive name (e.g., `useReportForm.js`)
     - Keep hooks focused on a specific functionality or domain of state
     - Structure sub-components in the same way as main components with their own folders containing .js, .jsx, and .css files
     - For complex forms or UI state, always extract the logic into a custom hook rather than putting it in the component file

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
   - Custom hooks: camelCase with 'use' prefix (e.g., `useReportForm.js`)
   - Always include provider/source prefix in file names (e.g., `GitHubRepositoryController.js`, `StripePaymentService.js`) even when inside a folder with the same prefix, to maintain clarity when the files are imported elsewhere
   - File names should indicate their type based on their purpose:
     - Components: suffix with "Component" (e.g., `DashboardComponent.js`, `LoginComponent.js`)
     - PagePartials: suffix with "Partial" (e.g., `HeaderPartial.js`, `FooterPartial.js`)
     - Nested PagePartials: prefix with parent component name and suffix with "Component" (e.g., `ViewReportCommitListComponent.js`)
     - Context providers: suffix with "Context" (e.g., `AuthContext.js`, `ThemeContext.js`)
     - Services: suffix with "Service" (e.g., `APIService.js`, `PDFService.js`)
     - Controllers: suffix with "Controller" (e.g., `UserController.js`, `ReportController.js`)
     - Routes: suffix with "Routes" (e.g., `AuthRoutes.js`, `AdminRoutes.js`)
     - Models: no suffix, use singular nouns in PascalCase (e.g., `User.js`, `Report.js`)
     - Utilities: no suffix, use camelCase (e.g., `errorHandler.js`, `dateFormatter.js`)
   - CSS class names: use kebab-case (e.g., `view-report-container`, `loading-spinner`)

3. **State Management**
   - Use React Context for global state that changes infrequently
   - Use local component state for UI-specific state
   - Extract complex state logic into custom hooks
   - Avoid prop drilling more than 2 levels deep
   - Custom hooks should:
     - Manage related pieces of state together
     - Encapsulate complex form logic, validations, and API interactions
     - Return an object with state values and handler functions
     - Have clear, descriptive names that indicate their purpose
     - Be self-contained with minimal dependencies on their parent components
     - Handle cleanup of any resources they create (event listeners, timeouts, etc.)
   - When using custom hooks:
     - Prefer multiple focused hooks over one large hook when appropriate
     - Document the hook's input parameters and return values
     - Use the hook to abstract away implementation details from the component

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
   - Follow this folder structure for components and pages:
     ```
     ComponentName/
     ├── ComponentName{Page/Component}.js     # Business logic
     ├── ComponentName{Page/Component}.jsx    # JSX template 
     ├── ComponentName{Page/Component}.css    # Component styles
     ├── useComponentNameFeature.js           # Custom hooks for component logic
     ├── index.js             # Re-exports the component
     ├── SubComponentName/    # Sub-components follow the same structure
     │   ├── SubComponentName.js
     │   ├── SubComponentName.jsx
     │   ├── SubComponentName.css
     │   └── index.js
     └── [other related files]
     ```
   - For complex UI components, further organized subcomponents following the same structure:
     ```
     ComponentName/
     ├── ComponentName.js     # Main component logic
     ├── ComponentName.jsx    # Main component presentation
     ├── ComponentName.css    # Main component styles
     ├── useComponentNameFeature.js # Custom hook for component logic
     ├── SpecializedElement/  # Specialized UI elements within the component
     │   ├── SpecializedElement.js  # Logic for this element
     │   ├── SpecializedElement.jsx # Presentation for this element
     │   ├── SpecializedElement.css # Styles for this element
     │   └── index.js               # Exports the element
     └── index.js             # Re-exports the component
     ```

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

11. **Styling**
    - Keep styles in separate CSS files, not inline or CSS-in-JS
    - Use consistent classNames following kebab-case convention
    - Avoid deeply nested CSS selectors (max 3 levels)
    - Use CSS variables for theme colors and shared values
    - Centralize theme configuration in dedicated files

Claude must update APP_DOCS.md after every change to the codebase to ensure documentation remains current and accurate.

