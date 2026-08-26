/**
 * studio-datas.ts — os ajudantes puros da jornada do produtor.
 *
 * Nasceu só com a aritmética de datas e cresceu para o que ela puxou junto: a contagem com
 * separador e a simplificação de texto da busca. O que reúne os três não é o assunto, é a
 * FRONTEIRA — são as funções que o cliente pode importar por valor sem arrastar dado, e é
 * por elas morarem aqui que as telas da jornada param de reescrevê-las uma a uma.
 *
 * NENHUM `new Date(string)` AQUI, E É O PONTO DO ARQUIVO. `new Date("2026-08-22")` é lido
 * como meia-noite UTC; qualquer leitor local (`getDate`, `getDay`) devolve, em fuso
 * brasileiro, o dia 21. Uma grade de sessões construída assim geraria a semana inteira
 * deslocada em um dia, e o defeito passaria por `tsc` e por `verificar-ds` sem um arranhão.
 *
 * A saída é aritmética em UTC do começo ao fim: `Date.UTC` para montar, `getUTC*` para ler.
 * O `Date` entra só como calculadora de calendário — quantos dias tem fevereiro, que dia da
 * semana cai o dia 3 — e nunca como relógio. Nada aqui lê a hora da máquina, então o
 * resultado é o mesmo no build, no navegador de quem avalia e no de quem apresenta.
 *
 * As funções são puras e sem import de dado: o cliente as usa por valor sem violar DP-F.
 */

