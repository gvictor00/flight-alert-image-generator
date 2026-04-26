import { renderToStaticMarkup } from 'react-dom/server';
import { AlertImagePreview } from '@/components/preview/alert-image-preview';
import type { AlertImagePayload } from '@/lib/templates/types';

export function buildRenderDocument(payload: AlertImagePayload): string {
  const body = renderToStaticMarkup(<AlertImagePreview payload={payload} />);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        font-family: Montserrat, Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}
