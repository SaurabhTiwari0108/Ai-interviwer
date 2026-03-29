import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { generateQuestionsForRound, evaluateAnswer, evaluateCode } from '../services/gemini.service.js';
import { fetchUserRepositories } from '../services/github.service.js';
import { verifySubmission } from '../utils/leetcodeFetcher.js';
import { runTestCases } from '../utils/testRunner.js';

// Initialize a new 5-round interview
export const initInterview = async (req, res) => {
  try {
    const userId = req.user.id; // From protect middleware
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rounds = [
      { roundNumber: 1, title: 'Data Structures & Algorithms' },
      { roundNumber: 2, title: 'Aptitude & Logic' },
      { roundNumber: 3, title: 'Interactive Technical (Voice)' },
      { roundNumber: 4, title: 'General & Behavioral' },
      { roundNumber: 5, title: 'Project Deep Dive' }
    ];

    const interview = new Interview({
      userId: user._id,
      rounds: rounds,
      status: 'pending',
      currentRound: 1
    });

    await interview.save();

    res.status(201).json({
      interviewId: interview._id,
      message: 'Interview initialized with 5 rounds.',
      rounds: interview.rounds
    });
  } catch (error) {
    console.error('Error initializing interview:', error);
    res.status(500).json({ error: 'Failed to initialize interview' });
  }
};

// Start a specific round and generate its questions dynamically
export const startRound = async (req, res) => {
  try {
    const { interviewId, roundNumber } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const round = interview.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ error: 'Round not found' });

    if (round.status === 'completed') {
      return res.status(400).json({ error: 'Round already completed' });
    }

    // Only generate questions if they haven't been generated yet
    if (!round.questions || round.questions.length === 0) {
      const user = await User.findById(userId);
      let questions = [];

      let repos = [];
      if (roundNumber == 5 && user.githubUsername) {
        repos = await fetchUserRepositories(user.githubUsername);
      }

      // Generate context-aware questions
      const rawQuestions = await generateQuestionsForRound(parseInt(roundNumber), user.name, user.skills, repos, user.resumeText);
      
      questions = rawQuestions.map((q) => ({
        ...q
      }));
      
      round.questions = questions;
    }

    round.status = 'in-progress';
    if (!round.startTime) round.startTime = new Date();
    
    interview.currentRound = parseInt(roundNumber);
    interview.status = 'in-progress';
    
    await interview.save();

    res.status(200).json({
      message: `Round ${roundNumber} started`,
      round
    });
  } catch (error) {
    console.error('Error starting round:', error);
    res.status(500).json({ error: 'Failed to start interview round' });
  }
};

