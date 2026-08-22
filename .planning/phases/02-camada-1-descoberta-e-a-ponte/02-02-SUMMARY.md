---
phase: 02-camada-1-descoberta-e-a-ponte
plan: 02
subsystem: ui
tags: [next, react, rsc, export-estatico, grafo, explicabilidade, feed, rota-dinamica]

requires:
  - phase: 02-camada-1-descoberta-e-a-ponte
    plan: 01
    provides: "montarFeed({personaId, disposicoes, limite}) → {cartoes, avisos, diagnostico}; Cartao com caminho: PassoCartao[]; motivo.ts em dois modos; sessao.tsx com persona e disposições; cartao.tsx e capa-sem-imagem.tsx"
provides:
  - "src/dados/feeds.ts — as 96 combinações de persona × disposição montadas no build, deduplicadas, e a união de ids de cartão que a rota de explicação exporta"
  - "src/componentes/feed.tsx — o feed cliente que escolhe a combinação por máscara de bits, sem recalcular nada"
  - "src/componentes/seletor-disposicao.tsx — D-32, a disposição em texto corrido e editável em um toque"
  - "src/dados/explicacao.ts — id ↔ parâmetro {classe}_{slug}, a coleta exaustiva de caminhos por semente, e os critérios com a dependência de cada caminho"
  - "src/componentes/explicacao.tsx — a tela de D-33/D-34/D-35, que cabe na moldura sem rolagem em 72 de 72 páginas"
  - "/descobrir/porque/[id] — 72 páginas prerenderizadas, uma explicação por persona em cada"
affects: [02-05]

actuals:
  tokens: 61000
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Precômputo combinatório no build + índice por máscara de bits: a ordem viaja como dado, não como convenção de string duplicada nos dois lados da fronteira RSC"
    - "Dedupe por assinatura serializada: 96 combinações, 21 listas distintas, payload de 1,14 MB para 0,32 MB"
    - "Parâmetro de rota {classe}_{slug} com asserção de injetividade no build, em vez do id canônico com dois-pontos"
    - "Análise de dependência caminho→critério calculada no build; o recálculo do cliente é filtro sobre lista em memória, nunca nova travessia"
    - "A tela declara o número que calculou: «3 de 13 caminhos continuam de pé», nunca uma afirmação mais forte do que a medição"

key-files:
  created:
    - src/dados/feeds.ts
    - src/dados/explicacao.ts
    - src/componentes/feed.tsx
    - src/componentes/seletor-disposicao.tsx
    - src/componentes/explicacao.tsx
    - "src/app/(app)/descobrir/porque/[id]/page.tsx"
    - .planning/phases/02-camada-1-descoberta-e-a-ponte/deferred-items.md
  modified:
    - "src/app/(app)/descobrir/page.tsx"
    - src/dados/caminhada.ts

key-decisions:
  - "«Ter imagem» foi rebaixado para último critério de desempate do feed: acima do hash ele decidia centenas de empates e selecionava a parte do acervo digitalizada com foto — filtro de beleza sobre um ranqueamento honesto. 11/12 com imagem virou 4/12, e a capa sem imagem passou a aparecer 8 vezes em 12"
  - "As 96 combinações são precomputadas inteiras e deduplicadas por conteúdo; o teto de 1,5 MB derruba o build com a instrução de reduzir cartões por feed, nunca combinações"
  - "A análise de dependência roda sobre TODOS os caminhos que a caminhada encontra, não sobre os 4 que a tela exibe — senão a frase mais forte da tela afirmaria mais do que foi calculado"
  - "Quarto tipo de critério, «fora-da-caminhada», pelo mesmo motivo que «sem-aresta» existe em cartao.ts: serendipidade e item fora do alcance da persona não têm semente nem linguagem que os sustente"
  - "Critério de disposição nunca sustenta caminho, e a tela diz isso: um corte que o item passou não trouxe o item, ele só não o tirou"
  - "O primeiro caminho exibido é sempre o que a caminhada usou, mesmo sendo o mais curto e o menos vistoso: promover um caminho mais bonito mostraria uma explicação que não foi a razão de o cartão estar no feed"
  - "«Quero mais assim» e «não é para mim» gravam em chave própria de localStorage, não em `salvos`, que é de ocorrência (D-42) e alimenta Meu Repertório no 02-03"

