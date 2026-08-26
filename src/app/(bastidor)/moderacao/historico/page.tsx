import { ModeracaoHistorico } from "@/componentes/moderacao-historico";
import {
  ACOES_DA_MODERACAO,
  CARIMBO_DA_DECISAO,
  DESTINOS_DA_ACAO,
  ESCOPOS_DE_CURADORIA,
  MODERADOR_AUTORADO,
  O_HISTORICO_E_DO_MODERADOR,
  ORIGENS_DECLARADAS,
  POR_QUE_O_VETO_SEPARADO,
} from "@/dados/moderacao";

/**
 * Moderação — meu histórico (M9, funcionalidade 121).
 *
 * PÁGINA DE SERVIDOR, e a mais leve das três: ela **não manda a fila**. O histórico é sobre
 * as decisões, e as decisões vivem no armazém do cliente — mandar os 68 itens junto seria
 * pagar 53 KB de DTO para exibir uma lista que o navegador já tem. O que atravessa daqui
 * são os vocabulários declarados (ações, origens, escopos, destinos) e as duas frases de
 * produto, todos constantes de módulo.
 *
 * O CARIMBO SAI DAQUI, derivado da data de referência do build. Ler o relógio no cliente
 * faria o HTML exportado divergir da página hidratada e exporia o fuso de quem avalia — e,
 * pior num histórico, produziria carimbos diferentes a cada recarregamento sobre decisões
 * que não mudaram.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoHistorico() {
  return (
    <ModeracaoHistorico
      acoes={ACOES_DA_MODERACAO}
      origens={ORIGENS_DECLARADAS}
      escopos={ESCOPOS_DE_CURADORIA}
      destinos={DESTINOS_DA_ACAO}
      oHistoricoEDoModerador={O_HISTORICO_E_DO_MODERADOR}
      porQueOVetoSeparado={POR_QUE_O_VETO_SEPARADO}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
    />
  );
}
