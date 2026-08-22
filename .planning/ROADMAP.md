# Roadmap: Agenda Cultural BR

## Overview

Seis fases levam de repositório vazio a um protótipo navegável de 36 telas em duas visões,
com os cinco cenários do RFP rodando ao vivo. A estrutura segue a ordem de corte de PRD §14,
que é a autoridade sobre risco de escopo: **Phase 1** monta a fundação (casca, marca,
alternador de visões) e transforma o acervo real já em disco em um grafo mockado;
**Phases 2, 3 e 4** entregam as 16 telas intocáveis da Camada 1 e fecham os cinco cenários;
**Phase 5** entrega as 12 telas da Camada 2; **Phase 6** entrega as 8 telas da Camada 3.

**O ponto seguro é o fim da Phase 4.** A partir dali a demonstração existe e responde ao que
a banca vai perguntar. Tudo depois é ganho, e cai de baixo para cima se o prazo apertar.
Nenhum trabalho da Camada 3 (Phase 6) é pré-requisito de qualquer trabalho da Camada 1
(Phases 2–4) — a dependência corre só no sentido Phase 1 → Camada 1 → Camada 2 → Camada 3.

**Horizonte de 3 dias.** Alvo do dia 1: Phases 1 e 2 — a casca vive, tem a cara do IC, lê o
grafo real e o Cenário 1 já anda. Alvo do dia 2: Phases 3 e 4 — os cinco cenários fecham.
Alvo do dia 3: Phase 5, depois Phase 6 enquanto houver folga.

**O que este marco não é.** Não há backend, banco, CMS, API real, IA em produção, analytics,
observabilidade, segurança nem infraestrutura. Os 57 itens ★ do catálogo de funcionalidades
são o PRODUCT-MVP do horizonte seguinte, com o time de produto do cliente — o protótipo só
mostra na tela o que a tela precisa mostrar. Ver `.planning/PROJECT.md` → Out of Scope.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): trabalho planejado do marco
- Decimal phases (2.1, 2.2): inserções urgentes (marcadas com INSERTED)

- [x] **Phase 1: Fundação — casca, marca e grafo mockado** - Next.js + Tailwind com identidade IC, alternador de visões ao vivo e o acervo real transformado em grafo tipado
- [x] **Phase 2: Camada 1 — Descoberta e a ponte** - As 7 telas mobile que levam Maria do rap ao teatro documentário e conectam acervo a agenda nos dois sentidos
- [x] **Phase 3: Camada 1 — Agenda, território e busca** - As 7 telas mobile de Acontece, ocorrência, salvos, mapa, Modo Cidade e busca em linguagem natural
- [x] **Phase 4: Camada 1 — Studio e o roteiro dos cinco cenários** - Dedup e gestão de ocorrências no Studio, e a demonstração ao vivo fechada de ponta a ponta
- [x] **Phase 5: Camada 2 — Visão web desktop e profundidade do app** - As 12 telas sem as quais a proposta fica pobre: web desktop, Redação, Observatório, filtros, Play e zero-resultado
- [ ] **Phase 6: Camada 3 — Profundidade opcional** - As 8 telas que caem primeiro: onboarding completo, obra, mapa de repertório e as telas web restantes

## Phase Details

### Phase 1: Fundação — casca, marca e grafo mockado

