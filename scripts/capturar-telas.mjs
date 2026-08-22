/**
 * CAPTURA DE TELAS — o complemento humano das suítes numéricas.
 *
 * A lição registrada em ARQUITETURA §6: sete vezes um portão passou com a tela
 * visivelmente quebrada, e todas as sete quem pegou foi a captura. Este script
 * fotografa as rotas-chave nas DUAS visões e escreve os PNG em
 * `verificacao/capturas/` — fora do git (.gitignore): a revisão a olho acontece
 * no fechamento da onda, não no histórico.
 *
 * Uso: `node scripts/capturar-telas.mjs` (exige `out/` de um build recente).
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const OUT = path.join(RAIZ, "out");
const DESTINO = path.join(RAIZ, "verificacao", "capturas");

/** Rotas-chave: as superfícies que o cliente vê primeiro + uma por família. */
const ROTAS = [
  "/descobrir/",
  "/acontece/",
  "/play/",
  "/buscar/",
  "/mapa/",
  "/meu/",
  "/salvos/",
  "/filtros/",
  "/entrar/",
  "/onboarding/1/",
  // Um evento qualquer do acervo, descoberto no out/ do build — slug fixo aqui
  // apodreceria junto com o grafo.
  `/evento/${readdirSync(path.join(RAIZ, "out", "evento"))[0]}/`,
  "/studio/duplicatas/",
  "/redacao/fila/",
  "/observatorio/",
  "/roteiro/",
];

const VISOES = ["mobile", "web"];

const servidor = await servir({ raiz: OUT, porta: Number(process.env.PORTA ?? 0) || undefined });
const cdp = await abrirNavegador();
await mkdir(DESTINO, { recursive: true });

let escritas = 0;
try {
  for (const visao of VISOES) {
    for (const rota of ROTAS) {
      await cdp.navegar(`${servidor.url}${rota}`);
      // A visão é estado persistido: escreve a chave e recarrega para o
      // ViewProvider ler no boot — o mesmo caminho que um usuário real faz.
      await cdp.avaliar(`localStorage.setItem("agenda-cultural:visao", ${JSON.stringify(visao)})`);
      await cdp.recarregar();
      await cdp.avaliar(
        `new Promise((r) => { const t = () => document.querySelector('[data-hidratado="sim"]') ? r(1) : setTimeout(t, 50); t(); })`,
      );
      const nome = `${visao}-${rota.replaceAll("/", "-").replace(/^-|-$/g, "") || "raiz"}.png`;
      const png = await cdp.capturar();
      await writeFile(path.join(DESTINO, nome), Buffer.from(png, "base64"));
      escritas += 1;
      console.log(`  foto  ${nome}`);
    }
  }
} finally {
  await cdp.encerrar();
  await servidor.fechar();
}

console.log(`\n  ${escritas} capturas em ${path.relative(RAIZ, DESTINO)}\n`);
