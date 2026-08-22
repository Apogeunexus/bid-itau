"use client";

import { useSessao } from "@/contexto/sessao";

/**
 * lista-ocorrencias.tsx — D-42: o EVENTO é a entidade, as ocorrências ficam listadas
 * abaixo, cada uma salvável isoladamente, e a contagem aparece no topo.
 *
 * É o desenho que impede a agenda de virar catálogo: sem ele, um espetáculo com seis
 * sessões vira seis cartões idênticos na listagem, e o produto passa a mostrar o
 * calendário em vez da obra. Aqui o evento aparece UMA VEZ e as seis sessões são registro
 * próprio, com id próprio, dentro dele.
 *
 * NENHUM RELÓGIO DE RUNTIME (T-02-18). «A próxima sessão» é relativa a uma data de
 * referência recebida por prop — a data do build —, nunca a um `new Date()` dentro do
 * componente. Sob `output: "export"` a página é prerenderizada no build; um relógio de
 * runtime faria servidor e cliente divergirem na hidratação e ainda vazaria o horário
 * local de quem avalia. A data de referência é dita na tela, porque um «próxima sábado»
 * calculado contra uma data que o leitor não conhece é pior do que nenhuma informação.
 *
 * As datas são formatadas por função pura sobre a string ISO, sem `Intl` e sem `Date` de
 * fuso: todas as ocorrências do grafo chegam com deslocamento `-03:00` explícito, e ler a
 * string é o que garante que o build e o navegador escrevam exatamente o mesmo texto.
 *
 * DP-F: este arquivo é `"use client"` e por isso NÃO importa `grafo.ts`. A página resolve
 * espaço e temporada no build e passa primitivos.
 */

// ---------------------------------------------------------------------------
// Contrato com a página
// ---------------------------------------------------------------------------

export interface OcorrenciaExibivel {
  id: string;
  /** Datetime ISO com deslocamento, como o grafo grava. */
  inicio: string;
  gratuito: boolean;
  esgotado: boolean;
  /** Nome do espaço, quando algum dos três caminhos o encontrou. */
  espaco: string | null;
  /** De onde o espaço saiu — a tela diz, porque não é o mesmo grau de certeza. */
  origemDoEspaco: "temporada" | "evento" | null;

  // -------------------------------------------------------------------------
  // ACRESCENTADOS PELO PLANO 05-03, TODOS OPCIONAIS E TODOS SÓ-DE-COLUNA.
  //
  // A visão web mostra estas ocorrências em TABELA (tela 27, D-80), e uma tabela
  // precisa de célula onde a pilha de cartões da visão app precisava só de linha
  // de texto. Os três campos são preenchidos pela página do evento a partir de
  // dados que ela JÁ resolvia no build; nenhum deles muda o que a visão app
  // desenha, e nenhum deles é obrigatório — a chamada da fase 2 continua
  // compilando e renderizando igual sem passar nenhum.
  // -------------------------------------------------------------------------

  /** Id da temporada a que a sessão pertence. Casa com `TemporadaExibivel.id`. */
  temporadaId?: string;
  /** Quantas das 8 dimensões de acessibilidade a sessão declara PRESENTES. */
  recursosDeclarados?: number;
  /**
   * O registro de origem preencheu a ficha das 8 dimensões? É este campo, e não o
   * booleano de cada dimensão, que separa «declarado ausente» de «não declarado»
   * (D-43). Herdado do evento: a sessão não declara nada por conta própria.
   */
  declaraAcessibilidade?: boolean;
}

export interface TemporadaExibivel {
  id: string;
  /** A data EXATAMENTE como a Enciclopédia a escreveu: "27.09.1969 - 14.12.1969", "1978". */
  dataDeclarada: string | null;
  inicio: string | null;
  fim: string | null;
}

// ---------------------------------------------------------------------------
// Datas, sem Intl e sem fuso
// ---------------------------------------------------------------------------

const DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function partesDaData(iso: string) {
  const [data, resto = ""] = iso.split("T");
  const [ano, mes, dia] = data.split("-").map(Number);
  const hora = resto.slice(0, 5);
  // `Date.UTC` só para saber o dia da semana. Nada de fuso local entra na conta.
  const diaDaSemana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return { ano, mes, dia, hora, diaDaSemana };
}

/**
 * O DIA por extenso, sem a hora. A visão web precisa de data e horário em CÉLULAS
 * SEPARADAS (tela 27), e a app precisa da mesma frase de sempre — daí a frase ser
 * montada dos dois pedaços em vez de fatiada depois de pronta. `porExtenso` continua
 * existindo e continua sendo o que o cabeçalho «a próxima …» usa.
 */
function diaPorExtenso(iso: string): string {
  const { ano, mes, dia, diaDaSemana } = partesDaData(iso);
  return `${diaDaSemana}, ${dia} de ${MESES[mes - 1]} de ${ano}`;
}

function horaCurta(iso: string): string {
  const { hora } = partesDaData(iso);
  return hora ? hora.replace(":", "h") : "";
}

/**
 * A data como uma TABELA a escreve. «terça-feira, 8 de dezembro de 2020» pede 230 px de
 * coluna e, em 53 linhas, transforma a tabela numa parede de duas linhas por sessão —
 * exatamente a rolagem que a visão web existe para acabar. As duas formas saem da mesma
 * string ISO, pelas mesmas partes: não são dois dados, são dois formatos do mesmo dado.
 */
function diaCurto(iso: string): string {
  const { diaDaSemana } = partesDaData(iso);
  return `${diaDaSemana.slice(0, 3)} · ${curta(iso)}`;
}

function porExtenso(iso: string): string {
  const hora = horaCurta(iso);
  const base = diaPorExtenso(iso);
  return hora ? `${base}, ${hora}` : base;
}

