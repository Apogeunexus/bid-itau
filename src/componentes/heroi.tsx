import Link from "next/link";
import { Comentario } from "@/componentes/comentario";
import { Grafismo } from "@/componentes/grafismo";
import { HEROIS } from "@/dados/heroi";

/**
 * heroi.tsx — a abertura de Descobrir, com a foto sorteada a cada carregamento.
 *
 * COMPONENTE DE SERVIDOR. Ele renderiza os OITO slides, com o alt e o crédito de
 * cada um, e esconde sete. Quem escolhe qual aparece é o atributo `data-heroi`
 * que `public/antes-da-pintura.js` escreve no `<html>` antes da primeira pintura.
 *
 * POR QUE ISSO NÃO PISCA E NÃO DIVERGE NA HIDRATAÇÃO. O HTML do build é idêntico
 * em todo carregamento — não há nada de aleatório nele. A única mutação de
 * cliente é um atributo no `<html>`, escrito por um script bloqueante antes de o
 * React existir, num elemento cujo atributo o React nunca reconcilia. Sem
 * JavaScript, a regra de CSS cai no primeiro slide e o hero funciona igual.
 *
 * POR QUE `background-image` E NÃO `<img>`. Um `<img src>` dentro de um elemento
 * com `display: none` É BAIXADO pelo Chrome — oito imagens de ~60 KB viajariam
 * para mostrar uma. `background-image` de elemento oculto não é buscado. O `alt`
 * e o crédito continuam por slide e vindos do servidor, então a acessibilidade
 * não paga o preço da otimização: cada figura tem `role="img"` com o seu próprio
 * `aria-label`, e a que está escondida some do fluxo inteira.
 *
 * `next/image` continua fora, pela razão que `capa-sem-imagem.tsx` já registra:
 * sob `output: "export"` com `images.unoptimized`, ele vira peso sem benefício.
 */
/**
 * O id do bloco de feed, exportado para que o alvo da âncora e o próprio alvo
 * não possam divergir: quem escreve o `id` importa a mesma constante que quem
 * escreve o `href`. Um botão «explorar agora» que rola para lugar nenhum é o
 * tipo de defeito que só aparece quando alguém clica.
 */
export const ANCORA_DO_FEED = "comeco-do-feed";

export function Heroi() {
  return (
    <section className="heroi">
      <div className="heroi-trilho">
        {HEROIS.map((h, i) => (
          <figure key={h.arquivo} className="heroi-slide" data-heroi-slide={i}>
            <div
              role="img"
              aria-label={h.alt}
              className="heroi-foto"
              style={{ backgroundImage: `url("/acervo/${h.arquivo}")` }}
            />
            <figcaption className="heroi-credito">{h.credito}</figcaption>
          </figure>
        ))}
      </div>

      {/* O grafismo do manual (p.17): o «C» e a barra inclinada por cima, cortada
          em cerca de dois terços — que é literalmente o que o manual pede para o
          «\C cortado». A cor da barra vem do CSS, e não daqui: `--ic-lilas` e
          irmãs são proibidas em .tsx, e a cor de apoio nunca é decidida em
          TypeScript. Decorativo de ponta a ponta, logo `aria-hidden`. */}
      <div className="heroi-marca" aria-hidden>
        <Grafismo variacao="completo" className="heroi-marca-c" />
        <Grafismo variacao="barra" className="heroi-marca-barra" />
      </div>

      <div className="heroi-texto">
        {/* `<p>` e não `<h1>`, apesar de ser o maior texto da tela. O `<h1>` desta
            rota é «Descobrir», logo abaixo — é ele que diz ONDE a pessoa está, e
            é o que as outras trinta telas usam. Esta frase é chamada, não
            estrutura: promovê-la a cabeçalho daria dois `<h1>` à página e faria
            a navegação por cabeçalhos anunciar um slogan no lugar do nome da
            tela. Quem lê com os olhos vê o tamanho; quem lê com leitor de tela
            recebe o texto no fluxo, na ordem certa. */}
        <p className="heroi-titulo">Descubra a cultura que move</p>
        <p className="heroi-linha">
          Programação, exposições, obras e artistas — do acervo inteiro, não do que está em
          cartaz esta semana.
        </p>
        {/* Âncora e não rota: o feed está logo abaixo, nesta mesma tela, e mandar
            para outra página quem já chegou onde queria seria um desvio. O alvo
            é `descobrir/page.tsx`, que carrega o id.

            O nome NÃO é «feed» por um motivo bobo e real: `#feed` são quatro
            dígitos hexadecimais válidos, e o portão que proíbe hex fora de
            globals.css o acusou como cor. Um portão que confunde âncora com cor
            é um falso positivo; um nome que não parece cor custa nada. */}
        <Link href={`#${ANCORA_DO_FEED}`} className="heroi-botao">
          Explorar agora
        </Link>
      </div>

      <Comentario className="heroi-nota">
        A foto muda a cada carregamento, sorteada entre oito imagens do próprio acervo. As
        oito foram medidas por script — proporção, tamanho e quanto o canto inferior esquerdo
        varia, que é onde este texto entra — e depois olhadas uma a uma. O crédito de cada uma
        vem do acervo, não de um palpite.
      </Comentario>
    </section>
  );
}
