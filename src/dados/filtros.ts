/**
 * filtros.ts — as 8 dimensões de acessibilidade como CRITÉRIO, e os critérios que o
 * acervo não sustenta, nomeados (D-91, D-90, D-43).
 *
 * Módulo de build puro, síncrono e memoizado, no molde de `duplicatas.ts` e
 * `mapa-agenda.ts`: importa `grafo.ts` POR VALOR, roda uma vez no carregamento do módulo
 * — que sob `output: "export"` (D-24) é o build — e quebra alto quando o acervo regerado
 * deixa de sustentar o que a tela afirma.
 *
 * DP-F: nada `"use client"` importa este arquivo POR VALOR. `grafo.ts` carrega
 * `entidades.json` (9,4 MB) e `arestas.json` (13,6 MB); a fronteira é segurada pelo
 * componente de servidor de `/filtros`, que chama daqui e desce o DTO por propriedade.
 * O componente de cliente importa deste arquivo SÓ TIPO.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE MÓDULO EXISTE, quando `indice.ts` já tem facetas
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `indice.ts` NÃO indexa acessibilidade. As facetas dele são classe, linguagem, tema,
 * procedência e território — e acrescentar acessibilidade lá dentro mudaria o DTO de uma
 * tela da fase 3 que já está verificada. As contagens por dimensão têm de ser calculadas
 * aqui, no build, e descer por propriedade.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OS DOIS UNIVERSOS, E POR QUE ELES NÃO SÃO O MESMO NÚMERO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Este é o ponto onde a tela mentiria em silêncio se o módulo não separasse:
 *
 *   ACERVO      7.810 entidades, todas as 19 classes. É o universo do DIAGNÓSTICO —
 *               «5 das 8 dimensões medem zero» é uma afirmação sobre o acervo inteiro,
 *               e é ela que sustenta o argumento de D-91.
 *
 *   ÍNDICE      5.092 entradas, 15 classes (`ocorrencia`, `temporada`, `pessoa-usuaria`
 *               e `repertorio` ficam fora, cada uma com motivo em `CLASSES_EXCLUIDAS`).
 *               É o universo do CONTADOR AO VIVO — o que se pode marcar e buscar.
 *
 * E dentro do acervo há ainda dois recortes que não se somam:
 *
 *   `declaradaVerdadeira`  conta só `procedencia: "ic"` — o que a FONTE declarou.
 *                          Libras: 56.
 *   `incluindoDerivadas`   conta as 7.810 — a mesma ficha herdada pelas 2.425 ocorrências
 *                          e 287 temporadas que o gerador derivou do evento. Libras: 180.
 *
 * Os 180 não são 180 declarações: são 56 declarações e 124 heranças da mesma declaração.
 * Mostrar 180 como «quantos oferecem Libras» inflaria o acervo em 3,2 vezes com cópias do
 * mesmo fato. Por isso `declaradaVerdadeira` — o número que a tela mostra ao lado do
 * rótulo — é o de `ic`, e os outros dois ficam ao lado dele, nomeados, em vez de sumirem.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * D-43 É CAMPO, NÃO PROSA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Em `Acessibilidade` um `false` significa «a ficha foi preenchida e disse que não» E
 * «ninguém preencheu ficha nenhuma» ao mesmo tempo. Só `Entidade.declaraAcessibilidade`
 * separa os dois. 5.108 declaram, 2.702 não. Para quem depende de Libras, «não sabemos» e
 * «não tem» são coisas diferentes na vida real — e por isso a distinção desce como campo
 * marcável, e não como nota de rodapé.
 */

import { porSlug, slugsPorTipo, vizinhos, contagens } from "./grafo";
import { DIMENSOES, ROTULO_DIMENSAO } from "./agenda";
import { NUMEROS_DO_MAPA_DA_AGENDA } from "./mapa-agenda";
import {
  consultar,
  expandirIndice,
  type Consulta,
  type Criterio,
  type IndiceDTO,
} from "./indice";
import { trilhas, type TrilhaResumo } from "./trilha";
import type { ClasseEntidade, DimensaoAcessibilidade, Entidade } from "./tipos";

// ---------------------------------------------------------------------------
// Invariantes que derrubam o build
// ---------------------------------------------------------------------------

/**
 * Oito, e o número está aqui em vez de embutido numa comparação para o erro poder citá-lo.
 * `DIMENSOES` vem de `Object.keys(ROTULO_DIMENSAO)`, que é `Record<DimensaoAcessibilidade,
 * string>` — acrescentar dimensão em `tipos.ts` sem escrever o rótulo é erro de
 * compilação, e acrescentar as duas sem revisar esta tela é erro de build.
 */
export const DIMENSOES_ESPERADAS = 8;

/** O acervo gerado. `RESUMO_DA_FICHA` tem de fatiar exatamente isto. */
export const ENTIDADES_ESPERADAS = 7810;

/** Teto do DTO que atravessa a fronteira RSC. 30 KB, medido a cada build. */
export const TETO_DO_DTO = 30 * 1024;

// ---------------------------------------------------------------------------
// Milhar — à mão, como o resto do projeto
// ---------------------------------------------------------------------------

/**
 * `toLocaleString` é proibido no projeto: sob `output: "export"` este texto nasce no build
 * e é hidratado no navegador de quem avalia, e ICU diferente entre as duas pontas
 * divergiria — o gate de console limpo cairia por causa de um separador de milhar.
 */
export function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------------------------------------------------------------------------
// A varredura do acervo — uma vez, por travessia pública (D-16/D-47)
// ---------------------------------------------------------------------------

