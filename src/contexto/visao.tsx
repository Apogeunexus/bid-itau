"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** A visão é estado da aplicação, nunca tamanho de janela (D-01). */
export type Visao = "mobile" | "web";

const CHAVE_ARMAZENAMENTO = "agenda-cultural:visao";
const VISAO_INICIAL: Visao = "mobile";

interface ContextoVisao {
  visao: Visao;
  definirVisao: (visao: Visao) => void;
  alternar: () => void;
  /** Falso até o localStorage ter sido lido — evita piscar a visão errada. */
  hidratado: boolean;
}

const Contexto = createContext<ContextoVisao | null>(null);

function ehVisao(valor: unknown): valor is Visao {
  return valor === "mobile" || valor === "web";
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [visao, setVisao] = useState<Visao>(VISAO_INICIAL);
  const [hidratado, setHidratado] = useState(false);

  // Sob output: "export" o HTML é gerado no build. Ler localStorage na primeira
  // renderização produziria divergência de hidratação — por isso a leitura mora
  // aqui, num efeito que só roda no cliente.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (ehVisao(salvo)) setVisao(salvo);
    } catch {
      // localStorage bloqueado (modo privado, iframe): a visão inicial serve.
    }
    setHidratado(true);
  }, []);

  const definirVisao = useCallback((proxima: Visao) => {
    setVisao(proxima);
    try {
      window.localStorage.setItem(CHAVE_ARMAZENAMENTO, proxima);
    } catch {
      // Persistir é conveniência; não travar a troca se o storage recusar.
    }
  }, []);

  const alternar = useCallback(() => {
    setVisao((atual) => {
      const proxima: Visao = atual === "mobile" ? "web" : "mobile";
      try {
        window.localStorage.setItem(CHAVE_ARMAZENAMENTO, proxima);
      } catch {
        // idem
      }
      return proxima;
    });
  }, []);

  const valor = useMemo(
    () => ({ visao, definirVisao, alternar, hidratado }),
    [visao, definirVisao, alternar, hidratado],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useVisao(): ContextoVisao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useVisao precisa estar dentro de <ViewProvider>");
  return ctx;
}
