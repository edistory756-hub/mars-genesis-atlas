/**
 * Coordinate helpers for the Mars 2000 geographic CRS (EPSG/ESRI 104905,
 * "GCS_Mars_2000"): planetocentric latitude, east-positive longitude, sphere
 * radius 3,396,190 m (IAU 2000).
 */

export const MARS_RADIUS_M = 3_396_190;
/** Ground length of one degree along a great circle on the Mars 2000 sphere. */
export const MARS_METERS_PER_DEGREE = (2 * Math.PI * MARS_RADIUS_M) / 360;

export function normalizeLon180(lon: number): number {
  const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 && lon > 0 ? 180 : wrapped;
}

export function toLon360(lon: number): number {
  return ((normalizeLon180(lon) % 360) + 360) % 360;
}

export function formatLat(lat: number, digits = 3): string {
  const hemi = lat >= 0 ? "N" : "S";
  return `${Math.abs(lat).toFixed(digits)}° ${hemi}`;
}

export function formatLonEast180(lon: number, digits = 3): string {
  const l = normalizeLon180(lon);
  const hemi = l >= 0 ? "E" : "W";
  return `${Math.abs(l).toFixed(digits)}° ${hemi}`;
}

export function formatLonEast360(lon: number, digits = 3): string {
  return `${toLon360(lon).toFixed(digits)}° E`;
}

/** Map resolution (degrees per pixel) -> Mars ground distance per pixel at the equator, in km. */
export function equatorialKmPerPixel(degreesPerPixel: number): number {
  return (degreesPerPixel * MARS_METERS_PER_DEGREE) / 1000;
}
