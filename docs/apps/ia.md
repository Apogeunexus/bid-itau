# Roteiros com IA — funcionalidades

**Rota** `/ia` e `/ia/roteiro/[chave]` ·
**Componentes** `ia-conversa.tsx` (741 linhas), `entrevista-estrelinha.tsx` ·
**Dados** `src/dados/estrelinha.ts`, `roteiro.ts` · **Inventário** ausente — nasceu na
reformulação de 2026-08

## O que este app é

A entrevista desenhada como conversa: quatro peças — gosto, companhia, dias, cidade — e um
roteiro no fim.

**A ENTREVISTA NÃO COMPUTA NADA, e isso é a decisão mais importante deste app.** Cada
resposta completa vira o **endereço de uma página pré-computada**. O compositor e as
sugestões só preenchem as quatro peças; o artefato de «pensamento» é encenação com números
reais do acervo, e no fim a tela **navega**.

Não há modelo rodando, não há chamada de rede, não há resposta gerada em tempo real. O que a
tela promete é o que ela entrega.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 21 | Roteiro do dia equilibrando deslocamento e densidade | ★ | **no ar** — é a saída da conversa |
| 79 | Busca em linguagem natural traduzida em consulta estruturada e explicada | ★ | **no ar** — a conversa é a tradução, e ela é mostrada |
| 84 | Similaridade sempre com justificativa legível | ★ | **no ar** — herdado do motor de caminhada |
| 86 | Limites explícitos da IA: não publica, não define destaque, não escreve verbete | ★ | **no ar** — e é o que este app existe para provar |
| 69 | Revisão das sugestões da IA — human-in-the-loop | ★ | **no ar** — na Redação, não aqui |
| 82 | Ingestão com extração assistida por IA e score de confiança | ★ | **no ar** — no Studio, não aqui |
| 85 | Feedback do curador retroalimentando o modelo | | **falta** |

## O limite como funcionalidade

A funcionalidade 86 não é uma restrição sobre o produto — **é uma tela**. A IA daqui não
publica, não define destaque e não escreve verbete, e o app diz isso a quem usa. Num RFP
onde todo concorrente vai prometer IA, o diferencial defensável é dizer **onde ela para**.

## O que mudou em 2026-08-25

A capa do cartaz no hub deixou de ser o gradiente desenhado em CSS e passou a ser uma
ilustração (`/hub/roteiros-ia.jpg`). Ela **não é do acervo** — mora em `/hub/` e não em
`/acervo/`, e o campo `origem` diz «Peça de interface, fora do acervo do Itaú Cultural» em
vez de inventar procedência de coleção.

## O que falta construir

1. **Feedback do curador** (85) — o ciclo que fecha 69 e 82.
2. **Roteiro salvável e compartilhável** — o roteiro existe como página; guardá-lo depende de
   Salvos (52) e compartilhar (18).

## Ligações com outros apps

- **[Mapa](mapa.md)** — o roteiro do dia (21) é a mesma funcionalidade, vista de outra porta.
- **[Acontece](acontece.md)** — a agenda que o roteiro percorre.
- **Redação** — o human-in-the-loop (69).
