import { useEffect, useState } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { ACTIVITY_TYPES } from '@shared/types/calendar.types';
import type { CalendarActivity, CreateCalendarActivityDTO, ActivityType } from '@shared/types/calendar.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Medical Exam': { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  'Training':     { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  'Meeting':      { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
  'Inspection':   { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
  'Deployment':   { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  'Event':        { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' },
  'Holiday':      { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  'Other':        { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' },
};

const TYPE_DOT: Record<string, string> = {
  'Medical Exam': '#3b82f6', 'Training': '#22c55e', 'Meeting': '#a855f7',
  'Inspection': '#f97316', 'Deployment': '#ef4444', 'Event': '#ec4899',
  'Holiday': '#eab308', 'Other': '#6b7280',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const emptyForm = (): CreateCalendarActivityDTO => ({
  title: '', description: '', type: 'Meeting',
  date: new Date().toISOString().slice(0, 10), endDate: '', time: '', location: '',
});

export const CalendarPage = () => {
  const { activities, loading, fetchActivities, addActivity, updateActivity, deleteActivity } = useCalendar();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CalendarActivity | null>(null);
  const [form, setForm] = useState<CreateCalendarActivityDTO>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<CalendarActivity | null>(null);

  useEffect(() => { fetchActivities(); }, []);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const activitiesByDate = activities.reduce<Record<string, CalendarActivity[]>>((acc, act) => {
    if (!acc[act.date]) acc[act.date] = [];
    acc[act.date].push(act); return acc;
  }, {});
  const todayStr = today.toISOString().slice(0, 10);
  const getDateStr = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const openAddForm = (date?: string) => {
    setEditingActivity(null); setForm({ ...emptyForm(), date: date || new Date().toISOString().slice(0, 10) }); setShowForm(true); setSelectedActivity(null);
  };
  const openEditForm = (activity: CalendarActivity) => {
    setEditingActivity(activity); setForm({ title: activity.title, description: activity.description || '', type: activity.type, date: activity.date, endDate: activity.endDate || '', time: activity.time || '', location: activity.location || '' }); setShowForm(true); setSelectedActivity(null);
  };
  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true); const payload = { ...form, endDate: form.endDate || undefined, time: form.time || undefined, location: form.location || undefined, description: form.description || undefined };
    if (editingActivity) { await updateActivity(editingActivity.id, payload); } else { await addActivity(payload); }
    setSaving(false); setShowForm(false); setEditingActivity(null);
  };
  const handleDelete = async (id: string) => { await deleteActivity(id); setConfirmDeleteId(null); setSelectedActivity(null); };
  const upcoming = activities.filter(a => a.date >= todayStr).slice(0, 10);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" fontWeight={700}>Calendar of Activities</Typography>
          <Typography variant='caption' color='text.secondary'>Schedule and manage official activities</Typography>
        </Box>
        <Button variant='contained' startIcon={<AddIcon />} onClick={() => openAddForm()}>Add Activity</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: '#1e293b', color: 'white' }}>
              <IconButton onClick={prevMonth} size="small" sx={{ color: 'white' }}><ChevronLeftIcon /></IconButton>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>{MONTH_NAMES[viewMonth]} {viewYear}</Typography>
                <Button size='small' variant='contained' color='primary' onClick={goToday} sx={{ py: 0.25, minHeight: 0, fontSize: '0.7rem' }}>Today</Button>
              </Box>
              <IconButton onClick={nextMonth} size="small" sx={{ color: 'white' }}><ChevronRightIcon /></IconButton>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
              {DAYS_OF_WEEK.map(d => (
                <Box key={d} sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant='caption' fontWeight={700} color='text.secondary' textTransform='uppercase'>{d}</Typography>
                </Box>
              ))}
            </Box>
            {loading ? (
              <Box display='flex' justifyContent='center' alignItems='center' height={200}><CircularProgress /></Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <Box key={`empty-${i}`} sx={{ minHeight: { xs: 52, sm: 80 }, borderBottom: 1, borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = getDateStr(day);
                  const dayActivities = activitiesByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <Box key={day} onClick={() => { setSelectedDate(dateStr); setSelectedActivity(null); }} sx={{
                      minHeight: { xs: 52, sm: 80 }, borderBottom: 1, borderRight: 1, borderColor: 'divider',
                      p: 0.5, cursor: 'pointer', bgcolor: isSelected ? '#eff6ff' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? '#eff6ff' : 'grey.50' }, transition: 'background-color 0.15s'
                    }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                        <Box sx={{
                          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: isToday ? 'primary.main' : 'transparent', color: isToday ? 'white' : 'text.primary'
                        }}>
                          <Typography variant='caption' fontWeight={700}>{day}</Typography>
                        </Box>
                        {dayActivities.length > 0 && (
                          <IconButton size="small" sx={{ p: 0.25, color: 'grey.400', '&:hover': { color: 'primary.main' } }}
                            onClick={(e) => { e.stopPropagation(); openAddForm(dateStr); }}>
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {dayActivities.slice(0, 2).map(act => {
                          const tc = TYPE_COLORS[act.type] || TYPE_COLORS.Other;
                          return (
                            <Box key={act.id} onClick={(e) => { e.stopPropagation(); setSelectedActivity(act); setSelectedDate(dateStr); }}
                              sx={{ bgcolor: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, borderRadius: 0.5,
                                px: 0.5, py: 0.125, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                              {act.time && <span style={{ marginRight: 2 }}>{act.time}</span>}{act.title}
                            </Box>
                          );
                        })}
                        {dayActivities.length > 2 && <Typography variant="caption" color="text.disabled" sx={{ px: 0.5, fontSize: '0.6rem' }}>+{dayActivities.length - 2} more</Typography>}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {selectedDate && (
              <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, bgcolor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant='body2' fontWeight={700}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Typography>
                  <Button size='small' variant='contained' color='primary' onClick={() => openAddForm(selectedDate)} sx={{ py: 0.25, fontSize: '0.7rem' }}>+ Add</Button>
                </Box>
                <Box p={1.5}>
                  {(activitiesByDate[selectedDate] || []).length === 0 ? (
                    <Typography variant='body2' color='text.disabled' textAlign='center' py={2}>No activities scheduled</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(activitiesByDate[selectedDate] || []).map(act => {
                        const tc = TYPE_COLORS[act.type] || TYPE_COLORS.Other;
                        return (
                          <Box key={act.id} onClick={() => setSelectedActivity(act)} sx={{
                            p: 1, borderRadius: 1, border: `1px solid ${tc.border}`, bgcolor: tc.bg, cursor: 'pointer'
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box flex={1} minWidth={0}>
                                <Typography variant='caption' fontWeight={700} color={tc.color} noWrap>{act.title}</Typography>
                                {act.time && <Typography variant='caption' color='text.secondary' display='block'>🕐 {act.time}</Typography>}
                                {act.location && <Typography variant='caption' color='text.secondary' display='block'>📍 {act.location}</Typography>}
                              </Box>
                              <Typography variant='caption' color={tc.color} sx={{ opacity: 0.7, fontSize: '0.6rem', fontWeight: 700 }}>{act.type}</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            {selectedActivity && (
              <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, bgcolor: '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant='body2' fontWeight={700} noWrap>{selectedActivity.title}</Typography>
                  <IconButton size="small" sx={{ color: 'grey.300' }} onClick={() => setSelectedActivity(null)}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Box p={2}>
                  {(() => { const tc = TYPE_COLORS[selectedActivity.type] || TYPE_COLORS.Other; return (
                    <Chip label={selectedActivity.type} size="small" sx={{ bgcolor: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, mb: 1.5, fontWeight: 700 }} />
                  ); })()}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant='caption' color='text.secondary'>
                      <strong>Date:</strong> {new Date(selectedActivity.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    {selectedActivity.endDate && <Typography variant='caption' color='text.secondary'><strong>End:</strong> {new Date(selectedActivity.endDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>}
                    {selectedActivity.time && <Typography variant='caption' color='text.secondary'><strong>Time:</strong> {selectedActivity.time}</Typography>}
                    {selectedActivity.location && <Typography variant='caption' color='text.secondary'><strong>Location:</strong> {selectedActivity.location}</Typography>}
                    {selectedActivity.description && <Typography variant='caption' color='text.secondary'><strong>Notes:</strong> {selectedActivity.description}</Typography>}
                    <Typography variant='caption' color='text.disabled'>Added by {selectedActivity.createdBy}</Typography>
                  </Box>
                  <Box display="flex" gap={1} mt={2}>
                    <Button fullWidth size='small' variant='contained' onClick={() => openEditForm(selectedActivity)}>Edit</Button>
                    <Button fullWidth size='small' variant='outlined' color='error' onClick={() => setConfirmDeleteId(selectedActivity.id)}>Delete</Button>
                  </Box>
                </Box>
              </Paper>
            )}

            <Paper sx={{ overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#1e293b', color: 'white' }}>
                <Typography variant='body2' fontWeight={700}>Upcoming Activities</Typography>
              </Box>
              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {upcoming.length === 0 ? (
                  <Typography variant='body2' color='text.disabled' textAlign='center' py={3}>No upcoming activities</Typography>
                ) : upcoming.map(act => (
                  <Box key={act.id} onClick={() => {
                    setSelectedDate(act.date); setSelectedActivity(act);
                    const d = new Date(act.date + 'T00:00:00'); setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
                  }} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' } }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', mt: 0.75, flexShrink: 0, bgcolor: TYPE_DOT[act.type] || '#6b7280' }} />
                    <Box flex={1} minWidth={0}>
                      <Typography variant='caption' fontWeight={700} display='block' noWrap>{act.title}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(act.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {act.time && ` · ${act.time}`}
                      </Typography>
                      {act.location && <Typography variant='caption' color='text.disabled' display='block' noWrap>📍 {act.location}</Typography>}
                    </Box>
                    {(() => { const tc = TYPE_COLORS[act.type] || TYPE_COLORS.Other; return (
                      <Chip label={act.type} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontSize: '0.55rem', height: 18, flexShrink: 0 }} />
                    ); })()}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingActivity ? 'Edit Activity' : 'Add Activity'}
          <IconButton size="small" onClick={() => setShowForm(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField required fullWidth size='small' label='Title *' placeholder='Activity title'
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Grid container spacing={1.5}>
              <Grid size={6}><TextField fullWidth size='small' label='Type *' select SelectProps={{ native: true }}
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ActivityType }))}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField></Grid>
              <Grid size={6}><TextField fullWidth size='small' type='time' label='Time'
                InputLabelProps={{ shrink: true }} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></Grid>
              <Grid size={6}><TextField required fullWidth size='small' type='date' label='Date *'
                InputLabelProps={{ shrink: true }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Grid>
              <Grid size={6}><TextField fullWidth size='small' type='date' label='End Date'
                InputLabelProps={{ shrink: true }} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></Grid>
            </Grid>
            <TextField fullWidth size='small' label='Location' placeholder='e.g. Medical Office'
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <TextField fullWidth size='small' multiline rows={2} label='Description / Notes' placeholder='Additional details...'
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button variant='outlined' onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !form.title.trim() || !form.date}>
            {saving ? 'Saving...' : editingActivity ? 'Save Changes' : 'Add Activity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Activity?</DialogTitle>
        <DialogContent><Typography variant='body2' color='text.secondary'>This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button variant='outlined' onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button variant='contained' color='error' onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};