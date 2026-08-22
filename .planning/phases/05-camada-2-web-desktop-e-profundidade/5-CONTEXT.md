# Phase 5: Camada 2 — Visão web desktop e profundidade do app - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — áreas cinzentas resolvidas pela opção recomendada.

<domain>
## Phase Boundary

As 12 telas da Camada 2: 7 na visão web desktop (Descobrir, Acontece com mapa lado a lado,
Página do evento, Buscar, Redação fila, Redação trilha, Observatório) e 5 de profundidade
no app (Filtros, Play, Player, Zero-resultado, Página do produtor).

Requisitos: WEB-01 a WEB-07, APPX-01 a APPX-05.

**A prova da fase:** a promessa das duas visões deixa de ser um alternador e vira produto —
a web tem layout próprio, não mobile esticado. E as três superfícies de bastidor passam a
existir de verdade: Studio já existe da fase 4, Redação e Observatório entram aqui.

**Fora do escopo:** Camada 3 (fase 6). Nada aqui pode ser pré-requisito de lá.
</domain>

<decisions>
## Implementation Decisions

### A visão web não é o mobile esticado

`[auto] Web — Q: "adaptar o componente existente ou escrever layout próprio?" → Selected:
"layout próprio dentro do mesmo componente" (recomendado)`

- **D-79:** As telas web usam **os mesmos componentes** das mobile, com o layout divergindo
  por `desk:` e por regra sob `[data-view="web"]`. Continua proibido criar
  `ComponenteWeb` como arquivo irmão — a divergência é de layout, não de lógica (D-05).
- **D-80:** O que muda na web não é largura, é **densidade e simultaneidade**. Descobrir
  vira grade com o destaque curado ocupando mais colunas; Acontece põe lista e mapa lado a
  lado, sincronizados; Buscar mantém as facetas visíveis em coluna permanente em vez de
  tela separada; a página do evento põe "aprofunda isto" em painel lateral.
- **D-81:** Passar o cursor sobre um item da lista destaca o pino correspondente no mapa, e
  vice-versa. É o comportamento que só existe onde há cursor, e é o que justifica a visão
  web existir.

### Redação — a curadoria com poder real

- **D-82:** A fila mostra **a origem de cada item**: produtor, ingestão automática, ou
  sugestão de IA. Os de IA aparecem com `procedencia: ia` e **score de confiança visível**.
- **D-83:** Quatro ações: aprovar, editar, vetar, devolver. **Vetar exige motivo escrito** —
  sem motivo, o botão não conclui. É a diferença entre curadoria e moderação silenciosa.
- **D-84:** Toda decisão registra autoria e horário. O escopo do curador aparece no topo:
  nacional, territorial ou por linguagem — a mesma superfície servindo recortes diferentes,
  que é a resposta ao "como crescer sem reescrever" do RFP.
- **D-85:** No editor de trilha, o **campo de motivo por passo é obrigatório** — é ele que
  vira o selo visível ao público em Descobrir. Uma trilha com passo sem motivo não publica.
- **D-86:** A IA sugere o próximo passo e a sugestão é sempre descartável. O rodapé declara
  os limites: não publica, não define destaque, não escreve verbete.

### Observatório — a métrica que não é pageview

- **D-87:** Os indicadores de impacto cultural vêm do grafo e do repertório das personas,
  calculados na hora: ampliação de repertório, descoberta de artista novo, diversidade de
  linguagem por região, circulação territorial, gratuito × pago.
- **D-88:** **O painel de procedência é tela de primeira classe**, não rodapé: quanto do
  acervo é `ic`, `derivado` e `autorado`, com os números reais. É o princípio 9 virando
  interface — e é o que nenhum concorrente vai mostrar.
- **D-89:** O seletor de público (editorial, produto, parceiro, institucional) troca o
  recorte, não a tela. Mesma superfície, escopos diferentes — a mesma lógica de D-84.
- **D-90:** Onde o dado não sustenta um indicador, o indicador aparece **declarando a
  ausência com o denominador**, nunca zerado sem explicação. Gratuidade é o caso óbvio:
  0 de 300 eventos declaram ingresso.

### Profundidade do app

- **D-91:** Filtros trazem as **8 dimensões de acessibilidade como critério de primeira
  classe**, ao lado de linguagem, gratuidade, faixa etária e território. A tela distingue
  declarado-ausente de não-declarado, como a ficha do evento já faz.
- **D-92:** Play é catálogo unificado das 529 mídias, com o bloco "não pode ir? veja isto"
  ligando ao evento. Player registra no repertório ao concluir.
- **D-93:** **Zero-resultado cobre também `/404`.** O site atual tem três becos sem saída;
  no protótipo, nenhum deles existe como fim de caminho. Cada um oferece qual critério
  afrouxar, com o número, ou uma trilha curada relacionada.

### Claude's Discretion

Grade da visão web, densidade das tabelas de bastidor, e a forma dos gráficos do
Observatório — desde que sem biblioteca externa e sem requisição de rede.
</decisions>

<specifics>
## Specific Ideas

- O painel de procedência do Observatório é, junto com o mapa de desertos, a tela que mais
  distingue esta proposta. Nenhum concorrente vai mostrar quanto do próprio protótipo é
  inventado — e é exatamente isso que torna o resto crível.
- A sincronia lista↔mapa em Acontece é o detalhe que faz a visão web parecer produto e não
  adaptação.
</specifics>

<canonical_refs>
## Canonical References

- `docs/telas.md` — telas 9, 18, 19, 20, 24, 25, 26, 27, 28, 34, 35, 36
- `docs/PRD.md` §10 (limites da IA), §11 (métricas), §14 (procedência)
- Os SUMMARYs das fases 3 e 4 — API real, correções de portão, contratos `data-*`
- `src/dados/grafo.ts`, `indice.ts`, `duplicatas.ts`, `ocorrencias-studio.ts`
</canonical_refs>

<riscos_herdados>
## Riscos herdados

- **Gratuidade não recorta:** 0 de 300 eventos declaram ingresso. Filtros e Observatório
  precisam declarar isso em vez de oferecer um filtro que não filtra.
- **Nenhuma ocorrência tem espaço** (2425/2425).
- **Faixa etária não existe no acervo** — verificar antes de oferecer como filtro; se não
  existir, declarar em vez de fingir.
- O projeto está no iCloud com o disco a 96%. Verificar leitura antes de editar, conteúdo
  não-vazio antes de commitar. Espelho em `~/Projetos/Noz-espelho.git`, remote `espelho`.
- `state.update-progress` do GSD corrompeu o STATE.md duas vezes, zerando o percentual.
  Conferir depois de rodar.
</riscos_herdados>
