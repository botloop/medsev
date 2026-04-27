/**
 * Notifications Controller
 * Returns unread message counts and recent activity for the current user
 */

import { Request, Response } from 'express';
import { db } from '../config/firebase-admin.js';
import { sendNeuroScheduleEmail, sendMedicalCheckupAdminEmail } from '../services/email.service.js';
import { sendMessage } from '../services/chat.service.js';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Count unread messages for this user
    const unreadSnapshot = await db
      .collection('messages')
      .where('recipientId', '==', userId)
      .where('read', '==', false)
      .get();

    const unreadMessages = unreadSnapshot.size;

    // 2. Collect unread message previews (up to 5)
    const messagePreviews: any[] = [];
    unreadSnapshot.docs
      .sort((a, b) => {
        const ta = new Date(a.data().timestamp).getTime();
        const tb = new Date(b.data().timestamp).getTime();
        return tb - ta; // newest first
      })
      .slice(0, 5)
      .forEach((doc) => {
        const d = doc.data();
        messagePreviews.push({
          id: doc.id,
          senderName: d.senderName || 'Unknown',
          preview: d.message?.substring(0, 60) + (d.message?.length > 60 ? '…' : ''),
          timestamp: d.timestamp,
        });
      });

    // 3. Recent activity log entries (last 8, system-wide for admins/medical)
    const activitySnapshot = await db
      .collection('activityLog')
      .orderBy('timestamp', 'desc')
      .limit(8)
      .get();

    const recentActivity = activitySnapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        action: d.action,
        resource: d.resource,
        description: d.description,
        userName: d.userName,
        timestamp: d.timestamp,
      };
    });

    // 4. Pending personnel review requests (admins only)
    let pendingReviews = 0;
    let pendingReviewList: { id: string; userName: string; submittedAt: string }[] = [];
    const userRole = (req as any).user?.role;
    if (userRole === 'admin' || userRole === 'medical') {
      const pendingSnap = await db
        .collection('personnelRequests')
        .where('status', '==', 'pending')
        .limit(10)
        .get();
      pendingReviews = pendingSnap.size;
      pendingReviewList = pendingSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          userName: d.userName || d.userEmail || 'Unknown',
          submittedAt: d.submittedAt,
        };
      });
    }

    // 5. Viewer's own profile request status
    let myProfileRequest: { status: string; submittedAt: string; rejectionReason?: string } | null = null;
    if (userRole === 'viewer') {
      const mySnap = await db
        .collection('personnelRequests')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      if (!mySnap.empty) {
        const d = mySnap.docs[0].data();
        myProfileRequest = {
          status: d.status,
          submittedAt: d.submittedAt,
          rejectionReason: d.rejectionReason,
        };
      }
    }

    return res.json({
      unreadMessages,
      messagePreviews,
      recentActivity,
      pendingReviews,
      pendingReviewList,
      myProfileRequest,
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return res.status(500).json({ error: 'Failed to get notifications' });
  }
};

export const sendMedicalCheckupNotification = async (req: Request, res: Response) => {
  const { viewerUserId, viewerName, viewerEmail } = req.body;
  if (!viewerUserId) return res.status(400).json({ error: 'viewerUserId required' });
  try {
    // Find admin user to send auto-reply from
    const adminSnap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    if (!adminSnap.empty) {
      const admin = adminSnap.docs[0].data();
      await sendMessage(
        adminSnap.docs[0].id,
        admin.displayName || 'PCG Medical',
        'admin',
        viewerUserId,
        '[AUTOMATED MESSAGE] Thank you for your request. You may visit the PCG Medical Station at Brgy 99 Diit, Tacloban City anytime during office hours. You may also reach us at 📞 09934532670 or ✉️ cgmedclev@gmail.com. Our medical staff will attend to you promptly.'
      );
    }
    // Notify admin via email
    console.log('Sending medical checkup email to longlite8867@gmail.com for:', viewerName);
    try {
      await sendMedicalCheckupAdminEmail(viewerName || 'Unknown', viewerEmail || '');
      console.log('Medical checkup email sent successfully');
    } catch (emailErr: any) {
      console.error('Medical checkup admin email error:', emailErr?.message ?? emailErr);
    }
    return res.json({ message: 'Auto-reply sent' });
  } catch (error) {
    console.error('Medical checkup notification error:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
};

export const sendNeuroNotification = async (req: Request, res: Response) => {
  const { email, displayName, scheduleDate, scheduleTime } = req.body;
  if (!email || !scheduleDate) {
    return res.status(400).json({ error: 'email and scheduleDate are required' });
  }
  try {
    await sendNeuroScheduleEmail(email, displayName || 'Personnel', scheduleDate, scheduleTime);
    return res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send neuro notification email:', error);
    // Return 200 so the client doesn't block — schedule is already saved
    return res.json({ message: 'Schedule saved. Email notification could not be sent.', emailError: true });
  }
};
