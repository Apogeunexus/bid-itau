---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 08
subsystem: verificacao-da-fase-5
status: complete
tags: [verificacao, nao-regressao, reancoramento, D-85, WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, APPX-01, APPX-02, APPX-03, APPX-04, APPX-05]

requires:
  - "scripts/navegador.mjs — abrirNavegador, PRELUDIO (LEITURA, não editado)"
  - "scripts/servir-out.mjs — servir({raiz}) (LEITURA, não editado)"
  - "src/dados/mapa-agenda.ts, redacao.ts, observatorio.ts, filtros.ts, play.ts — os cinco módulos de build da fase"
  - "os sete SUMMARYs de 05-01 a 05-07 — os números que este plano confere em vez de remedir"
provides:
  - "scripts/verificar-fase5.mjs — 165 gates sobre o artefato exportado, cobrindo WEB-01 a WEB-07 e APPX-01 a APPX-05"
  - "npm run verificar-fase5"
  - "verificar-fase3.mjs reancorado em c90fc9b, com as rotas da fase 5 na lista de explicáveis"
  - "verificar-fase4.mjs reancorado na mesma lista — o gate de contagem existia nas DUAS suítes"
  - "a régua da fase: a barra de abas MEDIDA nas duas visões, e o helper de dobra consertado"
affects:
  - "a fase 6 herda CINCO suítes verdes sobre o mesmo artefato: 468 gates, 0 falha"
  - "quem tocar globals.css a partir de agora derruba o gate 8 de verificar-fase3 — é o ponto"

tech-stack:
  added: []
  patterns:
    - "gate de usabilidade compara GEOMETRIA contra o contêiner E guarda foto, nunca presença"
    - "atributo de interação contado no artefato esperando ZERO, e medido no DOM vivo depois do gesto dirigido"
    - "sonda em tsx em os.tmpdir() para ler o que os módulos de build calculam de verdade"
    - "limite de dobra MEDIDO e impresso em cada gate, nunca uma altura subtraída de cabeça"
    - "contagem de gates separada entre exigir() e ok() informativo, para a reconciliação ser mecânica"

key-files:
  created:
    - scripts/verificar-fase5.mjs
  modified:
    - scripts/verificar-fase3.mjs
    - scripts/verificar-fase4.mjs
    - package.json

decisions:
  - "o gate de contagem de páginas existia nas DUAS suítes herdadas, não numa; 05-03, 05-04, 05-06 e 05-07 diagnosticaram o de verificar-fase4 e o plano só nomeou o de verificar-fase3. Os dois foram reancorados, com a mesma disciplina e sem mover o limiar de 1.784"
  - "«cabe na primeira vista» não se mede subtraindo uma altura: mede-se contra o LIMITE, e o limite depende de ONDE a barra está. Na visão app ela é sticky no PÉ (60 px, limite 807); na visão web a MESMA barra é sticky no TOPO (59 px) e não cobre o pé, então o limite é a janela inteira"
  - "o realce de D-81 é medido DEPOIS da transição de 120 ms declarada em web.css: dois requestAnimationFrame medem o meio da transição e leem stroke-width 0 sobre um pino que está ficando laranja"
  - "a sonda de «como o servidor resolve endereço inexistente» roda do lado do NODE, não dentro da página: um fetch avaliado no documento produz um 404 no console e faz o gate de «0 erro» acusar um erro que a própria suíte provocou"
  - "o gate de ramo-por-visão usa lookbehind para exigir identificador SOLTO: roteiro.tsx tem `cenario.visao === \"mobile\"`, que lê um CAMPO DE DADO para escrever um rótulo, e um gate sem o lookbehind teria de ganhar uma exceção nomeada — que é como um gate começa a não medir mais nada"
  - "os atributos COMPARTILHADOS (data-denominador, data-nao-sustenta, data-realcado, data-contador-vivo) são tratados como compartilhados porque 05-01 pediu por escrito; o gate de colisão vale para os 55 EXCLUSIVOS, e para os compartilhados o que se exige é a FORMA do valor"

metrics:
  duration: "~2h30"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 4

actuals:
  tokens: 51800
  tasks: 3
  commits: 3
---

# Phase 5 Plan 08: A verificação da fase 5 e a não-regressão das quatro suítes Summary

`npm run verificar-fase5` existe e fecha com **165 gates verdes** sobre o artefato exportado,
cobrindo WEB-01 a WEB-07 e APPX-01 a APPX-05 no DOM vivo em Chrome headless a 1440×960. As
**quatro suítes herdadas voltaram inteiras** sobre o MESMO `out/`, sem rebuild entre elas —
**67 + 43 + 94 + 99 = 303 gates, 0 falha, nenhum limiar movido**.

Os dois reancoramentos foram feitos. E foram **três**, não dois: o gate de contagem de
páginas existia nas DUAS suítes herdadas.

---

## O resultado, sem rodeio

```
verificar-fase2      TUDO PASSOU.   67 verdes · 0 falha   exit 0
verificar-comentado  TUDO PASSOU.   43 verdes · 0 falha   exit 0
verificar-fase3      TUDO PASSOU.   94 verdes · 0 falha   exit 0
verificar-fase4      TUDO PASSOU.   99 verdes · 0 falha   exit 0
verificar-fase5      TUDO PASSOU. · 165 gates verdes · 4 linha(s) informativa(s) · 0 falha(s)
                                                          exit 0
                     ───────────────────────────────────
                     303 herdados + 165 novos = 468 gates, 0 falha
```

**Um `npm run build`, cinco suítes sobre o mesmo `out/`.** 2.463 páginas, resíduo **1.784**.
Console: **0 erro e 0 aviso da aplicação em 85 navegações**. Rede: **0 requisição externa**,
345 recursos distintos, todos no servidor local. **0 diagnóstico de CSS pré-carregado e não
usado** — as 11 folhas novas não reintroduziram o que a consolidação da fase 4 fechou.

**12 capturas de tela**, fora do repositório, tiradas **e olhadas** uma a uma.

