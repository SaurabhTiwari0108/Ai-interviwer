import 'dotenv/config';
import { generateQuestionsForRound } from './services/ai.service.js';

async function testOptions() {
  try {
    const rawQuestions = await generateQuestionsForRound(2, 'Test User', ['React', 'Node'], [], 'Resume text');
    console.log(JSON.stringify(rawQuestions, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testOptions();
