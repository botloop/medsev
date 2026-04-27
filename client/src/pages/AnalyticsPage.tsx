import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Personnel } from '@shared/types/personnel.types';
import { ClinicalRecordsModal } from '../components/personnel/ClinicalRecordsModal';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

export const AnalyticsPage = () => {
  const [clinicalOpen, setClinicalOpen] = useState(true);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [clinicalSearch, setClinicalSearch] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);

  useEffect(() => {
    setPersonnelLoading(true);
    api.get('/personnel').then((res) => { const r = res as unknown as { data: Personnel[] }; setPersonnelList(r.data ?? []); }).catch(() => {}).finally(() => setPersonnelLoading(false));
  }, []);

  const filteredPersonnel = personnelList.filter(p => {
    const q = clinicalSearch.toLowerCase();
    return !q || `${p.firstName} ${p.lastName} ${p.serialNumber} ${p.rank} ${p.unit}`.toLowerCase().includes(q);
  });

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Box
        onClick={() => setClinicalOpen(o => !o)}
        sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: clinicalOpen ? '1px solid' : 'none',
          borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'grey.100' } }}
      >
        <Typography variant="subtitle2" fontWeight={700}>🩺 Clinical Records</Typography>
        <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
          {clinicalOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={clinicalOpen}>
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Search by name, serial no., rank, unit…"
            value={clinicalSearch}
            onChange={e => setClinicalSearch(e.target.value)}
            fullWidth
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
        </Box>
        {personnelLoading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, display: { xs: 'none', md: 'table-cell' } }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, display: { xs: 'none', sm: 'table-cell' } }}>Serial No.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>Records</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPersonnel.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {clinicalSearch ? 'No personnel match your search.' : 'No personnel found.'}
                  </TableCell>
                </TableRow>
              )}
              {filteredPersonnel.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.lastName}, {p.firstName} {p.middleName || ''}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{p.rank}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontSize: 12 }}>{p.unit}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: 12 }}>{p.serialNumber}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<MedicalServicesIcon fontSize="small" />}
                      onClick={e => { e.stopPropagation(); setSelectedPersonnel(p); }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Collapse>

      {selectedPersonnel && (
        <ClinicalRecordsModal
          personnelId={selectedPersonnel.id}
          personnelName={`${selectedPersonnel.rank} ${selectedPersonnel.lastName}, ${selectedPersonnel.firstName}`}
          personnel={selectedPersonnel}
          onClose={() => setSelectedPersonnel(null)}
        />
      )}
    </TableContainer>
  );
};
