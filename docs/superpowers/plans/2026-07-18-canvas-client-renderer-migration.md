# Canvas Client Renderer Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Playwright-backed generator with a browser-only Canvas generator that matches `gerador_3_layouts_21.html`.

**Architecture:** React owns editing state and controls. A pure Canvas renderer owns all image composition and is used for both preview and export. Normal PNG/ZIP generation happens entirely in the browser without `/api/render` or Playwright.

**Tech Stack:** Next.js 15, React 19, TypeScript, Canvas 2D API, JSZip, local static assets under `public/assets`.

## Global Constraints

- Do not create commits during this implementation.
- `gerador_3_layouts_21.html` is the canonical visual reference.
- No server-side PNG rendering in this phase.
- No `/api/render` dependency for normal image generation.
- No Playwright dependency for normal image generation.
- No history persistence in `data/history.json` in this phase.
- No long base64 image blobs in TypeScript or React files.
- The page must show Go Miles Club, Executiva, and FirstClass previews at the same time.
- Preview and PNG export must use the same Canvas renderer.
- Canvas width is `1080`; canvas height grows with content.
- Keep `jszip`; remove `playwright` and `zod` if they become unused.

---

## File Structure

- Create `src/lib/canvas/types.ts`: Canvas draft/theme/asset types.
- Create `src/lib/canvas/themes.ts`: Go Miles, Executiva, FirstClass Canvas theme definitions copied from the HTML constants.
- Create `src/lib/canvas/default-draft.ts`: default alert data and standard typography settings.
- Create `src/lib/canvas/destination-photos.ts`: destination keyword matching and asset mapping.
- Create `src/lib/canvas/assets.ts`: browser image/font loading helpers.
- Create `src/lib/canvas/render-alert-canvas.ts`: pure Canvas renderer based on the HTML draw functions.
- Create `src/lib/canvas/export.ts`: PNG and ZIP export helpers.
- Create `src/components/generator/AlertGenerator.tsx`: main client screen and state orchestration.
- Create `src/components/generator/CanvasPreviewCard.tsx`: collapsible preview card with canvas and download button.
- Create `src/components/generator/JourneyLegEditor.tsx`: origin/destination and price bands.
- Create `src/components/generator/FooterEditor.tsx`: footer tabs and presets.
- Create `src/components/generator/TypographyControls.tsx`: fine tuning controls.
- Modify `src/app/page.tsx`: render the new generator.
- Modify `package.json`: remove Playwright scripts/dependencies and remove Zod if unused.
- Delete old render path files after replacement: `src/app/api/render/route.ts`, `src/lib/rendering/render-alert-image.ts`, `src/lib/rendering/document.tsx`, and old preview files if unused.

---

### Task 1: Add Canvas Domain Model And Defaults

**Files:**
- Create: `src/lib/canvas/types.ts`
- Create: `src/lib/canvas/themes.ts`
- Create: `src/lib/canvas/default-draft.ts`

**Interfaces:**
- Produces: `AlertDraft`, `CanvasTheme`, `CanvasThemeKey`, `CANVAS_THEMES`, `STANDARD_TYPOGRAPHY`, `createDefaultAlertDraft()`.

- [ ] **Step 1: Define canvas types**

Create `src/lib/canvas/types.ts`:

```ts
export type TripMode = 'one-way' | 'round-trip';
export type CanvasThemeKey = 'gomiles' | 'executiva' | 'firstclass';

export interface PriceBand {
  id: string;
  miles: string;
  dates: string;
}

export interface JourneyLeg {
  origin: string;
  destination: string;
  bands: PriceBand[];
}

export interface TypographySettings {
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

export interface AlertDraft {
  title: string;
  tripMode: TripMode;
  outbound: JourneyLeg;
  inbound: JourneyLeg;
  footersByTheme: Record<CanvasThemeKey, string>;
  typography: TypographySettings;
  destinationPhotoMode: 'auto' | 'manual';
  manualPhotoDataUrl?: string;
}

export interface CanvasFrame {
  inset: number;
  radius: number;
  outerBg: [string, string];
}

export interface CanvasTheme {
  key: CanvasThemeKey;
  name: string;
  fileSlug: string;
  bg: string;
  header: string;
  headerTextColor?: string;
  headerStyle?: 'pill';
  routeTitle: string;
  separatorColor?: string;
  separatorChar?: string;
  miles: string;
  dateLabel: string;
  dateText: string;
  divider: string;
  footerBg: string;
  footerText: string;
  footerSub?: string;
  footerLogoMode: 'own' | 'powered';
  hazard?: [string, string];
  watermarkAsset?: string;
  watermarkOpacity: number;
  brandMarkAsset?: string;
  ownLogoAsset?: string;
  poweredLogoAsset?: string;
  photoGradTop: string;
  photoGradBottom: string;
  noPlane?: boolean;
  photoBank?: 'default' | 'gomiles';
  forceDatesBold?: boolean;
  frame?: CanvasFrame;
}

export interface CanvasAssets {
  plane: HTMLImageElement | null;
  logos: Record<string, HTMLImageElement | null>;
  destinationPhoto: HTMLImageElement | null;
  gomilesDestinationPhoto: HTMLImageElement | null;
}
```

