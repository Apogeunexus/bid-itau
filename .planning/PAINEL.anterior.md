# PAINEL — coordenação entre as 7 sessões de bastidor

Documento de troca entre sessões. **Uma linha por fato, com a evidência ao lado.**
Quem precisa de algo que não é seu escreve `PEDIDO` aqui e segue com mock local.

Contexto compartilhado: [`sessoes/ONTOLOGIA-E-ACESSOS.md`](sessoes/ONTOLOGIA-E-ACESSOS.md).

---

## 1. Estado das sessões

| Onda | Sessão | Pasta | Estado |
|---|---|---|---|
| 1 | **S7 · Studio · Produtor** | `(bastidor)/studio/`, `componentes/studio-*`, `estilos/studio*.css` | **em curso** — Fase 0 entregue |
| 1 | **S3 · Moderação** | `(bastidor)/moderacao/`, `componentes/moderacao-*`, `dados/moderacao.ts`, `estilos/moderacao.css` | **em curso** — tarefa 1 (separação de território) entregue |
| 2 | S1 · Admin · S5 · Editor · S6 · Organização · S2 · Gestor | — | não iniciadas |
| 3 | S4 · Moderador com escopo | — | não iniciada |

**S6 e S7 dividem a pasta `(bastidor)/studio/`** e não rodam em paralelo (§14 da ontologia).

---

## 2. Fase 0 — o contrato compartilhado

Escrito pela S7 em 25.08.2026. **A S3 herda isto e não o redeclara.**

| Arquivo | O que traz |
|---|---|
| `src/dados/tipos-acesso.ts` | `Situacao`, `ProcedenciaDePapel`, `Porta` e as três portas, `RascunhoDoProdutor`, as adições de §12, a cadeia de identidade em três níveis, `scoreDoRascunho`, `pendenciasDoRascunho`, `conversaoDoEnvio`, `CHAVE_DE_ARMAZENAMENTO` |
| `src/dados/mock/seed.ts` | **servidor**: `catalogoDoStudio()` (DTO de primitivo) e `rascunhosSemeados()` (5 registros determinísticos) |
| `src/componentes/studio-estado.ts` | **cliente**: `useStudio()` — `localStorage` sob `studio.v1`, leitura só em `useEffect`, reinício |

### Regras que a Fase 0 impõe a quem a consumir

1. **`tipos-acesso.ts` pode ser importado por valor no cliente.** Nenhum import de dado sai
   dele — só `normalizar`, que é função de string. Manter assim é requisito de DP-F.
2. **`mock/seed.ts` é módulo de servidor.** Cliente importa **apenas por tipo**.
3. **Chave de identidade tem sempre três componentes próprios por nível.**
   `partesDaChave()` conta, e a etiqueta do nível não entra na conta.
   Medido na semente: rascunhos em `2/3`, devolvido e publicados em `3/3`.
4. **Procedência é carimbo, nunca campo.** `PROCEDENCIA_DO_PRODUTOR` é constante.
5. **Sem `Math.random()` e sem `new Date()`** em nenhum dos três arquivos.
   Verificado: `rascunhosSemeados()` roda duas vezes e devolve JSON idêntico.

### Medido na Fase 0 (25.08.2026)

```
registros semeados: 5 (2 rascunho · 1 devolvido · 2 publicado)
score: 58% · 67% · 75% · 100% · 100%
chave do evento: 2/3 · 2/3 · 3/3 · 3/3 · 3/3
catálogo: 792 agentes · 239 obras · 113 espaços · 33 linguagens · 94 temas · 300 eventos · 12 imagens
tamanho do catálogo como DTO: 201.751 bytes
determinismo entre duas execuções: true
```

---

## 3. PEDIDOS abertos

### PEDIDO-01 · consolidar as adições de §12 em `src/dados/tipos.ts`
**Quem pede:** S7 · **Para:** quem tiver a guarda de `tipos.ts` (Fase 0 consolidada).

`tipos.ts` é contrato de outra sessão e não foi editado. As cinco adições de §12 entraram
por **extensão aditiva** em `tipos-acesso.ts`:

| §12 pede | O que existe hoje |
|---|---|
| `Situacao` | `Situacao` em `tipos-acesso.ts` — tipo novo, sem conflito |
| `faixaEtaria` em `Entidade` | `EntidadeClassificada = Entidade & { faixaEtaria?: FaixaEtaria \| null }` |
| `canalIngresso` em `Ocorrencia` | `OcorrenciaDeclarada = Ocorrencia & CamposDeIngresso` |
| `inscricao` em `Ocorrencia` | idem |
| `"produtor"` em `Procedencia` | `ProcedenciaDePapel = Procedencia \| "produtor" \| "parceiro" \| "curador" \| "ia"` |

Nada quebra enquanto as duas formas convivem — toda extensão é opcional e aditiva. A
consolidação é higiene, não desbloqueio.

