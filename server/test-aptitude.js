import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const aptPath = path.join(__dirname, 'data', "Aptitude_230_Questions.xlsx");
  const aptWb = xlsx.readFile(aptPath);
  const aptSheet = aptWb.Sheets[aptWb.SheetNames[0]];
  const aptData = xlsx.utils.sheet_to_json(aptSheet, { header: 1 });
  console.log("First 5 rows:");
  console.log(aptData.slice(0, 5));
} catch(e) {
  console.error("Error:", e);
}
