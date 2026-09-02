"use client";

import { useState } from "react";
import { usePontos } from "@/contexto/pontos";
import { recompensaPorId } from "@/dados/recompensas";

/**
 * moderacao-chamados.tsx — os chamados de entrega, na fila de quem decide.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * BLOCO PRÓPRIO DENTRO DA MESMA TELA, e não uma segunda fila.
 *
 * A decisão de produto foi «vai para a fila de moderação existente», e é o que este
 * arquivo faz: mesma tela, mesma esteira de «nada vira fato sem alguém decidir». Mas o
 * chamado NÃO vira um `ItemDaFila`. Aquele tipo é modelado sobre entidade do acervo —
 * `entidadeId`, `classe`, `procedencia`, `linguagens`, `score` — e um chamado de entrega
 * não tem nenhum deles. Enfiá-lo lá exigiria inventar seis campos vazios, e um item de
 * fila com metade das colunas em branco é pior que um bloco separado que diz o que é.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * A DECISÃO AQUI MEXE EM SALDO, e é a única desta tela que mexe.
 *
 * «Devolver» credita de volta o custo do resgate na carteira de quem abriu, com linha no
 * extrato e motivo escrito. Por isso as duas ações pedem uma justificativa antes: um
 * saldo que muda sem alguém ter escrito por quê é exatamente o que a carteira existe
 * para não ter.
 */
export function ModeracaoChamados() {
  const { motor, hidratado } = usePontos();
  const [decidindo, setDecidindo] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  if (!hidratado) return null;

  const abertos = motor.chamadosEmAberto();
  if (!abertos.length) return null;

  const decidir = (id: string, devolver: boolean) => {
    if (!motivo.trim()) return;
    motor.fecharChamado(id, devolver, motivo.trim());
    setDecidindo(null);
    setMotivo("");
  };

  return (
    <section className="moderacao-chamados" data-bloco="chamados-de-entrega">
      <h2 className="studio-secao-titulo">
        {abertos.length} {abertos.length === 1 ? "chamado" : "chamados"} de entrega
      </h2>
      <p className="studio-objetivo">
        Abertos por quem resgatou e não recebeu. A decisão é a única desta tela que mexe em
        saldo: devolver credita as fichas de volta, com linha no extrato de quem abriu.
      </p>

      <ul className="moderacao-chamados-lista">
        {abertos.map((r) => {
          const recompensa = recompensaPorId(r.recompensaId);
          const aberto = decidindo === r.id;
          return (
            <li key={r.id} className="moderacao-chamado">
              <p className="moderacao-chamado-titulo">
                {recompensa?.titulo ?? "Resgate"} · {recompensa?.custo ?? 0} fichas
              </p>
              <p className="moderacao-chamado-relato">«{r.chamado?.relato}»</p>

              {aberto ? (
                <div className="moderacao-chamado-decisao">
                  <label className="moderacao-chamado-campo">
                    <span>Motivo da decisão</span>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="O que você apurou com o produtor"
                    />
                  </label>
                  <div className="moderacao-chamado-acoes">
                    {/* As duas só habilitam com o motivo escrito — decisão sem autor e
                        sem razão é o que esta tela inteira existe para impedir. */}
                    <button
                      type="button"
                      className="studio-botao"
                      disabled={!motivo.trim()}
                      onClick={() => decidir(r.id, true)}
                    >
                      devolver as fichas
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      disabled={!motivo.trim()}
                      onClick={() => decidir(r.id, false)}
                    >
                      entrega comprovada
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setDecidindo(null);
                        setMotivo("");
                      }}
                    >
                      cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="studio-botao"
                  onClick={() => setDecidindo(r.id)}
                >
                  decidir
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
