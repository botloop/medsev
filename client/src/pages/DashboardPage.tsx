import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { PersonnelPage } from './PersonnelPage';
import { AnalyticsPage } from './AnalyticsPage';
import { ActivityLogPage } from './ActivityLogPage';
import ChatPage from './ChatPage';
import { AboutPage } from './AboutPage';
import { MedicalSuppliesPage } from './MedicalSuppliesPage';
import { CalendarPage } from './CalendarPage';
import { SitrepPage } from './SitrepPage';
import { DeploymentReadinessPage } from './DeploymentReadinessPage';
import { AssetsPage } from './AssetsPage';
import { UsersPage } from './UsersPage';
import { RecycleBinPage } from './RecycleBinPage';
import { MedicalEvalReportPage } from './MedicalEvalReportPage';
import { MedEvalSummaryReportPage } from './MedEvalSummaryReportPage';
import { NewUserProfilePage } from './NewUserProfilePage';
import { EditProfilePage } from './EditProfilePage';
import { PCRPage } from './PCRPage';
import { MRRReportPage } from './MRRReportPage';
import api from '../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import SummarizeIcon from '@mui/icons-material/Summarize';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import InventoryIcon from '@mui/icons-material/Inventory';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const DRAWER_WIDTH = 240;
const APP_VERSION = 'V 1.0.0';
type TabId = 'overview'|'personnel'|'activity'|'messages'|'supplies'|'calendar'|'sitrep'|'readiness'|'assets'|'users'|'recycle-bin'|'med-eval-report'|'med-eval-summary'|'about'|'edit-profile'|'pcr'|'mrr-report';

