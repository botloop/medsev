import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import SecurityIcon from '@mui/icons-material/Security';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try { await loginWithGoogle(); navigate('/dashboard'); } catch {}
  };

  return (
    <Box sx={{ minHeight:'100vh', bgcolor:'grey.100' }}>
      <Box sx={{ bgcolor:'#7f1d1d', color:'white', py:1, px:2, textAlign:'center',
        fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:0.5 }}>
        <SecurityIcon sx={{ fontSize:14 }} />
        FOR OFFICIAL USE ONLY — PHILIPPINE COAST GUARD SECURITY DIRECTIVE 2025-01
        <SecurityIcon sx={{ fontSize:14 }} />
      </Box>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 40px)', p:3 }}>
        <Paper elevation={4} sx={{ width:'100%', maxWidth:420, p:4, borderRadius:3 }}>
          <Box textAlign="center" mb={4}>
            <Box component="img" src="/logo.png" alt="PCG Medical Logo"
              sx={{ width:100, height:100, borderRadius:'50%', mb:1.5, boxShadow:3 }} />
            <Typography variant="h5" fontWeight={700}>Personnel Management System</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>PCG Medical — Eastern Visayas</Typography>
          </Box>

          <Button fullWidth variant="outlined" size="large" disabled={loading}
            onClick={handleGoogleSignIn}
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
            sx={{ justifyContent:'flex-start', gap:1, textTransform:'none', fontSize:15 }}>
            Sign in with Google
          </Button>

          <Divider sx={{ my:3 }} />
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            Authorized Personnel Only · Per CG Security Directive 2025-01
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};
