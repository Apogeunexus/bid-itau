---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 06
subsystem: filtros-e-zero-resultado
status: complete
tags: [filtros, acessibilidade, zero-resultado, 404, APPX-01, APPX-04, D-91, D-93, D-90, D-43]

requires:
  - "src/dados/grafo.ts — slugsPorTipo, porSlug, vizinhos, contagens (a única porta do acervo, D-16/D-47)"
  - "src/dados/indice.ts — montarIndice, consultar, facetasDe, expandirIndice, Afrouxamento"
  - "src/dados/agenda.ts — ROTULO_DIMENSAO e DIMENSOES, os rótulos em português das 8"
  - "src/dados/trilha.ts — trilhas(), o resumo da única trilha do acervo"
  - "src/dados/mapa-agenda.ts — NUMEROS_DO_MAPA_DA_AGENDA, a interseção 0 medida por 05-01"
  - "src/estilos/web.css — .web-coluna-fixa, congelada por 05-01"
provides:
  - "src/dados/filtros.ts — as 8 dimensões contadas, RESUMO_DA_FICHA, CRITERIOS_SEM_LASTRO, o DTO de acessibilidade e montarBeco()"
  - "rota /filtros/ — que 05-01 e 05-02 já linkavam e que só agora resolve"
  - "rotas /busca-nao-encontrada/ e /agenda-nao-encontrada/"
  - "src/app/not-found.tsx — o conteúdo de out/404.html, que já existia"
  - "src/componentes/filtros.tsx e src/componentes/sem-resultado.tsx"
  - "src/estilos/filtros.css e src/estilos/sem-resultado.css"
affects:
  - "05-08 REANCORA verificar-fase3.mjs E TAMBÉM verificar-fase4.mjs — ver «o segundo gate vermelho»"
  - "05-08 acrescenta /filtros/, /busca-nao-encontrada/ e /agenda-nao-encontrada/ à lista de explicáveis"

tech-stack:
  added: []
  patterns:
    - "módulo de build puro, síncrono e memoizado, com falha alta e nomeada (molde de duplicatas.ts e mapa-agenda.ts)"
    - "DTO posicional alinhado ao índice POR CONSTRUÇÃO — lê expandirIndice em vez de repetir a enumeração"
    - "consulta de exemplo escolhida por regra, CONGELADA em constante, e conferida a cada build"
    - "um componente para três telas, com o conteúdo por propriedade (o oposto de três componentes que divergem)"
    - "recusa em três formas distintas: não-sustentada, não-recorta e inexistente"

key-files:
  created:
    - src/dados/filtros.ts
    - src/componentes/filtros.tsx
    - src/componentes/sem-resultado.tsx
    - src/app/not-found.tsx
    - src/app/(app)/filtros/page.tsx
    - src/app/(app)/busca-nao-encontrada/page.tsx
    - src/app/(app)/agenda-nao-encontrada/page.tsx
  modified:
    - src/estilos/filtros.css
    - src/estilos/sem-resultado.css

decisions:
  - "declaradaVerdadeira conta só `ic` (Libras 56) e não as 7.810 (180): os 180 são 56 declarações e 124 heranças da mesma declaração, e mostrá-los como «quantos oferecem Libras» inflaria o acervo em 3,2x com cópias do mesmo fato"
  - "os dois universos ficam SEPARADOS e nomeados na tela: acervo 7.810 (o diagnóstico) e índice 5.092 (o contador ao vivo)"
  - "as 5 dimensões zeradas ficam MARCÁVEIS, não desabilitadas: escondê-las apagaria o diagnóstico que é o argumento de D-91"
  - "faixa etária e gratuidade ficam como controle NÃO marcável, e as duas recusas têm formas diferentes: `inexistente` e `nao-recorta`"
  - "o recorte de acessibilidade NÃO viaja para /buscar e a tela DIZ isso com o número — o resultado é mostrado em /filtros mesmo"
  - "a vizinhança do beco sai do afrouxamento MENOS generoso: «perto disso» é perto do que se pediu, não perto do acervo inteiro"
  - "/404 não recebe o índice de 377 KB: um endereço inexistente não tem critério a afrouxar, e as saídas dele são endereços"

metrics:
  duration: "~2h10min"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 9

actuals:
  tokens: 26726
  tasks: 3
  commits: 3
---

# Phase 5 Plan 06: Filtros e os três becos Summary

