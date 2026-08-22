---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 06
subsystem: ui
tags: [busca, linguagem-natural, regras-declaradas, sem-ia, criterios-editaveis, zero-resultado, cenario-5, export-estatico]

requires:
  - "03-04 — src/dados/indice.ts (montarIndice, consultar, normalizar, slugDoTitulo) e a rota /buscar, que já linkava para /buscar/frase/"
provides:
  - "src/dados/frase.ts — traduzir(frase, indice) → {criterios, naoEntendido, diagnostico} por 9 regras declaradas, determinística e sem modelo; regras() → a lista completa com nome, padrão, exemplo e o que produz; montarVizinhancaDeSemelhanca(fonte, termo, indice) → as 856 arestas semelhante_a com motivo escrito, lidas no build; motivoDoCasamento() → {texto, origem: aresta|criterio}; FRASE_DO_CENARIO_5"
  - "src/componentes/busca-frase.tsx — a tela cliente: frase editável, fichas removíveis com recálculo ao vivo, «por que casa» por resultado com origem no DOM, declaração de ausência de IA com a lista das 9 regras, zero-resultado numerado, lente do mapa"
  - "src/estilos/frase.css — as classes semânticas da tela, fora de globals.css"
  - "/buscar/frase — rota exportada, 419 KB de HTML, abrindo com o Cenário 5 já traduzido em 3 fichas e 8 resultados"
affects: [03-07]

actuals:
  tokens: 61000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Achatamento que PRESERVA O ÍNDICE (um caractere de saída por caractere de entrada) ao lado de `normalizar`: é o que permite devolver o trecho literal da frase com posição, e destacá-lo por fatiamento de string em vez de marcação injetada"
    - "Máquina de consumo por caractere: cada regra marca o pedaço que consumiu, o casamento mais longo corre primeiro, e o que sobrou vira `naoEntendido` — descartar em silêncio é impossível por construção"
    - "Injeção da fonte do grafo também para leitura de ARESTAS, não só de entidades: `montarVizinhancaDeSemelhanca(fonte, …)` é o mesmo gesto de `montarIndice(fonte)`, e é o que deixa `frase.ts` importável pelo cliente"
    - "Ficha que CONFESSA: marca curta sempre visível com o número medido, parágrafo inteiro sob um toque — a confissão não pode custar a primeira vista, mas também não pode sumir"
    - "Corte de moldura POR PROCEDÊNCIA: `rotuloCurto` encolhe o que nós escrevemos para a linha estreita do resultado; o motivo escrito no acervo nunca encolhe"
    - "Origem do motivo no DOM (`data-origem-casamento=aresta|criterio`) desenhada diferente no CSS: texto do acervo com barra de citação, texto nosso em cinza sem barra"

key-files:
  created:
    - src/dados/frase.ts
    - src/componentes/busca-frase.tsx
    - src/estilos/frase.css
    - "src/app/(app)/buscar/frase/page.tsx"
  modified: []

