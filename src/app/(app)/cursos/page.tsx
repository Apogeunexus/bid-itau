import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "Cursos — Agenda Cultural BR" };

/**
 * Cursos — as formações do acervo (classe `formacao`, a Escola Itaú Cultural)
 * em seção própria. O catálogo real entra na fase de catálogos; a rota nasce
 * junto com o item de menu para nenhum link anunciar um beco.
 */
export default function Cursos() {
  return (
    <TelaEsqueleto
      nome="Cursos"
      objetivo="As formações da Escola Itaú Cultural em vitrine própria: cursos e oficinas do acervo com período, modalidade e ligação com os temas e linguagens do grafo."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Cursos com período e modalidade",
          "Formações por linguagem artística",
          "Ligações com temas do grafo",
        ]}
      />
    </TelaEsqueleto>
  );
}
