"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  ICONE_ACONTECE,
  ICONE_ALERTA,
  ICONE_RELOGIO,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { useSessao } from "@/contexto/sessao";
import type { AlteracaoAutorada, ParDeDemonstracao } from "@/dados/alerta";
import type { IndiceSalvaveis } from "@/dados/repertorio";

/**
 * salvos.tsx — Salvos e alertas (AGEN-03, `docs/telas.md` tela 23). **Cenário 4 do RFP.**
 *
 * A AFIRMAÇÃO QUE ESTA TELA EXISTE PARA TORNAR VISÍVEL. Uma mudança de horário atinge UMA
 * OCORRÊNCIA e não invalida o evento — então só quem salvou aquela sessão é avisado, e as
 * irmãs do mesmo evento seguem como estavam. Isso é consequência direta de DADO-02.
 *
 * POR ISSO A FILA É DE SESSÕES E DIZ QUE É (D-56). Duas sessões do mesmo evento viram
 * DUAS LINHAS. Colapsar as duas numa linha de evento apagaria a distinção do Cenário 4.
 *
 * T-03-09: todo id vindo de `localStorage` é resolvido contra o índice do build antes de
 * virar linha. Id desconhecido é descartado e CONTADO.
 *
 * DP-F: `import type` em tudo que vem de `@/dados/alerta` e `@/dados/repertorio`.
 */

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function dataAgenda(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  const nome = MESES_CURTOS[Number(mes) - 1];
  return nome ? `${Number(dia)} ${nome} ${ano}` : iso.slice(0, 10);
}

interface LinhaSalva {
  ocorrenciaId: string;
  eventoSlug: string;
  eventoTitulo: string;
  rota: string;
  /** "YYYY-MM-DDTHH:mm", como o índice compacto o guarda. Ordena por comparação de string. */
  inicio: string;
  dataCurta: string;
  hora: string;
  gratuito: boolean;
  passada: boolean;
  imagem: string | null;
  linguagens: string[];
  alteracao: AlteracaoAutorada | undefined;
}

/**
 * O bloco de alerta (D-57). Os dois horários, o selo autorado e as palavras
 * «informado» / «por» ficam no texto — o portão do Cenário 4 lê isso.
 */
function BlocoAlerta({
  alteracao,
  imagem,
  linguagens,
}: {
  alteracao: AlteracaoAutorada;
  imagem: string | null;
  linguagens: string[];
}) {
  return (
    <article data-alerta={alteracao.ocorrenciaId} className="alerta-alteracao">
      <Link href={alteracao.rota} className="alerta-capa no-underline">
        <CapaDeCartao
          titulo={alteracao.eventoTitulo}
          classe="evento"
          linguagens={linguagens}
          imagem={imagem ?? undefined}
          className="size-full"
        />
      </Link>

      <div className="alerta-corpo">
        <div className="alerta-cabeca">
          <span className="alerta-icone" aria-hidden>
            {ICONE_ALERTA}
          </span>
          <span className="alerta-campo">{alteracao.campoRotulo}</span>
          <span data-procedencia-alerta={alteracao.procedencia} className="alerta-selo">
            {alteracao.procedencia}
          </span>
        </div>

        <Link href={alteracao.rota} className="alerta-titulo no-underline">
          {alteracao.eventoTitulo}
        </Link>

        <p className="alerta-mudanca">
          <span className="alerta-de">{alteracao.de}</span>
          <span aria-hidden className="alerta-seta">
            →
          </span>
          <span className="alerta-para">{alteracao.para}</span>
        </p>

        <p className="alerta-meta">
          <span>
            {ICONE_ACONTECE}
            {dataAgenda(alteracao.inicioReal)}
          </span>
        </p>

        <p className="alerta-ficha">
          informado {alteracao.informadoEmCurto} · por{" "}
          {alteracao.informanteDoAcervo ? alteracao.quemInformou : "curadoria"}
        </p>

        <p className="alerta-cenario">Só quem salvou esta sessão foi avisado.</p>
      </div>
    </article>
  );
}

function LinhaDaFila({
  linha,
  aoRemover,
}: {
  linha: LinhaSalva;
  aoRemover: (id: string) => void;
}) {
  const alertada = Boolean(linha.alteracao);
  return (
    <li
      data-salvo={linha.ocorrenciaId}
      data-salvo-alertado={alertada ? "sim" : "nao"}
      data-salvo-passada={linha.passada ? "sim" : "nao"}
      className="salvos-item"
    >
      <Link href={linha.rota} className="salvos-capa no-underline">
        <CapaDeCartao
          titulo={linha.eventoTitulo}
          classe="evento"
          linguagens={linha.linguagens}
          imagem={linha.imagem ?? undefined}
          className="size-full"
        />
      </Link>

      <div className="salvos-corpo">
        <Link href={linha.rota} className="salvos-evento no-underline">
          {linha.eventoTitulo}
        </Link>

        <p className="salvos-meta">
          <span>
            {ICONE_ACONTECE}
            {dataAgenda(linha.inicio)}
          </span>
          <span>
            {ICONE_RELOGIO}
            {linha.hora}
          </span>
          <span
            className={`salvos-marca ${alertada ? "salvos-marca-alertada" : "salvos-marca-intacta"}`}
          >
            {alertada ? "alterada" : "sem alteração"}
          </span>
        </p>

        <p className="salvos-pills">
          {linha.gratuito ? (
            <>
              <span className="selo-acervo">Gratuito</span>
              <span className="selo-acervo">Sem ingresso</span>
            </>
          ) : (
            <span className="selo-acervo">com ingresso</span>
          )}
        </p>

        <button
          type="button"
          className="salvos-remover"
          onClick={() => aoRemover(linha.ocorrenciaId)}
        >
          Remover
        </button>
      </div>
    </li>
  );
}

