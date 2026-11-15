import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { getLayerDef } from "@/lib/mars/catalog";
import { parseTrekCapabilities } from "@/lib/mars/capabilities";
import { MARS_METERS_PER_DEGREE, equatorialKmPerPixel, formatLonEast360, normalizeLon180 } from "@/lib/mars/coords";

// Fixtures are verbatim copies of NASA Mars Trek GetCapabilities documents.
const fixture = (name: string) =>
  readFileSync(path.resolve(__dirname, "fixtures", name), "utf8");

describe("NASA Mars Trek WMTS configuration", () => {
  it("configures the MOLA color hillshade from its real capabilities", () => {
    const layer = getLayerDef("Mars_MGS_MOLA_ClrShade_merge_global_463m")!;
    const v = parseTrekCapabilities(fixture("mola-clrshade-capabilities.xml"), layer);

    expect(v.matrixSet).toBe("default028mm");
    expect(v.style).toBe("default");
    expect(v.format).toBe("image/jpeg");
    expect(v.supportedCrs).toBe("urn:ogc:def:crs:EPSG::104905");
    expect(v.tileUrlTemplate).toContain(
      "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/",
    );
    expect(v.probeTileUrl).toBe(
      "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/0/0/0.jpg",
    );
    expect(v.zoomLevels).toBe(8);
  });

  it("uses Mars 2000 degrees with level 0 = 2x1 tiles covering 360 degrees", () => {
    const layer = getLayerDef("Mars_MGS_MOLA_ClrShade_merge_global_463m")!;
    const v = parseTrekCapabilities(fixture("mola-clrshade-capabilities.xml"), layer);
    const grid = v.options.tileGrid;

    expect(grid.getResolution(0)).toBeCloseTo(360 / 512, 6);
    expect(grid.getOrigin(0)).toEqual([-180, 90]);
    const proj = v.options.projection as { getCode(): string; getUnits(): string };
    expect(proj.getCode()).toContain("104905");
    expect(proj.getUnits()).toBe("degrees");
  });

  it("configures a TES overlay with its own PNG template", () => {
    const layer = getLayerDef("TES_Dust")!;
    const v = parseTrekCapabilities(fixture("tes-dust-capabilities.xml"), layer);
    expect(v.format).toBe("image/png");
    expect(v.probeTileUrl.endsWith("/default/default028mm/0/0/0.png")).toBe(true);
  });

  it("rejects capabilities that advertise an Earth CRS", () => {
    const layer = getLayerDef("TES_Dust")!;
    const xml = fixture("tes-dust-capabilities.xml").replaceAll(
      "urn:ogc:def:crs:EPSG::104905",
      "urn:ogc:def:crs:EPSG::3857",
    );
    expect(() => parseTrekCapabilities(xml, layer)).toThrow(/Unexpected CRS/);
  });
});

describe("Mars coordinates", () => {
  it("uses the Mars 2000 radius for ground distances", () => {
    expect(MARS_METERS_PER_DEGREE).toBeCloseTo(59274.7, 0);
    expect(equatorialKmPerPixel(360 / 512)).toBeCloseTo(41.68, 1);
  });

  it("formats east-positive longitudes", () => {
    expect(normalizeLon180(190)).toBe(-170);
    expect(formatLonEast360(-137.4, 1)).toBe("222.6° E");
  });
});
