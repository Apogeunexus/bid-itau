"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ICONE_CORACAO,
  ICONE_CORACAO_CHEIO,
  ICONE_FALA,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { Painel, Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { comunidadePorId, pessoaPorId } from "@/dados/comunidade";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

export function Monograma({ autorId, pequeno }: { autorId: string; pequeno?: boolean }) {
  const pessoa = pessoaPorId(autorId);
  return (
    <span className="monograma" data-porte={pequeno ? "pequeno" : undefined} aria-hidden="true">
      {pessoa?.monograma ?? "?"}
    </span>
  );
}

export function nomeDe(autorId: string): string {
  return pessoaPorId(autorId)?.nome ?? "Alguém";
}

export function assinaturaDe(autorId: string, diasAtras: number): string {
  const pessoa = pessoaPorId(autorId);
  const quando = diasAtras === 0 ? "hoje" : `há ${diasAtras}d`;
  return pessoa?.cidade ? `${pessoa.cidade} · ${quando}` : quando;
}

function Enquete({ opcoes }: { opcoes: { rotulo: string; pct: number }[] }) {
  const [votou, setVotou] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {opcoes.map((opcao, i) => (
        <button
          key={opcao.rotulo}
          type="button"
          className="enquete-opcao"
          disabled={votou !== null}
          onClick={() => setVotou(i)}
        >
          {votou !== null && (
            <span className="enquete-preenchimento" style={{ width: `${opcao.pct}%` }} />
          )}
          <span className={votou === i ? "font-bold" : undefined}>{opcao.rotulo}</span>
          {votou !== null && <span className="tipo-legenda font-bold">{opcao.pct}%</span>}
        </button>
      ))}
      <span className="tipo-legenda text-tinta-3">
        {votou === null ? "Vote para ver o resultado parcial" : "Obrigado pelo voto."}
      </span>
    </div>
  );
}

function Cartao({ publicacao }: { publicacao: PublicacaoDefinida }) {
  const router = useRouter();
  const { motor, hidratado } = usePontos();

  const reagi = hidratado && (motor.atual.reacoesDadas[publicacao.id] ?? 0) > 0;
  const guardada = hidratado && motor.atual.publicacoesSalvas.includes(publicacao.id);
  const comentarios = publicacao.comentarios.reduce(
    (soma, c) => soma + 1 + (c.respostas?.length ?? 0),
    0,
  );

  function reagir() {
    if (reagi) return;
    motor.emitir("comunidade.reacao.dada", { tipo: "publicacao", id: publicacao.id });
  }

  function guardar() {
    motor.emitir("comunidade.publicacao.salva", { tipo: "publicacao", id: publicacao.id });
  }

  function abrir() {
    router.push(`/comunidade/publicacao/${publicacao.id}/`);
  }

  return (
    <article className="publicacao">
      <div className="publicacao-topo">
        <Monograma autorId={publicacao.autorId} />
        <div className="flex min-w-0 flex-col">
          <span className="tipo-detalhe font-bold">{nomeDe(publicacao.autorId)}</span>
          <span className="tipo-legenda text-tinta-3">
            {assinaturaDe(publicacao.autorId, publicacao.diasAtras)}
          </span>
        </div>
      </div>

      <button type="button" className="publicacao-corpo" onClick={abrir}>
        <span className="publicacao-imagem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicacao.imagem} alt={publicacao.imagemAlt} loading="lazy" />
        </span>
        <span className="tipo-destaque font-bold">{publicacao.titulo}</span>
        {publicacao.corpo && (
          <span className="publicacao-chamada">
            <span className="publicacao-trecho">{publicacao.corpo}</span>
            <span className="publicacao-ler-mais">ler mais</span>
          </span>
        )}
      </button>

      {publicacao.enquete && <Enquete opcoes={publicacao.enquete.opcoes} />}

      <div className="publicacao-rodape">
        <button
          type="button"
          className="pastilha"
          data-ativa={reagi ? "sim" : "nao"}
          onClick={reagir}
          aria-pressed={reagi}
          aria-label="Reagir"
        >
          {reagi ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
          <span>{publicacao.reacoes}</span>
        </button>
        <button type="button" className="pastilha" onClick={abrir} aria-label="Comentar">
          {ICONE_FALA}
          <span>{comentarios}</span>
        </button>
        <button
          type="button"
          className="pastilha"
          data-ativa={guardada ? "sim" : "nao"}
          onClick={guardar}
          aria-pressed={guardada}
          aria-label={guardada ? "Remover dos guardados" : "Guardar"}
          disabled={!hidratado}
        >
          {ICONE_SALVOS}
        </button>
      </div>
    </article>
  );
}

export function Comunidade({ comunidadeId }: { comunidadeId: string }) {
  const { motor, hidratado } = usePontos();
  const comunidade = comunidadePorId(comunidadeId);

  if (!comunidade) return <Vazio>Esta comunidade não existe.</Vazio>;

  const publicacoes = motor.atual.publicacoes.filter((p) => p.comunidadeId === comunidadeId);
  const assinada = hidratado && motor.atual.assinadas.includes(comunidadeId);

  function assinar() {
    motor.emitir("comunidade.assinada", { tipo: "comunidade", id: comunidadeId });
  }

  return (
    <div className="flex flex-col gap-4">
      {comunidade.natureza !== "oficial" && (
        <div className="saldo-painel">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="tipo-detalhe font-bold">{comunidade.nome}</span>
              <span className="tipo-legenda text-tinta-2">{comunidade.descricao}</span>
              <span className="tipo-legenda text-tinta-3">
                {comunidade.assinantes.toLocaleString("pt-BR")} pessoas
                {comunidade.uf ? ` · ${comunidade.uf}` : ""}
              </span>
            </div>
            <button
              type="button"
              className="botao-discreto"
              data-ativo={assinada ? "sim" : "nao"}
              onClick={assinar}
              disabled={assinada || !hidratado}
            >
              {assinada ? "Assinando" : "Assinar"}
            </button>
          </div>
        </div>
      )}

      {publicacoes.length === 0 ? (
        <Painel titulo="Ainda sem publicações">
          <Vazio>Esta comunidade ainda não publicou nada.</Vazio>
        </Painel>
      ) : (
        publicacoes.map((p) => <Cartao key={p.id} publicacao={p} />)
      )}
    </div>
  );
}
