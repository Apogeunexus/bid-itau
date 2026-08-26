import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import { RedacaoTrilha } from "@/componentes/redacao-trilha";
import {
  CARIMBO_DA_DECISAO,
  CURADOR_AUTORADO,
  DATA_DE_REFERENCIA_DA_REDACAO,
  LIMITES_DA_IA,
  REGRA_DA_SUGESTAO,
  REGRA_DO_DESTINO,
  REGRA_DO_MOTIVO_OBRIGATORIO,
  catalogoParaArrastar,
  slugDaTrilhaDoEditor,
  sugestaoDeProximoPasso,
  trilhaParaEditor,
} from "@/dados/redacao";

/**
 * Redação — editor de trilha curada (tela 35, WEB-06). **Onde D-85 vira mecânica.**
 *
 * PÁGINA DE SERVIDOR, e é ela que toca `@/dados/redacao` por valor, no build. O componente
 * de cliente recebe DTOs de primitivo e importa aquele módulo apenas por tipo (DP-F).
 *
 * O MOTIVO QUE ESTA PÁGINA ENTREGA É O MESMO OBJETO QUE `/trilha/[slug]/` ENTREGA.
 * `trilhaParaEditor` → `passosParaEditor` → `trilhaCompletaPorSlug` → `passosDaTrilha`, de
 * `trilha.ts` — a MESMA travessia que a tela pública lê. Não há segunda cópia do texto em
 * lugar nenhum deste caminho, e é por isso, e não por disciplina de quem escreve, que o
 * campo do editor e o selo público batem caractere a caractere (D-85). 05-08 compara os
 * dois; o que garante o resultado é a ausência da cópia, não o gate.
 *
 * O SLUG É FIXO POR REGRA, não sorteado: `slugDaTrilhaDoEditor()` devolve a primeira trilha
 * do grafo e QUEBRA ALTO se não houver nenhuma. Um editor que abre vazio quando a fonte
 * mudou por baixo é pior do que um build que não compila.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoTrilha() {
  const slug = slugDaTrilhaDoEditor();

  return (
    <>
      <RedacaoNavegacao atual="/redacao/trilha/" />
      <RedacaoTrilha
        trilha={trilhaParaEditor(slug)}
        catalogo={catalogoParaArrastar()}
        sugestao={sugestaoDeProximoPasso(slug)}
        limites={LIMITES_DA_IA}
        curador={CURADOR_AUTORADO}
        carimbo={CARIMBO_DA_DECISAO}
        dataDeReferencia={DATA_DE_REFERENCIA_DA_REDACAO}
        regraDoMotivoObrigatorio={REGRA_DO_MOTIVO_OBRIGATORIO}
        regraDaSugestao={REGRA_DA_SUGESTAO}
        regraDoDestino={REGRA_DO_DESTINO}
      />
    </>
  );
}
