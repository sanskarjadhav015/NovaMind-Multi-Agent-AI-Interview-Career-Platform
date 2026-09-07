/**
 * @file pdf.js (Resume Service)
 * @description Extracts plain text contents from uploaded PDF files using `pdf-parse`.
 */

import fs from "fs";
import { PDFParse } from "pdf-parse";

/**
 * Reads a PDF file from the local disk and extracts textual content.
 * @param {string} filePath - Absolute or relative path to PDF file
 * @returns {Promise<string>} Extracted raw text
 */
const extractText = async (filePath) => {
    const buffer = fs.readFileSync(filePath);

    const pdf = new PDFParse({
        data: buffer
    });

    const result = await pdf.getText();
    return result.text;
};

export default extractText;