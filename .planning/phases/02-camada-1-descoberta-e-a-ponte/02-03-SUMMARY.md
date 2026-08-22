---
phase: 02-camada-1-descoberta-e-a-ponte
plan: 03
subsystem: ui
tags: [next, react, rsc, grafo, trilha, procedencia, repertorio, metrica]

requires:
  - phase: 02-camada-1-descoberta-e-a-ponte
    plan: 01
    provides: "Cartao (DTO), motivoDaAresta, resolverSalto, paraCartao, CLASSES_CARTAVEIS, useSessao, <Cartao>, <TrocaPersona>, personaIdValido"
  - phase: 01-funda-o-casca-marca-e-grafo-mockado
    provides: "grafo.ts com as 9 funções de travessia; vocabulário com a cor de cada linguagem; casca com data-view"
provides:
  - "src/dados/trilha.ts — a trilha resolvida como cadeia de ARESTAS, com procedência por ligação e o último passo datado"
  - "src/dados/repertorio.ts — repertorioDe(personaId) com atravessado, adjacente a 1 salto, linguagensNovas e salvos"
  - "src/dados/repertorio.ts — indiceDeSalvaveis(), ocorrência→evento compacto para o cliente nomear o que salvou"
  - "/trilha/[slug] — a rota que o cartão de trilha do 02-01 já apontava"
  - "/meu — Meu Repertório sobre o grafo, substituindo o esqueleto da fase 1"
affects: [02-05, 03, 04]

actuals:
  tokens: 19300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Procedência lida DA ARESTA e nunca da entidade quando o que está na tela é a ligação (D-37)"
    - "Ausência medida vira campo null DECLARADO no DTO, não campo ausente — campo que some vira bloco que some"
    - "Métrica completa no dado, lista recortada na tela, e o recorte dito em texto"
    - "Prefixo comum viajando no próprio índice para as duas pontas usarem a mesma regra de chave sem abrir a fronteira RSC"

key-files:
  created:
    - src/dados/trilha.ts
    - src/componentes/trilha.tsx
    - "src/app/(app)/trilha/[slug]/page.tsx"
    - src/dados/repertorio.ts
    - src/componentes/repertorio.tsx
  modified:
    - "src/app/(app)/meu/page.tsx"

key-decisions:
  - "A procedência exibida por passo é a da ARESTA (autorado), não a da entidade (ic). As quatro entidades da cadeia vêm do acervo; as três ligações entre elas são nossas, e é isso que a tela diz"
  - "«Atravessado» é a união entre as linguagens que o repertório DECLARA e as que as entidades atravessadas declaram, e cada grupo diz na tela de qual das duas metades veio"
  - "O teto de 10 é POR LINGUAGEM, não global, para linguagensNovas continuar completo — recortar o dado recortaria a métrica junto"
  - "A tela lista 12 dos N adjacentes e declara o recorte; a contagem de linguagens novas usa todos"
  - "Nenhuma aresta atua_em foi autorada. A ausência de elenco é declarada em texto, com o número medido (0 de 129)"
  - "hash32/semear foi reescrito em repertorio.ts em vez de importado de caminhada.ts, porque caminhada.ts é arquivo de outro executor da mesma onda"

requirements-completed: [DESC-04, DESC-07]

