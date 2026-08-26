# Ontologia e níveis de acesso — o documento de contexto

**Para quem escreve qualquer uma das 7 sessões de bastidor.** Leia antes da primeira tarefa.

Este documento responde uma pergunta só, e responde para toda a aplicação:

> **Quem escreve cada classe, cada relação e cada campo da ontologia?**

Se alguma parte da ontologia não tem autor entre os níveis 1 a 7, a plataforma tem um
buraco que nenhuma tela conserta.

---

## 1. O contrato

A ontologia real está em [`src/dados/tipos.ts`](../../src/dados/tipos.ts), não no PRD.
**20 classes, 14 relações, 7 campos transversais.**

### As 20 classes, nas seis camadas

| Camada | Classes |
|---|---|
| **0 · Vocabulário** | `linguagem` `tema` `termo` `territorio` |
| **1 · Agentes** | `pessoa` `coletivo` `instituicao` `espaco` |
| **2 · Criação** | `obra` |
| **3 · Acontecimentos** | `programa` `evento` `temporada` `ocorrencia` |
| **4 · Conhecimento** | `conteudo` `midia` `publicacao` `formacao` |
| **5 · Pessoa e repertório** | `pessoa-usuaria` `repertorio` `trilha` |

**Decisão dura herdada do PRD §6:** *artista*, *curador*, *produtor* e *educador* **não são
classes — são papéis**. A mesma pessoa é artista num evento e curadora em outro. Papel mora
na aresta `atua_em`, nunca numa classe própria.

### As 14 relações

```
influenciou · dialoga_com · deriva_de · pertence_a · atua_em (com papel)
curou · realiza · ocorre_em · situado_em · aprofunda · fala_sobre
contextualiza · semelhante_a (com motivo) · duplicata_suspeita
```

Vocabulário **fechado**. Nada fora desta lista vira aresta.

### Dois campos condicionais que o gerador trata como invariante

- `papel` — **obrigatório** quando `relacao === "atua_em"`
- `motivo` — **obrigatório** quando `relacao === "semelhante_a"`, em português legível

---

## 2. O estado medido

Contado sobre `src/dados/gerado/meta.json` em 25.08.2026.

### Entidades — 7.810 em 19 classes

| Classe | | Classe | |
|---|---:|---|---:|
| `ocorrencia` | 2.425 | `obra` | 239 |
| `conteudo` | 1.805 | `coletivo` | 217 |
| `pessoa` | 575 | `espaco` | 113 |
| `midia` | 529 | `tema` | 94 |
| `termo` | 481 | `formacao` | 54 |
| `territorio` | 359 | `publicacao` | 46 |
| `evento` | 300 | `linguagem` | 33 |
| `temporada` | 287 | `pessoa-usuaria` | 3 |
| `instituicao` | 246 | `repertorio` | 3 |
| | | `trilha` | 1 |

**`programa` tem zero instâncias.** A classe existe no tipo, o motor a percorre, e nada no
acervo a popula.

### Arestas — 66.563 em 11 relações

| Relação | | Relação | |
|---|---:|---|---:|
| `semelhante_a` | 47.259 | `atua_em` | 508 |
| `pertence_a` | 13.000 | `duplicata_suspeita` | 40 |
| `ocorre_em` | 2.712 | `fala_sobre` | 39 |
| `situado_em` | 1.556 | `dialoga_com` | 31 |
| `aprofunda` | 887 | `contextualiza` | 4 |
| `realiza` | 527 | | |

**`pertence_a` é classificação, não hierarquia.** Medido nas pontas: ocorrência→tema 3.091, ocorrência→linguagem 2.640, conteúdo→tema 1.920, conteúdo→linguagem 1.713. Quem a escreve é quem cria a entidade; o vocabulário do outro lado é do Editor. A relação organizacional de verdade é `realiza` — instituição→evento, 527.

**Três relações declaradas e vazias:** `influenciou`, `deriva_de`, `curou`. Estão no tipo,
valem para o motor de caminhada, e ninguém as escreve.

**71% do grafo é `semelhante_a`** — 47.259 de 66.563 arestas, todas de máquina, todas com
`motivo` obrigatório, nenhuma revisada por humano.

### Procedência

| | `ic` | `derivado` | `autorado` |
|---|---:|---:|---:|
| Nós | 4.826 | 2.937 | 47 |
| Arestas | 14.882 | 51.600 | 81 |

