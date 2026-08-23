import { NavegacaoPrincipal } from "@/componentes/navegacao-principal";

/**
 * Layout do grupo de rotas do app. Grupo com parênteses não entra na URL — `/descobrir`
 * continua sendo `/descobrir` — então é aqui que a navegação passa a existir para
 * todas as telas do app sem se repetir em nenhuma página.
 *
 * Na web a navegação é o MENU LATERAL, trilho permanente à esquerda, e este contêiner
 * vira linha (`desk:flex-row`). No app é a BARRA INFERIOR, com o quinto botão abrindo
 * `/apps`. Quem escolhe entre as duas é `NavegacaoPrincipal`, a fronteira de cliente
 * que este layout de servidor não pode ser.
 *
 * `min-h-full` amarra a coluna à altura de `.moldura-rolagem`, o contêiner de
 * rolagem da visão app.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col desk:flex-row">
      <NavegacaoPrincipal />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