coverage:
  - id: T1
    description: "A trilha renderiza os 3 passos como arestas navegáveis, com de onde, para onde e por quê"
    requirement: DESC-04
    verification:
      - kind: automated_ui
        ref: "node -e sobre out/trilha/do-rap-ao-teatro-documentario/index.html — 3 data-passo-trilha"
        status: pass
    human_judgment: true
    rationale: "«Lê como travessia e não como lista» é juízo visual. A verificação prova que os três blocos existem com as duas pontas e o motivo da aresta; se a leitura funciona na projeção, só olhando."
  - id: T2
    description: "O rótulo autorado aparece na tela nas três arestas, com a explicação do que autorado significa (D-37)"
    requirement: DESC-04
    verification:
      - kind: automated_ui
        ref: "3 de 3 data-procedencia-aresta=\"autorado\" em out/trilha/.../index.html"
        status: pass
    human_judgment: false
  - id: T3
    description: "O último passo tem data e gratuidade reais, e a ausência de espaço é declarada em texto (D-38)"
    requirement: DESC-04
    verification:
      - kind: automated_ui
        ref: "regex /2026-05-2|21\\.05|21 de maio/ e a frase de ausência de espaço presentes no HTML exportado"
        status: pass
    human_judgment: false
  - id: T4
    description: "Meu Repertório mostra o atravessado com peso e o adjacente a exatamente um salto, calculado no grafo (D-44)"
    requirement: DESC-07
    verification:
      - kind: automated_ui
        ref: "8 data-atravessado e 12 data-adjacente em out/meu/index.html, 12 motivos, 0 vazios"
        status: pass
      - kind: integration
        ref: "npx tsx — as 3 personas com adjacente não vazio e zero itens que já estejam no próprio repertório"
        status: pass
    human_judgment: false
  - id: T5
    description: "Trocar de persona troca o repertório inteiro em um toque (D-45)"
    requirement: DESC-07
    verification:
      - kind: integration
        ref: "as 3 personas prerenderizadas no mesmo HTML; trocar seleciona qual objeto exibir, sem rota e sem recálculo"
        status: pass
    human_judgment: true
    rationale: "Que a troca seja instantânea e não navegue só se comprova clicando. O que a verificação prova é que os três repertórios estão no payload e que os três são diferentes."

duration: 26min
completed: 2026-08-22
status: complete
---

# Fase 2 Plano 03: Trilha de primeira vez e Meu Repertório — Summary

**A trilha do rap ao teatro documentário renderiza como três arestas com a procedência
`autorado` escrita na tela, terminando numa sessão real de 21.05.2026 cujo lugar o acervo
não publica e a tela diz que não publica; e Meu Repertório calcula, no grafo, quantas
linguagens cada persona atravessou e quantas estão a exatamente um passo.**

## Performance

- **Duration:** ~26 min
- **Tasks:** 2 de 2
- **Files:** 6 (5 criados, 1 substituído) · 1.913 linhas

## Os números que o plano mandou registrar

### Quantas linguagens cada persona atravessou, e quantas ficaram a um passo

| | Maria | Carlos | Joana |
|---|---|---|---|
| linguagens **declaradas** no repertório | 3 | 3 | 5 |
| linguagens **atravessadas** (declaradas ∪ as que as entidades declaram) | **8** | **5** | **10** |
| linguagens **novas, a um passo** | **4** | **6** | **9** |
| entidades no repertório | 10 | 12 | 9 |
| vizinhos diretos no grafo (1 salto, cartáveis) | 166 | 150 | 104 |
| adjacentes no repertório adjacente (teto 10 por linguagem) | 81 | 36 | 68 |
| ocorrências salvas | 0 | 0 | 4 |

As linguagens novas, nominalmente:

- **Maria** — arte, arte e tecnologia, cultura popular, gestão cultural
- **Carlos** — acervo, arte, arte e tecnologia, cinema, literatura, música
- **Joana** — animação, cidade, circo, cultura popular, curta-metragem, fotografia,
  memória, performance, poesia

Nenhum desses números está escrito em lugar nenhum do código. `linguagensNovas` é a
diferença entre o conjunto de linguagens que aparece no adjacente e o conjunto que a
persona já atravessou, sobre uma travessia de `vizinhos()` — reger o grafo de novo muda o
número sem tocar em uma linha.

**Carlos é o caso que prova que a métrica mede travessia e não declaração:** ele declara
`cultura-popular` e `teatro` no repertório e nenhuma das 12 entidades dele carrega essas
duas linguagens. Os dois grupos aparecem na tela com peso zero e a frase «nenhuma entidade
do repertório declara esta linguagem», em vez de sumirem — sumir faria a tela afirmar que
ele nunca atravessou teatro, o que o repertório dele desmente.

### A frase exata que a tela usa para o lugar ausente

Esta é a frase que vai ser lida em voz alta, copiada literalmente do HTML exportado:

> **O acervo do Itaú Cultural não publica o espaço desta sessão. Mostramos a data, o
> horário e a gratuidade, que estão na fonte; o lugar não está, e não foi preenchido com
> um valor plausível.**

Logo abaixo dela, na mesma caixa, a medição:

> Medido: 3 de 3 sessões sem espaço declarado. Nenhuma das 2.425 ocorrências do grafo tem
> espaço — é a mesma disjunção entre território e data que a fase 1 registrou, e ela
> alcança esta tela.

E o link `conferir na fonte`, apontando para a URL de origem do evento na agenda do IC.

**Por que não «Itaú Cultural, São Paulo»:** o `espacoId` das três ocorrências é `null`, e é
`null` nas 2.425 ocorrências do grafo. Derivar o lugar da URL de origem seria dado
fabricado usando o crachá do acervo — DADO-05. A ausência declarada é o mesmo tratamento
que D-43 dá à acessibilidade e D-20 à coordenada.

## Task Commits

1. **Task 1 — a trilha como três arestas navegáveis** — `b4c9783` (feat)
2. **Task 2 — Meu Repertório, o atravessado e o adjacente** — `e7349f9` (feat)

## Verificação — comandos e saída real

```
$ npm run build
BUILD=0

$ npx tsc --noEmit
(sem saída, código 0)

$ node -e "…out/trilha/do-rap-ao-teatro-documentario/index.html…"
OK trilha: 3 passos, 3 arestas autoradas rotuladas
   frase do lugar: O acervo do Itaú Cultural não publica o espaço desta sessão. Mostramos
   a data, o horário e a gratuidade, que estão na fonte; o lugar não está, e não foi
   preenchido com um valor plausível.

$ node -e "…out/meu/index.html…"
OK repertorio: 8 atravessadas, 12 adjacentes, 12 motivos, 0 vazios

$ npx tsx -e "…repertorioDe nas 3 personas…"
pessoa-usuaria:autorado:maria  8 linguagens · 81 adjacentes · 4 novas
pessoa-usuaria:autorado:carlos 5 linguagens · 36 adjacentes · 6 novas
pessoa-usuaria:autorado:joana 10 linguagens · 68 adjacentes · 9 novas
(zero adjacentes pertencendo ao próprio repertório, nas três)

$ (fronteira cliente/servidor, versão que entende import multilinha)
arquivos com use client: 14
violações de DP-F: nenhuma
$ grep -rl "Teatro do Oprimido" out/_next/static/chunks | wc -l
0                                    ← o grafo não atravessou
$ du -sh out/_next/static/chunks
856K

$ (gate de cor, versão que ignora comentários)
arquivos com token de cor de apoio em CODIGO: 0 []
```

Os cinco itens de `<verification>` do plano passam: build 0, trilha com 3 passos e 3
rótulos `autorado`, data impressa e link para `/evento/[slug]/`, `/meu` com atravessado,
adjacente e contagem, e zero vazamento do repertório para o adjacente nas três personas.

## Decisões tomadas

**A procedência exibida é a da aresta, e as duas procedências convivem na mesma tela.**
Os quatro nós da cadeia são `ic`: três verbetes da Enciclopédia (Rap, Slam, Teatro do
Oprimido) e um evento da agenda. As três ligações entre eles são `autorado`. Se a tela
lesse `entidade.procedencia`, imprimiria «ic» ao lado de uma ponte que nós escrevemos — a
mentira de procedência que T-02-10 existe para impedir. `PassoTrilha.procedenciaAresta` vem
de `aresta.procedencia` e de mais lugar nenhum, e a explicação ao lado do rótulo é
parametrizada pelas duas pontas daquele passo: «Rap e Slam não compartilham nenhum atributo
na fonte» no passo 1, «Slam e Teatro do Oprimido» no passo 2, e assim por diante.

**«Atravessado» é a união das duas evidências, e a tela diz qual é qual.** Contar só as
linguagens declaradas diria que a Maria nunca atravessou artes visuais, quando 4 das 10
entidades do repertório dela declaram artes visuais. Contar só as das entidades apagaria
`cultura-popular` e `teatro` do Carlos. As duas metades entram, e cada grupo carrega
`declaradaNoRepertorio` para a tela dizer se aquela linguagem veio do repertório ou das
entidades. O efeito colateral honesto: a Maria «atravessou 8», não 3, e por isso ela tem 4
linguagens novas e não 7. Preferimos o número menor e verdadeiro.

**O teto é por linguagem, não global.** Um teto global cortaria linguagens inteiras da
lista e faria `linguagensNovas` depender do tamanho da lista — a métrica de ampliação
passaria a medir o recorte. Com teto por linguagem (10, dentro da faixa 8–12 do plano),
toda linguagem alcançada a um salto continua representada e a contagem fica completa.

