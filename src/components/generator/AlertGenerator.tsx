'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildAlertRecordForTheme, createAlert, groupForTheme, uploadCardJpeg } from '@/lib/alerts/client';
import { createDefaultAlertDraft, defaultFooters, seatCountFooters, STANDARD_TYPOGRAPHY } from '@/lib/canvas/default-draft';
import { destinationPhotoSlug, photoPathForDestination } from '@/lib/canvas/destination-photos';
import { buildPngFilename, downloadCanvasPng, generateAllZip } from '@/lib/canvas/export';
import { CANVAS_THEMES } from '@/lib/canvas/themes';
import type { AlertDraft, CanvasTheme, CanvasThemeKey, JourneyLeg, TypographySettings } from '@/lib/canvas/types';
import { CanvasPreviewCard } from './CanvasPreviewCard';
import { FooterEditor, type FooterPreset } from './FooterEditor';
import { JourneyLegEditor } from './JourneyLegEditor';
import { TypographyControls } from './TypographyControls';
import { WhatsAppTextPanel } from './WhatsAppTextPanel';

const typographyStorageKey = 'flight-alert-canvas-typography';
const authorStorageKey = 'ecm_author';
const operators = ['Jose', 'Lucas', 'Anderson', 'Ana'] as const;
const panelClass = 'rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] dark:placeholder:text-[var(--ecm-blue-muted)]';

interface UserDestinationPhotoEntry {
  destination: string;
  path: string;
  mimeType: string;
  updatedAt: string;
}

interface PendingDestinationPhoto {
  file: File;
  dataUrl: string;
}

function photoSrcFromEntry(entry?: UserDestinationPhotoEntry): string | null {
  if (!entry) return null;
  const separator = entry.path.includes('?') ? '&' : '?';
  return `${entry.path}${separator}v=${encodeURIComponent(entry.updatedAt)}`;
}

function invertLeg(leg: JourneyLeg): JourneyLeg {
  return {
    origin: leg.destination,
    destination: leg.origin,
    bands: leg.bands.map((band, index) => ({ ...band, id: `inbound-${Date.now()}-${index}` }))
  };
}

