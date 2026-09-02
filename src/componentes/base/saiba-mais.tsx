"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * saiba-mais.tsx — o popup dos textos longos.
 *
 * POR QUE ELE EXISTE. A ficha do evento respondia «o que o acervo não tem» antes de
 * responder «o que é este evento»: quatro parágrafos declarando ausências — nenhuma sessão
 * futura, não nomeia realizador, não declara elenco, não situa em território — mais oito
 * linhas de «declarado ausente». O conteúdo está certo e o lugar estava errado: quem chega
 * na ficha quer saber quando e onde, e recebia primeiro uma auditoria do acervo.
 *
 * A honestidade NÃO SAI, ela muda de camada. Na tela fica a linha curta com o fato; o
 * argumento inteiro — que é argumento da proposta, não rodapé — abre aqui, com o mesmo
 * texto, palavra por palavra.
 *
 * `<dialog>` NATIVO, E NÃO UM DIV COM ESTADO. `showModal()` entrega de graça quatro coisas
 * que uma reimplementação erra: o fecho por Esc, a prisão de foco, o fundo inerte e o
 * `::backdrop` que não precisa de um elemento a mais no DOM. O único JavaScript aqui é
 * abrir e fechar — o resto é o navegador.
 */
export function SaibaMais({
  rotulo,
  titulo,
  children,
  className,
}: {
  /** O que o gatilho DIZ. Nunca «saiba mais» sozinho: diz o que se vai saber. */
  rotulo: string;
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  // O clique no fundo fecha. `<dialog>` não distingue fundo de conteúdo sozinho: o alvo do
  // clique é o próprio dialogo quando cai no ::backdrop, e é essa igualdade que se testa.
  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    const noFundo = (e: MouseEvent) => {
      if (e.target === el) el.close();
    };
    el.addEventListener("click", noFundo);
    return () => el.removeEventListener("click", noFundo);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`saiba-mais-gatilho${className ? ` ${className}` : ""}`}
        onClick={() => dialogo.current?.showModal()}
      >
        {rotulo}
      </button>

      <dialog ref={dialogo} className="saiba-mais" aria-labelledby={`${titulo}-titulo`}>
        <div className="saiba-mais-corpo">
          <div className="saiba-mais-cabeca">
            <h2 id={`${titulo}-titulo`} className="saiba-mais-titulo">
              {titulo}
            </h2>
            <button
              type="button"
              className="saiba-mais-fechar"
              onClick={() => dialogo.current?.close()}
            >
              Fechar
            </button>
          </div>
          <div className="saiba-mais-texto">{children}</div>
        </div>
      </dialog>
    </>
  );
}
