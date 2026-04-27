/**
 * Chat Service
 * Handle chat/messaging operations
 */

import { db } from '../config/firebase-admin.js';
import type { ChatMessage, CreateMessageDTO } from '@shared/types/chat.types';
import { getPersonnelBySerial } from './personnel.service.js';
import type { Personnel } from '@shared/types/personnel.types';

const COLLECTION_NAME = 'messages';

/**
 * Parse personnel info from message
 * Expected format: "Rank Full Name Serial Number PCG"
 * Example: "SN2 John S Doe 018347 PCG"
 */
const parsePersonnelInfo = (message: string): { rank: string; fullName: string; serialNumber: string } | null => {
  // Trim and normalize whitespace
  const normalized = message.trim().replace(/\s+/g, ' ');

  // Check if message ends with "PCG"
  if (!normalized.toUpperCase().endsWith(' PCG')) {
    return null;
  }

  // Remove "PCG" from the end
  const withoutPCG = normalized.substring(0, normalized.length - 4).trim();

  // Split into parts
  const parts = withoutPCG.split(' ');

  // Need at least: Rank FirstName LastName SerialNumber
  if (parts.length < 4) {
    return null;
  }

  // Last part should be serial number (digits)
  const serialNumber = parts[parts.length - 1];
  if (!/^\d+$/.test(serialNumber)) {
    return null;
  }

  // First part should be rank
  const rank = parts[0];

  // Everything between rank and serial number is the full name
  const fullName = parts.slice(1, parts.length - 1).join(' ');

  return { rank, fullName, serialNumber };
};

/**
 * Search for personnel by parsed info
 */
