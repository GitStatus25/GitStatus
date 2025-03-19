Let's start with a thorough analysis of the codebase, looking for issues, needed refactors, and improvements for stability and maintainability. I'll use a structured approach to cover all areas systematically.

# Code Issues Analysis

## Frontend Issues

### File Structure and Organization

After the restructuring, there's been a significant effort to separate components into logical, presentation, and styling files. However, I'm noticing some inconsistencies:

1. In `frontend/src/components/Modals/ViewCommits/ViewCommitsModal.jsx` and `frontend/src/components/Modals/ViewCommits/ViewCommitsModalComponent.css`, there's a mismatch in naming. The JSX file refers to a CSS file named `ViewCommitsModalComponent.css`, but the actual file is `ViewCommitsModal.css`. This will cause the styles not to be applied correctly.

2. In some places, there are references to components that don't match the actual file paths. For example, in `frontend/src/components/Modals/ViewCommits/index.js`, it exports from `ViewCommitsModalComponent` but the actual file seems to be `ViewCommitsModal.js`.

3. The structure is inconsistent across components. Some follow the pattern of having `.js` for logic, `.jsx` for presentation, and `.css` for styling, but others don't follow this pattern strictly.

### Potential Runtime Errors

4. In `frontend/src/components/PagePartials/ViewReport/PDFPreview/ViewReportPDFPreviewComponent.jsx`, there's a potential issue with accessing properties that might be undefined:
   ```jsx
   <iframe
     ref={iframeRef}
     src={`https://docs.google.com/viewer?url=${encodeURIComponent(report.downloadUrl)}&embedded=true`}
     width="100%"
     height="100%"
     frameBorder="0"
     allowFullScreen
     title="Report Document Viewer"
     onLoad={handleIframeLoad}
     onError={handleIframeError}
     className="pdf-iframe"
   />
   ```
   If `report` or `report.downloadUrl` is undefined, this will cause a runtime error. It should have a check before trying to use `encodeURIComponent`.

5. In `frontend/src/components/PagePartials/DiffViewer/DiffViewerComponent.jsx`, there's a similar issue with the patch prop:
   ```jsx
   if (!patch) {
     return (
       <Box className="diff-viewer">
         <Box className="diff-content">
           <Box className="diff-line">
             <Box className="line-content">No diff available</Box>
           </Box>
         </Box>
       </Box>
     );
   }

   const lines = patch.split('\n');
   ```
   If patch is not a string (e.g., if it's an object or array), calling `.split('\n')` will cause an error.

### Security Issues

6. In `frontend/src/services/auth.js`, there's a potential security issue in the `handleAuthError` function:
   ```javascript
   // Clear cookies (this is a simple approach, may need to be adjusted based on how cookies are set)
   document.cookie.split(';').forEach(cookie => {
     const [name] = cookie.trim().split('=');
     document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
   });
   ```
   This approach to clearing cookies doesn't account for cookies with different paths or domains. Some cookies might not be cleared, potentially leading to session-related issues.

7. In `frontend/src/services/api.js`, the error handling doesn't seem to account for network errors outside of the API call itself:
   ```javascript
   const handleApiRequest = async (apiCall) => {
     try {
       const result = await apiCall();
       return result;
     } catch (error) {
       console.error('API request failed:', error);
       
       // If the error was already parsed by the interceptor, use that
       if (error.parsedError) {
         throw error.parsedError;
       }
       
       // Otherwise parse it now and throw the parsed version
       throw errorHandler.parseApiError(error);
     }
   };
   ```
   The function assumes that all errors are related to API requests, but there could be other types of errors (e.g., parsing JSON) that should be handled differently.

### Architectural Issues

8. In `frontend/src/App.js`, there's a mix of import styles for components:
   ```javascript
   import LoginPage from './pages/Login';
   import DashboardPage from './pages/Dashboard';
   import CreateReportPage from './pages/CreateReport';
   import ViewReportPage from './pages/ViewReport';
   import NotFoundPage from './pages/NotFound';
   import AdminDashboardComponent from './components/AdminDashboard';
   import AnalyticsDashboardPage from './pages/AnalyticsDashboard';
   import CreateReportModalComponent from './components/modals/CreateReportModal';
   import ViewCommitsModalComponent from './components/modals/ViewCommitsModal';
   import AuthCallbackPage from './pages/AuthCallback';
   ```
   Some components are imported from `./pages/` and others from `./components/`, which suggests inconsistency in the component organization. Also, the paths seem to be inconsistently cased (`./components/modals/` instead of `./components/Modals/`).

9. The auth handling in `frontend/src/contexts/AuthContext.js` doesn't seem to have a mechanism for refreshing tokens, which could lead to session expiration issues if the user is inactive for a long period:
   ```javascript
   // Check if user is authenticated
   const checkAuth = async () => {
     try {
       setLoading(true);
       const res = await axios.get('/api/auth/me');
       
       if (res.data.isAuthenticated) {
         setUser(res.data.user);
         setIsAuthenticated(true);
       } else {
         setUser(null);
         setIsAuthenticated(false);
       }
       
       setError(null);
       return res.data;
     } catch (err) {
       setUser(null);
       setIsAuthenticated(false);
       setError('Failed to authenticate. Please try again.');
       throw err;
     } finally {
       setLoading(false);
     }
   };
   ```

10. The error handling in various components is inconsistent. Some components use try/catch blocks, while others rely on the global error handler. This could lead to inconsistent error reporting and handling.

## Backend Issues

### API and Route Organization

11. In `backend/routes/CommitsRoutes.js` and similar files, the routes are defined in a way that makes them hard to test in isolation:
    ```javascript
    // Get commits based on filters
    router.get('/', isAuthenticated, GitHubCommitController.getCommits);

    // Search for repositories
    router.get('/search-repositories', isAuthenticated, GitHubRepositoryController.searchRepositories);
    ```
    The controllers are directly tied to the routes, making it difficult to test them independently.

12. The error handling in `backend/controllers/` is inconsistent. Some controllers return explicit error responses, while others rely on the global error handler.

13. The validation middleware in `backend/middleware/validationMiddleware.js` has some redundant code for validating MongoDB ObjectId:
    ```javascript
    /**
     * Check if a string is a valid MongoDB ObjectId
     */
    const isValidObjectId = (value) => {
      return mongoose.Types.ObjectId.isValid(value);
    };
    ```
    This function is only used in one place, and it's essentially just a wrapper around the existing Mongoose function. It adds unnecessary indirection.

### Security Issues

14. The JWT implementation in `backend/server.js` using `express-session` doesn't have explicit configuration for secure cookies:
    ```javascript
    app.use(session({
      secret: process.env.SESSION_SECRET || 'gitstatus-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true, // Prevents client-side JS from reading the cookie
        sameSite: 'lax' // Provides some CSRF protection
      }
    }));
    ```
    There's no check for whether the environment is production, so in development, cookies might not be secure.

15. The rate limiting in `backend/server.js` is commented out for development, which is fine, but there's a risk that it might be forgotten when deploying to production:
    ```javascript
    // TODO: For development only - conditionally apply rate limiting
    if (process.env.NODE_ENV === 'production') {
      app.use('/api/', apiLimiter);
    } else {
      console.log('Rate limiting disabled for development');
    }
    ```

16. The sanitization middleware in `backend/middleware/sanitizationMiddleware.js` doesn't seem to handle all potential XSS vectors:
    ```javascript
    if (typeof value === 'string') {
      // Remove any HTML tags
      obj[key] = value.replace(/<[^>]*>/g, '');
      
      // Normalize whitespace
      obj[key] = obj[key].replace(/\s+/g, ' ').trim();
    }
    ```
    This regex-based approach might miss certain XSS attack vectors, like JavaScript event handlers or URL-encoded characters.

### Performance Issues

17. The MongoDB connection in `backend/server.js` doesn't have proper reconnection logic:
    ```javascript
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('MongoDB connection error:', err));
    ```
    If the connection to MongoDB is lost, the application doesn't attempt to reconnect, which could lead to downtime.

18. Several services, like `backend/services/GitHub/GitHubCommitService.js`, make multiple API calls in sequence, which could be optimized with parallel requests:
    ```javascript
    const commits = [];
    
    for (const commitId of commitIds) {
      try {
        // Fetch the commit
        const url = `https://api.github.com/repos/${repository}/commits/${commitId}`;
        const response = await axios.get(url, { headers });
        const commit = response.data;
        
        // ... process commit ...
        
        commits.push(formattedCommit);
      } catch (error) {
        console.error(`Error fetching commit ${commitId}:`, error);
        // Continue with other commits even if one fails
      }
    }
    ```
    This sequential approach will be slow for a large number of commits.

### Data Integrity

19. In `backend/services/ReportService.js`, the caching of reports based on a hash of commit IDs might not be robust enough:
    ```javascript
    // Generate a hash from an array of commit IDs
    // This will be used to identify unique sets of commits
    const generateCommitsHash = (commits) => {
      // Sort commit IDs to ensure consistent hash regardless of order
      const commitIds = commits
        .map(commit => commit.commitId || commit.sha)
        .sort();
      
      // Generate a SHA-256 hash of the sorted commit IDs
      const hash = crypto.createHash('sha256');
      hash.update(commitIds.join(','));
      return hash.digest('hex');
    };
    ```
    This approach assumes that commit IDs are a reliable way to identify a unique set of commits, but if there are changes to the repository (like rebasing), the commit IDs might change while the content remains the same.

20. In various parts of the codebase, there's a lack of proper validation for external data. For example, in `backend/services/GitHub/GitHubCommitService.js`, the function `getCommitsWithDiffs` assumes that the response from the GitHub API will have a specific structure:
    ```javascript
    const formattedCommit = {
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        login: commit.author?.login,
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatarUrl: commit.author?.avatarUrl
      },
      date: commit.commit.author.date,
      htmlUrl: commit.htmlUrl,
      files: commit.files ? commit.files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch
      })) : []
    };
    ```
    If the GitHub API response changes, this could lead to runtime errors.

## Shared Issues (Both Frontend and Backend)

21. Inconsistent error handling patterns: Some parts of the code use try/catch blocks, others use promises with `.catch()`, and others rely on global error handlers. This inconsistency makes the codebase harder to maintain and debug.

22. Lack of comprehensive logging: The application relies heavily on `console.error` for error logging, but doesn't have a structured logging system that would allow for better monitoring and debugging in production.

23. No clear strategy for handling API versioning: If the APIs need to evolve over time, there's no clear strategy for versioning or backward compatibility.

24. Environment variable management: There are several instances where environment variables are accessed directly from `process.env`, which makes it harder to test and can lead to runtime errors if the variables are not set.

25. Inconsistent naming conventions: While there's a general pattern of using PascalCase for components and camelCase for variables, there are some inconsistencies, especially with file names and component names.

# Digestibility Refactors

Now, let's analyze the separation of concerns in the codebase and suggest improvements to make components more focused and easier to understand.

## Frontend Component Separation

The frontend has already undergone significant restructuring to separate components into logical and presentation layers. However, there are still some components that could benefit from further refactoring:

1. `frontend/src/components/ViewReport/ViewReportComponent.js` is responsible for both fetching report data and handling the UI logic for displaying it. This could be split into separate concerns:
   - A data-fetching hook (`useReportData.js`) that handles the API calls and data processing
   - A component that consumes this hook and handles the UI logic

2. `frontend/src/components/Dashboard/DashboardComponent.js` has similar issues, handling both data fetching and UI logic. It could be refactored in a similar way.

3. `frontend/src/components/Modals/ViewCommits/ViewCommitsModal.js` is quite complex, handling several concerns:
   - State management for selected commits
   - Expanded commit and file state
   - User stats fetching
   - Report generation logic
   It could be refactored to separate these concerns into smaller, more focused components or hooks.

## Backend Service Separation

The backend services have been organized into more focused modules, but there are still some areas for improvement:

1. `backend/services/GitHub/GitHubCommitService.js` handles multiple concerns:
   - Fetching commits from GitHub
   - Processing and formatting commit data
   - Handling error cases
   This could be split into separate services: one for API interaction, one for data processing, and one for error handling.

2. `backend/services/OpenAIService.js` combines both API interaction and business logic. It could be refactored to separate these concerns.

3. `backend/services/ReportService.js` handles report creation, updating, finding, and formatting. These could be separated into more focused services.

## Database Query Separation

The MongoDB queries are scattered throughout various service and controller files. It would be better to centralize these queries in a dedicated data access layer:

1. Create a `backend/data` directory with modules for each database collection.
2. Each module should export functions for CRUD operations and any specialized queries.
3. Services should use these modules instead of directly interacting with Mongoose models.

This approach would make it easier to optimize queries, add caching, and implement changes to the database schema.

# Technical Debt Analysis

## PDF Generation Architecture

The current PDF generation approach in `backend/services/PDFService.js` has several issues:

1. It's using Puppeteer directly in the service, which can be resource-intensive and slow.
2. Error handling is minimal, especially for browser launch failures.
3. There's no clear approach for handling concurrency or rate limiting.

A more robust architecture for PDF generation would involve:

1. A dedicated job queue (already started with Bull/Redis) with proper error handling, retries, and monitoring.
2. A separate process or service for PDF generation, to isolate it from the main application.
3. Better feedback mechanisms for progress, success, and failure.

## MongoDB Strategy

The MongoDB connection strategy in `backend/server.js` is basic and lacks robust error handling:

```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
```

A more robust approach would include:

1. Connection pooling configuration with appropriate settings for the application's scale.
2. Automatic reconnection with appropriate backoff strategies.
3. Event listeners for connection status to handle reconnections and failures gracefully.
4. Query timeouts and circuit breakers to prevent cascading failures.

## State Management

The frontend uses React Context for state management, which is appropriate for most of the application's needs. However, as the application grows, there might be performance issues with the Context API, especially for frequently updated state.

For more complex state management needs, alternatives like Redux or Zustand might be more appropriate. Redux would provide more structured and predictable state management, while Zustand would be more lightweight and easier to use.

# Summary of Findings

After this initial analysis, I've identified several areas that need attention:

1. Code Issues: Inconsistent naming, potential runtime errors, security vulnerabilities, and architectural problems.
2. Digestibility Refactors: Components and services that handle multiple concerns and could be split into more focused units.
3. Technical Debt: Lack of robust error handling, connection management, and state management strategies.

In the next sections, I'll provide more detailed recommendations for addressing these issues, including specific code changes and architectural improvements.# GitStatus Code Audit Report

## Code Issues

### 1. Frontend Issues

#### File Structure and Path Inconsistencies
- **Issue:** Mismatched component imports in `frontend/src/App.js`
  - **Line:** 9-19
  - **Severity:** Medium
  - **Fix:** Standardize import paths (e.g., either use all './pages/' or all './components/')
  ```javascript
  // Consistent path pattern
  import LoginPage from './pages/Login';
  import DashboardPage from './pages/Dashboard';
  // Fix incorrect casing in paths
  import CreateReportModalComponent from './components/Modals/CreateReportModal';
  import ViewCommitsModalComponent from './components/Modals/ViewCommits/ViewCommitsModal';
  ```

- **Issue:** CSS filename mismatch in ViewCommits modal
  - **File:** `frontend/src/components/Modals/ViewCommits/ViewCommitsModal.jsx`
  - **Line:** 4
  - **Severity:** High
  - **Fix:** Rename CSS import to match actual filename
  ```javascript
  import './ViewCommitsModal.css'; // Currently imports non-existent 'ViewCommitsModalComponent.css'
  ```

#### Component Structure Issues
- **Issue:** Inconsistent component organization pattern
  - **File:** Multiple files across frontend/
  - **Severity:** Medium
  - **Fix:** Enforce consistent pattern where each component has:
    - .js file (logic)
    - .jsx file (presentation)
    - .css file (styling) 
    - index.js (export)

#### Error Handling and Security
- **Issue:** Unsafe iframe URL construction in PDF preview
  - **File:** `frontend/src/components/PagePartials/ViewReport/PDFPreview/ViewReportPDFPreviewComponent.jsx`
  - **Line:** ~84
  - **Severity:** High
  - **Fix:** Add null/undefined check before using downloadUrl
  ```javascript
  src={report?.downloadUrl ? 
    `https://docs.google.com/viewer?url=${encodeURIComponent(report.downloadUrl)}&embedded=true` : 
    'about:blank'}
  ```

- **Issue:** Insufficient cookie clearing in auth error handler
  - **File:** `frontend/src/services/auth.js`
  - **Line:** 18-21
  - **Severity:** Medium
  - **Fix:** Implement more comprehensive cookie clearing
  ```javascript
  // Clear cookies with consideration for different paths/domains
  const cookieOptions = ['path=/', 'path=/api', 'domain=localhost', ''];
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    cookieOptions.forEach(option => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${option}`;
    });
  });
  ```

- **Issue:** Missing access token refresh mechanism
  - **File:** `frontend/src/contexts/AuthContext.js`
  - **Severity:** Medium
  - **Fix:** Add token refresh logic to prevent session expiration
  ```javascript
  // Add to AuthContext.js
  const refreshToken = async () => {
    try {
      const res = await axios.get('/api/auth/refresh');
      if (res.data.isAuthenticated) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };
  
  // Set up refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshToken, 20 * 60 * 1000); // Refresh every 20 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  ```

### 2. Backend Issues

#### API Error Handling
- **Issue:** Inconsistent error handling across controllers
  - **File:** Various files in `backend/controllers/`
  - **Severity:** High
  - **Fix:** Standardize error handling using custom error classes
  ```javascript
  // Example standard pattern for controller methods
  exports.someControllerMethod = async (req, res, next) => {
    try {
      // Controller logic...
    } catch (error) {
      // Let the global error handler process it
      next(error);
    }
  };
  ```

#### MongoDB Connection
- **Issue:** Insufficient MongoDB connection error handling
  - **File:** `backend/server.js`
  - **Line:** ~112
  - **Severity:** High
  - **Fix:** Implement robust connection with retry logic
  ```javascript
  const connectWithRetry = () => {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus', options)
      .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Retrying in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
      });
  };
  
  // Handle connection events
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected, attempting to reconnect...');
    connectWithRetry();
  });
  
  connectWithRetry();
  ```

#### Performance Bottlenecks
- **Issue:** Sequential GitHub API calls in GitHubCommitService
  - **File:** `backend/services/GitHub/GitHubCommitService.js`
  - **Line:** ~237-260
  - **Severity:** Medium
  - **Fix:** Use Promise.all for parallel requests with rate limiting
  ```javascript
  // Parallelize commit fetching with concurrency control
  const fetchCommitsInBatches = async (commitIds, accessToken, repository) => {
    const results = [];
    const batchSize = 5; // Adjust based on GitHub API rate limits
    
    for (let i = 0; i < commitIds.length; i += batchSize) {
      const batch = commitIds.slice(i, i + batchSize);
      const promises = batch.map(async (commitId) => {
        try {
          const url = `https://api.github.com/repos/${repository}/commits/${commitId}`;
          const response = await axios.get(url, { headers: { Authorization: `token ${accessToken}` } });
          return formatCommit(response.data);
        } catch (error) {
          console.error(`Error fetching commit ${commitId}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(Boolean));
    }
    
    return results;
  };
  ```

#### Security Vulnerabilities
- **Issue:** Potentially insecure sanitization in middleware
  - **File:** `backend/middleware/sanitizationMiddleware.js`
  - **Line:** ~19-21
  - **Severity:** High
  - **Fix:** Use a dedicated sanitization library
  ```javascript
  const createDOMPurify = require('dompurify');
  const { JSDOM } = require('jsdom');
  
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  
  // In sanitizeInput function
  if (typeof value === 'string') {
    // Sanitize HTML
    obj[key] = DOMPurify.sanitize(value);
    
    // Normalize whitespace
    obj[key] = obj[key].replace(/\s+/g, ' ').trim();
  }
  ```

- **Issue:** Rate limiting disabled in development mode
  - **File:** `backend/server.js`
  - **Line:** ~66-70
  - **Severity:** Medium
  - **Fix:** Add a prominent warning or use different limits
  ```javascript
  // Development mode should use lighter rate limiting rather than none
  if (process.env.NODE_ENV === 'production') {
    app.use('/api/', apiLimiter);
  } else {
    console.warn('⚠️ WARNING: Using reduced rate limiting for development');
    const devLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5000, // Higher limit for development
      message: 'Too many requests from this IP, please try again later',
    });
    app.use('/api/', devLimiter);
  }
  ```

## Digestibility Refactors

### ViewReportComponent Refactor

The current ViewReportComponent combines data fetching, state management, and presentation:

```javascript
// Split into separate concerns:
// 1. Create a custom hook for data fetching and processing
// frontend/src/components/ViewReport/useReportData.js
export const useReportData = (reportId) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfStatus, setPdfStatus] = useState('loading');
  const [pdfProgress, setPdfProgress] = useState(0);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const report = await api.getReportById(reportId);
        setReport(report);
        setError(null);
        
        // Initialize PDF status
        if (report.pdfUrl === 'pending') {
          startPollingPdfStatus(reportId);
        } else if (report.pdfUrl === 'failed') {
          setPdfStatus('failed');
        } else {
          setPdfStatus('completed');
        }
      } catch (error) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    
    if (reportId) fetchReport();
  }, [reportId]);
  
  // PDF status polling function
  const startPollingPdfStatus = useCallback((reportId) => {
    // Implementation...
  }, []);
  
  return {
    report,
    loading,
    error,
    pdfStatus,
    pdfProgress,
    formatDate: (date) => new Date(date).toLocaleDateString()
  };
};

// 2. Update the component to use the hook
// frontend/src/components/ViewReport/ViewReportComponent.js
const ViewReportComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report, loading, error, pdfStatus, pdfProgress, formatDate } = useReportData(id);
  
  const handleNavigateBack = () => {
    navigate('/dashboard');
  };
  
  return (
    <ViewReportComponentTemplate
      loading={loading}
      error={error}
      report={report}
      pdfStatus={pdfStatus}
      pdfProgress={pdfProgress}
      formatDate={formatDate}
      handleNavigateBack={handleNavigateBack}
    />
  );
};
```

### CreateReportModal Refactor

Split the complex `CreateReportModal` component further:

```javascript
// Split repository search functionality into its own hook
// frontend/src/components/Modals/CreateReport/useRepositorySearch.js
export const useRepositorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Handle repository search
  useEffect(() => {
    const searchRepositories = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setSearching(true);
        const repos = await api.searchRepositories(searchQuery);
        setSearchResults(repos);
      } catch (err) {
        console.error('Repository search error:', err);
      } finally {
        setSearching(false);
      }
    };
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      searchRepositories();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching
  };
};

// Then use this hook in useReportForm.js
const useReportForm = () => {
  // existing code...
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    searching 
  } = useRepositorySearch();
  
  // rest of the hook implementation...
};
```

### Backend Service Refactoring

Refactor OpenAIService to separate concerns:

```javascript
// Split into API client and business logic

// backend/services/OpenAI/OpenAIClient.js
const { OpenAI } = require('openai');

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async createChatCompletion(messages, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || process.env.OPENAI_MODEL || 'gpt-4o',
        messages,
        maxTokens: options.maxTokens,
        temperature: options.temperature || 0.7
      });
      
      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

module.exports = new OpenAIClient();

// backend/services/OpenAI/CommitAnalysisService.js
const openAIClient = require('./OpenAIClient');
const { getCommitSummaryPrompt } = require('../../templates/commitSummaryPrompt');
const CommitSummary = require('../../models/CommitSummary');

class CommitAnalysisService {
  async analyzeCommit(commit, repository, trackTokens = true) {
    // Implementation...
  }
  
  async getOrCreateCommitSummary(commit, repository, trackTokens = true) {
    // Implementation...
  }
}

module.exports = new CommitAnalysisService();

// backend/services/OpenAI/ReportGenerationService.js
const openAIClient = require('./OpenAIClient');
const { getReportPrompt } = require('../../templates/reportPrompt');

class ReportGenerationService {
  async generateReportFromCommits(options) {
    // Implementation...
  }
}

module.exports = new ReportGenerationService();

// backend/services/OpenAI/index.js
const OpenAIClient = require('./OpenAIClient');
const CommitAnalysisService = require('./CommitAnalysisService');
const ReportGenerationService = require('./ReportGenerationService');

module.exports = {
  OpenAIClient,
  CommitAnalysisService,
  ReportGenerationService
};
```

## Technical Debt

### PDF Generation Architecture

The current PDF generation approach has limitations with scalability and error handling. Here's a robust architecture:

```javascript
// backend/services/pdf/PDFJobProcessor.js
const Bull = require('bull');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const s3Service = require('../s3');
const Report = require('../../models/Report');

// Configure Redis connection
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD
  }
};

// Create the PDF generation queue
const pdfQueue = new Bull('pdf-generation', {
  ...redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

// Process PDF generation jobs
pdfQueue.process(async (job) => {
  const { reportId, options } = job.data;
  let browser = null;
  let tempDir = null;
  
  try {
    // Update job progress
    await job.progress(10);
    console.log(`Processing PDF for report ${reportId} - Started`);
    
    // Create temp directory for HTML
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitstatus-'));
    const htmlPath = path.join(tempDir, 'report.html');
    
    // Generate HTML content
    const htmlContent = await generateHTML(options);
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
    
    await job.progress(30);
    console.log(`Processing PDF for report ${reportId} - HTML generated`);
    
    // Launch browser with retry logic
    browser = await launchBrowserWithRetry();
    
    await job.progress(50);
    
    // Generate PDF
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
      timeout: 120000
    });
    
    await job.progress(70);
    console.log(`Processing PDF for report ${reportId} - PDF generated`);
    
    // Upload to S3
    const key = `reports/${reportId}/report-${Date.now()}.pdf`;
    const uploadResult = await s3Service.uploadBuffer({
      buffer: pdfBuffer,
      key,
      contentType: 'application/pdf'
    });
    
    await job.progress(90);
    console.log(`Processing PDF for report ${reportId} - Uploaded to S3`);
    
    // Update report with PDF URL
    await Report.findByIdAndUpdate(reportId, { 
      pdfUrl: uploadResult.key,
      pdfStatus: 'completed',
      pdfError: null
    });
    
    await job.progress(100);
    console.log(`Processing PDF for report ${reportId} - Completed`);
    
    // Return success
    return { 
      status: 'completed',
      pdfUrl: uploadResult.key,
      viewUrl: uploadResult.url
    };
  } catch (error) {
    console.error(`Error generating PDF for report ${reportId}:`, error);
    
    // Update report with error
    await Report.findByIdAndUpdate(reportId, { 
      pdfStatus: 'failed',
      pdfError: error.message
    });
    
    // Throw error to trigger job failure
    throw error;
  } finally {
    // Clean up resources
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
    
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error removing temp directory:', error);
      }
    }
  }
});

// Helper function to launch browser with retry
async function launchBrowserWithRetry(attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    } catch (error) {
      console.error(`Failed to launch browser (attempt ${attempt}/${attempts}):`, error);
      
      if (attempt === attempts) {
        throw new Error(`Failed to launch browser after ${attempts} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Add monitoring and metrics
pdfQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

pdfQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

pdfQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

module.exports = {
  pdfQueue,
  addJob: async (reportId, options) => {
    const job = await pdfQueue.add({ reportId, options });
    return { id: job.id };
  },
  getJobStatus: async (jobId) => {
    const job = await pdfQueue.getJob(jobId);
    if (!job) return { status: 'not-found' };
    
    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      progress: job.progress(),
      data: job.data,
      failedReason: job.failedReason,
      createdAt: job.timestamp
    };
  },
  cleanupOldJobs: async () => {
    await pdfQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await pdfQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  }
};
```

### MongoDB Connection Strategy

Here's a robust MongoDB connection strategy:

```javascript
// backend/services/database/mongoConnection.js
const mongoose = require('mongoose');
const EventEmitter = require('events');

class DatabaseService extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000
    };
    
    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log('MongoDB connected');
      this.emit('connected');
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.log('MongoDB disconnected');
      this.emit('disconnected');
      
      // Attempt to reconnect if not already reconnecting
      if (!this.reconnecting) {
        this.reconnectWithBackoff();
      }
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      this.emit('error', err);
    });
    
    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }
  
  async connect() {
    if (this.isConnected) return;
    
    try {
      this.reconnecting = false;
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus', this.connectionOptions);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.emit('error', error);
      this.reconnectWithBackoff();
    }
  }
  
  async reconnectWithBackoff(attempt = 1, maxAttempts = 10) {
    if (attempt > maxAttempts) {
      console.error(`Failed to reconnect to MongoDB after ${maxAttempts} attempts`);
      this.emit('reconnectFailed');
      return;
    }
    
    this.reconnecting = true;
    
    // Calculate backoff delay with exponential backoff and jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = delay * 0.2 * Math.random();
    const totalDelay = delay + jitter;
    
    console.log(`Attempting to reconnect to MongoDB in ${Math.round(totalDelay/1000)} seconds (attempt ${attempt}/${maxAttempts})`);
    
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus', this.connectionOptions);
        this.reconnecting = false;
        console.log(`Reconnected to MongoDB on attempt ${attempt}`);
        this.emit('reconnected', attempt);
      } catch (error) {
        console.error(`Failed to reconnect on attempt ${attempt}:`, error);
        this.reconnectWithBackoff(attempt + 1, maxAttempts);
      }
    }, totalDelay);
  }
  
  async gracefulShutdown() {
    if (!this.isConnected) return;
    
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('Error during MongoDB connection shutdown:', error);
      process.exit(1);
    }
  }
  
  // Check if connection is healthy and reconnect if needed
  async checkConnection() {
    if (!this.isConnected && !this.reconnecting) {
      console.log('MongoDB connection check failed, attempting to reconnect');
      await this.connect();
      return false;
    }
    return this.isConnected;
  }
}

