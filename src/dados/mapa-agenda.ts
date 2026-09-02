import {
  CONTORNO_BRASIL,
  ROTULO_CONTORNO,
} from "@/dados/contorno-brasil";
import {
  caminhoDe,
  coordenadaDe,
  LIMITES,
  METODOS_INDEXADOS,
  projetar,
  VIAS_INDEXADAS,
  type ViaCoordenada,
} from "@/dados/geo";
import type { MetodoCoordenada } from "@/dados/tipos";
import { montarAgenda, type TempoDoDia } from "@/dados/agenda";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import {
  FORA_DO_DESENHO,
  METODOS_DO_PINO,
  MOTIVOS_SEM_PINO,
  SEM_LUGAR,
  TEMPOS_DO_ITEM,
  VIAS_DO_ITEM,
  type IdDoRecorte,
  type ItemSerializado,
  type PinoSerializado,
} from "@/dados/mapa-agenda-wire";

export type {
  IdDoRecorte,
  ItemPareado,
  ItemSerializado,
  PinoPareado,
  PinoSerializado,
} from "@/dados/mapa-agenda-wire";

/**
 * mapa-agenda.ts — o módulo de build que casa a agenda com o mapa, e que MEDE a interseção
 * vazia entre as duas.
 *
 * Fase 5, plano 05-01. É o lado servidor da sincronia de D-81: aqui, no build, cada item da
 * lista ganha a MESMA chave do pino que o representa, e é essa chave que atravessa a
 * fronteira RSC como `data-par` nos dois lados da tela.
 *
 * DP-F. Este módulo importa `grafo.ts` e `geo.ts` POR VALOR e alcança os 23 MB do acervo.
 * Nenhum arquivo `"use client"` pode importá-lo por valor — só `import type`, que é apagado
 * na compilação e não arrasta módulo nenhum. Há gate transitivo medindo isso desde 04-05.
 *
 * ---------------------------------------------------------------------------
 * A MEDIDA QUE DECIDIU A FORMA DESTA TELA, E QUE ESTE MÓDULO CONFERE A CADA BUILD
 * ---------------------------------------------------------------------------
 *
 * A leitura ingênua de D-81 é «lista da agenda ao lado de um mapa sincronizado». Ela não é
 * construível neste acervo, e o motivo é medido e não estimado:
 *
 *   - `montarAgenda` devolve 129 eventos — os que têm ao menos uma sessão datada.
 *   - ZERO desses 129 tem coordenada resolvível por `coordenadaDe`. Nenhum.
 *   - 158 dos 300 eventos do grafo têm coordenada (101 pela via `espaco`, 57 pela via
 *     `territorio`), e TODOS os 158 são da Enciclopédia — nenhum vem da agenda do CMS.
 *   - A interseção entre «tem sessão datada» e «tem lugar» é 0.
 *
 * Uma lista da agenda ao lado de um mapa sincronizado teria zero pares: o realce nunca
 * dispararia e a tela seria um gate verde sobre uma tela morta. Por isso a lista da visão
 * web tem DOIS RECORTES, e o alternador entre eles É a declaração honesta de D-90 virada
 * controle — «por data» mostra os 129 e o mapa ao lado declara, com o denominador, que 0
 * deles pode ser posto no mapa; «por lugar» mostra os 158 situados, onde o par existe e a
 * sincronia é real nos dois sentidos.
 *
 * ---------------------------------------------------------------------------
 * A SEGUNDA MEDIDA, QUE O PLANO NÃO PREVIA, E QUE A TELA TAMBÉM DECLARA
 * ---------------------------------------------------------------------------
 *
 * Dos 158 eventos situados, apenas 110 caem DENTRO do retângulo do desenho. Os outros 48
 * têm coordenada real e verdadeira — Havana, Grande Londres, Itália, o litoral do Chile —
 * e o desenho desta tela é o contorno do Brasil.
 *
 * ELES NÃO SÃO DESENHADOS, e isso é a regra que a fase 3 instituiu e que este módulo herda:
 * `projetar` devolve a posição mesmo quando ela cai fora, e não grampeia nada para a borda,
 * porque grampear amontoaria as coordenadas estrangeiras no contorno do Brasil como se
 * estivessem no Brasil — uma afirmação falsa sobre lugar, feita em silêncio. Desenhá-los
 * fora do `viewBox` seria pior ainda: o SVG recorta o que passa da moldura, e os 48 pinos
 * existiriam no DOM, com `data-par` legível, sem um pixel na tela. Um gate contando
 * atributo passaria verde sobre 48 pinos invisíveis.
 *
 * Então os 48 entram na LISTA, contados e nomeados, com `mapeavel: false`, `par: null` e o
 * motivo escrito — e o número deles é um dos denominadores da declaração. Nenhuma soma
 * some: 110 mapeáveis + 48 fora do recorte = os 158 situados.
 */

