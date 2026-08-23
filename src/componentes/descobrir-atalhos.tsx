"use client";

import Link from "next/link";
import { ICONE_PERFIL, ICONE_SALVOS } from "@/componentes/base/icones";
import { useSessao } from "@/contexto/sessao";

/**
 * descobrir-atalhos.tsx — o pé de Descobrir: salvos e repertório (redesenho 2026-08).
 *
 * COMPONENTE DE CLIENTE só pelo número: a contagem de salvos mora na sessão
 * (`localStorage`, D-42), e é o único dado desta seção que o build não conhece.
 * Antes de hidratar a linha fica vazia — o mesmo HTML do build — e o número
 * entra sem trocar o layout. «Vistos recentemente» do redesenho ficou fora: o
 * produto não rastreia visita a entidade, e um cartão com número inventado
 * mentiria melhor do que qualquer tela conserta.
 */
export function AtalhosDaSessao() {
  const { salvos, hidratado } = useSessao();
  const n = salvos.length;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-titulo-3 font-bold">Salvos e repertório</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/salvos/"
          className="flex items-center gap-3 rounded-xl border border-borda bg-superficie p-3 no-underline"
        >
          <span aria-hidden className="shrink-0 text-acao-tinta">
            {ICONE_SALVOS}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <strong className="text-sm leading-snug font-bold">Meus salvos</strong>
            <span className="tipo-legenda text-tinta-2" data-salvos={hidratado ? n : undefined}>
              {/* Antes de hidratar, um nbsp segura a altura da linha — o número entra sem pulo. */}
              {hidratado
                ? n
                  ? `${n} ${n === 1 ? "sessão salva" : "sessões salvas"}`
                  : "nada salvo ainda"
                : " "}
            </span>
          </span>
        </Link>
        <Link
          href="/meu/repertorio/"
          className="flex items-center gap-3 rounded-xl border border-borda bg-superficie p-3 no-underline"
        >
          <span aria-hidden className="shrink-0 text-acao-tinta">
            {ICONE_PERFIL}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <strong className="text-sm leading-snug font-bold">Mapa de repertório</strong>
            <span className="tipo-legenda text-tinta-2">as linguagens que você atravessa</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
