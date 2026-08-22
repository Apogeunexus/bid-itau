---
phase: 02-camada-1-descoberta-e-a-ponte
plan: 05
subsystem: verificação
tags: [verificacao, chrome-headless, cdp, gates, cenario-1]
requires:
  - "02-01 — o motor da caminhada e o cartão"
  - "02-02 — Descobrir e a tela de explicação"
  - "02-03 — a trilha e Meu Repertório"
  - "02-04 — a ponte Enciclopédia ↔ agenda"
provides:
  - "npm run verificar-fase2 — 67 gates nomeados sobre o artefato exportado, em Chrome headless"
  - "scripts/servir-out.mjs — servidor estático de out/ reutilizável, com travessia barrada"
  - "prova por pixel de DESC-01 a DESC-08"
affects:
  - "qualquer plano futuro que mexa em src/ — o gate roda sobre o export e falha alto"
tech-stack:
  added: []
  patterns:
    - "cliente CDP sobre o WebSocket global do Node 24 — zero dependência nova"
    - "clique por Input.dispatchMouseEvent com hit-test, nunca el.click()"
    - "todo gate de código roda sobre a fonte SEM COMENTÁRIOS"
    - "todo gate de tela roda no DOM vivo, nunca por grep no HTML"
key-files:
  created:
    - scripts/servir-out.mjs
    - scripts/verificar-fase2.mjs
  modified:
    - package.json
decisions:
  - "Gates de tela medem o DOM vivo em vez de grep no HTML — o payload RSC deixa de ser contável por construção"
  - "A folga de D-33 passou a ser medida do conteúdo até a barra: scrollHeight sozinho nunca imprime folga real"
  - "As 12 explicações do feed são percorridas — uma medição só não prova caminho multi-salto"
  - "A distinção de D-43 é provada numa segunda página, porque a que a ponte alcança não a exercita"
metrics:
  duration: "~2h"
  completed: 2026-08-22
actuals:
  tokens: 61000
  tasks: 2
  commits: 3
status: complete
---

# Phase 02 Plan 05: Verificação por navegador do Cenário 1 — Summary

`npm run verificar-fase2` percorre o Cenário 1 inteiro em Chrome headless sobre `out/`, em
67 gates nomeados, e sai com código 0. Zero erro e zero aviso de console em 26 navegações.

**O julgamento visual continua PENDENTE.** Esta verificação prova que os elementos existem,
aparecem com altura maior que zero, respondem a clique e cabem na moldura. Ela não prova que
a tela é bonita, legível a três metros, ou convincente. Nenhum humano olhou as telas nesta
fase — foi assim nas três execuções da fase 1 — e a saída abaixo é o que substitui o olho,
não o que o dispensa.

## Os números que decidem

| medida | valor |
|---|---|
| gates que passam | **67** |
| erros de console na sessão | **0** em 26 navegações |
| avisos de console na sessão | **0** |
| cartões visíveis no feed · classes · pares adjacentes | **12 · 11 · 0** |
| cartões com selo de motivo visível | **12 de 12**, menor selo **34px** |
| sobreposição entre feeds de persona (pior par) | **1 de 12** (teto do gate: 3) |
| a explicação cabe na moldura | **587px** de conteúdo contra **775px** até a barra — folga **188px** |
| pior folga entre as 12 explicações do feed | **109px**, 0 estouram |
| rótulos `autorado` visíveis na trilha | **3 de 3** |
| dimensões de acessibilidade visíveis | **8 de 8** |
| peso de `out/_next/static/chunks` | **766 KB** — os 23 MB de grafo não atravessaram |

## O que foi provado por clique, e não por `href`

A diferença é o motivo de o plano existir. Cliques usam `Input.dispatchMouseEvent` em
coordenadas reais, depois de `scrollIntoView` e de conferir com `elementFromPoint` que o
ponto central do elemento é ele mesmo. `el.click()` dispara em elemento coberto por outra
camada; um clique de verdade, não.

