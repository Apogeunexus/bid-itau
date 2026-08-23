/**
 * disposicoes.ts — o vocabulário autorado de disposição (DESC-01, D-31).
 *
 * Os cinco rótulos são exatamente os de `docs/telas.md`, tela 2. Nada aqui vem do acervo
 * do Itaú Cultural: `procedencia: "autorado"` em todos, e a tela mostra isso.
 *
 * D-31 divide as disposições em duas naturezas:
 *   - `peso`  pondera a caminhada (ordena, promove, inverte) e NUNCA zera o feed
 *   - `corte` filtra de verdade, mas só sobre campo que o acervo declara
 *
 * ONDE ISTO FICA HONESTO OU DESONESTO: dos três cortes de DESC-01, o acervo sustenta
 * um. Gratuidade existe (`Ocorrencia.gratuito`). **Duração e faixa etária não existem em
 * campo nenhum do grafo** — nem no CMS, nem na Enciclopédia, nem nos 7.810 registros
 * geradas. Um proxy ("evento de música dura pouco", "espetáculo infantil é o que tem
 * 'infantil' no título") seria inventar dado e apresentá-lo como filtro. Por isso os
 * predicados dessas duas devolvem `indeterminado`, o motor emite aviso, e a tela mostra
 * o aviso tanto no onboarding quanto no feed.
 *
 * DP-F: este arquivo NÃO importa `grafo.ts`. Ele é lido pelo componente de onboarding,
 * que é `"use client"`, e importar o grafo aqui mandaria 23 MB de JSON para o navegador.
 * O predicado que precisa do acervo o recebe injetado em `ContextoPredicado`, montado
 * por `caminhada.ts`, que roda no build.
 */

import type { Entidade, Ocorrencia, Procedencia } from "./tipos";

// ---------------------------------------------------------------------------
// Predicados
// ---------------------------------------------------------------------------

/**
 * `indeterminado` não é "não sei se passa": é "o acervo não declara este campo". A
 * diferença importa porque `indeterminado` NUNCA corta — corte sobre campo inexistente
 * esvaziaria o feed e faria o filtro parecer que funcionou.
 */
export type ResultadoPredicado = "passa" | "corta" | "indeterminado";

/**
 * O que o predicado pode ler do acervo. Injetado por `caminhada.ts` a partir de
 * `grafo.ts` — nenhuma leitura de array cru aqui dentro (D-47).
 */
export interface ContextoPredicado {
  /** `ocorrenciasDe` de `grafo.ts`. Vazio para quem não é evento. */
  ocorrenciasDe: (id: string) => Ocorrencia[];
}

export type PredicadoDisposicao = (
  candidato: Entidade,
  ctx: ContextoPredicado,
) => ResultadoPredicado;

// ---------------------------------------------------------------------------
// Vocabulário
// ---------------------------------------------------------------------------

export type TipoDisposicao = "peso" | "corte";

export interface Disposicao {
  id: string;
  /** Exatamente como `docs/telas.md` tela 2 escreve. */
  rotulo: string;
  tipo: TipoDisposicao;
  procedencia: Procedencia;
  /** Uma linha do que a disposição faz, para o cartão grande do onboarding. */
  explicacao: string;
  /**
   * O campo do grafo que o predicado lê, escrito por extenso. `null` quando não existe
   * campo — e aí `ausencia` diz isso na cara, na tela.
   */
  campoLido: string | null;
  /** Texto mostrado quando o acervo não declara o campo. `null` quando declara. */
  ausencia: string | null;
  /** Só nas de corte. As de peso mexem na ordenação, em `caminhada.ts`. */
  predicado?: PredicadoDisposicao;
}

/**
 * Gratuidade — o único corte que o acervo sustenta.
 *
 * Lê `Ocorrencia.gratuito`, que é o booleano de ingresso do CMS reestruturado em sessão
 * datada (DADO-02). Medido: dos 300 eventos do grafo, 129 têm ocorrência gerada e os 129
 * têm ao menos uma sessão gratuita; os outros 171 não têm sessão nenhuma e portanto não
 * declaram gratuidade.
 *
 * Evento sem sessão declarada é CORTADO, e a diferença é fina mas importa: não estamos
 * afirmando que ele é pago — estamos dizendo que ele não declara sessão gratuita, e o
 * filtro pedido foi "quero algo de graça". `preco` é sempre `null` na fonte, então valor
 * não entra na conta.
 *
 * Quem não é evento devolve `indeterminado`: um termo da Enciclopédia não tem ingresso.
 * Isso é o que mantém o feed heterogêneo com o corte ligado.
 */
