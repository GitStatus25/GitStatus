## Application Docs

### GitStatus Application Overview

GitStatus is a full-stack application that analyzes GitHub commit history to generate concise, AI-powered reports of actual work accomplished. It helps developers and project managers track and report on progress by analyzing commit diffs and providing professional summaries.

#### Core Features

- GitHub OAuth integration for secure repository access
- Repository, branch, and commit selection
- AI-powered commit analysis and report generation
- PDF report generation and management
- Usage analytics and tracking
- Admin dashboard for system monitoring

### System Architecture

The application follows a client-server architecture:

- **Frontend**: React.js application with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: MongoDB for data storage
- **Queue System**: Bull with Redis for background job processing
- **External Services**: GitHub API, OpenAI API, AWS S3

### Frontend Components

#### Frontend Organization

The frontend codebase is organized with a clear component structure:

1. **Components (`src/components/`)**: 
   - Top-level components that represent entire routes/screens in the application
   - Generally contain the main layout and composition of smaller elements
   - Handle state, data fetching, and routing logic
   - Named with the "Component" suffix (e.g., `DashboardComponent.js`, `LoginComponent.js`)
   - Examples: `LoginComponent`, `DashboardComponent`, `ViewReportComponent`
   - All components representing full screens/pages are placed directly in the components directory in their own feature folder (e.g., `components/Dashboard/`)

2. **PagePartials (`src/components/PagePartials/`)**: 
   - Smaller, reusable UI elements that compose the main Components
   - Focus on specific UI functionality and presentation
   - Generally receive data and callbacks as props
   - Named with the "Partial" suffix (e.g., `HeaderPartial.js`, `FooterPartial.js`)
   - Examples: `LayoutPartial`, `CommitListPartial`, `ReportHeaderPartial`

3. **Nested PagePartials**: 
   - PagePartials that belong to a specific parent component
   - Organized in subdirectories within PagePartials based on their parent component:
     ```
     PagePartials/
     ├── ViewReport/              # For ViewReport-specific partials
     │   ├── CommitList/          # A specific ViewReport partial
     │   │   ├── ViewReportCommitListComponent.js
     │   │   ├── ViewReportCommitListComponent.jsx
     │   │   ├── ViewReportCommitListComponent.css
     │   │   └── index.js
     │   └── ReportHeader/        # Another ViewReport partial
     │       ├── ViewReportReportHeaderComponent.js
     │       └── ...
     └── Dashboard/               # For Dashboard-specific partials
         └── ...
     ```
   - Named by combining the parent component name with the partial name and "Component" suffix
   - Example: `ViewReportCommitListComponent.js` for a CommitList partial used in the ViewReport component

4. **Modals (`src/components/Modals/`)**: 
   - Dialog components that appear over the main UI
   - Named with the "Modal" suffix (e.g., `CreateReportModal.js`)
   - Examples: `CreateReportModal`, `ViewCommitsModal`

5. **Component Organization Strategy**:
   - When a component becomes too large (>300 lines), it should be split into smaller focused components
   - Related components are grouped in feature-based folders (e.g., `components/ViewReport/`)
   - Each feature folder includes an `index.js` file that re-exports its components for easier importing
   - Complex UI elements are composed from multiple smaller PagePartials
   - This approach improves maintainability, readability, and allows for component reuse

6. **Component Structure**:
   - Each component has its own folder containing separate files for logic, presentation, and styles
   - The structure follows this pattern:
     ```
     ComponentName/
     ├── ComponentName.js     # Business logic (state, data fetching, event handlers)
     ├── ComponentName.jsx    # JSX template (presentation layer)
     ├── ComponentName.css    # Component styles
     ├── index.js             # Re-exports the component for easier imports
     └── [other related files]
     ```
   - This separation of concerns makes the codebase more maintainable and testable
   - Example: `ViewReport/ViewReportComponent.js` contains the business logic, while `ViewReport/ViewReportComponent.jsx` contains the template/JSX markup, and `ViewReport/ViewReportComponent.css` contains the styles

7. **Styling Approach**:
   - CSS is kept in separate files rather than inline styles or CSS-in-JS
   - Class names follow kebab-case convention (e.g., `view-report-container`)
   - Material-UI theme configuration is centralized in `styles/theme.js`
   - CSS variables are used for shared values and theming
   - CSS selectors are kept flat (max 3 levels of nesting) for better performance

#### File Naming Conventions

To maintain consistency and clarity across the codebase, we follow these naming conventions:

