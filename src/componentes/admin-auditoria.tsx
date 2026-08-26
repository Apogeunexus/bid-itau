"use client";

/**
 * admin-auditoria.tsx — A7, a tela que impede a própria sessão de mentir.
 *
 * ZERO AÇÕES DE ESCRITA, E A AUSÊNCIA É O PRODUTO. Não há botão de apagar, de editar, de
 * marcar como lido, de arquivar. O único controle da tela é o filtro, que muda o que se vê
 * e nunca o que está registrado. Se um dia alguém acrescentar uma ação aqui, a suíte
 * `verificar-admin.mjs` quebra — a regra está codificada lá, não só escrita neste
 * comentário.
 *
 * O CLIENTE É NECESSÁRIO E O MOTIVO É ÚNICO: a trilha do protótipo vive em `localStorage`,
 * porque não há back-end. Num sistema real ela é do servidor e esta tela seria de servidor
 * também — o que não mudaria é a ausência dos controles.
 *
 * ORDEM. A lista chega com a escrita mais recente primeiro, que é a ordem em que ela foi
 * gravada. Não há reordenação por coluna: quem audita precisa da sequência, e uma tabela
 * que se reordena esconde a sequência atrás de um clique que ninguém desfaz.
 */

import { useEffect, useState } from "react";
import {
  CHAVE_DE_ARMAZENAMENTO,
  FILTROS_DA_TRILHA,
  NAO_EXISTE_APAGAR,
  POR_QUE_A_TRILHA_NAO_TEM_BOTAO,
  descreverEvento,
  eventosValidos,
} from "@/dados/admin";
import type { EventoDeAuditoria, FiltroDaTrilha } from "@/dados/admin";

// smaug-ignore ui-strings: nome de classe CSS do design system, não texto de interface
const CLASSE_FILTRO = "studio-botao";
// smaug-ignore ui-strings: idem — a classe do estado selecionado
const CLASSE_FILTRO_ATIVO = "studio-botao studio-botao-primario";

export function AdminAuditoria() {
  const [trilha, setTrilha] = useState<EventoDeAuditoria[]>([]);
  const [filtro, setFiltro] = useState<FiltroDaTrilha>("tudo");
  const [semArmazenamento, setSemArmazenamento] = useState(false);
  /** Antes de ler, não se sabe se a trilha está vazia ou se ainda não foi lida — e as duas
   *  precisam de frases diferentes, porque «vazia» é uma afirmação sobre o sistema. */
  const [leu, setLeu] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
      setTrilha(eventosValidos(bruto ? JSON.parse(bruto) : null));
    } catch {
      setSemArmazenamento(true);
    } finally {
      setLeu(true);
    }
  }, []);

  const visiveis = filtro === "tudo" ? trilha : trilha.filter((e) => e.tipo === filtro);
  const escolhido = FILTROS_DA_TRILHA.find((f) => f.filtro === filtro);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Trilha de auditoria</h1>
        <p className="studio-objetivo">
          Toda escrita desta superfície, com autor, carimbo, ação e alvo. Esta é a única tela
          do painel sem nenhuma ação de escrita — e a ausência dos controles é o que ela
          existe para provar.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">Por que esta tela não tem nenhuma ação</p>
        <p>{POR_QUE_A_TRILHA_NAO_TEM_BOTAO}</p>
        <p>{NAO_EXISTE_APAGAR}</p>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">Filtrar</h2>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{visiveis.length}</span> de {trilha.length}{" "}
            {trilha.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="studio-acoes">
          {FILTROS_DA_TRILHA.map((f) => (
            <button
              key={f.filtro}
              type="button"
              className={f.filtro === filtro ? CLASSE_FILTRO_ATIVO : CLASSE_FILTRO}
              aria-pressed={f.filtro === filtro}
              onClick={() => setFiltro(f.filtro)}
            >
              {f.rotulo}
            </button>
          ))}
        </div>

        <p className="studio-nota">
          O filtro muda o que se vê, nunca o que está registrado — e é o único controle desta
          tela. Este recorte mostra {escolhido?.oQueMuda}
        </p>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">O registro</h2>
        </div>

        {visiveis.length === 0 ? (
          <Vazio leu={leu} filtro={filtro} trilhaVazia={trilha.length === 0} />
        ) : (
          <ul className="studio-tabela admin-trilha">
            <li className="studio-linha">
              <span className="studio-celula studio-celula-rotulo">Ação</span>
              <span className="studio-celula studio-celula-rotulo">Alvo</span>
              <span className="studio-celula studio-celula-rotulo">Motivo</span>
              <span className="studio-celula studio-celula-rotulo">Autor e carimbo</span>
            </li>
            {visiveis.map((e, i) => {
              const { acao, alvo } = descreverEvento(e);
              return (
                <li className="studio-linha" key={`${e.tipo}-${e.carimbo}-${i}`}>
                  <span className="studio-celula studio-celula-rotulo">{acao}</span>
                  <span className="studio-celula">{alvo}</span>
                  <span className="studio-celula">{e.motivo}</span>
                  <span className="studio-celula">
                    {e.autor}
                    <br />
                    {e.carimbo}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {semArmazenamento && (
          <div className="studio-nao-sustenta" role="status">
            <p className="studio-nao-sustenta-rotulo">Não deu para ler a trilha</p>
            <p>
              O armazenamento do navegador está bloqueado — janela privada, ou dados de site
              desligados. A tela não tem como saber se há registros: ela diz que não conseguiu
              ler, em vez de afirmar que não há nada.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * O estado vazio, que são três estados diferentes e não um.
 *
 * «Ainda não li» não é «está vazio», e «este filtro não tem nada» não é «a trilha não tem
 * nada». Numa tela de auditoria a diferença é o conteúdo: dizer «nenhum registro» quando na
 * verdade o filtro está fechado é a tela afirmando sobre o sistema uma coisa que ela não
 * sabe.
 */
function Vazio({
  leu,
  filtro,
  trilhaVazia,
}: {
  leu: boolean;
  filtro: FiltroDaTrilha;
  trilhaVazia: boolean;
}) {
  if (!leu) return <p className="studio-nota">Lendo a trilha…</p>;

  if (trilhaVazia) {
    return (
      <p className="studio-nota">
        Nenhuma escrita registrada nesta sessão. Mude um parâmetro do motor, acrescente um
        município à tabela de centroides ou conceda um papel — cada uma dessas ações aparece
        aqui, com o seu nome e o carimbo, e nenhuma delas pode ser apagada depois.
      </p>
    );
  }

  const rotulo = FILTROS_DA_TRILHA.find((f) => f.filtro === filtro)?.rotulo ?? filtro;
  return (
    <p className="studio-nota">
      A trilha tem registros, mas nenhum do tipo «{rotulo}». O filtro está recortando — volte
      a «Tudo» para ver a sequência inteira.
    </p>
  );
}
