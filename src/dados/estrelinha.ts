import {
  cidadesComAcervo,
  montarRoteiro,
  OPCOES_DE_DIAS,
  type CidadeExportavel,
  type Roteiro,
} from "./cidade";
import vocabularioJson from "@/dados/gerado/vocabulario.json";
import type { Vocabulario } from "@/dados/tipos";

/**
 * estrelinha.ts — o motor da funcionalidade de IA pedida pelo cliente (reformulação
 * 2026-08): uma entrevista curta e um roteiro personalizado por cima do grafo.
 *
 * A «IA» É DETERMINÍSTICA E SE DECLARA: nenhum modelo é chamado — as respostas da
 * entrevista compõem um slug, e cada combinação (gosto × dias × cidade) é uma
 * página PRÉ-COMPUTADA no build pelo MESMO `montarRoteiro` do Modo Cidade, com uma
 * única diferença: os itens da linguagem escolhida sobem para a frente da fila da
 * sua classe (`PedidoDeRoteiro.promover`). É o princípio dos 96 feeds de Descobrir
 * (D-26): a resposta já está pronta antes de alguém perguntar, e é explicável.
 *
 * MÓDULO DE BUILD (DP-F): alcança o grafo por valor via `cidade.ts`; nenhum
 * `"use client"` pode importá-lo. As páginas de roteiro são de servidor.
 *
 * A COMPANHIA (pergunta «com quem você vai?») NÃO ALTERA A SELEÇÃO, e isso é dito
 * na tela: o acervo não declara classificação etária — medido; filtrar por
 * companhia seria fingir um dado que não existe. Ela viaja fora do slug e vira o
 * aviso declarado no topo do roteiro.
 */

const VOCABULARIO = vocabularioJson as Vocabulario;

export interface GostoDaEstrelinha {
  /** O segmento do slug da combinação. */
  slug: string;
  rotulo: string;
  /** O id de linguagem do vocabulário que a promoção usa; null = sem promoção. */
  linguagemId: string | null;
}

/**
 * As seis opções da primeira pergunta. Cinco linguagens do vocabulário controlado
 * (a cor de cada uma continua vindo do dado, D-08) e «me surpreenda», que é o
 * roteiro do Modo Cidade sem promoção nenhuma — e a tela diz exatamente isso.
 */
export const GOSTOS: readonly GostoDaEstrelinha[] = [
  { slug: "musica", rotulo: "Música", linguagemId: "musica" },
  { slug: "teatro", rotulo: "Teatro", linguagemId: "teatro" },
  { slug: "artes-visuais", rotulo: "Artes visuais", linguagemId: "artes-visuais" },
  { slug: "literatura", rotulo: "Literatura", linguagemId: "literatura" },
  { slug: "cinema", rotulo: "Cinema", linguagemId: "cinema" },
  { slug: "surpresa", rotulo: "Me surpreenda", linguagemId: null },
];

/** As opções da segunda pergunta. Não entram no slug — ver o cabeçalho. */
export const COMPANHIAS: readonly { slug: string; rotulo: string }[] = [
  { slug: "sozinho", rotulo: "Vou só" },
  { slug: "a-dois", rotulo: "A dois" },
  { slug: "com-crianca", rotulo: "Com criança" },
  { slug: "em-grupo", rotulo: "Em grupo" },
];

export interface CombinacaoDaEstrelinha {
  /** `{cidade}--{dias}-dias--{gosto}` — o slug da rota pré-computada. */
  combinacao: string;
  cidade: CidadeExportavel;
  dias: number;
  gosto: GostoDaEstrelinha;
}

function slugDe(cidadeSlug: string, dias: number, gostoSlug: string): string {
  return `${cidadeSlug}--${dias}-dias--${gostoSlug}`;
}

let combinacoesMemo: CombinacaoDaEstrelinha[] | null = null;

/** Todas as combinações exportadas: cidades × dias × gostos (15 × 4 × 6 = 360). */
export function combinacoesDaEstrelinha(): CombinacaoDaEstrelinha[] {
  if (combinacoesMemo) return combinacoesMemo;
  const saida: CombinacaoDaEstrelinha[] = [];
  for (const cidade of cidadesComAcervo()) {
    for (const dias of OPCOES_DE_DIAS) {
      for (const gosto of GOSTOS) {
        saida.push({ combinacao: slugDe(cidade.slug, dias, gosto.slug), cidade, dias, gosto });
      }
    }
  }
  combinacoesMemo = saida;
  return saida;
}

export interface RoteiroDaEstrelinha {
  combinacao: CombinacaoDaEstrelinha;
  roteiro: Roteiro;
  /** Quantos itens do roteiro declaram a linguagem promovida, de quantos — medido. */
  cobertura: { doGosto: number; total: number; rotuloLinguagem: string | null };
  /** As regras do gerador, exportadas para a tela — a transparência é produto. */
  regras: string[];
}

/** Resolve uma combinação pelo slug da rota, ou null quando ela não foi exportada. */
export function roteiroDaEstrelinha(combinacao: string): RoteiroDaEstrelinha | null {
  const c = combinacoesDaEstrelinha().find((x) => x.combinacao === combinacao);
  if (!c) return null;

  const linguagemId = c.gosto.linguagemId;
  const roteiro = montarRoteiro({
    territorioId: c.cidade.territorioId,
    dias: c.dias,
    promover: linguagemId ? (item) => item.linguagens.includes(linguagemId) : undefined,
  });

  const itens = roteiro.dias.flatMap((d) => d.itens);
  const doGosto = linguagemId
    ? itens.filter((i) => i.linguagens.includes(linguagemId)).length
    : 0;
  const rotuloLinguagem = linguagemId
    ? (VOCABULARIO.linguagens.find((l) => l.id === linguagemId)?.rotulo ?? linguagemId)
    : null;

  const regras = [
    "As respostas da entrevista compõem o endereço desta página — nada é calculado depois que você responde: cada combinação já foi montada no build, sobre o grafo do acervo.",
    linguagemId
      ? `Itens de ${rotuloLinguagem} sobem para a frente da fila da sua classe; o rodízio de classes, o percurso por proximidade e o desempate determinístico continuam os mesmos do Modo Cidade.`
      : "«Me surpreenda» é o roteiro do Modo Cidade sem promoção nenhuma: rodízio de classes, percurso por proximidade e desempate determinístico.",
    "A companhia não altera a seleção: o acervo não declara classificação etária, e filtrar por um dado que não existe seria inventá-lo.",
    "Nenhum modelo de IA é chamado, nem aqui nem no build — as regras acima são o gerador inteiro.",
  ];

  return { combinacao: c, roteiro, cobertura: { doGosto, total: itens.length, rotuloLinguagem }, regras };
}

export { OPCOES_DE_DIAS };
