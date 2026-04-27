/**
 * Delete Confirmation Modal
 * Confirm before deleting personnel record
 */

import { useState } from 'react';
import type { Personnel } from '@shared/types/personnel.types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

interface DeleteConfirmModalProps {
  personnel: Personnel;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ personnel, onConfirm, onCancel }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  const fullName = `${personnel.firstName} ${personnel.middleName ? personnel.middleName + ' ' : ''}${personnel.lastName}`;

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Typography fontSize={48}>⚠️</Typography>
        <Typography variant="h6" component="span" display="block" fontWeight={700} mt={1}>Delete Personnel Record</Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={700} mb={1}>WARNING: This action will permanently delete:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Personnel record for <strong>{fullName}</strong></li>
            <li>Serial Number: <strong>{personnel.serialNumber}</strong></li>
            <li>All medical processing history</li>
            <li>Cannot be undone!</li>
          </ul>
        </Alert>
        <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            Per CG Security Directive 2025-01, all deletions are logged and require administrator authorization.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={onCancel} disabled={deleting}>Cancel</Button>
        <Button fullWidth variant="contained" color="error" onClick={handleConfirm} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Confirm Deletion'}
        </Button>
      </DialogActions>
      <Box sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="caption" color="text.secondary">This action will be logged with your user ID</Typography>
      </Box>
    </Dialog>
  );
};