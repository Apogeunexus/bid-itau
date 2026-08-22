---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 04
subsystem: redacao-fila-e-editor-de-trilha
status: complete
tags: [redacao, curadoria, veto, trilha, ia, WEB-05, WEB-06, D-82, D-83, D-84, D-85, D-86, D-90]

requires:
  - "src/dados/grafo.ts — porId, porSlug, slugsPorTipo, vizinhos, contagens (a única porta do acervo, D-16/D-47)"
  - "src/dados/trilha.ts — passosDaTrilha, trilhaCompletaPorSlug, trilhaEhPublicavel, trilhas"
  - "src/dados/motivo.ts — motivoDaAresta, o MESMO gerador de frase do cartão público"
  - "src/dados/alerta.ts — DATA_DE_REFERENCIA (2026-08-22), o carimbo que não vem do relógio"
  - "src/estilos/studio.css e src/estilos/web.css — vocabulário visual reusado POR CLASSE, sem edição"
provides:
  - "src/dados/redacao.ts — a fila das três origens, a regra do score, os três escopos, os passos do editor e o catálogo de arrasto"
  - "src/componentes/redacao-fila.tsx — a fila de moderação com o veto de duas travas"
  - "src/componentes/redacao-trilha.tsx — o editor com motivo obrigatório por passo"
  - "src/estilos/redacao.css — escrita por inteiro, e é a ÚNICA folha que este plano tocou"
  - "o vocabulário data-* de 05-04, medido no DOM vivo e no HTML exportado"
affects:
  - "05-08 compara data-motivo-passo do editor contra o selo de /trilha/[slug]/ caractere a caractere"
  - "05-08 reancora verificar-fase3 (gate 8) E verificar-fase4 (gate 17, contagem de páginas) — ver «Os gates vermelhos»"

tech-stack:
  added: []
  patterns:
    - "módulo de build puro, síncrono e memoizado, com falha alta e nomeada (molde de duplicatas.ts)"
    - "regra de recorte enviada como NOME DE CAMPO no DTO, não copiada como código nos dois lados da fronteira DP-F"
    - "duas travas por obrigação: `disabled` real + a função de registro recusando por conta própria"
    - "atributo de interação medido no DOM vivo depois do gesto, e contado esperando ZERO no HTML exportado"

key-files:
  created:
    - src/dados/redacao.ts
    - src/componentes/redacao-fila.tsx
    - src/componentes/redacao-trilha.tsx
  modified:
    - src/app/(bastidor)/redacao/fila/page.tsx
    - src/app/(bastidor)/redacao/trilha/page.tsx
    - src/estilos/redacao.css

decisions:
  - "o score existe SÓ nos itens de IA e é `null` nos outros dois: produtor e ingestão AFIRMAM, a IA ESTIMA, e pontuar as três origens achataria a distinção que a tela existe para fazer"
  - "a regra do score é cinco perguntas sobre a ficha da própria entidade, cada uma valendo 0,2, impressas uma a uma marcadas ou não — o número é conferível a olho, e não há gráfico porque barra esconde exatamente o critério que a tela mostra"
  - "a fila da IA usa RODÍZIO ENTRE AS FAIXAS de score em vez de amostragem proporcional, e a distribuição da população inteira fica declarada ao lado: proporcional traria uma fila quase toda entre 0,6 e 1,0 e a tela nunca mostraria o caso de confiança baixa, que é onde a decisão humana pesa"
  - "a tela abre no item de IA de MENOR score, por regra fixa: abrir num item de produtor mostraria uma ficha correta e nenhuma das perguntas que a tela existe para fazer"
  - "`repertorio` e `pessoa-usuaria` são excluídos dos candidatos de IA e do catálogo de arrasto: o grafo alcança os dois por aresta editorial, e alcance no grafo não é candidatura a publicação — propor «publicar o Repertório de Carlos» é sugerir tornar público o que é de alguém"
  - "a regra de recorte do escopo viaja como NOME DE CAMPO (`Escopo.campo`) e não como código copiado: `itemNoEscopo` não pode ser importado por valor do cliente (DP-F), e duas cópias de uma regra de recorte divergem em silêncio"
  - "o motivo do editor é o MESMO objeto `PassoTrilha.motivo` do selo público, por `passosParaEditor` → `trilhaCompletaPorSlug` → `passosDaTrilha`; a igualdade de D-85 é por construção, e o gate de 05-08 só a confirma"
  - "`data-score-ia` é atributo de LINHA e não se repete no painel do item aberto: repetido, a contagem no HTML exportado sai 21 quando os itens de IA são 20"

metrics:
  duration: "~2h15"
  completed: 2026-08-22
  tasks: 3
  commits: 4
  files: 6

actuals:
  tokens: 63000
  tasks: 3
  commits: 4
---

# Phase 5 Plan 04: Redação — a fila de moderação e o editor de trilha curada Summary

A pergunta mais difícil do RFP — **onde a IA não deve ser utilizada** — deixou de ser frase
de rodapé e virou mecânica: a sugestão da IA chega marcada com score e com a regra do score
ao lado, o botão de vetar **não conclui** com o campo de motivo vazio, e uma trilha com passo
sem motivo **não publica**, com a tela dizendo qual passo é.

**47 gates verdes no DOM vivo a 1440×960. Console: 0 erro, 0 aviso. Rede: 0 requisição
externa.** As duas obrigações — o veto e o motivo por passo — foram provadas **dirigindo o
gesto**, não observando o atributo: o gate clica no botão travado, força `Enter` e força
`submit`, e exige que **nenhuma decisão nasça**.

---

## O resultado, sem rodeio

### `/redacao/fila` (tela 34, WEB-05)

60 itens sobre **entidades reais do acervo**, 20 de cada origem. Toda linha declara
`data-procedencia-item`; **20 linhas têm `data-score-ia` e nenhuma outra tem**. O item aberto
ao chegar é o de IA com o **menor score da fila — 0,20** —, com os cinco componentes do score
listados um a um, todos desmarcados menos a URL de origem. Do lado, a regra por extenso.

