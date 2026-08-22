---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 07
subsystem: verificacao
tags: [verificacao, cdp, chrome-headless, dom-vivo, gates, nao-regressao, d-48, cenario-2, cenario-4, cenario-5]

requires:
  - "03-01..03-06 — as sete telas da Camada 1 e o artefato exportado em out/"
  - "scripts/navegador.mjs e scripts/servir-out.mjs (fase 2) — lidos, nunca alterados"
provides:
  - "scripts/verificar-fase3.mjs — 93 gates sobre out/ em Chrome headless a 1440×960, com os Cenários 2, 4 e 5 andando POR CLIQUE"
  - "npm run verificar-fase3 — verificação permanente que falha alto"
  - "a atribuição medida do diagnóstico de preload: qual folha de CSS ficou sem uso, e de que plano ela é"
affects: [04-studio, ship]

actuals:
  tokens: 61000
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Visibilidade em SVG medida por RETÂNGULO: offsetParent não existe em SVGElement e reporta 0 de 88 pinos visíveis"
    - "«Cabe na primeira vista» medido contra o TOPO DA BARRA DE ABAS, nunca contra a moldura inteira nem innerHeight"
    - "Comparação de data sempre por ano de quatro dígitos convertido a NÚMERO, nunca por string entre formatos"
    - "Atribuição de chunk de CSS à folha de origem pelo primeiro seletor de classe — transforma «2 avisos» num número com dono"
    - "Controle de cache frio no COMEÇO da sessão: depois de 40+ navegações o Chrome deixa de avisar e o controle mente"

key-files:
  created:
    - scripts/verificar-fase3.mjs
  modified:
    - package.json

key-decisions:
  - "O gate de console NÃO foi relaxado. A fase 3 introduziu um aviso de console que a fase 2 não tinha, e a verificação sai com código 1 por causa dele — com 92 gates verdes e a causa atribuída ao arquivo"
  - "D-48 tem régua diferente por tela e a diferença É o conteúdo da decisão: /cidade/* não pode ter NENHUMA data posterior à referência (fabricar programação é o que D-48 proíbe); /acontece pode mostrar as 166 sessões futuras que o CMS declara, e a régua ali é o horizonte do próprio acervo"
  - "A varredura de D-48 percorre O CONJUNTO — 15 cidades e os 23 dias da faixa —, não uma amostra"
  - "O total de páginas conta todo .html fora de _next/, e não só index.html: é o critério que reproduz a linha de base de 1.784 da fase 2, porque inclui o out/404.html solto"

requirements-completed: [AGEN-01, AGEN-02, AGEN-03, AGEN-04, AGEN-05, AGEN-06, AGEN-07]

metrics:
  duration: "~3h"
  completed: 2026-08-22
  tasks: 3
  gates_verdes: 92
  gates_vermelhos: 1

status: complete
---

# Phase 3 Plan 07: A verificação da fase 3 — Summary

**`npm run verificar-fase3` mede 93 gates sobre o `out/` exportado num Chrome de verdade, com os Cenários 2, 4 e 5 andando por clique: 92 passam, e o 93º encontra uma regressão real — a fase 3 introduziu um aviso de console que a fase 2 não tinha, e ele deixou `npm run verificar-comentado` vermelho.**

## O resultado, sem rodeio

| verificação | resultado | números |
|---|---|---|
| `npm run verificar-fase3` | **código 1** | 92 gates verdes, 1 vermelho (console) |
| `npm run verificar-fase2` | **código 0** | 67 gates verdes, 26 navegações |
| `npm run verificar-comentado` | **código 1** | falha no console: `0 erro, 2 aviso em 7 navegações` — determinístico, 3 de 3 execuções |

**A fase 3 não fecha verde, e o motivo é um só, medido e atribuído.** Tudo o que os sete
requisitos afirmam está provado em pixel; o que não está limpo é o console, e a causa está
localizada em três arquivos com nome e plano.

---

## A REGRESSÃO — o achado mais importante deste plano

### O que acontece

Toda tela do protótipo emite, depois de ~3 segundos parada, o aviso do Chrome:

> `The resource … .css was preloaded using link preload but not used within a few seconds from the window's load event.`

### De quem é, medido e não suposto

Os chunks avisados foram atribuídos à folha de origem pelo primeiro seletor de classe do
chunk exportado:

| chunk | primeiro seletor | folha de origem | plano |
|---|---|---|---|
| `1oqzhxrvom0hu.css` | `.faixa-dias` | `src/estilos/agenda.css` | **03-01** |
| `3qdhyug8rb46p.css` | `.busca-campo` | `src/estilos/busca.css` | **03-04** |
| `44hhr15924epc.css` | `.alerta-alteracao` | `src/estilos/salvos.css` | **03-02** |

**Os três são da fase 3.** O mecanismo: a barra de abas aponta para `/acontece` e `/buscar`
em **toda** tela, e o router do Next faz *prefetch* do CSS das rotas ligadas que estão na
viewport. Antes da fase 3 nenhuma rota tinha folha própria — o `prefetch` não trazia CSS
nenhum e o número era 0. Depois da fase 3 ele traz duas folhas em toda tela, e elas não são
usadas na tela onde foram pré-carregadas.

### A prova de que a causa é a fase 3, e não a rota

