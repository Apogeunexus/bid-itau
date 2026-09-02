# Tela a tela — apresentação de 60 minutos

35 telas apresentadas + 10 de apêndice. Cada entrada traz **o que aparece projetado** e **a
fala** — a frase que carrega a tela. Os percursos ao vivo trazem a rota literal do protótipo,
lida de `src/dados/roteiro.ts`.

> **Regra de ouro:** o que está na tela não é o que se fala. Se a fala está escrita na tela,
> a plateia lê em vez de ouvir.
>
> **Os clipes não substituem a demonstração ao vivo.** Eles demonstram os cenários
> pré-definidos, com a trilha de capítulos ao lado. O protótipo continua aberto.

---

## Bloco 1 — Abertura · 3 min

### Tela 01 · Capa
**Na tela:** marca Itaú Cultural no topo à esquerda · grafismo `\C` cortado sangrando pela
borda superior direita · **Agenda Cultural BR** em Display 900 · linha fina: «Proposta de
produto e tecnologia» · chancela Fundação Itaú no rodapé.
**Fala:** nada. Ela já está projetada quando a sala senta.

### Tela 02 · Onde paramos
**Na tela:** três linhas soltas, sem imagem, sem bullet.
«O Itaú Cultural já é um Movimento.» · «Começar nos 40, construir os 50.» · «Dez anos — que
começam agora.»
**Fala:** trinta segundos de reancoragem. Não se reapresenta nada da primeira fase.

---

## Bloco 2 — Ecossistema e tríade · 3 min

### Tela 03 · Mapa do Ecossistema
**Na tela:** os treze agentes do briefing dispostos em roda — pessoa, interesses, território,
eventos, artistas, produtores, instituições, obras, memória, comunidades, novas descobertas,
plataformas parceiras, plataformas da Fundação. **Dois em laranja, onze rebaixados a 30%.**
**Fala:** «Temos potencial de tocar todos. Vamos começar por dois — os outros entram em
ondas, quando a roda já gira.»

### Tela 04 · A roda
**Na tela:** quatro nós e quatro setas, cada seta rotulada com o que passa por ela — *o que
atravessou* · *demanda não atendida* · *alcance e público* · *curadoria e descoberta*.
**Fala:** «Tire qualquer uma das quatro e a roda para.»

### Tela 05 · A ponte
**Na tela:** duas colunas com um vão marcado no meio. Esquerda: Enciclopédia — 100 mil+
registros, sabe quem é o artista. Direita: agenda — sabe que tem espetáculo sábado. Rodapé
com os números da varredura: 2.534 entidades · 1.766 verbetes saneados · 29 linguagens ·
2.382 imagens.
**Fala:** «Não estamos propondo construir um grafo cultural. Ele já existe — partido em dois.
O produto é a ponte.»

---

## Bloco 3 — Jornada do público · 10 min · **AO VIVO**

### Tela 06 · A descoberta acontece antes do cadastro
**Na tela:** as três perguntas que se repetem em todo cenário — *Qual é a intenção?* · *Como
a plataforma entrega?* · *Que dado fica?* — e um selo: «camada 01 · sem login».
**Fala:** «Os quatro cenários seguem esta mesma estrutura. Nenhum deles pede cadastro.»

### Tela 07 · Cenário 01 — Maria, 27 anos, nunca foi ao teatro
**Na tela:** só o nome do cenário e as três perguntas em rodapé fino. O navegador assume.
**Percurso ao vivo:**
1. `/onboarding/1/` — ela escolhe uma disposição, não um gênero
2. `/descobrir/` — o feed montado por caminhada no grafo
3. `/descobrir/porque/<cartão>/` — as arestas que levaram até ali
4. `/trilha/<trilha>/` — rap → poesia falada → teatro documentário
5. ficha do evento — montagem gratuita, datada, a 4 km
**Fala:** «Ela nunca disse a palavra teatro. Entramos por onde ela já está.»

### Tela 08 · Cenário 02 — Carlos, 4 dias em Belém
**Percurso ao vivo:** `/cidade/belem-para/` → mapa como lente sobre o mesmo recorte.
**Fala:** «Quatro dias e uma cidade que ele não conhece. O sistema equilibra densidade e
deslocamento, e prioriza o que é próprio do território — não a franquia que ele já tem em
casa.»

