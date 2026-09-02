"use client";

import { useState } from "react";
import { usePontos } from "@/contexto/pontos";
import { recompensaPorId } from "@/dados/recompensas";

/**
 * notificacoes.tsx — a confirmação de quem recebeu, e o chamado de quem não recebeu.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * POR QUE A ESTEIRA NÃO PODIA TERMINAR EM «ENTREGUE».
 *
 * «Entregue» é o produtor dizendo que despachou. Quem sabe se chegou é quem esperava — e
 * num prêmio que é INGRESSO a diferença entre as duas coisas é alguém na porta do teatro
 * sem código nenhum. Enquanto a última palavra era do produtor, esse caso não tinha onde
 * aparecer: o resgate ficava marcado como entregue para sempre e a ficha já tinha sido
 * gasta.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * «NÃO RECEBI» PEDE O RELATO ANTES DE ABRIR O CHAMADO.
 *
 * Um chamado que diz só «não chegou» chega à fila de moderação sem nada para apurar, e
 * quem decide não consegue decidir. Por isso o botão de enviar só habilita com o relato
 * escrito — a regra do produto: não deixar enviar para depois dizer o que faltou.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * A FICHA VOLTA NO FECHAMENTO, E A TELA DIZ O PRAZO.
 *
 * Decisão de produto (01.09): a devolução acontece quando o chamado fecha a favor de quem
 * abriu, não no instante da contestação. A tela promete resposta em até 24h e mostra o
 * chamado em apuração enquanto isso — esperar sabendo o prazo é diferente de esperar sem
 * notícia, e é a única parte disso que a interface controla.
 */

/** O prazo prometido na tela. Uma constante porque aparece em dois lugares. */
const PRAZO = "até 24 horas";

function Contestar({
  aoEnviar,
  aoCancelar,
}: {
  aoEnviar: (relato: string) => void;
  aoCancelar: () => void;
}) {
  const [relato, setRelato] = useState("");
  const podeEnviar = relato.trim().length >= 10;

  return (
    <form
      className="notif-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (podeEnviar) aoEnviar(relato.trim());
      }}
    >
      <label className="notif-campo">
        <span className="notif-campo-rotulo tipo-detalhe">O que aconteceu?</span>
        <textarea
          className="notif-textarea"
          rows={4}
          value={relato}
          onChange={(e) => setRelato(e.target.value)}
          placeholder="Conte o que você esperava receber e o que chegou (ou não chegou). Quanto mais detalhe, mais rápido o produtor resolve."
        />
      </label>

      <p className="notif-aviso tipo-legenda">
        Ao enviar, abrimos um chamado com o produtor. A resposta chega em {PRAZO} e, se a
        entrega não tiver acontecido, suas fichas voltam para a carteira.
      </p>

      <div className="notif-acoes">
        {/* DESABILITADO ATÉ VALER. Deixar enviar e só então dizer o que faltou é o
            defeito que a revisão de fluxo existe para pegar. */}
        <button type="submit" className="notif-primario" disabled={!podeEnviar}>
          Abrir chamado
        </button>
        <button type="button" className="notif-secundario" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>

      {!podeEnviar ? (
        <p className="notif-dica tipo-legenda" role="status">
          Escreva ao menos uma frase para o produtor conseguir apurar.
        </p>
      ) : null}
    </form>
  );
}

export function Notificacoes() {
  const { motor, hidratado } = usePontos();
  const [contestando, setContestando] = useState<string | null>(null);

  if (!hidratado) {
    return <p className="notif-vazio tipo-detalhe">Carregando suas entregas…</p>;
  }

  const aguardando = motor.aguardandoConfirmacao();
  const emApuracao = motor.chamadosEmAberto();

  if (!aguardando.length && !emApuracao.length) {
    return (
      <p className="notif-vazio tipo-detalhe">
        Nada esperando você. Quando um resgate chegar, ele aparece aqui para você confirmar
        que recebeu.
      </p>
    );
  }

  return (
    <div className="notif-lista">
      {aguardando.map((r) => {
        const recompensa = recompensaPorId(r.recompensaId);
        const titulo = recompensa?.titulo ?? "Seu resgate";
        return (
          <article key={r.id} className="notif-cartao">
            <p className="notif-kicker tipo-micro">Confirme o recebimento</p>
            <h2 className="notif-titulo tipo-titulo-3">{titulo}</h2>
            <p className="notif-linha tipo-legenda">
              O produtor marcou como entregue. Chegou até você?
            </p>

            {contestando === r.id ? (
              <Contestar
                aoCancelar={() => setContestando(null)}
                aoEnviar={(relato) => {
                  motor.contestarEntrega(r.id, relato);
                  setContestando(null);
                }}
              />
            ) : (
              <div className="notif-acoes">
                <button
                  type="button"
                  className="notif-primario"
                  onClick={() => motor.confirmarRecebimento(r.id)}
                >
                  Recebi
                </button>
                <button
                  type="button"
                  className="notif-secundario"
                  onClick={() => setContestando(r.id)}
                >
                  Não recebi
                </button>
              </div>
            )}
          </article>
        );
      })}

      {emApuracao.map((r) => {
        const recompensa = recompensaPorId(r.recompensaId);
        return (
          <article key={r.id} className="notif-cartao" data-estado="apuracao">
            <p className="notif-kicker tipo-micro">Em apuração</p>
            <h2 className="notif-titulo tipo-titulo-3">
              {recompensa?.titulo ?? "Seu resgate"}
            </h2>
            <p className="notif-linha tipo-legenda">
              Chamado aberto com o produtor. A resposta chega em {PRAZO}; se a entrega não
              tiver acontecido, as {recompensa?.custo ?? 0} fichas voltam para a carteira.
            </p>
            {r.chamado?.relato ? (
              <p className="notif-relato tipo-legenda">«{r.chamado.relato}»</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
