"use client";

import { useEffect, useState } from "react";

/**
 * entrevista-estrelinha.tsx — persistência e controles compartilhados da IA.
 *
 * A conversa mora em `ia-conversa.tsx`. Aqui ficam a chave de roteiros salvos
 * (fora da sessão de persona), o botão de salvar, o recado do pedido e a troca
 * de combinação que preserva a companhia.
 *
 * DP-F: nenhum import de `@/dados/estrelinha` por valor.
 */

export interface OpcaoDaEntrevista {
  slug: string;
  rotulo: string;
  /** Legenda opcional (ex.: o acervo da cidade). */
  detalhe?: string;
  /** Contagem medida no build — o artefato de pensamento lê este número. */
  total?: number;
}

/** Os roteiros salvos neste navegador. Chave própria, fora da sessão de persona. */
const CHAVE_SALVOS = "agenda-cultural:roteiros-estrelinha";

export function lerRoteirosSalvos(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_SALVOS);
    const valor: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
  } catch { /* smaug-ignore empty-catch: storage bloqueado (modo privado/iframe) degrada para lista vazia — contrato de sessao.tsx */
    return [];
  }
}

export function gravarRoteiroSalvo(combinacao: string, salvar: boolean): string[] {
  const atual = lerRoteirosSalvos();
  const proxima = salvar
    ? [combinacao, ...atual.filter((c) => c !== combinacao)]
    : atual.filter((c) => c !== combinacao);
  try {
    window.localStorage.setItem(CHAVE_SALVOS, JSON.stringify(proxima));
  } catch { /* smaug-ignore empty-catch: persistir é conveniência; storage bloqueado não pode quebrar o clique — contrato de sessao.tsx */ }
  return proxima;
}

function rotuloDaCombinacao(
  combinacao: string,
  cidades: readonly OpcaoDaEntrevista[],
  gostos: readonly OpcaoDaEntrevista[],
): { titulo: string; meta: string } {
  const partes = combinacao.split("--");
  if (partes.length !== 3) return { titulo: combinacao, meta: "roteiro salvo" };
  const [cidadeSlug, diasPart, gostoSlug] = partes;
  const cidade = cidades.find((c) => c.slug === cidadeSlug)?.rotulo ?? cidadeSlug.replaceAll("-", " ");
  const dias = diasPart.replace("-dias", "");
  const gosto = gostos.find((g) => g.slug === gostoSlug)?.rotulo ?? gostoSlug.replaceAll("-", " ");
  return { titulo: `${gosto} em ${cidade}`, meta: `${dias} dias` };
}