Clicar «vetar» abre o campo de motivo. Com o campo vazio, o botão de confirmar tem
`data-veto-bloqueado="sim"` **e** a propriedade `disabled` verdadeira, e clicar nele — mesmo
forçando `Enter` e `form.submit()` — **não cria decisão nenhuma**. Espaço em branco também
não conta. Escrito o motivo, o botão libera e o clique cria **exatamente uma** decisão, que
guarda o texto literal, o nome de quem decidiu e o carimbo `22.08.2026, 11h20`.

### `/redacao/trilha` (tela 35, WEB-06)

O editor abre com os 3 passos da trilha do acervo, cada um com o motivo preenchido. **Os três
textos batem caractere a caractere com o selo que `/trilha/[slug]/` mostra ao público** —
medido pelos dois caminhos, atributo e `innerText`.

Acrescentar um candidato do catálogo cria um passo com **motivo vazio**. Nesse estado
`data-publicavel` vira `"nao"`, o bloco diz *«Passo 4 — «X» → «Y» está sem motivo»*, o botão
de publicar fica `disabled`, e forçar o clique não publica. Preenchido o motivo, volta a
`"sim"`.

A sugestão da IA traz o nó proposto, a frase **da própria aresta** e a regra que a produziu.
Descartá-la some com o bloco e **não altera a trilha**.

---

## Os números que o módulo imprimiu

```json
{"itensNaFila":60,
 "itensPorOrigem":{"produtor":20,"ingestao":20,"ia":20},
 "itensComScore":20, "scoreMinimo":0.2, "scoreMaximo":1, "componentesDoScore":5,
 "escopos":{"nacional":60,"territorial":19,"linguagem":50},
 "acoes":4, "acoesQueExigemMotivo":1, "limitesDaIa":3,
 "passosDaTrilha":3, "passosComMotivo":3,
 "catalogoItens":150, "catalogoElegiveis":3011, "catalogoTotal":7810,
 "bytesDoDto":57052, "tetoDoDto":61440}
```

### A faixa de confiança — o recorte E a população

| score | na população de candidatos | na fila |
|---|---|---|
| 0,20 | 1 | 1 |
| 0,40 | 9 | 5 |
| 0,60 | 68 | 5 |
| 0,80 | 110 | 5 |
| 1,00 | 36 | 4 |

Os dois números estão na tela, e nunca só o segundo. Publicar o recorte sem a população é
deixar quem lê tomar um pelo outro — e a população é fortemente enviesada para cima, porque
os candidatos são majoritariamente `conteudo` da Enciclopédia, que vêm com a ficha cheia.

---

## O que É o dado e o que É autorado — dito na tela

**A fila é encenada; as entidades não são.** Cada item aponta para uma entidade real e mostra
os campos dela. O que é autorado é a **atribuição de origem** e o **score**, e a tela declara
isso em `FRASE_DA_ATRIBUICAO`, no alto da coluna da fila, com a razão escrita: o acervo do
Itaú Cultural não publica quem submeteu um registro nem pontuação de confiança, e exibir
esses campos sem rótulo seria vestir texto nosso com o crachá do IC (T-02-10).

`PROCEDENCIA_DA_ATRIBUICAO` é **constante de módulo, não campo por item**: como valor
repetido custava 2,2 KB do orçamento de 60 KB para afirmar sessenta vezes a mesma coisa.

### As três origens, e a regra determinística de cada uma

| origem | regra | tem score? |
|---|---|---|
| `produtor` | evento com id `evento:cms:*` — registrado pelo próprio produtor no CMS | não |
| `ingestao` | evento com id `evento:enc:*` — lote automático da Enciclopédia | não |
| `ia` | entidade de outra classe alcançada, a partir de um evento da fila, por aresta editorial (`aprofunda`, `fala_sobre`, `dialoga_com`, `semelhante_a`) | **sim** |

Os 40 clones encenados da fase 4 (`procedencia: "autorado"`) ficam **fora** da fila: deixá-los
entrar poria o mesmo evento duas vezes com origens diferentes, e a tela passaria a demonstrar
o problema da fase 4 em vez do desta.

### A regra do score, que é o coração de D-82

Cinco perguntas sobre a ficha da **própria entidade**, cada uma valendo 0,2 — resumo com pelo
menos 120 caracteres, imagem declarada, crédito da imagem declarado, pelo menos duas
linguagens classificadas, URL de origem declarada. Nada de sinal de comportamento, nada de
popularidade, nada de modelo. O item abre com as cinco marcadas ou não, e quem confere a
conta chega ao mesmo número.

---

## A assinatura exportada — congelada para 05-08

### `src/dados/redacao.ts` (build, alcança o grafo — **só `import type` do cliente**)

| export | tipo | notas |
|---|---|---|
| `filaDaRedacao()` | `ItemDaFila[]` | memoizado; quebra alto se faltar uma origem ou se houver score fora da IA |
| `itemDaFilaPorId(id)` | `ItemDaFila \| undefined` | |
| `itemInicialDaFila()` | `string` | o item de IA de menor score; **é onde a tela abre** |
| `distribuicaoDeScore()` | `FaixaDeScore[]` | população × fila, por faixa |
| `escoposDeCuradoria()` / `ESCOPOS_DE_CURADORIA` | `Escopo[]` | `{id, rotulo, descricao, campo, alcance}` — `campo` é o despachante do recorte |
| `itemNoEscopo(item, campo)` | `boolean` | a mesma decisão que o cliente despacha |
| `declaracoesDaRedacao()` | `DeclaracaoDaRedacao[]` | as 4 ausências de D-90, com denominador medido |
| `passosParaEditor(slug)` | `PassoDoEditor[]` | **construído sobre `passosDaTrilha`; quebra alto se um motivo vier vazio** |
| `trilhaParaEditor(slug)` | `TrilhaDoEditor` | inclui `publicavelNoAcervo` de `trilhaEhPublicavel` |
| `slugDaTrilhaDoEditor()` | `string` | quebra alto se o grafo não tiver trilha |
| `sugestaoDeProximoPasso(slug)` | `SugestaoDeProximoPasso \| null` | travessia do grafo, frase da aresta |
| `catalogoParaArrastar()` | `CatalogoDeArrasto` | `{itens, total: 7810, elegiveis: 3011, regra}` |
| `numerosDaRedacao()` | `NumerosDaRedacao` | **é o que 05-08 mede contra a tela**; derruba o build acima de 61.440 bytes |
| `COMPONENTES_DO_SCORE`, `REGRA_DO_SCORE` | | os 5 componentes e a regra por extenso |
| `ORIGENS_DECLARADAS`, `ACOES_DA_REDACAO`, `LIMITES_DA_IA` | | 3 · 4 · 3 |
| `REGRA_DA_AMOSTRAGEM`, `POR_QUE_RODIZIO_NA_IA`, `REGRA_DO_CATALOGO`, `REGRA_DA_SUGESTAO`, `REGRA_DO_MOTIVO_OBRIGATORIO`, `FRASE_DA_ASSIMETRIA`, `FRASE_DA_ATRIBUICAO` | `string` | textos que citam números MEDIDOS |
| `CURADOR_AUTORADO`, `CURADOR_E_AUTORADO`, `CARIMBO_DA_DECISAO`, `DATA_DE_REFERENCIA_DA_REDACAO` | | autoria e carimbo de D-84 |
| `PROCEDENCIA_DA_ATRIBUICAO`, `ITENS_POR_ORIGEM` (20), `TAMANHO_DA_FILA` (60), `TETO_DO_CATALOGO` (150), `TOTAL_DE_ENTIDADES` (7810), `TETO_DO_DTO` (61440) | | |

