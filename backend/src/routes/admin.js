import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  approveReport,
  rejectReport,
  blacklistIdentifier,
  banUser,
  unbanUser,
  getAdminStats,
  runScrapers,
  getScraperStatus,
  getScraperLogs
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

router.post('/reports/:reportId/approve', approveReport);
router.post('/reports/:reportId/reject', rejectReport);
router.post('/identifiers/:identifierId/blacklist', blacklistIdentifier);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);
router.get('/stats', getAdminStats);
router.post('/scrapers/run', runScrapers);
router.get('/scrapers/status', getScraperStatus);
router.get('/scrapers/logs', getScraperLogs);

export default router;
