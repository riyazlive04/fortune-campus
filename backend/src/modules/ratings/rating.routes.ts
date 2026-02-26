import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import {
    submitTrainerRating,
    getTrainerAverageRating,
    getMyRatingForTrainer,
    getAllTrainersAverageRatings,
    getPerformanceMetrics,
    getAllPerformanceMetrics,
} from './rating.controller';

const router = Router();


// All rating routes require authentication
router.use(authenticateToken);

// Student submits / updates their rating for a trainer (current month only)
router.post('/trainer', submitTrainerRating);

// Get the current student's rating for a specific trainer this month
router.get('/trainer/:trainerId/my-rating', getMyRatingForTrainer);

// Get average rating for a specific trainer (CEO / Trainer access)
router.get('/trainer/:trainerId/average', getTrainerAverageRating);

// Get average ratings for ALL trainers in one call (used by Incentives page)
router.get('/trainers/averages', getAllTrainersAverageRatings);

// Get weighted performance metrics (30/70 model) for a specific trainer
router.get('/trainer/:trainerId/performance-metrics', getPerformanceMetrics);

// Get weighted performance metrics (30/70 model) for ALL trainers
router.get('/trainers/performance-metrics', getAllPerformanceMetrics);

export default router;