**Goal**: O protótipo existe, tem a cara do Itaú Cultural, alterna as duas visões ao vivo e lê um grafo tipado construído a partir do acervo real que já está em disco.
**Depends on**: Nothing (first phase)
**Requirements**: FUND-01, FUND-02, FUND-03, FUND-04, DADO-01, DADO-02, DADO-03, DADO-04, DADO-05, DADO-06, DADO-07, DADO-08
**Success Criteria** (what must be TRUE):

  1. Abrindo o protótipo no navegador, a pessoa vê a home com a identidade do Itaú Cultural aplicada — laranja `#ff7800`, preto, branco, a tipografia do manual (ou as substitutas previstas por ele) e o grafismo `\`.
  2. Um controle visível alterna entre a visão mobile-app e a visão web-desktop ao vivo, sem recarregar outro projeto ou outra URL.
  3. As 5 abas (Descobrir · Acontece · Play · Buscar · Meu) navegam entre si, mesmo com as telas ainda em esqueleto.
  4. Uma rota interna de verificação lista as contagens reais por tipo de entidade e por procedência (`ic` / `derivado` / `autorado`), provando que o grafo carregou a partir de `dados/normalizado/`, `dados/amostra/enciclopedia.jsonl` e `dados/taxonomia/`.
  5. Consultar um evento do grafo devolve N ocorrências, agentes com papel na relação `atua_em` e ao menos uma aresta `semelhante_a` com justificativa escrita em português.

**Plans**: 3/3 plans executed

- [x] 01-01-PLAN.md — Traçador vertical: scaffold, export estático, alternador `data-view` e a espinha do gerador com o contrato de tipos e travessia
- [x] 01-02-PLAN.md — Camada de dados: classes da ontologia, Evento/Temporada/Ocorrência, coordenadas derivadas, ~40 duplicatas, 3 personas, 900 imagens
- [x] 01-03-PLAN.md — Marca e navegação: paleta e tipografia do manual, grafismo, as 18 rotas de D-12 e as 5 abas nas duas visões

**UI hint**: yes

**Notas de execução**

- Ondas: `01-01` sozinho na onda 1 (fixa o contrato de tipos e travessia); `01-02` e `01-03` em
  paralelo na onda 2, com zero sobreposição de `files_modified` — verificado no planejamento.

- Duas frentes disjuntas em arquivo, boas candidatas a planos paralelos: (a) casca, layouts, tokens de marca e alternador; (b) transformação dos dados em fixtures tipadas.
- Transformar, não coletar. Nenhum crawl novo. `dados/bruto/enciclopedia/` está contaminado e não é a base — a base é `dados/amostra/enciclopedia.jsonl`, saneada.
- O formato do mock é entregue depois como contrato de API (`CON-mock-como-contrato-de-api`), então a fidelidade à ontologia não é preciosismo: é a entrega.

---

### Phase 2: Camada 1 — Descoberta e a ponte

**Goal**: Maria, que nunca foi ao teatro, chega a uma montagem gratuita a poucos quilômetros pelo caminho que ela já anda — e o app mostra o caminho, não só o resultado.
**Depends on**: Phase 1
**Requirements**: DESC-01, DESC-02, DESC-03, DESC-04, DESC-05, DESC-06, DESC-07, DESC-08
**Success Criteria** (what must be TRUE):

  1. A pessoa escolhe uma disposição no onboarding ("tenho 2h", "de graça e perto", "quero algo que eu nunca vi") e chega a um feed de Descobrir montado por caminhada no grafo, não por popularidade.
  2. Tocando em "por que isto?" em qualquer recomendação, ela vê o motivo escrito e as arestas que levaram até ali.
  3. O caminho rap → poesia falada → teatro documentário aparece como trilha navegável de três passos e termina em uma montagem real, gratuita e datada.
  4. Da página do artista dá para chegar ao evento em que ele se apresenta, e da página do evento dá para chegar ao verbete do artista, sem sair do fluxo.
  5. Meu Repertório mostra o que a persona já atravessou e o que está adjacente a um passo — nunca a dez.

**Plans**: 5/5 plans executed

Plans:

- [x] 02-01-PLAN.md — Sessão, disposição e o motor de caminhada; o cartão e a capa sem imagem (DESC-01, DESC-02)
- [x] 02-02-PLAN.md — Descobrir e a rota de explicação da recomendação (DESC-02, DESC-03)
- [x] 02-03-PLAN.md — Trilha de primeira vez e Meu Repertório (DESC-04, DESC-07)
- [x] 02-04-PLAN.md — Página do artista, página do evento e a ponte bidirecional (DESC-05, DESC-06, DESC-08)
- [x] 02-05-PLAN.md — Verificação do Cenário 1 dirigida por Chrome headless (DESC-01..DESC-08)

**Ondas**: 1 → `02-01` · 2 → `02-02` + `02-03` + `02-04` em paralelo · 3 → `02-05`

**UI hint**: yes

**Notas de execução**

- Telas (7, todas mobile, Camada 1): Onboarding por disposição (tela 1) · Descobrir · Explicação da recomendação · Trilha de primeira vez · Página do artista · Página do evento · Meu Repertório.
- **Três disjunções medidas no grafo condicionam esta fase** e estão registradas nos planos: `semelhante_a` é intraclasse (47.258 de 47.259), então heterogeneidade exige arestas estruturais e motivo composto a partir da relação; agente e data não se cruzam (0 dos 129 eventos datados tem agente); nenhuma das 2.425 ocorrências tem espaço. Nada foi preenchido com valor plausível — cada ausência é declarada na tela.
- Fecha o **Cenário 1** do RFP. É também a demonstração da tese: a ponte Enciclopédia↔agenda precisa ser visível, não apenas linkável.
- As telas 2 e 3 do onboarding são Camada 3 (Phase 6) e não podem ser pré-requisito desta fase.

---

### Phase 3: Camada 1 — Agenda, território e busca

**Goal**: A agenda funciona como grafo — um evento, N ocorrências — e o território e a linguagem natural viram lentes sobre ele.
**Depends on**: Phase 1
**Requirements**: AGEN-01, AGEN-02, AGEN-03, AGEN-04, AGEN-05, AGEN-06, AGEN-07
**Success Criteria** (what must be TRUE):

  1. Em Acontece, um evento aparece uma única vez e abre a lista das suas N ocorrências com data, hora, espaço e preço.
  2. Selecionando uma ocorrência e salvando, ela aparece em Salvos e alertas vinculada àquela sessão, não ao evento.
  3. O Mapa abre como lente sobre o resultado que já estava na tela e volta para a lista sem perder o recorte.
  4. Carlos monta 4 dias em Belém no Modo Cidade e vê um roteiro por dia que equilibra deslocamento e densidade e prioriza o que é próprio do território.
  5. Digitando "algo parecido com a Bienal, gratuito e perto de mim", a pessoa vê a frase traduzida em facetas legíveis, edita qualquer faceta em um toque e o resultado muda.

**Plans**: 7/7 plans executed

Plans:

- [x] 03-01-PLAN.md — Acontece e a seleção de ocorrência: a agenda como lista de eventos, e a tela onde se salva a sessão (onda 1)
- [x] 03-02-PLAN.md — Salvos e alertas: a fila de sessões e o alerta autorado que chega só a quem salvou aquela ocorrência (onda 1)
- [x] 03-03-PLAN.md — Mapa e desertos culturais: projeção própria em SVG, sem biblioteca e sem rede, com a concentração desenhada (onda 1)
- [x] 03-04-PLAN.md — Buscar e o índice único sobre o grafo, com facetas da ontologia e zero-resultado que oferece saída medida (onda 1)
- [x] 03-05-PLAN.md — Modo Cidade: o roteiro de Belém sobre o acervo do território, sem fabricar data (onda 2)
- [x] 03-06-PLAN.md — Busca em linguagem natural: a frase vira critérios editáveis por regra declarada, sem modelo (onda 2)
- [x] 03-07-PLAN.md — Verificação da fase 3: AGEN-01..07 e os Cenários 2, 4 e 5 provados em Chrome headless sobre `out/` (onda 3)

**UI hint**: yes

**Notas de execução**

- Telas (7, todas mobile, Camada 1): Acontece · Seleção de ocorrência · Salvos e alertas · Mapa · Modo Cidade · Buscar · Busca em linguagem natural.
- Ondas: 1 (03-01..03-04, quatro executores em paralelo) · 2 (03-05 depende de `geo.ts` do 03-03; 03-06 depende de `indice.ts` do 03-04) · 3 (03-07, verificação).
- Disjunção de arquivos provada mecanicamente: 32 arquivos, cada um com exatamente um dono, zero colisão dentro de qualquer onda. `src/app/globals.css` está proibido para a fase inteira — cada plano tem o seu arquivo sob `src/estilos/`.
- **Confirmado por `git` no 03-07:** interseção vazia nos 6 pares da onda 1 (03-01 7 arquivos · 03-02 5 · 03-03 6 · 03-04 4) e `globals.css` com 0 linhas de diferença desde `cc34f4e`. O método de paralelização está provado e a fase 4 pode repeti-lo.
- **A fase NÃO fecha verde:** `npm run verificar-fase3` mede 92 gates verdes e 1 vermelho — a fase 3 introduziu um aviso de console (CSS de rota pré-carregado e não usado) que deixou `npm run verificar-comentado` vermelho. Ver `03-07-SUMMARY.md` e `WINDOWS.md` #18.
- Fecha os **Cenários 2 e 5** e entrega a metade-app do **Cenário 4** (o alerta que chega a quem salvou aquela ocorrência).
- Tecnicamente depende só da Phase 1 — pode rodar em paralelo com a Phase 2 se houver folga de execução.
- Filtros é Camada 2 (Phase 5): Buscar e Acontece precisam funcionar sem a tela de Filtros.

---

### Phase 4: Camada 1 — Studio e o roteiro dos cinco cenários

**Goal**: A superfície profissional prova o mecanismo — mil duplicados viram um evento, uma mudança de horário atinge uma ocorrência — e os cinco cenários do RFP rodam ao vivo sem preparação manual.
**Depends on**: Phase 2, Phase 3
**Requirements**: STUD-01, STUD-02, STUD-03, STUD-04
**Success Criteria** (what must be TRUE):

  1. No Studio: duplicatas, milhares de registros duplicados aparecem colapsados em um evento com N ocorrências, com a chave determinística que os uniu, o score do segundo estágio, a sugestão de merge e a procedência visíveis.
  2. No Studio: ocorrências, alterar o horário de uma sessão altera só aquela ocorrência, e o app mostra o alerta chegando para quem salvou aquela sessão — e não chegando para quem salvou o evento.
  3. Os cinco cenários do RFP rodam ao vivo de ponta a ponta, nas duas visões, a partir de pontos de entrada diretos.
  4. A banca pede qualquer cenário fora de ordem e ele abre já com o estado semeado, sem ninguém preparar nada entre um e outro.

**Plans**: 5/5 plans executed

Plans:

- [x] 04-01-PLAN.md — Traçador vertical: o motor de deduplicação de dois estágios e um grupo suspeito de ponta a ponta no Studio, com as quatro folhas da fase declaradas num bundle só
- [x] 04-02-PLAN.md — Studio: duplicatas — a fila dos dois estágios, o lado a lado com campos divergentes, as três ações e o registro da decisão humana
- [x] 04-03-PLAN.md — Studio: ocorrências — o evento imutável, a tabela editável, a prévia de impacto e o histórico de quem alterou
- [x] 04-04-PLAN.md — `/roteiro`: os cinco cenários como percurso clicável, com entrada direta, estado semeado e o que o acervo não sustenta
- [x] 04-05-PLAN.md — A verificação da fase 4 e a não-regressão das três suítes existentes

**UI hint**: yes

**Notas de execução**

- Ondas: `04-01` sozinho na onda 1 (traçador; fixa o contrato `data-*`, a API de `duplicatas.ts` e resolve `globals.css`); `04-02`, `04-03` e `04-04` em paralelo na onda 2, com zero sobreposição de `files_modified`; `04-05` sozinho na onda 3.
- Telas (2, web, Camada 1): Studio: duplicatas · Studio: ocorrências. É a primeira presença real da visão web.
- Fecha os **Cenários 3 e 4** e, com eles, a demonstração inteira. **Este é o ponto seguro do marco.**
- O roteiro de demonstração é a última coisa a cair (PRD §14) — é ela que responde ao que a banca vai perguntar.
- Studio: publicar é Camada 3 (Phase 6) e não pode ser pré-requisito destas duas telas.

---

### Phase 5: Camada 2 — Visão web desktop e profundidade do app

**Goal**: A promessa das duas visões deixa de ser um alternador com duas telas do lado web, e o app ganha a profundidade sem a qual a proposta fica pobre.
**Depends on**: Phase 4
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, APPX-01, APPX-02, APPX-03, APPX-04, APPX-05
**Success Criteria** (what must be TRUE):

  1. Na visão web-desktop, Descobrir, Acontece com mapa lado a lado, Página do evento e Buscar existem com layout próprio de desktop — não como mobile esticado.
  2. A Redação mostra uma fila de moderação com sugestões marcadas `procedencia: ia` e score, e um editor de trilha curada em que destaque e veto registram autoria.
  3. O Observatório exibe indicadores de impacto cultural e territoriais e a marcação de procedência do mock, transformando a limitação do protótipo em demonstração do princípio 9.
  4. No app, os filtros ontológicos funcionam — incluindo as 8 dimensões de acessibilidade como critério de busca, não como selo — e Play e Player rodam.
  5. Uma busca sem resultado oferece caminho de descoberta em vez de mensagem de erro.

**Plans**: 8/8 plans executed

Plans:

- [x] 05-01-PLAN.md — Traçador vertical: `/acontece` na web com lista e mapa sincronizados pelo cursor, e as 11 folhas da fase declaradas de uma vez em `globals.css`
- [x] 05-02-PLAN.md — Descobrir em grade com o destaque curado mais largo, e Buscar com as facetas em coluna permanente
- [x] 05-03-PLAN.md — Página do evento em tabela com painel lateral, e a página do produtor deixando de ser esqueleto nas 359 rotas
- [x] 05-04-PLAN.md — Redação: a fila com origem e score de IA, o veto que não conclui sem motivo, e o motivo por passo que bloqueia a publicação
- [x] 05-05-PLAN.md — Observatório: os indicadores calculados com denominador, e o painel de procedência como tela de primeira classe
- [x] 05-06-PLAN.md — Filtros com as 8 dimensões de acessibilidade como critério, e os três becos sem saída deixando de ser becos
- [x] 05-07-PLAN.md — Play: o catálogo das 529 mídias reais, e o Player que declara a ausência do arquivo e registra no repertório
- [x] 05-08-PLAN.md — A verificação da fase 5 e a não-regressão das quatro suítes existentes

**UI hint**: yes

**Notas de execução**

- Telas (12, Camada 2): web — Descobrir · Acontece com mapa lado a lado · Página do evento · Buscar · Redação: fila · Redação: trilha · Observatório: indicadores; mobile — Filtros · Play · Player · Zero-resultado como descoberta · Página do produtor.
- Fase truncável por desenho. Ordenar os planos de modo que as 7 telas web venham antes das 5 mobile: é o lado web que sustenta a promessa das duas visões.
- Ondas: `05-01` sozinho na onda 1 (traçador; escreve `globals.css` de uma vez, entrega `web.css` completa e cria as outras 10 folhas vazias, e congela o vocabulário `data-*`); `05-02` a `05-07` em paralelo na onda 2, com zero sobreposição de `files_modified`; `05-08` sozinho na onda 3.
- **Medido antes de planejar, e decide o desenho de duas telas:** a interseção entre «evento com sessão datada» (129) e «evento com lugar» (158) é **zero** — por isso Acontece na web tem dois recortes e o alternador entre eles é a declaração honesta virada controle. **Faixa etária não existe em campo nenhum do grafo**, então D-91 a declara inexistente em vez de oferecer um filtro que não filtra. **5 das 8 dimensões de acessibilidade medem zero** no acervo inteiro. A ponte mídia→evento é de **14 das 529** mídias.
- `05-01` quebrou de propósito o gate 8 de `verificar-fase3.mjs` (`globals.css` ancorado em `c03f627`); `05-08` o reancorou em `c90fc9b`, mantendo a forma **diferença zero**, e **sem mover o limiar de 1.784**. **O gate de contagem de páginas existia nas DUAS suítes herdadas** — `verificar-fase3.mjs` e `verificar-fase4.mjs` —, e as duas foram reancoradas com a mesma disciplina; `out/404.html` ficou fora das listas de explicáveis porque existe desde a fase 2.
- Nada aqui pode virar pré-requisito das Phases 2–4.

---

### Phase 6: Camada 3 — Profundidade opcional

**Goal**: As 8 telas que dão acabamento à proposta existem, se o prazo permitir — e a ausência delas não tira nada da demonstração.
**Depends on**: Phase 5
**Requirements**: CAM3-01, CAM3-02, CAM3-03, CAM3-04, CAM3-05, CAM3-06, CAM3-07
**Success Criteria** (what must be TRUE):

  1. O onboarding por disposição roda completo nas três telas.
  2. A Página da obra mostra a cadeia Obra → Expressão → Manifestação → Item com um exemplo real do acervo.
  3. O Mapa de repertório mostra, em forma de mapa, o que a persona atravessou e o que fica adjacente.
  4. As telas web de Perfil, Página do artista e Página do produtor existem, e o Studio: publicar mostra validação em tempo real com score de qualidade do cadastro.

**Plans**: TBD
**UI hint**: yes

**Notas de execução**

- Telas (8, Camada 3): mobile — Onboarding 2 e 3 · Página da obra · Mapa de repertório; web — Studio: publicar · Perfil · Página do artista · Página do produtor.
- **Esta é a primeira fase a cair.** Se o dia 3 apertar, ela é descartada inteira sem tocar em nada anterior.

## Progress

**Execution Order:**
As fases executam em ordem numérica: 1 → 2 → 3 → 4 → 5 → 6.
Phase 3 depende tecnicamente só da Phase 1 e pode rodar em paralelo com a Phase 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundação — casca, marca e grafo mockado | 3/3 | In Progress|  |
| 2. Camada 1 — Descoberta e a ponte | 5/5 | In Progress|  |
| 3. Camada 1 — Agenda, território e busca | 6/7 | In Progress|  |
| 4. Camada 1 — Studio e o roteiro dos cinco cenários | 5/5 | In Progress|  |
| 5. Camada 2 — Visão web desktop e profundidade do app | 6/8 | In Progress|  |
| 6. Camada 3 — Profundidade opcional | 0/TBD | Not started | - |

## Cobertura

50 requisitos v1 · 50 mapeados · 0 órfãos ✓
36 telas · Camada 1 (16) nas Phases 2–4 · Camada 2 (12) na Phase 5 · Camada 3 (8) na Phase 6 ✓
Tabela de rastreabilidade completa em `.planning/REQUIREMENTS.md`.

## Cenários do RFP × fases

| Cenário | Fecha em | Telas que atravessa |
|---|---|---|
| 1 — Maria descobre teatro por adjacência de repertório | Phase 2 | Onboarding · Descobrir · Explicação · Trilha de primeira vez · Página do artista · Página do evento |
| 2 — Carlos planeja 4 dias em Belém | Phase 3 | Modo Cidade · Mapa · Acontece · Página do evento |
| 3 — Mil duplicados viram um evento com N ocorrências | Phase 4 | Studio: duplicatas |
| 4 — Mudança de horário atinge uma ocorrência | Phase 4 | Studio: ocorrências · Seleção de ocorrência · Salvos e alertas |
| 5 — "Parecido com a Bienal, gratuito e perto de mim" | Phase 3 | Buscar · Busca em linguagem natural |
