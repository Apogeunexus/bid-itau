"use client";

import { useEffect, useRef } from "react";

/**
 * saida-para-parceiro.tsx — o aviso antes de sair para o site da instituição.
 *
 * POR QUE UM PASSO A MAIS, E NÃO UM LINK DIRETO. Sair da plataforma é a única ação daqui
 * que a pessoa não desfaz com o botão voltar: ela cai num site de outra marca, com outro
 * fluxo de pagamento e outra política de cancelamento. Um link que troca de contexto sem
 * avisar transfere confiança sem pedir — e a confiança aqui é do Itaú Cultural, não nossa
 * para gastar.
 *
 * O QUE O AVISO DIZ É O QUE MUDA A DECISÃO: que o evento é de terceiro, que a reserva
 * acontece no canal do produtor, e que a Fundação Itaú não transaciona ingresso. Não é
 * disclaimer de rodapé; é a informação de que a pessoa precisa no segundo em que decide ir.
 *
 * `<dialog>` NATIVO, como o `SaibaMais`: Esc, prisão de foco e fundo inerte vêm do
 * navegador. A saída é `<a target="_blank">` de verdade — não `window.open` —, então
 * bloqueador de pop-up não a engole e o clique por teclado continua o de sempre.
 */

/** O domínio, para a pessoa ver PARA ONDE vai antes de ir. */
function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (erro) {
    // URL malformada é dado ruim vindo da raspagem, não motivo para derrubar a tela: o
    // aviso mostra o endereço cru e o console registra qual entrada precisa de revisão.
    console.warn("saida-para-parceiro: URL de reserva malformada", url, erro);
    return url;
  }
}

export function SaidaParaParceiro({
  url,
  instituicao,
  rotulo,
  className,
}: {
  url: string;
  instituicao: string;
  /** O texto do botão que abre o aviso. */
  rotulo: string;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

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
      <button type="button" className={className} onClick={() => dialogo.current?.showModal()}>
        {rotulo}
      </button>

      <dialog ref={dialogo} className="saiba-mais saida-dialogo" aria-labelledby="saida-titulo">
        <div className="saiba-mais-corpo">
          <div className="saiba-mais-cabeca">
            <h2 id="saida-titulo" className="saiba-mais-titulo">
              Você vai sair da plataforma
            </h2>
            <button
              type="button"
              className="saiba-mais-fechar"
              onClick={() => dialogo.current?.close()}
            >
              Ficar aqui
            </button>
          </div>

          <div className="saiba-mais-texto">
            <p>
              <b>Este é um evento externo.</b> A reserva é feita no canal do produtor —{" "}
              {instituicao} —, e é lá que valem as regras de ingresso, cancelamento e
              acessibilidade.
            </p>
            <p>A Fundação Itaú não vende nem reserva ingresso. Nós levamos você até lá.</p>
            <p className="saida-dominio">{dominioDe(url)}</p>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="saida-confirmar"
            onClick={() => dialogo.current?.close()}
          >
            Continuar para a reserva ↗
          </a>
        </div>
      </dialog>
    </>
  );
}