// ---------------------------------------------------------------------------
// As constantes medidas, e a conferência que faz o módulo quebrar alto
// ---------------------------------------------------------------------------

/**
 * Os números apurados contra o grafo de 2026-08-22, REMEDIDOS em 2026-09-01 quando a
 * ingestão federada entrou: os 16 eventos datados do Theatro Municipal e do MASP levaram
 * «com sessão» de 129 para 145. A INTERSEÇÃO NÃO MUDOU e é isso que importa — parceiro
 * traz data, não traz território, então a afirmação de D-90 continua sendo «nenhum evento
 * cruza data futura com lugar», agora sobre um denominador maior. Eles NÃO são usados para produzir a
 * tela — tudo o que a tela imprime é contado no build. Eles existem para que um acervo
 * regerado que mudasse a forma do problema PARE DE COMPILAR em vez de deixar a tela mentir
 * em silêncio: a frase de D-90 diz «0 dos 129», e um acervo em que a interseção deixasse
 * de ser 0 faria essa frase virar mentira sem que ninguém percebesse.
 *
 * Mesmo molde de `ARESTAS_ENCENADAS_ESPERADAS` em `duplicatas.ts`.
 */
export const INTERSECCAO_ESPERADA = 0;
export const EVENTOS_COM_SESSAO_ESPERADOS = 145;
export const EVENTOS_COM_LUGAR_ESPERADOS = 158;

/** Teto declarado do DTO desta tela, em bytes. O orçamento deste plano na fase é 60 KB. */
export const TETO_DO_DTO = 60 * 1024;

function romper(mensagem: string): never {
  throw new Error(
    `mapa-agenda.ts: ${mensagem}. INTERSECCAO_ESPERADA, EVENTOS_COM_SESSAO_ESPERADOS e ` +
      `EVENTOS_COM_LUGAR_ESPERADOS foram medidas contra o grafo de 2026-08-22, e a frase de ` +
      `D-90 que a tela imprime é composta com elas. Se o grafo foi regerado, REESCREVA a ` +
      `declaração da interseção junto com a medida — não relaxe esta conferência, porque ` +
      `ela é a única coisa que impede a tela de afirmar um número que o acervo deixou de ter.`,
  );
}

// ---------------------------------------------------------------------------
// O DTO — só primitivo, serializável pela fronteira RSC
// ---------------------------------------------------------------------------

/**
 * O FORMATO DE FIO desta tela mora em `mapa-agenda-wire.ts`, e os tipos nomeados
 * `ItemPareado` e `PinoPareado` são reexportados acima. A razão está escrita lá por
 * extenso e é uma medida, não uma preferência: com campo nomeado, os dois recortes somam
 * 148.652 bytes contra o teto declarado de 61.440, e 39 KB disso são os NOMES dos campos
 * repetidos 287 vezes. Com tupla, o mesmo dado cabe. É o mesmo movimento que `geo.ts` fez
 * em `PinoIndexado` e `agenda.ts` nos arrays paralelos de `DiaDaAgenda`, pelo mesmo motivo.
 *
 * O consumidor não lida com posição: `expandirItem` e `expandirPino`, do módulo de fio,
 * devolvem o objeto nomeado do lado do cliente, onde ele custa zero byte.
 */

export interface RecorteDoMapa {
  id: IdDoRecorte;
  rotulo: string;
  itens: ItemSerializado[];
  pinos: PinoSerializado[];
  /** Quantos dos `total` têm pino no desenho. É o numerador que a tela imprime. */
  mapeaveis: number;
  total: number;
  /** A frase que este recorte imprime ao lado do mapa. Produto, não comentário. */
  declaracao: string;
}

/**
 * A declaração honesta de D-90, com os denominadores MEDIDOS no build. Nenhum destes
 * números é literal escrito à mão — todos saem da contagem, e `texto` é composto com eles
 * interpolados.
 */
export interface InterseccaoMedida {
  eventosNoAcervo: number;
  comSessao: number;
  comLugar: number;
  comOsDois: number;
  comLugarNoDesenho: number;
  comLugarForaDoDesenho: number;
  texto: string;
}

