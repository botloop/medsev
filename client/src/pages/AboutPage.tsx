import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const FEATURES = [
  '👥 Personnel Management',
  '🏥 Medical Tracking (8-step)',
  '📊 Analytics Dashboard',
  '🔐 Role-Based Access',
  '📝 Audit Logging',
  '📤 Document Upload',
];

const ROSTER_DEFAULT = [
  { name:'ENS CAMILLE ANNE V BORBE',       serial:'O-2660 PCG',  designation:'A/CO, MEDS-EV / NPAD',               remarks:'Duty' },
  { name:'ENS KEINTZ ROLAND C LIBETARIO',  serial:'O-2666 PCG',  designation:'XO / Operations Officer',             remarks:'Duty' },
  { name:'SN1 Lyndon Harlie F Lim',        serial:'012544 PCG',  designation:'A/POIC Operations',                   remarks:'Duty' },
  { name:'SN1 Rembrant H Oria',            serial:'013330 PCG',  designation:'A/POIC Admin & Logistics',            remarks:'Duty' },
  { name:'SN2 Samuelson G Acosta',         serial:'018347 PCG',  designation:'Petty Cash Custodian / Admin',        remarks:'Schooling' },
  { name:'SN2 Adonis K Balantican',        serial:'018428 PCG',  designation:'Operations',                          remarks:'Duty' },
  { name:'SN2 Carlo F Garcia',             serial:'018601 PCG',  designation:'Ambulance Driver',                    remarks:'Passes' },
  { name:'ASN Angelito J Hidalgo',         serial:'021296 PCG',  designation:'Treatment & Records',                 remarks:'RNR' },
  { name:'ASN Arvin S Ecot',               serial:'10920-C PCG', designation:'Ambulance Driver / Logistics',        remarks:'Duty' },
];

const STATUS_OPTIONS = ['Duty', 'Schooling', 'Passes', 'RNR', 'Leave', 'TAD', 'Sick', 'AWOL'];
const REMARK_COLOR: Record<string, 'success'|'warning'|'info'|'default'|'error'> = {
  Duty:'success', Schooling:'info', Passes:'warning', RNR:'default',
  Leave:'default', TAD:'info', Sick:'warning', AWOL:'error',
};

function loadStatuses(): Record<number, string> {
  try { const s = localStorage.getItem('meds-ev-roster-statuses'); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}

export const AboutPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [statuses, setStatuses] = useState<Record<number, string>>(loadStatuses);

  const updateStatus = (index: number, value: string) => {
    const updated = { ...statuses, [index]: value };
    setStatuses(updated);
    localStorage.setItem('meds-ev-roster-statuses', JSON.stringify(updated));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      {/* ── Compact header ── */}
      <Paper elevation={0} sx={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#fff', px: 3, py: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography fontSize={28} lineHeight={1}>⚓</Typography>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>Philippine Coast Guard</Typography>
            <Typography variant="caption" sx={{ opacity: .85 }}>Personnel Management System — Medical Station Eastern Visayas</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label="v1.0.0 · Feb 2026" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 11 }} />
          <Chip label={`Role: ${user?.role ?? 'Guest'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }} />
        </Box>
      </Paper>

      {/* ── Main two-column body ── */}
      <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>

        {/* Left column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box display="flex" flexDirection="column" gap={1.5} height="100%">

            {/* Mission + Vision */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" display="block" mb={0.25}>🎯 MISSION</Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                    Secure, efficient platform for managing PCG personnel records, medical status, and administrative data.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="secondary.main" display="block" mb={0.25}>🔭 VISION</Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                    Gold standard in military personnel management, leveraging modern technology for Coast Guard operations.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Features */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>KEY FEATURES</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {FEATURES.map(f => (
                  <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: 11, height: 24 }} />
                ))}
              </Box>
            </Paper>

            {/* Contact */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.75}>CONTACT</Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Typography variant="caption" color="text.secondary">📍 Brgy 99 Diit, Tacloban City, Leyte</Typography>
                <Typography variant="caption">
                  📞 <Box component="a" href="tel:09934532670" sx={{ color: 'primary.main', textDecoration: 'none' }}>09934532670</Box>
                  {'  '}·{'  '}
                  ✉️ <Box component="a" href="mailto:cgmedclev@gmail.com" sx={{ color: 'primary.main', textDecoration: 'none' }}>cgmedclev@gmail.com</Box>
                </Typography>
              </Box>
            </Paper>

            {/* System info */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.75}>SYSTEM INFO</Typography>
              <Grid container spacing={0.5}>
                {[
                  ['Stack', 'React · Node.js · TypeScript · Firebase'],
                  ['Storage', 'Cloudinary · Firestore'],
                  ['Permissions', `${user?.permissions.length ?? 0} active`],
                  ['Environment', 'Development'],
                ].map(([k, v]) => (
                  <Grid size={{ xs: 6 }} key={k}>
                    <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                    <Typography variant="caption" fontWeight={600}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>

          </Box>
        </Grid>

        {/* Right column — Roster */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box px={2} py={1} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Roster of Troops</Typography>
                <Typography variant="caption" color="text.secondary">Medical Station — Eastern Visayas (MEDS-EV)</Typography>
              </Box>
              {isAdmin && <Chip label="Admin · status editable" size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />}
            </Box>
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['#', 'Name / Serial', 'Designation', 'Status'].map(h => (
                      <TableCell key={h} sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: 12, py: 0.75, whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROSTER_DEFAULT.map((row, i) => {
                    const status = statuses[i] ?? row.remarks;
                    return (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 11, py: 0.5 }}>{i + 1}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} fontSize={12} lineHeight={1.3}>{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary" fontSize={10}>{row.serial}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography variant="caption" fontSize={11}>{row.designation}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5, minWidth: 110 }}>
                          {isAdmin ? (
                            <Select
                              size="small"
                              value={status}
                              onChange={e => updateStatus(i, e.target.value)}
                              sx={{ fontSize: 11, height: 24, minWidth: 100 }}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Chip size="small" label={status} color={REMARK_COLOR[status] ?? 'default'} variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Footer ── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography variant="caption" color="error.main" fontWeight={600}>
          🔒 FOR OFFICIAL USE ONLY — Protected under PCG Security Directive 2025-01. All access is logged.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          © 2026 Philippine Coast Guard — Personnel Management System
        </Typography>
      </Box>

      <Divider />
    </Box>
  );
};
