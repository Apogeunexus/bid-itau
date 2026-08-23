/**
 * contorno-brasil.ts — a geografia AUTORADA do protótipo.
 *
 * NÃO EXISTE GeoJSON EM DISCO E NÃO SE PODE BUSCAR UM (D-60): o protótipo é export
 * estático e não faz uma única requisição de runtime. O contorno do Brasil e os polígonos
 * das unidades federativas foram TRAÇADOS À MÃO para esta tela, com resolução suficiente
 * para a escala em que são desenhados (~8 pixels por grau) e nenhuma a mais.
 *
 * ISTO NÃO É CARTOGRAFIA, e a tela diz isso. Um contorno aproximado e ROTULADO é honesto;
 * um contorno aproximado que se apresente como mapa oficial afirmaria, sobre lugares
 * reais, uma precisão que este arquivo não tem. É a mesma regra que faz a trilha da fase 2
 * declarar as suas três arestas autoradas — procedência é argumento, não rodapé.
 *
 * AS COORDENADAS FICAM EM GRAUS, nunca em unidades de SVG. Este arquivo é DADO
 * geográfico; a conversão para pixel é CÓDIGO, e mora em `geo.ts`. Misturar os dois
 * prenderia o traçado a um `viewBox` — trocar o enquadramento do mapa passaria a exigir
 * reescrever a geografia.
 *
 * Formato: pares `[lat, lon]`, em graus decimais, percorrendo a fronteira. A ordem é a de
 * um anel fechado; o último ponto NÃO repete o primeiro (quem desenha fecha o caminho).
 */

/** Um vértice do traçado, em graus decimais: `[latitude, longitude]`. */
export type ParGeografico = readonly [number, number];

/**
 * O rótulo que a legenda do mapa exibe (D-61). Mora aqui, junto do dado que ele descreve,
 * para que ninguém consiga usar o traçado sem ter a declaração à mão.
 *
 * A frase que separa «protótipo honesto» de «mapa que finge ser mapa»: quem avalia a
 * proposta precisa ler que o desenho é nosso.
 */
export const ROTULO_CONTORNO =
  "Contorno do Brasil e limites estaduais traçados à mão para este protótipo — " +
  "esquemáticos e autorados, sem base cartográfica. Servem para situar, não para medir.";

/**
 * O contorno continental do Brasil. Ilhas oceânicas ficam de fora de propósito: nenhuma
 * entidade do acervo carregado se situa em uma delas, e desenhá-las adicionaria pontos
 * que não posicionam nada.
 */
export const CONTORNO_BRASIL: readonly ParGeografico[] = [
  [5.27, -60.2],
  [4.5, -59.8],
  [3.6, -59.7],
  [1.2, -58.9],
  [1.9, -56.0],
  [2.6, -56.5],
  [1.9, -55.0],
  [1.5, -54.6],
  [2.4, -53.3],
  [3.6, -51.9],
  [4.4, -51.7],
  [2.5, -50.9],
  [1.2, -50.1],
  [0.0, -50.3],
  [-1.2, -50.6],
  [-0.6, -48.5],
  [-1.05, -44.4],
  [-2.2, -42.6],
  [-2.9, -41.9],
  [-2.7, -41.4],
  [-3.0, -39.3],
  [-3.7, -38.5],
  [-4.4, -37.5],
  [-4.9, -37.2],
  [-4.9, -35.2],
  [-6.1, -35.1],
  [-6.9, -34.8],
  [-7.5, -35.0],
  [-8.1, -34.9],
  [-8.9, -35.2],
  [-9.4, -35.4],
  [-10.5, -36.4],
  [-11.4, -37.3],
  [-12.6, -38.0],
  [-13.6, -38.9],
  [-15.2, -38.9],
  [-16.5, -39.2],
  [-17.9, -39.2],
  [-18.3, -39.8],
  [-19.0, -39.7],
  [-19.9, -40.0],
  [-20.8, -40.7],
  [-21.3, -41.0],
  [-22.0, -41.0],
  [-22.9, -42.0],
  [-23.1, -43.2],
  [-23.0, -44.2],
  [-23.4, -44.7],
  [-24.0, -46.5],
  [-24.7, -47.9],
  [-25.3, -48.1],
  [-25.9, -48.6],
  [-26.7, -48.6],
  [-27.6, -48.4],
  [-28.5, -48.8],
  [-29.3, -49.7],
  [-30.5, -50.5],
  [-31.5, -51.5],
  [-32.5, -52.3],
  [-33.75, -53.4],
  [-33.0, -53.4],
  [-32.0, -53.1],
  [-31.0, -54.5],
  [-30.2, -56.0],
  [-30.2, -57.6],
  [-29.0, -56.8],
  [-28.0, -55.6],
  [-27.1, -54.5],
  [-25.6, -54.6],
  [-24.1, -54.3],
  [-23.0, -55.5],
  [-22.0, -57.6],
  [-20.5, -57.9],
  [-19.0, -57.8],
  [-17.5, -56.5],
  [-16.3, -57.8],
  [-15.5, -58.2],
  [-14.5, -59.9],
  [-13.7, -60.5],
  [-12.7, -60.3],
  [-11.0, -60.0],
  [-9.7, -60.0],
  [-10.5, -65.3],
  [-11.0, -65.4],
  [-12.5, -64.4],
  [-11.0, -68.7],
  [-10.9, -69.6],
  [-9.8, -69.6],
  [-9.4, -70.5],
  [-8.7, -72.3],
  [-7.3, -72.6],
  [-7.1, -73.8],
  [-6.0, -73.0],
  [-5.1, -72.9],
  [-4.2, -70.0],
  [-2.2, -69.8],
  [-0.2, -69.5],
  [1.0, -69.9],
  [1.4, -68.2],
  [2.2, -67.3],
  [1.2, -66.9],
  [1.9, -65.4],
  [0.9, -63.2],
  [2.2, -64.5],
  [3.4, -64.4],
  [4.2, -63.0],
  [4.6, -61.0],
];

