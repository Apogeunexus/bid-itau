---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 01
subsystem: web-acontece-mapa
status: complete
tags: [web, acontece, mapa, sincronia, WEB-02, D-79, D-80, D-81, D-90]

requires:
  - "src/dados/agenda.ts — montarAgenda, o DTO de 129 eventos com sessão"
  - "src/dados/geo.ts — coordenadaDe, projetar, caminhoDe, LIMITES, VIAS_INDEXADAS"
  - "src/dados/contorno-brasil.ts — CONTORNO_BRASIL, ROTULO_CONTORNO"
  - "src/dados/grafo.ts — porSlug, slugsPorTipo (a única porta do acervo, D-16/D-47)"
provides:
  - "src/app/globals.css — as 11 linhas de @import da fase 5, escritas de uma vez"
  - "src/estilos/web.css — o vocabulário compartilhado da visão web, CONGELADO para 05-02 e 05-03"
  - "src/dados/mapa-agenda.ts — a medida da interseção vazia e os pares lista↔pino"
  - "src/dados/mapa-agenda-wire.ts — o formato de fio, importável dos DOIS lados de DP-F"
  - "src/estilos/acontece-web.css — as regras da tela 05-01"
  - "as 9 folhas restantes da fase, declaradas e vazias de regra"
  - "o vocabulário data-* da fase 5, congelado"
affects:
  - "05-02 a 05-07 escrevem SÓ na própria folha e não abrem globals.css"
  - "05-08 REANCORA o gate 8 de verificar-fase3.mjs em c90fc9b"

tech-stack:
  added: []
  patterns:
    - "módulo de build puro, síncrono e memoizado, com falha alta e nomeada (molde de duplicatas.ts)"
    - "formato de fio em TUPLA quando o DTO atravessa a fronteira RSC (molde de PinoIndexado)"
    - "módulo de fio só-de-tipos, importável por valor dos dois lados de DP-F"
    - "divergência de visão por CSS sob [data-view=…], nunca por ramo em JavaScript"

key-files:
  created:
    - src/dados/mapa-agenda.ts
    - src/dados/mapa-agenda-wire.ts
    - src/estilos/web.css
    - src/estilos/acontece-web.css
    - src/estilos/web-descobrir.css
    - src/estilos/web-buscar.css
    - src/estilos/web-evento.css
    - src/estilos/produtor.css
    - src/estilos/redacao.css
    - src/estilos/observatorio.css
    - src/estilos/filtros.css
    - src/estilos/sem-resultado.css
    - src/estilos/play.css
  modified:
    - src/app/globals.css
    - src/componentes/acontece.tsx
    - src/app/(app)/acontece/page.tsx

decisions:
  - "os 158 eventos situados NÃO são 158 pinos: 110 caem dentro do contorno do Brasil e 48 têm coordenada verdadeira fora dele. Os 48 ficam na lista, contados e nomeados, e não são desenhados — desenhá-los fora do viewBox os poria no DOM com data-par legível e zero pixel na tela, que é o gate verde sobre tela morta que esta fase existe para não repetir"
  - "o DTO viaja em TUPLA e não em objeto: com campo nomeado ele media 148.652 bytes contra o teto de 61.440, e 39 KB disso eram os NOMES dos campos repetidos 287 vezes. Em tupla mede 53.694"
  - "o vocabulário posicional mora num módulo só-de-tipos que os dois lados da fronteira DP-F importam por valor — duas cópias de um vocabulário POSICIONAL divergem em silêncio e trocam o lugar de um evento pelo de outro sem quebrar o build"
  - "na visão app some o BLOCO INTEIRO, não só a coluna do mapa: esconder só o mapa deixaria uma segunda lista de 158 eventos embaixo da agenda da fase 3"
  - "UM estado `parRealcado`, lido pelos dois lados. Dois estados sincronizados um contra o outro divergem no primeiro caso de borda, e o sintoma é o realce preso aceso"

metrics:
  duration: "~50 min"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 16

actuals:
  tokens: 21691
  tasks: 3
  commits: 3
---

# Phase 5 Plan 01: O traçador da visão web — lista e mapa sincronizados Summary

O caminho inteiro provado numa tela — grafo → módulo de build → página de servidor →
componente de cliente → folha de estilo → **cursor** —, com a sincronia lista↔mapa medida
por evento de mouse real no DOM vivo, e `globals.css` resolvido de uma vez para os seis
executores da onda 2 correrem em paralelo.

---

## O resultado, sem rodeio

`/acontece` na visão web mostra lista e mapa **lado a lado, os dois inteiros acima da
dobra** numa janela de 1440×960. Passar o cursor sobre uma linha da lista acende o pino
daquele evento no mapa — e só ele. Passar sobre o pino acende a linha de volta. O mesmo
acontece pelo teclado, por `Tab`.

