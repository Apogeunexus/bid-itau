# PRD — S1 · Admin

**Onda 2 · sessão 1 de 4.** Contrato assentado pela onda 1.

---

## 0. Objetivo

Construir a superfície onde se governa **a regra pela qual o conteúdo é escrito** — não o
conteúdo.

**Critério de pronto.** Um avaliador senta na frente da tela e consegue: conceder um papel
com escopo e ver o efeito, abrir qualquer parâmetro do motor e entender o que custaria
mudá-lo, ver de onde vem cada fatia do grafo, atender um pedido de titular de dado, e
encontrar toda decisão na trilha de auditoria com autor e carimbo. Recarregar preserva. Um
botão reinicia a demonstração.

**O que esta sessão prova.** Que a plataforma é governável sem ser opaca. Numa proposta cujo
argumento é procedência honesta, o painel do administrador é onde a honestidade é mais fácil
de quebrar — porque é o único lugar com poder de mudar tudo sem que ninguém veja.

---

## 1. Análise ontológica do Admin

### 1.1 O Admin quase não escreve na ontologia

Dos oito níveis, é o que menos toca o grafo. Escreve **uma classe só**:

| Classe | Hoje | Por quê é do Admin |
|---|---|---|
| `territorio` | 359 | tabela de sistema, com centroide derivado |

Todo o resto do poder do Admin é de **segunda ordem**: ele escreve os parâmetros, os papéis
e os limites que determinam como os outros sete escrevem.

> **O Admin não escreve o dado. Escreve a regra pela qual o dado é escrito.**

Isso tem uma consequência de desenho: **quase nenhuma tela desta sessão é um formulário de
entidade.** São telas de parâmetro, de concessão, de medição e de auditoria.

### 1.2 As quatro coisas que ele governa

**1 · O vocabulário de procedência.** `Procedencia` tem três valores hoje e seis em produção:
`ic`, `derivado`, `parceiro`, `produtor`, `ia`, `curador`. **Cada papel é um valor de
procedência.** Conceder um papel é, literalmente, autorizar um valor de carimbo. É aqui que o
modelo de acesso encontra a ontologia, e é a tela A1 que o mostra.

**2 · Os parâmetros do motor.** Quatro números decidem o que 7.810 entidades e 66.563 arestas
produzem na tela:

| Parâmetro | Valor | O que decide |
|---|---:|---|
| `LIMIAR_PROBABILISTICO` | 0,65 | o que entra na fila de duplicatas de uma pessoa |
| `grauHub` | 60 | quantas entidades são tratadas como concentrador — **122 hoje** |
| `fanoutSemelhante` | 20 → 20 efetivo | quantos vizinhos por nó na caminhada |
| dose de serendipidade | 1 por feed | o cartão fora do alcance da caminhada |

**3 · A tabela geográfica.** 472 entidades têm coordenada, e o método está registrado em cada
uma. A distribuição é o achado:

| Método | | O que significa |
|---|---:|---|
| `centroide-pais` | **214** | o centroide de um país inteiro |
| `centroide-municipio` | 118 | município, com 118 na tabela |
| `deslocamento-por-espaco` | 113 | espaço deslocado do centroide |
| `centroide-estado` | 27 | UF inteira |

**45% das coordenadas são o centroide de um país.** A tabela tem 118 municípios e 41 países.
Cada município acrescentado por esta tela move entidades de `centroide-pais` para
`centroide-municipio` — e o mapa de desertos culturais fica mais fino sem que ninguém toque
em código. É a alavanca mais barata do sistema inteiro.

E há cinco municípios já marcados como aproximados, nomeados em `cobertura.coordenadas`:
Ingazeiras/CE, Itabirinha de Mantena/MG, Jenipapo de Minas/MG, Morro Agudo de Goiás/GO,
Umbuzeiro/PB.

**4 · Os limites da IA.** `LIMITES_DA_IA` já existe em `redacao.ts` e é dado, não código.
Funcionalidade 86: a IA propõe, nunca publica, nunca define destaque, nunca escreve verbete.
Essa lista precisa ter dono, e o dono é o Admin.

