---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 03
subsystem: web-evento-e-produtor
status: complete
tags: [web, evento, produtor, tabela, acessibilidade, WEB-03, APPX-05, D-79, D-80, D-90, D-43]

requires:
  - "src/estilos/web.css — .web-duas-colunas, .web-coluna-fixa, .web-painel (escritas e congeladas por 05-01)"
  - "src/dados/ponte.ts — vinculosDe, rotaDaEntidade, GrupoVinculo (a ponte da fase 2)"
  - "src/componentes/ponte.tsx — BlocoPonte e BlocoAusenciaDeclarada"
  - "src/dados/grafo.ts — porSlug, slugsPorTipo, vizinhos, ocorrenciasDe, temporadasDe"
provides:
  - "/evento/[slug]/ com layout de desktop na visão web: tabela de ocorrências e painel lateral colável"
  - "/produtor/[slug]/ preenchida nas 359 rotas — os sete blocos da tela 24, nenhum sumindo"
  - "src/componentes/produtor.tsx — a tela 24 como componente de servidor com DTO de primitivos"
  - "os denominadores dos produtores, MEDIDOS no build e memoizados"
  - "os atributos data-tabela-ocorrencias, data-coluna-acessibilidade, data-painel-aprofunda e data-bloco-produtor"
affects:
  - "05-08 mede o contrato data-* deste plano no HTML exportado e reancora verificar-fase3"
  - "05-08 reconcilia o total de páginas: medido 2.463 no fim desta execução"

tech-stack:
  added: []
  patterns:
    - "tabela de CSS grid por `subgrid` no <li>, e não por `display: contents` — o <li> continua tendo retângulo para os gates que contam visibilidade"
    - "colocação explícita por `grid-column` quando a ordem do DOM (que é a da visão app) diverge da ordem das colunas"
    - "coluna que não discrimina sai da tabela e vira frase COM DENOMINADOR (D-90 aplicado a layout)"
    - "reordenação de blocos por `display: contents` no invólucro + quatro `order`, mantendo UMA ordem de DOM"
    - "denominadores medidos no build e memoizados no módulo, nunca literais na frase"

key-files:
  created:
    - src/componentes/produtor.tsx
  modified:
    - src/app/(app)/evento/[slug]/page.tsx
    - src/app/(app)/produtor/[slug]/page.tsx
    - src/componentes/lista-ocorrencias.tsx
    - src/estilos/web-evento.css
    - src/estilos/produtor.css

decisions:
  - "os 327 e os 303 do plano são CONTAGENS DE ARESTA, não de produtor: medidos, 326 dos 359 têm território (327 arestas, um produtor tem duas) e 246 têm linguagem (303 arestas). As frases da tela trazem os números de produtor, que é o que a frase afirma"
  - "espaço NÃO realiza: 0 dos 113 têm uma aresta `realiza`. 87 deles ACOLHEM evento por `situado_em` chegando. A tela nomeia as duas arestas separadamente — chamar de «realiza» o que apenas acontece num espaço afirmaria uma relação que o grafo não tem"
  - "pessoas ligadas atravessam TAMBÉM os eventos acolhidos: por `realiza` são 115 dos 359, e com os acolhidos são 145. Os 30 a mais são todos espaços, que por `realiza` não alcançariam ninguém"
  - "`data-tabela-ocorrencias` existe no DOM nas DUAS visões porque o HTML é um só e a visão é estado de cliente. O gate mede GEOMETRIA e VISIBILIDADE, não presença — emitir o atributo só na web exigiria `if (visao === …)`, que D-79/D-05 proíbem e que `feed.tsx` registra por escrito como proibido"
  - "a coluna de condição e a de espaço saem da tabela quando não discriminam, e o fato vira frase com denominador ao pé: 2.425 de 2.425 ocorrências gratuitas, 0 esgotadas, 0 com espaço publicado. Três colunas iguais em 53 linhas roubam a largura das duas que informam"
  - "a data na tabela é a curta e a por extenso é a da visão app: «terça-feira, 8 de dezembro de 2020» pede 230 px e, em 53 linhas, devolve a rolagem que a visão web existe para acabar. As duas saem da MESMA string ISO por duas funções puras"
  - "o «selo de verificação» da tela 24 é a PROCEDÊNCIA, não um selo: um selo de «verificado» sem processo de verificação atrás afirmaria uma checagem que ninguém fez"

metrics:
  duration: "~2h30"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 6

actuals:
  tokens: 21047
  tasks: 3
  commits: 3
---

# Phase 5 Plan 03: Página do evento (web) e página do produtor Summary

A ficha do evento ganha densidade de desktop — 53 sessões em tabela com a acessibilidade em
coluna e «aprofunda isto» em painel colado ao lado — e a página do produtor deixa de ser
esqueleto nas 359 rotas, com os sete blocos da tela 24 e a lacuna que o acervo tem declarada
com o denominador medido em todas elas.

---

## O resultado, sem rodeio

**`/evento/[slug]/` na visão web.** Um evento do CMS com 53 sessões mostra uma tabela de
cinco colunas — data · horário · temporada · acessibilidade · salvar — com o cabeçalho
grudado ao topo e a tabela rolando por dentro, ao lado de um painel lateral de 352 px que
carrega «quem realiza», «quem atua e com que papel», «onde acontece», «aprofunda isto» e
«se não puder ir», e que **continua dentro da janela depois de 837 px de rolagem**.

