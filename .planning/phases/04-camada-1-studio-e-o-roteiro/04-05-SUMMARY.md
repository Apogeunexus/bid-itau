---
phase: 04-camada-1-studio-e-o-roteiro
plan: 05
subsystem: verificacao
status: complete
tags: [verificacao, gates, STUD-01, STUD-02, STUD-03, STUD-04, nao-regressao, ponto-seguro]

requires:
  - "scripts/navegador.mjs — abrirNavegador/PRELUDIO, LEITURA (a API real, não a presumida)"
  - "scripts/servir-out.mjs — servir({raiz}) → {url, fechar}, LEITURA"
  - "src/dados/duplicatas.ts · ocorrencias-studio.ts · roteiro.ts — lidos pela sonda, nunca alterados"
  - "out/ — o artefato exportado; as quatro suítes medem o MESMO out/"
provides:
  - "scripts/verificar-fase4.mjs — 99 gates verdes sobre STUD-01 a STUD-04"
  - "npm run verificar-fase4"
  - "os dois reancoramentos de verificar-fase3.mjs, que devolvem a suíte a 94 verdes"
  - "o percurso dos cinco cenários impresso, para quem conduzir a demonstração"
affects:
  - "a fase 5 herda quatro suítes verdes sobre o mesmo artefato — 303 gates"
  - "verificar-fase3.mjs agora prova que a ONDA 2 não tocou globals.css (diferença zero)"

tech-stack:
  added: []
  patterns:
    - "gate que afirma USABILIDADE mede geometria contra o contêiner, não só presença e visibilidade"
    - "atributo de interação é medido no DOM depois do clique que o cria, nunca por grep no HTML"
    - "sonda em tsx lendo os módulos de build, para fechar o circuito que a paralelização abriu"
    - "leitura de fonte que FALHA ALTO quando o arquivo lê zero byte com tamanho em disco (despejo do iCloud)"

key-files:
  created:
    - scripts/verificar-fase4.mjs
  modified:
    - scripts/verificar-fase3.mjs
    - package.json

decisions:
  - "o reancoramento de globals.css ficou em c03f627 com diferença ZERO exigida, e não em a40f380 com @import permitido: a forma exigida pelo plano é MAIS FRACA — ela deixa passar linha de @import nova — e a de diferença zero prova que a onda 2 inteira não tocou o arquivo. O que o plano pedia para a40f380 (só @import e comentário, :root byte a byte, variantes app:/desk:) virou TRÊS GATES NOVOS em verificar-fase4.mjs, onde este plano pode escrever"
  - "os 6 atributos de interação (data-decisao, data-editando, data-impacto, data-impacto-fonte, data-confirmar, data-cancelar) entram no gate de HTML com esperado ZERO e são conferidos no DOM depois do clique — a armadilha que 04-03 nomeou, transformada em gate que a documenta"
  - "a sonda em tsx mora em os.tmpdir() e não em node_modules/.cache: medido, o tsx NÃO aplica o mapeamento de paths do tsconfig a arquivos dentro de node_modules e a sonda morre com «Cannot find module @/dados/duplicatas»"
  - "onde um gate afirma que a tela é USÁVEL, ele mede scrollWidth contra clientWidth e o retângulo do elemento contra o da janela — é a lição de 04-04, onde presença e visibilidade davam verde com o quinto atalho cortado fora da tela"

metrics:
  duration: "~55 min"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 3

actuals:
  tokens: 27467
  tasks: 3
  commits: 3
---

# Phase 4 Plan 05: A verificação da fase 4 e a não-regressão das três suítes — Summary

`npm run verificar-fase4` prova STUD-01 a STUD-04 com **99 gates verdes** sobre o artefato
exportado, em Chrome headless a 1440×960, medindo o DOM vivo; os cinco cenários do RFP andam
**por clique** na ordem 4 → 1 → 5 → 2 → 3; e as quatro suítes fecham verdes sobre o **mesmo**
`out/` — **303 gates**, sem um limiar relaxado.

---

## O resultado, sem rodeio

| suíte | gates verdes | falhas | veredito |
|---|---|---|---|
| `npm run verificar-fase2` | **67** | 0 | `TUDO PASSOU` |
| `npm run verificar-comentado` | **43** | 0 | `TUDO PASSOU` |
| `npm run verificar-fase3` | **94** | 0 | `TUDO PASSOU` |
| `npm run verificar-fase4` | **99** | 0 | `TUDO PASSOU` |
| **total** | **303** | **0** | — |

As quatro rodaram **em sequência sobre o mesmo `out/`, sem rebuild entre elas** — 1.931
páginas `.html` fora de `_next/` e `acervo/`. Nenhum limiar foi movido em suíte nenhuma.

**Console: 0 erro e 0 aviso da aplicação nas quatro.** **Rede: 0 requisição externa**,
medida por dentro da página. **CSS pré-carregado e não usado: 0** — o número que a
consolidação entregou continua de pé.

### Sobre o «93» da linha de base: são 94, e o número não mudou

O plano herda `verificar-fase3` em **93**. Medido, ela imprime **94** linhas `ok` — e 04-04
já havia medido 94. A reconciliação é mecânica e está conferida: o arquivo tem **90 pontos de
chamada de `exigir()`** (alguns dentro de laço, imprimindo mais de uma linha) mais **3
chamadas diretas a `ok()`** — nas linhas 416, 1118 e 1944 — que são informativas e não
gates. **Nenhum gate foi acrescentado nem removido por este plano**: os dois reancoramentos
tocam a âncora de um gate e a lista de rotas explicáveis de outro, e nada mais.

---

## Os dois reancoramentos: o antes e o depois, literais

### ANTES — a suíte da fase 3 morria no oitavo gate

```
── (b) gates estruturais, sem navegador ──
  ok   arquivos com a diretiva de cliente (primeira instrução, sem comentários): 25 em código · 36 menções na fonte bruta (a fase 2 mediu 14 em código)
  ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira): 0 violações em 25 clientes
  ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 63 telas
  ok   peso de out/_next/static/chunks: 1065 KB (a fase 2 mediu 766 KB antes do índice de busca; teto do 03-04: 1.600 KB)
  ok   D-08 · token de cor de apoio em .ts/.tsx (sem comentários): 0 em código · 3 em prosa (comentários, ignorados de propósito)
  ok   posicionamento preso à janela fora de casca.tsx (sem comentários): 0 em código · 4 em prosa (comentários, ignorados de propósito)
  ok   inserção de HTML bruto em src/: 0 ocorrências em 88 arquivos
  FALHA src/app/globals.css intocado desde o fim da fase 2 (cc34f4e): medido 43 0 src/app/globals.css · esperado diferença zero

VERIFICAÇÃO FALHOU: src/app/globals.css intocado desde o fim da fase 2 (cc34f4e) — medido 43 0 src/app/globals.css, esperado diferença zero
```

**7 verdes, 1 vermelho, e a suíte parava ali** — os 87 gates seguintes nunca chegavam a rodar.

### DEPOIS — 94 verdes, e os dois gates reancorados dizendo o que provam

```
  ok   src/app/globals.css intocado desde o fim da fase 2 (c03f627): 0 linhas de diferença
  ok   total de páginas em out/, com a diferença explicada pelas rotas novas: 1931 páginas · 147 novas (fase 3: 129 sessões + 15 cidades + /salvos + /buscar/frase; fase 4: /roteiro) · resíduo 1784
```

**O limiar 1784 não se moveu** — a linha `linhaBase === 1784` está intacta. O que mudou foi a
lista do que é explicável, com `roteiro/index.html` acrescentado.

### O diff inteiro, para conferência: 4 linhas removidas, e nenhuma delas é limiar

```
-/** O commit que fechou a fase 2. Base da comparação de `globals.css`. */
-const COMMIT_FIM_DA_FASE_2 = "cc34f4e";
-      r === "buscar/frase/index.html",
-    `${paginas.length} páginas · ${novas.length} novas da fase 3 (129 sessões + 15 cidades + /salvos + /buscar/frase) · resíduo ${linhaBase}`,
```

As outras 20 linhas acrescentadas são comentário explicando por que cada âncora mudou.

### Por que a âncora ficou em `c03f627` e não em `a40f380`

O plano descreve o reancoramento como «âncora em `a40f380`, e a diferença só pode conter
linhas de `@import` e de comentário». **Essa forma é mais fraca do que a que os quatro
SUMMARYs irmãos pediram**: ela autoriza `@import` novo em `globals.css` para sempre.

Com a âncora em `c03f627` — o commit de 04-01, que escreveu as quatro linhas de `@import` de
uma vez — o gate exige **diferença zero** e com isso prova o que de fato precisava ser
provado nesta fase: **que os três executores paralelos da onda 2 não tocaram o arquivo**.
Medido: `0 linhas de diferença`.

**E o que o plano queria proteger com a âncora da consolidação não foi perdido — virou três
gates novos em `verificar-fase4.mjs`**, onde este plano pode escrever:

```
  ok   globals.css desde a consolidação (a40f380): só @import e comentário: 4 linha(s) de @import acrescentada(s) · 0 linha(s) de REGRA acrescentada(s) · 0 removida(s)
  ok   o bloco :root com os hex do manual, byte a byte desde a consolidação: 1562 bytes idênticos · 12 hex declarados
  ok   as variantes app:/desk: e a regra do modo comentado continuam em globals.css: app: e desk: presentes · [data-comentado="nao"] .comentario presente
```

As duas contagens que o plano pede estão lá: **4 linhas de `@import`** e **0 linhas de
regra**.

---

## A saída literal e completa de `npm run verificar-fase4`

É ela que substitui a promessa pela medição. Copiada do arquivo de execução, sem uma
palavra transcrita à mão. **99 gates verdes, 0 falha.**

