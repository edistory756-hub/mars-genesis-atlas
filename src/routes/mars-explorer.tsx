import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

import { getEvidence } from "@/lib/evidence/records";

// OpenLayers is browser-only; load the map module after hydration.
const MarsExplorer = lazy(() => import("@/components/mars/MarsExplorer"));

interface MarsExplorerSearch {
  /** Evidence record to focus on the map; unknown ids are dropped. */
  evidence?: string;
}

export const Route = createFileRoute("/mars-explorer")({
  validateSearch: (search: Record<string, unknown>): MarsExplorerSearch => {
    const id = search["evidence"];
    return typeof id === "string" && getEvidence(id) ? { evidence: id } : {};
  },
  head: () => ({
    meta: [
      { title: "Mars Explorer — MARS GENESIS" },
      {
        name: "description",
        content:
          "Explore Mars on live NASA Mars Trek maps: MOLA topography and TES surface data in the Mars 2000 coordinate system.",
      },
      { property: "og:title", content: "Mars Explorer — MARS GENESIS" },
      {
        property: "og:description",
        content: "Live NASA Mars Trek MOLA and TES map layers, pan, zoom and pick any location on Mars.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarsExplorerPage,
});

function MapFallback() {
  return (
    <div className="grid h-[62vh] min-h-[380px] place-items-center rounded-lg border bg-card lg:h-[calc(100vh-11rem)]">
      <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Starting map…
      </div>
    </div>
  );
}

function MarsExplorerPage() {
  const { evidence } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-eyebrow">Module 01 · Live NASA data</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Mars Explorer</h1>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Real Mars Global Surveyor maps streamed from NASA Mars Trek. Drag to pan, scroll to zoom,
          click to pick a location.
        </p>
      </div>
      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <MarsExplorer
            focusEvidenceId={evidence ?? null}
            onFocusEvidence={(id: string | null) =>
              navigate({ search: id ? { evidence: id } : {}, replace: true, resetScroll: false })
            }
          />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
