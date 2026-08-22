---
phase: 02-camada-1-descoberta-e-a-ponte
plan: 04
subsystem: ui
tags: [next, react, rsc, grafo, ponte, enciclopedia, acessibilidade, ocorrencias]

requires:
  - phase: 01-funda-o-casca-marca-e-grafo-mockado
    provides: "grafo.ts com vizinhos/porSlug/ocorrenciasDe/temporadasDe, 7.810 entidades, 66.563 arestas, as rotas /artista e /evento já exportadas"
  - phase: 02-camada-1-descoberta-e-a-ponte
    plan: 01
    provides: "motivo.ts (motivoDaAresta), cartao.ts (MotivoCartao/OrigemMotivo), capa-sem-imagem.tsx, selo-linguagem.tsx, sessao.tsx (alternarSalvo)"
provides:
  - "src/dados/ponte.ts — vinculosDe(id) → grupos de relação nomeada, e papeisDe(id) lendo o papel da aresta"
  - "src/componentes/ponte.tsx — BlocoPonte e BlocoAusenciaDeclarada, o vocabulário visual do vínculo"
  - "src/componentes/verbete.tsx — o verbete embutido com crédito e link de procedência (D-39)"
  - "src/componentes/ficha-acessibilidade.tsx — as 8 dimensões em três estados (D-43)"
  - "src/componentes/lista-ocorrencias.tsx — as sessões como registros próprios, salváveis (D-42)"
  - "/artista/[slug] e /evento/[slug] construídos sobre travessia — DESC-05, DESC-06, DESC-08"
affects: [02-05, 03, 05]

actuals:
  tokens: 16400
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Grupo de vínculo com rótulo em português: a relação é nomeada no cabeçalho, o papel na linha"
    - "Frase de ausência é campo do grupo, não estado de erro: grupo vazio renderiza a frase"
    - "Data de referência do build injetada por prop; zero new Date() dentro de componente"
    - "Datas formatadas por leitura da string ISO, sem Intl e sem fuso — build e navegador escrevem igual"
    - "Terceiro estado da acessibilidade decidido pelo SISTEMA DE ORIGEM do registro, não pelo booleano"

key-files:
  created:
    - src/dados/ponte.ts
    - src/componentes/ponte.tsx
    - src/componentes/verbete.tsx
    - src/componentes/ficha-acessibilidade.tsx
    - src/componentes/lista-ocorrencias.tsx
  modified:
    - src/app/(app)/artista/[slug]/page.tsx
    - src/app/(app)/evento/[slug]/page.tsx

key-decisions:
  - "O terceiro estado de D-43 foi reconstruído da origem do registro: os 100 eventos do CMS trazem o objeto accessibility com as 8 chaves explícitas no JSON bruto, e a Enciclopédia não tem campo nenhum — logo false do CMS é «declarado ausente» e false da Enciclopédia é «não declarado»"
  - "SentidoVinculo ganhou um terceiro valor, ambos, para semelhante_a e dialoga_com: carimbá-las de «sai» afirmaria uma direção que a relação simétrica não tem"
  - "O grupo de obras é recortado por CLASSE do vizinho e não por relação, com relacao: null — dizer que é pertence_a mentiria sobre o vocabulário"
  - "O crédito do texto carrega o artigo e o nome da peça: a agenda publica «resumo», a Enciclopédia publica «verbete», e chamar os dois de verbete seria atribuição errada"
  - "Nenhuma aresta atua_em foi autorada para cruzar agentes com eventos datados — decisão travada de 02-01, mantida"

patterns-established:
  - "Bloco que não tem dado declara em texto por que não tem, e nunca desaparece"
  - "Todo teto de exibição é declarado na tela junto com o total real"
  - "Verbete embutido: o link para a fonte é procedência, nunca destino"

requirements-completed: [DESC-05, DESC-06, DESC-08]

