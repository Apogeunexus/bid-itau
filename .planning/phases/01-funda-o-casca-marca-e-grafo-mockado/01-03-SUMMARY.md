---
phase: 01-funda-o-casca-marca-e-grafo-mockado
plan: 03
subsystem: casca
status: complete
tags: [marca, tipografia, grafismo, rotas, navegacao, duas-visoes, export-estatico]

requires:
  - "01-01 — casca, contexto de visão, variantes app:/desk: e as 9 assinaturas de grafo.ts"
  - "01-02 — vocabulario.json com `cor` como nome de token, slugsPorTipo populado nas 19 classes"
provides:
  - "src/app/globals.css — os 12 tokens de cor do manual, os 2 de tipografia e a moldura com altura"
  - "src/componentes/grafismo.tsx — o `\\` nas três variações, em currentColor"
  - "src/componentes/barra-abas.tsx — as 5 abas de D-13, um componente para as duas visões"
  - "src/componentes/selo-linguagem.tsx — consome `cor` do vocabulário e indexa o vocabulário por id"
  - "src/componentes/esqueleto.tsx — primitivas de esqueleto e a casca TelaEsqueleto"
  - "src/componentes/tela-entidade.tsx — casca comum das 4 rotas de entidade"
  - "as 18 rotas de D-12, exportadas em 1.720 diretórios"
affects:
  - "fases 2 a 6 constroem as 36 telas dentro destas rotas e destes tokens"
  - "toda tela mobile herda a moldura com altura + barra sticky decidida aqui"
  - "fase 3 herda a lacuna território × data registrada por 01-02 (ver nota ao fim)"

tech-stack:
  added: []
  patterns:
    - "moldura de celular com altura definida e rolagem interna; barra de abas em sticky, nunca presa à janela"
    - "divergência de ordem entre as visões por `order` no mesmo componente, em vez de dois JSX"
    - "cor vinda de dado aplicada por custom property inline lida por utilitário arbitrário, sem safelist"
    - "regra tipográfica do manual como camada base (corpo/h1..h4), não como disciplina de quem escreve a tela"
    - "reserva `sem-entidade` em generateStaticParams: a rota existe mesmo se a classe esvaziar"
    - "bastidor divergindo por app:/desk: em vez de ramo em JS — o conteúdo sai no artefato estático"

key-files:
  created:
    - src/componentes/grafismo.tsx
    - src/componentes/selo-linguagem.tsx
    - src/componentes/esqueleto.tsx
    - src/componentes/barra-abas.tsx
    - src/componentes/tela-entidade.tsx
    - src/componentes/selecao-persona.tsx
    - src/componentes/aviso-desktop.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/descobrir/page.tsx
    - src/app/(app)/acontece/page.tsx
    - src/app/(app)/play/page.tsx
    - src/app/(app)/buscar/page.tsx
    - src/app/(app)/meu/page.tsx
    - src/app/(app)/mapa/page.tsx
    - src/app/(app)/evento/[slug]/page.tsx
    - src/app/(app)/artista/[slug]/page.tsx
    - src/app/(app)/obra/[slug]/page.tsx
    - src/app/(app)/produtor/[slug]/page.tsx
    - src/app/entrar/page.tsx
    - src/app/onboarding/[passo]/page.tsx
    - src/app/(bastidor)/layout.tsx
    - src/app/(bastidor)/studio/duplicatas/page.tsx
    - src/app/(bastidor)/studio/ocorrencias/page.tsx
    - src/app/(bastidor)/studio/publicar/page.tsx
    - src/app/(bastidor)/redacao/fila/page.tsx
    - src/app/(bastidor)/redacao/trilha/page.tsx
    - src/app/(bastidor)/observatorio/page.tsx
  modified:
    - src/app/globals.css
    - src/app/page.tsx
    - src/componentes/casca.tsx
    - .gitignore

