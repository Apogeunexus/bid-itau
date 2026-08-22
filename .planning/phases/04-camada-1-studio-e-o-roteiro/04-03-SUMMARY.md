---
phase: 04-camada-1-studio-e-o-roteiro
plan: 03
subsystem: studio-ocorrencias
status: complete
tags: [studio, ocorrencias, cenario-4, STUD-02, D-73, D-74, D-75, D-77]

requires:
  - "src/dados/alerta.ts — EVENTO_DO_PAR, alteracoes(), parDeDemonstracao(), DATA_DE_REFERENCIA (fase 3, LEITURA)"
  - "src/dados/repertorio.ts — chaveDeOcorrencia() e indiceDeSalvaveis() (fase 3, LEITURA)"
  - "src/dados/personas.ts — PERSONAS e personaPorId, 3,4 KB de configuração que pode ir ao cliente"
  - "src/contexto/sessao.tsx — salvos, alternarSalvo, personaId, hidratado (LEITURA)"
  - "src/dados/grafo.ts — a única porta para o acervo (D-16, D-47)"
  - "src/estilos/studio.css — vocabulário compartilhado das duas telas de bastidor (04-01, LEITURA)"
provides:
  - "src/dados/ocorrencias-studio.ts — os 129 eventos com sessão, a ficha imutável, os salvamentos semeados, os números honestos"
  - "src/componentes/studio-ocorrencias.tsx — a tela 32 inteira"
  - "src/estilos/studio-ocorrencias.css — 503 linhas (486 acrescentadas ao cabeçalho vazio de 04-01)"
  - "os 11 atributos data-* de 04-03, medidos no DOM vivo e no HTML exportado"
affects:
  - "04-04 pode citar numerosDoAcervo() e o par do Cenário 4 vindo desta tela"
  - "04-05 mede o contrato data-* — CINCO dos onze só existem com uma linha em edição (ver abaixo)"

tech-stack:
  added: []
  patterns:
    - "módulo de build puro, síncrono e memoizado, no molde de grafo.ts, alerta.ts e duplicatas.ts"
    - "DTO só de primitivo atravessando a fronteira DP-F; cliente importa só por tipo"
    - "sessões achatadas em UMA STRING por evento, para o payload RSC não reescapar 2.425 aspas"
    - "regra de chave de ocorrência dirigida pelo prefixo que viaja no DTO, como salvos.tsx já fazia"

key-files:
  created:
    - src/dados/ocorrencias-studio.ts
    - src/componentes/studio-ocorrencias.tsx
  modified:
    - src/app/(bastidor)/studio/ocorrencias/page.tsx
    - src/estilos/studio-ocorrencias.css

decisions:
  - "o número de impacto é um CONJUNTO DE PESSOAS indexado por nome de persona, nunca uma soma de salvamentos — quem aparece pelo repertório semeado E pelo storage conta uma vez, com as duas origens declaradas"
  - "as sessões atravessam a fronteira como string `resto|AAAA-MM-DDTHH:mm|g;…`, e não como array de tuplas: medido, o array custou 268.367 bytes de HTML exportado contra 219.854 da string, porque o payload RSC reescapa cada aspa"
  - "o formulário de edição abre pré-preenchido com o `para` de alerta.ts quando a linha é a do Cenário 4 — confirmar produz EXATAMENTE a alteração que /salvos exibe, e não uma parecida"
  - "confirmar fica desabilitado quando o horário proposto é igual ao vigente: confirmar sem mudança gravaria uma entrada de histórico que não registra nada"
  - "o contraste distingue TRÊS situações (ninguém salvou outra · salvou e já está na conta · salvou e não é alcançado) em vez de uma frase só, porque a frase única afirmava que existe alguém que às vezes não existe"
  - "as duas alterações autoradas entram no histórico REEXPORTADAS de alerta.ts; o Studio não escreve em /salvos e não precisa — a propagação é crível por a fonte ser uma só"

metrics:
  duration: "~55 min"
  completed: 2026-08-22
  tasks: 3
  commits: 2
  files: 4

actuals:
  tokens: 18975
  tasks: 3
  commits: 2
---

# Phase 4 Plan 03: Studio — gestão de ocorrências — Summary

