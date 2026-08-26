import { Grafismo } from "@/componentes/grafismo";
import { StudioRevisar } from "@/componentes/studio-revisar";
import { SITUACAO_E_AUTORADA, catalogoDeEspacos, rascunhosSemeados } from "@/dados/mock/seed";
import { numerosDoAcervo } from "@/dados/ocorrencias-studio";
import { numerosDoElenco } from "@/dados/mock/seed";
import metaJson from "@/dados/gerado/meta.json";
import type { MetaGrafo } from "@/dados/tipos";

/**
 * Studio — P8 · revisão e envio. **O fecho da jornada.**
 *
 * Página de SERVIDOR. Lê o grafo no build e passa DTOs só de primitivo (DP-F).
 *
 * OS NÚMEROS DO «ANTES» VÊM DE `numerosDoAcervo()`, medidos sobre o grafo. É o quadro de
 * conversão que carrega o argumento da proposta, e um literal digitado nele faria a
 * apresentação afirmar, na primeira regeração, número que o acervo não sustenta — na tela
 * onde isso seria mais visível.
 *
 * A ROTA DA MODERAÇÃO É CONSTANTE NOMEADA e não um caminho espalhado pelo componente: ela é
 * o outro lado da porta, construído pela S3, e é ela que o histórico grava em
 * `rotaDoOutroLado` — o mesmo campo que a tela de ocorrências já usa para levar de volta ao
 * lado de quem recebe.
 */

/** Onde a decisão continua. A fila da moderação é da S3. */
const ROTA_DA_MODERACAO = "/moderacao/fila/";

export default function StudioRevisarPagina() {
  const n = numerosDoAcervo();
  const elenco = numerosDoElenco();
  const meta = metaJson as MetaGrafo;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Revisão e envio</h1>
        </div>
        <p className="studio-objetivo">
          Campo a campo, na ordem da ontologia, o que os sete atos anteriores escreveram — e
          o que este envio converte. Depois de enviado, a próxima palavra é da moderação, e
          a tela diz para onde foi e quem decide.
        </p>
      </header>

      <StudioRevisar
        catalogo={catalogoDeEspacos()}
        semente={rascunhosSemeados()}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
        numeros={{
          ocorrencias: n.ocorrencias,
          ocorrenciasComEspaco: n.ocorrenciasComEspaco,
          eventos: n.eventos,
          eventosQueDeclaramIngresso: n.eventosQueDeclaramIngresso,
          eventosDatados: elenco.eventosDatados,
          datadosComArtista: elenco.datadosComArtista,
          registrosSemFicha: meta.fichaDeAcessibilidade.naoDeclaram,
        }}
        rotaDaModeracao={ROTA_DA_MODERACAO}
      />
    </div>
  );
}
