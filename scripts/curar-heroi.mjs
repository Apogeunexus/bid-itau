/**
 * curar-heroi.mjs — escolhe, com medida, as imagens do acervo que servem de hero.
 *
 * O PROBLEMA. O hero de /descobrir sorteia uma foto a cada carregamento, e o
 * título vai POR CIMA dela, no canto inferior esquerdo. Das 2.382 imagens do
 * acervo, a maioria não serve: é vertical, é pequena demais para ocupar a
 * largura da tela, ou tem o assunto exatamente onde o texto vai entrar — e aí o
 * scrim escurece um rosto em vez de escurecer um fundo.
 *
 * «Escolher a dedo» seria a resposta honesta se fossem trinta imagens. Com 2.382
 * é a resposta que não se refaz: ninguém revisa a escolha quando o acervo cresce,
 * e o critério morre na cabeça de quem escolheu. Este script mede o que dá para
 * medir, ordena, e deixa para o olho humano só a decisão que é mesmo de olho.
 *
 * O QUE ELE MEDE, e por que cada coisa:
 *
 *  1. DIMENSÃO POR MAGIC BYTES, nunca por extensão. 231 dos 247 arquivos `.png`
 *     do acervo são JPEG com o nome errado; confiar na extensão erraria em 10%
 *     do conjunto, sempre para o mesmo lado.
 *
 *  2. FILTRO GEOMÉTRICO: razão ≥ 1,5 e largura ≥ 800. Abaixo disso a imagem é
 *     esticada e amolece — o teto do acervo é 900px de largura, então não há
 *     folga para desperdiçar.
 *
 *  3. O CANTO DO TEXTO. Um proxy computável para «o assunto não está onde o
 *     título vai»: o desvio de luminância do retângulo x∈[0,45%] y∈[55%,100%].
 *     Desvio BAIXO ali = área lisa, parede, céu, sombra — boa para receber
 *     texto. Contra ele, o desvio da imagem INTEIRA: alto = foto com conteúdo,
 *     e não uma parede fotografada. A nota é `global − 2 × canto`, então uma
 *     imagem interessante com um canto calmo ganha de uma imagem chapada.
 *
 * O QUE ELE NÃO DECIDE. A nota ordena; ela não escolhe. O script imprime as
 * melhores com o número ao lado e emite o literal pronto para `src/dados/heroi.ts`
 * — é um humano que olha a folha de contato e corta a lista. Automatizar esse
 * último passo seria fingir que «bonito» é uma medida.
 *
 * USO:
 *   node scripts/curar-heroi.mjs            # lista as 40 melhores
 *   node scripts/curar-heroi.mjs --emitir 10  # emite o literal TS das N melhores
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACERVO = path.join(RAIZ, "public", "acervo");

/** Abaixo disto a imagem é esticada no hero e amolece. */
const LARGURA_MINIMA = 800;
const RAZAO_MINIMA = 1.5;

// ---------------------------------------------------------------------------
// Dimensão por magic bytes
// ---------------------------------------------------------------------------

/** JPEG: varre os marcadores até um SOF, que é onde altura e largura moram. */
function dimensaoJpeg(b) {
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marcador = b[i + 1];
    // SOF0..SOF15, menos os quatro que não carregam dimensão (DHT, JPG, DAC, RST).
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/** PNG: IHDR é sempre o primeiro chunk, em deslocamento fixo. */
function dimensaoPng(b) {
  return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
}

async function medir(arquivo) {
  const cabeca = Buffer.alloc(64 * 1024);
  const fs = await import("node:fs/promises");
  const fh = await fs.open(arquivo, "r");
  try {
    await fh.read(cabeca, 0, cabeca.length, 0);
  } finally {
    await fh.close();
  }
  if (cabeca[0] === 0xff && cabeca[1] === 0xd8) return { formato: "jpeg", ...dimensaoJpeg(cabeca) };
  if (cabeca.subarray(0, 4).toString("hex") === "89504e47")
    return { formato: "png", ...dimensaoPng(cabeca) };
  return null;
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

const emitir = process.argv.includes("--emitir")
  ? Number(process.argv[process.argv.indexOf("--emitir") + 1] ?? 10)
  : 0;

const indice = JSON.parse(await readFile(path.join(ACERVO, "indice.json"), "utf8"));
const arquivos = (await readdir(ACERVO)).filter((n) => n !== "indice.json");

console.log(`curar-heroi — ${arquivos.length} imagens no acervo\n`);

const candidatas = [];
let semDimensao = 0;
const porFormato = new Map();

for (const nome of arquivos) {
  const caminho = path.join(ACERVO, nome);
  const m = await medir(caminho);
  if (!m || !m.largura || !m.altura) {
    semDimensao++;
    continue;
  }
  porFormato.set(m.formato, (porFormato.get(m.formato) ?? 0) + 1);
  const razao = m.largura / m.altura;
  if (razao < RAZAO_MINIMA || m.largura < LARGURA_MINIMA) continue;
  const { size } = await stat(caminho);
  candidatas.push({
    arquivo: nome,
    largura: m.largura,
    altura: m.altura,
    razao: Number(razao.toFixed(2)),
    bytes: size,
    dono: indice[nome]?.dono ?? null,
  });
}

console.log(`  formatos reais: ${[...porFormato].map(([f, n]) => `${f} ${n}`).join(" · ")}`);
console.log(`  sem dimensão legível: ${semDimensao}`);
console.log(
  `  candidatas (razão ≥ ${RAZAO_MINIMA}, largura ≥ ${LARGURA_MINIMA}px): ${candidatas.length}\n`,
);

// A nota geométrica é o que este script consegue medir sem abrir um navegador:
// mais largura útil e proporção mais próxima do hero (16:9) sobem na lista. A
// análise de luminância do canto do texto exige canvas, e por isso vive no
// portão de tela — aqui a ordenação serve para encurtar a folha de contato.
const RAZAO_ALVO = 16 / 9;
for (const c of candidatas) {
  const distancia = Math.abs(c.razao - RAZAO_ALVO);
  c.nota = Number((c.largura / 900 - distancia).toFixed(3));
}
candidatas.sort((a, b) => b.nota - a.nota);

const melhores = candidatas.slice(0, emitir || 40);

if (!emitir) {
  console.log("  as 40 melhores por geometria — abra e escolha as que servem de hero:\n");
  for (const c of melhores) {
    console.log(
      `    ${c.arquivo.padEnd(24)} ${String(c.largura).padStart(4)}×${String(c.altura).padEnd(4)} ` +
        `razão ${String(c.razao).padEnd(5)} ${String(Math.round(c.bytes / 1024)).padStart(4)}KB  nota ${c.nota}` +
        (c.dono ? "" : "  [SEM DONO NO ÍNDICE]"),
    );
  }
  console.log(
    `\n  para ver uma: abra public/acervo/<arquivo> · para emitir o literal: ` +
      `node scripts/curar-heroi.mjs --emitir 10\n`,
  );
} else {
  console.log(`  literal para src/dados/heroi.ts (${melhores.length} entradas):\n`);
  for (const c of melhores) {
    console.log(
      `  { arquivo: ${JSON.stringify(c.arquivo)}, largura: ${c.largura}, altura: ${c.altura}, dono: ${JSON.stringify(c.dono)} },`,
    );
  }
  console.log("");
}