interface Varredura {
  entidades: number;
  /** `procedencia: "ic"` — o que a FONTE declarou. */
  porDimensaoNaFonte: Record<DimensaoAcessibilidade, number>;
  /** As 7.810, incluindo a ficha herdada por ocorrência e temporada. */
  porDimensaoIncluindoDerivadas: Record<DimensaoAcessibilidade, number>;
  declaram: number;
  naoDeclaram: number;
  declaramPorClasse: Record<string, number>;
  /** Das que declaram a ficha, quantas são `ic` — o denominador do número da fonte. */
  declaramNaFonte: number;
}

function zerado(): Record<DimensaoAcessibilidade, number> {
  return Object.fromEntries(DIMENSOES.map((d) => [d, 0])) as Record<
    DimensaoAcessibilidade,
    number
  >;
}

/**
 * Enumera as 7.810 entidades por `slugsPorTipo` + `porSlug` — nenhuma varredura de array
 * cru (D-47). A volta é exata: slug é único por classe no grafo gerado, e a conferência
 * abaixo derruba o build se deixar de ser.
 */
const VARREDURA: Varredura = (() => {
  const v: Varredura = {
    entidades: 0,
    porDimensaoNaFonte: zerado(),
    porDimensaoIncluindoDerivadas: zerado(),
    declaram: 0,
    naoDeclaram: 0,
    declaramPorClasse: {},
    declaramNaFonte: 0,
  };

  const classes = Object.keys(contagens().porClasse) as ClasseEntidade[];
  for (const classe of classes) {
    for (const slug of slugsPorTipo(classe)) {
      const e: Entidade | undefined = porSlug(classe, slug);
      if (!e) continue;
      v.entidades += 1;

      if (e.declaraAcessibilidade) {
        v.declaram += 1;
        v.declaramPorClasse[e.classe] = (v.declaramPorClasse[e.classe] ?? 0) + 1;
        if (e.procedencia === "ic") v.declaramNaFonte += 1;
      } else {
        v.naoDeclaram += 1;
      }

      for (const d of DIMENSOES) {
        if (!e.acessibilidade?.[d]) continue;
        v.porDimensaoIncluindoDerivadas[d] += 1;
        if (e.procedencia === "ic") v.porDimensaoNaFonte[d] += 1;
      }
    }
  }

  if (v.entidades !== ENTIDADES_ESPERADAS) {
    throw new Error(
      `filtros.ts: a travessia alcançou ${v.entidades} entidades e o acervo declara ` +
        `${ENTIDADES_ESPERADAS}. Ou o grafo foi regerado, ou slug deixou de ser único por ` +
        `classe e porSlug perdeu entidade pelo caminho. NÃO relaxe esta conferência: todo ` +
        `denominador que a tela de filtros mostra é fatia deste total, e um total errado ` +
        `faz as fatias mentirem sem que nada fique vermelho.`,
    );
  }
  if (v.declaram + v.naoDeclaram !== v.entidades) {
    throw new Error(
      `filtros.ts: a ficha de acessibilidade fatiou ${v.declaram} + ${v.naoDeclaram} = ` +
        `${v.declaram + v.naoDeclaram}, e as entidades são ${v.entidades}. A distinção de ` +
        `D-43 entre declarado-ausente e não-declarado é uma PARTIÇÃO: sem soma fechada ela ` +
        `deixa de ser leitura do acervo e vira duas contagens quaisquer.`,
    );
  }
  return v;
})();

// ---------------------------------------------------------------------------
// As 8 dimensões contadas
// ---------------------------------------------------------------------------

export interface DimensaoContada {
  campo: DimensaoAcessibilidade;
  /** Em português, de `ROTULO_DIMENSAO` de `agenda.ts` — nunca reescrito aqui. */
  rotulo: string;
  /** Entidades `ic` com o booleano verdadeiro. É o que a FONTE declarou. */
  declaradaVerdadeira: number;
  /** As 7.810, contando a ficha herdada por ocorrência e temporada. */
  incluindoDerivadas: number;
  /** O denominador honesto: quantas das 5.108 que declararam a ficha. */
  entreAsQueDeclaram: number;
  /** Das 2.603 `ic` que declararam a ficha — o denominador do número da fonte. */
  entreAsQueDeclaramNaFonte: number;
  /** Quantas das 5.092 entradas BUSCÁVEIS. É sobre este que o contador ao vivo corre. */
  noIndice: number;
  /** Falso quando `declaradaVerdadeira` é zero. Cinco das oito. */
  sustentada: boolean;
  /** A frase de D-90, obrigatória quando não sustentada. Sempre com o denominador. */
  declaracao: string | null;
}

let memoDimensoes: DimensaoContada[] | null = null;

/**
 * As 8, iterando sobre a CHAVE DO TIPO.
 *
 * `DIMENSOES` é `Object.keys(ROTULO_DIMENSAO)`, e `ROTULO_DIMENSAO` é `Record` completo
 * de `DimensaoAcessibilidade`. Uma lista literal paralela aqui divergiria do tipo na
 * primeira dimensão nova e a tela mostraria 8 de 9 sem nada ficar vermelho.
 *
 * `noIndice` fica em zero até `montarAcessibilidade` medir contra um índice — ele é a
 * contagem no universo BUSCÁVEL, e este módulo não monta índice por conta própria.
 */