decisions:
  - "moldura de celular ganha altura min(844px, calc(100vh - 4rem)) e vira o contêiner de rolagem; a barra de abas usa sticky bottom-0 dentro dela"
  - "a ordem da barra entre as visões troca por `order` (app:order-2 / desk:order-1), não por dois componentes"
  - "os 9 tokens do IC são declarados mesmo com o gerador usando 7 — declarar o universo emitível fecha o contrato de D-08 hoje e amanhã"
  - "reserva `sem-entidade` mantida nas 4 rotas de entidade mesmo com todas as classes populadas: custa 1 linha e impede a rota de sumir se uma classe esvaziar"
  - "bastidor diverge por app:hidden/desk:hidden em vez de ramo em JS, para o conteúdo sair no HTML exportado sem depender de hidratação"
  - "o aviso de bastidor nomeia a superfície (Studio/Redação/Observatório) derivando de usePathname"

metrics:
  duration: "~30 min"
  completed: 2026-08-22
  commits: 5
  tasks: 4

actuals:
  tokens: 16000
  tasks: 4
  commits: 5
---

# Phase 1 Plan 03: Marca, grafismo e as 18 rotas · Summary

A casca ganhou a cara do Itaú Cultural e o corpo do produto: a paleta inteira do manual como
token, a tipografia com a regra de tamanho embutida na camada base, o grafismo `\` em três
variações, e as 18 rotas de D-12 navegando em esqueleto com as 5 abas de D-13 funcionando nas
duas visões — a barra contida dentro da moldura de celular, que é o defeito que o plano
apontou como o mais provável da fase e que **não** ocorreu.

FUND-03 e FUND-04 fechados. A fase 1 está completa.

## O que foi construído

### Task 1 — a marca (`5911612`)

**Paleta (D-07).** Os 12 tokens do manual em `:root`, expostos ao Tailwind por `@theme`:
as 3 principais que já existiam, as 6 de apoio do Itaú Cultural e as 3 da chancela Fundação
Itaú. `globals.css` é a fonte de verdade única dos hex — a varredura confirma 0 ocorrências
de qualquer hex do manual em arquivo `.ts` ou `.tsx`.

**Tipografia (D-09, D-10).** `--fonte-texto` e `--fonte-display`, com as reais nomeadas
primeiro e Myriad/Arial como substitutas que o próprio manual prevê. A regra de tamanho virou
comportamento e não convenção: uma camada base aplica `--fonte-texto` a 16px no corpo e
`--fonte-display` em `h1..h4`, então a próxima tela cumpre o manual por padrão. O utilitário
`font-display` existe como saída explícita fora dos títulos.

**Grafismo (D-11).** SVG inline em `currentColor` com as três variações selecionadas por
prop: `barra` (`\`), `completo` (`\C`) e `espacado`. Mais `TituloComGrafismo`, que fixa o
espaçamento do uso canônico para as fases seguintes não o reinventarem.

**Selo de linguagem (D-08).** Recebe a linguagem, escreve `--cor-linguagem` inline e deixa os
utilitários lerem `var(--cor-linguagem)`. O componente não conhece nenhuma linguagem pelo
nome; se `cor` vier vazia, cai para `--ic-preto` em vez de sumir.

**Esqueleto.** `EsqueletoLinha`, `EsqueletoBloco`, `EsqueletoCartao`, `EsqueletoLista` e a
casca `TelaEsqueleto`, que padroniza nome da tela + objetivo + camada de corte + o `\` no
título. As 18 rotas usam isso; nenhuma improvisou uma `div`.

### Task 2 — as abas e a moldura (`a32dcd1`)

As 5 abas de D-13 num componente só, as 6 telas do grupo `(app)`, e `/` virando redirect.

### Task 3 — as 12 rotas restantes (`a53c8e6`)

`/entrar` com as 3 personas reais do grafo e o rótulo de mock exigido por D-25 na própria
tela; `/onboarding/[passo]` com os 3 passos e saída sempre disponível (D-19 — Camada 3 nunca
barra Camada 1); as 4 rotas de entidade; e as 6 superfícies de bastidor sem barra de abas.

### Task 4 — servidor de desenvolvimento

`npm run dev` no ar na porta 3000 (a porta padrão estava livre, o Next não precisou trocar).

## Como a moldura passou a conter a barra — o registro obrigatório

Esta é a decisão que toda tela mobile das fases 2 a 6 vai herdar.

**O problema.** Uma barra inferior com `position: fixed` se ancora na *janela*, não no
telefone desenhado. Dentro da moldura de 390px ela escaparia para os 1440px da janela, e a
ilusão que D-03 existe para criar morreria na primeira tela.

**A solução, em duas metades que só funcionam juntas:**

1. **A moldura virou o contêiner de rolagem.** Em `globals.css`, `[data-view="mobile"]
   .moldura` ganhou `height: min(844px, calc(100vh - 4rem))` — 390×844 é o tamanho lógico de
   um iPhone 14/15 — mais `overflow-y: auto` e `overscroll-behavior: contain`. Quem rola é o
   telefone, não a página.
2. **A barra usa `sticky`, nunca ancoragem à janela.** `app:bottom-0` na visão app e
   `desk:top-0` na web. `sticky` se resolve contra o contêiner de rolagem mais próximo, que
   agora é a moldura — por construção a barra não tem como escapar dela.

A ordem visual troca por `order` no mesmo componente (`app:order-2` na barra e `app:order-1`
no `<main>`, invertidos com `desk:`), e o `(app)/layout.tsx` amarra a coluna à altura da
moldura com `min-h-full`. **Nenhum componente irmão por visão foi criado** (D-05).

A media query de 430px continua sendo a única do projeto e passa a altura para `100dvh`, para
que num celular real a moldura não vire moldura dentro de moldura. O alternador continua
`fixed` — ele é deliberadamente externo ao conteúdo (D-04) e deve mesmo se ancorar na janela;
só sobe 5.5rem nessa media query para não cair em cima da barra quando a moldura ocupa a tela.

**Medido no navegador**, viewport 1440×960, visão app:

| | x | y | largura | altura | direita | base |
|---|---|---|---|---|---|---|
| moldura | 525 | 32 | 390 | 809 | 915 | 841 |
| barra | 535 | 771,5 | **370** | 59,5 | 905 | 831 |

370px de barra contra 1440px de janela; folga de exatamente 10px em cada lado e no pé, que é a
borda do telefone. `position: sticky`, `bottom: 0px`. Depois de rolar a moldura até o fim
(`scrollTop=450` de 1239px de conteúdo em 789px de tela) a barra continua no pé, em `830,5`
contra a base `841` da moldura.

## A reserva `sem-entidade` ao fim da execução — o segundo registro obrigatório

**Ela não aparece em nenhuma rota de entidade.** As quatro classes estão populadas e o
parâmetro de reserva nunca foi emitido:

| rota | classes | páginas exportadas | reserva emitida |
|---|---|---|---|
| `/evento/[slug]` | evento | 300 | não |
| `/artista/[slug]` | pessoa + coletivo | 792 | não |
| `/obra/[slug]` | obra | 239 | não |
| `/produtor/[slug]` | instituicao + espaco | 359 | não |

1.690 páginas de entidade, 0 diretório `sem-entidade` em `out/`. **A fase seguinte não precisa
tratar nenhuma classe como vazia.**

Mantive a reserva no código mesmo assim, e a decisão é deliberada: custa uma linha por rota
(`slugs.length ? slugs : ["sem-entidade"]`) e nenhum byte no artefato quando há entidade. O
que ela compra é que uma rota nunca *desapareça* se uma classe esvaziar numa regeração —
falha silenciosa e intermitente é a pior de todas, e o gate do plano a exige em `obra`.
Verifiquei que as uniões não colidem: 792 e 359 slugs, 0 duplicados, então
`generateStaticParams` não emite parâmetro repetido.

## Verificação executada

Todos os comandos abaixo foram rodados de verdade; a saída é real.

```
$ npm run build
   codigo 0 · 1.720 diretorios em out/
   /evento/[slug] -> 300 paginas   /artista/[slug] -> 792 paginas
   /obra/[slug]   -> 239 paginas   /produtor/[slug] -> 359 paginas
   as 18 rotas de D-12 estao exportadas

