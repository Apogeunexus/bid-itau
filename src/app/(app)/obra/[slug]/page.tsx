import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { BlocoPonte } from "@/componentes/ponte";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { vinculosDe } from "@/dados/ponte";

/**
 * Página da obra — tela 15, entregue na reformulação de 2026-08 (Parte 6 do
 * feedback do cliente). O MOLDE É O DA PÁGINA DO ARTISTA: identidade + selos +
 * verbete embutido + os vínculos como arestas nomeadas do grafo, cada grupo com a
 * contagem à vista.
 *
 * O QUE O GRAFO NÃO SUSTENTA FICA DECLARADO: medido, não existe nenhuma aresta
 * ligando obra a pessoa — autoria não é dado do acervo exportado, e a página diz
 * isso em vez de inferir do título ou esconder o bloco.
 */

/** Reserva para classe vazia — mesmo contrato da página do artista. */
export function generateStaticParams() {
  const slugs = slugsPorTipo("obra");
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

function Cabecalho({ nome, objetivo }: { nome: string; objetivo: string }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{nome}</h1>
        <span className="ml-auto shrink-0 rounded-full border border-black/15 px-2 py-0.5 text-xs font-semibold text-black/50">
          C3
        </span>
      </div>
      <p className="max-w-prose text-sm text-black/60">{objetivo}</p>
    </header>
  );
}

export default async function PaginaObra({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("obra", slug);

  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
        <Cabecalho
          nome="Página da obra"
          objetivo="A rota existe e responde; nenhuma obra do acervo corresponde a este endereço."
        />
      </div>
    );
  }

  const grupos = vinculosDe(entidade.id);

  return (
    <div className="flex flex-col gap-6 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
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
            {entidade.resumo ? (
              <p className="max-w-prose text-sm leading-snug text-black/70">{entidade.resumo}</p>
            ) : null}
            <p className="text-[0.65rem] tracking-widest text-black/45 uppercase">
              {entidade.classe} · procedência {entidade.procedencia}
            </p>
          </div>
        </div>

        {entidade.linguagens.length ? (
          <SelosDeLinguagem ids={entidade.linguagens} />
        ) : (
          <p className="text-xs text-black/50">
            Nenhuma linguagem artística declarada para esta obra no acervo.
          </p>
        )}
      </header>

      {/* O verbete, embutido, com crédito e link de procedência (D-39). */}
      <Verbete entidade={entidade} />

      {/* OS VÍNCULOS, grupo a grupo, como o grafo os declara — cada um com contagem. */}
      {grupos.length ? (
        grupos.map((grupo) => <BlocoPonte key={grupo.chave} grupo={grupo} />)
      ) : (
        <p className="text-sm leading-snug text-black/60" data-vinculos="0">
          O acervo não declara nenhum vínculo partindo desta obra — nem evento que a
          apresente, nem conteúdo que fale dela.
        </p>
      )}

      {/* A AUSÊNCIA QUE DEFINE A CLASSE, declarada como produto: autoria. */}
      <section className="rounded-g border border-borda bg-superficie-2 p-4">
        <h2 className="tipo-detalhe font-bold">Autoria</h2>
        <p className="max-w-prose text-sm leading-snug text-black/70">
          O acervo exportado não liga nenhuma obra a uma pessoa — não existe aresta de
          autoria no grafo, e por isso esta página não atribui a obra a ninguém.
          Inferir o autor do título seria inventar um fato em nome do Itaú Cultural.
        </p>
        <Comentario className="pt-1 text-xs leading-snug text-black/55">
          Medido sobre as arestas do grafo: zero ligações obra↔pessoa em toda a classe. A
          Enciclopédia tem a autoria em prosa no verbete acima, quando o verbete existe —
          transcrita da fonte, nunca estruturada por nós.
        </Comentario>
      </section>

      <p className="border-t border-black/10 pt-3 text-xs leading-relaxed text-black/45">
        Todo vínculo desta página é uma aresta do grafo do acervo. Onde há ausência
        declarada, é o registro do Itaú Cultural que não publica o dado — nada foi
        preenchido no lugar dele.
      </p>
    </div>
  );
}
