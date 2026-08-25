# PRD — S3 · Moderação

**Onda 1 · sessão 2 de 2.** A S7 · Studio · Produtor envia; esta sessão decide.

> **A S4 foi dissolvida nesta.** O escopo de curadoria — nacional, territorial, por
> linguagem — já está construído em `ESCOPOS_DE_CURADORIA` e `itemNoEscopo`. Mantê-lo como
> sessão separada colocaria duas sessões na mesma pasta, que é a colisão que o merge não
> resolve. A S3 cobre **108 a 125**.

---

## 0. Objetivo

Construir a superfície onde o conteúdo submetido é **aprovado, editado, vetado ou
devolvido** — sempre com autor, sempre com carimbo, e com motivo obrigatório onde a decisão
encerra o assunto.

**Critério de pronto.** Um avaliador senta na frente da tela e consegue: ver a fila com a
origem declarada de cada item, abrir um item e conferir campo a campo, entender o score da
IA refazendo a conta a olho, vetar com motivo, devolver ao produtor, trocar de escopo sem
trocar de URL, e ver a decisão registrada no histórico. Recarregar preserva. Um botão
reinicia a demonstração.

**O que esta sessão prova.** A resposta do protótipo à pergunta mais difícil do RFP: **onde
a IA não deve ser utilizada.** A resposta não é frase de rodapé — é a forma do dado. Só
itens de origem `ia` têm score; o score é a fração de cinco perguntas conferíveis; e a
aprovação humana é a única porta pela qual uma sugestão de IA vira dado público.

---

## 1. Restrições herdadas — não negociáveis

Idênticas às da S7, e estão na seção 13 de `ONTOLOGIA-E-ACESSOS.md`. As que mais atingem
esta sessão:

### 1.1 DP-F, e aqui ela é mais apertada que na S7
`src/dados/redacao.ts` alcança 23 MB de grafo. **Nenhum arquivo `"use client"` pode
importá-lo por valor** — só `import type`. A página de servidor achata a fila inteira em
primitivo e passa adiante.

O teto está medido e é um portão: **`TETO_DO_DTO = 61.440` bytes, ocupação atual 56.615.**
Todo campo novo que você acrescentar ao item da fila come dessa margem de 4.825 bytes. Se
estourar, achate — não aumente o teto.

Há precedente na casa para como achatar: `PROCEDENCIA_DA_ATRIBUICAO` virou constante de
módulo porque, como campo por item, custava 2,2 KB para afirmar sessenta vezes a mesma
coisa.

### 1.2 Regra é dado, não código
`Escopo.campo` manda o **nome do campo** (`"todos" | "territorio" | "linguagens"`), não a
função. O comentário do módulo explica: o cliente não pode importar `itemNoEscopo` por
valor, e reescrever a regra lá criaria a segunda cópia que diverge em silêncio.

**Vale para tudo que você acrescentar.** Toda regra que os dois lados precisam conhecer
viaja como dado.

### 1.3 Sem relógio, sem sorteio
`CARIMBO_DA_DECISAO` deriva de `DATA_DE_REFERENCIA`. `localStorage` só em `useEffect`.

### 1.4 Duas visões, um componente
`desk:` é `[data-view="web"]`, não media query. Componente irmão por visão é proibido.

### 1.5 Ausência é declarada, com denominador
`declaracoesDaRedacao()` já é o mecanismo. Todo campo que o mock não sustenta entra ali,
não some.

---

## 2. A herança: o que já existe, e é muito

`src/dados/redacao.ts` tem 1.100+ linhas e já modela a moderação quase inteira. **Leia antes
de escrever qualquer coisa.**