**78% do grafo é máquina.** Não é defeito do protótipo — é a descrição exata do que os
níveis 1 a 7 existem para inverter.

### Ausências declaradas, com denominador

| Medida | |
|---|---|
| Ficha de acessibilidade | 5.108 declaram · **2.702 não** |
| Eventos que declaram ingresso | **0 de 300** |
| Ocorrências com espaço declarado | **0 de 2.425** |
| Eventos datados com artista vinculado | **0 de 129** |
| Componentes da chave de identidade sustentados | **1 de 3** (só o título) |
| Unidades da federação no acervo | **25 de 27** — faltam SE e TO |
| Concentração | **59,2% de 773 REGISTROS em 2 dos 27 estados** — os 773 são registros de `situado_em`, não entidades: por trás deles há **718 entidades distintas**, porque uma entidade pode estar situada em mais de um território. `densidadePorUf()` devolve `total` e `entidadesDistintas` em campos separados, e fundir os dois faz a tela afirmar mais concentração de acervo do que o acervo tem |
| Faixa etária / classificação indicativa | **campo não existe** |

---

## 3. A descoberta central

`Procedencia` hoje tem três valores: `ic | derivado | autorado`. O PRD §6 prevê seis em
produção: `ic`, `derivado`, `parceiro`, `produtor`, `ia`, `curador`.

> **Os níveis de acesso não são uma camada de segurança sobre a ontologia.
> Eles são o vocabulário de procedência.**

Cada papel humano é um valor de `procedencia`; cada escrita carimba quem escreveu. Sem
papéis não há procedência, e sem procedência não existe o argumento central da proposta.

Daí a regra que organiza tudo:

> **Nenhum elemento da ontologia pode existir sem exatamente um papel autorizado a
> autorá-lo. E nenhum papel escreve sem deixar autor — admin incluído.**

---

## 4. Os oito níveis de acesso

| # | Nível | Superfície | Escreve |
|---|---|---|---|
| 1 | **Admin** | Admin | governança, vocabulário de sistema, papéis |
| 2 | **Gestor** | Observatório | **nada** |
| 3 | **Moderador** | Moderação | decisões, com autor e motivo |
| 4 | **Moderador com escopo** | Moderação | o mesmo, recortado |
| 5 | **Editor / Curador** | Redação | sentido, assinado |
| 6 | **Organização** | Studio | identidade estável |
| 7 | **Produtor cultural** | Studio | acontecimento |
| 8 | **Público autenticado** | App (10 apps) | repertório, salvos, sinais |

### O escopo do moderador tem três eixos combináveis

| Eixo | Exemplo |
|---|---|
| **Território** | agenda do Pará |
| **Tipo de conteúdo** | só mídia · só agenda · só editorial · só agentes |
| **Fila** | só duplicatas · só revisão de IA · só direitos de imagem |

Isso não é luxo: SP e RJ concentram 59,2% dos **registros** do acervo — 458 de 773 — e dois
estados, Sergipe e Tocantins, não existem nele. Fila de
moderação centralizada em São Paulo reproduziria na governança o deserto que o mapa
denuncia.

### Studio ≠ Produtor

**Studio é a superfície; produtor é o papel.** Dentro do Studio vivem **dois** níveis: a
Organização governa, o Produtor declara. São a única dupla que não pode rodar em paralelo
sem colidir — mesma pasta.

---

## 5. A matriz — quem escreve o quê

| Camada / elemento | Escreve | Aprova | Lê |
|---|---|---|---|
| `linguagem` `tema` `termo` | Editor | Admin | todos |
| `territorio` + centroide | Admin | — | todos |
| `pessoa` `coletivo` (Enciclopédia) | Editor | Moderador | todos |
| `instituicao` | Organização | Moderador | todos |
| `espaco` + ficha de acessibilidade | Organização | Moderador | todos |
| `obra` | Editor | Moderador | todos |
| `programa` | Organização | Moderador | todos |
| `evento` | Produtor | Moderador | todos |
| `temporada` | Produtor | Moderador | todos |
| `ocorrencia` (data, hora, preço, esgotado) | **Produtor** | — | todos |
| `conteudo` `publicacao` | Editor | Moderador | todos |
| `midia` + crédito | Organização | Moderador | todos |
| `formacao` | Organização | Moderador | todos |
| `pessoa-usuaria` `repertorio` | Público | — | Gestor (agregado) |
| `trilha` | Editor | — | todos |
| `atua_em` (papel) | **Produtor** | Moderador | todos |
| `realiza` `ocorre_em` `situado_em` | Produtor | Moderador | todos |
| `pertence_a` — **classificação**, não hierarquia | quem cria a entidade, com o vocabulário do Editor | Moderador | todos |
| `influenciou` `dialoga_com` `deriva_de` `curou` | **Editor** | — | todos |
| `aprofunda` `fala_sobre` `contextualiza` | Editor | — | todos |
| `semelhante_a` + motivo | máquina | Moderador (por regra) | todos |
| `duplicata_suspeita` | máquina | Produtor / Moderador | — |
| `procedencia` `chaveIdentidade` `coordenada` | **sistema — nunca digitável** | — | todos |

