# Agenda Cultural BR

## What This Is

Protótipo de front-end navegável do **Agenda Cultural BR** — a resposta de produto e
tecnologia ao Request for Final Proposal do Itaú Cultural / Fundação Itaú. O produto
proposto é uma infraestrutura que transforma o acervo cultural brasileiro em um grafo de
sentido e usa esse grafo para levar cada pessoa a uma experiência cultural que ela não
sabia que procurava. Esta entrega é o protótipo que a banca vai ver ao vivo: 36 telas em
duas visões — app mobile e web desktop — saindo de um único código, com dados mockados no
formato do grafo, construídos sobre acervo real do Itaú Cultural.

A tese central: **o Itaú Cultural já tem um grafo cultural** — a Enciclopédia, aplicação
Rails separada com mais de 100 mil registros cujas rotas *são* a ontologia. O que falta é
conexão. A Enciclopédia sabe quem é o artista, mas não sabe que ele se apresenta sábado; o
site sabe do evento de sábado, mas não sabe quem é o artista. **O produto é essa ponte.**

## Core Value

Os cinco cenários do RFP rodam ao vivo, de ponta a ponta, nas duas visões, na frente da
banca — provando que a unidade do produto é a relação, não o item.

## Business Context

- **Customer**: Itaú Cultural / Fundação Itaú — etapa final de seleção de parceiro de produto e tecnologia
- **Revenue model**: contrato de parceria para construir a infraestrutura digital de descoberta da cultura brasileira
- **Success metric**: os cinco cenários do RFP navegáveis ao vivo nas duas visões, sem preparação manual entre eles
- **Strategy notes**: `docs/PRD.md` (proposta integral) · `docs/funcionalidades.md` (catálogo de 86 capacidades) · `dados/inventario/mapa-conteudo.md` (varredura técnica)

## Requirements

### Validated

<!-- Nada validado ainda — este é o primeiro marco. -->

(Nenhum ainda — é preciso entregar para validar)

### Active

Escopo desta entrega (PROTOTYPE). Detalhe checável em `.planning/REQUIREMENTS.md`.

- [ ] Protótipo navegável em Next.js + TypeScript + Tailwind, export estático, sem backend (FUND)
- [ ] Um código, dois layouts, alternador de visões ao vivo (FUND-02)
- [ ] Identidade visual do Itaú Cultural aplicada como design tokens (FUND-03)
- [ ] Camada de dados em formato de grafo, transformada do acervo real já em disco (DADO)
- [ ] Camada 1 do corte — 16 telas intocáveis que os cinco cenários atravessam (DESC, AGEN, STUD)
- [ ] Roteiro de demonstração com os cinco cenários do RFP navegáveis ao vivo (STUD-03, STUD-04)
- [ ] Camada 2 do corte — 12 telas sem as quais a proposta fica pobre (WEB, APPX)
- [ ] Camada 3 do corte — 8 telas de profundidade opcional (CAM3)

### Out of Scope

Fronteira explícita desta entrega (PRD §14). Tudo abaixo pertence ao marco seguinte, com o
time de produto do cliente.

- **Backend, banco de dados e CMS** — o RFP pede protótipo navegável, não sistema em produção
- **APIs reais e integração com os 11 sistemas do IC** — depende de acesso interno ainda não concedido (PRD §15, pergunta 3)
- **IA em produção** (extração, casamento probabilístico, tradução de linguagem natural real) — o protótipo *demonstra* o comportamento com dado mockado e marcação `procedencia: ia`
- **Analytics, observabilidade, segurança e infraestrutura** — fase seguinte
- **Aplicativo de loja (binário iOS/Android)** — o RFP pede protótipo navegável, não binário
- **Os 57 itens ★ do catálogo de funcionalidades** — são o PRODUCT-MVP do roadmap de produto (PRD §12), não esta entrega; o protótipo só mostra na tela o que a tela precisa mostrar
- **Nova coleta de dados** — 2.534 entidades normalizadas, 1.766 registros da Enciclopédia, taxonomia e 2.382 imagens já estão em disco; o trabalho é transformar, não coletar
- **Design de identidade visual** — o manual de marca do Itaú Cultural é dado, não exercício

## Context

**A entrega é competitiva e tem prazo duro de 3 dias contra 36 telas.** A ordem de corte em
três camadas (PRD §14) é a autoridade sobre risco de escopo: Camada 1 é intocável, Camada 3
cai primeiro. Nenhum trabalho de Camada 3 pode ser pré-requisito de trabalho de Camada 1.

**Os dados já existem em disco e não precisam ser coletados de novo:**

