'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertImagePreview } from '@/components/preview/alert-image-preview';
import { samplePayload } from '@/lib/templates/sample-data';
import { applyTemplateToPayload, clonePayload } from '@/lib/templates/template-helpers';
import { brandThemes } from '@/lib/templates/themes';
import type { AlertImagePayload, JourneyBlock, TemplateType } from '@/lib/templates/types';
import { createId } from '@/lib/utils/ids';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { Field } from '@/components/common/Field';
import { JourneyEditor } from '@/components/common/JourneyEditor';
import { Panel } from '@/components/common/Panel';
import { ResponsivePreview } from '@/components/preview/ResponsivePreview';

interface RenderResponse {
  fileName: string;
  historyId: string;
}

interface DestinationOption {
  fileName: string;
  path: string;
}

interface DestinationsResponse {
  items: DestinationOption[];
}

const inputClassName =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3.5 text-sm text-zinc-900 transition-all hover:bg-zinc-50 hover:border-zinc-300 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400';
const textAreaClassName = `${inputClassName} min-h-[120px] resize-y leading-relaxed`;
const sectionClassName = 'grid gap-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/30 p-5 lg:p-6 shadow-sm';
const previewBaseSize = 1080;
const manualDestinationValue = '__manual__';

function parseFileNameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const simpleMatch = headerValue.match(/filename=\"?([^\";]+)\"?/i);
  return simpleMatch?.[1] ?? null;
}

function toTextarea(items: Array<{ value: string }>): string {
  return items.map((item) => item.value).join('\n');
}

/*
function fromTextarea(content: string, prefix: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => ({ id: createId(prefix), value }));
}
*/
function fromTextarea(content: string, prefix: string) {
  console.log('fromTextarea content:', content);
  return content
    .split('\n')
    // Removemos o .trim() e .filter(Boolean) para não quebrar a digitação do usuário
    .map((value) => ({ id: createId(prefix), value }));
}

function updateJourneyBlock(block: JourneyBlock, field: 'costs' | 'dates', value: string): JourneyBlock {
  return {
    ...block,
    [field]: fromTextarea(value, field)
  };
}

