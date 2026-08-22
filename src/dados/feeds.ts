/**
 * feeds.ts — o precômputo dos 96 feeds de Descobrir (D-32, D-45).
 *
 * POR QUE ESTE ARQUIVO EXISTE. D-32 promete que trocar a disposição remonta o feed **na
 * hora, sem recarregar rota**, e D-45 promete o mesmo para trocar de persona. Sob
 * `output: "export"` (D-24) não há servidor para consultar e a caminhada não pode rodar no
 * navegador (DP-F): `entidades.json` tem 9,4 MB e `arestas.json` 13,6 MB. Então a única
 * forma de a troca ser instantânea é ela já estar pronta — todas as combinações, montadas
 * no build.
 *
 * São 5 disposições em seleção múltipla, portanto 2^5 = 32 subconjuntos, vezes 3 personas:
 * **96 feeds**. Combinação faltando quebraria a promessa de D-32 num toque que a banca vai
 * dar ao vivo; cartão a menos não quebra nada. É por isso que o teto de tamanho tem o
 * limite de cartões como válvula, e não o número de combinações (T-02-08).
 *
 * COMO A CHAVE ATRAVESSA A FRONTEIRA SEM DUPLICAR CÓDIGO. O cliente precisa escolher uma
 * das 32 combinações, mas não pode importar este módulo — ele arrasta `caminhada.ts` e o
 * grafo inteiro atrás. Em vez de uma função de chave duplicada dos dois lados (que diverge
 * na primeira edição), a ORDEM das disposições viaja como DADO em `ordemDisposicoes`, e o
 * índice da combinação é a máscara de bits sobre essa ordem. O cliente calcula a máscara
 * numa linha; o contrato é o array, não uma convenção de string repetida em dois lugares.
 *
 * MEDIÇÃO QUE DEFINIU O FORMATO: os 96 feeds serializados inteiros dão 1,14 MB, mas só
 * existem 21 LISTAS DE CARTÕES distintas — porque duas das cinco disposições não cortam
 * nada (o acervo não declara duração nem faixa etária) e porque combinações diferentes
 * caem no mesmo resultado. Guardar as listas uma vez e apontar para elas leva o payload de
 * 1,14 MB para 0,23 MB. Avisos e diagnóstico continuam por combinação, porque eles SÃO
 * diferentes em cada uma: é o aviso que conta para a pessoa que o corte que ela marcou não
 * pôde rodar.
 */

import { montarFeed } from "./caminhada";
import type { AvisoFeed, Cartao, DiagnosticoFeed } from "./cartao";
import { DISPOSICOES } from "./disposicoes";
import { PERSONA_PADRAO, PERSONAS } from "./personas";

/** Cartões por feed. É a VÁLVULA de T-02-08: se o payload estourar, este número desce. */
export const LIMITE_FEED = 12;

/**
 * Teto do payload serializado (T-02-08). Não é decoração: um `Record` de feeds sem teto
 * cresce em silêncio até a primeira tela demorar a desenhar na apresentação. Estourar aqui
 * derruba o build com a instrução do que reduzir.
 */
export const TETO_PRECOMPUTO_BYTES = 1_500_000;

/** Uma das 32 combinações de disposição de uma persona. */
export interface CombinacaoFeed {
  /** Os ids de disposição desta combinação, na ordem canônica. */
  disposicoes: string[];
  /** Índice em `listas`. Combinações que produzem a mesma lista apontam para a mesma. */
  lista: number;
  /** Avisos do motor: corte marcado cujo campo o acervo não declara. A tela é obrigada. */
  avisos: AvisoFeed[];
  diagnostico: DiagnosticoFeed;
}

export interface Precomputo {
  /**
   * A ordem canônica das disposições. O índice de uma combinação em
   * `porPersona[personaId]` é a MÁSCARA DE BITS sobre este array: o bit `i` ligado
   * significa que `ordemDisposicoes[i]` está marcada. É este array que sincroniza
   * servidor e cliente — sem ele, os dois lados teriam de concordar sobre um formato de
   * string, e é aí que combinação some sem ninguém perceber.
   */
  ordemDisposicoes: string[];
  /** As listas de cartões distintas, deduplicadas. */
  listas: Cartao[][];
  /** personaId → 32 combinações, posicionadas pela máscara. */
  porPersona: Record<string, CombinacaoFeed[]>;
  /** A persona do HTML estático, antes de o navegador ler o `localStorage`. */
  personaPadrao: string;
  /** Bytes do payload serializado. Vai para a tela — o número é argumento, não debug. */
  bytes: number;
  combinacoes: number;
}

