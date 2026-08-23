import type { ReactNode } from "react";
import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { BlocoAusenciaDeclarada, BlocoPonte } from "@/componentes/ponte";
import { linguagemPorId, SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import type { GrupoVinculo } from "@/dados/ponte";
import type { ClasseEntidade, Procedencia } from "@/dados/tipos";

/**
 * produtor.tsx — a tela 24 de `docs/telas.md`, APPX-05, o fluxo que o RFP cita pelo nome.
 *
 * O objetivo da tela, escrito na fonte: «o agente como entidade viva no grafo, não como
 * página institucional». A diferença entre as duas coisas é inteira aqui — uma página
 * institucional diz quem a instituição é; uma entidade viva mostra o que ela faz, onde,
 * com quem, e em que linguagem, e cada uma dessas quatro respostas é uma ARESTA que se
 * pode conferir, não um parágrafo que alguém escreveu.
 *
 * DP-F: este arquivo NÃO alcança `@/dados/grafo`, nem transitivamente. Tudo o que ele
 * desenha chega por propriedade, montado na página de servidor, e o único import que
 * atravessa a fronteira é de TIPO. Ele também não é `"use client"`: não tem estado nem
 * evento, e um componente de servidor a menos no gate de fronteira é um risco a menos.
 *
 * ------------------------------------------------------------------------------------
 * O QUE FOI MEDIDO CONTRA O GRAFO, E DECIDE O DESENHO DAQUI
 *
 * São 359 produtores — 246 instituições e 113 espaços — e as duas classes produzem
 * páginas MUITO diferentes deste mesmo arquivo, do mesmo jeito que o evento da
 * Enciclopédia e o do CMS produzem duas fichas diferentes de `evento/[slug]`:
 *
 *   - as 246 INSTITUIÇÕES declaram linguagem (246 de 246), têm verbete em 24 casos,
 *     realizam evento em 127 casos e território em 213;
 *   - os 113 ESPAÇOS têm território em 113 de 113 e verbete em 113 de 113, não declaram
 *     linguagem nenhuma, não realizam nada — e 87 deles ACOLHEM evento por `situado_em`
 *     chegando, que é a única aresta de programação que um espaço tem no acervo.
 *
 * **NENHUM dos 359 realiza ou acolhe evento com ocorrência datada.** Zero. É a mesma
 * lacuna que a fase 2 registrou por escrito na ponte: dos 129 eventos com sessão, zero
 * têm aresta de agente; dos 54 com elenco, zero têm sessão. Por isso «o que está em
 * cartaz agora» — bloco OBRIGATÓRIO da tela 24 — não pode ser preenchido em nenhuma das
 * 359 páginas.
 *
 * A resposta a isso é D-90 e não é negociável: o bloco NÃO SOME e NÃO APARECE ZERADO SEM
 * EXPLICAÇÃO. Ele declara a ausência com o denominador medido, diz por que o número é o
 * que é, e nomeia o que fecharia a lacuna. Autorar uma aresta produtor→evento datado para
 * encher a tela seria afirmar que uma organização real realiza um evento real numa data —
 * uma alegação factual falsa sobre gente que existe, e o oposto exato do que este
 * protótipo defende.
 *
 * NENHUM BLOCO SOME POR ESTAR VAZIO. Onde falta dado, entra `<BlocoAusenciaDeclarada>`,
 * o mesmo mecanismo que a fase 2 já pagou — e cada ausência leva o SEU denominador. «Este
 * produtor não declara linguagem; 246 dos 359 declaram» diz mais, e mente menos, que
 * «sem linguagens».
 * ------------------------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Contrato com a página — só primitivo
// ---------------------------------------------------------------------------

/** Um evento que este produtor realiza ou acolhe. */
export interface EventoDoProdutor {
  id: string;
  titulo: string;
  rota: string | null;
  /** Tem ocorrência datada? Medido no build. Hoje é `false` nos 527 + 101 casos. */
  datado: boolean;
  /** A data que o registro declara, transcrita como a fonte a escreveu. */
  dataDeclarada: string | null;
}

/**
 * Uma pessoa ou coletivo alcançável a DOIS SALTOS: ela atua num evento que este produtor
 * realiza (ou acolhe). O papel vem da aresta `atua_em` e de mais lugar nenhum (D-41,
 * DADO-03) — papel não é campo do agente, é propriedade do vínculo.
 */
export interface PessoaLigada {
  id: string;
  titulo: string;
  classe: string;
  rota: string | null;
  papel: string | null;
  /** Por qual aresta o produtor chega ao evento em que esta pessoa atua. */
  via: "realiza" | "acolhe";
  /** O evento do meio do caminho. É ele que faz a ligação ser NOMEADA. */
  evento: string;
  eventoRota: string | null;
}

/** Os denominadores, medidos contra os 359 no build. Nunca digitados à mão. */
export interface NumerosDosProdutores {
  total: number;
  instituicoes: number;
  espacos: number;
  comTerritorio: number;
  comLinguagem: number;
  comRealiza: number;
  comAcolhe: number;
  comPessoas: number;
  comEditorial: number;
  comEventoDatado: number;
  comVerbete: number;
  arestasRealiza: number;
  arestasAcolhe: number;
  arestasLinguagem: number;
  arestasTerritorio: number;
}

export interface ProdutorExibivel {
  id: string;
  slug: string;
  titulo: string;
  classe: ClasseEntidade;
  procedencia: Procedencia;
  resumo?: string;
  fonte?: string;
  imagem?: string;
  creditoImagem?: string;
  linguagens: string[];
  /** `situado_em` saindo daqui: território e, quando houver, espaço. */
  territorio?: GrupoVinculo;
  /** `fala_sobre` e `aprofunda` chegando aqui. */
  editorial: GrupoVinculo[];
  realiza: EventoDoProdutor[];
  realizaTotal: number;
  acolhe: EventoDoProdutor[];
  acolheTotal: number;
  pessoas: PessoaLigada[];
  pessoasTotal: number;
  /** Quantos dos eventos realizados ou acolhidos têm ocorrência datada. */
  datados: number;
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/**
 * A casca de um bloco da tela 24. Vazio ele não some: vira a frase de ausência de
 * `ponte.tsx`, com o mesmo `data-ponte-ausente` que os gates da fase 2 já leem — e com o
 * denominador dentro da frase, que é o que separa uma declaração de um «nenhum resultado».
 */
function BlocoDoProdutor({
  chave,
  rotulo,
  vazio,
  frase,
  contagem,
  children,
}: {
  chave: string;
  rotulo: string;
  vazio: boolean;
  frase: string;
  contagem?: string;
  children?: ReactNode;
}) {
  return (
    <section data-bloco-produtor={chave} className="pr-bloco flex flex-col gap-2">
      {vazio ? (
        <BlocoAusenciaDeclarada chave={chave} rotulo={rotulo} frase={frase} />
      ) : (
        <>
          <h2 className="flex items-baseline gap-1.5 text-sm font-bold">
            <Grafismo
              variacao="barra"
              className="h-3.5 w-auto shrink-0 text-acao-tinta"
            />
            {rotulo}
            {contagem ? (
              <span className="text-xs font-normal text-tinta-3">{contagem}</span>
            ) : null}
          </h2>
          {children}
        </>
      )}
    </section>
  );
}

/** Um número que sustenta uma frase. O rótulo diz DE QUE ele é denominador. */
function Denominador({ chave, valor, rotulo }: { chave: string; valor: number; rotulo: string }) {
  return (
    <li data-denominador={chave} className="pr-denominador">
      <span className="pr-denominador-numero">{valor}</span>
      <span className="pr-denominador-rotulo">{rotulo}</span>
    </li>
  );
}

/** Uma linha de evento realizado ou acolhido. Sem `<Cartao>`: cartão carrega o texto de
 *  uma aresta `semelhante_a`, e «realiza» não é essa aresta — carimbar um motivo composto
 *  afirmaria uma relação que o grafo não tem. */
function LinhaDeEvento({ evento }: { evento: EventoDoProdutor }) {
  const miolo = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-semibold">{evento.titulo}</span>
        <span className="block text-[0.65rem] tracking-widest text-tinta-3 uppercase">
          evento{evento.dataDeclarada ? ` · ${evento.dataDeclarada}` : ""}
        </span>
      </span>
      {evento.datado ? (
        <span className="shrink-0 self-start rounded-full border border-acao px-2 py-0.5 text-xs font-bold text-acao-tinta">
          com sessão datada
        </span>
      ) : null}
    </>
  );

  return (
    <li className="border-t border-borda first:border-t-0">
      {evento.rota ? (
        <Link
          href={evento.rota}
          className="flex items-baseline gap-2 py-2 text-sm no-underline hover:bg-superficie-2"
        >
          {miolo}
        </Link>
      ) : (
        <div className="flex items-baseline gap-2 py-2 text-sm">{miolo}</div>
      )}
    </li>
  );
}

/**
 * Uma pessoa ligada, com o CAMINHO INTEIRO escrito na linha.
 *
 * É aqui que a tese da proposta vira pixel: não basta que o link exista, a relação tem de
 * estar NOMEADA (D-40). «A. Mattera · artista · atua em «B-A-B-I-L-A-Q-U-E-S», que esta
 * instituição realiza» é uma frase que se pode conferir aresta por aresta. Um «ver mais»
 * azul navegaria igual e não diria nada.
 */
function LinhaDePessoa({ pessoa }: { pessoa: PessoaLigada }) {
  return (
    <li className="border-t border-borda py-2 text-sm first:border-t-0">
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1">
          {pessoa.rota ? (
            <Link href={pessoa.rota} className="leading-snug font-semibold no-underline">
              {pessoa.titulo}
            </Link>
          ) : (
            <span className="leading-snug font-semibold">{pessoa.titulo}</span>
          )}
          <span className="block text-[0.65rem] tracking-widest text-tinta-3 uppercase">
            {pessoa.classe}
          </span>
        </span>
        {pessoa.papel ? (
          <span className="shrink-0 self-start rounded-full border border-acao px-2 py-0.5 text-xs font-bold text-acao-tinta">
            {pessoa.papel}
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs leading-snug text-tinta-2">
        atua em{" "}
        {pessoa.eventoRota ? (
          <Link href={pessoa.eventoRota} className="font-semibold">
            {pessoa.evento}
          </Link>
        ) : (
          <span className="font-semibold">{pessoa.evento}</span>
        )}
        {pessoa.via === "realiza"
          ? ", que esta entrada realiza"
          : ", que acontece neste espaço"}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function Produtor({
  produtor,
  numeros,
}: {
  produtor: ProdutorExibivel;
  numeros: NumerosDosProdutores;
}) {
  const ehEspaco = produtor.classe === "espaco";
  /* `SelosDeLinguagem` devolve `null` quando NENHUM dos ids está no vocabulário
     promovido — e um bloco com cabeçalho e nada embaixo é o «vazio silencioso»
     que esta tela existe para não ter. O vazio é medido aqui, no mesmo critério
     que o componente usa para desenhar. */
  const linguagensConhecidas = produtor.linguagens.filter((id) => linguagemPorId(id));
  const editorialTotal = produtor.editorial.reduce((n, g) => n + g.total, 0);
  const temEditorial = editorialTotal > 0;

  /** A frase de «em cartaz», montada dos números medidos e não de um literal. */
  const fraseDoCartaz =
    `Nenhum dos ${numeros.total} produtores do acervo tem programação futura, e este não é ` +
    `exceção. Os ${numeros.arestasRealiza} eventos que as instituições realizam e os ` +
    `${numeros.arestasAcolhe} que os espaços acolhem vêm da Enciclopédia Itaú Cultural, que ` +
    `documenta o que aconteceu — com data histórica transcrita — e não o que está em cartaz. ` +
    `Os com evento datado são ${numeros.comEventoDatado} porque as duas metades do acervo não ` +
    `se tocam: as sessões vêm da agenda do site, e os 100 registros de lá chegam sem agente ` +
    `nenhum. Programação futura é o que entra por aqui quando o produtor publicar no Studio. ` +
    `Não inventamos a ligação que encheria este bloco.`;

  return (
    <div className="pr-tela flex flex-col gap-6 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      {/* 1 — NOME, IMAGEM E PROCEDÊNCIA ---------------------------------- */}
      <section
        data-bloco-produtor="identificacao"
        className="pr-identificacao flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <CapaDeCartao
            titulo={produtor.titulo}
            classe={produtor.classe}
            linguagens={produtor.linguagens}
            imagem={produtor.imagem}
            creditoImagem={produtor.creditoImagem}
            className="h-28 w-24 shrink-0 rounded-xl"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl leading-tight font-bold">{produtor.titulo}</h1>
            <p className="text-[0.65rem] tracking-widest text-tinta-3 uppercase">
              {ehEspaco ? "espaço" : "instituição"} · procedência {produtor.procedencia}
            </p>
            {/* O «selo de verificação» que a tela 24 pede é, neste acervo, a
                PROCEDÊNCIA: quem verifica é o Itaú Cultural, e o que se pode
                mostrar é de onde o registro veio e o endereço para conferir.
                Um selo azul de «verificado» sem processo de verificação atrás
                seria enfeite afirmando uma checagem que ninguém fez. */}
            <p className="text-xs leading-relaxed text-tinta-2">
              {produtor.fonte
                ? "Registro do acervo do Itaú Cultural, conferível na fonte — é essa procedência, e não um selo, que sustenta a entrada."
                : "Registro do acervo do Itaú Cultural. Esta entrada não traz endereço de fonte para conferência."}
            </p>
          </div>
        </div>

        {/* O VERBETE, EMBUTIDO E COM CRÉDITO (D-39). Medido: 137 dos 359 têm
            texto — os 113 espaços e 24 das 246 instituições. Onde não há, o
            bloco declara em vez de sumir. */}
        <Verbete entidade={produtor} />
      </section>

      {/* 2 — TERRITÓRIO E ESPAÇO ------------------------------------------ */}
      <section data-bloco-produtor="territorio" className="pr-bloco pr-territorio flex flex-col gap-2">
        {produtor.territorio ? (
          <BlocoPonte grupo={produtor.territorio} rotulo="Território e espaço" />
        ) : (
          <BlocoAusenciaDeclarada
            chave="territorio"
            rotulo="Território e espaço"
            frase={`O acervo não situa esta entrada em nenhum território. ${numeros.comTerritorio} dos ${numeros.total} produtores têm território por ${numeros.arestasTerritorio} ligações «situado_em» — os ${numeros.espacos} espaços, todos, e ${numeros.comTerritorio - numeros.espacos} das ${numeros.instituicoes} instituições.`}
          />
        )}
      </section>

      {/* 3 — O QUE ESTÁ EM CARTAZ AGORA ----------------------------------- */}
      {/*                                                                    */}
      {/* D-90 em estado puro, e o bloco mais difícil desta tela: ele é       */}
      {/* obrigatório na tela 24, o acervo não o sustenta em NENHUMA das 359  */}
      {/* páginas, e ele não pode sumir nem aparecer zerado sem explicação.   */}
      {/*                                                                    */}
      {/* Ele fica FORA de <Comentario>: é produto, não nota de protótipo, e  */}
      {/* tem de continuar na tela com o modo comentado desligado, como as    */}
      {/* declarações de honestidade da fase 4.                              */}
      <section
        data-bloco-produtor="em-cartaz"
        data-nao-sustenta="programacao-futura"
        className="pr-bloco pr-cartaz flex flex-col gap-2"
      >
        <h2 className="flex items-baseline gap-1.5 text-sm font-bold">
          <Grafismo variacao="barra" className="h-3.5 w-auto shrink-0 text-acao-tinta" />
          O que está em cartaz agora
        </h2>
        <p className="pr-cartaz-frase">{fraseDoCartaz}</p>
        <ul className="pr-denominadores">
          <Denominador chave="produtores" valor={numeros.total} rotulo="produtores no acervo" />
          <Denominador
            chave="com-realiza"
            valor={numeros.comRealiza}
            rotulo="realizam algum evento"
          />
          <Denominador
            chave="com-acolhe"
            valor={numeros.comAcolhe}
            rotulo="acolhem algum evento"
          />
          <Denominador
            chave="com-evento-datado"
            valor={numeros.comEventoDatado}
            rotulo="com evento datado"
          />
        </ul>
      </section>

      {/* 4 — HISTÓRICO ---------------------------------------------------- */}
      <BlocoDoProdutor
        chave="historico"
        rotulo={ehEspaco ? "O que já aconteceu aqui" : "O que esta entrada realiza"}
        vazio={produtor.realizaTotal === 0 && produtor.acolheTotal === 0}
        contagem={
          produtor.realizaTotal + produtor.acolheTotal === 1
            ? "1 evento"
            : `${produtor.realizaTotal + produtor.acolheTotal} eventos`
        }
        frase={
          ehEspaco
            ? `O acervo não situa nenhum evento neste espaço. ${numeros.comAcolhe} dos ${numeros.espacos} espaços acolhem ao menos um, por ${numeros.arestasAcolhe} ligações «situado_em» chegando.`
            : `O registro do Itaú Cultural não atribui a realização de nenhum evento a esta entrada. ${numeros.comRealiza} das ${numeros.instituicoes} instituições realizam ao menos um, por ${numeros.arestasRealiza} ligações «realiza».`
        }
      >
        <p className="text-xs leading-relaxed text-tinta-2">
          {ehEspaco
            ? "Eventos que o acervo situa neste espaço pela ligação «situado_em». São registros históricos: nenhum deles tem sessão datada."
            : "Eventos atribuídos a esta entrada pela ligação «realiza». São registros históricos da Enciclopédia: nenhum deles tem sessão datada."}
        </p>
        <ul className="flex flex-col">
          {produtor.realiza.map((e) => (
            <LinhaDeEvento key={`r-${e.id}`} evento={e} />
          ))}
          {produtor.acolhe.map((e) => (
            <LinhaDeEvento key={`a-${e.id}`} evento={e} />
          ))}
        </ul>
        {produtor.realizaTotal + produtor.acolheTotal >
        produtor.realiza.length + produtor.acolhe.length ? (
          <p className="text-xs text-tinta-3">
            Mostrando {produtor.realiza.length + produtor.acolhe.length} de{" "}
            {produtor.realizaTotal + produtor.acolheTotal} — o acervo declara os outros{" "}
            {produtor.realizaTotal +
              produtor.acolheTotal -
              produtor.realiza.length -
              produtor.acolhe.length}
            , e este protótipo corta a lista para caber na tela e no orçamento da página.
          </p>
        ) : null}
      </BlocoDoProdutor>

      {/* 5 — PESSOAS LIGADAS ---------------------------------------------- */}
      {/*                                                                    */}
      {/* Produtor não tem aresta `atua_em`. A ligação com gente existe por   */}
      {/* TRAVESSIA DE DOIS SALTOS, pelos eventos, e é assim que ela aparece  */}
      {/* na linha: com o evento do meio do caminho escrito. O papel vem da   */}
      {/* aresta `atua_em` e de mais lugar nenhum (D-41, DADO-03).           */}
      <BlocoDoProdutor
        chave="pessoas"
        rotulo="Pessoas ligadas"
        vazio={produtor.pessoasTotal === 0}
        contagem={produtor.pessoasTotal === 1 ? "1 pessoa" : `${produtor.pessoasTotal} pessoas`}
        frase={`Nenhuma pessoa do acervo é alcançável a partir desta entrada. Produtor não tem ligação de atuação: a ligação com gente existe só pelos eventos, a dois saltos, e ${numeros.comPessoas} dos ${numeros.total} produtores chegam assim a ao menos uma pessoa. Não completamos a lista, porque escrever aqui um nome que o acervo não liga a esta entrada seria inventar uma participação.`}
      >
        <p className="text-xs leading-relaxed text-tinta-2">
          Alcançadas a dois saltos: quem atua nos eventos que esta entrada{" "}
          {ehEspaco ? "acolhe" : "realiza"}. O papel de cada uma vem da ligação de atuação,
          não de um campo do agente.
        </p>
        <ul className="flex flex-col">
          {produtor.pessoas.map((p) => (
            <LinhaDePessoa key={p.id} pessoa={p} />
          ))}
        </ul>
        {produtor.pessoasTotal > produtor.pessoas.length ? (
          <p className="text-xs text-tinta-3">
            Mostrando {produtor.pessoas.length} de {produtor.pessoasTotal} — as outras{" "}
            {produtor.pessoasTotal - produtor.pessoas.length} estão no acervo e a lista é
            cortada para caber na tela.
          </p>
        ) : null}
      </BlocoDoProdutor>

      {/* 6 — LINGUAGENS EM QUE ATUA --------------------------------------- */}
      <BlocoDoProdutor
        chave="linguagens"
        rotulo="Linguagens em que atua"
        vazio={linguagensConhecidas.length === 0}
        contagem={
          linguagensConhecidas.length === 1
            ? "1 linguagem"
            : `${linguagensConhecidas.length} linguagens`
        }
        frase={`Esta entrada não declara linguagem artística; ${numeros.comLinguagem} dos ${numeros.total} produtores declaram, por ${numeros.arestasLinguagem} ligações «pertence_a». São todas instituições: nenhum dos ${numeros.espacos} espaços do acervo declara linguagem, e isso é da fonte — um espaço recebe o que for programado nele.`}
      >
        <SelosDeLinguagem ids={produtor.linguagens} />
      </BlocoDoProdutor>

      {/* 7 — CONTEÚDO EDITORIAL QUE FALA SOBRE ---------------------------- */}
      <section data-bloco-produtor="editorial" className="pr-bloco flex flex-col gap-3">
        {temEditorial ? (
          produtor.editorial.map((grupo) => <BlocoPonte key={grupo.chave} grupo={grupo} />)
        ) : (
          <BlocoAusenciaDeclarada
            chave="editorial"
            rotulo="Conteúdo editorial que fala sobre"
            frase={`Nenhuma matéria, vídeo ou publicação do acervo aponta para esta entrada — e não é caso isolado: ${numeros.comEditorial} dos ${numeros.total} produtores têm conteúdo editorial apontando para eles. As 529 mídias e os conteúdos do acervo carregado falam de obras, artistas e eventos; de quem produz, não falam. É uma lacuna da fonte, não da tela.`}
          />
        )}
      </section>

      <p className="pr-rodape border-t border-borda pt-3 text-xs leading-relaxed text-tinta-3">
        Todo vínculo desta página vem do acervo, conferível uma a uma.
        Onde um bloco declara ausência, é o registro do Itaú Cultural que não publica o
        dado — nada foi preenchido no lugar dele, e nenhuma ligação foi autorada para
        completar o que a fonte não afirma.
      </p>
    </div>
  );
}
