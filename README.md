# flight-alert-image-generator

Aplicacao interna para gerar imagens de alertas aereos e acompanhar historico operacional de envio.

## Stack

- Next.js 15
- React 19
- TypeScript
- Canvas API client-side
- Supabase Postgres/Storage para dashboard e historico
- Vitest

## Como rodar

```powershell
$env:Path += ";C:\Projects\node20"
npm install
npm run dev
```

Depois, abra o endereco indicado pelo Next no navegador.

## Supabase Setup

1. Crie um projeto no Supabase.
2. Execute `docs/db/supabase-alerts-schema.sql` no SQL editor.
3. Crie um Storage bucket publico chamado `alert-cards`.
4. Copie `.env.example` para `.env.local`.
5. Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e, se necessario, `SUPABASE_STORAGE_BUCKET`.
6. Reinicie o servidor Next.

O arquivo `.env.example` e apenas um modelo. O Next carrega `.env.local` durante o desenvolvimento local.

O gerador funciona sem Supabase. Dashboard, historico, importacao CSV, status de envio e arquivo de JPEGs gerados dependem do Supabase.

## Estrutura principal

- `src/app/`: pagina principal e API routes internas.
- `src/components/generator/`: controles, preview e exportacao dos cards.
- `src/components/dashboard/`: dashboard, historico, importacao CSV e sugestoes de rotas.
- `src/lib/canvas/`: renderizacao canvas client-side.
- `src/lib/alerts/`: tipos, normalizacao, importacao e helpers de dashboard.
- `src/lib/server/`: cliente Supabase server-side.
- `public/assets/`: logos, aviao e banco estatico de destinos.
- `docs/db/`: schema SQL do Supabase.

## Verificacao

```powershell
$env:Path += ";C:\Projects\node20"
npm test
npm run build
```
