# Decisions

> **Nota de proveniência:** nenhum documento deste ingest foi classificado como ADR e
> nenhum tem `locked: true`. As decisões abaixo foram extraídas de blocos explicitamente
> decisórios do PRD (§6 "Decisão dura", §7, §14 "Decisões técnicas"). Todas ficam com
> `status: proposed` — não há decisão travada neste conjunto.

---

## DEC-papeis-nao-sao-classes: Artista, curador, produtor e educador são papéis, não classes
- source: docs/PRD.md (§6, Camada 1 — Agentes)
- status: proposed
- decision: A mesma pessoa é artista num evento e curadora em outro. Modelar papel como classe gera duplicata estrutural e trava o produto em dois anos. As classes de agente são `Pessoa`, `Coletivo`, `Instituição`, `Espaço Cultural`; artista/curador/produtor/educador são atributos da relação `atua_em` (com papel).
- scope: ontologia, camada de agentes, modelo de dados mockado

## DEC-ocorrencia-entidade-propria: Ocorrência é entidade separada de Evento
- source: docs/PRD.md (§6, Camada 3 — Acontecimentos; §9 Cenários 3 e 4)
- status: proposed
- decision: `Programa` → `Evento` → `Temporada` → `Ocorrência`, cada nível com critério de identidade próprio. Evento = título normalizado + agente realizador + obra. Temporada = evento + espaço + intervalo. Ocorrência = temporada + início exato + espaço. Resolve dois cenários do RFP: mil duplicados colapsam numa entidade com N ocorrências, e uma mudança de horário altera uma ocorrência sem invalidar o evento.
- scope: ontologia, agenda, dedup, alerta de alteração

## DEC-repertorio-primeira-classe: Repertório é entidade de primeira classe desde o dia um
- source: docs/PRD.md (§6, Camada 5 — Pessoa e repertório)
- status: proposed
- decision: `Repertório` não é derivado de analytics. É dele que sai o indicador de ampliação de repertório que o RFP pede. Métrica de impacto não pode ser puxadinho de analytics.
- scope: ontologia, métricas de impacto cultural, Meu Repertório

## DEC-procedencia-obrigatoria: Todo campo carrega procedência
- source: docs/PRD.md (§4 princípio 9; §6 Procedência; §10 Transparência)
- status: proposed
- decision: Todo campo carrega origem no conjunto `ic` (veio do CMS), `derivado` (inferido deterministicamente), `parceiro`, `produtor`, `ia` (com score de confiança), `curador`. Sem isso não há dedução de duplicata defensável nem dado aberto confiável.
- scope: modelo de dados, governança, dedup, saídas de IA

## DEC-recomendacao-explicavel: Toda recomendação é explicável
- source: docs/PRD.md (§4 princípio 8; §6 relação `semelhante_a`)
- status: proposed
- decision: Se o sistema não consegue dizer por que sugeriu algo, ele não sugere. A relação `semelhante_a` sempre carrega justificativa legível (ex.: "parecido porque é arte contemporânea, coletiva, em espaço público e gratuita"). Explicabilidade é o que separa mediação de algoritmo.
- scope: descoberta, recomendação, busca por similaridade

## DEC-acessibilidade-como-filtro: Acessibilidade é filtro, não selo
- source: docs/PRD.md (§4 princípio 10); evidência em dados/inventario/mapa-conteudo.md (§5)
- status: proposed
- decision: As 8 dimensões de acessibilidade já modeladas pelo IC devem funcionar como critério de busca de primeira classe, não como ícone decorativo.
- scope: busca, filtros, ficha de evento, preferências de usuário

## DEC-mapa-nao-e-aba: Mapa é lente, não aba; Enciclopédia e Leituras são profundidade embutida
- source: docs/PRD.md (§7 Arquitetura de informação)
- status: proposed
- decision: 68 rotas → 12 módulos → 5 abas (Descobrir · Acontece · Play · Buscar · Meu). Mapa é lente dentro de Acontece e Buscar. Enciclopédia e Leituras aparecem dentro do que a pessoa está olhando, como profundidade. Formação e Oportunidades também não ganham aba (ver DEC-formacao-oportunidades-sem-aba). Institucional vira rodapé. `/404`, `/busca-nao-encontrada` e `/agenda-nao-encontrada` viram gatilho de descoberta.
- scope: arquitetura de informação, navegação do app, protótipo

