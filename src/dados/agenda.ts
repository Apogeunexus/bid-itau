/**
 * agenda.ts — o índice da agenda, montado NO BUILD.
 *
 * Este arquivo é a resposta a uma pergunta de modelagem, não a um problema de tela: a
 * agenda é uma lista de EVENTOS com a contagem das suas ocorrências (D-53), e nunca uma
 * lista de sessões soltas. Um espetáculo com 53 sessões aparece UMA vez, com «53
 * sessões» no cartão — não 53 vezes na rolagem. A estrutura abaixo torna a segunda coisa
 * impossível: `eventos` é indexado por slug e a lista de um dia guarda ÍNDICES para
 * dentro dele. Não existe forma de o mesmo evento entrar duas vezes.
 *
 * DP-F: este módulo alcança `@/dados/grafo` (23 MB) e por isso NÃO leva a diretiva de
 * cliente e NUNCA é importado por um componente que a leve. Quem o consome é a página de
 * servidor de `/acontece`, que roda no build e passa adiante só o DTO serializável.
 *
 * NENHUM RELÓGIO DE RUNTIME (T-03-04, e o mesmo padrão que `lista-ocorrencias.tsx`
 * fixou na fase 2). `hoje` chega por parâmetro, sempre. Sob `output: "export"` a página é
 * prerenderizada; um `new Date()` aqui dentro faria o HTML exportado e a hidratação
 * divergirem, e ainda vazaria o fuso de quem avalia.
 *
 * ORDEM ESTÁVEL, SEM LOCALE. Nada aqui usa `localeCompare`: comparação sensível a locale
 * ordena diferente em ambientes diferentes e o HTML exportado deixaria de ser
 * reprodutível. As chaves de ordenação são data (ISO, que ordena como texto) e slug.
 *
 * AUSÊNCIA MEDIDA VIRA CAMPO DECLARADO, nunca campo que some. Campo que desaparece vira
 * bloco que desaparece, e bloco que desaparece faz parecer que a categoria não existe no
 * produto. As quatro ausências desta tela viajam no DTO como dado de primeira classe,
 * com numerador, denominador e frase — e a frase é TEXTO DE PRODUTO, que fica fora do
 * modo comentado, porque procedência é o argumento da proposta e não a anotação dele.
 */

import { ocorrenciasDe, porSlug, slugsPorTipo } from "./grafo";
import type {
  Acessibilidade,
  ClasseEntidade,
  DimensaoAcessibilidade,
  Ocorrencia,
  Procedencia,
} from "./tipos";

// ---------------------------------------------------------------------------
// Contrato do DTO — só primitivos, serializável pela fronteira RSC
// ---------------------------------------------------------------------------

export type TempoDoDia = "passado" | "hoje" | "futuro";

/**
 * Um evento da agenda. Um por evento com ao menos uma sessão datada — 129 dos 300 do
 * acervo. Os outros 171 (160 deles da Enciclopédia) não entram aqui: eles têm ano
 * declarado, não sessão, e aparecem no acervo do território e na busca.
 */
export interface EventoDaAgenda {
  slug: string;
  titulo: string;
  classe: ClasseEntidade;
  /** Ids do vocabulário controlado. A cor da linguagem sai daqui (D-08). */
  linguagens: string[];
  /** Caminho da imagem local, ou `null` DECLARADO — nunca campo ausente. */
  imagem: string | null;
  creditoImagem: string | null;
  procedencia: Procedencia;
  totalSessoes: number;
  /** Datetime ISO da primeira e da última sessão. */
  primeiraSessao: string;
  ultimaSessao: string;
  /** A primeira sessão em `hoje` ou depois. `null` quando todas já passaram. */
  proximaSessao: string | null;
  sessoesFuturas: number;
  sessoesPassadas: number;
  /** Quantas das sessões deste evento declaram Libras. */
  comLibras: number;
  /** Quantas sessões vêm sem ingresso declarado na fonte. Ver `ausencias`. */
  gratuitas: number;
}