| Peça | O que é |
|---|---|
| `filaDaRedacao()` | 60 itens, **20 por origem** |
| `OrigemDoItem` | `produtor` (`evento:cms:*`) · `ingestao` (`evento:enc:*`) · `ia` |
| `ORIGENS_DECLARADAS` | a **regra determinística** que atribuiu cada origem, por extenso |
| `COMPONENTES_DO_SCORE` | 5 perguntas × 0,2, todas sobre a ficha da própria entidade |
| `REGRA_DO_SCORE` | o texto que torna o número conferível a olho |
| `distribuicaoDeScore()` | as faixas |
| `ACOES_DA_REDACAO` | aprovar · editar · vetar · devolver |
| `FRASE_DA_ASSIMETRIA` | por que só o veto exige motivo |
| `ESCOPOS_DE_CURADORIA` | nacional · territorial · linguagem, com **alcance medido** |
| `itemNoEscopo()` | o despachante, servido como dado |
| `LIMITES_DA_IA` | o que a IA nunca propõe publicar |
| `PROCEDENCIA_DA_ATRIBUICAO` | `"autorado"` — a atribuição é nossa, e a tela diz |
| `REGRA_DA_AMOSTRAGEM` · `POR_QUE_RODIZIO_NA_IA` | como os 60 foram escolhidos |
| `CARIMBO_DA_DECISAO` · `CURADOR_AUTORADO` | autoria e carimbo |
| `declaracoesDaRedacao()` | o que o acervo não sustenta |

O score merece nota. `REGRA_DO_SCORE` diz: *"NÃO vem de modelo, de popularidade nem de
sorteio: é a fração de cinco perguntas objetivas respondidas pela própria ficha"* — resumo
com 120+ caracteres, imagem, crédito, duas linguagens, URL de origem. **Não substitua isso
por modelo.** É o argumento inteiro da tela.

E a assimetria das ações é produto, não detalhe: *"vetar é a única ação que encerra o assunto
sem devolver a palavra a quem submeteu, e é por isso que ela é a única que deve explicação
por escrito."*

---

## 3. A separação de território — faça primeiro

Hoje a fila de moderação mora dentro da Redação, que é território da **S5 · Editor** na onda
2. `redacao.ts` mistura as duas superfícies. **Separe antes de construir**, para a S5 não
colidir depois:

| De | Para | Conteúdo |
|---|---|---|
| `redacao.ts` linhas ~1–790 | **`src/dados/moderacao.ts`** | fila, score, origens, ações, escopos |
| `redacao.ts` linhas ~795–fim | permanece | editor de trilha, catálogo de arrasto — é da S5 |
| `(bastidor)/redacao/fila/` | **`(bastidor)/moderacao/fila/`** | a tela 34 |
| `componentes/redacao-fila.tsx` | **`componentes/moderacao-fila.tsx`** | |
| — | **`src/estilos/moderacao.css`** | folha nova |

`globals.css` precisa de **uma linha de `@import`** para a folha nova. É a única sessão da
onda 1 que toca esse arquivo — a S7 não precisa, porque `studio.css` já está declarado.
**Faça essa linha na primeira tarefa e commite sozinha**, para o conflito não existir.

Reexporte de `redacao.ts` o que a S5 ainda usa, para não quebrar `redacao/trilha`.

---

## 4. A integração com a S7 — o laço que fecha a onda 1

A S7 escreve `RascunhoDoProdutor` com `situacao: "em-moderacao"` em `localStorage`, chave
`studio.v1`. **Esta sessão lê o mesmo armazém e escreve de volta a decisão.**

| | |
|---|---|
| Contrato | `src/dados/tipos-acesso.ts`, criado pela S7 |
| Chave | `studio.v1` |
| S3 lê | registros com `situacao: "em-moderacao"` |
| S3 escreve | `situacao` → `publicado` \| `devolvido` \| `suspenso`, e a entrada de histórico |

**Dependência dura:** você não começa a tarefa de estado antes de `tipos-acesso.ts` estar
commitado pela S7. Até lá, construa contra a fila do build, que é independente e já existe.

A fila passa a ter **duas fontes**: os 60 itens encenados do acervo e os registros vivos que
o produtor enviou. As duas convivem na mesma lista, com a origem declarada de cada uma.

