/**
 * MedEvalSummaryReportPage
 * Generates a printable Monthly Medical Evaluation Summary Report
 * Section counts are auto-populated from the database based on medicalStatus.clearedDate
 */

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import type { Personnel } from '@shared/types/personnel.types';
import type { SavedReport } from '@shared/types/savedReports.types';
import { isOfficer } from '@shared/constants/ranks';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (n: number) => n === 0 ? 'NIL' : String(n).padStart(2, '0');

const persist = (key: string, val: string) => localStorage.setItem(key, val);
const load = (key: string, fallback = '') => localStorage.getItem(key) ?? fallback;

export const MedEvalSummaryReportPage = () => {
  const [unitName,       setUnitName]       = useState(() => load('medSum_unit',    'COAST GUARD MEDICAL STATION \u2013 EASTERN VISAYAS'));
  const [unitAddress,    setUnitAddress]    = useState(() => load('medSum_address2', 'Brgy 99 Diit, Tacloban City, Leyte | Tel: 09934532670 | cgmedclev@gmail.com'));
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear,  setReportYear]  = useState(new Date().getFullYear());
  const [preparedBy,  setPreparedBy]  = useState(() => load('medSum_preparedBy2', 'SN2 Samuelson G Acosta PCG'));
  const [notedBy,     setNotedBy]     = useState(() => load('medSum_notedBy',     'ENS CAMILLE ANNE V BORBE PCG'));

  // Manual overrides for categories with no direct DB mapping
  const [lateralEntry,  setLateralEntry]  = useState(0);
  const [reEntry,       setReEntry]       = useState(0);
  const [promotion,     setPromotion]     = useState(0);
  const [foreignSchool, setForeignSchool] = useState(0);
  const [localSchool,   setLocalSchool]   = useState(0);

  // Personnel from database
  const [personnel,     setPersonnel]     = useState<Personnel[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Panel visibility
  const [showConfig,    setShowConfig]    = useState(false);

  // Saved reports state
  const [savedReports,  setSavedReports]  = useState<SavedReport[]>([]);
  const [showSaved,     setShowSaved]     = useState(false);
  const [savingReport,  setSavingReport]  = useState(false);

  useEffect(() => {
    setLoadingCounts(true);
    api.get('/personnel', { params: { medicalCleared: true, limit: 500 } })
      .then((res: { data: Personnel[] }) => setPersonnel(res.data))
      .catch(() => setPersonnel([]))
      .finally(() => setLoadingCounts(false));

    api.get('/saved-reports', { params: { type: 'summary' } })
      .then((res: any) => setSavedReports(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => {});
  }, []);

  // Personnel who completed all 8 steps (cleared) in the selected month/year
  const clearedThisMonth = personnel.filter(p => {
    if (!p.medicalStatus?.cleared || !p.medicalStatus?.clearedDate) return false;
    const d = new Date(p.medicalStatus.clearedDate as string);
    return d.getMonth() === reportMonth && d.getFullYear() === reportYear;
  });

  // Section A — Recruitment (auto from DB)
  const commissionship = clearedThisMonth.filter(p => isOfficer(p.rank)).length;
  // Enlistment = applicants with no rank yet
  const enlistment     = clearedThisMonth.filter(p => !p.rank || p.rank.trim() === '').length;

  // Section B — Medical Issued Clearance (auto from DB)
  const cad          = clearedThisMonth.filter(p => !!p.cadProgram && p.cadProgram.trim() !== '').length;
  // Re-Enlistment = existing service members with an enlisted rank (not officers, not applicants)
  const reEnlistment = clearedThisMonth.filter(p => !!p.rank && !isOfficer(p.rank)).length;

  const totalA = commissionship + enlistment + lateralEntry + reEntry;
  const totalB = cad + promotion + foreignSchool + localSchool + reEnlistment;
  const monthYear = `${MONTHS[reportMonth]} ${reportYear}`;
  const controlNumber     = reportDate.length === 10 ? `${reportDate.slice(5, 7)}${reportDate.slice(2, 4)}` : '';
  const [ry, rm, rd]      = reportDate.length === 10 ? reportDate.split('-').map(Number) : [0, 0, 0];
  const reportDateDisplay = rd ? `${rd} ${MONTHS[rm - 1].toUpperCase()} ${ry}` : '';
  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      const saved = await api.post('/saved-reports', {
        reportType: 'summary',
        title: `Monthly Summary \u2013 ${monthYear}`,
        controlNumber,
        reportDate,
        config: { unitName, unitAddress, reportMonth, reportYear, preparedBy, notedBy,
                  lateralEntry, reEntry, promotion, foreignSchool, localSchool },
        counts: { commissionship, enlistment, cad, reEnlistment, totalA, totalB },
      }) as SavedReport;
      setSavedReports(prev => [saved, ...prev]);
      toast.success('Report saved');
    } catch {
      toast.error('Failed to save report');
    } finally {
      setSavingReport(false);
    }
  };

  const loadReport = (r: SavedReport) => {
    if (r.reportDate) setReportDate(r.reportDate);
    if (r.config.reportMonth !== undefined) setReportMonth(r.config.reportMonth);
    if (r.config.reportYear  !== undefined) setReportYear(r.config.reportYear);
    if (r.config.unitName    !== undefined) { setUnitName(r.config.unitName);       persist('medSum_unit', r.config.unitName); }
    if (r.config.unitAddress !== undefined) { setUnitAddress(r.config.unitAddress); persist('medSum_address2', r.config.unitAddress); }
    if (r.config.preparedBy  !== undefined) { setPreparedBy(r.config.preparedBy);   persist('medSum_preparedBy2', r.config.preparedBy); }
    if (r.config.notedBy     !== undefined) { setNotedBy(r.config.notedBy);         persist('medSum_notedBy', r.config.notedBy); }
    if (r.config.lateralEntry  !== undefined) setLateralEntry(r.config.lateralEntry);
    if (r.config.reEntry       !== undefined) setReEntry(r.config.reEntry);
    if (r.config.promotion     !== undefined) setPromotion(r.config.promotion);
    if (r.config.foreignSchool !== undefined) setForeignSchool(r.config.foreignSchool);
    if (r.config.localSchool   !== undefined) setLocalSchool(r.config.localSchool);
    toast.success('Report loaded');
  };

  const deleteReport = async (id: string) => {
    try {
      await api.delete(`/saved-reports/${id}`);
      setSavedReports(prev => prev.filter(r => r.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const numField = (val: number, set: (n: number) => void) => ({
    type: 'number' as const,
    size: 'small' as const,
    fullWidth: true,
    value: val,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(Math.max(0, parseInt(e.target.value) || 0)),
    inputProps: { min: 0 },
  });

  const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 700 };
  const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '4px 8px' };
  const tdCenter: React.CSSProperties = { ...tdStyle, textAlign: 'center' };

  return (
    <Box>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { margin: 0; padding: 0; }
          body { font-size: 11px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; }
          @page { size: A4 portrait; margin: 15mm 15mm 25mm 15mm; }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 6px 15mm;
            border-top: 1px solid #ccc;
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: white;
          }
        }
        @media screen {
          .print-footer { display: none; }
        }
      `}</style>

      {/* ── Config Panel ── */}
      <Paper className="no-print" sx={{ mb: 2, borderRadius: 2 }}>
        <Box
          onClick={() => setShowConfig(v => !v)}
          sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: showConfig ? '1px solid' : 'none',
            borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
        >
          <Typography variant="subtitle2" fontWeight={700}>Summary Report Configuration</Typography>
          <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
            {showConfig ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={showConfig}><Box sx={{ p: 2.5 }}><Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField label="Unit Name" size="small" fullWidth value={unitName}
              onChange={e => { setUnitName(e.target.value); persist('medSum_unit', e.target.value); }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Report Date" type="date" size="small" fullWidth value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Unit Address" size="small" fullWidth value={unitAddress}
              onChange={e => { setUnitAddress(e.target.value); persist('medSum_address2', e.target.value); }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Month" size="small" fullWidth select value={reportMonth}
              onChange={e => setReportMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Year" size="small" fullWidth select value={reportYear}
              onChange={e => setReportYear(Number(e.target.value))}>
              {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Control Number" size="small" fullWidth value={controlNumber}
              onChange={() => {}}
              slotProps={{ htmlInput: { readOnly: true, style: { fontWeight: 700, cursor: 'default' } } }}
              sx={{ bgcolor: '#f5f5f5' }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Prepared by" size="small" fullWidth value={preparedBy}
              placeholder="e.g. SN2 SAMUELSON G ACOSTA PCG"
              onChange={e => { setPreparedBy(e.target.value); persist('medSum_preparedBy2', e.target.value); }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Noted by" size="small" fullWidth value={notedBy}
              placeholder="e.g. ENS CAMILLE ANNE V BORBE MAC PCG"
              onChange={e => { setNotedBy(e.target.value); persist('medSum_notedBy', e.target.value); }} />
          </Grid>

          {/* DB counts status */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #bbf7d0' }}>
              {loadingCounts
                ? <><CircularProgress size={14} /><Typography variant="caption">Loading counts from database...</Typography></>
                : <Typography variant="caption" color="text.secondary">
                    <strong>{clearedThisMonth.length}</strong> personnel cleared in {monthYear}.
                    Commissionship, Enlistment, CAD &amp; Re-Enlistment auto-calculated from database.
                    Enter Lateral-Entry, Re-Entry, Promotion, and Schooling counts manually.
                  </Typography>
              }
            </Box>
          </Grid>

          {/* Manual inputs for categories without DB mapping */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Lateral-Entry (A3)" {...numField(lateralEntry, setLateralEntry)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Re-Entry (A4)" {...numField(reEntry, setReEntry)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Promotion (B2)" {...numField(promotion, setPromotion)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Foreign Schooling (B3a)" {...numField(foreignSchool, setForeignSchool)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Local Schooling (B3b)" {...numField(localSchool, setLocalSchool)} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Print Summary Report
              </Button>
              <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveReport} disabled={savingReport}>
                {savingReport ? 'Saving...' : 'Save Report'}
              </Button>
            </Box>
          </Grid>
        </Grid></Box></Collapse>
      </Paper>

      {/* ── Saved Reports Panel ── */}
      <Paper className="no-print" sx={{ mb: 3, borderRadius: 2 }}>
        <Box
          onClick={() => setShowSaved(s => !s)}
          sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: showSaved ? '1px solid' : 'none',
            borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
        >
          <Typography variant="subtitle2" fontWeight={700}>Saved Reports ({savedReports.length})</Typography>
          <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
            {showSaved ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={showSaved}>
          {savedReports.length === 0
            ? <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>No saved reports yet.</Typography>
            : <List dense disablePadding>
                {savedReports.map(r => (
                  <ListItem key={r.id} divider
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => loadReport(r)}>Load</Button>
                        <IconButton size="small" color="error" onClick={() => deleteReport(r.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={r.title}
                      secondary={`Control: ${r.controlNumber} · ${new Date(r.savedAt).toLocaleDateString()} · by ${r.savedBy}`}
                    />
                  </ListItem>
                ))}
              </List>
          }
        </Collapse>
      </Paper>

      {/* ── Printable Summary Report ── */}
      <Box className="print-area" sx={{ p: 2, maxWidth: 760, mx: 'auto' }}>

        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <img src="/image.png" alt="PCG Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <Box sx={{ textAlign: 'center', flex: 1, px: 2 }}>
            <Typography variant="body2">Philippine Coast Guard</Typography>
            <Typography variant="body1" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{unitName}</Typography>
            <Typography variant="body2">{unitAddress}</Typography>
          </Box>
          <img src="/logo.png" alt="Station Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        </Box>

        {/* Control Number + Date (right-aligned) */}
        <Typography align="right" sx={{ mb: 0.5 }}>Control Number: <strong>{controlNumber}</strong></Typography>
        <Typography align="right" fontWeight={600} sx={{ mb: 2 }}>{reportDateDisplay}</Typography>

        {/* Title */}
        <Typography variant="subtitle1" align="center" fontWeight={700} sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          MEDS-EV Medical Evaluation Report for the Month of {monthYear}
        </Typography>

        {/* Section A */}
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>A.&nbsp;&nbsp;Recruitment:</Typography>
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '12%' }}>Nr</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Nr of Personnel Processed</th>
            </tr>
          </thead>
          <tbody>
            {[
              { nr: '1', cat: 'Commissionship', val: commissionship },
              { nr: '2', cat: 'Enlistment',     val: enlistment },
              { nr: '3', cat: 'Lateral-Entry',  val: lateralEntry },
              { nr: '4', cat: 'Re-Entry',        val: reEntry },
            ].map(r => (
              <tr key={r.cat}>
                <td style={tdCenter}>{r.nr}</td>
                <td style={tdCenter}>{r.cat}</td>
                <td style={tdCenter}>{fmt(r.val)}</td>
              </tr>
            ))}
            <tr>
              <td style={tdStyle}></td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Total</td>
              <td style={{ ...tdCenter, fontWeight: 700 }}>{fmt(totalA)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section B */}
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>B.&nbsp;&nbsp;Medical Issued Clearance:</Typography>
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '12%' }}>Nr</th>
              <th style={thStyle}>Category</th>
              <th style={{ ...thStyle, width: '30%' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdCenter}>1.</td>
              <td style={tdStyle}>CAD</td>
              <td style={tdCenter}>{fmt(cad)}</td>
            </tr>
            <tr>
              <td style={tdCenter}>2.</td>
              <td style={tdStyle}>Promotion</td>
              <td style={tdCenter}>{fmt(promotion)}</td>
            </tr>
            <tr>
              <td style={tdCenter}>3.</td>
              <td style={tdStyle}>Foreign Schooling</td>
              <td style={tdCenter}>{fmt(foreignSchool)}</td>
            </tr>
            <tr>
              <td style={tdStyle}></td>
              <td style={tdStyle}>Local Schooling</td>
              <td style={tdCenter}>{fmt(localSchool)}</td>
            </tr>
            <tr>
              <td style={tdCenter}>4.</td>
              <td style={tdStyle}>Re-Enlistment</td>
              <td style={tdCenter}>{fmt(reEnlistment)}</td>
            </tr>
            <tr>
              <td style={tdStyle}></td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Total</td>
              <td style={{ ...tdCenter, fontWeight: 700 }}>{fmt(totalB)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <Box sx={{ display: 'flex', gap: 8, mt: 2 }}>
          <Box>
            <Typography>Prepared by:</Typography>
            <img src="/esig1.png" alt="e-signature 1"
              style={{ height: 60, maxWidth: 160, objectFit: 'contain', display: 'block', margin: '4px 0' }} />
            <Typography fontWeight={700}>{preparedBy || '___________________________'}</Typography>
          </Box>
          <Box>
            <Typography>Noted by:</Typography>
            <img src="/esig2.png" alt="e-signature 2"
              style={{ height: 60, maxWidth: 160, objectFit: 'contain', display: 'block', margin: '4px 0' }} />
            <Typography fontWeight={700}>{notedBy || '___________________________'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Fixed print footer */}
      <div className="print-footer">
        <span style={{ fontStyle: 'italic', fontSize: 11, color: '#666' }}>
          "Serving Our Nation by Ensuring Safe, Clean and Secure Maritime Environment"
        </span>
        <img src="/pilipinas.png" alt="Bagong Pilipinas" style={{ height: 48, objectFit: 'contain' }} />
      </div>
    </Box>
  );
};
