"use client";

import clsx from "clsx";
import { Grafismo } from "@/componentes/grafismo";
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
      <h2 className="flex items-center gap-1.5 text-xl leading-tight font-bold">
        <Grafismo variacao="barra" className="h-4 w-auto shrink-0 text-acao" />
        O que te move hoje?
      </h2>
      <p className="text-xs text-black/55">
        Escolha quantas quiser, ou nenhuma. Vocabulário autorado para o protótipo — não veio
        do acervo do Itaú Cultural.
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
                <span className="shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-black/50 uppercase">
                  {disposicao.tipo === "corte" ? "corta" : "pondera"}
                </span>
              </span>
              <span className="block text-xs leading-snug text-black/60">
                {disposicao.explicacao}
              </span>
              {disposicao.ausencia ? (
                <span className="block border-l-2 border-acao pl-2 text-[0.7rem] leading-snug text-black/55">
                  {disposicao.ausencia}
                </span>
              ) : (
                <span className="block text-[0.65rem] leading-snug text-black/40">
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
