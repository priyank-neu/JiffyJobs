import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import uploadRoutes from './upload.routes';
import discoveryRoutes from './discovery.routes';
 
const router = Router();
 
// Mount routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/discover', discoveryRoutes);
 
// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
 
export default router;
 