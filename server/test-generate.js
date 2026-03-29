import dotenv from 'dotenv';
import { generateQuestionsForRound } from './services/gemini.service.js';

dotenv.config();

async function run() {
    try {
        console.log("Testing generation for Round 1...");
        const questions = await generateQuestionsForRound(1, "Test User", ["React", "Node"]);
        console.log(JSON.stringify(questions, null, 2));
    } catch (e) {
        console.error("Error during generation:", e);
    }
}

run();