const gratuidade: PredicadoDisposicao = (candidato, ctx) => {
  const sessoes = ctx.ocorrenciasDe(candidato.id);
  if (candidato.classe !== "evento") return "indeterminado";
  return sessoes.some((o) => o.gratuito) ? "passa" : "corta";
};

/**
 * Duração — NÃO EXISTE NO GRAFO.
 *
 * Nem `Entidade`, nem `Temporada`, nem `Ocorrencia` têm campo de duração. `Temporada`
 * tem início e fim, mas isso é o período de cartaz, não o tempo da sessão: um evento em
 * cartaz por 40 dias não dura 40 dias. Devolver `indeterminado` e avisar é a leitura
 * honesta; qualquer outra coisa seria estimar minuto por classe artística.
 */
const duracao: PredicadoDisposicao = () => "indeterminado";

/**
 * Faixa etária — NÃO EXISTE NO GRAFO.
 *
 * O CMS modela 8 dimensões de acessibilidade e nenhuma de classificação indicativa. A
 * Enciclopédia é verbete, não bilheteria. Casar por palavra no título ("infantil") seria
 * inventar classificação etária a partir de texto livre.
 */
const faixaEtaria: PredicadoDisposicao = () => "indeterminado";

/** As cinco de DESC-01, na ordem da tela 2 de `docs/telas.md`. */
export const DISPOSICOES: Disposicao[] = [
  {
    id: "quero-ser-surpreendida",
    rotulo: "quero ser surpreendida",
    tipo: "peso",
    procedencia: "autorado",
    explicacao:
      "Promove o que está a dois saltos do seu repertório e o que vem de classe pouco frequente no feed.",
    campoLido: "distância no acervo (saltos) e raridade da classe entre os candidatos",
    ausencia: null,
  },
  {
    id: "tenho-pouco-tempo",
    rotulo: "tenho pouco tempo",
    tipo: "corte",
    procedencia: "autorado",
    explicacao: "Deixaria no feed só o que cabe numa janela curta.",
    campoLido: null,
    ausencia:
      "O acervo não declara duração: nem o evento, nem a temporada, nem a sessão têm esse campo. Este corte fica visível e desligado — preferimos dizer isso a filtrar por um palpite.",
    predicado: duracao,
  },
  {
    id: "vou-com-crianca",
    rotulo: "vou com criança",
    tipo: "corte",
    procedencia: "autorado",
    explicacao: "Deixaria no feed só o que é indicado para crianças.",
    campoLido: null,
    ausencia:
      "O acervo não declara faixa etária nem classificação indicativa em campo nenhum. Este corte fica visível e desligado — adivinhar por palavra no título seria inventar a classificação.",
    predicado: faixaEtaria,
  },
  {
    id: "quero-algo-de-graca",
    rotulo: "quero algo de graça",
    tipo: "corte",
    procedencia: "autorado",
    explicacao: "Mantém no feed só os eventos com ao menos uma sessão declarada gratuita.",
    campoLido: "Ocorrencia.gratuito",
    ausencia: null,
    predicado: gratuidade,
  },
  {
    id: "quero-conhecer-algo-que-nunca-vi",
    rotulo: "quero conhecer algo que nunca vi",
    tipo: "peso",
    procedencia: "autorado",
    explicacao:
      "O inverso do repertório: tira do feed tudo que já está nas linguagens que você atravessa.",
    campoLido: "Entidade.linguagens contra as linguagens do repertório da persona",
    ausencia: null,
  },
];

const INDICE = new Map(DISPOSICOES.map((d) => [d.id, d]));

export function disposicaoPorId(id: string): Disposicao | undefined {
  return INDICE.get(id);
}

export function disposicoesPorIds(ids: readonly string[]): Disposicao[] {
  return ids.map(disposicaoPorId).filter((d): d is Disposicao => Boolean(d));
}

/** Ids das duas disposições de peso, para `caminhada.ts` não repetir string solta. */
export const PESO_SURPRESA = "quero-ser-surpreendida";
export const PESO_NUNCA_VI = "quero-conhecer-algo-que-nunca-vi";
