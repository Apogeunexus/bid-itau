import { ModeracaoElenco } from "@/componentes/moderacao-elenco";
import {
  CARIMBO_DA_DECISAO,
  FRASE_DO_ELENCO,
  MODERADOR_AUTORADO,
  POR_QUE_NAO_AUTORAMOS_ELENCO,
  elencoParaConferir,
} from "@/dados/moderacao";

/**
 * Moderação — elenco declarado (M5, funcionalidade 116). **A barreira ética do sistema.**
 *
 * PÁGINA DE SERVIDOR. Os vínculos saem das 508 arestas `atua_em` do acervo, com os papéis
 * que ele declara — nada de elenco é autorado aqui, e a recusa é o ponto: escrever que uma
 * pessoa real participou de um evento é uma afirmação factual, e uma afirmação factual
 * inventada sobre alguém não deixa de ser falsa por estar num protótipo.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoElenco() {
  return (
    <ModeracaoElenco
      vinculos={elencoParaConferir()}
      fraseDoElenco={FRASE_DO_ELENCO}
      porQueNaoAutoramos={POR_QUE_NAO_AUTORAMOS_ELENCO}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
    />
  );
}
