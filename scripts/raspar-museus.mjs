#!/usr/bin/env node
/**
 * raspar-museus.mjs — ingestão federada de museus de São Paulo, em dois estágios.
 *
 * POR QUE DOIS ESTÁGIOS, E POR QUE ISSO É A DEMONSTRAÇÃO. A listagem de exposição de um
 * museu quase nunca traz o que um evento precisa: ela mostra título e chamada, e guarda
 * data, imagem e preço na página de dentro. Uma raspagem de um estágio devolve cartão sem
 * data — que é exatamente o defeito que o Agenda Cultural BR existe para não ter. Então o
 * script faz o que um ingestor de verdade faz: descobre as páginas na listagem e ABRE CADA
 * UMA para completar a ficha.
 *
 * A EXTRAÇÃO NÃO DEPENDE DO TEMA DO SITE. MASP e Pinacoteca são dois WordPress diferentes,
 * com marcações diferentes, e escrever um seletor por museu é o caminho que quebra na
 * primeira reforma de site. O que os dois têm em comum — e o que qualquer página pública
 * tem, porque redes sociais exigem — são as metatags Open Graph: `og:title`, `og:image`,
 * `og:description`. É delas que sai a ficha, e por isso um museu novo custa três linhas de
 * configuração em vez de um parser novo.
 *
 * A DATA VEM DO TEXTO, e vem por padrão e não por seletor: museu escreve período como
 * «15.05 – 13.09.2026» ou «15 de maio a 13 de setembro de 2026», e as duas formas são
 * reconhecíveis sem saber onde no DOM elas estão.
 *
 * O QUE SAI DAQUI É CANDIDATO, NÃO EVENTO. Todo campo carrega `procedencia: "parceiro"` e
 * `revisadoPor: null`. O script afirma «o museu publicou isto»; quem afirma «isto é um
 * evento do Agenda Cultural BR» é humano, na fila do Studio (D-15, D-16).
 *
 * Uso: `node scripts/raspar-museus.mjs [--so masp|pinacoteca]`
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "dados", "parceiros", "museus-sp.json");

const MUSEUS = [
  {
    chave: "masp",
    nome: "MASP — Museu de Arte de São Paulo Assis Chateaubriand",
    espaco: "MASP, Avenida Paulista, São Paulo, SP",
    listagem: "https://masp.org.br/pt-br/exposicoes",
    padraoDoLink: /\/exposicoes\/[a-z0-9-]+$/i,
  },
  {
    chave: "pinacoteca",
    nome: "Pinacoteca de São Paulo",
    espaco: "Pinacoteca de São Paulo, Luz, São Paulo, SP",
    listagem: "https://pinacoteca.org.br/programacao/exposicoes/",
    padraoDoLink: /\/programacao\/exposicoes\/[a-z0-9-]+\/$/i,
  },
];

const MESES = {
  janeiro: "01", fevereiro: "02", "março": "03", marco: "03", abril: "04", maio: "05",
  junho: "06", julho: "07", agosto: "08", setembro: "09", outubro: "10",
  novembro: "11", dezembro: "12",
};

/**
 * As duas formas em que museu escreve período, e nada além delas — inventar um terceiro
 * padrão «por via das dúvidas» só produz falso positivo em texto de release.
 */
