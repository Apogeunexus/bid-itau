---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 03
subsystem: mapa-e-territorio
tags: [mapa, svg, projecao, desertos-culturais, procedencia, D-59, D-60, D-61, D-62]
status: complete
requires:
  - src/dados/grafo.ts (porId, porSlug, slugsPorTipo, vizinhos)
  - scripts/dados/centroides.json (as 27 unidades federativas)
  - src/dados/gerado/vocabulario.json (cor de linguagem, D-08)
provides:
  - "src/dados/geo.ts :: coordenadaDe(entidadeId) — contrato consumido pelo plano 03-05"
  - "src/dados/geo.ts :: distanciaKm(a, b) — contrato consumido pelo plano 03-05"
  - "src/dados/geo.ts :: projetar, LIMITES, caminhoDe, agruparPinos, resolverRecorte, indiceDePinos, densidadePorUf"
  - "src/dados/contorno-brasil.ts :: CONTORNO_BRASIL, UNIDADES_FEDERATIVAS (27), rótulos de procedência"
  - "gramática de hash r/t/v — contrato de lente compartilhado com 03-01 e 03-04"
affects:
  - "/mapa"
tech-stack:
  added: []
  patterns:
    - "projeção equirretangular própria em SVG, sem biblioteca de mapa e sem requisição de rede (D-60)"
    - "agrupamento de pinos por GRADE, e não por raio: estável entre recortes diferentes"
    - "índice pré-projetado no build atravessa por propriedade; o componente de cliente nunca alcança o grafo (DP-F)"
key-files:
  created:
    - src/dados/geo.ts
    - src/dados/contorno-brasil.ts
    - src/componentes/desertos.tsx
    - src/estilos/mapa.css
  modified:
    - src/componentes/mapa.tsx
    - src/app/(app)/mapa/page.tsx
decisions:
  - "Projeção equirretangular, 10 unidades de viewBox por grau, viewBox 0 0 425 410 sobre lat 6,5..-34,5 e lon -75,5..-33,0"
  - "Agrupamento por grade de 1 grau (10 unidades), e não por raio, porque grade é estável entre recortes"
  - "«Registro» é o VÍNCULO entidade↔lugar, não a entidade: é a unidade que produz os 773 medidos, e a tela declara isso"
  - "Só os estados de registro ZERO ganham sigla visível no desenho; a concentração é dita pela intensidade e pela frase"
  - "Intensidade em raiz quadrada da fração do máximo — logarítmica achatava o Sudeste e apagava a leitura"
metrics:
  duration: "~2h40 (incluindo ~50min parados por eviction de iCloud)"
  completed: 2026-08-22
  tasks: 3
  commits: 3
actuals:
  tokens: 78000
  tasks: 3
  commits: 3
---

# Phase 03 Plan 03: Mapa e desertos culturais — Summary

Mapa como lente sobre um recorte, desenhado por projeção equirretangular própria em SVG sem
uma linha de biblioteca de mapa e sem uma requisição de rede — e, dentro dele, a camada de
desertos culturais, que mostra numa tela só que 59% do acervo territorializado está em dois
estados de 27 e que dois estados não existem no grafo.

## O que foi construído

### 1. A projeção (`src/dados/geo.ts` + `src/dados/contorno-brasil.ts`)

**Projeção escolhida: equirretangular simples.** `x` linear em longitude, `y` linear e
invertido em latitude. Uma constante só (`LIMITES`) alimenta o contorno, os 27 polígonos
estaduais e todos os pinos — duas projeções desalinhariam desenho e dado sem dar sintoma.

| item | valor |
|---|---|
| retângulo geográfico | lat **6,5 … −34,5** · lon **−75,5 … −33,0** |
| `viewBox` | **`0 0 425 410`** |
| escala | **10 unidades de `viewBox` por grau**, igual nos dois eixos |
| tamanho renderizado na moldura | 344 × 288 px |

O número redondo (10 u/grau) é deliberado: torna a projeção conferível de cabeça quando um
pino cai fora do lugar.

**O contorno é autorado.** Não há GeoJSON em disco e D-60 proíbe buscar um. `CONTORNO_BRASIL`
tem 108 pares `[lat, lon]` em **graus** (nunca em unidades de SVG — o arquivo é dado, a
conversão é código), mais os 27 polígonos estaduais. Dois rótulos exportados declaram isso na
tela.

