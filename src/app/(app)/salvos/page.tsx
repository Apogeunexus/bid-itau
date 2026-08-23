import { Comentario } from "@/componentes/comentario";
import { Salvos } from "@/componentes/salvos";
import { DATA_DE_REFERENCIA, alteracoes, parDeDemonstracao } from "@/dados/alerta";
import { indiceDeSalvaveis } from "@/dados/repertorio";

/**
 * /salvos — Salvos e alertas (AGEN-03, `docs/telas.md` tela 23). **Cenário 4 do RFP.**
 *
 * COMPONENTE DE SERVIDOR. As três leituras do acervo rodam AQUI, no build (DP-F):
 * `indiceDeSalvaveis` varre os 129 eventos com sessão, `alteracoes` resolve as duas
 * alterações autoradas contra `ocorrenciasDe`, e `parDeDemonstracao` confere o par no
 * dado. As três passam por `grafo.ts`, que carrega 23 MB de JSON e não atravessa a
 * fronteira do cliente. O que vai para `<Salvos>` são DTOs de primitivo.
 *
 * O ÍNDICE É O MESMO DE MEU REPERTÓRIO, importado e não reescrito. Duas implementações da
 * mesma regra de chave é o jeito clássico de o salvo sumir de uma tela e aparecer na
 * outra — o prefixo comum viaja dentro do índice justamente para as duas pontas usarem a
 * mesma regra sem abrir a fronteira RSC.
 *
 * `parDeDemonstracao` RODA NO MÓDULO, e não dentro do componente, de propósito: se a
 * constante do par deixar de casar com o grafo, o BUILD quebra com mensagem nomeada em vez
 * de a tela renderizar sem semeadura e o roteiro da banca falhar ao vivo.
 */
const indice = indiceDeSalvaveis();
const lista = alteracoes({ hoje: DATA_DE_REFERENCIA });
const par = parDeDemonstracao({ hoje: DATA_DE_REFERENCIA });

export default function PaginaSalvos() {
  return (
    <div className="flex flex-col gap-4 p-5 desk:mx-auto desk:max-w-3xl desk:p-8">
      {/* Fala SOBRE a tela — o que ela prova e por que ela existe no roteiro. Quem usa o
          app recebe a mesma ideia em produto no cabeçalho de `<Salvos>` e na frase que
          fecha o alerta, as duas escritas na segunda pessoa. */}
      <Comentario className="max-w-prose text-sm leading-snug text-tinta-2">
        Esta é a metade-app do cenário 4. Ela só funciona porque evento, temporada e
        ocorrência são registros próprios (DADO-02): a alteração atinge uma ocorrência, o
        evento continua válido, e o aviso tem a quem ser endereçado. Num modelo de catálogo,
        com as datas aninhadas dentro do evento, o alerta só poderia ser do evento inteiro.
        A outra metade — o produtor publicando a mudança — é o Studio da fase 4.
      </Comentario>

      <Salvos indice={indice} alteracoes={lista} par={par} hoje={DATA_DE_REFERENCIA} />
    </div>
  );
}
