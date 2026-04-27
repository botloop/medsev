/**
 * Philippine Coast Guard Ranks
 */
export declare const ENLISTED_RANKS: readonly ["CCGM", "ASN", "SN2", "SN1"];
export declare const JUNIOR_NCO_RANKS: readonly ["PO3", "PO2", "PO1"];
export declare const SENIOR_NCO_RANKS: readonly ["CPO", "SCPO", "MCPO", "FMCPO"];
export declare const JUNIOR_OFFICER_RANKS: readonly ["P/ENS", "ENS", "LTJG", "LT"];
export declare const SENIOR_OFFICER_RANKS: readonly ["LCDR", "CDR", "CAPT"];
export declare const FLAG_OFFICER_RANKS: readonly ["COMMO", "RADM", "VADM", "ADM"];
export declare const ALL_RANKS: readonly ["CCGM", "ASN", "SN2", "SN1", "PO3", "PO2", "PO1", "CPO", "SCPO", "MCPO", "FMCPO", "P/ENS", "ENS", "LTJG", "LT", "LCDR", "CDR", "CAPT", "COMMO", "RADM", "VADM", "ADM"];
export declare const OFFICER_RANKS: readonly ["P/ENS", "ENS", "LTJG", "LT", "LCDR", "CDR", "CAPT", "COMMO", "RADM", "VADM", "ADM"];
export declare const NCO_RANKS: readonly ["PO3", "PO2", "PO1", "CPO", "SCPO", "MCPO", "FMCPO"];
export type Rank = typeof ALL_RANKS[number];
export declare function isOfficer(rank: string): boolean;
export declare function isEnlisted(rank: string): boolean;
export declare function isNCO(rank: string): boolean;
//# sourceMappingURL=ranks.d.ts.map