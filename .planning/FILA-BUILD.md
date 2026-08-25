# FILA DE BUILD

`out/` é diretório único e **fixo no código do Next** (`configOutDir = 'out'`, sem opção de
configuração quando `output: "export"`). Duas builds simultâneas se corrompem.

`.next/` **já é por sessão** — `NEXT_SESSAO=s7 npx next dev -p 3007`. O problema é só o `out/`.

**Portão por tela é `npm run checar`** (`tsc --noEmit` + `verificar-ds`), que não toca em
diretório compartilhado e pode rodar a qualquer momento. `npm run build` completo é raro:
um por sessão, no fim. A fila tem 6 entradas no total, não 64.

> **Só a sessão de controle escreve neste arquivo.**

---

## Em execução

| Sessão | Desde | Prazo de devolução |
|---|---|---|
| — | — | — |

**Se a sessão em execução não responder, o painel devolve a vez para a fila.** Sessão que
some não segura o build de todo mundo.

---

## Aguardando

| Ordem | Sessão | Pediu em |
|---|---|---|
| — | — | — |

---

## Concluídos

| Sessão | Resultado | Commit | Quando |
|---|---|---|---|
| — | — | — | — |

---

## Protocolo

```
sessão  →  painel:  "peço vez de build — S5, tarefa 10"
painel  →  sessão:  "sua vez. rode `npm run build` e me avise o resultado"
sessão  →  painel:  "build verde, commit a1b2c3d"   |   "build vermelho: <erro>"
painel  →  próxima: "sua vez"
```
