"use client";

import Link from "next/link";
import { useState } from "react";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { consultar, type IndiceDTO, type ResultadoBusca } from "@/dados/indice";
import type { Beco, SaidaDoBeco } from "@/dados/filtros";

/**
 * sem-resultado.tsx — os três becos sem saída, que deixam de ser becos (D-93).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UM COMPONENTE, TRÊS TELAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `/404`, `/busca-nao-encontrada/` e `/agenda-nao-encontrada/` são o MESMO desenho com
 * conteúdos diferentes: o que se pediu, por que não achou, por onde sair com o número, o
 * que existe perto no grafo, e a trilha curada. Três componentes seriam a duplicação que
 * diverge na primeira correção — e a correção de uma tela de erro é justamente a que
 * ninguém lembra de replicar nas outras duas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A ORDEM DOS BLOCOS É A DECISÃO DE PRODUTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A SAÍDA VEM ANTES DA EXPLICAÇÃO. Quem chega aqui não quer primeiro entender o acervo:
 * quer sair. Explicar antes de oferecer saída é o que transforma uma tela de erro numa
 * tela de erro comprida. Por isso o bloco de afrouxamentos fica logo abaixo do título, e
 * o gate mede o retângulo dele contra a moldura menos a barra de abas — «na primeira
 * vista» aqui é medida, não intenção.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O NÚMERO É O QUE TRANSFORMA A OFERTA EM DECISÃO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Um afrouxamento sem número é um botão de esperança. «Solte o tipo» não diz se do outro
 * lado há 8 resultados ou nenhum, e quem já não achou nada uma vez não tem por que
 * acreditar na segunda. `consultar()` de `indice.ts` JÁ MEDE quantos resultados cada
 * afrouxamento traria — `Afrouxamento.resultados`, medido e não estimado — e é esse número
 * que aparece ao lado do rótulo. Não há um segundo motor aqui: o toque aplica a
 * `consulta` que veio pronta e o contador passa a ser o número prometido. O gate compara
 * os dois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O CONTRASTE COM O SITE DE HOJE É PARTE DO ARGUMENTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * O site atual do Itaú Cultural termina estas três rotas em mensagem de erro. Aqui
 * nenhuma delas é fim de caminho — e `/404` é a que mais importa, porque é a superfície
 * que qualquer erro de digitação alcança e a que é mais fácil deixar sem volta.
 *
 * DP-F: este arquivo não alcança `@/dados/grafo`. De `@/dados/filtros` importa SÓ TIPO; o
 * `Beco` inteiro desce por propriedade, montado no build.
 */

/** As cinco abas de D-13, em texto, para a rota que não recebe a barra. */
const ABAS: Array<{ href: string; rotulo: string }> = [
  { href: "/descobrir", rotulo: "Descobrir" },
  { href: "/acontece", rotulo: "Acontece" },
  { href: "/play", rotulo: "Play" },
  { href: "/buscar", rotulo: "Buscar" },
  { href: "/meu", rotulo: "Meu" },
];

/** Teto da lista de resultados que o afrouxamento aplicado mostra. */
const TETO_APLICADO = 12;

function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export interface SemResultadoProps {
  beco: Beco;
  /**
   * `null` no `/404`. Um endereço inexistente não tem consulta a afrouxar — as saídas
   * dele são endereços, e mandar o índice de 377 KB para lá seria peso sem uso.
   */
  indice: IndiceDTO | null;
  /**
   * Verdadeiro só em `/404`, que fica FORA dos grupos `(app)` e `(bastidor)` e por isso
   * não recebe barra de abas nem aviso de desktop. Uma tela de 404 sem caminho de volta é
   * exatamente o beco que D-93 proíbe, e esta é a rota em que ele é mais fácil de cometer.
   */
  comNavegacaoPropria?: boolean;
}