coverage:
  - id: D7
    description: "Da página do artista dá para chegar ao evento em que ele atua, e da página do evento dá para voltar ao verbete do artista (DESC-08)"
    requirement: DESC-08
    verification:
      - kind: automated_ui
        ref: "node -e sobre out/artista/a-mattera/index.html e out/evento/hypno-aktion/index.html — link nos dois sentidos presente no HTML exportado"
        status: pass
      - kind: integration
        ref: "npx tsx sobre vinculosDe — o evento devolve pessoa:enc:22151 de volta"
        status: pass
    human_judgment: false
  - id: D8
    description: "A conexão aparece como relação nomeada com o papel vindo da aresta, nunca como link solto (D-40, D-41)"
    requirement: DESC-08
    verification:
      - kind: automated_ui
        ref: "8 de 17 data-vinculo com papel na página do artista; 12 de 34 na do evento; cabeçalho «Atua como artista em» e «Quem atua, e com que papel» no texto"
        status: pass
    human_judgment: true
    rationale: "Que o bloco LEIA como relação e não como lista de links é juízo visual; o gate prova que o papel está no DOM e que o cabeçalho nomeia o vínculo, não que a hierarquia tipográfica comunica isso na projeção."
  - id: D9
    description: "O verbete da Enciclopédia é embutido na página, com crédito e link para a fonte — nunca como saída (D-39)"
    requirement: DESC-05
    verification:
      - kind: automated_ui
        ref: "data-verbete em 792 páginas de artista; 100 com texto completo, 162 com texto curto declarado, 530 declarando que a fonte não publica texto"
        status: pass
    human_judgment: false
  - id: D10
    description: "O evento é a entidade e as ocorrências ficam listadas abaixo, com a contagem no topo (D-42)"
    requirement: DESC-06
    verification:
      - kind: automated_ui
        ref: "2.425 data-ocorrencia renderizadas em 129 páginas de evento; 3 no evento datado da trilha; contagem no h2 com data-ocorrencias-total"
        status: pass
    human_judgment: true
    rationale: "Que cada sessão seja salvável isoladamente só se prova clicando: o botão grava em localStorage por useSessao, e o HTML exportado mostra o botão, não o efeito."
  - id: D11
    description: "A ficha de acessibilidade mostra as 8 dimensões distinguindo declarado de não declarado (D-43)"
    requirement: DESC-06
    verification:
      - kind: automated_ui
        ref: "8 data-dimensao nas duas páginas testadas; data-estado=nao-declarada no evento da Enciclopédia e ausente-declarada no do CMS"
        status: pass
      - kind: integration
        ref: "dados/bruto/secoes — 100 de 100 eventos do CMS trazem accessibility com as 8 chaves; 1.014 de 1.014 registros com o campo têm as 8"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-22
status: complete
---

# Fase 2 Plano 04: Página do artista, página do evento e a ponte Enciclopédia↔agenda — Summary

**A tese da proposta virou duas telas que se apontam: de `/artista/a-mattera/` chega-se a
`/evento/hypno-aktion/` sob o cabeçalho «Atua como artista em», e de lá volta-se ao verbete
dela sob «Quem atua, e com que papel» — com o papel lido da aresta nos dois sentidos, e com
cada bloco sem dado declarando em português por que não tem dado.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3 de 3
- **Files:** 7 (5 criados, 2 substituídos) · 1.578 linhas
- **Build:** 12 s para 1.092 páginas de entidade nas duas rotas (792 artista + 300 evento)

## Os números que o plano exigiu, medidos no HTML exportado

### Elenco nas 300 páginas de evento

| | páginas |
|---|---|
| bloco de elenco **preenchido** (`quem-atua` com item) | **54** |
| bloco de elenco **declarando a ausência** | **246** |
| bloco de realização preenchido (`quem-realiza`) | 41 |
| com **algum** agente (atuação ou realização) | **67** |
| com ocorrência datada | 129 |
| **com agente E ocorrência datada** | **0** |

Os 67 batem exatamente com a medição do planejamento, e o **zero da última linha é a
disjunção do acervo confirmada página a página no export**, não mais só no grafo.

### A frase exata que aparece nas 246 páginas

> **O registro do Itaú Cultural para este evento não declara elenco: não há no acervo
> nenhuma pessoa ou coletivo ligado a ele. A ausência é do registro, não do palco — alguém
> subiu, e quem foi é o que a fonte não publica. Não completamos essa lista, porque escrever
> aqui um nome que o acervo não afirma seria inventar uma participação.**

