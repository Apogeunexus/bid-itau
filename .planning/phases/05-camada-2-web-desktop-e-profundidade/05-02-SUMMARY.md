---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 02
subsystem: web-descobrir-buscar
status: complete
tags: [web, descobrir, buscar, grade, facetas, WEB-01, WEB-04, D-79, D-80]

requires:
  - "src/estilos/web.css — .web-grade, .web-grade-largo, .web-coluna-fixa, .web-duas-colunas, .web-painel (05-01, consumidas sem edição)"
  - "src/app/globals.css — as 11 linhas de @import da fase 5 (05-01, NÃO tocado)"
  - "src/dados/indice.ts — consultar, facetasDe, o DTO colunar (fase 3, inalterado)"
  - "src/dados/frase.ts — FRASE_DO_CENARIO_5 (fase 3, importada por valor)"
  - "src/dados/cartao.ts — o DTO de cartão com `especial` (fase 2, inalterado)"
provides:
  - "src/estilos/web-descobrir.css — a grade de 3 colunas e o destaque em 2"
  - "src/estilos/web-buscar.css — as duas colunas com as facetas à esquerda"
  - "data-grade-web, data-destaque-curado, data-coluna-facetas — os três atributos que o plano reservou, agora emitidos"
  - "data-coluna-resultados, data-grade-resultados, data-frase-natural, data-convite-frase, data-link-filtros — cinco acrescentados, documentados abaixo"
  - "o link para /filtros/, que 05-06 resolve"
affects:
  - "05-08 mede os oito atributos acima no HTML exportado"
  - "05-06 é dona da rota /filtros/, para onde a coluna de facetas aponta"
  - "quem abrir src/app/(app)/buscar/page.tsx deve mover FRASE_DO_CENARIO_5 para prop de servidor (10.311 bytes medidos)"

tech-stack:
  added: []
  patterns:
    - "divergência de visão SÓ por CSS sob [data-view=…]: zero ramo em JavaScript, zero componente irmão"
    - "colocação explícita por grid-column, nunca por `order` — a ordem do DOM continua sendo a ordem de leitura"
    - "o que existe numa visão e não na outra existe no DOM das duas; quem some é a caixa, por display:none"
    - "gate de usabilidade compara RETÂNGULO contra RETÂNGULO, mais foto que um humano olha"

key-files:
  created: []
  modified:
    - src/componentes/feed.tsx
    - src/app/(app)/descobrir/page.tsx
    - src/estilos/web-descobrir.css
    - src/componentes/buscar.tsx
    - src/estilos/web-buscar.css

decisions:
  - "a grade tem 3 colunas em Descobrir e 2 em Buscar, e o número sai de --web-colunas, não de media query: a visão é estado da aplicação (D-01, D-02)"
  - "o destaque curado ocupa span 2 — é o span, e não uma borda mais grossa, que faz o destaque ser outra coisa numa grade"
  - "as facetas vão para a coluna 1 por grid-column, com a ordem do DOM da fase 3 preservada: a ordem de leitura de teclado e leitor de tela não muda entre as visões"
  - "a frase do Cenário 5 é um SEGUNDO bloco, permanente na web, e o convite da fase 3 some na web — nenhum dos dois foi movido, para a visão app ficar intacta"
  - "o link para /filtros/ não aparece na visão app: a porta de entrada de Filtros no app é de 05-06"
  - "importar FRASE_DO_CENARIO_5 custa 10.311 bytes medidos porque frase.ts não é sacudida pelo empacotador; cabe no orçamento e fica, com o caminho barato nomeado no código"

metrics:
  duration: "~2h"
  completed: 2026-08-22
  tasks: 2
  commits: 3
  files: 5

actuals:
  tokens: 14441
  tasks: 2
  commits: 3
---

# Phase 5 Plan 02: Descobrir e Buscar na visão web Summary

As duas telas de Camada 1 que mais ganham com tela grande passaram a ter layout de
desktop **sem uma linha de componente irmão e sem um único ramo em JavaScript decidindo
layout por visão**: Descobrir é grade de três colunas com o destaque curado ocupando
duas, e Buscar tem as facetas numa coluna permanente à esquerda, coladas na rolagem, com
os resultados em grade ao lado.

