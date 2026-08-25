# PRD — S2 · Gestor / Observatório

**Onda 2 · sessão 4 de 4.** A única sem bloqueio nenhum — pasta e folha próprias, e não
depende de contrato de outra sessão.

---

## 0. Objetivo

Construir a superfície onde a gestão institucional **prova impacto cultural** — e onde a
plataforma declara, em voz alta, quanto do que exibe é dela e quanto é do acervo.

**Critério de pronto.** Um avaliador senta na frente da tela e consegue: escolher o público
a que pertence e ver os mesmos indicadores em outra ordem, distinguir um indicador que o
acervo não sustenta de um que mediu zero, ver de onde saiu cada número, ler a ampliação de
repertório de cada persona, encontrar os desertos culturais no mapa, e exportar. Recarregar
preserva a escolha de público. Um botão reinicia a demonstração.

**O que esta sessão prova.** Que é possível fazer painel institucional sem mentir. Todo
protótipo de agenda cultural inventa dado para a demonstração funcionar; nenhum diz quanto.
Aqui o painel de procedência é tela de primeira classe e diz, com o número contado: **4.826
entidades vieram do acervo, 2.937 derivamos por regra, 47 inventamos.**

---

## 1. Análise ontológica do Gestor

### 1.1 É o único nível que não escreve nada

Dos oito, é o único com **zero escrita na ontologia**. Não cria classe, não cria aresta, não
carimba procedência.

Isso não é limitação — é o desenho. Quem prova impacto não pode ser quem produz o dado que
prova. Se o gestor pudesse editar, o indicador viraria autorreferência, e a proposta perde o
argumento inteiro.

**Consequência dura para a sessão:** nenhuma tela desta superfície tem uma única ação de
escrita. A suíte verifica isso, e é o portão mais importante dela.

### 1.2 O que ele lê, e por que a ontologia foi desenhada assim

| Fonte | O que dá |
|---|---|
| `repertorio` | ampliação de repertório — a métrica de impacto do RFP |
| `pessoa-usuaria` | 3 personas, com repertório declarado |
| `contagens()` do grafo | as fatias de procedência, contadas |
| `meta.json` | a testemunha independente da conferência |
| `densidadePorUf()` | densidade e desertos |
| `fichaDeAcessibilidade` | 5.108 declaram · 2.702 não |

O PRD §6 é explícito sobre por que `Repertório` é entidade de primeira classe **desde o dia
um**: *"é dela que sai o indicador de ampliação de repertório que o RFP pede. Métrica de
impacto não pode ser puxadinho de analytics."*

**A ontologia foi desenhada para esta tela existir.** É o único caso do projeto em que uma
decisão de modelagem foi tomada por causa de um indicador.

### 1.3 A distinção que define tudo

`Indicador` já codifica no tipo:

```ts
valor: number | null;   // null SÓ quando sustentado é falso
sustentado: boolean;    // falso = «o corte não recorta», não «o corte deu zero»
declaracao: string | null;  // OBRIGATÓRIA quando sustentado é falso
```

> **`valor: null` com `sustentado: false`** — o dado não sustenta o indicador.
> **`valor: 0` com `sustentado: true`** — uma medida real que deu zero.

**As duas existem neste acervo ao mesmo tempo**, e o comentário do módulo diz quais:

- **Gratuidade não sustenta** — 0 de 300 eventos declaram preço, então o corte não recorta
  nada
- **A descoberta de artista novo da Joana é zero MEDIDO** sobre 68 adjacentes reais

Um tipo que achatasse as duas num zero faria a tela mentir sobre uma delas, **e não haveria
como saber qual**. É a decisão de tipagem mais importante do projeto.

### 1.4 Recorte é ênfase, não filtro

`Publico` já decidiu:

> *"Os MESMOS indicadores, em outra ordem. Nenhum some; nenhum é exclusivo. O recorte é
> ênfase, não filtro."*

Painel institucional costuma funcionar ao contrário: cada público recebe o subconjunto que
lhe convém, e ninguém vê o número inconveniente. **Aqui a ordem muda e o conjunto não.** É
uma afirmação de governança embutida na estrutura de dados, e a S2 precisa preservá-la.

### 1.5 Todo número diz de onde veio

`Indicador.procedenciaDoNumero` guarda **o módulo e a função** que produziram o valor. E
`FatiaDeProcedencia.regraDoExemplo` guarda como o exemplo foi escolhido — *"regra, nunca
escolha à mão"*.