### Tela 09 · Cenário 03 — «parecido com a Bienal, gratuito e perto de mim»
**Percurso ao vivo:** `/buscar/frase/` → `/evento/<slug>/` → mapa como lente.
**Fala:** «A tradução da frase fica visível e editável em um toque. Não é chatbot: é
linguagem natural virando faceta.»

### Tela 10 · Cenário 04 — o retorno
**Na tela:** três estados de volta, lado a lado — *o que mudou perto de você* · *o passo
adjacente ao que você já atravessou* · *o vazio como convite*.
**Fala:** «Recorrência não se compra com notificação. Ela vem de ter sempre um passo
seguinte que faz sentido.»
> ⚠ **Única tela do bloco sem percurso no protótipo.** Ver «Conflito aberto» no fim.

---

## Bloco 4 — Camadas de uso · 3 min

### Tela 11 · As três camadas de uso
**Na tela:** três degraus. **01 Utilitário** (sem login) — descobrir, buscar, mapa, salvar na
sessão · **02 Benefícios** (com login) — repertório persistente, alerta de ocorrência,
benefício exclusivo · **03 Embaixador** — recomenda, assina trilha, representa território.
Sob cada degrau, o que a pessoa entrega em troca.
**Fala:** «A informação chega por camada. Cada camada é conquistada, não empurrada — é assim
que se evita excesso de informação sem esconder nada.»

### Tela 12 · O que não entra no MVP
**Na tela:** o título afirma o que fica — **tudo que está no app permanece**. Abaixo, três
caixas do que não entra: **ticketeiras** (levamos até a bilheteria, a compra acontece fora) ·
**meios de transporte** (como chegar fica com o mapa do telefone) · **demais integrações de
terceiros** (entram depois, uma a uma, por conector).
**Fala:** «Nada do que está no app sai. O que fica para depois são as integrações com
terceiros — e nenhuma delas toca no núcleo, porque é a camada de ingestão que absorve.»

---

## Bloco 5 — Jornada do produtor · 7 min · **AO VIVO**

### Tela 13 · Ele entra dizendo quem é
**Na tela:** a balança da troca. Esquerda, o que ele entrega: evento, agentes com papel,
ocorrências, acessibilidade, correção na origem. Direita, o que recebe: alcance, público,
inteligência de demanda. Embaixo, em negativo: **não é painel financeiro.**
**Fala:** «Diferente do público, o produtor faz login no primeiro segundo. E a troca é dita
em voz alta — a Fundação Itaú não transaciona ingresso.»

### Tela 14 · Uma instituição publica milhares de eventos duplicados
**Percurso ao vivo:** `/studio/duplicatas/` — a fila de revisão, a chave determinística, a
sugestão de merge.
**Fala:** «Mil registros colapsam em um evento com N ocorrências. E o merge é reversível,
com procedência — porque apagar evento real custa mais caro que manter duplicata.»

### Tela 15 · Um evento muda de horário duas horas antes
**Percurso ao vivo:** `/studio/ocorrencias/` — o produtor altera na origem → `/salvos/` — o
alerta chega só para quem salvou aquela sessão.
**Fala:** «A alteração atinge uma ocorrência, não o evento. Quem salvou o evento inteiro não
é incomodado — é isso que impede o produto de virar máquina de notificação irrelevante.»

### Tela 16 · O que ele ganha em troca
**Na tela:** o painel do produtor — quem é o público dele, de onde vem, contra o próprio
histórico. E, destacado, o cartão de **demanda não atendida**: «existem pessoas procurando o
que você faz, a esta distância de você.»
**Fala:** «É aqui que os dois lados se alimentam na frente de vocês.»

### Tela 17 · A mecânica de troca
**Na tela:** um ciclo curto: produtor oferece benefício exclusivo → Fundação distribui →
público chega → dado volta para o produtor. Selo: **sem investimento do produtor.**
**Fala:** «É o motor econômico da roda, sem virar marketplace.»

---

## Bloco 6 — Dados e inteligência · 6 min

