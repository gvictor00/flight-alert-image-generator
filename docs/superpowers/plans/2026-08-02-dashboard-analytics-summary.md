# Dashboard Analytics And Alert Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add period-aware dashboard analytics, route/program/operator tables, and a WhatsApp alert summary builder backed by Supabase history.

**Architecture:** Keep Supabase access behind the existing Next API routes and derive dashboard analytics client-side from loaded `AlertRecord[]`. Put filtering, grouping, program detection, route matrix rows, and WhatsApp summary generation in pure TypeScript helpers under `src/lib/alerts` so the UI stays thin and testable.

**Tech Stack:** Next 15, React 19, TypeScript, Tailwind CSS, Supabase via existing server API routes, Vitest.

## Global Constraints

- Do not add a charting library; use CSS bars/tables.
- Do not query Supabase directly from browser components.
- Use `Experiências Ao Vivo` with accent as the canonical group name.
- Keep `.env.local` ignored and never commit it.
- Keep canvas export dimensions unchanged.
- Dashboard summaries are generated from Supabase history but edited as local drafts.
- Summary drafts are stored in `localStorage` only for this version.
- Run commands with `$env:Path += ";C:\Projects\node20"` on this machine.
- Do not push commits.

---

## File Structure

- Modify `src/lib/alerts/types.ts`: add shared period filter types.
- Create `src/lib/alerts/dashboard-analytics.ts`: period filtering, program detection, operator stats, route matrix rows.
- Create `src/lib/alerts/dashboard-analytics.test.ts`: unit tests for dashboard analytics.
- Create `src/lib/alerts/summary.ts`: summary draft types, Supabase-to-draft mapping, validation, text generation.
- Create `src/lib/alerts/summary.test.ts`: unit tests for summary generation and validation.
- Modify `src/app/page.tsx`: move `ThemeToggle` into the top navigation.
- Modify `src/components/generator/AlertGenerator.tsx`: limit preview grid to at most two canvas columns.
- Modify `src/components/dashboard/AlertsDashboard.tsx`: add shared period state and wire new panels.
- Modify `src/components/dashboard/StatsPanels.tsx`: convert group stats to table layout and use period helpers.
- Create `src/components/dashboard/PeriodFilterBar.tsx`: shared dashboard period controls.
- Create `src/components/dashboard/OperatorStatsTable.tsx`: history by operator.
- Create `src/components/dashboard/ProgramStatsPanel.tsx`: loyalty program bars.
- Create `src/components/dashboard/RouteMatrixPanel.tsx`: route and last-search table.
- Modify `src/components/dashboard/HistoryTable.tsx`: consume shared period filter instead of local today/all state.
- Create `src/components/dashboard/AlertSummaryBuilder.tsx`: collapsible WhatsApp summary editor.

---

### Task 1: Shared Dashboard Analytics Helpers

**Files:**
- Modify: `src/lib/alerts/types.ts`
- Create: `src/lib/alerts/dashboard-analytics.ts`
- Test: `src/lib/alerts/dashboard-analytics.test.ts`

**Interfaces:**
- Produces:
  - `type PeriodFilter = { mode: 'today' | '7d' | '30d' | 'all' | 'custom'; startDate?: string; endDate?: string }`
  - `filterAlertsByPeriod(alerts: AlertRecord[], filter: PeriodFilter, now?: Date): AlertRecord[]`
  - `detectPrograms(text: string): string[]`
  - `buildProgramStats(alerts: AlertRecord[]): ProgramStat[]`
  - `buildOperatorStats(allAlerts: AlertRecord[], periodAlerts: AlertRecord[], now?: Date): OperatorStat[]`
  - `buildRouteMatrixRows(alerts: AlertRecord[], settings?: RouteSetting[], now?: Date): RouteMatrixRow[]`

- [ ] **Step 1: Add period and analytics types**

Add to `src/lib/alerts/types.ts`:

```ts
export interface PeriodFilter {
  mode: 'today' | '7d' | '30d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface ProgramStat {
  name: string;
  count: number;
  percentage: number;
}

export interface OperatorStat {
  operator: string;
  generatedToday: number;
  sentToday: number;
  generatedInPeriod: number;
  sentInPeriod: number;
  lastAlert: string;
}

export interface RouteMatrixRow {
  key: string;
  origin: string;
  destination: string;
  groupDays: Partial<Record<AlertGroup, number | null>>;
  status: 'Nunca enviada' | 'OK' | 'Atenção' | 'Vencida';
  total: number;
  minDays: number;
  programs: string[];
}
```

- [ ] **Step 2: Write failing tests for period filtering, program detection, operator stats, and route matrix**