---

## O QUE ESTE PLANO EXISTE PARA MEDIR — os contratos que atravessam planos

Seis executores correram em paralelo na onda 2 e cada um mediu só o seu pedaço. Estes quatro
contratos ninguém tinha como verificar sozinho, e são a razão declarada de este plano existir.

### 1. D-85 — o motivo do editor contra o selo público, caractere a caractere

05-04 escreveu o editor de trilha; o selo público de `/trilha/[slug]/` é da fase 3. Nenhum
dos dois podia comparar o próprio texto com o do outro. Aqui os dois são lidos em **duas
navegações** e comparados por **igualdade estrita** depois de aparar as pontas, pelos **três**
caminhos: o atributo do editor, o `value` do campo controlado, e o `innerText` do selo.

```
ok   D-85 · o motivo de CADA passo no editor bate CARACTERE A CARACTERE com o selo público
     de /trilha/[slug]/: 3 passos, conferidos pelos TRÊS caminhos (atributo do editor,
     value do campo, texto do selo): passo 1 117 caracteres · passo 2 167 caracteres ·
     passo 3 168 caracteres · os selos do público estão visíveis com altura 69/104/104px
```

Os três textos foram impressos por inteiro no relatório. **Confirmado independentemente**: a
medida de 05-04 estava certa, e agora ela é um gate permanente.

### 2. Os DOIS links para `/filtros/`, CLICADOS

05-01 escreveu o link em `/acontece/` e 05-02 em `/buscar/`. A rota foi criada por 05-06,
**depois**, na mesma onda. O export estático não valida href interno: os três planos podiam
estar verdes com os dois links apontando para o nada, e o defeito só apareceria ao vivo.

```
ok   o link para /filtros/ escrito por 05-01 em /acontece/ RESOLVE — clicado, não conferido
     pelo href: href «/filtros/» · clique em «Filtrar este acervo» levou de /acontece/ para
     /filtros/ · a tela de chegada tem data-filtros=true, 8 dimensões e contador 5092
ok   o link para /filtros/ escrito por 05-02 em /buscar/ RESOLVE — clicado, não conferido
     pelo href: href «/filtros/» · clique em «filtrar por acessibilidade — as 8 dimensões
     como critério, n» levou de /buscar/ para /filtros/ · a tela de chegada tem
     data-filtros=true, 8 dimensões e contador 5092
```

### 3. O vocabulário `data-*` não colidiu

Sete planos acrescentaram atributos ao contrato congelado por 05-01. A forma mecânica da
pergunta: um atributo do vocabulário só pode aparecer nas rotas de UM plano — exceto os que
05-01 declarou **compartilhados** por escrito.

```
ok   nenhum atributo EXCLUSIVO de um plano aparece nas telas de outro:
     55 atributos conferidos em 13 rotas, cada um só nas telas do próprio plano
ok   os atributos COMPARTILHADOS mantêm a mesma FORMA de valor em toda tela onde aparecem:
     data-denominador, data-nao-sustenta, data-realcado, data-contador-vivo · data-realcado
     só toma «sim» e «nao» nas 13 rotas, como 05-01 escreveu no código
```

`data-denominador` é de 05-01 **e** de 05-05 **e** de 05-06 **e** de 05-07, com a mesma
semântica, como 05-01 pediu. Tratá-lo como exclusivo teria acusado como colisão o reúso que o
contrato manda.

### 4. O peso somado da onda, atribuído por plano

```
ok   peso de out/_next/static/chunks: 1280 KB · +235 KB contra os 1045 KB medidos por 05-01
     antes da onda 2 · teto 1600 KB · folga 320 KB
     05-01 · teto  60 KB ·     0 KB · o DTO viaja no flight payload da rota, não nos chunks
     05-02 · teto  20 KB ·  12.8 KB · 10,3 KB são frase.ts arrastada para o chunk de /buscar
     05-03 · teto  20 KB ·   3.4 KB · medido por dois builds A/B; produtor.tsx custa 0
     05-04 · teto  60 KB ·    37 KB · dois chunks exclusivos das duas rotas de Redação
     05-05 · teto  60 KB ·    29 KB · 16 KB de componente + 13,2 KB de regras .obs*
     05-06 · teto  80 KB · não isolado · árvore compartilhada por seis executores
     05-07 · teto 100 KB · não isolado · o Turbopack co-empacotou a onda inteira
```

**O gate não inventa um número por quem não separou o seu.** 05-06 e 05-07 disseram, cada um,
que não conseguiram isolar a própria fatia numa árvore com seis agentes; o relatório repete
isso em vez de estimar.

---

## OS TRÊS REANCORAMENTOS — e por que foram três

### 1. `verificar-fase3.mjs`, gate 8 — `globals.css`

```diff
- const COMMIT_FIM_DA_FASE_2 = "c03f627";
+ const COMMIT_FIM_DA_FASE_2 = "c90fc9b";
```

`c90fc9b` é o commit da Task 1 de 05-01, o único da fase que tocou `globals.css`, e conferido:
`git diff --numstat c90fc9b..HEAD -- src/app/globals.css` sai **vazio**.

**A forma continua sendo «diferença zero».** A alternativa — permitir `@import` novo para
sempre — pareceria mais tolerante e provaria menos. É a exigência de diferença zero que faz o
gate provar que os SEIS executores da onda 2 não abriram o arquivo, e nada mais verifica isso.

```
ok   src/app/globals.css intocado desde o fim da fase 2 (c90fc9b): 0 linhas de diferença
```

### 2. A lista de rotas explicáveis — nas DUAS suítes

O plano nomeou o gate de contagem de `verificar-fase3.mjs`. **Ele existe também em
`verificar-fase4.mjs`, na linha 782**, e 05-03, 05-04, 05-06 e 05-07 o diagnosticaram, cada um
por conta própria, nos seus SUMMARYs. Rodado antes da edição, `verificar-fase4` fecha com
**16 verdes e aborta ali** — os ~83 gates seguintes nunca rodam.