| Ativo | Conteúdo |
|---|---|
| `dados/normalizado/*.json` | 2.534 entidades do CMS do Itaú Cultural (agentes, conteúdos, eventos, formações, mídias, publicações) |
| `dados/amostra/enciclopedia.jsonl` | 1.766 entidades curadas da Enciclopédia — 481 termo, 423 pessoa, 246 instituição, 239 obra, 217 grupo, 160 evento; território saneado com 947 entradas válidas em 113 espaços distintos |
| `dados/taxonomia/` | vocabulário controlado — 29 linguagens do Rumos, temas |
| `dados/imagens/` | 2.382 imagens locais com índice de procedência em `dados/imagens/indice.json` (hash → url, dono) |
| `dados/sanear.py`, `dados/normalizar.py`, `dados/coletar*.py` | scripts idempotentes de coleta, normalização e saneamento territorial |

**Três coisas precisam ser autoradas porque não existem em sistema nenhum do IC:**
Ocorrência (derivada do período real do evento), Pessoa-usuária (3 personas — Maria, Carlos
e uma frequentadora) com seu Repertório, e as ~40 duplicatas do Cenário 3 (clonadas de
eventos reais com variação controlada). Coordenadas geográficas são derivadas de centroide
de município. Tudo carimbado com procedência visível.

**O anti-alvo é explícito.** O caminho óbvio — app de agenda com mapa e filtros — reprova.
Não é agenda tradicional, guia turístico, aplicativo institucional, rede social,
marketplace, chatbot nem catálogo estático.

**Ressalva operacional não bloqueante:** o crawl completo em `dados/bruto/enciclopedia/`
(~51 mil registros e crescendo) antecede a correção do parser e segue anexando entradas
contaminadas. O protótipo **não depende dele** — consome a amostra saneada. Rodar
`python3 dados/sanear.py` uma última vez ao fim do crawl.

## Constraints

