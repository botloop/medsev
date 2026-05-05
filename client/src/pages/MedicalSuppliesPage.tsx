import { useEffect, useState } from 'react';
import { useMedicalSupplies } from '../hooks/useMedicalSupplies';
import { useAuth } from '../hooks/useAuth';
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from '@shared/types/medicalSupplies.types';
import type { MedicalSupply, CreateMedicalSupplyDTO, DispenseRecord, CreateDispenseRecordDTO } from '@shared/types/medicalSupplies.types';
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
import Pagination from '@mui/material/Pagination';
import Divider from '@mui/material/Divider';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HistoryIcon from '@mui/icons-material/History';
import toast from 'react-hot-toast';

const PAGE_SIZE = 5;

const EMPTY_FORM: CreateMedicalSupplyDTO = { name: '', category: '', quantity: 0, unit: 'pcs', minimumStock: 0, expiryDate: '', location: '', supplier: '', notes: '' };

// ─── Paste import helpers ─────────────────────────────────────────────────────

type ParsedRow = CreateMedicalSupplyDTO & { _key: string };

function guessUnit(text: string): string {
  const t = text.toLowerCase();
  for (const u of SUPPLY_UNITS) { if (t.includes(u)) return u; }
  if (t.includes('tablet') || t.includes('tab') || t.includes('cap')) return 'pcs';
  if (t.includes('bottle') || t.includes('btl')) return 'bottles';
  if (t.includes('box')) return 'boxes';
  if (t.includes('ampule') || t.includes('amp')) return 'ampules';
  if (t.includes('vial')) return 'vials';
  if (t.includes('sachet')) return 'sachets';
  return 'pcs';
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/bandage|gauze|dressing|plaster|cotton|tape/.test(n)) return 'Bandages & Dressings';
  if (/iv|fluid|saline|dextrose|ringer/.test(n)) return 'IV & Fluids';
  if (/glove|mask|gown|ppe|shield/.test(n)) return 'PPE';
  if (/syringe|needle|scalpel|scissors|forcep|clamp|catheter/.test(n)) return 'Instruments & Equipment';
  if (/alcohol|swab|wipe|cotton|applicator/.test(n)) return 'Consumables';
  if (/epi|epinephrine|defibrill|tourniquet|ambu/.test(n)) return 'Emergency Supplies';
  return 'Medications';
}

function parsePastedText(raw: string): ParsedRow[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map((line, i) => {
    // Try comma or tab separated: Name, Qty, Unit, Category, Expiry, Location
    const sep = line.includes('\t') ? '\t' : line.includes(',') ? ',' : null;
    if (sep) {
      const [name = '', qty = '', unit = '', category = '', expiry = '', location = ''] = line.split(sep).map(s => s.trim());
      return {
        _key: String(i),
        name,
        quantity: parseFloat(qty) || 0,
        unit: unit || guessUnit(name),
        category: category || guessCategory(name),
        minimumStock: 0,
        expiryDate: expiry || '',
        location: location || '',
        supplier: '', notes: '',
      };
    }
    // Fallback: try to extract a number as quantity from the line
    const numMatch = line.match(/(\d+(?:\.\d+)?)/);
    const qty = numMatch ? parseFloat(numMatch[1]) : 0;
    const name = line.replace(/\d+(?:\.\d+)?\s*(pcs|boxes|bottles|ampules|vials|sachets|pairs|sets|rolls|packs|liters|ml|tabs?|caps?|btl)?/gi, '').trim();
    return {
      _key: String(i),
      name: name || line,
      quantity: qty,
      unit: guessUnit(line),
      category: guessCategory(name || line),
      minimumStock: 0,
      expiryDate: '', location: '', supplier: '', notes: '',
    };
  });
}

// ─── Paste Import Dialog ──────────────────────────────────────────────────────