Eu errei este gate duas vezes antes de acertar, e as duas versões erradas relatavam verde.
A segunda mediu «o aviso também sai numa rota da fase 2 → logo é pré-existente» — e essa
conclusão está **invertida**. A pergunta certa não é *em que rota o aviso aparece*, é *qual
CSS ficou sem uso*. O controle final mede as duas coisas:

```
/descobrir/ (fase 2 — tela que esta fase NÃO tocou), parada 6s: 2 diagnóstico(s)
            — src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo)
/play/      (fase 1 — esqueleto),                   parada 6s: 2 diagnóstico(s)
            — src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo)
/acontece/  (fase 3 — tela nova),                   parada 6s: 1 diagnóstico(s)
            — src/estilos/busca.css (.busca-campo)
```

`/play/` é tela-esqueleto da **fase 1**, que esta fase nunca tocou, e ela emite dois avisos —
os dois sobre folhas da fase 3. A rota que emite é da fase 1; a causa é da fase 3.

### Por que `verificar-fase2` continua verde e `verificar-comentado` não

Não é o defeito que difere, é o **ritmo**. O aviso só sai depois de ~3s parado numa página.
A sessão da fase 2 tem 26 navegações rápidas e nunca fica parada tempo bastante; a do modo
comentado fica. **O `0 erro, 0 aviso` da fase 2 e o da fase 3 nunca foram comparáveis** —
o da fase 2 mede uma sessão que não dá tempo ao aviso de aparecer.

### O que NÃO foi feito, e por quê

O limiar **não** foi relaxado. `<disciplina_de_arquivo>` deste plano declara `src/` somente
leitura, e a correção mora em arquivos de 03-01, 03-02 e 03-04. Caminhos possíveis, para
quem ler: consolidar as folhas de rota numa só, ou `prefetch={false}` nos `<Link>` da barra
de abas. Registrado em `deferred-items.md` com o número anterior (0), o novo (2 por tela) e
os arquivos culpados — que é exatamente o que o plano manda fazer em vez de acomodar.

---

## O gate de disjunção de arquivos entre os planos da onda 1

**Interseção vazia nos 6 pares. Os quatro planos não se tocaram.**

```
03-01: 7 arquivos em 5 commits
03-02: 5 arquivos em 4 commits
03-03: 6 arquivos em 4 commits
03-04: 4 arquivos em 4 commits
ok   disjunção de arquivos entre os 4 planos da onda 1 (6 pares, por git):
     0 arquivos em comum nos 6 pares — a paralelização não teve colisão
```

E `src/app/globals.css` tem **0 linhas de diferença** desde `cc34f4e`, o commit que fechou a
fase 2. **É a prova mecânica de que o método de paralelização funciona, e é o que autoriza a
fase 4 a repeti-lo.**

---

## As sete mitigações, exercitadas

Uma mitigação declarada e não exercitada é uma mitigação que não existe.

| ameaça | teste | resultado |
|---|---|---|
| **T-03-13** endereço de volta | `/mapa/#v=` com `https://exemplo.invalido/x`, `//exemplo.invalido`, `/\exemplo` e `javascript:alert(1)` | **passou** — 4 formas, 0 link externo na tela, recusa declarada em texto nas 4, voltas caem no padrão |
| **T-03-02 / T-03-22** entrada da URL | `#dia=1999-99-99`; `#f=classe:naoexiste`; `#dias=99` | **passou** — o dia cai em `2026-08-22` com 9 eventos; a faceta desconhecida é ignorada e a busca segue com 68; `dias=99` cai em 4 |
| **T-03-09** storage adulterado | `agenda-cultural:salvos` com id inexistente, e com valor que não é lista | **passou** — 2 ids (1 inexistente) → 1 linha; `"isto-nao-e-lista"` → 0 linhas, `data-salvos=0`, sem exceção |
| **T-03-17 / T-03-34** rede | sessão inteira medida por `performance.getEntriesByType('resource')` | **passou** — **0 requisição externa**, 454 recursos distintos, todos em `127.0.0.1`, em 48 navegações |
| **T-02-21** processo pendurado | `SIGINT` 25s depois do spawn | **passou** — 0 Chrome vivo com perfil de verificação; o perfil temporário que fica é o custo documentado em `navegador.mjs` para saída abrupta, e foi removido |
| **T-02-22** Chrome ausente | `CHROME_BIN=/nao/existe/chrome npm run verificar-fase3` | **passou** — **código 1**, mensagem nomeada, e **não** cai no Chrome do sistema; os 15 gates estruturais rodam antes e a falha é no navegador |
| **falha de gate** | limiar `27 UFs` sabotado para `28` numa cópia descartável | **passou** — código 1, 56 medições verdes impressas antes, e a linha `FALHA D-62 … medido 27 UFs · faixas [...] · maior 274 · total 773` |

O `CHROME_BIN` inválido foi **exercitado, não presumido** — é a lição literal que a 02-05
comprou com um gate que passava verde apontando para o binário errado.

---

## O que quem conduzir a demonstração precisa saber

As quatro coisas que a banca vê primeiro, e que ninguém deveria descobrir ao vivo.

### 1. A frase de enquadramento do Modo Cidade, texto integral

Lida do DOM renderizado em `/cidade/belem-para/`, 197px de altura, 362 caracteres, sem uma
palavra de licença:

