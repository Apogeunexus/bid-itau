---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 01
subsystem: ui
tags: [next, app-router, static-export, rsc, agenda, ocorrencia, localstorage]

requires:
  - phase: 01-fundacao-dado-e-casca
    provides: grafo.ts com ocorrenciasDe/porSlug/slugsPorTipo, vocabulário de linguagens, casca com data-view
  - phase: 02-camada-1-descoberta-e-a-ponte
    provides: lista-ocorrencias.tsx (vocabulário de data e frase de ausência de espaço), sessao.tsx com alternarSalvo, Comentario, CapaDeCartao, SelosDeLinguagem
provides:
  - "montarAgenda({hoje}) — índice de agenda no build com 129 eventos, 1.071 dias e as 4 ausências medidas"
  - "/acontece — a agenda como lista de EVENTOS com contagem de ocorrências (D-53), faixa de dias reais (D-55) e passado mostrado como passado (D-54)"
  - "/evento/[slug]/sessoes — 129 rotas de escolha de sessão, com salvamento por ocorrência (D-56)"
  - "gramática de hash de lente /mapa#r=…&t=…&v=… emitida pela primeira vez"
affects: [03-02 salvos e alertas, 03-03 mapa, 03-04 busca, 04 studio]

actuals:
  tokens: 20400
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "DTO de agenda montado no build com arrays paralelos (índice + hora) para caber no teto de bytes declarado"
    - "Ausência medida viaja no DTO como dado de primeira classe (campo, numerador, denominador, frase) e é renderizada como texto de produto"
    - "Recorte de tela espelhado no hash da própria rota (#dia=YYYY-MM-DD), validado contra a lista do DTO"
    - "Hash de lente de três chaves (r/t/v) para atravessar recorte entre telas sem query string"

key-files:
  created:
    - src/dados/agenda.ts
    - src/componentes/acontece.tsx
    - src/componentes/selecao-ocorrencia.tsx
    - src/estilos/agenda.css
    - src/app/(app)/evento/[slug]/sessoes/page.tsx
  modified:
    - src/app/(app)/acontece/page.tsx
    - src/app/(app)/evento/[slug]/page.tsx

key-decisions:
  - "Os dias guardam ÍNDICES para dentro de agenda.eventos, não slugs: os slugs deste acervo têm 71,8 caracteres em média e os 2.425 pares evento-dia custariam 172 KB só de referência, estourando o teto de 200 KB do próprio plano"
  - "O selo de gratuidade carrega a qualificação dentro do próprio selo, e não em nota de rodapé — é o texto que a foto do slide pega"
  - "A faixa exibe 23 dos 1.071 dias com o total declarado ao lado, e caminha por páginas; renderizar 1.071 chips inflaria o HTML sem tornar nada navegável"
  - "O atalho de lente usa <a> e não <Link>: trailingSlash:true faz o Link reescrever /mapa# como /mapa/#, e a gramática do hash é contrato de fase"
  - "A rota de sessões e o link para ela na página do evento são exatamente co-extensivos: 129 e 129, zero link morto e zero rota órfã"

patterns-established:
  - "Teto de exibição sempre acompanhado do total medido — 23 de 1.071 dias, 24 de 53 sessões"
  - "Frase de ausência reaproveitada literalmente entre telas para as duas não contarem histórias diferentes"

requirements-completed: [AGEN-01, AGEN-02]

coverage:
  - id: D1
    description: "montarAgenda devolve 129 eventos sem repetição, 1.071 dias todos com sessão, 166 sessões de hoje em diante, 4 ausências com denominador medido e DTO abaixo de 200 KB"
    requirement: AGEN-01
    verification:
      - kind: integration
        ref: "npx tsc --noEmit && npx tsx -e '<gate da task 1 do 03-01-PLAN.md>'"
        status: pass
    human_judgment: false
  - id: D2
    description: "/acontece exporta a faixa de dias com marcação de tempo, um cartão por evento com contagem de sessões, as 4 frases de ausência e o atalho de lente com r/t/v"
    requirement: AGEN-01
    verification:
      - kind: e2e
        ref: "npm run build && node -e '<gate da task 2 do 03-01-PLAN.md>' sobre out/acontece/index.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "129 rotas /evento/[slug]/sessoes exportadas e nenhuma a mais; toda sessão com id e marcação de tempo; controle de salvar por sessão; nenhum salvamento por evento no código"
    requirement: AGEN-02
    verification:
      - kind: e2e
        ref: "npm run build && node -e '<gate da task 3 do 03-01-PLAN.md>' sobre out/evento/*/sessoes/index.html"
        status: pass
    human_judgment: false
  - id: D4
    description: "A separação Evento/Ocorrência é sensível ao uso: salvar uma sessão marca aquela e nenhuma outra, e a confirmação nomeia a sessão pela data e hora"
    requirement: AGEN-02
    verification: []
    human_judgment: true
    rationale: "O salvamento vive em localStorage e a confirmação só aparece depois do clique; o HTML exportado prova que o controle existe e que o id é o da ocorrência, mas não que a leitura da confirmação convence — isso é julgamento de quem avalia a demonstração."