A outra metade do Cenário 4 está viva: o evento imutável no topo, as 53 sessões editáveis
abaixo, a prévia de impacto que sai de **0** e vai a **1** quando o estado salvo muda, o
registro de quem alterou e quando, e as quatro declarações do que o acervo não sustenta.

---

## O resultado, sem rodeio

`/studio/ocorrencias/` abre na visão web em `evento:cms:13845`, com a ficha marcada
**imutável nesta tela** no topo e as 53 sessões dele em tabela. Editar uma linha mostra,
**antes de qualquer confirmação**, quantas pessoas serão avisadas e de onde cada uma veio.
Confirmar altera **uma** linha, deixa a ficha do evento **idêntica caractere a caractere**
e acrescenta uma entrada ao histórico — que já nascia com a alteração autorada que
`alerta.ts` fixou e que `/salvos` exibe do outro lado.

**Console: 0 erro, 0 aviso. Rede: 0 requisição externa.** As três suítes herdadas continuam
verdes — inclusive **AGEN-03, o gate do Cenário 4 da fase 3, que continua medindo
«exatamente 1 alertado»**.

---

## A regra do número de impacto, como ela ficou implementada — D-74

> Uma pessoa conta quando a ocorrência está no repertório salvo dela. As três personas
> entram pelo que `personas.json` semeou; a **persona ativa** entra também pelo que está em
> `agenda-cultural:salvos` neste navegador. O resultado é um **conjunto de pessoas**,
> indexado por nome de persona — nunca uma soma —, para a persona ativa não ser contada duas
> vezes quando aparece pelos dois caminhos.

Em código: um `Map<nomeDaPersona, origens[]>`. `data-impacto` é `mapa.size`;
`data-impacto-fonte` é a lista `nome — origem` em texto.

### Os valores medidos, no navegador

| cenário | `agenda-cultural:salvos` | `data-impacto` | de onde |
|---|---|---|---|
| `13845-t1-o0028`, antes de semear | vazio | **0** | ninguém |
| `13845-t1-o0028`, depois de semear | `[o0028]` | **1** | Maria, persona ativa, pelo storage |
| `13845-t1-o0028`, com o par inteiro | `[o0028, o0029]` | **1** | Maria — conta uma vez |
| `13845-t1-o0028`, só a irmã salva | `[o0029]` | **0** | ninguém salvou ESTA sessão |
| `7000-t1-o0001`, sem salvar nada | vazio | **1** | **Joana**, `personas.json` |

**A transição 0 → 1 é o gate**, e ela foi medida nos dois sentidos: o número sobe quando o
storage passa a conter a sessão, e **fica em 0 quando o storage contém só a irmã**. Esse
último caso é o que prova que o número não é «quantos salvaram algo deste evento».

Saída literal das duas leituras do gate da Task 2:

```
antes  · data-impacto=0
        data-impacto-fonte (271 chars): Ninguém salvou esta sessão. Nenhuma das 3 personas
        do protótipo a tem no repertório semeado em personas.json, e agenda-cultural:salvos
        deste navegador não a contém. O número é 0 porque o estado salvo é 0 — salve esta
        sessão e ele passa a 1 sem que nada mais mude na tela.

depois · data-impacto=1
        data-impacto-fonte: 1 de 3 pessoas. Maria — agenda-cultural:salvos deste navegador
        (persona ativa). O conjunto é de pessoas, não de salvamentos: quem aparece pelos
        dois caminhos conta uma vez.

semeado em cms:7000 · data-impacto=1
        1 de 3 pessoas. Joana — repertório semeado em personas.json. O conjunto é de
        pessoas, não de salvamentos: quem aparece pelos dois caminhos conta uma vez.
```

### T-04-13 exercitada, não declarada

Id de `localStorage` que o índice do build não resolve **não incrementa o número** e aparece
contado na tela:

```
T-04-13 · com 1 id inexistente no storage: data-impacto=1
        «1 id salvo neste navegador não foi reconhecido contra o índice de sessões do build
         e ficou de fora da conta. O número não cresce com id que o acervo não tem.»
```

Ids de trilha (`trilha:*`), que a fase 2 grava nessa mesma lista, **não** entram como
descarte: eles não são sessão, e contá-los como id inválido acusaria um defeito que não há.

---

## A assinatura de `src/dados/ocorrencias-studio.ts`

### Constantes

