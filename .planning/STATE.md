---
gsd_state_version: 1.0
current_phase: 5
current_phase_name: Camada 2 — Visão web desktop e profundidade do app
status: phase-complete
stopped_at: "Completed 05-08-PLAN.md (a verificacao da fase 5 e a nao-regressao das quatro suites)"
last_updated: "2026-08-22T21:40:00.000Z"
last_activity: 2026-08-22
last_activity_desc: "05-08 executado — a fase 5 verificada: `npm run verificar-fase5` fecha com 165 gates verdes sobre o artefato exportado, cobrindo WEB-01 a WEB-07 e APPX-01 a APPX-05 no DOM vivo a 1440x960. As CINCO suites fecham verdes sobre o MESMO out/, sem rebuild entre elas: fase 2 (67) + comentado (43) + fase 3 (94) + fase 4 (99) = 303 herdados, mais 165 novos = 468 gates, 0 falha, nenhum limiar movido. TRES reancoramentos, nao dois: a ancora de globals.css em c90fc9b (diferenca zero), e a lista de rotas explicaveis nas DUAS suites herdadas — o gate de contagem existia em verificar-fase3 E em verificar-fase4 —, com o limiar 1784 intacto e 404.html fora das listas. D-85 confirmado caractere a caractere entre o editor de trilha e o selo publico, e os dois links para /filtros/ CLICADOS."
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 28
  completed_plans: 28
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-21)

**Core value:** Os cinco cenários do RFP rodam ao vivo, de ponta a ponta, nas duas visões, na frente da banca.
**Current focus:** Phase 5 — Camada 2: Visão web desktop e profundidade do app

## Current Position

Phase: 5 of 6 (Camada 2 — Visão web desktop e profundidade do app)
Plan: 8 of 8 in current phase (FASE 5 COMPLETA E VERIFICADA)
Status: **FASE 5 FECHADA E VERIFICADA — as 12 telas da Camada 2 existem e foram medidas.** `npm run verificar-fase5`: **165 gates verdes**, WEB-01 a WEB-07 e APPX-01 a APPX-05 provados no DOM vivo em Chrome headless a 1440x960 sobre o `out/` exportado. As CINCO suites fecham verdes sobre o MESMO artefato, sem rebuild entre elas: fase 2 (67) + comentado (43) + fase 3 (94) + fase 4 (99) = **303 herdados**, mais 165 novos = **468 gates, 0 falha, nenhum limiar movido**. Console 0 erro / 0 aviso em 85 navegacoes, 0 requisicao externa, 0 folha pre-carregada sem uso, chunks 1.280 KB contra teto de 1.600 KB, 2.463 paginas com residuo 1.784. **Os contratos que atravessam planos foram medidos, e sao a razao de 05-08 existir**: D-85 confere caractere a caractere o motivo do editor de trilha contra o selo publico de `/trilha/[slug]/`, pelos tres caminhos; os dois links para `/filtros/` escritos por 05-01 e 05-02 foram CLICADOS contra a rota que 05-06 criou depois; e os 55 atributos `data-*` exclusivos foram conferidos em 13 rotas sem uma colisao. **TRES reancoramentos, e nao dois** — o gate de contagem de paginas existia nas DUAS suites herdadas, e os dois foram reancorados com o limiar 1.784 intacto e `404.html` fora das listas. Tres defeitos reais foram achados e consertados: o bloco 7 de `verificar-fase3` estava quebrado desde a onda 2 (o gate clicava o primeiro link do DOM e nao um link VISIVEL), o helper de dobra subtraia a barra de abas mesmo quando ela esta no TOPO (limite zero na visao web), e o realce era lido no meio de uma transicao de 120 ms. **Julgamento visual: 12 capturas fora do repositorio, olhadas uma a uma, e nenhuma mostrou defeito.**
Last activity: 2026-08-22 — 05-08 executado: `verificar-fase5.mjs` criado com 165 gates, os TRES reancoramentos aplicados sem mover um limiar, e a nao-regressao das quatro suites herdadas provada sobre o mesmo `out/` (303 gates)

