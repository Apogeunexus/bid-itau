/**
 * programa.ts — junta as quatro peças num catálogo só, que é o que o motor recebe.
 *
 * Existe para o motor ter UMA dependência de dado em vez de quatro, e para a
 * fronteira ficar explícita: tudo que o motor sabe sobre o mundo entra por aqui.
 * Nenhum destes quatro arquivos alcança `grafo.ts` (DP-F), então este também não.
 */

import { COMUNIDADES, PESSOAS, PUBLICACOES } from "./comunidade";
import { RECOMPENSAS } from "./loja";
import { CONFIG, EMBLEMAS, MISSOES, REGRAS } from "./pontos";
import type { DadosDoPrograma } from "@/lib/pontos/tipos";

export const PROGRAMA: DadosDoPrograma = {
  config: CONFIG,
  regras: REGRAS,
  missoes: MISSOES,
  emblemas: EMBLEMAS,
  recompensas: RECOMPENSAS,
  comunidades: COMUNIDADES,
  publicacoes: PUBLICACOES,
  pessoas: PESSOAS,
};