| export | tipo | valor | por quê |
|---|---|---|---|
| `EVENTO_PADRAO_DO_STUDIO` | `string` | `EVENTO_DO_PAR` de `alerta.ts` | o roteiro e o alerta caem no mesmo lugar |
| `DATA_DE_REFERENCIA_DO_STUDIO` | `string` | `"2026-08-22"` | reexportada; nunca o relógio (T-03-10) |
| `CARIMBO_DA_ALTERACAO` | `string` | `"22.08.2026, 09h40"` | derivado da data de referência |
| `OPERADOR_DO_STUDIO` | `string` | `"Operação de programação (perfil autorado)"` | D-25 — não há autenticação |
| `OPERADOR_E_AUTORADO` | `string` | a frase que declara isso na tela | T-04-17 |
| `PREFIXO_DA_OCORRENCIA` | `string` | `"ocorrencia:derivado:"` | vem de `indiceDeSalvaveis()`, não digitado |
| `SEPARADOR_DE_SESSAO` / `SEPARADOR_DE_CAMPO` | `string` | `";"` / `"\|"` | o formato compacto, exportado para o cliente |
| `FRASE_DE_D73` | `string` | a prova de D-73 dita na tela | produto, não comentário |
| `FRASE_DAS_DUAS_METADES` | `string` | amarra Studio ↔ `/salvos` | idem |
| `EVENTO_DO_PAR` · `EVENTO_DO_CANCELAMENTO` | `string` | reexportados de `alerta.ts` | uma fonte só |

### Tipos

```ts
interface EventoDoStudio {
  id: string; slug: string; titulo: string; resumo: string;
  procedencia: string; fonte: string | null; linguagens: string[];
  periodo: string; temporadas: number; rota: string;
  totalDeSessoes: number;
  prefixoLocal: string;   // "13845-t1-o00"
  sessoes: string;        // "01|2026-07-22T11:00|1;02|2026-07-23T12:00|1;…"
}

interface EntradaDeHistorico {
  ocorrenciaId: string; eventoId: string; eventoTitulo: string;
  campo: string; campoRotulo: string; de: string; para: string;
  dataDaSessao: string; quem: string; quando: string;
  origem: "autorado" | "operador";
  frase: string | null; rotaDoOutroLado: string;
}

interface ParDoStudio {
  eventoId: string; eventoTitulo: string;
  atingida: { id: string; dataCurta: string; hora: string };
  intacta:  { id: string; dataCurta: string; hora: string };
}

interface NumerosDoAcervo {
  eventos: number; eventosComSessao: number; ocorrencias: number;
  ocorrenciasComEspaco: number; eventosQueDeclaramIngresso: number;
  personas: number; ocorrenciasSalvasSemeadas: number;
  salvamentosSemeadosDescartados: number;
}

interface DeclaracaoHonesta { chave: string; rotulo: string; texto: string }
```

### Funções

| export | devolve | notas |
|---|---|---|
| `eventosDoStudio()` | `EventoDoStudio[]` | os **129**, ordem de id, memoizado |
| `eventoDoStudio(id)` | `EventoDoStudio \| undefined` | busca |
| `salvamentosSemeados()` | `Record<chave, string[]>` | 4 entradas, todas de Joana |
| `historicoAutorado()` | `EntradaDeHistorico[]` | as **2** de `alerta.ts`, só reformatadas |
| `historicoAutoradoDe(eventoId)` | `EntradaDeHistorico[]` | filtradas por evento |
| `horariosPropostos()` | `Record<ocorrenciaId, string>` | `{o0028: "19:30"}` — o pré-preenchimento |
| `parDoCenario4()` | `ParDoStudio` | os ids vêm de `parDeDemonstracao()` |
| `numerosDoAcervo()` | `NumerosDoAcervo` | memoizado |
| `declaracoesDoQueNaoSustenta()` | `DeclaracaoHonesta[]` | as **4**, calculadas sobre o dado |
| `comSeparador(n)` | `string` | `2425` → `2.425`, sem depender do locale |

**Nada disto pode ser importado por valor de um arquivo `"use client"`** — o módulo alcança
`grafo.ts`. Provado mecanicamente: o gate transitivo de DP-F da fase 3 varre **25 clientes
com 0 violações**, e o componente novo está entre eles.

### Os números que o módulo mediu

