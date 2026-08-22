---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 04
subsystem: ui
tags: [busca, indice, grafo, facetas, zero-resultado, export-estatico, dto-colunar, rsc]

requires: []
provides:
  - "src/dados/indice.ts — montarIndice(fonte) → IndiceDTO colunar de 5.092 entradas em 15 classes, 369 KB medidos; consultar({texto, criterios, limite}, indice) → {resultados, total, porClasse, porCriterio, afrouxamentos, criterios, regraOrdenacao}; facetasDe(consulta, indice) → facetas recontadas; normalizar() e slugDoTitulo() exportadas; expandirIndice() com cache por DTO"
  - "src/componentes/buscar.tsx — a tela cliente: campo único, resultados com tipo etiquetado visível, facetas marcáveis, zero-resultado com afrouxamento numerado, lente do mapa em r/t/v"
  - "src/estilos/busca.css — as classes semânticas da tela, fora de globals.css"
  - "/buscar — rota exportada, 429 KB de HTML, com entrada para /buscar/frase/"
affects: [03-06, 03-03, 03-07]

actuals:
  tokens: 20200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "DTO colunar com tabelas internadas em base 36: classe, procedência, imagem, linguagem, tema e território viram um a dois caracteres por entrada, e sobram só dois campos de texto"
    - "Campo derivável não viaja: o slug sai vazio nas 3.317 entradas em que `slugDoTitulo(titulo)` bate exatamente com o slug real, e a derivação é conferida no build"
    - "Uma função de normalização só, exportada, usada no build e na consulta — o título normalizado é reconstruído no cliente em vez de trafegar (210 KB medidos)"
    - "Injeção da fonte do grafo em vez de import: é o que permite um módulo servir ao build e ao cliente sem violar DP-F, e é o mesmo gesto do ContextoPredicado da fase 2"
    - "Facetas recontadas contra o recorte atual excluindo o próprio campo: a contagem que a opção mostra é exatamente quantos ela devolve se for marcada"
    - "Contagem `porCriterio` (quantos haveria sem cada critério) calculada sobre a lista inteira, nunca sobre a página exibida"
    - "Milhar formatado à mão em vez de toLocaleString: sob output:export, ICU diferente entre build e navegador divergiria na hidratação e sujaria o console"

key-files:
  created:
    - src/dados/indice.ts
    - src/componentes/buscar.tsx
    - src/estilos/busca.css
  modified:
    - "src/app/(app)/buscar/page.tsx"

key-decisions:
  - "`indice.ts` NÃO importa `./grafo`, nem estática nem dinamicamente, e a fonte entra injetada — é a única forma de o mesmo módulo montar o índice no build e ser importado pelo componente de cliente sem arrastar 23 MB de JSON para o navegador. Import dinâmico não resolveria: o chunk assíncrono ainda seria emitido em out/_next/static/chunks e estouraria o teto de 1.600 KB"
  - "O caminho de imagem NÃO entra no índice. A imagem não viaja sem o crédito — o acervo é de terceiros e a procedência é argumento — e caminho (63 KB) mais crédito (45 KB) somam 108 KB medidos num orçamento de 480 KB. O resultado usa a capa desenhada, que é por projeto a aparência dominante do protótipo, e o booleano «tem imagem local» fica, porque é critério de desempate da ordenação e a tela diz isso"
  - "`<Cartao>` não foi reaproveitado: ele exige um MotivoCartao, e um resultado de busca não chegou por aresta nenhuma. Carimbar um motivo composto afirmaria uma relação no grafo que não existe, que é a mentira de procedência que D-28 e T-02-05 fecham. Reaproveitados `<CapaSemImagem>` e `<SelosDeLinguagem>`, que são o vocabulário visual sem a afirmação"
  - "A faceta de gratuidade foi RECUSADA, com o motivo em texto de produto na tela: as 2.425 sessões saem todas gratuitas porque `gratuito` é a negação de um campo de ingresso que nenhum dos 300 eventos declara, então o filtro passaria 100% dos eventos datados (T-03-24)"
  - "Critérios do mesmo campo somam (ou), campos diferentes recortam (e). Marcar «evento» e «obra» devolve os dois; a leitura contrária faria a segunda marcação parecer defeito"
  - "Ordenação sem comparação sensível a locale: casamento no começo do título ou de uma palavra dele, depois entrada com imagem local, depois a chave estável {classe}_{slug} comparada por unidade de código"
  - "O destaque do casamento no título é literal e sem remoção de acento, enquanto a busca é normalizada: mapear a posição de volta exigiria reconstruir o deslocamento da decomposição NFD, e errar para menos num realce é inofensivo enquanto errar para mais pintaria o pedaço errado"

