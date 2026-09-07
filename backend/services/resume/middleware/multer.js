/**
 * @file multer.js (Resume Service - Middleware)
 * @description Configures Multer disk storage and file filter for secure PDF resume uploads.
 * Restricts uploads to PDF MIME type with a 20MB upper boundary.
 */

import fs from "fs";
import multer from "multer";

const uploadPath = "./uploads";

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure storage with timestamped filenames to prevent overwriting
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter restricting accepted files to application/pdf
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB max file size
    }
});
