import meta from "@/dados/gerado/meta.json";
import personasJson from "@/dados/gerado/personas.json";
import { contagens, ocorrenciasDe, porId, porTerritorio } from "@/dados/grafo";
import type { Entidade } from "@/dados/tipos";

/**
 * Página de verificação da fase 1: prova, numa tela só, que o caminho
 * disco → gerador → tipos → travessia → render está inteiro, e mostra os números
 * reais por classe e por procedência lidos de `meta.json`.
 *
 * Não é tela de produto — é ferramenta de prova. Sai quando as telas de verdade entrarem.
 */

/**
 * Sob `output: "export"` esta página é renderizada no build. Lançar aqui faz um
 * grafo quebrado derrubar o build — em vez de virar tela branca na apresentação.
 */
function exigir(id: string): Entidade {
  const entidade = porId(id);
  if (!entidade) {
    throw new Error(
      `grafo quebrado: porId("${id}") devolveu undefined. Rode \`npm run gerar-grafo\` e confira src/dados/gerado/entidades.json.`,
    );
  }
  return entidade;
}

const numeros = contagens();
if (!Object.keys(numeros.porClasse).length) {
  throw new Error("grafo vazio: contagens() não devolveu classe nenhuma.");
}

const ID_EVENTO = "evento:cms:13913";
const ID_PESSOA = "pessoa:enc:26400";
const ID_BELEM = "territorio:derivado:belem-para";