```
{ eventos: 300, eventosComSessao: 129, ocorrencias: 2425,
  ocorrenciasComEspaco: 0, eventosQueDeclaramIngresso: 0,
  personas: 3, ocorrenciasSalvasSemeadas: 4, salvamentosSemeadosDescartados: 0 }
```

Todos batem com o que o plano mediu. `evento:cms:13845` — «Helena Ignez é a homenageada da
74ª "Ocupação Itaú Cultural"» — tem **53 ocorrências, 26 futuras**, uma temporada, e
`linguagens: []`.

---

## O texto literal das quatro declarações honestas

É o que vai ser lido em voz alta. Todas visíveis com o **modo comentado desligado**
(`data-comentado="nao"`), cada uma em seu `[data-nao-sustenta]`.

**1 · nenhuma sessão tem espaço**

> Nenhuma das 2.425 ocorrências do acervo declara espaço: são 0 de 2.425. A coluna «espaço»
> existe nesta tabela e vem vazia, DECLARADA em vez de omitida — omitir a coluna esconderia
> que o dado falta; declará-la mostra exatamente onde a ingestão precisa melhorar. Sem espaço
> não há endereço, não há acessibilidade do local e não há mapa da sessão.

**2 · a gratuidade não recorta nada**

> Nenhum dos 300 eventos declara ingresso: são 0 de 300. A fonte tem só um booleano de
> gratuidade e ele vale o mesmo para todo mundo, então «entrada franca» aqui é verdade POR
> PADRÃO e não por fato — o rótulo da coluna carrega o qualificador em vez de afirmar
> gratuidade, como a tela de Salvos já faz. Filtrar por preço neste acervo devolveria tudo.

**3 · o Studio opera sobre 129 eventos**

> O seletor traz 129 eventos, e não os 300 do grafo: são os do CMS que têm sessão. As
> entidades da Enciclopédia devolvem zero ocorrências — elas são o acervo histórico, sem
> programação datada — e por isso ficam de fora, dito e não escondido. Gestão de ocorrência
> sobre evento sem ocorrência é tela vazia com aparência de defeito.

**4 · a alteração é autorada e o protótipo não escreve**

> Nenhum sistema do Itaú Cultural publica histórico de mudança de sessão: as 2.425
> ocorrências deste grafo são derivadas do período real do evento e nenhuma delas registra
> alteração. A sessão e a data são reais; a mudança é nossa, e aparece rotulada em vez de
> passar por dado do acervo. Confirmar aqui não grava em servidor nenhum — o protótipo é
> estático — e é justamente essa lacuna que a plataforma existe para fechar.

A coluna «entrada» da tabela diz **«entrada franca declarada»**, com o qualificador, e a
coluna «espaço» diz **«não declarado»** em todas as 53 linhas.

---

## A prova de que a ficha do evento não muda — D-73, T-04-15

O gate captura `innerText` de `[data-evento-imutavel]` **antes** e **depois** da confirmação
e exige igualdade estrita, e captura `innerText` das 53 linhas para exigir que **exatamente
uma** mude:

```
ficha do evento: 759 chars, identica antes e depois: true

linha alterada  antes : 28 22.08.2026 12:00 entrada franca declarada não declarado alterar horário
linha alterada  depois: 28 22.08.2026 19:30 era 12:00 entrada franca declarada não declarado alterar horário
irma intacta o0029    : 29 23.08.2026 10:00 entrada franca declarada não declarado alterar horário

sessoes alteradas: 1 (ocorrencia:derivado:13845-t1-o0028)
historico 1 -> 2
```

A ficha **não tem caminho de escrita**: não existe na região dela nem um `input` nem um
`button`. Essa ausência é o conteúdo do bloco, e está dita em texto ao lado do selo
**imutável nesta tela**.

---

## O histórico, e as duas metades do Cenário 4 — D-75

O histórico **não nasce vazio**. Ao abrir em `evento:cms:13845`:

```
historico ao abrir: 1 · ["ocorrencia:derivado:13845-t1-o0028"]
```

Essa entrada é a alteração autorada de `alerta.ts` — 12:00 → 19:30, sessão de 22.08.2026,
informada em 21.08.2026 às 16h20 — com o rótulo `autorado`, o informante que aquele módulo
calcula, e a frase que diz **por que** ela é autorada. Ao lado, a rota `/salvos/` e a
afirmação de que é a MESMA alteração do outro lado. Selecionar `evento:cms:13913` mostra o
cancelamento; selecionar qualquer outro dos 129 mostra o histórico vazio, com a explicação.