```

> agenda-cultural-br@0.1.0 verificar-fase4
> node scripts/verificar-fase4.mjs

verificar-fase4 — STUD-01 a STUD-04 e os cinco cenários do RFP sobre o artefato exportado, em Chrome headless


── (b) gates estruturais, sem navegador ──
  ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira): 0 violações em 25 clientes · os 3 componentes de cliente da fase 4 estão entre os varridos (3/3)
  ok   os módulos de build da fase alcançam o grafo (o lado servidor da fronteira): 4 de 4 importam grafo por VALOR e rodam só no build: duplicatas.ts, ocorrencias-studio.ts, roteiro.ts, alerta.ts
  ok   D-47 · telas importando entidades/arestas/ocorrencias.json diretamente: 0 em 63 telas
  ok   folha de estilo importada de componente (a regra que a consolidação instituiu): 0 ocorrências em 88 arquivos · o único import de CSS é src/app/layout.tsx → ./globals.css, o ponto de entrada único
  ok   as quatro folhas da fase 4 declaradas em globals.css, uma linha de @import cada: 4 de 4 (studio.css, studio-duplicatas.css, studio-ocorrencias.css, roteiro.css) · 10 folhas de rota declaradas ao todo
  ok   nenhuma folha órfã em src/estilos/ (existe no disco e ninguém a declara): 0 órfãs · 10 folhas no disco, 10 declaradas
  ok   globals.css desde a consolidação (a40f380): só @import e comentário: 4 linha(s) de @import acrescentada(s) · 0 linha(s) de REGRA acrescentada(s) · 0 removida(s)
  ok   o bloco :root com os hex do manual, byte a byte desde a consolidação: 1562 bytes idênticos · 12 hex declarados
  ok   as variantes app:/desk: e a regra do modo comentado continuam em globals.css: app: e desk: presentes · [data-comentado="nao"] .comentario presente
  ok   peso de out/_next/static/chunks: 1065 KB · -59 KB contra os 1124 KB de antes da fase 4 · teto 1600 KB
  ok   D-08 · token de cor de apoio em .ts/.tsx (sem comentários): 0 em código · 3 em prosa (comentários, ignorados de propósito)
  ok   posicionamento preso à janela fora de casca.tsx (sem comentários): 0 em código · 2 em prosa (comentários, ignorados de propósito)
  ok   inserção de HTML bruto em src/: 0 ocorrências em 88 arquivos
  ok   as 18 rotas da fase 1 intactas (as três do Studio entre elas, agora preenchidas): 18 de 18
  ok   as rotas da fase 3 intactas: 129 sessões · 15 cidades · /salvos presente · /buscar/frase presente
  ok   rota /roteiro (STUD-03, STUD-04) — a única página que a fase 4 acrescenta: presente
  ok   total de páginas em out/, com a diferença explicada rota a rota: 1931 páginas · 146 da fase 3 (129 sessões + 15 cidades + /salvos + /buscar/frase) · 1 da fase 4 (/roteiro) · resíduo 1784

── (b2) coerência entre o roteiro e os módulos da onda 2 (T-04-32) ──
  ok   CONSTANTES_DA_ONDA do roteiro contra o que duplicatas.ts calcula de verdade: 8 de 8 constantes batem: gruposPorChave=33 · gruposPorChaveEncenados=27 · gruposPorChaveDoAcervo=6 · paresProbabilisticos=51 · paresProbabilisticosNaoEncenados=38 · limiarProbabilistico=0.65 · registrosEncenados=80 · ocorrenciasEncenadas=1304
  ok   a decomposição da fila fecha nos dois sentidos: 40 encenados + 39 do acervo + 5 cruzados = 84 · e 33 por chave + 51 probabilísticos = 84
  ok   os números que ocorrencias-studio.ts calcula, contra os riscos herdados de 4-CONTEXT: 2425 ocorrências · 0 com espaço · 0 de 300 declaram ingresso · 129 eventos com sessão

── (b3) o contrato data-* no HTML exportado (forma `atributo="`, nunca o payload RSC) ──
  ok   contrato data-* em out/studio/duplicatas/index.html (284 KB): data-fila-duplicatas=1 · data-grupo=84 · data-grupo-escolhido=1 · data-estagio=86 · data-score=52 · data-origem=85 · data-acao=3 · data-reversivel=1 · data-nao-sustenta=3 · data-criterio=1 · data-lado=2 · data-campo=6 · data-divergente=6 · data-componente=3 · data-sustentado=3 · data-falso-positivo=1 · data-decisao=0
  ok   contrato data-* em out/studio/ocorrencias/index.html (212 KB): data-evento-imutavel=1 · data-ocorrencia=53 · data-historico=1 · data-historico-item=1 · data-semear-cenario-4-studio=1 · data-nao-sustenta=4 · data-editando=0 · data-impacto=0 · data-impacto-fonte=0 · data-confirmar=0 · data-cancelar=0
  ok   contrato data-* em out/roteiro/index.html (47 KB): data-roteiro=1 · data-cenario=5 · data-cenario-visao=5 · data-cenario-rota=13 · data-cenario-abrir=5 · data-cenario-sustenta=5 · data-cenario-nao-sustenta=5 · data-cenario-atalho=5
       os 6 atributos de INTERAÇÃO — data-decisao, data-editando, data-impacto, data-impacto-fonte, data-confirmar, data-cancelar — medem 0 no documento de propósito: nada os cria sem clique. São conferidos no DOM vivo, nos blocos de tela.
  ok   data-campo usa `chave-identidade`, com hífen (a grafia que 04-01 congelou): 6 campos: titulo, chave-identidade, procedencia, ocorrencias, periodo, variacao

  servidor estático em http://127.0.0.1:43217 (raiz: out/)
  Chrome headless aberto · viewport 1440×960

── (c) a casca na visão web, e o aviso de superfície de desktop nas três rotas ──
  ok   viewport travado por Emulation.setDeviceMetricsOverride (não por tamanho de janela): 1440×960
  ok   a medida de «cabe na primeira vista» declarada, e não reaproveitada da visão app: limite 876px, contra moldura sem barra de abas (visão web) · barra de abas: 0px (o layout de bastidor não monta barra de abas — as três telas da fase são web)
  ok   D-67/D-78 · /studio/duplicatas/ na visão app declara que o trabalho é de tela grande: view=mobile · «Studio é superfície de desktop» · botão visível: true · conteúdo de bastidor visível: false
  ok   o botão do aviso troca a visão POR CLIQUE em /studio/duplicatas/: view=web · conteúdo de bastidor visível: true
  ok   D-67/D-78 · /studio/ocorrencias/ na visão app declara que o trabalho é de tela grande: view=mobile · «Studio é superfície de desktop» · botão visível: true · conteúdo de bastidor visível: false
  ok   o botão do aviso troca a visão POR CLIQUE em /studio/ocorrencias/: view=web · conteúdo de bastidor visível: true
  ok   D-67/D-78 · /roteiro/ na visão app declara que o trabalho é de tela grande: view=mobile · «O roteiro da demonstração é superfície de desktop» · botão visível: true · conteúdo de bastidor visível: false
  ok   o botão do aviso troca a visão POR CLIQUE em /roteiro/: view=web · conteúdo de bastidor visível: true
  ok   data-view sobrevive a recarregar (ida: web): web
  ok   data-view sobrevive a recarregar (volta: mobile): mobile

── (d) STUD-01 · /studio/duplicatas: 84 grupos, dois estágios, decisão humana ──
       visão web posta por localStorage + recarregar (a troca por clique foi exercitada no bloco (c), nas três rotas)
  ok   a fila declara 84 grupos e TEM 84 linhas visíveis, nos dois estágios: declarado 84 · 84 linhas visíveis · 33 do estágio determinístico + 51 do probabilístico
  ok   só o estágio probabilístico carrega score — a chave não estima, ela afirma: 51 linhas com data-score, e 0 delas no estágio determinístico
  ok   dos 33 determinísticos, a tela distingue os 6 REAIS do acervo dos 27 encenados: {"encenado":27,"acervo":6} · na fila inteira: {"encenado":40,"acervo":39,"cruzado":5}
  ok   D-68 · o critério de identidade VISÍVEL com o modo comentado desligado: 496px · data-comentado=nao · 3 componentes: titulo=sim, agente=nao, obra=nao
       ┌─ o critério de identidade, como ele aparece na tela (1161 caracteres)
       │ O critério que disparou a suspeita
       │ Dois registros são o mesmo evento quando têm o mesmo título normalizado, o mesmo agente
       │ realizador e a mesma obra. O critério é o da ontologia (D-22), não uma medida de parecença
       │ entre textos: ele afirma o que faz duas linhas serem a mesma coisa no mundo, e por isso a
       │ suspeita que ele levanta é auditável campo a campo.
       │ PREENCHIDO
       │ mesmo título normalizado
       │ VAZIO
       │ mesmo agente realizador
       │ VAZIO
       │ mesma obra
       │ A CHAVE LITERAL DE CADA REGISTRO
       │ A
       │ evento|nova edicao da ocupacao itau cultural homenageia artacho jurado||
       │ B
       │ evento|nova edicao da ocupacao itau cultural homenageia artacho jurado||
       │ O QUE O ACERVO NÃO SUSTENTA
       │ O critério tem três componentes e este acervo preenche um. Dos 300 eventos do grafo, 0
       │ trazem agente realizador na chave de identidade e 0 trazem obra — toda chave tem a forma
       │ «evento|título normalizado||», com os dois campos finais vazios. O que de fato casou aqui
       │ foi o título normalizado, e só ele. Isso não é falha do protótipo: é a fonte, porque nenhum
       │ evento do CMS liga agente realizador nem obra ao registro. E é precisamente por isso que
       │ existe um segundo estágio — a chave é exata, e a fonte não é.
       └─
  ok   o acervo sustenta UM dos três componentes do critério, e a tela diz qual: 1 sustentado (titulo) de 3
  ok   escolher um grupo troca o painel SEM mudar a URL: chave:evento:autorado:dup-001-1025 → prob:evento:autorado:dup-037-13837+evento:cms:13837 · URL /studio/duplicatas/ (era /studio/duplicatas/)
  ok   D-70 · ao menos 5 campos comparados por grupo, com os divergentes marcados: 6 campos (titulo, chave-identidade, procedencia, ocorrencias, periodo, variacao) · 4 marcados divergentes · 2 lados
  ok   data-score: 52 no documento e 53 no DOM depois de escolher um grupo probabilístico: 52 → 53 (as 51 linhas + o selo do falso positivo, mais o selo do painel quando ele tem score)
  ok   D-71/T-04-07 · as três ações visíveis e ZERO decisão antes de qualquer clique: ações: fundir, separar, adiar · 0 decisões · 84 grupos na fila
  ok   D-72 · 1 decisão registrada depois do clique, com QUEM decidiu e QUANDO: 1 decisão · quem: true · quando: true · «Itaú Cultural apresenta: Itaú Cultural e Museu Afro Brasil promovem visita às exposições de Mestre Didi e “Padê: sentinela à porta da memória” · ENCENADA · 2 REGISTROS · 0.950 ·  · FUNDIDO · por curadoria de acervo · operador autorado · em 22.08.2026 ·  · DESFAZER A DECISÃO»
  ok   [data-grupo] continua em 84 DEPOIS da decisão — o grupo decidido migra, não some: 84 linhas · a tela continua declarando 84
  ok   o carimbo da decisão vem da DATA DE REFERÊNCIA do build, não do relógio do runtime: anos lidos no registro: 2026 · a data de referência é 2026-08-22 (comparação por ano convertido a número, nunca por string)
  ok   D-71 · o bloco de reversibilidade cita procedência preservada e a relação duplicata_de: 392px · procedência: true · duplicata_de: true · 1222 caracteres
  ok   os números do colapso NA TELA: 80 registros, 40 eventos, 1.304 ocorrências: 80: true · 40: true · 1.304: true
  ok   os TRÊS blocos do que o acervo não sustenta, visíveis com o modo comentado desligado, cada um com número: 3 blocos · 537 car. · 559 car. · 600 car.
  ok   geometria: nada da tela de duplicatas corre para fora da janela (a lição que 04-04 pagou): scrollWidth 1440 contra clientWidth 1440 · painel dentro: true · linha dentro: true · 3 de 3 botões de ação dentro da janela