/**
 * Um dia que TEM sessão (D-55). A faixa de datas é montada desta lista e de mais lugar
 * nenhum — nada de gerar um intervalo de calendário e depois filtrar: março de 2026 não
 * tem uma única sessão no acervo, e uma faixa que o exibisse vazio contradiria D-55 na
 * primeira rolagem.
 *
 * `eventos` e `horas` são ARRAYS PARALELOS, e isso é uma consequência medida do teto de
 * 200 KB do DTO: os slugs de evento deste acervo têm 71,8 caracteres em média, e repetir
 * o slug nos 2.425 pares evento‑dia custaria 172 KB só de referência. O índice custa 4.
 * `eventos[i]` é a posição em `agenda.eventos`; `horas[i]` é o `HH:MM` da sessão daquele
 * evento neste dia. São sempre do mesmo tamanho, e existe exatamente uma sessão por par
 * evento‑dia neste acervo — medido: 2.425 pares para 2.425 sessões.
 */
export interface DiaDaAgenda {
  /** `YYYY-MM-DD`. */
  data: string;
  tempo: TempoDoDia;
  totalEventos: number;
  totalSessoes: number;
  eventos: number[];
  horas: string[];
}

/**
 * O recorte com que a faixa ABRE — passado à esquerda e futuro à direita ao mesmo tempo,
 * que é o que torna D-54 visível sem precisar de explicação. Os índices apontam para
 * `dias`; a faixa continua podendo caminhar pelos 1.071 dias inteiros, e a tela declara
 * o recorte exibido contra o total, no padrão que a fase 2 fixou para todo teto de
 * exibição.
 */
export interface JanelaDaFaixa {
  primeiroIndice: number;
  /** Inclusivo. */
  ultimoIndice: number;
  /** Índice do dia de referência, ou do primeiro dia posterior a ele. */
  indiceDeHoje: number;
  diasNoRecorte: number;
  totalDeDias: number;
}

/**
 * Uma ausência medida. Campo que existe no modelo e que o acervo não preenche.
 *
 * Nenhuma delas se resolve inventando valor; todas se resolvem dizendo o número. Por
 * isso `numerador` e `denominador` são varridos das sessões de verdade, e a `frase` é
 * montada a partir deles — nunca escrita com o número à mão.
 */
export interface AusenciaMedida {
  /** Vira `data-ausencia="{campo}"` na tela. */
  campo: "espaco" | "preco" | "lotacao" | "acessibilidade";
  rotulo: string;
  numerador: number;
  denominador: number;
  /** Texto de PRODUTO. Fica fora de `<Comentario>`. Nunca vazio. */
  frase: string;
}

export interface DiagnosticoDaAgenda {
  hoje: string;
  eventosNoAcervo: number;
  eventosComSessao: number;
  eventosSemSessao: number;
  /**
   * Os dois recortes de `eventosSemSessao`, medidos e não estimados: a Enciclopédia não
   * tem sessão por natureza — ela registra o que aconteceu, com ano declarado —, e o CMS
   * tem um punhado de registros sem período. A tela diz os dois números, porque «171 sem
   * sessão» sozinho faria parecer defeito de importação.
   */
  eventosSemSessaoDaEnciclopedia: number;
  eventosSemSessaoDoCms: number;
  totalSessoes: number;
  sessoesFuturas: number;
  sessoesPassadas: number;
  diasDistintos: number;
  primeiroDia: string;
  ultimoDia: string;
  maxSessoesPorEvento: number;
  minSessoesPorEvento: number;
  /** Tamanho do DTO inteiro em `JSON.stringify`. Teto declarado: 200 KB. */
  bytesDoDto: number;
}

export interface Agenda {
  /** A data de referência do build, `YYYY-MM-DD`. Dita na tela. */
  hoje: string;
  dias: DiaDaAgenda[];
  janelaSugerida: JanelaDaFaixa;
  eventos: EventoDaAgenda[];
  ausencias: AusenciaMedida[];
  diagnostico: DiagnosticoDaAgenda;
}