1. **Components**: Suffix with "Component" (e.g., `DashboardComponent.js`, `LoginComponent.js`)
2. **PagePartials**: Suffix with "Partial" (e.g., `HeaderPartial.js`, `FooterPartial.js`)
3. **Nested PagePartials**: Prefix with parent component name and suffix with "Component" (e.g., `ViewReportCommitListComponent.js`)
4. **Modals**: Suffix with "Modal" (e.g., `CreateReportModal.js`, `ViewCommitsModal.js`) - Modals are special components that use the "Modal" suffix instead of "Component"
5. **Context Providers**: Suffix with "Context" (e.g., `AuthContext.js`, `ThemeContext.js`)
6. **Services**: Suffix with "Service" (e.g., `APIService.js`, `PDFService.js`)

These conventions make it immediately clear what type of file you're working with, especially when imported from other locations in the codebase.

#### Core Components

1. **AuthContext** (`src/contexts/AuthContext.js`)
   - Manages user authentication state
   - Provides login/logout functionality
   - Handles session persistence

2. **ModalContext** (`src/contexts/ModalContext.js`)
   - Manages modal state across the application
   - Coordinates data flow between modals
   - Provides modal open/close functionality

3. **LayoutPartial** (`src/components/PagePartials/LayoutPartial.js`)
   - Main application layout with navigation
   - Responsive design with mobile support
   - Handles theme and styling

#### Main Application Components

1. **DashboardComponent** (`src/components/Dashboard/DashboardComponent.js`)
   - Displays user's generated reports
   - Provides report management functionality
   - Entry point for creating new reports

2. **CreateReportComponent** (via modals)
   - **CreateReportModal** (`src/components/Modals/CreateReportModal.js`)
     - Repository and branch selection
     - Date range and author filtering
     - Report configuration
   - **ViewCommitsModal** (`src/components/Modals/ViewCommitsModal.js`)
     - Commit selection and preview
     - Diff viewing functionality
     - Report generation trigger

3. **ViewReportComponent** (`src/components/ViewReport/ViewReportComponent.js`)
   - Displays generated report details
   - Shows commit list and summaries
   - Provides PDF preview and download
   - Follows the component structure with separated logic and presentation:
     - `ViewReportComponent.js` - Contains business logic (data fetching, state management)
     - `ViewReportComponent.jsx` - Contains the template/JSX markup
     - `ViewReportComponent.css` - Contains styles
     - `index.js` - Re-exports the component

4. **AnalyticsDashboardComponent** (`src/components/AnalyticsDashboard/AnalyticsDashboardComponent.js`)
   - Displays usage statistics
   - Shows limits and quotas
   - Visualizes report generation trends

5. **AdminDashboardComponent** (`src/components/AdminDashboard/AdminDashboardComponent.js`)
   - User management functionality
   - System-wide analytics
   - Plan management

### Backend Structure

#### API Routes

1. **Authentication** (`/api/auth`)
   - `GET /api/auth/github`: Initiate GitHub OAuth flow
   - `GET /api/auth/github/callback`: Handle OAuth callback
   - `GET /api/auth/me`: Get current user info
   - `GET /api/auth/logout`: Log out current user

2. **Reports** (`/api/reports`)
   The reports functionality is split into focused controllers for better maintainability:

   **Report Generation** (`ReportGenerationController`)
   - `POST /api/reports`: Generate a new report
   - `POST /api/reports/commit-info`: Get commit information for report generation
   - `GET /api/reports/:id/pdf-status`: Get PDF generation status
   
   **Report Viewing** (`ReportViewController`)
   - `GET /api/reports`: Get user's reports
   - `GET /api/reports/:id`: Get a specific report
   
   **Report Management** (`ReportManagementController`)
   - `DELETE /api/reports/:id`: Delete a report
   - `POST /api/reports/cleanup`: Clean up invalid reports
   
   **Report Cache** (`ReportCacheController`)
   - `GET /api/reports/cache/stats`: Get cache statistics
   - `POST /api/reports/cache/cleanup`: Clean up old reports

3. **Usage Stats** (`/api/usage-stats`)
   - `GET /api/usage-stats/user`: Get user usage statistics
   - `GET /api/usage-stats/check-limit`: Check usage limits
   - `GET /api/usage-stats/admin`: Get admin analytics

4. **Commits** (`/api/commits`)
   - `GET /api/commits`: Get commits with filtering
   - `GET /api/commits/repository`: Get repository info
   - `GET /api/commits/branches`: Get repository branches
   - `GET /api/commits/with-diffs`: Get commits with file diffs
   - `GET /api/commits/search-repositories`: Search repositories
   - `GET /api/commits/branch-authors`: Get authors for branches
   - `GET /api/commits/date-range`: Get commit date range

5. **Admin** (`/api/admin`)
   - `GET /api/admin/users`: Get all users
   - `PUT /api/admin/users/:userId/role`: Update user role
   - `GET /api/admin/analytics`: Get system analytics

