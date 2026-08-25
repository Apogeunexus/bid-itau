# Notícias — funcionalidades

**Rota** `/noticias`, `/noticias/[secao]` e `/materia/[slug]` ·
**Componentes** `noticias.tsx` (359 linhas), `noticias-editorias.tsx`, `materia.tsx` ·
**Dados** `src/dados/leituras.ts` · **Inventário** ausente — nasceu na reformulação de 2026-08

**Acervo hoje:** 1.805 leituras.

## O que este app é

A capa editorial, na forma de um jornal: manchete, laterais e cadernos.

**A escolha do que entra em cada porta é ORDEM DE PUBLICAÇÃO, nunca curadoria inventada** —
o mesmo compromisso do destaque do Play. Um protótipo que fabricasse hierarquia editorial
estaria mostrando à banca uma decisão que ninguém tomou.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 38 | Matéria, coluna e entrevista ligadas a entidades do grafo | ★ | **no ar** — a ligação é aresta, não etiqueta |
| 39 | Especiais como trilha curada (Ancestralidade, Arte e Acesso, Mekukradjá) | | **parcial** — trilha existe; especiais nomeados, não |
| 40 | «Aprofunda isto» a partir de qualquer evento ou obra | ★ | **no ar** — é a aresta do editorial vista do outro lado |
| 41 | Publicações e pesquisas com leitor próprio | | **parcial** — a publicação tem página, mas cai em `/materia/[slug]`; leitor próprio, não existe |

## O que falta construir

1. **Especiais nomeados** (39) — o acervo tem os conteúdos; falta o agrupamento editorial.
2. **Leitor de publicação** (41) — não há rota `/publicacao`: `rotas.ts` manda publicação
   para `/materia`, a mesma página de matéria. Pesquisa e matéria de capa lidas no mesmo
   molde é o que a funcionalidade 41 existe para separar.
3. **Calendário editorial** (70) — vive na Redação, e amarra o que entra na capa.

## Ausências declaradas

O acervo publica título, resumo, data, capa e crédito. **Não publica** autoria como entidade
do grafo — o que impede uma página de colunista de existir sem inventá-la.

## Ligações com outros apps

- **[Descobrir](descobrir.md)** — a vitrine «Conteúdo para inspirar» sai daqui.
- **Redação** — é de lá que sairia o calendário editorial.
