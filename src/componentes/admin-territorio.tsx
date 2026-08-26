"use client";

/**
 * admin-territorio.tsx — A3, a tabela de centroides e o que ela produz no mapa.
 *
 * A ALAVANCA MAIS BARATA DO SISTEMA, e a tela existe para torná-la operável em vez de
 * elogiável. Acrescentar um município à tabela de referência move um número CONTADO de
 * entidades do centroide de um país inteiro para o centroide da cidade certa — sem tocar em
 * uma linha de código, sem regerar nada. A tela lista quais municípios, e quantas entidades
 * cada um move.
 *
 * DUAS COBERTURAS, COM O NOME CERTO. `meta.json` conta 472 entidades com coordenada, e esse
 * é o tamanho da TABELA. O mapa posiciona 1.380, porque ocorrência herda do espaço e espaço
 * herda do município. As duas são verdadeiras e querem dizer coisas diferentes: 45,3% da
 * tabela é centroide de país, e no mapa a fatia é 29,1%. Exibir só uma delas faria a tela
 * afirmar sobre o mapa um número que é da tabela.
 *
 * A REGRA QUE ESTA TELA NÃO PODE CONTRADIZER. Coordenada nunca é digitada: a procedência é
 * sempre `derivado`, e o tipo recusa outro valor. O que se edita aqui é a tabela de
 * referência — quais municípios e países o sistema conhece —, nunca a coordenada de uma
 * entidade.
 *
 * SEM RELÓGIO, e `localStorage` só em `useEffect`, pelos motivos de sempre. A trilha é a
 * mesma lista da A2: uma superfície, uma trilha.
 */

import { useEffect, useState } from "react";
import {
  ADMIN_AUTORADO,
  CARIMBO_DO_ADMIN,
  CHAVE_DE_ARMAZENAMENTO,
  eventosValidos,
} from "@/dados/admin";
import type {
  CandidatoAMunicipio,
  EventoDeAuditoria,
  FatiaDeMetodo,
  MunicipioAcrescentado,
  TerritoriosDoAdmin,
} from "@/dados/admin";

/** O motivo mínimo, o mesmo da A2: escrita sem explicação é indistinguível de arbítrio. */
const MINIMO_DO_MOTIVO = 8;

export function AdminTerritorio({ dados }: { dados: TerritoriosDoAdmin }) {
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

  const acrescentar = (municipio: MunicipioAcrescentado) => {
    const proximos: EventoDeAuditoria[] = [municipio, ...trilha];
    setTrilha(proximos);
    try {
      window.localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(proximos));
    } catch {
      setSemArmazenamento(true);
    }
  };

  const acrescentados = trilha.filter(
    (e): e is MunicipioAcrescentado => e.tipo === "municipio",
  );
  const jaAcrescentado = new Set(acrescentados.map((m) => m.municipio));
  const movidas = acrescentados.reduce((soma, m) => soma + m.entidadesMovidas, 0);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Territórios e centroides</h1>
        <p className="studio-objetivo">
          Cada município que entra nesta tabela move entidades do centroide de um país
          inteiro para o centroide da cidade certa — sem tocar em código, sem regerar o
          grafo. É a alavanca mais barata do sistema, e abaixo estão os números que dizem
          quanto ela move.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">A regra que esta tela não contradiz</p>
        <p>{dados.regraDaProcedencia}</p>
      </section>

      <DuasCoberturas dados={dados} />

      <Candidatos
        dados={dados}
        acrescentar={acrescentar}
        jaAcrescentado={jaAcrescentado}
        movidas={movidas}
        semArmazenamento={semArmazenamento}
      />

      <Ausencias dados={dados} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// As duas coberturas — a tabela e o mapa, lado a lado, com o nome certo
// ---------------------------------------------------------------------------

