# Junção · `agenda-cultural-br2` × `tria-company/itau-cultural`

> Medido em 02.09.2026 com os dois repositórios em mãos. Nada aqui é estimativa.

## 1. Os dois têm história em comum

A `tria-company/itau-cultural` é um fork da `Apogeunexus/bid-itau`. A bifurcação é
**`8a0d475`** ("fix: as matérias sobem com o corpo", 28.08.2026).

| | |
|---|---|
| base comum | `8a0d475` |
| commits só aqui | **24** |
| commits só na tria | **51** |
| dependências | **idênticas** (Next 16.3.2, React 19.2.8, TS 5.9.3 — todas) |
| grafo | **idêntico** — 7.810 entidades, mesmos ids, mesma contagem por classe |
| `studio.css` | **idêntico**, byte a byte |

Isso significa que a junção é um `git merge`, não uma cópia de pastas. Os 259 arquivos que
não mudaram dos dois lados o git resolve sozinho.

## 2. O merge, simulado

`git merge-tree HEAD tria/main` → **10 conflitos, 15 hunks no total.** Todos pequenos:

| arquivo | hunks | linhas mudadas aqui | na tria |
|---|---|---|---|
| `src/app/(app)/evento/[slug]/page.tsx` | 2 | 143 | 265 |
| `src/app/(app)/meu/page.tsx` | 2 | 154 | 6 |
| `src/componentes/acontece.tsx` | 1 | 205 | 7 |
| `src/lib/pontos/tipos.ts` | 2 | 33 | 77 |
| `src/componentes/carteira.tsx` | 2 | 77 | 34 |
| `src/componentes/recompensas.tsx` | 1 | 14 | 83 |
| `src/componentes/recompensa-item.tsx` | 1 | 10 | 66 |
| `src/componentes/moderacao-fila.tsx` | 1 | 6 | 44 |
| `src/app/(app)/recompensas/page.tsx` | 2 | 4 | 6 |
| `scripts/verificar-ds.mjs` | 1 | 1 | 2 |

## 3. O que cada lado traz de exclusivo

### A tria traz — o Studio inteiro, e é o que motivou a junção

Hub `/studio/` (o dashboard do print, `src/componentes/produtor-painel.tsx`, 1.220 linhas) mais
34 rotas: `cast · catalogos · comercial · comunidade/* · curadoria · editorial · minha-loja ·
minha-loja/resgates · minhas-comunidades/* · museu · natureza · pautas · perfil · play ·
pontos · pontos/loja/*` e as dez da Organização sob `/studio/organizacao/*`.
São **22 componentes `produtor-*`**, **6 `comunidade-*`** e **4 `loja-*`**.

### Aqui traz — o Admin, e ele é maior

**10 telas temáticas**: auditoria · governança · IA · moderação · motor · observabilidade ·
papéis · território · titulares · vocabulário, com os 10 componentes `admin-*` e `dados/admin.ts`.

**A tria tem 4 rotas de admin** — a raiz, uma `[coisa]` dinâmica, `abrir` e `equipe`. São dois
desenhos diferentes de Admin, não duas versões do mesmo.

Mais 3 rotas do app público (`ia/cenario/[id]`, `meu/notificacoes`, `recompensas/catalogo`) e
`base/saida-para-parceiro`, `sino-de-avisos`, `perfil-cabecalho`, `notificacoes`,
`comunidade-guardadas`, `como-retirar`, `moderacao-chamados`, `dados/parceiros.ts`,
`dados/cenarios-ia.ts`, `lib/rotulos.ts`.

## 4. A duplicação que o merge cria

As dez telas da Organização vão existir em dois endereços depois do merge:

| tela | aqui | na tria |
|---|---|---|
| alcance · conformidade · equipe · instituição · integração | `/studio/<nome>` | `/studio/organizacao/<nome>` |
| editais · espaços · formação · mídia · programa | `/studio/<nome>` | **nos dois** — `/studio/<nome>` **e** `/studio/organizacao/<nome>` |

O hub da tria aponta para `/studio/organizacao/*`. A recomendação é ficar com o endereço da
tria e apagar os cinco duplicados de primeiro nível — mas isso é decisão, não consequência do
merge, e por isso vira passo próprio.

## 5. Ordem proposta

1. **Merge num branch dedicado, em worktree separado.** Este worktree tem outra sessão
   commitando (o `git add -A` dela já varreu arquivo meu uma vez hoje). Merge aqui vira briga.
2. `git merge tria/main` e resolver os 15 hunks. Regra: onde a tria mexeu mais, fica a tria
   (recompensas, moderação-fila, `lib/pontos/tipos.ts`); onde nós mexemos mais, ficamos nós
   (`acontece.tsx`, `meu/page.tsx`).
3. **Reconciliar as rotas da Organização** — decisão do passo 4 acima.
4. **Decidir o Admin**: as 10 telas daqui, as 4 de lá, ou as 10 daqui sob a navegação de lá.
5. `npm run checar` + `npm run build`, e a captura das telas-chave nas duas visões.
6. Só então trocar os KPIs do `produtor-painel.tsx` pelo mapa de `S9-SLOTS-DO-PAINEL.md`.

## 6. O que ainda não sei

- Qual dos dois Admin o cliente viu. As 10 telas daqui nunca foram ao ar em
  `itau-cultural.vercel.app`; o Admin de lá foi.
- Se as 51 commits da tria mexeram no motor de pontos de um jeito que invalide as regras daqui
  — `src/lib/pontos/tipos.ts` diverge em 110 linhas e é o único conflito de contrato.
