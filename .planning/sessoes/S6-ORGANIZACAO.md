# PRD — S6 · Organização

**Onda 2 · sessão 3 de 4.** Superfície: **Studio**, a mesma da S7.

> **BLOQUEIO DURO.** Esta sessão ocupa `(bastidor)/studio/`, a mesma pasta da S7 · Produtor.
> **Não abra enquanto a S7 estiver rodando.** É a única colisão do plano que o merge não
> resolve sozinho. Confirme no `PAINEL.md` que a S7 encerrou.

---

## 0. Objetivo

Construir a superfície onde a instituição **governa** — quem publica em nome dela, onde os
eventos acontecem, o que ela oferece e o que ela responde.

**Critério de pronto.** Um avaliador senta na frente da tela e consegue: convidar um
colaborador e definir a alçada dele, cadastrar um espaço com endereço e ficha de
acessibilidade, publicar um programa, subir mídia com crédito obrigatório, importar um lote
por iCal, abrir um edital, e ver o estado de conformidade da própria equipe. Recarregar
preserva. Um botão reinicia a demonstração.

**O que esta sessão prova.** Que a plataforma tem governança institucional — que uma
entidade responde pelo que publica, e que a pessoa que fez o cadastro não leva a conta
embora quando sai.

---

## 1. Análise ontológica da Organização

### 1.1 A Organização escreve o que é estável

A divisão dentro do Studio é limpa: **o Produtor declara o que acontece; a Organização
cadastra o que permanece.**

| Classe | Hoje | Procedência | Observação |
|---|---:|---|---|
| `instituicao` | 246 | **100% `ic`** | 0 com coordenada · 0 declaram acessibilidade |
| `espaco` | 113 | **100% `derivado`** | nenhum espaço vem da fonte |
| `programa` | **0** | — | classe declarada e vazia |
| `formacao` | 54 | 100% `ic` | **54/54 com ficha, imagem e crédito** |
| `midia` | 529 | 100% `ic` | 518 com imagem · **520 com crédito** |

Três achados aqui, e cada um vira uma decisão de tela.

### 1.2 Os 113 espaços são todos `derivado`

**Nenhum espaço do acervo vem da fonte.** Os 113 foram inferidos, e as coordenadas deles são
`deslocamento-por-espaco` — as 113 exatas que aparecem em `cobertura.coordenadas`.

Isso conversa com o número que o produto já declara em tela: **2.425 de 2.425 ocorrências
sem espaço declarado**. O acervo não publica onde a sessão acontece, e o espaço que existe
foi derivado por regra.

**A O2 é onde o espaço deixa de ser inferência e passa a ser cadastro.** É a segunda maior
conversão de procedência do sistema, atrás só das ocorrências.

### 1.3 Zero instituições e zero espaços declaram acessibilidade

`declaraAcessibilidade` em `instituicao`: **0 de 246**. Em `espaco`: **0 de 113**.

A funcionalidade 15 — ficha de acessibilidade do evento **e do espaço** — está no ar no app
público. Do lado do evento ela tem dado; do lado do espaço, nenhum. E a ficha do espaço é a
que mais importa para quem decide se consegue chegar: rampa, elevador, banheiro adaptado,
piso tátil são atributos do lugar, não da sessão.

**Só a Organização pode declarar isso**, e vale aqui a mesma regra da P6 do Studio: precisa
de um **ato explícito de declarar ausência**, não só caixas de marcar.

### 1.4 `formacao` é o modelo do que dado bem preenchido parece

54 de 54 com ficha de acessibilidade, imagem e crédito. É a única classe do acervo com 100%
nas três. Vale usá-la como referência visual do que a O4 deve produzir — e como argumento:
quando a fonte preenche, o produto fica melhor sem mudar uma linha.

### 1.5 A correção de uma atribuição

`pertence_a` tem 13.000 arestas e **não é hierarquia organizacional** — é classificação.
Medido nas pontas: ocorrência→tema 3.091, ocorrência→linguagem 2.640, conteúdo→tema 1.920,
conteúdo→linguagem 1.713.

A relação organizacional de verdade é **`realiza` — instituição→evento, 527 arestas**. É essa
que a Organização escreve, e é ela que faz o critério de identidade do evento fechar: *título
normalizado + **agente realizador** + obra*.

Sem organização cadastrada, o produtor não consegue preencher o segundo terço da chave.

### 1.6 O que existe no tipo e não existe no acervo

