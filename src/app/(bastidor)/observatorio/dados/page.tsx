import { ObservatorioDados } from "@/componentes/observatorio-dados";
import { TELAS, aferirDto, montarDadosAbertos } from "@/dados/observatorio";

/**
 * `/observatorio/dados` — G7, exportação versionada e dados abertos (funcionalidade 107).
 *
 * PÁGINA DE SERVIDOR. Os três recortes são montados no build a partir dos mesmos números
 * que as outras telas exibem — não há um segundo cálculo para a exportação, e é de propósito:
 * um recorte exportável que se calculasse sozinho seria a fonte mais fácil de divergir da
 * tela, e ninguém compararia os dois até alguém de fora reclamar.
 */
export default function PaginaDados() {
  const tela = TELAS.find((t) => t.id === "dados");
  if (!tela) throw new Error("observatorio: a tela «dados» sumiu de TELAS.");

  const dados = montarDadosAbertos();
  aferirDto("dados", { dados, telas: TELAS });

  return <ObservatorioDados dados={dados} tela={tela} telas={TELAS} />;
}
