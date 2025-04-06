import { Router } from 'express';
import { uploadFile, deleteFile, getFile, listFiles, uploadMiddleware } from '../../controllers/fileController';
import { validateRequest } from '../../middlewares/validateRequest';
import { fileParamsSchema } from '../../controllers/fileController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all file routes
router.use(authMiddleware);

// Upload a file
router.post('/upload', uploadMiddleware, uploadFile);

// Delete a file
router.delete('/:key', validateRequest(fileParamsSchema), deleteFile);

// Get a file (with optional ?download=true parameter)
router.get('/:key', validateRequest(fileParamsSchema), getFile);

// List files (with optional ?prefix=folder parameter)
router.get('/', listFiles);

export default router; 