- **`programa`, zero instâncias.** A camada acima do evento — Rumos, uma temporada
  institucional, um festival com edições. O motor a percorre e nada a popula
- **Edital e oportunidade não existem como classe.** As funcionalidades 46, 48 e 49
  pressupõem edital no grafo, e `grep` por edital em `src/dados/` não retorna nada. A O6
  precisa criar a forma antes de criar a tela

---

## 2. Restrições herdadas

Seção 13 de `ONTOLOGIA-E-ACESSOS.md`. As específicas desta sessão:

- **Mesma pasta que a S7.** Leia o que ela deixou antes de escrever: `tipos-acesso.ts`, o
  padrão de estado, o `localStorage` com chave `studio.v1`, os componentes `studio-*`.
  **Reuse, não duplique.** Duas fichas de acessibilidade diferentes no mesmo Studio seria o
  defeito mais visível possível numa banca
- **DP-F** — servidor lê o grafo no build, só DTO de primitivo atravessa
- **Sem relógio, sem sorteio.** `DATA_DE_REFERENCIA = "2026-08-22"`
- **Duas visões, um componente.** `desk:` é `[data-view="web"]`, não media query
- **`coordenada.procedencia` é sempre `derivado`.** A O2 cadastra endereço; a coordenada
  continua sendo derivada, com `MetodoCoordenada` registrado. Não existe latitude digitada
- **Só sua pasta:** `(bastidor)/studio/`, `componentes/studio-*`, `src/estilos/studio.css` —
  que já existe e já está importado. Você não toca no arquivo de colisão

---

## 3. Escopo — funcionalidades 139 a 152, mais 168

| # | Funcionalidade | Tela |
|---|---|---|
| 139 | Convite, alçada e remoção de colaborador | O7 |
| 140 | Sucessão de titularidade | O7 |
| 141 | Ficha da instituição e verificação | O1 |
| 142 | Espaços próprios com ficha de acessibilidade | O2 |
| 143 | `programa` — a camada acima do evento | O3 |
| 144 | `formacao` — cursos, formações e biblioteca | O4 |
| 145 | Agendamento de visita educativa | O4 |
| 146 | Material didático e área do educador | O4 |
| 147 | Mídia: upload, crédito, ficha técnica, 8 dimensões | O5 |
| 148 | Direito de distribuição e offline | O5 |
| 149 | Editais e oportunidades | O6 |
| 150 | Importação em lote por iCal, JSON ou API | O8 |
| 151 | Chave de integração da organização | O8 |
| 152 | Painel de alcance consolidado | O9 |
| 168 | Painel de conformidade da equipe | O10 |

---

## 4. As telas

Dez, todas novas.

---

### O1 · Ficha da instituição
`(bastidor)/studio/instituicao`

**Objetivo.** A identidade que responde pelo que a organização publica.

**Escreve.** `instituicao` · `situado_em` · classificação por `pertence_a`.

**Conteúdo.**
- Nome, resumo, contato, território
- **Coordenada: 0 de 246 instituições têm.** Uma instituição sem lugar não aparece no mapa,
  e o mapa é lente de todo o produto. A tela declara isso e cadastra o endereço — a
  coordenada continua `derivado`, por `MetodoCoordenada`
- **Ficha de acessibilidade da instituição: 0 de 246 declaram.** Ato explícito de declarar
  ausência, no mesmo padrão da P6 do Studio
- Imagem com crédito — hoje 22 de 246 têm imagem, 19 têm crédito
- **Verificação (141)** — o estado, o que falta, e quem verifica: o Admin (92). A tela
  encaminha, não decide
- Linguagens da instituição, do vocabulário — 303 arestas `instituicao → linguagem` existem

**App.** Formulário em coluna; ficha de acessibilidade em folha.
**Web.** Ficha à esquerda, estado de verificação e cobertura à direita.

---

### O2 · Espaços
`(bastidor)/studio/espacos`

**Objetivo.** A segunda maior conversão de procedência do sistema.

**Escreve.** `espaco` · `situado_em` · ficha de acessibilidade do espaço.

**O estado, medido.** **113 espaços, 100% `derivado`.** Nenhum vem da fonte. Todos têm
coordenada por `deslocamento-por-espaco`. E **0 de 113 declaram acessibilidade**.

**Conteúdo.**
- Cadastro do espaço: nome, endereço, bairro, capacidade
- O selo de procedência visível: espaço derivado × espaço cadastrado. **A tela mostra a
  conversão acontecendo**