6. **Plans** (`/api/plans`)
   - `GET /api/plans`: Get all plans
   - `PUT /api/plans/:planId/limits`: Update plan limits

#### Database Models

1. **User** (`models/User.js`)
   - Stores user information and GitHub credentials
   - Tracks user role and plan

2. **Report** (`models/Report.js`)
   - Stores generated reports
   - Contains commit information and metadata
   - Tracks PDF location and access statistics
   - Includes job status tracking fields for background processing
   - See `docs/DATABASE_INDEXES.md` for details on performance optimization

3. **CommitSummary** (`models/CommitSummary.js`)
   - Caches AI-generated commit summaries
   - Improves performance by avoiding redundant analysis

4. **Plan** (`models/Plan.js`)
   - Defines available plans and their limits
   - Used for enforcing usage restrictions

5. **UsageStats** (`models/UsageStats.js`)
   - Tracks detailed usage statistics
   - Stores monthly report and token usage

### Data Flow

1. **Report Generation Flow**
   1. User selects repository, branches, and filters in CreateReportModal
   2. Backend fetches commits from GitHub API
   3. User selects specific commits in ViewCommitsModal
   4. Backend analyzes commits with OpenAI
   5. Backend submits PDF generation to the job queue and returns immediately with a pending status
   6. Bull worker processes the PDF generation job in the background
   7. When complete, the PDF is uploaded to S3 and the report is updated
   8. Frontend polls for job status and displays the report when ready

2. **Authentication Flow**
   1. User clicks "Login with GitHub" button
   2. Backend initiates OAuth flow with GitHub
   3. GitHub redirects back to application with authorization code
   4. Backend exchanges code for access token
   5. Backend creates or updates user in database
   6. Frontend receives authentication status and displays dashboard

3. **Usage Tracking Flow**
   1. User performs actions (generates reports, analyzes commits)
   2. Backend tracks usage in UsageStats collection
   3. Frontend displays usage statistics in AnalyticsDashboardComponent
   4. Admin can view system-wide statistics in AdminDashboardComponent

### Integration Points

1. **GitHub API**: Repository and commit data retrieval
2. **OpenAI API**: Commit analysis and report generation
3. **AWS S3**: PDF storage and retrieval
4. **MongoDB**: Data persistence and retrieval

### Security Features

1. **CSRF Protection** (`docs/CSRF_PROTECTION.md`)
   - Token-based protection for state-changing operations
   - Selective application for POST, PUT, DELETE, and PATCH methods
   - Frontend utilities for working with CSRF tokens

2. **Input Validation** (`docs/INPUT_VALIDATION.md`)
   - Comprehensive validation for all API endpoints
   - Centralized validation rules with express-validator
   - Global request sanitization
   - Detailed validation error reporting

3. **Authentication Security**
   - OAuth 2.0 integration with GitHub
   - HTTP-only, secure session cookies
   - Role-based access control

4. **API Security**
   - Rate limiting to prevent abuse
   - Helmet.js for security headers
   - Input validation and sanitization

### Backend Components

#### Services

1. **GitHub Services** (`services/GitHub/`)
   GitHub functionality is organized into a folder with multiple specialized services:
   
   - `GitHubRepositoryService.js` - Handles repository-related operations
   - `GitHubCommitService.js` - Handles commit-related operations
   - `GitHubBranchService.js` - Handles branch-related operations
   - `GitHubSearchService.js` - Handles repository search operations
   - `index.js` - Exports all services for convenient importing
   
   Key functions across these services include:
   - Repository information retrieval and contributor listing
   - Commit analysis, filtering, and diff handling
   - Branch listing and author tracking
   - Repository search functionality
   - Date range analysis for commits
   
   These services are imported directly where needed, rather than through a unified service,
   promoting better modularity and clearer dependencies.

2. **OpenAI Service** (`services/OpenAIService.js`)
   - Analyzes commit data using OpenAI models
   - Generates summaries and reports
   - Provides caching mechanisms for AI responses

3. **PDF Service** (`services/PDFService.js`)
   - Handles PDF generation using Puppeteer
   - Converts Markdown to properly formatted PDFs
   - Interfaces with the job queue for background processing

4. **Queue Service** (`services/QueueService.js`)
   - Manages background job processing with Bull
   - Handles PDF generation jobs
   - Provides job status tracking and error handling
   - Implements automatic job cleanup

5. **S3 Service** (`services/S3Service.js`)
   - Manages file storage in AWS S3
   - Handles PDF upload and retrieval
   - Generates pre-signed URLs for secure access

#### Controllers

