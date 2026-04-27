/**
 * Personnel Requests Routes
 * Viewer profile submission and admin review endpoints
 */

import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/personnelRequests.controller.js';

const router = Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
  },
});

router.get('/',                               requireRole('admin'), controller.getAll);
router.get('/mine',                           controller.getMine);
router.get('/mine/personnel',                 controller.getMinePersonnel);
router.post('/mine/upload/step3',             upload.array('files', 10), controller.uploadStep3Files);
router.delete('/mine/upload/step3/:fileName', controller.deleteStep3File);
router.post('/',                              controller.submit);
router.patch('/:id/approve',                  requireRole('admin'), controller.approve);
router.patch('/:id/reject',                   requireRole('admin'), controller.reject);

export default router;
