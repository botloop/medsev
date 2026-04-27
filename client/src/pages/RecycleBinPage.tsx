/**
 * RecycleBinPage
 * Admin-only page for restoring or permanently deleting soft-deleted items
 */

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { useRecycleBin } from '../hooks/useRecycleBin';
import type { RecycleBinItemType, RecycleBinItem } from '../hooks/useRecycleBin';

const TYPE_META: Record<string, { label: string; color: 'primary'|'warning'|'success'; icon: React.ReactNode }> = {
  'personnel':      { label: 'Personnel',       color: 'primary', icon: <PeopleIcon fontSize="small" /> },
  'asset':          { label: 'Asset',            color: 'warning', icon: <InventoryIcon fontSize="small" /> },
  'medical-supply': { label: 'Medical Supply',   color: 'success', icon: <MedicalServicesIcon fontSize="small" /> },
};

export const RecycleBinPage = () => {
  const { items, loading, fetchItems, restoreItem, permanentDelete, emptyBin } = useRecycleBin();
  const [typeFilter, setTypeFilter] = useState<RecycleBinItemType | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<RecycleBinItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RecycleBinItem | null>(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter);

  const counts = {
    all:              items.length,
    personnel:        items.filter(i => i.type === 'personnel').length,
    asset:            items.filter(i => i.type === 'asset').length,
    'medical-supply': items.filter(i => i.type === 'medical-supply').length,
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setBusy(true);
    await restoreItem(restoreTarget.id);
    setBusy(false);
    setRestoreTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    await permanentDelete(deleteTarget.id);
    setBusy(false);
    setDeleteTarget(null);
  };

  const handleEmpty = async () => {
    setBusy(true);
    const type = typeFilter === 'all' ? undefined : typeFilter;
    await emptyBin(type);
    setBusy(false);
    setEmptyConfirm(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Recycle Bin</Typography>
          <Typography variant="body2" color="text.secondary">
            Restore deleted records or permanently remove them.
          </Typography>
        </Box>
        {filtered.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setEmptyConfirm(true)}
          >
            Empty {typeFilter !== 'all' ? TYPE_META[typeFilter]?.label : 'All'}
          </Button>
        )}
      </Box>

      {/* Filter tabs */}
      <Box mb={2} mt={2}>
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_, v) => { if (v !== null) setTypeFilter(v); }}
          size="small"
        >
          <ToggleButton value="all">All ({counts.all})</ToggleButton>
          <ToggleButton value="personnel">
            <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />Personnel ({counts.personnel})
          </ToggleButton>
          <ToggleButton value="asset">
            <InventoryIcon fontSize="small" sx={{ mr: 0.5 }} />Assets ({counts.asset})
          </ToggleButton>
          <ToggleButton value="medical-supply">
            <MedicalServicesIcon fontSize="small" sx={{ mr: 0.5 }} />Medical ({counts['medical-supply']})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Deleted By</TableCell>
              <TableCell>Deleted At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <Typography fontSize={36} mb={1}>🗑️</Typography>
                  <Typography variant="body2">Recycle bin is empty</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.map((item, idx) => {
              const meta = TYPE_META[item.type];
              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={meta?.icon as any}
                      label={meta?.label ?? item.type}
                      color={meta?.color ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{item.deletedBy}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(item.deletedAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center">
                      <Tooltip title="Restore">
                        <IconButton size="small" color="primary" onClick={() => setRestoreTarget(item)}>
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete permanently">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Restore Confirm */}
      <Dialog open={!!restoreTarget} onClose={() => setRestoreTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Restore Item?</DialogTitle>
        <DialogContent>
          <Typography>
            Restore <strong>{restoreTarget?.name}</strong> back to its original location?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreTarget(null)}>Cancel</Button>
          <Button variant="contained" color="primary" startIcon={<RestoreIcon />} onClick={handleRestore} disabled={busy}>
            {busy ? 'Restoring…' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permanent Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Permanently?</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteForeverIcon />} onClick={handleDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Empty Bin Confirm */}
      <Dialog open={emptyConfirm} onClose={() => setEmptyConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Empty Recycle Bin?</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete all <strong>{filtered.length}</strong>{' '}
            {typeFilter !== 'all' ? TYPE_META[typeFilter]?.label.toLowerCase() : ''} item(s)?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmptyConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteSweepIcon />} onClick={handleEmpty} disabled={busy}>
            {busy ? 'Deleting…' : 'Empty Bin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
