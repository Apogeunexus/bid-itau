import { cidadesComAcervo, FONTE_DA_DISTANCIA } from "@/dados/cidade";
import { UNIDADES_FEDERATIVAS } from "@/dados/contorno-brasil";
import { coordenadaDe, distanciaKm, indiceDePinos } from "@/dados/geo";
import { porId, porTerritorio } from "@/dados/grafo";

/**
 * mapa-perto.ts — «o que tem perto de mim que vale a pena conhecer?», montado no build.
 *
 * POR QUE ESTE ARQUIVO EXISTE. A tela do mapa abria com o desenho do Brasil ocupando a
 * primeira dobra e a lista do acervo escondida embaixo dele: o produto lia como navegador
 * de pinos, e não como descoberta cultural. A reformulação inverte a ordem — lugares e
 * obras primeiro, distância como informação de decisão, mapa como apoio — e é este módulo
 * que produz o material da parte de cima.
 *
 * ESTE ARQUIVO IMPORTA `@/dados/grafo` e portanto NUNCA pode ser importado por um
 * componente de cliente (DP-F). `mapa.tsx` recebe tudo por propriedade e só importa daqui
 * com `import type`, que o compilador apaga — o mesmo contrato que `modo-cidade.tsx`
 * mantém com `cidade.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE O DADO SUSTENTA SOBRE DISTÂNCIA, MEDIDO NESTE ACERVO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dos 790 itens que o mapa situa no Brasil, 474 ancoram no CENTROIDE DO MUNICÍPIO e 299
 * num espaço com deslocamento derivado. Consequência medida, a partir de São Paulo: 132
 * itens dão exatamente 0,000 km, e os espaços da própria cidade dão de 0,1 a 0,5 km —
 * o Sesc Belenzinho, que na vida real fica a uns 7 km do centro, sai a 0,1 km.
 *
 * **Por isso a distância só é IMPRESSA entre municípios.** Dentro da cidade, o número que o
 * dado produz erra por uma ordem de grandeza e diria a quem lê uma coisa falsa sobre onde
 * as coisas estão; o cartão então nomeia o LUGAR («Sesc Belenzinho»), que é o que o acervo
 * de fato sabe. Fora da cidade a haversine mede o que promete, e aí o «92 km» aparece.
 *
 * É a mesma regra que `cidade.ts` já aplicava ao Modo Cidade por outro caminho: nunca
 * imprimir «0 km», porque um zero na tela lê como erro e não como «o dado não distingue».
 */

/** Quantos itens cada fileira leva. Acima disso é rolagem sem fim, não é descoberta. */
const TETO_DA_FILEIRA = 24;

/**
 * Abaixo desta distância o número NÃO é impresso, e a razão é o dado, não o gosto.
 *
 * O deslocamento derivado que separa dois espaços da mesma cidade é da ordem de centenas de
 * metros — medido: o Sesc Belenzinho sai a 0,1 km do centroide de São Paulo, quando na vida
 * real está a uns 7 km. Qualquer número abaixo de 5 km, aqui, é ruído da derivação e não
 * medida: imprimi-lo seria afirmar uma precisão que o acervo não tem. Acima disso a
 * distância separa municípios de verdade, e aí a haversine mede o que promete.
 *
 * O item que cai abaixo do limiar não some — ele entra na fileira da cidade, onde o cartão
 * nomeia o LUGAR («Galeria Eduardo Fernandes»), que é o que o acervo de fato sabe.
 */
const DISTANCIA_MINIMA_CONFIAVEL_KM = 5;

/**
 * As classes que a descoberta mostra: as que TÊM rota de entidade.
 *
 * É a mesma tabela de `cartao.tsx` e `cidade.ts`. Sem este corte, a fileira enchia de
 * `temporada` — cartões intitulados «"Deus" — 1993-01-01 a 1993-12-31», que é o vocabulário
 * do banco vazando para a tela, e que ainda por cima não abrem nada. Um cartaz sem porta é
 * pior que um cartaz a menos.
 */
const CLASSES_DA_DESCOBERTA: readonly string[] = [
  "pessoa",
  "coletivo",
  "instituicao",
  "espaco",
  "obra",
  "evento",
];

export interface ItemPerto {
  /** Índice em `indiceDePinos()` — o cliente lê título, capa, cor e classe de lá. */
  i: number;
  /** Linha reta em km a partir do centroide da cidade de origem. */
  km: number;
  /** O lugar de onde a coordenada veio: o espaço quando há, o município quando não. */
  onde: string;
  /** A coordenada é o centroide do município — não há posição própria por trás dela. */
  noCentroide: boolean;
}

