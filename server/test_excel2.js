import { getRandomProblem } from './utils/excelParser.js';

for (let i = 0; i < 5; i++) {
  const p = getRandomProblem();
  console.log(`Problem ${i+1}:`, p.title, p.url);
}
