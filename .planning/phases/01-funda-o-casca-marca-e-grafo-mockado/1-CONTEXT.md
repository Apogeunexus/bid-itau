# Phase 1: Fundação — casca, marca e grafo mockado - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — todas as áreas cinzentas resolvidas pela opção recomendada, registradas abaixo.

<domain>
## Phase Boundary

Entrega a fundação sobre a qual as 37 telas serão construídas: o projeto Next.js roda, tem
a identidade do Itaú Cultural, alterna ao vivo entre visão mobile e visão web, expõe as 5
abas do app com rotas que espelham o produto real, e lê um grafo tipado gerado a partir do
acervo real já em disco.

**Nenhuma tela de conteúdo é entregue nesta fase.** As rotas existem e navegam, mas exibem
estados de esqueleto. A prova da fase é: a casca vive, tem a cara certa, alterna as duas
visões e consegue percorrer o grafo.

Requisitos: FUND-01 a FUND-04, DADO-01 a DADO-08.
</domain>

<decisions>
## Implementation Decisions

### Alternador de visões — a decisão estruturante da fase

`[auto] Alternador — Q: "media queries reais ou estado controlado?" → Selected: "estado controlado por atributo" (recomendado)`

- **D-01:** A visão é **estado da aplicação, não tamanho de janela**. Um `ViewProvider`
  (React Context) guarda `"mobile" | "web"` e escreve `data-view` no elemento raiz do
  shell.
- **D-02:** Os estilos respondem a `data-view` por meio de uma variante Tailwind
  customizada (`app:` e `desk:`), **não** por `sm:`/`lg:`. Media query real deixaria o
  alternador refém do tamanho do navegador do avaliador — e a apresentação precisa
  funcionar numa telona.
- **D-03:** Na visão mobile dentro de um navegador largo, o app renderiza dentro de uma
  **moldura de celular** centralizada (largura fixa 390px, cantos arredondados, barra de
  status simulada). Em viewport estreito, a moldura some e ocupa a tela toda.
- **D-04:** O controle do alternador é um par de botões fixo no canto, visível em ambas as
  visões, fora do fluxo do conteúdo. A escolha persiste em `localStorage`.
- **D-05:** Um único conjunto de componentes atende as duas visões. É proibido criar
  `ComponenteMobile` e `ComponenteWeb` como arquivos irmãos — a divergência mora nas
  classes `app:`/`desk:` do mesmo componente. Exceção permitida apenas para as três
  superfícies de bastidor (Studio, Redação, Observatório), que existem só na web.

### Identidade visual

`[auto] Tokens — Q: "Tailwind config ou CSS custom properties?" → Selected: "CSS custom properties expostas ao Tailwind" (recomendado)`

- **D-06:** A paleta vive como custom properties em `:root` e é exposta ao Tailwind via
  `@theme`. Isso permite trocar tema sem recompilar classes e mantém os hex do manual
  visíveis em um só lugar.
- **D-07:** Nomes dos tokens seguem o manual, em português: `--ic-laranja` `#ff7800`,
  `--ic-preto` `#000000`, `--ic-branco` `#ffffff`, `--ic-lilas` `#7f3e98`, `--ic-azul`
  `#30c5f4`, `--ic-amarelo` `#f9df4d`, `--ic-rosa` `#e04b9b`, `--ic-verde` `#a6ce39`,
  `--ic-verde-agua` `#69c4a4`. Chancela Fundação Itaú: `--fit-azul` `#0C2D78`,
  `--fit-laranja` `#EC7000`, `--fit-cyan` `#4DAFFF`.
- **D-08:** As cores de apoio não são decorativas — **cada linguagem artística recebe uma
  cor fixa** do conjunto de apoio, e essa associação é dado, não CSS. Assim a cor vira
  informação: a mesma linguagem tem a mesma cor no cartão, no mapa e no indicador.

`[auto] Tipografia — Q: "que fonte usar, já que Itaú Text é proprietária?" → Selected: "stack com as substitutas que o próprio manual prevê" (recomendado)`

- **D-09:** Itaú Text e Itaú Display são proprietárias e não estão em disco. O manual prevê
  **Myriad e Arial** como substitutas oficiais. A stack fica
  `"Itaú Text", "Itaú Display", Myriad, Arial, Helvetica, sans-serif` — se as fontes reais
  forem instaladas depois, assumem sozinhas, sem mudar código.
- **D-10:** A regra de tamanho do manual vira token: `--fonte-texto` para ≤12pt e
  `--fonte-display` para ≥13pt.