### 1.3 A regra que o Admin não pode quebrar

> **Admin não é exceção de procedência.** Toda escrita grava autor, inclusive a dele.

Um sistema cuja tese é "ausência declarada, procedência em tudo" não pode ter um papel que
edita sem deixar rastro. Consequência dura para esta sessão: **o Admin lê a trilha de
auditoria e não a apaga.** Não existe botão de limpar histórico. Existe suspender com rastro
(96), nunca apagar.

### 1.4 Segregação de responsabilidade

Duas coisas que o Admin **não** faz, e a tela precisa dizer por quê:

- **Não modera.** Quem concede papel de moderador não decide na fila. A tela A1 concede; a
  fila é da S3.
- **Não cura vocabulário.** Promover linguagem, fundir termo e declarar sinonímia são do
  Editor (130). O Admin **aprova** a promoção e monitora a saúde do tesauro (100), mas não a
  escreve.

Sem essa separação, "admin" vira o cargo que todo mundo pede porque quer ver um gráfico.

---

## 2. O padrão que define a sessão inteira

Está no código, e é o melhor material que este projeto tem para o painel de administração.

`LIMIAR_PROBABILISTICO = 0.65` não é um número escolhido. O comentário do módulo mostra o
método:

- dos 40 clones encenados, 27 caem no estágio 1; **13 só o estágio 2 alcança**
- o **menor score entre esses 13 é 0,667** — o limiar precisa ficar abaixo disso
- a 0,65 a fila tem **51 pares**
- a 0,60 a fila tem **103 pares — o dobro — e captura zero clones a mais**

E o alternativo recusado está exportado como dado: `LIMIAR_ALTERNATIVO_MEDIDO = { limiar:
0.6, pares: 103, clonesAMais: 0 }`.

> **Todo parâmetro desta sessão segue esse padrão: o valor atual, o alternativo medido, o
> que ele custaria e o que ganharia.**

Um botão que muda um número sem dizer o que o número custa é o oposto do que a proposta
defende. Se você não conseguir medir o custo de um parâmetro, **declare que não mediu** — a
regra da casa vale aqui como em qualquer tela.

---

## 3. Restrições herdadas

Seção 13 de `ONTOLOGIA-E-ACESSOS.md`. As que mais atingem esta sessão:

- **DP-F** — as telas de observabilidade alcançam `meta.json` e o grafo inteiro. Achate no
  servidor; nenhum `"use client"` importa módulo de dados por valor.
- **Sem relógio, sem sorteio.** `geradoEm: "2026-08-22"` é o frescor do build, e é o que a
  tela de observabilidade exibe — não o relógio de quem avalia.
- **Duas visões, um componente.** `desk:` é `[data-view="web"]`, não media query.
- **Nenhum hex novo.** `var(--ic-*)` e `color-mix`.
- **Só sua pasta:** `(bastidor)/admin/`, `componentes/admin-*`, `src/dados/admin.ts`,
  `src/estilos/admin.css`.

### A linha do `globals.css`
`admin.css` **não existe e não está importado**. Confirme antes de começar: se o arquivo e o
`@import` já tiverem sido criados fora da sessão, não toque em `globals.css`. Se não, crie a
folha e a linha na **primeira tarefa, commitada sozinha** — é o arquivo de colisão, e a S3
também mexe nele.

---

## 4. Escopo — funcionalidades 87 a 100, mais 169

| # | Funcionalidade | Tela |
|---|---|---|
| 87 | Concessão de papel como aresta com escopo | A1 |
| 88 | Vocabulário de procedência | A1, A4 |
| 89 | Territórios, bairros e centroides | A3 |
| 90 | Limiares do motor | A2 |
| 91 | Limites da IA | A5 |
| 92 | Verificação de organização e de agente independente | A1 |
| 93 | Trilha de auditoria completa e imutável | A7 |
| 94 | LGPD: consentimento, exportação, exclusão, titular | A8 |
| 95 | Reprocessamento e observabilidade | A6 |
| 96 | Suspensão sem apagar | A9 |
| 97 | Chaves de integração e limites por organização | A9 |
| 98 | Autorização de envio em massa | A9 |
| 99 | Publicação e desligamento de superfícies | A9 |
| 100 | Saúde do vocabulário | A4 |
| 169 | Desempenho da moderação por escopo | A10 |

