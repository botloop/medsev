/**
 * Chat Types
 * For communication between admins and viewers
 */

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'medical' | 'viewer';
  recipientId: string;
  recipientName: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participants: {
    userId: string;
    userName: string;
    userRole: string;
  }[];
  lastMessage?: string;
  lastMessageTime?: Date | string;
  unreadCount: number;
}

export interface CreateMessageDTO {
  recipientId: string;
  message: string;
}
