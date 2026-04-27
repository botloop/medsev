import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast from 'react-hot-toast';

const MEDS_EV_ROSTER = [
  { nameWithSerial:'ENS CAMILLE ANNE V BORBE O-2660 PCG',      unit:'MEDS-EV', designation:'Acting Commanding Officer MEDS-EV, NPAD' },
  { nameWithSerial:'ENS KEINTZ ROLAND C LIBETARIO O-2666 PCG', unit:'MEDS-EV', designation:'Executive Officer MEDS-EV, Operation Officer' },
  { nameWithSerial:'SN1 Lyndon Harlie F Lim 012544 PCG',       unit:'MEDS-EV', designation:'A/POIC, Operations MEDS-EV' },
  { nameWithSerial:'SN1 Rembrant H Oria 013330 PCG',           unit:'MEDS-EV', designation:'A/POIC Admin and Logistics' },
  { nameWithSerial:'SN2 Samuelson G Acosta 018347 PCG',        unit:'MEDS-EV', designation:'Petty Cash Custodian, Admin member' },
  { nameWithSerial:'SN2 Adonis K Balantican 018428 PCG',       unit:'MEDS-EV', designation:'Operations' },
  { nameWithSerial:'SN2 Carlo F Garcia 018601 PCG',            unit:'MEDS-EV', designation:'Ambulance Driver' },
  { nameWithSerial:'ASN Angelito J Hidalgo 021296 PCG',        unit:'MEDS-EV', designation:'Treatment and Records' },
  { nameWithSerial:'ASN Arvin S Ecot 10920-C PCG',             unit:'MEDS-EV', designation:'Ambulance Driver, Logistics' },
];

const NSSU_EV_ROSTER = [
  { nameWithSerial:'LTJG KARLA MAE U MENDEZ O-1082 PCG',   unit:'NSSU-EV', designation:'Chief Nurse, NSSU-EV' },
  { nameWithSerial:'ENS VERMIELYN C PAGGAO O-3687 PCG',    unit:'NSSU-EV', designation:'OIC, Admin NSSU-EV' },
  { nameWithSerial:'ENS MARSHIA S JAJALIS O-3756 PCG',     unit:'NSSU-EV', designation:'OIC, Operation NSSU-EV' },
  { nameWithSerial:'SW1 Nurshilla I Gurrea 015002 PCG',    unit:'NSSU-EV', designation:'Member, NSSU-EV' },
  { nameWithSerial:'ASN John Daniel P De Vega 022983 PCG', unit:'NSSU-EV', designation:'Member, NSSU-EV' },
];

const ALL_ROSTER = [...MEDS_EV_ROSTER, ...NSSU_EV_ROSTER];

const ROLE_OPTIONS = [
  'MAC Officer','Nurse Officer','Hospitalman','Ambu Driver',
  'Medical Officer','Attending Physician','Nursing Aide','Escort','Driver','POIC',
];

interface TeamEntry { nameWithSerial: string; unit: string; role: string; }
interface VitalsEntry { bp: string; pr: string; rr: string; temp: string; o2sat: string; }
interface TimelineEntry {
  id: string; date: string; time: string; action: string;
  showVitals: boolean; vitals: VitalsEntry;
}

function autoGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  return 'Good evening';
}
function todayStr(): string { return new Date().toISOString().split('T')[0]; }

function sitrepShortName(nameWithSerial: string): string {
  const withoutPCG = nameWithSerial.replace(/ PCG$/, '');
  const parts = withoutPCG.split(' ');
  return parts[0] + ' ' + parts[parts.length - 2];
}

function fmtMilDt(dateStr: string, time: string, prevDate: string | null): { dt: string; sep: string } {
  const t = (time || '0000').replace(/\D/g, '').padStart(4, '0');
  if (!prevDate || prevDate !== dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return { dt: day + t + 'H ' + mon + ' ' + d.getFullYear(), sep: '- ' };
  }
  return { dt: t + 'H same date', sep: ', ' };
}

