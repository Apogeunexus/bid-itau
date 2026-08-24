import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import type { Cartao as CartaoDTO } from "@/dados/cartao";
import { rotaDaEntidade } from "@/dados/rotas";
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

/** Classe da ontologia → o nome da categoria na tag. Espelha `buscar.tsx`. */
const ROTULO_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  conteudo: "editorial",
  pessoa: "pessoa",
  midia: "mídia",
  termo: "verbete",
  territorio: "território",
  evento: "evento",
  instituicao: "instituição",
  obra: "obra",
  coletivo: "coletivo",
  espaco: "espaço",
  tema: "tema",
  formacao: "formação",
  publicacao: "publicação",
  linguagem: "linguagem",
  trilha: "trilha",
};

function rotuloDaClasse(classe: ClasseEntidade): string {
  return ROTULO_CLASSE[classe] ?? classe;
}

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

          <p className="m-0">
            <span className="inline-flex items-center rounded-full border border-borda-forte px-2.5 py-0.5 text-sm leading-tight font-semibold">
              {rotuloDaClasse(cartao.classe)}
            </span>
          </p>

          <Link
            href={rotaDaExplicacao(cartao)}
            className="selo-motivo no-underline"
            data-motivo={cartao.motivo.texto}
            data-origem-motivo={cartao.motivo.origemMotivo}
          >
            <Grafismo
              variacao="barra"
              className="h-3 w-auto shrink-0 text-acao-tinta"
            />
            <span>{cartao.motivo.texto}</span>
          </Link>

          {cartao.assinatura ? (
            <p className="tipo-legenda text-tinta-2 italic">{cartao.assinatura}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
