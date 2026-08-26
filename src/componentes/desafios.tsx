"use client";

import Link from "next/link";
import { Moeda } from "@/componentes/pontos-base";
import { SeloDeNivel } from "@/componentes/selo-nivel";
import { usePontos } from "@/contexto/pontos";
import { CONFIG, MISSOES } from "@/dados/pontos";
import { garantirEstado } from "@/lib/pontos/missoes";
import { diaDaSemana } from "@/lib/pontos/relogio";
import type { MissaoDefinida, TipoDeMissao } from "@/lib/pontos/tipos";

const ETIQUETA: Record<TipoDeMissao, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  social: "Comunidade",
  territorio: "Território",
  temporada: "Temporada",
};

/** Diária primeiro, depois a semana, depois a temporada — a ordem do dia. */
function ordenar(missoes: MissaoDefinida[]): MissaoDefinida[] {
  const peso: Record<MissaoDefinida["expiraEm"], number> = { dia: 0, semana: 1, temporada: 2 };
  return [...missoes].sort((a, b) => peso[a.expiraEm] - peso[b.expiraEm]);
}

function Missao({ missao }: { missao: MissaoDefinida }) {
  const { motor, hidratado } = usePontos();
  const emCurso = garantirEstado(motor.atual, missao);
  const concluida = hidratado && Boolean(emCurso.concluidaEm);
  const progresso = hidratado ? emCurso.progresso : 0;
  const fracao = missao.alvo === 0 ? 0 : progresso / missao.alvo;

  return (
    <article className="missao" data-concluida={concluida ? "sim" : "nao"}>
      <div className="missao-cabeca">
        <span className="missao-etiqueta">{ETIQUETA[missao.tipo]}</span>
        <span className="missao-premio">
          {missao.minutos > 0 && <span>{missao.minutos} min ·</span>}
          <span className="font-bold text-tinta-2">+{missao.percurso} percurso</span>
          {missao.fichas > 0 && (
            <>
              <span>·</span>
              <span className="saldo-linha font-bold text-tinta-2">
                <Moeda />+{missao.fichas}
              </span>
            </>
          )}
        </span>
      </div>

      <h3 className="tipo-destaque font-bold">{missao.titulo}</h3>
      <p className="tipo-legenda text-tinta-2">{missao.descricao}</p>

      <div className="missao-rodape">
        <span className="nivel-barra">
          <span className="nivel-preenchimento" style={{ width: `${fracao * 100}%` }} />
        </span>
        <span className="missao-contagem">
          {progresso}/{missao.alvo}
        </span>
        {concluida ? (
          <span className="missao-feita">Concluída</span>
        ) : (
          <Link href={missao.rota} className="missao-fazer">
            Fazer
          </Link>
        )}
      </div>
    </article>
  );
}

export function Desafios() {
  const { motor, hidratado } = usePontos();

  const nivel = motor.nivel();
  const meta = motor.meta();
  const percurso = motor.saldoDe("percurso");
  const diasParaVirar = 7 - diaDaSemana(motor.atual.agora);
  const faltam = meta.alvo - meta.feitas;

  return (
    <div className="flex flex-col gap-4">
      <div className="desafios-topo">
        <SeloDeNivel nivel={nivel.numero} total={CONFIG.nomesDeNivel.length} />
        <span className="tipo-detalhe font-bold">{nivel.nome}</span>
        <div className="desafios-barra">
          <div
            className="nivel-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(nivel.fracao * 100)}
            aria-label={`Progresso até o próximo nível: ${Math.round(nivel.fracao * 100)}%`}
          >
            <span className="nivel-preenchimento" style={{ width: `${nivel.fracao * 100}%` }} />
          </div>
        </div>
        <span className="tipo-legenda text-tinta-3">
          {hidratado
            ? nivel.noTopo
              ? `${percurso.toLocaleString("pt-BR")} de percurso · nível máximo`
              : `${percurso.toLocaleString("pt-BR")} / ${(percurso + nivel.falta).toLocaleString("pt-BR")} de percurso`
            : "—"}
        </span>
      </div>

      <div className="cartao">
        <span className="tipo-detalhe font-bold">
          Meta da semana: {hidratado ? meta.feitas : 0} de {meta.alvo}
        </span>
        <span className="nivel-barra">
          <span
            className="nivel-preenchimento"
            style={{
              width: `${!hidratado || meta.alvo === 0 ? 0 : (meta.feitas / meta.alvo) * 100}%`,
            }}
          />
        </span>
        <span className="tipo-legenda text-tinta-2">
          {hidratado && faltam <= 0
            ? "Semana fechada. Constância vale mais que volume."
            : `Faltam ${Math.max(0, faltam)} · a semana vira em ${diasParaVirar} ${diasParaVirar === 1 ? "dia" : "dias"}`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {ordenar(MISSOES).map((m) => (
          <Missao key={m.id} missao={m} />
        ))}
      </div>

      <Link href="/meu/conquistas/" className="botao-discreto no-underline self-start">
        Ver emblemas e como se ganha ficha
      </Link>
    </div>
  );
}
