# PRD — S5 · Editor / Curador

**Onda 2 · sessão 2 de 4.** Superfície: **Redação**.

> **Bloqueio de partida.** A S3 · Moderação extrai `src/dados/moderacao.ts` de `redacao.ts`
> na primeira tarefa dela. **Não comece antes desse commit** — confira no `PAINEL.md`. O que
> sobra em `redacao.ts` depois do split é seu: editor de trilha, catálogo de arrasto,
> sugestão de próximo passo.

---

## 0. Objetivo

Construir a superfície onde a curadoria é **autoria**, não seleção.

**Critério de pronto.** Um avaliador senta na frente da tela e consegue: montar uma trilha
arrastando entidades de qualquer classe, escrever o motivo de cada passo e ver esse mesmo
texto aparecer como selo público, aceitar ou descartar a sugestão do sistema entendendo que
ela é travessia e não modelo, autorar uma ponte de sentido entre duas entidades e assiná-la,
promover uma linguagem ao vocabulário, e agendar a publicação. Recarregar preserva. Um botão
reinicia a demonstração.

**O que esta sessão prova.** Que existe curadoria humana com poder real — incluindo o poder
de sobrepor o algoritmo — e que toda afirmação editorial é assinada e rastreável.

---

## 1. Análise ontológica do Editor

### 1.1 O Editor é o único nível que autora sentido

Os outros sete escrevem fato, decisão ou regra. O Editor escreve **afirmação**.

| Nível | O que escreve |
|---|---|
| Produtor | fato — fulano se apresenta sábado |
| Moderador | decisão — aprovado, com autor |
| Admin | regra — o limiar é 0,65 |
| **Editor** | **afirmação — o rap dialoga com o slam** |

Essa distinção não é retórica: ela é a linha ética que o projeto já traçou e documentou.
Autorar a ponte cultural rap→slam é **afirmação editorial, rotulada e defensável**; autorar
elenco seria **afirmação factual falsa sobre pessoas reais**. A equipe recusou a segunda e
manteve a primeira. **É essa fronteira que o Editor opera.**

### 1.2 O que ele escreve, medido

| Elemento | Hoje | Observação |
|---|---:|---|
| `trilha` | **1** | uma trilha autorada no grafo inteiro |
| `conteudo` | 1.805 | notícia, coluna, entrevista, vídeo, podcast |
| `publicacao` | 46 | publicação e pesquisa |
| `termo` | 481 | o tesauro |
| `linguagem` | 33 | **4 promovidas** da Enciclopédia |
| `tema` | 94 | tag livre do CMS, sem vocabulário controlado na fonte |
| `aprofunda` | 887 | conteúdo → entidade |
| `dialoga_com` | 31 | ponte de sentido |
| `fala_sobre` | 39 | |
| `contextualiza` | 4 | |
| `influenciou` | **0** | declarada e vazia |
| `deriva_de` | **0** | declarada e vazia |
| `curou` | **0** | declarada e vazia |

**Três relações do vocabulário fechado existem no tipo, valem para o motor de caminhada, e
ninguém as escreve.** São todas do Editor, e todas são afirmação de sentido.

### 1.3 O peso desproporcional

O grafo tem **81 arestas `autorado` em 66.563** — 0,12%. E **47 nós autorados em 7.810.**

A saída do Editor é minúscula em volume e enorme em peso: é a única parte do grafo que
afirma algo que nenhuma fonte disse. Por isso cada uma carrega assinatura, e por isso o
`motivo` é obrigatório por tipo, não por disciplina.

### 1.4 A regra que atravessa a sessão inteira

`REGRA_DO_MOTIVO_OBRIGATORIO`, que já está no código:

> *"Um passo sem motivo escrito impede a publicação da trilha inteira. O motivo não é nota
> interna: é o texto que aparece ao público como selo do passo em Descobrir, e uma trilha que
> publica um selo em branco entrega ao leitor uma ponte sem explicação."*

E o mecanismo que garante que os dois textos batem não é disciplina — é construção.
`PassoDoEditor.motivo` **é o mesmo objeto** `PassoTrilha.motivo` que `/trilha/[slug]/`
imprime. Não é cópia, não é reformatação, não tem prefixo. O comentário do módulo é explícito
sobre por quê: *"concordância por cópia é concordância até a próxima edição."*

**Não reimplemente a travessia.** Construa sobre `passosDaTrilha` e `trilhaCompletaPorSlug`.

### 1.5 O que o Editor não faz

- **Não modera.** A fila é da S3. O Editor **recebe** o termo encaminhado (118) e decide se
  entra no tesauro — mas não decide se o conteúdo publica.
