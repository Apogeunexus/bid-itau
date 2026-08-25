# Prompt — S1 · Admin

Cole numa sessão nova, com o diretório em `agenda-cultural-br2`.

---

Você vai construir a **S1 · Admin** — o painel de governança do `agenda-cultural-br2`,
proposta ao RFP da Fundação Itaú / Itaú Cultural.

## Leia primeiro, nesta ordem

1. **`.planning/sessoes/PROTOCOLO.md`** — as regras das seis sessões: como se identificar,
   como atualizar o seu estado, concorrência, fila de build, e a falha conhecida que não é sua
2. **`.planning/sessoes/ONTOLOGIA-E-ACESSOS.md`** — a análise ontológica compartilhada
3. **`.planning/sessoes/S1-ADMIN.md`** — o seu PRD. **As seções 1 e 2 são a análise
   ontológica específica do Admin** — leia antes das telas
4. `src/dados/duplicatas.ts`, linhas 84–120 — o comentário de `LIMIAR_PROBABILISTICO`.
   **É o padrão que a sessão inteira copia**
5. `src/dados/gerado/meta.json`, `src/dados/geo.ts`, `src/dados/redacao.ts`
   (`LIMITES_DA_IA`) — o que o Admin governa

O seu arquivo de estado é **`.planning/estado/S1.md`**.

## Espere a liberação

A sua tarefa 6 depende de `tipos-acesso.ts` **commitado** pela S7. A sessão de controle
avisa quando a condição fechar. Confira em `.planning/PAINEL.md` antes de começar.

## Comece pela A2, não pela A1

A tela do motor fixa o padrão visual — valor atual, alternativo medido, o que custaria, o
que ganharia — que as outras nove copiam. Fazer papéis primeiro parece natural e é um erro:
sem o padrão estabelecido, as telas de parâmetro viram número solto e você reescreve tudo.

O material já existe pronto: `LIMIAR_PROBABILISTICO = 0,65`, alternativo medido 0,60,
103 pares em vez de 51, **zero clones a mais**.

## Três coisas que você não pode violar

- **Admin não é exceção de procedência.** Toda escrita grava autor, inclusive a dele. A A7 é
  a única tela do painel **sem nenhuma ação de escrita**: ele lê a trilha e não a apaga
- **Não existe apagar em lugar nenhum.** Existe suspender com rastro
- **Todo parâmetro exibido tem custo medido, ou declara que não foi medido.** O tipo
  `ParametroDoMotor` deve obrigar esse campo

## Segregação

O Admin **concede** papel de moderador e **não decide na fila** — é a S3. **Aprova** promoção
de linguagem e **não promove** — é a S5. Observa **o sistema**; quem observa **o público** é
a S2. As telas declaram esses recortes.

## Restrições

Seção 13 da ontologia e seção 3 do PRD:

- **DP-F** — as telas de observabilidade alcançam `meta.json` e o grafo inteiro. Achate no
  servidor; nenhum `"use client"` importa módulo de dados por valor
- **Sem relógio.** O frescor exibido é `geradoEm: "2026-08-22"`
- **Duas visões, um componente.** `desk:` é `[data-view="web"]`, não media query
- **`coordenada.procedencia` é sempre `derivado`.** A A3 edita a tabela de referência, não a
  coordenada da entidade

## Antes da tarefa 1

`src/estilos/admin.css` e o `@import` em `globals.css` podem já existir. **Se existirem, não
toque em `globals.css`.** Se não, crie os dois na primeira tarefa e **commite sozinha**.

## Sua pasta

`(bastidor)/admin/`, `componentes/admin-*`, `src/dados/admin.ts`, `src/estilos/admin.css`.

## Ordem

Seção 10 do PRD — 11 tarefas. Tarefas 4, 5 e 8 são independentes entre si.

## Ao fim de CADA tarefa — não só no fim da sessão

Este é o ritual que mantém a sessão de controle informada. Ele não é opcional e não é só
para marcos: é **a cada tarefa concluída**, nas quatro etapas, nesta ordem.

1. **`npm run checar`** verde — nunca `npm run build`, que é pela fila
2. **Commit atômico**, só os seus arquivos, mensagem curta em português
3. **Atualize `.planning/estado/S1.md`**:

```markdown
estado: rodando
tarefa: 3 de 11

## Entregas
| # | tarefa | commit | quando | nota |
|---|---|---|---|---|
| 3 | A2 motor | a1b2c3d | 25.08 21:10 | 4 parâmetros, 2 com custo medido, 2 declarados sem medição |
```

4. **Registre bloqueio ou pedido de contrato**, se houver, no mesmo arquivo

**A nota é obrigatória** — uma linha sobre o que foi feito, o que ficou de fora ou o que
surpreendeu. É por ela que a coordenação reporta sem abrir o seu código.

**Uma entrega só existe com hash de commit.** Sem hash, a sessão de controle lê como não
feita — e sessões que dependem de você continuam bloqueadas.

O que a coordenação sabe de você é **exatamente o que está nesse arquivo**. Nada mais.
