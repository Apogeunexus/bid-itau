/**
 * frase.ts — as REGRAS DECLARADAS que traduzem uma frase em critérios (AGEN-07, D-64, D-65).
 *
 * ---------------------------------------------------------------------------
 * D-65 — POR QUE ESTE ARQUIVO EXISTE EM VEZ DE UMA CHAMADA DE MODELO
 * ---------------------------------------------------------------------------
 * O protótipo NÃO CHAMA IA. Nenhuma. Este arquivo é a alternativa inteira: um punhado de
 * regras escritas, listáveis, cada uma com nome e exemplo, que a tela mostra na íntegra.
 *
 * Isso não é uma limitação disfarçada de virtude. O que a proposta está vendendo não é o
 * modelo — é o CONTROLE que a pessoa tem sobre a consulta. Um modelo que acertasse a
 * tradução e não a mostrasse seria pior para a banca do que uma regra que erra e se
 * explica, porque a regra pode ser corrigida em um toque e o modelo não. Por isso
 * `regras()` é exportada: a lista é o argumento, e uma regra que não caiba numa linha
 * legível não deve existir.
 *
 * Consequências duras, e elas valem para todo este arquivo:
 *   - nenhuma pontuação probabilística, nenhum sorteio, nenhuma heurística que não caiba
 *     numa frase em português;
 *   - `traduzir` é DETERMINÍSTICA: a mesma frase devolve exatamente o mesmo objeto;
 *   - nenhum pacote novo. Uma biblioteca de PLN acionaria a auditoria de legitimidade de
 *     pacote que esta fase não fez, e resolveria um problema que a tela não tem.
 *
 * ---------------------------------------------------------------------------
 * DP-F — POR QUE ESTE ARQUIVO NÃO IMPORTA `./grafo`
 * ---------------------------------------------------------------------------
 * `traduzir` roda NO CLIENTE: a frase é editável e cada tecla retraduz (D-64 — a tradução
 * é a resposta, não um passo escondido, então ela tem de acompanhar a edição). Se este
 * módulo importasse `./grafo`, os 9,4 MB de `entidades.json` e os 13,6 MB de
 * `arestas.json` entrariam no grafo de módulos do navegador — de uma vez ou como chunk
 * assíncrono no disco exportado —, e as duas saídas violam DP-F.
 *
 * A saída é a MESMA de `indice.ts`: o acervo chega INJETADO. `traduzir(frase, indice)`
 * opera sobre o DTO colunar que já atravessa a fronteira RSC em `/buscar`;
 * `montarVizinhancaDeSemelhanca(fonte, …)` roda no build, dentro do componente de
 * servidor, e recebe as funções públicas de `grafo.ts` como argumento.
 *
 * ---------------------------------------------------------------------------
 * O QUE O ACERVO SUSTENTA, MEDIDO — e o que ele não sustenta
 * ---------------------------------------------------------------------------
 * A frase do RFP tem quatro pedaços e o acervo trata os quatro de forma diferente. Saber
 * qual é qual ANTES de escrever a regra é o que impede esta tela de ser teatro.
 *
 *   «parecido com a Bienal» — REAL. 116 entidades têm «Bienal» no título (51 eventos, 48
 *   temporadas, 14 conteúdos, 1 mídia, 1 termo, 1 espaço), 68 delas indexáveis. Delas
 *   saem 856 arestas `semelhante_a`, e cada uma carrega `motivo` escrito em português.
 *   É esse texto que explica por que cada resultado casa — nunca uma frase nossa.
 *
 *   «gratuito» — NÃO RECORTA, e isso PRECISA APARECER. As 2.425 ocorrências saem todas
 *   gratuitas porque `gratuito` é a negação de um campo de ingresso que NENHUM dos 300
 *   eventos declara. A ficha existe (a pessoa disse «gratuito» e a tradução tem de
 *   mostrar que entendeu) e declara na própria ficha, com o número, que a gratuidade não
 *   recortou nada. Uma ficha que finge filtrar é pior do que ficha nenhuma: ela ensina a
 *   banca a não confiar nas outras.
 *
 *   «perto de mim» — SEM RESPOSTA POSSÍVEL. Não há localização de quem usa, não há
 *   permissão de geolocalização (seria requisição de runtime, contra D-60 e D-25) e
 *   nenhuma das 2.425 ocorrências tem espaço. O que existe é território: 773 entradas
 *   situadas num estado brasileiro. A regra traduz para TERRITÓRIO e declara a
 *   substituição na ficha, com a escolha em aberto.
 *
 *   «algo» — VAGO, e vira a ausência de recorte de classe.
 *
 * O que nenhuma regra reconheceu volta em `naoEntendido` e NUNCA é escondido. Descartar
 * em silêncio é o comportamento de caixa preta que esta tela existe para contradizer.
 */

import {
  normalizar,
  slugDoTitulo,
  type CampoCriterio,
  type Criterio,
  type IndiceDTO,
  type OpcaoFaceta,
} from "./indice";
import type { ClasseEntidade, Entidade, Relacao, Vizinho } from "./tipos";

// ---------------------------------------------------------------------------
// A frase do Cenário 5
// ---------------------------------------------------------------------------

/**
 * A frase literal do RFP, palavra por palavra.
 *
 * Constante, e não texto digitado na demonstração: o roteiro da banca não pode depender
 * de alguém acertar a digitação sob pressão, e a tela abre com ela já traduzida.
 */
export const FRASE_DO_CENARIO_5 = "algo parecido com a Bienal, gratuito e perto de mim";

// ---------------------------------------------------------------------------
// Os números medidos que as fichas citam
// ---------------------------------------------------------------------------