### PEDIDO-02 · `scripts/medidas.mjs` não mede as telas da S7
**Quem pede:** S7 · **Para:** quem tiver a guarda de `scripts/medidas.mjs`.

O portão 4 do PRD da S7 pede medida de pixel nas telas novas. `medidas.mjs` é arquivo
compartilhado e não foi tocado. As dez telas da S7 não entram na medição até que alguém as
acrescente lá.

---

### PEDIDO-03 · quatro tipos do contrato de moderação, para `tipos-acesso.ts`
**Quem pede:** S3 · **Para:** S7, que tem a guarda de `tipos-acesso.ts`.

§10 do PRD da S3 manda escrever estes quatro **em `tipos-acesso.ts`, não em `moderacao.ts`**,
porque a S7 também os consome — ela precisa exibir a devolução com o motivo que a moderação
escreveu. O arquivo é da S7 e estava **não commitado** (`?? src/dados/tipos-acesso.ts`) quando
esta sessão abriu, então a S3 **não o tocou**: segue com definição local em `moderacao.ts` e
migra assim que o pedido for atendido.

| Tipo | Campos | Quem lê do outro lado |
|---|---|---|
| `DecisaoDeModeracao` | ação, motivo, autor, carimbo, item, escopo | S7 — a devolução com motivo, na tela do produtor |
| `Delegacao` | quem, qual escopo, início, fim | ninguém fora da S3 (M8) |
| `FamiliaDeSimilaridade` | padrão de motivo, tamanho, método da amostra | ninguém fora da S3 (M4) |
| `OrigemDoItem += "denuncia"` | a quarta origem (funcionalidade 120) | ninguém fora da S3 |

Só o primeiro é de fato compartilhado. Os outros três podem ficar em `moderacao.ts` de vez,
se a S7 preferir manter `tipos-acesso.ts` enxuto — **diga qual das duas.**

---

## 4. Divergências entre PRD e código, já decididas

### DIV-01 · D-67 vence o §8.1 do PRD da S7 — o Studio não tem visão app
**Decidido em 25.08.2026 pelo dono do projeto. Vale para todas as sessões de bastidor.**

O PRD da S7 especifica layout de app nas dez telas. O código faz o oposto, por decisão
verificada:

- `src/app/(bastidor)/layout.tsx:16` — todo o bastidor sob `<div className="app:hidden">`,
  com `AvisoDesktop` no lugar
- `src/estilos/studio.css:9` — *"O Studio só existe na visão web (D-67)… não há aqui nenhuma
  regra sob `[data-view="mobile"]`"*
- `.planning/phases/04-camada-1-studio-e-o-roteiro/04-05-SUMMARY.md:209` — portão verificado:
  *"`/studio/duplicatas/` na visão app… conteúdo de bastidor visível: **false**"*

**Consequência:** as seções «App.» das telas da S7 estão **fora de escopo**. As telas se
escrevem só para a visão web, reusando o vocabulário de `web.css` (`.web-duas-colunas`,
`.web-colada`, `.web-painel`, `.web-declaracao`, `.web-denominadores`, `.web-lista-densa`).
Nenhum arquivo fora da pasta da S7 é tocado, e o portão de 04-05 segue verde.

### DIV-02 · `verificar-ds.mjs` já estava vermelho antes da S7
**Registrado em 25.08.2026, na primeira execução da sessão.**

```
39 verdes · 1 FALHA(S): cursos.css: só tokens
FALHA cursos.css: medido 11 medida(s) 0.35rem, 0.6rem, 1.1rem … · esperado 0 e 0
```

Vem do commit `4da75f5`, arquivo de outra sessão, fora da pasta da S7. **O critério de
pronto da S7 passa a ser «39 verdes e só a falha herdada do `cursos.css`».** Se o número de
falhas subir, a culpa é da S7.

---

### DIV-03 · a fila de moderação saiu de `redacao/` e levou 9 arquivos fora da pasta
**Feito em 25.08.2026 pela S3, na tarefa 1, com autorização explícita do dono do projeto.**

§3 do PRD da S3 manda separar a fila da Redação antes de construir, para a S5 não colidir na
onda 2. A rota `/redacao/fila/` era citada em **7 arquivos fora da pasta da S3**, e mover sem
tocá-los deixaria 3 links em 404 e derrubaria portões que já estavam verdes:

| Arquivo | O que mudou |
|---|---|
| `src/componentes/menu-lateral.tsx:91` | link e rótulo → `Moderação` |
| `src/dados/apps.ts:335` | idem |
| `src/app/(bastidor)/observatorio/page.tsx:76` | idem |
| `scripts/verificar-fase2.mjs` · `fase3` · `fase4` | string de rota na lista de páginas |
| `scripts/verificar-tema.mjs:82` · `capturar-telas.mjs:43` | string de rota |
| `scripts/verificar-fase5.mjs` | rota, os 3 atributos renomeados, os 2 arquivos movidos, e o DTO do catálogo, que passou a ser medido em separado |
| `scripts/verificar-ds.mjs` | `moderacao.css` entrou na lista de folhas migradas — sem isso a folha nova escapava do portão |

