/**
 * selo-nivel.tsx — o selo do nível, desenhado em SVG.
 *
 * SEIS FAIXAS DE TRÊS DEGRAUS, e não uma marca por nível.
 *
 * A versão anterior desenhava uma marca no anel para cada nível da escada. Isso
 * funcionava com cinco níveis e quebrou com dezoito: dezoito marcas num anel de
 * 100 unidades ficam a menos de um pixel de distância umas das outras, e o que a
 * pessoa vê é um contorno pontilhado sem informação nenhuma.
 *
 * A LEITURA AGORA TEM DUAS CAMADAS. A COR diz a faixa — são seis, na paleta da
 * marca, e trocar de cor é o acontecimento que se percebe de longe. Os TRÊS PONTOS
 * dizem a posição dentro da faixa. Dezoito estados distintos saem de um componente
 * só, sem nenhum arquivo de arte para produzir, revisar e versionar.
 *
 * O TEXTO NÃO É ESCOLHIDO NO OLHO. Cada faixa declara se o número por cima dela é
 * preto ou branco, e a escolha veio de medir contraste: o lilás (#7f3e98) mede
 * 3,04:1 contra preto e 6,90:1 contra branco — é a única faixa que inverte. As
 * outras cinco ficam acima de 5,6:1 com preto. Nenhuma fica abaixo de 4,5:1.
 */

/** As seis faixas, da chegada à permanência. `tinta` é a cor do número por cima. */
const FAIXAS = [
  { cor: "var(--ic-amarelo)", tinta: "var(--ic-preto)" },
  { cor: "var(--ic-laranja)", tinta: "var(--ic-preto)" },
  { cor: "var(--ic-rosa)", tinta: "var(--ic-preto)" },
  { cor: "var(--ic-lilas)", tinta: "var(--ic-branco)" },
  { cor: "var(--ic-azul)", tinta: "var(--ic-preto)" },
  { cor: "var(--ic-verde)", tinta: "var(--ic-preto)" },
] as const;

const DEGRAUS_POR_FAIXA = 3;

export function faixaDoNivel(nivel: number) {
  const indice = Math.min(FAIXAS.length - 1, Math.floor((nivel - 1) / DEGRAUS_POR_FAIXA));
  const degrau = ((nivel - 1) % DEGRAUS_POR_FAIXA) + 1;
  return { ...FAIXAS[indice], indice, degrau };
}

export function SeloDeNivel({
  nivel,
  porte = "grande",
}: {
  nivel: number;
  /** `pequeno` é o selo grudado no canto do ícone de perfil. */
  porte?: "grande" | "pequeno";
}) {
  const { cor, tinta, degrau } = faixaDoNivel(nivel);

  return (
    <svg
      viewBox="0 0 100 100"
      className="selo-nivel"
      data-porte={porte}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="38" fill={cor} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={tinta} strokeWidth="4" opacity="0.35" />

      <text
        x="50"
        y="59"
        textAnchor="middle"
        fill={tinta}
        fontSize="30"
        fontWeight="700"
        fontFamily="inherit"
      >
        {nivel}
      </text>

      {/* Os três pontos ficam ABAIXO do número, na base do disco: no anel eles
          competiriam com a borda, e no porte pequeno some tudo junto. */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={38 + i * 12}
          cy={80}
          r="4"
          fill={i < degrau ? tinta : "none"}
          stroke={tinta}
          strokeWidth="1.6"
          opacity={i < degrau ? 0.95 : 0.4}
        />
      ))}
    </svg>
  );
}
