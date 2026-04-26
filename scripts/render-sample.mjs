import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { renderAlertImage } from '../src/lib/rendering/render-alert-image';
import { samplePayload } from '../src/lib/templates/sample-data';

await mkdir(path.join(process.cwd(), 'output'), { recursive: true });
const filePath = await renderAlertImage(samplePayload, 'sample-render.png');
console.log(`Sample image saved at ${filePath}`);
