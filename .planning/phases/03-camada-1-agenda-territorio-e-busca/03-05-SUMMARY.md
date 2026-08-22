---
phase: 03-camada-1-agenda-territorio-e-busca
plan: 05
subsystem: modo-cidade
tags: [modo-cidade, roteiro, territorio, procedencia, D-48, D-49, D-50, D-51, D-52, AGEN-05]
status: complete
requires:
  - src/dados/grafo.ts (porTerritorio, porId, porSlug, slugsPorTipo, vizinhos, ocorrenciasDe)
  - src/dados/geo.ts (coordenadaDe, distanciaKm — contrato do plano 03-03)
  - src/componentes/capa-sem-imagem.tsx (CapaDeCartao)
  - src/componentes/selo-linguagem.tsx (SelosDeLinguagem)
provides:
  - "src/dados/cidade.ts :: acervoDe, montarRoteiro, alternarItem, enquadramento, proprioDoTerritorio, cidadesComAcervo, precomputarCidade"
  - "/cidade/[slug] — 15 rotas de município exportadas"
  - "lente /mapa/#r=…&t=…&v=… emitida a partir do roteiro"
affects:
  - "/cidade/[slug]"
  - "/mapa (recebe recorte novo)"
tech-stack:
  added: []
  patterns:
    - "precômputo combinatório no build (2, 3, 4 e 5 dias) mais a fila de substitutos por posição — o cliente escolhe, nunca recalcula"
    - "itens referenciados por ÍNDICE no acervo dentro do payload, para não duplicar 39 objetos por combinação"
    - "uma troca ativa por dia: todo quilômetro exibido é um número medido no build, nunca uma conta feita no navegador"
key-files:
  created:
    - src/dados/cidade.ts
    - src/componentes/modo-cidade.tsx
    - src/estilos/cidade.css
    - src/app/(app)/cidade/[slug]/page.tsx
  modified: []
decisions:
  - "porTerritorio é chamada SEM janela, e o gate lê a fonte sem comentários para provar (D-48/D-49)"
  - "dataDeclarada sai LITERAL da fonte («1978», «07.10.2010»); anoDeclarado é lido do texto e existe só para o gate afirmar que nenhuma data é futura"
  - "a marca de próprio do território exige situação em UM único município e traz o tamanho do conjunto exclusivo como número visível (T-03-30)"
  - "o substituto de alternarItem prioriza âncora com coordenada própria ANTES do menor deslocamento — minimizar distância degenerava o dia para três itens no centroide"
  - "a rota é exportada por extra.nivel === «município» com 8+ registros: 15 cidades, e o Pará (39, idêntico a Belém) não vira segunda rota"
  - "o roteiro é montado por sementes de ponto mais distante + rodízio de classe + preenchimento pelo dia mais vazio; comparação por ponto de código, nunca localeCompare"
metrics:
  duration: "~1h50"
  completed: 2026-08-22
  tasks: 3
  commits: 4
actuals:
  tokens: 71000
  tasks: 3
  commits: 4
---

# Phase 03 Plan 05: Modo Cidade — Summary

O Cenário 2 andando sobre acervo real: Carlos escolhe Belém e quatro dias e vê um roteiro de
12 itens do território, com deslocamento medido em quilômetros, sem que uma única data tenha
sido fabricada — e com a frase que transforma essa restrição em argumento de produto na
primeira vista da moldura.

---

## A frase de enquadramento, texto integral (D-49, D-52)

Ela é o item obrigatório deste SUMMARY porque é a frase mais importante da fase e vai ser
lida em voz alta na apresentação. Lida do DOM renderizado, em `/cidade/belem-para/`, com o
modo comentado **desligado** — 363 caracteres, 197px de altura, `offsetParent` não nulo:

> **Este roteiro responde o que existe culturalmente em Belém: o acervo do Itaú Cultural
> documenta aqui 39 registros do que a cultura brasileira produziu neste lugar — 17
> exposições e salões, 11 artistas, 8 espaços e 3 instituições —, e 31 deles trazem a data
> que a fonte escreveu.**
>
> Programação futura entra nesta mesma tela quando os produtores publicarem no Studio.