**59 gates verdes no DOM vivo, em Chrome headless de 1440×960. Console: 0 erro, 0 aviso.
Rede: 0 requisição externa.** As fotos das quatro telas — duas telas × duas visões — foram
olhadas, não só tiradas.

---

## O resultado, sem rodeio

`/descobrir/` na visão web mostra **três colunas de 346,7px dentro dos 1.088px úteis**, com
o destaque curado medindo **717px contra 347px** de um cartão comum, e os **12 de 12 selos
de motivo com altura maior que zero e dentro do retângulo do próprio cartão**, sem toque e
sem hover. Os pés dos cartões de uma linha caem todos na mesma altura.

`/buscar/` na visão web abre com a coluna de facetas **já aberta, sem nenhum clique**, no
retângulo `[176, 496]` contra `[520, 1264]` dos resultados — disjuntos, facetas à esquerda.
Com resultado na tela, a coluna **cola a 20px do topo e fica lá** em `scrollY` 900, 2.400 e
5.200. Marcar uma faceta leva o total de **108 a 33** sem trocar o `pathname` e sem
recarregar a página.

Na visão app as duas telas continuam **exatamente** como a fase 2 e a fase 3 as deixaram,
e isso está medido e não afirmado: cartão de 330px numa moldura de 330px, uma linha por
cartão, facetas empilhadas abaixo dos resultados, `position: static`.

---

## Como a divergência foi feita — e o que NÃO foi feito

D-79 e D-05 proíbem `ComponenteWeb` como arquivo irmão. O que este plano acrescentou aos
dois componentes de cliente é isto, e só isto:

| arquivo | o que mudou |
|---|---|
| `feed.tsx` | o contêiner de cartões ganhou `data-grade-web` e a classe `.web-grade`; o invólucro do cartão especial ganhou `data-destaque-curado` e `.web-grade-largo` |
| `buscar.tsx` | resultados e facetas viraram dois filhos de um mesmo corpo; três blocos novos, todos presentes no DOM das duas visões |

**Zero `if (visao === …)` nos dois arquivos.** Não é preferência de estilo: sob
`output: "export"` o HTML nasce no build e a visão só é conhecida depois de ler o
`localStorage`. Um ramo por visão renderizaria no build uma árvore diferente da do
navegador, o React acusaria a divergência, e o gate de console limpo — que fechou em 0
erro e 0 aviso — cairia por causa disso.

**A ordem do DOM de Buscar é a da fase 3, de propósito.** Bastaria trocar os dois filhos
de lugar para as facetas caírem à esquerda sem uma linha de CSS. Isso trocaria a ordem de
leitura da visão app, onde as facetas vêm depois dos resultados desde que a tela existe.
`grid-column: 1` mais `grid-row: 1` põem a coluna onde o olho precisa sem mexer no que o
teclado e o leitor de tela percorrem. O `grid-row: 1` não é decoração: sem ele, um item
colocado na coluna 1 depois de um item na coluna 2 cai para a linha seguinte, e a coluna
de facetas apareceria **embaixo** dos resultados — presente, visível, e visivelmente
errada.

**Nada foi movido de lugar para servir a web.** Os três blocos que existem numa visão e
não na outra existem no DOM das duas, e quem some é a caixa:

| bloco | web | app | por quê |
|---|---|---|---|
| `[data-frase-natural]` — a frase do Cenário 5 por extenso | visível | `display: none` | tela 28 pede a tradução à vista o tempo todo; na moldura de 390px seria altura roubada do primeiro resultado |
| `[data-convite-frase="app"]` — o convite da fase 3 | `display: none` | visível | dois convites para a mesma tela na mesma página é ruído |
| `[data-link-filtros]` — a porta para `/filtros/` | visível | `display: none` | a entrada de Filtros no app é de 05-06; esta tela não abre uma segunda |

O gate 34 mede que na visão app existe **exatamente um** link visível para
`/buscar/frase/`, e não zero nem dois.

---

## Os oito atributos `data-*` — três reservados, cinco acrescentados

**Os três que o plano reservou, agora emitidos:**

