---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 05
subsystem: observatorio-procedencia-indicadores
status: complete
tags: [observatorio, procedencia, indicadores, desertos, WEB-07, D-87, D-88, D-89, D-90]

requires:
  - "src/dados/grafo.ts — contagens(), porSlug, slugsPorTipo, vizinhos, porTerritorio"
  - "src/dados/gerado/meta.json — porProcedencia, porProcedenciaDeAresta, totais (a testemunha independente)"
  - "src/dados/repertorio.ts — repertorioDe() sobre as 3 personas"
  - "src/dados/geo.ts — densidadePorUf(), projetar(), caminhoDe(), LIMITES"
  - "src/componentes/desertos.tsx — CamadaDesertos, LeituraDesertos, DadosDesertos (fase 3, NÃO editado)"
  - "src/estilos/web.css — .web-painel, .web-grade, .web-alternador, .web-denominadores, .web-mapa (05-01, CONGELADA)"
provides:
  - "src/dados/observatorio.ts — 7 indicadores, painelDeProcedencia(), PUBLICOS, numerosDoObservatorio()"
  - "src/componentes/observatorio.tsx — o painel de primeira classe, os indicadores e o seletor de público"
  - "src/estilos/observatorio.css — as regras da tela 05-05"
  - "os atributos data-observatorio, data-indicador, data-publico, data-procedencia-painel, data-procedencia-fatia"
affects:
  - "05-08 REANCORA o gate 8 de verificar-fase3.mjs em c90fc9b e RECONTA o total de páginas de verificar-fase4.mjs"
  - "05-08 conserta o <title> de desertos.tsx — hoje ele impede o SSR da camada"

tech-stack:
  added: []
  patterns:
    - "conferência de TRÊS pontas: varredura própria × contagens() de grafo.ts × meta.json, com falha alta"
    - "D-90 na ESTRUTURA e não na prosa: valor null + sustentado false ≠ valor 0 + sustentado true"
    - "gráfico sem biblioteca: barra em HTML com largura calculada do dado, medível por getBoundingClientRect"
    - "indicador não sustentado NÃO desenha barra nenhuma — nem com o denominador ao lado"

key-files:
  created:
    - src/dados/observatorio.ts
    - src/componentes/observatorio.tsx
  modified:
    - src/estilos/observatorio.css
    - src/app/(bastidor)/observatorio/page.tsx

decisions:
  - "o exemplo de cada fatia sai de REGRA e não de escolha: a entidade de maior grau daquela procedência, e a relação mais frequente. Uma entidade escolhida à mão é literal disfarçado e troca de sentido em silêncio na primeira regeração do grafo"
  - "uma LINHA por procedência com as duas leituras lado a lado, e não duas colunas independentes: a inversão 61,8%→22,4% (ic) contra 37,6%→77,5% (derivado) é o achado do painel, e em duas colunas ela ficava a 500 px de si mesma. E o significado aparece UMA vez em vez de seis"
  - "indicador que o dado não sustenta não desenha barra NENHUMA. Com barra, «2.425 de 2.425 ocorrências gratuitas» desenhava a barra cheia — a barra de «100% gratuito» que D-90 proíbe. O denominador ao lado não desfaz a imagem"
  - "sete indicadores, não cinco: os cinco de D-87 mais acessibilidade e faixa etária. Os dois acrescentados são o segundo e o terceiro caso de ausência, e eles falham por motivos DIFERENTES — gratuidade tem campo vazio, faixa etária não tem campo"
  - "os quatro públicos veem os MESMOS sete indicadores em outra ordem, conferido no carregamento do módulo. Um público que escondesse indicador viraria filtro, e o institucional é justamente o que mais precisa ver que gratuidade não sustenta"
  - "a camada de desertos monta depois da hidratação porque desertos.tsx dá ao <title> uma LISTA de filhos e o SSR de React 19 emite vazio — conserto de 05-08, e não meu (arquivo da fase 3)"

metrics:
  duration: "~2 h"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 4

actuals:
  tokens: 47000
  tasks: 3
  commits: 3
---

# Phase 5 Plan 05: Observatório — os indicadores e o painel de procedência Summary