Todos os números da frase saem da contagem no grafo — `enquadramento()` compõe o texto a
partir de `acervoDe()`, e nenhum deles é escrito à mão. Trocar de cidade troca a frase:
Fortaleza lê «10 registros — 5 artistas, 2 exposições e salões, 1 espaço, 1 coletivo e 1
obra —, e 9 deles trazem a data que a fonte escreveu».

Nenhuma palavra de licença: o gate procura `infelizmente`, `limitação do protótipo` e
`apenas um protótipo` no texto renderizado e não encontra nenhuma. O fecho aponta para a
fase 4, que é o que faz dela transição de apresentação e não rodapé.

---

## O roteiro de Belém, 4 dias, item a item

Determinístico: `montarRoteiro` rodado duas vezes devolve JSON idêntico, e a ordenação é por
ponto de código, nunca `localeCompare`.

### Dia 1 — 0,3 km em linha reta · 2 dos 3 no centroide

| item | classe | data | âncora | próprio |
|---|---|---|---|---|
| Fundação Romulo Maiorana (FRM) | espaço | *o acervo não declara data para este espaço* | própria (deslocamento por espaço) | 1 de 8 espaços |
| Caixa Cultural Belém | instituição | **2025** | centroide de Belém | 1 de 24 de artes visuais |
| Museu Paraense Emílio Goeldi | instituição | **1866** | centroide de Belém | 1 de 24 de artes visuais |

*justificativa:* espaço, instituições; 0,3 km de deslocamento; 2 no centroide do município.

### Dia 2 — 0,5 km · 1 dos 3 no centroide

| item | classe | data | âncora | próprio |
|---|---|---|---|---|
| Galeria de Arte da Universidade da Amazônia | espaço | *não declarada* | própria | 1 de 8 espaços |
| Museu de Arte de Belém (Mabe) | espaço | *não declarada* | própria | 1 de 8 espaços |
| A. Naval | artista | **11.06.1909** | centroide de Belém | 1 de 24 de artes visuais |

*justificativa:* espaços, artista; 0,5 km entre Galeria de Arte da Universidade da Amazônia
e Museu de Arte de Belém (Mabe); 1 no centroide do município.

### Dia 3 — 0,8 km · 1 dos 3 no centroide

| item | classe | data | âncora | próprio |
|---|---|---|---|---|
| 18º Salão Arte Pará | exposição ou salão | **1999 - 1999** | Museu de Arte de Belém (Mabe) | 1 de 24 de artes visuais |
| Alberto Bitar | artista | **12.12.1970** | centroide de Belém | 1 de 2 de arte |
| 21º Salão Arte Pará | exposição ou salão | **10.2002 - 10.2002** | Museu do Estado do Pará (MEP) | 1 de 24 de artes visuais |

*justificativa:* exposições e salões, artista; 0,8 km entre Museu de Arte de Belém (Mabe) e
Museu do Estado do Pará (MEP); 1 no centroide do município.

### Dia 4 — 0,5 km · 2 dos 3 no centroide

| item | classe | data | âncora | próprio |
|---|---|---|---|---|
| 17 Artistas do Pará | exposição ou salão | **1978** | Theatro da Paz | 1 de 24 de artes visuais |
| Foto Clube do Pará | instituição | **1955** | centroide de Belém | 1 de 24 de artes visuais |
| Alberto Nicolau | artista | **1961** | centroide de Belém | 1 de 24 de artes visuais |

*justificativa:* exposição ou salão, instituição, artista; 0,5 km de deslocamento; 2 no
centroide do município.

**Nenhuma data acima foi produzida por nós.** Cada uma é o texto que a Enciclopédia escreveu,
copiado sem normalizar: «1999 - 1999» fica «1999 - 1999», «10.2002 - 10.2002» fica assim, e
«1978» não vira «1978-01-01» — completar um ano para uma data cheia fabricaria uma precisão
que ninguém declarou. O maior ano impresso na tela inteira é **2025**.

