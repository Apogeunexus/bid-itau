# S9 · Os KPIs do produtor — a V2 do painel de alcance

> Sessão de **bastidor**, pasta `src/app/(bastidor)/studio/`. Ela reescreve a O9 (funcionalidade
> 152), que hoje é a única tela de medida do Studio, e acrescenta duas ao lado dela.
>
> Contexto compartilhado: [`ONTOLOGIA-E-ACESSOS.md`](ONTOLOGIA-E-ACESSOS.md) ·
> Protocolo: [`PROTOCOLO.md`](PROTOCOLO.md) · Antecessoras: [`S6-ORGANIZACAO.md`](S6-ORGANIZACAO.md)
> (que escreveu a O9) e [`S7-STUDIO-PRODUTOR.md`](S7-STUDIO-PRODUTOR.md).

---

## 1. Objetivo e critério de pronto

**Objetivo.** Hoje o painel do produtor conta quatro arestas do grafo e recusa cinco medidas
por escrito (`src/componentes/studio-org-alcance.tsx`). As quatro são de OFERTA — o que a
organização publicou. Nenhuma é de USO. Ao fim desta sessão o painel mede **três livros** — o que
o produtor publicou, o que aconteceu com quem chegou, e o que ele devolveu ao programa —, cada
livro dividido em «o que eu fiz» e «o que resultou», e cada número declarando **em qual dos três
estados** ele está: conta agora, instrumentado à espera de coleta, ou recusado por construção.

A plataforma **não vende ingresso**, e essa restrição não é uma limitação a contornar: é o que
define o topo do funil. Ver §2.9.

A troca conceitual é essa: **a recusa deixa de ser binária.** Hoje uma medida ou aparece ou
está na lista das cinco negadas. Isso empacota junto duas coisas muito diferentes — «não há
como medir isto» e «o instrumento existe, a coleta ainda não roda». Três das cinco recusas de
hoje são do segundo tipo desde que o motor de pontos entrou (`src/lib/pontos/`), e continuar
chamando as três de impossíveis subestima a proposta na frente da banca.

**Critério de pronto.** Não é «as telas existem». É:

1. Todo número exibido carrega o denominador ao lado e um `data-fonte` que diz de onde saiu —
   `grafo`, `livro` ou `reserva`. Número sem denominador não passa no portão de verificação.
2. **Lotação nunca aparece como porcentagem sem teto declarado.** `capacidade === null` imprime
   «sem teto declarado», nunca `0` e nunca `0%` — são três afirmações diferentes.
3. A lista de recusas cai de cinco para duas. As três que saem entram numa lista nova,
   **«instrumentado, sem coleta»**, cada uma nomeando o evento do contrato que a alimentaria.
4. Nenhuma média de nota é impressa com menos de 5 presenças confirmadas na ocorrência. Abaixo
   disso a tela mostra a distribuição, não a média.
5. Toda tela diz, no cabeçalho, que o que ela lê é **a persona ativa neste navegador** — não a
   audiência. Ver §2.6.
6. Nenhuma tela usa as palavras «conversão», «vendas» ou «bilheteria». O KPI de ingresso se
   chama *saída para a plataforma*, e mede intenção.
7. Toda medida que descreve o comportamento de uma pessoa identificada — resposta a comentário,
   tempo de resposta, cursos concluídos — vive na coluna «o que eu fiz» e não sai dela.
8. `npm run checar` verde e `npm run verificar-kpis` verde (suíte nova, §9).

---

## 2. Análise ontológica — o que o produto sustenta como MEDIDA

Contado em **02.09.2026** contra `src/dados/gerado/` e `src/lib/pontos/`. Esta seção decide
quais KPIs existem; a sessão executora não a renegocia sem recontar.

### 2.1 · O acervo é uma fotografia. O livro é uma série.

`src/dados/gerado/meta.json` traz `"geradoEm": "2026-08-22"` — **uma data de referência, uma
só**. Nenhuma medida do grafo pode ser comparada consigo mesma no tempo, e é por isso que a
quarta recusa de hoje («comparação com o próprio histórico») está correta *para o acervo*.