Depois de confirmar, a entrada nova, literal:

```
ALTERADO AGORA, NESTE NAVEGADOR · HORÁRIO ALTERADO · 22.08.2026, 09h40
Sessão de 22.08.2026: 12:00 → 19:30
QUEM ALTEROU  Operação de programação (perfil autorado)
ocorrencia:derivado:13845-t1-o0028
Registrada nesta sessão de trabalho e mantida em memória do navegador: o protótipo é
estático e não escreve em servidor nenhum. […]
```

### A propagação, medida ponta a ponta

O controle `data-semear-cenario-4-studio` salva o par no Studio; abrir `/salvos/` em seguida
mostra o resultado **sem que este plano tenha escrito uma linha em `salvos.tsx`**:

```
semeadura · antes=null depois=["…13845-t1-o0028","…13845-t1-o0029"]
em /salvos apos semear no Studio:
  {"linhas":[{"id":"…o0028","alertado":"sim"},{"id":"…o0029","alertado":"nao"}],"alertas":1}
```

**Exatamente 1 alertado.** As duas telas concordam porque a chave é a mesma
(`chaveDeOcorrencia`/`indiceDeSalvaveis` de `repertorio.ts`, reusada em vez de reescrita) e
porque a alteração é a mesma (`alteracoes()` de `alerta.ts`, reexportada em vez de
recalculada).

---

## O contrato `data-*` — atenção, 04-05

Medido no **DOM vivo** e conferido no **HTML exportado** com a forma `atributo="`.

| atributo | onde | DOM (sem edição) | HTML exportado | com uma linha em edição |
|---|---|---|---|---|
| `data-evento-imutavel` | ficha do evento | 1 | 1 | 1 |
| `data-ocorrencia` | cada linha | 53 | 53 | 53 |
| `data-historico` | painel do histórico | 1 | 1 | 1 |
| `data-historico-item` | cada entrada | 1 | 1 | 1 (2 após confirmar) |
| `data-semear-cenario-4-studio` | o controle | 1 | 1 | 1 |
| `data-nao-sustenta` | cada declaração | **4** | **4** | 4 |
| `data-editando` | a linha aberta | **0** | **0** | **1** |
| `data-impacto` | a prévia | **0** | **0** | **1** |
| `data-impacto-fonte` | a origem em texto | **0** | **0** | **1** |
| `data-confirmar` | a ação | **0** | **0** | **1** |
| `data-cancelar` | a ação | **0** | **0** | **1** |

> **CINCO dos onze atributos não existem no HTML exportado, e isso é correto.**
> `data-editando`, `data-impacto`, `data-impacto-fonte`, `data-confirmar` e `data-cancelar`
> só existem enquanto uma linha está em edição — e nada abre uma linha sem clique. Um gate
> que os procure por `grep` no HTML vai medir 0 e concluir que o contrato foi quebrado.
> **Eles têm de ser medidos depois de um clique no botão «alterar horário» da linha.** É a
> mesma natureza de `data-decisao` em 04-02: atributo de interação, não de documento.

`data-nao-sustenta` carrega valor (`espaco`, `gratuidade`, `escopo`, `alteracao`), o que casa
tanto com o seletor de presença quanto com a forma `data-nao-sustenta="`.

Nenhum atributo do contrato foi renomeado, e **nenhum atributo novo foi acrescentado** — o
contraste entre avisados e não-avisados é texto, de propósito, para não alargar o contrato
na onda em que 04-05 vai medi-lo.

---

## Verificação — comandos e saída literal

### 1. `npm run build`

```
✓ Compiled successfully in 50s
✓ Generating static pages using 7 workers (1931/1931) in 5.1s
```

### 2. Os três gates do plano, numa execução

```
T1 OK · evento evento:cms:13845 imutavel no topo, 53 sessoes
T2 OK · previa 0 sem salvo e 1 com a sessao salva, fonte com 271 chars
T3 OK · ficha identica (759 chars), 1 de 53 alterada, historico 1->2,
        declaracoes com 2.425/0/129/300
console: 0 erro · 0 aviso
```