---

## 6. A cadeia de identidade

```
evento      = título normalizado + agente realizador + obra
temporada   = evento + espaço + intervalo
ocorrência  = temporada + início exato + espaço
```

Não é preferência de UX. É o critério da ontologia, e `duplicatas.ts` é explícito: *"o
critério é o da ontologia, não uma medida de parecença entre textos: ele afirma o que faz
duas linhas serem a mesma coisa no mundo"*.

Qualquer formulário que deixe criar sessão antes de temporada grava registro sem chave — e
a fila de duplicatas passa a acusar o próprio sistema.

`COMPONENTES_DO_CRITERIO` mede que **só o título é sustentado**. Agente realizador e obra
estão vazios em 300 de 300 eventos. **O produtor preenche os outros dois terços.**

---

## 7. A fronteira da Enciclopédia

O Studio **lê e nunca edita** quatro classes. São 575 pessoas no protótipo e **43.614 na
base completa** — pessoas reais que nunca se cadastraram.

| Classe | Autoridade | Studio pode |
|---|---|---|
| `pessoa` · `coletivo` | Enciclopédia | referenciar, **propor**, nunca editar |
| `obra` | Enciclopédia | referenciar, **propor**, nunca editar |
| `termo` `linguagem` `tema` | Editor | escolher, **propor**, nunca criar |
| `territorio` | Admin | escolher |

Um produtor editar o verbete de um artista real seria a violação exata que o projeto se
proibiu. O único caminho de escrita é a **reconciliação** (funcionalidade 37), que passa
pelo moderador.

---

## 8. As três portas entre níveis

Em três pontos um nível depende de outro e não resolve sozinho. **Nenhuma pode virar beco
sem saída:** cada uma tem estado visível e caminho de volta. É o que prova que os sete
níveis se conversam.

| Falta | Vai para | Estado na tela |
|---|---|---|
| pessoa ou obra não existe | Moderador (117) | *proposta aguardando reconciliação* |
| espaço não existe | Organização (142) | *aguardando cadastro do espaço* |
| termo fora do vocabulário | Editor (130) | *termo proposto, em análise* |

E uma porta de volta: **duplicata** — a máquina propõe, o produtor decide sobre os próprios
registros, o moderador decide entre organizações distintas.

---

## 9. O que os níveis convertem

O argumento da proposta, em números que mudam sozinhos:

| | Hoje | Depois |
|---|---|---|
| `ocorrencia` | 2.425 **`derivado`** | `produtor` |
| Espaço declarado | 0 de 2.425 | declarado |
| Ingresso declarado | 0 de 300 | declarado |
| Componentes da chave | 1 de 3 | 3 de 3 |
| Elenco em evento datado | 0 de 129 | declarado |
| Ficha de acessibilidade | 2.702 não declaram | declarado, inclusive a ausência |
| Nós de máquina | 78% | cai a cada publicação |
| `programa` | 0 instâncias | povoado |
| `influenciou` `deriva_de` `curou` | 0 arestas | autoradas e assinadas |

`Ocorrencia` traz no próprio comentário do tipo: *"SEMPRE `derivado`: o campo `schedules` do
CMS está vazio em 100% dos 100 eventos, então nenhuma ocorrência existe em sistema nenhum do
IC."*

**O bastidor é o mecanismo pelo qual a plataforma deixa de derivar e passa a saber.** Cada
linha acima é uma tela do Observatório mudando de valor sem ninguém tocar em código.

---

## 10. O campo mais sutil do modelo

`declaraAcessibilidade` registra **o ato de preencher a ficha**, não o conteúdo dela.

Em `acessibilidade`, um `false` significa *"não oferece"* e *"não declarou"* ao mesmo tempo.
O tipo obriga o campo a existir e **proíbe que seja opcional**, porque campo ausente teria de
ser lido como "não declarou" — e ler ausência como declaração é o erro exato que a regra
existe para não cometer.