- **Não declara fato.** Não escreve elenco, data, preço nem acessibilidade. Isso é do
  produtor, e a fronteira é a linha ética da seção 1.1.
- **Não edita verbete da Enciclopédia livremente.** `pessoa`, `coletivo` e `obra` são
  autoridade a montante. O Editor autora **sobre** eles, não **dentro** deles.

---

## 2. A herança: o que já existe

Depois do split da S3, `redacao.ts` fica com o editor de trilha — e ele já é sofisticado.

| Peça | O que é |
|---|---|
| `PassoDoEditor` | passo com `motivo` **compartilhado com o selo público** |
| `TrilhaDoEditor` | trilha com publicabilidade pelas quatro regras |
| `passosParaEditor()` | construído **sobre** `passosDaTrilha`, não reimplementado |
| `trilhaEhPublicavel()` | motivo em branco · cadeia vazia · não termina em evento · evento sem sessão datada |
| `SugestaoDeProximoPasso` | travessia do grafo, com a regra ao lado |
| `REGRA_DA_SUGESTAO` | *"é TRAVESSIA DO GRAFO, não modelo"* |
| `catalogoParaArrastar()` | 150 candidatos de 7.810, com regra declarada |
| `REGRA_DO_CATALOGO` | por que 150, e por que a tela diz «N de 7.810» |
| `TETO_DO_CATALOGO` | 150, medido contra o orçamento de 60 KB |
| `CLASSES_DO_CATALOGO` | 17 classes; `ocorrencia`, `pessoa-usuaria` e `repertorio` ficam fora |
| `REGRA_DO_MOTIVO_OBRIGATORIO` | o motivo é o selo público |

Duas notas que valem mais que o resto.

**A sugestão é determinística e descartável.** `REGRA_DA_SUGESTAO`: *"a partir do último nó
da cadeia, o vizinho de maior preferência de relação que ainda não está na trilha, com a
frase da própria ligação como justificativa. É determinística — a mesma trilha produz sempre
a mesma sugestão — e é sempre descartável: nenhuma sugestão entra na trilha sem um clique
humano."* **Não substitua por modelo.**

**O catálogo diz «N de 7.810», nunca «o grafo completo».** `REGRA_DO_CATALOGO` fecha com:
*"dizer «completo» sobre um recorte seria a mentira barata que esta obra recusa."* A regra do
recorte é declarada: resumo com 60+ caracteres e grau 2 ou mais.

---

## 3. Restrições herdadas

Seção 13 de `ONTOLOGIA-E-ACESSOS.md`. As que mais atingem esta sessão:

- **DP-F** — `redacao.ts` alcança 23 MB de grafo. O catálogo viaja achatado, com teto medido.
  Nenhum `"use client"` importa o módulo por valor.
- **O motivo é o mesmo objeto dos dois lados.** Não copie, não reformate, não prefixe.
- **Sem relógio, sem sorteio.** `CARIMBO_DA_DECISAO` deriva de `DATA_DE_REFERENCIA`.
- **Duas visões, um componente.** `desk:` é `[data-view="web"]`, não media query.
- **Só sua pasta:** `(bastidor)/redacao/`, `componentes/redacao-*`, o que sobrou de
  `src/dados/redacao.ts`, `src/estilos/redacao.css` — que **já existe e já está importado**
  em `globals.css:80`. Você não toca no arquivo de colisão.

---

## 4. Escopo — funcionalidades 126 a 138

| # | Funcionalidade | Tela |
|---|---|---|
| 126 | Trilha curada assinada | E1 |
| 127 | Destaque que sobrepõe o algoritmo | E2 |
| 128 | Arestas de sentido: `influenciou` `dialoga_com` `deriva_de` `curou` | E3 |
| 129 | `semelhante_a` autorada com motivo legível | E3 |
| 130 | Tesauro — promover, fundir, sinonímia, hierarquia | E4 |
| 131 | Ligação editorial: `aprofunda` `fala_sobre` `contextualiza` | E5 |
| 132 | Notícia, coluna, entrevista, publicação, pesquisa | E5 |
| 133 | Especiais nomeados como trilha | E6 |
| 134 | Verbete e página de movimento | E5 |
| 135 | Disposições de entrada | E7 |
| 136 | Calendário editorial e agendamento | E8 |
| 137 | Newsletter e comunicação editorial | E8 |
| 138 | Feedback que retroalimenta o modelo | E7 |

---

## 5. As telas

Nove: uma estendida e oito novas.

---

### E1 · Editor de trilha curada
`(bastidor)/redacao/trilha` — **estende a tela 35 existente**

