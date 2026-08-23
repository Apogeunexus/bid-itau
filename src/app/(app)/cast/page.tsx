import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "Cast — Agenda Cultural BR" };

/**
 * Cast — os podcasts do acervo, hoje misturados dentro de /play. O recorte por
 * `extra.categoria === "podcasts"` (336 mídias medidas em `src/dados/play.ts`)
 * entra na fase de catálogos; a rota nasce junto com o item de menu para nenhum
 * link anunciar um beco.
 */
export default function Cast() {
  return (
    <TelaEsqueleto
      nome="Cast"
      objetivo="Os podcasts do Itaú Cultural como seção própria — hoje eles dividem o catálogo de Play; aqui ganham fila própria de episódios, ordenada por publicação, com o player do acervo."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Fila de episódios por data de publicação",
          "Séries de podcast agrupadas",
          "Player com metadados e crédito do acervo",
        ]}
      />
    </TelaEsqueleto>
  );
}