Nenhum literal na tela. O módulo é explícito: os literais que aparecem no arquivo são
**conferências**, não valores. *"Um número copiado à mão mente em silêncio na primeira
regeração do grafo; uma conferência que não fecha derruba o build."*

### 1.6 A conferência de três pontas

As fatias de entidade são contadas na tela, comparadas com `contagens()` do grafo **e** com
`porProcedencia` do `meta.json`, escrito num processo separado. As de aresta, o mesmo contra
`porProcedenciaDeAresta`.

**Três fontes independentes precisam concordar para a tela abrir.** Uma fatia que não fecha é
sintoma de `porProcedencia` desatualizado, e é melhor não compilar do que exibir.

---

## 2. A herança: o que já existe

`src/dados/observatorio.ts` tem 1.070+ linhas e é o módulo mais sofisticado do projeto.
**Leia inteiro antes de escrever.**

| Peça | O que é |
|---|---|
| `Indicador` | valor, denominador, sustentado, declaração, leitura, detalhe |
| `Denominador` · `denominadorSecundario` | a leitura honesta que exige dois — gratuidade |
| `indicadores()` | os indicadores medidos |
| `FatiaDeProcedencia` | fração, percentual, significado, exemplo, **regra do exemplo**, composição |
| `painelDeProcedencia()` | as duas leituras: entidades e arestas |
| `leituraDaDiferenca` | *"a segunda leitura, que é a que explica por que o grafo parece rico"* |
| `Conferencia` | a conferência de três pontas |
| `Publico` · `PUBLICOS` | os públicos, com `ordem` e `destaques` |
| `SIGNIFICADO_DA_PROCEDENCIA` | o que cada procedência quer dizer, em texto de produto |
| `numerosDoObservatorio()` | os números da tela |
| `montarObservatorio()` | o DTO completo |
| `TETO_DO_DTO` | **61.440 bytes** — o mesmo teto da fila |

**Não recalcule nada disso.** A S2 reorganiza a superfície e acrescenta o que falta; o motor
de medição já existe e é auditado por três fontes.

---

## 3. Restrições herdadas

Seção 13 de `ONTOLOGIA-E-ACESSOS.md`. As específicas:

- **Zero escrita.** Nenhuma tela desta superfície tem ação de escrita. É portão
- **DP-F** — `observatorio.ts` alcança o grafo inteiro e `meta.json`. `TETO_DO_DTO = 61.440`
- **Nenhum literal.** Todo número sai de travessia, contagem ou `meta.json`. Literal só como
  conferência, e conferência que não fecha derruba o build
- **Sem relógio.** O frescor exibido é `geradoEm`, nunca o relógio de quem avalia
- **Duas visões, um componente.** `desk:` é `[data-view="web"]`
- **Só sua pasta:** `(bastidor)/observatorio/`, `componentes/observatorio-*`,
  `src/dados/observatorio.ts`, `src/estilos/observatorio.css` — que **já existe e já está
  importado** em `globals.css:81`. Você não toca no arquivo de colisão

---

## 4. Escopo — funcionalidades 101 a 107

| # | Funcionalidade | Tela |
|---|---|---|
| 101 | Dashboards por público: editorial, produto, parceiro, institucional | G1 |
| 102 | KPIs de produto — aquisição, engajamento, descoberta, retenção | G2 |
| 103 | Impacto cultural — ampliação de repertório, diversidade | G3 |
| 104 | Indicadores territoriais e institucionais | G4 |
| 105 | Painel de procedência, três fatias contadas | G5 |
| 106 | Ausência declarada com denominador | G6 |
| 107 | Exportação versionada e dados abertos | G7 |
| 169 | Desempenho da moderação — **em leitura** | G8 |

---

## 5. As telas

Oito: uma estendida e sete novas. A tela única de hoje vira superfície navegável.

---

### G1 · Público e visão geral
`(bastidor)/observatorio/` — **a raiz passa a ser o seletor de público**

**Objetivo.** A tela que prova que ninguém recebe um painel que esconde número.

**Escreve.** nada. Guarda a escolha de público no cliente.

