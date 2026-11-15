import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "ol/ol.css";
import OlMap from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import WMTS from "ol/source/WMTS";
import { Attribution, Zoom, defaults as defaultControls } from "ol/control";
import { containsCoordinate } from "ol/extent";
import { Circle, Fill, Stroke, Style } from "ol/style";
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_BASE_LAYER_ID,
  MARS_LAYERS,
  TREK_API_DOC_URL,
  TREK_PORTAL_URL,
  attributionFor,
  getLayerDef,
  type MarsLayerDef,
} from "@/lib/mars/catalog";
import { TrekLayerError, verifyTrekLayer, type VerifiedLayer } from "@/lib/mars/capabilities";
import {
  equatorialKmPerPixel,
  formatLat,
  formatLonEast180,
  formatLonEast360,
  normalizeLon180,
} from "@/lib/mars/coords";
import { MARS_EXTENT, getMarsProjection } from "@/lib/mars/projection";

type LayerStatus =
  | { state: "checking" }
  | { state: "ready"; verified: VerifiedLayer }
  | { state: "failed"; message: string };

interface TileStats {
  pending: number;
  loaded: number;
  errors: number;
}

interface LonLat {
  lon: number;
  lat: number;
}

const emptyStats = (): TileStats => ({ pending: 0, loaded: 0, errors: 0 });
const CHECKING: LayerStatus = { state: "checking" };

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function MarsExplorer() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const layersRef = useRef(new Map<string, TileLayer<WMTS>>());
  const markerSourceRef = useRef(new VectorSource());
  const statsRef = useRef(new Map<string, TileStats>());
  const rafRef = useRef<number | null>(null);
  const controllersRef = useRef(new Map<string, AbortController>());

  const [statuses, setStatuses] = useState<Record<string, LayerStatus>>(() =>
    Object.fromEntries(MARS_LAYERS.map((l) => [l.id, { state: "checking" } as LayerStatus])),
  );
  const [baseId, setBaseId] = useState(DEFAULT_BASE_LAYER_ID);
  const [overlayId, setOverlayId] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [statsTick, setStatsTick] = useState(0);
  const [pointer, setPointer] = useState<LonLat | null>(null);
  const [selected, setSelected] = useState<LonLat | null>(null);
  const [resolution, setResolution] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ---- 1. Verify every catalog layer against NASA (capabilities + one real tile).
  const verify = useCallback((layer: MarsLayerDef) => {
    controllersRef.current.get(layer.id)?.abort();
    const controller = new AbortController();
    controllersRef.current.set(layer.id, controller);
    setStatuses((s) => ({ ...s, [layer.id]: { state: "checking" } }));
    verifyTrekLayer(layer, controller.signal)
      .then((verified) => {
        if (controller.signal.aborted) return;
        setStatuses((s) => ({ ...s, [layer.id]: { state: "ready", verified } }));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof TrekLayerError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown error contacting NASA Mars Trek";
        setStatuses((s) => ({ ...s, [layer.id]: { state: "failed", message } }));
      });
  }, []);

  useEffect(() => {
    MARS_LAYERS.forEach(verify);
    const controllers = controllersRef.current;
    return () => controllers.forEach((c) => c.abort());
  }, [verify]);

  const scheduleStatsRender = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setStatsTick((t) => t + 1);
    });
  }, []);

  // ---- 2. Create one OpenLayers tile layer per verified NASA layer, on demand.
  const ensureLayer = useCallback(
    (verified: VerifiedLayer) => {
      const id = verified.layer.id;
      const existing = layersRef.current.get(id);
      if (existing) return existing;
      const source = new WMTS({
        ...verified.options,
        crossOrigin: "anonymous",
        wrapX: false,
        attributions: `${attributionFor(verified.layer)} — <a href="${TREK_PORTAL_URL}" target="_blank" rel="noreferrer">trek.nasa.gov</a>`,
        attributionsCollapsible: false,
      });
      const stats = emptyStats();
      statsRef.current.set(id, stats);
      source.on("tileloadstart", () => {
        stats.pending++;
        scheduleStatsRender();
      });
      source.on("tileloadend", () => {
        stats.pending = Math.max(0, stats.pending - 1);
        stats.loaded++;
        scheduleStatsRender();
      });
      source.on("tileloaderror", () => {
        stats.pending = Math.max(0, stats.pending - 1);
        stats.errors++;
        scheduleStatsRender();
      });
      const layer = new TileLayer({
        source,
        visible: false,
        zIndex: verified.layer.kind === "base" ? 0 : 1,
        preload: verified.layer.kind === "base" ? 1 : 0,
      });
      layersRef.current.set(id, layer);
      mapRef.current?.addLayer(layer);
      return layer;
    },
    [scheduleStatsRender],
  );

  // ---- 3. Build the map once the default base layer has passed verification.
  const defaultStatus = statuses[DEFAULT_BASE_LAYER_ID] ?? CHECKING;
  useEffect(() => {
    if (mapRef.current || !mapEl.current || defaultStatus.state !== "ready") return;
    const projection = getMarsProjection();
    const baseRes = defaultStatus.verified.options.tileGrid.getResolutions();
    // One zoomed-out stop so the whole planet fits narrow screens, plus overzoom stops.
    const coarsest = baseRes[0] ?? 360 / 512;
    const resolutions = [coarsest * 2, ...baseRes];
    while (resolutions.length < 14) resolutions.push((resolutions.at(-1) ?? coarsest) / 2);

    const primary = cssVar("--primary", "#d9622b");
    const fg = cssVar("--foreground", "#f1ece4");
    const bg = cssVar("--background", "#1c1714");
    const markerLayer = new VectorLayer({
      source: markerSourceRef.current,
      zIndex: 10,
      style: [
        new Style({
          image: new Circle({ radius: 11, stroke: new Stroke({ color: bg, width: 5 }) }),
        }),
        new Style({
          image: new Circle({
            radius: 11,
            stroke: new Stroke({ color: primary, width: 2.5 }),
            fill: new Fill({ color: "rgba(0,0,0,0)" }),
          }),
        }),
        new Style({
          image: new Circle({ radius: 2.5, fill: new Fill({ color: fg }) }),
        }),
      ],
    });

    const map = new OlMap({
      target: mapEl.current,
      layers: [markerLayer],
      controls: defaultControls({ attribution: false, zoom: false, rotate: false }).extend([
        new Zoom({ zoomInTipLabel: "Zoom in", zoomOutTipLabel: "Zoom out" }),
        new Attribution({ collapsible: false }),
      ]),
      view: new View({
        projection,
        center: [0, 0],
        resolutions,
        extent: MARS_EXTENT,
        constrainOnlyCenter: true,
        showFullExtent: true,
        multiWorld: false,
      }),
    });
    map.getView().fit(MARS_EXTENT, { size: map.getSize(), nearest: false });
    mapRef.current = map;

    // Layers created before the map existed (not expected, but safe).
    layersRef.current.forEach((l) => map.addLayer(l));

    let moveRaf: number | null = null;
    map.on("pointermove", (evt) => {
      if (evt.dragging) return;
      const [lon = 0, lat = 0] = evt.coordinate;
      if (moveRaf != null) cancelAnimationFrame(moveRaf);
      moveRaf = requestAnimationFrame(() => {
        setPointer(containsCoordinate(MARS_EXTENT, [lon, lat]) ? { lon, lat } : null);
      });
    });
    const viewportEl = map.getViewport();
    viewportEl?.addEventListener("pointerleave", () => setPointer(null));
    map.on("singleclick", (evt) => {
      const [lon = 0, lat = 0] = evt.coordinate;
      if (!containsCoordinate(MARS_EXTENT, [lon, lat])) return;
      markerSourceRef.current.clear();
      markerSourceRef.current.addFeature(new Feature(new Point([lon, lat])));
      setSelected({ lon: normalizeLon180(lon), lat });
    });
    map.getView().on("change:resolution", () => setResolution(map.getView().getResolution() ?? null));
    setResolution(map.getView().getResolution() ?? null);

    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(mapEl.current);
    setMapReady(true);

    return () => {
      ro.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
      layersRef.current.clear();
      statsRef.current.clear();
      setMapReady(false);
    };
  }, [defaultStatus]);

  // ---- 4. Keep layer visibility in sync with the user's choices.
  useEffect(() => {
    if (!mapReady) return;
    const base = statuses[baseId];
    const overlay = overlayId ? statuses[overlayId] : undefined;
    if (base?.state === "ready") ensureLayer(base.verified);
    if (overlay?.state === "ready") ensureLayer(overlay.verified);
    layersRef.current.forEach((layer, id) => {
      const visible = id === baseId || id === overlayId;
      layer.setVisible(visible);
      if (id === overlayId) layer.setOpacity(overlayOpacity);
    });
  }, [mapReady, statuses, baseId, overlayId, overlayOpacity, ensureLayer]);

  // A selected layer that later fails verification is switched off.
  useEffect(() => {
    if (overlayId && statuses[overlayId]?.state === "failed") setOverlayId(null);
  }, [overlayId, statuses]);

  const retryTiles = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => {
        const layer = layersRef.current.get(id);
        const stats = statsRef.current.get(id);
        if (stats) Object.assign(stats, emptyStats());
        layer?.getSource()?.refresh();
      });
      scheduleStatsRender();
    },
    [scheduleStatsRender],
  );

  const resetView = () => {
    const map = mapRef.current;
    map?.getView().fit(MARS_EXTENT, { size: map.getSize(), nearest: false, duration: 400 });
  };

  const clearSelection = () => {
    markerSourceRef.current.clear();
    setSelected(null);
  };

  // ---- Derived UI state
  const activeIds = useMemo(
    () => [baseId, ...(overlayId ? [overlayId] : [])],
    [baseId, overlayId],
  );
  const activeStats = useMemo(() => {
    void statsTick;
    return activeIds.map((id) => ({ id, stats: statsRef.current.get(id) ?? emptyStats() }));
  }, [activeIds, statsTick]);
  const pendingTiles = activeStats.reduce((n, s) => n + s.stats.pending, 0);
  const failing = activeStats.filter((s) => s.stats.errors > 0);
  const baseDef = getLayerDef(baseId)!;
  const overlayDef = overlayId ? getLayerDef(overlayId) : undefined;
  const baseStatus = statuses[baseId] ?? CHECKING;
  const bases = MARS_LAYERS.filter((l) => l.kind === "base");
  const overlays = MARS_LAYERS.filter((l) => l.kind === "overlay");
  const verifiedCount = Object.values(statuses).filter((s) => s.state === "ready").length;
  const checkingCount = Object.values(statuses).filter((s) => s.state === "checking").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Map */}
      <section
        aria-label="Interactive map of Mars"
        className="relative overflow-hidden rounded-lg border bg-card shadow-panel"
      >
        <div
          ref={mapEl}
          tabIndex={0}
          aria-label="Mars map. Drag to pan, scroll or use + and − to zoom, click to select a location."
          className="mars-map h-[62vh] min-h-[380px] w-full bg-background lg:h-[calc(100vh-11rem)]"
        />

        {/* Blocking states: default layer still verifying or failed */}
        {!mapReady && defaultStatus.state === "checking" && (
          <div className="absolute inset-0 grid place-items-center bg-background/80">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="font-mono text-sm">Reading NASA Mars Trek capabilities…</p>
              <p className="text-eyebrow">Verifying {DEFAULT_BASE_LAYER_ID}</p>
            </div>
          </div>
        )}
        {!mapReady && defaultStatus.state === "failed" && (
          <div className="absolute inset-0 grid place-items-center bg-background/90 p-6">
            <div role="alert" className="max-w-md space-y-3 text-center">
              <AlertTriangle className="mx-auto size-7 text-destructive" />
              <h2 className="text-lg font-semibold">The NASA map could not be loaded</h2>
              <p className="text-sm text-muted-foreground">
                {defaultStatus.message}. No substitute imagery is shown.
              </p>
              <Button onClick={() => verify(getLayerDef(DEFAULT_BASE_LAYER_ID)!)}>
                <RefreshCw /> Retry
              </Button>
            </div>
          </div>
        )}

        {mapReady && (
          <>
            {/* Top-left HUD */}
            <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-5rem)] flex-col gap-2">
              <div className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md border bg-background/85 px-3 py-1.5 font-mono text-xs backdrop-blur">
                <Layers className="size-3.5 text-accent" />
                <span className="truncate">{baseDef.shortTitle}</span>
                {overlayDef && <span className="truncate text-accent">+ {overlayDef.shortTitle}</span>}
              </div>
              <div
                aria-live="polite"
                className={cn(
                  "inline-flex w-fit items-center gap-2 rounded-md border bg-background/85 px-3 py-1.5 font-mono text-xs backdrop-blur transition-opacity",
                  pendingTiles > 0 ? "opacity-100" : "opacity-0",
                )}
              >
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Loading {pendingTiles} NASA tile{pendingTiles === 1 ? "" : "s"}…
              </div>
            </div>

            {/* Tile error banner */}
            {failing.length > 0 && (
              <div
                role="alert"
                className="absolute inset-x-3 top-24 mx-auto flex max-w-lg flex-wrap items-center gap-3 rounded-md border border-destructive/60 bg-background/95 p-3 text-sm shadow-panel"
              >
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <p className="min-w-0 flex-1">
                  {failing
                    .map(
                      (f) =>
                        `${f.stats.errors} tile${f.stats.errors === 1 ? "" : "s"} failed for ${getLayerDef(f.id)?.shortTitle}`,
                    )
                    .join(" · ")}
                  . Those areas stay blank.
                </p>
                <Button size="sm" variant="outline" onClick={() => retryTiles(failing.map((f) => f.id))}>
                  <RefreshCw /> Retry tiles
                </Button>
              </div>
            )}

            {/* Bottom-left readout */}
            <div className="pointer-events-none absolute bottom-14 left-3 flex flex-col gap-1 rounded-md border bg-background/85 px-3 py-2 font-mono text-[11px] leading-relaxed backdrop-blur">
              <span className="text-eyebrow">Cursor · Mars 2000</span>
              <span>
                {pointer ? `${formatLat(pointer.lat, 2)}  ${formatLonEast180(pointer.lon, 2)}` : "—"}
              </span>
              {resolution != null && (
                <span className="text-muted-foreground">
                  ≈ {equatorialKmPerPixel(resolution).toFixed(equatorialKmPerPixel(resolution) < 1 ? 2 : 1)} km / px at equator
                </span>
              )}
            </div>

            <Button
              size="icon"
              variant="secondary"
              onClick={resetView}
              aria-label="Show the whole planet"
              title="Show the whole planet"
              className="absolute right-3 top-[6.25rem] size-8"
            >
              <Maximize2 />
            </Button>
          </>
        )}
      </section>

      {/* Control panel */}
      <aside className="flex flex-col gap-4">
        <Panel title="Selected location" icon={<MapPin className="size-4 text-primary" />}>
          {selected ? (
            <div className="space-y-3">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-sm">
                <dt className="text-muted-foreground">Latitude</dt>
                <dd>{formatLat(selected.lat)}</dd>
                <dt className="text-muted-foreground">Longitude</dt>
                <dd>{formatLonEast180(selected.lon)}</dd>
                <dt className="text-muted-foreground">0–360°</dt>
                <dd>{formatLonEast360(selected.lon)}</dd>
              </dl>
              <p className="text-xs text-muted-foreground">
                Planetocentric latitude, east-positive longitude (Mars 2000 / IAU 2000 sphere).
              </p>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X /> Clear selection
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crosshair className="size-4" /> Click anywhere on the map to select a location.
            </p>
          )}
        </Panel>

        <Panel
          title="Base map"
          icon={<Layers className="size-4 text-primary" />}
          meta={`${verifiedCount}/${MARS_LAYERS.length} verified${checkingCount ? ` · ${checkingCount} checking` : ""}`}
        >
          <div role="radiogroup" aria-label="Base map" className="space-y-1.5">
            {bases.map((l) => (
              <LayerOption
                key={l.id}
                layer={l}
                status={statuses[l.id] ?? CHECKING}
                checked={baseId === l.id}
                onSelect={() => setBaseId(l.id)}
                onRetry={() => verify(l)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Overlay" icon={<Layers className="size-4 text-accent" />}>
          <div role="radiogroup" aria-label="Overlay" className="space-y-1.5">
            <button
              type="button"
              role="radio"
              aria-checked={overlayId === null}
              onClick={() => setOverlayId(null)}
              className={optionClass(overlayId === null, false)}
            >
              <span className="text-sm">None</span>
            </button>
            {overlays.map((l) => (
              <LayerOption
                key={l.id}
                layer={l}
                status={statuses[l.id] ?? CHECKING}
                checked={overlayId === l.id}
                onSelect={() => setOverlayId(l.id)}
                onRetry={() => verify(l)}
              />
            ))}
          </div>
          {overlayId && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-eyebrow">Overlay opacity</span>
                <span className="font-mono">{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <Slider
                value={[overlayOpacity]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => {
                  if (v !== undefined) setOverlayOpacity(v);
                }}
                aria-label="Overlay opacity"
              />
              <p className="text-xs text-muted-foreground">
                TES and MOLA roughness grids are coarse global products, so they look soft when you
                zoom in.
              </p>
            </div>
          )}
        </Panel>

        {baseStatus.state === "ready" && (
          <details className="group rounded-lg border bg-panel p-4 text-sm shadow-panel">
            <summary className="cursor-pointer list-none font-display font-semibold">
              Service details <span className="text-eyebrow ml-2">from NASA capabilities</span>
            </summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono text-xs">
              <dt className="text-muted-foreground">Layer</dt>
              <dd className="break-all">{baseStatus.verified.layer.id}</dd>
              <dt className="text-muted-foreground">CRS</dt>
              <dd className="break-all">{baseStatus.verified.supportedCrs}</dd>
              <dt className="text-muted-foreground">Matrix set</dt>
              <dd>{baseStatus.verified.matrixSet}</dd>
              <dt className="text-muted-foreground">Style</dt>
              <dd>{baseStatus.verified.style}</dd>
              <dt className="text-muted-foreground">Format</dt>
              <dd>{baseStatus.verified.format}</dd>
              <dt className="text-muted-foreground">Zoom levels</dt>
              <dd>{baseStatus.verified.zoomLevels}</dd>
              <dt className="text-muted-foreground">Extent</dt>
              <dd>{baseStatus.verified.extent.map((n) => n.toFixed(4)).join(", ")}</dd>
              <dt className="text-muted-foreground">Tiles</dt>
              <dd className="break-all">{baseStatus.verified.tileUrlTemplate}</dd>
            </dl>
            <a
              href={baseStatus.verified.capabilitiesUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-accent underline-offset-4 hover:underline"
            >
              Open GetCapabilities XML
            </a>
          </details>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Data: <span className="text-foreground">NASA Mars Trek</span> ·{" "}
          {baseDef.mission}
          {overlayDef && overlayDef.mission !== baseDef.mission ? ` · ${overlayDef.mission}` : ""}.
          Tiles come live from{" "}
          <a href={TREK_API_DOC_URL} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
            NASA's Trek WMTS service
          </a>
          .
        </p>
      </aside>
    </div>
  );
}

function Panel({
  title,
  icon,
  meta,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-panel p-4 shadow-panel">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {meta && <span className="text-eyebrow">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

function optionClass(checked: boolean, disabled: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    checked ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:bg-secondary",
    disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
  );
}

function LayerOption({
  layer,
  status,
  checked,
  onSelect,
  onRetry,
}: {
  layer: MarsLayerDef;
  status: LayerStatus;
  checked: boolean;
  onSelect: () => void;
  onRetry: () => void;
}) {
  const disabled = status.state !== "ready";
  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={onSelect}
        title={layer.title}
        className={optionClass(checked, disabled)}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{layer.shortTitle}</span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {status.state === "failed" ? status.message : layer.instrument}
          </span>
        </span>
        {status.state === "checking" && (
          <Loader2 aria-label="Verifying with NASA" className="size-4 shrink-0 animate-spin text-muted-foreground" />
        )}
        {status.state === "ready" && (
          <CheckCircle2 aria-label="Verified" className="size-4 shrink-0 text-success" />
        )}
        {status.state === "failed" && (
          <AlertTriangle aria-label="Unavailable" className="size-4 shrink-0 text-destructive" />
        )}
      </button>
      {status.state === "failed" && (
        <Button size="icon" variant="outline" onClick={onRetry} aria-label={`Retry ${layer.shortTitle}`} className="h-auto">
          <RefreshCw />
        </Button>
      )}
    </div>
  );
}
