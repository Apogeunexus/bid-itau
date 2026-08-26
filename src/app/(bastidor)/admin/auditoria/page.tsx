import { AdminAuditoria } from "@/componentes/admin-auditoria";

/**
 * `/admin/auditoria` — A7, a trilha de auditoria.
 *
 * A ÚNICA PÁGINA DO ADMIN QUE NÃO PASSA DADO NENHUM PARA O COMPONENTE, e o motivo é o
 * assunto dela: a trilha não vem do build, vem do que foi escrito nesta superfície. No
 * protótipo isso mora no armazenamento do navegador; num sistema real, no servidor. Nos dois
 * casos, o que a página NÃO faz é o mesmo — não filtra, não recorta, não decide o que a
 * auditoria pode ver.
 */
export const metadata = {
  title: "Trilha de auditoria · Admin",
  description:
    "Toda escrita da superfície de governança, com autor, carimbo, ação e motivo. A única " +
    "tela do painel sem nenhuma ação de escrita.",
};

export default function PaginaDeAuditoria() {
  return <AdminAuditoria />;
}
