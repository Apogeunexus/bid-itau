import { EsqueletoBloco, EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { Entidade } from "@/dados/tipos";

/**
 * tela-entidade.tsx — a casca comum das quatro rotas de entidade (`/evento`, `/artista`,
 * `/obra`, `/produtor`).
 *
 * Nesta fase o conteúdo é esqueleto, mas a entidade É REAL: título, classe, procedência e
 * linguagens vêm do grafo. É o que prova que a rota dinâmica está de fato ligada ao dado, e
 * não apenas exportada.
 *
 * Entidade ausente não lança: renderiza o estado vazio. Sob `output: "export"` uma exceção
 * aqui derrubaria o build inteiro por causa de um slug — e nesta fase a ausência de uma
 * entidade não é erro de programa.
 */
export function TelaEntidade({
  nome,
  objetivo,
  camada,
  entidade,
  blocos,
  classesEsperadas,
}: {
  nome: string;
  objetivo: string;
  camada?: "C1" | "C2" | "C3";
  entidade?: Entidade;
  blocos: string[];
  classesEsperadas: string;
}) {
  if (!entidade) {
    return (
      <TelaEsqueleto nome={nome} objetivo={objetivo} camada={camada}>
        <EsqueletoBloco
          altura="7rem"
          rotulo={`Nenhuma entidade de ${classesEsperadas} foi encontrada para este endereço. A rota existe e responde; o conteúdo aparece quando a classe estiver populada no grafo.`}
        />
      </TelaEsqueleto>
    );
  }

  return (
    <TelaEsqueleto nome={nome} objetivo={objetivo} camada={camada}>
      <section className="flex flex-col gap-3 rounded-xl border border-borda p-4">
        <div className="flex items-start gap-4">
          <EsqueletoBloco altura="6rem" className="w-28 shrink-0" rotulo="imagem do acervo" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-lg leading-tight font-bold">{entidade.titulo}</h2>
            <p className="text-xs text-tinta-3">
              {entidade.classe} · procedência {entidade.procedencia}
            </p>
            {entidade.fonte ? (
              <a
                href={entidade.fonte}
                className="w-fit text-xs font-semibold text-acao-tinta underline underline-offset-2"
                rel="noreferrer"
              >
                fonte no acervo do Itaú Cultural
              </a>
            ) : null}
          </div>
        </div>

        <SelosDeLinguagem ids={entidade.linguagens} />

        {entidade.resumo ? (
          <p className="line-clamp-4 text-sm text-tinta-2">{entidade.resumo}</p>
        ) : null}
      </section>

      <EsqueletoLista rotulos={blocos} />
    </TelaEsqueleto>
  );
}