Acessibilidade deixa de ser selo mostrado depois e vira **critério que se marca antes**, com
as 8 dimensões no mesmo lugar e com o mesmo peso de linguagem e território — e as três
rotas em que o site de hoje termina em mensagem de erro deixam de ser fim de caminho, cada
uma oferecendo qual critério afrouxar **com o número que ele entrega**.

---

## O resultado, sem rodeio

**Quatro telas, três rotas novas.** `/filtros/`, `/busca-nao-encontrada/` e
`/agenda-nao-encontrada/` nasceram aqui; `out/404.html` já existia e teve o conteúdo
substituído.

Em `/filtros/`, marcar **Libras** leva o contador de **5.092 para 49** sem trocar de tela e
sem uma requisição. Marcar **Audiodescrição** leva o contador a **0** — e o zero chega
explicado, ao lado do próprio controle, porque essa dimensão declara «0 de 5.108» **antes**
de ser marcada.

Em `/busca-nao-encontrada/`, clicar em «soltar o texto «libras»» entrega **exatamente os
300** que o botão prometia, aplicados na própria tela.

**54 gates verdes no DOM vivo** (23 em `/filtros` + 31 nos três becos). Console 0 erro, 0
aviso. Rede: 0 requisição externa. `verificar-comentado` e `verificar-fase2` seguem verdes.

---

## O NÚMERO QUE 05-08 PRECISA

```
total de páginas em out/, medido depois do meu build : 2.463
```

**Não é um número deste plano sozinho.** 05-07 aterrissou 529 rotas de mídia em paralelo,
nesta mesma onda. A decomposição contra a linha de base de 05-01 (1.931 páginas):

| origem | páginas | o quê |
|---|---|---|
| linha de base 05-01 | 1.931 | o artefato antes da onda 2 |
| 05-07 | +529 | `out/play/<slug>/` — 530 no total, contra 1 antes |
| **05-06 (este plano)** | **+3** | `/filtros/`, `/busca-nao-encontrada/`, `/agenda-nao-encontrada/` |
| | **2.463** | medido agora |

**As três rotas deste plano, para a lista de explicáveis de 05-08:**

```
filtros/index.html
busca-nao-encontrada/index.html
agenda-nao-encontrada/index.html
```

**`404.html` NÃO entra nessa lista.** Ele já existia na linha de base de 1.784 —
`app/not-found.tsx` substitui o conteúdo dele e não acrescenta página. Confirmado: o
resíduo do gate da fase 4 saiu **2.316**, e 2.316 − 1.784 = **532 = 529 + 3**. A conta
fecha exatamente, sem sobra de uma página. **O limiar de 1.784 não precisa se mover.**

---

## O SEGUNDO GATE VERMELHO, que o plano não previu

O plano avisou que `verificar-fase3` está vermelha no gate 8 (`globals.css` ancorado em
`c03f627`) desde 05-01 e que 05-08 a reancoraria. Confirmado, e não consertei.

**Mas `verificar-fase4` também tem uma âncora dura de 1.784 páginas**, e ela **falha
rápido** — `exigir()` lança na primeira falha, e este gate está na linha 782 de 2.194:

```
FALHA total de páginas em out/, com a diferença explicada rota a rota:
     medido 2463 páginas · 146 da fase 3 · 1 da fase 4 · resíduo 2316
     esperado resíduo 1784 e exatamente 1 página nova na fase 4
```

Quando ele estoura, **os ~90 gates seguintes da suíte nunca rodam** — inclusive os três
blocos que provam a coerência do roteiro com os módulos e o contrato `data-*` da fase 4.
Uma suíte que para no primeiro gate de contagem deixa de ser rede de regressão para a onda
inteira.

**Para provar que não há regressão de verdade**, rodei uma **cópia da suíte, fora do
repositório**, com a âncora movida para `1784 + 532` e nada mais alterado
(`scripts/verificar-fase4.mjs` não foi tocado — `git status --short scripts/` sai limpo de
qualquer arquivo meu):

```
TUDO PASSOU · 93 gates verdes
```

**05-08: reancore as DUAS suítes, não só a da fase 3.** A da fase 4 precisa das 532 rotas
novas na decomposição — 529 de 05-07 e 3 daqui — mantendo o resíduo em 1.784.

---

## Task 1 — `filtros.ts`, e os dois universos que não são o mesmo número

Este foi o achado do plano, e ele estava escondido dentro de números que o próprio plano
mediu certo.

O plano pediu `declaradaVerdadeira` (Libras = 56) com `entreAsQueDeclaram` = 5.108 como
denominador. Os dois números estão corretos e **estão em escalas diferentes**:

```
libras, entre as entidades `ic` (o que a FONTE declarou)          :  56
libras, entre as 7.810 (incluindo a ficha herdada por ocorrência
        e temporada, que o gerador derivou do evento)             : 180
entidades que preencheram a ficha, todas as classes               : 5.108
entidades `ic` que preencheram a ficha                            : 2.603
```

**Os 180 não são 180 declarações: são 56 declarações e 124 heranças da mesma declaração.**
Mostrar 180 como «quantos oferecem Libras» inflaria o acervo em 3,2 vezes com cópias do
mesmo fato. Por isso o número que a tela mostra ao lado do rótulo é o de `ic`, e os outros
dois ficam ao lado dele, **nomeados**, em vez de sumirem.

E há um terceiro universo, que o plano não separou e que a tela mentiria em silêncio sem
ele:

| universo | n | para quê |
|---|---|---|
| **acervo** | 7.810 entidades, 19 classes | o DIAGNÓSTICO — «5 das 8 medem zero» é uma afirmação sobre o acervo inteiro |
| **índice** | 5.092 entradas, 15 classes | o CONTADOR AO VIVO — o que se pode marcar e buscar |

Marcar «Libras» depois de ler «56» e ver o contador ir para **49** seria, sem essa
nomeação, a tela se contradizendo em dois segundos. Com ela, a linha do controle diz:
«56 registros da fonte declaram, de 2.603 que preencheram a ficha — **49 deles estão entre
as 5.092 entradas buscáveis**».

### Saída literal do gate da Task 1

```
OK 8 dimensoes, 5 zeradas declaradas, ficha 5108/2702, criterios sem lastro=2
{"entidadesNoAcervo":7810,"dimensoes":8,"dimensoesSustentadas":3,"dimensoesZeradas":5,
 "fichaDeclaram":5108,"fichaNaoDeclaram":2702,"fichaDeclaramNaFonte":2603,
 "criteriosSemLastro":2,"trilhas":1,
 "porDimensaoNaFonte":{"audio_description":0,"libras":56,"descriptive_subtitle":0,
   "closed_caption":0,"open_caption":1,"simultaneous_translation":0,"stenotypy":0,"subtitle":1}}
```

### O módulo quebra alto — provado, não afirmado

Duas adulterações deliberadas, com o arquivo restaurado byte a byte depois:

```
tamper 1: ENTIDADES_ESPERADAS = 7811
  Error: filtros.ts: a travessia alcançou 7810 entidades e o acervo declara 7811. […]
  NÃO relaxe esta conferência: todo denominador que a tela de filtros mostra é fatia
  deste total, e um total errado faz as fatias mentirem sem que nada fique vermelho.

tamper 2: DIMENSOES_ESPERADAS = 9
  Error: filtros.ts: contei 8 dimensões de acessibilidade e a ontologia do CMS tem 9.
  A tela de filtros afirma «as 8 dimensões» em texto de produto […]
  REESCREVA a afirmação junto com a medida.
```

### O DTO, medido

```
indice.total 5092 · dto.total 5092
declaram (no índice) 2554 · com alguma dimensão marcada 50
bytes 12736 · teto 30720
```

**Alinhamento por construção, não por coincidência.** `montarAcessibilidade` recebe o
índice já montado e lê `expandirIndice`, em vez de repetir a enumeração e a ordenação de
`montarIndice` e torcer para as duas continuarem iguais. Se a ordem do índice mudar amanhã,
este DTO muda junto sem nada aqui saber disso — e uma entrada perdida derruba o build, com
o motivo escrito: «o contador ao vivo passaria a atribuir a ficha de uma entidade a outra,
em silêncio».

---

## Task 2 — `/filtros`: as três recusas, cada uma com uma forma

O plano pediu que gratuidade e faixa etária «não virem controle que não faz nada». Ao
implementar ficou claro que **são três ausências, e colapsá-las apagaria o que cada uma diz
sobre a fonte**:

| ausência | forma na tela | atributo | por quê |
|---|---|---|---|
| as 5 dimensões zeradas | controle **marcável**, com o zero declarado antes | `data-nao-sustenta` | esconder apagaria o diagnóstico; marcar explica o vazio |
| gratuidade | controle **desabilitado**, com dois denominadores | `data-nao-sustenta` | o campo EXISTE e não discrimina |
| faixa etária | controle **desabilitado**, nomeado | `data-criterio-inexistente` | o campo NÃO EXISTE em lugar nenhum |

