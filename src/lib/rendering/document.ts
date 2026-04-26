import { normalizeListText } from '@/lib/rendering/formatters';
import { getBrandTheme } from '@/lib/templates/themes';
import type { AlertImagePayload, JourneyBlock } from '@/lib/templates/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderJourneyBlock(block: JourneyBlock, options: { primaryColor: string; dense?: boolean }): string {
  const dense = options.dense ?? false;
  const costs = normalizeListText(block.costs);
  const dates = normalizeListText(block.dates);

  return `
    <section class="journey ${dense ? 'journey--dense' : 'journey--regular'}">
      <div class="journey__route" style="color:${options.primaryColor}">${escapeHtml(block.route)}</div>
      <div class="journey__cost-list">
        ${costs
          .map(
            (item, index) => `
              <div class="journey__cost-row">
                ${index > 0 ? `<div class="journey__or">OU</div>` : ''}
                <div class="journey__cost-text">${escapeHtml(item)}</div>
              </div>`
          )
          .join('')}
      </div>
      <div class="journey__date-list">
        ${dates.map((item) => `<div>${escapeHtml(item)}</div>`).join('')}
      </div>
    </section>`;
}

export function buildRenderDocument(payload: AlertImagePayload): string {
  const theme = getBrandTheme(payload.themeKey);
  const outboundDense = payload.template === 'round-trip';
  const inbound = payload.template === 'round-trip' && payload.inbound
    ? renderJourneyBlock(payload.inbound, { primaryColor: theme.primaryColor, dense: true })
    : '';

  const leftColumnClass = payload.template === 'one-way' ? 'left-column left-column--one-way' : 'left-column';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --background-color: ${theme.backgroundColor};
        --primary-color: ${theme.primaryColor};
        --text-color: ${theme.textColor};
        --footer-color: ${theme.footerColor};
      }

      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        font-family: Montserrat, Arial, sans-serif;
      }
      .canvas {
        position: relative;
        width: 1080px;
        height: 1080px;
        overflow: hidden;
        background: var(--background-color);
        color: var(--text-color);
      }
      .watermark {
        position: absolute;
        left: 403px;
        top: 350px;
        z-index: 1;
        color: ${theme.primaryColor}14;
        font-size: 95px;
        font-weight: 800;
        line-height: 0.94;
        letter-spacing: -0.04em;
        white-space: pre-line;
        user-select: none;
      }
      .left-column {
        position: absolute;
        left: 36px;
        top: 40px;
        width: 670px;
        z-index: 2;
      }
      .left-column--one-way {
        top: 52px;
      }
      .title {
        margin: 0 0 22px;
        color: var(--primary-color);
        font-size: 31px;
        font-weight: 500;
        line-height: 1.1;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }
      .title--one-way {
        margin-bottom: 28px;
      }
      .journey {
        display: grid;
        margin-bottom: 46px;
      }
      .journey--dense {
        margin-bottom: 34px;
      }
      .journey__route {
        max-width: 660px;
        margin-bottom: 16px;
        font-size: 54px;
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.04em;
        word-break: break-word;
      }
      .journey--dense .journey__route {
        max-width: 650px;
        margin-bottom: 12px;
        font-size: 36px;
      }
      .journey__cost-list {
        display: grid;
        gap: 8px;
        margin-bottom: 22px;
      }
      .journey--dense .journey__cost-list {
        gap: 6px;
        margin-bottom: 18px;
      }
      .journey__cost-row {
        display: grid;
        gap: 8px;
      }
      .journey--dense .journey__cost-row {
        gap: 6px;
      }
      .journey__or {
        font-size: 20px;
        font-weight: 500;
        letter-spacing: 0.08em;
      }
      .journey--dense .journey__or {
        font-size: 18px;
      }
      .journey__cost-text {
        font-size: 28px;
        line-height: 1.24;
        font-weight: 700;
        word-break: break-word;
      }
      .journey--dense .journey__cost-text {
        font-size: 24px;
        line-height: 1.2;
      }
      .journey__date-list {
        display: grid;
        gap: 8px;
        max-width: 660px;
        font-size: 24px;
        line-height: 1.3;
        font-weight: 700;
        word-break: break-word;
      }
      .journey--dense .journey__date-list {
        gap: 6px;
        font-size: 20px;
        line-height: 1.25;
      }
      .right-column {
        position: absolute;
        right: 36px;
        top: 42px;
        width: 284px;
        z-index: 2;
      }
      .destination-frame {
        width: 254px;
        height: 254px;
        overflow: hidden;
        border-radius: 28px;
        box-shadow: 0 18px 24px rgba(30, 41, 59, 0.12);
      }
      .destination-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .plane-container {
        position: absolute;
        left: 2px;
        top: 198px;
        width: 270px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .plane-image {
        width: 250px;
        height: auto;
        object-fit: contain;
      }
      .footer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 3;
        min-height: 112px;
        display: grid;
        grid-template-columns: 240px 1fr 220px;
        align-items: center;
        padding: 16px 28px 16px 0;
        color: #fff;
        background: var(--footer-color);
      }
      .footer__accent {
        width: 240px;
        height: 22px;
        align-self: start;
        background: repeating-linear-gradient(120deg, #f4d000 0 18px, #101010 18px 36px);
      }
      .footer__text-group {
        display: grid;
        gap: 2px;
        padding-left: 18px;
      }
      .footer__strong {
        font-size: 17px;
        line-height: 1.25;
        font-weight: 700;
      }
      .footer__light {
        margin-top: 6px;
        font-size: 15px;
        line-height: 1.2;
        font-weight: 500;
      }
      .footer__brand {
        justify-self: end;
        text-align: right;
        font-size: 20px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
    </style>
  </head>
  <body>
    <div class="canvas">
      <div class="watermark">${escapeHtml(theme.watermarkText)}</div>

      <section class="${leftColumnClass}">
        <header>
          <div class="title ${payload.template === 'one-way' ? 'title--one-way' : ''}">${escapeHtml(payload.title)}</div>
        </header>
        ${renderJourneyBlock(payload.outbound, { primaryColor: theme.primaryColor, dense: outboundDense })}
        ${inbound}
      </section>

      <section class="right-column">
        <div class="destination-frame">
          <img class="destination-image" src="${escapeHtml(payload.destinationImage)}" alt="Destino" />
        </div>
        <div class="plane-container">
          <img class="plane-image" src="/assets/plane/plane-placeholder.svg" alt="Plane" />
        </div>
      </section>

      <footer class="footer">
        <div class="footer__accent"></div>
        <div class="footer__text-group">
          <div class="footer__strong">${escapeHtml(payload.footer.primaryLine)}</div>
          <div class="footer__strong">${escapeHtml(payload.footer.secondaryLine)}</div>
          <div class="footer__light">${escapeHtml(payload.footer.generatedAtLine)}</div>
        </div>
        <div class="footer__brand">${escapeHtml(theme.name.toUpperCase())}</div>
      </footer>
    </div>
  </body>
</html>`;
}
