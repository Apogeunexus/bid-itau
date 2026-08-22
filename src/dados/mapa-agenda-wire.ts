import type { ViaCoordenada } from "@/dados/geo";
import type { MetodoCoordenada } from "@/dados/tipos";
import type { TempoDoDia } from "@/dados/agenda";

/**
 * mapa-agenda-wire.ts — o FORMATO DE FIO da tela /acontece na visão web, e nada mais.
 *
 * Fase 5, plano 05-01.
 *
 * ESTE ARQUIVO NÃO IMPORTA NADA POR VALOR. Só tipos, que somem na compilação. É por isso
 * que ele pode ser importado por valor dos DOIS lados da fronteira DP-F: `mapa-agenda.ts`,
 * que roda no build e alcança os 23 MB do grafo, monta as tuplas com o vocabulário daqui;
 * `acontece.tsx`, que é `"use client"`, expande as tuplas com as MESMAS funções daqui e
 * não arrasta módulo nenhum ao fazê-lo.
 *
 * Sem este arquivo, o vocabulário posicional teria de existir em duas cópias — uma no
 * produtor e outra no consumidor — e a fase 3 já registrou por escrito o que acontece com
 * duas cópias de uma regra: elas divergem na primeira correção. Num vocabulário POSICIONAL
 * a divergência é silenciosa e catastrófica: trocar dois campos de lugar não quebra o
 * build, só passa a mostrar o lugar de um evento no nome de outro.
 *
 * ---------------------------------------------------------------------------
 * POR QUE TUPLA E NÃO OBJETO — a medida que decidiu
 * ---------------------------------------------------------------------------
 *
 * Os dois recortes desta tela somam 287 itens (129 por data + 158 por lugar; a interseção
 * entre eles é 0, então nada se repete). Com objetos de campo nomeado, os NOMES sozinhos
 * custam 136 bytes por item — 39 KB só de `"titulo":`, `"proximaSessao":` e irmãos
 * repetidos 287 vezes — e o DTO inteiro mediu 148.652 bytes, contra o teto declarado de
 * 61.440. Não é folga que falta: o teto é inalcançável com campo nomeado, por aritmética.
 *
 * A tupla é a resposta que este projeto já tinha dado ao mesmo problema, duas vezes:
 * `PinoIndexado` em `geo.ts` («nomes de campo repetidos 1.380 vezes são bytes que a
 * apresentação carrega sem usar») e os arrays paralelos de `DiaDaAgenda` em `agenda.ts`
 * («repetir o slug nos 2.425 pares custaria 172 KB»). O custo é legibilidade do payload
 * cru, e é por isso que o formato está documentado aqui, ao lado do produtor E do
 * consumidor, com uma função de expansão que devolve o objeto nomeado do outro lado.
 * ======================================================================== */

// ---------------------------------------------------------------------------
// Os vocabulários posicionais
// ---------------------------------------------------------------------------

/** Qual dos dois recortes. É o valor de `data-modo-lista` nos botões do alternador. */
export type IdDoRecorte = "data" | "lugar";

/**
 * Espelha `VIAS_INDEXADAS` de `geo.ts`. `mapa-agenda.ts` CONFERE a igualdade no build e
 * quebra alto se as duas listas divergirem — copiar é aceitável, divergir não é.
 */
export const VIAS_DO_ITEM: readonly ViaCoordenada[] = ["propria", "espaco", "territorio"];

/** Espelha `METODOS_INDEXADOS` de `geo.ts`. Mesma conferência. */
export const METODOS_DO_PINO: readonly MetodoCoordenada[] = [
  "centroide-municipio",
  "centroide-estado",
  "centroide-pais",
  "deslocamento-por-espaco",
];

export const TEMPOS_DO_ITEM: readonly TempoDoDia[] = ["passado", "hoje", "futuro"];

/**
 * As duas razões pelas quais um item não tem pino, em texto de PRODUTO — a tela imprime
 * estas frases literalmente ao lado do item, e elas são a diferença entre «o mapa está
 * incompleto» e «este evento não tem lugar no acervo».
 *
 * Elas são DUAS AFIRMAÇÕES DIFERENTES e nunca podem ser achatadas numa só: um evento da
 * agenda do CMS não tem território nenhum ligado ao registro; um evento da Enciclopédia
 * situado em Havana tem lugar, verdadeiro e conhecido, que simplesmente não cabe num
 * desenho do Brasil.
 */
