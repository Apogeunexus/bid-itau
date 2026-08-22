---
phase: 05-camada-2-web-desktop-e-profundidade
plan: 07
subsystem: play-catalogo-e-player
status: complete
tags: [play, player, midia, acessibilidade, repertorio, APPX-02, APPX-03, D-92, D-90, D-43]

requires:
  - "src/dados/grafo.ts — slugsPorTipo, porSlug, vizinhos (a única porta do acervo, D-16/D-47)"
  - "src/dados/alerta.ts — DATA_DE_REFERENCIA, o carimbo de build"
  - "src/componentes/ficha-acessibilidade.tsx — o vocabulário de D-43, reusado sem reescrever"
  - "src/componentes/capa-sem-imagem.tsx — CapaSemImagem para as 11 sem imagem"
  - "src/estilos/web.css — .web-grade e .web-painel, consumidos sem edição (congelada por 05-01)"
provides:
  - "src/dados/play.ts — o catálogo das 529, as 9 categorias contadas, as 8 dimensões e a ponte medida"
  - "src/dados/play-wire.ts — o vocabulário POSICIONAL do fio, importável dos DOIS lados de DP-F"
  - "src/componentes/play.tsx — o catálogo unificado; exporta CHAVE_CONCLUIDAS, lerConcluidas, gravarConcluidas"
  - "src/componentes/player.tsx — a página de uma mídia"
  - "529 rotas novas em /play/[slug]/"
  - "vejaIsto(eventoId) — a leitura INVERSA da ponte, pronta para a página do evento"
affects:
  - "05-08 acrescenta o padrão `play/<slug>` (+529) à lista de rotas explicáveis, SEM mover o limiar de 1.784"
  - "05-08 precisa varrer src/dados/play-wire.ts, que não está no files_modified do plano"

tech-stack:
  added: []
  patterns:
    - "formato de fio em TUPLA quando o DTO atravessa a fronteira RSC (molde de 05-01)"
    - "módulo de fio só-de-tipos, importável por valor dos dois lados de DP-F"
    - "máscara de bits para conjunto booleano esparso que atravessa a fronteira"
    - "data como número AAAAMMDD: comparável por `<`, imune a fuso sob export estático"
    - "resolução de parâmetro de rota tolerante a percent-encoding e a normalização Unicode"

key-files:
  created:
    - src/dados/play.ts
    - src/dados/play-wire.ts
    - src/componentes/play.tsx
    - src/componentes/player.tsx
    - src/app/(app)/play/[slug]/page.tsx
  modified:
    - src/app/(app)/play/page.tsx
    - src/estilos/play.css

decisions:
  - "o resumo NÃO viaja no catálogo, e não por truncamento: sobravam ~55 caracteres por item dentro do orçamento e a mediana dos resumos é 111. Um resumo cortado ao meio não é um resumo curto, é uma frase interrompida. O corte é de CAMPO e o resumo inteiro aparece nas 529 rotas do player, que são de servidor e não pagam chunk"
  - "o teto de 100 KB é INALCANÇÁVEL em objeto nomeado: o catálogo com os campos que o plano lista mede 548.387 bytes, e mesmo despido do resumo mede 98.524 só de nomes de campo repetidos 529 vezes. Em tupla mede 78.667. O gate mudou de `catalogoDoPlay()` para `catalogoNoFio()` — a propriedade protegida (o que atravessa a fronteira é limitado) ficou intacta"
  - "«não pode ir? veja isto» declara 14 de 529 e NENHUMA aresta foi autorada. A ponte real é 34 arestas de 14 mídias alcançando 25 eventos; a leitura útil é a inversa, e `vejaIsto(eventoId)` já existe para a página do evento"
  - "`aprofunda` de mídia mede ZERO nas 529 — o plano supunha que houvesse. A consulta ficou no código em vez de virar lista vazia escrita à mão: se o grafo for regerado com essas arestas, a tela passa a mostrá-las sem que ninguém lembre de voltar lá"
  - "8 dos 529 slugs do acervo são malformados (título enxertado no meio do slug, aspas curvas, travessão, espaço de largura zero) e as 8 rotas serviam «mídia não encontrada» com o build verde. O parâmetro chega percent-encodado enquanto o diretório é gravado decodificado"
  - "o cartão do catálogo não usa `CapaDeCartao`: na miniatura de 88px a pastilha de classe e a tarja de crédito se empilham sobre a imagem e viram um borrão. Pego numa FOTO, com todos os gates verdes"

metrics:
  duration: "~2 h"
  completed: 2026-08-22
  tasks: 3
  commits: 3
  files: 7

actuals:
  tokens: 18368
  tasks: 3
  commits: 3
---

# Phase 5 Plan 07: Play — o catálogo unificado das 529 e o Player Summary