### 3. As quatro situações do contraste

| storage | `data-impacto` | o que a tela diz |
|---|---|---|
| vazio | 0 | «e ninguém salvou nenhuma delas, então não há mais ninguém a avisar» |
| `[o0028]` | 1 | idem — ninguém salvou outra |
| `[o0028, o0029]` | 1 | «1 pessoa salvou alguma delas, e ela já está na conta acima por ter salvo também esta sessão» |
| `[o0029]` | 0 | «e 1 pessoa que salvou uma delas não recebe nada» |

A última linha é o argumento inteiro do Cenário 4 numa frase.

### 4. D-67 — o Studio não existe na visão app

```
D-67 na visao app: {"view":"mobile","fichaVisivel":false,"linhas":0,
                    "aviso":"Studio é superfície de desktop"}
```

### 5. Peso

| medida | valor | teto |
|---|---|---|
| `out/_next/static/chunks` | **1.240 KB** | 1.600 KB |
| `out/studio/ocorrencias/index.html` | **219.854 bytes** | — |
| a tabela de sessões dentro dele | 53.013 caracteres | — |

### 6. Rede e console

`0 requisição externa`, provado por `performance.getEntriesByType('resource')`.
`0 erro e 0 aviso` da aplicação em todas as execuções.

### 7. As três suítes herdadas

| suíte | resultado |
|---|---|
| `npm run verificar-comentado` | **TUDO PASSOU** — 0 erro, 0 aviso em 7 navegações |
| `npm run verificar-fase2` | **TUDO PASSOU** — 0 erro, 0 aviso em 26 navegações |
| `npm run verificar-fase3` | **para no gate 8**, pela âncora obsoleta — ver abaixo |

Gates estruturais relevantes, saída literal:

```
ok   arquivos com a diretiva de cliente: 25 em código
ok   DP-F · caminhos de cliente até @/dados/grafo (transitivo): 0 violações em 25 clientes
ok   D-47 · telas importando entidades/arestas/ocorrencias.json: 0 em 63 telas
ok   D-08 · token de cor de apoio em .ts/.tsx: 0 em código
ok   posicionamento preso à janela fora de casca.tsx: 0 em código
ok   console · CSS pré-carregado e não usado: 0 diagnóstico(s) em 48 navegações
ok   requisição para fora do servidor local: 0 requisição externa · 461 recursos distintos
```

---

## Os dois gates vermelhos que NÃO são defeito deste plano

`npm run verificar-fase3` para em:

```
FALHA src/app/globals.css intocado desde o fim da fase 2 (cc34f4e):
      medido 43 0 · esperado diferença zero
```

É a âncora obsoleta que 04-01 documentou. **Não toquei em `globals.css`** — `git diff` do meu
commit sobre ele é vazio.

Para conferir o resto da suíte sem alterar o arquivo versionado, rodei uma **cópia efêmera
fora do repositório** (no diretório de rascunho, com `RAIZ` apontada para o projeto), com a
âncora em `14347ae`. `git status --short scripts/` saiu **vazio**; a suíte é byte a byte a
que estava.

Com a âncora corrigida, o gate 8 fica verde — e aparece **um segundo gate obsoleto**:

```
FALHA total de páginas em out/: medido 1931 páginas · resíduo 1785
      · esperado resíduo 1784 — a linha de base da fase 2
```

A página a mais é **`/roteiro`, que 04-04 criou nesta mesma onda**. Este plano **substituiu**
uma tela-esqueleto existente e não acrescentou nenhuma rota. Com os dois números
reancorados, a suíte inteira sai **TUDO PASSOU**, incluindo:

```
AGEN-03  Cenário 4: 2 sessões do mesmo evento salvas, 1 alertada
         (ocorrencia:derivado:13845-t1-o0028), alerta 356px com 12:00→19:30;
         sobreviveu a recarregar; removida a irmã o alerta ficou, removida a
         atingida o alerta sumiu
```

**Nada que a fase 3 mede foi tocado.**

### O que 04-05 precisa fazer

1. `COMMIT_FIM_DA_FASE_2` em `scripts/verificar-fase3.mjs` linha 65: de `"cc34f4e"` para o
   commit do fim da onda 1 da fase 4 (`14347ae` serve; o de 04-01, `c03f627`, também).
