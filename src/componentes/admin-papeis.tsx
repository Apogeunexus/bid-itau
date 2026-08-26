"use client";

/**
 * admin-papeis.tsx — A1, a tela que mostra que o modelo de acesso É a ontologia.
 *
 * O ARGUMENTO, EM UMA FRASE: conceder um papel não é dar permissão, é autorizar alguém a
 * produzir um valor de procedência. Por isso a tela imprime, lado a lado, os oito níveis e
 * os sete valores de carimbo — e por isso o formulário de concessão escolhe o papel e
 * mostra, sem deixar editar, qual carimbo ele passa a autorizar.
 *
 * PAPEL É ARESTA COM ESCOPO, e a forma importa. Uma coluna `papel` na linha da pessoa não
 * consegue dizer que a mesma pessoa é produtora do próprio teatro e curadora regional do
 * Pará; obrigaria a segunda conta, e a segunda conta é como uma plataforma perde o rastro
 * de quem é quem.
 *
 * A SEGREGAÇÃO QUE A TELA DECLARA E RESPEITA. Quem concede papel de moderador não decide na
 * fila. Esta superfície concede; a fila é de outra. Sem a separação, um administrador
 * poderia moderar em nome de qualquer território sem que ninguém visse.
 *
 * Trilha, carimbo e armazenamento seguem o padrão da A2 e da A3 — uma superfície, uma
 * trilha, sob a mesma chave versionada.
 */

import { useEffect, useState } from "react";
import {
  ADMIN_AUTORADO,
  ADMIN_E_AUTORADO,
  CARIMBO_DO_ADMIN,
  CHAVE_DE_ARMAZENAMENTO,
  EIXOS_DO_ESCOPO,
  NIVEIS_DE_ACESSO,
  PAPEL_E_ARESTA,
  POR_QUE_ARESTA,
  QUEM_CONCEDE_NAO_DECIDE,
  VERIFICACOES,
  escopoEscrito,
  eventosValidos,
} from "@/dados/admin";
import type {
  EventoDeAuditoria,
  FatiaDeProcedenciaDoPapel,
  LinhaDaMatriz,
  PapelConcedido,
} from "@/dados/admin";

export interface DadosDosPapeis {
  procedencias: FatiaDeProcedenciaDoPapel[];
  matriz: LinhaDaMatriz[];
}

const MINIMO_DO_MOTIVO = 8;

export function AdminPapeis({ dados }: { dados: DadosDosPapeis }) {
  const [trilha, setTrilha] = useState<EventoDeAuditoria[]>([]);
  const [semArmazenamento, setSemArmazenamento] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
      setTrilha(eventosValidos(bruto ? JSON.parse(bruto) : null));
    } catch {
      setSemArmazenamento(true);
    }
  }, []);

  const conceder = (papel: PapelConcedido) => {
    const proximos: EventoDeAuditoria[] = [papel, ...trilha];
    setTrilha(proximos);
    try {
      window.localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(proximos));
    } catch {
      setSemArmazenamento(true);
    }
  };

  const concedidos = trilha.filter((e): e is PapelConcedido => e.tipo === "papel");

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Papéis e escopos</h1>
        <p className="studio-objetivo">
          Conceder um papel não é dar permissão: é autorizar alguém a produzir um valor de
          procedência. Os níveis de acesso não são uma camada sobre a ontologia — eles são o
          vocabulário de quem escreveu cada linha dela.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">Quem concede não decide</p>
        <p>{QUEM_CONCEDE_NAO_DECIDE}</p>
      </section>

      <section className="admin-parametro">
        <div className="admin-parametro-valor">
          <p className="studio-rotulo">A forma da concessão</p>
          <p className="studio-literal admin-aresta">{PAPEL_E_ARESTA}</p>
        </div>
        <div className="admin-medicao">
          <p className="studio-nota">{POR_QUE_ARESTA}</p>
        </div>
      </section>

      <Conceder conceder={conceder} concedidos={concedidos} semArmazenamento={semArmazenamento} />

      <Niveis />

      <Escopos />

      <Procedencias fatias={dados.procedencias} />

      <Verificacoes />

      <Matriz linhas={dados.matriz} />

      <p className="studio-nota">{ADMIN_E_AUTORADO}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A concessão — a escrita desta tela
// ---------------------------------------------------------------------------

/** Os papéis que se concede aqui. O nível 8 não se concede: ele é quem se cadastra. */
const PAPEIS_CONCEDIVEIS = NIVEIS_DE_ACESSO.filter((n) => n.numero >= 3 && n.numero <= 7);

