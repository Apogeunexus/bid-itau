/**
 * geo.ts — a ponte entre o que o acervo sabe sobre LUGAR e o que o mapa desenha.
 *
 * Três responsabilidades, e a separação entre elas é o ponto do arquivo:
 *   1. `LIMITES` e `projetar` — a PROJEÇÃO, que é código nosso e não dado de ninguém;
 *   2. `coordenadaDe` — a RESOLUÇÃO, que só devolve o que o grafo sustenta;
 *   3. `distanciaKm` — aritmética de esfera, sem nenhuma noção de tela.
 *
 * A PROJEÇÃO É ESCOLHA NOSSA e está declarada na legenda: equirretangular simples, `x`
 * linear em longitude e `y` linear e invertido em latitude, sobre um `viewBox` fixo. Ela
 * distorce — a área de Roraima sai maior do que deveria em relação à do Paraná — e a tela
 * diz que distorce. O que NÃO se pode admitir é uma segunda projeção: contorno e pino
 * precisam sair da mesma função, senão o desenho e o dado desalinham sem dar sintoma.
 *
 * A RESOLUÇÃO NUNCA INVENTA POSIÇÃO (T-03-16). Entidade sem caminho até uma coordenada
 * devolve `null`, e quem chama a conta fora do desenho. Empurrar um ponto sem dado para um
 * lugar qualquer é a versão geográfica de fabricar data, e D-48 vale nos dois eixos.
 *
 * ESTE ARQUIVO IMPORTA `@/dados/grafo` e portanto NUNCA pode ser importado por um
 * componente de cliente (DP-F). Quem precisa de posição no navegador recebe o índice já
 * projetado, por propriedade, de um componente de servidor.
 *
 * CONTRATO COM O PLANO 03-05 (Modo Cidade, onda 2): `coordenadaDe` e `distanciaKm` são
 * consumidas de fora. `coordenadaDe` recebe o id canônico de uma entidade QUALQUER — não
 * só das que carregam coordenada própria — e `distanciaKm` recebe duas coordenadas e
 * devolve quilômetros. Nenhuma das duas conhece SVG, `viewBox` ou pixel.
 */

/**
 * A TABELA DE CENTROIDES É O ÚNICO LUGAR DO PROJETO QUE SABE QUE SERGIPE E TOCANTINS
 * EXISTEM. Ela traz as 27 unidades federativas; o grafo tem território para 25. É dessa
 * diferença, e só dela, que a camada de desertos culturais consegue desenhar o buraco.
 *
 * Ela mora em `scripts/dados/` porque é insumo do gerador (D-19) — o mesmo arquivo que
 * produziu as coordenadas derivadas do grafo. Ler daqui é ler a MESMA fonte, e não uma
 * cópia que divergiria na primeira correção.
 */
