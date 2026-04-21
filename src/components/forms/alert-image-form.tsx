'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertImagePreview } from '@/components/preview/alert-image-preview';
import { samplePayload } from '@/lib/templates/sample-data';
import { applyTemplateToPayload, clonePayload } from '@/lib/templates/template-helpers';
import { brandThemes } from '@/lib/templates/themes';
import type { AlertImagePayload, JourneyBlock, TemplateType } from '@/lib/templates/types';
import { createId } from '@/lib/utils/ids';

interface RenderResponse {
  imagePath: string;
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
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100';
const textAreaClassName = `${inputClassName} min-h-[96px] resize-y`;
const sectionClassName = 'grid gap-4 rounded-2xl border border-slate-200 p-4';
const previewBaseSize = 1080;
const manualDestinationValue = '__manual__';

function toTextarea(items: Array<{ value: string }>): string {
  return items.map((item) => item.value).join('\n');
}

function fromTextarea(content: string, prefix: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
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

      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.error ?? 'Nao foi possivel renderizar a imagem.');
        return;
      }

      setRenderResult(body);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao renderizar.');
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 grid gap-3">
        <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
          MVP - Template + Engine de render
        </span>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Flight Alert Image Generator</h1>
          <p className="max-w-4xl text-sm text-slate-600 sm:text-base">
            Prototipo inicial para geracao de imagens 1080x1080 de alertas aereos. O formulario abaixo alimenta o mesmo componente usado pela engine de renderizacao via Playwright.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(720px,1fr)]">
        <Panel
          title="Dados do alerta"
          subtitle="Estrutura preparada para template simples e composto, com entrada manual e futura evolucao para JSON/API."
        >
          <div className="grid gap-4">
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

            <Field label="Titulo" hint="Ex.: EXECUTIVA QATAR AIRWAYS">
              <input
                className={inputClassName}
                value={payload.title}
                onChange={(event) => setPayload((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>

            <div className={sectionClassName}>
              <h3 className="text-base font-semibold text-slate-900">Ajuste da imagem de destino</h3>
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
              <h3 className="text-base font-semibold text-slate-900">Rodape</h3>
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

            <Field label="Payload JSON" hint="Visao do contrato futuro da API.">
              <textarea className={`${textAreaClassName} font-mono text-xs`} readOnly value={payloadJson} />
            </Field>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
                onClick={handleRender}
                disabled={isRendering}
              >
                {isRendering ? 'Gerando...' : 'Gerar PNG'}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
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
                Render concluido. Arquivo salvo em <strong>{renderResult.imagePath}</strong>.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Preview"
          subtitle="Pre-visualizacao alinhada com a composicao final da imagem. A exportacao usa o mesmo componente renderizado em HTML estatico."
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

function ResponsivePreview({ payload }: { payload: AlertImagePayload }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hostWidth, setHostWidth] = useState(previewBaseSize);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => setHostWidth(element.clientWidth);
    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const scale = Math.min(hostWidth / previewBaseSize, 1);
  const scaledSize = previewBaseSize * scale;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <div ref={hostRef} className="w-full">
        <div className="mx-auto" style={{ width: scaledSize, height: scaledSize }}>
          <div
            style={{
              width: previewBaseSize,
              height: previewBaseSize,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            <AlertImagePreview payload={payload} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(16,24,40,0.06)]">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function JourneyEditor({ title, block, onChange }: { title: string; block: JourneyBlock; onChange: (next: JourneyBlock) => void }) {
  return (
    <div className={sectionClassName}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <Field label="Rota">
        <input className={inputClassName} value={block.route} onChange={(event) => onChange({ ...block, route: event.target.value })} />
      </Field>
      <Field label="Custos" hint="Um por linha. O template adiciona OU automaticamente entre as ofertas.">
        <textarea
          className={textAreaClassName}
          value={toTextarea(block.costs)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'costs', event.target.value))}
        />
      </Field>
      <Field label="Datas" hint="Um agrupamento por linha. Ex.: MAI: 1(1), 6(1), 17(1)">
        <textarea
          className={textAreaClassName}
          value={toTextarea(block.dates)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'dates', event.target.value))}
        />
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      {children}
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