- [ ] **Step 2: Define themes matching the HTML**

Create `src/lib/canvas/themes.ts`:

```ts
import type { CanvasTheme } from './types';

export const CANVAS_THEMES: CanvasTheme[] = [
  {
    key: 'gomiles',
    name: 'Go Miles Club',
    fileSlug: 'gomilesclub',
    bg: '#FFFFFF',
    header: '#9935CB',
    headerTextColor: '#FFFFFF',
    headerStyle: 'pill',
    routeTitle: '#9935CB',
    separatorColor: '#02EEA0',
    separatorChar: '▸',
    miles: '#1F1033',
    dateLabel: '#9935CB',
    dateText: '#3A3A3A',
    divider: '#E3E6EC',
    footerBg: '#1F1033',
    footerText: '#FFFFFF',
    footerSub: '#C9BEDD',
    footerLogoMode: 'own',
    watermarkAsset: '/assets/logos/gomiles-light-tint.png',
    watermarkOpacity: 0.95,
    ownLogoAsset: '/assets/logos/gomiles.png',
    poweredLogoAsset: '/assets/logos/executiva-white.png',
    photoGradTop: '#B96FE0',
    photoGradBottom: '#9935CB',
    noPlane: true,
    photoBank: 'gomiles',
    forceDatesBold: true,
    frame: { inset: 36, radius: 28, outerBg: ['#2A1550', '#150A26'] }
  },
  {
    key: 'executiva',
    name: 'Executiva com Milhas',
    fileSlug: 'executivacommilhas',
    bg: '#FFFFFF',
    header: '#004AAD',
    routeTitle: '#004AAD',
    miles: '#2E2E2E',
    dateLabel: '#2E2E2E',
    dateText: '#2E2E2E',
    divider: '#E3E6EC',
    footerBg: '#004AAD',
    footerText: '#FFFFFF',
    footerSub: '#C9D6EC',
    footerLogoMode: 'own',
    hazard: ['#F2CB05', '#111111'],
    watermarkAsset: '/assets/logos/executiva-tint.png',
    watermarkOpacity: 0.13,
    ownLogoAsset: '/assets/logos/executiva-white.png',
    poweredLogoAsset: '/assets/logos/executiva-white.png',
    photoGradTop: '#B9D2F0',
    photoGradBottom: '#5C8FD6'
  },
  {
    key: 'firstclass',
    name: 'FirstClass',
    fileSlug: 'firstclass',
    bg: '#121E3E',
    header: '#F1C469',
    routeTitle: '#F1C469',
    miles: '#D1D3D9',
    dateLabel: '#D1D3D9',
    dateText: '#D1D3D9',
    divider: '#2C3A5E',
    footerBg: '#F1C469',
    footerText: '#121E3E',
    footerSub: '#4A4020',
    footerLogoMode: 'powered',
    hazard: ['#F1C469', '#121E3E'],
    watermarkAsset: '/assets/logos/firstclass.png',
    watermarkOpacity: 0.12,
    brandMarkAsset: '/assets/logos/firstclass.png',
    ownLogoAsset: '/assets/logos/gomiles.png',
    poweredLogoAsset: '/assets/logos/executiva-white.png',
    photoGradTop: '#2C3A5E',
    photoGradBottom: '#121E3E'
  }
];

export function getCanvasTheme(key: string): CanvasTheme {
  return CANVAS_THEMES.find((theme) => theme.key === key) ?? CANVAS_THEMES[0];
}
```

