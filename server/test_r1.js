import 'dotenv/config';
import { generateQuestionsForRound } from './services/ai.service.js';

async function testOptions() {
  try {
    const rawQuestions = await generateQuestionsForRound(1, 'Test User', ['React', 'Node'], [], 'Resume text');
    console.log("ROUND 1 OUTPUT:");
    console.log(JSON.stringify(rawQuestions, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testOptions();