patterns-established:
  - "A moldura como unidade de medida: toda decisão de layout desta tela foi tomada contra os 824px de caixa de conteúdo menos os 59px da barra de abas"
  - "Cortar conteúdo antes de relaxar o gate de altura, e escolher o que cortar por procedência: a frase que nós compusemos pode ser truncada, a citação literal do acervo não"

requirements-completed: [DESC-02, DESC-03]

coverage:
  - id: E1
    description: "Descobrir mostra a disposição escolhida no topo, editável em um toque, e trocá-la remonta o feed sem recarregar rota (D-32)"
    requirement: DESC-02
    verification:
      - kind: automated_ui
        ref: "Chrome headless: abrir o seletor (5 disposições), marcar «quero conhecer algo que nunca vi» → URL inalterada, 12 cartões, 11 classes, 0 pares adjacentes, 3 de 12 títulos em comum com o feed anterior"
        status: pass
    human_judgment: false
  - id: E2
    description: "O feed é heterogêneo por construção: nunca dois cartões do mesmo tipo seguidos (D-27)"
    requirement: DESC-02
    verification:
      - kind: automated_ui
        ref: "node -e sobre out/descobrir/index.html — 12 data-classe, 11 classes distintas, 0 pares adjacentes, 12 data-motivo não vazios"
        status: pass
      - kind: integration
        ref: "scripts/testar-caminhada.ts — 9 de 9 asserções continuam passando após o rebaixamento de DP-D"
        status: pass
    human_judgment: false
  - id: E3
    description: "Trocar de persona troca o feed sem navegar (D-45)"
    requirement: DESC-02
    verification:
      - kind: automated_ui
        ref: "Chrome headless: clicar na terceira persona → URL inalterada, lista de títulos diferente, 12 cartões"
        status: pass
    human_judgment: false
  - id: E4
    description: "Tocar em «por que isto apareceu» abre /descobrir/porque/[id] como rota própria e compartilhável (D-33)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "72 páginas em out/descobrir/porque/, 12 links do feed, 0 mortos; a união dos 96 feeds e o generateStaticParams saem do mesmo precômputo"
        status: pass
    human_judgment: false
  - id: E5
    description: "A explicação mostra o caminho real percorrido no grafo, passo a passo, com o motivo e o tipo de cada nó (D-34)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "63 das 72 páginas com cadeia de 2+ nós; as 9 restantes são itens fora do alcance da persona padrão e declaram isso em texto"
        status: pass
      - kind: integration
        ref: "explicacaoDe sobre 216 pares item×persona — mediana de 3 caminhos, máximo 14, todos com passos vindos de resolverSalto, o mesmo código que produz o selo do cartão"
        status: pass
    human_judgment: false
  - id: E6
    description: "Cada critério da explicação é removível e o resultado se recalcula na tela (D-34)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "Chrome headless, trilha curada como Maria: remover as 13 fichas uma a uma degrada 13→11→5→4→3→…→1→0 caminhos, a cadeia cresce de 2 para 3 nós ao perder os atalhos de 1 salto, e a URL nunca muda. Como Carlos, que tem um caminho só, a primeira remoção já dispara a frase forte"
        status: pass
    human_judgment: false
  - id: E7
    description: "A explicação cabe na moldura de 390×844 sem rolagem (D-33, o requisito da foto de slide)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "Chrome headless nas 72 páginas: scrollHeight ≤ clientHeight em 72 de 72. Altura do conteúdo — mínima 394px, mediana 631px, p90 694px, máxima 739px; folga de 25px acima da barra de abas na mais alta"
        status: pass
    human_judgment: true
    rationale: "Que o caminho seja COMPREENSÍVEL sem rolar é juízo de leitura, não de pixel. A medida prova que nada é cortado pela moldura; se a cadeia comunica na projeção, só olhando."
  - id: E8
    description: "A explicação distingue motivo escrito no acervo de motivo composto a partir da relação (DP-A, T-02-07)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "30 das 72 páginas mostram citação literal do acervo, 52 mostram frase composta; as duas marcações diferem em quatro atributos simultâneos e há legenda de uma linha"
        status: pass
    human_judgment: true
    rationale: "Que a diferença seja PERCEBIDA por quem lê a tela projetada é juízo visual. O gate prova que as duas marcações existem e aparecem de verdade."
  - id: E9
    description: "O rodapé declara em texto que nenhuma decisão editorial foi tomada por IA (D-35)"
    requirement: DESC-03
    verification:
      - kind: automated_ui
        ref: "data-limite-ia presente e visível em 72 de 72 páginas, medido com offsetParent e retângulo de altura maior que zero"
        status: pass
    human_judgment: false