/** A lista de roteiros salvos neste navegador — usada em /ia. */
export function RoteirosSalvos({
  cidades,
  gostos,
}: {
  cidades: readonly OpcaoDaEntrevista[];
  gostos: readonly OpcaoDaEntrevista[];
}) {
  const [salvos, setSalvos] = useState<string[] | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  useEffect(() => {
    setSalvos(lerRoteirosSalvos());
  }, []);

  if (salvos === null) return null;
  if (salvos.length === 0) {
    return (
      <p className="tipo-legenda text-tinta-2">
        Nenhum roteiro salvo neste navegador — quando você salvar um, ele aparece aqui.
      </p>
    );
  }
  return (
    <ul className="ia-salvos">
      {salvos.map((c) => {
        const { titulo, meta } = rotuloDaCombinacao(c, cidades, gostos);
        return (
          <li key={c} className="ia-salvo">
            <a href={`/ia/roteiro/${c}/`} className="ia-salvo-link">
              <span className="ia-salvo-titulo">{titulo}</span>
              <span className="ia-salvo-meta tipo-legenda">{meta}</span>
            </a>
            {confirmando === c ? (
              <div className="ia-confirmar" role="group" aria-label={`Remover ${titulo}`}>
                <span className="ia-confirmar-pergunta">Remover este roteiro?</span>
                <button
                  type="button"
                  className="ia-remover"
                  data-perigo="sim"
                  onClick={() => {
                    setSalvos(gravarRoteiroSalvo(c, false));
                    setConfirmando(null);
                  }}
                >
                  Remover
                </button>
                <button type="button" className="ia-remover" onClick={() => setConfirmando(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" className="ia-remover" onClick={() => setConfirmando(c)}>
                Remover
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** O botão de salvar/remover na página do roteiro. */
export function SalvarRoteiro({ combinacao }: { combinacao: string }) {
  const [salvo, setSalvo] = useState<boolean | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => {
    setSalvo(lerRoteirosSalvos().includes(combinacao));
  }, [combinacao]);

  if (salvo === null) return null;

  if (salvo && confirmando) {
    return (
      <div className="ia-confirmar" role="group" aria-label="Confirmar remoção do roteiro">
        <span className="ia-confirmar-pergunta">Remover este roteiro salvo?</span>
        <button
          type="button"
          // smaug-ignore ui-strings: «acao» é o token CSS do DS (ia-acao), não texto de interface
          className="ia-acao"
          data-perigo="sim"
          onClick={() => {
            gravarRoteiroSalvo(combinacao, false);
            setSalvo(false);
            setConfirmando(false);
          }}
        >
          Remover
        </button>
        <button
          type="button"
          // smaug-ignore ui-strings: «acao» é o token CSS do DS (ia-acao), não texto de interface
          className="ia-acao"
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={salvo}
      // smaug-ignore ui-strings: «acao» é o token CSS do DS (ia-acao), não texto de interface
      className={salvo ? "ia-acao" : "ia-acao ia-acao-primaria"}
      onClick={() => {
        if (salvo) {
          setConfirmando(true);
          return;
        }
        gravarRoteiroSalvo(combinacao, true);
        setSalvo(true);
      }}
    >
      {salvo ? "Roteiro salvo" : "Salvar roteiro"}
    </button>
  );
}

/**
 * Link de troca de combinação que PRESERVA a companhia do hash: sem isso, trocar
 * gosto ou janela apagaria em silêncio uma das quatro respostas (achado do
 * critic). O href nasce sem hash no HTML estático e ganha o hash após montar —
 * mudança de atributo, sem divergência de hidratação.
 */
export function LinkDaCombinacao({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const m = window.location.hash.match(/companhia=[a-z-]+/);
    if (m) setHash(`#${m[0]}`);
  }, []);
  return (
    <a
      href={`${href}${hash}`}
      aria-current={ativo ? "true" : undefined}
      className={
        ativo
          ? "rounded-pilula bg-tinta px-2.5 py-1 text-xs font-bold text-fundo no-underline"
          : "rounded-pilula border border-borda px-2.5 py-1 text-xs font-semibold text-tinta-2 no-underline"
      }
    >
      {children}
    </a>
  );
}

/** O aviso da companhia, lido do hash — a resposta 2 viaja fora do slug de propósito. */
export function AvisoDaCompanhia({ rotulos }: { rotulos: Record<string, string> }) {
  const [companhia, setCompanhia] = useState<string | null>(null);
  useEffect(() => {
    const m = window.location.hash.match(/companhia=([a-z-]+)/);
    setCompanhia(m ? (rotulos[m[1]] ?? null) : null);
  }, [rotulos]);

  if (!companhia) return null;
  return (
    <p className="rounded-m border border-borda bg-superficie-2 px-3 py-2 text-sm leading-snug">
      Você disse «{companhia}». O acervo não declara classificação etária, então{" "}
      <strong>nada foi cortado por isso</strong> — o aviso fica aqui em vez de um filtro
      fingido.
    </p>
  );
}

/** Bolha do pedido, reconstruída das respostas da URL — a companhia vem do hash. */
export function RecadoDoPedido({
  cidade,
  dias,
  gosto,
  rotulosCompanhia,
}: {
  cidade: string;
  dias: number;
  gosto: string;
  rotulosCompanhia: Record<string, string>;
}) {
  const [companhia, setCompanhia] = useState<string | null>(null);
  useEffect(() => {
    const m = window.location.hash.match(/companhia=([a-z-]+)/);
    setCompanhia(m ? (rotulosCompanhia[m[1]] ?? null) : null);
    // A navegação é client-side e quem rola é `.moldura-rolagem`, não a janela —
    // sem isto o roteiro abre no miolo da tela anterior.
    document.querySelector(".moldura-rolagem")?.scrollTo({ top: 0 });
  }, [rotulosCompanhia]);

  const texto = companhia
    ? `${dias} dias em ${cidade}, com ${gosto}. ${companhia}.`
    : `${dias} dias em ${cidade}, com ${gosto}.`;

  return <p className="ia-balao ia-balao-usuario">{texto}</p>;
}