$ npm run smoke
   codigo 0 · OK: cadeia do Cenário 1 percorrida em 2 saltos, com motivo em cada aresta.

$ node -e "<contrato D-08>"
   33 linguagens, 7 tokens distintos, 0 sem declaracao
   linguagens sem cor: 0

$ grep -rniE '#(ff7800|7f3e98|30c5f4|f9df4d|e04b9b|a6ce39|69c4a4|0c2d78|ec7000|4dafff)' src/ --include='*.tsx' --include='*.ts' | wc -l
   0
$ grep -rniE '(teatro|musica|danca|cinema|literatura)\s*[:=]\s*"?--ic-' src/ | wc -l
   0     # nenhum mapa linguagem->cor em CSS ou TS

$ node -e "<abas>"
   abas: /descobrir /acontece /play /buscar /meu | total 5   (Mapa ausente)
   irmaos por visao: 0 · 'fixed' fora de comentario na barra: 0 · bastidor com barra: 0
```

### Conferência visual dirigida em Chrome headless via CDP

Sobre o `out/` estático servido em `localhost:4321`, viewport **1440×960** — largo de
propósito, para que nenhuma media query participe. **Zero erros e zero avisos de console em
toda a sessão.**

**A raiz.** Abrir `/` terminou em `/descobrir/`.

**O alternador, cinco etapas:**

| passo | `data-view` | `localStorage` | moldura | borda | raio | y da barra | largura da barra | order |
|---|---|---|---|---|---|---|---|---|
| carga inicial | mobile | mobile | 390px | 10px | 40px | 772 | 370 | 2 |
| clique em Web | web | web | 1152px | 0px | 0px | 0 | 1152 | 1 |
| recarregar | web | web | 1152px | 0px | 0px | 0 | 1152 | 1 |
| clique em App | mobile | mobile | 390px | 10px | 40px | 772 | 370 | 2 |
| recarregar | mobile | mobile | 390px | 10px | 40px | 772 | 370 | 2 |

A visão sobreviveu aos dois recarregamentos. Na visão web, rolar a janela 266px manteve a
barra em `y=0` — ela gruda no topo, como a barra superior deve.

**A marca.** `--ic-laranja` resolve para `#ff7800` e a aba ativa pinta em `rgb(255, 120, 0)`.
Fundo do corpo `rgb(255,255,255)`. As 6 de apoio e as 3 da chancela resolvem com os hex do
manual. Corpo em `"Itaú Text", …, Myriad, Arial` a 16px; `h1` e `h2` em `"Itaú Display", …`.
7 grafismos marcando seção dentro da moldura.