duration: 96min
completed: 2026-08-22
status: complete
---

# Fase 2 Plano 02: o feed de Descobrir e a tela «Por que isto apareceu» — Summary

**As 96 combinações de persona e disposição são montadas no build e trocadas por um índice,
e toda entidade que qualquer uma delas pode produzir tem uma rota própria que mostra o
caminho real no grafo, com os critérios removíveis, cabendo inteira na moldura do telefone
em 72 de 72 páginas.**

## Performance

- **Duration:** ~96 min
- **Tasks:** 3 de 3
- **Files:** 7 criados, 2 alterados · 1.495 linhas acrescentadas

## Os três números que o plano exigiu

| | medido | teto do plano |
|---|---|---|
| **precômputo serializado** | **0,316 MB** (1,135 MB sem o dedupe) | 1,5 MB |
| **páginas de explicação exportadas** | **72** | ≥20 páginas, ≤2.000 ids |
| **altura da explicação na moldura** | **máxima 739px**, mediana 631px | ≤824px de caixa, ~765px acima da barra |

**Nada foi cortado por estourar o orçamento na versão final** — mas foi cortado no caminho, e
está registrado abaixo em «O que não funcionou».

## Task Commits

| | | |
|---|---|---|
| decisão de DP-D | `d5dd62c` | rebaixa «ter imagem» para último critério de desempate |
| Task 1 | `a256efd` | Descobrir — 96 feeds no build, disposição editável, troca de persona |
| Task 2 | `548b4d5` | a rota da explicação — o caminho real, prerenderizado |
| Task 3 | `03b7df3` | a tela da explicação — cadeia legível, critérios removíveis |
| correção medida | `1eff8c1` | a explicação só afirma o que calculou, e cabe em 72 de 72 |

## A decisão que o orquestrador delegou: DP-D, «com imagem antes de sem imagem»

O plano 02-01 travou esse critério **acima** do hash semeado pela persona e mediu a
consequência: o feed base da Maria saía **11 de 12 com imagem**, num acervo em que 22% dos
candidatos têm imagem. O executor do 02-01 manteve a regra e passou a decisão adiante.

**Rebaixei o critério para o último lugar da ordenação**, abaixo do hash. O argumento não é
estético, é sobre o que a palavra «desempate» significa: os baldes têm centenas de candidatos
empatados em salto, concentrador e origem do motivo, e um critério que decide centenas de
empates não é desempate — é seleção. E o que ele selecionava era a parte do acervo que o Itaú
Cultural digitalizou com foto (443 de 529 mídias têm imagem; 13 de 300 eventos têm). Um filtro
de beleza por cima de um ranqueamento que `caminhada.ts` inteiro faz questão de manter honesto.

Medido, antes → depois, nos três feeds base:

| | Maria | Carlos | Joana |
|---|---|---|---|
| cartões com imagem, antes | 11/12 | 9/12 | 9/12 |
| cartões com imagem, **depois** | **4/12** | **4/12** | **4/12** |

E no HTML exportado a capa sem imagem passou de **1 aparição em 12 para 8 em 12** — a textura
visual dominante que a Task 3 do 02-01 supôs ao desenhá-la.

As 9 asserções de `scripts/testar-caminhada.ts` continuam passando. O feed ficou mais
personalizado, não menos: com o hash mandando, a sobreposição entre personas cai.

**`src/dados/caminhada.ts` está fora do `files_modified` deste plano.** Nenhum dos planos da
onda 2 o declara, e o commit é isolado (`d5dd62c`) exatamente para poder ser revertido sozinho
se a decisão não for aceita.

## O que ficou de pé

### Descobrir