export function dimensoesDeAcessibilidade(): DimensaoContada[] {
  if (memoDimensoes) return memoDimensoes;

  const lista: DimensaoContada[] = DIMENSOES.map((campo) => {
    const naFonte = VARREDURA.porDimensaoNaFonte[campo];
    const derivadas = VARREDURA.porDimensaoIncluindoDerivadas[campo];
    const sustentada = naFonte > 0;
    return {
      campo,
      rotulo: ROTULO_DIMENSAO[campo],
      declaradaVerdadeira: naFonte,
      incluindoDerivadas: derivadas,
      entreAsQueDeclaram: VARREDURA.declaram,
      entreAsQueDeclaramNaFonte: VARREDURA.declaramNaFonte,
      noIndice: 0,
      sustentada,
      declaracao: sustentada
        ? null
        : `0 de ${milhar(VARREDURA.declaram)} registros que preencheram a ficha declaram ` +
          `${ROTULO_DIMENSAO[campo].toLowerCase()} — a dimensão existe no catálogo e ` +
          `não aparece uma vez no acervo publicado. Marcar este critério devolve nenhum ` +
          `resultado, e é esse zero que está sendo mostrado.`,
    };
  });

  if (lista.length !== DIMENSOES_ESPERADAS) {
    throw new Error(
      `filtros.ts: contei ${lista.length} dimensões de acessibilidade e a ontologia do CMS ` +
        `tem ${DIMENSOES_ESPERADAS}. A tela de filtros afirma «as 8 dimensões» em texto de ` +
        `produto e mostra um controle para cada uma; com outro número ela passa a afirmar ` +
        `algo que o acervo não sustenta. REESCREVA a afirmação junto com a medida.`,
    );
  }
  for (const d of lista) {
    if (!d.sustentada && !d.declaracao) {
      throw new Error(
        `filtros.ts: ${d.campo} mede zero e chegou sem declaração. D-90 exige que o ` +
          `indicador sem lastro apareça DECLARANDO a ausência com o denominador — nunca ` +
          `zerado sem explicação.`,
      );
    }
  }

  memoDimensoes = lista;
  return lista;
}

// ---------------------------------------------------------------------------
// D-43 — a ficha, em campo
// ---------------------------------------------------------------------------

export interface ResumoDaFicha {
  /** Preencheram a ficha das 8 dimensões. */
  declaram: number;
  /** Nunca declararam nada — e nelas um `false` não é uma negação, é silêncio. */
  naoDeclaram: number;
  total: number;
  /** Quem declara, por classe da ontologia. As 12 classes ausentes não declaram nenhuma. */
  porClasse: Record<string, number>;
  /** Das que declaram, quantas são `ic`. */
  declaramNaFonte: number;
}

export const RESUMO_DA_FICHA: ResumoDaFicha = (() => {
  const r: ResumoDaFicha = {
    declaram: VARREDURA.declaram,
    naoDeclaram: VARREDURA.naoDeclaram,
    total: VARREDURA.entidades,
    porClasse: { ...VARREDURA.declaramPorClasse },
    declaramNaFonte: VARREDURA.declaramNaFonte,
  };
  const soma = Object.values(r.porClasse).reduce((a, b) => a + b, 0);
  if (soma !== r.declaram) {
    throw new Error(
      `filtros.ts: as fatias por classe somam ${soma} e ${r.declaram} entidades declaram a ` +
        `ficha. A tela mostra as duas coisas lado a lado e a diferença ficaria visível como ` +
        `um buraco sem nome.`,
    );
  }
  if (r.declaram + r.naoDeclaram !== ENTIDADES_ESPERADAS) {
    throw new Error(
      `filtros.ts: RESUMO_DA_FICHA fatiou ${r.declaram + r.naoDeclaram} e o acervo tem ` +
        `${ENTIDADES_ESPERADAS} entidades.`,
    );
  }
  return r;
})();

// ---------------------------------------------------------------------------
// Os critérios que o acervo NÃO sustenta (D-90, D-91)
// ---------------------------------------------------------------------------

/**
 * `nao-recorta` — o campo EXISTE no grafo e não discrimina: oferecê-lo devolveria tudo.
 * `inexistente` — o campo NÃO EXISTE em lugar nenhum do acervo. Não há o que oferecer.
 *
 * Os dois são recusas, e são recusas diferentes. Colapsá-las num «não temos esse filtro»
 * apagaria justamente o diagnóstico: um diz que a fonte não preencheu, o outro diz que a
 * fonte não modela.
 */
export type TipoSemLastro = "nao-recorta" | "inexistente";

export interface DenominadorMedido {
  chave: string;
  rotulo: string;
  n: number;
}

export interface CriterioSemLastro {
  campo: string;
  rotulo: string;
  tipo: TipoSemLastro;
  /** Os números que sustentam a recusa. Sempre ao menos um. */
  denominadores: DenominadorMedido[];
  /** A frase que vai para a tela, em texto de PRODUTO — não anotação. */
  frase: string;
}

/**
 * Gratuidade e faixa etária, medidas.
 *
 * GRATUIDADE. A fase 3 já recusou a faceta em `/buscar` e deixou o motivo em texto de
 * produto na tela; a fase 2 já o tinha escrito em `frase.ts` (`GRATUIDADE_MEDIDA`). O
 * raciocínio é o mesmo e não está sendo inventado de novo aqui: `Ocorrencia.gratuito` é a
 * NEGAÇÃO de um campo de ingresso que nenhum dos 300 eventos preenche, então as 2.425
 * sessões saem todas gratuitas e o filtro passaria 100% do que é datado.
 *
 * FAIXA ETÁRIA. `disposicoes.ts` já escreveu esta decisão por extenso e o predicado dela
 * devolve `indeterminado` de propósito. A frase abaixo cita o mesmo raciocínio de lá — «o
 * CMS modela 8 dimensões de acessibilidade e nenhuma de classificação indicativa; a
 * Enciclopédia é verbete, não bilheteria; casar por palavra no título seria inventar a
 * classificação». Duas telas do protótipo pedem faixa etária (a tela 2 do onboarding e a
 * tela 9 dos filtros) e as duas têm de dizer a MESMA coisa, ou o protótipo se contradiz na
 * frente da banca.
 *
 * As contagens vêm da varredura, não de literal: `eventos` e `ocorrencias` são medidos.
 */