duration: 78min
completed: 2026-08-22
status: complete
---

# Phase 3 Plan 01: Acontece e Seleção de ocorrência — Summary

**A separação Evento/Ocorrência deixou de ser argumento de slide: `/acontece` mostra 129 eventos com a contagem de sessões no cartão sobre 1.071 dias reais do acervo, e 129 rotas `/evento/[slug]/sessoes` deixam salvar uma sessão específica dizendo, no ato, que o que ficou salvo é aquela ocorrência e não o evento.**

## Performance

- **Duration:** 78 min
- **Tasks:** 3 de 3
- **Files created:** 5 · **modified:** 2

## Accomplishments

- **`montarAgenda` mede em vez de estimar.** Os 15 números que o plano trazia como premissa foram reconfirmados no grafo em disco antes de uma linha de tela ser escrita, e todos bateram: 129 eventos com sessão, 2.425 ocorrências, 166 futuras contra 2.259 passadas, 1.071 dias de 2016-11-21 a 2026-10-03, `espacoId`/`preco` nulos em 2.425 de 2.425, `esgotado` falso em 2.425, acessibilidade variando em 0 de 129, máximo de 53 sessões num evento.
- **D-53 é estrutural, não disciplinar.** Os dias guardam índices para dentro de `agenda.eventos`, e o componente agrupa por índice antes de renderizar. Não existe caminho de código em que o mesmo evento produza dois cartões.
- **D-54 aparece sem pedir desculpa.** O dia passado lista todos os seus eventos, cada cartão marca «sessão às 11h00 — já aconteceu», e uma linha de produto diz por quê, com o número: 2.259 das 2.425 sessões são passadas, e escondê-las esvaziaria a agenda.
- **As quatro ausências viraram dado.** Cada uma viaja no DTO com `campo`, `numerador`, `denominador` e `frase` montada por interpolação do medido — nenhum número escrito à mão —, e aparece nas duas telas fora do modo comentado.
- **O contrato de hash de lente foi emitido.** `/mapa#r=…&t=…&v=…` sai de `/acontece` com os slugs do dia, o título legível e o endereço de volta com o próprio estado. Os planos 03-03 e 03-04 têm um exemplo real de 788 caracteres para consumir.

## Task Commits

1. **Task 1: agenda.ts — o índice da agenda no build** — `b7690fe` (feat), com `e8b9ec9` (feat) acrescentando a origem medida dos 171 eventos sem sessão
2. **Task 2: Acontece — a agenda como lista de eventos** — `5c4c4e8` (feat)
3. **Task 3: Seleção de ocorrência** — `770d401` (feat)

## Files Created/Modified

- `src/dados/agenda.ts` — `montarAgenda({hoje})`, executado no build; DTO com `dias`, `eventos`, `ausencias`, `janelaSugerida` e `diagnostico`. Exporta também `ROTULO_DIMENSAO`/`DIMENSOES` para a tradução das 8 dimensões acontecer do lado servidor.
- `src/componentes/acontece.tsx` — a tela de cliente; dona também dos formatadores de data e número que a seleção de ocorrência reaproveita, e do texto único do selo de gratuidade.
- `src/componentes/selecao-ocorrencia.tsx` — sessões agrupadas por dia, salvamento por ocorrência, confirmação nomeada.
- `src/estilos/agenda.css` — faixa de dias, cartão de agenda, bloco de ausência, linha de sessão, confirmação. `globals.css` não foi tocado.
- `src/app/(app)/acontece/page.tsx` — componente de servidor; substituiu o esqueleto.
- `src/app/(app)/evento/[slug]/sessoes/page.tsx` — rota nova; `generateStaticParams` filtra para os 129.
- `src/app/(app)/evento/[slug]/page.tsx` — **uma única alteração**, como o plano exigiu: a entrada para a rota de sessões, condicionada a `ocorrencias.length`.

## As três coisas que o plano mandou registrar