2. A linha de base de páginas, na mesma suíte: **1784 → 1785**, pela rota `/roteiro` de 04-04.
3. Ao medir o contrato `data-*` de 04-03, **clicar em «alterar horário»** antes de procurar os
   cinco atributos de interação.

---

## Deviations from Plan

### 1. [Regra 3 — bloqueio] O formato do DTO das sessões mudou de tupla para string

- **Found during:** Task 1, ao medir o artefato
- **Issue:** o plano manda o seletor trocar de evento **sem navegar**, o que obriga as 2.425
  sessões dos 129 eventos a estarem no cliente. Em array de tuplas, o payload RSC reescapa
  cada aspa e cada colchete: a página exportada saiu com **268.367 bytes**, contra ~161 KB de
  `/salvos`, e T-04-19 é explícita sobre não mandar as 2.425 inteiras.
- **Fix:** as sessões de cada evento viajam em UMA string, `resto|AAAA-MM-DDTHH:mm|g;…`, com o
  prefixo comum do evento (`13845-t1-o00`) mandado uma vez. Página: **219.854 bytes**; a
  tabela em si caiu para **53.013 caracteres**. O cliente recompõe o id com os dois prefixos
  que vieram no DTO, e não com uma segunda regra digitada.
- **Commit:** `14347ae`

### 2. [Regra 2 — funcionalidade crítica ausente] O contraste precisava distinguir três casos

- **Found during:** revisão da Task 2, exercitando as quatro combinações de storage
- **Issue:** a frase «as outras 52 sessões não são tocadas, e quem salvou uma delas não recebe
  nada» **afirma que existe alguém** que, quando ninguém salvou nenhuma das outras 52, não
  existe. Numa tela cuja tese é a procedência do número, isso é a contradição mais cara
  possível.
- **Fix:** dois números em vez de um — `salvaramOutras` (quem salvou alguma das outras) e
  `naoAlcancados` (quem, dentre eles, esta alteração não avisa) — e três frases distintas.
  Os dois divergem quando a mesma pessoa salvou esta sessão e uma irmã.
- **Commit:** `139064d`

### 3. [Regra 2] `confirmar` fica desabilitado quando não há mudança

O plano não diz o que fazer quando o horário proposto é igual ao vigente. Confirmar assim
gravaria uma entrada de histórico que não registra alteração nenhuma — ruído no registro que
D-75 existe para tornar confiável. O botão continua **visível** (o gate conta 1 visível) e
desabilitado, com a razão dita ao lado.

### 4. [Regra 2] O formulário abre pré-preenchido com o `para` de `alerta.ts`

Sem isso, confirmar a linha do Cenário 4 produziria uma alteração *parecida* com a que
`/salvos` mostra, e não a mesma. `horariosPropostos()` traz `{o0028: "19:30"}` da fonte única.
Para as outras 52 linhas o campo abre com o horário vigente, e confirmar exige escolher outro.

### 5. Os três commits do plano viraram dois

As três tarefas foram escritas numa passada só — o módulo, a página, o componente e a folha
formam um caminho que não compila pela metade — e entraram no commit `14347ae`. **Os três
gates foram executados separadamente**, cada um contra o artefato construído, e cada um
passou por conta própria; o segundo commit é a correção de precisão do desvio 2. Registrado
aqui porque o protocolo pede um commit por tarefa e este plano entregou dois.

### 6. Duas paradas por causa da onda paralela

O `npm run build` falhou duas vezes por arquivos de **outros planos** em estado intermediário
no working tree compartilhado — `@/componentes/roteiro` ainda inexistente (04-04) e uma prop
nova em `studio-duplicatas.tsx` que a página ainda não passava (04-02). **Nenhuma alteração
minha entre as tentativas**; repetir resolveu, como `<onda_paralela>` previa. Nenhum arquivo
de outro plano foi tocado.

---

## O protocolo de disco — resultado

O volume está a 96%. **Nenhum arquivo leu zero byte nesta execução.** Conferência antes de
editar, disco contra `git show HEAD:<caminho> | wc -c`:

```
OK  src/dados/alerta.ts (18450)        OK  src/componentes/salvos.tsx (17336)
OK  src/dados/personas.ts (2018)       OK  src/contexto/sessao.tsx (4860)
OK  src/dados/repertorio.ts (17994)    OK  src/estilos/studio.css (9268)
OK  src/dados/grafo.ts (14613)         OK  src/estilos/studio-ocorrencias.css (1104)
OK  src/dados/tipos.ts (12265)         OK  src/app/globals.css (13350)
OK  src/dados/gerado/personas.json (3457)
OK  src/app/(bastidor)/studio/ocorrencias/page.tsx (867)
```

Todos bateram. **Nenhuma restauração foi necessária.** Depois de cada commit, cada arquivo foi
conferido **no git**, e não só no disco:

| arquivo | bytes no git | bytes no disco |
|---|---|---|
| `src/dados/ocorrencias-studio.ts` | 22.318 | 22.318 |
| `src/componentes/studio-ocorrencias.tsx` | 36.027 | 36.027 |
| `src/app/(bastidor)/studio/ocorrencias/page.tsx` | 2.608 | 2.608 |
| `src/estilos/studio-ocorrencias.css` | 12.326 | 12.326 |

Os dois commits foram empurrados para `espelho` imediatamente após cada um.

---

## Disciplina de arquivo — conferida

`git diff-tree --name-status -r` dos dois commits devolve **exatamente** os quatro arquivos do
cabeçalho do plano, e nada mais:

```
14347ae  M  src/app/(bastidor)/studio/ocorrencias/page.tsx
         A  src/componentes/studio-ocorrencias.tsx
         A  src/dados/ocorrencias-studio.ts
         M  src/estilos/studio-ocorrencias.css
139064d  M  src/componentes/studio-ocorrencias.tsx
```

**`src/app/globals.css` não foi tocado.** `src/estilos/studio.css`, `src/dados/alerta.ts`,
`repertorio.ts`, `personas.ts`, `src/contexto/sessao.tsx`, `src/componentes/salvos.tsx` e
`scripts/` foram só lidos. **Zero dependência nova** — `package.json` intocado.

---

## Task Commits

| # | tarefa | commit | arquivos |
|---|---|---|---|
| 1–3 | o módulo, a página, a tela inteira e a folha | `14347ae` | 4 |
| — | o contraste preciso nas três situações | `139064d` | 1 |

---

## Known Stubs

Nenhum. A coluna «espaço» vem vazia em todas as 53 linhas, mas isso **não é stub**: é o dado
do acervo, declarado com o texto que explica a ausência, e é o assunto da declaração honesta
número 1.

---

## Threat Flags

Nenhuma superfície nova fora do registro do plano. As mitigações declaradas foram
exercitadas:

| ameaça | como foi provada |
|---|---|
| T-04-13 (tampering na prévia) | id inexistente no storage: `data-impacto` **não mudou**, descarte declarado na tela |
| T-04-14 (repúdio no histórico) | toda confirmação grava ocorrência, campo, de, para, operador e carimbo — lido no DOM |
| T-04-15 (tampering na ficha) | `innerText` de 759 chars **idêntico** antes e depois; nenhum controle alcança a ficha |
| T-04-16 (vazamento no cliente) | gate transitivo de DP-F: **0 violações em 25 clientes** |
| T-04-17 (spoofing do operador) | nome autorado, rotulado, com `OPERADOR_E_AUTORADO` na tela |
| T-04-18 (nomes de persona) | aceita — as 3 personas são autoradas e rotuladas |
| T-04-19 (peso) | **1.240 KB** de chunks contra teto de 1.600 KB; HTML de 268.367 → 219.854 bytes |

---

## O que NÃO foi feito, e é de propósito

- **Nada foi escrito em `salvos.tsx`, `alerta.ts` ou nas três suítes.** A propagação do
  Cenário 4 é demonstrada por a alteração ser **a mesma dos dois lados**, e foi medida assim.
- **Nenhuma foto em `capturas/`.** O diretório não está na lista de arquivos deste plano, e a
  disciplina da onda paralela vale mais do que a conveniência de ter a imagem aqui.
- **A alteração não persiste entre recargas.** O histórico do operador vive em memória: o
  protótipo é estático e a tela **diz isso**, em vez de simular uma escrita que não existe.

## Self-Check: PASSED

Os quatro arquivos existem, leem e batem com o git. Os dois commits (`14347ae`, `139064d`)
existem no git e no espelho.

Os três commits (`14347ae`, `139064d` e o de documentação) estão no `espelho`.