A frase da faixa etária não foi inventada: `disposicoes.ts` já a escreveu, e o texto aqui
cita o mesmo raciocínio — «o CMS modela 8 dimensões de acessibilidade e NENHUMA de
classificação indicativa; a Enciclopédia é verbete, não bilheteria; adivinhar por palavra
no título — «infantil» — seria inventar a classificação». As duas telas do protótipo que
pedem faixa etária dizem agora a mesma coisa.

### O que a tela NÃO finge

`Criterio` de `indice.ts` tem seis campos e acessibilidade não é um deles. **O recorte de
acessibilidade não viaja para `/buscar/`.** A escolha foi mostrar o resultado nesta tela,
com o recorte inteiro aplicado, e oferecer a ida a `/buscar/` dizendo, com o número, o que
se perde: «deixaria para trás N critérios de acessibilidade, devolvendo 5.092 em vez de
49». Está dito em texto de produto, em vez de acontecer em silêncio.

### Os 23 gates, saída literal

```
ok   a tela /filtros existe e abriu: {"view":"mobile","comentado":"nao","filtros":true}
ok   D-91 · há exatamente 8 controles de dimensão: 8
ok   D-91 · os 8 controles têm altura maior que zero com o modo comentado desligado: [21,21,21,21,21,21,21,21]
ok   D-91 · os 8 são MARCÁVEIS, inclusive as 5 que medem zero: 8 de 8
ok   D-90 · 5 dimensões trazem data-nao-sustenta: audio_description, descriptive_subtitle,
     closed_caption, simultaneous_translation, stenotypy
ok   D-90 · cada uma das 5 declara o zero COM número, antes de qualquer marcação
ok   D-43 · declarado-ausente e não-declarado são DOIS controles distintos e visíveis
ok   D-43 · os dois denominadores estão na tela: 5.108 e 2.702
ok   D-91 · faixa etária está na tela, nomeada, e NÃO é marcável:
     {"valor":"faixa-etaria","marcavel":false}
ok   D-90 · gratuidade declarada com os dois denominadores: denominadores=2
ok   D-91 · marcar «Libras» muda o contador ao vivo para um número MAIOR QUE ZERO:
     5092 → 49 · «49 de 5.092 entradas buscáveis · 1 critério marcado»
ok   o contador muda SEM NAVEGAR: location era «/filtros/» e continua «/filtros/»
ok   marcar «Audiodescrição» leva o contador a 0: 0
ok   D-90 · o zero vem EXPLICADO, com número, em vez de tela em branco
ok   e continua sem navegar: /filtros/
ok   «limpar tudo» devolve o contador ao total sem navegar: 5092 → 5092
ok   nenhum dos 8 controles corre para fora da moldura e o painel não transborda:
     fora=0 · scrollWidth-clientWidth=0
ok   o contador ao vivo cabe na PRIMEIRA VISTA, medido contra moldura menos a barra de
     abas (70px): topo=84 · limite=807
ok   D-80 · na visão web os critérios e a saída ficam LADO A LADO, medidos pelo retângulo:
     {"criterios":{"x":168,"y":280,"w":320},"saida":{"x":508,"y":280,"w":764}}
ok   D-80 · a coluna de critérios é .web-coluna-fixa de web.css: position=sticky ·
     rola por dentro=true
ok   as 8 dimensões continuam as 8 na visão web — um DOM só para as duas (D-05): 8
ok   zero requisição para fora do servidor local: 0
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 23 gates verdes
```

**A barra de abas cobre 70 px, não 59.** Medido, não presumido — o gate imprime a medida
que usou em vez de citar o número do plano.

---

## Task 3 — os três becos, e a ordem que é a decisão de produto

**A SAÍDA VEM ANTES DA EXPLICAÇÃO.** Quem chega a uma dessas telas não quer primeiro
entender o acervo: quer sair. Explicar antes de oferecer saída transforma a tela de erro
numa tela de erro comprida. O bloco de afrouxamentos fica logo abaixo do título — e o gate
mede o retângulo dele, não a presença: **base da saída = 210 px contra um limite de 807**
nas duas rotas de `(app)`, e **248 contra 876** em `/404`, que não monta barra de abas.

### As consultas, escolhidas por regra e congeladas

| beco | consulta | resultado | regra que a escolheu |
|---|---|---|---|
| `busca-nao-encontrada` | texto «libras» + classe `evento` | **0** | a dimensão de acessibilidade mais documentada do acervo, cruzada com a classe de que a agenda trata |
| `agenda-nao-encontrada` | classe `evento` + território `paraiba-uf` | **0** | o território brasileiro com mais entradas no índice que ainda assim não tem UM evento |
| `404` | — | — | um endereço errado não é uma busca que falhou: não há critério a afrouxar |