/**
 * Rótulo dos polígonos estaduais. Separado do rótulo do contorno porque a afirmação é
 * outra e mais forte: aqui o traçado não só situa como DELIMITA — e é sobre esses limites
 * que a camada de desertos culturais pinta uma contagem. Um limite errado atribuiria a um
 * estado um registro que é de outro, e por isso a declaração vem junto do número.
 */
export const ROTULO_UNIDADES_FEDERATIVAS =
  "Os 27 polígonos estaduais são esquemáticos e autorados: aproximam a forma de cada " +
  "unidade federativa no traço, o suficiente para localizá-la. A CONTAGEM de cada estado " +
  "não vem do desenho — vem do acervo, por travessia, e não muda se o traço mudar.";

export interface UnidadeFederativa {
  sigla: string;
  /** O título EXATO com que o estado aparece na tabela de centroides e no grafo. */
  titulo: string;
  contorno: readonly ParGeografico[];
}

/**
 * As 27 unidades federativas, esquemáticas.
 *
 * AS 27, E NÃO AS 25 QUE O GRAFO CONHECE. Sergipe e Tocantins não aparecem em lugar nenhum
 * do acervo carregado — nem como território, nem como entidade situada — e é exatamente por
 * isso que os polígonos deles precisam existir aqui: sem o desenho, o buraco não teria onde
 * aparecer, e a leitura mais forte do mapa (D-62) viraria uma ausência invisível.
 * Um estado que some do mapa por não ter registro é o acervo escrevendo a geografia.
 */
