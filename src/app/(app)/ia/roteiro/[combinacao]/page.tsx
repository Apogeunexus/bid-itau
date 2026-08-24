import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ICONE_IA,
  ICONE_MAPA,
  ICONE_SETA,
} from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import {
  AvisoDaCompanhia,
  LinkDaCombinacao,
  RecadoDoPedido,
  SalvarRoteiro,
} from "@/componentes/entrevista-estrelinha";
import { Grafismo } from "@/componentes/grafismo";
import { MapaDoDia } from "@/componentes/mapa-do-dia";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import {
  combinacoesDaEstrelinha,
  COMPANHIAS,
  GOSTOS,
  OPCOES_DE_DIAS,
  roteiroDaEstrelinha,
} from "@/dados/estrelinha";

/**
 * `/ia/roteiro/[combinacao]` — a resposta da conversa (reformulação 2026-08).
 *
 * 360 PÁGINAS PRÉ-COMPUTADAS. Os chips do ajuste são a CONSULTA visível e
 * editável: trocar gosto ou janela navega para a combinação vizinha. Sem
 * horário inventado — o acervo não declara sessão futura com lugar (D-48).
 */

export function generateStaticParams() {
  return combinacoesDaEstrelinha().map((c) => ({ combinacao: c.combinacao }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ia/roteiro/[combinacao]">): Promise<Metadata> {
  const { combinacao } = await params;
  const dados = roteiroDaEstrelinha(combinacao);
  return {
    title: dados
      ? `Roteiro em ${dados.combinacao.cidade.titulo} — Itaú Cultural`
      : "Roteiro — Itaú Cultural",
  };
}

const km = (v: number) => v.toFixed(1).replace(".", ",");

function hashDeLente(recorte: readonly string[], titulo: string, volta: string): string {
  const r = recorte.map(encodeURIComponent).join("~");
  return `/mapa/#r=${r}&t=${encodeURIComponent(titulo)}&v=${encodeURIComponent(volta)}`;
}

export default async function RoteiroDaIa({ params }: PageProps<"/ia/roteiro/[combinacao]">) {
  const { combinacao } = await params;
  const dados = roteiroDaEstrelinha(combinacao);
  if (!dados) notFound();

  const { cidade, dias, gosto } = dados.combinacao;
  const { roteiro, cobertura, regras } = dados;
  const chaves = roteiro.dias.flatMap((d) => d.itens.map((i) => i.chave));
  const mapaHref = hashDeLente(
    chaves,
    `Roteiro em ${cidade.titulo}, ${dias} dias`,
    `/ia/roteiro/${combinacao}/`,
  );
  const rotulosCompanhia = Object.fromEntries(COMPANHIAS.map((c) => [c.slug, c.rotulo]));

  return (
    <div className="ia ia-resposta">
      <header className="ia-topo">
        <Link href="/ia/" className="ia-voltar">
          ← Roteiros
        </Link>
        <div className="ia-topo-linha">
          <Grafismo variacao="barra" className="ia-topo-marca" />
          <h1 className="ia-topo-titulo tipo-titulo-1">Seu roteiro em {cidade.titulo}</h1>
        </div>
        <p className="ia-kicker tipo-legenda">
          Nenhum modelo de IA é chamado — as regras deste percurso vêm escritas abaixo.
        </p>
      </header>

      <div className="ia-fio">
        <div className="ia-msgs">
          <div className="ia-msg ia-msg-usuario">
            <RecadoDoPedido
              cidade={cidade.titulo}
              dias={dias}
              gosto={gosto.rotulo}
              rotulosCompanhia={rotulosCompanhia}
            />
          </div>

          <div className="ia-msg">
            <span className="ia-avatar" aria-hidden>
              {ICONE_IA}
            </span>
            <div className="ia-msg-corpo">
              <p className="ia-fala">
                Pronto. Montei o percurso no acervo de {cidade.titulo}
                {cobertura.rotuloLinguagem
                  ? ` — ${cobertura.doGosto} das ${cobertura.total} paradas declaram ${cobertura.rotuloLinguagem}, e o resto é o que a cidade tem.`
                  : ` — ${cobertura.total} paradas pelo rodízio do acervo, porque você pediu surpresa.`}
              </p>

              <AvisoDaCompanhia rotulos={rotulosCompanhia} />

              <article className="ia-artefato">
                <header className="ia-artefato-cabeca">
                  <div>
                    <p className="ia-artefato-titulo tipo-titulo-3">
                      {dias} dias · {cidade.titulo}
                      {cidade.estado && cidade.estado !== cidade.titulo ? `, ${cidade.estado}` : ""}
                    </p>
                    <p className="ia-artefato-meta tipo-legenda">
                      {cobertura.total} paradas no acervo
                    </p>
                  </div>
                  <div className="ia-acoes">
                    <Link href={mapaHref} className="ia-acao">
                      {ICONE_MAPA} Ver no mapa
                    </Link>
                    <SalvarRoteiro combinacao={combinacao} />
                  </div>
                </header>

                {roteiro.dias.map((dia) => (
                  <section key={dia.numero} className="ia-dia" data-dia-roteiro={dia.numero}>
                    <header className="ia-dia-cabeca">
                      <h2 className="ia-dia-titulo tipo-titulo-3">Dia {dia.numero}</h2>
                      <p className="ia-dia-meta tipo-legenda">
                        {dia.ancoradosNoCentroide === dia.itens.length
                          ? "deslocamento não estimável — paradas no centroide do município"
                          : `${km(dia.deslocamentoKm)} km em linha reta`}
                      </p>
                    </header>
                    <p className="ia-artefato-lead tipo-legenda">{dia.justificativa}</p>

                    <MapaDoDia itens={dia.itens} numero={dia.numero} />

                    <div className="ia-paradas">
                      {dia.itens.map((item, i) => {
                        const miolo = (
                          <>
                            <div className="ia-parada-capa">
                              <span className="ia-parada-n">{i + 1}</span>
                              <CapaDeCartao
                                titulo={item.titulo}
                                classe={item.classe}
                                linguagens={item.linguagens}
                                imagem={item.imagem}
                                creditoImagem={item.creditoImagem}
                                compacta
                                className="size-full"
                              />
                            </div>
                            <div className="ia-parada-miolo">
                              <p className="ia-parada-titulo">{item.titulo}</p>
                              <p className="ia-parada-meta tipo-legenda">
                                {item.rotuloClasse}
                                {item.dataDeclarada ? ` · ${item.dataDeclarada}` : ""}
                              </p>
                              <SelosDeLinguagem ids={item.linguagens} />
                            </div>
                          </>
                        );
                        return item.rota ? (
                          <Link key={item.chave} href={item.rota} className="ia-parada">
                            {miolo}
                          </Link>
                        ) : (
                          <div key={item.chave} className="ia-parada">
                            {miolo}
                          </div>
                        );
                      })}
                    </div>

                    <p className="ia-trilha">
                      {dia.itens.map((item, i) => (
                        <span key={item.chave} className="ia-trilha-passo">
                          {i > 0 ? <span aria-hidden>→</span> : null}
                          <span className="ia-trilha-n">{i + 1}</span>
                          {item.titulo}
                        </span>
                      ))}
                    </p>
                  </section>
                ))}
              </article>
            </div>
          </div>
        </div>

        <nav className="ia-ajuste" aria-label="Ajustar as respostas da entrevista">
          <p className="ia-ajuste-rotulo tipo-micro">Ajustar o pedido · toque para trocar</p>
          <div className="flex flex-wrap gap-1.5">
            {GOSTOS.map((g) => (
              <LinkDaCombinacao
                key={g.slug}
                href={`/ia/roteiro/${cidade.slug}--${dias}-dias--${g.slug}/`}
                ativo={g.slug === gosto.slug}
              >
                {g.rotulo}
              </LinkDaCombinacao>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OPCOES_DE_DIAS.map((d) => (
              <LinkDaCombinacao
                key={d}
                href={`/ia/roteiro/${cidade.slug}--${d}-dias--${gosto.slug}/`}
                ativo={d === dias}
              >
                {d} dias
              </LinkDaCombinacao>
            ))}
            <Link
              href="/ia/"
              className="rounded-pilula border border-borda-forte px-2.5 py-1 text-xs font-semibold no-underline"
            >
              trocar a cidade →
            </Link>
          </div>
        </nav>

        <details className="ia-regras">
          <summary>As regras deste roteiro — o gerador inteiro</summary>
          <ul>
            {regras.map((r) => (
              <li key={r} className="tipo-legenda leading-snug text-tinta-2">
                {r}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="ia-compositor">
        <Link href="/ia/" className="ia-compositor-voltar">
          <span>Pedir outro roteiro</span>
          {ICONE_SETA}
        </Link>
      </div>
    </div>
  );
}
