# ECMv2 Next Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing ECMv2 functionality to the Next application: synchronize the new card models, expand the destination image bank, and add database-backed alert history/dashboard.

**Architecture:** Keep image rendering client-side with Canvas. Move operational persistence behind Next API routes backed by Supabase database/storage, instead of embedding credentials and database calls in browser code. Keep the generator usable without database configuration for local card generation, but enable history/dashboard when environment variables are present.

**Tech Stack:** Next 15, React 19, TypeScript, Canvas API, Supabase Postgres/Storage, JSZip, Vitest for pure utility tests.

## Global Constraints

- Do not reintroduce Playwright or server-side browser rendering.
- Do not commit changes unless the user explicitly asks for commits.
- Keep individual card generation working without database configuration.
- Store generated alert history in a database, not in `data/history.json`.
- Store generated card image copies in Supabase Storage as compressed JPEG; keep local downloads as PNG.
- Keep user-uploaded destination photos in the current local `/api/destination-photo` flow for this version.
- Prefer HTML/default image assets over user-uploaded image collisions.
- The application must show all card layouts at the same time, with collapsible preview regions.
- Use the ECMv2 HTML as the visual reference for the new missing layout.
- Supabase must be configured through server-side Next environment variables and internal API routes, not through browser-side credentials copied from the HTML.
- Dark mode should move away from the current zinc/black palette and closer to the blue operational palette used by the ECMv2 HTML.

---

## File Structure

- Modify `package.json`: add only required dependencies for database and tests.
- Create `docs/db/supabase-alerts-schema.sql`: database tables, indexes, storage bucket notes, and RLS guidance.
- Create `src/lib/alerts/types.ts`: shared alert, group, dashboard, and route setting types.
- Create `src/lib/alerts/normalization.ts`: route keys, date helpers, class/company extraction, mileage/program normalization, distinct alert grouping.
- Create `src/lib/server/supabase.ts`: server-only Supabase client factory.
- Create `src/app/api/alerts/route.ts`: list and create alert rows.
- Create `src/app/api/alerts/[id]/route.ts`: update and delete one alert.
- Create `src/app/api/alerts/batch/route.ts`: batch insert/update/delete where the dashboard needs grouped changes.
- Create `src/app/api/route-settings/route.ts`: list and upsert route recency settings.
- Create `src/app/api/card-image/route.ts`: upload generated JPEG card copies to Supabase Storage.
- Modify `src/lib/canvas/types.ts`: add `milhasaovivo` theme key and `mavVariant`.
- Modify `src/lib/canvas/themes.ts`: add display metadata for the fourth preview card.
- Create `src/lib/canvas/render-mav-canvas.ts`: ECMv2 Milhas/Experiencias Ao Vivo renderer.
- Modify `src/lib/canvas/render-alert-canvas.ts`: keep existing 3-layout renderer untouched except shared helpers exported if needed.
- Modify `src/lib/canvas/assets.ts`: load the Milhas Ao Vivo logo.
- Modify `src/lib/canvas/export.ts`: generate all 4 layouts and optionally return generated blobs for persistence.
- Modify `src/lib/canvas/default-draft.ts`: add footers/defaults for `milhasaovivo` and `mavVariant`.
- Modify `src/lib/canvas/destination-photos.ts`: add ECMv2 missing image keys and keywords.
- Create image assets under `public/assets/destinations/html/default` and `public/assets/destinations/html/gomiles` for missing ECMv2 destinations.
- Create `public/assets/logos/milhas-aovivo.png`: extracted ECMv2 logo.
- Modify `src/components/generator/AlertGenerator.tsx`: add fourth layout, database logging, group/author controls, generate-all behavior.
- Modify `src/components/generator/CanvasPreviewCard.tsx`: dispatch to the right renderer based on theme key.
- Modify `src/components/generator/FooterEditor.tsx`: add Milhas Ao Vivo footer tab/preset.
- Modify `src/components/generator/WhatsAppTextPanel.tsx`: keep current functionality, no database coupling.
- Create `src/components/dashboard/AlertsDashboard.tsx`: dashboard shell.
- Create `src/components/dashboard/HistoryTable.tsx`: history list, edit, delete, sent status.
- Create `src/components/dashboard/StatsPanels.tsx`: group stats, daily goals, program stats.
- Create `src/components/dashboard/RouteSuggestions.tsx`: stale routes, variety, rotation.
- Create `src/components/dashboard/NotionCsvImport.tsx`: import Notion CSV rows.
- Modify `src/app/page.tsx`: generator/dashboard navigation.
- Create `.env.example`: document the required Supabase variables.
- Modify `README.md`: document Supabase setup, schema execution, storage bucket, and local verification.
- Modify `src/app/globals.css`: add shared dark-mode blue palette tokens.
- Modify dashboard/generator UI components: replace dominant dark zinc surfaces with the HTML-inspired blue palette.
- Create tests in `src/lib/alerts/*.test.ts` and `src/lib/canvas/*.test.ts`.

---

### Task 1: Add Types, Utility Tests, And Dependency Budget

**Files:**
- Modify: `package.json`
- Create: `src/lib/alerts/types.ts`
- Create: `src/lib/alerts/normalization.ts`
- Test: `src/lib/alerts/normalization.test.ts`

**Interfaces:**
- Produces:
  - `ALERT_GROUPS: AlertGroup[]`
  - `type AlertGroup = 'Go Miles Club' | 'Executiva com Milhas' | 'FirstClass' | 'Experiencias Ao Vivo' | 'Milhas Ao Vivo'`
  - `type AlertRecord`
  - `type RouteSetting`
  - `dashTodayStr(date?: Date): string`
  - `routeKey(origin: string, destination: string): string`
  - `normalizeAlertText(value: string): string`
  - `extractCiaFromTitle(title: string): string`
  - `extractClassFromTitle(title: string): string | null`
  - `programSummaryFromBands(bands: PriceBand[]): string`
  - `countDistinctAlerts(alerts: AlertRecord[]): number`

