# TAREFAS — as 64 tarefas das seis sessões

**Documento de leitura.** Ninguém edita aqui: cada tarefa é a ordem de execução do PRD da
sessão, e a fonte é o PRD. O que muda de estado vive em `estado/S<n>.md`.

A sessão de controle usa este arquivo para saber **o que cada sessão tem pela frente**, e os
`estado/S<n>.md` para saber **o que já foi entregue**.

---

## S7 · Studio · Produtor — 11 tarefas
`(bastidor)/studio/` · [PRD](sessoes/S7-STUDIO-PRODUTOR.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Contrato de estado + `localStorage` + semente + reinício | — |
| 2 | **P2** identidade — estende `publicar` | 1 |
| 3 | **P5** grade de ocorrências | 2 |
| 4 | **P3** obra e elenco | 2 |
| 5 | **P4** espaço e temporada | 2 |
| 6 | **P6** ficha de acessibilidade | 2 |
| 7 | **P7** comercial e classificação | 2 |
| 8 | **P8** revisão e envio | 3–7 |
| 9 | **P1** painel | 8 |
| 10 | **E1** alteração · **E2** duplicata | 8 |
| 11 | Suíte e medidas | 10 |

Não se cortam: P2, P5, P6, P8. Independentes: 3 a 7.

---

## S3 · Moderação — 11 tarefas
`(bastidor)/moderacao/` · [PRD](sessoes/S3-MODERACAO.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Separação de território — `moderacao.ts`, mover a fila, folha, 1 linha em `globals.css` | — |
| 2 | **M1** fila migrada | 1 |
| 3 | **M2** ficha do item, com a assimetria do motivo | 2 |
| 4 | **M9** histórico | 3 |
| 5 | Integração com o armazém da S7 | `tipos-acesso.ts` |
| 6 | **M3** revisão da IA | 3 |
| 7 | **M8** escopo e escalonamento | 2 |
| 8 | **M5** elenco · **M6** reconciliação | 5 |
| 9 | **M4** similaridade | 3 |
| 10 | **M7** duplicatas | 3 |
| 11 | Suíte e medidas | 10 |

Não se cortam: M1, M2, M3, M9. Independentes: 6 a 10.

---

## S1 · Admin — 11 tarefas
`(bastidor)/admin/` · [PRD](sessoes/S1-ADMIN.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Folha `admin.css` + linha em `globals.css` — só se ainda não existir | — |
| 2 | `src/dados/admin.ts` — DTOs de `meta.json`, `geo.ts`, `duplicatas.ts` | 1 |
| 3 | **A2** motor — fixa o padrão do parâmetro auditável | 2 |
| 4 | **A3** territórios | 2 |
| 5 | **A6** observabilidade | 2 |
| 6 | **A1** papéis e escopos | `tipos-acesso.ts` |
| 7 | **A7** auditoria | 6 |
| 8 | **A4** vocabulário · **A5** limites da IA | 2 |
| 9 | **A8** titulares · **A9** governança | 6 |
| 10 | **A10** desempenho da moderação | S3 em andamento |
| 11 | Suíte e medidas | 10 |

Não se cortam: A2, A3, A7, A1. Independentes: 4, 5, 8.

---

## S5 · Editor / Curador — 10 tarefas
`(bastidor)/redacao/` · [PRD](sessoes/S5-EDITOR.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Conferir o split da S3 e reancorar `redacao.ts` | commit da S3 |
| 2 | **E1** trilha — com a prévia mobile do selo | 1 |
| 3 | **E3** arestas de sentido | 2 |
| 4 | **E9** o que eu assinei | 3 |
| 5 | **E2** destaque | 2 |
| 6 | **E4** tesauro | 1 |
| 7 | **E5** redação editorial | 1 |
| 8 | **E7** motor editorial | 6 |
| 9 | **E6** especiais · **E8** calendário | 2, 7 |
| 10 | Suíte e medidas | 9 |

Não se cortam: E1, E3, E4, E2. Independentes: 5, 6, 7.

---

## S6 · Organização — 11 tarefas
`(bastidor)/studio/` · [PRD](sessoes/S6-ORGANIZACAO.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Ler o que a S7 deixou: contrato, estado, componentes `studio-*` | **S7 encerrada** |
| 2 | **O2** espaços — a maior conversão, fixa o padrão de ficha | 1 |
| 3 | **O1** ficha da instituição | 2 |
| 4 | **O7** equipe e alçadas | 1 |
| 5 | **O5** mídia | 1 |
| 6 | **O3** programa | 3 |
| 7 | **O4** formação | 3 |
| 8 | **O6** editais | `PEDIDO` de classe atendido |
| 9 | **O8** integração | 3 |
| 10 | **O9** alcance · **O10** conformidade | 4 |
| 11 | Suíte e medidas | 10 |

Não se cortam: O2, O7, O5, O1. Independentes: 4, 5, 6, 7.

---

## S2 · Gestor / Observatório — 10 tarefas
`(bastidor)/observatorio/` · [PRD](sessoes/S2-GESTOR.md)

| # | Tarefa | Depende de |
|---|---|---|
| 1 | Ler `observatorio.ts` e recortar o DTO por tela | — |
| 2 | **G1** público e visão geral | 1 |
| 3 | **G3** impacto cultural — fixa o padrão de D-90 | 2 |
| 4 | **G5** procedência | 2 |
| 5 | **G6** ausência declarada | 3 |
| 6 | **G4** território | 2 |
| 7 | **G2** KPIs de produto | 3 |
| 8 | **G7** exportação | 5 |
| 9 | **G8** leitura da moderação | S3 em andamento |
| 10 | Suíte e medidas | 9 |

Não se cortam: G1, G3, G5, G6. Independentes: 6, 7, 8.

---

## Total

| Sessão | Tarefas | Telas |
|---|---:|---:|
| S7 Studio · Produtor | 11 | 10 |
| S3 Moderação | 11 | 9 |
| S1 Admin | 11 | 10 |
| S5 Editor | 10 | 9 |
| S6 Organização | 11 | 10 |
| S2 Gestor | 10 | 8 |
| **Total** | **64** | **56** |