export function Salvos({
  indice,
  alteracoes,
  par,
  hoje,
}: {
  indice: IndiceSalvaveis;
  alteracoes: AlteracaoAutorada[];
  par: ParDeDemonstracao;
  hoje: string;
}) {
  const { salvos, alternarSalvo, hidratado } = useSessao();

  const porOcorrencia = useMemo(() => {
    const mapa = new Map<string, AlteracaoAutorada>();
    for (const a of alteracoes) mapa.set(a.ocorrenciaId, a);
    return mapa;
  }, [alteracoes]);

  const { linhas, trilhas } = useMemo(() => {
    if (!hidratado) {
      return { linhas: [] as LinhaSalva[], trilhas: [] as string[] };
    }

    const saida: LinhaSalva[] = [];
    const trilhasSalvas: string[] = [];
    const vistos = new Set<string>();

    for (const id of salvos) {
      if (id.startsWith("trilha:")) {
        trilhasSalvas.push(id);
        continue;
      }
      if (vistos.has(id)) continue;
      vistos.add(id);

      const chave =
        indice.prefixo && id.startsWith(indice.prefixo) ? id.slice(indice.prefixo.length) : id;
      const entrada = indice.ocorrencias[chave];
      if (!entrada) continue;
      const [posicao, inicio, gratuito] = entrada;
      const evento = indice.eventos[posicao];
      if (!evento) continue;
      const [slug, titulo, imagem, linguagens] = evento;
      const [ano, mes, dia] = inicio.slice(0, 10).split("-");

      saida.push({
        ocorrenciaId: id,
        eventoSlug: slug,
        eventoTitulo: titulo,
        rota: `/evento/${slug}/`,
        inicio,
        dataCurta: `${dia}.${mes}.${ano}`,
        hora: inicio.slice(11, 16),
        gratuito: gratuito === 1,
        passada: inicio.slice(0, 10) < hoje,
        imagem,
        linguagens,
        alteracao: porOcorrencia.get(id),
      });
    }

    saida.sort((a, b) => a.inicio.localeCompare(b.inicio) || a.ocorrenciaId.localeCompare(b.ocorrenciaId));

    return { linhas: saida, trilhas: trilhasSalvas };
  }, [hidratado, salvos, indice, porOcorrencia, hoje]);

  const alertadas = useMemo(() => linhas.filter((l) => l.alteracao), [linhas]);

  const semear = useCallback(() => {
    for (const id of [par.atingida.id, par.intacta.id]) {
      if (!salvos.includes(id)) alternarSalvo(id);
    }
  }, [par, salvos, alternarSalvo]);

  return (
    <div data-salvos={linhas.length} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="tipo-titulo-1 font-bold">Salvos</h1>
        <p className="tipo-detalhe text-tinta-2">
          {linhas.length
            ? `${linhas.length} ${linhas.length === 1 ? "sessão guardada" : "sessões guardadas"}`
            : "As sessões que você guardou."}
        </p>
      </header>

      {alertadas.map((linha) =>
        linha.alteracao ? (
          <BlocoAlerta
            key={linha.ocorrenciaId}
            alteracao={linha.alteracao}
            imagem={linha.imagem}
            linguagens={linha.linguagens}
          />
        ) : null,
      )}

      {linhas.length ? (
        <ul className="salvos-lista">
          {linhas.map((linha) => (
            <LinhaDaFila key={linha.ocorrenciaId} linha={linha} aoRemover={alternarSalvo} />
          ))}
        </ul>
      ) : (
        <div className="salvos-vazio">
          <span className="salvos-vazio-icone" aria-hidden>
            {ICONE_SALVOS}
          </span>
          <p className="salvos-vazio-titulo">Nada salvo ainda</p>
          <p className="salvos-vazio-texto">
            Guarde uma sessão na página de um evento para ela aparecer aqui.
          </p>
          <button type="button" data-semear-cenario-4 className="salvos-semear" onClick={semear}>
            Ver o par de exemplo
          </button>
        </div>
      )}

      <p className="salvos-declarado">
        Trilhas salvas: {trilhas.length === 0 ? "nenhuma" : trilhas.length}
        {" · "}
        <Link href="/meu/repertorio/" className="salvos-declarado-link">
          ver em Meu Repertório
        </Link>
      </p>
    </div>
  );
}
