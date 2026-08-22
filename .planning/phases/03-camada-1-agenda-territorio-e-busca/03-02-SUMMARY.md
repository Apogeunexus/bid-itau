---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 02
subsystem: ui
tags: [next, react, localStorage, rsc, cdp, chrome-headless, cenario-4]

requires:
  - phase: 01-fundacao-e-grafo
    provides: "grafo.ts com ocorrenciasDe/porId/vizinhos, e as 2.425 ocorrências derivadas"
  - phase: 02-camada-1-descoberta-e-a-ponte
    provides: "sessao.tsx com salvos[] em localStorage, indiceDeSalvaveis() de repertorio.ts, o vocabulário visual de procedência da trilha, e o cliente CDP compartilhado"
provides:
  - "/salvos — a fila de sessões salvas, em ordem cronológica, com remoção e estado vazio útil"
  - "alerta.ts — duas alterações autoradas sobre ocorrências reais, com informante, rótulo e a frase que fecha o Cenário 4"
  - "parDeDemonstracao() — o par fixado de duas sessões futuras do mesmo evento, uma atingida e uma intacta"
  - "a semeadura do Cenário 4: um controle que pré-semeia o estado que o roteiro da banca precisa"
  - "src/estilos/salvos.css — o primeiro CSS de plano da fase, importado pelo componente"
affects: [fase-4-studio, 03-07-verificacao-da-fase, cenario-4-do-rfp]

actuals:
  tokens: 12050
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "CSS por plano em src/estilos/{nome}.css, importado pelo componente — globals.css fica intocado durante ondas paralelas"
    - "Conteúdo autorado sobre dado real: o registro carrega procedencia/frase e a tela carrega o rótulo, no vocabulário de D-37"
    - "Constante fixada + conferência que lança: o par de demonstração quebra alto se o grafo regerado não casar, em vez de trocar o roteiro em silêncio"

key-files:
  created:
    - src/dados/alerta.ts
    - src/componentes/salvos.tsx
    - src/estilos/salvos.css
    - src/app/(app)/salvos/page.tsx
  modified:
    - src/app/(app)/meu/page.tsx

key-decisions:
  - "quemInformou não nomeia ninguém: medido que as 527 arestas realiza chegam todas a evento:enc:*, e nenhum dos 9 eventos com sessão futura tem instituição ligada — as duas alterações declaram o informante como autorado"
  - "O par é evento:cms:13845, fixado em constante, escolhido pela regra «menor id entre os eventos não-duplicata com ≥2 sessões futuras»"
  - "A linha salva leva a /evento/[slug]/ e não a /evento/[slug]/sessoes/ — a rota de sessões é de um plano concorrente da mesma onda e não existia neste build"
  - "Trilha salva compartilha a chave salvos (trilha.tsx grava ali): contada e declarada na tela, não transformada em linha sem data"
  - "O corte de altura foi por procedência: encurtei prosa nossa, nenhum dado do acervo saiu da vista"

patterns-established:
  - "Alerta dirigido à ocorrência: alteracaoDe(ocorrenciaId) é a única porta, então não existe caminho pelo qual um aviso alcance a sessão irmã"
  - "Orçamento de altura medido em Chrome, não estimado: 824px de caixa menos 60px de abas, conferido com getBoundingClientRect"

requirements-completed: [AGEN-03]

