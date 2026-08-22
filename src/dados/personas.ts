/**
 * personas.ts — as três personas do protótipo, tipadas.
 *
 * `personas.json` tem 3,4 KB e é VOCABULÁRIO/CONFIGURAÇÃO, não grafo (DP-G): pode ir ao
 * navegador, como o `vocabulario.json` de 24 KB que a fase 1 já manda no selo de
 * linguagem. `entidades.json` (9,4 MB) e `arestas.json` (13,6 MB) não podem, e é por isso
 * que o contexto de sessão importa daqui e nunca de `grafo.ts` (DP-F).
 *
 * Leitura defensiva, como a tela de entrada da fase 1 já faz: arquivo com outra forma
 * derruba a tela, não o build.
 */

import personasJson from "./gerado/personas.json";
import type { Procedencia } from "./tipos";

export interface RepertorioPersona {
  id: string;
  pessoaUsuariaId: string;
  /** Ids de linguagem do vocabulário controlado (`"musica"`), não ids de entidade. */
  linguagens: string[];
  /** Ids canônicos de entidade (`"termo:enc:80292"`). */
  entidades: string[];
  ocorrenciasSalvas: string[];
  procedencia: Procedencia;
}

export interface Persona {
  id: string;
  nome: string;
  resumo: string;
  procedencia: Procedencia;
  fonte?: string;
  repertorio: RepertorioPersona;
}

const bruto = personasJson as unknown as { personas?: Persona[]; trilhas?: string[] };

export const PERSONAS: Persona[] = Array.isArray(bruto?.personas) ? bruto.personas : [];

/**
 * A persona antes de hidratar. Sem um valor estável aqui, o HTML do build e o primeiro
 * render do cliente divergem e o React reclama de hidratação.
 */
export const PERSONA_PADRAO: string = PERSONAS[0]?.id ?? "";

const INDICE = new Map(PERSONAS.map((p) => [p.id, p]));

export function personaPorId(id: string | null | undefined): Persona | undefined {
  return id ? INDICE.get(id) : undefined;
}

/**
 * T-02-02: `personaId` vem de `localStorage`, que o avaliador pode editar. Valor
 * desconhecido cai na primeira persona em vez de propagar para dentro da caminhada.
 */
export function personaIdValido(id: string | null | undefined): string {
  return id && INDICE.has(id) ? id : PERSONA_PADRAO;
}
