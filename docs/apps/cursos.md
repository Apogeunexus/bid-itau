# Cursos — funcionalidades

**Rota** `/cursos` e `/cursos/[slug]` · **Componentes** `cursos.tsx` (455 linhas), `curso-ficha.tsx` ·
**Dados** `src/dados/cursos.ts` · **Inventário** ausente — nasceu na reformulação de 2026-08

**Acervo hoje:** 54 cursos, com formatos, linguagens e marcação de acessibilidade.

## O que este app é

A vitrine de formação, na forma de um catálogo de escola digital: busca no alto, categorias
com capa, cartão 16:9, saída na fonte.

**A cara é deste design system, não a da referência.** O que a referência teria de nota,
preço e «mais vendido» não entra — **o acervo não declara nenhum dos três**.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 42 | Cursos e formações | | **no ar** — 54 itens |
| 43 | Biblioteca — consulta ao acervo bibliográfico | | **falta** |
| 44 | Agendamento de visita e visita educativa | ★ | **falta** — e é MVP |
| 45 | Área do educador com material didático | | **falta** |

**Três das quatro funcionalidades de Formação não existem, e uma delas é MVP.** É o app com
a maior lacuna proporcional do hub.

## O que falta construir

1. **Agendamento de visita** (44) — MVP, sem nenhuma linha escrita. Exige calendário de
   disponibilidade da instituição, que é dado que o Studio precisaria produzir.
2. **Biblioteca** (43) — depende de acervo bibliográfico que não está ingerido.
3. **Área do educador** (45) — exige perfil com papel, que o modelo de identidade suporta mas
   nenhuma tela usa.

## Ausências declaradas

Nota, preço e ranking de popularidade **não existem no acervo** e não são fabricados. A
acessibilidade é declarada por curso e aparece na ficha.

## Ligações com outros apps

- **[Museu](museu.md)** — a visita educativa (44) é a ponte entre os dois.
- **[Buscar](buscar.md)** — os 54 cursos entram no índice único.
