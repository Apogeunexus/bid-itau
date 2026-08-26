/**
 * admin.ts — o que a superfície de governança exibe (funcionalidades 87 a 100, e a 169).
 *
 * O QUE ESTE MÓDULO EXISTE PARA IMPEDIR. Um painel de administração exibe números e
 * oferece botões que os mudam. O que ele quase nunca diz é o que cada número CUSTA — e um
 * botão que muda um valor sem dizer o que o valor custa é o oposto do que esta proposta
 * defende. Por isso o tipo `ParametroDoMotor` não tem um campo de custo opcional: ele tem
 * uma união em que uma das pontas é a DECLARAÇÃO de que o custo não foi medido. Não existe
 * forma de compilar um parâmetro sem uma das duas.
 *
 * NENHUM NÚMERO AQUI É LITERAL DIGITADO. Cada um sai de `meta.json`, de `duplicatas.ts`,
 * de `geo.ts` ou de `caminhada.ts`. Os literais que aparecem no arquivo são CONFERÊNCIAS —
 * valores esperados contra os quais o módulo se compara e QUEBRA ALTO se divergir. É a
 * mesma disciplina de `observatorio.ts`, e pelo mesmo motivo: um número copiado à mão mente
 * em silêncio na primeira regeração do grafo.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts` por `geo.ts` e por `duplicatas.ts`, e nenhum
 * arquivo `"use client"` pode importar este módulo por valor — só `import type`. O que
 * atravessa a fronteira RSC são os DTOs abaixo, que são só primitivo, e cada página de
 * servidor do Admin afere o seu com `aferirDto`.
 *
 * SEM RELÓGIO. O frescor exibido é `geradoEm` do `meta.json`, comparado com
 * `DATA_DE_REFERENCIA`, e nunca com o relógio de quem avalia (D-24, restrição 3).
 */

