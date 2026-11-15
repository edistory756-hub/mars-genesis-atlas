<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Mars maps use OpenLayers WMTS configured from NASA Mars Trek GetCapabilities at runtime (`src/lib/mars/capabilities.ts`); never hardcode tile grids or use EPSG:3857, because Trek serves Mars 2000 (EPSG::104905) and only the capabilities are authoritative.
- The Mars projection keeps OpenLayers `degrees` units and the tile grid is rebuilt from MatrixWidth/TileWidth over 360°, because Trek's ScaleDenominators assume Earth meters-per-degree; ground distances shown to users must use `MARS_METERS_PER_DEGREE`.
- A map layer becomes selectable only after its capabilities parse and a real probe tile loads; failures show an error with retry, never substitute imagery.
- OpenLayers code lives in lazily imported client-only modules rendered behind `<ClientOnly>`, because it touches browser APIs during SSR.
- Mars WMTS parsing is tested against verbatim NASA capabilities fixtures in `src/test/fixtures/`, so tests run without network.
- NASA evidence records are plain data in `src/lib/evidence/data/<id>.ts`, typed by `src/lib/evidence/schema.ts` and listed in `src/lib/evidence/library.ts`, so records are added without touching components; every statement/field cites `sourceIds` and is tagged observation/interpretation/hypothesis/unknown, because claims must stay traceable and the UI styles each kind distinctly.
- `validateEvidenceRecord` enforces the scientific rules (known sources, date precision, exact vs approximate coordinates, no proof-of-life wording, primary source read) and tests run it on every record, so a bad record fails CI instead of shipping.
- `src/lib/evidence/records.ts` is only the map-facing view derived from the library for the Mars Explorer, so the map keeps its own shape while records evolve.
- Unverified values are `null` (shown as "Not stated in the cited source"), dates keep only the precision a source states, and non-exact coordinates use a labelled approximate crater/region locator, because the project never invents NASA data.