**Conteúdo.**
- Os quatro públicos: **editorial · produto · parceiro · institucional**
- Cada um com a **pergunta que ele faz** — é ela que justifica a ordem
- Os mesmos indicadores em ordem diferente, com os primeiros `destaques` ganhando peso visual
- **A declaração, impressa na tela:** *nenhum indicador some, nenhum é exclusivo. O recorte é
  ênfase, não filtro*
- Trocar de público **sem trocar de URL** — mesma superfície, recortes diferentes

**A prova visual que a tela deve dar.** Trocar de público e ver o mesmo conjunto reordenar,
não encolher. Se um número desaparecer ao trocar de público, o portão falhou.

**App.** Público em segmento no topo; indicadores em cartão.
**Web.** Público em coluna fixa à esquerda, grade de indicadores à direita.

---

### G2 · KPIs de produto
`(bastidor)/observatorio/produto`

**Objetivo.** Aquisição, engajamento, descoberta, retenção — e a honestidade sobre o que o
protótipo não pode medir.

**Escreve.** nada.

**Conteúdo.**
- Cada KPI com valor, unidade, **denominador** e `procedenciaDoNumero`
- **Os que o acervo não sustenta**, com `valor: null` e a declaração obrigatória. Sinal de
  comportamento real não existe: não há sessão, não há retorno, não há funil
- Os que **são medidos de verdade**: a distância entre feeds, o número de linguagens
  atravessadas, o alcance da caminhada
- O número que o protótipo já mede e que vale exibir: **o feed da Maria e o do Carlos
  compartilham 1 item em 12.** É personalização medida, não afirmada

**Regra dura.** Não invente engajamento. Um KPI de produto sem usuário real é `null` com
declaração, nunca um número plausível.

**App.** Um KPI por cartão.
**Web.** Grade, com o denominador sob cada número.

---

### G3 · Impacto cultural
`(bastidor)/observatorio/impacto`

**Objetivo.** O indicador que o RFP pede, e o motivo pelo qual `Repertório` é entidade de
primeira classe.

**Escreve.** nada.

**Conteúdo.**
- **Ampliação de repertório** por persona, lido de `repertorio.ts`
- As três personas, com o que o protótipo mede: Maria atravessou 8 linguagens e tem 4 a um
  passo; Carlos, 5 e 8; Joana, 10 e 9
- **O caso didático de D-90, e ele precisa estar em destaque:** a descoberta de artista novo
  da Joana é **zero MEDIDO** sobre 68 adjacentes reais. `valor: 0`, `sustentado: true`. Ao
  lado, gratuidade: `valor: null`, `sustentado: false`, porque 0 de 300 eventos declaram
  preço. **As duas na mesma tela, visualmente distintas**
- Diversidade: linguagens novas presentes no adjacente e ausentes do atravessado
- **O denominador honesto do conjunto: 3 personas.** A amostra é minúscula e a tela diz, com
  o número. Um indicador de impacto sobre 3 pessoas é demonstração, não medição

**A tela mais importante da sessão.** É onde a distinção entre "não sustenta" e "mediu zero"
deixa de ser tipagem e vira interface.

**App.** Persona em segmento; indicadores embaixo.
**Web.** Personas à esquerda, ampliação e diversidade à direita.

---

### G4 · Território
`(bastidor)/observatorio/territorio`

**Objetivo.** O diagnóstico que justifica a plataforma existir.

**Escreve.** nada.

**Conteúdo.**
- Densidade por UF, de `densidadePorUf()`
- **Sergipe e Tocantins não existem no acervo** — 25 de 27 unidades da federação. A tabela de
  centroides conhece as 27; o acervo tem 25
- **59% de 773 entidades em 2 dos 27 estados**
- A camada de desertos culturais — onde não há oferta
- **48 dos 158 eventos situados têm coordenada fora do Brasil**
- A distribuição por `MetodoCoordenada`: 214 `centroide-pais`, 118 município, 113 espaço, 27
  estado. Quase metade das coordenadas é o centroide de um país inteiro
- Indicadores institucionais: 246 instituições, **0 com coordenada**

**A leitura que a tela precisa dar.** O mapa de desertos não é recurso — é o diagnóstico. E a
concentração medida é o argumento de que a plataforma precisa ser nacional por construção,
não por intenção.

**App.** Mapa como lente, indicadores em lista.
**Web.** Mapa à esquerda, tabela por UF à direita.

---

### G5 · Procedência
`(bastidor)/observatorio/procedencia` — **estende o painel existente**

**Objetivo.** A tela que mais distingue a proposta.

