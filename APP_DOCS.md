## Ideal Application Docs

# GitStatus Application Documentation

## Overview

GitStatus is a full-stack application that analyzes GitHub commit history to generate professional reports. It leverages AI (OpenAI) to summarize repositories and produce detailed development activity reports that can be shared with stakeholders.

### Core Features
- GitHub OAuth integration for secure repository access
- Repository and commit selection with filtering
- AI-powered commit analysis and report generation
- PDF report generation with asynchronous processing
- Usage tracking and analytics dashboard
- User management with role-based access

### Tech Stack
- **Frontend**: React 18 with Material-UI
- **Backend**: Node.js with Express 4.x
- **Database**: MongoDB 6+
- **Queue System**: Bull with Redis for background jobs
- **External APIs**: GitHub API, OpenAI API
- **Storage**: AWS S3 for PDF reports

## Frontend Architecture

### Component Structure

The frontend follows a clean separation of concerns, with each component split into:
- Business logic (`.js` files)
- Presentation (`.jsx` files)
- Styling (`.css` files)
- Index exports (`index.js` files)

Components are organized in three categories:

1. **Page Components** (`src/components/`)
   - Top-level components representing full screens
   - Handle routing, state management, and data fetching

2. **PagePartials** (`src/components/PagePartials/`)
   - Reusable UI components that make up pages
   - Organized by their parent component for clarity

3. **Modals** (`src/components/Modals/`)
   - Dialog components that appear over the main UI
   - Each modal has its own folder with logic and presentation files

### Key Components

#### Dashboard (`src/components/Dashboard/`)
- **Purpose**: Display user's reports and provide access to creation
- **Key Files**:
  - `DashboardComponent.js`: Logic for fetching and managing reports
  - `DashboardComponent.jsx`: Report list presentation
- **State**: Reports list, deletion confirmation dialog
- **Props**: None (root component)

#### Report Creation Flow
- **CreateReportModal** (`src/components/Modals/CreateReport/`)
  - **Purpose**: Configure and start report generation
  - **Key Files**:
    - `CreateReportModal.js`: Modal orchestration logic
    - `useReportForm.js`: Custom hook for form state management
    - `RepositorySelector/`: Repository search component
    - `BranchSelector/`: Branch selection component
    - `DateRangeSelector/`: Date filter component
  - **State**: Form data, validation, repo/branch/author data
  - **Props**: N/A (uses ModalContext)

- **ViewCommitsModal** (`src/components/Modals/ViewCommits/`)
  - **Purpose**: Select specific commits for report
  - **Key Files**:
    - `ViewCommitsModal.js`: Commit selection logic
    - `ViewCommitsModal.jsx`: Commit list interface
  - **State**: Selected commits, expanded commits
  - **Props**: N/A (uses ModalContext)

#### Report Viewing (`src/components/ViewReport/`)
- **Purpose**: Display generated report with PDF preview
- **Key Files**:
  - `ViewReportComponent.js`: Report data and PDF status handling
  - `useReportData.js`: Hook for report data and PDF status
  - `ViewReportComponent.jsx`: Report layout
- **Partials**:
  - `ReportHeader/`: Title and metadata section
  - `CommitList/`: List of included commits
  - `PDFPreview/`: PDF viewer with status tracking
- **State**: Report data, PDF generation status
- **Props**: None (uses URL parameter)

### State Management

GitStatus uses a hybrid approach to state management:

1. **Zustand Stores**:
   - `authStore.js`: Authentication state (current user, login status)
   - `modalStore.js`: Global modal visibility and data

2. **React Context**:
   - For less frequently updated global state
   - Component-specific states that need to be shared with children

3. **Custom Hooks**:
   - Encapsulate complex local state logic
   - Handle data fetching, caching, and updates
   - Examples: `useReportForm.js`, `useReportData.js`

### API Integration

Frontend communicates with the backend using service modules:

- `api.js`: Core API client with error handling and request formatting
- `auth.js`: Authentication-related API functions
- `github.js`: GitHub API interaction services

## Backend Architecture

### API Routes

#### Authentication (`/api/auth`)
- **GET /github**: Initiate GitHub OAuth
- **GET /github/callback**: OAuth callback handling
- **GET /me**: Get current user info
- **GET /logout**: End user session

