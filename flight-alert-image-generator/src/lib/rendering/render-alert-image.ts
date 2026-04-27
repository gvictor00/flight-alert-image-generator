import { promises as fs } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { buildRenderDocument } from '@/lib/rendering/document';
import type { AlertImagePayload } from '@/lib/templates/types';

export async function renderAlertImage(payload: AlertImagePayload, fileName: string): Promise<string> {
  console.log('Starting renderAlertImage...');
  const html = buildRenderDocument(payload);
  console.log('HTML document built.');

  const browser = await chromium.launch({ headless: true });
  console.log('Browser launched.');

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
    console.log('New page created.');

    await page.setContent(html, { waitUntil: 'networkidle' });
    console.log('HTML content set on page.');

    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });
    console.log('Output directory ensured.');

    const outputPath = path.join(outputDir, fileName);
    await page.screenshot({ path: outputPath, omitBackground: false, type: 'png' });
    console.log(`Screenshot saved at ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('Error during renderAlertImage:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}
