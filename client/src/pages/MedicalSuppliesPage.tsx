import { useEffect, useState } from 'react';
import { useMedicalSupplies } from '../hooks/useMedicalSupplies';
import { useAuth } from '../hooks/useAuth';
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from '@shared/types/medicalSupplies.types';
import type { MedicalSupply, CreateMedicalSupplyDTO } from '@shared/types/medicalSupplies.types';
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

const EMPTY_FORM: CreateMedicalSupplyDTO = { name: '', category: '', quantity: 0, unit: 'pcs', minimumStock: 0, expiryDate: '', location: '', supplier: '', notes: '' };

const stockStatus = (supply: MedicalSupply) => {
  if (supply.quantity === 0) return { label: 'Out of Stock', color: 'error' as const };
  if (supply.quantity <= supply.minimumStock) return { label: 'Low Stock', color: 'warning' as const };
  return { label: 'In Stock', color: 'success' as const };
};

const isExpiringSoon = (d?: string) => { if (!d) return false; const days = (new Date(d).getTime() - Date.now()) / 86400000; return days >= 0 && days <= 30; };
const isExpired = (d?: string) => { if (!d) return false; return new Date(d).getTime() < Date.now(); };

export const MedicalSuppliesPage = () => {
  const { user } = useAuth();
  const { supplies, loading, fetchSupplies, addSupply, updateSupply, deleteSupply } = useMedicalSupplies();
  const [showForm, setShowForm] = useState(false);
  const [editingSupply, setEditingSupply] = useState<MedicalSupply | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMedicalSupplyDTO>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const canWrite = user?.permissions.includes('medical.update') || false;
  const canDelete = user?.permissions.includes('personnel.delete') || false;

  useEffect(() => { fetchSupplies(); }, []);

  const openAdd = () => { setEditingSupply(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (supply: MedicalSupply) => {
    setEditingSupply(supply); setForm({ name: supply.name, category: supply.category, quantity: supply.quantity, unit: supply.unit, minimumStock: supply.minimumStock, expiryDate: supply.expiryDate || '', location: supply.location || '', supplier: supply.supplier || '', notes: supply.notes || '' });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { if (editingSupply) { await updateSupply(editingSupply.id, form); } else { await addSupply(form); } setShowForm(false); setEditingSupply(null); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => { await deleteSupply(id); setDeletingId(null); };

  const filtered = supplies.filter((s) => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()) || (s.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || s.category === filterCategory;
    const matchesStatus = !filterStatus || (filterStatus === 'low' && s.quantity <= s.minimumStock && s.quantity > 0) || (filterStatus === 'out' && s.quantity === 0) || (filterStatus === 'expiring' && isExpiringSoon(s.expiryDate)) || (filterStatus === 'expired' && isExpired(s.expiryDate));
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = supplies.length;
  const lowStock = supplies.filter(s => s.quantity > 0 && s.quantity <= s.minimumStock).length;
  const outOfStock = supplies.filter(s => s.quantity === 0).length;
  const expiringSoon = supplies.filter(s => isExpiringSoon(s.expiryDate)).length;

  const STAT_CARDS = [
    { label: 'Total Items', value: totalItems, color: '#3b82f6' },
    { label: 'Low Stock', value: lowStock, color: lowStock > 0 ? '#f97316' : '#9ca3af' },
    { label: 'Out of Stock', value: outOfStock, color: outOfStock > 0 ? '#ef4444' : '#9ca3af' },
    { label: 'Expiring Soon', value: expiringSoon, color: expiringSoon > 0 ? '#eab308' : '#9ca3af' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={700}>💊 Medical Supplies Inventory</Typography>
            <Typography variant='caption' color='text.secondary'>Track and manage medical supply stock levels</Typography>
          </Box>
          {canWrite && <Button variant="contained" onClick={openAdd}>+ Add Supply</Button>}
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        {STAT_CARDS.map(s => (
          <Grid size={{ xs: 6, lg: 3 }} key={s.label}>
            <Paper sx={{ p: 1.5, bgcolor: s.color, color: 'white' }}>
              <Typography variant='caption' sx={{ opacity: 0.85 }}>{s.label}</Typography>
              <Typography variant='h5' fontWeight={700}>{s.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingSupply(null); }} maxWidth="md" fullWidth>
        <DialogTitle>{editingSupply ? 'Edit Supply' : 'Add New Supply'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}><TextField required fullWidth size="small" label="Supply Name *" placeholder="e.g. Paracetamol 500mg"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField required fullWidth size="small" label="Category *" select
                SelectProps={{ native: true }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </TextField></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField required fullWidth size="small" type="number" label="Quantity *"
                inputProps={{ min: 0 }} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField required fullWidth size="small" label="Unit *" select
                SelectProps={{ native: true }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {SUPPLY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </TextField></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField fullWidth size="small" type="number" label="Minimum Stock Level"
                inputProps={{ min: 0 }} value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: Number(e.target.value) })} /></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField fullWidth size="small" type="date" label="Expiry Date"
                InputLabelProps={{ shrink: true }} value={form.expiryDate || ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField fullWidth size="small" label="Storage Location" placeholder="e.g. Shelf A"
                value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></Grid>
              <Grid size={{ xs: 6, md: 4 }}><TextField fullWidth size="small" label="Supplier" placeholder="e.g. DOH Supply Unit"
                value={form.supplier || ''} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Grid>
              <Grid size={12}><TextField fullWidth size="small" multiline rows={2} label="Notes" placeholder="Additional notes..."
                value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
            <Button variant='outlined' onClick={() => { setShowForm(false); setEditingSupply(null); }}>Cancel</Button>
            <Button variant='contained' type='submit' disabled={saving}>{saving ? 'Saving...' : editingSupply ? 'Update Supply' : 'Add Supply'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <TextField size="small" sx={{ flex: 1 }} placeholder="Search by name, category, location..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <TextField size="small" select SelectProps={{ native: true }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </TextField>
          <TextField size="small" select SelectProps={{ native: true }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="expiring">Expiring Soon (30 days)</option>
            <option value="expired">Expired</option>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box p={6} textAlign='center'><CircularProgress sx={{ mb: 1 }} /><Typography color='text.secondary' variant='body2'>Loading supplies...</Typography></Box>
        ) : filtered.length === 0 ? (
          <Box p={6} textAlign='center'>
            <Typography fontSize={48} mb={1}>💊</Typography>
            <Typography fontWeight={600}>{supplies.length === 0 ? 'No supplies added yet' : 'No supplies match your filters'}</Typography>
            {canWrite && supplies.length === 0 && <Button variant="contained" sx={{ mt: 1.5 }} onClick={openAdd}>+ Add First Supply</Button>}
          </Box>
        ) : (
          <>
            {/* Mobile card view */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {filtered.map(supply => {
                const status = stockStatus(supply);
                const expired = isExpired(supply.expiryDate);
                const expiring = isExpiringSoon(supply.expiryDate);
                return (
                  <Box key={supply.id} sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: supply.quantity === 0 ? '#fef2f2' : 'transparent' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Box flex={1} minWidth={0}>
                        <Typography variant='body2' fontWeight={600} noWrap>{supply.name}</Typography>
                        {supply.supplier && <Typography variant='caption' color='text.secondary'>{supply.supplier}</Typography>}
                      </Box>
                      <Chip label={status.label} size='small' color={status.color} sx={{ ml: 1, flexShrink: 0 }} />
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      <Chip label={supply.category} size='small' color='primary' variant='outlined' />
                      <Typography variant='caption' color='text.secondary'>{supply.quantity} {supply.unit} (min {supply.minimumStock})</Typography>
                      {supply.location && <Typography variant='caption' color='text.secondary'>📍 {supply.location}</Typography>}
                      {supply.expiryDate && (
                        <Typography variant='caption' color={expired ? 'error.main' : expiring ? 'warning.main' : 'text.secondary'}>
                          {expired ? '⚠️ ' : expiring ? '⏰ ' : ''}Exp: {new Date(supply.expiryDate).toLocaleDateString('en-PH')}
                        </Typography>
                      )}
                    </Box>
                    {deletingId === supply.id ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant='caption' color='error.main' fontWeight={700}>Delete?</Typography>
                        <Button size='small' variant='contained' color='error' onClick={() => handleDelete(supply.id)}>Yes</Button>
                        <Button size='small' variant='outlined' onClick={() => setDeletingId(null)}>No</Button>
                      </Box>
                    ) : (
                      <Box display="flex" gap={1}>
                        {canWrite && <Button size='small' onClick={() => openEdit(supply)}>✏️ Edit</Button>}
                        {canDelete && <Button size='small' color='error' onClick={() => setDeletingId(supply.id)}>🗑️ Delete</Button>}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Desktop table */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Name', 'Category', 'Stock', 'Min. Level', 'Expiry', 'Location', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                  ))}</TableRow></TableHead>
                <TableBody>
                  {filtered.map(supply => {
                    const status = stockStatus(supply);
                    const expired = isExpired(supply.expiryDate);
                    const expiring = isExpiringSoon(supply.expiryDate);
                    return (
                      <TableRow key={supply.id} hover sx={{ bgcolor: supply.quantity === 0 ? '#fef2f2' : 'transparent' }}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{supply.name}</Typography>{supply.supplier && <Typography variant="caption" color="text.secondary">{supply.supplier}</Typography>}</TableCell>
                        <TableCell><Chip label={supply.category} size='small' color='primary' variant='outlined' /></TableCell>
                        <TableCell><Typography variant='body2' fontWeight={700}>{supply.quantity}</Typography><Typography variant='caption' color='text.secondary'> {supply.unit}</Typography></TableCell>
                        <TableCell><Typography variant='body2'>{supply.minimumStock} {supply.unit}</Typography></TableCell>
                        <TableCell>
                          {supply.expiryDate ? (
                            <Typography variant='caption' color={expired ? 'error.main' : expiring ? 'warning.main' : 'text.secondary'} fontWeight={600}>
                              {expired ? '⚠️ ' : expiring ? '⏰ ' : ''}{new Date(supply.expiryDate).toLocaleDateString('en-PH')}
                            </Typography>
                          ) : <Typography variant='caption' color='text.disabled'>—</Typography>}
                        </TableCell>
                        <TableCell><Typography variant='body2'>{supply.location || '—'}</Typography></TableCell>
                        <TableCell><Chip label={status.label} size='small' color={status.color} /></TableCell>
                        <TableCell>
                          {deletingId === supply.id ? (
                            <Box display="flex" gap={0.5}>
                              <Button size='small' variant='contained' color='error' onClick={() => handleDelete(supply.id)}>Yes</Button>
                              <Button size='small' variant='outlined' onClick={() => setDeletingId(null)}>No</Button>
                            </Box>
                          ) : (
                            <Box display="flex" gap={0.5}>
                              {canWrite && <Button size='small' onClick={() => openEdit(supply)}>✏️</Button>}
                              {canDelete && <Button size='small' color='error' onClick={() => setDeletingId(supply.id)}>🗑️</Button>}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ bgcolor: 'grey.50', px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant='caption' color='text.secondary'>Showing <strong>{filtered.length}</strong> of <strong>{supplies.length}</strong> supplies</Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};