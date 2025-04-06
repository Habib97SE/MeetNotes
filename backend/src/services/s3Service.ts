import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  GetObjectCommandOutput,
  S3ServiceException
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withAwsRetry } from '../utils/awsRetry';
import { logger } from '../utils/logger';
import { Readable } from 'stream';
import { 
    AWS_ACCESS_KEY_ID, 
    AWS_SECRET_ACCESS_KEY, 
    AWS_REGION, 
    AWS_BUCKET_NAME  
} from '../config/env';

// Environment variables
const REGION = AWS_REGION;
const BUCKET_NAME = AWS_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error('S3_BUCKET_NAME environment variable is not set');
}

// Create S3 client instance
const s3Client = new S3Client({ 
  region: REGION
});

/**
 * Convert a readable stream to a buffer
 * @param stream - The readable stream to convert
 * @returns Promise resolving to a Buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * S3 Service for handling object operations
 */
export class S3Service {
  private bucket: string;

  constructor(bucketName: string = BUCKET_NAME!) {
    this.bucket = bucketName;
  }

  /**
   * Upload a file to S3
   * @param key - The object key (path in the bucket)
   * @param body - The file content (Buffer, string, or readable stream)
   * @param contentType - The MIME type of the file
   * @returns Promise resolving to the key of the uploaded object
   */
  async uploadObject(
    key: string, 
    body: Buffer | string | Readable, 
    contentType: string
  ): Promise<string> {
    logger.info(`Uploading object to S3: ${key}`);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType
      });

      await withAwsRetry(
        () => s3Client.send(command),
        { 
          operationName: 'S3 upload',
          timeoutMs: 30000 // 30 seconds timeout for uploads
        }
      );

      logger.info(`Successfully uploaded object to S3: ${key}`);
      return key;
    } catch (error) {
      logger.error(`Failed to upload object to S3: ${key}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Delete an object from S3
   * @param key - The object key to delete
   * @returns Promise resolving to true if the object was deleted
   */
  async deleteObject(key: string): Promise<boolean> {
    logger.info(`Deleting object from S3: ${key}`);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await withAwsRetry(
        () => s3Client.send(command),
        { operationName: 'S3 delete' }
      );

      logger.info(`Successfully deleted object from S3: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete object from S3: ${key}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get an object from S3
   * @param key - The object key to retrieve
   * @returns Promise resolving to the object data as a Buffer
   */
  async getObject(key: string): Promise<Buffer> {
    logger.info(`Getting object from S3: ${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await withAwsRetry<GetObjectCommandOutput>(
        () => s3Client.send(command),
        { operationName: 'S3 get object' }
      );

      if (!response.Body) {
        throw new Error(`Empty response body for object: ${key}`);
      }

      // Convert the readable stream to a buffer
      const buffer = await streamToBuffer(response.Body as Readable);
      
      logger.info(`Successfully retrieved object from S3: ${key}`);
      return buffer;
    } catch (error) {
      // Check if the error is a "NoSuchKey" error (object not found)
      if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
        logger.warn(`Object not found in S3: ${key}`);
        throw new Error(`Object not found: ${key}`);
      }
      
      logger.error(`Failed to get object from S3: ${key}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * List all objects in a specific prefix (folder)
   * @param prefix - The prefix/folder to list objects from (optional)
   * @returns Promise resolving to an array of object keys
   */
  async listObjects(prefix?: string): Promise<string[]> {
    logger.info(`Listing objects from S3${prefix ? ` with prefix: ${prefix}` : ''}`);

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix
      });

      const response = await withAwsRetry<ListObjectsV2CommandOutput>(
        () => s3Client.send(command),
        { operationName: 'S3 list objects' }
      );

      const keys = (response.Contents || [])
        .map(object => object.Key)
        .filter((key): key is string => key !== undefined);

      logger.info(`Successfully listed ${keys.length} objects from S3`);
      return keys;
    } catch (error) {
      logger.error(`Failed to list objects from S3${prefix ? ` with prefix: ${prefix}` : ''}`, 
        error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for an object (for temporary access)
   * @param key - The object key
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Promise resolving to the pre-signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    logger.info(`Generating signed URL for object: ${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const signedUrl = await withAwsRetry(
        () => getSignedUrl(s3Client, command, { expiresIn }),
        { operationName: 'S3 generate signed URL' }
      );

      logger.info(`Successfully generated signed URL for object: ${key}`);
      return signedUrl;
    } catch (error) {
      logger.error(`Failed to generate signed URL for object: ${key}`, 
        error instanceof Error ? error : undefined);
      throw error;
    }
  }
}

// Export a singleton instance with default bucket
export const s3Service = new S3Service();
