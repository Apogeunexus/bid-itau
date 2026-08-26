"use client";

import { useState } from "react";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { CascaDoObservatorio } from "@/componentes/observatorio-casca";
import { milhar } from "@/componentes/observatorio-indicador";
import type { DadosAbertos, RecorteExportavel, TelaDaSuperficie } from "@/dados/observatorio";

/**
 * observatorio-dados.tsx — G7, o recorte exportável e o dicionário que o acompanha.
 *
 * NÃO HÁ LINK DE DOWNLOAD, E ISSO É RESTRIÇÃO DO ARTEFATO, NÃO DESCUIDO. O visualizador
 * bloqueia download iniciado pela própria página, e um botão que não baixa nada é pior do
 * que não ter botão: quem clica conclui que o produto está quebrado. O conteúdo aparece em
 * tela, selecionável, e a tela DIZ que o arquivo vem da versão hospedada — que é a mesma
 * regra de ausência declarada aplicada a uma limitação de interface.
 *
 * EXPORTAR NÚMERO SEM DICIONÁRIO É EXPORTAR MAL-ENTENDIDO. Uma coluna chamada `valor` numa
 * planilha, três meses depois, na mão de outra pessoa, não distingue «zero medido» de «o
 * acervo não sustenta» — e é por isso que `sustentado` viaja SEMPRE ao lado do valor, e o
 * dicionário diz, no campo `valor`, que vazio não é zero. É a distinção de D-90 sobrevivendo
 * à saída do dado.
 *
 * O CSV E O JSON SÃO MONTADOS AQUI, a partir das mesmas colunas e linhas. Dois formatos
 * gerados de duas fontes divergiriam no primeiro campo novo; gerados da mesma tabela, não há
 * como um dizer o que o outro não diz.
 *
 * DP-F: importa `@/dados/observatorio` APENAS POR TIPO.
 */

type Formato = "csv" | "json";

