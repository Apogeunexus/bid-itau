---
phase: 01-funda-o-casca-marca-e-grafo-mockado
plan: 02
subsystem: dados
status: complete
tags: [grafo, ontologia, procedencia, ocorrencias, territorio, personas, determinismo]

requires:
  - "01-01 — contrato de id, envelope de procedência e as 9 assinaturas de grafo.ts"
provides:
  - "src/dados/gerado/{entidades,arestas,ocorrencias,personas,vocabulario,meta}.json — grafo completo versionado"
  - "scripts/gerar-grafo.mjs — gerador reexecutável, determinístico, com autoconferência de 11 invariantes"
  - "scripts/dados/centroides.json — 118 municípios, 27 UFs, 41 países, sem API"
  - "src/dados/grafo.ts — porTerritorio e ocorrenciasDe reais; temporadasDe acrescentada"
  - "public/acervo/ — 900 imagens servidas localmente, índice versionado"
  - "src/app/verificacao — contagens reais por classe, procedência, relação, coordenada e acessibilidade"
affects:
  - "fase 2 consome pessoa/obra/termo/evento e as arestas atua_em com papel"
  - "fase 3 decide o enquadramento de território × data (ver lacuna 1)"
  - "fase 4 resolve as 40 duplicatas por chaveIdentidade e aresta duplicata_suspeita"
  - "fase 5 lê meta.json para o Observatório e a cobertura de acessibilidade"

tech-stack:
  added: []
  patterns:
    - "autoconferência dentro do gerador: 11 invariantes abortam ANTES de escrever, nunca depois"
    - "orçamento global de arestas com fanout efetivo registrado em meta.json, em vez de degradar em silêncio"
    - "leitura defensiva: arquivo com tamanho em disco que lê 0 byte aborta em vez de gerar grafo menor"
    - "duas contagens de acessibilidade — declarada pela fonte e incluindo derivadas — porque só uma seria enganosa"
    - "slug desambiguado por classe, senão a rota estática engole o homônimo"

key-files:
  created:
    - scripts/dados/centroides.json
    - src/dados/gerado/ocorrencias.json
    - src/dados/gerado/personas.json
    - public/acervo/indice.json
  modified:
    - scripts/gerar-grafo.mjs
    - scripts/smoke-grafo.ts
    - src/dados/tipos.ts
    - src/dados/grafo.ts
    - src/app/verificacao/page.tsx
    - src/dados/gerado/entidades.json
    - src/dados/gerado/arestas.json
    - src/dados/gerado/vocabulario.json
    - src/dados/gerado/meta.json

decisions:
  - "Arte, Gestão cultural, Rádio e TV promovidas a linguagens novas marcadas ic com fonte na Enciclopédia, em vez de mantidas cruas — promover preserva o rótulo, encaixar à força fabricaria dado"
  - "visitação diária de longa duração limitada a 60 dias, com o corte contado em meta.cobertura.agenda"
  - "orçamento global de 150.000 arestas semelhante_a e 20.000 de copresença; o fanout efetivo cai e é registrado"
  - "candidatos a semelhante_a vêm de janela de vizinhança dentro do balde, não de comparação todos-contra-todos"
  - "coordenada de unidade federativa com método centroide-estado, quarto método além dos três do plano"
  - "vocabulario.json passa a ser { linguagens, temas } em vez de array — contrato novo para o plano irmão"
  - "situado_em é dirigida e porTerritorio só desce a hierarquia; a versão não dirigida devolvia o país inteiro"

metrics:
  duration: "~55 min"
  completed: 2026-08-22
  commits: 3
  tasks: 3

actuals:
  tokens: 37200
  tasks: 3
  commits: 3
---

# Phase 1 Plan 02: A camada de dados — o grafo completo · Summary

O acervo real em disco virou um grafo tipado de **7.810 entidades e 66.563 arestas** em 19 classes,
com procedência em cada nó e cada aresta, motivo escrito em toda `semelhante_a`, ocorrências
derivadas por regra determinística, território com coordenada declarada e a cadeia rap → poesia
falada → teatro percorrível de ponta a ponta.

