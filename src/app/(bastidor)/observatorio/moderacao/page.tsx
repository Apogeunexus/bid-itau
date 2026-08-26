import { ObservatorioModeracao } from "@/componentes/observatorio-moderacao";
import { TELAS, aferirDto, montarLeituraDaModeracao } from "@/dados/observatorio";

/**
 * `/observatorio/moderacao` — G8, a leitura da moderação (funcionalidade 169).
 *
 * PÁGINA DE SERVIDOR, e é a fronteira que define o que esta tela pode dizer: as decisões da
 * Moderação são gravadas no navegador de quem decide, e o build não alcança `localStorage`
 * nenhum. O que ela mede é a composição da fila; o que ela não mede está declarado, com a
 * causa de cada ausência — que são três causas diferentes.
 *
 * NENHUM NOME DE MODERADOR ATRAVESSA. O DTO não tem campo para isso, e é assim de propósito:
 * a anonimização não é uma escolha da tela, é uma propriedade do que chega até ela.
 */
export default function PaginaLeituraDaModeracao() {
  const tela = TELAS.find((t) => t.id === "moderacao");
  if (!tela) throw new Error("observatorio: a tela «moderacao» sumiu de TELAS.");

  const dados = montarLeituraDaModeracao();
  aferirDto("moderacao", { dados, telas: TELAS });

  return <ObservatorioModeracao dados={dados} tela={tela} telas={TELAS} />;
}
