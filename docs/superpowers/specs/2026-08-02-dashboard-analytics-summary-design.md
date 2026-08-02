# Dashboard Analytics And Alert Summary Design

## Goal

Evoluir a tela de dashboard do Next para ficar mais próxima do `Gerador de Alertas ECMv2.html`, adicionando filtros por período, tabelas operacionais, análise por programa de fidelidade, matriz de rotas e um gerador de resumo para WhatsApp baseado no histórico do Supabase.

## Scope

Esta etapa cobre apenas a dashboard e pequenos ajustes de layout global relacionados a ela:

- filtro de dias/período para dados históricos;
- reposicionamento do botão claro/escuro para a barra superior;
- grade de previews limitada a no máximo 2 canvas por linha em telas largas;
- estatísticas por grupo em formato de tabela;
- tabela histórica por operador;
- painel por programa de fidelidade;
- tabela de rotas e últimas buscas;
- gerador de resumo dos alertas para WhatsApp.

Não entram nesta etapa:

- biblioteca externa de gráficos;
- autenticação de usuários;
- persistência server-side dos rascunhos de resumo;
- alteração do formato visual dos cards exportados em canvas;
- reescrita completa do histórico agrupado.

## References From ECMv2 HTML

O HTML tem os seguintes blocos como referência funcional:

- `PROGRAM_KEYWORDS`, `detectProgramas`, `renderProgramStats`: painel por programa de fidelidade com filtro de período e barras simples.
- `renderRouteTable`: tabela `Rota | GMC | ECM | FC | EAV | MAV | Status | Total`, com busca, ordenação e ajuste inline de dias mínimos.
- `renderGroupStats` e `renderGoalsPanel`: dados por grupo e metas diárias.
- `renderHistory`: filtros de histórico por período/grupo/busca.

## Data Source

Todos os dados históricos devem vir da tabela `alerts` do Supabase através das APIs internas do Next.

O frontend pode transformar esses dados em estruturas derivadas, mas não deve consultar Supabase diretamente no browser.

O filtro de período deve ser aplicado no frontend usando os alertas já carregados nesta versão. A API atual pode continuar retornando o histórico completo enquanto o volume for pequeno. Se o volume crescer, uma etapa futura pode adicionar filtros server-side em `/api/alerts`.

## Shared Period Filter

A dashboard deve ter um filtro de período compartilhado:

- Hoje;
- Últimos 7 dias;
- Últimos 30 dias;
- Todos;
- Intervalo personalizado.

Para intervalo personalizado:

- usuário informa data inicial;
- usuário informa data final;
- ambas usam formato de input date;
- alertas fora do intervalo são ignorados nos painéis dependentes do filtro.

Esse filtro alimenta:

- histórico;
- tabela por operador;
- painel por programa;
- gerador de resumo;
- dados de período nas tabelas.

Os cards de metas “hoje” continuam baseados exclusivamente no dia atual.

## Top Bar Theme Toggle

O botão claro/escuro deve sair de qualquer posição solta e ficar na barra superior da aplicação, ao lado dos botões:

- Gerador de cards;
- Dashboard de alertas.

O componente existente `ThemeToggle` deve ser reaproveitado.

## Canvas Preview Layout

Na tela do gerador, a grade de previews deve priorizar legibilidade:

- telas largas: máximo de 2 canvas por linha;
- telas médias: 1 ou 2 por linha conforme espaço disponível;
- telas pequenas: 1 por linha;
- manter regiões colapsáveis por layout.

Não mudar dimensões reais do canvas exportado.

## Group Statistics Table

Substituir ou reorganizar o bloco atual de estatísticas por grupo para uma tabela operacional.

Colunas:

- Grupo;
- Gerados hoje;
- Enviados hoje;
- Gerados total;
- Enviados total;
- Meta hoje.

Regras:

