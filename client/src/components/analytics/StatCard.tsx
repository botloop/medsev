import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const COLORS: Record<string,string> = {
  blue:'#3b82f6', green:'#22c55e', purple:'#a855f7', orange:'#f97316',
};

interface StatCardProps { title:string; value:number; icon:string; color:'blue'|'green'|'purple'|'orange'; }

export const StatCard = ({ title, value, icon, color }:StatCardProps) => (
  <Card sx={{ bgcolor:COLORS[color], color:'white', transition:'transform .2s', '&:hover':{ transform:'translateY(-2px)' } }}>
    <CardContent sx={{ pb:'12px !important' }}>
      <Typography fontSize={22} lineHeight={1.2}>{icon}</Typography>
      <Typography variant="caption" sx={{ opacity:.85, display:'block', mt:0.5 }}>{title}</Typography>
      <Typography variant="h5" fontWeight={700}>{value.toLocaleString()}</Typography>
    </CardContent>
  </Card>
);