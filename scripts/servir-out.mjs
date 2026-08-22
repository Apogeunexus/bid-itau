/**
 * servir-out.mjs — servidor estático de `out/`, com o `http` embutido do Node.
 *
 * A verificação da fase 2 roda sobre o ARTEFATO EXPORTADO, nunca sobre `next dev`. O que a
 * banca vai abrir é `out/`; medir o dev server mediria outra coisa — outro grafo de módulos,
 * outro caminho de hidratação, e avisos que não existem no artefato.
 *
 * `trailingSlash: true` no `next.config.ts` significa que a URL canônica de toda rota tem
 * barra final e o arquivo mora em `out/<rota>/index.html`. A fase 1 perdeu um gate por
 * presumir o contrário. Aqui a resolução é explícita nos dois sentidos.
 *
 * T-02-19 (Information Disclosure): o caminho pedido vem do navegador, logo é entrada não
 * confiável. Ele é decodificado, normalizado e conferido com `path.resolve` contra a raiz de
 * `out/`; qualquer destino fora dela devolve 403 sem tocar no disco. Sem essa conferência,
 * um `GET /../../.env` serviria o repositório inteiro — e o repositório inclui `dados/`.
 */

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

/** Só o que `out/` contém. Extensão desconhecida sai como octet-stream, nunca adivinhada. */
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const PORTA_PADRAO = 43217;

async function ehArquivo(caminho) {
  try {
    return (await stat(caminho)).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve a URL pedida para um arquivo dentro da raiz, ou devolve `null` (404) ou o
 * sinalizador `{ proibido: true }` (403, travessia tentada).
 */
async function resolver(raiz, urlBruta) {
  let caminhoUrl;
  try {
    caminhoUrl = decodeURIComponent(new URL(urlBruta, "http://localhost").pathname);
  } catch {
    return { proibido: true };
  }

  // Normaliza ANTES de juntar: `path.join` sozinho já resolveria `..`, mas normalizar aqui
  // deixa a intenção explícita e a conferência abaixo é a que de fato decide.
  const relativo = path.normalize(caminhoUrl).replace(/^(\.\.(\/|\\|$))+/, "");
  const alvo = path.resolve(raiz, "." + path.sep + relativo);

  // A conferência que vale: o destino resolvido tem de estar sob a raiz resolvida.
  // `startsWith(raiz)` sozinho aceitaria um irmão chamado `out-outro`; daí o separador.
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) return { proibido: true };

  if (await ehArquivo(alvo)) return { arquivo: alvo };

  // `/x/` e `/x` caem no mesmo `out/x/index.html` — a barra final é a canônica, mas servir
  // as duas evita que um clique relativo do próprio app vire 404 na verificação.
  const indice = path.join(alvo, "index.html");
  if (await ehArquivo(indice)) return { arquivo: indice };

  // Segment cache do Next 16.3: o cliente pede o payload numa linha só, com pontos —
  // `/rota/__next.!HASH.seg.__PAGE__.txt` — mas o export grava aninhado em pastas:
  // `/rota/__next.!HASH/seg/__PAGE__.txt`. Na Vercel um rewrite faz essa ponte; aqui
  // o servidor de verificação faz a mesma tradução, e SÓ quando o caminho literal
  // não existe (as formas `__next._full.txt` e `__next._tree.txt` são arquivos reais
  // e nunca chegam aqui).
  const m = path.basename(alvo).match(/^__next\.([^.]+)\.(.+)\.txt$/);
  if (m) {
    const aninhado = path.join(
      path.dirname(alvo),
      `__next.${m[1]}`,
      ...m[2].split("."),
    ) + ".txt";
    if (aninhado.startsWith(raiz + path.sep) && (await ehArquivo(aninhado))) {
      return { arquivo: aninhado };
    }
  }

  return null;
}

/**
 * Sobe o servidor e devolve `{ url, fechar }`. O ciclo de vida é do chamador — verificação
 * desassistida não pode depender de processo solto que ninguém encerra (T-02-21).
 */
export function servir({ raiz = path.resolve("out"), porta = PORTA_PADRAO } = {}) {
  const raizResolvida = path.resolve(raiz);

  const servidor = createServer((req, res) => {
    void (async () => {
      const resultado = await resolver(raizResolvida, req.url ?? "/");

      if (resultado?.proibido) {
        res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        res.end("403 — fora da raiz servida");
        return;
      }
      if (!resultado) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("404");
        return;
      }

      const tipo = TIPOS[path.extname(resultado.arquivo).toLowerCase()] ?? "application/octet-stream";
      res.writeHead(200, { "content-type": tipo, "cache-control": "no-store" });
      createReadStream(resultado.arquivo)
        .on("error", () => {
          res.destroy();
        })
        .pipe(res);
    })();
  });

  return new Promise((resolve, reject) => {
    servidor.on("error", reject);
    // Loopback explícito: o servidor da verificação não escuta em interface externa.
    servidor.listen(porta, "127.0.0.1", () => {
      const { port } = servidor.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        fechar: () =>
          new Promise((ok) => {
            servidor.closeAllConnections?.();
            servidor.close(() => ok());
          }),
      });
    });
  });
}
