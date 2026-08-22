---
phase: 02-camada-1-descoberta-e-a-ponte
plan: 01
subsystem: ui
tags: [next, react, tailwind, grafo, recomendacao, contexto, localstorage, rsc]

requires:
  - phase: 01-funda-o-casca-marca-e-grafo-mockado
    provides: "grafo.ts com as 9 funções de travessia, 7.810 entidades e 66.563 arestas, vocabulário com a cor de cada linguagem, casca com data-view e moldura de telefone, 18 rotas exportadas"
provides:
  - "src/dados/cartao.ts — o DTO serializável que atravessa a fronteira servidor→cliente na fase inteira"
  - "src/dados/motivo.ts — o texto do selo de motivo em dois modos, os dois vindos da aresta (DP-A)"
  - "src/dados/caminhada.ts — montarFeed({personaId, disposicoes, limite}) → {cartoes, avisos, diagnostico}"
  - "src/dados/disposicoes.ts — as 5 disposições de DESC-01, com predicado que declara ausência de campo"
  - "src/contexto/sessao.tsx — persona, disposições e salvos em Context com espelho em localStorage"
  - "src/componentes/cartao.tsx e capa-sem-imagem.tsx — o vocabulário visual do feed"
  - "src/componentes/troca-persona.tsx — a troca de persona de D-45, montável em qualquer tela"
  - "scripts/testar-caminhada.ts — 9 asserções sobre o grafo real, rodáveis por npm run testar-caminhada"
affects: [02-02, 02-03, 02-04, 02-05]

actuals:
  tokens: 27900
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Caminhada no build, DTO no cliente: nenhum arquivo com use client importa o grafo (DP-F)"
    - "Predicado com contexto injetado: disposicoes.ts declara o que lê do grafo sem importá-lo"
    - "Desempate por FNV-1a semeado pela persona; localeCompare proibido no motor"
    - "Rodízio de classe com relaxamento em duas etapas — a ressalva literal de D-27"
    - "data-motivo / data-origem-motivo no DOM como contrato de verificação da fase"

key-files:
  created:
    - src/dados/cartao.ts
    - src/dados/motivo.ts
    - src/dados/caminhada.ts
    - src/dados/disposicoes.ts
    - src/dados/personas.ts
    - src/contexto/sessao.tsx
    - src/componentes/cartao.tsx
    - src/componentes/capa-sem-imagem.tsx
    - src/componentes/troca-persona.tsx
    - src/componentes/onboarding-disposicao.tsx
    - src/componentes/feed-descobrir.tsx
    - scripts/testar-caminhada.ts
  modified:
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/(app)/descobrir/page.tsx
    - src/app/onboarding/[passo]/page.tsx
    - src/componentes/selecao-persona.tsx
    - package.json

key-decisions:
  - "origemMotivo ganhou um terceiro valor, sem-aresta, para o cartão de serendipidade: carimbá-lo de composto afirmaria uma relação que não existe no grafo"
  - "Não foram autoradas arestas atua_em para cruzar agentes com ocorrências datadas — seria uma afirmação factual falsa sobre pessoas reais"
  - "Duração e faixa etária não existem em campo nenhum do grafo: os predicados devolvem indeterminado, o motor emite aviso e a tela mostra o aviso, em vez de filtrar por proxy"
  - "Evento sem sessão declarada gratuita é cortado pelo filtro de gratuidade — não por ser pago, mas por não declarar"
  - "A capa sem imagem usa o grafismo em duas camadas deslocadas, clara e escura, porque nenhum código pode saber se o token da linguagem é claro ou escuro"

patterns-established:
  - "Fronteira RSC: Cartao é o único formato que atravessa; Entidade para em paraCartao()"
  - "Motivo vem sempre de uma aresta, e a origem do texto viaja com ele até a tela"
  - "Ausência de campo no acervo é mostrada em texto, na entrada e no feed, nunca suprimida"

requirements-completed: [DESC-01, DESC-02]

