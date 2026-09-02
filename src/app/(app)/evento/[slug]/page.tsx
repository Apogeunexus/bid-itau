import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { FichaDeAcessibilidade } from "@/componentes/ficha-acessibilidade";
import { ICONE_FICHA, ICONE_MAPA, ICONE_RELOGIO } from "@/componentes/base/icones";
import { Grafismo } from "@/componentes/grafismo";
import {
  ListaDeOcorrencias,
  type OcorrenciaExibivel,
  type TemporadaExibivel,
} from "@/componentes/lista-ocorrencias";
import { BlocoAusenciaDeclarada, BlocoPonte } from "@/componentes/ponte";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import { DATA_DE_REFERENCIA as DATA_FIXA } from "@/dados/alerta";
import { ocorrenciasDe, porId, porSlug, slugsPorTipo, temporadasDe } from "@/dados/grafo";
import { ingressoDe } from "@/dados/ingressos";
import { vinculosDe, type GrupoVinculo } from "@/dados/ponte";
import type { Entidade } from "@/dados/tipos";

/**
 * Página do evento — DESC-06, `docs/telas.md` tela 12, e A OUTRA METADE DE DESC-08.
 *
 * Daqui tem de dar para chegar ao verbete de quem atua, e de lá tem de dar para voltar. A
 * ponte só existe se ela for de mão dupla, e ela só cumpre D-40 se a volta aparecer como
 * relação nomeada — «quem atua, e com que papel» — em vez de um link solto.
 *
 * DUAS PÁGINAS MUITO DIFERENTES SAEM DESTE MESMO ARQUIVO, e isso é medido, não estilo:
 *
 *   - o evento da **Enciclopédia** (`/evento/hypno-aktion/`) tem 16 arestas de atuação, 37
 *     de realização, espaço e território — e NENHUMA ocorrência datada;
 *   - o evento do **CMS** tem 3 sessões datadas de 2026 e ZERO agentes, porque os 100
 *     registros do CMS chegam com `extra.agentes` literalmente vazio.
 *
 * Dos 129 eventos com ocorrência datada, zero têm aresta de agente; dos 67 com agente,
 * zero têm ocorrência. Não autoramos as arestas que fechariam esse buraco: dizer que a
 * pessoa X participou da montagem Y seria uma alegação factual falsa sobre gente real.
 * O que muda entre as duas páginas é QUAL BLOCO TEM CONTEÚDO — e cada bloco vazio se
 * declara pela frase de ausência de `ponte.ts`, em vez de sumir.
 */

/** Reserva para classe vazia. Hoje não é emitida — 300 eventos. */
export function generateStaticParams() {
  const slugs = slugsPorTipo("evento");
  return (slugs.length ? slugs : ["sem-entidade"]).map((slug) => ({ slug }));
}

/**
 * A data do build, avaliada UMA VEZ por execução. É ela que a lista de ocorrências usa
 * para dizer qual é «a próxima» (T-02-18) — nunca um relógio dentro do componente.
 */
/* De `alerta.ts`, nunca do relógio: um build depois da meia-noite UTC divergiria da
 * data que o resto do produto e as suítes pinam. */
const DATA_DE_REFERENCIA = DATA_FIXA;

// ---------------------------------------------------------------------------
// Espaço: três caminhos, nesta ordem, e o terceiro é uma frase
// ---------------------------------------------------------------------------

interface LocalDoEvento {
  cidade?: string | null;
  espaco?: string | null;
}

/** O espaço que a temporada declara em `extra.espacoId`, resolvido no grafo. */
function espacoDaTemporada(temporada: Entidade | undefined): string | null {
  const id = (temporada?.extra as { espacoId?: string | null } | undefined)?.espacoId;
  if (!id) return null;
  return porId(id)?.titulo ?? null;
}

/** O espaço que o próprio evento declara em `extra.locais[]`, com a cidade junto. */
function espacoDoEvento(evento: Entidade): string | null {
  const locais = (evento.extra as { locais?: LocalDoEvento[] } | undefined)?.locais ?? [];
  for (const local of locais) {
    const nome = local?.espaco?.trim();
    if (!nome) continue;
    const cidade = local?.cidade?.trim();
    return cidade ? `${nome}, ${cidade}` : nome;
  }
  return null;
}

function indexar(grupos: GrupoVinculo[]): Map<string, GrupoVinculo> {
  return new Map(grupos.map((g) => [g.chave, g]));
}

