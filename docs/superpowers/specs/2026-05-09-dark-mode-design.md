# Design: Suporte a Temas Claro e Escuro (Dark Mode)

**Data:** 2026-05-09
**Status:** Aprovado

---

## Resumo

Adicionar alternância claro/escuro à UI da aplicação usando `darkMode: 'class'` do Tailwind. Um `ThemeProvider` controla a classe `dark` no `<html>` e persiste a preferência em `localStorage`. O toggle (ícone sol/lua) fica no cabeçalho existente do formulário. Preview e renderização Playwright permanecem completamente isolados.

---

## Escopo

- **Inclui:** infraestrutura de tema (ThemeProvider + ThemeToggle), variantes `dark:` em todos os componentes de UI, persistência em localStorage, fallback para `prefers-color-scheme` na ausência de preferência salva.
- **Não inclui:** alterações no preview (`PreviewScaffold`, `AlertImagePreview`, `ResponsivePreview`'s inner canvas), no documento Playwright (`document.tsx`), nos temas de marca (`themes.ts`), ou em qualquer lógica de renderização de imagem.

---

## Arquitetura

### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/components/common/ThemeProvider.tsx` | Context + lógica de toggle + leitura/escrita de localStorage + aplicação da classe `dark` no `<html>` |
| `src/components/common/ThemeToggle.tsx` | Botão com ícone `Sun`/`Moon` (lucide-react) que consome `useTheme()` |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `tailwind.config.ts` | Adiciona `darkMode: 'class'` |
| `src/app/globals.css` | Adiciona variantes dark para `body` (background + texto) |
| `src/app/layout.tsx` | Envolve `{children}` com `<ThemeProvider>`; adiciona `suppressHydrationWarning` ao `<html>` |
| `src/components/forms/alert-image-form.tsx` | Adiciona `<ThemeToggle />` no `<header>`; adiciona `dark:` nas classes inline (`inputClassName`, `textAreaClassName`, `sectionClassName`) |
| `src/components/common/Panel.tsx` | Variantes `dark:` no fundo, borda, texto |
| `src/components/common/Field.tsx` | Variantes `dark:` nos labels e hint |
| `src/components/common/CollapsibleSection.tsx` | Variante `dark:` no texto do título |
| `src/components/common/JourneyEditor.tsx` | Variantes `dark:` nas classes constantes e elementos inline |
| `src/components/preview/ResponsivePreview.tsx` | Variantes `dark:` apenas no **wrapper externo** (borda e fundo da moldura) — o canvas interno não é tocado |

---

## ThemeProvider

```tsx
// src/components/common/ThemeProvider.tsx
'use client';
// Lê localStorage('theme') na montagem.
// Se 'dark' → adiciona classe 'dark' ao document.documentElement.
// Se 'light' → remove.
// Se ausente → usa window.matchMedia('prefers-color-scheme: dark') como fallback.
// Persiste em localStorage a cada toggle.
// Exporta: ThemeProvider (wrapper) + useTheme(): { theme: 'light'|'dark', toggleTheme: () => void }
```

---

## Paleta Dark Mode

A paleta usa a escala zinc do Tailwind, simétrica à escala light:

| Elemento | Light | Dark |
|---|---|---|
| Body background | `bg-slate-100` | `dark:bg-zinc-950` |
| Body text | `text-slate-800` | `dark:text-zinc-100` |
| Panel background | `bg-white/70` | `dark:bg-zinc-900/70` |
| Panel border | `border-zinc-200/60` | `dark:border-zinc-700/60` |
| Input background | `bg-zinc-50/50` | `dark:bg-zinc-800/50` |
| Input border | `border-zinc-200` | `dark:border-zinc-700` |
| Input text | `text-zinc-900` | `dark:text-zinc-100` |
| Input focus ring | `focus:ring-zinc-900/10` | `dark:focus:ring-zinc-100/10` |
| Input focus border | `focus:border-zinc-900` | `dark:focus:border-zinc-400` |
| Label text | `text-zinc-900` | `dark:text-zinc-100` |
| Hint / secondary text | `text-zinc-500` | `dark:text-zinc-400` |
| Section background | `bg-zinc-50/30` | `dark:bg-zinc-800/30` |
| Section border | `border-zinc-200/80` | `dark:border-zinc-700/80` |
| Primary button | `bg-zinc-900 text-white` | `dark:bg-zinc-100 dark:text-zinc-900` |
| Secondary button | `bg-white text-zinc-700 border-zinc-200/80` | `dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700/80` |
| Preview wrapper | `border-slate-200 bg-slate-50` | `dark:border-zinc-700 dark:bg-zinc-900` |

---

## Toggle (ThemeToggle)

- Ícone `Moon` quando o tema ativo é `light` (clica para escurecer)
- Ícone `Sun` quando o tema ativo é `dark` (clica para clarear)
- Botão arredondado (`rounded-full`), tamanho 36×36 px
- Posicionado no canto direito do `<header>` do `AlertImageForm` via `flex justify-between items-start` no container do header

---

## Persistência

- Chave: `localStorage.getItem('theme')` → `'light'` | `'dark'`
- Lida na montagem do `ThemeProvider` (client-side only — sem SSR)
- `suppressHydrationWarning` no `<html>` evita mismatch de hidratação

---

## Isolamento do Preview

O `PreviewScaffold` e seus filhos usam exclusivamente `style` props com cores derivadas do `BrandTheme` — nenhum Tailwind class de cor. **Nenhum arquivo de preview é alterado.**

O wrapper do `ResponsivePreview` (a moldura externa com `border-dashed`) recebe variantes `dark:` apenas no seu fundo e borda, **não** no canvas interno.

O documento Playwright (`src/lib/rendering/document.tsx`) não é tocado — a renderização é server-side e não tem acesso ao DOM do browser.

---

## Arquivos Não Alterados

- `src/components/preview/` (todos os arquivos internos)
- `src/lib/rendering/`
- `src/lib/templates/`
- `src/app/api/`