A de `busca-nao-encontrada` **é o diagnóstico de D-91 em uma linha**: «libras» casa 8
entradas do acervo e nenhuma delas é um evento — está tudo em matéria editorial **sobre**
Libras, e não em programação **com** Libras.

As duas estão fixas em `CONSULTAS_DOS_BECOS` e conferidas a cada build:

```
Error: filtros.ts: a consulta congelada de «busca-nao-encontrada» devolveu N resultados
e a tela afirma que não achou nenhum. […] não relaxe esta conferência, porque uma tela de
zero-resultado sobre uma busca que achou é a mentira mais fácil de não notar.
```

### O número prometido é o número entregue

```
ok   T-05-29 · clicar no afrouxamento «soltar o texto «libras» 300 resultados» entrega o
     número que ele prometia: prometido=300 · entregue=300
ok   e o afrouxamento é aplicado SEM NAVEGAR: /busca-nao-encontrada/ → /busca-nao-encontrada/
```

Não há um segundo motor: `Afrouxamento.resultados` e `Afrouxamento.consulta` vêm prontos de
`consultar()`, e aplicar é rodar o mesmo motor sobre a consulta que já veio afrouxada.

### A vizinhança sai do afrouxamento MENOS generoso

Esta é uma correção que a primeira implementação pediu. Tirar «o que existe perto disso» do
afrouxamento **mais** generoso devolvia, nos dois becos, **os mesmos quatro primeiros
eventos do acervo**, com o motivo genérico «parecido porque os dois são eventos, de arte» —
verdade e inútil, o mesmo defeito que `PESO_RELACAO` de `grafo.ts` existe para evitar.

Tirando do afrouxamento **menos** generoso — perto do que se PEDIU, não perto do acervo
inteiro — a vizinhança vira isto:

```
busca-nao-encontrada  Campina Grande faz jus ao título de "o maior São João do mundo"
                        «parecido porque os dois são conteúdos, de cultura popular»
                      Setembro Azul no Itaú Cultural
                        «parecido porque os dois são conteúdos, sobre contação de histórias»
agenda-nao-encontrada Alceu Wamosy · Anibal Beça · Adelaide Carraro · Celso Borges
                        «parecido porque os dois são pessoas, de literatura»
```

«Setembro Azul» — o mês da conscientização sobre a comunidade surda — aparecendo como
vizinho de uma busca por Libras que não achou nada é exatamente o que uma tela de
zero-resultado curatorial deveria fazer.

### `/404` é a rota em que o beco é mais fácil de cometer

Ela fica **fora** de `(app)` e `(bastidor)`: nenhum layout de grupo a alcança, então não
recebe barra de abas nem aviso de desktop. Por isso monta a própria navegação — as cinco
abas de D-13 em texto, com link — e o gate confere a ausência da barra em vez de presumi-la:

```
ok   404 · barra de abas AUSENTE como o grupo de rotas manda: false
ok   D-93 · 404 tem caminho de volta visível: 10 link(s) interno(s)
```

**O índice de 377 KB não desce para `/404`, e a ausência é decisão.** Um endereço que não
existe não tem critério a afrouxar. As saídas dali são endereços: as quatro maiores portas
do acervo — editorial 1.805, pessoa 575, mídia 529, verbete 481 — cada uma com o total
**medido por `consultar()`** no build, não lido da faceta. `out/404.html` pesa 15 KB contra
os 429 KB das outras duas.

### Os 31 gates dos becos, saída literal

```
ok   busca-nao-encontrada · a tela tem data-sem-resultado visível
ok   busca-nao-encontrada · data-beco declara qual beco é: «busca-nao-encontrada»
ok   D-93 · busca-nao-encontrada NÃO é tela vazia: 2 afrouxamento(s) e 1 trilha(s)
ok   D-93 · cada afrouxamento mostra QUANTOS resultados traria: 2 de 2 · prometidos=[300,8]
ok   D-90 · a trilha relacionada vem com o número, no singular que o acervo sustenta: 1 de 1
ok   busca-nao-encontrada · barra de abas presente como o grupo de rotas manda: true
ok   D-93 · tem caminho de volta visível: 6 link(s) interno(s)
ok   D-93 · a saída cabe na PRIMEIRA VISTA, medida contra moldura menos a barra de abas
     (70px): base da saída=210 · limite=807
ok   busca-nao-encontrada · a tela não transborda na horizontal: 0
   [os mesmos 9 para agenda-nao-encontrada · prometidos=[300,12]]
   [os mesmos 9 para 404 · prometidos=[1805,575,529,481] · barra AUSENTE ·
    saída=248 contra limite=876, medida contra a moldura inteira]
ok   T-05-29 · clicar no afrouxamento entrega o número: prometido=300 · entregue=300
ok   e o afrouxamento é aplicado SEM NAVEGAR
ok   zero requisição para fora do servidor local: 0
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 31 gates verdes
```

