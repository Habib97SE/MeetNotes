import { Router } from 'express';
import { login, signup, logout, getCurrentUser } from "../../controllers/authController";
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema, signupSchema } from '../../schemas/auth.schemas';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/logout', logout);
router.get('/current-user', authMiddleware, getCurrentUser);

export default router;

