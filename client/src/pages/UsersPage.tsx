/**
 * UsersPage
 * Admin-only page for managing system users and their roles
 */

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useUsers } from '../hooks/useUsers';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import type { User, UserRole } from '@shared/types/auth.types';
import type { PersonnelRequest } from '@shared/types/personnelRequest.types';

const ROLE_META: Record<UserRole, { label: string; color: 'error' | 'warning' | 'default'; description: string }> = {
  admin:   { label: 'Admin',   color: 'error',   description: 'Full system access — create, edit, delete everything' },
  medical: { label: 'Medical', color: 'warning',  description: 'Can read personnel and manage medical records' },
  viewer:  { label: 'Viewer',  color: 'default',  description: 'Read-only access to personnel and analytics' },
};

const StatCard = ({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
    <Box sx={{ bgcolor: color + '18', borderRadius: 2, p: 1.2, display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <Box mb={0.75}>
    <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
  </Box>
);

export const UsersPage = () => {
  const { users, loading, fetchUsers, updateRole, deleteUser } = useUsers();
  const [search, setSearch] = useState('');

  // Pending personnel requests
  const [pendingRequests, setPendingRequests] = useState<PersonnelRequest[]>([]);
  const [reviewTarget, setReviewTarget] = useState<PersonnelRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectField, setShowRejectField] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

  // Role edit dialog
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    api.get('/personnel-requests?status=pending')
      .then((res: any) => setPendingRequests(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => {});
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total:   users.length,
    admin:   users.filter(u => u.role === 'admin').length,
    medical: users.filter(u => u.role === 'medical').length,
    viewer:  users.filter(u => u.role === 'viewer').length,
  };

  const openRoleDialog = (user: User) => {
    setRoleTarget(user);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!roleTarget) return;
    setSaving(true);
    await updateRole(roleTarget.uid, selectedRole);
    setSaving(false);
    setRoleTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteUser(deleteTarget.uid);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openReview = (userId: string) => {
    const req = pendingRequests.find(r => r.userId === userId);
    if (req) { setReviewTarget(req); setRejectReason(''); setShowRejectField(false); }
  };

  const handleApprove = async () => {
    if (!reviewTarget) return;
    setReviewSaving(true);
    try {
      await api.patch(`/personnel-requests/${reviewTarget.id}/approve`);
      setPendingRequests(prev => prev.filter(r => r.id !== reviewTarget.id));
      setReviewTarget(null);
      toast.success('Profile approved — personnel record created.');
    } catch {
      toast.error('Failed to approve request.');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleReject = async () => {
    if (!reviewTarget) return;
    setReviewSaving(true);
    try {
      await api.patch(`/personnel-requests/${reviewTarget.id}/reject`, { reason: rejectReason });
      setPendingRequests(prev => prev.filter(r => r.id !== reviewTarget.id));
      setReviewTarget(null);
      toast.success('Request rejected.');
    } catch {
      toast.error('Failed to reject request.');
    } finally {
      setReviewSaving(false);
    }
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d as string).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={700} gutterBottom>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage system access and roles for all registered users.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard icon={<PeopleIcon sx={{ color: '#6366f1' }} />} label="Total Users" value={counts.total} color="#6366f1" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard icon={<AdminPanelSettingsIcon sx={{ color: '#ef4444' }} />} label="Admins" value={counts.admin} color="#ef4444" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard icon={<LocalHospitalIcon sx={{ color: '#f59e0b' }} />} label="Medical" value={counts.medical} color="#f59e0b" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard icon={<VisibilityIcon sx={{ color: '#6b7280' }} />} label="Viewers" value={counts.viewer} color="#6b7280" />
        </Grid>
      </Grid>

      {/* Pending requests banner */}
      {pendingRequests.length > 0 && (
        <Paper sx={{ mb: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: pendingRequests.length > 0 ? '1px solid #fde68a' : 'none' }}>
            <HourglassTopIcon sx={{ color: '#d97706', fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600} color="warning.dark">
              {pendingRequests.length} pending profile submission{pendingRequests.length > 1 ? 's' : ''} awaiting review
            </Typography>
          </Box>
          {pendingRequests.map(req => (
            <Box key={req.id} sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fde68a', '&:last-child': { borderBottom: 'none' } }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{req.userName}</Typography>
                <Typography variant="caption" color="text.secondary">{req.userEmail} · {new Date(req.submittedAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
              </Box>
              <Button size="small" variant="outlined" color="warning"
                onClick={() => { setReviewTarget(req); setRejectReason(''); setShowRejectField(false); }}>
                Review
              </Button>
            </Box>
          ))}
        </Paper>
      )}

      {/* Search */}
      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>#</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Serial #</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No users found
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.map((user, idx) => {
              const meta = ROLE_META[user.role] ?? ROLE_META.viewer;
              const hasPending = pendingRequests.some(r => r.userId === user.uid);
              return (
                <TableRow key={user.uid} hover sx={{ bgcolor: hasPending ? '#fffbeb' : undefined }}>
                  <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 34, height: 34, fontSize: 14 }}>
                        {user.displayName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.displayName || '—'}
                        </Typography>
                        {hasPending && (
                          <Chip label="Pending Profile" size="small" color="warning" sx={{ height: 18, fontSize: 10, mt: 0.25 }} />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={meta.label}
                      color={meta.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {user.serialNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(user.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(user.lastLogin)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {hasPending && (
                        <Tooltip title="Review profile submission">
                          <IconButton size="small" color="warning" onClick={() => openReview(user.uid)}>
                            <HourglassTopIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Change role">
                        <IconButton size="small" onClick={() => openRoleDialog(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete user">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(user)}>
                          <DeleteIcon fontSize="small" />
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

      {/* Role Edit Dialog */}
      <Dialog open={!!roleTarget} onClose={() => setRoleTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {roleTarget && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar src={roleTarget.photoURL} sx={{ width: 40, height: 40 }}>
                {roleTarget.displayName?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={600}>{roleTarget.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">{roleTarget.email}</Typography>
              </Box>
            </Box>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={e => setSelectedRole(e.target.value as UserRole)}
            >
              {(Object.keys(ROLE_META) as UserRole[]).map(role => (
                <MenuItem key={role} value={role}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{ROLE_META[role].label}</Typography>
                    <Typography variant="caption" color="text.secondary">{ROLE_META[role].description}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
            The new role takes effect the next time the user logs in.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={saving || selectedRole === roleTarget?.role}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.displayName || deleteTarget?.email}</strong>?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Review Dialog */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" component="span" fontWeight={700}>Profile Submission Review</Typography>
            {reviewTarget && (
              <Typography variant="caption" color="text.secondary" display="block">
                Submitted by {reviewTarget.userName} ({reviewTarget.userEmail}) on {new Date(reviewTarget.submittedAt).toLocaleString('en-PH')}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {reviewTarget && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>Identity</Typography>
                  <Grid container spacing={0.5}>
                    <Grid size={6}><InfoRow label="Serial Number" value={reviewTarget.data.serialNumber} /></Grid>
                    <Grid size={6}><InfoRow label="Rank" value={reviewTarget.data.rank} /></Grid>
                    <Grid size={12}><InfoRow label="Full Name" value={`${reviewTarget.data.firstName} ${reviewTarget.data.middleName ? reviewTarget.data.middleName + ' ' : ''}${reviewTarget.data.lastName}`} /></Grid>
                    <Grid size={6}><InfoRow label="Birthdate" value={reviewTarget.data.birthdate ? new Date(reviewTarget.data.birthdate).toLocaleDateString('en-PH') : undefined} /></Grid>
                    <Grid size={6}><InfoRow label="Gender" value={reviewTarget.data.gender} /></Grid>
                    <Grid size={6}><InfoRow label="Blood Type" value={reviewTarget.data.bloodType} /></Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="success.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>Service</Typography>
                  <Grid container spacing={0.5}>
                    <Grid size={12}><InfoRow label="Unit" value={reviewTarget.data.unit} /></Grid>
                    <Grid size={6}><InfoRow label="Date Joined" value={reviewTarget.data.dateJoined ? new Date(reviewTarget.data.dateJoined).toLocaleDateString('en-PH') : undefined} /></Grid>
                    <Grid size={6}><InfoRow label="Process Type" value={reviewTarget.data.processType} /></Grid>
                    {reviewTarget.data.designation && <Grid size={12}><InfoRow label="Designation" value={reviewTarget.data.designation} /></Grid>}
                    {reviewTarget.data.ete && <Grid size={6}><InfoRow label="ETE" value={new Date(reviewTarget.data.ete).toLocaleDateString('en-PH')} /></Grid>}
                    {reviewTarget.data.reEnlistmentStatus && <Grid size={6}><InfoRow label="Re-enlistment Status" value={reviewTarget.data.reEnlistmentStatus} /></Grid>}
                    {reviewTarget.data.cadProgram && <Grid size={12}><InfoRow label="CAD Program" value={reviewTarget.data.cadProgram} /></Grid>}
                  </Grid>
                </Paper>
              </Grid>
              <Grid size={12}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="secondary.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>Contact</Typography>
                  <Grid container spacing={0.5}>
                    {reviewTarget.data.contactNumber && <Grid size={6}><InfoRow label="Contact Number" value={reviewTarget.data.contactNumber} /></Grid>}
                    {reviewTarget.data.email && <Grid size={6}><InfoRow label="Email" value={reviewTarget.data.email} /></Grid>}
                    {reviewTarget.data.permanentAddress && <Grid size={12}><InfoRow label="Permanent Address" value={reviewTarget.data.permanentAddress} /></Grid>}
                  </Grid>
                </Paper>
              </Grid>
              {showRejectField && (
                <Grid size={12}>
                  <Divider sx={{ my: 0.5 }} />
                  <TextField
                    label="Rejection Reason (optional)"
                    size="small" fullWidth multiline rows={2}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why this submission is being rejected..."
                    autoFocus
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button onClick={() => setReviewTarget(null)}>Close</Button>
          <Stack direction="row" gap={1}>
            {!showRejectField ? (
              <Button variant="outlined" color="error" startIcon={<CancelIcon />}
                onClick={() => setShowRejectField(true)} disabled={reviewSaving}>
                Reject
              </Button>
            ) : (
              <Button variant="contained" color="error" startIcon={<CancelIcon />}
                onClick={handleReject} disabled={reviewSaving}>
                {reviewSaving ? 'Rejecting…' : 'Confirm Reject'}
              </Button>
            )}
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
              onClick={handleApprove} disabled={reviewSaving}>
              {reviewSaving ? 'Approving…' : 'Approve & Create Record'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
