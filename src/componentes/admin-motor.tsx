"use client";

/**
 * admin-motor.tsx — A2, a tela dos parâmetros do motor.
 *
 * É A TELA QUE FIXA O PADRÃO DA SESSÃO INTEIRA: o valor à esquerda, a medição que o
 * justifica à direita, sempre visível e nunca atrás de um clique. Uma justificativa que
 * precisa ser aberta é, na prática, um número solto — e o argumento desta superfície é
 * exatamente o contrário disso.
 *
 * O QUE ESTA TELA NÃO TEM, E A AUSÊNCIA É O PRODUTO. Não há botão que mude um parâmetro em
 * silêncio: mudar exige um valor novo, um motivo escrito, e o registro sai carimbado com
 * autor. O administrador não é exceção de procedência.
 *
 * DP-F: `@/dados/admin` entra como TIPO para as formas e como VALOR só para primitivos e
 * uma função pura — autor, carimbo, chave de armazenamento e a validação do formulário. O
 * módulo alcança `grafo.ts` por `geo.ts` e por `duplicatas.ts`, e nenhuma das funções que
 * atravessam o acervo é chamada daqui: o que a tela desenha chega inteiro pelo DTO.
 *
 * SEM RELÓGIO. O carimbo vem do build, em `CARIMBO_DO_ADMIN`. `localStorage` é lido só em
 * `useEffect`, nunca no render: sob export estático o HTML sai da build, e ler o
 * armazenamento no primeiro render faria a página hidratada divergir do artefato.
 *
 * D-67: esta superfície só existe na visão web. O layout de `(bastidor)` mostra o aviso de
 * desktop na visão app; este componente não precisa saber disso, e não sabe.
 */

import { useEffect, useState } from "react";
import {
  ADMIN_AUTORADO,
  ADMIN_E_AUTORADO,
  CARIMBO_DO_ADMIN,
  CHAVE_DE_ARMAZENAMENTO,
  eventosValidos,
  oQueFaltaNaMudanca,
} from "@/dados/admin";
import type {
  Concentradores,
  EventoDeAuditoria,
  MudancaDeParametro,
  ParametroDoMotor,
} from "@/dados/admin";

export interface DadosDoMotor {
  parametros: ParametroDoMotor[];
  concentradores: Concentradores;
}

/**
 * O que a tela declara sobre si mesma, antes de qualquer número.
 *
 * Está aqui e não num comentário porque é conteúdo: quem avalia precisa ler, na tela, que o
 * administrador escreve a REGRA e não o dado — é o que separa esta superfície de um painel
 * genérico de administração.
 */
const O_QUE_O_ADMIN_GOVERNA =
  "O Admin não escreve o dado. Escreve a regra pela qual o dado é escrito — e cada uma " +
  "destas quatro regras decide o que o acervo inteiro produz na tela de quem usa o app.";

export function AdminMotor({ dados }: { dados: DadosDoMotor }) {
  /** A trilha INTEIRA, e não só o que esta tela escreveu: ela é uma lista só, guardada sob
   *  uma chave só, e a A7 vai lê-la de ponta a ponta. Esta tela filtra o que exibe. */
  const [trilha, setTrilha] = useState<EventoDeAuditoria[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  /**
   * O armazenamento pode estar bloqueado — janela privada, cookies de terceiros desligados.
   * Isso NÃO é engolido: vira uma frase na tela, porque uma trilha que não sobrevive ao
   * recarregamento e não avisa é pior do que trilha nenhuma.
   */
  const [semArmazenamento, setSemArmazenamento] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
      setTrilha(eventosValidos(bruto ? JSON.parse(bruto) : null));
    } catch {
      setSemArmazenamento(true);
    }
  }, []);

  const registrar = (mudanca: MudancaDeParametro) => {
    const proximos: EventoDeAuditoria[] = [mudanca, ...trilha];
    setTrilha(proximos);
    setAberto(null);
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
        <h1 className="studio-titulo">Motor — parâmetros e concentradores</h1>
        <p className="studio-objetivo">{O_QUE_O_ADMIN_GOVERNA}</p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">A regra desta tela</p>
        <p>
          Todo parâmetro aqui traz o valor atual e o que custaria mudá-lo. Onde o custo não
          foi medido, a tela declara que não foi — em vez de exibir o número sozinho, que é o
          que um painel de administração comum faz.
        </p>
      </section>

      {dados.parametros.map((p) => (
        <Parametro
          key={p.id}
          parametro={p}
          aberto={aberto === p.id}
          alternar={() => setAberto(aberto === p.id ? null : p.id)}
          registrar={registrar}
          registros={registrosDoParametro(trilha, p.id)}
        />
      ))}

      <PainelDeConcentradores dados={dados.concentradores} />

      <Trilha
        registros={trilha.filter((e) => e.tipo === "parametro")}
        semArmazenamento={semArmazenamento}
      />
    </div>
  );
}

