import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { isOfficer } from '@shared/constants/ranks';
import type { PersonnelRequest, PersonnelRequestData } from '@shared/types/personnelRequest.types';
import type { MedicalResultFile } from '@shared/types/personnel.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import WorkIcon from '@mui/icons-material/Work';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BiotechIcon from '@mui/icons-material/Biotech';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import GppGoodIcon from '@mui/icons-material/GppGood';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { MEDICAL_STEPS } from '@shared/constants/medicalSteps';
import type { MedicalStatus } from '@shared/types/personnel.types';

const PROCESS_TYPES_RECRUITMENT = ['Commissionship', 'Enlistment', 'Lateral-Entry', 'Re-Entry', 'Applicant'];
const PROCESS_TYPES_MEDICAL = ['CAD', 'Promotion', 'Foreign Schooling', 'Local Schooling', 'Re-Enlistment'];

const EMPTY: PersonnelRequestData = {
  serialNumber: '', firstName: '', middleName: '', lastName: '',
  birthdate: '', rank: '', unit: '', dateJoined: '',
  gender: '', bloodType: '', contactNumber: '', email: '',
  permanentAddress: '', designation: '', ete: '',
  reEnlistmentStatus: '', cadProgram: '', processType: '',
};

const FieldRow = ({ label, value }: { label: string; value?: string | null }) => (
  <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', py: 1, px: 2, gap: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.62rem', width: 100, flexShrink: 0, mt: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
      {value || <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
    </Typography>
  </Box>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mb: 1.5, fontSize: '0.72rem' }}>
      {title}
    </Typography>
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
      {children}
    </Paper>
  </Box>
);

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <Box sx={{ display: 'flex', py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 }, gap: 2 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.62rem', width: 160, flexShrink: 0, mt: 0.2 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value || <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
    </Typography>
  </Box>
);

const getDynamicRequirements = (
  stepNum: number,
  baseReqs: string[],
  age: number | null,
  gender?: string,
): string[] => {
  if (stepNum === 2) {
    const base = age !== null && age < 30
      ? ['Urinalysis', 'Hematology', 'Serology', 'ECG', 'Radiology (Chest X-Ray)', 'Neurological Assessment']
      : ['Urinalysis', 'Hematology', 'Blood Chemistry', 'Serology', 'ECG', 'Radiology (Chest X-Ray)', 'Neurological Assessment'];
    if (gender === 'Female') return [...base, 'Pregnancy Test', 'OB Clearance'];
    return base;
  }
  if (stepNum === 3) {
    const base = age !== null && age < 30
      ? ['1st page routing slip to Last Page', 'Medical Certificate', 'Drug Test Results', 'Urinalysis', 'Hematology', 'Serology', 'ECG', 'Radiology', 'Neurological Report']
      : ['1st page routing slip to Last Page', 'Medical Certificate', 'Drug Test Results', 'Urinalysis', 'Hematology', 'Blood Chemistry', 'Serology', 'ECG', 'Radiology', 'Neurological Report'];
    if (gender === 'Female') return [...base, 'Pregnancy Test Result', 'OB Clearance Document'];
    return base;
  }
  return baseReqs;
};

