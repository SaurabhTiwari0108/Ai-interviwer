import express from 'express';
import { getUserDashboard } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/dashboard/:userId', protect, getUserDashboard);

export default router;