const ORDEM = DISPOSICOES.map((d) => d.id);

function montarPrecomputo(): Precomputo {
  const listas: Cartao[][] = [];
  const indicePorAssinatura = new Map<string, number>();
  const porPersona: Record<string, CombinacaoFeed[]> = {};

  for (const persona of PERSONAS) {
    const combinacoes: CombinacaoFeed[] = [];
    for (let mascara = 0; mascara < 1 << ORDEM.length; mascara++) {
      const disposicoes = ORDEM.filter((_, i) => mascara & (1 << i));
      const { cartoes, avisos, diagnostico } = montarFeed({
        personaId: persona.id,
        disposicoes,
        limite: LIMITE_FEED,
      });

      // Dedupe por conteúdo. `montarFeed` devolve objetos novos a cada chamada, então a
      // identidade de referência não serve — a assinatura serializada serve, e é a mesma
      // coisa que a fronteira RSC vai transportar.
      const assinatura = JSON.stringify(cartoes);
      let lista = indicePorAssinatura.get(assinatura);
      if (lista === undefined) {
        lista = listas.length;
        listas.push(cartoes);
        indicePorAssinatura.set(assinatura, lista);
      }

      combinacoes[mascara] = { disposicoes, lista, avisos, diagnostico };
    }
    porPersona[persona.id] = combinacoes;
  }

  const bytes = JSON.stringify({ listas, porPersona }).length;
  const combinacoes = PERSONAS.length * (1 << ORDEM.length);

  if (bytes > TETO_PRECOMPUTO_BYTES) {
    throw new Error(
      `T-02-08: o precômputo de ${combinacoes} feeds serializa ${(bytes / 1024 / 1024).toFixed(2)} MB, ` +
        `acima do teto de ${(TETO_PRECOMPUTO_BYTES / 1024 / 1024).toFixed(2)} MB. ` +
        `Reduza LIMITE_FEED em feeds.ts — NUNCA o número de combinações: combinação faltando ` +
        `quebra a troca instantânea que D-32 promete, cartão a menos não quebra nada.`,
    );
  }

  return {
    ordemDisposicoes: ORDEM,
    listas,
    porPersona,
    personaPadrao: PERSONA_PADRAO,
    bytes,
    combinacoes,
  };
}

/** Montado uma vez, no carregamento do módulo — ou seja, no build. */
export const PRECOMPUTO: Precomputo = montarPrecomputo();

/**
 * A UNIÃO dos ids de cartão de todas as combinações, ordenada.
 *
 * É desta lista que sai `generateStaticParams` da rota de explicação. Ela e o feed vêm do
 * MESMO precômputo de propósito: recalcular a união com outra chamada a `montarFeed`
 * abriria a porta para as duas listas divergirem, e id no feed sem página correspondente é
 * link morto no export — que numa demonstração ao vivo é pior do que cartão a menos.
 */
export const IDS_DA_UNIAO: string[] = [
  ...new Set(PRECOMPUTO.listas.flatMap((lista) => lista.map((c) => c.id))),
].sort();

/**
 * O cartão como o feed daquela persona o produziu, quando ele existe ali.
 *
 * A tela de explicação usa isto para reaproveitar o `caminho` que a caminhada já percorreu
 * em vez de reconstruir um: o caminho exibido tem de ser o que TROUXE o cartão, não um
 * caminho equivalente descoberto depois.
 */
const CARTAO_POR_PERSONA = (() => {
  const idx = new Map<string, Map<string, Cartao>>();
  for (const [personaId, combinacoes] of Object.entries(PRECOMPUTO.porPersona)) {
    const desta = new Map<string, Cartao>();
    for (const combinacao of combinacoes) {
      for (const cartao of PRECOMPUTO.listas[combinacao.lista]) {
        if (!desta.has(cartao.id)) desta.set(cartao.id, cartao);
      }
    }
    idx.set(personaId, desta);
  }
  return idx;
})();

export function cartaoDoFeed(personaId: string, entidadeId: string): Cartao | undefined {
  return CARTAO_POR_PERSONA.get(personaId)?.get(entidadeId);
}
