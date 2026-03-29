const xlsx = require('xlsx');
const path = require('path');

const parseSheet = (filename) => {
  const filePath = path.join(__dirname, 'data', filename);
  console.log(`\nReading ${filename}...`);
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Headers from ${filename}:`, data[0]);
    if (data.length > 1) {
        console.log(`Row 1 from ${filename}:`, data[1]);
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
  }
};

parseSheet('AlgoPrep\'s 151 Problems Sheet.xlsx');
parseSheet('DSA for PLACEMENTS.xlsx');