**Na visão app a mesma rota é, item a item, a ficha da fase 2**: os nove marcadores de
bloco medidos na mesma ordem, os 53 cartões de sessão inteiros com data por extenso,
condição, espaço e botão, e **zero** elementos de tabela visíveis.

**`/produtor/[slug]/` nas 359 rotas.** Os sete blocos da tela 24 aparecem em todas as 359 —
**2.513 blocos no HTML exportado, 359 × 7, nenhum faltando em nenhuma rota**. As 359 trazem
`data-nao-sustenta="programacao-futura"` e ao menos uma ausência declarada.

**50 gates verdes na sonda, no DOM vivo. Console: 0 erro, 0 aviso. Rede: 0 requisição
externa.** As três suítes herdadas seguem verdes: `verificar-fase2` (67), `verificar-fase4`
(99) e `verificar-comentado` (43).

**Este plano não acrescentou rota nenhuma**: `out/produtor/` tem 359 e `out/evento/` tem 300,
os mesmos de antes.

---

## O ACHADO: os denominadores do plano eram contagens de ARESTA

O plano mediu, e mandou não redescobrir:

> **327** têm território por `situado_em`; **303** têm linguagem por `pertence_a`.

Os dois números existem no grafo e estão certos — **mas são arestas, não produtores**, e a
frase que a tela escreve é sobre produtores:

```
territorio · arestas 327 · PRODUTORES 326   (um produtor tem duas arestas de território)
linguagem  · arestas 303 · PRODUTORES 246   (uma instituição declara até três linguagens)
realiza    · arestas 527 · PRODUTORES 127   ← este o plano acertou, e é o que o gate afirma
```

Escrever «303 dos 359 declaram linguagem» ao lado de um acervo em que 246 declaram seria
inflar a cobertura em 23% numa frase de honestidade — exatamente o tipo de erro que estas
telas existem para não cometer. **A tela traz os números de produtor**, e nenhum deles é
literal: `numerosDosProdutores()` os mede contra o grafo a cada build e memoiza. No dia em
que o acervo for regerado, o número na tela muda junto.

O gate literal da Task 2 continua valendo e passa: ele só afirma `comRealiza === 127`.

```
OK medido: territorio=326 linguagem=246 realiza=127
```

### E a consequência de projeto: espaço não realiza nada

O plano fala em «os eventos que este produtor realiza». Medido, essa frase só cobre metade
do acervo:

| | instituições (246) | espaços (113) |
|---|---|---|
| território | 213 | **113 — todos** |
| linguagem | **246 — todas** | **0 — nenhum** |
| `realiza` saindo | 127 | **0 — nenhum** |
| evento por `situado_em` chegando | 0 | **87** |
| verbete com texto | 24 | **113 — todos** |
| imagem | 22 | 0 |

**Os 113 espaços não têm uma única aresta `realiza`.** Se «histórico» e «pessoas ligadas»
saíssem só de `realiza`, as 113 páginas de espaço teriam os dois blocos vazios — e, pior,
teriam vazios *por um recorte nosso*, não por lacuna da fonte.

A tela atravessa as **duas** arestas e as nomeia separadamente: a instituição **realiza**, o
espaço **acolhe** (`situado_em` chegando). Somá-las num «realiza» só faria a frase mentir
sobre a relação — é o mesmo cuidado que `motivoDaAresta` toma na ponte da fase 2 ao não
dizer «o evento atua na pessoa» porque a travessia veio do outro lado.

O efeito nas pessoas ligadas é grande:

```
pessoas alcançáveis a dois saltos, só por `realiza`            : 115 de 359
pessoas alcançáveis a dois saltos, com os eventos acolhidos    : 145 de 359
                                            os 30 a mais são todos espaços
```

---

## «O que está em cartaz agora» — o bloco que o acervo não sustenta em 359 de 359

Bloco obrigatório da tela 24. Medido pelos **três** caminhos possíveis:

```
produtores que realizam evento com ocorrência datada                       : 0 de 127
produtores que acolhem evento com ocorrência datada                        : 0 de  87
espaços que acolhem TEMPORADA cujo evento tem ocorrência datada            : 0 de  87
                                                            ⇒ 0 de 359
```

É a mesma lacuna que a fase 2 registrou por escrito: dos 129 eventos com sessão datada, zero
têm aresta de agente; dos 54 com elenco, zero têm sessão. As duas metades do acervo não se
tocam.

O bloco **não some** e **não aparece zerado sem explicação** (D-90). Ele leva
`data-nao-sustenta="programacao-futura"`, quatro denominadores medidos, e a frase que diz
por que o número é o que é e o que o fecharia. Texto na tela, com o modo comentado
desligado:

> Nenhum dos **359** produtores do acervo tem programação futura, e este não é exceção. Os
> **527** eventos que as instituições realizam e os **101** que os espaços acolhem vêm da
> Enciclopédia Itaú Cultural, que documenta o que aconteceu — com data histórica transcrita —
> e não o que está em cartaz. Os com evento datado são **0** porque as duas metades do acervo
> não se tocam: as sessões vêm da agenda do site, e os 100 registros de lá chegam sem agente
> nenhum. Programação futura é o que entra por aqui quando o produtor publicar no Studio. Não
> inventamos a aresta que encheria este bloco.