- usar nomes canônicos de grupo, incluindo `Experiências Ao Vivo` com acento;
- normalizar aliases legados antes de contar;
- usar contagem distinta quando possível, para não inflar números com múltiplos layouts do mesmo alerta;
- metas diárias devem ficar explícitas na tabela.

## Operator History Table

Criar nova tabela agregada por operador (`autor`).

Colunas:

- Operador;
- Gerados hoje;
- Enviados hoje;
- Gerados no período;
- Enviados no período;
- Último alerta.

Regras:

- operador vazio deve aparecer como `Sem operador`;
- `Último alerta` usa `created_at` quando disponível, senão `data`;
- respeitar o filtro de período para as colunas de período;
- colunas “hoje” sempre usam o dia atual.

## Loyalty Program Analytics

Criar painel “Por programa de fidelidade”.

Comportamento:

- detectar programas a partir do campo `programa` dos alertas;
- usar keywords inspiradas no HTML;
- contar ocorrências por programa;
- exibir barras horizontais CSS, sem dependência externa;
- permitir selecionar a base de período:
  - período compartilhado;
  - hoje;
  - 7 dias;
  - 30 dias;
  - todos.

Lista inicial de programas:

- Smiles;
- Azul;
- TAP;
- Latam Pass;
- Flying Blue;
- AAdvantage;
- Aeroplan;
- Avios Iberia;
- Avios Finnair;
- Avios British;
- Avios Qatar;
- Aegean Miles+Bonus;
- Lifemiles;
- Krisflyer;
- Suma;
- Miles&Smiles;
- Connectmiles;
- Virgin Flying Club;
- Mileage Plan Alaska;
- United MileagePlus;
- Delta Skymiles;
- Miles&More;
- SAS EuroBonus;
- Aeromexico Rewards;
- Qantas Frequent Flyer.

## Routes And Last Searches

Criar tabela de rotas e últimas buscas, alinhada ao HTML.

Colunas:

- Rota;
- GMC;
- ECM;
- FC;
- EAV;
- MAV;
- Status;
- Total;
- Ajuste.

As colunas de grupo exibem quantos dias se passaram desde o último alerta daquele grupo para a rota.

Abreviações:

- GMC: Go Miles Club;
- ECM: Executiva com Milhas;
- FC: FirstClass;
- EAV: Experiências Ao Vivo;
- MAV: Milhas Ao Vivo.

Status:

- `Nunca enviada` quando não houver data;
- `OK` quando dentro do intervalo configurado;
- `Atenção` quando passou de 60% do intervalo;
- `Vencida` quando passou do intervalo.

Controles:

- busca por rota ou programa;
- ordenação por mais vencida;
- ordenação por mais recente;
- ordenação A-Z;
- ordenação por total;
- ajuste inline de `min_days` por rota usando `/api/route-settings`.

## Alert Summary Builder

Criar módulo de resumo de alertas para WhatsApp dentro da dashboard.

### Source

Fonte inicial: alertas filtrados pelo período compartilhado.

O usuário pode gerar um rascunho a partir do histórico Supabase.

Depois de gerado, o rascunho é editável manualmente. Se o usuário clicar em “Regenerar pelo histórico”, o rascunho atual é descartado e recriado diretamente a partir dos dados filtrados do Supabase.

### Draft Persistence

Salvar rascunhos em `localStorage` nesta versão.

Chave sugerida:

`ecm_alert_summary_draft`

Não usar Supabase para rascunhos nesta etapa.

### Data Structure

```ts
interface AlertSummaryDraft {
  date: string;
  profile: string;
  programs: AlertSummaryProgram[];
}

interface AlertSummaryProgram {
  id: string;
  name: string;
  alerts: AlertSummaryItem[];
}

interface AlertSummaryItem {
  id: string;
  origin: string;
  destination: string;
  destinationCountry: string;
  destinationFlag: string;
  airlines: string[];
  cabin: string;
  milesType: 'fixed' | 'range';
  miles: string;
  minimumMiles: string;
  maximumMiles: string;
  displayProgram: string;
  notes: string;
}
```

