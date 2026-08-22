import { Grafismo } from "@/componentes/grafismo";
import { linguagemPorId } from "@/componentes/selo-linguagem";
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
  linguagens,
  className,
}: {
  titulo: string;
  classe: ClasseEntidade;
  linguagens: string[];
  className?: string;
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

      <span className="relative m-2 mt-auto rounded-full bg-[var(--ic-branco)] px-2 py-0.5 text-[0.65rem] font-bold tracking-widest text-[var(--ic-preto)] uppercase">
        {classe}
      </span>
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
  linguagens,
  imagem,
  creditoImagem,
  className,
}: {
  titulo: string;
  classe: ClasseEntidade;
  linguagens: string[];
  imagem?: string;
  creditoImagem?: string;
  className?: string;
}) {
  if (!imagem) {
    return (
      <CapaSemImagem
        titulo={titulo}
        classe={classe}
        linguagens={linguagens}
        className={className}
      />
    );
  }

  return (
    <div className={`relative flex overflow-hidden bg-black/5 ${className ?? ""}`}>
      {/* `images: { unoptimized: true }` sob output: "export" — `next/image` não traria
          nada aqui além de peso, e o arquivo já está servido de `public/acervo`. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagem}
        alt={titulo}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <span className="relative m-2 mt-auto rounded-full bg-[var(--ic-branco)] px-2 py-0.5 text-[0.65rem] font-bold tracking-widest text-[var(--ic-preto)] uppercase">
        {classe}
      </span>
      {creditoImagem ? (
        <span className="absolute right-0 bottom-0 max-w-[70%] truncate bg-[var(--ic-preto)]/70 px-1.5 py-0.5 text-[0.6rem] text-[var(--ic-branco)]">
          {creditoImagem}
        </span>
      ) : null}
    </div>
  );
}
