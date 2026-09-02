"use client";

import Link from "next/link";
import { useState } from "react";
import type { RecompensaDefinida } from "@/lib/pontos/tipos";

/**
 * O CUPOM, e as instruções de retirada.
 *
 * O RESGATE NÃO É A RETIRADA. Até aqui, tocar em «Resgatar» debitava as fichas e dizia
 * «está na sua carteira» — e a pessoa ficava sem saber o que fazer com aquilo. Entre
 * gastar a ficha e confirmar que recebeu falta o passo do meio: ABRIR O LINK DO PARCEIRO
 * E APLICAR O CUPOM. Sem ele, a confirmação de recebimento pergunta sobre uma entrega que
 * nunca teve como acontecer.
 *
 * O CÓDIGO É PARA SER COPIADO, não decorado. Cupom que só se pode ler à mão é cupom
 * digitado errado — por isso o botão copia e diz que copiou, em vez de deixar a pessoa
 * conferir letra por letra.
 */
const CUPOM = "SOUITAUCULTURAL";

/** Onde o cupom é aplicado. Um por forma de entrega, porque o caminho muda. */
const ONDE_RETIRAR: Record<RecompensaDefinida["entrega"], string> = {
  digital: "no site do parceiro, na hora de finalizar",
  presencial: "na bilheteria, junto com um documento com foto",
  correio: "no site do parceiro, antes de fechar o pedido",
  "no-produto": "aqui mesmo no aplicativo, na próxima tela do benefício",
};

export function ComoRetirar({ recompensa }: { recompensa: RecompensaDefinida }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(CUPOM);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sem permissão de área de transferência (http, iframe, navegador antigo) o código
         continua na tela para ser copiado à mão. Falhar em silêncio aqui deixaria a
         pessoa achando que copiou — e colando o cupom anterior no site do parceiro. */
      setCopiado(false);
    }
  }

  return (
    <div className="retirada">
      <p className="aviso" data-tom="acao">
        Resgatado. Falta um passo para o benefício ser seu.
      </p>

      <ol className="retirada-passos">
        <li>Abra o link do parceiro.</li>
        <li>
          Aplique o cupom {ONDE_RETIRAR[recompensa.entrega]}.
        </li>
        <li>Volte aqui e confirme quando receber.</li>
      </ol>

      <div className="retirada-cupom">
        <code className="retirada-codigo">{CUPOM}</code>
        <button type="button" className="retirada-copiar" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      {/* `aria-live` porque a confirmação de cópia é a única resposta da ação, e quem usa
          leitor de tela não vê o rótulo do botão mudar. */}
      <p className="retirada-eco tipo-legenda" role="status" aria-live="polite">
        {copiado ? "Cupom copiado para a área de transferência." : "\u00a0"}
      </p>

      <a
        className="botao-acao no-underline"
        href="https://www.itaucultural.org.br/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir o link do parceiro
      </a>

      <Link href="/meu/carteira/" className="retirada-secundario no-underline">
        Acompanhar a entrega
      </Link>
    </div>
  );
}

