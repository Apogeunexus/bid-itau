
/**
 * desertos.tsx — a camada de desertos culturais (D-62).
 *
 * ESTA É A IMAGEM MAIS FORTE DA PROPOSTA INTEIRA, e o arquivo foi escrito como peça de
 * projeto e não como interruptor no canto. Numa tela só ela mostra que a documentação da
 * cultura brasileira está concentrada no Sudeste: 274 registros em São Paulo e 184 no Rio,
 * 59% de tudo em dois estados de vinte e sete; cinco estados com um registro; e dois —
 * Sergipe e Tocantins — que o acervo carregado não sabe que existem.
 *
 * O QUE ELA MEDE, E A FRASE NÃO PODE SER SUAVIZADA (T-03-15): registro no acervo carregado
 * do Itaú Cultural, e NÃO oferta cultural do estado. Sergipe tem cultura; o acervo é que
 * não a documenta. Uma camada que omitisse essa distinção afirmaria, sobre um estado real,
 * uma coisa que é falsa e ofensiva — e a leitura correta é mais forte do que a errada, não
 * mais fraca: a concentração não é falha do acervo, é o diagnóstico que justifica a
 * plataforma existir.
 *
 * TRÊS ESTADOS VISUAIS, e a diferença entre o segundo e o terceiro é a tela inteira:
 *   `registrado` — intensidade proporcional à contagem medida;
 *   `minimo`     — os cinco estados com UM registro;
 *   `vazio`      — Sergipe e Tocantins, vazados e hachurados, porque a diferença entre 1 e
 *                  0 aqui é qualitativa: 1 é um acervo magro, 0 é um estado que o acervo
 *                  não sabe que existe.
 *
 * NENHUM NÚMERO DESTE ARQUIVO É ESCRITO À MÃO. Todos chegam por propriedade, contados no
 * build por `densidadePorUf()`. A frase que nós compusemos pode encurtar; o número medido,
 * não.
 *
 * Sem `@/dados/geo` e sem `@/dados/grafo`: este componente é desenhado dentro de um
 * componente de cliente e por DP-F não pode alcançar o grafo nem transitivamente.
 */

export interface UfDesenhada {
  sigla: string;
  titulo: string;
  registros: number;
  entidades: number;
  noGrafo: boolean;
  /** O polígono já projetado, como atributo `d` de `<path>`. */
  d: string;
  cx: number;
  cy: number;
}

export interface DadosDesertos {
  ufs: readonly UfDesenhada[];
  total: number;
  doisMaiores: number;
  percentual: number;
  maximo: number;
  mediana: number;
  entidadesDistintas: number;
  comUmRegistro: readonly string[];
  semRegistro: readonly string[];
  rotulo: string;
}

/**
 * Quais estados ganham sigla visível: SÓ OS DE REGISTRO ZERO.
 *
 * A regra vem da contagem e não de uma lista de siglas — se o grafo mudar, ela muda junto.
 * E rotular só os buracos é decisão de composição: os pinos do recorte passam por cima do
 * Sudeste e engoliriam um «SP» ali; onde não há registro também não há pino, e é
 * exatamente por isso que a sigla do vazio sobrevive na imagem. A concentração é dita pela
 * intensidade e pela frase de leitura; a ausência precisa ser NOMEADA, porque uma mancha
 * clara sem nome não acusa ninguém de nada.
 */
function rotulados(dados: DadosDesertos): UfDesenhada[] {
  return dados.ufs.filter((uf) => uf.registros === 0);
}

/** A faixa visual de um estado. Sai da contagem, nunca de uma lista escrita à mão. */
function faixaDe(registros: number): "vazio" | "minimo" | "registrado" {
  if (registros === 0) return "vazio";
  if (registros === 1) return "minimo";
  return "registrado";
}

/**
 * Intensidade em RAIZ QUADRADA da fração do máximo.
 *
 * Linear apagaria vinte estados no branco e a tela diria «só existe São Paulo», que é mais
 * forte do que o dado. Logarítmica foi a primeira tentativa e errou para o outro lado:
 * medida na tela, ela levava um estado de 8 registros a 39% da intensidade de um de 274, e
 * o Sudeste deixava de saltar — a imagem perdia justamente a leitura que ela existe para
 * dar. A raiz quadrada fica entre as duas: 8 registros saem a 17% e 184 a 82%, então o
 * Norte continua visível E a concentração continua evidente.
 */
