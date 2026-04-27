import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/Article';
import toast from 'react-hot-toast';
import signatureUrl from '../assets/signature.png';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];

const OFFICER_RANKS = ['ADM','VADM','RADM','COMMO','CAPT','CDR','LCDR','LTSG','LTJG','ENS','PENS','CCGIO'];
const ENLISTED_RANKS = ['SCPO','CPO','PO1','PO2','PO3','SW1','SW2','SN1','SN2','ASN','ASW','CGCM','OFT','3B'];
const ALL_RANKS = [...OFFICER_RANKS, ...ENLISTED_RANKS];

const STATUS_COLOR: Record<string, string> = {
  ASG: 'success', RNR: 'primary', SCHOOLING: 'warning', TDY: 'info', CONF: 'error', AWOL: 'error',
};

const UNIT = {
  org: 'CGMED STATION V',
  parentUnit: '',
  service: 'CGMED SERVICE',
  location: 'BLOCK 2 LOT 2 VILLA CESAR TOWNHOMES BRGY 99 DIT. TACLOBAN CITY 6500, LEYTE',
  certName: 'CAMILLE ANNE V BORBE MAC PCG',
  certGrade: 'LTJG',
  certArm: 'PCG',
  certPosition: 'NCO, CG MEDICAL STATION EASTERN VIS',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = 'ASG' | 'RNR' | 'SCHOOLING' | 'TDY' | 'CONF' | 'AWOL';

interface PersonnelEntry {
  id: string;
  rank: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  pcn: string;
  status: StatusType;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}

const DEFAULT_AUTHORIZED: Record<string, number> = { LTJG: 2, PO1: 1, SN1: 2, SN2: 3 };
const MRR_STORAGE_KEY = 'mrr_report_data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMemoLine(text: string): Partial<PersonnelEntry> | null {
  const upper = text.trim().toUpperCase();
  const rankMatch = upper.match(/^([A-Z0-9]+)\s+/);
  if (!rankMatch || !ALL_RANKS.includes(rankMatch[1])) return null;
  const rank = rankMatch[1];

  let status: StatusType = 'RNR';
  if (upper.includes('REST AND RECREATION') || upper.match(/\bRNR\b/)) status = 'RNR';
  else if (upper.includes('SCHOOLING')) status = 'SCHOOLING';
  else if (upper.includes('TEMPORARY DUTY') || upper.match(/\bTDY\b/)) status = 'TDY';
  else if (upper.includes('CONFINEMENT')) status = 'CONF';
  else if (upper.includes('AWOL')) status = 'AWOL';

  const pcnMatch = upper.match(/(\d{5,7})\s+PCG/);
  const pcn = pcnMatch ? pcnMatch[1] + ' PCG' : '';

  let dateFrom = '', dateTo = '';
  const drMatch = upper.match(/EFFECTIVE\s+(\d{1,2})-(\d{1,2})\s+([A-Z]+)\s+(\d{4})/);
  if (drMatch) {
    const d1 = parseInt(drMatch[1]), d2 = parseInt(drMatch[2]);
    const mi = MONTHS.indexOf(drMatch[3]);
    const yr = parseInt(drMatch[4]);
    if (mi >= 0) {
      const mm = String(mi + 1).padStart(2, '0');
      dateFrom = `${yr}-${mm}-${String(d1).padStart(2, '0')}`;
      dateTo   = `${yr}-${mm}-${String(d2).padStart(2, '0')}`;
    }
  }

  let lastName = '', firstName = '', middleInitial = '';
  if (pcnMatch) {
    const afterRank = upper.substring(rank.length).trim();
    const pcnPos = afterRank.indexOf(pcnMatch[1]);
    if (pcnPos > 0) {
      const parts = afterRank.substring(0, pcnPos).trim().split(/\s+/);
      lastName = parts[parts.length - 1];
      if (parts.length >= 3 && parts[parts.length - 2].length <= 2) {
        middleInitial = parts[parts.length - 2];
        firstName = parts.slice(0, -2).join(' ');
      } else if (parts.length >= 2) {
        firstName = parts.slice(0, -1).join(' ');
      }
    }
  }

  return { rank, lastName, firstName, middleInitial, pcn, status, dateFrom, dateTo };
}

