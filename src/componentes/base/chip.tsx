import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * chip.tsx — a primeira primitiva de `base/`, e a que o projeto mais devia.
 *
 * O QUE ELA SUBSTITUI. Havia OITO vocabulários de pílula no projeto, cada um com
 * seu raio, seu padding, seu tamanho de fonte e sua ideia do que «selecionado»
 * parece: contorno laranja em `/buscar`, fundo laranja em `/play`, fundo preto
 * na estrelinha. Sete deles empilhavam em `flex flex-wrap`, então dentro da
 * moldura de 390px o trilho de filtros quebrava em duas ou três linhas tortas —
 * a «linha quebrada feia» que abriu esta reformulação. Este arquivo é o único
 * vocabulário, e `docs/DESIGN-SYSTEM.md` §4 já o especificava desde agosto.
 *
 * SELECIONADO É PRETO CHEIO, e a razão não é gosto. Branco sobre o laranja da
 * marca mede 2,64:1 e reprova o mínimo de 4,5:1; a tinta sobre o papel mede
 * 21:1 no escuro e 18,7:1 no claro. O chip preto também deixa o laranja livre
 * para significar só AÇÃO — que é o princípio 2 do design system.
 *
 * A CONTAGEM É SEMPRE O ÚLTIMO FILHO. Não é detalhe de layout: o portão de
 * `/play` lê `chip.innerText.match(/(\d+)\s*$/)` para conferir que o número
 * anunciado bate com o número entregue. Soldar a posição na primitiva é o que
 * impede que a próxima tela quebre esse contrato sem ninguém perceber.
 */

type PropsComuns = {
  /**
   * A contagem opcional, renderizada como último nó de texto do chip.
   * Aceita nó para casos como «3 de 113», que o portão de /play lê inteiro.
   */
  contagem?: ReactNode;
  /** Vira `data-denominador` no span da contagem — os portões procuram por ele. */
  chaveDaContagem?: string;
  /**
   * O NOME DO TOKEN de cor vindo do dado (`"--ic-lilas"`), nunca um hex e nunca
   * uma cor decidida aqui. Mesmo mecanismo de `selo-linguagem.tsx`: a cor de
   * linguagem é DADO, e um mapa linguagem→cor em TypeScript seria a segunda
   * fonte de verdade que D-08 existe para impedir.
   */
  cor?: string;
  children: ReactNode;
  className?: string;
};

type PropsBotao = PropsComuns &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "color"> & {
    /** Vira `aria-pressed`. O desenho sai do atributo de acessibilidade, nunca de
     *  uma classe paralela — assim não há como o visual e o anunciado divergirem. */
    selecionado?: boolean;
    href?: never;
  };

type PropsLink = PropsComuns &
  Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "className" | "href" | "color"> & {
    /** Chip que NAVEGA em vez de recortar. Sem `aria-pressed`: não é um estado
     *  de filtro, é um destino, e anunciá-lo como alternável seria mentira. */
    href: string;
    selecionado?: never;
  };

export type PropsChip = PropsBotao | PropsLink;

function Miolo({ cor, contagem, chaveDaContagem, children }: PropsComuns) {
  return (
    <>
      {cor ? <span aria-hidden className="chip-ponto" /> : null}
      <span className="chip-rotulo">{children}</span>
      {contagem != null ? (
        <span className="chip-n" data-denominador={chaveDaContagem}>
          {contagem}
        </span>
      ) : null}
    </>
  );
}

export function Chip(props: PropsChip) {
  const { contagem, chaveDaContagem, cor, children, className, ...resto } = props;
  const classe = `chip${className ? ` ${className}` : ""}`;
  const estilo = cor ? ({ "--cor-chip": `var(${cor})` } as CSSProperties) : undefined;
  const miolo = (
    <Miolo cor={cor} contagem={contagem} chaveDaContagem={chaveDaContagem}>
      {children}
    </Miolo>
  );

  if ("href" in resto && resto.href) {
    const { selecionado: _naoUsado, ...deLink } = resto as PropsLink;
    return (
      <Link {...deLink} className={classe} style={estilo}>
        {miolo}
      </Link>
    );
  }

  const { selecionado, ...deBotao } = resto as PropsBotao;
  return (
    <button
      type="button"
      // `selecionado ?? false` e não `selecionado || undefined`: omitir o
      // atributo faria o portão de /play ler `null` onde espera a string
      // "false", e um leitor de tela deixaria de anunciar que o chip é
      // alternável. Um chip sem estado anunciado é um botão mudo.
      aria-pressed={selecionado ?? false}
      {...deBotao}
      className={classe}
      style={estilo}
    >
      {miolo}
    </button>
  );
}

/**
 * O trilho: uma fileira que ROLA na horizontal em vez de quebrar linha.
 *
 * Na visão web ele volta a quebrar linha — lá há largura de sobra e rolagem
 * horizontal seria pior. Isso mora no CSS, sob `[data-view="web"]`, e não num
 * ramo de JavaScript: mesma árvore de JSX, outra medida (D-05).
 */
export function TrilhoDeChips({
  rotulo,
  children,
  className,
  ...resto
}: { rotulo: string } & Omit<ComponentPropsWithoutRef<"div">, "className"> & {
    className?: string;
  }) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={`trilho-chips${className ? ` ${className}` : ""}`}
      {...resto}
    >
      {children}
    </div>
  );
}