#### Reports (`/api/reports`)
- **GET /**: List user's reports
- **GET /:id**: Get specific report
- **POST /**: Generate new report
- **DELETE /:id**: Delete report
- **GET /:id/pdf-status**: Check PDF generation status

#### GitHub Data (`/api/commits`)
- **GET /search-repositories**: Search GitHub repositories
- **GET /repository**: Get repository info
- **GET /branches**: Get repository branches
- **GET /branch-authors**: Get authors in branches
- **GET /with-diffs**: Get commits with file changes

#### Usage Stats (`/api/usage-stats`)
- **GET /user**: Get current user's usage statistics
- **GET /check-limit**: Check if user has reached limits

#### Admin (`/api/admin`)
- **GET /users**: List all users
- **PUT /users/:id/role**: Update user role
- **GET /analytics**: Get system-wide statistics

### Core Services

#### GitHub Services (`services/GitHub/`)
- **GitHubRepositoryService**: Repository info and search
- **GitHubCommitService**: Commit fetching and analysis
- **GitHubBranchService**: Branch handling and filtering

#### OpenAI Services (`services/OpenAI/`)
- **OpenAIClient**: Raw API interaction
- **CommitAnalysisService**: Commit summary generation
- **ReportGenerationService**: Full report creation

#### PDF Services (`services/PDF/`)
- **PDFTemplateService**: HTML generation for reports
- **PDFJobProcessor**: Background job processing
- **PDFStorageService**: S3 upload and management

### Database Models

#### User (`models/User.js`)
- GitHub authentication info
- Role (user/admin)
- Plan reference

#### Report (`models/Report.js`)
- Repository and filter information
- Commit data with summaries
- PDF status and location
- Access tracking

#### CommitSummary (`models/CommitSummary.js`)
- Cached AI-generated summaries
- Access tracking for optimization

#### UsageStats (`models/UsageStats.js`)
- Monthly usage statistics
- Token and report counts
- Per-model tracking

## Data Flow

### Report Generation Flow

1. **Repository Selection**: User selects a repository and filters in CreateReportModal
2. **Commit Selection**: User views and selects specific commits in ViewCommitsModal
3. **Report Generation**:
   - Backend fetches detailed commit info from GitHub
   - AI generates commit summaries (with caching)
   - AI creates a comprehensive report from summaries
4. **PDF Generation**:
   - Report is submitted to background job queue
   - Bull worker generates PDF using Puppeteer
   - PDF is uploaded to S3
   - Report record is updated with PDF location
5. **Viewing**:
   - Frontend polls for PDF status and displays report
   - User can view online or download PDF

### Authentication Flow

1. User clicks "Login with GitHub"
2. Backend initiates OAuth flow
3. GitHub redirects back with authorization code
4. Backend exchanges code for token and creates/updates user
5. User session is established with secure cookie
6. Frontend redirects to dashboard

## Performance Optimizations

1. **Database Indexes**:
   - Compound index on `user` and `createdAt` in Reports collection
   - Index on `commitsHash` for duplicate detection
   - Indexes on frequently queried fields

2. **Caching Strategy**:
   - AI-generated commit summaries cached in database
   - Frequently used GitHub data cached with short TTL
   - API requests debounced on frontend

3. **Background Processing**:
   - PDF generation handled by Bull/Redis job queue
   - Separate worker processes for CPU-intensive tasks
   - Smart retry logic with exponential backoff

4. **Connection Management**:
   - MongoDB connection pooling with reconnection logic
   - Redis persistent connections with health checks
   - Circuit breakers for external API dependencies

## Security Measures

1. **Authentication**:
   - GitHub OAuth with secure session handling
   - HTTP-only cookies for session storage
   - CSRF protection for state-changing operations

2. **Input Validation**:
   - Express Validator middleware for all API endpoints
   - Request sanitization to prevent XSS and injection
   - Content Security Policy headers

3. **Error Handling**:
   - Custom error classes with appropriate status codes
   - Sanitized error messages in production
   - Comprehensive error logging

4. **Rate Limiting**:
   - API-level rate limiting to prevent abuse
   - User-level usage quotas based on plans
   - Graduated backoff for repeated failures

## Deployment Architecture

1. **Environment Configuration**:
   - Environment variables for all sensitive configuration
   - Separate development and production settings
   - Health check endpoints for monitoring

2. **Scalability**:
   - Stateless application design for horizontal scaling
   - Database connection pooling for load management
   - Queue-based processing for background tasks

3. **Monitoring**:
   - Request logging with correlation IDs
   - Job queue monitoring and alerting
   - Error tracking with stack traces and context

## Extending the Application

To add new features to GitStatus, follow these steps:

1. **Backend**:
   - Add models in `models/` for any new data entities
   - Create service modules in `services/` for business logic
   - Add controllers in `controllers/` for API endpoints
   - Define routes in `routes/` to map URLs to controllers

2. **Frontend**:
   - Add API methods in `services/api.js` for new endpoints
   - Create new components following the established pattern
   - Add to navigation/routing as needed

3. **Documentation**:
   - Update APP_DOCS.md with new components and endpoints
   - Document environment variables and configuration
   - Include examples for API usage