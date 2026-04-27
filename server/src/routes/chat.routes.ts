/**
 * Chat Routes
 * API routes for messaging
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/chat/send - Send a message
router.post('/send', chatController.sendMessage);

// GET /api/chat/conversations - Get all conversations
router.get('/conversations', chatController.getConversations);

// GET /api/chat/messages/:userId - Get messages with specific user
router.get('/messages/:userId', chatController.getMessages);

// GET /api/chat/users - Get all users
router.get('/users', chatController.getAllUsers);

// DELETE /api/chat/conversations/:userId - Delete conversation with a user
router.delete('/conversations/:userId', chatController.deleteConversation);

export default router;