### Text Output

Formato:

```txt
RESUMO ALERTAS (DD/MM)

Milhas TAP
Cairo - Tokyo🇯🇵
EGYPTAIR
80K Milhas TAP

Zurique - Bangkok🇹🇭
SWISS ou THAI AIRWAYS
80K Milhas TAP
————————————
Milhas AVIOS
Doha - Bogotá🇨🇴
QATAR
70K a 94.5K Milhas Avios Qatar

@executivacommilhas
```

Regras:

- não usar Markdown;
- não usar tabela;
- não usar bullets;
- manter quebras de linha;
- manter separador `————————————` apenas entre programas;
- não colocar separador após o último programa;
- preservar formato numérico digitado pelo usuário;
- companhia aérea em maiúsculas;
- se houver cabine, formatar como `QATAR(Business)`;
- se houver mais de uma companhia, juntar com ` ou `;
- bandeira imediatamente depois do destino, sem espaço.

### Required Fields

Um alerta só entra no resumo se tiver:

- programa/grupo de resumo;
- origem;
- destino;
- bandeira;
- companhia aérea;
- milhas fixas ou faixa completa;
- programa exibido no preço.

Alertas incompletos devem ser destacados na interface e ignorados no texto final.

### Supabase To Draft Mapping

Os dados vindos de `alerts` não têm todos os campos do resumo. A primeira geração deve preencher o que for seguro:

- `origin`: `alert.origem`;
- `destination`: `alert.destino`;
- `airlines`: `alert.cia`, separando por ` ou ` quando já vier assim;
- `displayProgram`: programa detectado no texto de `alert.programa`, quando possível;
- `miles`: primeira quantidade detectada em `alert.programa`, preservando formato;
- `minimumMiles` e `maximumMiles`: preencher só quando uma faixa clara for detectada;
- `destinationCountry` e `destinationFlag`: deixar vazio quando não for possível inferir com segurança.

Como a bandeira é obrigatória, itens sem bandeira devem aparecer como incompletos até o usuário escolher o país ou preencher manualmente.

## Country Flag Helper

Criar lista pequena inicial de países usados com frequência e respectivas bandeiras.

O campo deve permitir:

- selecionar país da lista;
- digitar país manualmente;
- editar bandeira manualmente.

Não tentar inferir país automaticamente sem base confiável nesta etapa.

## UI Layout

Na dashboard:

1. Cabeçalho com filtro de período compartilhado.
2. Tabela por grupo.
3. Tabela por operador.
4. Painel por programa de fidelidade.
5. Tabela de rotas e últimas buscas.
6. Histórico.
7. Gerador de resumo.

O gerador de resumo deve ser colapsável para não dominar a dashboard quando não estiver em uso.

## Validation And Errors

- Se Supabase não estiver configurado, mostrar mensagem existente e manter dashboard sem dados.
- Se não houver alertas no período, mostrar estados vazios nos painéis.
- Se o resumo tiver alertas incompletos, mostrar contagem e campos faltantes.
- O botão copiar deve copiar apenas alertas completos.
- Se todos os alertas estiverem incompletos, o texto final deve conter apenas título e perfil, ou o botão copiar deve indicar que não há alertas completos. A primeira versão deve preferir indicar que não há alertas completos.

## Testing

Testes unitários obrigatórios:

- detecção de programa por keywords;
- agregação por operador;
- filtro de período;
- geração da tabela de rotas por grupo;
- geração de resumo WhatsApp;
- validação de alertas incompletos;
- conversão básica de alertas Supabase para rascunho.

Testes de build:

- `npm test`;
- `npm run build`.

## Open Decisions

- A lista inicial de países/bandeiras pode começar pequena e crescer por demanda.
- Persistência de rascunhos no Supabase fica fora desta etapa.
- Agrupamento avançado do histórico por `par_id` e união de layouts pode ser melhorado depois, mas as novas agregações devem usar os helpers de normalização já existentes sempre que possível.
