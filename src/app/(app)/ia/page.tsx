import type { Metadata } from "next";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export const metadata: Metadata = { title: "IA — Agenda Cultural BR" };

/**
 * IA — a estrelinha: roteiros personalizados montados após uma entrevista curta
 * (o que você gosta, com quem vai, quantos dias, onde). No protótipo estático a
 * «IA» é determinística sobre o grafo — mesmo princípio dos 96 feeds
 * pré-computados — e se declara como simulação. A rota nasce junto com o item
 * de menu; a entrevista e o gerador entram na fase da estrelinha.
 */
export default function Ia() {
  return (
    <TelaEsqueleto
      nome="Roteiros com IA"
      objetivo="Uma entrevista de quatro perguntas — o que te chama, com quem você vai, quantos dias, em que cidade — e a estrelinha monta um roteiro dia a dia sobre o grafo do acervo, com o motivo de cada parada visível e editável."
      camada="C2"
    >
      <EsqueletoLista
        rotulos={[
          "Entrevista de 4 passos",
          "Roteiro dia a dia com percurso no mapa",
          "Motivos visíveis e critérios removíveis",
        ]}
      />
    </TelaEsqueleto>
  );
}
