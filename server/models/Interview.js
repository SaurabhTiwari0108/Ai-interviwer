import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: String,
  category: String,
  difficulty: String,
  leetcodeUrl: String, // Tracks the source of the problem
  options: [String], // for multiple choice aptitude
  correctAnswer: String, // for aptitude
  testCases: [{ input: String, expectedOutput: String, passed: Boolean }], // for round 1
  codeAnswer: String, // for user's code
  voiceAnswer: String, // for user's verbal transcript
  answer: String, // user's generic answer
  followUpQuestion: String, // AI follow-up for Round 3
  followUpAnswer: String, // user's answer to follow-up
  feedback: {
    technicalScore: Number,
    clarityScore: Number,
    improvementSuggestions: String
  }
});

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  questions: [questionSchema],
  score: { type: Number, default: 0 },
  startTime: Date,
  endTime: Date
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  currentRound: {
    type: Number,
    default: 1
  },
  rounds: [roundSchema],
  overallScore: {
    type: Number,
    default: 0
  },
  finalFeedback: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Interview', interviewSchema);
