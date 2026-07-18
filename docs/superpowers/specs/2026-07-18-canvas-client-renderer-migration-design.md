# Canvas Client Renderer Migration Design

## Goal

Replace the current server-side Playwright render flow with a browser-only canvas generator based on `gerador_3_layouts_21.html`.

The HTML file is the canonical visual reference for the generated alert images. The new Next.js app should keep the project maintainable while matching the HTML's generated layouts, controls, and export behavior.

## Non-Goals

- No server-side PNG rendering in this phase.
- No `/api/render` dependency for normal image generation.
- No Playwright dependency for normal image generation.
- No history persistence in `data/history.json` in this phase.
- No long base64 image blobs in TypeScript or React files.
- No requirement to preserve the existing payload shape as the new internal model.

## Current Problems

The current app renders preview through React/CSS and export through a separate static HTML document captured by Playwright. That creates two render paths for the same image and makes visual drift likely.

The HTML generator avoids this by using one canvas renderer for both preview and PNG export. It also includes features the current app does not model cleanly:

- three layouts generated at the same time;
- dynamic canvas height;
- multiple price bands per trip leg;
- per-layout footer text;
- fine typography and spacing controls;
- automatic destination photo lookup;
- direct browser PNG download.

## Recommended Direction

Build a new main generator screen inside the existing Next.js project. Keep React for the UI, but move image generation to a pure client-side canvas renderer.

```txt
React UI
  -> AlertDraft state
  -> renderAlertCanvas(canvas, draft, theme, assets)
  -> canvas preview
  -> PNG or ZIP download in browser
```

The new app remains browser-only for generation. A user should be able to open the app, fill the form, see all three layouts, and download PNG/ZIP without installing Playwright, Chromium, or a render service.

## Visual Reference Rules

The canvas renderer must copy the layout behavior from `gerador_3_layouts_21.html` before introducing cosmetic changes.

Core rules from the HTML:

- fixed canvas width: `1080`;
- dynamic canvas height based on rendered content;
- Poppins as the visual font family;
- default photo box: `x=778`, `y=34`, `w=260`, `h=260`, `r=22`;
- default left margin: `42`;
- route starts near `y=150`, adjusted by header/route gap;
- dates must not collide with the top-right photo;
- footer position is calculated from content height;
- month/day wrapping uses canvas text measurement;
- image export uses the same canvas shown in preview.

Theme-specific rules:

- Go Miles Club uses a purple outer frame, white inner card, pill header, green separator, Go Miles photo bank, no airplane overlay, and its own watermark/footer treatment.
- Executiva uses white background, blue header/routes/footer, dark body text, hazard stripe, airplane overlay, and Executiva watermark.
- FirstClass uses dark blue background, gold accents, hazard stripe, airplane overlay, FirstClass watermark, and brand mark above the footer.

## Data Model

The new screen should use a model that matches the HTML rather than forcing the old `costs[]` and `dates[]` shape.

```ts
type TripMode = 'one-way' | 'round-trip';

interface PriceBand {
  id: string;
  miles: string;
  dates: string;
}

interface JourneyLeg {
  origin: string;
  destination: string;
  bands: PriceBand[];
}

interface TypographySettings {
  headerSize: number;
  headerBold: boolean;
  routeSize: number;
  routeBold: boolean;
  milesSize: number;
  milesBold: boolean;
  datesSize: number;
  datesBold: boolean;
  footerSize: number;
  footerBold: boolean;
  headerRouteGap: number;
  datesLineHeight: number;
  milesLineHeight: number;
}

interface AlertDraft {
  title: string;
  tripMode: TripMode;
  outbound: JourneyLeg;
  inbound: JourneyLeg;
  footersByTheme: Record<string, string>;
  typography: TypographySettings;
  destinationPhotoMode: 'auto' | 'manual';
  manualPhotoDataUrl?: string;
}
```

The existing payload types may remain temporarily for old code, but the new generator should not depend on them internally.

## UI Design

The first screen is the usable generator, not a landing page.

```txt
Left editor panel                 Right preview panel
-----------------                 -------------------
Header/title                      [Go Miles Club] [Download]
Destination photo controls          canvas
Trip mode
Outbound leg                      [Executiva] [Download]
Inbound leg                         canvas
Footer tabs
Fine typography controls          [FirstClass] [Download]
Actions                             canvas
```

Required controls:

- title/class input;
- auto/manual destination photo mode;
- manual photo upload;
- trip mode segmented control;
- outbound origin and destination;
- inbound origin and destination when round trip is active;
- add/remove price bands per leg;
- miles text and dates text per band;
- footer tabs, one text area per theme;
- footer template presets;
- typography controls for sizes, bold flags, and line spacing;
- restore standard measurements;
- save measurements as local default;
- reset text fields;
- download individual PNG;
- generate all layouts as ZIP.

The three preview cards always exist. Each card is collapsible, and all three layouts are available without changing a selected theme.