```
359 PRODUTORES NO ACERVO · 127 REALIZAM ALGUM EVENTO · 87 ACOLHEM ALGUM EVENTO · 0 COM EVENTO DATADO
```

Medido na sonda, nas cinco rotas de amostra e nas duas visões:

```
ok  D-90 · «o que está em cartaz agora» é PRODUTO: visível com o modo comentado DESLIGADO:
    visível=true altura=472px · 685 caracteres · dentro de <Comentario>=false · data-comentado=nao
```

**T-05-09 mitigada por construção**: nenhuma aresta produtor→evento datado foi autorada.

---

## A tabela, e as três decisões que ela exigiu

### 1. `subgrid`, e não `display: contents` no `<li>`

O caminho óbvio para uma tabela de CSS grid é `display: contents` na linha. Ele funciona e
**quebraria os gates herdados**: o `<li>` carrega `data-ocorrencia`, e `verificar-fase2`
conta ocorrências por `visiveis('[data-ocorrencia]')`, que mede `getBoundingClientRect`. Um
elemento `display: contents` não tem retângulo — a tabela ficaria perfeita na tela e o gate
da fase 2 passaria a contar zero.

Com `grid-template-columns: subgrid` no `<li>` a linha continua sendo uma caixa de verdade
**e** as colunas continuam alinhadas entre as linhas.

### 2. Colocação explícita por `grid-column` — o defeito que só a foto pegou

**A sonda estava verde e a tela estava errada.** As células existiam, eram visíveis, não
transbordavam — e «temporada» e «acessibilidade» apareciam meia linha ABAIXO da data.

A causa: a ordem do DOM é a da visão app, e nela as duas células novas ficam **depois** do
botão. A colocação automática do grid avança um cursor da esquerda para a direita; pedir a
coluna 3 quando o cursor já passou pela 7 joga a célula para a linha seguinte.

Corrigido com `grid-row: 1` em todas as células mais `grid-column` explícito em cada uma.
**É a terceira vez nesta obra que um gate passa sobre uma tela quebrada, e a terceira vez que
quem pegou foi a captura de tela.**

### 3. A coluna que não discrimina sai da tabela e vira frase com denominador

Medido: as **2.425 ocorrências do acervo são todas gratuitas, nenhuma está esgotada, e
nenhuma tem espaço publicado**. Três colunas com o mesmo valor em 53 linhas não informam nada
e roubam a largura das que informam. Apagá-las em silêncio esconderia um fato.

Então elas saem da tabela e o fato é dito uma vez, ao pé, com o denominador — que é D-90
aplicado a layout. **A decisão é medida por evento, não constante**: quando a condição ou o
espaço variarem entre as sessões, a coluna volta sozinha (`ocorrencias-condicao-uniforme` /
`ocorrencias-espaco-uniforme` só entram no `<ul>` quando o conjunto medido tem tamanho 1).

Larguras resultantes na coluna principal de 712 px, com as duas colunas vazias colapsadas
para zero por serem `auto` e não `fr`:

```
149px data · 76px horário · 232px temporada · 0px espaço · 116px acessibilidade · 0px condição · 135px salvar
scrollWidth=710  clientWidth=710   ← a tabela não corre para fora
```

---

## D-43 dentro da célula

A coluna de acessibilidade não achata «declarado ausente» e «não declarado» num «não tem».
Ela lê a ficha **da sessão** — `Ocorrencia` carrega a própria `acessibilidade` e o próprio
`declaraAcessibilidade` — e pinta os três estados de forma diferente: pastilha cheia para
declarado, contorno sólido para declarado-ausente, contorno **tracejado** e cinza para não
declarado.

No HTML exportado, contado sobre as 300 rotas de evento:

```
data-coluna-acessibilidade : 2.425 células  ← exatamente as 2.425 ocorrências do acervo
   ausente-declarada       : 2.303
   presente                :   122          ← as 122 ocorrências que declaram libras
   nao-declarada           :     0          (as sessões vêm todas do CMS, que preenche a ficha)
```

E a ficha das 8 dimensões, no evento da Enciclopédia, mostra os oito «NÃO DECLARADO» —
o outro lado da distinção, na mesma tela.

---

## A ponte da fase 2 não regrediu — ela ganhou um terceiro lado

O que a fase 2 provou continua medido e verde em `verificar-fase2`:

```
DESC-05  clique em «-B-A-B-I-L-A-Q-U-E-S-» leva de /artista/a-mattera/ a /evento/b-a-b-i-l-a-q-u-e-s/
DESC-06  clique em «A. Matterapessoaartista» leva de volta a /artista/a-mattera/; 12 vínculos com papel
DESC-08  ficha com 8 de 8 dimensões visíveis; a distinção de D-43 provada com ausente-declarada + presente
```

E a página do produtor acrescenta a **terceira travessia**, a dois saltos, com o evento do
meio do caminho escrito na linha:

> **28 patas furiosas** · COLETIVO · `artista`
> atua em **10ª Bienal de São Paulo**, que esta entrada realiza

O papel sai da aresta `atua_em` e de mais lugar nenhum (D-41, DADO-03). Não é um link solto:
é a relação nomeada, com as duas arestas visíveis na frase.

---

