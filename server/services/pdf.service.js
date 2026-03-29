import pdfParse from 'pdf-parse';
import fs from 'fs';

/**
 * Extracts text from a PDF file
 * @param {String} filePath - Path to the PDF file
 * @returns {Promise<String>} Extracted text
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document');
  }
};
