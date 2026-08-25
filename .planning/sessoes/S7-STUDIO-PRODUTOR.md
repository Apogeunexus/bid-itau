# PRD — S7 · Studio · Produtor cultural

**Onda 1 · sessão 1 de 2.** A outra é S3 · Moderação, que recebe o que esta sessão envia.

---

## 0. Objetivo

Construir a superfície onde o produtor cultural **declara** o que acontece, de forma que
quem avalia a proposta consiga percorrer a jornada inteira — do rascunho ao envio para
moderação — com dado mockado, sem back-end, nas duas visões.

**Critério de pronto.** Um avaliador senta na frente da tela sem instrução e consegue:
publicar um evento novo, declarar as sessões reais, vincular o elenco, preencher a ficha
de acessibilidade, enviar para moderação, e ver o registro mudar de situação. Ao recarregar
a página, o que ele fez continua lá. Um botão devolve tudo ao estado inicial para a próxima
demonstração.

**O que esta sessão prova.** Que a plataforma deixa de derivar e passa a saber. Cada
publicação move dado de `derivado` para `produtor`, e é essa conversão — não a tela — que é
o argumento.

---

## 1. Restrições herdadas — não negociáveis

Vêm do que já está construído e verificado. Quebrar qualquer uma derruba portão existente.

### 1.1 Sem back-end
O artefato é export estático (`npm run build` → `out/`, 2.463 páginas, **zero requisições
externas em execução**). Não existe servidor em tempo de execução. Todo estado da jornada
vive no cliente.

### 1.2 DP-F — a fronteira servidor/cliente
Componente de servidor lê o grafo no build; **só DTO de primitivo atravessa** para o
cliente. `entidades.json` tem 9,4 MB e o grafo 23 MB. Nenhuma `Entidade` inteira passa.
Componente `"use client"` importa módulo de dados **apenas por tipo**.

### 1.3 Nada de relógio nem de sorteio em execução
`DATA_DE_REFERENCIA = "2026-08-22"`. Ler `new Date()` ou `Math.random()` no cliente faz o
HTML exportado divergir da página hidratada e expõe o fuso de quem avalia. Semente fixa,
sempre.

### 1.4 Duas visões, um componente
`desk:` **não é media query** — é `@custom-variant desk (&:is([data-view="web"] *,
[data-view="web"]))`. O design system proíbe componente irmão por visão. Divergência entre
app e web se faz em **CSS puro** sob `[data-view="web"]` / `[data-view="mobile"]`, porque
`app:`/`desk:` só prefixam utilitário do Tailwind e não alcançam classe semântica.

### 1.5 Regras da casa
- `position: fixed` só em `casca.tsx` — dentro da moldura de celular ele escapa e quebra D-03.
  Drawer, folha e scrim posicionam `absolute` contra a `.moldura`.
- Nenhum hex novo: `var(--ic-*)` e `color-mix` para transparência.
- Nenhum `text-[...rem]` em TSX; `rem`/`ms` literais só em `tokens.css`.
- Cor de linguagem vem **do dado**, nunca do CSS.
- CSS só em `src/estilos/studio.css`, que já existe e já está importado em `globals.css:50`.
  **Nenhum arquivo fora de `(bastidor)/studio/` e `componentes/studio-*` é tocado.**

### 1.6 A disciplina do produto
Ausência é declarada, com denominador. Nunca escondida, nunca preenchida com valor
plausível. Vale para as telas desta sessão: um campo que o mock não sustenta diz que não
sustenta.

---

## 2. Escopo — funcionalidades 153 a 167

| # | Funcionalidade | Tela |
|---|---|---|
| 153 | Publicação de evento com validação em tempo real | P2, P8 |
| 154 | Ocorrências reais — data, hora e espaço | P4, P5 |
| 155 | Elenco com papel — a aresta `atua_em` | P3 |
| 156 | Preço, gratuidade e canal de ingresso | P7 |
| 157 | Inscrição, quando não há bilheteria | P7 |
| 158 | Classificação indicativa e faixa etária | P7 |
| 159 | Ficha de acessibilidade com ato explícito de ausência | P6 |
| 160 | Alteração e cancelamento que dispara alerta | E1 |
| 161 | Esgotado em tempo real | E1 |
| 162 | Evento de longa duração com vigência própria | P4 |
| 163 | Duplicata: confirma ou recusa o merge | E2 |
| 164 | Score de qualidade do próprio cadastro | P1, P8 |
| 165 | Imagem com crédito obrigatório | P2 |
| 166 | Alerta de edital compatível | P1 |
| 167 | Painel de alcance dos próprios eventos | P1 |

