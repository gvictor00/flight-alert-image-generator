# flight-alert-image-generator

Protótipo inicial da plataforma interna de geração de imagens de alertas aéreos.

## Stack

- Next.js 15
- React 19
- TypeScript
- Playwright
- Zod

## Objetivo desta etapa

Entregar o núcleo do sistema para:

- editar dados manualmente em uma UI simples;
- pré-visualizar a imagem no navegador;
- renderizar a imagem final em PNG 1080x1080;
- salvar histórico mínimo das gerações.

## Estrutura principal

- `app/` rotas e API routes
- `src/components/forms/` formulário do operador
- `src/components/preview/` componente visual compartilhado entre preview e renderização final
- `src/lib/rendering/` engine de render, documento HTML estático e persistência simples de histórico
- `src/lib/templates/` tipos, temas e payload de exemplo
- `src/lib/validation/` schema de validação
- `public/assets/` imagens e placeholders
- `output/` imagens exportadas
- `data/history.json` histórico inicial

## Como rodar

```bash
npm install
npx playwright install chromium
npm run dev
```

Depois, abra o projeto no navegador e use o botão **Gerar PNG**.

## Observações

- Nesta etapa, a aplicação usa placeholders visuais para destino e avião.
- A heurística de shrink dinâmico de fonte ainda não foi implementada.
- O contrato JSON já existe e está preparado para futura API externa.