## Verificação — comandos e saída literal

### 1. Build

```
✓ Compiled successfully
✓ Generating static pages using 7 workers (2463/2463) in 70s
```

### 2. O contrato no HTML exportado

```
out/produtor/ : 359 rotas · 2.513 data-bloco-produtor (359 × 7, 0 rota com bloco faltando)
                359 com data-nao-sustenta="programacao-futura"
                359 com ao menos um data-ponte-ausente
                0 com TelaEsqueleto
out/evento/   : 300 rotas · 300 com data-painel-aprofunda
                129 com data-tabela-ocorrencias   ← exatamente os 129 eventos com sessão
                2.425 data-coluna-acessibilidade  (2.303 ausente-declarada + 122 presente)
```

### 3. A sonda — 50 gates no DOM vivo, 1440×960

```
ok   cms-53-sessoes · web · a lista de ocorrências É TABELA (grade), e não pilha:
     display=grid · 53 linhas de 53 declaradas
ok   cms-53-sessoes · web · cada linha tem célula de acessibilidade VISÍVEL:
     53 células visíveis para 53 linhas · estados=["ausente-declarada"]
ok   cms-53-sessoes · web · a tabela NÃO corre para fora: scrollWidth=710 clientWidth=710
ok   cms-53-sessoes · web · o cabeçalho fica GRUDADO ao topo da tabela depois de rolar:
     rolou 3759px por dentro · topo relativo antes=1 depois=1 · visível=true
ok   cms-53-sessoes · web · D-80 · ficha e painel LADO A LADO, medidos pelo retângulo:
     principal={"x":176,"y":362,"w":712,"h":1352} lateral={"x":912,"y":362,"w":352,"h":920}
ok   cms-53-sessoes · web · o painel cabe na PRIMEIRA VISTA (moldura menos a barra de 59px):
     topo do painel=362 · janela=960 · limite=901 · 7 blocos
ok   cms-53-sessoes · web · D-80 · o painel é STICKY: position=sticky · rolou 837px ·
     topo antes=362 depois=13 · dentro da janela=true
ok   cms-53-sessoes · app · os blocos aparecem NA ORDEM DA FASE 2, medida pelo topo:
     título@218 → ocorrências@455 → verbete@9901 → quem realiza@10131 → quem atua@10240 →
     onde acontece@10447 → ficha de acessibilidade@10603 → aprofunda isto@11028 →
     se não puder ir@13225
ok   cms-53-sessoes · app · NADA da tabela aparece: display=flex · cabeçalhos=0 ·
     colunas de acesso=0 · temporadas=0 · notas=0
ok   cms-53-sessoes · app · o cartão de sessão da fase 2 está inteiro:
     53 ocorrências · 53 condições · 53 espaços · 53 botões
ok   enciclopedia-bienal · web · evento SEM sessão datada: nenhuma tabela, e a data
     histórica declarada: data-ocorrencias-total=0 · «05.10.1973 - 02.12.1973»
ok   instituicao-rica · mobile · os SETE blocos da tela 24 estão na tela: 7 de 7 visíveis
ok   espaco-vazio · mobile · os SETE blocos da tela 24 estão na tela: 7 de 7 visíveis
ok   D-90 · «o que está em cartaz agora» é PRODUTO: altura=472px · dentro de <Comentario>=false
ok   os denominadores medidos estão na tela: ["produtores","com-realiza","com-acolhe","com-evento-datado"]
ok   zero requisição para fora do servidor local: 0 externas
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 50 gates verdes
```

As cinco rotas de produtor medidas cobrem os quatro casos que existem no acervo:
instituição rica (5 eventos, 21 pessoas), instituição só com território, instituição sem
nada, espaço que acolhe, espaço sem nada.

**A sonda foi apagada.** `scripts/` está byte a byte como estava — o `git status --short
scripts/` só mostra as sondas de 05-04 e 05-05, que são de outros executores.

### 4. As suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-fase2` | **TUDO PASSOU** — 67 verdes, 0 erro em 26 navegações |
| `npm run verificar-comentado` | **TUDO PASSOU** — 43 verdes |
| `npm run verificar-fase4` | **99 verdes, 1 falha** — só o total absoluto de páginas, ver abaixo |
| `npm run verificar-fase3` | **vermelha no gate 8**, herdada de 05-01, não consertada aqui |

### 5. Peso, medido por DOIS builds seguidos

O plano dá 20 KB de orçamento. Medido revertendo **só os arquivos de cliente** deste plano
(`lista-ocorrencias.tsx` e a página que o alimenta), buildando, e buildando de novo com eles:

```
chunks SEM as mudanças de cliente do 05-03 : 1.306.815 bytes
chunks COM                                  : 1.310.254 bytes
DELTA                                       :     3.439 bytes  (3,4 KB de 20 KB)
```

`produtor.tsx` custa **zero** byte de cliente: é componente de servidor, sem `"use client"`,
e o gate transitivo de DP-F o confirma — `0 violações em 32 clientes`, e ele não está entre
os 32.

### 6. Rede e console

`performance.getEntriesByType('resource')`: **0 requisição externa**. Console limpo nas duas
visões, nas seis rotas medidas.

### 7. `git diff --stat` não mostra `globals.css` nem `web.css`