coverage:
  - id: D1
    description: "Onboarding 1 mostra os 5 cartões de disposição de DESC-01 e a escolha sobrevive a recarregar a página"
    requirement: DESC-01
    verification:
      - kind: automated_ui
        ref: "node -e sobre out/onboarding/1/index.html — 5 rótulos presentes, 5 cartao-disposicao, 2 avisos de ausência"
        status: pass
    human_judgment: true
    rationale: "A persistência em localStorage só é observável com um navegador de verdade; o HTML exportado prova que os cartões existem, não que a escolha volta depois do reload."
  - id: D2
    description: "Descobrir renderiza cartões vindos de caminhada no grafo, cada um com um selo de motivo visível e não vazio"
    requirement: DESC-02
    verification:
      - kind: automated_ui
        ref: "node -e sobre out/descobrir/index.html — 12 data-motivo, 0 vazios"
        status: pass
      - kind: integration
        ref: "scripts/testar-caminhada.ts#4 motivo: 12 textos não vazios e ao menos 1 com origem «escrito»"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dois cartões do mesmo tipo nunca aparecem em sequência quando existe alternativa (D-27)"
    requirement: DESC-02
    verification:
      - kind: integration
        ref: "scripts/testar-caminhada.ts#1 rodízio: zero pares adjacentes de mesma classe, 8+ classes distintas"
        status: pass
    human_judgment: false
  - id: D4
    description: "A persona ativa lida de localStorage aparece na tela e trocar de persona é um toque, sem trocar de rota (D-45)"
    verification:
      - kind: integration
        ref: "scripts/testar-caminhada.ts#2 personalização: Maria e Carlos compartilham no máximo 3 dos 12 cartões"
        status: pass
    human_judgment: true
    rationale: "Que a troca seja instantânea e não navegue só se comprova clicando; o teste prova que os três feeds são diferentes, não que a troca é fluida."
  - id: D5
    description: "Um cartão sem imagem local mostra uma capa desenhada com a cor da linguagem, não um buraco"
    verification:
      - kind: automated_ui
        ref: "grep capa-sem-imagem e --cor-linguagem:var(--ic-*) em out/descobrir/index.html"
        status: pass
    human_judgment: true
    rationale: "«Não parece defeito» é juízo visual. A verificação prova que a cor vem do dado; se a composição funciona na projeção, só olhando."
  - id: D6
    description: "O motor devolve {cartoes, avisos, diagnostico} com serendipidade, destaque curado assinado, corte factual e reserva de salto 3"
    verification:
      - kind: integration
        ref: "scripts/testar-caminhada.ts — 9 de 9 asserções"
        status: pass
    human_judgment: false

duration: 78min
completed: 2026-08-22
status: complete
---

# Fase 2 Plano 01: Sessão, disposição, motor de caminhada e cartão — Summary

**A persona escolhida na entrada agora chega ao feed, e o feed é uma caminhada de 1 a 2 saltos no grafo real que produz 12 cartões heterogêneos, cada um com o texto da aresta que o trouxe e a procedência desse texto na própria tela.**

## Performance

- **Duration:** ~78 min
- **Tasks:** 3 de 3
- **Files modified:** 18 (12 criados, 6 alterados) · 2.322 linhas acrescentadas

## Os três números que o plano exigiu

| | Maria | Carlos | Joana |
|---|---|---|---|
| motivo **escrito no acervo** | 2/12 (17%) | 3/12 (25%) | 3/12 (25%) |
| motivo **composto a partir da relação** | 9/12 (75%) | 8/12 (67%) | 8/12 (67%) |
| motivo **fora da caminhada** (serendipidade) | 1/12 | 1/12 | 1/12 |
| **classes distintas cobertas** | 11 | 12 | 11 |
| candidatos a 1 salto / 2 saltos | 1.041 / 2.136 | 1.936 / 1.631 | 2.690 / 1.183 |

**Sobreposição Maria ∩ Carlos: 1 cartão em 12** — e o único compartilhado é a trilha curada,
que é destaque fixo de propósito. Maria ∩ Joana: 2 em 12. O teto do plano era 3.

**D-26, D-27 e D-45 cumpridos, não declarados:** o feed vem de caminhada (nenhum score, nenhuma
popularidade em lugar nenhum de `caminhada.ts`); cobre 11 ou 12 classes sem nenhum par adjacente
de mesma classe; e as três personas veem listas praticamente disjuntas.

