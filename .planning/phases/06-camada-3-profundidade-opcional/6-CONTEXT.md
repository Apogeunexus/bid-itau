# Phase 6: Camada 3 — Profundidade opcional - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Mode:** `--auto` — áreas cinzentas resolvidas pela opção recomendada.

<domain>
## Phase Boundary

As 8 telas da Camada 3: Onboarding 2 e 3 · Página da obra · Mapa de repertório (mobile) ·
Studio publicar · Perfil · Página do artista · Página do produtor (web).

Requisitos: CAM3-01 a CAM3-07.

**Esta é a última fase, e a que o roadmap marcou como primeira a cair.** A demonstração já
existe inteira desde a fase 4; nada aqui é pré-requisito de nada. Se algo quebrar, a saída
correta é descartar a tela, não consertar às pressas.

**A prova da fase:** as 37 telas do inventário existem.
</domain>

<decisions>
## Implementation Decisions

### Duas telas carregam argumento; seis são completude

`[auto] Prioridade — Q: "todas iguais ou priorizar?" → Selected: "priorizar por argumento"
(recomendado)`

- **D-94:** A ordem de construção segue o valor de argumento, não a numeração:
  **Página da obra** e **Studio publicar** primeiro, porque cada uma fecha uma lacuna que o
  PRD abre e nenhuma tela atual preenche. Depois o Onboarding 2 e 3 e o Mapa de repertório.
  As três web por último — são as de menor retorno, porque as mobile já existem e o
  alternador já demonstra as duas visões em outras telas.
- **D-95:** Se algo falhar, **descartar a tela é a resposta certa**. Uma tela da Camada 3
  quebrada custa mais que a ausência dela.

### Página da obra — a única tela da Camada 2 da ontologia

- **D-96:** É a única tela que materializa `Obra → Expressão → Manifestação → Item`. O PRD
  usa essa cadeia como argumento — *"você viu esta leitura; existe aquela outra da mesma
  obra"* — e hoje ela não tem superfície. Precisa de **exemplo real do acervo**, com a
  cadeia percorrível.
- **D-97:** Onde o acervo não sustenta um nível da cadeia, a tela **declara qual nível
  falta e com que denominador**, como as demais. As 239 obras da Enciclopédia trazem
  autoria, ano e técnica no campo `detalhe`; verificar antes de prometer expressão e
  manifestação.

### Studio publicar — fecha o arco do Cenário 2

- **D-98:** O Modo Cidade afirma que programação futura entra *"quando os produtores
  publicarem no Studio"*. **Esta é a tela onde isso acontece** — e é o que transforma
  aquela frase de promessa em demonstração.
- **D-99:** Formulário guiado com **validação em tempo real** e **score de qualidade
  subindo conforme se preenche**, apontando o que falta. Aviso de possível duplicata antes
  de salvar, usando o mesmo critério de identidade da tela de duplicatas — não uma
  heurística nova.
- **D-100:** Exige descrição alternativa de imagem. É coerente com a acessibilidade como
  critério de primeira classe, e com o fato de 21% do acervo não ter alt-text.

### Onboarding 2 e 3

- **D-101:** As duas telas restantes do onboarding por disposição, que a decisão de login
  obrigatório tornou caminho obrigatório. Reaproveitam o motor de disposição da fase 2 —
  nada de motor novo.

### Mapa de repertório

- **D-102:** O que a persona atravessou e o que fica adjacente, **em forma de mapa** e não
  de lista — é a diferença em relação a `/meu`, que já mostra os mesmos dados em texto.
  Reaproveita a projeção SVG da fase 3; sem biblioteca, sem rede.

### As três telas web

- **D-103:** Perfil, Página do artista e Página do produtor na visão web seguem D-79 e
  D-80: mesmo componente, divergência por densidade e simultaneidade. Nenhum arquivo irmão.

### Claude's Discretion

Layout das três web, forma do mapa de repertório, e a composição do formulário do Studio.
</decisions>

<specifics>
## Specific Ideas

- A Página da obra é a chance de mostrar a ontologia funcionando num eixo que nenhuma
  outra tela cobre. Se o acervo só sustentar dois dos quatro níveis, mostrar dois e
  declarar os outros dois vale mais que fingir quatro.
- O score de qualidade do Studio publicar deve subir visivelmente enquanto se digita. É o
  detalhe que faz a tela parecer produto.
</specifics>

<canonical_refs>
## Canonical References

- `docs/telas.md` — telas 3, 4, 15, 22, 29, 30, 33
- `docs/PRD.md` §6 Camada 2 (Obra → Expressão), §9 Cenário 2
- Os SUMMARYs das fases 3, 4 e 5 — API real, correções de portão, contratos `data-*`
- `src/dados/grafo.ts`, `duplicatas.ts`, `geo.ts`, `disposicoes.ts`
</canonical_refs>

<riscos_herdados>
## Riscos herdados

- **`src/componentes/desertos.tsx` tem um defeito de uma linha**: dá ao `<title>` uma lista
  de filhos, e o React 19 exige string única — o servidor emite `<title>` vazio e a camada
  perde a hidratação. Registrado em `deferred-items.md` desde a fase 5. **Conserto de uma
  linha; esta fase pode fazê-lo.**
- **8 slugs de mídia carregam caracteres fora de `[a-z0-9-]`** — corrigido na resolução da
  rota, mas o defeito de origem continua no gerador.
- Qualquer verbo de escrita de estado do GSD zera o `percent` do STATE.md. Seis ocorrências.
  Editar à mão e conferir.
- **O projeto saiu do iCloud** e agora vive em `~/Projetos/Noz`, com `~/Desktop/Noz` como
  link. O risco de despejo acabou. Espelho em `~/Projetos/Noz-espelho.git`, remote `espelho`.
</riscos_herdados>