---

## 5. As telas

Dez. Nenhuma delas é formulário de entidade — e isso é a característica da sessão.

---

### A1 · Papéis e escopos
`(bastidor)/admin/papeis`

**Objetivo.** A tela que mostra que o modelo de acesso É a ontologia.

**Escreve.** a aresta de papel, com escopo · o estado de verificação de organização.

**Conteúdo.**
- **Papel como aresta com escopo**, não como coluna: `pessoa —[modera, escopo=PA]→ plataforma`.
  A tela precisa mostrar essa forma, porque é o argumento: a mesma pessoa é produtora do
  próprio teatro e curadora regional do Pará, sem conta duplicada
- Os oito níveis, com o que cada um escreve na ontologia — a matriz da seção 5 do documento
  de contexto, viva
- **O escopo do moderador em três eixos:** território, tipo de conteúdo, fila
- **A ligação com a procedência (88):** conceder um papel autoriza um valor de carimbo. A
  tela imprime os seis valores e quem produz cada um
- **Verificação (92):** organização e agente independente, com o que cada uma exige
- Toda concessão com autor, carimbo e motivo

**A declaração que a tela precisa imprimir.** Quem concede papel não decide na fila. É
segregação de responsabilidade, e sem ela um administrador pode moderar em nome de qualquer
território sem que ninguém veja.

**App.** Lista de papéis por pessoa; escopo em folha.
**Web.** Duas colunas: pessoas à esquerda, papéis e escopos à direita.

---

### A2 · Motor — parâmetros e concentradores
`(bastidor)/admin/motor`

**Objetivo.** A tela mais importante da sessão. Quatro números decidem o que 66.563 arestas
produzem.

**Escreve.** os parâmetros.

**Conteúdo.**
- Os quatro parâmetros, cada um no **padrão do limiar**: valor atual, alternativo medido, o
  que custaria, o que ganharia
- `LIMIAR_PROBABILISTICO` já vem pronto: 0,65 · alternativo 0,60 · 103 pares em vez de 51 ·
  **zero clones a mais**. Use como modelo visual dos outros três
- A justificativa por extenso: os 13 clones que só o estágio 2 alcança, menor score 0,667
- **Concentradores (`grauHub = 60`):** 122 entidades acima do limiar. As maiores:
  `linguagem:cms:artes-visuais` com grau **2.623**, `tema:cms:exposicao` com 961,
  `linguagem:cms:teatro` com 799. Baixar o limiar aumenta quantos nós a caminhada evita
- `fanoutSemelhante` 20, **efetivo 20** — e a explicação de por que o efetivo cai abaixo do
  teto quando a fonte é grande
- Dose de serendipidade: exatamente 1 cartão por feed, fora do alcance da caminhada
- Onde o custo não foi medido, **a tela declara que não foi**

**App.** Um parâmetro por cartão, com a medição em folha.
**Web.** Parâmetro à esquerda, medição e alternativa à direita.

---

### A3 · Territórios e centroides
`(bastidor)/admin/territorio`

**Objetivo.** A alavanca mais barata do sistema.

**Escreve.** `territorio` · a tabela de centroides · o método por registro.

**Conteúdo.**
- Os quatro `MetodoCoordenada`, com a distribuição medida: **214 `centroide-pais`**, 118
  município, 113 deslocamento por espaço, 27 estado
- A leitura honesta: **45% das coordenadas são o centroide de um país inteiro**
- Tabela: 118 municípios e 41 países. Acrescentar município **move entidades de país para
  município** — e o contador precisa mostrar quantas
- Os cinco aproximados, nomeados: Ingazeiras/CE, Itabirinha de Mantena/MG, Jenipapo de
  Minas/MG, Morro Agudo de Goiás/GO, Umbuzeiro/PB