**Consequência de interface, em qualquer tela que colete acessibilidade:** não pode haver só
caixas de marcar. Precisa de um ato explícito, com peso igual ao de salvar:

> **"Declaro que não oferece nenhum destes recursos."**

Sem esse botão, quem preenche gera silêncio — e silêncio é o que a plataforma se proibiu de
interpretar.

---

## 11. As 167 funcionalidades

As **86 do catálogo original** ([`docs/funcionalidades.md`](../../docs/funcionalidades.md))
são o nível 8, já construídas. **A numeração não se renumera.** As **81 de bastidor** vão de
87 a 167.

| Nível | Faixa | Total |
|---|---|---|
| 1 · Admin | 87–100 | 14 |
| 2 · Gestor | 101–107 | 7 |
| 3 · Moderador | 108–121 | 14 |
| 4 · Moderador com escopo | 122–125 | 4 |
| 5 · Editor / Curador | 126–138 | 13 |
| 6 · Organização | 139–152 | 14 |
| 7 · Produtor | 153–167 | 15 |
| 8 · Público | 1–57, 78–86 | 66 |

Duas pendentes de numeração, achadas na auditoria de fiscalização: **168** painel de
conformidade da equipe (Organização vê a fila dos próprios produtores) e **169** desempenho
da moderação por escopo (Admin e Gestor medem tempo de fila e concordância entre
moderadores).

---

## 12. Lacunas do contrato

Campos que a jornada exige e que `tipos.ts` **não tem**. Precisam entrar antes de qualquer
sessão codar.

| Campo | Onde | Por quê |
|---|---|---|
| `faixaEtaria` | `Entidade` | a disposição *"vou com criança"* está no ar com `campoLido: null` |
| `canalIngresso` | `Ocorrencia` | só existe o booleano `gratuito`; 0 de 300 declaram |
| `inscricao` | `Ocorrencia` | para o que não tem bilheteria |
| `Situacao` | novo tipo | rascunho · em-moderacao · devolvido · publicado · suspenso |
| `"produtor"` | `Procedencia` | cada papel é um valor de procedência |

`Situacao` é a mais importante: **sem ela não há jornada, só formulário.**

---

## 13. Restrições técnicas que valem para as 7 sessões

Herdadas do que já está construído e verificado. Quebrar derruba portão existente.

1. **Sem back-end.** Export estático, 2.463 páginas, zero requisições em execução. Estado no
   cliente, `localStorage` com chave versionada.
2. **DP-F.** Componente de servidor lê o grafo no build; **só DTO de primitivo atravessa**.
   `entidades.json` tem 9,4 MB. Cliente importa módulo de dados **apenas por tipo**.
3. **Sem relógio, sem sorteio.** `DATA_DE_REFERENCIA = "2026-08-22"`. `new Date()` ou
   `Math.random()` no cliente fazem o HTML exportado divergir da página hidratada.
   `localStorage` só em `useEffect`, nunca no render.
4. **Duas visões, um componente.** `desk:` é `[data-view="web"]`, **não media query**.
   Componente irmão por visão é **proibido**. Divergência em CSS puro sob `[data-view]`.
5. **`fixed` só em `casca.tsx`.** Drawer, folha e scrim posicionam `absolute` contra a
   `.moldura`.
6. **Nenhum hex novo.** `var(--ic-*)` e `color-mix`. Cor de linguagem vem do dado.
7. **Um arquivo CSS por sessão**, em `src/estilos/`. `globals.css` é o ponto de colisão e já
   tem os `@import` declarados.
8. **Ausência é declarada, com denominador.** Vale para as telas de bastidor: campo que o
   mock não sustenta diz que não sustenta.

---

## 14. Ordem das ondas

| Onda | Sessões | Por quê |
|---|---|---|
| **1** | S7 Produtor · S3 Moderação | o par que prova a tese e mais estressa o contrato |
| **2** | S1 Admin · S5 Editor · S6 Organização · S2 Gestor | contrato assentado |
| **3** | S4 Escopo | variação da S3, barato no fim |

**S6 e S7 são a mesma pasta** (`(bastidor)/studio/`) — não rodam em paralelo.

Regra dura entre sessões: **ninguém edita arquivo fora da própria pasta.** Precisou mudar o
contrato, escreve `PEDIDO` no `PAINEL.md` e segue com mock local até ser atendido.
