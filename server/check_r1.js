import mongoose from 'mongoose';
import 'dotenv/config';
import Interview from './models/Interview.js';

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const interviews = await Interview.find().sort({ createdAt: -1 }).limit(1);
  if (!interviews.length) {
    console.log("No interviews found.");
  } else {
    const interview = interviews[0];
    const r1 = interview.rounds.find(r => r.roundNumber === 1);
    if (!r1 || !r1.questions || r1.questions.length === 0) {
      console.log("No Round 1 questions generated.");
    } else {
      console.log("Round 1 Question 1 Keys:", Object.keys(r1.questions[0].toObject()));
      console.log("Round 1 Question 1 Text:", String(r1.questions[0].question).substring(0, 100));
      console.log("Full Object:", JSON.stringify(r1.questions[0], null, 2));
    }
  }
  process.exit(0);
}

checkDB();