function curta(iso: string): string {
  const { ano, mes, dia } = partesDaData(iso);
  return `${String(dia).padStart(2, "0")}.${String(mes).padStart(2, "0")}.${ano}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ListaDeOcorrencias({
  ocorrencias,
  temporadas,
  dataDeReferencia,
  className,
}: {
  ocorrencias: OcorrenciaExibivel[];
  temporadas: TemporadaExibivel[];
  /** Datetime ISO do build. É contra esta data que «a próxima» é calculada. */
  dataDeReferencia: string;
  className?: string;
}) {
  const { salvos, alternarSalvo } = useSessao();

  const referencia = Date.parse(dataDeReferencia);
  const futuras = ocorrencias.filter((o) => Date.parse(o.inicio) >= referencia);
  const proxima = futuras[0];

  // -------------------------------------------------------------------------
  // O QUE A TABELA DA VISÃO WEB PRECISA SABER, MEDIDO AQUI E NÃO ARBITRADO.
  //
  // Numa tabela, uma coluna cujo valor é o MESMO nas 53 linhas não informa nada e
  // ainda ocupa a largura de que as colunas que discriminam precisam. Mas apagá-la
  // sem dizer nada esconderia um fato do acervo. A resposta é a mesma que a fase 4
  // deu para os indicadores que o dado não sustenta (D-90): a coluna sai da tabela
  // e o fato vira uma frase COM O DENOMINADOR, uma vez, ao pé dela.
  //
  // Quando a condição VARIA entre as sessões — que não acontece no acervo carregado,
  // e por isso mesmo tem de estar escrito no código e não no comentário — a coluna
  // volta a existir e a frase não é escrita.
  // -------------------------------------------------------------------------
  const gratuitas = ocorrencias.filter((o) => o.gratuito).length;
  const esgotadas = ocorrencias.filter((o) => o.esgotado).length;
  const condicaoUniforme =
    ocorrencias.length > 0 &&
    (gratuitas === 0 || gratuitas === ocorrencias.length) &&
    (esgotadas === 0 || esgotadas === ocorrencias.length);
  const semEspaco = ocorrencias.filter((o) => !o.espaco).length;
  const espacoUniforme =
    ocorrencias.length > 0 &&
    new Set(ocorrencias.map((o) => `${o.espaco ?? ""}|${o.origemDoEspaco ?? ""}`)).size === 1;

  const rotuloDaTemporada = (id?: string): string => {
    const temporada = id ? temporadas.find((t) => t.id === id) : undefined;
    if (!temporada) return "sem temporada declarada";
    if (temporada.dataDeclarada) return temporada.dataDeclarada;
    if (temporada.inicio && temporada.fim) {
      return `${curta(temporada.inicio)} a ${curta(temporada.fim)}`;
    }
    if (temporada.inicio) return curta(temporada.inicio);
    return "temporada sem período declarado";
  };

  /**
   * D-43 nas três leituras, dentro de uma célula de tabela. «Não declarado» e
   * «declarado ausente» NÃO são achatados num «não tem»: a coluna carrega o estado
   * no atributo e o texto diz qual dos três é.
   */
  const acessoDaSessao = (o: OcorrenciaExibivel) => {
    const recursos = o.recursosDeclarados ?? 0;
    if (recursos > 0) return { estado: "presente", texto: `${recursos} de 8 declarados` };
    if (o.declaraAcessibilidade) {
      return { estado: "ausente-declarada", texto: "declarado ausente" };
    }
    return { estado: "nao-declarada", texto: "não declarado" };
  };

  return (
    <section className={`flex flex-col gap-3 ${className ?? ""}`}>
      {/* ------------------------------------------------------------------ */}
      {/* A CONTAGEM NO TOPO — D-42, literalmente: «6 sessões · a próxima      */}
      {/* sábado, 20h».                                                       */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col gap-1">
        <h2
          data-ocorrencias-total={ocorrencias.length}
          className="text-lg leading-tight font-bold"
        >
          {ocorrencias.length === 0
            ? "Sem sessões datadas"
            : `${ocorrencias.length} ${ocorrencias.length === 1 ? "sessão" : "sessões"}`}
          {proxima ? ` · a próxima ${porExtenso(proxima.inicio)}` : ""}
        </h2>

        {ocorrencias.length > 0 && !proxima ? (
          <p className="text-xs leading-relaxed text-black/60">
            {`Nenhuma sessão futura em relação à data de referência: ${
              ocorrencias.length === 1
                ? "a sessão listada já passou"
                : "as sessões listadas já passaram"
            }. Elas continuam na tela porque o registro do evento é o mesmo — o que mudou foi a data em que este protótipo foi gerado.`}
          </p>
        ) : null}

        {/* A data de referência só é dita onde ela decide alguma coisa. No evento
            histórico, que não tem sessão nenhuma, ela seria ruído. */}
        {ocorrencias.length ? (
          <p className="text-[0.65rem] tracking-wide text-black/40 uppercase">
            data de referência · {curta(dataDeReferencia)} · o protótipo é estático e
            «a próxima» é calculada contra a data em que ele foi gerado
          </p>
        ) : null}
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* CADA SESSÃO, SALVÁVEL ISOLADAMENTE                                  */}
      {/* ------------------------------------------------------------------ */}
      {ocorrencias.length ? (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* A MESMA LISTA NAS DUAS VISÕES (D-79/D-05). Na app ela é a pilha de   */}
          {/* cartões da fase 2; na web, `web-evento.css` a transforma em grade de */}
          {/* tabela com cabeçalho grudado — MESMO DOM, MESMO COMPONENTE, layout   */}
          {/* divergindo por CSS sob `[data-view=…]`. Não há `if (visao === …)`    */}
          {/* neste arquivo, e não pode haver.                                    */}
          {/* ----------------------------------------------------------------- */}
          <ul
            data-tabela-ocorrencias={ocorrencias.length}
            className={`ocorrencias-lista flex flex-col gap-2 ${
              condicaoUniforme ? "ocorrencias-condicao-uniforme" : ""
            } ${espacoUniforme ? "ocorrencias-espaco-uniforme" : ""}`}
          >
            {/* O cabeçalho da tabela. Nasce escondido e só a visão web o revela:
                dentro da moldura de 390 px ele seria uma linha de rótulos sem
                tabela embaixo. `aria-hidden` porque na app ele não existe para
                ninguém, e na web ele rotula colunas que a própria célula já
                nomeia em texto para quem lê por leitor de tela. */}
            <li aria-hidden className="ocorrencia-cabecalho">
              <span className="ocorrencia-dia-curto">data</span>
              <span className="ocorrencia-hora">horário</span>
              <span className="ocorrencia-temporada">temporada</span>
              <span className="ocorrencia-espaco">espaço</span>
              <span className="ocorrencia-acesso">acessibilidade</span>
              <span className="ocorrencia-condicao">condição</span>
              <span className="ocorrencia-salvar">salvar</span>
            </li>

            {ocorrencias.map((ocorrencia) => {
              const salvo = salvos.includes(ocorrencia.id);
              const hora = horaCurta(ocorrencia.inicio);
              const acesso = acessoDaSessao(ocorrencia);
              return (
                <li
                  key={ocorrencia.id}
                  data-ocorrencia={ocorrencia.id}
                  className="ocorrencia-linha flex flex-col gap-1.5 rounded-xl border border-black/10 p-3"
                >
                  {/* Uma frase na app, DUAS CÉLULAS na web. O separador é elemento
                      próprio porque na tabela ele não existe — e a alternativa,
                      escrever a data duas vezes, poria o mesmo fato em dois lugares
                      que divergem na primeira correção. */}
                  <p className="ocorrencia-quando text-sm font-semibold">
                    <span className="ocorrencia-dia">{diaPorExtenso(ocorrencia.inicio)}</span>
                    <span className="ocorrencia-dia-curto">{diaCurto(ocorrencia.inicio)}</span>
                    <span className="ocorrencia-sep">{hora ? ", " : " · "}</span>
                    <span className="ocorrencia-hora">{hora ? hora : "sem horário"}</span>
                  </p>

                  <p className="ocorrencia-condicao flex flex-wrap gap-x-2 gap-y-1 text-xs text-black/60">
                    <span className="font-semibold">
                      {ocorrencia.gratuito ? "sessão gratuita" : "sessão com ingresso"}
                    </span>
                    {ocorrencia.esgotado ? <span>· esgotada</span> : null}
                  </p>

                  {/* Espaço, nos três caminhos e nesta ordem. O terceiro é uma FRASE, não
                      um traço: `espacoId` é `null` nas 2.425 ocorrências do grafo, e um
                      traço faria parecer defeito de tela em vez de lacuna do acervo.
                      Na tabela a frase inteira, repetida 53 vezes, seria uma parede de
                      texto — então a célula leva o rótulo curto e a frase inteira é dita
                      UMA vez, com o denominador, ao pé da tabela. */}
                  {ocorrencia.espaco ? (
                    <p className="ocorrencia-espaco text-xs text-black/60">
                      {ocorrencia.espaco}
                      <span className="ocorrencia-espaco-origem text-[0.65rem] tracking-wide text-black/40 uppercase">
                        {" "}
                        · espaço declarado{" "}
                        {ocorrencia.origemDoEspaco === "temporada"
                          ? "na temporada"
                          : "no registro do evento"}
                      </span>
                    </p>
                  ) : (
                    <p className="ocorrencia-espaco text-xs leading-relaxed text-black/55">
                      <span className="ocorrencia-espaco-curto">não publicado</span>
                      <span className="ocorrencia-espaco-longo">
                        O acervo do Itaú Cultural não publica o espaço desta sessão. O
                        evento declara período, não endereço de cada data.
                      </span>
                    </p>
                  )}

                  {/* O texto deixa explícito O QUE foi salvo: a sessão, não o evento. É o
                      que prepara Meu Repertório sem entregá-lo. */}
                  <button
                    type="button"
                    aria-pressed={salvo}
                    onClick={() => alternarSalvo(ocorrencia.id)}
                    className={`ocorrencia-salvar w-fit cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                      salvo
                        ? "border-acao bg-acao text-[var(--ic-branco)]"
                        : "border-black/25 text-[var(--ic-preto)] hover:border-[var(--ic-preto)]"
                    }`}
                  >
                    {salvo ? "sessão salva — tocar para remover" : "salvar esta sessão"}
                  </button>

                  {/* AS DUAS CÉLULAS QUE SÓ A TABELA TEM, no fim do DOM de propósito:
                      assim a ordem que a visão app desenha é, item a item, a mesma que
                      a fase 2 deixou, e quem reordena para a web é o `order` do CSS. */}
                  <p className="ocorrencia-temporada">
                    {rotuloDaTemporada(ocorrencia.temporadaId)}
                  </p>
                  <p className="ocorrencia-acesso" data-coluna-acessibilidade={acesso.estado}>
                    {acesso.texto}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* O QUE A TABELA TIROU DE COLUNA, DITO UMA VEZ COM O DENOMINADOR (D-90).
              Só a visão web mostra este parágrafo, porque só nela existe a tabela de
              onde estes fatos saíram. */}
          <p className="ocorrencia-nota-tabela">
            {condicaoUniforme
              ? `${gratuitas === ocorrencias.length ? "As" : "Nenhuma das"} ${
                  ocorrencias.length
                } sessões deste evento ${
                  gratuitas === ocorrencias.length ? "são gratuitas" : "é gratuita"
                } e ${
                  esgotadas === 0 ? "nenhuma está esgotada" : "todas estão esgotadas"
                }: a condição não varia entre elas, e por isso ela é dita aqui em vez de repetida em ${ocorrencias.length} linhas iguais. `
              : `A condição varia entre as ${ocorrencias.length} sessões e por isso continua em coluna. `}
            {semEspaco === ocorrencias.length
              ? `O acervo não publica o espaço de nenhuma das ${ocorrencias.length}: o registro declara período, não endereço de cada data — e por isso o espaço também não é coluna. `
              : espacoUniforme && semEspaco === 0
                ? `As ${ocorrencias.length} sessões acontecem em ${ocorrencias[0].espaco}, espaço declarado ${
                    ocorrencias[0].origemDoEspaco === "temporada"
                      ? "na temporada"
                      : "no registro do evento"
                  }. `
                : semEspaco > 0
                  ? `O acervo não publica o espaço de ${semEspaco} das ${ocorrencias.length} sessões. `
                  : ""}
            A acessibilidade é declarada no registro do evento e herdada por cada sessão —
            a coluna repete a mesma declaração em todas as linhas porque é isso que o
            acervo afirma, e não porque a tabela esteja duplicando dado.
          </p>
        </>
      ) : (
        /* ---------------------------------------------------------------- */
        /* EVENTO SEM OCORRÊNCIA É CASO NORMAL, não erro: os eventos da       */
        /* Enciclopédia são históricos. Mostramos a data DECLARADA, exatamente */
        /* como a fonte a escreveu, e dizemos que é registro e não cartaz.     */
        /* ---------------------------------------------------------------- */
        <div className="flex flex-col gap-2">
          {temporadas.length ? (
            temporadas.map((temporada) => (
              <p
                key={temporada.id}
                data-data-declarada={temporada.dataDeclarada ?? ""}
                className="rounded-xl border border-black/10 p-3 text-sm"
              >
                <span className="font-semibold">
                  {temporada.dataDeclarada ??
                    (temporada.inicio ? curta(temporada.inicio) : "sem data declarada")}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-black/55">
                  Data histórica de registro, transcrita da fonte como ela a escreveu. Não
                  é sessão em cartaz: este evento aconteceu e está no acervo como memória,
                  não como programação.
                </span>
              </p>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-black/20 p-3 text-xs leading-relaxed text-black/60">
              Este registro não declara período nem sessão: o acervo guarda o evento sem
              nenhuma data associada a ele.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