**Os selos, com a cor vinda do dado** — a cadeia `vocabulario.json.cor` → custom property →
pixel, medida em `getComputedStyle`:

```
literatura     ponto=rgb(249, 223, 77)     música       ponto=rgb(224, 75, 155)
audiovisual    ponto=rgb(255, 120, 0)      cinema       ponto=rgb(105, 196, 164)
artes visuais  ponto=rgb(48, 197, 244)     teatro       ponto=rgb(127, 62, 152)
documentário   ponto=rgb(48, 197, 244)     pesquisa     ponto=rgb(127, 62, 152)
fotografia     ponto=rgb(224, 75, 155)     oficinas     ponto=rgb(166, 206, 57)
```

7 cores distintas resolvidas, nenhuma transparente — nenhum token caiu no vazio.

**As 5 abas, clicadas uma a uma:**

```
Descobrir  -> /descobrir/   h1="Descobrir"        aria-current=/descobrir/
Acontece   -> /acontece/    h1="Acontece"         aria-current=/acontece/
Play       -> /play/        h1="Play"             aria-current=/play/
Buscar     -> /buscar/      h1="Buscar"           aria-current=/buscar/
Meu        -> /meu/         h1="Meu Repertório"   aria-current=/meu/
```

**Mapa (D-14).** Não está na barra. O atalho visível existe em Acontece e em Buscar; clicá-lo
levou a `/mapa/` com `h1="Mapa"` e **nenhuma** aba marcada como ativa — que é exatamente o que
"lente, não destino" quer dizer na interface.

