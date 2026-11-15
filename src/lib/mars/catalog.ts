/**
 * NASA Mars Trek equirectangular WMTS layers used by the Mars Explorer.
 *
 * Every entry is copied from the official Mars Trek API documentation
 * (https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars). The map never
 * trusts this list alone: each layer's GetCapabilities document is fetched and
 * a real tile is loaded before the layer can be switched on.
 */

export const TREK_API_DOC_URL = "https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars";
export const TREK_PORTAL_URL = "https://trek.nasa.gov/mars/";
const TREK_EQ_ROOT = "https://trek.nasa.gov/tiles/Mars/EQ";

export type MarsLayerKind = "base" | "overlay";
export type MarsInstrument = "MOLA" | "MOLA + HRSC" | "TES";

export interface MarsLayerDef {
  /** NASA Trek layer identifier (ows:Identifier in the capabilities). */
  id: string;
  /** Title as published in the Mars Trek API documentation. */
  title: string;
  shortTitle: string;
  kind: MarsLayerKind;
  instrument: MarsInstrument;
  /** Spacecraft / mission credited in the attribution. */
  mission: string;
}

export const MARS_LAYERS: MarsLayerDef[] = [
  {
    id: "Mars_MGS_MOLA_ClrShade_merge_global_463m",
    title: "MGS MOLA, Global Color Hillshade",
    shortTitle: "MOLA color hillshade",
    kind: "base",
    instrument: "MOLA",
    mission: "Mars Global Surveyor (MOLA)",
  },
  {
    id: "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw",
    title: "MGS MOLA and Mars Express HRSC, Color Hillshade Blend",
    shortTitle: "MOLA + HRSC color hillshade",
    kind: "base",
    instrument: "MOLA + HRSC",
    mission: "Mars Global Surveyor (MOLA) / ESA Mars Express (HRSC)",
  },
  {
    id: "Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw",
    title: "MGS MOLA and Mars Express HRSC, Hillshade Blend",
    shortTitle: "MOLA + HRSC hillshade",
    kind: "base",
    instrument: "MOLA + HRSC",
    mission: "Mars Global Surveyor (MOLA) / ESA Mars Express (HRSC)",
  },
  {
    id: "mola_roughness",
    title: "MGS MOLA, Global Surface Roughness",
    shortTitle: "MOLA surface roughness",
    kind: "overlay",
    instrument: "MOLA",
    mission: "Mars Global Surveyor (MOLA)",
  },
  {
    id: "TES_Dust",
    title: "MGS TES, Global Dust",
    shortTitle: "TES dust",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "tes_ruffdust",
    title: "MGS TES, Global Dust Index",
    shortTitle: "TES dust index",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "TES_Clinopyroxene",
    title: "MGS TES, Global High-Ca Pyroxene Abundance",
    shortTitle: "TES high-Ca pyroxene",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "TES_Plagioclase",
    title: "MGS TES, Global Plagioclase Abundance",
    shortTitle: "TES plagioclase",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "TES_Glass_Clay",
    title: "MGS TES, Global Sheet Silicates/High-Si Glass",
    shortTitle: "TES sheet silicates / high-Si glass",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "Mars_MGS_TES_Albedo_mosaic_global_7410m",
    title: "MGS TES, Global Surface Albedo",
    shortTitle: "TES surface albedo",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
  {
    id: "TES_Thermal_Inertia",
    title: "MGS TES, Global Thermal Inertia",
    shortTitle: "TES thermal inertia",
    kind: "overlay",
    instrument: "TES",
    mission: "Mars Global Surveyor (TES)",
  },
];

export const DEFAULT_BASE_LAYER_ID = "Mars_MGS_MOLA_ClrShade_merge_global_463m";

export function capabilitiesUrl(layerId: string): string {
  return `${TREK_EQ_ROOT}/${layerId}/1.0.0/WMTSCapabilities.xml`;
}

export function getLayerDef(layerId: string): MarsLayerDef | undefined {
  return MARS_LAYERS.find((l) => l.id === layerId);
}

export function attributionFor(layer: MarsLayerDef): string {
  return `NASA Mars Trek · ${layer.mission}`;
}