---

## A marca de próprio do território, e o número que a sustenta (T-03-30)

**35 dos 39 registros de Belém recebem a marca; 12 dos 12 itens do roteiro de 4 dias a
recebem.** A condição é medida, não escrita: o acervo situa a entidade em **um único
município**, e esse município é este.

Os **4 que não recebem** são exatamente os que a Enciclopédia documenta em mais de um lugar:
Aarão Reis (Belém e Rio de Janeiro), Aluísio Carvão (Belém e Poços de Caldas), Albery (Belém
e Rio de Janeiro) e Antonio Landi (Bolonha e Belém). Nenhum deles ganha selo de
exclusividade, porque a contagem não o sustenta.

O número visível ao lado da marca é o tamanho do conjunto exclusivo a que a entidade
pertence — quantas entidades da mesma linguagem (ou, sem linguagem declarada, da mesma
classe) o acervo situa aqui e em nenhum outro território:

| conjunto | exclusivas em Belém |
|---|---|
| artes visuais | 24 |
| espaços (sem linguagem declarada) | 8 |
| arte | 2 |
| arquitetura, dança, música | 1 cada |

A forma curta fica no cartão («só em Belém · 1 de 24 de artes visuais»), a frase inteira
viaja no `title` do elemento e no roteiro exportado, e o `data-proprio` publica o número
para verificação. **Marca sem número não existe:** `proprioDoTerritorio` devolve `null`
quando a contagem não fecha.

---

## O payload dos roteiros pré-computados

O build calcula, por cidade, os roteiros de **2, 3, 4 e 5 dias** e, para cada posição de
cada dia, uma fila de **até 3 substitutos** já com o deslocamento medido. Os itens viajam
como **índices** num acervo único — sem isso, 39 objetos seriam duplicados em cada
combinação.

| cidade | registros | payload RSC | HTML exportado |
|---|---|---|---|
| Belém | 39 | **95,2 KB** | 210,1 KB |
| São Paulo (o maior) | 217 | 267,9 KB | 388,2 KB |
| Fortaleza (o menor) | 10 | 33,8 KB | 117,9 KB |
| **as 15 rotas juntas** | 628 | — | **8,5 MB em disco** |

O precômputo é obrigatório e não só economia: `distanciaKm` mora em `geo.ts`, que importa o
grafo, e um componente de cliente não pode alcançá-lo (DP-F). Reimplementar a haversine no
navegador criaria uma segunda versão da mesma conta.

---

## O que foi construído

### 1. `src/dados/cidade.ts` (49 KB)

- **`acervoDe(territorioId)`** — chama `porTerritorio` **com um argumento só**. Belém devolve
  39 itens: 8 espaços, 17 eventos, 11 pessoas, 3 instituições. Cada item traz título, classe,
  chave `{classe}_{slug}`, linguagens, procedência, rota, âncora geográfica resolvida por
  `coordenadaDe`, a data declarada quando existe e a **frase de ausência** quando não existe.
- **`proprioDoTerritorio(entidade, territorioId)`** — a marca medida descrita acima.
- **`montarRoteiro({territorioId, dias})`** — as quatro regras do plano, nesta ordem:
  sementes por amostragem do ponto mais distante entre as âncoras com coordenada própria
  (cada dia começa num canto diferente da cidade); rodízio de classe na seleção; o dia mais
  vazio escolhe primeiro e escolhe o item mais próximo do seu centro; nenhum dia com três
  itens da mesma classe; desempate por chave.
- **`alternarItem(roteiro, dia, posicao)`** — troca sem refazer: só o dia afetado é
  remontado, os outros saem por referência.
- **`enquadramento(territorioId)`** — a frase de D-52 composta da contagem.
- **`cidadesComAcervo()`** e **`precomputarCidade()`** — o corte de 8 registros e o DTO.

### 2. `/cidade/[slug]` + `modo-cidade.tsx` + `cidade.css`

