import { ObservatorioAusencia } from "@/componentes/observatorio-ausencia";
import { TELAS, aferirDto, ausenciasDeclaradas } from "@/dados/observatorio";

/**
 * `/observatorio/ausencia` — G6, a ausência declarada com denominador (funcionalidade 106).
 *
 * PÁGINA DE SERVIDOR. Cada ausência é MEDIDA no build — a varredura das entidades por
 * classe, `ocorrenciasDe()` sobre os eventos com sessão, `vizinhos(evento, "atua_em")` e as
 * contagens de `meta.json`. Nenhum dos oito números é literal, e é por isso que a tela
 * continua verdadeira depois da próxima geração do grafo: se um buraco for preenchido, o
 * número cai sozinho.
 */
export default function PaginaAusencia() {
  const tela = TELAS.find((t) => t.id === "ausencia");
  if (!tela) throw new Error("observatorio: a tela «ausencia» sumiu de TELAS.");

  const ausencias = ausenciasDeclaradas();
  aferirDto("ausencia", { ausencias, telas: TELAS });

  return <ObservatorioAusencia ausencias={ausencias} tela={tela} telas={TELAS} />;
}
