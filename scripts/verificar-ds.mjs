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
 *  5. Nas folhas MIGRADAS, medida `rem` FORA da grade de 0.25rem, `px`/`ms`
 *     literais e `text-align: center|justify` em bloco de texto são proibidos
 *     (a regra documentada em DESIGN-SYSTEM.md §2: múltiplos da grade são
 *     legítimos; papel semântico vira token; duração vira --dur-*). A lista
 *     cresce a cada onda de redesign.
 *
 * Rode com `node scripts/verificar-ds.mjs`.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");

/** Folhas cuja migração para tokens já foi feita — as únicas onde medida
 *  literal fora da grade é proibida. Desde a rodada de 2026-08, TODAS: as 21
 *  antigas passaram pelo migrador determinístico e a catraca vale para o
 *  conjunto inteiro. */
const FOLHAS_MIGRADAS = [
  "acontece-web.css",
  "agenda.css",
  "base.css",
  "busca.css",
  "cidade.css",
  "filtros.css",
  "frase.css",
  "mapa.css",
  "menu-lateral.css",
  "observatorio.css",
  "play.css",
  "produtor.css",
  "redacao.css",
  "roteiro.css",
  "salvos.css",
  "sem-resultado.css",
  "studio-duplicatas.css",
  "studio-ocorrencias.css",
  "studio.css",
  "web-buscar.css",
  "web-descobrir.css",
  "web-evento.css",
  "web.css",
];

/** Medidas que podem existir mesmo em folha migrada, nomeadas uma a uma. */
const EXCECOES_DE_MEDIDA = [
  "16px", // o corpo-base do manual (12 pt) em base.css — o corte, não uma medida de tela
  "390px", // a moldura do telefone (D-03): medida própria dela,
  "844px", // idem
  "430px", // a única @media de viewport — colapso da moldura
  "10px", // a borda da moldura
  "24px", // a sombra da moldura (par com 60px)
  "60px",
  "288px", // o teto do desenho do mapa nacional (mapa.css)
  "286px",
];

/** Até este tamanho, px é detalhe físico (borda, sublinhado, deslocamento de
 *  sombra) e não medida de layout — layout em px acima disso é violação. */
const TETO_PX_FISICO = 8;

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
      .filter((m) => {
        if (EXCECOES_DE_MEDIDA.includes(m)) return false;
        // rem múltiplo de 0.25 é a grade — legítimo (DESIGN-SYSTEM.md §2).
        if (m.endsWith("rem")) return (Number(m.slice(0, -3)) * 100) % 25 !== 0;
        // px pequeno é físico (borda, offset de sombra); layout em px é violação.
        if (m.endsWith("px")) return Number(m.slice(0, -2)) > TETO_PX_FISICO;
        return true;
      });
    const centrados = [...limpo.matchAll(/text-align:\s*(center|justify)/g)];
    exigir(
      medidas.length === 0 && centrados.length === 0,
      `${nome}: só tokens (0 medidas literais, 0 text-align center/justify)`,
      `${medidas.length} medida(s) ${medidas.slice(0, 8).join(", ")} · ${centrados.length} centralizado(s)`,
      "0 e 0",
    );
  }
}

// ---- 6. Os dois blocos do tema escuro declaram o MESMO conjunto ---------
//
// O tema escuro mora em dois seletores — `@media (prefers-color-scheme: dark)`
// para o escuro do sistema e `:root[data-tema="escuro"]` para o escolhido à
// mão. CSS não tem mixin e os dois não cabem numa lista de seletores (a @media
// precisa do `:not([data-tema="claro"])`, o outro não pode tê-lo), então a
// lista é escrita duas vezes. O defeito previsível é alguém acrescentar um
// token num bloco e esquecer o outro: o tema passaria a se comportar diferente
// conforme tivesse sido escolhido ou herdado do sistema, que é o pior tipo de
// bug de tema — o que só aparece na máquina de outra pessoa.
//
// O gate compara NOMES DE PROPRIEDADE, não valores. Valor divergente é decisão
// legítima (um bloco pode um dia querer outro degrau); nome faltando nunca é.
{
  const fonte = semComentarios(await readFile(path.join(SRC, "estilos", "tokens.css"), "utf8"));
  // Casa INÍCIO DE LINHA, e não qualquer `nome:`, por dois motivos: pega
  // `color-scheme` junto das custom properties (um `--?` no começo o deixaria
  // de fora, e ele é justamente a declaração que o navegador usa para pintar
  // canvas e barra de rolagem), e não confunde o `in srgb,` de dentro de um
  // color-mix multilinha com uma declaração nova.
  // `[a-z0-9-]` e não `[a-z-]`: metade dos tokens do DS termina em dígito
  // (`--cor-tinta-2`, `--cor-superficie-2`, `--sombra-1`), e um nome sem
  // dígito deixaria justamente esses fora da comparação — um gate cego para os
  // tokens que mais divergem é pior que nenhum, porque relata verde.
  const nomesDe = (corpo) => [...corpo.matchAll(/^\s*([a-z0-9-]+)\s*:/gm)].map((m) => m[1]).sort();

  const daMedia = fonte.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-tema="claro"\]\)\s*\{([\s\S]*?)\n {2}\}/);
  const daEscolha = fonte.match(/:root\[data-tema="escuro"\]\s*\{([\s\S]*?)\n\}/);

  const nomesMedia = daMedia ? nomesDe(daMedia[1]) : [];
  const nomesEscolha = daEscolha ? nomesDe(daEscolha[1]) : [];
  const soNaMedia = nomesMedia.filter((n) => !nomesEscolha.includes(n));
  const soNaEscolha = nomesEscolha.filter((n) => !nomesMedia.includes(n));

  exigir(
    nomesMedia.length > 0 && soNaMedia.length === 0 && soNaEscolha.length === 0,
    "os dois blocos do tema escuro declaram o mesmo conjunto de propriedades",
    nomesMedia.length === 0
      ? "não achei o bloco @media do tema escuro em tokens.css"
      : `${nomesMedia.length} propriedades nos dois` +
        (soNaMedia.length ? ` · só na @media: ${soNaMedia.join(", ")}` : "") +
        (soNaEscolha.length ? ` · só no [data-tema]: ${soNaEscolha.join(", ")}` : ""),
    "conjuntos idênticos",
  );
}

console.log(
  falhas.length === 0
    ? `\n  ${verdes} gates verdes, 0 falhas.\n`
    : `\n  ${verdes} verdes · ${falhas.length} FALHA(S): ${falhas.join(" · ")}\n`,
);
process.exitCode = falhas.length === 0 ? 0 : 1;