Os dois receberam a mesma lista, com o mesmo comentário dizendo por que cada padrão entrou:

```js
r === "filtros/index.html" ||              // 05-06
r === "busca-nao-encontrada/index.html" || // 05-06
r === "agenda-nao-encontrada/index.html" ||// 05-06
/^play\/[^/]+\/index\.html$/.test(r)       // 05-07 — 529 páginas
```

**`out/404.html` NÃO entrou**, e o comentário diz por quê: ele existe na linha de base desde a
fase 2, e 05-06 trocou o **conteúdo** dele sem acrescentar página. Pô-lo na lista levaria o
resíduo a 1.783 e o gate acusaria como defeito uma página que sempre existiu.

**O limiar de 1.784 não se moveu em nenhuma das duas.** A conta fecha exatamente:

```
fase3: 2463 páginas · 679 novas (fase 3: 146; fase 4: 1; fase 5: 532) · resíduo 1784
fase4: 2463 páginas · 146 da fase 3 · 1 da fase 4 · 532 da fase 5 · resíduo 1784
```

**532 = 529 (05-07) + 3 (05-06)**, sem sobra de uma página.

### O diff, conferido mecanicamente

```
OK scripts/verificar-fase3.mjs — sem limiar movido (49 linhas de diff)
OK scripts/verificar-fase4.mjs — sem limiar movido (23 linhas de diff)
```

Os TRÊS gates de `globals.css` de `verificar-fase4.mjs` sobreviveram **sem edição**, como
foram escritos para sobreviver: 21 folhas no disco e 21 declaradas, 0 linha de regra
acrescentada desde `a40f380`, e o bloco `:root` idêntico byte a byte (1.562 bytes).

---

## O QUE FALHOU DE VERDADE, e o que foi consertado

### A · O bloco 7 de `verificar-fase3` estava quebrado desde a onda 2 — e ninguém sabia

Com o gate 8 verde pela primeira vez desde 05-01, a suíte passou a rodar os 86 gates
seguintes. **O bloco 7 falhou:**

```
VERIFICAÇÃO FALHOU: clique falhou: elemento com retângulo zerado
    at bloco7Frase (verificar-fase3.mjs:1553)
```

Diagnosticado, e não presumido. Em `/buscar/`, na visão app — que é a inicial — existem
**dois** links para `/buscar/frase`:

```json
{ "view": "mobile", "total": 2, "detalhe": [
  { "texto": "traduzir esta frase em critérios", "vis": false, "w": 0, "h": 0, "pai": "frase-natural" },
  { "texto": "buscar por frase",                 "vis": true,  "w": 147, "h": 30, "pai": "convite-frase" } ] }
```

O primeiro é o bloco `[data-frase-natural]` que **05-02 acrescentou** — a tradução do Cenário
5 por extenso, permanente na visão web e `display: none` na app. Sob `output: "export"` o HTML
é um só para as duas visões, os dois blocos existem no DOM das duas, e quem some é a caixa
(05-02 registrou isso por escrito; D-79/D-05 proíbem o `if (visao === …)` que evitaria).

**O defeito é do GATE, não da tela.** `document.querySelector` devolvia o primeiro do DOM
quando o gate queria dizer «um link que uma pessoa consegue clicar» — e `cdp.clicar`, que faz
hit-test de verdade justamente para pegar «link presente que não navega», recusou com razão. A
tela continua oferecendo **exatamente um** link visível na visão app, que é o que AGEN-07
afirma e o que o gate 34 de 05-02 mede.

Corrigido para o primeiro link **visível**. Nenhum limiar mudou, nenhum gate foi acrescentado
ou removido, e a afirmação ficou **mais forte**. Depois: **94 verdes, TUDO PASSOU**.

### B · A régua da dobra estava errada — e este plano existiu para descobrir isso

O helper `limiteUtil()`, herdado de `verificar-fase4.mjs`, subtraía a barra de abas **sempre
que ela existisse** e devolvia `barra.top` como limite. Na primeira execução:

```
FALHA D-80 · o mapa INTEIRO cabe na primeira vista: medido mapa de 551 a 954 ·
      limite 0 (moldura menos a barra de abas, barra 59 px) · janela 960
```

**Limite ZERO.** Medido nas cinco rotas de `(app)`, nas duas visões:

| visão | posição da barra | altura | limite útil |
|---|---|---|---|
| app | `sticky; bottom: 0` — no PÉ | **60 px** | **807** (o topo da barra) |
| web | `sticky; top: 0` — no TOPO | **59 px** | **960** (a janela inteira) |

Uma barra no topo não cobre o pé, e nada deve ser subtraído por ela. Em `verificar-fase4.mjs`
o defeito **nunca disparou** porque as três telas daquela fase são de bastidor e não montam
barra nenhuma — ele só aparece com uma rota de `(app)` aberta na visão web, que é exatamente o
que esta fase criou. **`verificar-fase4.mjs` não foi editado por isto**, e continua correto
para o que ele mede.

**E os três números que os planos discutiram são os três reais, de coisas diferentes:**

```
05-03 e 04-05 usaram 59 — é a altura da barra na visão WEB, onde ela fica no topo
a caixa da barra na visão APP mede 60
os 70 de 05-06 são «base da moldura menos o limite»: 876 − 807 = 70
o LIMITE de 05-06 é 807 — exatamente o que este bloco mede
```

**Nenhum dos três estava errado sobre o que mediu; o que estava errado era subtrair uma
ALTURA.** A suíte passou a usar o LIMITE medido e a imprimi-lo em cada gate de dobra.

### C · O realce lido no meio da transição

O gate «o realce é PINTURA e não só atributo» leu `stroke-width: 0px` sobre um pino que estava
ficando laranja. Causa: `.web-realce` declara `transition: … stroke-width 120ms`, e dois
`requestAnimationFrame` (≈32 ms) medem o meio da transição. Com 300 ms de espera:

```
ok   D-81 · o realce é PINTURA e não só atributo — e o pino não realçado prova o contraste:
     item: contorno rgb(255, 120, 0) 2px, fundo color(srgb 1 0.470588 0 / 0.08) ·
     pino realçado: traço rgb(255, 120, 0) 2px, preenchimento rgb(255, 120, 0) ·
     pino NÃO realçado: traço rgba(0, 0, 0, 0) 0px, preenchimento color(srgb 0 0 0 / 0.45)
```

### D · A própria suíte sujava o console que ela mede

O gate «como `servir-out.mjs` resolve endereço inexistente» fazia `fetch` **de dentro da
página**, e o 404 resultante ia para o console do navegador:

```
FALHA console · erros e avisos DA APLICAÇÃO: medido 1 erro, 0 aviso em 85 navegações
       erro: Failed to load resource: 404 http://127.0.0.1:43217/rota-que-nao-existe/
```

A sonda passou para o lado do Node. Responde a mesma pergunta e não suja o que outro gate
mede. É o defeito de gate mais barato de cometer e o mais fácil de «consertar» afrouxando o
gate de console — que teria destruído a medida que vale.

### E · O gate de score procurava o atributo no elemento errado

`data-score-ia` é atributo de **linha**, mas mora num descendente da linha — 05-04 o tirou do
painel de propósito para a contagem exportada não sair 21 com 20 itens de IA. O gate perguntou
«a linha TEM o atributo» e mediu 0. Corrigido para «a linha CONTÉM um score»: 20 de 20.

### F · O painel de procedência é intercalado, e agrupar por índice trocava as somas

`[data-procedencia-fatia]` vem em UMA LINHA por procedência com as duas leituras lado a lado —
a decisão de 05-05, para a inversão 61,8%→22,4% aparecer junta. Agrupar as seis fatias por
índice dava «entidades 22.645». O gate passou a ler a `data-leitura-procedencia` declarada em
cada fatia: **7.810 e 66.563**, e a inversão virou gate própria.

---

## O que `verificar-fase5.mjs` mede, bloco a bloco

### (b) Gates estruturais — 30 gates, sem navegador

```
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira):
     0 violações em 32 clientes · os 11 componentes de cliente da fase 5 entre os varridos (11/11)
ok   os módulos de build da fase alcançam o grafo pelo lado SERVIDOR da fronteira:
     5 de 5: mapa-agenda.ts, redacao.ts, observatorio.ts, filtros.ts, play.ts
ok   os dois módulos de FIO (fora do files_modified de 05-01 e 05-07) são SÓ-DE-TIPOS:
     0 import por valor em mapa-agenda-wire.ts e play-wire.ts
ok   as 11 folhas da fase 5 declaradas em globals.css: 11 de 11 · 21 folhas de rota ao todo
ok   nenhuma folha órfã em src/estilos/: 0 órfãs · 21 no disco, 21 declaradas
ok   globals.css desde a consolidação (a40f380): 15 @import · 0 REGRA · 0 removida
ok   o bloco :root byte a byte desde a consolidação: 1562 bytes idênticos · 12 hex
ok   globals.css intocado pelos SEIS executores da onda 2 (desde c90fc9b): 0 linhas de diferença
ok   D-79/D-05 · componente IRMÃO por visão: 0 pares em 41 componentes
ok   D-79/D-05 · ramo em JavaScript decidindo LAYOUT pela visão: 0 leituras da visão corrente
     fora de casca.tsx e aviso-desktop.tsx · 0 comparações de visão solta em 108 arquivos
ok   as três rotas novas da fase 5: 3 de 3
ok   as rotas de /play/[slug]/: 529 rotas em out/play/
ok   out/404.html presente e NÃO sendo a página padrão do Next: 15 KB · data-beco="404" presente
ok   as 18 rotas da fase 1 intactas: 18 de 18
ok   as rotas herdadas intactas: 129 sessões · 15 cidades · 300 eventos · 359 produtores
ok   total de páginas em out/: 2463 · resíduo 1784
```

**O gate de D-79/D-05 não existia antes**, e é o que protege a regra estrutural da fase
inteira. Ele tem duas metades: nenhum PAR de arquivos que difira só por sufixo de visão, e
nenhum arquivo lendo a visão corrente fora de `casca.tsx` e `aviso-desktop.tsx` — que é a
forma mais afiada da mesma pergunta, porque um componente que nunca lê a visão não pode
ramificar por ela.

O padrão do gate usa `lookbehind` para exigir identificador **solto**. `roteiro.tsx` tem
`cenario.visao === "mobile"`, que lê um **campo de dado** do cenário para escrever um rótulo,
não a visão corrente para escolher layout. Um gate sem o lookbehind acusaria isso e teria de
ganhar uma exceção nomeada — que é como um gate começa a não medir mais nada.

### (b2) Coerência entre as telas e os módulos — 17 gates

A sonda em `tsx`, em `os.tmpdir()` (a lição de 04-05: o `tsx` não aplica o mapeamento de
`paths` do `tsconfig` a arquivos dentro de `node_modules`). Ela lê os cinco módulos e confere
que os números que as telas imprimem batem com os que os módulos calculam:

```
ok   05-01 · a interseção do mapa da agenda: 129 com sessão · 158 com lugar · 0 com os DOIS
ok   05-01 · 110 dentro do contorno + 48 fora = 158 · lista 158 itens, mapa 110 pinos
ok   05-01 · e a TELA imprime esses números: 158 itens · 110 pinos · 220 data-par
ok   05-05 · entidades ic 4826 + derivado 2937 + autorado 47 = 7810 ·
     arestas ic 14882 + derivado 51600 + autorado 81 = 66563
ok   05-05 · a conferência de TRÊS pontas fecha · 3 fontes independentes
ok   05-05 · 7 indicadores · 2 não sustentados · valor nulo só onde não há lastro
ok   05-06 · 8 dimensões · 3 sustentadas · 5 zeradas
ok   05-03/05-06 · 5108 declaram + 2702 nunca declararam = 7810
ok   05-07 · 529 mídias · 9 categorias somando 529
ok   05-07 · a ponte: 34 arestas de 14 mídias, alcançando 25 eventos, de 529
ok   o acervo · 0 de 300 eventos declaram ingresso, e 2425 de 2425 sessões saem gratuitas
ok   o acervo · FAIXA ETÁRIA não existe em campo nenhum — e as duas telas dizem o mesmo
ok   05-04 · 60 itens · 20+20+20 · 20 com score, 0 fora da IA
ok   os DTOs abaixo do teto: mapa-agenda 53694/61440 · redacao 57052/61440 · observatorio 14969/61440
```

