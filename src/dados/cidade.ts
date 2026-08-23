import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { coordenadaDe, distanciaKm, projetar, type ViaCoordenada } from "@/dados/geo";
import { ocorrenciasDe, porId, porSlug, porTerritorio, slugsPorTipo, vizinhos } from "@/dados/grafo";
import type { ClasseEntidade, Coordenada, Entidade, MetodoCoordenada } from "@/dados/tipos";

/**
 * cidade.ts — o Modo Cidade montado sobre o ACERVO DE UM TERRITÓRIO, e não sobre uma
 * agenda de datas futuras.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DECISÃO QUE DESTRAVOU A FASE, ESCRITA NO ARQUIVO QUE A EXECUTA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Medido na fase 1 e reconfirmado aqui: **nenhuma entidade do acervo tem data futura E
 * lugar ao mesmo tempo.** Os 100 eventos do CMS têm data de 2026 e ZERO território; os 160
 * eventos da Enciclopédia têm território real e data histórica. Medição desta execução: nas
 * 15 cidades que esta tela exporta, `ocorrenciasDe` devolve **zero** ocorrências para
 * **todas** as 628 entidades situadas. Uma consulta «Belém nos próximos quatro dias» sobre
 * dado real devolve vazio.
 *
 * **D-48 — não fabricamos datas.** Nem futuras, nem derivadas com rótulo. Nenhuma função
 * deste arquivo produz uma data: elas só LEEM o que a fonte escreveu e devolvem o texto
 * literal dela, ou declaram a ausência. Inventar programação destruiria o argumento central
 * da proposta, que é procedência honesta, e ainda afirmaria evento falso sobre instituição
 * real (T-03-27).
 *
 * **D-49 — a pergunta muda.** Este arquivo responde «o que existe culturalmente neste
 * território», não «o que acontece nesta semana». Para quem nunca esteve em Belém essa é a
 * pergunta mais útil de qualquer forma, e é a única que o acervo responde com verdade.
 *
 * **`porTerritorio` É CHAMADA SEM JANELA, e isso não é esquecimento.** A assinatura aceita
 * uma `janela` opcional; usá-la aqui devolveria lista vazia e esvaziaria a tela. O
 * comentário dentro de `porTerritorio` explica o mesmo: a janela existe para quem tiver dado
 * que a sustente, e este território não tem. Há gate de verificação lendo a fonte deste
 * arquivo sem comentários e procurando um segundo argumento nessa chamada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO SABE SOBRE DISTÂNCIA, E O QUE ELE NÃO PODE AFIRMAR (T-03-29)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `distanciaKm` é haversine sobre coordenadas DERIVADAS (D-19/D-20): centroide de município
 * ou deslocamento por espaço. O número que sai daqui é **linha reta entre dois pontos
 * derivados**, nunca rota de trânsito e nunca tempo de deslocamento. Um «12 minutos a pé»
 * sem base seria conselho de viagem falso, e por isso `FONTE_DA_DISTANCIA` viaja junto do
 * número até a tela.
 *
 * Os itens que ancoram no CENTROIDE DO MUNICÍPIO estão todos no MESMO ponto: a distância
 * entre dois deles é exatamente zero, e isso é o que o dado sabe, não defeito do cálculo.
 * Cada dia declara quantos dos seus itens ancoram ali, para a tela poder dizer isso em vez
 * de imprimir «0 km», que pareceria erro.
 *
 * ESTE ARQUIVO IMPORTA `@/dados/grafo` e portanto NUNCA pode ser importado por um
 * componente de cliente (DP-F). `modo-cidade.tsx` recebe tudo por propriedade e só importa
 * daqui com `import type`, que o compilador apaga — o mesmo contrato que `acontece.tsx`
 * mantém com `agenda.ts` desde a fase 3.
 */

// ---------------------------------------------------------------------------
// Referência de tempo e rótulos
// ---------------------------------------------------------------------------

/**
 * O ANO DE REFERÊNCIA DO BUILD. Avaliado uma vez, no escopo do módulo, como
 * `acontece/page.tsx` fixou na 03-01: sob `output: "export"` um relógio de runtime faria o
 * HTML exportado e a hidratação divergirem.
 *
 * Ele NÃO é usado para filtrar nada — usá-lo como filtro seria a janela temporal que D-48
 * proíbe. Ele existe só para uma asserção: nenhuma data que sai daqui é posterior a ele.
 * Derivado da data fixa de `alerta.ts`, nunca do relógio: um build depois da virada de
 * ano UTC mudaria a asserção sem ninguém tocar em nada.
 */
export const ANO_DE_REFERENCIA = Number(DATA_DE_REFERENCIA.slice(0, 4));

/**
 * Quilômetros escritos em português: vírgula decimal, uma casa.
 *
 * `toFixed` sozinho escreveria «0.3», que numa tela em português se lê como número de outro
 * idioma; e `toLocaleString` dependeria do ICU da máquina, que é a mesma armadilha de
 * `localeCompare`. A troca do ponto pela vírgula é explícita e não depende de ambiente.
 */
export function km(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

/** A frase que acompanha todo número de deslocamento desta tela (T-03-29). */
export const FONTE_DA_DISTANCIA =
  "os quilômetros são linha reta entre coordenadas derivadas, nunca rota de trânsito";

const ROTULO_DE_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  espaco: "espaço",
  evento: "exposição ou salão",
  pessoa: "artista",
  coletivo: "coletivo",
  instituicao: "instituição",
  obra: "obra",
  programa: "programa",
  publicacao: "publicação",
  conteudo: "conteúdo",
  formacao: "formação",
};

/** Plural dos rótulos, para as frases contadas. */
const PLURAL_DE_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  espaco: "espaços",
  evento: "exposições e salões",
  pessoa: "artistas",
  coletivo: "coletivos",
  instituicao: "instituições",
  obra: "obras",
  programa: "programas",
  publicacao: "publicações",
  conteudo: "conteúdos",
  formacao: "formações",
};

function rotuloDe(classe: ClasseEntidade): string {
  return ROTULO_DE_CLASSE[classe] ?? classe;
}

function pluralDe(classe: ClasseEntidade, n: number): string {
  return n === 1 ? rotuloDe(classe) : (PLURAL_DE_CLASSE[classe] ?? `${classe}s`);
}

/**
 * Classe → rota de entidade, a mesma tabela de `cartao.tsx`. As classes ausentes não têm
 * rota nesta fase e por isso não recebem link: fabricar `/termo/[slug]` produziria 404 na
 * demonstração ao vivo, que é pior do que um item sem link.
 */
const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
};

