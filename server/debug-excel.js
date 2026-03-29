import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dsaPath = path.join(__dirname, 'data', 'DSA for PLACEMENTS.xlsx');
const dsaWb = xlsx.readFile(dsaPath);
const dsaSheet = dsaWb.Sheets[dsaWb.SheetNames[0]];
const dsaData = xlsx.utils.sheet_to_json(dsaSheet, { header: 1 });

console.log('DSA cols:');
for(let i=0; i<5; i++) console.log(dsaData[i]);

const algoPath = path.join(__dirname, 'data', "AlgoPrep's 151 Problems Sheet.xlsx");
const algoWb = xlsx.readFile(algoPath);
const algoSheet = algoWb.Sheets[algoWb.SheetNames[0]];
const algoData = xlsx.utils.sheet_to_json(algoSheet, { header: 1 });

console.log('AlgoPrep cols:');
for(let i=0; i<5; i++) console.log(algoData[i]);