- **artista → evento:** `/artista/a-mattera/` → `/evento/b-a-b-i-l-a-q-u-e-s/`
- **evento → artista, de volta à origem:** `/evento/b-a-b-i-l-a-q-u-e-s/` → `/artista/a-mattera/`
- **cartão → explicação:** `/descobrir/` → `/descobrir/porque/trilha_do-rap-ao-teatro-documentario/`
- **passo 3 da trilha → o evento com 3 ocorrências**
- **remover critério:** a tela recalcula na mesma URL, cadeia de 2 → 3 nós

## Os quatro gates que mediam a coisa errada

Três foram herdados da onda 2, com a recomendação de adotá-los; o quarto apareceu aqui. Os
quatro têm a mesma forma: **casavam texto em vez de código**, e passar neles exigiria apagar
a documentação do próprio contrato.

1. **Cor (D-08).** A varredura literal por `--ic-lilas` etc. casa comentários —
   `selo-linguagem.tsx:10` e `tipos.ts:250` citam o token para explicar que o vocabulário
   emite o NOME DO TOKEN. Medido agora: **0 em código, 2 em prosa**.
2. **`fixed`.** O único casamento nos arquivos da onda 2 é o comentário que explica **por que
   não se usa `fixed`** dentro da moldura. Medido: **0 em código, 3 em prosa**.
3. **DP-F por linha.** Acusava `repertorio.tsx` de importar `@/dados/repertorio` fora de
   `import type`; o import É `import type`, quebrado em cinco linhas. Agora casa a
   **instrução inteira**. Fui além do plano: a análise é **transitiva** — um cliente que
   importa um módulo que importa `grafo.ts` manda os mesmos 23 MB. **0 violações.**
4. **`use client` (novo).** `grep -rl '"use client"' src/` devolve **19**; as diretivas reais
   são **14**. Os outros cinco — `caminhada.ts`, `disposicoes.ts`, `ponte.ts`,
   `repertorio.ts`, `trilha.ts` — citam a diretiva em comentário, explicando a fronteira.
   É o mesmo defeito, num quarto gate.

**Sobre a forma `="` dos atributos `data-*`:** adotada nos gates que leem arquivo. Nos gates
de tela o problema deixou de existir por construção — eles rodam `querySelectorAll` no **DOM
vivo**, que não enxerga o payload RSC embutido no HTML. Foi assim que a ficha de
acessibilidade mediu **8** dimensões, e não 16.

## Três gates que eu mudei porque mediam pouco

**a) A folga de D-33 era sempre 0.** `scrollHeight` nunca é menor que `clientHeight`: sozinho
ele só sabe dizer «estourou» ou «não estourou», e imprimia `folga 0px` numa tela menos que
cheia. O teste de estouro continua sendo o requisito; a folga agora é medida do **conteúdo
até o topo da barra de abas**, que é como o 02-02 mediu as 72 páginas. Resultado: **587px
contra 775px, folga 188px** na página de partida, **109px** na pior das 12.

**b) Uma explicação não prova caminho multi-salto.** O cartão de partida rende cadeia de 2
nós — origem + 1 salto. Satisfaz o «≥ 2» do plano e **não** prova o que a fase afirma. As 12
explicações do feed da Maria passaram a ser percorridas. Ver o achado abaixo.

**c) O terceiro número de Meu Repertório é recortado em 12.** O 02-03 recortou a lista de
adjacentes em 12 para caber no payload. Exigir que a **contagem** mude entre personas exigiria
desfazer o recorte. O gate mede o **conjunto** de adjacentes — 3 conjuntos distintos — e as
duas contagens que de fato variam: atravessadas **8/5/10** e novas **4/6/9**.

## O achado que a demonstração precisa saber

**No feed da Maria, 10 das 12 explicações são de um salto só.**

```
 2 nós · curado        · Do rap ao teatro documentário, em 3 passos
 2 nós · —             · + (2012 : Fortaleza, CE)
 2 nós · —             · No reino de Bruno Berle
 2 nós · —             · Alberto Nepomuceno
 2 nós · —             · 90-00: cuentos brasileños contemporâneos
 0 nós · serendipidade · "Encontros de professores – virtual"…
 2 nós · —             · Aceragem
 2 nós · —             · O rap é compromisso – e Sabotage entendia muito bem
 2 nós · —             · As Travestidas
 2 nós · —             · A Estação Teatral
 2 nós · —             · A pluralidade das identidades e da literatura brasileira
 3 nós · —             · Esperança Garcia e o 6 de setembro piauiense
```

