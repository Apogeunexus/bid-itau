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
 * O tema tem TRÊS estados, e não dois.
 *
 * «sistema» não é o valor de partida até alguém escolher — é uma escolha em si,
 * e a única que respeita quem trocou o tema no sistema operacional depois. Um
 * interruptor de dois estados perderia esse valor no primeiro toque: uma vez
 * escolhido «claro», não haveria mais como voltar a acompanhar o sistema sem
 * limpar o armazenamento na mão.
 */
export type Tema = "sistema" | "claro" | "escuro";

const CHAVE_ARMAZENAMENTO = "agenda-cultural:tema";
const TEMA_INICIAL: Tema = "sistema";

/** A ordem do ciclo do botão. «sistema» primeiro porque é o padrão a que se volta. */
const CICLO: readonly Tema[] = ["sistema", "claro", "escuro"] as const;

interface ContextoTema {
  tema: Tema;
  definirTema: (tema: Tema) => void;
  /** Avança no ciclo sistema → claro → escuro → sistema. */
  alternar: () => void;
  /** Falso até o localStorage ter sido lido — ver o efeito de sincronização. */
  hidratado: boolean;
}

const Contexto = createContext<ContextoTema | null>(null);

function ehTema(valor: unknown): valor is Tema {
  return valor === "sistema" || valor === "claro" || valor === "escuro";
}

function guardar(tema: Tema) {
  try {
    // «sistema» é a AUSÊNCIA de escolha, e é gravado como ausência: com a chave
    // removida, `antes-da-pintura.js` não escreve atributo nenhum e a media
    // query volta a mandar. Gravar a string "sistema" exigiria que o script
    // soubesse traduzi-la de volta para «não faça nada» — um estado a mais para
    // manter em dois arquivos que não se enxergam.
    if (tema === "sistema") window.localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    else window.localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
  } catch (erro) {
    console.warn("[tema] não consegui guardar a escolha; ela vale só nesta aba.", erro);
  }
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(TEMA_INICIAL);
  const [hidratado, setHidratado] = useState(false);

  // Sob output: "export" o HTML é gerado no build, então ler localStorage na
  // primeira renderização produziria divergência de hidratação — mesmo motivo
  // de `visao.tsx`, e a mesma forma, de propósito: dois padrões para ler uma
  // preferência global divergiriam na primeira correção.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (ehTema(salvo)) setTema(salvo);
    } catch (erro) {
      console.warn("[tema] não consegui ler a escolha salva; seguindo o sistema.", erro);
    }
    setHidratado(true);
  }, []);

  // O ATRIBUTO É ESCRITO À MÃO, E NÃO POR JSX, porque ele mora no `<html>` — que
  // é renderizado pelo layout de servidor e está fora desta árvore. Escrever por
  // efeito tem um efeito colateral bom: o React nunca reconcilia `data-tema`,
  // então o que `antes-da-pintura.js` escreveu antes da hidratação não conta
  // como divergência.
  //
  // O GUARDA DE `hidratado` É O QUE MATA O FLASH. Sem ele, este efeito rodaria
  // uma vez com o estado inicial «sistema» — ANTES de o efeito acima ter lido o
  // armazenamento — e removeria justamente o atributo que o script pôs lá para
  // evitar a piscada. O sintoma seria a página nascer certa e clarear sozinha um
  // quadro depois, que é pior do que nunca ter tentado.
  useEffect(() => {
    if (!hidratado) return;
    const raiz = document.documentElement;
    if (tema === "sistema") raiz.removeAttribute("data-tema");
    else raiz.setAttribute("data-tema", tema);
  }, [tema, hidratado]);

  const definirTema = useCallback((proximo: Tema) => {
    setTema(proximo);
    guardar(proximo);
  }, []);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo = CICLO[(CICLO.indexOf(atual) + 1) % CICLO.length] ?? TEMA_INICIAL;
      guardar(proximo);
      return proximo;
    });
  }, []);

  const valor = useMemo(
    () => ({ tema, definirTema, alternar, hidratado }),
    [tema, definirTema, alternar, hidratado],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTema(): ContextoTema {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useTema precisa estar dentro de <TemaProvider>");
  return ctx;
}