key-decisions:
  - "`frase.ts` NÃO importa `./grafo`, nem estática nem dinamicamente, e o índice entra INJETADO em `traduzir(frase, indice)` — porque a frase é editável e `traduzir` roda no cliente a cada tecla. O plano pedia import de `@/dados/grafo` neste arquivo; obedecer arrastaria 23 MB de JSON para o navegador e violaria DP-F, que é restrição de fase e vence a instrução de plano"
  - "A consulta NÃO é pré-computada por subconjunto de critérios no build, como o plano previa pelo padrão de máscara de bits da 02-02. O precômputo só cobriria as combinações da frase ORIGINAL, e a primeira tecla digitada cairia fora dele — a tela ficaria correta só enquanto ninguém editasse, que é o gesto que D-64 existe para permitir. `consultar` é filtro linear em memória sobre o DTO, o mesmo que `/buscar` roda a cada tecla; a única travessia de grafo desta tela acontece no build"
  - "«gratuito» produz `classe: evento`, e a ficha declara que a gratuidade EM SI não recortou nada. É a leitura defensável: gratuidade é propriedade de sessão, então «gratuito» só faz sentido sobre o que tem sessão. Uma ficha que não recortasse nada e nada dissesse fingiria filtrar; uma que recortasse sem dizer o quê seria pior. A ficha diz as duas coisas, com os dois números: 2.425 de 2.425 sessões gratuitas, 0 dos 300 eventos declarando ingresso"
  - "«perto de mim» produz `territorio` com a substituição declarada e a escolha do território NA PRÓPRIA FICHA, não em outro bloco: separar a pergunta da confissão que a motivou apagaria o motivo da pergunta. Nenhuma geolocalização é pedida (D-60, D-25)"
  - "«parecido com X» produz um critério de TEXTO, porque `Criterio` de `indice.ts` não tem campo de vizinhança e este plano não reescreve `indice.ts`. A consequência foi MEDIDA e está declarada na tela com número: das 856 arestas que saem do que casa com «Bienal», 372 chegam a entidades distintas, 50 delas também casam por título e se explicam aqui pelo motivo escrito, e 322 ficam fora do alcance de um critério de texto"
  - "Regra de TERRITÓRIO nomeado acrescentada às 8 famílias do plano: sem ela «teatro gratuito em Pernambuco» mandava «Pernambuco» para o bloco de não entendido, com o território sendo uma faceta real do índice e a regra de proximidade já produzindo o mesmo campo. Quando as duas disparam, a proximidade CARIMBA a declaração na ficha nomeada em vez de somar uma segunda — duas fichas do mesmo campo somariam e o recorte ficaria maior do que o pedido"
  - "Resultado sem motivo LANÇA em vez de não renderizar em silêncio (D-28): a caminhada roda no build, então derrubar `npm run build` é a falha visível que a regra pede. Com zero critérios de pé a lista não é renderizada de todo, e a tela diz por quê — listar 5.092 entradas sem motivo para nenhuma seria a afirmação vazia que a tela inteira contradiz"

patterns-established:
  - "Bloco «não entendi isto» que não some quando está vazio: ele declara que a frase foi lida por inteiro, com a contagem de palavras e o que a regra fez com o pedaço vago"
  - "Afrouxamento de zero-resultado expresso no MESMO estado das fichas removidas, e não numa consulta paralela — é isso que faz o número prometido ser o número entregue"

requirements-completed: [AGEN-07]