Ela é a frase mais repetida do protótipo e foi escrita para dizer três coisas de uma vez:
que a categoria existe no produto, que o dado é que não veio, e que a decisão de não
preencher foi tomada de propósito. É a diferença entre um bloco que some e um bloco que
argumenta.

### As 792 páginas de artista

| | páginas |
|---|---|
| com bloco de eventos preenchido | 92 |
| declarando a ausência de eventos | 700 |
| **com alguma obra ligada** | **0 de 792** |
| verbete com 140+ caracteres | 100 |
| verbete curto, declarado como curto | 162 |
| sem texto nenhum, declarado | 530 |

**Zero de 792 páginas têm obra ligada.** A medição do plano — «não existe no grafo nenhuma
aresta ligando obra a pessoa» — sobreviveu ao export inteiro. O bloco de obras aparece nas
792 e declara que o acervo não publica a autoria como vínculo.

**O cruzamento que dói:** das 92 páginas com evento, **8** têm verbete completo e **47** não
têm texto nenhum. A ponte se prova exatamente onde o verbete é mais fino. Por isso o bloco
de verbete renderiza sempre: se ele sumisse quando vazio, a metade Enciclopédia da ponte
desapareceria justamente nas páginas onde ela precisa aparecer.

## Task Commits

1. **Task 1 — `ponte.ts` e o bloco de relação nomeada** — `e6905b6` (feat)
2. **Task 2 — página do artista, com verbete embutido** — `a1e626b` (feat)
3. **Task 3 — página do evento, ocorrências e ficha** — `cd2a566` (feat)
4. **Correção de prosa visível na tela** — `237897d` (fix)

## Verificação — comandos e saída real

```
$ npx tsc --noEmit
(sem saída)  TSC=0

$ npm run build
BUILD=0 · 12,2 s · 792 páginas /artista + 300 /evento

$ npx tsx -e "…vinculosDe / papeisDe…"
OK ponte bidirecional · papeis: [{"papel":"artista","contagem":8}] · grupos vazios com frase: 3

$ node -e "…out/artista/a-mattera/index.html…"
OK artista: 17 vinculos, 8 com papel

$ node -e "…out/evento/hypno-aktion/index.html + evento datado…"
OK evento: 34 vinculos, 8 dimensoes, 3 ocorrencias no evento datado

$ (estados da ficha)
ficha do evento da Enciclopédia: nao-declarada
ficha do evento do CMS:          ausente-declarada
data-data-declarada no histórico: "2000"
blocos que declaram ausência no evento datado: quem-realiza, quem-atua, onde, play

$ du -sh out/_next/static/chunks
816K            ← DP-F intacto: nenhum cliente importa o grafo
```

## Decisões tomadas

### O terceiro estado de D-43 foi reconstruído da origem do registro, e é medido

D-43 pede três estados, mas `Acessibilidade` é oito booleanos e um `false` sozinho é
ambíguo — não dá para saber se a fonte disse «não» ou não disse nada. Fui ao dado bruto:

- **`dados/bruto/secoes/*.json`:** dos **1.014** registros do CMS que têm `accessibility`,
  os **1.014** trazem as **8 chaves explícitas**, nunca um objeto parcial. Cruzando com os
  100 eventos normalizados: **100 de 100** têm o campo completo.
- **A Enciclopédia não tem campo de acessibilidade nenhum.**

Logo a regra é: `true` → declarado presente; `false` num registro do CMS → **declarado
ausente**, porque a ficha foi preenchida e disse que não; `false` num registro da
Enciclopédia → **não declarado**, porque não há ficha. A tela escreve qual das duas leituras
está aplicando, e por quê.

Descobri de passagem que `dados/normalizar.py:156` faz
`{k: v for k, v in (it.get("accessibility") or {}).items() if v}` — **descarta os `false`**.
A distinção não sobrevive até `entidades.json` e por isso teve de ser reconstruída aqui, a
partir do prefixo do id. `dados/` é somente leitura e o gerador está fora da fronteira deste
plano; fica registrado para quem for dono dele.