**M-4 desfeito na prática.** Com desempate alfabético, «Ademar Manarini» era o primeiro cartão
de pessoa das três personas. Agora: Maria → *Adriana Rocha*, Carlos → *Ademar Manarini*,
Joana → *Bernadete Andrade*.

## Task Commits

1. **Task 1 (tracer): a fatia vertical** — `56fd8de` (feat)
2. **Task 2 RED: as nove asserções** — `8caf344` (test)
3. **Task 2 GREEN: o motor completo** — `64fbd9b` (feat)
4. **Task 3: o cartão e a capa sem imagem** — `df30ea8` (feat)

## Verificação — comandos e saída real

```
$ npx tsc --noEmit
(sem saída, código 0)

$ npm run build
BUILD=0

$ npm run testar-caminhada
  ok   1 rodízio: zero pares adjacentes de mesma classe, 8+ classes distintas
  ok   2 personalização: Maria e Carlos compartilham no máximo 3 dos 12 cartões
  ok   3 determinismo: montar duas vezes devolve a mesma lista, na mesma ordem
  ok   4 motivo: 12 textos não vazios e ao menos 1 com origem «escrito»
  ok   5 corte factual: com gratuidade ativa, todo evento tem sessão gratuita
  ok   6 peso invertido: «nunca vi» exclui as linguagens do repertório
  ok   7 serendipidade: exatamente 1 cartão, fora do alcance da caminhada
  ok   8 destaque curado: trilha alcançável ocupa a posição 0 e é assinada
  ok   9 salto 3 é reserva: só entra em classe sem candidato de 1 ou 2 saltos
  9 de 9 asserções passaram.

$ node -e "…out/descobrir/index.html + out/onboarding/1/index.html…"
OK 12 cartoes, 0 motivos vazios

$ (fronteira cliente/servidor)
arquivos com a diretiva 'use client': 9
violacoes de DP-F: nenhuma
$ du -sh out/_next/static/chunks
772K            ← os 23 MB de grafo não atravessaram
```

## Decisões tomadas

**A decisão travada foi implementada como recebida.** Nenhuma aresta `atua_em` foi autorada
para cruzar agentes com ocorrências datadas. A ausência é declarada em texto onde ela aparece,
e não escondida: os predicados de duração e faixa etária devolvem `indeterminado`, o motor emite
aviso legível, o cartão de disposição mostra o aviso já no onboarding, e Descobrir repete o aviso
no topo do feed para quem marcou aquelas disposições.

**`origemMotivo` ganhou um terceiro valor: `sem-aresta`.** O plano previa `"escrito" | "composto"`.
O cartão de serendipidade é escolhido FORA do alcance da caminhada por definição (D-30) — não há
aresta. Carimbá-lo de `composto` afirmaria que existe uma relação no grafo ligando aquele item ao
repertório, que é exatamente a mentira de procedência que D-28 e T-02-05 existem para impedir.
`switch` exaustivo sobre o tipo nos planos da onda 2 vai receber erro de compilação — falha visível,
que é a correta.

**`montarFeed` já devolve `{cartoes, avisos, diagnostico}` desde a Task 1.** O plano previa
`Cartao[]` na Task 1 e o objeto na Task 2, mas `descobrir/page.tsx` não está na fronteira da
Task 2 e trocar a assinatura lá quebraria o `tsc --noEmit` que a própria Task 2 verifica.

**Gratuidade corta evento sem sessão declarada gratuita.** Dos 300 eventos do grafo, 129 têm
ocorrência gerada e todos os 129 têm ao menos uma sessão gratuita; os outros 171 não têm sessão
nenhuma. Cortá-los não afirma que são pagos — afirma que não declaram gratuidade, e o filtro
pedido foi «quero algo de graça». Classe que não é evento devolve `indeterminado` e continua no
feed, que é o que mantém a heterogeneidade com o corte ligado.

