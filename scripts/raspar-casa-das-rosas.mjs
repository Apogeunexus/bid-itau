#!/usr/bin/env node
/**
 * raspar-casa-das-rosas.mjs — poesia e literatura, que são as linguagens da Maria.
 *
 * MASP e Pinacoteca são artes visuais; o Municipal é música. Nenhum dos três alcança quem
 * chega por literatura ou poesia — e é justamente esse o repertório da persona do
 * Cenário 1. A Casa das Rosas é o Espaço Haroldo de Campos de Poesia e Literatura, e por
 * isso é a fonte que fecha o feed dela.
 *
 * A listagem traz título, CATEGORIA e data no mesmo bloco de texto — «A Paulista de
 * Tarsila / Evento especial / 01/09 / 01 de setembro de 2026» — então a leitura é por
 * padrão de texto, e não por metatag: aqui a categoria vem de graça e é o que dá a
 * linguagem sem precisar inferir.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "dados", "parceiros", "casa-das-rosas.json");
const FONTE = "Casa das Rosas — Espaço Haroldo de Campos de Poesia e Literatura";

/** A categoria da casa → o vocabulário controlado. Poesia é o padrão: é o que ela é. */
const LINGUAGEM = {
  "Música": "musica",
  Literatura: "literatura",
  Poesia: "poesia",
  "Grupo de Estudos": "literatura",
  Curso: "literatura",
  Oficina: "literatura",
  "Visita Temática": "poesia",
  "Evento especial": "poesia",
  Exposição: "artes-visuais",
};

const EXTRAIR = `(() => {
  const vistos = new Set(); const itens = [];
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.href.split("?")[0];
    if (!/casadasrosas\\.org\\.br\\/programacao\\/.+\\//.test(h) || vistos.has(h)) continue;
    vistos.add(h);
    const bloco = a.closest("article, li, .card, div");
    const t = (bloco?.innerText || "").replace(/\\s+/g, " ").trim();
    if (!/\\d{1,2}\\/\\d{1,2}/.test(t) || t.length < 20) continue;
    itens.push({ t: t.slice(0, 240), h, img: bloco?.querySelector("img")?.src || null });
  }
  return JSON.stringify(itens);
})()`;

const cdp = await abrirNavegador();
const eventos = [];
try {
  await cdp.navegar("https://www.casadasrosas.org.br/programacao/");
  await new Promise((r) => setTimeout(r, 6000));
  for (let i = 0; i < 3; i++) {
    await cdp.avaliar(`window.scrollTo(0, document.body.scrollHeight)`);
    await new Promise((r) => setTimeout(r, 1200));
  }
  const cru = await cdp.avaliar(EXTRAIR);
  const lidos = JSON.parse(typeof cru === "string" ? cru : (cru?.value ?? "[]"));

  const MES = { janeiro:"01", fevereiro:"02", "março":"03", abril:"04", maio:"05", junho:"06",
                julho:"07", agosto:"08", setembro:"09", outubro:"10", novembro:"11", dezembro:"12" };

  for (const it of lidos) {
    // «Título Categoria 04/08 a 01/09 04 de agosto de 2026 a 01 de setembro de 2026»
    const porExtenso = [...it.t.matchAll(/(\d{1,2}) de ([a-zç]+) de (\d{4})/gi)];
    if (!porExtenso.length) continue;
    const iso = (m) => `${m[3]}-${MES[m[2].toLowerCase()] ?? "01"}-${m[1].padStart(2, "0")}`;

    const antes = it.t.slice(0, it.t.search(/\d{1,2}\/\d{1,2}/)).trim();
    const categoria = Object.keys(LINGUAGEM).find((c) => antes.endsWith(c));
    const titulo = categoria ? antes.slice(0, -categoria.length).trim() : antes;
    if (!titulo) continue;

    eventos.push({
      id: `evento:parceiro:cr-${it.h.replace(/\/$/, "").split("/").pop()}`,
      titulo,
      classe: "evento",
      procedencia: "parceiro",
      fonte: FONTE,
      fonteUrl: it.h,
      linguagemDeclarada: categoria ?? "Poesia",
      // A casa é pública e a programação dela é gratuita — está escrito no site.
      gratuito: true,
      espacoDeclarado: "Casa das Rosas, Avenida Paulista, São Paulo, SP",
      ocorrencias: [{ inicio: iso(porExtenso[0]), fim: iso(porExtenso[porExtenso.length - 1]) }],
      imagem: it.img,
      revisadoPor: null,
    });
    console.log(`  ${iso(porExtenso[0])}  ${(categoria ?? "Poesia").padEnd(16)} ${titulo.slice(0, 46)}`);
  }
} finally { await cdp.encerrar(); }

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, JSON.stringify({ fonte: FONTE, total: eventos.length, eventos }, null, 2) + "\n");
console.log(`\n  ${eventos.length} eventos · escrito em dados/parceiros/casa-das-rosas.json\n`);