**Faixa etária é conferida nas duas pontas** — `filtros.ts` diz `tipo: "inexistente"` com
todos os denominadores em zero, e `observatorio.ts` diz `valor: null, sustentado: false`. Duas
telas de dois planos diferentes, afirmando o mesmo sobre o acervo.

### (b3) O contrato `data-*` no HTML exportado — 18 gates

Uma linha por rota, casando `data-x="` (nunca o nome solto, senão o payload RSC infla a
contagem). E os **cinco atributos de interação com esperado ZERO**:

```
ok   interação · data-realcado="sim" em /acontece/: 0 no artefato exportado
ok   interação · data-motivo-veto em /redacao/fila/: 0
ok   interação · data-veto-bloqueado em /redacao/fila/: 0
ok   interação · data-decisao-redacao em /redacao/fila/: 0
ok   interação · data-assistido="1" em /play/<slug>/: 0
ok   interação · e o par do zero: data-realcado="nao" no artefato: 268 dizem «nao», 0 «sim»
```

O último gate é o que faz os outros cinco valerem: o zero é ausência de **realce**, não
ausência do atributo. Todos os cinco são medidos no DOM vivo depois do gesto dirigido.

### As 12 telas no DOM vivo — 100 gates

Os que mais importam, com a saída literal:

```
ok   D-80 · lista e mapa LADO A LADO: lista {x:240,y:538,w:462,h:480} · mapa {x:735,y:551,w:451,h:403} · disjuntos=true
ok   D-80 · o mapa INTEIRO cabe na primeira vista: mapa de 551 a 954 · limite 960
ok   os 110 pinos com RETÂNGULO não-vazio dentro do quadro: 0 zerados · 0 fora · 110 com data-par
ok   05-01 · a BIJEÇÃO 110↔110 nos DOIS sentidos: 158 itens (110 mapeáveis + 48 não) ·
     0 só na lista · 0 só no mapa · os 48 declaram POR QUE (fora-do-desenho): 48 de 48
ok   D-81 · mouseover no ITEM realça o pino de mesmo data-par — e NENHUM outro
ok   D-81 · mouseout devolve os DOIS a «nao» — o realce não fica preso aceso
ok   D-81 · mouseover no PINO realça o ITEM de volta
ok   D-80 · a coluna de facetas abre JÁ ABERTA, à esquerda, sem sobrepor · sem um clique
ok   D-80 · com RESULTADO na tela a coluna COLA e o topo PARA: scrollY 900/2400/5200 → topo
     20/20/20 · variação máxima 0px
ok   CMS · web · a lista de ocorrências É TABELA: display=grid · 53 linhas · 53 células
ok   T-05-14 · com o campo VAZIO o botão está de fato `disabled`, e o atributo reflete o BOTÃO
ok   T-05-14 · clicar o botão travado, forçar Enter e forçar submit NÃO registra decisão: 0
ok   D-83/D-84 · o veto com motivo cria EXATAMENTE uma decisão, com motivo, autor e carimbo
ok   D-88 · o painel de procedência INTEIRO na primeira vista: topo 86, base 767, janela 960
ok   D-88 · a INVERSÃO na tela: entidades ic 4826 > derivado 2937 · arestas derivado 51600 > ic 14882
ok   D-90 · indicador sem lastro NÃO desenha barra nenhuma: 0 barras nos 2 sem lastro
ok   D-89 · 4 públicos, todos em /observatorio/ · 4 ordens DIFERENTES · 1 conjunto único
ok   D-91 · os OITO controles, todos marcáveis — inclusive as 5 que medem zero
ok   D-90 · marcar «Audiodescrição» leva o contador a ZERO, e o zero vem EXPLICADO com número
ok   T-05-29 · o afrouxamento entrega o número que prometia: prometido 300 · entregue 300
ok   D-92 · concluir leva data-assistido a 1, SOBREVIVE a recarregar, e é IDEMPOTENTE
ok   T-05-37 · storage adulterado nos dois casos — a tela continua de pé
ok   os SETE blocos da tela 24 em três rotas de produtor · 7 de 7 visíveis
```

### O modo comentado — 5 gates

```
/filtros/     desligado 1 comentário somando 0px, 20 blocos de honestidade · ligado 118px, 20
/observatorio desligado 3 comentários somando 0px, 16 blocos · ligado 157px, 16
/play/        desligado 1 comentário somando 0px, 10 blocos · ligado 98px, 10
/redacao/fila desligado 1 comentário somando 0px, 13 blocos · ligado 78px, 13
/acontece/    desligado 3 comentários somando 0px,  5 blocos · ligado 221px, 5
```

O modo comentado é **camada sobre o produto**. Se ligar o modo mudasse a contagem de blocos de
honestidade, um deles seria comentário disfarçado.

---

## As AMEAÇAS, exercitadas e não declaradas

### T-05-44 · `CHROME_BIN` inexistente derruba a suíte, sem cair no Chrome do sistema

```
$ CHROME_BIN=/caminho/que/nao/existe/chrome node scripts/verificar-fase5.mjs
Error: CHROME_BIN aponta para «/caminho/que/nao/existe/chrome», que não existe. Corrija a
variável ou remova-a para usar a lista padrão. NÃO caio no Chrome do sistema: verificar num
binário diferente do pedido produz um relatório sobre outra coisa.
gates verdes até a falha: 57 · linhas informativas: 2
```

