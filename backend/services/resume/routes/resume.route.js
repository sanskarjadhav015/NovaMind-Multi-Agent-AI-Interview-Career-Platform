/**
 * @file resume.route.js (Resume Service)
 * @description Express routes for resume PDF file upload and ATS evaluation retrieval.
 */

import express from "express";
import { upload } from "../middleware/multer.js";
import { getResume, uploadResume } from "../controllers/resume.controller.js";

const resumeRouter = express.Router();

/**
 * Middleware handling file upload errors gracefully.
 */
const handleUpload = (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
        if (err) {
            console.error("Multer file upload error:", err);
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed"
            });
        }
        next();
    });
};

// Upload PDF resume for ATS parsing and scoring
resumeRouter.post("/upload", handleUpload, uploadResume);

// Retrieve candidate's active parsed resume profile
resumeRouter.get("/get-resume", getResume);

export default resumeRouter;