function Conceder({
  conceder,
  concedidos,
  semArmazenamento,
}: {
  conceder: (p: PapelConcedido) => void;
  concedidos: PapelConcedido[];
  semArmazenamento: boolean;
}) {
  const [pessoa, setPessoa] = useState("");
  const [papel, setPapel] = useState(PAPEIS_CONCEDIVEIS[0]?.nome ?? "");
  const [territorio, setTerritorio] = useState("");
  const [classe, setClasse] = useState("");
  const [fila, setFila] = useState("");
  const [motivo, setMotivo] = useState("");

  const escolhido = PAPEIS_CONCEDIVEIS.find((n) => n.nome === papel);
  const recortavel = escolhido?.numero === 3 || escolhido?.numero === 4;

  const falta: string[] = [];
  if (!pessoa.trim()) falta.push("o nome de quem recebe");
  if (motivo.trim().length < MINIMO_DO_MOTIVO)
    falta.push(`um motivo com pelo menos ${MINIMO_DO_MOTIVO} caracteres`);

  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Conceder um papel</h2>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{concedidos.length}</span>{" "}
          {concedidos.length === 1 ? "concessão" : "concessões"} nesta sessão
        </span>
      </div>

      <form
        className="admin-formulario"
        onSubmit={(e) => {
          e.preventDefault();
          if (falta.length > 0) return;
          conceder({
            tipo: "papel",
            pessoa: pessoa.trim(),
            papel,
            territorio: recortavel ? territorio.trim() : "",
            classe: recortavel ? classe.trim() : "",
            fila: recortavel ? fila.trim() : "",
            procedenciaAutorizada: escolhido?.procedencia ?? "—",
            motivo: motivo.trim(),
            autor: ADMIN_AUTORADO,
            carimbo: CARIMBO_DO_ADMIN,
          });
          setPessoa("");
          setTerritorio("");
          setClasse("");
          setFila("");
          setMotivo("");
        }}
      >
        <label className="admin-parametro-decide" htmlFor="pessoa">
          Quem recebe
        </label>
        <input
          id="pessoa"
          className="admin-campo"
          value={pessoa}
          onChange={(e) => setPessoa(e.target.value)}
        />

        <label className="admin-parametro-decide" htmlFor="papel">
          Papel
        </label>
        <select
          id="papel"
          className="admin-campo"
          value={papel}
          onChange={(e) => setPapel(e.target.value)}
        >
          {PAPEIS_CONCEDIVEIS.map((n) => (
            <option key={n.nome} value={n.nome}>
              {n.numero} · {n.nome}
            </option>
          ))}
        </select>

        <p className="admin-parametro-decide">
          Este papel autoriza a pessoa a produzir procedência{" "}
          <strong>{escolhido?.procedencia}</strong>. O valor não é escolhido aqui: ele vem do
          papel, porque procedência é carimbo do sistema e não campo de formulário.
        </p>

        {recortavel ? (
          <>
            <p className="studio-rotulo">Escopo — os três eixos, combináveis</p>
            <label className="admin-parametro-decide" htmlFor="territorio">
              Território — em branco vale para o país inteiro
            </label>
            <input
              id="territorio"
              className="admin-campo"
              value={territorio}
              onChange={(e) => setTerritorio(e.target.value)}
            />
            <label className="admin-parametro-decide" htmlFor="classe">
              Tipo de conteúdo — em branco vale para todos
            </label>
            <input
              id="classe"
              className="admin-campo"
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
            />
            <label className="admin-parametro-decide" htmlFor="fila">
              Fila — em branco vale para todas
            </label>
            <input
              id="fila"
              className="admin-campo"
              value={fila}
              onChange={(e) => setFila(e.target.value)}
            />
          </>
        ) : (
          <p className="admin-parametro-decide">
            Escopo em três eixos existe para a moderação. Os outros papéis não são recortados
            por território ou fila — e a tela não mostra campos que não teriam efeito.
          </p>
        )}

        <label className="admin-parametro-decide" htmlFor="motivo-papel">
          Motivo — fica na trilha, com o seu nome
        </label>
        <input
          id="motivo-papel"
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
          Conceder, com o meu nome no registro
        </button>
      </form>

      {concedidos.length > 0 && (
        <ul className="studio-tabela">
          {concedidos.map((c, i) => (
            <li className="studio-linha" key={`${c.pessoa}-${c.papel}-${i}`}>
              <span className="studio-celula studio-celula-rotulo">
                {c.pessoa} — {c.papel}
              </span>
              <span className="studio-celula">
                {escopoEscrito(c)} · autoriza carimbo {c.procedenciaAutorizada} · {c.motivo} ·{" "}
                {c.autor} · {c.carimbo}
              </span>
            </li>
          ))}
        </ul>
      )}

      {semArmazenamento && (
        <div className="studio-nao-sustenta" role="status">
          <p className="studio-nao-sustenta-rotulo">A trilha não está sendo guardada</p>
          <p>
            O armazenamento do navegador está bloqueado. As concessões valem nesta aba e
            somem ao recarregar.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Os oito níveis, o escopo, as procedências, a verificação e a matriz
// ---------------------------------------------------------------------------

function Niveis() {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Os oito níveis, e o que cada um escreve</h2>
      </div>
      <p className="studio-nota">
        O nível 2 escreve <strong>nada</strong>, e isso é decisão de produto: quem mede o
        acervo não deve poder mudá-lo, senão a medição passa a incluir o efeito de quem mede.
      </p>
      <ul className="studio-tabela admin-niveis">
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Nível</span>
          <span className="studio-celula studio-celula-rotulo">Escreve</span>
          <span className="studio-celula studio-celula-rotulo">Carimba</span>
        </li>
        {NIVEIS_DE_ACESSO.map((n) => (
          <li className="studio-linha" key={n.numero}>
            <span className="studio-celula studio-celula-rotulo">
              {n.numero} · {n.nome}
              <br />
              {n.superficie}
            </span>
            <span className="studio-celula">{n.escreve}</span>
            <span className="studio-celula">{n.procedencia}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Escopos() {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">O escopo do moderador, em três eixos</h2>
      </div>
      <p className="studio-nota">
        Combináveis: «só duplicatas, só no Pará» é um escopo válido e é o tipo de recorte que
        faz uma fila caber numa pessoa.
      </p>
      <ul className="studio-tabela">
        {EIXOS_DO_ESCOPO.map((e) => (
          <li className="studio-linha" key={e.eixo}>
            <span className="studio-celula studio-celula-rotulo">{e.eixo}</span>
            <span className="studio-celula">
              {e.exemplo} — {e.porQue}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Procedencias({ fatias }: { fatias: FatiaDeProcedenciaDoPapel[] }) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Cada papel é um valor de carimbo</h2>
      </div>
      <p className="studio-nota">
        As três primeiras existem no acervo e trazem a contagem de hoje. As outras não trazem
        zero: trazem a declaração de que a produção as abre. Zero e «ainda não existe» são
        coisas diferentes, e um zero aqui afirmaria uma medição que ninguém fez.
      </p>
      <ul className="studio-tabela admin-niveis">
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Procedência</span>
          <span className="studio-celula studio-celula-rotulo">Quem produz</span>
          <span className="studio-celula studio-celula-rotulo">Nós · ligações</span>
        </li>
        {fatias.map((f) => (
          <li className="studio-linha" key={f.valor}>
            <span className="studio-celula studio-celula-rotulo studio-literal">{f.valor}</span>
            <span className="studio-celula">{f.quemProduz}</span>
            <span className="studio-celula">
              {f.existeHoje ? `${f.nos} · ${f.arestas}` : f.nos}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Verificacoes() {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Verificação, e por que ela é diferente nos dois casos</h2>
      </div>
      {VERIFICACOES.map((v) => (
        <div className="studio-lado" key={v.tipo}>
          <p className="studio-lado-titulo">{v.tipo}</p>
          <ul>
            {v.exige.map((e) => (
              <li className="admin-parametro-decide" key={e}>
                {e}
              </li>
            ))}
          </ul>
          <p className="studio-nota">{v.porQue}</p>
        </div>
      ))}
    </section>
  );
}

function Matriz({ linhas }: { linhas: LinhaDaMatriz[] }) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">A matriz de autoria, com a contagem de hoje</h2>
      </div>
      <p className="studio-nota">
        Nenhum elemento da ontologia pode existir sem exatamente um papel autorizado a
        autorá-lo. Uma linha sem autor seria um buraco que nenhuma tela conserta — e é aqui
        que ele apareceria.
      </p>
      <ul className="studio-tabela admin-matriz">
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Elemento</span>
          <span className="studio-celula studio-celula-rotulo">Escreve</span>
          <span className="studio-celula studio-celula-rotulo">Aprova</span>
          <span className="studio-celula studio-celula-rotulo">Hoje</span>
        </li>
        {linhas.map((l) => (
          <li className="studio-linha" key={l.elemento}>
            <span className="studio-celula studio-celula-rotulo studio-literal">{l.elemento}</span>
            <span className="studio-celula">{l.escreve}</span>
            <span className="studio-celula">{l.aprova}</span>
            <span className="studio-celula">{l.quantas}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