function getCounts(
  day: number, monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
) {
  const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const result: Record<string, { auth:number; duty:number; tdy:number; rnr:number; school:number; conf:number; awol:number; totAbs:number }> = {};

  for (const rank of ALL_RANKS) {
    let rnr = 0, school = 0, tdy = 0, conf = 0, awol = 0;
    for (const e of entries) {
      if (e.rank !== rank || !e.dateFrom || !e.dateTo) continue;
      if (dateStr >= e.dateFrom && dateStr <= e.dateTo && e.status !== 'ASG') {
        if (e.status === 'RNR') rnr++;
        else if (e.status === 'SCHOOLING') school++;
        else if (e.status === 'TDY') tdy++;
        else if (e.status === 'CONF') conf++;
        else if (e.status === 'AWOL') awol++;
      }
    }
    const auth = authorized[rank] || 0;
    const totAbs = rnr + school + tdy + conf + awol;
    result[rank] = { auth, duty: Math.max(0, auth - totAbs), tdy, rnr, school, conf, awol, totAbs };
  }
  return result;
}

// ─── Excel generation ─────────────────────────────────────────────────────────

type RowCells = string; // concatenated <td> HTML for one <tr>

const td = (content: string | number, opts: {
  cs?: number; rs?: number; bold?: boolean; left?: boolean;
  bg?: string; fs?: string; vt?: boolean;
} = {}): string => {
  const align  = opts.left ? 'left' : 'center';
  const weight = opts.bold ? 'font-weight:bold;' : '';
  const bg     = opts.bg   ? `background-color:${opts.bg};` : '';
  const fs     = `font-size:${opts.fs || '7.5pt'};`;
  const wr     = opts.vt   ? 'writing-mode:tb-rl;text-orientation:mixed;' : '';
  const style  = `border:1px solid #000;padding:1px 2px;text-align:${align};vertical-align:middle;font-family:Arial;${fs}${weight}${bg}${wr}`;
  const cs     = opts.cs   ? ` colspan="${opts.cs}"` : '';
  const rs     = opts.rs   ? ` rowspan="${opts.rs}"` : '';
  const val    = (content === 0 || content === '') ? '&nbsp;' : String(content);
  return `<td${cs}${rs} style="${style}">${val}</td>`;
};

const sp = (): string => '<td style="border:none;width:12pt;">&nbsp;</td>';

