---
phase: 04-camada-1-studio-e-o-roteiro
plan: 02
subsystem: studio-duplicatas
status: complete
tags: [studio, deduplicacao, ontologia, cenario-3, STUD-01, D-68, D-69, D-70, D-71, D-72]

requires:
  - "src/dados/duplicatas.ts — filaDeDuplicatas(), numerosDaDeduplicacao(), API congelada por 04-01"
  - "src/estilos/studio.css — vocabulário visual das telas de bastidor (leitura)"
  - "src/app/globals.css — as 4 linhas de @import já escritas por 04-01 (NÃO tocado)"
  - "src/dados/alerta.ts — DATA_DE_REFERENCIA, o carimbo da decisão"
provides:
  - "/studio/duplicatas/ fechada: fila dos 84 grupos, lado a lado, três ações, registro da decisão"
  - "data-fila-duplicatas, data-acao, data-decisao, data-reversivel — os 4 atributos que faltavam"
  - "data-grupo-escolhido — atributo NOVO, acrescentado por este plano (ver Deviations)"
  - "numerosDaDeduplicacao(): 4 campos novos — eventosDepoisDaFusaoEncenada e a fila por origem"
affects:
  - "04-05 mede o contrato data-* contra esta tela e reancora o gate 8 de verificar-fase3.mjs"
  - "04-04 pode citar gruposEncenadosNaFila (40), gruposDoAcervoNaFila (39), gruposCruzadosNaFila (5)"

tech-stack:
  added: []
  patterns:
    - "fila inteira como DTO de primitivo no cliente; trocar de grupo é estado, não rota"
    - "carimbo de tempo derivado de DATA_DE_REFERENCIA do build, nunca do relógio do runtime"
    - "helper de formatação duplicado no cliente em vez de importado — a fronteira DP-F cobrando o preço"
    - "invariante de apresentação com falha alta e nomeada: o colapso 2-para-1 quebra o build se deixar de valer"

key-files:
  created: []
  modified:
    - src/componentes/studio-duplicatas.tsx
    - src/app/(bastidor)/studio/duplicatas/page.tsx
    - src/estilos/studio-duplicatas.css
    - src/dados/duplicatas.ts

decisions:
  - "data-grupo fica SÓ nas 84 linhas da fila, e o painel escolhido usa data-grupo-escolhido: assim o número de [data-grupo] é exatamente o que data-fila-duplicatas declara, e 84 declarado com 85 no DOM seria o tipo de desencontro silencioso que este projeto argumenta contra"
  - "o grupo decidido NÃO some da fila — ele migra para a seção «decisões tomadas», e por isso [data-grupo] continua em 84 depois de qualquer decisão"
  - "«desfazer a decisão» não recebe data-acao: o contrato fixou três valores, e um quarto alargaria o vocabulário que 04-05 mede"
  - "três blocos data-nao-sustenta em vez de um (04-01 tinha 1): o critério que resolve em um componente, quanto da fila plantamos, e o que o segundo estágio erra"
  - "o offset do sticky da fila é MEDIDO no navegador (cabeçalho de 219px a 1440×960), não chutado"

metrics:
  duration: "~2h"
  completed: 2026-08-22
  tasks: 3
  commits: 4
  files: 4

actuals:
  tokens: 14398
  tasks: 3
  commits: 4
---

# Phase 4 Plan 02: A fila de duplicatas inteira — Summary

A tela de resolução de duplicatas fechada: os 84 grupos dos dois estágios numa fila
navegável, o lado a lado com os campos divergentes destacados, as três ações com a fusão
declarada antes de acontecer, e o registro de quem decidiu e quando — sobre um acervo em que
o critério de identidade da ontologia encontrou **6 duplicatas reais que ninguém plantou**.

---

## O resultado, sem rodeio

`/studio/duplicatas/` mostra agora **84 grupos**: os 33 que a chave determinística afirma e
os 51 que o casamento probabilístico levanta, estes com score de três casas. Escolher um
grupo troca o painel **sem navegar** — a URL não muda, e não há 84 páginas no artefato.
Fundir, manter separados e adiar existem lado a lado; nenhuma decisão nasce sem clique; a
decisão registra o quê, por quem e quando.

