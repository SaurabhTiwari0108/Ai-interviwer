import express from 'express';
import { 
  initInterview, 
  startRound, 
  submitAnswer, 
  completeRound,
  getInterviewStatus,
  runQuestionTestCases,
  getFinalFeedback
} from '../controllers/interview.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize the 5-round interview
router.post('/init', protect, initInterview);

// Get the current interview status
router.get('/:interviewId', protect, getInterviewStatus);

// Start a specific round (generates questions)
router.post('/:interviewId/round/:roundNumber/start', protect, startRound);

// Submit an answer for a specific question in a round
router.post('/:interviewId/round/:roundNumber/submit', protect, submitAnswer);

// Run test cases for a specific question (Round 1)
router.post('/:interviewId/round/:roundNumber/run', protect, runQuestionTestCases);

// Complete a specific round
router.put('/:interviewId/round/:roundNumber/complete', protect, completeRound);

// Get final interview feedback
router.get('/:interviewId/feedback', protect, getFinalFeedback);

export default router;
