import type { Entidade } from "@/dados/tipos";

/**
 * verbete.tsx — D-39: o verbete da Enciclopédia mora AQUI DENTRO.
 *
 * A decisão foi «embutido», e ela é o oposto exato de «veja na Enciclopédia». O link para
 * `fonte` existe, mas ele é PROCEDÊNCIA, não destino: quem chegou nesta tela não deve ter
 * de sair dela para saber quem é a pessoa. A Enciclopédia sabe quem o artista é e não sabe
 * que ele toca no sábado; a agenda sabe do sábado e não sabe quem ele é. Mandar o leitor
 * para fora é reproduzir a separação que a proposta existe para fechar.
 *
 * T-02-15: o texto é do Itaú Cultural e por isso o crédito é obrigatório e visível, não
 * rodapé. Verbete sem crédito faria texto do IC circular sem atribuição.
 *
 * MEDIÇÃO QUE DEFINE O ESTADO VAZIO — e ela é dura: das 56 pessoas que têm evento no grafo
 * carregado, o maior `resumo` tem 66 caracteres e NENHUMA passa de 100. As 94 pessoas com
 * verbete de 200+ caracteres não têm nenhum evento. Ou seja: exatamente nas páginas onde a
 * ponte se prova, o verbete chega curto ou vazio.
 *
 * A resposta a isso é declarar, nunca completar. O bloco renderiza SEMPRE — com o que
 * houver, e com uma linha dizendo que a Enciclopédia não publica texto mais longo para
 * aquela entrada, e o link para conferir na fonte. Bloco que some faz a ponte parecer não
 * existir. Bloco declarado prova que ela existe e que o dado é que é curto. Gerar resumo
 * com modelo de linguagem produziria biografia inventada de pessoa real assinada pelo
 * Itaú Cultural, que é o pior desfecho possível para esta tela.
 *
 * Todo texto entra como nó de texto do React; nenhum `dangerouslySetInnerHTML` (T-02-16).
 */

/** Só o que o verbete precisa. Aceita a entidade inteira sem exigir campos que não usa. */
type EntidadeComVerbete = Pick<Entidade, "titulo" | "procedencia"> &
  Partial<Pick<Entidade, "resumo" | "fonte">>;

/**
 * Abaixo disto o texto é tratado como «existe, mas é curto» — e a tela diz isso. 140
 * caracteres é cerca de duas linhas na moldura de 390px: menos que isso não chega a ser
 * um verbete, é uma legenda. O número está aqui, e não espalhado, para ser auditável.
 */
const MINIMO_DE_VERBETE = 140;

/**
 * De onde o texto veio, a partir da URL da fonte. O acervo tem DOIS sistemas e eles não se
 * creditam igual: a Enciclopédia é obra de referência, com verbete assinado; a agenda é
 * publicação do site, com resumo de divulgação. Creditar os dois como «Enciclopédia» seria
 * atribuição errada, e chamar de «verbete» a chamada de uma matéria de agenda também.
 *
 * O artigo viaja junto com o nome porque a frase é montada em português e «a site do Itaú
 * Cultural» é erro de concordância que aparece na tela.
 */
interface ProcedenciaDoTexto {
  nome: string;
  artigo: string;
  /** Como o próprio sistema chama a peça de texto que publica. */
  peca: string;
  /** Cabeçalho do bloco. */
  rotulo: string;
}

function procedenciaDoTexto(fonte?: string): ProcedenciaDoTexto {
  if (fonte?.includes("enciclopedia.itaucultural")) {
    return {
      nome: "Enciclopédia Itaú Cultural",
      artigo: "A",
      peca: "verbete",
      rotulo: "Verbete",
    };
  }
  if (fonte?.includes("itaucultural")) {
    return { nome: "site do Itaú Cultural", artigo: "O", peca: "resumo", rotulo: "Resumo" };
  }
  return { nome: "acervo do Itaú Cultural", artigo: "O", peca: "texto", rotulo: "Texto do acervo" };
}

export function Verbete({
  entidade,
  className,
}: {
  entidade: EntidadeComVerbete;
  className?: string;
}) {
  const texto = entidade.resumo?.trim() ?? "";
  const fonte = procedenciaDoTexto(entidade.fonte);

  // Dois estados de falta, e eles não são a mesma coisa: um é «não há texto», o outro é
  // «há texto e ele não chega a ser um verbete». A tela diz qual dos dois.
  const vazio = !texto ? "sem-texto" : texto.length < MINIMO_DE_VERBETE ? "curto" : undefined;

  // As frases são montadas como string única, e não fatiadas em JSX: interpolação
  // quebrada em linhas põe espaço antes da vírgula no HTML gerado.
  const frasePorExtensoDoVazio =
    `${fonte.artigo} ${fonte.nome} tem uma entrada para ${entidade.titulo}, e essa entrada ` +
    `não traz texto descritivo — só o registro de que ela existe no acervo e as ligações ` +
    `que partem dela. Nada foi escrito aqui no lugar do que a fonte não publicou.`;

  const fraseDoTextoCurto =
    `É esse o texto inteiro: ${fonte.artigo.toLowerCase()} ${fonte.nome} não publica ` +
    `${fonte.peca} mais longo para esta entrada. Mantivemos o que há, na íntegra, em vez ` +
    `de completar a lacuna.`;

  return (
    <section
      data-verbete={entidade.procedencia}
      data-verbete-vazio={vazio}
      className={`flex flex-col gap-2 rounded-xl border-l-4 border-black/80 bg-black/[0.03] p-3 ${className ?? ""}`}
    >
      <h3 className="text-[0.65rem] font-bold tracking-widest text-black/55 uppercase">
        {fonte.rotulo} · {fonte.nome}
      </h3>

      {texto ? (
        <p className="text-sm leading-relaxed">{texto}</p>
      ) : (
        <p className="text-sm leading-relaxed text-black/60 italic">{frasePorExtensoDoVazio}</p>
      )}

      {vazio === "curto" ? (
        <p className="text-xs leading-relaxed text-black/60">{fraseDoTextoCurto}</p>
      ) : null}

      {entidade.fonte ? (
        <a
          href={entidade.fonte}
          rel="noreferrer"
          className="w-fit text-xs font-semibold text-acao underline underline-offset-2"
        >
          conferir a entrada na fonte
        </a>
      ) : (
        <p className="text-xs text-black/45">
          Esta entrada não registra URL de origem no acervo.
        </p>
      )}
    </section>
  );
}
