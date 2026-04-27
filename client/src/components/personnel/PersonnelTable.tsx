/**
 * Personnel Table Component
 * Display personnel records in a table with actions
 */

import type { Personnel } from '@shared/types/personnel.types';
import { useAuth } from '../../hooks/useAuth';
import { calculateMedicalProgress } from '@shared/constants/medicalSteps';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';

interface PersonnelTableProps {
  personnel: Personnel[];
  loading: boolean;
  onView: (person: Personnel) => void;
  onEdit: (person: Personnel) => void;
  onDelete: (person: Personnel) => void;
  onClinical: (person: Personnel) => void;
}

export const PersonnelTable: React.FC<PersonnelTableProps> = ({
  personnel, loading, onView, onEdit, onDelete, onClinical
}) => {
  const { user } = useAuth();
  const canUpdate = user?.permissions.includes('personnel.update') || false;
  const canDelete = user?.permissions.includes('personnel.delete') || false;

  if (loading) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading personnel records...</Typography>
      </Paper>
    );
  }

  if (personnel.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Typography fontSize={56} mb={1}>👥</Typography>
        <Typography variant="h6" fontWeight={700} mb={1}>No Personnel Found</Typography>
        <Typography color="text.secondary">No personnel records match your search criteria.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Serial Number', 'Name', 'Rank', 'Unit', 'Medical Status'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
                  {h}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personnel.map((person) => {
              const fullName = `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;
              const medicalProgress = calculateMedicalProgress(person.medicalStatus);
              const progressColor: 'success' | 'warning' | 'error' = medicalProgress === 100 ? 'success' : medicalProgress > 50 ? 'warning' : 'error';

              return (
                <TableRow key={person.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{person.serialNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{fullName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={person.rank} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{person.unit}</Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={medicalProgress}
                        color={progressColor}
                        sx={{ width: 80, borderRadius: 1, height: 6 }}
                      />
                      <Typography variant="caption" color="text.secondary">{Math.round(medicalProgress)}%</Typography>
                      {person.medicalStatus.cleared && (
                        <Typography variant="caption" color="success.main" fontWeight={700}>✓</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Button size="small" onClick={() => onView(person)}>View</Button>
                      <Button size="small" onClick={() => onClinical(person)} sx={{ color: 'teal' }}>Clinical</Button>
                      {canUpdate && <Button size="small" color="success" onClick={() => onEdit(person)}>Edit</Button>}
                      {canDelete && <Button size="small" color="error" onClick={() => onDelete(person)}>Delete</Button>}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Box sx={{ bgcolor: 'grey.50', px: 3, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Showing <strong>{personnel.length}</strong> personnel records
        </Typography>
      </Box>
    </Paper>
  );
};
