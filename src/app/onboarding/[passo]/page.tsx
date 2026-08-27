import Link from "next/link";
import { EsqueletoBloco, EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";
import { OnboardingDisposicao } from "@/componentes/onboarding-disposicao";
import { OnboardingLinguagens } from "@/componentes/onboarding-linguagens";
import { OnboardingRodape } from "@/componentes/onboarding-rodape";
import { OnboardingSementes } from "@/componentes/onboarding-sementes";
import { cidadesComAcervo } from "@/dados/cidade";
import { catalogoDeSementes } from "@/dados/sementes";

/**
 * Onboarding em QUATRO passos: disposição, linguagens, rostos e obras, e o passo de
 * contexto (território + acessibilidade).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O QUE MUDOU COM A S8, e por quê.
 *
 * Eram três passos — disposição, território, acessibilidade — e só o primeiro era Camada
 * 1. Os dois passos de semeadura entraram no meio, e território e acessibilidade se
 * FUNDIRAM num passo só. A fusão não é economia de tela: cinco passos empurram o abandono
 * para antes do passo 3, que é justamente o que alimenta o motor. Os dois são Camada 3,
 * os dois são contexto e não gosto, e nenhum dos dois é pré-requisito de nada (D-19).
 *
 * NENHUM PASSO É PORTEIRO. «Pular» existe nos quatro e leva direto a Descobrir, que
 * funciona sem semente nenhuma e diz na tela que está mostrando o feed base. É a mesma
 * regra de sempre — Camada 3 nunca bloqueia Camada 1 — estendida ao onboarding inteiro,
 * inclusive aos passos que são Camada 1.
 *
 * COMPONENTE DE SERVIDOR. `catalogoDeSementes()` roda no BUILD e alcança o grafo; o que
 * atravessa a fronteira são as listas já recortadas — 33 linguagens com contagem, 194
 * rostos e 676 entradas de busca. Os 23 MB do acervo ficam do lado de lá (DP-F).
 */

const CATALOGO = catalogoDeSementes();

const PASSOS = {
  "1": {
    titulo: "Onboarding 1 — disposição",
    camada: "C1" as const,
    objetivo:
      "Capturar intenção, não gosto declarado. A pergunta é «o que te move hoje?», e a seleção é múltipla e sem obrigatoriedade.",
    blocos: [] as string[],
  },
  "2": {
    titulo: "Onboarding 2 — linguagens",
    camada: "C1" as const,
    objetivo:
      "A primeira semente da caminhada. As 33 linguagens do vocabulário controlado, com o tamanho do acervo de cada uma colado no rótulo — a grade abre com as maiores e as demais ficam atrás de «ver todas», nunca escondidas.",
    blocos: [] as string[],
  },
  "3": {
    titulo: "Onboarding 3 — artistas e obras",
    camada: "C1" as const,
    objetivo:
      "É aqui que o algoritmo nasce: a entidade marcada vira ponto de partida no grafo. Grade de 194 rostos, busca sobre 676, e duas saídas — «não conheço nenhum destes» e «pular» — porque uma tela de reconhecimento que a pessoa não consegue responder é uma parede.",
    blocos: [] as string[],
  },
  "4": {
    titulo: "Onboarding 4 — território e acessibilidade",
    camada: "C3" as const,
    objetivo:
      "De onde a pessoa parte e o que ela precisa que o lugar ofereça. Camada 3: contexto, não gosto — e por D-19 nenhum dos dois pode virar porteiro de Descobrir.",
    blocos: [
      "cidade atual, com correção manual",
      "raio de deslocamento em tempo — até 30 min",
      "estou de viagem · destino e período",
      "as 8 dimensões de acessibilidade que o CMS já modela",
    ],
  },
};

/** Exatamente quatro passos. Sob `output: "export"` esta lista é a rota (D-24). */
export function generateStaticParams() {
  return Object.keys(PASSOS).map((passo) => ({ passo }));
}

const PROXIMO: Record<string, string> = {
  "1": "/onboarding/2/",
  "2": "/onboarding/3/",
  "3": "/onboarding/4/",
  "4": "/descobrir/",
};

export default async function Onboarding({ params }: { params: Promise<{ passo: string }> }) {
  const { passo } = await params;
  const conteudo = PASSOS[passo as keyof typeof PASSOS] ?? PASSOS["1"];
  const proximo = PROXIMO[passo] ?? "/descobrir/";
  const total = Object.keys(PASSOS).length;

  return (
    <TelaEsqueleto
      nome={conteudo.titulo}
      objetivo={conteudo.objetivo}
      acoes={
        /* «Avançar» e «Pular», os dois presentes em TODOS os passos, e os dois marcando
           que a pessoa foi perguntada. Ver `onboarding-rodape.tsx`. */
        <OnboardingRodape
          proximo={proximo}
          rotuloAvancar={passo === String(total) ? "Ver o meu Descobrir" : "Avançar"}
        />
      }
    >
      <EsqueletoBloco
        altura="3rem"
        rotulo={`passo ${passo} de ${total} · avançar e pular sempre disponíveis`}
      />

      {passo === "1" ? <OnboardingDisposicao /> : null}
      {passo === "2" ? <OnboardingLinguagens linguagens={CATALOGO.linguagens} /> : null}
      {passo === "3" ? (
        <OnboardingSementes grade={CATALOGO.grade} busca={CATALOGO.busca} />
      ) : null}

      {passo === "4" ? (
        <>
          <EsqueletoLista rotulos={conteudo.blocos} />

          {/* PORTAS REAIS dentro do esqueleto: o que já existe no produto entra como
              caminho de verdade; o esqueleto rotulado segue marcando o que falta. */}
          <section className="flex flex-col gap-2">
            <p className="text-sm font-semibold">
              Estou de viagem — as {cidadesComAcervo().length} cidades com acervo têm roteiro
              pronto:
            </p>
            <div className="flex flex-wrap gap-2">
              {cidadesComAcervo().map((c) => (
                <Link
                  key={c.slug}
                  href={`/cidade/${c.slug}/`}
                  className="rounded-full border border-borda-forte px-3 py-1 text-xs font-semibold no-underline"
                >
                  {c.titulo} <span className="opacity-60">· {c.total}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <p className="max-w-prose text-sm leading-snug">
              As 8 dimensões já são filtro de primeira classe na tela de Filtros — marcadas
              lá, valem para toda a agenda, com o denominador honesto de cada uma.
            </p>
            <Link
              href="/filtros/"
              className="w-fit rounded-full bg-acao px-4 py-2 text-sm font-semibold text-sobre-acao no-underline transition-opacity hover:opacity-90"
            >
              Abrir as 8 dimensões de acessibilidade
            </Link>
          </section>
        </>
      ) : null}
    </TelaEsqueleto>
  );
}
