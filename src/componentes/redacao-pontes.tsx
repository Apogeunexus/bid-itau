"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAVE_DAS_PONTES, gravarPontes, lerPontes } from "@/dados/redacao-registro";
import type {
  ArestaAutorada,
  CandidatoDoCatalogo,
  CatalogoDeArrasto,
  PesoDaAutoria,
  RelacaoDeSentido,
} from "@/dados/redacao";

/**
 * redacao-pontes.tsx — as arestas de sentido (E3). A tela mais delicada da Redação.
 *
 * O QUE ELA FAZ QUE NENHUMA OUTRA FAZ: aqui o Editor AFIRMA. O produtor declara fato, o
 * moderador registra decisão, o administrador escreve regra — e o editor escreve «o rap
 * dialoga com o slam», que não está em fonte nenhuma e que fonte nenhuma pode confirmar. É
 * por isso que cada linha sai com motivo escrito e assinatura, e é por isso que a tela
 * imprime a fronteira em vez de supor que quem opera já a conhece.
 *
 * TRÊS DAS CINCO RELAÇÕES TÊM ZERO INSTÂNCIAS NO ACERVO. `influenciou`, `deriva_de` e
 * `curou` estão no vocabulário fechado de `tipos.ts`, o motor de caminhada as percorre, e
 * ninguém as escreveu — 0 de 66.563. Esta tela é o que as tira do zero, e o contador ao lado
 * de cada relação não é decoração: é o estado que ela existe para mudar.
 *
 * O MOTIVO É OBRIGATÓRIO NAS CINCO, e o tipo base obriga só em `semelhante_a`. A obrigação
 * mora na interação e no tipo `ArestaAutorada` ao mesmo tempo: o botão fica `disabled`,
 * `autorar()` recusa por conta própria, e `motivo` não é opcional no tipo — as três travas
 * existem porque uma afirmação sem justificativa não é contestável, e o que não é
 * contestável não é curadoria.
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo. O catálogo chega achatado da
 * página de servidor, com teto medido.
 */

// A leitura, a gravação e a chave moram em `redacao-registro.ts`, com as outras telas da
// Redação: a E9 audita os três registros e precisa conhecer UM formato, não três. A
// validação na leitura continua lá, e vale para quem editar o storage à mão.

