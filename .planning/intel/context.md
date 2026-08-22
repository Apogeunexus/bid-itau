# Context

Notas de contexto por tópico, com atribuição de fonte. Conteúdo narrativo e de evidência
que não é requisito nem restrição executável.

---

## Topic: RFP e critério de avaliação
- source: docs/PRD.md §1
- O Itaú Cultural abriu a etapa final de seleção de um parceiro de produto e tecnologia para construir "a principal infraestrutura digital para descoberta da cultura brasileira".
- Critério explícito do RFP: **mais importante do que responder corretamente é demonstrar como a equipe pensa** — síntese, clareza, pensamento sistêmico, visão de longo prazo, decisões fundamentadas e trade-offs conscientes.
- O PRD é a resposta de produto e nasce da varredura técnica documentada em `dados/inventario/mapa-conteudo.md`.

## Topic: Visão do produto
- source: docs/PRD.md §2
- "Uma infraestrutura que transforma o acervo cultural brasileiro em um grafo de sentido — e usa esse grafo para levar cada pessoa a uma experiência cultural que ela não sabia que procurava."
- Exemplo da fonte: saber que *Vidas Secas* é livro do Graciliano, que a montagem de 2026 é uma leitura dele, que ela acontece num prédio da Lina Bo Bardi, e que quem gosta de rap está a três passos do teatro documentário.
- O produto é nacional, aberto e sobre a cultura brasileira — não sobre a instituição. A Enciclopédia, o acervo, o IC Play e 14 anos de editorial são a camada de autoridade que nenhum concorrente replica.

## Topic: Método da varredura
- source: dados/inventario/mapa-conteudo.md §1
- Data da coleta: 21/08/2026. Fonte: conteúdo público de `www.itaucultural.org.br`.
- O site é aplicação Next.js; cada página carrega dados de `/_next/data/<buildId>/<rota>.json`. A coleta usou esse endpoint com pausa de 250 ms.
- Resultados: `robots.txt` e `sitemap.xml` → 138 URLs declaradas · seções principais → 26 coletadas, 7 falhas · subcategorias → 43 · matérias individuais → 53 · **entidades únicas normalizadas 2.534** · **pessoas cadastradas 152**.
- Scripts `dados/coletar.py` e `dados/normalizar.py`, ambos idempotentes e re-executáveis para atualizar a base.

## Topic: Quatro conclusões que governam o PRD
- source: docs/PRD.md §3
- **O ativo é maior do que parece.** 14 anos de acervo (2013–2026), exposições catalogadas desde 2012, 123 tags com uso disciplinado, 8 dimensões de acessibilidade modeladas, vocabulário controlado de 29 linguagens do Rumos. Ontologia pronta, feita pela casa.
- **A estrutura é o gargalo.** Notícia, coluna, vídeo, curso, exposição e evento são o mesmo objeto no CMS. Tudo é página.
- **Quatro entidades faltam ao site — e são exatamente as quatro que o RFP exige** — Artista (quebra recomendação, conexão, Enciclopédia), Ocorrência (quebra agenda, alerta de mudança, sessão), Território (quebra mapa e indicadores territoriais), Pessoa-usuária (quebra repertório, recorrência, impacto). A lacuna é do CMS do site; três das quatro existem na Enciclopédia — ver o tópico seguinte.
- **A consolidação já começou pela infra.** Falta consolidar o modelo de dados.

## Topic: A descoberta que reformula a tese (PRD §3.1)
- source: docs/PRD.md §3.1; amostra verificada em dados/amostra/enciclopedia.jsonl
- Três das quatro entidades "ausentes" já existem, estruturadas, na Enciclopédia Itaú Cultural — aplicação Rails separada cujas rotas são a ontologia inteira: `/pessoas/` `/obras/` `/grupos/` `/instituicoes/` `/eventos/` `/termos/`.
- Mais de 100 mil registros, tesauro de 481 termos, e hierarquia territorial completa em cada registro de listagem.
- **A tese mudou, e para melhor.** Não é mais "falta um grafo cultural". O Itaú Cultural já tem um, mantido há décadas por equipe editorial própria. O que ele não tem é conexão entre o grafo e a agenda: "A Enciclopédia sabe quem é o artista, mas não sabe que ele se apresenta sábado; o site sabe do evento de sábado, mas não sabe quem é o artista. São dois sistemas que não se falam."
- **O produto é precisamente essa ponte** — e o fato de as duas metades já existirem é o que torna a escala nacional viável em prazo real, em vez de aspiração.
- Consequência para o protótipo: os dados mockados deixam de ser majoritariamente autorados. Só Pessoa-usuária, Repertório e as duplicatas do Cenário 3 são inventados; o resto vem de acervo real com procedência `ic` ou `derivado`.
- Nota de proveniência: `dados/inventario/mapa-conteudo.md` **não foi atualizado** com esta descoberta e ainda afirma, na §4, que "um mapa é tecnicamente impossível hoje". Aquela afirmação vale para o CMS do site; foi superada, no nível do ecossistema, por PRD §3.1 (precedência 0).

