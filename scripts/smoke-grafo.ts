/**
 * smoke-grafo.ts — prova que o grafo é atravessável, não só carregável.
 *
 * Rodado por `npm run smoke` (tsx). Não usar `node` puro: Node nativo recusa
 * importar JSON de dentro de um `.ts` sem import attribute e falha com
 * ERR_IMPORT_ATTRIBUTE_MISSING. O `tsx` resolve isso.
 *
 * O teste central é a cadeia do Cenário 1 — rap → poesia falada → teatro
 * documentário. Sai com 1 se o caminho for nulo, tiver menos de 2 saltos ou tiver
 * algum passo `semelhante_a` sem motivo.
 */

import {
  caminho,
  contagens,
  ocorrenciasDe,
  porId,
  porSlug,
  porTerritorio,
  GRAU_HUB,
} from "../src/dados/grafo";
import meta from "../src/dados/gerado/meta.json";
import type { Entidade, Passo } from "../src/dados/tipos";

/** Os extremos saem do grafo pelo SLUG, nunca de um id escrito à mão. */
const SLUG_ORIGEM = "rap";
const SLUG_DESTINO = "teatro-do-oprimido";

function exigir(entidade: Entidade | undefined, oQue: string): Entidade {
  if (!entidade) {
    console.error(`FALHOU: ${oQue} não existe no grafo.`);
    process.exit(1);
  }
  return entidade;
}

function imprimirPassos(trilha: Passo[]): void {
  for (const passo of trilha) {
    const anotacao = passo.motivo ?? passo.papel ?? "sem anotação";
    console.log(
      `  ${passo.de.titulo} --${passo.relacao}--> ${passo.para.titulo}   (${anotacao})`,
    );
  }
}

function main(): number {
  const numeros = contagens();
  console.log("contagens()");
  console.log("  por classe:     ", JSON.stringify(numeros.porClasse));
  console.log("  por procedência:", JSON.stringify(numeros.porProcedencia));
  console.log(`  GRAU_HUB = ${GRAU_HUB} · fanout semelhante_a = ${meta.fanoutEfetivo}`);
  console.log("");

  console.log("cobertura de coordenadas (todas derivadas, D-20)");
  for (const [metodo, n] of Object.entries(meta.cobertura.coordenadas.porMetodo)) {
    console.log(`  ${metodo.padEnd(24)} ${String(n).padStart(5)}`);
  }
  console.log(`  sem coordenada           ${String(meta.cobertura.semCoordenada.total).padStart(5)}`);
  console.log("");

  // --- Cenário 1: a cadeia rap → poesia falada → teatro documentário
  const origem = exigir(porSlug("termo", SLUG_ORIGEM), `termo/${SLUG_ORIGEM}`);
  const destino = exigir(porSlug("termo", SLUG_DESTINO), `termo/${SLUG_DESTINO}`);

  console.log(`caminho("${origem.id}", "${destino.id}")`);
  console.log(`  de:   ${origem.titulo} (${origem.linguagens.join(", ")})`);
  console.log(`  para: ${destino.titulo} (${destino.linguagens.join(", ")})`);
  console.log("");

  const trilha = caminho(origem.id, destino.id);
  if (trilha === null) {
    console.error(`FALHOU: caminho(${origem.id}, ${destino.id}) devolveu null.`);
    return 1;
  }
  imprimirPassos(trilha);
  console.log("");

  if (trilha.length < 2) {
    console.error(`FALHOU: caminho tem ${trilha.length} salto(s); o mínimo é 2.`);
    return 1;
  }
  const semMotivo = trilha.filter((p) => p.relacao === "semelhante_a" && !p.motivo?.trim());
  if (semMotivo.length) {
    console.error(`FALHOU: ${semMotivo.length} passo(s) semelhante_a sem motivo.`);
    return 1;
  }

  // --- a trilha autorada inteira, até o evento real com data e entrada gratuita
  const idTrilha = meta.cobertura.trilhaAutorada.id;
  const passosTrilha = meta.cobertura.trilhaAutorada.passos;
  console.log(`trilha autorada ${idTrilha}`);
  for (let i = 0; i < passosTrilha.length - 1; i++) {
    const salto = caminho(passosTrilha[i], passosTrilha[i + 1], 1);
    if (!salto || salto.length !== 1) {
      console.error(`FALHOU: passo ${passosTrilha[i]} → ${passosTrilha[i + 1]} não é ligação direta.`);
      return 1;
    }
    imprimirPassos(salto);
  }
  const fim = exigir(porId(passosTrilha[passosTrilha.length - 1]), "destino da trilha");
  const sessoes = ocorrenciasDe(fim.id);
  console.log(
    `  chegada: ${fim.titulo} — ${sessoes.length} ocorrência(s), ` +
      `${sessoes[0]?.gratuito ? "gratuita" : "com ingresso"}, a partir de ${sessoes[0]?.inicio ?? "sem data"}`,
  );
  console.log("");

  // --- Cenário 2: o território existe e é consultável, com e sem janela
  const belem = porId("territorio:derivado:belem-para");
  if (belem) {
    const tudo = porTerritorio(belem.id);
    const janela = porTerritorio(belem.id, { de: "2026-08-22", ate: "2026-08-26" });
    console.log(`porTerritorio("${belem.id}")`);
    console.log(`  sem janela:                ${tudo.length} entidades`);
    console.log(`  janela de 4 dias em 2026:  ${janela.length} entidades`);
    console.log(
      "  (o zero é fato do acervo, não bug: os eventos com território são históricos",
    );
    console.log("   e os eventos de 2026 não têm território — ver a lacuna 1 do SUMMARY)");
    console.log("");
  }

  console.log(`OK: cadeia do Cenário 1 percorrida em ${trilha.length} saltos, com motivo em cada aresta.`);
  return 0;
}

process.exit(main());
