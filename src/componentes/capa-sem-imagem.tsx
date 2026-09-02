import { Grafismo } from "@/componentes/grafismo";
import { linguagemPorId } from "@/componentes/selo-linguagem";
import { rotuloDaClasse } from "@/lib/rotulos";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * capa-sem-imagem.tsx — a aparência DOMINANTE do feed, não uma reserva.
 *
 * MEDIÇÃO QUE DEFINE ESTE ARQUIVO (M-6): 1.019 das 7.810 entidades do grafo têm imagem
 * local. Nas classes que mais aparecem no feed a cobertura é pior ainda — evento 13 de
 * 300, conteúdo 68 de 1.805, espaço 0 de 113, trilha 0 de 1. Cerca de 78% dos cartões
 * caem aqui. Isto não é o estado de exceção do cartão: é o cartão.
 *
 * Se esta capa parecer defeito, a tela inteira parece quebrada na projeção — e o
 * argumento da proposta morre num detalhe de imagem que ninguém escolheu. Por isso ela é
 * COMPOSIÇÃO DE MARCA e não placeholder cinza: campo de cor da linguagem, o `\` do Itaú
 * Cultural repetido em diagonal como textura, e o nome da classe numa pastilha branca.
 *
 * A COR VEM DO DADO (D-08). `vocabulario.linguagens[].cor` guarda o NOME DO TOKEN CSS
 * da linguagem, o hex mora só em `globals.css`, e a resolução acontece exatamente
 * como em `selo-linguagem.tsx`: custom property inline, utilitário lendo
 * `var(--cor-linguagem)`. É PROIBIDO escrever qualquer associação linguagem→cor neste
 * arquivo, em qualquer outro `.ts`/`.tsx` ou no CSS — a fase 1 fechou esse contrato e há
 * gate de verificação medindo. Sem linguagem, cai para `--ic-preto`, como o selo faz.
 *
 * O TEXTO NUNCA ENCOSTA NA COR CRUA. Os tokens de apoio vão de um roxo escuro a um
 * amarelo claro, e nenhum código aqui pode saber qual é qual — saber seria justamente a
 * associação proibida. A saída é de composição, não de condicional: a pastilha do rótulo
 * é branca com texto preto, legível sobre qualquer preenchimento, e o que fica direto
 * sobre a cor é só o grafismo, que é textura e não informação — em duas camadas
 * deslocadas, uma clara e uma escura, para que uma delas apareça em qualquer fundo.
 */

/** Quantas barras compõem a textura. Número par, para a diagonal fechar bonito. */
const BARRAS = 14;

/** Uma camada da textura: o `\` do manual repetido, herdando a cor por `currentColor`. */
function Textura({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -inset-4 flex flex-wrap content-center justify-center gap-2 ${className}`}
    >
      {Array.from({ length: BARRAS }, (_, i) => (
        <Grafismo key={i} variacao="barra" className="h-9 w-auto" />
      ))}
    </div>
  );
}

