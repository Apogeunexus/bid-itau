import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import type { Cartao as CartaoDTO } from "@/dados/cartao";
import { rotaDaEntidade } from "@/dados/rotas";
import { rotuloDaClasse } from "@/lib/rotulos";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * cartao.tsx — a unidade de conteúdo de Descobrir.
 *
 * O SELO DE MOTIVO É O ELEMENTO MAIS IMPORTANTE DESTA TELA. É ele que separa mediação
 * legível de recomendador opaco, é ele que a banca vai fotografar, e é por causa dele que
 * a caminhada existe em vez de um score. Por isso ele tem peso visual de primeira ordem —
 * barra laranja, fundo próprio, tipografia forte — e não de legenda.
 *
 * Junto do texto vai a PROCEDÊNCIA do texto (T-02-05): «escrito no acervo» quando a
 * frase é a do Itaú Cultural, «montado a partir da relação» quando fomos nós que a
 * redigimos a partir de uma aresta que existe, e «fora da caminhada» no cartão de
 * serendipidade, que não tem aresta nenhuma. Sem essa linha, texto nosso passaria por
 * texto do acervo na primeira leitura de quem avalia.
 *
 * `data-motivo` e `data-origem-motivo` no elemento do selo são contrato de verificação:
 * os gates da fase leem esses atributos do HTML exportado para provar que nenhum cartão
 * chegou à tela sem explicação.
 *
 * A NOTA DE CURADORIA NÃO É MAIS RENDERIZADA AQUI (pedido de 2026-08-25). A frase que
 * declarava a procedência da trilha curada — «Curadoria humana, escrita pela curadoria…»
 * — é informação de bastidor, e o bastidor já a tem: a Redação assina a trilha
 * (`redacao-trilha.tsx`) e declara a procedência passo a passo. `cartao.assinatura`
 * continua no DTO, medido a partir da procedência, para quem consome o cartão fora
 * desta tela; o que saiu é a linha no app de quem visita.
 */

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------

/**
 * Classe → rota de entidade, conforme as 18 rotas que a fase 1 realmente exportou.
 * `pessoa` e `coletivo` caem em `/artista` porque artista é PAPEL e não classe (DADO-03);
 * `instituicao` e `espaco` caem em `/produtor` pelo mesmo motivo do lado de quem realiza.
 *
 * `trilha` aponta para `/trilha/[slug]`, que o plano 02-03 cria. É link para frente, não
 * link morto — e é ele que amarra os dois planos.
 *
 * A tabela vive em `rotas.ts` — editorial, mídia, formação, publicação e termo
 * passaram a ter página própria e não saem mais para o site do Itaú Cultural.
 */

function rotaDoCartao(cartao: CartaoDTO): string | null {
  return rotaDaEntidade(cartao.classe, cartao.slug);
}

/** A rota de explicação de D-33, criada pelo plano 02-02. Chave `{classe}_{slug}`. */
function rotaDaExplicacao(cartao: CartaoDTO): string {
  return `/descobrir/porque/${cartao.classe}_${cartao.slug}/`;
}

// ---------------------------------------------------------------------------
// Procedência do texto do motivo
// ---------------------------------------------------------------------------

const ROTULO_ESPECIAL: Record<NonNullable<CartaoDTO["especial"]>, string> = {
  curado: "Destaque curado",
  serendipidade: "Fora do seu repertório, de propósito",
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function Cartao({ cartao }: { cartao: CartaoDTO }) {
  const rota = rotaDoCartao(cartao);

  const capa = (
    <CapaDeCartao
      titulo={cartao.titulo}
      classe={cartao.classe}
      linguagens={cartao.linguagens}
      imagem={cartao.imagem}
      creditoImagem={cartao.creditoImagem}
      semPastilha
      className="cartao-capa h-24 w-full rounded-lg"
    />
  );

  const titulo = <h3 className="text-base leading-snug font-bold">{cartao.titulo}</h3>;

  return (
    <article className="cartao" data-especial={cartao.especial ?? undefined}>
      {cartao.especial ? (
        <p className="cartao-faixa">
          <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0" />
          {ROTULO_ESPECIAL[cartao.especial]}
        </p>
      ) : null}

      {/* A PASTILHA SAIU DA CAPA (2026-09). Ela dizia o mesmo que o chip de classe na
          linha de tags logo abaixo — duas etiquetas para um fato — e dividia o canto da
          foto com o crédito, deixando os dois cortados. O crédito ficou onde estava:
          procedência é argumento da proposta, não rodapé. */}
      {/* Capa e texto são irmãos, não um link envolvendo os dois: na web o
          destaque curado põe a foto ao lado do bloco de texto, e o selo de
          motivo (outro link) precisa viver nesse bloco sem aninhar âncoras. */}
      <div className="cartao-miolo">
        {rota ? (
          <Link href={rota} className="cartao-capa-link no-underline">
            {capa}
          </Link>
        ) : (
          capa
        )}
        <div className="cartao-texto">
          {rota ? (
            <Link href={rota} className="no-underline">
              {titulo}
            </Link>
          ) : (
            titulo
          )}

          {/* A DESCRIÇÃO DO ACERVO, sob a manchete (2026-08-25). É texto da fonte, não
              frase montada aqui — por isso ela some quando o registro não tem uma, em vez
              de cair no motivo como substituto. Trocar um pelo outro faria nossa frase
              passar por texto do Itaú Cultural na primeira leitura, que é o erro que a
              procedência do selo existe para evitar. 48 dos 75 cartões do feed têm
              descrição; os outros 27 mostram título e tags. */}
          {cartao.resumo ? (
            <p className="cartao-descricao m-0">{cartao.resumo}</p>
          ) : null}

          {/* CLASSE E MOTIVO NA MESMA LINHA DE PASTILHAS. O motivo deixou de ser a linha
              solta no pé do cartão e virou tag, com o desenho de «trilha» e «evento».
              Continua sendo o link para a explicação e continua carregando `data-motivo`
              e `data-origem-motivo` — mudou a forma, não a promessa de que todo cartão
              diz por que veio. O grafismo saiu junto: uma barra laranja ao lado da
              pastilha de classe faria as duas parecerem de espécies diferentes. */}
          <p className="cartao-tags m-0">
            <span className="cartao-tag">{rotuloDaClasse(cartao.classe)}</span>
            <Link
              href={rotaDaExplicacao(cartao)}
              className="selo-motivo cartao-tag no-underline"
              data-motivo={cartao.motivo.texto}
              data-origem-motivo={cartao.motivo.origemMotivo}
            >
              <span>{cartao.motivo.texto}</span>
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}
