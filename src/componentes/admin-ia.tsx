"use client";

/**
 * admin-ia.tsx — A5, os limites da IA e o dono dessa lista.
 *
 * A LISTA JÁ EXISTIA E NÃO TINHA DONO. Ela é dado, não código, e mora no módulo da
 * Moderação, que a APLICA. Quem a escreve é o Admin — e é essa separação que esta tela
 * torna visível: a Moderação obedece a lista, o Admin responde por ela, e toda mudança nela
 * é evento de auditoria de primeira ordem.
 *
 * O CONTROLE QUE NÃO EXISTE É O PRODUTO. Não há interruptor de «IA publica direto» — nem
 * desligado, nem atrás de confirmação. Um interruptor desligado é a promessa de que um dia
 * alguém o liga; a ausência é a afirmação de que o sistema não oferece isso.
 *
 * O QUE A TELA ESCREVE é só acrescentar um limite, com motivo, autor e carimbo, na mesma
 * trilha das outras. Não há como REMOVER um limite daqui, e a ausência dessa ação segue a
 * regra da casa: não existe apagar, existe acrescentar com rastro.
 */

import { useEffect, useState } from "react";
import {
  ADMIN_AUTORADO,
  CARIMBO_DO_ADMIN,
  CHAVE_DE_ARMAZENAMENTO,
  COMPONENTES_DO_SCORE,
  LIMITES_DA_IA,
  O_INTERRUPTOR_QUE_NAO_EXISTE,
  O_QUE_A_IA_PODE,
  REGRA_DO_SCORE,
  eventosValidos,
} from "@/dados/admin";
import type { EventoDeAuditoria, LimiteDaIaMudado } from "@/dados/admin";

const MINIMO_DO_LIMITE = 20;
const MINIMO_DO_MOTIVO = 8;

export function AdminIa() {
  const [trilha, setTrilha] = useState<EventoDeAuditoria[]>([]);
  const [texto, setTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [semArmazenamento, setSemArmazenamento] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
      setTrilha(eventosValidos(bruto ? JSON.parse(bruto) : null));
    } catch {
      setSemArmazenamento(true);
    }
  }, []);

  const acrescentados = trilha.filter((e): e is LimiteDaIaMudado => e.tipo === "limite-ia");

  const falta: string[] = [];
  if (texto.trim().length < MINIMO_DO_LIMITE)
    falta.push(`o limite escrito com pelo menos ${MINIMO_DO_LIMITE} caracteres`);
  if (motivo.trim().length < MINIMO_DO_MOTIVO)
    falta.push(`um motivo com pelo menos ${MINIMO_DO_MOTIVO} caracteres`);

  const acrescentar = () => {
    const novo: LimiteDaIaMudado = {
      tipo: "limite-ia",
      texto: texto.trim(),
      motivo: motivo.trim(),
      autor: ADMIN_AUTORADO,
      carimbo: CARIMBO_DO_ADMIN,
    };
    const proximos: EventoDeAuditoria[] = [novo, ...trilha];
    setTrilha(proximos);
    setTexto("");
    setMotivo("");
    try {
      window.localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(proximos));
    } catch {
      setSemArmazenamento(true);
    }
  };

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Limites da IA</h1>
        <p className="studio-objetivo">
          A resposta do produto à pergunta mais difícil do edital: o que a máquina não pode
          fazer, por mais que o grafo alcance. A lista é dado, tem dono, e toda mudança nela
          entra na trilha de auditoria.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">O controle que não existe</p>
        <p>{O_INTERRUPTOR_QUE_NAO_EXISTE}</p>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">O que a IA nunca faz</h2>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">
              {LIMITES_DA_IA.length + acrescentados.length}
            </span>{" "}
            limites
          </span>
        </div>
        <ul className="studio-tabela">
          {LIMITES_DA_IA.map((l, i) => (
            <li className="studio-linha" key={l}>
              <span className="studio-celula studio-celula-rotulo">Limite {i + 1}</span>
              <span className="studio-celula">{l}</span>
            </li>
          ))}
          {acrescentados.map((l, i) => (
            <li className="studio-linha" key={`${l.carimbo}-${i}`}>
              <span className="studio-celula studio-celula-rotulo">
                Limite {LIMITES_DA_IA.length + i + 1}
              </span>
              <span className="studio-celula">
                {l.texto}
                <br />
                {l.motivo} · {l.autor} · {l.carimbo}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Acrescentar um limite</h2>
        </div>
        <p className="studio-nota">
          Só se acrescenta. Não há como remover um limite daqui, e a ausência dessa ação é a
          mesma regra do resto da plataforma: não existe apagar, existe acrescentar com
          rastro.
        </p>
        <form
          className="admin-formulario"
          onSubmit={(e) => {
            e.preventDefault();
            if (falta.length > 0) return;
            acrescentar();
          }}
        >
          <label className="admin-parametro-decide" htmlFor="texto-limite">
            O limite, por extenso — como ele vai aparecer para quem modera
          </label>
          <input
            id="texto-limite"
            className="admin-campo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <label className="admin-parametro-decide" htmlFor="motivo-limite">
            Motivo — fica na trilha, com o seu nome
          </label>
          <input
            id="motivo-limite"
            className="admin-campo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {falta.length > 0 && (
            <p className="admin-parametro-decide" role="status">
              Falta {falta.join(" e ")}.
            </p>
          )}
          <button
            type="submit"
            className="studio-botao studio-botao-primario admin-acao-em-linha"
            disabled={falta.length > 0}
          >
            Acrescentar, com o meu nome no registro
          </button>
        </form>

        {semArmazenamento && (
          <div className="studio-nao-sustenta" role="status">
            <p className="studio-nao-sustenta-rotulo">A trilha não está sendo guardada</p>
            <p>
              O armazenamento do navegador está bloqueado. O limite acrescentado vale nesta
              aba e some ao recarregar.
            </p>
          </div>
        )}
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">O que ela pode, e com que limite</h2>
        </div>
        <ul className="studio-tabela">
          {O_QUE_A_IA_PODE.map((p) => (
            <li className="studio-linha" key={p.pode}>
              <span className="studio-celula studio-celula-rotulo">{p.pode}</span>
              <span className="studio-celula">{p.comQueLimite}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Os cinco componentes do score</h2>
        </div>
        <p className="studio-nota">{REGRA_DO_SCORE}</p>
        <p className="studio-nota">
          Quem edita esta régua é o Admin; quem a aplica é a Moderação. A separação importa
          porque um score cuja regra pudesse ser mudada por quem decide na fila deixaria de
          ser régua e viraria justificativa.
        </p>
        <ul className="studio-tabela">
          {COMPONENTES_DO_SCORE.map((c) => (
            <li className="studio-linha" key={c.id}>
              <span className="studio-celula studio-celula-rotulo">{c.rotulo}</span>
              <span className="studio-celula">
                vale {c.peso.toLocaleString("pt-BR")} · observa o {c.observa}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