export const UNIDADES_FEDERATIVAS: readonly UnidadeFederativa[] = [
  {
    sigla: "RR",
    titulo: "Roraima",
    contorno: [
      [5.2, -60.2], [4.5, -59.8], [3.6, -59.7], [1.2, -58.9], [-1.4, -61.9],
      [-0.2, -63.3], [0.9, -63.2], [2.2, -64.5], [3.4, -64.4], [4.2, -63.0], [4.6, -61.0],
    ],
  },
  {
    sigla: "AP",
    titulo: "Amapá",
    contorno: [
      [4.4, -51.7], [2.5, -50.9], [1.2, -50.1], [0.0, -50.3], [-1.2, -50.6],
      [-0.5, -52.0], [0.7, -53.0], [1.5, -54.6], [2.4, -53.3], [3.6, -51.9],
    ],
  },
  {
    sigla: "AM",
    titulo: "Amazonas",
    contorno: [
      [2.2, -67.3], [1.2, -66.9], [1.9, -65.4], [0.9, -63.2], [-0.2, -63.3],
      [-1.4, -61.9], [-1.0, -58.9], [-2.5, -57.9], [-4.4, -56.5], [-6.0, -56.1],
      [-7.3, -55.3], [-9.3, -57.5], [-9.7, -60.0], [-9.7, -65.4], [-8.2, -65.4],
      [-7.1, -67.3], [-6.5, -70.0], [-7.3, -72.6], [-7.1, -73.8], [-5.1, -72.9],
      [-4.2, -70.0], [-2.2, -69.8], [-0.2, -69.5], [1.0, -69.9], [1.4, -68.2],
    ],
  },
  {
    sigla: "AC",
    titulo: "Acre",
    contorno: [
      [-7.1, -73.8], [-7.3, -72.6], [-8.7, -72.3], [-9.4, -70.5], [-9.8, -69.6],
      [-10.9, -69.6], [-11.0, -68.7], [-10.0, -68.0], [-8.2, -70.5], [-7.5, -72.9],
    ],
  },
  {
    sigla: "RO",
    titulo: "Rondônia",
    contorno: [
      [-7.9, -63.0], [-8.7, -61.5], [-9.7, -60.0], [-11.0, -60.0], [-12.7, -60.3],
      [-13.7, -61.0], [-13.5, -62.3], [-12.5, -64.4], [-11.0, -65.4], [-9.7, -65.4],
      [-8.2, -65.4], [-8.0, -64.0],
    ],
  },
  {
    sigla: "PA",
    titulo: "Pará",
    contorno: [
      [2.6, -56.5], [1.9, -55.0], [1.5, -54.6], [0.7, -53.0], [-0.5, -52.0],
      [-1.2, -50.6], [-0.6, -48.5], [-1.2, -46.4], [-2.5, -46.6], [-3.9, -47.4],
      [-5.5, -47.4], [-6.7, -48.5], [-8.0, -49.0], [-9.6, -50.2], [-9.8, -50.2],
      [-9.5, -53.0], [-9.3, -54.9], [-7.3, -55.3], [-6.0, -56.1], [-4.4, -56.5],
      [-2.5, -57.9], [-1.0, -58.9], [0.6, -58.0], [1.9, -56.0],
    ],
  },
  {
    sigla: "TO",
    titulo: "Tocantins",
    contorno: [
      [-5.2, -48.3], [-5.9, -47.4], [-7.0, -46.6], [-8.5, -46.0], [-10.3, -45.9],
      [-11.7, -46.0], [-12.4, -46.3], [-13.5, -46.8], [-12.9, -48.2], [-12.4, -49.7],
      [-11.0, -50.7], [-9.6, -50.2], [-8.0, -49.0], [-6.7, -48.5], [-5.8, -48.4],
    ],
  },
  {
    sigla: "MA",
    titulo: "Maranhão",
    contorno: [
      [-1.2, -45.9], [-1.1, -44.4], [-2.2, -42.6], [-2.9, -41.9], [-5.0, -43.0],
      [-7.0, -43.1], [-8.4, -43.7], [-9.8, -44.5], [-10.3, -45.9], [-8.5, -46.0],
      [-7.0, -46.6], [-5.9, -47.4], [-3.9, -47.4], [-2.5, -46.6], [-1.6, -46.2],
    ],
  },
  {
    sigla: "PI",
    titulo: "Piauí",
    contorno: [
      [-2.7, -41.4], [-3.1, -41.8], [-5.0, -43.0], [-7.0, -43.1], [-8.4, -43.7],
      [-9.8, -44.5], [-10.3, -45.9], [-10.9, -45.2], [-10.5, -44.3], [-9.5, -43.0],
      [-8.5, -41.4], [-7.5, -40.5], [-6.4, -40.5], [-5.0, -40.9], [-3.6, -41.2],
    ],
  },
  {
    sigla: "CE",
    titulo: "Ceará",
    contorno: [
      [-2.8, -40.5], [-3.0, -39.3], [-3.7, -38.5], [-4.4, -37.5], [-5.3, -37.6],
      [-6.0, -38.2], [-6.6, -38.9], [-7.5, -39.0], [-7.9, -39.7], [-7.3, -40.5],
      [-6.4, -40.5], [-5.0, -40.9], [-3.6, -41.2], [-2.9, -41.2],
    ],
  },
  {
    sigla: "RN",
    titulo: "Rio Grande do Norte",
    contorno: [
      [-4.8, -37.2], [-4.9, -35.2], [-5.2, -35.2], [-6.1, -35.1], [-6.4, -35.4],
      [-6.4, -36.6], [-6.2, -37.6], [-5.3, -37.6], [-4.9, -37.5],
    ],
  },
  {
    sigla: "PB",
    titulo: "Paraíba",
    contorno: [
      [-6.3, -38.2], [-6.4, -36.6], [-6.4, -35.4], [-6.9, -34.8], [-7.5, -35.0],
      [-7.6, -36.3], [-8.3, -37.5], [-7.6, -38.4], [-7.0, -38.6],
    ],
  },
  {
    sigla: "PE",
    titulo: "Pernambuco",
    contorno: [
      [-7.3, -40.5], [-7.6, -38.4], [-8.3, -37.5], [-7.6, -36.3], [-7.5, -35.0],
      [-8.1, -34.9], [-8.9, -35.2], [-9.1, -36.3], [-9.4, -37.5], [-8.9, -38.3],
      [-9.5, -40.2], [-8.6, -40.9], [-8.0, -41.0], [-7.5, -40.5],
    ],
  },
  {
    sigla: "AL",
    titulo: "Alagoas",
    contorno: [
      [-8.8, -38.2], [-9.0, -36.4], [-8.8, -35.2], [-9.4, -35.4], [-10.5, -36.4],
      [-10.0, -37.4], [-9.6, -37.9], [-9.3, -38.2],
    ],
  },
  {
    sigla: "SE",
    titulo: "Sergipe",
    contorno: [
      [-9.5, -38.2], [-10.0, -37.4], [-10.5, -36.4], [-11.4, -37.3], [-11.2, -37.8],
      [-10.6, -38.2], [-10.0, -38.2],
    ],
  },
  {
    sigla: "BA",
    titulo: "Bahia",
    contorno: [
      [-8.6, -40.9], [-9.5, -40.2], [-8.9, -38.3], [-9.4, -37.5], [-9.6, -37.9],
      [-10.0, -38.2], [-10.6, -38.2], [-11.2, -37.8], [-12.6, -38.0], [-13.6, -38.9],
      [-15.2, -38.9], [-16.5, -39.2], [-17.9, -39.2], [-18.3, -39.8], [-17.9, -40.5],
      [-16.5, -40.9], [-15.4, -40.2], [-14.3, -41.0], [-13.5, -43.0], [-13.9, -44.0],
      [-14.2, -45.0], [-13.4, -46.0], [-12.4, -46.3], [-11.7, -46.0], [-10.3, -45.9],
      [-10.9, -45.2], [-10.5, -44.3], [-9.5, -43.0], [-8.5, -41.4],
    ],
  },
  {
    sigla: "MT",
    titulo: "Mato Grosso",
    contorno: [
      [-9.3, -54.9], [-9.5, -53.0], [-9.8, -50.2], [-11.0, -50.7], [-12.4, -49.7],
      [-13.5, -50.6], [-15.0, -51.5], [-16.0, -52.5], [-17.4, -53.2], [-17.9, -54.9],
      [-17.5, -56.5], [-16.3, -57.8], [-15.5, -58.2], [-14.5, -59.9], [-13.7, -60.5],
      [-12.7, -60.3], [-11.0, -60.0], [-9.7, -60.0], [-9.3, -57.5],
    ],
  },
  {
    sigla: "MS",
    titulo: "Mato Grosso do Sul",
    contorno: [
      [-17.4, -53.2], [-17.9, -54.9], [-17.5, -56.5], [-19.0, -57.8], [-20.5, -57.9],
      [-22.0, -57.6], [-23.0, -55.5], [-24.1, -54.3], [-23.0, -53.8], [-22.0, -53.0],
      [-20.5, -51.7], [-19.5, -51.0], [-18.5, -52.0], [-18.0, -52.6],
    ],
  },
  {
    sigla: "GO",
    titulo: "Goiás",
    contorno: [
      [-12.4, -46.3], [-13.4, -46.0], [-14.2, -45.0], [-15.5, -45.9], [-16.5, -46.3],
      [-17.5, -47.0], [-18.5, -48.0], [-19.5, -49.0], [-19.5, -51.0], [-18.5, -52.0],
      [-17.4, -53.2], [-16.0, -52.5], [-15.0, -51.5], [-13.5, -50.6], [-12.4, -49.7],
      [-12.9, -48.2], [-13.5, -46.8],
    ],
  },
  {
    sigla: "DF",
    titulo: "Distrito Federal",
    contorno: [
      [-15.5, -48.3], [-15.5, -47.4], [-16.05, -47.4], [-16.05, -48.3],
    ],
  },
  {
    sigla: "MG",
    titulo: "Minas Gerais",
    contorno: [
      [-14.2, -45.0], [-13.9, -44.0], [-13.5, -43.0], [-14.3, -41.0], [-15.4, -40.2],
      [-16.5, -40.9], [-17.9, -40.5], [-18.3, -39.8], [-18.5, -41.0], [-19.5, -41.0],
      [-20.5, -41.8], [-21.3, -41.9], [-22.0, -43.0], [-22.3, -44.5], [-22.6, -45.5],
      [-22.9, -46.5], [-22.4, -47.0], [-20.9, -48.9], [-20.0, -50.2], [-19.5, -51.0],
      [-19.5, -49.0], [-18.5, -48.0], [-17.5, -47.0], [-16.5, -46.3], [-15.5, -45.9],
    ],
  },
  {
    sigla: "ES",
    titulo: "Espírito Santo",
    contorno: [
      [-18.3, -39.8], [-18.5, -41.0], [-19.5, -41.0], [-20.5, -41.8], [-21.3, -41.0],
      [-20.8, -40.7], [-19.9, -40.0], [-19.0, -39.7],
    ],
  },
  {
    sigla: "RJ",
    titulo: "Rio de Janeiro",
    contorno: [
      [-21.3, -41.9], [-21.0, -41.0], [-21.8, -41.0], [-22.4, -41.7], [-22.9, -42.0],
      [-23.1, -43.2], [-23.0, -44.2], [-23.4, -44.7], [-22.6, -44.7], [-22.3, -44.5],
      [-22.0, -43.0],
    ],
  },
  {
    sigla: "SP",
    titulo: "São Paulo",
    contorno: [
      [-22.3, -44.5], [-22.6, -44.7], [-23.4, -44.7], [-24.0, -46.5], [-24.7, -47.9],
      [-25.3, -48.1], [-24.3, -48.6], [-24.0, -49.5], [-22.9, -51.0], [-22.6, -52.0],
      [-22.0, -53.0], [-20.5, -51.7], [-20.0, -50.2], [-20.9, -48.9], [-22.4, -47.0],
      [-22.9, -46.5], [-22.6, -45.5],
    ],
  },
  {
    sigla: "PR",
    titulo: "Paraná",
    contorno: [
      [-22.6, -52.0], [-22.9, -51.0], [-24.0, -49.5], [-24.3, -48.6], [-25.3, -48.1],
      [-25.9, -48.6], [-26.2, -49.3], [-26.7, -51.0], [-26.6, -52.7], [-26.1, -53.7],
      [-25.6, -54.6], [-24.1, -54.3], [-23.0, -53.8],
    ],
  },
  {
    sigla: "SC",
    titulo: "Santa Catarina",
    contorno: [
      [-26.2, -49.3], [-25.9, -48.6], [-26.7, -48.6], [-27.6, -48.4], [-28.5, -48.8],
      [-29.3, -49.7], [-29.4, -50.5], [-28.6, -51.5], [-27.9, -53.0], [-27.2, -53.8],
      [-26.7, -53.7], [-26.1, -53.7], [-26.6, -52.7], [-26.7, -51.0],
    ],
  },
  {
    sigla: "RS",
    titulo: "Rio Grande do Sul",
    contorno: [
      [-27.2, -53.8], [-27.9, -53.0], [-28.6, -51.5], [-29.4, -50.5], [-29.3, -49.7],
      [-30.5, -50.5], [-31.5, -51.5], [-32.5, -52.3], [-33.75, -53.4], [-33.0, -53.4],
      [-32.0, -53.1], [-31.0, -54.5], [-30.2, -56.0], [-30.2, -57.6], [-29.0, -56.8],
      [-28.0, -55.6], [-27.1, -54.5],
    ],
  },
];