/** Uma coluna de escolha de ponta: filtro + lista, com a CLASSE sempre à vista. */
function EscolhaDePonta({
  lado,
  rotulo,
  itens,
  escolhido,
  excluir,
  aoEscolher,
}: {
  lado: "de" | "para";
  rotulo: string;
  itens: readonly CandidatoDoCatalogo[];
  escolhido: CandidatoDoCatalogo | null;
  /** O outro lado. Uma ponte de um nó para ele mesmo não afirma nada. */
  excluir: string | null;
  aoEscolher: (c: CandidatoDoCatalogo) => void;
}) {
  const [filtro, setFiltro] = useState("");
  const lista = useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    return itens
      .filter((c) => c.id !== excluir)
      .filter((c) => !alvo || c.titulo.toLowerCase().includes(alvo));
  }, [itens, filtro, excluir]);

  return (
    <section className="web-painel redacao-ponta" data-ponta={lado}>
      <div className="studio-painel-cabeca">
        <span className="studio-painel-nome">{rotulo}</span>
        {escolhido ? (
          <span className="studio-pastilha" data-ponta-classe={escolhido.classe}>
            {escolhido.classe}
          </span>
        ) : (
          <span className="studio-rotulo">nenhuma escolhida</span>
        )}
      </div>

      {escolhido ? (
        <p className="studio-nota redacao-ponta-escolhida" data-ponta-escolhida={escolhido.id}>
          <strong>{escolhido.titulo}</strong>
        </p>
      ) : (
        <p className="studio-nota">
          Escolha uma entidade. A classe dela fica declarada ao lado — uma ponte entre
          classes diferentes é legítima, e saber quais são é parte de assinar a afirmação.
        </p>
      )}

      <div className="redacao-campo">
        <label htmlFor={`filtro-${lado}`} className="studio-rotulo">
          filtrar
        </label>
        <input
          id={`filtro-${lado}`}
          className="redacao-textarea"
          value={filtro}
          placeholder="parte do título"
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <ul className="web-lista-densa redacao-catalogo">
        {lista.map((c) => (
          <li
            key={c.id}
            className="web-linha redacao-candidato"
            data-candidato-ponta={c.id}
            data-escolhido={escolhido?.id === c.id ? "sim" : "nao"}
          >
            <span className="redacao-candidato-texto">
              <span className="redacao-classe">{c.classe}</span>
              <span className="web-linha-titulo">{c.titulo}</span>
            </span>
            <button
              type="button"
              className="studio-botao redacao-acrescentar"
              onClick={() => aoEscolher(c)}
            >
              escolher
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function RedacaoPontes({
  catalogo,
  relacoes,
  peso,
  curador,
  carimbo,
  fronteira,
  regraDoMotivo,
}: {
  catalogo: CatalogoDeArrasto;
  relacoes: readonly RelacaoDeSentido[];
  peso: PesoDaAutoria;
  curador: string;
  carimbo: string;
  fronteira: string;
  regraDoMotivo: string;
}) {
  const [de, setDe] = useState<CandidatoDoCatalogo | null>(null);
  const [para, setPara] = useState<CandidatoDoCatalogo | null>(null);
  const [relacao, setRelacao] = useState<RelacaoDeSentido["relacao"] | "">("");
  const [motivo, setMotivo] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [pontes, setPontes] = useState<ArestaAutorada[]>([]);
  const [persistiu, setPersistiu] = useState(true);
  /** Qual ponte está com a retirada pendente de confirmação. Ver `remover`. */
  const [aRetirar, setARetirar] = useState<string | null>(null);

  useEffect(() => {
    const guardadas = lerPontes();
    if (guardadas.length) setPontes(guardadas);
  }, []);

  const relacaoEscolhida = relacoes.find((r) => r.relacao === relacao) ?? null;

  /**
   * As CINCO condições, e nenhuma é opcional: duas pontas distintas, relação do vocabulário
   * fechado, motivo escrito e assinatura. Faltando qualquer uma, o que sairia daqui seria
   * uma linha no grafo que ninguém consegue contestar.
   */
  const faltando = useMemo(() => {
    const f: string[] = [];
    if (!de) f.push("a ponta de origem");
    if (!para) f.push("a ponta de destino");
    if (!relacao) f.push("a relação");
    if (!motivo.trim()) f.push("o motivo");
    if (!assinatura.trim()) f.push("a assinatura");
    return f;
  }, [de, para, relacao, motivo, assinatura]);

  const podeAutorar = faltando.length === 0;

  /**
   * A SEGUNDA TRAVA. `disabled` cobre o clique; `Enter` no formulário e `form.submit()` não
   * passam por ele. Esta função recusa por conta própria — e é ela, não o atributo, que
   * garante que nenhuma ponte sem motivo entre no registro.
   */
  const autorar = () => {
    if (!podeAutorar || !de || !para || !relacao) return;
    const nova: ArestaAutorada = {
      deId: de.id,
      deTitulo: de.titulo,
      deClasse: de.classe,
      deSlug: de.slug,
      paraId: para.id,
      paraTitulo: para.titulo,
      paraClasse: para.classe,
      paraSlug: para.slug,
      relacao,
      motivo: motivo.trim(),
      assinatura: assinatura.trim(),
      carimbo,
    };
    const proximo = [nova, ...pontes];
    setPontes(proximo);
    setPersistiu(gravarPontes(proximo));
    // As pontas ficam; o motivo e a relação limpam. Autorar duas pontes seguidas com o
    // mesmo texto seria o acidente mais fácil desta tela, e o texto é o que a torna
    // defensável.
    setRelacao("");
    setMotivo("");
  };

  /**
   * Retirar do registro é IRREVERSÍVEL: o texto que a curadoria escreveu some, e não há
   * desfazer. Por isso o primeiro clique só arma a confirmação, e o segundo executa — a
   * confirmação é da própria tela, e não um `window.confirm`, que o protótipo não usa em
   * lugar nenhum.
   */
  const remover = (chave: string, indice: number) => {
    if (aRetirar !== chave) {
      setARetirar(chave);
      return;
    }
    const proximo = pontes.filter((_, i) => i !== indice);
    setPontes(proximo);
    setPersistiu(gravarPontes(proximo));
    setARetirar(null);
  };

  const autoradasAgora = peso.arestasAutoradas + pontes.length;

  return (
    <div className="studio redacao redacao-pontes">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · arestas de sentido</span>
        <h1 className="studio-titulo">Onde a curadoria afirma</h1>
        <p className="studio-objetivo">
          Toda ponte escrita aqui carrega motivo em português legível e assinatura. O tipo
          base obriga o motivo só em «semelhante a»; esta tela obriga nas cinco.
        </p>
        <div className="redacao-escopos">
          <span className="studio-pastilha" data-chave-pontes={CHAVE_DAS_PONTES}>
            registro local em <code className="studio-literal">{CHAVE_DAS_PONTES}</code>
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* A FRONTEIRA — impressa, e não pressuposta                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel redacao-fronteira" data-fronteira-etica>
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">O que se pode afirmar aqui</span>
        </div>
        <p className="studio-nota">{fronteira}</p>
      </section>

      <div className="redacao-colunas redacao-colunas-pontes">
        {/* ---- As duas pontas ---- */}
        <div className="redacao-coluna-pontas">
          <EscolhaDePonta
            lado="de"
            rotulo="de — a ponta de origem"
            itens={catalogo.itens}
            escolhido={de}
            excluir={para?.id ?? null}
            aoEscolher={setDe}
          />
          <EscolhaDePonta
            lado="para"
            rotulo="para — a ponta de destino"
            itens={catalogo.itens}
            escolhido={para}
            excluir={de?.id ?? null}
            aoEscolher={setPara}
          />
        </div>

        {/* ---- A relação, o motivo e a prévia ---- */}
        <div className="redacao-coluna-painel">
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A relação</span>
              <span className="studio-rotulo">vocabulário fechado — não há relação livre</span>
            </div>

            <ul className="redacao-relacoes">
              {relacoes.map((r) => (
                <li key={r.relacao}>
                  <button
                    type="button"
                    className="studio-botao redacao-relacao"
                    data-relacao={r.relacao}
                    data-escolhida={relacao === r.relacao ? "sim" : "nao"}
                    aria-pressed={relacao === r.relacao}
                    onClick={() => setRelacao(r.relacao)}
                  >
                    <span className="redacao-relacao-nome">{r.rotulo}</span>
                    <span className="redacao-relacao-afirma">{r.afirma}</span>
                    <span className="studio-pastilha" data-instancias-relacao={r.instancias}>
                      {r.instancias === 0
                        ? "0 no acervo — declarada e vazia"
                        : `${r.instancias.toLocaleString("pt-BR")} no acervo`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="studio-nota">
              As três que marcam <strong>0 no acervo</strong> estão no vocabulário fechado do
              contrato e o motor de caminhada as percorre — ninguém nunca as escreveu. É
              esta tela que as tira do zero.
            </p>
          </section>

          <section
            className="web-painel redacao-autoria"
            data-pode-autorar={podeAutorar ? "sim" : "nao"}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A afirmação</span>
              {de && para && relacaoEscolhida ? (
                <span className="studio-pastilha studio-pastilha-marca">
                  {de.titulo} {relacaoEscolhida.rotulo} {para.titulo}
                </span>
              ) : null}
            </div>

            <div className="redacao-campo">
              <label htmlFor="motivo-ponte" className="studio-rotulo">
                motivo — obrigatório, e é ele que vira o selo público da ligação
              </label>
              <textarea
                id="motivo-ponte"
                className="redacao-textarea redacao-motivo"
                data-motivo-ponte={motivo}
                data-vazio={motivo.trim() ? "nao" : "sim"}
                rows={3}
                value={motivo}
                placeholder="Por que esta ponte existe? Sem este texto ela não é autorada."
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <div className="redacao-campo">
              <label htmlFor="assinatura-ponte" className="studio-rotulo">
                assinatura da curadoria
              </label>
              <input
                id="assinatura-ponte"
                className="redacao-textarea"
                value={assinatura}
                onChange={(e) => setAssinatura(e.target.value)}
              />
            </div>

            <form
              className="studio-acoes"
              onSubmit={(e) => {
                e.preventDefault();
                autorar();
              }}
            >
              <button
                type="submit"
                className="studio-botao studio-botao-primario"
                data-autorar-ponte
                disabled={!podeAutorar}
              >
                Autorar e assinar
              </button>
              {faltando.length ? (
                <span className="redacao-aviso-veto" data-faltando={faltando.length}>
                  Falta {faltando.join(", ")}. Uma afirmação sem isso não é contestável.
                </span>
              ) : (
                <span className="studio-rotulo">
                  carimbo {carimbo} — derivado da data de referência do build
                </span>
              )}
            </form>

            <p className="studio-nota">{regraDoMotivo}</p>

            {/* ---- A prévia do selo, como na E1 ---- */}
            <div className="redacao-previa-selo">
              <span className="studio-rotulo">como o público vê esta ligação</span>
              {motivo.trim() ? (
                <p className="selo-motivo" data-previa-selo-ponte={motivo}>
                  <span>{motivo}</span>
                </p>
              ) : (
                <p className="selo-motivo redacao-selo-vazio" data-nao-sustenta>
                  <span>
                    selo em branco — é isto que o público veria, e é por isso que a ponte não
                    é autorada assim
                  </span>
                </p>
              )}
            </div>
          </section>

          {/* ---- O CONTADOR DE PESO ---- */}
          <section className="web-painel redacao-peso" data-peso-autoria>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O peso do que você assina</span>
            </div>
            <p className="studio-nota">
              O acervo tem <strong>{peso.arestasAutoradas.toLocaleString("pt-BR")}</strong>{" "}
              ligações autoradas em {peso.arestasTotal.toLocaleString("pt-BR")} — 0,12% do
              grafo — e {peso.nosAutorados.toLocaleString("pt-BR")} nós autorados em{" "}
              {peso.nosTotal.toLocaleString("pt-BR")}. Cada ponte escrita aqui entra nessa
              fatia, e a fatia é auditada no Observatório.
            </p>
            {pontes.length ? (
              <p className="studio-nota" data-autoradas-agora={autoradasAgora}>
                Com as {pontes.length.toLocaleString("pt-BR")} desta sessão, seriam{" "}
                <strong>{autoradasAgora.toLocaleString("pt-BR")}</strong> em{" "}
                {peso.arestasTotal.toLocaleString("pt-BR")}.
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* O que foi assinado nesta sessão                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel redacao-assinadas">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">Pontes assinadas nesta sessão</span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{pontes.length}</span>
            ponte(s)
          </span>
        </div>

        {persistiu ? null : (
          <p className="studio-nota" data-nao-sustenta>
            O navegador recusou gravar o registro local — acontece em janela privada e dentro
            de iframe. As pontes continuam nesta tela, mas fechar a aba as perde.
          </p>
        )}

        {pontes.length === 0 ? (
          <p className="studio-nota">
            Nenhuma ainda. O que for autorado aqui aparece nesta lista com autor e carimbo, e
            some se você apagar a chave do registro local declarada no cabeçalho.
          </p>
        ) : (
          <ul className="redacao-lista-pontes">
            {pontes.map((p, i) => (
              <li
                key={`${p.deId}->${p.relacao}->${p.paraId}`}
                className="redacao-ponte"
                data-ponte-autorada={p.relacao}
              >
                <div className="redacao-passo-nos">
                  <span className="redacao-no">
                    <span className="redacao-classe">{p.deClasse}</span>
                    <strong>{p.deTitulo}</strong>
                  </span>
                  <span aria-hidden className="redacao-seta">
                    →
                  </span>
                  <span className="redacao-no">
                    <span className="redacao-classe">{p.paraClasse}</span>
                    <strong>{p.paraTitulo}</strong>
                  </span>
                </div>
                <p className="selo-motivo" data-motivo-assinado={p.motivo}>
                  <span>{p.motivo}</span>
                </p>
                <p className="studio-nota redacao-decisao-assinatura">
                  relação «{p.relacao}» · procedência autorado · {p.assinatura} · {p.carimbo}
                </p>
                <div className="studio-acoes">
                  <button
                    type="button"
                    className="studio-botao redacao-desfazer"
                    data-remover-ponte={p.paraId}
                    data-confirmando={
                      aRetirar === `${p.deId}->${p.relacao}->${p.paraId}` ? "sim" : "nao"
                    }
                    onClick={() => remover(`${p.deId}->${p.relacao}->${p.paraId}`, i)}
                  >
                    {aRetirar === `${p.deId}->${p.relacao}->${p.paraId}`
                      ? "confirmar: retirar e apagar o motivo"
                      : "retirar do registro"}
                  </button>
                  {aRetirar === `${p.deId}->${p.relacao}->${p.paraId}` ? (
                    <button
                      type="button"
                      className="studio-botao"
                      data-cancelar-retirada={p.paraId}
                      onClick={() => setARetirar(null)}
                    >
                      cancelar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