**`coordenadaDe(entidadeId)`** resolve na ordem: coordenada própria → espaço ligado por
`situado_em` → território, subindo a hierarquia. Devolve `via` (`propria` | `espaco` |
`territorio`) porque o cartão do item precisa dizer por onde a posição veio. **Sem resolução
devolve `null`** — nunca um ponto padrão (T-03-16).

**`distanciaKm(a, b)`** — haversine, aceita qualquer `{lat, lon}` (uma `Coordenada` satisfaz
a forma). Escrita aqui porque o plano **03-05** a consome na onda 2.

### 2. A lente (`src/componentes/mapa.tsx`)

Gramática de hash de três chaves, idêntica em 03-01, 03-03 e 03-04:

- `r` — chaves `{classe}_{slug}` juntadas por `~`
- `t` — título legível, `encodeURIComponent`
- `v` — endereço de volta, `encodeURIComponent`

**T-03-13 mitigado:** `v` só é aceito como caminho interno começando por `/` e não por `//`
nem `/\`. Recusado, a tela volta às duas voltas padrão da página **e diz que recusou**.

Sem hash, `/mapa` abre com o acervo situado no Brasil e diz em texto que **chegou sem
recorte** — mapa não é porta de entrada (D-59), e a tela precisa dizer isso.

**DP-F respeitado.** `mapa.tsx` é o único arquivo de cliente do plano e não importa
`@/dados/geo` nem `@/dados/grafo`, nem transitivamente: a página de servidor pré-computa
tudo no build e passa por propriedade.

### 3. Desertos culturais (`src/componentes/desertos.tsx`)

`densidadePorUf()` desce a hierarquia `situado_em` de cada estado e conta. **A lista das 27
vem da tabela de centroides, não do grafo** — o grafo conhece 25, e a diferença entre as duas
listas *é* o conteúdo da camada.

Três faixas visuais, todas derivadas da contagem medida:

| faixa | quem | tratamento |
|---|---|---|
| `registrado` | 20 estados | preenchimento laranja, intensidade = √(n/máximo) |
| `minimo` | os 5 com **um** registro | quase branco, mas preenchido — o estado existe no acervo |
| `vazio` | **Sergipe e Tocantins** | vazado, hachurado, contorno tracejado, **sigla visível** |

## Números medidos

**Geografia do acervo**

| medida | valor |
|---|---|
| entidades com posição resolvível | **1.380** de 7.810 |
| ... com coordenada própria | 472 (113 espaços · 359 territórios) |
| ... resolvidas pelo espaço | 232 |
| ... resolvidas pelo território | 676 |
| dentro do retângulo do Brasil | **941** · fora: **439** |
| recorte padrão (não-território, dentro do Brasil) | **790** |

**Índice que atravessa para o cliente**

| medida | valor |
|---|---|
| entradas | **1.380** |
| payload do índice (`JSON.stringify`) | **185.853 B = 181,5 KB** |
| `out/mapa/index.html` completo | 281.553 B = 275,0 KB |

Formato de tupla, e não de objeto: nomes de campo repetidos 1.380 vezes são bytes que a
apresentação carrega sem usar. O layout está documentado ao lado do produtor, em `geo.ts`.

**Agrupamento**

| medida | valor |
|---|---|
| raio | **10 unidades de `viewBox` = 1 grau ≈ 111 km** |
| estratégia | **grade** (célula de lado 1 grau), não raio |
| no recorte padrão | 790 registros → **88 pontos** |
| pontos que fundem mais de um pino | **40**, fundindo **742** dos 790 pinos |
| maior ponto | **226** registros (célula de São Paulo) |
| célula de Belém | **8 espaços** num pino só, com coordenadas distintas na 4ª casa |

Grade e não raio porque a grade é **estável entre recortes**: dois pinos ou caem na mesma
célula ou não, independentemente de quais outros pinos estejam na tela. Com raio, o mesmo par
apareceria fundido num recorte e separado em outro — quem chegou de Buscar veria um desenho
diferente de quem chegou de Acontece, e um mapa que muda de forma conforme quem olha não é um
mapa. O custo declarado é o artefato de fronteira.

**Desertos culturais — a contagem, medida no artefato exportado**

```
SP 274 · RJ 184 · MG 58 · PA 39 · RS 37 · BA 32 · DF 27 · PE 22 · PR 19 · CE 17
MA 10 · PB 9 · SC 9 · AM 8 · GO 8 · RN 5 · MT 3 · MS 3 · AC 2 · AP 2
AL 1 · ES 1 · PI 1 · RO 1 · RR 1 · SE 0 · TO 0
```

Total **773** · SP + RJ = **458 (59%)** · mediana **8** · cinco estados com **um** ·
**Sergipe e Tocantins com zero e `noGrafo: false`**.

## A frase exata de leitura da camada (`data-leitura-desertos`)

> **Desertos culturais**
>
> O que este mapa mede é **registro no acervo carregado do Itaú Cultural** — cada vínculo
> entre uma entidade e um lugar —, não oferta cultural do estado. Sergipe tem cultura; o
> acervo é que não a documenta.
>
> São Paulo tem 274 registros e Rio de Janeiro, 184: **458 dos 773, 59% do acervo
> territorializado em dois estados de 27**. 5 estados têm um registro só — Alagoas, Espírito
> Santo, Piauí, Rondônia e Roraima. E 2 não aparecem em lugar nenhum do grafo: **Sergipe e
> Tocantins têm zero**.
>
> **Essa concentração não é falha do acervo. É o diagnóstico que justifica a plataforma
> existir.**

Todo número da frase é interpolado de `densidadePorUf()`. Nenhum é escrito à mão: se o grafo
mudar, a frase muda com ele — e o gate para a execução em vez de acomodar a diferença.

## Verificação — comandos e saída real

**1. Traçador — a projeção, medida pelo retângulo que o navegador reporta**

```
OK tracador · SVG 344x288 · pino espaco:derivado:theatro-da-paz-belem
   em (0.617,0.194) do desenho · oeste/sul monotonicos
   · 0 requisicao externa · console limpo
