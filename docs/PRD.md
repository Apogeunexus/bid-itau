# PRD — Agenda Cultural BR

**Proposta ao RFP da Fundação Itaú / Itaú Cultural**
Versão 1.0 · 21/08/2026

---

## 1. Contexto

O Itaú Cultural abriu a etapa final de seleção de um parceiro de produto e tecnologia
para construir *"a principal infraestrutura digital para descoberta da cultura
brasileira"*. O RFP é explícito sobre o critério de avaliação: **mais importante do que
responder corretamente é demonstrar como a equipe pensa** — síntese, clareza, pensamento
sistêmico, visão de longo prazo, decisões fundamentadas e trade-offs conscientes.

Este PRD é o documento de produto que sustenta nossa resposta. Ele nasce de uma
varredura técnica completa do acervo digital do Itaú Cultural, documentada em
[`dados/inventario/mapa-conteudo.md`](../dados/inventario/mapa-conteudo.md).

---

## 2. Visão do produto

> **Uma infraestrutura que transforma o acervo cultural brasileiro em um grafo de
> sentido — e usa esse grafo para levar cada pessoa a uma experiência cultural que ela
> não sabia que procurava.**

Não é uma agenda com mapa. É um sistema que sabe que *Vidas Secas* é um livro do
Graciliano, que a montagem de 2026 é uma leitura dele, que ela acontece num prédio da
Lina Bo Bardi e que quem gosta de rap está a três passos de distância do teatro
documentário.

**O Itaú Cultural entra como espinha dorsal, não como vitrine.** A Enciclopédia, o
acervo, o IC Play e 14 anos de editorial são a camada de autoridade e profundidade que
nenhum concorrente consegue replicar. Mas o produto é nacional, aberto e sobre a cultura
brasileira — não sobre a instituição.

---

## 3. Evidência: o que a varredura revelou

Coletamos e normalizamos **2.534 entidades e 152 pessoas** do site do Itaú Cultural.
Quatro conclusões governam este PRD.

**O ativo é maior do que parece.** 14 anos de acervo (2013–2026), exposições catalogadas
desde 2012, 123 tags com uso disciplinado, 8 dimensões de acessibilidade modeladas, e um
vocabulário controlado de 29 linguagens artísticas que o programa Rumos já mantém — e
que aparece integralmente no acervo. Isso é uma ontologia pronta, feita pela casa.

**A estrutura é o gargalo.** Notícia, coluna, vídeo, curso, exposição e evento são o
*mesmo objeto* no CMS, diferenciados por um campo de texto. Tudo é página.

**Quatro entidades faltam ao site — e são exatamente as quatro que o RFP exige.**

| Falta no CMS | Evidência | O que quebra |
|---|---|---|
| **Artista** | `participants` só contém colunistas; artistas vivem soltos no HTML | Recomendação, conexão, Enciclopédia |
| **Ocorrência** | `schedules` vazio em 100/100 eventos | Agenda, alerta de mudança, sessão |
| **Território** | nenhum campo de local em todo o modelo | Mapa, indicadores territoriais |
| **Pessoa-usuária** | 11 sistemas, 11 logins | Repertório, recorrência, impacto |

### 3.1 A descoberta que reformula a tese

Três dessas quatro entidades **já existem, estruturadas, na Enciclopédia Itaú Cultural** —
uma aplicação Rails separada, com rotas que são a ontologia inteira:

```
/pessoas/{id}-{slug}        /obras/{id}-{slug}       /grupos/{id}-{slug}
/instituicoes/{id}-{slug}   /eventos/{id}-{slug}     /termos/{id}-{slug}
```

Cada registro de listagem carrega linguagem, datas e hierarquia territorial completa:

> **Artes visuais** · *Imigrantes nas Artes Plásticas de São Paulo* ·
> 03.09.1976 – 19.09.1976 · Brasil / São Paulo / São Paulo — Masp

Ou seja: `Pessoa`, `Grupo`, `Obra`, `Instituição`, `Evento`, `Termo`, `Território` e
`Espaço Cultural` — as classes que o CMS não tem — **estão todas lá**, com mais de
100 mil registros e um tesauro de 481 termos.