**Objetivo.** A curadoria como autoria. É a tela âncora da sessão.

**Escreve.** `trilha` · passos com `motivo` · assinatura · agendamento.

**Conteúdo herdado, que fica.** Montagem por arrasto sobre o catálogo de 150 · campo
obrigatório de motivo por passo · sugestão de próximo passo com a regra ao lado · as quatro
regras de publicabilidade · assinatura do curador.

**O que a S5 acrescenta.**
- **Prévia na visão mobile** — o selo do passo como o público vai ver, lado a lado com o
  campo que o produz. É a prova visual de D-85: os dois textos são o mesmo objeto
- Reordenar passos, com recálculo da publicabilidade ao vivo
- Título e resumo da trilha
- **Agendamento de publicação** (136), integrado ao calendário da E8
- O contador honesto do catálogo: **«N de 7.810»**, com a regra do recorte por extenso

**Estados.** Trilha vazia · com passo sem motivo (não publica, e diz por quê) · cadeia que
não termina em evento · evento sem sessão datada · publicável.

**Regra dura.** As quatro regras de publicabilidade vêm de `trilhaEhPublicavel`, da fase 2.
**Não as reescreva aqui.**

**App.** Passos em lista; catálogo em folha; motivo em campo expandido.
**Web.** Três colunas: catálogo · trilha · prévia mobile do selo.

---

### E2 · Destaque do feed
`(bastidor)/redacao/destaque`

**Objetivo.** A curadoria humana com poder de **sobrepor o algoritmo**.

**Escreve.** o cartão `curado` do feed · autoria.

**Conteúdo.**
- **Exatamente 1 destaque por feed** — `TipoCartaoEspecial = "serendipidade" | "curado"`. O
  teto é o produto: um destaque por feed é curadoria, dez é editorial disfarçado de algoritmo
- O que o destaque **substituiu** na caminhada — a tela mostra o cartão que saiu
- Assinatura obrigatória: o destaque aparece ao público como escolha da Redação
- A serendipidade ao lado, para contraste: 1 cartão fora do alcance da caminhada, e ela
  **não** é curada — é dosada pelo motor, e o parâmetro é do Admin
- Agendamento

**A declaração.** O destaque é a única coisa no feed que uma pessoa escolheu. Por isso ele é
assinado, e por isso é um só.

**App.** Cartão do destaque em cima, substituído embaixo.
**Web.** Destaque à esquerda, feed resultante à direita.

---

### E3 · Arestas de sentido
`(bastidor)/redacao/pontes`

**Objetivo.** Onde o Editor afirma. É a tela mais delicada da sessão.

**Escreve.** `influenciou` · `dialoga_com` · `deriva_de` · `curou` · `semelhante_a` autorada.

**O estado, medido.** `influenciou`, `deriva_de` e `curou` têm **zero instâncias**. Estão no
vocabulário fechado, o motor de caminhada as percorre, e ninguém as escreveu. Esta tela é o
que as tira do zero — e é o que faz a funcionalidade 36, *linha do tempo e mapa de
influências*, sair de `falta`.

**Conteúdo.**
- Escolha das duas pontas no catálogo, com a classe declarada
- Escolha da relação, do **vocabulário fechado de 14**. Não existe relação livre
- **`motivo` obrigatório**, em português legível — o tipo obriga em `semelhante_a`, e esta
  tela obriga em todas, porque afirmação sem justificativa não é curadoria
- Assinatura e carimbo
- Prévia do selo público, como na E1
- **O contador de peso:** 81 arestas autoradas em 66.563. Cada uma que você escreve entra
  nessa fatia, e a fatia é auditada no Observatório

**A frase que a tela precisa imprimir.** Autorar uma ponte de sentido é afirmação editorial,
rotulada e defensável. Autorar fato sobre pessoa real seria outra coisa — e esta tela não faz
isso.

**App.** Duas pontas em cima, relação e motivo embaixo.
**Web.** Pontas lado a lado, motivo e prévia à direita.

---

### E4 · Tesauro
`(bastidor)/redacao/tesauro`

**Objetivo.** A camada 0 da ontologia, que hoje não tem dono.

**Escreve.** promove linguagem · funde termo · declara sinonímia e hierarquia.

**Conteúdo.**
- 33 linguagens · 94 temas · 481 termos
- **As quatro promovidas, nomeadas:** `arte`, `gestao-cultural`, `radio`, `tv`. Vieram da
  Enciclopédia e não existem nas 29 do CMS. A tela precisa contar por quê: *mapear
  `Rádio → audiovisual` seria fabricar classificação*
