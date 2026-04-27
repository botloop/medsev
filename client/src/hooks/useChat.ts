/**
 * Chat Hook
 * Real-time chat using Firestore onSnapshot for instant message delivery
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import api from '../services/api';
import type { ChatMessage } from '@shared/types/chat.types';

interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  linkedPersonnelId?: string | null;
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Keep merged message refs for real-time listener
  const msgs1Ref = useRef<ChatMessage[]>([]);
  const msgs2Ref = useRef<ChatMessage[]>([]);

  const mergeAndSet = useCallback(() => {
    const merged = [...msgs1Ref.current, ...msgs2Ref.current].sort(
      (a, b) => new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime()
    );
    setMessages(merged);
  }, []);

  // Fetch all conversations (REST — computed server-side)
  const fetchConversations = useCallback(async () => {
    try {
      const response: Conversation[] = await api.get('/chat/conversations');
      setConversations(response);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, []);

  // Fetch messages once (used on first open to get read-marks etc.)
  const fetchMessages = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      setSelectedUserId(userId);
      await fetchConversations();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchConversations]);

  // Fetch all users (for starting new conversations)
  const fetchUsers = useCallback(async () => {
    try {
      const response: User[] = await api.get('/chat/users');
      setUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  // Send a message
  const sendMessage = async (recipientId: string, message: string) => {
    setSending(true);
    try {
      const response: ChatMessage = await api.post('/chat/send', { recipientId, message });
      // Firestore listener will pick up the new message automatically
      await fetchConversations();
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  // ── Real-time Firestore listener for messages ──────────────────────────────
  useEffect(() => {
    if (!selectedUserId) return;

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    msgs1Ref.current = [];
    msgs2Ref.current = [];
    setMessages([]);

    // Messages I sent to the selected user
    const q1 = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUserId),
      where('recipientId', '==', selectedUserId)
    );

    // Messages I received from the selected user
    const q2 = query(
      collection(db, 'messages'),
      where('senderId', '==', selectedUserId),
      where('recipientId', '==', currentUserId)
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      msgs1Ref.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      mergeAndSet();
      // Mark as read when new messages arrive
      fetchConversations();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      msgs2Ref.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      mergeAndSet();
      fetchConversations();
    });

    return () => { unsub1(); unsub2(); };
  }, [selectedUserId, mergeAndSet, fetchConversations]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchConversations(), fetchUsers()])
      .finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    conversations,
    messages,
    users,
    selectedUserId,
    loading,
    initialLoading,
    sending,
    fetchConversations,
    fetchMessages,
    fetchUsers,
    sendMessage,
    setSelectedUserId,
  };
};