coverage:
  - id: D1
    description: "alteracoes() devolve duas alterações autoradas sobre ocorrências reais e distintas, cada uma com rótulo, frase, informante e a frase que fecha o cenário"
    requirement: AGEN-03
    verification:
      - kind: unit
        ref: "npx tsx -e '<verify de Task 1 do 03-02-PLAN.md>'"
        status: pass
    human_judgment: false
  - id: D2
    description: "parDeDemonstracao() é determinístico, do mesmo evento, ambas futuras, exatamente uma atingida"
    requirement: AGEN-03
    verification:
      - kind: unit
        ref: "npx tsx -e '<verify de Task 1 do 03-02-PLAN.md>' — duas chamadas comparadas"
        status: pass
    human_judgment: false
  - id: D3
    description: "/salvos exporta com estado vazio útil, semeadura do Cenário 4 e as quatro marcações de DOM; /meu leva a /salvos"
    requirement: AGEN-03
    verification:
      - kind: integration
        ref: "npm run build && node -e '<verify de Task 2 do 03-02-PLAN.md>'"
        status: pass
    human_judgment: false
  - id: D4
    description: "O alerta é dirigido à sessão e não ao evento: semeadura salva duas sessões do mesmo evento, exatamente uma fica alertada, remover a irmã não apaga o alerta e remover a atingida apaga"
    requirement: AGEN-03
    verification:
      - kind: automated_ui
        ref: "Chrome headless via scripts/navegador.mjs sobre out/ — 8 passos, 5 execuções"
        status: pass
    human_judgment: false
  - id: D5
    description: "A imagem que fecha o Cenário 4 — alerta e as duas linhas na mesma vista, sem rolagem, na moldura de 390×844"
    verification:
      - kind: automated_ui
        ref: "medição de getBoundingClientRect na moldura: fim da última linha a 739px de 764px úteis"
        status: pass
    human_judgment: true
    rationale: "A medida prova que cabe; se a composição LÊ como uma imagem única de banca — o contraste entre a linha alertada e a irmã sendo legível de relance na projeção — é julgamento visual que nenhum retângulo mede."

duration: 32min
completed: 2026-08-22
status: complete
---

# Phase 3 Plan 02: Salvos e alertas Summary

**Uma mudança de horário autorada sobre uma sessão real de 22.08 atinge `ocorrencia:derivado:13845-t1-o0028` e não a irmã de 23.08 do mesmo evento — provado por clique em Chrome headless: remover a irmã não apaga o alerta, remover a atingida apaga.**

## Performance

- **Duration:** ~32 min
- **Started:** 2026-08-22T08:59Z (aproximado — primeiro commit às 09:17Z)
- **Completed:** 2026-08-22T09:31Z
- **Tasks:** 3 de 3
- **Files modified:** 5 (4 criados, 1 editado)

## Accomplishments

- **`alerta.ts`** autora duas alterações — uma de horário (o Cenário 4) e uma de cancelamento — sobre ocorrências reais, distintas e de eventos distintos, cada uma com `procedencia: "autorado"`, a frase que declara o rótulo, o informante e a frase que fecha o cenário. `alteracaoDe(ocorrenciaId)` é a única porta de consulta, e a chave ser o id da OCORRÊNCIA é o que faz D-57 ser código em vez de promessa.
- **`/salvos`** lista sessões (não eventos) em ordem cronológica, com o bloco de alerta destacado no topo, remoção por linha, sessão passada mantida e marcada (D-54), e um estado vazio que oferece a semeadura do Cenário 4 em vez de uma tela em branco.
- **A prova por clique**, em Chrome headless sobre `out/`, com 8 passos e console limpo — inclusive o passo que nenhum HTML exportado consegue provar: o alerta some quando a sessão atingida sai da fila e continua quando sai a irmã.

## O par de demonstração — o roteiro da banca depende destes ids

| | id | data e hora reais |
|---|---|---|
| **Evento** | `evento:cms:13845` — *Helena Ignez é a homenageada da 74ª "Ocupação Itaú Cultural"* | 53 ocorrências ao todo, 26 futuras contra 2026-08-22 |
| **Sessão atingida** | `ocorrencia:derivado:13845-t1-o0028` | 2026-08-22T12:00:00-03:00 → remarcada para **19:30** |
| **Sessão intacta** | `ocorrencia:derivado:13845-t1-o0029` | 2026-08-23T10:00:00-03:00 — segue como estava |
| **Segunda alteração** | `ocorrencia:derivado:13913-t1-o0003` (*Espetáculo "Deserto"*) | 2026-08-22T20:00:00-03:00 → **cancelada** |