Mas `LinhaDoLivro.criadoEm` e `EventoDeAtividade.ocorridoEm` (`src/lib/pontos/tipos.ts`) são
carimbos de tempo por linha, num livro append-only cujo saldo é `soma(créditos) − soma(débitos)`
(`src/lib/pontos/livro.ts`). **Sobre uso existe série; sobre acervo não existe.** A recusa nº 4
se parte em duas, e o painel V2 as separa em vez de negar as duas.

### 2.2 · O que a ocorrência declara — e o que ela não declara

2.425 ocorrências no acervo. Campos por ocorrência, contados:

| campo | preenchido | leitura |
|---|---|---|
| `espacoId` | **0 de 2.425 (0%)** | nenhuma sessão do acervo diz onde acontece |
| `preco` | **0 de 2.425** | sempre `null` |
| `esgotado` | **0 de 2.425** | sempre `false` |
| `gratuito` | **2.425 de 2.425 (100%)** | ver o alerta abaixo |
| `inicio` | 2.425 | é o único fato de sessão que o acervo sustenta |

> **`gratuito: true` em 100% com `preco: null` em 100% é ambíguo, e a tela não pode usá-lo.**
> Ou o acervo inteiro é gratuito, ou `gratuito` é o valor default do normalizador e não uma
> declaração. As duas hipóteses produzem o mesmo dado e afirmações opostas. Vira PEDIDO-S9-01;
> até a resposta, nenhum KPI de gratuidade existe.

O zero de `espacoId` já é usado pela O9 hoje, e bem: «o vazio É a medida». A V2 mantém a frase e
acrescenta a consequência — **sem espaço declarado não há capacidade, e sem capacidade não há
taxa de lotação.** A cadeia de dependência do KPI mais pedido é essa, e ela começa numa tela que
já existe (`/studio/espacos`).

### 2.3 · Lotação: numerador e denominador já estão no contrato

O denominador: `CadastroDeEspaco.capacidade: number | null` (`src/dados/tipos-organizacao.ts:202`),
com o comentário que a sessão anterior já escreveu — `null` é «não sei», nunca `0`, que seria
«cabe ninguém».

O numerador: `EstadoDoMotor.presencas: string[]` (`src/lib/pontos/tipos.ts:541`), alimentado
pelo único evento do motor que não nasce dentro do produto:

> `presenca.confirmada` é o único que vem de fora, e vem por código que o produtor gera no
> Studio — não por autodeclaração. — `src/lib/pontos/tipos.ts:35`

E a regra que o remunera é a mais cara do programa (150 percurso + 20 ficha,
`src/dados/pontos.ts:184`), justamente porque estar presente é o que a plataforma não substitui.

**A conta honesta, então, é `presenças confirmadas por código ÷ capacidade declarada`.** E a
frase que a tela é obrigada a dizer ao lado: *isto é piso de público, não público.* Quem foi e
não resgatou o código não aparece — a taxa subestima por construção, e uma tela que a chamasse
de «ocupação» estaria mentindo na direção contrária à de sempre, o que não a torna menos mentira.

### 2.4 · A reserva educativa já é o KPI completo, e ninguém percebeu

`VisitaEducativa` (`src/dados/tipos-organizacao.ts:924`) tem estado
`solicitada | confirmada | recusada`, `pessoas: number | null`, e o teto vive em
`CadastroDeFormacao.vagas`. `porQueNaoConfirma()` já implementa a regra de não estourar o teto.

Isso é **um funil com três estágios, um denominador declarado e um motivo de recusa por linha** —
a estrutura de KPI mais completa que existe no produto inteiro, sobre as 54 formações do acervo.
A O4 a usa para operar; a V2 do painel passa a lê-la como medida:

- taxa de confirmação = confirmadas ÷ (confirmadas + recusadas)
- ocupação da oferta = Σ pessoas confirmadas ÷ vagas
- pendência = solicitadas sem veredito
- motivo dominante de não-confirmação, que vem da própria `porQueNaoConfirma()`

### 2.5 · Nota não existe em lugar nenhum, e o instrumento precisa de trava

Não há campo de avaliação em `Entidade`, em `Ocorrencia`, nos 21 nomes de evento do motor
(`NomeDeEvento`, `src/lib/pontos/tipos.ts`) nem em `PublicacaoDefinida`. Buscado em
`src/dados/` e `src/lib/`: nenhum. Portanto **nota é instrumento novo, e não recorte de dado
existente.**

O desenho que a proposta pode defender:

- Só avalia quem tem **presença confirmada por código naquela ocorrência**. Sem a trava, a nota
  vira superfície de brigada e reproduz exatamente a mentira barata que a O9 foi escrita para
  recusar — com o agravante de que a nota tem cara de dado do público.
- **Uma nota por presença**, nunca por pessoa: a mesma pessoa avalia cada sessão a que foi.
- Abaixo de 5 presenças, a tela mostra **a distribuição**, nunca a média. Média de n=2 é ruído
  que parece medida.
- A nota **não entra em ranking de produtor**. `CONFORMIDADE_NAO_E_VIGILANCIA` já fixou o
  princípio para o colaborador; ele vale aqui igual — mede-se o registro, não a pessoa.

Novo evento no contrato: `ocorrencia.avaliada`, com `se:` exigindo `presencas.includes(alvo.id)`.
Ele **não concede ponto** — pagar por avaliar é comprar nota, e o motor tem `maxPorDia` justamente
porque esse tipo de incentivo é o furo barato.

### 2.6 · A fronteira que decide o resto: o livro mora no navegador

`src/contexto/pontos.tsx:123` lê e `:142` grava em `localStorage`, por persona. Não há
autenticação (D-25) e o acervo tem **3 pessoa-usuária**. O deploy confirma: a tela do Studio
imprime «Lendo o que está gravado neste navegador».

**Consequência dura: nenhum KPI de audiência agregada é calculável neste protótipo.** O painel V2
mede a persona ativa e **diz** que mede a persona ativa. Agregar exige servidor, que está fora de
escopo — e é precisamente por isso que a coluna «instrumentado, sem coleta» existe: ela mostra à
banca que o contrato de evento já está escrito e que o que falta é infraestrutura, não modelo.

### 2.7 · Comunidade — o que já está medido

| medida | valor | fonte |
|---|---|---|
| comunidades | 23 (1 oficial + 22 do marketplace) | `src/dados/comunidade.ts` |
| UFs cobertas | 19 | idem |
| assinantes somados | 215.370 | idem — **literal do dado de demonstração, não contagem de gente** |
| publicações | 115 | `src/dados/comunidade-feed.ts` (gerado) |
| reações somadas | 59.187 | idem |
| comentários | 249 | idem |
| eventos de comunidade no motor | 4 | `comunidade.{publicacao.salva, comentario.criado, reacao.dada, assinada}` |

Os quatro eventos são o que a plataforma **observa**; `assinantes` e `reacoes` são números
escritos no arquivo de demonstração. A V2 exibe os dois grupos em colunas separadas e rotula o
segundo — juntá-los numa soma só produziria um total que ninguém consegue reconstituir.

### 2.8 · As cinco recusas de hoje, reauditadas

| recusa de hoje | veredito da V2 | instrumento |
|---|---|---|
| público presente | **vira instrumentado** | `ocorrencia.presenca.confirmada` ÷ `capacidade` — piso, não público |
| visualizações e escutas | **vira instrumentado, com outro nome** | as 5 conclusões do motor. Chama-se **conclusão**, não visualização: o player chegou ao fim é observável, o play não |
| inscrições efetivadas | **vira conta**, na formação | funil `solicitada → confirmada` já implementado |
| comparação com o histórico | **parte em duas** | recusado sobre o acervo (uma data); conta sobre o livro (`criadoEm`) |
| faixa etária ou perfil | **continua recusado** | 3 pessoa-usuária, sem autenticação. Não muda nesta onda |

Restam recusados: **perfil de público** e **comparação histórica do acervo**. Duas, com o motivo
na mesma coluna e no mesmo tamanho de sempre.

---

### 2.9 · O ingresso não devolve dado, e é isso que promove o código de presença

`src/dados/ingressos.ts` mede: **0 dos 300 eventos declaram link de ingresso**. A fonte só tem
`comIngresso` sempre falso e `preco` sempre `null`; dois links foram escritos pela curadoria e
rotulados como tal. E o módulo já fixa a natureza do gesto:

> É um `<a href>` externo que a pessoa CLICA — não uma requisição que o protótipo faz.

**A plataforma não vende, e a compra acontece na Sympla.** O mais longe que a medida honesta
chega é o **clique de saída**: intenção, nunca conversão. Sem postback da plataforma de venda —
que não existe e não está no escopo — não há bilhete, não há comparecimento e não há receita.

As duas consequências que organizam o painel:

1. **As palavras «conversão», «vendas» e «bilheteria» não existem no vocabulário do painel.** O
   KPI se chama *saída para a plataforma de ingresso*, e o denominador dele é *eventos com sessão
   futura*, não cliques.
2. **A lotação só pode vir do código de presença.** Como o ingresso não devolve dado, o código
   deixa de ser mecânica de gamificação e passa a ser o único instrumento de audiência do
   produto. É a justificativa mais forte da regra `r-presenca` valer 150 percurso.

Evento novo, e ele é de cliente puro porque o clique acontece na nossa página antes de sair:
`ingresso.saida.clicada`. **Não concede ponto** — pagar por clicar em link externo é comprar
tráfego para a Sympla com a moeda do programa.

---

## 3. Restrições herdadas

1. **`REGRA_DO_ALCANCE` continua literal na tela**, palavra por palavra. Ela é o que dá licença
   ao resto do painel.
2. **`CONFORMIDADE_NAO_E_VIGILANCIA`**: nenhuma medida desta sessão vira nota de desempenho de
   pessoa — nem de colaborador, nem de produtor.
3. **DP-F**: `tipos-organizacao.ts` e `lib/pontos/tipos.ts` são cliente-seguros e continuam sem
   importar `@/dados/grafo`. Os 9,4 MB não atravessam por causa de um KPI.
4. **Sem `new Date()` e sem `Math.random()`** em módulo de cliente: o HTML exportado e a página
   hidratada precisam coincidir. Data de referência vem de `DATA_DA_MEDIDA`.
5. **`realiza` é muitos-para-muitos**: todo número por instituição é FATIA, não exclusividade. A
   frase que a O9 já imprime sobre isso continua, porque ela é o que impede a leitura errada.
6. **Só visão web** (D-67).
7. **A O9 não escreve na fila do produtor.** `COMO_A_O10_LE_A_FILA` vale para todas as telas
   novas: leitura, nunca escrita, sobre a chave do nível 7.

---

## 4. Escopo — três livros, funcionalidades 169 a 180

### 4.1 · O modelo dos três estados

Cada KPI declara um de três estados, visível na tela e não em rodapé:

- **conta** — numerador e denominador existem no produto hoje.
- **instrumentado** — o evento existe no contrato, a coleta agregada não. A tela nomeia o evento.
- **recusado** — não existe instrumento, e a tela diz por quê.

### 4.2 · A divisão: três livros, e por que não são seis camadas

As funções do produtor chegam em três blocos, e os três **têm denominadores diferentes**. É essa
diferença, e não a família da métrica, que decide o corte — seis camadas numa tela só produzem
uma página onde o número que importa fica abaixo da dobra.

| livro | pergunta que responde | denominador | quando ele abre |
|---|---|---|---|
| **L1 · O que eu publiquei** | «minha grade está no ar e completa?» | o próprio catálogo | antes do evento |
| **L2 · O que aconteceu com quem chegou** | «como foi?» | quem apareceu | no dia seguinte |
| **L3 · O que eu devolvi ao programa** | «o que eu pus na economia funcionou?» | o que ele injetou | no fim da temporada |

### 4.3 · Duas colunas dentro de cada livro

Todo livro se divide em **«o que eu fiz»** e **«o que resultou»**. O bloco 2 das funções mistura
as duas coisas: *criar comunidade* e *criar conteúdo* são SAÍDA do produtor; *interagir*,
*responder comentários* e *concluir cursos* são ATIVIDADE dele.

Separar não é organização, é proteção: `CONFORMIDADE_NAO_E_VIGILANCIA` já fixou que medida não
vira nota de desempenho de pessoa. **A coluna «o que eu fiz» é espelho do produtor para ele
mesmo, e nunca entra em comparação entre produtores.** A coluna «o que resultou» pode ser
comparada, porque ela mede o registro.

### 4.4 · L1 · O que eu publiquei

