import { promises as fs } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { buildRenderDocument } from '@/lib/rendering/document';
import type { AlertImagePayload } from '@/lib/templates/types';

export async function renderAlertImage(payload: AlertImagePayload, fileName: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public');
  const html = await buildRenderDocument(payload, { publicDir });
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const pendingImages = Array.from(document.images)
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            })
        );

      await Promise.all(pendingImages);
    });

    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, fileName);
    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
      omitBackground: false,
      type: 'png'
    });

    return outputPath;
  } finally {
    await browser.close();
  }
}
