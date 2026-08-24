/**
 * Rasteriza a assinatura oficial (public/marca/itau-cultural-negativo.svg)
 * em ícones quadrados pretos para o PWA.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SVG = path.join(RAIZ, "public", "marca", "itau-cultural-negativo.svg");
const DESTINO = path.join(RAIZ, "public", "icones");
const APP = path.join(RAIZ, "src", "app");

await mkdir(DESTINO, { recursive: true });

async function icone(tamanho, fração, arquivo) {
  const larguraLogo = Math.round(tamanho * fração);
  const logo = await sharp(SVG, { density: 400 })
    .resize({ width: larguraLogo, fit: "inside" })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: tamanho,
      height: tamanho,
      channels: 3,
      background: "#000000",
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(arquivo);
  console.log(`  ${path.relative(RAIZ, arquivo)}  ${tamanho}×${tamanho}`);
}

await icone(192, 0.82, path.join(DESTINO, "icon-192.png"));
await icone(512, 0.82, path.join(DESTINO, "icon-512.png"));
await icone(512, 0.58, path.join(DESTINO, "icon-512-maskable.png"));
await icone(180, 0.82, path.join(DESTINO, "apple-touch-icon.png"));
await icone(192, 0.82, path.join(APP, "icon.png"));
await icone(180, 0.82, path.join(APP, "apple-icon.png"));
