import { BuscaFrase } from "@/componentes/busca-frase";
import {
  montarVizinhancaDeSemelhanca,
  traduzir,
  FRASE_DO_CENARIO_5,
} from "@/dados/frase";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";

/**
 * Buscar por frase — AGEN-07, `docs/telas.md`, D-64, D-65 e D-66.
 *
 * É a resposta ao Cenário 5 do RFP: «quero algo parecido com a Bienal, gratuito e perto
 * de mim».
 *
 * COMPONENTE DE SERVIDOR, E É AQUI QUE O ACERVO É LIDO. Sob `output: "export"` (D-24)
 * «servidor» quer dizer build: `montarIndice` atravessa as 5.092 entidades indexáveis
 * pelas funções públicas de `grafo.ts` (D-47 — nenhuma varredura de array cru), e
 * `montarVizinhancaDeSemelhanca` percorre as arestas `semelhante_a` que saem do que casa
 * com a âncora da frase, guardando o `motivo` ESCRITO de cada uma. O que cruza a
 * fronteira RSC são dois objetos de primitivos.
 *
 * É ESTE ARQUIVO QUE SEGURA DP-F, e por isso as duas injeções existem. `entidades.json`
 * tem 9,4 MB e `arestas.json` 13,6 MB; nenhum dos dois pode chegar ao navegador.
 * `indice.ts` e `frase.ts` foram escritos SEM nenhum import de `./grafo` — nem estático
 * nem dinâmico — justamente para que o componente de cliente possa importar `consultar` e
 * `traduzir` deles sem arrastar o acervo junto. As funções de travessia entram aqui,
 * deste lado da fronteira, como `caminhada.ts` faz na fase 2.
 *
 * A TRADUÇÃO NÃO É PRÉ-COMPUTADA POR SUBCONJUNTO, e a decisão é deliberada: a frase é
 * EDITÁVEL (D-64 — a tradução acompanha a edição), então um precômputo combinatório só
 * cobriria as combinações da frase original e a primeira tecla cairia fora dele.
 * `traduzir` e `consultar` são determinísticas e rodam em memória sobre o DTO — o mesmo
 * gesto que `/buscar` faz a cada tecla. A única travessia de grafo desta tela acontece
 * aqui, no build, e chega ao cliente como mapa de texto.
 *
 * A ÂNCORA VEM DA PRÓPRIA TRADUÇÃO, e não de uma constante escrita aqui: é a regra de
 * semelhança que decide o que «parecido com a Bienal» quer dizer, e o build atravessa
 * exatamente aquilo. Escrever «bienal» à mão neste arquivo deixaria a tela e a regra
 * livres para divergirem em silêncio.
 */
export default function PaginaBuscarPorFrase() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });

  const traducao = traduzir(FRASE_DO_CENARIO_5, indice);
  const semelhanca = traducao.criterios.find((criterio) => criterio.regra === "semelhanca");

  const vizinhanca = montarVizinhancaDeSemelhanca(
    { slugsPorTipo, porSlug, vizinhos },
    semelhanca?.valor ?? "",
    indice,
  );

  return <BuscaFrase indice={indice} vizinhanca={vizinhanca} />;
}
