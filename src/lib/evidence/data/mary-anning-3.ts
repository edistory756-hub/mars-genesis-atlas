import type { EvidenceRecord, EvidenceSource } from "../schema";
import { GALE_CRATER_LOCATOR } from "./locators";

/**
 * Mary Anning 3 (Curiosity, Gale Crater).
 *
 * Every statement is taken from the cited NASA pages and carries the verbatim
 * passage it rests on. Values the sources do not state are null.
 */

export const MARY_ANNING_3_NASA_URL =
  "https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-finds-organic-molecules-never-seen-before-on-mars/";

const CARBON_MOLECULES_IDENTIFIED = 21;
const FIRST_TIME_ON_MARS = 7;

const SOURCES: EvidenceSource[] = [
  {
    id: "nasa-2026",
    publisher: "NASA / Jet Propulsion Laboratory",
    title: "NASA's Curiosity Finds Organic Molecules Never Seen Before on Mars",
    url: MARY_ANNING_3_NASA_URL,
    publishedDate: "2026-04-21",
    type: "nasa-news",
    supports: "Primary source for every finding on this record.",
    reviewStatus: "read",
  },
  {
    id: "nasa-2020",
    publisher: "NASA / Jet Propulsion Laboratory",
    title: "NASA's Curiosity Takes Selfie With 'Mary Anning' on the Red Planet",
    url: "https://www.nasa.gov/centers-and-facilities/jpl/nasas-curiosity-takes-selfie-with-mary-anning-on-the-red-planet/",
    publishedDate: "2020-11-12",
    type: "nasa-news",
    supports: "Linked from the primary source. Used only for the site's region (Glen Torridon) and timing.",
    reviewStatus: "read",
  },
  {
    id: "paper-2026",
    publisher: "Nature Communications",
    title: "Peer-reviewed paper in Nature Communications (DOI 10.1038/s41467-026-70656-0)",
    url: "https://doi.org/10.1038/s41467-026-70656-0",
    publishedDate: null,
    type: "peer-reviewed-paper",
    supports: "Cited by NASA as the paper detailing the findings. Not reviewed directly for this record.",
    reviewStatus: "not-reviewed",
  },
  {
    id: "usgs-gale",
    publisher: "IAU / USGS",
    title: "Gazetteer of Planetary Nomenclature: Gale (Feature 2071)",
    url: "https://planetarynames.wr.usgs.gov/Feature/2071",
    publishedDate: null,
    type: "gazetteer",
    supports: "Gale Crater centre, diameter and bounds (MDIM 2.1 control network, planetocentric, east-positive).",
    reviewStatus: "read",
  },
];

