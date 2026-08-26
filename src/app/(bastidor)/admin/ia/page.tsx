import { AdminIa } from "@/componentes/admin-ia";

/**
 * `/admin/ia` — A5, os limites da IA.
 *
 * A página não passa dado: a lista de limites e a régua do score são constantes do módulo
 * de dados, e o que a tela acrescenta vive na trilha. O componente é cliente por causa da
 * trilha, e por nada mais.
 */
export const metadata = {
  title: "Limites da IA · Admin",
  description:
    "O que a máquina não pode fazer por mais que o grafo alcance — e por que não existe " +
    "nesta tela um controle de publicar direto.",
};

export default function PaginaDaIa() {
  return <AdminIa />;
}