| coluna | KPI | numerador ÷ denominador | fonte | estado |
|---|---|---|---|---|
| eu fiz | eventos publicados · sessões | arestas `realiza` / `ocorre_em` | grafo | conta |
| eu fiz | **cobertura de link de ingresso** | eventos com link ÷ eventos com sessão futura | grafo | conta (hoje: 0 de 300) |
| eu fiz | sessões com teto declarado | `capacidade ≠ null` ÷ sessões | cadastro | conta |
| eu fiz | ficha de acessibilidade declarada | `declaraAcessibilidade` ÷ sessões | grafo | conta |
| eu fiz | faltas bloqueantes abertas | `Falta[]` com `bloqueia: true` | rascunho | conta |
| resultou | **saída para a plataforma de ingresso** | `ingresso.saida.clicada` ÷ eventos com link | livro | instrumentado |
| resultou | sessões com espaço declarado | `espacoId ≠ null` ÷ 2.425 | grafo | conta (hoje: 0) |

> A cobertura de link vem ANTES do desempenho do link, e a ordem é a decisão: com 0 de 300, um
> painel que abrisse por «cliques» mostraria zero e pareceria fracasso de audiência quando é
> ausência de cadastro. O produtor precisa ver o que falta preencher, não um gráfico vazio.

### 4.5 · L2 · O que aconteceu com quem chegou

| coluna | KPI | numerador ÷ denominador | fonte | estado |
|---|---|---|---|---|
| resultou | presenças confirmadas por código | `presencas[]` | livro | instrumentado |
| resultou | **taxa de lotação** | presenças ÷ `capacidade` | livro ÷ cadastro | instrumentado |
| resultou | conclusões por classe | 5 eventos de conclusão | livro | instrumentado |
| resultou | funil da reserva educativa | solicitada → confirmada ÷ recusada | reserva | conta |
| resultou | nota | `ocorrencia.avaliada`, travada em presença | livro | instrumentado |
| resultou | reações e comentários recebidos | 115 publicações, 59.187 reações | dado + livro | conta, rotulado |
| eu fiz | **taxa de resposta a comentário** | comentários respondidos ÷ recebidos | livro | instrumentado |
| eu fiz | tempo até a primeira resposta | mediana, em horas | livro | instrumentado |
| eu fiz | comunidades minhas sem publicação em 30 dias | contagem ÷ minhas | dado | conta |
| eu fiz | cursos concluídos pelo produtor | `curso.concluido` | livro | instrumentado |

> «Taxa de resposta» e «tempo até responder» são as duas únicas medidas do painel que descrevem
> o comportamento de uma pessoa identificada. Elas ficam na coluna «eu fiz» e **não saem dela** —
> nem para comparação, nem para o Observatório, nem para o selo de embaixador.

### 4.6 · L3 · O que eu devolvi ao programa

O catálogo tem 17 recompensas em 5 famílias (`acesso`, `bastidor`, `editorial`, `poder`,
`devolver`), 4 formas de entrega e uma esteira de **7 fases** que não termina em «entregue»:
`resgatado → processando → separado → enviado → entregue → confirmado | contestado`.

| coluna | KPI | numerador ÷ denominador | fonte | estado |
|---|---|---|---|---|
| eu fiz | benefícios publicados · estoque restante | `RecompensaDefinida` | dado | conta |
| eu fiz | missões publicadas por tipo | 30 hoje (14 onboarding, 10 campo) | dado | conta |
| resultou | funil de resgate | resgatado → entregue ÷ catálogo | livro | instrumentado |
| resultou | **taxa de contestação** | `contestado` ÷ `entregue` | livro | instrumentado |
| resultou | funil de missão | iniciada → prova → aprovada | comprovações | instrumentado |
| resultou | **taxa de reprovação de prova** | reprovadas ÷ decididas | comprovações | instrumentado |
| resultou | emblemas concedidos a partir das minhas missões | 16 definidos | livro | instrumentado |

Duas leituras que só existem porque a esteira e a fila de prova já foram desenhadas assim:

- **`contestado` é o único KPI que mede o produtor cumprindo a promessa dele.** «Entregue» é o
  produtor dizendo que despachou; só quem recebeu sabe se chegou. Uma esteira que parasse em
  «entregue» mediria a palavra de uma das partes.
- **Taxa de reprovação de prova alta é missão mal escrita, não gente desonesta.** `Comprovacao`
  exige `motivo` em toda recusa, e é o motivo dominante que a tela mostra ao lado do número — o
  alerta é de redação da missão, e a tela diz isso com todas as letras. Ler reprovação como
  fraude é o caminho mais curto para um produtor punir o próprio público.

### 4.7 · O selo de embaixador sai do L3, e não do L2