function Metodos({ fatias, de }: { fatias: FatiaDeMetodo[]; de: string }) {
  return (
    <ul className="studio-tabela">
      {fatias.map((f) => (
        <li className="studio-linha" key={f.metodo}>
          <span className="studio-celula studio-celula-rotulo">{f.rotulo}</span>
          <span className="studio-celula">
            <strong>{f.entidades}</strong> de {de} · {f.percentualEscrito} — {f.significa}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DuasCoberturas({ dados }: { dados: TerritoriosDoAdmin }) {
  const pais = dados.porMetodo.find((f) => f.metodo === "centroide-pais");
  const paisNoMapa = dados.resolvida.porMetodo.find((f) => f.metodo === "centroide-pais");

  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">Duas coberturas, e elas não são o mesmo número</h2>
      </div>

      <p className="studio-nota">
        A tabela de referência guarda {dados.municipiosNaTabela} municípios e{" "}
        {dados.paisesNaTabela} países, e dá coordenada própria a {dados.comCoordenada}{" "}
        entidades. O mapa posiciona {dados.resolvida.totalEscrito}, porque uma ocorrência herda a
        coordenada do espaço e o espaço herda a do município. Exibir só a primeira faria esta
        tela afirmar sobre o mapa um número que é da tabela.
      </p>

      <div className="admin-parametro">
        <div className="admin-parametro-valor">
          <p className="studio-rotulo">Na tabela</p>
          <p className="admin-parametro-numero">{dados.comCoordenada}</p>
          <p className="admin-parametro-decide">entidades com coordenada própria</p>
          {pais && (
            <p className="admin-parametro-decide">
              {pais.percentualEscrito} delas no centroide de um país inteiro.
            </p>
          )}
        </div>
        <div className="admin-medicao">
          <Metodos fatias={dados.porMetodo} de={String(dados.comCoordenada)} />
        </div>
      </div>

      <div className="admin-parametro">
        <div className="admin-parametro-valor">
          <p className="studio-rotulo">No mapa</p>
          <p className="admin-parametro-numero">{dados.resolvida.totalEscrito}</p>
          <p className="admin-parametro-decide">entidades que o grafo consegue posicionar</p>
          {paisNoMapa && (
            <p className="admin-parametro-decide">
              {paisNoMapa.percentualEscrito} delas no centroide de um país inteiro.
            </p>
          )}
        </div>
        <div className="admin-medicao">
          <Metodos fatias={dados.resolvida.porMetodo} de={dados.resolvida.totalEscrito} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Os candidatos — o que acrescentar, e quanto cada um move
// ---------------------------------------------------------------------------

function Candidatos({
  dados,
  acrescentar,
  jaAcrescentado,
  movidas,
  semArmazenamento,
}: {
  dados: TerritoriosDoAdmin;
  acrescentar: (m: MunicipioAcrescentado) => void;
  jaAcrescentado: Set<string>;
  movidas: number;
  semArmazenamento: boolean;
}) {
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">O que acrescentar primeiro</h2>
        <span className="studio-pastilha studio-pastilha-marca">
          <span className="studio-pastilha-numero">{movidas}</span> entidades movidas nesta
          sessão
        </span>
      </div>

      <p className="studio-nota">
        As entidades que caem no centroide de um país vêm de {dados.resolvida.origensDeCidade}{" "}
        cidades que não estão na tabela de municípios — Paris, Nova York, Lisboa — e por isso
        desabam para o centroide do país inteiro. Cada linha diz quantas entidades saem de lá
        no instante em que aquele município entrar.
      </p>

      <ul className="studio-tabela admin-concentradores">
        {dados.resolvida.candidatos.map((c) => (
          <Candidato
            key={c.origem}
            candidato={c}
            ja={jaAcrescentado.has(c.origem)}
            aberto={aberto === c.origem}
            alternar={() => setAberto(aberto === c.origem ? null : c.origem)}
            acrescentar={acrescentar}
          />
        ))}
      </ul>

      {dados.resolvida.candidatosOcultos > 0 && (
        <p className="studio-nota">
          A lista mostra as {dados.resolvida.candidatos.length} maiores.{" "}
          {dados.resolvida.candidatosOcultos} outras origens ficaram de fora — todas com
          menos entidades que a última desta lista. O corte está declarado aqui em vez de
          acontecer em silêncio.
        </p>
      )}

      {dados.resolvida.soOPais.length > 0 && (
        <div className="studio-nao-sustenta">
          <p className="studio-nao-sustenta-rotulo">
            Onde acrescentar município não resolve
          </p>
          <p>
            {dados.resolvida.entidadesPresasNoPais} entidades apontam para um território que
            É o país, sem nenhum território acima dele no acervo — {dados.resolvida.paisesSemCidade}{" "}
            países ao todo, e as maiores origens são{" "}
            {dados.resolvida.soOPais.map((c) => c.origem).join(", ")}. Para essas, nenhum
            município ajuda: o acervo não sabe a cidade. A tela declara a diferença em vez de
            oferecer um botão que não moveria nada.
          </p>
        </div>
      )}

      {semArmazenamento && (
        <div className="studio-nao-sustenta" role="status">
          <p className="studio-nao-sustenta-rotulo">A trilha não está sendo guardada</p>
          <p>
            O armazenamento do navegador está bloqueado. O que for acrescentado vale nesta
            aba e some ao recarregar.
          </p>
        </div>
      )}
    </section>
  );
}

function Candidato({
  candidato,
  ja,
  aberto,
  alternar,
  acrescentar,
}: {
  candidato: CandidatoAMunicipio;
  ja: boolean;
  aberto: boolean;
  alternar: () => void;
  acrescentar: (m: MunicipioAcrescentado) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const falta = motivo.trim().length < MINIMO_DO_MOTIVO;
  const idMotivo = `motivo-municipio-${candidato.origem.replaceAll(" ", "-")}`;

  return (
    <li className="studio-linha">
      <span className="studio-celula studio-celula-rotulo">{candidato.origem}</span>
      <span className="studio-celula">
        {/* A cidade dentro de um território de MESMO NOME — Nova York em Nova York, Berlim em
            Berlim — é dado correto e leitura ruim: na tela parece defeito. Quando os dois
            nomes coincidem, o «dentro de» não acrescenta nada e some. */}
        {candidato.dentroDe !== candidato.origem && <>dentro de {candidato.dentroDe} · </>}
        move <strong>{candidato.entidades}</strong>{" "}
        {candidato.entidades === 1 ? "entidade" : "entidades"} do centroide de país
        {ja ? (
          <> · já acrescentado nesta sessão, com autor e carimbo na trilha</>
        ) : (
          <>
            <button
              type="button"
              className="studio-botao admin-acao-em-linha"
              onClick={alternar}
              aria-expanded={aberto}
            >
              {aberto ? "Cancelar" : "Acrescentar à tabela"}
            </button>
            {aberto && (
              <form
                className="studio-painel"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (falta) return;
                  acrescentar({
                    tipo: "municipio",
                    municipio: candidato.origem,
                    entidadesMovidas: candidato.entidades,
                    motivo: motivo.trim(),
                    autor: ADMIN_AUTORADO,
                    carimbo: CARIMBO_DO_ADMIN,
                  });
                }}
              >
                <label className="admin-parametro-decide" htmlFor={idMotivo}>
                  Motivo — fica na trilha, com o seu nome
                </label>
                <input
                  id={idMotivo}
                  className="admin-campo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                {falta && (
                  <p className="admin-parametro-decide" role="status">
                    Falta um motivo com pelo menos {MINIMO_DO_MOTIVO} caracteres.
                  </p>
                )}
                <p className="admin-parametro-decide">
                  Vai ficar registrado como {ADMIN_AUTORADO}, em {CARIMBO_DO_ADMIN}.
                </p>
                <button
                  type="submit"
                  className="studio-botao studio-botao-primario admin-acao-em-linha"
                  disabled={falta}
                >
                  Acrescentar {candidato.origem}
                </button>
              </form>
            )}
          </>
        )}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// As ausências, com denominador — a parte que a tela declara e não preenche
// ---------------------------------------------------------------------------

function Ausencias({ dados }: { dados: TerritoriosDoAdmin }) {
  return (
    <section className="studio-painel">
      <div className="studio-painel-cabeca">
        <h2 className="studio-painel-nome">O que o acervo não sabe</h2>
      </div>

      <ul className="studio-tabela">
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Unidades federativas</span>
          <span className="studio-celula">
            <strong>
              {dados.ufsNoAcervo} de {dados.ufsNaTabela}
            </strong>{" "}
            existem no acervo. Faltam {dados.ufsAusentes.join(" e ")} — a tabela de
            centroides conhece as {dados.ufsNaTabela}, e é por isso que a ausência aparece em
            vez de sumir.
          </span>
        </li>
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Concentração</span>
          <span className="studio-celula">
            <strong>{dados.percentualNosDoisMaiores}</strong> dos {dados.registros} registros
            de território estão em 2 das {dados.ufsNaTabela} unidades —{" "}
            {dados.registrosNosDoisMaiores} deles. São REGISTROS, não entidades: por trás
            deles há {dados.entidadesDistintas} entidades distintas, porque uma entidade pode
            estar situada em mais de um território.
          </span>
        </li>
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Sem coordenada</span>
          <span className="studio-celula">
            <strong>{dados.semCoordenada}</strong>. Nenhuma entidade situável ficou de fora do
            mapa — o que não quer dizer coordenada precisa: a precisão está na distribuição
            por método, acima.
          </span>
        </li>
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Municípios aproximados</span>
          <span className="studio-celula">
            {dados.aproximados.length}, nomeados um a um:{" "}
            {dados.aproximados.map((a) => `${a.municipio}/${a.estado}`).join(", ")}. O
            centroide deles é aproximado e o registro diz que é.
          </span>
        </li>
        <li className="studio-linha">
          <span className="studio-celula studio-celula-rotulo">Bairro</span>
          <span className="studio-celula">
            Não sustentado. A tabela desce até o município; abaixo dele não há dado, e a tela
            não inventa um nível que o acervo não tem.
          </span>
        </li>
      </ul>
    </section>
  );
}
