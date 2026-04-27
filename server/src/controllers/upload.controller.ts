/**
 * Upload Controller
 * Handle file uploads for medical results via Cloudinary
 */

import type { Request, Response } from 'express';
import { db } from '../config/firebase-admin.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import type { MedicalResultFile } from '@shared/types/personnel.types';
import type { UploadApiOptions } from 'cloudinary';
import { createActivityLog } from '../services/activityLog.service.js';

/**
 * Upload one or more medical result files to Cloudinary
 */
export const uploadMedicalResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personnelId, step } = req.params;
    const files = req.files as Express.Multer.File[];
    const userId = (req as any).user?.uid;

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    const stepNumber = parseInt(step);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }

    // Get personnel document
    const personnelRef = db.collection('personnel').doc(personnelId);
    const personnelDoc = await personnelRef.get();

    if (!personnelDoc.exists) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    const personnel = personnelDoc.data() as Record<string, any>;
    const stepKey = `step${stepNumber}`;

    if (!personnel?.medicalStatus?.[stepKey]?.completed) {
      res.status(400).json({ error: `Step ${stepNumber} must be completed before uploading files` });
      return;
    }

    // Upload all files to Cloudinary in parallel — much faster than sequential
    const uploadedFiles: MedicalResultFile[] = await Promise.all(
      files.map((file) => {
        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const baseName = file.originalname
          .replace(/\.[^.]+$/, '')          // remove extension
          .replace(/[^a-zA-Z0-9._-]/g, '_') // sanitize
          .slice(0, 60);

        const uploadOptions: UploadApiOptions = {
          folder: `pcg-medical/${personnelId}/step${stepNumber}`,
          public_id: `${uniqueSuffix}_${baseName}`,
          resource_type: resourceType,
        };

        return uploadToCloudinary(file.buffer, uploadOptions).then((result) => ({
          fileName:           file.originalname,
          fileURL:            result.secure_url,
          cloudinaryPublicId: result.public_id,
          uploadedAt:         new Date().toISOString(),
          uploadedBy:         userId,
          fileType:           file.mimetype,
          fileSize:           file.size,
        } as MedicalResultFile));
      }),
    );

    const currentFiles = personnel.medicalStatus[stepKey].files || [];

    await personnelRef.update({
      [`medicalStatus.${stepKey}.files`]: [...currentFiles, ...uploadedFiles],
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });

    console.log(`Uploaded ${uploadedFiles.length} file(s) to Cloudinary for ${personnelId} step ${stepNumber}`);

    await createActivityLog({
      userId:    (req as any).user?.uid || userId,
      userName:  (req as any).user?.displayName || 'Unknown',
      userEmail: (req as any).user?.email || '',
      action:    'upload',
      resource:  'medical-result',
      resourceId: personnelId,
      description: `Uploaded ${uploadedFiles.length} file(s) for ${personnel.firstName} ${personnel.lastName} - Step ${stepNumber}`,
      metadata: { fileCount: uploadedFiles.length, fileNames: uploadedFiles.map(f => f.fileName), step: stepNumber },
    });

    // Notify all admins when step 3 medical documents are uploaded
    if (stepNumber === 3) {
      const now = new Date().toISOString();
      const label = [personnel.rank, `${personnel.firstName} ${personnel.lastName}`, '-', personnel.serialNumber, 'PCG']
        .filter(Boolean).join(' ');
      const alertMsg = `📋 Medical results uploaded by ${label} — Step 3 documents are ready for evaluation.`;
      const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
      await Promise.all(adminSnap.docs.map(adminDoc =>
        db.collection('messages').add({
          recipientId: adminDoc.id,
          senderId:    userId,
          senderName:  (req as any).user?.displayName || (req as any).user?.email || 'Unknown',
          message:     alertMsg,
          read:        false,
          timestamp:   now,
          isSystemAlert: true,
        }),
      ));
    }

    res.json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files:   uploadedFiles,
    });
  } catch (error) {
    console.error('Upload medical result error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

/**
 * Get medical results for a personnel and step
 */
export const getMedicalResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personnelId, step } = req.params;

    const stepNumber = parseInt(step);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }

    const personnelRef = db.collection('personnel').doc(personnelId);
    const personnelDoc = await personnelRef.get();

    if (!personnelDoc.exists) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    const personnel = personnelDoc.data() as Record<string, any>;
    const stepKey = `step${stepNumber}`;
    const files = personnel?.medicalStatus?.[stepKey]?.files || [];

    res.json({ files });
  } catch (error) {
    console.error('Get medical results error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
};

/**
 * Delete a medical result file from Cloudinary and Firestore
 */
export const deleteMedicalResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personnelId, step, fileName } = req.params;
    const userId = (req as any).user?.uid;

    const stepNumber = parseInt(step);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }

    const personnelRef = db.collection('personnel').doc(personnelId);
    const personnelDoc = await personnelRef.get();

    if (!personnelDoc.exists) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    const personnel = personnelDoc.data() as Record<string, any>;
    const stepKey = `step${stepNumber}`;
    const currentFiles: MedicalResultFile[] = personnel?.medicalStatus?.[stepKey]?.files || [];

    const decodedName = decodeURIComponent(fileName);
    const fileToDelete = currentFiles.find(f => f.fileName === decodedName);

    if (!fileToDelete) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete from Cloudinary — use correct resource_type (PDFs are 'raw', images are 'image')
    if (fileToDelete.cloudinaryPublicId) {
      const resourceType = fileToDelete.fileType === 'application/pdf' ? 'raw' : 'image';
      try {
        await deleteFromCloudinary(fileToDelete.cloudinaryPublicId, resourceType);
        console.log(`Deleted from Cloudinary (${resourceType}): ${fileToDelete.cloudinaryPublicId}`);
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning (file may already be gone):', cloudErr);
      }
    }

    const updatedFiles = currentFiles.filter(f => f.fileName !== decodedName);

    await personnelRef.update({
      [`medicalStatus.${stepKey}.files`]: updatedFiles,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });

    console.log(`Deleted from Cloudinary for ${personnelId} step ${stepNumber}: ${decodedName}`);

    await createActivityLog({
      userId:    (req as any).user?.uid || userId,
      userName:  (req as any).user?.displayName || 'Unknown',
      userEmail: (req as any).user?.email || '',
      action:    'delete',
      resource:  'medical-result',
      resourceId: personnelId,
      description: `Deleted "${decodedName}" for ${personnel.firstName} ${personnel.lastName} - Step ${stepNumber}`,
      metadata: { fileName: decodedName, step: stepNumber },
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete medical result error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

/**
 * Delete ALL medical result files for a step from Cloudinary and Firestore
 */
export const deleteAllMedicalResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personnelId, step } = req.params;
    const userId = (req as any).user?.uid;

    const stepNumber = parseInt(step);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
      res.status(400).json({ error: 'Invalid step number' });
      return;
    }

    const personnelRef = db.collection('personnel').doc(personnelId);
    const personnelDoc = await personnelRef.get();

    if (!personnelDoc.exists) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    const personnel = personnelDoc.data() as Record<string, any>;
    const stepKey = `step${stepNumber}`;
    const currentFiles: MedicalResultFile[] = personnel?.medicalStatus?.[stepKey]?.files || [];

    if (currentFiles.length === 0) {
      res.json({ message: 'No files to delete', deleted: 0 });
      return;
    }

    // Delete all files from Cloudinary in parallel
    await Promise.allSettled(
      currentFiles
        .filter(f => f.cloudinaryPublicId)
        .map(f => {
          const resourceType = f.fileType === 'application/pdf' ? 'raw' : 'image';
          return deleteFromCloudinary(f.cloudinaryPublicId!, resourceType);
        }),
    );

    // Clear files array in Firestore
    await personnelRef.update({
      [`medicalStatus.${stepKey}.files`]: [],
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });

    console.log(`Deleted all ${currentFiles.length} file(s) from Cloudinary for ${personnelId} step ${stepNumber}`);

    await createActivityLog({
      userId:    (req as any).user?.uid || userId,
      userName:  (req as any).user?.displayName || 'Unknown',
      userEmail: (req as any).user?.email || '',
      action:    'delete',
      resource:  'medical-result',
      resourceId: personnelId,
      description: `Deleted all ${currentFiles.length} file(s) for ${personnel.firstName} ${personnel.lastName} - Step ${stepNumber}`,
      metadata: { fileCount: currentFiles.length, step: stepNumber },
    });

    res.json({ message: `${currentFiles.length} file(s) deleted successfully`, deleted: currentFiles.length });
  } catch (error) {
    console.error('Delete all medical results error:', error);
    res.status(500).json({ error: 'Failed to delete all files' });
  }
};
