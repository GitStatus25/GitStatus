const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Import the custom error classes
const { 
  ExternalServiceError, 
  ValidationError 
} = require('../utils/errors');

/**
 * Service for interacting with AWS S3
 */
class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.bucket = process.env.S3_BUCKET_NAME;
  }

  /**
   * Upload a file to S3
   * @param {Object} options - Upload options
   * @param {string} options.filePath - Path to file
   * @param {string} options.key - S3 key (path)
   * @param {string} options.contentType - MIME type
   * @returns {Promise<Object>} - S3 upload result
   */
  async uploadFile({ filePath, key, contentType }) {
    try {
      if (!filePath) {
        throw new ValidationError('File path is required');
      }

      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      // Read the file
      const fileContent = await readFileAsync(filePath);

      // Upload parameters
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType || 'application/octet-stream',
        ContentDisposition: 'inline'
      };

      // Upload to S3
      const upload = await this.s3.upload(params).promise();
      
      // Delete the local file after successful upload
      try {
        await unlinkAsync(filePath);
      } catch (deleteError) {
        console.error('Error deleting temporary file:', deleteError);
        // Continue even if delete fails
      }

      return {
        key: upload.Key,
        url: upload.Location,
        bucket: upload.Bucket
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ExternalServiceError(
        `Failed to upload file to S3: ${error.message}`,
        's3'
      );
    }
  }

  /**
   * Upload a buffer to S3
   * @param {Object} options - Upload options
   * @param {Buffer} options.buffer - File buffer
   * @param {string} options.key - S3 key (path)
   * @param {string} options.contentType - MIME type
   * @returns {Promise<Object>} - S3 upload result
   */
  async uploadBuffer({ buffer, key, contentType }) {
    try {
      if (!buffer) {
        throw new ValidationError('Buffer is required');
      }

      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      // Upload parameters
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        ContentDisposition: 'inline'
      };

      // Upload to S3
      const upload = await this.s3.upload(params).promise();

      return {
        key: upload.Key,
        url: upload.Location,
        bucket: upload.Bucket
      };
    } catch (error) {
      console.error('Error uploading buffer to S3:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ExternalServiceError(
        `Failed to upload buffer to S3: ${error.message}`,
        's3'
      );
    }
  }

  /**
   * Get a file from S3
   * @param {Object} options - Options
   * @param {string} options.key - S3 key
   * @returns {Promise<Object>} - S3 object with data
   */
  async getFile({ key }) {
    try {
      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const data = await this.s3.getObject(params).promise();
      
      return {
        body: data.Body,
        contentType: data.ContentType,
        metadata: data.Metadata
      };
    } catch (error) {
      console.error('Error getting file from S3:', error);
      
      if (error.code === 'NoSuchKey') {
        throw new ValidationError(`File with key ${key} not found in S3`);
      }
      
      throw new ExternalServiceError(
        `Failed to get file from S3: ${error.message}`,
        's3'
      );
    }
  }

  /**
   * Delete a file from S3
   * @param {Object} options - Options
   * @param {string} options.key - S3 key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile({ key }) {
    try {
      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new ExternalServiceError(
        `Failed to delete file from S3: ${error.message}`,
        's3'
      );
    }
  }

  /**
   * Generate a presigned URL for an object
   * @param {Object} options - Options
   * @param {string} options.key - S3 key
   * @param {number} options.expiresIn - Expiration in seconds
   * @returns {Promise<string>} - Presigned URL
   */
  async getSignedUrl({ key, expiresIn = 3600 }) {
    try {
      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new ExternalServiceError(
        `Failed to generate presigned URL: ${error.message}`,
        's3'
      );
    }
  }

  /**
   * Generate a unique key for S3 with a provided prefix
   * @param {Object} options - Options
   * @param {string} options.prefix - Key prefix
   * @param {string} options.extension - File extension
   * @returns {string} - Unique S3 key
   */
  generateUniqueKey({ prefix = '', extension = '' }) {
    const uuid = uuidv4();
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    
    if (prefix) {
      // Ensure prefix ends with a slash
      const formattedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      return `${formattedPrefix}${uuid}${ext}`;
    }
    
    return `${uuid}${ext}`;
  }

  /**
   * Check if a file exists in S3
   * @param {Object} options - Options
   * @param {string} options.key - S3 key
   * @returns {Promise<boolean>} - Whether the file exists
   */
  async fileExists({ key }) {
    try {
      if (!key) {
        throw new ValidationError('S3 key is required');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
        return false;
      }
      
      console.error('Error checking if file exists in S3:', error);
      throw new ExternalServiceError(
        `Failed to check if file exists in S3: ${error.message}`,
        's3'
      );
    }
  }
}

module.exports = new S3Service(); 