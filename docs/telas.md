# Inventário de telas — Agenda Cultural BR

37 telas · 5 superfícies · duas visões (mobile e web)

Documento de apoio ao [PRD](PRD.md). Cada tela declara objetivo, conteúdo, fonte de dados
e o que ela prova diante da banca.

**Camadas de corte** (PRD §14): **C1** intocável · **C2** a proposta fica pobre sem ·
**C3** primeira a cair.

**Decisão de acesso:** não há estado anônimo. Toda tela pressupõe alguém logado.

---

# Superfície 1 — App (visão mobile) · 24 telas

## 1. Entrada — cadastro e login · C1

**Objetivo:** ser a primeira parte da experiência, não um pedágio antes dela.

**Conteúdo:** marca do Itaú Cultural sobre imagem do acervo · uma frase de proposta
("descubra a cultura brasileira pelo que te move") · entrada por e-mail · login social ·
consentimento LGPD com escopo explícito e legível · link para política.

**Dados:** 3 personas pré-cadastradas para a demonstração — Maria, Carlos e uma
frequentadora.

**Prova:** identidade única no ecossistema (funcionalidade 50) e LGPD (57).

## 2. Onboarding 1 — disposição · C1

**Objetivo:** capturar intenção, não gosto declarado.

**Conteúdo:** a pergunta "o que te move hoje?" · cartões grandes de disposição — *quero
ser surpreendida* · *tenho pouco tempo* · *vou com criança* · *quero algo de graça* ·
*quero conhecer algo que nunca vi* · seleção múltipla, sem obrigatoriedade · avançar
sempre disponível.

**Dados:** vocabulário de disposição, autorado.

**Prova:** funcionalidades 2 e 51. É a diferença entre onboarding por formulário e
onboarding por intenção.

## 3. Onboarding 2 — território e alcance · C1

**Objetivo:** saber de onde a pessoa parte, sem pedir endereço.

**Conteúdo:** cidade atual com detecção e correção manual · raio de deslocamento em
tempo, não em quilômetros ("até 30 min") · alternador "estou de viagem" que abre campo de
destino e período — **é por aqui que o Cenário 2 entra**.

**Dados:** territórios da Enciclopédia · centroides de município.

**Prova:** funcionalidades 22 e 24; abre o Modo Cidade.

## 4. Onboarding 3 — acessibilidade · C1

**Objetivo:** tratar acessibilidade como filtro de primeira classe, não como selo.

**Conteúdo:** as 8 dimensões que o IC já modela — audiodescrição, libras, legenda
descritiva, closed caption, legenda aberta, tradução simultânea, estenotipia, legenda ·
seleção múltipla · aviso de que a escolha vale para o app inteiro e pode mudar depois.

**Dados:** flags de acessibilidade reais do CMS.

**Prova:** funcionalidade 55 e o princípio 10. Poucas instituições brasileiras modelam
acessibilidade com essa granularidade — mostrar isso é vantagem.

## 5. Descobrir · C1

**Objetivo:** a tela mais importante do produto. Levar, não fazer buscar.

**Conteúdo:** saudação com a disposição escolhida, editável em um toque · fluxo vertical
de cartões heterogêneos — evento, obra, artista, vídeo, trilha curada — nunca uma lista
só de eventos · cada cartão traz um **selo de motivo** ("porque você marcou pouco tempo",
"da mesma companhia que você viu") · um bloco de destaque curado, visualmente distinto,
com assinatura de quem curou · um cartão de serendipidade, marcado como tal.

**Dados:** grafo mockado · caminhada por adjacência · trilhas curadas.

**Prova:** funcionalidades 1, 2, 5, 6, 7. **É a tela que separa a proposta de uma agenda.**

## 6. Por que isto apareceu · C1

**Objetivo:** tornar a recomendação auditável em linguagem comum.

**Conteúdo:** o item no topo · o caminho percorrido no grafo, desenhado como passos
legíveis (*você ouve rap → poesia falada → teatro documentário*) · os critérios que
pesaram, cada um removível · botões "quero mais assim" e "não é para mim" · nota de que
nenhuma decisão editorial foi tomada por IA.

**Dados:** arestas do grafo com motivo escrito no dado.