export function AlertGenerator({ loadedDraft }: { loadedDraft?: AlertDraft | null }) {
  const [draft, setDraft] = useState<AlertDraft>(() => createDefaultAlertDraft());
  const [footerPresets, setFooterPresets] = useState<Record<CanvasThemeKey, FooterPreset>>({ gomiles: 'default', executiva: 'default', firstclass: 'default', milhasaovivo: 'default' });
  const [collapsed, setCollapsed] = useState<Record<CanvasThemeKey, boolean>>({ gomiles: false, executiva: false, firstclass: false, milhasaovivo: false });
  const [photoCollapsed, setPhotoCollapsed] = useState(true);
  const [userPhotos, setUserPhotos] = useState<Record<string, UserDestinationPhotoEntry>>({});
  const [pendingPhoto, setPendingPhoto] = useState<PendingDestinationPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'warning' | 'error'>('success');
  const [author, setAuthor] = useState<(typeof operators)[number]>(() => operators[0]);
  const [splitPair, setSplitPair] = useState(false);

  function showMessage(text: string | null, tone: 'success' | 'warning' | 'error' = 'success') {
    setMessage(text);
    setMessageTone(tone);
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(typographyStorageKey);
      if (!saved) return;
      const typography = JSON.parse(saved) as TypographySettings;
      setDraft((current) => ({ ...current, typography: { ...current.typography, ...typography } }));
    } catch {}
  }, []);

  useEffect(() => {
    if (!loadedDraft) return;
    setDraft(loadedDraft);
    setPendingPhoto(null);
    showMessage('Snapshot carregado do historico.');
  }, [loadedDraft]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(authorStorageKey);
      if (operators.includes(saved as (typeof operators)[number])) setAuthor(saved as (typeof operators)[number]);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(authorStorageKey, author);
    } catch {}
  }, [author]);

  useEffect(() => {
    const defaultValues = defaultFooters();
    const seatValues = seatCountFooters();
    setDraft((current) => {
      const nextFooters = { ...current.footersByTheme };
      let changed = false;
      for (const theme of CANVAS_THEMES) {
        const preset = footerPresets[theme.key];
        if (preset === 'custom') continue;
        const expected = preset === 'seats' ? seatValues[theme.key] : defaultValues[theme.key];
        if (nextFooters[theme.key] !== expected) {
          nextFooters[theme.key] = expected;
          changed = true;
        }
      }
      return changed ? { ...current, footersByTheme: nextFooters } : current;
    });
  }, [draft.outbound.bands, draft.inbound.bands, draft.tripMode, footerPresets]);

  useEffect(() => {
    async function loadUserPhotos() {
      try {
        const response = await fetch(`/api/destination-photo?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) setUserPhotos((await response.json()) as Record<string, UserDestinationPhotoEntry>);
      } catch {}
    }

    void loadUserPhotos();
  }, []);

  const automaticPhotoPath = useMemo(() => {
    return draft.outbound.destination.trim() ? photoPathForDestination(draft.outbound.destination) : null;
  }, [draft.outbound.destination]);

  const userPhotoPath = useMemo(() => {
    const destination = draft.outbound.destination.trim();
    return destination ? photoSrcFromEntry(userPhotos[destinationPhotoSlug(destination)]) : null;
  }, [draft.outbound.destination, userPhotos]);

  const hasManualPhoto = draft.destinationPhotoMode === 'manual' && Boolean(draft.manualPhotoDataUrl);
  const photoOverrideSrc = hasManualPhoto ? draft.manualPhotoDataUrl : automaticPhotoPath ? undefined : userPhotoPath || undefined;
  const canGenerate = !pendingPhoto && (hasManualPhoto || Boolean(userPhotoPath || automaticPhotoPath));

  const photoStatus = useMemo(() => {
    if (pendingPhoto) {
      return { tone: 'warning', text: `Confirme que a imagem selecionada representa ${draft.outbound.destination || 'o destino informado'} antes de salvar.` };
    }
    if (hasManualPhoto) {
      return { tone: 'success', text: 'Imagem manual selecionada. Ela será usada nos 4 layouts.' };
    }
    if (!draft.outbound.destination.trim()) {
      return { tone: 'warning', text: 'Informe o destino da ida para buscar uma imagem automática.' };
    }
    if (!automaticPhotoPath && userPhotoPath) {
      return { tone: 'success', text: `Imagem salva na base local encontrada para ${draft.outbound.destination}.` };
    }
    if (automaticPhotoPath) {
      return { tone: 'success', text: `Imagem automática encontrada para ${draft.outbound.destination}.` };
    }
    return {
      tone: 'error',
      text: `Não há imagem automática para ${draft.outbound.destination}. Envie uma imagem manual para gerar os layouts.`
    };
  }, [automaticPhotoPath, draft.outbound.destination, hasManualPhoto, pendingPhoto, userPhotoPath]);

  useEffect(() => {
    if (!canGenerate) setPhotoCollapsed(false);
  }, [canGenerate]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function resetAllTexts() {
    setDraft(createDefaultAlertDraft());
    setFooterPresets({ gomiles: 'default', executiva: 'default', firstclass: 'default', milhasaovivo: 'default' });
    showMessage(null);
  }

  function updateOutbound(outbound: JourneyLeg) {
    setDraft((current) => {
      const originChanged = outbound.origin !== current.outbound.origin;
      const destinationChanged = outbound.destination !== current.outbound.destination;
      const inbound =
        current.tripMode === 'round-trip'
          ? {
              ...current.inbound,
              origin: destinationChanged ? outbound.destination : current.inbound.origin,
              destination: originChanged ? outbound.origin : current.inbound.destination
            }
          : current.inbound;
      return { ...current, outbound, inbound };
    });
  }

  function setTripMode(mode: AlertDraft['tripMode']) {
    setDraft((current) => ({
      ...current,
      tripMode: mode,
      inbound: mode === 'round-trip' && current.tripMode !== 'round-trip' ? invertLeg(current.outbound) : current.inbound
    }));
  }

  function handleManualPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value === 'string') setPendingPhoto({ file, dataUrl: value });
    };
    reader.readAsDataURL(file);
  }

  async function confirmPendingPhoto() {
    if (!pendingPhoto) return;
    if (!draft.outbound.destination.trim()) {
      showMessage('Informe o destino da ida antes de salvar a imagem.', 'warning');
      return;
    }

    setSavingPhoto(true);
    showMessage(null);
    try {
      const form = new FormData();
      form.append('destination', draft.outbound.destination);
      form.append('file', pendingPhoto.file);
      const response = await fetch('/api/destination-photo', { method: 'POST', body: form });
      const payload = (await response.json()) as { key?: string; entry?: UserDestinationPhotoEntry; error?: string };
      if (!response.ok || !payload.key || !payload.entry) throw new Error(payload.error || 'Falha ao salvar a imagem.');

      setUserPhotos((current) => ({ ...current, [payload.key as string]: payload.entry as UserDestinationPhotoEntry }));
      setDraft((current) => ({ ...current, destinationPhotoMode: 'auto', manualPhotoDataUrl: undefined }));
      setPendingPhoto(null);
      setPhotoCollapsed(true);
      showMessage(`Imagem salva na base local para ${draft.outbound.destination}.`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Falha ao salvar a imagem.', 'error');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function logGeneratedCard(canvas: HTMLCanvasElement, theme: CanvasTheme, parId: string | null) {
    const group = groupForTheme(theme, draft);
    let imageUrl: string | null = null;
    let warning = false;

    try {
      imageUrl = await uploadCardJpeg(canvas, group, draft.outbound.origin, draft.outbound.destination);
    } catch {
      warning = true;
    }

    try {
      const alert = await createAlert(buildAlertRecordForTheme(draft, theme, author, imageUrl, parId));
      if (!alert) return 'unconfigured' as const;
      return warning ? ('warning' as const) : ('logged' as const);
    } catch {
      return 'warning' as const;
    }
  }

  async function handleDownload(canvas: HTMLCanvasElement, theme: CanvasTheme) {
    showMessage(null);
    if (!canGenerate) {
      showMessage(photoStatus.text, photoStatus.tone === 'error' ? 'error' : 'warning');
      setPhotoCollapsed(false);
      return;
    }

    setBusy(true);
    try {
      await downloadCanvasPng(canvas, buildPngFilename(draft, theme));
      const parId = splitPair ? crypto.randomUUID() : null;
      const status = await logGeneratedCard(canvas, theme, parId);
      if (status === 'logged') showMessage('Card baixado e alerta registrado.');
      else if (status === 'unconfigured') showMessage('Card baixado. Historico nao configurado.', 'warning');
      else showMessage('Card baixado, mas nao foi possivel registrar o alerta no historico.', 'warning');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Falha ao baixar o card.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleZip() {
    if (!canGenerate) {
      showMessage(photoStatus.text, photoStatus.tone === 'error' ? 'error' : 'warning');
      setPhotoCollapsed(false);
      return;
    }
    setBusy(true);
    showMessage(null);
    try {
      const result = await generateAllZip(draft, photoOverrideSrc);
      const parId = splitPair ? crypto.randomUUID() : null;
      const statuses = await Promise.all(result.items.map((item) => logGeneratedCard(item.canvas, item.theme, parId)));
      if (statuses.every((status) => status === 'logged')) showMessage('Todos os layouts foram gerados e registrados.');
      else if (statuses.every((status) => status === 'unconfigured')) showMessage('Todos os layouts foram gerados. Historico nao configurado.', 'warning');
      else showMessage('Todos os layouts foram gerados, mas alguns alertas nao foram registrados no historico.', 'warning');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Falha ao gerar ZIP.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-5 text-zinc-900 dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)] sm:px-6 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto grid max-w-[1700px] gap-5 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Gerador de cards</h1>
            <p className="text-sm text-zinc-500">Preencha os dados, confira as prévias e gere os 4 layouts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={handleZip} disabled={busy || !canGenerate}>
              {busy ? 'Gerando...' : 'Gerar todos'}
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:min-h-0 lg:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="grid gap-4 pr-1 lg:h-full lg:min-h-0 lg:overflow-y-auto">
            <section className={panelClass}>
              <label className="grid gap-1 text-xs font-semibold text-zinc-500">
                Título do alerta
                <input className={inputClass} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="mt-3 grid gap-1 text-xs font-semibold text-zinc-500">
                Layout Milhas Ao Vivo
                <select className={inputClass} value={draft.mavVariant} onChange={(event) => setDraft((current) => ({ ...current, mavVariant: event.target.value as AlertDraft['mavVariant'] }))}>
                  <option value="experiencias">Experiências Ao Vivo</option>
                  <option value="milhasaovivo">Milhas Ao Vivo</option>
                </select>
              </label>
              <label className="mt-3 grid gap-1 text-xs font-semibold text-zinc-500">
                Operador
                <select className={inputClass} value={author} onChange={(event) => setAuthor(event.target.value as (typeof operators)[number])}>
                  {operators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-zinc-600 dark:text-[var(--ecm-blue-muted)]">
                <input className="mt-0.5 h-4 w-4" type="checkbox" checked={splitPair} onChange={(event) => setSplitPair(event.target.checked)} />
                <span>Essa rota e a 2a metade de uma ida+volta dividida em 2 cards</span>
              </label>
            </section>

            <section className={panelClass}>
              <button type="button" className="flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-wide" onClick={() => setPhotoCollapsed((current) => !current)} aria-expanded={!photoCollapsed}>
                <span>Imagem do destino</span>
                <span className="text-base leading-none">{photoCollapsed ? '+' : '-'}</span>
              </button>
              <p
                className={`mt-3 rounded-md border px-3 py-2 text-xs ${
                  photoStatus.tone === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                    : photoStatus.tone === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
              >
                {photoStatus.text}
              </p>
              {photoCollapsed ? null : (
                <div className="mt-3 grid gap-2">
                  <label className="grid gap-1 text-xs font-semibold text-zinc-500">
                    Enviar imagem manual
                    <input className={inputClass} type="file" accept="image/*" onChange={(event) => handleManualPhoto(event.target.files?.[0])} />
                  </label>
                  {pendingPhoto ? (
                    <div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      <img src={pendingPhoto.dataUrl} alt="Imagem selecionada para confirmacao" className="h-32 w-full rounded-md object-cover" />
                      <p>Confirma que esta imagem representa o destino "{draft.outbound.destination || 'nao informado'}"?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 font-bold text-white disabled:opacity-50 dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={confirmPendingPhoto} disabled={savingPhoto}>
                          {savingPhoto ? 'Salvando...' : 'Confirmar e salvar'}
                        </button>
                        <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setPendingPhoto(null)} disabled={savingPhoto}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {draft.destinationPhotoMode === 'manual' ? (
                    <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]" onClick={() => setDraft((current) => ({ ...current, destinationPhotoMode: 'auto', manualPhotoDataUrl: undefined }))}>
                      Usar imagem automática
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            {!canGenerate ? (
              <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {photoStatus.text}
              </section>
            ) : null}

            <section className={panelClass}>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={`rounded-md border px-3 py-2 text-sm font-bold ${draft.tripMode === 'one-way' ? 'border-zinc-900 bg-zinc-900 text-white dark:border-[var(--ecm-gold)] dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]' : 'border-zinc-300 dark:border-[var(--ecm-blue-border)]'}`} onClick={() => setTripMode('one-way')}>
                  Somente ida
                </button>
                <button type="button" className={`rounded-md border px-3 py-2 text-sm font-bold ${draft.tripMode === 'round-trip' ? 'border-zinc-900 bg-zinc-900 text-white dark:border-[var(--ecm-gold)] dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]' : 'border-zinc-300 dark:border-[var(--ecm-blue-border)]'}`} onClick={() => setTripMode('round-trip')}>
                  Ida e volta
                </button>
              </div>
            </section>

            <JourneyLegEditor title="Trecho de ida" prefix="outbound" leg={draft.outbound} onChange={updateOutbound} />
            {draft.tripMode === 'round-trip' ? <JourneyLegEditor title="Trecho de volta" prefix="inbound" leg={draft.inbound} onChange={(inbound) => setDraft((current) => ({ ...current, inbound }))} /> : null}

            <WhatsAppTextPanel draft={draft} onMessage={(text) => showMessage(text)} />

            <FooterEditor
              values={draft.footersByTheme}
              presets={footerPresets}
              onPresetChange={(theme, preset, value) => {
                setFooterPresets((current) => ({ ...current, [theme]: preset }));
                setDraft((current) => ({ ...current, footersByTheme: { ...current.footersByTheme, [theme]: value } }));
              }}
              onTextChange={(theme, value) => {
                setFooterPresets((current) => ({ ...current, [theme]: 'custom' }));
                setDraft((current) => ({ ...current, footersByTheme: { ...current.footersByTheme, [theme]: value } }));
              }}
            />

            <TypographyControls
              value={draft.typography}
              onChange={(typography) => setDraft((current) => ({ ...current, typography }))}
              onReset={() => setDraft((current) => ({ ...current, typography: { ...STANDARD_TYPOGRAPHY } }))}
              onSaveDefault={() => {
                localStorage.setItem(typographyStorageKey, JSON.stringify(draft.typography));
                showMessage('Medidas salvas como padrão local.');
              }}
            />

            <section className={panelClass}>
              <button type="button" className="w-full rounded-md border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300" onClick={resetAllTexts}>
                Restaurar dados de exemplo
              </button>
            </section>
          </aside>

          <section className="grid min-w-0 content-start gap-4 pr-1 lg:h-full lg:min-h-0 lg:overflow-y-auto xl:grid-cols-2">
            {message ? (
              <div
                className={`rounded-md border px-4 py-3 text-sm xl:col-span-2 ${
                  messageTone === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                    : messageTone === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
              >
                {message}
              </div>
            ) : null}
            {CANVAS_THEMES.map((theme) => (
              <CanvasPreviewCard
                key={theme.key}
                draft={draft}
                theme={theme}
                collapsed={collapsed[theme.key]}
                canDownload={canGenerate && !busy}
                photoOverrideSrc={photoOverrideSrc}
                onToggle={() => setCollapsed((current) => ({ ...current, [theme.key]: !current[theme.key] }))}
                onDownload={handleDownload}
              />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