---

## 3. A cadeia de identidade — por que a ordem das telas é imposta

```
evento      = título normalizado + agente realizador + obra
temporada   = evento + espaço + intervalo
ocorrência  = temporada + início exato + espaço
```

Não é fluxo escolhido. É o critério da ontologia, e `duplicatas.ts` é explícito: *"o critério
é o da ontologia, não uma medida de parecença entre textos"*. Um formulário que deixe criar
sessão antes de temporada grava registro sem chave, e a fila de duplicatas passa a acusar o
próprio Studio.

`COMPONENTES_DO_CRITERIO` mede que **só o título é sustentado hoje**: agente realizador e
obra estão vazios em 300 de 300 eventos. O produtor é quem preenche os outros dois terços da
chave — e é isso que tira a deduplicação da heurística de texto.

---

## 4. A jornada

```
P1 painel
 └─ novo evento
     P2 identidade ──► chave ao vivo · aviso de duplicata
     P3 obra e elenco ──► porta 1: pessoa/obra inexistente → Moderação
     P4 espaço e temporada ──► porta 2: espaço inexistente → Organização
     P5 grade de ocorrências
     P6 ficha de acessibilidade
     P7 comercial e classificação
     P8 revisão e envio ──► situação: em moderação  ══► S3
                                     │
 depois de publicado ────────────────┤
     E1 alteração / cancelamento / esgotado ──► dispara alerta
     E2 duplicata: confirma ou recusa merge
```

**A jornada da S7 termina no envio.** O que acontece do outro lado é a S3. Mas o painel P1
exibe a situação retornada — em moderação, devolvido, publicado — lendo do mesmo estado,
para que a S7 seja demonstrável sozinha antes da S3 existir.

---

## 5. As três portas para fora do Studio

Em três pontos o produtor depende de outro nível e **não pode resolver sozinho**. Num
protótipo isso não pode virar beco sem saída: cada porta tem estado visível e caminho de
volta. É o que prova ao avaliador que os sete níveis se conversam.

| Falta | Vai para | Estado na tela | Ação disponível |
|---|---|---|---|
| pessoa ou obra não existe na Enciclopédia | Moderador (117) | *proposta aguardando reconciliação* | seguir sem ela, ou aguardar |
| espaço não existe | Organização (142) | *aguardando cadastro do espaço* | pedir à organização |
| linguagem ou tema fora do vocabulário | Editor (130) | *termo proposto, em análise* | seguir com os do vocabulário |

Nenhuma das três bloqueia o envio. Todas aparecem no P8 como pendência nomeada.

---

## 6. Modelo de estado da sessão

O que a jornada escreve e que o grafo do build não tem. Vive só no cliente.

```ts
type Situacao =
  | "rascunho"
  | "em-moderacao"
  | "devolvido"
  | "publicado"
  | "suspenso";

interface RascunhoDoProdutor {
  id: string;                    // "evento:produtor:<seq>" — seq determinístico
  situacao: Situacao;
  // ato 1 — identidade
  titulo: string;
  resumo: string;
  linguagens: string[];          // ids do vocabulário; livre é proposta
  temas: string[];
  imagem: string | null;
  creditoImagem: string | null;  // obrigatório se imagem !== null
  // ato 2-3 — obra e elenco
  obraId: string | null;
  elenco: Array<{ agenteId: string; papel: string; proposto: boolean }>;
  // ato 4-5 — espaço e temporada
  temporadas: Array<{
    id: string;
    espacoId: string | null;
    inicio: string;              // AAAA-MM-DD
    fim: string;
    longaDuracao: boolean;
  }>;
  // ato 6 — ocorrências
  ocorrencias: Array<{
    id: string;
    temporadaId: string;
    inicio: string;              // AAAA-MM-DDTHH:mm
    espacoId: string | null;
    gratuito: boolean;
    preco: number | null;
    esgotado: boolean;
  }>;
  // ato 7 — acessibilidade
  acessibilidade: Acessibilidade;   // as 8 dimensões
  declaraAcessibilidade: boolean;   // o ATO, não o conteúdo
  // ato 8 — comercial e classificação
  faixaEtaria: string | null;       // campo novo
  canalIngresso: string | null;     // campo novo
  inscricao: string | null;         // campo novo
  // carimbos
  procedencia: "produtor";          // sistema, nunca digitável
  fonte: string;                    // a organização
  chaveIdentidade: string;          // calculada
  autor: string;
  historico: EntradaDeHistorico[];  // reusa o DTO existente
  pendencias: Array<{ porta: "moderacao" | "organizacao" | "editor"; texto: string }>;
}
```