O painel de procedência existe como tela de primeira classe, com os números contados e
conferidos contra três fontes independentes: **4.826 entidades do Itaú Cultural, 2.937
derivadas por nós, 47 autoradas — 7.810**; e **14.882 + 51.600 + 81 = 66.563** ligações. Ao
lado dele, sete indicadores de impacto cultural calculados no build, **dois deles declarando
que o acervo não os sustenta**, cada um com o denominador na tela.

---

## O resultado, sem rodeio

`/observatorio` na visão web abre com o painel de procedência **inteiro dentro da primeira
vista** numa janela de 1440×960 — medido: topo em y=86, base em y=767. Não é rodapé, não é
legenda cinza: é a primeira coisa depois do título, com borda laranja e número grande.

**42 gates verdes no DOM vivo** (22 no painel, 20 no público e nos desertos). Console: 0
erro, 0 aviso. Rede: 0 requisição externa. As três suítes herdadas seguem verdes —
43 + 67 + 99 = **209 gates**.

---

## O ACHADO: a procedência conta duas histórias, e a segunda é a que importa

O plano pediu «mostre as duas leituras» e antecipou que a proporção de arestas contaria outra
história. Contou — mas não a que o plano supôs. O plano escreveu que «0,6% das entidades são
autoradas, mas a proporção de arestas conta outra história». Medido, `autorado` é ainda
**menor** em aresta (0,1%). A inversão real é outra e é mais forte:

| procedência | entidades | aresta |
|---|---|---|
| Itaú Cultural | 4.826 · **61,8%** | 14.882 · **22,4%** |
| derivado por nós | 2.937 · **37,6%** | 51.600 · **77,5%** |
| autorado por nós | 47 · **0,6%** | 81 · **0,1%** |

**O acervo deu as COISAS; a maior parte das LIGAÇÕES entre elas é leitura nossa.** O Itaú
Cultural entrega 61,8% dos nós e 22,4% das arestas; nós derivamos 37,6% dos nós e 77,5% das
arestas — a semelhança (47.256), a ocorrência datada (2.465), o lugar (1.556). É por isso que
o grafo parece rico, e a tela diz isso em vez de deixar passar por acervo.

Essa medida é o que fez o painel virar **uma linha por procedência com as duas leituras lado
a lado**, e não duas colunas independentes: em colunas separadas, a inversão ficava a 500 px
de si mesma e o significado de cada procedência aparecia duas vezes, palavra por palavra.

**E os 47 autorados, decompostos na tela:** 40 eventos (os clones encenados do Cenário 3), 3
`pessoa-usuaria`, 3 `repertorio`, 1 `trilha`. Quem olha o painel vê exatamente o que nós
inventamos, item por item.

---

## O que o módulo calculou, contra o que o plano mediu

Saída literal de `numerosDoObservatorio()`:

```json
{
 "entidades": 7810, "arestas": 66563,
 "entidadesIc": 4826, "entidadesDerivado": 2937, "entidadesAutorado": 47,
 "arestasIc": 14882, "arestasDerivado": 51600, "arestasAutorado": 81,
 "indicadores": 7, "naoSustentados": 2, "publicos": 4, "personas": 3,
 "bytesDoDto": 14969, "tetoDoDto": 61440, "geradoEm": "2026-08-22"
}
```

| medida do plano | o plano mediu | o módulo contou | bate? |
|---|---|---|---|
| entidades ic / derivado / autorado | 4.826 / 2.937 / 47 | 4.826 / 2.937 / 47 | sim |
| arestas ic / derivado / autorado | 14.882 / 51.600 / 81 | 14.882 / 51.600 / 81 | sim |
| linguagens atravessadas (3 personas) | 8, 5, 10 | 8, 5, 10 | sim |
| linguagens no adjacente | 11, 12, 19 | 11, 12, 19 | sim |
| entidades no repertório | 10, 12, 9 | 10, 12, 9 | sim |
| eventos que declaram ingresso | 0 de 300 | 0 de 300 | sim |
| ocorrências com espaço | 0 de 2.425 | 0 de 2.425 | sim |
| entidades com coordenada resolvível | 1.380 | 1.380 | sim |
| SP + RJ sobre o total de registros | 59% | 59,2% (458 de 773) | sim |
| Sergipe e Tocantins | zero | zero | sim |
| acessibilidade: dimensões com registro | 3 de 8 | 3 de 8 (libras 180, open_caption 1, subtitle 1) | sim |
| ficha de acessibilidade | 5.108 / 2.702 | 5.108 / 2.702 | sim |
| **base da diversidade por região** | **1.380 com coordenada** | **718 com estado resolvível** | **não — ver desvio 1** |