**Escreve.** nada.

**Conteúdo herdado, que fica.** As fatias de entidade e de aresta, com fração, percentual,
significado, **exemplo escolhido por regra** e composição. A conferência de três pontas. A
`leituraDaDiferenca`.

**O que a S2 acrescenta.**
- **As duas leituras lado a lado**, porque a diferença entre elas é o ponto: nós são 62% `ic`;
  arestas são **78% `derivado`**. `leituraDaDiferenca` já explica por quê — é ela que diz por
  que o grafo *parece* mais rico do que a fonte
- A conferência visível: as três fontes, se fecham, e o que aconteceria se não fechassem
- **O eixo do tempo:** as seis procedências de produção — `ic`, `derivado`, `parceiro`,
  `produtor`, `ia`, `curador` — com as três que existem hoje preenchidas e as três que abrem
  quando o bastidor entrar no ar
- `SIGNIFICADO_DA_PROCEDENCIA` por extenso

**A frase que sustenta a tela.** É justamente por afirmar em voz alta o que é invenção nossa
— **47 nós e 81 arestas** — que todo o resto passa a ser verificável em vez de acreditável.

**App.** Fatias empilhadas; composição em folha.
**Web.** Entidades e arestas lado a lado, conferência embaixo.

---

### G6 · Ausência declarada
`(bastidor)/observatorio/ausencia`

**Objetivo.** Reunir num lugar só o que o produto declara espalhado — e transformar a
disciplina em indicador.

**Escreve.** nada.

**Conteúdo.**
- Cada ausência com **denominador**, no formato que o produto já usa:
  - 0 de 300 eventos declaram ingresso
  - 2.425 de 2.425 ocorrências sem espaço declarado
  - 0 de 129 eventos datados com artista vinculado
  - 2.702 de 7.810 não declaram ficha de acessibilidade
  - 0 de 246 instituições com coordenada
  - audiodescrição em 0 de 529 mídias
  - `programa`, `influenciou`, `deriva_de`, `curou` — quatro elementos da ontologia com zero
    instâncias
- **Cada uma com o nível que a preencheria** — produtor, organização, editor. É o que
  transforma a lista de buracos em plano de trabalho
- A projeção: o que cada indicador vira quando o bastidor entrar no ar

**Por que esta tela é boa numa banca.** Nenhum concorrente vai ter uma tela dedicada ao que
não sabe. E ela é o argumento mais forte de que os outros números são confiáveis.

**App.** Lista com denominador em destaque.
**Web.** Ausência à esquerda, quem preenche e a projeção à direita.

---

### G7 · Exportação e dados abertos
`(bastidor)/observatorio/dados`

**Objetivo.** A funcionalidade 75 — infraestrutura nacional implica que outros constroem em
cima.

**Escreve.** nada. Gera arquivo no cliente.

**Conteúdo.**
- Exportação dos indicadores, versionada, com `geradoEm` no cabeçalho
- **O dicionário de dados** — cada campo com significado e procedência. Exportar número sem
  dicionário é exportar mal-entendido
- Formatos: CSV e JSON
- A declaração de licença e de anonimização (76): o Observatório lê **agregado**, nunca
  indivíduo
- **A API pública é do Admin** (97, chaves e limites). Esta tela documenta o que existe e
  encaminha

**Restrição do artefato.** Export estático, e o visualizador bloqueia download iniciado pela
própria página. **Não ofereça arquivo por link.** Mostre o conteúdo exportável em tela, com
o dicionário, e declare que o download é da versão hospedada.

**App.** Seleção do recorte; prévia em folha.
**Web.** Recorte à esquerda, prévia e dicionário à direita.

---

### G8 · Leitura da moderação
`(bastidor)/observatorio/moderacao`

**Objetivo.** A funcionalidade 169, do lado de quem observa — não de quem governa.

**Escreve.** nada.

**Conteúdo.**
- Tempo de fila por escopo, volume decidido por ação, fila parada por território
- **Cruzado com a densidade:** um território com pouco acervo e fila parada é abandono, não
  calmaria. É a leitura que só faz sentido no Observatório, porque só aqui os dois números
  convivem
- Taxa de veto agregada

**A distinção de três telas parecidas, e ela precisa estar escrita:**

| Tela | De quem | O que mede |
|---|---|---|
| M9 · meu histórico | do moderador, para ele | as próprias decisões |
| A10 · desempenho | do Admin | quem modera, para governar |
| **G8 · leitura** | do Gestor | **o sistema de moderação, agregado** |