import CENTROIDES from "../../scripts/dados/centroides.json";
import vocabularioJson from "@/dados/gerado/vocabulario.json";
import { UNIDADES_FEDERATIVAS } from "@/dados/contorno-brasil";
import { porId, porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import type {
  ClasseEntidade,
  Coordenada,
  MetodoCoordenada,
  Vocabulario,
} from "@/dados/tipos";

// ---------------------------------------------------------------------------
// A projeção
// ---------------------------------------------------------------------------

/**
 * O retângulo geográfico do desenho e o `viewBox` correspondente. UMA CONSTANTE SÓ: o
 * contorno, os polígonos estaduais e os pinos leem daqui, e é isso que garante que o
 * desenho e o dado não divirjam.
 *
 * A folga é deliberada. O Brasil continental vai de 5,27°N (Monte Caburaí) a 33,75°S
 * (Arroio Chuí) e de 73,99°W (nascente do Moa) a 34,79°W (Ponta do Seixas); o retângulo
 * abre um pouco mais em todos os lados para que nenhum vértice do contorno encoste na
 * borda do SVG.
 *
 * `10` unidades de `viewBox` por grau, nos dois eixos. O número redondo não é estética: é
 * o que torna a projeção conferível de cabeça na hora de depurar um pino fora do lugar.
 */
export const LIMITES = {
  latMax: 6.5,
  latMin: -34.5,
  lonMin: -75.5,
  lonMax: -33.0,
  largura: 425,
  altura: 410,
  viewBox: "0 0 425 410",
} as const;

/** Unidades de `viewBox` por grau. Igual nos dois eixos, por construção de `LIMITES`. */
export const UNIDADES_POR_GRAU = LIMITES.largura / (LIMITES.lonMax - LIMITES.lonMin);

export interface PontoProjetado {
  x: number;
  y: number;
  /**
   * O ponto caiu dentro do retângulo do desenho?
   *
   * `projetar` DEVOLVE A POSIÇÃO MESMO QUANDO É `false`, e não grampeia nada para a borda.
   * Grampear faria as 224 coordenadas estrangeiras do acervo se amontoarem no contorno do
   * Brasil como se estivessem no Brasil — uma afirmação falsa sobre lugar, feita em
   * silêncio. Quem chama decide o que fazer; aqui a única obrigação é não mentir.
   */
  dentro: boolean;
}

/** Equirretangular: `x` linear em longitude, `y` linear e INVERTIDO em latitude. */
export function projetar(coordenada: { lat: number; lon: number }): PontoProjetado {
  const { lat, lon } = coordenada;
  const x = ((lon - LIMITES.lonMin) / (LIMITES.lonMax - LIMITES.lonMin)) * LIMITES.largura;
  // Invertido porque latitude cresce para o NORTE e `y` de SVG cresce para BAIXO. É o erro
  // de sinal mais fácil de cometer e o mais difícil de ver: um mapa de cabeça para baixo
  // continua parecendo um mapa.
  const y = ((LIMITES.latMax - lat) / (LIMITES.latMax - LIMITES.latMin)) * LIMITES.altura;
  const dentro =
    lat <= LIMITES.latMax &&
    lat >= LIMITES.latMin &&
    lon >= LIMITES.lonMin &&
    lon <= LIMITES.lonMax;
  return { x, y, dentro };
}

/** Um anel de pares `[lat, lon]` vira o atributo `d` de um `<path>` fechado. */
export function caminhoDe(anel: readonly (readonly [number, number])[]): string {
  if (!anel.length) return "";
  const partes = anel.map(([lat, lon], i) => {
    const { x, y } = projetar({ lat, lon });
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${partes.join(" ")} Z`;
}

// ---------------------------------------------------------------------------
// A resolução de coordenada
// ---------------------------------------------------------------------------

/**
 * Por qual dos três caminhos a coordenada chegou. A legenda e o cartão do item mostram
 * isto: «pino no centroide do município» é uma afirmação diferente de «pino no espaço», e
 * apagar a diferença apagaria o único dado de qualidade que temos sobre a posição.
 */
export type ViaCoordenada = "propria" | "espaco" | "territorio";

export interface CoordenadaResolvida {
  coordenada: Coordenada;
  metodo: MetodoCoordenada;
  via: ViaCoordenada;
  /** A entidade de onde a coordenada veio — ela mesma, o espaço, ou o território. */
  origemId: string;
  origemTitulo: string;
}

/** Teto de subida na hierarquia de território. Segura ciclo de dado malformado. */
const MAX_SUBIDA = 6;

/**
 * A coordenada de uma entidade qualquer, ou `null`.
 *
 * Ordem: coordenada própria → espaço a que a entidade se liga por `situado_em` → território
 * a que ela se liga, subindo a hierarquia até achar um com coordenada.
 *
 * O ESPAÇO VEM ANTES DO TERRITÓRIO de propósito. Os 8 espaços de Belém têm coordenadas
 * distintas entre si na quarta casa decimal; o centroide do município é um ponto só. Quando
 * o acervo souber o espaço, o pino é melhor — e o cartão do item diz qual dos dois foi.
 */
export function coordenadaDe(entidadeId: string): CoordenadaResolvida | null {
  const entidade = porId(entidadeId);
  if (!entidade) return null;

  if (entidade.coordenada) {
    return {
      coordenada: entidade.coordenada,
      metodo: entidade.coordenada.metodo,
      via: "propria",
      origemId: entidade.id,
      origemTitulo: entidade.titulo,
    };
  }

  // `situado_em` é DIRIGIDA: o contido aponta para o continente. Só interessam as arestas
  // que SAEM desta entidade — a filtragem por `aresta.de` é o que impede a travessia de
  // descer para os vizinhos do lugar em vez de subir para o lugar.
  const continentes = vizinhos(entidadeId, "situado_em")
    .filter((v) => v.aresta.de === entidadeId)
    .map((v) => v.entidade);

  const espaco = continentes.find((e) => e.classe === "espaco" && e.coordenada);
  if (espaco?.coordenada) {
    return {
      coordenada: espaco.coordenada,
      metodo: espaco.coordenada.metodo,
      via: "espaco",
      origemId: espaco.id,
      origemTitulo: espaco.titulo,
    };
  }

  const territorios = continentes.filter((e) => e.classe === "territorio");
  for (const territorio of territorios) {
    if (territorio.coordenada) {
      return {
        coordenada: territorio.coordenada,
        metodo: territorio.coordenada.metodo,
        via: "territorio",
        origemId: territorio.id,
        origemTitulo: territorio.titulo,
      };
    }
  }
  for (const territorio of territorios) {
    const acima = subirTerritorio(territorio.id, 0);
    if (acima) return { ...acima, via: "territorio" };
  }

  // Nenhum caminho. NÃO existe ponto padrão (T-03-16).
  return null;
}

function subirTerritorio(id: string, profundidade: number): CoordenadaResolvida | null {
  if (profundidade > MAX_SUBIDA) return null;
  const entidade = porId(id);
  if (!entidade) return null;
  if (entidade.coordenada) {
    return {
      coordenada: entidade.coordenada,
      metodo: entidade.coordenada.metodo,
      via: "territorio",
      origemId: entidade.id,
      origemTitulo: entidade.titulo,
    };
  }
  for (const v of vizinhos(id, "situado_em")) {
    if (v.aresta.de !== id) continue;
    if (v.entidade.classe !== "territorio") continue;
    const acima = subirTerritorio(v.entidade.id, profundidade + 1);
    if (acima) return acima;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Aritmética de esfera — consumida pelo plano 03-05
// ---------------------------------------------------------------------------

const RAIO_TERRA_KM = 6371;

/**
 * Haversine entre duas coordenadas, em quilômetros.
 *
 * Aceita qualquer objeto com `lat` e `lon` — uma `Coordenada` do grafo satisfaz a forma —
 * porque o Modo Cidade também compara um ponto do acervo com um ponto de referência que não
 * é entidade nenhuma.
 *
 * O NÚMERO HERDA A PRECISÃO DA ORIGEM. As coordenadas do protótipo são centroides de
 * município: a distância entre duas entidades da MESMA cidade sai zero, e isso não é defeito
 * do cálculo, é o que o dado sabe. Quem exibe distância precisa dizer de onde ela veio.
 */
export function distanciaKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ---------------------------------------------------------------------------
// Agrupamento de pinos — T-03-18
// ---------------------------------------------------------------------------

/**
 * O lado da célula de agrupamento, em unidades de `viewBox`. 10 unidades = 1 grau ≈ 111 km
 * na latitude.
 *
 * A ESTRATÉGIA É GRADE, E NÃO RAIO, e a escolha tem uma razão que não é comodidade: numa
 * grade, dois pinos ou caem na mesma célula ou não caem, INDEPENDENTEMENTE de quais outros
 * pinos estejam na tela. Agrupamento por raio é sensível ao conjunto — o mesmo par de
 * entidades apareceria fundido num recorte e separado em outro, e a pessoa que chegou aqui
 * de Buscar veria um desenho diferente da que chegou de Acontece com o mesmo lugar dentro.
 * Um mapa que muda de forma conforme quem olha não é um mapa.
 *
 * O custo da grade é o artefato de fronteira: dois pinos a 5 km um do outro, em lados
 * opostos de uma linha da grade, ficam separados. É um preço declarado — e a legenda diz
 * que houve agrupamento e a partir de que distância.
 *
 * Os 8 espaços de Belém estão a centésimos de grau uns dos outros e caem todos na mesma
 * célula: viram UM pino com contagem 8, em vez de oito discos sobrepostos ilegíveis.
 */
export const RAIO_AGRUPAMENTO = 10;

/** A célula de grade a que um ponto projetado pertence. Chave estável, textual. */
export function celulaDe(x: number, y: number, raio: number = RAIO_AGRUPAMENTO): string {
  return `${Math.floor(x / raio)}:${Math.floor(y / raio)}`;
}

export interface PontoAgrupavel {
  chave: string;
  x: number;
  y: number;
}

export interface GrupoDePinos {
  celula: string;
  /** Centro do grupo: média das posições dos membros, não o centro da célula. */
  x: number;
  y: number;
  membros: string[];
}

/**
 * Funde pinos que caem na mesma célula de lado `raio`. A posição do grupo é a MÉDIA dos
 * membros — usar o centro da célula moveria o pino para um lugar onde não há nada.
 */
export function agruparPinos(
  pontos: readonly PontoAgrupavel[],
  { raio = RAIO_AGRUPAMENTO }: { raio?: number } = {},
): GrupoDePinos[] {
  const grupos = new Map<string, { x: number; y: number; membros: string[] }>();
  for (const p of pontos) {
    const celula = celulaDe(p.x, p.y, raio);
    const g = grupos.get(celula);
    if (g) {
      g.x += p.x;
      g.y += p.y;
      g.membros.push(p.chave);
    } else {
      grupos.set(celula, { x: p.x, y: p.y, membros: [p.chave] });
    }
  }
  return [...grupos].map(([celula, g]) => ({
    celula,
    x: g.x / g.membros.length,
    y: g.y / g.membros.length,
    membros: g.membros,
  }));
}

// ---------------------------------------------------------------------------
// O índice que atravessa para o cliente
// ---------------------------------------------------------------------------

/**
 * Vocabulários posicionais do índice. O índice é uma lista de TUPLAS, e não de objetos,
 * porque ele atravessa serializado dentro do HTML exportado: nomes de campo repetidos 1.380
 * vezes são bytes que a apresentação carrega sem usar. O custo é legibilidade do payload
 * cru, e é por isso que o formato está documentado aqui, ao lado do produtor.
 */
export const METODOS_INDEXADOS: readonly MetodoCoordenada[] = [
  "centroide-municipio",
  "centroide-estado",
  "centroide-pais",
  "deslocamento-por-espaco",
];

export const VIAS_INDEXADAS: readonly ViaCoordenada[] = ["propria", "espaco", "territorio"];

/**
 * `[chave, id, título, classe, x, y, método, via, corDaLinguagem, célula, dentroDoBrasil,
 *   eventos, imagem]`
 *
 * - `chave` é `{classe}_{slug}` — a MESMA gramática que as telas 03-01 e 03-04 escrevem no
 *   hash. É por ela que o recorte casa; o `id` canônico viaja junto porque é ele que o
 *   grafo entende e é ele que o pino publica em `data-pino`.
 * - `método` e `via` são ÍNDICES em `METODOS_INDEXADOS` e `VIAS_INDEXADAS`.
 * - `corDaLinguagem` é o NOME DO TOKEN (`"--ic-lilas"`), nunca o hex (D-08).
 * - `dentroDoBrasil` é `1` ou `0`. As de fora entram no índice de propósito: elas precisam
 *   ser CONTADAS e declaradas, e uma entidade ausente do índice seria indistinguível de uma
 *   sem coordenada nenhuma — duas situações diferentes que a tela precisa separar.
 * - `imagem` é o caminho local do acervo, `""` quando a entidade não tem. Viaja na tupla
 *   pela mesma razão de `eventos`: a folha do mapa desenha capa, e o cliente não alcança o
 *   grafo (DP-F).
 */
export type PinoIndexado = readonly [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  string,
  string,
  0 | 1,
  /**
   * Quantos EVENTOS do acervo se ligam a esta entidade.
   *
   * É a ordenação padrão da lista do mapa: alfabética, ela abria em «86» e «A. C.
   * D'Ávila» — os primeiros do alfabeto, que não são os mais relevantes de nada.
   * Quem tem mais eventos é quem o acervo mais documenta, e é por onde a pessoa
   * quer começar a olhar.
   *
   * Contado no BUILD, e por isso viaja como número: `mapa.tsx` é componente de
   * cliente e não alcança o grafo (DP-F). Uma contagem feita no navegador exigiria
   * as arestas do lado de lá — 13 MB que a fronteira existe para não atravessar.
   *
   * O QUE ESTE NÚMERO ALCANÇA, medido no acervo carregado: das 575 pessoas, 56
   * têm ao menos um evento (10%), com máximo de 8; nos coletivos é a mesma
   * proporção. Ou seja, a ordenação levanta ao topo as poucas dezenas que o
   * acervo de fato documenta e deixa os outros 90% empatados em zero, onde o
   * alfabeto desempata. Não é a ordenação que é rasa — é a ligação pessoa→evento
   * que o acervo publicado quase não tem, e a lista passa a mostrar isso em vez
   * de escondê-lo atrás de uma ordem que fingia não ter critério.
   *
   * Para uma entidade que É um evento o número NÃO é zero: eventos se ligam a
   * eventos, e 281 dos 300 têm ao menos um, com máximo de 40. Ali ele lê como
   * «faz parte de uma série grande», que é outra pergunta e continua verdadeira.
   */
  number,
  /** Caminho da imagem do acervo (`/acervo/…`), `""` quando não há. */
  string,
];

/**
 * O vocabulário de linguagens é LIDO, não decidido: `cor` já vem do gerador com o nome do
 * token CSS. Nenhuma associação linguagem→cor é tomada aqui (D-08), e por isso este import
 * não fere D-47: o vocabulário é artefato gerado à parte, e é a mesma porta que
 * `selo-linguagem.tsx` usa desde a fase 1.
 */
const COR_DA_LINGUAGEM = new Map(
  (vocabularioJson as Vocabulario).linguagens.map((l) => [l.id, l.cor]),
);

/** Todas as classes da ontologia. `slugsPorTipo` + `porSlug` é a porta de D-47. */
const CLASSES: readonly ClasseEntidade[] = [
  "pessoa",
  "coletivo",
  "instituicao",
  "espaco",
  "obra",
  "termo",
  "programa",
  "evento",
  "temporada",
  "ocorrencia",
  "conteudo",
  "midia",
  "publicacao",
  "formacao",
  "linguagem",
  "tema",
  "territorio",
  "pessoa-usuaria",
  "repertorio",
  "trilha",
];

let indiceMemorizado: PinoIndexado[] | null = null;

/**
 * Toda entidade do acervo cuja posição o grafo sustenta, já projetada.
 *
 * Roda uma vez, no build (D-24). O que NÃO está aqui é exatamente o que não tem caminho até
 * uma coordenada — e a tela conta essas, uma a uma, em vez de fingir que elas não existem.
 */
export function indiceDePinos(): PinoIndexado[] {
  if (indiceMemorizado) return indiceMemorizado;
  const saida: PinoIndexado[] = [];
  for (const classe of CLASSES) {
    for (const slug of slugsPorTipo(classe)) {
      const entidade = porSlug(classe, slug);
      if (!entidade) continue;
      const r = coordenadaDe(entidade.id);
      if (!r) continue;
      const bruto = projetar(r.coordenada);
      // ARREDONDA ANTES DE CALCULAR A CÉLULA. O índice viaja com uma casa decimal, e a
      // célula precisa ser a do número que viaja — não a do número que ficou aqui. Calcular
      // a célula sobre a posição cheia e a posição sobre a arredondada faria dois pontos
      // perto de uma linha da grade cair em células que a posição publicada não explica: o
      // desenho e o agrupamento discordariam em silêncio, que é o defeito que esta ordem
      // existe para não ter.
      const x = Number(bruto.x.toFixed(1));
      const y = Number(bruto.y.toFixed(1));
      const cor = entidade.linguagens.map((l) => COR_DA_LINGUAGEM.get(l)).find(Boolean) ?? "";
      saida.push([
        `${entidade.classe}_${entidade.slug}`,
        entidade.id,
        entidade.titulo,
        entidade.classe,
        x,
        y,
        METODOS_INDEXADOS.indexOf(r.metodo),
        VIAS_INDEXADAS.indexOf(r.via),
        cor,
        celulaDe(x, y),
        bruto.dentro ? 1 : 0,
        // A contagem que ordena a lista. `vizinhos` sem relação devolve toda a
        // adjacência da entidade; filtrar por classe aqui é mais barato que
        // percorrer relação por relação, e não presume qual relação liga gente a
        // evento — se o acervo ganhar outra, ela conta sozinha.
        vizinhos(entidade.id).filter((v) => v.entidade.classe === "evento").length,
        entidade.imagem ?? "",
      ]);
    }
  }
  indiceMemorizado = saida;
  return saida;
}

/**
 * O recorte padrão: o acervo situado DENTRO do Brasil, sem os territórios.
 *
 * Território fica de fora porque ele é o LUGAR, não o item do acervo — um mapa que
 * pusesse um pino em «Pará» ao lado dos pinos das entidades do Pará contaria o continente
 * como se fosse conteúdo. Território continua no índice: um recorte vindo de Buscar pode
 * citar um, e aí ele é posicionado como qualquer outro.
 */
export function acervoSituadoNoBrasil(): string[] {
  return indiceDePinos()
    .filter((p) => p[10] === 1 && p[3] !== "territorio")
    .map((p) => p[0]);
}

export interface RecorteResolvido {
  /** Posicionados no desenho: dentro do retângulo do Brasil. */
  posicionados: PinoIndexado[];
  /** Sem caminho até coordenada nenhuma. Contadas e nomeadas, NUNCA desenhadas. */
  semCoordenada: string[];
  /** Com coordenada, mas fora do retângulo do Brasil. Contadas, e também não desenhadas. */
  foraDoBrasil: PinoIndexado[];
}

/**
 * Divide um recorte nas TRÊS listas, e as três aparecem na tela.
 *
 * Nenhuma soma some: `posicionados + semCoordenada + foraDoBrasil` é o tamanho do recorte
 * que chegou. Uma entidade que o mapa não sabe posicionar é um fato sobre o acervo, e
 * escondê-la faria o desenho parecer mais completo do que o dado é.
 */
export function resolverRecorte(chaves: readonly string[]): RecorteResolvido {
  const indice = new Map(indiceDePinos().map((p) => [p[0], p]));
  const posicionados: PinoIndexado[] = [];
  const foraDoBrasil: PinoIndexado[] = [];
  const semCoordenada: string[] = [];
  for (const chave of chaves) {
    const pino = indice.get(chave);
    if (!pino) semCoordenada.push(chave);
    else if (pino[10] === 1) posicionados.push(pino);
    else foraDoBrasil.push(pino);
  }
  return { posicionados, semCoordenada, foraDoBrasil };
}

// ---------------------------------------------------------------------------
// Desertos culturais — D-62
// ---------------------------------------------------------------------------

/**
 * Um registro é UM VÍNCULO entre uma entidade e um lugar: uma aresta `situado_em` que sai
 * de uma entidade não-território e chega num território daquele estado, diretamente ou por
 * um município dentro dele.
 *
 * A UNIDADE É O VÍNCULO, E NÃO A ENTIDADE, e a diferença é declarada na tela junto do
 * número. Uma pessoa que a Enciclopédia situa em duas cidades de São Paulo produziu dois
 * registros de lugar no acervo — dois atos de documentação — e é isso que a camada mede:
 * quanto o acervo REGISTRA sobre cada estado. `entidades` traz a contagem distinta ao lado,
 * para que ninguém precise adivinhar qual das duas leituras está vendo.
 */
export interface DensidadeUf {
  sigla: string;
  titulo: string;
  registros: number;
  /** Entidades distintas por trás dos registros. Sempre ≤ `registros`. */
  entidades: number;
  /**
   * O estado existe como território no grafo? `false` em Sergipe e Tocantins, e é ESSE
   * campo que separa «estado com acervo magro» de «estado que o acervo não sabe que
   * existe». Zero registros com `noGrafo: true` seria um estado conhecido e vazio; zero com
   * `noGrafo: false` é ausência total, e a camada trata as duas de forma diferente.
   */
  noGrafo: boolean;
  coordenada: { lat: number; lon: number };
}

export interface Densidade {
  /** As 27, sempre. As 25 do grafo com a sua contagem, e as 2 ausentes com zero. */
  ufs: DensidadeUf[];
  total: number;
  doisMaiores: number;
  maximo: number;
  mediana: number;
  comUmRegistro: DensidadeUf[];
  semRegistro: DensidadeUf[];
  entidadesDistintas: number;
}

/** Os territórios contidos num estado, ele incluído. `situado_em` é DIRIGIDA. */
function territoriosDentro(estadoId: string): Set<string> {
  const dentro = new Set<string>([estadoId]);
  const fila = [estadoId];
  while (fila.length) {
    const atual = fila.shift() as string;
    for (const { aresta, entidade } of vizinhos(atual, "situado_em")) {
      if (aresta.para !== atual) continue;
      if (entidade.classe !== "territorio") continue;
      if (dentro.has(entidade.id)) continue;
      dentro.add(entidade.id);
      fila.push(entidade.id);
    }
  }
  return dentro;
}

let densidadeMemorizada: Densidade | null = null;

/**
 * A concentração da documentação cultural brasileira, contada.
 *
 * NENHUM NÚMERO DESTA CAMADA É ESCRITO À MÃO. Todos saem da travessia, no build. Se o grafo
 * mudar, os números mudam — e o gate, que compara com os valores medidos, para a execução em
 * vez de acomodar a diferença em silêncio.
 *
 * A LISTA DAS 27 VEM DA TABELA DE CENTROIDES, e não do grafo. É deliberado e é o ponto: o
 * grafo conhece 25 estados, a tabela conhece 27, e a diferença entre as duas listas É o
 * conteúdo da camada. Se a lista viesse do grafo, Sergipe e Tocantins simplesmente não
 * existiriam na tela — e a ausência mais eloquente do acervo ficaria invisível justamente
 * na tela feita para mostrá-la.
 */
export function densidadePorUf(): Densidade {
  if (densidadeMemorizada) return densidadeMemorizada;

  const siglaPorTitulo = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.titulo, u.sigla]));

  const estadosDoGrafo = new Map<string, string>();
  for (const slug of slugsPorTipo("territorio")) {
    const t = porSlug("territorio", slug);
    if (t?.coordenada?.metodo === "centroide-estado") estadosDoGrafo.set(t.titulo, t.id);
  }

  const distintas = new Set<string>();
  const ufs: DensidadeUf[] = [];

  for (const [titulo, centroide] of Object.entries(CENTROIDES.estados)) {
    const sigla = siglaPorTitulo.get(titulo);
    if (!sigla) {
      // Falha ALTA e não silenciosa: a tabela de centroides e os polígonos autorados são
      // duas listas das mesmas 27 unidades, e divergência entre elas apagaria um estado da
      // tela sem sintoma nenhum — o defeito exato que a camada existe para não ter.
      throw new Error(
        `«${titulo}» está na tabela de centroides e não tem polígono em contorno-brasil.ts`,
      );
    }
    const estadoId = estadosDoGrafo.get(titulo);
    if (!estadoId) {
      ufs.push({ sigla, titulo, registros: 0, entidades: 0, noGrafo: false, coordenada: centroide });
      continue;
    }

    let registros = 0;
    const noEstado = new Set<string>();
    for (const territorioId of territoriosDentro(estadoId)) {
      for (const { aresta, entidade } of vizinhos(territorioId, "situado_em")) {
        if (aresta.para !== territorioId) continue;
        if (entidade.classe === "territorio") continue;
        registros += 1;
        noEstado.add(entidade.id);
        distintas.add(entidade.id);
      }
    }
    ufs.push({
      sigla,
      titulo,
      registros,
      entidades: noEstado.size,
      noGrafo: true,
      coordenada: centroide,
    });
  }

  const ordenadas = [...ufs].sort((a, b) => b.registros - a.registros);
  const valores = ufs.map((u) => u.registros).sort((a, b) => a - b);
  const meio = Math.floor(valores.length / 2);
  const mediana =
    valores.length % 2 ? valores[meio] : (valores[meio - 1] + valores[meio]) / 2;

  densidadeMemorizada = {
    ufs,
    total: ufs.reduce((s, u) => s + u.registros, 0),
    doisMaiores: (ordenadas[0]?.registros ?? 0) + (ordenadas[1]?.registros ?? 0),
    maximo: ordenadas[0]?.registros ?? 0,
    mediana,
    comUmRegistro: ufs.filter((u) => u.registros === 1),
    semRegistro: ufs.filter((u) => u.registros === 0),
    entidadesDistintas: distintas.size,
  };
  return densidadeMemorizada;
}
