import express from 'express';
import {
	checkIdentifier,
	getReportsForIdentifier,
	lookupBIN,
	searchFraudIntelligence
} from '../controllers/checkController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/check', authMiddleware, checkIdentifier);
router.post('/intelligence/search', authMiddleware, searchFraudIntelligence);
router.get('/reports/:value', getReportsForIdentifier);
router.post('/bin-lookup', lookupBIN);  // Public BIN lookup endpoint

export default router;