patterns-established:
  - "Bloco que declara o vazio em vez de sumir, aplicado ao histórico de buscas"
  - "Recorte de exibição com o total real declarado em texto E medível no DOM por data-resultados-total"

requirements-completed: [AGEN-06]

coverage:
  - id: E1
    description: "Um campo só busca sobre um índice único do grafo e os resultados misturam tipos com o tipo etiquetado em cada um (AGEN-06, D-63)"
    requirement: AGEN-06
    verification:
      - kind: unit
        ref: "npx tsx — montarIndice devolve 5.092 entradas em 15 classes, e nenhuma de ocorrencia/temporada/pessoa-usuaria/repertorio"
        status: pass
      - kind: automated_ui
        ref: "Chrome headless 1440×960: «bienal» devolve 68 resultados visíveis em 5 classes (evento 51, conteudo 14, midia 1, espaco 1, termo 1), com etiqueta de tipo visível por retângulo em 68 de 68"
        status: pass
    human_judgment: false
  - id: E2
    description: "As facetas saem da ontologia com contagem real, e marcar uma recorta sem navegar"
    requirement: AGEN-06
    verification:
      - kind: automated_ui
        ref: "Chrome headless: clicar em [data-faceta=\"classe:evento\"] leva 68 → 51 resultados, 1 classe, location.pathname segue /buscar/; tirar a ficha devolve os 68"
        status: pass
      - kind: unit
        ref: "facetasDe conta cada campo sobre o conjunto filtrado pelos OUTROS critérios, então a opção que diz 51 devolve 51; opção de contagem zero não é oferecida"
        status: pass
    human_judgment: false
  - id: E3
    description: "Zero-resultado oferece qual critério soltar e quantos resultados aquilo traria (D-66)"
    requirement: AGEN-06
    verification:
      - kind: automated_ui
        ref: "Chrome headless: «zzzqqqxxx» + classe:evento → 0 resultados, 1 afrouxamento com data-afrouxamento-n=300; tocar nele entrega exatamente 300 (data-resultados-total), com a lista cortada em 100 pelo teto de exibição"
        status: pass
    human_judgment: false
  - id: E4
    description: "O índice atravessa a fronteira do cliente como DTO medido, abaixo do teto, sem sacrificar classe"
    requirement: AGEN-06
    verification:
      - kind: unit
        ref: "diagnostico.bytes = 377.541 (369 KB, 112 KB gzip) contra teto de 480 KB, com as 15 classes presentes"
        status: pass
      - kind: build
        ref: "du -sk out/_next/static/chunks = 1040 KB contra teto de 1.600 KB"
        status: pass
    human_judgment: false
  - id: E5
    description: "A tela declara que não há serviço de busca por trás, e a lente do mapa carrega o recorte na gramática de três chaves"
    requirement: AGEN-06
    verification:
      - kind: build
        ref: "out/buscar/index.html contém /buscar/frase e /mapa/#r=…&t=…&v=…; nenhum pacote novo instalado"
        status: pass
    human_judgment: false

metrics:
  duration: "~55 min"
  completed: 2026-08-22

status: complete
---

# Phase 3 Plan 04: Buscar e o índice único — Summary

Um campo só sobre um índice colunar de 5.092 entidades em 15 classes (369 KB medidos, 112 KB
gzip, teto 480 KB), com filtro em memória sem biblioteca de busca, facetas recontadas ao vivo
contra o recorte, e zero-resultado que sempre diz qual critério soltar e quantos resultados
aquilo traz.

## Os números que o plano exigiu registrar

