/**
 * Chat Controller
 * Handle chat/messaging API requests
 */

import type { Request, Response } from 'express';
import * as chatService from '../services/chat.service.js';

/**
 * Send a message
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, message } = req.body;
    const userId = (req as any).user?.uid;
    const userName = (req as any).user?.displayName || 'Unknown';
    const userRole = (req as any).user?.role || 'viewer';

    if (!recipientId || !message) {
      res.status(400).json({ error: 'Recipient ID and message are required' });
      return;
    }

    // Get sender info from Firestore for accurate data
    const userDoc = await chatService.getAllUsers(userId);
    const sender = userDoc.find((u) => u.uid === userId) || { displayName: userName };

    const chatMessage = await chatService.sendMessage(
      userId,
      sender.displayName || userName,
      userRole,
      recipientId,
      message
    );

    res.json(chatMessage);
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};

/**
 * Get messages with a specific user
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.uid;

    const messages = await chatService.getMessages(currentUserId, userId);

    // Mark messages as read
    await chatService.markAsRead(currentUserId, userId);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * Get all conversations
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;

    const conversations = await chatService.getConversations(userId);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Delete a conversation (all messages between current user and partner)
 */
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.uid;
    await chatService.deleteConversation(currentUserId, userId);
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

/**
 * Get all users (for starting new conversations)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.uid;

    const users = await chatService.getAllUsers(currentUserId);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};
