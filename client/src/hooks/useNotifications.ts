/**
 * useNotifications Hook
 * Polls the notifications endpoint every 30 seconds
 */

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export interface MessagePreview {
  id: string;
  senderName: string;
  preview: string;
  timestamp: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  description: string;
  userName: string;
  timestamp: string;
}

export interface PendingReview {
  id: string;
  userName: string;
  submittedAt: string;
}

export interface MyProfileRequest {
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

export interface NotificationData {
  unreadMessages: number;
  messagePreviews: MessagePreview[];
  recentActivity: ActivityItem[];
  pendingReviews: number;
  pendingReviewList: PendingReview[];
  myProfileRequest: MyProfileRequest | null;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export const useNotifications = () => {
  const [data, setData] = useState<NotificationData>({
    unreadMessages: 0,
    messagePreviews: [],
    recentActivity: [],
    pendingReviews: 0,
    pendingReviewList: [],
    myProfileRequest: null,
  });
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const result = await api.get('/notifications') as NotificationData;
      setData(result);
    } catch {
      // Silently fail — don't spam the user with notification errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { ...data, loading, refetch: fetch };
};
