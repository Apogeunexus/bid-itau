# Phase 4: Camada 1 — Studio e o roteiro dos cinco cenários - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — áreas cinzentas resolvidas pela opção recomendada.

<domain>
## Phase Boundary

As 2 telas web do Studio — resolução de duplicatas e gestão de ocorrências — e o
fechamento da demonstração ao vivo dos cinco cenários de ponta a ponta.

Requisitos: STUD-01 a STUD-04.

**Esta é a fase do ponto seguro.** Ao fim dela a demonstração existe inteira e responde ao
que a banca vai perguntar. Tudo depois é ganho.

**Fora do escopo:** Studio publicar (Camada 3), Redação, Observatório e a visão web do app
(fase 5).
</domain>

<decisions>
## Implementation Decisions

### As duas telas são web, não mobile

- **D-67:** Studio existe **só na visão web**. Ninguém resolve uma fila de mil duplicatas
  no celular. As telas usam `[data-view="web"]` como estado normal e declaram, na visão
  app, que aquele trabalho é de tela grande — em vez de espremer uma tabela em 390px.

### Resolução de duplicatas — o Cenário 3

- **D-68:** A tela mostra **o critério que disparou a suspeita, escrito**: "mesmo título
  normalizado, mesmo agente realizador, mesma obra". O critério é o da ontologia, não uma
  heurística de similaridade — e é isso que separa esta proposta de um deduplicador
  genérico.
- **D-69:** Cada grupo declara **em qual estágio foi pego** — chave determinística ou
  casamento probabilístico — e, no segundo caso, o score. Os dois estágios existem no
  dado: as ~40 duplicatas foram clonadas violando o critério de forma controlada.
- **D-70:** Lado a lado dos registros com **os campos divergentes destacados**. Quem decide
  precisa ver a diferença, não procurá-la.
- **D-71:** Três ações: fundir, manter separados, adiar. A fusão declara que é
  **reversível e preserva procedência** — nada é apagado, a relação vira `duplicata_de`.
- **D-72:** Nenhuma fusão acontece sozinha. A tela diz que a decisão é humana e registra
  quem decidiu. É o princípio 3 aplicado ao caso mais tentador de automatizar.

### Gestão de ocorrências — a outra metade do Cenário 4

- **D-73:** O evento fica no topo, **imutável**. As ocorrências abaixo, em tabela editável.
  A tela inteira é a demonstração de que alterar uma sessão não toca no evento.
- **D-74:** Antes de confirmar, **prévia do impacto**: quantas pessoas salvaram aquela
  ocorrência e serão avisadas. É o número que fecha o cenário — e ele vem do `localStorage`
  das personas, não de um valor inventado.
- **D-75:** A alteração registra quem alterou e quando, e aparece no histórico. A mesma
  alteração que a tela de Salvos já exibe do outro lado.

### O roteiro de demonstração

- **D-76:** Uma rota `/roteiro` reúne os cinco cenários como **percurso clicável**, cada um
  com o caminho exato e o que provar em cada tela. Não é slide: é o app, com um guia.
- **D-77:** Cada cenário declara o que o acervo **não** sustenta, junto com o que sustenta.
  A banca vai perguntar; melhor que a resposta esteja na tela antes da pergunta.
- **D-78:** O roteiro vive na visão web, porque é ferramenta de apresentação.

### Claude's Discretion

Layout da tabela de duplicatas, densidade da tabela de ocorrências, e a forma do percurso
no roteiro.
</decisions>

<specifics>
## Specific Ideas

- A tela de duplicatas é, das 37, a que melhor demonstra que a ontologia não é enfeite:
  ela mostra um critério de identidade sendo aplicado, com o resultado auditável.
- A prévia de impacto ("3 pessoas serão avisadas") é o detalhe que faz o Cenário 4 virar
  produto em vez de mecanismo.
</specifics>

<canonical_refs>
## Canonical References

- `docs/telas.md` — telas 31 e 32
- `docs/PRD.md` §9 — Cenários 3 e 4
- `.planning/phases/03-*/3-CONTEXT.md` e os 7 SUMMARYs — o que existe e o que foi medido
- `src/dados/grafo.ts` — as 40 duplicatas estão em `duplicata_suspeita`
</canonical_refs>

<riscos_herdados>
## Riscos herdados

- **Nenhuma ocorrência tem espaço** (2425/2425). A tabela de ocorrências mostra data, hora
  e gratuidade, e declara a ausência do espaço.
- **Gratuidade não recorta**: 0 de 300 eventos declaram ingresso.
- **`ocorrenciasDe` devolve zero para as entidades da Enciclopédia** — o Studio opera sobre
  os 129 eventos do CMS que têm sessão.
- O projeto está no iCloud com o disco a 96% e houve despejo com perda. Verificar leitura
  antes de editar e conteúdo não-vazio antes de commitar. Espelho em
  `~/Projetos/Noz-espelho.git`, remote `espelho`.
</riscos_herdados>
