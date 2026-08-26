import { Grafismo } from "@/componentes/grafismo";
import { StudioAcessibilidade } from "@/componentes/studio-acessibilidade";
import { comSeparador } from "@/componentes/studio-datas";
import { SITUACAO_E_AUTORADA, catalogoDeEspacos, rascunhosSemeados } from "@/dados/mock/seed";
import metaJson from "@/dados/gerado/meta.json";
import type { MetaGrafo } from "@/dados/tipos";

/**
 * Studio — P6 · ficha de acessibilidade. **A tela que mais distingue a proposta.**
 *
 * Página de SERVIDOR. Lê o grafo no build e passa DTOs só de primitivo (DP-F).
 *
 * OS DOIS NÚMEROS VÊM DE `meta.json`, e não de um literal digitado. `fichaDeAcessibilidade`
 * é o denominador que falta às oito contagens por dimensão: sem ele, uma dimensão em zero
 * não distingue «ninguém oferece» de «ninguém preencheu». Escrever 5.108 e 2.702 à mão aqui
 * faria a apresentação afirmar, na primeira regeração do grafo, número que o acervo não
 * sustenta — e nesta tela, entre todas, seria a contradição mais cara.
 */
export default function StudioAcessibilidadePagina() {
  const meta = metaJson as MetaGrafo;
  const ficha = {
    declaram: meta.fichaDeAcessibilidade.declaram,
    naoDeclaram: meta.fichaDeAcessibilidade.naoDeclaram,
  };

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · produtor</span>
        <div className="studio-cabecalho-titulo">
          <Grafismo variacao="barra" className="studio-cabecalho-marca" />
          <h1 className="studio-titulo">Ficha de acessibilidade</h1>
        </div>
        <p className="studio-objetivo">
          O campo que registra o ato de preencher, e não o conteúdo da ficha. No acervo,{" "}
          {comSeparador(ficha.declaram)} registros declararam e{" "}
          {comSeparador(ficha.naoDeclaram)} não — e é só esse campo que separa «não oferece»
          de «não declarou», porque dentro das oito dimensões um «não» significa as duas
          coisas ao mesmo tempo.
        </p>
      </header>

      <StudioAcessibilidade
        catalogo={catalogoDeEspacos()}
        semente={rascunhosSemeados()}
        situacaoEAutorada={SITUACAO_E_AUTORADA}
        ficha={ficha}
      />
    </div>
  );
}
