import { AdminModeracao } from "@/componentes/admin-moderacao";
import { aferirDto, medidasDaModeracao } from "@/dados/admin";

/**
 * `/admin/moderacao` — A10, o desempenho da moderação por escopo.
 *
 * PÁGINA DE SERVIDOR. As cinco medidas atravessam o módulo da Moderação e a densidade
 * territorial para dizer, de cada uma, o que existe hoje e o que falta para ela fechar.
 * Nenhuma fecha, e é isso que a tela declara.
 */
export const metadata = {
  title: "Desempenho da moderação · Admin",
  description:
    "As cinco medidas da moderação por escopo, com o que existe hoje e o que falta para " +
    "cada uma fechar — e o recorte que separa auditoria de vigilância.",
};

export default function PaginaDeDesempenho() {
  return <AdminModeracao medidas={aferirDto("admin/moderacao", medidasDaModeracao())} />;
}
