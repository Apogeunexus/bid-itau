---
schema_version: 1
open_count: 22
waived_count: 0
fixed_count: 1
total_count: 23
last_updated: 2026-08-22T16:04:30.512Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/dados/gerado/entidades.json |  | Cobertura de imagem local: eventos com 13 de 300 e conteudos com 68 de 1.805 — o download parou em 900 arquivos | fixed |  | 2026-08-22T05:01:12.892Z | 2026-08-22T08:33:28.120Z |
| 2 | 01 | unmet-truth | src/dados/grafo.ts |  | porTerritorio com janela futura devolve 0 sobre dado real: os eventos com territorio sao historicos e os de 2026 nao tem territorio (lacuna 1) | open |  | 2026-08-22T05:01:12.958Z |  |
| 3 | 01 | deviation | src/dados/gerado/arestas.json |  | Arestas influenciou, deriva_de e curou continuam sem nenhuma aresta: a fonte nao traz o vinculo | open |  | 2026-08-22T05:01:13.023Z |  |
| 4 | 01 | deviation | .gitignore |  | .gitignore precisa de tsconfig.tsbuildinfo; o arquivo pertence ao plano irmao e nao foi editado | open |  | 2026-08-22T05:01:13.089Z |  |
| 5 | 02 | unrun-verify | scripts/testar-caminhada.ts |  | Asserção 9 (salto 3 é reserva) passa por vacuidade: classesEmReserva volta vazio para as três personas do protótipo, então nenhum cartão de 3 saltos é produzido e a asserção não protege nada | open |  | 2026-08-22T06:26:52.592Z |  |
| 6 | 02 | deviation | src/dados/caminhada.ts |  | DP-D ordena 'com imagem antes de sem imagem' e isso inverte M-6: 11 de 12 cartões do feed padrão da Maria têm imagem, quando M-6 previa 22%. Decisão de rebaixar o critério cabe ao 02-02 | open |  | 2026-08-22T06:26:52.802Z |  |
| 7 | 02 | unrun-verify | src/componentes/lista-ocorrencias.tsx |  | Nenhuma ocorrencia do acervo e futura em relacao a data do build (22.08.2026): o ramo «a proxima sessao» de D-42 esta implementado e nao e exercitado por nenhum dado | open |  | 2026-08-22T06:48:58.287Z |  |
| 8 | 02 | deviation | src/dados/ponte.ts |  | ROTA_POR_CLASSE duplicado entre src/componentes/cartao.tsx e src/dados/ponte.ts — duas fontes de verdade para a mesma tabela de rotas | open |  | 2026-08-22T06:48:58.365Z |  |
| 9 | 02 | unrun-verify | src/dados/trilha.ts |  | Duas reservas de trilha.ts nunca sao exercitadas pelo grafo: a reconstrucao da cadeia por arestas contextualiza (a unica trilha declara extra.passos) e o passo sem-aresta (os 3 pares consecutivos tem aresta) | open |  | 2026-08-22T06:50:31.716Z |  |
| 10 | 02 | deviation | src/app/(app)/meu/page.tsx |  | Os 4 salvos da Joana apontam para evento:cms:7000 com datas de novembro de 2016; a tela mostra as datas como estao, sem rotulo de passado. Quem construir o Cenario 4 precisa saber que o dado semeado e historico | open |  | 2026-08-22T06:50:31.788Z |  |
| 11 | 02 | unrun-verify | public/favicon.ico |  | Nenhuma rota tem favicon: /favicon.ico devolve 404 em toda pagina e vira erro de console. O gate de console limpo do 02-05 falha em todas as rotas por causa disso. Arquivo fora do files_modified do 02-02. | open |  | 2026-08-22T07:14:28.678Z |  |
| 12 | 02 | deviation | src/dados/repertorio.ts |  | Meu Repertorio ainda ordena 'com imagem antes de sem imagem' ACIMA do hash semeado — o criterio que o 02-02 rebaixou em caminhada.ts. Com 2.382 imagens no lugar de 900, as linguagens novas do Carlos foram de 6 para 8 sem uma linha de codigo mudar. Alinhar com o feed e decisao de produto, nao manutencao de dado | open |  | 2026-08-22T08:33:34.427Z |  |
| 13 | 03 | deviation | src/contexto/sessao.tsx |  | D-58 parcial: salvos vive em chave unica agenda-cultural:salvos, sem segmentar por persona ativa; corrigir exige alterar sessao.tsx, declarado leitura no plano 03-02 | open |  | 2026-08-22T09:33:45.545Z |  |
| 14 | 03 | deviation | scripts/navegador.mjs |  | recarregar() pode medir o documento antigo: 1 flake em 5 execucoes do roteiro por clique do 03-02 | open |  | 2026-08-22T09:33:46.669Z |  |
| 15 | 03 | deviation | src/dados/indice.ts |  | montarIndice recebe a fonte do grafo injetada em vez de importar ./grafo; o gate do plano abria com montarIndice() sem argumento | open |  | 2026-08-22T09:43:05.471Z |  |
| 16 | 03 | deviation | src/componentes/buscar.tsx |  | a lente do mapa sai como /mapa/#r=..&t=..&v=.. por trailingSlash:true; o gate do plano esperava /mapa# | open |  | 2026-08-22T09:43:05.544Z |  |
| 17 | 3 | deviation | .planning/phases/03-camada-1-agenda-territorio-e-busca/03-06-PLAN.md |  | Os <verify> do plano 03-06 nao rodavam como escritos: a lente e /mapa/# (com barra) e nao /mapa#; o replace de comentarios usava \\$ escapado; e o roteiro da Task 3 chamava servir('out'), s.base, cdp.enviar/ao/irPara, que nao existem (a API real e servir({raiz}) -> {url, fechar} e cdp.avaliar/clicar/navegar/consola). O 03-07 escreve o script permanente da fase e vai bater no mesmo muro. | open |  | 2026-08-22T11:37:51.690Z |  |
| 18 | 3 | unmet-truth | src/estilos/agenda.css |  | REGRESSAO MEDIDA: a fase 3 introduziu um aviso de console que a fase 2 nao tinha. Os CSS de rota criados pela fase 3 (agenda.css/03-01, busca.css/03-04, salvos.css/03-02) sao pre-carregados em TODA tela pelo prefetch da barra de abas para /acontece e /buscar, e nao sao usados na tela onde foram pre-carregados: Chrome emite «preloaded using link preload but not used». Consequencia: `npm run verificar-comentado` esta VERMELHO (0 erro, 2 aviso em 7 navegacoes, deterministico 3/3) e `npm run verificar-fase3` sai com codigo 1 com 92 gates verdes. Prova de autoria: /play/, tela da FASE 1 nao tocada, emite 2 avisos, os dois sobre folhas da fase 3. Limiar NAO relaxado. Correcao possivel: consolidar as folhas de rota, ou prefetch={false} nos Link da barra de abas. | open |  | 2026-08-22T12:53:45.603Z |  |
| 19 | 3 | deviation | scripts/verificar-fase3.mjs |  | semComentarios, importsDe, resolverModulo e arquivosDe estao DUPLICADOS de verificar-fase2.mjs, que nao os exporta e que o plano 03-07 declara somente leitura. Duas copias divergem na primeira correcao. Extrair para modulo compartilhado quando um plano puder tocar os dois arquivos. | open |  | 2026-08-22T12:53:45.603Z |  |
| 20 | 4 | deviation | scripts/verificar-fase3.mjs | 65 | Gate 8 ancora globals.css em cc34f4e; ja vermelho antes da fase 4 (quebrado por a40f380). 04-05 deve reancorar em c03f627. | open |  | 2026-08-22T14:15:58.265Z |  |
| 21 | 4 | deviation | scripts/verificar-fase3.mjs | 630 | Segunda ancora obsoleta, achada por 04-03: a linha de base de paginas exige residuo 1784, mas out/ tem 1931 paginas e residuo 1785 — a rota /roteiro que 04-04 criou. 04-05 deve reancorar 1784 -> 1785 junto com o gate 8. | open |  | 2026-08-22T14:55:52.716Z |  |
| 22 | 4 | deviation | src/componentes/studio-ocorrencias.tsx |  | CINCO dos onze atributos data-* de 04-03 (data-editando, data-impacto, data-impacto-fonte, data-confirmar, data-cancelar) so existem com uma linha em edicao e medem 0 no HTML exportado. 04-05 tem de clicar em «alterar horario» antes de medi-los, ou o gate acusa contrato quebrado que nao esta. | open |  | 2026-08-22T14:55:52.812Z |  |
| 23 | 4 | deviation | scripts/verificar-fase3.mjs |  | a ancora de globals.css foi reancorada em c03f627 (diferenca zero) em vez de a40f380 como o plano 04-05 descrevia; a protecao pedida virou tres gates em verificar-fase4.mjs | open |  | 2026-08-22T16:04:30.512Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/dados/gerado/entidades.json",
    "line": null,
    "description": "Cobertura de imagem local: eventos com 13 de 300 e conteudos com 68 de 1.805 — o download parou em 900 arquivos",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-22T05:01:12.892Z",
    "resolved_at": "2026-08-22T08:33:28.120Z"
  },
  {
    "id": 2,
    "kind": "unmet-truth",
    "phase": "01",
    "file": "src/dados/grafo.ts",
    "line": null,
    "description": "porTerritorio com janela futura devolve 0 sobre dado real: os eventos com territorio sao historicos e os de 2026 nao tem territorio (lacuna 1)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T05:01:12.958Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "01",
    "file": "src/dados/gerado/arestas.json",
    "line": null,
    "description": "Arestas influenciou, deriva_de e curou continuam sem nenhuma aresta: a fonte nao traz o vinculo",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T05:01:13.023Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": ".gitignore",
    "line": null,
    "description": ".gitignore precisa de tsconfig.tsbuildinfo; o arquivo pertence ao plano irmao e nao foi editado",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T05:01:13.089Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "scripts/testar-caminhada.ts",
    "line": null,
    "description": "Asserção 9 (salto 3 é reserva) passa por vacuidade: classesEmReserva volta vazio para as três personas do protótipo, então nenhum cartão de 3 saltos é produzido e a asserção não protege nada",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:26:52.592Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "02",
    "file": "src/dados/caminhada.ts",
    "line": null,
    "description": "DP-D ordena 'com imagem antes de sem imagem' e isso inverte M-6: 11 de 12 cartões do feed padrão da Maria têm imagem, quando M-6 previa 22%. Decisão de rebaixar o critério cabe ao 02-02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:26:52.802Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/componentes/lista-ocorrencias.tsx",
    "line": null,
    "description": "Nenhuma ocorrencia do acervo e futura em relacao a data do build (22.08.2026): o ramo «a proxima sessao» de D-42 esta implementado e nao e exercitado por nenhum dado",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:48:58.287Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "02",
    "file": "src/dados/ponte.ts",
    "line": null,
    "description": "ROTA_POR_CLASSE duplicado entre src/componentes/cartao.tsx e src/dados/ponte.ts — duas fontes de verdade para a mesma tabela de rotas",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:48:58.365Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/dados/trilha.ts",
    "line": null,
    "description": "Duas reservas de trilha.ts nunca sao exercitadas pelo grafo: a reconstrucao da cadeia por arestas contextualiza (a unica trilha declara extra.passos) e o passo sem-aresta (os 3 pares consecutivos tem aresta)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:50:31.716Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "02",
    "file": "src/app/(app)/meu/page.tsx",
    "line": null,
    "description": "Os 4 salvos da Joana apontam para evento:cms:7000 com datas de novembro de 2016; a tela mostra as datas como estao, sem rotulo de passado. Quem construir o Cenario 4 precisa saber que o dado semeado e historico",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T06:50:31.788Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "public/favicon.ico",
    "line": null,
    "description": "Nenhuma rota tem favicon: /favicon.ico devolve 404 em toda pagina e vira erro de console. O gate de console limpo do 02-05 falha em todas as rotas por causa disso. Arquivo fora do files_modified do 02-02.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T07:14:28.678Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "deviation",
    "phase": "02",
    "file": "src/dados/repertorio.ts",
    "line": null,
    "description": "Meu Repertorio ainda ordena 'com imagem antes de sem imagem' ACIMA do hash semeado — o criterio que o 02-02 rebaixou em caminhada.ts. Com 2.382 imagens no lugar de 900, as linguagens novas do Carlos foram de 6 para 8 sem uma linha de codigo mudar. Alinhar com o feed e decisao de produto, nao manutencao de dado",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T08:33:34.427Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "deviation",
    "phase": "03",
    "file": "src/contexto/sessao.tsx",
    "line": null,
    "description": "D-58 parcial: salvos vive em chave unica agenda-cultural:salvos, sem segmentar por persona ativa; corrigir exige alterar sessao.tsx, declarado leitura no plano 03-02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T09:33:45.545Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "03",
    "file": "scripts/navegador.mjs",
    "line": null,
    "description": "recarregar() pode medir o documento antigo: 1 flake em 5 execucoes do roteiro por clique do 03-02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T09:33:46.669Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "03",
    "file": "src/dados/indice.ts",
    "line": null,
    "description": "montarIndice recebe a fonte do grafo injetada em vez de importar ./grafo; o gate do plano abria com montarIndice() sem argumento",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T09:43:05.471Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "03",
    "file": "src/componentes/buscar.tsx",
    "line": null,
    "description": "a lente do mapa sai como /mapa/#r=..&t=..&v=.. por trailingSlash:true; o gate do plano esperava /mapa#",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T09:43:05.544Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "3",
    "file": ".planning/phases/03-camada-1-agenda-territorio-e-busca/03-06-PLAN.md",
    "line": null,
    "description": "Os <verify> do plano 03-06 nao rodavam como escritos: a lente e /mapa/# (com barra) e nao /mapa#; o replace de comentarios usava \\$ escapado; e o roteiro da Task 3 chamava servir('out'), s.base, cdp.enviar/ao/irPara, que nao existem (a API real e servir({raiz}) -> {url, fechar} e cdp.avaliar/clicar/navegar/consola). O 03-07 escreve o script permanente da fase e vai bater no mesmo muro.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T11:37:51.690Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "unmet-truth",
    "phase": "3",
    "file": "src/estilos/agenda.css",
    "line": null,
    "description": "REGRESSAO MEDIDA: a fase 3 introduziu um aviso de console que a fase 2 nao tinha. Os CSS de rota criados pela fase 3 (agenda.css/03-01, busca.css/03-04, salvos.css/03-02) sao pre-carregados em TODA tela pelo prefetch da barra de abas para /acontece e /buscar, e nao sao usados na tela onde foram pre-carregados: Chrome emite «preloaded using link preload but not used». Consequencia: `npm run verificar-comentado` esta VERMELHO (0 erro, 2 aviso em 7 navegacoes, deterministico 3/3) e `npm run verificar-fase3` sai com codigo 1 com 92 gates verdes. Prova de autoria: /play/, tela da FASE 1 nao tocada, emite 2 avisos, os dois sobre folhas da fase 3. Limiar NAO relaxado. Correcao possivel: consolidar as folhas de rota, ou prefetch={false} nos Link da barra de abas.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T12:53:45.603Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "deviation",
    "phase": "3",
    "file": "scripts/verificar-fase3.mjs",
    "line": null,
    "description": "semComentarios, importsDe, resolverModulo e arquivosDe estao DUPLICADOS de verificar-fase2.mjs, que nao os exporta e que o plano 03-07 declara somente leitura. Duas copias divergem na primeira correcao. Extrair para modulo compartilhado quando um plano puder tocar os dois arquivos.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T12:53:45.603Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "4",
    "file": "scripts/verificar-fase3.mjs",
    "line": 65,
    "description": "Gate 8 ancora globals.css em cc34f4e; ja vermelho antes da fase 4 (quebrado por a40f380). 04-05 deve reancorar em c03f627.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T14:15:58.265Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "4",
    "file": "scripts/verificar-fase3.mjs",
    "line": 630,
    "description": "Segunda ancora obsoleta, achada por 04-03: a linha de base de paginas exige residuo 1784, mas out/ tem 1931 paginas e residuo 1785 — a rota /roteiro que 04-04 criou. 04-05 deve reancorar 1784 -> 1785 junto com o gate 8.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T14:55:52.716Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "deviation",
    "phase": "4",
    "file": "src/componentes/studio-ocorrencias.tsx",
    "line": null,
    "description": "CINCO dos onze atributos data-* de 04-03 (data-editando, data-impacto, data-impacto-fonte, data-confirmar, data-cancelar) so existem com uma linha em edicao e medem 0 no HTML exportado. 04-05 tem de clicar em «alterar horario» antes de medi-los, ou o gate acusa contrato quebrado que nao esta.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T14:55:52.812Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "deviation",
    "phase": "4",
    "file": "scripts/verificar-fase3.mjs",
    "line": null,
    "description": "a ancora de globals.css foi reancorada em c03f627 (diferenca zero) em vez de a40f380 como o plano 04-05 descrevia; a protecao pedida virou tres gates em verificar-fase4.mjs",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-22T16:04:30.512Z",
    "resolved_at": null
  }
]
````
