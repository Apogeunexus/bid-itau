# Requirements

Fontes e precedência (override do manifest — inteiro menor vence):
- `docs/PRD.md` — precedence 0 (autoridade máxima)
- `docs/funcionalidades.md` — precedence 1
- `dados/inventario/mapa-conteudo.md` — precedence 2

**Nota de roteamento:** `docs/funcionalidades.md` foi classificado como SPEC, mas seu
conteúdo é um catálogo numerado de capacidades de produto. Ele foi extraído para este
arquivo (requirements) em vez de `constraints.md`, porque nenhum dos 86 itens é
api-contract / schema / nfr / protocol. Ver `[INFO] CONF-roteamento-spec` em
`.planning/INGEST-CONFLICTS.md`.

**Nota de escopo:** existem dois escopos distintos nas fontes e eles não são a mesma
coisa. `PROTOTYPE` = a entrega dos próximos dias (PRD §14). `PRODUCT-MVP` = a fase MVP do
roadmap de produto (PRD §12, marcador ★ em funcionalidades.md). Cada requisito abaixo
declara o seu.

---

# Parte A — Requisitos da entrega atual (PROTOTYPE)

## REQ-prototipo-frontend-navegavel
- source: docs/PRD.md §14
- description: Entregar as telas e o front-end navegável do Agenda Cultural BR em duas visões — web e mobile — com dados mockados no formato do grafo. Não é binário de loja; é protótipo navegável.
- acceptance: Protótipo navegável ao vivo nas duas visões, com alternador entre elas; nenhuma dependência de backend, banco, CMS, API real, IA em produção, analytics, observabilidade, segurança ou infraestrutura.
- scope: PROTOTYPE, entrega atual

## REQ-visao-mobile-app
- source: docs/PRD.md §14 (Telas do protótipo — "Visão mobile — app (23 telas)")
- description: Visão mobile do app. 23 telas — declaração e enumeração conferem (Onboarding conta como 3).
- acceptance: Telas enumeradas na fonte — Onboarding (3 telas) · Descobrir · Explicação da recomendação · Trilha de primeira vez · Acontece · Filtros · Mapa · Modo Cidade · Página do evento · Seleção de ocorrência · Página do artista · Página da obra · Buscar (vazio) · Busca em linguagem natural · Zero-resultado como descoberta · Play · Player · Meu Repertório · Mapa de repertório · Salvos e alertas · Página do produtor.
- scope: PROTOTYPE, visão mobile
- note: total da entrega = 23 mobile + 13 web = 36 telas. Prioridade em `REQ-ordem-de-corte`.

## REQ-visao-web-desktop
- source: docs/PRD.md §14 (Telas do protótipo — "Visão web — desktop (13 telas)")
- description: Visão web/desktop, incluindo as superfícies profissionais (Studio, Redação, Observatório) que não existem no app.
- acceptance: 13 telas — Descobrir · Acontece com mapa lado a lado · Página do evento · Página do artista · Buscar · Perfil · Página do produtor · Studio: publicar · Studio: ocorrências · Studio: duplicatas · Redação: fila · Redação: trilha · Observatório: indicadores. Contagem declarada confere com a enumerada (13 = 13).
- scope: PROTOTYPE, visão web

## REQ-dados-mockados-ontologicos
- source: docs/PRD.md §14
- description: Os dados mockados devem seguir a ontologia mesmo sem backend, em JSON no formato do grafo.
- acceptance: O mock separa Evento de Ocorrência; o agente carrega papel na relação, não como classe; toda recomendação carrega motivo escrito. Justificativa da fonte: sem isso as telas não conseguem demonstrar o comportamento que o RFP avalia, e o JSON pronto vira contrato de API para o time de produto.
- acceptance: Toda entidade carrega procedência `ic` | `derivado` | `autorado` conforme a tabela de PRD §14 (ver `CON-procedencia-do-mock`). Artista/Grupo/Obra/Instituição e Território/Espaço vêm da Enciclopédia como `ic`; coordenadas e Ocorrência são `derivado`; só Pessoa-usuária (3 personas), Repertório e as ~40 duplicatas do Cenário 3 são `autorado`. A marcação aparece na interface do Observatório.
- scope: PROTOTYPE, dados, contrato de API futuro
- acceptance: O território consumido pelo mock vem saneado por `dados/sanear.py`, que valida por conteúdo contra um vocabulário fechado de países e rebaixa o que falha para `detalhe` sem descartar. Base verificada: 947 entradas de território válidas, 113 espaços distintos, 807 das 1.766 entidades com território — cobrindo o Cenário 2 (50 entidades em PA/AM/MA/AP) e o Cenário 4 (158 eventos datados).

