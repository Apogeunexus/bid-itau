import { BarraAbas } from "@/componentes/barra-abas";

/**
 * Layout do grupo de rotas do app. Grupo com parênteses não entra na URL — `/descobrir`
 * continua sendo `/descobrir` — então é aqui que a barra de abas passa a existir para
 * todas as telas do app sem se repetir em nenhuma página.
 *
 * A ordem visual da barra troca por `order`, no próprio componente da barra: na visão
 * app ela é o segundo item da coluna (pé), na visão web o primeiro (topo). O DOM tem
 * uma ordem só; quem diverge é o layout, e o gatilho é sempre `data-view` (D-02).
 *
 * `min-h-full` amarra esta coluna à altura da moldura de celular, que tem altura
 * definida e rola por dentro. É isso que faz a barra `sticky` grudar no pé do telefone
 * em vez de escapar para a janela.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <BarraAbas />
      <main className="flex-1 app:order-1 desk:order-2">{children}</main>
    </div>
  );
}
