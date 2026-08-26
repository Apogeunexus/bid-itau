/**
 * admin-vocabulario.tsx — A4, a saúde do tesauro sem escrevê-lo.
 *
 * COMPONENTE DE SERVIDOR. Esta tela não escreve: aprovar promoção é ato de moderação sobre
 * uma proposta do Editor, e a proposta não existe no protótipo. O que a tela faz é declarar
 * a separação e mostrar o estado do vocabulário — e declarar a separação É o conteúdo, porque
 * sem ela o administrador vira curador por acidente.
 *
 * A PROMOÇÃO QUE JÁ ACONTECEU é o melhor material da tela: quatro linguagens vieram da
 * Enciclopédia e não existem no vocabulário do CMS. Promover foi fiel à fonte; encaixá-las à
 * força numa das existentes seria fabricar uma classificação que ninguém fez.
 */

import { O_ADMIN_NAO_CURA } from "@/dados/admin";
import type { DadosDoVocabulario } from "@/dados/admin";

export function AdminVocabulario({ dados }: { dados: DadosDoVocabulario }) {
  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <p className="studio-superficie">Admin · governança</p>
        <h1 className="studio-titulo">Vocabulário e procedência</h1>
        <p className="studio-objetivo">
          O tamanho do tesauro, o que foi promovido e de onde veio cada fatia do acervo. Esta
          tela monitora o vocabulário; quem o escreve é outro nível.
        </p>
      </header>

      <section className="studio-nao-sustenta">
        <p className="studio-nao-sustenta-rotulo">O Admin aprova, não promove</p>
        <p>{O_ADMIN_NAO_CURA}</p>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">O tamanho do tesauro</h2>
        </div>
        <ul className="studio-tabela">
          <li className="studio-linha">
            <span className="studio-celula studio-celula-rotulo">Linguagens</span>
            <span className="studio-celula">
              {dados.linguagens} — o vocabulário fechado que classifica todo o acervo.
            </span>
          </li>
          <li className="studio-linha">
            <span className="studio-celula studio-celula-rotulo">Temas</span>
            <span className="studio-celula">{dados.temas}</span>
          </li>
          <li className="studio-linha">
            <span className="studio-celula studio-celula-rotulo">Termos</span>
            <span className="studio-celula">
              {dados.termos} — o vocabulário aberto, que cresce com o que a Enciclopédia
              traz.
            </span>
          </li>
          <li className="studio-linha">
            <span className="studio-celula studio-celula-rotulo">Slugs desambiguados</span>
            <span className="studio-celula">
              {dados.slugsDesambiguados} — dois verbetes com o mesmo nome viram dois
              endereços distintos, e nenhum dos dois some.
            </span>
          </li>
        </ul>
      </section>

      <section className="admin-parametro">
        <div className="admin-parametro-valor">
          <p className="studio-rotulo">Promovidas</p>
          <p className="admin-parametro-numero">{dados.promovidas.length}</p>
          <p className="admin-parametro-decide">linguagens vindas da Enciclopédia</p>
        </div>
        <div className="admin-medicao">
          <p className="studio-nota">
            {dados.promovidas.join(", ")}. {dados.porQueAPromocaoFoiFiel}
          </p>
          {dados.alias.length > 0 && (
            <ul className="studio-tabela">
              {dados.alias.map((a) => (
                <li className="studio-linha" key={a.de}>
                  <span className="studio-celula studio-celula-rotulo studio-literal">
                    {a.de}
                  </span>
                  <span className="studio-celula">
                    aponta para <span className="studio-literal">{a.para}</span> — o apelido
                    continua funcionando, e a linguagem canônica é uma só.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">As procedências, e quem produz cada uma</h2>
        </div>
        <p className="studio-nota">
          Conceder um papel é autorizar um valor desta coluna. As três primeiras existem no
          acervo; as outras a produção abre — e trazem essa declaração em vez de um zero, que
          afirmaria uma medição que ninguém fez.
        </p>
        <ul className="studio-tabela admin-niveis">
          <li className="studio-linha">
            <span className="studio-celula studio-celula-rotulo">Procedência</span>
            <span className="studio-celula studio-celula-rotulo">Quem produz</span>
            <span className="studio-celula studio-celula-rotulo">Nós · ligações</span>
          </li>
          {dados.procedencias.map((f) => (
            <li className="studio-linha" key={f.valor}>
              <span className="studio-celula studio-celula-rotulo studio-literal">
                {f.valor}
              </span>
              <span className="studio-celula">{f.quemProduz}</span>
              <span className="studio-celula">
                {f.existeHoje ? `${f.nos} · ${f.arestas}` : f.nos}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
