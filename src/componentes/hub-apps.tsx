import Link from "next/link";
import { ATALHOS_BASTIDOR, GRUPOS_APPS, TOTAL_APPS, type Atalho } from "@/dados/apps";

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
 * O RITMO É INTENCIONAL, e é o que impede a grade de virar planilha — quatro
 * ritmos que giram com a posição do grupo, descritos logo abaixo. Sem isso,
 * catorze retângulos iguais empilhados produzem exatamente o cansaço que a
 * reunião de 23/08 apontou («entrar num modo de lista ou de grid é ruim de
 * consumir»).
 *
 * O TEXTO SÓ ENTRA POR CIMA DA FOTO NO CARTAZ LARGO, e essa não é uma escolha
 * estética. Boa parte do acervo já tem TIPOGRAFIA GRAVADA na imagem: a categoria
 * inteira de podcast são thumbs com o letreiro do programa e o grafismo do Itaú
 * Cultural — as 16 candidatas medidas, sem exceção. Pôr «Cast» por cima disso é
 * título sobre título, e nenhum véu resolve. Nos cartazes pequenos o texto desce
 * para baixo da imagem; no largo, que recebe só fotografia limpa e tem 16:9 de
 * folga, ele fica por cima com véu.
 *
 * O CARTAZ NÃO MOSTRA O CRÉDITO DA FOTO. Aqui a imagem não é a obra, é a
 * AMOSTRA do que tem dentro do app — e onze «Foto: fulano» empilhados viravam
 * ruído embaixo de cada rótulo, num lugar onde ninguém está lendo procedência.
 * O nome de quem fez continua guardado em `src/dados/apps.ts` e continua visível
 * onde a imagem é o conteúdo: a capa do evento, o player, o catálogo de /play.
 *
 * BASTIDOR NÃO GANHA CAPA. Ver `src/dados/apps.ts`: ele é ferramenta, não
 * acervo, e uma foto ali prometeria conteúdo onde não há. Só aparece na web
 * porque no app cada uma dessas rotas se declara «só web» — anunciar no
 * telefone um caminho que termina em aviso é beco. Os atalhos de CONTA saíram
 * do hub em 23/08 e moram no menu do ícone de conta, no alto da tela.
 */

/**
 * OS QUATRO RITMOS DE GRUPO, e por que não é um só.
 *
 * O ritmo anterior era um só — em grupo de contagem ímpar, o primeiro cartaz
 * ocupa a largura toda e o resto cai em pares. Como três dos quatro grupos têm
 * três apps, a tela repetia «um grande em cima, dois pequenos embaixo» três
 * vezes seguidas, que é a planilha que o ritmo existia para evitar.
 *
 * Agora o ritmo gira com a POSIÇÃO do grupo, e nenhum se repete em sequência:
 *
 *   · **aberto** — o grande em cima, o resto em pares.
 *   · **fechado** — o grande embaixo.
 *   · **sanduíche** — faixa em cima, faixa embaixo, e o que fica no meio vira
 *     uma linha de capa pequena. É o ritmo de «Ler»: Notícias abre e Cursos
 *     fecha, com o Blog entre os dois.
 *   · **lado** — o grande em pé à esquerda, com dois empilhados à direita.
 *
 * Grupo de contagem par não recebe cartaz grande: dois cartazes iguais já são um
 * ritmo, e um deles esticado deixaria um buraco na fileira.
 */
const RITMOS = ["aberto", "fechado", "sanduiche", "lado"] as const;

type Ritmo = (typeof RITMOS)[number];

/**
 * O porte de CADA cartaz do grupo, na ordem em que eles aparecem. Vazio é o
 * cartaz padrão — capa 4:3 com o texto embaixo, dois por fileira.
 */
function portesDoGrupo(quantos: number, ritmo: Ritmo): string[] {
  const portes = new Array<string>(quantos).fill("");
  if (ritmo === "sanduiche") {
    portes[0] = "largo";
    portes[quantos - 1] = "largo";
    // O miolo vira LINHA e não cartaz meia-largura: sozinho entre duas faixas,
    // um cartaz de meia coluna deixaria a outra metade vazia.
    for (let i = 1; i < quantos - 1; i++) portes[i] = "linha";
    return portes;
  }
  if (quantos % 2 === 0) return portes;
  if (ritmo === "fechado") portes[quantos - 1] = "largo";
  else if (ritmo === "lado") portes[0] = "alto";
  else portes[0] = "largo";
  return portes;
}

function Cartaz({
  href,
  rotulo,
  descricao,
  capa,
  porte,
}: {
  href: string;
  rotulo: string;
  descricao: string;
  capa: { arquivo: string; alt: string };
  /** `largo`, `alto` ou vazio. Os dois primeiros levam o texto para cima da foto. */
  porte: string;
}) {
  return (
    <li className={porte ? `hub-cartaz hub-cartaz--${porte}` : "hub-cartaz"}>
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

      {GRUPOS_APPS.map((grupo, i) => {
        // O ritmo é a POSIÇÃO do grupo, não uma escolha por grupo: acrescentar
        // um app ou reordenar a lista continua alternando sozinho.
        const ritmo = RITMOS[i % RITMOS.length];
        const portes = portesDoGrupo(grupo.apps.length, ritmo);
        return (
          <section key={grupo.id} className="hub-grupo">
            <h2 className="tipo-titulo-3 font-bold">{grupo.rotulo}</h2>
            <ul className="hub-grade" data-ritmo={ritmo}>
              {grupo.apps.map((app, n) => (
                <Cartaz
                  key={app.id}
                  href={app.href}
                  rotulo={app.rotulo}
                  descricao={app.descricao}
                  capa={app.capa}
                  porte={portes[n]}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* «Sua conta» saiu daqui em 23/08: salvos, repertório e perfil moram no
          menu do ícone de conta, no alto da tela. Eles não são aplicativos — são
          o que é da pessoa —, e no fim de uma lista de capas ninguém os achava. */}
      <section className="hub-grupo hidden desk:block">
        <h2 className="tipo-titulo-3 font-bold">Bastidor</h2>
        <ListaAtalhos atalhos={ATALHOS_BASTIDOR} />
      </section>
    </div>
  );
}