/**
 * O que a gratuidade vale neste acervo, medido em `dados/` e conferido no grafo gerado.
 *
 * Estes números NÃO são estimativa e não são decorativos: eles são o conteúdo da ficha de
 * gratuidade. Se um dia o acervo declarar ingresso, a regra muda junto com eles.
 */
export const GRATUIDADE_MEDIDA = {
  ocorrencias: 2425,
  ocorrenciasGratuitas: 2425,
  eventos: 300,
  eventosComIngressoDeclarado: 0,
} as const;

// ---------------------------------------------------------------------------
// Achatamento que PRESERVA O ÍNDICE
// ---------------------------------------------------------------------------

/**
 * Caixa baixa sem diacrítico, **um caractere de saída por caractere de entrada**.
 *
 * `normalizar` de `indice.ts` colapsa espaços e apara as pontas, o que desloca as
 * posições — e esta tela precisa devolver o TRECHO LITERAL da frase que acionou cada
 * regra, para poder destacá-lo na frase de cima (D-64: a ligação entre o que se digitou e
 * o que virou critério tem de ser visível). Deslocar o índice pintaria o pedaço errado.
 *
 * O casamento continua idêntico ao de `normalizar` para efeito de comparação de palavra:
 * mesma decomposição NFD, mesmo bloco U+0300–U+036F, mesma caixa baixa.
 */
function achatar(texto: string): string {
  let saida = "";
  for (const caractere of texto) {
    const decomposto = caractere.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    saida += (decomposto === "" ? caractere : decomposto[0]).toLowerCase();
  }
  return saida;
}

/**
 * Milhar com ponto, à mão.
 *
 * `toLocaleString` é proibido: sob `output: "export"` este texto nasce no build e é
 * hidratado no navegador de quem avalia, e ICU diferente entre as duas pontas divergiria
 * — o gate de console limpo cairia por causa de um separador de milhar. A ficha de
 * gratuidade é o texto mais delicado da tela; ela diz «2.425» na linha curta e tem de
 * dizer «2.425» também no parágrafo, ou o mesmo número apareceria de duas formas.
 */
function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Letra, dígito ou não. Serve de fronteira de palavra sem depender de `\b` e Unicode. */
function ehLetra(caractere: string | undefined): boolean {
  return caractere !== undefined && /[a-z0-9]/.test(caractere);
}

// ---------------------------------------------------------------------------
// As regras, declaradas
// ---------------------------------------------------------------------------

export type IdRegra =
  | "semelhanca"
  | "gratuidade"
  | "proximidade"
  | "classe"
  | "linguagem"
  | "tema"
  | "procedencia"
  | "periodo"
  | "territorio";

export interface Regra {
  id: IdRegra;
  /** Nome legível em português. É o que a tela mostra na lista de regras. */
  nome: string;
  /** O que a regra reconhece, em uma linha. Se não couber numa linha, não deve existir. */
  padrao: string;
  /** Uma frase que aciona a regra. A banca pode digitá-la e ver acontecer. */
  exemplo: string;
  /** O campo de `consultar` que a regra produz — ou a declaração de que não produz. */
  produz: string;
}

/**
 * A ORDEM DESTA LISTA É A ORDEM DE APLICAÇÃO, e também a ordem das fichas na tela.
 *
 * Semelhança primeiro porque é o pedaço que mais recorta e o primeiro que a demonstração
 * remove. Vocabulário (classe, linguagem, tema) antes de gratuidade e proximidade porque
 * o casamento mais longo tem de consumir o trecho antes que uma regra curta o roube.
 */
const REGRAS: readonly Regra[] = [
  {
    id: "semelhanca",
    nome: "parecido com alguma coisa",
    padrao: "«parecido com X», «tipo X», «como X», «igual a X», «que nem X»",
    exemplo: "algo parecido com a Bienal",
    produz: "texto — X casado contra o índice, com a entidade âncora identificada",
  },
  {
    id: "classe",
    nome: "que tipo de coisa",
    padrao: "«exposição», «show», «artista», «livro», «vídeo», «verbete», «curso»…",
    exemplo: "exposição parecida com a Bienal",
    produz: "classe — uma das 15 classes do índice",
  },
  {
    id: "linguagem",
    nome: "linguagem artística",
    padrao: "qualquer um dos 33 rótulos de linguagem do vocabulário gerado",
    exemplo: "teatro em Pernambuco",
    produz: "linguagem — pelo rótulo do vocabulário, nunca por lista escrita à mão",
  },
  {
    id: "tema",
    nome: "assunto",
    padrao: "qualquer um dos 94 rótulos de tema do vocabulário gerado",
    exemplo: "arte contemporânea no Rio de Janeiro",
    produz: "tema — pelo rótulo do vocabulário",
  },
  {
    id: "territorio",
    nome: "onde",
    padrao: "o nome de um dos 108 estados que a hierarquia `situado_em` do acervo resolveu",
    exemplo: "teatro em Pernambuco",
    produz: "território — pelo rótulo do acervo, nunca por lista de UF escrita à mão",
  },
  {
    id: "gratuidade",
    nome: "de graça",
    padrao: "«grátis», «gratuito», «de graça», «sem pagar», «sem custo», «entrada franca»",
    exemplo: "teatro gratuito",
    produz: "classe: evento — e a ficha DECLARA que a gratuidade em si não recorta",
  },
  {
    id: "periodo",
    nome: "quando",
    padrao: "«hoje», «amanhã», «neste fim de semana», «histórico», «antigo»",
    exemplo: "show hoje",
    produz: "classe: evento — nunca uma janela de data (D-48)",
  },
  {
    id: "procedencia",
    nome: "de onde veio o registro",
    padrao: "«do acervo», «da enciclopédia», «do Itaú Cultural», «autorado», «derivado»",
    exemplo: "verbete da enciclopédia",
    produz: "procedência — ic, derivado ou autorado",
  },
  {
    id: "proximidade",
    nome: "perto de mim",
    padrao: "«perto de mim», «aqui perto», «na minha cidade», «por perto», «aqui do lado»",
    exemplo: "cinema perto de mim",
    produz: "território — e a ficha DECLARA a substituição, porque não há sua localização",
  },
] as const;