## Topic: Ativos existentes e fortes
- source: dados/inventario/mapa-conteudo.md §5
- Vocabulário controlado de 29 linguagens artísticas do Rumos, todas presentes no acervo.
- 123 tags distintas em 4.777 usos; só 7% aparecem uma vez — disciplina editorial, não tagueamento caótico.
- Acessibilidade modelada em 8 dimensões: "poucas instituições brasileiras modelam acessibilidade com essa granularidade".
- Profundidade temporal — volume por ano: 2013:84 · 2014:88 · 2015:102 · 2016:177 · 2017:224 · 2018:321 · 2019:1017 · 2020:2377 · 2021:1618 · 2022:1348 · 2023:1177 · 2024:730 · 2025:340 · 2026:624.
- Base editorial viva: 152 pessoas com bio, 23 colunas ativas, 14 podcasts, 4 séries, 49 formações do Observatório, 15 anos de exposições e ocupações.

## Topic: Públicos e personas
- source: docs/PRD.md §5
- **Descobridora** — não sabe o que procura, repertório estreito e curiosidade larga; precisa ser levada, não buscar. Superfície: App — Descobrir.
- **Viajante** — tempo curto em território desconhecido; precisa de roteiro que caiba no tempo dela. Superfície: App — Modo Cidade.
- **Frequentadora** — já tem repertório, quer o próximo passo; precisa de adjacência, não repetição. Superfície: App — Repertório.
- **Produtor / Instituição** — precisa que seu evento seja encontrado; publicar sem fricção e ver alcance. Superfície: Studio (web).
- **Curador / Editor** — responde pela qualidade do que aparece; ferramenta de curadoria com poder de veto. Superfície: Redação (web).
- **Gestão institucional** — precisa provar impacto cultural; indicadores que não sejam pageview. Superfície: Observatório (web).

## Topic: Os cinco cenários do RFP
- source: docs/PRD.md §9
- Todos se resolvem com o mesmo núcleo — é isso que demonstra pensamento sistêmico.
- **1. Maria, 27 anos, nunca foi ao teatro.** Entrada por onde ela já está: `rap` → `poesia falada` → `teatro documentário` → montagem gratuita a 4 km, sábado. Três arestas; o app mostra o caminho, não só o resultado. Mecanismo: adjacência de repertório + trilha de primeira vez + explicabilidade.
- **2. Carlos, 4 dias em Belém.** Modo Cidade equilibra densidade cultural e deslocamento, prioriza o que é próprio do território (não a franquia que ele já tem em casa) e mistura gratuito e pago. Mecanismo: projeção espacial do grafo + roteiro por janela.
- **3. Instituição publica milhares de eventos duplicados.** Dedup na ingestão em dois estágios; o que passa do limiar vira fila de revisão no Studio com sugestão de merge. Mil registros colapsam em um evento com N ocorrências. Mecanismo: critério de identidade da ontologia.
- **4. Evento muda de horário duas horas antes.** A alteração atinge uma ocorrência, não o evento. Quem salvou aquela ocorrência recebe alerta; quem salvou o evento, não. Mecanismo: separação Evento / Ocorrência.
- **5. "Quero algo parecido com a Bienal, gratuito e perto de mim".** Vira `semelhante_a(Bienal)` + `gratuito` + `raio`, com a tradução visível ("busquei arte contemporânea, coletiva, em espaço público, gratuita, até 5 km") e editável em um toque. Não é chatbot: é linguagem natural virando faceta.

## Topic: Métricas e indicadores
- source: docs/PRD.md §11
- **KPIs de produto:** aquisição, ativação (primeiro "salvar"), engajamento, retenção D7/D30, taxa de descoberta (itens acessados sem busca prévia).
- **Indicadores de impacto cultural:** ampliação de repertório (nº de linguagens distintas no `Repertório` ao longo do tempo) · descoberta de novo artista (primeira interação com agente sem histórico prévio) · diversidade de linguagem (entropia da distribuição por usuário e por região) · circulação territorial (eventos fora do bairro de origem) · alcance da gratuidade (proporção gratuito × pago efetivamente consumido).
- **Indicadores territoriais e institucionais:** distribuição geográfica da oferta, oferta por linguagem, desertos culturais, participação de instituições, razão gratuito × pago.
- **Dashboards por público:** editorial, produto, parceiro, institucional.

