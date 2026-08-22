import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { BlocoPonte } from "@/componentes/ponte";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { papeisDe, vinculosDe, type GrupoVinculo } from "@/dados/ponte";

/**
 * Página do artista — DESC-05, `docs/telas.md` tela 14, e METADE DE DESC-08.
 *
 * Artista é PAPEL, não classe (DADO-03): o papel mora na aresta `atua_em`, e a mesma
 * pessoa poderia aparecer como artista aqui e como curadora ali. Por isso a rota cobre as
 * duas classes de agente que podem atuar como tal — pessoa e coletivo — e por isso os
 * papéis desta tela são LIDOS DAS ARESTAS (D-41), nunca de um campo do agente.
 *
 * A outra metade de DESC-08 é `/evento/[slug]`. Daqui tem de dar para chegar ao evento em
 * que a pessoa atua, e de lá tem de dar para voltar ao verbete dela. É esse ida-e-volta,
 * mostrado como relação nomeada e não como link solto, que é a tese da proposta.
 *
 * `tela-entidade.tsx` NÃO é tocado: ele continua servindo `/obra` e `/produtor`, que não
 * são desta fase.
 */

/** Reserva para classe vazia. Hoje não é emitida — 792 slugs sem duplicata. */
export function generateStaticParams() {
  const slugs = [...slugsPorTipo("pessoa"), ...slugsPorTipo("coletivo")];
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

function indexar(grupos: GrupoVinculo[]): Map<string, GrupoVinculo> {
  return new Map(grupos.map((g) => [g.chave, g]));
}

function Cabecalho({ nome, objetivo }: { nome: string; objetivo: string }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{nome}</h1>
        <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
          C1
        </span>
      </div>
      <p className="max-w-prose text-sm text-black/60">{objetivo}</p>
    </header>
  );
}

export default async function PaginaArtista({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("pessoa", slug) ?? porSlug("coletivo", slug);

  // Entidade ausente não lança: sob `output: "export"` uma exceção aqui derrubaria o
  // build inteiro por causa de um slug.
  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
        <Cabecalho
          nome="Página do artista"
          objetivo="A rota existe e responde; nenhuma pessoa ou coletivo do acervo corresponde a este endereço."
        />
      </div>
    );
  }

  const grupos = indexar(vinculosDe(entidade.id));
  const papeis = papeisDe(entidade.id);

  const atuaEm = grupos.get("atua-em");
  const realiza = grupos.get("realiza");
  const onde = grupos.get("onde");
  const obras = grupos.get("obras");
  const semelhante = grupos.get("semelhante");
  const dialoga = grupos.get("dialoga");
  const aprofunda = grupos.get("aprofunda");
  const falaSobre = grupos.get("fala-sobre");
  const contextualiza = grupos.get("contextualiza");

  return (
    <div className="flex flex-col gap-6 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      {/* 1 — identidade, imagem e OS PAPÉIS, vindos da aresta ------------------ */}
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <CapaDeCartao
            titulo={entidade.titulo}
            classe={entidade.classe}
            linguagens={entidade.linguagens}
            imagem={entidade.imagem}
            creditoImagem={entidade.creditoImagem}
            className="h-28 w-24 shrink-0 rounded-xl"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl leading-tight font-bold">{entidade.titulo}</h1>

            {/* D-41: cada papel vem de N arestas `atua_em`, e o N está à vista. Nenhum
                papel é inferido de campo do agente — o agente não tem campo de papel. */}
            {papeis.length ? (
              <ul className="flex flex-wrap gap-1.5" data-papeis={papeis.length}>
                {papeis.map((p) => (
                  <li
                    key={p.papel}
                    data-papel={p.papel}
                    className="rounded-full bg-acao px-2.5 py-0.5 text-xs font-bold text-[var(--ic-branco)]"
                  >
                    {`${p.papel} · ${p.contagem} ${p.contagem === 1 ? "vínculo" : "vínculos"}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-papeis="0"
                className="text-xs leading-relaxed text-black/60"
              >
                {/* A frase é produto — declara uma ausência do acervo, da mesma família
                    dos rótulos de procedência. Só o número da decisão sai de cena. */}
                O acervo não atribui nenhum papel a esta entrada: papel é propriedade da
                aresta de atuação<Comentario como="span"> (D-41)</Comentario>, e não há
                nenhuma partindo daqui.
              </p>
            )}

            <p className="text-[0.65rem] tracking-widest text-black/45 uppercase">
              {entidade.classe} · procedência {entidade.procedencia}
            </p>
          </div>
        </div>

        {/* 2 — selos de linguagem, com a cor que veio no dado (D-08) */}
        {entidade.linguagens.length ? (
          <SelosDeLinguagem ids={entidade.linguagens} />
        ) : (
          <p className="text-xs text-black/50">
            Nenhuma linguagem artística declarada para esta entrada no acervo.
          </p>
        )}
      </header>

      {/* 3 — território, com o método da coordenada dito na própria linha */}
      {onde ? <BlocoPonte grupo={onde} rotulo="Território de origem e de atuação" /> : null}

      {/* 4 — O VERBETE, EMBUTIDO (D-39). Nunca «veja na Enciclopédia». */}
      <Verbete entidade={entidade} />

      {/* 5 — EVENTOS EM QUE ATUA. É metade de DESC-08 e é o que o gate mede: o papel
             aparece em cada linha, e cada linha navega para a página do evento. */}
      {atuaEm ? <BlocoPonte grupo={atuaEm} /> : null}
      {realiza ? <BlocoPonte grupo={realiza} /> : null}

      {/* 6 — OBRAS. Medido: não existe no grafo nenhuma aresta ligando obra a pessoa.
             O bloco existe e declara isso, em vez de sumir e fazer parecer que o produto
             não tem a categoria. */}
      {obras ? <BlocoPonte grupo={obras} /> : null}

      {/* 7 — com quem dialoga no grafo, e o conteúdo editorial que fala sobre */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-wide text-black/70 uppercase">
          Com quem dialoga no grafo
        </h2>
        {semelhante ? <BlocoPonte grupo={semelhante} /> : null}
        {dialoga ? <BlocoPonte grupo={dialoga} /> : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-wide text-black/70 uppercase">
          Conteúdo editorial que fala sobre
        </h2>
        {aprofunda ? <BlocoPonte grupo={aprofunda} /> : null}
        {falaSobre ? <BlocoPonte grupo={falaSobre} /> : null}
        {contextualiza ? <BlocoPonte grupo={contextualiza} /> : null}
      </section>

      <p className="border-t border-black/10 pt-3 text-xs leading-relaxed text-black/45">
        Todo vínculo desta página é uma aresta do grafo do acervo, e o papel de cada um vem
        da própria aresta. Onde o bloco declara ausência, é o registro do Itaú Cultural que
        não publica o dado — nada foi preenchido no lugar dele.
      </p>
    </div>
  );
}