/**
 * A lista completa das regras, com nome e exemplo.
 *
 * Exportada porque a TELA MOSTRA ESTA LISTA. É isso que torna o casamento «por regra
 * declarada» (D-65) em vez de uma caixa preta menor do que um modelo.
 */
export function regras(): Regra[] {
  return REGRAS.map((regra) => ({ ...regra }));
}

// ---------------------------------------------------------------------------
// Os padrões que cada família reconhece
// ---------------------------------------------------------------------------

/**
 * Os gatilhos de semelhança. O que vem DEPOIS do gatilho é a âncora.
 *
 * `de` opcional em «parecido com» cobre «parecida com», e a lista é ordenada do mais
 * longo para o mais curto para que «que nem» não seja roubado por «nem».
 */
const GATILHOS_SEMELHANCA = [
  "parecido com",
  "parecida com",
  "parecidos com",
  "parecidas com",
  "semelhante a",
  "semelhante ao",
  "semelhante à",
  "que nem",
  "igual a",
  "igual ao",
  "igual à",
  "no estilo de",
  "na linha de",
  "tipo",
  "como",
];

/** Artigos e preposições que abrem a âncora e não fazem parte do nome dela. */
const ABERTURAS_DE_ANCORA = ["a ", "o ", "as ", "os ", "um ", "uma ", "the "];

/** Onde a âncora termina: pontuação ou conectivo. Tudo antes disso é o nome. */
const FIM_DE_ANCORA = /[,;.!?]|\s+(?:e|ou|mas|porem|que seja|de graca|gratis|gratuito|perto|aqui|no|na)\s/;

const GATILHOS_GRATUIDADE = [
  "entrada franca",
  "entrada gratuita",
  "de graca",
  "sem pagar",
  "sem custo",
  "sem ingresso",
  "gratuito",
  "gratuita",
  "gratuitos",
  "gratuitas",
  "gratis",
];

const GATILHOS_PROXIMIDADE = [
  "perto de mim",
  "perto de casa",
  "aqui perto",
  "aqui do lado",
  "por perto",
  "na minha cidade",
  "na minha regiao",
  "no meu bairro",
  "perto daqui",
];

const GATILHOS_PERIODO: Array<{ termo: string; leitura: string }> = [
  { termo: "neste fim de semana", leitura: "«neste fim de semana»" },
  { termo: "no fim de semana", leitura: "«no fim de semana»" },
  { termo: "depois de amanha", leitura: "«depois de amanhã»" },
  { termo: "esta semana", leitura: "«esta semana»" },
  { termo: "hoje a noite", leitura: "«hoje à noite»" },
  { termo: "amanha", leitura: "«amanhã»" },
  { termo: "hoje", leitura: "«hoje»" },
  { termo: "historico", leitura: "«histórico»" },
  { termo: "antigo", leitura: "«antigo»" },
];

const GATILHOS_PROCEDENCIA: Array<{ termo: string; valor: string; rotulo: string }> = [
  { termo: "do itau cultural", valor: "ic", rotulo: "acervo do Itaú Cultural" },
  { termo: "da enciclopedia", valor: "ic", rotulo: "acervo do Itaú Cultural" },
  { termo: "do acervo", valor: "ic", rotulo: "acervo do Itaú Cultural" },
  { termo: "autorado", valor: "autorado", rotulo: "escrito pela curadoria" },
  { termo: "derivado", valor: "derivado", rotulo: "derivado por regra" },
];

/**
 * Sinônimos de classe → a classe da ontologia, com o motivo de cada leitura.
 *
 * `exposicao` não é classe do grafo: exposição é um evento com sessões, e é assim que o
 * acervo a grava. Mapear para `evento` é leitura declarada, não invenção — e a ficha diz
 * qual palavra virou qual classe.
 */
const SINONIMOS_DE_CLASSE: Array<{ termo: string; classe: ClasseEntidade }> = [
  { termo: "exposicoes", classe: "evento" },
  { termo: "exposicao", classe: "evento" },
  { termo: "mostra", classe: "evento" },
  { termo: "festival", classe: "evento" },
  { termo: "espetaculo", classe: "evento" },
  { termo: "evento", classe: "evento" },
  { termo: "eventos", classe: "evento" },
  { termo: "artista", classe: "pessoa" },
  { termo: "artistas", classe: "pessoa" },
  { termo: "pessoa", classe: "pessoa" },
  { termo: "coletivo", classe: "coletivo" },
  { termo: "grupo", classe: "coletivo" },
  { termo: "obra", classe: "obra" },
  { termo: "obras", classe: "obra" },
  { termo: "livro", classe: "publicacao" },
  { termo: "livros", classe: "publicacao" },
  { termo: "publicacao", classe: "publicacao" },
  { termo: "revista", classe: "publicacao" },
  { termo: "video", classe: "midia" },
  { termo: "videos", classe: "midia" },
  { termo: "podcast", classe: "midia" },
  { termo: "midia", classe: "midia" },
  { termo: "verbete", classe: "termo" },
  { termo: "verbetes", classe: "termo" },
  { termo: "materia", classe: "conteudo" },
  { termo: "reportagem", classe: "conteudo" },
  { termo: "editorial", classe: "conteudo" },
  { termo: "curso", classe: "formacao" },
  { termo: "cursos", classe: "formacao" },
  { termo: "oficina", classe: "formacao" },
  { termo: "formacao", classe: "formacao" },
  { termo: "museu", classe: "espaco" },
  { termo: "espaco", classe: "espaco" },
  { termo: "lugar", classe: "espaco" },
  { termo: "instituicao", classe: "instituicao" },
  { termo: "produtor", classe: "instituicao" },
  { termo: "trilha", classe: "trilha" },
];