`src/dados/feeds.ts` monta 3 personas × 32 subconjuntos de disposição = **96 feeds**, no
carregamento do módulo, ou seja no build. Só existem **21 listas de cartões distintas** — duas
das cinco disposições não cortam nada porque o acervo não declara duração nem faixa etária, e
combinações diferentes caem no mesmo resultado. Guardar as listas uma vez e apontar para elas
levou o payload de 1,135 MB para **0,316 MB**.

**A chave atravessa a fronteira como dado, não como convenção.** O cliente precisa escolher uma
das 32 combinações mas não pode importar `feeds.ts`, que arrasta o grafo. Em vez de uma função
de chave escrita dos dois lados — que diverge na primeira edição, e cujo sintoma seria uma
disposição que não muda nada —, a ordem canônica viaja em `ordemDisposicoes` e o índice é a
máscara de bits sobre ela. O cliente calcula a máscara em uma linha.

Medido no navegador: trocar disposição não navega, remonta o feed (3 de 12 títulos em comum),
mantém 12 cartões, 11 classes e zero pares adjacentes. Marcar «vou com criança» mostra o aviso
de que o acervo não declara faixa etária **e deixa o feed intacto** — o filtro se declara em vez
de fingir que rodou. **O menor feed entre as 96 combinações tem 12 cartões**: nenhuma combinação
esvazia a tela.

### A explicação

`generateStaticParams` sai da **união dos ids de cartão das 96 combinações**, importada do mesmo
precômputo que o feed usa — 72 ids, 72 páginas, zero link morto. O parâmetro é `{classe}_{slug}`
com asserção de injetividade rodando no build; nenhuma das 20 classes contém `_`, então a divisão
na primeira ocorrência recupera classe e slug e o único slug com `_` na união continua íntegro.

Cada página prerenderiza **as três personas** e o cliente escolhe pela sessão. Verificado no
navegador: `espaco_theatro-da-paz-belem` diz «nenhum caminho leva a este item» para a Maria e,
trocando para o Carlos na mesma URL, mostra *17 Artistas do Pará → «17 Artistas do Pará fica em
Theatro da Paz» → Theatro da Paz*.

A cadeia é a de `docs/telas.md` tela 6: o nó de partida, que está no repertório, e cada nó
seguinte com o motivo **da aresta** que levou até ele, resolvido por `resolverSalto` — o mesmo
código que produz o selo do cartão, e não uma segunda redação.

**DP-A na tela, em quatro diferenças simultâneas.** Motivo escrito no acervo vem entre aspas,
com filete laranja cheio, fundo e romano, na mesma classe `.selo-motivo` do cartão; motivo
composto vem sem aspas, filete tracejado cinza, sem fundo, itálico, com a relação nomeada na
pastilha. Mais uma legenda de uma linha. **30 páginas mostram citação do acervo e 52 mostram
frase composta** — as duas marcações aparecem de verdade, não só no código.

**Os critérios recalculam de verdade.** Percurso medido em Chrome headless, na trilha curada,
como Maria (13 caminhos):

```
removi linguagem:literatura     ->  2 nós  "Sem «literatura», 11 de 13 caminhos continuam de pé."
removi linguagem:musica         ->  2 nós  "Sem «música», 5 de 13 caminhos continuam de pé."
removi semente:termo:enc:80292  ->  3 nós  "Sem «Rap», 3 de 13 caminhos continuam de pé."
…
removi semente:termo:enc:80016  ->  0 nós  "Sem «Performance», este item não teria aparecido
                                            no seu feed. Todos os 13 caminhos que a caminhada
                                            encontrou entre o seu repertório e ele passam pelo
                                            que você removeu."
```

A cadeia **cresce de 2 para 3 nós** quando os atalhos de um salto caem — a tela mostra a
recomendação se reconstruindo por um caminho mais longo, ao vivo, sem navegar. Como Carlos, que
tem um caminho só até a trilha, a primeira remoção já dispara a frase forte.

## Verificação — comandos e saída real

