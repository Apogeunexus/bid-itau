import type { NextConfig } from "next";

/**
 * next.config.ts — e o que NÃO está aqui, que é a parte que economiza tempo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CACHE DE BUILD: já está no máximo, e não há o que acrescentar
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Verificado contra a documentação que veio no próprio pacote
 * (`node_modules/next/dist/docs/`), na versão instalada — 16.3.2:
 *
 * 1. `turbopackFileSystemCacheForBuild` **já vale `true` por padrão** desde o
 *    16.3.0 (`.../01-next-config-js/turbopackFileSystemCache.md`, linhas 41 e
 *    58). Escrevê-lo aqui seria repetir o padrão: mais uma linha para manter,
 *    zero mudança de comportamento. Ele grava em `.next/cache`, e o único caso
 *    em que valeria DESLIGAR é um ambiente que nunca preserva esse diretório —
 *    escrever um cache que ninguém vai ler custa tempo em vez de poupar.
 *
 * 2. A Vercel, que é onde este projeto builda, **já persiste `.next/cache`
 *    sozinha**: «Next.js caching is automatically configured for you. There's
 *    no action required on your part» (`.../02-guides/ci-build-caching.md:17`).
 *    Não há `vercel.json` a escrever, e o `build` do `package.json` é `next
 *    build` puro — nada limpa `.next` antes e mata o cache.
 *
 * 3. `cacheComponents`, a diretiva `'use cache'` e a Regeneração Estática
 *    Incremental **não se aplicam a este projeto**, e não por escolha: a tabela
 *    de compatibilidade de `'use cache'` diz «Static export → No»
 *    (`.../01-directives/use-cache.md:695`), `cacheComponents` exige runtime
 *    Node.js (`.../cacheComponents.md:28`) e a ISR está na lista de recursos
 *    sem suporte do export estático (`.../02-guides/static-exports.md:288`).
 *    Os três são cache de REQUISIÇÃO — existem para servir uma página sem
 *    recalculá-la a cada visita. Aqui não há visita a servir: o artefato é uma
 *    pasta de HTML, e todo o custo já foi pago no build.
 *
 * O que sobra de custo neste build não é compilação — é gerar 2.463 páginas
 * percorrendo 24 MB de JSON. Cache do empacotador não toca nisso.
 * ------------------------------------------------------------------------- */

// Export estático (D-24): o artefato final é uma pasta que abre em qualquer lugar,
// sem servidor, sem server action e sem chamada de rede em runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,

  /**
   * SÓ VALE EM `next dev`, e existe por um motivo concreto.
   *
   * `localhost` compartilha cookies entre TODAS as portas, então quem roda vários
   * projetos acumula cabeçalho até estourar o limite de 16 KB do Node e receber
   * um HTTP 431 sem explicação. A saída é abrir por `127.0.0.1`, que o navegador
   * trata como outro host e para o qual não manda esses cookies.
   *
   * Mas o Next 16 também trata `127.0.0.1` como outra ORIGEM e bloqueia os
   * chunks de desenvolvimento: a página chega inteira, o JavaScript não, e o
   * sintoma é uma tela que renderiza e nunca hidrata — nenhum botão responde, e
   * o console fala de «cross-origin», não de hidratação. Declarar a origem aqui
   * é o que o próprio aviso do Next manda fazer.
   *
   * Não afeta o build: `next build` não lê esta opção.
   */
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // 24 MB de JSON (`arestas` 13 MB + `entidades` 9,4 MB + `ocorrencias` 1,8 MB)
    // são carregados POR WORKER, e em memória viram várias vezes isso em objetos.
    // Com o padrão do Next — 25 páginas por worker — as 2.463 páginas abrem uma
    // fila de workers do tamanho do número de núcleos, e o build morre com
    // «Fatal process out of memory: Zone».
    //
    // 700 põe ~4 workers no lugar de ~11. É mais lento por ter menos paralelismo,
    // e é essa a troca: um build que termina devagar vale mais que um que não
    // termina. A correção do comentário anterior, que dizia «num build local»:
    // o teto de memória de um builder na nuvem é MENOR que o dos 15 GB desta
    // máquina, então o valor protege os dois lados — não é um ajuste de
    // desenvolvimento que a Vercel poderia ignorar.
    //
    // Subir este número é a única alavanca real de tempo que este build tem, e
    // ela é medida, não chutada: comparar o pico de memória do deploy antes e
    // depois, um degrau por vez.
    staticGenerationMinPagesPerWorker: 700,
  },
};

export default nextConfig;
