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
- **External Services**: GitHub API, OpenAI API, AWS S3

### Frontend Components

#### Core Components

1. **AuthContext** (`src/contexts/AuthContext.js`)
   - Manages user authentication state
   - Provides login/logout functionality
   - Handles session persistence

2. **ModalContext** (`src/contexts/ModalContext.js`)
   - Manages modal state across the application
   - Coordinates data flow between modals
   - Provides modal open/close functionality

3. **Layout** (`src/components/Layout.js`)
   - Main application layout with navigation
   - Responsive design with mobile support
   - Handles theme and styling

#### Page Components

1. **Dashboard** (`src/pages/Dashboard.js`)
   - Displays user's generated reports
   - Provides report management functionality
   - Entry point for creating new reports

2. **CreateReport** (via modals)
   - **CreateReportModal** (`src/components/modals/CreateReportModal.js`)
     - Repository and branch selection
     - Date range and author filtering
     - Report configuration
   - **ViewCommitsModal** (`src/components/modals/ViewCommitsModal.js`)
     - Commit selection and preview
     - Diff viewing functionality
     - Report generation trigger

3. **ViewReport** (`src/pages/ViewReport.js`)
   - Displays generated report details
   - Shows commit list and summaries
   - Provides PDF preview and download

4. **AnalyticsDashboard** (`src/pages/AnalyticsDashboard.js`)
   - Displays usage statistics
   - Shows limits and quotas
   - Visualizes report generation trends

5. **AdminDashboard** (`src/components/AdminDashboard.js`)
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

2. **Commits** (`/api/commits`)
   - `GET /api/commits`: Get commits with filtering
   - `GET /api/commits/repository`: Get repository info
   - `GET /api/commits/branches`: Get repository branches
   - `GET /api/commits/with-diffs`: Get commits with file diffs
   - `GET /api/commits/search-repositories`: Search repositories
   - `GET /api/commits/branch-authors`: Get authors for branches
   - `GET /api/commits/date-range`: Get commit date range

3. **Reports** (`/api/reports`)
   - `GET /api/reports`: Get user's reports
   - `POST /api/reports`: Generate a new report
   - `GET /api/reports/:id`: Get a specific report
   - `DELETE /api/reports/:id`: Delete a report
   - `GET /api/reports/cache/stats`: Get cache statistics
   - `POST /api/reports/cache/cleanup`: Clean up old reports

4. **Usage Stats** (`/api/usage-stats`)
   - `GET /api/usage-stats/user`: Get user usage statistics
   - `GET /api/usage-stats/check-limit`: Check usage limits
   - `GET /api/usage-stats/admin`: Get admin analytics

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
   5. Backend generates PDF report and stores in S3
   6. Frontend displays the report and provides download link

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
   3. Frontend displays usage statistics in AnalyticsDashboard
   4. Admin can view system-wide statistics in AdminDashboard

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

This documentation provides a high-level overview of the GitStatus application architecture and functionality. For detailed implementation information, refer to the specific files and components mentioned above.