Não existe «embaixador» no código hoje — buscado em `src/`, nenhuma ocorrência. É conceito novo,
e o critério dele é a decisão de desenho mais perigosa desta sessão.

**O selo não pode sair de lotação nem de nota.** Lotação premia quem tem sala grande em capital;
nota premia quem tem público fiel. Os dois transformam o selo numa medida de tamanho, e a tese do
produto é distribuição territorial. O critério é do L3 — **o que a pessoa devolveu**: missões
publicadas que foram concluídas, benefícios entregues sem contestação, territórios distintos
alcançados pelas próprias missões. É a mesma métrica `territorios` que o ranking de missão já usa
e pelo mesmo motivo: mede o quanto se saiu do próprio canto.

### 4.8 · As funcionalidades

- **169.** Estado da medida em três valores, com a coluna que os exibe lado a lado.
- **170.** Divisão em três livros, com «eu fiz» e «o que resultou» dentro de cada um.
- **171.** Cobertura de link de ingresso, com o denominador de eventos com sessão futura.
- **172.** Evento `ingresso.saida.clicada`, sem concessão de ponto.
- **173.** Taxa de lotação por ocorrência, com teto declarado obrigatório no denominador.
- **174.** Tabela de sessões — uma linha por ocorrência, ordenável, com presença, teto e nota.
- **175.** Funil da reserva educativa como medida, sobre a O4.
- **176.** Taxa de resposta a comentário e tempo até a primeira resposta, presos ao L2 «eu fiz».
- **177.** Funil de resgate com taxa de contestação.
- **178.** Funil de missão com taxa de reprovação e motivo dominante.
- **179.** Evento `ocorrencia.avaliada`, travado em presença e sem concessão de ponto; média a
  partir de n=5, distribuição abaixo disso.
- **180.** Critério do selo de embaixador, calculado sobre o L3 e declarado na tela.

---

## 5. As telas

Uma tela por livro, mais a capa. Quatro rotas.

### 5.1 · `/studio/alcance` — a capa

Mantém as duas colunas que já funcionam. Esquerda: **um cartão por livro**, com o número que
resume cada um (sessões publicadas · presenças confirmadas · benefícios entregues) e o caminho
para a tela. Direita: a coluna que era «5 medidas recusadas» vira **duas listas empilhadas** —
«instrumentado, sem coleta» (3 itens, cada um nomeando o evento que o alimenta) e «recusado»
(2 itens, com o motivo de sempre). Mesmo tamanho da esquerda: a recusa continua sendo conteúdo.

### 5.2 · `/studio/sessoes` — L1 e L2, e o cavalo de batalha

Uma linha por ocorrência: data, título, espaço, teto, presenças, lotação, nota, link de ingresso,
pendência. É onde a operação mora e é a tela que responde «como foi a sessão de terça». Ordenável
por lotação e por data. Sem teto declarado, a célula diz «sem teto» e a linha ganha o marcador de
`Falta` — o vocabulário que a S6 já escreveu.

Exportação em CSV com fonte e denominador no cabeçalho de cada coluna: um CSV que perde a
procedência ao sair da tela reintroduz o problema inteiro na primeira planilha.

### 5.3 · `/studio/comunidade` — o L2 do lado social

As comunidades do produtor em duas colunas separadas — **declarado no dado** (assinantes,
reações) e **observado pelo motor** (assinaturas, salvamentos, comentários, reações). Mais a
taxa de resposta dele e o corte de 30 dias sem publicação, com a UF de cada comunidade parada:
o argumento do marketplace é distribuição territorial, e uma comunidade parada em MS pesa
diferente de uma parada em SP.

> **Risco de alinhamento.** O deploy em produção já serve `/studio/comunidade`, `/studio/pautas`,
> `/studio/perfil` e `/studio/pontos/loja`, que não existem em nenhum branch publicado. Antes de
> criar a rota, **confira se ela já está tomada** e estenda em vez de sobrescrever.

### 5.4 · `/studio/programa` — o L3

Os dois funis lado a lado — resgate (7 fases, terminando em contestado) e missão (prova →
veredito) — mais o painel de motivo dominante de reprovação e o critério do selo de embaixador
com a distância que falta para ele.

---

## 6. Responsividade

