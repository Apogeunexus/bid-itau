# Mapa — funcionalidades

**Rota** `/mapa` · **Componente** `src/componentes/mapa.tsx` (1.337 linhas) ·
**Dados** `src/dados/cidade.ts`, `mapa-perto.ts`, `contorno-brasil.ts` ·
**Inventário** [telas.md](../telas.md) telas 10 e 11 · **Camada de corte** C1

**Acervo hoje:** 15 cidades com acervo. O desenho do Brasil é projeção própria em SVG — sem
biblioteca de mapa, sem requisição externa.

## O que este app é

O mapa como **lente**, nunca como porta de entrada.

**A inversão de 2026-08:** esta tela abria com o desenho do Brasil ocupando a primeira dobra
e a lista escondida embaixo. O efeito era um Google Maps cultural — a pessoa chegava e via
bolinhas, quando a pergunta que ela traz é «o que tem perto de mim que vale a pena
conhecer?». O RFP pede **equilíbrio** entre mapa, busca, filtros e curadoria, e o mapa tinha
virado o conteúdo.

A ordem agora é: origem → busca → filtro → cartões com distância → mapa. O desenho continua
inteiro, com os mesmos pinos; ele só deixou de ser a abertura.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 19 | Mapa como lente sobre qualquer resultado, nunca como home | ★ | **no ar** — é a tese da tela |
| 20 | Modo Cidade — planejar estadia de N dias em território desconhecido | ★ | **no ar** — `modo-cidade.tsx` |
| 21 | Roteiro do dia equilibrando deslocamento e densidade | ★ | **no ar** — `mapa-do-dia.tsx` |
| 22 | Recorte por bairro e região, não só município | | **não sustentada** — ver abaixo |
| 23 | Camada de desertos culturais — onde não há oferta | | **no ar** — `desertos.tsx` |
| 24 | «Perto de mim agora», por raio e por tempo | ★ | **parcial** — raio sim; por tempo de deslocamento, não |

## As duas que não se sustentam

**22 — bairro.** Distância abaixo de 5 km é ruído da derivação de coordenada. O acervo situa
por município; abaixo disso o número existe mas não significa. Recortar por bairro sobre esse
dado produziria uma lista precisa e errada.

**Coordenada fora do Brasil:** 48 dos 158 eventos situados. O mapa mostra o que tem, e diz
quantos ficaram fora.

## O que falta construir

1. **Raio por tempo de deslocamento** (24) — hoje é distância em linha reta. Tempo real exige
   serviço de rota, que é a primeira requisição externa que este protótipo teria.
2. **Bairro** (22) — depende de geocodificação melhor na origem, não de front-end.

## Ligações com outros apps

- **[Acontece](acontece.md)** — a agenda que o mapa recorta.
- **[Descobrir](descobrir.md)** — a vitrine «Mapa cultural» é a porta daqui.
- **[Roteiros com IA](ia.md)** — o roteiro do dia (21) é o que a conversa da IA entrega.