- [ ] **Step 3: Add defaults**

Create `src/lib/canvas/default-draft.ts`:

```ts
import type { AlertDraft, CanvasThemeKey, TypographySettings } from './types';

export const STANDARD_TYPOGRAPHY: TypographySettings = {
  headerSize: 41,
  headerBold: true,
  routeSize: 52,
  routeBold: true,
  milesSize: 33,
  milesBold: true,
  datesSize: 29,
  datesBold: false,
  footerSize: 21,
  footerBold: true,
  headerRouteGap: 0,
  datesLineHeight: 1.55,
  milesLineHeight: 1.32
};

export const DEFAULT_FOOTERS: Record<CanvasThemeKey, string> = {
  gomiles: 'Pesquisa realizada para 1 passageiro.\nData da pesquisa: ',
  executiva: 'Alerta para uso próprio. Não encaminhar para outros grupos.\nPesquisa realizada para 1 passageiro.\nPesquisa realizada no dia ',
  firstclass: 'Pesquisa realizada para 1 passageiro.\nQuer realizar a emissão? Entre em contato com seu gestor!\nPesquisa realizada no dia '
};

export function createDefaultAlertDraft(): AlertDraft {
  return {
    title: 'EXECUTIVA AIR EUROPA',
    tripMode: 'one-way',
    outbound: {
      origin: 'São Paulo',
      destination: 'Madri',
      bands: [
        {
          id: 'outbound-1',
          miles: '62.5K Milhas Flying Blue + 12,60 USD',
          dates: 'NOV: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31\nDEZ: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15\nFEV: 2, 15, 16, 22, 23\nMAR: 9'
        }
      ]
    },
    inbound: {
      origin: 'Madri',
      destination: 'São Paulo',
      bands: [
        {
          id: 'inbound-1',
          miles: '62.5K Milhas Flying Blue + 29,10 USD',
          dates: 'NOV: 11, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 28, 29, 30\nDEZ: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 25\nJUN: 16'
        }
      ]
    },
    footersByTheme: DEFAULT_FOOTERS,
    typography: { ...STANDARD_TYPOGRAPHY },
    destinationPhotoMode: 'auto'
  };
}
```

- [ ] **Step 4: Verify TypeScript parses**

Run: `npm run build`

Expected: it may still fail for missing imports only after later tasks are started; after Task 1 alone, no existing file imports these files, so the build should continue to the same baseline behavior.

---

### Task 2: Add Browser Asset Loading And Destination Matching

**Files:**
- Create: `src/lib/canvas/destination-photos.ts`
- Create: `src/lib/canvas/assets.ts`

**Interfaces:**
- Consumes: `CanvasTheme`, `CanvasAssets`.
- Produces: `matchDestinationPhotoKey(destination: string): string | null`, `loadCanvasAssets(theme, destinationKey, manualPhotoDataUrl)`.

- [ ] **Step 1: Add destination matcher**

Create `src/lib/canvas/destination-photos.ts` with normalized keyword matching ported from the HTML. Start with destinations already present in `public/assets/destinations` and include `madri -> /assets/destinations/MAD.jpg`.

- [ ] **Step 2: Add image loading helper**

Create `src/lib/canvas/assets.ts`:

```ts
import type { CanvasAssets, CanvasTheme } from './types';
import { DESTINATION_PHOTOS, DESTINATION_PHOTOS_GOMILES } from './destination-photos';

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

export async function loadCanvasAssets(theme: CanvasTheme, destinationKey: string | null, manualPhotoDataUrl?: string): Promise<CanvasAssets> {
  const destinationSrc = manualPhotoDataUrl || (destinationKey ? DESTINATION_PHOTOS[destinationKey] : undefined);
  const gomilesSrc = manualPhotoDataUrl || (destinationKey ? DESTINATION_PHOTOS_GOMILES[destinationKey] || DESTINATION_PHOTOS[destinationKey] : undefined);

  const logoSources = [
    theme.watermarkAsset,
    theme.brandMarkAsset,
    theme.ownLogoAsset,
    theme.poweredLogoAsset
  ].filter(Boolean) as string[];

  const [plane, destinationPhoto, gomilesDestinationPhoto, ...logos] = await Promise.all([
    loadImage('/assets/plane/airplane.png'),
    loadImage(destinationSrc),
    loadImage(gomilesSrc),
    ...logoSources.map(loadImage)
  ]);

  return {
    plane,
    destinationPhoto,
    gomilesDestinationPhoto,
    logos: Object.fromEntries(logoSources.map((src, index) => [src, logos[index] ?? null]))
  };
}
```

