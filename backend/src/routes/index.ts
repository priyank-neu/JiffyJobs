import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import uploadRoutes from './upload.routes';
import discoveryRoutes from './discovery.routes';
import bidRoutes from './bid.routes';
import paymentRoutes from './payment.routes';
import taskExecutionRoutes from './taskExecution.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import reviewRoutes from './review.routes';
import reportRoutes from './report.routes';
import moderationRoutes from './moderation.routes';
import userRoutes from './user.routes';
import profileRoutes from './profile.routes';
 
const router = Router();
 
// Mount routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/discover', discoveryRoutes);
router.use('/bids', bidRoutes);
router.use('/payments', paymentRoutes);
router.use('/tasks', taskExecutionRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);
router.use('/moderation', moderationRoutes);
router.use('/admin/users', userRoutes);
router.use('/profile', profileRoutes);
 
// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
 
export default router;