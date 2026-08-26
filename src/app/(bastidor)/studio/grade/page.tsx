import { Grafismo } from "@/componentes/grafismo";
import { StudioGrade } from "@/componentes/studio-grade";
import { SITUACAO_E_AUTORADA, catalogoDaGrade, rascunhosSemeados } from "@/dados/mock/seed";
import {
  FRASE_DE_D73,
  declaracoesDoQueNaoSustenta,
  numerosDoAcervo,
} from "@/dados/ocorrencias-studio";

/**
 * Studio — P5 · grade de ocorrências. **A tela onde 2.425 registros deixam de ser derivados.**
 *
 * Página de SERVIDOR. Ela chama `@/dados/mock/seed` e `@/dados/ocorrencias-studio` por
 * valor, no build, e passa adiante DTOs só de primitivo. O componente de cliente importa os
 * módulos apenas por tipo (DP-F).
 *
 * TODO NÚMERO DESTA TELA VEM DE `numerosDoAcervo()`, medido sobre o grafo. A declaração de
 * que nenhuma ocorrência do acervo tem espaço e a frase de D-73 — a regra determinística que
 * hoje inventa as sessões porque `schedules` do CMS está vazio — são as MESMAS que a tela de
 * ocorrências já exibe. Um literal digitado aqui faria a apresentação afirmar, na primeira
 * regeração do grafo, número que o acervo não sustenta.
 *
 * O catálogo desta tela leva só os 113 espaços: a grade escolhe espaço por sessão e não toca
 * em vocabulário nem em imagem.
 */
export default function StudioGradePagina() {
  const n = numerosDoAcervo();
  const doEspaco = declaracoesDoQueNaoSustenta().find((d) => d.chave === "espaco");

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Grade de ocorrências</h1>
        </div>
        <p className="studio-objetivo">
          A sessão datada é o registro que o acervo não tem: as {n.ocorrencias} ocorrências
          dele são todas derivadas por regra, porque nenhuma existe em sistema nenhum do IC.
          Cada linha declarada aqui passa a existir, com procedência «produtor» e chave de
          três partes.
        </p>
      </header>

      <StudioGrade
        catalogo={catalogoDaGrade()}
        semente={rascunhosSemeados()}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
        declaracaoDoEspaco={doEspaco?.texto ?? ""}
        fraseDaDerivacao={FRASE_DE_D73}
        numeros={{
          ocorrencias: n.ocorrencias,
          ocorrenciasComEspaco: n.ocorrenciasComEspaco,
          eventos: n.eventos,
        }}
      />
    </div>
  );
}