**Console: 0 erro, 0 aviso em 48 navegações. Rede: 0 requisição externa.** As três suítes
herdadas saem `TUDO PASSOU` — inclusive o gate transitivo de DP-F, com **0 violações em 25
clientes**, o que prova mecanicamente que a fila de 84 grupos atravessa a fronteira como DTO
e não arrasta `grafo.ts` para o navegador.

---

## Os números que a tela imprimiu, contra os que o plano mediu

Tudo medido no DOM vivo, na visão web, com o modo comentado desligado.

| medida | o plano mediu | a tela imprimiu | bate? |
|---|---|---|---|
| `data-fila-duplicatas` | 84 | **84** | sim |
| linhas `[data-grupo][data-estagio="chave"]` visíveis | 33 | **33** | sim |
| linhas `[data-grupo][data-estagio="probabilistico"]` visíveis | 51 | **51** | sim |
| linhas com `data-score` | 51 | **51** | sim |
| grupos do acervo no estágio 1 | 6 | **6** | sim |
| pares não-encenados do estágio 2 | 38 | **38** | sim |
| limiar exibido | 0,65 | **0.65** | sim |
| registros encenados | 80 | **80** | sim |
| eventos depois da fusão encenada | 40 | **40** | sim |
| ocorrências preservadas | 1.304 | **1.304** | sim |
| eventos no grafo, citados na declaração honesta | 300 | **300** | sim |
| eventos com agente / obra na chave | 0 / 0 | **0 / 0** | sim |
| score do par das Bienais | 0,667 | **0.667** | sim |

**Três números novos, que este plano acrescentou ao módulo e a tela imprime** — a fila
decomposta por origem, porque «40 plantadas» e «84 grupos» juntos não dizem o que sobra:

```
gruposEncenadosNaFila   40   (27 do estágio 1 + 13 do estágio 2)
gruposDoAcervoNaFila    39   (6 do estágio 1 + 33 do estágio 2) — nenhum lado é clone
gruposCruzadosNaFila     5   clone emparelhado com evento que não é o original dele
                        ---
                        84   = filaTotal
```

A soma fecha em 84 exatamente. A decomposição é o argumento da honestidade da tela: **48% da
fila o critério achou sozinho**, e isso está escrito na tela, não neste documento.

---

## Os 6 grupos reais que o estágio 1 achou na Enciclopédia

Saída literal de `npx tsx` sobre `gruposPorChave().filter(g => g.origem === 'acervo')`:

```
2 registros | (des)Construções  ||  (Des)construções
2 registros | 29º Salão Arte Pará  ||  29º Salão Arte Pará
2 registros | (Individual de Selma Bezerra)  ||  (Individual de Selma Bezerra)
3 registros | #Vivendoartisticamente  ||  #Vivendoartisticamente  ||  #Vivendoartisticamente
2 registros | “Folhas de Ouro” + Panfletagem na Feira  ||  “Folhas de Ouro” + Panfletagem na Feira
2 registros | 13ª Bienal do Mercosul  ||  13ª Bienal do Mercosul
```

Na fila eles carregam a marca **cheia, preta** — `do acervo` —, e a encenada carrega a
contornada. É o contrário do que a intuição faria, e é de propósito: **o critério encontrando
duplicata de verdade num acervo de verdade é um Cenário 3 mais forte do que qualquer encenado**,
e essas 6 linhas não podem ficar indistinguíveis das 40 que plantamos.

O trio `#Vivendoartisticamente` foi conferido na tela: **3 lados, comparação de 4 colunas**
(`176px 176px 176px 176px`), as três chaves idênticas — `evento|vivendoartisticamente||` — e o
único campo divergente é o **período declarado**: 03.06→29.06.2013, 02.07→31.07.2013 e
03.08→15.09.2013. O painel não presume dois registros em lugar nenhum.

---

## Os pares do estágio 2 que devem ser mantidos separados

O par de D-72, fixado em `PAR_QUE_O_HUMANO_SEPARA` e marcado **na própria fila** com a
pastilha laranja «manter separados»:

```
score 0.667 | 10ª Bienal de São Paulo  ||  11ª Bienal de São Paulo
             período  27.09.1969 – 14.12.1969   contra   04.09.1971 – 15.11.1971
             procedência: ic dos dois lados
```

E os vizinhos dele na mesma fila, medidos entre os 33 pares em que nenhum lado é clone:

```
score 0.818 | 11ª  ||  10ª Bienal de San Juan del Grabado Latinoamericano y del Caribe
score 0.818 | 11ª  ||  12ª Bienal de San Juan del Grabado Latinoamericano y del Caribe
score 0.818 | 10ª  ||  12ª Bienal de San Juan del Grabado Latinoamericano y del Caribe
score 0.778 | Confira a agenda de julho  ||  Confira a agenda de agosto no Itaú Cultural
score 0.714 | 2º Salão de Fotografia do CCBEU  ||  1º Salão de Fotografia do CCBEU
score 0.714 | 10ª Bienal Internacional de Gravura  ||  10ª Bienal Internacional de Gravura do Douro
```

Seis pares acima do limiar, e em **todos** a resposta certa é «manter separados». Um
deduplicador automático funde os seis e apaga cinco Bienais e uma agenda mensal do acervo sem
nunca saber. A tela diz isso ao lado do botão, e não em nota de rodapé.

---

## O texto literal do bloco de reversibilidade

Lido do DOM vivo (`[data-reversivel]`, `innerText`), porque é o que vai ser lido em voz alta:

> **O QUE A FUSÃO FAZ, DECLARADO ANTES**
>
> 1. **É reversível.** Toda decisão tomada aqui tem o caminho de volta nomeado na tela — o
>    botão «desfazer a decisão», ao lado do registro, na fila. Fundir não é uma porta de mão
>    única.
> 2. **Preserva procedência.** Os dois registros mantêm o seu rótulo — `ic`, `derivado` ou
>    `autorado` — e a procedência de cada lado continua visível na tela depois da decisão, não
>    só antes dela.
> 3. **Nada é apagado.** O registro secundário continua existindo e continua consultável na
>    sua rota. O que a fusão muda é qual dos dois é canônico, e não quantos registros existem.
> 4. **A relação resultante é `duplicata_de`**, dirigida do secundário para o canônico, no
>    lugar da `duplicata_suspeita` que os ligava. A suspeita vira afirmação, e a afirmação tem
>    direção.
> 5. **Este protótipo não tem escrita.** Nenhuma aresta do grafo muda quando o botão é
>    apertado: a decisão é registrada na sessão do navegador e desaparece ao recarregar. O que
>    esta tela demonstra é a **forma** da decisão e o que ela produziria num sistema com
>    backend — não uma persistência que não existe.
>
> E uma consequência assumida em voz alta: `duplicata_de` ainda **não está** no vocabulário
> fechado de relações do PRD §6. Acrescentá-la é consequência desta tela — não licença que ela
> tomou.

O registro que um clique produz, lido do DOM (`[data-decisao]`, `innerText`):

```
NOVA EDIÇÃO DA “OCUPAÇÃO ITAÚ CULTURAL” HOMENAGEIA ARTACHO JURADO
ENCENADA · 2 REGISTROS · CHAVE IDÊNTICA
FUNDIDO
por curadoria de acervo · operador autorado
em 22.08.2026
DESFAZER A DECISÃO
```

O carimbo é `DATA_DE_REFERENCIA` do build, importada de `alerta.ts` pela página de servidor e
passada como prop. **O relógio do runtime nunca é lido**: ler `new Date()` no cliente faria o
HTML exportado e a página hidratada divergirem e ainda exporia o fuso de quem avalia.

---

## O contrato `data-*` como este plano o deixou

Medido no DOM vivo e conferido no HTML exportado com a forma `atributo="`.

| atributo | onde | valores | no DOM | no HTML |
|---|---|---|---|---|
| `data-fila-duplicatas` | a coluna da fila | `84` | 1 | 1 |
| `data-grupo` | **cada linha da fila** | id do grupo | **84** | 84 |
| `data-estagio` | linha da fila + selo do painel | `chave` 34 · `probabilistico` 52 | 86 | 86 |
| `data-score` | as 51 linhas do 2º estágio + 2 selos | 3 casas | 53 | 53 |
| `data-acao` | os três botões | `fundir` · `separar` · `adiar` | 3 | 3 |
| `data-decisao` | cada decisão tomada | id do grupo | 0 → 1 por clique | 0 |
| `data-reversivel` | o bloco declarado | — | 1 | 1 |
| `data-nao-sustenta` | as três declarações honestas | — (537, 559 e 600 caracteres) | **3** | 3 |
| `data-criterio` · `data-lado` · `data-campo` · `data-divergente` | como 04-01 os deixou | — | — | — |
| `data-componente` · `data-sustentado` · `data-falso-positivo` | idem | — | — | — |
| `data-grupo-escolhido` | **NOVO** — o painel do grupo aberto | id do grupo | 1 | 1 |