function buildSitrep(
  greeting: string, salutation: string, reportDate: string,
  mission: string, team: TeamEntry[], mobility: string, timeline: TimelineEntry[],
): string {
  const dateLabel = new Date(reportDate + 'T00:00:00').toLocaleDateString('en-PH',
    { day:'numeric', month:'long', year:'numeric' });
  let out = greeting + ' ' + salutation + '.\n\nSitrep as of ' + dateLabel + '\n';

  if (mission.trim()) out += '\nMission: ' + mission.trim() + '\n';

  if (team.length > 0) {
    out += '\nMed team composition:\n';
    team.forEach((m, i) => {
      out += (i + 1) + '. ' + sitrepShortName(m.nameWithSerial) + ' PCG- ' + (m.role || '—') + '\n';
    });
  }

  if (mobility.trim()) out += '\nMobility: ' + mobility.trim() + '\n';

  const activeEntries = timeline.filter(e => e.action.trim());
  if (activeEntries.length > 0) {
    out += '\n';
    let prevDate: string | null = null;
    activeEntries.forEach((entry, i) => {
      const { dt, sep } = fmtMilDt(entry.date, entry.time, prevDate);
      out += (i + 1) + '. O/A ' + dt + sep + 'said pers ' + entry.action.trim();
      if (entry.showVitals) {
        const v = entry.vitals;
        if (v.bp || v.pr || v.rr || v.temp || v.o2sat) {
          out += '\nPatient V/S:';
          if (v.bp)    out += '\nBP: '    + v.bp;
          if (v.pr)    out += '\nPR: '    + v.pr;
          if (v.rr)    out += '\nRR: '    + v.rr;
          if (v.temp)  out += '\nT: '     + v.temp;
          if (v.o2sat) out += '\nO2Sat: ' + v.o2sat;
        }
      }
      out += '\n\n';
      prevDate = entry.date;
    });
  }

  out += 'For info reference.';
  return out;
}

const EMPTY_VITALS: VitalsEntry = { bp:'', pr:'', rr:'', temp:'', o2sat:'' };

