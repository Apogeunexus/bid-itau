import { SemResultado } from "@/componentes/sem-resultado";
import { montarBeco } from "@/dados/filtros";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";

/**
 * /busca-nao-encontrada — o primeiro dos três becos do site atual (D-93).
 *
 * COMPONENTE DE SERVIDOR. `montarIndice` e `montarBeco` rodam no build, atravessam o
 * acervo pelas funções públicas de `grafo.ts` (D-47) e devolvem primitivos. O índice desce
 * porque o afrouxamento é APLICADO na tela, num toque, sem trocar de rota — e aplicar é
 * rodar `consultar()` sobre a consulta já afrouxada que veio medida.
 *
 * A consulta desta tela está CONGELADA em `CONSULTAS_DOS_BECOS`: «libras» cruzado com a
 * classe `evento`. Ela foi escolhida por regra e não é sorteada a cada build, porque a
 * banca vai ver esta tela e ela não pode mudar entre um ensaio e a apresentação. Se o
 * acervo regerado fizer a consulta voltar a ter resultado, `montarBeco` derruba o build:
 * uma tela de zero-resultado sobre uma busca que achou é a mentira mais fácil de não notar.
 *
 * Esta rota fica em `(app)` e RECEBE a barra de abas — por isso `comNavegacaoPropria` fica
 * em falso: duas navegações na mesma tela seriam ruído, não redundância útil.
 */
export default function PaginaBuscaNaoEncontrada() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  return <SemResultado beco={montarBeco(indice, "busca-nao-encontrada")} indice={indice} />;
}
