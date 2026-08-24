import type { Metadata } from "next";
import Link from "next/link";
import { CartaoLeitura } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { leituras, milhar } from "@/dados/leituras";

export const metadata: Metadata = { title: "Exposições — Itaú Cultural" };

/** As categorias museais do acervo editorial, com o rótulo que a tela usa. */
const CATEGORIAS_MUSEAIS = ["exposicoes", "visitas", "acervos", "ocupacao"];

/**
 * `/museu/exposicoes` — o submenu de Museu pedido pelo cliente: o acervo digital
 * expositivo. MEDIDO: 67 conteúdos nas categorias exposições, visitas, acervos e
 * ocupação. Os eventos expositivos em cartaz ficam no hub
 * de Museu, que é onde têm página própria. COMPONENTE DE SERVIDOR (DP-F).
 */
export default function Exposicoes() {
  const itens = leituras().filter((l) => CATEGORIAS_MUSEAIS.includes(l.categoria));

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Exposições</h1>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          O acervo digital expositivo — <strong>{milhar(itens.length)} conteúdos</strong> entre
          exposições, visitas, acervos e ocupações, por publicação.
        </p>
        <nav aria-label="Museu" className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/museu/"
            className="rounded-pilula border border-borda-forte px-3 py-1 text-xs font-semibold no-underline"
          >
            ← Museu virtual
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-4 desk:grid-cols-3">
        {itens.map((leitura) => (
          <CartaoLeitura key={leitura.id} leitura={leitura} />
        ))}
      </div>

    </div>
  );
}