export const SitrepPage = () => {
  const [greeting,    setGreeting]    = useState(autoGreeting);
  const [salutation,  setSalutation]  = useState("Ma'am/Sir/POIC/Chief");
  const [reportDate,  setReportDate]  = useState(todayStr);
  const [mission,     setMission]     = useState('');
  const [unitFilter,  setUnitFilter]  = useState<'Both'|'MEDS-EV'|'NSSU-EV'>('Both');
  const [teamEntries, setTeamEntries] = useState<TeamEntry[]>([]);
  const [mobility,    setMobility]    = useState('PCG Ambulance');
  const [timeline,    setTimeline]    = useState<TimelineEntry[]>([
    { id:'1', date:todayStr(), time:'', action:'', showVitals:false, vitals:{ ...EMPTY_VITALS } },
  ]);

  const roster = unitFilter === 'Both' ? ALL_ROSTER : ALL_ROSTER.filter(r => r.unit === unitFilter);
  const isSelected = (ns: string) => teamEntries.some(e => e.nameWithSerial === ns);

  const toggleMember = (ns: string, unit: string) => {
    if (isSelected(ns)) {
      setTeamEntries(p => p.filter(e => e.nameWithSerial !== ns));
    } else {
      setTeamEntries(p => [...p, { nameWithSerial:ns, unit, role:'' }]);
    }
  };

  const updateRole = (ns: string, role: string) =>
    setTeamEntries(p => p.map(e => e.nameWithSerial === ns ? { ...e, role } : e));

  const addEvent = () => {
    const last = timeline[timeline.length - 1];
    setTimeline(p => [...p, {
      id: Date.now().toString(),
      date: last?.date ?? todayStr(),
      time:'', action:'', showVitals:false, vitals:{ ...EMPTY_VITALS },
    }]);
  };

  const removeEvent = (id: string) => setTimeline(p => p.filter(e => e.id !== id));

  const patchEvent = (id: string, patch: Partial<TimelineEntry>) =>
    setTimeline(p => p.map(e => e.id !== id ? e : { ...e, ...patch }));

  const patchVitals = (id: string, field: keyof VitalsEntry, val: string) =>
    setTimeline(p => p.map(e => e.id !== id ? e : { ...e, vitals:{ ...e.vitals, [field]:val } }));

  const generated = useMemo(() =>
    buildSitrep(greeting, salutation, reportDate, mission, teamEntries, mobility, timeline),
    [greeting, salutation, reportDate, mission, teamEntries, mobility, timeline]
  );

  const copy = async () => {
    try { await navigator.clipboard.writeText(generated); toast.success('Sitrep copied!'); }
    catch { toast.error('Copy failed'); }
  };

  return (
    <Grid container spacing={3}>

      {/* FORM */}
      <Grid size={{ xs:12, lg:7 }}>
        <Stack spacing={2.5}>

          <Paper sx={{ p:2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>Header</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs:12, sm:4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Greeting</InputLabel>
                  <Select value={greeting} label="Greeting" onChange={e => setGreeting(e.target.value)}>
                    {['Good morning','Good afternoon','Good evening'].map(g =>
                      <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs:12, sm:5 }}>
                <TextField fullWidth size="small" label="Salutation"
                  value={salutation} onChange={e => setSalutation(e.target.value)} />
              </Grid>
              <Grid size={{ xs:12, sm:3 }}>
                <TextField fullWidth size="small" type="date" label="Report Date"
                  InputLabelProps={{ shrink:true }}
                  value={reportDate} onChange={e => setReportDate(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p:2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>Mission</Typography>
            <TextField fullWidth multiline minRows={2} size="small" label="Mission description"
              placeholder="to conduct medical evacuation to [NAME] [SERIAL] PCG from [ORIGIN] to [DESTINATION]"
              value={mission} onChange={e => setMission(e.target.value)} />
          </Paper>

          <Paper sx={{ p:2.5 }}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">Med Team Composition</Typography>
              <FormControl size="small" sx={{ minWidth:130 }}>
                <InputLabel>Unit</InputLabel>
                <Select value={unitFilter} label="Unit"
                  onChange={e => setUnitFilter(e.target.value as typeof unitFilter)}>
                  <MenuItem value="Both">Both Units</MenuItem>
                  <MenuItem value="MEDS-EV">MEDS-EV</MenuItem>
                  <MenuItem value="NSSU-EV">NSSU-EV</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Stack spacing={0.75}>
              {roster.map(member => {
                const sel = isSelected(member.nameWithSerial);
                const entry = teamEntries.find(e => e.nameWithSerial === member.nameWithSerial);
                return (
                  <Box key={member.nameWithSerial}
                    sx={{ display:'flex', alignItems:'center', gap:1, p:1, borderRadius:1,
                      bgcolor: sel ? 'rgba(37,99,235,0.06)' : 'grey.50',
                      border:'1px solid', borderColor: sel ? 'primary.main' : 'transparent',
                      flexWrap:'wrap' }}>
                    <Checkbox size="small" checked={sel}
                      onChange={() => toggleMember(member.nameWithSerial, member.unit)}
                      sx={{ p:0.5 }} />
                    <Box flex={1} minWidth={140}>
                      <Typography variant="body2" fontWeight={sel ? 700 : 400} noWrap>
                        {member.nameWithSerial}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.unit} · {member.designation}
                      </Typography>
                    </Box>
                    {sel && (
                      <FormControl size="small" sx={{ minWidth:145 }}>
                        <Select value={entry?.role || ''} displayEmpty
                          onChange={e => updateRole(member.nameWithSerial, e.target.value)}
                          renderValue={v => v as string || 'Select role'}>
                          {ROLE_OPTIONS.map(r =>
                            <MenuItem key={r} value={r} sx={{ fontSize:13 }}>{r}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          <Paper sx={{ p:2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>Mobility</Typography>
            <TextField fullWidth size="small" label="Vehicle / Mobility"
              value={mobility} onChange={e => setMobility(e.target.value)} />
          </Paper>

          <Paper sx={{ p:2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">Timeline Events</Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addEvent}>Add Event</Button>
            </Box>
            <Stack spacing={2}>
              {timeline.map((entry, idx) => (
                <Box key={entry.id}
                  sx={{ border:'1px solid', borderColor:'divider', borderRadius:1.5, overflow:'hidden' }}>
                  <Box sx={{ bgcolor:'grey.50', px:1.5, py:1, display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                    <Chip size="small" label={idx + 1} color="primary"
                      sx={{ width:26, height:22, fontSize:11, '& .MuiChip-label':{ px:0.5 } }} />
                    <TextField size="small" type="date" sx={{ width:150 }}
                      InputLabelProps={{ shrink:true }}
                      value={entry.date} onChange={e => patchEvent(entry.id, { date:e.target.value })} />
                    <TextField size="small" label="Time (HHMM)" sx={{ width:130 }}
                      placeholder="1300" inputProps={{ maxLength:4, inputMode:'numeric' }}
                      value={entry.time}
                      onChange={e => patchEvent(entry.id, { time:e.target.value.replace(/\D/g,'').slice(0,4) })} />
                    <Box flex={1} />
                    <Button size="small" sx={{ fontSize:11, minWidth:0, px:1 }}
                      variant={entry.showVitals ? 'contained' : 'outlined'} color="secondary"
                      onClick={() => patchEvent(entry.id, { showVitals:!entry.showVitals })}>V/S</Button>
                    {timeline.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => removeEvent(entry.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ px:1.5, py:1.5 }}>
                    <TextField fullWidth size="small" multiline minRows={2}
                      label="Action  (appended after 'said pers')"
                      placeholder={"ash MEDS-EV enroute to EVMC"}
                      value={entry.action}
                      onChange={e => patchEvent(entry.id, { action:e.target.value })} />
                  </Box>
                  <Collapse in={entry.showVitals}>
                    <Divider />
                    <Box sx={{ px:1.5, pb:1.5, pt:1 }}>
                      <Typography variant="caption" color="secondary.main" fontWeight={700} display="block" mb={1}>
                        Patient V/S
                      </Typography>
                      <Grid container spacing={1}>
                        {(['bp','pr','rr','temp','o2sat'] as (keyof VitalsEntry)[]).map(field => (
                          <Grid size={{ xs:6, sm:4 }} key={field}>
                            <TextField fullWidth size="small"
                              label={field==='temp' ? 'Temp (T)' : field==='o2sat' ? 'O2Sat' : field.toUpperCase()}
                              value={entry.vitals[field]}
                              onChange={e => patchVitals(entry.id, field, e.target.value)} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Stack>
          </Paper>

        </Stack>
      </Grid>

      {/* PREVIEW */}
      <Grid size={{ xs:12, lg:5 }}>
        <Box sx={{ position:{ lg:'sticky' }, top:{ lg:16 } }}>
          <Paper sx={{ p:2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">Generated Sitrep</Typography>
              <Button size="small" variant="contained" startIcon={<ContentCopyIcon />} onClick={copy}>Copy</Button>
            </Box>
            <Box sx={{
              bgcolor:'grey.50', border:'1px solid', borderColor:'divider',
              borderRadius:1, p:2, fontFamily:'monospace', fontSize:12,
              lineHeight:1.8, whiteSpace:'pre-wrap',
              maxHeight:{ lg:'calc(100vh - 220px)' }, overflowY:'auto',
            }}>
              {generated}
            </Box>
          </Paper>
        </Box>
      </Grid>

    </Grid>
  );
};
