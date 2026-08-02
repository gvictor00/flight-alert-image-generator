# Bulk Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Gerar para todos os temas" button to `AlertImageForm` that renders every brand theme sequentially, packages the PNGs into a ZIP, and triggers a browser download.

**Architecture:** All new logic lives in the client component `alert-image-form.tsx`. The existing `/api/render` endpoint is called once per theme with no server-side changes. `jszip` runs in the browser to assemble the ZIP from collected blobs.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, jszip, existing `/api/render` POST endpoint.

---

> **Note:** This project has no automated test suite (`CLAUDE.md`: "No test suite exists"). TDD steps are replaced with dev-server smoke tests at the end of the plan.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `jszip` runtime dep + `@types/jszip` dev dep |
| `src/components/forms/alert-image-form.tsx` | Modify | New state, helpers, `handleBulkRender`, button, result messages |

---

### Task 1: Install jszip

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime and type packages**

```bash
npm install jszip
npm install --save-dev @types/jszip
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('jszip'); console.log('jszip ok')"
```

Expected output: `jszip ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jszip for client-side ZIP assembly"
```

---

### Task 2: Add helpers and state to AlertImageForm

**Files:**
- Modify: `src/components/forms/alert-image-form.tsx`

- [ ] **Step 1: Add the `jszip` import at the top of the file**

After the existing imports block (around line 15), add:

```typescript
import JSZip from 'jszip';
```

- [ ] **Step 2: Add two file-naming helper functions**

Add these two functions directly above the `AlertImageForm` function declaration (after the `fromTextarea` and `updateJourneyBlock` helpers, before `export function AlertImageForm()`):

```typescript
function sanitizeForFilename(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildBatchTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
```

- [ ] **Step 3: Add three new state variables inside `AlertImageForm`**

After the existing `const [isRendering, setIsRendering] = useState(false);` line, add:

```typescript
const [isBulkRendering, setIsBulkRendering] = useState(false);
const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
const [bulkResult, setBulkResult] = useState<{ count: number; errors: number } | null>(null);
```

- [ ] **Step 4: Add the `handleBulkRender` function**

Add this function directly after the `handleRender` function (after its closing `}`):

```typescript
async function handleBulkRender(): Promise<void> {
  setErrorMessage(null);
  setRenderResult(null);
  setBulkResult(null);
  setIsBulkRendering(true);

  const total = brandThemes.length;
  const timestamp = buildBatchTimestamp();
  const route = sanitizeForFilename(payload.outbound.route);
  const blobs: Array<{ name: string; blob: Blob }> = [];

  for (let i = 0; i < brandThemes.length; i++) {
    const theme = brandThemes[i];
    setBulkProgress({ current: i + 1, total });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, themeKey: theme.key }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const themeName = sanitizeForFilename(theme.name);
      blobs.push({ name: `${route}-${timestamp}-${themeName}.png`, blob });
    } catch (error) {
      console.error(`Bulk render failed for theme "${theme.name}":`, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  setIsBulkRendering(false);
  setBulkProgress(null);

  const errors = total - blobs.length;

  if (blobs.length === 0) {
    setBulkResult({ count: 0, errors });
    return;
  }

  const zip = new JSZip();
  for (const { name, blob } of blobs) {
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${route}-${timestamp}-bulk.zip`;

  const objectUrl = URL.createObjectURL(zipBlob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = zipName;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  setBulkResult({ count: blobs.length, errors });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/alert-image-form.tsx
git commit -m "feat: add handleBulkRender, helpers, and bulk state to AlertImageForm"
```

---

### Task 3: Add button and result messages to the UI

**Files:**
- Modify: `src/components/forms/alert-image-form.tsx`

- [ ] **Step 1: Add the bulk render button**

Locate the actions `<div>` that contains the "Gerar PNG" button (around line 529). It currently looks like:

```tsx
<div className="flex flex-wrap items-center gap-4 pt-4">
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-50"
    onClick={handleRender}
    disabled={isRendering}
  >
    {isRendering ? 'Gerando...' : 'Gerar PNG'}
  </button>
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 shadow-sm border border-zinc-200/80 transition-all hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
    onClick={() => {
      setPayload(clonePayload(samplePayload));
      setRenderResult(null);
      setErrorMessage(null);
    }}
  >
    Restaurar exemplo
  </button>
</div>
```

Replace the entire `<div>` with:

```tsx
<div className="flex flex-wrap items-center gap-4 pt-4">
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-50"
    onClick={handleRender}
    disabled={isRendering || isBulkRendering}
  >
    {isRendering ? 'Gerando...' : 'Gerar PNG'}
  </button>
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 shadow-sm border border-zinc-200/80 transition-all hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 disabled:cursor-not-allowed disabled:opacity-50"
    onClick={handleBulkRender}
    disabled={isRendering || isBulkRendering}
  >
    {isBulkRendering && bulkProgress
      ? `Gerando ${bulkProgress.current} de ${bulkProgress.total}...`
      : 'Gerar para todos os temas'}
  </button>
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 shadow-sm border border-zinc-200/80 transition-all hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
    onClick={() => {
      setPayload(clonePayload(samplePayload));
      setRenderResult(null);
      setErrorMessage(null);
      setBulkResult(null);
    }}
  >
    Restaurar exemplo
  </button>
</div>
```

- [ ] **Step 2: Add bulk result messages**

Locate the block that renders the error and success messages for single render (after the actions `<div>`, around line 551):

```tsx
{errorMessage ? (
  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{errorMessage}</div>
) : null}
{renderResult ? (
  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
    Render concluido. Download iniciado para <strong>{renderResult.fileName}</strong>.
  </div>
) : null}
```

Add the bulk result messages immediately after that block:

```tsx
{bulkResult !== null ? (
  bulkResult.count === 0 ? (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      Nenhuma imagem foi gerada. Verifique o console.
    </div>
  ) : (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
      {bulkResult.errors > 0
        ? `ZIP gerado com ${bulkResult.count} ${bulkResult.count === 1 ? 'imagem' : 'imagens'}. ${bulkResult.errors} ${bulkResult.errors === 1 ? 'tema falhou' : 'temas falharam'} (ver console).`
        : `ZIP gerado com ${bulkResult.count} ${bulkResult.count === 1 ? 'imagem' : 'imagens'}. Download iniciado.`}
    </div>
  )
) : null}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/alert-image-form.tsx
git commit -m "feat: add bulk export button and result messages"
```

---

### Task 4: Smoke test in the dev server

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` in the browser.

- [ ] **Step 2: Verify button renders and disables correctly**

Confirm:
- "Gerar para todos os temas" button is visible next to "Gerar PNG"
- Clicking "Gerar PNG" disables both render buttons while running
- "Restaurar exemplo" no longer shows `bulkResult` messages after click

- [ ] **Step 3: Trigger bulk export**

With default sample payload loaded, click "Gerar para todos os temas".

Expected behavior during execution:
- Button text changes to "Gerando 1 de 2..." then "Gerando 2 de 2..."
- Both render buttons are disabled
- `payload.themeKey` in the form does **not** change

Expected behavior after execution:
- Browser triggers download of a `.zip` file (e.g., `GRU-CDG-20260509T143000-bulk.zip`)
- Success message appears: "ZIP gerado com 2 imagens. Download iniciado."
- ZIP contains two PNGs:
  - `GRU-CDG-{timestamp}-Executiva-com-Milhas.png`
  - `GRU-CDG-{timestamp}-First-Class.png`
- Both PNGs look correct when opened