const searchPersonnelByInfo = async (rank: string, fullName: string, serialNumber: string): Promise<Personnel | null> => {
  try {
    // First search by serial number (most specific)
    const personnelBySerial = await getPersonnelBySerial(serialNumber);

    if (personnelBySerial) {
      // Verify rank and name match
      const personnelFullName = `${personnelBySerial.firstName}${personnelBySerial.middleName ? ' ' + personnelBySerial.middleName : ''} ${personnelBySerial.lastName}`;

      // Check if rank matches (case insensitive)
      const rankMatch = personnelBySerial.rank.toLowerCase() === rank.toLowerCase();

      // Check if name matches (case insensitive, flexible matching)
      const nameMatch = personnelFullName.toLowerCase().includes(fullName.toLowerCase()) ||
                       fullName.toLowerCase().includes(personnelFullName.toLowerCase());

      if (rankMatch && nameMatch) {
        return personnelBySerial;
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching personnel:', error);
    return null;
  }
};

/**
 * Get pending personnel confirmation for a user
 */
const getPendingConfirmation = async (userId: string): Promise<any | null> => {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;

  const userData = userDoc.data();
  return userData?.pendingPersonnelConfirmation || null;
};

/**
 * Set pending personnel confirmation for a user
 */
const setPendingConfirmation = async (userId: string, personnelData: Personnel | null): Promise<void> => {
  await db.collection('users').doc(userId).update({
    pendingPersonnelConfirmation: personnelData
  });
};

/**
 * Link user to personnel record
 */
const linkUserToPersonnel = async (userId: string, personnelId: string, serialNumber: string): Promise<void> => {
  await db.collection('users').doc(userId).update({
    linkedPersonnelId: personnelId,
    serialNumber: serialNumber,
    pendingPersonnelConfirmation: null
  });

  console.log(`✅ User ${userId} linked to personnel record ${personnelId}`);
};

/**
 * Send automated message from admin
 */
const sendAutomatedAdminMessage = async (recipientId: string, messageText: string): Promise<void> => {
  // Find admin user
  const adminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();

  if (adminSnapshot.empty) {
    console.error('No admin user found to send automated message');
    return;
  }

  const adminDoc = adminSnapshot.docs[0];
  const adminData = adminDoc.data();

  // Get recipient info
  const recipientDoc = await db.collection('users').doc(recipientId).get();
  const recipientData = recipientDoc.data();

  const messageRef = db.collection(COLLECTION_NAME).doc();

  const chatMessage: ChatMessage = {
    id: messageRef.id,
    senderId: adminDoc.id,
    senderName: adminData.displayName,
    senderRole: 'admin',
    recipientId,
    recipientName: recipientData?.displayName || 'Unknown',
    message: `[AUTOMATED MESSAGE]\n\n${messageText}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  await messageRef.set(chatMessage);
  console.log(`🤖 Automated admin message sent to ${recipientData?.displayName}`);
};

/**
 * Send automated prompt to re-link personnel record after unlinking
 */
export const sendUnlinkPromptMessage = async (userId: string): Promise<void> => {
  await sendAutomatedAdminMessage(
    userId,
    'Your personnel record has been unlinked.\n\nTo link a new record, please provide your information in the following format:\n\nRank Full Name Serial Number PCG\nExample: SN2 John S Doe 018347 PCG'
  );
};

/**
 * Send a message
 */
export const sendMessage = async (
  senderId: string,
  senderName: string,
  senderRole: string,
  recipientId: string,
  message: string
): Promise<ChatMessage> => {
  // Get recipient info
  const recipientDoc = await db.collection('users').doc(recipientId).get();

  if (!recipientDoc.exists) {
    throw new Error('Recipient not found');
  }

  const recipient = recipientDoc.data();
  const recipientRole = recipient?.role || 'viewer';

  // Check if this is the first message between these users
  const existingMessages = await db
    .collection(COLLECTION_NAME)
    .where('senderId', 'in', [senderId, recipientId])
    .where('recipientId', 'in', [senderId, recipientId])
    .limit(1)
    .get();

  const isFirstMessage = existingMessages.empty;

  // Check for pending personnel confirmation (yes/no response)
  const pendingConfirmation = await getPendingConfirmation(senderId);

  if (pendingConfirmation) {
    const messageLower = message.toLowerCase().trim();

    if (messageLower === 'yes' || messageLower === 'y') {
      // Link user to personnel record
      await linkUserToPersonnel(
        senderId,
        pendingConfirmation.id,
        pendingConfirmation.serialNumber
      );

      // Send confirmation
      await sendAutomatedAdminMessage(
        senderId,
        `✅ Your account has been successfully linked to your personnel record!\n\n👤 Name: ${pendingConfirmation.firstName} ${pendingConfirmation.middleName || ''} ${pendingConfirmation.lastName}\n🎖️ Rank: ${pendingConfirmation.rank}\n🔢 Serial Number: ${pendingConfirmation.serialNumber}\n\nYou may be able to view your personnel record, go back to Personnel Record Tab.`
      );

      // Don't send the original "yes" message
      return {
        id: '',
        senderId,
        senderName,
        senderRole: senderRole as any,
        recipientId,
        recipientName: recipient?.displayName || 'Unknown',
        message: 'yes',
        timestamp: new Date().toISOString(),
        read: false,
      } as ChatMessage;
    } else if (messageLower === 'no' || messageLower === 'n') {
      // Clear pending confirmation
      await setPendingConfirmation(senderId, null);

      // Ask them to try again
      await sendAutomatedAdminMessage(
        senderId,
        `No problem! Please provide your information again in the following format:\n\nRank Full Name Serial Number PCG\nExample: SN2 John S Doe 018347 PCG`
      );

      // Don't send the original "no" message
      return {
        id: '',
        senderId,
        senderName,
        senderRole: senderRole as any,
        recipientId,
        recipientName: recipient?.displayName || 'Unknown',
        message: 'no',
        timestamp: new Date().toISOString(),
        read: false,
      } as ChatMessage;
    }
  }

  // Check if message contains personnel info (viewer sending to admin/medical)
  if (senderRole === 'viewer' && (recipientRole === 'admin' || recipientRole === 'medical')) {
    const parsedInfo = parsePersonnelInfo(message);

    if (parsedInfo) {
      const { rank, fullName, serialNumber } = parsedInfo;

      // Search for personnel record
      const personnelRecord = await searchPersonnelByInfo(rank, fullName, serialNumber);

      if (personnelRecord) {
        // Found a match! Send confirmation request
        await setPendingConfirmation(senderId, personnelRecord);

        const personnelFullName = `${personnelRecord.firstName}${personnelRecord.middleName ? ' ' + personnelRecord.middleName : ''} ${personnelRecord.lastName}`;

        await sendAutomatedAdminMessage(
          senderId,
          `🔍 I found a matching personnel record:\n\n━━━━━━━━━━━━━━━━━━━━\n👤 Name: ${personnelFullName}\n🎖️ Rank: ${personnelRecord.rank}\n🔢 Serial Number: ${personnelRecord.serialNumber}\n🏢 Unit: ${personnelRecord.unit}\n━━━━━━━━━━━━━━━━━━━━\n\nIs this your record? Please reply with "Yes" or "No".`
        );

        console.log(`✅ Personnel match found for ${senderName}: ${personnelFullName}`);
      } else {
        // No match found
        await sendAutomatedAdminMessage(
          senderId,
          `❌ Sorry, I couldn't find a matching personnel record with the information provided.\n\nPlease verify your information and try again:\n\nRank Full Name Serial Number PCG\nExample: SN2 John S Doe 018347 PCG\n\nMake sure your rank, full name, and serial number match exactly with your official records.`
        );

        console.log(`❌ No personnel match found for ${senderName}`);
      }
    }
  }

  // If viewer is messaging admin/medical for the first time, send automated intro
  if (
    isFirstMessage &&
    senderRole === 'viewer' &&
    (recipientRole === 'admin' || recipientRole === 'medical')
  ) {
    // Get sender's user info to find their serial number
    const senderDoc = await db.collection('users').doc(senderId).get();
    const senderData = senderDoc.data();
    const senderSerialNumber = senderData?.serialNumber;

    if (senderSerialNumber) {
      // Get sender's personnel information using serial number
      const personnelSnapshot = await db
        .collection('personnel')
        .where('serialNumber', '==', senderSerialNumber)
        .limit(1)
        .get();

      if (!personnelSnapshot.empty) {
        const personnelData = personnelSnapshot.docs[0].data();
        const fullName = `${personnelData.firstName}${personnelData.middleName ? ' ' + personnelData.middleName : ''} ${personnelData.lastName}`;

        // Create automated introduction message
        const introMessageRef = db.collection(COLLECTION_NAME).doc();
        const introMessage: ChatMessage = {
          id: introMessageRef.id,
          senderId,
          senderName,
          senderRole: senderRole as any,
          recipientId,
          recipientName: recipient?.displayName || 'Unknown',
          message: `[AUTOMATED MESSAGE]\n\n📋 Personnel Information:\n━━━━━━━━━━━━━━━━━━━━\n👤 Full Name: ${fullName}\n🎖️ Rank: ${personnelData.rank}\n🔢 Serial Number: ${personnelData.serialNumber}\n━━━━━━━━━━━━━━━━━━━━`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        await introMessageRef.set(introMessage);
        console.log(`🤖 Automated intro message sent from ${senderName} to ${recipient?.displayName}`);
      }
    }
  }

  // Send the actual user message
  const messageRef = db.collection(COLLECTION_NAME).doc();

  const chatMessage: ChatMessage = {
    id: messageRef.id,
    senderId,
    senderName,
    senderRole: senderRole as any,
    recipientId,
    recipientName: recipient?.displayName || 'Unknown',
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };

  await messageRef.set(chatMessage);

  console.log(`📨 Message sent from ${senderName} to ${recipient?.displayName}`);

  return chatMessage;
};

