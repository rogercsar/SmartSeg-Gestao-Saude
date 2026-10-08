import { Router } from 'express';
import { invokeFunction } from '../controllers/functionController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuth);
router.post('/:name', invokeFunction);

export default router;