### Persistência
`localStorage`, chave versionada `studio.v1`. **Leitura só em `useEffect` depois de montar,
nunca durante render** — ler storage no render faz o HTML exportado divergir da página
hidratada, que é o defeito exato que a casa já corrigiu duas vezes.

### Semeadura
Três rascunhos e dois publicados, gerados por semente fixa a partir de eventos reais do
acervo. Nenhum título inventado: o mock usa evento real e declara que a **situação** é
autorada, no mesmo padrão de `CURADOR_AUTORADO` e `OPERADOR_DO_STUDIO`.

### Reinício
Controle **"reiniciar demonstração"** no rodapé do painel. Uma apresentação precisa rodar
duas vezes seguidas. Sem isso a segunda vale menos que a primeira.

---

## 7. As telas

Dez: oito novas e duas estendidas. Cada uma declara o que escreve na ontologia.

---

### P1 · Painel do produtor
`(bastidor)/studio/` — a raiz passa a ser o painel

**Objetivo.** Onde o produtor chega e sabe, em cinco segundos, o que está pendente dele.

**Escreve.** Nada. Lê `RascunhoDoProdutor[]` e o grafo.

**Conteúdo.**
- Lista dos eventos do produtor com **situação** como coluna forte
- Score de qualidade por registro, com o que falta nomeado (164)
- Pendências agrupadas pelas três portas
- Alerta de edital compatível com o perfil (166)
- Alcance dos próprios eventos, com a declaração do que o mock não sustenta (167)
- Ação primária: **novo evento**
- Rodapé: reiniciar demonstração

**Estados.** Sem nenhum evento · só rascunhos · com devolvido (destaque) · tudo publicado.

**App.** Lista de cartões, um por evento, situação como selo. Ação primária fixa no rodapé
da moldura — `absolute`, não `fixed`.
**Web.** Duas colunas: tabela densa à esquerda, painel de pendências e editais à direita.

---

### P2 · Identidade do evento
`(bastidor)/studio/publicar` — **estende a tela existente**

**Objetivo.** Estabelecer a chave de identidade antes de qualquer outra coisa.

**Escreve.** `evento` {titulo, slug, resumo, linguagens[], temas[], imagem, creditoImagem} ·
aresta `realiza` (organização → evento) · calcula `chaveIdentidade`.

**Conteúdo.**
- Título, com **normalização visível ao lado** — a mesma de `indice.ts`
- Aviso de duplicata ao vivo contra os 300 eventos reais, **já implementado**, citando
  `CRITERIO_DE_IDENTIDADE`
- Os três componentes do critério com marca de sustentado / não sustentado
- Resumo em texto puro — nenhum HTML atravessa
- Linguagens e temas por escolha no vocabulário; digitar livre abre **porta 3**
- Imagem com **crédito obrigatório**: sem crédito o campo não valida (165)
- Carimbo: `procedencia: produtor`, `fonte: <organização>` — exibido, não editável

**Validação em tempo real (153).** Título vazio · crédito ausente com imagem presente ·
chave colidindo com evento existente. As três aparecem antes de salvar, não depois.

**App.** Uma coluna, campos empilhados, aviso de duplicata como folha que sobe.
**Web.** Duas colunas: formulário à esquerda, chave e aviso vivos à direita, sempre visíveis.

---

### P3 · Obra e elenco
`(bastidor)/studio/elenco`

**Objetivo.** A ponte. É a tela que fecha o vão entre a agenda e a Enciclopédia.

**Escreve.** aresta evento → `obra` · aresta `atua_em` com **`papel` obrigatório**.

