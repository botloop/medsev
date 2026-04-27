/**
 * Deployment Readiness Dashboard
 * Automatically synthesizes medical tracking data + document uploads
 * to determine each personnel's "Fit for Duty" status.
 *
 * Criteria (fully automated, no manual input required):
 *  ✅ All 8 medical steps completed
 *  ✅ Medically cleared (medicalStatus.cleared)
 *  ✅ Medical clearance not expired (cleared within 12 months)
 *  ✅ Has at least one uploaded medical document
 *  ⚠️  Clearance expiring within 30 days → Conditional
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Personnel } from '@shared/types/personnel.types';
import { useAnalytics } from '../hooks/useAnalytics';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Cell,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLEARANCE_VALIDITY_DAYS = 365;   // 1 year
const EXPIRY_WARNING_DAYS     = 30;    // warn at 30 days left

const STEP_SHORT: Record<string, string> = {
  step1: 'Med Eval', step2: 'Lab Exams',  step3: 'Routing Slip',
  step4: 'Dental Ref', step5: 'Dental Proc', step6: 'Submit Docs',
  step7: 'Med Clear', step8: 'Done',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FitStatus = 'Fit for Duty' | 'Conditional' | 'Not Ready';

interface ReadinessRecord {
  id: string;
  name: string;
  rank: string;
  serial: string;
  unit: string;
  status: FitStatus;
  completedSteps: number;
  cleared: boolean;
  hasDocuments: boolean;
  clearedDate: string | null;
  daysUntilExpiry: number | null;
  missing: string[];
  warnings: string[];
}

// ─── Assessment logic ─────────────────────────────────────────────────────────

function assessReadiness(p: Personnel): ReadinessRecord {
  const ms = p.medicalStatus as Record<string, any>;
  const missing: string[]  = [];
  const warnings: string[] = [];

  // 1. Step completion
  let completedSteps = 0;
  let hasDocuments   = false;
  for (let i = 1; i <= 8; i++) {
    const step = ms?.[`step${i}`];
    if (step?.completed) completedSteps++;
    if (step?.files?.length > 0) hasDocuments = true;
  }

  // 2. Medical clearance
  const cleared     = !!ms?.cleared;
  const clearedDate = ms?.clearedDate ? String(ms.clearedDate) : null;

  // 3. Expiry check
  let daysUntilExpiry: number | null = null;
  if (cleared && clearedDate) {
    const expiry = new Date(clearedDate);
    expiry.setDate(expiry.getDate() + CLEARANCE_VALIDITY_DAYS);
    daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
  }

  // 4. Build missing / warnings
  if (completedSteps < 8) missing.push(`${8 - completedSteps} step(s) incomplete`);
  if (!cleared)           missing.push('Pending medical clearance');
  if (!hasDocuments)      missing.push('No documents uploaded');

  if (daysUntilExpiry !== null && daysUntilExpiry <= 0)
    missing.push('Medical clearance EXPIRED');
  else if (daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS)
    warnings.push(`Clearance expires in ${daysUntilExpiry} day(s)`);

  // 5. Determine status
  let status: FitStatus;
  if (
    cleared && completedSteps === 8 && hasDocuments &&
    (daysUntilExpiry === null || daysUntilExpiry > EXPIRY_WARNING_DAYS)
  ) {
    status = 'Fit for Duty';
  } else if (
    completedSteps >= 5 &&
    (daysUntilExpiry === null || daysUntilExpiry > 0)
  ) {
    status = 'Conditional';
  } else {
    status = 'Not Ready';
  }

  return {
    id: p.id,
    name: `${p.lastName}, ${p.firstName}${p.middleName ? ' ' + p.middleName.charAt(0) + '.' : ''}`,
    rank: p.rank,
    serial: p.serialNumber,
    unit: p.unit,
    status,
    completedSteps,
    cleared,
    hasDocuments,
    clearedDate,
    daysUntilExpiry,
    missing,
    warnings,
  };
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<FitStatus, 'success'|'warning'|'error'> = {
  'Fit for Duty': 'success',
  'Conditional':  'warning',
  'Not Ready':    'error',
};
const STATUS_HEX: Record<FitStatus, string> = {
  'Fit for Duty': '#16a34a',
  'Conditional':  '#d97706',
  'Not Ready':    '#dc2626',
};
const STATUS_ICON: Record<FitStatus, string> = {
  'Fit for Duty': '🟢',
  'Conditional':  '🟡',
  'Not Ready':    '🔴',
};

// ─── Collapsible section table (reused from analytics) ────────────────────────

const SectionTable = ({ title, rows, defaultOpen = false }: {
  title: string;
  rows: { label: string; value: number | string; note?: string }[];
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: open ? '1px solid' : 'none',
          borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
      >
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Count</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.label} hover>
                <TableCell>{row.label}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700}>{row.value}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>
                  {row.note ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </TableContainer>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DeploymentReadinessPage = () => {
  const [records, setRecords]           = useState<ReadinessRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<FitStatus | 'All'>('All');
  const [reenlistByMonthOpen, setReenlistByMonthOpen] = useState(false);
  const [joinYearOpen, setJoinYearOpen] = useState(false);
  const { overview, joinYear, medicalStatus, reenlistment, reenlistmentByMonth, fetchAll } = useAnalytics();

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/personnel?limit=200');
      const list: Personnel[] = res.data ?? res ?? [];
      setRecords(list.map(assessReadiness));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); fetchAll(); }, []);

  // ── Derived stats ──
  const total       = records.length;
  const fit         = records.filter(r => r.status === 'Fit for Duty').length;
  const conditional = records.filter(r => r.status === 'Conditional').length;
  const notReady    = records.filter(r => r.status === 'Not Ready').length;
  const expiring    = records.filter(r => r.warnings.length > 0).length;
  const pct         = total > 0 ? Math.round((fit / total) * 100) : 0;

  const stepData = Array.from({ length: 8 }, (_, i) => ({
    short: `S${i + 1}`,
    step:  STEP_SHORT[`step${i + 1}`],
    count: records.filter(r => r.completedSteps > i).length,
  }));

  const gaugeColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  const displayed = filterStatus === 'All' ? records
    : records.filter(r => r.status === filterStatus);

  const sorted = [...displayed].sort((a, b) => {
    const o: Record<FitStatus, number> = { 'Fit for Duty': 0, 'Conditional': 1, 'Not Ready': 2 };
    return o[a.status] - o[b.status];
  });

  // ── Analytics derived ──
  const anaTotal = overview?.totalPersonnel || 0;
  const pctOf    = (n: number) => anaTotal ? `${((n / anaTotal) * 100).toFixed(1)}%` : '—';
  const medTotal = (medicalStatus?.step1||0)+(medicalStatus?.step2||0)+(medicalStatus?.step3||0)+
    (medicalStatus?.step4||0)+(medicalStatus?.step5||0)+(medicalStatus?.step6||0)+
    (medicalStatus?.step7||0)+(medicalStatus?.step8||0);
  const medPct = (n: number) => medTotal ? `${((n / medTotal) * 100).toFixed(1)}%` : '—';
  const reTotal = (reenlistment?.firstTerm||0)+(reenlistment?.reenlisted||0)+(reenlistment?.eligible||0);
  const rePct   = (n: number) => reTotal ? `${((n / reTotal) * 100).toFixed(1)}%` : '—';

  if (loading) return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={300}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>

      {/* ── Header ── */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={800}>🎯 Deployment Readiness Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">
            Automated — synthesizes medical tracking, clearance status &amp; document uploads
            {lastUpdated && ` · Last refreshed ${lastUpdated.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`}
          </Typography>
        </Box>
        <Chip label="↻ Refresh" onClick={loadData} variant="outlined" size="small" sx={{ cursor: 'pointer', fontWeight: 600, mt: 0.5 }} />
      </Box>

      {/* ── Expiry alert ── */}
      {expiring > 0 && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          <strong>{expiring} personnel</strong> have medical clearances expiring within {EXPIRY_WARNING_DAYS} days — schedule renewal.
        </Alert>
      )}

      {/* ── Summary cards ── */}
      <Grid container spacing={1.5}>
        {[
          { label: 'Total Strength',  value: total,       sub: 'personnel on record',         hex: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Fit for Duty',    value: fit,         sub: 'all criteria met',            hex: '#16a34a', bg: '#f0fdf4' },
          { label: 'Conditional',     value: conditional, sub: '5+ steps / near expiry',      hex: '#d97706', bg: '#fffbeb' },
          { label: 'Not Ready',       value: notReady,    sub: 'immediate action needed',     hex: '#dc2626', bg: '#fef2f2' },
        ].map(c => (
          <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: c.bg, border: `1px solid ${c.hex}33`, height: '100%' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: c.hex, lineHeight: 1 }}>{c.value}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: c.hex, mt: 0.25 }}>{c.label}</Typography>
              <Typography variant="caption" color="text.secondary">{c.sub}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts row ── */}
      <Grid container spacing={1.5}>

        {/* Readiness gauge */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Unit Readiness</Typography>

            <Box sx={{ width: '100%', height: 130, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="85%" innerRadius="62%" outerRadius="90%"
                  startAngle={180} endAngle={0} data={[{ value: pct, fill: gaugeColor }]}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f1f5f9' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: gaugeColor, lineHeight: 1 }}>{pct}%</Typography>
                <Typography variant="caption" color="text.secondary">Fit for Duty</Typography>
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={0.5} mt={1.5}>
              {(['Fit for Duty', 'Conditional', 'Not Ready'] as FitStatus[]).map(s => (
                <Box key={s} display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_HEX[s] }} />
                    <Typography variant="caption">{s}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight={700}>
                    {records.filter(r => r.status === s).length}
                    <Typography component="span" variant="caption" color="text.secondary">
                      {' '}({total > 0 ? Math.round(records.filter(r => r.status === s).length / total * 100) : 0}%)
                    </Typography>
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Criteria legend */}
            <Box mt={1.5} pt={1.5} borderTop="1px solid" borderColor="divider">
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>FIT FOR DUTY REQUIRES</Typography>
              {[
                'All 8 medical steps complete',
                'Medically cleared',
                'Clearance not expired (≤12 mo)',
                'Documents uploaded',
              ].map(c => (
                <Typography key={c} variant="caption" color="text.secondary" display="block">✔ {c}</Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Step completion bar chart */}
        <Grid size={{ xs: 12, sm: 8 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Medical Step Completion by Personnel</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Bars show how many personnel have completed each step. Drop-offs reveal bottlenecks.
            </Typography>
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={stepData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, total || 1]} allowDecimals={false} />
                <RTooltip
                  formatter={(val: number, _: any, props: any) => [`${val} personnel`, props.payload?.step]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {stepData.map((_, i) => (
                    <Cell key={i} fill={i < 4 ? '#2563eb' : i < 6 ? '#7c3aed' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Box display="flex" gap={2} justifyContent="center" mt={0.5}>
              {[['#2563eb', 'S1–S4 Medical'], ['#7c3aed', 'S5–S6 Dental'], ['#16a34a', 'S7–S8 Final']].map(([c, l]) => (
                <Box key={l} display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c }} />
                  <Typography variant="caption" color="text.secondary">{l}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Personnel table ── */}
      <Paper variant="outlined">
        <Box px={2} py={1} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} borderBottom="1px solid" borderColor="divider">
          <Typography variant="subtitle2" fontWeight={700}>Personnel Readiness Roster</Typography>
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {(['All', 'Fit for Duty', 'Conditional', 'Not Ready'] as const).map(s => (
              <Chip
                key={s}
                label={s === 'All' ? `All (${total})` : `${STATUS_ICON[s as FitStatus]} ${s}: ${records.filter(r => r.status === s).length}`}
                size="small"
                onClick={() => setFilterStatus(s)}
                variant={filterStatus === s ? 'filled' : 'outlined'}
                color={s === 'All' ? 'default' : STATUS_COLOR[s as FitStatus]}
                sx={{ fontSize: 10, height: 22, cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['#', 'Name / Serial', 'Rank / Unit', 'Steps', 'Progress', 'Cleared', 'Docs', 'Expiry', 'Status', 'Action Needed'].map(h => (
                  <TableCell key={h} sx={{ bgcolor: '#1e293b', color: '#fff', fontWeight: 700, fontSize: 11, py: 0.75, whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((r, i) => (
                <TableRow
                  key={r.id}
                  sx={{
                    bgcolor: r.status === 'Fit for Duty' ? '#f0fdf4'
                           : r.status === 'Conditional'  ? '#fffbeb'
                           : '#fef2f2',
                    '&:hover': { filter: 'brightness(0.97)' },
                  }}
                >
                  <TableCell sx={{ fontSize: 11, color: 'text.secondary', py: 0.5 }}>{i + 1}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} fontSize={12} lineHeight={1.2}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={10}>{r.serial}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} display="block" fontSize={11}>{r.rank}</Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={10} noWrap>{r.unit}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 700, py: 0.5, whiteSpace: 'nowrap',
                    color: r.completedSteps === 8 ? 'success.main' : r.completedSteps >= 5 ? 'warning.main' : 'error.main' }}>
                    {r.completedSteps}/8
                  </TableCell>
                  <TableCell sx={{ py: 0.5, minWidth: 70 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(r.completedSteps / 8) * 100}
                      color={r.completedSteps === 8 ? 'success' : r.completedSteps >= 5 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: 14 }}>
                    {r.cleared ? '✅' : '❌'}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, textAlign: 'center', fontSize: 14 }}>
                    {r.hasDocuments ? '📎' : '—'}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                    {r.daysUntilExpiry === null ? (
                      <Typography variant="caption" color="text.disabled">N/A</Typography>
                    ) : r.daysUntilExpiry <= 0 ? (
                      <Chip label="EXPIRED" size="small" color="error" sx={{ fontSize: 9, height: 18 }} />
                    ) : r.daysUntilExpiry <= EXPIRY_WARNING_DAYS ? (
                      <Chip label={`${r.daysUntilExpiry}d left`} size="small" color="warning" sx={{ fontSize: 9, height: 18 }} />
                    ) : (
                      <Typography variant="caption" color="success.main" fontSize={10}>
                        {r.daysUntilExpiry}d left
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Chip
                      label={`${STATUS_ICON[r.status]} ${r.status}`}
                      size="small"
                      color={STATUS_COLOR[r.status]}
                      sx={{ fontSize: 10, height: 20, fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, maxWidth: 180 }}>
                    {r.warnings.length > 0 && (
                      <Typography variant="caption" color="warning.main" fontSize={10} display="block">
                        ⚠ {r.warnings.join(' · ')}
                      </Typography>
                    )}
                    {r.missing.length > 0 ? (
                      <Typography variant="caption" color="text.secondary" fontSize={10}>
                        {r.missing.join(' · ')}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="success.main" fontSize={10} fontWeight={600}>
                        All requirements met
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                    No records match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box px={2} py={0.75} borderTop="1px solid" borderColor="divider" display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Typography variant="caption" color="text.secondary">
            🔄 Live Firestore data · Clearance validity: {CLEARANCE_VALIDITY_DAYS} days · Warning threshold: {EXPIRY_WARNING_DAYS} days
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Showing {sorted.length} of {total} personnel
          </Typography>
        </Box>
      </Paper>

      {/* ── Statistics (from analytics) ── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionTable
            title="📊 Summary Statistics"
            rows={[
              { label: 'Total Personnel',  value: overview?.totalPersonnel  || 0, note: '100%' },
              { label: 'Active Records',   value: overview?.activeRecords   || 0, note: pctOf(overview?.activeRecords   || 0) },
              { label: 'Lab Results',      value: overview?.totalLabResults || 0, note: pctOf(overview?.totalLabResults || 0) },
              { label: 'Medical Cleared',  value: overview?.medicalCleared  || 0, note: pctOf(overview?.medicalCleared  || 0) },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Box
              onClick={() => setReenlistByMonthOpen(o => !o)}
              sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: reenlistByMonthOpen ? '1px solid' : 'none',
                borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
            >
              <Typography variant="subtitle2" fontWeight={700}>🔄 Re-enlistment Completion by Month ({new Date().getFullYear()})</Typography>
              <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
                {reenlistByMonthOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={reenlistByMonthOpen}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reenlistmentByMonth.map(row => (
                    <TableRow key={row.month} hover>
                      <TableCell>{row.monthName}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={row.count > 0 ? 700 : 400} color={row.count > 0 ? 'text.primary' : 'text.disabled'}>
                          {row.count}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reenlistmentByMonth.length > 0 && (
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{reenlistmentByMonth.reduce((s, r) => s + r.count, 0)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Collapse>
          </TableContainer>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionTable
            title="💊 Medical Status Distribution"
            rows={[
              { label: 'Step 1', value: medicalStatus?.step1 || 0, note: medPct(medicalStatus?.step1 || 0) },
              { label: 'Step 2', value: medicalStatus?.step2 || 0, note: medPct(medicalStatus?.step2 || 0) },
              { label: 'Step 3', value: medicalStatus?.step3 || 0, note: medPct(medicalStatus?.step3 || 0) },
              { label: 'Step 4', value: medicalStatus?.step4 || 0, note: medPct(medicalStatus?.step4 || 0) },
              { label: 'Step 5', value: medicalStatus?.step5 || 0, note: medPct(medicalStatus?.step5 || 0) },
              { label: 'Step 6', value: medicalStatus?.step6 || 0, note: medPct(medicalStatus?.step6 || 0) },
              { label: 'Step 7', value: medicalStatus?.step7 || 0, note: medPct(medicalStatus?.step7 || 0) },
              { label: 'Step 8 (Completed)', value: medicalStatus?.step8 || 0, note: medPct(medicalStatus?.step8 || 0) },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionTable
            title="🔄 Re-enlistment Status"
            rows={[
              { label: 'First Term',                 value: reenlistment?.firstTerm  || 0, note: rePct(reenlistment?.firstTerm  || 0) },
              { label: 'Re-enlisted (2+ Terms)',      value: reenlistment?.reenlisted || 0, note: rePct(reenlistment?.reenlisted || 0) },
              { label: 'Eligible for Re-enlistment', value: reenlistment?.eligible   || 0, note: rePct(reenlistment?.eligible   || 0) },
              { label: 'Total',                      value: reTotal,                        note: '100%' },
            ]}
          />
        </Grid>

        <Grid size={12}>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Box
              onClick={() => setJoinYearOpen(o => !o)}
              sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: joinYearOpen ? '1px solid' : 'none',
                borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
            >
              <Typography variant="subtitle2" fontWeight={700}>📅 Personnel by Year Joined</Typography>
              <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
                {joinYearOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={joinYearOpen}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Year</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>% of Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {joinYear.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>No data</TableCell>
                    </TableRow>
                  )}
                  {joinYear.map(row => (
                    <TableRow key={row.year} hover>
                      <TableCell>{row.year}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>{row.count}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>
                        {pctOf(row.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {joinYear.length > 0 && (
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{joinYear.reduce((s, r) => s + r.count, 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>100%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Collapse>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