| atributo | onde | valores |
|---|---|---|
| `data-grade-web` | o contêiner de cartões de `feed.tsx` | `sim` |
| `data-destaque-curado` | o invólucro do cartão especial | `curado`, `serendipidade` — os mesmos de `data-especial` |
| `data-coluna-facetas` | a coluna de facetas de `buscar.tsx` | `sim` |

`data-destaque-curado` carrega o valor de `data-especial` em vez de ser um sinalizador
vazio. Não é um segundo critério de destaque: é o primeiro, subido um nível para o
invólucro, porque quem ocupa duas colunas é o **item da grade**, e o item da grade é o
`div`, não o `<article>` lá dentro.

**Os cinco acrescentados, no espírito em que 05-01 acrescentou os dele** — nenhum renomeia
nem altera o conjunto de valores de um atributo de outro plano:

| atributo | onde | para quê |
|---|---|---|
| `data-coluna-resultados` | o irmão da coluna de facetas | é contra ELE que o gate mede que as facetas ficam à esquerda |
| `data-grade-resultados` | a `<ul>` de resultados | a grade de 2 colunas da web |
| `data-frase-natural` | o bloco permanente da tradução | tela 28 |
| `data-convite-frase` | o convite da fase 3 (`app`) | o par do de cima |
| `data-link-filtros` | o link para `/filtros/` | 05-08 confere que a rota resolve |

---

## Os números medidos

```
/descobrir/ web   grid-template-columns : 346.656px 346.672px 346.656px   (3 colunas)
                  cartão comum          : 347px de 1.088px de grade
                  destaque curado       : 717px  (span 2 + o gap de 24px)
                  linhas da grade       : 5
                  selos de motivo       : 12 de 12 com altura > 0, 12 de 12 dentro do cartão
                  <Comentario> na grade : 0
/descobrir/ app   display               : flex   (a grade não vazou)
                  cartão                : 330px de 330px úteis, uma linha por cartão

/buscar/ web      facetas               : [176, 496]      position: sticky
                  resultados            : [520, 1264]     disjuntos
                  colada em scrollY     : 900 → topo 20 · 2.400 → topo 20 · 5.200 → topo 20
                  pé da coluna          : alcançável, sobra de 482px que rolam por dentro
                  resultado             : 360px de 744px  (2 colunas)
                  tipo etiquetado       : 100 de 100 visíveis
                  marcar uma faceta     : 108 → 33, pathname intacto, página não recarregou
/buscar/ app      facetas               : abaixo dos resultados, position: static
                  resultado             : 330px de 330px, uma linha por resultado
```

---

## O que o import de uma frase custou — medido, não estimado

O plano mandou ler `FRASE_DO_CENARIO_5` de `frase.ts` por valor. **Isso custa 10.311
bytes no bundle de `/buscar`**, e o número saiu de duas compilações A/B com e sem o
import:

```
chunk da rota /buscar   com o import : 57.292 bytes
                        sem o import : 45.349 bytes
total de out/_next/static/chunks  com : 1.280.768
                                  sem : 1.270.457   →  10.311 bytes de diferença
```

O empacotador **não sacode a árvore de `frase.ts`**: `traduzir`, `regras` e
`montarVizinhancaDeSemelhanca` viajam para o navegador de quem abre Buscar, sem serem
chamados, por causa de uma constante de 51 caracteres.

**Fica**, porque cabe no orçamento de 20 KB deste plano e porque a alternativa dentro dos
meus arquivos seria redigitar a frase do RFP — a segunda cópia que diverge na primeira
correção, com a banca lendo a errada. Mas o caminho barato existe e **custa zero byte de
chunk**: `src/app/(app)/buscar/page.tsx` é componente de servidor, e uma constante lida lá
e passada por prop viaja no HTML da página estática, exatamente como 05-01 registrou.
Aquele arquivo não é deste plano; o comentário no `import` de `buscar.tsx` diz isso a quem
o abrir a seguir.

**Meu peso total no orçamento de 20 KB:**

