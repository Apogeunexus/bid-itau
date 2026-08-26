import { ObservatorioProcedencia } from "@/componentes/observatorio-procedencia";
import { TELAS, aferirDto, montarProcedencia } from "@/dados/observatorio";

/**
 * `/observatorio/procedencia` — G5, o painel de procedência estendido (funcionalidade 105).
 *
 * PÁGINA DE SERVIDOR: `montarProcedencia()` chama `painelDeProcedencia()`, e é ele que roda
 * a conferência de três pontas — a varredura própria do grafo, `contagens()` e `meta.json`.
 * Se as três divergirem, esta página não compila, e é a decisão certa: melhor não compilar
 * do que exibir uma procedência que não fecha.
 */
export default function PaginaProcedencia() {
  const tela = TELAS.find((t) => t.id === "procedencia");
  if (!tela) throw new Error("observatorio: a tela «procedencia» sumiu de TELAS.");

  const dados = montarProcedencia();
  aferirDto("procedencia", { dados, telas: TELAS });

  return <ObservatorioProcedencia dados={dados} tela={tela} telas={TELAS} />;
}