### Tela 18 · Os três tipos de dado
**Na tela:** três colunas. **A — funcional obrigatório**: sem isso o produto não existe.
**B — comportamental automático**: a plataforma capta sozinha. **C — complementar, pedido**:
só existe se alguém for perguntado. Sob cada uma, a regra de consentimento.
**Fala:** «Dado é patrimônio, e cada natureza tem regra própria. Isso não é detalhe jurídico
— é o que decide o que se pode publicar como dado aberto depois.»

### Tela 19 · Indicadores de impacto cultural
**Na tela:** cinco linhas, indicador à esquerda e a medida à direita — ampliação de
repertório · descoberta de novo artista · diversidade de linguagem · circulação territorial ·
alcance da gratuidade.
**Fala:** «Nenhum analytics genérico entrega isso. Sai daqui porque Repertório é entidade de
primeira classe desde o primeiro dia, não um puxadinho.»

### Tela 20 · Índice de Ativação Cultural e os cruzamentos
**Na tela:** à esquerda, IAC = E+D+R+C com as três referências internacionais. À direita, os
cruzamentos com dado público: PIB, IDH, criminalidade — e a pergunta que eles abrem.
**Fala:** «O Itaú já tem seus índices. A plataforma agrega em vez de competir. O ganho novo
está no cruzamento: pode aparecer que menos PIB tem mais cultura.»

### Tela 21 · Onde a IA gera valor
**Na tela:** seis usos, cada um com o porquê em meia linha — extração do acervo,
enriquecimento na ingestão, casamento probabilístico, linguagem natural, alt-text, sugestão
de trilha ao curador.
**Fala:** «Catorze anos de artistas presos em HTML. É o maior ganho imediato.»

### Tela 22 · Onde a IA não entra
**Na tela:** cinco negativas, em tipografia grande, sobre fundo limpo. Não publica sem
revisão · não define destaque editorial · não escreve verbete · não decide ranking comercial
· **não substitui mediação cultural.**
**Fala:** «Toda saída carrega procedência e score, e passa por fila humana. A decisão do
curador nessa fila é o sinal de treino: o sistema aprende com autoridade cultural, não com
clique.»

---

## Bloco 7 — Mapa Vivo e gestão · 4 min

### Tela 23 · O Mapa Vivo
**Na tela:** o Brasil com oferta por linguagem e por território. Os vazios visíveis.
**Fala:** «O que este mapa mostra melhor não é onde tem cultura. É onde não tem — e isso é
uma decisão de investimento esperando para ser tomada.»

### Tela 24 · Dashboards por público
**Na tela:** quatro painéis lado a lado — editorial, produto, parceiro, institucional. Sob
cada um, a pergunta que ele responde e a decisão que ele destrava.
**Fala:** «Cada público vê o recorte que ele pode agir. Painel que ninguém usa para decidir é
relatório.»

### Tela 25 · Do indicador ao plano de ação
**Na tela:** três passos encadeados — o indicador cai numa região → a plataforma nomeia a
lacuna → vira direcionamento (edital, curadoria territorial, parceria).
**Fala:** «É a amarração. Sem este passo, o Mapa Vivo é bonito e inerte.»

---

## Bloco 8 — Arquitetura · 5 min

### Tela 26 · Arquitetura em camadas
**Na tela:** o diagrama completo — fontes → ingestão → grafo → superfícies, com segurança,
LGPD, analytics e observabilidade atravessando todas as camadas num trilho vertical.
**Fala:** «Todo o pedido do briefing está aqui: front, back, CMS, APIs, banco, IA, analytics,
observabilidade e segurança.»

### Tela 27 · A camada de ingestão
**Na tela:** o funil — normalizar → extrair com IA → chave determinística → casamento
probabilístico → fila humana. Sob ele, a linha da procedência: `ic · derivado · parceiro ·
produtor · ia (com score) · curador`.
**Fala:** «É esta camada que responde 'como crescer sem reescrever'. Fonte nova entra por
conector. O núcleo não muda quando o Brasil inteiro entra.»

### Tela 28 · O modelo de dados
**Na tela:** as seis camadas da ontologia, e as duas decisões que sustentam tudo: **papel na
relação, nunca como classe** · **Programa → Evento → Temporada → Ocorrência**, cada nível com
critério de identidade próprio.
**Fala:** «Se papel virasse classe, o mesmo artista existiria três vezes — e a duplicata
seria estrutural, não erro de entrada.»

