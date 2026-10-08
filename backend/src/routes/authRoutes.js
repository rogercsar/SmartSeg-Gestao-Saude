import { Router } from 'express';
import {
  login,
  register,
  verifyOtp,
  resendOtp,
  resetPasswordRequest,
  resetPassword,
  me,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);

export default router;
