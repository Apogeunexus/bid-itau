/**
 * tipos-organizacao.ts — o contrato do nível 6 · Organização.
 *
 * MÓDULO DE CLIENTE-SEGURO, e isso é requisito e não acaso (DP-F): nenhum import de dado
 * sai daqui. `Acessibilidade`, `MetodoCoordenada` e `ProcedenciaDePapel` entram como
 * `import type` e somem na compilação, então nenhum byte dos 9,4 MB de `entidades.json`
 * atravessa por causa deste arquivo. É o espelho de `tipos-acesso.ts`, que a S7 escreveu
 * para o nível 7 — e o que aquele arquivo já define, este NÃO redeclara: as 8 dimensões,
 * `Situacao`, as três portas e o ato de declarar vêm de lá, por import.
 *
 * POR QUE ELE EXISTE EM VEZ DE UMA EDIÇÃO EM `tipos-acesso.ts`. Aquele arquivo é da S7,
 * que está rodando agora na mesma pasta. As duas adições que a jornada da Organização
 * exige — os recursos físicos do lugar e o cadastro que converte um espaço derivado —
 * entram aqui por EXTENSÃO, sem tocar o arquivo da outra sessão. A consolidação está
 * registrada como PEDIDO-S6-01 em `.planning/estado/S6.md`.
 *
 * SEM RELÓGIO E SEM SORTEIO. Nada aqui lê `new Date()` nem `Math.random()`: o HTML
 * exportado e a página hidratada precisam coincidir.
 */

import type { Acessibilidade, MetodoCoordenada } from "./tipos";
import type { ProcedenciaDePapel } from "./tipos-acesso";
import { acessibilidadeVazia } from "./tipos-acesso";

// ---------------------------------------------------------------------------
// Os recursos físicos do lugar — PEDIDO-S6-01
// ---------------------------------------------------------------------------

/**
 * Rampa, elevador, banheiro adaptado, piso tátil e vaga reservada.
 *
 * ELES NÃO CABEM NAS 8 DIMENSÕES DE `Acessibilidade`, e é por isso que existem aqui em
 * vez de lá. As oito são de MÍDIA — audiodescrição, Libras, legenda, tradução simultânea,
 * estenotipia. Estas cinco são do LUGAR, e são as que decidem se alguém consegue chegar.
 * Enfiar rampa dentro de `closed_caption` seria fabricar classificação: o mesmo erro que
 * o projeto recusou quando promoveu quatro linguagens em vez de mapear «Rádio →
 * audiovisual».
 *
 * A lista é fechada de propósito. Um campo de texto livre aqui produziria «rampa»,
 * «rampa de acesso» e «acesso por rampa» como três recursos diferentes, e a busca por
 * espaço acessível passaria a depender de como cada organização escreveu.
 */
export const RECURSOS_FISICOS = [
  "rampa",
  "elevador",
  "banheiro_adaptado",
  "piso_tatil",
  "vaga_reservada",
] as const;

export type RecursoFisico = (typeof RECURSOS_FISICOS)[number];

export const ROTULO_DO_RECURSO: Record<RecursoFisico, string> = {
  rampa: "rampa de acesso",
  elevador: "elevador",
  banheiro_adaptado: "banheiro adaptado",
  piso_tatil: "piso tátil",
  vaga_reservada: "vaga reservada",
};

export type RecursosFisicos = Record<RecursoFisico, boolean>;

export function recursosFisicosVazios(): RecursosFisicos {
  return {
    rampa: false,
    elevador: false,
    banheiro_adaptado: false,
    piso_tatil: false,
    vaga_reservada: false,
  };
}

// ---------------------------------------------------------------------------
// A ficha do espaço — as 8 de mídia MAIS as 5 do lugar, com UM ato
// ---------------------------------------------------------------------------

