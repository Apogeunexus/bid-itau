import type { ItemDeAcervo } from "@/dados/cidade";

/**
 * mapa-do-dia.tsx — o percurso de um dia do roteiro DESENHADO (reformulação
 * 2026-08: «o mapa deve mostrar as paradas previstas para cada dia selecionado»).
 *
 * Pinos numerados na ordem do percurso e a polilinha que os liga, sobre os pontos
 * JÁ PROJETADOS que o build calculou (`AncoraGeografica.ponto` — nenhum import de
 * `geo.ts` aqui; DP-F). O desenho é ESQUEMÁTICO e a legenda diz isso: não há base
 * cartográfica da cidade no acervo, e distância é linha reta na projeção nacional.
 *
 * O que o dado não sustenta fica DECLARADO, nunca desenhado: item sem âncora é
 * contado e nomeado fora do desenho (D-51); itens no centroide do município caem
 * TODOS no mesmo ponto, e o rótulo avisa em vez de espalhá-los artificialmente.
 */

const RAIO_MINIMO_DA_CAIXA = 2.5;

export function MapaDoDia({ itens, numero }: { itens: readonly ItemDeAcervo[]; numero: number }) {
  const ancorados = itens.filter((i) => i.ancora);
  const semAncora = itens.filter((i) => !i.ancora);

  if (ancorados.length === 0) {
    return (
      <p className="tipo-legenda text-tinta-2" data-mapa-do-dia={numero} data-paradas={0}>
        Nenhuma das paradas deste dia tem coordenada no acervo — o percurso existe como
        lista, e o desenho ficaria vazio fingindo que não.
      </p>
    );
  }

  const pontos = ancorados.map((i) => i.ancora!.ponto);
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const meiaLargura = Math.max((Math.max(...xs) - Math.min(...xs)) / 2, RAIO_MINIMO_DA_CAIXA);
  const meiaAltura = Math.max((Math.max(...ys) - Math.min(...ys)) / 2, RAIO_MINIMO_DA_CAIXA);
  // Caixa quadrada com folga: o desenho respira e um percurso de um ponto só não colapsa.
  const meio = Math.max(meiaLargura, meiaAltura) * 1.45;
  const viewBox = `${(cx - meio).toFixed(2)} ${(cy - meio).toFixed(2)} ${(meio * 2).toFixed(2)} ${(meio * 2).toFixed(2)}`;
  const raio = meio / 9;

  const noCentroide = ancorados.filter((i) => i.ancora!.noCentroide).length;
  const emEspaco = ancorados.length - noCentroide;

  return (
    <figure className="flex flex-col gap-1.5" data-mapa-do-dia={numero} data-paradas={ancorados.length}>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={`Percurso do dia ${numero}: ${ancorados.length} paradas com coordenada`}
        className="aspect-square w-full rounded-p border border-borda bg-superficie-2"
      >
        {pontos.length > 1 ? (
          <polyline
            points={pontos.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
            fill="none"
            stroke="var(--cor-acao)"
            strokeWidth={raio / 3}
            strokeDasharray={`${raio / 2} ${raio / 3}`}
            strokeLinecap="round"
          />
        ) : null}
        {pontos.map((p, i) => (
          <g key={`${ancorados[i].chave}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={raio}
              fill="var(--ic-branco)"
              stroke="var(--cor-acao)"
              strokeWidth={raio / 4}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={raio * 1.1}
              fontWeight={700}
              fill="var(--cor-tinta)"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="tipo-legenda leading-snug text-tinta-2">
        Percurso esquemático do dia {numero}, na ordem dos números — sem base cartográfica,
        com distâncias em linha reta. {emEspaco > 0 ? `${emEspaco} no espaço com coordenada própria` : null}
        {emEspaco > 0 && noCentroide > 0 ? " · " : null}
        {noCentroide > 0
          ? `${noCentroide} no centroide do município — o MESMO ponto, e o desenho não os espalha`
          : null}
        {semAncora.length > 0 ? (
          <>
            {" "}· fora do desenho, sem coordenada no acervo:{" "}
            {semAncora.map((i) => i.titulo).join(", ")}
          </>
        ) : null}
        .
      </figcaption>
    </figure>
  );
}
