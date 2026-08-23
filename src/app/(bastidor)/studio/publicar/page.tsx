import { Grafismo } from "@/componentes/grafismo";
import { Comentario } from "@/componentes/comentario";
import { FormularioPublicar, type EventoExistente } from "@/componentes/studio-publicar";
import { CRITERIO_DE_IDENTIDADE } from "@/dados/duplicatas";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { normalizar } from "@/dados/indice";

/**
 * Studio — publicar evento (tela 33, entregue na reformulação de 2026-08).
 *
 * COMPONENTE DE SERVIDOR: varre os eventos reais do grafo no build e passa ao
 * formulário só primitivos — slug, título e título normalizado (a MESMA
 * normalização do índice de busca). É contra essa lista que o aviso de
 * duplicata dispara ANTES de salvar, citando o critério de identidade de
 * `duplicatas.ts` — o mesmo que a fila de duplicatas usa.
 */
export default function StudioPublicar() {
  const eventos: EventoExistente[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e) eventos.push({ slug: e.slug, titulo: e.titulo, normalizado: normalizar(e.titulo) });
  }
  eventos.sort((a, b) => (a.slug < b.slug ? -1 : 1));

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">
            Studio — publicar evento
          </h1>
          <span className="ml-auto shrink-0 rounded-full border border-borda px-2 py-0.5 text-xs font-semibold text-tinta-3">
            C3
          </span>
        </div>
        <p className="max-w-prose text-sm leading-snug">
          O cadastro com devolutiva de qualidade: o score sobe conforme se preenche, a
          duplicata avisa antes de salvar, e a descrição alternativa de imagem é
          obrigatória.
        </p>
        <Comentario className="max-w-prose text-sm leading-snug text-tinta-2">
          A checagem de duplicata roda contra os {eventos.length} eventos reais do grafo,
          com a normalização do índice de busca — digite «Bienal» no título para vê-la
          disparar. Publicar não persiste: o protótipo é estático, e o registro que seria
          enviado aparece na tela com o limite declarado.
        </Comentario>
      </header>

      <FormularioPublicar eventos={eventos} criterioDeIdentidade={CRITERIO_DE_IDENTIDADE} />
    </div>
  );
}
