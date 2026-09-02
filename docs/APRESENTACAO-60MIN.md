# Apresentação de 60 minutos — Itaú Cultural, segunda fase

Documento de narrativa. Cruza o board do Miro (`uXjVHsCM2Sc=`, 50 itens, lido em
31.08.2026) com o RFP v1.0, o `PRD.md` e o que o protótipo já executa.

---

## 1. O que o Miro já decidiu

O board não é um brainstorm solto: é um roteiro com ordem espacial. Os itens estão em
**bustrofédon** — a linha de cima corre da esquerda para a direita, a de baixo volta da
direita para a esquerda. Reconstruído pelas coordenadas:

**Linha de cima (abertura + público), x de −3317 a +1916**

| # | Item no board | O que carrega |
|---|---|---|
| 1 | Capa · Onde paramos | 30s de reancoragem. Movimento que já existe + infraestrutura de inteligência cultural + horizonte de 10 anos que começa agora |
| 2 | Objetivo do Movimento | «Começar nos 40, mas é a construção dos 50» · plataforma de conexão e fomento · Mapa Vivo que se retroalimenta |
| 3 | Mapa do Ecossistema | O sistema inteiro; começamos por dois agentes, os outros entram em ondas |
| 4 | A tríade base | Quem Experiencia · Quem Oferece · Fundação Itaú |
| 5 | Jornada do Público | *Mostrar a pluralidade de perfis* |
| 6 | Cenários 01–04 | Cada um: intenção do usuário → como a plataforma entrega → quais dados coletamos. **Sem cadastro.** Sticky: «todos os cenários são camada 01» |
| 7 | Camadas de uso 01–03 | Utilitário · Benefícios · Embaixador |

**Linha de baixo (produtor → dados → fechamento), x de +2538 de volta a −3585**

| # | Item no board | O que carrega |
|---|---|---|
| 8 | Jornada do Produtor | *Como eu, produtora, acesso um canal que não tenho hoje?* |
| 9 | 01 Ele entra dizendo quem é | Login desde o início. A negociação explícita: dados estruturados ↔ alcance, público e inteligência de demanda. **Não é painel financeiro — a Fundação não transaciona** |
| 10 | 02 Os dois cenários chatos | Cenários 3 e 4 do RFP. «Ninguém ganha concorrência com o cenário bonito» |
| 11 | *(03 — vazio)* | Buraco no board |
| 12 | 04 O que ele ganha em troca | Painel do produtor + **demanda não atendida**: «existem pessoas procurando o que você faz, a esta distância». Primeira vez que a banca vê os dois lados se alimentando |
| 13 | 05 A mecânica de troca | Benefício exclusivo por alcance. O produtor oferece, a Fundação distribui, sem investimento dele |
| 14 | Camadas de uso com login | 01 Utilitário · 02 Benefícios · **03 «?»** — indefinido |
| 15 | Importância dos dados | Dados NOZ · Dados de Impacto · «Dados...» · cruzamento |
| 16 | Tipos de dado A/B/C | A funcional obrigatório · B comportamental automático · C complementar pedido |
| 17 | Índice de Ativação Cultural | IAC = E+D+R+C, ancorado em Arts Vibrancy, Cultural Vibrancy e IGMC. Stickies: o Itaú já tem seus índices; a plataforma agrega os existentes |
| 18 | Visualização «Admin» | A amarração de tudo e o elo com direcionamentos e plano de ação. Mapa Vivo ilustrativo. Cruzamentos: PIB, IDH, criminalidade |
| 19 | Espiral Movimento | O que permeia todas as decisões + «o produto em 5 anos». Tech em 5 anos / Movimento em 5 anos |
| 20 | Como começar e construir | Etapas: Tech · Inteligência · Novos perfis de público |
| 21 | Investimento + Time | Marcado com «(?)» |
| 22 | Resumo da proposta de valor + Brinquedo | Fechamento. «Brinquedo» sem definição no board |

**A espinha narrativa que sai daí, em uma frase:** *o Itaú Cultural já é um Movimento; a
plataforma é a roda que faz esse Movimento girar sozinho — quem experiencia alimenta quem
oferece, quem oferece alimenta o dado, o dado alimenta a decisão da Fundação, e a decisão
devolve mais oferta.* Tudo no board serve essa roda.

---

## 2. Os cinco buracos do board

São os pontos que precisam de decisão antes de virar slide.

1. **Não existe bloco de arquitetura.** O RFP §6 pede diagrama com Frontend, Backend, CMS,
   APIs, Banco, IA, Analytics, Observabilidade e Segurança. A «Visualização Admin» é
   dashboard, não arquitetura. É o maior risco de reprovação técnica do roteiro atual.
2. **Os «Cenários 01–04» do público não estão mapeados aos cinco do RFP.** O bloco do
   produtor já reivindica os cenários 3 e 4. Sobram os RFP 1 (Maria), 2 (Carlos/Belém) e
   5 (Bienal). Proposta: 01 = Maria · 02 = Carlos · 03 = Bienal · **04 = recorrência**, que
   é a única pergunta de UX do RFP sem dono no board («como criar recorrência?»).
3. **«Camada de uso 03» do produtor está com «?».** Sugestão coerente com o resto do board:
   *Produtor Embaixador* — quem publica com constância e qualidade entra na curadoria
   territorial delegada. Fecha o paralelo com a camada 03 do público e responde «como a
   curadoria escala nacionalmente» (`PRD.md` §13).
