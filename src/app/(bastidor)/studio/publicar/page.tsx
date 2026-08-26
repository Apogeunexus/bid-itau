import { Grafismo } from "@/componentes/grafismo";
import { FormularioPublicar } from "@/componentes/studio-publicar";
import { COMPONENTES_DO_CRITERIO, CRITERIO_DE_IDENTIDADE } from "@/dados/duplicatas";
import {
  PRODUTOR_E_AUTORADO,
  SITUACAO_E_AUTORADA,
  catalogoDeIdentidade,
  rascunhosSemeados,
} from "@/dados/mock/seed";

/**
 * Studio — P2 · identidade do evento. **A primeira tela da jornada do produtor.**
 *
 * Página de SERVIDOR. É ela quem chama `@/dados/mock/seed` e `@/dados/duplicatas` por
 * valor, no build, e passa adiante DTOs só de primitivo. O formulário importa os dois
 * módulos apenas por tipo — é essa fronteira, e só ela, que impede 23 MB de grafo de
 * atravessar (DP-F).
 *
 * O CATÁLOGO QUE VAI DAQUI É O ESTREITO, e é decisão e não descuido. `catalogoDoStudio()`
 * inteiro tem 200 KB porque carrega 792 agentes e 239 obras para a busca de elenco, que é
 * outra tela. Esta leva 65 KB: o vocabulário, os 300 eventos contra os quais a duplicata
 * dispara, e as 12 imagens com crédito. Mandar o catálogo inteiro em toda tela seria pagar
 * cinco vezes o peso por dado que a tela não lê.
 *
 * O CRITÉRIO E OS TRÊS COMPONENTES VÊM DO MÓDULO, não escritos aqui: eles citam números
 * medidos sobre o dado, e um literal digitado na tela faria a apresentação afirmar, na
 * primeira regeração do grafo, número que o acervo não sustenta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function StudioPublicar() {
  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Identidade do evento</h1>
        </div>
        <p className="studio-objetivo">
          A chave de identidade antes de qualquer outra coisa: título normalizado, agente
          realizador e obra. É ela que faz duas linhas serem a mesma coisa no mundo — e é
          por isso que temporada e sessão só existem depois dela.
        </p>
      </header>

      <FormularioPublicar
        catalogo={catalogoDeIdentidade()}
        semente={rascunhosSemeados()}
        criterioDeIdentidade={CRITERIO_DE_IDENTIDADE}
        componentesNoAcervo={COMPONENTES_DO_CRITERIO}
        produtorEAutorado={PRODUTOR_E_AUTORADO}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
      />
    </div>
  );
}
