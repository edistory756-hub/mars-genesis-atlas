/**
 * Data model for the MARS GENESIS NASA Evidence Library.
 *
 * Records are plain typed data (see `src/lib/evidence/data/`), kept apart from
 * presentation so a new record can be added without touching any component.
 *
 * Scientific rules the model encodes (checked by `validateEvidenceRecord`):
 * - Unavailable values are `null`; the UI shows `NOT_STATED` for them. Dates
 *   and coordinates are never estimated.
 * - Exact sample coordinates and approximate crater/region locations are
 *   distinguished by `coordinateAccuracy`.
 * - Every factual statement and field names at least one source it rests on.
 * - A source's `reviewStatus` says whether it was actually read for the
 *   record; cited-but-unread papers are never presented as reviewed.
 */

/** Shown wherever a value is `null` because no cited source states it. */
export const NOT_STATED = "Not stated in the cited source";

/** At least one source id: every claim must be traceable. */
export type SourceIds = [string, ...string[]];

export type StatementKind = "observation" | "interpretation" | "hypothesis" | "unknown";

export interface EvidenceStatement {
  kind: StatementKind;
  text: string;
  /** Verbatim passage from the source that supports the statement, when one exists. */
  quote?: string;
  sourceIds: SourceIds;
}

export type SourceType = "nasa-news" | "peer-reviewed-paper" | "gazetteer" | "nasa-image" | "dataset";

export interface EvidenceSource {
  id: string;
  publisher: string;
  title: string;
  url: string;
  /** Publication date as printed on the source (ISO yyyy-mm-dd); null when not available. */
  publishedDate: string | null;
  type: SourceType;
  /** The specific information on the record that this source supports. */
  supports: string;
  /**
   * "read": the source itself was read when building the record.
   * "not-reviewed": cited (e.g. by NASA) but not read or independently reviewed here.
   */
  reviewStatus: "read" | "not-reviewed";
}

/**
 * A date known only as precisely as the sources state it. `value` is ISO:
 * "yyyy" (year), "yyyy-mm" (month) or "yyyy-mm-dd" (day). Never estimated.
 */
export interface EvidenceDate {
  value: string | null;
  precision: "year" | "month" | "day" | null;
  /** Plain-language context, including what the sources do not say. */
  note: string;
  quote?: string;
  /** Sources supporting the value or, when null, confirming it is not stated. */
  sourceIds: SourceIds;
}

/** Planetocentric latitude, east-positive longitude, Mars 2000 (IAU 2000). */
export interface MarsCoordinates {
  lat: number;
  lon: number;
}

/**
 * - exact-sample: official coordinates of the sample or observation site itself.
 * - approximate-crater: centre of the crater the sample lies in, not the site.
 * - approximate-region: centre of a wider named region, not the site.
 * - not-stated: no cited source gives a location that can be placed; `coordinates` is null.
 */
export type CoordinateAccuracy = "exact-sample" | "approximate-crater" | "approximate-region" | "not-stated";

/** A named area drawn on the Mars map. It always marks a region, never the sample. */
export interface MapLocator {
  id: string;
  name: string;
  precision: "approximate-region";
  center: MarsCoordinates;
  diameterKm: number;
  bounds: { north: number; south: number; east: number; west: number };
  sourceId: string;
  note: string;
}

export type PlatformType = "rover" | "lander" | "orbiter" | "helicopter";

export const EVIDENCE_CATEGORIES = {
  "organic-molecules": "Organic molecules",
  habitability: "Habitability",
  "water-and-ice": "Water and ice",
  "geology-and-minerals": "Geology and minerals",
  "atmosphere-and-climate": "Atmosphere and climate",
  "potential-biosignature": "Potential biosignature",
} as const;

/** Editorial classification for browsing; not a scientific claim. */
export type EvidenceCategory = keyof typeof EVIDENCE_CATEGORIES;

/** Headline values shown at the top of a record. Each is tagged and sourced like a statement. */
export interface KeyFinding {
  id: string;
  value: number | string;
  label: string;
  detail?: string;
  kind: StatementKind;
  sourceIds: SourceIds;
}

export type OriginAssessment = "possible" | "favoured" | "ruled-out" | "not-stated";

/** Optional structured block for organic-molecule detections. */
export interface OrganicChemistryFindings {
  carbonMoleculesIdentified: number;
  firstTimeOnMars: number;
  origin: { biological: OriginAssessment; geological: OriginAssessment; established: boolean };
  sourceIds: SourceIds;
}

export interface EvidenceImage {
  src: string;
  alt: string;
  caption: string;
  /** Original credit line, reproduced exactly as the publisher gives it. */
  credit: string;
  sourceId: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  mission: string;
  roverOrLander: { name: string; type: PlatformType };
  location: {
    /** Broadest first, e.g. crater › mountain › region › site. */
    hierarchy: string[];
    summary: string;
    /** Area drawn on the Mars map; null when no region can be placed. */
    region: MapLocator | null;
    sourceIds: SourceIds;
  };
  category: EvidenceCategory;
  observationDate: EvidenceDate;
  publicationDate: EvidenceDate;
  instruments: string[];
  sampleName: string | null;
  sampleContext: string | null;
  summary: { text: string; sourceIds: SourceIds };
  keyFindings: KeyFinding[];
  organicChemistry?: OrganicChemistryFindings;
  observations: EvidenceStatement[];
  interpretations: EvidenceStatement[];
  hypotheses: EvidenceStatement[];
  unknowns: EvidenceStatement[];
  /** Null when `coordinateAccuracy` is "not-stated". Only "exact-sample" marks the site itself. */
  coordinates: MarsCoordinates | null;
  coordinateAccuracy: CoordinateAccuracy;
  /** Plain-language label shown next to the coordinates, e.g. "Approximate Gale Crater locator". */
  coordinateLabel: string;
  coordinateSourceIds: SourceIds;
  /** Sources for the identity fields (title, mission, rover/lander, instruments, sample). */
  identitySourceIds: SourceIds;
  primarySourceId: string;
  sources: EvidenceSource[];
  image?: EvidenceImage;
}
