/**
 * Personnel Requests Controller
 * Handles viewer profile submissions and admin approve/reject
 */

import { Request, Response } from 'express';
import * as svc from '../services/personnelRequests.service.js';
import { createPersonnel, getPersonnelById, getPersonnelBySerial } from '../services/personnel.service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { db } from '../config/firebase-admin.js';
import { createActivityLog } from '../services/activityLog.service.js';
import { sendProfileApprovedEmail, sendProfileRejectedEmail } from '../services/email.service.js';
import type { PersonnelRequestStatus } from '@shared/types/personnelRequest.types';
import type { MedicalResultFile } from '@shared/types/personnel.types';
import type { UploadApiOptions } from 'cloudinary';

const getUser = (req: Request) => ({
  uid:   (req as any).user?.uid || 'unknown',
  name:  (req as any).user?.displayName || (req as any).user?.email || 'Unknown User',
  email: (req as any).user?.email || '',
});

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as PersonnelRequestStatus | undefined;
    res.json(await svc.getAllRequests(status));
  } catch (e) {
    console.error('getAll personnelRequests error:', e);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const getMine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = getUser(req);
    const request = await svc.getRequestByUserId(uid);
    res.json(request ?? null);
  } catch (e) {
    console.error('getMine error:', e);
    res.status(500).json({ error: 'Failed to fetch your request' });
  }
};