── (e) STUD-02 · /studio/ocorrencias: ficha imutável, prévia de impacto 0 → 1, 1 de 53 ──
  ok   D-73 · o evento imutável no topo e as 53 sessões dele na tabela: evento:cms:13845 (o módulo declara evento:cms:13845) · selo «imutável»: true · 53 sessões visíveis · ficha com 759 caracteres
  ok   D-73/T-04-15 · a ficha do evento não tem CAMINHO DE ESCRITA — a ausência é o conteúdo: 0 input/button/select/textarea dentro de [data-evento-imutavel]
  ok   D-74 · com o storage vazio, a prévia de impacto é 0 — e a tela diz de onde o 0 vem: data-editando=1 · data-impacto=0 · fonte com 271 caracteres
       ┌─ a procedência do número, com o storage vazio (271 caracteres)
       │ Ninguém salvou esta sessão. Nenhuma das 3 personas do protótipo a tem no repertório semeado
       │ em personas.json, e agenda-cultural:salvos deste navegador não a contém. O número é 0 porque
       │ o estado salvo é 0 — salve esta sessão e ele passa a 1 sem que nada mais mude na tela.
       └─
  ok   os 5 atributos de INTERAÇÃO de 04-03 existem no DOM depois do clique em «alterar horário»: data-editando=1 · data-impacto=1 · data-impacto-fonte=1 · data-confirmar=1 · data-cancelar=1 — os mesmos que medem 0 no HTML exportado
  ok   D-74 · O GATE QUE CARREGA A TELA: salva a sessão neste navegador, a prévia vai a 1: 0 → 1 · o número vem do estado salvo, e não é constante escrita na tela
       ┌─ a procedência do número, com a sessão salva (172 caracteres)
       │ 1 de 3 pessoas. Maria — agenda-cultural:salvos deste navegador (persona ativa). O conjunto é
       │ de pessoas, não de salvamentos: quem aparece pelos dois caminhos conta uma vez.
       └─
  ok   D-74 · com só a sessão IRMÃ salva, a prévia volta a 0 — o número é desta sessão, não do evento: data-impacto=0 com ocorrencia:derivado:13845-t1-o0029 salva e ocorrencia:derivado:13845-t1-o0028 não
  ok   o botão de confirmar está visível e HABILITADO quando o horário proposto difere do vigente: visível: 1 · desabilitado: false
  ok   D-73/T-04-15 · confirmar altera EXATAMENTE 1 de 53 linhas: 1 de 53 linhas mudaram (índice 27)
  ok   T-04-15 · a ficha do evento fica com o texto IDÊNTICO ao de antes: 759 caracteres antes, 759 depois · idênticos: true
  ok   D-75 · o histórico ganha +1 por confirmação, com quem alterou e quando: 1 → 2 · última entrada: «AUTORADO · HORÁRIO ALTERADO · 21.08.2026, 16h20 ·  · Sessão de 22.08.2026: 12:00 → 19:30 ·  · QUEM ALTEROU Informante autorado para o protótipo — o acervo não l»
  ok   D-75 · o histórico nasce com a alteração AUTORADA do evento aberto (as duas de alerta.ts, uma por evento): na tela de evento:cms:13845: 1 entrada ao abrir · no módulo: 2 alterações autoradas, em evento:cms:13845 e evento:cms:13913
  ok   as QUATRO declarações honestas visíveis, com 2.425, 0, 129 e 300: 4 blocos (espaco, gratuidade, escopo, alteracao) · números presentes: 2.425, 0, 129, 300 · espaco=371 car. · gratuidade=378 car. · escopo=361 car. · alteracao=469 car.
  ok   geometria: a tabela de 53 sessões não corre para fora da janela: scrollWidth 1440 contra clientWidth 1440 · ficha dentro: true · 53 de 53 linhas dentro da janela