const eventosNoAcervo = contagens().porClasse.evento ?? 0;
const ocorrenciasNoAcervo = contagens().porClasse.ocorrencia ?? 0;

export const CRITERIOS_SEM_LASTRO: readonly CriterioSemLastro[] = [
  {
    campo: "gratuidade",
    rotulo: "Gratuidade",
    tipo: "nao-recorta",
    denominadores: [
      {
        chave: "eventos-com-ingresso-declarado",
        rotulo: `de ${milhar(eventosNoAcervo)} eventos declaram ingresso`,
        n: 0,
      },
      {
        chave: "ocorrencias-gratuitas",
        rotulo: `de ${milhar(ocorrenciasNoAcervo)} sessões saem gratuitas`,
        n: ocorrenciasNoAcervo,
      },
    ],
    frase:
      `Gratuidade não recorta nada neste acervo, e por isso não vira controle. ` +
      `${milhar(0)} de ${milhar(eventosNoAcervo)} eventos declaram ingresso, então ` +
      `${milhar(ocorrenciasNoAcervo)} de ${milhar(ocorrenciasNoAcervo)} sessões saem ` +
      `gratuitas — «gratuito» aqui é a negação de um campo que ninguém preencheu. Um filtro ` +
      `de gratuidade passaria 100% do que é datado. Oferecê-lo sem dizer isso faria quem ` +
      `avalia concluir que o acervo inteiro é de graça.`,
  },
  {
    campo: "faixa-etaria",
    rotulo: "Faixa etária",
    tipo: "inexistente",
    denominadores: [
      {
        chave: "entidades-com-classificacao",
        rotulo: `de ${milhar(ENTIDADES_ESPERADAS)} registros trazem classificação indicativa`,
        n: 0,
      },
      {
        chave: "dimensoes-de-classificacao-no-cms",
        rotulo: `dimensões de classificação indicativa no catálogo (contra ${DIMENSOES_ESPERADAS} de acessibilidade)`,
        n: 0,
      },
    ],
    frase:
      `Faixa etária não existe no acervo — nem no catálogo, nem na Enciclopédia, nem nos ` +
      `${milhar(ENTIDADES_ESPERADAS)} registros. O catálogo modela ` +
      `${DIMENSOES_ESPERADAS} dimensões de acessibilidade e NENHUMA de classificação ` +
      `indicativa; a Enciclopédia é verbete, não bilheteria. Adivinhar por palavra no ` +
      `título — «infantil» — seria inventar a classificação e apresentá-la como filtro. ` +
      `Este critério fica na tela, nomeado e não marcável: dizer que o campo não existe é ` +
      `mais forte do que um seletor que devolve tudo.`,
  },
] as const;

// ---------------------------------------------------------------------------
// As trilhas curadas — para a tela de zero-resultado
// ---------------------------------------------------------------------------

/**
 * Os resumos de `trilhas()`. O acervo tem UMA — e é por isso que a tela de zero-resultado
 * diz «a trilha que existe» com o número, e não «trilhas relacionadas» no plural fingindo
 * um catálogo (D-90).
 */
export const TRILHAS_RELACIONADAS: readonly TrilhaResumo[] = trilhas();

// ---------------------------------------------------------------------------
// O DTO que atravessa a fronteira
// ---------------------------------------------------------------------------

/**
 * A ficha de uma entrada do índice, comprimida em UM inteiro de 9 bits.
 *
 * Bits 0..7: as 8 dimensões, na ordem de `DIMENSOES`. Bit 8: `declaraAcessibilidade`.
 * A ordem dos bits é a ordem do tipo, e o DTO carrega `ordemDosBits` para o cliente não
 * ter de presumi-la — presumir seria a segunda cópia da lista que o módulo inteiro existe
 * para não ter.
 */
export const BIT_DECLARA = 1 << DIMENSOES_ESPERADAS;

export interface AcessibilidadeDTO {
  versao: 1;
  /** Igual a `IndiceDTO.total`. Conferido na montagem. */
  total: number;
  /** A ordem dos 8 bits, que é a ordem do tipo `Acessibilidade`. */
  ordemDosBits: DimensaoAcessibilidade[];
  /** O bit da ficha, para o cliente não recalcular o deslocamento. */
  bitDeclara: number;
  /**
   * ESPARSO: só as entradas com algum bit ligado, como `[posição, bits]`.
   *
   * Denso seriam 5.092 pares; esparso são as ~2.554 que declaram a ficha mais as ~49 que
   * marcam alguma dimensão. Como quase tudo que declara tem só o bit da ficha, o formato
   * separa os dois vetores abaixo em vez de repetir o mesmo valor milhares de vezes.
   */
  /** Posições que DECLARAM a ficha, como deltas acumulados (números menores, JSON menor). */
  declaram: number[];
  /** Posições com alguma dimensão marcada, `[posição, bits das 8]`. */
  marcadas: Array<[number, number]>;
  /** Ordem em que as posições foram atribuídas: `{classe}_{slug}` crescente, a do índice. */
  ordem: string;
  /** Tamanho serializado, medido. */
  bytesDoDto: number;
  tetoDoDto: number;
}

