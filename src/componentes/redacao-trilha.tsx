"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  CandidatoDoCatalogo,
  CatalogoDeArrasto,
  PassoDoEditor,
  SugestaoDeProximoPasso,
  TrilhaDoEditor,
} from "@/dados/redacao";

/**
 * redacao-trilha.tsx — o editor de trilha curada (tela 35, D-85 e D-86).
 *
 * A REGRA DURA DESTA TELA É UMA SÓ: **passo sem motivo não publica.** O motivo por passo
 * não é nota interna — é o texto que vira o SELO VISÍVEL AO PÚBLICO em Descobrir. Uma
 * trilha publicada com um passo sem motivo entrega ao leitor uma ponte sem explicação, que
 * é exatamente o recomendador opaco que a proposta inteira recusa. Por isso a obrigação
 * mora na interação e não numa validação de servidor que ninguém vê: o botão de publicar
 * fica de fato `disabled`, `publicar()` recusa por conta própria, e a tela NOMEIA qual
 * passo está sem motivo — «não é publicável» sem dizer onde é um beco, e esta é a fase que
 * decidiu não ter becos.
 *
 * AS DUAS PONTAS CONCORDAM POR CONSTRUÇÃO, NÃO POR DISCIPLINA. O campo de motivo de cada
 * passo do acervo carrega o MESMO `PassoTrilha.motivo` que `/trilha/[slug]/` imprime no
 * selo público — ele veio de `passosParaEditor`, que é construído sobre `passosDaTrilha` de
 * `trilha.ts`. Não há cópia, não há reformatação, não há prefixo. Se houvesse, os dois
 * textos divergiriam na primeira edição de um deles e ninguém perceberia; 05-08 compara os
 * dois caractere a caractere justamente porque essa divergência é silenciosa.
 *
 * AS TRÊS REGRAS DE PUBLICABILIDADE DA FASE 2 NÃO SÃO REESCRITAS AQUI. Cadeia vazia, cadeia
 * que não termina em evento e evento sem sessão datada chegam resolvidas em
 * `trilha.publicavelNoAcervo`, de `trilhaEhPublicavel`. Esta tela soma a QUARTA — motivo em
 * branco —, que é a única que o editor pode criar, porque é a única que depende do que o
 * curador acabou de fazer.
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo. O rascunho vive em
 * `localStorage` sob `CHAVE_DO_RASCUNHO`, chave nova do espaço `agenda-cultural:`;
 * `src/contexto/sessao.tsx` é compartilhado e não é tocado por este arquivo.
 */

/** A chave do rascunho. Nova, no espaço `agenda-cultural:`, e declarada NA TELA. */
export const CHAVE_DO_RASCUNHO = "agenda-cultural:rascunho-trilha";

/** Um passo acrescentado pelo curador: sem aresta no grafo, e a tela diz isso. */
interface PassoDoRascunho {
  chave: string;
  motivo: string;
}

/**
 * Lê o rascunho do `localStorage`. T-05-17: o valor é editável pelo avaliador e não é
 * confiável. Qualquer coisa que não seja uma lista de `{chave, motivo}` devolve rascunho
 * VAZIO — o editor volta à trilha do acervo em vez de quebrar. É o molde de `lerLista` de
 * `sessao.tsx`, aplicado ao formato deste plano.
 */
function lerRascunho(): PassoDoRascunho[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_DO_RASCUNHO);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter(
      (v): v is PassoDoRascunho =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as PassoDoRascunho).chave === "string" &&
        typeof (v as PassoDoRascunho).motivo === "string",
    );
  } catch {
    return [];
  }
}