## Contagens finais

### Entidades por classe — 7.810

| classe | n | origem |
|---|---:|---|
| `ocorrencia` | 2.425 | derivada do período real (D-21) |
| `conteudo` | 1.805 | CMS |
| `pessoa` | 575 | 152 CMS (agentes) + 423 Enciclopédia |
| `midia` | 529 | CMS |
| `termo` | 481 | Enciclopédia — o tesauro do Cenário 1 |
| `territorio` | 359 | derivado do saneamento (118 municípios, 27 UFs, 214 países) |
| `evento` | 300 | 100 CMS + 160 Enciclopédia + **40 duplicatas autoradas** |
| `temporada` | 287 | 129 do CMS + 158 da Enciclopédia |
| `instituicao` | 246 | Enciclopédia |
| `obra` | 239 | Enciclopédia |
| `coletivo` | 217 | os 217 `grupo` da Enciclopédia |
| `espaco` | 113 | derivado do saneamento |
| `tema` | 94 | taxonomia do CMS |
| `formacao` | 54 | CMS |
| `publicacao` | 46 | CMS |
| `linguagem` | 33 | 29 controladas + 4 promovidas |
| `pessoa-usuaria` | 3 | autorado (D-25) |
| `repertorio` | 3 | autorado |
| `trilha` | 1 | autorado — a do Cenário 1 |

Nenhuma entidade tem classe `artista`, `curador`, `produtor` ou `educador` (DADO-03). A
invariante 3 da autoconferência aborta se aparecer uma.

### Procedência

| | entidades | arestas |
|---|---:|---:|
| `ic` | 4.826 | 14.882 |
| `derivado` | 2.937 | 51.600 |
| `autorado` | **47** | **81** |

As 4.826 entidades `ic` têm `fonte` não vazia — 4.826 de 4.826, conferido pela invariante 2.
As 47 autoradas são exatamente: 40 duplicatas + 3 personas + 3 repertórios + 1 trilha.

### Arestas por relação — 66.563

`semelhante_a` 47.259 · `pertence_a` 13.000 · `ocorre_em` 2.712 · `situado_em` 1.556 ·
`aprofunda` 887 · `realiza` 527 · `atua_em` 508 · `duplicata_suspeita` 40 · `fala_sobre` 39 ·
`dialoga_com` 31 · `contextualiza` 4.

Zero `semelhante_a` sem motivo. Zero `atua_em` sem papel — os papéis emitidos são
`colunista`, `participante` e `artista`, todos na aresta, nunca como classe.

Sem aresta ainda: `influenciou`, `deriva_de`, `curou` — a fonte não traz o vínculo e nenhuma
regra determinística o produz sem fabricar. Ficam para quando houver dado.

### Cobertura de coordenadas — todas `derivado` (D-20)

| método | lugares |
|---|---:|
| `centroide-pais` | 214 |
| `centroide-municipio` | 118 |
| `deslocamento-por-espaco` | 113 |
| `centroide-estado` | 27 |
| **sem coordenada** | **0** |

---

## Os dois fatos que o plano mandou registrar, sem suavizar

### 1. Território e data não se cruzam na mesma entidade

Está medido e reproduzido em `npm run smoke`:

```
porTerritorio("territorio:derivado:belem-para")
  sem janela:                39 entidades
  janela de 4 dias em 2026:  0 entidades
```

As 39 são 11 pessoas, 17 eventos, 3 instituições e 8 espaços — exatamente as 31 entidades de
Belém que o plano mediu, mais os espaços derivados. **Todas históricas** (1978, 1966, 2010).
Os 100 eventos do CMS têm data de 2026 e **zero** território: `com espaco 0 · com territorio 0`
sobre os 100 registros.

