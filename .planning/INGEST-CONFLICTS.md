## Conflict Detection Report

Ingest: 3 documentos · MODE: new · precedência por override do manifest
(docs/PRD.md = 0, docs/funcionalidades.md = 1, dados/inventario/mapa-conteudo.md = 2).
Grafo de cross-refs: acíclico, profundidade 3 (funcionalidades → PRD → mapa-conteudo).

**Revisão 3** — reexecutada após o saneamento territorial. Os 5 WARNINGs da revisão 1 e o
WARNING aberto na revisão 2 foram verificados contra os arquivos alterados e os dados, e
estão todos fechados (registrados abaixo em INFO como trilha de auditoria).
**Nenhum WARNING em aberto.** Uma ressalva operacional não-bloqueante foi registrada em
`CONF-crawler-desatualizado`.

### BLOCKERS (0)

Nenhum. Não há ADR neste conjunto, nenhum documento tem `locked: true`, nenhuma
classificação ficou UNKNOWN/low-confidence, não há ciclo no grafo de referências e MODE
é `new` (não há contexto existente em `.planning/` para contradizer).

### WARNINGS (0)

Nenhum.

### INFO (15)

[INFO] CONF-qualidade-territorio — RESOLVIDO na revisão 3
  Note: era bug de parser, não problema da fonte de dados. Causa raiz: o bloco `detail-info` da Enciclopédia é polimórfico **linha a linha** — a mesma posição carrega `Brasil / Distrito Federal / Brasília — UnB`, ou `Óleo sobre tela`, ou um nome de autor, ou um crédito de foto. A hipótese intermediária de gatear por tipo de entidade também estava errada e descartava território válido: a obra "(des)esperar" carrega legitimamente `Brasil / Distrito Federal / Brasília — Universidade de Brasília (UnB)`. A regra final testa conteúdo — o primeiro segmento precisa constar de um vocabulário fechado de 104 países — e o que falha é rebaixado para `detalhe`, preservado, nunca descartado. `dados/sanear.py` inclui uma passagem `recuperar()` que promove território de volta para fora de `detalhe`, revertendo a passagem defeituosa anterior em vez de consolidá-la.
  Note: verificado de forma independente em `dados/amostra/enciclopedia.jsonl` — 947 entradas de território (antes 1.471 contaminadas) · 41 valores distintos de `pais`, **zero fora do vocabulário** (antes 419) · 113 espaços culturais distintos · 807 das 1.766 entidades com território válido · 432 registros preservando `detalhe`. Cobertura dos cenários mantida: 50 entidades em PA/AM/MA/AP (Cenário 2) e 158 eventos datados (Cenário 4). Recuperação conferida no caso "(des)esperar", que está com o território da UnB de volta. Idempotência conferida por hash: reexecutar `sanear.py` não altera o arquivo (0 rebaixados).
  Note: docs/PRD.md §14 passou a declarar "Enciclopédia, saneado · 947 locais · 113 espaços distintos" e ganhou a subseção "Regra de saneamento do território", que registra a regra, a falha que ela evita e por que isso importa dado que Mapa e Modo Cidade estão na camada intocável

[INFO] CONF-crawler-desatualizado — ressalva operacional, não bloqueia o roteamento
  Note: o crawl completo `dados/bruto/enciclopedia/itens.jsonl` continua acumulando entradas contaminadas. O processo de coleta em execução (PID 24557) foi iniciado às 23:08, mas `dados/coletar_enciclopedia.py` só foi corrigido às 23:33 — ou seja, **o processo em execução antecede a correção e segue rodando o parser antigo em memória**. Constatado ao vivo: o arquivo passou de 50.709 para 51.007 registros durante esta verificação, e uma execução de `sanear.py` rebaixou 1.074 entradas recém-anexadas (5% do total).
  Note: **não é gate para o roteamento.** O protótipo consome `dados/amostra/enciclopedia.jsonl`, que está limpo, verificado e é o que a tabela de procedência de PRD §14 cita (947 locais, 113 espaços). O arquivo bruto é ativo de fundo, fora do caminho crítico da entrega.
  → Quando o crawl terminar, reiniciar o processo para que carregue o parser corrigido, ou rodar `python3 dados/sanear.py` uma última vez antes de qualquer uso do arquivo bruto. Como `sanear.py` é idempotente e recupera em vez de descartar, rodar de novo é seguro

[INFO] CONF-contagem-mvp — RESOLVIDO na revisão 2
  Note: a contagem literal foi adotada como autoritativa. docs/funcionalidades.md agora declara "★ = MVP (57 itens)" e docs/PRD.md §8 declara "86 no total, 57 no MVP (★)". Verificado: o documento marca exatamente 57 itens numerados com ★, e o conjunto de itens marcados não mudou em relação à revisão 1 — apenas o total declarado foi corrigido. `requirements.md` Parte B segue válido item a item