**Rota da constante:** `EVENTO_DO_PAR` em `src/dados/alerta.ts`. A regra que a produziu, declarada no arquivo: entre os eventos com duas ou mais sessões futuras e que não são duplicata encenada, o de menor id. Medido: 166 sessões futuras em 9 eventos, dos quais 1 é o clone `evento:autorado:dup-038-13845` do Cenário 3. Se uma regeração do grafo desfizer isso, `parDeDemonstracao()` lança com mensagem nomeada e o build quebra — de propósito.

## A frase que fecha o Cenário 4, literal na tela

> Só quem salvou esta sessão foi avisado. As outras 52 sessões de «Helena Ignez é a homenageada da 74ª "Ocupação Itaú Cultural"» seguem como estavam — a mudança de horário atinge uma ocorrência, não o evento.

Ao lado dela, sempre visível e fora de `<Comentario>`:

> «autorado»: escrito por nós, sobre sessão real. O acervo não publica histórico de alteração — é a lacuna que a tela demonstra.

E o informante, também visível:

> **por** — Informante autorado para o protótipo — o acervo não liga nenhuma instituição a este evento pela relação «realiza», e nós não inventamos nome de produtora

## Task Commits

1. **Task 1: alerta.ts — a alteração autorada com o par fixado** — `d467f3f` (feat)
2. **Task 2: /salvos — a fila de sessões e o alerta dirigido** — `997158a` (feat)
3. **Task 3: a prova por clique** — `8c71f01` (fix)

## Verificação — comandos e saída literal

### 1. Tipos e build

```
$ npx tsc --noEmit
(sem saída)

$ npm run build
build exit: 0
├ ○ /salvos
```

### 2. Task 1 — `alteracoes` e `parDeDemonstracao` contra `ocorrenciasDe`

```
$ npx tsc --noEmit && npx tsx -e "<verify da Task 1>"
OK alerta · 2 alteracoes autoradas · par Helena Ignez é a homenageada da 74ª “Ocu · atingida 2026-08-22T12:00:00-03:00 · intacta 2026-08-23T10:00:00-03:00
   horario | ocorrencia:derivado:13845-t1-o0028 | 12:00 -> 19:30 | informado 21.08.2026, 16h20 | do acervo? false
   cancelamento | ocorrencia:derivado:13913-t1-o0003 | 20:00 -> cancelada | informado 21.08.2026, 16h20 | do acervo? false
```

### 3. Task 2 — a rota exportada e as marcações

```
$ npm run build && node -e "<verify da Task 2>"
OK salvos · rota exportada · semeadura presente · 4 marcacoes no componente · /meu aponta para /salvos
```

Varredura DP-F sobre `src/` inteiro, comentários removidos antes do grep, `import type` ignorado:

```
clientes que importam grafo: nenhum
```

Tamanho do HTML exportado: `out/salvos/index.html` = 161.481 bytes (contra 432.413 de `/meu`, que carrega os três repertórios precomputados).

### 4. Task 3 — a prova por clique, uma linha por passo

Chrome headless, viewport 1440×960, sobre `out/` servido por `scripts/servir-out.mjs`:

```
passo 1 · estado vazio com semeadura visivel · «Ver o Cenário 4 com o par de exemplo» · 0 linhas salvas
passo 2 · clique na semeadura do Cenario 4 · «Ver o Cenário 4 com o par de exemplo»
passo 3 · 2 linhas salvas · 1 do mesmo evento /evento/ocupacao-itau-cultural-homenageia-helena-ignez/ alertada · ids ocorrencia:derivado:13845-t1-o0028 , ocorrencia:derivado:13845-t1-o0029 · alertado ocorrencia:derivado:13845-t1-o0028
passo 4 · alerta visivel · 356px · ocorrencia ocorrencia:derivado:13845-t1-o0028 · 12:00 -> 19:30 · rotulo data-procedencia-alerta="autorado"
passo 5 · recarregou · 2 linhas · 1 alertada · alerta presente (D-58 sobre D-46)
passo 6 · removeu a intacta · 1 linha · alerta continua visivel — ele pertence a outra sessao
passo 7 · removeu a atingida · 0 linhas · alerta desapareceu · estado vazio voltou com a semeadura
passo 8 · console · 0 erro · 0 aviso · 3 navegacoes

OK alerta dirigido · 2 salvos · 1 alertado · alerta visivel · sobrevive a recarregar · console 0
```