/**
 * Monta o DTO ALINHADO AO ÍNDICE, por construção e não por coincidência.
 *
 * A posição `i` do DTO é a entrada `i` de `expandirIndice(indice)`. Em vez de repetir a
 * enumeração e a ordenação de `montarIndice` — e torcer para as duas continuarem iguais —,
 * esta função LÊ as entradas já expandidas e busca cada uma no grafo por `classe`/`slug`.
 * Alinhamento por construção: se `montarIndice` mudar de ordem amanhã, este DTO muda
 * junto, sem nada aqui saber disso.
 */
export function montarAcessibilidade(indice: IndiceDTO): AcessibilidadeDTO {
  const entradas = expandirIndice(indice);
  const declaram: number[] = [];
  const marcadas: Array<[number, number]> = [];
  let ausentesNoGrafo = 0;

  for (let i = 0; i < entradas.length; i += 1) {
    const e = porSlug(entradas[i].classe, entradas[i].slug);
    if (!e) {
      ausentesNoGrafo += 1;
      continue;
    }
    if (e.declaraAcessibilidade) declaram.push(i);
    let bits = 0;
    for (let b = 0; b < DIMENSOES.length; b += 1) {
      if (e.acessibilidade?.[DIMENSOES[b]]) bits |= 1 << b;
    }
    if (bits) marcadas.push([i, bits]);
  }

  if (ausentesNoGrafo) {
    throw new Error(
      `filtros.ts: ${ausentesNoGrafo} entrada(s) do índice não voltaram do acervo por ` +
        `classe/slug. O DTO de acessibilidade é POSICIONAL contra o índice, e uma entrada ` +
        `perdida deslocaria todas as seguintes — o contador ao vivo passaria a atribuir a ` +
        `ficha de uma entidade a outra, em silêncio.`,
    );
  }

  const dto: AcessibilidadeDTO = {
    versao: 1,
    total: entradas.length,
    ordemDosBits: [...DIMENSOES],
    bitDeclara: BIT_DECLARA,
    declaram,
    marcadas,
    ordem: "{classe}_{slug} crescente — a mesma de montarIndice",
    bytesDoDto: 0,
    tetoDoDto: TETO_DO_DTO,
  };

  if (dto.total !== indice.total) {
    throw new Error(
      `filtros.ts: o DTO de acessibilidade tem ${dto.total} posições e o índice tem ` +
        `${indice.total}.`,
    );
  }

  dto.bytesDoDto = Buffer.byteLength(JSON.stringify(dto), "utf8");
  if (dto.bytesDoDto > TETO_DO_DTO) {
    throw new Error(
      `filtros.ts: o DTO de acessibilidade ficou com ${dto.bytesDoDto} bytes, acima do teto ` +
        `declarado de ${TETO_DO_DTO}. Corte CAMPO — não relaxe o teto: o que atravessa a ` +
        `fronteira RSC viaja no HTML de toda visita a /filtros.`,
    );
  }
  return dto;
}

/**
 * As dimensões contadas TAMBÉM no universo buscável.
 *
 * `dimensoesDeAcessibilidade()` conta o acervo (7.810) — é o diagnóstico. Aqui o mesmo
 * conjunto ganha `noIndice`, que é a contagem nas 5.092 entradas que a tela pode devolver.
 * As duas convivem na tela, nomeadas, porque marcar «Libras» e ver 49 depois de ler «56»
 * seria, sem essa nomeação, a tela se contradizendo.
 */
export function dimensoesComIndice(dto: AcessibilidadeDTO): DimensaoContada[] {
  const porBit = new Array<number>(DIMENSOES.length).fill(0);
  for (const [, bits] of dto.marcadas) {
    for (let b = 0; b < DIMENSOES.length; b += 1) if (bits & (1 << b)) porBit[b] += 1;
  }
  return dimensoesDeAcessibilidade().map((d, b) => ({ ...d, noIndice: porBit[b] }));
}

// ---------------------------------------------------------------------------
// Os números, num objeto só
// ---------------------------------------------------------------------------

export interface NumerosDosFiltros {
  entidadesNoAcervo: number;
  dimensoes: number;
  dimensoesSustentadas: number;
  dimensoesZeradas: number;
  fichaDeclaram: number;
  fichaNaoDeclaram: number;
  fichaDeclaramNaFonte: number;
  criteriosSemLastro: number;
  trilhas: number;
  porDimensaoNaFonte: Record<DimensaoAcessibilidade, number>;
  porDimensaoIncluindoDerivadas: Record<DimensaoAcessibilidade, number>;
}

/** Tudo que a tela e o gate de 05-08 citam, num objeto só e calculado. */
export function numerosDosFiltros(): NumerosDosFiltros {
  const d = dimensoesDeAcessibilidade();
  return {
    entidadesNoAcervo: VARREDURA.entidades,
    dimensoes: d.length,
    dimensoesSustentadas: d.filter((x) => x.sustentada).length,
    dimensoesZeradas: d.filter((x) => !x.sustentada).length,
    fichaDeclaram: RESUMO_DA_FICHA.declaram,
    fichaNaoDeclaram: RESUMO_DA_FICHA.naoDeclaram,
    fichaDeclaramNaFonte: RESUMO_DA_FICHA.declaramNaFonte,
    criteriosSemLastro: CRITERIOS_SEM_LASTRO.length,
    trilhas: TRILHAS_RELACIONADAS.length,
    porDimensaoNaFonte: { ...VARREDURA.porDimensaoNaFonte },
    porDimensaoIncluindoDerivadas: { ...VARREDURA.porDimensaoIncluindoDerivadas },
  };
}

// ---------------------------------------------------------------------------
// D-93 — os três becos sem saída, que deixam de ser becos
// ---------------------------------------------------------------------------

