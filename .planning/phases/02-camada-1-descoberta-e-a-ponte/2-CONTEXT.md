# Phase 2: Camada 1 — Descoberta e a ponte - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — áreas cinzentas resolvidas pela opção recomendada, registradas abaixo.

<domain>
## Phase Boundary

As 7 telas mobile da Camada 1 que sustentam o Cenário 1 e provam a tese da proposta:
Onboarding por disposição · Descobrir · Explicação da recomendação · Trilha de primeira vez
· Página do artista · Página do evento · Meu Repertório.

Requisitos: DESC-01 a DESC-08.

**A prova da fase:** alguém abre o app como a Maria, escolhe uma disposição, recebe um feed
que não é lista de eventos, toca em "por que isto apareceu" e vê o caminho no grafo, segue
a trilha do rap ao teatro documentário, chega numa montagem real com data e lugar, e do
evento consegue ir ao verbete do artista e voltar. Tudo sobre o grafo de 7.810 entidades já
gerado — nenhuma tela lê array cru.

**Fora do escopo desta fase:** Acontece, mapa, busca, Play, filtros, Studio, Redação,
Observatório e toda a visão web. A visão web dessas telas é Camada 2, fase 5.
</domain>

<decisions>
## Implementation Decisions

### Como o feed é montado

`[auto] Feed — Q: "ordenar por relevância calculada ou por caminhada no grafo?" → Selected: "caminhada" (recomendado)`

- **D-26:** O feed de Descobrir é montado por **caminhada a partir do repertório da persona**,
  não por score global. O algoritmo é explícito e legível: parte das linguagens do
  repertório, caminha 1 a 3 arestas, coleta candidatos, filtra pela disposição escolhida,
  intercala tipos. Popularidade não entra em lugar nenhum.
- **D-27:** O feed é **heterogêneo por construção** — nunca dois cartões do mesmo tipo
  seguidos, quando houver alternativa. É o que impede a tela de virar agenda.
- **D-28:** Todo cartão carrega o `motivo` que veio da aresta. Cartão sem motivo não
  renderiza — falha visível em desenvolvimento, nunca silenciosa.
- **D-29:** O destaque curado é uma `trilha` marcada como curada; ele **sobrepõe** o
  resultado da caminhada, ocupando posição fixa, com assinatura de quem curou.
- **D-30:** Um cartão de serendipidade por sessão, escolhido fora do alcance da caminhada e
  **rotulado como tal** — "fora do seu repertório, de propósito".

### Disposição

`[auto] Disposição — Q: "filtro rígido ou peso na caminhada?" → Selected: "peso" (recomendado)`

- **D-31:** Disposição não é filtro que zera resultado. Ela **pondera** a caminhada e, quando
  é factual (gratuidade, tempo, criança), corta de verdade. "Quero algo que eu nunca vi"
  vira o inverso: exclui o que já está no repertório.
- **D-32:** A disposição escolhida fica visível e editável no topo de Descobrir, em um toque.
  Trocar disposição remonta o feed na hora, sem recarregar rota.

### Explicação da recomendação

- **D-33:** A explicação é **rota**, não modal — `/descobrir/porque/[id]`. Precisa ser
  compartilhável e navegável na demonstração ao vivo.
- **D-34:** Mostra o caminho real percorrido no grafo, passo a passo, com o `motivo` de cada
  aresta e o tipo de cada nó. Cada critério é removível e o resultado se recalcula.
- **D-35:** Rodapé fixo com o limite da IA, em texto: nenhuma decisão editorial foi tomada
  por IA; o destaque é humano e assinado.

### Trilha de primeira vez

- **D-36:** A trilha renderiza os passos como **arestas navegáveis**, não como lista. Cada
  passo mostra de onde veio, para onde vai e por quê.
- **D-37:** As três arestas do Cenário 1 são `autorado` e **o rótulo de procedência aparece
  na tela**. Não escondemos — a honestidade do dado é argumento, e a `trilha` é sancionada
  por `docs/telas.md` tela 7.
- **D-38:** O último passo é sempre um evento com ocorrência real, data e lugar. Se não
  houver, a trilha não é publicável.