O Play deixou de ser esqueleto: as **529 mídias reais** numa lista só, recortável pelas
**9 categorias que o próprio acervo declara**, com o filtro de acessibilidade dizendo o
número **antes** de qualquer marcação, e **529 rotas de player** que declaram por que não
tocam nada e registram no repertório só quando alguém clica.

**52 gates verdes no DOM vivo** (29 no catálogo, 23 no player). Console: 0 erro, 0 aviso.
Rede: **0 requisição externa**.

---

## Os números que este plano afirma — todos contados, nenhum copiado

Confirmei cada literal do plano contra o grafo antes de escrever uma linha. **Todos
bateram**, e dois números que o plano não tinha foram medidos:

| medida | o plano mediu | eu medi | bate? |
|---|---|---|---|
| mídias no acervo | 529 | 529 | sim |
| categorias | podcasts 336 · series 63 · videos 46 · noticias 45 · entrevista 25 · colunistas 7 · playlists 4 · agenda-cultural 2 · acervos 1 | idêntico, soma 529 | sim |
| com imagem local | 518 | 518 | sim |
| com linguagem / tema | 352 / 242 | 352 / 242 | sim |
| `libras` verdadeiro | 3 | 3 | sim |
| as outras 7 dimensões | 0 | 0 | sim |
| ponte `fala_sobre`→evento | 34 arestas, 14 mídias | 34 arestas, 14 mídias | sim |
| `semelhante_a` de mídia | 5.147, nunca para evento | 5.147, nunca para evento | sim |
| **eventos alcançados** | *o plano mandou medir* | **25** | novo |
| **`aprofunda` de mídia** | *o plano supôs que houvesse* | **0 nas 529** | **não** |

Duas notas de fidelidade ao dado:

- `fala_sobre` sai de mídia **39** vezes; 34 chegam a evento e **5 chegam a `formacao`**.
  Só as 34 contam como ponte, porque a afirmação da tela é sobre evento.
- **As 529 são todas `ic`** e **todas as 529 têm `declaraAcessibilidade` verdadeiro**.
  Isso importa para D-43: nesta tela o estado dominante é **«declarado ausente»**, não
  «não declarado» — a ficha da fonte foi preenchida e disse que não. É uma afirmação mais
  forte, e é a que o dado sustenta.

---

## A ponte com evento: 14 de 529, e nenhuma aresta autorada

O bloco «não pode ir? veja isto» declara, como produto e não como comentário:

> **14** das **529** mídias falam de um evento que está no acervo — são **34** ligações,
> alcançando **25** eventos. […] As outras 515 não têm essa ligação declarada, e nós não a
> inventamos.

**Nenhuma aresta mídia→evento foi criada** (T-05-34). O `entidades.json`/`arestas.json`
está intocado e `gerar-grafo` não foi rodado.

E a leitura de projeto que o plano apontou está entregue como função: **`vejaIsto(eventoId)`
já existe e devolve a ponte INVERTIDA** — as mídias que falam daquele evento —, pronta para
a página do evento oferecer «não pode ir? veja isto» com lastro nos 25 eventos alcançados.

Nas 515 mídias sem ligação **o bloco não some**: declara com o denominador. Medido numa
delas: `["com-ponte=14","total=529"]`.

---

## O filtro de acessibilidade, que é onde esta tela poderia mentir mais fácil

A tela 19 pede legenda, Libras e audiodescrição como três recortes equivalentes. Medido, um
recorta 3 e os outros dois recortam **nada**. Os três aparecem, com o número **antes** da
marcação, e os dois zerados carregam `data-nao-sustenta`:

```
Legendagem  0 de 529   (tracejado, data-nao-sustenta)
Libras      3 de 529
Audiodescrição 0 de 529 (tracejado, data-nao-sustenta)
```

Os três continuam **marcáveis**. Marcar audiodescrição devolve zero itens com o vazio
**explicado em 173 caracteres** — «o acervo publicado não declara esse recurso em nenhuma
mídia; o vazio aqui é o próprio dado, não uma falha da busca» — e não um branco mudo.
Marcar Libras recorta exatamente **3**.

---

## O peso: por que o resumo não viaja, e o que isso custou

**Este é o ponto duro do plano, e a aritmética é implacável.** Medido campo a campo sobre
as 529:

| forma do catálogo | bytes | contra o teto de 102.400 |
|---|---|---|
| objeto nomeado, campos do plano, resumo inteiro | **548.387** | 5,4× o teto |
| objeto nomeado, enxuto, **sem resumo nenhum** | **98.524** | cabe por 3.876 bytes |
| **tupla, sem resumo** | **78.667** | **cabe, 23.733 de folga** |
| tupla, resumo cortado em 90 caracteres | 115.101 | estoura |