── (f) STUD-03 e STUD-04 · /roteiro: os cinco cenários por clique, na ordem 4 → 1 → 5 → 2 → 3 ──
  ok   D-76 · o roteiro declara 5 cenários, tem 5 blocos, 5 entradas diretas e 13 rotas escritas: data-roteiro=5 · 5 blocos · 5 botões data-cenario-abrir · 13 rotas · 5 atalhos de índice
  ok   os atalhos do índice são data-cenario-atalho e NÃO inflam data-cenario-abrir, que fica em 5: data-cenario-abrir=5 · data-cenario-atalho=5 — dois vocabulários, 5 cada, e não 10 num só
  ok   STUD-04 · os CINCO atalhos do índice cabem na janela — medido por geometria, não por visibilidade: scrollWidth 1440 = clientWidth 1440 · 0 atalhos fora da janela · o quinto termina em 1264px de 1440px · página com 4450px
  ok   STUD-04 · o índice fica grudado no topo depois de rolar, com os cinco alcançáveis: rolagem 3490px · índice em top=0 · 5 de 5 atalhos dentro da janela
  ok   D-77 · os CINCO blocos do que o acervo não sustenta, visíveis com o modo comentado desligado, cada um com número: 5 blocos · data-comentado=nao · Cenário 1: 434 car. · Cenário 2: 669 car. · Cenário 3: 691 car. · Cenário 4: 588 car. · Cenário 5: 543 car.
       ┌─ Cenário 1 — o que o acervo NÃO sustenta (434 caracteres)
       │ O QUE O ACERVO NÃO SUSTENTA
       │ A cadeia rap → poesia falada → teatro documentário se apoia em 3 arestas AUTORADAS, e não em
       │ ligação da fonte. Rap está classificado em Música e Slam em Literatura, e nada no acervo
       │ liga as duas: a ponte é nossa. Ela está rotulada «autorado» na tela da trilha, passo a passo
       │ — não escondemos a ponte, mostramos de quem ela é.
       │ ORIGEM DO NÚMERO
       │ derivado do grafo · trilhaCompletaPorSlug().ligacoesAutoradas
       └─
       ┌─ Cenário 2 — o que o acervo NÃO sustenta (669 caracteres)
       │ O QUE O ACERVO NÃO SUSTENTA
       │ NENHUM evento do acervo tem data futura e território ao mesmo tempo: 9 eventos têm sessão a
       │ partir de 2026-08-22 e 158 estão situados em algum lugar, mas a interseção é 0. Os eventos
       │ do CMS têm data de 2026 e zero território; os da Enciclopédia têm território real e data
       │ histórica. Por isso Modo Cidade responde O QUE EXISTE NO TERRITÓRIO, e não o que está em
       │ cartaz esta semana — e nós não fabricamos data para tapar o buraco. Programação futura é
       │ exatamente o que chega quando os produtores publicarem no Studio, que é a tela do Cenário 4.
       │ ORIGEM DO NÚMERO
       │ derivado do grafo · ocorrenciasDe() + vizinhos(situado_em) sobre os 300 eventos
       └─
       ┌─ Cenário 3 — o que o acervo NÃO sustenta (691 caracteres)
       │ O QUE O ACERVO NÃO SUSTENTA
       │ O critério da ontologia tem três componentes — título normalizado, agente realizador e obra
       │ — e o acervo sustenta UM. Dos 300 eventos, 0 trazem agente na chave e 0 trazem obra: toda
       │ chave é «evento|<título>||». O que casou foi o título sozinho, e é exatamente por isso que
       │ existe um segundo estágio probabilístico e um desfecho humano em vez de fusão automática.
       │ Além disso, 27 dos 33 grupos são ENCENADOS: 40 arestas autoradas clonaram eventos reais com
       │ variação controlada, e estão marcadas «autorado». Os outros 6 o critério encontrou sozinho.
       │ ORIGEM DO NÚMERO
       │ chave e arestas derivadas do grafo · grupos e pares de src/dados/duplicatas.ts (constante
       │ medida)
       └─
       ┌─ Cenário 4 — o que o acervo NÃO sustenta (588 caracteres)
       │ O QUE O ACERVO NÃO SUSTENTA
       │ Nenhuma das 2.425 ocorrências do acervo declara ESPAÇO — são 0 de 2.425 —, então «onde» não
       │ é um campo que possamos mostrar por sessão. E 0 dos 300 eventos declaram ingresso, então
       │ gratuidade não recorta nada: tudo consta como gratuito porque a fonte só tem o booleano. Por
       │ fim, nenhum sistema do Itaú Cultural publica histórico de alteração de sessão — a mudança de
       │ horário deste cenário é AUTORADA e está rotulada como tal. É exatamente a lacuna que a
       │ plataforma existe para fechar.
       │ ORIGEM DO NÚMERO
       │ derivado do grafo · ocorrenciasDe() sobre os 300 eventos
       └─
       ┌─ Cenário 5 — o que o acervo NÃO sustenta (543 caracteres)
       │ O QUE O ACERVO NÃO SUSTENTA
       │ «Parecido com» casa por TEXTO, e não por travessia de aresta. Das 856 arestas «semelhante_a»
       │ que saem das entidades de Bienal, a busca alcança 50 vizinhos e 322 ficam FORA DE ALCANCE —
       │ o índice de busca não tem campo de vizinhança, então o resultado é sempre um subconjunto do
       │ que casa por título. A tela declara esse número em vez de esconder o recorte, e é isso que
       │ separa uma busca honesta de uma que parece semântica.
       │ ORIGEM DO NÚMERO
       │ derivado do grafo · montarVizinhancaDeSemelhanca() sobre a âncora da frase
       └─

  os cinco cenários, POR CLIQUE, na ordem 4 → 1 → 5 → 2 → 3 (fora de ordem de propósito)
  ok   antes do Cenário 4: o roteiro está de pé e as 5 entradas estão clicáveis: 5 entradas visíveis · visão web
  ok   Cenário 4 · o clique põe a visão declarada e leva à primeira rota do percurso: /roteiro/ → /studio/ocorrencias/ (a tela declara /studio/ocorrencias/) · visão web (declarada web) · 2 salvos
  ok   Cenário 4 · /salvos mostra 2 salvos e EXATAMENTE 1 alertado — a medida da fase 3, chegando por outro caminho: 2 declarados · 2 linhas · 1 alertado · ids ocorrencia:derivado:13845-t1-o0028, ocorrencia:derivado:13845-t1-o0029
  ok   antes do Cenário 1: o roteiro está de pé e as 5 entradas estão clicáveis: 5 entradas visíveis · visão web
  ok   Cenário 1 · o clique põe a visão declarada e leva à primeira rota do percurso: /roteiro/ → /onboarding/1/ (a tela declara /onboarding/1/) · visão mobile (declarada mobile) · 2 salvos
  ok   Cenário 1 · a persona ativa é Maria e /descobrir/ responde: persona=pessoa-usuaria:autorado:maria · 24 itens visíveis em /descobrir/
  ok   antes do Cenário 5: o roteiro está de pé e as 5 entradas estão clicáveis: 5 entradas visíveis · visão web · foi preciso 1 clique em «Trocar para a visão Web» (o cenário anterior exigia a visão app)
  ok   Cenário 5 · o clique põe a visão declarada e leva à primeira rota do percurso: /roteiro/ → /buscar/frase/ (a tela declara /buscar/frase/) · visão mobile (declarada mobile) · 2 salvos
  ok   Cenário 5 · /buscar/frase abre com a frase JÁ TRADUZIDA em fichas: 3 fichas (texto:Bienal, classe:evento, territorio:sao-paulo-uf) · 8 resultados
  ok   antes do Cenário 2: o roteiro está de pé e as 5 entradas estão clicáveis: 5 entradas visíveis · visão web · foi preciso 1 clique em «Trocar para a visão Web» (o cenário anterior exigia a visão app)
  ok   Cenário 2 · o clique põe a visão declarada e leva à primeira rota do percurso: /roteiro/ → /cidade/belem-para/ (a tela declara /cidade/belem-para/) · visão mobile (declarada mobile) · 2 salvos
  ok   Cenário 2 · /cidade/belem-para abre e a lente do mapa usa a gramática /mapa/# COM a barra final: 1 links de lente, 1 deles com a barra · «/mapa/#r=espaco_fundacao-romulo-maiorana-frm-belem~instituicao_caixa-cultural-be…»
  ok   antes do Cenário 3: o roteiro está de pé e as 5 entradas estão clicáveis: 5 entradas visíveis · visão web · foi preciso 1 clique em «Trocar para a visão Web» (o cenário anterior exigia a visão app)
  ok   Cenário 3 · o clique põe a visão declarada e leva à primeira rota do percurso: /roteiro/ → /studio/duplicatas/ (a tela declara /studio/duplicatas/) · visão web (declarada web) · 2 salvos
  ok   Cenário 3 · /studio/duplicatas abre na visão web, com os 84 grupos na tela: visão web · fila declara 84 · 84 grupos visíveis
  ok   STUD-04 · o conjunto de salvos fica em 2 nas CINCO passagens fora de ordem — a semeadura não se desfaz: salvos após cada clique, na ordem 4 → 1 → 5 → 2 → 3: 2, 2, 2, 2, 2
  ok   T-04-21 · clicar DUAS VEZES no mesmo cenário deixa o mesmo estado — a semeadura é idempotente: 1ª: 2 salvos ["ocorrencia:derivado:13845-t1-o0028","ocorrencia:derivado:13845-t1-o0029"] · 2ª: 2 salvos · conjuntos iguais: true

  o percurso, na ordem em que foi clicado:
       Cenário 4: /roteiro/ → /studio/ocorrencias/ · visão web · 2 salvos
       Cenário 1: /roteiro/ → /onboarding/1/ · visão mobile · 2 salvos
       Cenário 5: /roteiro/ → /buscar/frase/ · visão mobile · 2 salvos
       Cenário 2: /roteiro/ → /cidade/belem-para/ · visão mobile · 2 salvos
       Cenário 3: /roteiro/ → /studio/duplicatas/ · visão web · 2 salvos

── (g) modo comentado nas três telas novas: os comentários somem, o argumento fica ──
  ok   /studio/duplicatas/ · com o modo comentado DESLIGADO os comentários têm altura 0 e o argumento fica: data-comentado=nao · 3 blocos de comentário, 0 visíveis, altura somada 0px · 5 blocos de honestidade/procedência visíveis
  ok   /studio/duplicatas/ · LIGADO os comentários aparecem e a honestidade continua a MESMA: data-comentado=sim · 3 comentários visíveis (51px) · honestidade 5 → 5
  ok   /studio/ocorrencias/ · com o modo comentado DESLIGADO os comentários têm altura 0 e o argumento fica: data-comentado=nao · 1 blocos de comentário, 0 visíveis, altura somada 0px · 5 blocos de honestidade/procedência visíveis
  ok   /studio/ocorrencias/ · LIGADO os comentários aparecem e a honestidade continua a MESMA: data-comentado=sim · 1 comentários visíveis (17px) · honestidade 5 → 5
  ok   /roteiro/ · com o modo comentado DESLIGADO os comentários têm altura 0 e o argumento fica: data-comentado=nao · 2 blocos de comentário, 0 visíveis, altura somada 0px · 10 blocos de honestidade/procedência visíveis
  ok   /roteiro/ · LIGADO os comentários aparecem e a honestidade continua a MESMA: data-comentado=sim · 2 comentários visíveis (330px) · honestidade 10 → 10

── (h) ameaças exercitadas (não declaradas) ──
  ok   T-04-13 · id inexistente no storage NÃO incrementa a prévia, e a tela não quebra: data-impacto=1 com 1 id válido + 1 inexistente · o descarte é declarado em 172 caracteres de procedência
  ok   T-04-13 · valor que NÃO é lista no storage: a prévia cai a 0 e a tela continua de pé: storage = "isto-nao-e-lista" · data-impacto=0 · a linha continua editável (data-editando=1)
  ok   T-04-20 · persona desconhecida em agenda-cultural:persona: o roteiro abre mesmo assim: persona = «pessoa-usuaria:nao-existe:fulano» · 5 entradas visíveis · visão web
  ok   T-04-20 · e o cenário abre CORRIGINDO a persona para a que ele declara: /roteiro/ → /onboarding/1/ · persona pessoa-usuaria:autorado:maria
  ok   T-04-07 · /studio/duplicatas carregada do zero: 0 decisões, e as 3 ações esperando um humano: 0 decisões · 3 ações visíveis

── console, acumulado na sessão inteira ──
  ok   console · erros e avisos DA APLICAÇÃO: 0 erro, 0 aviso da aplicação em 44 navegações
  ok   console · CSS pré-carregado e não usado (o número que a consolidação entregou): 0 diagnóstico(s) em 44 navegações

── rede, medida POR DENTRO DA PÁGINA (T-03-17, T-04-30) ──
  ok   requisição para fora do servidor local: 0 requisição externa · 107 recursos distintos, todos em http://127.0.0.1:43217, em 44 navegações