---

## Os sete indicadores, e por que são sete

| id | valor | unidade | denominadores | sustentado |
|---|---|---|---|---|
| `ampliacao-de-repertorio` | 23 | linguagens atravessadas | **3** personas autoradas · 11 declaradas | sim |
| `descoberta-de-artista-novo` | 39 | pessoas e coletivos a um salto | 185 adjacentes · 3 personas | sim |
| `diversidade-de-linguagem-por-regiao` | 3 | mediana por estado | 718 com estado · 7.810 no acervo | sim |
| `circulacao-territorial` | 59,2 | % em 2 dos 27 estados | 773 registros · 718 entidades | sim |
| `gratuito-x-pago` | **null** | — | 300 eventos (0 declaram preço) · 2.425 ocorrências | **não** |
| `acessibilidade-como-criterio` | 3 | das 8 dimensões | 8 dimensões · 5.108 declaram a ficha | sim |
| `faixa-etaria` | **null** | — | **0** campos · 7.810 varridas | **não** |

O plano pediu cinco. Os dois acrescentados existem porque **eles falham por motivos
diferentes**, e a diferença é conteúdo:

- **gratuidade** tem o campo e o campo está vazio — 140 eventos trazem `comIngresso: false`
  com `preco: null`, 160 não trazem o campo, e **nenhum dos 300** declara preço;
- **faixa etária** não tem campo em lugar nenhum — nem CMS, nem Enciclopédia, nem nas 7.810.

E há um **terceiro** caso na tela, que é o que dá sentido aos outros dois: a **descoberta de
artista novo da Joana é ZERO**, medido sobre 68 adjacentes reais. Zero com `sustentado: true`
é uma medida; `null` com `sustentado: false` é a ausência de lastro. **O tipo não deixa as
duas se confundirem**, e o módulo quebra alto se alguém tentar:

```
Error: observatorio.ts: «gratuito-x-pago» tem valor null com sustentado=true.
valor null e sustentado false são a mesma afirmação e andam juntos; zero com
sustentado true é uma MEDIDA. Confundir as duas é exatamente o que D-90 existe
para impedir.
```

---

## A conferência de três pontas — provada, não afirmada

As fatias de entidade são contadas aqui, e comparadas com `contagens()` de `grafo.ts` **e**
com `porProcedencia` de `meta.json`, escrito por `gerar-grafo.mjs` num processo separado. As
de aresta são contadas aqui (deduplicando por `de|relacao|para`, porque a adjacência é não
dirigida) e comparadas com `porProcedenciaDeAresta` e `totais.arestas`. **Três fontes
independentes precisam concordar para a tela abrir.**

Três adulterações deliberadas, com o arquivo restaurado byte a byte depois (42.544 bytes
antes e depois):

```
tamper 1: PROCEDENCIAS perde «autorado»
  Error: observatorio.ts: o painel de procedência NÃO FECHA e a tela não pode abrir.
    · as fatias de entidade somam 7763 e o acervo tem 7810
    · as fatias de aresta somam 66482, a varredura viu 66563 arestas distintas
      e meta.json declara 66563

tamper 2: gratuidade volta a sustentado: true, com valor null
  Error: «gratuito-x-pago» tem valor null com sustentado=true. […]

tamper 3: o público «produto» perde um indicador
  Error: o público «produto» não traz os mesmos indicadores que os outros.
  Faltando: [gratuito-x-pago]. Sobrando: []. D-89 é troca de RECORTE e não de tela […]
```

---

## O seletor de público (D-89) — recorte, não filtro

