"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAVE_DO_TESAURO,
  lerMudancasDeTesauro,
  registrarMudancaDeTesauro,
} from "@/dados/redacao-registro";
import type { MudancaDeTesauro, TipoDeMudanca } from "@/dados/redacao-registro";
import type { ItemDoVocabulario, Tesauro } from "@/dados/redacao";

/**
 * redacao-tesauro.tsx — a camada 0 da ontologia (E4).
 *
 * POR QUE ELA É A TELA MAIS PERIGOSA DA REDAÇÃO. As outras escrevem afirmações novas; esta
 * mexe no vocabulário que TODAS as outras usam para classificar. Fundir dois termos não
 * altera dois registros — altera todos os vínculos que apontavam para o que sumiu, e o
 * número disso não é evidente por olhar. Por isso o alcance é contado ANTES de a fusão ser
 * oferecida, e não depois de ela ser feita.
 *
 * QUEM PROMOVE NÃO APROVA. A promoção sai daqui como PROPOSTA assinada e entra na fila da
 * governança — quem aprova é o Admin. Sem essa separação, o administrador decidiria o que é
 * uma linguagem da cultura brasileira a partir de uma tela feita para governar o sistema. O
 * campo `aprovadaPor` fica declarado e vazio no registro, em vez de ausente: campo ausente
 * seria lido como «não precisa de aprovação».
 *
 * A COR É DADO. A mesma cor da linguagem aparece no cartão, no mapa e no indicador — é por
 * ela que quem lê reconhece a linguagem antes de ler o rótulo. Promover sem cor deixaria
 * três superfícies sem saber o que pintar, e a escolha é entre as SETE do manual porque uma
 * cor inventada aqui não teria token (D-06).
 *
 * DP-F: `"use client"`, e `@/dados/redacao` entra só por tipo.
 */

const ROTULO_DO_TIPO: Record<TipoDeMudanca, string> = {
  promocao: "promover ao vocabulário",
  fusao: "fundir em outro termo",
  sinonimia: "declarar sinônimo de",
  hierarquia: "declarar filho de",
};

/** O que cada operação exige. É por isto que o botão libera ou não. */
const PRECISA_DE_DESTINO: Record<TipoDeMudanca, boolean> = {
  promocao: false,
  fusao: true,
  sinonimia: true,
  hierarquia: true,
};

type Classe = "linguagens" | "temas" | "termos";

const ROTULO_DA_CLASSE: Record<Classe, string> = {
  linguagens: "linguagens",
  temas: "temas",
  termos: "termos",
};