── resumo · uma linha por requisito ──
  STUD-01    Duplicatas: 84 grupos declarados e 84 na tela (33 determinísticos, dos quais 6 REAIS do acervo, + 51 probabilísticos com score); critério de identidade visível com o modo comentado desligado, 1 de 3 componentes sustentado; escolher grupo troca o painel sem mudar a URL; 6 campos comparados com 4 divergentes marcados; 3 ações, 0 decisão antes do clique e 1 depois, com autor e carimbo; colapso 80 registros → 40 eventos com 1.304 ocorrências preservadas
  STUD-02    Ocorrências: evento:cms:13845 imutável no topo (ficha sem um único controle de escrita) com 53 sessões; prévia de impacto medida nos três estados — 0 sem salvo, 1 com a sessão salva, 0 com só a irmã salva, provando que o número vem do estado e não da tela; confirmar alterou 1 de 53, deixou a ficha idêntica caractere a caractere e levou o histórico de 1 a 2; 4 declarações honestas com 2.425 ocorrências sem espaço, 0 de 300 declarando ingresso e 129 eventos com sessão
  STUD-03    Roteiro: 5 cenários declarados e 5 na tela, 13 rotas escritas, os 5 blocos do que o acervo NÃO sustenta visíveis com o modo comentado desligado (434/669/691/588/543 caracteres, todos com número), índice grudado no topo com os 5 atalhos dentro da janela
  STUD-04    Os cinco cenários andaram POR CLIQUE fora de ordem — 4→/studio/ocorrencias/ · 1→/onboarding/1/ · 5→/buscar/frase/ · 2→/cidade/belem-para/ · 3→/studio/duplicatas/ — cada um pondo a visão declarada e semeando o estado; salvos em 2 nas cinco passagens e idempotente ao clicar duas vezes no mesmo cenário
  console    0 erro, 0 aviso da aplicação em 44 navegações · 0 diagnóstico de CSS pré-carregado e não usado
  rede       0 requisição externa em 44 navegações · 107 recursos distintos, todos no servidor local — nenhum tile, nenhuma fonte remota, nenhuma chamada de modelo. Medida por performance.getEntriesByType('resource'), de dentro da página

── o que quem conduzir a demonstração precisa saber ──

  1 · O PERCURSO DOS CINCO CENÁRIOS, na ordem em que foram clicados e provados:
     Cenário 4: clique em /roteiro/ → /studio/ocorrencias/ · visão web · 2 salvos semeados
     Cenário 1: clique em /roteiro/ → /onboarding/1/ · visão mobile · 2 salvos semeados
     Cenário 5: clique em /roteiro/ → /buscar/frase/ · visão mobile · 2 salvos semeados
     Cenário 2: clique em /roteiro/ → /cidade/belem-para/ · visão mobile · 2 salvos semeados
     Cenário 3: clique em /roteiro/ → /studio/duplicatas/ · visão web · 2 salvos semeados
     Depois de um cenário de visão APP (1, 2 e 5), voltar ao /roteiro/ custa UM clique em
     «Trocar para a visão Web» — o roteiro é superfície de desktop (D-78). Não é defeito;
     é um passo do percurso, e é melhor sabê-lo agora do que ao vivo.

  2 · O CRITÉRIO DE IDENTIDADE da tela de duplicatas, para ser lido em voz alta:
       ┌─ critério (1161 caracteres)
       │ O critério que disparou a suspeita
       │ Dois registros são o mesmo evento quando têm o mesmo título normalizado, o mesmo agente
       │ realizador e a mesma obra. O critério é o da ontologia (D-22), não uma medida de parecença
       │ entre textos: ele afirma o que faz duas linhas serem a mesma coisa no mundo, e por isso a
       │ suspeita que ele levanta é auditável campo a campo.
       │ PREENCHIDO
       │ mesmo título normalizado
       │ VAZIO
       │ mesmo agente realizador
       │ VAZIO
       │ mesma obra
       │ A CHAVE LITERAL DE CADA REGISTRO
       │ A
       │ evento|nova edicao da ocupacao itau cultural homenageia artacho jurado||
       │ B
       │ evento|nova edicao da ocupacao itau cultural homenageia artacho jurado||
       │ O QUE O ACERVO NÃO SUSTENTA
       │ O critério tem três componentes e este acervo preenche um. Dos 300 eventos do grafo, 0
       │ trazem agente realizador na chave de identidade e 0 trazem obra — toda chave tem a forma
       │ «evento|título normalizado||», com os dois campos finais vazios. O que de fato casou aqui
       │ foi o título normalizado, e só ele. Isso não é falha do protótipo: é a fonte, porque nenhum
       │ evento do CMS liga agente realizador nem obra ao registro. E é precisamente por isso que
       │ existe um segundo estágio — a chave é exata, e a fonte não é.
       └─

  3 · OS CINCO TEXTOS do que o acervo NÃO sustenta (um por cenário) estão impressos por
     inteiro no bloco (f), acima.

  4 · O PAR DE SESSÕES DO CENÁRIO 4, com data e hora:
     atingida: ocorrencia:derivado:13845-t1-o0028 — 22.08.2026 às 12:00
     intacta : ocorrencia:derivado:13845-t1-o0029 — 23.08.2026 às 10:00
     evento  : evento:cms:13845 — Helena Ignez é a homenageada da 74ª “Ocupação Itaú Cultural”

  5 · OS NÚMEROS QUE A BANCA VAI OUVIR:
     84 grupos na fila (33 determinísticos + 51 probabilísticos)
     6 deles são duplicatas REAIS do acervo, que ninguém plantou
     80 registros colapsam em 40 eventos, com 1.304 ocorrências preservadas
     2.425 ocorrências e NENHUMA declara espaço — 0 de 2.425
     0 de 300 eventos declaram ingresso — gratuidade não recorta neste acervo

TUDO PASSOU.
```

---

## A não-regressão das três suítes, sobre o mesmo `out/`

Rodadas **em sequência, sem rebuild entre elas**, para que as quatro meçam exatamente o mesmo
artefato — 1.931 páginas.

```
########## verificar-fase2 ##########
  ultima linha: TUDO PASSOU.
  EXIT=0 · gates verdes=67 · falhas=0

########## verificar-comentado ##########
  ultima linha: TUDO PASSOU.
  EXIT=0 · gates verdes=43 · falhas=0

########## verificar-fase3 ##########
  ultima linha: TUDO PASSOU.
  EXIT=0 · gates verdes=94 · falhas=0

########## verificar-fase4 ##########
  ultima linha: TUDO PASSOU.
  EXIT=0 · gates verdes=99 · falhas=0
```

**67 + 43 + 94 + 99 = 303 gates verdes, 0 falha.** O plano exigia ao menos 243.

### Console e rede, suíte a suíte

```
verificar-fase2       ok   console: 0 erro, 0 aviso em 26 navegações
verificar-comentado   ok   console: 0 erro, 0 aviso em 7 navegações
                      ok   console da janela estreita: 0 erro ou aviso
verificar-fase3       ok   console · erros e avisos DA APLICAÇÃO: 0 erro, 0 aviso da aplicação em 48 navegações
                      ok   console · CSS pré-carregado e não usado: 0 diagnóstico(s) em 48 navegações
                      ok   requisição para fora do servidor local: 0 requisição externa · 456 recursos distintos, em 48 navegações
verificar-fase4       ok   console · erros e avisos DA APLICAÇÃO: 0 erro, 0 aviso da aplicação em 44 navegações
                      ok   console · CSS pré-carregado e não usado: 0 diagnóstico(s) em 44 navegações
                      ok   requisição para fora do servidor local: 0 requisição externa · 107 recursos distintos, em 44 navegações
```

**125 navegações somadas, 0 erro e 0 aviso da aplicação.**

Sobre **«nenhuma folha pré-carregada sem uso nas quatro suítes»**: a fase 3 e a fase 4 têm
gate NOMEADO para isso e as duas medem **0**. A fase 2 e o modo comentado não têm gate
separado — o gate deles é `0 erro, 0 aviso` sobre **todo** diagnóstico do console, que
**inclui** o aviso de preload. Um diagnóstico de preload nelas derrubaria aquele gate. As
quatro estão em zero, duas por gate nomeado e duas por gate mais amplo — dito assim, e não
como se as quatro tivessem a mesma medida.

### Peso do artefato, medido pelas duas suítes que o medem

```
verificar-fase3   ok   peso de out/_next/static/chunks: 1065 KB (teto do 03-04: 1.600 KB)
verificar-fase4   ok   peso de out/_next/static/chunks: 1065 KB · -59 KB contra os 1124 KB de antes da fase 4 · teto 1600 KB
```

As duas suítes concordam no número, o que é a conferência que importa. **1.065 KB contra o
teto de 1.600 KB** — e **59 KB ABAIXO** dos 1.124 KB que o plano registra como medida
anterior à fase. (04-04 registrou 1.240 KB; a diferença é variação entre build incremental e
build limpo, e o número desta execução vem de um `npm run build` completo.)

---

## As nove mitigações, EXERCITADAS e não declaradas

| ameaça | teste aplicado | resultado medido |
|---|---|---|
| **T-02-22** Chrome ausente | `CHROME_BIN=/nao/existe/chrome npm run verificar-fase4` | **EXIT=1**, com mensagem nomeada: «CHROME_BIN aponta para «/nao/existe/chrome», que não existe. […] NÃO caio no Chrome do sistema: verificar num binário diferente do pedido produz um relatório sobre outra coisa.» Os 24 gates estruturais (que não precisam de Chrome) rodaram e passaram antes da falha — a suíte não se autodispensou nem caiu no Chrome do sistema |
| **T-02-21** processo pendurado | `abrirNavegador()` seguido de exceção **sem** chamar `encerrar()` | **0 processos headless nossos** restantes (contados por `--user-data-dir=$TMPDIR/verificar-fase2-`), **1 perfil temporário** restante. O perfil é o custo documentado em `navegador.mjs`: `process.on('exit')` só admite trabalho síncrono. Pelo caminho normal (`encerrar()` chamado): **0 processos e 0 perfis**. E depois das **quatro suítes**: **0 perfis** — todas passam pelo `finally` |
| **T-04-07** fusão sem humano | `/studio/duplicatas/` carregada do zero, duas vezes (bloco (d) e bloco (h)) | **0 decisões** antes de qualquer clique, **3 ações** visíveis esperando; **1 decisão** depois de um clique, com autor e carimbo |
| **T-04-13** storage adulterado | id inexistente no storage; e valor que não é lista | id inexistente: `data-impacto=1` — **não incrementa**, e o descarte é declarado em 172 caracteres de procedência. Valor que não é lista (`"isto-nao-e-lista"`): `data-impacto=0` e **a tela não quebra** (a linha continua editável) |
| **T-04-15** ficha imutável | `innerText` de `[data-evento-imutavel]` antes e depois de confirmar | **759 caracteres antes, 759 depois, idênticos: true** — o mesmo número que 04-03 mediu. E a ficha tem **0** `input`/`button`/`select`/`textarea`: a ausência de caminho de escrita é medida, não afirmada |
| **T-04-20** semeadura do roteiro | `agenda-cultural:persona = "pessoa-usuaria:nao-existe:fulano"` antes de abrir um cenário | O roteiro abre com as **5 entradas visíveis**; o Cenário 1 abre e **corrige** a persona para `pessoa-usuaria:autorado:maria`, chegando em `/onboarding/1/` |
| **T-04-21** semeadura não idempotente | dois cliques seguidos no Cenário 4 | **2 salvos** nas duas passagens, **conjuntos iguais**: `["…13845-t1-o0028","…13845-t1-o0029"]`. E **2 em todas as cinco** passagens fora de ordem |
| **T-03-17** rede | `performance.getEntriesByType('resource')` em toda a sessão | **0 requisição externa** · 107 recursos distintos, todos em `http://127.0.0.1:43217`, em 44 navegações |
| **falha de gate** | limiar sabotado numa **cópia descartável** (`chave === 33` → `34`) | **EXIT=1**, `FALHA … medido declarado 84 · 84 linhas visíveis · 33 do estágio determinístico + 51 do probabilístico`. **O número real (33) foi impresso**, e os **34 gates verdes anteriores** continuam no relatório — a suíte falha alto e não perde as medições que já fez |