### `src/componentes/redacao-trilha.tsx`

| export | notas |
|---|---|
| `CHAVE_DO_RASCUNHO` | `"agenda-cultural:rascunho-trilha"` — **chave nova**, declarada NA TELA em `data-chave-rascunho`. `src/contexto/sessao.tsx` não foi tocado. |

### O módulo quebra alto — provado, não afirmado

O teto de DTO disparou **sozinho, em produção**, e foi ele que me obrigou a aparar o DTO:

```
Error: DTO 71030 bytes, teto 61440
```

Aparado em três cortes declarados — `slug` fora do item (a rota já o carrega),
`procedenciaDaAtribuicao` virando constante de módulo, e o catálogo de 220 para 150 —, ficou
em **57.052 bytes**, 93% do teto.

---

## O vocabulário `data-*` de 05-04 — medido nos dois lugares

**Do contrato de 05-01, todos emitidos:**

| atributo | tela | no DOM vivo | no HTML exportado |
|---|---|---|---|
| `data-fila-redacao` | fila | 1 | **1** |
| `data-item-fila` | fila | 60 | **60** |
| `data-procedencia-item` | fila | 60 (`produtor` 20 · `ingestao` 20 · `ia` 20) | **60** |
| `data-score-ia` | fila | 20 | **20** |
| `data-acao-redacao` | fila | 4 (`aprovar`, `editar`, `vetar`, `devolver`) | **4** |
| `data-escopo-curador` | fila | 3 (`nacional`, `territorial`, `linguagem`) | **3** |
| `data-motivo-veto` | fila | 1 **depois do gesto** | **0 — de propósito** |
| `data-veto-bloqueado` | fila | 1 **depois do gesto** (`sim` → `nao`) | **0 — de propósito** |
| `data-decisao-redacao` | fila | 0 ao abrir · 4 depois dos gestos | **0 — de propósito** |
| `data-passo-trilha` | trilha | 3 (4 com o passo acrescentado) | **3** |
| `data-motivo-passo` | trilha | 3 | **3** |
| `data-publicavel` | trilha | 1 (`sim` ↔ `nao`) | **1** |
| `data-sugestao-ia` | trilha | 1 · **0 depois de descartar** | **1** |
| `data-limites-ia` | ambas | 1 cada, com 3 `<li>` | **1 cada** |
| `data-nao-sustenta` | ambas | 8 na fila · 1 no editor | **8 / 1** |

> **Os três zeros do HTML exportado são a medida certa, não a falta dela.**
> `data-motivo-veto`, `data-veto-bloqueado` e `data-decisao-redacao` só existem DURANTE uma
> interação. Contá-los no arquivo e concluir «não existe» é a armadilha que 04-03 nomeou e
> 04-05 virou gate. **05-08 deve contá-los esperando zero no arquivo e medi-los no DOM vivo
> depois de dirigir o gesto.**

**Seis atributos ACRESCENTADOS ao contrato**, nenhum renomeando nem alterando o conjunto de
valores de um atributo original — mesmo procedimento que 05-01 usou para os cinco dele:

| atributo | tela | exportado | por quê |
|---|---|---|---|
| `data-item-escolhido` | fila | 1 | qual item está aberto no painel |
| `data-candidato-catalogo` | trilha | 150 | cada candidato do catálogo de arrasto |
| `data-publicar` | trilha | 1 | o botão de publicar, para o gate ler `disabled` |
| `data-descartar-sugestao` | trilha | 1 | o controle de descartar de D-86 |
| `data-slug-trilha` | trilha | 1 | qual trilha o editor edita — o elo de 05-08 com `/trilha/[slug]/` |
| `data-chave-rascunho` | trilha | 1 | a chave de `localStorage`, declarada na tela |

**Reaproveitados de outras fases, sem alterar a semântica:** `data-nao-sustenta` (fase 4),
`data-realcado` + classe `.web-realce` (05-01, para a linha escolhida), `data-denominador`
(05-01, tratado como compartilhado como o próprio 05-01 pediu).

---

## Verificação — comandos e saída literal

### 1. Build

```
✓ Generating static pages using 7 workers (2463/2463) in 75s
```