Os passos 6 e 7 são o par que prova a afirmação inteira. O passo 6 sozinho não bastaria — um alerta que nunca some pareceria dirigido e seria adorno. O 7 é o controle.

### 5. O orçamento da moldura, medido

```
{ "molduraLargura": 390, "molduraAltura": 844, "caixaDeConteudo": 824,
  "alturaDasAbas": 60, "alertaTopo": 109, "alertaAltura": 356,
  "fimDaUltimaLinha": 739, "precisaRolarParaVerAsDuas": false }
```

824 − 60 = **764px úteis**; o fim da segunda linha da fila cai a **739px**. Antes do corte da Task 3 caía a **770px**, 6px atrás da barra de abas.

### 6. Invariantes de arquivo

```
INTOCADO: src/app/globals.css
INTOCADO: src/contexto/sessao.tsx
INTOCADO: src/dados/repertorio.ts
```

## Files Created/Modified

- `src/dados/alerta.ts` — as alterações autoradas, o informante, o par fixado e `alteracaoDe`. Roda no build.
- `src/componentes/salvos.tsx` — a tela de cliente: fila, alerta, prova de D-57, estado vazio com semeadura, linha declarada das gavetas da tela 23.
- `src/estilos/salvos.css` — as regras da tela. Nada ancorado na janela; densidade ditada pelo orçamento medido.
- `src/app/(app)/salvos/page.tsx` — componente de servidor que monta índice, alterações e par no build.
- `src/app/(app)/meu/page.tsx` — **só** a entrada para `/salvos` (um `<Link>` e o import). Nenhuma outra alteração.

## Decisions Made

**`quemInformou` não nomeia ninguém, e isso é o dado falando.** Medido: existem 527 arestas `realiza` no grafo, e todas chegam a `evento:enc:*` — os eventos da Enciclopédia, de datas históricas. Nenhum dos 9 eventos com sessão futura tem instituição ligada por `realiza`. Como T-03-08 proíbe inventar nome de produtora, as duas alterações declaram o informante como autorado, com a razão em texto na tela. Um nome plausível ali seria mais bonito e atribuiria conduta a organização real.

**O par é fixo em constante, não calculado.** Um par escolhido por regra viva muda quando o grafo é regerado e o roteiro da banca deixa de ser reproduzível entre builds. A constante carrega a regra em comentário; a conferência lança se o dado não casar.

**A alteração de cancelamento é de outro evento, de propósito.** Se as duas caíssem no mesmo evento, a sessão «intacta» do par poderia sortear a cancelada e a prova de D-57 desmontaria por acidente de dado. `alteracoes()` ainda confere que duas alterações não caem sobre a mesma ocorrência.

**`gratuito` carrega o qualificador.** 0 de 300 eventos declara ingresso, então `gratuito: true` não distingue nada. A linha diz «sem ingresso declarado na fonte», não «gratuita».

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Bloqueio] O `<verify>` da Task 3 chama uma API que `scripts/` não tem**

- **Found during:** Task 3
- **Issue:** O verify do plano usa `servir('out')` devolvendo `{base, encerrar}`, `abrirNavegador()` devolvendo `{cdp}`, e `cdp.enviar`/`cdp.ao`/`cdp.irPara`. A API real é `servir({raiz})` → `{url, fechar}`, `abrirNavegador()` → o próprio `cdp`, com `navegar`/`recarregar`/`avaliar`/`clicar`/`encerrar` e a lista `cdp.consola` já coletando erro, aviso, `Log.entryAdded` e `Runtime.exceptionThrown`.
- **Fix:** Roteiro reescrito sobre a API real, como programa efêmero fora de `scripts/` (o script permanente é do 03-07). Ganhou os passos 6 e 7 completos e a medição de moldura, e usa `cdp.consola`, que cobre mais que o `Runtime.consoleAPICalled` do verify original.
- **Verification:** os 8 passos acima, 5 execuções.
- **Committed in:** nenhum arquivo do repositório mudou por causa disto — o programa é efêmero e sua saída literal está registrada aqui.