> **Este roteiro responde o que existe culturalmente em Belém: o acervo do Itaú Cultural
> documenta aqui 39 registros do que a cultura brasileira produziu neste lugar — 17
> exposições e salões, 11 artistas, 8 espaços e 3 instituições —, e 31 deles trazem a data
> que a fonte escreveu.**
>
> Programação futura entra nesta mesma tela quando os produtores publicarem no Studio.

O gate procura «infelizmente», «limitação do protótipo» e «apenas um protótipo» no texto
renderizado e não encontra nenhuma. O fecho aponta para o Studio da fase 4 — é o que faz
dela transição de apresentação, e não rodapé de desculpa.

### 2. O par de sessões do Cenário 4

| | id | o que acontece |
|---|---|---|
| **evento** | `evento:cms:13845` — *Helena Ignez é a homenageada da 74ª «Ocupação Itaú Cultural»* | 53 sessões ao todo |
| **atingida** | `ocorrencia:derivado:13845-t1-o0028` | 22.08.2026, **12:00 → 19:30**, alerta com selo `autorado` |
| **intacta** | `ocorrencia:derivado:13845-t1-o0029` | 23.08.2026, 10:00 — segue como estava |

O alerta mede 356px e traz os dois horários. **A sequência que prova a afirmação inteira:**
remover a **intacta** deixa 1 linha e o alerta **continua**; remover a **atingida** deixa 0
linhas e o alerta **some**. O primeiro passo sozinho não bastaria — um alerta que nunca some
pareceria dirigido e seria adorno. O segundo é o controle.

### 3. A distribuição de «bienal» por classe

**68 resultados em 5 classes**, com a etiqueta de tipo visível em 68 de 68:

> **evento 51 · conteudo 14 · midia 1 · espaco 1 · termo 1**

É a mistura que D-63 pede: se a tela devolvesse só os 51 eventos, ela seria uma agenda.
Marcar a faceta `classe:evento` leva de **68 → 51** sem sair de `/buscar/`.

### 4. A série de contagens da remoção de critérios

Tirando uma ficha por vez em `/buscar/frase`, com `location.pathname + search` conferido
**inalterado a cada passo**:

> **8 → 40 → 283 → 0**

| toque | ficha tirada | depois |
|---|---|---|
| — | estado inicial, 3 fichas | **8** |
| 1 | `texto:Bienal` (semelhança) | **40** |
| 2 | `classe:evento` (gratuidade) | **283** |
| 3 | `territorio:sao-paulo-uf` (proximidade) | **0** |

O último passo é deliberado e a tela diz por quê: sem critério nenhum de pé ela não lista os
5.092 do acervo, porque seria devolver resultados sem motivo para nenhum deles (D-28).

---

## A saída literal de `npm run verificar-fase3`

