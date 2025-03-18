const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Create S3 instance
const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

/**
 * Service for interacting with AWS S3
 */
const s3Service = {
  /**
   * Upload a file to S3
   * @param {Object|string} params - Upload parameters or file path
   * @param {Buffer|string} [params.fileContent] - The file content to upload
   * @param {string} [params.fileName] - Name for the file
   * @param {string} [params.contentType] - MIME type of the file
   * @returns {Promise<Object>} - The S3 upload result
   */
  async uploadFile(params) {
    if (!bucketName) {
      console.error('S3_BUCKET_NAME environment variable is not set');
      throw new Error('S3 bucket name is not configured');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials are not set properly');
      throw new Error('AWS credentials are not configured');
    }

    try {
      let fileContent, fileName, contentType;
      
      // Handle string parameter (file path)
      if (typeof params === 'string') {
        const fs = require('fs');
        const path = require('path');
        const filePath = params;
        
        fileName = path.basename(filePath);
        fileContent = fs.readFileSync(filePath);
        contentType = 'application/pdf'; // Default for PDF files
      } else {
        // Handle object parameter
        ({ fileContent, fileName, contentType } = params);
      }
      
      if (!fileName) {
        throw new Error('File name is required');
      }
      
      // Create a unique key for the file
      const timestamp = new Date().getTime();
      const key = `files/${timestamp}-${fileName.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
      
      // Upload the file to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType || 'application/octet-stream'
      };
      
      const result = await s3.upload(uploadParams).promise();
      console.log(`File uploaded successfully to ${result.Location}`);
      
      return result;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  },
  
  /**
   * Upload a PDF to S3
   */
  async uploadPDF({ pdfBuffer, userId, reportName, repository }) {
    // Create a unique key for the PDF
    const timestamp = new Date().getTime();
    const key = `reports/${userId}/${timestamp}-${repository.replace('/', '-')}-${reportName.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.pdf`;
    
    // Upload the PDF to S3
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      // Set additional parameters for the PDF
      ContentDisposition: `inline; filename="${timestamp}-${reportName.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.pdf"`
    };
    
    const result = await s3.upload(params).promise();
    
    // Return the key and a pre-signed URL
    const signedUrl = await this.getSignedUrl(result.Key);
    return {
      key: result.Key,
      signedUrl
    };
  },
  
  /**
   * Get a pre-signed URL for a PDF
   * @param {string} key - The S3 key of the object
   * @param {number} expiresIn - URL expiration time in seconds (default: 24 hours)
   * @returns {Promise<string>} Pre-signed URL
   */
  async getSignedUrl(key, expiresIn = 86400) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn,
      ResponseContentDisposition: 'inline',
      ResponseContentType: 'application/pdf'
    };
    
    return s3.getSignedUrlPromise('getObject', params);
  },
  
  /**
   * Get a pre-signed URL specifically for downloading a PDF
   * @param {string} key - The S3 key of the object
   * @param {number} expiresIn - URL expiration time in seconds (default: 24 hours)
   * @returns {Promise<string>} Pre-signed URL with attachment content disposition
   */
  async getDownloadUrl(key, filename, expiresIn = 86400) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn,
      ResponseContentDisposition: `attachment; filename="${filename || 'report.pdf'}"`,
      ResponseContentType: 'application/pdf'
    };
    
    return s3.getSignedUrlPromise('getObject', params);
  },
  
  /**
   * Check if an object exists in S3
   * @param {string} key - The S3 key of the object
   * @returns {Promise<boolean>} Whether the object exists
   */
  async objectExists(key) {
    if (!key) return false;
    
    try {
      const params = {
        Bucket: bucketName,
        Key: key
      };
      
      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      console.error('Error checking if object exists:', error);
      throw error;
    }
  },
  
  /**
   * Delete an object from S3
   * @param {string} key - The S3 key of the object to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteObject(key) {
    if (!key) {
      console.error('No key provided for deletion');
      return false;
    }
    
    try {
      // First check if the object exists
      const exists = await this.objectExists(key);
      if (!exists) {
        console.warn(`Object does not exist in S3, skipping deletion: ${key}`);
        return true; // Return success since there's nothing to delete
      }
      
      const params = {
        Bucket: bucketName,
        Key: key
      };
      
      await s3.deleteObject(params).promise();
      console.log(`Object deleted successfully: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error deleting object ${key}:`, error);
      throw error;
    }
  }
};

module.exports = s3Service;
