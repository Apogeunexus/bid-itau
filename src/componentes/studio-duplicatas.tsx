"use client";

import { useMemo, useState } from "react";
import { Comentario } from "@/componentes/comentario";
import type {
  ComponenteDoCriterio,
  GrupoDeDuplicatas,
  NumerosDaDeduplicacao,
} from "@/dados/duplicatas";

/**
 * studio-duplicatas.tsx — Studio, resolução de duplicatas (`docs/telas.md` tela 31,
 * STUD-01). **Cenário 3 do RFP.**
 *
 * A AFIRMAÇÃO QUE ESTA TELA EXISTE PARA TORNAR VISÍVEL. A suspeita de duplicata não nasce
 * de dois textos serem parecidos: nasce do CRITÉRIO DE IDENTIDADE DA ONTOLOGIA (D-22, D-68),
 * que é uma afirmação sobre o que faz duas linhas serem a mesma coisa no mundo. Por isso a
 * tela escreve o critério, mostra a chave literal dos dois lados e diz em qual estágio o
 * grupo foi pego — é o contrário de um deduplicador que devolve um número e pede confiança.
 *
 * O QUE FICA VISÍVEL COM O MODO COMENTADO DESLIGADO. O critério escrito, a chave literal, o
 * estágio, os campos divergentes marcados, a declaração do que o acervo NÃO sustenta e o par
 * que o humano tem de separar. Nenhum deles entra em `<Comentario>`: essas frases SÃO o
 * argumento da proposta, não o comentário sobre ele, e escondê-las esvaziaria exatamente a
 * tela que se quer mostrar. `<Comentario>` aqui envolve só a citação de número de decisão.
 *
 * A FILA INTEIRA VIVE NO CLIENTE, E ISSO É DE PROPÓSITO. Escolher outro grupo troca o painel
 * SEM NAVEGAR: a URL não muda, o build não gera 84 páginas e quem opera não perde o lugar na
 * fila a cada clique. O que atravessa a fronteira é a fila já achatada em DTO de primitivo.
 *
 * DP-F: tudo que vem de `@/dados/duplicatas` entra como `import type`. O módulo alcança
 * `grafo.ts`, e uma importação de valor arrastaria 23 MB de JSON para o navegador. O que
 * atravessa a fronteira é o DTO, montado no build pela página de servidor, e ele é só
 * primitivo. O gate transitivo da fase 3 mede isso.
 *
 * D-67: esta superfície só existe na visão web. Na visão app, o layout de bastidor mostra
 * o aviso de superfície de desktop com o botão que troca a visão — este componente não
 * precisa saber disso, e não sabe.
 *
 * O laranja da marca sai SEMPRE do token CSS, nunca de hex literal aqui: o hex do manual tem
 * uma fonte de verdade só, que é `globals.css` (D-06). A fase 2 mediu esse gate.
 */

type Registro = GrupoDeDuplicatas["registros"][number];

// ---------------------------------------------------------------------------
// Ajudantes de formatação
//
// `comSeparador` existe idêntico em `duplicatas.ts`, e a duplicação é a fronteira DP-F
// cobrando o seu preço: importar a função por valor arrastaria o módulo inteiro — e com ele
// `grafo.ts` e os 23 MB de JSON — para dentro do bundle do navegador. Cinco linhas repetidas
// custam menos do que isso, e o gate transitivo da fase 3 falharia com o caminho nomeado.
// ---------------------------------------------------------------------------