## Canvas Renderer Structure

Create a pure renderer that does not import React and does not read DOM state.

Suggested files:

- `src/lib/canvas/render-alert-canvas.ts`
- `src/lib/canvas/types.ts`
- `src/lib/canvas/assets.ts`
- `src/lib/canvas/export.ts`

Core renderer functions:

- `renderAlertCanvas(canvas, draft, theme, assets)`;
- `measureAlertHeight(ctx, draft, theme, assets)`;
- `drawPhotoBox`;
- `drawRouteBlock`;
- `drawMonthBlock`;
- `drawFooter`;
- `drawWatermark`;
- `drawBrandMark`;
- `drawHazardStripe`;
- `parseMonthLines`.

The renderer receives all assets explicitly. It should not use globals like the HTML prototype does.

## Assets

Move visual assets out of embedded base64 and into `public/assets`.

Suggested structure:

- `public/assets/logos/gomiles.png`
- `public/assets/logos/executiva-white.png`
- `public/assets/logos/executiva-tint.png`
- `public/assets/logos/firstclass.png`
- `public/assets/logos/gomiles-light-tint.png`
- `public/assets/plane/airplane.png`
- `public/assets/destinations/*`

If an asset exists only inside `gerador_3_layouts_21.html`, extract or replace it with an equivalent file. Do not keep the base64 blob in source code.

## Destination Photo Lookup

Port the HTML keyword matching into a typed destination photo map.

The matching behavior should:

- normalize accents and case;
- support aliases such as `madrid` for `madri`;
- choose the longest matching keyword when several match;
- use the outbound destination as the automatic photo source;
- allow manual upload to override automatic matching;
- restore automatic matching when the manual photo is cleared.

Go Miles may use its own photo bank when assets differ by theme.

## Footer Behavior

Each theme has its own editable footer text. Footer presets should be ported from the HTML.

The generator should detect dates containing seat counts in parentheses, such as `12(1)`, and suggest the footer template that explains seat counts. If the operator has manually edited a footer, do not overwrite it automatically.

## Export Behavior

Individual PNG:

- use the visible canvas when possible;
- call `canvas.toBlob`;
- download with a clear theme-specific filename.

Generate all:

- render each theme to an offscreen canvas;
- collect three PNG blobs;
- package them with `jszip`;
- download one ZIP.

No API request is required for normal export.

## Dependency Cleanup

After the new renderer is in use, remove dependencies and files that no longer serve the browser-only flow.

Required removals from the main generation flow:

- `playwright`;
- `playwright:install` script usage;
- `/api/render`;
- `src/lib/rendering/render-alert-image.ts`;
- `src/lib/rendering/document.tsx`;
- `src/lib/utils/fit-text.ts`;
- old React/CSS preview layout components replaced by canvas previews.

Keep `jszip` because ZIP export is part of the requested workflow.

Remove `zod` in this migration unless a JSON import/export validator is added in the same implementation.

## Migration Plan At A High Level

1. Add the new data model and theme definitions matching the HTML.
2. Move/extract required visual assets into `public/assets`.
3. Build the pure canvas renderer from the HTML logic.
4. Build the new React generator screen around the renderer.
5. Add individual PNG and ZIP export.
6. Replace `src/app/page.tsx` with the new generator.
7. Remove the Playwright render path and unused dependencies.
8. Verify visual parity against the HTML using the default example.

## Acceptance Criteria

- The app runs as a normal Next.js client UI.
- The generation path does not call `/api/render`.
- The generation path does not use Playwright.
- The page shows Go Miles Club, Executiva, and FirstClass previews at the same time.
- Preview and PNG export use the same canvas renderer.
- Each layout can be downloaded as PNG.
- "Generate all" downloads one ZIP with three PNGs.
- Canvas width is 1080 and height grows with content.
- Multiple price bands render per leg.
- Round trip renders outbound and inbound sections.
- Footer text is editable independently per theme.
- Fine typography controls update preview immediately.
- Automatic destination photo matching works from outbound destination.
- Manual photo upload overrides automatic matching.
- The default generated images visually match `gerador_3_layouts_21.html` for positions, colors, photo box, typography scale, footer behavior, watermarks, and dynamic height.

## Risks

- Extracting exact assets from the HTML may take manual work if original files are not available.
- Poppins rendering may differ if loaded from Google Fonts versus local files. Prefer local font files if exact offline/browser-only behavior matters.
- Rendering all canvases on every keystroke is acceptable initially. Add debounce or image caching only if local testing shows input lag.
- Existing history data uses the old payload shape and is not compatible with the new draft model without a converter.

## Closed Decisions For This Migration

- Do not include a developer-only JSON import/export panel in the first version.
- Remove `zod` if no remaining runtime validation path uses it after the old API is removed.
- Prefer existing files in `public/assets` when they visually match the HTML. Extract from the HTML only for missing logos/photos that are required for parity.