O 02-02 registrou «63 de 72 com caminho multi-salto». Os dois números estão certos e medem
coisas diferentes: cada página prerenderiza **as três personas**, e o 02-02 contou a página
como multi-salto se **qualquer** persona tinha cadeia longa. Para a persona do Cenário 1, na
tela que a banca vai abrir, **1 de 12**.

Isso não reprova nada — o multi-salto renderiza, está provado em «Esperança Garcia», e a
remoção de um critério faz a cadeia crescer de 2 para 3 ao vivo. Mas quem conduzir a
demonstração deve saber que o cartão de abertura mostra **um salto**, e que a cadeia longa
aparece ao **remover um critério**, que é o gesto mais forte da tela.

O `0 nós` é o cartão de serendipidade e é **o dado, não um buraco**: D-30 o define como
escolhido fora do alcance da caminhada. Há um gate específico para isso — **só a
serendipidade pode ficar sem caminho**; qualquer outro cartão sem cadeia seria um link para
uma tela vazia.

## D-43 precisou de uma segunda página

A ponte chega a `/evento/b-a-b-i-l-a-q-u-e-s/`, que tem as **8 dimensões em
`nao-declarada`**. Isso prova que a ficha aparece inteira e **não** prova que os estados se
distinguem — que é o conteúdo de D-43 («ausência não é negação») e o motivo da correção
`ad5c1d7` em `normalizar.py`.

Medido no export inteiro: **1599 `nao-declarada`, 791 `ausente-declarada`, 10 `presente`** nas
300 páginas de evento — e **nenhuma página tem as três**. O gate passou a visitar também
`/evento/artistas-do-vestir…/`, onde a distinção aparece em texto:

> `ausente-declarada`: «Audiodescrição — declarado ausente»
> `presente`: «Libras — declarado»

Sem essa segunda página, a correção que preserva os `false` da acessibilidade ficaria
verificada no dado e nunca no pixel.

## As mitigações do modelo de ameaças, testadas

Não bastou implementá-las; cada uma foi exercitada.

| Ameaça | Teste | Resultado |
|---|---|---|
| T-02-19 travessia | `GET /../package.json`, `/../../../../etc/passwd`, `/%2e%2e/…`, `/..%2f…` | **404**, nada vazou (`package.json` não bate com o real) |
| T-02-19 entrada malformada | `GET /%`, `/%E0%A4%A` | **403** |
| T-02-21 processo pendurado | lançamento forçado depois do spawn | **0 processos, 0 perfis** restantes |
| T-02-22 Chrome ausente | `CHROME_BIN=/nao/existe/chrome` | **exit 1** com mensagem nomeada |
| falha de gate | limiar sabotado em cópia descartável | **exit 1**, com as 24 medições anteriores impressas |

## Task Commits

1. **Task 1 — o driver, os gates estruturais e os de tela** — `13b5865` (feat)
2. **Task 2 — o roteiro do Cenário 1 por clique** — `0a7b209` (feat)
3. **D-43 provado em página que exercita a distinção** — `bb5b319` (feat)

## Verificação — saída literal de `npm run verificar-fase2`