Create `src/lib/alerts/dashboard-analytics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { AlertRecord, RouteSetting } from './types';
import { buildOperatorStats, buildProgramStats, buildRouteMatrixRows, detectPrograms, filterAlertsByPeriod } from './dashboard-analytics';

function alert(overrides: Partial<AlertRecord>): AlertRecord {
  return {
    id: overrides.id || crypto.randomUUID(),
    origem: overrides.origem || 'GRU',
    destino: overrides.destino || 'MAD',
    programa: overrides.programa || '51K Milhas Flying Blue',
    cia: overrides.cia || 'Air Europa',
    grupo: overrides.grupo || 'Executiva com Milhas',
    data: overrides.data || '2026-08-02',
    autor: overrides.autor || 'Lucas',
    enviado: overrides.enviado ?? false,
    created_at: overrides.created_at
  };
}

describe('dashboard analytics helpers', () => {
  it('filters alerts by shared period options', () => {
    const alerts = [
      alert({ id: 'today', data: '2026-08-02' }),
      alert({ id: 'week', data: '2026-07-29' }),
      alert({ id: 'old', data: '2026-06-01' })
    ];
    const now = new Date('2026-08-02T12:00:00Z');

    expect(filterAlertsByPeriod(alerts, { mode: 'today' }, now).map((item) => item.id)).toEqual(['today']);
    expect(filterAlertsByPeriod(alerts, { mode: '7d' }, now).map((item) => item.id)).toEqual(['today', 'week']);
    expect(filterAlertsByPeriod(alerts, { mode: 'custom', startDate: '2026-07-01', endDate: '2026-07-31' }, now).map((item) => item.id)).toEqual(['week']);
  });

  it('detects loyalty programs from alert text', () => {
    expect(detectPrograms('100K Milhas Aeroplan ou 55K Milhas Miles+Bonus')).toEqual(['Aeroplan', 'Aegean Miles+Bonus']);
    expect(detectPrograms('70K a 94.5K Milhas Avios Qatar')).toEqual(['Avios Qatar']);
  });

  it('builds program bar stats sorted by count', () => {
    const stats = buildProgramStats([
      alert({ id: '1', programa: '80K Milhas TAP' }),
      alert({ id: '2', programa: '51K Milhas Flying Blue' }),
      alert({ id: '3', programa: '75K Milhas TAP' })
    ]);

    expect(stats).toEqual([
      { name: 'TAP', count: 2, percentage: 100 },
      { name: 'Flying Blue', count: 1, percentage: 50 }
    ]);
  });

  it('builds operator stats for today and selected period', () => {
    const all = [
      alert({ id: '1', autor: 'Lucas', data: '2026-08-02', enviado: true, created_at: '2026-08-02T10:00:00Z' }),
      alert({ id: '2', autor: 'Lucas', data: '2026-07-30', enviado: false, created_at: '2026-07-30T10:00:00Z' }),
      alert({ id: '3', autor: '', data: '2026-08-02', enviado: false, created_at: '2026-08-02T09:00:00Z' })
    ];
    const period = filterAlertsByPeriod(all, { mode: '7d' }, new Date('2026-08-02T12:00:00Z'));

    expect(buildOperatorStats(all, period, new Date('2026-08-02T12:00:00Z'))).toEqual([
      { operator: 'Lucas', generatedToday: 1, sentToday: 1, generatedInPeriod: 2, sentInPeriod: 1, lastAlert: '2026-08-02T10:00:00Z' },
      { operator: 'Sem operador', generatedToday: 1, sentToday: 0, generatedInPeriod: 1, sentInPeriod: 0, lastAlert: '2026-08-02T09:00:00Z' }
    ]);
  });

  it('builds route matrix rows with group days and status', () => {
    const settings: RouteSetting[] = [{ route_key: 'GRU-MAD', min_days: 3 }];
    const rows = buildRouteMatrixRows([
      alert({ id: '1', origem: 'GRU', destino: 'MAD', grupo: 'Go Miles Club', data: '2026-08-01' }),
      alert({ id: '2', origem: 'GRU', destino: 'MAD', grupo: 'Executiva com Milhas', data: '2026-07-20' })
    ], settings, new Date('2026-08-02T12:00:00Z'));

    expect(rows[0]).toMatchObject({
      key: 'GRU-MAD',
      groupDays: { 'Go Miles Club': 1, 'Executiva com Milhas': 13 },
      status: 'OK',
      total: 2,
      minDays: 3
    });
  });
});
```

- [ ] **Step 3: Run test and verify it fails**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test -- src/lib/alerts/dashboard-analytics.test.ts
```

Expected: FAIL because `src/lib/alerts/dashboard-analytics.ts` does not exist.

- [ ] **Step 4: Implement analytics helpers**

Create `src/lib/alerts/dashboard-analytics.ts`:

```ts
import { dashTodayStr, normalizeAlertText, routeKey } from './normalization';
import { ALERT_GROUPS, normalizeAlertGroup, type AlertGroup, type AlertRecord, type OperatorStat, type PeriodFilter, type ProgramStat, type RouteMatrixRow, type RouteSetting } from './types';

const PROGRAM_KEYWORDS: Record<string, string[]> = {
  Smiles: ['smiles'],
  Azul: ['azul'],
  TAP: ['tap'],
  'Latam Pass': ['latam pass'],
  'Flying Blue': ['flying blue'],
  AAdvantage: ['aadvantage'],
  Aeroplan: ['aeroplan'],
  'Avios Iberia': ['avios iberia'],
  'Avios Finnair': ['avios finnair'],
  'Avios British': ['avios british'],
  'Avios Qatar': ['avios qatar'],
  'Aegean Miles+Bonus': ['aegean', 'miles+bonus'],
  Lifemiles: ['lifemiles'],
  Krisflyer: ['krisflyer', 'krissflyer'],
  Suma: ['suma'],
  'Miles&Smiles': ['miles&smiles', 'turkish miles'],
  Connectmiles: ['connectmiles'],
  'Virgin Flying Club': ['virgin flying club'],
  'Mileage Plan Alaska': ['alaska', 'mileage plan'],
  'United MileagePlus': ['mileageplus'],
  'Delta Skymiles': ['delta skymiles'],
  'Miles&More': ['miles&more'],
  'SAS EuroBonus': ['sas eurobonus'],
  'Aeromexico Rewards': ['aeromexico rewards'],
  'Qantas Frequent Flyer': ['qantas']
};

function daysBetween(date: string, now: Date) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(`${dashTodayStr(now)}T00:00:00`);
  return Math.floor((today.getTime() - target.getTime()) / 86400000);
}

export function filterAlertsByPeriod(alerts: AlertRecord[], filter: PeriodFilter, now = new Date()) {
  const today = dashTodayStr(now);
  return alerts.filter((alert) => {
    if (filter.mode === 'all') return true;
    if (filter.mode === 'today') return alert.data === today;
    if (filter.mode === '7d') return daysBetween(alert.data, now) >= 0 && daysBetween(alert.data, now) < 7;
    if (filter.mode === '30d') return daysBetween(alert.data, now) >= 0 && daysBetween(alert.data, now) < 30;
    const start = filter.startDate || '0000-01-01';
    const end = filter.endDate || '9999-12-31';
    return alert.data >= start && alert.data <= end;
  });
}