Componente de servidor faz a travessia no build; o de cliente recebe primitivos. A tela, de
cima para baixo: cidade e janela em dias → frase de enquadramento → um cartão por dia com
deslocamento, justificativa e 2–3 itens → declaração da fonte da distância → legenda da
marca → exportar e lente para o mapa → as outras 14 cidades.

**Não existe seletor de data, filtro de janela temporal nem contagem de «eventos nesta
semana».** A janela é «quantos dias você fica».

---

## Verificação — saída literal

### Gate 1 — `cidade.ts`

```
OK cidade · 39 itens · 4 dias · deslocamentos 0.3/0.5/0.8/0.5km · 12 itens proprios do territorio
proprios no acervo: 35/39 · comData 31 · semData 8
```

Estendido às 15 cidades × 4 números de dias (60 roteiros): nenhum dia fora de 2–3 itens,
nenhum dia homogêneo de 3 da mesma classe, nenhum item repetido entre dias, nenhum item sem
o campo de data, nenhum item sem data e sem frase de ausência, nenhum ano declarado acima de
2026.

### Gate 2 — build e HTML exportado

```
OK modo cidade · 15 rotas · Belem com 4 dias · enquadramento presente · 0 data futura · porTerritorio sem janela · DP-F respeitado
rotas: belem-para belo-horizonte-minas-gerais brasilia-distrito-federal campinas-sao-paulo
curitiba-parana fortaleza-ceara havana-ciudad-de-la-habana lisboa-distrito-de-lisboa
nova-york-nova-york paris-ile-de-france porto-alegre-rio-grande-do-sul recife-pernambuco
rio-de-janeiro-rio-de-janeiro salvador-bahia sao-paulo-sao-paulo
```

`npx tsc --noEmit` limpo; `npm run build` com código 0.

### Gate 3 — o Cenário 2 num Chrome de verdade, 1440×960

```
1. enquadramento visivel · altura 197px · 363 caracteres
2. 4 dias visiveis · itens 3/3/3/3 · deslocamento «0,3 km em linha reta» «0,5 km em linha reta» «0,8 km em linha reta» «0,5 km em linha reta»
3. 0 data futura no texto renderizado · maior ano impresso na tela: 2025
4. trocar para 3 dias remontou sem navegar · rota /cidade/belem-para/ · hash #dias=3
5. alternar mudou 1 dia de 4 · saiu «espaco_fundacao-romulo-maiorana-frm-belem» entrou «espaco_museu-de-arte-sacra-do-para-belem» · deslocamento do dia 1: 0,3 km -> 0,2 km
6. lente levou a /mapa/ · 12 chaves no recorte · 2 pinos agrupados somando 12 itens · volta «/cidade/belem-para/#dias=4»
6.5. a volta trouxe o roteiro de novo · 4 dias · enquadramento visivel
7. enquadramento (154–351px) e o dia 1 (base 793px) cabem na primeira vista da moldura, que termina em 807px (a barra de abas ocupa 59px) · a tela rola por dentro (2577px de conteudo)
8. console limpo em 1 navegacoes · 0 erro · 0 aviso
```

Rodado como programa efêmero fora de `scripts/`, com `servir-out.mjs` e `navegador.mjs`
compartilhados. Nenhuma dependência nova, nenhum script novo no repositório.

### Verificações suplementares

```
exportar: {"visivel":true,"linhas":26,"recado":"copiado para a área de transferência",...}
hash dias=99 -> 4 dias (padrao 4)          ← T-03-31
hash dias=5  -> 5 dias
fortaleza 5 dias: {"dias":5,"itens":[2,2,2,2,2],"trocarDesabilitados":"10/10"}
```

Fortaleza tem 10 registros e 5 dias consomem todos: a reserva fica vazia e os 10 controles
de troca aparecem **desabilitados com o motivo**, em vez de trocar por nada.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] O gate de data futura da Task 1 comparava texto declarado com data ISO**