```
> agenda-cultural-br@0.1.0 verificar-fase2
> node scripts/verificar-fase2.mjs

verificar-fase2 — Cenário 1 sobre o artefato exportado, em Chrome headless


── (b) gates estruturais, sem navegador ──
  ok   arquivos com a diretiva 'use client': 14
  ok   DP-F · caminhos de cliente até o grafo (transitivo): 0 violações
  ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 46 telas
  ok   DP-F · peso de out/_next/static/chunks: 766 KB
  ok   D-08 · token de cor de apoio em .ts/.tsx (sem comentários): 0 em código · 2 em prosa (comentários, ignorados de propósito)
  ok   dangerouslySetInnerHTML em src/: 0 ocorrências
  ok   posicionamento 'fixed' fora de casca.tsx (sem comentários): 0 em código · 3 em prosa (comentários, ignorados de propósito)
  ok   rotas da fase 1 intactas: 18 de 18
  ok   rotas de explicação em out/descobrir/porque/: 72
  ok   rota da trilha do Cenário 1: presente
  ok   páginas de entidade em out/: 1690
  ok   out/icon.svg (o 404 de favicon que quebrava o console): presente

  servidor estático em http://127.0.0.1:43217 (raiz: out/)
  Chrome headless aberto · viewport 1440×960

── (c) gates de tela, visão app ──
  ok   viewport (largo de propósito: a media query de 430px não participa): 1440×960
  ok   moldura contém a barra de abas (antes de rolar): barra 370px base 866 · moldura 390px base 876
  ok   moldura contém a barra de abas (rolada até o fim): rolagem 3660px · barra base 866 · moldura base 876
  ok   data-view inicial: mobile
  ok   data-view após o alternador: web
  ok   data-view sobrevive a recarregar (ida): web
  ok   data-view volta para mobile: mobile
  ok   data-view sobrevive a recarregar (volta): mobile

── 1 · onboarding por disposição (DESC-01, D-46) ──
  ok   cartões de disposição visíveis: 5
  ok   disposições marcadas após dois cliques: [0, 2]
  ok   D-46 · as disposições sobrevivem a recarregar: [0, 2]

── 2 · o feed (DESC-02, D-26 a D-30) ──
  ok   cartões VISÍVEIS no feed: 12
  ok   classes distintas no feed (D-26): 11 — trilha, evento, conteudo, pessoa, obra, formacao, termo, midia, coletivo, instituicao, publicacao
  ok   pares adjacentes de mesma classe (D-27): 0
  ok   D-28 · cartões com selo de motivo VISÍVEL e não vazio: 12 de 12 · menor altura de selo 34px
  ok   D-30 · cartões de serendipidade: 1
  ok   D-29 · destaque curado com assinatura visível: «Do rap ao teatro documentário, em 3 passos» · assinatura: «Curadoria humana, autorada para este protótipo: escrita à mã»

── 3 · disposição editável em um toque (D-32) ──
  ok   seletor de disposição abre com opções: quero-ser-surpreendida
  ok   D-32 · trocar disposição NÃO navega: /descobrir/
  ok   D-32 · a lista muda ao trocar «quero-ser-surpreendida»: 3 de 12 títulos em comum
  ok   D-32 · heterogeneidade se mantém depois da troca: 12 cartões, 12 classes, 0 pares adjacentes

── 4 · troca de persona (D-45) ──
  ok   feed de Carlos: 12 cartões
  ok   feed de Joana: 12 cartões
  ok   D-45 · sobreposição de títulos entre personas: Maria×Carlos: 1 · Maria×Joana: 1 · Carlos×Joana: 1 (pior 1 de 12)

── 5 · a explicação (DESC-03, D-33, D-34, D-35) ──
  ok   cartão de partida da explicação: #1 «Do rap ao teatro documentário, em 3 passos» (trilha)
  ok   DESC-03 · o clique leva à rota da explicação (D-33): /descobrir/porque/trilha_do-rap-ao-teatro-documentario/
  ok   D-34 · passos VISÍVEIS do caminho: 2
         passo: Raptermo · no seu repertório
         passo: A trilha «Do rap ao teatro documentário, em 3 passos» passa por Rap.Do
  ok   D-34 · passos com texto de motivo: 2 de 2
  ok   D-35 · rodapé do limite da IA visível: 1
  ok   D-34 · critérios removíveis visíveis: 5
  ok   D-33 · a explicação CABE na moldura sem rolar: moldura: scrollHeight 824px ≤ clientHeight 824px (não estoura) · conteúdo real 587px contra 775px até a barra · folga 188px
  ok   D-34 · remover critério recalcula a tela SEM navegar: url /descobrir/porque/trilha_do-rap-ao-teatro-documentario/ · 1 critério removido · passos 2→3 · texto 931→995 caracteres
          2 nós · curado · Do rap ao teatro documentário, em 3 passos
          2 nós · — · + (2012 : Fortaleza, CE)
          2 nós · — · No reino de Bruno Berle
          2 nós · — · Alberto Nepomuceno
          2 nós · — · 90-00: cuentos brasileños contemporâneos
          0 nós · serendipidade · “Encontros de professores – virtual”: saiba quais sã
          2 nós · — · Aceragem
          2 nós · — · O rap é compromisso – e Sabotage entendia muito bem
          2 nós · — · As Travestidas
          2 nós · — · A Estação Teatral
          2 nós · — · A pluralidade das identidades e da literatura brasil
          3 nós · — · Esperança Garcia e o 6 de setembro piauiense
  ok   D-34 · caminho MULTI-SALTO de verdade nas explicações do feed: maior cadeia 3 nós em «Esperança Garcia e o 6 de setembro piaui» · 1 de 12 com 3+ nós · 1 sem caminho (serendipidade) · distribuição 2/2/2/2/2/0/2/2/2/2/2/3
  ok   D-30 · só a serendipidade fica sem caminho: “Encontros de professores – virtual (especial=serendipidade)
  ok   D-33/D-35 · as 12 explicações do feed cabem na moldura e trazem o limite da IA: 12 páginas · 0 estouram · folga mínima 109px em «Esperança Garcia e o 6 de setembro piaui»

── 6 · a trilha do rap ao teatro documentário (DESC-04, D-36 a D-38) ──
  ok   D-36 · passos visíveis da trilha: 3
  ok   D-37 · rótulos «autorado» VISÍVEIS na tela: 3 — «autoradoligação autoradaEscrita », «autoradoligação autoradaEscrita », «autoradoligação autoradaEscrita »
  ok   D-36 · motivo de cada passo, não vazio: «quem ouve rap costuma chegar à poesia falada » · «do slam ao palco é um passo curto: nos dois a» · «daqui a trilha sai da enciclopédia e vira age»
  ok   D-38 · data da sessão final em texto: 3 sessões · 23.05.202623 de maio de 2026· 20:00entrada gratuita
  ok   D-38 · o passo final abre o evento COM ocorrências (por clique): /evento/o-veneno-do-teatro-traz-thriller-fascinante-protagonizado-por-osmar-prado-e-mauricio-machado/ · total declarado 3 · 3 ocorrências visíveis

── 7 · a ponte Enciclopédia ↔ agenda, nos dois sentidos (DESC-05, DESC-06, DESC-08) ──
  ok   D-39 · verbete embutido visível com link de fonte: procedência «ic» · fonte https://enciclopedia.itaucultural.org.br/pessoas/22151-a-mattera
  ok   D-40/D-41 · vínculos com papel vindo da aresta: 8 de 17 vínculos visíveis · atua_em:artista · data-papel: artista
  ok   DESC-05 · artista → evento POR CLIQUE: /artista/a-mattera/ → /evento/b-a-b-i-l-a-q-u-e-s/ (clicando «-B-A-B-I-L-A-Q-U-E-S-eventoartista»)
  ok   D-43 · dimensões da ficha de acessibilidade VISÍVEIS: 8 — estados: nao-declarada
  ok   D-40/D-41 · bloco de quem atua, com papel, na página do evento: 12 de 12 vínculos de atuação com papel
  ok   a volta para o artista de origem existe na tela: presente
  ok   DESC-06 · evento → artista POR CLIQUE, de volta à origem: /evento/b-a-b-i-l-a-q-u-e-s/ → /artista/a-mattera/
  ok   D-43 · os estados da acessibilidade se DISTINGUEM na tela (ausência ≠ negação): 8 dimensões · estados ausente-declarada + presente · ausente-declarada: «Audiodescriçãodeclarado ausente» · presente: «Librasdeclarado»

── 8 · Meu Repertório (DESC-07, D-44) ──
  ok   D-44 · linguagens atravessadas (Maria): 8
  ok   D-44 · adjacentes a um passo, com motivo visível: 12 adjacentes · 12 com selo de motivo visível
  ok   D-44 · contagem de linguagens novas presente e visível: 4
  ok   repertório de Carlos: 5 atravessadas · 12 adjacentes · 6 linguagens novas
  ok   repertório de Joana: 10 atravessadas · 12 adjacentes · 9 linguagens novas
  ok   D-45/D-44 · os números de Meu Repertório mudam com a persona: atravessadas 8/5/10 · novas 4/6/9 · adjacentes 12/12/12 (3 conjuntos distintos)

── console, acumulado na sessão inteira ──
  ok   console: 0 erro, 0 aviso em 26 navegações

── resumo · uma linha por requisito ──
  DESC-01       5 cartões de disposição visíveis; 2 marcados sobrevivem a recarregar (espelho de D-46 provado)
  DESC-02       12 cartões visíveis, 11 classes, 0 pares adjacentes, 12/12 com selo de motivo visível (menor 34px), 1 serendipidade, 1 destaque curado assinado
  DESC-03       clique do cartão #1 leva a /descobrir/porque/trilha_do-rap-ao-teatro-documentario/; 2 passos visíveis, rodapé de limite da IA presente, 5 critérios removíveis; nas 12 explicações do feed a maior cadeia tem 3 nós (1 com 3+), 0 estouram a moldura, folga mínima 109px
  DESC-04       3 passos, 3 rótulos «autorado» visíveis, 3 motivos não vazios, 3 sessões datadas; clique no passo 3 abre /evento/o-veneno-do-teatro-traz-thriller-fascinante-protagonizado-por-osmar-prado-e-mauricio-machado/ com 3 ocorrências
  DESC-05       clique em «-B-A-B-I-L-A-Q-U-E-S-eventoartista» leva de /artista/a-mattera/ a /evento/b-a-b-i-l-a-q-u-e-s/; verbete embutido visível com fonte https://enciclopedia.itaucultural.org.br/pessoas/22151-a-mattera
  DESC-06       clique em «A. Matterapessoaartista» leva de /evento/b-a-b-i-l-a-q-u-e-s/ de volta a /artista/a-mattera/; 12 vínculos de atuação com papel
  DESC-07       Maria/Carlos/Joana — atravessadas 8/5/10, novas a um passo 4/6/9, adjacentes 12/12/12 com motivo visível em todos
  DESC-08       ficha com 8 de 8 dimensões visíveis em /evento/b-a-b-i-l-a-q-u-e-s/ (estados: nao-declarada); a distinção de D-43 provada em artistas-do-vestir-uma-costura-dos-afeto… com ausente-declarada + presente, texto próprio para cada
  console limpo 0 erro, 0 aviso em 26 navegações

TUDO PASSOU.
```