Progress: [██████████] 100% da fase 5 (8 de 8 planos) · 28 de 28 planos JA PLANEJADOS (fases 1 a 5). A fase 6 — Camada 3 — ainda nao foi discutida nem planejada, e por isso nao entra no denominador.

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 50m | 2 tasks | 21 files |
| Phase 01 P02 | 55min | 3 tasks | 13 files |
| Phase 01 P03 | 30min | 4 tasks | 31 files |
| Phase 02 P01 | 78min | 3 tasks | 18 files |
| Phase 02 P04 | 20min | 3 tasks | 7 files |
| Phase 02 P03 | 26min | 2 tasks | 6 files |
| Phase 02 P02 | 96min | 3 tasks | 9 files |
| Phase 02 P05 | ~2h | 2 tasks | 3 files |
| Phase 03 P02 | 32min | 3 tasks | 5 files |
| Phase 03 P01 | 78min | 3 tasks | 7 files |
| Phase 03 P04 | 55m | 3 tasks | 4 files |
| Phase 03 P03 | 2h40 | 3 tasks | 6 files |
| Phase 03 P06 | ~70 min | 3 tasks | 4 files |
| Phase 3 P05 | 1h50 | 3 tasks | 4 files |
| Phase 03 P07 | ~3h | 3 tasks | 2 files |
| Phase 4 P01 | 40 min | 3 tasks | 8 files |
| Phase 04 P03 | ~50 min | 3 tasks | 4 files |
| Phase 4 P05 | ~55 min | 3 tasks | 3 files |
| Phase 5 P01 | 50 min | 3 tasks | 16 files |

## Accumulated Context

### Decisions

Registro completo em PROJECT.md → Key Decisions e bloco `<decisions>` (D-01 a D-20).
**Nenhuma decisão travada** — as 20 saíram do PRD com status `proposed`.

Decisões que mais pesam no trabalho atual:

