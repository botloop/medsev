import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';

const ChatPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, refreshUser } = useAuth();
  const { conversations, messages, users, selectedUserId, loading, initialLoading, sending, fetchMessages, fetchConversations, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [neuroDialogOpen, setNeuroDialogOpen] = useState(false);
  const [neuroDate, setNeuroDate] = useState('');
  const [neuroTime, setNeuroTime] = useState('08:00');
  const [savingNeuro, setSavingNeuro] = useState(false);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSelected = useRef(false);
  const isLinkedViewer = user?.role === 'viewer' && !!user?.linkedPersonnelId;

  const handleCheckRecord = () => {
    onNavigate?.('edit-profile');
  };

  const handleMedicalCheckup = async () => {
    if (!selectedUserId) return;
    // Send the viewer's request message
    await sendMessage(selectedUserId, 'I would like to request a Medical Check-Up.');
    // Trigger auto-reply + admin email notification
    api.post('/notifications/medical-checkup', {
      viewerUserId: user?.uid,
      viewerName: user?.displayName,
      viewerEmail: user?.email,
    }, { _silent: true } as any).then(() => fetchMessages(selectedUserId)).catch(() => {});
    await fetchMessages(selectedUserId);
    toast.success('Request sent. You will receive a reply shortly.');
  };

  const handleSetNeuroSchedule = async () => {
    if (!neuroDate) { toast.error('Please select a date.'); return; }
    const linkedId = selectedUser?.linkedPersonnelId;
    if (!linkedId) { toast.error('Selected user has no linked personnel record.'); return; }
    // Format time as military (e.g. "08:00" → "0800H")
    const militaryTime = neuroTime.replace(':', '') + 'H';
    setSavingNeuro(true);
    try {
      // Update personnel record
      await api.put(`/personnel/${linkedId}`, { neuroScheduleDate: neuroDate });
      // Create calendar event with time
      await api.post('/calendar', {
        title: `Neuro Exam – ${selectedUser?.displayName || 'Personnel'}`,
        type: 'Medical Exam',
        date: neuroDate,
        time: neuroTime,
        description: `Scheduled Neuro Exam for ${selectedUser?.displayName || 'Personnel'} at ${militaryTime}`,
      });
      // Send automated chat reply to the viewer
      const formatted = new Date(neuroDate).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      await sendMessage(
        selectedUserId!,
        `[AUTOMATED MESSAGE] Your Neuro Exam has been scheduled on ${formatted} at ${militaryTime}. Please report on time. For inquiries, contact your unit's medical officer.`
      );
      await fetchMessages(selectedUserId!);
      // Send email notification (non-blocking — schedule is already saved)
      let emailSent = false;
      if (selectedUser?.email) {
        try {
          const emailRes = await api.post('/notifications/neuro-schedule', {
            email: selectedUser.email,
            displayName: selectedUser.displayName,
            scheduleDate: neuroDate,
            scheduleTime: militaryTime,
          }, { _silent: true } as any) as any;
          emailSent = !emailRes?.emailError;
        } catch { /* email failure does not block */ }
      }
      toast.success(`Neuro exam scheduled for ${formatted} at ${militaryTime}.${emailSent ? ' Email sent.' : ''}`);
      setNeuroDialogOpen(false);
      setNeuroDate('');
      setNeuroTime('08:00');
    } catch {
      toast.error('Failed to set Neuro schedule.');
    } finally {
      setSavingNeuro(false);
    }
  };

  useEffect(() => { refreshUser(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (users && users.length > 0 && !selectedUserId && !hasAutoSelected.current) {
      const admin = users.find((u) => u.role === 'admin');
      if (admin) { hasAutoSelected.current = true; fetchMessages(admin.uid); }
    }
  }, [users, selectedUserId, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;
    try {
      await sendMessage(selectedUserId, messageText);
      setMessageText('');
      await refreshUser();
      await fetchMessages(selectedUserId);
    } catch { alert('Failed to send message. Please try again.'); }
  };

  const handleSelectConversation = (userId: string) => {
    fetchMessages(userId);
    setShowNewChat(false);
    if (isMobile) setMobileChatOpen(true);
  };

  const handleStartNewChat = (userId: string) => {
    fetchMessages(userId);
    setShowNewChat(false);
    if (isMobile) setMobileChatOpen(true);
  };

  const handleBackToList = () => { setMobileChatOpen(false); };

  const handleDeleteConversation = async () => {
    if (!deletingConvId) return;
    try {
      await api.delete(`/chat/conversations/${deletingConvId}`);
      toast.success('Conversation deleted');
      setDeletingConvId(null);
      if (selectedUserId === deletingConvId) fetchMessages('');
      await fetchConversations();
    } catch { toast.error('Failed to delete conversation'); }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const selectedConversation = conversations?.find((c) => c.userId === selectedUserId);
  const selectedUser = users?.find((u) => u.uid === selectedUserId);

  // --- Sidebar ---
  const sidebar = (
    <Box sx={{
      width: isMobile ? '100%' : 300,
      flexShrink: 0,
      borderRight: isMobile ? 0 : 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      ...(isMobile && mobileChatOpen ? { display: 'none' } : {}),
    }}>
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
        <Typography variant="h6" fontWeight={700} color="white" mb={1}>Messages</Typography>
        <Button fullWidth variant="contained" size="small"
          sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#eff6ff' } }}
          onClick={() => setShowNewChat(!showNewChat)}>+ New Conversation</Button>
      </Box>

      {showNewChat && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Typography variant='body2' fontWeight={600}>Start a new conversation</Typography>
          </Box>
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {(() => {
              const filteredUsers = user?.role === 'viewer' ? users?.filter(u => u.role === 'admin') : users;
              return filteredUsers && filteredUsers.length > 0 ? filteredUsers.map((u) => (
              <Box key={u.uid} onClick={() => handleStartNewChat(u.uid)}
                sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'white' } }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                  {u.displayName?.charAt(0) || '?'}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant='body2' fontWeight={600} noWrap>{u.displayName}</Typography>
                  <Typography variant='caption' color='text.secondary' noWrap>{u.email}</Typography>
                </Box>
                <Chip label={u.role} size='small' />
              </Box>
              )) : <Typography variant='body2' color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>No users available</Typography>;
            })()}
          </Box>
        </Box>
      )}

      <Box flex={1} sx={{ overflowY: 'auto' }}>
        {!conversations || conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mt: 4 }}>
            <Typography fontSize={36} mb={1}>💬</Typography>
            <Typography variant='body2' fontWeight={600}>No conversations yet</Typography>
            <Typography variant='caption'>Start a new conversation to get started</Typography>
          </Box>
        ) : conversations.map((conv) => (
          <Box key={conv.userId}
            onClick={() => handleSelectConversation(conv.userId)}
            sx={{
              p: 2, borderBottom: 1, borderColor: 'divider', cursor: 'pointer',
              bgcolor: selectedUserId === conv.userId ? '#eff6ff' : 'transparent',
              borderLeft: selectedUserId === conv.userId ? '4px solid' : '4px solid transparent',
              borderLeftColor: selectedUserId === conv.userId ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: 'grey.50', '& .conv-delete-btn': { opacity: 1 } },
              position: 'relative',
            }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Badge badgeContent={conv.unreadCount > 0 ? conv.unreadCount : 0} color='primary'>
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>{conv.userName.charAt(0)}</Avatar>
              </Badge>
              <Box flex={1} minWidth={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                  <Typography variant='body2' fontWeight={700} noWrap>{conv.userName}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary' noWrap display='block'>{conv.lastMessage}</Typography>
                <Typography variant='caption' color='text.disabled'>{formatTimestamp(conv.lastMessageTime)}</Typography>
              </Box>
              <IconButton
                className="conv-delete-btn"
                size="small"
                color="error"
                onClick={(e) => { e.stopPropagation(); setDeletingConvId(conv.userId); }}
                sx={{ opacity: 0, transition: 'opacity 0.15s', alignSelf: 'center', ml: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  // --- Message Thread ---
  const thread = (
    <Box flex={1} display='flex' flexDirection='column' minWidth={0}
      sx={{
        ...(isMobile && !mobileChatOpen ? { display: 'none' } : {}),
      }}
    >
      {selectedUserId ? (
        <>
          {/* Thread header */}
          <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton size="small" onClick={handleBackToList} sx={{ color: 'white', mr: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 36, height: 36, fontWeight: 700 }}>
              {selectedConversation?.userName.charAt(0) || selectedUser?.displayName?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant='subtitle1' fontWeight={700} color='white'>
                {selectedConversation?.userName || selectedUser?.displayName || 'Unknown User'}
              </Typography>
              <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {selectedConversation?.userRole || selectedUser?.role || 'User'}
              </Typography>
            </Box>
          </Box>

          {/* Actions toolbar */}
          {user && (
            <Box sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ mr: 0.5 }}>Actions:</Typography>
                <Chip size='small' label='📋 Check Record' onClick={handleCheckRecord} sx={{ cursor: 'pointer' }} />
                {/* Admin-only: Set Neuro Schedule */}
                {user.role === 'admin' && selectedUser?.linkedPersonnelId && (
                  <Chip
                    size='small'
                    color='secondary'
                    icon={<EventIcon sx={{ fontSize: 14 }} />}
                    label='Set Neuro Schedule'
                    onClick={() => setNeuroDialogOpen(true)}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
                {/* Viewer: Request Neuro Schedule */}
                {user.role === 'viewer' && (
                  <Chip size='small' label='🧠 Request Neuro Schedule' onClick={() => {
                    setMessageText('I would like to request a Neuro Exam schedule. Please advise on the available date.');
                    toast('Edit the message if needed then press Send', { icon: '🧠', duration: 4000 });
                  }} sx={{ cursor: 'pointer' }} />
                )}
                {/* Viewer: Medical Check-Up */}
                {user.role === 'viewer' && (
                  <Chip size='small' label='🏥 Medical Check-Up' onClick={handleMedicalCheckup} sx={{ cursor: 'pointer' }} />
                )}
              </Box>
            </Box>
          )}

          {/* Messages */}
          <Box flex={1} sx={{ overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
            {loading && messages.length === 0 ? (
              <Box display='flex' justifyContent='center' alignItems='center' height='100%'><CircularProgress /></Box>
            ) : messages.length === 0 ? (
              <Box display='flex' justifyContent='center' alignItems='center' height='100%' flexDirection='column' color='text.secondary'>
                <Typography fontSize={36} mb={1}>💬</Typography>
                <Typography>No messages yet</Typography>
                <Typography variant='caption'>Send a message to start the conversation</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {messages.map((msg) => {
                  const isSentByMe = msg.senderId === user?.uid;
                  const senderUser = users?.find(u => u.uid === msg.senderId);
                  const displayName = senderUser?.displayName || msg.senderName || 'Unknown';
                  const isAutomatedMessage = msg.message.includes('[AUTOMATED MESSAGE]');
                  const isSuccessMessage = msg.message.includes('successfully linked to your personnel record');
                  return (
                    <Box key={msg.id} display='flex' justifyContent={isSentByMe ? 'flex-end' : 'flex-start'}>
                      <Box maxWidth={{ xs: '85%', sm: 480 }}>
                        {!isSentByMe && <Typography variant='caption' color='text.secondary' sx={{ ml: 1.5, mb: 0.5, display: 'block' }}>{displayName}</Typography>}
                        <Paper sx={{
                          px: 2, py: 1.5, borderRadius: 3,
                          background: isSentByMe ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'white',
                          color: isSentByMe ? 'white' : 'text.primary',
                          border: isSentByMe ? 'none' : '1px solid',
                          borderColor: 'divider',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}>
                          <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.message}</Typography>
                          {!isSentByMe && isAutomatedMessage && isSuccessMessage && user?.role === 'viewer' && isLinkedViewer && (
                            <Box mt={2} pt={1.5} sx={{ borderTop: 1, borderColor: 'rgba(0,0,0,0.1)' }}>
                              <Typography variant='caption' fontWeight={700} display='block' mb={1}>Quick Actions:</Typography>
                              <Stack spacing={1}>
                                <Button fullWidth size='small' variant='outlined' color='error' onClick={async () => {
                                  if (confirm('Are you sure?')) { try { await api.post('/auth/unlink-personnel'); toast.success('Unlinked'); await refreshUser(); if (selectedUserId) await fetchMessages(selectedUserId); } catch { toast.error('Failed'); } }
                                }}>🔓 Unlink Record</Button>
                                <Button fullWidth size='small' variant='outlined' onClick={async () => {
                                  if (confirm('This will unlink your current record. Continue?')) { try { await api.post('/auth/unlink-personnel'); toast.success('Unlinked.'); await refreshUser(); if (selectedUserId) await fetchMessages(selectedUserId); } catch { toast.error('Failed'); } }
                                }}>🔄 Change Record</Button>
                              </Stack>
                            </Box>
                          )}
                        </Paper>
                        <Typography variant='caption' color='text.disabled' sx={{ ml: 1.5, mt: 0.25, display: 'block' }}>{formatTimestamp(msg.timestamp.toString())}</Typography>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>

          {/* Input */}
          <Box component='form' onSubmit={handleSendMessage} sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
              />
              <Button type="submit" variant="contained" disabled={sending || !messageText.trim()}
                sx={{ borderRadius: 6, minWidth: { xs: 48, sm: 80 }, px: { xs: 1, sm: 2 } }}
                endIcon={!sending ? <SendIcon /> : undefined}>
                {sending ? <CircularProgress size={18} color="inherit" /> : <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Send</Box>}
              </Button>
            </Box>
          </Box>
        </>
      ) : (
        <Box display='flex' justifyContent='center' alignItems='center' flex={1} flexDirection='column' color='text.secondary' bgcolor='grey.50'>
          <Typography fontSize={48} mb={2}>💬</Typography>
          <Typography variant='h6'>Select a conversation</Typography>
          <Typography variant='body2'>Choose a conversation from the sidebar to start messaging</Typography>
        </Box>
      )}
    </Box>
  );

  if (initialLoading) return (
    <Box sx={{ minHeight: 'calc(100vh - 8rem)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%)', borderRadius: 2 }}>
      <style>{`
        @keyframes cm-spin{to{transform:rotate(360deg)}}
        @keyframes cm-dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-8px);opacity:1}}
        @keyframes cm-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <Box sx={{ textAlign:'center', color:'white', animation:'cm-fade 0.5s ease-out' }}>
        <Box sx={{ position:'relative', width:72, height:72, mx:'auto', mb:3 }}>
          <Box sx={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.1)' }} />
          <Box sx={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid transparent',
            borderTopColor:'#60a5fa', borderRightColor:'#93c5fd',
            animation:'cm-spin 1s linear infinite' }} />
          <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>💬</Box>
        </Box>
        <Box sx={{ fontSize:11, letterSpacing:4, fontWeight:700, color:'#93c5fd', textTransform:'uppercase', mb:1 }}>
          Messages
        </Box>
        <Box sx={{ fontSize:14, fontWeight:600, mb:3 }}>Loading messages...</Box>
        <Box sx={{ display:'flex', gap:'6px', justifyContent:'center' }}>
          {[0,1,2].map(i => (
            <Box key={i} sx={{ width:7, height:7, borderRadius:'50%', bgcolor:'#60a5fa',
              animation:`cm-dot 1.3s ease-in-out ${i*0.18}s infinite` }} />
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Paper sx={{ display: 'flex', height: 'calc(100vh - 8rem)', overflow: 'hidden' }} elevation={2}>
        {sidebar}
        {thread}
      </Paper>

      {/* Set Neuro Schedule Dialog (Admin only) */}
      <Dialog open={neuroDialogOpen} onClose={() => setNeuroDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Set Neuro Exam Schedule
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select the date for the Neuro Exam of{' '}
            <strong>{selectedUser?.displayName || 'this personnel'}</strong>.
            This will update their record and add the event to the calendar.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              fullWidth
              label="Exam Date"
              type="date"
              value={neuroDate}
              onChange={(e) => setNeuroDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              sx={{ width: 140, flexShrink: 0 }}
              label="Time"
              type="time"
              value={neuroTime}
              onChange={(e) => setNeuroTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={neuroTime.replace(':', '') + 'H'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setNeuroDialogOpen(false); setNeuroDate(''); setNeuroTime('08:00'); }} disabled={savingNeuro}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSetNeuroSchedule} disabled={savingNeuro || !neuroDate}
            startIcon={savingNeuro ? <CircularProgress size={16} color="inherit" /> : <EventIcon />}>
            {savingNeuro ? 'Saving...' : 'Set Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Conversation Confirm */}
      <Dialog open={!!deletingConvId} onClose={() => setDeletingConvId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all messages in this conversation. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletingConvId(null)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteConversation}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatPage;