## Topic: Roadmap de produto (fases posteriores ao protótipo)
- source: docs/PRD.md §12
- **MVP** — grafo mínimo (agente, evento, ocorrência, linguagem, território) · ingestão do acervo IC com extração de entidades · app com as 5 abas · Redação · Studio básico. Marco de saída: uma pessoa descobre, salva e vai a um evento que não buscou.
- **Piloto** — uma região · 20–30 instituições parceiras · dedup em produção · indicadores de impacto v1 · alerta de ocorrência. Marco: produtores publicam sozinhos e a duplicata cai abaixo do limiar.
- **Escala nacional** — ingestão federada · curadoria territorial delegada · Modo Cidade · offline · Oportunidades integrado a editais. Marco: cobertura nas capitais e indicadores territoriais publicáveis.
- **Plataforma expandida** — API pública e dados abertos · vertical de educação · Enciclopédia como serviço de autoridade para terceiros. Marco: o grafo vira infraestrutura que outros consomem.

## Topic: Riscos e mitigações
- source: docs/PRD.md §13
- Virar "app institucional" (anti-alvo do RFP) → AI organizada por curiosidade, não por organograma; IC é espinha, não vitrine.
- Oferta nacional insuficiente no início → editais e Rumos como canal de aquisição de produtores já qualificados.
- Curadoria não escala nacionalmente → curadoria territorial delegada + IA que sugere e humano que assina.
- Dedup gerar falso positivo e apagar evento real → dois estágios, limiar conservador, fila de revisão, merge reversível com procedência.
- Excesso de informação matar a descoberta → mapa e busca como lentes, não como home; Enciclopédia embutida, não paralela.
- LGPD no `Repertório` → consentimento granular, anonimização nos indicadores, exportação e exclusão.
- Dívida do acervo (0% de ocorrência, 3% de artista) → extração assistida por IA com revisão humana; o passivo vira o diferencial.

## Topic: Perguntas em aberto para o cliente
- source: docs/PRD.md §15
- 1. Formato e limite da entrega (páginas, apresentação presencial, ferramenta do protótipo).
- 2. Faixa de orçamento esperada para dev e sustentação.
- 3. Acesso a dados internos — Enciclopédia, CollectiveAccess, ResourceSpace — na fase de implementação.
- 4. Existe compromisso institucional de abertura de API, ou é aspiração?
- 5. Quem, do lado do Itaú Cultural, responde pela curadoria no produto?
- Nenhuma destas bloqueia o protótipo: 1 é parcialmente respondida pelas decisões técnicas do próprio §14; 2–5 pertencem à fase de implementação.

## Topic: Ativos de dados disponíveis no repositório
- source: docs/PRD.md (Anexos); dados/inventario/mapa-conteudo.md §1
- `dados/inventario/mapa-conteudo.md` — varredura completa.
- `dados/normalizado/` — 2.534 entidades no formato do grafo.
- `dados/taxonomia/` — vocabulário de linguagens e temas.
- `dados/inventario/lacunas.json` — lacunas quantificadas.
- `referencias/` — RFP e manuais de marca.
- `dados/amostra/enciclopedia.jsonl` — 1.766 registros da Enciclopédia (481 termo, 423 pessoa, 246 instituicao, 239 obra, 217 grupo, 160 evento), com linguagem e hierarquia territorial saneada (947 locais válidos, 113 espaços distintos, 807 entidades com território). **Base principal do mock.**
- `dados/coletar_enciclopedia.py` e `dados/sanear.py` — coleta e saneamento territorial, ambos idempotentes. `sanear.py` reprocessa o que já está em disco sem re-rastrear.
- `dados/bruto/enciclopedia/itens.jsonl` — crawl completo em andamento (~51 mil registros e crescendo). Não é a base do protótipo; ver a ressalva operacional em `CONF-crawler-desatualizado`.
- `dados/coletar.py` e `dados/normalizar.py` — scripts idempotentes de coleta e normalização.

## Topic: Conclusão da varredura para a proposta
- source: dados/inventario/mapa-conteudo.md §7
- "O Itaú Cultural não precisa de um site novo. Ele tem um acervo de valor raro — 2.534 entidades, 14 anos de curadoria, vocabulário próprio, acessibilidade modelada — guardado num CMS que trata tudo como página de texto."
- "A proposta não é migrar conteúdo. É dar estrutura ao que já existe: transformar prosa em entidades, intervalo em ocorrência, tag em conceito, leitor em repertório."

## Topic: Contexto operacional deste ingest
- source: prompt de orquestração do `/gsd-ingest-docs` (não é conteúdo dos documentos)
- Entrega em disputa competitiva: resposta ao Request for Final Proposal da Fundação Itaú / Itaú Cultural.
- Prazo informado: 3 dias, contra 36 telas — ordem de corte em três camadas definida em PRD §14.
- Escopo confirmado: protótipo de front-end navegável em duas visões (web e mobile), Next.js + TypeScript + Tailwind, dados mockados no formato de grafo de conhecimento.
- Idioma de trabalho da equipe: português brasileiro.