Na visão app, a mesma rota é **exatamente** a agenda da fase 3: nenhum mapa, nenhuma
segunda lista, a moldura de celular intacta.

**18 gates verdes no DOM vivo. Console: 0 erro, 0 aviso. Rede: 0 requisição externa.**
As três suítes herdadas seguem verdes — 43 + 67 + 99 = **209 gates**. A quarta
(`verificar-fase3`) está vermelha no gate 8, como o plano previu, e a seção
[O gate vermelho](#o-gate-vermelho-e-o-hash-que-05-08-precisa) diz o que 05-08 faz com ela.

---

## O ACHADO: os 158 situados não são 158 pinos

**Esta é a medida mais importante deste plano, e ela não estava no plano.**

O plano mediu, corretamente, que 158 dos 300 eventos têm coordenada resolvível (101 pela
via `espaco`, 57 pela via `territorio`) e que a interseção com «tem sessão datada» é 0.
Confirmei os três números contra o grafo, um a um. Mas o plano deduziu daí que o recorte
«por lugar» teria **158 itens e 158 pinos**, e essa dedução tem um passo a mais que não se
sustenta:

```
eventos com coordenada resolvível : 158
  destes, DENTRO do contorno do Brasil : 110
  destes, FORA                         :  48   ← Havana, Grande Londres, Itália, o litoral do Chile
```

Todos os 158 são `procedencia: "ic"` — vêm da Enciclopédia, que documenta arte brasileira
**e** a circulação internacional dela. Os 48 de fora têm coordenada verdadeira e conhecida;
o que eles não têm é lugar dentro de um desenho que é o contorno do Brasil.

**Eles não são desenhados, e a decisão não é minha — é da fase 3.** `projetar()` devolve a
posição mesmo quando ela cai fora e não grampeia nada para a borda, e o comentário ao lado
diz por quê: grampear amontoaria as coordenadas estrangeiras no contorno como se estivessem
no Brasil, «uma afirmação falsa sobre lugar, feita em silêncio». `resolverRecorte` já separa
`foraDoBrasil` das `posicionados` e a tela do mapa da fase 3 as declara sem desenhar
nenhuma.

E desenhá-las **fora** do `viewBox` seria pior do que grampear: o SVG recorta o que passa da
moldura, e os 48 pinos existiriam no DOM, com `data-par` legível e `getBoundingClientRect`
não-vazio, **sem um pixel na tela**. Um gate contando atributo passaria verde sobre 48 pinos
invisíveis — exatamente as duas vezes em que, neste projeto, um gate passou sobre uma tela
visivelmente quebrada.

Então os 48 entram na LISTA, com `par: null`, `data-mapeavel="nao"` e o motivo escrito na
linha, e o número deles é um dos denominadores da declaração. **Nenhuma soma some:
110 + 48 = 158.**

O mecanismo para isso já estava no plano — «quando o item não é mapeável, `par` é `null`, e
é isso, e não uma ausência de atributo, que a tela lê» — e `data-mapeavel` já estava
reservado no vocabulário congelado sem que o plano dissesse para que servia. Era para isto.

**A consequência para os gates literais do plano** está em
[Deviations](#deviations-from-plan), desvio 1.

---

## Os números que o módulo imprimiu, contra os que o plano mediu

Saída literal de `NUMEROS_DO_MAPA_DA_AGENDA`:

```json
{
 "eventosNoAcervo": 300,
 "comSessao": 129,
 "comLugar": 158,
 "interseccao": 0,
 "comLugarNoDesenho": 110,
 "comLugarForaDoDesenho": 48,
 "itensPorData": 129,   "pinosPorData": 0,
 "itensPorLugar": 158,  "pinosPorLugar": 110,
 "bytesDoDto": 53694,   "tetoDoDto": 61440
}
```

| medida | o plano mediu | o módulo imprimiu | bate? |
|---|---|---|---|
| eventos na agenda | 129 | 129 | sim |
| deles, com coordenada | 0 | 0 | sim |
| eventos com lugar | 158 (101 espaço + 57 território) | 158 (101 + 57) | sim |
| interseção sessão × lugar | 0 | 0 | sim |
| `indiceDePinos()` | 1.380 | 1.380 | sim |
| **dos 158, desenháveis** | **158 (deduzido)** | **110 (medido)** | **não — ver o achado** |

---

## A assinatura exportada — congelada para 05-08

### `src/dados/mapa-agenda.ts` (build, alcança o grafo — **só `import type` do cliente**)

| export | tipo | notas |
|---|---|---|
| `montarMapaDaAgenda({hoje})` | `MapaDaAgenda` | memoizado por data; é o que a página chama |
| `NUMEROS_DO_MAPA_DA_AGENDA` | objeto calculado | **é o que 05-08 mede contra a tela** |
| `INTERSECCAO_ESPERADA` | `0` | conferência que derruba o build |
| `EVENTOS_COM_SESSAO_ESPERADOS` | `129` | idem |
| `EVENTOS_COM_LUGAR_ESPERADOS` | `158` | idem |
| `TETO_DO_DTO` | `61440` | 60 KB, medido a cada build |
| `RecorteDoMapa` | `{id, rotulo, itens, pinos, mapeaveis, total, declaracao}` | |
| `InterseccaoMedida` | `{eventosNoAcervo, comSessao, comLugar, comOsDois, comLugarNoDesenho, comLugarForaDoDesenho, texto}` | |
| `MapaDaAgenda` | `{recortes, viewBox, contorno, rotuloContorno, interseccao, bytesDoDto}` | |

### `src/dados/mapa-agenda-wire.ts` (só-de-tipos — **importável por valor dos dois lados**)

| export | notas |
|---|---|
| `IdDoRecorte` | `"data" \| "lugar"` |
| `ItemSerializado` | `[par, slug, título, linguagens, lugar, viaIdx, motivoIdx, totalSessões, próximaSessão, tempoIdx]` |
| `PinoSerializado` | `[par, x, y, viaIdx, métodoIdx]` |
| `ItemPareado`, `PinoPareado` | os objetos nomeados, montados no cliente |
| `expandirItem`, `expandirPino` | a expansão, custo zero de fio |
| `VIAS_DO_ITEM`, `METODOS_DO_PINO`, `TEMPOS_DO_ITEM`, `MOTIVOS_SEM_PINO` | vocabulários posicionais |

`mapa-agenda.ts` **confere** `VIAS_DO_ITEM` contra `VIAS_INDEXADAS` e `METODOS_DO_PINO`
contra `METODOS_INDEXADOS` a cada build, e quebra alto se divergirem.

### O módulo quebra alto — provado, não afirmado

Duas adulterações deliberadas, com os arquivos restaurados byte a byte depois:

```
tamper 1: INTERSECCAO_ESPERADA = 3
  Error: mapa-agenda.ts: a interseção entre «tem sessão datada» e «tem lugar» virou 0,
  e a declaração de D-90 na tela afirma 3. […] REESCREVA a declaração da interseção
  junto com a medida — não relaxe esta conferência […]

tamper 2: VIAS_DO_ITEM com «espaco» e «territorio» trocados de lugar
  Error: mapa-agenda.ts: VIAS_DO_ITEM («propria, territorio, espaco») divergiu de
  VIAS_INDEXADAS de geo.ts («propria, espaco, territorio»).
```

A terceira quebra disparou **sozinha, em produção**, e foi ela que me obrigou ao formato de
fio em tupla:

```
Error: mapa-agenda.ts: o DTO ficou com 148652 bytes, acima do teto declarado de 61440.
```

---

## O vocabulário `data-*` da fase 5 — CONGELADO

**Deste plano (05-01), medidos no DOM vivo e no HTML exportado:**

| atributo | onde | valores | no HTML exportado |
|---|---|---|---|
| `data-acontece-web` | a seção da visão web | — | 1 |
| `data-modo-lista` | os dois botões do alternador | `data`, `lugar` | 2 |
| `data-interseccao` | o bloco de declaração de D-90 | — | 1 |
| `data-par` | a linha da lista **e** o pino | o id da entidade | 220 (110 + 110) |
| `data-realcado` | idem | `sim`, `nao` | 268 `nao`, **0 `sim`** |
| `data-mapeavel` | a linha da lista | `sim`, `nao` | 158 |
| `data-lista-recorte` | a `<ul>` do recorte ativo | `data`, `lugar` | 1 |
| `data-item-lista` | cada linha da lista | — | 158 |
| `data-pino` | cada `<circle>` | — | 110 |
| `data-motivo-sem-pino` | linha sem pino | `sem-lugar`, `fora-do-desenho` | 48 (129 no outro recorte) |
| `data-denominador` | cada número da declaração | `com-sessao`, `com-lugar`, `com-os-dois`, `no-desenho`, `fora-do-desenho` | 5 |
| `data-mapa-acontece` | o `<svg>` | — | 1 |

**Cinco atributos ACRESCENTADOS ao contrato do plano** — todos antes de a onda 2 começar,
nenhum renomeando nem alterando o conjunto de valores de um atributo original:
`data-lista-recorte`, `data-item-lista`, `data-motivo-sem-pino`, `data-mapa-acontece` e
`data-denominador`.

> **Atenção, 05-05:** `data-denominador` estava reservado para o Observatório. Ele é usado
> **aqui também**, com a mesma semântica — «este número é um denominador medido». Trate-o
> como compartilhado, no mesmo espírito de `data-nao-sustenta` da fase 4, e não como
> exclusivo. O valor do atributo é a chave do denominador, não um id global.

**Reservados e ainda não emitidos, exatamente como o plano os declarou:**
`data-grade-web`, `data-destaque-curado`, `data-coluna-facetas` (05-02) ·
`data-tabela-ocorrencias`, `data-coluna-acessibilidade`, `data-painel-aprofunda` (05-03) ·
`data-fila-redacao`, `data-item-fila`, `data-procedencia-item`, `data-score-ia`,
`data-acao-redacao`, `data-motivo-veto`, `data-veto-bloqueado`, `data-decisao-redacao`,
`data-escopo-curador`, `data-passo-trilha`, `data-motivo-passo`, `data-publicavel`,
`data-sugestao-ia`, `data-limites-ia` (05-04) · `data-observatorio`, `data-indicador`,
`data-publico`, `data-procedencia-painel`, `data-procedencia-fatia` (05-05) ·
`data-filtros`, `data-dimensao-acessibilidade`, `data-declarado-ausente`,
`data-nao-declarado`, `data-criterio-inexistente`, `data-contador-vivo`,
`data-sem-resultado`, `data-afrouxamento`, `data-beco`, `data-trilha-relacionada` (05-06) ·
`data-play`, `data-categoria`, `data-midia`, `data-player`, `data-concluir`,
`data-assistido`, `data-veja-isto`, `data-sem-arquivo` (05-07).
`data-nao-sustenta`, da fase 4, segue reaproveitado por toda a fase 5.

---

## O orçamento de chunks por plano — e a boa notícia

| plano | teto |
|---|---|
| 05-01 | ≤ 60 KB |
| 05-02 | ≤ 20 KB |
| 05-03 | ≤ 20 KB |
| 05-04 | ≤ 60 KB |
| 05-05 | ≤ 60 KB |
| 05-06 | ≤ 80 KB |
| 05-07 | ≤ 100 KB |

**Este plano gastou 0 KB dos seus 60.** Medido depois de um `rm -rf .next out` e um build
limpo:

```
ok   peso de out/_next/static/chunks: 1045 KB · -79 KB contra os 1124 KB de antes da fase 4 · teto 1600 KB
```

O motivo importa para a onda 2: **o DTO de uma rota exportada não vai para
`_next/static/chunks`** — ele viaja no *flight payload* dentro do HTML da própria página.
`out/acontece/index.html` passou de 271 KB para **471 KB**; os chunks não se mexeram. O teto
de 1.600 KB continua com 555 KB de folga, e quem for gastar orçamento de verdade são os
componentes de cliente novos, não os dados.

---

## O ponto de colisão da onda 2, resolvido

`src/app/globals.css` passou de 10 para **21** linhas de `@import`, e não recebeu **uma
única linha de regra**:

```
17: agenda.css      22: salvos.css              75: web.css              81: redacao.css
18: busca.css       41: studio.css              76: acontece-web.css     82: observatorio.css
19: cidade.css      42: studio-duplicatas.css   77: web-descobrir.css    83: filtros.css
20: frase.css       43: studio-ocorrencias.css  78: web-buscar.css       84: sem-resultado.css
21: mapa.css        44: roteiro.css             79: web-evento.css       85: play.css
                                                80: produtor.css
```

Gates da fase 4, saída literal:

```
ok   nenhuma folha órfã em src/estilos/: 0 órfãs · 21 folhas no disco, 21 declaradas
ok   globals.css desde a consolidação (a40f380): só @import e comentário:
     15 linha(s) de @import acrescentada(s) · 0 linha(s) de REGRA acrescentada(s) · 0 removida(s)
ok   o bloco :root com os hex do manual, byte a byte desde a consolidação: 1562 bytes idênticos
ok   folha de estilo importada de componente: 0 ocorrências em 88 arquivos ·
     o único import de CSS é src/app/layout.tsx → ./globals.css
```

**`web.css` está escrita por inteiro e é CONGELADA para 05-02 e 05-03.** Toda regra dela
está aninhada sob `[data-view="web"]` e nenhuma tem efeito na visão app. Reusem antes de
escrever regra nova:

| classe | o que faz |
|---|---|
| `.web-duas-colunas` | grade painel principal + lateral; `align-items: start` (sem ele o `sticky` não gruda) |
| `.web-colada` | o lateral que acompanha a rolagem |
| `.web-grade` | grade de cartões, colunas por `--web-colunas` |
| `.web-grade-largo` | item que ocupa `--web-span` colunas — o destaque curado de 05-02 |
| `.web-coluna-fixa` | a coluna de facetas permanente de D-80, rolando por dentro |
| `.web-painel` | superfície de painel, borda e respiro maiores que a versão app |
| `.web-realce` | **o realce de D-81, escrito UMA vez** para lista e mapa |
| `.web-alternador` | o grupo de botões que troca RECORTE, não tela — 05-04 e 05-05 precisam do mesmo |
| `.web-declaracao` + `.web-denominadores` | a declaração de D-90 com os números |
| `.web-lista-densa` + `.web-linha` | lista longa que rola por dentro, ao lado de outra coisa |
| `.web-mapa` | o quadro do SVG quando ele é METADE da tela |

As outras **9 folhas nasceram com cabeçalho e zero regra**. Cada cabeçalho diz de qual
plano é a folha, o que ela cobre, e repete as cinco regras da casa (nunca importar de
componente, nada de hex do manual, divergência por `[data-view=…]` e não por variante,
reusar `web.css`, nada de `position: fixed`).

---

## Verificação — comandos e saída literal

### 1. Build

```
✓ Compiled successfully
✓ Generating static pages using 7 workers (1931/1931)
```

### 2. O contrato no HTML exportado (`out/acontece/index.html`)

```
data-acontece-web  : 1        data-mapeavel      : 158
data-interseccao   : 1        data-denominador   : 5
data-modo-lista    : 2        data-realcado=sim  : 0     ← realce é atributo de INTERAÇÃO
data-par           : 220      data-realcado=nao  : 268
data-item-lista    : 158      data-pino          : 110
```

### 3. A sonda do traçador — 18 gates no DOM vivo, 1440×960

```
ok   a tela abriu na visão web: web
ok   D-90 · o bloco de interseção é PRODUTO, visível com o modo comentado desligado:
     visível=true · dentro de <Comentario>=false · data-comentado=nao · 968 caracteres
ok   D-90 · os denominadores medidos estão na tela: com-sessao=129 · com-lugar=158 ·
     com-os-dois=0 · no-desenho=110 · fora-do-desenho=48
ok   D-90 · o alternador entre os dois recortes está na tela:
     [{"modo":"data","pressionado":"false"},{"modo":"lugar","pressionado":"true"}]
ok   D-80 · lista e mapa LADO A LADO, medidos pelo retângulo e não pela classe:
     {"lista":{"x":240,"y":538,"w":462,"h":480},"mapa":{"x":735,"y":551,"w":451,"h":403}}
ok   D-80 · os dois cabem na primeira tela: lista.top=538 · mapa.top=551 · janela=960
ok   os 110 pinos existem com retângulo não-vazio DENTRO do quadro do mapa:
     110 pinos · 0 com retângulo zerado · 0 fora do quadro · 110 com data-par
ok   D-81 · nenhum realce antes de qualquer gesto: itens=0 pinos=0
ok   D-81 · mouseover no ITEM realça o PINO de mesmo data-par, e só ele:
     par=evento:enc:123758 · itens=["evento:enc:123758"] · pinos=["evento:enc:123758"]
ok   D-81 · mouseout devolve os dois a data-realcado=nao: itens=[] pinos=[]
ok   D-81 · mouseover no PINO realça o ITEM de volta — a sincronia é dos dois lados:
     par=evento:enc:124417 · itens=["evento:enc:124417"] · pinos=["evento:enc:124417"]
ok   o realce é PINTURA e não só atributo: {"itemContorno":"rgb(255, 120, 0) 2px",
     "itemFundo":"color(srgb 1 0.470588 0 / 0.08)","pinoTraco":"rgb(255, 120, 0) 2px",
     "pinoNaoRealcadoTraco":"rgba(0, 0, 0, 0) 0px"}
ok   D-90 · no recorte «por data» nenhum item tem data-par e o mapa não realça nada:
     {"itens":129,"comPar":0,"mapeaveis":0,"pinos":0,"interseccaoVisivel":true}
ok   os 129 declaram, um a um, POR QUE não vão para o mapa: 129 de 129
ok   zero requisição para fora do servidor local: 0 externas
ok   D-79 · na visão app /acontece NÃO monta mapa nenhum:
     {"view":"mobile","blocoWeb":false,"mapa":false,"pinos":0}
ok   a agenda da fase 3 continua intacta na visão app, item por item:
     9 cartões de evento · 23 chips de dia · 4 ausências medidas · moldura=true
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 18 gates verdes
```

**A sonda foi apagada, como o plano manda.** `git status --short scripts/` sai vazio;
`scripts/` está byte a byte como estava. Os gates permanentes são de 05-08.

### 4. As suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-comentado` | **TUDO PASSOU** — 43 verdes, 0 falhas |
| `npm run verificar-fase2` | **TUDO PASSOU** — 67 verdes, 0 falhas, 0 erro em 26 navegações |
| `npm run verificar-fase4` | **TUDO PASSOU** — 99 verdes, 0 falhas |
| `npm run verificar-fase3` | **vermelha no gate 8**, como previsto — ver abaixo |

### 5. Rede e console

`performance.getEntriesByType('resource')`: **0 requisição externa**. Na suíte da fase 3,
**0 externas em 48 navegações**, 464 recursos distintos, todos em `127.0.0.1`. Console
limpo nas duas visões.

---

## O gate vermelho, e o hash que 05-08 precisa

```
FALHA src/app/globals.css intocado desde o fim da fase 2 (c03f627):
      medido 41 0 src/app/globals.css · esperado diferença zero

VERIFICAÇÃO FALHOU: src/app/globals.css intocado desde o fim da fase 2 (c03f627)
— medido 41 0 src/app/globals.css, esperado diferença zero
```

Ele é o **oitavo** gate, e a suíte aborta ali: os 86 seguintes não chegam a rodar. É o preço
declarado da consolidação e **não deve ser consertado aqui**.

### ⇒ A ÂNCORA DE 05-08 É `c90fc9b`

Troque, na **linha 80** de `scripts/verificar-fase3.mjs`:

```diff
- const COMMIT_FIM_DA_FASE_2 = "c03f627";
+ const COMMIT_FIM_DA_FASE_2 = "c90fc9b";
```

`c90fc9b` é o commit da Task 1, o **único** deste plano que tocou `globals.css`. Conferido:

```
git diff --numstat c90fc9b HEAD -- src/app/globals.css   →  (vazio)
```

A forma forte do gate — «diferença zero» — fica preservada, e ele volta a provar o que
existe para provar: que **a onda 2 não tocou `globals.css`**.

**Prova de que o RESTO da suíte continua verde**, feita numa cópia efêmera em
`.tmp-verificacao/` com a âncora já apontada para `c90fc9b` (o mesmo procedimento de
04-01; `scripts/` nunca foi tocado, e o diretório foi apagado):

```
EXIT=0 · verdes: 94 · falhas: 0
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo): 0 violações em 25 clientes
ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 63 telas
ok   peso de out/_next/static/chunks: 1045 KB (teto 1.600 KB)
ok   inserção de HTML bruto em src/: 0 ocorrências em 90 arquivos
console  0 erro e 0 aviso da aplicação em 48 navegações · 0 diagnósticos de CSS
         pré-carregado e não usado
rede     0 requisição externa em 48 navegações · 464 recursos distintos
TUDO PASSOU.
```

As 11 folhas novas **não** reintroduziram o aviso de CSS pré-carregado e não usado que a
fase 2 fechou em zero. `acontece.tsx` entra nos **25 clientes** varridos pelo gate
transitivo de DP-F, com **0 violações** — a fronteira `import type` está provada
mecanicamente.

---

## Deviations from Plan

### 1. [Regra 1 — o dado não sustentava a premissa] `porLugar.mapeaveis` é 110, não 158

- **Found during:** Task 2
- **Issue:** o plano deduziu «158 situados ⇒ 158 pinos». Medido: 48 dos 158 têm coordenada
  fora do retângulo do desenho. Ver [O ACHADO](#o-achado-os-158-situados-não-são-158-pinos).
- **Fix:** os 48 ficam na lista com `par: null`, `data-mapeavel="nao"` e motivo escrito;
  110 viram pino. É o mecanismo `par: null` que o plano já especificava, e a regra
  «contadas e nomeadas, NUNCA desenhadas» que `resolverRecorte` já institui na fase 3.
- **Os dois gates literais do plano mudaram, e é isto que 05-08 tem de escrever:**

  | gate do plano | literal do plano | o que vale |
  |---|---|---|
  | Task 2 | `porLugar.mapeaveis === 158` | `=== 110`, e `total === 158` |
  | Task 2 | «todo item tem pino» | «todo item **mapeável** tem pino» — bijeção 110↔110, nos dois sentidos |
  | Task 3 | `data-par >= 300` | `=== 220` (110 itens + 110 pinos) |

  A **propriedade** que os gates protegem — lista e mapa são o mesmo conjunto, o par existe
  para todos os que vão ao mapa, e a chave é a mesma dos dois lados — está provada nos dois
  sentidos e é mais forte do que a contagem: o gate verifica a **bijeção**, não só o total.
- **Commit:** `8ad62f6`

### 2. [Regra 3 — bloqueante] O DTO não cabe em 60 KB com campo nomeado

- **Found during:** Task 2, pela própria conferência do módulo
- **Issue:** `Error: o DTO ficou com 148652 bytes, acima do teto declarado de 61440`. Os dois
  recortes somam 287 itens, e medido campo a campo: **os nomes dos campos custam 136 bytes
  por item — 39 KB** de `"proximaSessao":` repetido. Com o conjunto de campos que o plano
  especifica, 60 KB é inalcançável por aritmética, não por desleixo.
- **Fix:** formato de fio em **tupla**, que é a resposta que este projeto já deu ao mesmo
  problema duas vezes — `PinoIndexado` em `geo.ts` e os arrays paralelos de `DiaDaAgenda` em
  `agenda.ts`, ambos com a justificativa escrita ao lado. **53.694 bytes**, 87% do teto.
  `id`, `rota`, `classe` e `mapeavel` deixaram de viajar: são derivados na expansão
  (`id` é o `par`, `rota` é `/evento/{slug}/`, `classe` é sempre `"evento"`, `mapeavel` é
  `par !== null`). O título não viaja no pino — ele já viajou no item de mesma chave.
- **Os tipos nomeados do plano continuam existindo** (`ItemPareado`, `PinoPareado`): eles
  são o que o componente manipula. O que mudou é só o formato do fio.
- **Commit:** `8ad62f6`

### 3. [Regra 3] Arquivo novo: `src/dados/mapa-agenda-wire.ts`

- **Issue:** com tupla, o vocabulário posicional precisa existir dos **dois** lados da
  fronteira DP-F — o produtor monta, o cliente expande. `mapa-agenda.ts` alcança o grafo e
  não pode ser importado por valor de um `"use client"`.
- **Fix:** um módulo **só-de-tipos** (zero import por valor), que os dois lados importam.
  Duas cópias de um vocabulário POSICIONAL divergem em silêncio: trocar dois campos de
  lugar não quebra o build, só passa a mostrar o lugar de um evento no nome de outro.
  `mapa-agenda.ts` confere os espelhos contra `geo.ts` a cada build e quebra alto.
- **Nota:** o arquivo não está no `files_modified` do plano. Este plano é onda 1 e corre
  sozinho, então não há risco de colisão; registro aqui para 05-08 incluí-lo na varredura.
- **Commit:** `8ad62f6`

### 4. [Regra 2] Na visão app some o BLOCO INTEIRO, não só a coluna do mapa

- **Issue:** o plano diz «a coluna do mapa fica com `display: none` sob
  `[data-view="mobile"]`». Escondendo só ela, a lista da web — 129 ou 158 linhas — ficaria
  visível dentro da moldura de 390 px, embaixo da agenda da fase 3, como uma segunda lista
  de eventos. Isso contradiz «na visão app, `/acontece` continua **exatamente** a agenda da
  fase 3».
- **Fix:** `[data-acontece-web] { display: none }`, reativado só sob `[data-view="web"]`.
  Continua sendo CSS, e não um ramo em JavaScript. Medido na visão app: bloco sem retângulo,
  0 pinos com retângulo, 9 cartões, 23 chips, 4 ausências, moldura presente.
- **Commit:** `efb275e`

### 5. [Regra 2] `data-motivo-sem-pino` é código curto, e o motivo por extenso é texto

- **Issue:** `MOTIVOS_SEM_PINO` são frases de ~74 caracteres. Como atributo em 177 linhas,
  seriam ~13 KB de HTML afirmando a mesma coisa repetidamente.
- **Fix:** o atributo carrega o vocabulário de máquina (`sem-lugar` / `fora-do-desenho`), a
  linha carrega a frase humana e curta (`Havana — fora do contorno do Brasil, sem pino
  neste desenho`), e a explicação inteira aparece **uma vez**, na declaração do mapa. As
  duas razões nunca são achatadas numa só: «não tem lugar» e «tem lugar que não cabe neste
  desenho» são afirmações diferentes sobre o acervo.
- **Commit:** `efb275e`

### 6. [Regra 1 — pego olhando a foto, não o gate] O mapa não cabia na primeira tela

- **Issue:** na primeira montagem, as duas colunas começavam em y=548 e o mapa terminava em
  y=1115, numa janela de 960. **O gate passava** — ele mede os *topos* acima da dobra, e os
  dois estavam. Mas o terço inferior do mapa, que é onde está o aglomerado de pinos do
  Sudeste e do Sul, ficava abaixo da dobra. É a terceira vez que este projeto encontra um
  gate verde sobre uma tela cortada, e desta vez foi a captura de tela que mostrou.
- **Fix:** o parágrafo da interseção perdeu o `max-width: 92ch` (quebrava em 10 linhas,
  agora em 6) e as alturas de lista e mapa passaram a 50vh e 42vh. Remedido: colunas em
  512, mapa de **551 a 954** — inteiro acima da dobra de 960.
- **Commit:** `efb275e`

### 7. `IdDoRecorte` mudou de casa

De `mapa-agenda.ts` para `mapa-agenda-wire.ts`, e é reexportado da primeira. O componente
precisa dele por valor no `useState` e não pode importar do módulo que alcança o grafo.

### 8. Cinco denominadores na declaração, não três

O plano pede «os três denominadores». A declaração traz **cinco**: `com-sessao` (129),
`com-lugar` (158), `com-os-dois` (0), `no-desenho` (110) e `fora-do-desenho` (48). Os dois
últimos existem por causa do achado — sem eles a frase diria «158 têm lugar» ao lado de um
mapa com 110 pinos, e a diferença ficaria sem explicação na tela.

---

## O protocolo de disco — resultado

**Nenhum arquivo leu zero byte nesta execução.** Conferência antes de editar, disco contra
`git show HEAD:<caminho>`:

```
OK src/app/globals.css (13350)          OK src/dados/agenda.ts (21527)
OK src/componentes/acontece.tsx (26893) OK src/dados/geo.ts (25128)
OK src/componentes/mapa.tsx (16385)     OK src/app/(app)/acontece/page.tsx (1287)
OK src/dados/duplicatas.ts (34133)
```

Nenhuma restauração foi necessária. Depois de cada commit, cada arquivo conferido **no
git**, não só no disco:

| arquivo | bytes no git |
|---|---|
| `src/app/globals.css` | 15.669 |
| `src/estilos/web.css` | 15.243 |
| `src/estilos/acontece-web.css` | 7.081 |
| `src/dados/mapa-agenda.ts` | 18.974 |
| `src/dados/mapa-agenda-wire.ts` | 7.985 |
| `src/componentes/acontece.tsx` | 37.354 |
| `src/app/(app)/acontece/page.tsx` | 2.051 |
| as 9 folhas vazias | 1.873 a 2.063 cada |

Os três commits foram empurrados para `espelho` imediatamente após cada um. As duas
adulterações do teste de quebra-alto foram desfeitas com conferência de bytes
(`19074 → 19074`).

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | as 11 folhas declaradas, `web.css` por inteiro | **`c90fc9b`** ← **âncora de 05-08** | 12 |
| 2 | `mapa-agenda.ts` e a medida da interseção | `8ad62f6` | 2 |
| 3 | `/acontece` na visão web, o realce nos dois sentidos | `efb275e` | 5 |

---

## O que NÃO foi feito, e é de propósito

- **`/filtros/` não existe.** A coluna da lista tem o link, como o plano manda; a rota é de
  05-06, na mesma onda. O export estático não valida href interno, e quem prova que ela
  resolve é o gate de 05-08.
- **Nenhuma das 9 folhas da onda 2 tem uma regra.** É contrato.
- **`src/estilos/agenda.css` não foi tocado.** Nem `src/estilos/mapa.css`. Nem `scripts/`.
- **`gerar-grafo` não foi rodado.** `dados/` intacto.
- **`state.update-progress` não foi rodado**, pelo aviso registrado três vezes.

## Known Stubs

Nenhum. As 9 folhas vazias não são stub: são declaração de propriedade, com cabeçalho
dizendo de quem são, o que cobrem e por que chegam vazias.

## Threat Flags

Nenhuma superfície nova fora do registro do plano.

| ameaça | como foi provada |
|---|---|
| T-05-01 (DP-F) | gate transitivo: **0 violações em 25 clientes**; o cliente importa `mapa-agenda` só por tipo e `mapa-agenda-wire` (que não importa nada por valor) |
| T-05-02 (par por índice) | `par` é o id da entidade; a bijeção 110↔110 é conferida nos dois sentidos |
| T-05-03 (frase virar literal) | os 5 denominadores são contados; 3 conferências derrubam o build |
| T-05-04 (DTO estourar o teto) | 53.694 de 61.440, medido a cada build; chunks em **1.045 KB** de 1.600 |
| T-05-SC (pacote) | **zero dependência nova.** `package.json` intocado |

## Fotos

- `capturas/05-01-acontece-web.png` — as duas colunas, a declaração e os 5 denominadores
- `capturas/05-01-acontece-web-realce.png` — **D-81 acontecendo**: a 12ª Bienal de São Paulo
  realçada na lista e o pino dela laranja e maior no mapa
- `capturas/05-01-acontece-app.png` — a agenda da fase 3 intacta, sem mapa, na moldura

## Next Phase Readiness — o que a onda 2 pode assumir

1. **Ninguém da onda 2 toca `globals.css`.** As 11 folhas já estão declaradas; cada plano
   escreve só na sua.
2. **`web.css` está congelada.** Acrescentem à vontade **na folha de vocês**; renomear ou
   trocar a forma do que está em `web.css` quebra os irmãos.
3. **O contrato `data-*` está medido no DOM e no HTML exportado.** A grafia de casamento é
   sempre `atributo="`. `data-denominador` é compartilhado com 05-05.
4. **`.web-alternador` já existe** — 05-04 (escopo do curador) e 05-05 (seletor de público)
   precisam do mesmo gesto e não devem reescrevê-lo.
5. **O orçamento de chunks tem 555 KB de folga**, e o custo de um DTO cai no HTML da rota,
   não nos chunks.
6. **05-08 reancora o gate 8 em `c90fc9b`** e reescreve os dois literais do desvio 1.

## Self-Check: PASSED

Os 16 arquivos declarados existem, leem, e batem byte a byte com o git. Os três commits
existem no git e no espelho. `git status --short scripts/` sai vazio.
