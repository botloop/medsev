import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import type { ClinicalRecord, CreateClinicalRecordDTO, Personnel, VitalSigns } from '@shared/types/personnel.types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';

// ── BMI Utilities ──────────────────────────────────────────────────────────────
function parseNum(s?: string): number | null {
  const n = parseFloat((s ?? '').replace(/[^\d.]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
}

function calcBMI(weight?: string, height?: string): number | null {
  const w = parseNum(weight);
  const h = parseNum(height);
  if (!w || !h) return null;
  return w / ((h / 100) ** 2);
}

function bmiCategory(bmi: number): { label: string; chipColor: 'info' | 'success' | 'warning' | 'error'; lineColor: string } {
  if (bmi < 18.5) return { label: 'Underweight', chipColor: 'info',    lineColor: '#0ea5e9' };
  if (bmi < 25)   return { label: 'Normal',       chipColor: 'success', lineColor: '#16a34a' };
  if (bmi < 30)   return { label: 'Overweight',   chipColor: 'warning', lineColor: '#d97706' };
  return             { label: 'Obese',         chipColor: 'error',   lineColor: '#dc2626' };
}

interface ClinicalRecordsModalProps {
  personnelId: string;
  personnelName: string;
  personnel?: Personnel;
  onClose: () => void;
}

const EMPTY_FORM: CreateClinicalRecordDTO = {
  date: new Date().toISOString().split('T')[0],
  assessmentDateTime: new Date().toISOString().slice(0, 16),
  illnessOnsetDateTime: '',
  gender: '',
  complaint: '',
  diagnosis: '',
  treatment: '',
  physician: '',
  vitalSigns: { bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', spO2: '', weight: '', height: '' },
  physicalExam: '',
  pmhx: '',
  psHx: '',
  fhx: '',
  shx: '',
  allergies: '',
  medications: '',
  covidVaccinated: undefined,
  covidVaccineDetails: '',
  notes: ''
};

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Accordion expanded={open} onChange={(_, exp) => setOpen(exp)} disableGutters elevation={0}
      sx={{ border: 1, borderColor: 'divider', mb: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50', minHeight: 44 }}>
        <Typography variant="body2" fontWeight={700}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" display="block" mb={0.5}>{label}</Typography>
    {children}
  </Box>
);

const fmtDate = (d: Date | string | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtDateTime = (d: string | undefined) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return d; }
};

const row = (label: string, value: string | undefined) =>
  value ? `<tr><td class="label">${label}</td><td>${value}</td></tr>` : '';

const section = (title: string, content: string) =>
  content.trim() ? `<div class="section"><div class="section-title">${title}</div>${content}</div>` : '';

const printClinicalRecord = (record: ClinicalRecord, personnelName: string) => {
  const vs = record.vitalSigns;
  const vitalsRow = vs ? [
    vs.bloodPressure ? `BP: ${vs.bloodPressure} mmHg` : '',
    vs.heartRate ? `HR: ${vs.heartRate} bpm` : '',
    vs.respiratoryRate ? `RR: ${vs.respiratoryRate}/min` : '',
    vs.temperature ? `Temp: ${vs.temperature}°C` : '',
    vs.spO2 ? `SpO₂: ${vs.spO2}%` : '',
    vs.weight ? `Wt: ${vs.weight} kg` : '',
    vs.height ? `Ht: ${vs.height} cm` : '',
  ].filter(Boolean).join(' &nbsp;|&nbsp; ') : '';

  const covidText = record.covidVaccinated === true
    ? `Vaccinated${record.covidVaccineDetails ? ' — ' + record.covidVaccineDetails : ''}`
    : record.covidVaccinated === false ? 'Not vaccinated' : 'Unknown';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Clinical Record — ${personnelName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; padding: 20mm 20mm 15mm 20mm; }
  .header { display: flex; align-items: center; border-bottom: 3px solid #0d5c9e; padding-bottom: 10px; margin-bottom: 14px; }
  .header-seal { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; }
  .header-center { flex: 1; text-align: center; padding: 0 14px; }
  .header-republic { font-size: 9pt; color: #555; margin-bottom: 2px; }
  .header-district { font-size: 13pt; font-weight: bold; color: #0d5c9e; text-transform: uppercase; line-height: 1.2; margin-bottom: 2px; }
  .header-station { font-size: 10pt; color: #333; margin-bottom: 2px; }
  .header-address { font-size: 8.5pt; color: #666; }
  .doc-title { text-align: center; font-size: 14pt; font-weight: bold; color: #0d5c9e; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 4px; }
  .doc-subtitle { text-align: center; font-size: 9pt; color: #555; margin-bottom: 14px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
  .patient-box { background: #f0f6ff; border: 1px solid #b0c8e8; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; display: flex; gap: 30px; }
  .patient-box .field { }
  .patient-box .field label { font-size: 8pt; color: #666; display: block; text-transform: uppercase; }
  .patient-box .field span { font-size: 11pt; font-weight: bold; color: #0d5c9e; }
  .section { margin-bottom: 10px; break-inside: avoid; }
  .section-title { background: #0d5c9e; color: #fff; font-size: 9pt; font-weight: bold; text-transform: uppercase; padding: 4px 8px; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  td { padding: 4px 6px; vertical-align: top; border: 1px solid #ddd; }
  td.label { background: #f5f5f5; font-weight: bold; width: 28%; white-space: nowrap; color: #333; }
  .vitals-grid { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; }
  .vital-chip { background: #eef4ff; border: 1px solid #b0c8e8; padding: 4px 10px; border-radius: 20px; font-size: 10pt; }
  .allergy-chip { background: #fff0f0; border: 1px solid #f5c0c0; color: #a00; padding: 4px 10px; border-radius: 20px; font-size: 10pt; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pre { white-space: pre-wrap; }
  .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9pt; color: #666; }
  .sig-line { border-top: 1px solid #333; width: 180px; margin-top: 30px; text-align: center; font-size: 9pt; }
  @media print { body { padding: 10mm; } }
</style>
</head>
<body>
<div class="header">
  <img class="header-seal" src="${window.location.origin}/image.png" alt="PCG Medical Logo" onerror="this.style.display='none'">
  <div class="header-center">
    <div class="header-republic">Philippine Coast Guard</div>
    <div class="header-district">Coast Guard District – Eastern Visayas</div>
    <div class="header-station">Coast Guard Medical Station – Eastern Visayas</div>
    <div class="header-address">Brgy 99 Diit, Tacloban City, Leyte | Tel: 09934532670 | cgmedclev@gmail.com</div>
  </div>
  <div style="display:flex; flex-direction:column; align-items:center; flex-shrink:0; gap:4px;">
    <img class="header-seal" src="${window.location.origin}/logo.png" alt="PCG Medical Logo" onerror="this.style.display='none'">
    <div style="text-align:center; font-size:8pt; color:#666;">
      <div>Printed: ${new Date().toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}</div>
      <div>Record Date: ${fmtDate(record.date)}</div>
    </div>
  </div>
</div>
<div class="doc-title">Clinical Assessment Record</div>
<div class="doc-subtitle">CONFIDENTIAL — FOR OFFICIAL USE ONLY</div>
<div class="patient-box">
  <div class="field"><label>Patient Name</label><span>${personnelName}</span></div>
  ${record.gender ? `<div class="field"><label>Gender</label><span>${record.gender}</span></div>` : ''}
  <div class="field"><label>Attending Physician</label><span>${record.physician}</span></div>
  <div class="field"><label>Visit Date</label><span>${fmtDate(record.date)}</span></div>
  ${record.assessmentDateTime ? `<div class="field"><label>Assessment Time</label><span>${fmtDateTime(record.assessmentDateTime)}</span></div>` : ''}
  ${record.illnessOnsetDateTime ? `<div class="field"><label>Illness Started</label><span>${fmtDateTime(record.illnessOnsetDateTime)}</span></div>` : ''}
</div>
${vitalsRow ? `
<div class="section">
  <div class="section-title">❤️ Vital Signs</div>
  <div class="vitals-grid">${vitalsRow.split('&nbsp;|&nbsp;').map(v => `<span class="vital-chip">${v.trim()}</span>`).join('')}</div>
</div>` : ''}
${section('🩺 Chief Complaint &amp; Management',
  `<table>
    ${row('Chief Complaint', record.complaint)}
    ${row('Diagnosis', record.diagnosis)}
    ${row('Treatment / Management', record.treatment)}
  </table>`
)}
${record.physicalExam ? section('🔬 Physical Examination',
  `<div style="padding:6px; border:1px solid #ddd; white-space:pre-wrap; font-size:10pt;">${record.physicalExam}</div>`
) : ''}
${(record.covidVaccinated !== undefined) ? section('💉 COVID-19 Vaccination',
  `<table>${row('Vaccination Status', covidText)}</table>`
) : ''}
${(record.pmhx || record.psHx || record.fhx || record.shx || record.allergies || record.medications) ? `
<div class="section">
  <div class="section-title">📋 Comprehensive History</div>
  <table>
    ${row('PMHx — Past Medical History', record.pmhx?.replace(/\n/g, '<br>'))}
    ${row('PSHx — Past Surgical History', record.psHx?.replace(/\n/g, '<br>'))}
    ${row('FHx — Family History', record.fhx?.replace(/\n/g, '<br>'))}
    ${row('SHx — Social History', record.shx?.replace(/\n/g, '<br>'))}
    ${row('Allergies', record.allergies ? `<span style="color:#a00;font-weight:bold;">⚠️ ${record.allergies}</span>` : '')}
    ${row('Current Medications', record.medications?.replace(/\n/g, '<br>'))}
  </table>
</div>` : ''}
${record.notes ? section('📝 Notes / Remarks',
  `<div style="padding:6px; border:1px solid #ddd; font-style:italic;">${record.notes}</div>`
) : ''}
<div class="footer">
  <div>
    <div class="sig-line">Attending Physician Signature</div>
    <div style="margin-top:4px; font-size:9pt;">${record.physician}</div>
  </div>
  <div style="text-align:right; font-size:8pt; color:#999;">
    Philippine Coast Guard Personnel Management System<br>
    This document is confidential and for official use only.
  </div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) { win.document.write(html); win.document.close(); }
};

const printPrescription = (record: ClinicalRecord, personnelName: string, personnel?: Personnel) => {
  const age = personnel?.birthdate
    ? Math.floor((Date.now() - new Date(personnel.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const rxContent = [record.treatment, record.medications].filter(Boolean).join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Prescription — ${personnelName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 5.5in 8.5in; margin: 0.5in; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; width: 5in; margin: 0 auto; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .seal { width: 80px; height: 80px; object-fit: contain; flex-shrink: 0; }
  .header-center { text-align: center; flex: 1; padding: 0 10px; }
  .header-center .republic  { font-size: 9pt; color: #555; margin-bottom: 2px; }
  .header-center .org-name  { font-size: 13pt; font-weight: bold; color: #1a3a6b; text-transform: uppercase; line-height: 1.2; margin-bottom: 2px; }
  .header-center .org-english { font-size: 10pt; color: #333; margin-bottom: 2px; }
  .header-center .dept-name { font-size: 8.5pt; color: #666; }
  .divider-thick { border: none; border-top: 3px solid #1a3a6b; margin: 8px 0 4px; }
  .divider-thin  { border: none; border-top: 1px solid #1a3a6b; margin: 0 0 10px; }
  .patient-section { margin: 10px 0 6px; }
  .pfield { display: flex; align-items: flex-end; margin-bottom: 7px; gap: 4px; }
  .pfield .lbl { font-size: 10pt; font-weight: bold; white-space: nowrap; min-width: 62px; }
  .pfield .val { flex: 1; border-bottom: 1px solid #333; min-height: 18px; font-size: 10.5pt; padding: 0 4px 2px; }
  .prow { display: flex; gap: 14px; }
  .prow .pfield { flex: 1; }
  .rx-section { display: flex; margin: 14px 0 8px; }
  .rx-sym { font-size: 52pt; font-weight: bold; color: #1a3a6b; font-style: italic; font-family: "Times New Roman", Georgia, serif; line-height: 1; margin-right: 10px; flex-shrink: 0; padding-top: 2px; }
  .rx-body { flex: 1; }
  .rx-text { white-space: pre-wrap; font-size: 11pt; line-height: 2.1; min-height: 40px; }
  .rx-blank-line { border-bottom: 1px solid #bbb; min-height: 28px; margin-bottom: 4px; }
  .sig-block { margin-top: 24px; float: right; width: 220px; }
  .sig-name  { font-size: 11pt; font-weight: bold; text-align: center; border-bottom: 2px solid #333; padding-bottom: 2px; color: #1a3a6b; }
  .sig-title { font-size: 8.5pt; text-align: center; color: #555; margin-bottom: 10px; }
  .sig-row   { display: flex; align-items: flex-end; margin-bottom: 6px; gap: 6px; }
  .sig-lbl   { font-size: 9pt; font-weight: bold; white-space: nowrap; min-width: 58px; }
  .sig-line  { flex: 1; border-bottom: 1px solid #333; min-height: 16px; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <img class="seal" src="${window.location.origin}/image.png" alt="PCG Medical Logo" onerror="this.style.display='none'">
  <div class="header-center">
    <div class="republic">Philippine Coast Guard</div>
    <div class="org-name">Coast Guard District – Eastern Visayas</div>
    <div class="org-english">Coast Guard Medical Station – Eastern Visayas</div>
    <div class="dept-name">Brgy 99 Diit, Tacloban City, Leyte | Tel: 09934532670 | cgmedclev@gmail.com</div>
  </div>
  <img class="seal" src="${window.location.origin}/logo.png" alt="PCG Medical Logo" onerror="this.style.display='none'">
</div>
<div class="divider-thick"></div>
<div class="divider-thin"></div>
<div class="patient-section">
  <div class="pfield"><span class="lbl">Name:</span><span class="val">${personnelName}</span></div>
  <div class="pfield"><span class="lbl">Address:</span><span class="val">${personnel?.unit || ''}</span></div>
  <div class="prow">
    <div class="pfield"><span class="lbl">Age:</span><span class="val">${age !== null ? age + ' y/o' : ''}</span></div>
    <div class="pfield"><span class="lbl">Sex:</span><span class="val">${record.gender || ''}</span></div>
    <div class="pfield"><span class="lbl">Date:</span><span class="val">${fmtDate(record.date)}</span></div>
  </div>
</div>
<div class="rx-section">
  <div class="rx-sym">&#8478;</div>
  <div class="rx-body">
    ${rxContent
      ? `<div class="rx-text">${rxContent.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`
      : ['', '', '', '', '', ''].map(() => `<div class="rx-blank-line"></div>`).join('\n')
    }
  </div>
</div>
<div class="sig-block">
  <div class="sig-name">${record.physician ? record.physician + ', M.D.' : '________________________________'}</div>
  <div class="sig-title">Physician / Signature over Printed Name</div>
  <div class="sig-row"><span class="sig-lbl">Lic No:</span><span class="sig-line"></span></div>
  <div class="sig-row"><span class="sig-lbl">PTR No:</span><span class="sig-line"></span></div>
  <div class="sig-row"><span class="sig-lbl">S2 No:</span><span class="sig-line"></span></div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=700,height=950');
  if (win) { win.document.write(html); win.document.close(); }
};

export const ClinicalRecordsModal: React.FC<ClinicalRecordsModalProps> = ({
  personnelId, personnelName, personnel, onClose
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClinicalRecord | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateClinicalRecordDTO>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canWrite = user?.permissions.includes('medical.update') || false;
  const canDelete = user?.permissions.includes('personnel.delete') || false;
  const isViewer = user?.role === 'viewer';

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/personnel/${personnelId}/clinical`) as ClinicalRecord[];
      setRecords(data);
    } catch { toast.error('Failed to load clinical records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [personnelId]);

  const openAdd = () => {
    setEditingRecord(null);
    setForm({ ...EMPTY_FORM, assessmentDateTime: new Date().toISOString().slice(0, 16) });
    setShowForm(true);
  };

  const handleScan = async (file: File) => {
    setScanning(true);
    setScanError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const result = await api.post('/scan/clinical-record', fd, { timeout: 60000, headers: { 'Content-Type': undefined } }) as Record<string, unknown>;
      setForm(prev => ({
        ...prev,
        ...(result.date ? { date: String(result.date) } : {}),
        ...(result.assessmentDateTime ? { assessmentDateTime: String(result.assessmentDateTime) } : {}),
        ...(result.illnessOnsetDateTime ? { illnessOnsetDateTime: String(result.illnessOnsetDateTime) } : {}),
        ...(result.gender ? { gender: String(result.gender) } : {}),
        ...(result.complaint ? { complaint: String(result.complaint) } : {}),
        ...(result.diagnosis ? { diagnosis: String(result.diagnosis) } : {}),
        ...(result.treatment ? { treatment: String(result.treatment) } : {}),
        ...(result.physician ? { physician: String(result.physician) } : {}),
        ...(result.physicalExam ? { physicalExam: String(result.physicalExam) } : {}),
        ...(result.pmhx ? { pmhx: String(result.pmhx) } : {}),
        ...(result.psHx ? { psHx: String(result.psHx) } : {}),
        ...(result.fhx ? { fhx: String(result.fhx) } : {}),
        ...(result.shx ? { shx: String(result.shx) } : {}),
        ...(result.allergies ? { allergies: String(result.allergies) } : {}),
        ...(result.medications ? { medications: String(result.medications) } : {}),
        ...(result.covidVaccinated !== undefined ? { covidVaccinated: Boolean(result.covidVaccinated) } : {}),
        ...(result.covidVaccineDetails ? { covidVaccineDetails: String(result.covidVaccineDetails) } : {}),
        ...(result.notes ? { notes: String(result.notes) } : {}),
        vitalSigns: { ...prev.vitalSigns, ...((result.vitalSigns as Record<string, string>) ?? {}) },
      }));
      setScanOpen(false);
      if (!showForm) { setEditingRecord(null); setShowForm(true); }
      toast.success('Clinical record extracted — please review and save.');
    } catch (err: unknown) {
      setScanError((err as Error)?.message || 'Scan failed. Try a clearer image.');
    } finally {
      setScanning(false);
    }
  };

  const openEdit = (record: ClinicalRecord) => {
    setEditingRecord(record);
    setForm({
      date: typeof record.date === 'string' ? record.date.split('T')[0] : new Date(record.date).toISOString().split('T')[0],
      assessmentDateTime: record.assessmentDateTime || '',
      illnessOnsetDateTime: record.illnessOnsetDateTime || '',
      gender: record.gender || '',
      complaint: record.complaint,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      physician: record.physician,
      vitalSigns: record.vitalSigns || { bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', spO2: '', weight: '', height: '' },
      physicalExam: record.physicalExam || '',
      pmhx: record.pmhx || '',
      psHx: record.psHx || '',
      fhx: record.fhx || '',
      shx: record.shx || '',
      allergies: record.allergies || '',
      medications: record.medications || '',
      covidVaccinated: record.covidVaccinated,
      covidVaccineDetails: record.covidVaccineDetails || '',
      notes: record.notes || ''
    });
    setShowForm(true);
  };

  const setVital = (key: keyof VitalSigns, value: string) => {
    setForm(f => ({ ...f, vitalSigns: { ...f.vitalSigns, [key]: value } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/personnel/${personnelId}/clinical/${editingRecord.id}`, form);
        toast.success('Clinical record updated');
      } else {
        await api.post(`/personnel/${personnelId}/clinical`, form);
        toast.success('Clinical record added');
      }
      setShowForm(false); setEditingRecord(null); await fetchRecords();
    } catch { toast.error('Failed to save clinical record'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await api.delete(`/personnel/${personnelId}/clinical/${recordId}`);
      toast.success('Clinical record deleted');
      setDeletingId(null); await fetchRecords();
    } catch { toast.error('Failed to delete clinical record'); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth='lg' fullWidth PaperProps={{ sx: { maxHeight: '95vh', display: 'flex', flexDirection: 'column' } }}>
      <DialogTitle sx={{ bgcolor: 'teal', color: 'white', py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>🏥 Clinical Records</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>{personnelName}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {canWrite && !showForm && (
            <Box display="flex" gap={0.75}>
              {/* Scan button hidden until API subscription is active */}
              {false && <Button variant="contained" size="small" startIcon={<DocumentScannerIcon fontSize="small" />}
                onClick={() => { setScanOpen(true); setScanError(''); }}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                Scan
              </Button>}
<Button variant="contained" size="small" onClick={openAdd}
                sx={{ bgcolor: 'white', color: 'teal', '&:hover': { bgcolor: '#f0fdfa' } }}>+ New Assessment</Button>
            </Box>
          )}
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {showForm && (
          <Box component="form" onSubmit={handleSave} mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {editingRecord ? 'Edit Clinical Assessment' : 'New Clinical Assessment'}
              </Typography>
              <Button size='small' onClick={() => { setShowForm(false); setEditingRecord(null); }}>✕ Cancel</Button>
            </Box>

            <Section title="📅 Assessment Timing" defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}><Field label="Date of Visit *">
                  <TextField type="date" required size="small" fullWidth value={form.date as string}
                    onChange={e => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Field></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Field label="Date & Time of Assessment">
                  <TextField type='datetime-local' size='small' fullWidth value={form.assessmentDateTime || ''}
                    onChange={e => setForm({ ...form, assessmentDateTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Field></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Field label="Date & Time Illness Started">
                  <TextField type='datetime-local' size='small' fullWidth value={form.illnessOnsetDateTime || ''}
                    onChange={e => setForm({ ...form, illnessOnsetDateTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Field></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Field label="Gender">
                  <TextField select size='small' fullWidth value={form.gender || ''}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                    <option value=''>Select</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                  </TextField>
                </Field></Grid>
              </Grid>
            </Section>

            <Section title="❤️ Vital Signs" defaultOpen={true}>
              <Grid container spacing={2}>
                {([['bloodPressure','Blood Pressure (mmHg)','120/80'], ['heartRate','Heart Rate (bpm)','72'],
                   ['respiratoryRate','Resp. Rate (/min)','16'], ['temperature','Temperature (°C)','36.5'],
                   ['spO2','SpO₂ (%)','98'], ['weight','Weight (kg)','70'], ['height','Height (cm)','170']
                ] as [keyof VitalSigns, string, string][]).map(([key, label, placeholder]) => (
                  <Grid size={{ xs: 6, md: 3 }} key={key}><Field label={label}>
                    <TextField type='text' size='small' fullWidth placeholder={placeholder}
                      value={form.vitalSigns?.[key] || ''} onChange={e => setVital(key, e.target.value)} />
                  </Field></Grid>
                ))}
              </Grid>
              {(() => {
                const bmi = calcBMI(form.vitalSigns?.weight, form.vitalSigns?.height);
                if (!bmi) return null;
                const cat = bmiCategory(bmi);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Computed BMI:</Typography>
                    <Chip size="small" color={cat.chipColor} label={`${bmi.toFixed(1)} — ${cat.label}`} />
                    <Typography variant="caption" color="text.secondary">
                      (Normal: 18.5–24.9 | Overweight: 25–29.9 | Obese: ≥30)
                    </Typography>
                  </Box>
                );
              })()}
            </Section>

            <Section title="🩺 Chief Complaint & Management" defaultOpen={true}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><Field label="Attending Physician *">
                  <TextField required size='small' fullWidth placeholder='Dr. Juan Dela Cruz'
                    value={form.physician} onChange={e => setForm({ ...form, physician: e.target.value })} />
                </Field></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Field label="Chief Complaint *">
                  <TextField required size='small' fullWidth placeholder='Fever, headache'
                    value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} />
                </Field></Grid>
                <Grid size={12}><Field label="Diagnosis *">
                  <TextField required multiline rows={2} size='small' fullWidth placeholder='e.g. Acute URTI'
                    value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
                </Field></Grid>
                <Grid size={12}><Field label="Treatment / Management *">
                  <TextField required multiline rows={2} size='small' fullWidth placeholder='e.g. Paracetamol 500mg TID'
                    value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} />
                </Field></Grid>
              </Grid>
            </Section>

            <Section title="🔬 Physical Examination">
              <Field label="Findings (General, HEENT, Chest, Abdomen, Extremities, etc.)">
                <TextField multiline rows={4} size='small' fullWidth
                  placeholder='General: Conscious, coherent...'
                  value={form.physicalExam || ''} onChange={e => setForm({ ...form, physicalExam: e.target.value })} />
              </Field>
            </Section>

            <Section title="💉 COVID-19 Vaccination">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" display="block" mb={0.5}>Vaccinated?</Typography>
                <RadioGroup row value={form.covidVaccinated === undefined ? 'unknown' : String(form.covidVaccinated)}
                  onChange={(e) => setForm({ ...form, covidVaccinated:
                    e.target.value === 'unknown' ? undefined : e.target.value === 'true' })}>
                  <FormControlLabel value='true' control={<Radio size='small' />} label='Yes' />
                  <FormControlLabel value='false' control={<Radio size='small' />} label='No' />
                  <FormControlLabel value='unknown' control={<Radio size='small' />} label='Unknown' />
                </RadioGroup>
                {form.covidVaccinated && (
                  <Box mt={1}><Field label="Vaccine Name & Number of Doses">
                    <TextField size='small' fullWidth placeholder='e.g. Pfizer — 3 doses'
                      value={form.covidVaccineDetails || ''} onChange={e => setForm({ ...form, covidVaccineDetails: e.target.value })} />
                  </Field></Box>
                )}
              </Box>
            </Section>

            <Section title="📋 Comprehensive History" defaultOpen={true}>
              <Grid container spacing={2}>
                {([['pmhx','PMHx — Past Medical History','e.g. Hypertension (2018–present)'],
                   ['psHx','PSHx — Past Surgical History','e.g. Appendectomy (2018)'],
                   ['fhx','FHx — Family History','e.g. Father: CAD / MI at 55'],
                   ['shx','SHx — Social History','e.g. Smoker: 10 pack-years'],
                   ['allergies','All — Allergies (include reaction)','e.g. Penicillin (Hives); NKDA'],
                   ['medications','Meds — Current Medications','e.g. Losartan 50mg PO Daily']
                ] as [keyof CreateClinicalRecordDTO, string, string][]).map(([key, label, ph]) => (
                  <Grid size={12} key={key}><Field label={label}>
                    <TextField multiline rows={2} size='small' fullWidth placeholder={ph}
                      value={(form[key] as string) || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  </Field></Grid>
                ))}
              </Grid>
            </Section>

            <Section title="📝 Additional Notes">
              <Field label="Remarks / Follow-up instructions">
                <TextField multiline rows={2} size='small' fullWidth placeholder='e.g. For follow-up in 3 days'
                  value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </Section>

            <Box display="flex" justifyContent="flex-end" gap={1} mt={2} pt={2} sx={{ borderTop: 1, borderColor: 'divider' }}>
              <Button variant='outlined' onClick={() => { setShowForm(false); setEditingRecord(null); }}>Cancel</Button>
              <Button variant='contained' type='submit' disabled={saving}>
                {saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Assessment'}
              </Button>
            </Box>
          </Box>
        )}

        {loading ? (
          <Box display='flex' justifyContent='center' py={6}><CircularProgress /></Box>
        ) : records.length === 0 && !showForm ? (
          <Box textAlign='center' py={6} color='text.secondary'>
            <Typography fontSize={48} mb={1}>🏥</Typography>
            <Typography fontWeight={600}>No clinical records yet</Typography>
            {canWrite && <Typography variant='caption'>Click '+ New Assessment' to create the first entry.</Typography>}
          </Box>
        ) : !showForm && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {records.map((record) => (
              <Box key={record.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                {deletingId === record.id ? (
                  <Box sx={{ bgcolor: '#fef2f2', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='error.main' fontWeight={600}>Delete this assessment?</Typography>
                    <Box display="flex" gap={1}>
                      <Button size='small' variant='outlined' onClick={() => setDeletingId(null)}>Cancel</Button>
                      <Button size='small' variant='contained' color='error' onClick={() => handleDelete(record.id)}>Yes, Delete</Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ bgcolor: '#f0fdfa', px: 2, py: 1.5, borderBottom: 1, borderColor: '#99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>📅 {fmtDate(record.date)} — {record.diagnosis}</Typography>
                        <Typography variant="caption" color="text.secondary">👨‍⚕️ {record.physician}</Typography>
                      </Box>
                      <Box display="flex" gap={0.5} flexShrink={0}>
                        {!isViewer && <Button size='small' variant='outlined' onClick={() => printPrescription(record, personnelName, personnel)}>📄 Rx</Button>}
                        {!isViewer && <Button size='small' variant='outlined' onClick={() => printClinicalRecord(record, personnelName)}>🖨️ Print</Button>}
                        {canWrite && <Button size='small' variant='outlined' onClick={() => openEdit(record)}>✏️ Edit</Button>}
                        {canDelete && <Button size='small' variant='outlined' color='error' onClick={() => setDeletingId(record.id)}>🗑️ Delete</Button>}
                      </Box>
                    </Box>
                    <Box p={2} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {record.illnessOnsetDateTime && (
                        <Typography variant="caption" color="text.secondary">🤒 Illness started: {fmtDateTime(record.illnessOnsetDateTime)}</Typography>
                      )}
                      {record.vitalSigns && Object.values(record.vitalSigns).some(v => v) && (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={1}>❤️ Vital Signs</Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.75}>
                            {record.vitalSigns.bloodPressure && <Chip label={`BP: ${record.vitalSigns.bloodPressure} mmHg`} size='small' sx={{ bgcolor: '#fef2f2', color: '#b91c1c' }} />}
                            {record.vitalSigns.heartRate && <Chip label={`HR: ${record.vitalSigns.heartRate} bpm`} size='small' sx={{ bgcolor: '#fef2f2', color: '#b91c1c' }} />}
                            {record.vitalSigns.respiratoryRate && <Chip label={`RR: ${record.vitalSigns.respiratoryRate}/min`} size='small' sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }} />}
                            {record.vitalSigns.temperature && <Chip label={`Temp: ${record.vitalSigns.temperature}°C`} size='small' sx={{ bgcolor: '#fff7ed', color: '#c2410c' }} />}
                            {record.vitalSigns.spO2 && <Chip label={`SpO₂: ${record.vitalSigns.spO2}%`} size='small' sx={{ bgcolor: '#faf5ff', color: '#7e22ce' }} />}
                            {record.vitalSigns.weight && <Chip label={`Wt: ${record.vitalSigns.weight} kg`} size='small' sx={{ bgcolor: '#f9fafb', color: '#374151' }} />}
                            {record.vitalSigns.height && <Chip label={`Ht: ${record.vitalSigns.height} cm`} size='small' sx={{ bgcolor: '#f9fafb', color: '#374151' }} />}
                            {(() => {
                              const bmi = calcBMI(record.vitalSigns.weight, record.vitalSigns.height);
                              if (!bmi) return null;
                              const cat = bmiCategory(bmi);
                              return <Chip size="small" color={cat.chipColor} label={`BMI ${bmi.toFixed(1)} · ${cat.label}`} />;
                            })()}
                          </Box>
                        </Box>
                      )}
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">Chief Complaint</Typography>
                          <Typography variant="body2">{record.complaint}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">Diagnosis</Typography>
                          <Typography variant="body2">{record.diagnosis}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">Treatment</Typography>
                          <Typography variant="body2">{record.treatment}</Typography>
                        </Grid>
                      </Grid>
                      {record.covidVaccinated !== undefined && (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">💉 COVID Vaccination</Typography>
                          {record.covidVaccinated
                            ? <Typography variant='body2' color='success.main' fontWeight={600}>✅ Vaccinated{record.covidVaccineDetails ? ` — ${record.covidVaccineDetails}` : ''}</Typography>
                            : <Typography variant='body2' color='error.main' fontWeight={600}>❌ Not vaccinated</Typography>}
                        </Box>
                      )}
                      {record.physicalExam && (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">🔬 Physical Examination</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{record.physicalExam}</Typography>
                        </Box>
                      )}
                      {(record.pmhx || record.psHx || record.fhx || record.shx || record.allergies || record.medications) && (
                        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={1}>📋 Comprehensive History</Typography>
                          <Grid container spacing={1.5}>
                            {record.pmhx && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='text.secondary' display='block'>PMHx</Typography><Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>{record.pmhx}</Typography></Grid>}
                            {record.psHx && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='text.secondary' display='block'>PSHx</Typography><Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>{record.psHx}</Typography></Grid>}
                            {record.fhx && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='text.secondary' display='block'>FHx</Typography><Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>{record.fhx}</Typography></Grid>}
                            {record.shx && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='text.secondary' display='block'>SHx</Typography><Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>{record.shx}</Typography></Grid>}
                            {record.allergies && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='error.main' display='block'>⚠️ Allergies</Typography><Typography variant='body2'>{record.allergies}</Typography></Grid>}
                            {record.medications && <Grid size={{ xs: 12, md: 6 }}><Typography variant='caption' fontWeight={700} color='text.secondary' display='block'>Meds</Typography><Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>{record.medications}</Typography></Grid>}
                          </Grid>
                        </Box>
                      )}
                      {record.notes && (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block">📝 Notes</Typography>
                          <Typography variant="body2" fontStyle="italic" color="text.secondary">{record.notes}</Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50', justifyContent: 'space-between' }}>
        <Typography variant='caption' color='text.secondary'>{records.length} assessment{records.length !== 1 ? 's' : ''}</Typography>
        <Button variant='outlined' onClick={onClose}>Close</Button>
      </DialogActions>

      {/* ── Scan Document Dialog ─────────────────────────────────── */}
      <Dialog open={scanOpen} onClose={() => !scanning && setScanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DocumentScannerIcon color="primary" />
          <Box>
            <Typography fontWeight={700}>Scan Clinical Document</Typography>
            <Typography variant="caption" color="text.secondary">Upload a photo of a handwritten or printed clinical record</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {scanError && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1 }}>
              <Typography variant="body2" color="error">{scanError}</Typography>
            </Box>
          )}
          <Box
            sx={{ border: '2px dashed', borderColor: scanning ? 'primary.main' : 'grey.300', borderRadius: 2, p: 4,
              textAlign: 'center', cursor: scanning ? 'not-allowed' : 'pointer', bgcolor: 'grey.50',
              '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f9ff' }, transition: 'all 0.2s' }}
            onClick={() => { if (!scanning) document.getElementById('scan-upload-input')?.click(); }}
          >
            <input id="scan-upload-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleScan(f); e.target.value = ''; }} />
            {scanning ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 1 }} />
                <Typography variant="body2" color="primary" fontWeight={600}>Reading document with AI…</Typography>
                <Typography variant="caption" color="text.secondary">This may take a few seconds</Typography>
              </Box>
            ) : (
              <Box>
                <DocumentScannerIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="body2" fontWeight={600}>Click to upload image</Typography>
                <Typography variant="caption" color="text.secondary">JPG, PNG, WEBP up to 10 MB</Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
            ✨ AI will extract fields and pre-fill the form. Review before saving.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanOpen(false)} disabled={scanning}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};