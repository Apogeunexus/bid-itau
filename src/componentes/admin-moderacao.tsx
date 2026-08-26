/**
 * admin-moderacao.tsx — A10, o desempenho da moderação por escopo.
 *
 * COMPONENTE DE SERVIDOR, e a tela não escreve nada: ela mede. O problema é que hoje ela não
 * consegue medir quase nada, e é isso que ela declara — as cinco medidas da funcionalidade
 * 169 dependem de decisões tomadas, e a fila do protótipo nunca foi decidida por ninguém.
 *
 * POR QUE NÃO EXIBIR ZEROS. «Tempo médio de fila: 0min» afirmaria que a fila é instantânea,
 * quando o fato é que ninguém decidiu nada. Zero medido e ausência de medição são coisas
 * diferentes — a mesma regra que separa «não oferece» de «não declarou» na ficha de
 * acessibilidade, aplicada aqui.
 *
 * O RECORTE QUE A TELA PRECISA IMPRIMIR. Esta é a medição entre moderadores, para o Admin; a
 * outra é o histórico de cada moderador, para ele. Confundir as duas transforma auditoria em
 * vigilância de desempenho individual.
 */

import { O_RECORTE_DESTA_TELA, POR_QUE_NENHUMA_FECHA } from "@/dados/admin";
import type { MedidaDaModeracao } from "@/dados/admin";

export function AdminModeracao({ medidas }: { medidas: MedidaDaModeracao[] }) {
  const sustentadas = medidas.filter((m) => m.sustentada).length;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Desempenho da moderação</h1>
        <p className="studio-objetivo">
          Sem esta tela, ninguém mede quem modera. Com ela mal desenhada, a plataforma passa a
          vigiar quem modera — e a diferença entre as duas coisas é o recorte, não o dado.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">O recorte desta tela</p>
        <p>{O_RECORTE_DESTA_TELA}</p>
      </section>

      <section className="admin-parametro">
        <div className="admin-parametro-valor">
          <p className="studio-rotulo">Medidas que fecham hoje</p>
          <p className="admin-parametro-numero">
            {sustentadas} de {medidas.length}
          </p>
          <p className="admin-parametro-decide">e a tela diz por quê, uma a uma</p>
        </div>
        <div className="admin-medicao">
          <p className="studio-nota">{POR_QUE_NENHUMA_FECHA}</p>
        </div>
      </section>

      {medidas.map((m) => (
        <article className="admin-parametro" key={m.id}>
          <div className="admin-parametro-valor">
            <p className="studio-rotulo">{m.medida}</p>
            <p className="admin-parametro-decide">{m.hoje}</p>
          </div>
          <div className="admin-medicao">
            <p className="studio-nota">{m.oQueRevela}</p>
            {!m.sustentada && (
              <div className="studio-nao-sustenta">
                <p className="studio-nao-sustenta-rotulo">Ainda não é medível</p>
                <p>Precisa de {m.precisaDe}</p>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
