import type { Metadata } from "next";
import { Casca } from "@/componentes/casca";
import { ComentadoProvider } from "@/contexto/comentado";
import { SessaoProvider } from "@/contexto/sessao";
import { ViewProvider } from "@/contexto/visao";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda Cultural BR",
  description:
    "Protótipo de agenda cultural brasileira sobre o acervo do Itaú Cultural — uma visão app e uma visão web, do mesmo conjunto de componentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ViewProvider>
          <ComentadoProvider>
            <SessaoProvider>
              <Casca>{children}</Casca>
            </SessaoProvider>
          </ComentadoProvider>
        </ViewProvider>
      </body>
    </html>
  );
}