---

## 5. Escopo — funcionalidades 108 a 125

| # | Funcionalidade | Tela |
|---|---|---|
| 108 | Fila com origem declarada por item | M1 |
| 109 | Aprovação e veto com motivo obrigatório e autoria | M1, M2 |
| 110 | Devolução ao produtor com pedido nomeado | M2 |
| 111 | Revisão da IA item a item, com score e regra ao lado | M3 |
| 112 | Revisão de `semelhante_a` por regra e por amostra | M4 |
| 113 | Duplicata entre organizações distintas | M7 |
| 114 | Direitos e crédito de imagem | M2 |
| 115 | Direito de distribuição e download offline | M2 |
| 116 | Elenco declarado — barreira contra afirmação falsa | M5 |
| 117 | Reconciliação de agente com verbete da Enciclopédia | M6 |
| 118 | Encaminhamento de termo livre ao Editor | M2 |
| 119 | Conferência da classificação indicativa | M2 |
| 120 | Recepção e decisão de denúncia do público | M1 |
| 121 | Histórico das próprias decisões, auditável | M9 |
| 122 | Escopo impresso na própria tela | M1, M8 |
| 123 | Escalonamento do que cai fora do escopo | M8 |
| 124 | Fila priorizada por vazio, não por volume | M1, M8 |
| 125 | Delegação temporária de escopo | M8 |

---

## 6. A jornada

```
M1 fila ── escopo no topo, origem por item, prioridade por vazio
 │
 ├─ item de produtor ──► M2 ficha completa
 │                        ├─ aprovar   ──► publicado
 │                        ├─ editar    ──► ficha aberta, registrado
 │                        ├─ vetar     ──► MOTIVO OBRIGATÓRIO
 │                        └─ devolver  ──► volta ao Studio  ══► S7
 │
 ├─ item de IA ────────► M3 score com os 5 componentes marcados
 │                        └─ aprovar é a ÚNICA porta para dado público
 │
 ├─ elenco declarado ──► M5 conferência da afirmação sobre pessoa real
 ├─ proposta de agente ► M6 reconciliação com a Enciclopédia
 ├─ duplicata cruzada ─► M7 decisão entre organizações
 ├─ fora do escopo ────► M8 escalonamento
 └─ toda decisão ──────► M9 histórico, com autor e carimbo

M4 similaridade — trilho próprio, por regra e amostra, não por item
```

---

## 7. As três portas que chegam aqui

A S7 tem três portas de saída. **Duas desembocam nesta sessão** — e o que lá é *"aguardando"*
aqui é fila de trabalho.

| Chega do produtor | Tela | Decisão |
|---|---|---|
| pessoa ou obra proposta | M6 | reconciliar com verbete existente, criar, ou recusar |
| elenco declarado | M5 | confirmar ou recusar a afirmação factual |
| termo fora do vocabulário | M2 | encaminhar ao Editor — **não decidir** (118) |

A terceira porta — espaço inexistente — vai para a Organização, não para cá.

---

## 8. As telas

Nove: oito novas ou reformadas e uma estendida.

---

### M1 · Fila
`(bastidor)/moderacao/fila` — **migra e estende a tela 34 existente**

**Objetivo.** Onde o moderador chega e sabe o que é dele.

**Conteúdo herdado, que fica:** 60 itens em três origens · origem declarada com a regra por
extenso · score só nos de IA · quatro ações · escopo no topo, trocável sem navegar ·
`FRASE_DA_ATRIBUICAO` afirmando que a atribuição é autorada.

**O que a S3 acrescenta:**
- **Registros vivos da S7** misturados aos 60 encenados, com origem própria
- **Prioridade por vazio (124)** — ordenação que sobe o que vem de território sub-representado
  em vez do que tem mais volume. SP e RJ concentram 59% de 773 entidades em 2 dos 27 estados;
  ordenar por volume reproduziria o deserto na governança
