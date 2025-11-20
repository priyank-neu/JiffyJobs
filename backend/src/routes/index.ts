import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import uploadRoutes from './upload.routes';
import discoveryRoutes from './discovery.routes';
import bidRoutes from './bid.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
 
const router = Router();
 
// Mount routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/discover', discoveryRoutes);
router.use('/bids', bidRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
 
// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
 
export default router;