**Este plano acrescenta ZERO rotas** — `/redacao/fila/` e `/redacao/trilha/` já existiam como
esqueleto desde a fase 1. O total saiu de 1.931 para 2.463 por causa de 05-06 (3 becos) e
05-07 (529 rotas de player), que correm em paralelo. Ver [Os gates vermelhos](#os-gates-vermelhos-e-o-que-05-08-precisa-reancorar).

### 2. A sonda — 47 gates no DOM vivo, 1440×960

```
  ok   D-82 · toda linha declara a origem, e as três estão representadas: {"produtor":20,"ingestao":20,"ia":20}
  ok   D-82 · score de confiança SÓ nos itens de IA: 20 com score · 20 de IA · 0 fora da IA
  ok   os scores atravessam uma faixa, e cabem em 0..1: mínimo 0.2 · máximo 1
  ok   a regra que produziu o score está na tela, fora de <Comentario>: {"visivel":true,"caracteres":563,"dentroDeComentario":false}
  ok   D-84 · os três escopos de curadoria estão no topo, cada um com o alcance medido:
       ["nacional","territorial","linguagem"] · topo máximo y=155
  ok   nada foi decidido sem um humano clicar: 0
  ok   clicar «vetar» abre o campo de motivo e o botão de confirmar
  ok   com o campo VAZIO o botão está de fato `disabled`, e o atributo reflete o botão:
       data-veto-bloqueado=sim · propriedade disabled=true
  ok   o campo de motivo E o botão travado cabem INTEIROS na primeira tela:
       {"botao":{"top":728,"bottom":763},"campo":{"top":572,"bottom":648},"janela":{"w":1440,"h":960}}
  ok   espaço em branco não é motivo — o botão continua travado: {"bloqueado":"sim","disabled":true,"valor":"\"   \\n  \""}
  ok   T-05-14 · clicar o botão travado (e forçar Enter e submit) NÃO registra decisão: 0 decisões
  ok   o veto com motivo cria EXATAMENTE uma decisão, e ela aparece: 1 decisão(ões)
  ok   D-83 · o motivo do veto fica GUARDADO com a decisão, literal
  ok   D-84 · a decisão traz quem decidiu e quando (carimbo DD.MM.AAAA do build):
       "vetado SUGESTÃO DE IA Teatro do Oprimido MOTIVO DO VETO Sem confirmação da fonte
        primária: a data diverge do que o produtor publicou. Redação · curadoria editorial
        (perfil autorado) · 22.08.2026, 11h20"
  ok   D-83/D-84 · aprovar, editar e devolver também registram, com autor e carimbo: 4 decisões
  ok   trocar o escopo NÃO troca de URL: /redacao/fila/ → /redacao/fila/ · nacional → territorial
  ok   o recorte territorial encolhe a fila, e não a zera: 56 itens → 19 itens
  ok   D-85 · o motivo do editor bate CARACTERE A CARACTERE com o selo público:
       3 passos · por atributo=true · por innerText=true
       passo 1: 117 caracteres · "quem ouve rap costuma chegar à poesia falada pela batida e pela rima — o"…
       passo 2: 167 caracteres · "do slam ao palco é um passo curto: nos dois a pessoa fala em primeira pe"…
       passo 3: 168 caracteres · "daqui a trilha sai da enciclopédia e vira agenda: um espetáculo de teatr"…
  ok   acrescentar um candidato cria um passo com motivo VAZIO: 3 → 4 passos · 1 sem motivo
  ok   D-85 · com passo sem motivo, data-publicavel=nao E o botão de publicar está `disabled`
  ok   a tela NOMEIA qual passo está sem motivo:
       "Esta trilha não publica 4 passo(s) Passo 4 — «“O veneno do teatro” traz thriller
        fascinante protagonizado por Osmar Prado e Maurício Machado» → «Arteatral» está sem motivo."
  ok   forçar o clique no botão travado não publica: nao
  ok   preenchido o motivo daquele passo, a trilha volta a publicável: {"publicavel":"sim","disabled":false}
  ok   T-05-15 · descartar a sugestão a remove da tela e NÃO altera a trilha: {"sugestoes":0,"passos":4}
  ok   T-05-17 · rascunho que não é lista devolve o editor à trilha do acervo, sem quebrar
  ok   D-05/D-79 · na visão app o editor NÃO aparece, e o aviso de superfície está no lugar:
       {"view":"mobile","passos":0,"candidatos":0,"aviso":true}
  ok   nada do editor sai da janela e a tela não rola na horizontal: 0 fora · 150 candidatos
  ok   zero requisição para fora do servidor local: 0
  ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 47 gates verdes
```

**A sonda foi apagada, como o plano manda.** `git status --short scripts/` não mostra
`sonda-05-04.ts`; `scripts/` está byte a byte como estava. (Restam ali `sonda-05-05.ts`, de
outro executor da onda 2 — não é meu e não foi tocado.)

### 3. As suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-comentado` | **TUDO PASSOU** |
| `npm run verificar-fase2` | **TUDO PASSOU** — 0 erro, 0 aviso em 26 navegações |
| `npm run verificar-fase3` | vermelha **só** no gate 8 (`globals.css`), herdado de 05-01 |
| `npm run verificar-fase4` | vermelha no gate 17 (contagem de páginas) — **não é deste plano**, ver abaixo |

Os gates de `verificar-fase4` que rodaram **antes** do vermelho e que interessam a este plano:

```
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo): 0 violações em 32 clientes
ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 76 telas
ok   folha de estilo importada de componente: 0 ocorrências em 108 arquivos
ok   nenhuma folha órfã em src/estilos/: 0 órfãs · 21 folhas no disco, 21 declaradas
ok   globals.css desde a consolidação (a40f380): 15 @import · 0 linha(s) de REGRA · 0 removida(s)
ok   o bloco :root com os hex do manual, byte a byte: 1562 bytes idênticos
ok   D-08 · token de cor de apoio em .ts/.tsx: 0 em código
ok   posicionamento preso à janela fora de casca.tsx: 0 em código
ok   inserção de HTML bruto em src/: 0 ocorrências em 108 arquivos
```

**Os dois componentes de cliente deste plano estão entre os 32 varridos, com 0 violações** —
a fronteira `import type` está provada mecanicamente, não afirmada.

### 4. O orçamento de chunks: 37 KB dos 60

Medido isolando os chunks **exclusivos** das duas rotas de Redação contra as outras 2.461
páginas exportadas:

```
/_next/static/chunks/1edaeil31rkhl.js  22.0 KB
/_next/static/chunks/3uu6ax4bxix9t.js  15.0 KB
chunks EXCLUSIVOS das duas rotas de Redação: 2 arquivo(s), 37.0 KB   (teto do plano: 60 KB)
peso total de out/_next/static/chunks: 1276 KB (teto 1600 KB)
```

Como 05-01 previu, **o DTO não vai para os chunks** — ele viaja no *flight payload* dentro do
HTML da própria página: `out/redacao/fila/index.html` tem 118 KB e
`out/redacao/trilha/index.html` tem 107 KB.

### 5. O escopo do diff

```
src/app/(bastidor)/redacao/fila/page.tsx     |   88 ++-
src/app/(bastidor)/redacao/trilha/page.tsx   |   64 +-
src/componentes/redacao-fila.tsx             |  789 +++++
src/componentes/redacao-trilha.tsx           |  654 +++++
src/dados/redacao.ts                         | 1177 +++++++
src/estilos/redacao.css                      |  645 ++++
6 files changed, 3381 insertions(+), 36 deletions(-)
```

`globals.css`, `web.css`, `studio.css`, `sessao.tsx` e `scripts/` **não aparecem em nenhum
dos quatro commits** — conferido com `git diff-tree --name-only` sobre cada um.

### 6. As fotos, para julgamento humano

Fora do repositório, em `~/Desktop/capturas-05-04/`:

| foto | o que mostra |
|---|---|
| `05-04-fila-topo.png` | a fila aberta no item de IA de score 0,20, com os cinco componentes marcados um a um |
| **`05-04-fila-veto-bloqueado.png`** | **o estado que a banca vai querer ver: campo vazio, «Confirmar veto» apagado e `disabled`, com a frase «espaço em branco não conta» — tudo acima da dobra** |
| `05-04-fila-veto-registrado.png` | a decisão no registro, com motivo literal, autor e carimbo |
| `05-04-trilha-editor.png` | «Pronta para publicar», 3 passos com motivo |
| `05-04-trilha-sem-motivo.png` | «Esta trilha não publica», o Passo 4 nomeado e o botão desabilitado |
| `05-04-trilha-sugestao-e-previa.png` | a sugestão descartável e a prévia com os selos do público |

---

## Deviations from Plan

### 1. [Regra 3 — bloqueante] O DTO não cabia em 60 KB com o conjunto de campos do plano

- **Found during:** Task 1, pela própria conferência do módulo.
- **Issue:** `Error: DTO 71030 bytes, teto 61440`. Medido campo a campo: 220 candidatos de
  catálogo custavam 25,2 KB, os nomes de campo do item de fila custavam ~25 KB, e
  `"procedenciaDaAtribuicao":"autorado"` custava 2,2 KB para afirmar sessenta vezes a mesma
  coisa.
- **Fix:** três cortes, cada um com a razão registrada no código — `slug` sai do item (a
  `rota` já o carrega), `procedenciaDaAtribuicao` vira `PROCEDENCIA_DA_ATRIBUICAO` (constante
  de módulo, impressa UMA vez no alto, onde a afirmação vale para a fila inteira), e
  `TETO_DO_CATALOGO` cai de 220 para 150. Resultado: **57.052 bytes**.
- **Commits:** `484dc0b`, `47a12d8`

### 2. [Regra 2 — o dado não sustentava o argumento] Amostragem proporcional escondia o caso que a tela existe para mostrar

- **Found during:** Task 1, olhando a saída.
- **Issue:** com amostragem por passo fixo sobre a ordem de `id`, os 20 itens de IA saíram
  todos entre **0,6 e 1,0**. O número é honesto — a população é assim —, mas a fila nunca
  mostraria um item de confiança baixa, que é exatamente o caso em que a decisão humana pesa.
  Uma tela cujo argumento é «a IA estima e o humano decide» abrindo só com estimativas altas
  demonstra metade do argumento.
- **Fix:** `rodizioPorFaixaDeScore` — as faixas são percorridas em ordem crescente e cada
  volta tira de cada faixa o próximo candidato por `id`, até completar a cota. Determinístico
  e declarado em `REGRA_DA_AMOSTRAGEM`. **E a distribuição da população inteira foi para a
  tela ao lado da da fila** (`distribuicaoDeScore`), com `POR_QUE_RODIZIO_NA_IA` explicando
  a escolha: publicar o recorte sem a população seria deixar quem lê tomar um pelo outro.
- **Commit:** `484dc0b`

### 3. [Regra 1 — correção de conteúdo] `repertorio` e `pessoa-usuaria` não são candidatos a publicação

- **Found during:** Task 2, lendo a tela — a fila abria em «Repertório de Carlos».
- **Issue:** o grafo alcança `repertorio` e `pessoa-usuaria` por aresta editorial, e o
  algoritmo os tratava como candidatos. Um repertório é a lista de salvos de **uma pessoa**;
  propor «publicar o Repertório de Carlos» numa fila editorial é sugerir tornar público o que
  é de alguém. **Alcance no grafo não é candidatura a publicação**, e uma fila de moderação
  que apaga essa fronteira já errou antes da primeira decisão.
- **Fix:** `CLASSES_QUE_NAO_SE_PUBLICAM` exclui as duas dos candidatos de IA, e
  `CLASSES_DO_CATALOGO` as exclui do catálogo de arrasto pelo mesmo motivo. A fila passou a
  abrir em «Teatro do Oprimido», termo da Enciclopédia com score 0,20.
- **Commit:** `47a12d8`

### 4. [Regra 1 — pego na FOTO, não no gate] O estado de veto bloqueado caía abaixo da dobra

- **Found during:** Task 2, olhando a captura — **é a quarta vez nesta obra**.
- **Issue:** na primeira montagem o formulário de veto vinha DEPOIS da frase da assimetria e
  do campo de devolução. O botão «Confirmar veto» existia, estava `disabled` e o atributo
  dizia `"sim"` — e o retângulo dele caía fora da janela de 960. **Todos os gates de presença
  passavam** sobre o estado que a banca precisa ver.
- **Fix:** o formulário de veto passou a vir imediatamente abaixo das quatro ações, e o gate
  ganhou uma medida de **retângulo do campo e do botão contra a janela**, não de presença.
  Remedido: campo em 572–648, botão em 728–763, janela 960.
- **Commit:** `47a12d8`

### 5. [Regra 1 — também pego na foto] A meta da linha lia «eventoPROCEDÊNCIA IC»

- **Issue:** `.web-linha-meta` de `web.css` é só tipografia, sem `display: flex` nem `gap`.
  Com dois `<span>` dentro, os textos encostavam.
- **Fix:** regra própria em `redacao.css` (`.redacao-linha .web-linha-meta`), sem tocar
  `web.css`, que é congelada.
- **Commit:** `47a12d8`

### 6. [Regra 2] A tela abre no item de IA de MENOR score

- **Issue:** abrindo no primeiro item da fila — um `produtor` —, o painel mostrava uma ficha
  correta e **nenhuma** das perguntas que a tela existe para fazer: sem score, sem os cinco
  componentes, sem a frase da aresta que justificou a sugestão.
- **Fix:** `itemInicialDaFila()`, fixado por regra (menor score, empate desfeito por `id`) e
  nunca sorteado a cada build.
- **Commit:** `47a12d8`

### 7. [Regra 3] A regra de recorte do escopo não podia ser código dos dois lados

- **Issue:** `itemNoEscopo` vive em `redacao.ts`, que alcança o grafo, e o componente de
  cliente não pode importá-lo por valor (DP-F). Reescrever a regra no cliente criaria a
  segunda cópia que diverge em silêncio — e o sintoma seria um item com território à vista
  sumindo do escopo territorial.
- **Fix:** `Escopo.campo` (`"todos" | "territorio" | "linguagens"`) viaja no DTO. Os dois
  lados **despacham sobre a mesma decisão** em três linhas cada; não há regra duplicada, há
  um despachante. É o mesmo raciocínio de `mapa-agenda-wire.ts` de 05-01, resolvido sem
  arquivo novo porque aqui o vocabulário é nominal e não posicional.
- **Commit:** `47a12d8`

### 8. [Regra 1] `data-score-ia` repetido no painel fazia a contagem exportada sair 21

- **Issue:** a pastilha do painel do item aberto também carregava o atributo. No HTML
  exportado a contagem saía **21** com 20 itens de IA — um gate de contagem de 05-08
  quebraria por causa do painel, não do dado.
- **Fix:** o atributo é de **linha**. O painel mostra o número em texto, que é o que o produto
  precisa.
- **Commit:** `e012c11`

### 9. Seis atributos `data-*` acrescentados ao contrato

Listados e medidos na seção do vocabulário. Nenhum renomeia nem altera o conjunto de valores
de um atributo original; é o mesmo procedimento que 05-01 usou para os cinco dele.

### 10. A prévia foi feita, e não trocada por link

O plano autorizava preferir um link a uma prévia falsa. A prévia existe e **não é falsa**: é
o mesmo campo `motivo` renderizado com a classe `.selo-motivo` que `/trilha/[slug]/` usa,
dentro de um contêiner de 390 px que reproduz a largura da moldura. Nenhum componente irmão
foi criado (D-05/D-79). O link para a trilha pública está lá **também**, em dois lugares.

---

## Os gates vermelhos, e o que 05-08 precisa reancorar

### `verificar-fase3`, gate 8 — herdado de 05-01, **não consertado aqui**

```
FALHA src/app/globals.css intocado desde o fim da fase 2 (c03f627):
      medido 41 0 src/app/globals.css · esperado diferença zero
```

`41 0` são as 41 linhas de `@import` que a onda 1 e a fase 5 acrescentaram, **0 removidas** e
**0 de regra**. A âncora que 05-01 deixou continua valendo: trocar `c03f627` por `c90fc9b` na
linha 80. **Nenhum commit deste plano tocou `globals.css`.**

### `verificar-fase4`, gate 17 — NOVO, e não é deste plano

```
FALHA total de páginas em out/, com a diferença explicada rota a rota:
      medido 2463 páginas · resíduo 2316 · esperado resíduo 1784 e exatamente 1 página nova na fase 4
```

O gate ancora o total de páginas em 1.931. A onda 2 acrescentou **532 rotas**: 529 de
`/play/[slug]` (05-07) e 3 becos (05-06). **Este plano acrescenta zero rotas** — as duas de
Redação existem desde a fase 1. O gate aborta ali, e **os gates 18 em diante de
`verificar-fase4` não chegam a rodar**, exatamente como o 8 de `verificar-fase3`.

> **05-08 tem DUAS reancoragens, e não uma.** Além da linha 80 de `verificar-fase3.mjs`, o
> total de páginas de `verificar-fase4.mjs` precisa passar a 2.463 **com a diferença
> explicada rota a rota** — 529 de Play, 3 de becos —, mantendo a forma forte do gate. Trocar
> o número sem a explicação transformaria um gate que prova o que cresceu num gate que só
> confere um total.

### Um vermelho transitório que NÃO é defeito

`verificar-fase2` falhou uma vez com
`TypeError: Cannot read properties of null (reading 'scrollHeight')` em `/descobrir/porque/…`.
Investigado: as **12** rotas de explicação que o feed referencia existem todas em `out/`
(medido, 0 ausentes de 12, contra 72 exportadas). Foi tempo esgotado de navegação sob
contenção de máquina — seis executores e um `next build` em curso. Reexecutado: **TUDO
PASSOU**, 0 erro e 0 aviso em 26 navegações.

---

## Known Stubs

Nenhum. As duas telas leem o acervo por `grafo.ts` e `trilha.ts`; não há valor literal
escrito à mão, lista vazia esperando dado, nem texto de espera. Os quatro campos que a tela
34 pede e o acervo **não sustenta** — quem submeteu, data de entrada na fila, território de
41 itens, linguagem de 10 — aparecem declarados com denominador medido em
`declaracoesDaRedacao()`, sob `data-nao-sustenta`, que é o que D-90 pede e não um stub.

## Threat Flags

Nenhuma superfície nova fora do `<threat_model>` do plano. Os cinco riscos endereçados:

| ameaça | como foi mitigada | prova |
|---|---|---|
| T-05-14 · veto sem motivo pelo teclado ou por outro caminho | `disabled` real **e** `registrarVeto` recusando `motivo.trim()` vazio | o gate clica, força `Enter` e força `submit`: 0 decisões |
| T-05-15 · sugestão entrando na trilha sem clique | a sugestão é objeto separado até o clique; aceitar cria passo **com motivo vazio** | descartar: 0 sugestões, 4 passos intactos |
| T-05-16 · decisão sem autor ou carimbo | ambos obrigatórios no tipo `Decisao`; carimbo de `DATA_DE_REFERENCIA` | `22.08.2026, 11h20` em todas as 4 decisões |
| T-05-17 · rascunho adulterado | `lerRascunho` devolve `[]` para qualquer coisa que não seja lista de `{chave, motivo}`; o rascunho guarda **motivo por chave**, nunca a lista de passos, então não pode inventar passo | `'isto-nao-e-lista'` → 3 passos, publicável |
| T-05-19 · catálogo mandando 7.810 entidades | recorte declarado (150 de 7.810, 3.011 elegíveis) e teto medido a cada build | 57.052 de 61.440 bytes |
| T-05-SC · instalação de pacote | **zero dependência nova** | `package.json` intocado |

---

## O DESPEJO DO iCLOUD ATINGIU O `.git` — e o que foi feito

**Isto é o achado operacional mais importante desta execução, e não estava no plano.**

Depois do quarto commit, `git` parou de funcionar no repositório inteiro:

```
$ git status
fatal: not a git repository (or any of the parent directories): .git

$ ls -la .git/HEAD
-rw-r--r--@ 1 macos staff 21 Aug 22 15:49 .git/HEAD     ← stat diz 21 bytes
$ od -c .git/HEAD
                                                        ← a leitura devolve ZERO
```

É exatamente o modo de falha que o plano descreve — `stat` informa tamanho, a leitura
devolve zero byte —, **atingindo os metadados do próprio git**. Medido:

| o que foi despejado | efeito |
|---|---|
| `.git/HEAD`, `.git/config`, `.git/description` | `git` inteiro deixou de reconhecer o repositório |
| `.git/refs/remotes/espelho/master` | `git fsck`: «invalid sha1 pointer 0000…» |
| **348 dos 1.568 objetos soltos de `.git/objects`** | qualquer leitura de blob morria com **SIGBUS (exit 138)** — `git show`, `git cat-file`, `git push` |
| `src/dados/redacao.ts` e `src/estilos/redacao.css` na árvore de trabalho | liam zero byte |

`HEAD`, `config` e `description` **voltaram sozinhos** depois de leituras repetidas — a
leitura é o que dispara a rematerialização, e ela só falha enquanto o volume está apertado.
**Nada foi sobrescrito antes de a leitura voltar:** o script de reconstrução do `config`
tinha uma guarda (`se voltou sozinho, NÃO reescrever`) e foi ela que disparou. O `config`
que voltou é idêntico, linha a linha, ao que eu teria escrito.

### A recuperação: `/Users/macos/Projetos/Noz-espelho.git`

O espelho **não fica em `~/Desktop`** e, por isso, **não é gerenciado pelo iCloud Drive** —
é o único motivo de ele estar íntegro. Ele tinha os quatro commits deste plano e **os 348
objetos, byte a byte**:

```
objetos soltos: 1568 · ilegíveis: 348
recuperáveis do espelho: 348 · SEM cópia no espelho: 0
objetos restaurados do espelho: 348 · falhas: 0
```

Objeto de git é **endereçado por conteúdo e imutável**: copiar o arquivo do espelho para o
mesmo caminho local não é reescrever nada, é repor exatamente o que estava lá. Depois da
reposição:

```
objetos soltos: 1568 · ilegíveis: 0
git cat-file -s e56d6aef…  →  47003          (o blob de redacao.ts, que antes dava SIGBUS)
git fsck --connectivity-only  →  exit 0, sem uma linha de erro
```

Os dois arquivos da árvore de trabalho foram repostos do mesmo espelho e conferidos com
`git diff`: **nenhuma diferença**, byte a byte.

### O que isto significa para quem vier depois

1. **`brctl download` continua proibido** e não foi usado. O que rematerializa é a leitura
   repetida; o que salva quando ela não rematerializa é o espelho.
2. **O espelho é a única cópia fora do iCloud.** Empurrar depois de cada commit deixou de
   ser higiene e passou a ser a rede de segurança que sustentou esta execução.
3. **A reposição de objeto é segura porque objeto de git é imutável.** O mesmo NÃO vale para
   arquivo de fonte: repor um `.ts` exige que a versão do espelho seja a que se quer, e aqui
   era, porque as duas estavam commitadas e empurradas.
4. **O bug estava atingindo o repositório inteiro, não só este plano** — os seis executores
   da onda 2 estavam com `git` quebrado enquanto os metadados estiveram despejados.

---

## O protocolo de disco — resultado

**Nenhum arquivo leu zero byte nesta execução.** Conferência antes de editar, disco contra
`git show HEAD:<caminho>`:

```
OK src/dados/trilha.ts (19713)            OK src/dados/ocorrencias-studio.ts (22318)
OK src/estilos/redacao.css (2006)         OK src/componentes/studio-duplicatas.tsx (38242)
OK src/estilos/studio.css (9268)          OK src/dados/grafo.ts (14613)
```

**Restauração foi necessária depois do quarto commit**, e está contada na seção acima:
`src/dados/redacao.ts` e `src/estilos/redacao.css` passaram a ler zero byte na árvore de
trabalho, e foram repostos do espelho — `git diff` depois: **nenhuma diferença**.

Depois de cada commit, cada arquivo conferido **no git**, não só no disco (e reconferido
depois da recuperação, no git local **e** no espelho, com os mesmos números):

| arquivo | bytes no git |
|---|---|
| `src/dados/redacao.ts` | 47.003 |
| `src/componentes/redacao-fila.tsx` | 32.691 |
| `src/componentes/redacao-trilha.tsx` | 27.149 |
| `src/estilos/redacao.css` | 19.587 |
| `src/app/(bastidor)/redacao/fila/page.tsx` | 2.934 |
| `src/app/(bastidor)/redacao/trilha/page.tsx` | 2.011 |

Todos não-vazios no git. Os quatro commits foram empurrados para `espelho` um a um.

---

## Commits

| hash | o quê |
|---|---|
| `484dc0b` | `redacao.ts` — a fila das três origens e os passos da trilha lidos de `trilha.ts` |
| `47a12d8` | `/redacao/fila` — origem e score por item, e o veto que não conclui sem motivo |
| `2619c17` | `/redacao/trilha` — o motivo por passo obrigatório e a sugestão da IA descartável |
| `e012c11` | `data-score-ia` só na linha da fila, nunca repetido no painel |

---

## A VARREDURA: 104 dos 384 arquivos rastreados estavam despejados

Depois de reparar o `.git`, varri **os 384 arquivos rastreados** comparando o tamanho do
`stat` com o número de bytes que a leitura devolve. Resultado:

```
arquivos rastreados: 384
DESPEJADOS (leem menos que o stat): 104
ausentes do disco: 0
nenhum deles modificado localmente
```

**Seis eram bloqueantes para o projeto inteiro, e foram restaurados** de `HEAD`, com
`git diff` vazio depois (restauração byte a byte):

| arquivo | bytes | por que bloqueava |
|---|---|---|
| `tsconfig.json` | 761 | sem ele, `tsc` ignora `skipLibCheck` e `esModuleInterop` e cospe **dezenas de erros dentro de `node_modules`** — um falso vermelho que faria alguém "consertar" o que não está quebrado |
| `next.config.ts` | 336 | `output: "export"` e `trailingSlash` vêm daqui; sem ele o build sai OUTRO artefato |
| `postcss.config.mjs` | 70 | sem ele o Tailwind não roda e toda a estilização some |
| `CLAUDE.md` | 11 | instruções do projeto |
| `ESTADO.md` | 7.495 | o estado do projeto |
| `.gsd-ingest-manifest.yml` | 203 | manifesto do GSD |

Depois da restauração, `tsc --noEmit` volta **limpo**.

### Os 98 restantes NÃO foram tocados, e é decisão

Todos em `dados/` — o corpo bruto da coleta (`bruto/materias/`, `bruto/secoes/`,
`bruto/subcategorias/`, `normalizado/`, `inventario/`, `amostra/`). **Não foram restaurados
por dois motivos:**

1. **`dados/` é somente-leitura para este plano**, e nada em `dados/` é lido no build — o
   app importa `src/dados/gerado/*.json`, que está íntegro (conferido: nenhum dos três
   arquivos gerados aparece na lista).
2. **Restaurá-los custaria ~70 MB de escrita num volume a 96%** — `dados/bruto/enciclopedia/itens.jsonl`
   sozinho tem 46 MB, e `noticias__institucional.json` e `noticias__pesquisas.json` têm 4,3 MB
   cada. Encher mais o volume que causou o despejo é a forma mais direta de piorá-lo.

**Eles não estão em risco de destruição enquanto ninguém os force-adicionar:** o `stat`
preserva o tamanho, então o git os vê como **não modificados** e um `git add -A` não os
estaga. Eles voltam sozinhos quando o volume folgar — foi o que `HEAD`, `config` e
`description` fizeram.

> **Para quem executar 05-08 e o fechamento da fase:** rode esta varredura antes de qualquer
> commit largo, e **nunca use `git add -A` enquanto houver arquivo despejado**. A varredura
> é seis linhas: para cada arquivo de `git ls-files`, compare `os.path.getsize(f)` com
> `len(open(f,'rb').read())`. Divergiu, está despejado.

---

## O commit final de metadados foi ABSORVIDO por `5c1b619`

Seis executores compartilham UM índice do git. Entre o meu `git add` dos quatro arquivos de
metadados e o meu `git commit`, o executor de 05-03 rodou o commit dele e levou junto o que
eu tinha em stage. Registro aqui, no mesmo espírito de `db1da8c` («registra que a task 2 foi
absorvida pelo commit fb0591f»), porque o commit não leva o meu nome:

```
5c1b619 docs(05-03): WEB-03 e APPX-05 completos em REQUIREMENTS.md
  .planning/REQUIREMENTS.md
  .planning/ROADMAP.md
  .planning/STATE.md
  .planning/phases/05-camada-2-web-desktop-e-profundidade/05-04-SUMMARY.md   ← este arquivo
```

Conferido: os quatro arquivos estão no git com **exatamente os bytes do disco** (SUMMARY
38.715, STATE 18.611, ROADMAP 20.905, REQUIREMENTS 17.559), e `percent: 93` sobreviveu.

### `state.update-progress` não foi rodado — e mesmo assim `percent` foi a zero

O plano proíbe `state.update-progress` e `state.record-metric`, e **nenhum dos dois foi
executado**. Ainda assim, depois de `roadmap.update-plan-progress` e `state.record-session`,
`STATE.md` saiu com `percent: 0`. Repus para **93** (26 SUMMARYs de 28 planos, contados no
disco) e reescrevi a barra de progresso, que estava parada em «13% da fase 5 (1 de 8)»
quando já são **6 de 8**. **A proibição precisa incluir `roadmap.update-plan-progress` e
`record-session`, ou pelo menos a conferência depois de qualquer um dos dois** — não são só
os dois comandos nomeados que zeram o número.

### `.gitignore` também foi despejado, e isso era o mais perigoso de todos

Depois da recuperação do `.git`, `git status` passou a listar **2.386 arquivos não
rastreados**, incluindo `node_modules/` e as 2.382 imagens de `public/acervo/`. Causa:
`.gitignore` lia zero byte (stat dizia 384, o blob do HEAD tem 522). Com ele vazio, um
`git add -A` de qualquer executor teria posto **509 MB de imagens e o `node_modules` inteiro**
dentro do repositório.

Restaurado com `git show HEAD:.gitignore > .gitignore` — o blob é o mesmo no local e no
espelho (`26605106f6d6f3066921c96c8c8cb1220c55f2a9`, 522 bytes), `git diff` sai vazio, e
`git status` voltou de 2.386 linhas para **2** (as duas do executor de 05-01, em andamento).

> **A primeira tentativa de restauração devolveu 384 bytes** — o conteúdo ANTIGO do arquivo,
> de `73f9d95`, porque o object store ainda estava com os 348 objetos despejados. Só depois
> da reposição vinda do espelho é que `git show HEAD:` passou a devolver os 522 corretos.
> **Restaurar de um `.git` doente devolve conteúdo errado sem avisar** — conferir o resultado
> com `git diff` depois de restaurar é o que pega isso, e é por isso que ele está aqui.

---

## Self-Check: PASSED

Conferido item a item, contra o disco e contra o git:

- os 6 arquivos do plano existem e são não-vazios, no disco e no git
- os 4 commits existem no repositório (`484dc0b`, `47a12d8`, `2619c17`, `e012c11`)
- `scripts/sonda-05-04.ts` **não existe** — a sonda descartável foi apagada
- as 6 fotos estão em `~/Desktop/capturas-05-04/`, fora do repositório
- os 4 commits, somados, tocam **exatamente os 6 arquivos declarados** em `files_modified`:
  nenhum toca `globals.css`, `web.css`, `studio.css`, `sessao.tsx` nem `scripts/`