/**
 * Get messages between two users
 */
export const getMessages = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
  // Get messages where either user is sender or recipient
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('senderId', 'in', [userId1, userId2])
    .get();

  const messages = snapshot.docs
    .map((doc) => doc.data() as ChatMessage)
    .filter(
      (msg) =>
        (msg.senderId === userId1 && msg.recipientId === userId2) ||
        (msg.senderId === userId2 && msg.recipientId === userId1)
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return messages;
};

/**
 * Get all conversations for a user
 */
export const getConversations = async (userId: string): Promise<any[]> => {
  // Get messages where user is sender or recipient
  const sentSnapshot = await db
    .collection(COLLECTION_NAME)
    .where('senderId', '==', userId)
    .get();

  const receivedSnapshot = await db
    .collection(COLLECTION_NAME)
    .where('recipientId', '==', userId)
    .get();

  const allMessages = [
    ...sentSnapshot.docs.map((doc) => doc.data() as ChatMessage),
    ...receivedSnapshot.docs.map((doc) => doc.data() as ChatMessage),
  ];

  // Group by conversation partner
  const conversationsMap = new Map();

  allMessages.forEach((msg) => {
    const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
    const partnerName = msg.senderId === userId ? msg.recipientName : msg.senderName;
    const partnerRole = msg.senderId === userId ? 'viewer' : msg.senderRole;

    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, {
        userId: partnerId,
        userName: partnerName,
        userRole: partnerRole,
        lastMessage: msg.message,
        lastMessageTime: msg.timestamp,
        unreadCount: 0,
      });
    } else {
      const existing = conversationsMap.get(partnerId);
      if (new Date(msg.timestamp) > new Date(existing.lastMessageTime)) {
        existing.lastMessage = msg.message;
        existing.lastMessageTime = msg.timestamp;
      }
    }

    // Count unread messages
    if (msg.recipientId === userId && !msg.read) {
      const conv = conversationsMap.get(partnerId);
      conv.unreadCount++;
    }
  });

  // Hydrate with current user data so name/role changes are always reflected
  const partnerIds = Array.from(conversationsMap.keys());
  const partnerDocs = await Promise.all(partnerIds.map((id) => db.collection('users').doc(id).get()));
  partnerDocs.forEach((doc) => {
    if (doc.exists && conversationsMap.has(doc.id)) {
      const data = doc.data();
      const conv = conversationsMap.get(doc.id);
      conv.userName = data?.displayName || conv.userName;
      conv.userRole = data?.role || conv.userRole;
    }
  });

  return Array.from(conversationsMap.values()).sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
};

