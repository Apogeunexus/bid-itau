#!/usr/bin/env node
/**
 * raspar-sympla.mjs — programação nas linguagens da Maria: poesia, literatura, música.
 *
 * O feed dela não enchia com museu porque o repertório dela não tem artes visuais. Aqui a
 * busca é feita PELAS LINGUAGENS DELA, que é o que a torna alcançável na caminhada.
 * A listagem da Sympla é montada no cliente, então a raspagem roda em navegador.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "dados", "parceiros", "sympla-sp.json");

const BUSCAS = [
  ["poesia", "https://www.sympla.com.br/eventos/sao-paulo-sp?s=slam%20poesia"],
  ["poesia", "https://www.sympla.com.br/eventos/sao-paulo-sp?s=sarau"],
  ["literatura", "https://www.sympla.com.br/eventos/sao-paulo-sp?s=literatura"],
  ["teatro", "https://www.sympla.com.br/eventos/sao-paulo-sp/teatro-espetaculo"],
  ["musica", "https://www.sympla.com.br/eventos/sao-paulo-sp/festas-shows"],
];

const MES = { jan:"01", fev:"02", mar:"03", abr:"04", mai:"05", jun:"06",
              jul:"07", ago:"08", set:"09", out:"10", nov:"11", dez:"12" };

const EXTRAIR = `(() => {
  const vistos = new Set(); const itens = [];
  for (const a of document.querySelectorAll('a[href*="/evento/"]')) {
    const href = a.href.split("?")[0];
    if (vistos.has(href)) continue; vistos.add(href);
    const t = (a.innerText || "").replace(/\\s+/g, " ").trim();
    if (t.length < 15) continue;
    const img = a.querySelector("img")?.src || null;
    itens.push({ texto: t.slice(0, 220), href, img });
  }
  return JSON.stringify(itens);
})()`;

const cdp = await abrirNavegador();
const eventos = [];
const vistos = new Set();
try {
  for (const [linguagem, url] of BUSCAS) {
    await cdp.navegar(url);
    // Espera FORA do navegador: `Runtime.evaluate` tem teto de 30s no cliente CDP, e uma
    // promessa que espera lá dentro estoura o teto antes de resolver.
    for (let t = 0; t < 20; t++) {
      await new Promise((r) => setTimeout(r, 700));
      const n = await cdp.avaliar(`document.querySelectorAll('a[href*="/evento/"]').length`);
      if (Number(n?.value ?? n) > 3) break;
    }
    await new Promise((r) => setTimeout(r, 1500));
    const diag = await cdp.avaliar(`JSON.stringify({ t: document.title.slice(0,50), links: document.querySelectorAll('a[href*="/evento/"]').length, corpo: (document.body.innerText||"").length })`);
    console.log("      diag:", typeof diag === "string" ? diag : JSON.stringify(diag));
    const cru = await cdp.avaliar(EXTRAIR);
    const lidos = JSON.parse(typeof cru === "string" ? cru : (cru?.value ?? "[]"));
    let n = 0;
    if (lidos.length) console.log("      amostra:", JSON.stringify(lidos[0]?.texto || "").slice(0, 150));
    else console.log("      NADA lido nessa URL");
    for (const it of lidos) {
      // «... Casa X - São Paulo, SP Sábado, 19 de Set às 21:00»
      const m = it.texto.match(/^(.*?)\s+([^,]+?)\s+-\s+São Paulo,\s*SP\s+[^,]+,\s*(\d{1,2})\s+de\s+([A-Za-zÀ-ÿ]{3})[A-Za-zÀ-ÿ]*\s+às\s+(\d{2}:\d{2})/i);
      if (!m) continue;
      const mes = MES[m[4].toLowerCase().slice(0, 3)];
      if (!mes) continue;
      const ano = Number(mes) >= 9 ? "2026" : "2027";
      const id = `evento:parceiro:sympla-${it.href.split("/").filter(Boolean).pop()}`;
      if (vistos.has(id)) continue; vistos.add(id);
      eventos.push({
        id,
        titulo: m[1].trim(),
        classe: "evento",
        procedencia: "parceiro",
        fonte: `${m[2].trim()} · via Sympla`,
        fonteUrl: it.href,
        linguagemDeclarada: linguagem,
        gratuito: null,
        espacoDeclarado: `${m[2].trim()}, São Paulo, SP`,
        ocorrencias: [{ inicio: `${ano}-${mes}-${m[3].padStart(2, "0")}` }],
        imagem: it.img,
        revisadoPor: null,
      });
      n++;
    }
    console.log(`  ${linguagem.padEnd(11)} ${n} eventos  ${url.slice(38, 78)}`);
  }
} finally { await cdp.encerrar(); }

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, JSON.stringify({
  metodo: "navegador headless; busca por linguagem, não por categoria do site",
  total: eventos.length, eventos,
}, null, 2) + "\n");
console.log(`\n  ${eventos.length} eventos · ${eventos.filter((e) => e.imagem).length} com imagem`);