```
$ npx tsc --noEmit
(sem saída, código 0)

$ npm run build
BUILD_EXIT=0

$ npm run testar-caminhada
  9 de 9 asserções passaram.

$ node -e "…out/descobrir/index.html…"                                    (gate da Task 1)
OK feed: 12 cartoes, 11 classes, 0 repeticoes adjacentes

$ node -e "…out/descobrir/porque/…"                                       (gate da Task 2)
OK 72 paginas, 12 links do feed, 0 mortos

$ node -e "…data-passo / data-limite-ia / data-criterio…"                  (gate da Task 3)
OK 72 paginas, todas com rodape e criterios; 63 com caminho multi-salto

$ (Chrome headless, moldura 390x844, as 72 páginas)
paginas: 72 · estouram a moldura: 0 · barra mais larga que a moldura: 0
altura do conteudo — minima 394px · mediana 631px · p90 694px · maxima 739px
folga ate a barra de abas na pagina mais alta: 25px

$ (estrutura, grep DEPOIS de remover comentários)
use client: 15 | violacoes DP-F: 0
token de cor de apoio em codigo: 0
fixed/dangerouslySetInnerHTML nos arquivos deste plano: 0

$ du -sh out/_next/static/chunks
888K            ← os 23 MB de grafo continuam do lado de lá da fronteira
```

## Desvios do plano

### Corrigidos automaticamente

**1. [Rule 3 — Bloqueio] `src/dados/feeds.ts` criado, fora do `files_modified`**

- **Achado em:** Task 1.
- **Problema:** o plano manda `descobrir/page.tsx` precomputar as 96 combinações e manda a rota
  de explicação «importar o mesmo precômputo em vez de recalcular». Um `page.tsx` do App Router
  não pode exportar valores arbitrários, e o componente cliente do feed não pode importar nada
  que arraste `caminhada.ts` (DP-F).
- **Correção:** módulo de servidor próprio, importado pelas duas rotas. É ele que garante que a
  união do `generateStaticParams` e o feed nunca divirjam — que era o objetivo da instrução.
- **Verificação:** 12 links do feed, 72 páginas, 0 mortos.

**2. [Rule 3 — Bloqueio] a preferência de «quero mais assim» não cabe em `sessao.tsx`**

- **Achado em:** Task 3.
- **Problema:** o plano pede que os dois botões «gravem a preferência na sessão». O contexto de
  sessão só tem `salvos`, que é de **ocorrência** (D-42) e alimenta Meu Repertório, construído em
  paralelo pelo 02-03. Escrever preferência ali contaminaria a tela de outro plano.
- **Correção:** chave própria (`agenda-cultural:preferencias`), lida em efeito para não divergir
  na hidratação, com o mesmo `try/catch` que `sessao.tsx` usa para storage bloqueado.

**3. [Rule 1 — Bug de honestidade] a frase mais forte da tela afirmava mais do que fora calculado**

- **Achado em:** Task 3, **medindo no navegador** — não lendo o código.
- **Problema:** a coleta parava nos 4 primeiros caminhos, que é quanto a tela exibe, e o
  recálculo declarava «sem este critério o item não teria aparecido» quando esses 4 caíam. Na
  trilha curada, outras 9 sementes do repertório da Maria chegam ao mesmo item e nunca tinham
  sido consultadas. Numa tela cuja função é ser auditável, isso é o defeito mais caro possível.
- **Correção:** a análise de dependência passou a rodar sobre **todos** os caminhos que a
  caminhada encontra (13 para a Maria, 7 para a Joana, 1 para o Carlos; ~0,4 ms por chamada de
  `caminho()`), e a tela exibe 4. As frases passaram a citar o número medido.
- **Verificação:** o percurso de 13 remoções reproduzido acima.

**4. [Rule 1 — Bug de layout] 11 das 72 páginas estouravam a moldura depois da correção 3**

- **Achado em:** Task 3, medindo de novo. A correção 3 multiplicou os critérios (16 estruturais
  na página da Maria) e a mais alta passou 63px da moldura.
- **Correção:** cortei conteúdo, não o gate. Ficam 5 fichas à vista — escolhidas por serem as
  que o caminho exibido usa, as únicas cujo remover muda algo na hora — e o resto atrás de um
  «+N». Mais título de nó em 2 linhas, frase composta em 3 linhas e margens apertadas.
  **A citação literal do acervo nunca é truncada**: pagar o orçamento vertical com a palavra do
  Itaú Cultural seria gastar exatamente o que esta tela existe para preservar.
- **Verificação:** 0 de 72 estouram; máxima 739px.

