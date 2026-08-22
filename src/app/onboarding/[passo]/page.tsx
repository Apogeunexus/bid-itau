import Link from "next/link";
import { EsqueletoBloco, EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";
import { OnboardingDisposicao } from "@/componentes/onboarding-disposicao";

/**
 * Onboarding em três passos (telas 2, 3 e 4 de `docs/telas.md`).
 *
 * Só o passo 1 é Camada 1, e ele deixou de ser esqueleto: DESC-01 entregue, com os cartões
 * grandes de disposição lendo `disposicoes.ts` e gravando em `useSessao`.
 *
 * Os passos 2 e 3 continuam esqueleto DE PROPÓSITO. São Camada 3 (território e
 * acessibilidade), e por D-19 Camada 3 nunca é pré-requisito de Camada 1 — nenhum deles
 * pode virar porteiro de Descobrir. É por isso que todo passo oferece a saída direta.
 */
const PASSOS = {
  "1": {
    titulo: "Onboarding 1 — disposição",
    camada: "C1" as const,
    objetivo:
      "Capturar intenção, não gosto declarado. A pergunta é «o que te move hoje?», e a seleção é múltipla e sem obrigatoriedade.",
    blocos: [] as string[],
  },
  "2": {
    titulo: "Onboarding 2 — território e alcance",
    camada: "C3" as const,
    objetivo:
      "Saber de onde a pessoa parte, sem pedir endereço: cidade atual, raio em tempo e não em quilômetros, e o alternador «estou de viagem» — é por aqui que o Cenário 2 entra.",
    blocos: [
      "cidade atual, com correção manual",
      "raio de deslocamento em tempo — até 30 min",
      "estou de viagem · destino e período",
    ],
  },
  "3": {
    titulo: "Onboarding 3 — acessibilidade",
    camada: "C3" as const,
    objetivo:
      "Tratar acessibilidade como filtro de primeira classe, não como selo: as 8 dimensões que o próprio CMS do Itaú Cultural já modela.",
    blocos: [
      "audiodescrição · Libras · legenda descritiva",
      "closed caption · legenda aberta",
      "tradução simultânea · estenotipia · legenda",
      "a escolha vale para o app inteiro e pode mudar depois",
    ],
  },
};

/** Exatamente três passos. Sob `output: "export"` esta lista é a rota (D-24). */
export function generateStaticParams() {
  return Object.keys(PASSOS).map((passo) => ({ passo }));
}

export default async function Onboarding({ params }: { params: Promise<{ passo: string }> }) {
  const { passo } = await params;
  const conteudo = PASSOS[passo as keyof typeof PASSOS] ?? PASSOS["1"];
  const proximo = { "1": "/onboarding/2", "2": "/onboarding/3", "3": "/descobrir" }[passo] ?? "/descobrir";

  return (
    <TelaEsqueleto
      nome={conteudo.titulo}
      camada={conteudo.camada}
      objetivo={conteudo.objetivo}
      acoes={
        <>
          <Link
            href={proximo}
            className="rounded-full bg-[var(--ic-laranja)] px-4 py-2 text-sm font-semibold text-[var(--ic-branco)] transition-opacity hover:opacity-90"
          >
            Avançar
          </Link>
          <Link
            href="/descobrir"
            className="rounded-full border border-[var(--ic-preto)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5"
          >
            Pular
          </Link>
        </>
      }
    >
      <EsqueletoBloco altura="3rem" rotulo={`passo ${passo} de 3 · avançar sempre disponível`} />
      {passo === "1" ? (
        <OnboardingDisposicao />
      ) : (
        <EsqueletoLista rotulos={conteudo.blocos} />
      )}
    </TelaEsqueleto>
  );
}
