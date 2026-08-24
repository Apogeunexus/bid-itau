"use client";

import { useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { useSessao } from "@/contexto/sessao";
import { DISPOSICOES } from "@/dados/disposicoes";

/**
 * seletor-disposicao.tsx — D-32, o topo de Descobrir.
 *
 * A disposição fica visível em texto e editável em um toque. Nenhuma marcada é
 * estado válido: o feed base existe, o seletor pondera, não tranca (D-31).
 *
 * O painel abre em fluxo normal, empurrando o feed — `fixed` escaparia da
 * moldura (D-03). DP-F: só `disposicoes.ts`, sem grafo.
 */
export function SeletorDisposicao({ permanente = false }: { permanente?: boolean }) {
  const { disposicoes, alternarDisposicao, definirDisposicoes } = useSessao();
  const [aberto, setAberto] = useState(permanente);

  const marcadas = DISPOSICOES.filter((d) => disposicoes.includes(d.id));
  const painelAberto = permanente || aberto;
  const avisoAberto = painelAberto
    ? DISPOSICOES.find((d) => disposicoes.includes(d.id) && d.ausencia)
    : undefined;

  return (
    <section data-seletor-disposicao className="disposicao-banner">
      <div className="disposicao-banner-topo">
        <div className="min-w-0 flex-1">
          <p className="disposicao-banner-kicker">Como você quer descobrir</p>
          <p className="disposicao-banner-frase">
            {marcadas.length
              ? marcadas.map((d) => d.rotulo).join(" · ")
              : "O acervo inteiro, no seu ritmo"}
          </p>
        </div>
        {permanente ? null : (
          <button
            type="button"
            data-abrir-disposicao
            aria-expanded={aberto}
            onClick={() => setAberto((v) => !v)}
            className="disposicao-banner-acao"
          >
            {aberto ? "Fechar" : marcadas.length ? "Mudar" : "Escolher"}
          </button>
        )}
      </div>

      {painelAberto ? (
        <div className="flex flex-col gap-3">
          <TrilhoDeChips rotulo="Disposições">
            {DISPOSICOES.map((d) => {
              const ativa = disposicoes.includes(d.id);
              return (
                <Chip
                  key={d.id}
                  data-disposicao={d.id}
                  selecionado={ativa}
                  onClick={() => alternarDisposicao(d.id)}
                >
                  {d.rotulo}
                </Chip>
              );
            })}
          </TrilhoDeChips>
          {avisoAberto?.ausencia ? (
            <p className="tipo-legenda text-tinta-2">{avisoAberto.ausencia}</p>
          ) : null}
          {marcadas.length ? (
            <button
              type="button"
              onClick={() => definirDisposicoes([])}
              className="tipo-legenda w-fit font-semibold text-tinta-3 underline underline-offset-2"
            >
              Limpar escolha
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
