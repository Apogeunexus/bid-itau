"use client";

import { useMemo, useState } from "react";
import { normalizar } from "@/dados/indice";
import {
  EXPLICACAO_DA_SITUACAO,
  FRASE_DA_PROCEDENCIA,
  PORTAS,
  ROTULO_DA_SITUACAO,
  chaveDoEvento,
  scoreDoRascunho,
} from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor } from "@/dados/tipos-acesso";
import { useStudio } from "@/componentes/studio-estado";
import { Literal } from "@/componentes/studio-literal";
import { comSeparador } from "@/componentes/studio-datas";
import type {
  CatalogoDeIdentidade,
  ImagemDoCatalogo,
  TermoDoCatalogo,
} from "@/dados/mock/seed";

/**
 * studio-publicar.tsx — P2 · identidade do evento (funcionalidades 153 e 165).
 *
 * A TELA QUE ESTABELECE A CHAVE, e por isso a primeira da jornada. `evento = título
 * normalizado + agente realizador + obra`: as outras sete telas dependem desta ter rodado,
 * porque temporada se ancora no evento e sessão se ancora na temporada. Um formulário que
 * deixasse pular esta ordem gravaria registro sem chave, e a fila de duplicatas passaria a
 * acusar o próprio Studio (`duplicatas.ts`).
 *
 * O QUE MUDOU DA VERSÃO ANTERIOR. Ela validava e não gravava — «publicar» mostrava o
 * registro que seria enviado e declarava que nada tinha sido salvo. Agora escreve no
 * `RascunhoDoProdutor`, que é o mesmo registro que as outras sete telas continuam e que
 * sobrevive ao recarregamento. O aviso de duplicata contra os 300 eventos reais e a
 * normalização vinda de `indice.ts` são os mesmos — foram estendidos, não reescritos.
 *
 * MÓDULO DE CLIENTE: `@/dados/mock/seed` entra **apenas por tipo**; os valores chegam por
 * prop, do componente de servidor que os leu no build (DP-F). `tipos-acesso` entra por
 * valor porque não importa dado nenhum — é a exceção declarada no contrato.
 *
 * D-67: esta superfície só existe na visão web. Na visão app o layout de bastidor mostra o
 * aviso de superfície, e por isso não há aqui nenhuma divergência por `data-view`.
 */

export interface EventoExistente {
  slug: string;
  titulo: string;
  normalizado: string;
}

export interface ComponenteDoCriterioDTO {
  campo: string;
  rotulo: string;
  sustentado: boolean;
}

interface Props {
  catalogo: CatalogoDeIdentidade;
  semente: RascunhoDoProdutor[];
  criterioDeIdentidade: string;
  /** Os três componentes como o acervo os sustenta HOJE — o ponto de partida da conversão. */
  componentesNoAcervo: readonly ComponenteDoCriterioDTO[];
  /** A frase que declara que o perfil do produtor é autorado, no padrão do operador. */
  produtorEAutorado: string;
  /** A frase que declara que a situação dos registros semeados é autorada. */
  situacaoEAutorada: string;
}

/**
 * Quantas pílulas de vocabulário aparecem antes de «mostrar os outros».
 *
 * 24 é o que cabe em três linhas na coluna do formulário sem virar parede. O número está
 * aqui e não espalhado porque as duas listas — 33 linguagens e 94 temas — precisam cortar no
 * mesmo lugar: cortes diferentes fariam parecer que uma lista está completa e a outra não.
 */
const LIMITE_DE_PILULAS = 24;