```
$ npm run build
BUILD_EXIT=0

$ npm run verificar-fase2
VERIFICAR_EXIT=0
```

## Desvios do plano

### Corrigidos automaticamente

**1. [Rule 1 — Bug] `Target.createTarget` recusa parâmetros de tamanho**
- **Achado em:** Task 1, primeira execução
- **Problema:** `Target position can only be set for new windows` — `width`/`height` só valem
  para janela nova, e o script morria depois de subir o Chrome.
- **Correção:** parâmetros removidos e o viewport passou a ser **travado** por
  `Emulation.setDeviceMetricsOverride`. É mais forte do que confiar em `--window-size`: o
  1440×960 é premissa de todos os gates de tela, e uma barra de ferramentas a mais mudaria o
  número entre máquinas.
- **Commit:** `13b5865`

**2. [Rule 1 — Bug] Chrome órfão quando `abrirNavegador()` lançava depois do spawn — T-02-21**
- **Achado em:** Task 2, conferindo processos pendurados depois de uma execução
- **Problema:** o `finally` de `principal()` encerra `cdp`, mas se qualquer coisa entre o
  spawn e o `cdp` pronto lançasse — foi o que o desvio 1 fez —, `cdp` continuava `null` e o
  Chrome ficava vivo. **Medido: PID 87736, ppid 1, 10min57s de vida, segurando o perfil
  temporário.** A mitigação T-02-21 existia no papel e não no processo.