**Bastidor na visão app.** `/studio/duplicatas` → "Studio é superfície de desktop";
`/redacao/fila` → "Redação…"; `/observatorio` → "Observatório…". Cada um com o botão de troca;
um clique levou a `data-view=web` com o `h1` da superfície visível. Nenhuma tela branca,
nenhuma barra de abas.

**Entrada e entidade.** `/entrar` lista Maria, Carlos e Joana com o rótulo de mock na tela e
sem barra de abas; escolher a persona gravou `pessoa-usuaria:autorado:maria` e levou a
`/onboarding/1/`. `/artista/adriana-varejao/` renderizou dado real — "Adriana Varejão",
`pessoa · procedência ic`, selo "artes visuais" e link para
`enciclopedia.itaucultural.org.br/pessoas/5282-adriana-varejao`.

## Deviations from Plan

### 1. [Rule 3 — Bloqueio] O gate da Task 4 não considera `trailingSlash: true`

- **Encontrado em:** Task 4
- **Situação:** o gate é `curl -sf … http://localhost:3000/descobrir | grep -q 200`. Com
  `trailingSlash: true` no `next.config.ts` (D-24, vindo de 01-01), `/descobrir` responde
  **308** para a URL canônica `/descobrir/`. O gate falha sobre um app correto.
- **Correção:** verifiquei a intenção — "a rota responde 200" — seguindo o redirecionamento:
  `curl -sfL` devolve `codigo final=200, saltos=1, url final=http://localhost:3000/descobrir/`,
  e `GET /descobrir/` direto devolve 200.
- **Nada foi alterado no código.** É defeito do gate, não do app, e as fases seguintes devem
  usar a URL com barra final ao testar rota.

### 2. [Rule 1 — Bug] O gate de componentes irmãos era disparado pelo próprio comentário que os proíbe

- **Encontrado em:** Task 2
- **Situação:** `grep -rcE 'BarraAbas(Mobile|Web)' src/` acusava 1 ocorrência. Não havia
  componente irmão nenhum — o que casava era a linha de comentário do meu próprio arquivo,
  "é proibido criar irmãos `BarraAbasMobile` e `BarraAbasWeb`".