- **Ficha de acessibilidade do espaço** — as 8 dimensões, mais os atributos do lugar que a
  ontologia ainda não tem: rampa, elevador, banheiro adaptado, piso tátil, vaga reservada
- **O ato explícito:** *"Declaro que este espaço não oferece nenhum destes recursos."*
- A herança declarada: a ocorrência lê a ficha do espaço, e a tela diz que lê
- Contador: **2.425 de 2.425 ocorrências sem espaço declarado** — o denominador que explica
  por que esta tela existe
- Coordenada continua `derivado`. Endereço é o que se digita

**Lacuna de contrato.** Os atributos físicos de acessibilidade não existem em
`Acessibilidade`, que tem as 8 dimensões de mídia. **Não force rampa dentro de
`closed_caption`.** Proponha estrutura própria e registre `PEDIDO`.

**App.** Lista de espaços; ficha em folha.
**Web.** Espaços à esquerda, ficha e mapa do endereço à direita.

---

### O3 · Programa
`(bastidor)/studio/programa`

**Objetivo.** Povoar a única classe da ontologia com zero instâncias.

**Escreve.** `programa` · `realiza` · vínculo com eventos.

**Conteúdo.**
- Programa como guarda-chuva: Rumos, um festival com edições, uma temporada institucional
- Eventos reunidos sob ele, e o que isso muda no app público
- Edições ao longo do tempo
- Declaração honesta: **`programa` tem zero instâncias no acervo.** O que aparece aqui é o
  que a organização cria, e a tela diz isso

**App.** Lista de programas; eventos em folha.
**Web.** Programa à esquerda, eventos reunidos à direita.

---

### O4 · Formação
`(bastidor)/studio/formacao`

**Objetivo.** Cursos, biblioteca e a visita educativa — três funcionalidades, uma delas MVP e
hoje `falta`.

**Escreve.** `formacao` · agenda de visitas · material didático.

**Conteúdo.**
- 54 formações no acervo, e vale dizer o que elas são: **a única classe com 100% de ficha de
  acessibilidade, imagem e crédito.** É o modelo do que dado bem preenchido parece
- Curso e formação, com inscrição (42)
- Biblioteca — consulta ao acervo bibliográfico, hoje `falta` (43)
- **Agendamento de visita educativa (145)** — agenda, vagas, confirmação, escola. É MVP e
  está `falta`. Gestão de reserva, não só publicação
- **Material didático e área do educador (146)** — a funcionalidade 45. Professor com turma
  não é público comum, e a tela precisa dizer que o acesso do educador ficou fora dos oito
  níveis desta versão

**App.** Lista de ofertas; agenda em folha.
**Web.** Oferta à esquerda, agenda de visitas à direita.

---

### O5 · Mídia
`(bastidor)/studio/midia`

**Objetivo.** O acervo de ativos, com direito declarado.

**Escreve.** `midia` · `creditoImagem` · ficha técnica · direitos.

**O estado, medido.** 529 mídias, 529 declaram acessibilidade, 518 com imagem, **520 com
crédito — 9 sem**. Crédito obrigatório significa **9 registros que não publicam** até alguém
resolver.

**Conteúdo.**
- Biblioteca da organização, com o crédito como campo bloqueante
- **A fila dos 9 sem crédito**, nomeada — é trabalho concreto, não aviso genérico
- **Ficha técnica (147)** — duração, formato, capítulos. Sem ela, *player com retomada* (26)
  continua `não sustentada`
- **As 8 dimensões de acessibilidade da mídia.** Medido no acervo: libras em 3 itens,
  audiodescrição em **0**, legenda descritiva em 0, closed caption em 0
- **Direito de distribuição e offline (148)**, item a item. Sem isso, *download e modo
  offline* (30) continua `falta` — e é onde mais faz falta, porque podcast é o formato que
  mais se ouve sem rede
- O moderador confere direitos (114, 115). A tela declara

**App.** Grade de mídia; ficha em folha.
**Web.** Grade à esquerda, ficha técnica e direitos à direita.

---

### O6 · Editais e oportunidades
`(bastidor)/studio/editais`

**Objetivo.** A funcionalidade que não tem classe nem módulo.

**Escreve.** edital — **forma nova**.

**O estado.** `grep` por edital em `src/dados/` não retorna nada. As funcionalidades 46, 48 e
49 pressupõem edital no grafo. O produtor **recebe** alerta de edital compatível (166); nunca
existiu quem publica.