| parte | bytes |
|---|---|
| `frase.ts` arrastada para o chunk de `/buscar` | 10.311 |
| as 23 regras de CSS das duas folhas, no bundle minificado | ~2.489 |
| **soma** | **~12,8 KB de 20 KB** |

O teto global de `out/_next/static/chunks` segue folgado: **1.254 KB contra 1.600 KB**,
medido pelo gate 4 de `verificar-fase3`.

---

## Deviations from Plan

### 1. [Rule 3 — bloqueio] A sonda descartável vive FORA do repositório

**Encontrado em:** antes da Task 1.
**Problema:** o plano pede `scripts/sonda-05-02.ts`, mas a instrução de execução declara
`scripts/` leitura para este executor, e cinco outros executores correm em paralelo.
**Decisão:** a sonda foi escrita em `sonda-05-02.mjs` no diretório de rascunho, importando
`scripts/servir-out.mjs` e `scripts/navegador.mjs` por caminho absoluto, sem tocar em
nenhum dos dois.
**A decisão se pagou no mesmo dia:** três builds meus foram reprovados no `tsc` por sondas
que OUTROS executores deixaram em `scripts/` — `sonda-05-06.ts` com `@ts-expect-error`
inútil e `sonda-05-07.ts` chamando um método que `navegador.mjs` não tem. Uma sonda minha
ali dentro teria feito o mesmo com os builds deles.
**Estado final:** `git status --short scripts/` não tem nenhum `sonda-05-02`. A sonda nunca
entrou no repositório, então não houve o que apagar.

### 2. [Rule 1 — o plano descreveu a tela errada] Não existe controle escondendo as facetas

**Encontrado em:** Task 2, lendo `buscar.tsx`.
**O plano diz:** «hoje, na visão app, as facetas ficam atrás de um controle — descubra como
esse estado é guardado» e «o controle em si fica escondido na visão web».
**O que a fase 3 realmente deixou:** as facetas são a seção 5, **sempre renderizada**,
empilhada abaixo dos resultados. Não há controle, não há estado de aberto/fechado. O único
botão de abrir/fechar é o «ver os 94 temas», que é sobre quantidade de opções e não sobre
a visibilidade do painel — e ele continua onde estava, nas duas visões.
**Consequência:** não havia nada para forçar aberto nem para esconder. O trabalho virou
**colocação**: pôr a mesma seção numa coluna à esquerda na web, e deixá-la empilhada no
app. O gate 29 mede o empilhamento no app e o 30 mede que ela não é sticky lá.

### 3. [Rule 1 — gate escrito errado] O `sticky` da coluna, medido no estado que importa

**Encontrado em:** Task 2, na primeira execução da sonda — falha legítima, e a única do dia.
**Medida:** com a busca VAZIA, rolar tirava o topo da coluna da janela (topo −137 com
`scrollY` 393).
**A causa não é defeito de CSS.** A faixa da grade tem a altura do mais alto dos dois
filhos; com a busca vazia, o mais alto é a própria coluna (920px, o teto de
`.web-coluna-fixa`), então `sticky` **não tem para onde viajar** dentro da própria área. Os
393px que a página rola são o conteúdo que vem depois da grade — a lente do mapa.
**Provado, e não presumido:** com resultado na tela a área da faixa passa a 7.960px e a
coluna cola em `topo: 20` e fica lá em `scrollY` 900, 2.400 e 5.200.
**O gate foi reescrito para medir os dois estados com a verdade de cada um:** no estado
vazio exige-se que a coluna nunca saia da tela (ela não sai: `[−137, 783]` numa janela de
960); com resultado, exige-se que o topo **pare** em 20px, ±1px, nas três alturas. O
segundo gate é mais forte que o do plano, que só pedia «dentro da janela».

### 4. [Rule 3 — colisão de índice] A Task 2 foi absorvida pelo commit de 05-06