- **Correção:** a limpeza passou a ser definida logo depois do spawn e chamada por todos os
  caminhos de saída, mais rede de segurança em `process.on('exit')` e `SIGINT`.
- **Testado:** lançamento forçado depois do spawn → **0 processos e 0 perfis** restantes.
- **Commit:** `0a7b209`

**3. [Rule 1 — Bug] `CHROME_BIN` inválido caía no Chrome do sistema — T-02-22**
- **Achado em:** Task 2, ao **testar** a mitigação em vez de presumi-la
- **Problema:** `CHROME_BIN=/nao/existe/chrome` fazia o script achar o Chrome do sistema e
  **passar**. Isto é a mesma classe de defeito que T-02-22 existe para impedir: verificar num
  binário diferente do pedido produz relatório sobre outra coisa.
- **Correção:** `CHROME_BIN` é escolha explícita — se estiver definido e não existir, falha.
- **Testado:** **exit 1** com mensagem nomeada.
- **Commit:** `0a7b209`

**4. [Rule 3 — Bloqueio] o seletor de disposição é um alternador, e clicar às cegas o fechava**
- **Achado em:** Task 2, passo 3
- **Problema:** `[data-abrir-disposicao]` alterna. O passo 2 deixava o painel aberto e o passo
  3 o fechava, e o sintoma era «não há opções» num painel que existe.