/**
 * Comparação de texto por PONTO DE CÓDIGO, e nunca `localeCompare`.
 *
 * O roteiro da banca precisa ser idêntico em toda máquina, e `localeCompare` depende do ICU
 * instalado — duas máquinas com tabelas de colação diferentes produziriam ordens diferentes
 * a partir do mesmo grafo, e o defeito só apareceria no dia da apresentação.
 */
function porChave(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ---------------------------------------------------------------------------
// O item do acervo
// ---------------------------------------------------------------------------

export interface AncoraGeografica {
  coordenada: Coordenada;
  metodo: MetodoCoordenada;
  via: ViaCoordenada;
  origemId: string;
  origemTitulo: string;
  /**
   * A âncora é o centroide do município — um ponto só, comum a todos os itens que caem
   * nele. É este campo, e não o método, que a tela usa para NÃO imprimir «0 km».
   */
  noCentroide: boolean;
  /**
   * O ponto JÁ PROJETADO no viewBox nacional (`geo.ts LIMITES`), calculado no build.
   * É o contrato de geo.ts: quem precisa de posição no navegador recebe o índice
   * projetado por propriedade — o mapa do dia (reformulação 2026-08) desenha daqui,
   * e nenhum componente de cliente alcança `projetar`.
   */
  ponto: { x: number; y: number };
}

/**
 * A marca de «próprio do território» (`docs/telas.md` tela 11), e o número que a sustenta.
 *
 * ELA É MEDIDA, NÃO ESCRITA (T-03-30). A condição é uma contagem: o acervo situa esta
 * entidade em UM único município, e esse município é este. O número que aparece na tela é
 * o tamanho do conjunto a que ela pertence — quantas entidades da mesma linguagem (ou, sem
 * linguagem declarada, da mesma classe) o acervo situa aqui e em nenhum outro lugar.
 *
 * Item que a contagem não sustentar NÃO recebe a marca. Um selo de «só existe aqui» sem
 * número por trás é a mesma classe de afirmação que D-48 proíbe no eixo da data.
 */
export interface MarcaDeProprio {
  /** Em quantos municípios distintos o acervo situa esta entidade. A marca só existe com 1. */
  territorios: number;
  /** O tamanho do conjunto exclusivo a que a entidade pertence. É o número que a sustenta. */
  contagem: number;
  /** Quantas entidades do mesmo conjunto o acervo situa aqui, exclusivas ou não. */
  totalDoConjunto: number;
  /** O conjunto contado: o rótulo da linguagem, ou o da classe quando não há linguagem. */
  conjunto: string;
  /**
   * A forma CURTA, que é a que fica visível no cartão — com o número, sempre.
   *
   * A frase inteira continua existindo e viaja como `title` do elemento e no roteiro
   * exportado. O que não pode acontecer é a marca aparecer sem número: seria um selo de
   * exclusividade sobre o patrimônio de um lugar sem nada por trás (T-03-30).
   */
  curta: string;
  frase: string;
}

export interface ItemDeAcervo {
  id: string;
  slug: string;
  /** `{classe}_{slug}` — a gramática de recorte que a lente do mapa entende. */
  chave: string;
  titulo: string;
  classe: ClasseEntidade;
  rotuloClasse: string;
  linguagens: string[];
  procedencia: Entidade["procedencia"];
  fonte?: string;
  imagem?: string;
  creditoImagem?: string;
  /** A rota da entidade, ou `null` quando a classe não tem rota nesta fase. */
  rota: string | null;
  /** `null` quando o grafo não sustenta posição nenhuma (T-03-16). */
  ancora: AncoraGeografica | null;
  /**
   * O texto de data EXATAMENTE como a fonte escreveu — «1978», «07.10.2010»,
   * «15.09.2016 - 26.10.2016». Nunca normalizado, nunca completado, nunca composto (D-48).
   */
  dataDeclarada: string | null;
  /**
   * O maior ano de quatro dígitos que aparece no texto declarado, ou `null`. É um número
   * LIDO do texto da fonte, e existe para uma única finalidade: permitir que o gate afirme
   * que nenhuma data desta tela é posterior ao ano de referência do build.
   */
  anoDeclarado: number | null;
  /** De onde a data veio, quando veio. */
  fonteDaData: "ocorrencia" | "locais" | null;
  /** A frase de ausência (D-51). Presente sempre que `dataDeclarada` é `null`. */
  ausenciaDeData: string | null;
  proprioDoTerritorio: MarcaDeProprio | null;
}

// ---------------------------------------------------------------------------
// Data declarada — D-48 e D-51
// ---------------------------------------------------------------------------

interface LocalDeclarado {
  cidade?: string | null;
  data?: string | null;
  espaco?: string | null;
  estado?: string | null;
  pais?: string | null;
}

function locaisDe(entidade: Entidade): LocalDeclarado[] {
  const extra = entidade.extra as { locais?: LocalDeclarado[] } | undefined;
  return Array.isArray(extra?.locais) ? (extra.locais as LocalDeclarado[]) : [];
}

/** O maior ano de quatro dígitos escrito no texto. Leitura, não derivação. */
function anoDeclaradoEm(texto: string): number | null {
  const anos = [...texto.matchAll(/\b(1\d{3}|20\d{2})\b/g)].map((m) => Number(m[1]));
  return anos.length ? Math.max(...anos) : null;
}

interface DataLida {
  texto: string;
  ano: number | null;
  fonte: "ocorrencia" | "locais";
}

/**
 * A data que a fonte declarou para esta entidade NESTE território, ou `null`.
 *
 * Duas portas, nesta ordem:
 *  1. **Ocorrência datada.** Medido nesta execução: as 15 cidades exportadas somam ZERO
 *     ocorrências, porque os eventos com sessão são do CMS e o CMS não traz território.
 *     O ramo fica escrito porque é a porta correta quando o dado existir — é exatamente ele
 *     que passa a devolver algo quando um produtor publicar no Studio da fase 4 — e ele
 *     nunca inventa: só repassa o `inicio` que a ocorrência já carrega.
 *  2. **`extra.locais[].data`** da Enciclopédia, PREFERINDO o registro cuja cidade é este
 *     território. Aarão Reis declara «Belém, 1853» e «Rio de Janeiro, 1936»; num roteiro de
 *     Belém a data honesta é a de Belém, e pegar a primeira da lista trocaria uma pela
 *     outra em silêncio.
 *
 * O TEXTO SAI LITERAL. Nada aqui completa «1978» para «1978-01-01»: a fonte declarou um ano,
 * e transformá-lo numa data cheia fabricaria uma precisão que ninguém escreveu.
 */
function dataDeclaradaDe(entidade: Entidade, tituloDoTerritorio: string): DataLida | null {
  const sessoes = ocorrenciasDe(entidade.id);
  if (sessoes.length) {
    const texto = sessoes[0].inicio.slice(0, 10);
    return { texto, ano: anoDeclaradoEm(texto), fonte: "ocorrencia" };
  }

  const locais = locaisDe(entidade).filter((l) => String(l?.data ?? "").trim());
  const daqui = locais.find((l) => l.cidade === tituloDoTerritorio);
  const escolhido = daqui ?? locais[0];
  if (!escolhido) return null;

  const texto = String(escolhido.data).trim();
  return { texto, ano: anoDeclaradoEm(texto), fonte: "locais" };
}

/**
 * A frase de ausência de data (D-51), específica por classe.
 *
 * Ela DIZ a ausência em vez de deixar um espaço vazio, que se leria como esquecimento em
 * vez de fato do acervo. É a mesma regra que a fase 2 aplicou ao espaço da sessão e ao
 * elenco não declarado.
 */
function ausenciaDeDataDe(classe: ClasseEntidade): string {
  if (classe === "espaco") return "o acervo não declara data para este espaço";
  if (classe === "instituicao") return "o acervo não declara data de fundação";
  if (classe === "pessoa") return "o acervo não declara data para esta pessoa";
  if (classe === "evento") return "o acervo não declara data para esta realização";
  return "o acervo não declara data para este registro";
}

// ---------------------------------------------------------------------------
// Próprio do território — a marca medida (T-03-30)
// ---------------------------------------------------------------------------

/** Os municípios em que o acervo situa uma entidade. `situado_em` é DIRIGIDA. */
function municipiosDe(entidadeId: string): string[] {
  const municipios = new Set<string>();
  for (const { aresta, entidade } of vizinhos(entidadeId, "situado_em")) {
    if (aresta.de !== entidadeId) continue;
    if (entidade.classe !== "territorio") continue;
    if ((entidade.extra as { nivel?: string } | undefined)?.nivel !== "municipio") continue;
    municipios.add(entidade.id);
  }
  return [...municipios].sort(porChave);
}

/** O conjunto a que a entidade pertence para efeito de contagem: linguagem, ou classe. */
function conjuntoDe(entidade: Entidade): { chave: string; rotulo: string } {
  const linguagem = entidade.linguagens.slice().sort(porChave)[0];
  if (linguagem) return { chave: `linguagem:${linguagem}`, rotulo: linguagem.replace(/-/g, " ") };
  return { chave: `classe:${entidade.classe}`, rotulo: pluralDe(entidade.classe, 2) };
}

interface ContagemDoTerritorio {
  /** Por conjunto: quantas entidades daqui pertencem a ele. */
  total: Map<string, number>;
  /** Por conjunto: quantas dessas o acervo situa SÓ aqui. */
  exclusivas: Map<string, number>;
  /** Por entidade: em quantos municípios ela aparece. */
  municipios: Map<string, number>;
}

function contarTerritorio(
  territorioId: string,
  entidades: readonly Entidade[],
): ContagemDoTerritorio {
  const total = new Map<string, number>();
  const exclusivas = new Map<string, number>();
  const municipios = new Map<string, number>();

  for (const e of entidades) {
    const lista = municipiosDe(e.id);
    // Uma entidade situada em nenhum município (o acervo a ligou direto ao estado) conta
    // como 1 aqui: ela chegou nesta lista por este território e não aparece em outro.
    const quantos = lista.length === 0 ? 1 : lista.length;
    municipios.set(e.id, quantos);
    const { chave } = conjuntoDe(e);
    total.set(chave, (total.get(chave) ?? 0) + 1);
    if (quantos === 1 && (lista.length === 0 || lista[0] === territorioId)) {
      exclusivas.set(chave, (exclusivas.get(chave) ?? 0) + 1);
    }
  }

  return { total, exclusivas, municipios };
}

/**
 * A marca de próprio do território, ou `null`.
 *
 * PÚBLICA porque é o contrato que a tela 11 pede, e porque um número que a tela mostra
 * precisa ser conferível de fora. Chamada sem a contagem pré-calculada, ela a refaz — o
 * caminho caro existe para quem tem uma entidade na mão, não para o laço do roteiro.
 */
export function proprioDoTerritorio(
  entidade: Entidade,
  territorioId: string,
  contagem?: ContagemDoTerritorio,
): MarcaDeProprio | null {
  const contas = contagem ?? contarTerritorio(territorioId, porTerritorio(territorioId));
  const territorios = contas.municipios.get(entidade.id) ?? municipiosDe(entidade.id).length;
  if (territorios !== 1) return null;

  const { chave, rotulo } = conjuntoDe(entidade);
  const exclusivas = contas.exclusivas.get(chave) ?? 0;
  const totalDoConjunto = contas.total.get(chave) ?? 0;
  // Sem número que a sustente, não há marca. A contagem é a marca.
  if (exclusivas < 1) return null;

  const territorio = porTerritorioTitulo(territorioId);
  const frase =
    exclusivas === 1
      ? `o acervo situa esta entidade só em ${territorio} — é a única de ${rotulo} daqui que não aparece em nenhum outro território`
      : `o acervo situa esta entidade só em ${territorio} — uma das ${exclusivas} de ${rotulo} daqui que não aparecem em nenhum outro território`;

  const curta = `só em ${territorio} · 1 de ${exclusivas} de ${rotulo}`;

  return { territorios, contagem: exclusivas, totalDoConjunto, conjunto: rotulo, curta, frase };
}

function porTerritorioTitulo(territorioId: string): string {
  const t = porSlug("territorio", territorioId.split(":").slice(2).join(":"));
  return t?.titulo ?? territorioId;
}

// ---------------------------------------------------------------------------
// acervoDe — a porta, sem janela
// ---------------------------------------------------------------------------

/**
 * O acervo de um território, resolvido em itens de tela.
 *
 * `porTerritorio` É CHAMADA COM UM ARGUMENTO SÓ. Sem janela, e o parágrafo do topo do
 * arquivo explica por quê. Belém devolve 39 itens; com qualquer janela dos próximos dias,
 * devolveria zero.
 */
export function acervoDe(territorioId: string): ItemDeAcervo[] {
  const territorio = porId(territorioId);
  const tituloDoTerritorio = territorio?.titulo ?? "";

  const entidades = porTerritorio(territorioId);
  const contagem = contarTerritorio(territorioId, entidades);

  const itens = entidades.map<ItemDeAcervo>((e) => {
    const resolvida = coordenadaDe(e.id);
    const ancora: AncoraGeografica | null = resolvida
      ? {
          coordenada: resolvida.coordenada,
          metodo: resolvida.metodo,
          via: resolvida.via,
          origemId: resolvida.origemId,
          origemTitulo: resolvida.origemTitulo,
          noCentroide: resolvida.via === "territorio",
          ponto: (({ x, y }) => ({ x, y }))(projetar(resolvida.coordenada)),
        }
      : null;

    const data = dataDeclaradaDe(e, tituloDoTerritorio);
    const rota = ROTA_POR_CLASSE[e.classe];

    return {
      id: e.id,
      slug: e.slug,
      chave: `${e.classe}_${e.slug}`,
      titulo: e.titulo,
      classe: e.classe,
      rotuloClasse: rotuloDe(e.classe),
      linguagens: e.linguagens,
      procedencia: e.procedencia,
      fonte: e.fonte,
      imagem: e.imagem,
      creditoImagem: e.creditoImagem,
      rota: rota ? `${rota}/${e.slug}/` : null,
      ancora,
      dataDeclarada: data?.texto ?? null,
      anoDeclarado: data?.ano ?? null,
      fonteDaData: data?.fonte ?? null,
      ausenciaDeData: data ? null : ausenciaDeDataDe(e.classe),
      proprioDoTerritorio: proprioDoTerritorio(e, territorioId, contagem),
    };
  });

  // Reordena por PONTO DE CÓDIGO. `porTerritorio` já ordena, mas com `localeCompare`, que
  // depende do ICU da máquina; o roteiro precisa ser o mesmo em toda máquina.
  return itens.sort((a, b) => porChave(a.chave, b.chave));
}

// ---------------------------------------------------------------------------
// O roteiro — D-50
// ---------------------------------------------------------------------------

export interface DiaDeRoteiro {
  numero: number;
  itens: ItemDeAcervo[];
  /** Soma das distâncias entre itens consecutivos, em linha reta. Uma casa decimal. */
  deslocamentoKm: number;
  /** Quantos itens do dia ancoram no centroide do município — e portanto no MESMO ponto. */
  ancoradosNoCentroide: number;
  /** Quantos itens do dia ancoram num espaço com coordenada própria. */
  ancoradosEmEspaco: number;
  /** Por que estes itens estão juntos. Uma frase, composta a partir do que foi medido. */
  justificativa: string;
}

export interface Roteiro {
  territorioId: string;
  territorioTitulo: string;
  dias: DiaDeRoteiro[];
  /** O que o acervo tem e o roteiro não usou. É daqui que `alternarItem` tira substituto. */
  reserva: ItemDeAcervo[];
  acervoTotal: number;
  itensPorDia: number;
}

/**
 * A ordem em que as classes entram no rodízio de seleção.
 *
 * Espaço e evento primeiro porque são eles que ancoram num endereço com coordenada própria
 * e, portanto, os que fazem o dia ter percurso em vez de ter lista. É o mesmo princípio de
 * rodízio que a 02-01 aplicou ao feed, e pelo mesmo motivo: um dia homogêneo lê como lista.
 */
const ORDEM_DE_CLASSE: readonly ClasseEntidade[] = [
  "espaco",
  "evento",
  "instituicao",
  "pessoa",
  "coletivo",
  "obra",
  "programa",
  "publicacao",
  "conteudo",
  "formacao",
];

function pesoDaClasse(classe: ClasseEntidade): number {
  const i = ORDEM_DE_CLASSE.indexOf(classe);
  return i === -1 ? ORDEM_DE_CLASSE.length : i;
}

/**
 * A ordem de interesse dentro de uma classe: primeiro o que é próprio do território
 * (regra 3 do plano), depois o que ancora num espaço com coordenada própria — porque é ele
 * que dá geometria ao dia —, e por fim a chave, que é o desempate determinístico (regra 4).
 */
function compararInteresse(a: ItemDeAcervo, b: ItemDeAcervo): number {
  const pa = a.proprioDoTerritorio ? 0 : 1;
  const pb = b.proprioDoTerritorio ? 0 : 1;
  if (pa !== pb) return pa - pb;
  const ca = a.ancora && !a.ancora.noCentroide ? 0 : 1;
  const cb = b.ancora && !b.ancora.noCentroide ? 0 : 1;
  if (ca !== cb) return ca - cb;
  return porChave(a.chave, b.chave);
}

/** Distância entre dois itens. Sem âncora dos dois lados, não há afirmação a fazer. */
function distanciaEntre(a: ItemDeAcervo, b: ItemDeAcervo): number | null {
  if (!a.ancora || !b.ancora) return null;
  return distanciaKm(a.ancora.coordenada, b.ancora.coordenada);
}

/**
 * O percurso do dia: vizinho mais próximo a partir da âncora mais específica.
 *
 * Começa pelo item ancorado num espaço com coordenada própria (menor chave entre eles) e
 * segue sempre para o mais próximo ainda não visitado, desempatando por chave. É o percurso
 * que o número de deslocamento descreve — somar distâncias numa ordem e mostrar os itens em
 * outra faria o número não corresponder a nada.
 */
function ordenarPercurso(itens: readonly ItemDeAcervo[]): ItemDeAcervo[] {
  if (itens.length <= 1) return [...itens];
  const restantes = [...itens];
  const inicioIdx = restantes.reduce((melhor, item, i) => {
    const atual = restantes[melhor];
    const especifico = (x: ItemDeAcervo) => (x.ancora && !x.ancora.noCentroide ? 0 : 1);
    const de = especifico(item);
    const dm = especifico(atual);
    if (de !== dm) return de < dm ? i : melhor;
    return porChave(item.chave, atual.chave) < 0 ? i : melhor;
  }, 0);

  const percurso: ItemDeAcervo[] = [restantes.splice(inicioIdx, 1)[0]];
  while (restantes.length) {
    const atual = percurso[percurso.length - 1];
    let melhor = 0;
    let melhorKm = Number.POSITIVE_INFINITY;
    for (let i = 0; i < restantes.length; i += 1) {
      const km = distanciaEntre(atual, restantes[i]);
      const valor = km === null ? Number.POSITIVE_INFINITY : km;
      if (
        valor < melhorKm ||
        (valor === melhorKm && porChave(restantes[i].chave, restantes[melhor].chave) < 0)
      ) {
        melhor = i;
        melhorKm = valor;
      }
    }
    percurso.push(restantes.splice(melhor, 1)[0]);
  }
  return percurso;
}

function somarDeslocamento(percurso: readonly ItemDeAcervo[]): number {
  let total = 0;
  for (let i = 1; i < percurso.length; i += 1) {
    total += distanciaEntre(percurso[i - 1], percurso[i]) ?? 0;
  }
  return Number(total.toFixed(1));
}

/** O ponto médio das âncoras de um dia. É contra ele que o candidato seguinte é medido. */
function centroDoDia(itens: readonly ItemDeAcervo[]): { lat: number; lon: number } | null {
  const comAncora = itens.filter((i) => i.ancora);
  if (!comAncora.length) return null;
  const lat = comAncora.reduce((s, i) => s + (i.ancora as AncoraGeografica).coordenada.lat, 0);
  const lon = comAncora.reduce((s, i) => s + (i.ancora as AncoraGeografica).coordenada.lon, 0);
  return { lat: lat / comAncora.length, lon: lon / comAncora.length };
}

/** Nenhum dia com três itens da mesma classe (regra 2 — equilíbrio de densidade). */
const MAXIMO_POR_CLASSE_NO_DIA = 2;

function cabeNoDia(dia: readonly ItemDeAcervo[], candidato: ItemDeAcervo): boolean {
  const mesmos = dia.filter((i) => i.classe === candidato.classe).length;
  return mesmos < MAXIMO_POR_CLASSE_NO_DIA;
}

/**
 * Compõe a frase de justificativa do dia a partir do que foi medido (o «equilíbrio
 * explícito» da tela 11). Ela precisa ser explícita no DADO antes de ser explícita na tela.
 */
function justificarDia(
  percurso: readonly ItemDeAcervo[],
  total: number,
  noCentroide: number,
  emEspaco: number,
): string {
  const classes = [...new Set(percurso.map((i) => i.classe))];
  const mistura = classes.map((c) => pluralDe(c, percurso.filter((i) => i.classe === c).length));
  /* Vírgula, e não «e», entre as classes: o rótulo de evento já é composto («exposições e
     salões»), e um «e» a mais produziria «exposições e salões e artista» — frase que
     tropeça em voz alta, que é exatamente como esta tela vai ser lida. */
  const partes: string[] = [mistura.join(", ")];

  if (emEspaco >= 2 && total > 0) {
    const ancoras = [
      ...new Set(
        percurso
          .filter((i) => i.ancora && !i.ancora.noCentroide)
          .map((i) => (i.ancora as AncoraGeografica).origemTitulo),
      ),
    ];
    partes.push(`${km(total)} km entre ${ancoras.slice(0, 2).join(" e ")}`);
  } else if (total > 0) {
    partes.push(`${km(total)} km de deslocamento`);
  }

  if (noCentroide === percurso.length) {
    partes.push("todos no centroide do município, que é um ponto só");
  } else if (noCentroide > 0) {
    partes.push(`${noCentroide} no centroide do município`);
  }

  return `${partes.join("; ")}.`;
}

function montarDia(numero: number, itens: readonly ItemDeAcervo[]): DiaDeRoteiro {
  const percurso = ordenarPercurso(itens);
  const km = somarDeslocamento(percurso);
  const noCentroide = percurso.filter((i) => i.ancora?.noCentroide).length;
  const emEspaco = percurso.filter((i) => i.ancora && !i.ancora.noCentroide).length;
  return {
    numero,
    itens: percurso,
    deslocamentoKm: km,
    ancoradosNoCentroide: noCentroide,
    ancoradosEmEspaco: emEspaco,
    justificativa: justificarDia(percurso, km, noCentroide, emEspaco),
  };
}

export interface PedidoDeRoteiro {
  territorioId: string;
  dias: number;
  /**
   * Promoção de interesse da ESTRELINHA (reformulação 2026-08): itens em que o
   * predicado é verdadeiro sobem para a frente da fila DA SUA CLASSE — o rodízio,
   * o percurso e todas as quatro regras continuam intactos, então o roteiro segue
   * determinístico e explicável. Sem o campo, nada muda.
   */
  promover?: (item: ItemDeAcervo) => boolean;
}

/**
 * O roteiro de N dias sobre o acervo do território (D-50).
 *
 * A estrutura do itinerário continua existindo; o que muda é a natureza do item — acervo em
 * vez de sessão datada. As quatro regras do plano, nesta ordem:
 *
 *  1. **Equilíbrio de deslocamento.** Os dias nascem de sementes escolhidas por amostragem
 *     do ponto mais distante entre as âncoras com coordenada própria: cada dia começa num
 *     canto diferente da cidade. Depois, cada vaga é preenchida pelo item mais PRÓXIMO do
 *     centro do dia que ainda não tem item — o dia mais vazio escolhe primeiro, e por isso
 *     os dias terminam com contagem igual sem que nenhum roube o item bom do outro.
 *  2. **Equilíbrio de densidade.** Nenhum dia com três itens da mesma classe.
 *  3. **Prioridade ao que é próprio do território**, pela marca medida.
 *  4. **Desempate por chave**, comparada por ponto de código. Nada de sorteio.
 */
export function montarRoteiro({ territorioId, dias, promover }: PedidoDeRoteiro): Roteiro {
  const acervo = acervoDe(territorioId);
  const territorio = porId(territorioId);

  // O comparador efetivo: a promoção da estrelinha vem ANTES do interesse, e o
  // interesse continua decidindo todo o resto — inclusive o desempate por chave.
  const comparar = promover
    ? (a: ItemDeAcervo, b: ItemDeAcervo) =>
        (promover(a) ? 0 : 1) - (promover(b) ? 0 : 1) || compararInteresse(a, b)
    : compararInteresse;

  // Quantos itens por dia. Dois é o piso da tela 11 e três é o teto; abaixo de dois o dia
  // não é percurso, acima de três a moldura de celular não mostra o dia inteiro.
  const diasEfetivos = Math.max(1, Math.min(dias, Math.floor(acervo.length / 2)));
  const itensPorDia = Math.max(2, Math.min(3, Math.floor(acervo.length / diasEfetivos)));
  const vagas = itensPorDia * diasEfetivos;

  // A seleção é por RODÍZIO DE CLASSE: uma volta pega o melhor de cada classe, a volta
  // seguinte pega o próximo. Sem o rodízio, os 17 eventos de Belém tomariam todas as vagas
  // e o roteiro seria uma lista de exposições em vez de um percurso pela cidade.
  const filas = new Map<ClasseEntidade, ItemDeAcervo[]>();
  for (const item of acervo) {
    const fila = filas.get(item.classe);
    if (fila) fila.push(item);
    else filas.set(item.classe, [item]);
  }
  for (const fila of filas.values()) fila.sort(comparar);
  const classesPresentes = [...filas.keys()].sort(
    (a, b) => pesoDaClasse(a) - pesoDaClasse(b) || porChave(a, b),
  );

  const selecionados: ItemDeAcervo[] = [];
  let houveAvanco = true;
  while (selecionados.length < vagas && houveAvanco) {
    houveAvanco = false;
    for (const classe of classesPresentes) {
      if (selecionados.length >= vagas) break;
      const fila = filas.get(classe);
      if (!fila?.length) continue;
      selecionados.push(fila.shift() as ItemDeAcervo);
      houveAvanco = true;
    }
  }

  const usados = new Set(selecionados.map((i) => i.chave));
  const reserva = acervo.filter((i) => !usados.has(i.chave));

  // --- Sementes: os dias começam o mais longe possível uns dos outros -------
  const comCoordenadaPropria = selecionados
    .filter((i) => i.ancora && !i.ancora.noCentroide)
    .sort(comparar);
  const restantes = new Set(selecionados.map((i) => i.chave));
  const sementes: ItemDeAcervo[] = [];

  if (comCoordenadaPropria.length) {
    sementes.push(comCoordenadaPropria[0]);
    restantes.delete(comCoordenadaPropria[0].chave);
    while (sementes.length < diasEfetivos) {
      let escolhido: ItemDeAcervo | null = null;
      let melhorDistancia = -1;
      for (const candidato of comCoordenadaPropria) {
        if (!restantes.has(candidato.chave)) continue;
        const minima = sementes.reduce(
          (m, s) => Math.min(m, distanciaEntre(s, candidato) ?? Number.POSITIVE_INFINITY),
          Number.POSITIVE_INFINITY,
        );
        if (
          minima > melhorDistancia ||
          (minima === melhorDistancia &&
            escolhido !== null &&
            porChave(candidato.chave, escolhido.chave) < 0)
        ) {
          melhorDistancia = minima;
          escolhido = candidato;
        }
      }
      if (!escolhido) break;
      sementes.push(escolhido);
      restantes.delete(escolhido.chave);
    }
  }
  // Território sem espaço com coordenada própria — ou com menos espaços do que dias — cai
  // aqui: as sementes que faltam saem da ordem de interesse. Nenhuma posição é inventada.
  for (const item of selecionados) {
    if (sementes.length >= diasEfetivos) break;
    if (!restantes.has(item.chave)) continue;
    sementes.push(item);
    restantes.delete(item.chave);
  }

  const grupos: ItemDeAcervo[][] = sementes.map((s) => [s]);
  while (grupos.length < diasEfetivos) grupos.push([]);

  // --- Preenchimento: o dia mais vazio escolhe primeiro, e escolhe o mais perto ---
  const disponiveis = selecionados.filter((i) => restantes.has(i.chave)).sort(comparar);
  while (disponiveis.length && grupos.some((g) => g.length < itensPorDia)) {
    let alvo = -1;
    for (let d = 0; d < grupos.length; d += 1) {
      if (grupos[d].length >= itensPorDia) continue;
      if (alvo === -1 || grupos[d].length < grupos[alvo].length) alvo = d;
    }
    if (alvo === -1) break;

    const centro = centroDoDia(grupos[alvo]);
    let melhor = -1;
    let melhorCusto = Number.POSITIVE_INFINITY;
    for (let i = 0; i < disponiveis.length; i += 1) {
      const candidato = disponiveis[i];
      if (!cabeNoDia(grupos[alvo], candidato)) continue;
      const km =
        centro && candidato.ancora ? distanciaKm(centro, candidato.ancora.coordenada) : 0;
      if (km < melhorCusto - 1e-9) {
        melhorCusto = km;
        melhor = i;
      }
      // Empate de distância: `disponiveis` já está em ordem de interesse, então o primeiro
      // encontrado vence. Não há sorteio e não há comparação sensível a locale.
    }
    // Nenhum candidato cabe pela regra de densidade: relaxa a regra para não deixar o dia
    // com menos de dois itens, que é o piso da tela. O dia continua não sendo homogêneo de
    // três, porque a vaga que sobra é sempre a última.
    if (melhor === -1) {
      melhor = disponiveis.findIndex((c) => grupos[alvo].filter((x) => x.classe === c.classe).length < itensPorDia);
      if (melhor === -1) melhor = 0;
    }
    grupos[alvo].push(disponiveis.splice(melhor, 1)[0]);
  }

  const sobras = [...disponiveis, ...reserva].sort((a, b) => porChave(a.chave, b.chave));

  return {
    territorioId,
    territorioTitulo: territorio?.titulo ?? territorioId,
    dias: grupos.map((g, i) => montarDia(i + 1, g)),
    reserva: sobras,
    acervoTotal: acervo.length,
    itensPorDia,
  };
}

// ---------------------------------------------------------------------------
// alternarItem — trocar sem refazer o roteiro (tela 11)
// ---------------------------------------------------------------------------

export interface TrocaDeItem {
  roteiro: Roteiro;
  /** `null` quando não houve substituto que coubesse. */
  trocado: { saiu: ItemDeAcervo; entrou: ItemDeAcervo } | null;
  /** O deslocamento recalculado DAQUELE dia. Os outros dias não foram tocados. */
  deslocamentoKm: number;
  motivo: string;
}

/**
 * Troca um item por outro do acervo não usado, SEM REFAZER O ROTEIRO.
 *
 * Só o dia afetado é remontado; os outros dias saem por referência, o que é a afirmação
 * literal de «alternar item sem refazer o roteiro» — e é isso que o gate de navegador mede,
 * comparando o texto dos quatro dias antes e depois do clique.
 *
 * O substituto é o da reserva que deixa o dia MAIS COMPACTO, respeitando a regra de
 * densidade, desempatando por marca de próprio e depois por chave. Sem substituto que
 * caiba, devolve o roteiro intacto com o motivo — nunca uma troca por qualquer coisa.
 */
export function alternarItem(roteiro: Roteiro, diaIndice: number, itemIndice: number): TrocaDeItem {
  const dia = roteiro.dias[diaIndice];
  if (!dia) {
    return { roteiro, trocado: null, deslocamentoKm: 0, motivo: "este dia não existe no roteiro" };
  }
  const saiu = dia.itens[itemIndice];
  if (!saiu) {
    return {
      roteiro,
      trocado: null,
      deslocamentoKm: dia.deslocamentoKm,
      motivo: "esta posição não existe neste dia",
    };
  }

  const permanecem = dia.itens.filter((_, i) => i !== itemIndice);
  const candidatos = roteiro.reserva.filter((c) => cabeNoDia(permanecem, c));
  if (!candidatos.length) {
    return {
      roteiro,
      trocado: null,
      deslocamentoKm: dia.deslocamentoKm,
      motivo: `o acervo de ${roteiro.territorioTitulo} não tem outro item que caiba neste dia sem repetir classe`,
    };
  }

  /*
   * A ORDEM DOS CRITÉRIOS AQUI FOI CORRIGIDA DEPOIS DE MEDIR (deviação, regra 1).
   *
   * A primeira versão escolhia só pelo MENOR deslocamento resultante. Medido no navegador,
   * isso levava ao pior dia possível: os itens ancorados no centroide do município estão
   * todos no MESMO ponto, então trocar um espaço por uma pessoa devolvia sempre zero
   * quilômetro — e o critério de «menor deslocamento» empurrava o dia para a degeneração,
   * três itens num ponto só, sem percurso nenhum. Minimizar distância recompensa apagar a
   * geometria.
   *
   * A âncora com coordenada PRÓPRIA vem primeiro, portanto, e o deslocamento decide entre
   * as que já preservam o percurso.
   */
  const ordenados = [...candidatos].sort((a, b) => {
    const ga = a.ancora && !a.ancora.noCentroide ? 0 : 1;
    const gb = b.ancora && !b.ancora.noCentroide ? 0 : 1;
    if (ga !== gb) return ga - gb;
    const ka = somarDeslocamento(ordenarPercurso([...permanecem, a]));
    const kb = somarDeslocamento(ordenarPercurso([...permanecem, b]));
    if (Math.abs(ka - kb) > 1e-9) return ka - kb;
    const pa = a.proprioDoTerritorio ? 0 : 1;
    const pb = b.proprioDoTerritorio ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return porChave(a.chave, b.chave);
  });
  const escolhido = ordenados[0];

  const novoDia = montarDia(dia.numero, [...permanecem, escolhido]);
  const dias = roteiro.dias.map((d, i) => (i === diaIndice ? novoDia : d));
  const reserva = roteiro.reserva
    .filter((c) => c.chave !== escolhido.chave)
    .concat(saiu)
    .sort((a, b) => porChave(a.chave, b.chave));

  return {
    roteiro: { ...roteiro, dias, reserva },
    trocado: { saiu, entrou: escolhido },
    deslocamentoKm: novoDia.deslocamentoKm,
    motivo: `«${saiu.titulo}» saiu e «${escolhido.titulo}» entrou; o deslocamento do dia ${dia.numero} passou de ${km(dia.deslocamentoKm)} km para ${km(novoDia.deslocamentoKm)} km`,
  };
}

// ---------------------------------------------------------------------------
// enquadramento — D-49 e D-52, com os números daquele território
// ---------------------------------------------------------------------------

export interface ContagemDeClasse {
  classe: ClasseEntidade;
  rotulo: string;
  n: number;
}

export interface Enquadramento {
  territorioId: string;
  titulo: string;
  total: number;
  porClasse: ContagemDeClasse[];
  comData: number;
  semData: number;
  comAncoraPropria: number;
  noCentroide: number;
  proprios: number;
  /** A frase de D-52. Composta a partir da contagem, e a contagem é medida. */
  frase: string;
  /** A segunda frase: o que muda quando o produtor publicar. A ponte para a fase 4. */
  fraseDoStudio: string;
}

/**
 * A frase que carrega a decisão da fase (D-49, D-52).
 *
 * ELA É CONTEÚDO DE PRODUTO, e não rodapé nem comentário: fica na tela com o modo comentado
 * desligado, e é ela que quem conduzir a demonstração vai ler em voz alta. O tom é o de
 * `3-CONTEXT` — projeto, não desculpa: nenhuma palavra que peça licença, e o fecho aponta
 * para adiante, porque programação futura é exatamente o que o Studio da fase 4 traz.
 *
 * Todos os números saem da contagem. Nenhum é escrito à mão — se o grafo mudar, a frase
 * muda, e o gate que a mede para a execução em vez de acomodar a diferença em silêncio.
 */
export function enquadramento(territorioId: string): Enquadramento {
  const acervo = acervoDe(territorioId);
  const territorio = porId(territorioId);
  const titulo = territorio?.titulo ?? territorioId;

  const contagens = new Map<ClasseEntidade, number>();
  for (const item of acervo) contagens.set(item.classe, (contagens.get(item.classe) ?? 0) + 1);

  const porClasse = [...contagens.entries()]
    .sort((a, b) => b[1] - a[1] || pesoDaClasse(a[0]) - pesoDaClasse(b[0]))
    .map<ContagemDeClasse>(([classe, n]) => ({ classe, rotulo: pluralDe(classe, n), n }));

  const comData = acervo.filter((i) => i.dataDeclarada).length;
  const semData = acervo.length - comData;
  const comAncoraPropria = acervo.filter((i) => i.ancora && !i.ancora.noCentroide).length;
  const noCentroide = acervo.filter((i) => i.ancora?.noCentroide).length;
  const proprios = acervo.filter((i) => i.proprioDoTerritorio).length;

  const mistura = porClasse.map((c) => `${c.n} ${c.rotulo}`);
  const listaDeClasses =
    mistura.length > 1
      ? `${mistura.slice(0, -1).join(", ")} e ${mistura[mistura.length - 1]}`
      : (mistura[0] ?? "nenhum registro");

  /*
   * A FRASE É CURTA DE PROPÓSITO. Ela precisa caber inteira na primeira vista da moldura,
   * junto do primeiro dia — porque é essa a foto que vai para o slide, e uma frase que só
   * aparece depois de rolar não é a frase que abre a tela. Os números que não couberam aqui
   * (quantos registros trazem data e quantos não) não foram perdidos: eles estão na linha de
   * contagem do topo e, item a item, em cada cartão, que é onde D-51 os quer.
   */
  const frase =
    `Este roteiro responde o que existe culturalmente em ${titulo}: ` +
    `o acervo do Itaú Cultural documenta aqui ${acervo.length} registros do que a cultura brasileira produziu neste lugar — ` +
    `${listaDeClasses} —, e ${comData} deles trazem a data que a fonte escreveu.`;

  const fraseDoStudio =
    `Programação futura entra nesta mesma tela quando os produtores publicarem no Studio.`;

  return {
    territorioId,
    titulo,
    total: acervo.length,
    porClasse,
    comData,
    semData,
    comAncoraPropria,
    noCentroide,
    proprios,
    frase,
    fraseDoStudio,
  };
}

// ---------------------------------------------------------------------------
// As cidades que a rota exporta
// ---------------------------------------------------------------------------

/**
 * O piso de acervo para uma cidade virar rota.
 *
 * Oito é o número que faz um roteiro de quatro dias existir com dois itens por dia. Abaixo
 * disso a página de roteiro seria tela vazia com moldura em volta — e exportar 195
 * municípios de três itens cada encheria o build de páginas que ninguém abriria.
 */
export const MINIMO_DE_ACERVO = 8;

/** As opções de janela que a tela oferece. É «quantos dias você fica», nunca «quando». */
export const OPCOES_DE_DIAS: readonly number[] = [2, 3, 4, 5];

/** O padrão, que é o do Cenário 2: Carlos escolhe Belém e quatro dias. */
export const DIAS_PADRAO = 4;

export interface CidadeExportavel {
  slug: string;
  titulo: string;
  territorioId: string;
  estado: string | null;
  pais: string | null;
  total: number;
}

let cidadesMemorizadas: CidadeExportavel[] | null = null;

/**
 * Os municípios com acervo suficiente para a rota. Medido: 15.
 *
 * O NÍVEL VEM DO DADO (`extra.nivel === "municipio"`), e não do formato do slug. Pedir o
 * estado do Pará devolve exatamente as mesmas 39 entidades de Belém — sem o filtro de
 * nível, `para-uf` viraria uma segunda rota com o mesmo roteiro dentro, e a tela mostraria
 * duas cidades onde o acervo tem uma.
 */
export function cidadesComAcervo(): CidadeExportavel[] {
  if (cidadesMemorizadas) return cidadesMemorizadas;
  const saida: CidadeExportavel[] = [];
  for (const slug of slugsPorTipo("territorio")) {
    const t = porSlug("territorio", slug);
    if (!t) continue;
    const extra = t.extra as { nivel?: string; estado?: string | null; pais?: string | null } | undefined;
    if (extra?.nivel !== "municipio") continue;
    const total = porTerritorio(t.id).length;
    if (total < MINIMO_DE_ACERVO) continue;
    saida.push({
      slug: t.slug,
      titulo: t.titulo,
      territorioId: t.id,
      estado: extra?.estado ?? null,
      pais: extra?.pais ?? null,
      total,
    });
  }
  cidadesMemorizadas = saida.sort((a, b) => b.total - a.total || porChave(a.slug, b.slug));
  return cidadesMemorizadas;
}

// ---------------------------------------------------------------------------
// O precômputo que atravessa para o cliente
// ---------------------------------------------------------------------------

/**
 * O roteiro em forma compacta: os itens são ÍNDICES no acervo, e não cópias.
 *
 * O padrão é o que a 02-02 fixou: o build calcula todas as combinações que a tela oferece e
 * o cliente escolhe qual exibir, sem recalcular nada. Aqui isso é obrigatório e não só
 * economia — `distanciaKm` mora em `geo.ts`, que importa o grafo, e um componente de cliente
 * não pode alcançá-lo (DP-F). Reimplementar a haversine no navegador criaria uma segunda
 * versão da mesma conta, que diverge na primeira correção.
 */
export interface AlternativaCompacta {
  /** Índice no acervo do substituto. */
  i: number;
  deslocamentoKm: number;
  ancoradosNoCentroide: number;
  justificativa: string;
  /** A ordem em que o dia fica depois da troca — índices no acervo. */
  ordem: number[];
  motivo: string;
}

export interface DiaCompacto {
  numero: number;
  itens: number[];
  deslocamentoKm: number;
  ancoradosNoCentroide: number;
  ancoradosEmEspaco: number;
  justificativa: string;
  /**
   * Por posição do dia, a fila de substitutos já calculada.
   *
   * Cada alternativa é medida contra o dia ORIGINAL com só aquela posição trocada. Por isso
   * a tela mantém uma troca ativa por dia: assim todo número de deslocamento que ela mostra
   * é um número medido no build, e nunca uma conta feita no navegador sem `geo.ts`.
   */
  alternativas: AlternativaCompacta[][];
}

export interface RoteiroCompacto {
  dias: DiaCompacto[];
  itensPorDia: number;
}

export interface DadosDaCidade {
  slug: string;
  titulo: string;
  estado: string | null;
  pais: string | null;
  territorioId: string;
  enquadramento: Enquadramento;
  /** Todo o acervo do território. Os roteiros apontam para cá por índice. */
  acervo: ItemDeAcervo[];
  opcoesDeDias: number[];
  diasPadrao: number;
  roteiros: Record<string, RoteiroCompacto>;
  fonteDaDistancia: string;
  /** O endereço de volta que a lente do mapa carrega. */
  volta: string;
  /** Outras cidades com acervo, para a tela não ser um beco. */
  outrasCidades: Array<{ slug: string; titulo: string; total: number }>;
}

/** Quantos substitutos por posição. Três dá fila para a demonstração sem inchar o payload. */
const ALTERNATIVAS_POR_POSICAO = 3;

export function precomputarCidade(territorioId: string): DadosDaCidade {
  const cidades = cidadesComAcervo();
  const cidade = cidades.find((c) => c.territorioId === territorioId);
  const acervo = acervoDe(territorioId);
  const indicePorChave = new Map(acervo.map((item, i) => [item.chave, i]));
  const idx = (item: ItemDeAcervo): number => indicePorChave.get(item.chave) as number;

  const roteiros: Record<string, RoteiroCompacto> = {};
  for (const dias of OPCOES_DE_DIAS) {
    const roteiro = montarRoteiro({ territorioId, dias });
    roteiros[String(dias)] = {
      itensPorDia: roteiro.itensPorDia,
      dias: roteiro.dias.map((dia, d) => ({
        numero: dia.numero,
        itens: dia.itens.map(idx),
        deslocamentoKm: dia.deslocamentoKm,
        ancoradosNoCentroide: dia.ancoradosNoCentroide,
        ancoradosEmEspaco: dia.ancoradosEmEspaco,
        justificativa: dia.justificativa,
        alternativas: dia.itens.map((_, p) => {
          const fila: AlternativaCompacta[] = [];
          let corrente = roteiro;
          for (let n = 0; n < ALTERNATIVAS_POR_POSICAO; n += 1) {
            // Cada volta troca a MESMA posição do dia ORIGINAL: a reserva do roteiro
            // corrente já devolveu o item anterior, então a fila não repete substituto e
            // cada entrada descreve um estado completo e medido daquele dia.
            const troca = alternarItem(
              n === 0 ? roteiro : { ...roteiro, reserva: corrente.reserva },
              d,
              p,
            );
            if (!troca.trocado) break;
            const novoDia = troca.roteiro.dias[d];
            fila.push({
              i: idx(troca.trocado.entrou),
              deslocamentoKm: novoDia.deslocamentoKm,
              ancoradosNoCentroide: novoDia.ancoradosNoCentroide,
              justificativa: novoDia.justificativa,
              ordem: novoDia.itens.map(idx),
              motivo: troca.motivo,
            });
            corrente = {
              ...roteiro,
              reserva: corrente.reserva.filter((c) => c.chave !== (troca.trocado as { entrou: ItemDeAcervo }).entrou.chave),
            };
          }
          return fila;
        }),
      })),
    };
  }

  return {
    slug: cidade?.slug ?? territorioId,
    titulo: cidade?.titulo ?? porId(territorioId)?.titulo ?? territorioId,
    estado: cidade?.estado ?? null,
    pais: cidade?.pais ?? null,
    territorioId,
    enquadramento: enquadramento(territorioId),
    acervo,
    opcoesDeDias: [...OPCOES_DE_DIAS],
    diasPadrao: DIAS_PADRAO,
    roteiros,
    fonteDaDistancia: FONTE_DA_DISTANCIA,
    volta: `/cidade/${cidade?.slug ?? ""}/`,
    outrasCidades: cidades
      .filter((c) => c.territorioId !== territorioId)
      .map((c) => ({ slug: c.slug, titulo: c.titulo, total: c.total })),
  };
}