---

## Julgamento visual — quatro telas fotografadas e OLHADAS

O plano lembra que três vezes um gate passou verde sobre tela visivelmente quebrada. As
fotos foram tiradas fora do repositório e **olhadas**, uma a uma:

| foto | o que mostra |
|---|---|
| `05-06-filtros.png` | cabeçalho colado com «5.092», as 8 dimensões, as zeradas com borda tracejada e o zero declarado |
| `05-06-filtros-zero-marcado.png` | Audiodescrição marcada, contador em **0**, e a explicação do zero ao lado do próprio controle |
| `05-06-filtros-web.png` | duas colunas, critérios à esquerda em `.web-coluna-fixa`, «o que este acervo não recorta» à direita |
| `05-06-404.png` | quatro portas com número, as cinco abas em texto, denominadores e a trilha |
| `05-06-agenda-nao-encontrada.png` | saída no topo, a interseção 0 declarada, a vizinhança de literatura paraibana |
| `05-06-afrouxamento-aplicado.png` | os 300 entregues, listados, com «Mostrando 12 de 300» declarado |

Uma correção veio **da foto e não de gate nenhum**: «Você pediu eventos situados **em**
Paraíba» pedia «na». Trocado por «no território «Paraíba»», que é a forma que serve aos 108
territórios do índice sem escolher artigo por gênero e número, um a um.

---

## Verificação — comandos e saída literal

| suíte | resultado |
|---|---|
| `npm run build` | ✓ Compiled successfully · 2.463 páginas |
| `npm run verificar-comentado` | **TUDO PASSOU** |
| `npm run verificar-fase2` | **TUDO PASSOU** — 0 erro, 0 aviso em 26 navegações |
| `npm run verificar-fase4` | **vermelha só na âncora de 1.784 páginas** — 93 verdes com a âncora movida numa cópia fora do repositório |
| `npm run verificar-fase3` | **vermelha no gate 8** (`globals.css` ancorado em `c03f627`), herdada de 05-01 — não consertada, como o plano manda |

O gate de DP-F da fase 3 mediu, com meus dois componentes de cliente já dentro:

```
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira):
     0 violações em 31 clientes
```

### Orçamento de chunks

```
peso de out/_next/static/chunks: 1.452 KB · teto 1.600 KB
```

**Este número não é atribuível a este plano.** Ele foi medido sobre um `out/` que já contém
o trabalho dos seis executores da onda 2 — 05-01 tinha medido 1.045 KB antes dela. O teto de
80 KB deste plano não pôde ser isolado numa árvore compartilhada por seis agentes, e digo
isso em vez de reivindicar um número que não separei. O que **é** deste plano e **foi**
medido: o DTO de acessibilidade, **12.736 bytes de um teto de 30.720**.

### As folhas alheias

```
git diff --cached --name-only | grep -E "globals.css|estilos/web.css|busca.css|frase.css"
→ nenhuma
```

`src/app/globals.css` não foi aberto. `web.css` foi **consumida** (`.web-coluna-fixa`) e não
editada.

---

## O contrato `data-*` deste plano

**Os dez do plano, todos emitidos:**

| atributo | onde | valores |
|---|---|---|
| `data-filtros` | a raiz de `/filtros` | — |
| `data-dimensao-acessibilidade` | cada um dos 8 controles | o campo da dimensão |
| `data-declarado-ausente` | o controle «só o que declarou a ficha» | `declara` |
| `data-nao-declarado` | o controle «só o que nunca declarou» | `nao-declara` |
| `data-criterio-inexistente` | faixa etária | `faixa-etaria` |
| `data-contador-vivo` | o contador de `/filtros` **e** o de um afrouxamento aplicado | o número |
| `data-sem-resultado` | as três telas de beco **e** o zero de `/filtros` | o id do beco / `filtros` |
| `data-afrouxamento` | cada saída de beco | `campo:valor` |
| `data-beco` | as três telas de beco | `busca-nao-encontrada`, `agenda-nao-encontrada`, `404` |
| `data-trilha-relacionada` | a trilha curada | o slug |
| `data-nao-sustenta` | as 5 zeradas e a gratuidade | `acessibilidade:<campo>`, `sem-lastro:gratuidade` |

