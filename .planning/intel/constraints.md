# Constraints

Restrições técnicas, de dados, de escopo e de marca extraídas do ingest.
Precedência: `docs/PRD.md` (0) > `docs/funcionalidades.md` (1) > `dados/inventario/mapa-conteudo.md` (2).

---

## CON-fronteira-de-escopo: Fronteira da entrega atual
- source: docs/PRD.md §14
- type: nfr
- content: **Dentro:** telas e front-end navegável, duas visões (web e mobile), dados mockados no formato do grafo. **Fora, para a fase seguinte com o time de produto:** backend, banco, CMS, APIs reais, IA em produção, analytics, observabilidade, segurança e infraestrutura. Aplicativo de loja (binário) também está fora — o RFP pede protótipo navegável.

## CON-stack-do-prototipo: Stack obrigatória do protótipo
- source: docs/PRD.md §14 (Decisões técnicas)
- type: protocol
- content: Next.js + TypeScript (as rotas do protótipo espelham o produto real) · Tailwind (velocidade, e o design system é o do IC) · JSON mockado no formato do grafo (vira contrato de API depois) · um código, dois layouts, alternador ao vivo.

## CON-ontologia-camadas: Ontologia em seis camadas
- source: docs/PRD.md §6
- type: schema
- content:
  - **Camada 0 — Vocabulário controlado:** `Linguagem` · `Movimento` · `Tema` · `Técnica` · `Povo/Comunidade` · `Território`. Semente real: as 29 expressões do Rumos e as 123 tags do acervo, promovidas a tesauro com hierarquia e sinonímia.
  - **Camada 1 — Agentes:** `Pessoa` · `Coletivo` · `Instituição` · `Espaço Cultural`. Artista, curador, produtor e educador são papéis, não classes.
  - **Camada 2 — Criação:** `Obra` → `Expressão` → `Manifestação` → `Item`. Exemplo da fonte: *Vidas Secas* (obra) → a montagem da Cia. X (expressão) → a temporada no Sesc (manifestação) → a gravação em vídeo (item).
  - **Camada 3 — Acontecimentos:** `Programa` → `Evento` → `Temporada` → `Ocorrência`.
  - **Camada 4 — Conhecimento editorial:** `Notícia` · `Coluna` · `Entrevista` · `Vídeo` · `Podcast` · `Publicação` · `Pesquisa` · `Verbete`, ligados por `fala_sobre`, `contextualiza`, `aprofunda`.
  - **Camada 5 — Pessoa e repertório:** `Pessoa-usuária` · `Interesse` · `Repertório` · `Trilha` · `Sinal`.

## CON-criterios-de-identidade: Critérios de identidade da camada de acontecimentos
- source: docs/PRD.md §6 (tabela) e §9 Cenário 3
- type: schema
- content: `Evento` = título normalizado + agente realizador + obra. `Temporada` = evento + espaço + intervalo. `Ocorrência` = temporada + início exato + espaço. Estes critérios são a chave determinística do primeiro estágio da deduplicação.

## CON-vocabulario-de-relacoes: Relações do grafo
- source: docs/PRD.md §6 (Relações)
- type: protocol
- content: `influenciou` · `dialoga_com` · `deriva_de` · `pertence_a` · `atua_em` (com papel) · `curou` · `realiza` · `ocorre_em` · `situado_em` · `aprofunda` · `semelhante_a` — esta última **sempre com justificativa legível**. Exemplo da fonte: "parecido porque é arte contemporânea, coletiva, em espaço público e gratuita".

## CON-procedencia-enum: Enum de procedência
- source: docs/PRD.md §6 (Procedência) e §10
- type: schema
- content: Todo campo carrega origem em `ic` | `derivado` | `parceiro` | `produtor` | `ia` (com score de confiança) | `curador`. Toda saída de IA carrega `procedencia: "ia"` e score.

## CON-mock-como-contrato-de-api: O mock JSON é o contrato de API futuro
- source: docs/PRD.md §14
- type: api-contract
- content: O JSON mockado do protótipo é entregue como contrato de API para o time de produto na fase seguinte. Consequência: o formato do mock não é descartável — precisa ser fiel à ontologia (evento separado de ocorrência, papel na relação do agente, motivo escrito na recomendação).