**Isso muda o argumento da proposta, e para melhor.** O Itaú Cultural não precisa que
alguém construa um grafo cultural do zero: ele já tem um, mantido há décadas por equipe
editorial própria. O que ele não tem é **conexão entre o grafo e a agenda**. A
Enciclopédia sabe quem é o artista, mas não sabe que ele se apresenta sábado; o site sabe
do evento de sábado, mas não sabe quem é o artista. São dois sistemas que não se falam.

O produto que estamos propondo é precisamente essa ponte — e o fato de as duas metades
já existirem é o que torna a escala nacional viável em prazo real, em vez de aspiração.

**A consolidação já começou pela infra.** O site do IC roda em
`prd.itau-cultural.frontend.fundacaoitau.org.br` e o CMS em
`prd.editor.fundacaoitau.org.br`. A Fundação Itaú já é a plataforma. Falta consolidar o
modelo de dados.

---

## 4. Princípios

Os sete do RFP, que aceitamos integralmente:

1. **Descoberta antes de busca**, e gratuita
2. **Curadoria antes de quantidade**
3. **IA amplia possibilidades**, nunca substitui a mediação cultural
4. **Dados são patrimônio**
5. **Arquitetura aberta**
6. **Confiança editorial**
7. **Escala nacional**

E três que a varredura nos obrigou a acrescentar:

8. **Toda recomendação é explicável.** Se o sistema não consegue dizer por que sugeriu
   algo, ele não sugere. Explicabilidade é o que separa mediação de algoritmo.
9. **Todo dado carrega procedência.** Quem afirmou, quando, com que confiança. Sem isso
   não há governança nem dedução de duplicata defensável.
10. **Acessibilidade é filtro, não selo.** O IC já modela 8 dimensões. Elas devem
    funcionar como critério de busca, não como ícone decorativo.

## O que não somos

Agenda tradicional · guia turístico · aplicativo institucional · rede social ·
marketplace · chatbot · catálogo estático.

O caminho óbvio para "descoberta cultural" é um app de agenda com mapa e filtros. Ele
reprova. Nossa defesa contra ele é estrutural, não retórica: **a unidade do produto é a
relação, não o item.** Um catálogo lista; um grafo conecta.

---

## 5. Público

| Perfil | Quem é | O que precisa | Onde aparece |
|---|---|---|---|
| **Descobridora** | Não sabe o que procura. Repertório estreito, curiosidade larga | Ser levada, não ter que buscar | App — Descobrir |
| **Viajante** | Tempo curto em território desconhecido | Um roteiro que caiba no tempo dela | App — Modo Cidade |
| **Frequentadora** | Já tem repertório, quer o próximo passo | Adjacência, não repetição | App — Repertório |
| **Produtor / Instituição** | Precisa que seu evento seja encontrado | Publicar sem fricção e ver alcance | Studio (web) |
| **Curador / Editor** | Responde pela qualidade do que aparece | Ferramenta de curadoria com poder de veto | Redação (web) |
| **Gestão institucional** | Precisa provar impacto cultural | Indicadores que não sejam pageview | Observatório (web) |

---

## 6. Ontologia e modelo de dados

O produto inteiro deriva desta estrutura. Classes com critério de identidade explícito,
papéis separados de entidades, relações como cidadãs de primeira classe.

### Camada 0 — Vocabulário controlado
`Linguagem` · `Movimento` · `Tema` · `Técnica` · `Povo/Comunidade` · `Território`

Semente real: as **29 expressões do Rumos** e as 123 tags do acervo, promovidas a
tesauro com hierarquia e sinonímia.

### Camada 1 — Agentes
`Pessoa` · `Coletivo` · `Instituição` · `Espaço Cultural`

**Decisão dura:** *artista*, *curador*, *produtor* e *educador* **não são classes — são
papéis**. A mesma pessoa é artista num evento e curadora em outro. Modelar papel como
classe gera duplicata estrutural e trava o produto em dois anos. É exatamente o erro que
o CMS atual comete ao chamar de `participants` uma lista que só contém colunistas.