**2. [Rule 3 — Bloqueio] `/evento/[slug]/sessoes` não existe neste build**

- **Found during:** Task 2
- **Issue:** O plano manda a linha salva levar a `/evento/[slug]/sessoes`. Essa rota é de `files_modified` do plano **03-01**, concorrente na mesma onda, e não existia no working tree quando este build rodou. Sob `output: "export"`, um `<Link>` para rota não exportada é 404 silencioso.
- **Fix:** A linha leva a `/evento/{slug}/` — a página do evento, que já lista todas as sessões com o botão de salvar cada uma, e que existe independentemente do desfecho do 03-01. O comentário no código registra a razão.
- **Files modified:** `src/componentes/salvos.tsx`
- **Verification:** passo 3 do roteiro confirma o `href` renderizado: `/evento/ocupacao-itau-cultural-homenageia-helena-ignez/`.
- **Committed in:** `997158a`

**3. [Rule 1 — Bug de premissa] O plano diz que trilha salva vive em chave própria; ela não vive**

- **Found during:** Task 2, item 6
- **Issue:** O item 6 manda declarar que «a marcação de trilha da fase 2 vive em chave própria de `localStorage`, fora de `salvos`». Medido em `src/componentes/trilha.tsx:414`: o botão chama `alternarSalvo(trilha.id)`, gravando o id da trilha **na mesma lista `salvos`**. `repertorio.tsx` confirma, filtrando `salvos` por `startsWith("trilha:")`. Declarar a premissa falsa na tela seria afirmar sobre o próprio protótipo algo que o código contradiz — exatamente o tipo de frase que uma banca técnica testa.
- **Fix:** A tela diz a verdade medida: ids de trilha são separados da fila, **contados**, e a linha declara que trilha não é sessão, não tem data, por isso não entra na fila cronológica e aparece em Meu Repertório. Nenhuma gaveta vazia criada.
- **Files modified:** `src/componentes/salvos.tsx`
- **Verification:** a linha renderiza «Trilhas salvas: nenhuma neste navegador» com storage limpo, e conta quando há.
- **Committed in:** `997158a`

**4. [Rule 2 — Correção crítica] A imagem do Cenário 4 não cabia na moldura**

- **Found during:** Task 3
- **Issue:** O item 4 da Task 2 exige que o alerta e as duas linhas caibam na mesma vista sem rolagem. Medido: o fim da segunda linha caía a 770px do topo da moldura contra 764px úteis — 6px atrás da barra de abas. Passaria despercebido em qualquer verificação que não medisse.
- **Fix:** Corte por procedência, como o plano manda: encurtei a frase de cabeçalho e o rótulo curto do alerta, as duas prosa nossa. Horários, data, evento, informante e o rótulo `autorado` continuam todos visíveis; o parágrafo longo com os números medidos já vivia dentro de `<Comentario>`.
- **Files modified:** `src/componentes/salvos.tsx`
- **Verification:** 739px de 764px, com 25px de folga.
- **Committed in:** `8c71f01`

---

**Total deviations:** 4 auto-corrigidas (2× Rule 3, 1× Rule 1, 1× Rule 2)
**Impact on plan:** nenhuma expande escopo. Duas são adaptações a fatos do repositório que o plano não tinha (API real do CDP, rota de outro plano da onda); uma corrige uma premissa do plano que o código contradiz; uma cumpre um requisito do próprio plano que só aparece quando medido.

## Issues Encountered

**Um flake em 5 execuções do roteiro.** A segunda execução falhou no passo 1 — estado vazio sem semeadura — e as quatro seguintes passaram sem nenhuma alteração de código. `git status` mostrou os outros três executores escrevendo no **mesmo working tree**, então um `npm run build` concorrente esvazia e regrava `out/` e o servidor estático serve 404 na janela. Hipótese secundária: `recarregar()` de `scripts/navegador.mjs` espera `Page.loadEventFired` e depois sonda `document.readyState`, que o documento ANTIGO ainda responde `complete` durante a troca. As duas causas estão fora dos arquivos deste plano e foram registradas em `deferred-items.md` para o 03-07, que é dono do script permanente da fase.