- **Correção:** reescrevi o comentário sem os identificadores literais ("um componente irmão
  por visão — um para o app, outro para a web"). A proibição continua escrita e legível, e o
  gate volta a medir a realidade em vez do aviso sobre ela.
- **Commit:** `a32dcd1`

### 3. [Rule 2] O aviso de bastidor não dizia qual superfície a pessoa abriu

- **Encontrado em:** conferência visual, depois da Task 3
- **Situação:** o layout do grupo não sabe qual rota filha está montada, então o aviso saía
  genérico ("Bastidor é superfície de desktop"). O plano pede aviso de que **aquela**
  superfície é de desktop, e quem clica precisa saber o que vai encontrar depois de trocar.
- **Correção:** `AvisoDesktop` deriva o nome de `usePathname()` — Studio, Redação ou
  Observatório.
- **Commit:** `9c1f97f`

### 4. [Fora da fronteira, autorizado no despacho] `.gitignore` ganhou `tsconfig.tsbuildinfo`

- O plano lista `.gitignore` como intocável, mas 01-02 registrou a falta e o despacho desta
  execução atribuiu o arquivo a este plano explicitamente. Commit separado, `7aa2347`.

### 5. [Cosmético] Três componentes a mais do que o plano nomeia

`tela-entidade.tsx`, `selecao-persona.tsx` e `aviso-desktop.tsx`, todos dentro de
`src/componentes/**`, que é fronteira deste plano. O primeiro evita repetir a mesma casca em 4
rotas de entidade; os outros dois isolam a única interatividade de cliente de `/entrar` e do
bastidor, mantendo as páginas como componentes de servidor.

## Threat Flags

Nenhuma superfície nova além das previstas em `<threat_model>`. T-03-01 continua mitigado: as
18 rotas renderizam apenas nós de texto, que o React escapa por construção — nenhum
`dangerouslySetInnerHTML` foi introduzido. O único `href` externo é `entidade.fonte`, vinda do
acervo, renderizada como link com `rel="noreferrer"`.

## Known Stubs

**As 18 rotas estão em estado de esqueleto, e isso é o entregável desta fase, não um stub
acidental** — o plano e o CONTEXT.md dizem explicitamente que nenhuma tela de conteúdo é
entregue na fase 1. Cada rota declara em texto o nome da tela, o objetivo tirado de
`docs/telas.md` e a camada de corte, e o miolo é primitiva de esqueleto rotulada com o que
virá ali. As fases 2 a 6 substituem o miolo.

Dois stubs de verdade, no sentido de "dado que existe mas ainda não foi ligado":

| Item | Arquivo | Resolvido em |
|---|---|---|
| `/entrar` grava a persona em `localStorage` mas nada a lê ainda | `src/componentes/selecao-persona.tsx` | fase 2 (Descobrir personalizado) |
| as 4 rotas de entidade mostram título/procedência/linguagens, mas não percorrem o grafo | `src/componentes/tela-entidade.tsx` | fases 2 e 3 |

## O que não funcionou

### 1. O checkpoint de conferência humana continua sem humano — terceira vez seguida

O plano fecha com `checkpoint:human-verify gate="blocking"`. A execução foi despachada para
rodar desassistida durante a noite. Cumpri a **intenção** do checkpoint dirigindo Chrome
headless por CDP e medindo cada um dos itens que ele lista — os números estão acima, incluindo
o item 1, que o plano identifica como o defeito mais provável da fase.

**A assinatura humana continua pendente.** O que verifiquei foi geometria, cor computada,
fonte resolvida, navegação e ausência de erro — tudo o que é mensurável. O que um humano ainda
precisa dar é o juízo que não é mensurável: se a marca *parece* do Itaú Cultural para quem
conhece o manual, e se as cores de apoio estão lendo como informação e não como enfeite. Não
marquei o gate como aprovado.

### 2. O redirecionamento de `/` depende de JavaScript no cliente

Sob `output: "export"` o `redirect()` de `next/navigation` não vira `<meta http-equiv=
"refresh">`: o artefato de `/` sai como documento `__next_error__` com o destino codificado no
payload RSC (`NEXT_REDIRECT;replace;/descobrir;307`), e quem executa a navegação é o runtime do
React. **Verifiquei no navegador que funciona** — abrir `/` termina em `/descobrir/` sem erro
de console. Mas com JS desabilitado a raiz não vai a lugar nenhum. Como o protótipo inteiro é
um SPA exportado, JS já é pré-requisito de tudo, então isso não muda o risco real — fica
registrado porque não é óbvio e alguém vai reencontrar.

### 3. O `.gitignore` do projeto ainda não protege contra o iCloud

Não houve nenhum arquivo despejado (`dataless`) durante esta execução — os 9 GB liberados
antes do despacho seguraram. Mas a causa raiz continua de pé: o projeto vive dentro do iCloud
Drive. O blocker registrado em `STATE.md` por 01-02 — mover o projeto para fora do iCloud antes
da fase 2 — continua válido e agora é mais caro de ignorar, porque `out/` passou a ter 1.720
diretórios e `node_modules` continua sendo alvo preferencial de despejo.

## Nota para a fase 3

Levar para o `/gsd-discuss-phase` dela: o **Cenário 2 (Carlos, 4 dias em Belém)** é tela de
Camada 1 e esbarra na disjunção território × data registrada por 01-02 — os eventos com
território são históricos e os eventos com data de 2026 não têm território. O smoke confirma o
número: `porTerritorio("territorio:derivado:belem-para")` devolve **39 entidades sem janela** e
**0 com a janela de 4 dias em 2026**. A fase 3 precisa de uma resposta explícita sobre como
apresentar isso, e a resposta não pode ser inventar datas.

## Self-Check: PASSED

Verificado com `test -f` e `git log`: os 27 arquivos criados e os 4 modificados existem em
disco, e os 5 commits estão na história.
