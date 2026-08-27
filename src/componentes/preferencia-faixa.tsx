"use client";

import { useState } from "react";
import { useSessao } from "@/contexto/sessao";

/**
 * preferencia-faixa.tsx — o recorte de preferência que Play, Cast, Cursos e Notícias
 * abrem, e o único componente dos quatro.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * TRÊS REGRAS QUE VALEM NOS QUATRO APPS, e é por elas que existe um componente só:
 *
 * 1. **NUNCA É PORTEIRO E NUNCA É MODAL.** A faixa mora acima do conteúdo, rola junto e
 *    some quando a preferência já existe — vira uma linha discreta com «mudar». Quem
 *    chegou para ver o catálogo vê o catálogo; quem quiser recortar, recorta.
 *
 * 2. **A CONTAGEM VEM DO BUILD, coladas no rótulo.** Nenhum número de acervo escrito à
 *    mão em TSX: os quatro apps medem no próprio módulo de dados e passam contado.
 *
 * 3. **A DECLARAÇÃO DE AUSÊNCIA É TEXTO, NÃO TOOLTIP.** É onde a tela diz o que o acervo
 *    NÃO tem — que não há gênero de filme no Play, que 100 dos 336 podcasts não declaram
 *    linguagem, que 30 das 54 formações não declaram, que nenhum dos 1.805 conteúdos
 *    traz o nome de quem assina. Esconder isso atrás de um toque é escondê-lo, e a regra
 *    do produto é que ausência se declara com denominador.
 *
 * A preferência ORDENA, não corta. Um recorte que esvazia a tela transforma uma escolha
 * de gosto numa parede — e nenhum dos quatro apps tem acervo suficiente para sobreviver a
 * um filtro de verdade em toda combinação.
 */

export interface OpcaoDePreferencia {
  valor: string;
  rotulo: string;
  /** Quantos itens do acervo, contado no build. */
  n: number;
}

export function PreferenciaFaixa({
  app,
  pergunta,
  opcoes,
  declaracao,
  autorado = false,
}: {
  /** Chave do app no estado: `play`, `cast`, `cursos`, `noticias`. */
  app: string;
  pergunta: string;
  opcoes: readonly OpcaoDePreferencia[];
  /** O que o acervo não tem, dito com denominador. Obrigatório: os quatro têm o seu. */
  declaracao: React.ReactNode;
  /** Marca a lista como escolha nossa e não do acervo — hoje, só o Notícias. */
  autorado?: boolean;
}) {
  const { preferencias, alternarPreferencia, hidratado } = useSessao();
  const [editando, setEditando] = useState(false);

  const marcadas = hidratado ? (preferencias[app] ?? []) : [];

  // Antes de hidratar, `marcadas` é vazio e a faixa aparece — que é exatamente o HTML do
  // build. Trocar isso por um estado de carregamento faria a tela piscar a cada visita
  // para esconder um componente que não é urgente.
  if (marcadas.length > 0 && !editando) {
    const rotulos = opcoes
      .filter((o) => marcadas.includes(o.valor))
      .map((o) => o.rotulo)
      .join(", ");
    return (
      <p className="pref-resumo">
        <span>Mostrando primeiro: {rotulos}</span>
        {/* «Mudar» REABRE a faixa com as escolhas intactas. A primeira escrita deste
            componente desmarcava tudo aqui — o rótulo prometia editar e a ação apagava,
            sem aviso e sem volta. */}
        <button type="button" className="onb-texto-acao" onClick={() => setEditando(true)}>
          Mudar
        </button>
      </p>
    );
  }

  return (
    <section className="pref" aria-label={pergunta}>
      <h2 className="pref-pergunta">{pergunta}</h2>

      <div className="pref-opcoes">
        {opcoes.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={marcadas.includes(opcao.valor)}
            onClick={() => alternarPreferencia(app, opcao.valor)}
            className="pref-pastilha"
          >
            <span>{opcao.rotulo}</span>
            <span className="onb-conta">{opcao.n.toLocaleString("pt-BR")}</span>
          </button>
        ))}
      </div>

      {editando ? (
        <button type="button" className="onb-texto-acao" onClick={() => setEditando(false)}>
          Pronto
        </button>
      ) : null}

      <p className="declaracao">
        {autorado ? <span className="declaracao-autorado">lista nossa</span> : null}
        {declaracao}
      </p>
    </section>
  );
}