```
$ git log --oneline 03d0ae6~1..HEAD --name-only | grep -E "globals.css|estilos/web.css"
nenhum: globals.css e web.css intocados pelos meus 3 commits
```

---

## O total de páginas, para 05-08 reconciliar

**MEDIDO NO FIM DESTA EXECUÇÃO: 2.463 páginas** em `out/`, fora de `out/_next/` e
`out/acervo/`.

**Este plano não acrescentou nenhuma delas.** As 359 rotas de produtor e as 300 de evento já
existiam e continuam sendo 359 e 300; `generateStaticParams` das duas ficou intocado.

O número é um alvo móvel enquanto a onda 2 roda: 05-06 registrou 2.463 e 3 rotas novas, 05-07
registrou 529 rotas de player. **05-08 é quem soma.** Por isso o gate da Task 3 deste plano
afirma só o que é deste plano — `out/produtor/` tem exatamente 359 — e imprime o total sem
afirmá-lo.

---

## Deviations from Plan

### 1. [Regra 1 — o número não sustentava a frase] 327 e 303 são arestas, não produtores

- **Found during:** Task 2, antes de escrever a primeira frase de ausência
- **Issue:** o plano manda «confirme e siga; não redescubra» sobre «327 têm território» e
  «303 têm linguagem». Os dois números são contagens de ARESTA. Produtores: **326** e **246**.
- **Fix:** `numerosDosProdutores()` mede os dois no build e a tela escreve o número de
  produtor. O gate literal da Task 2 (`comRealiza === 127`) continua passando.
- **Commit:** `d7ba073`

### 2. [Regra 2 — funcionalidade crítica ausente] espaço acolhe, não realiza

- **Found during:** Task 2
- **Issue:** «os eventos que este produtor realiza» cobre 127 instituições e **nenhum** dos
  113 espaços. Sem a segunda aresta, 113 de 359 páginas teriam «histórico» e «pessoas
  ligadas» vazios por recorte nosso, não por lacuna da fonte.
- **Fix:** a travessia percorre `realiza` saindo **e** `situado_em` chegando, e a tela nomeia
  as duas separadamente («O que esta entrada realiza» × «O que já aconteceu aqui»). Pessoas
  ligadas passou de 115 para 145 dos 359.
- **Commit:** `45ffb97`, `d7ba073`

### 3. [Regra 1 — o gate literal era impossível sem quebrar D-79] `data-tabela-ocorrencias` na visão app

- **Issue:** o plano pede que «na visão app NENHUM elemento carregue `data-tabela-ocorrencias`».
  O HTML exportado é **um só** e a visão é estado de cliente lido do `localStorage`: emitir o
  atributo só na web exige `if (visao === …)` dentro do componente. `feed.tsx` registra por
  escrito que isso é proibido («não há nenhum `if (visao === …)` neste arquivo — um ramo em
  JavaScript por visão»), e D-79/D-05 dizem o mesmo.
- **Fix:** o atributo existe nas duas visões; o **layout de tabela** só existe na web, e é ele
  que o gate mede — `getComputedStyle(ul).display === 'flex'` na app contra `'grid'` na web,
  mais zero cabeçalhos, zero colunas de acessibilidade e zero células de temporada visíveis.
  É o mesmo tratamento que 05-01 deu a `data-acontece-web`, que também existe no HTML da
  visão app e é medido por visibilidade.
- **Para 05-08:** o gate permanente deve medir `display` e visibilidade, não presença de
  atributo. Contar `data-tabela-ocorrencias` no HTML exportado dá **129**, e esse é o número
  certo: são os 129 eventos com sessão.

### 4. [Regra 1 — pego pela foto, não pelo gate] as células caíam para uma segunda linha

- **Found during:** Task 1, olhando a captura de tela com a sonda verde
- **Issue:** «temporada» e «acessibilidade» estão depois do botão no DOM — porque a ordem do
  DOM é a da visão app. A colocação automática do grid jogava as duas para a linha seguinte da
  subgrade. Todos os gates passavam: as células existiam, eram visíveis, não transbordavam.
- **Fix:** `grid-row: 1` em todas as células e `grid-column` explícito em cada uma.
- **Commit:** `03d0ae6`

### 5. [Regra 2] a coluna que não discrimina sai da tabela e vira frase com denominador

- **Issue:** 2.425 de 2.425 ocorrências são gratuitas, 0 esgotadas, 0 com espaço publicado.
  Em 53 linhas, três colunas constantes roubam a largura das que informam; e a frase de
  ausência de espaço, com 130 caracteres repetidos 53 vezes, é uma parede de texto.
- **Fix:** a uniformidade é **medida por evento** no componente; quando ela existe, a coluna
  sai e o fato é dito uma vez com o denominador ao pé da tabela. Quando o valor variar, a
  coluna volta sozinha.
- **Commit:** `03d0ae6`

### 6. [Regra 2] a data na tabela é a curta

- **Issue:** «terça-feira, 8 de dezembro de 2020» pede 230 px e, em 53 linhas, devolve duas
  linhas por sessão — a rolagem que a visão web existe para acabar.
- **Fix:** dois `<span>` no mesmo `<p>`, um por visão, montados da MESMA string ISO por duas
  funções puras. Não são dois dados, são dois formatos do mesmo.
- **Commit:** `03d0ae6`

