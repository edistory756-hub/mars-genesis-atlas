import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { optionsFromCapabilities, type Options as WMTSOptions } from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

import { capabilitiesUrl, type MarsLayerDef } from "./catalog";
import { MARS_CRS_CODE, MARS_EXTENT, getMarsProjection } from "./projection";

/** What we actually read from NASA's capabilities document for one layer. */
export interface VerifiedLayer {
  layer: MarsLayerDef;
  capabilitiesUrl: string;
  options: WMTSOptions;
  matrixSet: string;
  style: string;
  format: string;
  supportedCrs: string;
  tileUrlTemplate: string;
  zoomLevels: number;
  extent: number[];
  probeTileUrl: string;
}

export class TrekLayerError extends Error {
  constructor(
    message: string,
    readonly stage: "capabilities" | "parse" | "projection" | "tile",
  ) {
    super(message);
    this.name = "TrekLayerError";
  }
}

interface ParsedTileMatrixSet {
  Identifier: string;
  SupportedCRS: string;
  TileMatrix: {
    Identifier: string;
    ScaleDenominator: number;
    TopLeftCorner: [number, number];
    TileWidth: number;
    TileHeight: number;
  }[];
}

/**
 * OpenLayers' parser drops MatrixWidth/MatrixHeight because Trek writes them as
 * decimals ("2.0"), so read them from the XML directly.
 */
function readMatrixSizes(xml: string, matrixSetId: string): Map<string, [number, number]> {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const sizes = new Map<string, [number, number]>();
  const sets = Array.from(doc.getElementsByTagNameNS("*", "TileMatrixSet")).filter(
    (el) => el.parentElement?.localName === "Contents",
  );
  const set = sets.find(
    (el) =>
      Array.from(el.children).find((c) => c.localName === "Identifier")?.textContent?.trim() ===
      matrixSetId,
  );
  if (!set) return sizes;
  for (const tm of Array.from(set.children).filter((c) => c.localName === "TileMatrix")) {
    const get = (name: string) =>
      Array.from(tm.children).find((c) => c.localName === name)?.textContent?.trim() ?? "";
    const w = Number.parseFloat(get("MatrixWidth"));
    const h = Number.parseFloat(get("MatrixHeight"));
    if (Number.isFinite(w) && Number.isFinite(h)) sizes.set(get("Identifier"), [w, h]);
  }
  return sizes;
}

/**
 * Rebuild the tile grid from the matrix dimensions NASA advertises. Trek's
 * global grids span the full 360° Mars 2000 extent (2 x 1 tiles at level 0,
 * doubling per level); its ScaleDenominator values are rounded and drift ~2 ppm
 * from that geometry, so we use exact resolutions after checking they agree.
 */
function exactTileGrid(
  matrixSet: ParsedTileMatrixSet,
  sizesById: Map<string, [number, number]>,
  scaleGrid: WMTSTileGrid,
): WMTSTileGrid {
  const span = MARS_EXTENT[2] - MARS_EXTENT[0];
  const matrices = matrixSet.TileMatrix;
  const sizes = matrices.map((m) => {
    const size = sizesById.get(m.Identifier);
    if (!size) {
      throw new TrekLayerError(`Tile matrix ${m.Identifier} has no MatrixWidth/Height`, "parse");
    }
    return size;
  });
  const resolutions = matrices.map((m, i) => span / ((sizes[i]?.[0] ?? 0) * m.TileWidth));
  resolutions.forEach((res, i) => {
    const fromScale = scaleGrid.getResolution(i);
    if (Math.abs(fromScale - res) / res > 1e-4) {
      throw new TrekLayerError(
        `Tile matrix ${matrices[i]?.Identifier} does not span the Mars 2000 extent`,
        "projection",
      );
    }
  });
  return new WMTSTileGrid({
    origins: matrices.map((m) => m.TopLeftCorner),
    resolutions,
    matrixIds: matrices.map((m) => m.Identifier),
    tileSizes: matrices.map((m) => [m.TileWidth, m.TileHeight]),
    sizes,
    extent: scaleGrid.getExtent() ?? MARS_EXTENT,
  });
}

/**
 * Parse a Trek WMTS GetCapabilities XML string into OpenLayers WMTS options,
 * enforcing that the advertised CRS is the Mars 2000 CRS we registered.
 */
