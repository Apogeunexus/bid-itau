import { Grafismo } from "@/componentes/grafismo";
import { OnboardingDisposicao } from "@/componentes/onboarding-disposicao";
import { OnboardingLinguagens } from "@/componentes/onboarding-linguagens";
import { OnboardingLugar } from "@/componentes/onboarding-lugar";
import { OnboardingRodape } from "@/componentes/onboarding-rodape";
import { OnboardingSementes } from "@/componentes/onboarding-sementes";
import { ROTULO_DIMENSAO } from "@/dados/agenda";
import { cidadesComAcervo } from "@/dados/cidade";
import { catalogoDeSementes } from "@/dados/sementes";

/**
 * Onboarding em CINCO passos: o que você gosta, quem te interessa, quais obras te param,
 * e onde você quer descobrir.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * A TELA NÃO DIZ MAIS O NOME DO MÓDULO.
 *
 * Cada passo se chamava «Onboarding 2 — linguagens», «Onboarding 5 — território e
 * acessibilidade». Isso é o nome que a equipe usa para conversar entre si, e ele estava
 * impresso como título da tela — acima da pergunta de verdade, que vinha logo abaixo em
 * corpo menor. Eram dois títulos e um contador para dizer uma coisa só, e o que a pessoa
 * lia primeiro era o de dentro do produto.
 *
 * Agora a PERGUNTA é o título, o contador «passo N de 5» é a única marca de progresso, e
 * o nome interno não aparece em lugar nenhum da interface. A ordem da conversa é a de
 * quem responde, não a do banco: o que eu gosto → quem me interessa → que obras me param
 * → onde eu vivo isso.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O QUE NÃO MUDOU, e por quê.
 *
 * NENHUM PASSO É PORTEIRO. «Pular por enquanto» existe nos quatro primeiros e leva
 * direto a Descobrir, que funciona sem semente nenhuma e diz na tela que está mostrando
 * o feed base. No quinto ele não existe porque não teria o que significar: o botão
 * principal já vai para o mesmo lugar. Nada é obrigatório em passo nenhum.
 *
 * ARTISTAS E OBRAS SÃO DUAS TELAS, e a de obras não se recorta pela de artistas: o acervo
 * não tem nenhuma aresta ligando pessoa a obra. O motivo medido está no cabeçalho de
 * `onboarding-sementes.tsx`.
 *
 * COMPONENTE DE SERVIDOR. `catalogoDeSementes()` roda no BUILD e alcança o grafo; o que
 * atravessa a fronteira são as listas já recortadas — 33 linguagens, 194 rostos e 676
 * entradas de busca. Os 23 MB do acervo ficam do lado de lá (DP-F). `ROTULO_DIMENSAO` é
 * um mapa de oito strings e viaja pelo mesmo motivo: são primitivos, não o acervo.
 */

const CATALOGO = catalogoDeSementes();

/** As cidades e os recursos de acesso do passo 5, medidos no build. */
const CIDADES = cidadesComAcervo().map((c) => ({ slug: c.slug, titulo: c.titulo }));
const RECURSOS = Object.entries(ROTULO_DIMENSAO).map(([campo, rotulo]) => ({ campo, rotulo }));

interface Passo {
  /** O título da tela. É a pergunta, em voz de conversa — nunca o nome do módulo. */
  pergunta: string;
  /** A linha abaixo do título: o que a resposta faz por quem responde. */
  apoio: string;
}

const PASSOS: Record<string, Passo> = {
  "1": {
    pergunta: "O que te move hoje?",
    apoio: "Escolha quantas quiser, ou nenhuma. Isso muda o que aparece primeiro.",
  },
  "2": {
    pergunta: "O que você gosta de explorar?",
    apoio: "Escolha quantos quiser. Isso ajuda a personalizar suas descobertas.",
  },
  "3": {
    pergunta: "Quem desperta sua curiosidade?",
    apoio: "Escolha artistas que você gosta ou quer conhecer melhor.",
  },
  "4": {
    pergunta: "Quais obras chamam sua atenção?",
    apoio: "Escolha algumas que você conhece ou gostaria de descobrir.",
  },
  "5": {
    pergunta: "Onde você quer descobrir cultura?",
    apoio: "Vamos usar essas informações para mostrar experiências que fazem sentido para você.",
  },
};

/** Exatamente cinco passos. Sob `output: "export"` esta lista é a rota (D-24). */
export function generateStaticParams() {
  return Object.keys(PASSOS).map((passo) => ({ passo }));
}

const PROXIMO: Record<string, string> = {
  "1": "/onboarding/2/",
  "2": "/onboarding/3/",
  "3": "/onboarding/4/",
  "4": "/onboarding/5/",
  "5": "/descobrir/",
};

/* A grade de cada passo de semeadura, recortada por classe no BUILD. Artistas e obras são
 * telas independentes — ver o cabeçalho deste arquivo. */
const ARTISTAS = {
  grade: CATALOGO.grade.filter((r) => r.classe === "pessoa"),
  busca: CATALOGO.busca.filter((r) => r.classe === "pessoa"),
};
const OBRAS = {
  grade: CATALOGO.grade.filter((r) => r.classe === "obra"),
  busca: CATALOGO.busca.filter((r) => r.classe === "obra"),
};

export default async function Onboarding({ params }: { params: Promise<{ passo: string }> }) {
  const { passo } = await params;
  const conteudo = PASSOS[passo] ?? PASSOS["1"];
  const proximo = PROXIMO[passo] ?? "/descobrir/";
  const total = Object.keys(PASSOS).length;
  const ultimo = passo === String(total);

  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      {/* O CONTADOR VEM ANTES DO TÍTULO, e em corpo pequeno: ele situa, não anuncia. Vindo
          depois, ele separava o título da pergunta e a tela parecia ter dois assuntos. */}
      <header className="flex flex-col gap-2">
        <p className="onb-passos">
          passo {passo} de {total}
        </p>
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{conteudo.pergunta}</h1>
        </div>
        <p className="max-w-prose text-sm text-tinta-2">{conteudo.apoio}</p>
      </header>

      {passo === "1" ? <OnboardingDisposicao /> : null}
      {passo === "2" ? <OnboardingLinguagens linguagens={CATALOGO.linguagens} /> : null}
      {passo === "3" ? (
        <OnboardingSementes
          grade={ARTISTAS.grade}
          busca={ARTISTAS.busca}
          rotuloDaBusca="Buscar artistas"
          vazio="Nenhum artista do acervo com esse nome."
        />
      ) : null}
      {passo === "4" ? (
        <OnboardingSementes
          grade={OBRAS.grade}
          busca={OBRAS.busca}
          rotuloDaBusca="Buscar obras"
          vazio="Nenhuma obra do acervo com esse título."
        />
      ) : null}
      {passo === "5" ? <OnboardingLugar cidades={CIDADES} recursos={RECURSOS} /> : null}

      {/* NO FIM DA TELA, e não no cabeçalho: «Continuar» acima da grade seria o botão de
          confirmar aparecendo antes daquilo que ele confirma. Sair pelo principal ou pelo
          secundário marca igual que a pessoa foi perguntada — pular é uma resposta. */}
      <div className="onb-rodape">
        <OnboardingRodape
          proximo={proximo}
          rotuloAvancar={ultimo ? "Começar a descobrir" : "Continuar"}
          ultimo={ultimo}
        />
      </div>
    </div>
  );
}
