'use client';

import { useMemo, useState } from 'react';
import { brandThemes } from '@/lib/templates/themes';
import { samplePayload } from '@/lib/templates/sample-data';
import type { AlertImagePayload, JourneyBlock, TemplateType } from '@/lib/templates/types';
import { createId } from '@/lib/utils/ids';
import { AlertImagePreview } from '@/components/preview/alert-image-preview';

interface RenderResponse {
  imagePath: string;
  historyId: string;
}

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
  const [payload, setPayload] = useState<AlertImagePayload>(samplePayload);
  const [renderResult, setRenderResult] = useState<RenderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const payloadJson = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

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
        setErrorMessage(body.error ?? 'Não foi possível renderizar a imagem.');
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
    <div className="page-shell">
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <span className="tag">MVP · Template + Engine de render</span>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Flight Alert Image Generator</h1>
          <p style={{ margin: '10px 0 0', color: 'var(--muted)', maxWidth: 920 }}>
            Protótipo inicial para geração de imagens 1080x1080 de alertas aéreos. O formulário abaixo alimenta o mesmo componente usado pela engine de renderização via Playwright.
          </p>
        </div>
      </div>

      <div className="page-grid">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Dados do alerta</h2>
            <p className="panel-subtitle">Estrutura preparada para template simples e composto, com entrada manual e futura evolução para JSON/API.</p>
          </div>
          <div className="panel-body">
            <div className="form-stack">
              <div className="inline-grid">
                <Field label="Template">
                  <select
                    className="select-input"
                    value={payload.template}
                    onChange={(event) => {
                      const template = event.target.value as TemplateType;
                      setPayload((current) => ({
                        ...current,
                        template,
                        inbound: template === 'one-way' ? undefined : current.inbound ?? samplePayload.inbound
                      }));
                    }}
                  >
                    <option value="one-way">Somente ida</option>
                    <option value="round-trip">Ida e volta</option>
                  </select>
                </Field>

                <Field label="Cliente / tema">
                  <select
                    className="select-input"
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

              <Field label="Título" hint="Ex.: EXECUTIVA QATAR AIRWAYS">
                <input
                  className="text-input"
                  value={payload.title}
                  onChange={(event) => setPayload((current) => ({ ...current, title: event.target.value }))}
                />
              </Field>

              <Field label="Imagem do destino" hint="Use caminho relativo em /public ou URL absoluta.">
                <input
                  className="text-input"
                  value={payload.destinationImage}
                  onChange={(event) => setPayload((current) => ({ ...current, destinationImage: event.target.value }))}
                />
              </Field>

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

              <div className="section-box">
                <h3 className="section-title">Rodapé</h3>
                <Field label="Linha principal">
                  <input
                    className="text-input"
                    value={payload.footer.primaryLine}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        footer: { ...current.footer, primaryLine: event.target.value }
                      }))
                    }
                  />
                </Field>
                <Field label="Linha secundária">
                  <input
                    className="text-input"
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
                    className="text-input"
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

              <Field label="Payload JSON" hint="Visão do contrato futuro da API.">
                <textarea className="text-area" readOnly value={payloadJson} />
              </Field>

              <div className="section-actions">
                <button type="button" className="button" onClick={handleRender} disabled={isRendering}>
                  {isRendering ? 'Gerando...' : 'Gerar PNG'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setPayload(samplePayload);
                    setRenderResult(null);
                    setErrorMessage(null);
                  }}
                >
                  Restaurar exemplo
                </button>
              </div>

              {errorMessage ? <div className="error-box">{errorMessage}</div> : null}
              {renderResult ? (
                <div className="success-box">
                  Render concluído. Arquivo salvo em <strong>{renderResult.imagePath}</strong>.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Preview</h2>
            <p className="panel-subtitle">Pré-visualização alinhada com a composição final da imagem. A exportação usa o mesmo componente renderizado em HTML estático.</p>
          </div>
          <div className="panel-body preview-shell">
            <div className="preview-frame">
              <div style={{ width: 810, transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: -260 }}>
                <AlertImagePreview payload={payload} />
              </div>
            </div>
            <div className="preview-note">
              Observação: nesta primeira versão, o preview é fiel ao template e ao posicionamento base, mas ainda não possui heurísticas automáticas de shrink de fonte para casos extremos.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function JourneyEditor({ title, block, onChange }: { title: string; block: JourneyBlock; onChange: (next: JourneyBlock) => void }) {
  return (
    <div className="section-box">
      <h3 className="section-title">{title}</h3>
      <Field label="Rota">
        <input
          className="text-input"
          value={block.route}
          onChange={(event) => onChange({ ...block, route: event.target.value })}
        />
      </Field>
      <Field label="Custos" hint="Um por linha. O template adiciona OU automaticamente entre as ofertas.">
        <textarea
          className="text-area"
          value={toTextarea(block.costs)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'costs', event.target.value))}
        />
      </Field>
      <Field label="Datas" hint="Um agrupamento por linha. Ex.: MAI: 1(1), 6(1), 17(1)">
        <textarea
          className="text-area"
          value={toTextarea(block.dates)}
          onChange={(event) => onChange(updateJourneyBlock(block, 'dates', event.target.value))}
        />
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
}
