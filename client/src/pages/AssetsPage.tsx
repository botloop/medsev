/**
 * Asset & Resource Accountability Page
 * Track issued medical kits, vehicles, fleet cards, and petty cash responsibilities.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAssets } from '../hooks/useAssets';
import api from '../services/api';
import type { Asset, CreateAssetDTO, IssueAssetDTO, ReturnAssetDTO, AssetCategory, AssetStatus } from '@shared/types/assets.types';
import { ASSET_CATEGORIES, ASSET_STATUSES, ASSET_CONDITIONS, isPhysicalAsset } from '@shared/types/assets.types';
import type { Personnel } from '@shared/types/personnel.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AssetStatus, 'success'|'warning'|'default'|'error'|'info'> = {
  'Available':         'success',
  'Issued':            'warning',
  'Returned':          'default',
  'Lost':              'error',
  'Under Maintenance': 'info',
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'Medical Equipment':  '#1d4ed8',
  'Vehicle':            '#7c3aed',
  'Fleet Card':         '#0369a1',
  'Petty Cash / Funds': '#b45309',
};

const EMPTY_FORM: CreateAssetDTO = {
  name: '',
  category: 'Medical Equipment',
  referenceNumber: '',
  description: '',
  status: 'Available',
  condition: 'Good',
  amount: undefined,
  purpose: '',
};

const EMPTY_ISSUE: IssueAssetDTO = {
  issuedToId:   '',
  issuedToName: '',
  issuedDate:   new Date().toISOString().slice(0, 10),
  expectedReturn: '',
};

const EMPTY_RETURN: ReturnAssetDTO = {
  returnedDate: new Date().toISOString().slice(0, 10),
  condition:    'Good',
};

function today() { return new Date().toISOString().slice(0, 10); }
function isOverdue(asset: Asset): boolean {
  return asset.status === 'Issued' && !!asset.expectedReturn && asset.expectedReturn < today();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AssetsPage = () => {
  const { assets, loading, fetchAssets, addAsset, updateAsset, issueAsset, returnAsset, deleteAsset } = useAssets();

  // Filters
  const [search,         setSearch]         = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'All'>('All');

  // Dialogs
  const [formOpen,     setFormOpen]     = useState(false);
  const [issueOpen,    setIssueOpen]    = useState(false);
  const [returnOpen,   setReturnOpen]   = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  // Forms
  const [editing,      setEditing]      = useState<Asset | null>(null);
  const [form,         setForm]         = useState<CreateAssetDTO>(EMPTY_FORM);
  const [issueForm,    setIssueForm]    = useState<IssueAssetDTO>(EMPTY_ISSUE);
  const [returnForm,   setReturnForm]   = useState<ReturnAssetDTO>(EMPTY_RETURN);
  const [targetAsset,  setTargetAsset]  = useState<Asset | null>(null);

  // Personnel list for issue dialog
  const [personnel,    setPersonnel]    = useState<Personnel[]>([]);
  const [loadingPax,   setLoadingPax]   = useState(false);

  const [saving,       setSaving]       = useState(false);

  useEffect(() => { fetchAssets(); }, []);

  // ── Stats ──
  const totalAssets  = assets.length;
  const issued       = assets.filter(a => a.status === 'Issued').length;
  const overdue      = assets.filter(isOverdue).length;
  const totalFunds   = assets
    .filter(a => a.category === 'Petty Cash / Funds' && a.amount)
    .reduce((s, a) => s + (a.amount ?? 0), 0);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      if (filterCategory !== 'All' && a.category !== filterCategory) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.referenceNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, search, filterCategory]);

  // ── Helpers ──
  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({
      name:            a.name,
      category:        a.category,
      referenceNumber: a.referenceNumber,
      description:     a.description ?? '',
      status:          a.status ?? 'Available',
      condition:       a.condition ?? 'Good',
      amount:          a.amount,
      purpose:         a.purpose ?? '',
    });
    setFormOpen(true);
  };

  const openIssue = async (a: Asset) => {
    setTargetAsset(a);
    setIssueForm({ ...EMPTY_ISSUE, issuedDate: today() });
    setIssueOpen(true);
    if (personnel.length === 0) {
      setLoadingPax(true);
      try {
        const res: any = await api.get('/personnel?limit=200');
        setPersonnel(res.data ?? res ?? []);
      } catch { /* ignore */ }
      finally { setLoadingPax(false); }
    }
  };

  const openReturn = (a: Asset) => {
    setTargetAsset(a);
    setReturnForm({ returnedDate: today(), condition: a.condition ?? 'Good' });
    setReturnOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!form.name.trim() || !form.referenceNumber.trim()) return;
    setSaving(true);
    const payload = { ...form };
    // Strip physical fields from funds and vice versa
    if (payload.category === 'Petty Cash / Funds') {
      delete payload.status;
      delete payload.condition;
    } else {
      delete payload.amount;
      delete payload.purpose;
    }
    const ok = editing
      ? await updateAsset(editing.id, payload)
      : await addAsset(payload);
    setSaving(false);
    if (ok) setFormOpen(false);
  };

  const handleIssue = async () => {
    if (!targetAsset || !issueForm.issuedToId) return;
    setSaving(true);
    const ok = await issueAsset(targetAsset.id, issueForm);
    setSaving(false);
    if (ok) setIssueOpen(false);
  };

  const handleReturn = async () => {
    if (!targetAsset) return;
    setSaving(true);
    const ok = await returnAsset(targetAsset.id, returnForm);
    setSaving(false);
    if (ok) setReturnOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteAsset(id);
    setDeletingId(null);
  };

  // ── Render ──
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>

      {/* ── Header ── */}
      <Paper elevation={0} sx={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', color: '#fff', px: 3, py: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>Asset & Resource Accountability</Typography>
          <Typography variant="caption" sx={{ opacity: .8 }}>Track equipment, vehicles, fleet cards, and fund assignments</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.8)' }} onClick={fetchAssets}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', fontWeight: 600 }}>
            Add Asset
          </Button>
        </Box>
      </Paper>

      {/* ── Stats cards ── */}
      <Grid container spacing={1.5}>
        {[
          { label: 'Total Assets',     value: totalAssets,                       color: '#1d4ed8' },
          { label: 'Currently Issued', value: issued,                             color: '#d97706' },
          { label: 'Overdue Returns',  value: overdue,                            color: '#dc2626' },
          { label: 'Total Funds',      value: `₱${totalFunds.toLocaleString()}`, color: '#b45309' },
        ].map(c => (
          <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
            <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">{c.label}</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: c.color, lineHeight: 1.3 }}>{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Filter bar ── */}
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder="Search name or ref #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        {(['All', ...ASSET_CATEGORIES] as const).map(cat => (
          <Chip
            key={cat}
            label={cat}
            size="small"
            onClick={() => setFilterCategory(cat as any)}
            color={filterCategory === cat ? 'primary' : 'default'}
            variant={filterCategory === cat ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', fontWeight: filterCategory === cat ? 700 : 400 }}
          />
        ))}
      </Box>

      {/* ── Table ── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Paper variant="outlined" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['#', 'Name', 'Category', 'Reference #', 'Assigned To / Info', 'Status', 'Issue Date', 'Expected Return', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: 12, py: 0.75, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                      No assets found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((asset, i) => {
                  const overdueBg = isOverdue(asset);
                  const isFund    = asset.category === 'Petty Cash / Funds';
                  const isConfirmDelete = deletingId === asset.id;

                  return (
                    <TableRow key={asset.id}
                      sx={{
                        bgcolor: overdueBg ? '#fef2f2' : i % 2 === 0 ? 'white' : 'grey.50',
                        '&:hover': { bgcolor: overdueBg ? '#fee2e2' : 'action.hover' },
                      }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 11, py: 0.5 }}>{i + 1}</TableCell>

                      {/* Name + description */}
                      <TableCell sx={{ py: 0.5, maxWidth: 180 }}>
                        <Typography variant="body2" fontWeight={600} fontSize={12} lineHeight={1.3} noWrap>{asset.name}</Typography>
                        {asset.description && (
                          <Typography variant="caption" color="text.secondary" fontSize={10} noWrap display="block">{asset.description}</Typography>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ py: 0.5 }}>
                        <Chip size="small" label={asset.category}
                          sx={{ fontSize: 10, height: 20, bgcolor: CATEGORY_COLORS[asset.category] + '18', color: CATEGORY_COLORS[asset.category], fontWeight: 600, border: `1px solid ${CATEGORY_COLORS[asset.category]}40` }} />
                      </TableCell>

                      {/* Reference # */}
                      <TableCell sx={{ py: 0.5, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {asset.referenceNumber}
                      </TableCell>

                      {/* Assigned to / Info */}
                      <TableCell sx={{ py: 0.5, maxWidth: 160 }}>
                        {isFund ? (
                          <Box>
                            {asset.amount != null && (
                              <Typography variant="body2" fontWeight={700} fontSize={12} color="warning.dark">₱{asset.amount.toLocaleString()}</Typography>
                            )}
                            {asset.purpose && (
                              <Typography variant="caption" color="text.secondary" fontSize={10} noWrap display="block">{asset.purpose}</Typography>
                            )}
                          </Box>
                        ) : asset.issuedToName ? (
                          <Typography variant="caption" fontSize={11} noWrap display="block">{asset.issuedToName}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontSize={10}>—</Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 0.5 }}>
                        {isFund ? (
                          <Typography variant="caption" color="text.disabled" fontSize={10}>—</Typography>
                        ) : (
                          <Chip size="small"
                            label={asset.status ?? '—'}
                            color={asset.status ? STATUS_COLORS[asset.status] : 'default'}
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        )}
                      </TableCell>

                      {/* Issue date */}
                      <TableCell sx={{ py: 0.5, fontSize: 11, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        {asset.issuedDate ?? '—'}
                      </TableCell>

                      {/* Expected return */}
                      <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                        {asset.expectedReturn ? (
                          <Typography variant="caption" fontSize={11}
                            sx={{ color: overdueBg ? 'error.main' : 'text.secondary', fontWeight: overdueBg ? 700 : 400 }}>
                            {asset.expectedReturn}
                            {overdueBg && ' ⚠️'}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontSize={10}>—</Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                        {isConfirmDelete ? (
                          <Box display="flex" gap={0.5} alignItems="center">
                            <Typography variant="caption" color="error.main" fontWeight={600} fontSize={11}>Delete?</Typography>
                            <Button size="small" color="error" variant="contained" sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }} onClick={() => handleDelete(asset.id)}>Yes</Button>
                            <Button size="small" sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }} onClick={() => setDeletingId(null)}>No</Button>
                          </Box>
                        ) : (
                          <Box display="flex" gap={0.25}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(asset)}><EditIcon sx={{ fontSize: 15 }} /></IconButton>
                            </Tooltip>
                            {!isFund && asset.status !== 'Issued' && (
                              <Tooltip title="Issue">
                                <IconButton size="small" color="warning" onClick={() => openIssue(asset)}><SendIcon sx={{ fontSize: 15 }} /></IconButton>
                              </Tooltip>
                            )}
                            {!isFund && asset.status === 'Issued' && (
                              <Tooltip title="Mark as Returned">
                                <IconButton size="small" color="success" onClick={() => openReturn(asset)}><AssignmentReturnIcon sx={{ fontSize: 15 }} /></IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeletingId(asset.id)}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box px={2} py={0.75} display="flex" alignItems="center" justifyContent="space-between" borderTop="1px solid" borderColor="divider" bgcolor="grey.50">
            <Typography variant="caption" color="text.secondary">{filtered.length} of {assets.length} assets</Typography>
            {overdue > 0 && (
              <Typography variant="caption" color="error.main" fontWeight={700}>⚠️ {overdue} overdue return{overdue > 1 ? 's' : ''}</Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" fontWeight={700}>{editing ? 'Edit Asset' : 'Add Asset'}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={0.5}>
            <TextField
              label="Asset Name *" size="small" fullWidth
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Category *</InputLabel>
              <Select label="Category *" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value as AssetCategory, status: 'Available', amount: undefined }))}>
                {ASSET_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Reference / Serial / Plate / Card # *" size="small" fullWidth
              value={form.referenceNumber} onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
            />
            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            {isPhysicalAsset(form.category) ? (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status ?? 'Available'}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value as AssetStatus }))}>
                    {ASSET_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select label="Condition" value={form.condition ?? 'Good'}
                    onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                    {ASSET_CONDITIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <TextField
                  label="Amount (₱)" size="small" fullWidth type="number"
                  value={form.amount ?? ''}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value ? Number(e.target.value) : undefined }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }}
                />
                <TextField
                  label="Purpose" size="small" fullWidth
                  value={form.purpose ?? ''} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAsset} disabled={saving || !form.name.trim() || !form.referenceNumber.trim()}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Issue Dialog ── */}
      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" fontWeight={700}>Issue Asset</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Issuing: <strong>{targetAsset?.name}</strong> ({targetAsset?.referenceNumber})
            </Typography>
            {loadingPax ? (
              <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
            ) : (
              <Autocomplete
                options={personnel}
                getOptionLabel={p => `${p.rank} ${p.lastName}, ${p.firstName} (SN: ${p.serialNumber})`}
                onChange={(_, p) => {
                  if (p) setIssueForm(prev => ({
                    ...prev,
                    issuedToId:   p.id,
                    issuedToName: `${p.rank} ${p.lastName}, ${p.firstName}`,
                  }));
                }}
                renderInput={params => <TextField {...params} label="Issue To (Personnel) *" size="small" />}
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />
            )}
            <TextField
              label="Issue Date *" size="small" fullWidth type="date"
              value={issueForm.issuedDate}
              onChange={e => setIssueForm(p => ({ ...p, issuedDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Expected Return Date" size="small" fullWidth type="date"
              value={issueForm.expectedReturn ?? ''}
              onChange={e => setIssueForm(p => ({ ...p, expectedReturn: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setIssueOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleIssue}
            disabled={saving || !issueForm.issuedToId || !issueForm.issuedDate}>
            {saving ? 'Issuing…' : 'Issue Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Return Dialog ── */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" fontWeight={700}>Mark as Returned</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Returning: <strong>{targetAsset?.name}</strong> from <strong>{targetAsset?.issuedToName}</strong>
            </Typography>
            <TextField
              label="Return Date *" size="small" fullWidth type="date"
              value={returnForm.returnedDate}
              onChange={e => setReturnForm(p => ({ ...p, returnedDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Condition on Return *</InputLabel>
              <Select label="Condition on Return *" value={returnForm.condition}
                onChange={e => setReturnForm(p => ({ ...p, condition: e.target.value }))}>
                {ASSET_CONDITIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setReturnOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleReturn}
            disabled={saving || !returnForm.returnedDate || !returnForm.condition}>
            {saving ? 'Saving…' : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