## CON-arquitetura-informacao: 68 rotas → 12 módulos → 5 abas
- source: docs/PRD.md §7
- type: protocol
- content: Módulos — 1 Descobrir (App) · 2 Acontece (App) · 3 Mapa & Território (App, novo) · 4 Play (App) · 5 Enciclopédia & Acervo (App) · 6 Leituras (App) · 7 Formação (App) · 8 Oportunidades (App) · 9 Meu Repertório (App) · 10 Studio (Web, novo) · 11 Redação (Web, novo) · 12 Observatório & Dados (Web). As 5 abas do app: Descobrir · Acontece · Play · Buscar · Meu. **Todos os 12 módulos têm superfície definida:** Mapa é lente dentro de Acontece e Buscar; Enciclopédia e Leituras aparecem dentro do conteúdo, como profundidade; Formação vive na página do Espaço e do Evento e em *Meu* ("minhas visitas"); Oportunidades vive no Studio e como seção de *Meu* para quem se declara artista ou produtor. Institucional vira rodapé. Princípio declarado: uma aba custa atenção permanente de todo mundo para servir a uma minoria em um momento específico.

## CON-limites-da-ia: Onde a IA não entra
- source: docs/PRD.md §10; docs/funcionalidades.md item 86
- type: nfr
- content: A IA não publica sem revisão humana · não define destaque editorial · não escreve verbete de Enciclopédia · não decide ranking comercial · não substitui mediação cultural. Toda sugestão passa por fila humana antes de virar dado público. Onde a IA entra: extração de entidades do acervo, enriquecimento na ingestão, casamento probabilístico de duplicatas (depois da chave determinística, nunca antes), tradução de linguagem natural em consulta, sugestão de trilha para o curador, descrição alternativa de imagem.

## CON-acessibilidade-8-dimensoes: Acessibilidade modelada em 8 dimensões
- source: dados/inventario/mapa-conteudo.md §5; docs/PRD.md §4 princípio 10
- type: schema
- content: `audio_description` · `libras` · `descriptive_subtitle` · `closed_caption` · `open_caption` · `simultaneous_translation` · `stenotypy` · `subtitle`. Já existem no CMS do IC. Devem funcionar como filtro de primeira classe, não como selo.

## CON-vocabulario-linguagens: 29 expressões artísticas do programa Rumos
- source: dados/inventario/mapa-conteudo.md §5
- type: schema
- content: acervo · animação · arquitetura · arte e tecnologia · artes visuais · audiovisual · cidade · cinema · circo · culinária · cultura popular · curta-metragem · dança · dança contemporânea · documentário · feminismo · fotografia · instalação · jornalismo · lgbtqia+ · literatura · memória · música · oficinas · patrimônio · performance · pesquisa · poesia · teatro. As 29 aparecem no acervo — ontologia de linguagem pronta, mantida pela casa.

## CON-vocabulario-tags: 123 tags em 4.777 usos
- source: dados/inventario/mapa-conteudo.md §5
- type: schema
- content: 123 tags distintas, 4.777 usos, apenas 7% aparecem uma única vez. Mais usadas: literatura (319), música (307), audiovisual (280), cinema (276), artes visuais (267), teatro (205).

## CON-schema-cms-real: Schema único do CMS atual (44 campos)
- source: dados/inventario/mapa-conteudo.md §3
- type: schema
- content: Notícia, coluna, entrevista, vídeo, podcast, série, publicação, curso, exposição e evento são o **mesmo objeto**, diferenciados só pelo campo de texto `category`. Campos: `id · title · shortDescription · slug · metaTitle · metaDescription · publicationDate · publishedAt · updatedDate · image · cover · rights · image_description · cover_position · miniature_position · mainCategory · category · section · subcategory · tags · participants · program · exhibition · occupation · presential · online · accessibility{8 flags} · hasAudioDescription · hasSubtitle · hasLibras · startDate · endDate · initDate · initHour · endHour · schedules · ticket · hideTicket · soldOut · hideOnlineAccess · page{uuid, pageType, sections[]} · template_type · observatorio_require_login`. O corpo editorial vive em `page.sections[].contentHtml` — HTML colado do Word, com resíduos `mso-` e entidades escapadas.

## CON-preenchimento-campos: Preenchimento efetivo dos campos
- source: dados/inventario/mapa-conteudo.md §3
- type: schema
- content: `tags` 85% · `rights` 83% · `image_description` 79% · `participants` 3% (e só contém colunistas) · `startDate` 3% · `schedules` **0%** (campo existe e nunca foi usado) · lugar/espaço/geolocalização **não existe** · preço **não existe** (apenas o booleano `ticket`).

## CON-quatro-lacunas: As quatro entidades ausentes no CMS do site
- source: dados/inventario/mapa-conteudo.md §4; docs/PRD.md §3 e §3.1
- type: schema
- content: **Escopo desta lacuna: o CMS do site, não o ecossistema.** Três das quatro existem estruturadas na Enciclopédia — ver `CON-enciclopedia-como-grafo`. No CMS: **Artista** — `participants` aparece 488 vezes e em 100% delas contém pessoa com `columnist: true`; artistas existem só como texto corrido no HTML. **Ocorrência** — `schedules` vazio em 100/100 eventos; um evento é um intervalo `startDate → endDate` com hora `00:00`. **Território** — nenhum campo de local, endereço, cidade ou coordenada em todo o modelo; mapa é tecnicamente impossível hoje. **Pessoa-usuária** — 11 sistemas, 11 logins, nenhum repertório compartilhado. São exatamente as quatro que o RFP exige.