function buildReportRows(
  day: number, monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
  endingTime: string,
  sigBase64: string,
): RowCells[] {
  const C = 9;
  const counts = getCounts(day, monthIdx, year, authorized, entries);
  const monthName = MONTHS[monthIdx];
  const dd = String(day).padStart(2, '0');
  const rows: RowCells[] = [];

  // ── Header ──
  rows.push(td('RESTRICTED', { cs: C, bold: true }));
  rows.push(td('&nbsp;', { cs: C }));
  rows.push(td('MORNING REPORT', { cs: C, bold: true, fs: '10pt' }));
  rows.push(
    td(`ENDING: ${endingTime}`, { cs: 3, left: true }) +
    td(`DAY: ${dd}`, { cs: 2 }) +
    td(`MONTH: ${monthName}`, { cs: 2 }) +
    td(`YEAR: ${year}`, { cs: 2 }),
  );
  rows.push(
    td(`ORGANIZATION (HQ, CO, DET, ETC): ${UNIT.org}`, { cs: 5, left: true }) +
    td(`(PARENT UNIT): ${UNIT.parentUnit}`, { cs: 2, left: true }) +
    td(UNIT.service, { cs: 2, left: true }),
  );
  rows.push(td(`STATION OR LOCATION: ${UNIT.location}`, { cs: C, left: true }));
  rows.push(td('&nbsp;', { cs: C }));

  // ── Column headers (2 rows) ──
  // Row 1: RANK | PRESENT (3) | ABSENT (5)
  rows.push(
    td('RANK', { rs: 2, bold: true, fs: '7pt' }) +
    td('PRESENT', { cs: 3, bold: true }) +
    td('ABSENT', { cs: 5, bold: true }),
  );
  // Row 2: AUTH DUTY TDY | RNR SCH CONF AWL TOT
  rows.push(
    td('AUTH', { bold: true, fs: '7pt' }) +
    td('DUTY', { bold: true, fs: '7pt' }) +
    td('TDY',  { bold: true, fs: '7pt' }) +
    td('RNR',  { bold: true, fs: '7pt' }) +
    td('SCH',  { bold: true, fs: '7pt' }) +
    td('CONF', { bold: true, fs: '7pt' }) +
    td('AWL',  { bold: true, fs: '7pt' }) +
    td('TOT',  { bold: true, fs: '7pt' }),
  );

  // ── Rank rows + totals ──
  const dataRow = (rank: string, c: ReturnType<typeof getCounts>[string]): RowCells => {
    const show = c.auth > 0 || c.totAbs > 0;
    return (
      td(rank, { left: true }) +
      td(show ? c.auth  : '') +
      td(show ? c.duty  : '') +
      td(c.tdy   || '') +
      td(c.rnr   || '') +
      td(c.school|| '') +
      td(c.conf  || '') +
      td(c.awol  || '') +
      td(c.totAbs|| '')
    );
  };

  const sumGroup = (ranks: string[]) => {
    let auth=0, duty=0, tdy=0, rnr=0, school=0, conf=0, awol=0, totAbs=0;
    for (const r of ranks) {
      auth   += counts[r].auth;
      duty   += counts[r].duty;
      tdy    += counts[r].tdy;
      rnr    += counts[r].rnr;
      school += counts[r].school;
      conf   += counts[r].conf;
      awol   += counts[r].awol;
      totAbs += counts[r].totAbs;
    }
    return { auth, duty, tdy, rnr, school, conf, awol, totAbs };
  };

  for (const rank of OFFICER_RANKS)  rows.push(dataRow(rank, counts[rank]));
  const offTot = sumGroup(OFFICER_RANKS);
  rows.push(
    td('TOTAL', { bold: true, left: true }) +
    td(offTot.auth || '') +
    td(offTot.duty || '') +
    td(offTot.tdy   || '') +
    td(offTot.rnr   || '') +
    td(offTot.school|| '') +
    td(offTot.conf  || '') +
    td(offTot.awol  || '') +
    td(offTot.totAbs|| ''),
  );

  for (const rank of ENLISTED_RANKS) rows.push(dataRow(rank, counts[rank]));
  const enlTot = sumGroup(ENLISTED_RANKS);
  rows.push(
    td('TOTAL', { bold: true, left: true }) +
    td(enlTot.auth || '') +
    td(enlTot.duty || '') +
    td(enlTot.tdy   || '') +
    td(enlTot.rnr   || '') +
    td(enlTot.school|| '') +
    td(enlTot.conf  || '') +
    td(enlTot.awol  || '') +
    td(enlTot.totAbs|| ''),
  );

  rows.push(td('OVER', { left: true }) + td('') + td('') + td('') + td('') + td('') + td('') + td('') + td(''));

  const grandTot = sumGroup(ALL_RANKS);
  rows.push(
    td('TOTAL', { bold: true, left: true }) +
    td(grandTot.auth || '') +
    td(grandTot.duty || '') +
    td(grandTot.tdy   || '') +
    td(grandTot.rnr   || '') +
    td(grandTot.school|| '') +
    td(grandTot.conf  || '') +
    td(grandTot.awol  || '') +
    td(grandTot.totAbs|| ''),
  );

  // ── Signature block ──
  rows.push(td('&nbsp;', { cs: C }));
  rows.push(
    td('I CERTIFY THAT THIS MORNING REPORT IS CORRECT', { cs: 5, left: true }) +
    td('PAGE', { cs: 2 }) +
    td('OF PAGES', { cs: 2 }),
  );
  const sigCell = sigBase64
    ? `<td colspan="4" style="border:1px solid #000;padding:1px;text-align:center;vertical-align:middle;"><img src="${sigBase64}" style="height:36pt;max-width:100%;"/></td>`
    : td('SIGNATURE:', { cs: 4, left: true });
  rows.push(sigCell + td(`NAME (TYPE OR PRINTED): ${UNIT.certName}`, { cs: 5, left: true }));
  rows.push(
    td(`GRADE: ${UNIT.certGrade}`, { cs: 2 }) +
    td(`ARM OF SERVICE: ${UNIT.certArm}`, { cs: 2 }) +
    td(`POSITION OR DESIGNATION: ${UNIT.certPosition}`, { cs: 5, left: true }),
  );
  rows.push(
    td('APP AGO FORM NR 1', { cs: 3, left: true }) +
    td('(10 JULY 1956)', { cs: 3, left: true }) +
    td('S— 87', { cs: 3 }),
  );

  return rows;
}

