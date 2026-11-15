import { addEquivalentProjections, addProjection, get as getProjection } from "ol/proj";
import Projection from "ol/proj/Projection";

/**
 * Mars 2000 geographic CRS as advertised by NASA Mars Trek capabilities:
 * `urn:ogc:def:crs:EPSG::104905` (ESRI GCS_Mars_2000). Coordinates are
 * longitude/latitude degrees on Mars, x = east-positive longitude.
 *
 * Units are "degrees" on purpose: Trek's ScaleDenominator values were computed
 * with OpenLayers' standard meters-per-degree, so level 0 resolves to exactly
 * 360° / 512 px and tiles align. That value is NOT a Mars ground distance; use
 * MARS_METERS_PER_DEGREE from ./coords for anything shown to people.
 */
export const MARS_CRS_CODE = "EPSG:104905";
export const MARS_CRS_URN = "urn:ogc:def:crs:EPSG::104905";
export const MARS_EXTENT: [number, number, number, number] = [-180, -90, 180, 90];

export function getMarsProjection(): Projection {
  const existing = getProjection(MARS_CRS_CODE);
  if (existing) return existing;

  const projection = new Projection({
    code: MARS_CRS_CODE,
    units: "degrees",
    extent: MARS_EXTENT,
    worldExtent: MARS_EXTENT,
    axisOrientation: "enu",
    global: true,
  });
  addProjection(projection);
  const urnAlias = new Projection({
    code: MARS_CRS_URN,
    units: "degrees",
    extent: MARS_EXTENT,
    worldExtent: MARS_EXTENT,
    axisOrientation: "enu",
    global: true,
  });
  addProjection(urnAlias);
  addEquivalentProjections([projection, urnAlias]);
  return projection;
}
