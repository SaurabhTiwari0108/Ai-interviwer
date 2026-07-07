import { generateQuestionsForRound } from './services/ai.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const questions = await generateQuestionsForRound(1, "Test User", ["JS", "React"], [], "Resume Text");
    console.log("Returned questions:", JSON.stringify(questions, null, 2));
    if (!Array.isArray(questions)) {
       console.log("NOT AN ARRAY!");
    } else {
       console.log("IS AN ARRAY!");
    }
  } catch (e) {
    console.error("Test threw error:", e);
  }
}
main();
