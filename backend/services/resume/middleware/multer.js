/**
 * @file multer.js (Resume Service - Middleware)
 * @description Configures Multer disk storage and file filter for secure PDF resume uploads.
 * Restricts uploads to PDF MIME type with a 20MB upper boundary.
 */

import fs from "fs";
import multer from "multer";
import crypto from "crypto";
import path from "path";

const uploadPath = "./uploads";

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure storage with cryptographically random UUID filenames to prevent path traversal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomUUID();
        cb(null, `resume-${uniqueSuffix}.pdf`);
    }
});

// File filter restricting accepted files to application/pdf with .pdf extension
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimePdf = file.mimetype === "application/pdf";
    const isExtPdf = ext === ".pdf";

    if (isMimePdf && isExtPdf) {
        cb(null, true);
    } else {
        cb(new Error("Only genuine PDF files (.pdf) are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max file size
        files: 1
    }
});

/**
 * Validates that an uploaded file starts with the official PDF magic byte signature (%PDF-).
 * 
 * @param {string} filePath - Path to file on disk
 * @returns {boolean} True if magic bytes match PDF specification
 */
export const verifyPdfMagicBytes = (filePath) => {
    try {
        const buffer = Buffer.alloc(5);
        const fd = fs.openSync(filePath, "r");
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        // %PDF- in ASCII is 0x25, 0x50, 0x44, 0x46, 0x2d
        return buffer.toString("utf8") === "%PDF-";
    } catch (err) {
        return false;
    }
};