coverage:
  - id: E1
    description: "A frase vira critérios visíveis e editáveis, cada um removível com recálculo na hora (AGEN-07, D-64)"
    requirement: AGEN-07
    verification:
      - kind: unit
        ref: "npx tsx — traduzir(FRASE_DO_CENARIO_5) devolve 3 critérios (semelhanca, gratuidade, proximidade), determinística por JSON.stringify de duas chamadas, e consultar() devolve porCriterio para os 3"
        status: pass
      - kind: automated_ui
        ref: "Chrome headless 1440×960: 3 fichas visíveis ao abrir, cada uma com o trecho da frase que a produziu destacado no texto de cima («parecido com a Bienal», «gratuito», «perto de mim»); remoção sucessiva dá a série 8 → 40 → 283 → 0 com location.pathname+search inalterado"
        status: pass
    human_judgment: false
  - id: E2
    description: "A tradução É a resposta, mostrada na tela e não um passo escondido (D-64)"
    requirement: AGEN-07
    verification:
      - kind: automated_ui
        ref: "A tela abre com a frase do Cenário 5 já escrita no campo (`[data-frase]`.value confere byte a byte) e já traduzida; frase, 3 fichas e o primeiro resultado inteiro cabem em 699px contra 707px do campo até o topo da barra de abas"
        status: pass
    human_judgment: false
  - id: E3
    description: "O casamento é por regra declarada e não por modelo, e a tela diz isso (D-65)"
    requirement: AGEN-07
    verification:
      - kind: automated_ui
        ref: "`[data-sem-ia]` visível (offsetParent não nulo, altura > 0) com «Esta busca não chama IA»; tocar em `[data-regras]` lista 9 regras `[data-regra]` visíveis, todas com exemplo"
        status: pass
      - kind: automated_ui
        ref: "performance.getEntriesByType('resource') na sessão inteira: 54 requisições, TODAS para o servidor local, 0 externa; console com 0 erro e 0 aviso"
        status: pass
      - kind: build
        ref: "Nenhum pacote novo instalado; grep sem comentários por fetch(/openai/anthropic/api./http externo em frase.ts e busca-frase.tsx não encontra nada"
        status: pass
    human_judgment: false
  - id: E4
    description: "Cada resultado explica por que casa, e o motivo vem da aresta ou do critério, nunca de texto genérico"
    requirement: AGEN-07
    verification:
      - kind: automated_ui
        ref: "8 resultados, 8 com `[data-motivo-casamento]`, 0 sem: 6 com `data-origem-casamento=\"aresta\"` (motivo escrito no acervo, ex. «parecido porque os dois são eventos, de artes visuais, em São Paulo») e 2 com `=\"criterio\"`"
        status: pass
      - kind: unit
        ref: "motivoDoCasamento só usa a vizinhança quando a ficha de semelhança está de pé E o termo da âncora bate com o termo que o build atravessou"
        status: pass
    human_judgment: false
  - id: E5
    description: "Zero-resultado oferece qual critério afrouxar e quantos resultados aquilo traria (D-66)"
    requirement: AGEN-07
    verification:
      - kind: automated_ui
        ref: "«…, de circo» → 4 fichas, 0 resultados, 1 afrouxamento com data-afrouxamento-n=8; tocar nele entrega exatamente 8 (data-resultados-total)"
        status: pass
    human_judgment: false
  - id: E6
    description: "O que a regra não entendeu aparece; nada é descartado em silêncio"
    requirement: AGEN-07
    verification:
      - kind: unit
        ref: "«quero um blorfz parecido com a Bienal» → naoEntendido: [\"blorfz\"]; a frase do Cenário 5 → naoEntendido: [] com «algo» declarado como pedaço vago"
        status: pass
      - kind: automated_ui
        ref: "`[data-nao-entendido]` presente no HTML exportado e visível com 0 palavras, declarando que as 5 palavras com conteúdo foram lidas"
        status: pass
    human_judgment: false

metrics:
  duration: "~70 min"
  completed: 2026-08-22

status: complete
---

# Phase 3 Plan 06: Busca em linguagem natural — Summary

`/buscar/frase` traduz «algo parecido com a Bienal, gratuito e perto de mim» em três fichas
visíveis e removíveis sobre o índice único do 03-04, com 8 resultados dos quais 6 se explicam
pelo motivo escrito na aresta `semelhante_a` do acervo — e sem chamar modelo nenhum, o que a
tela declara em texto e prova listando as 9 regras que usou.

## Os números que o plano exigiu registrar

### 1. As 9 regras declaradas, com nome e exemplo

É esta lista que a tela mostra ao tocar em `ver as 9 regras que leem a frase`, e é ela o
argumento de D-65 — a alternativa ao modelo não é uma caixa preta menor, é uma lista.

| id | nome | o que reconhece | exemplo | o que produz |
|---|---|---|---|---|
| `semelhanca` | parecido com alguma coisa | «parecido com X», «tipo X», «como X», «igual a X», «que nem X» | «algo parecido com a Bienal» | texto — X casado contra o índice, com a entidade âncora identificada |
| `classe` | que tipo de coisa | «exposição», «show», «artista», «livro», «vídeo», «verbete», «curso»… | «exposição parecida com a Bienal» | classe — uma das 15 classes do índice |
| `linguagem` | linguagem artística | qualquer um dos 33 rótulos de linguagem do vocabulário gerado | «teatro em Pernambuco» | linguagem — pelo rótulo do vocabulário, nunca por lista escrita à mão |
| `tema` | assunto | qualquer um dos 94 rótulos de tema do vocabulário gerado | «arte contemporânea no Rio de Janeiro» | tema — pelo rótulo do vocabulário |
| `territorio` | onde | o nome de um dos 108 estados que a hierarquia `situado_em` do acervo resolveu | «teatro em Pernambuco» | território — pelo rótulo do acervo, nunca por lista de UF escrita à mão |
| `gratuidade` | de graça | «grátis», «gratuito», «de graça», «sem pagar», «sem custo», «entrada franca» | «teatro gratuito» | classe: evento — e a ficha DECLARA que a gratuidade em si não recorta |
| `periodo` | quando | «hoje», «amanhã», «neste fim de semana», «histórico», «antigo» | «show hoje» | classe: evento — nunca uma janela de data (D-48) |
| `procedencia` | de onde veio o registro | «do acervo», «da enciclopédia», «do Itaú Cultural», «autorado», «derivado» | «verbete da enciclopédia» | procedência — ic, derivado ou autorado |
| `proximidade` | perto de mim | «perto de mim», «aqui perto», «na minha cidade», «por perto», «aqui do lado» | «cinema perto de mim» | território — e a ficha DECLARA a substituição, porque não há sua localização |

