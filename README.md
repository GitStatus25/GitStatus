# GitStatus

GitStatus is a full-stack application that analyzes GitHub commit history to generate concise reports of actual work accomplished. It helps developers and project managers track and report on progress by analyzing commit diffs with AI.

## Features

- **GitHub OAuth Integration**: Securely connect your GitHub account
- **Commit Analysis**: Select branches, authors, and date ranges to analyze
- **AI-Powered Summaries**: Analyze commit diffs with OpenAI to create concise summaries
- **PDF Reports**: Generate professional PDF reports of work accomplished
- **Report History**: View past reports and download as needed

## Tech Stack

### Frontend
- React.js
- Material-UI for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose for data storage
- Passport.js for GitHub OAuth authentication
- OpenAI SDK for commit analysis
- PDFKit for PDF generation
- AWS S3 for PDF storage

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

You will also need:
- GitHub OAuth App credentials
- OpenAI API key
- AWS S3 bucket and credentials

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gitstatus.git
cd gitstatus
```

### 2. Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit the `.env` file with your:
- MongoDB connection string
- GitHub OAuth credentials
- OpenAI API key
- AWS S3 credentials

### 3. Set Up the Frontend

```bash
cd ../frontend
npm install
```

### 4. GitHub OAuth Setup

1. Go to GitHub Developer Settings: https://github.com/settings/developers
2. Click on "New OAuth App" button
3. Fill in the application details:
   - **Application name**: GitStatus (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: (Optional) GitHub commit history analyzer
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click "Register application"
5. On the next screen, you'll see your Client ID
6. Click "Generate a new client secret"
7. Copy both the Client ID and Client Secret
8. Add these credentials to your backend `.env` file:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
   ```
9. Make sure to select the appropriate scopes for your OAuth app. GitStatus requires:
   - `repo` scope to access repository data
   - `user` scope to access user information

**Important Security Note**: Never commit your Client Secret to version control. Always use environment variables or a secure configuration method.

### 5. OpenAI API Setup

1. Sign up for an OpenAI account: https://platform.openai.com/signup
2. After signing up and logging in, go to: https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Give your key a name (e.g., "GitStatus App")
5. Copy the API key (you won't be able to view it again!)
6. Add the key to your backend `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
7. For production, consider setting up usage limits in the OpenAI dashboard to control costs

**API Usage Note**: OpenAI API calls incur charges based on the model used and token count. The application uses gpt-4o for analyzing commit diffs, which has associated costs. Monitor your usage in the OpenAI dashboard.

### 6. AWS S3 Setup

1. Sign in to the AWS Management Console: https://aws.amazon.com/console/
2. Navigate to the S3 service
3. Create a new bucket:
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., "gitstatus-reports")
   - Select the AWS Region closest to your users
   - Configure bucket settings (recommended: block all public access)
   - Enable versioning if desired
   - Click "Create bucket"
4. Create an IAM user with S3 access:
   - Go to the IAM service
   - Click "Users" and then "Add user"
   - Create a user with "Programmatic access"
   - Attach the "AmazonS3FullAccess" policy (or create a custom policy with more limited permissions)
   - Complete the user creation process
   - Save the Access Key ID and Secret Access Key shown on the final screen
5. Add these credentials to your backend `.env` file:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=your_selected_region
   S3_BUCKET_NAME=your_bucket_name
   ```

**Security Best Practice**: Use IAM policies that follow the principle of least privilege, only granting the specific permissions needed for your application.

## Running the Application

### Development Mode

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm start
```

The app will be available at `http://localhost:3000`

### Production Deployment

For the backend:

```bash
cd backend
npm start
```

For the frontend:

```bash
cd frontend
npm run build
```

You can serve the frontend build folder using a static file server or deploy it to a service like Netlify or Vercel.

## Deployment Options

### Backend Deployment (Heroku)

1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect your GitHub repository
4. Deploy the backend folder

### Frontend Deployment (Netlify)

1. Build your React app: `npm run build`
2. Create a Netlify site
3. Upload the build folder
4. Set environment variables in Netlify dashboard

## Security Considerations

- Store sensitive credentials in environment variables, not in code
- Implement proper error handling
- Use HTTPS for all API requests
- Properly scope GitHub OAuth tokens

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