- **Sergipe e Tocantins não existem no acervo** — 25 de 27 UFs. A tela declara a ausência com
  denominador, e não a preenche
- Concentração: **59% de 773 entidades em 2 dos 27 estados**
- Bairro como nível abaixo do município — hoje `não sustentada` na funcionalidade 22
- `semCoordenada: 0` — e o que isso significa

**Regra dura.** `coordenada.procedencia` é **sempre `derivado`**. Não existe coordenada
digitada. O que esta tela edita é a tabela de referência, não a coordenada da entidade.

**App.** Lista de territórios com o método como selo.
**Web.** Tabela densa à esquerda, distribuição por método à direita.

---

### A4 · Vocabulário e procedência
`(bastidor)/admin/vocabulario`

**Objetivo.** Monitorar a saúde do tesauro sem escrevê-lo.

**Escreve.** aprova promoção · **não cria termo**.

**Conteúdo.**
- 33 linguagens, 94 temas, 481 termos
- As **quatro promovidas**, nomeadas: `arte`, `gestao-cultural`, `radio`, `tv`. Vieram da
  Enciclopédia e não existem nas 29 do CMS. Promover foi fiel; encaixar à força seria fabricar
- `aliasDeLinguagem` e `slugsDesambiguados: 76`
- Termos órfãos, sinônimos pendentes, candidatos vindos da moderação (118)
- **As seis procedências**, com quem produz cada uma e a contagem viva:

  | | nós | arestas |
  |---|---:|---:|
  | `ic` | 4.826 | 14.882 |
  | `derivado` | 2.937 | 51.600 |
  | `autorado` | 47 | 81 |
  | `produtor` · `parceiro` · `ia` · `curador` | — | a produção abre |

**A separação que a tela declara.** O Admin **aprova** a promoção; quem promove é o Editor
(130). Sem isso, o administrador vira curador por acidente.

**App.** Contadores em cartão; pendências em lista.
**Web.** Vocabulário à esquerda, procedência à direita.

---

### A5 · Limites da IA
`(bastidor)/admin/ia`

**Objetivo.** Dar dono à lista que responde à pergunta mais difícil do RFP.

**Escreve.** `LIMITES_DA_IA` · o teto de confiança.

**Conteúdo.**
- A lista atual, por extenso: o que a IA **nunca** propõe publicar, por mais que o grafo
  alcance
- A funcionalidade 86, como afirmação de sistema: **não publica, não define destaque, não
  escreve verbete**
- O que a IA pode: propor à fila, sugerir próximo passo de trilha, extrair na ingestão com
  score
- Os cinco componentes do score, em leitura — quem os edita é o Admin, quem os aplica é a
  moderação
- Ligação com a A7: toda mudança nesta lista é evento de auditoria de primeira ordem

**Regra dura.** Não existe interruptor de "IA publica direto" nesta tela. A ausência do
controle é o produto.

**App.** Lista de limites, um por linha.
**Web.** Limites à esquerda, o que ela pode à direita.

---

### A6 · Observabilidade
`(bastidor)/admin/observabilidade`

**Objetivo.** Procedência, cobertura e frescor — funcionalidade 77, do lado de quem opera.

**Escreve.** dispara reprocessamento (mockado).

**Conteúdo.**
- **Frescor:** `geradoEm: 2026-08-22`, e quanto tempo faz — contra a data de referência,
  **nunca o relógio do runtime**
- **Cobertura de imagem:** 2.382 arquivos, 2.382 presentes, **0 rejeitadas**, 0 donos
  desconhecidos, 2.835 entidades com imagem local
- **Cobertura de coordenada:** 472 com, **0 sem**
- **Ficha de acessibilidade:** 5.108 declaram · 2.702 não
- **Procedência:** as três fatias, conferidas contra `meta.json`
- **A conferência de três pontas**, que já existe no Observatório e vale a pena espelhar aqui:
  a contagem feita na tela, `contagens()` do grafo e `porProcedencia` do `meta.json` precisam
  concordar. **Uma fatia que não fecha derruba o build** — e a tela do Admin é onde isso
  deveria aparecer antes de derrubar