O plano previa 8 famílias; a nona (`territorio`) foi acrescentada porque sem ela «teatro
gratuito em Pernambuco» mandava «Pernambuco» para o bloco de não entendido — com o território
sendo faceta real do índice e a regra de proximidade já produzindo exatamente esse campo.

### 2. O que a frase do Cenário 5 produziu

Frase: **«algo parecido com a Bienal, gratuito e perto de mim»** → **3 critérios, 8 resultados**.

| regra | trecho literal da frase | critério para `consultar` | rótulo na ficha | sem ela |
|---|---|---|---|---|
| `semelhanca` | «parecido com a Bienal» (posições 5–26) | `texto:Bienal` | parecido com «Bienal» | 40 |
| `gratuidade` | «gratuito» (28–36) | `classe:evento` | gratuito — lido como «o que tem sessão»: evento | 9 |
| `proximidade` | «perto de mim» (39–51) | `territorio:sao-paulo-uf` | perto de mim → São Paulo | 51 |

Os 8 resultados são as edições da Bienal de São Paulo (`10ª`, `11ª`, `12ª`, `13ª`, `14ª`, `10ª
Bienal de Arte Fotográfica Brasileira`, entre outras), todos de classe `evento`, todos em São
Paulo. **6 dos 8 trazem motivo ESCRITO no acervo** — por exemplo «parecido porque os dois são
eventos, de artes visuais, em São Paulo» — e **2 trazem motivo composto do critério**,
marcados como tal no DOM.

**«Não entendi»: lista vazia.** As 5 palavras com conteúdo da frase foram todas lidas.
«algo» não é «não entendido»: é o **pedaço vago**, reconhecido como tal, e a tela mostra a
leitura dele — «sem recorte de classe — a busca fica sobre as 15 classes do índice». Misturar
as duas listas faria a tela dizer que não entendeu justamente a palavra que entendeu melhor.

Que o bloco funciona quando há sobra está medido em outra frase: «quero um blorfz parecido com
a Bienal» → `naoEntendido: ["blorfz"]`.

### 3. A série de contagens da remoção sucessiva

Medida em Chrome headless 1440×960, clicando no primeiro `[data-remover-criterio]` visível,
uma ficha por vez, conferindo a cada passo que `location.pathname + location.search` **não
mudou**:

```
8  →  40  →  283  →  0
```

| toque | ficha tirada | resultados depois | o que a tela prometia antes do toque |
|---|---|---|---|
| — | (estado inicial, 3 fichas de pé) | **8** | — |
| 1 | `texto:Bienal` (semelhança) | **40** | «tirar esta ficha · +32» |
| 2 | `classe:evento` (gratuidade) | **283** | «tirar esta ficha · +243» |
| 3 | `territorio:sao-paulo-uf` (proximidade) | **0** | «tirar esta ficha · +4.809» |

O último passo é o único em que o número prometido não é entregue, **e isso é deliberado**:
sem nenhum critério de pé a tela não lista os 5.092 do acervo. Ela mostra 0 e diz por quê —
«listar o acervo inteiro aqui seria devolver 5.092 resultados sem um motivo para nenhum
deles». Resultado sem motivo não renderiza (D-28), e a regra vale inclusive quando o motivo
que falta é o da consulta inteira.