export function CapaSemImagem({
  titulo,
  classe,
  rotulo,
  linguagens,
  className,
  compacta,
}: {
  titulo: string;
  classe: ClasseEntidade;
  /**
   * O que a pastilha DIZ, quando o nome da classe no modelo não é o que a tela
   * quer mostrar. Em Cast as 336 são todas mídia, e «MIDIA» sobre a capa é o
   * vocabulário do banco vazando para a tela: ali a pastilha diz «Podcast».
   * Ausente, continua dizendo a classe — que é o que o feed e a busca precisam.
   */
  rotulo?: string;
  linguagens: string[];
  className?: string;
  /**
   * Sem pastilha — a tela já etiqueta o tipo ao lado. O `alt` continua
   * anunciando que não há imagem no acervo.
   */
  compacta?: boolean;
}) {
  // Primeira linguagem que o vocabulário conhece. `find` e não `[0]`: a entidade pode
  // declarar uma linguagem que o vocabulário não promoveu, e cair no preto por causa
  // disso esconderia a cor que existe na segunda.
  const linguagem = linguagens.map(linguagemPorId).find(Boolean);
  const token = linguagem?.cor?.trim() ? linguagem.cor.trim() : "--ic-preto";

  return (
    <div
      role="img"
      aria-label={`${titulo} — sem imagem no acervo`}
      style={{ "--cor-linguagem": `var(${token})` } as React.CSSProperties}
      className={`capa-sem-imagem relative flex overflow-hidden bg-[var(--cor-linguagem)] ${className ?? ""}`}
    >
      {/* Textura de marca EM RELEVO, e o relevo não é enfeite: é a saída para o problema
          de contraste. Os tokens de apoio vão de um roxo escuro a um amarelo claro, e
          este arquivo NÃO PODE saber qual é qual — saber seria a associação proibida.
          Uma textura branca some no amarelo; uma preta some no roxo. Duas camadas
          deslocadas em 1px, uma clara e uma escura, deixam sempre uma das duas legível,
          seja qual for o preenchimento, sem uma linha de código sobre cor. */}
      <Textura className="-translate-x-px -translate-y-px text-[var(--ic-branco)] opacity-30" />
      <Textura className="translate-x-px translate-y-px text-[var(--ic-preto)] opacity-[0.16]" />

      {compacta ? null : (
        <span className="relative m-2 mt-auto rounded-full bg-[var(--ic-branco)] px-2 py-0.5 text-[0.65rem] font-bold tracking-widest text-[var(--ic-preto)] uppercase">
          {rotulo ?? rotuloDaClasse(classe)}
        </span>
      )}
    </div>
  );
}

/**
 * A capa do cartão: a imagem do acervo quando existe, a composição acima quando não.
 *
 * Crédito de imagem é obrigatório quando há imagem — o acervo é de terceiros e a
 * procedência é argumento da proposta, não rodapé.
 */
export function CapaDeCartao({
  titulo,
  classe,
  rotulo,
  linguagens,
  imagem,
  creditoImagem,
  className,
  compacta,
  alt,
  prioridade,
}: {
  titulo: string;
  classe: ClasseEntidade;
  /** O texto da pastilha quando a classe do modelo não é o que a tela diz — ver `CapaSemImagem`. */
  rotulo?: string;
  linguagens: string[];
  imagem?: string | null;
  creditoImagem?: string | null;
  className?: string;
  /**
   * Sem pastilha e sem faixa de crédito — a tela já etiqueta o tipo ao lado.
   * O crédito continua no `alt`, que é onde quem não vê a imagem o encontra.
   */
  compacta?: boolean;
  /** Substitui o alt composto. Use quando a fonte já descreve a foto (`imagemAlt`). */
  alt?: string;
  /** A peça de abertura: baixa na hora, não preguiçosa. */
  prioridade?: boolean;
}) {
  if (!imagem) {
    return (
      <CapaSemImagem
        titulo={titulo}
        classe={classe}
        rotulo={rotulo}
        linguagens={linguagens}
        className={className}
        compacta={compacta}
      />
    );
  }

  const altFinal = alt?.trim() || (creditoImagem ? `${titulo}. ${creditoImagem}` : titulo);

  return (
    <div className={`relative flex overflow-hidden bg-superficie-2 ${className ?? ""}`}>
      {/* `images: { unoptimized: true }` sob output: "export" — `next/image` não traria
          nada aqui além de peso, e o arquivo já está servido de `public/acervo`. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagem}
        alt={altFinal}
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      {compacta ? null : (
        <span className="relative m-2 mt-auto rounded-full bg-[var(--ic-branco)] px-2 py-0.5 text-[0.65rem] font-bold tracking-widest text-[var(--ic-preto)] uppercase">
          {rotulo ?? rotuloDaClasse(classe)}
        </span>
      )}
      {compacta || !creditoImagem ? null : (
        <span className="absolute right-0 bottom-0 max-w-[70%] truncate bg-[var(--ic-preto)]/70 px-1.5 py-0.5 text-[0.6rem] text-[var(--ic-branco)]">
          {creditoImagem}
        </span>
      )}
    </div>
  );
}