Nenhuma destas foi declarada sem ser rodada. A cópia sabotada foi apagada e
`git status --short scripts/` sai vazio.

---

## O que quem conduzir a demonstração precisa saber

### 1 · O percurso dos cinco cenários, na ordem em que foram clicados e provados

| ordem | cenário | clique em | leva a | visão | estado semeado |
|---|---|---|---|---|---|
| 1º | **4** | `/roteiro/` | `/studio/ocorrencias/` | web | 2 salvos (o par de sessões) |
| 2º | **1** | `/roteiro/` | `/onboarding/1/` | app | persona Maria + 2 disposições |
| 3º | **5** | `/roteiro/` | `/buscar/frase/` | app | persona Maria, disposições limpas |
| 4º | **2** | `/roteiro/` | `/cidade/belem-para/` | app | persona Carlos |
| 5º | **3** | `/roteiro/` | `/studio/duplicatas/` | web | só a visão web — a fila é dado de build |

Provado em cada desemboque, no DOM vivo:

- **Cenário 4** → `/salvos/` mostra **2 salvos e exatamente 1 alertado** (`…13845-t1-o0028`
  alertada, `…-o0029` intacta) — a mesma medida da fase 3, chegando por outro caminho.
- **Cenário 1** → persona ativa `pessoa-usuaria:autorado:maria`, e `/descobrir/` responde com
  **24 itens** visíveis.
- **Cenário 5** → `/buscar/frase/` abre com a frase **já traduzida** em **3 fichas**
  (`texto:Bienal`, `classe:evento`, `territorio:sao-paulo-uf`) e **8 resultados**.
- **Cenário 2** → `/cidade/belem-para/` abre e a lente do mapa usa `/mapa/#…` **com a barra
  final**, em 1 de 1 link.
- **Cenário 3** → `/studio/duplicatas/` abre na **visão web** com os **84 grupos** na tela.

> **⚠ O ÚNICO PASSO QUE NÃO É ÓBVIO, e que ninguém deveria descobrir ao vivo:** depois de um
> cenário de **visão app** (1, 2 e 5), voltar ao `/roteiro/` custa **um clique** em «Trocar
> para a visão Web», porque o roteiro é superfície de desktop (D-78). Isso aconteceu 3 vezes
> nesta execução e está registrado gate a gate. **Não é defeito — é um passo do percurso.**

### 2 · O texto do critério de identidade da tela de duplicatas

Para ser lido em voz alta (1.161 caracteres, lidos do DOM):

> **O critério que disparou a suspeita.** Dois registros são o mesmo evento quando têm o mesmo
> título normalizado, o mesmo agente realizador e a mesma obra. O critério é o da ontologia
> (D-22), não uma medida de parecença entre textos: ele afirma o que faz duas linhas serem a
> mesma coisa no mundo, e por isso a suspeita que ele levanta é auditável campo a campo.
>
> **PREENCHIDO** mesmo título normalizado · **VAZIO** mesmo agente realizador · **VAZIO**
> mesma obra
>
> **A CHAVE LITERAL DE CADA REGISTRO** — A: `evento|nova edicao da ocupacao itau cultural
> homenageia artacho jurado||` · B: `evento|nova edicao da ocupacao itau cultural homenageia
> artacho jurado||`
>
> **O QUE O ACERVO NÃO SUSTENTA.** O critério tem três componentes e este acervo preenche um.
> Dos 300 eventos do grafo, 0 trazem agente realizador na chave de identidade e 0 trazem obra
> — toda chave tem a forma «evento|título normalizado||», com os dois campos finais vazios. O
> que de fato casou aqui foi o título normalizado, e só ele. Isso não é falha do protótipo: é
> a fonte, porque nenhum evento do CMS liga agente realizador nem obra ao registro. E é
> precisamente por isso que existe um segundo estágio — a chave é exata, e a fonte não é.

### 3 · Os cinco textos do que o acervo NÃO sustenta

Todos visíveis com o **modo comentado desligado**, todos com número, lidos do DOM.

**Cenário 1** (434 car.)
> A cadeia rap → poesia falada → teatro documentário se apoia em **3 arestas AUTORADAS**, e
> não em ligação da fonte. Rap está classificado em Música e Slam em Literatura, e nada no
> acervo liga as duas: a ponte é nossa. Ela está rotulada «autorado» na tela da trilha, passo
> a passo — não escondemos a ponte, mostramos de quem ela é.
> *(origem: derivado do grafo · `trilhaCompletaPorSlug().ligacoesAutoradas`)*

**Cenário 2** (669 car.)
> NENHUM evento do acervo tem data futura e território ao mesmo tempo: **9** eventos têm
> sessão a partir de 2026-08-22 e **158** estão situados em algum lugar, mas a interseção é
> **0**. Os eventos do CMS têm data de 2026 e zero território; os da Enciclopédia têm
> território real e data histórica. Por isso Modo Cidade responde O QUE EXISTE NO TERRITÓRIO,
> e não o que está em cartaz esta semana — e nós não fabricamos data para tapar o buraco.
> Programação futura é exatamente o que chega quando os produtores publicarem no Studio, que
> é a tela do Cenário 4.

**Cenário 3** (691 car.)
> O critério da ontologia tem três componentes — título normalizado, agente realizador e obra
> — e o acervo sustenta **UM**. Dos 300 eventos, 0 trazem agente na chave e 0 trazem obra:
> toda chave é «evento|&lt;título&gt;||». O que casou foi o título sozinho, e é exatamente por
> isso que existe um segundo estágio probabilístico e um desfecho humano em vez de fusão
> automática. Além disso, **27 dos 33** grupos são ENCENADOS: 40 arestas autoradas clonaram
> eventos reais com variação controlada, e estão marcadas «autorado». **Os outros 6 o critério
> encontrou sozinho.**

**Cenário 4** (588 car.)
> Nenhuma das **2.425** ocorrências do acervo declara ESPAÇO — são **0 de 2.425** —, então
> «onde» não é um campo que possamos mostrar por sessão. E **0 dos 300** eventos declaram
> ingresso, então gratuidade não recorta nada: tudo consta como gratuito porque a fonte só tem
> o booleano. Por fim, nenhum sistema do Itaú Cultural publica histórico de alteração de
> sessão — a mudança de horário deste cenário é AUTORADA e está rotulada como tal. É
> exatamente a lacuna que a plataforma existe para fechar.

**Cenário 5** (543 car.)
> «Parecido com» casa por TEXTO, e não por travessia de aresta. Das **856** arestas
> «semelhante_a» que saem das entidades de Bienal, a busca alcança **50** vizinhos e **322**
> ficam FORA DE ALCANCE — o índice de busca não tem campo de vizinhança, então o resultado é
> sempre um subconjunto do que casa por título. A tela declara esse número em vez de esconder
> o recorte, e é isso que separa uma busca honesta de uma que parece semântica.

### 4 · O par de sessões do Cenário 4, com data e hora

```
atingida: ocorrencia:derivado:13845-t1-o0028 — 22.08.2026 às 12:00  →  alterada para 19:30
intacta : ocorrencia:derivado:13845-t1-o0029 — 23.08.2026 às 10:00  →  não é tocada
evento  : evento:cms:13845 — Helena Ignez é a homenageada da 74ª "Ocupação Itaú Cultural"
```

Em `/salvos/`: **2 salvos, 1 alertado.** A alertada é a `o0028`; a irmã `o0029` fica sem
alerta. É o argumento inteiro do Cenário 4 em duas linhas.

### 5 · Os números que a banca vai ouvir