**1. O tamanho do DTO da agenda.** **191,7 KB** (196.290 bytes em `JSON.stringify`), contra o teto declarado de 200 KB — 3,8 KB de folga. A folga é pequena e é consequência direta da decisão de bytes descrita no desvio 1 abaixo; sem ela o DTO passaria de 360 KB.

**2. A frase exata do selo de gratuidade qualificado.** Ela é uma constante exportada (`SELO_GRATUIDADE`), usada nos cartões de Acontece e em cada linha de sessão:

> `gratuito — sem ingresso declarado na fonte`

A qualificação viaja **dentro** do selo, e não numa nota de rodapé, porque é o selo que aparece em quase todo cartão e é ele que a foto do slide pega. O bloco de ausências repete o raciocínio inteiro com o número: `0 dos 300 eventos do acervo declaram ingresso`. Um selo escrito só «gratuito» afirmaria entrada franca sobre eventos reais — a mesma classe de defeito que D-48 proíbe no eixo da data (T-03-01).

**3. A frase de ausência de espaço foi REAPROVEITADA, literalmente, e há uma ressalva.** A frase da fase 2 em `lista-ocorrencias.tsx` é:

> «O acervo do Itaú Cultural não publica o espaço desta sessão. O evento declara período, não endereço de cada data.»

Em `selecao-ocorrencia.tsx` ela aparece **palavra por palavra**, no mesmo lugar da tela (por sessão, quando não há espaço). No bloco de ausências de `agenda.ts` ela aparece com a mesma abertura e o número medido acrescentado, mais a consequência que o plano pediu que fosse declarada em vez de virar gaveta vazia: «…e o campo vem vazio em 2.425 das 2.425 sessões. É por isso que esta agenda não mostra distância nem tempo até o lugar: sem espaço na sessão, qualquer distância seria inventada.»

**A ressalva:** isto é reaproveitamento de *texto*, não de *código*. `lista-ocorrencias.tsx` mantém a frase embutida no JSX e é somente leitura para este plano; não havia como importá-la, e exportá-la de lá teria sido escrever fora da fronteira declarada. São hoje duas cópias literais da mesma frase, em `lista-ocorrencias.tsx` e em `selecao-ocorrencia.tsx`, mais a variante com número em `agenda.ts`. **Elas podem divergir na primeira correção** — é o risco exato que o plano apontou, e ele não foi eliminado, só documentado. A saída, quando algum plano futuro puder tocar `lista-ocorrencias.tsx`, é extrair a frase para uma constante compartilhada do lado cliente.

## Deviations from Plan

### 1. [Rule 3 — Blocking] Os dias guardam índices de evento, não a «lista de slugs» que o plano pediu

- **Found during:** Task 1
- **Issue:** O plano pede, no mesmo parágrafo, que cada dia carregue «a lista de slugs de evento daquele dia» e que o DTO inteiro fique abaixo de 200 KB. Neste acervo as duas exigências são incompatíveis: medi os slugs de evento antes de escrever o arquivo e eles têm **71,8 caracteres em média**; os 2.425 pares evento-dia custariam **172 KB só de referência**, antes dos 1.071 dias, dos 129 eventos e das ausências. O DTO passaria de 360 KB.
- **Fix:** `dias[i].eventos` guarda o **índice** em `agenda.eventos` (≈4 caracteres) e `dias[i].horas` guarda o `HH:MM` da sessão, em arrays paralelos de mesmo tamanho. O slug continua acessível — a um salto de índice — e a tela resolve para o mesmo objeto. Medi antes que isto fosse seguro: existe exatamente **uma sessão por par evento-dia** neste acervo (2.425 pares para 2.425 sessões), então a hora nunca é ambígua. Mesmo assim o componente **agrupa por índice antes de renderizar**, de modo que um segundo horário no mesmo dia produziria um cartão com duas horas, e nunca dois cartões — D-53 continua garantido pela estrutura e não pelo dado.
- **Files modified:** `src/dados/agenda.ts`
- **Verification:** gate da Task 1 — `DTO 191,7KB`, abaixo do teto; `1071 dias`, nenhum vazio.
- **Committed in:** `b7690fe`

### 2. [Rule 2 — Missing critical] `agenda.ts` passou a medir a origem dos 171 eventos sem sessão