### `SentidoVinculo` ganhou `"ambos"`

O plano previa `"sai" | "chega"`. `semelhante_a` e `dialoga_com` são simétricas por
definição — filtrar por direção esconderia metade dos vizinhos, e carimbá-las de `sai`
afirmaria uma direção que a relação não tem. As dez outras especificações continuam
dirigidas, e `atua_em`/`realiza` são filtradas por direção nos dois sentidos.

### O grupo de obras tem `relacao: null`

Ele é recortado pela **classe do vizinho**, não por relação, porque a pergunta «que obras são
desta pessoa?» não tem relação correspondente no vocabulário. Marcá-lo de `pertence_a` para
o tipo ficar mais simples mentiria sobre o vocabulário controlado. `GrupoVinculo.relacao` é
`Relacao | null`, e o `null` significa exatamente isto.

### O crédito do texto carrega o artigo e o nome da peça

A agenda publica **resumo**, a Enciclopédia publica **verbete**, e o site é masculino
enquanto a Enciclopédia é feminina. Sem isso a tela escrevia «a site do Itaú Cultural não
publica verbete mais longo» sobre uma chamada de matéria de agenda — dois erros numa frase
só, um de concordância e um de atribuição.

## Desvios do plano

### Corrigidos automaticamente

**1. [Rule 1 — Bug de prosa] espaço antes de pontuação e concordância errada**
- **Achado em:** Task 3, lendo o texto renderizado do HTML exportado
- **Problema:** interpolação de JSX quebrada em linhas produzia «as sessões listadas já
  passaram .» e «tem uma entrada para !!!Hypno-Aktion!!! , e essa»; e o crédito sem artigo
  produzia «a site do Itaú Cultural».
- **Correção:** as frases passaram a ser montadas como string única; o crédito passou a
  carregar artigo, nome e o nome da peça de texto.
- **Commit:** `237897d`

**2. [Rule 1 — Bug de tela] a data de referência aparecia onde não decidia nada**
- **Achado em:** Task 3
- **Problema:** o evento histórico não tem sessão nenhuma, e mesmo assim exibia «data de
  referência · 22.08.2026 · a próxima é calculada contra…». Ruído sobre um cálculo que não
  aconteceu.
- **Correção:** a linha só aparece quando há sessão para comparar.
- **Commit:** `237897d`

**3. [Rule 3 — Bloqueio] o gate da Task 3 conta o payload RSC, não a tela**

O comando de verificação escrito no plano usa `/data-dimensao/g` — **sem** o `="`. O Next
embute a árvore serializada do RSC dentro do próprio HTML (`self.__next_f.push`), onde os
mesmos atributos reaparecem escapados (`data-dimensao\":\"libras\"`). O gate como escrito
contava **16** e falhava com «dimensoes de acessibilidade na ficha: 16», embora a ficha
renderize exatamente 8.

Repare que o mesmo gate usa `data-vinculo="…"` **com** aspas duas linhas acima, e essa forma
não casa com o payload escapado — ou seja, a inconsistência é do comando, não da tela. Rodei
a variante que mede o que o critério quer dizer:

```
$ node -e "…(h.match(/data-dimensao=\"/g)||[]).length…"
OK evento: 34 vinculos, 8 dimensoes, 3 ocorrencias no evento datado
```

**8 nas duas páginas testadas.** É o mesmo tipo de defeito que o 02-01 registrou no gate de
cor: o gate mede o arredor do alvo. Recomendo ao 02-05, dono do gate de estrutura, adotar
`data-{atributo}="` em toda contagem sobre HTML exportado do Next.

**Total: 3 desvios auto-corrigidos** (2× Rule 1, 1× Rule 3). Nenhum aumenta escopo.

## O que não funcionou, e o que precisa de decisão

### 1. Os três planos da onda 2 correram na MESMA árvore de trabalho, não em worktrees