- [ ] **Step 3: Verify asset helper compiles**

Run: `npm run build`

Expected: TypeScript succeeds after all referenced exports exist.

---

### Task 3: Build The Canvas Renderer

**Files:**
- Create: `src/lib/canvas/render-alert-canvas.ts`

**Interfaces:**
- Consumes: `AlertDraft`, `CanvasTheme`, `CanvasAssets`.
- Produces: `renderAlertCanvas(canvas: HTMLCanvasElement, draft: AlertDraft, theme: CanvasTheme, assets: CanvasAssets): void`.

- [ ] **Step 1: Port drawing helpers**

Implement helpers from the HTML with explicit parameters: `roundRect`, `roundRectBottom`, `font`, `drawPhotoBox`, `parseMonthLines`, `drawMonthBlock`, `drawDottedLine`, `drawRouteBlock`, `footerLineHeights`, `drawHazardStripe`, `drawFooter`, `drawWatermark`, `drawBrandMark`.

- [ ] **Step 2: Implement measurement and render**

Use the HTML's layout math:

```ts
const W = 1080;
const PHOTO_BOX = { x: 778, y: 34, w: 260, h: 260, r: 22 };
```

Render once into a temporary canvas to find `contentEndY`, then set the real canvas height and draw final pixels.

- [ ] **Step 3: Preserve HTML theme behavior**

Confirm these branches exist:

- Go Miles frame and pill header;
- regular header for Executiva and FirstClass;
- no plane for Go Miles;
- hazard stripe for Executiva and FirstClass;
- brand mark for FirstClass;
- theme-specific watermark opacity.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: renderer compiles without React imports.

---

### Task 4: Build Canvas Preview Card

**Files:**
- Create: `src/components/generator/CanvasPreviewCard.tsx`

**Interfaces:**
- Consumes: `AlertDraft`, `CanvasTheme`, `renderAlertCanvas`, `loadCanvasAssets`, `matchDestinationPhotoKey`.
- Produces: collapsible preview card with a canvas and `onDownload(canvas, theme)` integration point.

- [ ] **Step 1: Create component**

Component signature:

```ts
interface CanvasPreviewCardProps {
  draft: AlertDraft;
  theme: CanvasTheme;
  collapsed: boolean;
  onToggle: () => void;
  onDownload: (canvas: HTMLCanvasElement, theme: CanvasTheme) => void;
}
```

- [ ] **Step 2: Render canvas on changes**

Use `useEffect` and a `ref<HTMLCanvasElement>` to load assets and call `renderAlertCanvas`.

- [ ] **Step 3: Add download button**

Disable the button until the canvas has been rendered at least once.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: component compiles.

---

### Task 5: Build Editor Components

**Files:**
- Create: `src/components/generator/JourneyLegEditor.tsx`
- Create: `src/components/generator/FooterEditor.tsx`
- Create: `src/components/generator/TypographyControls.tsx`

**Interfaces:**
- Consumes: `AlertDraft`, `JourneyLeg`, `TypographySettings`.
- Produces: controlled inputs that update the parent draft.

- [ ] **Step 1: Implement `JourneyLegEditor`**

Include origin, destination, add/remove band, miles textarea, dates textarea.

- [ ] **Step 2: Implement `FooterEditor`**

Include tabs for `gomiles`, `executiva`, `firstclass`, preset selector, and textarea.

- [ ] **Step 3: Implement `TypographyControls`**

Include numeric fields and checkboxes for all `TypographySettings` properties, plus reset/save default callbacks.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: editor components compile.

---

### Task 6: Build Main Alert Generator Screen