/**
 * O pedaço vago. Sem qualificador, a busca fica sobre as 15 classes do índice.
 *
 * Vago NÃO é «não entendido»: a regra reconheceu a palavra e sabe o que ela quer dizer —
 * que não há recorte de classe. Misturar as duas listas faria a tela dizer que não
 * entendeu justamente a palavra que ela entendeu melhor.
 */
const VAGOS: Array<{ termo: string; leitura: string }> = [
  { termo: "alguma coisa", leitura: "sem recorte de classe — a busca fica sobre as 15 classes do índice" },
  { termo: "qualquer coisa", leitura: "sem recorte de classe — a busca fica sobre as 15 classes do índice" },
  { termo: "algo", leitura: "sem recorte de classe — a busca fica sobre as 15 classes do índice" },
  { termo: "coisa", leitura: "sem recorte de classe — a busca fica sobre as 15 classes do índice" },
];

/**
 * Palavras vazias do português.
 *
 * Elas saem do «não entendi» porque ninguém espera que «de» vire critério, e uma lista de
 * preposições no bloco de não entendido esconderia a palavra que de fato ficou de fora.
 */
const PALAVRAS_VAZIAS = new Set([
  "a", "à", "ao", "aos", "as", "às", "com", "da", "das", "de", "do", "dos", "e", "em",
  "entre", "eu", "na", "nas", "no", "nos", "num", "numa", "o", "os", "ou", "para", "pra",
  "por", "quero", "queria", "quer", "que", "se", "sem", "ser", "seja", "sobre", "um",
  "uma", "uns", "umas", "me", "mim", "meu", "minha", "algum", "alguma", "tem", "ter",
  "vai", "estar", "esta", "este", "isso", "aqui", "ali", "la", "lá", "mas", "muito",
  "mais", "menos", "so", "só", "bem", "todo", "toda", "todos", "todas", "hoje",
]);

// ---------------------------------------------------------------------------
// O que a tradução devolve
// ---------------------------------------------------------------------------

/**
 * Um critério traduzido.
 *
 * `campo` e `valor` estão na forma que `consultar` de `indice.ts` aceita — é o MESMO
 * índice das duas telas, e é o que faz o recálculo ao vivo de D-64 e o afrouxamento de
 * D-66 virem de `porCriterio` em vez de uma segunda consulta escrita aqui.
 *
 * O resto são as marcas que a ficha mostra na tela, e as duas mais importantes são as que
 * confessam: `naoRecorta` e `substituicaoDeclarada`.
 */
export interface CriterioTraduzido extends Criterio {
  /** O id da regra que produziu este critério. Sempre presente (D-65). */
  regra: IdRegra;
  /**
   * O mesmo critério em duas ou três palavras, para a frase COMPOSTA de «por que casa».
   *
   * A moldura é apertada e o corte é POR PROCEDÊNCIA: o que nós escrevemos pode
   * encurtar, o motivo escrito no acervo não pode. `rotulo` é a ficha, que tem espaço
   * para a leitura inteira; `rotuloCurto` é o que entra na linha do resultado.
   */
  rotuloCurto: string;
  /** O pedaço LITERAL da frase que acionou a regra — a tela o destaca lá em cima. */
  trecho: string;
  /** Posição do trecho na frase original, para o destaque ser fatiamento de string. */
  inicio: number;
  fim: number;
  /** A ficha recorta, mas o que a pessoa PEDIU não recorta. A frase explica o quê. */
  naoRecorta?: boolean;
  naoRecortaFrase?: string;
  /** A regra trocou o que foi pedido por outra coisa, e a ficha diz qual e por quê. */
  substituicaoDeclarada?: boolean;
  substituicaoFrase?: string;
  /** Só em `semelhanca`: contra o que X foi resolvido no índice. */
  ancora?: { termo: string; chave: string; titulo: string; entradas: number };
  /** Só em `proximidade`: os territórios entre os quais a pessoa escolhe. */
  opcoes?: OpcaoFaceta[];
}

export interface Traducao {
  /** A frase de origem, literal. */
  frase: string;
  criterios: CriterioTraduzido[];
  /** As palavras que NENHUMA regra consumiu. Nunca escondidas. */
  naoEntendido: string[];
  diagnostico: {
    /** As palavras vagas reconhecidas, com o que a regra fez com elas. */
    vagos: Array<{ termo: string; leitura: string }>;
    /** Os ids das regras que dispararam, na ordem de aplicação. */
    regrasDisparadas: IdRegra[];
    /** Quantas das palavras não vazias da frase alguma regra consumiu. */
    palavrasLidas: number;
    palavrasTotais: number;
    /** `true` quando a tradução rodou sem índice: sem vocabulário e sem âncora. */
    semIndice: boolean;
  };
}

// ---------------------------------------------------------------------------
// Índice ativo — conveniência para script e gate, no mesmo gesto de `indice.ts`
// ---------------------------------------------------------------------------

let indiceAtivo: IndiceDTO | null = null;

/**
 * Guarda o índice para as chamadas que não o passam explicitamente.
 *
 * A TELA SEMPRE PASSA O DTO. Isto existe para o script de verificação e para o gate, que
 * montam o índice uma vez e traduzem várias frases.
 */
export function usarIndice(indice: IndiceDTO): IndiceDTO {
  indiceAtivo = indice;
  return indice;
}

// ---------------------------------------------------------------------------
// A máquina de consumo
// ---------------------------------------------------------------------------

/** Marca de consumo, um caractere por caractere da frase. */
type Consumo = boolean[];

