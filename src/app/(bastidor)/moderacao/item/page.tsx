import { ModeracaoItem } from "@/componentes/moderacao-item";
import {
  ACOES_DA_MODERACAO,
  CARIMBO_DA_DECISAO,
  COMPONENTES_DA_CHAVE,
  CONFERENCIAS_DA_FICHA,
  ESCOPOS_DE_CURADORIA,
  FRASE_DA_ASSIMETRIA,
  FRASE_DO_BLOQUEIO,
  MODERADOR_AUTORADO,
  MOTIVOS_DE_DENUNCIA,
  ORIGENS_DECLARADAS,
  REGRA_DA_CHAVE,
  filaDaModeracao,
  itemInicialDaFila,
} from "@/dados/moderacao";

/**
 * Moderação — a ficha do item (M2; funcionalidades 109, 110, 114, 115, 118, 119).
 *
 * PÁGINA DE SERVIDOR. É ela, e só ela, que chama `@/dados/moderacao` por valor — no build.
 * O componente de cliente recebe DTOs de primitivo e importa aquele módulo apenas por tipo.
 * É essa fronteira, e nenhuma outra, que impede 23 MB de grafo de atravessar para o
 * navegador (DP-F); um `import` por valor daqui para lá seria invisível no código e mediria
 * 23 MB no artefato.
 *
 * A FILA INTEIRA VAI JUNTO, e é a mesma decisão da tela da fila: 68 itens já achatados em
 * primitivo, medidos contra o teto de 61.440 bytes do plano. É esse achatamento que permite
 * TROCAR DE ITEM SEM TROCAR DE ROTA — a ficha é uma superfície só, servindo um item de cada
 * vez, e quem confere dez registros seguidos não deveria pagar uma navegação por registro.
 *
 * QUAL ITEM ABRE, SOB EXPORT ESTÁTICO. A rota é uma só e o HTML é o mesmo para todos os
 * itens: quem escolhe é o cliente, lendo `?item=` em `useEffect`. Ler a busca no servidor
 * seria impossível aqui — não há servidor em execução —, e lê-la durante a renderização do
 * cliente faria o HTML exportado divergir da página hidratada. `itemInicialDaFila()` é o
 * item em que ela abre quando ninguém pediu nenhum: o de MENOR score da IA, fixado por
 * regra e nunca sorteado, porque é o caso em que a decisão humana mais pesa.
 *
 * Todos os textos longos — a regra da chave, os limites de cada conferência, a frase da
 * assimetria — vêm do MÓDULO e não são escritos no componente: eles citam números medidos
 * sobre o dado, e um literal digitado na tela passaria a afirmar, na primeira regeração do
 * grafo, número que o acervo não sustenta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaModeracaoItem() {
  return (
    <ModeracaoItem
      fila={filaDaModeracao()}
      origens={ORIGENS_DECLARADAS}
      acoes={ACOES_DA_MODERACAO}
      escopos={ESCOPOS_DE_CURADORIA}
      componentesDaChave={COMPONENTES_DA_CHAVE}
      regraDaChave={REGRA_DA_CHAVE}
      conferencias={CONFERENCIAS_DA_FICHA}
      fraseDoBloqueio={FRASE_DO_BLOQUEIO}
      fraseDaAssimetria={FRASE_DA_ASSIMETRIA}
      motivosDeDenuncia={MOTIVOS_DE_DENUNCIA}
      moderador={MODERADOR_AUTORADO}
      carimbo={CARIMBO_DA_DECISAO}
      itemInicial={itemInicialDaFila()}
    />
  );
}
