/**
 * Structured NASA evidence records.
 *
 * Every statement here is taken from the cited source pages and carries the
 * verbatim passage it rests on, so it can be checked. Nothing is inferred
 * beyond what the sources say. Where a value is not stated by a source it is
 * recorded as unknown (null), never estimated.
 */

export type StatementKind = "observation" | "interpretation" | "hypothesis" | "unknown";

export interface EvidenceSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Publication date as printed on the source (ISO yyyy-mm-dd). */
  published?: string;
  /** How the source was used, so readers know what was actually checked. */
  role: string;
}

export interface EvidenceStatement {
  kind: StatementKind;
  text: string;
  /** Verbatim passage from the source that supports the statement. */
  quote?: string;
  sourceId: string;
}

export interface MapLocator {
  id: string;
  name: string;
  /** Always "approximate-region": the locator marks a region, not the sample. */
  precision: "approximate-region";
  /** Planetocentric latitude, east-positive longitude (Mars 2000 / IAU 2000). */
  center: { lat: number; lon: number };
  diameterKm: number;
  bounds: { north: number; south: number; east: number; west: number };
  sourceId: string;
  note: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  mission: string;
  rover: string;
  instrument: string;
  location: {
    hierarchy: string[];
    summary: string;
    /** Exact drill-hole coordinates. null = not verified from an official source. */
    exactSampleCoordinates: { lat: number; lon: number } | null;
    locator: MapLocator;
  };
  sample: { name: string; context: string };
  dates: {
    /** Exact sampling date, ISO. null = not stated by the sources. */
    sampledOn: string | null;
    sampledSummary: string;
    findingsPublished: string;
    findingsPublishedSummary: string;
  };
  findings: {
    carbonMoleculesIdentified: number;
    firstTimeOnMars: number;
    origin: {
      biological: "possible";
      geological: "possible";
      established: false;
    };
  };
  observations: EvidenceStatement[];
  interpretations: EvidenceStatement[];
  hypotheses: EvidenceStatement[];
  unknowns: EvidenceStatement[];
  primarySourceUrl: string;
  sources: EvidenceSource[];
  image?: {
    src: string;
    alt: string;
    caption: string;
    credit: string;
    sourceId: string;
  };
}

export const MARY_ANNING_3_NASA_URL =
  "https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-finds-organic-molecules-never-seen-before-on-mars/";

const SOURCES: EvidenceSource[] = [
  {
    id: "nasa-2026",
    title: "NASA's Curiosity Finds Organic Molecules Never Seen Before on Mars",
    publisher: "NASA / Jet Propulsion Laboratory",
    url: MARY_ANNING_3_NASA_URL,
    published: "2026-04-21",
    role: "Primary source for every finding on this record.",
  },
  {
    id: "nasa-2020",
    title: "NASA's Curiosity Takes Selfie With 'Mary Anning' on the Red Planet",
    publisher: "NASA / Jet Propulsion Laboratory",
    url: "https://www.nasa.gov/centers-and-facilities/jpl/nasas-curiosity-takes-selfie-with-mary-anning-on-the-red-planet/",
    published: "2020-11-12",
    role: "Linked from the primary source. Used only for the site's region (Glen Torridon) and timing.",
  },
  {
    id: "paper-2026",
    title: "Peer-reviewed paper in Nature Communications (DOI 10.1038/s41467-026-70656-0)",
    publisher: "Nature Communications",
    url: "https://doi.org/10.1038/s41467-026-70656-0",
    role: "Cited by NASA as the paper detailing the findings. Not reviewed directly for this record.",
  },
  {
    id: "usgs-gale",
    title: "Gazetteer of Planetary Nomenclature: Gale (Feature 2071)",
    publisher: "IAU / USGS",
    url: "https://planetarynames.wr.usgs.gov/Feature/2071",
    role: "Gale Crater centre, diameter and bounds (MDIM 2.1 control network, planetocentric, east-positive).",
  },
];

/** Approximate Gale Crater locator from the IAU/USGS gazetteer (MDIM 2.1). */
export const GALE_CRATER_LOCATOR: MapLocator = {
  id: "gale-crater",
  name: "Gale Crater",
  precision: "approximate-region",
  center: { lat: -5.37, lon: 137.81 },
  diameterKm: 154.08,
  bounds: { north: -4.07, south: -6.67, east: 139.12, west: 136.51 },
  sourceId: "usgs-gale",
  note: "It marks the whole crater, not the sample site: the exact drill-hole coordinates have not been verified from an official source.",
};