**Prova:** funcionalidades 6 e 84, princípios 3 e 8. **Responde à pergunta do RFP sobre
transparência da IA.**

## 7. Trilha de primeira vez · C1

**Objetivo:** conduzir quem nunca experimentou uma linguagem.

**Conteúdo:** título da trilha e a linguagem de destino · a ponte explicitada ("do rap ao
teatro documentário, em 3 passos") · passos numerados, cada um com um item concreto e o
motivo de estar ali · o passo final é um evento real, com data e lugar · assinatura do
curador · opção de salvar a trilha inteira.

**Dados:** trilhas autoradas sobre entidades reais da Enciclopédia.

**Prova:** funcionalidade 3. **É a resposta direta ao Cenário 1 — a Maria.**

## 8. Acontece · C1

**Objetivo:** a agenda, mas organizada por evento e não por sessão solta.

**Conteúdo:** faixa de datas horizontal · lista de **eventos**, cada um mostrando quantas
ocorrências tem ("6 sessões · a próxima sábado, 20h") · selo de gratuidade · ícones de
acessibilidade · distância em tempo · atalho para o mapa · atalho para filtros.

**Dados:** 160 eventos da Enciclopédia com data + 100 do CMS · ocorrências derivadas.

**Prova:** funcionalidades 9, 10, 17. **Torna visível a separação Evento/Ocorrência, que
é a decisão de modelagem central da proposta.**

## 9. Filtros · C2

**Objetivo:** facetas que vêm da ontologia, não de campos de formulário.

**Conteúdo:** linguagem, a partir do vocabulário controlado de 29 termos · gratuito ou
pago · as 8 dimensões de acessibilidade · faixa etária · território por bairro, cidade e
região · período · contador de resultados ao vivo · limpar tudo.

**Dados:** taxonomia real do Rumos e da Enciclopédia.

**Prova:** funcionalidades 11 e 80.

## 10. Mapa · C1

**Objetivo:** mapa como lente sobre um resultado, jamais como página inicial.

**Conteúdo:** pinos agrupados por densidade · cartão inferior arrastável com o item
selecionado · alternador lista/mapa preservando o mesmo conjunto · camada opcional de
**desertos culturais** — onde não há oferta · legenda de procedência das coordenadas,
marcadas como derivadas.

**Dados:** 947 locais saneados · 113 espaços distintos · coordenadas derivadas de
centroide.

**Prova:** funcionalidades 19, 23 e o princípio 9. A marcação de procedência transforma a
limitação do protótipo em demonstração de honestidade de dado.

## 11. Modo Cidade · C1

**Objetivo:** planejar estadia curta em território desconhecido.

**Conteúdo:** cidade e janela de datas no topo · um cartão por dia · dentro de cada dia,
2 ou 3 itens com deslocamento estimado entre eles · equilíbrio explícito entre densidade
e distância · marcação do que é **próprio daquele território** e não existe em outro
lugar · alternar item sem refazer o roteiro · exportar.

**Dados:** 31 entidades do Pará · instituições e eventos de Belém.

**Prova:** funcionalidades 20 e 21. **É a resposta ao Cenário 2 — o Carlos.**

## 12. Página do evento · C1

**Objetivo:** a entidade única, com suas ocorrências abaixo.

**Conteúdo:** imagem e título · linguagens como etiquetas navegáveis · resumo · **lista de
ocorrências** com data, hora, espaço e preço, cada uma salvável separadamente · ficha de
acessibilidade da sessão e do espaço · quem realiza, com link para o agente · bloco
"aprofunda isto" com verbete, matéria e vídeo relacionados · bloco "se não puder ir" com
conteúdo do Play.

**Dados:** eventos reais · ocorrências derivadas · relações com Enciclopédia e editorial.

**Prova:** funcionalidades 9, 10, 15, 28, 40. **Materializa a ponte entre a agenda e o
acervo — a tese da proposta.**

## 13. Seleção de ocorrência · C1

**Objetivo:** deixar claro que se salva a sessão, não o evento.

**Conteúdo:** ocorrências agrupadas por dia · espaço e sala quando houver · preço e
gratuidade · esgotado · acessibilidade por sessão, que pode variar · confirmação
explicitando que o alerta vale só para aquela ocorrência.

**Dados:** ocorrências derivadas do período real.

**Prova:** funcionalidades 12 e 13. **Prepara o Cenário 4.**

## 14. Página do artista · C1

**Objetivo:** trazer a Enciclopédia para dentro do fluxo.

**Conteúdo:** nome, imagem e **papéis** — a mesma pessoa aparece como artista aqui e
curadora ali · linguagens · território de origem e de atuação · verbete da Enciclopédia
embutido, com crédito e link para a fonte · obras · eventos em cartaz · com quem dialoga
no grafo · conteúdo editorial que fala sobre.

**Dados:** 423 pessoas e 217 grupos da Enciclopédia.

**Prova:** funcionalidades 31, 34, 37 e a decisão de papel como papel. **Prova concreta de
que a ponte com a Enciclopédia funciona.**

## 15. Página da obra · C3

**Objetivo:** mostrar que existem várias leituras da mesma obra.

**Conteúdo:** título, autoria, ano, técnica · onde está o acervo · expressões e montagens
derivadas · eventos que a apresentam · verbete.

**Dados:** 239 obras da Enciclopédia, com o campo `detalhe` preservado no saneamento.

**Prova:** funcionalidade 32 e a Camada 2 da ontologia (Obra → Expressão → Manifestação).

## 16. Buscar · C1

**Objetivo:** busca como recurso, não como protagonista.

**Conteúdo:** campo único · sugestões de disposição antes de digitar · buscas recentes ·
atalhos por linguagem · resultados **misturando tipos** — evento, artista, obra, verbete,
vídeo — com o tipo etiquetado · facetas laterais.

**Dados:** índice único sobre o grafo.

**Prova:** funcionalidades 78 e 80.

## 17. Busca em linguagem natural · C1

**Objetivo:** linguagem natural virando consulta estruturada e visível.

**Conteúdo:** a frase da pessoa no topo · **a tradução mostrada e editável** — *arte
contemporânea · coletiva · espaço público · gratuita · até 5 km* — cada critério removível
· resultados abaixo · explicação de por que cada resultado casa · aviso de que não é um
chatbot: é uma consulta que você controla.

**Dados:** relação `semelhante_a` com justificativa escrita no dado.

**Prova:** funcionalidades 79 e 84. **É a resposta ao Cenário 5 — a Bienal.**

## 18. Zero-resultado vira descoberta · C2

**Objetivo:** transformar o beco sem saída em oportunidade curatorial.

**Conteúdo:** o que foi buscado e por que não achou · qual critério afrouxar, com o número
de resultados que cada afrouxamento traria · o que existe **perto disso** no grafo · uma
trilha curada relacionada · nunca uma tela vazia.

**Dados:** o mesmo grafo, consultado por adjacência.

**Prova:** funcionalidade 81. Hoje o site tem duas rotas de beco sem saída; aqui elas
deixam de existir.

## 19. Play · C2

**Objetivo:** descoberta gratuita que não exige sair de casa.

**Conteúdo:** catálogo unificado — vídeo, podcast, série, playlist, exposição virtual ·
filtro por legenda, libras e audiodescrição · continue de onde parou · bloco "conectado ao
que você salvou".

**Dados:** 529 mídias reais do IC Play e do acervo.

**Prova:** funcionalidades 25, 26, 29. Sustenta o princípio da gratuidade e a escala
nacional onde não há equipamento cultural.

## 20. Player · C2

**Objetivo:** o consumo em si, com acessibilidade visível.

**Conteúdo:** vídeo ou áudio · controles de legenda, libras e audiodescrição em evidência
· descrição e crédito · o que aprofunda aquilo · registra no repertório ao concluir.

**Dados:** mídias reais com flags de acessibilidade.

**Prova:** funcionalidades 26 e 29.

## 21. Meu Repertório · C1

**Objetivo:** o perfil como mapa do que a pessoa atravessou, não como configurações.

**Conteúdo:** as linguagens já experimentadas, com peso visual · o que está **adjacente e
ainda não foi** · salvos · histórico de "eu fui" · trilhas próprias · atalho para
preferências de acessibilidade · privacidade com exportar e excluir.

**Dados:** repertório autorado das 3 personas.

**Prova:** funcionalidades 50, 52, 53, 55, 57. **É de onde sai o indicador de ampliação de
repertório — a métrica de impacto cultural do RFP.**

## 22. Mapa de repertório · C3

**Objetivo:** tornar visível o alargamento do repertório ao longo do tempo.

**Conteúdo:** diagrama das linguagens atravessadas, por período · o que entrou de novo ·
sugestão do próximo passo adjacente · comparação opcional com a média da cidade.

**Dados:** repertório autorado com histórico.

**Prova:** funcionalidade 53 e o indicador de impacto cultural.

## 23. Salvos e alertas · C1

**Objetivo:** a fila pessoal e o lugar onde a mudança de horário aparece.

**Conteúdo:** próximas ocorrências salvas, em ordem cronológica · **alerta destacado de
alteração**, mostrando o que mudou, quando e quem informou · confirmação de que só quem
salvou aquela ocorrência foi avisado · eventos salvos sem sessão escolhida · trilhas
salvas.

**Dados:** ocorrências derivadas · um evento com alteração encenada.

**Prova:** funcionalidade 13. **É a resposta ao Cenário 4.**

## 24. Página do produtor ou instituição · C2

**Objetivo:** o agente como entidade viva no grafo, não como página institucional.

**Conteúdo:** nome, imagem, selo de verificação · território e espaço · o que está em
cartaz agora · histórico · quem são as pessoas ligadas · linguagens em que atua ·
conteúdo editorial que fala sobre · seguir.

**Dados:** 246 instituições da Enciclopédia com território real.

**Prova:** funcionalidade 58 e o fluxo obrigatório "página do produtor/instituição".

---

# Superfície 2 — App (visão web) · 6 telas

Mesmas entidades, mesmos dados, densidade maior. O alternador entre as duas visões fica
visível na apresentação.

## 25. Descobrir — web · C2
Grade de várias colunas em vez de fluxo vertical · destaque curado ocupando largura maior
· selo de motivo sempre visível, sem precisar de toque.

## 26. Acontece com mapa lado a lado · C2
Lista à esquerda e mapa à direita, sincronizados · passar o cursor num item destaca o pino
· filtros como coluna permanente, não como tela separada.

## 27. Página do evento — web · C2
Ocorrências em tabela · acessibilidade em coluna · "aprofunda isto" como painel lateral em
vez de bloco inferior.

## 28. Buscar — web · C2
Facetas permanentes à esquerda · resultados em grade com tipo etiquetado · tradução da
busca em linguagem natural sempre visível.

## 29. Página do artista — web · C3
Verbete em coluna de leitura · obras e eventos em grade lateral · linha do tempo
horizontal.

## 30. Meu Repertório — web · C3
Mapa de repertório como visualização principal, aproveitando a tela grande.

---

# Superfície 3 — Studio (produtor e instituição) · 3 telas · web

## 31. Studio — resolução de duplicatas · C1

**Objetivo:** mostrar o critério de identidade da ontologia funcionando.

**Conteúdo:** fila de grupos suspeitos · lado a lado dos registros, com os campos
divergentes destacados · o **critério que disparou a suspeita**, escrito ("mesmo título
normalizado, mesmo agente, mesma obra") · o estágio que pegou — chave determinística ou
casamento probabilístico — com o score · ações: fundir, manter separados, adiar · aviso de
que a fusão é reversível e preserva procedência.

**Dados:** ~40 duplicatas clonadas de eventos reais com variação controlada.

**Prova:** funcionalidades 61, 83 e o critério de identidade. **É a resposta ao Cenário 3
— e a tela que melhor demonstra que a ontologia não é enfeite.**

## 32. Studio — gestão de ocorrências · C1

**Objetivo:** mostrar que alterar uma sessão não invalida o evento.

**Conteúdo:** o evento no topo, imutável · suas ocorrências em tabela editável · alterar
horário de uma delas · **prévia do impacto** antes de confirmar: quantas pessoas salvaram
aquela ocorrência e serão avisadas · registro de quem alterou e quando · histórico de
alterações.

**Dados:** ocorrências derivadas · contagem de salvamentos das personas.

**Prova:** funcionalidades 60 e 13. **É a outra metade do Cenário 4** — o lado de quem
causa a mudança.

## 33. Studio — publicar evento · C3

**Objetivo:** o cadastro com validação e devolutiva de qualidade.

**Conteúdo:** formulário guiado — evento, temporada, ocorrências · validação em tempo real
· **score de qualidade** subindo conforme se preenche, apontando o que falta · aviso de
possível duplicata **antes** de salvar · exigência de descrição alternativa de imagem.

**Dados:** schema real do CMS mais os campos que faltam.

**Prova:** funcionalidades 59 e 64.

---

# Superfície 4 — Redação (curador e editor) · 2 telas · web

## 34. Redação — fila de moderação · C2

**Objetivo:** a curadoria humana com poder real, incluindo veto.

**Conteúdo:** fila com origem de cada item — produtor, ingestão automática, sugestão de IA
· itens de IA marcados com **score de confiança** · aprovar, editar, vetar, devolver ·
veto exige motivo · registro de autoria em toda decisão · escopo do curador visível no
topo: nacional, territorial ou por linguagem.

**Dados:** fila encenada com itens das três origens.

**Prova:** funcionalidades 65, 67, 69, 86 e o princípio 3. **Demonstra o limite da IA: ela
sugere, o humano assina.**

## 35. Redação — editor de trilha curada · C2

**Objetivo:** a curadoria como autoria, não como seleção.

**Conteúdo:** montagem da trilha arrastando entidades de qualquer tipo · **campo
obrigatório de motivo por passo** — é o que vira o selo visível para o público · sugestão
da IA de próximo passo, sempre aceitável ou descartável · prévia na visão mobile ·
assinatura do curador · agendamento de publicação.

**Dados:** grafo completo como fonte de arrasto.

**Prova:** funcionalidades 66, 67, 69, 7.

---

# Superfície 5 — Observatório (gestão institucional) · 1 tela · web

## 36. Observatório — indicadores · C2

**Objetivo:** provar impacto cultural com métrica que não é pageview.

**Conteúdo:** **ampliação de repertório** — linguagens distintas por pessoa ao longo do
tempo · descoberta de artista novo · diversidade de linguagem por região · circulação
territorial · gratuito versus pago no que foi efetivamente consumido · **mapa de desertos
culturais** · painel de qualidade e procedência dos dados, mostrando quanto é `ic`,
`derivado` e `autorado` · seletor de público: editorial, produto, parceiro, institucional.

**Dados:** agregados dos dados reais mais o repertório das personas.

**Prova:** funcionalidades 71, 72, 73, 74, 77 e o princípio 9.

---

# Contagem

| Superfície | Telas | C1 | C2 | C3 |
|---|---|---|---|---|
| App — mobile | 24 | 15 | 5 | 4 |
| App — web | 6 | 0 | 4 | 2 |
| Studio | 3 | 2 | 0 | 1 |
| Redação | 2 | 0 | 2 | 0 |
| Observatório | 1 | 0 | 1 | 0 |
| **Total** | **36** | **17** | **12** | **7** |

Mais a tela de entrada (login), que é C1 — **37 telas, 18 na Camada 1**.

# Cobertura dos fluxos obrigatórios do RFP

| Fluxo exigido | Tela |
|---|---|
| Onboarding | 2, 3, 4 |
| Descoberta | 5, 7 |
| Busca | 16, 17, 18 |
| Mapa | 10, 11 |
| Página do evento | 12, 13 |
| Perfil | 21, 22 |
| Recomendações | 5, 6 |
| Área editorial | 34, 35 |
| Página do produtor/instituição | 24, 31, 32 |

# Cobertura dos cinco cenários

| Cenário | Telas que ele atravessa |
|---|---|
| 1 — Maria e o primeiro teatro | 2, 5, 6, 7, 12 |
| 2 — Carlos, 4 dias em Belém | 3, 11, 10, 12 |
| 3 — mil eventos duplicados | 31 |
| 4 — mudança de horário | 32, 23, 13 |
| 5 — parecido com a Bienal | 17, 12, 10 |

---

# Lacuna reconhecida

O bastidor está magro: **6 telas para três personas** — produtor, curador e gestão. O PRD
trata Studio, Redação e Observatório como três produtos separados, e três telas em média
não representam nenhum deles de forma crível.

Um dimensionamento honesto seria Studio com ~11 telas, Redação com ~7 e Observatório com
~8, levando o total de 37 para cerca de 55. Decisão em aberto.