- D-19 Corte em três camadas, de baixo para cima — Camada 3 nunca é pré-requisito de Camada 1
- D-11 / D-03 Mock em formato de grafo, com Ocorrência separada de Evento — o mock vira contrato de API
- D-12 Um código, dois layouts, alternador ao vivo
- D-18 Nada é inventado sem estar marcado — só Ocorrência, 3 personas e ~40 duplicatas são autoradas
- D-17 A entrega atual é só front-end navegável — backend, IA em produção e infra ficam para o marco seguinte
- [Phase 1]: Formato de id do grafo travado como {classe}:{origem}:{idOrigem}, com origem em cms|enc|derivado|autorado
- [Phase 1]: GRAU_HUB = 60 — trava de concentrador de caminho(), exportada de src/dados/grafo.ts
- [Phase 1]: Visão como estado em data-view com variantes Tailwind app:/desk:; breakpoints nativos proibidos no projeto
- [Phase 1]: Linguagens da Enciclopédia fora do vocabulário controlado ficam em extra.linguagensNaoMapeadas, sem equivalência inventada
- [Phase 1]: Arte, Gestao cultural, Radio e TV promovidas a linguagens novas marcadas ic, em vez de encaixadas a forca no vocabulario controlado
- [Phase 1]: Visitacao diaria de longa duracao limitada a 60 dias, com o corte contado em meta.cobertura.agenda
- [Phase 1]: Orcamento global de arestas com fanout efetivo registrado em meta.json, em vez de degradar em silencio
- [Phase 1]: situado_em e dirigida; porTerritorio so desce a hierarquia
- [Phase 1]: vocabulario.json passa a ser { linguagens, temas }
- [Phase 1]: Moldura de celular com altura min(844px, 100vh-4rem) e rolagem interna; barra de abas em sticky dentro dela — barra presa a janela escaparia da moldura
- [Phase 1]: A ordem da barra entre as visoes troca por CSS order no mesmo componente, nunca por dois componentes irmaos (D-05)
- [Phase 1]: Os 9 tokens de cor do IC sao declarados mesmo com o gerador usando 7 — o contrato de D-08 fecha sobre o universo emitivel, nao sobre o uso atual
- [Phase 1]: Reserva sem-entidade mantida nas 4 rotas de entidade mesmo com as classes populadas: impede a rota de sumir se uma classe esvaziar
- [Phase 1]: Bastidor diverge por app:hidden/desk:hidden em vez de ramo em JS, para o conteudo sair no HTML exportado sem depender de hidratacao
- [Phase 2]: origemMotivo tem um terceiro valor, sem-aresta: o cartao de serendipidade nao vem de aresta e nao pode ser carimbado de composto
- [Phase 2]: Nenhuma aresta atua_em foi autorada para cruzar agentes com ocorrencias datadas — seria afirmacao factual falsa sobre pessoas reais
- [Phase 2]: Duracao e faixa etaria nao existem no grafo: predicado devolve indeterminado e a tela mostra o aviso, em vez de filtrar por proxy
- [Phase 2]: Desempate do feed por hash FNV-1a semeado pela persona; localeCompare proibido em caminhada.ts (M-4)
- [Phase 2]: D-43 com tres estados: o «declarado ausente» so vale para o CMS, que preenche as 8 dimensoes nos 100 eventos; a Enciclopedia nao tem campo e fica em «nao declarado»
- [Phase 2]: Bloco sem dado declara a ausencia em texto e nunca desaparece — a frase de ausencia e campo do grupo de vinculo, nao estado de erro
- [Phase 2]: A procedência exibida por passo é a da ARESTA (autorado), nunca a da entidade (ic) — as 4 entidades da cadeia vêm do acervo, as 3 ligações são nossas
- [Phase 2]: Atravessado é a união entre linguagens declaradas no repertório e as declaradas pelas entidades, e a tela diz de qual metade veio cada grupo
- [Phase 2]: Teto de 10 adjacentes POR LINGUAGEM (não global) para linguagensNovas continuar completo; a tela lista 12 e declara o recorte
- [Phase 2]: Nenhuma aresta atua_em autorada: a ausência de elenco é declarada em texto com o número medido (0 de 129 eventos datados)
- [Phase 2]: Gates de tela medem o DOM vivo em vez de grep no HTML — o payload RSC deixa de ser contavel por construcao
- [Phase 2]: A folga de D-33 e medida do conteudo ate a barra: scrollHeight sozinho nunca imprime folga real
- [Phase 2]: As 12 explicacoes do feed sao percorridas — uma medicao so nao prova caminho multi-salto
- [Phase 2]: D-57 em codigo: alertaDe() e chaveado no id da OCORRENCIA, entao nao existe caminho pelo qual um aviso alcance a sessao irma do mesmo evento
- [Phase 2]: Par do Cenario 4 fixado em constante: evento:cms:13845, sessao atingida 13845-t1-o0028 (22.08 12:00 -> 19:30), intacta 13845-t1-o0029 (23.08 10:00)
- [Phase 2]: quemInformou nao nomeia ninguem: as 527 arestas realiza chegam todas a evento:enc:*, nenhum evento com sessao futura tem instituicao — informante declarado autorado (T-03-08)
- [Phase 2]: Os dias da agenda guardam indices para dentro de agenda.eventos, nao slugs: 71,8 caracteres de slug medio x 2.425 pares evento-dia estourariam o teto de 200 KB do DTO
- [Phase 2]: O selo de gratuidade carrega a qualificacao dentro do proprio selo — «gratuito — sem ingresso declarado na fonte» — porque 0 dos 300 eventos declaram ingresso
- [Phase 2]: A rota /evento/[slug]/sessoes e o link para ela sao co-extensivos: 129 e 129, zero link morto e zero rota orfa
- [Phase 2]: 03-04: indice.ts nao importa o grafo — a fonte entra injetada, unica forma de o mesmo modulo montar o indice no build e ser importado pelo cliente sem violar DP-F
- [Phase 2]: 03-04: o caminho de imagem fica fora do indice — imagem nao viaja sem credito, e os dois somam 108 KB medidos num orcamento de 480 KB
- [Phase 2]: 03-04: faceta de gratuidade recusada, com o motivo na tela — 2.425 de 2.425 sessoes saem gratuitas porque nenhum dos 300 eventos declara ingresso (T-03-24)
- [Phase 2]: Mapa: projecao equirretangular propria, 10 unidades de viewBox por grau, viewBox 0 0 425 410 — sem biblioteca e sem rede (D-60)
- [Phase 2]: Agrupamento de pinos por GRADE de 1 grau (~111 km), nao por raio: estavel entre recortes diferentes
- [Phase 2]: Desertos culturais: 'registro' e o vinculo entidade-lugar (773 medidos), e a tela declara isso — 27 UFs da tabela de centroides, nao das 25 do grafo
- [Phase 2]: traduzir(frase, indice) por 9 regras declaradas e sem modelo: frase.ts nao importa o grafo, o indice entra injetado — e é isso que permite a frase ser editavel no cliente sem violar DP-F (D-65, D-64)
- [Phase 2]: «gratuito» vira classe:evento com a nao-recortancia declarada na ficha com os dois numeros medidos (2.425 de 2.425 sessoes gratuitas, 0 de 300 eventos declarando ingresso): ficha que finge filtrar ensina a desconfiar de todas as outras
- [Phase 2]: «perto de mim» vira territorio com substituicao declarada e escolha na propria ficha; nenhuma geolocalizacao e pedida (D-60, D-25)
- [Phase 2]: «parecido com X» e casamento por TEXTO porque Criterio de indice.ts nao tem campo de vizinhanca — e os 322 vizinhos fora do alcance estao declarados na tela com numero, em vez de escondidos
- [Phase 2]: porTerritorio chamada SEM janela em cidade.ts: a decisão de D-48/D-49 virou controle de tela — «quantos dias você fica», nunca «quando você vem»
- [Phase 2]: A marca de próprio do território só existe com a contagem que a sustenta: 35 dos 39 registros de Belém a recebem, e os 4 que a Enciclopédia documenta em outro município não
- [Phase 2]: O substituto de alternarItem prioriza âncora com coordenada própria antes do menor deslocamento — minimizar distância degenerava o dia para três itens no centroide
- [Phase 3]: visiveis() do prelúdio NÃO serve para SVG — offsetParent só existe em HTMLElement e reporta 0 de 88 pinos visíveis; forma em SVG se mede pelo retângulo
- [Phase 3]: «Cabe na primeira vista» é medido contra o TOPO DA BARRA DE ABAS (807px), nunca contra a moldura inteira (876px) nem innerHeight
- [Phase 3]: Data nunca é comparada por string entre formatos — «27.06.1967» > «2026-08-22» é true; compara-se o ano de 4 dígitos como número
- [Phase 3]: D-48 tem régua diferente por tela: /cidade/* não pode ter nenhuma data posterior à referência; /acontece pode mostrar as 166 sessões futuras que o CMS declara, e a régua ali é o horizonte do acervo
- [Phase 3]: A fase 3 introduziu um aviso de console (CSS de rota pré-carregado pelo prefetch da barra de abas e não usado) — limiar NÃO relaxado; verificar-fase3 sai com código 1 e verificar-comentado está vermelho
- [Phase 3]: Disjunção de arquivos da onda 1 confirmada por git: interseção vazia nos 6 pares, e globals.css com 0 linhas de diferença desde cc34f4e — o método de paralelização está provado para a fase 4
- [Phase 4]: encenado tem definicao ESTRITA — clone MAIS o original que ele viola; a frouxa daria 18 pares no estagio 2 em vez de 13, inflando o acerto do motor (04-01)
- [Phase 4]: globals.css e do 04-01 e de mais ninguem na fase 4: as quatro @import ja escritas, tres folhas nascem declaradas e vazias, e a onda 2 corre com tres executores sem ponto de colisao (04-01)
- [Phase 4]: 04-03: o numero de impacto e um CONJUNTO DE PESSOAS (Map por nome de persona), nunca uma soma de salvamentos — semeadas em personas.json UNIAO a persona ativa em agenda-cultural:salvos
- [Phase 4]: 04-03: as 2.425 sessoes atravessam a fronteira DP-F como UMA STRING por evento; em array de tuplas o payload RSC reescapava cada aspa e a pagina custava 268.367 bytes contra 219.854
- [Phase 4]: 04-05: a ancora de globals.css em verificar-fase3.mjs ficou em c03f627 exigindo DIFERENCA ZERO, e nao em a40f380 permitindo @import novo — a forma do plano era mais fraca; a protecao substantiva (so @import e comentario, :root byte a byte, variantes app:/desk:) virou tres gates novos em verificar-fase4.mjs
- [Phase 4]: 04-05: gate que afirma USABILIDADE mede geometria contra o conteiner (scrollWidth vs clientWidth, retangulo do elemento vs janela), e nao presenca e visibilidade — e a licao de 04-04, onde um gate verde convivia com o quinto atalho cortado fora da tela
- [Phase 4]: 04-05: os 6 atributos de interacao (data-decisao, data-editando, data-impacto, data-impacto-fonte, data-confirmar, data-cancelar) entram no gate de HTML com esperado ZERO e sao conferidos no DOM depois do clique que os cria — grep no HTML os mediria em 0 e acusaria contrato quebrado que nao esta
- [Phase 4]: 05-01: os 158 eventos situados nao sao 158 pinos — 110 caem dentro do contorno do Brasil e 48 tem coordenada verdadeira fora dele; os 48 ficam na lista contados e nomeados, sem serem desenhados, pela regra que a fase 3 instituiu
- [Phase 4]: 05-01: o DTO da tela viaja em TUPLA e nao em objeto — com campo nomeado media 148.652 bytes contra o teto de 61.440, e 39 KB disso eram os NOMES dos campos repetidos 287 vezes; em tupla mede 53.694
- [Phase 4]: 05-01: a ancora do gate 8 de verificar-fase3.mjs para 05-08 e c90fc9b, o unico commit deste plano que tocou globals.css
- [Phase 5]: 05-07: o resumo das 529 midias NAO viaja no catalogo — o teto de 100 KB deixava ~55 caracteres por item contra mediana de 111, e um resumo cortado ao meio e uma frase interrompida. Corte de CAMPO, nunca de item; o resumo inteiro vive nas 529 rotas do player
- [Phase 5]: 05-07: «nao pode ir? veja isto» declara 14 de 529 e nenhuma aresta midia->evento foi autorada — a ponte real e 34 arestas de 14 midias alcancando 25 eventos (D-92, T-05-34)
- [Phase 5]: 05-02: a divergencia web/app das telas de Camada 1 e SO de CSS sob [data-view=…] — zero ramo em JavaScript, zero componente irmao (D-79, D-05), provado por 59 gates no DOM vivo
- [Phase 5]: 05-02: importar uma constante de frase.ts por valor custa 10.311 bytes de chunk medidos — o empacotador nao sacode o modulo; a saida barata e prop de componente de servidor, que viaja no HTML da pagina estatica
- [Phase 5]: 05-04: o score da fila existe SO nos itens de IA — produtor e ingestao afirmam, a IA estima; pontuar as tres origens achataria a distincao que a tela existe para fazer (D-82)
- [Phase 5]: 05-04: o veto e o publicar tem DUAS travas — botao de fato disabled E a funcao de registro recusando por conta propria; aparencia sozinha vira decisao registrada quando o teclado ativa o botao (T-05-14, D-83, D-85)
- [Phase 5]: 05-04: o motivo do editor de trilha e o MESMO objeto PassoTrilha.motivo do selo publico, lido por passosParaEditor sobre passosDaTrilha — a igualdade de D-85 e por construcao, e o gate de 05-08 so a confirma (3 passos, identicos por atributo e por innerText)

### Pending Todos

Nenhum.

### Blockers/Concerns

- **Prazo duro de 3 dias contra 36 telas.** Ponto seguro é o fim da Phase 4 (cinco cenários fechados). Phases 5 e 6 são truncáveis, nessa ordem inversa.
- **Crawler desatualizado (não bloqueante).** `dados/bruto/enciclopedia/itens.jsonl` segue anexando entradas contaminadas por um parser antigo. O protótipo consome `dados/amostra/enciclopedia.jsonl`, já saneada, e não depende do crawl. Rodar `python3 dados/sanear.py` uma última vez ao fim do processo.
- **Cinco perguntas em aberto com o cliente** (PRD §15) — nenhuma bloqueia o protótipo; todas pertencem à fase de implementação.
- Projeto vive dentro do iCloud Drive com disco a 97%: o macOS despejou (dataless) arquivos de entrada e node_modules durante a execucao. 47 arquivos em dados/bruto e .planning seguem sem conteudo. Mover o projeto para fora do iCloud antes da fase 2.
- Onda 2 correu na mesma arvore de trabalho: builds do Next colidiram por lock e tsc compila o codigo dos tres planos. Proxima onda paralela precisa de worktree por executor
- O gate 8 de scripts/verificar-fase3.mjs ancora globals.css em cc34f4e e ja estava vermelho antes da fase 4 (a consolidacao a40f380 o quebrou). 04-05 deve reancora-lo em c03f627, o commit do 04-01.

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Product scope | 86 itens do catálogo de funcionalidades, dos quais 57 ★ | Deferred | 2026-08-21 | PRODUCT-MVP |
| Infra | Backend, banco, CMS, APIs reais, IA em produção, analytics, observabilidade, segurança | Deferred | 2026-08-21 | PRODUCT-MVP |

## Session Continuity

Last session: 2026-08-22T21:40:00.000Z
Stopped at: Completed 05-08-PLAN.md (a verificacao da fase 5 e a nao-regressao das quatro suites)
Resume file: None