- **Found during:** Task 1
- **Issue:** o gate escrito no plano faz `String(i.dataDeclarada) > '2026-08-22'`. As datas do
  acervo saem literais da Enciclopédia no formato `DD.MM.AAAA`, e comparação lexical entre
  formatos diferentes é categoria errada: `«27.06.1967» > «2026-08-22»` é verdadeiro em
  JavaScript. Medido: **113 datas declaradas** nas 15 cidades disparariam o gate, 5 delas em
  Belém (Arthur Leandro 27.06.1967, Maria Christina 23.11.1959, Aluísio Carvão 24.01.1920,
  Antonio Landi 22.06.1791, e o 30.10.1713 do mesmo verbete) — todas históricas.
- **Fix:** o item ganhou `anoDeclarado`, que é o maior ano de quatro dígitos **lido** do texto
  da fonte, e o gate passou a afirmar `anoDeclarado <= 2026`; quando o texto **é** ISO, a
  comparação de string continua valendo e também é feita. A intenção de D-48 — nenhuma data
  futura — fica provada com mais força, e não menos: o gate agora olha o ano de qualquer
  formato, e o gate de texto renderizado confirma que o maior ano na tela é 2025.
- **Files modified:** `src/dados/cidade.ts`
- **Commit:** 57785e2

**2. [Rule 1 - Bug] `alternarItem` escolhia pelo menor deslocamento e degenerava o dia**

- **Found during:** Task 3 (só apareceu no navegador)
- **Issue:** a primeira versão escolhia o substituto que produzisse o menor deslocamento. Como
  os 20 itens de Belém ancorados no centroide do município estão **todos no mesmo ponto**,
  trocar um espaço por uma pessoa devolvia sempre zero quilômetro — e o critério empurrava o
  dia para três itens num ponto só, sem percurso nenhum. Minimizar distância recompensava
  apagar a geometria. Medido: o clique em «trocar» do dia 1 trocava a Fundação Romulo
  Maiorana por um evento sem espaço declarado, e o deslocamento ia de 0,3 km para 0,0.
- **Fix:** a âncora com coordenada própria passou a ser o primeiro critério, e o deslocamento
  decide entre as que já preservam o percurso. O mesmo clique agora troca por Museu de Arte
  Sacra do Pará e o deslocamento do dia vai de 0,3 km para 0,2 km — recalculado e visível.
- **Files modified:** `src/dados/cidade.ts`
- **Commit:** b237592

**3. [Rule 3 - Blocking] O enquadramento e o dia 1 não cabiam na primeira vista da moldura**

- **Found during:** Task 3, passo 7
- **Issue:** o dia 1 fechava em 1380px numa moldura cuja área visível termina em 807px — a
  barra de abas é *sticky* no pé e cobre os últimos 59px, o que a primeira medição (contra
  `window.innerHeight`) não via. A «foto que vai para o slide» estava cortada ao meio.
- **Fix:** a frase de enquadramento encurtou (os números que saíram dela foram para a linha
  de contagem do topo, não sumiram); a declaração da fonte da distância desceu para depois
  dos dias, já que cada dia diz «em linha reta» junto do seu número; o controle de troca
  passou para debaixo da capa, onde o espaço já estava vazio, poupando uma linha por item; e
  a marca de próprio ganhou forma curta com o número, guardando a frase inteira no `title`.
  Dia 1 fecha em **793px**, com 14px de folga.
- **Files modified:** `src/estilos/cidade.css`, `src/componentes/modo-cidade.tsx`,
  `src/dados/cidade.ts`
- **Commit:** b237592

### Correções de gate (mesma classe das herdadas da onda 1)

Registradas porque o próximo plano vai reusar estes gates:

1. **`/\/mapa#/` → `/\/mapa\/?#/`.** A gramática desta fase é `/mapa/#r=…` **com a barra**,
   por causa de `trailingSlash: true`; o regex do plano exigia a forma sem barra, que é a
   forma que redireciona antes de o hash ser lido.
2. **A API de `scripts/navegador.mjs` difere da escrita no plano.** `servir` recebe
   `{raiz}` e devolve `{url, fechar}`; `abrirNavegador()` devolve o `cdp` direto (não
   `{cdp}`); o método é `navegar`, não `irPara`; não há `cdp.enviar`/`cdp.ao` — o console é
   lido de `cdp.consola`, que já classifica em `erro`/`aviso`; e `cdp.clicar` recebe uma
   **expressão JavaScript que avalia para o elemento**, não um seletor CSS.
