"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PanoramaDasDuplicatas } from "@/dados/moderacao";

/**
 * moderacao-duplicatas.tsx — duplicatas entre organizações (M7, funcionalidade 113).
 *
 * A REGRA DE COMPETÊNCIA É O CONTEÚDO. Um produtor decide duplicata entre os PRÓPRIOS
 * registros — são dele, e ele sabe qual é qual (163). Quando o grupo junta registros de
 * fontes diferentes, nenhum dos dois lados pode decidir sem ser parte, e a decisão vem para
 * cá. É a mesma razão pela qual ninguém julga a própria causa.
 *
 * E O ACERVO DESTE PROTÓTIPO NÃO TEM UM ÚNICO CASO DESSES. Dos 84 grupos que a deduplicação
 * encontrou, **nenhum** junta fontes diferentes: todo achado é de competência do produtor.
 * A tela existe assim mesmo, com os grupos que há e a competência marcada em cada um,
 * porque abrir vazia diria a mesma coisa que uma busca que não rodou — e porque o dia em
 * que uma segunda organização publicar no mesmo acervo é o dia em que o primeiro caso
 * aparece, e aí não pode ser preciso construir a tela às pressas.
 *
 * DP-F: `"use client"`, e `@/dados/moderacao` entra **apenas por tipo**.
 */

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function ModeracaoDuplicatas({
  panorama,
  regraDaCompetencia,
  naoHaCasoCruzado,
  acervoNaoPublicaOrganizacao,
  duplicataDoAcervoEReal,
}: {
  panorama: PanoramaDasDuplicatas;
  regraDaCompetencia: string;
  naoHaCasoCruzado: string;
  acervoNaoPublicaOrganizacao: string;
  duplicataDoAcervoEReal: string;
}) {
  const [abertoId, setAbertoId] = useState<string>(panorama.grupos[0]?.id ?? "");
  const grupo = useMemo(
    () => panorama.grupos.find((g) => g.id === abertoId) ?? panorama.grupos[0],
    [panorama.grupos, abertoId],
  );

  return (
    <div className="studio moderacao" data-duplicatas-moderacao>
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · duplicatas entre organizações</span>
        <h1 className="studio-titulo">
          {comSeparador(panorama.cruzamFontes)} de {comSeparador(panorama.totalDeGrupos)}{" "}
          grupos são desta mesa
        </h1>
        <p className="studio-objetivo">{regraDaCompetencia}</p>
        <div className="moderacao-ficha-atalhos">
          <Link className="studio-botao" href="/moderacao/fila/">
            ← voltar à fila
          </Link>
          <Link className="studio-botao" href="/studio/duplicatas/">
            a fila do produtor
          </Link>
        </div>

        <div className="web-denominadores" data-competencia>
          <span className="web-denominador" data-lado="moderacao" data-valor={panorama.cruzamFontes}>
            <span className="web-denominador-numero">
              {comSeparador(panorama.cruzamFontes)}
            </span>
            <span className="web-denominador-rotulo">
              juntam fontes diferentes — decisão desta mesa
            </span>
          </span>
          <span className="web-denominador" data-lado="produtor" data-valor={panorama.deUmaFonteSo}>
            <span className="web-denominador-numero">
              {comSeparador(panorama.deUmaFonteSo)}
            </span>
            <span className="web-denominador-rotulo">
              são de uma fonte só — decisão do produtor
            </span>
          </span>
        </div>
      </header>

      {/* ================================================================== */}
      {/* A DECLARAÇÃO — ela é o conteúdo desta tela hoje                     */}
      {/* ================================================================== */}
      <div className="moderacao-aviso-permanente" data-sem-caso-cruzado={panorama.cruzamFontes}>
        <span className="studio-nao-sustenta-rotulo">
          por que esta mesa está vazia, e por que a tela existe
        </span>
        <p>{naoHaCasoCruzado}</p>
        <p>{acervoNaoPublicaOrganizacao}</p>
      </div>

      <div className="moderacao-colunas">
        <section className="web-painel moderacao-coluna-ficha">
          <div className="studio-painel-cabeca">
            <span className="studio-painel-nome">
              Os grupos que a deduplicação encontrou
            </span>
            <span className="studio-pastilha">
              <span className="studio-pastilha-numero">
                {comSeparador(panorama.grupos.length)}
              </span>
              de {comSeparador(panorama.totalDeGrupos)}
            </span>
          </div>

          <ul className="moderacao-familias">
            {panorama.grupos.map((g) => (
              <li
                key={g.id}
                className="moderacao-familia"
                data-grupo-duplicata={g.id}
                data-origem-grupo={g.origem}
                data-fontes={g.fontes.join("+")}
                data-realcado={grupo?.id === g.id ? "sim" : "nao"}
              >
                <button
                  type="button"
                  className="moderacao-atalho-item"
                  onClick={() => setAbertoId(g.id)}
                >
                  <span className="moderacao-selo-origem" data-origem="produtor">
                    {g.origem}
                  </span>
                  <span className="web-linha-titulo">
                    {g.registros.map((r) => r.titulo).join(" ↔ ")}
                  </span>
                  <span className="studio-rotulo">
                    {g.estagioRotulo}
                    {g.score !== null ? ` · ${g.score.toFixed(3)}` : null} · fonte{" "}
                    {g.fontes.join(" + ") || "não declarada"} ·{" "}
                    <strong>competência do produtor</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="studio-nota">
            São {comSeparador(panorama.grupos.length)} dos{" "}
            {comSeparador(panorama.totalDeGrupos)} — os demais estão na{" "}
            <Link href="/studio/duplicatas/">fila do produtor</Link>, que é onde eles são
            decididos. Esta lista não é a fila desta mesa: é o que existe, para se ver por
            que nada disto é daqui.
          </p>
        </section>

        <div className="moderacao-coluna-decisao">
          {grupo ? (
            <section className="web-painel">
              <div className="studio-painel-cabeca">
                <span className="studio-painel-nome">Comparação campo a campo</span>
                <span className="studio-pastilha">{grupo.estagioRotulo}</span>
              </div>

              <div className="studio-tabela" data-comparacao={grupo.id}>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">registro</div>
                  {grupo.registros.map((r) => (
                    <div key={r.id} className="studio-celula">
                      <Link href={r.rota}>{r.titulo}</Link>
                      <span className="studio-rotulo">
                        fonte {r.fonte} · procedência {r.procedencia}
                      </span>
                    </div>
                  ))}
                </div>
                {grupo.campos.map((c) => (
                  <div
                    key={c.campo}
                    className="studio-linha"
                    data-campo={c.campo}
                    data-divergente={c.divergente ? "sim" : "nao"}
                  >
                    <div className="studio-celula studio-celula-rotulo">{c.rotulo}</div>
                    {c.valores.map((v, i) => (
                      <div key={`${c.campo}-${i}`} className="studio-celula">
                        {v}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* NÃO HÁ BOTÃO DE DECISÃO, e a ausência é o conteúdo. Este grupo é de
                  competência do produtor; oferecer aqui um botão que a moderação não
                  deveria apertar seria desfazer, na interface, a regra que a tela inteira
                  existe para afirmar. */}
              <div className="studio-nao-sustenta" data-nao-sustenta data-sem-acao>
                <span className="studio-nao-sustenta-rotulo">
                  esta mesa não decide este grupo
                </span>
                <p>
                  Os registros deste grupo vêm de uma fonte só, e a decisão é de quem os
                  publicou. Não há botão aqui — oferecer um que a moderação não deveria
                  apertar desfaria, na interface, a regra que esta tela existe para afirmar.
                </p>
              </div>
            </section>
          ) : null}

          <section className="web-painel">
            <div className="studio-nao-sustenta" data-nao-sustenta data-acervo-real>
              <span className="studio-nao-sustenta-rotulo">
                o que foi plantado e o que foi encontrado
              </span>
              <p>{duplicataDoAcervoEReal}</p>
              <p>
                Neste acervo são <strong>{comSeparador(panorama.doAcervoReal)}</strong>{" "}
                grupos de origem <code className="studio-literal">acervo</code> — duplicata
                real, encontrada em dado real, que ninguém plantou.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