/**
 * O site atual do Itaú Cultural tem TRÊS becos sem saída: `/404`, `/busca-nao-encontrada`
 * e `/agenda-nao-encontrada`. Neste protótipo nenhum deles existe como FIM DE CAMINHO.
 * Cada um oferece qual critério afrouxar COM O NÚMERO, ou uma trilha curada relacionada.
 *
 * O contraste com o site real é parte do argumento — e por isso as três telas não podem
 * ser uma mensagem de erro com um botão «voltar ao início».
 */
export type IdDoBeco = "busca-nao-encontrada" | "agenda-nao-encontrada" | "404";

/**
 * AS CONSULTAS DE EXEMPLO, ESCOLHIDAS POR REGRA E CONGELADAS.
 *
 * A banca vai ver estas telas, e elas não podem mudar entre um ensaio e a apresentação —
 * por isso o valor está FIXO aqui, e não sorteado a cada build. Mas fixar sem conferir
 * seria pior: um acervo regerado poderia fazer a consulta voltar a ter resultado, e a
 * tela continuaria dizendo «nenhum resultado» sobre uma busca que achou. `montarBeco`
 * quebra alto nesse caso.
 *
 * A regra que escolheu cada uma, aplicada UMA vez sobre o índice de 5.092 entradas:
 *
 *   `busca-nao-encontrada` — o texto é a dimensão de acessibilidade que o acervo MAIS
 *     documenta (`libras`, 56 declarações; as outras sete somam 2), cruzado com a classe
 *     de que a agenda trata (`evento`). Dá zero, e o zero é o próprio diagnóstico de
 *     D-91: «Libras» aparece em 8 entradas do acervo e NENHUMA delas é um evento — está
 *     tudo em matéria editorial SOBRE Libras, não em programação COM Libras.
 *
 *   `agenda-nao-encontrada` — classe `evento` cruzada com o território brasileiro que
 *     tem MAIS entradas no índice e ainda assim não tem UM evento. Medido: Paraíba, com
 *     12 entradas e zero eventos. É o deserto de programação em uma linha.
 *
 *   `404` — não tem consulta. Um endereço que não existe não é uma busca que falhou, e
 *     fingir que é seria inventar um critério que ninguém marcou. Ele oferece as quatro
 *     maiores portas do acervo, cada uma com o total MEDIDO por `consultar()`.
 */
export interface ConsultaCongelada {
  id: IdDoBeco;
  texto: string;
  criterios: Criterio[];
  /** A regra que escolheu esta consulta, por extenso. */
  regra: string;
}

export const CONSULTAS_DOS_BECOS: readonly ConsultaCongelada[] = [
  {
    id: "busca-nao-encontrada",
    texto: "libras",
    criterios: [{ campo: "classe", valor: "evento", rotulo: "evento" }],
    regra:
      "a dimensão de acessibilidade mais documentada do acervo, cruzada com a classe de " +
      "que a agenda trata",
  },
  {
    id: "agenda-nao-encontrada",
    texto: "",
    criterios: [
      { campo: "classe", valor: "evento", rotulo: "evento" },
      { campo: "territorio", valor: "paraiba-uf", rotulo: "Paraíba" },
    ],
    regra:
      "o território brasileiro com mais entradas no índice que ainda assim não tem um " +
      "único evento",
  },
] as const;

/** Quantas portas o `/404` oferece. As quatro maiores classes do índice. */
export const PORTAS_DO_404 = 4;

/** Quantos vizinhos por `semelhante_a` cada beco mostra, com o motivo escrito. */
const VIZINHOS_POR_BECO = 4;

/** Um vizinho do grafo, com o MOTIVO escrito em português que a aresta carrega. */
export interface VizinhoDoBeco {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
  rota: string | null;
  /** «parecido porque os dois são conteúdos, sobre contação de histórias» — da aresta. */
  motivo: string;
}

/** Um afrouxamento pronto para a tela: rótulo, número MEDIDO e a consulta já afrouxada. */
export interface SaidaDoBeco {
  chave: string;
  tipo: string;
  rotulo: string;
  /** Quantos resultados este caminho traria. Medido por `consultar()`, nunca estimado. */
  resultados: number;
  /** A consulta já afrouxada, pronta para aplicar num toque. `null` no `/404`. */
  consulta: Consulta | null;
  /** Endereço, quando a saída é um link em vez de um toque. */
  rota: string | null;
}

export interface Beco {
  id: IdDoBeco;
  titulo: string;
  /** O que foi buscado, em português. */
  oQueFoiBuscado: string;
  /** Por que não achou — a causa medida, com o denominador. */
  porQueNaoAchou: string;
  /** A regra que escolheu a consulta. Vai para o modo comentado. */
  regra: string;
  saidas: SaidaDoBeco[];
  vizinhos: VizinhoDoBeco[];
  trilhas: TrilhaResumo[];
  denominadores: DenominadorMedido[];
}

/**
 * Classe da ontologia → o nome que se usa em português na tela.
 *
 * DUPLICAÇÃO DECLARADA, no mesmo espírito de `ROTULO_DIMENSAO` em `agenda.ts`: o mapa
 * idêntico é privado em `buscar.tsx` e `cartao.tsx`, e os dois são somente leitura para
 * este plano — exportá-lo de lá seria escrever fora da fronteira declarada. Sem ele, as
 * portas do `/404` diriam «começar de novo por conteudo», que pede tradução justamente a
 * quem chegou ali por engano.
 */
