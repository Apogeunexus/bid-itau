import { Buscar } from "@/componentes/buscar";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";

/**
 * Buscar — AGEN-06, `docs/telas.md` tela 16, D-63 e D-66.
 *
 * COMPONENTE DE SERVIDOR, E É AQUI QUE O ÍNDICE É MONTADO. Sob `output: "export"` (D-24)
 * «servidor» quer dizer build: `montarIndice` roda no momento em que este módulo é
 * carregado, atravessa as 5.092 entidades indexáveis pelas funções públicas de
 * `grafo.ts` (D-47 — nenhuma varredura de array cru) e devolve um DTO colunar de
 * primitivos. O que cruza a fronteira RSC é esse DTO, medido e com teto.
 *
 * É ESTE ARQUIVO QUE SEGURA DP-F, e por isso a injeção existe. `entidades.json` tem 9,4 MB
 * e `arestas.json` 13,6 MB; nenhum dos dois pode chegar ao navegador. `indice.ts` foi
 * escrito SEM nenhum import de `./grafo` — nem estático nem dinâmico — justamente para
 * que o componente de cliente possa importar `consultar` dele sem arrastar o acervo
 * junto. As três funções de travessia entram aqui, deste lado da fronteira, exatamente
 * como `caminhada.ts` injeta o contexto dos predicados de disposição na fase 2.
 *
 * A busca em si NÃO acontece aqui: ela é filtro em memória no cliente, a cada tecla, sobre
 * o DTO. Nenhuma rota nova, nenhuma chamada de rede, nenhuma biblioteca de busca (D-63).
 */
export default function PaginaBuscar() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });

  return <Buscar indice={indice} />;
}
