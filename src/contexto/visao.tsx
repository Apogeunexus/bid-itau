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

/**
 * A única leitura de tamanho de janela fora do CSS, e ela não contradiz D-01: a
 * visão continua sendo estado da aplicação, o que muda é OFERECER a escolha. Num
 * telefone de verdade não há duas visões entre as quais escolher — a moldura já
 * colapsou em tela cheia (mesma medida em `base.css`) e a visão web é desenhada
 * para 1440px. Mesmo corte, os dois lugares: 430px.
 */
const JANELA_DE_TELEFONE = "(max-width: 430px)";

interface ContextoVisao {
  visao: Visao;
  definirVisao: (visao: Visao) => void;
  alternar: () => void;
  /** Falso até o localStorage ter sido lido — evita piscar a visão errada. */
  hidratado: boolean;
  /** Verdadeiro quando a JANELA é de telefone — não confundir com a visão app. */
  janelaDeTelefone: boolean;
}

const Contexto = createContext<ContextoVisao | null>(null);

function ehVisao(valor: unknown): valor is Visao {
  return valor === "mobile" || valor === "web";
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [visao, setVisao] = useState<Visao>(VISAO_INICIAL);
  const [hidratado, setHidratado] = useState(false);
  const [janelaDeTelefone, setJanelaDeTelefone] = useState(false);

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

  // A janela é medida por `matchMedia`, e não uma vez no carregamento: girar o
  // telefone atravessa os 430px, e o alternador tem de reaparecer no mesmo
  // instante em que a moldura volta a caber.
  useEffect(() => {
    const consulta = window.matchMedia(JANELA_DE_TELEFONE);
    const aplicar = () => setJanelaDeTelefone(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
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
    () => ({ visao, definirVisao, alternar, hidratado, janelaDeTelefone }),
    [visao, definirVisao, alternar, hidratado, janelaDeTelefone],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useVisao(): ContextoVisao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useVisao precisa estar dentro de <ViewProvider>");
  return ctx;
}