const ROTULO_DE_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  conteudo: "editorial",
  pessoa: "pessoa",
  midia: "mídia",
  termo: "verbete",
  territorio: "território",
  evento: "evento",
  instituicao: "instituição",
  obra: "obra",
  coletivo: "coletivo",
  espaco: "espaço",
  tema: "tema",
  formacao: "formação",
  publicacao: "publicação",
  linguagem: "linguagem",
  trilha: "trilha",
};

/** As rotas de entidade que a fase 1 exportou. Classe ausente não recebe link. */
const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
  territorio: "/cidade",
  trilha: "/trilha",
};

function rotaDe(classe: ClasseEntidade, slug: string): string | null {
  const base = ROTA_POR_CLASSE[classe];
  return base ? `${base}/${slug}/` : null;
}

/**
 * A vizinhança por `semelhante_a` — tela 18, «o que existe perto disso no grafo».
 *
 * É o MESMO mecanismo do selo laranja de Descobrir, e é ele que faz a tela ser curatorial
 * em vez de consoladora: o motivo vem escrito na aresta, em português, e é mostrado. Um
 * «veja também» sem motivo seria o recomendador opaco que este projeto recusa.
 */
function vizinhancaDe(chaves: Array<{ classe: ClasseEntidade; slug: string }>): VizinhoDoBeco[] {
  const vistos = new Set<string>();
  const saida: VizinhoDoBeco[] = [];
  for (const c of chaves) {
    const entidade = porSlug(c.classe, c.slug);
    if (!entidade) continue;
    for (const v of vizinhos(entidade.id, "semelhante_a")) {
      if (!v.aresta.motivo) continue;
      if (vistos.has(v.entidade.id)) continue;
      vistos.add(v.entidade.id);
      saida.push({
        id: v.entidade.id,
        titulo: v.entidade.titulo,
        classe: v.entidade.classe,
        rota: rotaDe(v.entidade.classe, v.entidade.slug),
        motivo: v.aresta.motivo,
      });
      if (saida.length >= VIZINHOS_POR_BECO) return saida;
    }
  }
  return saida;
}

/**
 * Monta um beco.
 *
 * OS AFROUXAMENTOS JÁ EXISTEM E JÁ VÊM MEDIDOS. `consultar()` devolve
 * `afrouxamentos: Afrouxamento[]`, cada um com `rotulo` em português, `resultados: number`
 * MEDIDO e `consulta` já afrouxada. Não há um segundo motor aqui — esta função ARRUMA o
 * que `indice.ts` mediu, e nada mais.
 */