export const DashboardPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const defaultTab: TabId = user?.role === 'viewer' ? 'messages' : 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [updating, setUpdating] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<null|HTMLElement>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { unreadMessages, messagePreviews, recentActivity, pendingReviews, pendingReviewList, myProfileRequest, refetch: refetchNotifs } = useNotifications();
  const profileNotif = myProfileRequest?.status === 'pending' || myProfileRequest?.status === 'rejected' ? 1 : 0;
  const totalNotifs = unreadMessages + pendingReviews + profileNotif;
  const [openGroups, setOpenGroups] = useState<Record<string,boolean>>({ Admin: true, Operations: true, Logistics: true, 'Other Tools': true });
  const toggleGroup = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

  // New users who haven't completed profile setup see the setup screen only
  if (user?.profileCompleted === false) return <NewUserProfilePage />;

  const handleLogout = async () => {
    setLogoutConfirmOpen(false);
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim() || newDisplayName.trim() === user?.displayName) { setShowEditName(false); return; }
    setUpdating(true);
    try {
      await api.patch('/auth/profile', { displayName: newDisplayName.trim() });
      toast.success('Display name updated!');
      setShowEditName(false);
      await refreshUser();
    } catch { toast.error('Failed to update display name'); }
    finally { setUpdating(false); }
  };

  type NavItem = { id: string; label: string; icon: React.ReactNode; viewerHide: boolean; adminOnly: boolean };
  const navGroups: { label?: string; items: NavItem[] }[] = [
    { items: [
      { id:'overview',      label:'Patient Management', icon:<DashboardIcon />,     viewerHide:true,  adminOnly:false },
      { id:'edit-profile',  label:'Dashboard',     icon:<AccountCircleIcon />, viewerHide:false, adminOnly:false },
    ]},
    { label:'Admin', items: [
      { id:'personnel',        label:'Personnel',        icon:<PeopleIcon />,          viewerHide:true,  adminOnly:false },
      { id:'med-eval-report',  label:'Med Eval Report',  icon:<MedicalServicesIcon />, viewerHide:true,  adminOnly:false },
      { id:'med-eval-summary', label:'Med Eval Summary', icon:<AssignmentIcon />,      viewerHide:true,  adminOnly:false },
      { id:'readiness',        label:'Readiness',        icon:<HealthAndSafetyIcon />, viewerHide:true,  adminOnly:false },
      { id:'pcr',              label:'PCR / Emergency',  icon:<LocalHospitalIcon />,   viewerHide:true,  adminOnly:false },
      { id:'mrr-report',       label:'MRR Report',       icon:<ArticleIcon />,          viewerHide:true,  adminOnly:false },
    ]},
    { label:'Operations', items: [
      { id:'calendar', label:'Calendar', icon:<CalendarMonthIcon />, viewerHide:true, adminOnly:true },
    ]},
    { label:'Logistics', items: [
      { id:'supplies', label:'Med Supplies', icon:<MedicalServicesIcon />, viewerHide:true, adminOnly:false },
      { id:'assets',   label:'Assets',       icon:<InventoryIcon />,       viewerHide:true, adminOnly:true  },
    ]},
    { label:'Other Tools', items: [
      { id:'sitrep',      label:'Sitrep',       icon:<SummarizeIcon />,     viewerHide:true, adminOnly:false },
      { id:'activity',    label:'Activity Log', icon:<ArticleIcon />,        viewerHide:true, adminOnly:false },
      { id:'users',       label:'Users',        icon:<ManageAccountsIcon />, viewerHide:true, adminOnly:true  },
      { id:'recycle-bin', label:'Recycle Bin',  icon:<DeleteSweepIcon />,    viewerHide:true, adminOnly:true  },
    ]},
    { items: [
      { id:'messages', label:'Messages', icon:<ChatIcon />, viewerHide:false, adminOnly:false },
      { id:'about',    label:'About',    icon:<InfoIcon />, viewerHide:false, adminOnly:false },
    ]},
  ];
  const isVisible = (i: NavItem) => {
    if (i.adminOnly && user?.role !== 'admin') return false;
    if (i.viewerHide && user?.role === 'viewer') return false;
    if (i.id === 'edit-profile' && user?.role !== 'viewer') return false;
    return true;
  };

  const drawerContent = (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%', bgcolor:'#1e293b', color:'white', overflow:'hidden' }}>
      {/* Logo */}
      <Box sx={{ p:2.5, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box component="img" src="/logo.png" alt="PCG Medical Logo"
            sx={{ width:44, height:44, borderRadius:'50%', flexShrink:0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>PCG Medical</Typography>
            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.5)' }}>Eastern Visayas</Typography>
          </Box>
        </Stack>
      </Box>

      {/* User profile section */}
      <Box sx={{ px:2, py:2, borderBottom:'1px solid rgba(255,255,255,0.1)', bgcolor:'rgba(0,0,0,0.15)' }}>
        {!showEditName ? (
          <>
            <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', mb:1.5 }}>
              {user?.photoURL
                ? <Avatar src={user.photoURL} sx={{ width:60, height:60, mb:1, border:'3px solid rgba(255,255,255,0.2)' }} />
                : <Avatar sx={{ width:60, height:60, mb:1, bgcolor:'primary.main', fontSize:22, fontWeight:700, border:'3px solid rgba(255,255,255,0.2)' }}>
                    {user?.displayName?.charAt(0)}
                  </Avatar>}
              <Typography variant="body2" fontWeight={700} textAlign="center" noWrap sx={{ width:'100%', px:0.5 }}>
                {user?.displayName}
              </Typography>
              <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.5)', textAlign:'center', display:'block' }} noWrap>
                {user?.email}
              </Typography>
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.5 }}>
              <Chip label={user?.role} size="small"
                sx={{ bgcolor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', height:20, fontSize:10,
                  textTransform:'capitalize', '& .MuiChip-label':{ px:1 } }} />
              <Tooltip title="Edit display name">
                <IconButton size="small" sx={{ color:'rgba(255,255,255,0.4)', '&:hover':{ color:'white' }, p:0.25 }}
                  onClick={() => { setNewDisplayName(user?.displayName||''); setShowEditName(true); }}>
                  <EditIcon sx={{ fontSize:14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <Box>
            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.5)' }}>Display Name</Typography>
            <Stack direction="row" spacing={0.5} mt={0.5}>
              <TextField size="small" value={newDisplayName} autoFocus disabled={updating} inputProps={{ maxLength:50 }}
                onChange={e => setNewDisplayName(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') handleUpdateDisplayName(); if(e.key==='Escape') setShowEditName(false); }}
                sx={{ flex:1,
                  '& .MuiOutlinedInput-root':{ bgcolor:'rgba(255,255,255,0.1)', '& fieldset':{ borderColor:'rgba(255,255,255,0.3)' } },
                  '& input':{ color:'white', py:0.75, fontSize:13 } }} />
              <Button size="small" variant="contained" disabled={updating||!newDisplayName.trim()}
                onClick={handleUpdateDisplayName} sx={{ minWidth:36, px:1 }}>OK</Button>
              <Button size="small" variant="outlined" disabled={updating} onClick={() => setShowEditName(false)}
                sx={{ minWidth:32, px:1, color:'rgba(255,255,255,0.6)', borderColor:'rgba(255,255,255,0.3)' }}>X</Button>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Nav items */}
      <List sx={{ flex:1, py:1.5, overflowY:'auto', minHeight:0 }}>
        {navGroups.map((group, gIdx) => {
          const visible = group.items.filter(isVisible);
          if (visible.length === 0) return null;
          const isOpen = group.label ? (openGroups[group.label] ?? true) : true;
          return (
            <Box key={gIdx}>
              {group.label && (
                <>
                  {gIdx > 0 && <Divider sx={{ borderColor:'rgba(255,255,255,0.08)', mx:1, my:0.5 }} />}
                  <ListItemButton onClick={() => toggleGroup(group.label!)}
                    sx={{ borderRadius:1.5, mx:1, py:0.5, color:'rgba(255,255,255,0.35)',
                      '&:hover':{ bgcolor:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)' } }}>
                    <ListItemText primary={group.label}
                      primaryTypographyProps={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }} />
                    {isOpen ? <ExpandLessIcon sx={{ fontSize:15 }} /> : <ExpandMoreIcon sx={{ fontSize:15 }} />}
                  </ListItemButton>
                  <Collapse in={isOpen}>
                    {visible.map(item => (
                      <ListItemButton key={item.id} selected={activeTab===item.id}
                        onClick={() => { setActiveTab(item.id as TabId); if(item.id==='messages') refetchNotifs(); setMobileOpen(false); }}
                        sx={{ borderRadius:1.5, mx:1, mb:0.25, pl:2, color:'rgba(255,255,255,0.7)',
                          '&.Mui-selected':{ bgcolor:'primary.main', color:'white', '&:hover':{ bgcolor:'primary.dark' } },
                          '&:hover':{ bgcolor:'rgba(255,255,255,0.08)', color:'white' } }}>
                        <ListItemIcon sx={{ color:'inherit', minWidth:34 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight:500, fontSize:13 }} />
                        {item.id==='messages' && unreadMessages>0 &&
                          <Chip label={unreadMessages>99?'99+':unreadMessages} size="small" color="error"
                            sx={{ height:20, fontSize:10, ml:0.5, '& .MuiChip-label':{ px:0.75 } }} />}
                        {item.id==='users' && pendingReviews>0 &&
                          <Chip label={pendingReviews>99?'99+':pendingReviews} size="small" color="warning"
                            sx={{ height:20, fontSize:10, ml:0.5, '& .MuiChip-label':{ px:0.75 } }} />}
                      </ListItemButton>
                    ))}
                  </Collapse>
                </>
              )}
              {!group.label && visible.map(item => (
                <ListItemButton key={item.id} selected={activeTab===item.id}
                  onClick={() => { setActiveTab(item.id as TabId); if(item.id==='messages') refetchNotifs(); setMobileOpen(false); }}
                  sx={{ borderRadius:1.5, mx:1, mb:0.25, color:'rgba(255,255,255,0.7)',
                    '&.Mui-selected':{ bgcolor:'primary.main', color:'white', '&:hover':{ bgcolor:'primary.dark' } },
                    '&:hover':{ bgcolor:'rgba(255,255,255,0.08)', color:'white' } }}>
                  <ListItemIcon sx={{ color:'inherit', minWidth:36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight:500, fontSize:14 }} />
                  {item.id==='messages' && unreadMessages>0 &&
                    <Chip label={unreadMessages>99?'99+':unreadMessages} size="small" color="error"
                      sx={{ height:20, fontSize:10, ml:0.5, '& .MuiChip-label':{ px:0.75 } }} />}
                  {item.id==='users' && pendingReviews>0 &&
                    <Chip label={pendingReviews>99?'99+':pendingReviews} size="small" color="warning"
                      sx={{ height:20, fontSize:10, ml:0.5, '& .MuiChip-label':{ px:0.75 } }} />}
                </ListItemButton>
              ))}
            </Box>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
    <Box sx={{ display:'flex', minHeight:'100vh', bgcolor:'#f1f5f9' }}>
      {/* Permanent sidebar (desktop) */}
      <Drawer variant="permanent"
        sx={{ width:DRAWER_WIDTH, flexShrink:0, display:{ xs:'none', lg:'block' },
          '& .MuiDrawer-paper':{ width:DRAWER_WIDTH, boxSizing:'border-box', border:'none', height:'100vh', bgcolor:'#1e293b' } }}>
        {drawerContent}
      </Drawer>
      {/* Temporary sidebar (mobile) */}
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted:true }}
        sx={{ display:{ xs:'block', lg:'none' }, '& .MuiDrawer-paper':{ width:DRAWER_WIDTH, bgcolor:'#1e293b' } }}>
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>


        {/* Top bar — replaces AppBar */}
        <Box className="no-print" sx={{
          display:'flex', alignItems:'center', px:2, py:0.75,
          bgcolor:'white', borderBottom:'1px solid', borderColor:'divider', minHeight:44,
        }}>
          {/* Mobile hamburger */}
          <IconButton size="small" sx={{ display:{ lg:'none' }, mr:1 }} onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex:1, color:'text.primary', fontSize:{ xs:13, sm:14 } }}>
            {user?.displayName?.toUpperCase()}
          </Typography>

          {/* Right controls */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" fontWeight={700} sx={{ color:'text.disabled', mr:0.5, display:{ xs:'none', sm:'block' } }}>
              {APP_VERSION}
            </Typography>

            {/* Notification bell */}
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={e => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={totalNotifs>0?(totalNotifs>99?'99+':totalNotifs):0} color="error" max={99}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User avatar */}
            {user?.photoURL
              ? <Avatar src={user.photoURL} sx={{ width:28, height:28, cursor:'default' }} />
              : <Avatar sx={{ width:28, height:28, bgcolor:'primary.main', fontSize:12, fontWeight:700, cursor:'default' }}>
                  {user?.displayName?.charAt(0)}
                </Avatar>}

            {/* Logout */}
            <Tooltip title="Sign Out">
              <IconButton size="small" onClick={() => setLogoutConfirmOpen(true)} sx={{ color:'text.secondary' }}>
                <PowerSettingsNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Notifications popover */}
        <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical:'bottom', horizontal:'right' }} transformOrigin={{ vertical:'top', horizontal:'right' }}
          PaperProps={{ sx:{ width:{ xs:'calc(100vw - 32px)', sm:360 }, maxHeight:480, display:'flex', flexDirection:'column' } }}>
          <Box sx={{ px:2, py:1.5, bgcolor:'#1e293b', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
            {totalNotifs>0 && <Chip label={totalNotifs+' new'} size="small" color="error" sx={{ height:20, fontSize:10 }} />}
          </Box>
          <Box sx={{ overflowY:'auto', flex:1 }}>
            {/* Pending Reviews section — admin/medical only */}
            {pendingReviews>0 && <>
              <Box sx={{ px:2, py:0.75, bgcolor:'#fffbeb', borderBottom:'1px solid', borderColor:'#fde68a', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color:'#92400e' }}>⏳ Pending Reviews</Typography>
                <Button size="small" sx={{ fontSize:11, p:0, minWidth:0, color:'#b45309' }}
                  onClick={() => { setActiveTab('users'); setNotifAnchor(null); }}>View all</Button>
              </Box>
              {pendingReviewList.map(r => (
                <Box key={r.id} onClick={() => { setActiveTab('users'); setNotifAnchor(null); }}
                  sx={{ px:2, py:1.25, borderBottom:'1px solid', borderColor:'divider', cursor:'pointer', '&:hover':{ bgcolor:'#fffbeb' }, display:'flex', gap:1.5, alignItems:'center' }}>
                  <Avatar sx={{ width:28, height:28, bgcolor:'#f59e0b', fontSize:12, fontWeight:700 }}>
                    {r.userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{r.userName}</Typography>
                    <Typography variant="caption" color="text.secondary">Submitted profile for review</Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                      {new Date(r.submittedAt).toLocaleString('en-PH',{dateStyle:'short',timeStyle:'short'})}
                    </Typography>
                  </Box>
                  <Chip label="Pending" size="small" sx={{ height:18, fontSize:'0.6rem', fontWeight:700, bgcolor:'#fef3c7', color:'#92400e' }} />
                </Box>
              ))}
            </>}

            {/* Viewer's own profile request status */}
            {myProfileRequest && user?.role==='viewer' && (
              <>
                <Box sx={{ px:2, py:0.75,
                  bgcolor: myProfileRequest.status==='pending' ? '#fffbeb' : myProfileRequest.status==='rejected' ? '#fef2f2' : '#f0fdf4',
                  borderBottom:'1px solid',
                  borderColor: myProfileRequest.status==='pending' ? '#fde68a' : myProfileRequest.status==='rejected' ? '#fecaca' : '#bbf7d0',
                  display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Typography variant="caption" fontWeight={700} sx={{
                    color: myProfileRequest.status==='pending' ? '#92400e' : myProfileRequest.status==='rejected' ? '#991b1b' : '#166534' }}>
                    {myProfileRequest.status==='pending' ? '⏳ Profile Under Review' : myProfileRequest.status==='rejected' ? '❌ Profile Rejected' : '✅ Profile Approved'}
                  </Typography>
                  <Button size="small" sx={{ fontSize:11, p:0, minWidth:0,
                    color: myProfileRequest.status==='pending' ? '#b45309' : myProfileRequest.status==='rejected' ? '#dc2626' : '#16a34a' }}
                    onClick={() => { setActiveTab('edit-profile'); setNotifAnchor(null); }}>View</Button>
                </Box>
                <Box onClick={() => { setActiveTab('edit-profile'); setNotifAnchor(null); }}
                  sx={{ px:2, py:1.25, borderBottom:'1px solid', borderColor:'divider', cursor:'pointer',
                    '&:hover':{ bgcolor: myProfileRequest.status==='pending' ? '#fffbeb' : myProfileRequest.status==='rejected' ? '#fef2f2' : '#f0fdf4' },
                    display:'flex', gap:1.5, alignItems:'center' }}>
                  <Avatar sx={{ width:28, height:28, fontSize:14,
                    bgcolor: myProfileRequest.status==='pending' ? '#f59e0b' : myProfileRequest.status==='rejected' ? '#ef4444' : '#22c55e' }}>
                    {myProfileRequest.status==='pending' ? '⏳' : myProfileRequest.status==='rejected' ? '✗' : '✓'}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600}>My Profile Submission</Typography>
                    {myProfileRequest.status==='rejected' && myProfileRequest.rejectionReason
                      ? <Typography variant="caption" color="error.main" noWrap display="block">Reason: {myProfileRequest.rejectionReason}</Typography>
                      : <Typography variant="caption" color="text.secondary">
                          {myProfileRequest.status==='pending' ? 'Awaiting admin review' : myProfileRequest.status==='approved' ? 'Your profile has been approved' : 'Click to re-submit'}
                        </Typography>}
                    <Typography variant="caption" color="text.disabled" display="block">
                      {new Date(myProfileRequest.submittedAt).toLocaleString('en-PH',{dateStyle:'short',timeStyle:'short'})}
                    </Typography>
                  </Box>
                  <Chip label={myProfileRequest.status==='pending'?'Pending':myProfileRequest.status==='approved'?'Approved':'Rejected'} size="small" sx={{ height:18, fontSize:'0.6rem', fontWeight:700,
                    bgcolor: myProfileRequest.status==='pending' ? '#fef3c7' : myProfileRequest.status==='rejected' ? '#fee2e2' : '#dcfce7',
                    color:   myProfileRequest.status==='pending' ? '#92400e' : myProfileRequest.status==='rejected' ? '#991b1b' : '#166534' }} />
                </Box>
              </>
            )}

            <Box sx={{ px:2, py:0.75, bgcolor:'grey.50', borderBottom:'1px solid', borderColor:'divider', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Messages</Typography>
              {unreadMessages>0 && <Button size="small" sx={{ fontSize:11, p:0, minWidth:0 }}
                onClick={() => { setActiveTab('messages'); setNotifAnchor(null); refetchNotifs(); }}>View all</Button>}
            </Box>
            {unreadMessages===0
              ? <Typography variant="body2" color="text.secondary" sx={{ px:2, py:1.5, fontStyle:'italic' }}>No unread messages</Typography>
              : messagePreviews.map(msg => (
                <Box key={msg.id} onClick={() => { setActiveTab('messages'); setNotifAnchor(null); }}
                  sx={{ px:2, py:1.5, borderBottom:'1px solid', borderColor:'divider', cursor:'pointer', '&:hover':{ bgcolor:'grey.50' }, display:'flex', gap:1.5 }}>
                  <Avatar sx={{ width:28, height:28, bgcolor:'primary.main', fontSize:12, fontWeight:700 }}>{msg.senderName.charAt(0)}</Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{msg.senderName}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{msg.preview}</Typography>
                    <Typography variant="caption" color="text.disabled">{new Date(msg.timestamp).toLocaleString('en-PH',{dateStyle:'short',timeStyle:'short'})}</Typography>
                  </Box>
                </Box>
              ))}
            {user?.role!=='viewer' && <>
              <Box sx={{ px:2, py:0.75, bgcolor:'grey.50', borderBottom:'1px solid', borderColor:'divider' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">Recent Activity</Typography>
              </Box>
              {recentActivity.length===0
                ? <Typography variant="body2" color="text.secondary" sx={{ px:2, py:1.5, fontStyle:'italic' }}>No recent activity</Typography>
                : recentActivity.map(item => (
                  <Box key={item.id} sx={{ px:2, py:1.25, borderBottom:'1px solid', borderColor:'divider' }}>
                    <Typography variant="caption" display="block">{item.description}</Typography>
                    <Typography variant="caption" color="text.disabled">{item.userName} - {new Date(item.timestamp).toLocaleString('en-PH',{dateStyle:'short',timeStyle:'short'})}</Typography>
                  </Box>
                ))}
            </>}
          </Box>
          <Box sx={{ px:2, py:0.75, borderTop:'1px solid', borderColor:'divider', bgcolor:'grey.50', textAlign:'right' }}>
            <Button size="small" sx={{ fontSize:11 }} onClick={() => setNotifAnchor(null)}>Close</Button>
          </Box>
        </Popover>

        {/* Page content */}
        <Box sx={{ p:{ xs:2, sm:3 }, flex:1 }}>
          {activeTab==='overview'         && user?.role!=='viewer' && <AnalyticsPage />}
          {activeTab==='personnel'        && user?.role!=='viewer' && <PersonnelPage />}
          {activeTab==='activity'         && user?.role!=='viewer' && <ActivityLogPage />}
          {activeTab==='supplies'         && user?.role!=='viewer' && <MedicalSuppliesPage />}
          {activeTab==='calendar'         && user?.role==='admin'  && <CalendarPage />}
          {activeTab==='sitrep'           && user?.role!=='viewer' && <SitrepPage />}
          {activeTab==='readiness'        && user?.role!=='viewer' && <DeploymentReadinessPage />}
          {activeTab==='assets'           && user?.role==='admin'  && <AssetsPage />}
          {activeTab==='users'            && user?.role==='admin'  && <UsersPage />}
          {activeTab==='recycle-bin'      && user?.role==='admin'  && <RecycleBinPage />}
          {activeTab==='med-eval-report'  && user?.role!=='viewer' && <MedicalEvalReportPage />}
          {activeTab==='med-eval-summary' && user?.role!=='viewer' && <MedEvalSummaryReportPage />}
          {activeTab==='edit-profile'      && user?.role==='viewer' && <EditProfilePage />}
          {activeTab==='pcr'              && user?.role!=='viewer' && <PCRPage />}
          {activeTab==='mrr-report'      && user?.role!=='viewer' && <MRRReportPage />}
          {activeTab==='messages'         && <ChatPage onNavigate={(tab) => setActiveTab(tab as TabId)} />}
          {activeTab==='about'            && <AboutPage />}
        </Box>
      </Box>
    </Box>
    {/* Sign Out Confirmation */}
    <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Sign Out</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to sign out?</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setLogoutConfirmOpen(false)}>No</Button>
        <Button variant="contained" color="error" onClick={handleLogout}>Yes, Sign Out</Button>
      </DialogActions>
    </Dialog>

    {/* Logging Out Overlay */}
    {loggingOut && (
      <Box sx={{ position:'fixed', inset:0, bgcolor:'rgba(255,255,255,0.9)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
        <CircularProgress size={48} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">Logging out...</Typography>
      </Box>
    )}
    </>
  );
};
