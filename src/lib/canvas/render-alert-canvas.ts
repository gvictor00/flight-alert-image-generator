import type { AlertDraft, CanvasAssets, CanvasTheme, JourneyLeg, TypographySettings } from './types';

const W = 1080;
const PHOTO_BOX = { x: 778, y: 34, w: 260, h: 260, r: 22 };
const FONT_FAMILY = 'Poppins, Montserrat, Arial, sans-serif';

interface Bounds {
  marginX: number;
  rightEdge: number;
  photoBottom: number;
  startY: number;
}

interface TextStyle {
  size: number;
  bold: boolean;
}

interface MonthLine {
  month: string | null;
  days: string;
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

function roundRectBottom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.closePath();
}

function font(size: number, bold: boolean) {
  return `${bold ? '700' : '400'} ${size}px ${FONT_FAMILY}`;
}

function drawPhotoBox(ctx: CanvasRenderingContext2D, theme: CanvasTheme, assets: CanvasAssets, boxOverride?: typeof PHOTO_BOX) {
  const { x, y, w, h, r } = boxOverride || PHOTO_BOX;
  const activePhoto = theme.photoBank === 'gomiles' ? assets.gomilesDestinationPhoto : assets.destinationPhoto;

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

  if (activePhoto) {
    const scale = Math.max(w / activePhoto.width, h / activePhoto.height);
    const iw = activePhoto.width * scale;
    const ih = activePhoto.height * scale;
    ctx.drawImage(activePhoto, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, theme.photoGradTop);
    grad.addColorStop(1, theme.photoGradBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  if (assets.plane && !theme.noPlane) {
    const pw = w * 0.92;
    const ph = pw * (assets.plane.height / assets.plane.width);
    const px = x + w / 2 - pw / 2 + 4;
    const py = y + h - ph * 0.62;
    ctx.drawImage(assets.plane, px, py, pw, ph);
  }
}

export function parseMonthLines(text: string): MonthLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { month: null, days: line };
      return { month: line.slice(0, idx).trim(), days: line.slice(idx + 1).trim() };
    })
    .filter((line) => line.days);
}

function drawMonthBlock(
  ctx: CanvasRenderingContext2D,
  month: string | null,
  daysStr: string,
  x: number,
  y: number,
  maxRight: number,
  datesStyle: TextStyle,
  theme: CanvasTheme,
  dateSpacing: number
) {
  if (!daysStr) return y;
  const lh = Math.round(datesStyle.size * dateSpacing);
  const daysBold = datesStyle.bold;

  if (!month) {
    ctx.font = font(datesStyle.size, daysBold);
    ctx.fillStyle = theme.dateText;
    const words = daysStr.split(' ');
    let line = '';
    let curY = y;
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxRight - x && line) {
        ctx.fillText(line, x, curY);
        curY += lh;
        line = word;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, x, curY);
    return curY + lh + Math.round(lh * 0.35);
  }

  ctx.font = font(datesStyle.size, true);
  ctx.fillStyle = theme.dateLabel;
  ctx.fillText(`${month}:`, x, y);
  const labelW = ctx.measureText(`${month}: `).width;
  const indent = x + Math.max(labelW + 8, 90);
  ctx.font = font(datesStyle.size, daysBold);
  ctx.fillStyle = theme.dateText;

  const words = daysStr.split(',').map((word) => word.trim()).filter(Boolean);
  let line = '';
  let curY = y;
  let firstLine = true;

  words.forEach((word) => {
    const test = line ? `${line}, ${word}` : word;
    const startX = firstLine ? indent : x;
    const limit = maxRight - startX;
    if (ctx.measureText(test).width > limit && line) {
      ctx.fillText(`${line},`, startX, curY);
      curY += lh;
      firstLine = false;
      line = word;
    } else {
      line = test;
    }
  });

  ctx.fillText(line, firstLine ? indent : x, curY);
  return curY + lh + Math.round(lh * 0.35);
}

function drawDottedLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawRouteBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxRight: number,
  route: JourneyLeg,
  routeStyle: TextStyle,
  milesStyle: TextStyle,
  datesStyle: TextStyle,
  theme: CanvasTheme,
  minDatesY: number | null,
  milesSpacing: number,
  dateSpacing: number
) {
  const titleGap = Math.round(routeStyle.size * 1.35);
  const milesLineH = Math.round(milesStyle.size * milesSpacing);
  const trailingGap = Math.round(milesStyle.size * 0.85);
  const firstLines = (route.bands[0]?.miles || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const firstMilesBlockH = firstLines.length * milesLineH + trailingGap;

  if (minDatesY) {
    const naturalDatesY = y + titleGap + firstMilesBlockH;
    if (naturalDatesY < minDatesY) y += minDatesY - naturalDatesY;
  }

  ctx.font = font(routeStyle.size, routeStyle.bold);
  ctx.fillStyle = theme.routeTitle;
  if (theme.separatorColor) {
    const sep = ` ${theme.separatorChar || '-'} `;
    const origemW = ctx.measureText(route.origin).width;
    const sepW = ctx.measureText(sep).width;
    ctx.fillText(route.origin, x, y);
    ctx.fillStyle = theme.separatorColor;
    ctx.fillText(sep, x + origemW, y);
    ctx.fillStyle = theme.routeTitle;
    ctx.fillText(route.destination, x + origemW + sepW, y);
  } else {
    ctx.fillText(`${route.origin} - ${route.destination}`, x, y);
  }
  y += titleGap;

  route.bands.forEach((band, index) => {
    if (index > 0) {
      y += 6;
      drawDottedLine(ctx, x, maxRight, y, theme.divider);
      y += 22;
    }

    const milesLines = band.miles.split('\n').map((line) => line.trim()).filter(Boolean);
    ctx.font = font(milesStyle.size, milesStyle.bold);
    ctx.fillStyle = theme.miles;
    milesLines.forEach((line) => {
      ctx.fillText(line, x, y);
      y += milesLineH;
    });
    y += trailingGap;

    parseMonthLines(band.dates).forEach((month) => {
      y = drawMonthBlock(ctx, month.month, month.days, x, y, maxRight, datesStyle, theme, dateSpacing);
    });
  });

  return y;
}

function footerLineHeights(footerStyle: TextStyle, numLines: number) {
  const firstBaseline = Math.round(footerStyle.size * 1.6);
  const lineSpacing = Math.round(footerStyle.size * 1.42);
  const bottomPad = Math.round(footerStyle.size * 0.9);
  const footerH = firstBaseline + Math.max(0, numLines - 1) * lineSpacing + bottomPad;
  return { firstBaseline, lineSpacing, footerH };
}

function wrapCanvasLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number) {
  if (ctx.measureText(line).width <= maxWidth) return [line];

  const words = line.split(' ').filter(Boolean);
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      wrapped.push(current);
      current = word;
    } else {
      current = test;
    }
  });

  if (current) wrapped.push(current);
  return wrapped;
}

function wrapFooterLines(ctx: CanvasRenderingContext2D, lines: string[], footerStyle: TextStyle, theme: CanvasTheme, bounds: Bounds) {
  const logoReserve = theme.footerLogoMode === 'powered' ? 170 : 230;
  const maxWidth = Math.max(360, bounds.rightEdge - bounds.marginX - logoReserve);
  ctx.font = font(footerStyle.size, footerStyle.bold);
  return lines.flatMap((line) => wrapCanvasLine(ctx, line, maxWidth));
}