export function detectPrograms(text: string) {
  const norm = normalizeAlertText(text);
  if (!norm) return [];
  return Object.entries(PROGRAM_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => {
      const escaped = normalizeAlertText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z0-9&])${escaped}($|[^a-z0-9&])`).test(norm);
    }))
    .map(([program]) => program);
}

export function buildProgramStats(alerts: AlertRecord[]): ProgramStat[] {
  const counts = new Map<string, number>();
  for (const alert of alerts) {
    for (const program of detectPrograms(alert.programa || '')) {
      counts.set(program, (counts.get(program) || 0) + 1);
    }
  }
  const max = Math.max(0, ...counts.values());
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, percentage: max ? Math.round((count / max) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildOperatorStats(allAlerts: AlertRecord[], periodAlerts: AlertRecord[], now = new Date()): OperatorStat[] {
  const today = dashTodayStr(now);
  const byOperator = new Map<string, OperatorStat>();
  const ensure = (value: string) => {
    const operator = value.trim() || 'Sem operador';
    const current = byOperator.get(operator) || { operator, generatedToday: 0, sentToday: 0, generatedInPeriod: 0, sentInPeriod: 0, lastAlert: '' };
    byOperator.set(operator, current);
    return current;
  };

  for (const alert of periodAlerts) {
    const current = ensure(alert.autor || '');
    current.generatedInPeriod += 1;
    if (alert.enviado) current.sentInPeriod += 1;
    const last = alert.created_at || alert.data;
    if (last > current.lastAlert) current.lastAlert = last;
  }

  for (const alert of allAlerts.filter((item) => item.data === today)) {
    const current = ensure(alert.autor || '');
    current.generatedToday += 1;
    if (alert.enviado) current.sentToday += 1;
    const last = alert.created_at || alert.data;
    if (last > current.lastAlert) current.lastAlert = last;
  }

  return [...byOperator.values()].sort((a, b) => b.generatedInPeriod - a.generatedInPeriod || a.operator.localeCompare(b.operator));
}

function normalizeRouteSettingKey(value: string) {
  const [origin = '', destination = ''] = value.split('-');
  return routeKey(origin, destination);
}

function statusFor(days: number | null, minDays: number): RouteMatrixRow['status'] {
  if (days === null) return 'Nunca enviada';
  if (days > minDays) return 'Vencida';
  if (days > minDays * 0.6) return 'Atenção';
  return 'OK';
}

export function buildRouteMatrixRows(alerts: AlertRecord[], settings: RouteSetting[] = [], now = new Date()): RouteMatrixRow[] {
  const minDaysByRoute = new Map(settings.map((setting) => [normalizeRouteSettingKey(setting.route_key), setting.min_days]));
  const rows = new Map<string, RouteMatrixRow & { lastByGroup: Partial<Record<AlertGroup, string>>; lastDate: string }>();

  for (const alert of alerts) {
    const key = routeKey(alert.origem, alert.destino);
    const group = normalizeAlertGroup(alert.grupo);
    const current = rows.get(key) || {
      key,
      origin: alert.origem,
      destination: alert.destino,
      groupDays: {},
      status: 'Nunca enviada',
      total: 0,
      minDays: minDaysByRoute.get(key) ?? 10,
      programs: [],
      lastByGroup: {},
      lastDate: alert.data
    };
    current.total += 1;
    for (const program of detectPrograms(alert.programa || '')) {
      if (!current.programs.includes(program)) current.programs.push(program);
    }
    if (group && (!current.lastByGroup[group] || alert.data > current.lastByGroup[group]!)) current.lastByGroup[group] = alert.data;
    if (alert.data > current.lastDate) current.lastDate = alert.data;
    rows.set(key, current);
  }

  return [...rows.values()].map((row) => {
    for (const group of ALERT_GROUPS) {
      row.groupDays[group] = row.lastByGroup[group] ? daysBetween(row.lastByGroup[group]!, now) : null;
    }
    const overallDays = daysBetween(row.lastDate, now);
    row.status = statusFor(overallDays, row.minDays);
    const { lastByGroup: _lastByGroup, lastDate: _lastDate, ...publicRow } = row;
    return publicRow;
  }).sort((a, b) => a.key.localeCompare(b.key));
}
```

- [ ] **Step 5: Run test and verify it passes**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test -- src/lib/alerts/dashboard-analytics.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/lib/alerts/types.ts src/lib/alerts/dashboard-analytics.ts src/lib/alerts/dashboard-analytics.test.ts
git commit -m "feat: add dashboard analytics helpers"
```

---

### Task 2: Top Bar Theme Toggle And Canvas Preview Grid

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/generator/AlertGenerator.tsx`
- Modify: `src/components/common/ThemeToggle.tsx`

**Interfaces:**
- Consumes: existing `ThemeToggle`.
- Produces:
  - theme toggle displayed in the top navigation.
  - preview grid with max two canvas cards per row on wide screens.

- [ ] **Step 1: Move ThemeToggle into top navigation**

Modify `src/app/page.tsx`:

```tsx
import { ThemeToggle } from '@/components/common/ThemeToggle';
```

Inside `<nav>`, keep the tab buttons and add:

```tsx
<div className="ml-auto">
  <ThemeToggle />
</div>
```

The top-level button row should remain:

```tsx
<div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-2">
```

- [ ] **Step 2: Remove any duplicate theme placement**

Search:

```powershell
rg -n "ThemeToggle" src
```

Expected after the move:

```txt
src/app/page.tsx
src/components/common/ThemeToggle.tsx
```

- [ ] **Step 3: Limit preview grid to two columns**

In `src/components/generator/AlertGenerator.tsx`, find the preview column wrapper around `CANVAS_THEMES.map`.

Use this class shape:

```tsx
<div className="grid min-w-0 content-start gap-4 xl:grid-cols-2">
```

Do not use `2xl:grid-cols-3` or any wider three/four-column layout.

- [ ] **Step 4: Verify build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/app/page.tsx src/components/generator/AlertGenerator.tsx src/components/common/ThemeToggle.tsx
git commit -m "feat: refine top bar and preview layout"
```

---

### Task 3: Shared Period Filter And Dashboard Tables

**Files:**
- Create: `src/components/dashboard/PeriodFilterBar.tsx`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`
- Modify: `src/components/dashboard/StatsPanels.tsx`
- Modify: `src/components/dashboard/HistoryTable.tsx`
- Create: `src/components/dashboard/OperatorStatsTable.tsx`

**Interfaces:**
- Consumes:
  - `PeriodFilter`
  - `filterAlertsByPeriod`
  - `buildDashboardStats`
  - `buildOperatorStats`
- Produces:
  - shared dashboard period controls.
  - group stats as table.
  - operator history table.
  - history table filtered by shared period.

- [ ] **Step 1: Create period filter component**

Create `src/components/dashboard/PeriodFilterBar.tsx`:

```tsx
'use client';

import type { PeriodFilter } from '@/lib/alerts/types';

const inputClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function PeriodFilterBar({ value, onChange }: { value: PeriodFilter; onChange(value: PeriodFilter): void }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
        Periodo
        <select className={inputClass} value={value.mode} onChange={(event) => onChange({ ...value, mode: event.target.value as PeriodFilter['mode'] })}>
          <option value="today">Hoje</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="all">Todos</option>
          <option value="custom">Intervalo</option>
        </select>
      </label>
      {value.mode === 'custom' ? (
        <>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
            Inicio
            <input className={inputClass} type="date" value={value.startDate || ''} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">
            Fim
            <input className={inputClass} type="date" value={value.endDate || ''} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
          </label>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Wire shared period state in dashboard shell**

In `AlertsDashboard.tsx`, add:

```tsx
import { filterAlertsByPeriod } from '@/lib/alerts/dashboard-analytics';
import type { PeriodFilter } from '@/lib/alerts/types';
import { PeriodFilterBar } from './PeriodFilterBar';
import { OperatorStatsTable } from './OperatorStatsTable';
```

Add state:

```tsx
const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({ mode: 'today' });
const periodAlerts = filterAlertsByPeriod(alerts, periodFilter);
```

Render `PeriodFilterBar` in the dashboard header:

```tsx
<PeriodFilterBar value={periodFilter} onChange={setPeriodFilter} />
```

Pass `periodAlerts` and `periodFilter`:

```tsx
<StatsPanels alerts={alerts} periodAlerts={periodAlerts} routeSettings={routeSettings} />
<OperatorStatsTable alerts={alerts} periodAlerts={periodAlerts} />
<HistoryTable alerts={alerts} periodFilter={periodFilter} onUpdate={updateAlert} onDelete={deleteAlert} onLoadSnapshot={onLoadSnapshot} />
```

- [ ] **Step 3: Convert group stats to table**

Modify `StatsPanels.tsx` props:

```ts
export function StatsPanels({ alerts, periodAlerts, routeSettings }: { alerts: AlertRecord[]; periodAlerts: AlertRecord[]; routeSettings: RouteSetting[] })
```

Keep top cards for high-level numbers. Replace group cards with table:

```tsx
<table className="w-full min-w-[760px] text-left text-sm">
  <thead className="text-xs uppercase text-zinc-500">
    <tr>
      <th className="py-2 pr-3">Grupo</th>
      <th className="py-2 pr-3">Gerados hoje</th>
      <th className="py-2 pr-3">Enviados hoje</th>
      <th className="py-2 pr-3">Gerados total</th>
      <th className="py-2 pr-3">Enviados total</th>
      <th className="py-2">Meta hoje</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(stats.groups).map(([group, item]) => (
      <tr key={group} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
        <td className="py-2 pr-3 font-bold">{group}</td>
        <td className="py-2 pr-3">{item.generatedToday}</td>
        <td className="py-2 pr-3">{item.sentToday}</td>
        <td className="py-2 pr-3">{item.total}</td>
        <td className="py-2 pr-3">{periodAlerts.filter((alert) => alert.grupo === group && alert.enviado).length}</td>
        <td className="py-2">{item.goal}</td>
      </tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 4: Add operator stats table**

Create `src/components/dashboard/OperatorStatsTable.tsx`:

```tsx
'use client';

import { buildOperatorStats } from '@/lib/alerts/dashboard-analytics';
import type { AlertRecord } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';

function formatLastAlert(value: string) {
  if (!value) return '-';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function OperatorStatsTable({ alerts, periodAlerts }: { alerts: AlertRecord[]; periodAlerts: AlertRecord[] }) {
  const rows = buildOperatorStats(alerts, periodAlerts);
  return (
    <section className={panelClass}>
      <h2 className="text-lg font-black">Historico por operador</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-3">Operador</th>
              <th className="py-2 pr-3">Gerados hoje</th>
              <th className="py-2 pr-3">Enviados hoje</th>
              <th className="py-2 pr-3">Gerados no periodo</th>
              <th className="py-2 pr-3">Enviados no periodo</th>
              <th className="py-2">Ultimo alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.operator} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
                <td className="py-2 pr-3 font-bold">{row.operator}</td>
                <td className="py-2 pr-3">{row.generatedToday}</td>
                <td className="py-2 pr-3">{row.sentToday}</td>
                <td className="py-2 pr-3">{row.generatedInPeriod}</td>
                <td className="py-2 pr-3">{row.sentInPeriod}</td>
                <td className="py-2">{formatLastAlert(row.lastAlert)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Use shared period in history**

Modify `HistoryTable.tsx` props:

```ts
periodFilter: PeriodFilter;
```

Import and use:

```ts
import { filterAlertsByPeriod } from '@/lib/alerts/dashboard-analytics';
```

Remove local `period` state and replace:

```ts
const visibleAlerts = useMemo(() => {
  return filterAlertsByPeriod(alerts, periodFilter)
    .filter((alert) => group === 'all' || normalizeAlertGroup(alert.grupo) === group)
    .filter((alert) => matchesAlertSearch(alert, search))
    .sort((a, b) => `${b.data}-${b.created_at || ''}`.localeCompare(`${a.data}-${a.created_at || ''}`));
}, [alerts, group, periodFilter, search]);
```

Remove the local `Hoje/Todos` select from the history controls.

- [ ] **Step 6: Verify build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/components/dashboard src/lib/alerts/types.ts
git commit -m "feat: add dashboard period and operator tables"
```

---

### Task 4: Program Stats And Route Matrix Panels

**Files:**
- Create: `src/components/dashboard/ProgramStatsPanel.tsx`
- Create: `src/components/dashboard/RouteMatrixPanel.tsx`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`
- Optionally remove: `src/components/dashboard/RouteSuggestions.tsx` if fully replaced.

**Interfaces:**
- Consumes:
  - `buildProgramStats`
  - `buildRouteMatrixRows`
  - `PeriodFilter`
  - `/api/route-settings`
- Produces:
  - loyalty program CSS bar panel.
  - route matrix table with search, sort, status, and inline `min_days`.

- [ ] **Step 1: Create program stats panel**

Create `src/components/dashboard/ProgramStatsPanel.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { buildProgramStats, filterAlertsByPeriod } from '@/lib/alerts/dashboard-analytics';
import type { AlertRecord, PeriodFilter } from '@/lib/alerts/types';

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const selectClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

export function ProgramStatsPanel({ alerts, sharedPeriod }: { alerts: AlertRecord[]; sharedPeriod: PeriodFilter }) {
  const [mode, setMode] = useState<'shared' | 'today' | '7d' | '30d' | 'all'>('shared');
  const period = mode === 'shared' ? sharedPeriod : { mode };
  const stats = useMemo(() => buildProgramStats(filterAlertsByPeriod(alerts, period)), [alerts, period]);

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Por programa de fidelidade</h2>
          <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Volume detectado no campo programa.</p>
        </div>
        <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
          <option value="shared">Periodo da dashboard</option>
          <option value="today">Hoje</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="all">Todos</option>
        </select>
      </div>
      <div className="mt-4 grid gap-2">
        {stats.length ? stats.map((item) => (
          <div key={item.name} className="grid grid-cols-[150px_1fr_48px] items-center gap-3 text-sm">
            <span className="font-bold">{item.name}</span>
            <span className="h-2 rounded-full bg-zinc-100 dark:bg-[var(--ecm-blue-bg)]">
              <span className="block h-2 rounded-full bg-blue-600 dark:bg-[var(--ecm-gold)]" style={{ width: `${item.percentage}%` }} />
            </span>
            <span className="text-right">{item.count}</span>
          </div>
        )) : <p className="text-sm text-zinc-500">Ainda sem dados suficientes.</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create route matrix panel**

Create `src/components/dashboard/RouteMatrixPanel.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { buildRouteMatrixRows } from '@/lib/alerts/dashboard-analytics';
import { normalizeAlertText } from '@/lib/alerts/normalization';
import type { AlertRecord, RouteMatrixRow, RouteSetting } from '@/lib/alerts/types';

const GROUP_COLUMNS = [
  ['Go Miles Club', 'GMC'],
  ['Executiva com Milhas', 'ECM'],
  ['FirstClass', 'FC'],
  ['Experiências Ao Vivo', 'EAV'],
  ['Milhas Ao Vivo', 'MAV']
] as const;

const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function formatDays(value: number | null | undefined) {
  return value === null || value === undefined ? '-' : `${value}d`;
}

function statusClass(status: RouteMatrixRow['status']) {
  if (status === 'Vencida') return 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300';
  if (status === 'Atenção') return 'border-amber-300 text-amber-700 dark:border-[var(--ecm-gold)] dark:text-[var(--ecm-gold)]';
  return 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300';
}

export function RouteMatrixPanel({ alerts, routeSettings, onRouteSettingSaved }: { alerts: AlertRecord[]; routeSettings: RouteSetting[]; onRouteSettingSaved(setting: RouteSetting): void }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'stale' | 'recent' | 'az' | 'count'>('stale');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [saving, setSaving] = useState('');
  const rows = useMemo(() => {
    const term = normalizeAlertText(search);
    const base = buildRouteMatrixRows(alerts, routeSettings).filter((row) => !term || normalizeAlertText(`${row.key} ${row.programs.join(' ')}`).includes(term));
    return base.sort((a, b) => {
      const maxA = Math.max(...Object.values(a.groupDays).map((value) => value ?? 9999));
      const maxB = Math.max(...Object.values(b.groupDays).map((value) => value ?? 9999));
      if (sort === 'stale') return maxB - maxA;
      if (sort === 'recent') return maxA - maxB;
      if (sort === 'count') return b.total - a.total;
      return a.key.localeCompare(b.key);
    });
  }, [alerts, routeSettings, search, sort]);

  async function saveMinDays(row: RouteMatrixRow, minDays: number) {
    setSaving(row.key);
    try {
      const response = await fetch('/api/route-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_key: row.key, min_days: minDays })
      });
      const payload = (await response.json()) as { setting?: RouteSetting; error?: string };
      if (!response.ok || !payload.setting) throw new Error(payload.error || 'Falha ao salvar rota.');
      onRouteSettingSaved(payload.setting);
    } finally {
      setSaving('');
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Rotas e ultima busca</h2>
          <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Ultima busca por grupo e status de recencia.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className={inputClass} placeholder="Buscar rota ou programa" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="stale">Mais vencida primeiro</option>
            <option value="recent">Mais recente primeiro</option>
            <option value="az">A-Z</option>
            <option value="count">Mais enviadas</option>
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-3">Rota</th>
              {GROUP_COLUMNS.map(([, label]) => <th key={label} className="py-2 pr-3">{label}</th>)}
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-zinc-100 dark:border-[var(--ecm-blue-border)]">
                <td className="py-2 pr-3 font-bold">{row.origin} - {row.destination}</td>
                {GROUP_COLUMNS.map(([group]) => <td key={group} className="py-2 pr-3">{formatDays(row.groupDays[group])}</td>)}
                <td className="py-2 pr-3"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(row.status)}`}>{row.status}</span></td>
                <td className="py-2 pr-3">{row.total}x</td>
                <td className="py-2">
                  {openKey === row.key ? (
                    <input className={`${inputClass} w-20`} type="number" min={1} max={365} defaultValue={row.minDays} disabled={saving === row.key} onBlur={(event) => void saveMinDays(row, Number(event.target.value) || 10)} />
                  ) : (
                    <button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setOpenKey(row.key)}>Editar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire panels into dashboard**

Modify `AlertsDashboard.tsx`:

```tsx
import { ProgramStatsPanel } from './ProgramStatsPanel';
import { RouteMatrixPanel } from './RouteMatrixPanel';
```

Replace or remove the old `RouteSuggestions` render:

```tsx
<ProgramStatsPanel alerts={alerts} sharedPeriod={periodFilter} />
<RouteMatrixPanel alerts={alerts} routeSettings={routeSettings} onRouteSettingSaved={saveRouteSetting} />
```

Keep `RouteSuggestions.tsx` only if still used elsewhere. If it is unused, delete it and remove its import.

- [ ] **Step 4: Verify tests and build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test -- src/lib/alerts/dashboard-analytics.test.ts
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/components/dashboard src/lib/alerts/dashboard-analytics.ts src/lib/alerts/dashboard-analytics.test.ts
git commit -m "feat: add program and route dashboard panels"
```

---

### Task 5: WhatsApp Summary Domain Helpers

**Files:**
- Create: `src/lib/alerts/summary.ts`
- Test: `src/lib/alerts/summary.test.ts`

**Interfaces:**
- Produces:
  - `type AlertSummaryDraft`
  - `type AlertSummaryProgram`
  - `type AlertSummaryItem`
  - `COUNTRY_FLAGS`
  - `createSummaryDraftFromAlerts(alerts: AlertRecord[], date?: string, profile?: string): AlertSummaryDraft`
  - `validateSummaryItem(item: AlertSummaryItem): string[]`
  - `generateWhatsAppSummary(draft: AlertSummaryDraft): string`

- [ ] **Step 1: Write failing summary tests**

Create `src/lib/alerts/summary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { AlertRecord } from './types';
import { createSummaryDraftFromAlerts, generateWhatsAppSummary, validateSummaryItem } from './summary';

function alert(overrides: Partial<AlertRecord>): AlertRecord {
  return {
    id: overrides.id || crypto.randomUUID(),
    origem: overrides.origem || 'Cairo',
    destino: overrides.destino || 'Tokyo',
    programa: overrides.programa || '80K Milhas TAP',
    cia: overrides.cia || 'EGYPTAIR',
    grupo: overrides.grupo || 'Executiva com Milhas',
    data: overrides.data || '2026-07-31',
    autor: overrides.autor || 'Lucas',
    enviado: overrides.enviado ?? true
  };
}

describe('alert summary generation', () => {
  it('generates WhatsApp text grouped by mileage program', () => {
    const text = generateWhatsAppSummary({
      date: '31/07',
      profile: '@executivacommilhas',
      programs: [
        {
          id: 'tap',
          name: 'TAP',
          alerts: [
            { id: '1', origin: 'Cairo', destination: 'Tokyo', destinationCountry: 'Japao', destinationFlag: '🇯🇵', airlines: ['EGYPTAIR'], cabin: '', milesType: 'fixed', miles: '80K', minimumMiles: '', maximumMiles: '', displayProgram: 'TAP', notes: '' },
            { id: '2', origin: 'Zurique', destination: 'Bangkok', destinationCountry: 'Tailandia', destinationFlag: '🇹🇭', airlines: ['SWISS', 'THAI AIRWAYS'], cabin: '', milesType: 'fixed', miles: '80K', minimumMiles: '', maximumMiles: '', displayProgram: 'TAP', notes: '' }
          ]
        },
        {
          id: 'avios',
          name: 'AVIOS',
          alerts: [
            { id: '3', origin: 'Doha', destination: 'Bogotá', destinationCountry: 'Colombia', destinationFlag: '🇨🇴', airlines: ['QATAR'], cabin: '', milesType: 'range', miles: '', minimumMiles: '70K', maximumMiles: '94.5K', displayProgram: 'Avios Qatar', notes: '' }
          ]
        }
      ]
    });

    expect(text).toBe('RESUMO ALERTAS (31/07)\\n\\nMilhas TAP\\nCairo - Tokyo🇯🇵\\nEGYPTAIR\\n80K Milhas TAP\\n\\nZurique - Bangkok🇹🇭\\nSWISS ou THAI AIRWAYS\\n80K Milhas TAP\\n————————————\\nMilhas AVIOS\\nDoha - Bogotá🇨🇴\\nQATAR\\n70K a 94.5K Milhas Avios Qatar\\n\\n@executivacommilhas');
  });

  it('validates required summary fields', () => {
    expect(validateSummaryItem({ id: 'bad', origin: '', destination: '', destinationCountry: '', destinationFlag: '', airlines: [], cabin: '', milesType: 'fixed', miles: '', minimumMiles: '', maximumMiles: '', displayProgram: '', notes: '' })).toEqual([
      'origem',
      'destino',
      'bandeira',
      'companhia',
      'milhas',
      'programa exibido'
    ]);
  });

  it('creates an editable draft from Supabase alerts', () => {
    const draft = createSummaryDraftFromAlerts([
      alert({ id: '1', origem: 'Cairo', destino: 'Tokyo', cia: 'EGYPTAIR', programa: '80K Milhas TAP' }),
      alert({ id: '2', origem: 'Doha', destino: 'Bogotá', cia: 'QATAR', programa: '70K a 94.5K Milhas Avios Qatar' })
    ], '31/07', '@executivacommilhas');

    expect(draft.programs.map((program) => program.name)).toEqual(['TAP', 'Avios Qatar']);
    expect(draft.programs[0].alerts[0]).toMatchObject({ origin: 'Cairo', destination: 'Tokyo', airlines: ['EGYPTAIR'], miles: '80K', displayProgram: 'TAP' });
    expect(draft.programs[1].alerts[0]).toMatchObject({ minimumMiles: '70K', maximumMiles: '94.5K', displayProgram: 'Avios Qatar' });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test -- src/lib/alerts/summary.test.ts
```

Expected: FAIL because `src/lib/alerts/summary.ts` does not exist.

- [ ] **Step 3: Implement summary helpers**

Create `src/lib/alerts/summary.ts`:

```ts
import type { AlertRecord } from './types';
import { detectPrograms } from './dashboard-analytics';

export interface AlertSummaryDraft {
  date: string;
  profile: string;
  programs: AlertSummaryProgram[];
}

export interface AlertSummaryProgram {
  id: string;
  name: string;
  alerts: AlertSummaryItem[];
}

export interface AlertSummaryItem {
  id: string;
  origin: string;
  destination: string;
  destinationCountry: string;
  destinationFlag: string;
  airlines: string[];
  cabin: string;
  milesType: 'fixed' | 'range';
  miles: string;
  minimumMiles: string;
  maximumMiles: string;
  displayProgram: string;
  notes: string;
}

export const COUNTRY_FLAGS = [
  { country: 'Japao', flag: '🇯🇵' },
  { country: 'Tailandia', flag: '🇹🇭' },
  { country: 'Colombia', flag: '🇨🇴' },
  { country: 'Estados Unidos', flag: '🇺🇸' },
  { country: 'Portugal', flag: '🇵🇹' },
  { country: 'Espanha', flag: '🇪🇸' },
  { country: 'Franca', flag: '🇫🇷' },
  { country: 'Alemanha', flag: '🇩🇪' },
  { country: 'Italia', flag: '🇮🇹' },
  { country: 'Mexico', flag: '🇲🇽' }
];

const MILES_RE = /\\b\\d+[\\d.,]*\\s*K?\\b/gi;

function formatDefaultDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function splitAirlines(value: string) {
  return value.split(/\\s+ou\\s+/i).map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function milesParts(value: string) {
  const matches = value.match(MILES_RE) || [];
  if (matches.length >= 2 && /\\s+a\\s+/i.test(value)) return { milesType: 'range' as const, miles: '', minimumMiles: matches[0].trim(), maximumMiles: matches[1].trim() };
  return { milesType: 'fixed' as const, miles: matches[0]?.trim() || '', minimumMiles: '', maximumMiles: '' };
}

function displayProgramFromText(value: string) {
  const found = detectPrograms(value);
  return found[0] || '';
}

export function validateSummaryItem(item: AlertSummaryItem) {
  const missing: string[] = [];
  if (!item.origin.trim()) missing.push('origem');
  if (!item.destination.trim()) missing.push('destino');
  if (!item.destinationFlag.trim()) missing.push('bandeira');
  if (!item.airlines.length) missing.push('companhia');
  if (item.milesType === 'fixed' && !item.miles.trim()) missing.push('milhas');
  if (item.milesType === 'range' && (!item.minimumMiles.trim() || !item.maximumMiles.trim())) missing.push('milhas');
  if (!item.displayProgram.trim()) missing.push('programa exibido');
  return missing;
}

function alertText(item: AlertSummaryItem) {
  const airline = item.airlines.map((name) => name.toUpperCase()).join(' ou ');
  const airlineLine = item.cabin.trim() ? `${airline}(${item.cabin.trim()})` : airline;
  const milesLine = item.milesType === 'range'
    ? `${item.minimumMiles} a ${item.maximumMiles} Milhas ${item.displayProgram}`
    : `${item.miles} Milhas ${item.displayProgram}`;
  return `${item.origin} - ${item.destination}${item.destinationFlag}\\n${airlineLine}\\n${milesLine}`;
}

export function generateWhatsAppSummary(draft: AlertSummaryDraft) {
  const groups = draft.programs
    .map((program) => {
      const complete = program.alerts.filter((item) => validateSummaryItem(item).length === 0);
      if (!complete.length) return '';
      return [`Milhas ${program.name}`, ...complete.map(alertText)].join('\\n');
    })
    .filter(Boolean);
  return [`RESUMO ALERTAS (${draft.date})`, groups.join('\\n————————————\\n'), draft.profile].filter(Boolean).join('\\n\\n');
}

export function createSummaryDraftFromAlerts(alerts: AlertRecord[], date = formatDefaultDate(), profile = '@executivacommilhas'): AlertSummaryDraft {
  const programs = new Map<string, AlertSummaryProgram>();
  for (const alert of alerts) {
    const displayProgram = displayProgramFromText(alert.programa || '');
    if (!displayProgram) continue;
    const program = programs.get(displayProgram) || { id: slug(displayProgram), name: displayProgram, alerts: [] };
    const miles = milesParts(alert.programa || '');
    program.alerts.push({
      id: alert.id,
      origin: alert.origem,
      destination: alert.destino,
      destinationCountry: '',
      destinationFlag: '',
      airlines: splitAirlines(alert.cia || ''),
      cabin: '',
      displayProgram,
      notes: alert.obs || '',
      ...miles
    });
    programs.set(displayProgram, program);
  }
  return { date, profile, programs: [...programs.values()] };
}
```

- [ ] **Step 4: Run summary tests and verify pass**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test -- src/lib/alerts/summary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/lib/alerts/summary.ts src/lib/alerts/summary.test.ts
git commit -m "feat: add whatsapp summary helpers"
```

---

### Task 6: Alert Summary Builder UI

**Files:**
- Create: `src/components/dashboard/AlertSummaryBuilder.tsx`
- Modify: `src/components/dashboard/AlertsDashboard.tsx`

**Interfaces:**
- Consumes:
  - `AlertSummaryDraft`
  - `COUNTRY_FLAGS`
  - `createSummaryDraftFromAlerts`
  - `generateWhatsAppSummary`
  - `validateSummaryItem`
- Produces:
  - collapsible dashboard module to generate, edit, save, load, and copy WhatsApp summaries.

- [ ] **Step 1: Create summary builder component**

Create `src/components/dashboard/AlertSummaryBuilder.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, createSummaryDraftFromAlerts, generateWhatsAppSummary, validateSummaryItem, type AlertSummaryDraft, type AlertSummaryItem } from '@/lib/alerts/summary';
import type { AlertRecord } from '@/lib/alerts/types';

const STORAGE_KEY = 'ecm_alert_summary_draft';
const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';

function updateItem(item: AlertSummaryItem, patch: Partial<AlertSummaryItem>) {
  return { ...item, ...patch };
}

export function AlertSummaryBuilder({ alerts }: { alerts: AlertRecord[] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [draft, setDraft] = useState<AlertSummaryDraft>(() => createSummaryDraftFromAlerts(alerts));
  const [message, setMessage] = useState('');
  const output = useMemo(() => generateWhatsAppSummary(draft), [draft]);
  const incompleteCount = draft.programs.flatMap((program) => program.alerts).filter((item) => validateSummaryItem(item).length > 0).length;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setDraft(JSON.parse(raw) as AlertSummaryDraft); } catch {}
    }
  }, []);

  function regenerate() {
    setDraft(createSummaryDraftFromAlerts(alerts, draft.date, draft.profile));
    setMessage('Resumo regenerado pelo historico.');
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setMessage('Rascunho salvo.');
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
    setDraft({ date: draft.date, profile: draft.profile, programs: [] });
    setMessage('Rascunho limpo.');
  }

  async function copyText() {
    if (!output || !draft.programs.some((program) => program.alerts.some((item) => validateSummaryItem(item).length === 0))) {
      setMessage('Nao ha alertas completos para copiar.');
      return;
    }
    await navigator.clipboard.writeText(output);
    setMessage('Resumo copiado.');
  }

  function patchItem(programId: string, itemId: string, patch: Partial<AlertSummaryItem>) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => program.id === programId ? {
        ...program,
        alerts: program.alerts.map((item) => item.id === itemId ? updateItem(item, patch) : item)
      } : program)
    }));
  }

  function removeItem(programId: string, itemId: string) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => program.id === programId ? { ...program, alerts: program.alerts.filter((item) => item.id !== itemId) } : program)
    }));
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="text-left text-lg font-black" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? '+' : '-'} Gerador de resumo WhatsApp
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={regenerate}>Regenerar pelo historico</button>
          <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={saveDraft}>Salvar rascunho</button>
          <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={clearDraft}>Limpar</button>
          <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-bold text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={() => void copyText()}>Copiar</button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-zinc-500">{message}</p> : null}
      {incompleteCount ? <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-[var(--ecm-gold)]">{incompleteCount} alerta(s) incompleto(s) ignorados no texto final.</p> : null}
      {!collapsed ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-zinc-500">Data<input className={inputClass} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label className="grid gap-1 text-xs font-semibold text-zinc-500">Perfil<input className={inputClass} value={draft.profile} onChange={(event) => setDraft((current) => ({ ...current, profile: event.target.value }))} /></label>
            </div>
            {draft.programs.map((program) => (
              <div key={program.id} className="grid gap-3 rounded-md border border-zinc-200 p-3 dark:border-[var(--ecm-blue-border)]">
                <input className={`${inputClass} font-bold`} value={program.name} onChange={(event) => setDraft((current) => ({ ...current, programs: current.programs.map((item) => item.id === program.id ? { ...item, name: event.target.value } : item) }))} />
                {program.alerts.map((item) => {
                  const missing = validateSummaryItem(item);
                  return (
                    <div key={item.id} className={`grid gap-2 rounded-md border p-3 ${missing.length ? 'border-amber-300 dark:border-[var(--ecm-gold)]' : 'border-zinc-200 dark:border-[var(--ecm-blue-border)]'}`}>
                      {missing.length ? <p className="text-xs font-bold text-amber-700 dark:text-[var(--ecm-gold)]">Falta: {missing.join(', ')}</p> : null}
                      <div className="grid gap-2 md:grid-cols-2">
                        <input className={inputClass} value={item.origin} placeholder="Origem" onChange={(event) => patchItem(program.id, item.id, { origin: event.target.value })} />
                        <input className={inputClass} value={item.destination} placeholder="Destino" onChange={(event) => patchItem(program.id, item.id, { destination: event.target.value })} />
                        <select className={inputClass} value={item.destinationCountry} onChange={(event) => {
                          const match = COUNTRY_FLAGS.find((country) => country.country === event.target.value);
                          patchItem(program.id, item.id, { destinationCountry: event.target.value, destinationFlag: match?.flag || item.destinationFlag });
                        }}>
                          <option value="">Pais</option>
                          {COUNTRY_FLAGS.map((country) => <option key={country.country} value={country.country}>{country.country}</option>)}
                        </select>
                        <input className={inputClass} value={item.destinationFlag} placeholder="Bandeira" onChange={(event) => patchItem(program.id, item.id, { destinationFlag: event.target.value })} />
                        <input className={inputClass} value={item.airlines.join(' ou ')} placeholder="Companhias" onChange={(event) => patchItem(program.id, item.id, { airlines: event.target.value.split(/\s+ou\s+/i).map((value) => value.trim()).filter(Boolean) })} />
                        <input className={inputClass} value={item.cabin} placeholder="Cabine" onChange={(event) => patchItem(program.id, item.id, { cabin: event.target.value })} />
                        <select className={inputClass} value={item.milesType} onChange={(event) => patchItem(program.id, item.id, { milesType: event.target.value as AlertSummaryItem['milesType'] })}>
                          <option value="fixed">Valor fixo</option>
                          <option value="range">Faixa</option>
                        </select>
                        <input className={inputClass} value={item.displayProgram} placeholder="Programa exibido" onChange={(event) => patchItem(program.id, item.id, { displayProgram: event.target.value })} />
                        {item.milesType === 'fixed' ? (
                          <input className={inputClass} value={item.miles} placeholder="Milhas" onChange={(event) => patchItem(program.id, item.id, { miles: event.target.value })} />
                        ) : (
                          <>
                            <input className={inputClass} value={item.minimumMiles} placeholder="Minimo" onChange={(event) => patchItem(program.id, item.id, { minimumMiles: event.target.value })} />
                            <input className={inputClass} value={item.maximumMiles} placeholder="Maximo" onChange={(event) => patchItem(program.id, item.id, { maximumMiles: event.target.value })} />
                          </>
                        )}
                      </div>
                      <button type="button" className="justify-self-start rounded-md border border-red-300 px-2 py-1 text-xs font-bold text-red-700 dark:border-red-800 dark:text-red-300" onClick={() => removeItem(program.id, item.id)}>Excluir alerta</button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <textarea className="min-h-[520px] w-full resize-y rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]" value={output} readOnly />
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Wire summary builder into dashboard**

Modify `AlertsDashboard.tsx`:

```tsx
import { AlertSummaryBuilder } from './AlertSummaryBuilder';
```

Render after `HistoryTable`:

```tsx
<AlertSummaryBuilder alerts={periodAlerts} />
```

- [ ] **Step 3: Verify build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/components/dashboard/AlertSummaryBuilder.tsx src/components/dashboard/AlertsDashboard.tsx
git commit -m "feat: add alert summary builder"
```

---

### Task 7: Final Verification And Cleanup

**Files:**
- Modify only files needed to fix verification issues.

**Interfaces:**
- Produces a verified dashboard release with no push.

- [ ] **Step 1: Run full tests**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
$env:Path += ";C:\Projects\node20"; npm run build
```

Expected: build succeeds and reports `.env.local` when present.

- [ ] **Step 3: Run static searches**

Run:

```powershell
rg -n "@supabase/supabase-js" src/app src/components src/lib
rg -n "Experiencias Ao Vivo" src
rg -n "dark:bg-zinc-950|dark:bg-zinc-900|dark:border-zinc-800|dark:bg-zinc-100|dark:text-zinc-900" src
```

Expected:

- Supabase import only in `src/lib/server/supabase.ts`.
- `Experiencias Ao Vivo` only appears as an alias in `src/lib/alerts/types.ts`, if at all.
- No dominant dark zinc classes from the old palette.

- [ ] **Step 4: Manual dashboard smoke check**

Run local dev server:

```powershell
$env:Path += ";C:\Projects\node20"; npm run dev
```

Manual checks:

- top bar has tabs plus theme toggle;
- dashboard loads Supabase rows;
- period filter changes history/operator/program panels;
- group stats render as a table;
- operator table renders rows;
- program panel renders bars;
- route matrix search, sort, and min-days edit work;
- summary builder regenerates from filtered Supabase data;
- summary builder allows manual field edits;
- copy button copies WhatsApp text only from complete alerts;
- generator preview shows at most two canvas cards per row on wide screens.

- [ ] **Step 5: Commit final fixes if any**

If verification required fixes, commit them:

```powershell
git status --short
git add src/lib/alerts/dashboard-analytics.ts src/lib/alerts/dashboard-analytics.test.ts src/lib/alerts/summary.ts src/lib/alerts/summary.test.ts src/components/dashboard src/components/generator/AlertGenerator.tsx src/app/page.tsx
git commit -m "fix: polish dashboard analytics integration"
```

Adjust the concrete `git add` file list only if `git status --short` shows a smaller or larger set of implementation files. If no fixes were needed, do not create an empty commit.

---

## Execution Order

1. Task 1: shared analytics helpers.
2. Task 2: top bar and preview grid.
3. Task 3: period filter, group table, operator table, shared history period.
4. Task 4: program panel and route matrix.
5. Task 5: summary domain helpers.
6. Task 6: summary builder UI.
7. Task 7: final verification and cleanup.

## Risk Notes

- The route matrix depends on historical `grupo` values. Always pass them through `normalizeAlertGroup`.
- Summary generation cannot infer flags safely from current Supabase rows. Missing flags must stay visible and incomplete until the operator fills them.
- Program detection is keyword-based and should preserve the HTML behavior; avoid ML or fuzzy matching in this step.
- The first implementation keeps period filtering client-side. If Supabase history grows too large, add server-side date filters later.

## Self-Review

- Spec coverage: period filter, top bar, two-column canvas grid, group table, operator table, program analytics, route matrix, and summary builder are each mapped to tasks.
- Placeholder scan: no `TBD`, `TODO`, or undefined task outputs remain.
- Type consistency: `PeriodFilter`, `ProgramStat`, `OperatorStat`, `RouteMatrixRow`, `AlertSummaryDraft`, `AlertSummaryProgram`, and `AlertSummaryItem` are defined before use.