Consequência dura: **nenhuma consulta "Belém nos próximos quatro dias" pode devolver resultado
sobre dado real.** O zero acima não é bug — é o acervo. `porTerritorio` aceita `janela`
opcional justamente para a fase 3 escolher o enquadramento do Cenário 2 (Carlos, 4 dias em
Belém): mostrar o acervo histórico da cidade sem prometer agenda futura, ou mudar a promessa do
cenário. **Não foi resolvido inventando data**, que violaria DADO-05.

### 2. Acessibilidade está praticamente vazia na fonte — e o número do plano estava baixo

O plano registrava "12 registros, 3 mídias e 9 eventos". A medição sobre as cinco fontes do CMS
dá **56 registros declarados**, não 12:

| dimensão | declarada pela fonte (`ic`) | incluindo ocorrência e temporada |
|---|---:|---:|
| `libras` | 56 | 180 |
| `open_caption` | 1 | 1 |
| `subtitle` | 1 | 1 |
| as outras 5 | 0 | 0 |

Os 56 são 31 conteúdos, 9 eventos, 5 formações, 3 mídias (48 na fonte crua) mais os clones que
herdam. O plano contou só eventos e mídias. `meta.json` publica as duas colunas de propósito:
divulgar só a segunda inflaria um campo que na origem está quase vazio. A tela de Filtros
(APPX-01, fase 5) vai encontrar 7 das 8 dimensões zeradas. **Não foi preenchido com valor
plausível.**

### 3. A exceção de procedência autorada nas arestas — amplia em um item `CON-procedencia-do-mock`

`Rap` é `termo:enc:80292`, linguagem **Música**. `Slam` é `termo:enc:80282`, linguagem
**Literatura**. Os dois não compartilham nenhum atributo na fonte, então nenhuma regra derivada
os liga. A ponte é conhecimento cultural, não inferência de dado.

Foi modelada como **Trilha autorada sobre entidades reais**, `trilha:autorado:do-rap-ao-teatro-documentario`,
com 3 arestas `semelhante_a` de `procedencia: "autorado"` e motivo escrito por extenso:

```
Rap --semelhante_a--> Slam
  (quem ouve rap costuma chegar à poesia falada pela batida e pela rima —
   o slam é a poesia dita em voz alta, em disputa)
Slam --semelhante_a--> Teatro do Oprimido
  (do slam ao palco é um passo curto: nos dois a pessoa fala em primeira pessoa sobre a
   própria vida, e o teatro do oprimido nasceu justamente de pôr o depoimento em cena)
Teatro do Oprimido --semelhante_a--> "O veneno do teatro" …
  (daqui a trilha sai da enciclopédia e vira agenda: um espetáculo de teatro do próprio
   acervo, com data marcada e entrada gratuita, para o passo seguinte ser sair de casa)
```

**Nenhuma outra aresta do grafo é autorada por conteúdo.** As outras 78 autoradas são
estruturais: 40 `duplicata_suspeita`, 31 `dialoga_com` de repertório, 3 `pertence_a` de
persona → repertório e 4 `contextualiza` da própria trilha.

Não foi inventada regra de derivação para a ligação parecer emergente. Autorar escondido seria
pior que autorar. O conjunto autorado de `CON-procedencia-do-mock` cresce em **um item**: as
arestas da trilha do Cenário 1.

---

## Verificação executada

Todos os comandos abaixo rodaram de verdade, nesta ordem, com estas saídas.