const ApprovedProfile = ({ request, medicalStatus, livePersonnel, onRefreshMedical }: {
  request: PersonnelRequest;
  medicalStatus: MedicalStatus | null;
  livePersonnel: any;
  onRefreshMedical: () => Promise<void>;
}) => {
  const { user, refreshUser } = useAuth();
  const d = request.data;
  const [tab, setTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);
  const [previewFile, setPreviewFile] = useState<MedicalResultFile | null>(null);
  const [reEnlistRecord, setReEnlistRecord] = useState<any>(null);
  const [startingReenlist, setStartingReenlist] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Merge live personnel data (from admin edits) over the original request.data
  const ld = {
    serialNumber:     livePersonnel?.serialNumber     || d.serialNumber,
    firstName:        livePersonnel?.firstName        || d.firstName,
    middleName:       livePersonnel?.middleName       || d.middleName,
    lastName:         livePersonnel?.lastName         || d.lastName,
    email:            livePersonnel?.email            || d.email,
    contactNumber:    livePersonnel?.contactNumber    || d.contactNumber,
    birthdate:        livePersonnel?.birthdate        || d.birthdate,
    gender:           livePersonnel?.gender           || d.gender,
    bloodType:        livePersonnel?.bloodType        || d.bloodType,
    permanentAddress: livePersonnel?.permanentAddress || d.permanentAddress,
    rank:             livePersonnel?.rank             || d.rank,
    unit:             livePersonnel?.unit             || d.unit,
    designation:      livePersonnel?.designation      || d.designation,
    dateJoined:       livePersonnel?.dateJoined       || d.dateJoined,
    processType:      livePersonnel?.processType      || d.processType,
    cadProgram:       livePersonnel?.cadProgram       || d.cadProgram,
    ete:              livePersonnel?.ete              || d.ete,
    reEnlistmentStatus: livePersonnel?.reEnlistmentStatus || d.reEnlistmentStatus,
  };
  const liveEte = ld.ete;
  const liveReEnlistStatus = ld.reEnlistmentStatus;
  const daysToETE = liveEte ? Math.floor((new Date(liveEte).getTime() - Date.now()) / 86400000) : null;

  useEffect(() => {
    api.get('/re-enlistment/mine').then((r: any) => setReEnlistRecord(r)).catch(() => {});
  }, []);

  const handleStartReEnlistment = async () => {
    setStartingReenlist(true);
    try {
      const record = await api.post('/re-enlistment', {
        personnelId: livePersonnel?.id || '',
        eteDate: ld.ete,
      }) as any;
      setReEnlistRecord(record);
      toast.success('Re-Enlistment process started!');
      setTab(2);
    } catch {
      toast.error('Failed to start re-enlistment process.');
    } finally {
      setStartingReenlist(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/auth/profile-photo', fd, { headers: { 'Content-Type': undefined } } as any) as any;
      setPhotoURL(res.photoURL);
      await refreshUser();
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Poll every 15s while medical tab is active
  useEffect(() => {
    if (tab !== 3) return;
    const id = setInterval(() => { onRefreshMedical(); }, 15000);
    return () => clearInterval(id);
  }, [tab, onRefreshMedical]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshMedical();
    setRefreshing(false);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      await api.post('/personnel-requests/mine/upload/step3', fd, {
        headers: { 'Content-Type': undefined },
        timeout: 60000,
      } as any);
      toast.success(`${files.length} file(s) uploaded successfully`);
      await onRefreshMedical();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      await api.delete(`/personnel-requests/mine/upload/step3/${encodeURIComponent(fileName)}`);
      toast.success('File deleted');
      await onRefreshMedical();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const age = ld.birthdate
    ? Math.floor((Date.now() - new Date(ld.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined;
  const fmtShort = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-PH') : undefined;

  return (
    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>

      {/* ── LEFT PANEL ── */}
      <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Photo area */}
          <Box sx={{ bgcolor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3, pb: 2, px: 2, gap: 1.5 }}>
            <Tooltip title="Change profile photo">
              <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => photoInputRef.current?.click()}>
                <Avatar
                  src={photoURL || undefined}
                  sx={{ width: 100, height: 100, bgcolor: '#e2e8f0', border: '3px solid #cbd5e1' }}
                >
                  {!photoURL && <AccountCircleIcon sx={{ fontSize: 68, color: '#94a3b8' }} />}
                </Avatar>
                <Box sx={{
                  position: 'absolute', bottom: 2, right: 2,
                  bgcolor: 'primary.main', borderRadius: '50%',
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white', boxShadow: 1,
                }}>
                  {uploadingPhoto
                    ? <CircularProgress size={12} sx={{ color: 'white' }} />
                    : <CameraAltIcon sx={{ fontSize: 14, color: 'white' }} />}
                </Box>
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Box>
            </Tooltip>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2}>
                {[ld.firstName, ld.lastName].filter(Boolean).join(' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {ld.rank} · {ld.unit}
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
              label="APPROVED"
              size="small"
              sx={{ bgcolor: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 22 }}
            />
          </Box>

          {/* Field rows — hidden on mobile (shown in Personnel tab instead) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <FieldRow label="Serial No." value={ld.serialNumber} />
            <FieldRow label="First Name" value={ld.firstName} />
            <FieldRow label="Middle Name" value={ld.middleName} />
            <FieldRow label="Last Name" value={ld.lastName} />
            <FieldRow label="Email" value={ld.email} />
            <FieldRow label="Mobile No." value={ld.contactNumber} />
            <FieldRow label="Birth Date" value={fmtShort(ld.birthdate)} />
            <FieldRow label="Age" value={age !== null ? `${age}` : undefined} />
            <FieldRow label="Gender" value={ld.gender} />
            <FieldRow label="Blood Type" value={ld.bloodType} />
            <FieldRow label="Address" value={ld.permanentAddress} />
          </Box>
        </Paper>
      </Box>

      {/* ── RIGHT PANEL ── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

        {/* ETE Warning Banner */}
        {daysToETE !== null && daysToETE >= 0 && daysToETE <= 365 && (
          <Alert
            severity={daysToETE <= 30 ? 'error' : daysToETE <= 180 ? 'warning' : 'info'}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>
              {daysToETE <= 30 ? 'CRITICAL: ETE Expiring Soon' : daysToETE <= 180 ? 'URGENT: ETE Within 6 Months' : 'Re-Enlistment Notice'}
            </AlertTitle>
            <Typography variant="body2">
              {daysToETE <= 30
                ? `Your ETE expires in ${daysToETE} day${daysToETE !== 1 ? 's' : ''}! Immediate action required.`
                : daysToETE <= 180
                ? `Your ETE is within 6 months (${new Date(liveEte).toLocaleDateString('en-PH')}). Medical processing must be underway immediately.`
                : `You are now eligible for re-enlistment. ETE: ${new Date(liveEte).toLocaleDateString('en-PH')}.`
              }
            </Typography>
            {!reEnlistRecord && (
              <Button
                size="small"
                variant="outlined"
                color={daysToETE <= 30 ? 'error' : daysToETE <= 180 ? 'warning' : 'info'}
                sx={{ mt: 1, fontWeight: 700 }}
                onClick={handleStartReEnlistment}
                disabled={startingReenlist}
              >
                {startingReenlist ? 'Starting…' : 'Start Re-Enlistment Process'}
              </Button>
            )}
            {reEnlistRecord && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.75, fontWeight: 600 }}>
                Re-Enlistment process is in progress. Status: {reEnlistRecord.status}
              </Typography>
            )}
          </Alert>
        )}

        {/* Icon tab bar */}
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48,
              '& .MuiTab-root': { minHeight: 48, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 } }}>
            <Tab icon={<MilitaryTechIcon fontSize="small" />} iconPosition="start" label="Personnel" sx={{ '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } } }} />
            <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Service" sx={{ '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } } }} />
            <Tab icon={<LocalHospitalIcon fontSize="small" />} iconPosition="start" label="Medical" sx={{ '& .MuiTab-iconWrapper': { mr: { xs: 0, sm: 1 } } }} />
          </Tabs>

          <Box sx={{ p: 2.5 }}>
            {/* Tab 0: Personnel Profile */}
            {tab === 0 && (
              <Box>
                {/* Personal info — only shown on mobile (desktop sees it in the left panel) */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <SectionBlock title="Personal Information">
                    <InfoRow label="Serial No." value={ld.serialNumber} />
                    <InfoRow label="First Name" value={ld.firstName} />
                    <InfoRow label="Middle Name" value={ld.middleName} />
                    <InfoRow label="Last Name" value={ld.lastName} />
                    <InfoRow label="Email" value={ld.email} />
                    <InfoRow label="Mobile No." value={ld.contactNumber} />
                    <InfoRow label="Birth Date" value={fmtShort(ld.birthdate)} />
                    <InfoRow label="Age" value={age !== null ? `${age}` : undefined} />
                    <InfoRow label="Gender" value={ld.gender} />
                    <InfoRow label="Blood Type" value={ld.bloodType} />
                    <InfoRow label="Address" value={ld.permanentAddress} />
                  </SectionBlock>
                </Box>
                <SectionBlock title="Personnel Profile">
                  <InfoRow label="Rank" value={ld.rank} />
                  <InfoRow label="Unit" value={ld.unit} />
                  <InfoRow label="Designation" value={ld.designation} />
                  <InfoRow label="Date Joined" value={fmt(ld.dateJoined)} />
                  <InfoRow label="Process Type" value={ld.processType} />
                </SectionBlock>
              </Box>
            )}

            {/* Tab 1: Service Details */}
            {tab === 1 && (
              <Box>
                <SectionBlock title="Service Details">
                  <InfoRow label="ETE" value={fmt(liveEte)} />
                  <InfoRow label="Re-enlistment Status" value={liveReEnlistStatus} />
                  <InfoRow label="CAD Program" value={ld.cadProgram} />
                </SectionBlock>
              </Box>
            )}

            {/* Tab 2: Medical Status */}
            {tab === 2 && (() => {
              const stepKeys = ['step1','step2','step3','step4','step5','step6','step7','step8'] as const;
              const completedCount = medicalStatus
                ? stepKeys.filter(k => medicalStatus[k]?.completed).length : 0;
              const activeIdx = medicalStatus
                ? stepKeys.findIndex(k => !medicalStatus[k]?.completed) : 0;
              const icons = [
                <AssignmentIcon />, <BiotechIcon />, <UploadFileIcon />,
                <MedicalServicesIcon />, <MedicalServicesIcon />, <FolderCopyIcon />,
                <GppGoodIcon />, <TaskAltIcon />,
              ];
              const step3Files: MedicalResultFile[] = medicalStatus?.step3?.files ?? [];
              return (
                <Box>
                  {/* Progress header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontSize: '0.72rem' }}>
                      Medical Processing Steps
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={completedCount === 8 ? 'CLEARED' : `${completedCount}/8 Done`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem',
                          bgcolor: completedCount === 8 ? '#16a34a' : completedCount > 0 ? 'primary.main' : 'grey.300',
                          color: completedCount > 0 ? '#fff' : 'text.secondary' }}
                      />
                      <Button size="small" variant="outlined" onClick={handleRefresh} disabled={refreshing}
                        startIcon={<RefreshIcon sx={{ fontSize: '14px !important',
                          animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                          '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                        }} />}
                        sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.65rem', height: 24, borderRadius: 1 }}>
                        {refreshing ? 'Updating...' : 'Refresh'}
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'relative' }}>
                    {/* Vertical connector line */}
                    <Box sx={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, bgcolor: 'divider', zIndex: 0 }} />

                    {MEDICAL_STEPS.map((step, idx) => {
                      const key = stepKeys[idx];
                      const isDone       = medicalStatus ? (medicalStatus[key]?.completed ?? false) : false;
                      // Step 3 gets a special "evaluating" state when files exist but step not yet marked done
                      const isEvaluating = idx === 2 && !isDone && step3Files.length > 0;
                      const isActive     = !isDone && !isEvaluating && idx === activeIdx;
                      const isLast       = step.step === 8;

                      return (
                        <Box key={step.step} sx={{
                          display: 'flex', gap: 2, mb: isLast ? 0 : 2, position: 'relative', zIndex: 1,
                          opacity: 0, animation: 'fadeSlideIn 0.4s ease forwards',
                          animationDelay: `${idx * 70}ms`,
                          '@keyframes fadeSlideIn': {
                            from: { opacity: 0, transform: 'translateY(10px)' },
                            to:   { opacity: 1, transform: 'translateY(0)' },
                          },
                        }}>
                          {/* Icon circle */}
                          <Box sx={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            '& svg': { fontSize: 18 },
                            ...(isDone ? {
                              bgcolor: '#16a34a', color: '#fff',
                              boxShadow: '0 0 0 4px rgba(22,163,74,0.12)',
                            } : isEvaluating ? {
                              bgcolor: '#d97706', color: '#fff',
                              boxShadow: '0 0 0 4px rgba(217,119,6,0.18)',
                              animation: 'pulseOrange 1.6s ease-in-out infinite',
                              '@keyframes pulseOrange': {
                                '0%,100%': { boxShadow: '0 0 0 4px rgba(217,119,6,0.18)' },
                                '50%':     { boxShadow: '0 0 0 8px rgba(217,119,6,0.32)' },
                              },
                            } : isActive ? {
                              bgcolor: 'primary.main', color: '#fff',
                              boxShadow: '0 0 0 4px rgba(29,78,216,0.18)',
                              animation: 'pulse 1.6s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%,100%': { boxShadow: '0 0 0 4px rgba(29,78,216,0.18)' },
                                '50%':     { boxShadow: '0 0 0 8px rgba(29,78,216,0.32)' },
                              },
                            } : {
                              bgcolor: '#e2e8f0', color: '#94a3b8',
                              boxShadow: 'none',
                            }),
                          }}>
                            {isDone ? <TaskAltIcon /> : icons[idx]}
                          </Box>

                          {/* Step card */}
                          <Paper variant="outlined" sx={{
                            flex: 1, p: 1.5, borderRadius: 1.5,
                            opacity: isDone ? 0.75 : (isEvaluating || isActive) ? 1 : 0.55,
                            borderColor: isDone ? 'success.light' : isEvaluating ? '#fbbf24' : isActive ? 'primary.light' : 'divider',
                            bgcolor: isDone ? '#f0fdf4' : isEvaluating ? '#fffbeb' : isActive ? '#eff6ff' : 'background.paper',
                            transition: 'all 0.3s',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="caption" sx={{
                                fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5,
                                color: isDone ? 'success.dark' : isEvaluating ? '#b45309' : isActive ? 'primary.main' : 'text.disabled',
                              }}>
                                Step {step.step}
                              </Typography>
                              {isDone && <Chip label="Done" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#16a34a', color: '#fff', px: 0.5 }} />}
                              {isEvaluating && <Chip label="Evaluating" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#d97706', color: '#fff', px: 0.5,
                                animation: 'chipBlink 1.6s ease-in-out infinite',
                                '@keyframes chipBlink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
                              }} />}
                              {isActive && <Chip label="Active" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'primary.main', color: '#fff', px: 0.5,
                                animation: 'chipBlink 1.6s ease-in-out infinite',
                              }} />}
                              {isLast && isDone && <Chip label="Cleared" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#16a34a', color: '#fff', px: 0.5 }} />}
                            </Box>
                            <Typography variant="body2" fontWeight={isDone || isEvaluating || isActive ? 700 : 500} lineHeight={1.3} mb={0.5}
                              color={isDone ? 'text.primary' : (isEvaluating || isActive) ? 'text.primary' : 'text.disabled'}>
                              {step.title}
                            </Typography>
                            {(isDone || isEvaluating || isActive) && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.5 }}>
                                {step.description}
                              </Typography>
                            )}
                            {(isDone || isEvaluating || isActive) && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {getDynamicRequirements(step.step, step.requirements, age, ld.gender).map((req, ri) => (
                                  <Chip key={ri} label={req} size="small" variant="outlined"
                                    sx={{ height: 18, fontSize: '0.6rem',
                                      borderColor: isDone ? 'success.light' : isEvaluating ? '#fbbf24' : 'primary.light',
                                      color: isDone ? 'success.dark' : isEvaluating ? '#92400e' : 'primary.dark' }} />
                                ))}
                              </Box>
                            )}

                            {/* ── Step 3 Evaluating Note ── */}
                            {isEvaluating && (
                              <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 1, bgcolor: '#fef3c7', border: '1px solid #fbbf24', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <Typography sx={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>⏳</Typography>
                                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, lineHeight: 1.5 }}>
                                  Your medical results are being evaluated by medical personnel. Please wait for further instructions.
                                </Typography>
                              </Box>
                            )}

                            {/* ── Step 3 Upload Zone ── */}
                            {idx === 2 && (isActive || isEvaluating) && (
                              <Box sx={{ mt: 1.5 }}>
                                <Box
                                  component="label"
                                  htmlFor="step3-file-input"
                                  sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', gap: 0.5,
                                    border: '2px dashed', borderColor: uploading ? 'primary.light' : 'primary.main',
                                    borderRadius: 1.5, p: 2, cursor: uploading ? 'not-allowed' : 'pointer',
                                    bgcolor: '#f0f7ff', transition: 'all 0.2s',
                                    '&:hover': { bgcolor: uploading ? '#f0f7ff' : '#e0efff' },
                                    opacity: uploading ? 0.75 : 1,
                                  }}
                                >
                                  <input
                                    ref={fileInputRef}
                                    id="step3-file-input"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                    onChange={(e) => {
                                      if (e.target.files) handleUploadFiles(Array.from(e.target.files));
                                    }}
                                  />
                                  {uploading
                                    ? <CircularProgress size={22} />
                                    : <UploadFileIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                                  }
                                  <Typography variant="caption" fontWeight={700} color="primary.main">
                                    {uploading ? 'Uploading…' : 'Click to upload documents'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    JPEG · PNG · PDF &nbsp;·&nbsp; Max 10 MB each
                                  </Typography>
                                </Box>
                                {uploading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                              </Box>
                            )}

                            {/* ── Step 3 File List ── */}
                            {idx === 2 && (isDone || isActive || isEvaluating) && step3Files.length > 0 && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary"
                                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                                  Uploaded Documents ({step3Files.length})
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                  {step3Files.map((f, fi) => (
                                    <Box key={fi} sx={{
                                      display: 'flex', alignItems: 'center', gap: 1, p: 1,
                                      border: '1px solid',
                                      borderColor: isDone ? 'success.light' : isEvaluating ? '#fbbf24' : 'primary.light',
                                      borderRadius: 1,
                                      bgcolor: isDone ? '#f0fdf4' : isEvaluating ? '#fffbeb' : '#f8fbff',
                                    }}>
                                      <InsertDriveFileIcon sx={{
                                        fontSize: 18, flexShrink: 0,
                                        color: f.fileType === 'application/pdf' ? 'error.main' : 'primary.main',
                                      }} />
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="caption" fontWeight={600} noWrap display="block">
                                          {f.fileName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {(f.fileSize / 1024).toFixed(0)} KB &nbsp;·&nbsp; {new Date(f.uploadedAt as string).toLocaleDateString('en-PH')}
                                        </Typography>
                                      </Box>
                                      <IconButton size="small" onClick={() => setPreviewFile(f)}
                                        title="Preview file" sx={{ color: 'primary.main' }}>
                                        <VisibilityIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                      {(isActive || isEvaluating) && (
                                        <IconButton size="small" onClick={() => handleDeleteFile(f.fileName)}
                                          title="Delete file" sx={{ color: 'error.main' }}>
                                          <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}

                          </Paper>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })()}
          </Box>
        </Paper>
      </Box>

      {/* ── File Preview Dialog ── */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <InsertDriveFileIcon sx={{ flexShrink: 0, color: previewFile?.fileType === 'application/pdf' ? 'error.main' : 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={700} noWrap>{previewFile?.fileName}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
            <IconButton size="small" href={previewFile?.fileURL ?? ''} target="_blank" rel="noopener noreferrer" title="Open in new tab">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setPreviewFile(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9' }}>
          {previewFile && (
            previewFile.fileType === 'application/pdf' ? (
              <Box
                component="iframe"
                src={previewFile.fileURL}
                title={previewFile.fileName}
                sx={{ width: '100%', height: '72vh', border: 'none', display: 'block' }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: 300 }}>
                <Box
                  component="img"
                  src={previewFile.fileURL}
                  alt={previewFile.fileName}
                  sx={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 1, boxShadow: 3 }}
                />
              </Box>
            )
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export const EditProfilePage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<PersonnelRequestData>(EMPTY);
  const [existing, setExisting] = useState<PersonnelRequest | null>(null);
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatus | null>(null);
  const [livePersonnel, setLivePersonnel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof PersonnelRequestData, val: string) =>
    setForm(p => ({ ...p, [field]: val }));

  const showOfficerFields = form.rank && isOfficer(form.rank);
  const showEnlistedFields = form.rank && !isOfficer(form.rank);

  const fetchMedicalStatus = useCallback(async () => {
    try {
      const p = await api.get('/personnel-requests/mine/personnel') as any;
      if (p?.medicalStatus) setMedicalStatus(p.medicalStatus);
      if (p) setLivePersonnel(p);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    api.get('/personnel-requests/mine')
      .then((res: any) => {
        if (res && res.id) {
          setExisting(res as PersonnelRequest);
          setForm(res.data);
          if (res.status === 'approved') fetchMedicalStatus();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchMedicalStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serialNumber.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.rank || !form.unit.trim() || !form.birthdate || !form.dateJoined) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/personnel-requests', { data: form }) as PersonnelRequest;
      setExisting(res);
      toast.success('Profile submitted for admin review.');
    } catch {
      toast.error('Failed to submit profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  // Approved: show profile dashboard instead of form
  if (existing?.status === 'approved') {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <ApprovedProfile request={existing} medicalStatus={medicalStatus} livePersonnel={livePersonnel} onRefreshMedical={fetchMedicalStatus} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Header */}
      <Paper elevation={0} sx={{
        background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', color: '#fff',
        px: 3, py: 2, borderRadius: 2, mb: 2,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <AccountCircleIcon sx={{ fontSize: 40, opacity: 0.9 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>Edit My Profile</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Fill in your personnel details below. Your submission will be reviewed by an administrator.
          </Typography>
        </Box>
      </Paper>

      {/* Status banner */}
      {existing?.status === 'pending' && (
        <Alert severity="info" icon={<HourglassTopIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>Your profile is pending admin review.</Typography>
          <Typography variant="caption">Submitted on {new Date(existing.submittedAt).toLocaleString('en-PH')}. You can update and re-submit while it is pending.</Typography>
        </Alert>
      )}
      {existing?.status === 'rejected' && (
        <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>Your profile submission was rejected.</Typography>
          {existing.rejectionReason && <Typography variant="caption">Reason: {existing.rejectionReason}</Typography>}
          <Typography variant="caption" display="block" mt={0.5}>Please update your information below and re-submit.</Typography>
        </Alert>
      )}
      {!existing && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2">Submit your personnel information below. It will be reviewed and approved by an administrator before being added to the system.</Typography>
        </Alert>
      )}

      {/* Form */}
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>Personnel Information</Typography>
          <Typography variant="caption" color="text.secondary">Fields marked with * are required</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {/* Identity */}
            <Grid size={12}>
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Identity</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Serial Number *" size="small" fullWidth disabled={saving}
                value={form.serialNumber}
                onChange={e => set('serialNumber', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="First Name *" size="small" fullWidth disabled={saving}
                value={form.firstName}
                onChange={e => set('firstName', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Middle Name" size="small" fullWidth disabled={saving}
                value={form.middleName || ''}
                onChange={e => set('middleName', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Last Name *" size="small" fullWidth disabled={saving}
                value={form.lastName}
                onChange={e => set('lastName', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Birthdate *" type="date" size="small" fullWidth disabled={saving}
                value={form.birthdate} onChange={e => set('birthdate', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Gender" select size="small" fullWidth disabled={saving}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Blood Type" select size="small" fullWidth disabled={saving}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                value={form.bloodType || ''} onChange={e => set('bloodType', e.target.value)}>
                <option value="">Select Blood Type</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </TextField>
            </Grid>

            <Grid size={12}><Divider /></Grid>

            {/* Service */}
            <Grid size={12}>
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Service Information</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Rank *" select size="small" fullWidth disabled={saving}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                value={form.rank || ''} onChange={e => set('rank', e.target.value)}>
                <option value="">Select Rank</option>
                <optgroup label="Enlisted">
                  {['CCGM','ASN','SN2','SN1'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Junior NCO">
                  {['PO3','PO2','PO1'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Senior NCO">
                  {['CPO','SCPO','MCPO','FMCPO'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Junior Officer">
                  {['P/ENS','ENS','LTJG','LT'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Senior Officer">
                  {['LCDR','CDR','CAPT'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Flag Officer">
                  {['COMMO','RADM','VADM','ADM'].map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Unit *" size="small" fullWidth disabled={saving}
                value={form.unit}
                onChange={e => set('unit', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                placeholder="e.g. CGMS-EV" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Designation" size="small" fullWidth disabled={saving}
                value={form.designation || ''}
                onChange={e => set('designation', e.target.value.toUpperCase())}
                placeholder="e.g. Medical Officer, Nurse"
                inputProps={{ style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Date Joined *" type="date" size="small" fullWidth disabled={saving}
                value={form.dateJoined} onChange={e => set('dateJoined', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            {showEnlistedFields && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="ETE (Expiration of Term)" type="date" size="small" fullWidth disabled={saving}
                  value={form.ete || ''} onChange={e => set('ete', e.target.value)}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
            )}
            {showEnlistedFields && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Re-enlistment Status" select size="small" fullWidth disabled={saving}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                  value={form.reEnlistmentStatus || ''} onChange={e => set('reEnlistmentStatus', e.target.value)}>
                  <option value="">Select Status</option>
                  <option value="First Term">First Term</option>
                  <option value="Re-enlisted (2nd Term)">Re-enlisted (2nd Term)</option>
                  <option value="Re-enlisted (3rd+ Term)">Re-enlisted (3rd+ Term)</option>
                  <option value="Eligible for Re-enlistment">Eligible for Re-enlistment</option>
                  <option value="Not Eligible">Not Eligible</option>
                </TextField>
              </Grid>
            )}
            {showOfficerFields && (
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="CAD Program" size="small" fullWidth disabled={saving}
                  value={form.cadProgram || ''}
                  onChange={e => set('cadProgram', e.target.value.toUpperCase())}
                  placeholder="Coast Guard Academy, Maritime Officers Training"
                  inputProps={{ style: { textTransform: 'uppercase' } }} />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Process Type" select size="small" fullWidth disabled={saving}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                value={form.processType || ''} onChange={e => set('processType', e.target.value)}>
                <option value="">Select Process Type</option>
                <optgroup label="Recruitment">
                  {PROCESS_TYPES_RECRUITMENT.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
                <optgroup label="Medical Processing">
                  {PROCESS_TYPES_MEDICAL.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              </TextField>
            </Grid>

            <Grid size={12}><Divider /></Grid>

            {/* Contact */}
            <Grid size={12}>
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Contact Information</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Contact Number" type="tel" size="small" fullWidth disabled={saving}
                value={form.contactNumber || ''} onChange={e => set('contactNumber', e.target.value)}
                placeholder="09XX-XXX-XXXX" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Email" type="email" size="small" fullWidth disabled={saving}
                value={form.email || ''} onChange={e => set('email', e.target.value)}
                placeholder="email@example.com" />
            </Grid>
            <Grid size={12}>
              <TextField label="Permanent Address" size="small" fullWidth disabled={saving}
                value={form.permanentAddress || ''} onChange={e => set('permanentAddress', e.target.value)}
                placeholder="House No., Street, Barangay, City/Municipality, Province" />
            </Grid>

            {/* Submit */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                <Button type="submit" variant="contained" disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
                  {saving ? 'Submitting...' : existing?.status === 'rejected' ? 'Re-submit for Review' : existing?.status === 'pending' ? 'Update Submission' : 'Submit for Admin Review'}
                </Button>
                <Typography variant="caption" color="text.secondary" alignSelf="center">
                  Logged in as: {user?.displayName} ({user?.email})
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};
