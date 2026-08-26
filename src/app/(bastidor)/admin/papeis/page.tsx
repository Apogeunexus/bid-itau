import { AdminPapeis } from "@/componentes/admin-papeis";
import { aferirDto, matrizDeAutoria, procedenciasDoModelo } from "@/dados/admin";

/**
 * `/admin/papeis` — A1, papéis, escopos e o vocabulário de procedência.
 *
 * PÁGINA DE SERVIDOR. A matriz de autoria e as fatias de procedência trazem a contagem VIVA
 * do acervo: a tabela não é uma cópia do documento de ontologia, é o documento conferido
 * contra o `meta.json` a cada build. Se uma classe deixar de existir, a linha dela mostra
 * zero em vez de continuar afirmando o número de ontem.
 */
export const metadata = {
  title: "Papéis e escopos · Admin",
  description:
    "Os oito níveis de acesso como vocabulário de procedência: conceder um papel é " +
    "autorizar alguém a produzir um valor de carimbo.",
};

export default function PaginaDePapeis() {
  return (
    <AdminPapeis
      dados={aferirDto("admin/papeis", {
        procedencias: procedenciasDoModelo(),
        matriz: matrizDeAutoria(),
      })}
    />
  );
}
