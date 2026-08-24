/**
 * testar-museu.ts — as duas permanentes existem, vêm primeiro, têm foto em
 * disco e YouTube. Rode com `npx tsx scripts/testar-museu.ts`.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { EXPOSICOES_PERMANENTES } from "../src/dados/exposicoes-permanentes";
import { hubDoMuseu, relacionadosDaExposicao } from "../src/dados/museu";

let falhas = 0;
let atual = "";

function assercao(nome: string, corpo: () => void) {
  atual = nome;
  try {
    corpo();
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`  FALHA ${nome}`);
    console.log(`        ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

function exigir(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem || atual);
}

console.log("\ntestar-museu — permanentes, fotos e YouTube");

assercao("são duas, Olavo Setubal primeiro", () => {
  exigir(EXPOSICOES_PERMANENTES.length === 2, `esperava 2, veio ${EXPOSICOES_PERMANENTES.length}`);
  exigir(
    EXPOSICOES_PERMANENTES[0].slug === "espaco-olavo-setubal",
    `primeiro era ${EXPOSICOES_PERMANENTES[0].slug}`,
  );
  exigir(
    EXPOSICOES_PERMANENTES[1].slug === "espaco-herculano-pires",
    `segundo era ${EXPOSICOES_PERMANENTES[1].slug}`,
  );
});

assercao("rotas ficam no app", () => {
  for (const expo of EXPOSICOES_PERMANENTES) {
    exigir(expo.rota.startsWith("/museu/"), `${expo.slug} rota ${expo.rota}`);
    exigir(expo.videos.length > 0, `${expo.slug} sem YouTube`);
    for (const v of expo.videos) {
      exigir(/^[A-Za-z0-9_-]{11}$/.test(v.id), `${expo.slug} id YouTube inválido ${v.id}`);
    }
  }
});

assercao("todas as fotos estão em public/", () => {
  const raiz = process.cwd();
  for (const expo of EXPOSICOES_PERMANENTES) {
    const arquivos = [
      expo.imagem,
      ...expo.galeria.map((g) => g.arquivo),
      ...expo.percursos.map((p) => p.imagem),
    ];
    for (const src of arquivos) {
      const rel = src.replace(/^\//, "");
      exigir(existsSync(join(raiz, "public", rel)), `falta public/${rel}`);
    }
  }
});

assercao("o hub coloca as permanentes na frente do cartaz", () => {
  const hub = hubDoMuseu();
  exigir(hub.permanentes.length === 2, `hub.permanentes ${hub.permanentes.length}`);
  exigir(hub.permanentes[0].slug === "espaco-olavo-setubal", "hub não começa no Olavo Setubal");
  exigir(hub.portas[0].id === "permanentes", `primeira porta era ${hub.portas[0].id}`);
  exigir(hub.cartaz.length === 5, `cartaz ${hub.cartaz.length}`);
});

assercao("Olavo Setubal tem matérias irmãs no acervo, sem cátedra", () => {
  const itens = relacionadosDaExposicao("espaco-olavo-setubal");
  exigir(itens.length > 0, "nenhum relacionado do espaço");
  for (const item of itens) {
    exigir(!/cátedra|catedra/i.test(item.titulo), `vazou cátedra: ${item.titulo}`);
    exigir(item.rota.startsWith("/"), `rota externa ${item.rota}`);
  }
});

if (falhas) {
  console.log(`\n${falhas} falha(s)`);
  process.exit(1);
}
console.log("\nverde");
