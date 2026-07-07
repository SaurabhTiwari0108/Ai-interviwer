import mongoose from 'mongoose';
import 'dotenv/config';
import Interview from './models/Interview.js';
import User from './models/User.js';
import { generateQuestionsForRound } from './services/ai.service.js';

async function testStartDB() {
  await mongoose.connect(process.env.MONGO_URI);
  
  try {
    const user = await User.findOne();
    if(!user) return console.log("no user");

    const interview = new Interview({
      userId: user._id,
      rounds: [
        { roundNumber: 1, title: 'DSA' }
      ]
    });
    
    // Force Rate Limit or Fallback
    const rawQuestions = await generateQuestionsForRound(1, user.name, user.skills, [], user.resumeText);
    
    interview.rounds[0].questions = rawQuestions;
    
    await interview.save();
    console.log("DB SAVE SUCCESS");
    
    // Clean up
    await Interview.deleteOne({ _id: interview._id });
  } catch (e) {
    console.error("Test Error:", e);
  }
  process.exit();
}
testStartDB();
