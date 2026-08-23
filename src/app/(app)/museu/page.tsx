import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "Museu — Agenda Cultural BR" };

/**
 * Museu virtual — o hub que reúne o que o acervo tem de museológico: os espaços
 * com vocação de museu, o tema de exposições do grafo e as visitas virtuais.
 * O miolo real entra na fase de catálogos; a rota nasce junto com o item de menu
 * para nenhum link anunciar um beco.
 */
export default function Museu() {
  return (
    <TelaEsqueleto
      nome="Museu virtual"
      objetivo="Os museus e espaços expositivos do acervo num hub próprio — espaços com página de produtor, exposições em cartaz e virtuais, e o acervo de visitas — em vez de diluídos no catálogo geral."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Espaços-museu do acervo (MIS, MAM, MAC…)",
          "Exposições em cartaz e virtuais",
          "Visitas e acervos digitalizados",
        ]}
      />
    </TelaEsqueleto>
  );
}