Os nomes dos campos, repetidos 529 vezes, custam ~32 KB sozinhos. **É a mesma parede que
05-01 bateu** com o mapa da agenda (148.652 contra teto de 61.440), e a saída é a mesma que
este projeto já deu três vezes: **formato de fio em tupla**.

Sobravam **~59 bytes por item** para o resumo, ou seja ~55 caracteres, contra uma mediana de
111. Olhei o resultado:

```
"Falecido em 13 de novembro de 2014, o poeta foi…"
```

Legível, mas é uma frase interrompida — promete uma coisa e entrega outra. **O corte foi de
campo, não de item:** o resumo **inteiro** aparece nas 529 rotas do player, que são de
servidor e não pagam chunk. No catálogo, quem faz o reconhecimento é o título, a capa e a
categoria — e **o corte está declarado NA TELA**, com o peso medido:

> O resumo de cada mídia não viaja nesta lista — ele aparece por inteiro na página dela.
> […] O catálogo desta tela pesa **76.8 KB** de um orçamento de 100 KB, com as 529 mídias
> inteiras: o corte é de campo, nunca de item.

**O crédito de imagem ficou** (8,6 KB dos 78,7), e ficou por princípio: o acervo é de
terceiros e a procedência é argumento da proposta. Entre resumo e crédito, o crédito ganha.

**A procedência não viaja**: as 529 são `ic` sem exceção, e repetir a constante 529 vezes
custaria 10 KB para afirmar 529 vezes a mesma coisa. Ela é declarada uma vez, no cabeçalho.

---

## O Player: o que ele diz que é

`data-sem-arquivo` é **produto**, visível com o modo comentado desligado, e diz **as duas
coisas**:

> **O acervo carregado neste protótipo traz a ficha e a capa de cada mídia — o arquivo de
> áudio ou vídeo não faz parte dele.**
>
> **E nada é buscado do site do Itaú Cultural**: este protótipo não faz nenhuma requisição
> para fora do servidor local, e isso é medido a cada verificação. O endereço da fonte está
> aqui como link para quem quiser ir ver — clicar num link é uma escolha de quem usa, não
> uma requisição que o protótipo faz por conta própria.

Varrido nas **529** páginas exportadas: **0** `<iframe>`, **0** `<video>`/`<audio>` com
`src` remoto, **0** `<img>` remoto, **0** `preconnect`/`dns-prefetch`. E medido de dentro da
página com `performance.getEntriesByType('resource')`: **0 externas de 46 recursos**.

### A conclusão é gesto humano (D-92, T-05-36)

- **Nas 529 páginas exportadas, `data-assistido="1"` aparece 0 vezes.** É atributo de
  interação: mede zero no artefato de propósito.
- Clicar em `data-concluir` faz passar a `1`. **Sobrevive a recarregar.**
- **Idempotente:** concluir a mesma duas vezes deixa **1** entrada (é um `Set`).
- **Por mídia:** abrir outra mídia mostra `0`. Concluir a segunda deixa **2**.
- Nenhum temporizador, nada gravado ao abrir.

O carimbo usa `DATA_DE_REFERENCIA` (`2026-08-22`), a data do build — nunca `new Date()`.

### O storage adulterado (T-05-37), exercitado nos dois casos

| adulteração | resultado medido |
|---|---|
| valor que **não é lista** (`'"nao-e-lista"'`) | `data-continue="vazio"`, tela de pé, **529 mídias intactas** |
| lista com id inexistente e um número (`[slug, 'slug-que-nao-existe', 42]`) | **1** retomada resolvida, e o descarte **DECLARADO**: «1 registro guardado neste navegador não corresponde a nenhuma mídia do acervo e foi descartado da lista acima» |

### A chave, e `sessao.tsx` intocado

```
agenda-cultural:play-concluidas   →  string[] de slugs de mídia (CONJUNTO)
```

Vive em `play.tsx` (`CHAVE_CONCLUIDAS`, `lerConcluidas`, `gravarConcluidas`), no molde de
`lerLista` de `sessao.tsx`. **`src/contexto/sessao.tsx` não foi aberto** —
`git diff` contra ele sai vazio.

---

## O ACHADO: 8 das 529 rotas serviam «mídia não encontrada», com o build verde

**Este é o defeito mais perigoso que apareceu, e nenhum gate de contagem o pegaria.**

O build gerava as 529 rotas, `out/play/` tinha 529 diretórios, e **8 delas serviam a página
de erro**. 521 certas e 8 mortas passam em qualquer contagem de rotas.

A causa está no dado de origem: **8 dos 529 slugs têm caractere fora de `[a-z0-9-]`** —
e um deles traz o **título inteiro enxertado no meio do slug**:

```
17-in-edit-brasil-leva-a-ic-play-a-fo“17º In-Edit Brasil” leva à IC Play a força
da música e do documentáriorca-da-musica-e-do-documentario          (139 caracteres)
```

