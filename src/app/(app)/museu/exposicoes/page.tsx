import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "Exposições — Agenda Cultural BR" };

/**
 * Exposições — o submenu de Museu pedido pelo cliente: o recorte expositivo em
 * lista própria. O miolo real entra na fase de catálogos; a rota nasce junto com
 * o item de menu para nenhum link anunciar um beco.
 */
export default function Exposicoes() {
  return (
    <TelaEsqueleto
      nome="Exposições"
      objetivo="As exposições do acervo — em cartaz, virtuais e as ocupações — listadas com período, espaço e ficha de acessibilidade, ligadas aos artistas e obras do grafo."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Em cartaz, com período e espaço",
          "Exposições virtuais do acervo",
          "Ligações com artistas e obras do grafo",
        ]}
      />
    </TelaEsqueleto>
  );
}
