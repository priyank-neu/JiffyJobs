import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Get own profile
router.get('/me', profileController.getMyProfile);

// Update own profile
router.patch('/me', profileController.updateProfile);

// Get public profile
router.get('/:userId', profileController.getPublicProfile);

// Set neighborhood
router.post('/neighborhood', profileController.setNeighborhood);

// Verify neighborhood
router.post('/neighborhood/verify/geo', profileController.verifyNeighborhoodByGeo);
router.post('/neighborhood/verify/otp/generate', profileController.generateNeighborhoodOTP);
router.post('/neighborhood/verify/otp', profileController.verifyNeighborhoodByOTP);

// Manage skills
router.get('/skills', profileController.getAllSkills);
router.post('/skills', profileController.addSkill);
router.delete('/skills/:skillId', profileController.removeSkill);

export default router;

