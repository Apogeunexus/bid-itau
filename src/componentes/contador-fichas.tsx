"use client";

import Link from "next/link";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";

/** O saldo sempre à vista. Antes de hidratar não mostra número nenhum. */
export function ContadorDeFichas() {
  const { motor, hidratado } = usePontos();
  if (!hidratado) return null;

  const fichas = motor.saldoDe("ficha");

  return (
    <Link
      href="/meu/carteira/"
      className="botao-discreto no-underline ml-auto"
      style={{ padding: "0.25rem 0.6rem" }}
      aria-label={`${fichas} fichas. Abrir a carteira.`}
    >
      <span className="saldo-linha">
        <Moeda />
        <span className="tipo-legenda font-bold">{fichas.toLocaleString("pt-BR")}</span>
      </span>
    </Link>
  );
}