- **Denúncia do público (120)** como quarta origem
- Contadores por escopo, medidos e não estimados
- Reiniciar demonstração

**Estados.** Fila cheia · fila do escopo vazia · só denúncias · nada pendente.

**App.** Lista de cartões; escopo em segmento no topo; ação em folha.
**Web.** Duas colunas: fila densa à esquerda, item selecionado à direita, sem navegar.

---

### M2 · Ficha do item
`(bastidor)/moderacao/item`

**Objetivo.** A decisão informada. É onde o moderador confere em vez de confiar.

**Escreve.** `situacao` · motivo · `EntradaDeHistorico`.

**Conteúdo.**
- Ficha campo a campo, **na ordem da ontologia**
- **A chave de identidade**, com os três componentes marcados como sustentado ou não
- **Direitos de imagem (114)** — crédito presente ou ausente; sem crédito não publica, e a
  tela diz por quê, não só bloqueia
- **Direito de distribuição e offline (115)** quando o item é mídia
- **Classificação indicativa (119)** — o moderador **confere o declarado, não arbitra**. A
  distinção é de responsabilidade: quem realiza o evento responde pela classificação
- **Termo fora do vocabulário (118)** — botão *encaminhar ao Editor*, nunca *criar termo*
- As quatro ações, com a assimetria visível: o botão de confirmar veto **não conclui com o
  campo de motivo vazio**
- Autor e carimbo em toda decisão

**A regra que define a tela.** Um veto sem motivo registrado é moderação silenciosa: some da
fila e ninguém consegue dizer por quê. O campo obrigatório não é fricção — é o argumento.

**App.** Rolagem única, ações ancoradas no rodapé da moldura.
**Web.** Ficha à esquerda, decisão e histórico à direita.

---

### M3 · Revisão da IA
`(bastidor)/moderacao/ia`

**Objetivo.** A tela que responde à pergunta do RFP sobre o limite da IA.

**Escreve.** aceita ou descarta a sugestão · registra a decisão.

**Conteúdo.**
- Os **cinco componentes do score marcados um a um**, com o que cada um observa na ficha
- `REGRA_DO_SCORE` por extenso, ao lado do número — quem confere a conta chega ao mesmo valor
- `LIMITES_DA_IA`: o que ela nunca propõe publicar, por mais que o grafo alcance
- Distribuição do score na fila, por faixa
- A frase que a tela existe para imprimir: **aprovar é a única porta pela qual uma sugestão
  de IA vira dado público**
- `POR_QUE_RODIZIO_NA_IA` — como os itens foram escolhidos

**Proibido.** Substituir os cinco componentes por modelo, popularidade ou sorteio. Um score
sem regra à vista é o recomendador opaco que a proposta recusa.

**App.** Score em destaque, componentes em lista.
**Web.** Componentes à esquerda, regra e distribuição à direita.

---

### M4 · Revisão de similaridade
`(bastidor)/moderacao/similaridade`

**Objetivo.** Governar 47.259 arestas sem fingir que se revisa uma a uma.

**Escreve.** aprova, ajusta ou reprova **regra**; marca aresta individual.

**O problema, medido.** `semelhante_a` é **71% do grafo** — 47.259 de 66.563 arestas, todas
de máquina, todas com `motivo` obrigatório, nenhuma revisada. Uma fila item a item levaria
anos. Fingir que revisou seria pior que não revisar.

**Conteúdo.**
- Agrupamento por **padrão de motivo** — as arestas compartilham famílias de justificativa
- Amostra por família, com tamanho e método declarados
- Aprovar, ajustar ou reprovar a família inteira, com autoria
- Aresta individual marcável quando o motivo não se sustenta
- Contador honesto: quantas arestas a decisão alcança, e **quantas seguem sem revisão**

**A declaração que a tela precisa imprimir.** Quantas foram revisadas sobre o total. Sem
denominador, "revisado" mente.

**App.** Famílias em lista, amostra em folha.
**Web.** Famílias à esquerda, amostra à direita.

---