1. **GitHub Controllers** (`controllers/GitHub/`)
   
   GitHub-related functionality is organized into specialized controllers that mirror the service structure.
   These controllers are imported directly in route files, maintaining clean dependencies:

   a. **GitHubRepositoryController**
   - Handles repository information and search
   - Uses GitHubRepositoryService and GitHubSearchService
   - Key endpoints:
     - `getRepositoryInfo`: Fetches repository details
     - `getContributors`: Lists repository contributors
     - `searchRepositories`: Searches for repositories

   b. **GitHubBranchController**
   - Handles branch-related operations
   - Uses GitHubBranchService
   - Key endpoints:
     - `getBranches`: Lists branches in a repository
     - `getAuthorsForBranches`: Gets authors who contributed to specific branches

   c. **GitHubCommitController**
   - Handles commit-related operations
   - Uses GitHubCommitService
   - Key endpoints:
     - `getCommits`: Fetches commits from a repository
     - `getDateRange`: Gets first and last commit dates
     - `getCommitsWithDiffs`: Gets commits with their diffs

2. **Report Controllers** (`controllers/Report/`)
   
   The report functionality is split into four focused controllers:

   a. **ReportGenerationController**
   - Handles report creation and PDF generation
   - Manages commit analysis and content generation
   - Tracks usage statistics and limits
   - Key functions:
     - `generateReport`: Creates new reports from commits
     - `getCommitInfo`: Retrieves commit details with branch info
     - `getPdfStatus`: Tracks PDF generation progress

   b. **ReportViewController**
   - Handles report retrieval and viewing
   - Manages report access statistics
   - Key functions:
     - `getReports`: Lists all user reports
     - `getReportById`: Retrieves specific report details

   c. **ReportManagementController**
   - Handles report lifecycle management
   - Manages cleanup of invalid reports
   - Key functions:
     - `deleteReport`: Removes reports and associated files
     - `cleanupInvalidReports`: Cleans up reports with missing files

   d. **ReportCacheController**
   - Handles report caching and statistics
   - Manages cleanup of old/unused reports
   - Key functions:
     - `getCacheStats`: Retrieves caching statistics
     - `cleanupReportsCache`: Removes old cached reports

2. **Authentication Controller** (`controllers/auth.js`)
   - Handles user authentication
   - Manages GitHub OAuth flow
   - Maintains user sessions

### Error Handling System

The application implements a standardized error handling system to ensure consistent error responses across all API endpoints and improved debugging capabilities.

#### Backend Error Handling

1. **Custom Error Classes** (`utils/errors.js`)
   - `ApplicationError`: Base error class with standardized properties
   - `NotFoundError`: For resources that don't exist (404)
   - `ValidationError`: For invalid user input (400)
   - `AuthenticationError`: For authentication issues (401)
   - `AuthorizationError`: For permission issues (403)
   - `ExternalServiceError`: For failures in external services (502)
   - `RateLimitError`: For rate limit exceeded errors (429)
   - `DatabaseError`: For database operation failures (500)
   - `PdfGenerationError`: For PDF generation failures (500)
   - `NotImplementedError`: For unimplemented features (501)

2. **Global Error Handler** (`middleware/errorHandler.js`)
   - Catches all errors thrown in the application
   - Converts errors to the standardized format
   - Logs detailed error information for debugging
   - Returns consistent JSON responses to clients
   - Includes appropriate HTTP status codes

3. **Error Response Format**
   ```json
   {
     "status": "error",
     "error": {
       "code": "ERROR_CODE",
       "message": "Human-readable error message",
       "details": ["Additional error details if applicable"]
     }
   }
   ```

#### Frontend Error Handling

1. **Error Handling Utilities** (`utils/errorHandler.js`)
   - Parses API error responses into a consistent format
   - Provides helper functions for common error scenarios
   - Maps backend error codes to frontend error types
   - Handles authentication redirects automatically

2. **API Service Integration**
   - Centralizes error handling in API calls
   - Uses axios interceptors for consistent error processing
   - Provides standardized error objects to components

3. **Component Error Handling**
   - Components display user-friendly error messages
   - Uses structured approach to handle different error types
   - Implements appropriate UI for different error scenarios

#### Error Handling Best Practices

1. **Service Layer**
   - Throw specific error types based on the scenario
   - Include relevant context in error messages
   - Document expected error types in JSDoc comments

2. **Controller Layer**
   - Use try/catch blocks and let errors propagate to the global handler
   - Avoid handling errors directly unless specific logic is required
   - Do not mix error handling patterns (throw vs return)

3. **Frontend Components**
   - Use the errorHandler utility for all API error handling
   - Display appropriate UI feedback based on error type
   - Handle authentication and validation errors specifically

This documentation provides a high-level overview of the GitStatus application architecture and functionality. For detailed implementation information, refer to the specific files and components mentioned above.