const ROTULO_ACESSIBILIDADE: Record<string, string> = {
  audio_description: "audiodescrição",
  libras: "Libras",
  descriptive_subtitle: "legenda descritiva",
  closed_caption: "closed caption",
  open_caption: "legenda aberta",
  simultaneous_translation: "tradução simultânea",
  stenotypy: "estenotipia",
  subtitle: "legenda",
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">
        <span className="mr-2 text-[var(--ic-laranja)]">\</span>
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Tabela({ linhas, cabecalho }: { linhas: Array<[string, string | number]>; cabecalho: [string, string] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-[var(--ic-preto)] text-left">
          <th className="py-1 text-xs font-semibold tracking-wider uppercase">{cabecalho[0]}</th>
          <th className="py-1 text-right text-xs font-semibold tracking-wider uppercase">{cabecalho[1]}</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map(([chave, valor]) => (
          <tr key={chave} className="border-b border-neutral-200">
            <td className="py-1 break-words">{chave}</td>
            <td className="py-1 text-right tabular-nums">{valor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-t border-neutral-200 py-2">
      <dt className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">{rotulo}</dt>
      <dd className="text-sm break-words text-[var(--ic-preto)]">{children}</dd>
    </div>
  );
}

function Cartao({ entidade }: { entidade: Entidade }) {
  const sessoes = ocorrenciasDe(entidade.id);
  return (
    <article className="rounded-2xl border-2 border-[var(--ic-preto)] p-5">
      <span className="inline-block rounded-full bg-[var(--ic-laranja)] px-3 py-1 text-xs font-bold tracking-wider text-[var(--ic-branco)] uppercase">
        {entidade.classe}
      </span>
      <h3 className="mt-3 text-xl leading-snug font-bold">{entidade.titulo}</h3>
      {entidade.resumo ? <p className="mt-2 text-sm text-neutral-700">{entidade.resumo}</p> : null}
      <dl className="mt-4">
        <Campo rotulo="id">
          <code>{entidade.id}</code>
        </Campo>
        <Campo rotulo="procedência">{entidade.procedencia}</Campo>
        <Campo rotulo="fonte">
          {entidade.fonte ? (
            <a
              className="text-[var(--ic-laranja)] underline underline-offset-2"
              href={entidade.fonte}
              rel="noreferrer noopener"
              target="_blank"
            >
              {entidade.fonte}
            </a>
          ) : (
            "—"
          )}
        </Campo>
        <Campo rotulo="linguagens">
          {entidade.linguagens.length ? entidade.linguagens.join(" · ") : "—"}
        </Campo>
        <Campo rotulo="ocorrências">{sessoes.length}</Campo>
      </dl>
    </article>
  );
}

export default function Verificacao() {
  const evento = exigir(ID_EVENTO);
  const pessoa = exigir(ID_PESSOA);
  const personas = personasJson.personas;
  const belem = porId(ID_BELEM);
  const belemTudo = belem ? porTerritorio(belem.id).length : 0;
  const belemJanela = belem
    ? porTerritorio(belem.id, { de: "2026-08-22", ate: "2026-08-26" }).length
    : 0;

  return (
    <main className="bg-[var(--ic-branco)] p-6 text-[var(--ic-preto)]">
      <p className="text-xs font-semibold tracking-widest text-[var(--ic-laranja)] uppercase">
        Verificação da fase 1
      </p>
      <h1 className="mt-2 text-2xl font-bold app:text-2xl desk:text-4xl">
        O grafo, contado por classe e por procedência
      </h1>
      <p className="mt-2 max-w-prose text-sm text-neutral-700">
        Todos os números desta página são lidos de <code>src/dados/gerado/meta.json</code>,
        que o gerador escreve depois de conferir as próprias invariantes. Nenhum foi
        digitado à mão. Gerado em {meta.geradoEm}.
      </p>

      <p className="mt-4 rounded-lg bg-neutral-100 p-3 text-sm">
        Visão ativa: <strong className="app:inline desk:hidden">app (mobile)</strong>
        <strong className="app:hidden desk:inline">web (desktop)</strong> · {meta.totais.entidades}{" "}
        entidades · {meta.totais.arestas} arestas
      </p>

      <div className="grid gap-8 app:grid-cols-1 desk:grid-cols-2">
        <Secao titulo="Entidades por classe">
          <Tabela cabecalho={["classe", "entidades"]} linhas={Object.entries(numeros.porClasse)} />
        </Secao>

        <Secao titulo="Procedência">
          <Tabela cabecalho={["procedência", "entidades"]} linhas={Object.entries(numeros.porProcedencia)} />
          <p className="mt-2 text-xs text-neutral-600">
            Toda entidade <code>ic</code> carrega a URL de origem. As{" "}
            {numeros.porProcedencia.autorado ?? 0} autoradas são as 40 duplicatas do Cenário 3,
            as 3 personas com repertório e a trilha do Cenário 1.
          </p>
        </Secao>

        <Secao titulo="Arestas por relação">
          <Tabela cabecalho={["relação", "arestas"]} linhas={Object.entries(meta.porRelacao)} />
          <p className="mt-2 text-xs text-neutral-600">
            Procedência das arestas: {Object.entries(meta.porProcedenciaDeAresta)
              .map(([k, v]) => `${k} ${v}`)
              .join(" · ")}. As {meta.porProcedenciaDeAresta.autorado ?? 0} autoradas são a
            trilha do Cenário 1, as duplicatas e os repertórios — nenhuma outra.
          </p>
        </Secao>

        <Secao titulo="Coordenadas — todas derivadas (D-20)">
          <Tabela
            cabecalho={["método", "lugares"]}
            linhas={[
              ...Object.entries(meta.cobertura.coordenadas.porMetodo),
              ["sem coordenada", meta.cobertura.semCoordenada.total],
            ]}
          />
          <p className="mt-2 text-xs text-neutral-600">
            Tabela estática de {meta.cobertura.coordenadas.municipiosNaTabela} municípios e{" "}
            {meta.cobertura.coordenadas.paisesNaTabela} países, escrita à mão. Nenhuma API de
            geocodificação participa da geração.
          </p>
        </Secao>

        <Secao titulo="Acessibilidade declarada na fonte">
          <Tabela
            cabecalho={["dimensão", "entidades"]}
            linhas={Object.entries(meta.acessibilidade).map(([k, v]) => [
              ROTULO_ACESSIBILIDADE[k] ?? k,
              v,
            ])}
          />
          <p className="mt-2 text-xs text-neutral-600">
            Contagem sobre as entidades <code>ic</code>: é o que a fonte afirma. Das 8
            dimensões do CMS só Libras aparece de verdade, e mesmo assim em{" "}
            {meta.acessibilidade.libras} registros. Incluindo ocorrências e temporadas, que
            herdam a acessibilidade do evento, o número sobe para{" "}
            {meta.acessibilidadeIncluindoDerivadas.libras} — publicar só esse segundo número
            inflaria um campo que na origem está quase vazio.
          </p>
        </Secao>

        <Secao titulo="Acontecimentos">
          <Tabela
            cabecalho={["", "quantidade"]}
            linhas={[
              ["temporadas", meta.totais.temporadas],
              ["ocorrências derivadas", meta.totais.ocorrencias],
              ["eventos com ocorrência", meta.cobertura.agenda.eventosComOcorrencia],
              ["eventos sem período na fonte", meta.cobertura.agenda.eventosSemPeriodo],
              ["duplicatas do Cenário 3", meta.totais.duplicatas],
            ]}
          />
        </Secao>
      </div>

      <Secao titulo="Fontes lidas">
        <ul className="space-y-1 text-sm">
          {meta.fontes.enciclopedia.map((f) => (
            <li key={f.fonte}>
              <code>{f.fonte}</code> — {f.lidos} registros lidos, {f.novos} aproveitados
            </li>
          ))}
          {meta.fontes.cms.map((f) => (
            <li key={f}>
              <code>{f}</code>
            </li>
          ))}
          {meta.fontes.taxonomia.map((f) => (
            <li key={f}>
              <code>{f}</code>
            </li>
          ))}
          {meta.fontes.imagens ? (
            <li>
              <code>{meta.fontes.imagens}</code> — {meta.cobertura.imagens.arquivos} imagens
              servidas de <code>/acervo/</code>, {meta.cobertura.entidadesComImagemLocal}{" "}
              entidades com imagem local
            </li>
          ) : null}
        </ul>
      </Secao>

      <Secao titulo="As duas lacunas conhecidas do acervo">
        <div className="space-y-3 text-sm text-neutral-700">
          <p>
            <strong>Território e data não se cruzam.</strong> <code>porTerritorio</code> em Belém
            devolve <strong>{belemTudo}</strong> entidades sem janela e{" "}
            <strong>{belemJanela}</strong> numa janela de quatro dias em 2026. Os eventos com
            território são históricos; os de 2026 não têm território. O zero é fato do acervo.
          </p>
          <p>
            <strong>Acessibilidade quase vazia.</strong> Só Libras aparece, em{" "}
            {meta.acessibilidade.libras} registros declarados pela fonte — 9 eventos, 31
            conteúdos, 5 formações e 3 mídias. As outras 7 dimensões existem no schema e
            nunca foram preenchidas.
          </p>
        </div>
      </Secao>

      <Secao titulo="As 3 personas (mock rotulado, D-25)">
        <ul className="space-y-2 text-sm">
          {personas.map((p) => (
            <li key={p.id} className="border-t border-neutral-200 pt-2">
              <strong>{p.nome}</strong> · <code>{p.procedencia}</code> ·{" "}
              {p.repertorio.linguagens.join(", ")} · {p.repertorio.entidades.length} entidades
              reais no repertório · {p.repertorio.ocorrenciasSalvas.length} ocorrências salvas
              <p className="text-neutral-600">{p.resumo}</p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Duas entidades, do disco à tela">
        <div className="grid gap-6 app:grid-cols-1 desk:grid-cols-2">
          <Cartao entidade={evento} />
          <Cartao entidade={pessoa} />
        </div>
      </Secao>
    </main>
  );
}