4. **«Dados NOZ» e «Dados...» estão incompletos**, e o IAC compete com os índices que o
   próprio Itaú já tem — os dois stickies verdes dizem isso. Decidir: propor o IAC como
   índice novo, ou posicionar a plataforma como agregadora dos índices existentes. As duas
   coisas juntas enfraquecem.
5. **«Brinquedo» é o protótipo ao vivo.** Ele existe: `/roteiro` monta os cinco cenários do
   RFP como percurso clicável (`src/app/(bastidor)/roteiro/page.tsx:1`), e o build tem
   5.476 rotas HTML em `out/`. Precisa virar item de agenda, não surpresa de final.

---

## 3. O roteiro de 60 minutos

**45 minutos de fala, 15 de perguntas.** A banca disse que avalia como a equipe pensa, não
quantidade de conteúdo — o roteiro sacrifica cobertura por profundidade nos dois blocos que
provam pensamento sistêmico (público e produtor rodando ao vivo).

| Bloco | Min | Acumulado | Conteúdo | Fonte |
|---|---|---|---|---|
| **0. Onde paramos** | 3 | 3 | Movimento que já existe · começar nos 40 e construir os 50 · o horizonte de 10 anos que começa agora. Sem reapresentar o que a banca já viu | Miro 1–2 |
| **1. O ecossistema e a tríade** | 3 | 6 | O sistema inteiro no slide, mas **começamos por dois**: quem experiencia e quem oferece. Os outros agentes entram em ondas. Aqui entra a tese: o grafo já existe na Enciclopédia, falta a ponte com a agenda | Miro 3–4 · PRD §3.1 |
| **2. Jornada do público — ao vivo** | 10 | 16 | Os 4 cenários, cada um em 2min30, na estrutura fixa do board: intenção → entrega → dado coletado. Tudo sem cadastro, tudo camada 01. Rodar no protótipo, não em slide | Miro 5–6 · PRD §9 |
| **3. As três camadas de uso** | 3 | 19 | Utilitário → Benefícios → Embaixador. É a resposta a «como criar recorrência» e a «como evitar excesso de informação»: a informação chega por camada, não de uma vez | Miro 7 |
| **4. Jornada do produtor — ao vivo** | 7 | 26 | Ele entra dizendo quem é · os dois cenários chatos (duplicata e mudança de horário) rodando no Studio · o que ele ganha: demanda não atendida · a mecânica de troca. **É aqui que a roda fecha na frente da banca** | Miro 8–13 · PRD §9 |
| **5. Dados e inteligência** | 6 | 32 | A/B/C de coleta · onde a IA entra e, explicitamente, onde não entra · procedência em todo campo · IAC ou agregação dos índices do IC | Miro 15–17 · PRD §10–11 |
| **6. Mapa Vivo e visão Admin** | 4 | 36 | O painel que amarra tudo e vira direcionamento e plano de ação. Cruzamentos com IDH, PIB, criminalidade — os desertos culturais aparecendo no mapa | Miro 18 |
| **7. Arquitetura** | 5 | 41 | **Bloco novo.** Um diagrama de camadas + um de ingestão. Front, Back, CMS, APIs, banco de grafo, IA na ingestão, analytics, observabilidade, segurança e LGPD. Fechar com «como crescemos sem reescrever» | Não existe no Miro · PRD §6, §14 |
| **8. Como se constrói** | 5 | 46 | MVP → Piloto → Escala Nacional → Plataforma Expandida, com o marco de saída de cada um. Time, sustentação, investimento e **o que precisamos da equipe da Fundação** | Miro 20–21 · PRD §12 |
| **9. Espiral e fechamento** | 2 | 48 | O produto em 5 anos, e o Movimento em 5 anos. Resumo da proposta de valor | Miro 19, 22 |
| **10. Perguntas** | 12 | 60 | Protótipo aberto na tela durante as perguntas | — |

Sobram 3 minutos de folga contra atraso de demo. Se o tempo apertar em cima da hora, o
bloco 3 (camadas de uso) vira uma frase dentro do bloco 2 — nunca corte o 4 nem o 7.

---

## 4. Onde cada pergunta do RFP é respondida

O RFP §8 tem 20 perguntas. Nenhuma pode ficar órfã.

| Pergunta do RFP | Bloco |
|---|---|
| Quais problemas fundamentais resolve | 1 |
| O que não pertence ao MVP | 8 |
| O produto em cinco anos | 9 |
| Princípios que orientam decisões | 0 e 5 |
| Em que ambientes e dispositivos performa | 7 |
| Como estimular descoberta e engajamento | 2 |
| Equilibrar mapa, busca, filtros, recomendação e curadoria | 2 |
| Como evitar excesso de informação | 3 |
| Como criar recorrência | 3 |
| Crescer sem reescrever | 7 |
| Modelar pessoas, artistas, instituições, eventos, espaços, territórios | 7 |
| Como evitar duplicidades | 4 |
| Como preparar APIs futuras | 7 e 8 |
| Onde a IA gera valor · raspagem · onde não usar · transparência · feedback humano | 5 |
| Como garantir qualidade de dados · evoluir o modelo · abrir APIs | 5 e 7 |
| Cronograma, custos, time, o que precisam da Fundação | 8 |

---

## 5. O que decidir antes de montar slide

1. Mapeamento dos cenários 01–04 do público aos cinco do RFP.
2. Camada de uso 03 do produtor.
3. IAC próprio ou agregação dos índices do Itaú.
4. Quem apresenta cada bloco e quem opera o protótipo — a demo ao vivo dos blocos 2 e 4
   precisa de duas pessoas: uma fala, outra clica.
5. Faixa de investimento a declarar no bloco 8 (`PRD.md` §15, pergunta 2, ainda aberta).
