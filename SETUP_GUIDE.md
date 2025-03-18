# GitStatus Setup Guide

This guide provides step-by-step instructions for setting up the GitStatus application on your local machine.

## Prerequisites

Before beginning, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB (local installation or MongoDB Atlas account)
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gitstatus.git
cd gitstatus
```

## Step 2: Set Up Backend Environment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an environment file:
   ```bash
   cp .env.example .env
   ```

4. Open the `.env` file in your text editor and update the following values:
   - `SESSION_SECRET`: A random string for session encryption
   - `MONGODB_URI`: Your MongoDB connection string
   - `GITHUB_CLIENT_ID`: From GitHub OAuth App (see Step 5)
   - `GITHUB_CLIENT_SECRET`: From GitHub OAuth App (see Step 5)
   - `OPENAI_API_KEY`: From OpenAI (see Step 6)
   - AWS S3 credentials (see Step 7)

## Step 3: Set Up Frontend Environment

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an environment file if it doesn't already exist:
   ```bash
   # The .env.development file should already exist
   # If not, create it with the following content:
   echo "REACT_APP_API_URL=http://localhost:5000" > .env.development
   ```

## Step 4: Start MongoDB (Local Development)

If you're using a local MongoDB installation:

```bash
# Start MongoDB service
sudo systemctl start mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

If you're using MongoDB Atlas, ensure your connection string in the backend `.env` file is correct.

## Step 5: Obtain GitHub OAuth Credentials

1. Go to GitHub Developer Settings: https://github.com/settings/developers
2. Click on "New OAuth App"
3. Fill in the application details:
   - **Application name**: GitStatus
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: GitHub commit history analyzer (optional)
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click "Register application"
5. On the next screen, you'll see your Client ID
6. Click "Generate a new client secret"
7. Copy both the Client ID and Client Secret to your backend `.env` file

## Step 6: Obtain OpenAI API Key

1. Sign up for an OpenAI account: https://platform.openai.com/signup
2. Go to API keys: https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Give your key a name (e.g., "GitStatus App")
5. Copy the API key and add it to your backend `.env` file
6. Consider setting usage limits in the OpenAI dashboard to control costs

## Step 7: Configure AWS S3 (Optional for MVP Testing)

1. Sign in to the AWS Management Console: https://aws.amazon.com/console/
2. Navigate to the S3 service
3. Create a new bucket:
   - Choose a unique bucket name (e.g., "gitstatus-reports")
   - Select the AWS Region closest to your users
   - Configure bucket settings (recommended: block all public access)
   - Click "Create bucket"
4. Create an IAM user with S3 access:
   - Go to the IAM service
   - Click "Users" and then "Add user"
   - Create a user with "Programmatic access"
   - Attach the "AmazonS3FullAccess" policy
   - Complete the user creation process
   - Save the Access Key ID and Secret Access Key
5. Add these credentials to your backend `.env` file

## Step 8: Start the Application

You can start both the backend and frontend with the provided script:

```bash
# Make the script executable first
chmod +x run-dev.sh

# Run the script
./run-dev.sh
```

This will start:
- Backend server on port 5000
- Frontend server on port 3000

You can now access the application at http://localhost:3000

## Step 9: First-Time Setup

1. Visit http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Click "Login with GitHub"
4. Authorize the application to access your GitHub account
5. You'll be redirected to the dashboard
6. From here, you can create your first report by clicking "Create New Report"

## Troubleshooting

### Backend Server Won't Start
- Check if MongoDB is running
- Verify your `.env` file has all required variables
- Check the Node.js logs for specific errors

### GitHub OAuth Issues
- Verify the callback URL in GitHub matches your backend `.env` file
- Ensure your GitHub OAuth app has the necessary scopes
- Check for CORS issues in the browser console

### Frontend Connection Issues
- Ensure the backend server is running
- Check the proxy setting in `frontend/package.json`
- Verify the REACT_APP_API_URL is set correctly

## Next Steps

After setting up the application successfully:
1. Explore creating your first report
2. Check the generated PDF output
3. Review the code structure to understand the architecture
4. Consider contributing to the project by adding tests or new features
