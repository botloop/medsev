/**
 * Personnel Form Modal
 * Form for adding/editing personnel with validation
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPersonnelSchema } from '@shared/validators/personnel.schemas';
import { isOfficer } from '@shared/constants/ranks';
import { MEDICAL_STEPS } from '@shared/constants/medicalSteps';
import type { Personnel, CreatePersonnelDTO } from '@shared/types/personnel.types';

const PROCESS_TYPES_RECRUITMENT = ['Commissionship', 'Enlistment', 'Lateral-Entry', 'Re-Entry', 'Applicant'] as const;
const PROCESS_TYPES_MEDICAL = ['CAD', 'Promotion', 'Foreign Schooling', 'Local Schooling', 'Re-Enlistment'] as const;
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface PersonnelFormModalProps {
  mode: 'create' | 'edit';
  personnel?: Personnel;
  onSave: (data: CreatePersonnelDTO) => Promise<void>;
  onClose: () => void;
}

export const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({ mode, personnel, onSave, onClose }) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreatePersonnelDTO>({
    resolver: zodResolver(createPersonnelSchema),
    defaultValues: personnel ? {
      serialNumber: personnel.serialNumber,
      firstName: personnel.firstName,
      middleName: personnel.middleName,
      lastName: personnel.lastName,
      birthdate: personnel.birthdate ? new Date(personnel.birthdate).toISOString().split('T')[0] : '',
      rank: personnel.rank,
      unit: personnel.unit,
      contactNumber: personnel.contactNumber || '',
      email: personnel.email || '',
      dateJoined: personnel.dateJoined ? new Date(personnel.dateJoined).toISOString().split('T')[0] : '',
      ete: personnel.ete ? new Date(personnel.ete).toISOString().split('T')[0] : '',
      reEnlistmentStatus: personnel.reEnlistmentStatus || '',
      cadProgram: personnel.cadProgram || '',
      gender: personnel.gender || '',
      bloodType: personnel.bloodType || '',
      permanentAddress: personnel.permanentAddress || '',
      designation: personnel.designation || '',
      processType: personnel.processType,
      medicalSteps: {
        step1: personnel.medicalStatus?.step1?.completed || false,
        step2: personnel.medicalStatus?.step2?.completed || false,
        step3: personnel.medicalStatus?.step3?.completed || false,
        step4: personnel.medicalStatus?.step4?.completed || false,
        step5: personnel.medicalStatus?.step5?.completed || false,
        step6: personnel.medicalStatus?.step6?.completed || false,
        step7: personnel.medicalStatus?.step7?.completed || false,
        step8: personnel.medicalStatus?.step8?.completed || false,
      }
    } : undefined
  });

  const selectedRank = watch('rank');
  const showOfficerFields = selectedRank && isOfficer(selectedRank);
  const showEnlistedFields = selectedRank && !isOfficer(selectedRank);

  const isStepAlreadyCompleted = (stepNum: number): boolean => {
    if (mode !== 'edit' || !personnel) return false;
    const stepKey = `step${stepNum}` as keyof typeof personnel.medicalStatus;
    return !!(personnel.medicalStatus?.[stepKey] as any)?.completed;
  };

  const onSubmit = async (data: CreatePersonnelDTO) => {
    const formattedData = {
      ...data,
      birthdate: new Date(data.birthdate).toISOString(),
      dateJoined: new Date(data.dateJoined).toISOString(),
      ete: data.ete ? new Date(data.ete).toISOString() : undefined,
      processType: data.processType || undefined
    };
    await onSave(formattedData);
  };

  return (
    <Dialog open onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant='h6' component="span" fontWeight={700}>
          {mode === 'create' ? '👤+ ADD NEW PERSONNEL' : '✏️ EDIT PERSONNEL'}
        </Typography>
        <IconButton onClick={onClose} disabled={isSubmitting} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box component="form" id="personnel-form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Serial Number *" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.serialNumber} helperText={errors.serialNumber?.message}
                inputProps={{ ...register('serialNumber'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="First Name *" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.firstName} helperText={errors.firstName?.message}
                inputProps={{ ...register('firstName'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Middle Name" size="small" fullWidth disabled={isSubmitting}
                inputProps={{ ...register('middleName'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Last Name *" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.lastName} helperText={errors.lastName?.message}
                inputProps={{ ...register('lastName'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Birthdate *" type="date" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.birthdate} helperText={errors.birthdate?.message}
                InputLabelProps={{ shrink: true }} inputProps={register('birthdate')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="gender" control={control} render={({ field }) => (
                <TextField label="Gender" select size="small" fullWidth disabled={isSubmitting}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="bloodType" control={control} render={({ field }) => (
                <TextField label="Blood Type" select size="small" fullWidth disabled={isSubmitting}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}>
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name="rank" control={control} render={({ field }) => (
                <TextField label="Rank *" select size="small" fullWidth disabled={isSubmitting}
                  error={!!errors.rank} helperText={errors.rank?.message}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}>
                  <option value="">Select Rank</option>
                  <optgroup label="Enlisted">
                    <option value="CCGM">CCGM</option>
                    <option value="ASN">ASN</option>
                    <option value="SN2">SN2</option>
                    <option value="SN1">SN1</option>
                  </optgroup>
                  <optgroup label="Junior NCO">
                    <option value="PO3">PO3</option>
                    <option value="PO2">PO2</option>
                    <option value="PO1">PO1</option>
                  </optgroup>
                  <optgroup label="Senior NCO">
                    <option value="CPO">CPO</option>
                    <option value="SCPO">SCPO</option>
                    <option value="MCPO">MCPO</option>
                    <option value="FMCPO">FMCPO</option>
                  </optgroup>
                  <optgroup label="Junior Officer">
                    <option value="P/ENS">P/ENS</option>
                    <option value="ENS">ENS</option>
                    <option value="LTJG">LTJG</option>
                    <option value="LT">LT</option>
                  </optgroup>
                  <optgroup label="Senior Officer">
                    <option value="LCDR">LCDR</option>
                    <option value="CDR">CDR</option>
                    <option value="CAPT">CAPT</option>
                  </optgroup>
                  <optgroup label="Flag Officer">
                    <option value="COMMO">COMMO</option>
                    <option value="RADM">RADM</option>
                    <option value="VADM">VADM</option>
                    <option value="ADM">ADM</option>
                  </optgroup>
                </TextField>
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Unit *" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.unit} helperText={errors.unit?.message}
                placeholder="Medical Station Eastern Visayas"
                inputProps={{ ...register('unit'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Designation" size="small" fullWidth disabled={isSubmitting}
                placeholder="e.g. Medical Officer, Nurse"
                inputProps={{ ...register('designation'), style: { textTransform: 'uppercase' } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Contact Number" type="tel" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.contactNumber} helperText={errors.contactNumber?.message}
                placeholder='09XX-XXX-XXXX' inputProps={register('contactNumber')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Email" type="email" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.email} helperText={errors.email?.message}
                placeholder='email@example.com' inputProps={register('email')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Date Joined *" type="date" size="small" fullWidth disabled={isSubmitting}
                error={!!errors.dateJoined} helperText={errors.dateJoined?.message}
                InputLabelProps={{ shrink: true }} inputProps={register('dateJoined')} />
            </Grid>
            {showEnlistedFields && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="ETE (Expiration of Term)" type="date" size="small" fullWidth disabled={isSubmitting}
                  InputLabelProps={{ shrink: true }} inputProps={register('ete')} />
              </Grid>
            )}
            {showEnlistedFields && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Re-enlistment Status" select size="small" fullWidth disabled={isSubmitting}
                  SelectProps={{ native: true, inputProps: register('reEnlistmentStatus') }}
                  InputLabelProps={{ shrink: true }}>
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
                <TextField label="CAD Program" size="small" fullWidth disabled={isSubmitting}
                  placeholder="Coast Guard Academy, Maritime Officers Training"
                  inputProps={{ ...register('cadProgram'), style: { textTransform: 'uppercase' } }} />
              </Grid>
            )}
            <Grid size={12}>
              <TextField label="Permanent Address" size="small" fullWidth disabled={isSubmitting}
                placeholder="House No., Street, Barangay, City/Municipality, Province"
                inputProps={register('permanentAddress')} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="processType" control={control} render={({ field }) => (
                <TextField label="Process Type" select size="small" fullWidth disabled={isSubmitting}
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}>
                  <option value="">Select Process Type</option>
                  <optgroup label="Recruitment">
                    {PROCESS_TYPES_RECRUITMENT.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Medical Processing">
                    {PROCESS_TYPES_MEDICAL.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </TextField>
              )} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>💊 MEDICAL PROCESSING STEPS</Typography>
            <Box sx={{ bgcolor: '#fef2f2', border: 1, borderColor: '#fecaca', borderRadius: 1, p: 2 }}>
              <Grid container spacing={1.5}>
                {MEDICAL_STEPS.map((step) => {
                  const alreadyDone = isStepAlreadyCompleted(step.step);
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={step.step}>
                      <Box sx={{
                        bgcolor: alreadyDone ? '#f0fdf4' : 'white',
                        border: 1,
                        borderColor: alreadyDone ? 'success.light' : 'divider',
                        borderRadius: 1, p: 1.5,
                        display: 'flex', alignItems: 'flex-start', gap: 1,
                        '&:hover': { borderColor: alreadyDone ? 'success.main' : 'error.main' },
                        transition: 'border-color 0.2s',
                      }}>
                        <Checkbox
                          {...register(`medicalSteps.step${step.step}` as any)}
                          size="small"
                          color={alreadyDone ? 'success' : 'error'}
                          disabled={isSubmitting || alreadyDone}
                          sx={{ mt: -0.5 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={700}>Step {step.step}: {step.title}</Typography>
                            {alreadyDone && (
                              <Chip label="Completed" size="small" color="success"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">{step.description}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
            <Typography variant="caption" color="text.secondary" fontStyle="italic" mt={1} display="block">
              ℹ️ If all 8 steps are completed, medical status will be automatically marked as cleared
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" type="submit" form="personnel-form" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Personnel' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};