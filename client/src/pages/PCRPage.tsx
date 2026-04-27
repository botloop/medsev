import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { PCRRecord, CreatePCRDTO, PCRVitalSign } from '@shared/types/pcr.types';
import { PCR_TRAUMA_FINDINGS, PCR_SERVICES_RENDERED, PCR_BURN_DEGREES, PCR_MUSCULOSKELETAL } from '@shared/types/pcr.types';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';

const EMPTY_VITAL: PCRVitalSign = { time: '', bp: '', pr: '', rr: '', temp: '', spo2: '', gcs: '' };

// ── Rule of Nines body regions ──────────────────────────────────────────────
type BurnRegionDef = { id: string; label: string; pct: number } &
  ({ shape: 'circle'; cx: number; cy: number; r: number } | { shape: 'rect'; x: number; y: number; w: number; h: number });

const FRONT_REGIONS: BurnRegionDef[] = [
  { id: 'head-front',         label: 'Head',        pct: 4.5, shape: 'circle', cx: 45,  cy: 15,  r: 13 },
  { id: 'chest',              label: 'Chest',       pct: 9,   shape: 'rect',   x: 18,   y: 29,   w: 54, h: 26 },
  { id: 'abdomen',            label: 'Abdomen',     pct: 9,   shape: 'rect',   x: 18,   y: 55,   w: 54, h: 22 },
  { id: 'left-arm-front',     label: 'L. Arm',      pct: 4.5, shape: 'rect',   x: 3,    y: 31,   w: 14, h: 44 },
  { id: 'right-arm-front',    label: 'R. Arm',      pct: 4.5, shape: 'rect',   x: 73,   y: 31,   w: 14, h: 44 },
  { id: 'genitalia',          label: 'Groin',       pct: 1,   shape: 'rect',   x: 33,   y: 77,   w: 24, h: 9  },
  { id: 'left-thigh-front',   label: 'L. Thigh',    pct: 4.5, shape: 'rect',   x: 18,   y: 86,   w: 24, h: 40 },
  { id: 'right-thigh-front',  label: 'R. Thigh',    pct: 4.5, shape: 'rect',   x: 48,   y: 86,   w: 24, h: 40 },
  { id: 'left-leg-front',     label: 'L. Leg',      pct: 4.5, shape: 'rect',   x: 18,   y: 128,  w: 24, h: 52 },
  { id: 'right-leg-front',    label: 'R. Leg',      pct: 4.5, shape: 'rect',   x: 48,   y: 128,  w: 24, h: 52 },
];

const BACK_REGIONS: BurnRegionDef[] = [
  { id: 'head-back',          label: 'Head',        pct: 4.5, shape: 'circle', cx: 45,  cy: 15,  r: 13 },
  { id: 'upper-back',         label: 'Upper Back',  pct: 9,   shape: 'rect',   x: 18,   y: 29,   w: 54, h: 26 },
  { id: 'lower-back',         label: 'Lower Back',  pct: 9,   shape: 'rect',   x: 18,   y: 55,   w: 54, h: 22 },
  { id: 'left-arm-back',      label: 'L. Arm',      pct: 4.5, shape: 'rect',   x: 3,    y: 31,   w: 14, h: 44 },
  { id: 'right-arm-back',     label: 'R. Arm',      pct: 4.5, shape: 'rect',   x: 73,   y: 31,   w: 14, h: 44 },
  { id: 'left-thigh-back',    label: 'L. Thigh',    pct: 4.5, shape: 'rect',   x: 18,   y: 86,   w: 24, h: 40 },
  { id: 'right-thigh-back',   label: 'R. Thigh',    pct: 4.5, shape: 'rect',   x: 48,   y: 86,   w: 24, h: 40 },
  { id: 'left-leg-back',      label: 'L. Leg',      pct: 4.5, shape: 'rect',   x: 18,   y: 128,  w: 24, h: 52 },
  { id: 'right-leg-back',     label: 'R. Leg',      pct: 4.5, shape: 'rect',   x: 48,   y: 128,  w: 24, h: 52 },
];

const ALL_BURN_REGIONS = [...FRONT_REGIONS, ...BACK_REGIONS];
const calcBurnPct = (locs: string[]) =>
  ALL_BURN_REGIONS.filter(r => locs.includes(r.id)).reduce((s, r) => s + r.pct, 0);

const BodyFigure = ({ regions, selected, onToggle, readOnly = false }: {
  regions: BurnRegionDef[]; selected: string[];
  onToggle?: (id: string) => void; readOnly?: boolean;
}) => (
  <svg width="90" height="185" viewBox="0 0 90 185" style={{ display: 'block' }}>
    {regions.map(r => {
      const on = selected.includes(r.id);
      const fill = on ? 'rgba(251,146,60,0.65)' : 'rgba(209,213,219,0.35)';
      const stroke = on ? '#ea580c' : '#9ca3af';
      const tx = r.shape === 'circle' ? r.cx : r.x + r.w / 2;
      const ty = r.shape === 'circle' ? r.cy : r.y + r.h / 2;
      const showLabel = r.shape === 'circle' || (r.shape === 'rect' && r.w >= 20 && r.h >= 18);
      return (
        <g key={r.id} onClick={readOnly ? undefined : () => onToggle?.(r.id)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}>
          {r.shape === 'circle'
            ? <circle cx={r.cx} cy={r.cy} r={r.r} fill={fill} stroke={stroke} strokeWidth="1.5" />
            : <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />}
          {showLabel && <>
            <text x={tx} y={ty - 3} textAnchor="middle" dominantBaseline="middle"
              fontSize="5.5" fill={on ? '#7c2d12' : '#374151'} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {r.label}
            </text>
            <text x={tx} y={ty + 5} textAnchor="middle" dominantBaseline="middle"
              fontSize="5" fill={on ? '#9a3412' : '#6b7280'} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {r.pct}%
            </text>
          </>}
        </g>
      );
    })}
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreatePCRDTO = {
  caseNumber: '', date: '', timeOfCall: '', timePeriod: 'AM', location: '',
  etdBase: '', etaScene: '', etdScene: '', etaBase: '',
  unit: '', teamLeader: '', teamOfficer: '', medics: '',
  patientType: 'civilian', patientName: '', contactNumber: '',
  age: '', gender: '', civilStatus: '', address: '',
  dateOfBirth: '', religion: '', informantGuardian: '',
  caseType: '', chiefComplaint: '',
  symptoms: '', allergies: '', medications: '',
  pertinentHistory: '', lastOralIntake: '', eventsLeading: '',
  moisture: '', temperature: '', skinColor: '', pupil: '', capillaryRefill: '', responsiveness: '',
  traumaFindings: [], vitalSigns: [{ ...EMPTY_VITAL }],
  burnLocations: [], burnSurfaceArea: '', burnDegrees: [], musculoskeletal: [],
  disposition: '', dispositionOther: '', servicesRendered: [],
  hospitalName: '', hospitalAddress: '', department: '',
  advanceCalledBy: '', callReceivedBy: '', physicianOnDuty: '',
  accomplishedBy: '', notedBy: '',
  refusedTreatment: false, refusedTransport: false, refusedServices: false,
  refusalRepresentativeOf: '',
  refusalPatientName: '', refusalRepresentativeName: '', refusalAge: '',
  refusalRelationship: '', refusalDateTime: '', refusalContactNumber: '',
  refusalWitnessName: '', refusalWitnessAge: '', refusalWitnessRelationship: '',
  refusalWitnessDateTime: '', refusalWitnessContact: '',
  patientValuables: '', notes: '',
  narrativeD: '', narrativeC: '', narrativeHx: '', narrativeA: '', narrativeRx: '', narrativeT: '', narrativeE: '',
};

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ mt: 2.5, mb: 1 }}>
    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.main', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
      {children}
    </Typography>
    <Divider sx={{ mt: 0.5 }} />
  </Box>
);