**`data-campo` continua usando `chave-identidade`, com hífen** — conferido no HTML exportado:
`titulo · chave-identidade · procedencia · ocorrencias · periodo · variacao`, um de cada.

### Para 04-05, o que mudou de lugar e por quê

**04-01 tinha `data-grupo` no painel do grupo. Este plano o moveu para as 84 linhas da fila**
e deu ao painel `data-grupo-escolhido`. A razão é medível: `data-fila-duplicatas="84"` e
`[data-grupo]` valendo 85 seria um desencontro silencioso entre o que a tela declara e o que
ela tem — exatamente a classe de defeito que o projeto argumenta contra. Com a separação,
`[data-grupo].length === Number(data-fila-duplicatas)` é uma invariante que se pode medir.

**Ela vale também DEPOIS de uma decisão**, e isso foi conferido: o grupo decidido não some da
fila, migra para a seção «decisões tomadas». Medido logo após um clique em `fundir`:
`{"linhas":84,"est":{"chave":33,"probabilistico":51},"fila":84}`.

---

## Verificação — comandos e saída literal

### 1. `npm run build`

```
✓ Compiled successfully in 29.0s
✓ Generating static pages using 7 workers (1931/1931)
```

Sai com código 0. O `out/` é compartilhado com 04-03 e 04-04 e o lock do `next build` foi
disputado três vezes durante a execução — cada vez com espera e nova tentativa, **nunca com
`kill`**, como o briefing manda.

### 2. Task 1 — a fila dos dois estágios

```
OK fila: 84 grupos (33 por chave, 51 probabilisticos), troca de grupo sem navegar
  painel apos o clique: {"escolhido":"prob:evento:autorado:dup-037-13837+evento:cms:13837",
                         "linhaAberta":"prob:evento:autorado:dup-037-13837+evento:cms:13837",
                         "score":"0.950"}
  avisos no console: 0
```

O clique caiu no par de maior score do segundo estágio (0,950) e o painel o seguiu com a URL
intacta em `/studio/duplicatas/`.

### 3. Task 2 — as três ações e o registro humano

```
OK D-71/D-72: tres acoes visiveis, 0 decisao antes do clique, 1 decisao registrada com
quem e quando depois
  acoes: ["fundir","separar","adiar"]
  registro: "…FUNDIDO\npor curadoria de acervo · operador autorado\nem 22.08.2026\n
             DESFAZER A DECISÃO"
  avisos: 0
  depois da decisao, a fila continua declarando: {"linhas":84,"est":{"chave":33,
                                                  "probabilistico":51},"fila":84}
```

### 4. Task 3 — o que o acervo não sustenta, e o colapso

```
OK honestidade: 3 bloco(s) visiveis com o modo comentado desligado, colapso 80->40 com
1.304 ocorrencias, falso positivo nomeado
  cabecalho/fila: {"cabH":219,"filaTop":243,"altura":3462}
  comentarios visiveis: 0
  erros: 0 | avisos: 0
```

`data-comentado = nao` no estado inicial e **0 comentários visíveis** — as três declarações
honestas ficam na tela com o interruptor desligado, que é o requisito de D-68 mais fácil de
perder.

### 5. As três suítes herdadas

O gate 8 de `verificar-fase3.mjs` continua **vermelho pela âncora obsoleta que 04-01
documentou** — `cc34f4e`, anterior ao commit `a40f380` que consolidou as folhas. `scripts/` é
leitura neste plano; quem reancora é 04-05. Para conferir que o RESTO continua verde sem tocar
no arquivo versionado, rodei uma **cópia efêmera** em `.tmp-verificacao-0402/`, com a âncora em
`547e130` (o meu commit da Task 3). O diretório foi apagado; `git status --short scripts/` sai
vazio.

| suíte | resultado |
|---|---|
| `verificar-comentado` | **TUDO PASSOU** |
| `verificar-fase2` | **TUDO PASSOU** |
| `verificar-fase3` (cópia reancorada) | **TUDO PASSOU** |

Gates estruturais, saída literal:

```
ok   arquivos com a diretiva de cliente: 25 em código
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo): 0 violações em 25 clientes
ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 63 telas
ok   peso de out/_next/static/chunks: 1063 KB (teto 1.600 KB)
ok   D-08 · token de cor de apoio em .ts/.tsx: 0 em código
ok   posicionamento preso à janela fora de casca.tsx: 0 em código
ok   inserção de HTML bruto em src/: 0 ocorrências em 88 arquivos
ok   src/app/globals.css intocado desde 547e130: 0 linhas de diferença
ok   console · erros e avisos DA APLICAÇÃO: 0 erro, 0 aviso em 48 navegações
ok   console · CSS pré-carregado e não usado: 0 diagnóstico(s) em 48 navegações
ok   requisição para fora do servidor local: 0 requisição externa · 458 recursos distintos
```

**`src/app/globals.css` não foi tocado por este plano.** Provado por
`git log --oneline c03f627..HEAD -- src/app/globals.css` → **saída vazia**.

### 6. Peso do artefato

| medida | valor | teto |
|---|---|---|
| `out/_next/static/chunks` pela suíte | **1.063 KB** | 1.600 KB |
| `out/_next/static/chunks` por `du -sk` | **1.240 KB** | 1.600 KB |
| `out/studio/duplicatas/index.html` | **320 KB** | — |

A fila de 84 grupos vive no **HTML da rota**, não nos chunks: o DTO é payload de página, e é
por isso que multiplicar por 84 o que 04-01 media num grupo não mexeu no teto que T-04-11
protege. Os 320 KB da rota são o preço de trocar de grupo sem navegar — a alternativa eram 84
páginas geradas.

---

## Deviations from Plan

### 1. [GRAVE — relatar] O commit de correção levou junto dois arquivos do 04-04

- **Onde:** commit `a2a1b2e`
- **O que aconteceu:** `git add` dos meus dois arquivos seguido de `git commit` **sem
  `--only`** commitou o ÍNDICE INTEIRO — e 04-04 tinha acabado de estagiar
  `src/componentes/roteiro.tsx` e `src/estilos/roteiro.css` no mesmo working tree. Os dois
  entraram no meu commit, sob a minha mensagem.
- **Dano medido: nenhum conteúdo perdido.** `roteiro.tsx` = 13.468 bytes e `roteiro.css` =
  10.455 bytes, **idênticos no disco e no git**, e `git status --short` sai limpo. O prejuízo é
  de atribuição: os dois arquivos aparecem no histórico sob `fix(04-02)` em vez de sob o commit
  do 04-04.
- **Por que NÃO corrigi com `git commit --amend`:** 04-03 já havia commitado e empurrado
  (`27bf2ab`, `d56632f`) e todos os três executores empurram para `espelho`. Reescrever o
  histórico exigiria `push --force`, que numa janela de concorrência derruba commit de terceiro
  — troca um erro de atribuição por perda de trabalho. **A regra do briefing («se precisar
  editar arquivo fora da lista, PARE e relate») está sendo cumprida aqui: relato em vez de
  «consertar».**
- **O que 04-04 precisa saber:** `roteiro.tsx` e `roteiro.css` já estão commitados em
  `a2a1b2e`. O commit deles vai capturar só o que editarem DEPOIS; se não houver nada, o `git
  commit` sai «nothing to commit» — e isso não é perda.
- **Correção de processo, aplicada a partir daqui:** `git commit --only -- <caminhos>`.

### 2. [Regra 2 — funcionalidade crítica ausente] `data-grupo` movido para a fila, e `data-grupo-escolhido` acrescentado

- **Found during:** Task 1
- **Issue:** o plano manda `data-grupo` nas linhas da fila (84) e 04-01 o tinha no painel do
  grupo. Manter os dois daria 85 elementos `[data-grupo]` para uma fila que declara 84.
- **Fix:** `data-grupo` só nas 84 linhas; o painel recebe `data-grupo-escolhido`. Nenhum
  atributo foi renomeado nem teve o conjunto de valores alterado — `data-grupo-escolhido` é
  acréscimo, e está na tabela acima para 04-05 medir.
- **Commit:** `eb94761`

### 3. [Regra 3] `page.tsx` editado na Task 2, que não o lista

- **Found during:** Task 2
- **Issue:** o carimbo da decisão tem de vir de `DATA_DE_REFERENCIA`, que mora em `alerta.ts`
  — módulo que alcança `grafo.ts` e que um arquivo `"use client"` não pode importar por valor.
  A única fronteira por onde a constante passa é a página de servidor.
