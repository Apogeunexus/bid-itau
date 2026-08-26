"use client";

import { useEffect, useState } from "react";
import { CamadaDesertos, LeituraDesertos } from "@/componentes/desertos";
import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { CartaoDeIndicador, milhar } from "@/componentes/observatorio-indicador";
import type { DadosDoTerritorio, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-territorio.tsx — G4, o diagnóstico que justifica a plataforma existir.
 *
 * O MAPA DE DESERTOS NÃO É RECURSO, É O DIAGNÓSTICO. Sergipe e Tocantins não aparecem no
 * acervo, e a concentração medida é o argumento de que a plataforma precisa ser nacional
 * POR CONSTRUÇÃO e não por intenção. Um mapa que pintasse só onde há oferta contaria a
 * história pela metade; o que esta tela pinta é onde o acervo OLHOU.
 *
 * REGISTRO NÃO É ENTIDADE, e a tela diz as duas coisas em vez de fundir uma na outra. São
 * 773 registros de `situado_em` e 718 entidades distintas por trás deles, porque uma
 * entidade pode estar situada em mais de um território. Dizer «773 entidades» afirmaria
 * mais concentração de acervo do que o acervo tem — e num painel de território é o erro de
 * substantivo mais caro que existe.
 *
 * A CAMADA MONTA DEPOIS DA HIDRATAÇÃO, pelo mesmo motivo da tela raiz: `desertos.tsx` dá ao
 * `<title>` de cada estado uma LISTA de filhos, e o React 19 exige string única — com
 * lista, o renderizador de servidor emite `<title></title>` e o de cliente escreve o texto,
 * e a diferença derruba a hidratação da rota inteira. `desertos.tsx` é arquivo da fase 3 e
 * não é território desta sessão; montar a camada depois é repetir o comportamento herdado
 * em vez de inventar um novo.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

export function ObservatorioTerritorio({
  dados,
  viewBox,
  contorno,
  rotuloContorno,
  tela,
  telas,
}: {
  dados: DadosDoTerritorio;
  viewBox: string;
  contorno: string;
  rotuloContorno: string;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const [camada, definirCamada] = useState(false);
  useEffect(() => definirCamada(true), []);

  const d = dados;
  const ufs = [...d.desertos.ufs].sort((a, b) => b.registros - a.registros || a.sigla.localeCompare(b.sigla));

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <p className="obs-publico-declaracao" data-registro-nao-e-entidade>
        São <strong>{milhar(d.registros)}</strong> registros de lugar — cada vínculo entre uma
        entidade e um território — e <strong>{milhar(d.entidadesDistintas)}</strong> entidades
        distintas por trás deles, porque uma entidade pode estar situada em mais de um lugar.
        As duas contagens estão aqui separadas de propósito: dizer «{milhar(d.registros)}{" "}
        entidades» afirmaria mais concentração de acervo do que o acervo tem, e num painel de
        território esse é o erro de substantivo mais caro que existe.
      </p>

      {/* ---------------------------------------------------------------
          O MAPA DE DESERTOS, e a tabela por unidade federativa.
          --------------------------------------------------------------- */}
      <section className="obs-desertos" data-desertos-territorio>
        <div className="obs-desertos-mapa">
          <svg
            viewBox={viewBox}
            role="img"
            aria-label={`${rotuloContorno} — ${d.desertos.ufs.length} unidades federativas pintadas pela contagem de registros do acervo`}
            className="web-mapa obs-mapa"
            data-mapa-desertos
            data-camada={camada ? "sim" : "nao"}
          >
            <path className="mapa-contorno" d={contorno} />
            {camada ? <CamadaDesertos dados={d.desertos} /> : null}
          </svg>
        </div>

        <div className="obs-desertos-leitura">
          <LeituraDesertos dados={d.desertos} />

          {/* A tabela rola DENTRO do contêiner, e não empurra a página: são 27 linhas, e a
              tela precisa manter o mapa ao lado enquanto se percorre a lista. */}
          <div className="obs-tabela-uf" data-linhas={ufs.length}>
            <table className="obs-uf">
              <caption className="obs-uf-legenda">
                As {milhar(d.totalDeUfs)} unidades federativas — {milhar(d.ufsNoAcervo)} existem no
                acervo. A tabela de centroides conhece as {milhar(d.totalDeUfs)}; o acervo tem{" "}
                {milhar(d.ufsNoAcervo)}.
              </caption>
              <thead>
                <tr>
                  <th scope="col">UF</th>
                  <th scope="col">registros</th>
                  <th scope="col">entidades</th>
                  <th scope="col">no grafo</th>
                </tr>
              </thead>
              <tbody>
                {ufs.map((uf) => (
                  <tr key={uf.sigla} data-uf-linha={uf.sigla} data-no-grafo={uf.noGrafo ? "sim" : "nao"}>
                    <th scope="row">{uf.titulo}</th>
                    <td>{milhar(uf.registros)}</td>
                    <td>{milhar(uf.entidades)}</td>
                    <td>{uf.noGrafo ? "sim" : "o acervo não sabe que existe"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          COMO CADA COORDENADA FOI OBTIDA.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-metodos-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-metodos-titulo" className="obs-secao-titulo">
            De onde vem cada ponto do mapa
          </h2>
        </div>
        <p className="obs-publico-nota">
          <strong>Nenhuma coordenada deste acervo veio no dado.</strong> Todas são derivadas por
          regra, e o método diz quão grosso é o chute: o centroide de um município localiza um
          bairro errado, o centroide de um país inteiro não localiza nada.
        </p>

        <p className="obs-publico-declaracao" data-duas-contagens-de-coordenada>
          E há <strong>duas contagens</strong> aqui, que não são a mesma coisa e por isso
          aparecem separadas.{" "}
          <strong>{milhar(d.comCoordenadaPropria)}</strong> entidades têm coordenada{" "}
          <strong>própria</strong> — é o tamanho da tabela. E{" "}
          <strong>{milhar(d.metodos[0]?.de ?? 0)}</strong> conseguem ser{" "}
          <strong>posicionadas</strong> no mapa, porque a ocorrência herda o lugar do espaço e o
          espaço herda o do município — é o tamanho do desenho. Citar cobertura de coordenada
          sem dizer qual das duas se está citando afirma a errada metade das vezes.
        </p>

        <div className="obs-duas-contagens">
          <div>
            <h3 className="obs-indicador-titulo">
              Posicionadas no mapa — {milhar(d.metodos[0]?.de ?? 0)}
            </h3>
            <p className="obs-metodo-rotulo">
              A coordenada RESOLVIDA de cada entidade que o mapa consegue desenhar, herança
              incluída. Destas, <strong>{milhar(d.foraDoBrasil)}</strong> caem fora do retângulo do
              Brasil e não são desenhadas — contadas e declaradas, porque uma entidade ausente do
              índice seria indistinguível de uma sem coordenada nenhuma.
            </p>
            <ul className="obs-metodos" data-metodos={d.metodos.length}>
              {d.metodos.map((m) => (
                <li key={m.metodo} className="obs-metodo" data-metodo={m.metodo}>
                  <span className="obs-metodo-rotulo">{m.rotulo}</span>
                  <span className="obs-trilho" aria-hidden="true">
                    <span
                      className="obs-barra obs-barra-buraco"
                      style={{ width: `${m.de > 0 ? ((m.n / m.de) * 100).toFixed(2) : 0}%` }}
                    />
                  </span>
                  <span className="obs-detalhe-valor">
                    {milhar(m.n)}
                    <span className="obs-detalhe-de"> de {milhar(m.de)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="obs-indicador-titulo">
              Com coordenada própria — {milhar(d.comCoordenadaPropria)}
            </h3>
            <p className="obs-metodo-rotulo">
              Só quem tem coordenada escrita na própria entidade, sem herdar de ninguém. É o
              número que descreve a TABELA de geolocalização, e é sobre ele que se mede a
              qualidade do acervo geográfico.
            </p>
            <ul className="obs-metodos" data-metodos-proprios={d.metodosProprios.length}>
              {d.metodosProprios.map((m) => (
                <li key={m.metodo} className="obs-metodo" data-metodo-proprio={m.metodo}>
                  <span className="obs-metodo-rotulo">{m.rotulo}</span>
                  <span className="obs-trilho" aria-hidden="true">
                    <span
                      className="obs-barra obs-barra-buraco"
                      style={{ width: `${m.de > 0 ? ((m.n / m.de) * 100).toFixed(2) : 0}%` }}
                    />
                  </span>
                  <span className="obs-detalhe-valor">
                    {milhar(m.n)}
                    <span className="obs-detalhe-de"> de {milhar(m.de)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="web-denominadores obs-denominadores">
          <li className="web-denominador obs-denominador" data-denominador="territorio:eventos-fora">
            <span className="web-denominador-numero">{milhar(d.eventosForaDoBrasil)}</span>
            <span className="web-denominador-rotulo">
              dos {milhar(d.eventosSituados)} eventos situados têm coordenada FORA do Brasil — e
              evento é o que uma agenda cultural leva a sério
            </span>
          </li>
          <li className="web-denominador obs-denominador" data-denominador="territorio:instituicoes">
            <span className="web-denominador-numero">
              {milhar(d.instituicoesSemCoordenada.quantos)}
            </span>
            <span className="web-denominador-rotulo">
              das {milhar(d.instituicoesSemCoordenada.de)} instituições têm coordenada — a
              infraestrutura cultural do país não está no mapa
            </span>
          </li>
        </ul>
      </section>

      {/* ---------------------------------------------------------------
          OS DOIS INDICADORES TERRITORIAIS, no cartão da G3.
          --------------------------------------------------------------- */}
      <section className="obs-recorte" aria-labelledby="obs-indicadores-territorio">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-indicadores-territorio" className="obs-secao-titulo">
            Os dois indicadores territoriais
          </h2>
        </div>
        <ul className="web-grade obs-indicadores">
          <CartaoDeIndicador indicador={d.concentracao} destacado primeiro={false} />
          <CartaoDeIndicador indicador={d.diversidade} destacado={false} primeiro={false} />
        </ul>
      </section>
    </CascaDoObservatorio>
  );
}