/**
 * Mark messages as read
 */
export const markAsRead = async (userId: string, partnerId: string): Promise<void> => {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('senderId', '==', partnerId)
    .where('recipientId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();

  console.log(`✅ Marked ${snapshot.size} messages as read`);
};

/**
 * Delete all messages in a conversation between two users
 */
export const deleteConversation = async (userId1: string, userId2: string): Promise<void> => {
  const [snap1, snap2] = await Promise.all([
    db.collection(COLLECTION_NAME).where('senderId', '==', userId1).where('recipientId', '==', userId2).get(),
    db.collection(COLLECTION_NAME).where('senderId', '==', userId2).where('recipientId', '==', userId1).get(),
  ]);
  const batch = db.batch();
  [...snap1.docs, ...snap2.docs].forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🗑️ Conversation deleted between ${userId1} and ${userId2}`);
};

/**
 * Get all users (for starting new conversations)
 */
export const getAllUsers = async (currentUserId: string): Promise<any[]> => {
  const snapshot = await db.collection('users').get();

  return snapshot.docs
    .filter((doc) => doc.id !== currentUserId)
    .map((doc) => ({
      uid: doc.id,
      displayName: doc.data().displayName,
      email: doc.data().email,
      role: doc.data().role,
      photoURL: doc.data().photoURL,
      linkedPersonnelId: doc.data().linkedPersonnelId ?? null,
    }));
};