function livre(consumo: Consumo, inicio: number, fim: number): boolean {
  for (let i = inicio; i < fim; i += 1) if (consumo[i]) return false;
  return true;
}

function consumir(consumo: Consumo, inicio: number, fim: number): void {
  for (let i = inicio; i < fim; i += 1) consumo[i] = true;
}

/**
 * Acha `termo` (já achatado) na frase achatada, em fronteira de palavra e em posição
 * ainda livre. Devolve a posição ou -1.
 */
function acharTermo(achatada: string, termo: string, consumo: Consumo, desde = 0): number {
  let cursor = desde;
  for (;;) {
    const i = achatada.indexOf(termo, cursor);
    if (i < 0) return -1;
    const fim = i + termo.length;
    const antes = achatada[i - 1];
    const depois = achatada[fim];
    if (!ehLetra(antes) && !ehLetra(depois) && livre(consumo, i, fim)) return i;
    cursor = i + 1;
  }
}

// ---------------------------------------------------------------------------
// traduzir
// ---------------------------------------------------------------------------

/**
 * A frase vira critérios visíveis (D-64), por regra declarada (D-65).
 *
 * DETERMINÍSTICA: mesma frase, mesmo índice, mesmo objeto — byte a byte. Nenhum
 * `Math.random`, nenhum `Date`, nenhuma ordenação sensível a locale, nenhuma chamada de
 * rede. Traduzir duas vezes e comparar por `JSON.stringify` é parte do gate.
 */