### 7. [Autorizado pelo plano] `src/componentes/lista-ocorrencias.tsx` foi tocado

O plano autoriza («acrescente-os LÁ apenas como atributo e classe semântica… e registre no
SUMMARY que o arquivo foi tocado, para 05-08 medir que a visão app não mudou»). O arquivo
não está em `files_modified`. **O que mudou:**

| mudança | efeito na visão app |
|---|---|
| 3 campos OPCIONAIS em `OcorrenciaExibivel` (`temporadaId`, `recursosDeclarados`, `declaraAcessibilidade`) | nenhum — a chamada da fase 2 compila e renderiza igual sem passar nenhum |
| classes semânticas nos 4 elementos que já existiam | nenhum — classe não pinta nada sem regra |
| `<span>` de dia / separador / hora dentro do mesmo `<p>` | nenhum — o texto renderizado é caractere a caractere o mesmo |
| `<span>` curto de espaço ao lado do longo | nenhum — o curto nasce `display: none` |
| 2 células novas (`temporada`, `acessibilidade`) **no fim** do `<li>` | nenhum — nascem `display: none`, e ficam no fim para a ordem da app não mudar |
| linha de cabeçalho e nota ao pé da tabela | nenhum — nascem `display: none` |

Provado por medição, e não afirmado: os nove marcadores de bloco na mesma ordem
(`título@218 → … → se não puder ir@13225`), os 53 cartões com os quatro elementos da fase 2
(`53 ocorrências · 53 condições · 53 espaços · 53 botões`), zero elementos de tabela visíveis,
e `verificar-fase2` verde nas 26 navegações.

### 8. [Vocabulário] `data-bloco-produtor` acrescentado ao contrato

Não estava no vocabulário congelado por 05-01. É a chave de cada um dos sete blocos da tela
24 (`identificacao`, `territorio`, `em-cartaz`, `historico`, `pessoas`, `linguagens`,
`editorial`) e é por ele que se prova que nenhum bloco sumiu. **2.513 ocorrências no HTML
exportado.** Nenhum atributo de outro plano foi emitido; nenhum atributo existente foi
renomeado nem teve o conjunto de valores alterado.

`data-nao-sustenta` (fase 4) e `data-denominador` (compartilhado desde 05-01) são reusados
com a mesma semântica.

### 9. [Regra 3 — bloqueante, resolvido sem tocar `scripts/`] o gate do total absoluto

`verificar-fase4` aborta no gate 12, «total de páginas em out/», porque a onda 2 acrescenta
rota em paralelo — 2.463 medidos contra 1.931 da linha de base. Os 86 gates seguintes não
chegavam a rodar, e a suíte deixava de dar cobertura de regressão a este plano.

`scripts/` é somente-leitura aqui. Resolvido pelo **mesmo procedimento de 04-01 e 05-01**:
cópia efêmera em `.tmp-verificacao/`, com o gate afrouxado para `>=`, executada e apagada.
`git status --short scripts/` continua sem nenhum arquivo meu.

```
EXIT=0 · verdes: 99 · falhas: 0
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo): 0 violações em 32 clientes
ok   inserção de HTML bruto em src/: 0 ocorrências em 108 arquivos
ok   peso de out/_next/static/chunks: 1280 KB (teto 1.600 KB)
TUDO PASSOU.
```

**Para 05-08:** o gate precisa do novo total, e ele é a soma de todas as rotas da onda 2 —
este plano contribui com **zero**.

### 10. [Regra 2] o «selo de verificação» da tela 24 é a procedência

A tela 24 pede «nome, imagem, selo de verificação». O acervo não tem processo de verificação
de produtor. Um selo de «verificado» afirmaria uma checagem que ninguém fez, sobre
organizações reais. O bloco traz a **procedência** e a frase que diz que é ela, e não um
selo, que sustenta a entrada.

### 11. Bloco «território» em largura cheia na visão web

Primeira montagem: o painel de território ocupava metade da grade e a outra metade ficava
vazia — meia tela em branco que lê como defeito, não como decisão. Ele passou a atravessar as
duas colunas. **A visão web do produtor é Camada 3 e não é escopo desta fase**; o trabalho
aqui foi só não deixá-la feia.

---

## O protocolo de disco — resultado

**Nenhum arquivo leu zero byte nesta execução.** Conferência de disco contra
`git show HEAD:<caminho>` antes de cada primeira edição:

```
OK src/app/(app)/evento/[slug]/page.tsx (11539)     OK src/estilos/web-evento.css (1974)
OK src/componentes/lista-ocorrencias.tsx (10919)    OK src/estilos/produtor.css (1873)
OK src/app/(app)/produtor/[slug]/page.tsx (1358)
```

Nenhuma restauração foi necessária. A única reversão foi deliberada — a medição de peso em
dois builds — e o arquivo restaurado foi conferido byte a byte contra a cópia de segurança
(`lista-ocorrencias idêntica ao backup`) e contra o git.

Bytes conferidos **no git**, depois dos commits:

| arquivo | bytes no git |
|---|---|
| `src/componentes/produtor.tsx` | 23.466 |
| `src/componentes/lista-ocorrencias.tsx` | 21.511 |
| `src/estilos/web-evento.css` | 14.890 |
| `src/app/(app)/evento/[slug]/page.tsx` | 14.933 |
| `src/app/(app)/produtor/[slug]/page.tsx` | 11.469 |
| `src/estilos/produtor.css` | 6.817 |