[INFO] CONF-contagem-telas-mobile — RESOLVIDO na revisão 2
  Note: a enumeração foi adotada como autoritativa. docs/PRD.md §14 agora declara "Visão mobile — app (23 telas)", com Onboarding contando como 3. Total da entrega: 23 mobile + 13 web = 36 telas

[INFO] CONF-modulos-sem-aba — RESOLVIDO na revisão 2
  Note: docs/PRD.md §7 ganhou tabela e justificativa. Formação vive dentro da página do Espaço e do Evento ("agendar visita") e em *Meu* como "minhas visitas", cobrindo a ★ 44. Oportunidades vive no Studio e como seção de *Meu* para quem se declara artista ou produtor, cobrindo as ★ 46, 48 e 49. Razão registrada: "uma aba custa atenção permanente de todo mundo para servir a uma minoria em um momento específico". Os 12 módulos passam a ter superfície definida

[INFO] CONF-origem-dos-mocks — RESOLVIDO na revisão 2, com mudança de premissa
  Note: docs/PRD.md §3.1 registra a varredura de `enciclopedia.itaucultural.org.br` — aplicação Rails separada cujas rotas são a ontologia (`/pessoas/`, `/obras/`, `/grupos/`, `/instituicoes/`, `/eventos/`, `/termos/`), com 100 mil+ registros. Três das quatro entidades "ausentes" existem lá, estruturadas. docs/PRD.md §14 ganhou tabela de procedência: Artista/Grupo/Obra/Instituição (1.125) e Território/Espaço (947 locais, 113 espaços distintos após saneamento) vêm da Enciclopédia como `ic`; coordenadas e Ocorrência são `derivado`; só Pessoa-usuária (3 personas), Repertório e as ~40 duplicatas do Cenário 3 são `autorado`. Amostra verificada em `dados/amostra/enciclopedia.jsonl`: 1.766 registros — 481 termo, 423 pessoa, 246 instituicao, 239 obra, 217 grupo, 160 evento; os quatro tipos de agente/criação somam exatamente os 1.125 declarados. Propagado para `intel/context.md` (novo tópico), `intel/requirements.md` (REQ-ponte-enciclopedia-agenda, procedência em REQ-dados-mockados-ontologicos), `intel/constraints.md` (CON-enciclopedia-como-grafo, CON-amostra-enciclopedia, CON-procedencia-do-mock) e `intel/decisions.md` (DEC-ponte-enciclopedia-agenda, DEC-procedencia-do-mock). A ressalva de qualidade então aberta foi fechada na revisão 3 — ver `CONF-qualidade-territorio`

[INFO] CONF-escopo-vs-prazo — RESOLVIDO na revisão 2
  Note: docs/PRD.md §14 ganhou "Ordem de corte" em três camadas, com corte de baixo para cima — Camada 1 intocável (16 telas, as que os cinco cenários atravessam), Camada 2 (12 telas), Camada 3 (8 telas). Verificação aritmética: 16+12+8 = 36, e a partição bate exatamente com o inventário de telas (14+5+4 = 23 mobile; 2+7+4 = 13 web). Nenhuma tela ficou duplicada nem de fora

[INFO] CONF-doc-superado — a varredura original não foi atualizada e ficou parcialmente superada
  Note: `dados/inventario/mapa-conteudo.md` (precedência 2) não mudou nesta revisão e ainda afirma na §4 que Território "não existe" e que "um mapa é tecnicamente impossível hoje". docs/PRD.md §3.1 (precedência 0) mostra que a hierarquia territorial existe na Enciclopédia. Resolução por precedência: a afirmação do DOC continua correta **no escopo do CMS do site** — que é o que ele varreu — e foi superada no escopo do ecossistema. O PRD §3 já reflete isso ao reintitular a tabela para "Falta no CMS". Registrado em vez de editado no DOC, porque o DOC é o registro datado de uma coleta específica (21/08/2026, fonte `www.itaucultural.org.br`)

[INFO] CONF-precedencia-aplicada — override do manifest respeitado, sem disputa de tipo
  Note: os inteiros de precedência do manifest (PRD 0 > funcionalidades 1 > mapa-conteudo 2) substituíram a ordem padrão ADR > SPEC > PRD > DOC. Como não há ADR no conjunto, a ordem efetiva ficou PRD > SPEC > DOC — inversa à padrão para o par PRD/SPEC. Entre PRD e funcionalidades não houve nenhuma disputa de conteúdo: os dois concordam item a item nos 12 módulos e nos transversais. A única aplicação real de precedência foi PRD sobre mapa-conteudo, em CONF-tipografia e CONF-doc-superado