/** As escritas desta tela sobre um parâmetro, na ordem em que entraram na trilha. */
function registrosDoParametro(trilha: EventoDeAuditoria[], id: string): MudancaDeParametro[] {
  return trilha.filter((e): e is MudancaDeParametro => e.tipo === "parametro" && e.parametroId === id);
}

// ---------------------------------------------------------------------------
// O bloco de parâmetro — o padrão que as outras nove telas copiam
// ---------------------------------------------------------------------------

function Parametro({
  parametro,
  aberto,
  alternar,
  registrar,
  registros,
}: {
  parametro: ParametroDoMotor;
  aberto: boolean;
  alternar: () => void;
  registrar: (m: MudancaDeParametro) => void;
  registros: MudancaDeParametro[];
}) {
  return (
    <article className="admin-parametro">
      <div className="admin-parametro-valor">
        <p className="studio-rotulo">{parametro.nome}</p>
        <p className="admin-parametro-numero">{parametro.valor}</p>
        <p className="admin-parametro-decide">{parametro.unidade}</p>
        <p className="admin-parametro-decide">Decide {parametro.decide}.</p>
      </div>

      <div className="admin-medicao">
        <p className="studio-nota">{parametro.justificativa}</p>

        {parametro.custo.medido ? (
          <div className="admin-alternativa">
            <span className="admin-alternativa-rotulo">Alternativo medido</span>
            <span className="admin-alternativa-valor admin-alternativa-nulo">
              {parametro.custo.alternativo}
            </span>
            <span className="admin-alternativa-rotulo">O que custaria</span>
            <span className="admin-alternativa-valor">{parametro.custo.oQueCustaria}</span>
            <span className="admin-alternativa-rotulo">O que ganharia</span>
            <span className="admin-alternativa-valor">{parametro.custo.oQueGanharia}</span>
          </div>
        ) : (
          <div className="studio-nao-sustenta">
            <p className="studio-nao-sustenta-rotulo">Custo não medido</p>
            <p>{parametro.custo.porQueNaoFoiMedido}</p>
          </div>
        )}

        <p className="studio-literal">{parametro.fonte}</p>

        {registros.length > 0 && (
          <ul className="studio-tabela">
            {registros.map((r, i) => (
              <li className="studio-linha" key={`${r.carimbo}-${i}`}>
                <span className="studio-celula studio-celula-rotulo">
                  {r.de} → {r.para}
                </span>
                <span className="studio-celula">
                  {r.motivo} · {r.autor} · {r.carimbo}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="studio-acoes">
          <button type="button" className="studio-botao" onClick={alternar} aria-expanded={aberto}>
            {aberto ? "Cancelar mudança" : "Registrar mudança deste parâmetro"}
          </button>
        </div>

        {aberto && (
          <FormularioDeMudanca
            parametro={parametro}
            registrar={registrar}
            cancelar={alternar}
          />
        )}
      </div>
    </article>
  );
}

/**
 * O formulário de mudança.
 *
 * O BOTÃO NASCE DESABILITADO e a tela diz o que falta, em vez de deixar clicar e recusar
 * depois. O motivo é obrigatório pelo mesmo argumento que o torna obrigatório no veto da
 * moderação: uma decisão sem motivo escrito é indistinguível de arbítrio quando alguém for
 * ler a trilha seis meses depois.
 */
function FormularioDeMudanca({
  parametro,
  registrar,
  cancelar,
}: {
  parametro: ParametroDoMotor;
  registrar: (m: MudancaDeParametro) => void;
  cancelar: () => void;
}) {
  const [para, setPara] = useState("");
  const [motivo, setMotivo] = useState("");

  const falta = oQueFaltaNaMudanca({ para, de: parametro.valor, motivo });
  const idValor = `valor-${parametro.id}`;
  const idMotivo = `motivo-${parametro.id}`;

  return (
    <form
      className="studio-painel"
      onSubmit={(e) => {
        e.preventDefault();
        if (falta.length > 0) return;
        registrar({
          tipo: "parametro",
          parametroId: parametro.id,
          de: parametro.valor,
          para: para.trim(),
          motivo: motivo.trim(),
          autor: ADMIN_AUTORADO,
          carimbo: CARIMBO_DO_ADMIN,
        });
      }}
    >
      <p className="studio-rotulo">Mudar {parametro.nome}</p>

      <label className="admin-parametro-decide" htmlFor={idValor}>
        Valor novo — o atual é {parametro.valor}
      </label>
      <input
        id={idValor}
        className="admin-campo"
        value={para}
        onChange={(e) => setPara(e.target.value)}
        inputMode="decimal"
      />

      <label className="admin-parametro-decide" htmlFor={idMotivo}>
        Motivo — fica na trilha, com o seu nome
      </label>
      <input
        id={idMotivo}
        className="admin-campo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />

      {falta.length > 0 && (
        <p className="admin-parametro-decide" role="status">
          Falta {falta.join(" e ")}.
        </p>
      )}

      <p className="admin-parametro-decide">
        Vai ficar registrado como {ADMIN_AUTORADO}, em {CARIMBO_DO_ADMIN}. Não existe mudança
        anônima nesta superfície, nem para o administrador.
      </p>

      <div className="studio-acoes">
        <button
          type="submit"
          className="studio-botao studio-botao-primario"
          disabled={falta.length > 0}
        >
          Registrar mudança
        </button>
        <button type="button" className="studio-botao" onClick={cancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Concentradores — o que o grau de hub produz, em nomes
// ---------------------------------------------------------------------------

function PainelDeConcentradores({ dados }: { dados: Concentradores }) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Concentradores</h2>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{dados.total}</span> acima de {dados.limiar}
        </span>
      </div>
      <p className="studio-nota">
        As entidades que a caminhada trata como concentrador e evita atravessar. Baixar o
        limiar aumenta quantas entram nesta lista — e cada uma que entra é um caminho a menos
        entre duas obras. A tabela mostra as {dados.maiores.length} maiores das {dados.total}.
      </p>
      <ul className="studio-tabela admin-concentradores">
        {dados.maiores.map((c) => (
          <li className="studio-linha" key={c.id}>
            <span className="studio-celula studio-celula-rotulo studio-literal">{c.id}</span>
            <span className="studio-celula">{c.grauEscrito} arestas</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A trilha desta tela — o que o próprio administrador escreveu
// ---------------------------------------------------------------------------

function Trilha({
  registros,
  semArmazenamento,
}: {
  registros: MudancaDeParametro[];
  semArmazenamento: boolean;
}) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">O que foi mudado aqui</h2>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{registros.length}</span>
          {registros.length === 1 ? "mudança" : "mudanças"}
        </span>
      </div>

      {registros.length === 0 ? (
        <p className="studio-nota">
          Nenhum parâmetro foi mudado nesta sessão. Quando for, a mudança aparece aqui e na
          trilha de auditoria — com autor, carimbo e motivo, e sem opção de apagar.
        </p>
      ) : (
        <ul className="studio-tabela">
          {registros.map((r, i) => (
            <li className="studio-linha" key={`${r.parametroId}-${r.carimbo}-${i}`}>
              <span className="studio-celula studio-celula-rotulo">{r.parametroId}</span>
              <span className="studio-celula">
                {r.de} → {r.para} · {r.motivo} · {r.autor} · {r.carimbo}
              </span>
            </li>
          ))}
        </ul>
      )}

      {semArmazenamento && (
        <div className="studio-nao-sustenta" role="status">
          <p className="studio-nao-sustenta-rotulo">A trilha não está sendo guardada</p>
          <p>
            O armazenamento do navegador está bloqueado — janela privada, ou dados de site
            desligados. O que foi registrado vale nesta aba e some ao recarregar. No sistema
            real a trilha é do servidor; aqui ela é local, e a tela avisa quando nem isso
            está disponível.
          </p>
        </div>
      )}

      <p className="studio-nota">{ADMIN_E_AUTORADO}</p>
    </section>
  );
}