Os três commits foram empurrados para `espelho` imediatamente depois de cada um.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | a ficha do evento na visão web — tabela, coluna de acessibilidade, painel lateral | `03d0ae6` | 3 |
| 2 | `produtor.tsx` — a entidade viva, com cada bloco vazio se declarando pelo número | `45ffb97` | 2 |
| 3 | `/produtor/[slug]` deixa de ser esqueleto nas 359 rotas | `d7ba073` | 3 |

---

## O que NÃO foi feito, e é de propósito

- **`globals.css` e `web.css` não foram abertos.** Contrato de 05-01, conferido no log.
- **`scripts/` não foi tocado.** O gate 8 de `verificar-fase3` continua vermelho, e é de 05-08.
- **`gerar-grafo` não foi rodado.** `dados/` intacto.
- **`state.update-progress` e `state.record-metric` não foram rodados**, pelo aviso registrado.
- **Nenhuma aresta foi autorada** para preencher «em cartaz».
- **Nenhuma dependência nova.** `package.json` intocado.
- **A visão web da página do produtor não foi desenvolvida além do necessário** — é Camada 3.

## Known Stubs

Nenhum. Os blocos que aparecem sem conteúdo não são stubs: são ausências declaradas, com o
denominador medido, pelo mecanismo `<BlocoAusenciaDeclarada>` que a fase 2 institui — e a
tela seria menos honesta sem eles.

## Threat Flags

Nenhuma superfície nova fora do registro do plano.

| ameaça | como foi mitigada |
|---|---|
| T-05-09 (autorar aresta para preencher «em cartaz») | nenhuma aresta autorada; o bloco declara `0 de 359` com a causa escrita |
| T-05-10 (`generateStaticParams` alterado) | intocado nas duas rotas; `out/produtor/` = 359 e `out/evento/` = 300, medidos |
| T-05-11 (DTO carregando entidade inteira) | DTO só de primitivo; `produtor.tsx` é componente de SERVIDOR e não está entre os 32 clientes varridos pelo gate transitivo de DP-F (0 violações) |
| T-05-12 (tabela transbordando) | `scrollWidth=710 clientWidth=710`, linha não transborda, documento `1440/1440`, e a captura de tela conferida |
| T-05-13 (HTML bruto de `resumo`) | `inserção de HTML bruto em src/: 0 ocorrências em 108 arquivos` |
| T-05-SC (pacote) | **zero dependência nova**; `package.json` intocado |

## Fotos

Guardadas **fora do repositório**, em
`/private/tmp/claude-501/-Users-macos-Desktop-Noz/9cf1ce91-fc81-4c87-a03c-5593442ab021/scratchpad/capturas-05-03/`:

- `05-03-evento-cms-53-sessoes-web.png` — **a tabela de 53 sessões** com o cabeçalho grudado,
  a coluna de acessibilidade e o painel lateral com a ponte nomeada
- `05-03-evento-cms-53-sessoes-app.png` — a ficha da fase 2 intacta na moldura de celular
- `05-03-evento-enciclopedia-bienal-web.png` — o outro evento: data histórica, verbete com
  crédito, as 8 dimensões em «não declarado», e 46 vínculos de realização na lateral
- `05-03-produtor-instituicao-rica-web.png` — os quatro denominadores em números grandes e
  **as pessoas ligadas a dois saltos, com o evento do meio do caminho na linha**
- `05-03-produtor-espaco-vazio-mobile.png` — o caso duro: um espaço quase sem dado, e mesmo
  assim com os sete blocos e a declaração

## Next Phase Readiness — o que 05-08 pode assumir

1. **O contrato `data-*` deste plano, medido no HTML exportado:**
   `data-tabela-ocorrencias` **129** · `data-coluna-acessibilidade` **2.425** (2.303
   `ausente-declarada` + 122 `presente`) · `data-painel-aprofunda` **300** ·
   `data-bloco-produtor` **2.513** · `data-nao-sustenta="programacao-futura"` **359**.
2. **Meça a visão app por VISIBILIDADE e por `display` computado, nunca por ausência de
   atributo.** O HTML é um só nas duas visões.
3. **`out/produtor/` = 359 e `out/evento/` = 300.** Este plano não acrescenta rota. O total
   medido no fim desta execução foi **2.463**, e é a soma da onda que 05-08 tem de fechar.
4. **`lista-ocorrencias.tsx` foi tocado** — está fora do `files_modified` do plano. A varredura
   de 05-08 tem de incluí-lo.
5. **`data-bloco-produtor` é novo no vocabulário.** Nenhum atributo existente foi renomeado.
6. **Os denominadores da tela do produtor são calculados no build**, em
   `numerosDosProdutores()` dentro de `produtor/[slug]/page.tsx`. Um gate que queira conferi-los
   deve medi-los contra o grafo, não contra um literal.

## O DESPEJO ACONTECEU — e onde ele pegou

**Durante o self-check, `.git/HEAD` passou a ler ZERO byte com `stat` informando 21.** O
repositório inteiro ficou inacessível: `git rev-parse` respondia «not a git repository» com o
`.git/` intacto ao lado. É exatamente o modo de falha que o plano descreve, desta vez sobre o
git e não sobre uma folha de estilo.