| medida | valor |
|---|---|
| **DTO do índice** | **369 KB** (377.541 bytes) · 112 KB gzip · teto 480 KB |
| **Chunks estáticos depois dele** | **1.040 KB** · teto 1.600 KB · eram 888 KB antes da fase |
| `out/buscar/index.html` | 429 KB (o DTO viaja inline na carga RSC) |
| **«bienal» por classe** | **68 resultados** — evento 51 · conteudo 14 · midia 1 · espaco 1 · termo 1 |
| **Regra de ordenação** | casamento no começo do título ou de uma palavra dele antes de casamento no meio; depois entrada com imagem local; empate pela chave estável `{classe}_{slug}`, comparada por unidade de código |
| **Faceta de gratuidade** | **recusada**, com o motivo na tela |

**Sobre «bienal», que é de onde o Cenário 5 parte.** Quem conduzir a demonstração já sabe o que
vai aparecer: 68 resultados em cinco classes, com evento em maioria (51) mas com 14 matérias
editoriais, um vídeo, um espaço e um verbete no meio. É exatamente a mistura que D-63 pede — se
a tela devolvesse só os 51 eventos, ela seria uma agenda. As 48 temporadas que também casam com
«bienal» ficam de fora do índice de propósito: são registro de agenda e chegam pelo evento.

**Sobre a gratuidade.** Ela não é oferecida como faceta, e a tela diz por quê em texto de
produto, não em comentário: as 2.425 sessões do grafo saem todas gratuitas porque `gratuito` é a
negação de um campo de ingresso que **nenhum dos 300 eventos declara**. Um filtro de gratuidade
passaria 100% dos eventos datados. Oferecê-lo sem avisar faria quem avalia concluir que o acervo
inteiro é gratuito (T-03-24), e essa era a única saída proibida.

## O peso: onde ele foi cortado, e onde não foi

O plano fixou a regra: **se o teto estourar, reduza CAMPO, nunca CLASSE.** As 15 classes estão
todas lá. O que foi cortado, e quanto cada corte valeu:

| campo | custo medido | decisão |
|---|---|---|
| resumo truncado em 120 caracteres | +340 KB (515 → 855 KB) | fora — o resultado não o mostra, e ele continua na página da entidade |
| título normalizado | 210 KB | fora — reconstruído no cliente pela **mesma** `normalizar`, numa passada de 5.092 chamadas |
| slug, quando derivável | 3.317 de 5.092 entradas | elidido — `slugDoTitulo(titulo)` bate exatamente, e a derivação é **conferida no build**, então nada é adivinhado na leitura |
| caminho da imagem + crédito | 63 KB + 45 KB = 108 KB | fora — ver abaixo |

**Por que a imagem ficou de fora, que é a decisão menos óbvia.** A imagem não pode viajar sem o
crédito: `capa-sem-imagem.tsx` fixou que crédito é obrigatório quando há imagem, porque o acervo
é de terceiros e a procedência é argumento da proposta. Caminho mais crédito somam 108 KB
medidos, e o DTO iria a 477 KB contra um teto de 480 — sem margem nenhuma para a onda 2. O
resultado usa a capa desenhada, que por medição da fase 2 já é a aparência dominante do protótipo
(78% dos cartões), e o booleano «tem imagem local» **fica**, porque é critério de desempate da
ordenação e a tela declara isso em cada linha que o tem.

## O que ficou de pé

**`src/dados/indice.ts`** — o índice e o motor, num arquivo só, que é o contrato com 03-06:

- `montarIndice(fonte)` enumera as 5.092 entidades por `slugsPorTipo` + `porSlug` (D-47 — nenhuma
  varredura de array cru) e devolve o DTO colunar, as facetas derivadas do próprio índice e o
  diagnóstico com o peso medido por ponto fixo.
- `consultar({texto, criterios, limite}, indice)` devolve `resultados`, `total`, `porClasse`,
  **`porCriterio`** — quantos resultados haveria **sem** cada critério, que é o número de que
  03-06 vive para recalcular quando a pessoa tira uma ficha — e **`afrouxamentos`**.
- `facetasDe(consulta, indice)` reconta cada campo sobre o conjunto filtrado pelos **outros**
  critérios: a opção que mostra 51 devolve 51, e opção que devolveria zero não aparece.
- `normalizar` e `slugDoTitulo` exportadas, usadas nas duas pontas.

