"use client";

import Link from "next/link";
import { EstrelaXp } from "@/componentes/estrela-xp";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";

/**
 * O par de saldos do cabeçalho: percurso e ficha, nessa ordem.
 *
 * O PERCURSO VEM PRIMEIRO porque é o que não gasta — ele mede quem a pessoa
 * virou, e o número só sobe. A ficha vem depois porque é o saldo que ela vai
 * gastar. Invertida, a leitura do topo passaria a ser «quanto eu tenho para
 * torrar», que é a leitura de um programa de milhagem.
 */
export function ContadorDeFichas() {
  const { motor, hidratado } = usePontos();
  if (!hidratado) return null;

  const fichas = motor.saldoDe("ficha");
  const percurso = motor.saldoDe("percurso");
  const nivel = motor.nivel();

  return (
    <span className="barra-saldos ml-auto">
      <Link
        href="/desafios/"
        className="saldo-pilula no-underline"
        aria-label={`${percurso} de percurso. Nível ${nivel.numero}, ${nivel.nome}. Abrir os desafios.`}
      >
        <EstrelaXp />
        <span className="tipo-legenda font-bold">{percurso.toLocaleString("pt-BR")}</span>
      </Link>

      <Link
        href="/meu/carteira/"
        className="saldo-pilula no-underline"
        aria-label={`${fichas} fichas. Abrir a carteira.`}
      >
        <Moeda />
        <span className="tipo-legenda font-bold">{fichas.toLocaleString("pt-BR")}</span>
      </Link>
    </span>
  );
}
