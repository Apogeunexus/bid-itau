#!/usr/bin/env node
/**
 * raspar-theatro-municipal.mjs — a estratégia de ingestão federada, num caso real.
 *
 * POR QUE ESTE SCRIPT EXISTE, E POR QUE ELE É ARGUMENTO E NÃO UTILITÁRIO.
 *
 * O acervo do Itaú Cultural tem 300 eventos e ZERO deles cruza data futura com território:
 * os do CMS têm data de 2026 e nenhum lugar; os da Enciclopédia têm lugar real e data
 * histórica. Isso não é defeito do protótipo, é o estado da fonte — e é exatamente o buraco
 * que a plataforma existe para fechar. Fechá-lo tem duas saídas: esperar produtores
 * publicarem no Studio, ou ir buscar onde a programação já está publicada.
 *
 * Este script é a segunda saída, feita numa fonte que ninguém controla: o Theatro Municipal
 * de São Paulo. Ele prova, em código executável, que a ingestão de terceiros não depende de
 * acordo prévio nem de API — depende de saber ler.
 *
 * A DESCOBERTA QUE DEFINE A ESTRATÉGIA. `curl` na página de programação devolve 393 KB de
 * HTML com os FILTROS e nenhum evento: o site é WordPress com Elementor e JetEngine, e a
 * listagem é montada no cliente. Um raspador ingênuo leria zero e concluiria «não tem
 * programação». Por isso a raspagem roda no NAVEGADOR, com o mesmo cliente CDP que a
 * verificação do projeto já usa — sem dependência nova, sem puppeteer.
 *
 * O QUE SAI DAQUI NÃO É EVENTO, É CANDIDATO. O arquivo escrito carrega `procedencia:
 * "parceiro"` em todo campo e nunca entra no grafo direto: ele é a entrada da fila de
 * revisão, que é onde a regra do projeto manda a saída de qualquer fonte não-IC parar antes
 * de virar dado público (D-15, D-16). O que este script afirma é «o Municipal publicou
 * isto»; quem afirma «isto é um evento do Agenda Cultural BR» é humano.
 *
 * Uso: `node scripts/raspar-theatro-municipal.mjs [--saida caminho.json]`
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = "https://theatromunicipal.org.br/pt-br/programacao/";
const SAIDA_PADRAO = join(RAIZ, "dados", "parceiros", "theatro-municipal.json");

/** Espera pela listagem em vez de dormir um número fixo: a rede da banca não é a nossa. */
const ESPERA_DA_LISTAGEM = `new Promise((r) => {
  let tentativas = 0;
  const olhar = () => {
    const n = document.querySelectorAll(".jet-listing-grid__item, .elementor-grid-item").length;
    if (n > 0 || ++tentativas > 120) r(n);
    else setTimeout(olhar, 250);
  };
  olhar();
})`;

/**
 * A LEITURA DE CADA CARTÃO. O texto do item vem no formato que o JetEngine monta:
 *
 *   «Gratuito · Música · Recital "All Greek To Me" · 06/09/2026 · Theatro Municipal»
 *   «Evento Pago · Ópera · Ópera Don Carlo, de Giuseppe Verdi · 18/09/2026 · 26/09/2026 · Theatro Municipal»
 *
 * Isto é: ingresso, linguagem, título, uma ou duas datas, espaço. As datas são o gancho —
 * elas partem o texto em três, e o que vem antes da primeira é «ingresso + linguagem +
 * título», o que vem depois da última é o espaço. Nenhum seletor CSS interno é usado para
 * isso de propósito: classe de tema muda a cada atualização do WordPress, a ORDEM do que
 * está escrito não.
 */
const EXTRAIR = `(() => {
  const DATA = /(\\d{2}\\/\\d{2}\\/\\d{4})/g;
  const itens = [...document.querySelectorAll(".jet-listing-grid__item, .elementor-grid-item")];
  const lidos = [];

  for (const el of itens) {
    const bruto = (el.innerText || "").replace(/\\s+/g, " ").trim();
    if (bruto.length < 12) continue;

    const datas = bruto.match(DATA) || [];
    if (!datas.length) continue;

    const antes = bruto.slice(0, bruto.indexOf(datas[0])).trim();
    const depois = bruto.slice(bruto.lastIndexOf(datas[datas.length - 1]) + 10).trim();

    let ingresso = null;
    let resto = antes;
    for (const marca of ["Evento Gratuito", "Gratuito", "Evento Pago"]) {
      if (resto.startsWith(marca)) {
        ingresso = marca === "Evento Pago" ? "pago" : "gratuito";
        resto = resto.slice(marca.length).trim();
        break;
      }
    }

    // A linguagem é a primeira palavra do que sobrou, e o título é o resto. O vocabulário
    // do Municipal é curto e fechado, então a lista é literal em vez de heurística.
    let linguagem = null;
    for (const l of ["Música", "Ópera", "Concertos", "Balé", "Dança", "Teatro", "Coral", "Recital"]) {
      if (resto.startsWith(l)) { linguagem = l; resto = resto.slice(l.length).trim(); break; }
    }

    const img = el.querySelector("img");
    const fundo = getComputedStyle(el.querySelector("[style*='background-image']") || el).backgroundImage;
    const daFundo = fundo && fundo !== "none" ? fundo.replace(/^url\\(["']?/, "").replace(/["']?\\)$/, "") : null;

    lidos.push({
      titulo: resto,
      linguagem,
      ingresso,
      inicio: datas[0],
      fim: datas.length > 1 ? datas[datas.length - 1] : datas[0],
      espaco: depois || null,
      url: el.querySelector("a[href]")?.href || null,
      imagem: img?.getAttribute("src") || img?.getAttribute("data-src") || daFundo || null,
    });
  }
  return JSON.stringify(lidos);
})()`;