export function FormularioPublicar({
  catalogo,
  semente,
  criterioDeIdentidade,
  componentesNoAcervo,
  produtorEAutorado,
  situacaoEAutorada,
}: Props) {
  const studio = useStudio(semente, {
    dataDeReferencia: catalogo.dataDeReferencia,
    autor: catalogo.produtor,
    organizacao: catalogo.organizacao,
  });

  const { pronto, rascunhos, atual, editavelAgora } = studio;

  // A duplicata ANTES de salvar: título normalizado contra os 300 eventos reais. A mesma
  // `normalizar` do índice de busca — uma regra própria aqui faria o Studio gravar chave
  // que a fila de duplicatas não reconhece.
  const duplicatas = useMemo(() => {
    const n = normalizar(atual?.titulo ?? "");
    if (n.length < 4) return [];
    return catalogo.eventos
      .filter((e) => e.normalizado === n || e.normalizado.startsWith(n))
      .slice(0, 3);
  }, [atual?.titulo, catalogo.eventos]);

  if (!pronto || atual === null) {
    return (
      <p className="studio-nota" data-carregando>
        Lendo o que você já tinha escrito…
      </p>
    );
  }

  const { componentes } = chaveDoEvento(atual.titulo, atual.fonte, atual.obraTitulo);
  const sustentados = componentes.filter((c) => c.sustentado).length;
  const score = scoreDoRascunho(atual);
  const temImagem = atual.imagem !== null;
  const semCredito = temImagem && (atual.creditoImagem ?? "").trim() === "";

  // As três validações que a funcionalidade 153 pede, TODAS antes de salvar e não depois.
  const problemas: string[] = [];
  if (atual.titulo.trim() === "") {
    problemas.push("o título é o primeiro componente da chave — sem ele o registro não tem identidade");
  } else if (atual.titulo.trim().length < 3) {
    problemas.push("o título precisa de ao menos 3 caracteres para ser normalizado");
  }
  if (semCredito) {
    problemas.push("a imagem está escolhida e o crédito não — imagem sem crédito não entra no acervo");
  }
  if (duplicatas.length > 0) {
    problemas.push(
      `a chave colide com ${duplicatas.length === 1 ? "1 evento existente" : `${duplicatas.length} eventos existentes`} — confira antes de seguir`,
    );
  }

  const alternarTermo = (campo: "linguagens" | "temas", id: string) => {
    const atualLista = atual[campo];
    studio.alterar({
      [campo]: atualLista.includes(id)
        ? atualLista.filter((x) => x !== id)
        : [...atualLista, id],
    });
  };

  const proporTermo = (texto: string) => {
    const t = texto.trim();
    if (t === "" || atual.termosPropostos.includes(t)) return;
    studio.alterar({ termosPropostos: [...atual.termosPropostos, t] });
  };

  const escolherImagem = (img: ImagemDoCatalogo | null) => {
    studio.alterar({
      imagem: img?.caminho ?? null,
      creditoImagem: img?.credito ?? null,
    });
  };

  return (
    <div className="studio-jornada">
      {/* ---- qual registro estou editando ---- */}
      <SeletorDeRegistro
        rascunhos={rascunhos}
        atual={atual}
        aoEscolher={studio.escolher}
        aoCriar={() => studio.criar()}
        aoReiniciar={studio.reiniciar}
        situacaoEAutorada={situacaoEAutorada}
      />

      <div className="web-duas-colunas">
        {/* =============== coluna da esquerda: o formulário =============== */}
        <form className="studio-forma" onSubmit={(e) => e.preventDefault()}>
          {!editavelAgora ? (
            <p className="studio-travado" data-situacao={atual.situacao}>
              <strong>{ROTULO_DA_SITUACAO[atual.situacao]}.</strong>{" "}
              {EXPLICACAO_DA_SITUACAO[atual.situacao]}
            </p>
          ) : null}

          <label className="studio-campo">
            <span className="studio-campo-rotulo">
              Título do evento <em className="studio-campo-exigido">obrigatório</em>
            </span>
            <input
              type="text"
              value={atual.titulo}
              disabled={!editavelAgora}
              onChange={(e) => studio.alterar({ titulo: e.target.value })}
              className="studio-campo-entrada"
              placeholder="Ocupação Fulana de Tal"
            />
            {/* A normalização VISÍVEL ao lado: é ela, e não o que se digita, que entra na
                chave. Esconder a transformação faria a colisão parecer arbitrária. */}
            <span className="studio-campo-nota">
              normalizado: <Literal valor={normalizar(atual.titulo) || "—"} />
            </span>
          </label>

          <label className="studio-campo">
            <span className="studio-campo-rotulo">Resumo</span>
            <textarea
              value={atual.resumo}
              disabled={!editavelAgora}
              rows={3}
              onChange={(e) => studio.alterar({ resumo: e.target.value })}
              className="studio-campo-entrada"
              placeholder="O que acontece, para quem, por quê."
            />
            <span className="studio-campo-nota">
              Texto puro. Nenhuma marcação atravessa a fronteira do gerador.
            </span>
          </label>

          <EscolhaDeTermos
            titulo="Linguagens"
            termos={catalogo.linguagens}
            escolhidos={atual.linguagens}
            editavel={editavelAgora}
            aoAlternar={(id) => alternarTermo("linguagens", id)}
            aoPropor={proporTermo}
          />

          <EscolhaDeTermos
            titulo="Temas"
            termos={catalogo.temas}
            escolhidos={atual.temas}
            editavel={editavelAgora}
            aoAlternar={(id) => alternarTermo("temas", id)}
            aoPropor={proporTermo}
          />

          {atual.termosPropostos.length > 0 ? (
            <p className="studio-porta" data-porta="editor">
              <span className="studio-porta-estado">{PORTAS.editor.estado}</span>
              <span>
                {atual.termosPropostos.join(", ")} — vai para {PORTAS.editor.nivel}.{" "}
                {PORTAS.editor.saida}.
              </span>
            </p>
          ) : null}

          <EscolhaDeImagem
            imagens={catalogo.imagens}
            escolhida={atual.imagem}
            credito={atual.creditoImagem}
            editavel={editavelAgora}
            aoEscolher={escolherImagem}
          />

          {/* ---- o carimbo: exibido, nunca editável ---- */}
          <section className="studio-carimbo" aria-label="Carimbo do sistema">
            <h2 className="web-painel-titulo">Carimbo do sistema</h2>
            <dl className="studio-carimbo-lista">
              <dt>procedência</dt>
              <dd>
                <Literal valor={atual.procedencia} />
              </dd>
              <dt>agente realizador</dt>
              <dd>{atual.fonte}</dd>
              <dt>autor</dt>
              <dd>{atual.autor}</dd>
            </dl>
            <p className="studio-campo-nota">{FRASE_DA_PROCEDENCIA}</p>
            <p className="studio-campo-nota">{produtorEAutorado}</p>
          </section>
        </form>

        {/* =============== coluna da direita: o que está vivo =============== */}
        <aside className="web-colada studio-vivo">
          {/* ---- a chave de identidade, ao vivo ---- */}
          <section className="web-painel">
            <h2 className="web-painel-titulo">Chave de identidade</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{sustentados} de 3</strong> componentes
              sustentados
            </p>
            <ul className="web-lista-densa">
              {componentes.map((c) => {
                const noAcervo = componentesNoAcervo.find((x) => x.campo === c.campo);
                return (
                  <li
                    key={c.campo}
                    className="studio-componente"
                    data-sustentado={c.sustentado ? "sim" : "nao"}
                  >
                    <span className="studio-componente-marca" aria-hidden>
                      {c.sustentado ? "•" : "○"}
                    </span>
                    <span className="studio-componente-corpo">
                      <span className="studio-componente-rotulo">{c.rotulo}</span>
                      <Literal valor={c.valor || "não preenchido"} />
                      {noAcervo && !noAcervo.sustentado ? (
                        <span className="studio-campo-nota">
                          o acervo não sustenta este componente em nenhum dos 300 eventos
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="studio-campo-nota">
              chave: <Literal valor={atual.chaveIdentidade} />
            </p>
          </section>

          {/* ---- o aviso de duplicata, ANTES de salvar ---- */}
          {duplicatas.length > 0 ? (
            <section className="web-painel studio-alerta" data-aviso-duplicata={duplicatas.length}>
              <h2 className="web-painel-titulo">
                Possível duplicata —{" "}
                {duplicatas.length === 1 ? "1 evento casa" : `${duplicatas.length} eventos casam`}
              </h2>
              <ul className="web-lista-densa">
                {duplicatas.map((d) => (
                  <li key={d.slug}>
                    <a
                      href={`/evento/${d.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="studio-vinculo"
                    >
                      {d.titulo} ↗
                    </a>
                  </li>
                ))}
              </ul>
              <p className="studio-campo-nota">{criterioDeIdentidade}</p>
            </section>
          ) : null}

          {/* ---- score, com o que falta NOMEADO ---- */}
          <section className="web-painel" data-score={score.score}>
            <h2 className="web-painel-titulo">Qualidade do registro</h2>
            <p className="studio-chave-conta">
              <strong className="studio-chave-numero">{score.score}%</strong>
            </p>
            <div className="studio-barra" aria-hidden>
              <div className="studio-barra-cheia" style={{ inlineSize: `${score.score}%` }} />
            </div>
            {score.faltando.length === 0 ? (
              <p className="studio-campo-nota">
                Os doze campos que o score mede estão preenchidos.
              </p>
            ) : (
              <ul className="web-lista-densa">
                {score.itens
                  .filter((i) => !i.ok)
                  .map((i) => (
                    <li key={i.chave} className="studio-falta" data-obrigatorio={i.obrigatorio}>
                      <span className="studio-falta-rotulo">{i.rotulo}</span>
                      {i.obrigatorio ? (
                        <span className="studio-falta-marca">impede o envio</span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* ---- validação ao vivo ---- */}
          {problemas.length > 0 ? (
            <section className="studio-nao-sustenta" data-problemas={problemas.length}>
              <span className="studio-nao-sustenta-rotulo">Antes de seguir</span>
              <ul className="web-lista-densa">
                {problemas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ---- o denominador que explica por que esta tela existe ---- */}
          <section className="studio-nao-sustenta">
            <span className="studio-nao-sustenta-rotulo">O que o acervo mede hoje</span>
            <ul className="web-denominadores">
              <li className="web-denominador">
                <span className="web-denominador-numero">1 de 3</span>
                <span className="web-denominador-rotulo">componentes da chave</span>
              </li>
              <li className="web-denominador">
                <span className="web-denominador-numero">
                  {comSeparador(catalogo.eventos.length)}
                </span>
                <span className="web-denominador-rotulo">eventos comparados ao vivo</span>
              </li>
            </ul>
            <p>
              Agente realizador e obra estão vazios em {comSeparador(catalogo.eventos.length)} de{" "}
              {comSeparador(catalogo.eventos.length)} eventos. É o produtor quem preenche os
              outros dois terços, e é isso que tira a deduplicação da parecença de texto.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function SeletorDeRegistro({
  rascunhos,
  atual,
  aoEscolher,
  aoCriar,
  aoReiniciar,
  situacaoEAutorada,
}: {
  rascunhos: RascunhoDoProdutor[];
  atual: RascunhoDoProdutor;
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
  aoReiniciar: () => void;
  situacaoEAutorada: string;
}) {
  return (
    <section className="studio-seletor">
      <label className="studio-seletor-campo">
        <span className="studio-rotulo">Registro em edição</span>
        <select
          value={atual.id}
          onChange={(e) => aoEscolher(e.target.value)}
          className="studio-campo-entrada"
        >
          {rascunhos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.titulo.trim() === "" ? "(sem título)" : r.titulo} · {ROTULO_DA_SITUACAO[r.situacao]}
            </option>
          ))}
        </select>
      </label>
      <div className="studio-acoes">
        <button type="button" className="studio-botao studio-botao-primario" onClick={aoCriar}>
          Novo evento
        </button>
        <button type="button" className="studio-botao" onClick={aoReiniciar}>
          Reiniciar demonstração
        </button>
      </div>
      <p className="studio-campo-nota">{situacaoEAutorada}</p>
    </section>
  );
}

function EscolhaDeTermos({
  titulo,
  termos,
  escolhidos,
  editavel,
  aoAlternar,
  aoPropor,
}: {
  titulo: string;
  termos: TermoDoCatalogo[];
  escolhidos: string[];
  editavel: boolean;
  aoAlternar: (id: string) => void;
  aoPropor: (texto: string) => void;
}) {
  const [todos, definirTodos] = useState(false);

  // Os escolhidos primeiro, e o resto em ordem do vocabulário: com 94 temas, uma lista que
  // não trouxesse o que já está marcado para cima faria o produtor perder a própria escolha.
  const ordenados = useMemo(() => {
    const marcados = termos.filter((t) => escolhidos.includes(t.id));
    const resto = termos.filter((t) => !escolhidos.includes(t.id));
    return [...marcados, ...resto];
  }, [termos, escolhidos]);

  // A LISTA CURTA DIZ QUE É CURTA. 94 temas numa parede de pílulas não se lê, mas cortar em
  // silêncio é pior: quem procura um termo que existe e não aparece conclui que ele não
  // existe, e propõe um duplicado pela porta do Editor.
  const visiveis = todos ? ordenados : ordenados.slice(0, LIMITE_DE_PILULAS);
  const ocultos = ordenados.length - visiveis.length;

  return (
    <fieldset className="studio-campo" disabled={!editavel}>
      <legend className="studio-campo-rotulo">{titulo}</legend>
      <div className="studio-pilulas">
        {visiveis.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={escolhidos.includes(t.id)}
            onClick={() => aoAlternar(t.id)}
            className="studio-pilula"
            /* A cor da linguagem vem DO DADO — `cor` guarda o nome do token, nunca o hex. */
            style={t.cor ? ({ "--pilula-cor": `var(${t.cor})` } as React.CSSProperties) : undefined}
          >
            {t.rotulo}
          </button>
        ))}
      </div>
      {ocultos > 0 || todos ? (
        <p className="studio-campo-nota">
          {ocultos > 0
            ? `Mostrando ${visiveis.length} de ${ordenados.length}.`
            : `Mostrando os ${ordenados.length}.`}{" "}
          <button
            type="button"
            className="studio-vinculo studio-vinculo-botao"
            onClick={() => definirTodos((x) => !x)}
          >
            {todos ? "mostrar menos" : `mostrar os outros ${ocultos}`}
          </button>
        </p>
      ) : null}
      <label className="studio-campo-nota">
        Não está na lista?{" "}
        <input
          type="text"
          className="studio-campo-entrada studio-campo-entrada-curta"
          placeholder="propor termo"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            aoPropor(e.currentTarget.value);
            e.currentTarget.value = "";
          }}
        />{" "}
        Termo fora do vocabulário vira proposta ao Editor e não bloqueia nada.
      </label>
    </fieldset>
  );
}

function EscolhaDeImagem({
  imagens,
  escolhida,
  credito,
  editavel,
  aoEscolher,
}: {
  imagens: ImagemDoCatalogo[];
  escolhida: string | null;
  credito: string | null;
  editavel: boolean;
  aoEscolher: (img: ImagemDoCatalogo | null) => void;
}) {
  const atual = imagens.find((i) => i.caminho === escolhida) ?? null;

  return (
    <fieldset className="studio-campo" disabled={!editavel}>
      <legend className="studio-campo-rotulo">Imagem</legend>
      {/* NÃO HÁ UPLOAD, e a tela diz isso em vez de simular um. As imagens vêm do acervo e
          trazem o crédito que o acervo publica — é o que torna a obrigatoriedade do crédito
          demonstrável sem inventar um autor. */}
      <p className="studio-campo-nota">
        Não há envio de arquivo nesta demonstração. As {imagens.length} imagens abaixo vêm do
        acervo, cada uma com o crédito que o acervo publica.
      </p>
      <div className="studio-imagens">
        <button
          type="button"
          aria-pressed={escolhida === null}
          onClick={() => aoEscolher(null)}
          className="studio-imagem studio-imagem-vazia"
        >
          sem imagem
        </button>
        {imagens.map((img) => (
          <button
            key={img.caminho}
            type="button"
            aria-pressed={escolhida === img.caminho}
            onClick={() => aoEscolher(img)}
            className="studio-imagem"
            title={img.de}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.caminho} alt="" className="studio-imagem-figura" />
          </button>
        ))}
      </div>
      {atual !== null ? (
        <p className="studio-campo-nota">
          <strong>crédito:</strong> {credito ?? "—"} · <strong>de:</strong> {atual.de}
        </p>
      ) : (
        <p className="studio-campo-nota">
          Nenhuma imagem escolhida. Imagem sem crédito não entra no acervo, então o crédito
          vem junto com a escolha.
        </p>
      )}
    </fieldset>
  );
}
