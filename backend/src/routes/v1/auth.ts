import { Router } from 'express';
import { 
  login, 
  signup, 
  logout, 
  getCurrentUser, 
  refreshAccessToken,
  requestPasswordReset,
  resetPassword
} from "../../controllers/authController";
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema, signupSchema } from '../../schemas/auth.schemas';
import { passwordResetRequestSchema, passwordResetSchema } from '../../schemas/auth.schemas';

const router = Router();

// Authentication endpoints
router.post('/login', validateRequest(loginSchema), login);
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/logout', authMiddleware, logout);
router.get('/current-user', authMiddleware, getCurrentUser);

// Token refresh endpoint
router.post('/refresh', refreshAccessToken);

// Password reset endpoints
router.post('/reset-password/request', validateRequest(passwordResetRequestSchema), requestPasswordReset);
router.post('/reset-password', validateRequest(passwordResetSchema), resetPassword);

export default router;

