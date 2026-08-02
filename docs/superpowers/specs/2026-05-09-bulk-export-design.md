# Design: Geração em Massa de Criativos (Bulk Export)

**Data:** 2026-05-09  
**Status:** Aprovado

---

## Resumo

Adicionar um botão "Gerar para todos os temas" ao `AlertImageForm` que itera sequencialmente por todos os brand themes, chama a `/api/render` existente para cada um, e entrega ao usuário um único arquivo `.zip` com as imagens geradas.

---

## Escopo

- **Inclui:** botão de bulk no formulário, loop de renderização sequencial, empacotamento ZIP no cliente, download automático, feedback de progresso e tratamento de erros parciais.
- **Não inclui:** novos endpoints de servidor, alteração na API de render, persistência de histórico para renders em lote, alteração no preview durante o processo.

---

## Arquitetura e Fluxo

Toda a lógica nova fica no cliente (`AlertImageForm`). Nenhum arquivo de servidor é alterado.

### Fluxo ao clicar "Gerar para todos os temas"

1. Captura um `timestamp` compartilhado (formato ISO compacto, ex.: `20260509T143000`) para nomear todos os arquivos do lote.
2. Itera `brandThemes` do `themes.ts` **sequencialmente** (não em paralelo, para evitar sobrecarga do Playwright).
3. Para cada tema:
   - Constrói um payload derivado do estado atual do formulário, sobrescrevendo apenas `themeKey`.
   - Faz `POST /api/render` com `AbortController` de **60 s**.
   - Atualiza o indicador de progresso: `"Gerando {current} de {total}…"`.
   - Em caso de falha (rede, timeout, resposta não-ok): loga `console.error` com o nome do tema e continua.
4. Ao final, acumula os blobs bem-sucedidos em memória.
5. Se nenhum blob foi coletado: exibe erro na UI, não cria ZIP.
6. Caso contrário: usa `jszip` para montar o ZIP e dispara o download via `URL.createObjectURL`.

O estado React do formulário (`payload`) **não é modificado** durante o processo — apenas as requisições individuais usam o `themeKey` temporário.

---

## Componentes e Estado

### Novo estado no `AlertImageForm`

```typescript
const [isBulkRendering, setIsBulkRendering] = useState(false);
const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
const [bulkResult, setBulkResult] = useState<{ count: number; errors: number } | null>(null);
```

### Botão novo

Adicionado ao lado de "Gerar PNG" na área de ações existente:

```
[ Gerar PNG ]  [ Gerar para todos os temas ]  [ Restaurar exemplo ]
```

- Desabilitado quando `isRendering || isBulkRendering`.
- Texto durante operação: `"Gerando {current} de {total}…"` (o botão em si exibe o progresso).

### Mensagens de resultado (mesmo padrão das existentes)

| Situação | Mensagem |
|---|---|
| Todos os temas ok | "ZIP gerado com 2 imagens. Download iniciado." |
| Falha parcial | "ZIP gerado com 1 imagem. 1 tema falhou (ver console)." |
| Falha total | "Nenhuma imagem foi gerada. Verifique o console." |

---

## Nomenclatura dos Arquivos

Padrão: `{rota}-{timestamp}-{tema}.png`

- **`{rota}`:** `payload.outbound.route` sanitizado — espaços e caracteres não-alfanuméricos (exceto `-`) substituídos por `-`.
- **`{timestamp}`:** capturado uma vez no início do lote, formato `YYYYMMDDTHHmmss`, idêntico para todos os arquivos.
- **`{tema}`:** `theme.name` formatado para filename — espaços substituídos por `-`.

Exemplos:
- `GRU-CDG-20260509T143000-Executiva-com-Milhas.png`
- `GRU-CDG-20260509T143000-First-Class.png`

O arquivo ZIP segue o padrão: `{rota}-{timestamp}-bulk.zip`

---

## Tratamento de Erros

| Cenário | Comportamento |
|---|---|
| Erro de rede / resposta não-ok | `console.error` com nome do tema; loop continua |
| Timeout (>60 s) | `AbortController` cancela a requisição; tratado como falha do tema |
| Lote sem nenhum sucesso | Nenhum ZIP criado; exibe mensagem de erro na UI |
| Falha parcial (≥1 sucesso) | ZIP criado com os blobs disponíveis; mensagem indica quantos falharam |

---

## Dependência Nova

- **`jszip`** (client-side) — para montar o arquivo ZIP no browser a partir dos blobs coletados.
- Instalação: `npm install jszip` + `npm install --save-dev @types/jszip`

---

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/components/forms/alert-image-form.tsx` | Estado novo, função `handleBulkRender`, botão novo, mensagens de resultado |
| `package.json` | Adição de `jszip` e `@types/jszip` |