Só visão web (D-67). As duas colunas da capa viram uma abaixo de 1024px, e a coluna de estados
vai para baixo — nunca some. A tabela de sessões rola no eixo x dentro do próprio contêiner; a
página nunca rola na horizontal. As três primeiras colunas (data, título, lotação) ficam
fixas na rolagem, porque uma linha sem identidade não é lida.

---

## 7. Lacunas de contrato

- **PEDIDO-S9-01** — `gratuito: true` em 100% com `preco: null` em 100%: declaração ou default?
  Nenhum KPI de gratuidade até a resposta.
- **PEDIDO-S9-02** — `capacidade` mora em `CadastroDeEspaco`, ou seja, no **espaço**. Uma sessão
  numa sala menor do mesmo espaço não tem teto próprio. A V2 usa o teto do espaço e **diz que
  é do espaço**; um teto por ocorrência é adição de ontologia.
- **PEDIDO-S9-03** — `ocorrencia.avaliada` precisa entrar em `NomeDeEvento`, que é lista fechada
  por decisão. É adição de contrato, não de tela.
- **PEDIDO-S9-04** — presença não carrega carimbo de porta: `presencas` guarda só o id. Sem hora
  de confirmação não há curva de chegada, e a V2 não a promete.
- **PEDIDO-S9-06** — `ingresso.saida.clicada` e o campo de link no evento não existem: o acervo
  só tem `comIngresso` falso. Publicar link é adição da tela do produtor, e sem ela a cobertura
  fica travada em 0 de 300.
- **PEDIDO-S9-07** — «embaixador» não existe no código. Classe, selo e critério são adição de
  ontologia, não de tela.
- **PEDIDO-S9-05** — `assinantes` é literal por comunidade. Se a Fundação quiser assinatura como
  medida viva, ela sai de `comunidade.assinada` no livro, e aí depende de agregação.

---

## 8. Fora de escopo

- Agregação entre pessoas, servidor, autenticação e qualquer número de audiência real.
- Bilheteria, faixa etária, perfil de público — continuam recusados, com o motivo na tela.
- Contador de reprodução: mora no serviço que serve o arquivo, e não há um.
- Ranking de produtores por nota ou por lotação. É vigilância com outro nome.
- Reescrever a O10: a conformidade já mede a fila, e a V2 a cita em vez de duplicar.

---

## 9. Portões de verificação

1. `npm run checar` verde, com a falha conhecida de `cursos.css` (PROTOCOLO §5) como única exceção.
2. `npm run verificar-kpis` — suíte nova:
   - nenhum número renderizado sem `data-fonte` e sem denominador irmão;
   - `capacidade === null` nunca produz `%`, `0` nem `—` mudo;
   - nota com n<5 renderiza distribuição, nunca média;
   - `ocorrencia.avaliada` não gera linha de livro;
   - a soma dos três estados cobre 100% dos KPIs declarados — nenhum órfão.
3. Grep de fronteira: nenhum `"use client"` alcançando `@/dados/grafo`.
4. As duas frases herdadas (`REGRA_DO_ALCANCE`, `CONFORMIDADE_NAO_E_VIGILANCIA`) presentes
   literais no HTML exportado.

---

## 10. Ordem de execução — e o que não se corta

1. **Os três estados e os três livros (169, 170).** Sem isso o resto vira painel comum.
2. **L1: cobertura de link e saída para a plataforma (171, 172)** — é o que a restrição de não
   vender ingresso obriga a resolver primeiro, e é o único KPI acionável com 0 de 300.
3. **L2: teto e lotação (173)**, com o caminho de declaração ligado a `/studio/espacos`.
4. **Tabela de sessões (174)** — é a tela que a operação usa todo dia.
5. **Funil da reserva (175)** — é o KPI completo que já existe e ninguém exibe.
6. **Comunidade e resposta a comentário (176)**, conferindo antes se a rota já está tomada.
7. **L3: os dois funis (177, 178)**, com contestação e motivo dominante de reprovação.
8. **Nota (179)** e **selo de embaixador (180)** — por último: são contrato novo e são os dois
   que mais custam se saírem errados.

**Não se corta:** o item 1, a trava de presença do 179 e o critério territorial do 180. Um painel
sem o estado da medida afirma tudo com o mesmo peso; nota sem trava de presença é a mentira
barata voltando pela porta que a O9 fechou; e selo por lotação transforma a distribuição
territorial — que é a tese — em medida de tamanho de sala.