- **Timeline**: 3 dias contra 36 telas — corte de baixo para cima pela ordem de camadas de PRD §14
- **Tech stack**: Next.js (App Router) + TypeScript + Tailwind CSS, export estático, sem backend nem banco — as rotas do protótipo espelham o produto real
- **Arquitetura de front-end**: um código, dois layouts, alternador ao vivo entre visão mobile-app e visão web-desktop
- **Dados**: JSON/TS mockado no formato do grafo — o mock é entregue como contrato de API para a fase seguinte, então precisa ser fiel à ontologia
- **Ontologia**: seis camadas (vocabulário · agentes · criação · acontecimentos · conhecimento editorial · pessoa e repertório); Evento separado de Ocorrência; papel na relação `atua_em`, nunca como classe; `semelhante_a` sempre com justificativa legível
- **Procedência**: todo campo carrega origem em `ic | derivado | parceiro | produtor | ia | curador`; no protótipo o conjunto efetivo é `ic | derivado | autorado`, e a marcação aparece na interface do Observatório
- **Arquitetura de informação**: 68 rotas → 12 módulos → 5 abas (Descobrir · Acontece · Play · Buscar · Meu); Mapa é lente, não aba; Enciclopédia e Leituras são profundidade embutida; Formação e Oportunidades sem aba; institucional vira rodapé
- **Identidade visual**: manual de marca do Itaú Cultural — principais `#ffffff` · `#ff7800` · `#000000`; apoio `#7f3e98` · `#30c5f4` · `#f9df4d` · `#e04b9b` · `#a6ce39` · `#69c4a4`; Itaú Text (≤12pt) e Itaú Display (≥13pt), com Myriad e Arial como substitutas previstas pelo próprio manual; grafismo `\` em três variações; chancela Fundação Itaú quando aplicável
- **Acessibilidade**: as 8 dimensões já modeladas pelo IC (`audio_description`, `libras`, `descriptive_subtitle`, `closed_caption`, `open_caption`, `simultaneous_translation`, `stenotypy`, `subtitle`) funcionam como filtro de primeira classe, não como selo
- **Limites da IA**: a IA não publica sem revisão humana, não define destaque editorial, não escreve verbete, não decide ranking comercial e não substitui mediação cultural
- **Idioma**: português brasileiro em toda a documentação e na interface; chaves estruturais e identificadores em inglês

## Key Decisions

Nenhuma decisão travada neste ingest. As 20 abaixo saíram de blocos explicitamente
decisórios do PRD (§3.1, §6, §7, §14) e estão como **`proposed`** — podem ser revistas.

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| O produto é a ponte Enciclopédia↔agenda | O grafo já existe; falta conexão. Duas metades prontas tornam a escala nacional viável em prazo real | — Pending |
| Papéis não são classes | Artista/curador/produtor são atributos da relação `atua_em`; modelar como classe gera duplicata estrutural | — Pending |
| Ocorrência é entidade separada de Evento | Resolve dois cenários do RFP: dedup (Cenário 3) e alerta de horário (Cenário 4) | — Pending |
| Repertório é entidade de primeira classe | É dele que sai o indicador de ampliação de repertório; métrica de impacto não pode ser puxadinho de analytics | — Pending |
| Todo campo carrega procedência | Sem isso não há dedução de duplicata defensável nem dado aberto confiável | — Pending |
| Toda recomendação é explicável | Se o sistema não consegue dizer por que sugeriu, ele não sugere | — Pending |
| Acessibilidade é filtro, não selo | As 8 dimensões já existem no CMS; usá-las como ícone desperdiça o ativo | — Pending |
| Mapa é lente, não aba | 68 rotas → 12 módulos → 5 abas; uma aba custa atenção permanente de todos | — Pending |
| Formação e Oportunidades sem aba | Decisão, não esquecimento — servem uma minoria em um momento específico | — Pending |
| Next.js + TypeScript + Tailwind | Rotas espelham o produto real; velocidade; o design system é o do IC | — Pending |
| Dados mockados em formato de grafo | Sem fidelidade à ontologia as telas não demonstram o que o RFP avalia; o JSON vira contrato de API | — Pending |
| Um código, dois layouts, alternador ao vivo | Demonstra domínio sem dobrar o trabalho | — Pending |
| Aplicativo de loja fora de escopo | O RFP pede protótipo navegável, não binário | — Pending |
| Manual de marca do IC aplicado | Etapa final entre concorrentes; caixa cinza não vende | — Pending |
| Limites explícitos da IA | Fila humana antes de virar dado público; o sistema aprende com autoridade cultural, não com clique | — Pending |
| Dedup em dois estágios | Chave determinística antes de casamento probabilístico; limiar conservador, merge reversível | — Pending |
| A entrega atual é só front-end navegável | Backend, banco, CMS, APIs, IA em produção, analytics, segurança e infra ficam para a fase seguinte | — Pending |
| Nada é inventado sem estar marcado | Só três conjuntos são autorados, e a marcação aparece no Observatório | — Pending |
| Corte em três camadas, de baixo para cima | 3 dias, 36 telas; as telas que os cenários atravessam são intocáveis | — Pending |
| Saneamento territorial testa conteúdo, não tipo | Gatear por tipo descartaria território legítimo; o que falha é rebaixado para `detalhe`, nunca apagado | — Pending |

<decisions>

Status de todas: `proposed`. Nenhuma travada. Rastreabilidade em `.planning/intel/decisions.md`.

- **D-01: O produto é a ponte entre a Enciclopédia e a agenda.** A tese não é mais "falta um grafo cultural". A Enciclopédia Itaú Cultural é uma aplicação Rails separada cujas rotas são a ontologia (`/pessoas/`, `/obras/`, `/grupos/`, `/instituicoes/`, `/eventos/`, `/termos/`), com 100 mil+ registros e tesauro de 481 termos. Falta conexão entre o grafo e a agenda. `proposed` · DEC-ponte-enciclopedia-agenda · PRD §3.1
- **D-02: Artista, curador, produtor e educador são papéis, não classes.** As classes de agente são Pessoa, Coletivo, Instituição e Espaço Cultural; o papel é atributo da relação `atua_em`. Modelar papel como classe gera duplicata estrutural. `proposed` · DEC-papeis-nao-sao-classes · PRD §6
- **D-03: Ocorrência é entidade separada de Evento.** Programa → Evento → Temporada → Ocorrência, cada nível com critério de identidade próprio. Evento é título normalizado mais agente realizador mais obra; Temporada é evento mais espaço mais intervalo; Ocorrência é temporada mais início exato mais espaço. `proposed` · DEC-ocorrencia-entidade-propria · PRD §6, §9
- **D-04: Repertório é entidade de primeira classe desde o dia um.** Não é derivado de analytics — é dele que sai o indicador de ampliação de repertório que o RFP pede. `proposed` · DEC-repertorio-primeira-classe · PRD §6
- **D-05: Todo campo carrega procedência.** Enum `ic`, `derivado`, `parceiro`, `produtor`, `ia` (com score), `curador`. Sem isso não há dedução de duplicata defensável nem dado aberto confiável. `proposed` · DEC-procedencia-obrigatoria · PRD §4, §6, §10
- **D-06: Toda recomendação é explicável.** A relação `semelhante_a` sempre carrega justificativa legível. Se o sistema não consegue dizer por que sugeriu algo, ele não sugere. `proposed` · DEC-recomendacao-explicavel · PRD §4, §6
- **D-07: Acessibilidade é filtro, não selo.** As 8 dimensões já modeladas pelo IC funcionam como critério de busca de primeira classe. `proposed` · DEC-acessibilidade-como-filtro · PRD §4
- **D-08: Mapa é lente e não aba.** 68 rotas viram 12 módulos e 5 abas (Descobrir, Acontece, Play, Buscar, Meu). Enciclopédia e Leituras aparecem como profundidade embutida; institucional vira rodapé; estados vazios viram gatilho de descoberta. `proposed` · DEC-mapa-nao-e-aba · PRD §7
- **D-09: Formação e Oportunidades não ganham aba.** Formação vive na página do Espaço e do Evento e em Meu; Oportunidades vive no Studio e como seção de Meu para quem se declara artista ou produtor. `proposed` · DEC-formacao-oportunidades-sem-aba · PRD §7
- **D-10: Next.js mais TypeScript mais Tailwind para o protótipo.** As rotas do protótipo espelham o produto real; Tailwind por velocidade, e porque o design system é o do IC, não inventado. `proposed` · DEC-stack-next-ts-tailwind · PRD §14
- **D-11: Dados mockados em JSON no formato do grafo.** Sem evento separado de ocorrência, sem papel na relação e sem motivo escrito na recomendação, as telas não demonstram o comportamento que o RFP avalia. O JSON pronto vira contrato de API. `proposed` · DEC-dados-mockados-formato-grafo · PRD §14
- **D-12: Um código, dois layouts, alternador ao vivo.** As visões web e mobile saem de um único código. Demonstra domínio sem dobrar o trabalho. `proposed` · DEC-um-codigo-duas-visoes · PRD §14
- **D-13: Aplicativo de loja fora de escopo.** O RFP pede protótipo navegável, não binário. `proposed` · DEC-sem-app-de-loja · PRD §14
- **D-14: Manual de marca do Itaú Cultural aplicado.** Identidade visual conforme o manual, não caixa cinza. Resolve, para o protótipo, a divergência tipográfica observada em produção. `proposed` · DEC-identidade-manual-ic · PRD §14
- **D-15: Fronteiras explícitas do uso de IA.** A IA não publica sem revisão humana, não define destaque editorial, não escreve verbete, não decide ranking comercial e não substitui mediação cultural. Toda saída carrega `procedencia: ia` mais score e passa por fila humana. `proposed` · DEC-limites-da-ia · PRD §10
- **D-16: Deduplicação em dois estágios.** Chave determinística derivada do critério de identidade antes do casamento probabilístico. O que passa do limiar vira fila de revisão no Studio, com merge reversível e procedência. `proposed` · DEC-dedup-dois-estagios · PRD §9, §10
- **D-17: A entrega atual é só front-end navegável.** Telas e front-end em duas visões com dados mockados. Backend, banco, CMS, APIs reais, IA em produção, analytics, observabilidade, segurança e infraestrutura ficam para a fase seguinte. `proposed` · DEC-escopo-da-entrega-atual · PRD §14
- **D-18: Nada é inventado sem estar marcado.** Só Pessoa-usuária mais Repertório (3 personas), Ocorrência derivada e as ~40 duplicatas do Cenário 3 não vêm de acervo real. A marcação de procedência aparece na interface do Observatório. `proposed` · DEC-procedencia-do-mock · PRD §14
- **D-19: Corte em três camadas, de baixo para cima.** 16 telas intocáveis (as que os cinco cenários atravessam), 12 telas sem as quais a proposta fica pobre, 8 telas que caem primeiro. `proposed` · DEC-ordem-de-corte · PRD §14
- **D-20: Validar território por conteúdo, nunca por tipo de entidade.** O primeiro segmento precisa constar de um vocabulário fechado de 104 países. O que falha é rebaixado para `detalhe` e preservado, nunca apagado. `proposed` · DEC-saneamento-por-conteudo · PRD §14

</decisions>

## Evolution

- **A cada transição de fase**: requisitos invalidados vão para Out of Scope com motivo; requisitos entregues vão para Validated com referência de fase; decisões que saírem de `proposed` são registradas aqui.
- **Ao fim do marco**: revisão completa — Core Value ainda é o certo? A fronteira de escopo continua válida? O que o cliente aprovou vira base do PRODUCT-MVP.

---
*Última atualização: 2026-08-21 após ingest de `docs/PRD.md`, `docs/funcionalidades.md` e `dados/inventario/mapa-conteudo.md`*