function drawHazardStripe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c1: string, c2: string, stripeW: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const total = w + h;
  let i = 0;
  for (let sx = -h; sx < total; sx += stripeW * 2) {
    ctx.fillStyle = i % 2 === 0 ? c1 : c2;
    ctx.beginPath();
    ctx.moveTo(x + sx, y + h);
    ctx.lineTo(x + sx + h, y);
    ctx.lineTo(x + sx + h + stripeW, y);
    ctx.lineTo(x + sx + stripeW, y + h);
    ctx.closePath();
    ctx.fill();
    i++;
  }
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, footerTop: number, lines: string[], footerStyle: TextStyle, theme: CanvasTheme, assets: CanvasAssets, bounds: Bounds & { left?: number; right?: number; radius?: number }, minHeight: number) {
  const { firstBaseline, lineSpacing, footerH: naturalFooterH } = footerLineHeights(footerStyle, Math.max(1, lines.length));
  const footerH = Math.max(naturalFooterH, minHeight);
  const extraSpace = footerH - naturalFooterH;
  const left = bounds.left ?? 0;
  const right = bounds.right ?? W;
  const textX = bounds.marginX;
  const textRight = bounds.rightEdge;
  const barW = right - left;

  ctx.fillStyle = theme.footerBg;
  if (bounds.radius) {
    roundRectBottom(ctx, left, footerTop, barW, footerH, bounds.radius);
    ctx.fill();
  } else {
    ctx.fillRect(left, footerTop, barW, footerH);
  }
  if (theme.hazard) drawHazardStripe(ctx, left, footerTop, 230, 16, theme.hazard[0], theme.hazard[1], 16);

  ctx.font = font(footerStyle.size, footerStyle.bold);
  ctx.textAlign = 'left';
  let ly = footerTop + firstBaseline + extraSpace / 2 + (theme.hazard ? 14 : 0);
  lines.forEach((line, index) => {
    ctx.fillStyle = index === lines.length - 1 && theme.footerSub ? theme.footerSub : theme.footerText;
    ctx.fillText(line, textX, ly);
    ly += lineSpacing;
  });

  if (theme.footerLogoMode === 'own' && theme.ownLogoAsset) {
    const logo = assets.logos[theme.ownLogoAsset];
    if (!logo) return footerTop + footerH;
    const logoH = 68;
    const logoW = logoH * (logo.width / logo.height);
    const padX = 18;
    const padY = 10;
    const chipW = logoW + padX * 2;
    const chipH = logoH + padY * 2;
    const chipX = textRight - chipW;
    const chipY = footerTop + (footerH - chipH) / 2;
    ctx.drawImage(logo, chipX + padX, chipY + padY, logoW, logoH);
  } else if (theme.footerLogoMode === 'powered' && theme.poweredLogoAsset) {
    const logo = assets.logos[theme.poweredLogoAsset];
    if (!logo) return footerTop + footerH;
    const labelH = 15;
    const gap = 8;
    const logoH = 64;
    const blockH = labelH + gap + logoH;
    const blockTop = footerTop + (footerH - blockH) / 2;
    ctx.font = `700 14px ${FONT_FAMILY}`;
    const label = 'POWERED BY:';
    const textWidth = ctx.measureText(label).width;
    const centerX = textRight - textWidth / 2;
    ctx.fillStyle = theme.footerSub || theme.footerText;
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX, blockTop + labelH);
    ctx.textAlign = 'left';
    const logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, centerX - logoW / 2, blockTop + labelH + gap, logoW, logoH);
  }

  return footerTop + footerH;
}

function drawWatermark(ctx: CanvasRenderingContext2D, bandTop: number, bandBottom: number, logo: HTMLImageElement | null, opacity: number, bounds?: { centerX: number; maxWidth: number }) {
  if (!logo) return;
  const centerX = bounds ? bounds.centerX : W / 2;
  const maxW = bounds ? bounds.maxWidth : 760;
  let wmW = maxW;
  let wmH = wmW * (logo.height / logo.width);
  const bandH = Math.max(60, bandBottom - bandTop);
  if (wmH > bandH) {
    wmH = bandH;
    wmW = wmH * (logo.width / logo.height);
  }
  const wmX = centerX - wmW / 2;
  let wmY = bandTop + (bandH - wmH) / 2;
  wmY = Math.min(Math.max(wmY, bandTop), bandBottom - wmH);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(logo, wmX, wmY, wmW, wmH);
  ctx.restore();
}

function drawBrandMark(ctx: CanvasRenderingContext2D, bandTop: number, bandBottom: number, logo: HTMLImageElement | null) {
  if (!logo) return;
  const maxH = 76;
  const bandH = bandBottom - bandTop;
  const logoH = Math.min(maxH, bandH * 0.7);
  const logoW = logoH * (logo.width / logo.height);
  const lx = W - 42 - logoW;
  const ly = bandTop + (bandH - logoH) / 2;
  ctx.drawImage(logo, lx, ly, logoW, logoH);
}

function textStyles(typography: TypographySettings) {
  return {
    header: { size: typography.headerSize, bold: typography.headerBold },
    route: { size: typography.routeSize, bold: typography.routeBold },
    miles: { size: typography.milesSize, bold: typography.milesBold },
    dates: { size: typography.datesSize, bold: typography.datesBold },
    footer: { size: typography.footerSize, bold: typography.footerBold }
  };
}

