import mongoose from 'mongoose';
import 'dotenv/config';
import Interview from './models/Interview.js';
import User from './models/User.js';
import { generateQuestionsForRound } from './services/gemini.service.js';

async function testStart() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  if(!user) return console.log("no user");

  try {
    const raw = await generateQuestionsForRound(1, user.name, user.skills, [], user.resumeText);
    console.log("ROUND 1 RAW:", JSON.stringify(raw, null, 2));
    
    // Test other rounds
    const r2 = await generateQuestionsForRound(2, user.name, user.skills, [], user.resumeText);
    console.log("ROUND 2 OK");
  } catch (e) {
    console.error("Test Error:", e);
  }
  process.exit();
}
testStart();
