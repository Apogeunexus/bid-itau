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
import { PERSONA_PADRAO, personaIdValido } from "@/dados/personas";

/**
 * sessao.tsx — o estado de sessão do protótipo (D-46).
 *
 * Persona ativa, disposições escolhidas e ocorrências salvas. React Context com espelho
 * em `localStorage`, sem biblioteca de estado — o protótipo não justifica uma, e a fase 1
 * já resolveu a visão exatamente assim (`visao.tsx`). Este arquivo segue aquele padrão de
 * propósito, inclusive o sinalizador `hidratado`.
 *
 * D-25 continua valendo: NÃO HÁ AUTENTICAÇÃO. Isto é escolha de persona gravada no
 * navegador, não sessão de usuário. Nenhum dado pessoal entra aqui.
 *
 * DP-F: importa `personas.json` (3,4 KB) por `@/dados/personas`, nunca `@/dados/grafo`.
 * O grafo tem 23 MB e não atravessa a fronteira do cliente.
 */

const CHAVE_PERSONA = "agenda-cultural:persona";
const CHAVE_DISPOSICOES = "agenda-cultural:disposicoes";
const CHAVE_SALVOS = "agenda-cultural:salvos";

interface ContextoSessao {
  personaId: string;
  definirPersona: (id: string) => void;
  /** Ids de disposição escolhidos no onboarding (DESC-01). Seleção múltipla. */
  disposicoes: string[];
  alternarDisposicao: (id: string) => void;
  definirDisposicoes: (ids: string[]) => void;
  /** Ids de ocorrência salvos (D-42). Alimenta Meu Repertório na onda 2. */
  salvos: string[];
  alternarSalvo: (id: string) => void;
  /** Falso até o localStorage ter sido lido — evita piscar a persona errada. */
  hidratado: boolean;
}

const Contexto = createContext<ContextoSessao | null>(null);

/** Lista de strings guardada como JSON. Storage corrompido devolve lista vazia. */
function lerLista(chave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function gravar(chave: string, valor: string) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  // O valor inicial é a PRIMEIRA persona, não o que está no storage: sob output: "export"
  // o HTML é gerado no build, e ler localStorage no primeiro render divergiria da
  // hidratação. A leitura mora no efeito abaixo, que só roda no cliente.
  const [personaId, setPersonaId] = useState<string>(PERSONA_PADRAO);
  const [disposicoes, setDisposicoes] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    let salvo: string | null = null;
    try {
      salvo = window.localStorage.getItem(CHAVE_PERSONA);
    } catch {
      // idem
    }
    // T-02-02: o valor vem de storage editável pelo avaliador. Persona desconhecida cai
    // na primeira em vez de propagar id inválido para dentro do feed.
    setPersonaId(personaIdValido(salvo));
    setDisposicoes(lerLista(CHAVE_DISPOSICOES));
    setSalvos(lerLista(CHAVE_SALVOS));
    setHidratado(true);
  }, []);

  const definirPersona = useCallback((id: string) => {
    const valido = personaIdValido(id);
    setPersonaId(valido);
    gravar(CHAVE_PERSONA, valido);
  }, []);

  const definirDisposicoes = useCallback((ids: string[]) => {
    setDisposicoes(ids);
    gravar(CHAVE_DISPOSICOES, JSON.stringify(ids));
  }, []);

  const alternarDisposicao = useCallback((id: string) => {
    setDisposicoes((atual) => {
      const proxima = atual.includes(id) ? atual.filter((d) => d !== id) : [...atual, id];
      gravar(CHAVE_DISPOSICOES, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const alternarSalvo = useCallback((id: string) => {
    setSalvos((atual) => {
      const proxima = atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id];
      gravar(CHAVE_SALVOS, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const valor = useMemo(
    () => ({
      personaId,
      definirPersona,
      disposicoes,
      alternarDisposicao,
      definirDisposicoes,
      salvos,
      alternarSalvo,
      hidratado,
    }),
    [
      personaId,
      definirPersona,
      disposicoes,
      alternarDisposicao,
      definirDisposicoes,
      salvos,
      alternarSalvo,
      hidratado,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  return ctx;
}