**`espaco` recebeu link de entidade.** O plano listava `espaco` entre as classes sem rota. A fase 1
exporta `/produtor/[slug]` cobrindo `instituicao` **e** `espaco` (113 slugs). O cartão de espaço
aponta para lá. As classes que de fato não têm rota — `termo`, `conteudo`, `midia`, `formacao`,
`publicacao` — renderizam sem link principal, mantendo o link de explicação.

## Desvios do plano

### Corrigidos automaticamente

**1. [Rule 3 — Bloqueio] `disposicoes.ts` não pode importar `grafo.ts`**
- **Achado em:** Task 1
- **Problema:** o plano manda `disposicoes.ts` exportar os predicados de corte, e o predicado de
  gratuidade precisa de `ocorrenciasDe`. Mas `disposicoes.ts` é lido por `onboarding-disposicao.tsx`,
  que é `"use client"` — importar `grafo.ts` ali mandaria 23 MB de JSON ao navegador e violaria DP-F.
- **Correção:** o predicado recebe um `ContextoPredicado` injetado por `caminhada.ts`, que roda no
  build. `disposicoes.ts` importa só tipos.
- **Verificação:** `du -sh out/_next/static/chunks` → 772K.

**2. [Rule 3 — Bloqueio] `src/dados/personas.ts` criado**
- **Achado em:** Task 1
- **Problema:** o plano pede que `sessao.tsx` leia personas «de um módulo pequeno e não de
  `grafo.ts`», sem listar o arquivo em `files_modified`.
- **Correção:** módulo criado, com `personaIdValido()` que satisfaz T-02-02 — `personaId` vindo de
  `localStorage` é validado contra a lista antes de entrar no feed.

**3. [Rule 3 — Bloqueio] `src/componentes/feed-descobrir.tsx` criado**
- **Achado em:** Task 1
- **Problema:** o plano pede «um componente cliente mínimo» em Descobrir sem lhe dar arquivo.
- **Correção:** criado na Task 1 como impressão crua e substituído na Task 3 pelo `Cartao` real,
  a troca de persona e o diagnóstico da montagem.

**4. [Rule 1 — Bug de contraste] a textura da capa sumia em fundo claro**
- **Achado em:** Task 3, olhando o HTML exportado
- **Problema:** a primeira versão desenhava o grafismo em branco a 22%. Sobre `--ic-amarelo`
  (que é claro) a textura desaparecia e a capa virava um bloco de cor chapado — o «parece defeito»
  que M-6 manda evitar. Este arquivo não pode consultar a luminância do token: fazer isso seria a
  associação linguagem→cor que D-08 proíbe.
- **Correção:** duas camadas de textura deslocadas em 1px, uma clara e uma escura. Uma das duas
  sempre aparece, seja qual for o preenchimento, sem uma linha de código sobre cor.

**Total: 4 desvios auto-corrigidos** (3× Rule 3, 1× Rule 1). Nenhum aumenta escopo.

## O que não funcionou, e o que precisa de decisão

### 1. O critério «com imagem antes de sem imagem» inverte a premissa da Task 3

DP-D manda ordenar, dentro do balde, `com imagem local antes de sem imagem`. Mas M-6 e o
enunciado da Task 3 dizem que a capa sem imagem é «a textura visual dominante do feed», porque só
22% dos candidatos têm imagem. **As duas coisas não podem ser verdade ao mesmo tempo, e a
ordenação ganha.** Medido no feed montado:

| disposição | Maria | Carlos | Joana |
|---|---|---|---|
| nenhuma | 11/12 **com** imagem | 9/12 | 9/12 |
| «quero conhecer algo que nunca vi» | 8/12 | 7/12 | 4/12 |
| «quero ser surpreendida» | 7/12 | 6/12 | 5/12 |

No feed padrão da Maria a capa sem imagem aparece **uma vez em doze**, não nove. A capa foi
desenhada como se fosse a textura dominante e no estado de abertura ela é a exceção.

O dano é menor do que parece — a rotação de classe é fixa, então o critério não desequilibra
classes, só escolhe qual membro de cada classe aparece. Mas ele é, na prática, um filtro de beleza
sobre um ranqueamento que o resto do arquivo faz questão de manter honesto: privilegia
sistematicamente a parte do acervo que o IC digitalizou com foto (443 de 529 mídias têm imagem;
13 de 300 eventos têm).