// ---------------------------------------------------------------------------
// Recorte inicial da faixa
// ---------------------------------------------------------------------------

/**
 * Dias de cada lado do de referência no recorte inicial. Os dois números são medidos, e
 * não estéticos: nos 14 dias seguintes a 2026-08-22 há entre 3 e 9 eventos por dia, e
 * nos 8 anteriores entre 3 e 10. Os dois lados têm conteúdo — é por isso que D-54 é
 * implementável sem esvaziar a tela.
 */
const DIAS_ANTES = 8;
const DIAS_DEPOIS = 14;

// ---------------------------------------------------------------------------
// Rótulos das 8 dimensões de acessibilidade
// ---------------------------------------------------------------------------

/**
 * `Record` completo de propósito: acrescentar dimensão em `tipos.ts` sem escrever o
 * rótulo aqui vira erro de compilação.
 *
 * DUPLICAÇÃO DECLARADA. `ficha-acessibilidade.tsx` tem o mesmo mapa, privado, e aquele
 * arquivo é somente leitura para este plano — exportá-lo de lá seria escrever fora da
 * fronteira declarada. Duas cópias de rótulo divergem na primeira correção, e por isso
 * isto está registrado no SUMMARY em vez de ficar implícito.
 */
export const ROTULO_DIMENSAO: Record<DimensaoAcessibilidade, string> = {
  audio_description: "Audiodescrição",
  libras: "Libras",
  descriptive_subtitle: "Legenda descritiva",
  closed_caption: "Closed caption",
  open_caption: "Legenda aberta",
  simultaneous_translation: "Tradução simultânea",
  stenotypy: "Estenotipia",
  subtitle: "Legendagem",
};

/**
 * As 8, na ordem da estrutura da fonte. Exportada junto com os rótulos porque a página de
 * seleção de sessão precisa traduzir a ficha de CADA sessão em rótulos no BUILD — e
 * fazê-lo do lado do cliente exigiria uma terceira cópia deste mapa.
 */
export const DIMENSOES = Object.keys(ROTULO_DIMENSAO) as DimensaoAcessibilidade[];

// ---------------------------------------------------------------------------
// Utilitários puros — sem locale, sem relógio, sem Intl
// ---------------------------------------------------------------------------

/**
 * Milhar com ponto, à mão. `Intl.NumberFormat` dependeria do ICU do ambiente, e o texto
 * do HTML exportado tem de ser byte a byte o mesmo em qualquer máquina que rode o build.
 */
export function formatarNumero(n: number): string {
  const bruto = String(Math.trunc(Math.abs(n)));
  let saida = "";
  for (let i = 0; i < bruto.length; i++) {
    if (i > 0 && (bruto.length - i) % 3 === 0) saida += ".";
    saida += bruto[i];
  }
  return n < 0 ? `-${saida}` : saida;
}

/** Comparação por ponto de código. Estável entre ambientes, ao contrário de locale. */
function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** `YYYY-MM-DD` de um datetime ISO, lido da string. Nada de `Date` e nada de fuso. */
function dia(iso: string): string {
  return iso.slice(0, 10);
}

/** `HH:MM` de um datetime ISO, lido da string. */
function hora(iso: string): string {
  return iso.slice(11, 16);
}

function tempoDoDia(data: string, hoje: string): TempoDoDia {
  if (data < hoje) return "passado";
  if (data > hoje) return "futuro";
  return "hoje";
}

function mesmaAcessibilidade(a: Acessibilidade, b: Acessibilidade): boolean {
  return DIMENSOES.every((d) => a[d] === b[d]);
}

// ---------------------------------------------------------------------------
// A varredura das quatro ausências
// ---------------------------------------------------------------------------

interface Varredura {
  totalSessoes: number;
  semEspaco: number;
  semPreco: number;
  esgotadas: number;
  gratuitas: number;
  /** Quantas sessões declaram cada uma das 8 dimensões. */
  porDimensao: Record<DimensaoAcessibilidade, number>;
  /** Eventos cuja acessibilidade VARIA entre as próprias sessões. */
  eventosComAcessibilidadeVariavel: number;
  eventosComSessao: number;
  eventosNoAcervo: number;
  eventosComIngressoDeclarado: number;
}

