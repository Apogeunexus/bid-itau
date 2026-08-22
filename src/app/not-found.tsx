import { SemResultado } from "@/componentes/sem-resultado";
import { montarBeco } from "@/dados/filtros";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";

/**
 * not-found.tsx — o terceiro beco, e o mais importante dos três (D-93).
 *
 * `/404` É A SUPERFÍCIE QUE QUALQUER ERRO DE DIGITAÇÃO ALCANÇA. É também a mais fácil de
 * deixar sem volta: nenhum plano se lembra dela, e o padrão do Next é uma linha de texto
 * preta sobre branco, sem um único link. Este arquivo substitui esse conteúdo.
 *
 * ELE NÃO ACRESCENTA PÁGINA. `out/404.html` JÁ EXISTE e está dentro da linha de base de
 * 1.784 páginas do gate da fase 3 — o Next exporta um `404.html` com ou sem este arquivo.
 * Das três telas deste plano, portanto, só duas são rota nova.
 *
 * ELE FICA NA RAIZ DE `src/app/`, FORA de `(app)` e `(bastidor)`, e é isso que exige o
 * cuidado: aqui não há barra de abas nem aviso de desktop, porque nenhum dos dois layouts
 * de grupo alcança esta rota. Por isso `comNavegacaoPropria` é verdadeiro — as cinco abas
 * de D-13 aparecem em texto, com link. Uma tela de 404 sem caminho de volta é exatamente o
 * beco que D-93 proíbe.
 *
 * O ÍNDICE NÃO DESCE PARA CÁ, e a ausência é uma decisão. Um endereço que não existe não é
 * uma busca que falhou: não há critério a afrouxar, porque nenhum critério foi marcado.
 * As saídas daqui são ENDEREÇOS — as quatro maiores portas do acervo, cada uma com o total
 * medido por `consultar()` no build. Mandar 377 KB de índice para uma tela sem consulta
 * seria peso sem uso.
 */
export default function NaoEncontrado() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  return (
    <SemResultado beco={montarBeco(indice, "404")} indice={null} comNavegacaoPropria />
  );
}