### T-05-40 · limiar sabotado numa cópia descartável

Cópia em `.tmp-verificacao/` (fora do `scripts/`), com `LINHA_BASE_DE_PAGINAS` mexido de 1784
para 1785 e **nada mais**:

```
ok   as rotas herdadas intactas (fases 1 a 4), contadas uma a uma: …
FALHA total de páginas em out/, com a diferença explicada rota a rota: medido 2463 páginas ·
      146 da fase 3 · 1 da fase 4 · 532 da fase 5 · resíduo 1784 · esperado resíduo 1785
gates verdes até a falha: 21 · linhas informativas: 1 · os verdes acima continuam impressos
código de saída da cópia sabotada: 1
```

**O número REAL é impresso** (resíduo 1784) contra o esperado sabotado, e os 21 gates verdes
anteriores continuam no relatório. A cópia foi apagada; `git status --short scripts/` mostra
apenas os dois arquivos que este plano edita.

### Processo headless órfão

`pgrep -f "user-data-dir=.*verificar-fase2-"` depois das cinco suítes: **0**.

> Achado operacional: havia **um** Chrome headless órfão com `ppid 1` e **3h23min** de vida,
> anterior a esta execução — deixado por um dos executores da onda 2. Foi terminado. Depois
> das cinco suítes completas desta sessão, nenhum ficou.

---

## Os números que a fase entrega, medidos

| medida | valor |
|---|---|
| páginas em `out/` | **2.463** · resíduo **1.784** |
| das quais da fase 5 | **532** = 529 (`/play/[slug]`, 05-07) + 3 (becos e filtros, 05-06) |
| chunks | **1.280 KB** de um teto de 1.600 KB · folga 320 KB |
| componentes de cliente varridos por DP-F | **32**, com 0 violação · os 11 da fase entre eles |
| folhas de estilo | **21** no disco, 21 declaradas, 0 órfã |
| navegações na suíte da fase 5 | **85** · 345 recursos distintos, 0 externo |
| gates | 67 + 43 + 94 + 99 + **165** = **468**, 0 falha |

---

## Deviations from Plan

### 1. [Regra 3 — bloqueante] `verificar-fase4.mjs` foi editado, e não está em `files_modified`

- **Encontrado em:** Task 3, ao rodar a suíte antes de qualquer edição.
- **Problema:** o gate de contagem de páginas existe nas DUAS suítes herdadas. O plano nomeia
  só o de `verificar-fase3.mjs`. Rodado como estava, `verificar-fase4` fecha com **16 verdes e
  aborta** na linha 782 — os ~83 gates seguintes nunca rodam, e a linha de base de 99 verdes
  não pode ser verificada. 05-03, 05-04, 05-06 e 05-07 diagnosticaram isso independentemente.
- **Correção:** a mesma lista de rotas explicáveis, com o mesmo comentário, **sem mover o
  limiar de 1.784** e sem tocar `novasFase4.length === 1`. Diff de 23 linhas, conferido
  mecanicamente contra limiar movido. Depois: **99 verdes, TUDO PASSOU**.
- **Commit:** `738456e`

### 2. [Regra 1 — gate medindo a coisa errada] O bloco 7 de `verificar-fase3.mjs`