### Camada 2 — Criação
`Obra` → `Expressão` → `Manifestação` → `Item`

> *Vidas Secas* (obra) → a montagem da Cia. X (expressão) → a temporada no Sesc
> (manifestação) → a gravação em vídeo (item)

Permite dizer "você viu esta leitura; existe aquela outra da mesma obra".

### Camada 3 — Acontecimentos
`Programa` → `Evento` → `Temporada` → **`Ocorrência`**

| Nível | Critério de identidade |
|---|---|
| Evento | título normalizado + agente realizador + obra |
| Temporada | evento + espaço + intervalo |
| **Ocorrência** | **temporada + início exato + espaço** |

Uma decisão de modelagem que resolve dois cenários do RFP: mil duplicados colapsam numa
entidade com N ocorrências, e uma mudança de horário altera *uma ocorrência* sem
invalidar o evento.

### Camada 4 — Conhecimento editorial
`Notícia` · `Coluna` · `Entrevista` · `Vídeo` · `Podcast` · `Publicação` · `Pesquisa` ·
`Verbete`, ligados por `fala_sobre`, `contextualiza`, `aprofunda`.

É aqui que 14 anos de conteúdo do IC deixam de ser arquivo e viram combustível de
descoberta.

### Camada 5 — Pessoa e repertório
`Pessoa-usuária` · `Interesse` · **`Repertório`** · `Trilha` · `Sinal`

`Repertório` é entidade de primeira classe desde o dia um, porque é dela que sai o
indicador de ampliação de repertório que o RFP pede. Métrica de impacto não pode ser
puxadinho de analytics.

### Relações
`influenciou` · `dialoga_com` · `deriva_de` · `pertence_a` · `atua_em` (com papel) ·
`curou` · `realiza` · `ocorre_em` · `situado_em` · `aprofunda` ·
**`semelhante_a` — sempre com justificativa legível**

A última é a chave: *"parecido porque é arte contemporânea, coletiva, em espaço público
e gratuita"*. IA auditável, não caixa-preta.

### Procedência
Todo campo carrega origem: `ic` (veio do CMS), `derivado` (inferido
deterministicamente), `parceiro`, `produtor`, `ia` (com score de confiança), `curador`.
Sem isso não há dedução de duplicata defensável nem dado aberto confiável.

---

## 7. Arquitetura de informação

**68 rotas → 12 módulos → 5 abas.**

| # | Módulo | Rotas que absorve | Superfície |
|---|---|---|---|
| 1 | Descobrir | home | App |
| 2 | Acontece | agenda, busca-agenda, exposições, ocupação | App |
| 3 | Mapa & Território | *(novo)* | App |
| 4 | Play | vídeos, playlists, podcasts, séries, IC Play, tour virtual | App |
| 5 | Enciclopédia & Acervo | enciclopédia, ResourceSpace, CollectiveAccess, Olavo Setúbal | App |
| 6 | Leituras | notícias, colunas, opinião, entrevista, especiais | App |
| 7 | Formação | escola, biblioteca, agendamento, Transversalidade | App |
| 8 | Oportunidades | Rumos, Jabuti, editais | App |
| 9 | Meu Repertório | newsletter, comunica | App |
| 10 | **Studio** (produtor) | *(novo)* | Web |
| 11 | **Redação** (curador) | *(novo)* | Web |
| 12 | **Observatório & Dados** | observatório | Web |

**As 5 abas do app:** Descobrir · Acontece · Play · Buscar · Meu

Mapa não é aba — é lente dentro de *Acontece* e *Buscar*. Enciclopédia e Leituras não
são abas — aparecem *dentro* do que você está olhando, como profundidade. É assim que se
responde à pergunta do RFP sobre como evitar excesso de informação.

**Formação e Oportunidades não ganham aba** — e essa é uma decisão, não um esquecimento.
Uma aba custa atenção permanente de todo mundo para servir a uma minoria em um momento
específico. Então:

| Módulo | Onde vive | Funcionalidade ★ afetada |
|---|---|---|
| **Formação** | Dentro da página do Espaço e do Evento ("agendar visita"), e em *Meu* como "minhas visitas" | 44 — agendamento de visita |
| **Oportunidades** | No **Studio** (superfície do produtor) e como seção de *Meu* para quem se declara artista ou produtor | 46, 48, 49 — editais e onboarding de produtor |

O princípio: uma pessoa que nunca foi ao teatro não precisa ver "Editais" na barra
inferior. Um artista que busca edital chega por notificação ou pelo próprio perfil.

Institucional vira rodapé. `/404`, `/busca-nao-encontrada` e `/agenda-nao-encontrada`
deixam de ser becos: **não achar nada vira gatilho de descoberta.**

---

## 8. Funcionalidades

86 no total, 57 no MVP (★). Lista completa e numerada em
[`docs/funcionalidades.md`](funcionalidades.md).

**Descobrir** — feed por caminhada no grafo ★ · entrada por disposição ("tenho 2h", "com
criança", "de graça e perto") ★ · trilha de primeira vez ★ · fios de conexão ·
serendipidade dosada · explicação da recomendação ★ · destaque curado que sobrepõe o
algoritmo ★ · adjacência de repertório

**Acontece** — evento com N ocorrências ★ · filtros ontológicos ★ · salvar e lembrar ★ ·
alerta de alteração ★ · "eu fui" ★ · ficha de acessibilidade ★ · ingresso · evento de
longa duração · compartilhar

**Mapa & Território** — mapa como lente ★ · Modo Cidade ★ · roteiro do dia ★ · recorte
por bairro · camada de desertos culturais · perto de mim agora

**Play** — catálogo unificado ★ · retomada ★ · exposição e tour virtual · Play conectado
ao evento ★ · legenda/libras/audiodescrição como filtro · offline

**Enciclopédia & Acervo** — página de artista ★ · página de obra ★ · movimento ·
verbete embutido ★ · acervo com mídia · linha do tempo · reconciliação com verbete ★

**Leituras** — matéria ligada a entidades ★ · especiais como trilha · "aprofunda isto" ★
· publicações e pesquisas

**Formação** — cursos · biblioteca · agendamento de visita ★ · área do educador

**Oportunidades** — editais filtrados por perfil ★ · inscrição · alerta compatível ★ ·
onboarding de produtor via edital ★

**Meu Repertório** — identidade única ★ · onboarding por disposição ★ · salvos e
histórico ★ · mapa de repertório ★ · trilhas próprias · acessibilidade global ★ ·
notificações · LGPD ★

**Studio** — cadastro e verificação ★ · publicação com validação ★ · gestão de
ocorrências ★ · resolução de duplicata ★ · painel de alcance · importação em lote ·
score de qualidade ★

**Redação** — fila de moderação ★ · editor de trilha ★ · destaque e veto com autoria ★ ·
curadoria territorial · revisão da IA ★ · calendário editorial

**Observatório** — dashboards por público ★ · KPIs ★ · indicadores de impacto cultural ★
· indicadores territoriais ★ · API e dados abertos · LGPD ★ · observabilidade de dados ★

**Transversais** — busca unificada no grafo ★ · linguagem natural traduzida e explicada
★ · facetas ontológicas ★ · zero-resultado vira descoberta ★ · ingestão com IA e score ★
· deduplicação em dois estágios ★ · similaridade justificada ★ · feedback humano ·
limites explícitos da IA ★

---

## 9. Os cinco cenários

Não são exercícios soltos — são o teste de estresse dos princípios. Todos se resolvem
com o **mesmo núcleo**, e é isso que demonstra pensamento sistêmico.

**Cenário 1 — Maria, 27 anos, nunca foi ao teatro.**
Entramos por onde ela já está, não por "teatro". Ela ouve rap → `rap` conecta a `poesia
falada` → que conecta a `teatro documentário` → que tem uma montagem gratuita a 4 km,
sábado. Três arestas. O app mostra o caminho, não só o resultado. *Mecanismo: adjacência
de repertório + trilha de primeira vez + explicabilidade.*

**Cenário 2 — Carlos, 4 dias em Belém.**
Modo Cidade: janela de tempo + território desconhecido. O sistema equilibra densidade
cultural e deslocamento, prioriza o que é próprio do território (não a franquia que ele
já tem em casa) e mistura gratuito e pago. *Mecanismo: projeção espacial do grafo +
roteiro por janela.*

**Cenário 3 — Instituição publica milhares de eventos duplicados.**
A dedup acontece na ingestão, em dois estágios: chave determinística derivada do critério
de identidade (evento = título normalizado + agente + obra; ocorrência = temporada +
início + espaço), depois casamento probabilístico para o resto. O que passa de um limiar
vira fila de revisão no Studio, com sugestão de merge. Mil registros colapsam em um
evento com N ocorrências. *Mecanismo: critério de identidade da ontologia.*

**Cenário 4 — Evento muda de horário duas horas antes.**
A alteração atinge **uma ocorrência**, não o evento. Quem salvou aquela ocorrência recebe
alerta; quem salvou o evento, não. O produtor altera no Studio e a mudança propaga com
procedência registrada. *Mecanismo: separação Evento / Ocorrência.*

**Cenário 5 — "Quero algo parecido com a Bienal, gratuito e perto de mim".**
A frase é traduzida em consulta estruturada sobre o grafo — `semelhante_a(Bienal)` +
`gratuito` + `raio`. A resposta vem com a tradução visível: *"busquei arte contemporânea,
coletiva, em espaço público, gratuita, até 5 km"*, editável em um toque. Não é chatbot:
é linguagem natural virando faceta. *Mecanismo: `semelhante_a` com justificativa.*

---

## 10. Inteligência artificial

**Onde a IA gera valor**

| Uso | Por quê |
|---|---|
| Extração de entidades do acervo | 14 anos de artistas presos em HTML. É o maior ganho imediato |
| Enriquecimento na ingestão | Normalizar, classificar linguagem, sugerir território |
| Casamento probabilístico de duplicatas | Depois da chave determinística, não antes |
| Tradução de linguagem natural em consulta | Cenário 5 |
| Sugestão de trilha para o curador | Sugere; quem assina é humano |
| Descrição alternativa de imagem | 21% do acervo sem alt-text |

**Onde a IA não entra** — o RFP pergunta isso explicitamente:

- Não publica nada sem revisão humana
- Não define destaque editorial
- Não escreve verbete de Enciclopédia
- Não decide ranking comercial
- Não substitui mediação cultural

**Transparência:** toda saída de IA carrega `procedencia: "ia"` e score de confiança.
Toda recomendação é explicável em linguagem comum. Toda sugestão passa por fila humana
antes de virar dado público.

**Feedback humano:** a decisão do curador na fila é sinal de treino. O sistema aprende
com quem tem autoridade cultural, não com clique.

---

## 11. Métricas

**KPIs de produto** — aquisição, ativação (primeiro "salvar"), engajamento, retenção
D7/D30, taxa de descoberta (itens acessados sem busca prévia).

**Indicadores de impacto cultural** — os que o RFP pede e que nenhum analytics genérico
entrega:

| Indicador | Como se mede |
|---|---|
| Ampliação de repertório | Nº de linguagens distintas no `Repertório` ao longo do tempo |
| Descoberta de novo artista | Primeira interação com agente sem histórico prévio |
| Diversidade de linguagem | Entropia da distribuição de linguagens por usuário e por região |
| Circulação territorial | Deslocamento cultural: eventos fora do bairro de origem |
| Alcance da gratuidade | Proporção gratuito × pago no que é efetivamente consumido |

**Indicadores territoriais e institucionais** — distribuição geográfica da oferta, oferta
por linguagem, desertos culturais, participação de instituições, razão gratuito × pago.

**Dashboards por público** — editorial (o que minha curadoria produziu), produto (funil e
retenção), parceiro (alcance do meu conteúdo), institucional (impacto cultural).

---

## 12. Roadmap

| Fase | Escopo | Marco de saída |
|---|---|---|
| **MVP** | Grafo mínimo (agente, evento, ocorrência, linguagem, território) · ingestão do acervo IC com extração de entidades · app com as 5 abas · Redação · Studio básico | Uma pessoa descobre, salva e vai a um evento que não buscou |
| **Piloto** | Uma região · 20–30 instituições parceiras · dedup em produção · indicadores de impacto v1 · alerta de ocorrência | Produtores publicam sozinhos e a duplicata cai abaixo do limiar |
| **Escala nacional** | Ingestão federada · curadoria territorial delegada · Modo Cidade · offline · Oportunidades integrado a editais | Cobertura nas capitais e indicadores territoriais publicáveis |
| **Plataforma expandida** | API pública e dados abertos · vertical de educação · Enciclopédia como serviço de autoridade para terceiros | O grafo vira infraestrutura que outros consomem |

---

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Virar "app institucional" — anti-alvo do RFP | AI organizada por curiosidade, não por organograma. IC é espinha, não vitrine |
| Oferta nacional insuficiente no início | Editais e Rumos como canal de aquisição de produtores já qualificados |
| Curadoria não escala nacionalmente | Curadoria territorial delegada + IA que sugere e humano que assina |
| Dedup gerar falso positivo e apagar evento real | Dois estágios, limiar conservador, fila de revisão, merge reversível com procedência |
| Excesso de informação matar a descoberta | Mapa e busca como lentes, não como home. Enciclopédia embutida, não paralela |
| LGPD no `Repertório` | Consentimento granular, anonimização nos indicadores, exportação e exclusão |
| Dívida do acervo (0% de ocorrência, 3% de artista) | Extração assistida por IA com revisão humana; o passivo vira o diferencial |

---

## 14. Escopo desta entrega

**O que construímos agora:** as telas e o front-end navegável, em duas visões — **web** e
**mobile** — com dados mockados no formato do grafo.

**O que fica para a fase seguinte, com o time de produto:** backend, banco, CMS, APIs
reais, IA em produção, analytics, observabilidade, segurança e infraestrutura.

**Por que os dados mockados seguem a ontologia mesmo sem backend:** sem evento separado
de ocorrência, sem papel no agente e sem motivo escrito na recomendação, as telas não
conseguem *demonstrar* o comportamento que o RFP avalia. E o JSON pronto vira contrato de
API para o time de produto. Custo marginal agora, economia grande depois.

### Procedência dos dados do protótipo

Nada é inventado sem estar marcado. Cada entidade carrega sua origem:

| Entidade | Origem | Volume | Marca |
|---|---|---|---|
| Conteúdo editorial, mídia, publicação, formação | CMS do site | 2.534 | `ic` |
| **Artista, Grupo, Obra, Instituição** | **Enciclopédia** | 1.125 | `ic` |
| **Território e Espaço Cultural** | **Enciclopédia**, saneado | 947 locais · 113 espaços distintos | `ic` |
| Linguagem e Tema (tesauro) | Rumos + Enciclopédia | 29 + 481 termos | `ic` |
| Coordenadas geográficas | Centroide de município + aproximação por espaço | — | `derivado` |
| **Ocorrência** | Gerada a partir do período real do evento | — | `derivado` |
| Pessoa-usuária e Repertório | Autoradas: 3 personas (Maria, Carlos, uma frequentadora) | 3 | `autorado` |
| Duplicatas do Cenário 3 | Clonadas de eventos reais com variação controlada | ~40 | `autorado` |

**Regra de saneamento do território.** O bloco de detalhe da Enciclopédia é polimórfico:
a mesma posição carrega ora `Brasil / Distrito Federal / Brasília — UnB`, ora `Óleo sobre
tela`, ora o nome do autor. Um parser ingênuo põe técnica e autoria no campo `país` — foi
o que aconteceu na primeira passagem, contaminando 24% das entradas. A regra final testa
**conteúdo, não tipo**: o primeiro segmento precisa estar num vocabulário fechado de
países. O que não passa não é descartado, é rebaixado para `detalhe` e preservado. Depois
disso, `país` tem 41 valores distintos, todos válidos.

Isso não é higiene de bastidor: Mapa e Modo Cidade estão na camada intocável, e seriam
justamente as telas a exibir dado sujo carimbado como `ic` — na proposta que promete
procedência visível.

Só três coisas são autoradas — e as três não poderiam vir de lugar nenhum, porque
pessoa-usuária não existe em sistema algum do IC e ocorrência não existe nem no CMS nem
na Enciclopédia. **A marcação de procedência aparece na interface do Observatório**, o que
transforma uma limitação do protótipo em demonstração do princípio 9.

### Ordem de corte

O prazo é de 3 dias e são 36 telas. A regra: **as telas que os cinco cenários atravessam
são intocáveis**; o resto é fila. Se algo tiver de cair, cai de baixo para cima.

**Camada 1 — intocável (16 telas).** Onboarding por disposição · Descobrir · Explicação da
recomendação · Trilha de primeira vez · Acontece · Página do evento · Seleção de
ocorrência · Mapa · Modo Cidade · Buscar · Busca em linguagem natural · Página do artista
· Meu Repertório · Salvos e alertas · Studio: duplicatas · Studio: ocorrências

**Camada 2 — a proposta fica pobre sem elas (12 telas).** Filtros · Play · Player ·
Zero-resultado como descoberta · Página do produtor · Redação: fila · Redação: trilha ·
Observatório: indicadores · e as versões web de Descobrir, Acontece com mapa, Página do
evento e Buscar

**Camada 3 — primeiro a cair (8 telas).** Onboarding telas 2 e 3 · Página da obra · Mapa
de repertório · Studio: publicar · Perfil web · Página do artista web · Página do produtor web

### Telas do protótipo

**Visão mobile — app** (23 telas)
Onboarding (3) · Descobrir · Explicação da recomendação · Trilha de primeira vez ·
Acontece · Filtros · Mapa · Modo Cidade · Página do evento · Seleção de ocorrência ·
Página do artista · Página da obra · Buscar (vazio) · Busca em linguagem natural ·
Zero-resultado como descoberta · Play · Player · Meu Repertório · Mapa de repertório ·
Salvos e alertas · Página do produtor

**Visão web — desktop** (13 telas)
Descobrir · Acontece com mapa lado a lado · Página do evento · Página do artista ·
Buscar · Perfil · Página do produtor · Studio: publicar · Studio: ocorrências · Studio:
duplicatas · Redação: fila · Redação: trilha · Observatório: indicadores

**Roteiro de demonstração:** os cinco cenários navegáveis ao vivo. Se o tempo apertar,
é a última coisa a cair — é ela que responde ao que a banca vai perguntar.

### Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Next.js + TypeScript | Rotas do protótipo espelham o produto real |
| Estilo | Tailwind | Velocidade, e o design system é o do IC, não inventado |
| Dados | JSON mockado no formato do grafo | Vira contrato de API depois |
| Duas visões | Um código, dois layouts, alternador ao vivo | Demonstra domínio sem dobrar o trabalho |
| Mobile de loja | Fora de escopo | O RFP pede protótipo navegável, não binário |
| Identidade | Manual do Itaú Cultural aplicado | Etapa final entre concorrentes; caixa cinza não vende |

---

## 15. Perguntas em aberto

1. Formato e limite da entrega (páginas, apresentação presencial, ferramenta do protótipo)
2. Faixa de orçamento esperada para dev e sustentação
3. Acesso a dados internos — Enciclopédia, CollectiveAccess, ResourceSpace — na fase de
   implementação
4. Existe compromisso institucional de abertura de API, ou é aspiração?
5. Quem, do lado do Itaú Cultural, responde pela curadoria no produto?

---

## Anexos

- [`dados/inventario/mapa-conteudo.md`](../dados/inventario/mapa-conteudo.md) — varredura completa
- [`dados/normalizado/`](../dados/normalizado/) — 2.534 entidades no formato do grafo
- [`dados/taxonomia/`](../dados/taxonomia/) — vocabulário de linguagens e temas
- [`dados/inventario/lacunas.json`](../dados/inventario/lacunas.json) — lacunas quantificadas
- [`referencias/`](../referencias/) — RFP e manuais de marca
