import { Router } from 'express';
import * as bidController from '../controllers/bid.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All bid routes require authentication
router.use(authenticate);

// Bid management routes
router.post('/', bidController.placeBid);
router.patch('/:bidId/withdraw', bidController.withdrawBid);
router.post('/:bidId/accept', bidController.acceptBid);

// Get helper's bids
router.get('/my-bids', bidController.getHelperBids);

// Task-specific bid routes
router.get('/tasks/:taskId/bids', bidController.getTaskBids);
router.get('/tasks/:taskId/contract', bidController.getTaskContract);

// Contract management routes
router.get('/contracts/:contractId', bidController.getContract);
router.put('/contracts/:contractId', bidController.updateContract);
router.delete('/contracts/:contractId', bidController.deactivateContract);

export default router;
