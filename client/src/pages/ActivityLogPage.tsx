import { useState } from 'react';
import { useActivityLog } from '../hooks/useActivityLog';
import { ActivityLog } from '../components/activity/ActivityLog';
import type { ActivityAction, ActivityResource } from '@shared/types/activity.types';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';

export const ActivityLogPage = () => {
  const { activityLogs, loading, fetchActivityLogs } = useActivityLog();
  const [actionFilter, setActionFilter] = useState<ActivityAction|''>('');
  const [resourceFilter, setResourceFilter] = useState<ActivityResource|''>('');

  const handleFilter = () => {
    const f: any = {};
    if (actionFilter) f.action = actionFilter;
    if (resourceFilter) f.resource = resourceFilter;
    fetchActivityLogs(f);
  };
  const handleReset = () => { setActionFilter(''); setResourceFilter(''); fetchActivityLogs(); };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p:3 }}>
        <Stack direction={{ xs:'column', sm:'row' }} justifyContent="space-between" alignItems={{ sm:'center' }} mb={3} gap={2}>
          <Typography variant="h5" fontWeight={700}>📝 Activity Log</Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchActivityLogs()}>Refresh</Button>
        </Stack>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth label="Filter by Action" size="small"
              value={actionFilter} onChange={e => setActionFilter(e.target.value as any)}>
              <MenuItem value="">All Actions</MenuItem>
              {['login','logout','create','update','delete','upload','view'].map(a =>
                <MenuItem key={a} value={a} sx={{ textTransform:'capitalize' }}>{a}</MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth label="Filter by Resource" size="small"
              value={resourceFilter} onChange={e => setResourceFilter(e.target.value as any)}>
              <MenuItem value="">All Resources</MenuItem>
              {[['auth','Authentication'],['personnel','Personnel'],['medical-result','Medical Results'],['user','User']].map(([v,l]) =>
                <MenuItem key={v} value={v}>{l}</MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="contained" onClick={handleFilter}>Apply</Button>
              <Button fullWidth variant="outlined" onClick={handleReset}>Reset</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      <ActivityLog logs={activityLogs} loading={loading} />
    </Stack>
  );
};