**Por que ela importa.** O grafo tem 508 arestas `atua_em`, todas pessoa↔obra vindas da
Enciclopédia. **Nenhuma liga artista a evento datado** — dos 129 eventos datados, zero têm
artista vinculado. O produtor é o único ator com legitimidade para afirmar que fulano se
apresenta sábado, e é por isso que a equipe se recusou a autorar essas arestas no protótipo.

**Conteúdo.**
- Busca sobre pessoas, coletivos e obras reais do acervo
- Cada vínculo exige **papel** — o tipo obriga, e a tela obriga junto
- Resultado mostra o verbete da Enciclopédia embutido, para conferência
- **Não achou?** Botão *propor à moderação* → **porta 1**. Proposta entra no elenco marcada
  `proposto: true`, com selo visível, e não bloqueia o envio
- Aviso permanente: campos da Enciclopédia são **leitura**. O produtor referencia, nunca edita

**App.** Busca em folha, resultado em lista, papel escolhido em segmento.
**Web.** Busca e resultado lado a lado; elenco montado em lista densa à direita.

---

### P4 · Espaço e temporada
`(bastidor)/studio/temporada`

**Objetivo.** O recorte com começo, fim e lugar — o nível intermediário sem o qual a sessão
não tem chave.

**Escreve.** `temporada` {eventoId, espacoId, inicio, fim} · aresta `situado_em`.

**Conteúdo.**
- Escolha de espaço entre os 113 do acervo e os da própria organização
- **Não achou?** → **porta 2**, pedido à Organização, estado *aguardando cadastro*
- Intervalo com início e fim
- **Longa duração** como regra própria de vigência (162) — exposição e ocupação
- Uma temporada por espaço: mudar de espaço cria temporada nova, e a tela diz isso
- Declaração: *"2.425 de 2.425 ocorrências do acervo não declaram espaço"* — o denominador
  que explica por que esta tela existe

**App.** Passo a passo, calendário em folha.
**Web.** Calendário e lista de temporadas lado a lado.

---

### P5 · Grade de ocorrências
`(bastidor)/studio/grade`

**Objetivo.** Onde 2.425 registros deixam de ser `derivado`.

**Escreve.** `ocorrencia[]` {temporadaId, inicio, espacoId, gratuito, preco, esgotado} ·
aresta `ocorre_em` · `chaveIdentidade` = temporada + início exato + espaço.

**Conteúdo.**
- Gerador de sessões a partir da temporada: dias da semana e horários, com **prévia antes de
  aplicar**
- Cada sessão editável individualmente — horário, espaço, gratuidade
- Colisão de chave marcada na própria linha
- Contador vivo: *"N sessões declaradas · procedência `produtor`"*
- Comparação com o estado do acervo: *"hoje, 2.425 de 2.425 ocorrências são derivadas por
  regra, porque `schedules` do CMS está vazio em 100% dos eventos"*

**App.** Lista de sessões em cartão, uma por linha, edição em folha.
**Web.** Tabela densa, edição em linha. **Mesmo componente** — a divergência é CSS.

---

### P6 · Ficha de acessibilidade
`(bastidor)/studio/acessibilidade`

**Objetivo.** A tela mais sutil do conjunto, e a que mais distingue a proposta.

**Escreve.** `acessibilidade` — as 8 dimensões · **`declaraAcessibilidade: true`**.

**A decisão que define a tela.** `declaraAcessibilidade` registra **o ato de preencher**, não
o conteúdo. Em `acessibilidade`, um `false` significa "não oferece" e "não declarou" ao mesmo
tempo, e ler ausência como declaração é o erro que D-43 existe para não cometer.

Portanto a interface **não pode ter só caixas de marcar**. Precisa de um ato explícito:

> **"Declaro que este evento não oferece nenhum destes recursos."**

Sem esse botão o produtor gera silêncio, e silêncio é o que a plataforma se proibiu de
interpretar.

**Conteúdo.**
- As 8 dimensões: audiodescrição, libras, legenda descritiva, closed caption, legenda aberta,
  tradução simultânea, estenotipia, legenda
- O botão de declaração de ausência, com peso igual ao de salvar
- Herança para as sessões, exibida: *"a sessão não declara nada por conta própria"*
- Estado do acervo com denominador: **5.108 declaram · 2.702 não declaram**
- Ficha do espaço, herdada da Organização, em leitura

**App.** Lista de oito interruptores, declaração de ausência ancorada no rodapé da moldura.
**Web.** Duas colunas: as oito à esquerda, o que o acervo mede à direita.

