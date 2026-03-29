import mongoose from 'mongoose';
import 'dotenv/config';
import Interview from './models/Interview.js';
import User from './models/User.js';

async function testInit() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  if(!user) return console.log("no user");

  try {
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
    console.log("Success");
  } catch (e) {
    console.error("Mongoose Validation Error:", e);
  }
  process.exit();
}
testInit();
