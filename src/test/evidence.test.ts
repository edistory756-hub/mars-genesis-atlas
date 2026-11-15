import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { GALE_CRATER_LOCATOR } from "@/lib/evidence/data/locators";
import { MARY_ANNING_3 } from "@/lib/evidence/data/mary-anning-3";
import {
  EVIDENCE_LIBRARY,
  formatEvidenceDate,
  getEvidenceRecord,
  getPrimarySource,
  validateEvidenceLibrary,
  validateEvidenceRecord,
} from "@/lib/evidence/library";
import { EVIDENCE_RECORDS, getEvidence } from "@/lib/evidence/records";
import { NOT_STATED, type EvidenceRecord } from "@/lib/evidence/schema";
import { routeTree } from "@/routeTree.gen";

/** A deep copy of Mary Anning 3 with one change, to prove each rule can fail. */
function variant(change: (r: EvidenceRecord) => void): EvidenceRecord {
  const r = structuredClone(MARY_ANNING_3);
  change(r);
  return r;
}

describe("Mary Anning 3 evidence record", () => {
  it("is the first record in the library", () => {
    expect(EVIDENCE_LIBRARY[0]).toBe(MARY_ANNING_3);
  });

  it("records 21 carbon-containing molecules, seven new to Mars", () => {
    expect(MARY_ANNING_3.organicChemistry?.carbonMoleculesIdentified).toBe(21);
    expect(MARY_ANNING_3.organicChemistry?.firstTimeOnMars).toBe(7);
    const figures = Object.fromEntries(MARY_ANNING_3.keyFindings.map((f) => [f.id, f.value]));
    expect(figures["carbon-molecules-identified"]).toBe(21);
    expect(figures["first-time-on-mars"]).toBe(7);
  });

  it("keeps the origin open: biological or geological, not established", () => {
    expect(MARY_ANNING_3.organicChemistry?.origin).toEqual({
      biological: "possible",
      geological: "possible",
      established: false,
    });
    expect(MARY_ANNING_3.observations.some((s) => /origin/i.test(s.text))).toBe(false);
  });

  it("keeps all 21 statements of the original record", () => {
    expect(MARY_ANNING_3.observations).toHaveLength(6);
    expect(MARY_ANNING_3.interpretations).toHaveLength(5);
    expect(MARY_ANNING_3.hypotheses).toHaveLength(4);
    expect(MARY_ANNING_3.unknowns).toHaveLength(6);
  });

  it("links the official NASA article as its primary source", () => {
    expect(getPrimarySource(MARY_ANNING_3).url).toBe(
      "https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-finds-organic-molecules-never-seen-before-on-mars/",
    );
  });

  it("stores the sampling date only to the year NASA states", () => {
    expect(MARY_ANNING_3.observationDate.value).toBe("2020");
    expect(MARY_ANNING_3.observationDate.precision).toBe("year");
    expect(MARY_ANNING_3.publicationDate.value).toBe("2026-04-21");
  });

  it("uses the approximate Gale Crater centre, not invented sample coordinates", () => {
    expect(MARY_ANNING_3.coordinateAccuracy).toBe("approximate-crater");
    expect(MARY_ANNING_3.coordinates).toEqual({ lat: -5.37, lon: 137.81 });
    expect(MARY_ANNING_3.location.region).toBe(GALE_CRATER_LOCATOR);
    expect(GALE_CRATER_LOCATOR.diameterKm).toBe(154.08);
  });

  it("does not present the cited Nature Communications paper as reviewed", () => {
    const paper = MARY_ANNING_3.sources.find((s) => s.type === "peer-reviewed-paper");
    expect(paper?.reviewStatus).toBe("not-reviewed");
  });

  it("keeps NASA's image credit", () => {
    expect(MARY_ANNING_3.image?.credit).toBe("NASA/JPL-Caltech/MSSS");
  });
});

describe("Evidence library rules", () => {
  it("every record in the library passes validation", () => {
    expect(validateEvidenceLibrary()).toEqual([]);
  });

  it("rejects a statement citing a source that is not listed", () => {
    const r = variant((r) => (r.observations[0]!.sourceIds = ["made-up"]));
    expect(validateEvidenceRecord(r).join()).toMatch(/unknown source "made-up"/);
  });

  it("rejects a statement filed under the wrong kind", () => {
    const r = variant((r) => (r.observations[0]!.kind = "hypothesis"));
    expect(validateEvidenceRecord(r).join()).toMatch(/observation #1 is tagged "hypothesis"/);
  });

  it("rejects coordinates when the accuracy is not stated", () => {
    const r = variant((r) => (r.coordinateAccuracy = "not-stated"));
    expect(validateEvidenceRecord(r).join()).toMatch(/coordinates must be null/);
  });

  it("rejects approximate coordinates that are not labelled approximate", () => {
    const r = variant((r) => (r.coordinateLabel = "Gale Crater"));
    expect(validateEvidenceRecord(r).join()).toMatch(/must say the location is approximate/);
  });

  it("rejects approximate coordinates that differ from the region centre", () => {
    const r = variant((r) => (r.coordinates = { lat: -4.59, lon: 137.44 }));
    expect(validateEvidenceRecord(r).join()).toMatch(/must equal the region centre/);
  });

  it("rejects a date whose value is more precise than stated", () => {
    const r = variant((r) => (r.observationDate.value = "2020-10-25"));
    expect(validateEvidenceRecord(r).join()).toMatch(/does not match precision "year"/);
  });

  it("rejects an observation worded as proof of life", () => {
    const r = variant((r) => (r.observations[0]!.text = "These molecules prove that life existed on Mars."));
    expect(validateEvidenceRecord(r).join()).toMatch(/reads as proof of life/);
  });

  it("rejects a primary source that was not actually read", () => {
    const r = variant((r) => (r.sources[0]!.reviewStatus = "not-reviewed"));
    expect(validateEvidenceRecord(r).join()).toMatch(/primary source must have been read/);
  });

  it("shows 'Not stated in the cited source' for a missing date", () => {
    expect(formatEvidenceDate({ value: null, precision: null, note: "", sourceIds: ["x"] })).toBe(NOT_STATED);
    expect(NOT_STATED).toBe("Not stated in the cited source");
  });
});

describe("Evidence routing and map links", () => {
  it("matches /nasa-evidence", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/nasa-evidence").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("resolves record ids, and rejects unknown ones", () => {
    expect(getEvidenceRecord("mary-anning-3")).toBe(MARY_ANNING_3);
    expect(getEvidenceRecord("made-up")).toBeUndefined();
  });

  it("gives the Mars map the same Mary Anning 3 region and counts", () => {
    const entry = getEvidence("mary-anning-3");
    expect(entry?.location.locator).toBe(GALE_CRATER_LOCATOR);
    expect(entry?.findings).toEqual({ carbonMoleculesIdentified: 21, firstTimeOnMars: 7 });
    expect(entry?.sample.name).toBe("Mary Anning 3");
    expect(entry?.rover).toBe("Curiosity");
    expect(EVIDENCE_RECORDS.map((r) => r.id)).toEqual(["mary-anning-3"]);
    expect(getEvidence("made-up")).toBeUndefined();
  });
});
