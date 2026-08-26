import { Grafismo } from "@/componentes/grafismo";
import { StudioElenco } from "@/componentes/studio-elenco";
import {
  SITUACAO_E_AUTORADA,
  catalogoDoElenco,
  numerosDoElenco,
  papeisDoAcervo,
  rascunhosSemeados,
} from "@/dados/mock/seed";

/**
 * Studio — P3 · obra e elenco. **A ponte entre a agenda e a Enciclopédia.**
 *
 * Página de SERVIDOR. Ela lê o grafo no build e passa DTOs só de primitivo; o componente de
 * cliente importa o módulo apenas por tipo (DP-F). O catálogo daqui é o mais pesado das
 * telas da jornada — 792 agentes e 239 obras com verbete cortado, 116 KB — e vai inteiro de
 * propósito: a busca precisa responder sem navegar, e uma rota por agente geraria mais de
 * mil páginas.
 *
 * OS PAPÉIS VÊM DAS ARESTAS, não de uma lista escrita à mão. As 508 `atua_em` existentes
 * trazem `papel` obrigatório, e são elas que dizem que vocabulário o acervo de fato usa —
 * três papéis, «artista» em 312 delas. Uma lista digitada aqui ofereceria categorias que
 * nenhuma aresta sustenta.
 *
 * O NÚMERO QUE JUSTIFICA A TELA É MEDIDO, e a distinção importa: 426 das 508 arestas apontam
 * para `evento`, e **zero para evento datado**. Contar só «evento» levaria à conclusão errada
 * de que a agenda já tem elenco.
 *
 * `AGENTES_NA_BASE_COMPLETA` é o único número desta página que não sai do grafo — ele mede a
 * Enciclopédia inteira, que o protótipo não carrega, e por isso é declarado como constante
 * nomeada em vez de calculado de um dado que não está aqui.
 */

/** As pessoas da Enciclopédia completa, fora do recorte do protótipo. Número da fonte. */
const AGENTES_NA_BASE_COMPLETA = 43_614;

export default function StudioElencoPagina() {
  const n = numerosDoElenco();

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Obra e elenco</h1>
        </div>
        <p className="studio-objetivo">
          A tela que fecha o vão entre a agenda e a Enciclopédia. O grafo tem {n.atuaEm}{" "}
          arestas <span className="studio-literal">atua_em</span>, {n.paraEvento} delas
          apontando para um evento — e nenhuma para um evento datado. Dos{" "}
          {n.eventosDatados} eventos com sessão, {n.datadosComArtista} têm artista vinculado.
        </p>
      </header>

      <StudioElenco
        catalogo={catalogoDoElenco()}
        semente={rascunhosSemeados()}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
        numeros={n}
        papeis={papeisDoAcervo()}
        agentesNaBaseCompleta={AGENTES_NA_BASE_COMPLETA}
      />
    </div>
  );
}
