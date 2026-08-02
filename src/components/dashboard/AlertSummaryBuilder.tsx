'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, createSummaryDraftFromAlerts, generateWhatsAppSummary, validateSummaryItem, type AlertSummaryDraft, type AlertSummaryItem, type AlertSummaryProgram } from '@/lib/alerts/summary';
import type { AlertRecord } from '@/lib/alerts/types';

const STORAGE_KEY = 'ecm_alert_summary_draft';
const panelClass = 'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-surface)]';
const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]';
const buttonClass = 'rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold dark:border-[var(--ecm-blue-border)]';

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyItem(displayProgram: string): AlertSummaryItem {
  return {
    id: newId('alert'),
    origin: '',
    destination: '',
    destinationCountry: '',
    destinationFlag: '',
    airlines: [],
    cabin: '',
    milesType: 'fixed',
    miles: '',
    minimumMiles: '',
    maximumMiles: '',
    displayProgram,
    notes: ''
  };
}

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function AlertSummaryBuilder({ alerts }: { alerts: AlertRecord[] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [draft, setDraft] = useState<AlertSummaryDraft>(() => createSummaryDraftFromAlerts(alerts));
  const [message, setMessage] = useState('');
  const output = useMemo(() => generateWhatsAppSummary(draft), [draft]);
  const completeCount = draft.programs.flatMap((program) => program.alerts).filter((item) => validateSummaryItem(item).length === 0).length;
  const incompleteCount = draft.programs.flatMap((program) => program.alerts).filter((item) => validateSummaryItem(item).length > 0).length;

  useEffect(() => {
    loadDraft();
  }, []);

  function loadDraft() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setDraft(JSON.parse(raw) as AlertSummaryDraft);
      setMessage('Rascunho carregado.');
    } catch {
      setMessage('Nao foi possivel carregar o rascunho salvo.');
    }
  }

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
    if (!output || completeCount === 0) {
      setMessage('Nao ha alertas completos para copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage('Resumo copiado.');
    } catch {
      setMessage('Nao foi possivel copiar automaticamente.');
    }
  }

  function addProgram() {
    setDraft((current) => ({
      ...current,
      programs: [...current.programs, { id: newId('program'), name: 'Novo programa', alerts: [emptyItem('Novo programa')] }]
    }));
  }

  function patchProgram(programId: string, patch: Partial<AlertSummaryProgram>) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => (program.id === programId ? { ...program, ...patch } : program))
    }));
  }

  function moveProgram(index: number, direction: -1 | 1) {
    setDraft((current) => ({ ...current, programs: move(current.programs, index, direction) }));
  }

  function addItem(programId: string) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => (program.id === programId ? { ...program, alerts: [...program.alerts, emptyItem(program.name)] } : program))
    }));
  }

  function patchItem(programId: string, itemId: string, patch: Partial<AlertSummaryItem>) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => program.id === programId ? {
        ...program,
        alerts: program.alerts.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
      } : program)
    }));
  }

  function duplicateItem(programId: string, item: AlertSummaryItem) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => (program.id === programId ? { ...program, alerts: [...program.alerts, { ...item, id: newId('alert') }] } : program))
    }));
  }

  function moveItem(programId: string, index: number, direction: -1 | 1) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => (program.id === programId ? { ...program, alerts: move(program.alerts, index, direction) } : program))
    }));
  }

  function removeItem(programId: string, itemId: string) {
    setDraft((current) => ({
      ...current,
      programs: current.programs.map((program) => (program.id === programId ? { ...program, alerts: program.alerts.filter((item) => item.id !== itemId) } : program))
    }));
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="text-left text-lg font-black" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? '+' : '-'} Gerador de resumo WhatsApp
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={regenerate}>Regenerar pelo historico</button>
          <button type="button" className={buttonClass} onClick={loadDraft}>Carregar rascunho</button>
          <button type="button" className={buttonClass} onClick={saveDraft}>Salvar rascunho</button>
          <button type="button" className={buttonClass} onClick={clearDraft}>Limpar</button>
          <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-bold text-white dark:bg-[var(--ecm-gold)] dark:text-[var(--ecm-blue-bg)]" onClick={() => void copyText()}>Copiar</button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">{message}</p> : null}
      {incompleteCount ? <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-[var(--ecm-gold)]">{incompleteCount} alerta(s) incompleto(s) ignorados no texto final.</p> : null}
      {!collapsed ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
              <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Data<input className={inputClass} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label className="grid gap-1 text-xs font-semibold text-zinc-500 dark:text-[var(--ecm-blue-muted)]">Perfil<input className={inputClass} value={draft.profile} onChange={(event) => setDraft((current) => ({ ...current, profile: event.target.value }))} /></label>
              <button type="button" className={`${buttonClass} self-end`} onClick={addProgram}>Adicionar programa</button>
            </div>
            {draft.programs.map((program, programIndex) => (
              <div key={program.id} className="grid gap-3 rounded-md border border-zinc-200 p-3 dark:border-[var(--ecm-blue-border)]">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input className={`${inputClass} font-bold`} value={program.name} onChange={(event) => patchProgram(program.id, { name: event.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} onClick={() => moveProgram(programIndex, -1)}>Subir</button>
                    <button type="button" className={buttonClass} onClick={() => moveProgram(programIndex, 1)}>Descer</button>
                    <button type="button" className={buttonClass} onClick={() => addItem(program.id)}>Adicionar alerta</button>
                  </div>
                </div>
                {program.alerts.map((item, itemIndex) => {
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
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={buttonClass} onClick={() => moveItem(program.id, itemIndex, -1)}>Subir</button>
                        <button type="button" className={buttonClass} onClick={() => moveItem(program.id, itemIndex, 1)}>Descer</button>
                        <button type="button" className={buttonClass} onClick={() => duplicateItem(program.id, item)}>Duplicar</button>
                        <button type="button" className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-800 dark:text-red-300" onClick={() => removeItem(program.id, item.id)}>Excluir</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-zinc-500 dark:text-[var(--ecm-blue-muted)]">{completeCount} alerta(s) completos no resumo.</p>
            <textarea className="min-h-[520px] w-full resize-y rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm dark:border-[var(--ecm-blue-border)] dark:bg-[var(--ecm-blue-bg)] dark:text-[var(--ecm-blue-text)]" value={output} readOnly />
          </div>
        </div>
      ) : null}
    </section>
  );
}
