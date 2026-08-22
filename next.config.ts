import type { NextConfig } from "next";

// Export estático (D-24): o artefato final é uma pasta que abre em qualquer lugar,
// sem servidor, sem server action e sem chamada de rede em runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