## REQ-roteiro-demonstracao
- source: docs/PRD.md §14 e §9
- description: Roteiro de demonstração com os cinco cenários do RFP navegáveis ao vivo.
- acceptance: Cenário 1 (Maria / rap → poesia falada → teatro documentário, três arestas, com o caminho visível) · Cenário 2 (Carlos / Modo Cidade em Belém, 4 dias) · Cenário 3 (dedup de milhares de eventos duplicados) · Cenário 4 (mudança de horário atinge uma ocorrência) · Cenário 5 (linguagem natural "parecido com a Bienal, gratuito e perto de mim" com tradução visível e editável). Prioridade declarada na fonte: "se o tempo apertar, é a última coisa a cair".
- scope: PROTOTYPE, demonstração

## REQ-identidade-visual-prototipo
- source: docs/PRD.md §14; tokens em dados/inventario/mapa-conteudo.md §6
- description: Aplicar o manual de marca do Itaú Cultural ao protótipo. Justificativa da fonte: etapa final entre concorrentes, caixa cinza não vende.
- acceptance: Paleta principal (#ffffff, #ff7800, #000000) e de apoio (#7f3e98, #30c5f4, #f9df4d, #e04b9b, #a6ce39, #69c4a4); tipografia Itaú Text (≤12pt) / Itaú Display (≥13pt), com Myriad e Arial como substitutas previstas pelo próprio manual; grafismo da barra invertida `\` nas três variações; chancela Fundação Itaú quando aplicável.
- scope: PROTOTYPE, identidade visual

## REQ-alternador-de-visoes
- source: docs/PRD.md §14 (Decisões técnicas)
- description: Um código, dois layouts, alternador ao vivo entre web e mobile.
- acceptance: Alternância de visão demonstrável durante a apresentação, sem recarregar em outro projeto/URL separado.
- scope: PROTOTYPE, arquitetura de front-end

## REQ-ordem-de-corte
- source: docs/PRD.md §14 (Ordem de corte)
- description: A priorização das 36 telas é dada, em três camadas, e o corte é sempre de baixo para cima. Este requisito é a ordem de execução do backlog do protótipo.
- acceptance: **Camada 1 — intocável (16 telas, 14 mobile + 2 web):** Onboarding por disposição · Descobrir · Explicação da recomendação · Trilha de primeira vez · Acontece · Página do evento · Seleção de ocorrência · Mapa · Modo Cidade · Buscar · Busca em linguagem natural · Página do artista · Meu Repertório · Salvos e alertas · Studio: duplicatas · Studio: ocorrências. **Camada 2 — a proposta fica pobre sem elas (12 telas, 5 mobile + 7 web):** Filtros · Play · Player · Zero-resultado como descoberta · Página do produtor · Redação: fila · Redação: trilha · Observatório: indicadores · web de Descobrir, Acontece com mapa, Página do evento e Buscar. **Camada 3 — primeiro a cair (8 telas, 4 mobile + 4 web):** Onboarding telas 2 e 3 · Página da obra · Mapa de repertório · Studio: publicar · Perfil web · Página do artista web · Página do produtor web.
- acceptance: As três camadas particionam exatamente as 36 telas, sem sobreposição nem lacuna (16+12+8 = 36; 14+5+4 = 23 mobile; 2+7+4 = 13 web) — verificado contra o inventário de telas.
- scope: PROTOTYPE, priorização

## REQ-ponte-enciclopedia-agenda
- source: docs/PRD.md §3.1 e §14
- description: O protótipo precisa demonstrar a ponte entre os dois sistemas que hoje não se falam — a Enciclopédia (que sabe quem é o artista) e a agenda do site (que sabe do evento de sábado). É a tese central da proposta.
- acceptance: Navegação contínua entre entidade de acervo e ocorrência de agenda nas duas direções — da página do artista para o evento em que ele se apresenta, e da página do evento para o verbete do artista, sem sair do fluxo. As telas Página do artista, Página da obra e Página do evento devem tornar a conexão visível, não apenas linkável.
- scope: PROTOTYPE, demonstração da tese

## REQ-zero-resultado-como-descoberta
- source: docs/PRD.md §7 e §14; docs/funcionalidades.md item 81 ★
- description: Estados vazios não são becos sem saída. `/404`, `/busca-nao-encontrada` e `/agenda-nao-encontrada` viram gatilho de descoberta.
- acceptance: Telas "Buscar (vazio)" e "Zero-resultado como descoberta" presentes na visão mobile, oferecendo caminho de descoberta em vez de mensagem de erro.
- scope: PROTOTYPE + PRODUCT-MVP

---

# Parte B — Catálogo de capacidades do produto (86 itens)

- source: docs/funcionalidades.md (integral); espelhado em docs/PRD.md §8
- scope: PRODUCT-MVP e fases posteriores (PRD §12) — **não** é o escopo da entrega atual
- ★ = marcado como MVP na fonte. **57 dos 86 itens são ★**; docs/funcionalidades.md e
  docs/PRD.md §8 declaram 57 e a contagem literal das marcas confere (verificada item a item).

## REQ-descobrir (itens 1–8)
- source: docs/funcionalidades.md §1
- description: Descoberta como operação sobre o grafo.
- acceptance: 1 ★ Feed de descoberta montado por caminhada no grafo, não por popularidade · 2 ★ Entrada por disposição, não por categoria ("tenho 2h", "com criança", "de graça e perto", "quero algo que eu nunca vi") · 3 ★ Trilha de primeira vez · 4 Fios de conexão navegáveis ("isto vem daquilo") · 5 Serendipidade dosada · 6 ★ Explicação de toda recomendação · 7 ★ Destaque curado capaz de sobrepor o algoritmo · 8 Descoberta por adjacência de repertório — um passo além do conhecido, nunca dez
- scope: PRODUCT-MVP (1,2,3,6,7) + fases posteriores (4,5,8)

## REQ-acontece (itens 9–18)
- source: docs/funcionalidades.md §2
- description: Agenda como entidade única com N ocorrências.
- acceptance: 9 ★ Página de Evento como entidade única, com N ocorrências · 10 ★ Lista de ocorrências: data, hora, espaço, preço · 11 ★ Filtros ontológicos: linguagem, gratuidade, acessibilidade, faixa etária, território · 12 ★ Salvar ocorrência e criar lembrete · 13 ★ Alerta de alteração de horário ou cancelamento · 14 ★ "Eu fui" — registro de repertório · 15 ★ Ficha de acessibilidade do evento e do espaço · 16 Ingresso ou inscrição via produtor ou agendamento IC · 17 Evento de longa duração com regra própria de vigência · 18 Compartilhar evento ou trilha
- scope: PRODUCT-MVP (9–15) + fases posteriores (16–18)
- note: PRD §8 funde os itens 9 e 10 numa única entrada ("evento com N ocorrências ★")

## REQ-mapa-territorio (itens 19–24)
- source: docs/funcionalidades.md §3
- acceptance: 19 ★ Mapa como lente sobre qualquer resultado, nunca como home · 20 ★ Modo Cidade — planejar estadia de N dias em território desconhecido · 21 ★ Roteiro do dia equilibrando deslocamento e densidade · 22 Recorte por bairro e região · 23 Camada de desertos culturais · 24 "Perto de mim agora", por raio e por tempo
- scope: PRODUCT-MVP (19–21) + fases posteriores (22–24)

## REQ-play (itens 25–30)
- source: docs/funcionalidades.md §4
- acceptance: 25 ★ Catálogo unificado: vídeo, podcast, série, playlist · 26 ★ Player com retomada · 27 Exposição virtual e tour virtual como item navegável · 28 ★ Play conectado ao evento ("não pode ir? veja isto") · 29 Legenda, libras e audiodescrição como filtro · 30 Download e modo offline
- scope: PRODUCT-MVP (25,26,28) + fases posteriores (27,29,30)

## REQ-enciclopedia-acervo (itens 31–37)
- source: docs/funcionalidades.md §5
- acceptance: 31 ★ Página de Artista: papéis, obras, movimentos, eventos vinculados · 32 ★ Página de Obra com suas expressões e montagens · 33 Página de Movimento e Linguagem · 34 ★ Verbete embutido no fluxo, não link para fora · 35 Acervo e coleção com mídia · 36 Linha do tempo e mapa de influências · 37 ★ Reconciliação de artista ingerido com verbete (controle de autoridade)
- scope: PRODUCT-MVP (31,32,34,37) + fases posteriores (33,35,36)

## REQ-leituras (itens 38–41)
- source: docs/funcionalidades.md §6
- acceptance: 38 ★ Matéria, coluna e entrevista ligadas a entidades do grafo · 39 Especiais como trilha curada (Ancestralidade, Arte e Acesso, Mekukradjá) · 40 ★ "Aprofunda isto" a partir de qualquer evento ou obra · 41 Publicações e pesquisas com leitor próprio
- scope: PRODUCT-MVP (38,40) + fases posteriores (39,41)

## REQ-formacao (itens 42–45)
- source: docs/funcionalidades.md §7
- acceptance: 42 Cursos e formações · 43 Biblioteca · 44 ★ Agendamento de visita e visita educativa · 45 Área do educador com material didático
- scope: PRODUCT-MVP (44) + fases posteriores (42,43,45)
- placement: sem aba própria. Vive dentro da página do Espaço e do Evento ("agendar visita") e em *Meu* como "minhas visitas" (PRD §7). Cobre o item ★ 44.

## REQ-oportunidades (itens 46–49)
- source: docs/funcionalidades.md §8
- acceptance: 46 ★ Editais, prêmios e convocatórias filtrados por perfil · 47 Inscrição e acompanhamento · 48 ★ Alerta de edital compatível com o perfil · 49 ★ Onboarding de produtor a partir do edital — vira agente no grafo
- scope: PRODUCT-MVP (46,48,49) + fases posteriores (47)
- placement: sem aba própria. Vive no Studio (superfície do produtor) e como seção de *Meu* para quem se declara artista ou produtor (PRD §7). Cobre os itens ★ 46, 48 e 49.

## REQ-meu-repertorio (itens 50–57)
- source: docs/funcionalidades.md §9
- acceptance: 50 ★ Identidade única em todo o ecossistema · 51 ★ Onboarding por disposição, não formulário de gostos · 52 ★ Salvos, agenda pessoal e histórico · 53 ★ Mapa de repertório — o que atravessou e o que fica adjacente · 54 Trilhas próprias e compartilháveis · 55 ★ Preferências de acessibilidade aplicadas a todo o app · 56 Notificações e newsletter · 57 ★ Privacidade LGPD: consentimento, exportação, exclusão
- scope: PRODUCT-MVP (50,51,52,53,55,57) + fases posteriores (54,56)

## REQ-studio-produtor (itens 58–64)
- source: docs/funcionalidades.md §10
- acceptance: 58 ★ Cadastro e verificação de agente · 59 ★ Publicação de evento com validação em tempo real · 60 ★ Gestão de ocorrências — alterar horário dispara o item 13 · 61 ★ Resolução de duplicata sugerida pelo sistema · 62 Painel de alcance e público, devolvido ao produtor · 63 Importação em lote por API ou feed (iCal, JSON) · 64 ★ Score de qualidade do cadastro
- scope: PRODUCT-MVP (58,59,60,61,64) + fases posteriores (62,63)

## REQ-redacao-curador (itens 65–70)
- source: docs/funcionalidades.md §11
- acceptance: 65 ★ Fila de moderação e aprovação · 66 ★ Editor de trilha curada · 67 ★ Destaque e veto editorial com registro de autoria · 68 Curadoria territorial delegada a curador regional · 69 ★ Revisão das sugestões da IA — human-in-the-loop · 70 Calendário editorial
- scope: PRODUCT-MVP (65,66,67,69) + fases posteriores (68,70)

## REQ-observatorio-dados (itens 71–77)
- source: docs/funcionalidades.md §12
- acceptance: 71 ★ Dashboards por público: editorial, produto, parceiro, institucional · 72 ★ KPIs de produto · 73 ★ Indicadores de impacto cultural · 74 ★ Indicadores territoriais e institucionais · 75 API pública e dados abertos versionados · 76 ★ Anonimização e governança LGPD · 77 ★ Observabilidade de dados — proveniência, cobertura, frescor
- scope: PRODUCT-MVP (71,72,73,74,76,77) + fases posteriores (75)
- conflict: 75, 76 e 77 dependem de infraestrutura fora do escopo da entrega atual — ver `[INFO] CONF-mvp-fora-do-prototipo`

## REQ-transversais (itens 78–86)
- source: docs/funcionalidades.md §Transversais
- acceptance: 78 ★ Busca unificada sobre o grafo (agenda, acervo, editorial e verbetes num só índice) · 79 ★ Busca em linguagem natural traduzida em consulta estruturada e explicada · 80 ★ Facetas derivadas da ontologia · 81 ★ Zero-resultado vira descoberta · 82 ★ Ingestão com extração assistida por IA e score de confiança · 83 ★ Deduplicação em dois estágios · 84 ★ Similaridade sempre com justificativa legível · 85 Feedback do curador retroalimentando o modelo · 86 ★ Limites explícitos da IA
- scope: PRODUCT-MVP (78–84, 86) + fases posteriores (85)
- conflict: 82, 83 e 85 dependem de IA em produção, fora do escopo da entrega atual — ver `[INFO] CONF-mvp-fora-do-prototipo`

## REQ-cobertura-fluxos-rfp
- source: docs/funcionalidades.md (§Cobertura dos fluxos obrigatórios do RFP)
- description: Mapa de rastreabilidade entre os fluxos exigidos pelo RFP e as funcionalidades.
- acceptance: Onboarding → 51, 55, 2 · Descoberta → 1–8 · Busca → 78–81 · Mapa → 19–24 · Página do evento → 9–18 · Perfil → 50–57 · Recomendações → 1, 6, 8, 84 · Área editorial → 65–70 · Página do produtor/instituição → 58–64. Cobertura declarada na fonte: completa.
- scope: PRODUCT-MVP, rastreabilidade ao RFP