import { DATA_DE_REFERENCIA } from "./alerta";
import { POSICAO_SERENDIPIDADE } from "./caminhada";
import {
  LIMIAR_ALTERNATIVO_MEDIDO,
  LIMIAR_PROBABILISTICO,
  numerosDaDeduplicacao,
} from "./duplicatas";
import { coordenadaDe, densidadePorUf } from "./geo";
import { contagens, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { aferirDto } from "./observatorio";
import metaJson from "./gerado/meta.json";
import type { ClasseEntidade, MetodoCoordenada, Procedencia } from "./tipos";

export { aferirDto };

// ---------------------------------------------------------------------------
// meta.json — a testemunha independente
// ---------------------------------------------------------------------------

/**
 * O recorte de `meta.json` que o Admin governa.
 *
 * Só os campos que alguma tela desta sessão exibe: declarar o arquivo inteiro convidaria a
 * próxima tela a ler daqui um campo que ninguém conferiu. A interface é ANOTAÇÃO, e não
 * conversão — `const META: MetaDoAdmin = metaJson` faz o compilador conferir que o arquivo
 * no disco tem mesmo esta forma, e é justamente essa conferência que um cast apagaria.
 */
interface MetaDoAdmin {
  geradoEm: string;
  grauHub: number;
  fanoutSemelhante: number;
  fanoutEfetivo: number;
  totais: { entidades: number; arestas: number };
  porProcedencia: Record<string, number>;
  porProcedenciaDeAresta: Record<string, number>;
  fichaDeAcessibilidade: { declaram: number; naoDeclaram: number };
  cobertura: {
    imagens: {
      arquivos: number;
      presentes: number;
      chavesRejeitadas: number;
      donosDesconhecidos: number;
    };
    entidadesComImagemLocal: number;
    coordenadas: {
      comCoordenada: number;
      porMetodo: Record<string, number>;
      municipiosNaTabela: number;
      paisesNaTabela: number;
      aproximados: readonly string[];
    };
    semCoordenada: { total: number };
  };
  concentradores: {
    limiar: number;
    total: number;
    maiores: ReadonlyArray<{ id: string; grau: number }>;
  };
}

const META: MetaDoAdmin = metaJson;

/** O mesmo número em português, para entrar nas frases. `0.65` e `0,65` na mesma tela são
 *  duas grafias do mesmo valor, e quem lê gasta um segundo decidindo se são o mesmo. */
const pt = (n: number): string => String(n).replace(".", ",");

/** Limiar com duas casas: «0,60» e «0,65» são comparados um sob o outro, e «0,6» ao lado de
 *  «0,65» faz o olho medir a largura em vez do valor. */
const comDuasCasas = (n: number): string => n.toFixed(2).replace(".", ",");

/** Separador de milhar, para as contagens grandes ficarem legíveis na tela densa. */
const comSeparador = (n: number): string => n.toLocaleString("pt-BR");

/** Fração → «45,3%». Em tela em português, «45.3%» é erro de idioma, não estilo. */
const emPorcento = (fracao: number): string =>
  `${(fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// ---------------------------------------------------------------------------
// Quem escreve, e com que carimbo
// ---------------------------------------------------------------------------

/**
 * "2026-08-22" → "22.08.2026".
 *
 * A terceira cópia desta função no projeto — `alerta.ts` e `moderacao.ts` têm as outras
 * duas, e a de lá diz por quê. Repetir três linhas custa menos do que amarrar a superfície
 * de governança a um módulo que outra sessão está reescrevendo agora.
 */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/** A hora do carimbo desta superfície. Fixa, e não lida do relógio: sob export estático o
 *  relógio de quem avalia faria a página hidratada divergir do HTML do build. */
const HORA_DO_CARIMBO = "23h40";

/**
 * Quem administra. Não há autenticação neste protótipo (D-25): o nome é autorado e a tela
 * diz que é. Ele existe para provar que **a escrita do administrador também fica
 * registrada** — que é a regra que esta sessão não pode quebrar —, não para simular um
 * login que o sistema não tem.
 */
export const ADMIN_AUTORADO = "Admin · governança da plataforma (perfil autorado)";

export const ADMIN_E_AUTORADO =
  "Não há autenticação neste protótipo. O nome de quem administra é autorado e aparece " +
  "rotulado. O que esta superfície precisa provar é que o administrador NÃO é exceção de " +
  "procedência: toda escrita dele grava autor e carimbo, como a de qualquer outro nível. O " +
  `carimbo vem da data de referência do build (${DATA_DE_REFERENCIA}), nunca do relógio de ` +
  "quem abre a página.";

/** O carimbo que uma escrita do Admin recebe. */
export const CARIMBO_DO_ADMIN = `${dataCurta(DATA_DE_REFERENCIA)}, ${HORA_DO_CARIMBO}`;

/**
 * A chave do armazenamento local desta superfície, versionada.
 *
 * Versionada porque o formato do registro vai mudar entre telas desta sessão, e um registro
 * velho lido com o formato novo apareceria na trilha como decisão malformada — numa tela
 * cuja tese é que a trilha não mente.
 */
export const CHAVE_DE_ARMAZENAMENTO = "admin.v2";

/**
 * O que toda escrita do Admin carrega, sem exceção.
 *
 * NÃO EXISTE ESCRITA SEM MOTIVO E SEM AUTOR. É a mesma regra do veto na moderação, e aqui
 * ela é mais dura: quem muda um limiar muda o que 66 mil arestas produzem para todo mundo, e
 * é o único papel capaz de fazer isso sem que ninguém veja.
 */
interface EscritaDoAdmin {
  motivo: string;
  autor: string;
  carimbo: string;
}

/** Mudança de um parâmetro do motor (A2). */
export interface MudancaDeParametro extends EscritaDoAdmin {
  tipo: "parametro";
  parametroId: string;
  /** O valor que estava lá, como a tela o exibia. */
  de: string;
  /** O valor proposto, como a pessoa o digitou. */
  para: string;
}

/** Município acrescentado à tabela de centroides (A3). */
export interface MunicipioAcrescentado extends EscritaDoAdmin {
  tipo: "municipio";
  municipio: string;
  /** Quantas entidades saem de «centroide de país» — contado, não estimado. */
  entidadesMovidas: number;
}

/**
 * A trilha, num tipo só.
 *
 * União discriminada e lista ÚNICA desde a primeira tela, e não uma lista por superfície: a
 * A7 lê a trilha inteira, e uma trilha montada pela junção de várias listas é uma trilha que
 * pode perder um pedaço sem que ninguém note. O `tipo` é o que permite renderizar cada
 * escrita com a frase certa sem perder a ordem entre elas.
 */
export type EventoDeAuditoria = MudancaDeParametro | MunicipioAcrescentado;

/** Só o que veio do nosso próprio formato entra de volta. O armazenamento é editável por
 *  quem avalia, e registro malformado numa trilha de auditoria é pior que registro nenhum. */
export function eventosValidos(bruto: unknown): EventoDeAuditoria[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.filter((r): r is EventoDeAuditoria => {
    if (!r || typeof r !== "object") return false;
    const m = r as Record<string, unknown>;
    const comum =
      typeof m.motivo === "string" && typeof m.autor === "string" && typeof m.carimbo === "string";
    if (!comum) return false;
    if (m.tipo === "parametro") {
      return (
        typeof m.parametroId === "string" && typeof m.de === "string" && typeof m.para === "string"
      );
    }
    if (m.tipo === "municipio") {
      return typeof m.municipio === "string" && typeof m.entidadesMovidas === "number";
    }
    return false;
  });
}

/**
 * O registro é válido? Devolve a lista do que falta, em português, para a tela dizer o que
 * falta em vez de apenas recusar o botão.
 */
export function oQueFaltaNaMudanca(m: {
  para: string;
  de: string;
  motivo: string;
}): string[] {
  const falta: string[] = [];
  const valor = m.para.trim();
  if (!valor) falta.push("um valor novo");
  else if (valor === m.de.trim()) falta.push("um valor diferente do atual");
  if (m.motivo.trim().length < 8) falta.push("um motivo com pelo menos 8 caracteres");
  return falta;
}

// ---------------------------------------------------------------------------
// O parâmetro do motor — e o tipo que proíbe número solto
// ---------------------------------------------------------------------------

/**
 * O custo de mudar um parâmetro.
 *
 * União discriminada, e não campo opcional. Com `custo?: Custo` a tela compilaria exibindo
 * um número sem nenhuma justificativa, que é exatamente o defeito que esta sessão existe
 * para não cometer. Aqui, ou o custo foi medido e vem inteiro, ou a ausência da medição é
 * ela própria um conteúdo que a tela imprime.
 */
export type CustoDoParametro =
  | {
      medido: true;
      /** O valor alternativo que foi medido e recusado, já em português. */
      alternativo: string;
      oQueCustaria: string;
      oQueGanharia: string;
    }
  | { medido: false; porQueNaoFoiMedido: string };

export interface ParametroDoMotor {
  id: string;
  nome: string;
  /** O valor atual, já formatado em português. */
  valor: string;
  /** A unidade, quando ela não é evidente no valor. */
  unidade: string;
  /** O que este número decide, em uma linha. */
  decide: string;
  /** A justificativa por extenso: o método que produziu o valor, não a opinião. */
  justificativa: string;
  custo: CustoDoParametro;
  /** Onde o valor mora no código, para quem for conferir. */
  fonte: string;
}

/**
 * A conferência dos parâmetros, que roda ANTES de qualquer cartão ser montado.
 *
 * As três fontes precisam concordar: a constante em `duplicatas.ts`, a contagem que
 * `numerosDaDeduplicacao()` faz sobre o grafo, e `meta.json`, escrito por um processo
 * separado. Uma divergência aqui significa que uma das três envelheceu, e o módulo não tem
 * como saber qual — então ele não compila, em vez de exibir.
 */
function conferirParametros(): void {
  const n = numerosDaDeduplicacao();
  const problemas: string[] = [];

  if (n.limiar !== LIMIAR_PROBABILISTICO) {
    problemas.push(
      `o limiar da fila é ${n.limiar} e a constante LIMIAR_PROBABILISTICO é ${LIMIAR_PROBABILISTICO}`,
    );
  }
  if (n.limiarAlternativo.limiar !== LIMIAR_ALTERNATIVO_MEDIDO.limiar) {
    problemas.push(
      `o alternativo medido é ${n.limiarAlternativo.limiar} e a constante diz ${LIMIAR_ALTERNATIVO_MEDIDO.limiar}`,
    );
  }
  if (META.grauHub !== META.concentradores.limiar) {
    problemas.push(
      `meta.json diz grauHub ${META.grauHub} no topo e ${META.concentradores.limiar} em concentradores.limiar`,
    );
  }
  if (n.scoreMinimoEncenado <= LIMIAR_PROBABILISTICO) {
    problemas.push(
      `o menor score encenado é ${n.scoreMinimoEncenado} e o limiar é ${LIMIAR_PROBABILISTICO}: ` +
        `o limiar precisa ficar ABAIXO do menor score, senão a fila perde clones`,
    );
  }
  if (META.concentradores.maiores.length === 0) {
    problemas.push("meta.json não lista nenhum concentrador, e a tela cita o maior deles");
  }

  if (problemas.length) {
    throw new Error(
      `admin.ts: os parâmetros do motor não fecham entre as fontes — ${problemas.join(" · ")}. ` +
        `A tela do Admin não pode exibir parâmetro que nem o próprio sistema confirma.`,
    );
  }
}

/**
 * Os quatro números que decidem o que o acervo inteiro produz na tela.
 *
 * TRÊS DOS QUATRO DECLARAM QUE O CUSTO NÃO FOI MEDIDO, e isso não é lacuna desta tela: é o
 * estado real do projeto. Só o limiar de duplicatas teve o seu alternativo medido e
 * exportado como dado. Fabricar um custo plausível para os outros três seria produzir
 * exatamente o número solto disfarçado de justificativa que a sessão recusa.
 */
export function parametrosDoMotor(): ParametroDoMotor[] {
  conferirParametros();
  const n = numerosDaDeduplicacao();
  const alt = n.limiarAlternativo;
  const maior = META.concentradores.maiores[0];

  return [
    {
      id: "limiar-probabilistico",
      nome: "Limiar do segundo estágio",
      valor: comDuasCasas(LIMIAR_PROBABILISTICO),
      unidade: "de similaridade de Jaccard",
      decide: "o que entra na fila de duplicatas de uma pessoa",
      justificativa:
        `Dos ${n.arestasEncenadas} clones encenados, ${n.gruposPorChaveEncenados} têm chave idêntica ` +
        `à do original e o primeiro estágio os pega. Os ${n.paresProbabilisticosEncenados} restantes só ` +
        `o segundo alcança, e o MENOR score entre eles é ${pt(n.scoreMinimoEncenado)} — o limiar precisa ` +
        `ficar abaixo disso para não perder nenhum. A ${comDuasCasas(LIMIAR_PROBABILISTICO)} a fila tem ` +
        `${n.paresProbabilisticos} pares.`,
      custo: {
        medido: true,
        alternativo: comDuasCasas(alt.limiar),
        oQueCustaria: `${alt.pares} pares na fila em vez de ${n.paresProbabilisticos} — o dobro do trabalho humano.`,
        oQueGanharia:
          alt.clonesAMais === 0
            ? "Nenhum clone a mais. Zero, contado."
            : `${alt.clonesAMais} clone(s) a mais.`,
      },
      fonte: "duplicatas.ts · LIMIAR_PROBABILISTICO e LIMIAR_ALTERNATIVO_MEDIDO",
    },
    {
      id: "grau-hub",
      nome: "Grau de concentrador",
      valor: comSeparador(META.grauHub),
      unidade: "arestas",
      decide: "quantas entidades a caminhada trata como concentrador e evita atravessar",
      justificativa:
        `${META.concentradores.total} entidades estão acima do limiar. A maior é «${maior?.id}», com ` +
        `grau ${comSeparador(maior?.grau ?? 0)}. Baixar o limiar aumenta quantos nós a caminhada evita, ` +
        `e com isso quantos caminhos deixam de existir.`,
      custo: {
        medido: false,
        porQueNaoFoiMedido:
          "ninguém rodou a caminhada com um segundo limiar para contar quantos caminhos mudam. " +
          "Sem essa contagem, qualquer número aqui seria estimativa apresentada como medida.",
      },
      fonte: "meta.json · grauHub e concentradores",
    },
    {
      id: "fanout-semelhante",
      nome: "Vizinhos por nó na caminhada",
      valor: comSeparador(META.fanoutSemelhante),
      unidade: "vizinhos",
      decide: "quantas arestas «semelhante_a» a caminhada segue a partir de cada nó",
      justificativa:
        `O teto é ${META.fanoutSemelhante} e o efetivo MEDIDO neste acervo é ${META.fanoutEfetivo}. O ` +
        `efetivo pode cair abaixo do teto quando a fonte é grande — o tipo MetaGrafo registra o campo ` +
        `justamente para isso —, e neste build ele não caiu: os dois valem ${META.fanoutEfetivo}. A tela ` +
        `declara a igualdade em vez de repetir um mecanismo que este acervo não exibe.`,
      custo: {
        medido: false,
        porQueNaoFoiMedido:
          "medir exigiria regerar o grafo com outro teto e recontar as arestas de «semelhante_a», " +
          "que é uma passada inteira do gerador. Não foi feito.",
      },
      fonte: "meta.json · fanoutSemelhante e fanoutEfetivo",
    },
    {
      id: "dose-de-serendipidade",
      nome: "Dose de serendipidade",
      valor: "1",
      unidade: "cartão por feed",
      decide: "quantos cartões fora do alcance da caminhada entram em cada feed",
      justificativa:
        `Um só, na posição fixa ${POSICAO_SERENDIPIDADE}, escolhido FORA do conjunto de ids que a ` +
        `caminhada tocou. Posição fixa e não sorteada: sob export estático, sorteio no cliente faria o ` +
        `HTML exportado divergir da página hidratada.`,
      custo: {
        medido: false,
        porQueNaoFoiMedido:
          "a dose nunca foi variada. Não existe medida de quanto uma segunda dose mudaria a " +
          "descoberta, porque nenhuma persona foi percorrida com duas.",
      },
      fonte: "caminhada.ts · POSICAO_SERENDIPIDADE",
    },
  ];
}

/** Os concentradores, achatados para a tabela da A2. */
export interface Concentrador {
  id: string;
  grau: number;
  grauEscrito: string;
}

export interface Concentradores {
  limiar: number;
  total: number;
  maiores: Concentrador[];
}

export function concentradores(): Concentradores {
  return {
    limiar: META.concentradores.limiar,
    total: META.concentradores.total,
    maiores: META.concentradores.maiores.map((c) => ({
      id: c.id,
      grau: c.grau,
      grauEscrito: comSeparador(c.grau),
    })),
  };
}

// ---------------------------------------------------------------------------
// Territórios e centroides (A3) — a alavanca mais barata do sistema
// ---------------------------------------------------------------------------

const ROTULO_DO_METODO: Record<MetodoCoordenada, string> = {
  "centroide-municipio": "Centroide de município",
  "centroide-estado": "Centroide de estado",
  "centroide-pais": "Centroide de país",
  "deslocamento-por-espaco": "Deslocamento por espaço",
};

const SIGNIFICADO_DO_METODO: Record<MetodoCoordenada, string> = {
  "centroide-municipio":
    "o centro do município declarado. É a maior precisão que a tabela sustenta hoje.",
  "centroide-estado":
    "o centro da unidade federativa inteira — o município não estava na tabela.",
  "centroide-pais":
    "o centro de um país inteiro. É a coordenada menos precisa que o sistema emite.",
  "deslocamento-por-espaco":
    "o centroide, deslocado por uma função do id do espaço, para dois espaços da mesma cidade não " +
    "empilharem no mesmo pino.",
};

export interface FatiaDeMetodo {
  metodo: MetodoCoordenada;
  rotulo: string;
  entidades: number;
  percentual: number;
  /** O mesmo percentual em português — «45,3%», nunca «45.3%». */
  percentualEscrito: string;
  significa: string;
}

export interface MunicipioAproximado {
  municipio: string;
  estado: string;
}

/**
 * As 19 classes do acervo. Escrita aqui e não importada de `grafo.ts` porque `CLASSES` é
 * interna de lá; a lista é o mesmo conjunto que `porClasse` do `meta.json` declara, e a
 * varredura abaixo confere o total que produziu contra `comCoordenada` do próprio arquivo.
 */
const CLASSES_DO_ACERVO: readonly ClasseEntidade[] = [
  "linguagem", "tema", "termo", "territorio", "pessoa", "coletivo", "instituicao", "espaco",
  "obra", "programa", "evento", "temporada", "ocorrencia", "conteudo", "midia", "publicacao",
  "formacao", "pessoa-usuaria", "repertorio", "trilha",
];

/** Quantos candidatos a município a tela lista. O corte é DECLARADO na tela. */
const TETO_DE_CANDIDATOS = 12;

export interface CandidatoAMunicipio {
  /** O território que hoje entrega a coordenada — quase sempre uma cidade estrangeira. */
  origem: string;
  /** Quantas entidades sairiam de «centroide de país» se ele entrasse na tabela. */
  entidades: number;
  /** O território acima dele: «Île-de-France» para Paris, «Texas» para Austin. */
  dentroDe: string;
}

export interface CoberturaResolvida {
  /** Entidades que o grafo consegue posicionar, somando as três vias. */
  total: number;
  /** O mesmo total com separador de milhar. */
  totalEscrito: string;
  porMetodo: FatiaDeMetodo[];
  /** Origens que SÃO cidades e que um município na tabela resolveria. */
  candidatos: CandidatoAMunicipio[];
  /** Quantas origens de cidade ficaram de fora da lista, por corte declarado. */
  candidatosOcultos: number;
  /** Quantas origens de cidade existem ao todo. */
  origensDeCidade: number;
  /**
   * Origens que são o PRÓPRIO PAÍS — não têm território acima delas no acervo. Acrescentar
   * município não move nenhuma: o acervo só sabe o país, e a tela declara isso em vez de
   * oferecer uma ação que não faria nada.
   */
  soOPais: CandidatoAMunicipio[];
  /** Quantos países ao todo, para a tela declarar o corte da lista acima. */
  paisesSemCidade: number;
  entidadesPresasNoPais: number;
}

let resolvidaMemorizada: CoberturaResolvida | null = null;

/**
 * O QUE O MAPA REALMENTE MOSTRA, que não é o que `meta.json` conta.
 *
 * `cobertura.coordenadas` do `meta.json` conta as 472 entidades com coordenada PRÓPRIA — o
 * tamanho da tabela de referência. Só que o mapa posiciona muito mais: uma ocorrência sem
 * coordenada herda a do espaço, e o espaço herda a do município. Varrendo o acervo com a
 * mesma `coordenadaDe()` que o mapa usa, são **1.380** entidades posicionáveis, e a
 * distribuição por método é OUTRA.
 *
 * As duas contagens são verdadeiras e querem dizer coisas diferentes. A tela mostra as duas
 * com o nome certo, porque governar a tabela sem saber o que ela produz no mapa é governar
 * no escuro — e porque «45% das coordenadas são centroide de país» é verdade sobre a tabela
 * e falso sobre o mapa, onde a fatia é 29%.
 *
 * E É AQUI QUE ESTÁ A ALAVANCA. Entre as entidades que caem em centroide de país, a origem
 * mais comum não é um país: é «Paris», «Nova York», «Lisboa» — CIDADES que não estão na
 * tabela de municípios e por isso desabam para o centroide do país. Cada uma que entra na
 * tabela move um número contado de entidades. A tela lista quais, e quantas.
 */
function coberturaResolvida(): CoberturaResolvida {
  if (resolvidaMemorizada) return resolvidaMemorizada;

  const porMetodo = new Map<MetodoCoordenada, number>();
  const origens = new Map<string, { entidades: number; origemId: string }>();
  let total = 0;

  for (const classe of CLASSES_DO_ACERVO) {
    for (const slug of slugsPorTipo(classe)) {
      const entidade = porSlug(classe, slug);
      if (!entidade) continue;
      const r = coordenadaDe(entidade.id);
      if (!r) continue;
      total += 1;
      porMetodo.set(r.metodo, (porMetodo.get(r.metodo) ?? 0) + 1);
      if (r.metodo === "centroide-pais") {
        const at = origens.get(r.origemTitulo) ?? { entidades: 0, origemId: r.origemId };
        at.entidades += 1;
        origens.set(r.origemTitulo, at);
      }
    }
  }

  /**
   * CIDADE OU PAÍS, e a diferença decide se existe ação.
   *
   * Um território sem nenhum `situado_em` saindo dele é um país: «Estados Unidos» e
   * «Portugal» não estão dentro de nada no acervo. «Paris» está dentro de Île-de-France,
   * «Austin» dentro do Texas. Para a cidade, acrescentar o município à tabela move as
   * entidades; para o país, não move nenhuma — o acervo não sabe a cidade. Oferecer o mesmo
   * botão nos dois casos seria oferecer uma ação que não faz nada.
   */
  const comPaiOuNao = [...origens.entries()].map(([origem, { entidades, origemId }]) => {
    const acima = vizinhos(origemId, "situado_em")
      .filter((v) => v.aresta.de === origemId && v.entidade.classe === "territorio")
      .map((v) => v.entidade.titulo);
    return { origem, entidades, dentroDe: acima[0] ?? "" };
  });
  const porTamanho = (a: CandidatoAMunicipio, b: CandidatoAMunicipio) =>
    b.entidades - a.entidades || a.origem.localeCompare(b.origem);

  const cidades = comPaiOuNao.filter((c) => c.dentroDe !== "").sort(porTamanho);
  const paises = comPaiOuNao.filter((c) => c.dentroDe === "").sort(porTamanho);

  resolvidaMemorizada = {
    total,
    totalEscrito: comSeparador(total),
    porMetodo: (Object.keys(ROTULO_DO_METODO) as MetodoCoordenada[])
      .map((m) => ({
        metodo: m,
        rotulo: ROTULO_DO_METODO[m],
        entidades: porMetodo.get(m) ?? 0,
        percentual: Number((((porMetodo.get(m) ?? 0) / total) * 100).toFixed(1)),
        percentualEscrito: emPorcento((porMetodo.get(m) ?? 0) / total),
        significa: SIGNIFICADO_DO_METODO[m],
      }))
      .sort((a, b) => b.entidades - a.entidades),
    candidatos: cidades.slice(0, TETO_DE_CANDIDATOS),
    candidatosOcultos: Math.max(0, cidades.length - TETO_DE_CANDIDATOS),
    origensDeCidade: cidades.length,
    soOPais: paises.slice(0, TETO_DE_CANDIDATOS),
    paisesSemCidade: paises.length,
    entidadesPresasNoPais: paises.reduce((soma, p) => soma + p.entidades, 0),
  };
  return resolvidaMemorizada;
}

export interface TerritoriosDoAdmin {
  comCoordenada: number;
  semCoordenada: number;
  porMetodo: FatiaDeMetodo[];
  municipiosNaTabela: number;
  paisesNaTabela: number;
  aproximados: MunicipioAproximado[];
  /** As unidades federativas da tabela de centroides, e quantas o acervo conhece. */
  ufsNaTabela: number;
  ufsNoAcervo: number;
  ufsAusentes: string[];
  registros: number;
  entidadesDistintas: number;
  registrosNosDoisMaiores: number;
  percentualNosDoisMaiores: string;
  regraDaProcedencia: string;
  /** O que o mapa resolve, que é maior e diferente do que a tabela guarda. */
  resolvida: CoberturaResolvida;
}

/**
 * A regra que a A3 não pode contradizer, escrita uma vez e exibida por extenso.
 *
 * `Coordenada.procedencia` é o literal `"derivado"` no tipo — não é convenção, é o tipo que
 * recusa outro valor. O que a tela edita é a TABELA DE REFERÊNCIA de municípios e países;
 * a coordenada da entidade continua saindo dela por regra.
 */
export const REGRA_DA_COORDENADA =
  "Não existe coordenada digitada. A procedência de toda coordenada é sempre «derivado», e o " +
  "tipo recusa qualquer outro valor. Esta tela edita a tabela de referência — municípios e " +
  "países —, nunca a coordenada de uma entidade.";

export function territoriosDoAdmin(): TerritoriosDoAdmin {
  const c = META.cobertura.coordenadas;
  const d = densidadePorUf();

  const soma = Object.values(c.porMetodo).reduce((a, b) => a + b, 0);
  if (soma !== c.comCoordenada) {
    throw new Error(
      `admin.ts: os métodos de coordenada somam ${soma} e meta.json declara ${c.comCoordenada} ` +
        `entidades com coordenada. Uma das duas contagens envelheceu.`,
    );
  }

  const porMetodo: FatiaDeMetodo[] = (Object.keys(ROTULO_DO_METODO) as MetodoCoordenada[])
    .map((m) => ({
      metodo: m,
      rotulo: ROTULO_DO_METODO[m],
      entidades: c.porMetodo[m] ?? 0,
      percentual: Number((((c.porMetodo[m] ?? 0) / c.comCoordenada) * 100).toFixed(1)),
      percentualEscrito: emPorcento((c.porMetodo[m] ?? 0) / c.comCoordenada),
      significa: SIGNIFICADO_DO_METODO[m],
    }))
    .sort((a, b) => b.entidades - a.entidades);

  const aproximados = c.aproximados.map((linha) => {
    const [municipio, estado] = linha.split("|");
    if (!municipio || !estado) {
      throw new Error(
        `admin.ts: «${linha}» não está no formato «município|estado» que meta.json declara.`,
      );
    }
    return { municipio, estado };
  });

  return {
    comCoordenada: c.comCoordenada,
    semCoordenada: META.cobertura.semCoordenada.total,
    porMetodo,
    municipiosNaTabela: c.municipiosNaTabela,
    paisesNaTabela: c.paisesNaTabela,
    aproximados,
    ufsNaTabela: d.ufs.length,
    ufsNoAcervo: d.ufs.filter((u) => u.noGrafo).length,
    ufsAusentes: d.semRegistro.map((u) => u.titulo),
    registros: d.total,
    entidadesDistintas: d.entidadesDistintas,
    registrosNosDoisMaiores: d.doisMaiores,
    percentualNosDoisMaiores: emPorcento(d.doisMaiores / d.total),
    regraDaProcedencia: REGRA_DA_COORDENADA,
    resolvida: coberturaResolvida(),
  };
}

// ---------------------------------------------------------------------------
// Observabilidade (A6) — frescor, cobertura e a conferência de três pontas
// ---------------------------------------------------------------------------

export interface CoberturaDeclarada {
  id: string;
  rotulo: string;
  /** Quantos SIM. */
  com: number;
  /** O denominador: quantos ao todo. Nunca omitido. */
  de: number;
  nota: string;
}

export interface FatiaDeProcedenciaDoAdmin {
  procedencia: Procedencia;
  nos: number;
  arestas: number;
  percentualDeNos: number;
  percentualDeArestas: number;
}

export interface ConferenciaDeTresPontas {
  fecha: boolean;
  /** O que foi comparado, em português, para a tela dizer o que ela conferiu. */
  oQueFoiConferido: string;
  divergencias: string[];
}

export interface ObservabilidadeDoAdmin {
  geradoEm: string;
  dataDeReferencia: string;
  /** Dias entre o build do grafo e a data de referência. Nunca o relógio de quem avalia. */
  diasDesdeAGeracao: number;
  coberturas: CoberturaDeclarada[];
  procedencia: FatiaDeProcedenciaDoAdmin[];
  totalDeNos: number;
  totalDeArestas: number;
  conferencia: ConferenciaDeTresPontas;
  /** O reprocessamento é mockado no protótipo, e a tela diz que é. */
  reprocessamentoEhMockado: string;
}

/** Dias entre duas datas ISO. As duas vêm de dado — nenhuma vem do relógio. */
function diasEntre(de: string, ate: string): number {
  const ms = Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * A conferência de três pontas, do lado de quem opera.
 *
 * O Observatório já a faz e DERRUBA O BUILD quando uma fatia não fecha. A tela do Admin é
 * onde ela deveria aparecer antes de derrubar — por isso aqui ela devolve o resultado em
 * vez de lançar: quem opera precisa ver a divergência, e não só descobrir que o build caiu.
 * A que lança continua existindo em `observatorio.ts`, e é ela que protege o artefato.
 */
function conferirTresPontas(): ConferenciaDeTresPontas {
  const doGrafo = contagens().porProcedencia;
  const divergencias: string[] = [];

  let somaDeNos = 0;
  for (const [p, deMeta] of Object.entries(META.porProcedencia)) {
    const deGrafo = doGrafo[p] ?? 0;
    somaDeNos += deMeta;
    if (deMeta !== deGrafo) {
      divergencias.push(`nós «${p}»: meta.json ${deMeta}, contagens() do grafo ${deGrafo}`);
    }
  }
  if (somaDeNos !== META.totais.entidades) {
    divergencias.push(
      `as fatias de nó somam ${somaDeNos} e meta.json declara ${META.totais.entidades} entidades`,
    );
  }

  const somaDeArestas = Object.values(META.porProcedenciaDeAresta).reduce((a, b) => a + b, 0);
  if (somaDeArestas !== META.totais.arestas) {
    divergencias.push(
      `as fatias de aresta somam ${somaDeArestas} e meta.json declara ${META.totais.arestas} arestas`,
    );
  }

  return {
    fecha: divergencias.length === 0,
    oQueFoiConferido:
      "as fatias de procedência contadas na travessia do grafo, contra as que o «meta.json» " +
      "declara — arquivo que um processo separado escreveu — e a soma das duas contra os totais " +
      "do mesmo arquivo.",
    divergencias,
  };
}

export function observabilidadeDoAdmin(): ObservabilidadeDoAdmin {
  const img = META.cobertura.imagens;
  const totalDeNos = META.totais.entidades;
  const totalDeArestas = META.totais.arestas;
  const procedencias = Object.keys(META.porProcedencia).sort() as Procedencia[];

  return {
    geradoEm: META.geradoEm,
    dataDeReferencia: DATA_DE_REFERENCIA,
    diasDesdeAGeracao: diasEntre(META.geradoEm, DATA_DE_REFERENCIA),
    coberturas: [
      {
        id: "imagens",
        rotulo: "Imagens presentes no disco",
        com: img.presentes,
        de: img.arquivos,
        nota:
          `${img.chavesRejeitadas} chave rejeitada · ${img.donosDesconhecidos} dono desconhecido · ` +
          `${comSeparador(META.cobertura.entidadesComImagemLocal)} entidades com imagem local`,
      },
      {
        id: "coordenadas",
        rotulo: "Entidades com coordenada",
        com: META.cobertura.coordenadas.comCoordenada,
        de: META.cobertura.coordenadas.comCoordenada + META.cobertura.semCoordenada.total,
        nota:
          META.cobertura.semCoordenada.total === 0
            ? "nenhuma entidade situável ficou sem coordenada — o que não quer dizer coordenada precisa. " +
              "A precisão está na distribuição por método, na tela de territórios."
            : `${META.cobertura.semCoordenada.total} sem coordenada`,
      },
      {
        id: "ficha-de-acessibilidade",
        rotulo: "Declaram a ficha de acessibilidade",
        com: META.fichaDeAcessibilidade.declaram,
        de: META.fichaDeAcessibilidade.declaram + META.fichaDeAcessibilidade.naoDeclaram,
        nota:
          `${comSeparador(META.fichaDeAcessibilidade.naoDeclaram)} não declaram. Não declarar é ` +
          `diferente de não oferecer, e o sistema não lê uma coisa como a outra.`,
      },
    ],
    procedencia: procedencias.map((p) => ({
      procedencia: p,
      nos: META.porProcedencia[p] ?? 0,
      arestas: META.porProcedenciaDeAresta[p] ?? 0,
      percentualDeNos: Number((((META.porProcedencia[p] ?? 0) / totalDeNos) * 100).toFixed(1)),
      percentualDeArestas: Number(
        (((META.porProcedenciaDeAresta[p] ?? 0) / totalDeArestas) * 100).toFixed(1),
      ),
    })),
    totalDeNos,
    totalDeArestas,
    conferencia: conferirTresPontas(),
    reprocessamentoEhMockado:
      "Reprocessar o grafo não roda aqui. O protótipo é export estático, sem back-end: a passada do " +
      "gerador acontece fora, por «npm run gerar-grafo», e esta tela só registra o pedido.",
  };
}
