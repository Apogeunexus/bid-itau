import { Grafismo } from "@/componentes/grafismo";
import { Guardadas } from "@/componentes/comunidade-guardadas";

export default function PaginaGuardadas() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Guardadas</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          As publicações que você guardou, de todas as comunidades.
        </p>
      </header>

      <Guardadas />
    </div>
  );
}