export const MARY_ANNING_3: EvidenceRecord = {
  id: "mary-anning-3",
  title: "The most diverse set of organic molecules found on Mars",
  mission: "Mars Science Laboratory (NASA / JPL)",
  rover: "Curiosity",
  instrument: "Sample Analysis at Mars (SAM) minilab, including TMAH wet chemistry",
  location: {
    hierarchy: ["Gale Crater", "Mount Sharp", "Glen Torridon region", "\u201cMary Anning\u201d drill site"],
    summary:
      "A clay-enriched part of Mount Sharp, inside Gale Crater, in the region NASA calls Glen Torridon.",
    exactSampleCoordinates: null,
    locator: GALE_CRATER_LOCATOR,
  },
  sample: {
    name: "Mary Anning 3",
    context:
      "One of three drill holes at the \u201cMary Anning\u201d site, alongside \u201cMary Anning\u201d and \u201cGroken\u201d. A spot called \u201cMary Anning 2\u201d went unused.",
  },
  dates: {
    sampledOn: null,
    sampledSummary:
      "Drilled in 2020. NASA does not give the exact drilling date. Curiosity was at the site from July 2020 and took a selfie there on 25 Oct 2020 (sol 2,922).",
    findingsPublished: "2026-04-21",
    findingsPublishedSummary: "Findings published 21 Apr 2026 in Nature Communications (NASA announcement the same day).",
  },
  findings: {
    carbonMoleculesIdentified: 21,
    firstTimeOnMars: 7,
    origin: { biological: "possible", geological: "possible", established: false },
  },
  observations: [
    {
      kind: "observation",
      text: "21 carbon-containing (organic) molecules were identified in the Mary Anning 3 sample. Seven of them had never been detected on Mars before.",
      quote:
        "Of the 21 carbon-containing molecules identified in the sample, seven of them were detected for the first time on Mars.",
      sourceId: "nasa-2026",
    },
    {
      kind: "observation",
      text: "One of the newly identified molecules is a nitrogen heterocycle: a ring of carbon atoms that includes nitrogen.",
      quote: "Among the newly identified molecules is a nitrogen heterocycle, a ring of carbon atoms that includes nitrogen.",
      sourceId: "nasa-2026",
    },
    {
      kind: "observation",
      text: "Benzothiophene, a molecule containing carbon and sulfur, was also detected.",
      quote: "Another exciting discovery was benzothiophene, a carbon- and sulfur-bearing molecule that\u2019s been found in many meteorites.",
      sourceId: "nasa-2026",
    },
    {
      kind: "observation",
      text: "Mary Anning 3 was the first sample on Mars treated with TMAH, a strong solvent kept for the highest-value samples.",
      quote: "The Mary Anning 3 sample was the first to be exposed to TMAH.",
      sourceId: "nasa-2026",
    },
    {
      kind: "observation",
      text: "On Earth, the team treated a piece of the Murchison meteorite with TMAH. It broke larger molecules into some of the same ones seen in Mary Anning 3, including benzothiophene.",
      quote:
        "A Murchison sample exposed to TMAH was found to break much larger molecules into some of the ones seen in Mary Anning 3, including benzothiophene.",
      sourceId: "nasa-2026",
    },
    {
      kind: "observation",
      text: "The sample comes from a region of Mount Sharp rich in clay-bearing rocks.",
      quote: "The \u201cMary Anning 3\u201d sample was found in this clay-enriched region.",
      sourceId: "nasa-2026",
    },
  ],
  interpretations: [
    {
      kind: "interpretation",
      text: "NASA says the discovery renews confirmation that ancient Mars had the right chemistry to support life. This is about chemistry, not a detection of life.",
      quote: "their discovery renewed confirmation that ancient Mars had the right chemistry to support life.",
      sourceId: "nasa-2026",
    },
    {
      kind: "interpretation",
      text: "The site was once covered by lakes and streams that came and went repeatedly, leaving clay minerals that are especially good at preserving organic compounds.",
      quote:
        "This oasis surged and dried up multiple times in the planet\u2019s ancient past, eventually enriching the area with clay minerals, which are especially good at preserving organic compounds",
      sourceId: "nasa-2026",
    },
    {
      kind: "interpretation",
      text: "The molecules add to the list of compounds that can survive in Martian rock for billions of years despite radiation that breaks them down.",
      quote:
        "the molecules join a growing list of compounds known to be preserved in rocks even after billions of years of exposure on Mars to radiation",
      sourceId: "nasa-2026",
    },
    {
      kind: "interpretation",
      text: "The Murchison test shows the Martian molecules could be breakdown products of even more complex compounds relevant to life.",
      quote:
        "That result verifies that the Martian molecules found in Mary Anning 3 could have been generated from the breakdown of even more complex compounds relevant to life.",
      sourceId: "nasa-2026",
    },
    {
      kind: "interpretation",
      text: "Nitrogen heterocycles can be chemical precursors to more complex nitrogen-bearing molecules; this kind of structure is considered a predecessor to RNA and DNA.",
      quote: "these structures can be chemical precursors to more complex nitrogen-bearing molecules",
      sourceId: "nasa-2026",
    },
  ],
  hypotheses: [
    {
      kind: "hypothesis",
      text: "Biological origin: the molecules could have been made by living things. Possible, not established.",
      quote:
        "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes \u2014 either path is possible",
      sourceId: "nasa-2026",
    },
    {
      kind: "hypothesis",
      text: "Geological origin: the molecules could have formed through non-living geological processes. Possible, not established.",
      quote:
        "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes \u2014 either path is possible",
      sourceId: "nasa-2026",
    },
    {
      kind: "hypothesis",
      text: "Some scientists think meteorites carrying molecules like benzothiophene seeded prebiotic chemistry across the early solar system. NASA does not say this sample's benzothiophene came from meteorites.",
      quote:
        "These meteorites, along with the organic molecules within them, are thought by some scientists to have seeded prebiotic chemistry across the early solar system.",
      sourceId: "nasa-2026",
    },
    {
      kind: "hypothesis",
      text: "Mars may have offered a home for life in the ancient past. The project scientist says the finding increases that prospect; it does not show it.",
      quote:
        "This collection of organic molecules once again increases the prospect that Mars offered a home for life in the ancient past.",
      sourceId: "nasa-2026",
    },
  ],
  unknowns: [
    {
      kind: "unknown",
      text: "Origin is unknown. Neither a biological nor a geological origin can be determined from these results.",
      quote: "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes",
      sourceId: "nasa-2026",
    },
    {
      kind: "unknown",
      text: "The detected molecules may be fragments of larger original compounds, because TMAH is used to break larger molecules apart.",
      quote: "The resulting reactions can break apart larger molecules that would be difficult to detect and identify otherwise.",
      sourceId: "nasa-2026",
    },
    {
      kind: "unknown",
      text: "The NASA article names only two of the molecules (benzothiophene and a nitrogen heterocycle). The full list of 21, and which seven are new, is not given there.",
      sourceId: "nasa-2026",
    },
    {
      kind: "unknown",
      text: "Exact drill-hole coordinates are not given in the NASA sources, so the map shows an approximate Gale Crater locator instead of the sample site.",
      sourceId: "nasa-2026",
    },
    {
      kind: "unknown",
      text: "The exact drilling date is not given; NASA states only that the rock was drilled and analysed in 2020.",
      quote: "A rock that NASA\u2019s Curiosity Mars rover drilled and analyzed in 2020",
      sourceId: "nasa-2026",
    },
    {
      kind: "unknown",
      text: "This record summarises NASA's announcement. The peer-reviewed paper itself has not been reviewed here.",
      sourceId: "paper-2026",
    },
  ],
  primarySourceUrl: MARY_ANNING_3_NASA_URL,
  sources: SOURCES,
  image: {
    src: "https://www.nasa.gov/wp-content/uploads/2026/04/e2-curiosity-drill-holes-at-mary-anning-pia24173.jpg?w=1280",
    alt: "Curiosity's robotic arm above flat, cracked Martian rock with three labelled drill holes: Groken, Mary Anning and Mary Anning 3.",
    caption:
      "The three holes Curiosity drilled at the \u201cMary Anning\u201d location. The organic molecules came from \u201cMary Anning 3\u201d.",
    credit: "NASA/JPL-Caltech/MSSS",
    sourceId: "nasa-2026",
  },
};

export const EVIDENCE_RECORDS: EvidenceRecord[] = [MARY_ANNING_3];

export function getEvidence(id: string | undefined | null): EvidenceRecord | undefined {
  return id ? EVIDENCE_RECORDS.find((r) => r.id === id) : undefined;
}

export function getSource(record: EvidenceRecord, sourceId: string): EvidenceSource | undefined {
  return record.sources.find((s) => s.id === sourceId);
}
