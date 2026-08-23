"use client";

import clsx from "clsx";
import { useState } from "react";
import { Grafismo } from "@/componentes/grafismo";
import { useSessao } from "@/contexto/sessao";
import { DISPOSICOES } from "@/dados/disposicoes";

/**
 * seletor-disposicao.tsx — D-32, o topo de Descobrir.
 *
 * «A disposição escolhida fica visível e editável no topo de Descobrir, em um toque.» A
 * frase tem duas metades e as duas são requisito: VISÍVEL em texto corrido, para quem olha
 * a tela projetada entender o que o feed está respondendo sem clicar em nada; e EDITÁVEL em
 * UM toque, porque a banca vai querer ver o feed mudar ao vivo.
 *
 * NENHUMA DISPOSIÇÃO MARCADA É ESTADO VÁLIDO, e a tela diz isso em vez de cobrar uma
 * escolha. D-31 é explícita: disposição PONDERA a caminhada, não a zera. O feed base existe
 * e é bom; o seletor é um ajuste sobre ele, não um portão na frente dele.
 *
 * CUIDADO DE LAYOUT QUE JÁ CUSTOU CARO NA FASE 1: o painel abre DENTRO da moldura de
 * 390px, e a moldura é o contêiner de rolagem (`globals.css`). Posicionamento ancorado na
 * janela — `fixed`, ou um popover flutuante — escaparia do telefone e cairia no meio da
 * tela do avaliador. Por isso o painel abre em FLUXO NORMAL, empurrando o feed para baixo.
 * Não há uma única posição absoluta neste arquivo.
 *
 * DP-F: importa `disposicoes.ts`, que não conhece o grafo. O vocabulário de disposição é
 * autorado e tem 5 itens; o acervo fica do lado de lá da fronteira.
 */
export function SeletorDisposicao() {
  const { disposicoes, alternarDisposicao, definirDisposicoes } = useSessao();
  const [aberto, setAberto] = useState(false);

  const marcadas = DISPOSICOES.filter((d) => disposicoes.includes(d.id));

  return (
    <section
      data-seletor-disposicao
      className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie p-3"
    >
      <div className="flex items-start gap-2">
        <Grafismo variacao="barra" className="mt-1 h-4 w-auto shrink-0 text-acao-tinta" />

        {/* A disposição em TEXTO CORRIDO. É a metade «visível» de D-32, e é o que a foto
            do slide precisa mostrar sem ninguém tocar em nada. */}
        <p className="min-w-0 flex-1 text-sm leading-snug">
          {marcadas.length ? (
            <>
              Hoje você quer{" "}
              {marcadas.map((d, i) => (
                <span key={d.id}>
                  {i > 0 ? (i === marcadas.length - 1 ? " e " : ", ") : ""}
                  <strong className="font-bold">«{d.rotulo}»</strong>
                </span>
              ))}
              .
            </>
          ) : (
            // Encurtado na reformulação de 2026-08: a versão anterior explicava
            // o MECANISMO («disposição pondera a caminhada, não a destrava») no
            // estado padrão da tela mais vista do produto. Isso é texto de
            // especificação vestido de produto — quem chega quer saber o que
            // está vendo, e o porquê está a um toque de distância, em «editar».
            <>
              Este é o <strong>feed base</strong>, do seu repertório.
            </>
          )}
        </p>

        <button
          type="button"
          data-abrir-disposicao
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="shrink-0 cursor-pointer rounded-full border border-acao px-3 py-1 text-xs font-bold text-acao-tinta"
        >
          {aberto ? "fechar" : "editar"}
        </button>
      </div>

      {aberto ? (
        <div className="flex flex-col gap-2 border-t border-borda pt-2">
          <p className="text-xs text-tinta-3">
            Seleção múltipla. As cinco são escritas pela curadoria — nenhuma vem do acervo
            do Itaú Cultural.
          </p>

          {DISPOSICOES.map((d) => {
            const ativa = disposicoes.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                data-disposicao={d.id}
                aria-pressed={ativa}
                onClick={() => alternarDisposicao(d.id)}
                className={clsx(
                  "cartao-disposicao cursor-pointer text-left",
                  ativa && "cartao-disposicao-ativa",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="flex-1 text-sm leading-snug font-bold">{d.rotulo}</span>
                  <span className="shrink-0 text-[0.6rem] tracking-widest text-tinta-3 uppercase">
                    {d.tipo === "corte" ? "corta" : "pondera"}
                  </span>
                </span>
                <span className="block text-xs leading-snug text-tinta-2">{d.explicacao}</span>
                {/* A ausência de campo aparece JÁ NA ESCOLHA, e não só depois no feed:
                    marcar um corte que o acervo não sustenta e descobrir isso adiante seria
                    deixar a pessoa supor que o filtro rodou. */}
                {d.ausencia ? (
                  <span className="block border-l-2 border-acao pl-2 text-[0.7rem] leading-snug text-tinta-2">
                    {d.ausencia}
                  </span>
                ) : null}
              </button>
            );
          })}

          {marcadas.length ? (
            <button
              type="button"
              onClick={() => definirDisposicoes([])}
              className="cursor-pointer self-start text-xs font-semibold text-tinta-3 underline underline-offset-2"
            >
              limpar as {marcadas.length}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