```

Belém no terço norte (fy 0,194) e na faixa leste do retângulo (fx 0,617). Monotonicidade
conferida com pontos reais: Rio Branco sai a oeste de Belém, Porto Alegre sai ao sul.

**2. Lente**

```
OK lente · sem recorte 88 pinos · com recorte 1 · volta pela chave v
   · v externo recusado · cartao com metodo · console limpo
```

**3. Desertos — dados**

```
OK desertos · 27 UFs · total 773 · SP 274 + RJ 184 = 458 (59%) · mediana 8
   · zero: Sergipe, Tocantins · um so: Alagoas, Espírito Santo, Piauí, Rondônia, Roraima
```

E, re-conferido **no artefato exportado** (`out/mapa/index.html`), porque `npx tsx` ficou
indisponível ao fim da execução (ver Ambiente):

```
OK desertos no ARTEFATO EXPORTADO · 27 UFs · total 773 · SP 274 + RJ 184 = 458 (59%)
   · zero: SE, TO · um so: AL, ES, PI, RO, RR
```

**4. Desertos — tela**

```
OK camada · 27 UFs desenhadas · zero em SE, TO · um so em AL, ES, PI, RO, RR
   · leitura visivel e dentro da moldura · 88 pinos por cima
   · cabe na moldura (824/824)
