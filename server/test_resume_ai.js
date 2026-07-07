import fs from 'fs';
import { extractTextFromPDF } from './services/pdf.service.js';
import { extractProfileFromResume } from './services/ai.service.js';
import 'dotenv/config';

async function test() {
  try {
    // Generate a dummy pdf or just use a raw string for testing Gemini
    const dummyText = "Jane Doe. Python, React. github.com/janedoe";
    console.log("Testing AI Extraction...");
    const data = await extractProfileFromResume(dummyText);
    console.log("Success:", data);
  } catch (e) {
    console.error("Error in AI:", e);
  }
}

test();
