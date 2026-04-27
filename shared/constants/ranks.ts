/**
 * Philippine Coast Guard Ranks
 */

export const ENLISTED_RANKS = [
  'CCGM',  // Coast Guard Mariner
  'ASN',   // Apprentice Seaman
  'SN2',   // Seaman Second Class
  'SN1',   // Seaman First Class
] as const;

export const JUNIOR_NCO_RANKS = [
  'PO3',   // Petty Officer Third Class
  'PO2',   // Petty Officer Second Class
  'PO1',   // Petty Officer First Class
] as const;

export const SENIOR_NCO_RANKS = [
  'CPO',   // Chief Petty Officer
  'SCPO',  // Senior Chief Petty Officer
  'MCPO',  // Master Chief Petty Officer
  'FMCPO', // Fleet Master Chief Petty Officer
] as const;

export const JUNIOR_OFFICER_RANKS = [
  'P/ENS', // Probationary Ensign
  'ENS',   // Ensign
  'LTJG',  // Lieutenant Junior Grade
  'LT',    // Lieutenant
] as const;

export const SENIOR_OFFICER_RANKS = [
  'LCDR',  // Lieutenant Commander
  'CDR',   // Commander
  'CAPT',  // Captain
] as const;

export const FLAG_OFFICER_RANKS = [
  'COMMO', // Commodore
  'RADM',  // Rear Admiral
  'VADM',  // Vice Admiral
  'ADM',   // Admiral
] as const;

export const ALL_RANKS = [
  ...ENLISTED_RANKS,
  ...JUNIOR_NCO_RANKS,
  ...SENIOR_NCO_RANKS,
  ...JUNIOR_OFFICER_RANKS,
  ...SENIOR_OFFICER_RANKS,
  ...FLAG_OFFICER_RANKS,
] as const;

export const OFFICER_RANKS = [
  ...JUNIOR_OFFICER_RANKS,
  ...SENIOR_OFFICER_RANKS,
  ...FLAG_OFFICER_RANKS,
] as const;

export const NCO_RANKS = [
  ...JUNIOR_NCO_RANKS,
  ...SENIOR_NCO_RANKS,
] as const;

export type Rank = typeof ALL_RANKS[number];

export function isOfficer(rank: string): boolean {
  return (OFFICER_RANKS as readonly string[]).includes(rank);
}

export function isEnlisted(rank: string): boolean {
  return (ENLISTED_RANKS as readonly string[]).includes(rank);
}

export function isNCO(rank: string): boolean {
  return (NCO_RANKS as readonly string[]).includes(rank);
}
