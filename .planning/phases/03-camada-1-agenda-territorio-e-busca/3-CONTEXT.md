# Phase 3: Camada 1 — Agenda, território e busca - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — áreas cinzentas resolvidas pela opção recomendada.

<domain>
## Phase Boundary

As 7 telas mobile restantes da Camada 1: Acontece · Seleção de ocorrência · Salvos e
alertas · Mapa · Modo Cidade · Buscar · Busca em linguagem natural.

Requisitos: AGEN-01 a AGEN-07.

**A prova da fase:** os Cenários 2, 4 e 5 do RFP andam de ponta a ponta na visão mobile.
Carlos planeja quatro dias em Belém; uma mudança de horário atinge uma ocorrência e avisa
só quem salvou aquela sessão; e "algo parecido com a Bienal, gratuito e perto de mim" vira
consulta estruturada visível e editável.

**Fora do escopo:** Studio (fase 4), toda a visão web e as telas de Camada 2 (fase 5).
</domain>

<decisions>
## Implementation Decisions

### A decisão que estava travando a fase: território e data não se cruzam

Medido na fase 1 e reconfirmado na fase 2: os 100 eventos do CMS têm datas de 2026 e **zero
território**; os 160 eventos da Enciclopédia têm território real e **datas históricas**
(1966, 1978, 2000…). Não existe no acervo um único evento com data futura e lugar. Uma
consulta "Belém nos próximos 4 dias" devolve zero sobre dado real.

`[auto] Cenário 2 — Q: "inventar datas, rotular data derivada, ou mudar o enquadramento?"
→ Selected: "mudar o enquadramento" (recomendado)`

- **D-48:** **Não fabricamos datas.** Nem futuras, nem derivadas com rótulo. Inventar
  programação é a única coisa que destruiria o argumento central da proposta, que é
  procedência honesta. Esta decisão é a mais importante da fase.
- **D-49:** O Modo Cidade responde **"o que existe culturalmente neste território"**, não
  "o que acontece nesta semana". Para o Carlos, que nunca esteve em Belém, essa é a
  pergunta mais útil de qualquer forma — e é a que o acervo consegue responder com
  verdade. A tela declara isso em uma frase, sem pedir desculpa.
- **D-50:** O roteiro por dia continua existindo como estrutura, montado sobre o acervo do
  território: instituições, espaços, obras e artistas daquele lugar, distribuídos pelos N
  dias com equilíbrio de deslocamento. O que muda é a natureza do item — acervo em vez de
  sessão.
- **D-51:** Quando um item **tem** data, ela aparece. Quando não tem, a ausência é dita.
  A mesma regra da fase 2.
- **D-52:** A tela carrega, visível, a frase que explica o enquadramento: o acervo do Itaú
  Cultural documenta o que a cultura brasileira produziu naquele território, e a
  programação futura é o que entra quando produtores publicarem na plataforma. **Isso
  converte a limitação em demonstração do produto**: é exatamente o papel do Studio, que a
  fase 4 constrói.

### Acontece

- **D-53:** A lista é de **eventos**, com a contagem de ocorrências no cartão. Nunca uma
  lista de sessões soltas — é a decisão de modelagem central da proposta, e esta é a tela
  onde ela fica visível.
- **D-54:** Sessões passadas são mostradas como passadas, não escondidas. Todo o acervo é
  passado; esconder esvaziaria a tela e mentiria sobre o que existe.
- **D-55:** A faixa de datas no topo navega o acervo real, não um calendário vazio.

### Ocorrência e alertas

- **D-56:** Salvar é sempre de **ocorrência**, nunca de evento — e a tela diz isso ao
  salvar. É o que faz o Cenário 4 ser compreensível.
- **D-57:** O alerta de alteração mostra o que mudou, quando, quem informou, e a frase que
  fecha o cenário: só quem salvou **aquela** ocorrência foi avisado. A alteração é
  autorada para o protótipo e rotulada como tal.
- **D-58:** Salvos vive em `localStorage` sobre a persona ativa (D-46).

### Mapa

- **D-59:** Mapa é **lente sobre um resultado**, alcançado de Acontece e de Buscar,
  preservando o conjunto. Nunca porta de entrada.
- **D-60:** Sem biblioteca de mapa e sem tile externo — o protótipo é estático e não faz
  chamada de rede. Uma projeção própria em SVG sobre o contorno do Brasil, com os pinos nas
  coordenadas derivadas. Menos bonito que um mapa de verdade, e honesto quanto ao que é.
- **D-61:** A legenda declara que as coordenadas são derivadas de centroide de município.
- **D-62:** A camada de desertos culturais mostra onde o acervo **não** tem registro — e
  essa é a leitura mais forte do mapa, porque expõe a concentração real da documentação
  cultural brasileira.

### Busca

- **D-63:** Índice único sobre o grafo, misturando tipos, com o tipo etiquetado no
  resultado. Sem biblioteca de busca — filtro em memória sobre os campos indexáveis.
- **D-64:** A busca em linguagem natural traduz a frase em **critérios visíveis e
  editáveis**, e cada um pode ser removido com recálculo na hora. A tradução é a resposta,
  não um passo intermediário escondido.
- **D-65:** O casamento de frase é por regra declarada, não por modelo. O protótipo não
  chama IA — ele demonstra a *interface* de uma consulta explicável. A tela diz isso.
- **D-66:** Zero-resultado não existe como beco: sempre oferece qual critério afrouxar e
  quantos resultados aquilo traria.

### Claude's Discretion

Projeção cartográfica do SVG, agrupamento de pinos, e a estratégia de indexação em memória.
</decisions>

<specifics>
## Specific Ideas

- O mapa de desertos culturais é, potencialmente, a imagem mais forte da proposta inteira:
  ele mostra em uma tela que a documentação da cultura brasileira está concentrada no
  Sudeste. Isso não é falha do acervo — é o diagnóstico que justifica a plataforma.
- A frase do Modo Cidade sobre programação futura precisa soar como projeto, não como
  desculpa. É a ponte narrativa para o Studio da fase 4.
</specifics>

<canonical_refs>
## Canonical References

- `docs/telas.md` — telas 8, 10, 11, 13, 16, 17, 23
- `docs/PRD.md` §9 — Cenários 2, 4 e 5
- `.planning/phases/02-*/2-CONTEXT.md` — D-26..D-47, ainda válidas
- `.planning/phases/02-*/02-0{1..5}-SUMMARY.md` — o que já existe e o que foi medido
- `src/dados/grafo.ts` — `porTerritorio` e `ocorrenciasDe` já existem e funcionam
</canonical_refs>

<deferred>
## Deferred

- Filtros como tela própria — Camada 2, fase 5
- Toda a visão web — fase 5
- Expansão do bastidor de 6 para ~26 telas — decisão em aberto do usuário
</deferred>
