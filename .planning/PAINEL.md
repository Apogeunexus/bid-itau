# PAINEL — a sessão de controle

> **Só a sessão de controle escreve neste arquivo.** As sessões de trabalho escrevem em
> `estado/S<n>.md`, uma cada, e nunca aqui.
>
> ⚠ **Este arquivo já foi sobrescrito uma vez, em 25.08 ~21:00, pela S7** — o prompt antigo
> dela mandava criar um `PAINEL.md` e ele já existia. Ela desfez com `git checkout --`, o que
> restaurou a versão de `6bedf92` e **apagou a varredura das 21:05**, que ainda não estava
> commitada. Daí a regra nova: **a sessão de controle commita o `.planning/` ao fim de cada
> varredura.** O que não está em commit não sobrevive ao `checkout` de outra sessão.

Contexto: [`sessoes/ONTOLOGIA-E-ACESSOS.md`](sessoes/ONTOLOGIA-E-ACESSOS.md) ·
Tarefas: [`TAREFAS.md`](TAREFAS.md) · Estado: [`estado/`](estado/) ·
Protocolo: [`sessoes/PROTOCOLO.md`](sessoes/PROTOCOLO.md)

---

## 1. Legenda — nome de mensagem por papel

**Confirmada pelas próprias sessões**, não deduzida. `ListAgents` devolve 26 sessões nesta
máquina, todas com nome autogerado `bid-ita-XX`; o rótulo da aba não aparece lá. A ligação
saiu do registro de sessões (`~/.claude/sessions/<pid>.json` → `name` + `sessionId`) cruzado
com o título de aba gravado no transcript, e cada sessão confirmou o próprio nome por
mensagem.

| Sessão | Nome de mensagem | Rótulo da aba | `sessionId` | Pasta |
|---|---|---|---|---|
| S7 · Studio · Produtor | `bid-ita-63` | `Onda 1 - 1/2 studio` | `2568b200` | `(bastidor)/studio/` |
| S3 · Moderação | `bid-ita-68` | `Onda 1 - 2/2 Moderador` | `cd4f78ef` | `(bastidor)/moderacao/` |
| S1 · Admin | `bid-ita-d4 [06717d]` | `Onda 2 - 1/4 Admin` | `832f9a67` | `(bastidor)/admin/` |
| S5 · Editor / Curador | `bid-ita-7d [b1187f]` | `Onda 2 - 2/4 Editor` | `c531bca6` | `(bastidor)/redacao/` |
| S6 · Organização | `bid-ita-53 [913196]` | `Onda 2 - 3/4 Organização` | `d7d61893` | `(bastidor)/studio/` |
| S2 · Gestor / Observatório | `bid-ita-53 [7ad229]` | `Onda 2 - 4/4 Gestor` | `17f34a82` | `(bastidor)/observatorio/` |

**S6 e S2 dividem o nome `bid-ita-53`.** Mande sempre com o `[ref]`: o nome cru cai numa das
duas sem garantia de qual.

Fora das seis, com trabalho neste repositório: `bid-ita-30` (`0- Adjacencias da aplicação`,
`7d0322e8`) — a sessão que escreveu os PRDs, o protocolo e o gerador do painel. Não é sessão
de bastidor e não entra na coordenação.

---

## 2. Estado agregado

Lido de `estado/S<n>.md`, cruzado com `git log`. As seis se identificaram.

| Sessão | Estado | Tarefa | Última entrega | Nome gravado |
|---|---|---|---|---|
| S7 | rodando | 2 de 11 (P2 identidade, plano à espera de confirmação) | `73976b8` | ✅ |
| S3 | rodando | 2 de 11 (M1 fila, plano à espera de confirmação) | `e7ed486` | ✅ |
| S1 | aguardando | 0 de 11 | — | ✅ |
| S5 | aguardando | 0 de 10 | — | ✅ |
| S6 | aguardando | 0 de 11 | — | ✅ |
| S2 | aguardando | 0 de 10 | — | ✅ |

**Progresso: 2 de 64 tarefas com commit.**

Commits das sessões nesta varredura:

| Commit | Quem | O quê |
|---|---|---|
| `73976b8` | S7 | `tipos-acesso.ts` + `mock/seed.ts` + `studio-estado.ts` — **destrava a S1** |
| `d613753` | S7 | `estado/S7.md` preenchido |
| `9f9383d` · `83ca63b` | S3 | `estado/S3.md` preenchido, hash sem crases |
| `e7ed486` | S3 | split de `redacao.ts` — **destrava a S5** (anterior a esta varredura) |

---

## 3. Fila de liberação

A condição é **sempre um commit**, nunca um arquivo no disco.

| Sessão | Libera quando | Estado da condição |
|---|---|---|
| **S2** Gestor | imediato — sem dependência | 🟢 **LIBERADA 25.08 21:35** |
| **S5** Editor | split de `redacao.ts` commitado pela S3 | 🟢 **LIBERADA 25.08 21:35** — `e7ed486` |
| **S1** Admin | `tipos-acesso.ts` commitado pela S7 | 🟢 **LIBERADA 25.08 21:35** — `73976b8` |
| **S6** Organização | S7 com `estado: encerrada` | ⏳ S7 na tarefa 2 de 11 |

**Cinco das seis em curso.** A S6 é a única parada, e continua parada por desenho: ela divide
`(bastidor)/studio/` com a S7 e as duas **nunca** trabalham ao mesmo tempo.

Cada liberação levou o `PROMPT-S<n>.md` inteiro mais o que mudou desde que o prompt foi
escrito — a S1 soube que `tipos.ts` não foi editado, a S5 soube o que herdou do split, a S2
soube do `EXIT=0` mentiroso do build.

---

## 4. Pedidos de contrato abertos

| Quem | O quê | Para quem | Estado |
|---|---|---|---|
| S3 | **PEDIDO-03** · `DecisaoDeModeracao` em `tipos-acesso.ts`; `Delegacao`, `FamiliaDeSimilaridade` e `OrigemDoItem += "denuncia"` podem ficar em `moderacao.ts` | S7 | ⏳ **roteado, sem resposta** — S3 segue com definição local, migração vira troca de import |
| S3 | **PEDIDO-04** · `scripts/medidas.mjs` não mede as 9 telas da S3 e, por §6, não é dela | humano | ⏳ sobe para o humano |
| S7 | **PEDIDO-01** · consolidar em `tipos.ts` as 5 adições que hoje vivem em `tipos-acesso.ts` | humano | ⏳ higiene, não desbloqueio |

**Aviso à S1 antes de consumir o contrato:** `tipos.ts` **não foi editado**. As adições que
o §12 da ontologia pede entraram por extensão aditiva dentro de `tipos-acesso.ts`
(`Situacao`, `EntidadeClassificada`, `OcorrenciaDeclarada`, `ProcedenciaDePapel`). As duas
formas convivem sem quebrar.

---

## 5. Território — o que passou e o que não passa

### 5a. Invasão já commitada — decisão do humano, não minha

**`e7ed486`, da S3, toca 9 arquivos fora da pasta dela.** Conferido no git, não na palavra
da sessão: `menu-lateral.tsx`, `apps.ts`, `observatorio/page.tsx`, `verificar-fase2/3/4/5.mjs`,
`verificar-tema.mjs`, `capturar-telas.mjs`, `verificar-ds.mjs`, além de uma linha em
`globals.css`.

Três fatos que mudam a leitura:

1. O commit é **anterior** ao §6 — `59f2e26` está acima dele no `git log`
2. A S3 perguntou ao dono do projeto antes, com três opções na mesa, e ele escolheu
   «atualizo links e suítes»
3. **Nada do app público foi tocado** — nenhum arquivo em `src/app/(app)/`

Desfazer custa 3 links em 404 (`menu-lateral.tsx:91`, `apps.ts:335`,
`observatorio/page.tsx:76`) e deixa `/moderacao/fila/` inalcançável pelo menu.

**Não revertido, por regra.** A S3 declarou em vez de esconder, e está proibida de mexer até
a decisão chegar.

### 5b. Invasões da S7, anteriores ao protocolo, já desfeitas ou encerradas

Declaradas por ela mesma:

- **Sobrescreveu este `PAINEL.md`** e desfez com `git checkout --`. Restaurou `6bedf92` e
  levou junto a minha varredura das 21:05, que não estava commitada
- **Matou o `next dev`** (PID 80190) por volta das 19:2x, autorizada na hora, antes de
  existir servidor por sessão
