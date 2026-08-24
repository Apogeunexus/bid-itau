/**
 * testar-cursos.ts — a classificação de formato e a busca da vitrine, sobre
 * títulos reais do acervo e sobre o catálogo montado.
 *
 * A classificação é derivada do título: um caso que passar no chute e falhar
 * no acervo deixaria a faceta mentindo. Rode com `npx tsx scripts/testar-cursos.ts`.
 */

import { catalogoDeCursos } from "../src/dados/cursos";
import {
  classificarFormato,
  correspondeABusca,
  textoEstaCancelado,
  textoTemGratuito,
  type CursoNoCliente,
} from "../src/dados/cursos-wire";

let falhas = 0;
let atual = "";

function assercao(nome: string, corpo: () => void) {
  atual = nome;
  try {
    corpo();
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`  FALHA ${nome}`);
    console.log(`        ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

function exigir(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem || atual);
}

console.log("\ntestar-cursos — classificação, busca e catálogo");

assercao("pós-graduação pelo resumo de especialização", () => {
  exigir(
    classificarFormato(
      "Inscreva-se para o curso “Gestão cultural contemporânea” – turma 2023",
      "Programa de especialização é uma parceria entre Itaú Cultural e Instituto Singularidades",
      [],
    ) === "pos",
    "especialização no resumo tem de ganhar de «curso» no título",
  );
});

assercao("encontro no plural do título", () => {
  exigir(
    classificarFormato(
      "“Encontros de professores – virtual”: saiba quais são as atividades de setembro",
      "Neste mês, as conversas giram em torno do geógrafo Milton Santos",
      [],
    ) === "encontro",
    "«Encontros de professores» precisa ser encontro, não formação",
  );
});

assercao("oficina pela linguagem declarada", () => {
  exigir(
    classificarFormato(
      "Itaú Cultural e OPAE promovem atividades na “Ocupação Ana Mae Barbosa”",
      "Os quatro encontros, feitos em parceria com a Organização Paulista de Arte-Educação",
      ["oficinas"],
    ) === "oficina",
    "linguagem oficinas no dado tem de classificar como oficina",
  );
});

assercao("ateliê no título é oficina", () => {
  exigir(
    classificarFormato(
      "No ateliê de artes urbanas, o público é convidado a criar seu próprio projeto",
      "",
      [],
    ) === "oficina",
    "ateliê é oficina",
  );
});

assercao("curso EAD", () => {
  exigir(classificarFormato("Cursos EADs | Observatório", "", []) === "curso", "Cursos EADs é curso");
});

assercao("doutorado é pós", () => {
  exigir(
    classificarFormato("Inscreva-se no Doutorado Profissional em Artes da Cena", "", []) === "pos",
    "doutorado é pós",
  );
});

assercao("formação residual", () => {
  exigir(
    classificarFormato(
      "Escola IC ganha formação sobre a teoria e a prática do streaming",
      "",
      ["audiovisual", "cinema"],
    ) === "formacao",
    "formação sem curso/oficina/pós cai no residual",
  );
});

assercao("gratuito e cancelado só quando o texto diz", () => {
  exigir(textoTemGratuito("Curso gratuito ensina usos da inteligência artificial", ""), "gratuito no título");
  exigir(!textoTemGratuito("Curso de crítica de cinema", ""), "sem a palavra, não marca gratuito");
  exigir(textoEstaCancelado("Cancelado | Inscrições para nova turma", ""), "cancelado no título");
  exigir(!textoEstaCancelado("Inscrições abertas para o mestrado", ""), "aberto não é cancelado");
});

const esqueleto = (parcial: Partial<CursoNoCliente> & Pick<CursoNoCliente, "titulo">): CursoNoCliente => ({
  slug: "x",
  resumo: "",
  fonte: "https://www.itaucultural.org.br/",
  imagem: "/acervo/x.jpg",
  creditoImagem: "",
  imagemAlt: "",
  dia: 20240101,
  formato: "curso",
  rotuloFormato: "Curso",
  linguagens: [],
  gratuito: false,
  cancelado: false,
  libras: false,
  legenda: false,
  ...parcial,
});

assercao("busca ignora acento e caixa", () => {
  const curso = esqueleto({
    titulo: "Gestão cultural contemporânea",
    linguagens: [{ id: "cinema", rotulo: "cinema", cor: "--ic-verde-agua" }],
  });
  exigir(correspondeABusca(curso, "GESTAO"), "sem acento encontra gestão");
  exigir(correspondeABusca(curso, "cinema"), "linguagem entra na busca");
  exigir(!correspondeABusca(curso, "teatro"), "teatro não está neste item");
  exigir(correspondeABusca(curso, "   "), "consulta vazia devolve tudo");
});

const catalogo = catalogoDeCursos();

assercao("o catálogo tem as 54 e a partição fecha", () => {
  exigir(catalogo.total === 54, `total ${catalogo.total}`);
  exigir(catalogo.itens.length === 54, `itens ${catalogo.itens.length}`);
  const soma = catalogo.formatos.reduce((acc, f) => acc + f.n, 0);
  exigir(soma === 54, `formatos somam ${soma}`);
  exigir(catalogo.itens.every((i) => Boolean(i.fonte && i.imagem && i.resumo)), "fonte, imagem e resumo em todos");
});

assercao("o destaque é o mais recente", () => {
  const maxDia = Math.max(...catalogo.itens.map((i) => i.dia));
  exigir(catalogo.destaque.dia === maxDia, `destaque ${catalogo.destaque.dia} ≠ max ${maxDia}`);
  exigir(catalogo.destaque.slug === catalogo.itens[0]?.slug, "destaque é o primeiro da lista ordenada");
});

assercao("Libras e legendagem vêm contados do acervo", () => {
  const libras = catalogo.acessibilidade.find((a) => a.campo === "libras");
  const legenda = catalogo.acessibilidade.find((a) => a.campo === "subtitle");
  exigir((libras?.n ?? 0) === catalogo.itens.filter((i) => i.libras).length, "Libras bate");
  exigir((legenda?.n ?? 0) === catalogo.itens.filter((i) => i.legenda).length, "legendagem bate");
});

if (falhas) {
  console.log(`\n${falhas} falha(s)`);
  process.exit(1);
}
console.log("\ntodas as asserções verdes");