- Promover novo candidato — vindo da moderação (118) ou do produtor
- Fundir termo, com o que a fusão alcança contado antes de confirmar
- Sinonímia e hierarquia
- `aliasDeLinguagem` e os 76 slugs desambiguados
- **A cor da linguagem é dado, não estilo.** Promover uma linguagem exige atribuir cor do
  manual, e a mesma cor aparece no cartão, no mapa e no indicador

**A separação.** Quem **aprova** a promoção é o Admin (100). Quem promove é você. Sem isso, o
administrador vira curador por acidente.

**App.** Lista por classe de vocabulário.
**Web.** Vocabulário à esquerda, o que a mudança alcança à direita.

---

### E5 · Redação editorial
`(bastidor)/redacao/materia`

**Objetivo.** As classes de conhecimento — 1.805 conteúdos e 46 publicações.

**Escreve.** `conteudo` · `publicacao` · verbete · `aprofunda` · `fala_sobre` ·
`contextualiza`.

**Conteúdo.**
- Notícia, coluna, entrevista, publicação, pesquisa (132)
- **Ligação editorial como aresta, não como etiqueta** (131) — é a diferença que faz
  «Aprofunda isto» funcionar a partir de qualquer evento ou obra. `aprofunda` tem 887
  instâncias e é a mais usada das três
- Verbete e página de movimento (134). `movimento` não é classe: é `termo`
- Imagem com crédito obrigatório
- Assinatura e agendamento

**A fronteira.** Verbete da Enciclopédia é autoridade a montante. O que se escreve aqui é
**conteúdo editorial que fala sobre** o verbete, não o verbete.

**App.** Formulário em coluna; ligações em folha.
**Web.** Texto à esquerda, ligações e prévia à direita.

---

### E6 · Especiais
`(bastidor)/redacao/especiais`

**Objetivo.** A funcionalidade 39, hoje `parcial`: *"trilha existe; especiais nomeados,
não"*.

**Escreve.** trilha com identidade de especial · agrupamento.

**Conteúdo.**
- Especial como trilha nomeada, com capa e resumo próprios
- Os três já citados no acervo: Ancestralidade, Arte e Acesso, Mekukradjá
- Vários conteúdos e trilhas sob um mesmo especial
- Assinatura e agendamento

**App.** Lista de especiais.
**Web.** Especial à esquerda, conteúdos reunidos à direita.

---

### E7 · Motor editorial
`(bastidor)/redacao/motor`

**Objetivo.** Duas coisas que parecem de sistema e são editoriais.

**Escreve.** disposições · feedback ao modelo.

**Conteúdo.**
- **As 5 disposições de entrada** (135), todas `procedencia: "autorado"`: *quero ser
  surpreendida* · *tenho pouco tempo* · *vou com criança* · *quero algo de graça* · *quero
  conhecer algo que nunca vi*
- Cada uma com `tipo` (peso ou corte), `campoLido`, `explicacao` e **`ausencia`**
- **A que precisa de atenção:** *vou com criança* tem `campoLido: null` e o texto *"o acervo
  não declara faixa etária nem classificação indicativa em campo nenhum"*. Quando o produtor
  passar a declarar (funcionalidade 158), essa disposição liga — e é aqui que se liga
- Criar disposição nova exige escrever a explicação **e** o texto de ausência. O tipo obriga
- **Feedback ao modelo (138)** — as decisões da moderação como sinal. Painel de leitura: o
  que a fila rejeitou, agrupado, e o que isso sugere ajustar

**Regra dura.** Escrever a explicação sem escrever a ausência não salva. Uma disposição que
corta sem dizer o que não sustenta é o filtro silencioso que a proposta recusa.

**App.** Disposições em lista, edição em folha.
**Web.** Disposição à esquerda, explicação e ausência à direita.

---

### E8 · Calendário editorial
`(bastidor)/redacao/calendario`

**Objetivo.** Agendamento e comunicação (136, 137).

**Escreve.** agendamento · pauta de newsletter.

**Conteúdo.**
- Grade por semana com trilhas, destaques, matérias e especiais agendados
- Conflito de agendamento marcado — dois destaques no mesmo feed é o erro que a grade pega
- **Newsletter (137)** — pauta, prévia e agendamento. **A autorização de disparo é do Admin
  (98)**; a pauta é sua. A tela declara a separação
- Envio em massa é irreversível: a tela exige confirmação nomeada

**App.** Lista por dia.
**Web.** Grade semanal com coluna fixa.

---

### E9 · O que eu assinei
`(bastidor)/redacao/assinaturas`

**Objetivo.** A contrapartida da M9. Curadoria é autoria, e autoria responde.