function comSeparador(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * De onde o grupo veio, em uma palavra na fila.
 *
 * OS 6 GRUPOS DO ACERVO SÃO O ACHADO MAIS FORTE DA TELA e por isso não podem ficar
 * indistinguíveis dos 40 que plantamos: o critério da ontologia encontrou duplicata de
 * VERDADE num acervo de verdade. A marca é textual e não só cromática, pela mesma razão que
 * a marca de campo divergente é — quem lê a tela numa foto de slide em preto e branco
 * continua entendendo o que ela afirma.
 */
const ROTULO_ORIGEM: Record<GrupoDeDuplicatas["origem"], string> = {
  acervo: "duplicata real do acervo",
  encenado: "duplicata encenada",
  cruzado: "cruzamento do 2º estágio",
};

const ROTULO_ORIGEM_CURTO: Record<GrupoDeDuplicatas["origem"], string> = {
  acervo: "do acervo",
  encenado: "encenada",
  cruzado: "cruzada",
};

// ---------------------------------------------------------------------------
// D-71 — as três ações, e a que NÃO é o botão de recusa
//
// «Manter separados» não é recusa: em 38 dos 51 pares do segundo estágio nenhum dos dois
// lados é clone nosso, e em muitos deles separar é a resposta CERTA. A tela diz isso ao
// lado do botão, porque um operador que lê «manter separados» como «não decidi» acaba
// fundindo o que devia separar — que é exatamente o desfecho que D-72 existe para impedir.
// ---------------------------------------------------------------------------

type Acao = "fundir" | "separar" | "adiar";

interface Decisao {
  grupoId: string;
  acao: Acao;
  /** Quem decidiu. Autorado e rotulado como tal — não há autenticação aqui (D-25). */
  quem: string;
  /** Derivado da data de referência do build, nunca do relógio do runtime. */
  quando: string;
}

const ROTULO_ACAO: Record<Acao, string> = {
  fundir: "fundido",
  separar: "mantidos separados",
  adiar: "adiado",
};

/**
 * QUEM DECIDIU, E POR QUE O NOME É AUTORADO.
 *
 * Não há autenticação neste protótipo (D-25), e a tela diz isso em vez de simular um login
 * que não existe. O nome está aqui para demonstrar que a decisão FICA REGISTRADA — que é o
 * que D-72 exige e o que separa uma fusão auditável de uma fusão anônima —, não para fingir
 * uma identidade que o sistema não verificou.
 */
const OPERADOR_AUTORADO = "curadoria de acervo · operador autorado";

/** "2026-08-22" → "22.08.2026". A mesma regra de `alerta.ts`, pelo mesmo motivo. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

function acoesDaTela(
  numeros: NumerosDaDeduplicacao,
): { acao: Acao; rotulo: string; primaria: boolean; nota: string }[] {
  return [
    {
      acao: "fundir",
      rotulo: "Fundir",
      primaria: true,
      nota:
        "Elege um registro como canônico e liga o outro a ele por «duplicata_de». " +
        "Reversível, com procedência preservada, e sem apagar nada.",
    },
    {
      acao: "separar",
      rotulo: "Manter separados",
      primaria: false,
      nota:
        `Não é o botão de recusa. Em ${numeros.paresProbabilisticosNaoEncenados} dos ` +
        `${numeros.paresProbabilisticos} pares do segundo estágio nenhum dos dois lados é ` +
        "clone nosso, e em muitos deles esta é a resposta CERTA: as Bienais numeradas e as " +
        "agendas mensais do Itaú Cultural são eventos diferentes que o score aproxima.",
    },
    {
      acao: "adiar",
      rotulo: "Adiar",
      primaria: false,
      nota:
        "Devolve o grupo à fila sem decidir. Adiar também é resposta, e fica registrado " +
        "que ninguém decidiu ainda — o grupo não some da fila em silêncio.",
    },
  ];
}

// ---------------------------------------------------------------------------
// O lado — a identidade de um registro do grupo
// ---------------------------------------------------------------------------

function Lado({ registro }: { registro: Registro }) {
  return (
    <div className="studio-lado" data-lado={registro.lado}>
      <div className="flex items-center gap-2">
        <span className="studio-lado-marca">{registro.lado}</span>
        <span className="studio-rotulo">{registro.procedencia}</span>
      </div>
      <h3 className="studio-lado-titulo">{registro.titulo}</h3>
      <div className="flex flex-col gap-0.5">
        <span className="studio-rotulo">chave de identidade</span>
        <code className="studio-literal">{registro.chaveIdentidade}</code>
      </div>
      <div className="dup-lado-numeros">
        <span>
          <strong>{comSeparador(registro.ocorrencias)}</strong> ocorrências
        </span>
        <span>{registro.periodo}</span>
      </div>
      {/* QUANTO DISTO FOI PLANTADO POR NÓS, junto do registro e não num rodapé: o grupo
          encenado declara a variação aplicada e de qual evento real ele é clone. */}
      {registro.variacao || registro.clonadoDe ? (
        <div className="dup-lado-variacao">
          {registro.variacao ? (
            <span>
              <strong>variação encenada:</strong> {registro.variacao}
            </span>
          ) : null}
          {registro.clonadoDe ? (
            <code className="studio-literal">clonado de {registro.clonadoDe}</code>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// D-69 — o estágio que pegou o grupo, e por que a ordem importa
// ---------------------------------------------------------------------------

function Estagio({ grupo }: { grupo: GrupoDeDuplicatas }) {
  return (
    <div className="dup-estagio">
      <div className="dup-estagio-cabeca">
        <span className="dup-estagio-selo" data-estagio={grupo.estagio}>
          {grupo.estagioRotulo}
        </span>
        {grupo.score !== null ? (
          <span className="dup-score" data-score={grupo.score.toFixed(3)}>
            score <strong>{grupo.score.toFixed(3)}</strong>
          </span>
        ) : (
          <span className="dup-sem-score">sem score — a chave não estima, ela afirma</span>
        )}
      </div>
      <p className="studio-nota">{grupo.estagioExplicacao}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D-70 — o lado a lado campo a campo, com os divergentes marcados
// ---------------------------------------------------------------------------

function Comparacao({ grupo }: { grupo: GrupoDeDuplicatas }) {
  // A grade é montada aqui porque o número de colunas é o número de registros, e um grupo
  // do acervo chega a ter três («#Vivendoartisticamente»). `repeat(var(--n), …)` não é
  // substituído de forma confiável nos navegadores; o template inteiro, sim.
  const colunas = `11rem repeat(${grupo.registros.length}, minmax(0, 1fr))`;

  return (
    <div className="dup-comparacao">
      <div className="dup-campo dup-campo-cabecalho" style={{ gridTemplateColumns: colunas }}>
        <span className="dup-campo-rotulo">campo</span>
        {grupo.registros.map((r) => (
          <span key={r.id} className="dup-campo-valor dup-campo-coluna">
            registro {r.lado}
          </span>
        ))}
      </div>

      {grupo.campos.map((campo) => (
        <div
          key={campo.campo}
          className="dup-campo"
          style={{ gridTemplateColumns: colunas }}
          data-campo={campo.campo}
          data-divergente={campo.divergente ? "sim" : "nao"}
        >
          <span className="dup-campo-rotulo">
            {campo.rotulo}
            {campo.divergente ? <span className="dup-marca-divergente">difere</span> : null}
          </span>
          {campo.valores.map((valor, i) => (
            <span key={grupo.registros[i]?.id ?? i} className="dup-campo-valor">
              {valor}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A LINHA DA FILA — um grupo, em três palavras
//
// É um `<button>` e não um `<div>` com `onClick`: escolher um grupo é ação, e quem opera
// oitenta e quatro grupos numa fila navega pelo teclado. `aria-pressed` diz qual está
// aberto, que é informação que a cor sozinha não carrega.
// ---------------------------------------------------------------------------

function LinhaDaFila({
  grupo,
  escolhido,
  separar,
  aoEscolher,
}: {
  grupo: GrupoDeDuplicatas;
  escolhido: boolean;
  /** `true` no par que o segundo estágio aproximou e que um humano tem de separar (D-72). */
  separar: boolean;
  aoEscolher: (id: string) => void;
}) {
  const score = grupo.score !== null ? { "data-score": grupo.score.toFixed(3) } : {};

  return (
    <button
      type="button"
      className="dup-linha"
      data-grupo={grupo.id}
      data-estagio={grupo.estagio}
      {...score}
      aria-pressed={escolhido}
      onClick={() => aoEscolher(grupo.id)}
    >
      <span className="dup-linha-titulo">{grupo.registros[0]?.titulo ?? grupo.id}</span>
      <span className="dup-linha-meta">
        <span className="dup-linha-origem" data-origem={grupo.origem}>
          {ROTULO_ORIGEM_CURTO[grupo.origem]}
        </span>
        <span className="dup-linha-contagem">{grupo.registros.length} registros</span>
        {grupo.score !== null ? (
          <span className="dup-linha-score">{grupo.score.toFixed(3)}</span>
        ) : (
          <span className="dup-linha-chave">chave idêntica</span>
        )}
        {separar ? <span className="dup-linha-separar">manter separados</span> : null}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function StudioDuplicatas({
  fila,
  grupoInicial,
  criterio,
  componentes,
  naoSustenta,
  numeros,
  parSeparado,
  fraseDeD72,
  dataDeReferencia,
}: {
  /** Os 84 grupos dos dois estágios, na ordem que `filaDeDuplicatas()` fixou. */
  fila: GrupoDeDuplicatas[];
  /** O id do grupo aberto ao chegar — fixado em constante, não sorteado a cada build. */
  grupoInicial: string;
  criterio: string;
  componentes: readonly ComponenteDoCriterio[];
  naoSustenta: string;
  numeros: NumerosDaDeduplicacao;
  parSeparado: GrupoDeDuplicatas;
  fraseDeD72: string;
  /**
   * A data de referência do build (`alerta.ts` a fixa em 2026-08-22), que carimba a
   * decisão. LER O RELÓGIO NO CLIENTE seria o defeito: o HTML exportado e a página
   * hidratada divergiriam na primeira renderização, e o carimbo ainda exporia o fuso
   * horário de quem avalia a proposta.
   */
  dataDeReferencia: string;
}) {
  const [escolhidoId, setEscolhidoId] = useState<string>(grupoInicial);

  /**
   * As decisões desta sessão. Estado de componente, e não `localStorage`: recarregar
   * limpa, e a tela declara isso. Este protótipo NÃO TEM ESCRITA — o que ele demonstra é
   * a forma da decisão, não a persistência dela.
   */
  const [decisoes, setDecisoes] = useState<Decisao[]>([]);

  const decididoPor = useMemo(
    () => new Map(decisoes.map((d) => [d.grupoId, d])),
    [decisoes],
  );

  const pendentes = useMemo(
    () => fila.filter((g) => !decididoPor.has(g.id)),
    [fila, decididoPor],
  );
  const porChave = useMemo(() => pendentes.filter((g) => g.estagio === "chave"), [pendentes]);
  const probabilisticos = useMemo(
    () => pendentes.filter((g) => g.estagio === "probabilistico"),
    [pendentes],
  );

  const decididos = useMemo(
    () =>
      decisoes
        .map((decisao) => ({ decisao, grupo: fila.find((g) => g.id === decisao.grupoId) }))
        .filter(
          (x): x is { decisao: Decisao; grupo: GrupoDeDuplicatas } => x.grupo !== undefined,
        ),
    [decisoes, fila],
  );

  const acoes = useMemo(() => acoesDaTela(numeros), [numeros]);

  // Grupo desconhecido cai no primeiro da fila em vez de deixar o painel vazio: a fila é o
  // dado, e a escolha é estado de tela — nenhuma das duas pode derrubar a outra.
  const grupo = useMemo(
    () => fila.find((g) => g.id === escolhidoId) ?? fila[0],
    [fila, escolhidoId],
  );

  if (!grupo) return null;

  const decisaoDoGrupo = decididoPor.get(grupo.id);

  /**
   * NENHUMA FUSÃO ACONTECE SOZINHA (D-72). Só existe um caminho para uma decisão nascer, e
   * ele é este: alguém apertou um botão. Não há regra que decida por score, não há limiar
   * que funda automaticamente, e o registro guarda o que foi decidido, por quem e quando.
   */
  const decidir = (acao: Acao) => {
    setDecisoes((antes) => [
      { grupoId: grupo.id, acao, quem: OPERADOR_AUTORADO, quando: dataDeReferencia },
      ...antes.filter((d) => d.grupoId !== grupo.id),
    ]);
  };

  /** O caminho de volta, nomeado na tela: é o que torna a fusão reversível de fato. */
  const desfazer = (grupoId: string) =>
    setDecisoes((antes) => antes.filter((d) => d.grupoId !== grupoId));

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · resolução de duplicatas</span>
        <h1 className="studio-titulo">Fila de grupos suspeitos</h1>
        <p className="studio-objetivo">
          O critério de identidade da ontologia aplicado ao acervo, com o resultado
          auditável campo a campo. Nenhuma fusão acontece sozinha: a suspeita é do sistema,
          a decisão é de quem opera.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="studio-pastilha studio-pastilha-marca">
            <span className="studio-pastilha-numero">{numeros.gruposPorChave}</span>
            por chave determinística
          </span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{numeros.gruposPorChaveDoAcervo}</span>
            deles são duplicata real do acervo
          </span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{numeros.paresProbabilisticos}</span>
            por casamento probabilístico
          </span>
          <span className="studio-pastilha">
            limiar <span className="studio-pastilha-numero">{numeros.limiar.toFixed(2)}</span>
          </span>
        </div>
        {/* O COLAPSO, EM NÚMERO E NÃO EM «MILHARES». O Cenário 3 promete que registros
            duplicados colapsam num evento com N ocorrências; aqui está o N, contado. */}
        <div className="flex flex-wrap gap-1.5">
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{numeros.registrosEncenados}</span>
            registros encenados
          </span>
          <span className="studio-pastilha">
            colapsam em{" "}
            <span className="studio-pastilha-numero">
              {numeros.eventosDepoisDaFusaoEncenada}
            </span>
            eventos
          </span>
          <span className="studio-pastilha studio-pastilha-marca">
            preservando{" "}
            <span className="studio-pastilha-numero">
              {comSeparador(numeros.ocorrenciasEncenadas)}
            </span>
            ocorrências
          </span>
        </div>
      </header>

      <div className="dup-tela">
        {/* ---------------------------------------------------------------- */}
        {/* A FILA — os dois estágios, nesta ordem                            */}
        {/* ---------------------------------------------------------------- */}
        <aside className="dup-fila" data-fila-duplicatas={fila.length}>
          <div className="dup-fila-cabeca">
            <span className="studio-rotulo">a fila</span>
            <p className="dup-fila-total">
              <strong>{fila.length}</strong> grupos suspeitos
            </p>
            <p className="dup-fila-nota">
              Primeiro os {numeros.gruposPorChave} que a chave determinística afirma; depois
              os {numeros.paresProbabilisticos} que o casamento probabilístico levanta, por
              score decrescente. A ordem é o argumento: o critério vem antes da heurística.
            </p>
            <p className="dup-fila-nota">
              {numeros.gruposPorChaveDoAcervo} deles não foram plantados por nós: são
              duplicata real do acervo, e carregam a marca preta na linha.
            </p>
          </div>

          {decididos.length ? (
            <section className="dup-fila-secao">
              <h2 className="dup-fila-titulo">
                decisões tomadas nesta sessão
                <span className="dup-fila-quantos">{decididos.length}</span>
              </h2>
              <ul className="dup-fila-lista">
                {decididos.map(({ decisao, grupo: decidido }) => (
                  <li
                    key={decisao.grupoId}
                    className="dup-item dup-item-decidido"
                    data-decisao={decisao.grupoId}
                  >
                    <LinhaDaFila
                      grupo={decidido}
                      escolhido={decidido.id === grupo.id}
                      separar={decidido.id === parSeparado.id}
                      aoEscolher={setEscolhidoId}
                    />
                    <p className="dup-decisao-registro">
                      <span className="dup-decisao-acao">{ROTULO_ACAO[decisao.acao]}</span>
                      <span>por {decisao.quem}</span>
                      <span>em {dataCurta(decisao.quando)}</span>
                    </p>
                    <button
                      type="button"
                      className="dup-desfazer"
                      onClick={() => desfazer(decisao.grupoId)}
                    >
                      desfazer a decisão
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="dup-fila-secao">
            <h2 className="dup-fila-titulo">
              1º estágio · chave determinística
              <span className="dup-fila-quantos">{porChave.length}</span>
            </h2>
            <ul className="dup-fila-lista">
              {porChave.map((g) => (
                <li key={g.id} className="dup-item">
                  <LinhaDaFila
                    grupo={g}
                    escolhido={g.id === grupo.id}
                    separar={g.id === parSeparado.id}
                    aoEscolher={setEscolhidoId}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="dup-fila-secao">
            <h2 className="dup-fila-titulo">
              2º estágio · casamento probabilístico
              <span className="dup-fila-quantos">{probabilisticos.length}</span>
            </h2>
            <ul className="dup-fila-lista">
              {probabilisticos.map((g) => (
                <li key={g.id} className="dup-item">
                  <LinhaDaFila
                    grupo={g}
                    escolhido={g.id === grupo.id}
                    separar={g.id === parSeparado.id}
                    aoEscolher={setEscolhidoId}
                  />
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* O PAINEL — o grupo escolhido                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="dup-painel">
          {/* -------------------------------------------------------------- */}
          {/* D-68 — o critério, escrito por extenso                          */}
          {/* -------------------------------------------------------------- */}
          <section className="studio-painel dup-criterio" data-criterio>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O critério que disparou a suspeita</span>
              <Comentario como="span" className="studio-rotulo">
                D-68 · D-22
              </Comentario>
            </div>

            <p className="studio-nota">{criterio}</p>

            <ul className="dup-componentes">
              {componentes.map((c) => (
                <li
                  key={c.campo}
                  className="dup-componente"
                  data-componente={c.campo}
                  data-sustentado={c.sustentado ? "sim" : "nao"}
                >
                  <span className="dup-componente-marca">
                    {c.sustentado ? "preenchido" : "vazio"}
                  </span>
                  <span>{c.rotulo}</span>
                </li>
              ))}
            </ul>

            <div className="dup-chaves">
              <span className="studio-rotulo">a chave literal de cada registro</span>
              {grupo.registros.map((r) => (
                <div key={r.id} className="dup-chave-linha">
                  <span className="studio-lado-marca">{r.lado}</span>
                  <code className="studio-literal">{r.chaveIdentidade}</code>
                </div>
              ))}
            </div>

            {/* PRODUTO, e não comentário: fica visível com o modo comentado desligado. */}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">o que o acervo não sustenta</span>
              <p>{naoSustenta}</p>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* O COLAPSO E O QUE FOI PLANTADO — as duas primeiras perguntas    */}
          {/* que a banca vai fazer, respondidas antes dela.                  */}
          {/* -------------------------------------------------------------- */}
          <section className="studio-painel dup-colapso">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O colapso, contado</span>
              <Comentario como="span" className="studio-rotulo">
                Cenário 3 · D-77
              </Comentario>
            </div>

            <p className="studio-nota">
              <strong>{numeros.registrosEncenados} registros</strong> encenados colapsam em{" "}
              <strong>{numeros.eventosDepoisDaFusaoEncenada} eventos</strong>, e as{" "}
              <strong>{comSeparador(numeros.ocorrenciasEncenadas)} ocorrências</strong> deles
              continuam todas ali — nenhuma sessão se perde na fusão. É isto que «registros
              duplicados colapsam num evento com N ocorrências» significa quando se conta em
              vez de se afirmar. Sobre esses, o critério ainda encontrou{" "}
              <strong>{numeros.gruposPorChaveDoAcervo} grupos reais</strong> no acervo do
              Itaú Cultural, que ninguém plantou.
            </p>

            {/* PRODUTO, e não comentário: quanto desta fila é nossa. */}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">quanto disto plantamos</span>
              <p>
                Dos {numeros.filaTotal} grupos da fila,{" "}
                <strong>{numeros.gruposEncenadosNaFila} são encenados</strong>: eventos
                clonados de eventos reais com variação controlada — caixa do título, prefixo
                do produtor, sufixo de edição —, marcados{" "}
                <code className="studio-literal">autorado</code> e criados para o Cenário 3.
                Outros <strong>{numeros.gruposDoAcervoNaFila} não têm clone nenhum</strong>:
                o critério os achou sozinho no acervo. Os{" "}
                {numeros.gruposCruzadosNaFila} restantes são clone emparelhado com um evento
                que <em>não</em> é o original dele — o segundo estágio fazendo o que
                heurística faz, contado à parte em vez de inflar o acerto do motor. Nada
                disto fica implícito: cada grupo diz na linha de qual dos três casos ele é.
              </p>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* O grupo escolhido — D-69 e D-70                                 */}
          {/* -------------------------------------------------------------- */}
          <section className="studio-painel" data-grupo-escolhido={grupo.id}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Grupo suspeito</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{grupo.registros.length}</span>
                registros
              </span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">
                  {comSeparador(grupo.ocorrenciasEnvolvidas)}
                </span>
                ocorrências envolvidas
              </span>
              <span className="dup-origem" data-origem={grupo.origem}>
                {ROTULO_ORIGEM[grupo.origem]}
              </span>
            </div>

            <Estagio grupo={grupo} />

            <div className="studio-lados">
              {grupo.registros.map((registro) => (
                <Lado key={registro.id} registro={registro} />
              ))}
            </div>

            <Comparacao grupo={grupo} />

            {/* O COLAPSO DO GRUPO, e a honestidade quando ele é zero. Os registros da
                Enciclopédia não têm sessão nenhuma no acervo — `ocorrenciasDe` devolve zero
                para eles —, e a tela diz isso em vez de imprimir um «0» seco que quem lê
                interpretaria como perda na fusão. */}
            <p className="dup-colapso-grupo">
              <span className="studio-rotulo">o que a fusão preservaria</span>
              {grupo.registros
                .map((r) => `registro ${r.lado}: ${comSeparador(r.ocorrencias)}`)
                .join(" · ")}{" "}
              → o evento fundido teria{" "}
              <strong>{comSeparador(grupo.ocorrenciasEnvolvidas)} ocorrências</strong>
              {grupo.ocorrenciasEnvolvidas === 0
                ? ". Nenhum destes registros tem sessão declarada no acervo — são registros da Enciclopédia, e o Studio opera sobre os eventos do CMS quando o assunto é ocorrência. O zero aqui é do acervo, não da fusão."
                : ", e nenhuma delas se perde: a fusão elege um canônico, não descarta sessões."}
            </p>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* D-71 e D-72 — as três ações, e a decisão que é humana           */}
          {/* -------------------------------------------------------------- */}
          <section className="studio-painel dup-decisao">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A decisão é humana, por desenho</span>
              <Comentario como="span" className="studio-rotulo">
                D-71 · D-72
              </Comentario>
            </div>

            <p className="studio-nota">
              O casamento probabilístico <strong>sugere</strong>; ele não conclui. E é
              justamente no caso mais tentador de automatizar que o princípio da mediação
              legível se aplica: o par{" "}
              <strong>{parSeparado.registros.map((r) => r.titulo).join(" × ")}</strong>{" "}
              pontua {parSeparado.score?.toFixed(3) ?? "—"} e está{" "}
              <button
                type="button"
                className="dup-atalho"
                onClick={() => setEscolhidoId(parSeparado.id)}
              >
                na fila, marcado «manter separados»
              </button>
              . Um deduplicador automático funde os dois e nunca fica sabendo que apagou uma
              edição inteira do acervo.
            </p>

            {/* PRODUTO, e não comentário: o que a fusão faz fica declarado ANTES de ela
                acontecer, e é isso que permite decidir com o efeito à vista. */}
            <div className="dup-reversivel" data-reversivel>
              <span className="dup-reversivel-rotulo">o que a fusão faz, declarado antes</span>
              <ol className="dup-reversivel-lista">
                <li>
                  <strong>É reversível.</strong> Toda decisão tomada aqui tem o caminho de
                  volta nomeado na tela — o botão «desfazer a decisão», ao lado do registro,
                  na fila. Fundir não é uma porta de mão única.
                </li>
                <li>
                  <strong>Preserva procedência.</strong> Os dois registros mantêm o seu
                  rótulo — <code className="studio-literal">ic</code>,{" "}
                  <code className="studio-literal">derivado</code> ou{" "}
                  <code className="studio-literal">autorado</code> — e a procedência de cada
                  lado continua visível na tela depois da decisão, não só antes dela.
                </li>
                <li>
                  <strong>Nada é apagado.</strong> O registro secundário continua existindo e
                  continua consultável na sua rota. O que a fusão muda é qual dos dois é
                  canônico, e não quantos registros existem.
                </li>
                <li>
                  <strong>A relação resultante é{" "}
                  <code className="studio-literal">duplicata_de</code></strong>, dirigida do
                  secundário para o canônico, no lugar da{" "}
                  <code className="studio-literal">duplicata_suspeita</code> que os ligava. A
                  suspeita vira afirmação, e a afirmação tem direção.
                </li>
                <li>
                  <strong>Este protótipo não tem escrita.</strong> Nenhuma aresta do grafo
                  muda quando o botão é apertado: a decisão é registrada na sessão do
                  navegador e desaparece ao recarregar. O que esta tela demonstra é a{" "}
                  <strong>forma</strong> da decisão e o que ela produziria num sistema com
                  backend — não uma persistência que não existe.
                </li>
              </ol>
              <p className="dup-reversivel-consequencia">
                E uma consequência assumida em voz alta:{" "}
                <code className="studio-literal">duplicata_de</code> ainda{" "}
                <strong>não está</strong> no vocabulário fechado de relações do PRD §6.
                Acrescentá-la é consequência desta tela — não licença que ela tomou.
              </p>
            </div>

            <div className="dup-acoes">
              {acoes.map((a) => (
                <div key={a.acao} className="dup-acao">
                  <button
                    type="button"
                    data-acao={a.acao}
                    className={
                      a.primaria ? "studio-botao studio-botao-primario" : "studio-botao"
                    }
                    onClick={() => decidir(a.acao)}
                  >
                    {a.rotulo}
                  </button>
                  <p className="dup-acao-nota">{a.nota}</p>
                </div>
              ))}
            </div>

            {decisaoDoGrupo ? (
              <p className="dup-decisao-painel">
                <span className="dup-decisao-acao">{ROTULO_ACAO[decisaoDoGrupo.acao]}</span>
                registrado por <strong>{decisaoDoGrupo.quem}</strong> em{" "}
                <strong>{dataCurta(decisaoDoGrupo.quando)}</strong>. O carimbo é a data de
                referência do build, e não o relógio de quem abre a página.
              </p>
            ) : (
              <p className="dup-sem-decisao">
                Nenhuma decisão registrada neste grupo. Nada acontece até alguém apertar — e
                quando acontecer, ficará registrado o quê, por quem e quando.
              </p>
            )}
          </section>

          {/* -------------------------------------------------------------- */}
          {/* D-72 — o par que o humano tem de SEPARAR                        */}
          {/* -------------------------------------------------------------- */}
          <section className="studio-painel dup-falso-positivo" data-falso-positivo>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">
                O que o segundo estágio levanta e não decide
              </span>
              <span className="dup-estagio-selo" data-estagio={parSeparado.estagio}>
                {parSeparado.estagioRotulo}
              </span>
              {parSeparado.score !== null ? (
                <span className="dup-score" data-score={parSeparado.score.toFixed(3)}>
                  score <strong>{parSeparado.score.toFixed(3)}</strong>
                </span>
              ) : null}
            </div>

            <div className="studio-lados">
              {parSeparado.registros.map((r) => (
                <div key={r.id} className="studio-lado">
                  <span className="studio-lado-titulo">{r.titulo}</span>
                  <span className="studio-nota">{r.periodo}</span>
                </div>
              ))}
            </div>

            <p className="studio-nota">{fraseDeD72}</p>

            {/* A FRASE MAIS VALIOSA DA TELA: o falso positivo deixa de ser defeito a
                esconder e vira demonstração do princípio. */}
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">o que o segundo estágio erra</span>
              <p>
                Entre os {numeros.paresProbabilisticos} pares,{" "}
                <strong>{numeros.paresProbabilisticosNaoEncenados} não são clone nosso</strong>{" "}
                com o seu original, e vários deles são eventos legitimamente distintos: as
                Bienais de São Paulo numeradas — este par pontua{" "}
                {parSeparado.score?.toFixed(3) ?? "—"} e as edições estão a dois anos uma da
                outra — e as agendas mensais do Itaú Cultural, que só diferem no nome do mês.
                A resposta certa ali é <strong>«manter separados»</strong>. Isto não é defeito
                escondido: é a demonstração do princípio. O acervo não sustenta uma medida de
                parecença que separe estes dois, porque o que os separa é o período declarado
                — e ler o período é trabalho de quem decide, não de quem estima.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