```
$ npm run gerar-grafo
  acervo: 900 imagens em public/acervo/ (0 copiadas agora, 900 já presentes)
grafo gerado: 7810 entidades · 66563 arestas · 287 temporadas · 2425 ocorrências ·
              40 duplicatas · 33 linguagens · 94 temas · 900 imagens

$ npm run gerar-grafo && cp … && npm run gerar-grafo && diff -q …   # 6 arquivos
OK determinismo em todos os 6 arquivos gerados

$ npm run smoke                                                       # exit 0
contagens()
  por classe:      {"coletivo":217,…,"trilha":1}
  por procedência: {"autorado":47,"derivado":2937,"ic":4826}
  GRAU_HUB = 60 · fanout semelhante_a = 20
cobertura de coordenadas (todas derivadas, D-20)
  centroide-estado            27
  centroide-municipio        118
  centroide-pais             214
  deslocamento-por-espaco    113
  sem coordenada               0
caminho("termo:enc:80292", "termo:enc:79963")
  de:   Rap (musica)
  para: Teatro do Oprimido (teatro)
  Rap --semelhante_a--> Slam   (quem ouve rap costuma chegar à poesia falada …)
  Slam --semelhante_a--> Teatro do Oprimido   (do slam ao palco é um passo curto …)
trilha autorada trilha:autorado:do-rap-ao-teatro-documentario
  … 3 passos …
  chegada: "O veneno do teatro" … — 3 ocorrência(s), gratuita, a partir de 2026-05-21T20:00
porTerritorio("territorio:derivado:belem-para")
  sem janela:                39 entidades
  janela de 4 dias em 2026:  0 entidades
OK: cadeia do Cenário 1 percorrida em 2 saltos, com motivo em cada aresta.

$ npm run build && test -f out/verificacao/index.html
Route (app)  ┌ ○ /   ├ ○ /_not-found   └ ○ /verificacao     ○ (Static) prerendered
OK build + procedencia no HTML exportado

$ ENCICLOPEDIA_FONTES=…/enciclopedia.jsonl,…/bruto/enciclopedia/itens.jsonl npm run gerar-grafo
grafo gerado: 142964 entidades · 407837 arestas · 20205 temporadas · …
termos preservados: 481 | total: 142964                      # mesclar não destrói o tesauro
fanoutEfetivo 1 · fanoutCopresenca 1                          # o orçamento segurou o tamanho
semCoordenada 407  [A Galeria City, Alice Mogabgab Gallery, Arbejdermuseet, …]

$ ls public/acervo | grep -vc indice.json ; git check-ignore …
900 · indice.json presente · binarios ignorados pelo git
$ git ls-files public/acervo
public/acervo/indice.json                                     # só o índice é versionado

$ node -e "<invariantes das arestas>"
OK arestas; papeis distintos: artista | participante | colunista

$ node -e "<duplicatas>"
OK duplicatas 40 variacoes 7

$ node -e "<ocorrencias>"
OK ocorrencias 2425 eventos indexados 129

$ npx tsx -e "<ocorrenciasDe pela API>"
eventos com mais de uma ocorrencia: 58
evento: Nova edição da "Ocupação Itaú Cultural" … → 1 temporada, 52 ocorrências

$ node -e "<personas>"
OK personas: Maria (10 entidades, 0 salvas) | Carlos (12, 0) | Joana (9, 4 salvas)

$ node -e "<centroides>"
OK centroides: 118 municipios · 27 UFs · 41 paises · 0 nomes do acervo sem entrada

$ grep -cE "node:https?|require\('https?'\)|axios|await fetch\(" scripts/gerar-grafo.mjs
0                                                             # o gerador não faz rede
```

### A autoconferência funcionou de verdade, não só no papel

Ela abortou duas vezes durante a execução e as duas vezes tinha razão:

1. **`leitura truncada: dados/imagens/indice.json tem tamanho em disco e leu 0`** — pegou a
   evicção do iCloud descrita abaixo. Sem essa trava o grafo teria sido gerado sem imagem
   nenhuma, versionado, e o defeito só apareceria na tela.
2. **`407 lugares sem coordenada`** no modo crawl completo — aqui quem estava errado era eu, e o
   plano estava certo: a invariante 10 diz "o que ficou sem entra em `meta.cobertura.semCoordenada`
   com a lista dos nomes", não "zero sem coordenada". Corrigida para abortar só quando a cidade
   ESTÁ na tabela e mesmo assim não recebeu coordenada — isso sim é bug do gerador.

---

## Deviations from Plan

### 1. [Rule 2 — Funcionalidade crítica ausente] `Arte` promovida em vez de colapsada em `arte e tecnologia`