```

**5. Disciplina de arquivo**

```
globals.css intocado: 0 mudancas
arquivos de cliente do plano: componentes/mapa.tsx (1) — nenhum alcança @/dados/grafo
```

`npx tsc --noEmit` limpo para os arquivos deste plano em todas as rodadas; `npm run build`
com código 0 e `✓ Compiled successfully`.

## Desvios do plano

### 1. [Regra 1 — Bug] A asserção de longitude do gate do traçador estava INVERTIDA

**Encontrado em:** Task 1, o traçador — exatamente o que ele existe para encontrar.

**Problema:** o `<verify>` do plano exigia `fx <= 0.55`, com a mensagem «Belem projetado a
direita do meio — a longitude esta invertida». Mas o Brasil vai de −74,0 a −34,8 de longitude
e o meio do retângulo é ≈ −54,2; **Belém, a −48,5, fica a LESTE do meio por construção**.
Uma projeção correta produz fx ≈ 0,62 e **falharia**; o gate só passaria com a longitude
espelhada. Seguir o gate teria produzido um mapa do Brasil invertido no eixo leste-oeste, com
todos os pinos e todos os 27 estados no lugar errado — e o desenho continuaria parecendo um
mapa.

**Correção:** a asserção virou `0.55 < fx < 0.75` (faixa leste esperada) e `fy < 0.35`
(terço norte, esta estava correta no plano), mais **duas asserções de monotonicidade medidas
em pontos reais**: Rio Branco (−9,97 / −67,81) tem de sair à esquerda de Belém, e Porto
Alegre (−30,03 / −51,23) tem de sair abaixo. É uma verificação mais forte do que a original,
porque não depende de eu ter escolhido bem os limites.

**Arquivos:** nenhum arquivo de produção mudou — a projeção sempre esteve certa. Mudou o gate.

### 2. [Regra 3 — Bloqueio] Os gates do plano chamavam uma API que não existe

**Problema:** os três blocos `<automated>` usavam `servir('out')` → `{base, encerrar}`,
`cdp.irPara`, `cdp.enviar` e `cdp.ao`. A API real é `servir({raiz})` → `{url, fechar}`,
`cdp.navegar`, e **`enviar`/`ao` não são expostos** no objeto devolvido por `abrirNavegador`.

**Correção:** os gates foram reescritos contra a API real, sem tocar em `scripts/` (fora da
minha lista de arquivos). A escuta de `Network.requestWillBeSent`, impossível sem `cdp.ao`,
foi substituída por `performance.getEntriesByType('resource')` medida **dentro da página** —
que captura tile, CDN e fonte remota do mesmo jeito e ainda roda sobre o artefato servido.
D-60 continua verificado, e por uma via que não depende de estender um arquivo compartilhado.

### 3. [Regra 3 — Bloqueio] Os ids do recorte no gate da Task 2 não existem no grafo

**Problema:** o gate usava `espaco_theatro-da-paz` e `espaco_museu-de-arte-de-belem-mabe`. Os
slugs reais, desambiguados na fase 1, são `theatro-da-paz-belem` e
`museu-de-arte-de-belem-mabe-belem`. O recorte resolveria **zero** entidades e o gate mediria
a tela errada relatando verde.

**Correção:** gate com os slugs reais.

### 4. [Regra 2 — Correção crítica] «773» é contagem de VÍNCULO, não de entidade

**Encontrado em:** Task 3, ao reproduzir a medição do plano.

**Problema:** o plano descreve a contagem como «entidades não-território situadas dentro de um
estado» e manda descer a hierarquia «do mesmo jeito que `porTerritorio` faz». Essa regra,
implementada literalmente, devolve **755** (e 718 entidades distintas no país inteiro), não
773 — e SP dá 266, não 274. A distribuição do plano só se reproduz **contando arestas
`situado_em`**: uma entidade que a Enciclopédia situa em duas cidades do mesmo estado produziu
dois registros de lugar. Essa regra devolve exatamente 773 / SP 274 / RJ 184 / cinco estados
com um / Sergipe e Tocantins em zero — a tabela do plano, linha por linha.

**Correção:** implementei a contagem por vínculo, que é a que o gate exige, **e a declarei na
tela**: a frase de leitura diz «cada vínculo entre uma entidade e um lugar». `DensidadeUf`
carrega também `entidades` (a contagem distinta) para que a outra leitura fique disponível sem
adivinhação. Um número de 773 apresentado como «entidades» seria uma afirmação falsa sobre o
acervo, e a fase inteira se apoia em não fazer isso.

### 5. [Regra 1 — Bug] Célula de agrupamento calculada sobre coordenada não arredondada

**Problema:** o índice viaja com uma casa decimal, mas a célula era calculada sobre a posição
cheia. Dois pinos perto de uma linha da grade caíam numa célula que a posição publicada não
explica: `agruparPinos` devolvia 88 grupos e a célula publicada, 86. Desenho e agrupamento
discordariam em silêncio.

**Correção:** arredonda antes de calcular a célula. Conferido: `agruparPinos: 88 · célula
publicada: 88 · iguais: true`.

### 6. [Regra 1 — Composição] A escala logarítmica apagava a leitura da camada

**Encontrado em:** Task 3, olhando a foto da tela — não no código.

**Problema:** a primeira versão usava `log(n+1)/log(máx+1)`. Medido na tela, um estado de 8
registros saía a 39% da intensidade de um de 274 e o Sudeste **deixava de saltar**: a imagem
perdia exatamente a leitura que ela existe para dar.

**Correção:** raiz quadrada da fração do máximo (8 → 17%, 184 → 82%). O Norte continua visível
e a concentração fica evidente. Junto: com a camada ligada os pinos recuam para 50% de
opacidade — sobre um coroplético a cor da linguagem competia com a intensidade do estado e as
duas se anulavam. Os pinos continuam visíveis, que é o que faz a sobreposição ser a leitura.

## Ambiente — o que não funcionou

**Eviction de iCloud parou a execução por ~50 minutos, e ainda está ativa.** Com o volume a
96%, dezenas de arquivos do projeto ficaram *dataless*: `stat` reporta o tamanho, a leitura
devolve zero bytes, e `brctl download` não os materializa. Atingiu, em momentos diferentes,
`scripts/navegador.mjs`, `scripts/servir-out.mjs`, `src/dados/tipos.ts`, `package.json`,
`package-lock.json`, `.git/info/exclude` e mais 30 arquivos de outros planos. Sintomas
observados: `git status` falhando com «cannot use .git/info/exclude as an exclude file»,
`git diff` morrendo com **SIGBUS** (exit 138) ao fazer mmap de arquivo dataless, e
`npx tsx` recusando com `ERR_INVALID_PACKAGE_CONFIG` por causa do `package.json` vazio.

O que fiz e o que **não** fiz:

- Esperei e reli em laço; `navegador.mjs`, `servir-out.mjs` e `tipos.ts` voltaram sozinhos, e
  os três gates de navegador rodaram verdes sobre o `out/` final.
- `package.json` **não** voltou, então o gate de dados foi re-conferido **no artefato
  exportado** em vez de por `tsx`. É uma verificação mais forte, não mais fraca: mede o que a
  banca vai abrir.
- **Não restaurei nenhum arquivo de outro plano.** Vários dos evictados
  (`src/dados/indice.ts`, `src/dados/alerta.ts`, `src/estilos/agenda.css`,
  `src/estilos/busca.css`) são trabalho em andamento de 03-01, 03-02 e 03-04, possivelmente
  não versionado. Restaurar do git teria destruído trabalho que não é meu, e recriar
  `.git/info/exclude` também não era necessário para commitar por caminho explícito.
- No commit da Task 3, o git imprimiu `error: short read while indexing
  src/app/(app)/evento/[slug]/page.tsx` — arquivo de outro plano, evictado. **Conferido: o
  commit contém exatamente os meus seis arquivos**, e `evento/[slug]/page.tsx` tem os mesmos
  11.539 bytes em `HEAD` e em `HEAD~1`. Nenhum dano colateral. Registrado em
  `deferred-items.md` porque o índice do git pode ter ficado com entrada suja para o próximo
  a commitar.

`npm run build` não pôde ser re-executado depois da última recuperação por causa do
`package.json` vazio; a última build bem-sucedida (`✓ Compiled successfully`) é **posterior a
toda mudança de código deste plano** — `out/mapa/index.html` às 06:49:40 contra a última fonte
alterada às 06:49:25, e o artefato contém o `data-sob-camada` da última edição.

## Contrato exportado para o plano 03-05 (onda 2)

```ts
coordenadaDe(entidadeId: string): CoordenadaResolvida | null
//   → { coordenada, metodo, via: "propria"|"espaco"|"territorio", origemId, origemTitulo }
//   → null quando o grafo não sustenta posição nenhuma. NUNCA um ponto padrão.

distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number
//   → haversine. Aceita `Coordenada` estruturalmente.
//   → herda a precisão da origem: duas entidades da MESMA cidade dão 0 km, porque o
//     centroide de município é um ponto só. Quem exibir distância precisa dizer isso.
```

Nenhuma das duas conhece SVG, `viewBox` ou pixel. `geo.ts` importa `@/dados/grafo` e portanto
**não pode ser importado por componente de cliente** (DP-F).

## Known Stubs

Nenhum. Todas as telas do plano leem dado medido; nenhum valor de UI é fixo.

## Threat Flags

Nenhuma superfície nova além do registro de ameaças do plano. As cinco mitigações previstas
estão implementadas e verificadas: T-03-13 (`v` só como caminho interno, gate confere que
endereço externo não vira link), T-03-14 (dois rótulos de procedência exibidos como texto de
produto), T-03-15 (a frase declara que mede registro no acervo), T-03-16 (`coordenadaDe`
devolve `null` e a entidade é contada fora do desenho), T-03-17 (zero requisição externa,
medida na página), T-03-18 (agrupamento por grade), T-03-19 (nenhum pacote instalado).

## Self-Check: PASSED

Arquivos conferidos em disco e commits conferidos em `git log`:

- `src/dados/geo.ts` — FOUND (25.128 B)
- `src/dados/contorno-brasil.ts` — FOUND (14.131 B)
- `src/componentes/mapa.tsx` — FOUND (16.414 B)
- `src/componentes/desertos.tsx` — FOUND (7.934 B)
- `src/estilos/mapa.css` — FOUND (6.971 B)
- `src/app/(app)/mapa/page.tsx` — FOUND (3.508 B)
- commit `3f0accb` — FOUND (traçador)
- commit `73a7058` — FOUND (lente)
- commit `1e700e2` — FOUND (desertos)
