import express from 'express';
import { submitReport, getTrendingScams, getUserReports } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/report', authMiddleware, submitReport);
router.get('/trending', getTrendingScams);
router.get('/my-reports', authMiddleware, getUserReports);

export default router;
