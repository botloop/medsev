import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { ActivityLog as ActivityLogType } from '@shared/types/activity.types';

const ACTION_COLOR: Record<string,any> = {
  login:'success', logout:'default', create:'primary', update:'warning', delete:'error', upload:'secondary',
};
const ACTION_ICON: Record<string,string> = {
  login:'🔓', logout:'🔒', create:'➕', update:'✏️', delete:'🗑️', upload:'📤', view:'👁️',
};

const relativeTime = (ts: Date|string) => {
  const s = Math.floor((Date.now() - new Date(ts).getTime())/1000);
  if (s<60) return 'Just now';
  if (s<3600) return Math.floor(s/60)+'m ago';
  if (s<86400) return Math.floor(s/3600)+'h ago';
  return new Date(ts).toLocaleString();
};

export const ActivityLog = ({ logs, loading }: { logs:ActivityLogType[]; loading:boolean }) => {
  if (loading) return (
    <Paper sx={{ p:6, textAlign:'center' }}>
      <CircularProgress size={40} />
      <Typography color="text.secondary" mt={2}>Loading activity logs...</Typography>
    </Paper>
  );
  if (!logs.length) return (
    <Paper sx={{ p:6, textAlign:'center' }}>
      <Typography fontSize={48}>📝</Typography>
      <Typography variant="h6" mt={1}>No Activity Yet</Typography>
      <Typography color="text.secondary">System activity will appear here</Typography>
    </Paper>
  );
  return (
    <Paper>
      <Box sx={{ px:3, py:2, borderBottom:'1px solid', borderColor:'divider' }}>
        <Typography variant="h6" fontWeight={700}>
          📜 Activity Log <Typography component="span" variant="body2" color="text.secondary">({logs.length} entries)</Typography>
        </Typography>
      </Box>
      <Box sx={{ divide:'y' }}>
        {logs.map(log => (
          <Box key={log.id} sx={{ p:2, borderBottom:'1px solid', borderColor:'divider', '&:hover':{ bgcolor:'grey.50' }, display:'flex', gap:2, alignItems:'flex-start' }}>
            <Avatar sx={{ width:36, height:36, fontSize:16, bgcolor:'transparent', border:'1px solid', borderColor:'divider' }}>
              {ACTION_ICON[log.action]||'📝'}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600}>{log.description}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {log.userName}{log.userEmail && ' ('+log.userEmail+')'}
                  </Typography>
                </Box>
                <Chip label={log.action.toUpperCase()} size="small" color={ACTION_COLOR[log.action]||'default'} />
              </Stack>
              <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>{relativeTime(log.timestamp)}</Typography>
              {log.metadata && Object.keys(log.metadata).length>0 && (
                <Box sx={{ mt:0.5, bgcolor:'grey.50', borderRadius:1, px:1, py:0.5, fontSize:11, color:'text.secondary' }}>
                  {Object.entries(log.metadata).map(([k,v]) => (
                    <span key={k} style={{ marginRight:12 }}><strong>{k}:</strong> {typeof v==='object'?JSON.stringify(v):String(v)}</span>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};