export const submit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, name, email } = getUser(req);
    const { data } = req.body;
    if (!data) { res.status(400).json({ error: 'No data provided' }); return; }
    const request = await svc.createOrUpdateRequest(uid, name, email, data);
    res.status(201).json(request);
  } catch (e) {
    console.error('submit personnelRequest error:', e);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, name } = getUser(req);
    const request = await svc.approveRequest(req.params.id, name);
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

    // Create actual personnel record from the submitted data
    const personnelData = {
      ...request.data,
      medicalSteps: { step1: false, step2: false, step3: false, step4: false, step5: false, step6: false, step7: false, step8: false },
    };
    const personnel = await createPersonnel(personnelData as any, uid);

    // Save personnel ID back to the request so viewer can look up their record
    await svc.approveRequest(req.params.id, name, personnel.id);

    // Auto-link the viewer's user account to the new personnel record
    await db.collection('users').doc(request.userId).update({
      linkedPersonnelId: personnel.id,
      serialNumber: request.data.serialNumber || null,
    });

    // Send email notification to viewer
    sendProfileApprovedEmail(request.userEmail, request.userName, name).catch(() => {});

    res.json({ message: 'Approved and personnel record created', request: { ...request, personnelId: personnel.id } });
  } catch (e) {
    console.error('approve personnelRequest error:', e);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

export const getMinePersonnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = getUser(req);
    const request = await svc.getRequestByUserId(uid);
    if (!request || request.status !== 'approved') { res.json(null); return; }

    // Primary lookup by stored personnelId
    let personnel = request.personnelId ? await getPersonnelById(request.personnelId) : null;

    // Fallback: look up by serial number for requests approved before personnelId was stored
    if (!personnel && request.data?.serialNumber) {
      personnel = await getPersonnelBySerial(request.data.serialNumber);
      // Backfill personnelId so future lookups skip this query
      if (personnel) {
        await svc.approveRequest(request.id, request.reviewedBy || '', personnel.id);
      }
    }

    if (!personnel) { res.json(null); return; }
    res.json(personnel);
  } catch (e) {
    console.error('getMinePersonnel error:', e);
    res.status(500).json({ error: 'Failed to fetch personnel record' });
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = getUser(req);
    const reason = req.body.reason || '';
    const request = await svc.rejectRequest(req.params.id, name, reason);
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

    // Send email notification to viewer
    sendProfileRejectedEmail(request.userEmail, request.userName, name, reason).catch(() => {});

    res.json(request);
  } catch (e) {
    console.error('reject personnelRequest error:', e);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

// ── Viewer Step-3 File Upload Helpers ─────────────────────────────────────────

/** Resolve the linked personnel record for the authenticated viewer */
const resolvePersonnel = async (uid: string) => {
  const request = await svc.getRequestByUserId(uid);
  if (!request || request.status !== 'approved') return null;
  let personnel = request.personnelId ? await getPersonnelById(request.personnelId) : null;
  if (!personnel && request.data?.serialNumber) {
    personnel = await getPersonnelBySerial(request.data.serialNumber);
    if (personnel) await svc.approveRequest(request.id, request.reviewedBy || '', personnel.id);
  }
  return personnel;
};

export const uploadStep3Files = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = getUser(req);
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: 'No files provided' }); return; }

    const personnel = await resolvePersonnel(uid);
    if (!personnel) { res.status(404).json({ error: 'Approved profile not found' }); return; }

    const uploadedFiles: MedicalResultFile[] = await Promise.all(
      files.map((file) => {
        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const baseName = file.originalname
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 60);
        const options: UploadApiOptions = {
          folder: `pcg-medical/${personnel.id}/step3`,
          public_id: `${uniqueSuffix}_${baseName}`,
          resource_type: resourceType,
        };
        return uploadToCloudinary(file.buffer, options).then((result) => ({
          fileName:           file.originalname,
          fileURL:            result.secure_url,
          cloudinaryPublicId: result.public_id,
          uploadedAt:         new Date().toISOString(),
          uploadedBy:         uid,
          fileType:           file.mimetype,
          fileSize:           file.size,
        } as MedicalResultFile));
      }),
    );

    const personnelRef = db.collection('personnel').doc(personnel.id);
    const doc = await personnelRef.get();
    const data = doc.data() as Record<string, any>;
    const currentFiles: MedicalResultFile[] = data?.medicalStatus?.step3?.files || [];

    await personnelRef.update({
      'medicalStatus.step3.files': [...currentFiles, ...uploadedFiles],
      updatedAt: new Date().toISOString(),
    });

    // Build display label from personnel request data for the notification
    const request = await svc.getRequestByUserId(uid);
    const rank   = request?.data.rank       || '';
    const first  = request?.data.firstName  || '';
    const last   = request?.data.lastName   || '';
    const serial = request?.data.serialNumber || '';
    const label  = `${rank} ${first} ${last} - ${serial} PCG`.trim();
    const alertMsg = `📋 Medical documents uploaded by ${label} — Step 3 is waiting for medical evaluation.`;

    // Activity log (shows in admin's Recent Activity panel)
    await createActivityLog({
      userId:    uid,
      userName:  label,
      userEmail: (req as any).user?.email || '',
      action:    'upload',
      resource:  'medical-result',
      resourceId: personnel.id,
      description: alertMsg,
      metadata:  { fileCount: uploadedFiles.length, step: 3 },
    });

    // Unread message to every admin (increments their notification badge)
    const now = new Date().toISOString();
    const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
    await Promise.all(
      adminSnap.docs.map((adminDoc) =>
        db.collection('messages').add({
          recipientId:  adminDoc.id,
          senderId:     uid,
          senderName:   name,
          message:      alertMsg,
          read:         false,
          timestamp:    now,
          isSystemAlert: true,
        }),
      ),
    );

    res.json({ message: `${uploadedFiles.length} file(s) uploaded`, files: uploadedFiles });
  } catch (e) {
    console.error('uploadStep3Files error:', e);
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

export const deleteStep3File = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = getUser(req);
    const personnel = await resolvePersonnel(uid);
    if (!personnel) { res.status(404).json({ error: 'Approved profile not found' }); return; }

    const decodedName = decodeURIComponent(req.params.fileName);
    const personnelRef = db.collection('personnel').doc(personnel.id);
    const doc = await personnelRef.get();
    const data = doc.data() as Record<string, any>;
    const currentFiles: MedicalResultFile[] = data?.medicalStatus?.step3?.files || [];
    const fileToDelete = currentFiles.find((f) => f.fileName === decodedName);

    if (!fileToDelete) { res.status(404).json({ error: 'File not found' }); return; }

    if (fileToDelete.cloudinaryPublicId) {
      const resourceType = fileToDelete.fileType === 'application/pdf' ? 'raw' : 'image';
      await deleteFromCloudinary(fileToDelete.cloudinaryPublicId, resourceType).catch(() => {});
    }

    await personnelRef.update({
      'medicalStatus.step3.files': currentFiles.filter((f) => f.fileName !== decodedName),
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'File deleted' });
  } catch (e) {
    console.error('deleteStep3File error:', e);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
