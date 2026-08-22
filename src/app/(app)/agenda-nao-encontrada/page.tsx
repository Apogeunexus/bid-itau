import { SemResultado } from "@/componentes/sem-resultado";
import { montarBeco } from "@/dados/filtros";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";

/**
 * /agenda-nao-encontrada — o segundo dos três becos do site atual (D-93).
 *
 * COMPONENTE DE SERVIDOR, mesma montagem de `/busca-nao-encontrada`. A consulta congelada
 * aqui é um RECORTE DE AGENDA: classe `evento` cruzada com o território brasileiro que tem
 * mais entradas no índice e ainda assim não tem um único evento — Paraíba, 12 entradas e
 * zero eventos.
 *
 * É NESTA TELA QUE CABE A DECLARAÇÃO MAIS DURA DO ACERVO, e ela vem com o denominador:
 * dos 300 eventos, 129 têm sessão datada e 158 têm lugar resolvível, e a INTERSEÇÃO entre
 * as duas coisas é ZERO. Nenhum evento deste acervo tem data e território ao mesmo tempo —
 * e é por isso que todo recorte de agenda por lugar esvazia. O número vem de
 * `NUMEROS_DO_MAPA_DA_AGENDA`, medido por 05-01 e conferido a cada build.
 *
 * Esta rota fica em `(app)` e RECEBE a barra de abas.
 */
export default function PaginaAgendaNaoEncontrada() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  return <SemResultado beco={montarBeco(indice, "agenda-nao-encontrada")} indice={indice} />;
}