- **Encontrado em:** Task 1, ao montar o vocabulário.
- **O plano dizia:** "`Arte` e `Tecnologia` colapsam em `arte e tecnologia`".
- **O que foi feito:** só `Tecnologia → arte-e-tecnologia` virou alias. `Arte` foi **promovida**
  como linguagem nova `arte`, junto com `Gestão cultural`, `Rádio` e `TV`, todas marcadas `ic`
  com fonte na Enciclopédia e `promovida: true` no vocabulário.
- **Por quê:** `Tecnologia` é a forma curta de uma entrada que já existe no vocabulário
  controlado; `Arte` é rótulo genérico e não é sinônimo de "arte e tecnologia". Colapsar os dois
  atribuiria a 16 registros uma classificação que a fonte não deu — a mesma fabricação que
  DADO-05 impede em `Rádio → audiovisual`. Promover preserva o rótulo exatamente como a
  Enciclopédia escreveu.
- **Efeito colateral a registrar:** com os 5 rótulos tratados, `extra.linguagensNaoMapeadas`
  ficou **vazio em todas as entidades**. O mecanismo continua no código e volta a disparar
  para qualquer rótulo novo; hoje ele não tem o que reportar. Isso substitui o comportamento de
  `01-01`, que deixava 4 rótulos crus nesse campo. **Se a preferência for mantê-los crus,
  basta remover as 4 entradas de `LINGUAGENS_PROMOVIDAS` — uma linha.**

### 2. [Rule 2] Desambiguação de slug por classe

- **Encontrado em:** Task 1, ao conferir a saída.
- **Situação:** 70 colisões de `(classe, slug)` afetando 145 entidades, e 1 entidade sem slug.
  O acervo tem homônimos reais — "13ª Bienal do Mercosul" em dois registros, "A Gentil Carioca"
  em duas instituições.
- **Por que é crítico:** sob `output: "export"`, `generateStaticParams` exportaria uma página só
  e a segunda entidade sumiria do produto **sem erro nenhum**.
- **Fix:** o primeiro por id mantém o slug limpo, os demais recebem o identificador de origem
  como sufixo. 76 slugs desambiguados, contados em `meta.cobertura.slugsDesambiguados`, e uma
  invariante nova aborta se sobrar colisão.

### 3. [Rule 2] Leitura defensiva das fontes obrigatórias

- **Encontrado em:** Task 2, quando `dados/imagens/indice.json` e `dados/amostra/enciclopedia.jsonl`
  passaram a ler 0 byte apesar de terem tamanho em disco (evicção do iCloud, item 1 de
  "O que não funcionou").
- **Fix:** `lerNormalizado`, `lerEnciclopedia` e a leitura do índice de imagens abortam quando o
  arquivo tem tamanho e lê vazio, ou quando a lista sai vazia. Sem isso o gerador produziria um
  grafo menor, sem erro, e o versionaria como legítimo. Transformação de dado ausente é dado
  inventado por omissão.

### 4. [Rule 3 — Bloqueio] Orçamento global de arestas, com fanout efetivo registrado

- **Encontrado em:** Task 1, ao rodar com o crawl completo.
- **Situação:** comparação todos-contra-todos dentro de cada balde é O(n²) e inviável com 43 mil
  pessoas em "Artes visuais"; e fanout fixo de 20 sobre 120 mil entidades geraria ~2 milhões de
  arestas e centenas de MB.
- **Fix, duas partes:** (a) candidatos a `semelhante_a` vêm de uma **janela de vizinhança** de 10
  para cada lado dentro do balde ordenado, o que mantém o custo linear e ainda distribui melhor
  que a versão anterior — que, por ordenar por id no desempate, fazia todo mundo apontar para os
  mesmos 20 ids alfabeticamente primeiros; (b) **orçamento global** de 150.000 arestas
  `semelhante_a` e 20.000 de copresença, com o fanout efetivo reduzido para caber e **registrado
  em `meta.json`** (`fanoutEfetivo`, `fanoutCopresenca`). Degradar em silêncio seria pior que
  degradar. No acervo padrão o fanout efetivo é 20, ou seja, o teto do plano vale sem ajuste.

