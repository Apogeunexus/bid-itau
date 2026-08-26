import { AdminObservabilidade } from "@/componentes/admin-observabilidade";
import { aferirDto, observabilidadeDoAdmin } from "@/dados/admin";

/**
 * `/admin/observabilidade` — A6, procedência, cobertura e frescor.
 *
 * Página e componente são os DOIS de servidor: esta tela não tem estado, não escreve e não
 * lê armazenamento. Zero JavaScript vai ao navegador por causa dela.
 */
export const metadata = {
  title: "Observabilidade · Admin",
  description:
    "De onde vem cada fatia do acervo, o que está coberto com denominador, e se as três " +
    "contagens independentes do sistema concordam entre si.",
};

export default function PaginaDeObservabilidade() {
  return <AdminObservabilidade dados={aferirDto("admin/observabilidade", observabilidadeDoAdmin())} />;
}
