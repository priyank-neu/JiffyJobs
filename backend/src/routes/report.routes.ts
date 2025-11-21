import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Public routes (any authenticated user can report)
router.post('/', reportController.createReport);

// Admin-only routes
router.get('/', requireAdmin, reportController.getReports);
router.get('/metrics', requireAdmin, reportController.getReportMetrics);
router.get('/:type/:reportId', requireAdmin, reportController.getReportById);
router.patch('/:type/:reportId/resolve', requireAdmin, reportController.resolveReport);

export default router;

