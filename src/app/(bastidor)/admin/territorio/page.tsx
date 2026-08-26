import { AdminTerritorio } from "@/componentes/admin-territorio";
import { aferirDto, territoriosDoAdmin } from "@/dados/admin";

/**
 * `/admin/territorio` — A3, a tabela de centroides e o que ela produz no mapa.
 *
 * PÁGINA DE SERVIDOR. `territoriosDoAdmin()` varre o acervo inteiro com a MESMA
 * `coordenadaDe()` que o mapa usa, para saber não só o que a tabela guarda mas o que ela
 * resolve — são dois números diferentes, 472 e 1.380, e a tela mostra os dois. A varredura
 * é memorizada e roda uma vez por build.
 *
 * O DTO é só primitivo e é aferido contra o teto antes de cruzar a fronteira RSC.
 */
export const metadata = {
  title: "Territórios e centroides · Admin",
  description:
    "A tabela de centroides, o que ela resolve no mapa, e quais municípios acrescentar " +
    "primeiro — com quantas entidades cada um move.",
};

export default function PaginaDeTerritorio() {
  return <AdminTerritorio dados={aferirDto("admin/territorio", territoriosDoAdmin())} />;
}