---

### P7 · Comercial e classificação
`(bastidor)/studio/comercial`

**Objetivo.** Os três campos que a ontologia ainda não tem, e sem os quais dois filtros
públicos ficam desligados.

**Escreve.** `preco` · `gratuito` · `canalIngresso` · `inscricao` · `faixaEtaria`.

**Por que ela existe.** A disposição *"vou com criança"* está no ar com `campoLido: null` e o
texto *"o acervo não declara faixa etária nem classificação indicativa em campo nenhum"*. E
**0 de 300 eventos declaram ingresso**, o que faz o corte de gratuidade não recortar nada.
Esta tela é o que liga os dois.

**Conteúdo.**
- Gratuito / pago, por sessão ou para todas
- Preço quando pago — hoje `preco` é sempre `null` na fonte
- **Canal de ingresso**: link externo, bilheteria no local, ou agendamento da instituição
- **Inscrição** quando não há bilheteria (157)
- **Faixa etária** — livre, 10, 12, 14, 16, 18 (158)
- Aviso: enquanto não declarado, o filtro público fica visível e desligado, com o motivo

**App.** Uma coluna, segmentos.
**Web.** Grade de dois campos por linha.

---

### P8 · Revisão e envio
`(bastidor)/studio/revisar`

**Objetivo.** O fecho da jornada, e a tela que mais fala com o avaliador.

**Escreve.** `situacao: "em-moderacao"` · carimbo de autor e data · a entrada de histórico.

**Conteúdo.**
- Ficha completa do que será enviado, campo a campo, na ordem da ontologia
- **A chave de identidade final**, com os três componentes marcados
- **Score de qualidade** com o que falta nomeado (164)
- **Pendências das três portas**, cada uma com o nível responsável
- **O quadro de conversão de procedência** — o argumento em números:

  | | Antes | Depois deste envio |
  |---|---|---|
  | ocorrências | derivado | produtor |
  | espaço declarado | 0 de N | N de N |
  | ingresso declarado | 0 de N | N de N |
  | componentes da chave | 1 de 3 | 3 de 3 |
  | elenco em evento datado | 0 | N |

- Ação: **enviar para moderação** — com autor e carimbo, nunca anônimo
- Depois do envio: situação muda, e a tela diz para onde foi e quem decide

**App.** Rolagem única, ação ancorada no rodapé da moldura.
**Web.** Duas colunas: ficha à esquerda, conversão e pendências à direita.

---

### E1 · Alteração pós-publicação
`(bastidor)/studio/ocorrencias` — **estende a tela existente**

**Objetivo.** Provar que a alteração propaga. É a outra metade do Cenário 4 do RFP.

**Escreve.** altera `ocorrencia.inicio` · `esgotado` · cancelamento · grava
`EntradaDeHistorico`.

**O que já existe.** 129 eventos com sessões achatadas em tupla, histórico com autor e
carimbo, e `rotaDoOutroLado` — a rota onde a mesma alteração aparece do lado de quem recebe.

**O que a S7 acrescenta.**
- **Esgotado em tempo real** (161), com propagação ao público
- Cancelamento como campo próprio, distinto de alteração de horário
- O alerta disparado exibido do lado do produtor, não só do público
- Motivo obrigatório no cancelamento

---

### E2 · Duplicata
`(bastidor)/studio/duplicatas` — **estende a tela existente**

**Objetivo.** O produtor decide sobre os próprios registros.

**Escreve.** confirma ou recusa `duplicata_suspeita`.

**O que já existe.** 84 grupos, dois estágios, comparação campo a campo, e a distinção entre
grupo `encenado`, `acervo` e `cruzado`.

**O que a S7 acrescenta.**
- Ação de **confirmar merge** ou **recusar com motivo** sobre grupo que envolve o próprio
  registro
- Recusa escala para o moderador — grupo entre organizações distintas não é decisão do
  produtor (113)
- Estado visível: decidido por mim · aguardando moderação · decidido pela moderação

---

## 8. Responsividade

Duas dimensões independentes, e confundi-las é o erro mais provável desta sessão.

### 8.1 As duas visões — `data-view`
Alternadas pelo controle no canto. **Não são breakpoints.** A regra da casa:

- Um componente serve as duas. **Proibido componente irmão por visão.**
- Divergência em CSS puro sob `[data-view="web"]` / `[data-view="mobile"]`
- `app:` / `desk:` só prefixam utilitário do Tailwind — não alcançam classe semântica nossa
- Reusar o vocabulário de `web.css` antes de escrever regra nova: duas colunas, grade
  parametrizada, coluna fixa, painel, realce, alternador, declaração com denominador, lista
  densa

**Padrão desta sessão:** app é uma coluna com folha; web é duas colunas com o vivo à direita
— chave, aviso, conversão, pendência. O que no app aparece depois de tocar, na web está
sempre visível.

### 8.2 A janela real
A visão web precisa servir de 1024 a 1920 sem quebra horizontal. Tabela densa e grade de
ocorrências rolam **dentro do próprio contêiner**, nunca o corpo da página.

A visão app vive dentro da `.moldura`, que é `relative; overflow:hidden` com um filho
`.moldura-rolagem` que rola. Drawer, folha e scrim posicionam `absolute` contra a moldura.
**Nada de `fixed` fora de `casca.tsx`** — dentro da moldura ele escapa.

---

## 9. Lacunas de contrato — para a Fase 0

Quatro adições. Nenhuma quebra o que existe.

1. **`faixaEtaria?: string`** em `Entidade` — hoje `campoLido: null` na disposição
2. **`canalIngresso?: string`** em `Ocorrencia` — hoje só o booleano `gratuito`
3. **`inscricao?: string`** em `Ocorrencia`
4. **`Situacao`** — o estado do registro, que não existe em lugar nenhum. Sem ele não há
   jornada, só formulário.

E uma extensão de vocabulário que a Fase 0 precisa decidir: `Procedencia` ganha `"produtor"`.
Hoje são três valores; o PRD §6 prevê seis em produção. **Cada papel é um valor de
procedência** — é o que costura o modelo de acesso à ontologia.

---

## 10. Fora de escopo

- Autenticação real. O seletor de papel é autorado e a tela diz que é, no padrão de
  `CURADOR_AUTORADO`
- Back-end, banco, API
- Tudo do nível 6 · Organização — mesma pasta, sessão seguinte, onda 2
- As telas da Moderação — são a S3
- Upload real de arquivo: a imagem vem do acervo ou de uma lista mockada, com crédito
- Regenerar o grafo. A S7 escreve **por cima** do grafo do build, no cliente

---

## 11. Portões de verificação

Nenhuma funcionalidade é dada como pronta sem estes cinco verdes:

1. `npm run build` verde e export estático completo
2. `scripts/verificar-ds.mjs` — hex só em `globals.css`, sem `text-[...rem]` em TSX
3. Suíte nova `scripts/verificar-studio.mjs`:
   - toda ocorrência gravada tem `chaveIdentidade` de três partes
   - todo vínculo de elenco tem `papel`
   - nenhum registro é enviado sem `declaraAcessibilidade` resolvido
   - nenhuma imagem sem crédito
   - `procedencia` nunca é digitável
   - recarregar preserva a jornada; reiniciar zera
4. Medidas de pixel em `scripts/medidas.mjs`, nas duas visões
5. Zero erro de console em uma navegação completa da jornada, nas duas visões

---

## 12. Ordem de execução

| | Tarefa | Depende de |
|---|---|---|
| 1 | Contrato de estado + `localStorage` + semente + reinício | Fase 0 |
| 2 | **P2** identidade — estende `publicar` | 1 |
| 3 | **P5** grade de ocorrências | 2 |
| 4 | **P3** obra e elenco | 2 |
| 5 | **P4** espaço e temporada | 2 |
| 6 | **P6** ficha de acessibilidade | 2 |
| 7 | **P7** comercial e classificação | 2 |
| 8 | **P8** revisão e envio | 3–7 |
| 9 | **P1** painel | 8 |
| 10 | **E1** alteração · **E2** duplicata | 8 |
| 11 | Suíte e medidas | 10 |

**Tarefas 3 a 7 são independentes entre si** — é onde a sessão pode acelerar.

Se o prazo apertar, o corte é nesta ordem: E2, E1, P7. **P2, P5, P6 e P8 não se cortam** —
são a chave de identidade, a conversão de procedência, a declaração de ausência e o fecho da
jornada. Sem as quatro não há o que demonstrar.
