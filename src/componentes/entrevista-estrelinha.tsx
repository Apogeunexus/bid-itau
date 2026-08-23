"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * entrevista-estrelinha.tsx — as quatro perguntas da IA (reformulação 2026-08).
 *
 * A entrevista NÃO computa nada: cada resposta é um pedaço do endereço, e o botão
 * final navega para a página pré-computada da combinação. A pergunta seguinte só
 * aparece depois da anterior respondida — é uma entrevista, não um formulário — e
 * o botão de gerar fica desabilitado até as quatro terem resposta.
 *
 * DP-F: tudo chega por props do componente de servidor; nenhum import de
 * `@/dados/estrelinha` por valor.
 */

export interface OpcaoDaEntrevista {
  slug: string;
  rotulo: string;
  /** Legenda opcional (ex.: o acervo da cidade). */
  detalhe?: string;
}

interface Props {
  gostos: OpcaoDaEntrevista[];
  companhias: OpcaoDaEntrevista[];
  dias: number[];
  cidades: OpcaoDaEntrevista[];
}

function Pergunta({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="tipo-destaque font-bold">
        <span className="text-acao">{numero}.</span> {titulo}
      </h2>
      {children}
    </section>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={
        ativo
          ? "rounded-pilula bg-tinta px-3 py-1.5 text-sm font-semibold text-ic-branco"
          : "rounded-pilula border border-borda-forte px-3 py-1.5 text-sm font-semibold text-tinta-2 transition-colors hover:border-tinta hover:text-tinta"
      }
    >
      {children}
    </button>
  );
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

export function EntrevistaEstrelinha({ gostos, companhias, dias, cidades }: Props) {
  const router = useRouter();
  const [gosto, setGosto] = useState<string | null>(null);
  const [companhia, setCompanhia] = useState<string | null>(null);
  const [nDias, setNDias] = useState<number | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);

  const completa = gosto !== null && companhia !== null && nDias !== null && cidade !== null;

  return (
    <div className="flex flex-col gap-5">
      <Pergunta numero={1} titulo="O que te chama?">
        <div className="flex flex-wrap gap-2">
          {gostos.map((g) => (
            <Chip key={g.slug} ativo={gosto === g.slug} onClick={() => setGosto(g.slug)}>
              {g.rotulo}
            </Chip>
          ))}
        </div>
      </Pergunta>

      {gosto !== null ? (
        <Pergunta numero={2} titulo="Com quem você vai?">
          <div className="flex flex-wrap gap-2">
            {companhias.map((c) => (
              <Chip key={c.slug} ativo={companhia === c.slug} onClick={() => setCompanhia(c.slug)}>
                {c.rotulo}
              </Chip>
            ))}
          </div>
          <p className="tipo-legenda text-tinta-3">
            Esta resposta não filtra o acervo — ele não declara classificação etária, e o
            roteiro diz isso em vez de fingir o recorte.
          </p>
        </Pergunta>
      ) : null}

      {companhia !== null ? (
        <Pergunta numero={3} titulo="Quantos dias?">
          <div className="flex flex-wrap gap-2">
            {dias.map((d) => (
              <Chip key={d} ativo={nDias === d} onClick={() => setNDias(d)}>
                {d} dias
              </Chip>
            ))}
          </div>
        </Pergunta>
      ) : null}

      {nDias !== null ? (
        <Pergunta numero={4} titulo="Em que cidade?">
          <div className="flex flex-wrap gap-2">
            {cidades.map((c) => (
              <Chip key={c.slug} ativo={cidade === c.slug} onClick={() => setCidade(c.slug)}>
                {c.rotulo}
                {c.detalhe ? <span className="ml-1 opacity-60">{c.detalhe}</span> : null}
              </Chip>
            ))}
          </div>
        </Pergunta>
      ) : null}

      <button
        type="button"
        disabled={!completa}
        onClick={() => {
          if (!completa) return;
          router.push(`/ia/roteiro/${cidade}--${nDias}-dias--${gosto}/#companhia=${companhia}`);
        }}
        className="w-fit rounded-pilula bg-acao px-5 py-2.5 text-sm font-bold text-ic-branco transition-opacity disabled:opacity-40"
      >
        ✦ Montar meu roteiro
      </button>
      {!completa ? (
        <p className="tipo-legenda text-tinta-3">
          O botão libera quando as quatro perguntas tiverem resposta.
        </p>
      ) : null}
    </div>
  );
}

/** A lista de roteiros salvos neste navegador — usada em /ia e no perfil. */
export function RoteirosSalvos() {
  const [salvos, setSalvos] = useState<string[] | null>(null);
  useEffect(() => {
    setSalvos(lerRoteirosSalvos());
  }, []);

  if (salvos === null) return null;
  if (salvos.length === 0) {
    return (
      <p className="tipo-legenda text-tinta-2">
        Nenhum roteiro salvo neste navegador ainda — a estrelinha guarda aqui os que você
        salvar.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {salvos.map((c) => (
        <li key={c}>
          <a href={`/ia/roteiro/${c}/`} className="text-sm font-semibold text-acao">
            ✦ {c.replaceAll("--", " · ").replaceAll("-", " ")}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** O botão de salvar/remover na página do roteiro. */
export function SalvarRoteiro({ combinacao }: { combinacao: string }) {
  const [salvo, setSalvo] = useState<boolean | null>(null);
  useEffect(() => {
    setSalvo(lerRoteirosSalvos().includes(combinacao));
  }, [combinacao]);

  if (salvo === null) return null;
  return (
    <button
      type="button"
      aria-pressed={salvo}
      onClick={() => {
        gravarRoteiroSalvo(combinacao, !salvo);
        setSalvo(!salvo);
      }}
      className={
        salvo
          ? "w-fit rounded-pilula bg-tinta px-4 py-2 text-sm font-bold text-ic-branco"
          : // smaug-ignore ui-strings: «acao» aqui é nome de classe CSS (bg-acao/text-acao), não texto de interface
            "w-fit rounded-pilula border-2 border-acao px-4 py-2 text-sm font-bold text-acao transition-colors hover:bg-acao hover:text-ic-branco"
      }
    >
      {salvo ? "✓ Roteiro salvo — remover" : "✦ Salvar este roteiro"}
    </button>
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
      Você disse que vai <strong>{companhia.toLowerCase()}</strong>. O acervo não declara
      classificação etária, então <strong>nada foi cortado por isso</strong> — o aviso fica
      aqui em vez de um filtro fingido.
    </p>
  );
}
