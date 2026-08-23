import { MenuLateral } from "@/componentes/menu-lateral";

/**
 * Layout do grupo de rotas do app. Grupo com parênteses não entra na URL — `/descobrir`
 * continua sendo `/descobrir` — então é aqui que a navegação passa a existir para
 * todas as telas do app sem se repetir em nenhuma página.
 *
 * Desde a reformulação do design system (2026-08) a navegação é o MENU LATERAL nas
 * duas visões — decisão do cliente; a barra de abas foi aposentada. Na web o menu é
 * um trilho permanente à esquerda e este contêiner vira linha (`desk:flex-row`); no
 * app ele é cabeçalho fino + gaveta sobreposta, e a coluna continua. Um componente
 * só, divergência por CSS sob `[data-view]` (D-02, D-05).
 *
 * `min-h-full` amarra a coluna à altura de `.moldura-rolagem`, o contêiner de
 * rolagem da visão app.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col desk:flex-row">
      <MenuLateral />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