/**
 * A ficha completa de um espaço.
 *
 * `declarada` registra O ATO DE PREENCHER, não o conteúdo — a mesma disciplina de
 * `declaraAcessibilidade` em `Entidade` (§10 da ontologia). Treze booleanos em `false`
 * significam «não oferece» e «não declarou» ao mesmo tempo, e é essa ambiguidade que o
 * campo separado existe para desfazer.
 *
 * UM ATO PARA AS DUAS METADES, e não dois. A pergunta que o ato responde é «esta ficha
 * foi preenchida?», e ela é uma só: quem declara que o espaço não tem rampa está no mesmo
 * gesto declarando que preencheu a ficha do espaço. Dois atos separados criariam um
 * quarto estado — «declarou o lugar mas não a mídia» — que nenhuma tela do produto sabe
 * exibir.
 */
export interface AcessibilidadeDeEspaco {
  dimensoes: Acessibilidade;
  fisicos: RecursosFisicos;
  declarada: boolean;
}

export function acessibilidadeDeEspacoVazia(): AcessibilidadeDeEspaco {
  return { dimensoes: acessibilidadeVazia(), fisicos: recursosFisicosVazios(), declarada: false };
}

export function algumRecursoMarcado(f: RecursosFisicos): boolean {
  return RECURSOS_FISICOS.some((r) => f[r]);
}

/** O ato, escrito uma vez. A tela cita esta constante em vez de repetir a frase — duas
 *  telas com duas redações do mesmo ato fariam parecer que são dois atos diferentes. */
export const FRASE_DO_ATO_DO_ESPACO =
  "Declaro que este espaço não oferece nenhum destes recursos.";

/** Por que o ato tem peso igual ao de salvar, dito para quem opera a tela. */
export const POR_QUE_O_ATO =
  "Sem este botão, treze caixas desmarcadas seriam lidas como «não declarou» — e a " +
  "plataforma se proibiu de interpretar silêncio. Declarar que não oferece é uma " +
  "informação; deixar em branco não é.";

// ---------------------------------------------------------------------------
// A conversão de procedência — o que a O2 existe para fazer
// ---------------------------------------------------------------------------

/**
 * A procedência que a Organização carimba.
 *
 * ESCOLHA REGISTRADA, NÃO INVENTADA. `Procedencia` tem hoje três valores (`ic`,
 * `derivado`, `autorado`) e o PRD §6 prevê seis em produção: os três mais `parceiro`,
 * `produtor`, `ia` e `curador`. Nenhum deles se chama «organização» — e acrescentar um
 * sexto valor seria mudança de ontologia, que esta sessão não faz sozinha.
 *
 * Entre os que existem, `parceiro` é o único que descreve uma instituição escrevendo em
 * nome próprio: `produtor` é o nível 7, `curador` é o nível 5 e `ia` é máquina. A escolha
 * está registrada como PEDIDO-S6-05 — se a resposta for outra, muda esta constante e
 * nada mais, porque nenhuma tela escreve o valor à mão.
 */
export const PROCEDENCIA_DA_ORGANIZACAO: ProcedenciaDePapel = "parceiro";

/** O que o selo de conversão afirma, dito para quem confere. */
export const FRASE_DA_CONVERSAO =
  "Um espaço derivado foi INFERIDO por regra a partir de um texto do acervo. Um espaço " +
  "cadastrado foi DECLARADO por quem responde por ele. A tela mostra a passagem de um " +
  "para o outro porque é ela, e não o número de campos preenchidos, que muda o que a " +
  "plataforma pode afirmar.";

// ---------------------------------------------------------------------------
// A coordenada continua derivada — a regra dura desta tela
// ---------------------------------------------------------------------------

/**
 * O método que a coordenada assume DEPOIS que a organização cadastra o endereço.
 *
 * NÃO EXISTE LATITUDE DIGITADA, e essa é a regra mais fácil de quebrar sem perceber: um
 * campo «lat/lon» no formulário pareceria completude e produziria coordenada `autorado`,
 * que o tipo `Coordenada` PROÍBE — `procedencia` ali é o literal `"derivado"`, não um
 * enum. O que o endereço muda é o MÉTODO: um espaço sem endereço é posicionado por
 * deslocamento em torno da cidade; com endereço, o centroide do município passa a ser
 * a derivação declarada.
 *
 * Continua sendo derivação, e a tela diz que continua. Geocodificar de verdade exigiria
 * serviço externo, que o protótipo não tem — e fingir que tem seria pior do que não ter.
 */
export const METODO_APOS_ENDERECO: MetodoCoordenada = "centroide-municipio";