**Escreve.** nada.

**Conteúdo.**
- Toda afirmação assinada por você: trilhas, destaques, arestas de sentido, promoções de
  termo, matérias
- **A fatia autorada do grafo**: 81 arestas em 66.563, 47 nós em 7.810 — e quanto disso é seu
- Filtro por tipo de afirmação e por período
- `rotaDoOutroLado`: onde a afirmação aparece ao público

**A diferença para a M9.** O moderador registra **decisões sobre o trabalho de outros**. O
editor registra **afirmações próprias**. Uma auditoria procura coisas diferentes em cada uma.

**App.** Lista cronológica.
**Web.** Tabela densa com a fatia autorada em painel.

---

## 6. Responsividade

Seção 8 do PRD da S7 e seção 13 do documento de contexto.

**Padrão desta sessão, e ele é próprio:** a visão web precisa de **três colunas** na E1 —
catálogo, trilha e prévia mobile do selo. É a única tela do projeto que mostra as duas visões
ao mesmo tempo, e é de propósito: o curador escreve o motivo vendo o selo que o público lê.

No app, a prévia sobe em folha.

Catálogo, calendário e tabela de assinaturas rolam **dentro do contêiner**.

---

## 7. Lacunas de contrato

| Tipo | Por quê |
|---|---|
| `ArestaAutorada` | duas pontas, relação do vocabulário fechado, motivo, assinatura, carimbo |
| `Destaque` | feed alvo, cartão substituído, assinatura, agendamento |
| `Especial` | trilha com identidade própria e conteúdos reunidos |
| `MudancaDeTesauro` | promover, fundir, sinonímia — com o alcance contado antes de confirmar |
| `ItemAgendado` | tipo, alvo, data, autor |

`ArestaAutorada` precisa obrigar `motivo` **em todas as relações**, não só em
`semelhante_a`. O tipo base obriga só nela; a curadoria obriga em todas, e o tipo desta
sessão deve refletir a regra mais dura.

---

## 8. Fora de escopo

- Autenticação real. `CURADOR_AUTORADO` é o padrão, e a tela diz que o perfil é autorado
- Back-end, banco, API
- **A fila de moderação** — foi para `moderacao.ts` na S3
- **Declarar fato**: elenco, data, preço, acessibilidade. É o produtor
- **Aprovar a própria promoção de termo** — quem aprova é o Admin (100)
- **Disparar newsletter** — a autorização é do Admin (98)
- Editar verbete da Enciclopédia. Autora **sobre**, não **dentro**

---

## 9. Portões de verificação

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs`
3. Suíte nova `scripts/verificar-redacao.mjs`:
   - **o motivo do editor e o selo público são o mesmo texto, caractere a caractere** — é o
     portão central da sessão
   - trilha com passo sem motivo não publica
   - as quatro regras de publicabilidade vêm de `trilhaEhPublicavel`, não reescritas
   - toda aresta autorada tem motivo e assinatura
   - a sugestão de próximo passo é determinística — a mesma trilha, a mesma sugestão
   - nenhuma sugestão entra na trilha sem clique
   - o catálogo diz «N de 7.810», nunca «completo»
   - disposição sem texto de ausência não salva
   - exatamente 1 destaque por feed
4. `TETO_DO_CATALOGO` — o catálogo achatado continua em 150 e dentro do orçamento
5. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
6. Zero erro de console numa navegação completa, nas duas visões

---

## 10. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | Conferir o split da S3 e reancorar o que sobrou de `redacao.ts` | commit da S3 |
| 2 | **E1** trilha — com a prévia mobile do selo | 1 |
| 3 | **E3** arestas de sentido | 2 |
| 4 | **E9** o que eu assinei | 3 |
| 5 | **E2** destaque | 2 |
| 6 | **E4** tesauro | 1 |
| 7 | **E5** redação editorial | 1 |
| 8 | **E7** motor editorial | 6 |
| 9 | **E6** especiais · **E8** calendário | 2, 7 |
| 10 | Suíte e medidas | 9 |

**Comece pela E1.** Ela fixa o mecanismo que a E3 e a E5 copiam: motivo obrigatório, prévia
do selo público, assinatura. E é onde o portão central da sessão — os dois textos batendo
caractere a caractere — se estabelece.

Tarefas 5, 6 e 7 são independentes entre si.

Se o prazo apertar, o corte é: E6, E8, E9. **E1, E3, E4 e E2 não se cortam** — são a trilha
assinada, as três relações que saem do zero, a camada 0 sem dono e o poder de sobrepor o
algoritmo. Sem as quatro, a Redação vira um CMS com nome bonito.