function Cabecalho({ nome, objetivo }: { nome: string; objetivo: string }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{nome}</h1>
      </div>
      <p className="max-w-prose text-sm text-tinta-2">{objetivo}</p>
    </header>
  );
}

export default async function PaginaEvento({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("evento", slug);
  const ingresso = ingressoDe(slug);

  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:p-8">
        <Cabecalho
          nome="Página do evento"
          objetivo="A rota existe e responde; nenhum evento do acervo corresponde a este endereço."
        />
      </div>
    );
  }

  // --- ocorrências e temporadas, resolvidas no BUILD ------------------------
  const temporadas = temporadasDe(entidade.id);
  const porTemporada = new Map(temporadas.map((t) => [t.id, t]));
  const doEvento = espacoDoEvento(entidade);

  const ocorrencias: OcorrenciaExibivel[] = ocorrenciasDe(entidade.id).map((o) => {
    const daTemporada = espacoDaTemporada(porTemporada.get(o.temporadaId));
    const espaco = daTemporada ?? doEvento;
    return {
      id: o.id,
      inicio: o.inicio,
      gratuito: o.gratuito,
      esgotado: o.esgotado,
      espaco,
      origemDoEspaco: espaco ? (daTemporada ? "temporada" : "evento") : null,
    };
  });

  const temporadasExibiveis: TemporadaExibivel[] = temporadas.map((t) => {
    const extra = t.extra as
      | { dataDeclarada?: string | null; inicio?: string | null; fim?: string | null }
      | undefined;
    return {
      id: t.id,
      dataDeclarada: extra?.dataDeclarada ?? null,
      inicio: extra?.inicio ?? null,
      fim: extra?.fim ?? null,
    };
  });

  // --- OS TRÊS FATOS DO ALTO (2026-09) -------------------------------------
  // Onde, quando e ingresso. Antes era preciso rolar até o meio da tela para saber quando
  // o evento acontece: a contagem de sessões vinha depois de dois parágrafos sobre o que o
  // acervo não publica. Cada fato declara a AUSÊNCIA em uma linha quando a fonte não traz
  // — a honestidade continua, deixa de ser parágrafo.
  const horaConhecida = entidade.extra?.horaConhecida !== false;
  const ordenadas = [...ocorrencias].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const primeira = ordenadas[0];
  // O ESPAÇO DECLARADO PELO PARCEIRO CONTA. Ele vem da raspagem — «Casa das Rosas,
  // Avenida Paulista» — e vivia só no `extra`, então a ficha dizia «local não publicado»
  // sobre um evento cujo lugar a fonte publica. Acervo primeiro, porque é o dado mais
  // forte; o do parceiro entra quando o acervo não tem.
  const espacoDeclaradoPeloParceiro =
    typeof entidade.extra?.espacoDeclarado === "string" ? entidade.extra.espacoDeclarado : null;
  const espacoDoFato =
    ordenadas.find((o) => o.espaco)?.espaco ?? doEvento ?? espacoDeclaradoPeloParceiro;
  const gratuitas = ocorrencias.filter((o) => o.gratuito).length;

  // A HORA SÓ APARECE QUANDO A FONTE A PUBLICOU. Evento de parceiro chega com meia-noite
  // sentinela porque `Ocorrencia.inicio` é datetime e precisa de algo — mostrar esse algo
  // seria afirmar um horário que ninguém disse. Ver `horaConhecida` em `parceiros.ts`.
  const quando = primeira
    ? new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        ...(horaConhecida ? { hour: "2-digit" as const, minute: "2-digit" as const } : {}),
      }).format(new Date(primeira.inicio))
    : null;

  const ingressoDoFato = !ocorrencias.length
    ? null
    : gratuitas === ocorrencias.length
      ? "Todas as sessões gratuitas"
      : gratuitas === 0
        ? "Nenhuma sessão gratuita declarada"
        : `${gratuitas} de ${ocorrencias.length} sessões gratuitas`;

  // --- a ponte, nos dois sentidos ------------------------------------------
  const grupos = indexar(vinculosDe(entidade.id));
  const quemRealiza = grupos.get("quem-realiza");
  const quemAtua = grupos.get("quem-atua");
  const onde = grupos.get("onde");
  const aprofunda = grupos.get("aprofunda");
  const contextualiza = grupos.get("contextualiza");
  const falaSobre = grupos.get("fala-sobre");
  const semelhante = grupos.get("semelhante");

  /**
   * FATO DO REGISTRO, não inferência do id. `declaraAcessibilidade` diz se a ficha das 8
   * dimensões foi preenchida na origem, e é essa distinção que separa «declarado
   * ausente» de «não declarado» (D-43). Até a regeneração do grafo esta linha era
   * `id.startsWith("evento:cms:")` — uma heurística que acertava só porque alguém tinha
   * medido que os 100 eventos do CMS declaram, e que teria mentido sobre qualquer
   * registro do CMS sem o campo.
   */
  const declaraAcessibilidade = entidade.declaraAcessibilidade;
  const vemDoCms = entidade.id.startsWith("evento:cms:");

  /**
   * Quantos blocos de vínculo o painel lateral leva. O número vira o valor de
   * `data-painel-aprofunda` — um painel que existe com zero bloco é o defeito que a
   * ausência declarada existe para impedir, e o gate mede o número, não a presença.
   */
  // AS NOTAS DE AUSÊNCIA SÃO SOBRE O ACERVO, e um evento de parceiro não veio dele.
  // «O registro do Itaú Cultural não nomeia instituição realizadora» é verdade e é
  // irrelevante numa ficha cuja instituição está escrita no topo: a nota explicaria um
  // silêncio que não existe ali. Para parceiro a ficha mostra o que a fonte publicou e
  // para de auditar um acervo que não é o dela.
  const deParceiro = entidade.procedencia === "parceiro";
  const doPainel = [quemRealiza, quemAtua, onde, aprofunda, contextualiza, semelhante, falaSobre];
  const blocosDoPainel = doPainel.filter(Boolean).length;

  return (
    <div className="ev-tela web-duas-colunas flex flex-col gap-6 p-5 desk:p-8">
      {/* 1 — imagem, título e selos de linguagem -------------------------- */}
      <header className="ev-cabecalho flex flex-col gap-3">
        <CapaDeCartao
          titulo={entidade.titulo}
          classe={entidade.classe}
          linguagens={entidade.linguagens}
          imagem={entidade.imagem}
          creditoImagem={entidade.creditoImagem}
          className="h-36 w-full rounded-xl"
        />
        <h1 className="text-2xl leading-tight font-bold">{entidade.titulo}</h1>
        <p className="text-[0.65rem] tracking-widest text-tinta-3 uppercase">
          evento · procedência {entidade.procedencia}
        </p>
        {entidade.linguagens.length ? (
          <SelosDeLinguagem ids={entidade.linguagens} />
        ) : (
          <p className="text-xs text-tinta-3">
            Nenhuma linguagem artística declarada para este evento no acervo.
          </p>
        )}
      </header>

      {/* O BLOCO DE FATOS — onde, quando e ingresso, antes de qualquer parágrafo. */}
      <section className="ev-fatos" aria-label="Onde, quando e ingresso">
        <div className="ev-fato">
          <span className="ev-fato-icone" aria-hidden>
            {ICONE_MAPA}
          </span>
          <div>
            <p className="ev-fato-valor">{espacoDoFato ?? "Local não publicado"}</p>
            {espacoDoFato ? null : (
              <p className="ev-fato-nota">O acervo não situa esta entrada em nenhum espaço.</p>
            )}
          </div>
        </div>

        <div className="ev-fato">
          <span className="ev-fato-icone" aria-hidden>
            {ICONE_RELOGIO}
          </span>
          <div>
            <p className="ev-fato-valor">{quando ?? "Sem sessão datada"}</p>
            <p className="ev-fato-nota">
              {ocorrencias.length
                ? `${ocorrencias.length} ${ocorrencias.length === 1 ? "sessão" : "sessões"} no total`
                : "O acervo registra este evento sem data de sessão."}
            </p>
          </div>
        </div>

        {ingressoDoFato ? (
          <div className="ev-fato">
            <span className="ev-fato-icone" aria-hidden>
              {ICONE_FICHA}
            </span>
            <p className="ev-fato-valor">{ingressoDoFato}</p>
          </div>
        ) : null}
      </section>

      {/* O LINK DE RESERVA DO PARCEIRO (2026-09). Quando o evento veio por ingestão
          federada, quem vende ou reserva é a instituição, não nós — e a URL que a raspagem
          guardou é justamente a página onde isso acontece. Sem este botão o cartão contava
          um evento e deixava a pessoa sem saída: descobrir sem poder ir é meio produto.
          `rel="noreferrer"` e `target="_blank"` porque o destino é site de terceiro. */}
      {entidade.procedencia === "parceiro" && typeof entidade.extra?.fonteUrl === "string" ? (
        <div className="flex flex-col gap-1">
          <a
            href={entidade.extra.fonteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-full bg-acao px-4 py-2 text-sm font-semibold text-sobre-acao no-underline transition-opacity hover:opacity-90"
          >
            Reservar em {entidade.fonte} ↗
          </a>
          <p className="text-xs leading-snug text-tinta-2">
            A reserva é feita no site da instituição. Nós levamos até lá — a Fundação Itaú
            não transaciona ingresso.
          </p>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* AS DUAS COLUNAS DA VISÃO WEB (D-80, tela 27), E A MESMA PILHA DA     */}
      {/* FASE 2 NA VISÃO APP.                                                */}
      {/*                                                                     */}
      {/* A ORDEM DO DOM É UMA SÓ e quem reordena é o layout, nunca um ramo em */}
      {/* JavaScript (D-79/D-05). Em `[data-view="mobile"]`, `web-evento.css`  */}
      {/* dissolve estes dois invólucros com `display: contents` e devolve os  */}
      {/* onze blocos à ordem exata da fase 2 com quatro valores de `order`.   */}
      {/* Em `[data-view="web"]` eles são as duas colunas da grade, e o lateral */}
      {/* cola pelo `.web-coluna-fixa` de `web.css`.                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="ev-principal flex flex-col gap-6">
      {/* 2 e 4 — A CONTAGEM NO TOPO E AS OCORRÊNCIAS ABAIXO (D-42). O evento
             aparece uma vez só; as sessões são registros próprios dentro dele. */}
      <ListaDeOcorrencias
        ocorrencias={ocorrencias}
        temporadas={temporadasExibiveis}
        dataDeReferencia={DATA_DE_REFERENCIA}
        espacoDoEvento={espacoDoFato}
        horaConhecida={horaConhecida}
        linkDeReserva={typeof entidade.extra?.fonteUrl === "string" ? entidade.extra.fonteUrl : null}
        nomeDaFonte={entidade.fonte ?? null}
      />

      {/* A entrada para a escolha de sessão (AGEN-02, D-56). Só aparece quando o evento
          TEM sessão: `/evento/[slug]/sessoes` é exportada apenas para os 129 eventos com
          ocorrência datada, e oferecer o link nos outros 171 seria link para uma página
          que o `generateStaticParams` não emitiu — 404 na demonstração ao vivo. */}
      {ocorrencias.length ? (
        <Link
          href={`/evento/${entidade.slug}/sessoes/`}
          className="w-fit rounded-full bg-acao px-4 py-2 text-sm font-semibold text-sobre-acao no-underline transition-opacity hover:opacity-90"
        >
          Escolher e salvar uma sessão
        </Link>
      ) : null}

      {/* A PONTE DE VENDA (reformulação 2026-08): quando o evento tem link de ingresso,
          o botão leva direto à plataforma. O acervo NÃO publica esse dado (0 de 300 —
          medido); nos dois eventos de demonstração o link é AUTORADO e rotulado como
          tal, no estatuto da trilha do Cenário 1 (D-37). O `<a>` externo é clique da
          pessoa, não requisição do protótipo — zero rede em runtime continua valendo. */}
      {ingresso ? (
        <div className="flex flex-col gap-1">
          <a
            href={ingresso.url}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-full border-2 border-acao px-4 py-2 text-sm font-bold text-acao-tinta no-underline transition-colors hover:bg-acao hover:text-sobre-acao"
          >
            Ingressos na {ingresso.plataforma} ↗
          </a>
          <p className="text-xs italic leading-snug text-tinta-2">{ingresso.rotulo}.</p>
        </div>
      ) : null}

      {/* 3 — o verbete, embutido, com crédito e link de procedência (D-39).
             Não existe para parceiro: verbete é da Enciclopédia. */}
      {deParceiro ? null : <Verbete entidade={entidade} />}

      {/* A DESCRIÇÃO DO PARCEIRO, INTEIRA. Esconder o verbete deixou a ficha sem texto
          nenhum: título, três fatos e um botão. O texto é o que a instituição escreveu na
          própria página — não é resumo nosso, e por isso vai sem corte e com a fonte
          nomeada. É ele que responde «o que é isto?» antes de alguém decidir reservar. */}
      {deParceiro && entidade.resumo ? (
        <section className="ev-descricao flex flex-col gap-2">
          <h2 className="text-lg leading-tight font-bold">Sobre este evento</h2>
          <p className="max-w-prose text-sm leading-relaxed text-tinta-2">{entidade.resumo}</p>
          <p className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
            texto publicado por {entidade.fonte}
          </p>
        </section>
      ) : null}

      {/* 6 — a ficha das 8 dimensões (D-43). No DOM ela fecha a coluna
             principal; na visão app o `order` a devolve para depois de «onde
             acontece», que é o lugar exato em que a fase 2 a deixou. */}
      {/* A ficha das 8 dimensões audita a DECLARAÇÃO do acervo. Numa ficha de parceiro ela
          são oito linhas dizendo «não declarado» sobre um registro que nunca teve o campo —
          ruído, não transparência. Volta quando a instituição declarar. */}
      <div className="ev-ficha-acesso" hidden={deParceiro}>
        <FichaDeAcessibilidade
          acessibilidade={entidade.acessibilidade}
          declaraDimensoes={declaraAcessibilidade}
          fonteDaDeclaracao={vemDoCms ? "agenda do Itaú Cultural" : "Enciclopédia Itaú Cultural"}
        />
      </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* O PAINEL LATERAL DE D-80 — «aprofunda isto» ao lado, e não no pé.    */}
      {/*                                                                     */}
      {/* Ele carrega os vínculos de `vinculosDe` E o conteúdo editorial, que  */}
      {/* é o que faz as DUAS páginas muito diferentes que saem deste arquivo  */}
      {/* terem lateral com conteúdo: o evento da Enciclopédia enche o painel  */}
      {/* por «quem atua» e «quem realiza», o do CMS o enche por «aprofunda».  */}
      {/* Onde nenhum dos dois vem, o bloco declara a ausência em vez de sumir */}
      {/* e deixar meia tela vazia.                                           */}
      {/* ------------------------------------------------------------------ */}
      <aside
        data-painel-aprofunda={deParceiro ? 0 : blocosDoPainel}
        className="ev-lateral web-painel web-coluna-fixa flex flex-col gap-4"
        hidden={deParceiro}
      >
        {/* 5 — QUEM REALIZA E QUEM ATUA, COM PAPEL. A volta da ponte: daqui se
               chega ao verbete do artista, e o vínculo está nomeado. */}
        {quemRealiza ? <BlocoPonte grupo={quemRealiza} /> : null}
        {quemAtua ? <BlocoPonte grupo={quemAtua} /> : null}

        {/* onde acontece — espaço e território, quando o registro os traz */}
        {onde ? <BlocoPonte grupo={onde} rotulo="Onde acontece" /> : null}

        {/* 7 — APROFUNDA ISTO. É o bloco que funciona também nos eventos do CMS,
               que não têm agente: o evento datado da trilha tem 40 arestas
               `aprofunda`, e é por elas que ele cruza para o acervo. */}
        <section className="ev-aprofunda flex flex-col gap-4">
          <h2 className="web-painel-titulo text-sm font-bold tracking-wide text-tinta-2 uppercase">
            Aprofunda isto
          </h2>
          {aprofunda ? <BlocoPonte grupo={aprofunda} /> : null}
          {contextualiza ? <BlocoPonte grupo={contextualiza} /> : null}
          {semelhante ? <BlocoPonte grupo={semelhante} /> : null}
        </section>

        {/* 8 — SE NÃO PUDER IR. Tela 12 pede conteúdo do Play; o Play é fase 5.
               O bloco não some: mostra a mídia que o grafo tem e declara o que
               ainda não existe. */}
        <section className="ev-se-nao-puder flex flex-col gap-4">
          <h2 className="web-painel-titulo text-sm font-bold tracking-wide text-tinta-2 uppercase">
            Se não puder ir
          </h2>
          {falaSobre ? <BlocoPonte grupo={falaSobre} /> : null}
          <BlocoAusenciaDeclarada
            chave="play"
            rotulo="Catálogo do Play"
            frase="O que está acima é o que o acervo liga a este evento por ligação de mídia."
          />
        </section>
      </aside>

    </div>
  );
}