| número | o que é |
|---|---|
| **84 grupos** | a fila de duplicatas — 33 por chave determinística + 51 por casamento probabilístico |
| **6 reais do acervo** | duplicatas que o critério da ontologia encontrou sozinho, que ninguém plantou |
| **80 registros → 40 eventos** | o colapso da fusão encenada |
| **1.304 ocorrências** | preservadas no colapso — nada se perde |
| **2.425 sem espaço** | 0 de 2.425 ocorrências declaram espaço |
| **0 de 300 declarando ingresso** | gratuidade não recorta neste acervo |
| **limiar 0,65** | com o par de Bienais a 0,667 marcado «manter separados» na própria fila |

Todos conferidos contra o que `duplicatas.ts` e `ocorrencias-studio.ts` calculam **de
verdade** — ver o gate de coerência abaixo.

---

## O gate mais valioso desta suíte, e o que ele fechou

04-04 escreveu `/roteiro` **sem importar** `duplicatas.ts` nem `ocorrencias-studio.ts`, para
os três planos da onda 2 poderem correr em paralelo; os números entraram como
`CONSTANTES_DA_ONDA`, cada um com o arquivo de origem nomeado. **Era o único ponto de toda a
fase onde a paralelização poderia ter produzido duas verdades** — o roteiro dizendo «33
grupos» enquanto o motor calcula outro número, as duas telas abertas lado a lado na frente de
quem avalia.

```
  ok   CONSTANTES_DA_ONDA do roteiro contra o que duplicatas.ts calcula de verdade: 8 de 8 constantes batem: gruposPorChave=33 · gruposPorChaveEncenados=27 · gruposPorChaveDoAcervo=6 · paresProbabilisticos=51 · paresProbabilisticosNaoEncenados=38 · limiarProbabilistico=0.65 · registrosEncenados=80 · ocorrenciasEncenadas=1304
  ok   a decomposição da fila fecha nos dois sentidos: 40 encenados + 39 do acervo + 5 cruzados = 84 · e 33 por chave + 51 probabilísticos = 84
  ok   os números que ocorrencias-studio.ts calcula, contra os riscos herdados de 4-CONTEXT: 2425 ocorrências · 0 com espaço · 0 de 300 declaram ingresso · 129 eventos com sessão
```

**8 de 8 batem.** O circuito está fechado: a paralelização da onda 2 não produziu duas
verdades.

---

## Um achado numérico: a tabela de 04-02 registra 53 onde o documento tem 52

**Não é regressão, e não é defeito de tela — é uma coluna trocada numa tabela de SUMMARY, e
este plano a corrige medindo os dois números.**

04-02 registra `data-score` como **53 no DOM e 53 no HTML**. Medido no artefato de hoje, o
HTML exportado tem **52**. A causa está no código e é determinística: `data-score` é emitido
(a) nas **51** linhas probabilísticas da fila, (b) no selo do painel **quando o grupo escolhido
tem score**, e (c) no selo do falso positivo. O grupo escolhido inicial é
`GRUPO_DO_TRACADOR`, que é **determinístico e não tem score** — logo o documento sai com
51 + 1 = **52**. Escolhido um grupo probabilístico, o selo do painel entra e o número vai a
**53**.

O gate mede **os dois estados** e exige a transição:

```
  ok   data-score: 52 no documento e 53 no DOM depois de escolher um grupo probabilístico: 52 → 53 (as 51 linhas + o selo do falso positivo, mais o selo do painel quando ele tem score)
```

O 53 de 04-02 é o número do **DOM depois do clique**, transcrito também na coluna do HTML. O
contrato está intacto; a tabela é que juntou duas medidas diferentes numa coluna só.

---

## As fotos, e o que só elas podem dizer

04-04 fechou um gate verde enquanto o índice do roteiro corria para fora da janela: o gate
media presença e visibilidade, e um elemento cortado continua «visível» pela definição do
prelúdio. **Quem pegou foi a foto.** Esta suíte trata isso de duas formas.

**Primeira, virou gate.** Onde um gate afirma que a tela é USÁVEL — e não apenas presente —,
ele mede **geometria contra o contêiner**:

```
  ok   STUD-04 · os CINCO atalhos do índice cabem na janela — medido por geometria, não por visibilidade: scrollWidth 1440 = clientWidth 1440 · 0 atalhos fora da janela · o quinto termina em 1264px de 1440px · página com 4450px
  ok   STUD-04 · o índice fica grudado no topo depois de rolar, com os cinco alcançáveis: rolagem 3490px · índice em top=0 · 5 de 5 atalhos dentro da janela
  ok   geometria: nada da tela de duplicatas corre para fora da janela: scrollWidth 1440 contra clientWidth 1440 · painel dentro: true · linha dentro: true · 3 de 3 botões de ação dentro da janela
  ok   geometria: a tabela de 53 sessões não corre para fora da janela: scrollWidth 1440 contra clientWidth 1440 · ficha dentro: true · 53 de 53 linhas dentro da janela
```

**Segunda, as fotos foram tiradas e OLHADAS**, porque nenhum gate julga o que um humano julga.
Salvas em `f4-duplicatas.png`, `f4-ocorrencias.png` e `f4-roteiro.png` (viewport travado de
1440×960, `captureBeyondViewport: false`). O que elas mostram:

- **duplicatas** — a fila com as marcas `DO ACERVO` pretas e as `ENCENADA` contornadas, o
  bloco de reversibilidade com as cinco afirmações, as três ações lado a lado com a razão
  escrita sob cada uma, o registro `FUNDIDO · por curadoria de acervo · operador autorado ·
  em 22.08.2026`, e o par de Bienais com **27.09.1969–14.12.1969** contra
  **04.09.1971–15.11.1971**. Nada cortado, nada sobreposto.
- **ocorrências** — a linha **28** mostrando `19:30` com a pastilha `era 12:00`, e as linhas
  29 em diante intactas em `10:00`, `11:00`, `12:00`. A coluna «espaço» diz *não declarado*
  em todas as linhas e a de entrada diz *entrada franca declarada*, com o qualificador.
- **roteiro** — o índice grudado com os **cinco** atalhos, o quinto («5 «Quero algo parecido
  com a …» APP») **inteiro dentro da janela**. O defeito que 04-04 corrigiu continua corrigido.

> Uma observação que a foto de duplicatas registra e que nenhum gate precisa: a pastilha do
> 2º estágio mostra **50** depois de uma decisão, não 51 — porque o grupo decidido migrou para
> «decisões tomadas». `[data-grupo]` continua em **84** (33 + 50 + 1 decidido), que é
> exatamente a invariante que 04-02 fixou e que o gate mede.

---

## Deviations from Plan

### 1. [Regra 2 — funcionalidade crítica ausente] A âncora de `globals.css` ficou em `c03f627`, e a proteção pedida virou três gates na fase 4

- **Found during:** Task 1
- **Issue:** o plano manda reancorar em `a40f380` permitindo linhas de `@import` novas. Os
  quatro SUMMARYs irmãos pedem `c03f627` com diferença zero. As duas formas não são
  equivalentes: **a do plano é mais fraca**, porque autoriza `@import` novo em `globals.css`
  indefinidamente — e o que aquele gate existe para impedir é justamente dois executores
  paralelos escrevendo no mesmo arquivo.
- **Fix:** âncora em `c03f627`, exigindo **diferença zero** — a forma mais forte, e a que os
  irmãos mediram. A proteção substantiva que o plano descreve para `a40f380` (só `@import` e
  comentário; `:root` byte a byte; variantes `app:`/`desk:` e a regra do modo comentado) foi
  implementada como **três gates novos em `verificar-fase4.mjs`**, onde este plano tem
  permissão de escrita. As duas contagens que o plano pede estão impressas: **4 linhas de
  `@import`, 0 linhas de regra**.
- **Nenhum limiar foi relaxado.** `verificar-fase3.mjs` recebeu exatamente os dois
  reancoramentos e nada mais.
- **Commit:** `c9131d7`

### 2. [Regra 3 — bloqueio] A sonda em `tsx` teve de sair de `node_modules/`

- **Found during:** Task 1, primeira execução
- **Issue:** a sonda que lê `duplicatas.ts` e `ocorrencias-studio.ts` foi escrita em
  `node_modules/.cache/` e morreu com `Error: Cannot find module '@/dados/duplicatas'`. O
  `tsx` **não aplica o mapeamento de `paths` do tsconfig a arquivos que moram dentro de
  `node_modules`**.
- **Fix:** a sonda passou a morar em `os.tmpdir()`, com `cwd` na raiz (que é de onde o `tsx`
  lê o tsconfig), e é **apagada num `finally`**. Fora do repositório de propósito: a
  disciplina desta fase limita a escrita a três arquivos, e um `.ts` de sonda em `src/` seria
  um quarto.
- **Commit:** `f83f779`

### 3. [Regra 1 — defeito no gate] `data-origem` estava sendo lido do elemento errado

- **Found during:** Task 2, segunda execução
- **Issue:** o gate que separa os 6 grupos reais do acervo dos 27 encenados lia
  `linha.getAttribute('data-origem')` e media `{"null": 84}` — o atributo mora num `<span>`
  **dentro** da linha, não na linha. O gate teria acusado contrato quebrado que não estava.
- **Fix:** `linha.querySelector('[data-origem]')`. Medido depois: `{"acervo":6,"encenado":27}`
  nos determinísticos e `{"encenado":40,"acervo":39,"cruzado":5}` na fila inteira — batendo
  com a decomposição que 04-02 registrou.
- **Commit:** `f83f779`

### 4. A tabela de `data-score` de 04-02 corrigida por medição, não por ajuste de gate

Documentada em seção própria acima. **O gate não foi afrouxado para caber no 53**: ele exige
os **dois** números (52 no documento, 53 no DOM depois do clique) e a transição entre eles.

### 5. Um fato do percurso que nenhum plano previu, e que a demonstração precisa saber

Voltar ao `/roteiro/` depois de um cenário de visão app custa **um clique** em «Trocar para a
visão Web» (D-78). Não é defeito — é consequência de o roteiro ser superfície de desktop.
Aconteceu 3 vezes nesta execução (após os cenários 1, 5 e 2), está medido gate a gate e está
impresso no relatório, para não ser descoberto ao vivo.