Os outros sete trazem acento (`paiol-literário`), travessão (`–`), aspas curvas e, num
caso, um **espaço de largura zero** (U+200B) invisível no fim do slug.

Sob `output: "export"` o Next **grava o diretório com o nome decodificado** e **entrega o
parâmetro percent-encodado**. Comparar o parâmetro cru contra a chave do catálogo falha
exatamente nessas 8.

**A correção não inventa dado**: `resolverParametro` alcança o mesmo item pela chave que ele
já tem, tentando o valor cru, o `decodeURIComponent` e as formas NFC/NFD — esta última
porque o sistema de arquivos do macOS pode devolver decomposto o que foi gravado composto.

```
antes:  8 de 529 rotas em «mídia não encontrada»
depois: 0 de 529 · as 529 resolvem e trazem data-player/sem-arquivo/concluir
```

**`dados/` está intocado** e `gerar-grafo` não foi rodado — o defeito do slug é do gerador e
fica registrado aqui para quem for regerar o grafo.

---

## O SEGUNDO ACHADO, pego numa FOTO com todos os gates verdes

Na primeira montagem o cartão do catálogo usava `CapaDeCartao`. **Os 24 gates passavam.** A
captura mostrou outra coisa: aquele componente sobrepõe à imagem a pastilha da classe e a
tarja de crédito, desenhadas para a capa grande do feed. Na **miniatura de 88px** do
catálogo as duas se empilham sobre a foto e viram um borrão ilegível — e a pastilha diria
«MIDIA» ao lado de uma etiqueta que já diz «NOTÍCIA», que é mais específica.

É a **quarta vez** nesta obra que um gate passa sobre tela quebrada, e a segunda em que só a
foto pegou. A saída: a capa do catálogo é imagem e o **crédito é linha de texto no pé do
cartão** — continua obrigatório e continua legível.

---

## O que 05-08 precisa: as duas medidas, e o gate vermelho que é dele

### ⇒ ESTE PLANO ACRESCENTA EXATAMENTE **529** PÁGINAS

```
rotas em out/play/ (diretórios)  : 529     ← acréscimo deste plano
total de index.html em out/      : 2.462   ← medido, mas MÓVEL: os seis planos da onda 2
                                             estavam landando enquanto eu media
```

**Não afirmo total absoluto em gate nenhum meu** — afirmo as 529, que são minhas.

O gate de total de páginas de **`verificar-fase4`** (não da fase 3, como o plano supôs) está
vermelho:

```
FALHA total de páginas em out/: medido 2463 · 146 da fase 3 · 1 da fase 4 ·
      resíduo 2316 · esperado resíduo 1784
```

A aritmética para 05-08: **2316 − 1784 = 532**, dos quais **529 são deste plano** e 3 dos
irmãos. Acrescentar o padrão `play/<slug>` (+529) à lista de explicáveis fecha a minha
parte **sem mover o limiar de 1.784**.

### O gate 8 de `verificar-fase3` segue vermelho, e não é meu

```
FALHA src/app/globals.css intocado desde o fim da fase 2 (c03f627)
```

Herdado de 05-01, como o plano previu. **Não consertei.** A âncora que 05-08 tem de escrever
continua sendo `c90fc9b`.

### `src/dados/play-wire.ts` não está no `files_modified` do plano

