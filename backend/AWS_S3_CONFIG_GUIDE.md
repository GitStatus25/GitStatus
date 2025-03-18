# AWS S3 Configuration Guide for GitStatus

This guide provides instructions for configuring AWS S3 for storing and retrieving PDF reports in the GitStatus application.

## AWS S3 Environment Variables

Add the following to your `.env` file in the backend directory:

```
# AWS S3 (Get these from AWS IAM)
AWS_ACCESS_KEY_ID=your-aws-access-key       # IAM user access key for S3 uploads
AWS_SECRET_ACCESS_KEY=your-aws-secret-key   # IAM user secret key
AWS_REGION=your-aws-region                  # AWS region for S3 bucket (e.g., us-east-1)
S3_BUCKET_NAME=your-bucket-name             # Name of S3 bucket for storing PDFs
```

## Setting Up CORS Configuration for Your S3 Bucket

For the PDF viewer to work properly in the browser, you'll need to configure CORS permissions on your S3 bucket:

1. Go to your S3 bucket in the AWS Management Console
2. Click on the "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and add the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `https://your-production-domain.com` with your actual production domain when deploying.

## S3 Bucket Policy

By default, the application uses pre-signed URLs, which don't require changing the bucket policy. However, if you want to make certain reports publicly accessible, you can modify the bucket policy. Generally, we recommend keeping the default setting of blocking all public access and only using pre-signed URLs.

## Testing S3 Configuration

After setting up your S3 bucket and configuring the environment variables, you can test your configuration:

1. Start the GitStatus application
2. Create a new report
3. Check that the PDF is uploaded to S3 and available for download/preview
4. The pre-signed URLs should work for both downloading and viewing the PDF in the browser

## Troubleshooting S3 Access

If you encounter issues with S3 access:

1. Check that your IAM user has the correct permissions (AmazonS3FullAccess or a custom policy with s3:PutObject and s3:GetObject permissions)
2. Verify that your bucket name exists and is correctly spelled in the environment variables
3. Check the AWS region is correct
4. Ensure the CORS configuration is properly set for the PDF viewer to work
5. Check the backend logs for specific S3 error messages

Remember, pre-signed URLs are temporary and will expire after the configured time (default is 24 hours in this implementation).
