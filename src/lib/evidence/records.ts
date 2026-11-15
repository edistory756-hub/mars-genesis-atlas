/**
 * Map-facing view of the NASA Evidence Library, in the shape the Mars Explorer
 * reads. Records live in `./data/` and are listed in `./library.ts`; this file
 * only derives what the map shows from them.
 *
 * The map's evidence panel shows organic-molecule counts, so only records with
 * a map region and an `organicChemistry` block appear on it for now.
 */
import { EVIDENCE_LIBRARY, getPrimarySource } from "./library";
import type { EvidenceRecord, MapLocator } from "./schema";

export interface MapEvidenceEntry {
  id: string;
  rover: string;
  sample: { name: string };
  location: { hierarchy: string[]; locator: MapLocator };
  findings: { carbonMoleculesIdentified: number; firstTimeOnMars: number };
  primarySourceUrl: string;
}

function toMapEntry(record: EvidenceRecord): MapEvidenceEntry[] {
  const region = record.location.region;
  const chem = record.organicChemistry;
  if (!region || !chem || !record.sampleName) return [];
  return [
    {
      id: record.id,
      rover: record.roverOrLander.name,
      sample: { name: record.sampleName },
      location: { hierarchy: record.location.hierarchy, locator: region },
      findings: { carbonMoleculesIdentified: chem.carbonMoleculesIdentified, firstTimeOnMars: chem.firstTimeOnMars },
      primarySourceUrl: getPrimarySource(record).url,
    },
  ];
}

/** Records the Mars Explorer can draw and focus. */
export const EVIDENCE_RECORDS: MapEvidenceEntry[] = EVIDENCE_LIBRARY.flatMap(toMapEntry);

export function getEvidence(id: string | undefined | null): MapEvidenceEntry | undefined {
  return id ? EVIDENCE_RECORDS.find((r) => r.id === id) : undefined;
}