**A lista é recortada em 12 na tela, e o recorte é dito.** A Maria tem 81 adjacentes; 81
cartões empilhados são exatamente o catálogo que o produto argumenta contra. A tela mostra
12 e escreve: «Mostrando 12 de 81 vizinhos a um passo. A contagem de linguagens novas acima
usa TODOS os 81 — a lista é recortada para a tela não virar catálogo, e a métrica não é
recortada junto.» O dado permanece completo; o que encolhe é a rolagem.

**Nenhuma aresta `atua_em` foi autorada, e a ausência tem número na tela.** O bloco de
elenco do último passo diz: nenhuma aresta `atua_em` chega a este evento, e dos 129 eventos
com ocorrência datada, zero têm aresta de agente. O texto distingue as duas ordens de
autoria: «Autorar uma ponte editorial entre dois termos é uma proposta de leitura; autorar
que uma pessoa real atuou nesta montagem seria uma afirmação factual falsa.» A decisão
travada em 02-01 foi implementada como recebida.

**`hash32`/`semear` foi reescrito, não importado.** `caminhada.ts` mantém as duas funções
como internas, e `caminhada.ts` não é arquivo deste plano — dois outros executores rodaram
em paralelo sobre a mesma fase, e editar o arquivo do vizinho é o jeito garantido de perder
trabalho. São dez linhas, a duplicação está declarada no comentário, e o efeito pretendido
está preservado: Descobrir e Meu Repertório desempatam igual, então as duas telas não
mostram ordens que se contradizem para a mesma persona.

**O índice de ocorrências salváveis existe e custa 128 KB.** A sessão guarda ids de
ocorrência; o navegador não tem o grafo. Sem o índice, Meu Repertório mostraria «4 salvos»
sem conseguir nomear nenhum. O índice é montado por `grafo.ts` (D-47), tem 129 eventos numa
tabela e a data fatiada em 16 caracteres, e o prefixo comum `ocorrencia:derivado:` viaja
uma vez em vez de 2.425 — o que derrubou o HTML de `/meu` de 899 KB para 427 KB. A regra de
chave é dirigida pelo `prefixo` que vem junto no dado, e não por um import de valor, porque
importar valor de `repertorio.ts` num arquivo `"use client"` arrastaria 23 MB de JSON para
o navegador.

## Desvios do plano

### Corrigidos automaticamente

**1. [Rule 1 — Bug] a explicação de `autorado` estava fixa em «Rap e Slam»**
- **Achado em:** Task 1, lendo o HTML exportado
- **Problema:** a primeira versão guardava a explicação de procedência num
  `Record<Procedencia, string>` com o exemplo do passo 1 escrito por extenso. Nos passos 2
  e 3 o texto continuava dizendo «Rap e Slam não compartilham atributo na fonte» embaixo de
  uma aresta que liga Slam a Teatro do Oprimido — afirmação sobre o par errado, na tela.
- **Correção:** `explicarProcedencia(procedencia, de, para)`, parametrizada pelas duas
  pontas do passo que está sendo renderizado.
- **Verificação:** as três explicações no HTML citam `Rap→Slam`, `Slam→Teatro do Oprimido`
  e `Teatro do Oprimido→"O veneno do teatro"`.
- **Commit:** `b4c9783`

**2. [Rule 2 — Peso indevido] `/meu` exportava 899 KB de HTML**
- **Achado em:** Task 2, depois do primeiro build verde
- **Problema:** os três repertórios completos (156 KB) mais o índice de ocorrências com as
  chaves inteiras (176 KB) mais 81 cartões renderizados produziam 899 KB numa tela de
  telefone. Passa em toda verificação do plano e mesmo assim está errado.
- **Correção:** prefixo comum extraído do índice (−48 KB) e lista recortada em 12 com o
  recorte declarado na tela. Resultado: 427 KB, sem perder um número da métrica.
- **Commit:** `e7349f9`

**3. [Rule 3 — Bloqueio] o gate de DP-F do 02-01 não entende import multilinha**
- **Achado em:** Task 2, verificando a fronteira
- **Problema:** o gate por linha acusou `repertorio.tsx` de importar `@/dados/repertorio`
  fora de `import type`. O import É `import type`, só que quebrado em cinco linhas, e o
  `grep` linha a linha via só a linha do `from`.