- Reprocessar o grafo: no protótipo é mockado, e a tela diz que é

**App.** Cartões de cobertura.
**Web.** Grade de indicadores com a conferência de três pontas visível.

---

### A7 · Trilha de auditoria
`(bastidor)/admin/auditoria`

**Objetivo.** A tela que impede a própria sessão de mentir.

**Escreve.** **nada.** Só lê.

**Conteúdo.**
- Toda escrita do sistema, de todos os níveis, com autor, carimbo, ação e alvo
- Filtro por papel, por nível, por classe atingida, por escopo
- **As decisões do próprio Admin em destaque** — concessão de papel, mudança de parâmetro,
  alteração dos limites da IA
- Vetos com motivo, vindos da moderação
- **Não existe botão de apagar.** A tela declara isso por extenso: o administrador lê a
  trilha e não a apaga

**A frase que a tela precisa imprimir.** Num sistema cuja tese é procedência honesta, o
administrador é o único papel capaz de destruí-la em silêncio. A trilha imutável é o que
impede isso, e por isso ela é a única tela do Admin sem uma única ação de escrita.

**App.** Lista cronológica com filtro em folha.
**Web.** Tabela densa, filtros em coluna fixa.

---

### A8 · Titulares e LGPD
`(bastidor)/admin/titulares`

**Objetivo.** O grafo tem 575 pessoas — **43.614 na base completa** — que nunca se
cadastraram.

**Escreve.** atende pedido de titular · registra a resposta.

**Conteúdo.**
- Fila de pedidos: acesso, correção, exportação, exclusão
- **Dois tipos de titular, e a distinção é o ponto:**

  | | Quem | O que pode pedir |
  |---|---|---|
  | Usuária | se cadastrou (`pessoa-usuaria`) | consentimento, exportação, exclusão da conta |
  | Retratada | está no grafo e nunca se cadastrou (`pessoa`) | correção e contestação sobre si |

- Exclusão de `pessoa-usuaria` e o que ela leva junto: `repertorio`, salvos, sinais
- Contestação sobre verbete: **encaminha à Enciclopédia**, não resolve aqui — verbete é
  autoridade a montante
- Toda resposta com prazo, autor e carimbo
- Anonimização nos indicadores (76) — o Observatório lê agregado, nunca indivíduo

**App.** Fila de pedidos em cartão.
**Web.** Pedido à esquerda, ficha do titular e ação à direita.

---

### A9 · Governança operacional
`(bastidor)/admin/governanca`

**Objetivo.** Os quatro poderes operacionais que não merecem tela própria, mas merecem
registro.

**Escreve.** suspensão · chaves · autorização de envio · estado das superfícies.

**Conteúdo.**
- **Suspender sem apagar (96)** — entidade ou organização sai do ar **com rastro**. A tela
  precisa dizer a diferença: apagar destrói procedência, suspender a preserva. Não existe
  apagar
- **Chaves de integração (97)** — por organização, com escopo e limite de taxa
- **Envio em massa (98)** — quem pode disparar newsletter. Ato irreversível: autorização
  nomeada, com limite e registro
- **Superfícies (99)** — publicar e desligar módulo. Os dez apps e as superfícies de
  bastidor, com o estado de cada uma

**App.** Quatro seções em rolagem.
**Web.** Grade de quatro painéis.

---

### A10 · Desempenho da moderação
`(bastidor)/admin/moderacao`

**Objetivo.** A funcionalidade 169, achada na auditoria de fiscalização. Sem ela, ninguém
mede quem modera.

**Escreve.** nada.

**Conteúdo.**
- Tempo de fila **por escopo** — territorial, por classe, por fila
- Volume decidido, por ação: aprovado, editado, vetado, devolvido
- **Concordância entre moderadores** sobre itens semelhantes — é o que revela censura
  silenciosa
- **Fila parada por território** — cruzada com a densidade: um território com pouco acervo e
  fila parada é abandono, não calmaria
- Taxa de veto por moderador, com o motivo agrupado

