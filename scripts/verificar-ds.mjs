/**
 * VERIFICAÇÃO ESTRUTURAL DO DESIGN SYSTEM (reformulação de 2026-08).
 *
 * Suíte estática — nenhum navegador, nenhum build. Ela trava as regras que
 * fazem o DS continuar sendo um DS depois que a próxima tela nascer:
 *
 *  1. Hex do manual SÓ em `globals.css` (D-06). Nem folha, nem componente.
 *  2. Utilitário arbitrário `-[var(--ic-laranja)]` proibido em TSX: laranja é
 *     AÇÃO e a forma semântica é `text-acao`/`bg-acao`/`border-acao`.
 *  3. Os arbitrários de preto/branco em TSX estão CONGELADOS no número da
 *     migração (catraca: podem diminuir, nunca crescer — a forma nova é
 *     `text-tinta`/`bg-fundo`/`bg-superficie`).
 *  4. Só `tokens.css` DECLARA tokens do DS (`--cor-*`, `--tipo-*`, `--espaco-*`,
 *     `--raio-*`, `--sombra-*`, `--dur-*`). As outras folhas consomem.
 *  5. Nas folhas MIGRADAS, medida literal (`rem`/`px`/`ms`) e `text-align:
 *     center|justify` em bloco de texto são proibidos — a lista começa nas
 *     folhas novas do DS e cresce a cada onda de redesign.
 *
 * Rode com `node scripts/verificar-ds.mjs`.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");

/** Folhas cuja migração para tokens já foi feita — as únicas onde medida
 *  literal é proibida. Cada onda de redesign acrescenta as suas aqui. */
const FOLHAS_MIGRADAS = [];

/** Medidas que podem existir mesmo em folha migrada, nomeadas uma a uma. */
const EXCECOES_DE_MEDIDA = [
  "1px", // borda de 1 device pixel não é token, é física
  "0px",
];

/** Teto congelado de `-[var(--ic-preto|branco)]` em TSX (medido na migração). */
const TETO_ARBITRARIOS_PRETO_BRANCO = 62;

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas.push(nome);
}

async function arquivosDe(dir, padrao) {
  const saida = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && padrao.test(e.name)) saida.push(path.join(e.parentPath, e.name));
  }
  return saida;
}

function semComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function semComentariosTs(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

console.log("\nverificar-ds — regras estruturais do design system");

// ---- 1. Hex só em globals.css -------------------------------------------
{
  const arquivos = [
    ...(await arquivosDe(path.join(SRC, "estilos"), /\.css$/)),
    ...(await arquivosDe(SRC, /\.tsx?$/)),
  ];
  const hits = [];
  for (const a of arquivos) {
    const cru = await readFile(a, "utf8");
    const limpo = a.endsWith(".css") ? semComentarios(cru) : semComentariosTs(cru);
    for (const m of limpo.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      hits.push(`${path.relative(RAIZ, a)}: ${m[0]}`);
    }
  }
  exigir(
    hits.length === 0,
    "hex do manual só em globals.css (D-06)",
    hits.length === 0 ? `0 hex fora de globals.css em ${arquivos.length} arquivos` : hits.join(" | "),
    "0",
  );
}

// ---- 2. Laranja arbitrário proibido em TSX ------------------------------
{
  const tsx = await arquivosDe(SRC, /\.tsx$/);
  const hits = [];
  for (const a of tsx) {
    const limpo = semComentariosTs(await readFile(a, "utf8"));
    if (/-\[var\(--ic-laranja\)\]/.test(limpo)) hits.push(path.relative(RAIZ, a));
  }
  exigir(
    hits.length === 0,
    "nenhum `-[var(--ic-laranja)]` em TSX (a forma é text-acao/bg-acao/border-acao)",
    hits.length === 0 ? `0 em ${tsx.length} arquivos` : hits.join(", "),
    "0",
  );
}

// ---- 3. Preto/branco arbitrários congelados (catraca) -------------------
{
  const tsx = await arquivosDe(SRC, /\.tsx$/);
  let total = 0;
  for (const a of tsx) {
    const limpo = semComentariosTs(await readFile(a, "utf8"));
    total += [...limpo.matchAll(/-\[var\(--ic-(?:preto|branco)\)\]/g)].length;
  }
  exigir(
    total <= TETO_ARBITRARIOS_PRETO_BRANCO,
    `arbitrários de preto/branco em TSX ≤ ${TETO_ARBITRARIOS_PRETO_BRANCO} (catraca da migração)`,
    `${total}`,
    `≤ ${TETO_ARBITRARIOS_PRETO_BRANCO}`,
  );
}

// ---- 4. Só tokens.css declara tokens do DS ------------------------------
{
  const folhas = await arquivosDe(path.join(SRC, "estilos"), /\.css$/);
  const hits = [];
  for (const a of folhas) {
    if (path.basename(a) === "tokens.css") continue;
    const limpo = semComentarios(await readFile(a, "utf8"));
    for (const m of limpo.matchAll(/--(?:cor|tipo|espaco|raio|sombra|dur)-[a-z0-9-]*\s*:/g)) {
      hits.push(`${path.relative(RAIZ, a)}: ${m[0].trim()}`);
    }
  }
  exigir(
    hits.length === 0,
    "nenhuma folha além de tokens.css DECLARA token do DS",
    hits.length === 0 ? `0 declarações em ${folhas.length - 1} folhas` : hits.join(" | "),
    "0",
  );
}

// ---- 5. Folhas migradas: sem medida literal, sem texto centralizado -----
{
  if (FOLHAS_MIGRADAS.length === 0) {
    console.log("  ·    folhas migradas: nenhuma ainda — o gate liga na primeira onda de redesign");
  }
  for (const nome of FOLHAS_MIGRADAS) {
    const a = path.join(SRC, "estilos", nome);
    const limpo = semComentarios(await readFile(a, "utf8"));
    const medidas = [...limpo.matchAll(/\b\d+(?:\.\d+)?(?:rem|px|ms)\b/g)]
      .map((m) => m[0])
      .filter((m) => !EXCECOES_DE_MEDIDA.includes(m));
    const centrados = [...limpo.matchAll(/text-align:\s*(center|justify)/g)];
    exigir(
      medidas.length === 0 && centrados.length === 0,
      `${nome}: só tokens (0 medidas literais, 0 text-align center/justify)`,
      `${medidas.length} medida(s) ${medidas.slice(0, 8).join(", ")} · ${centrados.length} centralizado(s)`,
      "0 e 0",
    );
  }
}

console.log(
  falhas.length === 0
    ? `\n  ${verdes} gates verdes, 0 falhas.\n`
    : `\n  ${verdes} verdes · ${falhas.length} FALHA(S): ${falhas.join(" · ")}\n`,
);
process.exitCode = falhas.length === 0 ? 0 : 1;
