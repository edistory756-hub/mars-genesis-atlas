/**
 * The NASA Evidence Library: the list of records plus lookups, display
 * helpers and the validator that enforces the scientific rules.
 *
 * To add a record: create `data/<id>.ts` exporting an `EvidenceRecord` and
 * append it to `EVIDENCE_LIBRARY`. The tests validate every record.
 */
import { MARY_ANNING_3 } from "./data/mary-anning-3";
import {
  NOT_STATED,
  type EvidenceDate,
  type EvidenceRecord,
  type EvidenceSource,
  type StatementKind,
} from "./schema";

export const EVIDENCE_LIBRARY: EvidenceRecord[] = [MARY_ANNING_3];

export function getEvidenceRecord(id: string | undefined | null): EvidenceRecord | undefined {
  return id ? EVIDENCE_LIBRARY.find((r) => r.id === id) : undefined;
}

export function getSource(record: EvidenceRecord, sourceId: string): EvidenceSource | undefined {
  return record.sources.find((s) => s.id === sourceId);
}

export function getSources(record: EvidenceRecord, sourceIds: readonly string[]): EvidenceSource[] {
  return sourceIds.flatMap((id) => getSource(record, id) ?? []);
}

export function getPrimarySource(record: EvidenceRecord): EvidenceSource {
  const source = getSource(record, record.primarySourceId);
  if (!source) throw new Error(`Evidence record ${record.id} has no primary source ${record.primarySourceId}`);
  return source;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats an ISO day/month/year date as precisely as it is known, e.g. "21 Apr 2026", "Oct 2020", "2020". */
export function formatIsoDate(value: string): string {
  const [y, m, d] = value.split("-");
  if (d && m) return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
  if (m) return `${MONTHS[Number(m) - 1]} ${y}`;
  return y ?? value;
}

export function formatEvidenceDate(date: EvidenceDate): string {
  return date.value ? formatIsoDate(date.value) : NOT_STATED;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const DATE_FORMATS: Record<NonNullable<EvidenceDate["precision"]>, RegExp> = {
  year: /^\d{4}$/,
  month: /^\d{4}-(0[1-9]|1[0-2])$/,
  day: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
};

/** Wording that would present a measurement as proof that life existed. */
const PROOF_OF_LIFE = /\b(proof|proves?|proven|confirms?|confirmed|demonstrates?|establish(es|ed)?)\b[^.]{0,40}\blife\b|\blife\b[^.]{0,20}\b(detected|found|discovered|confirmed)\b/i;

/** Returns a list of rule violations; an empty list means the record is valid. */
export function validateEvidenceRecord(record: EvidenceRecord): string[] {
  const problems: string[] = [];
  const fail = (msg: string) => problems.push(`${record.id}: ${msg}`);

  // Sources
  const ids = new Set<string>();
  for (const s of record.sources) {
    if (ids.has(s.id)) fail(`duplicate source id "${s.id}"`);
    ids.add(s.id);
    if (!/^https:\/\//.test(s.url)) fail(`source "${s.id}" must use an https URL`);
    if (!s.publisher.trim() || !s.title.trim()) fail(`source "${s.id}" needs a publisher and title`);
    if (!s.supports.trim()) fail(`source "${s.id}" must say what it supports`);
    if (s.publishedDate !== null && !DATE_FORMATS.day.test(s.publishedDate)) {
      fail(`source "${s.id}" publishedDate must be yyyy-mm-dd or null`);
    }
  }
  const checkRefs = (where: string, refs: readonly string[]) => {
    if (refs.length === 0) fail(`${where} has no source`);
    for (const ref of refs) if (!ids.has(ref)) fail(`${where} cites unknown source "${ref}"`);
  };

  const primary = record.sources.find((s) => s.id === record.primarySourceId);
  if (!primary) fail(`primary source "${record.primarySourceId}" is missing`);
  else if (primary.reviewStatus !== "read") fail("the primary source must have been read");

  // Field-level traceability
  checkRefs("identity fields", record.identitySourceIds);
  checkRefs("location", record.location.sourceIds);
  checkRefs("summary", record.summary.sourceIds);
  checkRefs("coordinates", record.coordinateSourceIds);
  if (record.location.region) checkRefs("map region", [record.location.region.sourceId]);
  if (record.organicChemistry) checkRefs("organic chemistry findings", record.organicChemistry.sourceIds);
  if (record.image) checkRefs("image", [record.image.sourceId]);
  record.keyFindings.forEach((f) => checkRefs(`key finding "${f.id}"`, f.sourceIds));

  // Statements: filed under their own kind, each traceable
  const groups: [StatementKind, EvidenceRecord["observations"]][] = [
    ["observation", record.observations],
    ["interpretation", record.interpretations],
    ["hypothesis", record.hypotheses],
    ["unknown", record.unknowns],
  ];
  for (const [kind, items] of groups) {
    items.forEach((s, i) => {
      if (s.kind !== kind) fail(`${kind} #${i + 1} is tagged "${s.kind}"`);
      checkRefs(`${kind} #${i + 1}`, s.sourceIds);
    });
  }

  // Dates: never estimated, stored only as precisely as stated
  for (const [name, d] of [
    ["observationDate", record.observationDate],
    ["publicationDate", record.publicationDate],
  ] as const) {
    checkRefs(name, d.sourceIds);
    if ((d.value === null) !== (d.precision === null)) fail(`${name} value and precision must both be null or both set`);
    if (d.value !== null && d.precision !== null && !DATE_FORMATS[d.precision].test(d.value)) {
      fail(`${name} "${d.value}" does not match precision "${d.precision}"`);
    }
  }

  // Coordinates: exact vs approximate must be explicit
  const c = record.coordinates;
  if (record.coordinateAccuracy === "not-stated") {
    if (c !== null) fail('coordinates must be null when coordinateAccuracy is "not-stated"');
  } else if (c === null) {
    fail(`coordinates are required when coordinateAccuracy is "${record.coordinateAccuracy}"`);
  } else {
    if (c.lat < -90 || c.lat > 90 || c.lon < -180 || c.lon > 360) fail("coordinates out of range");
    const approximate = record.coordinateAccuracy !== "exact-sample";
    const saysApprox = /approx/i.test(record.coordinateLabel);
    if (approximate && !saysApprox) fail("coordinateLabel must say the location is approximate");
    if (!approximate && saysApprox) fail("exact coordinates must not be labelled approximate");
    if (approximate) {
      const r = record.location.region;
      if (!r) fail("approximate coordinates need the map region they are taken from");
      else if (r.center.lat !== c.lat || r.center.lon !== c.lon) fail("approximate coordinates must equal the region centre");
    }
  }
  if (!record.coordinateLabel.trim()) fail("coordinateLabel is required");

  // No observation presented as proof of life
  const checked: [string, string][] = [
    ["summary", record.summary.text],
    ...record.keyFindings.map((f): [string, string] => [`key finding "${f.id}"`, `${f.value} ${f.label} ${f.detail ?? ""}`]),
    ...record.observations.map((s, i): [string, string] => [`observation #${i + 1}`, s.text]),
    ...record.interpretations.map((s, i): [string, string] => [`interpretation #${i + 1}`, s.text]),
  ];
  for (const [where, text] of checked) {
    if (PROOF_OF_LIFE.test(text)) fail(`${where} reads as proof of life: "${text}"`);
  }

  // Attribution
  if (record.image && !record.image.credit.trim()) fail("image credit is required");

  return problems;
}

/** Validates the whole library, including unique record ids. */
export function validateEvidenceLibrary(records: EvidenceRecord[] = EVIDENCE_LIBRARY): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const r of records) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)) problems.push(`${r.id}: id must be lowercase-kebab-case`);
    if (seen.has(r.id)) problems.push(`${r.id}: duplicate record id`);
    seen.add(r.id);
    problems.push(...validateEvidenceRecord(r));
  }
  return problems;
}
