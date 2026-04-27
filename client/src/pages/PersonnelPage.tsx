/**
 * Personnel Page
 * Main personnel management interface with table and modals
 */

import { useEffect, useState } from 'react';
import { usePersonnel } from '../hooks/usePersonnel';
import { useAuth } from '../hooks/useAuth';
import { PersonnelTable } from '../components/personnel/PersonnelTable';
import { PersonnelFormModal } from '../components/personnel/PersonnelFormModal';
import { PersonnelDetailsModal } from '../components/personnel/PersonnelDetailsModal';
import { DeleteConfirmModal } from '../components/personnel/DeleteConfirmModal';
import { ClinicalRecordsModal } from '../components/personnel/ClinicalRecordsModal';
import type { Personnel } from '@shared/types/personnel.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

export const PersonnelPage = () => {
  const { user } = useAuth();
  const { personnel, loading, fetchPersonnel, addPersonnel, updatePersonnel, deletePersonnel } = usePersonnel();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);

  useEffect(() => { fetchPersonnel(); }, []);

  const q = searchQuery.toLowerCase().trim();
  const filteredPersonnel = q
    ? personnel.filter(p =>
        `${p.firstName} ${p.middleName ?? ''} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.serialNumber ?? '').toLowerCase().includes(q) ||
        (p.rank ?? '').toLowerCase().includes(q) ||
        (p.unit ?? '').toLowerCase().includes(q) ||
        (p.designation ?? '').toLowerCase().includes(q)
      )
    : personnel;

  const handleView = (person: Personnel) => { setSelectedPersonnel(person); setShowDetailsModal(true); };
  const handleEdit = (person: Personnel) => { setSelectedPersonnel(person); setShowEditModal(true); };
  const handleDelete = (person: Personnel) => { setSelectedPersonnel(person); setShowDeleteModal(true); };
  const handleClinical = (person: Personnel) => { setSelectedPersonnel(person); setShowClinicalModal(true); };

  const handleDeleteConfirm = async () => {
    if (selectedPersonnel) {
      const success = await deletePersonnel(selectedPersonnel.id);
      if (success) { setShowDeleteModal(false); setSelectedPersonnel(null); }
    }
  };

  const canCreate = user?.permissions.includes('personnel.create') || false;
  const isViewerWithLinkedRecord = user?.role === 'viewer' && (user as any)?.linkedPersonnelId;

  useEffect(() => {
    if (isViewerWithLinkedRecord) {
      const linkedPersonnelId = (user as any).linkedPersonnelId;
      const linkedRecord = personnel.find(p => p.id === linkedPersonnelId);
      if (linkedRecord && !showDetailsModal) {
        setSelectedPersonnel(linkedRecord);
        setShowDetailsModal(true);
      }
    }
  }, [personnel, isViewerWithLinkedRecord, user]);

  // Viewer with linked record
  if (user?.role === 'viewer' && (user as any)?.linkedPersonnelId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>My Personnel Record</Typography>
          <Alert severity="success" icon={false} sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Record Linked</Typography>
            <Typography variant="body2" mb={2}>
              Your account has been successfully linked to your personnel record. Click below to view your information.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                const linkedRecord = personnel.find(p => p.id === (user as any).linkedPersonnelId);
                if (linkedRecord) { setSelectedPersonnel(linkedRecord); setShowDetailsModal(true); }
              }}
            >
              View My Record
            </Button>
          </Alert>
        </Paper>
        {showDetailsModal && selectedPersonnel && (
          <PersonnelDetailsModal
            personnel={selectedPersonnel}
            onEdit={() => {}}
            onDelete={() => {}}
            onClose={() => { setShowDetailsModal(false); setSelectedPersonnel(null); }}
            onRefresh={() => { fetchPersonnel(); }}
          />
        )}
      </Box>
    );
  }

  // Admin / non-viewer view
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
          <Typography variant="h5" fontWeight={700}>Personnel Records</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
            <TextField
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, serial, rank, unit…"
              sx={{ width: { xs: '100%', md: 320 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }
              }}
            />
            {canCreate && (
              <Button variant="contained" onClick={() => { setSelectedPersonnel(null); setShowAddModal(true); }} sx={{ whiteSpace: 'nowrap' }}>
                + Add Personnel
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <PersonnelTable
        personnel={filteredPersonnel}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClinical={handleClinical}
      />

      {showAddModal && (
        <PersonnelFormModal
          mode="create"
          onSave={async (data) => { const r = await addPersonnel(data); if (r) setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedPersonnel && (
        <PersonnelFormModal
          mode="edit"
          personnel={selectedPersonnel}
          onSave={async (data) => {
            const r = await updatePersonnel(selectedPersonnel.id, data);
            if (r) { setShowEditModal(false); setSelectedPersonnel(null); }
          }}
          onClose={() => { setShowEditModal(false); setSelectedPersonnel(null); }}
        />
      )}

      {showDetailsModal && selectedPersonnel && (
        <PersonnelDetailsModal
          personnel={selectedPersonnel}
          onEdit={() => { setShowDetailsModal(false); setShowEditModal(true); }}
          onDelete={() => { setShowDetailsModal(false); handleDelete(selectedPersonnel); }}
          onClose={() => { setShowDetailsModal(false); setSelectedPersonnel(null); }}
          onRefresh={() => { fetchPersonnel(); }}
        />
      )}

      {showDeleteModal && selectedPersonnel && (
        <DeleteConfirmModal
          personnel={selectedPersonnel}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setSelectedPersonnel(null); }}
        />
      )}

      {showClinicalModal && selectedPersonnel && (
        <ClinicalRecordsModal
          personnelId={selectedPersonnel.id}
          personnelName={`${selectedPersonnel.firstName} ${selectedPersonnel.middleName ? selectedPersonnel.middleName + ' ' : ''}${selectedPersonnel.lastName}`}
          personnel={selectedPersonnel}
          onClose={() => { setShowClinicalModal(false); setSelectedPersonnel(null); }}
        />
      )}
    </Box>
  );
};