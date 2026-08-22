# Requirements: Agenda Cultural BR

**Defined:** 2026-08-21
**Core Value:** Os cinco cenários do RFP rodam ao vivo, de ponta a ponta, nas duas visões, na frente da banca.

**Nota de escopo — leia antes de planejar.** As fontes usam "MVP" em dois sentidos, e
confundi-los produz um plano errado.

| Escopo | O que é | Onde está aqui |
|---|---|---|
| **PROTOTYPE** | A entrega em curso (PRD §14): front-end navegável, duas visões, dados mockados, 36 telas, 3 dias | **v1 Requirements** |
| **PRODUCT-MVP** | A primeira fase do roadmap de produto (PRD §12): os 57 itens ★ de `docs/funcionalidades.md`. Pressupõe backend, ingestão e IA | **v2 Requirements** |

Os requisitos v1 abaixo são a decomposição atômica da Parte A de
`.planning/intel/requirements.md` — um requisito por tela ou por comportamento verificável,
para que cada um caia em exatamente uma fase. A rastreabilidade aos slugs originais do
ingest está na coluna `origem`.

---

## v1 Requirements

### FUND — Fundação do protótipo

- [x] **FUND-01**: O protótipo roda como aplicação Next.js (App Router) + TypeScript + Tailwind, com export estático e nenhuma chamada a backend, banco, CMS ou API real — origem: `REQ-prototipo-frontend-navegavel`, `CON-stack-do-prototipo`
- [x] **FUND-02**: Um controle visível alterna ao vivo entre a visão mobile-app e a visão web-desktop, a partir de um único código com dois layouts, sem trocar de projeto ou de URL — origem: `REQ-alternador-de-visoes`
- [x] **FUND-03**: A identidade do Itaú Cultural existe como design tokens — paleta principal (`#ffffff`, `#ff7800`, `#000000`) e de apoio (`#7f3e98`, `#30c5f4`, `#f9df4d`, `#e04b9b`, `#a6ce39`, `#69c4a4`), tipografia Itaú Text (≤12pt) / Itaú Display (≥13pt) com Myriad e Arial como substitutas, grafismo `\` nas três variações e chancela Fundação Itaú — origem: `REQ-identidade-visual-prototipo`
- [x] **FUND-04**: A navegação do app tem as 5 abas (Descobrir · Acontece · Play · Buscar · Meu) e rotas que espelham o produto real; Mapa é lente e não aba, Formação e Oportunidades não têm aba, institucional é rodapé — origem: `CON-arquitetura-informacao`, `DEC-mapa-nao-e-aba`

### DADO — Camada de dados em formato de grafo

- [x] **DADO-01**: Fixtures tipadas em `.ts`/`.json` no formato do grafo, transformadas de `dados/normalizado/` (2.534 entidades), `dados/amostra/enciclopedia.jsonl` (1.766 registros) e `dados/taxonomia/` — transformação, não nova coleta — origem: `REQ-dados-mockados-ontologicos`
- [x] **DADO-02**: Evento, Temporada e Ocorrência são entidades separadas com os critérios de identidade da ontologia, e um Evento expõe N Ocorrências — origem: `DEC-ocorrencia-entidade-propria`, `CON-criterios-de-identidade`
- [x] **DADO-03**: O papel (artista, curador, produtor, educador) vive na relação `atua_em`, nunca como classe de agente; as classes são Pessoa, Coletivo, Instituição e Espaço Cultural — origem: `DEC-papeis-nao-sao-classes`
- [x] **DADO-04**: Toda aresta `semelhante_a` carrega justificativa legível em português, e o vocabulário de relações do PRD §6 está representado no mock — origem: `DEC-recomendacao-explicavel`, `CON-vocabulario-de-relacoes`
- [x] **DADO-05**: Toda entidade carrega `procedencia` em `ic | derivado | autorado`, conforme a tabela de procedência de PRD §14 — origem: `DEC-procedencia-do-mock`, `CON-procedencia-do-mock`
- [x] **DADO-06**: O território consumido vem saneado por `dados/sanear.py` (947 entradas válidas, 113 espaços distintos) e as coordenadas geográficas são derivadas de centroide de município e aproximação por espaço, marcadas `derivado` — origem: `DEC-saneamento-por-conteudo`, `CON-saneamento-territorio`
- [x] **DADO-07**: Os três conjuntos que não existem em sistema nenhum do IC estão autorados e marcados — Ocorrências derivadas do período real do evento, 3 Pessoas-usuárias com Repertório (Maria, Carlos, uma frequentadora) e ~40 duplicatas clonadas de eventos reais para o Cenário 3 — origem: `DEC-procedencia-do-mock`
- [x] **DADO-08**: As 2.382 imagens de `dados/imagens/` são servidas localmente pelo protótipo, com o índice de procedência de `dados/imagens/indice.json` preservado no mock — origem: `dados/baixar_imagens.py`, `CON-procedencia-do-mock`

### DESC — Camada 1 · Descoberta e a ponte (app mobile, 7 telas)

- [x] **DESC-01**: Tela **Onboarding por disposição** — entrada por disposição e não por categoria ("tenho 2h", "com criança", "de graça e perto", "quero algo que eu nunca vi") — origem: `REQ-visao-mobile-app`, `REQ-ordem-de-corte` Camada 1
- [x] **DESC-02**: Tela **Descobrir** — feed montado por caminhada no grafo, não por popularidade, com destaque curado capaz de sobrepor o algoritmo — origem: `REQ-visao-mobile-app` Camada 1
- [x] **DESC-03**: Tela **Explicação da recomendação** — o motivo escrito e as arestas que levaram até o item, acessível de qualquer recomendação — origem: `REQ-visao-mobile-app` Camada 1, `DEC-recomendacao-explicavel`
- [x] **DESC-04**: Tela **Trilha de primeira vez** — o caminho rap → poesia falada → teatro documentário como três arestas navegáveis, terminando em montagem real, gratuita e datada — origem: `REQ-visao-mobile-app` Camada 1, `REQ-roteiro-demonstracao` Cenário 1
- [x] **DESC-05**: Tela **Página do artista** (mobile) — papéis, obras, movimentos e eventos vinculados — origem: `REQ-visao-mobile-app` Camada 1
- [x] **DESC-06**: Tela **Página do evento** (mobile) — evento como entidade única com N ocorrências, ficha de acessibilidade e verbete embutido — origem: `REQ-visao-mobile-app` Camada 1
- [x] **DESC-07**: Tela **Meu Repertório** — o que a persona atravessou e o que fica adjacente a um passo — origem: `REQ-visao-mobile-app` Camada 1, `DEC-repertorio-primeira-classe`
- [x] **DESC-08**: A ponte Enciclopédia↔agenda é navegável nos dois sentidos — do artista para o evento em que ele se apresenta e do evento para o verbete do artista, sem sair do fluxo, com a conexão visível e não apenas linkável — origem: `REQ-ponte-enciclopedia-agenda`

### AGEN — Camada 1 · Agenda, território e busca (app mobile, 7 telas)

- [x] **AGEN-01**: Tela **Acontece** — agenda como lista de eventos, cada um aparecendo uma única vez, com sua lista de ocorrências (data, hora, espaço, preço) — origem: `REQ-visao-mobile-app` Camada 1
- [x] **AGEN-02**: Tela **Seleção de ocorrência** — escolher uma sessão específica dentro do evento e salvá-la — origem: `REQ-visao-mobile-app` Camada 1, `DEC-ocorrencia-entidade-propria`
- [x] **AGEN-03**: Tela **Salvos e alertas** — ocorrências salvas com alerta de alteração ou cancelamento vinculado à sessão, não ao evento — origem: `REQ-visao-mobile-app` Camada 1, `REQ-roteiro-demonstracao` Cenário 4
- [x] **AGEN-04**: Tela **Mapa** — lente sobre qualquer resultado já em tela, nunca home, com volta para a lista sem perder o recorte — origem: `REQ-visao-mobile-app` Camada 1, `DEC-mapa-nao-e-aba`
- [x] **AGEN-05**: Tela **Modo Cidade** — planejar estadia de N dias em território desconhecido, com roteiro por dia que equilibra deslocamento e densidade e prioriza o que é próprio do território (Belém, 4 dias) — origem: `REQ-visao-mobile-app` Camada 1, `REQ-roteiro-demonstracao` Cenário 2
- [x] **AGEN-06**: Tela **Buscar** — busca unificada sobre o grafo (agenda, acervo, editorial e verbetes num só índice), com facetas derivadas da ontologia — origem: `REQ-visao-mobile-app` Camada 1
- [x] **AGEN-07**: Tela **Busca em linguagem natural** — a frase vira consulta estruturada com a tradução visível ("busquei arte contemporânea, coletiva, em espaço público, gratuita, até 5 km") e editável em um toque; não é chatbot — origem: `REQ-visao-mobile-app` Camada 1, `REQ-roteiro-demonstracao` Cenário 5

### STUD — Camada 1 · Studio e roteiro dos cenários (web, 2 telas + demonstração)

- [x] **STUD-01**: Tela **Studio: duplicatas** (web) — milhares de registros duplicados colapsam em um evento com N ocorrências, com a chave determinística que os uniu, o score do segundo estágio, a sugestão de merge e a procedência visíveis; merge reversível — origem: `REQ-visao-web-desktop` Camada 1, `REQ-roteiro-demonstracao` Cenário 3, `DEC-dedup-dois-estagios`
- [x] **STUD-02**: Tela **Studio: ocorrências** (web) — alterar o horário de uma sessão altera só aquela ocorrência, sem invalidar o evento, e dispara alerta apenas para quem salvou aquela ocorrência — origem: `REQ-visao-web-desktop` Camada 1, `REQ-roteiro-demonstracao` Cenário 4
- [x] **STUD-03**: Roteiro de demonstração com os cinco cenários do RFP navegáveis ao vivo, de ponta a ponta, nas duas visões — origem: `REQ-roteiro-demonstracao`
- [x] **STUD-04**: Cada cenário tem ponto de entrada direto e estado pré-semeado, para a banca pedir qualquer um fora de ordem sem preparação manual — origem: `REQ-roteiro-demonstracao`

### WEB — Camada 2 · Visão web desktop (7 telas)

- [x] **WEB-01**: Tela **Descobrir** (web desktop) — layout próprio de desktop, não mobile esticado — origem: `REQ-visao-web-desktop` Camada 2
- [x] **WEB-02**: Tela **Acontece com mapa lado a lado** (web desktop) — origem: `REQ-visao-web-desktop` Camada 2
- [x] **WEB-03**: Tela **Página do evento** (web desktop) — origem: `REQ-visao-web-desktop` Camada 2
- [x] **WEB-04**: Tela **Buscar** (web desktop) — origem: `REQ-visao-web-desktop` Camada 2
- [x] **WEB-05**: Tela **Redação: fila** — fila de moderação e aprovação, com sugestões marcadas `procedencia: ia` mais score e revisão humana antes de virar dado público — origem: `REQ-visao-web-desktop` Camada 2, `DEC-limites-da-ia`
- [x] **WEB-06**: Tela **Redação: trilha** — editor de trilha curada, com destaque e veto editorial registrando autoria — origem: `REQ-visao-web-desktop` Camada 2
- [x] **WEB-07**: Tela **Observatório: indicadores** — indicadores de impacto cultural e territoriais, e a marcação de procedência do mock visível na interface — origem: `REQ-visao-web-desktop` Camada 2, `DEC-procedencia-do-mock`

### APPX — Camada 2 · Profundidade do app (5 telas)

- [x] **APPX-01**: Tela **Filtros** — filtros ontológicos: linguagem, gratuidade, faixa etária, território e as 8 dimensões de acessibilidade como critério de primeira classe, não selo — origem: `REQ-visao-mobile-app` Camada 2, `DEC-acessibilidade-como-filtro`
- [x] **APPX-02**: Tela **Play** — catálogo unificado de vídeo, podcast, série e playlist, conectado ao evento ("não pode ir? veja isto") — origem: `REQ-visao-mobile-app` Camada 2
- [x] **APPX-03**: Tela **Player** — player com retomada — origem: `REQ-visao-mobile-app` Camada 2
- [x] **APPX-04**: Tela **Zero-resultado como descoberta** — `/404`, `/busca-nao-encontrada` e `/agenda-nao-encontrada` oferecem caminho de descoberta em vez de mensagem de erro; inclui o estado vazio de Buscar — origem: `REQ-zero-resultado-como-descoberta`
- [x] **APPX-05**: Tela **Página do produtor** (mobile) — origem: `REQ-visao-mobile-app` Camada 2

### CAM3 — Camada 3 · Profundidade opcional (8 telas)

- [ ] **CAM3-01**: Telas **Onboarding 2 e 3** — as duas telas restantes do onboarding por disposição (2 telas) — origem: `REQ-visao-mobile-app` Camada 3
- [ ] **CAM3-02**: Tela **Página da obra** (mobile) — a cadeia Obra → Expressão → Manifestação → Item com exemplo real — origem: `REQ-visao-mobile-app` Camada 3
- [ ] **CAM3-03**: Tela **Mapa de repertório** (mobile) — o que atravessou e o que fica adjacente, em forma de mapa — origem: `REQ-visao-mobile-app` Camada 3
- [ ] **CAM3-04**: Tela **Studio: publicar** (web) — publicação de evento com validação em tempo real e score de qualidade do cadastro — origem: `REQ-visao-web-desktop` Camada 3
- [ ] **CAM3-05**: Tela **Perfil** (web desktop) — origem: `REQ-visao-web-desktop` Camada 3
- [ ] **CAM3-06**: Tela **Página do artista** (web desktop) — origem: `REQ-visao-web-desktop` Camada 3
- [ ] **CAM3-07**: Tela **Página do produtor** (web desktop) — origem: `REQ-visao-web-desktop` Camada 3

---

## v2 Requirements

Escopo **PRODUCT-MVP e fases posteriores** (PRD §12). São os 86 itens numerados de
`docs/funcionalidades.md`, dos quais **57 são ★ (MVP do produto)**. Pressupõem backend,
ingestão e IA em produção — **não estão neste roadmap**. O protótipo apenas *demonstra*
o comportamento com dado mockado, no que a tela precisa mostrar.

| ID de origem | Módulo | Itens | ★ (MVP do produto) |
|---|---|---|---|
| `REQ-descobrir` | Descobrir | 1–8 | 1, 2, 3, 6, 7 |
| `REQ-acontece` | Acontece | 9–18 | 9, 10, 11, 12, 13, 14, 15 |
| `REQ-mapa-territorio` | Mapa & Território | 19–24 | 19, 20, 21 |
| `REQ-play` | Play | 25–30 | 25, 26, 28 |
| `REQ-enciclopedia-acervo` | Enciclopédia & Acervo | 31–37 | 31, 32, 34, 37 |
| `REQ-leituras` | Leituras | 38–41 | 38, 40 |
| `REQ-formacao` | Formação (sem aba) | 42–45 | 44 |
| `REQ-oportunidades` | Oportunidades (sem aba) | 46–49 | 46, 48, 49 |
| `REQ-meu-repertorio` | Meu Repertório | 50–57 | 50, 51, 52, 53, 55, 57 |
| `REQ-studio-produtor` | Studio | 58–64 | 58, 59, 60, 61, 64 |
| `REQ-redacao-curador` | Redação | 65–70 | 65, 66, 67, 69 |
| `REQ-observatorio-dados` | Observatório & Dados | 71–77 | 71, 72, 73, 74, 76, 77 |
| `REQ-transversais` | Transversais | 78–86 | 78–84, 86 |
| `REQ-cobertura-fluxos-rfp` | Rastreabilidade aos fluxos do RFP | — | — |

Detalhe item a item em `.planning/intel/requirements.md` (Parte B) e em `docs/funcionalidades.md`.

---

## Out of Scope

Exclusões explícitas desta entrega, com o motivo, para impedir reintrodução.

| Feature | Reason |
|---------|--------|
| Backend, banco de dados e CMS | O RFP pede protótipo navegável; fase seguinte com o time de produto (PRD §14) |
| APIs reais e integração com os 11 sistemas do IC | Depende de acesso interno ainda não concedido (PRD §15, pergunta 3) |
| IA em produção — extração, casamento probabilístico, tradução de linguagem natural real | O protótipo demonstra o comportamento com dado mockado marcado `procedencia: ia` |
| Analytics, observabilidade, segurança e infraestrutura | Fase seguinte (PRD §14) |
| Aplicativo de loja (binário iOS/Android) | O RFP pede protótipo navegável, não binário |
| Implementação dos 57 itens ★ | São o PRODUCT-MVP do roadmap de produto (PRD §12), não esta entrega |
| Nova coleta ou crawl de dados | 2.534 entidades, 1.766 registros da Enciclopédia, taxonomia e 2.382 imagens já estão em disco; o trabalho é transformar |
| Design de identidade visual | O manual de marca do Itaú Cultural é dado, não exercício |
| Autenticação real, LGPD operacional, consentimento | Depende de backend; as telas mostram o princípio, não o mecanismo |
| Testes automatizados de ampla cobertura | Prazo de 3 dias; a verificação é a navegação ao vivo dos cinco cenários |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FUND-01 | Phase 1 | Complete |
| FUND-02 | Phase 1 | Complete |
| FUND-03 | Phase 1 | Complete |
| FUND-04 | Phase 1 | Complete |
| DADO-01 | Phase 1 | Complete |
| DADO-02 | Phase 1 | Complete |
| DADO-03 | Phase 1 | Complete |
| DADO-04 | Phase 1 | Complete |
| DADO-05 | Phase 1 | Complete |
| DADO-06 | Phase 1 | Complete |
| DADO-07 | Phase 1 | Complete |
| DADO-08 | Phase 1 | Complete |
| DESC-01 | Phase 2 | Complete |
| DESC-02 | Phase 2 | Complete |
| DESC-03 | Phase 2 | Complete |
| DESC-04 | Phase 2 | Complete |
| DESC-05 | Phase 2 | Complete |
| DESC-06 | Phase 2 | Complete |
| DESC-07 | Phase 2 | Complete |
| DESC-08 | Phase 2 | Complete |
| AGEN-01 | Phase 3 | Complete |
| AGEN-02 | Phase 3 | Complete |
| AGEN-03 | Phase 3 | Complete |
| AGEN-04 | Phase 3 | Complete |
| AGEN-05 | Phase 3 | Complete |
| AGEN-06 | Phase 3 | Complete |
| AGEN-07 | Phase 3 | Complete |
| STUD-01 | Phase 4 | Complete |
| STUD-02 | Phase 4 | Complete |
| STUD-03 | Phase 4 | Complete |
| STUD-04 | Phase 4 | Complete |
| WEB-01 | Phase 5 | Complete |
| WEB-02 | Phase 5 | Complete |
| WEB-03 | Phase 5 | Complete |
| WEB-04 | Phase 5 | Complete |
| WEB-05 | Phase 5 | Complete |
| WEB-06 | Phase 5 | Complete |
| WEB-07 | Phase 5 | Complete |
| APPX-01 | Phase 5 | Complete |
| APPX-02 | Phase 5 | Complete |
| APPX-03 | Phase 5 | Complete |
| APPX-04 | Phase 5 | Complete |
| APPX-05 | Phase 5 | Complete |
| CAM3-01 | Phase 6 | Pending |
| CAM3-02 | Phase 6 | Pending |
| CAM3-03 | Phase 6 | Pending |
| CAM3-04 | Phase 6 | Pending |
| CAM3-05 | Phase 6 | Pending |
| CAM3-06 | Phase 6 | Pending |
| CAM3-07 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0 ✓

**Verificação da partição de telas** (contra `REQ-ordem-de-corte` e o inventário de PRD §14):

| Camada | Telas | Fases | Mobile | Web |
|---|---|---|---|---|
| Camada 1 — intocável | 16 | Phase 2 (7) · Phase 3 (7) · Phase 4 (2) | 14 | 2 |
| Camada 2 | 12 | Phase 5 | 5 | 7 |
| Camada 3 — cai primeiro | 8 | Phase 6 | 4 | 4 |
| **Total** | **36** | | **23** | **13** |

16 + 12 + 8 = 36 · 14 + 5 + 4 = 23 mobile · 2 + 7 + 4 = 13 web. Sem sobreposição, sem lacuna. ✓

---
*Requirements defined: 2026-08-21*
*Last updated: 2026-08-21 after ingest de `docs/PRD.md`, `docs/funcionalidades.md` e `dados/inventario/mapa-conteudo.md`*
