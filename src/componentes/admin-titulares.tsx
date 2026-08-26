"use client";

/**
 * admin-titulares.tsx — A8, os pedidos de quem é titular do dado.
 *
 * A DISTINÇÃO QUE ORGANIZA A TELA, e que um painel de LGPD comum não tem: o grafo documenta
 * 575 pessoas que nunca se cadastraram — 43.614 na base completa. Elas são titulares sem
 * nunca terem aceitado um termo, e o direito delas não depende de cadastro. Tratar as duas
 * como a mesma coisa faria a plataforma responder a uma artista retratada com um formulário
 * de conta que ela não tem.
 *
 * O QUE ESTA TELA NÃO RESOLVE. Contestação sobre verbete é encaminhada à Enciclopédia, que é
 * autoridade a montante. Resolvê-la aqui seria o administrador da plataforma reescrevendo o
 * que uma enciclopédia afirma sem ser a enciclopédia — e a tela declara o encaminhamento em
 * vez de fingir competência que não tem.
 *
 * A EXCLUSÃO AVISA O QUE LEVA JUNTO, antes de confirmar. Quem pede exclusão da conta nem
 * sempre sabe que está pedindo exclusão da coleção que montou.
 */

import { useEffect, useState } from "react";
import {
  ADMIN_AUTORADO,
  A_CONTESTACAO_NAO_SE_RESOLVE_AQUI,
  CARIMBO_DO_ADMIN,
  CHAVE_DE_ARMAZENAMENTO,
  O_QUE_A_EXCLUSAO_LEVA,
  TIPOS_DE_PEDIDO,
  eventosValidos,
} from "@/dados/admin";
import type { EventoDeAuditoria, PedidoRespondido, TipoDeTitular } from "@/dados/admin";

const MINIMO_DO_MOTIVO = 8;

/** Os desfechos possíveis. Vocabulário fechado: uma resposta livre viraria log e não
 *  registro, e a trilha precisa poder ser contada por desfecho. */
const DESFECHOS = [
  "Atendido",
  "Encaminhado à Enciclopédia",
  "Recusado, com motivo",
] as const;

export function AdminTitulares({ tipos }: { tipos: TipoDeTitular[] }) {
  const [trilha, setTrilha] = useState<EventoDeAuditoria[]>([]);
  const [semArmazenamento, setSemArmazenamento] = useState(false);
  const [pedido, setPedido] = useState(TIPOS_DE_PEDIDO[0]?.rotulo ?? "");
  const [titular, setTitular] = useState("");
  const [desfecho, setDesfecho] = useState<string>(DESFECHOS[0]);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
      setTrilha(eventosValidos(bruto ? JSON.parse(bruto) : null));
    } catch {
      setSemArmazenamento(true);
    }
  }, []);

  const respondidos = trilha.filter((e): e is PedidoRespondido => e.tipo === "titular");
  const escolhido = TIPOS_DE_PEDIDO.find((t) => t.rotulo === pedido);

  const falta: string[] = [];
  if (!titular.trim()) falta.push("quem é o titular");
  if (motivo.trim().length < MINIMO_DO_MOTIVO)
    falta.push(`um motivo com pelo menos ${MINIMO_DO_MOTIVO} caracteres`);

  const responder = () => {
    const novo: PedidoRespondido = {
      tipo: "titular",
      pedido,
      titular: titular.trim(),
      desfecho,
      motivo: motivo.trim(),
      autor: ADMIN_AUTORADO,
      carimbo: CARIMBO_DO_ADMIN,
    };
    const proximos: EventoDeAuditoria[] = [novo, ...trilha];
    setTrilha(proximos);
    setTitular("");
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
        <h1 className="studio-titulo">Titulares e LGPD</h1>
        <p className="studio-objetivo">
          O acervo documenta gente que nunca se cadastrou. O direito dessas pessoas sobre o
          que a plataforma afirma delas não depende de elas terem aceitado um termo — e é
          essa distinção que organiza esta tela.
        </p>
      </header>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Dois tipos de titular, e o que cada um pode pedir</h2>
        </div>
        {tipos.map((t) => (
          <div className="studio-lado" key={t.tipo}>
            <p className="studio-lado-titulo">
              {t.tipo} — {t.quem}
            </p>
            <p className="admin-parametro-decide">{t.quantos}</p>
            <ul>
              {t.podePedir.map((p) => (
                <li className="admin-parametro-decide" key={p}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">O que esta tela não resolve</p>
        <p>{A_CONTESTACAO_NAO_SE_RESOLVE_AQUI}</p>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Responder um pedido</h2>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{respondidos.length}</span>{" "}
            {respondidos.length === 1 ? "resposta" : "respostas"} nesta sessão
          </span>
        </div>

        <form
          className="admin-formulario"
          onSubmit={(e) => {
            e.preventDefault();
            if (falta.length > 0) return;
            responder();
          }}
        >
          <label className="admin-parametro-decide" htmlFor="pedido">
            Pedido
          </label>
          <select
            id="pedido"
            className="admin-campo"
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
          >
            {TIPOS_DE_PEDIDO.map((t) => (
              <option key={t.id} value={t.rotulo}>
                {t.rotulo}
              </option>
            ))}
          </select>

          {escolhido && (
            <p className="admin-parametro-decide">
              Prazo de {escolhido.prazo}, e este pedido é {escolhido.deQuem}.
            </p>
          )}

          {pedido === "Exclusão" && (
            <div className="studio-nao-sustenta">
              <p className="studio-nao-sustenta-rotulo">O que a exclusão leva junto</p>
              <p>{O_QUE_A_EXCLUSAO_LEVA}</p>
            </div>
          )}

          <label className="admin-parametro-decide" htmlFor="titular">
            Quem é o titular
          </label>
          <input
            id="titular"
            className="admin-campo"
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
          />

          <label className="admin-parametro-decide" htmlFor="desfecho">
            Desfecho
          </label>
          <select
            id="desfecho"
            className="admin-campo"
            value={desfecho}
            onChange={(e) => setDesfecho(e.target.value)}
          >
            {DESFECHOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <label className="admin-parametro-decide" htmlFor="motivo-titular">
            Motivo — fica na trilha, com o seu nome, e é o que a pessoa vai ler
          </label>
          <input
            id="motivo-titular"
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
            Registrar a resposta, com o meu nome
          </button>
        </form>

        {respondidos.length > 0 && (
          <ul className="studio-tabela">
            {respondidos.map((r, i) => (
              <li className="studio-linha" key={`${r.titular}-${i}`}>
                <span className="studio-celula studio-celula-rotulo">
                  {r.pedido} — {r.titular}
                </span>
                <span className="studio-celula">
                  {r.desfecho} · {r.motivo} · {r.autor} · {r.carimbo}
                </span>
              </li>
            ))}
          </ul>
        )}

        {semArmazenamento && (
          <div className="studio-nao-sustenta" role="status">
            <p className="studio-nao-sustenta-rotulo">A trilha não está sendo guardada</p>
            <p>
              O armazenamento do navegador está bloqueado. As respostas valem nesta aba e
              somem ao recarregar.
            </p>
          </div>
        )}
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Os indicadores nunca leem indivíduo</h2>
        </div>
        <p className="studio-nota">
          O Observatório lê agregado. Nenhum painel desta plataforma mostra o comportamento de
          uma pessoa identificada — e a anonimização não é uma configuração que se possa
          desligar aqui, é a forma como aquela superfície é construída.
        </p>
      </section>
    </div>
  );
}