```
verificar-fase3 — AGEN-01 a AGEN-07 e os Cenários 2, 4 e 5 sobre o artefato exportado, em Chrome headless

── (b) gates estruturais, sem navegador ──
  ok   arquivos com a diretiva de cliente (primeira instrução, sem comentários): 22 em código · 30 menções na fonte bruta (a fase 2 mediu 14 em código)
  ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira): 0 violações em 22 clientes
  ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 59 telas
  ok   peso de out/_next/static/chunks: 985 KB (a fase 2 mediu 766 KB antes do índice de busca; teto do 03-04: 1.600 KB)
  ok   D-08 · token de cor de apoio em .ts/.tsx (sem comentários): 0 em código · 3 em prosa (comentários, ignorados de propósito)
  ok   posicionamento preso à janela fora de casca.tsx (sem comentários): 0 em código · 4 em prosa (comentários, ignorados de propósito)
  ok   inserção de HTML bruto em src/: 0 ocorrências em 81 arquivos
  ok   src/app/globals.css intocado desde o fim da fase 2 (cc34f4e): 0 linhas de diferença
       03-01: 7 arquivos em 5 commits
       03-02: 5 arquivos em 4 commits
       03-03: 6 arquivos em 4 commits
       03-04: 4 arquivos em 4 commits
  ok   disjunção de arquivos entre os 4 planos da onda 1 (6 pares, por git): 0 arquivos em comum nos 6 pares — a paralelização não teve colisão
  ok   as 18 rotas da fase 1 intactas: 18 de 18
  ok   rota /salvos (AGEN-03): presente
  ok   rotas /evento/*/sessoes (AGEN-02): 129
  ok   rotas /cidade/* (AGEN-05): 15
  ok   rota /buscar/frase (AGEN-07): presente
  ok   total de páginas em out/, com a diferença explicada pelas rotas novas: 1930 páginas · 146 novas da fase 3 (129 sessões + 15 cidades + /salvos + /buscar/frase) · resíduo 1784

  servidor estático em http://127.0.0.1:43217 (raiz: out/)
  Chrome headless aberto · viewport 1440×960

── de quem é o diagnóstico de preload do Next (cache frio, com atribuição do chunk) ──
       /descobrir/ (fase 2 — tela que esta fase NÃO tocou), parada 6s: 2 diagnóstico(s) — src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo)
       /play/ (fase 1 — esqueleto), parada 6s: 2 diagnóstico(s) — src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo)
       /acontece/ (fase 3 — tela nova), parada 6s: 1 diagnóstico(s) — src/estilos/busca.css (.busca-campo)
  ok   atribuição dos chunks pré-carregados e não usados: 5 diagnóstico(s) no controle · 5 deles em folhas criadas pela FASE 3 (a barra de abas aponta para /acontece e /buscar em toda tela, e o router faz prefetch do CSS dessas rotas)

── (c) a casca, com as telas novas dentro ──
  ok   viewport travado por Emulation.setDeviceMetricsOverride (não por tamanho de janela): 1440×960
  ok   moldura contém a barra de abas (antes de rolar): barra 370px base 866 · moldura 390px base 876
  ok   moldura contém a barra de abas (rolada até o fim de Acontece): rolagem 3543px · barra base 866 · moldura base 876
  ok   data-view inicial: mobile
  ok   data-view após o alternador: web
  ok   data-view sobrevive a recarregar (ida): web
  ok   data-view volta para mobile: mobile
  ok   data-view sobrevive a recarregar (volta): mobile

── 1 · Acontece: a lista é de EVENTOS, e o passado é mostrado como passado (AGEN-01) ──
  ok   cartões de EVENTO visíveis no dia de referência: 9 cartões
  ok   D-53 · nenhum evento repetido na mesma lista (a lista é de eventos, não de sessões): 9 cartões · 9 slugs distintos
  ok   D-53 · contagem de sessões VISÍVEL em cada cartão: 9 de 9 · ex.: «53 sessões · a próxima sábado, 22 de agosto de 2026, 11h00»
  ok   D-55 · a faixa marca cada dia por tempo: 23 dias na faixa · marcações ["passado","hoje","futuro"] · 0 sem marcação
  ok   D-55 · nenhum dia sem sessão na faixa (percorrido o conjunto, não uma amostra): 23 dias percorridos · mínimo 3 evento(s) · máximo 10
  ok   há dia passado na faixa (todo o acervo é passado — D-54): 2026-08-14
  ok   D-54 · dia passado: os eventos continuam listados E rotulados como passados: dia 2026-08-14 · 9 eventos · «já aconteceu» presente na tela · hash #dia=2026-08-14
  ok   as quatro frases de ausência visíveis, com altura maior que zero: espaco 146px · preco 128px · lotacao 128px · acessibilidade 146px

── 2 · Seleção de ocorrência: salvar é de OCORRÊNCIA, nunca de evento (AGEN-02, D-56) ──
  ok   AGEN-02 · do cartão de evento à escolha de sessão POR CLIQUE: /acontece/ → /evento/exposicao-apresenta-obras-de-solange-pessoa/sessoes/ (toquei em «escolher e salvar uma sessão»)
  ok   sessões da ocorrência visíveis: 24 sessões
  ok   sessões agrupadas por dia (toda sessão dentro de um grupo com cabeçalho nomeado): 24 grupos · 0 sessões fora de grupo · 0 grupos sem cabeçalho · ex.: «sábado, 15 de agosto de 2026»
  ok   D-56 · um controle de salvar POR SESSÃO (nenhum salvar-o-evento): 24 controles para 24 sessões
  ok   D-56 · salvar marca EXATAMENTE aquela ocorrência, e nenhuma irmã: 1 marcada de 24 · ocorrencia:derivado:13909-t1-o0011
  ok   D-56 · a confirmação nomeia a sessão pela DATA e HORA: «Salvo: a sessão de sábado, 15 de agosto de 2026, 10h00. O que ficou salvo é esta sessão, não o evento. Se o ho…»
  ok   ausências de espaço, preço e lotação declaradas COM NÚMERO: espaco, preco, lotacao, acessibilidade · 4 com número: true

── 3 · Salvos e o Cenário 4: o alerta chega à sessão salva, não à irmã (AGEN-03, D-57) ──
  ok   AGEN-03 · da confirmação a /salvos POR CLIQUE: /evento/exposicao-apresenta-obras-de-solange-pessoa/sessoes/ → /salvos/ (toquei em «ver as sessões salvas»)
  ok   estado vazio útil, com a semeadura do Cenário 4 oferecida: 0 linhas · semeadura presente: true
  ok   D-57 · a semeadura salva 2 sessões do MESMO evento e EXATAMENTE 1 fica alertada: 2 salvos · 1 alertado (ocorrencia:derivado:13845-t1-o0028) · irmã intacta: ocorrencia:derivado:13845-t1-o0029
  ok   D-57 · o alerta visível, com os DOIS horários: 356px · horários 12:00 → 19:30 · ocorrência ocorrencia:derivado:13845-t1-o0028
  ok   D-57 · o informante e o rótulo autorado, visíveis: data-procedencia-alerta="autorado" · informante declarado: true
  ok   D-57 · a frase que fecha o Cenário 4, na tela: «Só quem salvou esta sessão foi avisado…» presente
  ok   D-58 · a fila sobrevive a recarregar (localStorage): 2 linhas · 1 alertada · alerta visível: true
  ok   D-57 · removida a sessão INTACTA, o alerta CONTINUA — ele pertence à outra sessão: 1 linha · alerta visível: true
  ok   D-57 · removida a sessão ATINGIDA, o alerta SOME — o controle que prova que ele era dirigido: 0 linhas · alerta visível: false · estado vazio de volta: true

── 4 · Mapa: lente que preserva o conjunto, e a camada de desertos (AGEN-04, D-59..D-62) ──
  ok   linha de base: /mapa sem recorte (defeito 3 exposto de propósito): 88 pinos por RETÂNGULO somando 790 registros · 0 pelo offsetParent de visiveis(), que não funciona em SVG
  ok   a medida de visibilidade em SVG é o retângulo, não offsetParent: retângulo 88 · offsetParent 0
  ok   a gramática da lente é /mapa/#r=…&t=…&v= (COM a barra — trailingSlash normaliza): /mapa/#r=evento_exposicao-apresenta-obras-de-solange-pes… (781 caracteres)
  ok   D-59 · de Acontece ao mapa POR CLIQUE, e o mapa se declara LENTE sobre o conjunto: /acontece/ → /mapa/ · «Mapa Lente sobre sábado, 22 de agosto de 2026 · 9 eventos — 9 itens do conjunto que você já estava vendo.»
  ok   T-03-16 · com 0 pinos desenhados, o mapa DECLARA quantos ficaram sem posição e os nomeia: 0 pinos desenhados · «Fora do desenho: 9 sem coordenada» · lista «Sem posição:» presente
  ok   D-61 · a legenda de procedência das coordenadas, visível: visível: true
  ok   D-59 · a volta leva ao DIA QUE ESTAVA SELECIONADO — o recorte preservado é o requisito: saí no dia 2026-08-22 · voltei no dia 2026-08-22 (toquei em «Voltar para sábado, 22 de agosto de 2026…»)
  ok   D-59 · a SEGUNDA porta: de Buscar ao mapa, e o recorte RECORTOU: 7 pinos / 21 registros no recorte, contra 88 / 790 sem recorte · «Mapa Lente sobre «bienal» — 60 itens do conjunto que você já estava vendo.»
  ok   D-62 · 27 unidades federativas DESENHADAS (medidas por retângulo, não por offsetParent): 27 UFs · faixas ["registrado","minimo","vazio"] · maior 274 registros · total 773
  ok   D-62 · 2 unidades federativas com registro ZERO: 2: SE, TO
  ok   D-62 · a frase de leitura da camada, VISÍVEL e com número medido: visível: true · «Desertos culturais O que este mapa mede é registro no acervo carregado do Itaú Cultural — cada vínculo entre uma entidade e um lugar —, não oferta cultural do estado. Sergipe tem cultura; o acervo é que não a documenta. …»
  ok   a camada CABE na moldura, medida contra o topo da barra de abas (não contra a moldura inteira): desenho termina em 444px · barra começa em 807px (moldura vai até 876px; a barra ocupa 60px)

── 5 · Modo Cidade: o enquadramento como conteúdo, sem data fabricada (AGEN-05, D-48..D-52) ──
  ok   D-52 · a frase de enquadramento VISÍVEL (não apenas presente no HTML): 197px de altura · 362 caracteres

  a frase de enquadramento, texto integral (D-49, D-52):
       Este roteiro responde o que existe culturalmente em Belém: o acervo do Itaú Cultural documenta aqui 39 registros do que a cultura brasileira produziu neste lugar — 17 exposições e salões, 11 artistas, 8 espaços e 3 instituições —, e 31 deles trazem a data que a fonte escreveu.
       Programação futura entra nesta mesma tela quando os produtores publicarem no Studio.
  ok   D-52 · o enquadramento não pede desculpa (sem «infelizmente», «limitação do protótipo»): 0 palavras de licença no texto renderizado
  ok   D-50 · 4 dias com 2 a 3 itens cada: 4 dias · itens 3/3/3/3
  ok   D-50 · deslocamento em TEXTO em cada dia: 0,3 km em linha reta · 0,5 km em linha reta · 0,8 km em linha reta · 0,5 km em linha reta
  ok   D-48 · nenhuma data futura no texto renderizado de Belém (anos comparados como NÚMERO): 7 anos no texto · maior 2025 · 0 acima de 2026 · 0 datas cheias depois de 2026-08-22
  ok   D-50 · trocar para 3 dias remonta SEM NAVEGAR: 3 dias · rota /cidade/belem-para/ (era /cidade/belem-para/) · hash #dias=3
  ok   D-50 · alternar um item muda EXATAMENTE um dia: 1 dia mudou de 4 · troquei «espaco_fundacao-romulo-maiorana-frm-belem»

── 6 · Buscar: tipos misturados com o tipo etiquetado, e zero-resultado que não é beco (AGEN-06) ──
  ok   «bienal» devolve resultados visíveis: 68 visíveis de 68 no total
  ok   D-63 · o índice MISTURA tipos — duas ou mais classes distintas no mesmo resultado: 5 classes: conteudo 14 · evento 51 · midia 1 · espaco 1 · termo 1
  ok   D-63 · etiqueta de tipo VISÍVEL (medida por retângulo, não só presente no atributo): 68 de 68 · ex.: «editorial»
  ok   AGEN-06 · marcar faceta recorta SEM NAVEGAR: 68 → 51 resultados · 1 classe · rota /buscar/ · hash #q=bienal&f=classe:evento
  ok   D-66 · zero-resultado oferece qual critério afrouxar E quantos resultados aquilo traria: 0 resultados · 1 afrouxamento(s): texto→300
  ok   D-66 · tocar no afrouxamento entrega EXATAMENTE o número prometido: prometeu 300 · entregou 300 (a lista mostra 100 pelo teto de exibição)

── 7 · Busca por frase: a tradução É a resposta, editável em um toque (AGEN-07, D-64, D-65) ──
  ok   AGEN-07 · de /buscar a /buscar/frase POR CLIQUE: /buscar/ → /buscar/frase/ (toquei em «buscar por frase»)
  ok   D-64 · a frase do Cenário 5 já traduzida em fichas VISÍVEIS ao abrir: «algo parecido com a Bienal, gratuito e perto de mim» → 3 fichas: texto:Bienal, classe:evento, territorio:sao-paulo-uf
  ok   D-64 · cada resultado traz o trecho/motivo que o produziu: 8 de 8 resultados com motivo · origens {"criterio":2,"aresta":6}
  ok   D-65 · a declaração de ausência de IA, VISÍVEL (não apenas no HTML): 144px · «Esta busca não chama IA. A frase é lida por 9 regras declaradas, e você pode ver todas. O …»
  ok   D-65 · a lista de regras declaradas, aberta e contada — a alternativa ao modelo é uma LISTA: 9 regras, todas com exemplo: semelhanca, classe, linguagem, tema, territorio, gratuidade, periodo, procedencia, proximidade
  ok   a ficha de gratuidade declara que NÃO recorta, com número: «GRATUIDADE gratuito — lido como «o que tem sessão»: evento sem ela: 9 veio de «gratuito» na sua frase — não recorta neste acervo ·…»
  ok   D-64 · a URL não muda ao tirar a ficha «texto:Bienal»: /buscar/frase/ (inicial /buscar/frase/)
  ok   D-64 · a URL não muda ao tirar a ficha «classe:evento»: /buscar/frase/ (inicial /buscar/frase/)
  ok   D-64 · a URL não muda ao tirar a ficha «territorio:sao-paulo-uf»: /buscar/frase/ (inicial /buscar/frase/)
  ok   D-64 · remover as fichas uma a uma, com a série de contagens e recálculo ao vivo: série 8 → 40 → 283 → 0 · tirando texto:Bienal, classe:evento, territorio:sao-paulo-uf

── D-48 · nenhuma data fabricada, varrido no TEXTO RENDERIZADO (o gate mais importante) ──
  ok   D-48 · zero data futura no texto renderizado das 15 páginas de /cidade/*: 15 páginas varridas · 55 anos lidos · maior ano impresso 2025 · 0 posteriores a 2026-08-22
  ok   D-48 · em /acontece, nenhum ano além do horizonte do acervo (2026): 23 dias percorridos · maior ano impresso 2026 · 0 acima de 2026
       varridas 15 páginas de /cidade/* e 23 dias de /acontece; a comparação é por ano convertido a número, nunca por string

── ameaças exercitadas (não declaradas) ──
  ok   T-03-13 · endereço de volta externo ou torto: recusado, declarado, e nenhum link externo na tela: 4 formas testadas (https://exemplo.invalido/x, //exemplo.invalido, /\exemplo, javascript:alert(1)) · 0 link externo · recusa declarada em todas
  ok   T-03-02 · #dia= com data que não existe cai no padrão e a tela não quebra: #dia=1999-99-99 → selecionado 2026-08-22 · 9 eventos
  ok   T-03-22 · faceta desconhecida no hash é ignorada e a busca segue: #f=classe:naoexiste → 68 resultados (a faceta inválida não recortou nem quebrou)
  ok   T-03-31 · ?dias= fora da faixa cai no padrão: #dias=99 → 4 dias
  ok   T-03-09 · id inexistente no storage é DESCARTADO e a fila segue com o que resolve: 2 ids gravados (1 inexistente) → 1 linha renderizada
  ok   T-03-09 · valor que não é lista no storage: a fila descarta e a tela não quebra: storage = "isto-nao-e-lista" → 0 linhas, data-salvos=0

── console, acumulado na sessão inteira ──
       preload não usado ×2: 1oqzhxrvom0hu.css → src/estilos/agenda.css (.faixa-dias)
       preload não usado ×10: 3qdhyug8rb46p.css → src/estilos/busca.css (.busca-campo)
  ok   console · erros e avisos DA APLICAÇÃO: 0 erro, 0 aviso da aplicação em 48 navegações
  FALHA console · CSS pré-carregado e não usado (a fase 2 fechou este número em 0): medido 12 diagnóstico(s) em 48 navegações · chunks: src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo) — pré-carregados em toda tela pelo prefetch da barra de abas para /acontece e /buscar · esperado 0 — o número que a fase 2 entregou

VERIFICAÇÃO FALHOU: console · CSS pré-carregado e não usado (a fase 2 fechou este número em 0) — medido 12 diagnóstico(s) em 48 navegações · chunks: src/estilos/agenda.css (.faixa-dias) · src/estilos/busca.css (.busca-campo) — pré-carregados em toda tela pelo prefetch da barra de abas para /acontece e /buscar, esperado 0 — o número que a fase 2 entregou
```