Quatro controles, `aria-pressed`, mesma URL. Medido no DOM vivo: **quatro ordens diferentes e
UM único conjunto** — os mesmos 7 indicadores nos quatro. A ênfase visual (borda laranja e o
primeiro bloco ocupando as duas colunas) muda junto com a ordem: 4 conjuntos de destaque
distintos.

```
ok  D-89 · trocar de público NÃO muda a URL: /observatorio/ · /observatorio/ · /observatorio/ · /observatorio/
ok  D-88 · o painel sobrevive aos quatro públicos, com as seis fatias: editorial:6 · produto:6 · parceiro:6 · institucional:6
ok  os quatro públicos produzem quatro ordens DIFERENTES: 4 ordens distintas
ok  D-89 · e o CONJUNTO de indicadores é o mesmo nos quatro — é recorte, não filtro: 7 indicadores em todos
```

---

## Verificação — comandos e saída literal

### 1. Task 1 — o módulo

```
OK 7 indicadores entidades 7810 arestas 66563 13592 bytes
```

DTO completo: **14.969 bytes**, 24% do teto de 61.440.

### 2. Task 2 — o painel de procedência, 22 gates no DOM vivo a 1440×960

```
ok   D-88 · o painel de procedência começa DENTRO da primeira vista, sem rolar:
     {"visivel":true,"top":86,"bottom":767,"left":164,"width":1112,"height":681,"janela":960,"rolagem":0}
ok   D-88 · o painel INTEIRO cabe na primeira vista — não só o topo dele: bottom=767 · janela=960
ok   seis fatias de procedência no DOM: 6
ok   a soma dos números EXIBIDOS de entidade é 7.810: 7810
ok   a soma dos números EXIBIDOS de aresta é 66.563: 66563
ok   as barras de entidades têm largura MEDIDA na ordem dos números:
     números ic>derivado>autorado · larguras ic>derivado>autorado
     (ic=267.8px derivado=163px autorado=3px)
ok   as barras de arestas têm largura MEDIDA na ordem dos números:
     números derivado>ic>autorado · larguras derivado>ic>autorado
     (ic=96.91px derivado=335.97px autorado=3px)
ok   nenhuma barra transborda o contêiner: 0 transbordando
ok   D-88 · a frase sobre «autorado» diz INVENTAMOS, sem eufemismo, e está VISÍVEL
ok   o painel é PRODUTO: fora de <Comentario>, e os comentários dentro dele estão apagados
ok   T-05-23 · cada indicador traz denominador com altura maior que zero: 7 de 7
ok   zero requisição para fora do servidor local: 0 externas
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 22 gates verdes
```

### 3. Task 3 — público, gratuidade e desertos, 20 gates

```
ok   D-90 · gratuidade aparece DECLARADA como não sustentada: altura da declaração 137px
ok   D-90 · com os DOIS denominadores, os dois com altura maior que zero:
     ["gratuito-x-pago:principal=66px","gratuito-x-pago:secundario=66px"]
ok   D-90 · NENHUMA barra foi desenhada num indicador que o dado não sustenta: 0 barras · 0 cheias
ok   o mapa de desertos está DESENHADO, medido pelo retângulo: {"w":536,"h":442,"top":2761}
ok   as 27 unidades federativas com retângulo não-vazio: 27 ufs · 0 zeradas
ok   Sergipe e Tocantins são os dois vazados: ["SE","TO"]
ok   a frase que distingue registro no acervo de oferta cultural do estado está INTACTA
ok   nada da tela corre para fora da janela: {"scrollWidth":1440,"clientWidth":1440,"scrollHeight":3271}

TUDO PASSOU · 20 gates verdes
```

### 4. O contrato `data-*` no HTML exportado

```
OK HTML: painel=1 fatias=6 publicos=4 indicadores=7 denominadores=14
Sergipe: true | Tocantins: true | «Sergipe tem cultura»: true
```