### 4. O texto exato da ficha de gratuidade

**Rótulo (sempre visível):**

> gratuito — lido como «o que tem sessão»: evento

**Marca curta (sempre visível, na mesma ficha):**

> veio de «gratuito» na sua frase — não recorta neste acervo · 2.425 de 2.425 sessões saem
> gratuitas

**Parágrafo inteiro (sob o toque «por quê?»):**

> A gratuidade em si NÃO recortou nada: as 2.425 ocorrências do acervo saem todas gratuitas,
> porque «gratuito» é a negação de um campo de ingresso que nenhum dos 300 eventos declara. Um
> filtro de gratuidade passaria 100% dos eventos datados. O que esta ficha recortou foi «o que
> tem sessão» — evento —, porque gratuidade é propriedade de sessão, e isso está dito aqui em
> vez de acontecer em silêncio.

A ficha tem borda tracejada e fundo cinza, diferente das que recortam de verdade: a diferença
entre «esta recortou» e «esta não recorta, e eu te digo isso» precisa ser **vista** antes de
ser lida.

A ficha de proximidade tem a mesma marca de confissão, e o parágrafo dela diz:

> «Perto de mim» não tem resposta neste protótipo, e fingir que tem seria o pior caminho. Não
> pedimos sua localização — pedir seria requisição de runtime num protótipo estático (D-60) e
> coleta de dado pessoal sem necessidade (D-25) — e nenhuma das 2.425 sessões do acervo declara
> espaço. O que existe é TERRITÓRIO, pela hierarquia `situado_em`. A regra trocou proximidade
> por território e deixou a escolha com você: o território abaixo é o maior recorte do acervo,
> não um palpite sobre onde você está.

## O que o acervo sustenta, medido

| medida | valor |
|---|---|
| entidades com «Bienal» no título | 116 — 51 eventos, 48 temporadas, 14 conteúdos, 1 mídia, 1 termo, 1 espaço |
| dessas, indexáveis (o que `consultar` alcança) | 68 (as 48 temporadas não entram no índice) |
| arestas `semelhante_a` saindo delas | **856**, todas com `motivo` escrito em português |
| entidades distintas que essas arestas alcançam | 372 |
| dessas, que também casam por título «Bienal» | **50** — são as que se explicam aqui pelo acervo |
| dessas, fora do alcance de um critério de texto | **322** — declarado na tela, com o número |
| peso do mapa `chave → motivo` que atravessa a fronteira | 5.019 bytes (só os 50 alcançáveis) |
| ocorrências gratuitas / total | 2.425 de 2.425 |
| eventos que declaram ingresso | 0 de 300 |

## O roteiro por clique, saída literal

Chrome headless, viewport 1440×960, sobre o `out/` exportado servido em loopback:

