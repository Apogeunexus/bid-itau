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
export function SeletorDisposicao({
  permanente = false,
  modo = "banner",
}: {
  permanente?: boolean;
  /**
   * `banner` é o topo de Descobrir: fundo cheio, frase de destaque e as opções num
   * trilho que rola de lado — ali ele encosta na borda da tela e o corte da última
   * pastilha é o que anuncia que há mais.
   *
   * `dropdown` é para dentro de uma caixa, como a tela de perfil. Ali o mesmo trilho
   * sangrava pela borda arredondada do cartão e a opção cortada só parecia defeito. São
   * cinco rótulos longos («quero conhecer algo que nunca vi»); numa lista VERTICAL cabem
   * inteiros, e a escolha múltipla fica legível porque cada linha tem a própria marca.
   */
  modo?: "banner" | "dropdown";
}) {
  const { disposicoes, alternarDisposicao, definirDisposicoes } = useSessao();
  const [aberto, setAberto] = useState(permanente);

  const marcadas = DISPOSICOES.filter((d) => disposicoes.includes(d.id));
  const painelAberto = permanente || aberto;
  const avisoAberto = painelAberto
    ? DISPOSICOES.find((d) => disposicoes.includes(d.id) && d.ausencia)
    : undefined;

  const resumo = marcadas.length
    ? marcadas.map((d) => d.rotulo).join(" · ")
    : "O acervo inteiro, no seu ritmo";

  if (modo === "dropdown") {
    const avisoNaLista = DISPOSICOES.find((d) => disposicoes.includes(d.id) && d.ausencia);
    return (
      <section data-seletor-disposicao className="disposicao-campo">
        {/* `<details>` nativo: abre e fecha sem JavaScript, o teclado já sabe operar, e é
            o mesmo controle que `/filtros` usa para as oito dimensões de acessibilidade.
            Nasce FECHADO — quem chega ao perfil não veio mudar a disposição. */}
        <details className="disposicao-gaveta">
          <summary className="disposicao-gaveta-topo">
            <span className="disposicao-gaveta-texto">
              <span className="disposicao-gaveta-rotulo tipo-micro">Como você quer descobrir</span>
              <span className="disposicao-gaveta-valor tipo-detalhe">{resumo}</span>
            </span>
            {/* A SETA É A ÚNICA COISA QUE DIZ QUE ABRE. Fechada, a caixa era um retângulo
                com duas linhas de texto — nada nela pedia um toque, e o que não anuncia
                que abre não é aberto. Ela gira meia volta em `[open]`, que é o mesmo
                gesto que o triângulo nativo faria se ele acompanhasse o tema. */}
            <span className="disposicao-gaveta-seta" aria-hidden="true">
              ▾
            </span>
          </summary>

          <ul className="disposicao-opcoes">
            {DISPOSICOES.map((d) => {
              const ativa = disposicoes.includes(d.id);
              return (
                <li key={d.id}>
                  {/* `aria-pressed` e não `checkbox`: são alternadores de recorte, e a
                      marca quadrada à esquerda é o que diz, sem cor, que dá para marcar
                      mais de um. */}
                  <button
                    type="button"
                    data-disposicao={d.id}
                    aria-pressed={ativa}
                    onClick={() => alternarDisposicao(d.id)}
                    className="disposicao-opcao"
                  >
                    <span className="disposicao-opcao-marca" aria-hidden />
                    <span className="disposicao-opcao-rotulo">{d.rotulo}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {avisoNaLista?.ausencia ? (
            <p className="disposicao-opcao-aviso tipo-legenda">{avisoNaLista.ausencia}</p>
          ) : null}

          {marcadas.length ? (
            <button
              type="button"
              onClick={() => definirDisposicoes([])}
              className="disposicao-limpar tipo-legenda"
            >
              Limpar escolha
            </button>
          ) : null}
        </details>
      </section>
    );
  }

  return (
    <section data-seletor-disposicao className="disposicao-banner">
      <div className="disposicao-banner-topo">
        <div className="min-w-0 flex-1">
          <p className="disposicao-banner-kicker">Como você quer descobrir</p>
          <p className="disposicao-banner-frase">{resumo}</p>
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