function gravarRascunho(passos: PassoDoEditor[]) {
  try {
    window.localStorage.setItem(
      CHAVE_DO_RASCUNHO,
      JSON.stringify(passos.map((p) => ({ chave: p.chave, motivo: p.motivo }))),
    );
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

const ROTULO_ORIGEM_MOTIVO: Record<PassoDoEditor["origemMotivo"], string> = {
  escrito: "motivo escrito na ligação do acervo",
  composto: "motivo composto a partir da relação",
  "sem-aresta": "não há aresta entre os dois nós",
};

// ---------------------------------------------------------------------------

export function RedacaoTrilha({
  trilha,
  catalogo,
  sugestao,
  limites,
  curador,
  carimbo,
  dataDeReferencia,
  regraDoMotivoObrigatorio,
  regraDaSugestao,
}: {
  trilha: TrilhaDoEditor;
  catalogo: CatalogoDeArrasto;
  /** `null` quando a travessia não acha vizinho novo. A tela diz isso em vez de sumir. */
  sugestao: SugestaoDeProximoPasso | null;
  limites: readonly string[];
  curador: string;
  carimbo: string;
  dataDeReferencia: string;
  regraDoMotivoObrigatorio: string;
  regraDaSugestao: string;
}) {
  /**
   * O estado inicial é o do ACERVO, e não o do storage: sob `output: "export"` o HTML é
   * gerado no build, e ler `localStorage` na primeira renderização divergiria da
   * hidratação. A leitura mora no efeito abaixo, que só roda no cliente.
   */
  const [passos, setPassos] = useState<PassoDoEditor[]>(trilha.passos);
  const [sugestaoDescartada, setSugestaoDescartada] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [agendamento, setAgendamento] = useState(dataDeReferencia);
  const [publicacao, setPublicacao] = useState<{
    quem: string;
    quando: string;
    agendadaPara: string;
    passos: number;
  } | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);

  useEffect(() => {
    const rascunho = lerRascunho();
    if (!rascunho.length) return;
    // O rascunho guarda motivo por chave, e NÃO a lista de passos inteira: um rascunho
    // adulterado não pode inventar um passo que o acervo não tem, e um passo acrescentado
    // que sumiu do rascunho volta a não existir em vez de aparecer sem `de`/`para`.
    const porChave = new Map(rascunho.map((r) => [r.chave, r.motivo]));
    setPassos((antes) =>
      antes.map((p) => (porChave.has(p.chave) ? { ...p, motivo: porChave.get(p.chave) as string } : p)),
    );
  }, []);

  // -------------------------------------------------------------------------
  // A publicabilidade — as três do acervo mais a quarta, que é de D-85
  // -------------------------------------------------------------------------

  const semMotivo = useMemo(
    () => passos.filter((p) => !p.motivo.trim()),
    [passos],
  );

  const publicavel = trilha.publicavelNoAcervo && semMotivo.length === 0;

  /**
   * A SEGUNDA TRAVA. `disabled` cobre o clique do mouse; `Enter` sobre o formulário,
   * `form.submit()` e qualquer chamada por outro caminho não passam por ele. Esta função
   * recusa por conta própria, e é ela — não o atributo — que garante que uma trilha com
   * passo sem motivo não publique.
   */
  const publicar = () => {
    if (!publicavel) return;
    setPublicacao({
      quem: assinatura.trim() || curador,
      quando: carimbo,
      agendadaPara: agendamento,
      passos: passos.length,
    });
  };

  const alterarMotivo = (chave: string, texto: string) => {
    setPassos((antes) => {
      const proximo = antes.map((p) => (p.chave === chave ? { ...p, motivo: texto } : p));
      gravarRascunho(proximo);
      return proximo;
    });
  };

  /**
   * Acrescentar um candidato como PRÓXIMO passo.
   *
   * O passo nasce com motivo VAZIO de propósito — é a demonstração de D-85: o editor não
   * escreve o motivo por ninguém, nem sugere um texto de preenchimento. Enquanto ele
   * estiver vazio a trilha inteira deixa de publicar, e a tela diz qual passo é.
   */
  const acrescentar = (candidato: CandidatoDoCatalogo) => {
    setPassos((antes) => {
      const ultimo = antes[antes.length - 1];
      if (!ultimo) return antes;
      if (antes.some((p) => p.paraId === candidato.id)) return antes;
      const passo: PassoDoEditor = {
        chave: `passo:novo:${ultimo.paraId}->${candidato.id}`,
        ordem: antes.length + 1,
        deId: ultimo.paraId,
        deTitulo: ultimo.paraTitulo,
        deClasse: ultimo.paraClasse,
        paraId: candidato.id,
        paraTitulo: candidato.titulo,
        paraClasse: candidato.classe,
        relacao: null,
        motivo: "",
        origemMotivo: "sem-aresta",
        procedenciaAresta: null,
        doAcervo: false,
      };
      const proximo = [...antes, passo];
      gravarRascunho(proximo);
      return proximo;
    });
  };

  const remover = (chave: string) =>
    setPassos((antes) => {
      const proximo = antes
        .filter((p) => p.chave !== chave)
        .map((p, i) => ({ ...p, ordem: i + 1 }));
      gravarRascunho(proximo);
      return proximo;
    });

  const candidatos = useMemo(() => {
    const alvo = filtro.trim().toLowerCase();
    const jaNaTrilha = new Set(passos.map((p) => p.paraId));
    return catalogo.itens
      .filter((c) => !jaNaTrilha.has(c.id))
      .filter((c) => !alvo || c.titulo.toLowerCase().includes(alvo));
  }, [catalogo.itens, filtro, passos]);

  return (
    <div className="studio redacao redacao-editor" data-slug-trilha={trilha.slug}>
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho                                                           */}
      {/* ------------------------------------------------------------------ */}
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · editor de trilha curada</span>
        <h1 className="studio-titulo">{trilha.titulo}</h1>
        <p className="studio-objetivo">
          O motivo de cada passo é campo obrigatório — é ele que vira o selo visível ao
          público em Descobrir. Uma trilha com passo sem motivo não publica.
        </p>
        <div className="redacao-escopos">
          <span
            className="studio-pastilha"
            // A chave do rascunho é DECLARADA na tela: o avaliador pode abrir o
            // `localStorage`, ver o que guardamos e apagar. Estado escondido num
            // protótipo que se propõe auditável seria contradição.
            data-chave-rascunho={CHAVE_DO_RASCUNHO}
          >
            rascunho local em <code className="studio-literal">{CHAVE_DO_RASCUNHO}</code>
          </span>
          <Link href={`/trilha/${trilha.slug}/`} className="studio-pastilha">
            abrir a trilha pública ↗
          </Link>
        </div>
      </header>

      <div className="redacao-colunas redacao-colunas-editor">
        {/* ---------------------------------------------------------------- */}
        {/* O catálogo de arrasto                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="web-painel redacao-coluna-fila">
          <h2 className="web-painel-titulo">o acervo, como fonte de arrasto</h2>

          <p className="studio-nota">
            <strong>
              {catalogo.itens.length.toLocaleString("pt-BR")} de{" "}
              {catalogo.total.toLocaleString("pt-BR")}
            </strong>{" "}
            entidades, de qualquer classe. {catalogo.elegiveis.toLocaleString("pt-BR")}{" "}
            passam na regra do recorte; destas, o catálogo traz{" "}
            {catalogo.itens.length.toLocaleString("pt-BR")}.
          </p>

          <div className="redacao-campo">
            <label htmlFor="filtro-catalogo" className="studio-rotulo">
              filtrar candidatos
            </label>
            <input
              id="filtro-catalogo"
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
                data-candidato-catalogo={c.id}
                // Os DOIS caminhos, e não um. O arrasto nativo é o gesto da tela 35; o
                // botão é o caminho que um gate consegue dirigir e que o teclado alcança.
                // Uma interação que ninguém consegue dirigir é uma interação que ninguém
                // prova — e o RFP vai ver a tela ao vivo.
                draggable
                onDragStart={(e) => {
                  setArrastando(c.id);
                  e.dataTransfer.setData("text/plain", c.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onDragEnd={() => setArrastando(null)}
                data-arrastando={arrastando === c.id ? "sim" : "nao"}
              >
                <span className="redacao-candidato-texto">
                  <span className="redacao-classe">{c.classe}</span>
                  <span className="web-linha-titulo">{c.titulo}</span>
                </span>
                <button
                  type="button"
                  className="studio-botao redacao-acrescentar"
                  onClick={() => acrescentar(c)}
                >
                  acrescentar
                </button>
              </li>
            ))}
          </ul>

          <div className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">o recorte, declarado</span>
            <p>{catalogo.regra}</p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Os passos                                                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          {/* ---- D-85: o bloco de publicabilidade, que NOMEIA o passo ---- */}
          <section
            className="web-painel redacao-publicabilidade"
            data-publicavel={publicavel ? "sim" : "nao"}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">
                {publicavel ? "Pronta para publicar" : "Esta trilha não publica"}
              </span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{passos.length}</span>
                passo(s)
              </span>
            </div>

            {trilha.publicavelNoAcervo ? null : (
              <p className="studio-nota">{trilha.motivoNaoPublicavelNoAcervo}</p>
            )}

            {semMotivo.length ? (
              <ul className="redacao-pendencias">
                {semMotivo.map((p) => (
                  <li key={p.chave}>
                    <strong>Passo {p.ordem}</strong> — «{p.deTitulo}» → «{p.paraTitulo}»
                    está sem motivo. Sem ele, o selo que o público veria em Descobrir sairia
                    em branco, e a trilha inteira não publica.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Todos os {passos.length} passos têm motivo escrito. É esse texto, e não
                outro, que aparece ao público no selo de cada passo.
              </p>
            )}

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
                data-publicar
                disabled={!publicavel}
              >
                Publicar trilha
              </button>
              {!publicavel ? (
                <span className="redacao-aviso-veto">
                  O botão está desabilitado enquanto houver passo sem motivo.
                </span>
              ) : null}
            </form>

            <p className="studio-nota">{regraDoMotivoObrigatorio}</p>

            {/* ---- Assinatura e agendamento, com autoria e carimbo ---- */}
            <div className="redacao-assinatura">
              <div className="redacao-campo">
                <label htmlFor="assinatura-curador" className="studio-rotulo">
                  assinatura da curadoria
                </label>
                <input
                  id="assinatura-curador"
                  className="redacao-textarea"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                />
              </div>
              <div className="redacao-campo">
                <label htmlFor="agendamento" className="studio-rotulo">
                  agendar publicação para
                </label>
                <input
                  id="agendamento"
                  type="date"
                  className="redacao-textarea"
                  value={agendamento}
                  onChange={(e) => setAgendamento(e.target.value)}
                />
              </div>
            </div>

            {publicacao ? (
              <div className="redacao-decisao" data-decisao-redacao={trilha.slug}>
                <span className="redacao-decisao-cabeca">
                  <strong>publicada</strong>
                  <span className="studio-pastilha">{publicacao.passos} passos</span>
                </span>
                <span className="redacao-decisao-assinatura">
                  {publicacao.quem} · {publicacao.quando} · agendada para{" "}
                  {publicacao.agendadaPara}
                </span>
              </div>
            ) : null}
          </section>

          {/* ---- Os passos, com o motivo obrigatório ---- */}
          <section
            className="web-painel redacao-passos"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              const c = catalogo.itens.find((x) => x.id === id);
              if (c) acrescentar(c);
              setArrastando(null);
            }}
          >
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Os passos</span>
              <span className="studio-rotulo">
                arraste um candidato para cá, ou use «acrescentar»
              </span>
            </div>

            <ol className="redacao-lista-passos">
              {passos.map((p) => (
                <li
                  key={p.chave}
                  className="redacao-passo"
                  data-passo-trilha={p.ordem}
                  data-do-acervo={p.doAcervo ? "sim" : "nao"}
                >
                  <div className="redacao-passo-cabeca">
                    <span className="studio-rotulo">
                      passo {p.ordem} de {passos.length}
                    </span>
                    {p.doAcervo ? null : (
                      <button
                        type="button"
                        className="studio-botao redacao-desfazer"
                        onClick={() => remover(p.chave)}
                      >
                        remover
                      </button>
                    )}
                  </div>

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

                  <div className="redacao-campo">
                    <label htmlFor={`motivo-${p.chave}`} className="studio-rotulo">
                      motivo — obrigatório, e é ele que vira o selo público
                    </label>
                    <textarea
                      id={`motivo-${p.chave}`}
                      // O ATRIBUTO CARREGA O MESMO TEXTO QUE O CAMPO. É assim que
                      // 05-08 compara este valor com o selo de `/trilha/[slug]/`
                      // caractere a caractere, pelos dois caminhos — atributo e texto —
                      // sem depender de o gate saber ler `value` de um campo controlado.
                      data-motivo-passo={p.motivo}
                      className="redacao-textarea redacao-motivo"
                      data-vazio={p.motivo.trim() ? "nao" : "sim"}
                      rows={2}
                      value={p.motivo}
                      placeholder="Sem este texto a trilha não publica."
                      onChange={(e) => alterarMotivo(p.chave, e.target.value)}
                    />
                  </div>

                  <p className="studio-nota redacao-passo-procedencia">
                    {p.relacao ? `relação «${p.relacao}» · ` : ""}
                    {ROTULO_ORIGEM_MOTIVO[p.origemMotivo]}
                    {p.procedenciaAresta ? ` · procedência ${p.procedenciaAresta}` : ""}
                    {p.doAcervo
                      ? ""
                      : " · passo acrescentado agora: nenhuma ligação do acervo liga estes dois nós, e o motivo é texto da curadoria"}
                  </p>
                </li>
              ))}
            </ol>

          </section>

          {/* ---- D-86: a sugestão da IA, sempre descartável ---- */}
          {sugestao && !sugestaoDescartada ? (
            <section className="web-painel redacao-sugestao-ia" data-sugestao-ia={sugestao.entidadeId}>
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">A IA sugere o próximo passo</span>
                <span className="studio-pastilha studio-pastilha-marca">sugestão</span>
              </div>

              <div className="redacao-passo-nos">
                <span className="redacao-no">
                  <span className="redacao-classe">último passo</span>
                  <strong>{sugestao.aPartirDeTitulo}</strong>
                </span>
                <span aria-hidden className="redacao-seta">
                  →
                </span>
                <span className="redacao-no">
                  <span className="redacao-classe">{sugestao.classe}</span>
                  <strong>{sugestao.titulo}</strong>
                </span>
              </div>

              <p className="selo-motivo">
                <span>{sugestao.motivo}</span>
              </p>

              <p className="studio-nota">
                Relação «{sugestao.relacao}», procedência {sugestao.procedenciaAresta}. {""}
                {regraDaSugestao}
              </p>

              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao"
                  onClick={() =>
                    acrescentar({
                      id: sugestao.entidadeId,
                      titulo: sugestao.titulo,
                      classe: sugestao.classe,
                    })
                  }
                >
                  acrescentar como passo — e escrever o motivo
                </button>
                <button
                  type="button"
                  className="studio-botao"
                  data-descartar-sugestao={sugestao.entidadeId}
                  onClick={() => setSugestaoDescartada(true)}
                >
                  descartar sugestão
                </button>
              </div>

              <p className="studio-nota">
                Aceitar a sugestão acrescenta o passo <strong>com motivo vazio</strong>: a
                IA propõe o nó, nunca a explicação. Descartar não altera a trilha.
              </p>
            </section>
          ) : (
            <section className="web-painel">
              <p className="studio-nota">
                {sugestao
                  ? "A sugestão foi descartada. A trilha não mudou — descartar não é uma edição, e nenhuma sugestão entra sem um clique."
                  : "A travessia a partir do último nó não achou vizinho fora da trilha. A tela diz isso em vez de esconder o bloco."}
              </p>
            </section>
          )}

          {/* ---- A prévia: o MESMO motivo, na moldura do público ---- */}
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Como o público vai ver</span>
              <span className="studio-rotulo">prévia — o mesmo texto, na moldura do app</span>
            </div>
            <div className="redacao-previa">
              {passos.map((p) => (
                <div key={p.chave} className="redacao-previa-passo">
                  <span className="studio-rotulo">
                    passo {p.ordem} · {p.deTitulo} → {p.paraTitulo}
                  </span>
                  {p.motivo.trim() ? (
                    <p className="selo-motivo">
                      <span>{p.motivo}</span>
                    </p>
                  ) : (
                    <p className="selo-motivo redacao-selo-vazio" data-nao-sustenta>
                      <span>
                        selo em branco — é isto que o público veria, e é por isso que a
                        trilha não publica assim
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="studio-nota">
              Não é uma segunda tela: é o mesmo campo `motivo` que o editor acima edita,
              renderizado com a classe `selo-motivo` que `/trilha/[slug]/` usa. A prévia não
              pode divergir do público porque as duas leem a mesma string.
            </p>
            <Link href={`/trilha/${trilha.slug}/`} className="studio-botao">
              abrir a trilha pública de verdade ↗
            </Link>
          </section>
        </div>
      </div>

      {/* ================================================================== */}
      {/* D-86 — OS TRÊS LIMITES                                              */}
      {/* ================================================================== */}
      <footer className="redacao-limites" data-limites-ia>
        <span className="studio-nao-sustenta-rotulo">onde a IA não é utilizada</span>
        <ul>
          {limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
