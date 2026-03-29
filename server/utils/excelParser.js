import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getRandomProblem = () => {
    const problems = [];
  
    try {
      const algoPath = path.join(__dirname, '..', 'data', "LeetCode_Links.xlsx");
      const algoWb = xlsx.readFile(algoPath);
      const algoSheet = algoWb.Sheets[algoWb.SheetNames[0]];
      const algoData = xlsx.utils.sheet_to_json(algoSheet, { header: 1 });
      
      algoData.forEach(row => {
          // Columns: [0]=S.No, [1]=Problem Name, [2]=LeetCode Link
          if (row && row.length >= 3 && typeof row[1] === 'string' && row[1].length > 1 && row[2]) {
              const url = String(row[2]).trim();
              if (url.startsWith('http')) {
                  problems.push({ title: row[1].trim(), url });
              }
          }
      });

      if (problems.length === 0) {
        return { title: "Two Sum", url: "https://leetcode.com/problems/two-sum/" }; // Fallback
      }

      const randomIndex = Math.floor(Math.random() * problems.length);
      return problems[randomIndex];

    } catch (error) {
      console.error(`Error processing LeetCode_Links sheet:`, error.message);
      return { title: "Two Sum", url: "https://leetcode.com/problems/two-sum/" }; // Fallback
    }
};

export const getRandomAptitudeProblems = (count = 5) => {
    const problems = [];
  
    try {
      const aptPath = path.join(__dirname, '..', 'data', "Aptitude_230_Questions.xlsx");
      const aptWb = xlsx.readFile(aptPath);
      const aptSheet = aptWb.Sheets[aptWb.SheetNames[0]];
      const aptData = xlsx.utils.sheet_to_json(aptSheet, { header: 1 });
      
      aptData.forEach(row => {
          // Columns: [0]=S.No, [1]=Topic, [2]=Difficulty, [3]=Question
          if (row && row.length >= 4 && typeof row[3] === 'string' && row[3].length > 5 && row[3].trim() !== 'Question') {
              problems.push({ 
                  topic: row[1] || 'Aptitude',
                  difficulty: row[2] || 'Medium',
                  question: row[3].trim()
              });
          }
      });

      if (problems.length === 0) return [];

      // Fisher-Yates shuffle
      for (let i = problems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [problems[i], problems[j]] = [problems[j], problems[i]];
      }

      return problems.slice(0, count);

    } catch (error) {
      console.error(`Error processing Aptitude sheet:`, error.message);
      return []; // Fallback
    }
};
