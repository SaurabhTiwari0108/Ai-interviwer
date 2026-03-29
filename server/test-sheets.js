import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const algoPath = path.join(__dirname, 'data', "LeetCode_Links.xlsx");
  const algoWb = xlsx.readFile(algoPath);
  const algoSheet = algoWb.Sheets[algoWb.SheetNames[0]];
  const algoData = xlsx.utils.sheet_to_json(algoSheet, { header: 1 });
  console.log("First 10 rows:");
  console.log(algoData.slice(0, 10));
} catch(e) {
  console.error("Error:", e);
}
