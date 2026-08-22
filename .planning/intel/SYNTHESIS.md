# Synthesis — Agenda Cultural BR

Entry point para consumidores downstream (`gsd-roadmapper`).
MODE: `new` · 3 documentos ingeridos · **revisão 3** (após correção das fontes e saneamento territorial).

---

## Source documents

| Doc | Type | Precedence | Confidence | Locked | Alterado na rev. 2 |
|---|---|---|---|---|---|
| `docs/PRD.md` | PRD | 0 (máxima) | high | não | sim — §3.1 nova, §7, §8, §14 (+ regra de saneamento) |
| `docs/funcionalidades.md` | SPEC | 1 | high | não | sim — total de ★ corrigido |
| `dados/inventario/mapa-conteudo.md` | DOC | 2 | high | não | não |

Precedência por override explícito do manifest (`.gsd-ingest-manifest.yml`), que substitui
a ordem padrão ADR > SPEC > PRD > DOC. Como não há ADR no conjunto, a ordem efetiva é
PRD > SPEC > DOC.

Grafo de cross-refs: **acíclico**, profundidade 3
(`funcionalidades.md` → `PRD.md` → `mapa-conteudo.md` → externo aos docs).

Dado de apoio verificado nesta revisão: `dados/amostra/enciclopedia.jsonl` (1.766 registros,
território saneado e conferido de forma independente), mais `dados/coletar_enciclopedia.py`
e `dados/sanear.py` (ambos idempotentes).

---

## The thesis (leia isto antes de planejar)

A revisão 2 mudou a premissa central da proposta, e todo plano downstream depende dela:

> Não falta um grafo cultural ao Itaú Cultural. **Ele já tem um** — a Enciclopédia, uma
> aplicação Rails separada com 100 mil+ registros cujas rotas *são* a ontologia. O que
> falta é conexão. A Enciclopédia sabe quem é o artista, mas não sabe que ele se apresenta
> sábado; o site sabe do evento de sábado, mas não sabe quem é o artista.
> **O produto é essa ponte.**

Consequência prática para o protótipo: os dados deixam de ser majoritariamente inventados.
Só Pessoa-usuária (3 personas), Repertório e as ~40 duplicatas do Cenário 3 são `autorado`.

---

## What was extracted

**Decisions — 20** (`decisions.md`)
Nenhum ADR e nenhuma decisão travada; as entradas vêm de blocos explicitamente decisórios
do PRD (§3.1, §6, §7, §14) e saem com `status: proposed`. Destaques: a ponte
Enciclopédia↔agenda · papéis não são classes · Ocorrência separada de Evento · Repertório
de primeira classe · procedência obrigatória · toda recomendação explicável · Formação e
Oportunidades sem aba · procedência do mock · saneamento territorial por conteúdo ·
ordem de corte em três camadas · stack Next.js + TypeScript + Tailwind · fronteira de escopo.
**Locked decisions: 0.**

**Requirements — 24** (`requirements.md`), em duas partes:
- **Parte A — PROTOTYPE (10 requisitos):** `REQ-prototipo-frontend-navegavel` ·
  `REQ-visao-mobile-app` (23 telas) · `REQ-visao-web-desktop` (13 telas) ·
  `REQ-dados-mockados-ontologicos` · `REQ-roteiro-demonstracao` ·
  `REQ-identidade-visual-prototipo` · `REQ-alternador-de-visoes` ·
  `REQ-ordem-de-corte` · `REQ-ponte-enciclopedia-agenda` ·
  `REQ-zero-resultado-como-descoberta`
- **Parte B — PRODUCT-MVP e fases posteriores (14 requisitos):** 13 por módulo, cobrindo
  os 86 itens numerados de `funcionalidades.md` preservados um a um — dos quais **57 são ★
  (MVP)** — mais `REQ-cobertura-fluxos-rfp` com a rastreabilidade aos fluxos do RFP.

**Constraints — 27** (`constraints.md`)
Por tipo: **schema 13** (camadas da ontologia, critérios de identidade, enum de
procedência, procedência do mock, Enciclopédia como grafo, amostra da Enciclopédia, 8
dimensões de acessibilidade, 29 linguagens, 123 tags, schema real do CMS, preenchimento de
campos, quatro lacunas do CMS, saneamento territorial) · **nfr 8** (fronteira de escopo, ordem de corte, limites da
IA, cores, tipografia, grafismo e chancela, dez princípios, anti-alvo) · **protocol 5**
(stack, vocabulário de relações, arquitetura de informação, infra existente, onze
sistemas) · **api-contract 1** (o mock JSON como contrato de API futuro).

**Context topics — 15** (`context.md`)
RFP e critério de avaliação · visão do produto · método da varredura · quatro conclusões ·
**a descoberta que reformula a tese** · ativos existentes · públicos e personas · cinco
cenários · métricas e indicadores · roadmap de produto · riscos · perguntas em aberto ·
ativos de dados no repositório · conclusão da varredura · contexto operacional do ingest.

---

## Conflicts

**0 blockers · 0 warnings · 15 info** — detalhe em `../INGEST-CONFLICTS.md`.

Todos os 6 warnings levantados (5 na revisão 1, 1 na revisão 2) foram verificados contra
as fontes e os dados, e estão fechados. Mantidos em INFO como trilha de auditoria.

Verificações independentes que passaram: 57 ★ marcados de fato · 23 mobile + 13 web = 36
telas · ordem de corte 16+12+8 = 36 particionando o inventário sem sobreposição nem lacuna
· 423+239+217+246 = 1.125 entidades da Enciclopédia · território saneado com 947 locais,
41 países todos do vocabulário fechado, 113 espaços distintos, 807 entidades com território
· cobertura de cenários mantida (50 entidades em PA/AM/MA/AP, 158 eventos datados) ·
`sanear.py` idempotente por hash.

**Ressalva operacional registrada, não bloqueante** (`CONF-crawler-desatualizado`): o
processo de crawl em execução antecede a correção do parser e segue anexando entradas
contaminadas ao arquivo bruto. O protótipo não depende dele — consome a amostra saneada.
Rodar `python3 dados/sanear.py` uma última vez ao fim do crawl.

---

## Scope note for downstream planning

As fontes usam "MVP" em dois sentidos diferentes, e confundi-los produz um plano errado:

- **PROTOTYPE** — a entrega em curso (PRD §14): front-end navegável, duas visões, dados
  mockados, 36 telas, prazo de 3 dias, ordem de corte definida. Escopo da **Parte A**.
- **PRODUCT-MVP** — a primeira fase do roadmap de produto (PRD §12), os 57 itens ★ de
  `funcionalidades.md`. Pressupõe backend, ingestão e IA — fora da entrega atual. Escopo da
  **Parte B**.

Um plano para a entrega atual deve consumir a **Parte A** como backlog, executar na ordem
de `REQ-ordem-de-corte` (Camada 1 → 2 → 3, cortando de baixo para cima) e tratar a Parte B
como intenção de produto que o protótipo apenas *demonstra* com dado mockado.

**STATUS: READY** — sem blockers e sem warnings em aberto. Seguro rotear para
`gsd-roadmapper`.

---

## Files

- `.planning/intel/decisions.md`
- `.planning/intel/requirements.md`
- `.planning/intel/constraints.md`
- `.planning/intel/context.md`
- `.planning/INGEST-CONFLICTS.md`
- `.planning/intel/classifications/` — classificações por documento (entrada desta síntese)