export function parseTrekCapabilities(xml: string, layer: MarsLayerDef): VerifiedLayer {
  getMarsProjection();
  const parsed = new WMTSCapabilities().read(xml);
  const contents = parsed?.Contents;
  const layerEntry = contents?.Layer?.find(
    (l: { Identifier: string }) => l.Identifier === layer.id,
  );
  if (!layerEntry) {
    throw new TrekLayerError(`Layer ${layer.id} not found in NASA capabilities`, "parse");
  }
  const matrixSetId: string | undefined = layerEntry.TileMatrixSetLink?.[0]?.TileMatrixSet;
  const matrixSet: ParsedTileMatrixSet | undefined = contents.TileMatrixSet?.find(
    (s: ParsedTileMatrixSet) => s.Identifier === matrixSetId,
  );
  if (!matrixSetId || !matrixSet) {
    throw new TrekLayerError(`No tile matrix set advertised for ${layer.id}`, "parse");
  }
  const crs = matrixSet.SupportedCRS;
  if (!/EPSG:(.*:)?104905$/.test(crs)) {
    throw new TrekLayerError(
      `Unexpected CRS "${crs}" for ${layer.id}; expected Mars 2000 (EPSG::104905)`,
      "projection",
    );
  }

  const options = optionsFromCapabilities(parsed, {
    layer: layer.id,
    matrixSet: matrixSetId,
  });
  if (!options) {
    throw new TrekLayerError(`OpenLayers could not configure ${layer.id}`, "parse");
  }
  if (options.projection && typeof options.projection !== "string") {
    if (options.projection.getCode() !== MARS_CRS_CODE && !options.projection.getCode().includes("104905")) {
      throw new TrekLayerError(`Projection mismatch for ${layer.id}`, "projection");
    }
  }

  const template = options.urls?.[0];
  if (!template) {
    throw new TrekLayerError(`No tile URL template advertised for ${layer.id}`, "parse");
  }
  const firstMatrix = matrixSet.TileMatrix[0]?.Identifier ?? "0";
  const probeTileUrl = template
    .replace("{Style}", options.style)
    .replace("{style}", options.style)
    .replace("{TileMatrixSet}", matrixSetId)
    .replace("{TileMatrix}", firstMatrix)
    .replace("{TileRow}", "0")
    .replace("{TileCol}", "0");

  const tileGrid = exactTileGrid(
    matrixSet,
    readMatrixSizes(xml, matrixSetId),
    options.tileGrid as WMTSTileGrid,
  );
  options.tileGrid = tileGrid;
  return {
    layer,
    capabilitiesUrl: capabilitiesUrl(layer.id),
    options,
    matrixSet: matrixSetId,
    style: options.style,
    format: options.format ?? "image/jpeg",
    supportedCrs: crs,
    tileUrlTemplate: template,
    zoomLevels: tileGrid.getResolutions().length,
    extent: tileGrid.getExtent() ?? [],
    probeTileUrl,
  };
}

function loadImage(url: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      img.src = "";
      reject(new TrekLayerError("Timed out loading a test tile from NASA", "tile"));
    }, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      if (img.naturalWidth > 0) resolve();
      else reject(new TrekLayerError("NASA returned an empty test tile", "tile"));
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new TrekLayerError("NASA test tile failed to load", "tile"));
    };
    img.src = url;
  });
}

/** Fetch capabilities from NASA, parse them, and confirm one real tile loads. */
export async function verifyTrekLayer(
  layer: MarsLayerDef,
  signal?: AbortSignal,
): Promise<VerifiedLayer> {
  const url = capabilitiesUrl(layer.id);
  let xml: string;
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) {
      throw new TrekLayerError(`NASA capabilities returned HTTP ${res.status}`, "capabilities");
    }
    xml = await res.text();
  } catch (err) {
    if (err instanceof TrekLayerError) throw err;
    if ((err as Error)?.name === "AbortError") throw err;
    throw new TrekLayerError("Could not reach NASA Mars Trek capabilities", "capabilities");
  }
  const verified = parseTrekCapabilities(xml, layer);
  await loadImage(verified.probeTileUrl, 15000);
  return verified;
}