/** Campo de CSV, escapado pela regra do RFC 4180: aspas dobram, e o campo inteiro é citado. */
function campoCsv(valor: string | number | null): string {
  if (valor === null) return "";
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function comoCsv(recorte: RecorteExportavel, cabecalho: string[]): string {
  const linhas = [
    ...cabecalho.map((l) => `# ${l}`),
    recorte.colunas.join(","),
    ...recorte.linhas.map((linha) => linha.map(campoCsv).join(",")),
  ];
  return linhas.join("\n");
}

function comoJson(recorte: RecorteExportavel, versao: string, geradoEm: string): string {
  const registros = recorte.linhas.map((linha) =>
    Object.fromEntries(recorte.colunas.map((coluna, i) => [coluna, linha[i] ?? null])),
  );
  return JSON.stringify({ versao, geradoEm, recorte: recorte.id, registros }, null, 2);
}

export function ObservatorioDados({
  dados,
  tela,
  telas,
}: {
  dados: DadosAbertos;
  tela: TelaDaSuperficie;
  telas: readonly TelaDaSuperficie[];
}) {
  const [recorteId, definirRecorte] = useState(dados.recortes[0]?.id ?? "");
  const [formato, definirFormato] = useState<Formato>("csv");

  const recorte = dados.recortes.find((r) => r.id === recorteId) ?? dados.recortes[0];
  const cabecalho = [
    `versao: ${dados.versao}`,
    `grafo gerado em: ${dados.geradoEm}`,
    `recorte: ${recorte.id} — ${recorte.rotulo}`,
    "vazio na coluna valor NAO e zero: e a ausencia de lastro. A coluna sustentado desfaz a duvida.",
  ];
  const conteudo =
    formato === "csv" ? comoCsv(recorte, cabecalho) : comoJson(recorte, dados.versao, dados.geradoEm);

  return (
    <CascaDoObservatorio tela={tela} telas={telas}>
      <p className="obs-publico-declaracao" data-versao-do-recorte={dados.versao}>
        Recorte <strong>{dados.versao}</strong>, sobre o grafo gerado em{" "}
        <strong>{dados.geradoEm}</strong>. A versão é a data do grafo e não o relógio de quem
        está olhando: duas exportações com a mesma versão trazem exatamente os mesmos números,
        e é isso que torna o recorte conferível por outra pessoa.
      </p>

      <section className="obs-recorte" aria-labelledby="obs-export-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-export-titulo" className="obs-secao-titulo">
            O recorte, em tela
          </h2>
          <div className="obs-recorte-controles">
            <Segmento rotulo="recorte" className="obs-publicos">
              {dados.recortes.map((r) => (
                <OpcaoDeSegmento
                  key={r.id}
                  data-recorte={r.id}
                  selecionado={r.id === recorte.id}
                  onClick={() => definirRecorte(r.id)}
                >
                  {r.rotulo}
                </OpcaoDeSegmento>
              ))}
            </Segmento>
            <Segmento rotulo="formato" className="obs-publicos">
              {(["csv", "json"] as Formato[]).map((f) => (
                <OpcaoDeSegmento
                  key={f}
                  data-formato={f}
                  selecionado={f === formato}
                  onClick={() => definirFormato(f)}
                >
                  {f.toUpperCase()}
                </OpcaoDeSegmento>
              ))}
            </Segmento>
          </div>
        </div>

        <p className="obs-publico-nota">
          {recorte.resumo} São <strong>{milhar(recorte.linhas.length)}</strong> linhas e{" "}
          <strong>{milhar(recorte.colunas.length)}</strong> colunas, e o que está abaixo é o
          conteúdo <strong>inteiro</strong> — nada foi cortado para caber na tela.
        </p>

        <p className="web-declaracao obs-declaracao" data-sem-link-de-download>
          <strong>Não há botão de baixar aqui.</strong>
          A razão é do artefato: esta é uma página estática dentro de um visualizador que
          bloqueia download iniciado pela própria página. Um botão que não baixa nada é pior do
          que nenhum — quem clica conclui que o produto está quebrado. O conteúdo abaixo é
          selecionável e completo; o arquivo pronto vem da versão hospedada, e a chave de API
          para consumo automático é do Admin.
        </p>

        <pre className="obs-previa" data-previa={`${recorte.id}:${formato}`} tabIndex={0}>
          {conteudo}
        </pre>
      </section>

      <section className="obs-recorte" aria-labelledby="obs-dicionario-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-dicionario-titulo" className="obs-secao-titulo">
            O dicionário de dados
          </h2>
        </div>
        <p className="obs-publico-nota">
          Exportar número sem dicionário é exportar mal-entendido. Uma coluna chamada{" "}
          <code>valor</code> numa planilha, três meses depois, na mão de outra pessoa, não
          distingue «zero medido» de «o acervo não sustenta» — e é por isso que a coluna{" "}
          <code>sustentado</code> viaja sempre ao lado dela.
        </p>

        <div className="obs-tabela-uf" data-dicionario={recorte.dicionario.length}>
          <table className="obs-uf">
            <thead>
              <tr>
                <th scope="col">campo</th>
                <th scope="col">significado</th>
                <th scope="col">unidade</th>
                <th scope="col">procedência</th>
              </tr>
            </thead>
            <tbody>
              {recorte.dicionario.map((c) => (
                <tr key={c.campo} data-campo-do-dicionario={c.campo}>
                  <th scope="row">{c.campo}</th>
                  <td>{c.significado}</td>
                  <td>{c.unidade}</td>
                  <td>{c.procedencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="obs-recorte" aria-labelledby="obs-licenca-titulo">
        <div className="obs-recorte-cabeca">
          <h2 id="obs-licenca-titulo" className="obs-secao-titulo">
            Licença, anonimização e a API
          </h2>
        </div>
        <p className="obs-ausencia-projecao" data-licenca>
          <span className="obs-etiqueta">licença</span>
          {dados.licenca}
        </p>
        <p className="obs-ausencia-nivel" data-anonimizacao>
          <span className="obs-etiqueta">anonimização</span>
          {dados.anonimizacao}
        </p>
        <p className="obs-ausencia-projecao" data-sobre-a-api>
          <span className="obs-etiqueta">a API pública</span>
          {dados.sobreAApi}
        </p>
      </section>
    </CascaDoObservatorio>
  );
}