## CON-marca-cores: Paleta do manual de marca do Itaú Cultural
- source: dados/inventario/mapa-conteudo.md §6 (de referencias/manual-marca-itau-cultural-2018.pdf)
- type: nfr
- content: **Principais** — Branco `#ffffff` · Laranja `#ff7800` (Pantone 158C) · Preto `#000000`. **Apoio** — Lilás `#7f3e98` (266C) · Azul `#30c5f4` (312C) · Amarelo `#f9df4d` (Yellow C) · Rosa `#e04b9b` (232C) · Verde `#a6ce39` (2292C) · Verde-água `#69c4a4` (7465C). Atributos da marca: sólido, plural, digital. Palavras da paleta: solidez, diversidade, informação, movimento, atualidade, acessível, conexão.

## CON-marca-tipografia: Tipografia do manual
- source: dados/inventario/mapa-conteudo.md §6
- type: nfr
- content: Itaú Text (≤ 12 pt) e Itaú Display (≥ 13 pt); **Myriad e Arial como substitutas previstas pelo próprio manual**. Em produção o site do IC usa Open Sans (Google Fonts) — divergência que a fonte marca como "a resolver no protótipo" e que o PRD §14 resolve em favor do manual.

## CON-marca-grafismo-chancela: Grafismo e chancela
- source: dados/inventario/mapa-conteudo.md §6
- type: nfr
- content: Grafismo é a barra invertida `\` em três variações — `\C` completo, apenas `\`, e `\C` espaçado. Aparece no manual como marcador de seção (`\Sólido`, `\Plural`, `\Digital`). Chancela Fundação Itaú obrigatória em materiais apoiados: Azul Fit `#0C2D78`, Laranja Fit `#EC7000`, Cyan Fit `#4DAFFF`.

## CON-infra-existente: Infraestrutura já consolidada na Fundação Itaú
- source: dados/inventario/mapa-conteudo.md §2
- type: protocol
- content: Frontend `prd.itau-cultural.frontend.fundacaoitau.org.br` (Next.js — o site do IC já roda na infra da Fundação) · CMS/editor `prd.editor.fundacaoitau.org.br/editor/v1/` (editor compartilhado) · Mídia em S3 `s3.sa-east-1.amazonaws.com/prd.editor.fundacaoitau.org.br` (região São Paulo) · Analytics via Google Tag Manager, sem camada de produto própria. A consolidação já começou pela infraestrutura; o que não foi consolidado é o modelo de dados.

## CON-onze-sistemas: Onze sistemas sem identidade compartilhada
- source: dados/inventario/mapa-conteudo.md §2
- type: protocol
- content: Subdomínios verificados — `enciclopedia` 200 (aplicação própria, separada) · `agendamento` 200 · `anamae` 200 · `jabuti` 200 · `livrosdeartista` 200 · `transversalidade` 200 (exige login) · `resourcespace` 200 (DAM, exige login) · `ehp` 200 (não estava no mapa inicial) · `tourvirtual` 404 (fora do ar) · `collective-access` sem resposta · `observatorio` sem resposta · `editais` sem resposta · `comunica` sem resposta. Onze sistemas distintos, com autenticação, modelo de dados e ciclo de vida próprios; nenhum compartilha identidade de usuário.

## CON-principios-rfp: Os dez princípios
- source: docs/PRD.md §4
- type: nfr
- content: Sete do RFP, aceitos integralmente — 1 Descoberta antes de busca, e gratuita · 2 Curadoria antes de quantidade · 3 IA amplia possibilidades, nunca substitui a mediação cultural · 4 Dados são patrimônio · 5 Arquitetura aberta · 6 Confiança editorial · 7 Escala nacional. Três acrescentados pela varredura — 8 Toda recomendação é explicável · 9 Todo dado carrega procedência · 10 Acessibilidade é filtro, não selo.

## CON-anti-alvo: O que o produto não é
- source: docs/PRD.md §4 ("O que não somos")
- type: nfr
- content: Não é agenda tradicional, guia turístico, aplicativo institucional, rede social, marketplace, chatbot nem catálogo estático. O caminho óbvio — app de agenda com mapa e filtros — reprova. A defesa é estrutural: **a unidade do produto é a relação, não o item**. Um catálogo lista; um grafo conecta. O Itaú Cultural entra como espinha dorsal, não como vitrine.

