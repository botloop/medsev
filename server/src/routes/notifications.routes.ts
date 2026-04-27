/**
 * Notifications Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getNotifications, sendNeuroNotification, sendMedicalCheckupNotification } from '../controllers/notifications.controller.js';

const router = Router();

router.use(authMiddleware);

// GET /api/notifications
router.get('/', getNotifications);

// POST /api/notifications/neuro-schedule — send neuro exam email to personnel
router.post('/neuro-schedule', sendNeuroNotification);

// POST /api/notifications/medical-checkup — auto-reply to viewer + notify admin
router.post('/medical-checkup', sendMedicalCheckupNotification);

export default router;