/** `"AAAA-MM-DD"` → as três partes, em número. Devolve `null` se a forma não bate. */
export function partesDaData(iso: string): { ano: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

/** O instante UTC de uma data ISO, em milissegundos. `null` quando a forma não bate. */
function emUtc(iso: string): number | null {
  const p = partesDaData(iso);
  return p === null ? null : Date.UTC(p.ano, p.mes - 1, p.dia);
}

/** Milissegundos → `"AAAA-MM-DD"`, sempre pelos leitores UTC. */
function deUtc(ms: number): string {
  const d = new Date(ms);
  const a = String(d.getUTCFullYear()).padStart(4, "0");
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${a}-${m}-${dd}`;
}

const UM_DIA = 86_400_000;

/** Dia da semana, 0 = domingo. `null` quando a data não é legível. */
export function diaDaSemana(iso: string): number | null {
  const ms = emUtc(iso);
  return ms === null ? null : new Date(ms).getUTCDay();
}

/** `"2026-08-22"` + 3 → `"2026-08-25"`. */
export function somarDias(iso: string, dias: number): string {
  const ms = emUtc(iso);
  return ms === null ? iso : deUtc(ms + dias * UM_DIA);
}

/** Quantos dias separam duas datas ISO. Negativo quando `fim` vem antes de `inicio`. */
export function diasEntre(inicio: string, fim: string): number {
  const a = emUtc(inicio);
  const b = emUtc(fim);
  return a === null || b === null ? 0 : Math.round((b - a) / UM_DIA);
}

/**
 * `"2026-08-22"` → `"22.08.2026"`.
 *
 * A mesma regra de `repertorio.ts`, `alerta.ts` e `ocorrencias-studio.ts`, pelo mesmo
 * motivo: comparar `DD.MM.AAAA` como string é comparação quebrada, então a conversão
 * acontece uma vez, na saída, e nunca no meio de uma ordenação. Sem `toLocaleDateString`:
 * o separador não pode depender do locale da máquina que roda o build.
 */
export function dataCurta(iso: string): string {
  const p = partesDaData(iso);
  if (p === null) return iso;
  return `${String(p.dia).padStart(2, "0")}.${String(p.mes).padStart(2, "0")}.${p.ano}`;
}

/** `"2026-08-22T20:00"` → `"20:00"`. Fatia de string, sem passar por `Date`. */
export function horaDe(isoLongo: string): string {
  const m = /T(\d{2}:\d{2})/.exec(isoLongo);
  return m ? (m[1] as string) : "—";
}

/** `"2026-08-22T20:00"` → `"2026-08-22"`. */
export function dataDe(isoLongo: string): string {
  return isoLongo.slice(0, 10);
}

/** `"22.08.2026 às 20:00"` — a forma que a tela exibe. */
export function quandoPorExtenso(isoLongo: string): string {
  return `${dataCurta(dataDe(isoLongo))} às ${horaDe(isoLongo)}`;
}

/** Os sete dias, na ordem em que `getUTCDay` os numera. Índice 0 é domingo. */
export const DIAS_DA_SEMANA: readonly { indice: number; curto: string; longo: string }[] = [
  { indice: 0, curto: "dom", longo: "domingo" },
  { indice: 1, curto: "seg", longo: "segunda-feira" },
  { indice: 2, curto: "ter", longo: "terça-feira" },
  { indice: 3, curto: "qua", longo: "quarta-feira" },
  { indice: 4, curto: "qui", longo: "quinta-feira" },
  { indice: 5, curto: "sex", longo: "sexta-feira" },
  { indice: 6, curto: "sáb", longo: "sábado" },
];

/** `"20:00"` é hora válida? A grade recusa horário malformado antes de gerar. */
export function horaValida(hora: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

/**
 * O teto de sessões que um gerador produz de uma vez.
 *
 * UMA TEMPORADA LONGA MULTIPLICA RÁPIDO: 87 dias × 7 dias da semana × 3 horários passa de
 * mil linhas, e uma tabela de mil linhas montada de um clique é uma tela travada, não uma
 * grade. O teto vem ANTES de qualquer ajuste de desempenho — é a disciplina de limitar a
 * entrada em vez de otimizar o que veio.
 *
 * E ele é DECLARADO na tela: o gerador diz quantas gerou, quantas ficaram de fora e por qual
 * regra. Cortar em silêncio faria o produtor achar que declarou a temporada inteira.
 */
export const TETO_DE_SESSOES_GERADAS = 200;

export interface SessaoGerada {
  /** `"AAAA-MM-DDTHH:mm"`. */
  inicio: string;
}

export interface PreviaDaGrade {
  sessoes: SessaoGerada[];
  /** Quantas a regra produziria se não houvesse teto. */
  possiveis: number;
  /** Quantas ficaram de fora por causa do teto. */
  cortadas: number;
}

/**
 * As sessões que a regra produz dentro do intervalo da temporada.
 *
 * Percorre dia a dia em UTC. `dias` são índices de `getUTCDay`; `horarios` são `"HH:mm"`.
 * Devolve a lista ORDENADA e o que o teto deixou de fora — a prévia é o que a tela mostra
 * antes de aplicar, e aplicar sem ver seria a mesma cegueira que gerar sem contar.
 */
export function gerarSessoes(
  inicio: string,
  fim: string,
  dias: number[],
  horarios: string[],
): PreviaDaGrade {
  const validos = horarios.filter(horaValida).sort();
  const total = diasEntre(inicio, fim);
  if (total < 0 || dias.length === 0 || validos.length === 0) {
    return { sessoes: [], possiveis: 0, cortadas: 0 };
  }

  const todas: SessaoGerada[] = [];
  for (let i = 0; i <= total; i += 1) {
    const dia = somarDias(inicio, i);
    const semana = diaDaSemana(dia);
    if (semana === null || !dias.includes(semana)) continue;
    for (const h of validos) todas.push({ inicio: `${dia}T${h}` });
  }

  return {
    sessoes: todas.slice(0, TETO_DE_SESSOES_GERADAS),
    possiveis: todas.length,
    cortadas: Math.max(0, todas.length - TETO_DE_SESSOES_GERADAS),
  };
}

/**
 * `1304` → `"1.304"`.
 *
 * Sem `toLocaleString`: o separador não pode depender do locale da máquina que roda o build,
 * senão o número da tela muda de forma entre um build e outro. Mesma regra de
 * `ocorrencias-studio.ts` e `duplicatas.ts` — e é por ela existir aqui, num módulo que o
 * cliente pode importar por valor, que as telas da jornada param de reescrevê-la uma a uma.
 *
 * TODA CONTAGEM DA TELA PASSA POR AQUI. Duas grafias do mesmo número na mesma superfície
 * fazem quem lê gastar um segundo decidindo se são o mesmo, e num cabeçalho é o primeiro
 * segundo da tela.
 */
export function comSeparador(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  let saida = "";
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) saida += ".";
    saida += s[i];
  }
  return (n < 0 ? "-" : "") + saida;
}

/**
 * Tira acento e caixa, para a busca casar «Jose» com «José» e «Sao» com «São».
 *
 * A CLASSE DE COMBINAÇÃO VAI EM ESCAPE (`\u0300-\u036f`) e nunca como caractere literal. O
 * literal é invisível no código, e qualquer ferramenta que normalize o arquivo em NFC o
 * apagaria sem deixar rastro: a busca passaria a não achar nome nenhum com acento e o `tsc`
 * continuaria verde. Escrevi o literal duas vezes nesta sessão antes de a regra pegar — é a
 * razão de a função morar num lugar só.
 */
export function simplificar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