### M5 · Elenco declarado
`(bastidor)/moderacao/elenco`

**Objetivo.** A contrapartida da P3 do Studio, e a barreira ética do sistema.

**Escreve.** confirma ou recusa a aresta `atua_em` com `papel`.

**Por que ela existe.** A equipe se recusou a autorar arestas de elenco no protótipo porque
*"autorar elenco seria uma afirmação factual falsa sobre pessoas reais"*. Quando o produtor
passa a declarar elenco, alguém precisa conferir — senão a plataforma publica, em nome do
Itaú Cultural, que uma pessoa real se apresentou onde não se apresentou.

**Conteúdo.**
- O vínculo declarado: agente, papel, evento, sessão
- O verbete da Enciclopédia embutido, para conferência
- Marca de **proposto** quando o agente não existe — vai para M6 antes de decidir
- Confirmar, ou recusar com motivo
- A frase que enquadra: o que se decide aqui é uma **afirmação sobre uma pessoa real**

**App.** Cartão por vínculo.
**Web.** Vínculo à esquerda, verbete à direita.

---

### M6 · Reconciliação com a Enciclopédia
`(bastidor)/moderacao/reconciliacao`

**Objetivo.** O único caminho de escrita sobre `pessoa`, `coletivo` e `obra` — funcionalidade
37, já provada na deduplicação em dois estágios.

**Escreve.** liga a proposta a verbete existente, ou encaminha a criação ao Editor.

**Conteúdo.**
- A proposta do produtor ao lado dos candidatos do acervo — **575 pessoas no protótipo,
  43.614 na base completa**
- Comparação campo a campo, no padrão de `CampoComparado` das duplicatas
- Reconciliar · criar (encaminha ao Editor) · recusar
- Aviso permanente: **verbete é autoridade da Enciclopédia.** A moderação liga, não edita

**App.** Proposta em cima, candidatos em lista.
**Web.** Duas colunas de comparação.

---

### M7 · Duplicatas entre organizações
`(bastidor)/moderacao/duplicatas` — **estende `studio/duplicatas`**

**Objetivo.** O que o produtor não pode decidir sozinho.

**Escreve.** decide `duplicata_suspeita` quando o grupo cruza organizações.

**O que já existe.** 84 grupos, dois estágios, comparação campo a campo, `LIMIAR_PROBABILISTICO
= 0,65`, e a distinção entre grupo `encenado`, `acervo` e `cruzado`.

**O que a S3 acrescenta.**
- Só os grupos que cruzam organizações distintas — os de uma organização são do produtor (163)
- Recusa do produtor escalada, com o motivo dele visível
- Decisão com autor e carimbo
- O achado que a tela deve continuar exibindo: grupos de origem `acervo` são **duplicata real
  encontrada em acervo real**, não plantada por nós

---

### M8 · Escopo e escalonamento
`(bastidor)/moderacao/escopo`

**Objetivo.** O que era a S4. Torna a moderação nacional possível sem centralizar em São Paulo.

**Escreve.** escalonamento · delegação temporária.

**Conteúdo.**
- Os três escopos com **alcance medido**: nacional, territorial, por linguagem
- **O escopo impresso (122)** — o moderador vê o que *não* está vendo, com o número
- **Escalonamento (123)** do que cai fora, com destinatário nomeado
- **Delegação temporária (125)** — férias, pico; com início, fim e quem assumiu
- **Prioridade por vazio (124)** — a configuração da ordenação, com a justificativa: 25 de 27
  unidades da federação no acervo, e 59% em duas

**App.** Escopo em segmento; delegação em folha.
**Web.** Mapa de cobertura à esquerda, delegações à direita.

---

### M9 · Meu histórico
`(bastidor)/moderacao/historico`

**Objetivo.** A moderação auditável por quem a exerce (121).

**Escreve.** nada. Lê o histórico.

