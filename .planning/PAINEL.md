# PAINEL — a sessão de controle

> **Só a sessão de controle escreve neste arquivo.** As sessões de trabalho escrevem em
> `estado/S<n>.md`, uma cada, e nunca aqui. É assim que a colisão de escrita deixa de
> existir em vez de ser administrada.

Contexto: [`sessoes/ONTOLOGIA-E-ACESSOS.md`](sessoes/ONTOLOGIA-E-ACESSOS.md) ·
Tarefas: [`TAREFAS.md`](TAREFAS.md) · Estado: [`estado/`](estado/)

---

## 1. Legenda — nome da sessão por papel

As seis já existem. **Confirme o nome real com `ListAgents`** — o rótulo da aba pode diferir
do nome que a sessão usa para receber mensagem.

| Sessão | Nome na máquina | Pasta |
|---|---|---|
| S7 · Studio · Produtor | `Onda 1 - 1/2 studio` | `(bastidor)/studio/` |
| S3 · Moderação | `Onda 1 - 2/2 Moderador` | `(bastidor)/moderacao/` |
| S1 · Admin | `Onda 2 - 1/4 Admin` | `(bastidor)/admin/` |
| S5 · Editor / Curador | `Onda 2 - 2/4 Editor` | `(bastidor)/redacao/` |
| S6 · Organização | `Onda 2 - 3/4 Organização` | `(bastidor)/studio/` |
| S2 · Gestor / Observatório | `Onda 2 - 4/4 Gestor` | `(bastidor)/observatorio/` |

---

## 2. Estado agregado

Lido de `estado/S<n>.md`. Atualizar a cada varredura.

| Sessão | Estado | Tarefa | Última entrega |
|---|---|---|---|
| S7 | rodando | — de 11 | — |
| S3 | rodando | — de 11 | — |
| S1 | aguardando | 0 de 11 | — |
| S5 | aguardando | 0 de 10 | — |
| S6 | aguardando | 0 de 11 | — |
| S2 | aguardando | 0 de 10 | — |

**Progresso:** 0 de 64 tarefas com commit.

---

## 3. Fila de liberação

A sessão de controle libera por mensagem quando a condição fecha. **A condição é sempre um
commit**, nunca um arquivo no disco.

| Sessão | Libera quando | Estado da condição |
|---|---|---|
| **S2** Gestor | imediato — sem dependência | ✅ pode liberar |
| **S1** Admin | `tipos-acesso.ts` **commitado** pela S7 | ⏳ existe no disco, sem commit |
| **S5** Editor | split de `redacao.ts` **commitado** pela S3 | ⏳ existe no disco, sem commit |
| **S6** Organização | S7 com `estado: encerrada` | ⏳ S7 em curso |

**S6 e S7 dividem `(bastidor)/studio/`.** Nunca simultâneas.

---

## 4. Pedidos de contrato abertos

Agregados dos seis `estado/S<n>.md`. Um pedido aberto que trava outra sessão sobe para o
topo desta lista.

| Quem pediu | O quê | Para quem | Estado |
|---|---|---|---|
| — | — | — | — |

---

## 5. Pendências de higiene

| | Estado |
|---|---|
| Árvore commitada | ❌ 54 arquivos sujos, último commit anterior às sessões |
| `src/estilos/admin.css` + `@import` | ❌ não existe — a S1 precisa na tarefa 1 |
| `src/estilos/moderacao.css` | ✅ criada pela S3 |
| Legenda de nomes preenchida | ✅ as seis criadas em 25.08 |

---

## 6. Registro de varreduras

A sessão de controle anota aqui cada passada, com o que mudou. Append, nunca reescrita.

| Quando | O que mudou |
|---|---|
| 25.08 19:20 | painel reestruturado; `estado/` e `TAREFAS.md` criados |
