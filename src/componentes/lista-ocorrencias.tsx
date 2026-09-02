"use client";

import { SaibaMais } from "@/componentes/base/saiba-mais";
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

        {/* O PARÁGRAFO VIROU POPUP (2026-09). Ele explicava, em quatro linhas no
            corpo da ficha, por que as sessões listadas já passaram — informação
            correta, e a primeira coisa que alguém lia sobre o evento. Na tela fica
            o fato em uma linha; o argumento inteiro abre no «Por que estas datas?»,
            palavra por palavra. */}
        {ocorrencias.length > 0 && !proxima ? (
          <div className="flex flex-col items-start gap-1">
            <p className="text-xs leading-relaxed text-tinta-2">
              {ocorrencias.length === 1
                ? "A sessão listada já passou."
                : "As sessões listadas já passaram."}
            </p>
            <SaibaMais rotulo="Por que estas datas?" titulo="Por que estas datas">
              <p>
                {`Nenhuma sessão futura em relação à data de referência: ${
                  ocorrencias.length === 1
                    ? "a sessão listada já passou"
                    : "as sessões listadas já passaram"
                }. Elas continuam na tela porque o registro do evento é o mesmo — o que mudou foi a data em que este protótipo foi gerado.`}
              </p>
              <p>
                {`A data de referência deste protótipo é ${curta(dataDeReferencia)}. Ela existe para que o comportamento da tela seja o mesmo hoje e daqui a seis meses: sem uma data fixa, «próxima sessão» mudaria de resposta a cada dia e a demonstração deixaria de ser reproduzível.`}
              </p>
            </SaibaMais>
          </div>
        ) : null}

        {/* A data de referência só é dita onde ela decide alguma coisa. No evento
            histórico, que não tem sessão nenhuma, ela seria ruído. */}
        {ocorrencias.length ? (
          <p className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
            data de referência · {curta(dataDeReferencia)}
          </p>
        ) : null}
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* CADA SESSÃO, SALVÁVEL ISOLADAMENTE                                  */}
      {/* ------------------------------------------------------------------ */}
      {ocorrencias.length ? (
        <>
          <ul className="ocorrencias-lista flex flex-col gap-2">
            {ocorrencias.map((ocorrencia) => {
              const salvo = salvos.includes(ocorrencia.id);
              const hora = horaCurta(ocorrencia.inicio);
              return (
                <li
                  key={ocorrencia.id}
                  data-ocorrencia={ocorrencia.id}
                  className="ocorrencia-linha flex flex-col gap-1.5 rounded-xl border border-borda p-3"
                >
                  <p className="ocorrencia-quando text-sm font-semibold">
                    <span className="ocorrencia-dia">{diaPorExtenso(ocorrencia.inicio)}</span>
                    <span className="ocorrencia-sep">{hora ? ", " : " · "}</span>
                    <span className="ocorrencia-hora">{hora ? hora : "sem horário"}</span>
                  </p>

                  <p className="ocorrencia-condicao flex flex-wrap gap-x-2 gap-y-1 text-xs text-tinta-2">
                    <span className="font-semibold">
                      {ocorrencia.gratuito ? "sessão gratuita" : "sessão com ingresso"}
                    </span>
                    {ocorrencia.esgotado ? <span>· esgotada</span> : null}
                  </p>

                  {/* Espaço, nos dois caminhos e nesta ordem. O segundo é uma FRASE, não
                      um traço: `espacoId` é `null` nas 2.425 ocorrências do grafo, e um
                      traço faria parecer defeito de tela em vez de lacuna do acervo. */}
                  {ocorrencia.espaco ? (
                    <p className="ocorrencia-espaco text-xs text-tinta-2">
                      {ocorrencia.espaco}
                      <span className="ocorrencia-espaco-origem text-[0.65rem] tracking-wide text-tinta-3 uppercase">
                        {" "}
                        · espaço declarado{" "}
                        {ocorrencia.origemDoEspaco === "temporada"
                          ? "na temporada"
                          : "no registro do evento"}
                      </span>
                    </p>
                  ) : (
                    <p className="ocorrencia-espaco text-xs leading-relaxed text-tinta-2">
                      O acervo não publica o espaço desta sessão.
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
                        ? "border-acao bg-acao text-sobre-acao"
                        : "border-borda-forte text-tinta hover:border-tinta"
                    }`}
                  >
                    {salvo ? "sessão salva — tocar para remover" : "salvar esta sessão"}
                  </button>

                </li>
              );
            })}
          </ul>

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
                className="rounded-xl border border-borda p-3 text-sm"
              >
                <span className="font-semibold">
                  {temporada.dataDeclarada ??
                    (temporada.inicio ? curta(temporada.inicio) : "sem data declarada")}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-tinta-2">
                  Data histórica de registro, transcrita da fonte. Não é sessão em cartaz.
                </span>
              </p>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-borda p-3 text-xs leading-relaxed text-tinta-2">
              Este registro não declara período nem sessão.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