```
1. abre pronta · frase «algo parecido com a Bienal, gratuito e perto de mim» ja escrita · 3 fichas ja traduzidas
2. 3 fichas visiveis (semelhanca, gratuidade, proximidade) · 8 resultados visiveis de 8 · trechos destacados na frase: ["parecido com a Bienal","gratuito","perto de mim"]
   primeiro resultado: "eventoSão Paulo10ª Bienal de São Paulocasou por: «Bienal» no título · "
   por que casa: 6 por aresta escrita, 2 por criterio, 0 sem motivo
   motivo do 1o: "casou por: «Bienal» no título · evento (de «gratuito») · São Paulo"
   nao entendido: 0 palavra(s) — «não entendi isto: nada ficou de fora — as 5 palavras com conteúdo desta frase foram lidas por alguma regra. «algo» é o p»
3. «Esta busca não chama IA. A frase é lida por 9 regras declarada…» visivel · 9 regras listadas na tela (semelhanca, classe, linguagem, tema, territorio, gratuidade, periodo, procedencia, proximidade), todas com exemplo
4. tirar a ficha de semelhanca: 8 → 40 resultados, URL inalterada (tirei «texto:Bienal» (tirar esta ficha · +32) → 40)
5. serie da remocao sucessiva: 8 → 40 → 283 → 0
   tirei «texto:Bienal» (tirar esta ficha · +32) → 40
   tirei «classe:evento» (tirar esta ficha · +243) → 283
   tirei «territorio:sao-paulo-uf» (tirar esta ficha · +4.809) → 0
6. «algo parecido com a Bienal, gratuito e perto de mim, de circo» → 4 fichas, 0 resultados · 1 afrouxamento(s): linguagem=8 · toquei no 1o e vieram 8 (prometido 8)
7. moldura 844px, barra 60px · do campo ate o topo da barra: 707px · do campo ao fim do 1o resultado: 699px (fichas terminam em 495px) → CABE
8. 54 requisicoes na sessao inteira, TODAS para http://127.0.0.1:43217 · 0 externa
9. console: 0 erro, 0 aviso · 3 navegacoes
OK cenario 5 · 3 fichas · 9 regras listadas · serie: 8 → 40 → 283 → 0 · 0 requisicao externa · console limpo
```

E os dois gates de arquivo:

```
OK frase · 9 regras · 3 criterios (semelhanca, gratuidade, proximidade) · nao entendido: [] · 8 resultados
OK busca por frase · 3 fichas no HTML · 5 marcacoes · lente presente · 0 chamada externa · HTML 419 KB
chunks: 1128 KB (teto 1600)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueio] `frase.ts` não importa `@/dados/grafo`; o índice entra injetado**

- **Found during:** Task 1
- **Issue:** O plano manda «Crie `src/dados/frase.ts` … importando de `@/dados/grafo` e de
  `@/dados/indice`». Mas a Task 2 do mesmo plano exige que a frase seja editável e que editar
  retraduza — o que põe `traduzir` no cliente. Um import de `grafo` em `frase.ts` arrastaria
  `entidades.json` (9,4 MB) e `arestas.json` (13,6 MB) para o navegador, estática ou
  transitivamente, e o próprio plano declara DP-F como restrição da fase: «nenhum arquivo com
  a diretiva de cliente alcança `@/dados/grafo`, nem transitivamente». As duas instruções não
  podem valer juntas.
- **Fix:** `frase.ts` importa só de `./indice` e `./tipos`. `traduzir(frase, indice?)` recebe o
  DTO; `montarVizinhancaDeSemelhanca(fonte, termo, indice)` recebe as três funções públicas de
  `grafo.ts` INJETADAS, exatamente como `montarIndice(fonte)` faz. O componente de servidor
  `/buscar/frase/page.tsx` é quem segura a fronteira.
- **Consequência no gate:** o `<verify>` da Task 1 chama `consultar({…})` sem passar índice, o
  que só funciona se algo tiver montado o índice ativo — e nada monta, porque nada importa o
  grafo. O gate rodou com um prelúdio de 3 linhas, e **o resto do script é literal**:
  ```ts
  import {porSlug, slugsPorTipo, vizinhos} from './src/dados/grafo';
  import {montarIndice, definirIndiceAtivo} from './src/dados/indice';
  definirIndiceAtivo(usarIndice(montarIndice({slugsPorTipo, porSlug, vizinhos})));
  ```
  `usarIndice` foi exportada de `frase.ts` para isso — conveniência de script e gate, no mesmo
  gesto de `definirIndiceAtivo` em `indice.ts`. A tela sempre passa o DTO explicitamente.
- **Files modified:** `src/dados/frase.ts`
- **Commit:** d067606

**2. [Rule 3 - Bloqueio] O precômputo combinatório por subconjunto foi recusado**

- **Found during:** Task 2
- **Issue:** O plano manda pré-computar no build «o resultado de cada subconjunto de critérios
  que a remoção pode produzir», pelo padrão de máscara de bits da 02-02, e que «o cliente não
  recalcula travessia nenhuma». Mas a frase é EDITÁVEL: o precômputo cobriria só as combinações
  da frase original, e a primeira tecla digitada cairia fora dele. A tela ficaria correta
  apenas enquanto ninguém editasse — justamente o gesto que D-64 existe para permitir.
- **Fix:** `traduzir` e `consultar` rodam no cliente sobre o DTO recebido por props. Nenhuma
  travessia de grafo atravessa a fronteira: `consultar` é filtro linear em memória, o MESMO que
  `/buscar` roda a cada tecla desde o 03-04, e a única travessia desta tela — as 856 arestas
  `semelhante_a` — acontece no build e chega como mapa de texto de 5 KB. A invariante que o
  plano protegia («o cliente não atravessa o grafo») está preservada; o mecanismo é outro.
- **Files modified:** `src/componentes/busca-frase.tsx`, `src/app/(app)/buscar/frase/page.tsx`
- **Commit:** 43f707e

**3. [Rule 1 - Defeito de gate] Os três `<verify>` do plano não rodavam como escritos**

- **Found during:** Tasks 2 e 3
- **Issue:** três defeitos independentes:
  1. **Task 2** — `if(!/\/mapa#/.test(h))`. Com `trailingSlash: true`, o `<Link>` do Next
     escreve `/mapa/#r=…` no HTML exportado (conferido em `out/buscar/index.html`, do 03-04).
     A gramática correta, e a mesma dos planos 03-01/03-03/03-04, é `/mapa/#`.
  2. **Task 2** — o `replace` de comentários de linha usava `/^\s*\/\/.*\$/gm`, com `\$`
     escapado, que casa o caractere `$` literal e não o fim de linha. Corrigido para `$`.
  3. **Task 3** — o script inteiro chama uma API que não existe: `servir('out')` (a assinatura
     é `servir({raiz})`), `s.base`/`s.encerrar` (são `s.url`/`s.fechar`), e
     `cdp.enviar`/`cdp.ao`/`cdp.irPara` (o cliente expõe `avaliar`, `clicar`, `navegar`,
     `capturar`, `consola`, `encerrar` — `Network.*` não é acessível de fora).
- **Fix:** as duas primeiras foram corrigidas no lugar e o gate da Task 2 passa. O roteiro da
  Task 3 foi reescrito como programa efêmero contra a API real, cobrindo os **9 passos** que a
  ação do plano descreve (o `<verify>` original só cobria 1–5, 8 e 9). A prova de «zero
  requisição externa» — que `Network.requestWillBeSent` daria — foi feita por
  `performance.getEntriesByType('resource')`, que enumera TODO recurso que o documento pediu
  (script, CSS, imagem, fetch, XHR) e é medida de dentro da página em vez de fora: 54
  requisições na sessão, todas para o loopback.
- **Files modified:** nenhum arquivo do produto — só os scripts efêmeros de verificação.

**4. [Rule 2 - Funcionalidade crítica faltando] Regra de território nomeado**

- **Found during:** Task 1
- **Issue:** As 8 famílias de regra do plano não incluem território por nome. Medido: «teatro
  gratuito em Pernambuco» mandava «Pernambuco» para o bloco de não entendido, com território
  sendo uma faceta real do índice (108 estados, todos com rótulo vindo do acervo) e com a regra
  de proximidade já produzindo exatamente esse campo. Uma tela que existe para não descartar em
  silêncio não pode declarar «não entendi» sobre a palavra que o índice conhece melhor.
- **Fix:** nona regra `territorio`, casada pelo rótulo que a hierarquia `situado_em` resolveu —
  nunca por lista de UF escrita à mão. Quando proximidade e território nomeado disparam juntos,
  a proximidade **carimba a declaração na ficha nomeada** em vez de somar uma segunda: duas
  fichas do mesmo campo somariam (regra de `consultar`) e o recorte ficaria maior do que o
  pedido, além de «perto de mim» sumir da tela sem aviso.
- **Files modified:** `src/dados/frase.ts`
- **Commit:** d067606

**5. [Rule 1 - Defeito] O primeiro resultado ficava atrás da barra de abas**

- **Found during:** Task 3
- **Issue:** O passo 7 do roteiro reprovou: 814px do campo ao fim do primeiro resultado contra
  705px do campo até o topo da barra de abas. A captura confirmou — a foto de slide do Cenário
  5 não existia, o título do primeiro resultado ficava coberto. A primeira medição que escrevi
  também estava errada (comparava contra a altura da moldura inteira, ignorando que o cabeçalho
  já gastou parte dela) e dava «cabe» para algo que a barra cobria; corrigida para medir contra
  o topo real da barra.
- **Fix:** corte **por procedência**, como o plano manda — encolheu o que nós escrevemos, nunca
  o motivo escrito no acervo: `rotuloCurto` por critério só para a linha estreita do resultado;
  o parágrafo da âncora virou uma linha na ficha com o inteiro sob «por quê?»; o bloco «não
  entendi isto» perdeu a linha de título própria; densidade (gap 3→2, respiro do primeiro
  resultado zerado). Medida final: **699px contra 707px**.
- **Files modified:** `src/componentes/busca-frase.tsx`, `src/dados/frase.ts`, `src/estilos/frase.css`
- **Commit:** 83a4b96

**6. [Rule 1 - Defeito] «2425» sem separador no parágrafo da ficha de gratuidade**

- **Found during:** escrita deste SUMMARY, ao transcrever o texto exato que o plano exige
  registrar
- **Issue:** a linha curta da ficha dizia «2.425 de 2.425» e o parágrafo sob «por quê?» dizia
  «2425». O mesmo número medido aparecendo de duas formas, na ficha mais delicada da tela.
- **Fix:** milhar à mão em `frase.ts` (não `toLocaleString`: ICU diferente entre build e
  navegador divergiria na hidratação e sujaria o console).
- **Files modified:** `src/dados/frase.ts`
- **Commit:** e16b542

### Escopo de arquivo

A Task 3 declarava poder alterar só `busca-frase.tsx`; a correção da moldura tocou também
`frase.ts` (`rotuloCurto`) e `frase.css` (densidade). **Os dois estão na lista `files_modified`
do plano** — a fronteira do plano foi respeitada, a da tarefa não. Nenhum arquivo fora da lista
foi tocado: `src/dados/indice.ts`, `src/app/(app)/buscar/page.tsx` e `src/app/globals.css`
seguem intocados, conferido por `git status`.

## Known Stubs

Nenhum. Não há valor vazio codificado, texto de reserva nem componente sem fonte de dado nesta
tela — «resultado sem motivo» lança em vez de renderizar mudo, e todo número exibido é medido.

## O que este plano NÃO entrega, dito com número

**«Parecido com» é casamento por TEXTO, não por vizinhança.** `Criterio` de `indice.ts` tem
seis campos (`texto`, `classe`, `linguagem`, `tema`, `procedencia`, `territorio`) e nenhum
deles expressa «pertence a este conjunto de chaves»; reescrever `indice.ts` é do 03-04 e este
plano não o toca. A consequência foi medida e **está declarada na própria tela, com número**:
das 856 arestas `semelhante_a` que saem do que casa com «Bienal», 372 chegam a entidades
distintas; 50 dessas também casam por título e se explicam aqui pelo motivo escrito no acervo;
**322 ficam fora do alcance deste critério**. Buscar pela vizinhança inteira exigiria ou um
campo novo no índice ou o grafo do lado do cliente — e o grafo tem 23 MB. É trabalho de Camada
2, e dizer o número é o que impede esta tela de parecer mais do que é.

## Self-Check: PASSED

- `src/dados/frase.ts` — FOUND (42.401 bytes)
- `src/componentes/busca-frase.tsx` — FOUND (37.870 bytes)
- `src/estilos/frase.css` — FOUND (10.125 bytes)
- `src/app/(app)/buscar/frase/page.tsx` — FOUND (2.773 bytes)
- `out/buscar/frase/index.html` — FOUND (419 KB)
- commit d067606 — FOUND
- commit 43f707e — FOUND
- commit 83a4b96 — FOUND
- commit e16b542 — FOUND
