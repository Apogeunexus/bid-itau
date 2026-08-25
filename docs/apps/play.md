# Play — funcionalidades

**Rota** `/play` e `/play/[slug]` · **Componente** `src/componentes/play.tsx` (749 linhas) ·
**Dados** `src/dados/play.ts` · **Inventário** [telas.md](../telas.md) telas 19 e 20 ·
**Camada de corte** C2

**Acervo hoje:** 113 itens de streaming em 8 prateleiras. O catálogo bruto tem 529 mídias;
as outras 416 são áudio e vivem no [Cast](cast.md).

## O que este app é

A vitrine de streaming do acervo, no molde de Netflix e Apple TV: peça de destaque
sangrando no topo, prateleiras horizontais, cartaz em pé, e troca de fileira para grade
quando alguém escolhe um recorte.

**Ele sustenta dois argumentos da proposta ao mesmo tempo:** o da gratuidade e o da escala
nacional onde não há equipamento cultural. É a resposta para as regiões que o mapa de
desertos mostra vazias — quando não há teatro na cidade, o que existe é isto.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 25 | Catálogo unificado: vídeo, podcast, série, playlist | ★ | **no ar** — 113 itens, 8 prateleiras |
| 26 | Player com retomada de onde parou | ★ | **não sustentada** — ver abaixo |
| 27 | Exposição virtual e tour virtual como item navegável | | **falta** — vive no [Museu](museu.md) |
| 28 | Play conectado ao evento ("não pode ir? veja isto") | ★ | **não sustentada** — ver abaixo |
| 29 | Legenda, libras e audiodescrição como filtro | | **parcial** — ver abaixo |
| 30 | Download e modo offline — baixa banda, escala nacional | | **falta** |

## As três que não se sustentam, e por quê

**26 — retomada.** O acervo não guarda posição de reprodução. O rótulo da fileira era
«continue de onde parou» e virou **«Já concluídas»**, porque prometer retomada sobre um
dado que não existe é escrever na tela algo que o produto não pode cumprir. Para a
funcionalidade existir de verdade é preciso um evento de progresso por pessoa e por mídia —
que é infraestrutura de produto, não de acervo.

**28 — ponte com evento.** «Não pode ir? veja isto» é sustentado por **14 das 529 mídias**.
A relação que o acervo publica liga mídia a outra mídia, quase nunca mídia a evento. O
painel existiu e **saiu do catálogo em 23/08**: uma prateleira que cobre 2,6% do acervo
anuncia uma ponte que quase nunca está lá.

**29 — filtros de acessibilidade.** As dimensões estão medidas e a contagem é esta:

| Dimensão | Itens |
|---|---|
| Libras | 3 |
| Audiodescrição | 0 |
| Legenda descritiva | 0 |
| Closed caption | 0 |
| Legenda aberta | 0 |
| Tradução simultânea | 0 |
| Estenotipia | 0 |

**Sete das oito dimensões estão zeradas.** O filtro existe e funciona; o que não existe é o
dado para ele recortar. A tela declara o número em vez de esconder o filtro — é a diferença
entre um produto que mente por omissão e um que mostra o tamanho do buraco.

## O que falta construir

1. **Progresso de reprodução** (26) — modelo de dados novo, por pessoa e por mídia.
2. **Download e offline** (30) — a funcionalidade que mais importa para escala nacional em
   banda ruim, e a que não tem nenhuma linha escrita.
3. **Acessibilidade no acervo** (29) — não é trabalho de front-end: é anotação de mídia na
   origem. Enquanto não houver, o filtro segue recortando sobre 3 itens.

## Ligações com outros apps

- **[Cast](cast.md)** — mesma base de 529 mídias, cortada por tipo.
- **[Museu](museu.md)** — as exposições virtuais que a funcionalidade 27 pede.
- **[Acontece](acontece.md)** — a ponte da funcionalidade 28, quando o acervo a sustentar.