- **Fix:** `page.tsx` importa `DATA_DE_REFERENCIA` de `@/dados/alerta` e a passa como prop.
  Alternativa recusada: digitar `"2026-08-22"` no componente, que é copiar a constante.
  `page.tsx` **está** na lista de arquivos do plano (frontmatter) — só não na lista mais
  estreita da Task 2, exatamente como a deviation 2 de 04-01.
- **Commit:** `9c2072d`

### 4. [Regra 2] Três blocos `data-nao-sustenta` em vez de um

04-01 media 1. As quatro perguntas da Task 3 são declarações honestas distintas e cada uma
merece o bloco: (a) o critério resolve em um componente sobre 300 eventos — 537 caracteres, o
do módulo; (b) quanto da fila plantamos — 559; (c) o que o segundo estágio erra — 600. O gate
da Task 3 exige `>= 1`; 04-05 deve medir 3.

### 5. [Regra 2] O zero de ocorrências se declara em vez de ser impresso seco

- **Found during:** conferência visual do trio `#Vivendoartisticamente`
- **Issue:** os grupos da Enciclopédia têm 0 ocorrências (`ocorrenciasDe` devolve zero para
  elas — risco herdado, 4-CONTEXT), e a linha do colapso dizia «o evento fundido teria 0
  ocorrências, e nenhuma delas se perde», que quem lê interpreta como perda na fusão.
- **Fix:** com `ocorrenciasEnvolvidas === 0` a frase muda e declara que o zero é do acervo e
  não da fusão, e que o Studio opera sobre os eventos do CMS quando o assunto é ocorrência.
- **Commit:** `a2a1b2e`

### 6. [Regra 1 — defeito] A linha do colapso quebrava em três

`.dup-colapso-grupo` era `display:flex`, e num contêiner flex cada `<strong>` vira ITEM — a
frase quebrava antes e depois do número, como se fossem três frases. Trocado por `display:block`
com o rótulo em `inline-block`. Corrigido em `a2a1b2e`.

### 7. [Regra 3] Porta do servidor estático em conflito com os executores paralelos

`servir()` usa 43217 por padrão e os três executores a disputam: **8 execuções seguidas
falharam com `EADDRINUSE`** e uma delas custou 6 tentativas de 15s. As verificações **verbatim
do plano** rodaram e passaram na porta padrão; as reexecuções passaram a receber
`PORTA=$((45000 + RANDOM % 500))` nas cópias de trabalho, em `/tmp`. Nada em `scripts/` foi
alterado — é a mesma classe de interferência que o plano previu para `out/`.

### 8. Nota sobre a suíte da fase 3 e a rota `/roteiro`

Além do gate 8 já conhecido, a cópia efêmera acusou o gate de contagem de páginas: **1931
páginas, resíduo 1785 contra a linha de base 1784**. A página a mais é `/roteiro`, criada pelo
04-04 na mesma onda — confirmado por `ls out/roteiro`. Este plano **não acrescenta rota
nenhuma** (`/studio/duplicatas` já existia). Só na cópia efêmera a linha de base foi levada a
1785 para os gates de navegador poderem rodar; o arquivo versionado segue intocado e a
reancoragem é de 04-05.

---

## Known Stubs

Nenhum. Os dois lugares onde a tela poderia fingir, ela declara:

- **A decisão não persiste** — e o bloco `data-reversivel` diz isso na quinta afirmação, em
  produto e não em comentário. Não é stub: é o limite do protótipo, na tela.
- **A fusão não altera o grafo** — porque `duplicata_de` não está no vocabulário fechado do
  PRD §6, e a tela declara que acrescentá-la é consequência desta tela e não licença que ela
  tomou.

---

## Threat Flags

Nenhuma superfície nova fora do registro do plano. As seis mitigações declaradas foram
exercitadas:

| ameaça | como foi provada |
|---|---|
| T-04-07 (fusão sem humano) | 0 `[data-decisao]` antes de qualquer clique; 1 depois de um |
| T-04-08 (decisão irrepudiável) | o registro carrega ação, operador e carimbo de build |
| T-04-09 (operador forjado) | o nome é rotulado «operador autorado»; D-25 declarado na tela |
| T-04-10 (DP-F) | gate transitivo: **0 violações em 25 clientes**, com a fila inteira no DTO |
| T-04-11 (peso) | **1.063 KB** de chunks contra teto de 1.600 KB; o DTO é payload de rota |
| T-04-12 (score sem contexto) | o score nunca aparece sem o limiar ao lado e sem o par de 0,667 marcado «manter separados» na própria fila |