**A regra que separa esta tela da M9.** A M9 é o histórico do moderador, para ele. Esta é a
medição entre moderadores, para o Admin. **Confundir as duas transforma auditoria em
vigilância de desempenho individual**, e a tela precisa declarar o recorte.

**App.** Indicadores em cartão.
**Web.** Grade com o mapa de fila por território.

---

## 6. Responsividade

Idêntica às demais. Seção 8 do PRD da S7 e seção 13 do documento de contexto.

**Padrão desta sessão:** app é uma coluna com a medição em folha; web é duas colunas com o
**valor à esquerda e a justificativa medida à direita**, sempre visível. É o inverso do
padrão comum de painel de administração, onde o número aparece sozinho — e o inverso é o
ponto.

Tabela de auditoria e tabela de territórios rolam **dentro do contêiner**.

---

## 7. Lacunas de contrato

| Tipo | Por quê |
|---|---|
| `Papel` | id, escopo em três eixos, concedido por, carimbo |
| `EscopoDePapel` | `{ territorio?, classe?, fila? }` |
| `ParametroDoMotor` | valor, alternativo medido, custo, ganho, **ou declaração de que não foi medido** |
| `EventoDeAuditoria` | nível, autor, ação, alvo, carimbo, motivo |
| `PedidoDeTitular` | tipo, titular (usuária ou retratada), prazo, estado |
| `Suspensao` | alvo, motivo, autor, reversível |

`ParametroDoMotor` é a mais importante. **Se o tipo não obrigar o campo de custo, a tela vai
acabar exibindo número solto** — e número solto é exatamente o que esta proposta recusa.

---

## 8. Fora de escopo

- Autenticação real. O perfil é autorado e a tela diz que é
- Back-end, banco, API. Reprocessar o grafo é mockado
- **Moderar.** Concede papel, não decide na fila — é a S3
- **Curar vocabulário.** Aprova promoção, não promove — é a S5
- Dashboards de produto e impacto cultural — é a S2 · Gestor. O Admin observa **o sistema**;
  o Gestor observa **o público**
- Apagar qualquer coisa. Suspender, sempre

---

## 9. Portões de verificação

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs`
3. Suíte nova `scripts/verificar-admin.mjs`:
   - todo parâmetro exibido tem custo medido **ou** declaração de que não foi medido
   - nenhuma tela do Admin tem ação de apagar
   - a trilha de auditoria não tem ação de escrita
   - toda concessão de papel tem autor, carimbo e escopo
   - `coordenada.procedencia` continua sempre `derivado`
   - os números de cobertura batem com `meta.json` — a conferência de três pontas
4. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
5. Zero erro de console numa navegação completa, nas duas visões

---

## 10. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | Folha `admin.css` + linha em `globals.css`. **Commite sozinha** — e só se ainda não existir | — |
| 2 | `src/dados/admin.ts` — DTOs achatados a partir de `meta.json`, `geo.ts` e `duplicatas.ts` | 1 |
| 3 | **A2** motor — é a tela que fixa o padrão visual dos parâmetros | 2 |
| 4 | **A3** territórios | 2 |
| 5 | **A6** observabilidade | 2 |
| 6 | **A1** papéis e escopos | `tipos-acesso.ts` |
| 7 | **A7** auditoria | 6 |
| 8 | **A4** vocabulário · **A5** limites da IA | 2 |
| 9 | **A8** titulares · **A9** governança | 6 |
| 10 | **A10** desempenho da moderação | S3 em andamento |
| 11 | Suíte e medidas | 10 |

**Comece pela A2.** Ela fixa o padrão — valor, alternativa medida, custo, ganho — que as
outras nove copiam. Fazer A1 primeiro parece natural e é um erro: sem o padrão estabelecido,
as telas de parâmetro viram número solto e você reescreve tudo.

Tarefas 4, 5 e 8 são independentes entre si.

Se o prazo apertar, o corte é: A10, A9, A8. **A2, A3, A7 e A1 não se cortam** — são o
parâmetro auditável, a alavanca geográfica, a trilha imutável e o modelo de papel como
aresta. Sem as quatro, o painel do Admin vira o painel genérico que a proposta inteira se
posiciona contra.
