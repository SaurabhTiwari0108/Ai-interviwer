import express from 'express';
import multer from 'multer';
import { uploadResume } from '../controllers/resume.controller.js';

const router = express.Router();

import { protect } from '../middleware/auth.middleware.js';

// Multer storage configuration for parsing PDFs
const upload = multer({ dest: 'uploads/' });

router.post('/upload-resume', protect, upload.single('resume'), uploadResume);

export default router;
