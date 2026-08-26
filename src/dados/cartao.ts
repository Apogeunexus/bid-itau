/**
 * cartao.ts — o único formato que atravessa a fronteira servidor→cliente na fase 2.
 *
 * Sob `output: "export"` (D-24) a caminhada roda NO BUILD, em componente de servidor.
 * `entidades.json` tem 9,4 MB e `arestas.json` 13,6 MB; nada disso pode ir ao navegador
 * (DP-F). O que vai é este DTO: só primitivos, sem função, sem referência a `Entidade`,
 * serializável pela fronteira RSC.
 *
 * Os quatro planos da fase compartilham este contrato. Alterá-lo é renegociar com todos.
 */

import type { ClasseEntidade, Procedencia, Relacao } from "./tipos";

// ---------------------------------------------------------------------------
// Motivo — DP-A
// ---------------------------------------------------------------------------

/**
 * De onde saiu o texto do selo de motivo. É a distinção que sustenta T-02-05: sem ela,
 * texto que nós redigimos passaria por texto escrito no acervo do Itaú Cultural.
 *
 * - `escrito`    a aresta carregava `motivo`; o texto é o do acervo, literal
 * - `composto`   a aresta não carregava `motivo`; o texto foi montado a partir de
 *                `relacao` + títulos das duas pontas (+ `papel`, quando `atua_em`).
 *                Descreve uma aresta que EXISTE no grafo — não inventa vínculo.
 * - `sem-aresta` não houve aresta nenhuma. Hoje só o cartão de serendipidade (D-30),
 *                que é escolhido FORA do alcance da caminhada por definição.
 *
 * DESVIO DECLARADO em relação ao plano 02-01, que previa só os dois primeiros valores.
 * O terceiro foi acrescentado porque o cartão de serendipidade não tem aresta, e
 * carimbá-lo de `composto` afirmaria que existe uma relação no grafo que não existe —
 * exatamente a mentira de procedência que D-28 e T-02-05 existem para impedir. Quem
 * fizer `switch` exaustivo sobre este tipo vai receber erro de compilação, que é a
 * falha visível correta.
 */
export type OrigemMotivo = "escrito" | "composto" | "sem-aresta";

export interface MotivoCartao {
  /** O texto do selo. Nunca vazio — `motivo.ts` lança antes de deixar passar vazio. */
  texto: string;
  origemMotivo: OrigemMotivo;
  /** A relação da aresta que trouxe o candidato. `null` só quando não houve aresta. */
  relacao: Relacao | null;
  /** Procedência da aresta. `"autorado"` quando o texto é nosso e não houve aresta. */
  procedenciaAresta: Procedencia | null;
}

// ---------------------------------------------------------------------------
// Caminho percorrido — o que a tela "Por que isto apareceu" (02-02) renderiza
// ---------------------------------------------------------------------------

/** Um salto do caminho, já achatado em primitivos. Espelha `Passo` sem as entidades. */
export interface PassoCartao {
  deId: string;
  deTitulo: string;
  deClasse: ClasseEntidade;
  paraId: string;
  paraTitulo: string;
  paraClasse: ClasseEntidade;
  relacao: Relacao;
  motivoTexto: string;
  origemMotivo: OrigemMotivo;
  papel?: string;
}

// ---------------------------------------------------------------------------
// Cartão
// ---------------------------------------------------------------------------

/** Cartão que sobrepõe o rodízio, em posição fixa (D-29, D-30). */
export type TipoCartaoEspecial = "serendipidade" | "curado";

export interface Cartao {
  id: string;
  classe: ClasseEntidade;
  titulo: string;
  slug: string;
  imagem?: string;
  creditoImagem?: string;
  /**
   * A descrição do acervo, texto puro, quando o registro de origem tem uma. AUSENTE
   * QUANDO A FONTE NÃO ESCREVEU — nunca preenchida com frase montada por nós, que é a
   * mesma regra que impede o motivo de passar por texto do Itaú Cultural. O cartão sem
   * este campo mostra título e tags, e mais nada.
   */
  resumo?: string;
  /** Ids do vocabulário controlado, não rótulos livres. A cor sai daqui (D-08). */
  linguagens: string[];
  procedencia: Procedencia;
  motivo: MotivoCartao;
  /** 1, 2 ou 3. O 3 é reserva de classe vazia (DP-C, medição M-3). */
  saltos: number;
  /** Passou por nó com grau acima de `GRAU_HUB` (DP-E). Preferência menor. */
  viaConcentrador: boolean;
  caminho: PassoCartao[];
  especial?: TipoCartaoEspecial;
}

// ---------------------------------------------------------------------------
// Retorno de montarFeed
// ---------------------------------------------------------------------------

/**
 * Aviso legível que a tela é OBRIGADA a mostrar. Hoje o caso é a disposição de corte
 * cujo campo o acervo não declara: suprimir o aviso seria mentir sobre o filtro.
 */
export interface AvisoFeed {
  /** Id da disposição, ou outra origem do aviso. */
  origem: string;
  texto: string;
}

/** Números da montagem. A onda 2 e a verificação da onda 3 leem isto. */
export interface DiagnosticoFeed {
  personaId: string;
  sementes: number;
  candidatosPorSalto: Record<number, number>;
  candidatosPorClasse: Record<string, number>;
  classesCobertas: string[];
  /** Classes da rotação que ficaram sem candidato de 1 ou 2 saltos (DP-C). */
  classesEmReserva: string[];
  motivosEscritos: number;
  motivosCompostos: number;
  motivosSemAresta: number;
  cartoesViaConcentrador: number;
  disposicoesAplicadas: string[];
  cortadosPorDisposicao: number;
}

export interface ResultadoFeed {
  cartoes: Cartao[];
  avisos: AvisoFeed[];
  diagnostico: DiagnosticoFeed;
}