### 5b. [Regra 1 — defeito] O handler de progresso escreveu 0% para 20 de 20 planos

`gsd-tools query state.update-progress` recalculou `completed_plans: 20` de `total_plans: 20`
e gravou `percent: 0`, com a barra `[░░░░░░░░░░] 0%`. **Vinte de vinte é 100%, não 0.**
Corrigido à mão antes do commit — `percent: 100` e `[██████████] 100% da fase 4 (5 de 5
planos)` —, junto com o `Status` e o `last_activity_desc`, que ainda descreviam o 04-01.
Publicar um STATE dizendo 0% no exato commit que fecha a fase seria o tipo de desencontro
silencioso que este projeto inteiro argumenta contra.

### 6. [relatar, não consertar] O commit de documentação saiu com a autoria errada

- **O que aconteceu:** os dois commits de código foram feitos com
  `git -c user.name="Noz" -c user.email="ferramentas@autonhealth.com.br"`, como o ambiente
  manda, e estão corretos. O commit de documentação (`d5e09f5`) foi feito pelo handler
  `gsd-tools query commit`, que **não aceita os overrides de identidade** — ele saiu como
  `macOS <macos@MacBook-Air-de-macOS-2.local>`.
- **Por que NÃO corrigi com `--amend`:** o commit já estava empurrado para `espelho`, e
  reescrever exigiria `push --force` numa branch que eu não criei. Trocar um rótulo de autoria
  por um force-push em branch compartilhada é o mesmo cálculo que 04-02 e 04-04 fizeram nos
  desvios de atribuição deles, e a resposta é a mesma: **relatar em vez de «consertar»**.
- **Correção de processo para quem vier depois:** commits de documentação nesta base precisam
  de `git -c user.name=… -c user.email=… commit`, feito à mão, ou de um handler que repasse a
  identidade. O `gsd-tools query commit` não repassa.

---

## O que NÃO foi feito, e é de propósito

- **Nenhum arquivo de `src/` foi tocado.** Nenhum gate falhou por defeito de tela, então não
  houve nada a relatar nessa frente.
- **`verificar-fase2.mjs`, `verificar-comentado.mjs`, `navegador.mjs` e `servir-out.mjs`
  seguem byte a byte como estavam.** `navegador.mjs` **não precisou de capacidade nova** — a
  API real (`servir({raiz})`, `abrirNavegador()` devolvendo o `cdp`, `navegar`, `cdp.consola`,
  `cdp.clicar` com expressão JS, `capturar()`) deu conta dos 99 gates.
- **Zero dependência nova.** `package.json` ganhou **uma linha**: o script `verificar-fase4`.
  O `tsx` da sonda já era devDependency do projeto e é invocado pelo binário local
  (`node_modules/.bin/tsx`), nunca por `npx`.
- **`gerar-grafo` não foi rodado.**
- **Nenhuma foto foi escrita no repositório.** A captura só acontece quando `DIR_CAPTURAS`
  está definida; sem ela o script não escreve imagem nenhuma. As três fotos desta execução
  foram para o diretório de rascunho.
- **A dívida da terceira cópia de `semComentarios()`** ficou registrada no cabeçalho do
  arquivo: é a terceira duplicação do mesmo ajudante, e resolvê-la exige um módulo
  `fonte.mjs` numa fase que possa tocar as três suítes de uma vez — o que a disciplina desta
  proíbe.

---

## O protocolo de disco — resultado

Volume a 96%, com histórico de despejo do iCloud. **Nenhum arquivo leu zero byte nesta
execução.** Conferência antes de editar:

```
OK 94079 bytes  scripts/gerar-grafo.mjs        OK 55243 bytes  scripts/verificar-fase2.mjs
OK 15795 bytes  scripts/navegador.mjs          OK 90014 bytes  scripts/verificar-fase3.mjs
OK  4820 bytes  scripts/servir-out.mjs         OK   893 bytes  package.json
OK 26329 bytes  scripts/verificar-comentado.mjs
```

`scripts/verificar-fase3.mjs` foi conferido **disco contra git** antes de ser editado —
90.014 = 90.014 — e uma cópia de segurança foi feita no diretório de rascunho antes da
primeira alteração. **Nenhuma restauração foi necessária.**

Depois de cada commit, cada arquivo foi conferido **no git**, não só no disco:

| arquivo | bytes no git |
|---|---|
| `scripts/verificar-fase3.mjs` | 91.414 |
| `scripts/verificar-fase4.mjs` | 104.115 |
| `package.json` | 952 |

`git diff --cached --numstat` foi lido antes de cada commit e `git diff-tree --name-status -r
HEAD` depois. **Nenhuma remoção inexplicada em nenhum commit** — os dois commits de código são
`M scripts/verificar-fase3.mjs` e `A scripts/verificar-fase4.mjs` + `M package.json`, e nada
mais. Os dois foram empurrados para `espelho` imediatamente.

**Uma proteção nova entrou no código por causa deste risco:** o leitor de fonte de
`verificar-fase4.mjs` **falha alto** quando um arquivo lê zero byte tendo tamanho em disco, e
imprime o comando de restauração. Sem isso, um arquivo despejado faria **todo** gate de fonte
passar em silêncio — 0 violações porque não há o que violar, que é a forma mais cara de um
relatório mentir.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | os dois reancoramentos da suíte da fase 3 | `c9131d7` | `scripts/verificar-fase3.mjs` |
| 1+2 | a verificação da fase 4 — driver, gates estruturais e gates de tela | `f83f779` | `scripts/verificar-fase4.mjs`, `package.json` |
| 3 | a não-regressão e as mitigações exercitadas | — | nenhum arquivo: a tarefa é execução e medição, e o resultado está neste documento |

---

## Known Stubs

Nenhum. Um lugar onde a suíte poderia fingir e não finge: as fotos são **opcionais por
`DIR_CAPTURAS`** e a ausência delas não afeta gate nenhum — elas existem para um humano
julgar, não para o relatório se autoaprovar.

## Threat Flags

Nenhuma superfície nova. As sete mitigações do registro do plano foram exercitadas:

| ameaça | como foi provada |
|---|---|
| T-04-26 (verificação que se autodispensa) | `CHROME_BIN` inválido: **EXIT=1** com mensagem nomeada, sem cair no Chrome do sistema |
| T-04-27 (fabricar não-regressão) | `verificar-fase3.mjs` recebeu **só** os dois reancoramentos; o diff removeu 4 linhas e **nenhuma é limiar**, com o antes e o depois neste documento |
| T-04-28 (gate que mente) | todo gate de tela mede o **DOM vivo**; os 6 atributos de interação são medidos **depois do clique**; usabilidade é medida por **geometria** |
| T-04-29 (Chrome pendurado) | lançamento forçado depois do spawn: **0 processos**; e **0 perfis** após as quatro suítes |
| T-04-30 (rede) | `performance.getEntriesByType('resource')`: **0 externa** em 44 navegações |
| T-04-31 (dependência nova) | `package.json` ganhou **uma linha de script**; zero dependência, zero instalação |
| T-04-32 (duas verdades da paralelização) | **8 de 8** constantes do roteiro batem com o que `duplicatas.ts` calcula |

---

## Next Phase Readiness

1. **Quatro suítes verdes sobre o mesmo `out/`: 303 gates.** É a linha de base da fase 5.
2. **`verificar-fase3.mjs` agora prova que a onda 2 não tocou `globals.css`.** Se a fase 5
   precisar escrever nele, o gate vai acusar — e a resposta certa será reancorá-lo no commit
   que autorizar a escrita, com o antes e o depois registrados, como este plano fez.
3. **A linha de base de páginas é 1.784 de resíduo, com 147 rotas explicadas.** Rota nova na
   fase 5 entra na lista de explicáveis, sem mover o limiar.
4. **O teto de chunks continua 1.600 KB; o artefato está em 1.065 KB.**
5. **O contrato `data-*` das três telas está congelado e medido** nos dois lugares — HTML
   exportado e DOM vivo —, com os 6 atributos de interação separados dos de documento.
6. **`npm run verificar-fase4` aceita `DIR_CAPTURAS`** para escrever as três fotos, e
   `PORTA` para não disputar a 43217 numa execução paralela.

## Fotos

- `f4-duplicatas.png` — a fila, as três ações, o registro da decisão e o par de Bienais
- `f4-ocorrencias.png` — a linha 28 em `19:30 · era 12:00`, com as outras 52 intactas
- `f4-roteiro.png` — o índice grudado com os cinco atalhos dentro da janela

## Self-Check: PASSED

**Arquivos declarados — existem e leem:**

```
FOUND 104115 bytes  scripts/verificar-fase4.mjs
FOUND  91414 bytes  scripts/verificar-fase3.mjs
FOUND    952 bytes  package.json
```

**Commits declarados — existem no git e no espelho:** `c9131d7`, `f83f779`.

**A saída literal embutida foi conferida contra o arquivo de execução, byte a byte:** 292
linhas, 30.108 bytes, **idêntica**. Nenhuma linha do relatório foi transcrita à mão.

**Três números tinham sido escritos de memória e estavam ERRADOS. Foram corrigidos contra a
medição, e ficam registrados aqui porque a régua da fase é medir e não lembrar:**

| eu havia escrito | a medição diz |
|---|---|
| altura da página do roteiro: 4.423px | **4.450px** |
| rolagem do teste do índice: 3.463px | **3.490px** |
| bloco `:root`: 1.279 bytes, 16 hex | **1.562 bytes, 12 hex** |

O quarto número conferido — «a ficha do evento tem 1.081 caracteres» — também estava errado:
a medição diz **759**, o mesmo que 04-03 mediu. Corrigido antes da publicação.