**Mantive a regra como o plano a travou** e registro aqui em vez de contorná-la em silêncio.
A decisão de rebaixá-la (movê-la para depois do hash, ou removê-la) cabe ao 02-02, que é dono do
feed definitivo. Se ela for rebaixada, a proporção volta para perto dos 22% medidos e a capa passa
a ser o que a Task 3 supôs.

### 2. A reserva de salto 3 nunca dispara com as três personas do protótipo

`classesEmReserva` volta vazio para Maria, Carlos e Joana: as 12 classes da rotação sempre têm
candidato a 1 ou 2 saltos. Ou seja, **a asserção 9 passa por vacuidade** — ela verifica que
nenhum cartão de 3 saltos apareceu indevidamente, e nenhum cartão de 3 saltos aparece.

O caminho não é código morto: verifiquei-o com uma persona sintética de repertório estreitíssimo
(uma linguagem pequena, nenhuma entidade), e ele encontrou 15 candidatos de 3 saltos em 11 classes
que estavam vazias. Mas com o repertório real das três personas ele não é exercitado, e a asserção
não protege nada hoje. Fica registrado em `.planning/WINDOWS.md`.

### 3. O gate de cor do plano mede prosa, não código

A verificação da Task 3 termina com:

```
test $(grep -rlE '--ic-(lilas|azul|amarelo|rosa|verde|verde-agua)' src --include='*.tsx' --include='*.ts' | grep -v globals.css | wc -l) -eq 0
```

Saída real: **3** antes da minha correção, **2** depois. Os dois restantes são
`src/componentes/selo-linguagem.tsx:10` e `src/dados/tipos.ts:250` — **arquivos da fase 1, e as
duas ocorrências são comentários** que citam `"--ic-lilas"` como exemplo do que o vocabulário
emite. Ou seja, o gate como escrito já falhava contra a fase 1 no commit em que ela foi fechada;
ele não pode ser gate de regressão.

Removi a citação do comentário que eu havia escrito em `capa-sem-imagem.tsx`, para que este plano
não acrescente ocorrência nenhuma, e rodei a versão que mede o que o critério quer dizer —
o mesmo grep depois de tirar comentários de bloco e de linha:

```
arquivos com token de cor de apoio em CODIGO: 0 []
```

**Zero.** A cor da capa vem do dado. Recomendo que o 02-05, que é dono do gate de estrutura,
adote a versão que ignora comentários — a atual obrigaria a apagar a documentação do contrato
para passar, o que é o incentivo errado.

## Conhecidos que a onda 2 herda

- **O feed exibido usa `disposicoes: []`.** Remontar o feed a cada troca de disposição (D-32) é o
  02-02, que precisa prerenderizar as combinações. O que este plano não deixou passar em silêncio
  foi o aviso: quem marca «tenho pouco tempo» lê no topo de Descobrir que o acervo não declara
  duração, em vez de olhar uma lista idêntica e supor que o filtro rodou.
- **`/descobrir/porque/{classe}_{slug}/` e `/trilha/{slug}/` ainda não existem.** Os 12 links de
  explicação e o link da trilha saem de `cartao.tsx` e apontam para rotas que o 02-02 e o 02-03
  criam. São links para frente, e é isso que amarra os três planos.

## Próximo

`caminhada.ts` está pronto para os três planos da onda 2. O `diagnostico` de `montarFeed` traz
candidatos por salto, candidatos por classe, classes cobertas, classes em reserva e a contagem de
motivo escrito contra composto — que é o que a verificação da onda 3 vai ler. `Cartao` é o
contrato compartilhado; `PassoCartao[]` já carrega o caminho inteiro com o motivo de cada aresta,
que é exatamente o que a tela «Por que isto apareceu» renderiza.

---
*Phase: 02-camada-1-descoberta-e-a-ponte*
*Completed: 2026-08-22*

## Self-Check: PASSED

12 arquivos declarados como criados existem em disco; os 4 hashes de commit existem em `git log`.
