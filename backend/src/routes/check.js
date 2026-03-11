import express from 'express';
import { checkIdentifier, getReportsForIdentifier, lookupBIN } from '../controllers/checkController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/check', authMiddleware, checkIdentifier);
router.get('/reports/:value', getReportsForIdentifier);
router.post('/bin-lookup', lookupBIN);  // Public BIN lookup endpoint

export default router;