function layout(ctx: CanvasRenderingContext2D, theme: CanvasTheme, draft: AlertDraft, bounds: Bounds) {
  const styles = textStyles(draft.typography);
  let y = bounds.startY + Math.round(styles.route.size * 0.4);
  const minDatesY1 = bounds.photoBottom + 70;

  y = drawRouteBlock(ctx, bounds.marginX, y, bounds.rightEdge, draft.outbound, styles.route, styles.miles, styles.dates, theme, minDatesY1, draft.typography.milesLineHeight, draft.typography.datesLineHeight);

  if (draft.tripMode === 'round-trip') {
    y += 10;
    ctx.strokeStyle = theme.divider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bounds.marginX, y);
    ctx.lineTo(bounds.rightEdge, y);
    ctx.stroke();
    y += 50;
    y = drawRouteBlock(ctx, bounds.marginX, y, bounds.rightEdge, draft.inbound, styles.route, styles.miles, styles.dates, theme, null, draft.typography.milesLineHeight, draft.typography.datesLineHeight);
  }

  return y;
}

export function renderAlertCanvas(canvas: HTMLCanvasElement, draft: AlertDraft, theme: CanvasTheme, assets: CanvasAssets) {
  const frame = theme.frame;
  const inset = frame ? frame.inset : 0;
  const marginX = frame ? inset + 34 : 42;
  const rightEdge = frame ? W - inset - 34 : 1038;
  const elementsTopY = frame ? inset + 8 : 34;
  const cardTop = frame ? inset + 50 : inset;
  const photoBox = frame ? { x: W - inset - 34 - 260, y: elementsTopY, w: 260, h: 260, r: 22 } : PHOTO_BOX;
  const photoBottom = photoBox.y + photoBox.h;
  const startY = (frame ? elementsTopY + 96 : 150) + draft.typography.headerRouteGap;
  const bounds: Bounds = { marginX, rightEdge, photoBottom, startY };

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 3000;
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) return;
  const contentEndY = layout(mctx, theme, draft, bounds);

  const styles = textStyles(draft.typography);
  const footerLines = wrapFooterLines(
    mctx,
    draft.footersByTheme[theme.key].split('\n').map((line) => line.trim()).filter(Boolean),
    styles.footer,
    theme,
    bounds
  );
  const brandBandH = theme.brandMarkAsset ? 110 : 40;
  const footerTop = contentEndY + brandBandH;
  const { footerH } = footerLineHeights(styles.footer, Math.max(1, footerLines.length));
  const height = footerTop + Math.max(footerH, 90) + (frame ? inset : 0);

  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (frame) {
    const grad = ctx.createLinearGradient(0, 0, W, height);
    grad.addColorStop(0, frame.outerBg[0]);
    grad.addColorStop(1, frame.outerBg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, height);
    ctx.fillStyle = theme.bg;
    roundRect(ctx, inset, cardTop, W - inset * 2, height - inset - cardTop, frame.radius);
    ctx.fill();
  } else {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, height);
  }

  if (theme.watermarkAsset) {
    const wmBounds = frame ? { centerX: W / 2, maxWidth: (W - inset * 2) * 0.72 } : undefined;
    drawWatermark(ctx, frame ? inset + 260 : 320, footerTop - 20, assets.logos[theme.watermarkAsset], theme.watermarkOpacity, wmBounds);
  }

  if (theme.headerStyle === 'pill') {
    const headerSize = styles.header.size * 0.72;
    ctx.font = font(headerSize, styles.header.bold);
    const label = draft.title.toUpperCase();
    const padX = 22;
    const padY = 14;
    const textW = ctx.measureText(label).width;
    const pillW = textW + padX * 2;
    const pillH = headerSize + padY * 1.6;
    ctx.fillStyle = theme.header;
    roundRect(ctx, marginX, elementsTopY, pillW, pillH, 14);
    ctx.fill();
    ctx.fillStyle = theme.headerTextColor || '#FFFFFF';
    ctx.fillText(label, marginX + padX, elementsTopY + pillH / 2 + headerSize * 0.36);
  } else {
    ctx.font = font(styles.header.size, styles.header.bold);
    ctx.fillStyle = theme.header;
    ctx.fillText(draft.title.toUpperCase(), 42, 34 + styles.header.size);
  }

  drawPhotoBox(ctx, theme, assets, photoBox);
  layout(ctx, theme, draft, bounds);

  if (theme.brandMarkAsset) {
    drawBrandMark(ctx, contentEndY + 10, footerTop - 10, assets.logos[theme.brandMarkAsset]);
  }

  const footerBounds = frame ? { ...bounds, left: inset, right: W - inset, radius: frame.radius } : bounds;
  drawFooter(ctx, footerTop, footerLines, styles.footer, theme, assets, footerBounds, 90);
}
