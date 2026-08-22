/**
 * testar-caminhada.ts — as nove asserções do motor de feed, sobre o GRAFO REAL.
 *
 * Não há mock e não há fixture: 7.810 entidades e 66.563 arestas, as mesmas que a tela
 * usa. Um motor que passa em fixture e colapsa no acervo não prova nada — e as três
 * medições que mais doeram no planejamento (M-1, M-3, M-4) só apareceram porque alguém
 * rodou sobre o dado inteiro.
 *
 * Rode com `npm run testar-caminhada`.
 */

import {
  alcancadosDaPersona,
  montarFeed,
  POSICAO_SERENDIPIDADE,
} from "../src/dados/caminhada";
import { PESO_NUNCA_VI } from "../src/dados/disposicoes";
import { ocorrenciasDe, porId } from "../src/dados/grafo";
import { PERSONAS, personaPorId } from "../src/dados/personas";

const MARIA = "pessoa-usuaria:autorado:maria";
const CARLOS = "pessoa-usuaria:autorado:carlos";
const LIMITE = 12;

let falhas = 0;
let atual = "";

function assercao(nome: string, corpo: () => void) {
  atual = nome;
  try {
    corpo();
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas++;
    console.log(`  FALHA ${nome}`);
    console.log(`        ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

function exigir(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`[${atual}] ${mensagem}`);
}

const feedDe = (personaId: string, disposicoes: string[] = []) =>
  montarFeed({ personaId, disposicoes, limite: LIMITE });

console.log(`Motor de caminhada — 9 asserções sobre o grafo real (${PERSONAS.length} personas)\n`);

// ---------------------------------------------------------------------------
// 1 — Rodízio (DP-B, D-27)
// ---------------------------------------------------------------------------
assercao("1 rodízio: zero pares adjacentes de mesma classe, 8+ classes distintas", () => {
  for (const persona of PERSONAS) {
    const { cartoes } = feedDe(persona.id);
    exigir(
      cartoes.length === LIMITE,
      `${persona.nome}: esperava ${LIMITE} cartões, veio ${cartoes.length}`,
    );
    for (let i = 1; i < cartoes.length; i++) {
      exigir(
        cartoes[i].classe !== cartoes[i - 1].classe,
        `${persona.nome}: cartões ${i - 1} e ${i} são ambos «${cartoes[i].classe}» ` +
          `(${cartoes[i - 1].titulo} → ${cartoes[i].titulo})`,
      );
    }
    const classes = new Set(cartoes.map((c) => c.classe));
    exigir(
      classes.size >= 8,
      `${persona.nome}: só ${classes.size} classes distintas (${[...classes].join(", ")})`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2 — Personalização (DP-D, M-4)
// ---------------------------------------------------------------------------
assercao("2 personalização: Maria e Carlos compartilham no máximo 3 dos 12 cartões", () => {
  const maria = feedDe(MARIA).cartoes.map((c) => c.id);
  const carlos = new Set(feedDe(CARLOS).cartoes.map((c) => c.id));
  const comuns = maria.filter((id) => carlos.has(id));
  exigir(
    comuns.length <= 3,
    `${comuns.length} cartões em comum: ${comuns.map((id) => porId(id)?.titulo ?? id).join(" · ")}`,
  );
});

// ---------------------------------------------------------------------------
// 3 — Determinismo (DP-D)
// ---------------------------------------------------------------------------
assercao("3 determinismo: montar duas vezes devolve a mesma lista, na mesma ordem", () => {
  for (const persona of PERSONAS) {
    const a = feedDe(persona.id).cartoes.map((c) => c.id);
    const b = feedDe(persona.id).cartoes.map((c) => c.id);
    exigir(
      a.join("|") === b.join("|"),
      `${persona.nome}: as duas montagens divergem\n        1ª: ${a.join(" ")}\n        2ª: ${b.join(" ")}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 4 — Motivo (D-28, DP-A, M-5)
// ---------------------------------------------------------------------------
assercao("4 motivo: 12 textos não vazios e ao menos 1 com origem «escrito»", () => {
  for (const persona of PERSONAS) {
    const { cartoes } = feedDe(persona.id);
    for (const c of cartoes) {
      exigir(
        Boolean(c.motivo.texto?.trim()),
        `${persona.nome}: cartão «${c.titulo}» (${c.classe}) sem texto de motivo`,
      );
    }
    const escritos = cartoes.filter((c) => c.motivo.origemMotivo === "escrito").length;
    exigir(escritos >= 1, `${persona.nome}: nenhum motivo escrito no feed`);
  }
});

// ---------------------------------------------------------------------------
// 5 — Corte factual (D-31)
// ---------------------------------------------------------------------------
assercao("5 corte factual: com gratuidade ativa, todo evento tem sessão gratuita", () => {
  for (const persona of PERSONAS) {
    const { cartoes } = feedDe(persona.id, ["quero-algo-de-graca"]);
    exigir(cartoes.length > 0, `${persona.nome}: o corte de gratuidade zerou o feed`);
    for (const c of cartoes.filter((x) => x.classe === "evento")) {
      const sessoes = ocorrenciasDe(c.id);
      exigir(
        sessoes.some((o) => o.gratuito),
        `${persona.nome}: evento «${c.titulo}» sem nenhuma sessão gratuita (${sessoes.length} sessões)`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 6 — Peso invertido (D-31)
// ---------------------------------------------------------------------------
assercao("6 peso invertido: «nunca vi» exclui as linguagens do repertório", () => {
  for (const persona of PERSONAS) {
    const repertorio = new Set(personaPorId(persona.id)?.repertorio.linguagens ?? []);
    const { cartoes } = feedDe(persona.id, [PESO_NUNCA_VI]);
    exigir(cartoes.length > 0, `${persona.nome}: «nunca vi» zerou o feed`);
    for (const c of cartoes) {
      const conflito = c.linguagens.filter((l) => repertorio.has(l));
      exigir(
        conflito.length === 0,
        `${persona.nome}: «${c.titulo}» está em ${conflito.join(", ")}, que já é do repertório`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 7 — Serendipidade (D-30)
// ---------------------------------------------------------------------------
assercao("7 serendipidade: exatamente 1 cartão, fora do alcance da caminhada", () => {
  for (const persona of PERSONAS) {
    const { cartoes } = feedDe(persona.id);
    const marcados = cartoes.filter((c) => c.especial === "serendipidade");
    exigir(marcados.length === 1, `${persona.nome}: ${marcados.length} cartões de serendipidade`);
    const [s] = marcados;
    const alcancados = alcancadosDaPersona(persona.id);
    exigir(
      !alcancados.has(s.id),
      `${persona.nome}: «${s.titulo}» está entre os ${alcancados.size} ids alcançados pela caminhada`,
    );
    exigir(
      s.saltos === 0 && s.caminho.length === 0,
      `${persona.nome}: serendipidade com saltos=${s.saltos} e caminho de ${s.caminho.length} passos — deveria não ter caminho`,
    );
    exigir(
      cartoes.indexOf(s) === POSICAO_SERENDIPIDADE,
      `${persona.nome}: serendipidade na posição ${cartoes.indexOf(s)}, esperada ${POSICAO_SERENDIPIDADE}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 8 — Destaque curado (D-29)
// ---------------------------------------------------------------------------
assercao("8 destaque curado: trilha alcançável ocupa a posição 0 e é assinada", () => {
  for (const persona of PERSONAS) {
    const alcancados = alcancadosDaPersona(persona.id);
    const temTrilha = [...alcancados].some((id) => porId(id)?.classe === "trilha");
    const { cartoes } = feedDe(persona.id);
    const curados = cartoes.filter((c) => c.especial === "curado");
    if (!temTrilha) {
      exigir(
        curados.length === 0,
        `${persona.nome}: cartão curado sem trilha alcançável no grafo`,
      );
      continue;
    }
    exigir(curados.length === 1, `${persona.nome}: ${curados.length} cartões curados`);
    exigir(
      cartoes[0].especial === "curado" && cartoes[0].classe === "trilha",
      `${persona.nome}: a posição 0 é «${cartoes[0].classe}»/${cartoes[0].especial ?? "comum"}, não a trilha curada`,
    );
    exigir(
      Boolean(cartoes[0].assinatura?.trim()),
      `${persona.nome}: a trilha curada não traz assinatura de quem curou`,
    );
  }
});

// ---------------------------------------------------------------------------
// 9 — Salto 3 é reserva (DP-C, M-3)
// ---------------------------------------------------------------------------
assercao("9 salto 3 é reserva: só entra em classe sem candidato de 1 ou 2 saltos", () => {
  for (const persona of PERSONAS) {
    const { cartoes, diagnostico } = feedDe(persona.id);
    const reserva = new Set(diagnostico.classesEmReserva);
    for (const c of cartoes.filter((x) => x.saltos === 3)) {
      exigir(
        reserva.has(c.classe),
        `${persona.nome}: «${c.titulo}» veio de 3 saltos mas «${c.classe}» não estava em reserva ` +
          `(reserva: ${[...reserva].join(", ") || "nenhuma"})`,
      );
    }
    for (const classe of reserva) {
      exigir(
        (diagnostico.candidatosPorClasse[classe] ?? 0) === 0,
        `${persona.nome}: «${classe}» entrou em reserva de 3 saltos tendo ` +
          `${diagnostico.candidatosPorClasse[classe]} candidatos de 1 ou 2 saltos`,
      );
    }
  }
});

console.log("");
if (falhas) {
  console.error(`${falhas} de 9 asserções falharam.`);
  process.exit(1);
}
console.log("9 de 9 asserções passaram.");