## CON-enciclopedia-como-grafo: A Enciclopédia Itaú Cultural já é o grafo
- source: docs/PRD.md §3.1; amostra em dados/amostra/enciclopedia.jsonl
- type: schema
- content: Aplicação Rails separada de `enciclopedia.itaucultural.org.br`, cujas rotas são a ontologia: `/pessoas/{id}-{slug}` · `/obras/{id}-{slug}` · `/grupos/{id}-{slug}` · `/instituicoes/{id}-{slug}` · `/eventos/{id}-{slug}` · `/termos/{id}-{slug}`. Mais de 100 mil registros. Cada registro de listagem carrega linguagem, datas e hierarquia territorial completa — exemplo da fonte: "Artes visuais · *Imigrantes nas Artes Plásticas de São Paulo* · 03.09.1976–19.09.1976 · Brasil / São Paulo / São Paulo — Masp". Fornece `Pessoa`, `Grupo`, `Obra`, `Instituição`, `Evento`, `Termo`, `Território` e `Espaço Cultural` — exatamente as classes que o CMS não tem.

## CON-amostra-enciclopedia: Amostra curada já coletada (1.766 registros)
- source: dados/amostra/enciclopedia.jsonl (verificado); volumes declarados em docs/PRD.md §14
- type: schema
- content: 1.766 registros em JSONL — 481 `termo` (tesauro completo) · 423 `pessoa` · 246 `instituicao` · 239 `obra` · 217 `grupo` · 160 `evento`. Os quatro tipos de agente/criação somam 1.125, o número que PRD §14 declara. Campos por registro: `tipo · rota · id · slug · url · titulo · linguagens · locais · imagem · creditoImagem`. `linguagens` preenchido em 100% dos registros; `locais` presente em 1.118 dos 1.766 (1.471 entradas de local no total), estruturado como `{pais, estado, cidade, espaco, data}`. Após o saneamento territorial (ver `CON-saneamento-territorio`): 947 entradas de território válidas, 41 países distintos — todos do vocabulário fechado —, 113 espaços culturais distintos e 807 dos 1.766 registros com território válido. Verificado diretamente no arquivo.

## CON-procedencia-do-mock: Tabela de procedência dos dados do protótipo
- source: docs/PRD.md §14 (Procedência dos dados do protótipo)
- type: schema
- content: `ic` — conteúdo editorial/mídia/publicação/formação do CMS (2.534) · Artista, Grupo, Obra, Instituição da Enciclopédia (1.125) · Território e Espaço Cultural da Enciclopédia, saneado (947 locais · 113 espaços distintos) · Linguagem e Tema do Rumos + Enciclopédia (29 + 481 termos). `derivado` — coordenadas geográficas (centroide de município e aproximação por espaço) · Ocorrência (gerada a partir do período real do evento). `autorado` — Pessoa-usuária e Repertório (3 personas: Maria, Carlos e uma frequentadora) · duplicatas do Cenário 3 (~40, clonadas de eventos reais com variação controlada). Regra: nada é inventado sem estar marcado, e a marcação aparece na interface do Observatório.

## CON-ordem-de-corte: Camadas de prioridade das 36 telas
- source: docs/PRD.md §14 (Ordem de corte)
- type: nfr
- content: Camada 1 intocável (16 telas — as que os cinco cenários atravessam) · Camada 2 (12 telas — a proposta fica pobre sem elas) · Camada 3 (8 telas — primeiro a cair). Cortes acontecem de baixo para cima. As três camadas particionam exatamente o inventário de 36 telas (23 mobile + 13 web), sem sobreposição nem lacuna.

## CON-saneamento-territorio: A regra de saneamento territorial testa conteúdo, não tipo
- source: docs/PRD.md §14 ("Regra de saneamento do território"); dados/coletar_enciclopedia.py, dados/sanear.py
- type: schema
- content: O bloco `detail-info` da Enciclopédia é polimórfico **linha a linha**, não por tipo de entidade: a mesma posição carrega ora `Brasil / Distrito Federal / Brasília — UnB`, ora `Óleo sobre tela`, ora o nome de um autor, ora um crédito de foto. **Regra final:** o primeiro segmento separado por `/` precisa constar de um vocabulário fechado de 104 países (`PAISES`). O que não passa **não é descartado** — é rebaixado para o campo `detalhe` e preservado, então nenhuma informação se perde. `sanear.py` inclui uma passagem `recuperar()` que promove território de volta para fora de `detalhe` quando encontra um país válido, revertendo passagens anteriores defeituosas em vez de consolidá-las. Ambos os scripts são idempotentes.
- content: Gatear por tipo seria **errado** e foi descartado: a obra "(des)esperar" carrega legitimamente `Brasil / Distrito Federal / Brasília — Universidade de Brasília (UnB)`. Obras têm território quando a coleção tem local. Só o teste por conteúdo preserva esses casos.