**92 gates verdes, 1 vermelho, 48 navegações, 0 requisição externa.** O resumo por requisito
só é impresso quando a verificação fecha; com a falha do console ela sai antes. As linhas de
resumo, colhidas da execução imediatamente anterior (idêntica em tudo menos o gate de
console), estão abaixo.

## O resumo por requisito

```
AGEN-01  Acontece: 9 EVENTOS com contagem de sessões visível em 9/9, 23 dias na faixa
         (0 vazios em 23 percorridos), passado listado e rotulado, 4 ausências medidas
AGEN-02  Seleção de ocorrência: 24 sessões agrupadas por dia, 24 controles (um por sessão);
         salvar marcou 1 de 24 e a confirmação nomeou data e hora
AGEN-03  Cenário 4: 2 sessões do mesmo evento salvas, 1 alertada
         (ocorrencia:derivado:13845-t1-o0028), alerta 356px com 12:00→19:30; sobreviveu a
         recarregar; removida a irmã o alerta ficou, removida a atingida o alerta sumiu
AGEN-04  Mapa: lente das duas portas (Acontece e Buscar); de Buscar 7 pinos contra 88 sem
         recorte; a volta devolveu o dia 2026-08-22; desertos com 27 UFs, SE+TO em zero,
         total 773 registros, cabendo em 444/807px
AGEN-05  Modo Cidade: enquadramento visível (197px, sem desculpa), 4 dias com 3/3/3/3 itens
         e deslocamento em texto, 0 data futura (maior ano 2025), 3 dias sem navegar,
         alternar mudou 1 dia de 4
AGEN-06  Buscar: «bienal» → 68 resultados em 5 classes (conteudo 14 · evento 51 · midia 1 ·
         espaco 1 · termo 1), etiqueta visível em 68/68; faceta evento 68→51 sem navegar;
         zero-resultado com afrouxamento que prometeu 300 e entregou 300
AGEN-07  Busca por frase: «algo parecido com a Bienal, gratuito e perto de mim» → 3 fichas
         editáveis, 8 resultados todos com motivo ({"criterio":2,"aresta":6}), declaração de
         ausência de IA visível com 9 regras listadas; série da remoção 8 → 40 → 283 → 0 com
         a URL inalterada
D-48     15 páginas de /cidade/* (maior ano 2025) e 23 dias de /acontece (maior ano 2026)
         varridos no texto renderizado: 0 data fabricada
rede     0 requisição externa em 48 navegações · 454 recursos distintos, todos no servidor
         local — nenhum tile, nenhuma fonte remota, nenhuma chamada de modelo
```

