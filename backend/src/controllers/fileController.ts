import { Request, Response } from 'express';
import { s3Service } from '../services/s3Service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for file upload
export const uploadMiddleware = upload.single('file');

// Schema for file deletion and retrieval
export const fileParamsSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'File key is required')
  })
});

/**
 * Generate a unique file key for S3
 * @param originalname - Original file name
 * @param prefix - Optional prefix/folder
 * @returns Unique file key
 */
function generateFileKey(originalname: string, prefix = 'uploads'): string {
  const ext = path.extname(originalname);
  const filename = `${uuidv4()}${ext}`;
  return `${prefix}/${filename}`;
}

/**
 * Upload a file to S3
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file exists in request
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    const prefix = req.body.prefix || 'uploads';
    
    // Generate a unique key for the file
    const key = generateFileKey(originalname, prefix);
    
    // Upload the file to S3
    await s3Service.uploadObject(key, buffer, mimetype);
    
    // Generate a temporary URL for the uploaded file
    const url = await s3Service.getSignedUrl(key);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      key,
      url,
      originalName: originalname,
      contentType: mimetype
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('File upload failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Delete a file from S3
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    
    await s3Service.deleteObject(key);
    
    res.status(200).json({
      message: 'File deleted successfully',
      key
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error(`File deletion failed for key: ${req.params.key}`, error instanceof Error ? error : undefined);
    
    // Determine status code based on the error
    if (errorMessage.includes('not found')) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Get a file from S3
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const download = req.query.download === 'true';
    
    // Get the file
    const buffer = await s3Service.getObject(key);
    
    // Determine content type (basic approach - for production, consider a more robust solution)
    const ext = path.extname(key).toLowerCase();
    let contentType = 'application/octet-stream'; // default
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.html') contentType = 'text/html';
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    
    if (download) {
      // Extract filename from key
      const filename = path.basename(key);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error(`File retrieval failed for key: ${req.params.key}`, error instanceof Error ? error : undefined);
    
    // Determine status code based on the error
    if (errorMessage.includes('not found')) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * List files from S3
 */
export const listFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const prefix = req.query.prefix as string | undefined;
    
    // Get the list of files
    const keys = await s3Service.listObjects(prefix);
    
    // Generate pre-signed URLs for each file
    const files = await Promise.all(
      keys.map(async (key) => {
        const url = await s3Service.getSignedUrl(key);
        return {
          key,
          url,
          filename: path.basename(key)
        };
      })
    );
    
    res.status(200).json({
      message: 'Files retrieved successfully',
      files
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('File listing failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}; 