### Tela 29 · Ambientes, dispositivos e APIs futuras
**Na tela:** um código, duas visões · rede ruim e uso offline · o contrato de dados do MVP
sendo o mesmo da API pública · LGPD e anonimização no dado aberto.
**Fala:** «Abrir a API depois não é construir de novo: é publicar o contrato que já existe.»

---

## Bloco 9 — Como se constrói · 5 min

### Tela 30 · Roadmap em quatro estágios
**Na tela:** MVP · Piloto · Escala Nacional · Plataforma Expandida — cada um com escopo e,
em destaque, o **marco de saída**.
**Fala:** «Nenhum estágio termina numa data. Termina num comportamento que dá para observar:
uma pessoa vai a um evento que não buscou; o produtor publica sozinho; a duplicata cai
abaixo do limiar.»

### Tela 31 · Cronograma
**Na tela:** linha do tempo com as ondas de entrega e, marcados, os pontos de decisão.
**Fala:** «Nestes pontos vocês decidem seguir ou segurar, com evidência na mão.»

### Tela 32 · Time e sustentação
**Na tela:** composição do time de desenvolvimento e, separado, o time de sustentação depois
do go-live.
**Fala:** «Sustentação não é o mesmo time menor. É outro time, com outra rotina.»

### Tela 33 · Investimento e o que precisamos da Fundação
**Na tela:** à esquerda, custo de desenvolvimento e de operação. À direita, as quatro coisas
que precisamos: acesso aos dados internos · dono nomeado da curadoria · posição sobre
abertura de API · faixa de orçamento.
**Fala:** «Estas quatro não são burocracia. Cada uma delas, se não vier, trava uma parte
específica do roadmap — e a gente prefere dizer isso agora.»

---

## Bloco 10 — Fechamento · 2 min

### Tela 34 · O Movimento em cinco anos
**Na tela:** a espiral com as três voltas — tech · inteligência · novos perfis de público.
**Fala:** «O produto em cinco anos é consequência do Movimento em cinco anos, não o
contrário.»

### Tela 35 · Resumo da proposta de valor
**Na tela:** uma frase só, grande. O protótipo já aberto na segunda tela.
**Fala:** a frase, e o convite para as perguntas.

---

## Apêndice · 10 telas · não se apresentam

Abre-se a que a pergunta pedir.

A1 Riscos e mitigações · A2 Os cinco cenários do briefing em tabela, com o mecanismo de cada ·
A3 KPIs de produto completos · A4 Modelo de dados detalhado · A5 Procedência: o enum e onde
aparece na interface · A6 Acessibilidade: as oito dimensões como filtro · A7 LGPD ·
A8 Segurança · A9 Governança e qualidade de dados · A10 Inventário do acervo

---

## Conflito aberto — o Cenário 04 do público

O protótipo implementa **os cinco cenários do briefing**, não quatro cenários de público mais
dois de produtor. A distribuição real dos percursos é:

| Bloco | Cenário do briefing | Telas do protótipo |
|---|---|---|
| Público | 1 · Maria | 5 |
| Público | 2 · Carlos em Belém | 2 |
| Público | 5 · «parecido com a Bienal» | 3 |
| Produtor | 3 · duplicatas | 1 |
| Produtor | 4 · horário muda | 2 |

Sobra o «Cenário 04» do board, que eu propus como **recorrência** — e ele **não tem percurso
navegável**. Três saídas:

1. **Tela falada, sem demo** (é o que está escrito acima). Custa a quebra de ritmo: três
   demos e uma tela estática no mesmo bloco.
2. **Cortar a tela 10** e ficar com três cenários de público. O bloco encolhe para 8 min e
   sobram 2 min para o produtor.
3. **Construir o percurso** — `/descobrir/` já tem o feed e `/meu/` já tem o repertório; o
   que falta é o estado «desde a sua última visita».

Recomendo a **2**: três demos limpas valem mais que quatro com uma cambaleando, e a
recorrência continua respondida na tela 11, que é onde ela de fato mora.