**Total: 4 desvios auto-corrigidos** (2× Rule 3, 2× Rule 1), mais a decisão de DP-D que o
orquestrador delegou explicitamente.

## O que não funcionou, e o que a onda 3 precisa saber

### 1. Nenhuma rota tem favicon, e isso quebra o gate de console limpo do 02-05

`/favicon.ico` devolve 404 em **toda** navegação, e o navegador o pede sozinho. No console isso
aparece como `error: Failed to load resource: the server responded with a status of 404`. O gate
(c) do plano 02-05 exige zero erro e zero aviso acumulados na sessão inteira: com isto no lugar
ele falha em todas as rotas, **inclusive nas da fase 1**, que estavam verdes.

`public/` e `src/app/icon.*` estão fora do `files_modified` deste plano, então não toquei. Um
`src/app/icon.svg` com o `\` do manual resolve a rota inteira pelo App Router. Registrado em
`deferred-items.md` e em `WINDOWS.md`.

### 2. O gate de cor do 02-05, escrito ao pé da letra, continua medindo prosa

Confirmado de novo: a varredura literal por `--ic-(lilas|azul|…)` casa com **comentários** —
`selo-linguagem.tsx:10` e `tipos.ts:250`, os dois da fase 1, citando o token como exemplo do que
o vocabulário emite. Rodada depois de remover comentários de bloco e de linha, a contagem é
**0**. A mesma armadilha vale para a varredura de `fixed`: o único casamento nos arquivos deste
plano é o comentário que **explica por que não se usa `fixed`** dentro da moldura.

**Recomendação ao 02-05, que é dono do gate:** adote a variante que remove comentários antes de
casar. A literal obriga a apagar a documentação do contrato para passar, que é o incentivo errado.

### 3. A folga da página mais alta é de 25px, e ela depende da fonte

As 72 páginas cabem, mas a mais alta (`evento_exposicao-narrativas-em-processo-chega-a-fundacao-ibere`)
tem 739px de conteúdo contra 764px úteis. A medição foi feita com a stack de substituição do
manual — Itaú Text e Itaú Display não estão em disco (D-09). **Se as fontes reais forem
instaladas antes da apresentação, esta página é a que precisa ser medida de novo.** As outras 71
têm folga de 60px ou mais.

### 4. 19 das 216 explicações não têm caminho nenhum, e isso é o dado, não um buraco

Cada uma das 72 páginas traz as três personas; em 19 desses 216 pares não existe caminho de até
dois saltos entre o repertório da persona e o item. São dois casos, e a tela distingue os dois:
o cartão de serendipidade, que é escolhido **fora** do alcance da caminhada por definição (D-30)
e cujo texto de `origemMotivo: "sem-aresta"` aparece na íntegra; e o item que caiu no feed de
outra persona. Nos dois a tela mostra o critério `fora-da-caminhada`, que é o quarto tipo — e ele
existe pelo mesmo motivo que `sem-aresta` existe: carimbá-los de «semente» afirmaria um vínculo
com o repertório que o grafo não tem.

### 5. `src/componentes/feed-descobrir.tsx` ficou órfão

Era o feed provisório da Task 1 do 02-01, substituído por `feed.tsx`. Não está no
`files_modified` deste plano e outro plano da onda podia estar importando-o, então não apaguei.
Não é referenciado por nenhuma rota e não entra no bundle. Cabe a um plano de limpeza.

## Próximo

O plano 02-05 tem tudo de que precisa nesta rota: `data-feed`, `data-classe`, `data-motivo` e
`data-origem-motivo` no feed; `data-explicacao`, `data-passo`, `data-criterio`, `data-limite-ia`,
`data-aviso`, `data-disposicao`, `data-abrir-disposicao` e `data-preferencia` na explicação e no
seletor. Os três percursos que o roteiro do Cenário 1 pede — trocar disposição, trocar persona,
remover critério — foram dirigidos em Chrome headless e passam; o script que os dirigiu ficou
fora do repositório de propósito, porque `scripts/` pertence ao 02-05.

---
*Phase: 02-camada-1-descoberta-e-a-ponte*
*Completed: 2026-08-22*

## Self-Check: PASSED

Os 7 arquivos de código e os 2 de planejamento declarados existem em disco; os 5 hashes de
commit existem em `git log`.