**`consultar` nunca devolve vazio sem saída.** Três passadas, da mais barata para a mais larga:
remover um critério de cada vez; manter apenas um, quando nenhuma remoção isolada resolveu; e o
caminho de descoberta pelas classes mais largas, quando nem isso resolveu. Cada sugestão traz o
número que ela devolve, medido sobre a lista inteira.

**`src/componentes/buscar.tsx`** — a tela. Antes de digitar ela oferece as 5 disposições (que
levam a Descobrir com a disposição marcada, porque disposição pondera a caminhada e não é
critério de busca), 12 atalhos de linguagem com a cor do dado, o histórico local em chave própria
que declara o vazio em vez de sumir, e a entrada para `/buscar/frase/`. Digitando, ela filtra em
memória sem sair de `/buscar/`, espelha o estado no hash em `q=` e `f=`, e desenha os resultados
com `data-resultado`, `data-tipo` e a etiqueta de tipo **visível em texto**.

**A lente do mapa**, na gramática de três chaves que é contrato desta fase:
`/mapa/#r={ids juntados por ~}&t={título codificado}&v={endereço de volta codificado}`, com o
corte em 60 ids **declarado na tela** junto do total real.

## Verificação — comandos e saída real

**Tarefa 1 — o índice** (`npx tsc --noEmit && npx tsx -e "…"`):

```
OK indice · 5092 entradas · 15 classes · 369KB (112KB gzip, teto 480KB) · bienal em 5 classes · afrouxamentos 1
porCriterio de bienal+evento: [{"criterio":"texto «bienal»","semEle":300},{"criterio":"evento","semEle":68}]
diagnostico: {"slugsElididos":3317,"colisoes":329,"comTerritorio":1105,"br":824,"comImagem":2835}
facetas: {"classe":15,"linguagem":33,"tema":94,"procedencia":3,"territorio":108}
```

**Tarefa 2 — a rota exportada** (`npm run build && node -e "…"`):

```
OK buscar · rota exportada · lente com r/t/v · 4 marcacoes · chunks 1040KB
out/buscar/index.html: 429KB
```

**Tarefa 3 — a prova por clique**, Chrome headless a 1440×960 sobre `out/`, saída literal, uma
linha por passo:

```
1. antes de digitar: 80 controles visiveis, 64 atalhos de faceta, entrada por frase presente,
   0 resultados (tela de sugestao, nao de lista vazia)
2. «bienal»: 68 resultados visiveis (total declarado 68) em 5 classes — evento 51 · conteudo 14 ·
   midia 1 · espaco 1 · termo 1 · URL segue em /buscar/ · hash #q=bienal
3. etiqueta de tipo visivel (retangulo com altura > 0) em 68 de 68 resultados
4. faceta classe:evento marcada: 51 resultados (era 68) em 1 classe (evento) · URL segue em
   /buscar/ · hash #q=bienal&f=classe:evento
5. faceta tirada em um toque: 68 resultados, de volta ao numero do passo 2 · hash #q=bienal
6a. «zzzqqqxxx» + classe:evento: 0 resultados e 1 afrouxamento(s) numerado(s) —
    [texto → 300] soltar o texto «zzzqqqxxx» 300 resultados
6b. tocar no primeiro afrouxamento entregou 300 resultados, exatamente o numero prometido (300);
    a lista mostra 100 pelo teto de exibicao
7. console: 0 erro e 0 aviso em 1 navegacao(oes) e 6 interacoes

OK busca por clique · bienal 68 resultados em 5 classes · faceta evento 51 · 1 afrouxamentos
numerados · console limpo
```

**`src/app/globals.css` intocado:** `git diff HEAD --stat src/app/globals.css` vazio.

## Desvios do plano

### 1. [Regra 3 — bloqueio] `montarIndice` recebe a fonte do grafo injetada

**Encontrado em:** Tarefa 1, antes da primeira linha de código.

**O problema:** o plano pede que `indice.ts` exporte `montarIndice()` **e** `consultar`, e que
03-06 importe a função de consulta. Mas `consultar` roda no cliente. Se `indice.ts` importasse
`./grafo` para montar o índice, os 23 MB de JSON entrariam no grafo de módulos do navegador —
violação direta de DP-F, que proíbe o alcance ao grafo **inclusive transitivamente**. Import
dinâmico não resolve: o chunk assíncrono continuaria sendo emitido em `out/_next/static/chunks`,
onde o próprio gate da tarefa 2 o pegaria contra o teto de 1.600 KB.