function generateMRRExcel(
  monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
  endingTime: string,
  sigBase64: string,
) {
  const monthName = MONTHS[monthIdx];
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  interface SheetDef { name: string; day1: number; day2: number | null }
  const sheetDefs: SheetDef[] = [];
  for (let d = 1; d <= daysInMonth; d += 2) {
    const d2 = d + 1 <= daysInMonth ? d + 1 : null;
    sheetDefs.push({ name: d2 ? `${d}-${d2} ${monthName}` : `${d} ${monthName}`, day1: d, day2: d2 });
  }

  const sheetNamesXml = sheetDefs.map(s =>
    `<x:ExcelWorksheet><x:Name>${s.name}</x:Name><x:WorksheetOptions>` +
    `<x:PageSetup><x:Layout x:Orientation="Landscape"/></x:PageSetup>` +
    `<x:FitToPage/></x:WorksheetOptions></x:ExcelWorksheet>`
  ).join('');

  // Column widths for one report (rank + 8 data cols)
  const colW = [45, 22, 22, 22, 22, 22, 22, 22, 22]; // pt
  const colgroup = [
    ...colW.map(w => `<col style="width:${w}pt;mso-column-width:${w}pt">`),
    `<col style="width:12pt;mso-column-width:12pt">`, // spacer
    ...colW.map(w => `<col style="width:${w}pt;mso-column-width:${w}pt">`),
  ].join('');

  const tablesHtml = sheetDefs.map(({ day1, day2 }) => {
    const rows1 = buildReportRows(day1, monthIdx, year, authorized, entries, endingTime, sigBase64);
    const rows2 = day2 !== null
      ? buildReportRows(day2, monthIdx, year, authorized, entries, endingTime, sigBase64)
      : null;

    const maxLen = Math.max(rows1.length, rows2 ? rows2.length : 0);
    const trRows: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      const c1 = rows1[i] ?? td('&nbsp;', { cs: 9 });
      if (rows2) {
        const c2 = rows2[i] ?? td('&nbsp;', { cs: 9 });
        trRows.push(`<tr>${c1}${sp()}${c2}</tr>`);
      } else {
        trRows.push(`<tr>${c1}</tr>`);
      }
    }

    return `<table><colgroup>${colgroup}</colgroup>${trRows.join('')}</table>`;
  }).join('<br clear="all">');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets>${sheetNamesXml}</x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]--></head>