### A ponte Enciclopédia ↔ agenda

`[auto] Ponte — Q: "link para fora ou verbete embutido?" → Selected: "embutido" (recomendado)`

- **D-39:** O verbete da Enciclopédia é **embutido** na página do artista e na do evento, com
  crédito visível e link para a fonte. Nunca "veja na Enciclopédia" como saída.
- **D-40:** A navegação é **bidirecional e visível**: da página do artista lista-se em que
  eventos ele aparece; da página do evento lista-se quem realiza e atua, com papel. A
  conexão é mostrada como relação nomeada, não como link solto — é a tese da proposta
  materializada em duas telas.
- **D-41:** Papel vem da aresta `atua_em`, nunca de campo do agente (D-03 da fase 1).

### Página do evento

- **D-42:** Evento é a entidade; as ocorrências ficam listadas abaixo, cada uma salvável
  isoladamente. A contagem aparece no topo ("6 sessões · a próxima sábado, 20h").
- **D-43:** Ficha de acessibilidade mostra as 8 dimensões, distinguindo declarado de não
  declarado — ausência não é negação.

### Meu Repertório

- **D-44:** Mostra o atravessado e o **adjacente a um passo**, calculado pelo grafo na hora.
  É a tela que torna visível a métrica de ampliação de repertório.
- **D-45:** A persona ativa é a escolhida na entrada; trocar de persona na demonstração é um
  toque, e isso é deliberado — a banca vai querer ver o feed da Maria e o do Carlos.

### Estado e navegação

- **D-46:** Estado de sessão (persona, disposição, salvos) em React Context com espelho em
  `localStorage`. Sem biblioteca de estado — o protótipo não justifica.
- **D-47:** Nenhuma tela varre array cru. Toda leitura passa pelas funções de
  `src/dados/grafo.ts`. Um componente que importa `gerado/*.json` diretamente é erro de
  revisão.

### Claude's Discretion

Composição interna dos componentes de cartão, animações de transição, densidade tipográfica
dentro das regras do manual, e organização de subpastas em `src/componentes/`.
</decisions>

<specifics>
## Specific Ideas

- O selo de motivo no cartão é o detalhe que mais comunica na demonstração: é a diferença
  visível entre "algoritmo opaco" e "mediação legível".
- A tela de explicação deve caber numa foto de slide. Se precisar rolar para entender o
  caminho, está longa demais.
- Trocar de persona precisa ser instantâneo — a banca vai pedir.
</specifics>

<canonical_refs>
## Canonical References

- `docs/telas.md` — telas 2, 5, 6, 7, 12, 14, 21 são exatamente esta fase
- `docs/PRD.md` §3.1 (a ponte), §6 (ontologia), §9 (Cenário 1)
- `.planning/phases/01-*/1-CONTEXT.md` — D-01..D-25, ainda válidas
- `.planning/phases/01-*/01-02-SUMMARY.md` — o que o grafo tem e o que não tem
- `src/dados/grafo.ts` — a API de travessia; a fase inteira se apoia nela
</canonical_refs>

<deferred>
## Deferred

- Visão web destas 7 telas — fase 5
- Filtros, zero-resultado, Play — fase 5
- Mapa e Modo Cidade — fase 3
- Expansão do bastidor de 6 para ~26 telas — decisão em aberto do usuário
</deferred>

<riscos_herdados>
## Risco herdado da fase 1

**Território e data não se cruzam.** Os 100 eventos do CMS têm datas de 2026 e zero
território; os 160 da Enciclopédia têm território real e datas históricas. Não afeta esta
fase — Descobrir e a Trilha não dependem de território. **Afeta a fase 3**, onde Modo Cidade
e Mapa vivem, e lá precisa de resposta explícita que não seja inventar datas.

**Cobertura de imagem baixa.** Eventos têm 13 de 300 imagens locais; conteúdos, 68 de 1.805.
Os cartões desta fase precisam de um estado sem imagem que não pareça defeito — tratar como
decisão de design, usando a cor da linguagem como preenchimento.
</riscos_herdados>