export const MOTIVOS_SEM_PINO: readonly string[] = [
  "sem lugar no acervo — o registro traz data e nenhum território ligado a ele",
  "lugar declarado fora do contorno do Brasil, que é o recorte deste desenho",
];

export const SEM_LUGAR = 0;
export const FORA_DO_DESENHO = 1;

// ---------------------------------------------------------------------------
// As tuplas
// ---------------------------------------------------------------------------

/**
 * `[par, slug, título, linguagens, lugar, via, motivo, totalSessões, próximaSessão, tempo]`
 *
 * - `par` — A CHAVE DE CASAMENTO, e é o id da entidade. `null` quando o item não é
 *   mapeável. Uma chave derivada de índice de array quebraria no primeiro reordenamento
 *   da lista, e o sintoma seria um realce que acende o pino errado — pior do que nenhum
 *   realce, porque parece funcionar.
 * - `lugar` — o título do espaço ou do território de onde a coordenada veio. `null` sem
 *   lugar. «pino no centroide do município» é afirmação diferente de «pino no espaço».
 * - `via` — índice em `VIAS_DO_ITEM`; `-1` quando não há lugar.
 * - `motivo` — índice em `MOTIVOS_SEM_PINO`; `-1` quando o item TEM pino.
 * - `tempo` — índice em `TEMPOS_DO_ITEM`; `-1` quando o evento não tem sessão datada.
 *
 * `id`, `rota`, `classe` e `mapeavel` NÃO viajam: `id` é o `par`, `rota` é sempre
 * `/evento/{slug}/`, `classe` é sempre `"evento"` nos dois recortes, e `mapeavel` é
 * `par !== null`. Os quatro são derivados na expansão, do lado do cliente, onde custam
 * zero byte de fio.
 */
export type ItemSerializado = readonly [
  string | null,
  string,
  string,
  readonly string[],
  string | null,
  number,
  number,
  number,
  string | null,
  number,
];

/**
 * `[par, x, y, via, método]`
 *
 * `x` e `y` já projetados por `projetar()` no build, com uma casa decimal — a mesma
 * precisão que `indiceDePinos` publica.
 *
 * O TÍTULO NÃO VIAJA NO PINO. Ele já viajou no item de mesma chave, e o componente casa os
 * dois pelo `par` — que é exatamente o casamento que o realce de D-81 percorre. Repetir o
 * título nos 110 pinos custaria 5,5 KB para afirmar duas vezes a mesma coisa, e criaria a
 * possibilidade de as duas cópias discordarem.
 */
export type PinoSerializado = readonly [string, number, number, number, number];

// ---------------------------------------------------------------------------
// A expansão — o objeto nomeado, montado no cliente, sem custo de fio
// ---------------------------------------------------------------------------

export interface ItemPareado {
  /** A chave de casamento. Vira `data-par` nos dois lados. `null` = não mapeável. */
  par: string | null;
  id: string;
  slug: string;
  titulo: string;
  rota: string;
  classe: string;
  linguagens: readonly string[];
  mapeavel: boolean;
  lugar: string | null;
  via: ViaCoordenada | null;
  /** Por que este item não tem pino. `null` quando ele tem. Texto de produto. */
  motivoSemPino: string | null;
  totalSessoes: number;
  proximaSessao: string | null;
  tempo: TempoDoDia | null;
}

export interface PinoPareado {
  /** IDÊNTICA à do item que este pino representa. É o que faz a sincronia funcionar. */
  par: string;
  x: number;
  y: number;
  via: ViaCoordenada;
  metodo: MetodoCoordenada;
}

export function expandirItem(t: ItemSerializado): ItemPareado {
  const [par, slug, titulo, linguagens, lugar, via, motivo, totalSessoes, proximaSessao, tempo] = t;
  return {
    par,
    id: par ?? `evento:${slug}`,
    slug,
    titulo,
    rota: `/evento/${slug}/`,
    classe: "evento",
    linguagens,
    mapeavel: par !== null,
    lugar,
    via: via >= 0 ? VIAS_DO_ITEM[via] : null,
    motivoSemPino: motivo >= 0 ? MOTIVOS_SEM_PINO[motivo] : null,
    totalSessoes,
    proximaSessao,
    tempo: tempo >= 0 ? TEMPOS_DO_ITEM[tempo] : null,
  };
}

export function expandirPino(t: PinoSerializado): PinoPareado {
  const [par, x, y, via, metodo] = t;
  return { par, x, y, via: VIAS_DO_ITEM[via], metodo: METODOS_DO_PINO[metodo] };
}
