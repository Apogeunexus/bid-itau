"use client";

import Link from "next/link";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import {
  FAMILIAS,
  capaDaFamilia,
  contagemPorFamilia,
  recompensasEmDestaque,
} from "@/dados/recompensas";
import { CONFIG } from "@/dados/pontos";

/**
 * recompensas-capa.tsx — o que se vê antes do catálogo.
 *
 * Dois blocos, e a ordem importa: DESTAQUES primeiro, porque é o que dá vontade;
 * BENEFÍCIOS depois, porque é o que explica. Abrir direto num catálogo de 17
 * itens em cinco famílias faz a pessoa escolher antes de entender o que existe.
 *
 * Os dois são trilhos de DOIS POR TELA. Um por tela desperdiça metade da
 * largura; três deixam a foto pequena demais para dizer o que é. Dois é o que
 * mostra a imagem inteira e ainda revela que há mais à direita.
 */
export function RecompensasCapa() {
  const { motor, hidratado } = usePontos();
  const fichas = hidratado ? motor.saldoDe("ficha") : 0;
  const contas = contagemPorFamilia();

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="tipo-detalhe font-bold">Destaques</h2>
          <p className="tipo-legenda text-tinta-2">
            {CONFIG.temporada.titulo} · termina em {CONFIG.temporada.diasRestantes} dias
          </p>
        </div>

        <div className="trilho-duplo">
          {recompensasEmDestaque().map((r) => {
            const falta = r.custo - fichas;
            const familia = FAMILIAS.find((f) => f.id === r.familia);

            return (
              <Link key={r.id} href={`/recompensas/${r.id}/`} className="capa-cartao">
                <span className="capa-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imagem} alt={r.imagemAlt} loading="lazy" />
                  {familia && <span className="capa-etiqueta">{familia.rotulo}</span>}
                </span>
                <span className="capa-corpo">
                  <span className="capa-titulo">{r.titulo}</span>
                  <span className="capa-nota">{r.descricao}</span>
                  <span className="capa-rodape">
                    <span className="recompensa-preco">
                      <Moeda />
                      {r.custo}
                    </span>
                    {hidratado &&
                      (falta <= 0 ? (
                        <span className="capa-pode">resgatar</span>
                      ) : (
                        <span className="capa-falta">−{falta.toLocaleString("pt-BR")}</span>
                      ))}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="tipo-detalhe font-bold">Benefícios culturais</h2>
          <p className="tipo-legenda text-tinta-2">
            O que suas fichas abrem, por natureza do benefício.
          </p>
        </div>

        <div className="trilho-duplo">
          {FAMILIAS.map((familia) => {
            const capa = capaDaFamilia(familia.id);
            const quantas = contas[familia.id];

            return (
              <Link
                key={familia.id}
                href={`/recompensas/catalogo/#${familia.id}`}
                className="capa-cartao"
              >
                <span className="capa-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capa.imagem} alt={capa.imagemAlt} loading="lazy" />
                  <span className="capa-etiqueta">
                    {quantas} {quantas === 1 ? "item" : "itens"}
                  </span>
                </span>
                <span className="capa-corpo">
                  <span className="capa-titulo">{familia.rotulo}</span>
                  <span className="capa-nota">{familia.resumo}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Link href="/recompensas/catalogo/" className="botao-acao no-underline">
        Ver loja completa
      </Link>
    </div>
  );
}
