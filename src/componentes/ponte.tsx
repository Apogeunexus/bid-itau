import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import type { GrupoVinculo, ItemVinculo } from "@/dados/ponte";

/**
 * ponte.tsx — o bloco de RELAÇÃO NOMEADA, usado pela página do artista e pela do evento.
 *
 * D-40 é mais exigente do que parece na primeira leitura: a navegação tem de ser
 * bidirecional E a conexão tem de aparecer como relação nomeada, não como link solto. Um
 * «ver mais» azul navega corretamente e mesmo assim reprova — porque quem lê a tela não
 * fica sabendo QUE VÍNCULO existe entre as duas pontas. É essa diferença que separa a
 * ponte Enciclopédia↔agenda de um hiperlink.
 *
 * Daí a forma deste componente:
 *   - o CABEÇALHO é a relação escrita em português («Atua como artista em», «Quem atua, e
 *     com que papel», «Quem realiza») — a relação nunca fica implícita na seta;
 *   - cada ITEM carrega o papel VISÍVEL, em pastilha, quando a aresta trouxer papel;
 *   - item de classe sem rota nesta fase aparece sem link, com o mesmo tratamento que
 *     `cartao.tsx` dá ao caso — link para rota inexistente é 404 na demonstração ao vivo.
 *
 * GRUPO VAZIO RENDERIZA A FRASE. Nunca some. Um bloco que desaparece faz parecer que a
 * categoria não existe no produto; um bloco que declara a ausência prova que ela existe e
 * que o dado é que não veio. Nas páginas de evento datado esse é o caso da maioria.
 *
 * CONTRATO DE VERIFICAÇÃO — os gates da fase leem estes atributos do HTML exportado, e é
 * assim que se prova que a conexão está NOMEADA e não apenas linkada:
 *   `data-ponte`         a relação do bloco
 *   `data-vinculo`       `{relacao}:{papel ou vazio}` em cada item
 *   `data-ponte-ausente` a frase de ausência, com a chave do grupo
 */

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function LinhaVinculo({ grupo, item }: { grupo: GrupoVinculo; item: ItemVinculo }) {
  const miolo = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-semibold">{item.titulo}</span>
        <span className="block text-[0.65rem] tracking-widest text-black/45 uppercase">
          {item.classe}
        </span>
      </span>
      {/* O PAPEL, VINDO DA ARESTA (D-41). Ele é o que faz a linha ser um vínculo nomeado
          e não um link: sem esta pastilha, «A. Mattera» e «Paço Imperial» pareceriam a
          mesma coisa dentro do mesmo bloco. */}
      {item.papel ? (
        <span className="shrink-0 self-start rounded-full border border-acao px-2 py-0.5 text-xs font-bold text-acao">
          {item.papel}
        </span>
      ) : null}
    </>
  );

  return (
    <li
      data-vinculo={`${grupo.relacao ?? ""}:${item.papel ?? ""}`}
      className="border-t border-black/10 first:border-t-0"
    >
      {item.rota ? (
        <Link
          href={item.rota}
          className="flex items-baseline gap-2 py-2 text-sm no-underline hover:bg-black/[0.03]"
        >
          {miolo}
        </Link>
      ) : (
        <div className="flex items-baseline gap-2 py-2 text-sm">{miolo}</div>
      )}

      {/* Só o texto ESCRITO NO ACERVO aparece por extenso. O texto composto por nós já
          está dito no cabeçalho do bloco, e repeti-lo em cada linha transformaria a
          relação nomeada em ruído. T-02-05: quando o texto é do Itaú Cultural, isso é
          declarado — sem a linha, frase nossa passaria por frase do acervo. */}
      {item.motivo.origemMotivo === "escrito" ? (
        <p className="pb-2 text-xs leading-snug text-black/55">
          {item.motivo.texto}{" "}
          <span className="text-[0.65rem] tracking-wide text-black/40 uppercase">
            · escrito no acervo
          </span>
        </p>
      ) : null}

      {/* D-19/D-20: toda coordenada do projeto é derivada, e o método é para ser dito. */}
      {item.coordenada ? (
        <p className="pb-2 text-[0.65rem] tracking-wide text-black/40 uppercase">
          coordenada derivada · {item.coordenada.metodo}
        </p>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Bloco
// ---------------------------------------------------------------------------

export function BlocoPonte({
  grupo,
  rotulo,
  className,
}: {
  grupo: GrupoVinculo;
  /** Sobrescreve o rótulo do grupo quando a tela quer nomear a relação com outra frase. */
  rotulo?: string;
  className?: string;
}) {
  const vazio = grupo.entidades.length === 0;
  const cortado = grupo.total > grupo.entidades.length;

  return (
    <section
      data-ponte={grupo.relacao ?? grupo.chave}
      data-ponte-sentido={grupo.sentido}
      className={`flex flex-col gap-1 ${className ?? ""}`}
    >
      <h3 className="flex items-baseline gap-1.5 text-sm font-bold">
        <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao" />
        {rotulo ?? grupo.rotulo}
        {!vazio ? (
          <span className="text-xs font-normal text-black/45">
            {grupo.total} {grupo.total === 1 ? "vínculo" : "vínculos"}
          </span>
        ) : null}
      </h3>

      {vazio ? (
        <p
          data-ponte-ausente={grupo.chave}
          className="rounded-lg border border-dashed border-black/20 p-2.5 text-xs leading-relaxed text-black/60"
        >
          {grupo.fraseDeAusencia}
        </p>
      ) : (
        <>
          <ul className="flex flex-col">
            {grupo.entidades.map((item) => (
              <LinhaVinculo key={`${grupo.chave}-${item.id}`} grupo={grupo} item={item} />
            ))}
          </ul>
          {/* T-02-17: o teto é declarado em vez de silencioso. O evento de demonstração
              tem 37 arestas `realiza`, e renderizar as 37 travaria a tela sem informar
              mais nada — mas cortar sem dizer faria a tela mentir por omissão. */}
          {cortado ? (
            <p className="text-xs text-black/50">
              Mostrando {grupo.entidades.length} de {grupo.total} — o acervo declara os
              outros {grupo.total - grupo.entidades.length}, e este protótipo corta a
              lista para caber na tela.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * A mesma frase de ausência, para um bloco que a tela promete e que não vem de uma
 * relação do vocabulário. Mantém o mesmo tratamento visual e o mesmo atributo de
 * verificação — o que interessa é que a ausência seja SEMPRE declarada do mesmo jeito.
 */
export function BlocoAusenciaDeclarada({
  chave,
  rotulo,
  frase,
  className,
}: {
  chave: string;
  rotulo: string;
  frase: string;
  className?: string;
}) {
  return (
    <section data-ponte={chave} className={`flex flex-col gap-1 ${className ?? ""}`}>
      <h3 className="flex items-baseline gap-1.5 text-sm font-bold">
        <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao" />
        {rotulo}
      </h3>
      <p
        data-ponte-ausente={chave}
        className="rounded-lg border border-dashed border-black/20 p-2.5 text-xs leading-relaxed text-black/60"
      >
        {frase}
      </p>
    </section>
  );
}
