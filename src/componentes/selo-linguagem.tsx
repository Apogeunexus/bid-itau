import vocabularioJson from "@/dados/gerado/vocabulario.json";
import type { LinguagemVocabulario, Vocabulario } from "@/dados/tipos";

/**
 * selo-linguagem.tsx — o rótulo de uma linguagem artística com a cor QUE VEIO NO DADO
 * (D-08).
 *
 * Este componente não conhece nenhuma linguagem pelo nome e não contém — nem pode conter
 * — nenhuma associação linguagem→cor. A associação mora no vocabulário gerado por
 * `scripts/gerar-grafo.mjs`, que emite o NOME DO TOKEN (`"--ic-lilas"`); os hex moram só
 * em `globals.css`. Duplicar o mapa aqui criaria uma segunda fonte de verdade que diverge
 * na primeira edição, e é exatamente isso que D-08 evita.
 *
 * O Tailwind não gera classe a partir de valor de runtime, então a cor entra como custom
 * property inline e os utilitários a leem por `var(--cor-linguagem)` — sem `safelist`,
 * sem lista de classes possíveis.
 */

/** Só o que o selo precisa. Aceita a entrada inteira do vocabulário sem exigir o resto. */
type LinguagemExibivel = Pick<LinguagemVocabulario, "rotulo" | "cor"> &
  Partial<Pick<LinguagemVocabulario, "id" | "promovida">>;

export function SeloLinguagem({
  linguagem,
  className,
}: {
  linguagem: LinguagemExibivel;
  className?: string;
}) {
  // Sem cor no dado o selo continua legível em vez de sumir: cai para o preto do manual.
  const token = linguagem.cor?.trim() ? linguagem.cor.trim() : "--ic-preto";

  return (
    <span
      style={{ "--cor-linguagem": `var(${token})` } as React.CSSProperties}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--cor-linguagem)] bg-superficie px-2.5 py-0.5 text-sm leading-tight font-semibold text-tinta ${className ?? ""}`}
    >
      <span aria-hidden className="size-2 rounded-full bg-[var(--cor-linguagem)]" />
      {linguagem.rotulo}
    </span>
  );
}

/**
 * Índice do vocabulário por id, construído uma vez. Continua sendo LEITURA de dado:
 * a entidade guarda ids de linguagem, e é aqui que o id vira rótulo e cor. Não existe
 * nenhuma decisão de cor neste arquivo — só a resolução do dado que já foi gerado.
 */
const INDICE = new Map(
  (vocabularioJson as Vocabulario).linguagens.map((linguagem) => [linguagem.id, linguagem]),
);

export function linguagemPorId(id: string): LinguagemVocabulario | undefined {
  return INDICE.get(id);
}

/** Os selos de uma entidade a partir dos ids que ela carrega. */
export function SelosDeLinguagem({ ids, limite = 6 }: { ids: string[]; limite?: number }) {
  const linguagens = ids
    .map(linguagemPorId)
    .filter((l): l is LinguagemVocabulario => Boolean(l))
    .slice(0, limite);

  if (!linguagens.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {linguagens.map((linguagem) => (
        <SeloLinguagem key={linguagem.id} linguagem={linguagem} />
      ))}
    </div>
  );
}
