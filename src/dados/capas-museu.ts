/**
 * capas-museu.ts — fachada de cada espaço-museu, baixada da web.
 *
 * O acervo do IC não publica imagem de espaço (0 de 113). Estas fotos NÃO
 * saem do crawl: saem do Wikimedia Commons, com autoria e licença da fonte.
 * Só preenche quem não tem capa. MAP não tem foto livre do prédio — a
 * vitrine o esconde, em vez de herdar a do Museu Paranaense (é outro edifício).
 */

export interface CapaDeMuseu {
  /** Nome do arquivo em `public/museus/`. */
  readonly arquivo: string;
  /** Autoria como a fonte declara, em pt-BR. */
  readonly credito: string;
  /** Página do arquivo no Commons. */
  readonly fonte: string;
}

export const CAPAS_MUSEU: Readonly<Record<string, CapaDeMuseu>> = {
  "kunstmuseum-thun-suica": {
    arquivo: "dbf6c54f4cda5d29.jpg",
    credito: "Gidoca / Wikimedia Commons (CC BY-SA 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Thunerhof2.jpg",
  },
  "museu-casa-dos-contos-centro-de-estudos-do-ciclo-do-ouro-ouro-preto-mg-ouro-preto": {
    arquivo: "03fcd63fe0b318a2.jpg",
    credito: "Luis Rizo / Wikimedia Commons (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:Casadoscontos.JPG",
  },
  "museu-da-imagem-e-do-som-mis-sp-sao-paulo": {
    arquivo: "9953c9cee59d2a54.jpg",
    credito: "Dornicke / Wikimedia Commons (CC BY-SA 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:MIS,_SP,_6_(entrada).JPG",
  },
  "museu-de-arte-brasileira-mab-faap-sao-paulo": {
    arquivo: "87b8ae068a4e7685.jpg",
    credito: "Ines Bertolucci / Wikimedia Commons (CC BY-SA 2.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:MAB,_FAAP_5.jpg",
  },
  "museu-de-arte-contemporanea-da-universidade-de-sao-paulo-mac-usp-sao-paulo": {
    arquivo: "c276aab30d93e3ec.jpg",
    credito: "Beatrizberto / Wikimedia Commons (CC BY-SA 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Fachada-mac-usp.jpg",
  },
  "museu-de-arte-contemporanea-do-parana-mac-parana-curitiba": {
    arquivo: "9966df5186bc88aa.jpg",
    credito: "Everaldo Guilmann / Wikimedia Commons (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:MAC-PR.jpg",
  },
  "museu-de-arte-contemporanea-do-rio-grande-do-sul-macrs-porto-alegre": {
    arquivo: "45b0f5119a59ce80.jpg",
    credito: "Ricardo André Frantz / Wikimedia Commons (CC BY-SA 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:MAC-RS.jpg",
  },
  "museu-de-arte-contemporanea-jose-pancetti-macc-campinas": {
    arquivo: "ae3a1f68431947e2.jpg",
    credito: "Fasouzafreitas / Wikimedia Commons (CC BY 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_de_Arte_Contempor%C3%A2nea_de_Campinas_e_Biblioteca_P%C3%BAblica.JPG",
  },
  "museu-de-arte-de-belem-mabe-belem": {
    arquivo: "c1a5f33bff198cc9.jpg",
    credito: "JLPizzol / Wikimedia Commons (CC BY-SA 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Palacete_Azul-03.jpg",
  },
  "museu-de-arte-de-ribeirao-preto-pedro-manuel-gismondi-marp-ribeirao-preto": {
    arquivo: "fcfdeae15d776d3e.jpg",
    credito: "autor desconhecido / Wikimedia Commons (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:Palacete_Innecchi_e_Sociedade_Recreativa,_1930.jpg",
  },
  "museu-de-arte-de-santa-catarina-masc-florianopolis": {
    arquivo: "6eaf1ddbfc592e2e.jpg",
    credito: "Rachmaninoff / Wikimedia Commons (CC BY-SA 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_de_Arte_de_Santa_Catarina.jpg",
  },
  "museu-de-arte-do-rio-grande-do-sul-ado-malagoli-margs-porto-alegre": {
    arquivo: "8c94a4cc81f889a4.jpg",
    credito: "Ricardo André Frantz / Wikimedia Commons (CC BY 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Margs2011.jpg",
  },
  "museu-de-arte-moderna-do-rio-de-janeiro-mam-rio-rio-de-janeiro": {
    arquivo: "99df638f8a84ba81.jpg",
    credito: "Halley Pacheco de Oliveira / Wikimedia Commons (CC BY-SA 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_de_Arte_Moderna,_Rio_de_Janeiro_(2001).jpg",
  },
  "museu-de-arte-sacra-do-para-belem": {
    arquivo: "b29fe6f03b399162.jpg",
    credito: "Paul R. Burley / Wikimedia Commons (CC BY 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Igreja_e_Col%C3%A9gio_de_Santo_Alexandre_Bel%C3%A9m_Par%C3%A1_2023-7835.jpg",
  },
  "museu-de-arte-sacra-mas-salvador": {
    arquivo: "9ca7954110acac52.jpg",
    credito: "Paul R. Burley / Wikimedia Commons (CC BY-SA 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_de_Arte_Sacra_da_Bahia_2019-0447.jpg",
  },
  "museu-de-artes-brasil-estados-unidos-mabeu-belem": {
    arquivo: "4a6aa17a5f5c58d9.jpg",
    credito: "Marlon Macedo / Wikimedia Commons (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:Ccbeu.jpg",
  },
  "museu-do-estado-de-pernambuco-mepe-recife": {
    arquivo: "2028e39c6108db7e.jpg",
    credito: "Wikimedia Commons",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_do_Estado_de_Pernambuco_-_Recife,_Pernambuco,_Brasil.jpg",
  },
  "museu-do-estado-do-para-mep-belem": {
    arquivo: "8f8d2a887ec290ae.jpg",
    credito: "ExAstra / Wikimedia Commons (CC BY-SA 4.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Pal%C3%A1cio_Lauro_Sodr%C3%A9_(Museu_do_Estado_do_Par%C3%A1),_Bel%C3%A9m_-_PA,_Brasil,_outubro_de_2023.jpg",
  },
  "museu-nacional-da-republica-brasilia": {
    arquivo: "8ce1703623173eba.jpg",
    credito: "Cayambe / Wikimedia Commons (CC BY-SA 3.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Bras%C3%ADlia_Museu_Nacional_Honestino_Guimar%C3%A3es.jpg",
  },
  "museu-oscar-niemeyer-mon-curitiba": {
    arquivo: "b05e0e03299bb335.jpg",
    credito: "Marinelson Almeida / Wikimedia Commons (CC BY 2.0)",
    fonte: "https://commons.wikimedia.org/wiki/File:Museu_do_Olho_-_Oscar_Niemeyer_-_Curitiba_Brasil_(10146136615).jpg",
  },
  "museu-paraense-emilio-goeldi-belem": {
    arquivo: "f1919e3077925434.jpg",
    credito: "MTur Destinos / Wikimedia Commons (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:BrunaBrandao_Museu_Emilio_Goeldi_Belem_PA_(41056119011).jpg",
  },
};