---

## Os seis defeitos de gate herdados, e o que cada um custaria

Os seis vieram documentados dos planos irmãos. Cinco foram herdados corrigidos; o terceiro
foi **reconfirmado por medição** dentro da própria verificação, porque um gate que corrige um
defeito sem mostrá-lo volta a ser reintroduzido na próxima mudança.

| # | defeito | forma correta aqui | o que custaria |
|---|---|---|---|
| 1 | `/mapa#` sem barra | `/\/mapa\/?#/` | falharia contra código correto — `trailingSlash: true` normaliza |
| 2 | API presumida de `navegador.mjs` | `servir({raiz})→{url,fechar}`, `abrirNavegador()→cdp`, `navegar`, `cdp.consola`, `cdp.clicar(expressão JS)` | o script não roda |
| 3 | `visiveis()` em SVG | `visivelSvg` por retângulo | **medido nesta execução: 0 de 88 pinos** «invisíveis» — os gates do mapa acusariam tela vazia |
| 4 | «cabe» contra a moldura | contra o **topo da barra de abas** (807px, não 876px) | relataria «cabe» para conteúdo que a barra cobre |
| 5 | data comparada por string | ano de 4 dígitos como **número** | 113 datas históricas acusadas de futuras |
| 6 | grep sem tirar comentário / `data-x` sem `="` / `import type` multilinha | fonte sem comentários, instrução inteira, DOM vivo | 3 falsos positivos de cor, 4 de posicionamento, e o payload RSC contado |

