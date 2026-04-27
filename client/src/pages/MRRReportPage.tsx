import React, { useState, useEffect, useRef } from 'react';
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
import PreviewIcon from '@mui/icons-material/Preview';
import toast from 'react-hot-toast';
import signatureUrl from '../assets/signature.png';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];

const OFFICER_RANKS  = ['ADM','VADM','RADM','COMMO','CAPT','CDR','LCDR','LTSG','LTJG','ENS','PENS','CCGIO'];
const ENLISTED_RANKS = ['SCPO','CPO','PO1','PO2','PO3','SW1','SW2','SN1','SN2','ASN','ASW','CGCM','OFT','3B'];
const ALL_RANKS      = [...OFFICER_RANKS, ...ENLISTED_RANKS];

const STATUS_COLOR: Record<string, 'success'|'primary'|'warning'|'info'|'error'|'default'> = {
  ASG:'success', RNR:'primary', SCHOOLING:'warning', TDY:'info', CONF:'error', AWOL:'error',
};

const UNIT = {
  org:         'CGMED STATION V',
  parentUnit:  '',
  service:     'CGMED SERVICE',
  location:    'BLOCK 2 LOT 2 VILLA CESAR TOWNHOMES BRGY 99 DIT. TACLOBAN CITY 6500, LEYTE',
  certName:    'CAMILLE ANNE V BORBE MAC PCG',
  certGrade:   'LTJG',
  certArm:     'PCG',
  certPosition:'NCO, CG MEDICAL STATION EASTERN VIS',
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

interface RankCounts {
  auth: number;   // authorized
  asg:  number;   // (1) assigned present
  ds:   number;   // (2) detached service
  tdyP: number;   // (3) TDY/DS present
  totP: number;   // (4) total present
  au:   number;   // (5) authorized/unassigned
  duty: number;   // (6) absent-for duty
  utf:  number;   // (7) unfit
  tdyA: number;   // (8) TDY/DS absent
  rnr:  number;   // (9) RNR
  conf: number;   // (10) confinement
  fur:  number;   // (11) furlough
  awol: number;   // (12) AWOL
  sch:  number;   // (13) schooling
}

const DEFAULT_AUTHORIZED: Record<string, number> = { LTJG:2, PO1:1, SN1:2, SN2:3 };
const MRR_STORAGE_KEY = 'mrr_report_data';

// ─── Parse memo ───────────────────────────────────────────────────────────────

function parseMemoLine(text: string): Partial<PersonnelEntry> | null {
  const upper = text.trim().toUpperCase();
  const rankMatch = upper.match(/^([A-Z0-9]+)\s+/);
  if (!rankMatch || !ALL_RANKS.includes(rankMatch[1])) return null;
  const rank = rankMatch[1];

  let status: StatusType = 'RNR';
  if (upper.includes('REST AND RECREATION') || upper.match(/\bRNR\b/)) status = 'RNR';
  else if (upper.includes('SCHOOLING'))                                  status = 'SCHOOLING';
  else if (upper.includes('TEMPORARY DUTY')  || upper.match(/\bTDY\b/)) status = 'TDY';
  else if (upper.includes('CONFINEMENT'))                                status = 'CONF';
  else if (upper.includes('AWOL'))                                       status = 'AWOL';

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
      dateFrom = `${yr}-${mm}-${String(d1).padStart(2,'0')}`;
      dateTo   = `${yr}-${mm}-${String(d2).padStart(2,'0')}`;
    }
  }

  let lastName='', firstName='', middleInitial='';
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

// ─── Count computation ────────────────────────────────────────────────────────