### 5. As suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-comentado` | **TUDO PASSOU** — 43 verdes, 0 falhas |
| `npm run verificar-fase2` | **TUDO PASSOU** — 67 verdes, 0 falhas |
| `npm run verificar-fase4` | **TUDO PASSOU** — 99 verdes, 0 falhas (ver a nota do total de páginas) |
| `npm run verificar-fase3` | **vermelha no gate 8**, `globals.css`, herdada de 05-01 |

`verificar-fase3` continua com a mesma medida de 05-01 — **prova de que este plano não tocou
`globals.css`**:

```
FALHA src/app/globals.css intocado desde o fim da fase 2 (c03f627):
      medido 41 0 src/app/globals.css · esperado diferença zero
```

**41 linhas acrescentadas, 0 removidas — exatamente o que 05-01 registrou.** A âncora de
05-08 continua sendo `c90fc9b`.

### 6. Peso e rede

| medida | valor |
|---|---|
| chunk JS do componente | **16 KB** |
| regras `.obs*` no CSS | **13,2 KB** (13.519 bytes) |
| **total deste plano** | **≈ 29 KB** dos 60 KB de orçamento |
| DTO no HTML da rota | 14.969 bytes (viaja no flight payload, não nos chunks) |
| `out/observatorio/index.html` | 80 KB |
| requisições externas | **0**, medidas por `performance.getEntriesByType('resource')` |

---

## Deviations from Plan

### 1. [Regra 1 — o dado não sustentava a premissa] A base da diversidade por região é 718, não 1.380

- **Found during:** Task 1
- **Issue:** o plano pede «Denominador: as 1.380 com coordenada». As 1.380 são as entidades
  que `coordenadaDe()` resolve — e 472 delas SÃO os próprios territórios e espaços, que não
  declaram linguagem. Mais importante: `coordenadaDe()` devolve lat/lon, e **não há função no
  projeto que leve lat/lon a uma unidade federativa** — isso exigiria ponto-em-polígono sobre
  contornos que o próprio `contorno-brasil.ts` declara esquemáticos e autorados. Agrupar por
  estado só é possível pela hierarquia `situado_em`, que é o que `porTerritorio()` percorre, e
  ela alcança **718 entidades distintas**.
- **Fix:** o denominador declarado é o que foi de fato medido — 718 entidades com estado
  resolvível — com as 7.810 do acervo ao lado e a fração escrita na tela: «só 718 das 7.810 —
  9,2% do acervo — têm estado resolvível. Este indicador é verdadeiro sobre essas 718, e não
  sobre o acervo».
- **Por que é mais forte assim:** citar 1.380 como denominador de um cálculo feito sobre 718
  seria exatamente o defeito que D-90 existe para não cometer.
- **Commit:** `0d0eee3`

### 2. [Regra 1 — bug real, pego pela sonda] Indicador sem lastro desenhava barra cheia

- **Found during:** Task 3
- **Issue:** o detalhe de gratuidade trazia «ocorrências marcadas gratuitas · 2.425 de 2.425»
  com a barra **cheia**. É literalmente «a barra de 100% gratuito» que o plano proíbe. O
  denominador ao lado não desfaz a imagem: quem passa o olho lê a barra, não a fração.
- **Fix:** indicador com `sustentado: false` não desenha barra nenhuma. O lugar da barra
  recebe a palavra **«não recorta»** — um trilho vazio ainda é um gráfico, e um gráfico
  afirma escala.
- **Commit:** `5819a47`

### 3. [Regra 1 — defeito herdado, consertado SEM editar o arquivo do outro] O `<title>` de `desertos.tsx` derruba a hidratação quando renderizado no servidor

- **Found during:** Task 2, pelo console — `Minified React error #418` na rota inteira.
- **Diagnóstico, medido:** `desertos.tsx` (fase 3) dá ao `<title>` de cada estado uma **lista
  de filhos**:
  ```jsx
  <title>{uf.titulo} — {uf.registros}{" "}{…}{…}</title>
  ```
  React 19 exige que `children` de `<title>` seja uma string única. Reproduzido em isolamento
  com `react-dom/server`:
  ```
  title dentro de path         → <svg><path><title>BBB</title></path></svg>
  title com filhos multiplos   → <svg><path><title></title></path></svg>
  React expects the `children` prop of <title> tags to be a string […] but found
  an Array with length 3 instead.
  ```
  No HTML exportado, **as 27 `<title>` saíam vazias**; no cliente React escreve o texto, e a
  diferença derruba a hidratação da rota inteira.