O defeito 3 virou gate próprio e permanente:

```
ok   a medida de visibilidade em SVG é o retângulo, não offsetParent: retângulo 88 · offsetParent 0
```

---

## Deviations from Plan

### 1. [Regra 1 — gate medindo a coisa errada] O controle do aviso de preload concluía o oposto do que os dados dizem

- **Found during:** Task 3
- **Issue:** duas versões antes da boa. A primeira rodava no **fim** da sessão e devolvia 0
  para a rota da fase 2 — não porque o aviso não saia lá, mas porque depois de 46 navegações
  os chunks estão em cache e o Chrome para de avisar; um 0 que parecia prova e apontava para
  o lado errado. A segunda rodava com cache frio, media 2 numa rota da fase 2, e eu concluí
  «pré-existente, não é regressão da fase 3». **Errado.** A pergunta não é *em que rota o
  aviso aparece*, é *qual CSS ficou sem uso* — e os chunks são todos de folhas da fase 3.
- **Fix:** o gate passou a **atribuir cada chunk à folha de origem** pelo primeiro seletor de
  classe do arquivo exportado, e o controle percorre uma rota de cada fase. `/play/`, da fase
  1, emite dois avisos sobre folhas da fase 3 — que é a prova limpa.
- **Efeito:** a verificação passou de verde para vermelha, corretamente.

### 2. [Regra 1 — bug] Crase dentro de template literal apagou metade de um gate

- **Found during:** Task 2
- **Issue:** um comentário dentro do código-de-página escrevia `` `.grupo-de-dia` `` com
  crases; a crase fecha o template literal do Node e o resto virou expressão. `ReferenceError:
  de is not defined`.
- **Fix:** crases trocadas por «» dentro dos blocos que rodam na página.