function datasDoTexto(texto) {
  const numerico = [...texto.matchAll(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g)].map(
    (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`,
  );
  if (numerico.length) return numerico;

  const porExtenso = [...texto.matchAll(
    /(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{4}))?/gi,
  )]
    .map((m) => {
      const mes = MESES[m[2].toLowerCase()];
      return mes ? { dia: m[1].padStart(2, "0"), mes, ano: m[3] } : null;
    })
    .filter(Boolean);

  // «15 de maio – 13 de setembro de 2026»: o ano só aparece na última data e vale para
  // as anteriores. Sem isto, a abertura ficaria sem ano e a ocorrência, inválida.
  const ano = porExtenso.findLast((d) => d.ano)?.ano;
  if (!ano) return [];
  return porExtenso.map((d) => `${d.ano ?? ano}-${d.mes}-${d.dia}`);
}

const LINKS = `(() => {
  const vistos = new Set();
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.href.split("#")[0].split("?")[0];
    vistos.add(h);
  }
  return JSON.stringify([...vistos]);
})()`;

const FICHA = `(() => {
  const meta = (p) => document.querySelector(\`meta[property="\${p}"], meta[name="\${p}"]\`)?.content || null;
  return JSON.stringify({
    // NÃO HÁ UM CAMPO CONFIÁVEL DE TÍTULO, e fingir que há foi o primeiro erro: o og:title
    // do MASP é «MASP» em toda página; o h1 da Pinacoteca traz a migalha «Exposições:»
    // colada por cima; o h1 do MASP é o logotipo. Então o script COLETA CANDIDATOS e a
    // escolha acontece fora do navegador, onde dá para descartar o nome do museu.
    candidatos: [
      ...[...document.querySelectorAll("h1, h2")].slice(0, 4).map((h) => h.innerText || ""),
      meta("og:title") || "",
      document.title || "",
    ].flatMap((t) => t.split("\\n")).map((t) => t.trim()).filter(Boolean),
    resumo: meta("og:description"),
    imagem: meta("og:image"),
    texto: (document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 1200),
  });
})()`;

const so = process.argv.includes("--so") ? process.argv[process.argv.indexOf("--so") + 1] : null;
const cdp = await abrirNavegador();
const eventos = [];

try {
  for (const museu of MUSEUS) {
    if (so && so !== museu.chave) continue;
    console.log(`\n  ${museu.nome}`);
    await cdp.navegar(museu.listagem);
    await new Promise((r) => setTimeout(r, 5000));

    const cru = await cdp.avaliar(LINKS);
    const todos = JSON.parse(typeof cru === "string" ? cru : (cru?.value ?? "[]"));
    const paginas = todos.filter((h) => museu.padraoDoLink.test(h));
    console.log(`    ${paginas.length} exposições na listagem`);

    for (const pagina of paginas) {
      await cdp.navegar(pagina);
      await new Promise((r) => setTimeout(r, 1800));
      const f = await cdp.avaliar(FICHA);
      const ficha = JSON.parse(typeof f === "string" ? f : (f?.value ?? "{}"));

      const datas = datasDoTexto(ficha.texto || "");
      // O NOME DA EXPOSIÇÃO É O PRIMEIRO CANDIDATO QUE NÃO É O NOME DA CASA. Migalha de
      // navegação («Exposições:»), logotipo («MASP») e sufixo de site são o que sobra
      // quando um museu não marca o título — descartá-los por lista é honesto e visível,
      // e o slug da própria URL é a última linha de defesa, nunca um título inventado.
      // A lista cresceu com o que a raspagem encontrou de fato — o widget de acessibilidade
      // da Pinacoteca injeta um h2 antes do conteúdo, e ele vencia por ser o primeiro.
      const LIXO =
        /^(masp|pinacoteca|exposições?|exposition|menu|programação|home|início)\b[:\s]*$|plugin de acessibilidade|hand talk|pular para|navegação/i;
      const titulo =
        (ficha.candidatos || [])
          .map((t) =>
            t
              .replace(/\s*[|–-]\s*(MASP|Pinacoteca)[^|]*$/i, "")
              .replace(/^(Pinacoteca\s*[–-]\s*|Exposições?:\s*)/i, "")
              .trim(),
          )
          .find((t) => t.length > 4 && !LIXO.test(t)) ||
        pagina
          .replace(/\/$/, "")
          .split("/")
          .pop()
          .replace(/-/g, " ")
          .replace(/^./, (c) => c.toUpperCase());
      if (!titulo) continue;

      eventos.push({
        id: `evento:parceiro:${museu.chave}-${pagina.replace(/\/$/, "").split("/").pop()}`,
        titulo,
        classe: "evento",
        procedencia: "parceiro",
        fonte: museu.nome,
        fonteUrl: pagina,
        resumo: ficha.resumo,
        espacoDeclarado: museu.espaco,
        // Museu não publica preço na página da exposição; declarar «gratuito: false» seria
        // afirmar o que a fonte não disse. Fica nulo, e a tela diz «não publicado».
        gratuito: null,
        ocorrencias: datas.length
          ? [{ inicio: datas[0], fim: datas[datas.length - 1] }]
          : [],
        imagem: ficha.imagem,
        revisadoPor: null,
      });
      console.log(
        `      ${datas[0] ?? "sem data"}  ${titulo.slice(0, 52)}${ficha.imagem ? "  [img]" : ""}`,
      );
    }
  }
} finally {
  await cdp.encerrar();
}

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(
  SAIDA,
  JSON.stringify(
    {
      metodo:
        "dois estágios em navegador headless: listagem descobre as páginas, cada página " +
        "entrega a ficha por Open Graph. Nenhum seletor de tema — só metatag e padrão de data.",
      museus: MUSEUS.filter((m) => !so || so === m.chave).map((m) => m.nome),
      total: eventos.length,
      comData: eventos.filter((e) => e.ocorrencias.length).length,
      comImagem: eventos.filter((e) => e.imagem).length,
      eventos,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `\n  ${eventos.length} exposições · ${eventos.filter((e) => e.ocorrencias.length).length} com data · ` +
    `${eventos.filter((e) => e.imagem).length} com imagem`,
);
console.log(`  escrito em ${SAIDA.replace(RAIZ + "/", "")}\n`);