export interface MapaDaAgenda {
  recortes: RecorteDoMapa[];
  viewBox: string;
  contorno: string;
  rotuloContorno: string;
  interseccao: InterseccaoMedida;
  /** Tamanho deste DTO em `JSON.stringify`, medido. Teto declarado: 60 KB. */
  bytesDoDto: number;
}

// ---------------------------------------------------------------------------
// Leitura do acervo — tudo por grafo.ts (D-16, D-47)
// ---------------------------------------------------------------------------

interface EventoSituado {
  id: string;
  slug: string;
  titulo: string;
  classe: string;
  linguagens: string[];
  via: ViaCoordenada;
  metodo: MetodoCoordenada;
  lugar: string;
  x: number;
  y: number;
  noDesenho: boolean;
}

let situadosMemo: EventoSituado[] | null = null;

/**
 * Os eventos do grafo que têm coordenada resolvível, já projetados.
 *
 * ORDENADO POR ID, que é chave estável. Nada de `localeCompare`: ele depende do ICU do
 * ambiente e faria o HTML exportado sair diferente byte a byte em máquinas diferentes —
 * o mesmo motivo pelo qual `milhar()` existe em vez de `Intl.NumberFormat`.
 */
function eventosSituados(): EventoSituado[] {
  if (situadosMemo) return situadosMemo;
  const saida: EventoSituado[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const entidade = porSlug("evento", slug);
    if (!entidade) continue;
    const r = coordenadaDe(entidade.id);
    if (!r) continue;
    const p = projetar(r.coordenada);
    saida.push({
      id: entidade.id,
      slug: entidade.slug,
      titulo: entidade.titulo,
      classe: entidade.classe,
      linguagens: entidade.linguagens,
      via: r.via,
      metodo: r.metodo,
      lugar: r.origemTitulo,
      // Uma casa decimal, como `indiceDePinos` publica: a precisão que viaja é a que
      // desenha, e guardar mais casas seria byte pago por precisão que ninguém vê.
      x: Number(p.x.toFixed(1)),
      y: Number(p.y.toFixed(1)),
      noDesenho: p.dentro,
    });
  }
  saida.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  situadosMemo = saida;
  return saida;
}

/**
 * O tempo de um evento contra a data de referência do build.
 *
 * `proximaSessao` é, por construção de `montarAgenda`, a primeira sessão em `hoje` ou
 * depois — então ela ausente significa que TODAS já passaram, e ela igual a `hoje`
 * significa hoje. Nenhum relógio de runtime entra nesta conta (T-03-04): `hoje` é a data
 * do build, e desce por parâmetro.
 */
function tempoDe(proxima: string | null, hoje: string): TempoDoDia {
  if (!proxima) return "passado";
  return proxima.slice(0, 10) === hoje ? "hoje" : "futuro";
}

// ---------------------------------------------------------------------------
// A função pública
// ---------------------------------------------------------------------------

const memo = new Map<string, MapaDaAgenda>();