export function montarBeco(indice: IndiceDTO, id: IdDoBeco): Beco {
  const trilhasCuradas = [...TRILHAS_RELACIONADAS];

  // ---- /404: um endereço que não existe não é uma busca que falhou ---------
  if (id === "404") {
    const portas = indice.facetas.classe.slice(0, PORTAS_DO_404).map((opcao) => {
      const rotulo = ROTULO_DE_CLASSE[opcao.valor as ClasseEntidade] ?? opcao.rotulo;
      const criterio: Criterio = { campo: "classe", valor: opcao.valor, rotulo };
      // MEDIDO pelo motor, e não lido da faceta: é `consultar()` que a tela promete.
      const medido = consultar({ criterios: [criterio] }, indice).total;
      return {
        chave: `classe:${opcao.valor}`,
        tipo: "descoberta",
        rotulo: `começar de novo por ${rotulo}`,
        resultados: medido,
        consulta: null,
        rota: `/buscar/#f=classe:${opcao.valor}`,
      } satisfies SaidaDoBeco;
    });

    if (portas.some((p) => p.resultados === 0)) {
      throw new Error(
        `filtros.ts: uma das ${PORTAS_DO_404} portas de /404 mede zero resultados. Uma ` +
          `porta vazia é o beco que D-93 existe para fechar — ela levaria de um endereço ` +
          `inexistente para uma tela em branco.`,
      );
    }

    return {
      id,
      titulo: "Este endereço não existe",
      oQueFoiBuscado: "um endereço que não corresponde a nenhuma tela deste protótipo",
      porQueNaoAchou:
        `Um endereço errado não é uma busca que falhou: não há critério a afrouxar, ` +
        `porque nenhum critério foi marcado. O que existe são as ` +
        `${milhar(indice.total)} entradas do acervo e as portas de entrada delas.`,
      regra:
        "sem consulta, por construção — as quatro maiores classes do índice, cada uma " +
        "com o total medido por consultar()",
      saidas: portas,
      vizinhos: [],
      trilhas: trilhasCuradas,
      denominadores: [
        {
          chave: "entradas-buscaveis",
          rotulo: "entradas buscáveis no acervo",
          n: indice.total,
        },
        {
          chave: "classes-da-ontologia",
          rotulo: "classes da ontologia, todas alcançáveis daqui",
          n: indice.facetas.classe.length,
        },
      ],
    };
  }

  // ---- os dois becos que SÃO uma consulta que falhou -----------------------
  const congelada = CONSULTAS_DOS_BECOS.find((c) => c.id === id);
  if (!congelada) throw new Error(`filtros.ts: beco desconhecido: ${id}`);

  const consulta: Consulta = { texto: congelada.texto, criterios: [...congelada.criterios] };
  const resposta = consultar(consulta, indice);

  if (resposta.total !== 0) {
    throw new Error(
      `filtros.ts: a consulta congelada de «${id}» devolveu ${resposta.total} resultados e ` +
        `a tela afirma que não achou nenhum. A regra que a escolheu foi «${congelada.regra}» ` +
        `— o acervo mudou por baixo dela. REESCOLHA a consulta pela mesma regra e REESCREVA ` +
        `a declaração junto; não relaxe esta conferência, porque uma tela de zero-resultado ` +
        `sobre uma busca que achou é a mentira mais fácil de não notar.`,
    );
  }
  if (!resposta.afrouxamentos.length) {
    throw new Error(
      `filtros.ts: «${id}» ficou sem afrouxamento nenhum. D-93 proíbe exatamente isso: ` +
        `uma tela de zero-resultado sem por onde sair é o beco que este plano fecha.`,
    );
  }

  const saidas: SaidaDoBeco[] = resposta.afrouxamentos.map((a) => ({
    chave: `${a.campo}:${a.valor}`,
    tipo: a.tipo,
    rotulo: a.rotulo,
    resultados: a.resultados,
    consulta: a.consulta,
    rota: null,
  }));

  // A vizinhança sai do afrouxamento MENOS GENEROSO, e a escolha é o ponto todo: «o que
  // existe perto disso» quer dizer perto do que se PEDIU, não perto do acervo inteiro.
  // Soltar o tipo devolve as 8 entradas que falam de Libras; soltar o texto devolveria os
  // 300 eventos, e a vizinhança viraria «os quatro primeiros eventos do acervo» — verdade
  // e inútil, o mesmo defeito que `PESO_RELACAO` de `grafo.ts` existe para evitar.
  const maisPerto = saidas.reduce((a, b) => (b.resultados < a.resultados ? b : a));
  const perto = consultar({ ...maisPerto.consulta, limite: 6 }, indice).resultados;
  const vizinhanca = vizinhancaDe(perto.map((r) => ({ classe: r.classe, slug: r.slug })));

  if (id === "busca-nao-encontrada") {
    const soTexto = consultar({ texto: congelada.texto }, indice).total;
    return {
      id,
      titulo: "A busca não achou nada",
      oQueFoiBuscado: `«${congelada.texto}» entre os ${milhar(
        consultar({ criterios: [...congelada.criterios] }, indice).total,
      )} eventos do acervo`,
      porQueNaoAchou:
        `«${congelada.texto}» aparece em ${milhar(soTexto)} entradas do acervo e ` +
        `NENHUMA delas é um evento: está tudo em matéria editorial SOBRE Libras, e não em ` +
        `programação COM Libras. O cruzamento não existe, e é exatamente esse buraco que a ` +
        `tela de filtros mede — ${milhar(RESUMO_DA_FICHA.declaram)} entidades preencheram a ` +
        `ficha de acessibilidade e ${DIMENSOES_ESPERADAS - 3} das ${DIMENSOES_ESPERADAS} ` +
        `dimensões medem zero.`,
      regra: congelada.regra,
      saidas,
      vizinhos: vizinhanca,
      trilhas: trilhasCuradas,
      denominadores: [
        { chave: "texto-solto", rotulo: `entradas casam «${congelada.texto}»`, n: soTexto },
        {
          chave: "eventos-no-indice",
          rotulo: "eventos no índice",
          n: consultar({ criterios: [...congelada.criterios] }, indice).total,
        },
        { chave: "o-cruzamento", rotulo: "casam as duas coisas ao mesmo tempo", n: 0 },
      ],
    };
  }

  // agenda-nao-encontrada
  const territorio = congelada.criterios.find((c) => c.campo === "territorio")!;
  const soTerritorio = consultar({ criterios: [territorio] }, indice).total;
  const soEventos = consultar(
    { criterios: congelada.criterios.filter((c) => c.campo === "classe") },
    indice,
  ).total;

  return {
    id,
    titulo: "A agenda está vazia neste recorte",
    // «em Paraíba» pediria «na»; «no território «X»» é a forma que serve aos 108
    // territórios do índice sem escolher artigo por gênero e número, um a um.
    oQueFoiBuscado: `eventos situados no território «${territorio.rotulo}»`,
    porQueNaoAchou:
      `${milhar(soTerritorio)} entradas do acervo estão no território «${territorio.rotulo}» e ` +
      `NENHUMA delas é um evento. E o vazio é mais fundo do que este estado: dos ` +
      `${milhar(NUMEROS_DO_MAPA_DA_AGENDA.eventosNoAcervo)} eventos do acervo, ` +
      `${milhar(NUMEROS_DO_MAPA_DA_AGENDA.comSessao)} têm sessão datada e ` +
      `${milhar(NUMEROS_DO_MAPA_DA_AGENDA.comLugar)} têm lugar resolvível — e a interseção ` +
      `entre as duas coisas é ${milhar(NUMEROS_DO_MAPA_DA_AGENDA.interseccao)}. ` +
      `Nenhum evento deste acervo tem data e território ao mesmo tempo, e é por isso que ` +
      `todo recorte de agenda por lugar esvazia.`,
    regra: congelada.regra,
    saidas,
    vizinhos: vizinhanca,
    trilhas: trilhasCuradas,
    denominadores: [
      {
        chave: "no-territorio",
        rotulo: `entradas no território «${territorio.rotulo}»`,
        n: soTerritorio,
      },
      { chave: "eventos-no-indice", rotulo: "eventos no índice", n: soEventos },
      {
        chave: "eventos-com-sessao",
        rotulo: "eventos com sessão datada",
        n: NUMEROS_DO_MAPA_DA_AGENDA.comSessao,
      },
      {
        chave: "eventos-com-lugar",
        rotulo: "eventos com lugar resolvível",
        n: NUMEROS_DO_MAPA_DA_AGENDA.comLugar,
      },
      {
        chave: "com-as-duas-coisas",
        rotulo: "têm data E lugar ao mesmo tempo",
        n: NUMEROS_DO_MAPA_DA_AGENDA.interseccao,
      },
    ],
  };
}
