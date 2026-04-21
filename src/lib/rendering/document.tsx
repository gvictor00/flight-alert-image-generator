import path from 'path';
import { pathToFileURL } from 'url';
import { normalizeListText } from '@/lib/rendering/formatters';
import { getBrandTheme, getFontWeightForVariant } from '@/lib/templates/themes';
import type { AlertImagePayload, JourneyBlock } from '@/lib/templates/types';

interface BuildRenderDocumentOptions {
  publicDir: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function resolveAssetUrl(source: string, publicDir: string): string {
  if (source.startsWith('//')) {
    return `https:${source}`;
  }

  if (/^(https?:|data:|blob:|file:)/i.test(source)) {
    return source;
  }

  const normalizedSource = source.replace(/\\/g, '/');
  const relativeAssetPath = normalizedSource.startsWith('/') ? normalizedSource.slice(1) : normalizedSource;
  const absoluteAssetPath = path.join(publicDir, relativeAssetPath);

  return pathToFileURL(absoluteAssetPath).href;
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

export function buildRenderDocument(payload: AlertImagePayload, options: BuildRenderDocumentOptions): string {
  const theme = getBrandTheme(payload.themeKey);
  const outboundDense = payload.template === 'round-trip';
  const inbound = payload.template === 'round-trip' && payload.inbound
    ? renderJourneyBlock(payload.inbound, { primaryColor: theme.primaryColor, dense: true })
    : '';

  const leftColumnClass = payload.template === 'one-way' ? 'left-column left-column--one-way' : 'left-column';

  const themeBackgroundImageUrl = resolveAssetUrl(theme.backgroundImage, options.publicDir);
  const destinationImageUrl = resolveAssetUrl(payload.destinationImage, options.publicDir);
  const destinationImageStyle = `object-fit: ${payload.destinationImageSettings.fit}; transform: translate(${payload.destinationImageSettings.offsetX}px, ${payload.destinationImageSettings.offsetY}px) scale(${payload.destinationImageSettings.scale}); transform-origin: center center;`;
  const planeImageUrl = resolveAssetUrl('/assets/plane/plane-placeholder.svg', options.publicDir);
  const textFontVariants = theme.textFontVariants;

  const montserratThinUrl = resolveAssetUrl('/assets/fonts/Montserrat-Thin.ttf', options.publicDir);
  const montserratExtraLightUrl = resolveAssetUrl('/assets/fonts/Montserrat-ExtraLight.ttf', options.publicDir);
  const montserratLightUrl = resolveAssetUrl('/assets/fonts/Montserrat-Light.ttf', options.publicDir);
  const montserratRegularUrl = resolveAssetUrl('/assets/fonts/Montserrat-Regular.ttf', options.publicDir);
  const montserratMediumUrl = resolveAssetUrl('/assets/fonts/Montserrat-Medium.ttf', options.publicDir);
  const montserratSemiBoldUrl = resolveAssetUrl('/assets/fonts/Montserrat-SemiBold.ttf', options.publicDir);
  const montserratBoldUrl = resolveAssetUrl('/assets/fonts/Montserrat-Bold.ttf', options.publicDir);
  const montserratExtraBoldUrl = resolveAssetUrl('/assets/fonts/Montserrat-ExtraBold.ttf', options.publicDir);
  const montserratBlackUrl = resolveAssetUrl('/assets/fonts/Montserrat-Black.ttf', options.publicDir);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratThinUrl)}') format('truetype');
        font-style: normal;
        font-weight: 100;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratExtraLightUrl)}') format('truetype');
        font-style: normal;
        font-weight: 200;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratLightUrl)}') format('truetype');
        font-style: normal;
        font-weight: 300;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratRegularUrl)}') format('truetype');
        font-style: normal;
        font-weight: 400;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratMediumUrl)}') format('truetype');
        font-style: normal;
        font-weight: 500;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratSemiBoldUrl)}') format('truetype');
        font-style: normal;
        font-weight: 600;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratBoldUrl)}') format('truetype');
        font-style: normal;
        font-weight: 700;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratExtraBoldUrl)}') format('truetype');
        font-style: normal;
        font-weight: 800;
        font-display: swap;
      }
      @font-face {
        font-family: 'MontserratLocal';
        src: url('${escapeCssUrl(montserratBlackUrl)}') format('truetype');
        font-style: normal;
        font-weight: 900;
        font-display: swap;
      }

      :root {
        --background-color: ${theme.backgroundColor};
        --primary-color: ${theme.primaryColor};
        --text-color: ${theme.textColor};
        --footer-text-color: ${theme.footerTextColor};
        --font-weight-title: ${getFontWeightForVariant(textFontVariants.title)};
        --font-weight-route: ${getFontWeightForVariant(textFontVariants.route)};
        --font-weight-cost: ${getFontWeightForVariant(textFontVariants.cost)};
        --font-weight-dates: ${getFontWeightForVariant(textFontVariants.dates)};
        --font-weight-or: ${getFontWeightForVariant(textFontVariants.orLabel)};
        --font-weight-footer-primary: ${getFontWeightForVariant(textFontVariants.footerPrimary)};
        --font-weight-footer-secondary: ${getFontWeightForVariant(textFontVariants.footerSecondary)};
        --font-weight-footer-date: ${getFontWeightForVariant(textFontVariants.footerDate)};
      }

      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 1080px;
        height: 1080px;
        overflow: hidden;
        background: transparent;
      }
      body {
        font-family: 'MontserratLocal', Montserrat, Arial, sans-serif;
      }
      .canvas {
        position: relative;
        width: 1080px;
        height: 1080px;
        overflow: hidden;
        background-color: var(--background-color);
        color: var(--text-color);
      }
      .canvas__background {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 1080px;
        height: 1080px;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
        z-index: 0;
      }
      .left-column {
        position: absolute;
        left: ${theme.mainTextOverlay.x}px;
        top: ${theme.mainTextOverlay.roundTripY}px;
        width: ${theme.mainTextOverlay.width}px;
        z-index: 2;
      }
      .left-column--one-way {
        top: ${theme.mainTextOverlay.oneWayY}px;
      }
      .title {
        margin: 0 0 22px;
        color: var(--primary-color);
        font-size: 31px;
        font-weight: var(--font-weight-title);
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
        font-weight: var(--font-weight-route);
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
        font-weight: var(--font-weight-or);
        letter-spacing: 0.08em;
      }
      .journey--dense .journey__or {
        font-size: 18px;
      }
      .journey__cost-text {
        font-size: 28px;
        line-height: 1.24;
        font-weight: var(--font-weight-cost);
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
        font-weight: var(--font-weight-dates);
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
      .footer-line {
        position: absolute;
        z-index: 3;
        color: var(--footer-text-color);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .footer-line--primary,
      .footer-line--secondary {
        font-size: 17px;
        line-height: 1.25;
      }
      .footer-line--primary { font-weight: var(--font-weight-footer-primary); }
      .footer-line--secondary { font-weight: var(--font-weight-footer-secondary); }
      .footer-line--date {
        font-size: 15px;
        line-height: 1.2;
        font-weight: var(--font-weight-footer-date);
      }
    </style>
  </head>
  <body>
    <div class="canvas">
      <img class="canvas__background" src="${escapeHtml(themeBackgroundImageUrl)}" alt="" />

      <section class="${leftColumnClass}">
        <header>
          <div class="title ${payload.template === 'one-way' ? 'title--one-way' : ''}">${escapeHtml(payload.title)}</div>
        </header>
        ${renderJourneyBlock(payload.outbound, { primaryColor: theme.primaryColor, dense: outboundDense })}
        ${inbound}
      </section>

      <section class="right-column">
        <div class="destination-frame">
          <img class="destination-image" src="${escapeHtml(destinationImageUrl)}" alt="Destino" style="${escapeHtml(destinationImageStyle)}" />
        </div>
        <div class="plane-container">
          <img class="plane-image" src="${escapeHtml(planeImageUrl)}" alt="Plane" />
        </div>
      </section>
      <div
        class="footer-line footer-line--primary"
        style="left: ${theme.footerOverlayLayout.primaryLine.x}px; top: ${theme.footerOverlayLayout.primaryLine.y}px; width: ${theme.footerOverlayLayout.primaryLine.width}px;"
      >${escapeHtml(payload.footer.primaryLine)}</div>
      <div
        class="footer-line footer-line--secondary"
        style="left: ${theme.footerOverlayLayout.secondaryLine.x}px; top: ${theme.footerOverlayLayout.secondaryLine.y}px; width: ${theme.footerOverlayLayout.secondaryLine.width}px;"
      >${escapeHtml(payload.footer.secondaryLine)}</div>
      <div
        class="footer-line footer-line--date"
        style="left: ${theme.footerOverlayLayout.generatedAtLine.x}px; top: ${theme.footerOverlayLayout.generatedAtLine.y}px; width: ${theme.footerOverlayLayout.generatedAtLine.width}px;"
      >${escapeHtml(payload.footer.generatedAtLine)}</div>
    </div>
  </body>
</html>`;
}