- **Found during:** Task 2
- **Issue:** A linha de enquadramento que o plano especifica cita «os outros 160 vêm da Enciclopédia». Escrever `160` como literal na tela seria justamente o tipo de número não medido que esta fase inteira existe para não produzir — e ele silenciosamente mentiria se o acervo mudasse.
- **Fix:** `diagnostico` ganhou `eventosSemSessaoDaEnciclopedia` e `eventosSemSessaoDoCms`, varridos pelo prefixo do id (que é contrato do formato `{classe}:{origem}:{idOrigem}`). Medido: **160 da Enciclopédia e 11 do CMS**, batendo com o plano. A tela interpola os dois.
- **Files modified:** `src/dados/agenda.ts`, `src/componentes/acontece.tsx`
- **Verification:** texto exportado — «Os outros 171 — 160 da Enciclopédia Itaú Cultural e 11 da agenda, sem período declarado».
- **Committed in:** `e8b9ec9`

### 3. [Rule 3 — Blocking] `<a>` em vez de `<Link>` no atalho de lente

- **Found during:** Task 2
- **Issue:** `next.config.ts` tem `trailingSlash: true`, e o `<Link>` normaliza o href para `/mapa/#…`. A gramática do hash é contrato escrito igual em três planos desta fase, e o gate exige literalmente `/mapa#`.
- **Fix:** âncora HTML pura para este único link. O fragmento sobrevive ao redirecionamento de barra final porque fragmento nunca é enviado ao servidor.
- **Files modified:** `src/componentes/acontece.tsx`
- **Verification:** href real exportado, 788 caracteres, começando em `/mapa#r=evento_exposicao-apresenta-obras-de-solange-pessoa~…`.
- **Committed in:** `5c4c4e8`

### 4. [Rule 3 — Blocking] `ROTULO_DIMENSAO` duplicado a partir de `ficha-acessibilidade.tsx`

- **Found during:** Task 1
- **Issue:** As frases de ausência e a linha de acessibilidade por sessão precisam dos rótulos das 8 dimensões. O mapa existe em `ficha-acessibilidade.tsx`, privado, e aquele arquivo é somente leitura para este plano.
- **Fix:** `Record<DimensaoAcessibilidade, string>` completo em `agenda.ts`, exportado, para a tradução acontecer uma vez só do lado servidor em vez de uma terceira vez no cliente. Sendo `Record` completo, acrescentar dimensão em `tipos.ts` sem escrever o rótulo vira erro de compilação nos dois lugares.
- **Files modified:** `src/dados/agenda.ts`
- **Verification:** `npx tsc --noEmit` limpo; texto exportado — «só Libras (122 de 2.425) aparece em alguma sessão».
- **Committed in:** `b7690fe`, exportado em `770d401`

---

**Total deviations:** 4 auto-fixed (3× Rule 3, 1× Rule 2)
**Impact on plan:** Nenhuma amplia escopo. Três são consequências medidas do acervo ou da configuração do projeto que o plano não podia conhecer sem medir; a quarta troca um literal por uma medição. Nenhum arquivo fora de `files_modified` foi tocado.

## Issues Encountered

### O erro caro: um `git commit --amend` reescreveu o commit de outro executor

Quatro planos rodam em paralelo **no mesmo repositório**, com um só `HEAD`. Entre o meu commit da Task 1 (`b7690fe`) e um `--amend` que eu quis usar para acrescentar dois campos medidos, o executor do 03-02 commitou `997158a`. O `--amend` foi aplicado sobre o `HEAD` deles: dobrou a minha alteração de `agenda.ts` dentro do commit `feat(03-02): /salvos …` e reescreveu o hash para `14278fe`.

**Reparo, sem perder nada:** `git reset --soft 997158a`. Isso devolveu o commit do 03-02 com o **hash original** e a **árvore original** — verificado: `997158a` voltou a listar só os seus 4 arquivos e nenhuma linha de `agenda.ts` — e deixou a minha alteração como mudança em stage, que virou o commit próprio `e8b9ec9`. `--soft` de propósito: `--hard` teria mexido na árvore de trabalho, onde outros dois executores tinham arquivos não rastreados em andamento (`indice.ts`, `contorno-brasil.ts`, `busca.css`). Nenhum arquivo de ninguém foi perdido e a ordem final da história é `b7690fe → 997158a → e8b9ec9`.

**A lição, e ela vale para os outros planos desta onda:** com executores concorrentes num repositório compartilhado, `git commit --amend` é inseguro por construção, porque opera sobre um `HEAD` que pode ter mudado desde o último comando. Não usei `--amend` de novo depois disso, e não deveria ter usado da primeira vez.

### `grep` silencioso em arquivo do iCloud

`scripts/gerar-grafo.mjs` estava como placeholder do iCloud: `wc -c` dizia 94.079 bytes e o `grep` não devolvia linha nenhuma, sem erro. `brctl download` resolveu, mas o `grep` continuou mudo até rodar com `-a` — o arquivo é tratado como binário por causa dos acentos UTF-8 em `LC_ALL=C`. Registro porque o sintoma «grep vazio» é indistinguível de «não existe» e custou duas rodadas.