- **Correção:** gate reescrito para casar a INSTRUÇÃO inteira depois de tirar comentários.
  Nenhuma mudança de código de produção — o falso positivo estava no gate.
- **Recomendação:** o 02-05, dono do gate de estrutura, deve adotar a versão por instrução.
  Junto com o gate de cor que ignora comentários (registrado pelo 02-01), são dois gates
  desta fase que medem texto em vez de código.

**Total: 3 desvios auto-corrigidos** (1× Rule 1, 1× Rule 2, 1× Rule 3). Nenhum aumenta
escopo. Nenhum arquivo fora de `files_modified` foi tocado.

## O que não funcionou, e o que a próxima onda herda

### 1. Dois caminhos de reserva não são exercitados pelo grafo de hoje

`trilha.ts` tem duas reservas que o dado atual nunca aciona:

- **a reconstrução da cadeia pelas arestas `contextualiza`**, para quando `extra.passos`
  faltar — a única trilha do grafo declara `extra.passos`;
- **o passo `sem-aresta`**, para quando a ordem autorada põe dois nós em sequência sem
  aresta entre eles — os três pares consecutivos têm aresta.

Escrevi os dois porque o plano os pede explicitamente e porque uma segunda trilha entraria
por um deles, mas nenhum está coberto por verificação e nenhum roda hoje. É o mesmo formato
do que o 02-01 registrou sobre a reserva de salto 3. Fica em `.planning/WINDOWS.md`.

### 2. O adjacente a um salto é mais monoclasse do que o feed, e isso é a fonte

M-1 da fase 2 mediu que 47.258 das 47.259 arestas `semelhante_a` ligam duas entidades da
MESMA classe. Um salto a partir das entidades do repertório cai em cheio nessa distribuição:
os 12 adjacentes exibidos da Maria são pessoas e termos de música, com o motivo escrito no
acervo («parecido porque os dois são termos, de música»). O feed de Descobrir escapa disso
porque semeia também pelas LINGUAGENS do repertório, e `pertence_a` é a relação que abre as
classes.

Não usei a semente de linguagem aqui de propósito: `linguagem:cms:musica` tem grau de
milhares, e um salto a partir dela devolveria meio acervo — «adjacente a um passo» viraria
«adjacente a tudo», que é justamente o que o critério 5 do ROADMAP proíbe. A escolha está
entre um adjacente honesto e estreito e um adjacente largo e sem sentido; ficou o primeiro.
**A consequência para quem projetar a tela:** o bloco adjacente lê como uma vizinhança, não
como um feed, e o contraste com Descobrir é informação, não defeito.

### 3. Os salvos da Joana apontam para um evento de 2016

As 4 ocorrências salvas dela (`ocorrencia:derivado:7000-t1-*`) pertencem ao evento «Nova
forma de explorar o Espaço Olavo Setubal», com datas de novembro de **2016**. A tela mostra
as datas como estão, sem rótulo de «passado» — o Cenário 4 (alerta de alteração de horário)
é de outra fase, e quem for construí-lo precisa saber que o dado semeado é histórico, não
futuro.

## Conhecidos que a onda 3 herda

- **`/trilha/[slug]` existe e responde.** Os 12 links de trilha que `cartao.tsx` emite desde
  o 02-01 deixaram de ser links para frente.
- **`repertorioDe` está pronto para a verificação da onda 3.** `diagnostico` traz
  entidades no repertório, vizinhos brutos, adjacentes exibidos, linguagens atravessadas e
  linguagens no adjacente, por persona.
- **`indiceDeSalvaveis()` é reusável** por qualquer tela que precise resolver id de
  ocorrência no cliente sem abrir a fronteira do grafo.

---
*Phase: 02-camada-1-descoberta-e-a-ponte*
*Completed: 2026-08-22*

## Self-Check: PASSED

Os 5 arquivos declarados como criados e o alterado existem em disco; as duas rotas
exportadas (`out/trilha/do-rap-ao-teatro-documentario/index.html` e `out/meu/index.html`)
existem; os 2 hashes de commit existem em `git log`.