**Conteúdo.**
- Edital: título, prazo, critérios, território, linguagem, público-alvo
- Os critérios como **dado estruturado**, não texto livre — é o que permite o casamento com o
  perfil do produtor (48)
- Estado: aberto, encerrado, em julgamento, resultado
- **Onboarding de produtor a partir do edital (49)** — quem se inscreve vira agente no grafo.
  É o funil que a proposta descreve, e ele nasce aqui
- Rumos e Jabuti como referência real do que o IC opera

**Lacuna de contrato.** `edital` não existe em `ClasseEntidade`. Registre `PEDIDO` antes de
escrever a tela — e não a force dentro de `formacao` nem de `programa`.

**App.** Lista de editais; critérios em folha.
**Web.** Edital à esquerda, critérios e inscritos à direita.

---

### O7 · Equipe e alçadas
`(bastidor)/studio/equipe`

**Objetivo.** O que impede o estagiário que fez o cadastro de levar o perfil do teatro
quando sai.

**Escreve.** vínculo de colaborador · alçada · sucessão.

**Conteúdo.**
- Convite por e-mail, aceite, remoção (139)
- **Alçada por colaborador:** quem publica direto, quem só rascunha, quem gerencia espaços,
  quem sobe mídia
- A ligação com o modelo de papel: o vínculo é aresta com escopo, no mesmo padrão da A1 do
  Admin. **A Organização concede dentro dela; o Admin concede entre níveis**
- **Sucessão de titularidade (140)** — a pessoa sai, a instituição fica. Transferência
  explícita, com autor e carimbo, nunca por abandono
- Registro de quem publicou o quê

**App.** Lista de pessoas; alçada em folha.
**Web.** Equipe à esquerda, alçadas e histórico à direita.

---

### O8 · Integração
`(bastidor)/studio/integracao`

**Objetivo.** Como uma instituição com CMS próprio alimenta a plataforma sem digitar duas
vezes.

**Escreve.** lote importado · chave de integração.

**Conteúdo.**
- **Importação em lote (150)** — iCal, JSON, API. Prévia antes de aplicar, sempre
- **O que o lote não traz**, declarado: a importação não inventa espaço, elenco, preço nem
  ficha de acessibilidade. Ela traz o que o arquivo tem, e a tela lista o que ficou vazio
- Ligação com a fila de duplicatas: o lote é a origem clássica de duplicata, e o critério de
  identidade roda antes de gravar
- **Chave de integração (151)** — escopo e limite. **Quem emite e limita é o Admin (97)**; a
  organização vê, usa e revoga a própria
- Histórico de importações, com o que entrou e o que foi rejeitado

**App.** Histórico em lista; prévia em folha.
**Web.** Prévia do lote à esquerda, o que ficou vazio à direita.

---

### O9 · Alcance consolidado
`(bastidor)/studio/alcance`

**Objetivo.** O retorno para quem publica (152).

**Escreve.** nada.

**Conteúdo.**
- Alcance somado de todos os eventos da organização
- Por linguagem, por território, por espaço
- **O que o protótipo não sustenta, declarado com denominador.** Sinal de público real não
  existe no acervo, e inventar número de alcance seria a mentira mais fácil e mais barata
  desta sessão
- Comparação com o próprio histórico, quando houver

**A regra.** Se o dado não sustenta, a tela diz. Um painel de alcance com número inventado
destrói o argumento de procedência da proposta inteira, e num painel institucional ninguém
confere.

**App.** Cartões de indicador.
**Web.** Grade com recorte por dimensão.

---

### O10 · Conformidade da equipe
`(bastidor)/studio/conformidade`

**Objetivo.** A funcionalidade 168, achada na auditoria de fiscalização. Hoje a Organização
tem alcance de público e **não vê a fila dos próprios produtores**.

**Escreve.** nada.

**Conteúdo.**
- Estado de cada registro da organização: rascunho, em moderação, devolvido, publicado
- **Taxa de devolução e de veto, por colaborador**, com o motivo agrupado
- Pendências das três portas, somadas: agente proposto, espaço faltando, termo em análise
- Score de qualidade médio dos cadastros (164)
- **O que falta para publicar**, nomeado por registro — as 9 mídias sem crédito, os eventos
  sem elenco, as ocorrências sem espaço

**A distinção que a tela declara.** Isso é conformidade, não vigilância. Mede o **registro**,
não a pessoa — e o recorte por colaborador existe para a organização corrigir processo, não
para pontuar gente.