function getCounts(
  day: number, monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
): Record<string, RankCounts> {
  const dateStr = `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const result: Record<string, RankCounts> = {};

  for (const rank of ALL_RANKS) {
    let tdyA=0, rnr=0, conf=0, awol=0, sch=0;
    for (const e of entries) {
      if (e.rank !== rank || !e.dateFrom || !e.dateTo) continue;
      if (dateStr >= e.dateFrom && dateStr <= e.dateTo && e.status !== 'ASG') {
        if      (e.status === 'TDY')       tdyA++;
        else if (e.status === 'RNR')       rnr++;
        else if (e.status === 'CONF')      conf++;
        else if (e.status === 'AWOL')      awol++;
        else if (e.status === 'SCHOOLING') sch++;
      }
    }
    const auth    = authorized[rank] || 0;
    const totAbs  = tdyA + rnr + conf + awol + sch;
    const asg     = Math.max(0, auth - totAbs);
    result[rank] = {
      auth, asg, ds:0, tdyP:0, totP:asg, au:auth,
      duty:0, utf:0, tdyA, rnr, conf, fur:0, awol, sch,
    };
  }
  return result;
}

// ─── Sentence construction ───────────────────────────────────────────────────

const SPELL = [
  '','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN',
  'ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN',
  'EIGHTEEN','NINETEEN','TWENTY','TWENTY-ONE','TWENTY-TWO','TWENTY-THREE',
  'TWENTY-FOUR','TWENTY-FIVE','TWENTY-SIX','TWENTY-SEVEN','TWENTY-EIGHT',
  'TWENTY-NINE','THIRTY','THIRTY-ONE',
];

function spellDays(n: number): string { return SPELL[n] || String(n); }

const STATUS_TEXT: Record<StatusType, string> = {
  ASG:      'ASSIGNED',
  RNR:      'REST AND RECREATION',
  SCHOOLING:'SCHOOLING',
  TDY:      'TEMPORARY DUTY',
  CONF:     'CONFINEMENT',
  AWOL:     'ABSENCE WITHOUT LEAVE',
};

function constructSentence(e: PersonnelEntry): string {
  const name = [e.firstName, e.middleInitial, e.lastName].filter(Boolean).join(' ') || '___';
  const pcn  = e.pcn || '______';

  if (!e.dateFrom || !e.dateTo) {
    return `${e.rank} ${name} ${pcn} IS ON ${STATUS_TEXT[e.status]}`;
  }

  const from = new Date(e.dateFrom + 'T00:00:00');
  const to   = new Date(e.dateTo   + 'T00:00:00');
  const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const fromDay = from.getDate();
  const toDay   = to.getDate();
  const fromMon = MONTHS[from.getMonth()];
  const toMon   = MONTHS[to.getMonth()];
  const toYr    = to.getFullYear();

  const dateRange = fromMon === toMon
    ? `${fromDay}-${toDay} ${fromMon} ${toYr}`
    : `${fromDay} ${fromMon} - ${toDay} ${toMon} ${toYr}`;

  return `${e.rank} ${name} ${pcn} GRANTED ${spellDays(days)} (${days}) DAYS ${STATUS_TEXT[e.status]} EFFECTIVE ${dateRange}`;
}

// ─── Excel HTML generation ────────────────────────────────────────────────────

/** Build one <td> cell */
const td = (
  content: string | number,
  opts: { cs?:number; rs?:number; bold?:boolean; left?:boolean; bg?:string; fs?:string; vt?:boolean } = {},
): string => {
  const a = opts.left ? 'left' : 'center';
  const w = opts.bold ? 'font-weight:bold;' : '';
  const b = opts.bg   ? `background-color:${opts.bg};` : '';
  const f = `font-size:${opts.fs || '7.5pt'};`;
  const r = opts.vt   ? 'mso-rotate:90;writing-mode:tb-rl;' : '';
  const style = `border:1px solid #000;padding:1px 2px;text-align:${a};vertical-align:middle;font-family:Arial;${f}${w}${b}${r}`;
  const cs = opts.cs ? ` colspan="${opts.cs}"` : '';
  const rs = opts.rs ? ` rowspan="${opts.rs}"` : '';
  const v  = (content === 0 || content === '') ? '&nbsp;' : String(content);
  return `<td${cs}${rs} style="${style}">${v}</td>`;
};

/** Spacer column between two side-by-side reports */
const spacer = (): string => '<td style="border:none;width:10pt;">&nbsp;</td>';

