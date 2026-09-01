"use client";

import clsx from "clsx";
import { useSessao } from "@/contexto/sessao";
import { DISPOSICOES } from "@/dados/disposicoes";

/**
 * onboarding-disposicao.tsx — DESC-01, o passo 1 do onboarding (tela 2 de `docs/telas.md`).
 *
 * A pergunta é «o que te move hoje?», e não «do que você gosta»: capturar INTENÇÃO em vez
 * de gosto declarado é o que separa onboarding por formulário de onboarding por disposição.
 * Seleção múltipla, sem obrigatoriedade, avançar sempre disponível.
 *
 * A LETRA MIÚDA DE CADA CARTÃO É REQUISITO, NÃO ENFEITE. Dos três cortes de DESC-01, o
 * acervo sustenta um: gratuidade tem `Ocorrencia.gratuito`; duração e faixa etária não
 * existem em campo nenhum do grafo. Dizer isso NA ENTRADA é mais honesto do que deixar a
 * pessoa marcar «tenho pouco tempo» e descobrir, num feed idêntico, que nada foi filtrado.
 * O mesmo aviso reaparece em Descobrir, vindo de `montarFeed`.
 */
export function OnboardingDisposicao() {
  const { disposicoes, alternarDisposicao, hidratado } = useSessao();

  return (
    <section className="flex flex-col gap-3">
      {/* O TÍTULO E O CONVITE SAÍRAM DAQUI — os dois viraram o cabeçalho da página, para
          que a tela tenha um título só. O que ficou é a NOTA DE PROCEDÊNCIA, que não é
          convite nem enfeite: estas palavras foram escritas pela curadoria e não saíram
          do acervo, e quem escolhe por elas tem direito de saber disso. */}
      <p className="text-xs text-tinta-3">
        Vocabulário escrito pela curadoria — não veio do acervo do Itaú Cultural.
      </p>

      <div className="flex flex-col gap-2">
        {DISPOSICOES.map((disposicao) => {
          const ativa = hidratado && disposicoes.includes(disposicao.id);
          return (
            <button
              key={disposicao.id}
              type="button"
              aria-pressed={ativa}
              onClick={() => alternarDisposicao(disposicao.id)}
              className={clsx(
                "cartao-disposicao cursor-pointer text-left",
                ativa && "cartao-disposicao-ativa",
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base leading-snug font-bold">{disposicao.rotulo}</span>
                <span className="shrink-0 rounded-full border border-borda px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-tinta-3 uppercase">
                  {disposicao.tipo === "corte" ? "corta" : "pondera"}
                </span>
              </span>
              <span className="block text-xs leading-snug text-tinta-2">
                {disposicao.explicacao}
              </span>
              {disposicao.ausencia ? (
                <span className="block border-l-2 border-acao pl-2 text-[0.7rem] leading-snug text-tinta-2">
                  {disposicao.ausencia}
                </span>
              ) : (
                <span className="block text-[0.65rem] leading-snug text-tinta-3">
                  lê {disposicao.campoLido}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
