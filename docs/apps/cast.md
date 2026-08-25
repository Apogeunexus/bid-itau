# Cast — funcionalidades

**Rota** `/cast` · **Componente** `src/componentes/cast.tsx` (542 linhas) ·
**Dados** `src/dados/cast.ts` · **Inventário** ausente — nasceu na reformulação de 2026-08

**Acervo hoje:** 336 podcasts, 12 prateleiras, 13 linguagens.

## O que este app é

O app de áudio do acervo, no molde do Spotify. É a mesma decisão que transformou o Play em
vitrine, no vocabulário certo para som.

**O problema que ele resolve:** a tela anterior era uma grade única de 336 capas em ordem de
publicação. Era honesta — nada escondido, nada cortado — e mesmo assim não respondia «o que
tem aqui». Ninguém descobre que Mekukradjá tem 71 episódios rolando uma parede de capas.

**Três portes de fileira, e a regra é TAMANHO, não gosto** — curadoria fabricada é o que
este projeto não faz:

- **destaque** — a maior fileira do acervo, em painel próprio, com o trilho de episódios dentro
- **trilho** — o padrão, fileira horizontal de capas em 3:2
- as demais, no porte que o tamanho da série pedir

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 25 | Catálogo unificado | ★ | **no ar** — 336 itens, recorte de áudio das 529 mídias |
| 26 | Player com retomada | ★ | **não sustentada** — o acervo não guarda posição de reprodução |
| 29 | Legenda, libras e audiodescrição como filtro | | **falta** — não medido para áudio |
| 30 | Download e modo offline | | **falta** — e é onde mais faz falta: podcast é o formato que mais se ouve sem rede |
| 38 | Conteúdo ligado a entidades do grafo | ★ | **parcial** — a série tem linguagem; episódio a episódio, não |

## O que falta construir

1. **Transcrição de episódio.** Não está no catálogo de 86 funcionalidades, e devia estar:
   é o que torna podcast buscável no índice único (78) e acessível a quem não ouve.
2. **Download e offline** (30).
3. **Ligação episódio ↔ entidade** (38) — hoje a amarração é por série.

## Ausências declaradas

O acervo publica série, episódio, capa e linguagem. **Não publica** duração, transcrição,
participantes como entidade, nem marcação de acessibilidade. Nenhuma dessas quatro é
inventada na tela.

## Ligações com outros apps

- **[Play](play.md)** — mesma base de mídias, cortada por tipo.
- **[Buscar](buscar.md)** — os 336 entram no índice único de 5.092 entidades.