## DEC-stack-next-ts-tailwind: Next.js + TypeScript + Tailwind para o protótipo
- source: docs/PRD.md (§14 Decisões técnicas)
- status: proposed
- decision: Framework Next.js + TypeScript porque as rotas do protótipo espelham o produto real. Estilo Tailwind por velocidade, e porque o design system é o do IC, não inventado.
- scope: protótipo, entrega atual

## DEC-dados-mockados-formato-grafo: Dados mockados em JSON no formato do grafo
- source: docs/PRD.md (§14 Decisões técnicas e justificativa)
- status: proposed
- decision: JSON mockado no formato do grafo, seguindo a ontologia mesmo sem backend. Sem evento separado de ocorrência, sem papel no agente e sem motivo escrito na recomendação, as telas não conseguem demonstrar o comportamento que o RFP avalia. O JSON pronto vira contrato de API para o time de produto — custo marginal agora, economia grande depois.
- scope: protótipo, dados, contrato de API futuro

## DEC-um-codigo-duas-visoes: Um código, dois layouts, alternador ao vivo
- source: docs/PRD.md (§14 Decisões técnicas)
- status: proposed
- decision: As visões web e mobile saem de um único código com dois layouts e um alternador ao vivo. Demonstra domínio sem dobrar o trabalho.
- scope: protótipo, arquitetura de front-end

## DEC-sem-app-de-loja: Aplicativo de loja fora de escopo
- source: docs/PRD.md (§14 Decisões técnicas)
- status: proposed
- decision: Mobile de loja fora de escopo. O RFP pede protótipo navegável, não binário.
- scope: entrega atual

## DEC-identidade-manual-ic: Manual de marca do Itaú Cultural aplicado
- source: docs/PRD.md (§14 Decisões técnicas); tokens em dados/inventario/mapa-conteudo.md (§6)
- status: proposed
- decision: Identidade visual conforme o Manual do Itaú Cultural, não caixa cinza. Justificativa: etapa final entre concorrentes. Resolve, para o protótipo, a divergência tipográfica observada em produção (ver CONF-tipografia no relatório de conflitos).
- scope: protótipo, identidade visual

## DEC-limites-da-ia: Fronteiras explícitas do uso de IA
- source: docs/PRD.md (§10 Inteligência artificial); docs/funcionalidades.md (item 86)
- status: proposed
- decision: A IA não publica nada sem revisão humana, não define destaque editorial, não escreve verbete de Enciclopédia, não decide ranking comercial e não substitui mediação cultural. Toda saída carrega `procedencia: "ia"` e score de confiança, e passa por fila humana antes de virar dado público. O feedback do curador é sinal de treino — o sistema aprende com quem tem autoridade cultural, não com clique.
- scope: IA, curadoria, governança editorial

## DEC-dedup-dois-estagios: Deduplicação em dois estágios, determinística antes de probabilística
- source: docs/PRD.md (§9 Cenário 3; §10); docs/funcionalidades.md (item 83)
- status: proposed
- decision: Primeiro chave determinística derivada do critério de identidade da ontologia, depois casamento probabilístico para o resto. O que passa de um limiar vira fila de revisão no Studio, com sugestão de merge. Limiar conservador e merge reversível com procedência.
- scope: ingestão, qualidade de dados, Studio

## DEC-escopo-da-entrega-atual: A entrega atual é só front-end navegável
- source: docs/PRD.md (§14 Escopo desta entrega)
- status: proposed
- decision: Constrói-se agora as telas e o front-end navegável em duas visões (web e mobile) com dados mockados. Ficam para a fase seguinte, com o time de produto: backend, banco, CMS, APIs reais, IA em produção, analytics, observabilidade, segurança e infraestrutura.
- scope: entrega atual, fronteira de escopo

## DEC-ponte-enciclopedia-agenda: O produto é a ponte entre a Enciclopédia e a agenda
- source: docs/PRD.md §3.1 ("A descoberta que reformula a tese")
- status: proposed
- decision: A tese não é mais "falta um grafo cultural". Três das quatro entidades ausentes no CMS já existem estruturadas na Enciclopédia Itaú Cultural — aplicação Rails separada cujas rotas são a própria ontologia (`/pessoas/`, `/obras/`, `/grupos/`, `/instituicoes/`, `/eventos/`, `/termos/`), com mais de 100 mil registros e tesauro de 481 termos. O que não existe é conexão: a Enciclopédia sabe quem é o artista mas não sabe que ele se apresenta sábado; o site sabe do evento de sábado mas não sabe quem é o artista. **O produto é essa ponte.** O fato de as duas metades já existirem é o que torna a escala nacional viável em prazo real, em vez de aspiração.
- scope: tese da proposta, arquitetura de dados, viabilidade de escala