export function montarMapaDaAgenda({ hoje }: { hoje: string }): MapaDaAgenda {
  const guardado = memo.get(hoje);
  if (guardado) return guardado;

  const agenda = montarAgenda({ hoje });
  const situados = eventosSituados();
  const porIdSituado = new Map(situados.map((e) => [e.id, e]));

  // Espelho conferido. `VIAS_DO_ITEM` e `METODOS_DO_PINO` existem no módulo de fio para
  // que o cliente possa expandir as tuplas sem importar `geo.ts` por valor — o que
  // arrastaria `grafo.ts` e quebraria DP-F. Copiar é aceitável; DIVERGIR não é, e num
  // vocabulário posicional a divergência é silenciosa: os índices continuariam válidos e
  // a tela passaria a dizer «centroide de município» onde o pino veio de um espaço.
  if (VIAS_DO_ITEM.join("|") !== VIAS_INDEXADAS.join("|")) {
    romper(
      `VIAS_DO_ITEM («${VIAS_DO_ITEM.join(", ")}») divergiu de VIAS_INDEXADAS de geo.ts ` +
        `(«${VIAS_INDEXADAS.join(", ")}»)`,
    );
  }
  if (METODOS_DO_PINO.join("|") !== METODOS_INDEXADOS.join("|")) {
    romper(
      `METODOS_DO_PINO («${METODOS_DO_PINO.join(", ")}») divergiu de METODOS_INDEXADOS de ` +
        `geo.ts («${METODOS_INDEXADOS.join(", ")}»)`,
    );
  }

  const viaIdx = (v: ViaCoordenada) => VIAS_DO_ITEM.indexOf(v);
  const metodoIdx = (m: MetodoCoordenada) => METODOS_DO_PINO.indexOf(m);
  const tempoIdx = (t: TempoDoDia | null) => (t === null ? -1 : TEMPOS_DO_ITEM.indexOf(t));

  const pinoDe = (s: EventoSituado): PinoSerializado => [
    s.id,
    s.x,
    s.y,
    viaIdx(s.via),
    metodoIdx(s.metodo),
  ];

  // ---- Recorte POR DATA: os eventos com sessão datada ----
  //
  // `mapeavel` é CALCULADO, e não presumido. `EventoDaAgenda` não carrega `id`, só `slug`,
  // então o id é resolvido por `porSlug` — é aqui, no build, do lado servidor da fronteira
  // DP-F, que a agenda encontra a coordenada. O resultado desta conta é o 0 que a tela
  // declara; se ele deixar de ser 0, a conferência lá embaixo derruba o build.
  const comLugarNaAgenda: EventoSituado[] = [];
  const itensPorData: ItemSerializado[] = agenda.eventos.map((e) => {
    const entidade = porSlug("evento", e.slug);
    const situado = entidade ? porIdSituado.get(entidade.id) : undefined;
    if (situado) comLugarNaAgenda.push(situado);
    const mapeavel = Boolean(situado?.noDesenho);
    return [
      mapeavel ? situado!.id : null,
      e.slug,
      e.titulo,
      e.linguagens,
      situado?.lugar ?? null,
      situado ? viaIdx(situado.via) : -1,
      mapeavel ? -1 : situado ? FORA_DO_DESENHO : SEM_LUGAR,
      e.totalSessoes,
      e.proximaSessao,
      tempoIdx(tempoDe(e.proximaSessao, hoje)),
    ];
  });

  const pinosPorData: PinoSerializado[] = comLugarNaAgenda
    .filter((s) => s.noDesenho)
    .map(pinoDe);

  // ---- Recorte POR LUGAR: os eventos situados ----
  //
  // `totalSessoes: 0`, `proximaSessao: null` e `tempo: -1` para todos os 158 NÃO são
  // literais convenientes: a conferência de interseção logo abaixo é o que garante que
  // nenhum dos 158 tem sessão datada. No dia em que algum tiver, o build para aqui em vez
  // de a lista imprimir «0 sessões» sobre um evento que passou a ter.
  const itensPorLugar: ItemSerializado[] = situados.map((s) => [
    s.noDesenho ? s.id : null,
    s.slug,
    s.titulo,
    s.linguagens,
    s.lugar,
    viaIdx(s.via),
    s.noDesenho ? -1 : FORA_DO_DESENHO,
    0,
    null,
    -1,
  ]);

  const pinosPorLugar: PinoSerializado[] = situados.filter((s) => s.noDesenho).map(pinoDe);

  // ---- Os denominadores, todos contados ----
  const comSessao = agenda.eventos.length;
  const comLugar = situados.length;
  const comOsDois = comLugarNaAgenda.length;
  const comLugarNoDesenho = situados.filter((s) => s.noDesenho).length;
  const comLugarForaDoDesenho = comLugar - comLugarNoDesenho;
  const eventosNoAcervo = agenda.diagnostico.eventosNoAcervo;

  if (comOsDois !== INTERSECCAO_ESPERADA) {
    romper(
      `a interseção entre «tem sessão datada» e «tem lugar» virou ${comOsDois}, e a ` +
        `declaração de D-90 na tela afirma ${INTERSECCAO_ESPERADA}`,
    );
  }
  if (comSessao !== EVENTOS_COM_SESSAO_ESPERADOS) {
    romper(
      `os eventos com sessão datada viraram ${comSessao} contra os ` +
        `${EVENTOS_COM_SESSAO_ESPERADOS} medidos`,
    );
  }
  if (comLugar !== EVENTOS_COM_LUGAR_ESPERADOS) {
    romper(
      `os eventos com lugar viraram ${comLugar} contra os ${EVENTOS_COM_LUGAR_ESPERADOS} medidos`,
    );
  }

  const texto =
    `Dos ${eventosNoAcervo} eventos do acervo, ${comSessao} têm sessão datada e ` +
    `${comLugar} têm lugar — e ${comOsDois} têm as duas coisas. A interseção é vazia, e ` +
    `isso não é falha de importação: os eventos da agenda do Itaú Cultural chegam com data ` +
    `e sem nenhum território ligado ao registro, enquanto os da Enciclopédia chegam com ` +
    `território e com ano histórico, não com sessão. É por isso que o recorte «por lugar» ` +
    `responde o que EXISTE no território, e não o que está em cartaz nele: são perguntas ` +
    `diferentes porque são duas fontes diferentes dentro do mesmo acervo. Dos ${comLugar} ` +
    `situados, ${comLugarNoDesenho} caem dentro do contorno do Brasil e vão para o mapa; os ` +
    `outros ${comLugarForaDoDesenho} têm coordenada verdadeira fora dele — Havana, Grande ` +
    `Londres, Itália — e ficam na lista, contados e nomeados, sem serem desenhados: ` +
    `empurrá-los para a borda os poria no Brasil, e recortá-los na moldura do desenho os ` +
    `deixaria no DOM sem um pixel na tela.`;

  const recortes: RecorteDoMapa[] = [
    {
      id: "data",
      rotulo: "por data",
      itens: itensPorData,
      pinos: pinosPorData,
      mapeaveis: pinosPorData.length,
      total: itensPorData.length,
      declaracao:
        `${pinosPorData.length} dos ${itensPorData.length} eventos com sessão datada podem ` +
        `ir para o mapa. O mapa ao lado está vazio porque a agenda do CMS não liga ` +
        `território a evento nenhum — o denominador é ${itensPorData.length}, e o ` +
        `numerador é ${pinosPorData.length}.`,
    },
    {
      id: "lugar",
      rotulo: "por lugar",
      itens: itensPorLugar,
      pinos: pinosPorLugar,
      mapeaveis: pinosPorLugar.length,
      total: itensPorLugar.length,
      declaracao:
        `${pinosPorLugar.length} dos ${itensPorLugar.length} eventos situados estão no mapa ` +
        `ao lado, e cada um deles é a MESMA entidade nos dois lados: passar o cursor sobre ` +
        `a linha realça o pino, e sobre o pino realça a linha. Os outros ` +
        `${itensPorLugar.length - pinosPorLugar.length} têm lugar declarado fora do contorno ` +
        `do Brasil e continuam na lista, sem pino.`,
    },
  ];

  const interseccao: InterseccaoMedida = {
    eventosNoAcervo,
    comSessao,
    comLugar,
    comOsDois,
    comLugarNoDesenho,
    comLugarForaDoDesenho,
    texto,
  };

  const parcial: MapaDaAgenda = {
    recortes,
    viewBox: LIMITES.viewBox,
    contorno: caminhoDe(CONTORNO_BRASIL),
    rotuloContorno: ROTULO_CONTORNO,
    interseccao,
    bytesDoDto: 0,
  };
  const montado: MapaDaAgenda = {
    ...parcial,
    bytesDoDto: JSON.stringify(parcial).length,
  };

  if (montado.bytesDoDto > TETO_DO_DTO) {
    romper(
      `o DTO ficou com ${montado.bytesDoDto} bytes, acima do teto declarado de ` +
        `${TETO_DO_DTO}. O orçamento desta fase é 1.600 KB de chunks e este plano gasta no ` +
        `máximo 60 KB dele`,
    );
  }

  memo.set(hoje, montado);
  return montado;
}

