"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rotaDaEntidade } from "@/dados/rotas";
import {
  CHAVE_DAS_MATERIAS,
  comoSeLe,
  lerMaterias,
  registrarMateria,
} from "@/dados/redacao-registro";
import type { LigacaoEditorial, MateriaEditorial } from "@/dados/redacao-registro";
import type {
  CandidatoDoCatalogo,
  CatalogoDeArrasto,
  FormatoDeclarado,
  NumerosDoConhecimento,
  RelacaoEditorial,
} from "@/dados/redacao";

/**
 * redacao-materia.tsx — a redação editorial (E5).
 *
 * A LIGAÇÃO EDITORIAL É ARESTA, E NÃO ETIQUETA. A diferença não é de modelagem, é de
 * produto: é ela que faz «Aprofunda isto» funcionar A PARTIR DE qualquer evento ou obra. Uma
 * etiqueta «temas relacionados» no rodapé da matéria só é lida por quem já está na matéria;
 * uma aresta é percorrível nos dois sentidos, e é assim que quem olha um evento chega ao
 * texto que fala sobre ele. Por isso cada ligação daqui escolhe uma entidade REAL do acervo,
 * e não digita um assunto solto.
 *
 * A FRONTEIRA DA ENCICLOPÉDIA É O QUE ESTA TELA NÃO FAZ. `pessoa`, `coletivo` e `obra` são
 * autoridade a montante — 43.614 pessoas na base completa, reais, que nunca se cadastraram.
 * O que se escreve aqui é conteúdo editorial que FALA SOBRE o verbete, nunca o verbete. A
 * distinção parece sutil e não é: o verbete afirma quem a pessoa é, a matéria afirma o que a
 * Redação diz sobre ela, e só a segunda é do Editor.
 *
 * O CRÉDITO DA IMAGEM É OBRIGATÓRIO quando há imagem. Uma imagem sem crédito é afirmação de
 * autoria por omissão: quem lê assume que é da casa. E não pode ser suprido depois, porque a
 * fonte se perde — é a mesma razão do motivo obrigatório nas outras telas.
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo.
 */

