import { promises as fs } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { buildRenderDocument } from '@/lib/rendering/document';
import type { AlertImagePayload } from '@/lib/templates/types';

export async function renderAlertImage(payload: AlertImagePayload, fileName: string): Promise<string> {
  const html = buildRenderDocument(payload);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });

    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, fileName);
    await page.screenshot({ path: outputPath, omitBackground: false, type: 'png' });

    return outputPath;
  } finally {
    await browser.close();
  }
}
