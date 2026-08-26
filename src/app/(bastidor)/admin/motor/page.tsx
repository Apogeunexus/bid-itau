import { AdminMotor } from "@/componentes/admin-motor";
import { aferirDto, concentradores, parametrosDoMotor } from "@/dados/admin";

/**
 * `/admin/motor` — A2, os quatro parâmetros que decidem o que o acervo produz.
 *
 * PÁGINA DE SERVIDOR, e é ela que toca o acervo. Sob `output: "export"` «servidor» quer
 * dizer BUILD: `parametrosDoMotor()` atravessa `duplicatas.ts`, que percorre o grafo para
 * recontar a fila, o menor score encenado e os pares do limiar alternativo. O que cruza a
 * fronteira RSC é um DTO só de primitivo, aferido contra o teto antes de cruzar.
 *
 * `admin-motor.tsx` é `"use client"` e importa `@/dados/admin` só para os primitivos e a
 * validação do formulário — nenhuma função de travessia é chamada de lá. É essa fronteira
 * que impede o acervo de chegar ao navegador (DP-F).
 *
 * ESTA ROTA É DE BASTIDOR. O layout de `(bastidor)` já monta o aviso de desktop e esconde o
 * conteúdo na visão app; esta página não precisa saber disso, e não sabe.
 */
export const metadata = {
  title: "Motor — parâmetros e concentradores · Admin",
  description:
    "Os quatro parâmetros que decidem o que o acervo produz, cada um com o custo medido de " +
    "mudá-lo ou a declaração de que o custo não foi medido.",
};

export default function PaginaDoMotor() {
  const dados = aferirDto("admin/motor", {
    parametros: parametrosDoMotor(),
    concentradores: concentradores(),
  });

  return <AdminMotor dados={dados} />;
}
