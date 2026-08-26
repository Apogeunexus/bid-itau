"use client";

import { ROTULO_DA_SITUACAO } from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor } from "@/dados/tipos-acesso";

/**
 * studio-seletor.tsx — qual registro a jornada está editando, e o controle da demonstração.
 *
 * POR QUE ELE FOI EXTRAÍDO AGORA E NÃO ANTES. Ele nasceu dentro da P2 e ficou lá enquanto
 * teve um caso de uso só. A P5 é o segundo, e as oito telas da jornada serão o resto: um
 * seletor por tela divergiria no primeiro ajuste, e o sintoma seria a P2 e a P5 discordando
 * sobre qual registro está aberto — sendo que a resposta mora numa loja só.
 *
 * ELE APARECE EM TODAS AS TELAS DA JORNADA de propósito. A jornada atravessa oito rotas, e
 * quem chega na grade sem saber de qual evento ela é não tem como conferir nada. O seletor
 * é o cabeçalho de contexto, não um filtro.
 *
 * A S6 · Organização pode reusar. Se precisar, avise a sessão de controle antes de eu mexer
 * na interface deste arquivo.
 */

interface Props {
  rascunhos: RascunhoDoProdutor[];
  atual: RascunhoDoProdutor;
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
  aoReiniciar: () => void;
  /** A frase que declara que a situação dos registros semeados é autorada. */
  situacaoEAutorada: string;
}

const SEM_TITULO = "(sem título)";

export function SeletorDeRegistro({
  rascunhos,
  atual,
  aoEscolher,
  aoCriar,
  aoReiniciar,
  situacaoEAutorada,
}: Props) {
  const opcoes = rascunhos.map((r) => ({
    id: r.id,
    // `r.titulo` é campo do contrato; o texto que a pessoa lê é `SEM_TITULO`.
    rotulo: `${r.titulo.trim() === "" ? SEM_TITULO : r.titulo} · ${ROTULO_DA_SITUACAO[r.situacao]}`,
  }));

  return (
    <section className="studio-seletor">
      <label className="studio-seletor-campo">
        <span className="studio-rotulo">Registro em edição</span>
        <select
          value={atual.id}
          onChange={(e) => aoEscolher(e.target.value)}
          className="studio-campo-entrada"
        >
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </label>
      <div className="studio-acoes">
        <button type="button" className="studio-botao studio-botao-primario" onClick={aoCriar}>
          Novo evento
        </button>
        {/* «Reiniciar» apaga o trabalho da sessão inteira, e por isso pede confirmação
            própria da tela. Uma apresentação roda duas vezes; perder a primeira por um
            clique errado no meio dela é o custo que a confirmação evita. */}
        <BotaoDeReinicio aoReiniciar={aoReiniciar} />
      </div>
      <p className="studio-campo-nota">{situacaoEAutorada}</p>
    </section>
  );
}

function BotaoDeReinicio({ aoReiniciar }: { aoReiniciar: () => void }) {
  return (
    <details className="studio-confirma">
      <summary className="studio-botao studio-botao-perigo studio-confirma-gatilho">Reiniciar demonstração</summary>
      <div className="studio-confirma-corpo">
        <p className="studio-campo-nota">
          Isto apaga tudo o que foi escrito nesta sessão e devolve os cinco registros
          iniciais. Não há como desfazer.
        </p>
        <button
          type="button"
          className="studio-botao studio-botao-perigo"
          onClick={(e) => {
            aoReiniciar();
            e.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          Apagar e recomeçar
        </button>
      </div>
    </details>
  );
}