### 3. [Regra 2 — o gate exigia menos do que devia] O agrupamento por dia era contado por `<h3>` solto

- **Found during:** Task 2
- **Issue:** a primeira forma contava `h3` e comparava com o número de sessões. Neste acervo
  há exatamente uma sessão por par evento-dia, então 24 sessões dão 24 cabeçalhos **por
  coincidência do dado** — o gate passaria com uma lista sem agrupamento nenhum.
- **Fix:** mede a estrutura: `.grupo-de-dia` contados, sessões **fora** de grupo (0 de 24) e
  grupos sem cabeçalho (0). Passa a provar agrupamento em vez de coincidência aritmética.

### 4. [Regra 3 — premissa do plano contradita pelo dado] A régua de D-48 difere entre `/cidade/*` e `/acontece`

- **Found during:** Task 1
- **Issue:** o plano manda varrer as duas telas «procurando data posterior à data de
  referência do build» e exigir zero. Em `/acontece` isso **falharia contra código correto**:
  o acervo declara 166 sessões posteriores a 2026-08-22, e elas são dado real do CMS, não
  fabricação. Aplicar a régua do Modo Cidade à agenda proibiria a agenda de mostrar a agenda.
- **Fix:** régua por tela, e a diferença é o conteúdo de D-48. `/cidade/*`: zero data
  posterior à referência (fabricar programação é o que D-48 proíbe) — medido, maior ano 2025.
  `/acontece`: nada além do horizonte que o próprio acervo declara — medido, maior ano 2026.
- **Verificação:** 15 páginas e 23 dias varridos, no texto renderizado, comparando ano como
  número.

### 5. [Regra 3 — número do plano não reproduzível] A linha de base de 1.784 páginas

- **Found during:** Task 1
- **Issue:** o plano cita «as 1.784 da fase 2», número que **não existe em nenhum artefato da
  fase 2** — grep em `.planning/` inteiro só o encontra no próprio 03-07-PLAN.md. Contando
  `index.html`, o resíduo dá 1.783.
- **Fix:** medido o critério que reproduz o número: contar **todo `.html` fora de `_next/`**,
  o que inclui o `out/404.html` solto. Assim: 1.930 páginas − 146 novas = **1.784**, exato. O
  gate conta assim e documenta por quê.

### 6. [dívida registrada] Ajudantes de leitura de fonte duplicados

`semComentarios`, `importsDe`, `resolverModulo` e `arquivosDe` foram **copiados** de
`verificar-fase2.mjs`, que não os exporta e que este plano declara somente leitura. Duas
cópias divergem na primeira correção. Registrado em `deferred-items.md`.

---

## O que eu suspeitei e estava errado

**O mapa com 0 pinos parecia um defeito, e não é.** A lente de Acontece recorta 9 eventos do
CMS, que neste acervo não têm território: o mapa desenha zero pinos. O `<header>` diz «9
itens», e a primeira leitura foi «a tela afirma 9 e mostra um Brasil vazio em silêncio».
Lendo o texto **inteiro** da moldura, ela declara:

> `0 registros posicionados em 0 pontos` · `Fora do desenho: 9 sem coordenada que o acervo
> sustente e 0 com coordenada fora do Brasil. Nenhuma delas foi empurrada para a borda — um
> ponto sem dado não vira posição.` · `Sem posição: [os 9 slugs, nomeados]`

Virou gate — **T-03-16**: com 0 pinos, a tela tem de declarar o número e nomear os ausentes.
Registro o erro porque ele mostra o custo de medir só o cabeçalho.

---

## Known Stubs

Nenhum. `scripts/verificar-fase3.mjs` não tem gate declarado e não implementado, nem gate que
imprima «ok» sem número medido.

## Threat Flags

Nenhuma superfície nova além do registro do plano. As seis linhas foram tratadas: T-03-41
(Chrome ausente falha, **exercitado** com caminho inválido), T-03-42 (todo gate de tela no DOM
vivo, com a correção de visibilidade em SVG), T-03-43 (encerramento por todos os caminhos,
**exercitado** com `SIGINT`), T-03-44 (travessia de diretório aceita — prova existente da
02-05, reusada sem alterar o servidor), T-03-45 (0 requisição externa em 48 navegações),
T-03-46 (nenhuma dependência nova; `package.json` ganhou uma linha).

## Task Commits

| # | tarefa | commit |
|---|---|---|
| 1+2 | o driver, os gates estruturais e os gates de tela | `d65a76c` (feat) |
| 3 | a não-regressão e as mitigações exercitadas — sem alteração de código; o achado está neste SUMMARY e em `deferred-items.md` | — |

As tarefas 1 e 2 saíram num commit só: o arquivo é um artefato único e os gates estruturais
não passam a fazer sentido sozinhos depois que os de tela existem. Divergência de
granularidade registrada.

## Self-Check: PASSED

```
FOUND: scripts/verificar-fase3.mjs (90.014 bytes em disco E em git)
FOUND: package.json (893 bytes em disco E em git)
FOUND: commit d65a76c em git log
sintaxe: node --check scripts/verificar-fase3.mjs — limpo
```

Os arquivos foram conferidos **em git** (`git show HEAD:<path> | wc -c`) e não só em disco,
por causa do despejo de iCloud ativo — `stat` reporta tamanho para arquivo que lê zero bytes,
e um desses já foi commitado vazio nesta fase.

