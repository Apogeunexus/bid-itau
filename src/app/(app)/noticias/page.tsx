import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "Notícias — Agenda Cultural BR" };

/**
 * Notícias — o hub editorial («+Cultura» no site do Itaú Cultural): notícias,
 * colunas, entrevistas e opinião do acervo de conteúdos. O catálogo real entra
 * na fase de catálogos, no molde de `play.ts`; a rota nasce junto com o item de
 * menu para nenhum link anunciar um beco.
 */
export default function Noticias() {
  return (
    <TelaEsqueleto
      nome="Notícias"
      objetivo="O lado editorial do acervo num hub só: notícias, colunas, entrevistas e opinião, com filtros por seção — o mesmo recorte que o site do Itaú Cultural chama de +Cultura."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Notícias do acervo por data",
          "Seções: colunas · entrevistas · opinião",
          "Destaques com capa e crédito",
        ]}
      />
    </TelaEsqueleto>
  );
}
