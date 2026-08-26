import { ModeracaoEscopo } from "@/componentes/moderacao-escopo";
import {
  ESCALONAMENTOS,
  ESCOPOS_DE_CURADORIA,
  MODERADOR_AUTORADO,
  ORDENACOES_DA_FILA,
  REGRA_DA_DELEGACAO,
  concentracaoDoAcervo,
  delegacoesDeExemplo,
  filaDaModeracao,
} from "@/dados/moderacao";

/**
 * Moderação — escopo e escalonamento (M8; funcionalidades 122 a 125). **O que era a S4.**
 *
 * PÁGINA DE SERVIDOR. A concentração vem de `concentracaoDoAcervo()`, que lê
 * `densidadePorUf()` — a mesma travessia que alimenta o Observatório. Nenhum dos números
 * desta tela é digitado: se o grafo mudar, eles mudam, e um número escrito à mão passaria a
 * mentir na primeira regeração.
 *
 * A FILA VAI JUNTO porque a cobertura é medida SOBRE ELA, e não sobre o acervo. A pergunta
 * que esta tela responde não é «quanto o acervo tem no Pará», é «quanto da MINHA FILA está
 * no Pará, e quanto do acervo sustenta isso» — as duas juntas são o que torna a prioridade
 * por vazio conferível.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoEscopo() {
  return (
    <ModeracaoEscopo
      fila={filaDaModeracao()}
      escopos={ESCOPOS_DE_CURADORIA}
      ordenacoes={ORDENACOES_DA_FILA}
      concentracao={concentracaoDoAcervo()}
      escalonamentos={ESCALONAMENTOS}
      delegacoes={delegacoesDeExemplo()}
      regraDaDelegacao={REGRA_DA_DELEGACAO}
      moderador={MODERADOR_AUTORADO}
    />
  );
}