- [ ] **Step 1: Add minimal dependencies**

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.55.0",
    "papaparse": "^5.5.3"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm install
```

Expected: lockfile updates and no install errors.

- [ ] **Step 2: Write failing utility tests**

Create `src/lib/alerts/normalization.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { countDistinctAlerts, extractCiaFromTitle, extractClassFromTitle, programSummaryFromBands, routeKey } from './normalization';

describe('alert normalization', () => {
  it('normalizes route keys', () => {
    expect(routeKey('São Paulo', 'Madri')).toBe('SAO PAULO-MADRI');
  });

  it('extracts class and airline from alert title', () => {
    expect(extractClassFromTitle('EXECUTIVA AIR EUROPA')).toBe('Classe Executiva');
    expect(extractCiaFromTitle('EXECUTIVA AIR EUROPA')).toBe('AIR EUROPA');
  });

  it('summarizes all mileage lines from price bands', () => {
    expect(
      programSummaryFromBands([
        { id: '1', miles: '51,5K Milhas Flying Blue\n75K Milhas Aeroplan', dates: 'Ago: 1, 2' }
      ])
    ).toBe('51,5K Milhas Flying Blue | 75K Milhas Aeroplan');
  });

  it('counts same route/program/date across groups once', () => {
    const base = { origem: 'GRU', destino: 'MAD', programa: '51K FB', data: '2026-08-01', enviado: false };
    expect(
      countDistinctAlerts([
        { id: '1', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', ...base },
        { id: '2', grupo: 'Go Miles Club', cia: 'Air Europa', autor: 'Jose', ...base }
      ])
    ).toBe(1);
  });

  it('counts split round-trip halves with same par_id once', () => {
    expect(
      countDistinctAlerts([
        { id: '1', origem: 'GRU', destino: 'MAD', programa: '51K FB', data: '2026-08-01', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', enviado: false, par_id: 'pair-1' },
        { id: '2', origem: 'MAD', destino: 'GRU', programa: '51K FB', data: '2026-08-01', grupo: 'Executiva com Milhas', cia: 'Air Europa', autor: 'Jose', enviado: false, par_id: 'pair-1' }
      ])
    ).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
```

Expected: FAIL because `src/lib/alerts/normalization.ts` does not exist.

- [ ] **Step 4: Implement shared types**

Create `src/lib/alerts/types.ts`:

```ts
export const ALERT_GROUPS = ['Executiva com Milhas', 'FirstClass', 'Go Miles Club', 'Experiencias Ao Vivo', 'Milhas Ao Vivo'] as const;

export type AlertGroup = (typeof ALERT_GROUPS)[number];

export interface AlertRecord {
  id: string;
  origem: string;
  destino: string;
  programa: string;
  cia: string;
  grupo: AlertGroup;
  data: string;
  autor: string;
  obs?: string;
  image_url?: string | null;
  par_id?: string | null;
  card_data?: string | null;
  enviado: boolean;
  created_at?: string;
}

export interface NewAlertRecord {
  origem: string;
  destino: string;
  programa: string;
  cia: string;
  grupo: AlertGroup;
  data?: string;
  autor: string;
  obs?: string;
  image_url?: string | null;
  par_id?: string | null;
  card_data?: string | null;
}

export interface RouteSetting {
  route_key: string;
  min_days: number;
}
```

- [ ] **Step 5: Implement normalization utilities**

Create `src/lib/alerts/normalization.ts` with the tested functions. Use the ECMv2 logic as source, but keep names in English/TypeScript:

```ts
import type { PriceBand } from '@/lib/canvas/types';
import type { AlertRecord } from './types';

export function normalizeAlertText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function routeKey(origin: string, destination: string) {
  return `${normalizeAlertText(origin).toUpperCase()}-${normalizeAlertText(destination).toUpperCase()}`;
}

export function dashTodayStr(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const titlePrefixes = ['PRIMEIRA CLASSE', 'EXECUTIVA', 'ECONOMICA', 'ECONÔMICA', 'PREMIUM ECONOMY', 'PREMIUM'];

export function extractCiaFromTitle(title: string) {
  const raw = title.trim();
  const normalized = normalizeAlertText(raw).toUpperCase();
  const prefix = titlePrefixes
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((item) => normalized.startsWith(normalizeAlertText(item).toUpperCase()));
  return prefix ? raw.slice(prefix.length).trim() : raw;
}

export function extractClassFromTitle(title: string) {
  const normalized = normalizeAlertText(title).toUpperCase();
  if (normalized.startsWith('PRIMEIRA CLASSE')) return 'Primeira Classe';
  if (normalized.startsWith('EXECUTIVA')) return 'Classe Executiva';
  if (normalized.startsWith('PREMIUM ECONOMY')) return 'Premium Economy';
  if (normalized.startsWith('PREMIUM')) return 'Premium';
  if (normalized.startsWith('ECONOMICA')) return 'Classe Economica';
  return null;
}

export function programSummaryFromBands(bands: PriceBand[]) {
  return bands
    .flatMap((band) => band.miles.split('\n').map((line) => line.trim()).filter(Boolean))
    .join(' | ');
}

function find(parent: number[], index: number): number {
  while (parent[index] !== index) {
    parent[index] = parent[parent[index]];
    index = parent[index];
  }
  return index;
}

export function countDistinctAlerts(alerts: AlertRecord[]) {
  const parent = alerts.map((_, index) => index);
  const union = (a: number, b: number) => {
    const rootA = find(parent, a);
    const rootB = find(parent, b);
    if (rootA !== rootB) parent[rootA] = rootB;
  };

  const byRoute = new Map<string, number>();
  const byPair = new Map<string, number>();

  alerts.forEach((alert, index) => {
    const program = normalizeAlertText(alert.programa || '').replace(/\s+/g, ' ').trim();
    const key = `${normalizeAlertText(alert.origem)}|${normalizeAlertText(alert.destino)}|${program}|${alert.data}`;
    const routeMatch = byRoute.get(key);
    if (routeMatch === undefined) byRoute.set(key, index);
    else union(index, routeMatch);

    if (alert.par_id) {
      const pairMatch = byPair.get(alert.par_id);
      if (pairMatch === undefined) byPair.set(alert.par_id, index);
      else union(index, pairMatch);
    }
  });

  return new Set(alerts.map((_, index) => find(parent, index))).size;
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: tests pass and build succeeds.

---

### Task 2: Add Supabase Schema And Server API

**Files:**
- Create: `docs/db/supabase-alerts-schema.sql`
- Create: `src/lib/server/supabase.ts`
- Create: `src/app/api/alerts/route.ts`
- Create: `src/app/api/alerts/[id]/route.ts`
- Create: `src/app/api/alerts/batch/route.ts`
- Create: `src/app/api/route-settings/route.ts`
- Create: `src/app/api/card-image/route.ts`

**Interfaces:**
- Consumes: `AlertRecord`, `NewAlertRecord`, `RouteSetting`
- Produces:
  - `GET /api/alerts -> { alerts: AlertRecord[] }`
  - `POST /api/alerts -> { alert: AlertRecord }`
  - `PATCH /api/alerts/:id -> { alert: AlertRecord }`
  - `DELETE /api/alerts/:id -> { ok: true }`
  - `POST /api/alerts/batch -> { alerts: AlertRecord[] }`
  - `GET /api/route-settings -> { settings: RouteSetting[] }`
  - `POST /api/route-settings -> { setting: RouteSetting }`
  - `POST /api/card-image -> { publicUrl: string | null }`

- [ ] **Step 1: Add database schema**

Create `docs/db/supabase-alerts-schema.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  destino text not null,
  programa text not null default '',
  cia text not null default '',
  grupo text not null check (grupo in ('Executiva com Milhas', 'FirstClass', 'Go Miles Club', 'Experiencias Ao Vivo', 'Milhas Ao Vivo')),
  data date not null default current_date,
  autor text not null default '',
  obs text not null default '',
  image_url text,
  par_id text,
  card_data jsonb,
  enviado boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alerts_data_idx on public.alerts (data desc);
create index if not exists alerts_grupo_idx on public.alerts (grupo);
create index if not exists alerts_rota_idx on public.alerts (origem, destino);
create index if not exists alerts_par_id_idx on public.alerts (par_id);

create table if not exists public.route_settings (
  route_key text primary key,
  min_days integer not null default 10 check (min_days between 1 and 365),
  updated_at timestamptz not null default now()
);

-- Create a public Supabase Storage bucket named: alert-cards
-- Recommended bucket policy for this internal tool:
-- 1. allow server-side uploads through the API route only;
-- 2. allow public reads if card image links should be visible in dashboard history.
```

- [ ] **Step 2: Add server Supabase client**

Create `src/lib/server/supabase.ts`:

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function getSupabaseServerClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for database features.');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
}
```

- [ ] **Step 3: Implement alert list/create API**

Create `src/app/api/alerts/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { dashTodayStr } from '@/lib/alerts/normalization';
import type { NewAlertRecord } from '@/lib/alerts/types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ alerts: [], configured: false });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data || [], configured: true });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const body = (await request.json()) as NewAlertRecord;
  const record = {
    origem: body.origem.trim(),
    destino: body.destino.trim(),
    programa: body.programa.trim(),
    cia: body.cia.trim(),
    grupo: body.grupo,
    data: body.data || dashTodayStr(),
    autor: body.autor.trim(),
    obs: body.obs || '',
    image_url: body.image_url || null,
    par_id: body.par_id || null,
    card_data: body.card_data ? JSON.parse(body.card_data) : null
  };

  if (!record.origem || !record.destino || !record.grupo) {
    return NextResponse.json({ error: 'Origin, destination and group are required.' }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}
```

- [ ] **Step 4: Implement update/delete API**

Create `src/app/api/alerts/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const { id } = await params;
  const changes = await request.json();
  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from('alerts').update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const { id } = await params;
  const sb = getSupabaseServerClient();
  const { error } = await sb.from('alerts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Implement batch API**

Create `src/app/api/alerts/batch/route.ts` with action-based batch operations:

```ts
import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/server/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  const body = await request.json();
  const sb = getSupabaseServerClient();

  if (body.action === 'insert') {
    const { data, error } = await sb.from('alerts').insert(body.records || []).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ alerts: data || [] });
  }

  if (body.action === 'update') {
    const ids = body.ids as string[];
    const out = [];
    for (const id of ids) {
      const { data, error } = await sb.from('alerts').update(body.changes || {}).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      out.push(data);
    }
    return NextResponse.json({ alerts: out });
  }

  if (body.action === 'delete') {
    const ids = body.ids as string[];
    const { error } = await sb.from('alerts').delete().in('id', ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ alerts: [] });
  }

  return NextResponse.json({ error: 'Invalid batch action.' }, { status: 400 });
}
```

- [ ] **Step 6: Implement route settings API**

Create `src/app/api/route-settings/route.ts`.

GET reads all rows. POST upserts `{ route_key, min_days }`, validates `min_days` between 1 and 365, and returns `{ setting }`.

- [ ] **Step 7: Implement card image upload API**

Create `src/app/api/card-image/route.ts`.

The API must accept multipart form data:

```ts
{
  file: File,
  group: string,
  origin: string,
  destination: string
}
```

It uploads to:

```ts
const path = `${slugGroup}/${date}-${originCode}-${destinationCode}-${Date.now()}.jpg`;
```

and returns:

```ts
{ publicUrl: data.publicUrl }
```

If Supabase is not configured, return `{ publicUrl: null, configured: false }` with status 200 so local generation keeps working.

- [ ] **Step 8: Verify**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: build succeeds without requiring Supabase env vars.

---

### Task 3: Synchronize ECMv2 Destination Image Bank

**Files:**
- Modify: `src/lib/canvas/destination-photos.ts`
- Create: missing image files under `public/assets/destinations/html/default`
- Create: missing image files under `public/assets/destinations/html/gomiles`
- Test: `src/lib/canvas/destination-photos.test.ts`

**Interfaces:**
- Consumes: `matchDestinationPhotoKey(destination: string)`
- Produces: 98 unique ECMv2 destination keys in the static HTML bank.

- [ ] **Step 1: Write failing tests for missing ECMv2 keys**

Create `src/lib/canvas/destination-photos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { matchDestinationPhotoKey, photoPathForDestination } from './destination-photos';

describe('ECMv2 destination photo mapping', () => {
  it.each([
    ['Atenas', 'atenas'],
    ['Boston', 'boston'],
    ['Cancun', 'cancun'],
    ['Copenhague', 'copenhague'],
    ['Pequim', 'pequim'],
    ['Toronto', 'toronto'],
    ['Veneza', 'veneza']
  ])('matches %s', (input, key) => {
    expect(matchDestinationPhotoKey(input)).toBe(key);
  });

  it('returns default and Go Miles bank paths', () => {
    expect(photoPathForDestination('Boston')).toBe('/assets/destinations/html/default/boston.jpg');
    expect(photoPathForDestination('Boston', true)).toBe('/assets/destinations/html/gomiles/boston.jpg');
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
```

Expected: FAIL for unmapped keys.

- [ ] **Step 3: Extract missing ECMv2 image assets**

Extract these keys from `Gerador de Alertas ECMv2.html` into both banks:

```txt
adelaide, atenas, bolonha, boston, budapeste, cancun, copenhague,
daressalam, havai, jacarta, manaus, manila, montreal, napoles, oslo,
papete, pequim, portoalegre, puntacana, shenzhen, stmarteen, taipei,
toronto, toulouse, turkscaicos, vancouver, varsovia, veneza
```

Use the existing file naming convention:

```txt
public/assets/destinations/html/default/<key>.jpg
public/assets/destinations/html/gomiles/<key>.jpg
```

- [ ] **Step 4: Update static key list and keywords**

Modify `src/lib/canvas/destination-photos.ts`:

```ts
'adelaide',
'atenas',
'bolonha',
'boston',
'budapeste',
'cancun',
'copenhague',
'daressalam',
'havai',
'jacarta',
'manaus',
'manila',
'montreal',
'napoles',
'oslo',
'papete',
'pequim',
'portoalegre',
'puntacana',
'shenzhen',
'stmarteen',
'taipei',
'toronto',
'toulouse',
'turkscaicos',
'vancouver',
'varsovia',
'veneza'
```

Add keyword examples:

```ts
atenas: ['atenas', 'athens', 'ath'],
boston: ['boston', 'bos'],
cancun: ['cancun', 'cun'],
copenhague: ['copenhague', 'copenhagen', 'cph'],
pequim: ['pequim', 'beijing', 'pek'],
toronto: ['toronto', 'yyz'],
veneza: ['veneza', 'venice', 'vce']
```

For the remaining keys, use the ECMv2 `DEST_PHOTO_KEYWORDS` values.

- [ ] **Step 5: Verify tests and build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: tests pass and build succeeds.

---

### Task 4: Add Milhas Ao Vivo / Experiencias Ao Vivo Layout

**Files:**
- Modify: `src/lib/canvas/types.ts`
- Modify: `src/lib/canvas/themes.ts`
- Create: `src/lib/canvas/render-mav-canvas.ts`
- Modify: `src/lib/canvas/assets.ts`
- Modify: `src/lib/canvas/export.ts`
- Modify: `src/lib/canvas/default-draft.ts`
- Modify: `src/components/generator/CanvasPreviewCard.tsx`
- Modify: `src/components/generator/AlertGenerator.tsx`
- Create: `public/assets/logos/milhas-aovivo.png`

**Interfaces:**
- Produces:
  - `CanvasThemeKey = 'gomiles' | 'executiva' | 'firstclass' | 'milhasaovivo'`
  - `AlertDraft.mavVariant: 'experiencias' | 'milhasaovivo'`
  - `renderMavCanvas(canvas, draft, assets): void`
  - Fourth generated file in ZIP and preview list.

- [ ] **Step 1: Write renderer smoke test**

Create `src/lib/canvas/render-mav-canvas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDefaultAlertDraft } from './default-draft';

describe('Milhas Ao Vivo draft contract', () => {
  it('includes fourth layout footer and variant', () => {
    const draft = createDefaultAlertDraft();
    expect(draft.footersByTheme.milhasaovivo).toContain('Pesquisa realizada');
    expect(draft.mavVariant).toBe('experiencias');
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
```

Expected: FAIL because `milhasaovivo` is not in the draft contract.

- [ ] **Step 3: Extend types and defaults**

Modify `src/lib/canvas/types.ts`:

```ts
export type CanvasThemeKey = 'gomiles' | 'executiva' | 'firstclass' | 'milhasaovivo';
export type MavVariant = 'experiencias' | 'milhasaovivo';
```

Add to `AlertDraft`:

```ts
mavVariant: MavVariant;
```

Modify `defaultFooters()` in `src/lib/canvas/default-draft.ts` to include:

```ts
milhasaovivo: `· Pesquisa realizada para 1 passageiro no dia ${getTodayLongPTNoDe()} ·
Alerta para uso exclusivo do grupo. Não encaminhar!
COMPRE E VENDA MILHAS NO NOSSO CLOSE FRIENDS COM MAIS DE 700 MEMBROS!
SAIBA MAIS: COMENTE CF NO (31) 99957-9696`
```

Set default:

```ts
mavVariant: 'experiencias'
```

- [ ] **Step 4: Add theme metadata**

Modify `src/lib/canvas/themes.ts` with a fourth theme:

```ts
{
  key: 'milhasaovivo',
  name: 'Experiencias Ao Vivo',
  fileSlug: 'milhasaovivo',
  bg: '#0E2038',
  header: '#F1C469',
  routeTitle: '#F1C469',
  miles: '#F1C469',
  dateLabel: '#F1C469',
  dateText: '#EFEAF5',
  divider: '#6FA0D8',
  footerBg: '#0E2038',
  footerText: '#EFEAF5',
  footerSub: '#F1C469',
  footerLogoMode: 'own',
  watermarkOpacity: 0.08,
  ownLogoAsset: '/assets/logos/milhas-aovivo.png',
  poweredLogoAsset: '/assets/logos/executiva-white.png',
  photoGradTop: '#0E2038',
  photoGradBottom: '#060B14',
  noPlane: true
}
```

- [ ] **Step 5: Port ECMv2 MAV renderer**

Create `src/lib/canvas/render-mav-canvas.ts`.

Port the following ECMv2 functions into TypeScript:

```txt
mavDrawHeader
mavDrawDivider
mavParseMonths
mavDrawPriceBox
mavDrawDatesBlock
mavDrawLeg
renderMilhasAoVivoCard
buildMavRouteData
```

Use these differences from ECMv2:

- Replace `codigoOrigem1`/`codigoDestino1` fields with `inferIataFromCity(route.origin)` and `inferIataFromCity(route.destination)`.
- Use `draft.mavVariant` to choose palette.
- Use `extractClassFromTitle()` and `extractCiaFromTitle()` from `src/lib/alerts/normalization.ts`.
- Use `draft.footersByTheme.milhasaovivo` for footer lines.

- [ ] **Step 6: Dispatch renderer from preview/export**

Modify `CanvasPreviewCard.tsx`:

```ts
if (theme.key === 'milhasaovivo') {
  renderMavCanvas(canvas, draft, assets);
} else {
  renderAlertCanvas(canvas, draft, theme, assets);
}
```

Modify `export.ts` with the same renderer dispatch.

- [ ] **Step 7: Add variant selector to generator**

In `AlertGenerator.tsx`, add a compact select near preview or title controls:

```tsx
<select
  value={draft.mavVariant}
  onChange={(event) => setDraft((current) => ({ ...current, mavVariant: event.target.value as AlertDraft['mavVariant'] }))}
>
  <option value="experiencias">Experiencias Ao Vivo</option>
  <option value="milhasaovivo">Milhas Ao Vivo</option>
</select>
```

Group name for database logging must be:

```ts
draft.mavVariant === 'experiencias' ? 'Experiencias Ao Vivo' : 'Milhas Ao Vivo'
```

- [ ] **Step 8: Verify visual behavior**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
$env:Path += ";C:\Projects\node20"; npm run build
$env:Path += ";C:\Projects\node20"; npm run dev
```

Manual checks:

- Four preview cards render.
- Existing three layouts remain visually unchanged.
- MAV layout uses IATA inferred from city names.
- ZIP contains four PNG files.

---

### Task 5: Add Database Logging From Generator

**Files:**
- Modify: `src/components/generator/AlertGenerator.tsx`
- Modify: `src/lib/canvas/export.ts`
- Create: `src/lib/alerts/client.ts`

**Interfaces:**
- Consumes API from Task 2.
- Produces:
  - `uploadCardJpeg(canvas, meta): Promise<string | null>`
  - `createAlert(record: NewAlertRecord): Promise<AlertRecord | null>`
  - Downloading a card logs one alert when database is configured.

- [ ] **Step 1: Create client helpers**

Create `src/lib/alerts/client.ts`:

```ts
import type { AlertRecord, NewAlertRecord } from './types';

export async function createAlert(record: NewAlertRecord): Promise<AlertRecord | null> {
  const response = await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (response.status === 503) return null;
  if (!response.ok) throw new Error((await response.json()).error || 'Failed to create alert.');
  return ((await response.json()) as { alert: AlertRecord }).alert;
}

export async function uploadCardJpeg(canvas: HTMLCanvasElement, group: string, origin: string, destination: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) return null;

  const form = new FormData();
  form.append('file', blob, 'card.jpg');
  form.append('group', group);
  form.append('origin', origin);
  form.append('destination', destination);

  const response = await fetch('/api/card-image', { method: 'POST', body: form });
  if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload card image.');
  return ((await response.json()) as { publicUrl: string | null }).publicUrl;
}
```

- [ ] **Step 2: Build alert metadata in generator**

In `AlertGenerator.tsx`, add:

```ts
function groupForTheme(theme: CanvasTheme): AlertGroup {
  if (theme.key === 'milhasaovivo') {
    return draft.mavVariant === 'experiencias' ? 'Experiencias Ao Vivo' : 'Milhas Ao Vivo';
  }
  if (theme.key === 'gomiles') return 'Go Miles Club';
  if (theme.key === 'executiva') return 'Executiva com Milhas';
  return 'FirstClass';
}
```

Build `NewAlertRecord` from:

```ts
{
  origem: draft.outbound.origin,
  destino: draft.outbound.destination,
  programa: programSummaryFromBands(draft.outbound.bands),
  cia: extractCiaFromTitle(draft.title),
  grupo,
  autor,
  image_url,
  card_data: JSON.stringify(draft)
}
```

- [ ] **Step 3: Add author and split-pair controls**

Add small controls in generator header:

```tsx
<select value={author} onChange={(event) => setAuthor(event.target.value)}>
  <option>José</option>
  <option>Lucas</option>
  <option>Anderson</option>
</select>
```

Persist author in `localStorage` key:

```ts
ecm_author
```

Add checkbox:

```tsx
Essa rota e a 2a metade de uma ida+volta dividida em 2 cards
```

When checked, call `/api/alerts` list or use loaded dashboard data later to resolve matching reverse route. For first implementation, generate a new `par_id` locally with `crypto.randomUUID()` and store it.

- [ ] **Step 4: Log on individual download**

In `handleDownload`:

1. Download local PNG first.
2. Upload JPEG with `uploadCardJpeg`.
3. Create alert with `createAlert`.
4. If database is unavailable, show: `Card baixado. Historico nao configurado.`
5. If database succeeds, show: `Card baixado e alerta registrado.`

- [ ] **Step 5: Log on generate-all ZIP**

When `Gerar ZIP` runs, render all themes and create one alert per generated theme. If logging fails for one theme, still complete ZIP generation and show a warning.

- [ ] **Step 6: Verify**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Manual checks:

- With no Supabase env vars, downloads still work.
- With Supabase env vars, downloading a card inserts a row in `alerts`.
- Generated card image URL appears in the row when storage upload succeeds.

---

### Task 6: Add Dashboard And History

**Files:**
- Create: `src/components/dashboard/AlertsDashboard.tsx`
- Create: `src/components/dashboard/HistoryTable.tsx`
- Create: `src/components/dashboard/StatsPanels.tsx`
- Create: `src/components/dashboard/RouteSuggestions.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/alerts`
  - `PATCH /api/alerts/:id`
  - `POST /api/alerts/batch`
  - `GET/POST /api/route-settings`
  - `countDistinctAlerts`
- Produces:
  - Dashboard tab matching ECMv2 operational features.

- [ ] **Step 1: Create dashboard shell**

`AlertsDashboard.tsx` state:

```ts
const [alerts, setAlerts] = useState<AlertRecord[]>([]);
const [configured, setConfigured] = useState(true);
const [status, setStatus] = useState('');
```

Load from `/api/alerts`. If `configured === false`, show:

```txt
Banco de dados nao configurado. A geracao de cards continua disponivel.
```

- [ ] **Step 2: Add stats panels**

`StatsPanels.tsx` computes:

- generated today
- generated this week
- overdue route count
- per-group generated today
- per-group sent today
- per-group total
- daily goals:

```ts
{
  'Go Miles Club': 8,
  'Executiva com Milhas': 8,
  FirstClass: 4,
  'Experiencias Ao Vivo': 8,
  'Milhas Ao Vivo': 8
}
```

- [ ] **Step 3: Add history table**

`HistoryTable.tsx` supports:

- filter by today/all
- filter by group
- search route/company/program
- edit `origem`, `destino`, `cia`, `programa`, `grupo`
- toggle `enviado`
- delete grouped alert rows after `confirm()`
- show card image links from `image_url`
- reload `card_data` into generator through callback:

```ts
onLoadSnapshot(snapshot: AlertDraft): void
```

- [ ] **Step 4: Add route suggestions**

`RouteSuggestions.tsx` implements ECMv2 logic:

- route summary by `origem-destino`
- stale routes by `min_days`
- variety routes with low count
- rotation candidates: sent in `Executiva com Milhas` in last 3 days and not yet sent to `Go Miles Club` or `FirstClass`

- [ ] **Step 5: Add top-level navigation**

Modify `src/app/page.tsx` to switch between:

```txt
Gerador de cards
Dashboard de alertas
```

Keep generator as default first screen.

- [ ] **Step 6: Verify**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Manual checks:

- Dashboard loads empty state without Supabase.
- Dashboard renders real rows with Supabase configured.
- Editing, sent checkbox, delete, and image link work.

---

### Task 7: Add Notion CSV Import

**Files:**
- Create: `src/components/dashboard/NotionCsvImport.tsx`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`
- Test: `src/lib/alerts/notion-csv.test.ts`
- Create: `src/lib/alerts/notion-csv.ts`

**Interfaces:**
- Produces:
  - `parseNotionDate(value: string): string | null`
  - `extractRouteCodes(value: string): { origem: string; destino: string } | null`
  - `rowsToAlertRecords(rows, author): NewAlertRecord[]`

- [ ] **Step 1: Write tests**

Create `src/lib/alerts/notion-csv.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractRouteCodes, parseNotionDate } from './notion-csv';

describe('Notion CSV import helpers', () => {
  it('parses Portuguese dates', () => {
    expect(parseNotionDate('3 de agosto de 2026')).toBe('2026-08-03');
  });

  it('extracts IATA codes from route text', () => {
    expect(extractRouteCodes('São Paulo (GRU) - Madri (MAD)')).toEqual({ origem: 'GRU', destino: 'MAD' });
  });
});
```

- [ ] **Step 2: Implement parser helpers**

Create `src/lib/alerts/notion-csv.ts` with ECMv2-compatible logic:

```ts
const PT_MONTHS = { janeiro: '01', fevereiro: '02', marco: '03', março: '03', abril: '04', maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12' };
```

Use `Papa.parse` only in the component; keep helper functions dependency-free.

- [ ] **Step 3: Build import component**

`NotionCsvImport.tsx`:

- hidden file input
- button `Importar CSV do Notion`
- parse with `Papa.parse(file, { header: true, skipEmptyLines: true })`
- map rows:

```ts
row['Rotas']
row['Data da Viagem']
row['Últimos Valores'] || row['Programas de Milhas']
```

- dedupe against existing alerts by `origem|destino|data|programa`
- POST new rows to `/api/alerts/batch` with `action: 'insert'`

- [ ] **Step 4: Verify**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
$env:Path += ";C:\Projects\node20"; npm run build
```

Manual check: import a small CSV with one row and confirm it appears in dashboard history.

---

### Task 8: Final UI, Copy, And Regression Pass

**Files:**
- Modify: `src/components/generator/*.tsx`
- Modify: `src/components/dashboard/*.tsx`
- Modify: `src/app/globals.css` if needed

**Interfaces:**
- Produces final integrated UI with generator + dashboard.

- [ ] **Step 1: Review visible text**

Use consistent labels:

```txt
Gerador de cards
Dashboard de alertas
Gerar todos
Baixar PNG
Imagem do destino
Texto para WhatsApp
Historico de alertas
Importar CSV do Notion
```

- [ ] **Step 2: Keep layout responsive**

Required viewport checks:

```txt
1920x1080
1366x768
1080x903
1024x768
390x844
```

Expected:

- Controls scroll independently from previews on desktop.
- Preview cards are not cut at 1080px width.
- Four layouts stack cleanly below large desktop widths.
- Dashboard tables scroll horizontally inside their panels.

- [ ] **Step 3: Run full verification**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
$env:Path += ";C:\Projects\node20"; npm run build
```

Manual verification:

- Generate all 4 layouts.
- Download one layout.
- Generate ZIP.
- Upload missing destination photo.
- Confirm HTML photo wins over user collision.
- Copy WhatsApp text.
- Log alert to database.
- Mark alert as sent.
- Import Notion CSV.
- Reload saved card snapshot from history.

---

### Task 9: Make Supabase Configuration Operational

**Files:**
- Create: `.env.example`
- Modify: `docs/db/supabase-alerts-schema.sql`
- Modify: `README.md`
- Modify: `src/lib/server/supabase.ts`
- Modify: `src/app/api/card-image/route.ts`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`

**Interfaces:**
- Consumes existing internal APIs:
  - `GET /api/alerts`
  - `GET /api/route-settings`
  - `POST /api/card-image`
- Produces:
  - documented local env setup
  - configurable storage bucket name
  - dashboard-visible Supabase configuration state
  - SQL compatible with the ECMv2 HTML data already written to Supabase

- [x] **Step 1: Add environment template**

Create `.env.example`:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_STORAGE_BUCKET=alert-cards
```

Do not commit `.env.local`.

- [x] **Step 2: Make storage bucket configurable**

Modify `src/lib/server/supabase.ts`:

```ts
export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'alert-cards';
}
```

Modify `src/app/api/card-image/route.ts` to replace the hard-coded bucket:

```ts
const bucket = getSupabaseStorageBucket();
const { error } = await sb.storage.from(bucket).upload(path, blob, {
  contentType: 'image/jpeg',
  upsert: false
});
const { data } = sb.storage.from(bucket).getPublicUrl(path);
```

- [x] **Step 3: Make the SQL safe for old ECMv2 rows**

Modify `docs/db/supabase-alerts-schema.sql` so it normalizes the HTML accented group name before enforcing the final constraint:

```sql
update public.alerts
set grupo = 'Experiencias Ao Vivo'
where grupo = 'Experiências Ao Vivo';
```

Keep the final allowed groups aligned with the Next app:

```sql
check (grupo in (
  'Executiva com Milhas',
  'FirstClass',
  'Go Miles Club',
  'Experiencias Ao Vivo',
  'Milhas Ao Vivo'
))
```

- [x] **Step 4: Document the Supabase setup**

Add to `README.md`:

```md
## Supabase Setup

1. Create a Supabase project.
2. Run `docs/db/supabase-alerts-schema.sql` in the SQL editor.
3. Create a public Storage bucket named `alert-cards`.
4. Copy `.env.example` to `.env.local`.
5. Fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `SUPABASE_STORAGE_BUCKET`.
6. Restart the Next dev server.

The generator works without Supabase. The dashboard, history, CSV import, sent status, and card-image archive require Supabase.
```

- [x] **Step 5: Improve dashboard configuration feedback**

Modify `AlertsDashboard.tsx` so the empty/unconfigured state is explicit:

```txt
Supabase nao configurado. O gerador continua funcionando, mas dashboard, historico, importacao CSV e status de envio ficam desativados.
```

When configured and empty, show:

```txt
Supabase configurado. Nenhum alerta encontrado ainda.
```

- [ ] **Step 6: Verify**

Run without `.env.local`:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected:

- build succeeds
- generator remains usable
- dashboard reports unconfigured Supabase

Run with `.env.local` filled:

```powershell
$env:Path += ";C:\Projects\node20"; npm run dev
```

Manual checks:

- dashboard loads rows from `alerts`
- route settings load from `route_settings`
- generated JPEG uploads to the configured Storage bucket
- no browser code imports `@supabase/supabase-js`

---

### Task 10: Align Dark Mode With The ECMv2 Blue Palette

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Modify: `src/components/generator/AlertGenerator.tsx`
- Modify: `src/components/generator/CanvasPreviewCard.tsx`
- Modify: `src/components/generator/FooterEditor.tsx`
- Modify: `src/components/generator/JourneyLegEditor.tsx`
- Modify: `src/components/generator/TypographyControls.tsx`
- Modify: `src/components/generator/WhatsAppTextPanel.tsx`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`
- Modify: `src/components/dashboard/StatsPanels.tsx`
- Modify: `src/components/dashboard/HistoryTable.tsx`
- Modify: `src/components/dashboard/RouteSuggestions.tsx`
- Modify: `src/components/dashboard/NotionCsvImport.tsx`

**Interfaces:**
- Produces a dark-mode visual system closer to the HTML:
  - page background: deep blue
  - panels: navy blue
  - borders: muted blue
  - primary actions: bright blue/gold accents
  - warning/error states remain semantically distinct

- [x] **Step 1: Add palette tokens**

Modify `src/app/globals.css`:

```css
:root {
  --ecm-blue-bg: #07182f;
  --ecm-blue-surface: #0c2341;
  --ecm-blue-panel: #102d52;
  --ecm-blue-border: #1f4f80;
  --ecm-blue-muted: #8fb8dc;
  --ecm-blue-text: #eef7ff;
  --ecm-blue-accent: #5aa7ff;
  --ecm-gold: #f1c469;
}
```

Keep light mode unchanged.

- [x] **Step 2: Replace page-level dark zinc backgrounds**

Replace dominant dark page classes:

```txt
dark:bg-zinc-950
dark:bg-zinc-900
dark:border-zinc-800
```

with explicit palette-backed utilities where they define major surfaces:

```txt
dark:bg-[var(--ecm-blue-bg)]
dark:bg-[var(--ecm-blue-surface)]
dark:border-[var(--ecm-blue-border)]
```

Do this first in:

```txt
src/app/page.tsx
src/components/generator/AlertGenerator.tsx
src/components/dashboard/AlertsDashboard.tsx
```

- [x] **Step 3: Update reusable panels and preview cards**

For generator/dashboard sections, use:

```txt
dark:bg-[var(--ecm-blue-surface)]
dark:border-[var(--ecm-blue-border)]
dark:text-[var(--ecm-blue-text)]
```

For nested controls and inputs, use:

```txt
dark:bg-[var(--ecm-blue-bg)]
dark:border-[var(--ecm-blue-border)]
dark:text-[var(--ecm-blue-text)]
placeholder:dark:text-[var(--ecm-blue-muted)]
```

- [x] **Step 4: Update primary actions**

Replace inverted black/white dark buttons:

```txt
dark:bg-zinc-100 dark:text-zinc-900
```

with:

```txt
dark:bg-[var(--ecm-gold)] dark:text-[#07182f]
```

Use blue accent for secondary links:

```txt
dark:text-[var(--ecm-blue-accent)]
```

- [x] **Step 5: Preserve semantic status colors**

Keep success/warning/error recognizable, but reduce black-heavy panels:

```txt
success: emerald
warning: amber/gold
error: red
```

Avoid changing alert meaning only for palette consistency.

- [x] **Step 6: Verify color balance**

Run:

```powershell
rg -n "dark:bg-zinc-950|dark:bg-zinc-900|dark:border-zinc-800|dark:bg-zinc-100" src
```

Expected:

- no dominant page/panel surfaces still use zinc/black
- small neutral details may remain only when visually harmless

- [ ] **Step 7: Verify responsive dashboard/generator**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Manual viewport checks in dark mode:

```txt
1920x1080
1366x768
1080x903
1024x768
390x844
```

Expected:

- dashboard remains legible
- preview cards do not get visually swallowed by the dark background
- blue palette resembles the ECMv2 HTML more than the current zinc/black UI
- text contrast remains high

---

## Execution Order

1. Task 1: Types/utilities and test baseline.
2. Task 2: Supabase schema/API.
3. Task 3: ECMv2 image bank sync.
4. Task 4: Fourth layout renderer.
5. Task 5: Generator database logging.
6. Task 6: Dashboard/history.
7. Task 7: Notion CSV import.
8. Task 8: UI/regression pass.
9. Task 9: Supabase operational configuration.
10. Task 10: HTML-inspired dark blue palette.

## Risk Notes

- The largest visual risk is Task 4 because MAV is a separate renderer, not just another color theme.
- The largest operational risk is Supabase policy configuration. The app should degrade gracefully when env vars or policies are missing.
- The largest data risk is exposing Supabase keys in client code. Keep database/storage access in server API routes.
- The image bank extraction should be scripted or carefully verified because ECMv2 embeds large base64 lines.
- The Supabase migration must normalize `Experiências Ao Vivo` rows from the HTML before enforcing the Next app group names.
- The dark-mode palette should improve the dashboard without changing the exported canvas card colors.

## Self-Review

- Spec coverage: the plan covers missing layouts, destination image synchronization, database usage, operational Supabase configuration, dashboard, history, card upload, CSV import, and dark-mode palette alignment.
- Placeholder scan: no task relies on undefined behavior; each task has concrete files, interfaces, and verification.
- Type consistency: `AlertGroup`, `AlertRecord`, `CanvasThemeKey`, `mavVariant`, and API route payloads are named consistently across tasks.
