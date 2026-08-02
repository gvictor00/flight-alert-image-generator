import { extractCiaFromTitle, extractClassFromTitle, normalizeAlertText } from '../alerts/normalization';
import { inferIataFromCity } from './airports';
import { MAV_LOGO_ASSET } from './assets';
import { STANDARD_TYPOGRAPHY } from './default-draft';
import type { AlertDraft, CanvasAssets, JourneyLeg, TypographySettings } from './types';

const W = 1080;
const FONT_FAMILY = 'Poppins, Montserrat, Arial, sans-serif';
const MONTH_ORDER = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_FULL = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

interface TextStyle {
  size: number;
  bold: boolean;
}

interface MavRouteData {
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  cia: string;
  cabinClass: string | null;
  bands: Array<{ milesLines: string[]; dates: string }>;
}

interface MavMonth {
  month: string;
  days: string;
  sortKey: number;
}

interface MavPalette {
  bg: string;
  panel: string;
  priceBoxBg: string;
  bright: string;
  dim: string;
  border: string;
  text: string;
  footerDim: string;
  showHeaderText: boolean;
}

export const MAV_PALETTES: Record<AlertDraft['mavVariant'], MavPalette> = {
  experiencias: {
    bg: '#FFFFFF',
    panel: '#F3F6FB',
    priceBoxBg: '#F5D98C',
    bright: '#0B2A5B',
    dim: '#4C6FA5',
    border: '#B9C9E2',
    text: '#1B2A41',
    footerDim: '#6B7A90',
    showHeaderText: true
  },
  milhasaovivo: {
    bg: '#FFFFFF',
    panel: '#F3F6FB',
    priceBoxBg: '#F5D98C',
    bright: '#0B2A5B',
    dim: '#4C6FA5',
    border: '#B9C9E2',
    text: '#1B2A41',
    footerDim: '#6B7A90',
    showHeaderText: false
  }
};