**Files:**
- Create: `src/components/generator/AlertGenerator.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes all new canvas modules and editor components.
- Produces the new app screen as the default page.

- [ ] **Step 1: Create state orchestration**

Initialize state with `createDefaultAlertDraft()`. Add helpers for updating title, trip mode, photo mode, manual upload, legs, footers, and typography.

- [ ] **Step 2: Add page layout**

Use a two-column desktop layout and stacked mobile layout:

- left editing panel;
- right preview panel with three `CanvasPreviewCard` components;
- top-level `Generate all ZIP` action.

- [ ] **Step 3: Wire `src/app/page.tsx`**

Replace current page content with:

```tsx
import { AlertGenerator } from '@/components/generator/AlertGenerator';

export default function Home() {
  return <AlertGenerator />;
}
```

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: app compiles and no old form imports are required by `page.tsx`.

---

### Task 7: Add Client-Side Export

**Files:**
- Create: `src/lib/canvas/export.ts`
- Modify: `src/components/generator/AlertGenerator.tsx`
- Modify: `src/components/generator/CanvasPreviewCard.tsx`

**Interfaces:**
- Produces: `downloadCanvasPng(canvas, filename)`, `generateAllZip(draft)`.

- [ ] **Step 1: Add PNG helper**

Use `canvas.toBlob` and an object URL to trigger download.

- [ ] **Step 2: Add ZIP helper**

Render each theme into an offscreen canvas, create PNG blobs, and package with `JSZip`.

- [ ] **Step 3: Wire UI actions**

Individual buttons call `downloadCanvasPng`. Main button calls `generateAllZip`.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: client export code compiles and does not import server modules.

---

### Task 8: Remove Old Render Path And Dependencies

**Files:**
- Delete: `src/app/api/render/route.ts`
- Delete: `src/lib/rendering/render-alert-image.ts`
- Delete: `src/lib/rendering/document.tsx`
- Delete: `src/lib/utils/fit-text.ts` if no imports remain
- Modify: `package.json`

**Interfaces:**
- Removes Playwright and server render dependency from normal generation.

- [ ] **Step 1: Find old imports**

Run: `rg -n "renderAlertImage|buildRenderDocument|applyFitText|api/render|playwright|zod|alertImageSchema" src package.json`

Expected: only old files or removable imports appear.

- [ ] **Step 2: Delete unused old files**

Delete old render files once no active page imports them.

- [ ] **Step 3: Update `package.json`**

Remove:

- `playwright`;
- `playwright:install`;
- `zod` if no remaining import exists.

Keep:

- `jszip`;
- `lucide-react` if used by the UI.

- [ ] **Step 4: Install lockfile changes**

Run: `npm install`

Expected: `package-lock.json` reflects removed dependencies.

- [ ] **Step 5: Build**

Run: `npm run build`

Expected: build succeeds without Playwright or render API.

---

### Task 9: Verify Visual And Functional Parity

**Files:**
- Modify only if verification exposes issues.

**Interfaces:**
- Confirms acceptance criteria from the spec.

- [ ] **Step 1: Run build**

Run: `npm run build`

Expected: successful production build.

- [ ] **Step 2: Run app locally**

Run: `npm run dev`

Expected: Next dev server starts and the page shows the new generator.

- [ ] **Step 3: Manual browser verification**

Check:

- three preview cards exist;
- all three canvases render with the default draft;
- Go Miles has purple frame, white card, pill header, green separator, and no airplane;
- Executiva has white background, blue footer, hazard stripe, and airplane;
- FirstClass has dark background, gold footer/accent, hazard stripe, brand mark, and airplane;
- canvas height grows when many dates are added;
- ida/volta displays both legs;
- add/remove price bands works;
- footer tabs edit each theme independently;
- typography changes redraw previews;
- automatic photo uses outbound destination;
- manual photo overrides automatic photo;
- individual PNG downloads work;
- ZIP download contains three PNGs.

- [ ] **Step 4: Final cleanup scan**

Run: `rg -n "playwright|api/render|renderAlertImage|buildRenderDocument|fit-text|alertImageSchema|from 'zod'|from \"zod\"" src package.json`

Expected: no stale references remain unless explicitly justified in the final response.

---

## Self-Review

- Spec coverage: all core requirements are mapped to Tasks 1-9.
- No commits: this plan deliberately omits commit steps because the user requested no commits.
- Type consistency: `AlertDraft`, `CanvasTheme`, `CanvasAssets`, and `renderAlertCanvas` are introduced before use.
- Scope: single implementation plan, focused on replacing the generator flow.
