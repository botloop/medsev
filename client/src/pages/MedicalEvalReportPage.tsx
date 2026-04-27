/**
 * MedicalEvalReportPage
 * Generates a printable Monthly Medical Evaluation Report
 * Fetches medically-cleared personnel from the database
 */

import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Personnel } from '@shared/types/personnel.types';
import type { SavedReport } from '@shared/types/savedReports.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { toast } from 'react-hot-toast';

const PURPOSES = ['Reenlistment','Schooling','Promotion','CAD','Re-Entry','Lateral Entry'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_MAP: Record<string, string> = {
  january:'01', february:'02', march:'03', april:'04',
  may:'05', june:'06', july:'07', august:'08',
  september:'09', october:'10', november:'11', december:'12'
};

interface ManualEntry {
  id: string;
  date: string;
  time: string;
  rank: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  age: string;
  gender: string;
  purpose: string;
  physProfile: string;
}

const emptyEntry = (): ManualEntry => ({
  id: Date.now().toString(),
  date: '', time: '', rank: '', firstName: '', middleInitial: '',
  lastName: '', age: '', gender: '', purpose: 'Reenlistment', physProfile: 'P-1',
});

const parseMemo = (text: string): ManualEntry => {
  const entry = emptyEntry();

  // Rank + Name from Subject line: "Medical Evaluation Report of RANK FirstName MI LastName"
  const subjectMatch = text.match(
    /Subject\s*:\s*Medical Evaluation Report of\s+([A-Z0-9\/]+)\s+([A-Za-z]+)\s+([A-Z])\s+([A-Za-z]+)/i
  );
  if (subjectMatch) {
    entry.rank         = subjectMatch[1].toUpperCase();
    entry.firstName    = subjectMatch[2];
    entry.middleInitial = subjectMatch[3].toUpperCase();
    entry.lastName     = subjectMatch[4];
  }

  // Fallback: paragraph 2 pattern "RANK FirstName MI LastName serial PCG, age/gender"
  if (!entry.rank) {
    const p2Match = text.match(
      /([A-Z0-9\/]+)\s+([A-Za-z]+)\s+([A-Z])\s+([A-Za-z]+)\s+\d+\s+PCG,\s+(\d+)\/([MF])/i
    );
    if (p2Match) {
      entry.rank          = p2Match[1].toUpperCase();
      entry.firstName     = p2Match[2];
      entry.middleInitial = p2Match[3].toUpperCase();
      entry.lastName      = p2Match[4];
      entry.age           = p2Match[5];
      entry.gender        = p2Match[6].toUpperCase();
    }
  }

  // Age / Gender: "36/M"
  if (!entry.age) {
    const agMatch = text.match(/\b(\d{2})\/([MF])\b/i);
    if (agMatch) { entry.age = agMatch[1]; entry.gender = agMatch[2].toUpperCase(); }
  }

  // Date from "Date : 25 April 2026"
  const dateMatch = text.match(/Date\s*:\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (dateMatch) {
    const m = MONTH_MAP[dateMatch[2].toLowerCase()];
    if (m) entry.date = `${dateMatch[3]}-${m}-${dateMatch[1].padStart(2, '0')}`;
  }

  // Time from "XXXXH" military time
  const timeMatch = text.match(/\b(\d{4}H)\b/i);
  if (timeMatch) entry.time = timeMatch[1].toUpperCase();

  // Physical Profile: "Physical Profile: P-1"
  const profileMatch = text.match(/Physical Profile:\s*P[-–](\d+)/i);
  if (profileMatch) entry.physProfile = `P-${profileMatch[1]}`;

  // Purpose keywords
  const purposePatterns: [RegExp, string][] = [
    [/RE[-\s]?ENLISTMENT/i, 'Reenlistment'],
    [/RE[-\s]?ENTRY/i, 'Re-Entry'],
    [/LATERAL\s+ENTRY/i, 'Lateral Entry'],
    [/SCHOOLING/i, 'Schooling'],
    [/PROMOTION/i, 'Promotion'],
    [/\bCAD\b/i, 'CAD'],
  ];
  for (const [pat, label] of purposePatterns) {
    if (pat.test(text)) { entry.purpose = label; break; }
  }

  return entry;
};

const calcAge = (birthdate: string | Date) => {
  const today = new Date();
  const b = new Date(birthdate as string);
  let age = today.getFullYear() - b.getFullYear();
  if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
};

const fmtDate = (d: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' }).replace(/ /g,'-').toUpperCase();
};

const CELL: React.CSSProperties = { border:'1px solid #ccc', padding:'3px 6px' };
const CELL_C: React.CSSProperties = { ...CELL, textAlign:'center' };

export const MedicalEvalReportPage = () => {
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);

  const [showConfig, setShowConfig]   = useState(false);
  const [showManual, setShowManual]   = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showSaved, setShowSaved]     = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // Manual memo paste
  const [memoText, setMemoText]       = useState('');
  const [draft, setDraft]             = useState<ManualEntry>(emptyEntry());
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);

  // Report config
  const [purpose, setPurpose]               = useState('Reenlistment');
  const [doctor, setDoctor]                 = useState(() => localStorage.getItem('medEval_doctor') ?? '');
  const [releasingOfficer, setReleasingOfficer] = useState(() => localStorage.getItem('medEval_releasingOfficer') ?? '');
  const [reportDate, setReportDate]         = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const controlNr = reportDate.length === 10
    ? `${reportDate.slice(5, 7)}${reportDate.slice(2, 4)}`
    : '';
  const [reportTime, setReportTime]         = useState('');
  const [physProfile, setPhysProfile]       = useState('1');
  const [filterMonth, setFilterMonth]       = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear]         = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    api.get<Personnel[]>('/personnel?limit=999&medicalCleared=true')
      .then(data => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        setAllPersonnel(list.filter((p: Personnel) => p.medicalStatus?.cleared));
      })
      .catch(() => toast.error('Failed to load personnel'))
      .finally(() => setLoading(false));

    api.get<SavedReport[]>('/saved-reports', { params: { type: 'medeval' } } as any)
      .then((res: any) => setSavedReports(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => {});
  }, []);

  const reportPersonnel = allPersonnel.filter(p => {
    const cd = p.medicalStatus?.clearedDate;
    if (!cd) return true;
    const d = new Date(cd as string);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const totalRows = reportPersonnel.length + manualEntries.length;

  const handleParseMemo = () => {
    if (!memoText.trim()) return;
    const parsed = parseMemo(memoText);
    setDraft(parsed);
    toast.success('Memo parsed — review and add to report');
  };

  const handleAddEntry = () => {
    if (!draft.rank && !draft.lastName) {
      toast.error('Please parse a memo first or fill in at least Rank and Last Name');
      return;
    }
    setManualEntries(prev => [...prev, { ...draft, id: Date.now().toString() }]);
    setDraft(emptyEntry());
    setMemoText('');
    toast.success('Entry added to report');
  };

  const removeManualEntry = (id: string) => {
    setManualEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      const monthLabel = MONTHS[filterMonth - 1];
      const saved = await api.post('/saved-reports', {
        reportType: 'medeval',
        title: `Medical Eval – ${monthLabel} ${filterYear} (${purpose})`,
        controlNumber: controlNr,
        reportDate,
        config: {
          purpose, doctor, releasingOfficer, reportTime,
          physProfile, filterMonth, filterYear,
        },
        counts: { totalPersonnel: totalRows },
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
    setReportDate(r.reportDate);
    if (r.config.purpose)          setPurpose(r.config.purpose);
    if (r.config.doctor !== undefined) { setDoctor(r.config.doctor ?? ''); localStorage.setItem('medEval_doctor', r.config.doctor ?? ''); }
    if (r.config.releasingOfficer !== undefined) { setReleasingOfficer(r.config.releasingOfficer ?? ''); localStorage.setItem('medEval_releasingOfficer', r.config.releasingOfficer ?? ''); }
    if (r.config.reportTime !== undefined)  setReportTime(r.config.reportTime ?? '');
    if (r.config.physProfile !== undefined) setPhysProfile(r.config.physProfile ?? '1');
    if (r.config.filterMonth)  setFilterMonth(r.config.filterMonth);
    if (r.config.filterYear)   setFilterYear(r.config.filterYear);
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

  const fmtSavedAt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TABLE_HEADERS = [
    'Control Nr\n(MM/YY0)', 'Control Nr', 'Date', 'Time', 'Rank',
    'First Name', 'Middle Initial', 'Last Name', 'Age', 'Gender',
    'Purpose', 'Physical Profile', 'Final Evaluation', 'Releasing Officer'
  ];

  return (
    <Box>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-header { display: block !important; }
          .print-area { margin: 0; padding: 0; }
          body { font-size: 11px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 2px 4px; font-size: 10px; }
          @page { size: landscape; margin: 10mm; }
        }
      `}</style>

      {/* Config panel */}
      <Paper className="no-print" sx={{ mb: 2, borderRadius: 2 }}>
        <Box onClick={() => setShowConfig(v => !v)}
          sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: showConfig ? '1px solid' : 'none',
            borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}>
          <Typography variant="subtitle2" fontWeight={700}>📋 Report Configuration</Typography>
          <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
            {showConfig ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={showConfig}><Box sx={{ p: 2.5 }}><Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Control Nr (MM/YY)" size="small" fullWidth value={controlNr}
              onChange={() => {}}
              slotProps={{ htmlInput: { readOnly: true, style: { fontWeight: 700, cursor: 'default' } } }}
              sx={{ bgcolor: '#f5f5f5' }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Purpose" size="small" fullWidth select value={purpose}
              onChange={e => setPurpose(e.target.value)}>
              {PURPOSES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Report Date" size="small" fullWidth type="date" value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Time (e.g. 1524H)" size="small" fullWidth value={reportTime}
              onChange={e => setReportTime(e.target.value)} placeholder="1524H" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Physical Profile" size="small" fullWidth select value={physProfile}
              onChange={e => setPhysProfile(e.target.value)}>
              <MenuItem value="1">P-1</MenuItem>
              <MenuItem value="2">P-2</MenuItem>
              <MenuItem value="3">P-3</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField label="Final Evaluation (Doctor)" size="small" fullWidth value={doctor}
              onChange={e => { setDoctor(e.target.value); localStorage.setItem('medEval_doctor', e.target.value); }}
              placeholder="e.g. CAPT IGNACIO MC PCG" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <TextField label="Releasing Officer" size="small" fullWidth value={releasingOfficer}
              onChange={e => { setReleasingOfficer(e.target.value); localStorage.setItem('medEval_releasingOfficer', e.target.value); }}
              placeholder="e.g. ENS CAV BORBE PCG" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Filter personnel by cleared date:
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Month" size="small" fullWidth select value={filterMonth}
              onChange={e => setFilterMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Year" size="small" fullWidth select value={filterYear}
              onChange={e => setFilterYear(Number(e.target.value))}>
              {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}
              disabled={totalRows === 0}>
              Print Report ({totalRows} personnel)
            </Button>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveReport}
              disabled={savingReport || totalRows === 0}>
              {savingReport ? 'Saving...' : 'Save Report'}
            </Button>
          </Grid>
        </Grid></Box></Collapse>
      </Paper>

      {/* Manual Entry from Memo */}
      <Paper className="no-print" sx={{ mb: 2, borderRadius: 2 }}>
        <Box onClick={() => setShowManual(v => !v)}
          sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: showManual ? '1px solid' : 'none',
            borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}>
          <Typography variant="subtitle2" fontWeight={700}>
            <ContentPasteIcon sx={{ fontSize: 16, mr: 0.75, verticalAlign: 'middle' }} />
            Manual Entry from Memo {manualEntries.length > 0 && `(${manualEntries.length} added)`}
          </Typography>
          <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
            {showManual ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Collapse in={showManual}>
          <Box sx={{ p: 2.5 }}>
            {/* Paste area */}
            <TextField
              label="Paste Memorandum Text"
              multiline
              minRows={5}
              maxRows={12}
              fullWidth
              size="small"
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
              placeholder="Paste the full memorandum text here..."
              sx={{ mb: 1.5 }}
            />
            <Button variant="outlined" size="small" onClick={handleParseMemo} disabled={!memoText.trim()}
              startIcon={<ContentPasteIcon />} sx={{ mb: 2 }}>
              Parse Memo
            </Button>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Parsed fields — review and edit before adding:
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="Date" type="date" size="small" fullWidth value={draft.date}
                  onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="Time" size="small" fullWidth value={draft.time}
                  onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                  placeholder="e.g. 0748H" />
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="Rank" size="small" fullWidth value={draft.rank}
                  onChange={e => setDraft(d => ({ ...d, rank: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="First Name" size="small" fullWidth value={draft.firstName}
                  onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 4, sm: 2, md: 1 }}>
                <TextField label="MI" size="small" fullWidth value={draft.middleInitial}
                  onChange={e => setDraft(d => ({ ...d, middleInitial: e.target.value }))}
                  inputProps={{ maxLength: 1 }} />
              </Grid>
              <Grid size={{ xs: 8, sm: 4, md: 3 }}>
                <TextField label="Last Name" size="small" fullWidth value={draft.lastName}
                  onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 4, sm: 2, md: 1 }}>
                <TextField label="Age" size="small" fullWidth value={draft.age}
                  onChange={e => setDraft(d => ({ ...d, age: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 4, sm: 2, md: 1 }}>
                <TextField label="Gender" size="small" fullWidth select value={draft.gender}
                  onChange={e => setDraft(d => ({ ...d, gender: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="F">F</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="Purpose" size="small" fullWidth select value={draft.purpose}
                  onChange={e => setDraft(d => ({ ...d, purpose: e.target.value }))}>
                  {PURPOSES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField label="Physical Profile" size="small" fullWidth select value={draft.physProfile}
                  onChange={e => setDraft(d => ({ ...d, physProfile: e.target.value }))}>
                  <MenuItem value="P-1">P-1</MenuItem>
                  <MenuItem value="P-2">P-2</MenuItem>
                  <MenuItem value="P-3">P-3</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddEntry}>
                  Add to Report
                </Button>
              </Grid>
            </Grid>

            {/* List of added manual entries */}
            {manualEntries.length > 0 && (
              <Box mt={2}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Added manual entries ({manualEntries.length}):
                </Typography>
                <List dense disablePadding>
                  {manualEntries.map((e, idx) => (
                    <ListItem key={e.id} divider={idx < manualEntries.length - 1}
                      secondaryAction={
                        <IconButton size="small" color="error" onClick={() => removeManualEntry(e.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                      sx={{ pr: 6 }}>
                      <ListItemText
                        primary={`${e.rank} ${e.firstName} ${e.middleInitial} ${e.lastName}`}
                        secondary={`${fmtDate(e.date)} ${e.time} · Age ${e.age} ${e.gender} · ${e.purpose} · ${e.physProfile}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Saved Reports Panel */}
      <Paper className="no-print" sx={{ mb: 3, borderRadius: 2 }}>
        <Box onClick={() => setShowSaved(v => !v)}
          sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: showSaved ? '1px solid' : 'none',
            borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}>
          <Typography variant="subtitle2" fontWeight={700}>Saved Reports ({savedReports.length})</Typography>
          <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
            {showSaved ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={showSaved}>
          {savedReports.length === 0
            ? <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>No saved reports yet.</Typography>
            : <List dense disablePadding>
                {savedReports.map((r, idx) => (
                  <ListItem key={r.id} divider={idx < savedReports.length - 1}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => loadReport(r)}>Load</Button>
                        <IconButton size="small" color="error" onClick={() => deleteReport(r.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    sx={{ pr: 16 }}>
                    <ListItemText
                      primary={r.title}
                      secondary={`Control: ${r.controlNumber || '—'} · Saved ${fmtSavedAt(r.savedAt)} by ${r.savedBy} · ${r.counts.totalPersonnel ?? 0} personnel`}
                    />
                  </ListItem>
                ))}
              </List>
          }
        </Collapse>
      </Paper>

      {loading && (
        <Box className="no-print" textAlign="center" py={4}>
          <CircularProgress size={36} />
          <Typography color="text.secondary" mt={1}>Loading personnel...</Typography>
        </Box>
      )}

      {!loading && totalRows === 0 && (
        <Box className="no-print">
          <Typography color="text.secondary" textAlign="center" py={4}>
            No entries found for {MONTHS[filterMonth - 1]} {filterYear}.
            <br />Try adjusting the filters above or add manual entries from memos.
          </Typography>
        </Box>
      )}

      {/* Printable report */}
      {!loading && totalRows > 0 && (
        <Box className="print-area">
          <Box sx={{ textAlign: 'center', mb: 1 }} className="no-print">
            <Typography variant="h6" fontWeight={700}>DATABASE MANAGEMENT - PCG Personnel Database</Typography>
            <Typography variant="body2" color="primary" fontWeight={600}>
              Format for the List of Medical Evaluation Report
            </Typography>
          </Box>

          <Box sx={{ display: 'none' }} className="print-header">
            <div style={{ textAlign:'center', fontWeight:'bold', fontSize:14 }}>DATABASE MANAGEMENT-PCG Personnel Database</div>
            <div style={{ textAlign:'center', color:'blue', fontSize:12, marginBottom:8 }}>Format for the List of Medical Evaluation Report</div>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12 }}>
              <thead>
                <tr style={{ backgroundColor:'#f0f0f0' }}>
                  {TABLE_HEADERS.map(h => (
                    <th key={h} style={{ border:'1px solid #999', padding:'4px 6px', textAlign:'center',
                      fontSize:11, fontWeight:700, color:'#1565c0', whiteSpace:'pre-line', verticalAlign:'middle' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* DB entries */}
                {reportPersonnel.map((p, idx) => (
                  <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={CELL_C}>{controlNr || '—'}</td>
                    <td style={CELL_C}>{idx + 1}</td>
                    <td style={CELL_C}>{fmtDate(reportDate)}</td>
                    <td style={CELL_C}>{reportTime || '—'}</td>
                    <td style={{ ...CELL, fontWeight:600 }}>{p.rank}</td>
                    <td style={CELL}>{p.firstName}</td>
                    <td style={CELL_C}>{p.middleName?.charAt(0).toUpperCase() || ''}</td>
                    <td style={{ ...CELL, fontWeight:600 }}>{p.lastName}</td>
                    <td style={CELL_C}>{calcAge(p.birthdate as string)}</td>
                    <td style={CELL_C}>—</td>
                    <td style={CELL_C}>{purpose}</td>
                    <td style={CELL_C}>{`P-${physProfile}`}</td>
                    <td style={CELL}>{doctor || '—'}</td>
                    <td style={CELL}>{releasingOfficer || '—'}</td>
                  </tr>
                ))}

                {/* Manual entries */}
                {manualEntries.map((e, idx) => {
                  const rowIdx = reportPersonnel.length + idx;
                  return (
                    <tr key={e.id} style={{ backgroundColor: rowIdx % 2 === 0 ? '#fff8e1' : '#fffde7' }}>
                      <td style={CELL_C}>{controlNr || '—'}</td>
                      <td style={CELL_C}>{rowIdx + 1}</td>
                      <td style={CELL_C}>{fmtDate(e.date)}</td>
                      <td style={CELL_C}>{e.time || '—'}</td>
                      <td style={{ ...CELL, fontWeight:600 }}>{e.rank}</td>
                      <td style={CELL}>{e.firstName}</td>
                      <td style={CELL_C}>{e.middleInitial}</td>
                      <td style={{ ...CELL, fontWeight:600 }}>{e.lastName}</td>
                      <td style={CELL_C}>{e.age}</td>
                      <td style={CELL_C}>{e.gender}</td>
                      <td style={CELL_C}>{e.purpose}</td>
                      <td style={CELL_C}>{e.physProfile}</td>
                      <td style={CELL}>{doctor || '—'}</td>
                      <td style={CELL}>{releasingOfficer || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>

          <Box sx={{ mt: 2, color: 'text.secondary', fontSize: 12 }} className="no-print">
            <Typography variant="caption">
              {reportPersonnel.length} from database · {manualEntries.length} manual ·{' '}
              {MONTHS[filterMonth - 1]} {filterYear}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};
