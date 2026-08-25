# MONITOR — os KPIs das seis sessões

**Alimentado só pela sessão de controle**, a cada varredura. Uma sessão de trabalho nunca
escreve aqui.

## O painel visual

**https://claude.ai/code/artifact/d322d40a-1b99-4354-8d87-36484cacbd9b**

Gantt das 64 tarefas em seis faixas, cor por estado, com hash e nota em cada bloco.

A cada varredura:

```bash
node scripts/gerar-painel.mjs     # lê estado/S*.md + git, reescreve monitor.html
```

Depois republique `.planning/monitor.html` **na mesma URL** — o link não muda, o dado sim.
O gerador escreve também `.planning/painel.json`, que é o mesmo dado em forma legível por
máquina.

**Nenhum número do painel é digitado.** Progresso sai da contagem de linhas com hash;
frescor sai do `git log` por pasta; árvore suja sai do `git status`. Número escrito à mão
passaria a mentir na varredura seguinte.

> **Não é tempo real, e é honesto dizer.** É tão fresco quanto a última varredura, e o
> carimbo abaixo diz quando ela foi. Um painel que promete tempo real e entrega dado de 40
> minutos atrás é pior que um painel que declara a idade do que mostra.

**Última varredura:** —
**Varredura anterior:** —

---

## 1. Progresso

| KPI | Como se mede | Agora | Alerta |
|---|---|---|---|
| **Tarefas concluídas** | linhas com hash nos seis `estado/S*.md` | 0 de 64 | — |
| **Telas entregues** | tarefas de tela concluídas | 0 de 56 | — |
| **Avanço da varredura** | tarefas fechadas desde a varredura anterior | — | **0 em duas varreduras seguidas** |
| **Sessões ativas** | `estado: rodando` | 2 de 6 | — |

## 2. Saúde — os que pegam problema antes de virar prejuízo

| KPI | Como se mede | Agora | Alerta |
|---|---|---|---|
| **Frescor do commit** | minutos desde o último commit, por sessão | — | **> 90 min com sessão rodando** |
| **Divergência estado × git** | entregas sem hash + commits sem linha no estado | — | **qualquer valor > 0** |
| **Árvore suja** | `git status --short \| wc -l` | 54 | **> 20** |
| **Portão** | resultado de `npm run checar` na última entrega | 🔴 `cursos.css` | **vermelho por causa nova** |
| **Invasão de território** | arquivo tocado fora da pasta da sessão | — | **qualquer valor > 0** |

**O frescor do commit é o KPI mais importante deste painel.** É o único que teria pego,
horas antes, o problema de 80 KB de contrato existindo no disco sem nenhum commit — com duas
sessões bloqueadas esperando exatamente aqueles hashes.

## 3. Bloqueio

| KPI | Como se mede | Agora | Alerta |
|---|---|---|---|
| **Sessões bloqueadas** | `estado: aguardando` ou `bloqueada`, com o motivo | 4 | **bloqueada sem motivo escrito** |
| **Pedidos de contrato abertos** | agregado dos seis, dos 15 previstos | 0 | **pedido que trava outra sessão** |
| **Fila de build** | em execução + aguardando | 0 | **espera > 1 rodada** |
| **Tempo em bloqueio** | desde quando a sessão espera | — | **> 2 varreduras** |

## 4. Caminho crítico

| KPI | Como se mede | Agora | Por quê importa |
|---|---|---|---|
| **Posição da S7** | tarefa atual de 11 | — | **a S6 só começa quando ela encerrar** |
| **Folga da S6** | tarefas que faltam à S7 | 11 | metade do prazo total é essa espera |
| **Projeção do fim** | S7 restante + 11 da S6 | 22 unidades | a unidade é a tarefa, não a hora |

---

## 5. Quadro por sessão

| Sessão | Estado | Tarefa | Último commit | Frescor | Portão | Bloqueio |
|---|---|---|---|---|---|---|
| S7 Studio | rodando | — de 11 | — | — | — | — |
| S3 Moderação | rodando | — de 11 | — | — | — | — |
| S1 Admin | aguardando | 0 de 11 | — | — | — | `tipos-acesso.ts` sem commit |
| S5 Editor | aguardando | 0 de 10 | — | — | — | split sem commit |
| S6 Organização | aguardando | 0 de 11 | — | — | — | S7 em curso |
| S2 Gestor | aguardando | 0 de 10 | — | — | — | nenhum — pode liberar |

---

## 6. O que mudou nesta varredura

As notas das entregas novas, copiadas dos `estado/S*.md`. É o que você lê para saber **o
que** foi feito, sem abrir código.

| Sessão | # | Tarefa | Nota |
|---|---|---|---|
| — | — | — | — |

---

## 7. Precisa de você

Só o que não se resolve entre sessões: pedido que muda a ontologia, decisão de produto,
conflito de escopo.

| Assunto | Quem pediu | Desde |
|---|---|---|
| `admin.css` não existe — a S1 precisa na tarefa 1 | — | 25.08 |
| árvore com 54 arquivos sem commit | — | 25.08 |
| `cursos.css` deixa o portão vermelho para todas | — | 25.08 |

---

## Como a sessão de controle calcula

```bash
# frescor por sessão
git log -1 --format='%h %cr' -- "src/app/(bastidor)/admin"

# árvore suja
git status --short | wc -l

# invasão de território
git status --short | grep -v "<pasta da sessão>"

# divergência: cruzar as linhas com hash dos estado/S*.md contra git log
```