export const FRASE_DA_COORDENADA =
  "A coordenada continua `derivado` depois do cadastro, e isso não é limitação do " +
  "protótipo: o tipo `Coordenada` fixa `procedencia: \"derivado\"` como literal. O que o " +
  "endereço muda é o MÉTODO da derivação, que a tela mostra ao lado do ponto. Latitude " +
  "digitada não existe em lugar nenhum deste produto.";

// ---------------------------------------------------------------------------
// O cadastro — o que a organização escreve por cima do espaço derivado
// ---------------------------------------------------------------------------

/**
 * O que a Organização acrescenta a um espaço do acervo.
 *
 * Note o que NÃO está aqui: `titulo`, `cidade`, `estado` e `resumo` continuam vindo do
 * acervo. A O2 não reescreve o que o Itaú Cultural já publicou — ela DECLARA o que
 * faltava. Um formulário que deixasse editar o título produziria, na primeira
 * regeração do grafo, dois nomes para o mesmo lugar e um par novo na fila de duplicatas.
 */
export interface CadastroDeEspaco {
  espacoId: string;
  /** Logradouro e número. Texto, porque é o que a organização tem — não é geocódigo. */
  endereco: string;
  bairro: string;
  /** Lotação declarada. `null` enquanto ninguém declarou — nunca `0`, que seria «cabe
   *  ninguém» e é uma afirmação diferente de «não sei». */
  capacidade: number | null;
  acessibilidade: AcessibilidadeDeEspaco;
  /** Quem cadastrou. Nunca anônimo: §3 da ontologia diz que nenhum papel escreve sem
   *  deixar autor, admin incluído. */
  autor: string;
  /** `DATA_DE_REFERENCIA`, vinda do servidor. Nunca o relógio do navegador. */
  quando: string;
}

/** Os campos que fazem o espaço deixar de ser inferência. Sem endereço não há cadastro:
 *  o resto do formulário pode ficar vazio e o espaço continua declarado, mas um cadastro
 *  sem endereço não acrescenta nada ao que a derivação já tinha. */
export function cadastrado(c: CadastroDeEspaco | undefined): boolean {
  return c !== undefined && c.endereco.trim().length > 0;
}

// ---------------------------------------------------------------------------
// O que falta, NOMEADO — o padrão da coluna da direita
// ---------------------------------------------------------------------------

/**
 * Uma falta, com dono.
 *
 * `bloqueia` separa o que impede a publicação do que só diminui a qualidade do registro,
 * e a distinção é do produto: crédito de imagem bloqueia (165); ficha de acessibilidade
 * incompleta não. `dono` nomeia o nível responsável quando a falta depende de outro nível
 * — §8 da ontologia proíbe beco sem saída, e uma pendência sem dono é exatamente isso.
 */
export interface Falta {
  texto: string;
  bloqueia: boolean;
  dono: string | null;
}

/**
 * O que falta num espaço, na ordem em que a tela mostra.
 *
 * A ordem é a do impacto, e não a do formulário: quem abre a coluna da direita precisa
 * ver primeiro o que impede o espaço de servir para alguma coisa. Endereço primeiro
 * porque sem ele o cadastro não existe; a ficha depois, porque é a que o app público lê.
 */
export function faltasDoEspaco(
  c: CadastroDeEspaco | undefined,
  declaraNoAcervo: boolean,
): Falta[] {
  const saida: Falta[] = [];

  if (!cadastrado(c)) {
    saida.push({
      texto: "endereço — sem ele o espaço continua sendo inferência do acervo",
      bloqueia: true,
      dono: null,
    });
  }
  if (c && c.bairro.trim().length === 0) {
    saida.push({ texto: "bairro", bloqueia: false, dono: null });
  }
  if (c && c.capacidade === null) {
    saida.push({ texto: "capacidade declarada", bloqueia: false, dono: null });
  }
  if (!c?.acessibilidade.declarada && !declaraNoAcervo) {
    saida.push({
      texto:
        "ficha de acessibilidade — nem os recursos, nem o ato de declarar que não oferece",
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "verificação da organização — o estado é do Admin, e esta tela encaminha",
    bloqueia: false,
    dono: "Admin (92)",
  });

  return saida;
}