// Submit an answer for a specific question in a round
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, roundNumber } = req.params;
    const { questionId, answerText } = req.body;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const round = interview.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ error: 'Round not found' });

    // Validate Aptitude (Round 2) vs Open Ended (Rounds 1,3,4,5)
    const questionObj = round.questions.find(q => q._id.toString() === questionId || q._id === questionId);
    if (!questionObj) return res.status(404).json({ error: 'Question not found' });

    let evaluation = { technicalScore: 0, clarityScore: 0, improvementSuggestions: '' };
    const { codeAnswer, voiceAnswer } = req.body;

    if (parseInt(roundNumber) === 1) {
      // AI Code Evaluation (Fallback, frontend should ideally use testCases)
      evaluation = await evaluateCode(questionObj.question, codeAnswer || answerText, req.body.language || 'javascript');
      questionObj.codeAnswer = codeAnswer || answerText;
    } else if (parseInt(roundNumber) === 2) {
      // Aptitude exact match evaluation
      const isCorrect = (answerText || '').trim().toLowerCase() === (questionObj.correctAnswer || '').trim().toLowerCase();
      evaluation = {
        technicalScore: isCorrect ? 10 : 0,
        clarityScore: isCorrect ? 10 : 0,
        improvementSuggestions: isCorrect ? 'Correct logic applied.' : `Incorrect. The correct answer is: ${questionObj.correctAnswer}`
      };
    } else if (parseInt(roundNumber) === 3) {
      const { evaluateCodeAndExplanation, evaluateFollowUpAnswer } = await import('../services/gemini.service.js');
      if (!questionObj.followUpQuestion) {
        evaluation = await evaluateCodeAndExplanation(questionObj.question, codeAnswer, voiceAnswer || answerText);
        questionObj.codeAnswer = codeAnswer;
        questionObj.voiceAnswer = voiceAnswer || answerText;
        questionObj.followUpQuestion = evaluation.followUpQuestion;
        evaluation.isFollowUp = true;
      } else {
        evaluation = await evaluateFollowUpAnswer(questionObj.question, questionObj.codeAnswer, questionObj.followUpQuestion, voiceAnswer || answerText);
        questionObj.followUpAnswer = voiceAnswer || answerText;
        if (questionObj.feedback && questionObj.feedback.technicalScore) {
          evaluation.technicalScore = (questionObj.feedback.technicalScore + evaluation.technicalScore) / 2;
          evaluation.clarityScore = (questionObj.feedback.clarityScore + evaluation.clarityScore) / 2;
        }
      }
    } else if ([4, 5].includes(parseInt(roundNumber))) {
       const userDoc = await User.findById(userId);
       const { evaluateContextualAnswer } = await import('../services/gemini.service.js');
       
       let contextText = userDoc.resumeText || '';
       if (parseInt(roundNumber) === 5) {
          const repos = await fetchUserRepositories(userDoc.githubUsername);
          contextText += `\n\nGitHub Projects context: ${JSON.stringify(repos)}`;
       }
       
       evaluation = await evaluateContextualAnswer(questionObj.question, voiceAnswer || answerText, contextText);
       questionObj.voiceAnswer = voiceAnswer || answerText;
    } else {
      evaluation = await evaluateAnswer(questionObj.question, answerText);
    }

    questionObj.answer = answerText || voiceAnswer || codeAnswer; // Main Fallback mapping
    questionObj.feedback = evaluation;

    await interview.save();

    res.status(200).json({
      message: 'Answer submitted',
      feedback: evaluation
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Run test cases for Round 1
export const runQuestionTestCases = async (req, res) => {
  try {
    const { interviewId, roundNumber } = req.params;
    const { questionId, codeAnswer } = req.body;
    const userId = req.user.id;

    if (parseInt(roundNumber) !== 1) {
      return res.status(400).json({ error: 'Test cases runner is only available in Round 1' });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const round = interview.rounds.find(r => r.roundNumber === 1);
    if (!round) return res.status(404).json({ error: 'Round not found' });

    const questionObj = round.questions.find(q => q._id.toString() === questionId || q._id === questionId);
    if (!questionObj) return res.status(404).json({ error: 'Question not found' });

    if (!questionObj.testCases || questionObj.testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases available for this question' });
    }

    // Execute Javascript code locally
    const results = runTestCases(codeAnswer, questionObj.testCases);
    
    // Calculate passing overall
    const allPassed = results.every(r => r.passed);
    
    res.status(200).json({
      message: allPassed ? 'All test cases passed' : 'Some test cases failed',
      results,
      allPassed
    });

  } catch (error) {
    console.error('Error running test cases:', error);
    res.status(500).json({ error: 'Failed to run test cases' });
  }
};

// Complete a specific round
export const completeRound = async (req, res) => {
  try {
    const { interviewId, roundNumber } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const round = interview.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ error: 'Round not found' });

    round.endTime = new Date();
    round.status = 'completed';

    // Calculate Round Score
    let totalScore = 0;
    let answeredQuestions = 0;

    round.questions.forEach(q => {
      if (q.feedback && q.feedback.technicalScore !== undefined) {
        totalScore += (q.feedback.technicalScore + q.feedback.clarityScore) / 2;
        answeredQuestions++;
      }
    });

    round.score = answeredQuestions > 0 ? (totalScore / answeredQuestions).toFixed(1) : 0;

    // Check if entire interview is complete
    const allCompleted = interview.rounds.every(r => r.status === 'completed');
    if (allCompleted) {
      interview.status = 'completed';
      const grandTotal = interview.rounds.reduce((acc, r) => acc + (parseFloat(r.score) || 0), 0);
      interview.overallScore = (grandTotal / 5).toFixed(1);
    } else {
      // Advance to next available round
      interview.currentRound = parseInt(roundNumber) < 5 ? parseInt(roundNumber) + 1 : 5;
    }

    await interview.save();

    res.status(200).json({
      message: `Round ${roundNumber} completed`,
      roundScore: round.score,
      interviewStatus: interview.status
    });
  } catch (error) {
    console.error('Error completing round:', error);
    res.status(500).json({ error: 'Failed to complete round' });
  }
};

export const getInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.status(200).json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interview status' });
  }
};

// Verify LeetCode submission for a specific question
export const verifyLeetcode = async (req, res) => {
  try {
    const { interviewId, roundNumber } = req.params;
    const { questionId } = req.body;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const user = await User.findById(userId);
    if (!user || !user.leetcodeUsername) {
      return res.status(400).json({ error: 'LeetCode username not found for user. Cannot verify.' });
    }

    const round = interview.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ error: 'Round not found' });

    const questionObj = round.questions.find(q => q._id.toString() === questionId || q._id === questionId);
    if (!questionObj || !questionObj.leetcodeSlug) return res.status(404).json({ error: 'Question not found or is not a LeetCode problem' });

    // Verify submission against GraphQL API
    const isAccepted = await verifySubmission(user.leetcodeUsername, questionObj.leetcodeSlug, new Date(round.startTime));
    
    if (isAccepted) {
       // Give marks
       questionObj.feedback = {
         technicalScore: 10,
         clarityScore: 10,
         improvementSuggestions: 'Perfect! Solution accepted on LeetCode.'
       };
       questionObj.answer = 'Accepted Solution';
       await interview.save();
       res.status(200).json({ verified: true, message: 'Solution accepted!', feedback: questionObj.feedback });
    } else {
       res.status(200).json({ verified: false, message: 'No recent accepted submission found for this problem.' });
    }

  } catch (error) {
    console.error('Error verifying leetcode submission:', error);
    res.status(500).json({ error: 'Failed to verify submission' });
  }
};

// Generate or fetch final feedback
export const getFinalFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interview.finalFeedback) {
       return res.status(200).json(interview.finalFeedback);
    }

    const { generateFinalFeedback } = await import('../services/gemini.service.js');
    const feedback = await generateFinalFeedback(interview);

    interview.finalFeedback = feedback;
    await interview.save();

    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error getting final feedback:', error);
    res.status(500).json({ error: 'Failed to get final feedback' });
  }
};