Precisa entrar na varredura de 05-08 — ver [Deviations](#deviations-from-plan), desvio 1.

---

## O orçamento de chunks

```
ok   peso de out/_next/static/chunks: 1241 KB · +117 KB contra os 1124 KB de antes
     da fase 4 · teto 1600 KB
```

**Verde, com 359 KB de folga.**

**Não consigo isolar a minha fatia, e digo por quê em vez de estimar:** os dois chunks de
JavaScript que contêm o meu código contêm também marcadores de **todos os outros cinco
planos da onda** (`data-observatorio`, `data-filtros`, `data-fila-redacao`,
`data-tabela-ocorrencias`, `data-destaque-curado`, `data-sem-resultado`). O Turbopack
co-empacotou a onda inteira, e os seis executores compartilham a MESMA árvore de trabalho —
qualquer medida diferencial mediria os irmãos junto.

O que **posso** afirmar, medido e travado por conferência que derruba o build:
**o DTO que atravessa a fronteira mede 78.667 bytes de 102.400** — 23.733 de folga.

---

## Verificação — comandos e saída literal

### 1. Task 1 — o módulo

```
OK 529 itens, 9 categorias, libras 3/529, ponte 34 arestas/14 midias/25 eventos/529
   fio  = 78667 bytes (teto 102400, folga 23733)
   nomeado completo = 548387 bytes  (NAO atravessa a fronteira)
   dimensoes: audio_description=0 [nao sustenta] · libras=3 · descriptive_subtitle=0
   [nao sustenta] · closed_caption=0 [nao sustenta] · open_caption=0 [nao sustenta] ·
   simultaneous_translation=0 [nao sustenta] · stenotypy=0 [nao sustenta] ·
   subtitle=0 [nao sustenta]
   categorias: Podcast 336 · Série 63 · Vídeo 46 · Notícia 45 · Entrevista 25 ·
   Coluna 7 · Playlist 4 · Agenda cultural 2 · Acervo 1
```

Mais um round-trip conferido item a item: a máscara de bits devolve os 8 booleanos
originais nas 529, e expandir a tupla devolve slug, título, imagem e categoria idênticos ao
objeto nomeado, **na mesma ordem**.

### 2. O módulo quebra alto — provado com três adulterações, arquivo restaurado byte a byte

```
tamper 1: MIDIAS_ESPERADAS = 530
  Error: play.ts: o catálogo montou 529 mídias e o acervo declara 530. A tela do Play
  AFIRMA o número na primeira linha; corrija a afirmação junto com a medida em vez de
  relaxar esta conferência.

tamper 2: TETO_DO_FIO = 40 * 1024
  Error: play.ts: o catálogo no fio ficou com 78667 bytes, acima do teto declarado de
  40960. Corte CAMPO, nunca item: 529 é o número que a proposta afirma e nenhuma mídia
  pode sumir para caber no orçamento.

tamper 3: rótulo «podcasts» removido da tabela
  Error: play.ts: a mídia «adriana-lunardi-escritores-leitores» tem categoria
  «podcasts», que não tem rótulo em português na tabela ROTULOS. Escreva o rótulo — a
  tela não pode mostrar a chave crua do CMS.

restaurado: antes=18122 depois=18122 IDENTICO
```

### 3. Task 2 — o catálogo, 29 gates no DOM vivo

```
ok   a tela do Play abriu e está visível (data-play)
ok   o catálogo unificado mostra as 529 mídias numa lista só: 529 no DOM, 529 visíveis
ok   a tela DECLARA o total de 529 mídias no texto
ok   há um controle por categoria presente no acervo, todos visíveis: 9 categorias + «todas»
ok   cada categoria traz a sua contagem: podcasts=336 · series=63 · videos=46 ·
     noticias=45 · entrevista=25 · colunistas=7 · playlists=4 · agenda-cultural=2 · acervos=1
ok   clicar em «Podcast» recorta a lista para 336 e só podcasts: n=336 · homogêneo=true
ok   o recorte NÃO navega — a URL não mudou: «/play/» → «/play/»
ok   o contador do recorte acompanha: 336
ok   voltar para «todas» devolve as 529
ok   os três recursos da tela 19 aparecem, todos visíveis: subtitle · libras · audio_description
ok   Libras traz o número ANTES de marcar: «3 de 529»
ok   os dois recursos que o acervo não sustenta declaram 0 de 529 e carregam
     data-nao-sustenta: subtitle«0 de 529» · audio_description«0 de 529»
ok   nenhum recurso vem marcado antes do gesto humano
ok   marcar audiodescrição devolve zero itens com o vazio EXPLICADO (173 caracteres)
ok   marcar Libras recorta exatamente as 3 mídias que o acervo declara
ok   o modo comentado está DESLIGADO durante a medição: data-comentado=nao
ok   «não pode ir? veja isto» é PRODUTO: visível=true · dentro de <Comentario>=false
ok   a ponte declara a cobertura REAL: 14 mídias · 34 ligações · 25 eventos · de 529
ok   «continue de onde parou» aparece VAZIO E EXPLICADO num navegador limpo
ok   o bloco vazio explica em vez de sumir: 247 caracteres
ok   o corte do resumo está declarado NA TELA, com o peso medido
ok   nada corre para fora da moldura: scrollWidth=370 clientWidth=370 · documento 1440/1440
ok   os 529 cartões medidos um a um contra o retângulo da moldura: 0 estourando
ok   /play/ · zero requisição para fora do servidor local: 0 externas de 74 recursos
ok   na visão web o catálogo vira GRADE, por CSS e não por ramo em JavaScript: display=grid
ok   a grade da web tem 4 colunas, parametrizando .web-grade: «254px 254px 254px 254px»
ok   os 529 cartões se distribuem em linhas de verdade
ok   na visão web nada corre para fora: scrollWidth - clientWidth = 0
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 29 gates verdes
```

### 4. Task 3 — o artefato exportado

```
OK 529 rotas de player · as 529 resolvem e trazem data-player/sem-arquivo/concluir
   0 carregamento remoto · 0 data-assistido=1 no artefato exportado
```

### 5. Task 3 — o player, 23 gates no DOM vivo

```
ok   a página da mídia abriu e está visível (data-player)
ok   a ficha mostra as 8 dimensões de acessibilidade: 8
ok   data-sem-arquivo é PRODUTO, visível com o modo comentado DESLIGADO
ok   a explicação diz AS DUAS coisas: que o acervo não traz o arquivo, e que nada é
     buscado de fora
ok   nenhum elemento carrega recurso remoto: []
ok   a fonte aparece como LINK que a pessoa clica (1)
ok   ANTES de qualquer clique, data-assistido mede zero: estado=0
ok   o controle de concluir é visível, com alvo utilizável e DENTRO do contêiner:
     {"x":564,"y":1547,"w":194,"h":41} · limite útil=338
ok   clicar em concluir faz data-assistido passar a 1
ok   o registro SOBREVIVE a recarregar a página
ok   concluir a MESMA mídia duas vezes deixa uma entrada: 1
ok   abrir OUTRA mídia mostra data-assistido=0 — o registro é por mídia, não global: 0
ok   concluir uma segunda mídia deixa DUAS registradas: 2
ok   «continue de onde parou» lê as duas de volta e as mostra
ok   valor que NÃO é lista devolve vazio e a tela continua de pé: 529 mídias
ok   id que não resolve no catálogo é DESCARTADO: 1 retomada de 3 valores guardados
ok   e o descarte é DECLARADO na tela, não silencioso
ok   os TRÊS recursos da tela 20 aparecem em evidência: subtitle=ausente-declarada ·
     libras=ausente-declarada · audio_description=ausente-declarada
ok   nenhum dos recursos estoura o contêiner: limite=338px · larguras 234/192/251
ok   numa mídia SEM ligação o bloco não some — declara: visível=true · ligações=0
ok   e declara COM O DENOMINADOR medido: ["com-ponte=14","total=529"]
ok   /play/[slug]/ · zero requisição para fora do servidor local: 0 externas de 46 recursos
ok   console sem erro e sem aviso da aplicação: 0 mensagem(ns)

TUDO PASSOU · 23 gates verdes
```

### 6. As suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-comentado` | **TUDO PASSOU** |
| `npm run verificar-fase2` | **TUDO PASSOU** — 0 erro, 0 aviso em 26 navegações |
| `npm run verificar-fase4` | **16 verdes, 1 falha** — só o total de páginas; **o teto de chunks está verde em 1241/1600 KB** |
| `npm run verificar-fase3` | **vermelha no gate 8** (`globals.css`), herdada de 05-01 |

### 7. `git diff` contra os arquivos proibidos

```
git diff --stat HEAD -- src/app/globals.css src/estilos/web.css src/contexto/sessao.tsx
(vazio)
```

---

## Deviations from Plan

### 1. [Regra 3 — bloqueante] Arquivo novo: `src/dados/play-wire.ts`

- **Found during:** Task 1
- **Issue:** com tupla, o vocabulário posicional precisa existir dos **dois** lados da
  fronteira DP-F — o produtor monta, o cliente expande. `play.ts` alcança o grafo e não
  pode ser importado por valor de um `"use client"`.
- **Fix:** um módulo **só-de-tipos** (zero import por valor), que os dois lados importam.
  Duas cópias de um vocabulário POSICIONAL divergem em silêncio: trocar duas posições de
  lugar não quebra o build, só passa a mostrar a capa de uma mídia com o título de outra.
- **É o mesmo movimento forçado de 05-01** (desvio 3, `mapa-agenda-wire.ts`), pela mesma
  razão. Não há risco de colisão: nenhum outro plano da onda toca este nome.
- **Nota para 05-08:** o arquivo não está no `files_modified` do plano; inclua-o na varredura.
- **Commit:** `6bf1022`

### 2. [Regra 3] O gate de 100 KB mudou de alvo — o literal do plano é inalcançável

- **Issue:** o gate da Task 1 mede `JSON.stringify(catalogoDoPlay()).length <= 102400`, e
  `ItemDoPlay` com os 15 campos que o plano lista mede **548.387 bytes**. Mesmo despido do
  resumo, em objeto nomeado mede **98.524** — só de nomes de campo repetidos 529 vezes.
  **É inalcançável por aritmética, não por desleixo**, exatamente como 05-01 registrou.
- **Fix:** `catalogoDoPlay()` continua devolvendo os objetos nomeados completos — é a
  verdade de build que alimenta as 529 rotas do player e **não atravessa a fronteira**. O
  que atravessa é `catalogoNoFio()`, em tupla, e **é ele que o gate mede**: 78.667 de
  102.400. A propriedade protegida — o que vai para o cliente é limitado — ficou intacta e
  é conferida a cada build, com falha nomeada.
- **Commit:** `6bf1022`

### 3. [Regra 1] O resumo não viaja no catálogo — o corte é total, não truncado

- **Issue:** o plano manda «trunque o resumo no catálogo». Medido, o orçamento deixava
  **~55 caracteres** por item contra uma mediana de 111.
- **Fix:** o resumo sai inteiro do fio e aparece **inteiro** nas 529 rotas do player. O
  corte está declarado na tela com o peso medido, e **nenhum item foi cortado**.
- **Por que não truncar:** um resumo cortado ao meio não é um resumo mais curto — é uma
  frase interrompida, que promete uma coisa e entrega outra. Entre um fragmento em 529
  cartões e o texto inteiro a um clique, o texto inteiro é a leitura honesta.
- **Commit:** `ac577af`

### 4. [Regra 1 — o dado não sustentava a premissa] `aprofunda` de mídia é ZERO

- **Issue:** a Task 3 pede «as arestas `aprofunda` e `fala_sobre` que saem desta mídia».
  Medido: **`aprofunda` não sai de nenhuma das 529**.
- **Fix:** a consulta ficou no código, e não virou lista vazia escrita à mão — se o grafo
  for regerado com essas arestas, a tela passa a mostrá-las sem que ninguém lembre de
  voltar lá. O bloco declara a ausência com o denominador, como o plano manda.
- **Commit:** `0abb35e`

### 5. [Regra 1 — bug] 8 das 529 rotas serviam «mídia não encontrada»

Ver [O ACHADO](#o-achado-8-das-529-rotas-serviam-mídia-não-encontrada-com-o-build-verde).
Corrigido por `resolverParametro`; 0 de 529 no fallback depois.
- **Commit:** `0abb35e`

### 6. [Regra 1 — pego na foto, não no gate] O cartão do catálogo não usa `CapaDeCartao`

Ver [O SEGUNDO ACHADO](#o-segundo-achado-pego-numa-foto-com-todos-os-gates-verdes).
- **Commit:** `ac577af`

### 7. O gate de total de páginas mora em `verificar-fase4`, não em `verificar-fase3`

O plano diz que 05-08 acrescenta o padrão «à lista de rotas explicáveis do gate da fase 3».
O gate que mede total de páginas e reprova é o de **`verificar-fase4`**. `verificar-fase3`
tem o seu próprio problema, que é o gate 8 de `globals.css`. **05-08 tem de mexer nos dois.**

---

## O vocabulário `data-*` deste plano

**Os 8 do contrato congelado, todos emitidos:**

| atributo | onde | valores |
|---|---|---|
| `data-play` | a seção do catálogo | — |
| `data-categoria` | os 10 chips de recorte | `todas` + as 9 chaves do CMS |
| `data-midia` | cada item do recorte | o slug |
| `data-player` | o `<article>` da mídia | o slug |
| `data-concluir` | o controle de conclusão | — |
| `data-assistido` | o `<article>` da mídia | `0`, `1` — **interação: 0 no artefato** |
| `data-veja-isto` | o bloco de ponte, **nas duas telas** | — |
| `data-sem-arquivo` | o bloco do arquivo ausente | — |

**Compartilhados, reaproveitados como manda o contrato:** `data-nao-sustenta` (fase 4),
`data-denominador` (05-01/05-05).

**ACRESCENTADOS por este plano** — nenhum renomeia nem altera o conjunto de valores de um
atributo existente:

`data-acessibilidade-do-play` (o chip de recurso; namespaced de propósito para não colidir
com o `data-dimensao-acessibilidade` reservado a 05-06) · `data-continue`
(`carregando`/`vazio`/`com-itens`) · `data-retomada` · `data-descarte` · `data-corte` ·
`data-recorte-n` · `data-recorte-vazio` · `data-categoria-do-item` ·
`data-recurso-em-evidencia` + `data-estado` · `data-ligacao` · `data-sem-ligacao` ·
`data-fonte` · `data-resumo` · `data-registro` · `data-desfazer`.

---

## O protocolo de disco — resultado

**Nenhum arquivo leu zero byte nesta execução.** Conferência antes de editar, disco contra
`git show HEAD:<caminho>`:

```
OK src/app/(app)/play/page.tsx (699)        OK src/estilos/play.css (1933)
OK src/componentes/ficha-acessibilidade.tsx (6555)
OK src/componentes/capa-sem-imagem.tsx (6020)
```

Nenhuma restauração foi necessária. Depois de cada commit, cada arquivo conferido **no
git**, não só no disco:

| arquivo | bytes no git |
|---|---|
| `src/dados/play.ts` | 18.122 |
| `src/dados/play-wire.ts` | 8.465 |
| `src/componentes/play.tsx` | 18.956 |
| `src/componentes/player.tsx` | 14.750 |
| `src/app/(app)/play/page.tsx` | 801 |
| `src/app/(app)/play/[slug]/page.tsx` | 5.128 |
| `src/estilos/play.css` | 9.183 |

As três adulterações do teste de quebra-alto foram desfeitas com conferência de bytes
(`18122 → 18122`). Os três commits foram empurrados para `espelho` imediatamente.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1 | `play.ts` + `play-wire.ts` — as 529, as 9 categorias, a ponte de 14 | `6bf1022` | 2 |
| 2 | `/play` — o catálogo unificado, o filtro honesto, «continue de onde parou» | `ac577af` | 3 |
| 3 | `/play/[slug]` — 529 players, sem arquivo, conclusão por gesto humano | `0abb35e` | 3 |

---

## O que NÃO foi feito, e é de propósito

- **`src/app/globals.css`, `src/estilos/web.css` e `src/contexto/sessao.tsx` não foram
  abertos.** `git diff` contra os três sai vazio.
- **`scripts/` não foi tocado.** O gate 8 de `verificar-fase3` e o gate de total de páginas
  de `verificar-fase4` continuam vermelhos, e são de 05-08.
- **Nenhuma aresta foi autorada.** `dados/` intacto, `gerar-grafo` não rodado.
- **Nenhum pacote instalado.** `package.json` intocado — nenhum reprodutor de terceiros.
- **`state.update-progress` e `state.record-metric` não foram rodados**, pelo aviso
  registrado quatro vezes.
- **A sonda descartável foi apagada.** `scripts/sonda-05-07.ts` não existe mais; as sondas
  `05-03`, `05-04`, `05-05` e `05-06` que aparecem em `git status` são dos irmãos da onda,
  ainda em execução, e não foram tocadas.

## Known Stubs

Nenhum. Os dois vazios da tela — «continue de onde parou» num navegador limpo e o bloco de
ligação nas 515 mídias sem ponte — não são stub: são **estados declarados e explicados**,
medidos por gate, e sumir com eles é justamente o que o plano proíbe.

## Threat Flags

Nenhuma superfície nova fora do registro do plano.

| ameaça | como foi provada |
|---|---|
| T-05-33 (carregamento remoto) | varredura das **529** páginas exportadas: 0 `<iframe>`, 0 `<video>`/`<audio>` remoto, 0 `<img>` remoto, 0 `preconnect`. E 0 externas medidas de dentro da página nas duas telas |
| T-05-34 (autorar aresta) | **nenhuma aresta criada**; a ponte é 34/14 e a tela declara 14 de 529 |
| T-05-35 (três recortes equivalentes) | número ao lado dos três **antes** da marcação; `data-nao-sustenta` nos dois zerados; vazio explicado em 173 caracteres |
| T-05-36 (conclusão automática) | `data-assistido=1` aparece **0 vezes** nas 529 páginas exportadas; passa a 1 só depois do clique |
| T-05-37 (storage adulterado) | os dois casos exercitados: valor não-lista e id inexistente; tela de pé, descarte declarado |
| T-05-38 (estourar o teto) | fio em **78.667 de 102.400**, conferido a cada build com falha nomeada; chunks em **1.241 KB de 1.600** |
| T-05-SC (pacote) | **zero dependência nova.** `package.json` intocado |

## Fotos

Guardadas **fora do repositório**, em `/tmp/capturas-05-07/`:

- `05-07-play-app.png` — o catálogo na moldura, os chips com as contagens, Libras 3 de 529
- `05-07-play-web.png` — a grade de 4 colunas, o bloco de ponte com os 4 denominadores
- `05-07-player.png` — a mídia, o crédito e o bloco «Por que não há player de verdade aqui»
- `05-07-player-recursos.png` — os 3 recursos em evidência, a ficha das 8 e «Concluída»

## Next Phase Readiness

1. **05-08 acrescenta `play/<slug>` (+529)** à lista de explicáveis do gate de total de
   páginas de **`verificar-fase4`**, sem mover o limiar de 1.784. A conta: resíduo 2316 −
   1784 = 532, dos quais 529 são deste plano.
2. **05-08 reancora o gate 8 de `verificar-fase3` em `c90fc9b`**, como 05-01 já pediu.
3. **`src/dados/play-wire.ts` precisa entrar na varredura de 05-08** — não está no
   `files_modified` do plano.
4. **`vejaIsto(eventoId)` está pronto** para a página do evento oferecer «não pode ir? veja
   isto» com lastro nos 25 eventos alcançados.
5. **O defeito de slug do gerador** (8 de 529 malformados, um com o título enxertado)
   merece registro para quem for regerar o grafo — não foi corrigido aqui porque `dados/` é
   somente-leitura neste plano.

## Self-Check: PASSED

Os 7 arquivos declarados existem, leem, e batem byte a byte com o git. Os três commits
existem no git e no espelho. `scripts/sonda-05-07.ts` não existe mais.