- **D-11:** O grafismo `\` é um componente SVG com as três variações do manual
  (`\C` completo, apenas `\`, `\C` espaçado). Usado como marcador de seção, como no
  próprio manual.

### Rotas

`[auto] Rotas — Q: "espelhar o produto real ou simplificar?" → Selected: "espelhar" (recomendado)`

- **D-12:** App Router, rotas em português espelhando o produto:
  `/entrar` · `/onboarding/[passo]` · `/descobrir` · `/acontece` · `/mapa` · `/play` ·
  `/buscar` · `/meu` · `/evento/[slug]` · `/artista/[slug]` · `/obra/[slug]` ·
  `/produtor/[slug]` · `/studio/duplicatas` · `/studio/ocorrencias` · `/studio/publicar` ·
  `/redacao/fila` · `/redacao/trilha` · `/observatorio`
- **D-13:** As 5 abas (Descobrir · Acontece · Play · Buscar · Meu) ficam em barra inferior
  na visão mobile e em barra superior na visão web, do mesmo componente.
- **D-14:** Mapa **não é aba** — é rota alcançada de dentro de Acontece e Buscar, mantendo
  o conjunto de resultados. Formação e Oportunidades não têm rota própria: vivem dentro de
  Evento/Espaço e de Meu, conforme PRD §7.

### Camada de dados

`[auto] Fixtures — Q: "JSON estático ou gerado por script?" → Selected: "gerado por script, versionado" (recomendado)`

- **D-15:** Um script `scripts/gerar-grafo.mjs` transforma `dados/normalizado/*.json`,
  `dados/amostra/enciclopedia.jsonl` e `dados/taxonomia/*.json` em
  `src/dados/gerado/*.json`, com tipos em `src/dados/tipos.ts`. O gerado é versionado, para
  que o protótipo rode sem depender de rodar o script — mas o script existe e é
  reexecutável, o que prova que é transformação e não invenção.
- **D-16:** O grafo é exposto por `src/dados/grafo.ts` com funções de travessia:
  `porId`, `vizinhos(id, relacao?)`, `caminho(de, para, maxPassos)`, `porLinguagem`,
  `porTerritorio`, `ocorrenciasDe(eventoId)`. As telas nunca varrem arrays cru — sempre
  passam pelo grafo. É isso que impede o produto de virar catálogo.
- **D-17:** Toda entidade carrega `procedencia: "ic" | "derivado" | "autorado"` e, quando
  `ic`, a `fonte` (url de origem). Nenhuma exceção — inclusive as autoradas.
- **D-18:** Toda aresta `semelhante_a` carrega `motivo: string` em português legível. Uma
  aresta sem motivo é erro de geração, não item a preencher depois.

`[auto] Coordenadas — Q: "geocodificar via API ou tabela estática?" → Selected: "tabela estática" (recomendado)`

- **D-19:** Sem API externa. Uma tabela estática de centroides cobre os municípios
  presentes na amostra saneada. Espaços culturais herdam a coordenada da cidade com
  deslocamento determinístico derivado do hash do nome — pinos não se empilham e o
  resultado é estável entre execuções.
- **D-20:** Coordenada é sempre `procedencia: "derivado"`, e o mapa exibe isso na legenda.
  A honestidade do dado é argumento da proposta, não constrangimento.

`[auto] Ocorrências — Q: "aleatórias ou derivadas do período real?" → Selected: "derivadas, determinísticas" (recomendado)`

- **D-21:** Ocorrências são geradas do período real do evento por regra determinística,
  semeada pelo id do evento — mesma entrada, mesma saída, sempre:
  - período de 1 dia → 1 ocorrência
  - temporada de semanas → sessões semanais em quinta, sexta e sábado, 20h
  - exposição ou ocupação de longa duração → visitação diária em faixa de horário
- **D-22:** O critério de identidade da ontologia é implementado de verdade na geração:
  Evento = título normalizado + agente + obra; Ocorrência = temporada + início + espaço.
  As ~40 duplicatas do Cenário 3 são clonadas violando esse critério de forma controlada,
  para que o Studio tenha o que resolver.

`[auto] Imagens — Q: "hotlink do S3 ou servir local?" → Selected: "servir local" (recomendado)`

- **D-23:** As 900 imagens vão para `public/acervo/` no passo de geração, com
  `indice.json` preservado. O protótipo funciona offline — importa numa apresentação onde
  a rede pode falhar.

### Build

- **D-24:** `output: "export"` no `next.config`. Sem rota dinâmica de servidor, sem
  server action, sem chamada de rede em runtime. O artefato final é uma pasta estática que
  abre em qualquer lugar.
- **D-25:** Sem autenticação real. A tela de entrada seleciona uma das 3 personas e grava
  em `localStorage`. É mock explícito, rotulado como tal na própria tela.

### Claude's Discretion

Organização interna de pastas de componentes, nomes de variáveis, granularidade dos
arquivos de tipo, e escolha entre `clsx`/`cva` para composição de classes.
</decisions>

<specifics>
## Specific Ideas

- A moldura de celular na visão mobile não é enfeite: é o que torna o alternador legível
  numa apresentação em telona, e comunica "isto é um app" sem precisar dizer.
- A cor por linguagem artística (D-08) é a peça que faz a identidade do IC trabalhar a
  favor do produto em vez de ser só chancela — a paleta de apoio existe no manual
  justamente para significar pluralidade.
- O grafismo `\` como marcador de seção reproduz o uso que o próprio manual faz
  (`\Sólido`, `\Plural`, `\Digital`).
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `docs/PRD.md` — §3.1 (a ponte Enciclopédia↔agenda), §6 (ontologia), §7 (arquitetura de
  informação), §14 (procedência, ordem de corte, decisões técnicas)
- `docs/telas.md` — inventário das 37 telas com conteúdo de cada uma
- `docs/funcionalidades.md` — as 86 funcionalidades numeradas
- `.planning/REQUIREMENTS.md` — FUND-01..04 e DADO-01..08
- `.planning/intel/constraints.md` — restrições de schema, ontologia e marca
- `referencias/manual-marca-itau-cultural-2018.pdf` — cores, tipografia, grafismo
- `dados/normalizado/`, `dados/amostra/enciclopedia.jsonl`, `dados/taxonomia/`,
  `dados/imagens/` — as fontes reais a transformar
</canonical_refs>

<deferred>
## Deferred

- Expansão do bastidor de 6 para ~26 telas (Studio ~11, Redação ~7, Observatório ~8) —
  levantada pelo usuário, decisão em aberto, não bloqueia esta fase
- Tour virtual e exposição virtual como itens navegáveis — Camada 3
- Modo offline com service worker — fora do marco
</deferred>