**Cinco ACRESCENTADOS**, nenhum renomeando nem alterando o conjunto de valores de um
original:

| atributo | onde | por quê |
|---|---|---|
| `data-limpar-filtros` | o botão «limpar tudo» | o gate precisa de um alvo estável para o gesto |
| `data-afrouxamento-resultados` | cada saída de beco | o número PROMETIDO, para o gate comparar com o entregue |
| `data-afrouxamento-tipo` | idem | `remover`, `manter-apenas`, `descoberta` |
| `data-resultado-afrouxado` | cada item da lista pós-clique | prova que o afrouxamento entregou conteúdo, não só um número |
| `data-perto-no-grafo` | cada vizinho por `semelhante_a` | a classe do vizinho |
| `data-coluna-criterios` / `data-coluna-saida` | os dois invólucros de coluna de `/filtros` | o gate mede o RETÂNGULO das colunas, não a classe |

**`data-denominador` é reaproveitado** com a mesma semântica que 05-01 registrou — «este
número é um denominador medido» — em 14 lugares de `/filtros` e nos becos.

---

## Deviations from Plan

### 1. [Rule 2 — funcionalidade crítica ausente] O terceiro universo, e o denominador que não fecha

**Encontrado em:** Task 1
**Problema:** o plano pede `declaradaVerdadeira` = 56 (que é a contagem entre `ic`) com
`entreAsQueDeclaram` = 5.108 (que conta as 7.810). São escalas diferentes. Para as 5
zeradas o zero é zero nas duas, então a frase «0 de 5.108» é verdadeira de qualquer modo —
mas para Libras a tela mostraria 56 e o contador ao vivo entregaria 49, sem nada explicando
a diferença.
**Correção:** o módulo exporta **os três** — `declaradaVerdadeira` (56, `ic`),
`incluindoDerivadas` (180, as 7.810) e `noIndice` (49, as 5.092) — mais dois denominadores
(`entreAsQueDeclaram` 5.108 e `entreAsQueDeclaramNaFonte` 2.603), e a linha de cada dimensão
nomeia os três na tela.
**Arquivos:** `src/dados/filtros.ts`, `src/componentes/filtros.tsx` · **Commits:** d6f4ff9, 48be5c2

### 2. [Rule 1 — defeito] A vizinhança do beco era genérica

Descrita acima. Trocar o afrouxamento mais generoso pelo menos generoso transformou «os
quatro primeiros eventos do acervo» em vizinhos topicamente ligados ao que se pediu.
**Commit:** fb0591f

### 3. [Rule 1 — defeito, achado por FOTO] «em Paraíba»

Nenhum gate pegou. A foto pegou. **Commit:** fb0591f

### 4. As portas do `/404` diziam «começar de novo por conteudo»

`facetas.classe` carrega o nome interno da ontologia. Um mapa de rótulos em português entrou
em `filtros.ts` com a **duplicação declarada** — o mesmo mapa é privado em `buscar.tsx` e
`cartao.tsx`, e os dois são somente leitura para este plano. Registrado aqui em vez de ficar
implícito, no mesmo espírito de `ROTULO_DIMENSAO`. **Commit:** fb0591f

### 5. A sonda de TDD não virou commit `test(...)`

A Task 2 e a Task 3 são `tdd="true"`, o que normalmente pede um commit `test(...)` antes do
`feat(...)`. Mas o artefato de teste deste plano é `scripts/sonda-05-06.ts`, que
`<sonda_do_plano>` manda **apagar antes do último commit**, com `scripts/` byte a byte como
estava — o mesmo que 05-01 fez. As duas instruções se contradizem; segui a mais específica e
o precedente da onda 1.

**O ciclo RED→GREEN foi cumprido e está documentado.** A sonda foi escrita ANTES da
implementação e rodada contra o `out/` sem `/filtros`:

```
FALHA a tela /filtros existe e abriu: {"view":null,"comentado":null,"filtros":false}
FALHA D-91 · há exatamente 8 controles de dimensão: 0
FALHA D-43 · declarado-ausente e não-declarado são DOIS controles distintos: {…false}
FALHA D-91 · faixa etária está na tela, nomeada, e NÃO é marcável: {"existe":false}
Error: clique falhou: elemento não encontrado
```

Esse RED também **corrigiu a sonda**: dois gates passaram verdes sobre listas vazias
(`D.every(...)` sobre 0 elementos é `true`). Foram apertados com `D.length === 8 &&` antes
do GREEN. Um gate que passa sobre o nada é o defeito que este projeto já pagou três vezes.