- **Por que a fase 3 nunca esbarrou nisso:** `/mapa` só monta a camada **depois de um clique**
  — ela nunca é renderizada no servidor lá. Conferido: `/mapa` com a camada ligada tem console
  limpo e os `<title>` corretos («Acre — 2 registros»).
- **Fix, dentro dos meus arquivos:** a camada monta depois da hidratação, pelo mesmo
  comportamento herdado de `/mapa`. **`desertos.tsx` não foi tocado.**
- **O que NÃO se perde:** o contorno do Brasil continua no HTML estático, e `LeituraDesertos`
  é HTML puro e continua servida no artefato — «Sergipe», «Tocantins», «Sergipe tem cultura» e
  a frase que distingue registro no acervo de oferta cultural do estado estão no arquivo, sem
  depender de JavaScript. O que espera a hidratação são os 27 polígonos pintados.
- **⇒ O CONSERTO DEFINITIVO É DE 05-08, e é de uma linha:** trocar os filhos do `<title>` em
  `src/componentes/desertos.tsx` por uma template string única. Feito isso, basta remover o
  `useState/useEffect` de `observatorio.tsx` e a camada volta ao HTML estático.
- **Commit:** `e0c5ed5`

### 4. [Regra 3 — bloqueante] `page.tsx` entrou no commit da Task 2

- **Issue:** o `<verify>` da Task 2 mede o **DOM vivo** (`npm run build && sonda procedencia`)
  e não existe DOM sem uma página montando o componente. `page.tsx` é arquivo da Task 3 no
  plano, mas o gate da Task 2 não roda sem ele.
- **Fix:** `page.tsx` foi escrito por inteiro no commit da Task 2. A Task 3 é o commit de
  correção que o gate dela produziu.
- **Commit:** `e0c5ed5`

### 5. [Regra 2] Sete indicadores, não cinco

Os cinco de D-87 mais `acessibilidade-como-criterio` e `faixa-etaria`. O gate do plano pede
«cinco ou mais». Os dois acrescentados são o segundo e o terceiro caso de ausência do acervo, e
mostram que **ausência não é uma coisa só**: campo vazio (gratuidade), campo inexistente
(faixa etária) e medida que deu zero (a descoberta de artista da Joana). Sem os três lado a
lado, a tela teria um caso de D-90 e pareceria exceção.

### 6. [Regra 2] O painel virou uma linha por procedência, e não duas colunas

A primeira montagem tinha duas colunas independentes. **A foto mostrou o problema** — o mesmo
parágrafo de significado repetido seis vezes e a inversão de proporção separada por 500 px.
Reorganizado, o painel encolheu de 695 px para 681 px e ganhou a leitura que ele existe para
dar. Foi a captura de tela que pegou, não o gate — pela quarta vez nesta obra.

### 7. [Regra 1] Separador decimal misturado

O rótulo da fatia mostrava `61,8%` e o parágrafo ao lado dizia `61.8%`. Duas grafias do mesmo
número na mesma tela. Corrigido com uma função `pt()` no módulo.

---

## Notas para 05-08

1. **A âncora do gate 8 de `verificar-fase3.mjs` continua `c90fc9b`** — este plano não tocou
   `globals.css`, e a medida `41 0` é idêntica à de 05-01.
2. **O gate de total de páginas de `verificar-fase4.mjs` precisa ser recontado.** Ele espera
   resíduo `1784`; a onda 2 já produziu `2316` (as rotas de `/play`, `/produtor` e `/filtros`
   dos outros planos — **nenhuma deste plano**, que só preenche a rota `/observatorio` já
   existente). Prova: com a constante ajustada numa **cópia efêmera** (`scripts/` nunca foi
   tocado, e o diretório foi apagado), a suíte inteira dá **99 verdes, 0 falhas** — o mesmo
   número de 05-01.