function intensidade(registros: number, maximo: number): number {
  if (registros <= 0 || maximo <= 0) return 0;
  return Math.sqrt(registros / maximo);
}

/** A camada, desenhada DENTRO do mesmo `<svg>` e sob a mesma projeção dos pinos. */
export function CamadaDesertos({ dados }: { dados: DadosDesertos }) {
  return (
    <g className="desertos" aria-hidden>
      <defs>
        <pattern
          id="desertos-hachura"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" className="desertos-hachura-traco" />
        </pattern>
      </defs>

      {dados.ufs.map((uf) => {
        const faixa = faixaDe(uf.registros);
        return (
          <path
            key={uf.sigla}
            data-uf={uf.sigla}
            data-registros={uf.registros}
            data-faixa={faixa}
            className="desertos-uf"
            style={
              { "--intensidade": intensidade(uf.registros, dados.maximo).toFixed(3) } as React.CSSProperties
            }
            d={uf.d}
          >
            <title>
              {uf.titulo} — {uf.registros}{" "}
              {uf.registros === 1 ? "registro" : "registros"}
              {uf.noGrafo ? "" : " · nenhum território deste estado existe no acervo carregado"}
            </title>
          </path>
        );
      })}

      {/* Rótulos só onde eles CARREGAM O ARGUMENTO: os dois vazios e os dois maiores. Vinte
          e sete siglas nesta escala viram ruído, e ruído no meio de uma imagem que precisa
          ser lida de longe custa mais do que a informação que traz. Todos os 27 continuam
          nomeados no `<title>` e na frase de leitura. */}
      {rotulados(dados).map((uf) => (
          <text
            key={`r-${uf.sigla}`}
            x={uf.cx}
            y={uf.cy}
            className="desertos-sigla"
            data-faixa={faixaDe(uf.registros)}
            textAnchor="middle"
          >
            {uf.sigla}
          </text>
        ))}
    </g>
  );
}

/**
 * A leitura, em texto de produto e FORA do modo comentado.
 *
 * Escrita para ser lida em voz alta na apresentação. Ela diz o que está sendo medido antes
 * de dizer o que foi medido — porque a ordem inversa deixaria o número sozinho por um
 * parágrafo, e um número sozinho sobre um estado é uma acusação.
 */
export function LeituraDesertos({ dados }: { dados: DadosDesertos }) {
  const [a, b] = [...dados.ufs].sort((x, y) => y.registros - x.registros);
  const cinco = dados.comUmRegistro.join(", ").replace(/, ([^,]*)$/, " e $1");
  const dois = dados.semRegistro.join(" e ");

  return (
    <section data-leitura-desertos className="desertos-leitura">
      <h2 className="desertos-titulo">Desertos culturais</h2>
      <p>
        O que este mapa mede é{" "}
        <strong className="font-semibold text-tinta">
          registro no acervo carregado do Itaú Cultural
        </strong>{" "}
        — cada vínculo entre uma entidade e um lugar —, não oferta cultural do estado.
        Sergipe tem cultura; o acervo é que não a documenta.
      </p>
      <p>
        {a.titulo} tem {a.registros} registros e {b.titulo}, {b.registros}:{" "}
        <strong className="font-semibold text-tinta">
          {dados.doisMaiores} dos {dados.total}, {dados.percentual}% do acervo
          territorializado em dois estados de {dados.ufs.length}
        </strong>
        . {dados.comUmRegistro.length} estados têm um registro só — {cinco}. E{" "}
        {dados.semRegistro.length} não aparecem em lugar nenhum do grafo:{" "}
        <strong className="font-semibold text-tinta">
          {dois} têm zero
        </strong>
        .
      </p>
      <p className="desertos-tese">
        Essa concentração não é falha do acervo. É o diagnóstico que justifica a plataforma
        existir.
      </p>
    </section>
  );
}
