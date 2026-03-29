import { generateQuestionsForRound } from './services/gemini.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const q = await generateQuestionsForRound(2, "Test User", ["JS"]);
    console.log(JSON.stringify(q, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
