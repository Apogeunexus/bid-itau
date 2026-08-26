/**
 * admin-governanca.tsx — A9, os quatro poderes operacionais.
 *
 * COMPONENTE DE SERVIDOR. Nenhum dos quatro poderes é exercível no protótipo: não há o que
 * suspender, chave para emitir, base para quem disparar nem módulo para desligar. O que
 * existe é a DECLARAÇÃO de cada um, com o que o torna perigoso — e declarar é o que esta
 * tela pode fazer honestamente.
 *
 * A ALTERNATIVA SERIA PIOR: quatro controles que não fazem nada, ou quatro que fazem de
 * conta. Um «Suspender» que só mudasse a cor de uma linha ensinaria a quem avalia que a
 * suspensão é cosmética — e o argumento desta sessão é exatamente o contrário disso.
 *
 * A DIFERENÇA ENTRE SUSPENDER E APAGAR é o conteúdo da tela, não uma nota de rodapé: apagar
 * destrói procedência, suspender a preserva, e é por isso que esta plataforma não tem apagar
 * em lugar nenhum.
 */

import { PODERES_OPERACIONAIS, SUSPENDER_NAO_E_APAGAR } from "@/dados/admin";

export function AdminGovernanca() {
  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Governança operacional</h1>
        <p className="studio-objetivo">
          Os quatro poderes que não merecem tela própria e merecem registro: suspender,
          integrar, disparar e desligar. Cada um com o que o torna perigoso, escrito ao lado.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">Suspender não é apagar</p>
        <p>{SUSPENDER_NAO_E_APAGAR}</p>
      </section>

      {PODERES_OPERACIONAIS.map((p) => (
        <article className="admin-parametro" key={p.id}>
          <div className="admin-parametro-valor">
            <p className="studio-rotulo">{p.titulo}</p>
            <p className="admin-parametro-decide">{p.oQueE}</p>
          </div>
          <div className="admin-medicao">
            <p className="studio-nota">{p.cuidado}</p>
          </div>
        </article>
      ))}

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">Nenhum destes quatro roda aqui</p>
        <p>
          O protótipo é exportado como arquivo estático e não tem servidor próprio: não há o
          que suspender, chave para emitir, base para quem disparar nem módulo para desligar.
          Esta tela declara os quatro poderes e o que torna cada um perigoso, e não oferece
          controle para nenhum.
        </p>
        <p>
          A alternativa seria pior. Um «Suspender» que só mudasse a cor de uma linha
          ensinaria a quem avalia que a suspensão é cosmética, e é o oposto do que esta
          plataforma afirma.
        </p>
      </section>
    </div>
  );
}