export const MARY_ANNING_3: EvidenceRecord = {
  id: "mary-anning-3",
  title: "The most diverse set of organic molecules found on Mars",
  mission: "Mars Science Laboratory (NASA / JPL)",
  roverOrLander: { name: "Curiosity", type: "rover" },
  location: {
    hierarchy: ["Gale Crater", "Mount Sharp", "Glen Torridon region", "\u201cMary Anning\u201d drill site"],
    summary:
      "A clay-enriched part of Mount Sharp, inside Gale Crater, in the region NASA calls Glen Torridon.",
    region: GALE_CRATER_LOCATOR,
    sourceIds: ["nasa-2026", "nasa-2020"],
  },
  category: "organic-molecules",
  observationDate: {
    // Only the year is used: the record's preserved wording says NASA states the year, not the day.
    value: "2020",
    precision: "year",
    note: "Drilled in 2020. NASA does not give the exact drilling date. Curiosity was at the site from July 2020 and took a selfie there on 25 Oct 2020 (sol 2,922).",
    quote: "A rock that NASA\u2019s Curiosity Mars rover drilled and analyzed in 2020",
    sourceIds: ["nasa-2026", "nasa-2020"],
  },
  publicationDate: {
    value: "2026-04-21",
    precision: "day",
    note: "Findings published 21 Apr 2026 in Nature Communications (NASA announcement the same day).",
    sourceIds: ["nasa-2026"],
  },
  instruments: ["Sample Analysis at Mars (SAM) minilab, including TMAH wet chemistry"],
  sampleName: "Mary Anning 3",
  sampleContext:
    "One of three drill holes at the \u201cMary Anning\u201d site, alongside \u201cMary Anning\u201d and \u201cGroken\u201d. A spot called \u201cMary Anning 2\u201d went unused.",
  summary: {
    text: "Curiosity identified 21 carbon-containing molecules in the Mary Anning 3 rock sample from Gale Crater, seven of them never detected on Mars before. NASA says they could have formed through biological or geological processes; the origin is not established.",
    sourceIds: ["nasa-2026"],
  },
  keyFindings: [
    {
      id: "carbon-molecules-identified",
      value: CARBON_MOLECULES_IDENTIFIED,
      label: "carbon-containing molecules identified",
      kind: "observation",
      sourceIds: ["nasa-2026"],
    },
    {
      id: "first-time-on-mars",
      value: FIRST_TIME_ON_MARS,
      label: "detected for the first time on Mars",
      kind: "observation",
      sourceIds: ["nasa-2026"],
    },
    {
      id: "origin",
      value: "Origin not established",
      label: "Origin not established",
      detail: "Biological or geological; either is possible.",
      kind: "hypothesis",
      sourceIds: ["nasa-2026"],
    },
  ],
  organicChemistry: {
    carbonMoleculesIdentified: CARBON_MOLECULES_IDENTIFIED,
    firstTimeOnMars: FIRST_TIME_ON_MARS,
    origin: { biological: "possible", geological: "possible", established: false },
    sourceIds: ["nasa-2026"],
  },
  observations: [
    {
      kind: "observation",
      text: "21 carbon-containing (organic) molecules were identified in the Mary Anning 3 sample. Seven of them had never been detected on Mars before.",
      quote:
        "Of the 21 carbon-containing molecules identified in the sample, seven of them were detected for the first time on Mars.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "observation",
      text: "One of the newly identified molecules is a nitrogen heterocycle: a ring of carbon atoms that includes nitrogen.",
      quote: "Among the newly identified molecules is a nitrogen heterocycle, a ring of carbon atoms that includes nitrogen.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "observation",
      text: "Benzothiophene, a molecule containing carbon and sulfur, was also detected.",
      quote: "Another exciting discovery was benzothiophene, a carbon- and sulfur-bearing molecule that\u2019s been found in many meteorites.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "observation",
      text: "Mary Anning 3 was the first sample on Mars treated with TMAH, a strong solvent kept for the highest-value samples.",
      quote: "The Mary Anning 3 sample was the first to be exposed to TMAH.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "observation",
      text: "On Earth, the team treated a piece of the Murchison meteorite with TMAH. It broke larger molecules into some of the same ones seen in Mary Anning 3, including benzothiophene.",
      quote:
        "A Murchison sample exposed to TMAH was found to break much larger molecules into some of the ones seen in Mary Anning 3, including benzothiophene.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "observation",
      text: "The sample comes from a region of Mount Sharp rich in clay-bearing rocks.",
      quote: "The \u201cMary Anning 3\u201d sample was found in this clay-enriched region.",
      sourceIds: ["nasa-2026"],
    },
  ],
  interpretations: [
    {
      kind: "interpretation",
      text: "NASA says the discovery renews confirmation that ancient Mars had the right chemistry to support life. This is about chemistry, not a detection of life.",
      quote: "their discovery renewed confirmation that ancient Mars had the right chemistry to support life.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "interpretation",
      text: "The site was once covered by lakes and streams that came and went repeatedly, leaving clay minerals that are especially good at preserving organic compounds.",
      quote:
        "This oasis surged and dried up multiple times in the planet\u2019s ancient past, eventually enriching the area with clay minerals, which are especially good at preserving organic compounds",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "interpretation",
      text: "The molecules add to the list of compounds that can survive in Martian rock for billions of years despite radiation that breaks them down.",
      quote:
        "the molecules join a growing list of compounds known to be preserved in rocks even after billions of years of exposure on Mars to radiation",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "interpretation",
      text: "The Murchison test shows the Martian molecules could be breakdown products of even more complex compounds relevant to life.",
      quote:
        "That result verifies that the Martian molecules found in Mary Anning 3 could have been generated from the breakdown of even more complex compounds relevant to life.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "interpretation",
      text: "Nitrogen heterocycles can be chemical precursors to more complex nitrogen-bearing molecules; this kind of structure is considered a predecessor to RNA and DNA.",
      quote: "these structures can be chemical precursors to more complex nitrogen-bearing molecules",
      sourceIds: ["nasa-2026"],
    },
  ],
  hypotheses: [
    {
      kind: "hypothesis",
      text: "Biological origin: the molecules could have been made by living things. Possible, not established.",
      quote:
        "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes \u2014 either path is possible",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "hypothesis",
      text: "Geological origin: the molecules could have formed through non-living geological processes. Possible, not established.",
      quote:
        "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes \u2014 either path is possible",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "hypothesis",
      text: "Some scientists think meteorites carrying molecules like benzothiophene seeded prebiotic chemistry across the early solar system. NASA does not say this sample's benzothiophene came from meteorites.",
      quote:
        "These meteorites, along with the organic molecules within them, are thought by some scientists to have seeded prebiotic chemistry across the early solar system.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "hypothesis",
      text: "Mars may have offered a home for life in the ancient past. The project scientist says the finding increases that prospect; it does not show it.",
      quote:
        "This collection of organic molecules once again increases the prospect that Mars offered a home for life in the ancient past.",
      sourceIds: ["nasa-2026"],
    },
  ],
  unknowns: [
    {
      kind: "unknown",
      text: "Origin is unknown. Neither a biological nor a geological origin can be determined from these results.",
      quote: "Scientists have no way of knowing whether these organic molecules were created by biologic or geologic processes",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "unknown",
      text: "The detected molecules may be fragments of larger original compounds, because TMAH is used to break larger molecules apart.",
      quote: "The resulting reactions can break apart larger molecules that would be difficult to detect and identify otherwise.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "unknown",
      text: "The NASA article names only two of the molecules (benzothiophene and a nitrogen heterocycle). The full list of 21, and which seven are new, is not given there.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "unknown",
      text: "Exact drill-hole coordinates are not given in the NASA sources, so the map shows an approximate Gale Crater locator instead of the sample site.",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "unknown",
      text: "The exact drilling date is not given; NASA states only that the rock was drilled and analysed in 2020.",
      quote: "A rock that NASA\u2019s Curiosity Mars rover drilled and analyzed in 2020",
      sourceIds: ["nasa-2026"],
    },
    {
      kind: "unknown",
      text: "This record summarises NASA's announcement. The peer-reviewed paper itself has not been reviewed here.",
      sourceIds: ["paper-2026"],
    },
  ],
  // The drill-hole coordinates are not stated by NASA: this is the crater centre.
  coordinates: { lat: GALE_CRATER_LOCATOR.center.lat, lon: GALE_CRATER_LOCATOR.center.lon },
  coordinateAccuracy: "approximate-crater",
  coordinateLabel: "Approximate Gale Crater locator, not the sample site",
  coordinateSourceIds: ["usgs-gale"],
  identitySourceIds: ["nasa-2026", "nasa-2020"],
  primarySourceId: "nasa-2026",
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