**O que foi feito, e o que NÃO foi feito.** `.git/HEAD` tem conteúdo integralmente
determinado — `ref: refs/heads/main\n`, 21 bytes, o mesmo que o `stat` informava. Foi
reescrito com esse conteúdo, e o `git symbolic-ref HEAD` voltou a responder `refs/heads/main`.
**`refs/heads/main` não foi tocado**: nenhum `git update-ref`, nenhum `--force`, nenhum
`reset`. A cópia do arquivo despejado foi guardada fora do repositório antes da reescrita, e
ela tem 0 byte — a prova do despejo.

Depois disso, as leituras de OBJETO passaram a matar o git com **SIGBUS (exit 138)**:

```
$ git --no-pager show "d7ba073:src/estilos/produtor.css"
exit=138 · stdout=0 · stderr=0
$ df -h /Users/macos
/dev/disk3s5  460Gi  421Gi  16Gi  97%
```

SIGBUS é a assinatura de um arquivo sem dado local sendo lido por `mmap` — o git mapeia os
objetos soltos em memória, e uma página que o iCloud despejou não falta de volta. **Não é
corrupção causada por este plano**, é o volume a 97%, e atinge o repositório inteiro.

**O trabalho está a salvo, e isso foi verificado onde o despejo não chega.** O espelho mora em
`/Users/macos/Projetos/Noz-espelho.git`, fora do Desktop e fora do iCloud, e os três commits
foram empurrados para lá imediatamente depois de cada um. O self-check abaixo foi feito contra
o espelho.

> **Aviso para 05-08 e para quem rodar em seguida:** o `.git/` deste diretório está com
> objetos despejados. Antes de qualquer operação que leia histórico, vale conferir o espelho.
> `refs/remotes/espelho/master` lê zero byte (41 segundo o `stat`) e faz `git status` e
> `git log --all` falharem com «bad object» — é despejo, não ref inválida, e não foi mexido.

## O SEGUNDO ACIDENTE DA EXECUÇÃO PARALELA — um `git add` de outro executor entrou no meu commit

Registrado por inteiro porque 05-08 vai encontrar o efeito no log e precisa saber a causa.

Ao commitar `REQUIREMENTS.md` com as marcas de WEB-03 e APPX-05, o `git add` foi de UM
arquivo e o `git commit` levou QUATRO:

```
$ git add .planning/REQUIREMENTS.md
$ git diff --cached --name-only
.planning/REQUIREMENTS.md
.planning/ROADMAP.md                                       ← não é meu
.planning/STATE.md                                         ← não é meu
.planning/phases/…/05-04-SUMMARY.md                        ← não é meu
```

**O índice do git é um só para os seis executores da onda.** Entre o meu `add` e o meu
`commit`, outro executor rodou o `add` dele, e o meu `commit` — que sem pathspec commita o
índice inteiro — levou junto. O commit é `5c1b619`.

**Nada foi perdido e nada foi apagado**, e isso foi conferido e não suposto:

```
OK .planning/REQUIREMENTS.md   (17.559 bytes, commit == disco)
OK .planning/ROADMAP.md        (20.905 bytes, commit == disco)
OK .planning/STATE.md          (18.611 bytes, commit == disco)
OK .../05-04-SUMMARY.md        (38.715 bytes, commit == disco)

git diff --diff-filter=D 5c1b619~1 5c1b619  →  (vazio: nenhuma deleção)
Progress do STATE.md: [███████░░░] 75% — íntegro, não zerado
```

O commit seguinte já usou a forma segura, `git commit -- <caminho>`, que commita o caminho
dado e ignora o resto do índice. **Fica a recomendação para a próxima onda paralela: em
`.planning/`, sempre `git commit -- <caminho>`, nunca `git add` seguido de `git commit`.**

`state.update-progress` e `state.record-metric` não foram rodados, pelo aviso registrado
quatro vezes. `ROADMAP.md` recebeu só a marca do 05-03 na lista de planos, por commit de
caminho único (`51e3af2`).

---

## Self-Check: PASSED

Verificado contra `/Users/macos/Projetos/Noz-espelho.git`, que não está no volume despejado:

```
03d0ae6 -> commit · feat(05-03): a ficha do evento na visão web — ocorrências em tabela…
45ffb97 -> commit · feat(05-03): produtor.tsx — a entidade viva do grafo…
d7ba073 -> commit · feat(05-03): /produtor/[slug] deixa de ser esqueleto nas 359 rotas

OK src/componentes/produtor.tsx              (23.466 bytes no espelho == disco)
OK src/app/(app)/evento/[slug]/page.tsx      (14.933 bytes no espelho == disco)
OK src/app/(app)/produtor/[slug]/page.tsx    (11.469 bytes no espelho == disco)
OK src/componentes/lista-ocorrencias.tsx     (21.511 bytes no espelho == disco)
OK src/estilos/web-evento.css                (14.890 bytes no espelho == disco)
OK src/estilos/produtor.css                  ( 6.817 bytes no espelho == disco)

globals.css e web.css nos 3 commits: OK intocados
```

Os 6 arquivos declarados existem, leem, e batem byte a byte com o que está no espelho. Os três
commits existem no espelho com as mensagens certas. `scripts/sonda-05-03.ts` foi apagada.