module.exports = new DatabaseService();
```

### State Management Analysis

**Comparison of State Management Options:**

1. **React Context API (Current)**
   - **Pros:**
     - Simple, built into React
     - Good for infrequently changing global state
     - No additional dependencies
   - **Cons:**
     - Performance issues with frequent updates
     - Can lead to unnecessary re-renders
     - Harder to debug and trace state changes

2. **Redux**
   - **Pros:**
     - Predictable state container
     - Time-travel debugging
     - Middleware support for complex flows
     - Large ecosystem and dev tools
   - **Cons:**
     - Verbose boilerplate
     - Steeper learning curve
     - Adds bundle size
     - Overkill for simpler applications

3. **Zustand**
   - **Pros:**
     - Minimal boilerplate
     - No providers needed
     - Fast performance
     - Works with React and vanilla JS
     - TypeScript support
   - **Cons:**
     - Smaller ecosystem than Redux
     - Less mature dev tools
     - Less standardized patterns

**Recommendation:** Migrate to Zustand for key global state like authentication and modals, while keeping React Context for less frequently updated state.

Here's a migration plan:

```javascript
// frontend/src/store/authStore.js
import create from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  
  checkAuth: async () => {
    try {
      set({ loading: true });
      const res = await api.getCurrentUser();
      
      if (res.isAuthenticated) {
        set({
          user: res.user,
          isAuthenticated: true,
          error: null
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false
        });
        return false;
      }
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        error: 'Failed to authenticate'
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
  logout: async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false
      });
    }
  }
}));

export default useAuthStore;
```

Then replace the AuthContext usage in components:

```javascript
// Before
const { user, isAuthenticated, loading } = useContext(AuthContext);

// After
const { user, isAuthenticated, loading } = useAuthStore();
```

## Claude Bible

```markdown
# GitStatus Code Standards Bible

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
```

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