3. **`src/componentes/desertos.tsx` tem um defeito de uma linha** — ver desvio 3. Enquanto ele
   existir, nenhuma tela pode renderizar `CamadaDesertos` no servidor.
4. **O peso de chunks está subindo rápido:** medido em 1.276 KB durante a suíte e **1.476 KB**
   depois do build seguinte de outro executor, contra o teto de 1.600 KB. Este plano responde
   por ≈29 KB. Vale medir antes de 05-08 fechar.
5. **Atributos emitidos por este plano, no HTML exportado:**

| atributo | valores | quantidade |
|---|---|---|
| `data-observatorio` | — | 1 |
| `data-procedencia-painel` | `acervo` | 1 |
| `data-procedencia-fatia` | `ic`, `derivado`, `autorado` | 6 (3 de entidade + 3 de aresta) |
| `data-leitura-procedencia` | `entidades`, `arestas` | 6 |
| `data-indicador` | o id do indicador | 7 |
| `data-denominador` | `{id}:principal`, `{id}:secundario` | 14 |
| `data-publico` | `editorial`, `produto`, `parceiro`, `institucional` | 4 |
| `data-sustentado` | `sim`, `nao` | 7 (5 `sim`, 2 `nao`) |
| `data-destaque` | `sim`, `nao` | 7 |
| `data-nao-sustenta` | o id do indicador | 2 |
| `data-mapa-desertos` | — | 1 |
| `data-com-barra` | `sim`, `nao` | 7 |

`data-denominador` foi tratado como **compartilhado** com 05-01, como aquele plano pediu.

---

## A sonda

`scripts/sonda-05-05.ts` foi apagada, como o plano manda. `git status --short scripts/` sai
vazio. As capturas ficaram **fora do repositório**, em `DIR_CAPTURAS`.

---

## O protocolo de disco — resultado

**Nenhum arquivo leu zero byte nesta execução.** Conferência antes de editar, disco contra
`git show HEAD:<caminho>`:

```
OK src/app/(bastidor)/observatorio/page.tsx (980)   OK src/estilos/web.css (15243)
OK src/estilos/observatorio.css (2063)              OK src/componentes/desertos.tsx (7905)
OK src/app/globals.css (15669)
```

Depois de cada commit, cada arquivo conferido **no git**, não só no disco:

| arquivo | bytes no git | bytes no disco |
|---|---|---|
| `src/dados/observatorio.ts` | 42.921 | 42.921 |
| `src/componentes/observatorio.tsx` | 20.658 | 20.658 |
| `src/estilos/observatorio.css` | 17.805 | 17.805 |
| `src/app/(bastidor)/observatorio/page.tsx` | 3.822 | 3.822 |

Nenhuma restauração foi necessária. Nenhum arquivo vazio foi commitado.

---

## Commits

| hash | o quê |
|---|---|
| `0d0eee3` | `feat(05-05)` — `observatorio.ts` calcula os indicadores e fecha o painel de procedência |
| `e0c5ed5` | `feat(05-05)` — o painel de procedência como tela de primeira classe |
| `5819a47` | `fix(05-05)` — indicador sem lastro não desenha barra nenhuma |

Os três empurrados para `espelho`.

---

## Known Stubs

Nenhum. Todos os números da tela são calculados; nenhum valor de exibição é literal.

A única coisa que não está no artefato estático são os **27 polígonos pintados do mapa de
desertos**, que aguardam a hidratação — pelo defeito herdado de `desertos.tsx` descrito no
desvio 3, com o conserto de uma linha nomeado para 05-08. O texto da leitura, com Sergipe,
Tocantins e a frase que não pode ser suavizada, **está** no HTML estático.

## Threat Flags

Nenhuma. Este plano não instala pacote, não abre endpoint, não toca esquema e não faz
requisição de rede — medido em 0 requisições externas.

---

## BLOQUEIO DE AMBIENTE — o iCloud despejou o `.git` do diretório compartilhado

**Aconteceu depois do último commit de código deste plano, e afeta os SEIS executores.**
Não é defeito deste plano e não é consertável de dentro dele.

### O que foi medido