function PasteImportDialog({ open, onClose, onImport }: {
  open: boolean; onClose: () => void; onImport: (rows: CreateMedicalSupplyDTO[]) => Promise<void>;
}) {
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [raw, setRaw] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleParse = () => {
    const parsed = parsePastedText(raw);
    if (!parsed.length) { toast.error('No valid lines found'); return; }
    setRows(parsed); setStep('preview');
  };

  const handleClose = () => { setStep('paste'); setRaw(''); setRows([]); onClose(); };

  const updateRow = (key: string, field: keyof CreateMedicalSupplyDTO, value: string | number) =>
    setRows(p => p.map(r => r._key === key ? { ...r, [field]: value } : r));

  const removeRow = (key: string) => setRows(p => p.filter(r => r._key !== key));

  const handleImport = async () => {
    const valid = rows.filter(r => r.name.trim());
    if (!valid.length) { toast.error('No valid entries'); return; }
    setImporting(true);
    try { await onImport(valid); handleClose(); }
    finally { setImporting(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {step === 'paste' ? '📋 Paste Multiple Supplies' : `Preview — ${rows.length} item${rows.length !== 1 ? 's' : ''}`}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {step === 'paste' ? (
          <Stack spacing={2}>
            <Box sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 1, p: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="info.main" display="block" mb={0.5}>Format (one item per line):</Typography>
              <Typography variant="caption" fontFamily="monospace" color="text.secondary" display="block">
                Name, Quantity, Unit, Category, ExpiryDate (YYYY-MM-DD), Location
              </Typography>
              <Typography variant="caption" fontFamily="monospace" color="text.secondary" display="block" mt={0.5}>
                Example: Paracetamol 500mg, 100, pcs, Medications, 2026-12-31, Shelf A
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                Tip: Unit and Category are auto-guessed if omitted. You can also paste a plain list of medicine names.
              </Typography>
            </Box>
            <TextField multiline rows={10} fullWidth autoFocus
              label="Paste medicines here…" value={raw}
              onChange={e => setRaw(e.target.value)}
              slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }} />
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Name *', 'Qty', 'Unit', 'Category', 'Expiry', 'Location', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r._key}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <TextField size="small" fullWidth value={r.name} onChange={e => updateRow(r._key, 'name', e.target.value)} error={!r.name.trim()} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 80 }}>
                      <TextField size="small" type="number" value={r.quantity} onChange={e => updateRow(r._key, 'quantity', Number(e.target.value))} inputProps={{ min: 0, style: { width: 64 } }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      <TextField size="small" select SelectProps={{ native: true }} value={r.unit} onChange={e => updateRow(r._key, 'unit', e.target.value)}>
                        {SUPPLY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField size="small" select SelectProps={{ native: true }} value={r.category} onChange={e => updateRow(r._key, 'category', e.target.value)}>
                        <option value="">—</option>
                        {SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <TextField size="small" type="date" value={r.expiryDate || ''} onChange={e => updateRow(r._key, 'expiryDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField size="small" value={r.location || ''} onChange={e => updateRow(r._key, 'location', e.target.value)} placeholder="e.g. Shelf A" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeRow(r._key)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        {step === 'paste' ? (
          <>
            <Button variant="outlined" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleParse} disabled={!raw.trim()}>Parse →</Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={() => setStep('paste')}>← Back</Button>
            <Button variant="outlined" color="error" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleImport} disabled={importing || !rows.some(r => r.name.trim())}>
              {importing ? 'Adding…' : `Add ${rows.filter(r => r.name.trim()).length} Supplies`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Dispense Dialog ──────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function DispenseDialog({ supply, onClose, onDispense, fetchHistory }: {
  supply: MedicalSupply;
  onClose: () => void;
  onDispense: (supplyId: string, data: CreateDispenseRecordDTO) => Promise<DispenseRecord | null>;
  fetchHistory: (supplyId: string) => Promise<DispenseRecord[]>;
}) {
  const [tab, setTab] = useState<'dispense' | 'history'>('dispense');
  const [form, setForm] = useState<CreateDispenseRecordDTO>({
    recipientName: '', recipientRank: '', quantityDispensed: 1,
    dutyPersonnel: '', dispensedAt: TODAY, notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<DispenseRecord[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const loadHistory = async () => {
    setHistLoading(true);
    const records = await fetchHistory(supply.id);
    setHistory(records);
    setHistLoading(false);
  };

  const handleTabChange = async (t: 'dispense' | 'history') => {
    setTab(t);
    if (t === 'history' && history.length === 0) await loadHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName.trim()) { toast.error('Recipient name is required'); return; }
    if (!form.dutyPersonnel.trim()) { toast.error('Duty personnel name is required'); return; }
    if (form.quantityDispensed <= 0) { toast.error('Quantity must be at least 1'); return; }
    if (form.quantityDispensed > supply.quantity) { toast.error(`Only ${supply.quantity} ${supply.unit} in stock`); return; }
    setSaving(true);
    const result = await onDispense(supply.id, form);
    setSaving(false);
    if (result) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography fontWeight={700}>💉 Dispense Supply</Typography>
        <Typography variant="caption" color="text.secondary">{supply.name} — {supply.quantity} {supply.unit} available</Typography>
      </DialogTitle>
      <Box sx={{ px: 3, pt: 1, display: 'flex', gap: 1 }}>
        <Button size="small" variant={tab === 'dispense' ? 'contained' : 'outlined'} startIcon={<MedicalServicesIcon />} onClick={() => handleTabChange('dispense')}>Dispense</Button>
        <Button size="small" variant={tab === 'history' ? 'contained' : 'outlined'} startIcon={<HistoryIcon />} onClick={() => handleTabChange('history')}>History</Button>
      </Box>
      <Divider sx={{ mt: 1 }} />
      {tab === 'dispense' ? (
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField required fullWidth size="small" label="Recipient Name *" placeholder="e.g. Juan dela Cruz"
                  value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth size="small" label="Rank / Designation" placeholder="e.g. PO1"
                  value={form.recipientRank || ''} onChange={e => setForm({ ...form, recipientRank: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField required fullWidth size="small" type="number" label={`Quantity (max ${supply.quantity})`}
                  inputProps={{ min: 1, max: supply.quantity }}
                  value={form.quantityDispensed} onChange={e => setForm({ ...form, quantityDispensed: Number(e.target.value) })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField fullWidth size="small" type="date" label="Date Dispensed"
                  InputLabelProps={{ shrink: true }} value={form.dispensedAt}
                  onChange={e => setForm({ ...form, dispensedAt: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField required fullWidth size="small" label="Duty Personnel *" placeholder="Name of granting officer"
                  value={form.dutyPersonnel} onChange={e => setForm({ ...form, dutyPersonnel: e.target.value })} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth size="small" multiline rows={2} label="Notes" placeholder="e.g. complaint, diagnosis, remarks"
                  value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={saving || supply.quantity === 0}>
              {saving ? 'Saving…' : 'Record Dispense'}
            </Button>
          </DialogActions>
        </Box>
      ) : (
        <DialogContent sx={{ pt: 1 }}>
          {histLoading ? (
            <Box textAlign="center" py={3}><CircularProgress size={24} /></Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary" variant="body2" textAlign="center" py={3}>No dispense records found.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Date', 'Recipient', 'Qty', 'Duty Personnel', 'Notes'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(r => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="caption">{new Date(r.dispensedAt).toLocaleDateString('en-PH')}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>{r.recipientName}</Typography>
                      {r.recipientRank && <Typography variant="caption" color="text.secondary"> ({r.recipientRank})</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="caption">{r.quantityDispensed} {r.unit}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{r.dutyPersonnel}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{r.notes || '—'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

const stockStatus = (supply: MedicalSupply) => {
  if (supply.quantity === 0) return { label: 'Out of Stock', color: 'error' as const };
  if (supply.quantity <= supply.minimumStock) return { label: 'Low Stock', color: 'warning' as const };
  return { label: 'In Stock', color: 'success' as const };
};

const isExpiringSoon = (d?: string) => { if (!d) return false; const days = (new Date(d).getTime() - Date.now()) / 86400000; return days >= 0 && days <= 30; };
const isExpired = (d?: string) => { if (!d) return false; return new Date(d).getTime() < Date.now(); };

export const MedicalSuppliesPage = () => {
  const { user } = useAuth();
  const { supplies, loading, fetchSupplies, addSupply, updateSupply, deleteSupply, dispenseSupply, fetchDispenseHistory } = useMedicalSupplies();
  const [showForm, setShowForm] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [editingSupply, setEditingSupply] = useState<MedicalSupply | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dispensingSupply, setDispensingSupply] = useState<MedicalSupply | null>(null);
  const [form, setForm] = useState<CreateMedicalSupplyDTO>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

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

  const handleBulkImport = async (rows: CreateMedicalSupplyDTO[]) => {
    let added = 0;
    for (const row of rows) { try { await addSupply(row); added++; } catch {} }
    toast.success(`Added ${added} of ${rows.length} supplies`);
  };

  const filtered = supplies.filter((s) => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()) || (s.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || s.category === filterCategory;
    const matchesStatus = !filterStatus || (filterStatus === 'low' && s.quantity <= s.minimumStock && s.quantity > 0) || (filterStatus === 'out' && s.quantity === 0) || (filterStatus === 'expiring' && isExpiringSoon(s.expiryDate)) || (filterStatus === 'expired' && isExpired(s.expiryDate));
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
          {canWrite && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<ContentPasteIcon />} onClick={() => setShowPaste(true)}>Paste Import</Button>
              <Button variant="contained" onClick={openAdd}>+ Add Supply</Button>
            </Stack>
          )}
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

      <PasteImportDialog open={showPaste} onClose={() => setShowPaste(false)} onImport={handleBulkImport} />

      {dispensingSupply && (
        <DispenseDialog
          supply={dispensingSupply}
          onClose={() => setDispensingSupply(null)}
          onDispense={dispenseSupply}
          fetchHistory={fetchDispenseHistory}
        />
      )}

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
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
          <TextField size="small" select SelectProps={{ native: true }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {SUPPLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </TextField>
          <TextField size="small" select SelectProps={{ native: true }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
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
              {paginated.map(supply => {
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
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {canWrite && <Button size='small' variant="outlined" color="primary" startIcon={<MedicalServicesIcon />} onClick={() => setDispensingSupply(supply)} disabled={supply.quantity === 0}>Dispense</Button>}
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
                  {paginated.map(supply => {
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
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {canWrite && (
                                <Button size='small' variant="outlined" color="primary" startIcon={<MedicalServicesIcon fontSize="small" />}
                                  onClick={() => setDispensingSupply(supply)} disabled={supply.quantity === 0}>
                                  Dispense
                                </Button>
                              )}
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
            <Box sx={{ bgcolor: 'grey.50', px: 2, py: 1, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant='caption' color='text.secondary'>
                Showing <strong>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> supplies
              </Typography>
              {totalPages > 1 && (
                <Pagination count={totalPages} page={safePage} size="small" onChange={(_, v) => setPage(v)} />
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};