import { AdminGovernanca } from "@/componentes/admin-governanca";

/**
 * `/admin/governanca` — A9, os quatro poderes operacionais.
 *
 * Página e componente de servidor, sem dado do acervo: os quatro poderes são declarações
 * sobre o produto, não medições sobre o grafo.
 */
export const metadata = {
  title: "Governança operacional · Admin",
  description:
    "Suspender sem apagar, chaves de integração, envio em massa e o estado das " +
    "superfícies — cada um com o que o torna perigoso.",
};

export default function PaginaDeGovernanca() {
  return <AdminGovernanca />;
}