`ls -lO` marca os arquivos com a bandeira **`dataless`** — a forma exata do risco que o plano
previu: «`stat` informa tamanho, a leitura devolve zero byte».

```
-rw-r--r--@ 1 macos staff hidden,compressed,dataless  21 .git/HEAD
-rw-r--r--@ 1 macos staff hidden,compressed,dataless 247 .git/config
-rw-r--r--@ 1 macos staff hidden,compressed,dataless 240 .git/info/exclude
…
383 arquivos dataless em .git/, dos quais 355 em .git/objects/
```

Sintomas em cadeia: `fatal: not a git repository`, depois
`fatal: cannot use .git/info/exclude as an exclude file`, depois `git log` andando só um
commit, e por fim `error: pack-objects died of signal 10` (SIGBUS) — **o push não fecha**.
Volume a **97%**, 16 GB livres. `brctl download` materializa `.git/HEAD` e **recusa**
`.git/config` e os 355 objetos.

### O que foi consertado, com prova de que o conserto é fiel

| arquivo | como foi restaurado | prova |
|---|---|---|
| `.git/HEAD` | `brctl download` | materializou: `ref: refs/heads/main` |
| `.git/config` | reconstruído | **exatamente 247 bytes**, o mesmo tamanho que o sistema de arquivos reporta; `git remote -v` volta a mostrar `espelho` |
| `.git/info/exclude` | copiado do template do git instalado | 240 bytes, `cmp` byte a byte contra o `info/exclude` do espelho: idêntico |
| `.git/description` | idem | 73 bytes |
| `src/estilos/observatorio.css` | `git --git-dir=<espelho> show 5819a47:… > arquivo` | `cmp` contra o commitado: **idêntico**; `git status` limpo |

**A folha de estilo deste plano chegou a ser despejada** — `cat` devolvia 0 bytes com `stat`
informando 17.805. Restaurada do espelho antes de qualquer commit, exatamente como o
protocolo manda. **Nenhum arquivo vazio foi commitado.**

### O que NÃO foi feito, e por quê

- **Os 355 objetos soltos despejados não foram reparados.** O conserto exige liberar disco
  (97% cheio) ou cirurgia no `.git` compartilhado enquanto cinco executores têm trabalho
  não-commitado nele. É decisão de arquitetura e de risco que não cabe a um executor tomar
  sozinho (Regra 4).
- **O commit `8c2f6c3` (este SUMMARY) existe só localmente** — o `git push` falha com SIGBUS
  ao empacotar. Os **três commits de código já estavam no espelho** e foram conferidos byte a
  byte de lá.
- **`STATE.md` e `ROADMAP.md` não foram atualizados.** O repositório não empurra, os dois
  arquivos estão sendo editados por outros cinco executores neste momento, e as chamadas
  `state.update-progress` e `state.record-metric` estão explicitamente proibidas nesta
  execução.

### Salvaguarda

Cópia de tudo fora do iCloud, em `/Users/macos/Projetos/salvaguarda-05-05/`:
`05-05-SUMMARY.md` (25.167), `observatorio.ts` (42.921), `observatorio.tsx` (20.658),
`observatorio.css` (17.805), `observatorio-page.tsx` (3.822).

---

## Self-Check: PASSED

| item | resultado |
|---|---|
| `src/dados/observatorio.ts` | FOUND · 42.921 bytes · idêntico ao espelho |
| `src/componentes/observatorio.tsx` | FOUND · 20.658 bytes · idêntico ao espelho |
| `src/estilos/observatorio.css` | FOUND · 17.805 bytes · idêntico ao espelho (restaurado) |
| `src/app/(bastidor)/observatorio/page.tsx` | FOUND · 3.822 bytes · idêntico ao espelho |
| commit `0d0eee3` | FOUND no espelho |
| commit `e0c5ed5` | FOUND no espelho |
| commit `5819a47` | FOUND no espelho |
| commit `8c2f6c3` (docs) | **local apenas** — push bloqueado pelo despejo |
| `scripts/sonda-05-05.ts` | apagada · `scripts/` limpo |
| `globals.css`, `web.css`, `mapa.css`, `desertos.tsx` | intocados, conferido no espelho |
