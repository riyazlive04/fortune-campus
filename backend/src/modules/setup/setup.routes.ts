import { Router } from 'express';
import { getSetupStatus, initializeSetup } from './setup.controller';

const router = Router();

/**
 * Setup routes - NO AUTHENTICATION REQUIRED
 * These routes are only accessible when no users exist in the database
 */

// Check if initial setup is required
router.get('/status', getSetupStatus);

// Create the first admin/CEO user
router.post('/initialize', initializeSetup);

export default router;