O Gestor vê **agregado e anonimizado**. Nome de moderador não aparece aqui. Confundir as três
transforma indicador em vigilância.

**App.** Indicadores em cartão.
**Web.** Grade com o mapa de fila por território.

---

## 6. Responsividade

Seção 8 do PRD da S7 e seção 13 do documento de contexto.

**Padrão desta sessão:** app é uma coluna com o detalhe do indicador em folha; web é grade
com **o denominador sempre sob o número**, nunca em nota de rodapé. Número sem denominador
visível é o defeito que esta superfície inteira existe para não ter.

A tabela por UF e a prévia de exportação rolam **dentro do contêiner**.

**Atenção ao teto.** `TETO_DO_DTO = 61.440` bytes. A superfície navegável tem oito telas, e a
tentação é mandar o DTO completo para todas. Recorte por tela no servidor.

---

## 7. Lacunas de contrato

Poucas — o módulo já é o mais completo do projeto.

| Tipo | Por quê |
|---|---|
| `AusenciaDeclarada` | ausência, denominador, **nível que preenche**, projeção |
| `DicionarioDeDados` | campo, significado, procedência, unidade |
| `LeituraDaModeracao` | agregado e anonimizado — sem nome de moderador |
| `Procedencia` += 3 | `parceiro`, `produtor`, `ia`, `curador` para o eixo do tempo da G5 |

`AusenciaDeclarada` é a que interessa: **o campo `nívelQuePreenche` é o que transforma a
lista de buracos em plano de trabalho**, e é o que liga esta tela às outras cinco sessões.

---

## 8. Fora de escopo

- **Qualquer escrita.** É a definição do nível
- Autenticação real
- Back-end, banco, API. A exportação gera em tela
- **Emitir chave de API** — é o Admin (97)
- **Observabilidade do sistema** — cobertura, frescor, reprocessamento. É o Admin (95). O
  Gestor observa **o público e o acervo**; o Admin observa **a máquina**
- Nome de moderador individual na G8

---

## 9. Portões de verificação

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs`
3. **A conferência de três pontas continua fechando** — é portão existente e derruba o build
4. `TETO_DO_DTO` — cada tela abaixo de 61.440 bytes
5. Suíte nova `scripts/verificar-gestor.mjs`:
   - **nenhuma tela da superfície tem ação de escrita** — o portão central
   - todo indicador com `sustentado: false` tem `valor: null` **e** declaração preenchida
   - nenhum indicador com `sustentado: true` tem `valor: null`
   - todo número exibido tem denominador visível
   - todo número tem `procedenciaDoNumero`
   - trocar de público **reordena e não remove** — o conjunto de ids é idêntico
   - trocar de público não muda a URL
   - a G8 não expõe nome de moderador
   - nenhum literal de número na camada de tela
6. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
7. Zero erro de console numa navegação completa, nas duas visões

---

## 10. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | Ler `observatorio.ts` inteiro e recortar o DTO por tela | — |
| 2 | **G1** público e visão geral — a superfície navegável | 1 |
| 3 | **G3** impacto cultural — fixa o padrão visual de D-90 | 2 |
| 4 | **G5** procedência — estende o painel existente | 2 |
| 5 | **G6** ausência declarada | 3 |
| 6 | **G4** território | 2 |
| 7 | **G2** KPIs de produto | 3 |
| 8 | **G7** exportação | 5 |
| 9 | **G8** leitura da moderação | S3 em andamento |
| 10 | Suíte e medidas | 9 |

**Comece pela G1 e siga direto para a G3.** A G3 é onde a distinção entre `valor: null` e
`valor: 0` vira interface, e todas as outras telas copiam esse tratamento visual. Fazer a G5
primeiro parece natural — ela é a mais bonita — e é um erro: sem o padrão de D-90
estabelecido, os indicadores das outras seis telas saem achatados e você reescreve tudo.

Tarefas 6, 7 e 8 são independentes entre si.

Se o prazo apertar, o corte é: G8, G7, G2. **G1, G3, G5 e G6 não se cortam** — são o recorte
que não esconde, a distinção entre não sustentar e medir zero, a procedência contada e a
ausência com denominador. São as quatro telas que fazem o Observatório ser o oposto de um
painel institucional comum.