**Nenhum deles é da S7.** O que ficou dentro da pasta: `src/dados/moderacao.ts` (novo),
`(bastidor)/moderacao/fila/page.tsx`, `componentes/moderacao-fila.tsx`, `estilos/moderacao.css`.

**Consequência para a S5, na onda 2:** `redacao.ts` e `redacao.css` ficaram só com o editor de
trilha, e **nenhuma classe CSS é compartilhada** entre as duas folhas — a fila usa
`moderacao-*`, o editor segue em `redacao-*`. `redacao.ts` reexporta `CARIMBO_DA_DECISAO`,
`LIMITES_DA_IA` e `TETO_DO_DTO` de `moderacao.ts`, para a tela da trilha continuar importando
de um lugar só; `CURADOR_AUTORADO` continua em `redacao.ts`, porque o perfil da Redação e o da
Moderação são níveis de acesso diferentes.

**Pendência que a S5 herda, e que já existia:** `/redacao/trilha/` não tem entrada de menu
nenhuma — não tinha antes e continua sem. Quem chega lá digita a URL.

### DIV-04 · o `TETO_DO_DTO` media duas telas que nunca viajaram juntas
**Medido em 25.08.2026 pela S3.**

O portão media `JSON.stringify({ fila, cat: catalogo })` — a fila de moderação **mais** o
catálogo de arrasto do editor de trilha. As duas nunca foram para o mesmo navegador: a fila
serve `/moderacao/fila/`, o catálogo serve `/redacao/trilha/`. Somá-las media um payload que
não existe.

```
medida ANTIGA, hoje (fila + catálogo):   57.020 bytes   ← o PRD da S3 declara 56.615
depois do corte:
  /moderacao/fila   39.590 / 61.440   (margem 21.850)
  /redacao/trilha   17.431 / 61.440
```

Duas consequências. **O número do PRD está 405 bytes desatualizado** — a margem real antes do
corte era 4.420, não 4.825; o acervo mudou desde a medição. E **a margem da fila é maior do que
o PRD supõe**: 21.850 bytes, não 4.825. O teto continua sendo 61.440 e não sobe; o que mudou é
que cada superfície é medida contra o orçamento de uma página, que é o que ele sempre quis
dizer. `verificar-fase5.mjs` agora mede as duas linhas em separado.

### DIV-05 · `npm run build` não fecha com o `next dev` de outra sessão rodando
**Levantado em 25.08.2026 pela S3.**

Duas execuções seguidas morreram, e a segunda antes de qualquer alteração desta sessão:

```
Failed to build /(app)/verbete/[slug]/page: /verbete/capricho after 3 attempts.
Export encountered an error … exiting the build.
⨯ Next.js build worker exited with code: 1
```

```
Error: ENOTEMPTY: directory not empty, rmdir '.next/server/app/evento/…/$d$slug'
```

As páginas estouram o limite de 60 s por contenção de CPU, e o `ENOTEMPTY` é corrida no
`.next` compartilhado. Há um `next dev` de outra sessão vivo desde as 10h57 (pid 80190).
**`npm run build 2>&1 | tail` esconde isso**: o `next` reporta o erro e o pipe devolve `EXIT=0`.
Quem medir portão de build **redirecione para arquivo e leia o `EXIT`** — não use pipe.

---

## 5. Onde cada sessão pode escrever

| Sessão | Pastas |
|---|---|
| **S7** | `src/app/(bastidor)/studio/`, `src/componentes/studio-*`, `src/estilos/studio*.css`, `src/dados/tipos-acesso.ts`, `src/dados/mock/`, `scripts/verificar-studio.mjs` |
| **S3** | `src/app/(bastidor)/moderacao/`, `src/componentes/moderacao-*`, `src/dados/moderacao.ts`, `src/estilos/moderacao.css`, `scripts/verificar-moderacao.mjs` |

`src/app/globals.css` já traz os `@import` das três folhas de studio (linhas 50‑52) e
**não é tocado por mais ninguém**. CSS novo da S7 entra em `studio.css`.

**A S3 tocou `globals.css` uma vez, na tarefa 1**, para declarar a folha nova — uma linha
só (`@import "../estilos/moderacao.css";`, logo abaixo da de `redacao.css`), commitada
sozinha justamente para o conflito não existir. Ela não volta a esse arquivo.

---

## 6. Diário

| Data | Sessão | O quê |
|---|---|---|
| 25.08.2026 | S7 | DIV-01 e DIV-02 levantadas e decididas antes da primeira linha de código |
| 25.08.2026 | S7 | Fase 0 entregue: contrato, semente determinística, persistência, este painel |
| 25.08.2026 | S3 | DIV-03, DIV-04 e DIV-05 levantadas · PEDIDO-03 aberto |
| 25.08.2026 | S3 | Tarefa 1: `moderacao.ts`, `/moderacao/fila/`, `moderacao.css` e a linha em `globals.css` |
