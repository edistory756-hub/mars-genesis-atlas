import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { EVIDENCE_RECORDS, GALE_CRATER_LOCATOR, MARY_ANNING_3, getEvidence } from "@/lib/evidence/records";
import { routeTree } from "@/routeTree.gen";

describe("Mary Anning 3 evidence record", () => {
  it("records 21 carbon-containing molecules, seven new to Mars", () => {
    expect(MARY_ANNING_3.findings.carbonMoleculesIdentified).toBe(21);
    expect(MARY_ANNING_3.findings.firstTimeOnMars).toBe(7);
  });

  it("keeps the origin open: biological or geological, not established", () => {
    expect(MARY_ANNING_3.findings.origin).toEqual({
      biological: "possible",
      geological: "possible",
      established: false,
    });
    // Origin claims live only among hypotheses, never as observations.
    expect(MARY_ANNING_3.observations.some((s) => /origin/i.test(s.text))).toBe(false);
  });

  it("links the official NASA article as its source", () => {
    expect(MARY_ANNING_3.primarySourceUrl).toBe(
      "https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-finds-organic-molecules-never-seen-before-on-mars/",
    );
  });

  it("does not invent sample coordinates or a sampling date", () => {
    expect(MARY_ANNING_3.location.exactSampleCoordinates).toBeNull();
    expect(MARY_ANNING_3.dates.sampledOn).toBeNull();
  });

  it("uses an approximate Gale Crater locator from the IAU/USGS gazetteer", () => {
    const loc = MARY_ANNING_3.location.locator;
    expect(loc).toBe(GALE_CRATER_LOCATOR);
    expect(loc.precision).toBe("approximate-region");
    expect(loc.center).toEqual({ lat: -5.37, lon: 137.81 });
    expect(loc.diameterKm).toBe(154.08);
  });

  it("files every statement under the section matching its kind", () => {
    for (const r of EVIDENCE_RECORDS) {
      expect(r.observations.every((s) => s.kind === "observation")).toBe(true);
      expect(r.interpretations.every((s) => s.kind === "interpretation")).toBe(true);
      expect(r.hypotheses.every((s) => s.kind === "hypothesis")).toBe(true);
      expect(r.unknowns.every((s) => s.kind === "unknown")).toBe(true);
    }
  });
});

describe("Evidence routing", () => {
  it("matches /nasa-evidence", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/nasa-evidence").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("resolves evidence ids used to focus the map, and rejects unknown ones", () => {
    expect(getEvidence("mary-anning-3")).toBe(MARY_ANNING_3);
    expect(getEvidence("made-up")).toBeUndefined();
  });
});
