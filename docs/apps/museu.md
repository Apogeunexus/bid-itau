# Museu virtual — funcionalidades

**Rota** `/museu`, `/museu/exposicoes` e `/museu/[slug]` ·
**Componentes** `museu.tsx` (251 linhas), `exposicao-permanente.tsx` ·
**Dados** `src/dados/museu.ts` · **Inventário** ausente — nasceu na reformulação de 2026-08

## O que este app é

O hub do museu virtual: abertura com as três portas, mosaico de cartazes e a lista dos
espaços-museu.

**As duas exposições permanentes da sede abrem a página** — Olavo Setubal e Herculano Pires.
São o destaque, não um item da lista da Enciclopédia.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 27 | Exposição virtual e tour virtual como item navegável | | **parcial** — a exposição é navegável; tour virtual, não |
| 31 | Página de Artista: papéis, obras, movimentos, eventos vinculados | ★ | **no ar** — `/artista/[slug]` |
| 32 | Página de Obra com suas expressões e montagens | ★ | **no ar** — `/obra/[slug]` |
| 33 | Página de Movimento e Linguagem | | **parcial** — linguagem sim, movimento não |
| 34 | Verbete embutido no fluxo, não link para fora | ★ | **no ar** — `/verbete/[slug]`, 481 páginas exportadas |
| 35 | Acervo e coleção com mídia | | **parcial** |
| 36 | Linha do tempo e mapa de influências | | **falta** |
| 37 | Reconciliação de artista ingerido com verbete | ★ | **no ar** — Studio, deduplicação em dois estágios |

## Decisões que o documento precisa registrar

**As fachadas dos espaços vêm da Wikimedia Commons, não do acervo.** O Itaú Cultural não
publica imagem de espaço. A origem está declarada em cada capa, e não é apresentada como
acervo.

**O que a referência de desenho inventava não atravessou:** data de encerramento em ocupação
que não a declara, e o rótulo «online» sobre ocupação presencial. Os dois foram descartados
por não terem lastro.

**Os chips não recortam a grade.** A referência pintava «Exposições» como ativo e mesmo
assim mostrava ocupações embaixo: são atalhos, não filtro. Recortar de verdade esconderia o
cartaz de abertura.

## O que falta construir

1. **Tour virtual** (27) — a exposição é navegável, mas não há percurso.
2. **Linha do tempo e mapa de influências** (36) — o grafo tem as arestas e as datas; falta a
   tela que as desenha. É a funcionalidade com maior distância entre dado pronto e produto.
3. **Página de movimento** (33).

## Ligações com outros apps

- **[Play](play.md)** — a funcionalidade 27 é a fronteira entre os dois.
- **[Buscar](buscar.md)** — verbetes e obras entram no índice único.
- **[Acontece](acontece.md)** — ocupações têm vigência e aparecem na agenda.
