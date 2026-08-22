import type { NextConfig } from "next";

// Export estático (D-24): o artefato final é uma pasta que abre em qualquer lugar,
// sem servidor, sem server action e sem chamada de rede em runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: {
    // 11 workers de geração estática × grafo de ~25 MB carregado em cada um
    // estouram a memória num build local («Fatal process out of memory: Zone»).
    // Menos workers com mais páginas cada geram o mesmo out/, só que em fila.
    staticGenerationMinPagesPerWorker: 700,
  },
};

export default nextConfig;
