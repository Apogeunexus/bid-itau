import { Grafismo } from "@/componentes/grafismo";
import { comSeparador } from "@/componentes/studio-datas";
import { StudioTemporada } from "@/componentes/studio-temporada";
import { SITUACAO_E_AUTORADA, catalogoDeEspacos, rascunhosSemeados } from "@/dados/mock/seed";
import { declaracoesDoQueNaoSustenta, numerosDoAcervo } from "@/dados/ocorrencias-studio";

/**
 * Studio — P4 · espaço e temporada. **O nível intermediário da cadeia de identidade.**
 *
 * Página de SERVIDOR. Lê o grafo no build e passa DTOs só de primitivo; o componente de
 * cliente importa o módulo apenas por tipo (DP-F). O catálogo é o mesmo da grade — os 113
 * espaços — porque a necessidade é a mesma: um catálogo por tela quando o recorte coincide
 * seria duplicação com nome de recorte.
 *
 * A DECLARAÇÃO DO ESPAÇO VEM DE `ocorrencias-studio.ts`, calculada sobre o dado. É a mesma
 * frase que a tela de ocorrências e a grade exibem, e é ela que explica por que esta tela
 * existe: nenhuma das ocorrências do acervo declara onde acontece.
 */
export default function StudioTemporadaPagina() {
  const n = numerosDoAcervo();
  const doEspaco = declaracoesDoQueNaoSustenta().find((d) => d.chave === "espaco");

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Espaço e temporada</h1>
        </div>
        <p className="studio-objetivo">
          O recorte com começo, fim e lugar. Sem ele a sessão não tem chave — e o acervo
          mede a falta: {comSeparador(n.ocorrenciasComEspaco)} de{" "}
          {comSeparador(n.ocorrencias)} ocorrências declaram onde acontecem.
        </p>
      </header>

      <StudioTemporada
        catalogo={catalogoDeEspacos()}
        semente={rascunhosSemeados()}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
        declaracaoDoEspaco={doEspaco?.texto ?? ""}
        numeros={{ ocorrencias: n.ocorrencias, ocorrenciasComEspaco: n.ocorrenciasComEspaco }}
      />
    </div>
  );
}