export interface OrigemDoMapa {
  slug: string;
  /** «São Paulo» */
  titulo: string;
  /** A sigla do estado, quando o acervo declara o estado. «SP» */
  uf: string | null;
  /** Quantas entidades o acervo situa nesta cidade. Medido no grafo. */
  total: number;
  /** O que o acervo situa NA cidade — lugares com posição própria primeiro. */
  naCidade: readonly ItemPerto[];
  /** O mais próximo FORA da cidade, por distância crescente. É aqui que o km existe. */
  fora: readonly ItemPerto[];
}

export interface DadosDePerto {
  origens: readonly OrigemDoMapa[];
  /** A frase de procedência que acompanha todo número de distância (T-03-29). */
  fonteDaDistancia: string;
}

const SIGLA_POR_ESTADO = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.titulo, u.sigla]));

/**
 * Comparação por ponto de código, nunca `localeCompare`: o desempate precisa ser o mesmo em
 * toda máquina, e a tabela de colação do ICU não é (a mesma razão de `cidade.ts`).
 */
function porChave(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * As cidades de origem: os municípios BRASILEIROS que o Modo Cidade já reconhece.
 *
 * As de fora do país saem — o desenho é do Brasil e «a partir de Havana» ofereceria uma
 * origem que a tela não consegue situar. `cidadesComAcervo` já ordena por tamanho de
 * acervo, então a primeira é a origem padrão.
 */
function cidadesDeOrigem() {
  return cidadesComAcervo().filter((c) => c.pais === "Brasil");
}

let memorizado: DadosDePerto | null = null;

export function dadosDePerto(): DadosDePerto {
  if (memorizado) return memorizado;

  const pinos = indiceDePinos();
  // Só o que o desenho situa no Brasil, e sem os territórios: um município na fileira de
  // «perto de você» contaria o continente como se fosse conteúdo (mesma regra de
  // `acervoSituadoNoBrasil`).
  const candidatos = pinos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p[10] === 1 && CLASSES_DA_DESCOBERTA.includes(p[3]));

  const origens: OrigemDoMapa[] = [];
  for (const cidade of cidadesDeOrigem()) {
    const territorio = porId(cidade.territorioId);
    const centro = territorio?.coordenada;
    // Sem coordenada não há origem: uma cidade que não sabe onde está não mede distância
    // de nada. Ela simplesmente não entra na lista, em vez de entrar medindo do zero.
    if (!centro) continue;

    // O QUE CONTA COMO «NA CIDADE» tem dois caminhos, e os dois são necessários.
    // Pelo GRAFO: a entidade está situada neste município, ou a coordenada dela veio de um
    // espaço que está. Pela DISTÂNCIA: caiu dentro do limiar de confiança. Só o grafo não
    // bastava — medido, «(Des)fazer Imagens» ancora na Galeria Eduardo Fernandes, que é de
    // São Paulo, e a obra não está situada no município; ela aparecia na fileira de fora
    // anunciando «0,2 km», que é o pior dos dois mundos: fora do lugar e com número falso.
    const idsDaCidade = new Set(porTerritorio(cidade.territorioId).map((e) => e.id));

    const naCidade: ItemPerto[] = [];
    const fora: ItemPerto[] = [];
    for (const { p, i } of candidatos) {
      const r = coordenadaDe(p[1]);
      if (!r) continue;
      const item: ItemPerto = {
        i,
        km: distanciaKm(centro, r.coordenada),
        onde: r.origemTitulo,
        noCentroide: r.via === "territorio",
      };
      const aqui =
        item.km < DISTANCIA_MINIMA_CONFIAVEL_KM ||
        idsDaCidade.has(p[1]) ||
        idsDaCidade.has(r.origemId) ||
        r.origemId === cidade.territorioId;
      if (aqui) naCidade.push(item);
      else fora.push(item);
    }

    // NA CIDADE, O LUGAR VEM PRIMEIRO. Quem tem espaço com posição própria é um endereço a
    // que se pode ir — Sesc, teatro, galeria —, e é o que a pergunta «o que tem perto de
    // mim» quer ouvir. Quem ancora no centroide é o resto do acervo daqui, que continua na
    // lista logo abaixo do mapa. Depois disso, quem o acervo mais documenta.
    naCidade.sort(
      (a, b) =>
        Number(a.noCentroide) - Number(b.noCentroide) ||
        pinos[b.i][11] - pinos[a.i][11] ||
        porChave(pinos[a.i][0], pinos[b.i][0]),
    );
    fora.sort((a, b) => a.km - b.km || porChave(pinos[a.i][0], pinos[b.i][0]));

    origens.push({
      slug: cidade.slug,
      titulo: cidade.titulo,
      uf: cidade.estado ? (SIGLA_POR_ESTADO.get(cidade.estado) ?? null) : null,
      total: cidade.total,
      naCidade: naCidade.slice(0, TETO_DA_FILEIRA),
      fora: fora.slice(0, TETO_DA_FILEIRA),
    });
  }

  memorizado = { origens, fonteDaDistancia: FONTE_DA_DISTANCIA };
  return memorizado;
}
