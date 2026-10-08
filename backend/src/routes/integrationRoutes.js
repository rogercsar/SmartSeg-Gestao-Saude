import express from 'express';
import { uploadPrivateFile, createFileSignedUrl, sendEmail } from '../controllers/integrationController.js';

const router = express.Router();

router.post('/upload', uploadPrivateFile);
router.post('/signed-url', createFileSignedUrl);
router.post('/send-email', sendEmail);

export default router;
