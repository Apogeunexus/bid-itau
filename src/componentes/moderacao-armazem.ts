/**
 * moderacao-armazem.ts — o armazém das decisões, do lado do cliente.
 *
 * POR QUE ELE É UM MÓDULO E NÃO DUAS FUNÇÕES EM CADA TELA. A fila e a ficha escrevem no
 * MESMO armazém, e o histórico o lê. Enquanto cada uma tivesse a sua cópia da leitura, uma
 * mudança na forma do registro precisaria ser feita em três lugares — e a que ficasse para
 * trás não quebraria o build: ela leria o campo novo como `undefined` e renderizaria uma
 * decisão sem autor. A cópia que diverge em silêncio é o defeito que este projeto persegue.
 *
 * ELE NÃO IMPORTA `moderacao.ts` POR VALOR (DP-F). Só o tipo do registro atravessa, e tipo
 * é apagado na compilação: nenhum byte dos 23 MB de grafo entra por causa deste arquivo.
 *
 * A FALHA DO NAVEGADOR É DECLARADA, NÃO ENGOLIDA. `localStorage` recusa em janela privada,
 * com cota estourada e quando o site está bloqueado por configuração. Um `catch` vazio ali
 * faria a tela seguir aceitando decisões que não são guardadas, e quem opera só descobriria
 * ao recarregar e ver tudo sumir. As duas funções devolvem o que aconteceu, e a tela diz.
 */

import type { DecisaoRegistrada } from "@/dados/moderacao";

/**
 * A chave versionada deste protótipo, no mesmo espaço de nomes que a S7 usa em `studio.v1`.
 * O número no fim é o que permite mudar a forma do registro sem ler lixo da versão anterior
 * no navegador de quem avalia.
 */
export const CHAVE_DO_ARMAZEM = "moderacao.v1";

export interface LeituraDoArmazem {
  decisoes: DecisaoRegistrada[];
  /** O que impediu a leitura, em português, ou `null` quando ela funcionou. */
  falha: string | null;
}

/**
 * Confere o registro campo a campo em vez de confiar no que estava no navegador.
 *
 * O armazém é entrada externa como qualquer outra: uma versão anterior da tela, outra aba,
 * ou uma extensão podem ter deixado ali qualquer coisa. Uma decisão sem autor renderizaria
 * uma linha de histórico assinada por `undefined` — e o histórico é justamente a peça que
 * uma auditoria abre primeiro.
 */
function pareceDecisao(d: unknown): d is DecisaoRegistrada {
  if (typeof d !== "object" || d === null) return false;
  const r = d as DecisaoRegistrada;
  return (
    typeof r.itemId === "string" &&
    typeof r.acao === "string" &&
    typeof r.autor === "string" &&
    typeof r.quando === "string"
  );
}

/** LEITURA SÓ EM `useEffect`, NUNCA NO RENDER (T-03-10): o servidor não tem armazém, e ler
 *  durante a renderização faria o HTML exportado divergir da página hidratada. */
export function lerArmazem(): LeituraDoArmazem {
  try {
    const cru = window.localStorage.getItem(CHAVE_DO_ARMAZEM);
    if (!cru) return { decisoes: [], falha: null };
    const lido: unknown = JSON.parse(cru);
    if (!Array.isArray(lido)) {
      return {
        decisoes: [],
        falha:
          "O que estava guardado sob «moderacao.v1» não é uma lista de decisões. A tela " +
          "abriu vazia em vez de tentar interpretar o conteúdo.",
      };
    }
    const validas = lido.filter(pareceDecisao);
    return {
      decisoes: validas,
      falha:
        validas.length === lido.length
          ? null
          : `${lido.length - validas.length} de ${lido.length} registros guardados estavam ` +
            "incompletos — sem autor, sem carimbo ou sem ação — e foram descartados em vez " +
            "de virar linha de histórico sem assinatura.",
    };
  } catch (erro) {
    return {
      decisoes: [],
      falha:
        "Não foi possível ler as decisões guardadas neste navegador " +
        `(${erro instanceof Error ? erro.message : "causa desconhecida"}). A tela funciona, ` +
        "mas o que já tinha sido decidido não aparece.",
    };
  }
}

/** `null` quando gravou. Uma frase em português quando não — e a tela a imprime. */
export function gravarArmazem(decisoes: readonly DecisaoRegistrada[]): string | null {
  try {
    window.localStorage.setItem(CHAVE_DO_ARMAZEM, JSON.stringify(decisoes));
    return null;
  } catch (erro) {
    return (
      "Este navegador recusou guardar a decisão " +
      `(${erro instanceof Error ? erro.message : "causa desconhecida"}). Ela vale nesta ` +
      "sessão e some ao recarregar a página. Costuma acontecer em janela privada ou com o " +
      "armazenamento do site bloqueado."
    );
  }
}