**App.** Lista de pendências por prioridade.
**Web.** Estado à esquerda, pendências agrupadas à direita.

---

## 5. Responsividade

Seção 8 do PRD da S7 e seção 13 do documento de contexto.

**Padrão desta sessão:** app é uma coluna com a ficha em folha; web é duas colunas com **o
que falta à direita**, sempre visível. É o inverso do padrão de cadastro comum, onde o campo
vazio não diz nada — e o inverso é o ponto, porque toda tela desta sessão existe para
converter ausência em declaração.

**Reuse os componentes da S7.** Ficha de acessibilidade, carimbo de autoria, selo de
procedência e aviso de duplicata já existem em `componentes/studio-*`.

---

## 6. Lacunas de contrato

| Tipo | Por quê |
|---|---|
| `AcessibilidadeDeEspaco` | rampa, elevador, banheiro adaptado, piso tátil, vaga — **não cabem nas 8 dimensões de mídia** |
| `edital` em `ClasseEntidade` | a classe não existe, e três funcionalidades a pressupõem |
| `FichaTecnicaDeMidia` | duração, formato, capítulos — destrava a funcionalidade 26 |
| `DireitoDeDistribuicao` | por item, com offline — destrava a 30 |
| `Colaborador` + `Alcada` | vínculo com escopo dentro da organização |
| `Importacao` | lote, origem, o que entrou, o que ficou vazio |

`AcessibilidadeDeEspaco` é a mais importante. **Forçar rampa dentro de `closed_caption`
seria fabricar classificação** — o mesmo erro que o projeto recusou quando promoveu quatro
linguagens em vez de mapear `Rádio → audiovisual`.

---

## 7. Fora de escopo

- Autenticação real. O perfil é autorado e a tela diz que é
- Back-end, banco, API. A importação lê arquivo mockado
- **Tudo do nível 7 · Produtor** — evento, ocorrência, elenco, preço. Mesma pasta, outra
  sessão, já feita
- **Verificar a própria organização** — quem verifica é o Admin (92)
- **Emitir chave de integração** — quem emite e limita é o Admin (97)
- **Área do educador como nível de acesso.** A O4 publica o material; o acesso do educador
  ficou fora dos oito níveis desta versão, e a tela declara

---

## 8. Portões de verificação

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs`
3. Suíte nova `scripts/verificar-organizacao.mjs`:
   - nenhuma mídia publica sem crédito
   - `coordenada.procedencia` continua sempre `derivado` — nenhuma latitude digitada
   - espaço cadastrado muda de `derivado` para organização, e o selo mostra
   - ficha de acessibilidade do espaço tem ato explícito de declarar ausência
   - o painel de alcance não exibe número que o acervo não sustenta
   - importação em lote não grava registro sem chave de identidade
   - sucessão de titularidade grava autor e carimbo
   - **componentes da S7 reusados, não duplicados** — nenhuma segunda ficha de acessibilidade
4. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
5. Zero erro de console numa navegação completa, nas duas visões

---

## 9. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | Ler o que a S7 deixou: `tipos-acesso.ts`, estado, componentes `studio-*` | S7 encerrada |
| 2 | **O2** espaços — é a maior conversão e fixa o padrão de ficha | 1 |
| 3 | **O1** ficha da instituição | 2 |
| 4 | **O7** equipe e alçadas | 1 |
| 5 | **O5** mídia | 1 |
| 6 | **O3** programa | 3 |
| 7 | **O4** formação | 3 |
| 8 | **O6** editais | `PEDIDO` de classe atendido |
| 9 | **O8** integração | 3 |
| 10 | **O9** alcance · **O10** conformidade | 4 |
| 11 | Suíte e medidas | 10 |

**Comece pela O2.** Ela é a maior conversão de procedência da sessão — 113 espaços saindo de
`derivado` — e fixa o padrão de ficha de acessibilidade com ato explícito que a O1 copia.
Começar pela ficha da instituição parece natural e é um erro: a instituição herda o padrão do
espaço, não o contrário.

Tarefas 4, 5, 6 e 7 são independentes entre si.

Se o prazo apertar, o corte é: O9, O6, O8. **O2, O7, O5 e O1 não se cortam** — são a
conversão do espaço, a governança da equipe, o crédito bloqueante e a identidade que responde.
Sem as quatro, a Organização vira um cadastro sem consequência.
