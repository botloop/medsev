/**
 * Users Controller
 * HTTP handlers for user management (admin only)
 */

import { Request, Response } from 'express';
import * as service from '../services/users.service.js';
import { createActivityLog } from '../services/activityLog.service.js';

const getActor = (req: Request) => ({
  uid:  (req as any).user?.uid  || 'unknown',
  name: (req as any).user?.displayName || (req as any).user?.email || 'Unknown',
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const users = await service.getAllUsers();
    return res.json(users);
  } catch (error) {
    console.error('getAll users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['admin', 'medical', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { uid: actorUid, name: actorName } = getActor(req);
    const updated = await service.updateUserRole(req.params.uid, role);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await createActivityLog({
      userId:      actorUid,
      userName:    actorName,
      action:      'update',
      resource:    'user',
      resourceId:  req.params.uid,
      description: `Changed role of ${updated.displayName || updated.email} to "${role}"`,
      metadata:    { targetUid: req.params.uid, newRole: role },
    });

    return res.json(updated);
  } catch (error) {
    console.error('updateRole error:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { uid: actorUid, name: actorName } = getActor(req);

    // Prevent self-deletion
    if (req.params.uid === actorUid) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await service.getUserById(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const deleted = await service.deleteUser(req.params.uid);
    if (!deleted) return res.status(404).json({ error: 'User not found' });

    await createActivityLog({
      userId:      actorUid,
      userName:    actorName,
      action:      'delete',
      resource:    'user',
      resourceId:  req.params.uid,
      description: `Deleted user ${user.displayName || user.email}`,
      metadata:    { targetUid: req.params.uid, email: user.email },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('remove user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