## Divergências entre o plano e o acervo, medidas

Nenhuma das premissas numéricas do plano divergiu. Duas observações que o plano não previu e que não mudam nada do que foi construído:

- **Os 129 eventos da agenda têm imagem local — todos.** O plano previa `CapaSemImagem` como «a regra e não a exceção» nesta tela, a partir da cobertura global de 146 em 300. Medido no recorte que a agenda usa, a cobertura é **129 de 129**: os eventos com sessão datada são do CMS, e é o CMS que tem imagem. `CapaDeCartao` continua caindo para `CapaSemImagem` sozinha, então o estado segue implementado e correto — ele simplesmente não é exercitado por esta tela neste acervo. Quem for verificar a capa sem imagem precisa fazê-lo em Descobrir, não aqui.
- **A hora sai como `11h00` e não `11h`.** O plano cita o vocabulário da fase 2 como «a próxima sábado, 20h», mas o formatador que a fase 2 realmente embarcou faz `hora.replace(":", "h")` sobre `"20:00"` e produz `20h00`. Segui o comportamento embarcado, e não a citação, para as duas telas escreverem a mesma coisa — divergir aqui criaria exatamente a inconsistência de vocabulário que o plano pediu para evitar.

## Verification Evidence

Todos os comandos abaixo rodaram no repositório, com a saída transcrita literalmente.

**1. `npx tsc --noEmit`** — sem saída, código 0.

**2. Gate da Task 1** (`npx tsc --noEmit && npx tsx -e "…"`):

```
GATE 1 OK · 129 eventos · 1071 dias · 166 sessoes de hoje em diante · DTO 191.7KB (196290 bytes)
```

**3. Gate da Task 2** (`npm run build && node -e "…"` sobre `out/acontece/index.html`):

```
OK acontece · 23 dias na faixa · 9 cartoes de evento · 4 ausencias · lente com r/t/v
```

**4. Gate da Task 3** (`npm run build && node -e "…"` sobre `out/evento/*/sessoes/index.html`):

```
OK selecao de ocorrencia · 129 rotas · 1299 sessoes marcadas no DOM exportado
```

(1.299 e não 2.425 porque o teto de exibição de 24 sessões por página é aplicado no build, com o total sempre declarado ao lado — T-03-05.)

**5. Rota e link exatamente co-extensivos** (checagem própria, além dos gates do plano):

```
{"paginasDeEvento":300,"comRotaDeSessoes":129,"comLinkParaSessoes":129,
 "linkParaRotaInexistente":0,"rotaSemLinkNaPagina":0}
```

**6. DP-F, medido sobre TODA a fonte de cliente do projeto sem comentários:**

```
DP-F ok — nenhum arquivo de cliente alcanca o grafo
```

**7. `src/app/globals.css` não aparece no diff deste plano** — `git diff --name-only b7690fe~1..HEAD -- src/app/globals.css` devolveu vazio.

**8. Valores realmente presentes no HTML exportado de `/acontece`:**

```
selo gratuidade no HTML: 9 ocorrencias
data-tempo valores: ["passado","hoje","futuro"]
data-ausencia valores: ["espaco","preco","lotacao","acessibilidade"]
tamanho out/acontece/index.html: 264KB
```

## Known Stubs

Nenhum. Não há valor de reserva, texto de espera nem componente sem fonte de dado nas telas deste plano — as quatro ausências são declaradas com número medido, que é o oposto de um stub.

## Threat Flags

Nenhuma superfície nova além do registro do plano. As seis linhas de `<threat_model>` foram tratadas: `T-03-01` no selo qualificado, `T-03-02` na validação do `#dia=` contra a lista de dias do DTO, `T-03-03` na validação do id de ocorrência contra as sessões da tela antes de `alternarSalvo`, `T-03-04` na data de referência por prop nos dois componentes, `T-03-05` no teto de 24 sessões, `T-03-06` sem pacote novo instalado.

## Self-Check: PASSED

Arquivos declarados como criados, conferidos em disco: `src/dados/agenda.ts`, `src/componentes/acontece.tsx`, `src/componentes/selecao-ocorrencia.tsx`, `src/estilos/agenda.css`, `src/app/(app)/evento/[slug]/sessoes/page.tsx` — todos presentes.
Commits declarados, conferidos em `git log`: `b7690fe`, `e8b9ec9`, `5c4c4e8`, `770d401` — todos presentes e alcançáveis a partir de `HEAD`.