/**
 * Builds an array of row-cell strings (each string is the concatenated <td> elements for one <tr>)
 * for one day's morning report. Total columns = C = 14 (rank + 13 status).
 */
function buildReportRows(
  day: number, monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
  endingTime: string,
  /** If true, render an <img> tag for signature (browser preview); if false, use text */
  showSigImg: boolean,
  sigSrc: string,
): string[] {
  const C  = 14; // rank col + 13 status cols
  const ct = getCounts(day, monthIdx, year, authorized, entries);
  const mn = MONTHS[monthIdx];
  const dd = String(day).padStart(2, '0');
  const rows: string[] = [];

  // ── Form header ──
  rows.push(td('RESTRICTED', { cs:C, bold:true }));
  rows.push(td('&nbsp;', { cs:C }));
  rows.push(td('MORNING REPORT', { cs:C, bold:true, fs:'10pt' }));
  rows.push(
    td(`ENDING: ${endingTime}`, { cs:3, left:true }) +
    td(`DAY: ${dd}`, { cs:3 }) +
    td(`MONTH: ${mn}`, { cs:4 }) +
    td(`YEAR: ${year}`, { cs:4 }),
  );
  rows.push(
    td(`ORGANIZATION (HQ, CO, DET, ETC): ${UNIT.org}`, { cs:6, left:true }) +
    td(`(PARENT UNIT): ${UNIT.parentUnit}`, { cs:4, left:true }) +
    td(UNIT.service, { cs:4, left:true }),
  );
  rows.push(td(`STATION OR LOCATION: ${UNIT.location}`, { cs:C, left:true }));

  // Constructed sentences — personnel on special status active on this specific day
  const dateStr = `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const activeSentences = entries
    .filter(e => e.status !== 'ASG' && e.dateFrom && e.dateTo && dateStr >= e.dateFrom && dateStr <= e.dateTo)
    .map(constructSentence);
  rows.push(
    `<td colspan="${C}" style="border:1px solid #000;padding:2px 4px;text-align:left;vertical-align:top;font-family:Arial;font-size:7.5pt;word-wrap:break-word;">`+
    `${activeSentences.join('<br>') || '&nbsp;'}</td>`,
  );

  rows.push(td('&nbsp;', { cs:C }));

  // ── Column headers — 3 rows ──
  // Row 1: name | PRESENT(5) | ABSENT(8)
  rows.push(
    td('(LAST NAME, FIRST NAME, MI)', { cs:1, rs:3, bold:true, fs:'7pt' }) +
    td('PRESENT', { cs:5, bold:true }) +
    td('ABSENT',  { cs:8, bold:true }),
  );
  // Row 2: abbreviated vertical labels for each status column
  rows.push(
    // PRESENT (5)
    td('ASG',   { bold:true, fs:'6.5pt', vt:true }) +
    td('DS',    { bold:true, fs:'6.5pt', vt:true }) +
    td('TDY/DS',{ bold:true, fs:'6.5pt', vt:true }) +
    td('TOTAL', { bold:true, fs:'6.5pt', vt:true }) +
    td('A/U',   { bold:true, fs:'6.5pt', vt:true }) +
    // ABSENT (8)
    td('FOR DUTY',  { bold:true, fs:'6.5pt', vt:true }) +
    td('UNFIT',     { bold:true, fs:'6.5pt', vt:true }) +
    td('TDY/DS',    { bold:true, fs:'6.5pt', vt:true }) +
    td('RNR',       { bold:true, fs:'6.5pt', vt:true }) +
    td('CONF',      { bold:true, fs:'6.5pt', vt:true }) +
    td('FUR',       { bold:true, fs:'6.5pt', vt:true }) +
    td('AWOL',      { bold:true, fs:'6.5pt', vt:true }) +
    td('SCHOOLING', { bold:true, fs:'6.5pt', vt:true }),
  );
  // Row 3: column numbers (1)–(13)
  rows.push(Array.from({length:13}, (_,i) => td(`(${i+1})`, { fs:'6.5pt' })).join(''));

  // ── Helper: one data row ──
  const dataRow = (label: string, c: RankCounts, isBold = false): string => {
    const show = c.auth > 0 || c.rnr > 0 || c.sch > 0 || c.tdyA > 0 || c.conf > 0 || c.awol > 0;
    return (
      td(label, { left:true, bold:isBold }) +
      td(show ? c.asg  : '') +
      td(c.ds   || '') +
      td(c.tdyP || '') +
      td(show ? c.totP : '') +
      td(show ? c.au   : '') +
      td(c.duty || '') +
      td(c.utf  || '') +
      td(c.tdyA || '') +
      td(c.rnr  || '') +
      td(c.conf || '') +
      td(c.fur  || '') +
      td(c.awol || '') +
      td(c.sch  || '')
    );
  };

  const sumGroup = (ranks: string[]): RankCounts => {
    const s: RankCounts = { auth:0, asg:0, ds:0, tdyP:0, totP:0, au:0, duty:0, utf:0, tdyA:0, rnr:0, conf:0, fur:0, awol:0, sch:0 };
    for (const r of ranks) {
      const c = ct[r];
      (Object.keys(s) as (keyof RankCounts)[]).forEach(k => { s[k] += c[k]; });
    }
    return s;
  };

  // ── Officer rows ──
  for (const r of OFFICER_RANKS)  rows.push(dataRow(r,  ct[r]));
  const offT = sumGroup(OFFICER_RANKS);
  rows.push(dataRow('TOTAL', offT, true));

  // ── Enlisted rows ──
  for (const r of ENLISTED_RANKS) rows.push(dataRow(r,  ct[r]));
  const enlT = sumGroup(ENLISTED_RANKS);
  rows.push(dataRow('TOTAL', enlT, true));

  // OVER
  rows.push(td('OVER', { left:true }) + Array(13).fill(td('')).join(''));

  // Grand total
  const grandT = sumGroup(ALL_RANKS);
  rows.push(dataRow('TOTAL', grandT, true));

  // ── Signature block ──
  rows.push(td('&nbsp;', { cs:C }));
  rows.push(
    td('I CERTIFY THAT THIS MORNING REPORT IS CORRECT', { cs:8, left:true }) +
    td('PAGE', { cs:3 }) +
    td('OF PAGES', { cs:3 }),
  );

  const sigCell = (showSigImg && sigSrc)
    ? `<td colspan="5" style="border:1px solid #000;padding:2px;text-align:center;vertical-align:middle;"><img src="${sigSrc}" style="height:38pt;max-width:100%;"/></td>`
    : td('SIGNATURE', { cs:5, left:true });
  rows.push(sigCell + td(`NAME (TYPE OR PRINTED): ${UNIT.certName}`, { cs:9, left:true }));
  rows.push(
    td(`GRADE: ${UNIT.certGrade}`, { cs:3 }) +
    td(`ARM OF SERVICE: ${UNIT.certArm}`, { cs:3 }) +
    td(`POSITION OR DESIGNATION: ${UNIT.certPosition}`, { cs:8, left:true }),
  );
  rows.push(
    td('APP AGO FORM NR 1', { cs:4, left:true }) +
    td('(10 JULY 1956)', { cs:5, left:true }) +
    td('S— 87', { cs:5 }),
  );

  return rows;
}

/** Generate multi-sheet .xls for the whole month */
function generateMRRExcel(
  monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
  endingTime: string,
) {
  const monthName   = MONTHS[monthIdx];
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const sheetDefs: { name:string; day1:number; day2:number|null }[] = [];
  for (let d = 1; d <= daysInMonth; d += 2) {
    const d2 = d + 1 <= daysInMonth ? d + 1 : null;
    sheetDefs.push({ name: d2 ? `${d}-${d2} ${monthName}` : `${d} ${monthName}`, day1:d, day2:d2 });
  }

  const sheetNamesXml = sheetDefs.map(s =>
    `<x:ExcelWorksheet><x:Name>${s.name}</x:Name>` +
    `<x:WorksheetOptions><x:PageSetup><x:Layout x:Orientation="Landscape"/></x:PageSetup>` +
    `<x:FitToPage/></x:WorksheetOptions></x:ExcelWorksheet>`
  ).join('');

  // Column widths: rank(1) + 5 present cols + 8 absent cols = 14 cols per report
  const colW = [48, 18,16,16,18,18, 16,16,16,18,16,16,18,20]; // pt, length=14
  const makeColgroup = () => [
    ...colW.map(w => `<col style="width:${w}pt;mso-column-width:${w}pt">`),
    `<col style="width:10pt;mso-column-width:10pt">`, // spacer
    ...colW.map(w => `<col style="width:${w}pt;mso-column-width:${w}pt">`),
  ].join('');

  const tablesHtml = sheetDefs.map(({ day1, day2 }) => {
    // No image in Excel (base64 images not supported in html-xls)
    const r1 = buildReportRows(day1, monthIdx, year, authorized, entries, endingTime, false, '');
    const r2 = day2 !== null
      ? buildReportRows(day2, monthIdx, year, authorized, entries, endingTime, false, '')
      : null;

    const maxLen = Math.max(r1.length, r2 ? r2.length : 0);
    const trs = Array.from({ length: maxLen }, (_, i) => {
      const c1 = r1[i] ?? td('&nbsp;', { cs:14 });
      if (r2) {
        const c2 = r2[i] ?? td('&nbsp;', { cs:14 });
        return `<tr>${c1}${spacer()}${c2}</tr>`;
      }
      return `<tr>${c1}</tr>`;
    });

    return `<table><colgroup>${makeColgroup()}</colgroup>${trs.join('')}</table>`;
  }).join('<br clear="all">');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets>${sheetNamesXml}</x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]--></head>
<body>${tablesHtml}</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `MRR-${monthName}-${year}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build a standalone HTML page string for one day's report (used in preview iframe) */
function buildPreviewHtml(
  day: number, monthIdx: number, year: number,
  authorized: Record<string, number>,
  entries: PersonnelEntry[],
  endingTime: string,
  sigSrc: string,
): string {
  const rows = buildReportRows(day, monthIdx, year, authorized, entries, endingTime, true, sigSrc);
  const trs  = rows.map(r => `<tr>${r}</tr>`).join('');
  const colW = [48, 18,16,16,18,18, 16,16,16,18,16,16,18,20];
  const cols  = colW.map(w => `<col style="width:${w}pt">`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial; font-size: 8pt; margin: 16px; }
  table { border-collapse: collapse; }
  td { border: 1px solid #000; padding: 2px 3px; vertical-align: middle; text-align: center; white-space: nowrap; font-size: 7.5pt; }
</style></head><body>
<table><colgroup>${cols}</colgroup>${trs}</table>
</body></html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MRRReportPage: React.FC = () => {
  const now = new Date();
  const [monthIdx,    setMonthIdx]    = useState(now.getMonth());
  const [year,        setYear]        = useState(now.getFullYear());
  const [endingTime,  setEndingTime]  = useState('2400H');
  const [authorized,  setAuthorized]  = useState<Record<string,number>>({ ...DEFAULT_AUTHORIZED });
  const [entries,     setEntries]     = useState<PersonnelEntry[]>([]);
  const [memoPaste,   setMemoPaste]   = useState('');
  const [sigBase64,   setSigBase64]   = useState('');
  const [showRoster,  setShowRoster]  = useState(false);
  const [showManual,  setShowManual]  = useState(false);
  const [previewDay,  setPreviewDay]  = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState<Partial<PersonnelEntry>>({ status: 'RNR' });

  // Load signature via canvas (browser can show it; we don't embed in XLS)
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setSigBase64(canvas.toDataURL('image/png'));
      }
    };
    img.src = signatureUrl;
  }, []);

  // Persist
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
    auth  = authorized, entr  = entries,
    mIdx  = monthIdx,   yr    = year,
    eTime = endingTime,
  ) => {
    localStorage.setItem(MRR_STORAGE_KEY, JSON.stringify({ authorized:auth, entries:entr, monthIdx:mIdx, year:yr, endingTime:eTime }));
  };

  // ── Handlers ──
  const handleParseMemo = () => {
    const lines = memoPaste.split('\n').filter(l => l.trim());
    const next  = [...entries];
    let added   = 0;
    for (const line of lines) {
      const p = parseMemoLine(line);
      if (p?.rank) {
        next.push({
          id:            Date.now().toString() + Math.random(),
          rank:          p.rank!,
          lastName:      p.lastName       || '',
          firstName:     p.firstName      || '',
          middleInitial: p.middleInitial  || '',
          pcn:           p.pcn            || '',
          status:        p.status         || 'RNR',
          dateFrom:      p.dateFrom       || '',
          dateTo:        p.dateTo         || '',
        });
        added++;
      }
    }
    if (added > 0) { setEntries(next); persist(authorized, next); setMemoPaste(''); toast.success(`Parsed ${added} entr${added===1?'y':'ies'}`); }
    else toast.error('No valid entries — check rank and format');
  };

  const handleAddManual = () => {
    if (!form.rank || !form.dateFrom || !form.dateTo) { toast.error('Rank, Date From, Date To required'); return; }
    const entry: PersonnelEntry = {
      id: Date.now().toString(), rank: form.rank!, lastName: form.lastName||'',
      firstName: form.firstName||'', middleInitial: form.middleInitial||'',
      pcn: form.pcn||'', status: (form.status as StatusType)||'RNR',
      dateFrom: form.dateFrom!, dateTo: form.dateTo!,
    };
    const next = [...entries, entry];
    setEntries(next); persist(authorized, next); setForm({ status:'RNR' }); toast.success('Entry added');
  };

  const handleDelete = (id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next); persist(authorized, next);
  };

  const handleSetAuth = (rank: string, val: string) => {
    const n = parseInt(val) || 0;
    const next = { ...authorized };
    if (n === 0) delete next[rank]; else next[rank] = n;
    setAuthorized(next); persist(next, entries);
  };

  const handleDownload = () => {
    generateMRRExcel(monthIdx, year, authorized, entries, endingTime);
    toast.success('Generating workbook…');
  };

  const handlePreview = () => {
    const html = buildPreviewHtml(previewDay, monthIdx, year, authorized, entries, endingTime, sigBase64);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
    setShowPreview(true);
  };

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const fmtDate = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day} ${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`;
  };

  return (
    <Box sx={{ p:3, maxWidth:1100, mx:'auto' }}>
      {/* Title */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb:3 }}>
        <ArticleIcon sx={{ fontSize:32, color:'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>MRR Report</Typography>
          <Typography variant="caption" color="text.secondary">Morning Report — AGO Form No. 1</Typography>
        </Box>
      </Stack>

      {/* Settings */}
      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb:1.5 }}>Report Settings</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth:160 }}>
            <InputLabel>Month</InputLabel>
            <Select value={monthIdx} label="Month"
              onChange={e => { const v=e.target.value as number; setMonthIdx(v); persist(authorized,entries,v,year,endingTime); }}>
              {MONTHS.map((m,i) => <MenuItem key={m} value={i}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="Year" type="number" value={year} sx={{ width:100 }}
            onChange={e => { const v=parseInt(e.target.value)||year; setYear(v); persist(authorized,entries,monthIdx,v,endingTime); }} />
          <TextField size="small" label="Ending Time" value={endingTime} sx={{ width:120 }}
            onChange={e => { setEndingTime(e.target.value); persist(authorized,entries,monthIdx,year,e.target.value); }} />
        </Stack>
      </Paper>

      {/* Authorized Roster */}
      <Paper sx={{ mb:2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px:2, py:1.5, cursor:'pointer' }} onClick={() => setShowRoster(v=>!v)}>
          <Typography variant="subtitle2" fontWeight={700}>Authorized Strength Roster</Typography>
          <IconButton size="small">{showRoster ? <ExpandLessIcon/> : <ExpandMoreIcon/>}</IconButton>
        </Stack>
        <Collapse in={showRoster}>
          <Divider/>
          <Box sx={{ p:2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb:2, display:'block' }}>
              Set authorized count per rank. Blank = 0.
            </Typography>
            <Grid container spacing={1}>
              {ALL_RANKS.map(rank => (
                <Grid key={rank} size={{ xs:6, sm:4, md:3 }}>
                  <TextField size="small" label={rank} type="number"
                    value={authorized[rank]||''}
                    onChange={e => handleSetAuth(rank, e.target.value)}
                    slotProps={{ htmlInput:{ min:0, style:{ textAlign:'center' } } }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Personnel Status Entries */}
      <Paper sx={{ mb:2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px:2, py:1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>Personnel Status Entries</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant={!showManual?'contained':'outlined'} startIcon={<ArticleIcon/>}
              onClick={() => setShowManual(false)}>Paste Memo</Button>
            <Button size="small" variant={showManual?'contained':'outlined'} startIcon={<AddIcon/>}
              onClick={() => setShowManual(true)}>Manual Add</Button>
          </Stack>
        </Stack>
        <Divider/>

        {!showManual && (
          <Box sx={{ p:2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:1 }}>
              Paste one line per person:
            </Typography>
            <Typography variant="caption" sx={{ display:'block', mb:1.5, fontFamily:'monospace', bgcolor:'action.hover', p:1, borderRadius:1, fontSize:'0.7rem' }}>
              SN1 LYNDON HARLIE F LIM 012544 PCG GRANTED FIFTEEN (15) DAYS REST AND RECREATION EFFECTIVE 13-27 APRIL 2026
            </Typography>
            <TextField multiline rows={4} fullWidth size="small"
              placeholder="Paste memorandum lines here…"
              value={memoPaste} onChange={e => setMemoPaste(e.target.value)} sx={{ mb:1.5 }} />
            <Button variant="contained" onClick={handleParseMemo} disabled={!memoPaste.trim()}>
              Parse &amp; Add
            </Button>
          </Box>
        )}

        {showManual && (
          <Box sx={{ p:2 }}>
            <Grid container spacing={1.5} sx={{ mb:1.5 }}>
              <Grid size={{ xs:6, sm:3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Rank *</InputLabel>
                  <Select value={form.rank||''} label="Rank *"
                    onChange={e => setForm(f=>({...f,rank:e.target.value}))}>
                    {ALL_RANKS.map(r=><MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs:6, sm:3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status *</InputLabel>
                  <Select value={form.status||'RNR'} label="Status *"
                    onChange={e => setForm(f=>({...f,status:e.target.value as StatusType}))}>
                    {(['ASG','RNR','SCHOOLING','TDY','CONF','AWOL'] as StatusType[]).map(s=>
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs:6, sm:3 }}>
                <TextField size="small" fullWidth label="Date From *" type="date" value={form.dateFrom||''}
                  onChange={e=>setForm(f=>({...f,dateFrom:e.target.value}))}
                  slotProps={{ inputLabel:{ shrink:true } }} />
              </Grid>
              <Grid size={{ xs:6, sm:3 }}>
                <TextField size="small" fullWidth label="Date To *" type="date" value={form.dateTo||''}
                  onChange={e=>setForm(f=>({...f,dateTo:e.target.value}))}
                  slotProps={{ inputLabel:{ shrink:true } }} />
              </Grid>
              <Grid size={{ xs:12, sm:4 }}>
                <TextField size="small" fullWidth label="Last Name" value={form.lastName||''}
                  onChange={e=>setForm(f=>({...f,lastName:e.target.value.toUpperCase()}))} />
              </Grid>
              <Grid size={{ xs:12, sm:4 }}>
                <TextField size="small" fullWidth label="First Name" value={form.firstName||''}
                  onChange={e=>setForm(f=>({...f,firstName:e.target.value.toUpperCase()}))} />
              </Grid>
              <Grid size={{ xs:6, sm:2 }}>
                <TextField size="small" fullWidth label="MI" value={form.middleInitial||''}
                  onChange={e=>setForm(f=>({...f,middleInitial:e.target.value.toUpperCase()}))} />
              </Grid>
              <Grid size={{ xs:6, sm:2 }}>
                <TextField size="small" fullWidth label="PCN" value={form.pcn||''}
                  onChange={e=>setForm(f=>({...f,pcn:e.target.value.toUpperCase()}))} />
              </Grid>
            </Grid>
            <Button variant="contained" startIcon={<AddIcon/>} onClick={handleAddManual}>Add Entry</Button>
          </Box>
        )}
      </Paper>

      {/* Entries list */}
      {entries.length > 0 && (
        <Paper sx={{ mb:2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px:2, py:1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>Status Entries ({entries.length})</Typography>
            <Button size="small" color="error"
              onClick={() => { if(window.confirm('Clear all entries?')){ setEntries([]); persist(authorized,[]); }}}>
              Clear All
            </Button>
          </Stack>
          <Divider/>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor:'action.hover' }}>
                  <TableCell><b>Rank</b></TableCell>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>PCN</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>From</b></TableCell>
                  <TableCell><b>To</b></TableCell>
                  <TableCell/>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(e => (
                  <React.Fragment key={e.id}>
                    <TableRow hover>
                      <TableCell><b>{e.rank}</b></TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>
                        {[e.lastName, e.firstName, e.middleInitial].filter(Boolean).join(', ')}
                      </TableCell>
                      <TableCell>{e.pcn}</TableCell>
                      <TableCell>
                        <Chip label={e.status} size="small" color={STATUS_COLOR[e.status]||'default'} />
                      </TableCell>
                      <TableCell>{fmtDate(e.dateFrom)}</TableCell>
                      <TableCell>{fmtDate(e.dateTo)}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}>
                          <DeleteIcon fontSize="small"/>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {/* Constructed sentence preview */}
                    {e.status !== 'ASG' && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py:0.5, pl:3, bgcolor:'action.hover', borderBottom:'2px solid', borderColor:'divider' }}>
                          <Typography variant="caption" sx={{ fontFamily:'monospace', color:'text.secondary', letterSpacing:0 }}>
                            ↳ {constructSentence(e)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Preview */}
      <Paper sx={{ mb:2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px:2, py:1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" label="Day" type="number" value={previewDay} sx={{ width:80 }}
              onChange={e => setPreviewDay(Math.max(1, Math.min(daysInMonth, parseInt(e.target.value)||1)))}
              slotProps={{ htmlInput:{ min:1, max:daysInMonth } }} />
            <Button variant="outlined" startIcon={<PreviewIcon/>} onClick={handlePreview}>
              Preview Day {previewDay}
            </Button>
            {showPreview && (
              <Button size="small" onClick={() => setShowPreview(false)}>Hide</Button>
            )}
          </Stack>
        </Stack>
        <Collapse in={showPreview}>
          <Divider/>
          <Box sx={{ p:1, bgcolor:'grey.100' }}>
            <Typography variant="caption" color="text.secondary" sx={{ ml:1 }}>
              {MONTHS[monthIdx]} {previewDay}, {year} — Morning Report Preview
            </Typography>
            <Box sx={{ mt:1, border:'1px solid #ccc', borderRadius:1, overflow:'hidden' }}>
              <iframe
                ref={iframeRef}
                style={{ width:'100%', height:620, border:'none', display:'block' }}
                title="MRR Preview"
              />
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Download */}
      <Paper sx={{ p:2, bgcolor:'primary.50', border:'1px solid', borderColor:'primary.200' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Download Workbook</Typography>
            <Typography variant="caption" color="text.secondary">
              {MONTHS[monthIdx]} {year} — {Math.ceil(daysInMonth/2)} sheets, two reports per sheet (Day 1&2, Day 3&4 …)
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<DownloadIcon/>} onClick={handleDownload}>
            Download {MONTHS[monthIdx].slice(0,3)} {year} MRR.xls
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ mt:1, display:'flex', justifyContent:'flex-end' }}>
        <Button size="small" startIcon={<SaveIcon/>} onClick={() => { persist(); toast.success('Settings saved'); }}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};
