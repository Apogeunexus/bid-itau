import type { Metadata, Viewport } from "next";
import { Casca } from "@/componentes/casca";
import { ComentadoProvider } from "@/contexto/comentado";
import { SessaoProvider } from "@/contexto/sessao";
import { TemaProvider } from "@/contexto/tema";
import { ViewProvider } from "@/contexto/visao";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda Cultural BR",
  description:
    "Protótipo de agenda cultural brasileira sobre o acervo do Itaú Cultural — uma visão app e uma visão web, do mesmo conjunto de componentes.",
};

/**
 * `colorScheme` declara ao navegador que o documento serve os dois temas.
 *
 * Não é redundante com o `color-scheme: dark` de `tokens.css`: aquele só chega
 * quando a folha chega, e esta é uma meta tag que o navegador lê no cabeçalho —
 * é ela que pinta o CANVAS na cor certa antes do primeiro byte de CSS, matando o
 * lampejo branco que apareceria entre a resposta e a folha em conexão lenta.
 * Também é o que faz barra de rolagem, campo de formulário e menu de contexto
 * nativos nascerem escuros em vez de brancos dentro de uma página preta.
 *
 * Pela API de metadados do Next, e não por `<head>` escrito à mão — a regra do
 * App Router, e aqui também a única forma que não colide com os portões.
 */
export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` porque `antes-da-pintura.js` acrescenta
    // `data-tema` a este elemento antes de o React existir. O aviso seria
    // legítimo em qualquer outro atributo; neste é o mecanismo funcionando.
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        {/* Primeiro filho do body e SEM `async`, para bloquear o parser e rodar
            antes da primeira pintura — ver o cabeçalho do próprio arquivo. */}
        <script src="/antes-da-pintura.js" />
        <TemaProvider>
          <ViewProvider>
            <ComentadoProvider>
              <SessaoProvider>
                <Casca>{children}</Casca>
              </SessaoProvider>
            </ComentadoProvider>
          </ViewProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
