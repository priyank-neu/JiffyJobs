import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get presigned URL for upload
router.post('/presigned-url', uploadController.getPresignedUrl);

export default router;