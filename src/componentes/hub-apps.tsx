import Link from "next/link";
import { ATALHOS_BASTIDOR, ATALHOS_CONTA, GRUPOS_APPS, TOTAL_APPS, type Atalho } from "@/dados/apps";

/**
 * hub-apps.tsx — a tela que o quinto botão da barra abre: os aplicativos que
 * moram dentro deste aplicativo.
 *
 * POR QUE CAPA E NÃO ÍCONE. Um hub de quinze itens desenhado com rótulo e
 * traço é uma lista de links com espaçamento generoso: quem chega aqui sem
 * saber o que procura sai do mesmo jeito, porque «Museu virtual» e «Cast» têm
 * exatamente o mesmo peso visual e nenhum dos dois mostra o que tem dentro. A
 * capa faz o trabalho que o rótulo não faz — ela é uma AMOSTRA do acervo
 * daquele app, não uma ilustração dele.
 *
 * O RITMO É INTENCIONAL, e é o que impede a grade de virar planilha: em grupo
 * de contagem ímpar o primeiro cartaz ocupa a largura toda em 16:9 e o resto
 * cai em pares 4:3. Sem isso, quinze retângulos iguais empilhados produzem
 * exatamente o cansaço que a reunião de 23/08 apontou («entrar num modo de
 * lista ou de grid é ruim de consumir»).
 *
 * O TEXTO SÓ ENTRA POR CIMA DA FOTO NO CARTAZ LARGO, e essa não é uma escolha
 * estética. Boa parte do acervo já tem TIPOGRAFIA GRAVADA na imagem: a categoria
 * inteira de podcast são thumbs com o letreiro do programa e o grafismo do Itaú
 * Cultural — as 16 candidatas medidas, sem exceção. Pôr «Cast» por cima disso é
 * título sobre título, e nenhum véu resolve. Nos cartazes pequenos o texto desce
 * para baixo da imagem; no largo, que recebe só fotografia limpa e tem 16:9 de
 * folga, ele fica por cima com véu.
 *
 * CONTA E BASTIDOR NÃO GANHAM CAPA. Ver `src/dados/apps.ts`: os dois são
 * ferramenta, não acervo, e uma foto ali prometeria conteúdo onde não há.
 * Bastidor só aparece na web porque no app cada uma dessas rotas se declara
 * «só web» — anunciar no telefone um caminho que termina em aviso é beco.
 */

function Cartaz({
  href,
  rotulo,
  descricao,
  capa,
}: {
  href: string;
  rotulo: string;
  descricao: string;
  capa: { arquivo: string; alt: string; credito: string };
}) {
  return (
    <li className="hub-cartaz">
      <Link href={href} className="hub-cartaz-link">
        <span className="hub-cartaz-quadro">
          {/* `next/image` está fora do projeto por decisão registrada em
              capa-sem-imagem.tsx: sob `output: "export"` com
              `images.unoptimized`, ele só acrescentaria peso ao pacote. */}
          <img src={`/acervo/${capa.arquivo}`} alt={capa.alt} className="hub-cartaz-foto" loading="lazy" />
          <span className="hub-cartaz-veu" aria-hidden />
        </span>
        <span className="hub-cartaz-texto">
          <span className="hub-cartaz-rotulo tipo-titulo-3">{rotulo}</span>
          <span className="hub-cartaz-descricao tipo-legenda">{descricao}</span>
          <span className="hub-cartaz-credito tipo-micro">Foto: {capa.credito}</span>
        </span>
      </Link>
    </li>
  );
}

function ListaAtalhos({ atalhos }: { atalhos: readonly Atalho[] }) {
  return (
    <ul className="hub-atalhos">
      {atalhos.map((atalho) => (
        <li key={atalho.href}>
          <Link href={atalho.href} className="hub-atalho">
            <span className="hub-atalho-rotulo tipo-detalhe">{atalho.rotulo}</span>
            <span className="hub-atalho-descricao tipo-legenda">{atalho.descricao}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HubApps() {
  return (
    <div className="hub">
      <header className="hub-cabecalho">
        <p className="tipo-micro text-tinta-3">Itaú Cultural</p>
        <h1 className="tipo-cartaz font-bold">Tudo num lugar só</h1>
        <p className="tipo-detalhe text-tinta-2">
          {TOTAL_APPS} aplicativos reunidos. Toque para entrar em um deles.
        </p>
      </header>

      {GRUPOS_APPS.map((grupo) => (
        <section key={grupo.id} className="hub-grupo">
          <h2 className="tipo-titulo-3 font-bold">{grupo.rotulo}</h2>
          <ul className="hub-grade">
            {grupo.apps.map((app) => (
              <Cartaz
                key={app.id}
                href={app.href}
                rotulo={app.rotulo}
                descricao={app.descricao}
                capa={app.capa}
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="hub-grupo">
        <h2 className="tipo-titulo-3 font-bold">Sua conta</h2>
        <ListaAtalhos atalhos={ATALHOS_CONTA} />
      </section>

      <section className="hub-grupo hidden desk:block">
        <h2 className="tipo-titulo-3 font-bold">Bastidor</h2>
        <ListaAtalhos atalhos={ATALHOS_BASTIDOR} />
      </section>
    </div>
  );
}