`git status --short scripts/` não mostra nenhum arquivo meu. Os três `sonda-05-0{3,4,5}.ts`
que aparecem ali são de executores concorrentes.

### 6. [colisão de índice entre executores] Dois arquivos de 05-02 entraram no meu commit

**Encontrado em:** o commit da Task 3, `fb0591f`
**O que aconteceu:** conferi o índice com `git diff --cached --numstat` e ele tinha
**só os meus 6 arquivos**. Entre esse comando e o `git commit`, o executor de 05-02 rodou
`git add` em `src/componentes/buscar.tsx` e `src/estilos/web-buscar.css`, e o commit levou
os dois junto.
**Nada foi perdido, e conferi:** o conteúdo em disco é idêntico ao que ficou no commit
(`git diff --quiet HEAD -- <arquivo>` sai limpo nos dois), e é o conteúdo de 05-02, não meu.
**Não reescrevi a história.** O commit já estava empurrado, e reescrever um commit que
outros cinco agentes podem ter buscado, para consertar atribuição, arriscaria o trabalho
alheio para ganhar cosmética.
**Para 05-02 e 05-08:** as mudanças de `buscar.tsx` (46.943 bytes) e `web-buscar.css` (7.675
bytes) estão em **`fb0591f`**, sob a mensagem de 05-06. Se 05-02 for procurá-las no próprio
histórico, não vai achar.
**Lição operacional para a próxima onda paralela:** `git add` seguido de `git commit` **não
é atômico** numa árvore compartilhada. A forma segura é `git commit -- <caminhos>`, que
commita só os caminhos dados, seja qual for o estado do índice.

### 7. STATE.md não foi tocado

O orquestrador proibiu `state.update-progress` e `state.record-metric` (zeraram a
porcentagem quatro vezes). Além disso, `state.advance-plan` e `state.add-decision` escrevem
o mesmo arquivo, e **seis executores concorrentes escrevendo STATE.md é a colisão que o
merge não resolve**. Nenhum dos cinco irmãos o tocou; `stopped_at` segue em
«Completed 05-01-PLAN.md». Deixei para o orquestrador/05-08, que fecha a onda, e registrei
tudo aqui. `ROADMAP.md` também não foi tocado, pelo mesmo motivo.

---

## Known Stubs

Nenhum. As três telas de beco e a de filtros consomem dados reais do grafo; não há valor
vazio, texto de espera nem componente sem fonte de dados.

O que **parece** stub e não é: as 5 dimensões de acessibilidade que devolvem zero. Elas
devolvem zero **porque o acervo mede zero**, o número está declarado na tela antes da
marcação, e o módulo derruba o build se essa contagem mudar sem a frase mudar junto.

---

## Threat Flags

Nenhuma superfície nova. Este plano não instala pacote nenhum (T-05-SC), não abre endpoint,
não toca autenticação e não altera esquema. As sete mitigações do registro foram
exercitadas: T-05-26 (5 declarações com número, medidas no DOM), T-05-27 (dois controles
distintos com 5.108 e 2.702), T-05-28 (faixa etária não marcável, medido `marcavel:false`),
T-05-29 (300 prometidos, 300 entregues), T-05-30 (`/404` com 10 links e saída a 248 px de um
limite de 876), T-05-31 (as três rotas medidas e a conta 529+3 fechada), T-05-32 (DTO de
12.736 bytes contra teto de 30.720).

---

## Self-Check: PASSED

Arquivos, conferidos em disco **e nos bytes dentro do git**:

```
FOUND src/dados/filtros.ts                            41203 bytes (git: 41203)
FOUND src/componentes/filtros.tsx                     28215 bytes (git: 28215)
FOUND src/componentes/sem-resultado.tsx               13964 bytes (git: 13964)
FOUND src/app/not-found.tsx                            1858 bytes (git: 1858)
FOUND src/app/(app)/filtros/page.tsx                   2224 bytes (git: 2224)
FOUND src/app/(app)/busca-nao-encontrada/page.tsx      1513 bytes
FOUND src/app/(app)/agenda-nao-encontrada/page.tsx     1324 bytes
FOUND src/estilos/filtros.css                         12069 bytes (git: 12069)
FOUND src/estilos/sem-resultado.css                    8433 bytes (git: 8433)
```

Nenhum leu zero byte. Commits: `d6f4ff9`, `48be5c2`, `fb0591f` — os três presentes em
`git log` e empurrados para `espelho`.