3. **`visiveis()` do prelúdio não serve para SVG.** O ajudante usa `offsetParent`, que só
   existe em `HTMLElement`: todo `<circle data-pino>` do mapa é reportado como invisível. Para
   forma dentro de SVG a medida é o retângulo.
4. **«Cabe na primeira vista» tem de ser medido contra a moldura menos a barra de abas**, e
   não contra `window.innerHeight`.

---

## Autenticação

Nenhum portão de autenticação neste plano.

---

## Threat Flags

Nenhuma superfície nova fora do `<threat_model>` do plano. As mitigações declaradas foram
implementadas: T-03-27 (nenhuma função produz data + gate no texto renderizado), T-03-28
(frase obrigatória e medida por altura), T-03-29 (`FONTE_DA_DISTANCIA` na tela e dia todo no
centroide diz isso em vez de «0 km»), T-03-30 (marca só com contagem), T-03-31 (número de
dias validado contra as combinações pré-computadas; 99 cai em 4), T-03-32 (exportação sem
rede, com o texto já na tela antes da tentativa de cópia), T-03-33 (nenhum pacote novo).

---

## Known Stubs

Nenhum. Todos os dados da tela vêm do grafo; nenhum valor vazio, placeholder ou texto
«em breve» foi escrito.

---

## Observações para quem vier depois

- **`src/componentes/buscar.tsx` ainda emite `/mapa#r=…`, sem a barra.** O commit 26f3aa0
  normalizou o emissor de Acontece «como a da Buscar», mas a Buscar é justamente a que ficou
  na forma antiga. Não toquei: o arquivo é do plano 03-04 e está fora da minha lista. É uma
  linha (`src/componentes/buscar.tsx:355`).
- **Cobertura de imagem em Belém é 4 de 39, não 5** como o plano estimou — todas em pessoas
  (Arthur Leandro, Aluísio Carvão, Alberto Bitar, Maria Christina). A regra da tela é a capa
  desenhada, como previsto.
- **A pastilha de classe da `CapaSemImagem` corta em 80px de largura** («INSTITUIÇÃO» sai
  «INSTITUICA»). Não é regressão desta tela — é o componente da fase 2 num tamanho menor do
  que o do feed. Alargar a coluna estreitaria o texto e quebraria o encaixe na primeira
  vista. Se incomodar na projeção, o ajuste é no componente, que é de outro plano.
- **`ocorrenciasDe` devolve zero para todas as 628 entidades das 15 cidades.** O ramo de
  data por ocorrência está escrito e é o correto quando o dado existir — é exatamente ele que
  passa a devolver algo quando um produtor publicar no Studio da fase 4.
- **Contenção de build entre executores paralelos.** `next build` usa um lock em `.next/` e
  recusa a execução simultânea; duas builds concorrentes na mesma árvore fazem uma delas sair
  com código 1 e uma verificação distraída mediria o `out/` antigo. Rodei com retentativa.

---

## Self-Check: PASSED

Arquivos criados, todos presentes e não vazios:

```
FOUND: src/dados/cidade.ts (49.491 bytes)
FOUND: src/componentes/modo-cidade.tsx (25.443 bytes)
FOUND: src/estilos/cidade.css (8.695 bytes)
FOUND: src/app/(app)/cidade/[slug]/page.tsx (2.465 bytes)
```

Commits, todos presentes em `git log`:

```
FOUND: 57785e2  feat(03-05): cidade.ts — roteiro sobre o acervo do territorio, sem fabricar data
FOUND: 1074dda  feat(03-05): /cidade/[slug] — o roteiro na tela, com o enquadramento como conteudo
FOUND: b237592  fix(03-05): o Cenario 2 andando no navegador — 8 passos verdes
FOUND: d8862e6  style(03-05): virgula entre as classes na justificativa do dia
```