### 5. [Rule 3] Teto de 60 dias na visitação diária de longa duração

- **Situação:** o acervo tem períodos de até **3.327 dias** — nove anos —, resíduo do CMS. A
  regra "visitação diária" de D-21 aplicada crua produziria mais de 10 mil ocorrências para um
  punhado de eventos.
- **Fix:** visitação diária limitada aos primeiros 60 dias do período. 36 eventos foram cortados,
  somando 16.282 dias, **tudo contado em `meta.cobertura.agenda`**. A alternativa — inventar um
  fim plausível para o período — violaria DADO-05.

### 6. [Rule 2] `centroide-estado` como quarto método de coordenada

- **Situação:** o plano fixa `situado_em` como "espaço → município → município → estado → estado
  → país", o que exige nós de unidade federativa; mas lista só três métodos de coordenada, nenhum
  aplicável a um estado.
- **Fix:** 27 centroides de UF na tabela e o método `centroide-estado` declarado no tipo. Um
  território sem coordenada é um território invisível no mapa. O método fica na legenda como os
  outros três.

### 7. [Rule 1 — Bug] `porTerritorio` devolvia o país inteiro

- **Encontrado em:** Task 3, no primeiro teste — `porTerritorio("Belém")` devolvia **718**
  entidades.
- **Causa:** `vizinhos()` é não dirigida por projeto. Começando em Belém a travessia subia para
  Pará, depois para Brasil, e descia para todos os municípios brasileiros.
- **Fix:** `situado_em` é dirigida (o contido aponta para o continente); descer a hierarquia é
  seguir só as arestas que **chegam** no território. Belém passou a 39, que bate exatamente com
  as 31 entidades medidas no plano mais os 8 espaços derivados.

### 8. [Cosmético] `vocabulario.json` mudou de forma — contrato novo para o plano irmão

Era um array de linguagens; passou a `{ linguagens: [...], temas: [...] }`, que é a forma que a
própria verificação deste plano espera (`v.linguagens || v`). Quem lê a cor de linguagem precisa
ler `vocabulario.linguagens`. Cada entrada ganhou `promovida: boolean`.

### 9. [Cosmético] Casamento de imagem por URL, não só por `dono`

O plano manda casar pelo campo `dono` do índice. Casar **por URL primeiro** e usar `dono` como
reserva cobre mais: só por `dono` os eventos e conteúdos do CMS ficariam sem imagem alguma
(o índice não tem dono de tipo `evento` nem `conteudo`), enquanto por URL 6 eventos e 68
conteúdos casam. A URL de origem é procedência exata; nunca vai para `imagem`, só para
`extra.imagemFonte`, para o protótipo não buscar imagem em rede.

---

## Known Stubs

| Item | Onde | Por quê | Resolve em |
|---|---|---|---|
| classe `programa` sem entidade | `tipos.ts` | a fonte não tem o conceito de programa institucional separado | fase 2, se aparecer |
| relações `influenciou`, `deriva_de`, `curou` sem aresta | `arestas.json` | a fonte não traz o vínculo e nenhuma regra o produz sem fabricar | quando houver dado |
| imagem local só para 1.019 de 7.810 entidades | `entidades.json` | o download parou em 900 arquivos; **eventos têm 13 de 300 e conteúdos 68 de 1.805** | rodar `dados/baixar_imagens.py` até o fim |
| `porTerritorio` com janela futura devolve 0 | `grafo.ts` | lacuna 1 — é o acervo, não o código | decisão de enquadramento na fase 3 |

Nenhum impede o objetivo desta fatia. O terceiro é o único com impacto visual: as fases 2 e 5
vão renderizar cartão de evento sem imagem na maioria dos casos, salvo se o download for
concluído.

## Threat Flags

Nenhuma superfície nova fora do `<threat_model>` do plano.

