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
import {
  COMPONENTES_DO_SCORE,
  LIMITES_DA_IA,
  REGRA_DO_SCORE,
  numerosDaModeracao,
} from "./moderacao";
import { ROTULO_DA_PROCEDENCIA, aferirDto } from "./observatorio";
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
  porClasse: Record<string, number>;
  porRelacao: Record<string, number>;
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
    slugsDesambiguados: number;
    linguagensPromovidas: readonly string[];
    aliasDeLinguagem: Record<string, string>;
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
  `carimbo vem da data de referência do build (${dataCurta(DATA_DE_REFERENCIA)}), nunca do ` +
  "relógio de quem abre a página.";

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
export type EventoDeAuditoria =
  | MudancaDeParametro
  | MunicipioAcrescentado
  | PapelConcedido
  | LimiteDaIaMudado
  | PedidoRespondido;

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
    if (m.tipo === "titular") {
      return (
        typeof m.pedido === "string" &&
        typeof m.titular === "string" &&
        typeof m.desfecho === "string"
      );
    }
    if (m.tipo === "limite-ia") {
      return typeof m.texto === "string";
    }
    if (m.tipo === "papel") {
      return (
        typeof m.pessoa === "string" &&
        typeof m.papel === "string" &&
        typeof m.territorio === "string" &&
        typeof m.classe === "string" &&
        typeof m.fila === "string" &&
        typeof m.procedenciaAutorizada === "string"
      );
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
// A1 — papéis, escopos e o vocabulário de procedência
// ---------------------------------------------------------------------------

/**
 * A DESCOBERTA QUE ESTA TELA EXISTE PARA MOSTRAR. Os níveis de acesso não são uma camada de
 * segurança sobre a ontologia: eles SÃO o vocabulário de procedência. Cada papel humano é um
 * valor de carimbo, e conceder um papel é autorizar alguém a produzir aquele valor.
 *
 * Daí a forma da concessão: papel é ARESTA COM ESCOPO, não coluna numa tabela de usuários. A
 * mesma pessoa é produtora do próprio teatro e curadora regional do Pará, sem conta
 * duplicada — e uma coluna `papel` na linha da pessoa não consegue dizer isso.
 */
export const PAPEL_E_ARESTA =
  "pessoa —[modera, escopo=PA]→ plataforma";

export const POR_QUE_ARESTA =
  "Papel não é coluna na linha da pessoa. É aresta, com escopo na própria aresta: a mesma " +
  "pessoa é produtora do próprio teatro e curadora regional do Pará ao mesmo tempo, sem " +
  "conta duplicada. Uma coluna «papel» obrigaria a segunda conta, e a segunda conta é como " +
  "uma plataforma perde o rastro de quem é quem.";

/** A segregação que a tela imprime, e que a própria superfície respeita. */
export const QUEM_CONCEDE_NAO_DECIDE =
  "Quem concede papel de moderador não decide na fila. Esta tela concede; a fila é da " +
  "Moderação. Sem essa separação, um administrador poderia moderar em nome de qualquer " +
  "território sem que ninguém visse — e a trilha registraria uma decisão de moderação onde " +
  "houve, na verdade, um ato de administração.";

export interface NivelDeAcesso {
  numero: number;
  nome: string;
  superficie: string;
  /** O que ele escreve na ontologia. «nada» é resposta válida e importante. */
  escreve: string;
  /** O valor de procedência que as escritas dele carimbam, quando há um. */
  procedencia: string;
}

export const NIVEIS_DE_ACESSO: readonly NivelDeAcesso[] = [
  { numero: 1, nome: "Admin", superficie: "Admin", escreve: "governança, vocabulário de sistema, papéis", procedencia: "—" },
  { numero: 2, nome: "Gestor", superficie: "Observatório", escreve: "nada — só lê, e é de propósito", procedencia: "—" },
  { numero: 3, nome: "Moderador", superficie: "Moderação", escreve: "decisões, com autor e motivo", procedencia: "curador" },
  { numero: 4, nome: "Moderador com escopo", superficie: "Moderação", escreve: "o mesmo, recortado por território, classe ou fila", procedencia: "curador" },
  { numero: 5, nome: "Editor / Curador", superficie: "Redação", escreve: "sentido: verbete, trilha, vocabulário", procedencia: "curador" },
  { numero: 6, nome: "Organização", superficie: "Studio", escreve: "identidade estável: instituição, espaço, mídia", procedencia: "parceiro" },
  { numero: 7, nome: "Produtor cultural", superficie: "Studio", escreve: "o acontecimento: evento, temporada, ocorrência", procedencia: "produtor" },
  { numero: 8, nome: "Público autenticado", superficie: "App", escreve: "repertório, salvos, sinais", procedencia: "—" },
];

export interface EixoDeEscopo {
  eixo: string;
  exemplo: string;
  porQue: string;
}

export const EIXOS_DO_ESCOPO: readonly EixoDeEscopo[] = [
  {
    eixo: "Território",
    exemplo: "agenda do Pará",
    porQue:
      "dois estados não existem no acervo e dois concentram a maior parte dele. Fila " +
      "centralizada em São Paulo reproduziria na governança o deserto que o mapa denuncia.",
  },
  {
    eixo: "Tipo de conteúdo",
    exemplo: "só mídia · só agenda · só editorial · só agentes",
    porQue:
      "quem sabe reconhecer direito de imagem numa fotografia não é necessariamente quem " +
      "sabe avaliar a ficha de um espaço.",
  },
  {
    eixo: "Fila",
    exemplo: "só duplicatas · só revisão de IA · só direitos de imagem",
    porQue:
      "as filas exigem critérios diferentes, e um moderador com escopo de fila decide onde " +
      "o julgamento dele vale.",
  },
];

export interface FatiaDeProcedenciaDoPapel {
  valor: string;
  quemProduz: string;
  /** Contagem viva quando o acervo já tem, e a declaração quando não tem. */
  nos: string;
  arestas: string;
  existeHoje: boolean;
}

/**
 * As seis procedências que a produção prevê, contra as três que o acervo tem.
 *
 * As três de hoje trazem contagem viva do `meta.json`. As outras três não trazem ZERO —
 * trazem a declaração de que a produção as abre. Zero e «ainda não existe» são coisas
 * diferentes, e um zero aqui faria a tela afirmar uma medição que ninguém fez.
 */
export function procedenciasDoModelo(): FatiaDeProcedenciaDoPapel[] {
  const viva = (p: string, quem: string): FatiaDeProcedenciaDoPapel => ({
    valor: p,
    quemProduz: quem,
    nos: comSeparador(META.porProcedencia[p] ?? 0),
    arestas: comSeparador(META.porProcedenciaDeAresta[p] ?? 0),
    existeHoje: true,
  });
  const futura = (p: string, quem: string): FatiaDeProcedenciaDoPapel => ({
    valor: p,
    quemProduz: quem,
    nos: "a produção abre",
    arestas: "a produção abre",
    existeHoje: false,
  });
  return [
    viva("ic", "ingestão do acervo do Itaú Cultural"),
    viva("derivado", "regra do sistema — nenhuma pessoa"),
    viva("autorado", "nós, na montagem do protótipo, e a tela diz onde"),
    futura("produtor", "nível 7 · Produtor cultural, no Studio"),
    futura("parceiro", "nível 6 · Organização, no Studio"),
    futura("curador", "níveis 3, 4 e 5 · Moderação e Redação"),
    futura("ia", "extração automática, sempre com score e sempre revisada"),
  ];
}

export interface LinhaDaMatriz {
  elemento: string;
  escreve: string;
  aprova: string;
  /** Quantas instâncias o acervo tem hoje, já em português. */
  quantas: string;
}

/**
 * A matriz de autoria, VIVA: cada linha traz a contagem que o acervo tem hoje.
 *
 * A regra que ela existe para provar é a §3 da ontologia — nenhum elemento pode existir sem
 * exatamente um papel autorizado a autorá-lo. Uma linha sem autor é um buraco que nenhuma
 * tela conserta, e a matriz é onde o buraco apareceria.
 */
export function matrizDeAutoria(): LinhaDaMatriz[] {
  const classe = (c: string) => comSeparador(META.porClasse[c] ?? 0);
  const relacao = (r: string) => comSeparador(META.porRelacao[r] ?? 0);
  return [
    { elemento: "linguagem · tema · termo", escreve: "Editor", aprova: "Admin", quantas: `${classe("linguagem")} · ${classe("tema")} · ${classe("termo")}` },
    { elemento: "territorio + centroide", escreve: "Admin", aprova: "—", quantas: classe("territorio") },
    { elemento: "pessoa · coletivo", escreve: "Editor", aprova: "Moderador", quantas: `${classe("pessoa")} · ${classe("coletivo")}` },
    { elemento: "instituicao", escreve: "Organização", aprova: "Moderador", quantas: classe("instituicao") },
    { elemento: "espaco + ficha de acessibilidade", escreve: "Organização", aprova: "Moderador", quantas: classe("espaco") },
    { elemento: "obra", escreve: "Editor", aprova: "Moderador", quantas: classe("obra") },
    { elemento: "programa", escreve: "Organização", aprova: "Moderador", quantas: `${classe("programa")} — a classe existe e nada a popula` },
    { elemento: "evento", escreve: "Produtor", aprova: "Moderador", quantas: classe("evento") },
    { elemento: "temporada", escreve: "Produtor", aprova: "Moderador", quantas: classe("temporada") },
    { elemento: "ocorrencia", escreve: "Produtor", aprova: "—", quantas: classe("ocorrencia") },
    { elemento: "conteudo · publicacao", escreve: "Editor", aprova: "Moderador", quantas: `${classe("conteudo")} · ${classe("publicacao")}` },
    { elemento: "midia + crédito", escreve: "Organização", aprova: "Moderador", quantas: classe("midia") },
    { elemento: "formacao", escreve: "Organização", aprova: "Moderador", quantas: classe("formacao") },
    { elemento: "atua_em (papel)", escreve: "Produtor", aprova: "Moderador", quantas: relacao("atua_em") },
    { elemento: "realiza · ocorre_em · situado_em", escreve: "Produtor", aprova: "Moderador", quantas: `${relacao("realiza")} · ${relacao("ocorre_em")} · ${relacao("situado_em")}` },
    { elemento: "pertence_a — classificação", escreve: "quem cria a entidade", aprova: "Moderador", quantas: relacao("pertence_a") },
    { elemento: "influenciou · deriva_de · curou", escreve: "Editor", aprova: "—", quantas: "0 — declaradas no tipo, e ninguém as escreve" },
    { elemento: "semelhante_a + motivo", escreve: "máquina", aprova: "Moderador, por regra", quantas: relacao("semelhante_a") },
    { elemento: "procedencia · chaveIdentidade · coordenada", escreve: "sistema — nunca digitável", aprova: "—", quantas: "carimbo, não campo" },
  ];
}

export interface Verificacao {
  tipo: string;
  exige: readonly string[];
  porQue: string;
}

/**
 * A verificação (funcionalidade 92), e por que ela é DIFERENTE para os dois casos.
 *
 * Exigir CNPJ de um artista independente excluiria exatamente quem a plataforma existe para
 * incluir. Exigir só autodeclaração de uma instituição deixaria qualquer um publicar em nome
 * de um museu. As duas portas são diferentes porque os riscos são diferentes.
 */
export const VERIFICACOES: readonly Verificacao[] = [
  {
    tipo: "Organização",
    exige: [
      "CNPJ ativo, conferido na base pública",
      "vínculo declarado de quem pede com a organização",
      "aprovação de um moderador, com autor e carimbo",
    ],
    porQue:
      "publicar em nome de uma instituição é falar pela reputação dela. A conferência é " +
      "documental porque o dano de um impostor é institucional.",
  },
  {
    tipo: "Agente independente",
    exige: [
      "CPF, sem exigência de CNPJ",
      "um vínculo verificável com um evento, espaço ou coletivo já no acervo",
      "aprovação de um moderador, com autor e carimbo",
    ],
    porQue:
      "exigir CNPJ de um artista independente excluiria exatamente quem a plataforma existe " +
      "para incluir. O vínculo com o acervo substitui o documento de empresa.",
  },
];

/** Papel concedido — a terceira forma de escrita da superfície (A1). */
export interface PapelConcedido extends EscritaDoAdmin {
  tipo: "papel";
  /** Quem recebe. Autorado: não há autenticação neste protótipo. */
  pessoa: string;
  papel: string;
  /** O escopo nos três eixos. Vazio quando o papel não é recortado. */
  territorio: string;
  classe: string;
  fila: string;
  /** O valor de procedência que esta concessão autoriza a pessoa a produzir. */
  procedenciaAutorizada: string;
}

/** O escopo em uma linha, para a trilha e para a lista. */
export function escopoEscrito(p: {
  territorio: string;
  classe: string;
  fila: string;
}): string {
  const partes = [
    p.territorio && `território ${p.territorio}`,
    p.classe && `classe ${p.classe}`,
    p.fila && `fila ${p.fila}`,
  ].filter(Boolean);
  return partes.length ? partes.join(" · ") : "sem recorte — vale para a plataforma inteira";
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
// A4 — vocabulário: o Admin aprova a promoção e não promove
// ---------------------------------------------------------------------------

export const O_ADMIN_NAO_CURA =
  "O Admin aprova a promoção de um termo a linguagem e monitora a saúde do tesauro. Quem " +
  "promove, funde e declara sinonímia é o Editor. Sem essa separação o administrador vira " +
  "curador por acidente — e a curadoria deixa de ter assinatura, que é o que a torna " +
  "discutível.";

export interface VocabularioDoAdmin {
  linguagens: number;
  temas: number;
  termos: number;
  /** As linguagens que vieram da Enciclopédia e não existem no vocabulário do CMS. */
  promovidas: readonly string[];
  /** O apelido que aponta para a linguagem canônica: «tecnologia» → «arte-e-tecnologia». */
  alias: Array<{ de: string; para: string }>;
  slugsDesambiguados: number;
  porQueAPromocaoFoiFiel: string;
}

/** O que a A4 exibe: o tesauro, mais as procedências que a A1 já sabe montar. */
export interface DadosDoVocabulario extends VocabularioDoAdmin {
  procedencias: FatiaDeProcedenciaDoPapel[];
}

export function vocabularioDoAdmin(): VocabularioDoAdmin {
  const c = META.cobertura;
  return {
    linguagens: META.porClasse.linguagem ?? 0,
    temas: META.porClasse.tema ?? 0,
    termos: META.porClasse.termo ?? 0,
    promovidas: c.linguagensPromovidas,
    alias: Object.entries(c.aliasDeLinguagem).map(([de, para]) => ({ de, para })),
    slugsDesambiguados: c.slugsDesambiguados,
    porQueAPromocaoFoiFiel:
      `As ${c.linguagensPromovidas.length} vieram da Enciclopédia e não existem no ` +
      "vocabulário do CMS. Promover foi fiel ao que a fonte diz; encaixá-las à força numa das " +
      "linguagens existentes seria fabricar uma classificação que ninguém fez — e é " +
      "exatamente o tipo de arrumação que faz um acervo parecer mais organizado do que é.",
  };
}

// ---------------------------------------------------------------------------
// A5 — os limites da IA, e o que a ausência de um controle significa
// ---------------------------------------------------------------------------

export { COMPONENTES_DO_SCORE, LIMITES_DA_IA, REGRA_DO_SCORE };

/**
 * O CONTROLE QUE NÃO EXISTE, e a ausência dele é o produto.
 *
 * Não há interruptor de «IA publica direto» nesta tela — nem desligado, nem escondido atrás
 * de uma confirmação. Um interruptor desligado é uma promessa de que um dia ele pode ser
 * ligado; a ausência é a afirmação de que o sistema não sabe fazer isso.
 */
export const O_INTERRUPTOR_QUE_NAO_EXISTE =
  "Não existe controle de «IA publica direto» nesta tela, e a ausência dele é o produto. Um " +
  "interruptor desligado é a promessa de que um dia alguém o liga. A ausência é a afirmação " +
  "de que publicar sem humano não é uma opção que o sistema oferece.";

export interface OQueAIaPode {
  pode: string;
  comQueLimite: string;
}

export const O_QUE_A_IA_PODE: readonly OQueAIaPode[] = [
  {
    pode: "Propor um item à fila de moderação",
    comQueLimite: "sempre com score à vista e com as cinco perguntas marcadas ou não.",
  },
  {
    pode: "Sugerir o próximo passo de uma trilha",
    comQueLimite:
      "como sugestão ao editor, que aceita ou recusa — e a trilha publicada leva a " +
      "assinatura dele, não a da sugestão.",
  },
  {
    pode: "Extrair campo na ingestão",
    comQueLimite:
      "com o score do item e a fonte declarada. O que ela extrai entra como proposta, " +
      "nunca como dado publicado.",
  },
];

/** Mudança na lista de limites da IA — evento de auditoria de primeira ordem (A5). */
export interface LimiteDaIaMudado extends EscritaDoAdmin {
  tipo: "limite-ia";
  /** O texto do limite acrescentado, por extenso. */
  texto: string;
}


// ---------------------------------------------------------------------------
// A8 — titulares de dado, e a distinção que organiza a tela
// ---------------------------------------------------------------------------

/**
 * O GRAFO TEM PESSOAS QUE NUNCA SE CADASTRARAM, e é isso que torna esta tela diferente de um
 * painel de LGPD comum. São 575 no protótipo e 43.614 na base completa: artistas, curadores,
 * educadores documentados pelo acervo. Elas são titulares de dado sem nunca terem aceitado
 * um termo de uso, e o direito delas não depende de cadastro.
 */
export interface TipoDeTitular {
  tipo: string;
  quem: string;
  podePedir: readonly string[];
  quantos: string;
}

export function tiposDeTitular(): TipoDeTitular[] {
  return [
    {
      tipo: "Usuária",
      quem: "se cadastrou na plataforma",
      podePedir: [
        "consentimento — o que aceitou, quando, e a revogação",
        "exportação dos próprios dados",
        "exclusão da conta, e do que vem junto com ela",
      ],
      quantos: `${comSeparador(META.porClasse["pessoa-usuaria"] ?? 0)} no acervo do protótipo`,
    },
    {
      tipo: "Retratada",
      quem: "está no grafo e nunca se cadastrou",
      podePedir: [
        "correção sobre si",
        "contestação de um verbete — que é encaminhada à Enciclopédia, não resolvida aqui",
      ],
      quantos: `${comSeparador(META.porClasse.pessoa ?? 0)} no protótipo · 43.614 na base completa`,
    },
  ];
}

export const A_CONTESTACAO_NAO_SE_RESOLVE_AQUI =
  "Contestação sobre verbete é encaminhada à Enciclopédia. O verbete é autoridade a " +
  "montante: resolvê-lo neste painel significaria o administrador da plataforma reescrevendo " +
  "o que uma enciclopédia afirma, sem ser a enciclopédia. O pedido segue com prazo, autor e " +
  "carimbo, e o estado dele fica visível para quem pediu.";

export const O_QUE_A_EXCLUSAO_LEVA =
  "Excluir uma conta leva junto repertório, salvos e sinais de uso — e a tela diz isso ANTES " +
  "de confirmar, porque quem pede exclusão da conta nem sempre sabe que está pedindo " +
  "exclusão da coleção que montou.";

export interface TipoDePedido {
  id: string;
  rotulo: string;
  prazo: string;
  deQuem: string;
}

/** Os quatro pedidos que a lei prevê, com o prazo declarado em cada um. */
export const TIPOS_DE_PEDIDO: readonly TipoDePedido[] = [
  { id: "acesso", rotulo: "Acesso", prazo: "15 dias", deQuem: "usuária ou retratada" },
  { id: "correcao", rotulo: "Correção", prazo: "15 dias", deQuem: "usuária ou retratada" },
  { id: "exportacao", rotulo: "Exportação", prazo: "15 dias", deQuem: "só usuária" },
  { id: "exclusao", rotulo: "Exclusão", prazo: "15 dias", deQuem: "só usuária" },
];

/** Resposta a um pedido de titular — a quinta forma de escrita da superfície (A8). */
export interface PedidoRespondido extends EscritaDoAdmin {
  tipo: "titular";
  pedido: string;
  titular: string;
  /** Encaminhado à Enciclopédia, atendido, ou recusado com motivo. */
  desfecho: string;
}

// ---------------------------------------------------------------------------
// A9 — os quatro poderes operacionais
// ---------------------------------------------------------------------------

export const SUSPENDER_NAO_E_APAGAR =
  "Apagar destrói procedência: o registro some e ninguém consegue mais dizer de onde ele " +
  "veio nem quem o publicou. Suspender preserva tudo isso e tira do ar. É por isso que esta " +
  "plataforma não tem apagar em lugar nenhum — não é cautela, é a condição para o resto do " +
  "argumento se sustentar.";

export interface PoderOperacional {
  id: string;
  titulo: string;
  oQueE: string;
  /** O que o torna irreversível ou perigoso, e o que a tela faz a respeito. */
  cuidado: string;
}

export const PODERES_OPERACIONAIS: readonly PoderOperacional[] = [
  {
    id: "suspensao",
    titulo: "Suspender sem apagar",
    oQueE: "tirar do ar uma entidade ou uma organização, mantendo o registro e a procedência.",
    cuidado:
      "reversível por construção. A suspensão é um estado, não uma exclusão, e o histórico " +
      "continua legível — inclusive o de quem suspendeu.",
  },
  {
    id: "chaves",
    titulo: "Chaves de integração",
    oQueE: "acesso programático por organização, com escopo e limite de taxa.",
    cuidado:
      "a chave é mostrada uma vez e não volta a aparecer. Revogar é imediato e fica na " +
      "trilha; o que a chave já leu não volta atrás, e a tela não finge que volta.",
  },
  {
    id: "envio",
    titulo: "Envio em massa",
    oQueE: "quem pode disparar comunicação para a base.",
    cuidado:
      "ATO IRREVERSÍVEL. Mensagem enviada não se recolhe. A autorização é nominal, tem " +
      "limite declarado e registro — e é o único poder desta tela que a suspensão não desfaz.",
  },
  {
    id: "superficies",
    titulo: "Publicar e desligar superfícies",
    oQueE: "ligar ou desligar um módulo inteiro do produto.",
    cuidado:
      "desligar uma superfície tira do ar o trabalho de quem escreve nela. O estado de cada " +
      "uma fica visível aqui para que o desligamento seja uma decisão, e não um efeito.",
  },
];


// ---------------------------------------------------------------------------
// A10 — desempenho da moderação por escopo (funcionalidade 169)
// ---------------------------------------------------------------------------

/**
 * A REGRA QUE SEPARA ESTA TELA DA M9, e ela precisa estar impressa.
 *
 * A M9 é o histórico do moderador, para ele. Esta é a medição ENTRE moderadores, para o
 * Admin. Confundir as duas transforma auditoria em vigilância de desempenho individual — e a
 * diferença não está no dado, está em para que ele serve: detectar fila parada e censura
 * silenciosa é sobre o sistema; ranquear pessoa por volume decidido é sobre a pessoa.
 */
export const O_RECORTE_DESTA_TELA =
  "Esta tela mede a FILA, não a pessoa. A medição entre moderadores existe para achar fila " +
  "parada e discordância sistemática — não para ranquear quem decide mais rápido. O " +
  "histórico individual de cada moderador é da tela dele, e não sobe para cá: um painel de " +
  "administração que ranqueia pessoas por volume transforma auditoria em vigilância, e a " +
  "primeira coisa que ele produz é gente decidindo depressa para não aparecer embaixo.";

export interface MedidaDaModeracao {
  id: string;
  medida: string;
  oQueRevela: string;
  /** O que precisaria existir para medir. Vazio quando já é medível hoje. */
  precisaDe: string;
  /** O valor de hoje, quando existe. */
  hoje: string;
  sustentada: boolean;
}

/**
 * As cinco medidas da funcionalidade 169 — e NENHUMA DELAS É MEDÍVEL HOJE, porque as quatro
 * primeiras exigem decisões tomadas, e a fila do protótipo nunca foi decidida por ninguém.
 *
 * A tela declara isso com denominador em vez de exibir zeros. Um «tempo médio de fila:
 * 0min» seria a afirmação de que a fila é instantânea, quando o fato é que ninguém decidiu
 * nada ainda. Zero medido e ausência de medição são coisas diferentes, e é a regra da casa.
 *
 * A quinta É medível pela metade, e é a mais interessante: a densidade por território existe
 * no acervo, então a tela mostra o lado que sustenta — quais territórios têm pouco acervo —
 * e declara que o outro lado, o tempo de fila, ainda não existe. Um território com pouco
 * acervo e fila parada é abandono; com pouco acervo e sem fila, é só pouco acervo. Sem as
 * duas pontas não se separa uma coisa da outra, e a tela diz isso.
 */
export function medidasDaModeracao(): MedidaDaModeracao[] {
  const n = numerosDaModeracao();
  const d = densidadePorUf();
  const semDecisao =
    "decisões tomadas na fila. A fila do protótipo tem itens e nunca foi decidida por " +
    "ninguém — não há nenhuma decisão registrada para medir.";

  return [
    {
      id: "tempo-de-fila",
      medida: "Tempo de fila por escopo",
      oQueRevela: "onde a moderação não dá conta, separado por território, classe e fila.",
      precisaDe: semDecisao,
      hoje: `${n.itensNaFila} itens na fila, ${n.ufsNaFila} unidades federativas representadas`,
      sustentada: false,
    },
    {
      id: "volume-decidido",
      medida: "Volume decidido, por ação",
      oQueRevela: "quanto foi aprovado, editado, vetado e devolvido.",
      precisaDe: semDecisao,
      hoje: `${n.acoes} ações possíveis, ${n.acoesQueExigemMotivo} delas exigindo motivo escrito`,
      sustentada: false,
    },
    {
      id: "concordancia",
      medida: "Concordância entre moderadores",
      oQueRevela:
        "censura silenciosa. Dois moderadores decidindo o oposto sobre itens semelhantes é o " +
        "sintoma que nenhum número de volume mostra.",
      precisaDe:
        "decisões de mais de um moderador sobre itens semelhantes. Não há nenhuma decisão, " +
        "e não há mais de um moderador.",
      hoje: "—",
      sustentada: false,
    },
    {
      id: "taxa-de-veto",
      medida: "Taxa de veto, com motivo agrupado",
      oQueRevela:
        "se um motivo de veto está sendo usado como atalho — e é o motivo agrupado, não a " +
        "pessoa, que responde isso.",
      precisaDe: semDecisao,
      hoje: `${n.motivosDeDenuncia} motivos declarados no vocabulário`,
      sustentada: false,
    },
    {
      id: "fila-por-territorio",
      medida: "Fila parada por território, cruzada com a densidade",
      oQueRevela:
        "abandono. Um território com pouco acervo E fila parada é abandono; com pouco acervo " +
        "e sem fila, é só pouco acervo. Sem as duas pontas não se separa uma coisa da outra.",
      precisaDe:
        "o tempo de fila por território. A densidade já existe: " +
        `${d.semRegistro.length} unidades federativas sem nenhum registro e ` +
        `${d.comUmRegistro.length} com um só.`,
      hoje:
        `${d.ufs.length} unidades medidas · ${d.semRegistro.map((u) => u.titulo).join(" e ")} ` +
        `sem registro nenhum`,
      sustentada: false,
    },
  ];
}

export const POR_QUE_NENHUMA_FECHA =
  "As cinco medidas desta tela dependem de decisões tomadas, e a fila do protótipo nunca foi " +
  "decidida. A tela mostra o que existe hoje ao lado de cada uma e declara o que falta, em " +
  "vez de exibir cinco zeros — «tempo médio de fila: 0» afirmaria que a fila é instantânea, " +
  "quando o fato é que ninguém decidiu nada ainda. Cada decisão que a Moderação registrar " +
  "acende uma destas linhas sem ninguém tocar em código.";

// ---------------------------------------------------------------------------
// A7 — a trilha de auditoria, e a única tela do Admin sem escrita
// ---------------------------------------------------------------------------

/**
 * A FRASE QUE A TELA IMPRIME, e que é o motivo de ela existir.
 *
 * Num sistema cuja tese é procedência honesta, o administrador é o único papel capaz de
 * destruí-la em silêncio. A trilha imutável é o que impede isso — e é por isso que ela é a
 * única tela desta superfície sem uma única ação de escrita.
 */
export const POR_QUE_A_TRILHA_NAO_TEM_BOTAO =
  "O administrador é o único papel com poder de mudar tudo sem que ninguém veja. A trilha " +
  "é o que impede isso, e uma trilha que o administrador pudesse editar não impediria nada. " +
  "Por isso esta é a única tela do painel sem nenhuma ação de escrita: ela lê o registro e " +
  "não o apaga.";

export const NAO_EXISTE_APAGAR =
  "Não existe apagar em lugar nenhum desta plataforma. Existe suspender, com rastro. Apagar " +
  "destrói procedência; suspender a preserva, e a diferença entre as duas é o que separa uma " +
  "plataforma auditável de uma que só afirma ser.";

/** Por qual eixo a trilha é filtrada. Vocabulário fechado — três filtros, nem um a mais. */
export type FiltroDaTrilha =
  | "tudo"
  | "parametro"
  | "municipio"
  | "papel"
  | "limite-ia"
  | "titular";

export interface DescricaoDoFiltro {
  filtro: FiltroDaTrilha;
  rotulo: string;
  /** O que este tipo de escrita muda no sistema, para a lista não virar log opaco. */
  oQueMuda: string;
}

export const FILTROS_DA_TRILHA: readonly DescricaoDoFiltro[] = [
  {
    filtro: "tudo",
    rotulo: "Tudo",
    oQueMuda: "toda escrita desta superfície, na ordem em que entrou.",
  },
  {
    filtro: "parametro",
    rotulo: "Parâmetro do motor",
    oQueMuda:
      "muda o que a caminhada produz para todo mundo — é a escrita de maior alcance do " +
      "sistema, feita por uma pessoa só.",
  },
  {
    filtro: "municipio",
    rotulo: "Tabela de centroides",
    oQueMuda: "move entidades de um centroide de país para o do município, no mapa público.",
  },
  {
    filtro: "papel",
    rotulo: "Concessão de papel",
    oQueMuda: "autoriza uma pessoa a produzir um valor de procedência que ela não produzia.",
  },
  {
    filtro: "titular",
    rotulo: "Pedido de titular",
    oQueMuda:
      "responde a alguém que exerceu um direito sobre os próprios dados — e o prazo dessa " +
      "resposta é contado por lei, não por conveniência.",
  },
  {
    filtro: "limite-ia",
    rotulo: "Limite da IA",
    oQueMuda:
      "muda a resposta do produto à pergunta mais difícil do edital — o que a máquina pode " +
      "e o que ela não pode, mesmo alcançando.",
  },
];

/** O rótulo de uma escrita, para a linha da trilha dizer o que aconteceu em português. */
export function descreverEvento(e: EventoDeAuditoria): { acao: string; alvo: string } {
  switch (e.tipo) {
    case "parametro":
      return {
        acao: "mudou parâmetro do motor",
        alvo: `${e.parametroId}: ${e.de} → ${e.para}`,
      };
    case "municipio":
      return {
        acao: "acrescentou município à tabela",
        alvo: `${e.municipio} — move ${e.entidadesMovidas} entidade(s) de centroide de país`,
      };
    case "limite-ia":
      return { acao: "acrescentou limite à IA", alvo: e.texto };
    case "titular":
      return {
        acao: "respondeu pedido de titular",
        alvo: `${e.pedido} · ${e.titular} — ${e.desfecho}`,
      };
    case "papel":
      return {
        acao: "concedeu papel",
        alvo: `${e.pessoa} — ${e.papel} · ${escopoEscrito(e)} · autoriza carimbo ${e.procedenciaAutorizada}`,
      };
  }
}

// ---------------------------------------------------------------------------
// Observabilidade (A6) — frescor, cobertura e a conferência de três pontas
// ---------------------------------------------------------------------------

export interface CoberturaDeclarada {
  id: string;
  rotulo: string;
  /** Quantos SIM, já com separador de milhar. */
  com: string;
  /** O denominador: quantos ao todo. Nunca omitido. */
  de: string;
  nota: string;
}

export interface FatiaDeProcedenciaDoAdmin {
  procedencia: Procedencia;
  /** «Itaú Cultural», «derivado por nós» — o rótulo de produto, reusado do Observatório
   *  para as duas superfícies não chamarem a mesma fatia por nomes diferentes. */
  rotulo: string;
  nos: number;
  nosEscrito: string;
  arestas: number;
  arestasEscrito: string;
  /** Já em português: «61,8%», nunca «61.8%». */
  percentualDeNos: string;
  percentualDeArestas: string;
}

export interface ConferenciaDeTresPontas {
  fecha: boolean;
  /** O que foi comparado, em português, para a tela dizer o que ela conferiu. */
  oQueFoiConferido: string;
  divergencias: string[];
}

export interface ObservabilidadeDoAdmin {
  geradoEm: string;
  /** «22.08.2026» — a data como se escreve em português. */
  geradoEmEscrito: string;
  dataDeReferencia: string;
  dataDeReferenciaEscrita: string;
  /** Dias entre o build do grafo e a data de referência. Nunca o relógio de quem avalia. */
  diasDesdeAGeracao: number;
  /** «no mesmo dia», «1 dia», «12 dias» — o número já virado frase. */
  diasEscritos: string;
  coberturas: CoberturaDeclarada[];
  procedencia: FatiaDeProcedenciaDoAdmin[];
  totalDeNos: number;
  totalDeNosEscrito: string;
  totalDeArestas: number;
  totalDeArestasEscrito: string;
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

  const dias = diasEntre(META.geradoEm, DATA_DE_REFERENCIA);

  return {
    geradoEm: META.geradoEm,
    geradoEmEscrito: dataCurta(META.geradoEm),
    dataDeReferencia: DATA_DE_REFERENCIA,
    dataDeReferenciaEscrita: dataCurta(DATA_DE_REFERENCIA),
    diasDesdeAGeracao: dias,
    diasEscritos: dias === 0 ? "no mesmo dia" : dias === 1 ? "1 dia" : `${dias} dias`,
    coberturas: [
      {
        id: "imagens",
        rotulo: "Imagens presentes no disco",
        com: comSeparador(img.presentes),
        de: comSeparador(img.arquivos),
        nota:
          `${img.chavesRejeitadas} chave rejeitada · ${img.donosDesconhecidos} dono desconhecido · ` +
          `${comSeparador(META.cobertura.entidadesComImagemLocal)} entidades com imagem local`,
      },
      {
        id: "coordenadas",
        rotulo: "Entidades com coordenada",
        com: comSeparador(META.cobertura.coordenadas.comCoordenada),
        de: comSeparador(
          META.cobertura.coordenadas.comCoordenada + META.cobertura.semCoordenada.total,
        ),
        nota:
          META.cobertura.semCoordenada.total === 0
            ? "nenhuma entidade situável ficou sem coordenada — o que não quer dizer coordenada precisa. " +
              "A precisão está na distribuição por método, na tela de territórios."
            : `${META.cobertura.semCoordenada.total} sem coordenada`,
      },
      {
        id: "ficha-de-acessibilidade",
        rotulo: "Declaram a ficha de acessibilidade",
        com: comSeparador(META.fichaDeAcessibilidade.declaram),
        de: comSeparador(
          META.fichaDeAcessibilidade.declaram + META.fichaDeAcessibilidade.naoDeclaram,
        ),
        nota:
          `${comSeparador(META.fichaDeAcessibilidade.naoDeclaram)} não declaram. Não declarar é ` +
          `diferente de não oferecer, e o sistema não lê uma coisa como a outra.`,
      },
    ],
    procedencia: procedencias.map((p) => ({
      procedencia: p,
      rotulo: ROTULO_DA_PROCEDENCIA[p],
      nos: META.porProcedencia[p] ?? 0,
      nosEscrito: comSeparador(META.porProcedencia[p] ?? 0),
      arestas: META.porProcedenciaDeAresta[p] ?? 0,
      arestasEscrito: comSeparador(META.porProcedenciaDeAresta[p] ?? 0),
      percentualDeNos: emPorcento((META.porProcedencia[p] ?? 0) / totalDeNos),
      percentualDeArestas: emPorcento((META.porProcedenciaDeAresta[p] ?? 0) / totalDeArestas),
    })),
    totalDeNos,
    totalDeNosEscrito: comSeparador(totalDeNos),
    totalDeArestas,
    totalDeArestasEscrito: comSeparador(totalDeArestas),
    conferencia: conferirTresPontas(),
    reprocessamentoEhMockado:
      "O protótipo é exportado como arquivo estático e não tem servidor próprio: a passada do " +
      "gerador acontece fora, pela " +
      "linha de comando, e o botão desta tela registraria o pedido sem executá-lo. Ele não " +
      "existe — um botão que não faz o que diz é pior que a ausência dele.",
  };
}