export function traduzir(frase: string, indice?: IndiceDTO): Traducao {
  const dto = indice ?? indiceAtivo ?? null;
  const achatada = achatar(frase);
  const consumo: Consumo = new Array<boolean>(frase.length).fill(false);
  const criterios: CriterioTraduzido[] = [];
  const vagos: Array<{ termo: string; leitura: string }> = [];
  const disparadas: IdRegra[] = [];

  const registrar = (criterio: CriterioTraduzido) => {
    // Critério repetido (mesma ficha por duas regras — «gratuito» e «hoje» produzem os
    // dois `classe: evento`) entra UMA vez. Duas fichas idênticas removíveis fariam o
    // recálculo mentir: tirar uma não mudaria nada, e o número «sem ela» diria 0.
    const chave = `${criterio.campo}:${criterio.valor}`;
    if (criterios.some((c) => `${c.campo}:${c.valor}` === chave)) return;
    criterios.push(criterio);
    if (!disparadas.includes(criterio.regra)) disparadas.push(criterio.regra);
  };

  // --- 1. semelhança -------------------------------------------------------
  // O pedaço forte da frase, e o único que resolve contra o acervo.
  for (const gatilho of GATILHOS_SEMELHANCA) {
    const posicao = acharTermo(achatada, gatilho, consumo);
    if (posicao < 0) continue;

    let inicioAncora = posicao + gatilho.length;
    while (achatada[inicioAncora] === " ") inicioAncora += 1;
    for (const abertura of ABERTURAS_DE_ANCORA) {
      if (achatada.startsWith(abertura, inicioAncora)) {
        inicioAncora += abertura.length;
        break;
      }
    }

    const resto = achatada.slice(inicioAncora);
    const corte = FIM_DE_ANCORA.exec(resto);
    const fimAncora = inicioAncora + (corte ? corte.index : resto.length);
    const termo = frase.slice(inicioAncora, fimAncora).trim();
    if (termo.length < 2) continue;

    const alvo = normalizar(termo);
    let ancora: CriterioTraduzido["ancora"];
    if (dto) {
      // A âncora é resolvida CONTRA O ÍNDICE — não contra uma lista escrita aqui. Entre
      // as entradas que casam, a mais bem posicionada pela regra de ordenação de
      // `indice.ts`: casamento no começo do título, depois entrada com imagem no acervo.
      let melhor: { chave: string; titulo: string; peso: number } | null = null;
      let entradas = 0;
      for (let i = 0; i < dto.total; i += 1) {
        const titulo = dto.t[i];
        const normalizado = normalizar(titulo);
        const em = normalizado.indexOf(alvo);
        if (em < 0) continue;
        entradas += 1;
        const noInicio = em === 0 || normalizado[em - 1] === " ";
        const peso = (noInicio ? 0 : 1000) + em;
        if (!melhor || peso < melhor.peso) {
          // O slug sai VAZIO no DTO quando é derivável do título — a elisão que
          // `indice.ts` mediu em 3.317 das 5.092 entradas. Reconstruí-lo pela mesma
          // função é obrigatório: ler o campo cru produziria `evento_` como chave.
          const classe = dto.classes[parseInt(dto.c[i], 36)];
          const slug = dto.s[i] === "" ? slugDoTitulo(titulo) : dto.s[i];
          melhor = { chave: `${classe}_${slug}`, titulo, peso };
        }
      }
      if (melhor) ancora = { termo, chave: melhor.chave, titulo: melhor.titulo, entradas };
      else ancora = { termo, chave: "", titulo: "", entradas: 0 };
    }

    consumir(consumo, posicao, fimAncora);
    registrar({
      campo: "texto",
      valor: termo,
      rotulo: `parecido com «${termo}»`,
      rotuloCurto: `«${termo}» no título`,
      regra: "semelhanca",
      trecho: frase.slice(posicao, fimAncora).trim(),
      inicio: posicao,
      fim: fimAncora,
      ancora,
    });
    break;
  }

  // --- 2. vocabulário: classe, linguagem, tema -----------------------------
  // Casamento mais LONGO primeiro: «arte contemporânea» é tema e tem de consumir o
  // trecho antes que «Arte», que é linguagem, roube o pedaço «arte».
  const doVocabulario: Array<{
    termo: string;
    campo: CampoCriterio;
    valor: string;
    rotulo: string;
    regra: IdRegra;
  }> = [];

  for (const sinonimo of SINONIMOS_DE_CLASSE) {
    doVocabulario.push({
      termo: sinonimo.termo,
      campo: "classe",
      valor: sinonimo.classe,
      rotulo: sinonimo.classe,
      regra: "classe",
    });
  }
  if (dto) {
    for (const opcao of dto.facetas.linguagem) {
      doVocabulario.push({
        termo: achatar(opcao.rotulo),
        campo: "linguagem",
        valor: opcao.valor,
        rotulo: opcao.rotulo,
        regra: "linguagem",
      });
    }
    for (const opcao of dto.facetas.tema) {
      doVocabulario.push({
        termo: achatar(opcao.rotulo),
        campo: "tema",
        valor: opcao.valor,
        rotulo: opcao.rotulo,
        regra: "tema",
      });
    }
    for (const opcao of dto.facetas.territorio) {
      // O rótulo estrangeiro vem como «Île-de-France · França»; só o nome do território
      // casa. O separador é nosso, escrito em `indice.ts`, e casá-lo seria casar o que
      // nós escrevemos em vez do que o acervo escreveu.
      doVocabulario.push({
        termo: achatar(opcao.rotulo.split(" · ")[0]),
        campo: "territorio",
        valor: opcao.valor,
        rotulo: opcao.rotulo,
        regra: "territorio",
      });
    }
  }

  // Rótulo de três caracteres ou menos («TV», «por aí» tem 6) casaria dentro de palavra
  // grande demais para o risco. O corte é declarado, não silencioso.
  const ordenado = doVocabulario
    .filter((v) => v.termo.length >= 4)
    .sort((a, b) => b.termo.length - a.termo.length || (a.termo < b.termo ? -1 : 1));

  for (const item of ordenado) {
    const posicao = acharTermo(achatada, item.termo, consumo);
    if (posicao < 0) continue;
    const fim = posicao + item.termo.length;
    consumir(consumo, posicao, fim);
    registrar({
      campo: item.campo,
      valor: item.valor,
      rotulo: item.rotulo,
      rotuloCurto: item.rotulo,
      regra: item.regra,
      trecho: frase.slice(posicao, fim),
      inicio: posicao,
      fim,
    });
  }

  // --- 3. gratuidade -------------------------------------------------------
  // A ficha mais delicada da tela. Ela EXISTE porque a pessoa pediu, e CONFESSA que o
  // pedido não recorta neste acervo — com o número que sustenta a confissão.
  for (const gatilho of GATILHOS_GRATUIDADE) {
    const posicao = acharTermo(achatada, gatilho, consumo);
    if (posicao < 0) continue;
    const fim = posicao + gatilho.length;
    consumir(consumo, posicao, fim);
    registrar({
      campo: "classe",
      valor: "evento",
      rotulo: "gratuito — lido como «o que tem sessão»: evento",
      rotuloCurto: "evento (de «gratuito»)",
      regra: "gratuidade",
      trecho: frase.slice(posicao, fim),
      inicio: posicao,
      fim,
      naoRecorta: true,
      naoRecortaFrase:
        `A gratuidade em si NÃO recortou nada: as ${milhar(GRATUIDADE_MEDIDA.ocorrencias)} ocorrências do ` +
        `acervo saem todas gratuitas, porque «gratuito» é a negação de um campo de ingresso que ` +
        `nenhum dos ${milhar(GRATUIDADE_MEDIDA.eventos)} eventos declara. Um filtro de gratuidade passaria ` +
        `100% dos eventos datados. O que esta ficha recortou foi «o que tem sessão» — evento —, ` +
        `porque gratuidade é propriedade de sessão, e isso está dito aqui em vez de acontecer em silêncio.`,
    });
    break;
  }

  // --- 4. período ----------------------------------------------------------
  // NUNCA gera janela de data (D-48): o acervo não publica agenda futura, e fabricar uma
  // data seria a mentira que a fase inteira foi escrita para não contar.
  for (const gatilho of GATILHOS_PERIODO) {
    const posicao = acharTermo(achatada, gatilho.termo, consumo);
    if (posicao < 0) continue;
    const fim = posicao + gatilho.termo.length;
    consumir(consumo, posicao, fim);
    registrar({
      campo: "classe",
      valor: "evento",
      rotulo: `${gatilho.leitura} — lido como «o que tem sessão datada»: evento`,
      rotuloCurto: `evento (de ${gatilho.leitura})`,
      regra: "periodo",
      trecho: frase.slice(posicao, fim),
      inicio: posicao,
      fim,
      substituicaoDeclarada: true,
      substituicaoFrase:
        `${gatilho.leitura} não virou janela de data. Este protótipo não fabrica datas e o ` +
        `acervo não publica agenda futura: as sessões que ele tem são as que já aconteceram. A regra ` +
        `leu o pedido temporal como «o que tem sessão datada» — evento — e para por aí.`,
    });
    break;
  }

  // --- 5. procedência ------------------------------------------------------
  for (const gatilho of GATILHOS_PROCEDENCIA) {
    const posicao = acharTermo(achatada, gatilho.termo, consumo);
    if (posicao < 0) continue;
    const fim = posicao + gatilho.termo.length;
    consumir(consumo, posicao, fim);
    registrar({
      campo: "procedencia",
      valor: gatilho.valor,
      rotulo: gatilho.rotulo,
      rotuloCurto: gatilho.rotulo,
      regra: "procedencia",
      trecho: frase.slice(posicao, fim),
      inicio: posicao,
      fim,
    });
    break;
  }

  // --- 6. proximidade ------------------------------------------------------
  // O pedaço que o protótipo NÃO PODE responder. A resposta é dizer isso na ficha.
  for (const gatilho of GATILHOS_PROXIMIDADE) {
    const posicao = acharTermo(achatada, gatilho, consumo);
    if (posicao < 0) continue;
    const fim = posicao + gatilho.length;
    consumir(consumo, posicao, fim);

    const opcoes = dto ? dto.facetas.territorio.slice(0, 12) : [];
    const declaracao =
      "«Perto de mim» não tem resposta neste protótipo, e fingir que tem seria o pior caminho. " +
      "Não pedimos sua localização — pedir seria requisição de runtime num protótipo estático " +
      "(D-60) e coleta de dado pessoal sem necessidade — e nenhuma das 2.425 sessões do " +
      "acervo declara espaço. O que existe é TERRITÓRIO, pela hierarquia `situado_em`.";

    // Quando a própria frase JÁ nomeou um território («perto de mim, em Pernambuco»), a
    // proximidade não acrescenta uma segunda ficha: ela CARIMBA a declaração na ficha que
    // já existe. Duas fichas de território somariam por serem do mesmo campo, e o recorte
    // ficaria maior do que o pedido — e, pior, «perto de mim» sumiria da tela sem aviso.
    const jaNomeado = criterios.find((c) => c.campo === "territorio");
    if (jaNomeado) {
      jaNomeado.substituicaoDeclarada = true;
      jaNomeado.substituicaoFrase =
        `${declaracao} Você nomeou «${jaNomeado.rotulo}» na frase, e a regra usou o seu território ` +
        "em vez de escolher um.";
      jaNomeado.rotulo = `perto de mim → ${jaNomeado.rotulo} (você nomeou)`;
      // `rotuloCurto` NÃO muda: ele já é o rótulo do território que a pessoa nomeou, e
      // é ele que entra na linha estreita do «por que casa».
      jaNomeado.opcoes = opcoes;
      if (!disparadas.includes("proximidade")) disparadas.push("proximidade");
      break;
    }

    const escolhido = opcoes[0];
    registrar({
      campo: "territorio",
      valor: escolhido?.valor ?? "",
      rotulo: escolhido ? `perto de mim → ${escolhido.rotulo}` : "perto de mim → território",
      rotuloCurto: escolhido ? escolhido.rotulo : "território",
      regra: "proximidade",
      trecho: frase.slice(posicao, fim),
      inicio: posicao,
      fim,
      substituicaoDeclarada: true,
      substituicaoFrase:
        `${declaracao} A regra trocou proximidade por território e deixou a escolha com você: o ` +
        "território abaixo é o maior recorte do acervo, não um palpite sobre onde você está.",
      opcoes,
    });
    break;
  }

  // --- 7. o vago -----------------------------------------------------------
  for (const vago of VAGOS) {
    const posicao = acharTermo(achatada, vago.termo, consumo);
    if (posicao < 0) continue;
    consumir(consumo, posicao, posicao + vago.termo.length);
    if (!vagos.some((v) => v.termo === vago.termo)) vagos.push({ ...vago });
  }

  // --- 8. o que NENHUMA regra consumiu ------------------------------------
  // Ele volta em lista, sempre. Descartar em silêncio é o comportamento de caixa preta
  // que esta tela existe para contradizer.
  const naoEntendido: string[] = [];
  let palavrasTotais = 0;
  let palavrasLidas = 0;
  const separador = /[^\p{L}\p{N}]+/u;
  let cursor = 0;
  for (const bruta of frase.split(separador)) {
    if (!bruta) {
      cursor += 1;
      continue;
    }
    const posicao = frase.indexOf(bruta, cursor);
    cursor = posicao + bruta.length;
    const palavra = normalizar(bruta);
    if (!palavra || PALAVRAS_VAZIAS.has(palavra)) continue;
    palavrasTotais += 1;
    if (!livre(consumo, posicao, posicao + bruta.length)) {
      palavrasLidas += 1;
      continue;
    }
    if (!naoEntendido.includes(bruta)) naoEntendido.push(bruta);
  }

  // A ordem final é a ordem de aplicação declarada em REGRAS — semelhança primeiro,
  // porque é o pedaço que mais recorta e o primeiro que a demonstração remove.
  const ordemRegra = new Map(REGRAS.map((regra, i) => [regra.id, i]));
  criterios.sort((a, b) => {
    const pa = ordemRegra.get(a.regra) ?? 99;
    const pb = ordemRegra.get(b.regra) ?? 99;
    return pa - pb || a.inicio - b.inicio;
  });

  return {
    frase,
    criterios,
    naoEntendido,
    diagnostico: {
      vagos,
      regrasDisparadas: disparadas,
      palavrasLidas,
      palavrasTotais,
      semIndice: dto === null,
    },
  };
}