export function RedacaoMateria({
  catalogo,
  formatos,
  relacoes,
  numeros,
  curador,
  carimbo,
  dataDeReferencia,
  fronteiraDaEnciclopedia,
  movimentoEhTermo,
  regraDoCredito,
}: {
  catalogo: CatalogoDeArrasto;
  formatos: readonly FormatoDeclarado[];
  relacoes: readonly RelacaoEditorial[];
  numeros: NumerosDoConhecimento;
  curador: string;
  carimbo: string;
  dataDeReferencia: string;
  fronteiraDaEnciclopedia: string;
  movimentoEhTermo: string;
  regraDoCredito: string;
}) {
  const [formato, setFormato] = useState<FormatoDeclarado>(formatos[0]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [imagem, setImagem] = useState("");
  const [credito, setCredito] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [agendamento, setAgendamento] = useState(dataDeReferencia);
  const [ligacoes, setLigacoes] = useState<LigacaoEditorial[]>([]);
  const [filtro, setFiltro] = useState("");
  const [alvo, setAlvo] = useState<CandidatoDoCatalogo | null>(null);
  const [relacao, setRelacao] = useState<RelacaoEditorial["relacao"]>(relacoes[0].relacao);
  const [motivoDaLigacao, setMotivoDaLigacao] = useState("");
  const [materias, setMaterias] = useState<MateriaEditorial[]>([]);
  const [persistiu, setPersistiu] = useState(true);

  useEffect(() => {
    const guardadas = lerMaterias();
    if (guardadas.length) setMaterias(guardadas);
  }, []);

  const candidatos = useMemo(() => {
    const alvoTexto = filtro.trim().toLowerCase();
    const jaLigadas = new Set(ligacoes.map((l) => l.entidadeId));
    return catalogo.itens
      .filter((c) => !jaLigadas.has(c.id))
      .filter((c) => !alvoTexto || c.titulo.toLowerCase().includes(alvoTexto));
  }, [catalogo.itens, filtro, ligacoes]);

  /** A ligação só entra com entidade E motivo — pelo mesmo motivo das pontes da E3. */
  const podeLigar = Boolean(alvo) && motivoDaLigacao.trim().length > 0;

  const acrescentarLigacao = () => {
    if (!podeLigar || !alvo) return;
    setLigacoes((antes) => [
      ...antes,
      {
        relacao,
        entidadeId: alvo.id,
        entidadeTitulo: alvo.titulo,
        entidadeClasse: alvo.classe,
        entidadeSlug: alvo.slug,
        motivo: motivoDaLigacao.trim(),
      },
    ]);
    setAlvo(null);
    setMotivoDaLigacao("");
  };

  const removerLigacao = (id: string) =>
    setLigacoes((antes) => antes.filter((l) => l.entidadeId !== id));

  /**
   * O crédito entra na conta do que falta SÓ quando há imagem — mas aí ele é tão obrigatório
   * quanto o título. Uma imagem publicada sem crédito é a afirmação de autoria por omissão
   * que esta tela existe para não fazer.
   */
  const faltando = useMemo(() => {
    const f: string[] = [];
    if (!titulo.trim()) f.push("o título");
    if (!texto.trim()) f.push("o texto");
    if (imagem.trim() && !credito.trim()) f.push("o crédito da imagem");
    if (!assinatura.trim()) f.push("a assinatura");
    return f;
  }, [titulo, texto, imagem, credito, assinatura]);

  const podePublicar = faltando.length === 0;

  const publicar = () => {
    if (!podePublicar) return;
    const nova: MateriaEditorial = {
      formato: formato.formato,
      titulo: titulo.trim(),
      texto: texto.trim(),
      imagem: imagem.trim() || null,
      creditoImagem: imagem.trim() ? credito.trim() : null,
      ligacoes,
      assinatura: assinatura.trim(),
      carimbo,
      agendadaPara: agendamento,
    };
    setMaterias((antes) => [nova, ...antes]);
    setPersistiu(registrarMateria(nova));
    setTitulo("");
    setTexto("");
    setImagem("");
    setCredito("");
    setLigacoes([]);
  };

  return (
    <div className="studio redacao redacao-materia">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · redação editorial</span>
        <h1 className="studio-titulo">As classes de conhecimento</h1>
        <p className="studio-objetivo">
          {numeros.conteudo.toLocaleString("pt-BR")} conteúdos e{" "}
          {numeros.publicacao.toLocaleString("pt-BR")} publicações no acervo, ligados às
          entidades por {numeros.ligacoesEditoriais.toLocaleString("pt-BR")} arestas
          editoriais. É a aresta, e não a etiqueta, que faz «Aprofunda isto» funcionar a
          partir de qualquer evento.
        </p>
        <div className="redacao-escopos">
          <span className="studio-pastilha" data-chave-materias={CHAVE_DAS_MATERIAS}>
            registro local em <code className="studio-literal">{CHAVE_DAS_MATERIAS}</code>
          </span>
        </div>
      </header>

      <section className="web-painel redacao-fronteira" data-fronteira-enciclopedia>
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">O que esta tela não escreve</span>
        </div>
        <p className="studio-nota">{fronteiraDaEnciclopedia}</p>
        <div className="studio-nao-sustenta" data-nao-sustenta data-movimento-e-termo>
          <span className="studio-nao-sustenta-rotulo">e movimento não é classe</span>
          <p>{movimentoEhTermo}</p>
        </div>
      </section>

      <div className="redacao-colunas redacao-colunas-materia">
        {/* -------------------------------------------------------------- */}
        {/* O texto                                                         */}
        {/* -------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          <section className="web-painel redacao-texto" data-pode-publicar={podePublicar ? "sim" : "nao"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A matéria</span>
              <span className="studio-pastilha studio-pastilha-marca" data-classe-do-formato={formato.classe}>
                vira {formato.classe}
              </span>
            </div>

            <div className="studio-acoes redacao-filtros" role="group" aria-label="formato">
              {formatos.map((f) => (
                <button
                  key={f.formato}
                  type="button"
                  className="studio-botao"
                  data-formato={f.formato}
                  data-ativo={formato.formato === f.formato ? "sim" : "nao"}
                  aria-pressed={formato.formato === f.formato}
                  onClick={() => setFormato(f)}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>

            <p className="studio-nota" data-descricao-formato={formato.formato}>
              <strong>{formato.rotulo}</strong> — {formato.descricao}.
            </p>

            <div className="redacao-campo">
              <label htmlFor="titulo-materia" className="studio-rotulo">
                título
              </label>
              <input
                id="titulo-materia"
                className="redacao-textarea"
                data-titulo-materia={titulo}
                value={titulo}
                placeholder="O título como o público vai ler"
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="redacao-campo">
              <label htmlFor="texto-materia" className="studio-rotulo">
                texto
              </label>
              <textarea
                id="texto-materia"
                className="redacao-textarea"
                data-texto-materia={texto}
                rows={6}
                value={texto}
                placeholder="O corpo da matéria."
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>

            {/* ---- Imagem e crédito, que andam juntos ---- */}
            <div className="redacao-campo">
              <label htmlFor="imagem-materia" className="studio-rotulo">
                imagem — opcional
              </label>
              <input
                id="imagem-materia"
                className="redacao-textarea"
                value={imagem}
                placeholder="endereço da imagem"
                onChange={(e) => setImagem(e.target.value)}
              />
            </div>

            {imagem.trim() ? (
              <div className="redacao-campo" data-credito-exigido>
                <label htmlFor="credito-materia" className="studio-rotulo">
                  crédito — obrigatório, porque há imagem
                </label>
                <input
                  id="credito-materia"
                  className="redacao-textarea redacao-motivo"
                  data-credito-imagem={credito}
                  data-vazio={credito.trim() ? "nao" : "sim"}
                  value={credito}
                  placeholder="De quem é esta imagem?"
                  onChange={(e) => setCredito(e.target.value)}
                />
                <p className="studio-nota">{regraDoCredito}</p>
              </div>
            ) : null}

            <div className="redacao-assinatura">
              <div className="redacao-campo">
                <label htmlFor="assinatura-materia" className="studio-rotulo">
                  assinatura
                </label>
                <input
                  id="assinatura-materia"
                  className="redacao-textarea"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                />
              </div>
              <div className="redacao-campo">
                <label htmlFor="agendamento-materia" className="studio-rotulo">
                  agendar para
                </label>
                <input
                  id="agendamento-materia"
                  type="date"
                  className="redacao-textarea"
                  value={agendamento}
                  onChange={(e) => setAgendamento(e.target.value)}
                />
              </div>
            </div>

            <form
              className="studio-acoes"
              onSubmit={(e) => {
                e.preventDefault();
                publicar();
              }}
            >
              <button
                type="submit"
                className="studio-botao studio-botao-primario"
                data-publicar-materia
                disabled={!podePublicar}
              >
                Publicar matéria
              </button>
              {faltando.length ? (
                <span className="redacao-aviso-veto" data-faltando={faltando.length}>
                  Falta {faltando.join(", ")}.
                </span>
              ) : null}
            </form>

            {persistiu ? null : (
              <p className="studio-nota" data-nao-sustenta>
                O navegador recusou gravar o registro local — acontece em janela privada e
                dentro de iframe. A matéria vale nesta tela, mas fechar a aba a perde.
              </p>
            )}
          </section>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* As ligações                                                     */}
        {/* -------------------------------------------------------------- */}
        <aside className="redacao-coluna-escolha">
          <section className="web-painel redacao-ligacoes">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Ligações editoriais</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{ligacoes.length}</span>
                nesta matéria
              </span>
            </div>

            <div className="studio-acoes redacao-filtros" role="group" aria-label="relação editorial">
              {relacoes.map((r) => (
                <button
                  key={r.relacao}
                  type="button"
                  className="studio-botao"
                  data-relacao-editorial={r.relacao}
                  data-ativo={relacao === r.relacao ? "sim" : "nao"}
                  aria-pressed={relacao === r.relacao}
                  onClick={() => setRelacao(r.relacao)}
                >
                  {r.rotulo} ({r.instancias.toLocaleString("pt-BR")})
                </button>
              ))}
            </div>

            <p className="studio-nota" data-afirma-relacao={relacao}>
              {relacoes.find((r) => r.relacao === relacao)?.afirma}.
            </p>

            <div className="redacao-campo">
              <label htmlFor="filtro-ligacao" className="studio-rotulo">
                a entidade a que este texto se liga
              </label>
              <input
                id="filtro-ligacao"
                className="redacao-textarea"
                value={filtro}
                placeholder="parte do título"
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <ul className="web-lista-densa redacao-catalogo">
              {candidatos.map((c) => (
                <li
                  key={c.id}
                  className="web-linha redacao-candidato"
                  data-candidato-ligacao={c.id}
                  data-escolhido={alvo?.id === c.id ? "sim" : "nao"}
                >
                  <span className="redacao-candidato-texto">
                    <span className="redacao-classe">{c.classe}</span>
                    <span className="web-linha-titulo">{c.titulo}</span>
                  </span>
                  <button
                    type="button"
                    className="studio-botao redacao-acrescentar"
                    onClick={() => setAlvo(c)}
                  >
                    ligar
                  </button>
                </li>
              ))}
            </ul>

            <div className="redacao-campo">
              <label htmlFor="motivo-ligacao" className="studio-rotulo">
                motivo da ligação — obrigatório, como em toda aresta da Redação
              </label>
              <textarea
                id="motivo-ligacao"
                className="redacao-textarea redacao-motivo"
                data-motivo-ligacao={motivoDaLigacao}
                data-vazio={motivoDaLigacao.trim() ? "nao" : "sim"}
                rows={2}
                value={motivoDaLigacao}
                placeholder="Por que este texto se liga a essa entidade?"
                onChange={(e) => setMotivoDaLigacao(e.target.value)}
              />
            </div>

            <div className="studio-acoes">
              <button
                type="button"
                className="studio-botao"
                data-acrescentar-ligacao
                disabled={!podeLigar}
                onClick={acrescentarLigacao}
              >
                acrescentar ligação
              </button>
              {!podeLigar ? (
                <span className="redacao-aviso-veto">
                  Escolha a entidade e escreva o motivo. Ligação sem motivo é etiqueta, e
                  etiqueta não é o que esta tela escreve.
                </span>
              ) : null}
            </div>

            {ligacoes.length ? (
              <ul className="redacao-lista-pontes">
                {ligacoes.map((l) => (
                  <li key={l.entidadeId} className="redacao-ponte" data-ligacao={l.relacao}>
                    <strong>
                      {l.relacao} · {l.entidadeTitulo}
                    </strong>
                    <span className="redacao-classe">{l.entidadeClasse}</span>
                    <p className="selo-motivo" data-motivo-da-ligacao={l.motivo}>
                      <span>{l.motivo}</span>
                    </p>
                    <button
                      type="button"
                      className="studio-botao redacao-desfazer"
                      data-remover-ligacao={l.entidadeId}
                      onClick={() => removerLigacao(l.entidadeId)}
                    >
                      remover ligação
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Nenhuma ligação ainda. Uma matéria sem ligação existe, mas não é alcançável a
                partir de nenhum evento ou obra — é texto solto no acervo.
              </p>
            )}
          </section>

          {/* ---- O que já foi publicado nesta sessão ---- */}
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Publicado nesta sessão</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{materias.length}</span>
                matéria(s)
              </span>
            </div>
            {materias.length === 0 ? (
              <p className="studio-nota">
                Nenhuma ainda. O que for publicado aqui aparece nesta lista com autor,
                carimbo e as ligações declaradas.
              </p>
            ) : (
              <ul className="redacao-lista-pontes">
                {materias.map((m, i) => (
                  <li
                    key={`${m.formato}:${m.titulo}:${i}`}
                    className="redacao-ponte"
                    data-materia-publicada={m.formato}
                  >
                    <strong>{m.titulo}</strong>
                    <span className="studio-rotulo">
                      {m.formato} · {m.ligacoes.length} ligação(ões)
                      {m.creditoImagem ? ` · imagem de ${m.creditoImagem}` : ""}
                    </span>
                    <p className="studio-nota redacao-decisao-assinatura">
                      {m.assinatura} · {m.carimbo} · agendada para {comoSeLe(m.agendadaPara)}
                    </p>
                    {m.ligacoes.map((l) => {
                      const rota = l.entidadeSlug
                        ? rotaDaEntidade(l.entidadeClasse as never, l.entidadeSlug)
                        : null;
                      return rota ? (
                        <Link
                          key={l.entidadeId}
                          href={rota}
                          className="studio-botao"
                          data-outro-lado={rota}
                        >
                          {l.relacao} · {l.entidadeTitulo} ↗
                        </Link>
                      ) : (
                        <span key={l.entidadeId} className="studio-nota" data-nao-sustenta>
                          {l.relacao} · {l.entidadeTitulo} — a classe «{l.entidadeClasse}» não
                          tem página própria no app.
                        </span>
                      );
                    })}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