## DEC-formacao-oportunidades-sem-aba: Formação e Oportunidades não ganham aba
- source: docs/PRD.md §7
- status: proposed
- decision: Decisão, não esquecimento. Uma aba custa atenção permanente de todo mundo para servir a uma minoria em um momento específico. **Formação** vive dentro da página do Espaço e do Evento ("agendar visita") e em *Meu* como "minhas visitas" — cobre a funcionalidade ★ 44. **Oportunidades** vive no Studio (superfície do produtor) e como seção de *Meu* para quem se declara artista ou produtor — cobre as ★ 46, 48 e 49. Princípio: uma pessoa que nunca foi ao teatro não precisa ver "Editais" na barra inferior; um artista que busca edital chega por notificação ou pelo próprio perfil.
- scope: arquitetura de informação, navegação do app

## DEC-procedencia-do-mock: Nada é inventado sem estar marcado
- source: docs/PRD.md §14 (Procedência dos dados do protótipo)
- status: proposed
- decision: Cada entidade do mock carrega origem explícita. `ic`: conteúdo editorial/mídia/publicação/formação do CMS (2.534), Artista/Grupo/Obra/Instituição da Enciclopédia (1.125), Território e Espaço Cultural da Enciclopédia, saneado (947 locais · 113 espaços distintos), Linguagem e Tema do Rumos + Enciclopédia (29 + 481 termos). `derivado`: coordenadas geográficas (centroide de município e aproximação por espaço) e Ocorrência (gerada a partir do período real do evento). `autorado`: Pessoa-usuária e Repertório (3 personas — Maria, Carlos e uma frequentadora) e as ~40 duplicatas do Cenário 3 (clonadas de eventos reais com variação controlada). Só três coisas são autoradas, e as três não poderiam vir de lugar nenhum. A marcação de procedência aparece na interface do Observatório, transformando limitação do protótipo em demonstração do princípio 9.
- scope: PROTOTYPE, dados mockados, demonstração de governança

## DEC-ordem-de-corte: Corte em três camadas, de baixo para cima
- source: docs/PRD.md §14 (Ordem de corte)
- status: proposed
- decision: 3 dias, 36 telas. As telas que os cinco cenários atravessam são intocáveis; o resto é fila; se algo cair, cai de baixo para cima. **Camada 1 — intocável (16 telas):** Onboarding por disposição · Descobrir · Explicação da recomendação · Trilha de primeira vez · Acontece · Página do evento · Seleção de ocorrência · Mapa · Modo Cidade · Buscar · Busca em linguagem natural · Página do artista · Meu Repertório · Salvos e alertas · Studio: duplicatas · Studio: ocorrências. **Camada 2 — a proposta fica pobre sem elas (12 telas):** Filtros · Play · Player · Zero-resultado como descoberta · Página do produtor · Redação: fila · Redação: trilha · Observatório: indicadores · e as versões web de Descobrir, Acontece com mapa, Página do evento e Buscar. **Camada 3 — primeiro a cair (8 telas):** Onboarding telas 2 e 3 · Página da obra · Mapa de repertório · Studio: publicar · Perfil web · Página do artista web · Página do produtor web.
- scope: PROTOTYPE, priorização de escopo

## DEC-saneamento-por-conteudo: Validar território por conteúdo, nunca por tipo de entidade
- source: docs/PRD.md §14 (Regra de saneamento do território); dados/sanear.py
- status: proposed
- decision: O campo territorial da Enciclopédia é validado testando o **conteúdo** (o primeiro segmento precisa estar num vocabulário fechado de países), não o tipo da entidade. Gatear por tipo descartaria território legítimo — obras carregam local quando a coleção tem local. O que falha no teste é rebaixado para `detalhe` e preservado, nunca apagado. Justificativa registrada na fonte: Mapa e Modo Cidade estão na camada intocável da ordem de corte, e seriam justamente as telas a exibir dado sujo carimbado como `ic`, numa proposta que promete procedência visível.
- scope: PROTOTYPE, qualidade de dados, pipeline de mock