// ---------------------------------------------------------------------------
// A vizinhança de semelhança — 856 arestas com motivo escrito, lidas NO BUILD
// ---------------------------------------------------------------------------

/**
 * As três funções públicas de `grafo.ts` que a travessia usa. INJETADAS, nunca
 * importadas — ver o cabeçalho, DP-F. É o mesmo contrato de `FonteDoGrafo` em
 * `indice.ts`, redeclarado aqui para não amarrar os dois módulos por um tipo estrutural
 * que só um deles precisa.
 */
export interface FonteDeArestas {
  slugsPorTipo: (classe: ClasseEntidade) => string[];
  porSlug: (classe: ClasseEntidade, slug: string) => Entidade | undefined;
  vizinhos: (id: string, relacao?: Relacao) => Vizinho[];
}

export interface VizinhancaDeSemelhanca {
  /** O termo da âncora, normalizado. */
  termo: string;
  /** Entradas do índice cujo título casa com o termo — as âncoras da travessia. */
  ancoras: number;
  /** Arestas `semelhante_a` que saem das âncoras. */
  arestas: number;
  /** Vizinhos distintos com motivo escrito, dentro do índice. */
  vizinhos: number;
  /** Desses, os que TAMBÉM casam com o termo por texto — os que a busca alcança. */
  alcancaveis: number;
  /** Os que a busca por texto NÃO alcança. Número declarado na tela, não escondido. */
  foraDoAlcance: number;
  /**
   * `{classe}_{slug}` → o motivo ESCRITO na aresta.
   *
   * Só os alcançáveis viajam: os outros nunca poderiam aparecer no resultado desta
   * consulta, e mandá-los seria peso sem uso. A contagem dos que ficaram vai junto.
   */
  motivos: Record<string, string>;
}