**A correção:** `montarIndice(fonte)` recebe `{slugsPorTipo, porSlug, vizinhos}` injetadas, e
quem injeta é `src/app/(app)/buscar/page.tsx`, que é componente de servidor e está na lista de
arquivos deste plano. É exatamente o gesto que `disposicoes.ts` fez na fase 2 com
`ContextoPredicado`, pelo mesmo motivo. `indice.ts` não tem uma única referência a `./grafo` fora
de comentário — conferido por `perl -0pe 's{/\*.*?\*/}{}gs' | grep`.

**Efeito no gate:** o comando do plano abre com `montarIndice()`; ele passou a ser
`montarIndice({slugsPorTipo, porSlug, vizinhos})`, com `definirIndiceAtivo` logo em seguida para
que as chamadas de `consultar({texto})` sem índice explícito continuem valendo **literalmente
como escritas**. Todas as 14 asserções do gate seguem intactas.

**Contrato para 03-06:** importe `consultar(consulta, indice)` e `facetasDe(consulta, indice)`
passando o DTO que a página recebeu por props. **Não importe `montarIndice` em componente de
cliente** — ele é do lado do build.

### 2. [Regra 3 — bloqueio] A lente é `/mapa/#…` e não `/mapa#…`

**Encontrado em:** Tarefa 2, no primeiro gate sobre o HTML exportado.

`trailingSlash: true` torna `/mapa/` a URL canônica, e o `<Link>` do Next normaliza
`/mapa#r=…` para `/mapa/#r=…` na exportação. A **gramática de três chaves é idêntica** — `r`,
`t`, `v` no hash — e `location.hash`, que é o que 03-03 lê, não muda em nada. O gate foi ajustado
de `/mapa#` para `/mapa\/?#`. A fase 1 já perdeu um gate por presumir o contrário da barra final;
esta é a mesma armadilha do outro lado.

**03-01 e 03-03 vão encontrar isto igual** se emitirem a lente por `<Link>`.

### 3. [Regra 3 — bloqueio] O roteiro por clique foi traduzido para a API que existe

O comando de verificação da tarefa 3 chama `servir('out')` com retorno `{base, encerrar}`,
`abrirNavegador()` devolvendo `{cdp}`, e os métodos `cdp.enviar`, `cdp.ao`, `cdp.irPara` e
`cdp.digitar`. A API real de `scripts/servir-out.mjs` e `scripts/navegador.mjs` é
`servir({raiz, porta}) → {url, fechar}`, `abrirNavegador({}) → cdp` e
`cdp.navegar/avaliar/clicar/consola`; `digitar` não existe. **Os sete passos e todas as
asserções são os mesmos**; só as chamadas foram traduzidas. Digitar é feito pelo setter nativo de
`value` mais um evento `input`, que é o caminho que o React escuta. O programa rodou efêmero, de
fora de `scripts/`, como o plano exige — o script permanente da fase é do 03-07.

### 4. [Regra 2 — funcionalidade crítica] `data-resultados-total` e `data-resultados-exibidos`

O plano manda mostrar um teto de resultados **e declarar o total real junto**. A frase em texto
prova isso para quem lê, não para um gate. Sem os dois números no DOM, o passo 6 do roteiro
— «clicar no primeiro afrouxamento **de fato** produz aquele número» — seria impossível de medir
quando o número prometido (300) passa do teto de exibição (100): a contagem de `[data-resultado]`
visíveis diria 100 e o gate acusaria uma falha que não existe. Com os atributos, a promessa do
afrouxamento é conferida contra o total real.

### 5. [Regra 2 — funcionalidade crítica] `facetasDe`, as facetas recontadas

O plano pede que cada faceta traga «a contagem real», porque «uma faceta que ofereça um recorte
vazio é a mesma armadilha que D-66 existe para fechar». Contar sobre o índice inteiro cumpriria a
letra e falharia no espírito: com «bienal» digitado, a faceta «obra» mostraria 239 e devolveria
zero. `facetasDe` conta cada campo sobre o conjunto filtrado por todos os **outros** critérios,
que é a única contagem que não mente, e esconde a opção que devolveria zero.

