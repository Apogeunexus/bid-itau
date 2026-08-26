# Descobrir — funcionalidades

**Rota** `/descobrir` e `/descobrir/porque/[chave]` ·
**Componentes** `feed.tsx`, `cartao.tsx`, `descobrir-vitrines.tsx`, `explicacao.tsx` ·
**Dados** `src/dados/caminhada.ts`, `feeds.ts`, `cartao.ts` ·
**Inventário** [telas.md](../telas.md) telas 5, 6, 7 e 25 · **Camada de corte** C1

**Acervo hoje:** 96 combinações de disposição pré-computadas, que colapsam em 19 listas
distintas. Cada feed traz 12 cartões.

## O que este app é

**A tela mais importante do produto.** O feed não é lista ordenada por relevância: cada
cartão chegou por uma **aresta do grafo**, e o selo é o texto dessa aresta. Popularidade não
entra em lugar nenhum — nem aqui, nem no motor de caminhada.

É o que separa mediação legível de recomendador opaco.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 1 | Feed montado por caminhada no grafo, não por popularidade | ★ | **no ar** — 96 combinações medidas no build |
| 2 | Entrada por disposição, não por categoria | ★ | **no ar** — 5 disposições, 32 combinações por persona |
| 3 | Trilha de primeira vez — sequência guiada | ★ | **no ar** — `/trilha/[slug]` |
| 4 | Fios de conexão navegáveis («isto vem daquilo») | | **no ar** — o caminho está no cartão |
| 5 | Serendipidade dosada | | **no ar** — exatamente 1 cartão por feed, fora do alcance da caminhada |
| 6 | Explicação de toda recomendação | ★ | **no ar** — `/descobrir/porque/`, uma página por cartão |
| 7 | Destaque curado capaz de sobrepor o algoritmo | ★ | **no ar** — 1 por feed, assinado pela Redação |
| 8 | Descoberta por adjacência de repertório — um passo além, nunca dez | ★ | **no ar** — 1, 2 ou 3 saltos, com o 3 como reserva |

**É o app mais completo do hub.** As oito funcionalidades da seção 1 do catálogo estão no ar.

## O que mudou em 2026-08-25

- **A contagem saiu dos chips e das vitrines.** «Hoje 9», as contagens de cidade e de
  linguagem — todas removidas a pedido. A medição continua no build: é ela que ordena as
  linguagens por tamanho e decide se o chip «Todas» aparece. O que mudou é o que se mostra.
- **A nota de curadoria saiu do cartão, e saiu do dado.** «Curadoria humana, escrita pela
  curadoria…» é informação de bastidor — a Redação assina a trilha e declara procedência
  passo a passo. Deixá-la no DTO fazia o texto descer no payload de todo feed sem ninguém
  para renderizá-lo.
- **O motivo virou tag**, ao lado da classe, e a descrição do acervo entrou sob a manchete.

## A descrição, com denominador

**48 dos 75 cartões distintos do feed têm descrição no acervo.** Os outros 27 não têm — e
são todas as 6 instituições, todos os 5 coletivos, 7 das 8 pessoas e 5 dos 7 verbetes.

Esses 27 mostram título e tags, sem descrição. **Não caem no motivo como substituto:** isso
faria texto nosso passar por texto do Itaú Cultural na primeira leitura de quem avalia.

## O que falta construir

Nada da seção 1 do catálogo. O que falta é a realimentação: **«eu fui»** ([Acontece](acontece.md), 14)
e **mapa de repertório** (53) fecham o ciclo que hoje só tem ida.

## Ligações com outros apps

Todos. Descobrir é a porta, e cada cartão é uma saída para o app da entidade.