function montarAusencias(v: Varredura): AusenciaMedida[] {
  const total = formatarNumero(v.totalSessoes);

  /* As dimensões que ALGUMA sessão declara. No acervo carregado é só uma; o texto é
   * montado a partir da medição para não mentir se o acervo mudar. */
  const declaradas = DIMENSOES.filter((d) => v.porDimensao[d] > 0);
  const quaisDimensoes = declaradas.length
    ? `das ${DIMENSOES.length} dimensões, ${
        declaradas.length === 1 ? "só " : ""
      }${declaradas
        .map((d) => `${ROTULO_DIMENSAO[d]} (${formatarNumero(v.porDimensao[d])} de ${total})`)
        .join(", ")} aparece${declaradas.length === 1 ? "" : "m"} em alguma sessão`
    : `nenhuma das ${DIMENSOES.length} dimensões aparece em sessão alguma`;

  return [
    {
      campo: "espaco",
      rotulo: "Onde a sessão acontece",
      numerador: v.semEspaco,
      denominador: v.totalSessoes,
      /* A primeira frase é, palavra por palavra, a que a fase 2 já escreveu na página do
       * evento (`lista-ocorrencias.tsx`), com o número medido acrescentado. Duas frases
       * diferentes para a mesma ausência contariam histórias diferentes nas duas telas. */
      frase:
        `O acervo do Itaú Cultural não publica o espaço desta sessão. O evento declara ` +
        `período, não endereço de cada data — e o campo vem vazio em ` +
        `${formatarNumero(v.semEspaco)} das ${total} sessões. É por isso que esta agenda ` +
        `não mostra distância nem tempo até o lugar: sem espaço na sessão, qualquer ` +
        `distância seria inventada.`,
    },
    {
      campo: "preco",
      rotulo: "Quanto custa",
      numerador: v.semPreco,
      denominador: v.totalSessoes,
      frase:
        `Preço não existe no acervo: o campo vem vazio em ${formatarNumero(v.semPreco)} ` +
        `das ${total} sessões. A fonte publica apenas se há ingresso, nunca quanto ele ` +
        `custa — e ${formatarNumero(v.eventosComIngressoDeclarado)} dos ` +
        `${formatarNumero(v.eventosNoAcervo)} eventos do acervo declaram ingresso, que é ` +
        `a razão de toda sessão aqui aparecer sem ingresso declarado.`,
    },
    {
      campo: "lotacao",
      rotulo: "Lotação",
      numerador: v.esgotadas,
      denominador: v.totalSessoes,
      frase:
        `Sessão esgotada é estado que o modelo tem e que o acervo nunca aciona: ` +
        `${formatarNumero(v.esgotadas)} das ${total} sessões estão marcadas como ` +
        `esgotadas. O campo existe e nenhum registro o exercita — encenar um esgotado ` +
        `aqui seria afirmar sobre um evento real algo que a fonte não diz.`,
    },
    {
      campo: "acessibilidade",
      rotulo: "Acessibilidade por sessão",
      numerador: v.eventosComAcessibilidadeVariavel,
      denominador: v.eventosComSessao,
      frase:
        `A acessibilidade é registro de cada sessão e o modelo deixa que ela varie de ` +
        `uma para outra; no acervo carregado ela não varia em nenhum evento — ` +
        `${formatarNumero(v.eventosComAcessibilidadeVariavel)} dos ` +
        `${formatarNumero(v.eventosComSessao)} eventos com sessão datada têm sessões que ` +
        `diferem entre si. Além disso, ${quaisDimensoes}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// montarAgenda
// ---------------------------------------------------------------------------

/**
 * O índice inteiro da agenda, em uma passada sobre os eventos do grafo.
 *
 * @param hoje Data de referência do build, `YYYY-MM-DD`. Injetada por quem chama; esta
 *             função não consulta relógio nenhum.
 *
 * Nunca lança: evento sem sessão é fato do acervo (171 dos 300) e simplesmente não entra
 * na agenda; acervo vazio devolveria uma agenda vazia e coerente.
 */
export function montarAgenda({ hoje }: { hoje: string }): Agenda {
  const referencia = dia(hoje);

  const slugs = [...slugsPorTipo("evento")].sort(comparar);

  const eventos: EventoDaAgenda[] = [];
  /** `YYYY-MM-DD` → pares (índice do evento, hora), na ordem em que forem fechados. */
  const porDia = new Map<string, Array<{ evento: number; hora: string }>>();

  const varredura: Varredura = {
    totalSessoes: 0,
    semEspaco: 0,
    semPreco: 0,
    esgotadas: 0,
    gratuitas: 0,
    porDimensao: Object.fromEntries(DIMENSOES.map((d) => [d, 0])) as Record<
      DimensaoAcessibilidade,
      number
    >,
    eventosComAcessibilidadeVariavel: 0,
    eventosComSessao: 0,
    eventosNoAcervo: slugs.length,
    eventosComIngressoDeclarado: 0,
  };

  let sessoesFuturas = 0;
  let sessoesPassadas = 0;
  let semSessaoDaEnciclopedia = 0;
  let semSessaoDoCms = 0;
  let maxSessoesPorEvento = 0;
  let minSessoesPorEvento = Number.POSITIVE_INFINITY;

  for (const slug of slugs) {
    const entidade = porSlug("evento", slug);
    if (!entidade) continue;

    /* Ingresso declarado é fato do REGISTRO DO EVENTO, e é dele que `gratuito` sai no
     * gerador (`gratuito = !evento.extra?.comIngresso`). Medir aqui é o que impede a
     * frase de gratuidade de virar afirmação sobre entrada franca. */
    const extra = entidade.extra as { comIngresso?: boolean } | undefined;
    if (extra?.comIngresso === true) varredura.eventosComIngressoDeclarado++;

    const sessoes: Ocorrencia[] = ocorrenciasDe(entidade.id);
    if (!sessoes.length) {
      /* Evento sem sessão é CASO NORMAL do acervo, não erro: 160 vêm da Enciclopédia,
       * que registra ano declarado, e 11 do CMS sem período. O prefixo do id é o sistema
       * de origem, que é parte do contrato do formato `{classe}:{origem}:{idOrigem}`. */
      if (entidade.id.startsWith("evento:enc:")) semSessaoDaEnciclopedia++;
      else if (entidade.id.startsWith("evento:cms:")) semSessaoDoCms++;
      continue;
    }

    const indice = eventos.length;
    varredura.eventosComSessao++;

    let comLibras = 0;
    let gratuitas = 0;
    let futuras = 0;
    let passadas = 0;
    let proxima: string | null = null;
    let variavel = false;

    for (const sessao of sessoes) {
      const data = dia(sessao.inicio);

      const lista = porDia.get(data);
      const par = { evento: indice, hora: hora(sessao.inicio) };
      if (lista) lista.push(par);
      else porDia.set(data, [par]);

      if (data >= referencia) {
        futuras++;
        if (proxima === null) proxima = sessao.inicio;
      } else {
        passadas++;
      }

      varredura.totalSessoes++;
      if (sessao.espacoId == null) varredura.semEspaco++;
      if (sessao.preco == null) varredura.semPreco++;
      if (sessao.esgotado) varredura.esgotadas++;
      if (sessao.gratuito) {
        varredura.gratuitas++;
        gratuitas++;
      }
      for (const d of DIMENSOES) if (sessao.acessibilidade[d]) varredura.porDimensao[d]++;
      if (sessao.acessibilidade.libras) comLibras++;
      if (!mesmaAcessibilidade(sessao.acessibilidade, sessoes[0].acessibilidade)) {
        variavel = true;
      }
    }

    if (variavel) varredura.eventosComAcessibilidadeVariavel++;
    sessoesFuturas += futuras;
    sessoesPassadas += passadas;
    maxSessoesPorEvento = Math.max(maxSessoesPorEvento, sessoes.length);
    minSessoesPorEvento = Math.min(minSessoesPorEvento, sessoes.length);

    eventos.push({
      slug: entidade.slug,
      titulo: entidade.titulo,
      classe: entidade.classe,
      linguagens: entidade.linguagens,
      /* `null` DECLARADO e não campo ausente: é o que faz a capa sem imagem ser um
       * estado do produto em vez de um bloco que some. */
      imagem: entidade.imagem ?? null,
      creditoImagem: entidade.creditoImagem ?? null,
      procedencia: entidade.procedencia,
      totalSessoes: sessoes.length,
      primeiraSessao: sessoes[0].inicio,
      ultimaSessao: sessoes[sessoes.length - 1].inicio,
      proximaSessao: proxima,
      sessoesFuturas: futuras,
      sessoesPassadas: passadas,
      comLibras,
      gratuitas,
    });
  }

  /* Os dias saem das SESSÕES e de mais lugar nenhum (D-55). Nenhum intervalo é gerado e
   * depois filtrado — um dia sem sessão nunca chega a existir nesta lista. */
  const dias: DiaDaAgenda[] = [...porDia.keys()].sort(comparar).map((data) => {
    const pares = [...(porDia.get(data) ?? [])].sort(
      (a, b) => comparar(a.hora, b.hora) || a.evento - b.evento,
    );
    return {
      data,
      tempo: tempoDoDia(data, referencia),
      totalEventos: new Set(pares.map((p) => p.evento)).size,
      totalSessoes: pares.length,
      eventos: pares.map((p) => p.evento),
      horas: pares.map((p) => p.hora),
    };
  });

  // --- o recorte inicial da faixa ------------------------------------------
  const encontrado = dias.findIndex((d) => d.data >= referencia);
  const indiceDeHoje = encontrado === -1 ? Math.max(0, dias.length - 1) : encontrado;
  const primeiroIndice = Math.max(0, indiceDeHoje - DIAS_ANTES);
  const ultimoIndice = Math.min(Math.max(0, dias.length - 1), indiceDeHoje + DIAS_DEPOIS);

  const agenda: Agenda = {
    hoje: referencia,
    dias,
    janelaSugerida: {
      primeiroIndice,
      ultimoIndice,
      indiceDeHoje,
      diasNoRecorte: dias.length ? ultimoIndice - primeiroIndice + 1 : 0,
      totalDeDias: dias.length,
    },
    eventos,
    ausencias: montarAusencias(varredura),
    diagnostico: {
      hoje: referencia,
      eventosNoAcervo: varredura.eventosNoAcervo,
      eventosComSessao: varredura.eventosComSessao,
      eventosSemSessao: varredura.eventosNoAcervo - varredura.eventosComSessao,
      eventosSemSessaoDaEnciclopedia: semSessaoDaEnciclopedia,
      eventosSemSessaoDoCms: semSessaoDoCms,
      totalSessoes: varredura.totalSessoes,
      sessoesFuturas,
      sessoesPassadas,
      diasDistintos: dias.length,
      primeiroDia: dias[0]?.data ?? "",
      ultimoDia: dias[dias.length - 1]?.data ?? "",
      maxSessoesPorEvento,
      minSessoesPorEvento: Number.isFinite(minSessoesPorEvento) ? minSessoesPorEvento : 0,
      /* Preenchido logo abaixo: o tamanho do DTO só é conhecido depois de o DTO existir,
       * e um campo que se mede a si mesmo teria de ser estimado. O valor final inclui o
       * próprio campo com o placeholder do mesmo comprimento — por isso a medição é
       * feita sobre o objeto já com o zero, e o número reportado é o do serializado
       * imediatamente anterior, com margem de poucos bytes contra o teto de 200 KB. */
      bytesDoDto: 0,
    },
  };

  agenda.diagnostico.bytesDoDto = JSON.stringify(agenda).length;
  return agenda;
}
