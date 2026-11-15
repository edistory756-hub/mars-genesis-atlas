import type { MapLocator } from "../schema";

/**
 * Shared approximate map regions. Each marks a whole named feature, never a
 * sample site, so several records can point at the same one.
 */

/** Gale Crater from the IAU/USGS Gazetteer of Planetary Nomenclature (Feature 2071, MDIM 2.1). */
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
