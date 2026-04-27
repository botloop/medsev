import { useState, useEffect } from 'react';
import type { Personnel } from '@shared/types/personnel.types';
import { calculateMedicalProgress, MEDICAL_STEPS } from '@shared/constants/medicalSteps';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { MedicalResultUpload } from './MedicalResultUpload';
import { ClinicalRecordsModal } from './ClinicalRecordsModal';
import type { ReEnlistmentRecord } from '@shared/types/reEnlistment.types';
import { REENLISTMENT_STEP_LABELS } from '@shared/types/reEnlistment.types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

interface PersonnelDetailsModalProps {
  personnel: Personnel;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onRefresh?: () => void;
}

const SectionTitle = ({ title, color }: { title: string; color: string }) => (
  <Typography variant='caption' fontWeight={700}
    sx={{ color, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>
    {title}
  </Typography>
);

const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box mb={0.75}>
    <Typography variant='caption' color='text.secondary' display='block' lineHeight={1.2}>{label}</Typography>
    <Typography variant='body2' fontWeight={600} lineHeight={1.4}>{value || '—'}</Typography>
  </Box>
);

export const PersonnelDetailsModal: React.FC<PersonnelDetailsModalProps> = ({
  personnel, onEdit, onDelete, onClose, onRefresh
}) => {
  const { user } = useAuth();
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [reEnlistRecords, setReEnlistRecords] = useState<ReEnlistmentRecord[]>([]);
  const [updatingStep, setUpdatingStep] = useState(false);

  useEffect(() => {
    api.get('/users')
      .then((res) => {
        const users = res as unknown as { id: string; linkedPersonnelId?: string; photoURL?: string }[];
        const linked = users.find((u) => u.linkedPersonnelId === personnel.id);
        setPhotoURL(linked?.photoURL || null);
      })
      .catch(() => {});
  }, [personnel.id]);

  useEffect(() => {
    if (user?.role !== 'admin' || !personnel.ete) return;
    api.get(`/re-enlistment/${personnel.id}/records`)
      .then((r: any) => setReEnlistRecords(Array.isArray(r) ? r : []))
      .catch(() => {});
  }, [personnel.id, personnel.ete, user?.role]);

  const handleToggleStep = async (recordId: string, stepKey: string, completed: boolean) => {
    setUpdatingStep(true);
    try {
      const updated = await api.patch(`/re-enlistment/${recordId}`, {
        steps: { [stepKey]: { completed } },
      }) as ReEnlistmentRecord;
      setReEnlistRecords(prev => prev.map(r => r.id === recordId ? updated : r));
    } catch { /* silent */ } finally {
      setUpdatingStep(false);
    }
  };

  const canUpdate = user?.permissions.includes('personnel.update') || false;
  const canDelete = user?.permissions.includes('personnel.delete') || false;
  const step2Completed = personnel.medicalStatus.step2?.completed || false;
  const step2Files = personnel.medicalStatus.step2?.files || [];
  const step3Completed = personnel.medicalStatus.step3?.completed || false;
  const step3Files = personnel.medicalStatus.step3?.files || [];
  const fullName = `${personnel.firstName} ${personnel.middleName ? personnel.middleName + ' ' : ''}${personnel.lastName}`;
  const medicalProgress = calculateMedicalProgress(personnel.medicalStatus);
  const age = Math.floor((new Date().getTime() - new Date(personnel.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const progressColor: 'success' | 'warning' | 'error' = medicalProgress === 100 ? 'success' : medicalProgress > 50 ? 'warning' : 'error';

  const statusColor = (s: string) => s === 'completed' ? 'success' : s === 'denied' ? 'error' : 'warning';

  return (
    <>
      <Dialog open onClose={onClose} maxWidth='xl' fullWidth PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Typography variant='h6' component='span' fontWeight={700}>👤 Personnel Details</Typography>
            <Chip label={fullName} size='small' variant='outlined' sx={{ fontWeight: 600 }} />
          </Stack>
          <IconButton onClick={onClose} size='small'><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 1.5, px: 2.5 }}>
          <Grid container spacing={1.5}>

            {/* ── Column 1: Basic + Personal ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1.5} height='100%'>
                <Paper elevation={0} sx={{ p: 1.5, borderLeft: 4, borderColor: '#2563eb', bgcolor: '#2563eb15' }}>
                  <SectionTitle title='📋 Basic Information' color='#2563eb' />
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                    <Avatar src={photoURL || undefined} sx={{ width: 80, height: 80, border: '3px solid #2563eb40' }}>
                      {!photoURL && <AccountCircleIcon sx={{ fontSize: 56, color: '#94a3b8' }} />}
                    </Avatar>
                  </Box>
                  <Grid container spacing={0.5}>
                    <Grid size={12}><InfoField label='Full Name' value={fullName} /></Grid>
                    <Grid size={6}><InfoField label='Serial Number' value={personnel.serialNumber} /></Grid>
                    <Grid size={6}><InfoField label='Rank' value={personnel.rank} /></Grid>
                    <Grid size={6}>
                      <Box mb={0.75}>
                        <Typography variant='caption' color='text.secondary' display='block' lineHeight={1.2}>Status</Typography>
                        <Typography variant='body2' fontWeight={600} color='success.main'>Active</Typography>
                      </Box>
                    </Grid>
                    {personnel.processType && <Grid size={6}><InfoField label='Process Type' value={personnel.processType} /></Grid>}
                  </Grid>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, borderLeft: 4, borderColor: '#16a34a', bgcolor: '#16a34a15', flex: 1 }}>
                  <SectionTitle title='👤 Personal Information' color='#16a34a' />
                  <Grid container spacing={0.5}>
                    <Grid size={6}><InfoField label='Birthdate' value={new Date(personnel.birthdate).toLocaleDateString()} /></Grid>
                    <Grid size={6}><InfoField label='Age' value={`${age} yrs old`} /></Grid>
                    {personnel.gender && <Grid size={6}><InfoField label='Gender' value={personnel.gender} /></Grid>}
                    {personnel.bloodType && <Grid size={6}><InfoField label='Blood Type' value={personnel.bloodType} /></Grid>}
                    {personnel.contactNumber && <Grid size={12}><InfoField label='Contact Number' value={personnel.contactNumber} /></Grid>}
                    {personnel.email && <Grid size={12}><InfoField label='Email' value={personnel.email} /></Grid>}
                    {personnel.permanentAddress && <Grid size={12}><InfoField label='Permanent Address' value={personnel.permanentAddress} /></Grid>}
                  </Grid>
                </Paper>
              </Stack>
            </Grid>

            {/* ── Column 2: Service Info ── */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderLeft: 4, borderColor: '#7c3aed', bgcolor: '#7c3aed15', height: '100%' }}>
                <SectionTitle title='🏢 Service Information' color='#7c3aed' />
                <InfoField label='Unit Assignment' value={personnel.unit} />
                {personnel.designation && <InfoField label='Designation' value={personnel.designation} />}
                <InfoField label='Date Joined' value={new Date(personnel.dateJoined).toLocaleDateString()} />
                {personnel.ete && <InfoField label='ETE' value={new Date(personnel.ete).toLocaleDateString()} />}
                {personnel.reEnlistmentStatus && <InfoField label='Re-enlistment Status' value={personnel.reEnlistmentStatus} />}
                {personnel.cadProgram && <InfoField label='CAD Program' value={personnel.cadProgram} />}
              </Paper>
            </Grid>

            {/* ── Column 3: Medical ── */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderLeft: 4, borderColor: '#dc2626', bgcolor: '#dc262615', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <SectionTitle title='💊 Medical Information' color='#dc2626' />

                {/* Status + progress */}
                <Stack direction='row' spacing={1} alignItems='center' mb={1}>
                  {personnel.medicalStatus.cleared
                    ? <Chip label='✓ Cleared' size='small' color='success' />
                    : <Chip label='In Progress' size='small' color='warning' />}
                  <Box flex={1}>
                    <LinearProgress variant='determinate' value={medicalProgress} color={progressColor}
                      sx={{ borderRadius: 1, height: 6 }} />
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                    {Math.round(medicalProgress)}%
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 1 }} />

                {/* Steps 2×4 compact grid */}
                <Grid container spacing={0.75}>
                  {MEDICAL_STEPS.map((step) => {
                    const stepKey = `step${step.step}` as keyof typeof personnel.medicalStatus;
                    const stepData = personnel.medicalStatus[stepKey] as any;
                    return (
                      <Grid size={6} key={step.step}>
                        <Box sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.75,
                          borderRadius: 1,
                          bgcolor: stepData.completed ? '#f0fdf4' : '#f9fafb',
                          border: 1, borderColor: stepData.completed ? '#bbf7d0' : '#e5e7eb',
                        }}>
                          <Box sx={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: stepData.completed ? 'success.main' : 'grey.300',
                            color: stepData.completed ? 'white' : 'text.secondary',
                          }}>
                            {step.step}
                          </Box>
                          <Typography variant='caption' fontWeight={600} lineHeight={1.3}
                            sx={{ fontSize: '0.7rem' }}>
                            {step.title}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                {step2Completed && (
                  <Box mt={1}>
                    <MedicalResultUpload personnelId={personnel.id} step={2} stepTitle='Medical Laboratory Exams'
                      existingFiles={step2Files} onUploadSuccess={() => { if (onRefresh) onRefresh(); }} />
                  </Box>
                )}

                {(step3Completed || step3Files.length > 0) && (
                  <Box mt={1}>
                    <MedicalResultUpload personnelId={personnel.id} step={3} stepTitle='Submission of Lab Results'
                      existingFiles={step3Files} canUpload={step3Completed}
                      onUploadSuccess={() => { if (onRefresh) onRefresh(); }} />
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* ── Re-Enlistment Records (admin only, when ETE exists) ── */}
            {user?.role === 'admin' && personnel.ete && (
              <Grid size={12}>
                <Paper elevation={0} sx={{ p: 1.5, borderLeft: 4, borderColor: '#d97706', bgcolor: '#d9770610' }}>
                  <Stack direction='row' alignItems='center' spacing={1} mb={1.5}>
                    <AssignmentTurnedInIcon sx={{ color: '#d97706', fontSize: 18 }} />
                    <SectionTitle title='Re-Enlistment Process Records' color='#d97706' />
                    <Box flex={1} />
                    <Typography variant='caption' color='text.secondary'>
                      ETE: {new Date(personnel.ete).toLocaleDateString('en-PH')}
                    </Typography>
                  </Stack>

                  {reEnlistRecords.length === 0 ? (
                    <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic', py: 1 }}>
                      No re-enlistment process records found for this personnel.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {reEnlistRecords.map((rec) => (
                        <Paper key={rec.id} variant='outlined' sx={{ p: 1.5, borderRadius: 1.5 }}>
                          <Stack direction='row' alignItems='center' spacing={1} mb={1.25}>
                            <Chip
                              label={rec.status}
                              size='small'
                              color={statusColor(rec.status)}
                              sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                            />
                            <Typography variant='caption' color='text.secondary'>
                              Started: {new Date(rec.startedAt).toLocaleDateString('en-PH')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              · ETE at start: {new Date(rec.eteDate).toLocaleDateString('en-PH')}
                            </Typography>
                          </Stack>

                          <Grid container spacing={0.75}>
                            {(Object.keys(rec.steps) as Array<keyof typeof rec.steps>).map((key) => {
                              const step = rec.steps[key];
                              return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                                  <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5,
                                    borderRadius: 1, border: 1,
                                    borderColor: step.completed ? '#bbf7d0' : '#e5e7eb',
                                    bgcolor: step.completed ? '#f0fdf4' : '#f9fafb',
                                  }}>
                                    <Tooltip title={step.completed ? 'Mark incomplete' : 'Mark complete'}>
                                      <Checkbox
                                        size='small'
                                        checked={step.completed}
                                        disabled={updatingStep}
                                        onChange={(e) => handleToggleStep(rec.id, key, e.target.checked)}
                                        sx={{ p: 0.25, color: step.completed ? 'success.main' : 'grey.400',
                                          '&.Mui-checked': { color: 'success.main' } }}
                                      />
                                    </Tooltip>
                                    <Typography variant='caption' fontWeight={step.completed ? 700 : 500}
                                      color={step.completed ? 'success.dark' : 'text.secondary'}
                                      sx={{ fontSize: '0.7rem' }}>
                                      {REENLISTMENT_STEP_LABELS[key]}
                                    </Typography>
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>

                          {rec.notes && (
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                              Notes: {rec.notes}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            )}

          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.25, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button variant='outlined' onClick={() => setShowClinicalModal(true)}
            sx={{ borderColor: 'teal', color: 'teal', '&:hover': { bgcolor: '#f0fdfa' } }}>
            🏥 Clinical Records
          </Button>
          <Stack direction='row' gap={1}>
            {canUpdate && <Button variant='contained' onClick={onEdit}>✏️ Edit</Button>}
            {canDelete && <Button variant='contained' color='error' onClick={onDelete}>🗑️ Delete</Button>}
            <Button variant='outlined' onClick={onClose}>Close</Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {showClinicalModal && (
        <ClinicalRecordsModal personnelId={personnel.id} personnelName={fullName}
          personnel={personnel} onClose={() => setShowClinicalModal(false)} />
      )}
    </>
  );
};