**Conteúdo.**
- Toda decisão com autor, carimbo, ação, motivo e item
- Filtro por ação, origem e escopo
- Vetos separados, com o motivo por extenso — é o que uma auditoria procura primeiro
- `rotaDoOutroLado`: para onde a decisão foi, do lado de quem recebeu
- Declaração: o histórico é do moderador. **Medir desempenho entre moderadores é a
  funcionalidade 169, e é do Admin — não desta tela**

**App.** Lista cronológica.
**Web.** Tabela densa com filtros em coluna fixa.

---

## 9. Responsividade

Idêntica à S7, e as regras estão na seção 8 do PRD dela e na 13 do documento de ontologia.

**Padrão desta sessão:** app é uma coluna e a decisão sobe em folha; web é duas colunas com
o item selecionado à direita, **sem navegar** — trocar de item e de escopo sem trocar de URL
é o que a tela 34 já faz e o que D-84 pede.

Tabela densa e histórico rolam **dentro do contêiner**, nunca o corpo da página.

---

## 10. Lacunas de contrato

Além das quatro da S7, esta sessão precisa de:

| Tipo | Por quê |
|---|---|
| `DecisaoDeModeracao` | ação, motivo, autor, carimbo, item, escopo |
| `FamiliaDeSimilaridade` | agrupamento por padrão de motivo, para a M4 |
| `Delegacao` | quem, qual escopo, início, fim |
| `OrigemDoItem` += `"denuncia"` | a quarta origem (120) |

`DecisaoDeModeracao` é a que a S7 também consome — ela precisa exibir a devolução com o
motivo. **Escreva em `tipos-acesso.ts`**, não em `moderacao.ts`, e avise no `PAINEL.md`.

---

## 11. Fora de escopo

- Autenticação real. `CURADOR_AUTORADO` é o padrão, e a tela diz que o perfil é autorado
- Back-end, banco, API
- O **editor de trilha curada** e o catálogo de arrasto — são a S5, e continuam em
  `redacao.ts` e `(bastidor)/redacao/trilha/`
- Tesauro, promoção de linguagem, fusão de termo — S5. A moderação **encaminha**
- Medição de desempenho entre moderadores — funcionalidade 169, do Admin, na S1
- Regenerar o grafo

---

## 12. Portões de verificação

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs`
3. **`TETO_DO_DTO`** — a fila achatada continua abaixo de 61.440 bytes. É portão existente
4. Suíte nova `scripts/verificar-moderacao.mjs`:
   - nenhum veto conclui com motivo vazio
   - toda decisão tem autor e carimbo
   - item de origem `produtor` ou `ingestao` **não tem score** — só `ia` tem
   - o score exibido é a soma dos cinco componentes marcados, conferida
   - trocar de escopo não muda a URL
   - a M4 declara quantas arestas seguem sem revisão
   - devolver escreve no armazém da S7, e a S7 lê
5. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
6. Zero erro de console numa navegação completa, nas duas visões

---

## 13. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | **Separação de território** — `moderacao.ts`, mover a fila, folha nova, 1 linha em `globals.css`. **Commite sozinha** | — |
| 2 | **M1** fila — migrada e funcionando como antes | 1 |
| 3 | **M2** ficha do item, com as quatro ações e a assimetria | 2 |
| 4 | **M9** histórico | 3 |
| 5 | Integração com o armazém da S7 | `tipos-acesso.ts` da S7 |
| 6 | **M3** revisão da IA | 3 |
| 7 | **M8** escopo e escalonamento | 2 |
| 8 | **M5** elenco · **M6** reconciliação | 5 |
| 9 | **M4** similaridade | 3 |
| 10 | **M7** duplicatas | 3 |
| 11 | Suíte e medidas | 10 |

**Tarefas 6 a 10 são independentes entre si.**

Se o prazo apertar, o corte é nesta ordem: M7, M4, M6. **M1, M2, M3 e M9 não se cortam** —
são a fila com origem, a decisão com motivo, o limite da IA e a auditoria. Sem as quatro não
há moderação, só um botão de aprovar.