- **Rodou `npm run build` duas vezes por conta própria e apagou `.next`.** Os dois morreram —
  `ENOENT` no primeiro, SIGKILL no segundo, no mesmo minuto em que outro `next build`
  (PID 36486) começava. Era exatamente a corrupção que o §4 existe para evitar

Ela declarou que não repete e que passa a pedir a vez.

### 5c. Sujeira na árvore, e de quem é

| Caminho | Situação | Território |
|---|---|---|
| `scripts/verificar-fase2.mjs` | ` M` 19:44 | ⛔ **proibido** — é do humano, não de sessão |
| `scripts/verificar-fase5.mjs` | ` M` 19:44 | ⛔ **proibido** — é do humano, não de sessão |
| `tsconfig.json` | ` M` 20:38 | infra — só a sessão de controle |
| `.next-ver/` | `??` | dev por sessão; falta no `.gitignore` |

As duas suítes **não são invasão de bastidor**: o diff é a reformulação das telas do próprio
humano — «REFORMULAÇÃO 2026-08 (decisão do cliente)», «as contagens saíram da tela
(2026-08-25, pedido do cliente sobre a tela do Play)», e a inversão do portão D-29 sobre a
nota de curadoria. São os portões que acompanham `59f2e26` e ficaram de fora dele. **Não
commitados por ninguém, não revertidos por mim.** As seis foram avisadas de que `git checkout
--` nesses três apaga trabalho que não está em commit nenhum.

| | Estado |
|---|---|
| App público travado em `59f2e26` | ✅ commitado, nenhuma sessão tocou depois |
| `src/estilos/admin.css` + `@import` | ❌ não existe — a S1 faz na tarefa 1 |
| `src/estilos/moderacao.css` | ✅ criada pela S3 |
| `npm run checar` | ❌ vermelho por `cursos.css` — sujeira anterior, as seis avisadas |
| Legenda de nomes | ✅ confirmada pelas seis |

---

## 6. Divergências que valem para todos

- **`npm run build | tail` devolve `EXIT=0` mesmo quando o Next falha** (S3, DIV-S3-03).
  Duas execuções morreram sem o pipe acusar. Portão de build se lê por arquivo e pelo `EXIT`,
  nunca por pipe. Com um `next dev` disputando CPU, as páginas estouram 60 s e o build cai;
  um build completo levou ~50 min
- **O bastidor não tem visão app** (S7 DIV-01, S3 DIV-S3-02). Tudo roda sob `app:hidden`
  (`src/app/(bastidor)/layout.tsx:16`) com `AvisoDesktop`. As seções «App.» dos PRDs estão
  fora de escopo, por decisão do dono do projeto
- **`TETO_DO_DTO` media duas telas que nunca viajaram juntas** (S3, DIV-S3-01). Separadas:
  `/moderacao/fila` 39.590/61.440, `/redacao/trilha` 17.431/61.440. O número do PRD (56.615)
  está 405 bytes desatualizado. O teto continua 61.440
- **`/redacao/trilha/` não tem entrada de menu nenhuma** — não tinha antes do `e7ed486` e
  continua sem. Herança para a S5

---

## 7. Registro de varreduras

Append, nunca reescrita.

| Quando | O que mudou |
|---|---|
| 25.08 19:20 | painel reestruturado; `estado/` e `TAREFAS.md` criados |
| 25.08 21:05 | *(perdida — sobrescrita pelo `git checkout` da S7; reconstituída na linha abaixo)* |
| 25.08 21:35 | S1, S5 e S2 liberadas por ordem do humano, com o prompt e os avisos de contexto; falso positivo do KPI de divergência corrigido em `3adea12` — era crase no hash da S7, não cabeçalho de tabela; `.next-*/` entrou no `.gitignore` |
| 25.08 21:30 | legenda das seis confirmada por elas mesmas, empate `bid-ita-53` desfeito; as seis notificadas do §6; S7 commitou `73976b8` e **destravou a S1**; três sessões com condição fechada e nenhuma liberada; invasão commitada da S3 (`e7ed486`) subida ao humano; invasões pré-protocolo da S7 registradas; árvore reavaliada — 3 arquivos sujos fora de território, todos do humano/infra |