### 6. [copy] A frase do afrouxamento

A prova por clique mostrou a frase saindo como «soltar texto — texto «zzzqqqxxx»». É a linha que
a banca lê no momento exato em que a busca falha, e o argumento inteiro de D-66 cabe nela.
Corrigida para «soltar o texto «zzzqqqxxx»», mantendo o nome do campo nos demais critérios, onde
«soltar evento» seria ambíguo entre tipo e título.

## O que não funcionou, e o que a onda 2 precisa saber

**A página pesa 429 KB de HTML.** O DTO de 369 KB viaja inline na carga RSC de
`out/buscar/index.html`, e é uma rota estática — nenhuma outra página do protótipo o carrega. Sob
gzip são ~112 KB, e os chunks compartilhados (1.040 KB) não cresceram por causa dele. Ainda
assim, é de longe a página mais pesada do export, e **03-06 vai carregar o mesmo DTO em
`/buscar/frase`**, o que dobra o custo no disco exportado. Se isso incomodar na projeção, a saída
é campo, não classe: o próximo corte natural é o slug das 1.775 entradas que ainda o carregam.

**Dois executores paralelos deixaram a árvore quebrada por alguns minutos.** `npx tsc --noEmit`
acusou erros em `src/app/(app)/evento/[slug]/page.tsx` (plano 03-02) durante a edição dele, e
`npm run build` recusou duas vezes com «Another next build process is already running». Nenhum
dos dois foi tocado nem interrompido: esperei e repeti. Quem rodar a verificação da fase precisa
contar com isso — um `tsc` vermelho no meio da onda não é necessariamente um defeito do plano que
o rodou.

**O índice não conhece o resumo, e isso vai aparecer.** A busca casa **só o título**. «bienal»
não acha uma matéria que fale da Bienal sem citá-la no título. É consequência direta de o resumo
não caber no orçamento, está declarado no diagnóstico do DTO em `camposOmitidos`, e é a primeira
coisa que alguém vai pedir se a busca por frase de 03-06 prometer mais do que o índice sustenta.

**Território ficou mais largo do que o plano estimou.** O plano falava em 773 entidades situadas
num estado brasileiro; a travessia de `situado_em` subindo município → estado encontrou **824 em
25 estados**, e 1.105 com estado de qualquer país. São Paulo tem 283, Rio 160, Minas 75, Pará 40
— e essa distribuição é, de graça, a mesma leitura de concentração que D-62 quer no mapa de
desertos culturais.

## Task Commits

| # | Tarefa | Commit |
|---|---|---|
| 1 | indice.ts — o índice único, colunar e medido | `7a74799` |
| 2 | /buscar — campo único, resultados etiquetados, facetas | `513c6a6` |
| 3 | a prova por clique, e a frase do afrouxamento | `3ebefe9` |

## Próximo

**03-06 (onda 2)** importa `consultar` e `facetasDe` de `@/dados/indice`, passando o DTO recebido
por props, e cria `/buscar/frase`. A entrada para essa rota já está desenhada e apontando em
`/buscar/`. `porCriterio` é o número que sustenta a edição de critério de D-64, e `afrouxamentos`
é o mesmo motor de D-66 — as duas telas incidem sobre o mesmo índice, que era a razão de este
plano existir antes daquele.

**03-03** lê `r`, `t` e `v` do hash. Os ids são `{classe}_{slug}`, juntados por `~`, cortados em
60, e o endereço de volta em `v` já traz o hash de estado desta tela.

## Self-Check: PASSED

Arquivos declarados, conferidos em disco: `src/dados/indice.ts`, `src/componentes/buscar.tsx`,
`src/estilos/busca.css`, `src/app/(app)/buscar/page.tsx`, `out/buscar/index.html` — todos
presentes. Commits declarados, conferidos em `git log --oneline --all`: `7a74799`, `513c6a6`,
`3ebefe9` — todos presentes. `diagnostico.bytes` remedido depois da última alteração: **377.541**
(o número no corpo foi corrigido de 377.937, que era de uma medição anterior à correção de copy).
`src/app/globals.css` intocado.
