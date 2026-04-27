/**
 * Upload Routes
 * Handle file uploads for medical results
 */

import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as uploadController from '../controllers/upload.controller.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and PDFs
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and PDFs are allowed.'));
    }
  }
});

// Upload medical results for a specific personnel and step (up to 10 files)
router.post(
  '/medical-result/:personnelId/:step',
  authMiddleware,
  upload.array('files', 10),
  uploadController.uploadMedicalResult
);

// Get medical results for a specific personnel and step
router.get(
  '/medical-result/:personnelId/:step',
  authMiddleware,
  uploadController.getMedicalResults
);

// Delete a single medical result file
router.delete(
  '/medical-result/:personnelId/:step/:fileName',
  authMiddleware,
  uploadController.deleteMedicalResult
);

// Delete ALL medical result files for a step
router.delete(
  '/medical-result/:personnelId/:step',
  authMiddleware,
  uploadController.deleteAllMedicalResults
);

export default router;