| Threat ID | Estado |
|---|---|
| T-02-01 (escrita em `public/acervo/`) | **mitigado** — chave validada contra `^[0-9a-f]{8,}\.(jpg\|jpeg\|png\|webp)$` e destino conferido após `resolve`; 0 chaves rejeitadas no índice real, e o contador está em `meta.json` |
| T-02-02 (marcação do CMS na tela) | **mitigado** — `paraTextoPuro` + `sanearProfundo` em todo `extra`; invariante 4 varre todo campo string do gerado e aborta com `<` ou `>` |
| T-02-03 (crawl de 42 MB / explosão de arestas) | **mitigado** — leitura por stream linha a linha e orçamento global com fanout efetivo registrado; o crawl de 110 mil registros gera em 5 s |
| T-02-04 (autorado passando por acervo) | **mitigado** — invariantes 1, 2, 8, 9 e 11; as 47 entidades e 81 arestas autoradas estão nomeadas neste SUMMARY e em `/verificacao` |
| T-02-05, T-02-06 | aceitos, conforme plano |

---

## O que não funcionou

### 1. O iCloud despejou os arquivos de entrada no meio da execução — e isto vai voltar a acontecer

`/Users/macos/Desktop/Noz` está dentro do **iCloud Drive** (sync de Desktop ligado) e o volume
está a **97% de ocupação, 14 GiB livres de 460 GiB**. No meio da Task 2 o macOS marcou arquivos
como `compressed,dataless` e passou a devolver **0 byte** na leitura, mantendo o tamanho no
`stat`. Note que `wc -c` continuava reportando o tamanho certo — ele usa `stat`, não lê. O
sintoma é traiçoeiro exatamente por isso.

Atingiu, em momentos diferentes: `dados/amostra/enciclopedia.jsonl`,
`dados/imagens/indice.json`, **2.903 arquivos de `node_modules`** (o `tsx` quebrou com
`does not provide an export named 'r'`) e até objetos do `.git`.

Recuperação feita: `brctl download` em lote sobre os arquivos com flag `dataless`, mais liberar
espaço apagando `out/` e `.next/`. As 10 fontes obrigatórias voltaram íntegras e conferidas
byte a byte. `node_modules` não voltou pelo iCloud e foi reinstalado com `npm ci` —
`package.json` e `package-lock.json` intactos.

**Ainda dataless e não recuperáveis pelo provedor:** 47 arquivos, todos em
`dados/bruto/{materias,secoes,subcategorias}/`, mais `.planning/intel/classifications/funcionalidades-*.json`
e `.planning/phases/01-.../1-CONTEXT.md`. Nenhum deles é lido pelo gerador — o pipeline usa
`dados/normalizado/`, `dados/taxonomia/`, `dados/amostra/` e `dados/imagens/`, todos íntegros.
Mas `1-CONTEXT.md` é documento do projeto e vale conferir se abre.

**Recomendação, e é a mais importante deste documento:** mover o projeto para fora do iCloud
Drive, ou desligar "Otimizar armazenamento do Mac", antes da fase 2. O `out/` sozinho duplica
135 MB de imagem a cada build e alimenta a pressão. Não é problema do código e não dá para
resolver de dentro dele.

### 2. `.gitignore` precisa de `tsconfig.tsbuildinfo` e o arquivo não é meu

`tsc --noEmit` com `incremental: true` cria `tsconfig.tsbuildinfo` na raiz, e ele aparece como
não rastreado. `.gitignore` pertence ao plano `01-01`/plano irmão e a fronteira de arquivos deste
plano proíbe editá-lo, então **removi o arquivo manualmente antes de cada commit** em vez de
ignorá-lo. Uma linha `tsconfig.tsbuildinfo` no `.gitignore` resolve de vez.

### 3. O checkpoint de verificação humana continua sem humano

Como em `01-01`, a execução foi desassistida. Não há checkpoint neste plano, mas
`/verificacao` ganhou muito conteúdo novo e ninguém olhou para a tela — só para o HTML
exportado. O julgamento visual segue pendente.

---

## Self-Check: PASSED

Todos os arquivos declarados em `key-files` existem em disco e os 3 commits existem em
`git log`. Verificado abaixo.