<body>${tablesHtml}</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MRR-${monthName}-${year}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MRRReportPage: React.FC = () => {
  const now = new Date();
  const [monthIdx, setMonthIdx]     = useState(now.getMonth());
  const [year, setYear]             = useState(now.getFullYear());
  const [endingTime, setEndingTime] = useState('2400H');
  const [authorized, setAuthorized] = useState<Record<string, number>>({ ...DEFAULT_AUTHORIZED });
  const [entries, setEntries]       = useState<PersonnelEntry[]>([]);
  const [memoPaste, setMemoPaste]   = useState('');
  const [sigBase64, setSigBase64]   = useState('');
  const [showRoster, setShowRoster] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [form, setForm] = useState<Partial<PersonnelEntry>>({ status: 'RNR' });

  // Load signature as base64 for embedding in Excel
  useEffect(() => {
    fetch(signatureUrl)
      .then(r => r.blob())
      .then(blob => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      }))
      .then(setSigBase64)
      .catch(() => {});
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MRR_STORAGE_KEY) || '{}');
      if (saved.authorized) setAuthorized(saved.authorized);
      if (saved.entries)    setEntries(saved.entries);
      if (saved.monthIdx !== undefined) setMonthIdx(saved.monthIdx);
      if (saved.year)       setYear(saved.year);
      if (saved.endingTime) setEndingTime(saved.endingTime);
    } catch {}
  }, []);

  const persist = (
    auth  = authorized,
    entr  = entries,
    mIdx  = monthIdx,
    yr    = year,
    eTime = endingTime,
  ) => {
    localStorage.setItem(MRR_STORAGE_KEY, JSON.stringify({ authorized: auth, entries: entr, monthIdx: mIdx, year: yr, endingTime: eTime }));
  };

  const handleParseMemo = () => {
    const lines = memoPaste.split('\n').filter(l => l.trim());
    const newEntries: PersonnelEntry[] = [...entries];
    let added = 0;
    for (const line of lines) {
      const p = parseMemoLine(line);
      if (p && p.rank) {
        newEntries.push({
          id:             Date.now().toString() + Math.random(),
          rank:           p.rank!,
          lastName:       p.lastName || '',
          firstName:      p.firstName || '',
          middleInitial:  p.middleInitial || '',
          pcn:            p.pcn || '',
          status:         p.status || 'RNR',
          dateFrom:       p.dateFrom || '',
          dateTo:         p.dateTo || '',
        });
        added++;
      }
    }
    if (added > 0) {
      setEntries(newEntries);
      persist(authorized, newEntries);
      setMemoPaste('');
      toast.success(`Parsed ${added} entr${added === 1 ? 'y' : 'ies'}`);
    } else {
      toast.error('No valid entries found — check rank and format');
    }
  };

  const handleAddManual = () => {
    if (!form.rank || !form.dateFrom || !form.dateTo) {
      toast.error('Rank, Date From, and Date To are required');
      return;
    }
    const entry: PersonnelEntry = {
      id:            Date.now().toString(),
      rank:          form.rank!,
      lastName:      form.lastName || '',
      firstName:     form.firstName || '',
      middleInitial: form.middleInitial || '',
      pcn:           form.pcn || '',
      status:        (form.status as StatusType) || 'RNR',
      dateFrom:      form.dateFrom!,
      dateTo:        form.dateTo!,
    };
    const newEntries = [...entries, entry];
    setEntries(newEntries);
    persist(authorized, newEntries);
    setForm({ status: 'RNR' });
    toast.success('Entry added');
  };

  const handleDeleteEntry = (id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    persist(authorized, newEntries);
  };

  const handleSetAuth = (rank: string, val: string) => {
    const n = parseInt(val) || 0;
    const newAuth = { ...authorized, [rank]: n };
    if (n === 0) delete newAuth[rank];
    setAuthorized(newAuth);
    persist(newAuth, entries);
  };

  const handleDownload = () => {
    generateMRRExcel(monthIdx, year, authorized, entries, endingTime, sigBase64);
    toast.success('Generating workbook…');
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day} ${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* ── Title ── */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <ArticleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>MRR Report</Typography>
          <Typography variant="caption" color="text.secondary">
            Morning Report — AGO Form No. 1
          </Typography>
        </Box>
      </Stack>

      {/* ── Settings row ── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Report Settings
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={monthIdx}
              label="Month"
              onChange={e => { const v = e.target.value as number; setMonthIdx(v); persist(authorized, entries, v, year, endingTime); }}
            >
              {MONTHS.map((m, i) => <MenuItem key={m} value={i}>{m}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            size="small" label="Year" type="number" value={year} sx={{ width: 100 }}
            onChange={e => { const v = parseInt(e.target.value) || year; setYear(v); persist(authorized, entries, monthIdx, v, endingTime); }}
          />

          <TextField
            size="small" label="Ending Time" value={endingTime} sx={{ width: 120 }}
            onChange={e => { setEndingTime(e.target.value); persist(authorized, entries, monthIdx, year, e.target.value); }}
          />
        </Stack>
      </Paper>

      {/* ── Authorized Roster ── */}
      <Paper sx={{ mb: 2 }}>
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
          onClick={() => setShowRoster(v => !v)}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Authorized Strength Roster
          </Typography>
          <IconButton size="small">{showRoster ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Stack>
        <Collapse in={showRoster}>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Set the authorized (total) count per rank. Leave blank or 0 if none.
            </Typography>
            <Grid container spacing={1}>
              {ALL_RANKS.map(rank => (
                <Grid key={rank} size={{ xs: 6, sm: 4, md: 3 }}>
                  <TextField
                    size="small" label={rank} type="number"
                    value={authorized[rank] || ''}
                    onChange={e => handleSetAuth(rank, e.target.value)}
                    slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* ── Personnel Status Entries ── */}
      <Paper sx={{ mb: 2 }}>
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Personnel Status Entries
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small" variant="outlined" startIcon={<ArticleIcon />}
              onClick={() => setShowManual(false)}
            >
              Paste Memo
            </Button>
            <Button
              size="small" variant="outlined" startIcon={<AddIcon />}
              onClick={() => setShowManual(true)}
            >
              Manual Add
            </Button>
          </Stack>
        </Stack>
        <Divider />

        {/* Paste Memo panel */}
        {!showManual && (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Paste one line per person. Example format:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontFamily: 'monospace', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
              SN1 LYNDON HARLIE F LIM 012544 PCG GRANTED FIFTEEN (15) DAYS REST AND RECREATION EFFECTIVE 13-27 APRIL 2026
            </Typography>
            <TextField
              multiline rows={4} fullWidth size="small"
              placeholder="Paste memorandum lines here…"
              value={memoPaste}
              onChange={e => setMemoPaste(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <Button variant="contained" onClick={handleParseMemo} disabled={!memoPaste.trim()}>
              Parse &amp; Add
            </Button>
          </Box>
        )}

        {/* Manual Add panel */}
        {showManual && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Rank *</InputLabel>
                  <Select value={form.rank || ''} label="Rank *" onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}>
                    {ALL_RANKS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status *</InputLabel>
                  <Select value={form.status || 'RNR'} label="Status *" onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusType }))}>
                    {(['ASG','RNR','SCHOOLING','TDY','CONF','AWOL'] as StatusType[]).map(s =>
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField size="small" fullWidth label="Date From *" type="date" value={form.dateFrom || ''}
                  onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField size="small" fullWidth label="Date To *" type="date" value={form.dateTo || ''}
                  onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Last Name" value={form.lastName || ''}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value.toUpperCase() }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="First Name" value={form.firstName || ''}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value.toUpperCase() }))} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField size="small" fullWidth label="MI" value={form.middleInitial || ''}
                  onChange={e => setForm(f => ({ ...f, middleInitial: e.target.value.toUpperCase() }))} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField size="small" fullWidth label="PCN" value={form.pcn || ''}
                  onChange={e => setForm(f => ({ ...f, pcn: e.target.value.toUpperCase() }))} />
              </Grid>
            </Grid>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddManual}>
              Add Entry
            </Button>
          </Box>
        )}
      </Paper>

      {/* ── Entries list ── */}
      {entries.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Status Entries ({entries.length})
            </Typography>
            <Button size="small" color="error" onClick={() => {
              if (window.confirm('Clear all entries?')) { setEntries([]); persist(authorized, []); }
            }}>
              Clear All
            </Button>
          </Stack>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><b>Rank</b></TableCell>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>PCN</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>From</b></TableCell>
                  <TableCell><b>To</b></TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell><b>{e.rank}</b></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {[e.lastName, e.firstName, e.middleInitial].filter(Boolean).join(', ')}
                    </TableCell>
                    <TableCell>{e.pcn}</TableCell>
                    <TableCell>
                      <Chip
                        label={e.status} size="small"
                        color={(STATUS_COLOR[e.status] || 'default') as 'success'|'primary'|'warning'|'info'|'error'|'default'}
                      />
                    </TableCell>
                    <TableCell>{fmtDate(e.dateFrom)}</TableCell>
                    <TableCell>{fmtDate(e.dateTo)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleDeleteEntry(e.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Download ── */}
      <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Download Workbook
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generates one Excel workbook for {MONTHS[monthIdx]} {year} — one sheet per 2-day period, two reports side by side.
            </Typography>
          </Box>
          <Button
            variant="contained" size="large" startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download {MONTHS[monthIdx].slice(0, 3)} {year} MRR.xls
          </Button>
        </Stack>
      </Paper>

      {/* Save reminder */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" startIcon={<SaveIcon />} onClick={() => { persist(); toast.success('Settings saved'); }}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};