`git status` durante a Task 2 mostrava `src/dados/caminhada.ts` modificado e
`src/componentes/trilha.tsx`, `src/dados/trilha.ts` e `src/app/(app)/trilha/` não
rastreados — arquivos dos planos 02-02 e 02-03, vivos no meu diretório enquanto eu editava
os meus. Duas consequências reais:

- **`npm run build` colidiu.** Uma execução minha morreu com `⨯ Another next build process
  is already running`, porque o Next usa um lock por projeto e havia outro executor
  compilando. Resolvi com laço de repetição e espera; o build seguinte passou na primeira
  tentativa.
- **`npx tsc --noEmit` compila o código dos três planos.** O meu «TSC=0» é, na verdade,
  «os três planos juntos compilam neste instante». Se um vizinho tivesse ficado a meio de
  uma edição, eu teria recebido um erro fora da minha fronteira e gastado tempo procurando
  no lugar errado.

Nenhum arquivo fora do meu `files_modified` foi tocado, e cada commit meu foi encenado
arquivo a arquivo. Mas a garantia de disjunção veio da disciplina, não do isolamento. Para
a próxima onda paralela, worktree por executor.

### 2. Nenhuma sessão do acervo é futura em relação à data do build

O protótipo foi gerado em **22.08.2026** e as ocorrências do CMS vão até maio de 2026. Ou
seja: **em nenhuma das 129 páginas com sessão a linha «a próxima» chega a ser calculada** —
todas caem no ramo «as sessões listadas já passaram». O formato de D-42 («6 sessões · a
próxima sábado, 20h») está implementado e testado, e hoje não é exercitado por nenhum dado.

Não corrigi, porque as duas correções possíveis são piores que o problema: fixar uma data de
referência de mentira no passado faria o protótipo afirmar uma data que não é a dele, e
gerar ocorrências futuras violaria DADO-05. Fica registrado em `.planning/WINDOWS.md`. Se a
demonstração precisar mostrar «a próxima sábado, 20h» ao vivo, a decisão é de quem coleta o
acervo — recoletar a agenda com datas à frente —, não de quem escreve a tela.

### 3. O papel é sempre «artista», e isso empobrece o bloco de papéis

`papeisDe` devolve, para toda pessoa e todo coletivo do acervo carregado, exatamente um
papel. A tela 14 promete ver a mesma pessoa como artista aqui e curadora ali, e no dado isso
não acontece nenhuma vez. Construí o bloco para N papéis e ele mostra 1; não inflei a lista
e não impedi o segundo. É uma promessa da tela que o acervo hoje não sustenta, e a
demonstração deve evitar prometê-la em voz alta.

## Conhecidos que a onda 3 herda

- **`ROTA_POR_CLASSE` está duplicado** entre `src/componentes/cartao.tsx` e `src/dados/ponte.ts`.
  `cartao.tsx` está fora da fronteira deste plano e não podia exportar o mapa. São duas
  fontes de verdade para a mesma tabela de rotas, e elas divergem na primeira edição — o
  02-05 deveria unificá-las num módulo só.
- **`/trilha/[slug]` é link para frente** a partir do grupo `contextualiza`. O plano 02-03
  cria a rota, e o build já a exporta.
- **`data-ponte`, `data-vinculo`, `data-ponte-ausente`, `data-verbete`, `data-dimensao`,
  `data-estado`, `data-ocorrencia`, `data-data-declarada`, `data-papel`** são o contrato de
  verificação destas duas telas. Contagens sobre eles precisam usar a forma com `="`.

## Próximo

DESC-08 está satisfeito e é auditável por comando: a ponte navega nos dois sentidos, o papel
vem da aresta nas duas pontas, e cada bloco vazio argumenta a própria ausência. O que falta
da Camada 1 é Meu Repertório (DESC-07), que consome `salvos` — e os ids que ele vai ler são
os de **ocorrência**, gravados por `lista-ocorrencias.tsx` com o texto dizendo que o que foi
salvo é a sessão, não o evento.

---
*Phase: 02-camada-1-descoberta-e-a-ponte*
*Completed: 2026-08-22*

## Self-Check: PASSED

Os 7 arquivos declarados existem em disco; os 4 hashes de commit existem em `git log`.
