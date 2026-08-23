import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { Cartao as CartaoDTO, OrigemMotivo } from "@/dados/cartao";
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
 * As classes ausentes deste mapa — `termo`, `conteudo`, `midia`, `formacao`,
 * `publicacao` — NÃO TÊM ROTA nesta fase e por isso não recebem link principal. Fabricar
 * `/termo/[slug]` para o cartão parecer completo produziria 404 na demonstração ao vivo,
 * que é pior do que um cartão sem link.
 */
const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
  trilha: "/trilha",
};

function rotaDaEntidade(cartao: CartaoDTO): string | null {
  const base = ROTA_POR_CLASSE[cartao.classe];
  return base ? `${base}/${cartao.slug}/` : null;
}

/** A rota de explicação de D-33, criada pelo plano 02-02. Chave `{classe}_{slug}`. */
function rotaDaExplicacao(cartao: CartaoDTO): string {
  return `/descobrir/porque/${cartao.classe}_${cartao.slug}/`;
}

// ---------------------------------------------------------------------------
// Procedência do texto do motivo
// ---------------------------------------------------------------------------

const ROTULO_ORIGEM: Record<OrigemMotivo, string> = {
  escrito: "escrito no acervo",
  composto: "montado a partir da relação",
  "sem-aresta": "fora da caminhada",
};

const ROTULO_ESPECIAL: Record<NonNullable<CartaoDTO["especial"]>, string> = {
  curado: "Destaque curado",
  serendipidade: "Fora do seu repertório, de propósito",
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function Cartao({ cartao }: { cartao: CartaoDTO }) {
  const rota = rotaDaEntidade(cartao);

  const capa = (
    <CapaDeCartao
      titulo={cartao.titulo}
      classe={cartao.classe}
      linguagens={cartao.linguagens}
      imagem={cartao.imagem}
      creditoImagem={cartao.creditoImagem}
      className="h-24 w-full rounded-lg"
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

      {/* O cartão inteiro é link para a entidade — quando a rota existe. O link de
          explicação fica FORA deste bloco: link dentro de link é HTML inválido. */}
      {rota ? (
        <Link href={rota} className="flex flex-col gap-2 no-underline">
          {capa}
          {titulo}
        </Link>
      ) : (
        <div className="flex flex-col gap-2">
          {capa}
          {titulo}
        </div>
      )}

      {cartao.linguagens.length ? (
        <SelosDeLinguagem ids={cartao.linguagens} limite={3} />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* O selo de motivo. D-28: sem ele o cartão não deveria existir.       */}
      {/* ------------------------------------------------------------------ */}
      <p
        className="selo-motivo"
        data-motivo={cartao.motivo.texto}
        data-origem-motivo={cartao.motivo.origemMotivo}
      >
        <Grafismo
          variacao="barra"
          className="mt-0.5 h-3.5 w-auto shrink-0 text-acao-tinta"
        />
        <span>{cartao.motivo.texto}</span>
      </p>

      {cartao.assinatura ? (
        <p className="text-xs leading-snug text-tinta-2 italic">{cartao.assinatura}</p>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-[0.65rem] tracking-wide text-tinta-3 uppercase">
          motivo {ROTULO_ORIGEM[cartao.motivo.origemMotivo]}
          {cartao.saltos > 0 ? ` · ${cartao.saltos} salto${cartao.saltos > 1 ? "s" : ""}` : ""}
          {cartao.viaConcentrador ? " · via concentrador" : ""}
        </span>
        <Link
          href={rotaDaExplicacao(cartao)}
          className="text-xs font-semibold text-acao-tinta underline underline-offset-2"
        >
          por que isto apareceu?
        </Link>
      </footer>
    </article>
  );
}
