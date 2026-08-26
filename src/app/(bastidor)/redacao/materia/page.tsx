import { RedacaoMateria } from "@/componentes/redacao-materia";
import { RedacaoNavegacao } from "@/componentes/redacao-navegacao";
import {
  CARIMBO_DA_DECISAO,
  CURADOR_AUTORADO,
  DATA_DE_REFERENCIA_DA_REDACAO,
  FORMATOS_EDITORIAIS,
  FRONTEIRA_DA_ENCICLOPEDIA,
  MOVIMENTO_E_TERMO,
  NUMEROS_DO_CONHECIMENTO,
  REGRA_DO_CREDITO,
  RELACOES_EDITORIAIS,
  catalogoParaArrastar,
} from "@/dados/redacao";

/**
 * Redação — a redação editorial (E5). **As classes de conhecimento.**
 *
 * PÁGINA DE SERVIDOR. O catálogo é o MESMO objeto das outras telas da Redação —
 * `catalogoParaArrastar` é memorizado e o recorte é um só —, e é dele que saem as entidades
 * a que a matéria se liga. As ligações escolhem entidade REAL do acervo, e não assunto
 * digitado: é essa diferença que faz «Aprofunda isto» funcionar a partir de qualquer evento.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaRedacaoMateria() {
  return (
    <>
      <RedacaoNavegacao atual="/redacao/materia/" />
      <RedacaoMateria
        catalogo={catalogoParaArrastar()}
        formatos={FORMATOS_EDITORIAIS}
        relacoes={RELACOES_EDITORIAIS}
        numeros={NUMEROS_DO_CONHECIMENTO}
        curador={CURADOR_AUTORADO}
        carimbo={CARIMBO_DA_DECISAO}
        dataDeReferencia={DATA_DE_REFERENCIA_DA_REDACAO}
        fronteiraDaEnciclopedia={FRONTEIRA_DA_ENCICLOPEDIA}
        movimentoEhTermo={MOVIMENTO_E_TERMO}
        regraDoCredito={REGRA_DO_CREDITO}
      />
    </>
  );
}
