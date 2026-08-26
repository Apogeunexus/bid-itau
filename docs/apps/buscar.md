# Buscar — funcionalidades

**Rota** `/buscar` e `/buscar/frase` · **Componente** `src/componentes/buscar.tsx` (1.270 linhas) ·
**Dados** `src/dados/indice.ts` · **Inventário** [telas.md](../telas.md) telas 16, 17, 18 e 28 ·
**Camada de corte** C1

**Acervo hoje:** 5.092 entidades de 15 classes num índice único. 33 linguagens nas facetas.

## O que este app é

**Busca como recurso, não como protagonista.** Quem chega aqui já tentou Descobrir e não
achou o caminho; a tela não disputa com o feed, ela atende quem tem um nome na cabeça.

## Funcionalidades

| # | Funcionalidade | MVP | Estado |
|---|---|---|---|
| 78 | Busca unificada sobre o grafo — agenda, acervo, editorial e verbetes num só índice | ★ | **no ar** — 5.092 entidades, 15 classes, tipo etiquetado em texto visível |
| 79 | Busca em linguagem natural traduzida em consulta estruturada e explicada | ★ | **no ar** — `/buscar/frase`, `busca-frase.tsx` |
| 80 | Facetas derivadas da ontologia | ★ | **no ar** — 33 linguagens, classes, procedências, territórios |
| 81 | Zero-resultado vira descoberta, não beco sem saída | ★ | **no ar** — `sem-resultado.tsx` |
| 84 | Similaridade sempre com justificativa legível | ★ | **no ar** — herdado do motor de caminhada |

## As duas provas que esta tela carrega

**Índice único misturando tipos.** Um campo só, sobre 5.092 entidades de 15 classes. O
resultado traz evento ao lado de verbete, artista ao lado de vídeo, e cada um com o tipo
**etiquetado em texto visível** — não só em atributo. Uma busca que devolvesse apenas eventos
transformaria a proposta numa agenda.

**Sem biblioteca de busca.** A consulta é filtro linear em memória sobre o DTO colunar que
chegou por props. Nenhuma chamada de rede, nenhum serviço por trás — e a tela **diz isso em
texto de produto**. A afirmação de que não há caixa preta é argumento da proposta, não
anotação sobre ela.

**Zero-resultado nunca é beco.** Quando não há resultado, a tela lista qual critério soltar e
**quantos resultados aquilo traria**, em um toque. O site de hoje tem duas rotas de beco sem
saída; este bloco é o argumento de que elas não deveriam existir.

## O que mudou em 2026-08-25

As contagens saíram dos chips de seção e o subtítulo saiu do cabeçalho. *(Alteração feita
fora desta sessão de trabalho — registrada aqui para o documento não contradizer a tela.)*

## O que falta construir

1. **Busca por voz** — não está no catálogo de 86 e é a lacuna mais visível para escala
   nacional e baixa alfabetização digital.
2. **Histórico de busca por pessoa** — depende do perfil (52).

## Ligações com outros apps

Todos. Buscar é a segunda porta, e cada resultado é uma saída para o app da entidade.
