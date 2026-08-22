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

/**
 * comentado.tsx — o modo comentado, DESLIGADO POR PADRÃO.
 *
 * POR QUE ELE EXISTE. As telas das fases 1 e 2 abrem explicando a si mesmas: um parágrafo
 * dizendo o que a tela é, o mecanismo por trás dela e notas de rodapé citando número de
 * decisão. O raciocínio está certo e vale guardar — mas quem avalia uma proposta vendo isso
 * lê uma ESPECIFICAÇÃO com uma moldura de celular desenhada em volta, não um produto. O RFP
 * aceita fidelidade visual baixa; isso é outra coisa que uma tela narrando a si mesma.
 *
 * A saída é um interruptor global, não uma edição destrutiva: o mesmo artefato é produto
 * (padrão) ou especificação anotada (ligado). Nada é apagado.
 *
 * O PADRÃO É «NÃO» E NÃO SE NEGOCIA. Se a demonstração abrir comentada, o interruptor não
 * resolveu nada — só mudou onde o problema mora.
 *
 * ESTE ARQUIVO É CÓPIA DELIBERADA DE `visao.tsx`, inclusive o sinalizador `hidratado` e o
 * `try/catch` em volta do `localStorage`. Dois padrões para «booleano global espelhado em
 * storage» divergiriam na primeira edição, e o sintoma seria um dos dois piscando o valor
 * errado no primeiro quadro. Ver a nota de hidratação abaixo.
 */

const CHAVE_ARMAZENAMENTO = "agenda-cultural:comentado";
const COMENTADO_INICIAL = false;

interface ContextoComentado {
  comentado: boolean;
  definirComentado: (comentado: boolean) => void;
  alternar: () => void;
  /** Falso até o localStorage ter sido lido — evita piscar o modo errado. */
  hidratado: boolean;
}

const Contexto = createContext<ContextoComentado | null>(null);

/** O valor gravado é `"sim"`/`"nao"`, e não `"true"`: é o mesmo vocabulário do atributo. */
function ehComentado(valor: unknown): valor is "sim" | "nao" {
  return valor === "sim" || valor === "nao";
}

export function ComentadoProvider({ children }: { children: ReactNode }) {
  const [comentado, setComentado] = useState<boolean>(COMENTADO_INICIAL);
  const [hidratado, setHidratado] = useState(false);

  // Sob output: "export" o HTML é gerado no build. Ler localStorage na primeira
  // renderização produziria divergência de hidratação — por isso a leitura mora
  // aqui, num efeito que só roda no cliente.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (ehComentado(salvo)) setComentado(salvo === "sim");
    } catch {
      // localStorage bloqueado (modo privado, iframe): o modo inicial serve.
    }
    setHidratado(true);
  }, []);

  const gravar = (proximo: boolean) => {
    try {
      window.localStorage.setItem(CHAVE_ARMAZENAMENTO, proximo ? "sim" : "nao");
    } catch {
      // Persistir é conveniência; não travar a troca se o storage recusar.
    }
  };

  const definirComentado = useCallback((proximo: boolean) => {
    setComentado(proximo);
    gravar(proximo);
  }, []);

  const alternar = useCallback(() => {
    setComentado((atual) => {
      const proximo = !atual;
      gravar(proximo);
      return proximo;
    });
  }, []);

  const valor = useMemo(
    () => ({ comentado, definirComentado, alternar, hidratado }),
    [comentado, definirComentado, alternar, hidratado],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useComentado(): ContextoComentado {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useComentado precisa estar dentro de <ComentadoProvider>");
  return ctx;
}