/**
 * Lê, NO BUILD, as arestas `semelhante_a` que saem das entidades cujo título casa com o
 * termo, e guarda o `motivo` ESCRITO de cada uma.
 *
 * POR QUE ESTE TEXTO IMPORTA. A explicação de por que um resultado casa não pode ser uma
 * frase nossa quando o acervo já escreveu uma — é a distinção `escrito`/`composto` que a
 * 02-01 fixou em `motivo.ts` e que T-02-05 existe para proteger. Das 47.259 arestas
 * `semelhante_a` do grafo, TODAS têm motivo escrito em português; 856 delas saem das 116
 * entidades de «Bienal».
 *
 * POR QUE SÓ OS ALCANÇÁVEIS VIAJAM. O critério de semelhança que `consultar` aplica é de
 * TEXTO — `indice.ts` não tem campo de vizinhança e não é deste plano reescrevê-lo —,
 * então o resultado é sempre um subconjunto do que casa por título. Mandar motivo de
 * quem nunca aparece seria peso morto; mandar o NÚMERO dos que ficaram de fora é o que
 * mantém a conta honesta, e a tela o declara.
 */
export function montarVizinhancaDeSemelhanca(
  fonte: FonteDeArestas,
  termo: string,
  indice: IndiceDTO,
): VizinhancaDeSemelhanca {
  const alvo = normalizar(termo);

  // As entradas do índice que casam por título — as mesmas que `consultar` devolveria.
  const chavesQueCasam = new Set<string>();
  const ancoras: Array<{ classe: ClasseEntidade; slug: string }> = [];
  for (let i = 0; i < indice.total; i += 1) {
    if (!normalizar(indice.t[i]).includes(alvo)) continue;
    const classe = indice.classes[parseInt(indice.c[i], 36)];
    // Mesma reconstrução de slug elidido do trecho acima, e pelo mesmo motivo.
    const slug = indice.s[i] === "" ? slugDoTitulo(indice.t[i]) : indice.s[i];
    if (!slug) continue;
    chavesQueCasam.add(`${classe}_${slug}`);
    ancoras.push({ classe, slug });
  }

  let arestas = 0;
  const motivos: Record<string, string> = {};
  const distintos = new Set<string>();

  for (const ancora of ancoras) {
    const entidade = fonte.porSlug(ancora.classe, ancora.slug);
    if (!entidade) continue;
    for (const vizinho of fonte.vizinhos(entidade.id, "semelhante_a")) {
      if (vizinho.aresta.de !== entidade.id) continue;
      arestas += 1;
      const motivo = vizinho.aresta.motivo?.trim();
      if (!motivo) continue;
      const chave = `${vizinho.entidade.classe}_${vizinho.entidade.slug}`;
      distintos.add(chave);
      // Primeiro motivo vence, e a ordem da travessia é a ordem estável do índice: o
      // texto que a tela mostra é reprodutível entre máquinas.
      if (chavesQueCasam.has(chave) && !(chave in motivos)) motivos[chave] = motivo;
    }
  }

  const alcancaveis = Object.keys(motivos).length;
  return {
    termo: alvo,
    ancoras: ancoras.length,
    arestas,
    vizinhos: distintos.size,
    alcancaveis,
    foraDoAlcance: distintos.size - alcancaveis,
    motivos,
  };
}

/**
 * O «por que casa» de um resultado, e de onde ele veio.
 *
 * Duas origens, e a distinção VIAJA — é a mesma que a 02-01 fixou entre motivo escrito no
 * acervo e motivo composto por nós (T-02-05). Sem ela, texto nosso passaria por texto do
 * Itaú Cultural.
 *
 * Não existe terceiro modo e não existe texto genérico de reserva: quando não há critério
 * nenhum, não há por que dizer nada, e a tela não lista o acervo inteiro sem motivo.
 */
export function motivoDoCasamento(
  chave: string,
  criterios: CriterioTraduzido[],
  vizinhanca: VizinhancaDeSemelhanca | null,
  casou: (criterio: CriterioTraduzido) => boolean,
): { texto: string; origem: "aresta" | "criterio" } | null {
  // A vizinhança pré-computada vale para UMA âncora — a que o build atravessou. Se a
  // pessoa reescreveu a frase e trocou a âncora, o motivo escrito daquela outra âncora
  // explicaria um casamento que não é este: seria texto verdadeiro no lugar errado, que
  // para quem lê é indistinguível de texto inventado.
  const semelhanca = criterios.find((c) => c.regra === "semelhanca");
  if (semelhanca && vizinhanca && normalizar(semelhanca.valor) === vizinhanca.termo) {
    const escrito = vizinhanca.motivos[chave];
    // O motivo escrito só vale enquanto a ficha de semelhança está de pé: mostrado depois
    // de ela ser removida, ele explicaria um casamento que não aconteceu mais.
    if (escrito) return { texto: escrito, origem: "aresta" };
  }

  const partes = criterios.filter(casou).map((criterio) => criterio.rotuloCurto);
  if (!partes.length) return null;
  return { texto: partes.join(" · "), origem: "criterio" };
}