**O que aconteceu:** seis executores partilham UM índice do git. Entre o meu `git add` dos
dois arquivos da Task 2 e o meu `git commit -- <paths>`, o executor de 05-06 rodou
`git commit` sem pathspec — e um commit sem pathspec leva o índice inteiro, inclusive o
que outro processo acabou de encenar nele. Quando o meu commit rodou, o conteúdo já estava
em HEAD e não havia mudança para registrar.
**Estado:** `src/componentes/buscar.tsx` (46.943 bytes) e `src/estilos/web-buscar.css`
(7.675 bytes) estão em `fb0591f`, byte a byte iguais ao disco, com todo o meu conteúdo
conferido por `grep` no objeto do git. **Nada se perdeu.**
**O que NÃO foi feito:** rebase, reset ou qualquer separação a posteriori. Reescrever a
história ali destruiria o commit de 05-06 e o de quem mais estivesse empurrando no mesmo
minuto. O registro ficou em `db1da8c`, um commit vazio de propósito que nomeia o commit
absorvente e explica a corrida.
**Lição para a onda:** com índice partilhado, `git add` seguido de `git commit` em duas
chamadas é uma corrida. A forma segura é `git commit -- <paths>` numa chamada só, que lê a
árvore de trabalho e ignora o índice dos outros.

### 5. [Rule 1 — bug de ferramenta] O `percent` do STATE.md zera a CADA escrita, não só nas duas comandadas

A instrução de execução avisa que `state.update-progress` e `state.record-metric` já
zeraram o percentual quatro vezes, e manda não rodá-los. **Não rodei nenhum dos dois — e o
percentual zerou assim mesmo, três vezes.** Medido:

```
antes                             percent: 79
depois de state.advance-plan      percent: 0
consertado a mão                  percent: 86   (24 de 28 planos)
depois de state.add-decision      percent: 0
consertado a mão                  percent: 86
```

**O defeito não é dos dois comandos nomeados: é de qualquer escritor do frontmatter do
STATE.md.** `advance-plan` e `add-decision` reescrevem o bloco e recalculam o percentual
como 0. `completed_plans` foi para 24, que **está certo** — 20 planos das fases 1 a 4 mais
os 4 SUMMARYs da fase 5 no disco —, e 24 de 28 arredonda para 86.

O conserto foi aritmético e conferido: `round(completed_plans × 100 / total_plans)`,
a mesma conta que o commit `55ba961` fez à mão na fase 4. **A próxima pessoa que rodar
qualquer comando de estado deve conferir o campo depois** — e quem for consertar a
ferramenta procura o escritor do frontmatter, não os dois comandos que a instrução nomeia.

### 6. [não é desvio, é ruído medido] Um 404 de console que não se reproduz

Numa execução da sonda apareceu `404` em
`/buscar/frase/__next._tree.txt?_rsc=…`, o pré-carregamento do Next. O arquivo **existe**
em `out/buscar/frase/`. A causa é concorrência: um `next build` de outro executor
reescreve `out/` inteiro durante a minha navegação. Duas execuções seguintes, com o
`out/` estável, fecharam com console limpo. Não há defeito no código deste plano.

---

## Verificação — o que fechou e o que não fechou

| suíte | estado | nota |
|---|---|---|
| `npm run build` | **verde** | precisou de 9 tentativas: o `tsc` cobre o repositório inteiro e reprovava por arquivos de outros executores |
| `npm run verificar-fase2` | **TUDO PASSOU** | DESC-01 a DESC-08, console limpo em 26 navegações |
| `npm run verificar-comentado` | **TUDO PASSOU** | o modo desligado não fura a grade |
| `npm run verificar-fase3` | vermelha no gate 8 | herdado de 05-01, `globals.css` ancorado em `c03f627`; 05-08 reancora. **Os 7 gates antes dele passam**, e dois deles importam aqui: DP-F com 0 violações em 32 clientes, e chunks em 1.254 KB de 1.600 KB |
| `npm run verificar-fase4` | vermelha no gate 17 | **não é deste plano** — ver abaixo |
| sonda 05-02 | **59 gates verdes, 0 falhas** | 22 em Descobrir, 37 em Buscar |

### O gate 17 de `verificar-fase4`, e por que ele não é meu

Ele conta as páginas de `out/` e explica a diferença rota a rota: mediu 2.463 páginas,
resíduo 2.316 contra 1.784 esperados — **532 páginas a mais**. Elas são das rotas que os
outros cinco planos desta onda criaram, e a esmagadora maioria é de um só:

```
out/play/           530 diretórios  (529 rotas de /play/[slug], plano 05-07)
out/filtros/          1             (05-06)
out/busca-nao-encontrada/  1        (05-06)
out/agenda-nao-encontrada/ 1        (05-06)
out/redacao/          2             (05-04)
out/observatorio/     1             (05-05)
```

**Este plano cria zero rota.** O commit da Task 1 toca um arquivo em `src/app/`, e é uma
mudança de classe utilitária no contêiner de `descobrir/page.tsx`. O gate 17 vai precisar
do mesmo reancoramento que o gate 8 de `verificar-fase3` — é matéria de 05-08, como o
outro, e **não foi consertado aqui**: `scripts/` é leitura para este executor.

Os 16 gates de `verificar-fase4` antes dele passam, incluindo «as 18 rotas da fase 1
intactas», «as rotas da fase 3 intactas — `/salvos` presente, `/buscar/frase` presente» e
«posicionamento preso à janela fora de `casca.tsx`: 0 em código».

### O que ficou intocado

`git log c90fc9b..HEAD -- src/app/globals.css src/estilos/web.css` devolve **vazio**:
nenhum dos seis executores desta onda abriu os dois arquivos que o traçador congelou.

---

## As fotos, e o que elas mostram que o número não pega

Quatro capturas em `capturas-05-02/` do diretório de rascunho, **fora do repositório**,
olhadas uma a uma:

- **`descobrir-web.png`** — a grade de três colunas com o destaque curado atravessando
  duas, título maior e selo de motivo maior dentro dele. Os pés de cartão de uma linha
  alinhados. A faixa de controle atravessa a largura: disposição à esquerda, persona à
  direita, e a primeira linha de cartões começa a 240px do topo, dentro da primeira vista.
- **`descobrir-app.png`** — a moldura de celular intacta, coluna única, barra de abas no pé.
- **`buscar-web-resultados.png`** — a tela que a tela 28 descreve: facetas à esquerda com
  o link de acessibilidade no alto, resultados em duas colunas com o tipo etiquetado em
  cada um, e a frase do Cenário 5 num painel permanente acima dos resultados.
- **`buscar-app.png`** — a lista de sempre, com o traço fino entre resultados e nenhum dos
  três blocos de web à vista.

---

## Known Stubs

Nenhum. Os dois arquivos de estilo saíram com regra, os dois componentes com contrato
medido, e nenhum valor foi fixado à mão para a tela parecer pronta.

O único ponteiro para frente é o link `href="/filtros/"`, que aponta para a rota que 05-06
cria nesta mesma onda. Isso é link para frente e não beco: no momento em que escrevo,
`out/filtros/` **já existe** — 05-06 já a construiu — e o gate 12 mede o `href` literal.

## Threat Flags

Nenhuma superfície nova. `T-05-05` (import novo alcançando `grafo.ts`) foi o risco real
deste plano e está **medido**: `frase.ts` importa só `./indice` e `./tipos`, e o gate DP-F
transitivo de `verificar-fase3` fecha em **0 violações em 32 clientes** depois do import.
`T-05-06` (coluna cobrindo os resultados) é a razão dos gates 3, 4, 6, 21 e 22 existirem
como comparação de retângulos. `T-05-07` (usar `<Cartao>` num resultado de busca) não
aconteceu: os resultados seguem com `<CapaSemImagem>` e `<SelosDeLinguagem>`.

## Self-Check: PASSED

```
FOUND: src/estilos/web-descobrir.css        (6.719 bytes em disco = 6.719 no git)
FOUND: src/estilos/web-buscar.css           (7.675 bytes em disco = 7.675 no git)
FOUND: src/componentes/feed.tsx             (8.082 = 8.082)
FOUND: src/componentes/buscar.tsx           (46.943 = 46.943)
FOUND: src/app/(app)/descobrir/page.tsx     (4.205 = 4.205)
FOUND: aa58885  feat(05-02) — task 1, três arquivos
FOUND: fb0591f  contém buscar.tsx e web-buscar.css (task 2, absorvida — desvio 4)
FOUND: db1da8c  chore(05-02) — o registro da absorção
```