/**
 * Os números desta tela, calculados. É o que 05-08 mede contra o que a tela imprime — sem
 * ele, a suíte teria de reescrever a contagem e as duas poderiam divergir.
 *
 * A data de referência é a mesma do build de hoje; `montarMapaDaAgenda` é memoizado por
 * data, então esta chamada não repete travessia nenhuma.
 */
export const NUMEROS_DO_MAPA_DA_AGENDA = (() => {
  const m = montarMapaDaAgenda({ hoje: DATA_DE_REFERENCIA });
  const porData = m.recortes.find((r) => r.id === "data")!;
  const porLugar = m.recortes.find((r) => r.id === "lugar")!;
  return {
    eventosNoAcervo: m.interseccao.eventosNoAcervo,
    comSessao: m.interseccao.comSessao,
    comLugar: m.interseccao.comLugar,
    interseccao: m.interseccao.comOsDois,
    comLugarNoDesenho: m.interseccao.comLugarNoDesenho,
    comLugarForaDoDesenho: m.interseccao.comLugarForaDoDesenho,
    itensPorData: porData.total,
    pinosPorData: porData.mapeaveis,
    itensPorLugar: porLugar.total,
    pinosPorLugar: porLugar.mapeaveis,
    bytesDoDto: m.bytesDoDto,
    tetoDoDto: TETO_DO_DTO,
  };
})();