Descrito por inteiro em [O QUE FALHOU DE VERDADE, A](#a--o-bloco-7-de-verificar-fase3-estava-quebrado-desde-a-onda-2--e-ninguém-sabia).
O plano diz «não mexa em mais nada de `verificar-fase3.mjs`»; sem esta correção a suíte não
fecha, e a alternativa seria mexer em `buscar.tsx` para trocar a ordem do DOM — que é
exatamente o que 05-02 evitou de propósito para não mudar a ordem de leitura de teclado e
leitor de tela na visão app. **Nenhum limiar movido, nenhum gate acrescentado ou removido**;
o que mudou foi um seletor, de «o primeiro link» para «o primeiro link visível».
- **Commit:** `738456e`

### 3. [Regra 1 — o helper herdado media a coisa errada] `limiteUtil()`

Descrito em [B](#b--a-régua-da-dobra-estava-errada--e-este-plano-existiu-para-descobrir-isso).
A correção mora em `verificar-fase5.mjs` — o helper foi **reescrito na cópia desta fase**, e
`verificar-fase4.mjs` **não foi tocado por isto**, porque lá o ramo defeituoso nunca dispara.
- **Commit:** `ac2d71f`

### 4. [Regra 1] O plano cita «1.065 KB de antes da fase»; a medição de 05-01 é 1.045 KB

Nenhum dos sete SUMMARYs registra 1.065. 05-01 mediu **1.045 KB** num build limpo depois do
próprio commit, e gastou 0 KB dos seus 60 — logo é também o peso de antes da onda 2 para todo
efeito prático. Ancorar num número de prosa faria o delta impresso ser sobre nada. A âncora é
o medido, e a divergência está escrita no código, ao lado da constante.

### 5. [Regra 1] O plano cita «2.462 páginas»; o build conta 2.463

Os dois números são reais e de coisas diferentes: `out/` tem **2.462 arquivos `index.html`** e
**2.463 arquivos `.html`** — o 2.463º é `out/404.html`, que não é `index.html`. O critério dos
gates (todo `.html` fora de `_next/` e `acervo/`) é o que reproduz a linha de base de 1.784 da
fase 2, e é por isso que ele conta 2.463.

### 6. [Regra 1] A barra de abas: 59, 60 e 70 são todos reais

Ver [B](#b--a-régua-da-dobra-estava-errada--e-este-plano-existiu-para-descobrir-isso). O plano
manda «verificar qual está certo». A resposta é que os três medem coisas diferentes e o
**limite** — 807 na visão app — é o mesmo em todas as medições. A suíte usa o limite, nunca
uma subtração.

### 7. [Regra 1] `completed_phases` estava em 0 no `STATE.md`, com 4 fases fechadas

Corrigido para **5**, contado no disco: as cinco pastas de fase têm 3 + 5 + 7 + 5 + 8 = **28
SUMMARYs para 28 PLANs**, sem uma sobra. `completed_plans` foi para 28 e `percent` para 100 —
a mesma conta `round(28 × 100 / 28)` que a fase 4 fez à mão. **100% dos planos JÁ
PLANEJADOS**, e o `Progress` diz isso com todas as letras: a fase 6 não foi discutida nem
planejada e não entra no denominador. Deixar `completed_phases: 0` ao lado de `percent: 100`
seria uma contradição visível no arquivo que este plano acabou de editar.

### 8. Quatro defeitos da própria suíte, corrigidos durante a construção

`data-score-ia` procurado no elemento errado (E), as fatias do painel agrupadas por índice
(F), o realce lido no meio da transição (C) e o `fetch` de dentro da página sujando o console
(D). Todos estão descritos com a medida que os expôs.

---

## O protocolo de disco — resultado

**O projeto saiu do iCloud.** Ele mora em `/Users/macos/Projetos/Noz`, com
`/Users/macos/Desktop/Noz` como link simbólico. **Nenhum arquivo leu zero byte nesta
execução**, e nenhuma restauração foi necessária.

Conferência antes da primeira edição, disco contra git, e cópia de segurança fora do
repositório:

```
scripts/verificar-fase3.mjs  disco=91414  git=91414  OK
scripts/verificar-fase4.mjs  disco=104115 git=104115 OK
scripts/verificar-fase2.mjs  disco=55243  git=55243  OK
scripts/verificar-comentado.mjs disco=26329 git=26329 OK
scripts/navegador.mjs        disco=15795  git=15795  OK
scripts/servir-out.mjs       disco=4820   git=4820   OK
package.json                 disco=952    git=952    OK
src/app/globals.css          disco=15669  git=15669  OK

cópias em .../scratchpad/backup/ (fora do repositório), com sha idêntico:
  verificar-fase3.mjs.orig  8d75800…  91414 bytes
  verificar-fase4.mjs.orig  0b011cb…  104115 bytes
```

Bytes conferidos **no git** depois de cada commit:

| arquivo | bytes no git | bytes no disco |
|---|---|---|
| `scripts/verificar-fase5.mjs` | 198.327 | 198.327 |
| `scripts/verificar-fase3.mjs` | 94.613 | 94.613 |
| `scripts/verificar-fase4.mjs` | 105.278 | 105.278 |
| `package.json` | 1.011 | 1.011 |

`git diff-tree --name-status -r` em cada commit: só `A`/`M`, **nenhuma deleção**. Os três
commits foram empurrados para `espelho` imediatamente depois de cada um.

> **Nota de ambiente:** depois da mudança de diretório, o remote passou a se chamar `origin` e
> aponta para `/Users/macos/Projetos/Noz-espelho.git`. Um remote `espelho` foi acrescentado
> para o mesmo caminho, e é por ele que os três commits foram empurrados.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | os blocos (b), (b2) e (b3) — 57 gates estruturais, coerência e contrato `data-*` | `59d0fe1` | 1 |
| 2 | as 12 telas no DOM vivo, os contratos cruzados e as capturas — 165 gates | `ac2d71f` | 1 |
| 3 | os reancoramentos das suítes herdadas e o script no `package.json` | `738456e` | 3 |

---

## As FOTOS, e o que elas mostram que o número não pega

Doze capturas em `$TMPDIR/capturas-fase5/`, **fora do repositório**, olhadas uma a uma:

| foto | o que mostra |
|---|---|
| `05-08-acontece-web-realce.png` | **D-81 acontecendo**: a 12ª Bienal realçada na lista e o pino dela laranja no meio do Brasil |
| `05-08-acontece-web-interseccao.png` | o recorte «por data»: 129 eventos, «0 PINOS DE 129», o mapa vazio e cada linha dizendo por que não vai |
| `05-08-descobrir-web.png` | a grade de três colunas com o destaque atravessando duas |
| `05-08-buscar-web-facetas.png` | as facetas à esquerda, os resultados em duas colunas, e o link para `/filtros/` no alto da coluna |
| `05-08-evento-cms-web.png` | **as 53 sessões em tabela**, com as cinco colunas alinhadas numa linha só (o defeito que 05-03 pegou na foto está corrigido) e o painel lateral com a ponte nomeada |
| `05-08-redacao-fila-veto-bloqueado.png` | **o estado que a banca vai querer ver**: campo vazio, «Confirmar veto» apagado, e «Espaço em branco não conta» — tudo acima da dobra |
| `05-08-redacao-trilha-sem-motivo.png` | «Esta trilha não publica», com o Passo 4 nomeado |
| `05-08-observatorio-procedencia.png` | **o painel inteiro na primeira vista**, com a inversão 61,8%→22,4% lado a lado e os 47 autorados decompostos |
| `05-08-filtros-zero-marcado.png` | Audiodescrição marcada, contador em **0**, e a explicação do zero ao lado do próprio controle |
| `05-08-filtros-web.png` | as duas colunas, critérios à esquerda em `.web-coluna-fixa` |
| `05-08-404.png` | as quatro portas com número, as cinco abas em texto (sem barra de abas) e a trilha curada |
| `05-08-play.png` | o catálogo das 529, o bloco de ponte com os quatro denominadores, os chips com as contagens |

**Nenhuma delas mostrou defeito.** As seis vezes em que esta obra teve gate verde sobre tela
quebrada estão todas corrigidas nas telas fotografadas.

---

## O que NÃO foi feito, e é de propósito

- **`src/` não foi tocado.** Este plano não altera uma linha de produto.
- **`gerar-grafo` não foi rodado.** `dados/` intacto.
- **Nenhum pacote instalado.** `package.json` ganhou **uma linha de script** e zero dependência.
- **`verificar-fase2.mjs` e `verificar-comentado.mjs` não foram abertos.**
- **Nenhum comando de estado do GSD foi executado** — nem `update-progress`, nem
  `record-metric`, nem `advance-plan`, nem `add-decision`, nem `record-session`, nem
  `roadmap.update-plan-progress`. Os seis já zeraram o `percent` do `STATE.md`, e a
  ocorrência foi registrada por 05-02, 05-03, 05-04 e 05-06. `STATE.md`, `ROADMAP.md` e
  `REQUIREMENTS.md` foram editados **à mão**, e o `percent` foi conferido depois: **100**.
- **`src/componentes/desertos.tsx` NÃO foi consertado** — ver Known Stubs.

## Known Stubs

### 1. O `<title>` de `src/componentes/desertos.tsx` — herdado da fase 3, ainda aberto

05-05 diagnosticou: `desertos.tsx` dá ao `<title>` de cada estado uma **lista de filhos**, e
React 19 exige string única — no HTML exportado as 27 `<title>` saem vazias e a hidratação da
rota cai. 05-05 contornou montando a camada só depois da hidratação, e nomeou o conserto
definitivo — trocar os filhos por uma template string — como sendo de 05-08.

**Não foi feito, e a razão é de escopo, não de esquecimento.** `desertos.tsx` é arquivo de
produto e não está no `files_modified` deste plano, que declara medir sem alterar. Consertá-lo
mudaria o artefato e exigiria refazer as cinco suítes sobre outro `out/`, no plano cujo
trabalho é justamente provar que ESTE `out/` está íntegro.

**O que isso custa hoje, medido:** nada no console (0 erro em 85 navegações) e nada no texto —
«Sergipe», «Tocantins» e a frase que distingue registro de oferta cultural estão no HTML
estático. O que espera a hidratação são os 27 polígonos pintados.

**Para quem pegar:** é uma linha em `src/componentes/desertos.tsx`, mais a remoção do
`useState/useEffect` de `observatorio.tsx`. Depois disso, `verificar-fase5` tem de rodar de
novo — o gate do mapa de desertos mede os 27 retângulos.

### 2. A leitura de fonte sem comentários está duplicada pela QUARTA vez

`semComentarios`, `arquivosDe`, `importsDe` e `resolverModulo` existem iguais em
`verificar-fase2/3/4/5.mjs`. A duplicação é deliberada — as três primeiras são linha de base
de fases anteriores e alterá-las invalidaria a comparação de não-regressão. O lugar certo de
resolvê-la é um módulo `fonte.mjs` numa fase que possa tocar as quatro de uma vez.

## Threat Flags

Nenhuma superfície nova. As sete ameaças do registro deste plano foram **exercitadas**:

| ameaça | como foi provada |
|---|---|
| T-05-39 (gate verde sobre tela quebrada) | onde o gate afirma usabilidade ele mede geometria contra o contêiner E guarda foto; 12 capturas, com os caminhos no relatório, olhadas uma a uma |
| T-05-40 (limiar relaxado) | cópia sabotada derrubou a suíte imprimindo o número REAL e preservando 21 gates verdes; e o diff das duas suítes herdadas foi varrido mecanicamente contra limiar movido |
| T-05-41 (atributo de interação dado como ausente) | os cinco entram com esperado ZERO no artefato, com o zero declarado como proposital, e são medidos no DOM vivo depois do gesto |
| T-05-42 (arquivo corrompido) | disco contra git nos 8 arquivos críticos antes da primeira edição, cópias fora do repositório, bytes conferidos NO GIT depois de cada commit, e `git diff-tree` sem deleção |
| T-05-43 (captura commitada) | foto só com `DIR_CAPTURAS` definida; `git status --short` vazio ao fim |
| T-05-44 (Chrome do sistema) | `CHROME_BIN` inexistente derruba a suíte com a mensagem nomeada, e não cai no Chrome do sistema |
| T-05-SC (pacote) | **zero dependência nova**; `package.json` ganhou uma linha de script |

---

## Next Phase Readiness — o que a fase 6 pode assumir

1. **Cinco suítes verdes sobre o mesmo artefato: 468 gates, 0 falha.** Rodar as cinco custa um
   build e ~10 minutos, e é a rede de regressão da Camada 3.
2. **Quem tocar `globals.css` derruba o gate 8 de `verificar-fase3`** — e isso é o ponto.
   Quem precisar de uma folha nova reancora em UM commit, como 05-01 fez, e o gate volta a
   provar que a onda seguinte não tocou o arquivo.
3. **O gate de contagem de páginas existe em DUAS suítes.** Quem acrescentar rota reancora nas
   duas, com o limiar de 1.784 intacto — e não põe `404.html` em nenhuma das listas.
4. **A régua está declarada:** limite 807 na visão app (barra no pé, 60 px), janela inteira na
   visão web (barra no topo, 59 px), moldura inteira em bastidor e em `/404`. Nunca subtrair
   uma altura.
5. **`verificar-fase5.mjs` é o molde mais completo**: sonda em `tsx`, gate de irmão-por-visão,
   atributo de interação com esperado zero, e o par `exigir()`/`ok()` que torna a contagem de
   gates mecanicamente reconciliável (165 gates + 4 informativas = 169 linhas `ok`).
6. **`desertos.tsx` continua com o defeito de uma linha.** Ver Known Stubs.

## Self-Check: PASSED

```
FOUND scripts/verificar-fase5.mjs   198.327 bytes em disco = 198.327 no git
FOUND scripts/verificar-fase3.mjs    94.613 bytes em disco =  94.613 no git
FOUND scripts/verificar-fase4.mjs   105.278 bytes em disco = 105.278 no git
FOUND package.json                    1.011 bytes em disco =   1.011 no git
FOUND 59d0fe1  feat(05-08) — os gates estruturais, a coerência e o contrato data-*
FOUND ac2d71f  feat(05-08) — as 12 telas no DOM vivo e os contratos cruzados
FOUND 738456e  fix(05-08) — os reancoramentos, sem mover um limiar
os três commits presentes no git local E no espelho
git status --short: limpo · nenhuma cópia sabotada, nenhuma sonda, nenhuma foto no repositório
```