export function SemResultado({ beco, indice, comNavegacaoPropria = false }: SemResultadoProps) {
  const [aplicado, setAplicado] = useState<{
    saida: SaidaDoBeco;
    total: number;
    resultados: ResultadoBusca[];
  } | null>(null);

  function aplicar(saida: SaidaDoBeco) {
    if (!indice || !saida.consulta) return;
    // A `consulta` já veio AFROUXADA de `consultar()`. Aplicar é rodar o mesmo motor sobre
    // ela — não recalcular o afrouxamento, que já foi medido no build.
    const r = consultar({ ...saida.consulta, limite: TETO_APLICADO }, indice);
    setAplicado({ saida, total: r.total, resultados: r.resultados });
  }

  return (
    <section className="beco" data-sem-resultado={beco.id} data-beco={beco.id}>
      {/* ---------------------------------------------------------------- */}
      {/* Título e o que foi pedido                                         */}
      {/* ---------------------------------------------------------------- */}
      <header className="beco-topo">
        <h1 className="beco-titulo">
          <Grafismo
            variacao="barra"
            className="h-3.5 w-auto shrink-0 text-acao"
          />
          {beco.titulo}
        </h1>
        <p className="beco-buscado">
          Você pediu <strong>{beco.oQueFoiBuscado}</strong>.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* A SAÍDA — antes da explicação, de propósito (D-93)                */}
      {/* ---------------------------------------------------------------- */}
      <div className="beco-saidas">
        <p className="beco-saidas-titulo">
          {beco.id === "404"
            ? "Por onde entrar — com o número de cada porta"
            : "Por onde sair — e quantos resultados cada caminho traz"}
        </p>

        <ul className="beco-lista-saidas">
          {beco.saidas.map((s) => (
            <li
              key={s.chave}
              className="beco-saida"
              data-afrouxamento={s.chave}
              data-afrouxamento-resultados={s.resultados}
              data-afrouxamento-tipo={s.tipo}
            >
              {s.consulta && indice ? (
                <button
                  type="button"
                  className="beco-saida-acao"
                  aria-pressed={aplicado?.saida.chave === s.chave}
                  onClick={() => aplicar(s)}
                >
                  <span className="beco-saida-rotulo">{s.rotulo}</span>
                  <span className="beco-saida-n">{milhar(s.resultados)} resultados</span>
                </button>
              ) : (
                <Link href={s.rota ?? "/buscar/"} className="beco-saida-acao">
                  <span className="beco-saida-rotulo">{s.rotulo}</span>
                  <span className="beco-saida-n">{milhar(s.resultados)} resultados</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {aplicado ? (
          <div className="beco-aplicado" data-contador-vivo={aplicado.total}>
            <p className="beco-aplicado-linha">
              <strong>{milhar(aplicado.total)}</strong> resultados — exatamente o número que{" "}
              «{aplicado.saida.rotulo}» prometia. Aplicado aqui mesmo, sem trocar de tela.
            </p>
            <ul className="beco-aplicado-lista">
              {aplicado.resultados.map((r) => (
                <li key={r.chave} className="beco-aplicado-item" data-resultado-afrouxado={r.chave}>
                  <span className="beco-aplicado-classe">{r.classe}</span>
                  <span className="beco-aplicado-titulo">{r.titulo}</span>
                </li>
              ))}
            </ul>
            {aplicado.total > aplicado.resultados.length ? (
              <p className="beco-nota">
                Mostrando {milhar(aplicado.resultados.length)} de {milhar(aplicado.total)}. O
                corte é da exibição, e está declarado em vez de acontecer em silêncio.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* As cinco abas — só onde o layout não as monta (/404)              */}
      {/* ---------------------------------------------------------------- */}
      {comNavegacaoPropria ? (
        <nav className="beco-abas" aria-label="Navegação principal">
          <p className="beco-saidas-titulo">Ou volte para uma das cinco telas</p>
          <ul className="beco-abas-lista">
            {ABAS.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="beco-aba">
                  {a.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Por que não achou — com os denominadores medidos                  */}
      {/* ---------------------------------------------------------------- */}
      <div className="beco-porque">
        <p className="beco-saidas-titulo">Por que este recorte está vazio</p>
        <p className="beco-porque-frase">{beco.porQueNaoAchou}</p>

        <ul className="beco-denominadores">
          {beco.denominadores.map((d) => (
            <li key={d.chave} className="beco-denominador" data-denominador={d.chave}>
              <strong className="beco-denominador-numero">{milhar(d.n)}</strong>
              <span className="beco-denominador-rotulo">{d.rotulo}</span>
            </li>
          ))}
        </ul>

        <Comentario className="beco-comentario">
          D-93: o site atual do Itaú Cultural tem três becos sem saída — `/404`,
          `/busca-nao-encontrada` e `/agenda-nao-encontrada`. Neste protótipo nenhum dos três
          existe como fim de caminho. A consulta desta tela foi escolhida por regra e
          congelada: {beco.regra}. Os números de cada saída vêm de `Afrouxamento.resultados`
          de `indice.ts`, medidos no build sobre o índice inteiro — nunca estimados.
        </Comentario>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* O que existe PERTO disso no grafo — com o motivo escrito          */}
      {/* ---------------------------------------------------------------- */}
      {beco.vizinhos.length ? (
        <div className="beco-perto">
          <p className="beco-saidas-titulo">O que existe perto disso no acervo</p>
          <p className="beco-nota">
            Vizinhança por <code>semelhante_a</code>, e o motivo vem escrito na própria
            ligação — é o mesmo mecanismo do selo laranja de Descobrir. Um «veja também» sem
            motivo seria o recomendador opaco que este projeto recusa.
          </p>
          <ul className="beco-lista-perto">
            {beco.vizinhos.map((v) => (
              <li key={v.id} className="beco-vizinho" data-perto-no-grafo={v.classe}>
                {v.rota ? (
                  <Link href={v.rota} className="beco-vizinho-titulo">
                    {v.titulo}
                  </Link>
                ) : (
                  <span className="beco-vizinho-titulo">{v.titulo}</span>
                )}
                <span className="beco-vizinho-motivo">{v.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* A trilha curada — no singular que o acervo sustenta (D-90)        */}
      {/* ---------------------------------------------------------------- */}
      {beco.trilhas.map((t) => (
        <div key={t.id} className="beco-trilha" data-trilha-relacionada={t.slug}>
          <p className="beco-saidas-titulo">
            Ou percorra a trilha curada — {milhar(beco.trilhas.length)}, a única que este
            acervo tem
          </p>
          <Link href={`/trilha/${t.slug}/`} className="beco-trilha-link">
            {t.titulo}
          </Link>
          {t.resumo ? <p className="beco-nota">{t.resumo}</p> : null}
          <p className="beco-nota">
            {milhar(beco.trilhas.length)} trilha, e o singular é medido: o acervo tem uma
            trilha curada. Dizer «trilhas relacionadas» no plural fingiria um catálogo que
            não existe.
          </p>
        </div>
      ))}
    </section>
  );
}