function font(size: number, bold: boolean) {
  return `${bold ? '700' : '400'} ${size}px ${FONT_FAMILY}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  const tracked = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const original = tracked.letterSpacing;
  tracked.letterSpacing = `${spacing}px`;
  const width = ctx.measureText(text).width;
  tracked.letterSpacing = original;
  return width;
}

function fillTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const tracked = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const original = tracked.letterSpacing;
  tracked.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  tracked.letterSpacing = original;
}

function fillTrackedCentered(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, spacing: number) {
  fillTracked(ctx, text, centerX - trackedWidth(ctx, text, spacing) / 2, y, spacing);
}

function mavStyles(typography: TypographySettings) {
  return {
    header: { size: 25 + typography.headerSize - STANDARD_TYPOGRAPHY.headerSize, bold: typography.headerBold },
    route: { size: 52 + typography.routeSize - STANDARD_TYPOGRAPHY.routeSize, bold: typography.routeBold },
    miles: { size: 35 + typography.milesSize - STANDARD_TYPOGRAPHY.milesSize, bold: typography.milesBold },
    dates: { size: 22 + typography.datesSize - STANDARD_TYPOGRAPHY.datesSize, bold: typography.datesBold },
    footer: { size: 19 + typography.footerSize - STANDARD_TYPOGRAPHY.footerSize, bold: typography.footerBold }
  };
}

function mavDrawCornerBrackets(ctx: CanvasRenderingContext2D, height: number, palette: MavPalette) {
  const len = 34;
  const inset = 26;
  const x1 = inset;
  const x2 = W - inset;
  const yTop = inset;
  const yBottom = height - inset;
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, yTop + len); ctx.lineTo(x1, yTop); ctx.lineTo(x1 + len, yTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2 - len, yTop); ctx.lineTo(x2, yTop); ctx.lineTo(x2, yTop + len); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, yBottom - len); ctx.lineTo(x1, yBottom); ctx.lineTo(x1 + len, yBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2 - len, yBottom); ctx.lineTo(x2, yBottom); ctx.lineTo(x2, yBottom - len); ctx.stroke();
  ctx.restore();
}

function mavDrawHeader(ctx: CanvasRenderingContext2D, y: number, height: number, classCarrier: string, headerStyle: TextStyle, palette: MavPalette, logo: HTMLImageElement | null) {
  const marginX = 72;
  roundRect(ctx, marginX, y, W - marginX * 2, height, height / 2.6);
  ctx.fillStyle = palette.panel;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  const boxSize = height - 10;
  const boxX = W - marginX - 13 - boxSize;
  const boxY = y + (height - boxSize) / 2;
  if (logo) {
    const scale = Math.min(boxSize / logo.width, boxSize / logo.height);
    const imageW = logo.width * scale;
    const imageH = logo.height * scale;
    ctx.drawImage(logo, boxX + (boxSize - imageW) / 2, boxY + (boxSize - imageH) / 2, imageW, imageH);
  }

  if (palette.showHeaderText) {
    const textEndX = boxX - 22;
    const line1 = 'EXPERIENCIAS';
    ctx.font = font(headerStyle.size, headerStyle.bold);
    const line1Width = trackedWidth(ctx, line1, 1.5);
    const line1X = textEndX - line1Width;
    ctx.fillStyle = palette.bright;
    fillTracked(ctx, line1, line1X, y + height / 2 - 6, 1.5);
    const line2 = 'AO VIVO';
    ctx.font = font(Math.max(10, Math.round(headerStyle.size * 0.67)), true);
    ctx.fillStyle = palette.dim;
    fillTracked(ctx, line2, line1X + (line1Width - trackedWidth(ctx, line2, 1.5)) / 2, y + height / 2 + 20, 1.5);
  }

  if (classCarrier) {
    ctx.font = font(headerStyle.size, headerStyle.bold);
    ctx.fillStyle = palette.bright;
    fillTracked(ctx, classCarrier, marginX + 24, y + height / 2 + 6, 1.2);
  }
}

function mavDrawDivider(ctx: CanvasRenderingContext2D, y: number, label: string, icon: string, palette: MavPalette) {
  const marginX = 72;
  const labelText = `${icon}  ${label}`;
  ctx.font = font(15, true);
  const labelWidth = trackedWidth(ctx, labelText, 3) + 30;
  const centerX = W / 2;
  ctx.strokeStyle = palette.dim;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(marginX, y); ctx.lineTo(centerX - labelWidth / 2, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(centerX + labelWidth / 2, y); ctx.lineTo(W - marginX, y); ctx.stroke();
  ctx.fillStyle = palette.bright;
  fillTrackedCentered(ctx, labelText, centerX, y + 5, 3);
}

function mavParseMonths(text: string): MavMonth[] {
  const currentYear = new Date().getFullYear();
  const groups: Record<string, MavMonth & { daysList: string[] }> = {};
  const addDay = (rawKey: string, year: number, day: string) => {
    const key = `${rawKey}-${year}`;
    const index = MONTH_ORDER.indexOf(rawKey);
    if (!groups[key]) groups[key] = { month: `${rawKey.toUpperCase()} ${year}`, days: '', daysList: [], sortKey: year * 12 + (index >= 0 ? index : 99) };
    groups[key].daysList.push(day.trim());
  };

  text.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const fullDate = line.match(/^(\d{1,2})[\u00BA\u00B0]?\s*de\s+([A-Za-z\u00C0-\u00FF]+)\s+de\s+(\d{4})\.?$/i);
    if (fullDate) {
      const monthIndex = MONTH_FULL.indexOf(normalizeAlertText(fullDate[2]));
      addDay(monthIndex >= 0 ? MONTH_ORDER[monthIndex] : normalizeAlertText(fullDate[2]).slice(0, 3), Number(fullDate[3]), fullDate[1]);
      return;
    }
    const match = line.match(/^([^/:]+?)\s*(?:\/\s*(\d{4}))?\s*:\s*(.*)$/);
    if (!match) return;
    const rawKey = normalizeAlertText(match[1]).slice(0, 3);
    const year = match[2] ? Number(match[2]) : currentYear;
    match[3].split(',').map((day) => day.trim()).filter(Boolean).forEach((day) => addDay(rawKey, year, day));
  });

  return Object.values(groups)
    .map(({ daysList, ...month }) => ({ ...month, days: daysList.join(', ') }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

function mavDrawPriceBox(ctx: CanvasRenderingContext2D, y: number, milesLines: string[], label: string, isRoundTrip: boolean, milesStyle: TextStyle, milesSpacing: number, bandNumber: number | null, palette: MavPalette) {
  const marginX = 72;
  const contentW = W - marginX * 2;
  const centerX = W / 2;
  const lines = milesLines.length ? milesLines : [''];
  const lineHeight = Math.round(milesStyle.size * milesSpacing);
  const topPadding = 34;
  const boxHeight = topPadding + lines.length * lineHeight + 20 - (lineHeight - milesStyle.size);
  roundRect(ctx, marginX, y, contentW, boxHeight, 16);
  ctx.fillStyle = palette.priceBoxBg;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = palette.border;
  ctx.stroke();
  let costLabel = `CUSTO POR PASSAGEIRO${isRoundTrip ? `  -  ${label}` : ''}`;
  if (bandNumber) costLabel += `   \u00B7   OPCAO ${bandNumber}`;
  ctx.font = font(13, true);
  ctx.fillStyle = palette.dim;
  fillTrackedCentered(ctx, costLabel, centerX, y + topPadding - 4, 2);

  lines.forEach((line, index) => {
    const parts = line.split(/\s*\+\s*/);
    const main = parts[0] || '';
    const extraText = parts.length > 1 ? `  + ${parts.slice(1).join(' + ')}` : '';
    const extraSize = Math.max(12, milesStyle.size - 11);
    ctx.font = font(milesStyle.size, milesStyle.bold);
    const mainWidth = ctx.measureText(main).width;
    ctx.font = font(extraSize, false);
    const extraWidth = extraText ? ctx.measureText(extraText).width : 0;
    const lineY = y + topPadding + (index + 1) * lineHeight - lineHeight * 0.28;
    const lineX = centerX - (mainWidth + extraWidth) / 2;
    ctx.font = font(milesStyle.size, milesStyle.bold);
    ctx.fillStyle = palette.bright;
    ctx.fillText(main, lineX, lineY);
    if (extraText) {
      ctx.font = font(extraSize, false);
      ctx.fillStyle = palette.dim;
      ctx.fillText(extraText, lineX + mainWidth, lineY);
    }
  });

  return y + boxHeight;
}

function mavDrawDatesBlock(ctx: CanvasRenderingContext2D, y: number, datesText: string, label: string, isRoundTrip: boolean, datesStyle: TextStyle, dateSpacing: number, palette: MavPalette) {
  const marginX = 72;
  const contentW = W - marginX * 2;
  const centerX = W / 2;
  ctx.font = font(13, true);
  ctx.fillStyle = palette.dim;
  fillTrackedCentered(ctx, isRoundTrip ? `DATAS DE ${label}` : 'DATAS COM DISPONIBILIDADE', centerX, y, 2);
  y += 42;

  const months = mavParseMonths(datesText);
  const columnGap = 40;
  const columnWidth = (contentW - columnGap) / 2;
  const halfway = Math.ceil(months.length / 2);
  const monthLabelSize = Math.max(12, datesStyle.size + 2);
  const lineGap = Math.round(datesStyle.size * dateSpacing);
  const rowHeight = Math.max(28, lineGap + 12);
  const drawColumn = (list: MavMonth[], columnX: number) => {
    let columnY = y;
    list.forEach((month) => {
      ctx.font = font(monthLabelSize, true);
      ctx.fillStyle = palette.bright;
      fillTracked(ctx, month.month, columnX, columnY, 1);
      const labelWidth = ctx.measureText(`${month.month}  `).width + 14;
      ctx.font = font(datesStyle.size, datesStyle.bold);
      ctx.fillStyle = palette.text;
      const lines: string[] = [];
      month.days.split(',').map((day) => day.trim()).filter(Boolean).forEach((day) => {
        const current = lines[lines.length - 1] || '';
        const candidate = current ? `${current} \u00B7 ${day}` : day;
        if (current && ctx.measureText(candidate).width > columnWidth - labelWidth) lines.push(day);
        else if (lines.length) lines[lines.length - 1] = candidate;
        else lines.push(candidate);
      });
      lines.forEach((line, index) => ctx.fillText(line, columnX + labelWidth, columnY + index * lineGap));
      columnY += rowHeight + Math.max(0, lines.length - 1) * lineGap;
    });
    return columnY;
  };

  const left = months.slice(0, halfway);
  const right = months.slice(halfway);
  const bottom = Math.max(drawColumn(left, marginX), drawColumn(right, marginX + columnWidth + columnGap));
  if (left.length && right.length) {
    const dividerX = marginX + columnWidth + columnGap / 2;
    ctx.save();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dividerX, y - 4); ctx.lineTo(dividerX, bottom - rowHeight * 0.3); ctx.stroke();
    ctx.restore();
  }
  return bottom;
}

function mavDrawLeg(ctx: CanvasRenderingContext2D, y: number, route: MavRouteData, label: string, icon: string, isRoundTrip: boolean, styles: ReturnType<typeof mavStyles>, draft: AlertDraft, palette: MavPalette) {
  mavDrawDivider(ctx, y, label, icon, palette);
  y += 46;
  const origin = route.origin.toUpperCase();
  const destination = route.destination.toUpperCase();
  const arrow = '  \u2192  ';
  let titleSize = styles.route.size;
  ctx.font = font(titleSize, styles.route.bold);
  while (ctx.measureText(`${origin}${arrow}${destination}`).width > W - 144 && titleSize > 24) {
    titleSize -= 2;
    ctx.font = font(titleSize, styles.route.bold);
  }
  const originWidth = ctx.measureText(origin).width;
  const arrowWidth = ctx.measureText(arrow).width;
  const destinationWidth = ctx.measureText(destination).width;
  const startX = W / 2 - (originWidth + arrowWidth + destinationWidth) / 2;
  y += titleSize * 0.85;
  ctx.fillStyle = palette.bright;
  ctx.fillText(origin, startX, y);
  ctx.fillText(arrow, startX + originWidth, y);
  ctx.fillText(destination, startX + originWidth + arrowWidth, y);

  const codeSize = Math.max(11, Math.round(titleSize * 0.26));
  y += codeSize + 20;
  ctx.font = font(codeSize, true);
  ctx.fillStyle = palette.dim;
  fillTrackedCentered(ctx, route.originCode, startX + originWidth / 2, y, 2);
  fillTrackedCentered(ctx, route.destinationCode, startX + originWidth + arrowWidth + destinationWidth / 2, y, 2);
  y += 40;

  const bands = route.bands.length ? route.bands : [{ milesLines: [], dates: '' }];
  bands.forEach((band, index) => {
    if (index > 0) y += 24;
    y = mavDrawPriceBox(ctx, y, band.milesLines, label, isRoundTrip, styles.miles, draft.typography.milesLineHeight, bands.length > 1 ? index + 1 : null, palette);
    y += 26;
    y = mavDrawDatesBlock(ctx, y, band.dates, label, isRoundTrip, styles.dates, draft.typography.datesLineHeight, palette);
  });
  return y;
}

export function buildMavRouteData(route: JourneyLeg, cia: string, cabinClass: string | null): MavRouteData {
  return {
    origin: route.origin,
    destination: route.destination,
    originCode: inferIataFromCity(route.origin),
    destinationCode: inferIataFromCity(route.destination),
    cia,
    cabinClass,
    bands: route.bands.map((band) => ({ milesLines: band.miles.split('\n').map((line) => line.trim()).filter(Boolean), dates: band.dates }))
  };
}

export function renderMavCanvas(canvas: HTMLCanvasElement, draft: AlertDraft, assets: CanvasAssets) {
  const palette = MAV_PALETTES[draft.mavVariant];
  const styles = mavStyles(draft.typography);
  const cia = extractCiaFromTitle(draft.title);
  const cabinClass = extractClassFromTitle(draft.title);
  const outbound = buildMavRouteData(draft.outbound, cia, cabinClass);
  const inbound = buildMavRouteData(draft.inbound, cia, cabinClass);
  const classCarrier = `${cabinClass || ''} ${cia || ''}`.trim().toUpperCase();
  const footerLines = draft.footersByTheme.milhasaovivo.split('\n').map((line) => line.trim()).filter(Boolean);
  const logo = assets.logos[MAV_LOGO_ASSET];

  const drawFrame = (ctx: CanvasRenderingContext2D) => {
    let y = 50;
    mavDrawHeader(ctx, y, 92, classCarrier, styles.header, palette, logo);
    y += 132 + draft.typography.headerRouteGap;
    y = mavDrawLeg(ctx, y, outbound, 'IDA', '\u2726', draft.tripMode === 'round-trip', styles, draft, palette);
    if (draft.tripMode === 'round-trip') {
      y += 14;
      ctx.save();
      ctx.strokeStyle = palette.dim;
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 5]);
      ctx.beginPath(); ctx.moveTo(72, y); ctx.lineTo(W - 72, y); ctx.stroke();
      ctx.restore();
      y += 34;
      y = mavDrawLeg(ctx, y, inbound, 'VOLTA', '\u21C4', true, styles, draft, palette);
    }
    y += 30;
    ctx.font = font(styles.footer.size, false);
    ctx.fillStyle = palette.dim;
    fillTrackedCentered(ctx, '\u25C6', W / 2, y, 0);
    y += 26;
    footerLines.forEach((line, index) => {
      const emphasized = footerLines.length > 2 ? index >= footerLines.length - 2 : index === footerLines.length - 1;
      const size = emphasized ? styles.footer.size + 5 : styles.footer.size;
      ctx.font = font(size, emphasized || styles.footer.bold);
      ctx.fillStyle = emphasized ? palette.bright : palette.footerDim;
      ctx.textAlign = 'center';
      ctx.fillText(line, W / 2, y);
      y += size + 10;
    });
    ctx.textAlign = 'left';
    return y + 20;
  };

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 3600;
  const measureContext = measureCanvas.getContext('2d');
  if (!measureContext) return;
  const height = drawFrame(measureContext);

  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, height);
  if (logo) {
    const watermarkWidth = Math.min(760, W - 144);
    const watermarkHeight = watermarkWidth * (logo.height / logo.width);
    const fittedHeight = Math.min(watermarkHeight, Math.max(60, height - 300));
    const fittedWidth = fittedHeight * (logo.width / logo.height);
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.drawImage(logo, (W - fittedWidth) / 2, 190 + (height - 300 - fittedHeight) / 2, fittedWidth, fittedHeight);
    ctx.restore();
  }
  mavDrawCornerBrackets(ctx, height, palette);
  drawFrame(ctx);
}