[INFO] CONF-sem-adr — nenhuma decisão travada neste ingest
  Note: nenhum documento foi classificado como ADR e nenhum tem `locked: true`. As 19 decisões explícitas do PRD (§3.1, §6, §7, §14) foram extraídas para `.planning/intel/decisions.md` com `status: proposed` e proveniência declarada. Não há candidato a BLOCKER por contradição de decisão travada

[INFO] CONF-roteamento-spec — funcionalidades.md roteado para requirements, não constraints
  Note: mantido conforme revisão 1 e confirmado pelo coordenador. A regra de tipo manda SPEC → `constraints.md`, mas nenhum dos 86 itens é api-contract, schema, nfr ou protocol — são capacidades de produto numeradas com marcador de MVP. O catálogo vive em `.planning/intel/requirements.md` (Parte B), item a item, com os ★ intactos. `constraints.md` recebeu o material genuinamente restritivo. Desvio registrado para auditoria

[INFO] CONF-tipografia — divergência tipográfica resolvida por precedência
  Note: dados/inventario/mapa-conteudo.md §2 e §6 registram que o site em produção usa Open Sans (Google Fonts), divergindo do manual de marca, que especifica Itaú Text (≤12pt) e Itaú Display (≥13pt) — e a própria fonte marca isso como "divergência a resolver no protótipo". docs/PRD.md §14 (precedência 0) decide "Manual do Itaú Cultural aplicado". Resolução: o protótipo segue o manual; se as fontes proprietárias não estiverem disponíveis, o próprio manual prevê Myriad e Arial como substitutas. Open Sans não é herdado

[INFO] CONF-mvp-fora-do-prototipo — itens ★ que dependem de infraestrutura fora do escopo atual
  Note: docs/PRD.md §14 (precedência 0) coloca backend, banco, CMS, APIs reais, IA em produção, analytics, observabilidade, segurança e infraestrutura na fase seguinte. Dos 57 itens ★, os que caem nessa fronteira são 76 (anonimização e governança LGPD), 77 (observabilidade de dados), 82 (ingestão com extração assistida por IA e score) e 83 (deduplicação em dois estágios) — mais os não-★ 63 (importação em lote por API) e 75 (API pública). Resolução por precedência: são MVP de produto, não da entrega atual; no protótipo aparecem como comportamento demonstrado por dado mockado (ex.: Cenário 3 e a tela "Studio: duplicatas", ambas em Camada 1), nunca como implementação. Sem contradição real entre os documentos: o ★ marca a fase MVP do roadmap (§12), não a entrega de §14

[INFO] CONF-rota-68-sem-lastro — o número "68 rotas" não é rastreável a este conjunto de documentos
  Note: mantido conforme instrução do coordenador, como proveniência registrada. docs/PRD.md §7 abre com "68 rotas → 12 módulos → 5 abas", mas dados/inventario/mapa-conteudo.md §1 reporta 138 URLs declaradas em sitemap e 122 páginas efetivamente coletadas (26 seções + 43 subcategorias + 53 matérias). O coordenador informa que o 68 veio de um mapa de rotas fornecido em conversa, fora deste conjunto. Não afeta a entrega — a arquitetura de informação é definida pelos 12 módulos e 5 abas, não pela contagem de rotas de origem — mas fica marcado como não verificável nos documentos ingeridos

[INFO] CONF-numeros-conferem — checagem cruzada das afirmações quantitativas
  Note: todas as quantidades que docs/PRD.md cita da varredura conferem com dados/inventario/mapa-conteudo.md — 2.534 entidades, 152 pessoas, 123 tags, 29 linguagens do Rumos (as 29 estão listadas e contadas), 8 dimensões de acessibilidade (as 8 listadas e contadas), acervo 2013–2026, exposições desde 2012, `participants` 3%, `schedules` 0%, e "21% do acervo sem alt-text" que é o complemento exato dos 79% de `image_description` preenchido. Na revisão 2 conferem também os números novos: 1.125 entidades da Enciclopédia (423 pessoa + 239 obra + 217 grupo + 246 instituicao, contados no JSONL), 481 termos do tesauro, 1.766 registros na amostra, 57 itens ★, 36 telas e a partição 16+12+8 da ordem de corte. Divergência menor de forma, sem impacto: PRD §8 funde os itens 9 e 10 de funcionalidades.md numa única entrada, por isso enumera 9 itens em Acontece onde a SPEC enumera 10
