import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/Person';

export const NewUserProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await api.patch('/auth/complete-profile', { displayName: displayName.trim() });
      await refreshUser();
      toast.success('Profile set up! Welcome.');
    } catch {
      toast.error('Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
    }}>
      <Paper elevation={4} sx={{ width: '100%', maxWidth: 440, borderRadius: 3, overflow: 'hidden' }}>

        {/* Header band */}
        <Box sx={{ bgcolor: '#1e293b', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box component="img" src="/logo.png" alt="PCG"
            sx={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="white" lineHeight={1.2}>
              PCG Medical
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Eastern Visayas
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 3, py: 3 }}>
          {/* Avatar + welcome */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {user?.photoURL
              ? <Avatar src={user.photoURL} sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, border: '3px solid', borderColor: 'primary.main' }} />
              : <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: 36 }} />
                </Avatar>}
            <Typography variant="h6" fontWeight={700}>Create Your Profile</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              You're almost in. Set your display name to continue.
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Display Name"
              fullWidth
              size="small"
              autoFocus
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={saving}
              placeholder="e.g. SN2 Juan Dela Cruz"
              helperText="This name will be visible to other users in the system."
              inputProps={{ maxLength: 60 }}
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Email"
              fullWidth
              size="small"
              value={user?.email || ''}
              disabled
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={saving || !displayName.trim()}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            Your account will be reviewed by an administrator.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