---

## O protocolo de disco — resultado

Volume a 96%, com histórico de despejo. **Nenhum arquivo leu zero byte nesta execução.**

Conferência ANTES de editar, disco contra git:

```
OK  32330 = 32330  src/dados/duplicatas.ts
OK  11652 = 11652  src/componentes/studio-duplicatas.tsx
OK   1463 =  1463  src/app/(bastidor)/studio/duplicatas/page.tsx
OK   7318 =  7318  src/estilos/studio-duplicatas.css
OK   9268 =  9268  src/estilos/studio.css        (leitura)
OK  13350 = 13350  src/app/globals.css           (leitura, e proibido)
```

Conferência DEPOIS de cada commit, **no git e não só no disco**:

| arquivo | bytes no git, ao fim |
|---|---|
| `src/componentes/studio-duplicatas.tsx` | 38.242 |
| `src/dados/duplicatas.ts` | 34.133 |
| `src/estilos/studio-duplicatas.css` | 20.081 |
| `src/app/(bastidor)/studio/duplicatas/page.tsx` | 2.373 |

`git diff --cached --numstat` foi lido antes de cada commit e `git diff-tree --name-status -r
HEAD` depois — foi ele que **flagrou** a inclusão dos dois arquivos do 04-04 no commit
`a2a1b2e`. Nenhuma remoção inexplicada em nenhum commit. Nenhuma restauração foi necessária.
Os quatro commits foram empurrados para `espelho` imediatamente.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | a fila dos dois estágios, e o grupo escolhido | `eb94761` | componente, página, folha |
| 2 | as três ações, a fusão reversível, o registro humano | `9c2072d` | componente, página, folha |
| 3 | o que o acervo não sustenta, e o colapso auditável | `547e130` | componente, `duplicatas.ts`, folha |
| — | correção: a frase do colapso e o zero do acervo | `a2a1b2e` | componente, folha (**+2 do 04-04, ver Deviation 1**) |

---

## O que NÃO foi feito, e é de propósito

- **`src/app/globals.css` não foi tocado.** Nenhuma folha nova; toda regra entrou em
  `studio-duplicatas.css`, cujo `@import` 04-01 já havia declarado.
- **`studio.css` não foi tocado** — 04-03 depende dele como 04-01 o entregou. Reusei
  `.studio-painel`, `.studio-lados`, `.studio-pastilha`, `.studio-botao` e
  `.studio-nao-sustenta` em vez de reescrevê-los.
- **Nenhuma dependência nova**, nenhum import de CSS dentro de componente, nenhuma alteração em
  `scripts/` nem em `src/dados/` da fase 3.
- **Nenhuma assinatura de `duplicatas.ts` foi renomeada.** Os 4 campos novos de
  `NumerosDaDeduplicacao` são acréscimo; 04-04 consome as assinaturas antigas intactas.
- **Nenhuma captura em `capturas/`** — o briefing limita a escrita aos quatro arquivos
  declarados, e foto não é fonte. As conferências visuais foram feitas em `/tmp`.

---

## Next Phase Readiness — o que 04-05 pode assumir

1. **Os quatro atributos reservados existem:** `data-fila-duplicatas`, `data-acao`,
   `data-decisao`, `data-reversivel`. Mais `data-grupo-escolhido`, que é acréscimo deste plano.
2. **`[data-grupo]` vale exatamente 84**, igual a `data-fila-duplicatas`, antes e depois de
   qualquer decisão. Se um dia divergirem, é defeito.
3. **`data-nao-sustenta` são 3 blocos**, não 1.
4. **`data-campo` usa `chave-identidade` com hífen**, conferido no HTML exportado.
5. **O gate 8 continua precisando de reancoragem**: `cc34f4e` → o commit desta onda. Com a
   âncora em `547e130` a suíte inteira sai `TUDO PASSOU`.
6. **A linha de base de páginas subiu para 1785** por causa da rota `/roteiro` do 04-04.

## Self-Check: PASSED

Os quatro arquivos declarados existem, leem e batem byte a byte com o git. Os quatro commits
existem no histórico e no espelho. Nenhuma afirmação numérica deste documento foi transcrita à
mão: todas vêm de saída literal de `npx tsx` ou do DOM vivo.