- **Correção:** `abrirSeletor()` lê `aria-expanded` antes de agir.
- **Commit:** `0a7b209`

**Total: 4 desvios auto-corrigidos** (3× Rule 1, 1× Rule 3). Três deles são defeitos nas
**próprias mitigações do modelo de ameaças**, e os três só apareceram porque as mitigações
foram exercitadas em vez de declaradas.

### Ampliações de gate, com o motivo

Nenhuma relaxa um limiar. Todas medem mais do que o plano pedia, e estão descritas acima:
folga real de D-33 · as 12 explicações em vez de uma · conjunto em vez de contagem no
adjacente · DP-F transitivo em vez de direto · D-43 numa página que exercite a distinção ·
gate novo «só a serendipidade fica sem caminho».

## Conhecidos

- **A regeneração do grafo continua proibida.** `npm run gerar-grafo` **não** foi executado.
  `dados/normalizar.py` tem a correção não aplicada aos dados e há 2.382 imagens onde o grafo
  foi construído com 900. Todo número acima descreve o grafo em disco. Regerar invalida
  silenciosamente as fases 1 e 2 — é passo deliberado da fase 3.
- **`ROTA_POR_CLASSE` continua duplicado** entre `cartao.tsx` e `ponte.ts`. O 02-04 sugeriu
  que o 02-05 unificasse; não o fiz, porque os dois arquivos estão fora do `files_modified`
  deste plano e o gate não os cobre. Fica para um plano de limpeza.
- **A folga de 25px do 02-05 não foi reproduzida** porque as 12 explicações do feed da Maria
  não incluem `evento_exposicao-narrativas-em-processo…`, a mais alta das 72. A medição do
  02-02 sobre as 72 páginas continua sendo a autoridade para o pior caso; esta verificação
  cobre o percurso, não o corpus.
- **As fontes reais do manual continuam ausentes** (D-09). Toda medição de altura foi feita
  com a stack de substituição. Instalar Itaú Text e Itaú Display muda os números de folga.
- **Julgamento visual pendente.** Declarado como pendente, não como aprovado.

## Self-Check: PASSED

- `scripts/servir-out.mjs` — FOUND
- `scripts/verificar-fase2.mjs` — FOUND
- `package.json` com o script `verificar-fase2` — FOUND
- commit `13b5865` — FOUND
- commit `0a7b209` — FOUND
- commit `bb5b319` — FOUND

---
*Phase: 02-camada-1-descoberta-e-a-ponte*
*Completed: 2026-08-22*