export function AlertImageForm() {
  const [payload, setPayload] = useState<AlertImagePayload>(() => clonePayload(samplePayload));
  const [renderResult, setRenderResult] = useState<RenderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState<DestinationOption[]>([]);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);

  const payloadJson = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  const selectedDestinationValue = useMemo(() => {
    return destinationOptions.some((option) => option.path === payload.destinationImage)
      ? payload.destinationImage
      : manualDestinationValue;
  }, [destinationOptions, payload.destinationImage]);

  useEffect(() => {
    let isActive = true;

    async function loadDestinations() {
      try {
        setIsLoadingDestinations(true);
        setDestinationsError(null);

        const response = await fetch('/api/destinations');
        const body = (await response.json()) as DestinationsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? 'Nao foi possivel carregar os destinos.');
        }

        if (!isActive) {
          return;
        }

        setDestinationOptions(body.items ?? []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDestinationsError(error instanceof Error ? error.message : 'Falha ao carregar destinos.');
      } finally {
        if (isActive) {
          setIsLoadingDestinations(false);
        }
      }
    }

    void loadDestinations();

    return () => {
      isActive = false;
    };
  }, []);

  function updateDestinationNumberField(field: 'scale' | 'offsetX' | 'offsetY', value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setPayload((current) => ({
      ...current,
      destinationImageSettings: {
        ...current.destinationImageSettings,
        [field]: parsed
      }
    }));
  }

  function handleDestinationFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        return;
      }

      setPayload((current) => ({
        ...current,
        destinationImage: result
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async function handleRender(): Promise<void> {
    setErrorMessage(null);
    setRenderResult(null);
    setIsRendering(true);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(body.error ?? 'Nao foi possivel renderizar a imagem.');
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = parseFileNameFromContentDisposition(contentDisposition) ?? `alert-${Date.now()}.png`;
      const historyId = response.headers.get('X-History-Id') ?? crypto.randomUUID();

      const objectUrl = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.append(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      setRenderResult({ fileName, historyId });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao renderizar.');
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 grid gap-4">
        <span className="inline-flex w-fit items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-bold tracking-widest text-white shadow-sm">
          MVP - RENDER ENGINE
        </span>
        <div className="grid gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">Flight Alert <span className="text-zinc-400">Generator</span></h1>
          <p className="max-w-2xl text-base text-zinc-500 sm:text-lg">
            Prototipo inicial para geracao de imagens 1080x1080 de alertas aereos. O formulario abaixo alimenta o mesmo componente usado pela engine de renderizacao via Playwright.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_540px] xl:grid-cols-[minmax(0,1fr)_720px] 2xl:grid-cols-[minmax(0,1fr)_840px]">
        <Panel
          title="Dados do alerta"
          subtitle="Estrutura preparada para template simples e composto, com entrada manual e futura evolucao para JSON/API."
        >
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template">
                <select
                  className={inputClassName}
                  value={payload.template}
                  onChange={(event) => {
                    const template = event.target.value as TemplateType;
                    setPayload((current) => applyTemplateToPayload(current, template));
                  }}
                >
                  <option value="one-way">Somente ida</option>
                  <option value="round-trip">Ida e volta</option>
                </select>
              </Field>

              <Field label="Cliente / tema">
                <select
                  className={inputClassName}
                  value={payload.themeKey}
                  onChange={(event) => setPayload((current) => ({ ...current, themeKey: event.target.value }))}
                >
                  {brandThemes.map((theme) => (
                    <option key={theme.key} value={theme.key}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Titulo" hint="Ex.: EXECUTIVA QATAR AIRWAYS">
              <input
                className={inputClassName}
                value={payload.title}
                onChange={(event) => setPayload((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>

            <div className={sectionClassName}>
              
              <CollapsibleSection title="Ajuste da imagem de destino">
                <Field
                  label="Biblioteca de destinos"
                  hint="Lista automatica da pasta public/assets/destinations. Escolha uma opcao ou use upload manual."
                >
                  <select
                    className={inputClassName}
                    value={selectedDestinationValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === manualDestinationValue) {
                        return;
                      }

                      setPayload((current) => ({
                        ...current,
                        destinationImage: nextValue
                      }));
                    }}
                  >
                    <option value={manualDestinationValue}>Manual / upload</option>
                    {destinationOptions.map((option) => (
                      <option key={option.path} value={option.path}>
                        {option.fileName}
                      </option>
                    ))}
                  </select>
                  {isLoadingDestinations ? (
                    <div className="text-xs text-slate-500">Carregando destinos...</div>
                  ) : null}
                  {destinationsError ? (
                    <div className="text-xs text-amber-700">{destinationsError}</div>
                  ) : null}
                </Field>
                <Field
                  label="Selecionar arquivo local"
                  hint="Carregue qualquer imagem. Ela sera convertida para data URL e usada no preview/render."
                >
                  <input className={inputClassName} type="file" accept="image/*" onChange={handleDestinationFileChange} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Modo de encaixe"
                    hint="Cover preenche o quadro e pode cortar bordas. Contain mostra tudo sem corte."
                  >
                    <select
                      className={inputClassName}
                      value={payload.destinationImageSettings.fit}
                      onChange={(event) =>
                        setPayload((current) => ({
                          ...current,
                          destinationImageSettings: {
                            ...current.destinationImageSettings,
                            fit: event.target.value as 'cover' | 'contain'
                          }
                        }))
                      }
                    >
                      <option value="cover">Cover (corta para preencher)</option>
                      <option value="contain">Contain (sem cortar)</option>
                    </select>
                  </Field>
                  <Field label="Zoom" hint="1.0 = tamanho base. Valores maiores ampliam.">
                    <input
                      className={inputClassName}
                      type="number"
                      step="0.05"
                      min="0.2"
                      max="4"
                      value={payload.destinationImageSettings.scale}
                      onChange={(event) => updateDestinationNumberField('scale', event.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Deslocamento X (px)" hint="Positivo move para a direita.">
                    <input
                      className={inputClassName}
                      type="number"
                      step="1"
                      value={payload.destinationImageSettings.offsetX}
                      onChange={(event) => updateDestinationNumberField('offsetX', event.target.value)}
                    />
                  </Field>
                  <Field label="Deslocamento Y (px)" hint="Positivo move para baixo.">
                    <input
                      className={inputClassName}
                      type="number"
                      step="1"
                      value={payload.destinationImageSettings.offsetY}
                      onChange={(event) => updateDestinationNumberField('offsetY', event.target.value)}
                    />
                  </Field>
                </div>
              </CollapsibleSection>
            </div>

            <JourneyEditor
              title="Bloco de ida"
              block={payload.outbound}
              onChange={(next) => setPayload((current) => ({ ...current, outbound: next }))}
            />

            {payload.template === 'round-trip' && payload.inbound ? (
              <JourneyEditor
                title="Bloco de volta"
                block={payload.inbound}
                onChange={(next) => setPayload((current) => ({ ...current, inbound: next }))}
              />
            ) : null}

            <div className={sectionClassName}>
              <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-900">Rodape</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Linha principal">
                  <input
                    className={inputClassName}
                    value={payload.footer.primaryLine}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        footer: { ...current.footer, primaryLine: event.target.value }
                      }))
                    }
                  />
                </Field>
                <Field label="Linha secundaria">
                  <input
                    className={inputClassName}
                    value={payload.footer.secondaryLine}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        footer: { ...current.footer, secondaryLine: event.target.value }
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="Linha de data">
                <input
                  className={inputClassName}
                  value={payload.footer.generatedAtLine}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      footer: { ...current.footer, generatedAtLine: event.target.value }
                    }))
                  }
                />
              </Field>
            </div>

            <CollapsibleSection title="Dados brutos do payload">
              <div className="text-sm text-slate-600">
                Visualizacao do JSON final que alimenta o componente de renderizacao. Ideal para debug e evolucao futura para edicao direta ou alimentacao via API externa.
              </div>
              
              <Field label="Payload JSON" hint="Visao do contrato futuro da API.">
                <textarea className={`${textAreaClassName} font-mono text-xs`} readOnly value={payloadJson} />
              </Field>
            </CollapsibleSection>



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

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}
            {renderResult ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
                Render concluido. Download iniciado para <strong>{renderResult.fileName}</strong>.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Preview"
          subtitle="Pre-visualizacao alinhada com a composicao final da imagem. A exportacao usa o mesmo componente renderizado em HTML estatico."
          className="lg:sticky lg:top-8"
        >
          <div className="grid gap-4">
            <ResponsivePreview payload={payload} />
            <div className="text-sm text-slate-600">
              Observacao: o preview escala com a largura da tela, mantendo base interna fixa de 1080x1080 para preservar o posicionamento original.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