const caseTypeColor = (ct: string) => {
  switch (ct) {
    case 'trauma': return 'error';
    case 'medical': return 'warning';
    case 'activity': return 'info';
    default: return 'default';
  }
};

export const PCRPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<PCRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PCRRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PCRRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePCRDTO>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCaseType, setFilterCaseType] = useState('');

  const canWrite = user?.role === 'admin' || user?.role === 'medical';

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.get<PCRRecord[]>('/pcr');
      setRecords(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch { toast.error('Failed to fetch PCR records'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r: PCRRecord) => {
    setEditingRecord(r);
    setForm({
      caseNumber: r.caseNumber, date: r.date, timeOfCall: r.timeOfCall, timePeriod: r.timePeriod,
      location: r.location, etdBase: r.etdBase ?? '', etaScene: r.etaScene ?? '',
      etdScene: r.etdScene ?? '', etaBase: r.etaBase ?? '',
      unit: r.unit, teamLeader: r.teamLeader, teamOfficer: r.teamOfficer, medics: r.medics,
      patientType: r.patientType, patientName: r.patientName, contactNumber: r.contactNumber,
      age: r.age, gender: r.gender, civilStatus: r.civilStatus, address: r.address,
      dateOfBirth: r.dateOfBirth, religion: r.religion, informantGuardian: r.informantGuardian,
      caseType: r.caseType, chiefComplaint: r.chiefComplaint,
      symptoms: r.symptoms, allergies: r.allergies, medications: r.medications,
      pertinentHistory: r.pertinentHistory, lastOralIntake: r.lastOralIntake, eventsLeading: r.eventsLeading,
      moisture: r.moisture, temperature: r.temperature, skinColor: r.skinColor,
      pupil: r.pupil, capillaryRefill: r.capillaryRefill, responsiveness: r.responsiveness,
      traumaFindings: [...r.traumaFindings],
      vitalSigns: r.vitalSigns.length > 0 ? r.vitalSigns.map(v => ({ ...v })) : [{ ...EMPTY_VITAL }],
      burnLocations: [...(r.burnLocations ?? [])], burnSurfaceArea: r.burnSurfaceArea ?? '',
      burnDegrees: [...r.burnDegrees], musculoskeletal: [...r.musculoskeletal],
      disposition: r.disposition, dispositionOther: r.dispositionOther ?? '',
      servicesRendered: [...r.servicesRendered],
      hospitalName: r.hospitalName, hospitalAddress: r.hospitalAddress, department: r.department,
      advanceCalledBy: r.advanceCalledBy, callReceivedBy: r.callReceivedBy, physicianOnDuty: r.physicianOnDuty,
      accomplishedBy: r.accomplishedBy, notedBy: r.notedBy,
      refusedTreatment: r.refusedTreatment, refusedTransport: r.refusedTransport, refusedServices: r.refusedServices,
      refusalRepresentativeOf: r.refusalRepresentativeOf ?? '',
      refusalPatientName: r.refusalPatientName, refusalRepresentativeName: r.refusalRepresentativeName,
      refusalAge: r.refusalAge, refusalRelationship: r.refusalRelationship,
      refusalDateTime: r.refusalDateTime ?? '', refusalContactNumber: r.refusalContactNumber,
      refusalWitnessName: r.refusalWitnessName, refusalWitnessAge: r.refusalWitnessAge,
      refusalWitnessRelationship: r.refusalWitnessRelationship,
      refusalWitnessDateTime: r.refusalWitnessDateTime ?? '', refusalWitnessContact: r.refusalWitnessContact,
      patientValuables: r.patientValuables, notes: r.notes,
      narrativeD: r.narrativeD ?? '', narrativeC: r.narrativeC ?? '',
      narrativeHx: r.narrativeHx ?? '', narrativeA: r.narrativeA ?? '',
      narrativeRx: r.narrativeRx ?? '', narrativeT: r.narrativeT ?? '',
      narrativeE: r.narrativeE ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/pcr/${editingRecord.id}`, form);
        toast.success('PCR record updated');
      } else {
        await api.post('/pcr', form);
        toast.success('PCR record created');
      }
      setShowForm(false);
      fetchRecords();
    } catch { toast.error('Failed to save PCR record'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/pcr/${deletingId}`);
      toast.success('Deleted');
      setDeletingId(null);
      fetchRecords();
    } catch { toast.error('Failed to delete'); }
  };

  const setField = <K extends keyof CreatePCRDTO>(key: K, val: CreatePCRDTO[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const toggleCheck = (field: 'traumaFindings' | 'servicesRendered' | 'burnDegrees' | 'musculoskeletal' | 'burnLocations', val: string) => {
    setForm(f => {
      const arr = f[field] as string[];
      return { ...f, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const addVitalRow = () => setForm(f => ({ ...f, vitalSigns: [...f.vitalSigns, { ...EMPTY_VITAL }] }));
  const removeVitalRow = (i: number) => setForm(f => ({ ...f, vitalSigns: f.vitalSigns.filter((_, idx) => idx !== i) }));
  const setVitalField = (i: number, key: keyof PCRVitalSign, val: string) =>
    setForm(f => {
      const vs = f.vitalSigns.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
      return { ...f, vitalSigns: vs };
    });


  const autoGenerateNarrative = () => {
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const fmtDate = (d: string) => { const dt = new Date(d); return isNaN(dt.getTime()) ? d : `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`; };
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    const D = `On ${fmtDate(form.date)} at ${form.timeOfCall} ${form.timePeriod}, ${form.unit || 'the unit'} was dispatched to ${form.location || 'the scene'} for a reported ${form.caseType || 'emergency'} case.`;
    const C = form.chiefComplaint ? `Patient presents with chief complaint of ${form.chiefComplaint}.` : '';
    const Hx = [
      form.symptoms        ? `Symptoms: ${form.symptoms}.` : '',
      form.allergies       ? `Allergies: ${form.allergies}.` : '',
      form.medications     ? `Current medications: ${form.medications}.` : '',
      form.pertinentHistory? `Pertinent history: ${form.pertinentHistory}.` : '',
      form.lastOralIntake  ? `Last oral intake: ${form.lastOralIntake}.` : '',
      form.eventsLeading   ? `Events leading: ${form.eventsLeading}.` : '',
    ].filter(Boolean).join(' ');
    const A = [
      form.responsiveness  ? `Patient is ${form.responsiveness}.` : '',
      (form.moisture || form.temperature || form.skinColor) ? `Skin is ${[form.moisture, form.temperature, form.skinColor].filter(Boolean).join(', ')}.` : '',
      form.pupil           ? `Pupils: ${form.pupil}.` : '',
      form.capillaryRefill ? `Capillary refill: ${form.capillaryRefill}.` : '',
      form.traumaFindings.length > 0 ? `Trauma findings: ${form.traumaFindings.join(', ')}.` : '',
      form.vitalSigns.length > 0 && form.vitalSigns[0].bp ? `Initial vitals — BP: ${form.vitalSigns[0].bp}, PR: ${form.vitalSigns[0].pr}, RR: ${form.vitalSigns[0].rr}, SpO2: ${form.vitalSigns[0].spo2}, Temp: ${form.vitalSigns[0].temp}.` : '',
    ].filter(Boolean).join(' ');
    const Rx = form.servicesRendered.length > 0 ? `Treatment rendered: ${form.servicesRendered.join(', ')}.` : 'No treatment rendered.';
    const T = form.disposition ? `Patient was ${form.disposition.replace(/-/g,' ')}${form.hospitalName ? ` to ${form.hospitalName}` : ''}${form.physicianOnDuty ? `. Physician on duty: ${cap(form.physicianOnDuty)}` : ''}.` : '';
    const E = [
      (form.refusedTreatment || form.refusedTransport || form.refusedServices)
        ? `Patient/representative refused: ${[form.refusedTreatment && 'treatment', form.refusedTransport && 'transport', form.refusedServices && 'services'].filter(Boolean).join(', ')}.`
        : '',
      form.notes ? form.notes : '',
    ].filter(Boolean).join(' ');

    setForm(f => ({ ...f, narrativeD: D, narrativeC: C, narrativeHx: Hx, narrativeA: A, narrativeRx: Rx, narrativeT: T, narrativeE: E }));
  };

  const anyRefusal = form.refusedTreatment || form.refusedTransport || form.refusedServices;

  const filtered = records.filter(r => {
    if (filterCaseType && r.caseType !== filterCaseType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.patientName.toLowerCase().includes(q) || r.caseNumber.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
    }
    return true;
  });

  const thisMonth = records.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pcr-view-content, .pcr-view-content * { visibility: visible; }
          .pcr-view-content {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            padding: 0;
          }
          .pcr-print-header { display: block !important; }
          .pcr-no-print { display: none !important; }
          @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
        }
        @media screen {
          .pcr-print-header { display: none !important; }
        }
      `}</style>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>PCR / Emergency Cases</Typography>
          <Typography variant="caption" color="text.secondary">Patient Care Reports for emergency accidents/incidents</Typography>
        </Box>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} size="small">
            New PCR
          </Button>
        )}
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Total Records', value: records.length, color: '#1e293b' },
          { label: 'Trauma', value: records.filter(r => r.caseType === 'trauma').length, color: '#dc2626' },
          { label: 'Medical', value: records.filter(r => r.caseType === 'medical').length, color: '#d97706' },
          { label: 'This Month', value: thisMonth, color: '#0284c7' },
        ].map(s => (
          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, borderTop: `4px solid ${s.color}` }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
        <TextField size="small" placeholder="Search patient, case #, location…" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} sx={{ flex: 1 }} />
        <TextField select size="small" value={filterCaseType} onChange={e => setFilterCaseType(e.target.value)}
          sx={{ minWidth: 150 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="trauma">Trauma</MenuItem>
          <MenuItem value="medical">Medical</MenuItem>
          <MenuItem value="activity">Activity</MenuItem>
          <MenuItem value="others">Others</MenuItem>
        </TextField>
      </Stack>

      {/* Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Case No.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Case Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Recorded By</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: 13 }}>
                      {records.length === 0 ? 'No PCR records yet. Click "New PCR" to add one.' : 'No records match your search.'}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((r, i) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{r.caseNumber}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.date ? new Date(r.date).toLocaleDateString('en-PH') : '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{r.patientName}</TableCell>
                    <TableCell>
                      <Chip label={r.patientType === 'cg-personnel' ? 'CG Personnel' : 'Civilian'}
                        size="small" variant="outlined"
                        sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      {r.caseType && (
                        <Chip label={r.caseType} size="small" color={caseTypeColor(r.caseType) as any}
                          sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, maxWidth: 150 }}>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.location}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.createdByName}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => setViewingRecord(r)} title="View">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canWrite && (
                          <IconButton size="small" onClick={() => openEdit(r)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canWrite && (
                          <IconButton size="small" color="error" onClick={() => setDeletingId(r.id)} title="Delete">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* PCR Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15, borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
          {editingRecord ? 'Edit PCR Record' : 'New Patient Care Report (PCR)'}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Box component="form" id="pcr-form" onSubmit={handleSave}>

            {/* === CASE / INCIDENT INFO === */}
            <SectionHeader>Case / Incident Information</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Case Number" required value={form.caseNumber}
                  onChange={e => setField('caseNumber', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Date" type="date" required value={form.date}
                  onChange={e => setField('date', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 8, sm: 3 }}>
                <TextField fullWidth size="small" label="Time of Call" type="time" value={form.timeOfCall}
                  onChange={e => setField('timeOfCall', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 4, sm: 1 }}>
                <TextField select fullWidth size="small" label="AM/PM" value={form.timePeriod}
                  onChange={e => setField('timePeriod', e.target.value as 'AM' | 'PM')}>
                  <MenuItem value="AM">AM</MenuItem>
                  <MenuItem value="PM">PM</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Location / Incident Site" required value={form.location}
                  onChange={e => setField('location', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField fullWidth size="small" label="ETD Base" type="time" value={form.etdBase}
                  onChange={e => setField('etdBase', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField fullWidth size="small" label="ETA Scene" type="time" value={form.etaScene}
                  onChange={e => setField('etaScene', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField fullWidth size="small" label="ETD Scene" type="time" value={form.etdScene}
                  onChange={e => setField('etdScene', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField fullWidth size="small" label="ETA Base" type="time" value={form.etaBase}
                  onChange={e => setField('etaBase', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Unit" value={form.unit}
                  onChange={e => setField('unit', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Team Leader" value={form.teamLeader}
                  onChange={e => setField('teamLeader', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Team Officer" value={form.teamOfficer}
                  onChange={e => setField('teamOfficer', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Medic/s" value={form.medics}
                  onChange={e => setField('medics', e.target.value)} />
              </Grid>
            </Grid>

            {/* === PATIENT INFORMATION === */}
            <SectionHeader>Patient Information</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Patient Type" value={form.patientType}
                  onChange={e => setField('patientType', e.target.value as any)}>
                  <MenuItem value="civilian">Civilian</MenuItem>
                  <MenuItem value="cg-personnel">CG Personnel</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth size="small" label="Patient Name" required value={form.patientName}
                  onChange={e => setField('patientName', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Contact Number" value={form.contactNumber}
                  onChange={e => setField('contactNumber', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth size="small" label="Age" value={form.age}
                  onChange={e => setField('age', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField select fullWidth size="small" label="Gender" value={form.gender}
                  onChange={e => setField('gender', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField select fullWidth size="small" label="Civil Status" value={form.civilStatus}
                  onChange={e => setField('civilStatus', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="S">Single</MenuItem>
                  <MenuItem value="M">Married</MenuItem>
                  <MenuItem value="W">Widowed</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Address" value={form.address}
                  onChange={e => setField('address', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Date of Birth" type="date" value={form.dateOfBirth}
                  onChange={e => setField('dateOfBirth', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Religion" value={form.religion}
                  onChange={e => setField('religion', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Informant / Guardian" value={form.informantGuardian}
                  onChange={e => setField('informantGuardian', e.target.value)} />
              </Grid>
            </Grid>

            {/* === CASE TYPE & CHIEF COMPLAINT === */}
            <SectionHeader>Case Type & Chief Complaint</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Case Type" value={form.caseType}
                  onChange={e => setField('caseType', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="trauma">Trauma</MenuItem>
                  <MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                  <MenuItem value="others">Others</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth size="small" label="Chief Complaint" value={form.chiefComplaint}
                  onChange={e => setField('chiefComplaint', e.target.value)} />
              </Grid>
            </Grid>

            {/* === SAMPLE HISTORY === */}
            <SectionHeader>SAMPLE History</SectionHeader>
            <Grid container spacing={2}>
              {[
                { key: 'symptoms' as const, label: 'S — Symptoms / Signs' },
                { key: 'allergies' as const, label: 'A — Allergies' },
                { key: 'medications' as const, label: 'M — Medications' },
                { key: 'pertinentHistory' as const, label: 'P — Pertinent Past History' },
                { key: 'lastOralIntake' as const, label: 'L — Last Oral Intake' },
                { key: 'eventsLeading' as const, label: 'E — Events Leading to Illness/Injury' },
              ].map(({ key, label }) => (
                <Grid key={key} size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label={label} multiline rows={2} value={form[key]}
                    onChange={e => setField(key, e.target.value)} />
                </Grid>
              ))}
            </Grid>

            {/* === PHYSICAL ASSESSMENT === */}
            <SectionHeader>Physical Assessment</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Skin Moisture" value={form.moisture}
                  onChange={e => setField('moisture', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="dry">Dry</MenuItem>
                  <MenuItem value="moist">Moist</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Skin Temperature" value={form.temperature}
                  onChange={e => setField('temperature', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="warm">Warm</MenuItem>
                  <MenuItem value="cool">Cool</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Skin Color" value={form.skinColor}
                  onChange={e => setField('skinColor', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="yellowish">Yellowish</MenuItem>
                  <MenuItem value="pale">Pale</MenuItem>
                  <MenuItem value="bluish">Bluish</MenuItem>
                  <MenuItem value="reddish">Reddish</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Pupil" value={form.pupil}
                  onChange={e => setField('pupil', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="pearl">Pearl</MenuItem>
                  <MenuItem value="constricted">Constricted</MenuItem>
                  <MenuItem value="dilated">Dilated</MenuItem>
                  <MenuItem value="unequal">Unequal</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Capillary Refill" value={form.capillaryRefill}
                  onChange={e => setField('capillaryRefill', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="normal">Normal (&lt;2s)</MenuItem>
                  <MenuItem value="delayed">Delayed (&gt;2s)</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField select fullWidth size="small" label="Responsiveness (AVPU)" value={form.responsiveness}
                  onChange={e => setField('responsiveness', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="alert">Alert</MenuItem>
                  <MenuItem value="verbal">Verbal</MenuItem>
                  <MenuItem value="pain">Pain</MenuItem>
                  <MenuItem value="unresponsive">Unresponsive</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* === TRAUMA FINDINGS === */}
            <SectionHeader>Trauma Findings</SectionHeader>
            <FormGroup row sx={{ gap: 0 }}>
              {PCR_TRAUMA_FINDINGS.map(item => (
                <FormControlLabel key={item} label={item}
                  control={<Checkbox size="small" checked={form.traumaFindings.includes(item)}
                    onChange={() => toggleCheck('traumaFindings', item)} />}
                  sx={{ width: { xs: '50%', sm: '33%', md: '25%' }, m: 0, '& .MuiFormControlLabel-label': { fontSize: 12 } }} />
              ))}
            </FormGroup>

            {/* === VITAL SIGNS === */}
            <SectionHeader>Vital Signs</SectionHeader>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { px: 0.75, py: 0.5, fontSize: 12 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    {['Time', 'BP', 'PR', 'RR', 'Temp', 'SpO2', 'GCS', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.vitalSigns.map((vs, i) => (
                    <TableRow key={i}>
                      {(['time', 'bp', 'pr', 'rr', 'temp', 'spo2', 'gcs'] as (keyof PCRVitalSign)[]).map(k => (
                        <TableCell key={k}>
                          <TextField size="small" value={vs[k]}
                            onChange={e => setVitalField(i, k, e.target.value)}
                            sx={{ '& .MuiInputBase-input': { py: 0.5, px: 0.75, fontSize: 12 } }}
                            placeholder={k === 'bp' ? '120/80' : k === 'time' ? 'HH:MM' : ''} />
                        </TableCell>
                      ))}
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeVitalRow(i)}
                          disabled={form.vitalSigns.length === 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Button size="small" startIcon={<AddIcon />} onClick={addVitalRow} sx={{ mt: 0.5 }}>
              Add Row
            </Button>

            {/* === BURN & MUSCULOSKELETAL === */}
            <SectionHeader>Burn Assessment (Rule of Nines) & Musculoskeletal</SectionHeader>

            {/* Body Diagram */}
            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Click body regions to mark burn areas. Orange = affected.
                {form.burnLocations.length > 0 && (
                  <Box component="span" sx={{ ml: 1, fontWeight: 700, color: 'error.main' }}>
                    Est. TBSA: {calcBurnPct(form.burnLocations)}%
                  </Box>
                )}
              </Typography>
              <Stack direction="row" spacing={3} justifyContent="center">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>FRONT</Typography>
                  <BodyFigure regions={FRONT_REGIONS} selected={form.burnLocations}
                    onToggle={id => toggleCheck('burnLocations', id)} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>BACK</Typography>
                  <BodyFigure regions={BACK_REGIONS} selected={form.burnLocations}
                    onToggle={id => toggleCheck('burnLocations', id)} />
                </Box>
              </Stack>
              {form.burnLocations.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Affected regions: </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {form.burnLocations.map(loc => {
                      const region = ALL_BURN_REGIONS.find(r => r.id === loc);
                      return region ? <Chip key={loc} label={`${region.label} (${region.pct}%)`} size="small" color="warning" /> : null;
                    })}
                  </Stack>
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Total Burn Surface Area %" value={form.burnSurfaceArea}
                  onChange={e => setField('burnSurfaceArea', e.target.value)}
                  placeholder={form.burnLocations.length > 0 ? `Est. ${calcBurnPct(form.burnLocations)}%` : ''} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Burn Degree</Typography>
                <FormGroup row>
                  {PCR_BURN_DEGREES.map(item => (
                    <FormControlLabel key={item} label={item}
                      control={<Checkbox size="small" checked={form.burnDegrees.includes(item)}
                        onChange={() => toggleCheck('burnDegrees', item)} />}
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Musculoskeletal</Typography>
                <FormGroup row>
                  {PCR_MUSCULOSKELETAL.map(item => (
                    <FormControlLabel key={item} label={item}
                      control={<Checkbox size="small" checked={form.musculoskeletal.includes(item)}
                        onChange={() => toggleCheck('musculoskeletal', item)} />}
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }} />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>

            {/* === SERVICES RENDERED === */}
            <SectionHeader>Services Rendered</SectionHeader>
            <FormGroup row sx={{ gap: 0, mb: 1.5 }}>
              {PCR_SERVICES_RENDERED.map(item => (
                <FormControlLabel key={item} label={item}
                  control={<Checkbox size="small" checked={form.servicesRendered.includes(item)}
                    onChange={() => toggleCheck('servicesRendered', item)} />}
                  sx={{ width: { xs: '50%', sm: '33%', md: '25%' }, m: 0, '& .MuiFormControlLabel-label': { fontSize: 12 } }} />
              ))}
            </FormGroup>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="Disposition" value={form.disposition}
                  onChange={e => setField('disposition', e.target.value as any)}>
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="transported-hospital">Transported to Hospital</MenuItem>
                  <MenuItem value="released-treatment">Released with Treatment</MenuItem>
                  <MenuItem value="released-no-treatment">Released without Treatment</MenuItem>
                  <MenuItem value="endorsed-ems">Endorsed to EMS</MenuItem>
                  <MenuItem value="transported-other">Transported to Other Facility</MenuItem>
                </TextField>
              </Grid>
              {(form.disposition === 'transported-other' || form.disposition === 'released-treatment') && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Disposition Details" value={form.dispositionOther}
                    onChange={e => setField('dispositionOther', e.target.value)} />
                </Grid>
              )}
            </Grid>

            {/* === HOSPITAL CONDUCTION === */}
            <SectionHeader>Hospital Conduction</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Hospital Name" value={form.hospitalName}
                  onChange={e => setField('hospitalName', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Hospital Address" value={form.hospitalAddress}
                  onChange={e => setField('hospitalAddress', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Department" value={form.department}
                  onChange={e => setField('department', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Advance Called By" value={form.advanceCalledBy}
                  onChange={e => setField('advanceCalledBy', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Call Received By" value={form.callReceivedBy}
                  onChange={e => setField('callReceivedBy', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Physician on Duty" value={form.physicianOnDuty}
                  onChange={e => setField('physicianOnDuty', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Accomplished By" value={form.accomplishedBy}
                  onChange={e => setField('accomplishedBy', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Noted By" value={form.notedBy}
                  onChange={e => setField('notedBy', e.target.value)} />
              </Grid>
            </Grid>

            {/* === RELEASE FROM RESPONSIBILITY === */}
            <SectionHeader>Release from Responsibility</SectionHeader>
            <Stack direction="row" spacing={2} flexWrap="wrap" mb={0.5}>
              <FormControlLabel label="Refused Treatment" control={
                <Checkbox size="small" checked={form.refusedTreatment}
                  onChange={e => setField('refusedTreatment', e.target.checked)} />
              } sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 600 } }} />
              <FormControlLabel label="Refused Transport" control={
                <Checkbox size="small" checked={form.refusedTransport}
                  onChange={e => setField('refusedTransport', e.target.checked)} />
              } sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 600 } }} />
              <FormControlLabel label="Refused Services" control={
                <Checkbox size="small" checked={form.refusedServices}
                  onChange={e => setField('refusedServices', e.target.checked)} />
              } sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 600 } }} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>
              Check one or more boxes above to fill in the release form details.
            </Typography>
            {anyRefusal && (
              <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 1, p: 2 }}>
                {/* Legal text */}
                <Typography variant="body2" sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1.5, lineHeight: 1.7, fontStyle: 'italic' }}>
                  I hereby acknowledge and state that I had been advised regarding my present physical condition, and I decided on behalf of myself/the person I represent, to voluntary refuse to receive or accept such medical care and/or transportation though recommended by representative/s of{' '}
                  <Box component="span" sx={{ fontStyle: 'normal', fontWeight: 600 }}>
                    {form.refusalRepresentativeOf || '___________________________'}
                  </Box>
                  . I am fully aware of the possible consequences of my decision as I refuse such services, and I do release and fully discharge its officers, employees, volunteers, medical consultants or agents from any and all liabilities in the premise and agree to hold them harmless.
                </Typography>

                <TextField fullWidth size="small" label="Representative/s of (organization/unit)" value={form.refusalRepresentativeOf}
                  onChange={e => setField('refusalRepresentativeOf', e.target.value)}
                  sx={{ mb: 2 }} />

                <Typography variant="caption" fontWeight={700} color="error.main" display="block" mb={1}>
                  Signature of Patient / Representative
                </Typography>
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField fullWidth size="small" label="Printed Name of Patient" value={form.refusalPatientName}
                      onChange={e => setField('refusalPatientName', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Printed Name of Representative" value={form.refusalRepresentativeName}
                      onChange={e => setField('refusalRepresentativeName', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1 }}>
                    <TextField fullWidth size="small" label="Age" value={form.refusalAge}
                      onChange={e => setField('refusalAge', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField fullWidth size="small" label="Relationship to Patient" value={form.refusalRelationship}
                      onChange={e => setField('refusalRelationship', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Date / Time" type="datetime-local" value={form.refusalDateTime}
                      onChange={e => setField('refusalDateTime', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Contact No." value={form.refusalContactNumber}
                      onChange={e => setField('refusalContactNumber', e.target.value)} />
                  </Grid>
                </Grid>

                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                  Signature of Witness (Non-service)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField fullWidth size="small" label="Printed Name of Witness" value={form.refusalWitnessName}
                      onChange={e => setField('refusalWitnessName', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1 }}>
                    <TextField fullWidth size="small" label="Age" value={form.refusalWitnessAge}
                      onChange={e => setField('refusalWitnessAge', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField fullWidth size="small" label="Relationship to Patient" value={form.refusalWitnessRelationship}
                      onChange={e => setField('refusalWitnessRelationship', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Date / Time" type="datetime-local" value={form.refusalWitnessDateTime}
                      onChange={e => setField('refusalWitnessDateTime', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Contact No." value={form.refusalWitnessContact}
                      onChange={e => setField('refusalWitnessContact', e.target.value)} />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* === PATIENT VALUABLES & NOTES === */}
            <SectionHeader>Patient Valuables & Notes</SectionHeader>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Patient Valuables" multiline rows={2} value={form.patientValuables}
                  onChange={e => setField('patientValuables', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Additional Notes / Remarks" multiline rows={3} value={form.notes}
                  onChange={e => setField('notes', e.target.value)} />
              </Grid>
            </Grid>

            {/* === NARRATIVE REPORT (DCHARxTE) === */}
            <SectionHeader>Narrative Report (DCHARxTE)</SectionHeader>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button size="small" variant="outlined" onClick={autoGenerateNarrative}>
                Auto-generate from form data
              </Button>
            </Box>
            <Grid container spacing={2}>
              {([
                { key: 'narrativeD'  as const, label: 'D — Dispatch',        rows: 2, hint: 'When and where the unit was dispatched' },
                { key: 'narrativeC'  as const, label: 'C — Chief Complaint',  rows: 2, hint: 'Patient presenting complaint' },
                { key: 'narrativeHx' as const, label: 'Hx — History',         rows: 3, hint: 'SAMPLE history, pertinent medical background' },
                { key: 'narrativeA'  as const, label: 'A — Assessment',       rows: 3, hint: 'Physical exam findings, vital signs, level of consciousness' },
                { key: 'narrativeRx' as const, label: 'Rx — Treatment',       rows: 3, hint: 'Interventions, medications, procedures performed' },
                { key: 'narrativeT'  as const, label: 'T — Transport',        rows: 2, hint: 'Mode, destination, patient condition during transport' },
                { key: 'narrativeE'  as const, label: 'E — Exceptions',       rows: 2, hint: 'Any unusual circumstances, refusals, or additional notes' },
              ] as { key: 'narrativeD'|'narrativeC'|'narrativeHx'|'narrativeA'|'narrativeRx'|'narrativeT'|'narrativeE'; label: string; rows: number; hint: string }[]).map(({ key, label, rows, hint }) => (
                <Grid key={key} size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label={label} multiline rows={rows}
                    value={form[key]} onChange={e => setField(key, e.target.value)}
                    placeholder={hint}
                    sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: 13 } }} />
                </Grid>
              ))}
            </Grid>

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" form="pcr-form" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : editingRecord ? 'Update Record' : 'Create Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View / Print Dialog */}
      <Dialog open={!!viewingRecord} onClose={() => setViewingRecord(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15, borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>PCR Record — {viewingRecord?.caseNumber}</span>
            <Button size="small" startIcon={<PrintIcon />} onClick={() => window.print()} variant="outlined">
              Print
            </Button>
          </Stack>
        </DialogTitle>
        {viewingRecord && (
          <DialogContent dividers className="pcr-view-content" sx={{ p: 2.5 }}>
            {/* PCG Print Header — screen:hidden, print:visible */}
            <div className="pcr-print-header" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12 }}>
              {/* Logo row — table for reliable print layout */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, border: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 76, verticalAlign: 'middle', border: 'none', padding: 0 }}>
                      <img src="/image.png" alt="PCG Logo" style={{ width: 70, height: 70, objectFit: 'contain', display: 'block' }} />
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: '0 8px' }}>
                      <div style={{ fontSize: 11 }}>Republic of the Philippines</div>
                      <div style={{ fontSize: 11 }}>Philippine Coast Guard</div>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
                        Coast Guard Medical Station – Eastern Visayas
                      </div>
                      <div style={{ fontSize: 10, color: '#555' }}>
                        Brgy 99 Diit, Tacloban City, Leyte | Tel: 09934532670 | cgmedclev@gmail.com
                      </div>
                    </td>
                    <td style={{ width: 76, verticalAlign: 'middle', textAlign: 'right', border: 'none', padding: 0 }}>
                      <img src="/logo.png" alt="Station Logo" style={{ width: 70, height: 70, objectFit: 'contain', display: 'block', marginLeft: 'auto' }} />
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Title bar */}
              <div style={{ textAlign: 'center', borderTop: '2px solid #000', borderBottom: '1px solid #000', padding: '3px 0', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Patient Care Report (PCR)
                </span>
              </div>
              {/* Meta row */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ border: 'none', padding: '0 4px 0 0', whiteSpace: 'nowrap' }}>
                      Case No.: <strong>{viewingRecord?.caseNumber}</strong>
                    </td>
                    <td style={{ border: 'none', padding: '0 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      Date: <strong>{viewingRecord?.date ? new Date(viewingRecord.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</strong>
                    </td>
                    <td style={{ border: 'none', padding: '0 0 0 4px', textAlign: 'right' }}>
                      Location: <strong>{viewingRecord?.location}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Case Info */}
            <SectionHeader>Case / Incident Information</SectionHeader>
            <Grid container spacing={1.5}>
              {[
                ['Case Number', viewingRecord.caseNumber],
                ['Date', viewingRecord.date ? new Date(viewingRecord.date).toLocaleDateString('en-PH') : '—'],
                ['Time of Call', `${viewingRecord.timeOfCall} ${viewingRecord.timePeriod}`],
                ['Location', viewingRecord.location],
                ['ETD Base', viewingRecord.etdBase || '—'],
                ['ETA Scene', viewingRecord.etaScene || '—'],
                ['ETD Scene', viewingRecord.etdScene || '—'],
                ['ETA Base', viewingRecord.etaBase || '—'],
                ['Unit', viewingRecord.unit],
                ['Team Leader', viewingRecord.teamLeader],
                ['Team Officer', viewingRecord.teamOfficer],
                ['Medics', viewingRecord.medics],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Patient Info */}
            <SectionHeader>Patient Information</SectionHeader>
            <Grid container spacing={1.5}>
              {[
                ['Patient Type', viewingRecord.patientType === 'cg-personnel' ? 'CG Personnel' : 'Civilian'],
                ['Patient Name', viewingRecord.patientName],
                ['Contact Number', viewingRecord.contactNumber],
                ['Age', viewingRecord.age],
                ['Gender', viewingRecord.gender === 'M' ? 'Male' : viewingRecord.gender === 'F' ? 'Female' : '—'],
                ['Civil Status', viewingRecord.civilStatus === 'S' ? 'Single' : viewingRecord.civilStatus === 'M' ? 'Married' : viewingRecord.civilStatus === 'W' ? 'Widowed' : '—'],
                ['Date of Birth', viewingRecord.dateOfBirth],
                ['Religion', viewingRecord.religion],
                ['Informant/Guardian', viewingRecord.informantGuardian],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" display="block">Address</Typography>
                <Typography variant="body2" fontWeight={500}>{viewingRecord.address || '—'}</Typography>
              </Grid>
            </Grid>

            {/* Case Type & Complaint */}
            <SectionHeader>Case Type & Chief Complaint</SectionHeader>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" display="block">Case Type</Typography>
                {viewingRecord.caseType ? (
                  <Chip label={viewingRecord.caseType} size="small" color={caseTypeColor(viewingRecord.caseType) as any}
                    sx={{ textTransform: 'capitalize', mt: 0.25 }} />
                ) : <Typography variant="body2">—</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Typography variant="caption" color="text.secondary" display="block">Chief Complaint</Typography>
                <Typography variant="body2" fontWeight={500}>{viewingRecord.chiefComplaint || '—'}</Typography>
              </Grid>
            </Grid>

            {/* SAMPLE */}
            <SectionHeader>SAMPLE History</SectionHeader>
            <Grid container spacing={1.5}>
              {[
                ['Symptoms', viewingRecord.symptoms], ['Allergies', viewingRecord.allergies],
                ['Medications', viewingRecord.medications], ['Pertinent History', viewingRecord.pertinentHistory],
                ['Last Oral Intake', viewingRecord.lastOralIntake], ['Events Leading', viewingRecord.eventsLeading],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2">{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Physical Assessment */}
            <SectionHeader>Physical Assessment</SectionHeader>
            <Grid container spacing={1.5}>
              {[
                ['Moisture', viewingRecord.moisture], ['Temperature', viewingRecord.temperature],
                ['Skin Color', viewingRecord.skinColor], ['Pupil', viewingRecord.pupil],
                ['Capillary Refill', viewingRecord.capillaryRefill], ['Responsiveness', viewingRecord.responsiveness],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Trauma Findings */}
            {viewingRecord.traumaFindings.length > 0 && <>
              <SectionHeader>Trauma Findings</SectionHeader>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {viewingRecord.traumaFindings.map(t => <Chip key={t} label={t} size="small" variant="outlined" color="error" />)}
              </Stack>
            </>}

            {/* Vital Signs */}
            {viewingRecord.vitalSigns.length > 0 && <>
              <SectionHeader>Vital Signs</SectionHeader>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      {['Time', 'BP', 'PR', 'RR', 'Temp', 'SpO2', 'GCS'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingRecord.vitalSigns.map((vs, i) => (
                      <TableRow key={i}>
                        {[vs.time, vs.bp, vs.pr, vs.rr, vs.temp, vs.spo2, vs.gcs].map((v, j) => (
                          <TableCell key={j} sx={{ fontSize: 12 }}>{v || '—'}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>}

            {/* Burn & Musculoskeletal */}
            {((viewingRecord.burnLocations ?? []).length > 0 || viewingRecord.burnDegrees.length > 0 || viewingRecord.musculoskeletal.length > 0) && <>
              <SectionHeader>Burn Assessment & Musculoskeletal</SectionHeader>
              {(viewingRecord.burnLocations ?? []).length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={3} justifyContent="flex-start" mb={1}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>FRONT</Typography>
                      <BodyFigure regions={FRONT_REGIONS} selected={viewingRecord.burnLocations ?? []} readOnly />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>BACK</Typography>
                      <BodyFigure regions={BACK_REGIONS} selected={viewingRecord.burnLocations ?? []} readOnly />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Affected Regions</Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {(viewingRecord.burnLocations ?? []).map(loc => {
                          const region = ALL_BURN_REGIONS.find(r => r.id === loc);
                          return region ? <Chip key={loc} label={`${region.label} (${region.pct}%)`} size="small" color="warning" /> : null;
                        })}
                      </Stack>
                      {viewingRecord.burnSurfaceArea && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">Total Burn Surface Area</Typography>
                          <Typography variant="body2" fontWeight={700} color="error.main">{viewingRecord.burnSurfaceArea}%</Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>
              )}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Burn Degree</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {viewingRecord.burnDegrees.length > 0
                      ? viewingRecord.burnDegrees.map(b => <Chip key={b} label={b} size="small" color="warning" />)
                      : <Typography variant="body2" color="text.secondary">None</Typography>}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Musculoskeletal</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {viewingRecord.musculoskeletal.length > 0
                      ? viewingRecord.musculoskeletal.map(m => <Chip key={m} label={m} size="small" color="info" />)
                      : <Typography variant="body2" color="text.secondary">None</Typography>}
                  </Stack>
                </Grid>
              </Grid>
            </>}

            {/* Services */}
            {viewingRecord.servicesRendered.length > 0 && <>
              <SectionHeader>Services Rendered</SectionHeader>
              <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1}>
                {viewingRecord.servicesRendered.map(s => <Chip key={s} label={s} size="small" color="success" variant="outlined" />)}
              </Stack>
            </>}
            {viewingRecord.disposition && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Disposition</Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {viewingRecord.disposition.replace(/-/g, ' ')}
                  {viewingRecord.dispositionOther ? ` — ${viewingRecord.dispositionOther}` : ''}
                </Typography>
              </Box>
            )}

            {/* Hospital */}
            <SectionHeader>Hospital Conduction</SectionHeader>
            <Grid container spacing={1.5}>
              {[
                ['Hospital Name', viewingRecord.hospitalName], ['Address', viewingRecord.hospitalAddress],
                ['Department', viewingRecord.department], ['Advance Called By', viewingRecord.advanceCalledBy],
                ['Call Received By', viewingRecord.callReceivedBy], ['Physician on Duty', viewingRecord.physicianOnDuty],
                ['Accomplished By', viewingRecord.accomplishedBy], ['Noted By', viewingRecord.notedBy],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Refusal */}
            {(viewingRecord.refusedTreatment || viewingRecord.refusedTransport || viewingRecord.refusedServices) && <>
              <SectionHeader>Release from Responsibility</SectionHeader>
              <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
                {viewingRecord.refusedTreatment && <Chip label="Refused Treatment" size="small" color="error" />}
                {viewingRecord.refusedTransport && <Chip label="Refused Transport" size="small" color="error" />}
                {viewingRecord.refusedServices && <Chip label="Refused Services" size="small" color="error" />}
              </Stack>
              <Typography variant="body2" sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1.5, lineHeight: 1.7, fontStyle: 'italic' }}>
                I hereby acknowledge and state that I had been advised regarding my present physical condition, and I decided on behalf of myself/the person I represent, to voluntary refuse to receive or accept such medical care and/or transportation though recommended by representative/s of{' '}
                <Box component="span" sx={{ fontStyle: 'normal', fontWeight: 600 }}>{viewingRecord.refusalRepresentativeOf || '___________________________'}</Box>.
                I am fully aware of the possible consequences of my decision as I refuse such services, and I do release and fully discharge its officers, employees, volunteers, medical consultants or agents from any and all liabilities in the premise and agree to hold them harmless.
              </Typography>
              <Typography variant="caption" fontWeight={700} color="error.main" display="block" mb={0.75}>Patient / Representative</Typography>
              <Grid container spacing={1.5} mb={1.5}>
                {[
                  ['Printed Name (Patient)', viewingRecord.refusalPatientName],
                  ['Printed Name (Representative)', viewingRecord.refusalRepresentativeName],
                  ['Age', viewingRecord.refusalAge],
                  ['Relationship to Patient', viewingRecord.refusalRelationship],
                  ['Date / Time', viewingRecord.refusalDateTime],
                  ['Contact No.', viewingRecord.refusalContactNumber],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2">{value || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.75}>Witness (Non-service)</Typography>
              <Grid container spacing={1.5}>
                {[
                  ['Printed Name', viewingRecord.refusalWitnessName],
                  ['Age', viewingRecord.refusalWitnessAge],
                  ['Relationship to Patient', viewingRecord.refusalWitnessRelationship],
                  ['Date / Time', viewingRecord.refusalWitnessDateTime],
                  ['Contact No.', viewingRecord.refusalWitnessContact],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2">{value || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </>}


            {/* Narrative Report */}
            {(viewingRecord.narrativeD || viewingRecord.narrativeC || viewingRecord.narrativeHx ||
              viewingRecord.narrativeA || viewingRecord.narrativeRx || viewingRecord.narrativeT || viewingRecord.narrativeE) && <>
              <SectionHeader>Narrative Report (DCHARxTE)</SectionHeader>
              <Box sx={{ bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                {([
                  { key: 'narrativeD',  label: 'D — Dispatch' },
                  { key: 'narrativeC',  label: 'C — Chief Complaint' },
                  { key: 'narrativeHx', label: 'Hx — History' },
                  { key: 'narrativeA',  label: 'A — Assessment' },
                  { key: 'narrativeRx', label: 'Rx — Treatment' },
                  { key: 'narrativeT',  label: 'T — Transport' },
                  { key: 'narrativeE',  label: 'E — Exceptions' },
                ] as { key: keyof typeof viewingRecord; label: string }[]).map(({ key, label }) =>
                  viewingRecord[key] ? (
                    <Box key={key} sx={{ mb: 1.5 }}>
                      <Typography variant="caption" fontWeight={700} color="primary.main" display="block">{label}</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {viewingRecord[key] as string}
                      </Typography>
                    </Box>
                  ) : null
                )}
              </Box>
            </>}

            {/* Notes */}
            {(viewingRecord.patientValuables || viewingRecord.notes) && <>
              <SectionHeader>Patient Valuables & Notes</SectionHeader>
              {viewingRecord.patientValuables && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">Patient Valuables</Typography>
                  <Typography variant="body2">{viewingRecord.patientValuables}</Typography>
                </Box>
              )}
              {viewingRecord.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{viewingRecord.notes}</Typography>
                </Box>
              )}
            </>}
          </DialogContent>
        )}
        <DialogActions className="pcr-no-print" sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setViewingRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete PCR Record</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this record? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