/** Abre a página do evento e completa foto e descrição — a listagem não as traz. */
const FICHA_DA_PAGINA = `(() => {
  const meta = (p) => document.querySelector(\`meta[property="\${p}"], meta[name="\${p}"]\`)?.content || null;
  const og = meta("og:image");
  let maior = null, area = 0;
  for (const im of document.querySelectorAll("img")) {
    const a = (im.naturalWidth || 0) * (im.naturalHeight || 0);
    if (a > area && (im.naturalWidth || 0) >= 400) { area = a; maior = im.currentSrc || im.src; }
  }
  // A CHAMADA VEM DO CORPO QUANDO A METATAG NÃO SERVE. O Municipal não tem og:description,
  // e a da Casa das Rosas é o próprio título repetido — nos dois casos o cartão ficaria sem
  // linha de apoio. O primeiro parágrafo de tamanho de frase é o que a página oferece a
  // quem chega, e é o que serve. Nada é escrito por nós.
  const titulo = (document.querySelector("h1")?.innerText || "").trim();
  const desc = meta("og:description") || meta("description");
  let corpo = null;
  for (const p of document.querySelectorAll("p")) {
    const t = (p.innerText || "").replace(/\\s+/g, " ").trim();
    if (t.length >= 60 && t.length <= 400 && t !== titulo && !/cookie|privacidade|newsletter|atalhos?\\s+Ctrl|aumentar ou diminuir|contraste|leitor de tela|utilize os atalhos|programa..o completa e garanta/i.test(t)) {
      corpo = t; break;
    }
  }
  const resumo = desc && desc.trim() && desc.trim() !== titulo ? desc.trim() : corpo;
  return JSON.stringify({ imagem: og || maior, resumo });
})()`;

/** dd/mm/aaaa → aaaa-mm-dd. O grafo fala ISO; a fonte, não. */
function paraIso(br) {
  const [d, m, a] = br.split("/");
  return `${a}-${m}-${d}`;
}

const saida = process.argv.includes("--saida")
  ? resolve(process.argv[process.argv.indexOf("--saida") + 1])
  : SAIDA_PADRAO;

const cdp = await abrirNavegador();
let lidos = [];
try {
  console.log(`  fonte  ${FONTE}`);
  await cdp.navegar(FONTE);
  const n = await cdp.avaliar(ESPERA_DA_LISTAGEM);
  console.log(`  itens na listagem: ${n?.value ?? n}`);
  const cru = await cdp.avaliar(EXTRAIR);
  lidos = JSON.parse(typeof cru === "string" ? cru : (cru?.value ?? "[]"));
  // SEGUNDO ESTÁGIO: a listagem do JetEngine não traz foto nem chamada, e cartão sem
  // capa nem descrição não sustenta um feed. Cada página é aberta uma vez.
  for (const e of lidos) {
    if (!e.url) continue;
    await cdp.navegar(e.url);
    await new Promise((r) => setTimeout(r, 1400));
    const f = await cdp.avaliar(FICHA_DA_PAGINA);
    const ficha = JSON.parse(typeof f === "string" ? f : (f?.value ?? "{}"));
    e.imagem = ficha.imagem || e.imagem;
    e.resumo = ficha.resumo || null;
    console.log(`      ${ficha.imagem ? "[img]" : "[   ]"} ${e.titulo.slice(0, 46)}`);
  }
} finally {
  await cdp.encerrar();
}

const eventos = lidos
  .filter((e) => e.titulo && e.inicio)
  .map((e) => ({
    // O id declara a origem no próprio formato do projeto: {classe}:{origem}:{idOrigem}.
    id: `evento:parceiro:tm-${(e.url || e.titulo).split("/").filter(Boolean).pop()}`,
    titulo: e.titulo,
    classe: "evento",
    procedencia: "parceiro",
    fonte: "Theatro Municipal de São Paulo",
    fonteUrl: e.url,
    linguagemDeclarada: e.linguagem,
    gratuito: e.ingresso === "gratuito",
    ingressoDeclarado: e.ingresso,
    espacoDeclarado: e.espaco,
    ocorrencias: [{ inicio: paraIso(e.inicio), fim: paraIso(e.fim) }],
    imagem: e.imagem,
    resumo: e.resumo ?? null,
    // Nada daqui entra no grafo sem passar por gente. O campo existe para que a fila de
    // revisão do Studio saiba que ninguém ainda olhou.
    revisadoPor: null,
  }));

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(
  saida,
  JSON.stringify(
    {
      fonte: FONTE,
      instituicao: "Theatro Municipal de São Paulo",
      // Sem carimbo de horário: o gerador do projeto exige determinismo — duas execuções
      // seguidas produzem bytes idênticos, e um `new Date()` aqui quebraria isso.
      metodo: "navegador headless via CDP; a listagem é montada no cliente e não vem no HTML",
      total: eventos.length,
      gratuitos: eventos.filter((e) => e.gratuito).length,
      eventos,
    },
    null,
    2,
  ) + "\n",
);

console.log(`\n  ${eventos.length} eventos · ${eventos.filter((e) => e.gratuito).length} gratuitos`);
console.log(`  escrito em ${saida.replace(RAIZ + "/", "")}\n`);