export function RedacaoTesauro({
  tesauro,
  curador,
  carimbo,
  regraDasPromovidas,
  regraDaCor,
  separacaoDaAprovacao,
}: {
  tesauro: Tesauro;
  curador: string;
  carimbo: string;
  regraDasPromovidas: string;
  regraDaCor: string;
  separacaoDaAprovacao: string;
}) {
  const [classe, setClasse] = useState<Classe>("linguagens");
  const [filtro, setFiltro] = useState("");
  const [alvo, setAlvo] = useState<ItemDoVocabulario | null>(null);
  const [destino, setDestino] = useState<ItemDoVocabulario | null>(null);
  const [tipo, setTipo] = useState<TipoDeMudanca>("promocao");
  const [cor, setCor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [assinatura, setAssinatura] = useState(curador);
  const [confirmando, setConfirmando] = useState(false);
  const [mudancas, setMudancas] = useState<MudancaDeTesauro[]>([]);
  const [persistiu, setPersistiu] = useState(true);

  useEffect(() => {
    const guardadas = lerMudancasDeTesauro();
    if (guardadas.length) setMudancas(guardadas);
  }, []);

  const lista = useMemo(() => {
    const alvoTexto = filtro.trim().toLowerCase();
    return tesauro[classe].filter(
      (i) => !alvoTexto || i.rotulo.toLowerCase().includes(alvoTexto),
    );
  }, [tesauro, classe, filtro]);

  const precisaDeCor = tipo === "promocao" && classe === "linguagens";
  const precisaDeDestino = PRECISA_DE_DESTINO[tipo];

  const faltando = useMemo(() => {
    const f: string[] = [];
    if (!alvo) f.push("o termo a mudar");
    if (precisaDeDestino && !destino) f.push("o termo de destino");
    if (precisaDeCor && !cor) f.push("a cor do manual");
    if (!motivo.trim()) f.push("o motivo");
    if (!assinatura.trim()) f.push("a assinatura");
    return f;
  }, [alvo, destino, cor, motivo, assinatura, precisaDeCor, precisaDeDestino]);

  const podePropor = faltando.length === 0;

  /**
   * PROPOR É IRREVERSÍVEL DO PONTO DE VISTA DE QUEM LÊ DO OUTRO LADO: a proposta entra na
   * fila da governança com o alcance congelado. Por isso a fusão — a única que apaga um
   * termo do vocabulário — pede confirmação nomeada, com o número à vista. A confirmação é
   * da própria tela, e o texto do botão diz o que vai acontecer.
   */
  const propor = () => {
    if (!podePropor || !alvo) return;
    if (tipo === "fusao" && !confirmando) {
      setConfirmando(true);
      return;
    }
    const nova: MudancaDeTesauro = {
      tipo,
      alvoId: alvo.id,
      alvoRotulo: alvo.rotulo,
      destinoId: destino?.id ?? null,
      destinoRotulo: destino?.rotulo ?? null,
      cor: precisaDeCor ? cor : null,
      motivo: motivo.trim(),
      alcance: alvo.alcance,
      assinatura: assinatura.trim(),
      carimbo,
      aprovadaPor: null,
    };
    const proximo = [nova, ...mudancas];
    setMudancas(proximo);
    setPersistiu(registrarMudancaDeTesauro(nova));
    setMotivo("");
    setDestino(null);
    setConfirmando(false);
  };

  const promovidas = tesauro.linguagens.filter((l) => l.promovida);

  return (
    <div className="studio redacao redacao-tesauro">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Redação · tesauro</span>
        <h1 className="studio-titulo">A camada 0 da ontologia</h1>
        <p className="studio-objetivo">
          {tesauro.linguagens.length} linguagens, {tesauro.temas.length} temas e{" "}
          {tesauro.termosTotal} termos. É com este vocabulário que todas as outras telas
          classificam — mexer aqui alcança o acervo inteiro.
        </p>
        <div className="redacao-escopos">
          <span className="studio-pastilha" data-chave-tesauro={CHAVE_DO_TESAURO}>
            propostas em <code className="studio-literal">{CHAVE_DO_TESAURO}</code>
          </span>
        </div>
      </header>

      {/* A separação, no topo: ela condiciona tudo o que se faz abaixo. */}
      <section className="web-painel redacao-fronteira" data-separacao-da-aprovacao>
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">Quem promove não aprova</span>
        </div>
        <p className="studio-nota">{separacaoDaAprovacao}</p>
      </section>

      <div className="redacao-colunas redacao-colunas-tesauro">
        {/* -------------------------------------------------------------- */}
        {/* O vocabulário                                                   */}
        {/* -------------------------------------------------------------- */}
        <section className="web-painel redacao-coluna-fila">
          <div className="studio-painel-cabeca">
            <span className="studio-painel-nome">O vocabulário</span>
          </div>

          <div className="studio-acoes redacao-filtros" role="group" aria-label="classe de vocabulário">
            {(Object.keys(ROTULO_DA_CLASSE) as Classe[]).map((c) => (
              <button
                key={c}
                type="button"
                className="studio-botao"
                data-classe-vocabulario={c}
                data-ativo={classe === c ? "sim" : "nao"}
                aria-pressed={classe === c}
                onClick={() => {
                  setClasse(c);
                  setAlvo(null);
                  setDestino(null);
                }}
              >
                {ROTULO_DA_CLASSE[c]} (
                {c === "termos" ? tesauro.termosTotal : tesauro[c].length})
              </button>
            ))}
          </div>

          {classe === "termos" ? (
            <p className="studio-nota" data-recorte-termos={tesauro.termosMostrados}>
              A lista traz <strong>{tesauro.termosMostrados} de {tesauro.termosTotal}</strong>{" "}
              termos, os de maior alcance primeiro — uma fusão errada num termo muito
              conectado é a que mais machuca, e é sobre esses que a decisão precisa estar à
              mão. Os outros existem e não estão nesta lista.
            </p>
          ) : null}

          <div className="redacao-campo">
            <label htmlFor="filtro-vocabulario" className="studio-rotulo">
              filtrar
            </label>
            <input
              id="filtro-vocabulario"
              className="redacao-textarea"
              value={filtro}
              placeholder="parte do rótulo"
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <ul className="web-lista-densa redacao-catalogo">
            {lista.map((i) => (
              <li
                key={i.id}
                className="web-linha redacao-candidato"
                data-item-vocabulario={i.id}
                data-promovida={i.promovida ? "sim" : "nao"}
                data-alcance={i.alcance}
              >
                <span className="redacao-candidato-texto">
                  <span className="redacao-classe">
                    {i.promovida ? "promovida" : ROTULO_DA_CLASSE[classe].slice(0, -1)}
                  </span>
                  <span className="web-linha-titulo">{i.rotulo}</span>
                  <span className="studio-rotulo">
                    {i.alcance.toLocaleString("pt-BR")} vínculo(s) no acervo
                    {i.cor ? ` · cor ${i.cor}` : ""}
                  </span>
                </span>
                <span className="redacao-passo-acoes">
                  <button
                    type="button"
                    className="studio-botao redacao-acrescentar"
                    data-escolher-alvo={i.id}
                    onClick={() => setAlvo(i)}
                  >
                    mudar
                  </button>
                  <button
                    type="button"
                    className="studio-botao"
                    data-escolher-destino={i.id}
                    onClick={() => setDestino(i)}
                    disabled={!precisaDeDestino || alvo?.id === i.id}
                  >
                    destino
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* O que a mudança alcança                                         */}
        {/* -------------------------------------------------------------- */}
        <div className="redacao-coluna-painel">
          <section className="web-painel redacao-mudanca" data-pode-propor={podePropor ? "sim" : "nao"}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">A mudança</span>
              {alvo ? (
                <span className="studio-pastilha studio-pastilha-marca">
                  {alvo.rotulo} · {ROTULO_DO_TIPO[tipo]}
                  {destino ? ` · ${destino.rotulo}` : ""}
                </span>
              ) : null}
            </div>

            <div className="studio-acoes redacao-filtros" role="group" aria-label="tipo de mudança">
              {(Object.keys(ROTULO_DO_TIPO) as TipoDeMudanca[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="studio-botao"
                  data-tipo-mudanca={t}
                  data-ativo={tipo === t ? "sim" : "nao"}
                  aria-pressed={tipo === t}
                  onClick={() => {
                    setTipo(t);
                    setConfirmando(false);
                  }}
                >
                  {ROTULO_DO_TIPO[t]}
                </button>
              ))}
            </div>

            {/* ---- O ALCANCE, contado ANTES de confirmar ---- */}
            {alvo ? (
              <div className="studio-nao-sustenta" data-alcance-da-mudanca={alvo.alcance}>
                <span className="studio-nao-sustenta-rotulo">o que esta mudança alcança</span>
                <p>
                  «{alvo.rotulo}» tem{" "}
                  <strong>{alvo.alcance.toLocaleString("pt-BR")} vínculo(s)</strong> no
                  acervo.{" "}
                  {tipo === "fusao"
                    ? `Fundir apaga «${alvo.rotulo}» do vocabulário e repõe esses vínculos em ` +
                      `«${destino?.rotulo ?? "…"}». Não há desfazer no acervo.`
                    : "A mudança não apaga o termo; ela acrescenta uma declaração sobre ele."}
                </p>
              </div>
            ) : (
              <p className="studio-nota">
                Escolha um item do vocabulário à esquerda. O alcance dele aparece aqui antes
                de qualquer confirmação — mexer na camada 0 sem saber quanto se move é o que
                esta tela existe para impedir.
              </p>
            )}

            {precisaDeCor ? (
              <div className="redacao-campo">
                <span className="studio-rotulo">cor do manual — obrigatória ao promover</span>
                <div className="studio-acoes redacao-cores" role="group" aria-label="cor da linguagem">
                  {tesauro.coresDoManual.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="studio-botao redacao-cor"
                      data-cor-do-manual={c}
                      data-ativo={cor === c ? "sim" : "nao"}
                      aria-pressed={cor === c}
                      style={{ borderColor: `var(${c})` }}
                      onClick={() => setCor(c)}
                    >
                      {c.replace("--ic-", "")}
                    </button>
                  ))}
                </div>
                <p className="studio-nota">{regraDaCor}</p>
              </div>
            ) : null}

            <div className="redacao-campo">
              <label htmlFor="motivo-tesauro" className="studio-rotulo">
                motivo — obrigatório, e é o que a governança lê para decidir
              </label>
              <textarea
                id="motivo-tesauro"
                className="redacao-textarea redacao-motivo"
                data-motivo-tesauro={motivo}
                data-vazio={motivo.trim() ? "nao" : "sim"}
                rows={3}
                value={motivo}
                placeholder="Por que esta mudança no vocabulário?"
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <div className="redacao-campo">
              <label htmlFor="assinatura-tesauro" className="studio-rotulo">
                assinatura da curadoria
              </label>
              <input
                id="assinatura-tesauro"
                className="redacao-textarea"
                value={assinatura}
                onChange={(e) => setAssinatura(e.target.value)}
              />
            </div>

            <form
              className="studio-acoes"
              onSubmit={(e) => {
                e.preventDefault();
                propor();
              }}
            >
              <button
                type="submit"
                className="studio-botao studio-botao-primario"
                data-propor-mudanca
                data-confirmando={confirmando ? "sim" : "nao"}
                disabled={!podePropor}
              >
                {confirmando && alvo
                  ? `confirmar: fundir «${alvo.rotulo}» e mover ${alvo.alcance} vínculo(s)`
                  : "Propor à governança"}
              </button>
              {confirmando ? (
                <button
                  type="button"
                  className="studio-botao"
                  data-cancelar-fusao
                  onClick={() => setConfirmando(false)}
                >
                  cancelar
                </button>
              ) : null}
              {faltando.length ? (
                <span className="redacao-aviso-veto" data-faltando={faltando.length}>
                  Falta {faltando.join(", ")}. A governança decide a partir do que está
                  escrito aqui.
                </span>
              ) : null}
            </form>

            {persistiu ? null : (
              <p className="studio-nota" data-nao-sustenta>
                O navegador recusou gravar o registro local — acontece em janela privada e
                dentro de iframe. A proposta vale nesta tela, mas fechar a aba a perde.
              </p>
            )}
          </section>

          {/* ---- As quatro promovidas, nomeadas ---- */}
          <section className="web-painel redacao-promovidas" data-promovidas={promovidas.length}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">As quatro que vieram da Enciclopédia</span>
            </div>
            <ul className="redacao-lista-fatia">
              {promovidas.map((l) => (
                <li key={l.id} className="redacao-item-fatia" data-linguagem-promovida={l.id}>
                  <span className="redacao-classe" style={{ borderColor: `var(${l.cor})` }}>
                    {l.cor?.replace("--ic-", "")}
                  </span>
                  <strong>{l.rotulo}</strong>
                  <span className="studio-rotulo">
                    {l.alcance.toLocaleString("pt-BR")} vínculo(s)
                  </span>
                </li>
              ))}
            </ul>
            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">por que não foram mapeadas</span>
              <p>{regraDasPromovidas}</p>
            </div>
          </section>

          {/* ---- O que o gerador precisou desambiguar ---- */}
          <section className="web-painel" data-slugs-desambiguados={tesauro.slugsDesambiguados}>
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">O que já foi desambiguado</span>
            </div>
            <p className="studio-nota">
              <strong>{tesauro.slugsDesambiguados}</strong> slugs precisaram ser
              desambiguados na geração do acervo — dois registros com o mesmo nome que não
              são a mesma coisa. É o tamanho do problema que esta tela administra.
            </p>
            {tesauro.alias.length ? (
              <ul className="redacao-lista-fatia">
                {tesauro.alias.map((a) => (
                  <li key={a.de} className="redacao-item-fatia" data-alias={a.de}>
                    <span className="redacao-classe">alias</span>
                    <strong>
                      {a.de} → {a.para}
                    </strong>
                    <span className="studio-rotulo">
                      o gerador reescreve a primeira como a segunda, para as duas não virarem
                      linguagens distintas
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota" data-nao-sustenta>
                Nenhum alias de linguagem declarado no acervo.
              </p>
            )}
          </section>

          {/* ---- As propostas desta sessão ---- */}
          <section className="web-painel">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Propostas desta sessão</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{mudancas.length}</span>
                proposta(s)
              </span>
            </div>
            {mudancas.length === 0 ? (
              <p className="studio-nota">
                Nenhuma ainda. O que for proposto aqui aparece nesta lista com autor, carimbo
                e o alcance medido no momento da proposta — e segue para a aprovação do
                Admin, que é quem decide.
              </p>
            ) : (
              <ul className="redacao-lista-pontes">
                {mudancas.map((m, i) => (
                  <li
                    key={`${m.tipo}:${m.alvoId}:${i}`}
                    className="redacao-ponte"
                    data-mudanca-proposta={m.tipo}
                  >
                    <strong>
                      {ROTULO_DO_TIPO[m.tipo]}: «{m.alvoRotulo}»
                      {m.destinoRotulo ? ` → «${m.destinoRotulo}»` : ""}
                    </strong>
                    <p className="selo-motivo" data-motivo-proposto={m.motivo}>
                      <span>{m.motivo}</span>
                    </p>
                    <p className="studio-nota redacao-decisao-assinatura">
                      alcance medido: {m.alcance.toLocaleString("pt-BR")} vínculo(s)
                      {m.cor ? ` · cor ${m.cor}` : ""} · {m.assinatura} · {m.carimbo}
                    </p>
                    <span className="studio-pastilha" data-aguardando-aprovacao>
                      aguardando aprovação do Admin
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