**D-58, «sobre a persona ativa», ficou parcialmente cumprida — e é a única promessa do plano que este código não entrega inteira.** `sessao.tsx` guarda salvos numa chave única, `agenda-cultural:salvos`, sem segmentar por persona; trocar de persona mantém a mesma fila. Cumprir a letra de D-58 exigiria alterar `sessao.tsx`, que o plano declara **leitura** e que outros três executores estão consumindo agora. Não foi tocado. O que este plano garante é a outra metade, verificada no passo 5: a fila vive em `localStorage` e sobrevive a recarregar. Registrado abaixo como janela aberta.

## Known Stubs

Nenhum. Não há valor vazio, texto de placeholder nem componente sem fonte de dado nos arquivos deste plano.

## Janelas abertas registradas

- **D-58 parcial** — salvos não é segmentado por persona; a correção mora em `src/contexto/sessao.tsx`, fora deste plano. Anotado aqui porque `/gsd-ship` precisa ver antes de a fase 3 fechar.
- **Flake do roteiro por clique** — em `deferred-items.md` da fase.

## Threat Flags

Nenhuma superfície nova fora do `<threat_model>` do plano. As seis entradas do registro foram mitigadas:

| Threat | Como ficou |
|---|---|
| T-03-07 Repudiation | `procedencia: "autorado"` no dado, `data-procedencia-alerta="autorado"` no DOM, pastilha laranja com a palavra em texto e a explicação curta fora de `<Comentario>` |
| T-03-08 Spoofing | `informanteDe()` só aceita instituição/coletivo ligado por aresta `realiza` que CHEGA ao evento; medido que não há nenhuma, e o informante é declarado autorado |
| T-03-09 Tampering | Todo id de `localStorage` resolvido contra o índice do build; não resolvido é contado e declarado na tela; ids repetidos deduplicados |
| T-03-10 Info Disclosure | `informadoEm` derivada de `DATA_DE_REFERENCIA` por aritmética `Date.UTC`; nenhum componente lê o relógio do runtime |
| T-03-11 DoS | O roteiro usa `abrirNavegador`, cuja limpeza já é definida logo após o spawn; `finally` encerra Chrome e servidor por todos os caminhos. Nenhum Chrome órfão após 6 execuções |
| T-03-12 Tampering no build | Zero pacote instalado; `package.json` intocado |

## Next Phase Readiness

**Pronto para a fase 4 (Studio).** O outro lado do Cenário 4 — o produtor publicando a alteração — tem agora um alvo concreto: `alteracoes()` é a lista que o Studio precisaria escrever, e `EVENTO_DO_PAR` / `ocorrencia:derivado:13845-t1-o0028` são os ids que o roteiro já usa deste lado. O Studio pode encenar a publicação sobre exatamente essa ocorrência e a tela de Salvos responde sem mudança.

**Para o 03-07 (verificação da fase):** o roteiro de 8 passos deste plano está pronto para virar gate, com a ressalva do flake e a correção sugerida em `deferred-items.md`. Os seletores estáveis são `[data-semear-cenario-4]`, `[data-salvo]`, `[data-salvo-alertado]`, `[data-alerta]` e `[data-procedencia-alerta]`.

**Para o 03-01:** quando `/evento/[slug]/sessoes` existir, trocar o `rota` de `salvos.tsx` é uma linha — o comentário no código marca o lugar.

## Self-Check: PASSED

Arquivos declarados, conferidos em disco:

```
FOUND: src/dados/alerta.ts
FOUND: src/componentes/salvos.tsx
FOUND: src/estilos/salvos.css
FOUND: src/app/(app)/salvos/page.tsx
FOUND: src/app/(app)/meu/page.tsx
FOUND: out/salvos/index.html
```

Commits declarados, conferidos em `git log`:

```
FOUND: d467f3f
FOUND: 997158a
FOUND: 8c71f01
```

---
*Phase: 03-camada-1-agenda-territorio-e-busca*
*Completed: 2026-08-22*
