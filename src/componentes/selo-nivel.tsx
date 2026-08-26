/**
 * selo-nivel.tsx — o selo do nível, desenhado em SVG.
 *
 * As marcas do anel contam o nível: cinco no total, preenchidas até o número
 * atual. É o que faz o selo dizer «terceiro de cinco» sem legenda embaixo.
 * Cor da ficha (amarelo + laranja), nunca a cor de ação — ele é um objeto que
 * a pessoa ganhou, não um botão.
 */
export function SeloDeNivel({ nivel, total }: { nivel: number; total: number }) {
  const marcas = Array.from({ length: total }, (_, i) => i < nivel);

  return (
    <svg viewBox="0 0 100 100" className="selo-nivel" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="38" fill="var(--ic-amarelo)" />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="var(--ic-laranja)"
        strokeWidth="5"
        opacity="0.75"
      />
      <circle cx="50" cy="50" r="29" fill="none" stroke="var(--ic-laranja)" strokeWidth="2" />

      {marcas.map((cheia, i) => {
        const angulo = (i / total) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + Math.cos(angulo) * 17;
        const y = 50 + Math.sin(angulo) * 17;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill={cheia ? "var(--ic-laranja)" : "none"}
            stroke="var(--ic-laranja)"
            strokeWidth="1.6"
            opacity={cheia ? 1 : 0.45}
          />
        );
      })}

      <text
        x="50"
        y="56"
        textAnchor="middle"
        fill="var(--ic-preto)"
        fontSize="16"
        fontWeight="700"
        fontFamily="var(--fonte-display)"
      >
        {nivel}
      </text>
    </svg>
  );
}
