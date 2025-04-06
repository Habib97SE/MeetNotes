import { Router } from 'express';
import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile, 
  updateProfilePicture,
  changeEmail,
  changePassword,
  getAllUsers
} from '../../controllers/userController';
import { validateRequest } from '../../middlewares/validateRequest';
import { 
  updateProfileSchema, 
  changeEmailSchema, 
  changePasswordSchema 
} from '../../schemas/user.schemas';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { uploadMiddleware } from '../../controllers/fileController';

const router = Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Current user profile
router.get('/me', getCurrentUserProfile);
router.put('/me', validateRequest(updateProfileSchema), updateCurrentUserProfile);
router.put('/me/profile-picture', uploadMiddleware, updateProfilePicture);

// Account settings
router.put('/me/email', validateRequest(changeEmailSchema), changeEmail);
router.put('/me/password', validateRequest(changePasswordSchema), changePassword);

// Admin routes
router.get('/', getAllUsers); // In a real app, add admin role check middleware

export default router; 