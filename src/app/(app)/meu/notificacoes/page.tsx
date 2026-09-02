import type { Metadata } from "next";
import { Grafismo } from "@/componentes/grafismo";
import { Notificacoes } from "@/componentes/notificacoes";

export const metadata: Metadata = { title: "Avisos — Itaú Cultural" };

/**
 * `/meu/notificacoes` — o que está esperando uma palavra sua.
 *
 * TELA, E NÃO GAVETA. O sino podia abrir um painel sobre o conteúdo, como o avatar fazia
 * antes de virar link. Mas o que mora aqui não é uma lista de rótulos: é uma decisão
 * («recebi» / «não recebi») e, na segunda, um formulário com relato e canal. Isso não
 * cabe numa gaveta de 15rem sem virar um formulário espremido por cima da tela.
 */
export default function PaginaDeNotificacoes() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-3xl desk:p-8">
      <header className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Avisos</h1>
      </header>

      <Notificacoes />
    </div>
  );
}
