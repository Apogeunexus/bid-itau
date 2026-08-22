#!/usr/bin/env node
/**
 * gerar-grafo.mjs — transforma o acervo real em disco no grafo tipado do protótipo.
 *
 * Entrada  (somente leitura): dados/normalizado/*.json, dados/amostra/enciclopedia.jsonl
 *                             (ou o que ENCICLOPEDIA_FONTES apontar), dados/taxonomia/*.json,
 *                             dados/imagens/
 * Saída:                      src/dados/gerado/{entidades,arestas,vocabulario,ocorrencias,
 *                             personas,meta}.json  +  public/acervo/
 *
 * Contratos que o resto do projeto depende (D-15, D-17, D-18, DADO-01, DADO-05):
 *  - id no formato "{classe}:{origem}:{idOrigem}", origem em cms|enc|derivado|autorado
 *  - toda entidade carrega `procedencia`; toda entidade `ic` carrega `fonte` não vazia
 *  - `resumo` é texto puro — nenhuma marcação atravessa a fronteira do gerado
 *  - toda aresta `semelhante_a` carrega `motivo`; toda `atua_em` carrega `papel`
 *  - determinismo: saída ordenada por id e serializada com indent 2; duas execuções
 *    seguidas produzem bytes idênticos
 *
 * Transformação, nunca coleta: os dados já estão em disco e o gerador só os reescreve.
 *
 * Node puro, sem dependência. Reexecutável: `npm run gerar-grafo`.
 */

import {
  constants as FS, copyFileSync, createReadStream, existsSync, mkdirSync,
  readFileSync, statSync, writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DADOS = join(RAIZ, "dados");
const SAIDA = join(RAIZ, "src", "dados", "gerado");
const ACERVO = join(RAIZ, "public", "acervo");

/** Grau acima do qual um nó é concentrador. Espelha GRAU_HUB de src/dados/grafo.ts. */
const GRAU_HUB = 60;
/** Teto de arestas `semelhante_a` emitidas por entidade, para o arquivo não explodir. */
const FANOUT_SEMELHANTE = 20;
/**
 * Teto global de arestas `semelhante_a` (T-02-03). Quando a fonte da Enciclopédia
 * aponta para o crawl de 101 mil registros, um fanout fixo de 20 geraria 2 milhões de
 * arestas e centenas de MB. O fanout efetivo é reduzido para caber no orçamento, e o
 * valor usado fica registrado em meta.json — degradar em silêncio seria pior.
 */
const ORCAMENTO_SEMELHANTE = 150_000;
/**
 * Vizinhança examinada dentro de cada balde (linguagem, tema, território) ao procurar
 * candidatos a `semelhante_a`. Comparar todos contra todos é O(n²) e inviável no crawl
 * completo; a janela mantém o custo linear e distribui os pares em vez de concentrar
 * todo mundo nos mesmos 20 ids alfabeticamente primeiros.
 */
const JANELA_VIZINHANCA = 10;
/** Teto global de arestas `atua_em` derivadas por copresença. Mesmo motivo do anterior. */
const ORCAMENTO_COPRESENCA = 20_000;
/** Copresença emitida por agente, antes do ajuste ao orçamento. */
const FANOUT_COPRESENCA = 8;

const FONTE_TAXONOMIA = "https://www.itaucultural.org.br/secoes/rumos-itau-cultural";
const FONTE_ENCICLOPEDIA = "https://enciclopedia.itaucultural.org.br/";

// ---------------------------------------------------------------------------
// Saneamento — a fronteira disco → gerado (T-02-02)
// ---------------------------------------------------------------------------

const ENTIDADES_HTML = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "’",
  lsquo: "‘", ldquo: "“", rdquo: "”", aacute: "á",
  eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  agrave: "à", atilde: "ã", otilde: "õ", ccedil: "ç",
  acirc: "â", ecirc: "ê", ocirc: "ô",
};

/**
 * Converte marcação colada do Word (com resíduos `mso-`, comentários condicionais e
 * entidades escapadas) em texto puro de uma linha. É o único ponto de saneamento
 * do projeto — nenhum componente usa injeção de HTML cru.
 */
function paraTextoPuro(valor) {
  if (valor == null) return undefined;
  let t = String(valor);
  if (!t) return undefined;
  t = t.replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ");
  t = t.replace(/<br\s*\/?>/gi, " ");
  t = t.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ");
  t = t.replace(/<[^>]*>/g, "");
  // duas passadas: o CMS traz entidades duplamente escapadas (&amp;nbsp;)
  for (let i = 0; i < 2; i++) {
    t = t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    t = t.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
    t = t.replace(/&([a-z]+);/gi, (m, n) => ENTIDADES_HTML[n.toLowerCase()] ?? m);
  }
  t = t.replace(/\{[^{}]*mso-[^{}]*\}/gi, " ");
  t = t.replace(/[​﻿ ]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  // Depois de decodificar as entidades pode sobrar um `<` ou `>` solto vindo do texto
  // original. A invariante 4 proíbe qualquer um dos dois no gerado; trocar por aspas
  // preserva a leitura sem reabrir a superfície que T-02-02 fecha.
  t = t.replace(/</g, "‹").replace(/>/g, "›");
  return t || undefined;
}

function semAcento(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function paraSlug(valor) {
  return semAcento(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Título normalizado do critério de identidade (D-22): minúsculas, sem acento, sem
 * pontuação, espaços colapsados e artigo inicial removido.
 */
const ARTIGOS = new Set(["a", "o", "as", "os", "um", "uma", "uns", "umas"]);

function normalizarTitulo(valor) {
  let t = semAcento(valor).toLowerCase();
  t = t.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const partes = t.split(" ");
  if (partes.length > 1 && ARTIGOS.has(partes[0])) partes.shift();
  return partes.join(" ");
}

/**
 * FNV-1a de 32 bits. É a única fonte de "aleatoriedade" do gerador: semeada sempre por
 * um id do próprio acervo, nunca pelo relógio (D-15, D-21).
 */
function hash32(texto) {
  let h = 0x811c9dc5;
  const s = String(texto);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Envelope de entidade (D-17 / DADO-05)
// ---------------------------------------------------------------------------

const DIMENSOES_ACESSIBILIDADE = [
  "audio_description", "libras", "descriptive_subtitle", "closed_caption",
  "open_caption", "simultaneous_translation", "stenotypy", "subtitle",
];

/**
 * Saneia recursivamente todo texto que entra em `extra`. O campo é livre por
 * definição e carrega valor cru vindo do CMS e do crawl; sem esta passada a
 * invariante 4 (nenhum `<` ou `>` no gerado) valeria só para os campos nomeados.
 */
function sanearProfundo(valor) {
  if (typeof valor === "string") return paraTextoPuro(valor) ?? "";
  if (Array.isArray(valor)) return valor.map(sanearProfundo);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sanearProfundo(v)]),
    );
  }
  return valor ?? null;
}

function normalizarAcessibilidade(bruto) {
  const saida = {};
  for (const d of DIMENSOES_ACESSIBILIDADE) saida[d] = Boolean(bruto?.[d]);
  return saida;
}

/**
 * O registro de origem PREENCHEU a ficha das 8 dimensões?
 *
 * Esta é a metade da informação que o booleano sozinho não carrega, e sem ela a ficha
 * de D-43 não tem como separar «a instituição declarou que não tem audiodescrição» de
 * «a instituição não disse nada». `normalizarAcessibilidade` acha `false` nos dois
 * casos — por construção, porque ela devolve as 8 chaves sempre.
 *
 * O que separa os dois está na FORMA do objeto bruto, não no valor: `dados/normalizar.py`
 * emite as 8 chaves quando a fonte trouxe o campo e `null` quando não trouxe. Medido no
 * normalizado depois da correção: 2.514 dos 2.534 registros do CMS trazem as 8 chaves,
 * 20 não trazem, e a Enciclopédia não tem o campo em registro nenhum.
 *
 * Exigir as 8 e não «alguma»: um objeto parcial seria uma ficha meio preenchida, e
 * chamar isso de declaração afirmaria, em nome do Itaú Cultural, coisas que a fonte
 * não disse sobre as dimensões que faltam.
 */
function declaraAcessibilidade(bruto) {
  if (!bruto || typeof bruto !== "object") return false;
  return DIMENSOES_ACESSIBILIDADE.every((d) => typeof bruto[d] === "boolean");
}

/**
 * Único construtor de entidade. Recusa procedência `ic` sem fonte — é aqui que
 * DADO-05 deixa de ser recomendação e vira invariante do gerador.
 */
function criarEntidade({
  classe, origem, idOrigem, titulo, slug, resumo, imagem, creditoImagem,
  linguagens, temas, acessibilidade, declara, procedencia, fonte, chaveIdentidade,
  coordenada, derivadoDe, clonadoDe, variacao, extra,
}) {
  if (!["ic", "derivado", "autorado"].includes(procedencia)) {
    throw new Error(`entidade ${classe}:${origem}:${idOrigem} com procedencia inválida: ${procedencia}`);
  }
  if (procedencia === "ic" && !String(fonte ?? "").trim()) {
    throw new Error(`entidade ${classe}:${origem}:${idOrigem} tem procedencia "ic" sem fonte`);
  }
  const entidade = {
    id: `${classe}:${origem}:${idOrigem}`,
    classe,
    titulo: paraTextoPuro(titulo) ?? "(sem título)",
    slug: slug || paraSlug(titulo),
    linguagens: [...new Set(linguagens ?? [])].sort(),
    temas: [...new Set(temas ?? [])].sort(),
    acessibilidade: normalizarAcessibilidade(acessibilidade),
    // ESCRITO SEMPRE, inclusive quando é `false`. Campo omitido teria de ser lido como
    // «não declarou», e ler ausência como declaração é exatamente o erro que a ficha de
    // D-43 existe para não cometer. O campo que registra se houve declaração não pode
    // ele mesmo depender de ausência.
    //
    // `declara` explícito é para quem HERDA: temporada e ocorrência recebem a
    // acessibilidade do evento JÁ NORMALIZADA em 8 booleanos, e derivar a forma dela
    // devolveria `true` até para evento da Enciclopédia, que não declarou nada.
    declaraAcessibilidade: declara ?? declaraAcessibilidade(acessibilidade),
    procedencia,
  };
  const resumoLimpo = paraTextoPuro(resumo);
  if (resumoLimpo) entidade.resumo = resumoLimpo;
  if (imagem) entidade.imagem = String(imagem);
  const credito = paraTextoPuro(creditoImagem);
  if (credito) entidade.creditoImagem = credito;
  if (fonte) entidade.fonte = String(fonte);
  if (chaveIdentidade) entidade.chaveIdentidade = chaveIdentidade;
  if (coordenada) entidade.coordenada = coordenada;
  if (derivadoDe) entidade.derivadoDe = derivadoDe;
  if (clonadoDe) entidade.clonadoDe = clonadoDe;
  if (variacao) entidade.variacao = variacao;
  if (extra && Object.keys(extra).length) entidade.extra = sanearProfundo(extra);
  return entidade;
}

// ---------------------------------------------------------------------------
// Vocabulário controlado (D-08)
// ---------------------------------------------------------------------------

/**
 * A cor guarda o NOME DO TOKEN CSS, nunca o hex. O hex tem uma fonte de verdade
 * só — globals.css. A cor da linguagem é dado, não estilo (D-08).
 */
const TOKENS_APOIO = [
  "--ic-lilas", "--ic-azul", "--ic-amarelo", "--ic-rosa",
  "--ic-verde", "--ic-verde-agua", "--ic-laranja",
];

/**
 * Cor fixa para as linguagens que mais aparecem no acervo. A cauda recebe um ciclo
 * sobre a mesma lista, indexado pela posição alfabética — determinístico e estável.
 */
const COR_FIXA = {
  musica: "--ic-rosa",
  teatro: "--ic-lilas",
  "artes-visuais": "--ic-azul",
  literatura: "--ic-amarelo",
  danca: "--ic-verde",
  cinema: "--ic-verde-agua",
};

/**
 * A Enciclopédia usa rótulos próprios e 5 deles estão fora do vocabulário controlado
 * de 29 do CMS. O tratamento é deliberado e diferente para cada caso:
 *
 *  - ALIAS: `Tecnologia` → `arte e tecnologia`. É a única equivalência defensável:
 *    o vocabulário controlado já tem a entrada e o rótulo da Enciclopédia é a forma
 *    curta da mesma coisa.
 *  - PROMOVIDAS: `Arte`, `Gestão cultural`, `Rádio` e `TV` viram entradas novas do
 *    vocabulário, marcadas `ic` e com fonte na Enciclopédia. Vieram do próprio acervo
 *    do IC, então promovê-las é fidelidade. Forçá-las para dentro de uma entrada
 *    existente — `Rádio` em `audiovisual`, `Arte` em `arte e tecnologia` — seria
 *    fabricar dado, que é exatamente o que DADO-05 existe para impedir.
 */
const ALIAS_LINGUAGEM = { tecnologia: "arte-e-tecnologia" };
const LINGUAGENS_PROMOVIDAS = ["Arte", "Gestão cultural", "Rádio", "TV"];

function construirVocabulario() {
  const tax = JSON.parse(readFileSync(join(DADOS, "taxonomia", "linguagens.json"), "utf8"));
  const uso = new Map((tax.usoNoAcervo ?? []).map(([rotulo, n]) => [rotulo, n]));

  const controladas = [...tax.controlado].map((rotulo) => ({
    id: paraSlug(rotulo), rotulo, promovida: false, fonte: FONTE_TAXONOMIA,
  }));
  const promovidas = LINGUAGENS_PROMOVIDAS.map((rotulo) => ({
    id: paraSlug(rotulo), rotulo, promovida: true, fonte: FONTE_ENCICLOPEDIA,
  }));

  return [...controladas, ...promovidas]
    .sort((a, b) => a.id.localeCompare(b.id, "pt-BR"))
    .map((v, i) => ({
      id: v.id,
      rotulo: v.rotulo,
      cor: COR_FIXA[v.id] ?? TOKENS_APOIO[i % TOKENS_APOIO.length],
      ocorrencias: uso.get(v.rotulo) ?? 0,
      promovida: v.promovida,
      fonte: v.fonte,
    }));
}

function construirTemas() {
  const tax = JSON.parse(readFileSync(join(DADOS, "taxonomia", "temas.json"), "utf8"));
  const vistos = new Map();
  for (const [rotulo, n] of tax.uso ?? []) {
    const id = paraSlug(rotulo);
    if (!id) continue;
    const anterior = vistos.get(id);
    if (anterior) anterior.ocorrencias += n;
    else vistos.set(id, { id, rotulo, ocorrencias: n, fonte: FONTE_TAXONOMIA });
  }
  return [...vistos.values()].sort((a, b) => a.id.localeCompare(b.id, "pt-BR"));
}

function mapearLinguagens(brutas, idsValidos) {
  const mapeadas = [];
  const naoMapeadas = [];
  for (const bruta of brutas ?? []) {
    const chave = paraSlug(bruta);
    const alvo = ALIAS_LINGUAGEM[chave] ?? chave;
    if (idsValidos.has(alvo)) mapeadas.push(alvo);
    else naoMapeadas.push(String(bruta));
  }
  return {
    mapeadas: [...new Set(mapeadas)].sort(),
    naoMapeadas: [...new Set(naoMapeadas)].sort(),
  };
}

function mapearTemas(brutos, idsValidos) {
  const mapeados = [];
  const naoMapeados = [];
  for (const bruto of brutos ?? []) {
    const id = paraSlug(bruto);
    if (!id) continue;
    if (idsValidos.has(id)) mapeados.push(id);
    else naoMapeados.push(String(bruto));
  }
  return {
    mapeados: [...new Set(mapeados)].sort(),
    naoMapeados: [...new Set(naoMapeados)].sort(),
  };
}

// ---------------------------------------------------------------------------
// Classificação como entidade de primeira classe
// ---------------------------------------------------------------------------

function entidadesLinguagem(vocabulario) {
  return vocabulario.map((v) =>
    criarEntidade({
      classe: "linguagem",
      origem: v.promovida ? "enc" : "cms",
      idOrigem: v.id,
      titulo: v.rotulo,
      slug: v.id,
      resumo: v.promovida
        ? "Linguagem artística usada pela Enciclopédia Itaú Cultural, promovida ao vocabulário do protótipo por não ter equivalente no controlado do CMS."
        : "Linguagem artística do vocabulário controlado do Itaú Cultural.",
      linguagens: [v.id],
      temas: [],
      acessibilidade: {},
      procedencia: "ic",
      fonte: v.fonte,
      chaveIdentidade: `linguagem|${v.id}`,
      extra: { cor: v.cor, ocorrencias: v.ocorrencias, promovida: v.promovida },
    }),
  );
}

function entidadesTema(temas) {
  return temas.map((t) =>
    criarEntidade({
      classe: "tema",
      origem: "cms",
      idOrigem: t.id,
      titulo: t.rotulo,
      slug: t.id,
      resumo: "Assunto usado como tag livre no CMS do Itaú Cultural — não há vocabulário controlado de temas na fonte.",
      linguagens: [],
      temas: [t.id],
      acessibilidade: {},
      procedencia: "ic",
      fonte: FONTE_TAXONOMIA,
      chaveIdentidade: `tema|${t.id}`,
      extra: { ocorrencias: t.ocorrencias },
    }),
  );
}

// ---------------------------------------------------------------------------
// Leitura das fontes
// ---------------------------------------------------------------------------

/**
 * Leitura defensiva das fontes obrigatórias.
 *
 * Uma leitura truncada — arquivo com tamanho em disco mas conteúdo vazio — produziria
 * um grafo menor sem erro nenhum, e o resultado seria versionado como se fosse
 * legítimo. Abortar é a única resposta correta: transformação de dado ausente é dado
 * inventado por omissão.
 */
function lerNormalizado(nome) {
  const arquivo = join(DADOS, "normalizado", `${nome}.json`);
  const tamanho = statSync(arquivo).size;
  const bruto = readFileSync(arquivo, "utf8");
  if (bruto.length === 0 && tamanho > 0) {
    throw new Error(`leitura truncada: ${arquivo} tem ${tamanho} bytes em disco e leu 0`);
  }
  const lista = JSON.parse(bruto);
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error(`fonte obrigatória vazia: ${arquivo}`);
  }
  return lista;
}

/**
 * Fontes da Enciclopédia, configuráveis por `ENCICLOPEDIA_FONTES` (lista separada por
 * vírgula). Os arquivos são MESCLADOS e deduplicados por (tipo, id), primeira
 * ocorrência vencendo.
 *
 * Mesclar em vez de substituir é deliberado: o crawl completo em
 * `dados/bruto/enciclopedia/itens.jsonl` tem mais de 100 mil registros mas só de três
 * tipos — pessoa, obra e evento. Não tem termo, grupo nem instituição. Apontar só para
 * ele destruiria o tesauro de 481 termos, que é justamente a espinha do Cenário 1.
 *
 * A leitura é por stream linha a linha: o crawl tem 42 MB e carregá-lo inteiro em
 * memória é a superfície de T-02-03.
 */
const FONTES_ENC = (process.env.ENCICLOPEDIA_FONTES ?? "dados/amostra/enciclopedia.jsonl")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

async function lerEnciclopedia() {
  const registros = [];
  const vistos = new Set();
  const relatorio = [];

  for (const caminhoRelativo of FONTES_ENC) {
    const arquivo = resolve(RAIZ, caminhoRelativo);
    if (!existsSync(arquivo)) {
      console.warn(`  aviso: fonte da Enciclopédia ausente, ignorada: ${caminhoRelativo}`);
      relatorio.push({ fonte: caminhoRelativo, lidos: 0, novos: 0, ausente: true });
      continue;
    }
    const tamanho = statSync(arquivo).size;
    let lidos = 0;
    let novos = 0;
    const leitor = createInterface({
      input: createReadStream(arquivo, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const linha of leitor) {
      const texto = linha.trim();
      if (!texto) continue;
      let registro;
      try {
        registro = JSON.parse(texto);
      } catch {
        // Linha truncada (o crawl pode estar escrevendo agora). Contada, nunca adivinhada.
        continue;
      }
      lidos++;
      const chave = `${registro.tipo}:${registro.id}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      registros.push(registro);
      novos++;
    }
    if (lidos === 0 && tamanho > 0) {
      throw new Error(`leitura truncada: ${arquivo} tem ${tamanho} bytes em disco e não rendeu registro nenhum`);
    }
    relatorio.push({ fonte: caminhoRelativo, lidos, novos });
  }

  if (!registros.length) throw new Error("nenhuma fonte da Enciclopédia rendeu registro");
  return { registros, relatorio };
}

// ---------------------------------------------------------------------------
// Território saneado → espaço e território (camada 2 da ontologia)
// ---------------------------------------------------------------------------

/** Chave canônica de município: cidade|estado, porque há homônimos entre estados. */
function chaveMunicipio(local) {
  return `${local.cidade}|${local.estado ?? ""}`;
}

function idMunicipio(local) {
  return `territorio:derivado:${paraSlug(local.cidade)}-${paraSlug(local.estado ?? "br")}`;
}

function idEstado(local) {
  return `territorio:derivado:uf-${paraSlug(local.estado)}`;
}

function idPais(local) {
  return `territorio:derivado:pais-${paraSlug(local.pais)}`;
}

function idEspaco(local) {
  return `espaco:derivado:${paraSlug(local.espaco)}-${paraSlug(local.cidade ?? local.pais)}`;
}

/**
 * Varre os `locais[]` já saneados da Enciclopédia e produz as entidades de lugar.
 * Território e espaço não existem como registro na fonte — são a leitura estruturada
 * de um campo textual, e por isso saem `derivado`, com `derivadoDe` apontando para a
 * primeira entidade que forneceu o local.
 */
function entidadesLugar(registrosEnc, classePorTipo) {
  const espacos = new Map();
  const municipios = new Map();
  const estados = new Map();
  const paises = new Map();
  const situacoes = [];

  for (const r of registrosEnc) {
    const classe = classePorTipo[r.tipo];
    if (!classe) continue;
    const idOrigemEntidade = `${classe}:enc:${r.id}`;
    for (const local of r.locais ?? []) {
      if (!local?.pais) continue;

      const paisId = idPais(local);
      if (!paises.has(paisId)) {
        paises.set(paisId, { id: paisId, nome: local.pais, derivadoDe: idOrigemEntidade, nivel: "pais" });
      }

      let municipioId = null;
      let estadoId = null;

      if (local.estado) {
        estadoId = idEstado(local);
        if (!estados.has(estadoId)) {
          estados.set(estadoId, {
            id: estadoId, nome: local.estado, pais: local.pais, paisId,
            derivadoDe: idOrigemEntidade, nivel: "estado",
          });
        }
      }

      if (local.cidade) {
        municipioId = idMunicipio(local);
        if (!municipios.has(municipioId)) {
          municipios.set(municipioId, {
            id: municipioId, nome: local.cidade, estado: local.estado ?? null,
            pais: local.pais, estadoId, paisId, chave: chaveMunicipio(local),
            derivadoDe: idOrigemEntidade, nivel: "municipio",
          });
        }
      }

      if (local.espaco) {
        const espacoId = idEspaco(local);
        if (!espacos.has(espacoId)) {
          espacos.set(espacoId, {
            id: espacoId, nome: local.espaco, cidade: local.cidade ?? null,
            estado: local.estado ?? null, pais: local.pais,
            municipioId, estadoId, paisId, derivadoDe: idOrigemEntidade,
          });
        }
        situacoes.push({ de: idOrigemEntidade, para: espacoId });
      }

      // A entidade fica situada no território mais específico que a fonte deu.
      const alvo = municipioId ?? estadoId ?? paisId;
      situacoes.push({ de: idOrigemEntidade, para: alvo });
    }
  }

  return { espacos, municipios, estados, paises, situacoes };
}

function materializarLugares({ espacos, municipios, estados, paises }) {
  const entidades = [];
  const semCoordenada = [];

  for (const e of espacos.values()) {
    const coordenada = coordenadaDeEspaco(e);
    if (!coordenada) semCoordenada.push({ id: e.id, nome: e.nome, nivel: "espaco" });
    entidades.push(criarEntidade({
      classe: "espaco", origem: "derivado", idOrigem: e.id.split(":").pop(),
      titulo: e.nome, slug: paraSlug(`${e.nome}-${e.cidade ?? e.pais}`),
      coordenada,
      resumo: `Espaço cultural citado no campo territorial da Enciclopédia Itaú Cultural${e.cidade ? `, em ${e.cidade}` : ""}.`,
      linguagens: [], temas: [], acessibilidade: {},
      procedencia: "derivado", derivadoDe: e.derivadoDe,
      chaveIdentidade: `espaco|${normalizarTitulo(e.nome)}|${paraSlug(e.cidade ?? e.pais)}`,
      extra: { cidade: e.cidade, estado: e.estado, pais: e.pais, nivel: "espaco" },
    }));
  }

  for (const t of [...municipios.values(), ...estados.values(), ...paises.values()]) {
    const coordenada = coordenadaDeTerritorio(t);
    if (!coordenada) semCoordenada.push({ id: t.id, nome: t.nome, nivel: t.nivel });
    entidades.push(criarEntidade({
      classe: "territorio", origem: "derivado", idOrigem: t.id.split(":").pop(),
      coordenada,
      titulo: t.nome, slug: paraSlug(`${t.nome}-${t.nivel === "municipio" ? t.estado ?? "" : t.nivel === "estado" ? "uf" : "pais"}`),
      resumo: `${t.nivel === "municipio" ? "Município" : t.nivel === "estado" ? "Unidade federativa" : "País"} extraído do campo territorial saneado da Enciclopédia Itaú Cultural.`,
      linguagens: [], temas: [], acessibilidade: {},
      procedencia: "derivado", derivadoDe: t.derivadoDe,
      chaveIdentidade: `territorio|${t.nivel}|${normalizarTitulo(t.nome)}|${normalizarTitulo(t.estado ?? t.pais ?? "")}`,
      extra: { nivel: t.nivel, estado: t.estado ?? null, pais: t.pais ?? t.nome },
    }));
  }

  return { entidades, semCoordenada: semCoordenada.sort((a, b) => a.id.localeCompare(b.id)) };
}

// ---------------------------------------------------------------------------
// Imagens locais (DADO-08, D-23, T-02-01)
// ---------------------------------------------------------------------------

/** Chave aceitável de `indice.json`: hash hexadecimal + extensão de imagem. */
const CHAVE_IMAGEM = /^[0-9a-f]{8,}\.(jpg|jpeg|png|webp)$/;

/**
 * Traduz o campo `dono` de indice.json para o id do grafo.
 * Formatos observados: `enc:{tipo}:{id}`, `midia:{id}`, `agente:{id}`,
 * `formacao:{id}`, `publicacao:{id}`.
 */
const CLASSE_POR_TIPO_ENC = {
  pessoa: "pessoa", grupo: "coletivo", instituicao: "instituicao",
  obra: "obra", termo: "termo", evento: "evento",
};

function donoParaId(dono) {
  const partes = String(dono ?? "").split(":");
  if (partes[0] === "enc" && partes.length === 3) {
    const classe = CLASSE_POR_TIPO_ENC[partes[1]];
    return classe ? `${classe}:enc:${partes[2]}` : null;
  }
  if (partes.length !== 2) return null;
  const [tipo, id] = partes;
  if (tipo === "agente") return `pessoa:cms:${id}`;
  if (["midia", "formacao", "publicacao", "conteudo", "evento"].includes(tipo)) {
    return `${tipo}:cms:${id}`;
  }
  return null;
}

/**
 * Copia o acervo de imagens para `public/acervo/` e devolve os dois mapas de casamento.
 *
 * Duas travas antes de qualquer escrita (T-02-01): a chave do índice precisa casar
 * CHAVE_IMAGEM, e o destino, depois de `resolve`, precisa continuar dentro de
 * `public/acervo/`. Chave fora do padrão é ignorada, logada e contada — nunca usada.
 */
function publicarImagens() {
  const origem = join(DADOS, "imagens");
  // `copiados`/`jaPresentes` NÃO entram em meta.json: dependem do que já estava em
  // disco e fariam a primeira execução divergir da segunda, quebrando D-15. Vão só
  // para o log. O que fica registrado é o que é função da entrada.
  const relatorio = {
    disponivel: false, arquivos: 0, presentes: 0,
    chavesRejeitadas: 0, exemplosRejeitados: [], donosDesconhecidos: 0,
  };
  let copiados = 0;
  let jaPresentes = 0;
  const porUrl = new Map();
  const porDono = new Map();

  if (!existsSync(join(origem, "indice.json"))) {
    console.warn("  aviso: dados/imagens/indice.json ausente — entidades ficam sem imagem local.");
    return { relatorio, porUrl, porDono };
  }

  const arquivoIndice = join(origem, "indice.json");
  const brutoIndice = readFileSync(arquivoIndice, "utf8");
  if (brutoIndice.length === 0 && statSync(arquivoIndice).size > 0) {
    throw new Error(`leitura truncada: ${arquivoIndice} tem tamanho em disco e leu 0`);
  }
  const indice = JSON.parse(brutoIndice);
  relatorio.disponivel = true;
  mkdirSync(ACERVO, { recursive: true });

  const indiceLimpo = {};
  for (const chave of Object.keys(indice).sort()) {
    if (!CHAVE_IMAGEM.test(chave)) {
      relatorio.chavesRejeitadas++;
      if (relatorio.exemplosRejeitados.length < 5) relatorio.exemplosRejeitados.push(chave);
      console.warn(`  aviso: chave de imagem fora do padrão, ignorada: ${JSON.stringify(chave)}`);
      continue;
    }
    const destino = resolve(ACERVO, chave);
    if (destino !== join(ACERVO, chave) || !destino.startsWith(ACERVO + sep)) {
      relatorio.chavesRejeitadas++;
      console.warn(`  aviso: destino de imagem escaparia de public/acervo/, ignorado: ${chave}`);
      continue;
    }

    const registro = indice[chave];
    indiceLimpo[chave] = registro;
    relatorio.arquivos++;

    const fonte = join(origem, chave);
    if (existsSync(fonte)) {
      const precisaCopiar =
        !existsSync(destino) || statSync(destino).size !== statSync(fonte).size;
      if (precisaCopiar) {
        copyFileSync(fonte, destino, FS.COPYFILE_FICLONE);
        copiados++;
      } else {
        jaPresentes++;
      }
      relatorio.presentes++;
    }

    const local = `/acervo/${chave}`;
    if (registro?.url) porUrl.set(registro.url, { local, url: registro.url });
    const donoId = donoParaId(registro?.dono);
    if (donoId) {
      if (!porDono.has(donoId)) porDono.set(donoId, { local, url: registro?.url ?? null });
    } else if (registro?.dono) {
      relatorio.donosDesconhecidos++;
    }
  }

  // O índice é copiado preservado (só reordenado por chave, para o byte ser estável).
  writeFileSync(join(ACERVO, "indice.json"), `${JSON.stringify(indiceLimpo, null, 2)}\n`, "utf8");
  console.log(
    `  acervo: ${relatorio.presentes} imagens em public/acervo/ ` +
      `(${copiados} copiadas agora, ${jaPresentes} já presentes)`,
  );
  return { relatorio, porUrl, porDono };
}

/**
 * Resolve a imagem de uma entidade para um caminho LOCAL. Nunca devolve URL remota:
 * o protótipo tem de abrir sem rede (D-23), então a URL de origem vai para
 * `extra.imagemFonte`, onde continua auditável sem virar requisição.
 *
 * O casamento é por URL primeiro — é a procedência exata — e por `dono` como reserva.
 */
function resolverImagem(urlOriginal, id, imagens) {
  const porUrl = urlOriginal ? imagens.porUrl.get(urlOriginal) : undefined;
  const porDono = imagens.porDono.get(id);
  const escolhida = porUrl ?? porDono;
  return {
    imagem: escolhida?.local ?? null,
    imagemFonte: urlOriginal ?? escolhida?.url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Entidades do CMS
// ---------------------------------------------------------------------------

const CATEGORIA_PADRAO = {
  evento: "agenda-cultural", conteudo: "noticias", midia: "ic-play",
  publicacao: "publicacoes", formacao: "formacoes",
};

function fonteCms(registro, classe) {
  const categoria = paraSlug(registro.categoria) || CATEGORIA_PADRAO[classe] || "noticias";
  return `https://www.itaucultural.org.br/${categoria}/${registro.slug}`;
}

/** Fábrica comum aos cinco tipos editoriais do CMS — mesma forma de registro. */
function entidadesDoCms(arquivo, classe, idsLinguagem, idsTema, imagens) {
  const brutos = lerNormalizado(arquivo);
  return brutos.map((r) => {
    const idOrigem = String(r.id).split(":").pop();
    const id = `${classe}:cms:${idOrigem}`;
    const { mapeadas, naoMapeadas } = mapearLinguagens(r.linguagens, idsLinguagem);
    const { mapeados, naoMapeados } = mapearTemas(r.temas, idsTema);
    const { imagem, imagemFonte } = resolverImagem(r.imagem, id, imagens);

    const extra = {
      categoria: r.categoria ?? null,
      publicadoEm: r.publicadoEm ?? null,
      imagemAlt: paraTextoPuro(r.imagemAlt) ?? null,
      imagemFonte,
      agentes: [...(r.agentes ?? [])].sort(),
      origemCms: [...(r._origem ?? [])].sort(),
    };
    if (naoMapeadas.length) extra.linguagensNaoMapeadas = naoMapeadas;
    if (naoMapeados.length) extra.temasNaoMapeados = naoMapeados;

    if (classe === "evento") {
      extra.periodo = r.periodo ?? null;
      extra.presencial = Boolean(r.presencial);
      extra.online = Boolean(r.online);
      extra.comIngresso = Boolean(r.comIngresso);
      extra.esgotado = Boolean(r.esgotado);
      // A fonte só tem o booleano de ingresso; valor de preço não existe e não é inventado.
      extra.preco = null;
    }

    return criarEntidade({
      classe, origem: "cms", idOrigem,
      titulo: r.titulo, slug: r.slug, resumo: r.resumo,
      imagem, creditoImagem: r.creditoImagem,
      linguagens: mapeadas, temas: mapeados,
      acessibilidade: r.acessibilidade,
      procedencia: "ic",
      fonte: fonteCms(r, classe),
      // D-22: título normalizado | agente | obra. Sem agente nem obra na fonte a
      // posição fica vazia — a chave continua calculável e a ausência fica visível.
      chaveIdentidade: `${classe}|${normalizarTitulo(r.titulo)}|${[...(r.agentes ?? [])].sort().join(",")}|`,
      extra,
    });
  });
}

/** Os 152 agentes do CMS são `pessoa` — papel mora na aresta `atua_em` (DADO-03). */
function entidadesAgente(imagens) {
  const brutos = lerNormalizado("agentes");
  return brutos.map((a) => {
    const idOrigem = String(a.id).split(":").pop();
    const id = `pessoa:cms:${idOrigem}`;
    const slug = paraSlug(a.nome) || `agente-${idOrigem}`;
    const { imagem, imagemFonte } = resolverImagem(a.imagem, id, imagens);
    return criarEntidade({
      classe: "pessoa", origem: "cms", idOrigem,
      titulo: a.nome, slug, resumo: a.bio,
      imagem,
      linguagens: [], temas: [], acessibilidade: {},
      procedencia: "ic",
      fonte: `https://www.itaucultural.org.br/pessoas/${slug}`,
      chaveIdentidade: `pessoa|${normalizarTitulo(a.nome)}||`,
      extra: {
        // `papeis` é insumo da aresta `atua_em`, não classe de entidade (DADO-03).
        papeis: [...(a.papeis ?? [])].sort(),
        conteudos: [...(a._conteudos ?? [])].sort(),
        ativo: Boolean(a.ativo),
        imagemFonte,
        procedenciaCampos: a._procedencia ?? null,
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Entidades da Enciclopédia
// ---------------------------------------------------------------------------

function entidadesDaEnciclopedia(registros, idsLinguagem, imagens) {
  const saida = [];
  for (const r of registros) {
    const classe = CLASSE_POR_TIPO_ENC[r.tipo];
    if (!classe) continue;
    const id = `${classe}:enc:${r.id}`;
    const { mapeadas, naoMapeadas } = mapearLinguagens(r.linguagens, idsLinguagem);
    const { imagem, imagemFonte } = resolverImagem(r.imagem, id, imagens);
    const detalhe = paraTextoPuro(r.detalhe);

    const extra = { rota: r.rota, locais: r.locais ?? [], imagemFonte };
    if (detalhe) extra.detalhe = detalhe;
    if (naoMapeadas.length) extra.linguagensNaoMapeadas = naoMapeadas;

    const primeiro = (r.locais ?? [])[0];
    if (primeiro) {
      extra.territorio = {
        cidade: primeiro.cidade ?? null,
        estado: primeiro.estado ?? null,
        pais: primeiro.pais ?? null,
        espaco: primeiro.espaco ?? null,
        data: primeiro.data ?? null,
      };
    }

    saida.push(criarEntidade({
      classe, origem: "enc", idOrigem: String(r.id),
      titulo: r.titulo, slug: r.slug, resumo: detalhe,
      imagem, creditoImagem: r.creditoImagem,
      linguagens: mapeadas, temas: [], acessibilidade: {},
      procedencia: "ic", fonte: r.url,
      chaveIdentidade: `${classe}|${normalizarTitulo(r.titulo)}||`,
      extra,
    }));
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Camada 3 da ontologia — Evento, Temporada e Ocorrência (DADO-02, D-21, D-22)
// ---------------------------------------------------------------------------

/**
 * Teto de dias de visitação derivados para um período longo.
 *
 * O acervo tem períodos de até 3.327 dias — nove anos — que são resíduo do CMS, não
 * temporada de verdade. Sem teto, a regra "visitação diária" de D-21 produziria mais
 * de 10 mil ocorrências para um punhado de eventos. O corte é declarado, contado em
 * `meta.cobertura.ocorrenciasTruncadas` e nunca silencioso; o alternativo — inventar
 * um fim plausível para o período — violaria DADO-05.
 */
const DIAS_MAX_VISITACAO = 60;
/** Fronteira entre "temporada de semanas" e "longa duração", em dias (D-21). */
const DIAS_TEMPORADA = 45;
/** Quantidade de duplicatas do Cenário 3. A autoconferência exige de 35 a 45. */
const TOTAL_DUPLICATAS = 40;

const DIA_MS = 86_400_000;

/** Só a data, em UTC, para o cálculo não depender do fuso de quem roda o gerador. */
function paraDataUtc(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dataIso(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function instanteIso(ms, hora, minuto) {
  const d = new Date(ms);
  d.setUTCHours(hora, minuto, 0, 0);
  return `${d.toISOString().slice(0, 19)}-03:00`.replace(/Z$/, "");
}

/** Dia da semana em UTC: 0 domingo … 6 sábado. */
function diaDaSemana(ms) {
  return new Date(ms).getUTCDay();
}

/**
 * Ocorrências derivadas do período real por regra determinística (D-21).
 *
 * A semente é o id do evento, nunca o relógio: mesma entrada, mesma saída, sempre.
 * As três regras batem com a distribuição medida do acervo (30 eventos de um dia,
 * 29 temporadas curtas, 30 de longa duração), o que valida a regra em vez de forçá-la.
 */
function derivarOcorrencias(evento, temporada, deslocamentoMinutos = 0) {
  const inicio = paraDataUtc(temporada.inicio);
  const fim = paraDataUtc(temporada.fim);
  if (inicio == null || fim == null) return { ocorrencias: [], truncado: 0 };

  const semente = hash32(evento.id);
  const dias = Math.round((fim - inicio) / DIA_MS);
  const gratuito = !evento.extra?.comIngresso;
  const esgotado = Boolean(evento.extra?.esgotado);

  const instantes = [];
  let truncado = 0;

  if (dias <= 0) {
    // 1 dia → 1 ocorrência, com hora estável dentro da faixa noturna.
    instantes.push([inicio, 19 + (semente % 3), (semente >> 3) % 2 === 0 ? 0 : 30]);
  } else if (dias <= DIAS_TEMPORADA) {
    // 2 a 45 dias → sessões semanais em quinta, sexta e sábado, 20h.
    for (let t = inicio; t <= fim; t += DIA_MS) {
      if ([4, 5, 6].includes(diaDaSemana(t))) instantes.push([t, 20, 0]);
    }
  } else {
    // Mais de 45 dias → visitação diária, com um dia de fechamento semanal estável.
    const fechamento = semente % 7;
    const limite = Math.min(fim, inicio + DIAS_MAX_VISITACAO * DIA_MS);
    if (limite < fim) truncado = Math.round((fim - limite) / DIA_MS);
    for (let t = inicio; t <= limite; t += DIA_MS) {
      if (diaDaSemana(t) === fechamento) continue;
      const h = 10 + ((semente + Math.round((t - inicio) / DIA_MS)) % 3);
      instantes.push([t, h, 0]);
    }
  }

  const ocorrencias = instantes.map(([t, hora, minuto], i) => {
    const minutoFinal = minuto + deslocamentoMinutos;
    const inicioIso = instanteIso(t, hora, minutoFinal);
    const numero = String(i + 1).padStart(4, "0");
    const idOrigem = `${temporada.id.split(":").slice(2).join(":")}-o${numero}`;
    return {
      id: `ocorrencia:derivado:${idOrigem}`,
      temporadaId: temporada.id,
      eventoId: evento.id,
      inicio: inicioIso,
      espacoId: temporada.espacoId ?? null,
      // A fonte só tem o booleano `ticket`; valor de preço não existe e não é inventado.
      preco: null,
      gratuito,
      esgotado,
      acessibilidade: evento.acessibilidade,
      declaraAcessibilidade: evento.declaraAcessibilidade === true,
      procedencia: "derivado",
      derivadoDe: temporada.id,
      // D-22: temporada | início exato | espaço.
      chaveIdentidade: `${temporada.id}|${inicioIso}|${temporada.espacoId ?? ""}`,
    };
  });

  return { ocorrencias, truncado };
}

/**
 * Temporadas: o recorte com começo, fim e espaço. Duas origens, ambas reais.
 *
 * Do CMS vem o `periodo` dos 100 eventos — sem espaço, porque a fonte não tem
 * nenhum. Da Enciclopédia vem cada entrada de `locais[]` dos 160 eventos, que traz
 * espaço e ano de verdade. Nos dois casos a procedência é `ic`: a temporada é
 * reestruturação de campo existente, não invenção.
 */
function construirAcontecimentos(entidades, espacoDeLocal) {
  const temporadas = [];
  const ocorrencias = [];
  const cobertura = {
    eventosSemPeriodo: 0,
    eventosComOcorrencia: 0,
    ocorrenciasTruncadas: 0,
    diasTruncados: 0,
    temporadasSemOcorrencia: 0,
  };

  for (const evento of entidades) {
    if (evento.classe !== "evento") continue;

    if (evento.id.startsWith("evento:enc:")) {
      // Enciclopédia: uma temporada por local, com espaço e ano reais. A data é
      // grossa demais (só o ano em muitos casos) para render sessão datada — e
      // fabricar hora aqui seria exatamente o que DADO-05 proíbe.
      const locais = Array.isArray(evento.extra?.locais) ? evento.extra.locais : [];
      locais.forEach((local, i) => {
        const ano = String(local?.data ?? "").match(/(\d{4})/);
        if (!ano) return;
        const espacoId = local?.espaco ? espacoDeLocal(local) : null;
        temporadas.push({
          id: `temporada:enc:${evento.id.split(":").pop()}-t${i + 1}`,
          eventoId: evento.id,
          espacoId,
          inicio: `${ano[1]}-01-01`,
          fim: `${ano[1]}-12-31`,
          procedencia: "ic",
          fonte: evento.fonte,
          dataDeclarada: local?.data ?? null,
        });
        cobertura.temporadasSemOcorrencia++;
      });
      continue;
    }

    const periodo = evento.extra?.periodo;
    if (!periodo?.inicio) {
      cobertura.eventosSemPeriodo++;
      continue;
    }
    const inicio = dataIso(paraDataUtc(periodo.inicio));
    const fim = dataIso(paraDataUtc(periodo.fim ?? periodo.inicio) ?? paraDataUtc(periodo.inicio));

    const temporada = {
      id: `temporada:${evento.id.split(":")[1]}:${evento.id.split(":").pop()}-t1`,
      eventoId: evento.id,
      espacoId: null,
      inicio,
      fim,
      procedencia: evento.procedencia === "autorado" ? "derivado" : "ic",
      fonte: evento.fonte ?? null,
      derivadoDe: evento.procedencia === "autorado" ? evento.id : undefined,
    };
    temporadas.push(temporada);

    const deslocamento = Number(evento.extra?.deslocamentoMinutos ?? 0);
    const { ocorrencias: geradas, truncado } = derivarOcorrencias(evento, temporada, deslocamento);
    if (geradas.length) cobertura.eventosComOcorrencia++;
    else cobertura.temporadasSemOcorrencia++;
    if (truncado) {
      cobertura.ocorrenciasTruncadas++;
      cobertura.diasTruncados += truncado;
    }
    ocorrencias.push(...geradas);
  }

  return { temporadas, ocorrencias, cobertura };
}

/** Temporada e ocorrência como nós de primeira classe, não array aninhado. */
function materializarAcontecimentos(temporadas, ocorrencias, porId) {
  const entidades = [];

  for (const t of temporadas) {
    const evento = porId.get(t.eventoId);
    const rotulo = t.inicio === t.fim ? t.inicio : `${t.inicio} a ${t.fim}`;
    entidades.push(criarEntidade({
      classe: "temporada",
      origem: t.id.split(":")[1],
      idOrigem: t.id.split(":").slice(2).join(":"),
      titulo: `${evento?.titulo ?? t.eventoId} — ${rotulo}`,
      slug: paraSlug(t.id.split(":").slice(2).join("-")),
      resumo: `Recorte com começo e fim do evento, ${t.espacoId ? "com espaço declarado na fonte" : "sem espaço declarado na fonte"}.`,
      linguagens: evento?.linguagens ?? [],
      temas: evento?.temas ?? [],
      acessibilidade: evento?.acessibilidade ?? {},
      declara: evento?.declaraAcessibilidade ?? false,
      procedencia: t.procedencia,
      fonte: t.fonte ?? undefined,
      derivadoDe: t.derivadoDe,
      // D-22: evento | espaço | intervalo em ISO.
      chaveIdentidade: `${t.eventoId}|${t.espacoId ?? ""}|${t.inicio}/${t.fim}`,
      extra: {
        eventoId: t.eventoId,
        espacoId: t.espacoId,
        inicio: t.inicio,
        fim: t.fim,
        dataDeclarada: t.dataDeclarada ?? null,
      },
    }));
  }

  for (const o of ocorrencias) {
    const evento = porId.get(o.eventoId);
    entidades.push(criarEntidade({
      classe: "ocorrencia",
      origem: "derivado",
      idOrigem: o.id.split(":").slice(2).join(":"),
      titulo: `${evento?.titulo ?? o.eventoId} — ${o.inicio.slice(0, 16).replace("T", " ")}`,
      slug: paraSlug(o.id.split(":").slice(2).join("-")),
      resumo: `Sessão datada derivada do período real do evento pela regra de D-21${o.gratuito ? ", gratuita" : ", com ingresso"}.`,
      linguagens: evento?.linguagens ?? [],
      temas: evento?.temas ?? [],
      acessibilidade: o.acessibilidade,
      declara: o.declaraAcessibilidade,
      procedencia: "derivado",
      derivadoDe: o.derivadoDe,
      chaveIdentidade: o.chaveIdentidade,
      extra: {
        eventoId: o.eventoId,
        temporadaId: o.temporadaId,
        espacoId: o.espacoId,
        inicio: o.inicio,
        gratuito: o.gratuito,
        esgotado: o.esgotado,
        preco: o.preco,
      },
    }));
  }

  return entidades;
}

/** `ocorre_em` liga cada nível ao seguinte: ocorrência → temporada → evento. */
function arestasOcorreEm(temporadas, ocorrencias) {
  const arestas = [];
  for (const t of temporadas) {
    arestas.push({
      de: t.id, para: t.eventoId, relacao: "ocorre_em",
      procedencia: t.procedencia, peso: 1,
    });
    if (t.espacoId) {
      arestas.push({
        de: t.id, para: t.espacoId, relacao: "situado_em",
        procedencia: "ic", peso: 1,
      });
    }
  }
  for (const o of ocorrencias) {
    arestas.push({
      de: o.id, para: o.temporadaId, relacao: "ocorre_em",
      procedencia: "derivado", peso: 1,
    });
  }
  return arestas;
}

// ---------------------------------------------------------------------------
// As ~40 duplicatas do Cenário 3 (DADO-07, D-22)
// ---------------------------------------------------------------------------

/**
 * Cada variação viola o critério de identidade de um jeito nomeado. O Studio da fase 4
 * renderiza `variacao` e o `motivo` da aresta literalmente — é isso que transforma
 * "achamos que é duplicata" em "eis o critério que disparou a suspeita".
 */
const VARIACOES = [
  {
    nome: "caixa alterada no título",
    aplicar: (t) => t.toUpperCase(),
    motivo: "o título normalizado é idêntico — só a caixa muda, e o critério de identidade ignora caixa",
  },
  {
    nome: "prefixo do produtor no título",
    aplicar: (t) => `Itaú Cultural apresenta: ${t}`,
    motivo: "o título ganhou um prefixo institucional, mas o miolo normalizado continua o mesmo do original",
  },
  {
    nome: "espaço duplo e pontuação trocada",
    aplicar: (t) => t.replace(/ /g, "  ").replace(/[—–-]/g, " - ").replace(/[.]/g, ""),
    motivo: "a pontuação e o espaçamento mudaram; o critério colapsa espaços e remove pontuação, então a chave bate",
  },
  {
    nome: "acento removido",
    aplicar: (t) => semAcento(t),
    motivo: "os acentos sumiram; o critério compara sem acento e reconhece o mesmo título",
  },
  {
    nome: "sufixo de edição acrescentado",
    aplicar: (t) => `${t} (2ª edição)`,
    motivo: "o sufixo de edição sugere outro acontecimento, mas título, agente e obra continuam os mesmos",
  },
  {
    nome: "nome do espaço grafado de outra forma",
    aplicar: (t) => t.replace(/Itaú Cultural/gi, "IC"),
    motivo: "o nome do espaço foi abreviado; o restante do título normalizado é idêntico",
  },
  {
    nome: "ocorrência deslocada em minutos",
    aplicar: (t) => t,
    deslocamentoMinutos: 15,
    motivo: "o título é o mesmo e as sessões saíram deslocadas em 15 minutos — mesma temporada, mesmo espaço",
  },
];

/**
 * As duplicatas entram no MESMO `entidades.json` das reais. Num arquivo à parte o
 * Studio estaria resolvendo um problema encenado; o ponto do Cenário 3 é justamente
 * que elas convivem com o acervo e só o critério de identidade as separa.
 */
function construirDuplicatas(entidades) {
  const candidatos = entidades
    .filter((e) => e.classe === "evento" && e.procedencia === "ic" && e.extra?.periodo?.inicio)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, TOTAL_DUPLICATAS);

  const clones = [];
  const arestas = [];

  candidatos.forEach((original, i) => {
    const variacao = VARIACOES[i % VARIACOES.length];
    const titulo = variacao.aplicar(original.titulo);
    const idOrigem = `dup-${String(i + 1).padStart(3, "0")}-${original.id.split(":").pop()}`;
    const extra = {
      ...(original.extra ?? {}),
      duplicataDe: original.id,
      deslocamentoMinutos: variacao.deslocamentoMinutos ?? 0,
    };

    const clone = criarEntidade({
      classe: "evento",
      origem: "autorado",
      idOrigem,
      titulo,
      slug: paraSlug(`${titulo}-${idOrigem}`),
      resumo: original.resumo,
      imagem: original.imagem,
      creditoImagem: original.creditoImagem,
      linguagens: original.linguagens,
      temas: original.temas,
      acessibilidade: original.acessibilidade,
      declara: original.declaraAcessibilidade,
      procedencia: "autorado",
      clonadoDe: original.id,
      variacao: variacao.nome,
      // A chave é recalculada sobre o título alterado: é ela que precisa COLIDIR com
      // a do original para o Studio ter o que resolver.
      chaveIdentidade: `evento|${normalizarTitulo(titulo)}|${(original.extra?.agentes ?? []).join(",")}|`,
      extra,
    });
    clones.push(clone);

    arestas.push({
      de: clone.id,
      para: original.id,
      relacao: "duplicata_suspeita",
      procedencia: "autorado",
      peso: 1,
      motivo: `mesma chave de identidade do original (${variacao.nome}): ${variacao.motivo}`,
    });
  });

  return { clones, arestas };
}

// ---------------------------------------------------------------------------
// Arestas
// ---------------------------------------------------------------------------

/** `pertence_a`: a entidade → cada linguagem e cada tema que declara. */
function arestasPertenceA(entidades, porLinguagemId, porTemaId) {
  const arestas = [];
  for (const e of entidades) {
    if (e.classe === "linguagem") {
      // a própria linguagem não pertence a si mesma
    } else {
      for (const l of e.linguagens) {
        const alvo = porLinguagemId.get(l);
        if (alvo) arestas.push({ de: e.id, para: alvo.id, relacao: "pertence_a", procedencia: "ic", peso: 1 });
      }
    }
    if (e.classe !== "tema") {
      for (const t of e.temas) {
        const alvo = porTemaId.get(t);
        if (alvo) arestas.push({ de: e.id, para: alvo.id, relacao: "pertence_a", procedencia: "ic", peso: 1 });
      }
    }
  }
  return arestas;
}

const ROTULO_CLASSE = {
  evento: "eventos", pessoa: "pessoas", coletivo: "coletivos",
  instituicao: "instituições", espaco: "espaços", obra: "obras",
  termo: "termos", conteudo: "conteúdos", midia: "mídias",
  publicacao: "publicações", formacao: "formações", territorio: "territórios",
  temporada: "temporadas", ocorrencia: "ocorrências",
};

function listar(nomes) {
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/**
 * `semelhante_a` entre pares da mesma classe, com `motivo` montado a partir do que de
 * fato é compartilhado (D-18, DADO-04). Aresta sem motivo aborta a geração.
 *
 * Candidatos vêm da vizinhança dentro de cada balde (linguagem, tema, município),
 * ordenados por id. Comparar todos contra todos é O(n²) e inviável no crawl completo
 * (T-02-03); a janela mantém o custo linear e evita que todo mundo aponte para os
 * mesmos 20 ids alfabeticamente primeiros.
 */
function arestasSemelhanteA(entidades, vocabulario, temas, municipioDaEntidade, fanout) {
  const rotuloLinguagem = new Map(vocabulario.map((v) => [v.id, v.rotulo]));
  const rotuloTema = new Map(temas.map((t) => [t.id, t.rotulo]));

  const CLASSES_ELEGIVEIS = new Set([
    "evento", "pessoa", "coletivo", "instituicao", "obra", "termo",
    "conteudo", "midia", "publicacao", "formacao", "espaco",
  ]);

  const elegiveis = entidades
    .filter((e) => CLASSES_ELEGIVEIS.has(e.classe))
    .sort((a, b) => a.id.localeCompare(b.id));

  /** baldes: classe|tipo|valor → lista de ids, já ordenada */
  const baldes = new Map();
  const atributos = new Map();
  for (const e of elegiveis) {
    const meus = [];
    for (const l of e.linguagens) meus.push(["linguagem", l]);
    for (const t of e.temas) meus.push(["tema", t]);
    const municipio = municipioDaEntidade.get(e.id);
    if (municipio) meus.push(["territorio", municipio.id]);
    atributos.set(e.id, meus);
    for (const [tipo, valor] of meus) {
      const chave = `${e.classe}|${tipo}|${valor}`;
      const lista = baldes.get(chave);
      if (lista) lista.push(e.id);
      else baldes.set(chave, [e.id]);
    }
  }

  const posicao = new Map();
  for (const [chave, lista] of baldes) {
    for (let i = 0; i < lista.length; i++) posicao.set(`${chave}#${lista[i]}`, i);
  }

  const nomeTerritorio = new Map();
  for (const [, m] of municipioDaEntidade) nomeTerritorio.set(m.id, m.nome);

  const arestas = [];
  const emitidas = new Set();

  for (const e of elegiveis) {
    const meus = atributos.get(e.id) ?? [];
    if (!meus.length) continue;
    const candidatos = new Map();

    for (const [tipo, valor] of meus) {
      const chave = `${e.classe}|${tipo}|${valor}`;
      const lista = baldes.get(chave) ?? [];
      const i = posicao.get(`${chave}#${e.id}`) ?? 0;
      const inicio = Math.max(0, i - JANELA_VIZINHANCA);
      const fim = Math.min(lista.length, i + JANELA_VIZINHANCA + 1);
      for (let j = inicio; j < fim; j++) {
        const outro = lista[j];
        if (outro === e.id) continue;
        const acc = candidatos.get(outro) ?? { linguagem: [], tema: [], territorio: [] };
        acc[tipo].push(valor);
        candidatos.set(outro, acc);
      }
    }

    const melhores = [...candidatos.entries()]
      .map(([id, acc]) => ({
        id,
        linguagem: [...new Set(acc.linguagem)].sort(),
        tema: [...new Set(acc.tema)].sort(),
        territorio: [...new Set(acc.territorio)].sort(),
      }))
      .map((c) => ({ ...c, pontos: c.linguagem.length + c.tema.length + c.territorio.length }))
      .sort((a, b) => b.pontos - a.pontos || a.id.localeCompare(b.id))
      .slice(0, fanout);

    for (const m of melhores) {
      const par = e.id < m.id ? `${e.id} ${m.id}` : `${m.id} ${e.id}`;
      if (emitidas.has(par)) continue;
      emitidas.add(par);

      const rotulo = ROTULO_CLASSE[e.classe] ?? `${e.classe}s`;
      const segmentos = [`os dois são ${rotulo}`];
      if (m.linguagem.length) {
        segmentos.push(`de ${listar(m.linguagem.map((l) => rotuloLinguagem.get(l) ?? l))}`);
      }
      if (m.territorio.length) {
        segmentos.push(`em ${listar(m.territorio.map((t) => nomeTerritorio.get(t) ?? t))}`);
      }
      if (m.tema.length) {
        segmentos.push(`sobre ${listar(m.tema.map((t) => rotuloTema.get(t) ?? t))}`);
      }
      const motivo = `parecido porque ${segmentos.join(", ")}`;
      if (!motivo.trim()) throw new Error(`aresta semelhante_a ${e.id}→${m.id} sem motivo`);

      arestas.push({
        de: e.id, para: m.id, relacao: "semelhante_a",
        procedencia: "derivado", peso: m.pontos, motivo,
      });
    }
  }
  return arestas;
}

// ---------------------------------------------------------------------------
// Coordenadas por tabela estática (D-19, D-20, DADO-06)
// ---------------------------------------------------------------------------

/**
 * Nenhuma API de geocodificação participa da geração. A tabela é escrita à mão e
 * cobre os 118 municípios, as 27 unidades federativas e os 41 países que aparecem no
 * território saneado. Trocar por uma tabela do IBGE é trocar de arquivo, não de código.
 */
const CENTROIDES = JSON.parse(
  readFileSync(join(RAIZ, "scripts", "dados", "centroides.json"), "utf8"),
);

/** Deslocamento máximo do pino de um espaço em relação ao centro da cidade, em graus. */
const DESLOCAMENTO_ESPACO = 0.0045; // ≈ 500 m

function arredondar(valor, casas) {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

/** Coordenada do território, com o método declarado (D-20). Nunca chuta em silêncio. */
function coordenadaDeTerritorio(t) {
  if (t.nivel === "municipio") {
    const c = CENTROIDES.municipios[`${t.nome}|${t.estado ?? ""}`];
    if (c) return { lat: c.lat, lon: c.lon, procedencia: "derivado", metodo: "centroide-municipio" };
  }
  if (t.nivel === "estado" || t.nivel === "municipio") {
    const c = CENTROIDES.estados[t.estado ?? t.nome];
    if (c) return { lat: c.lat, lon: c.lon, procedencia: "derivado", metodo: "centroide-estado" };
  }
  const c = CENTROIDES.paises[t.pais ?? t.nome];
  if (c) return { lat: c.lat, lon: c.lon, procedencia: "derivado", metodo: "centroide-pais" };
  return null;
}

/**
 * O espaço herda a coordenada da cidade com um deslocamento determinístico derivado do
 * hash do nome: os pinos não se empilham e o resultado é idêntico entre execuções.
 * O método declarado deixa claro que o ponto é do bairro, não da porta.
 */
function coordenadaDeEspaco(espaco) {
  const base =
    (espaco.cidade && CENTROIDES.municipios[`${espaco.cidade}|${espaco.estado ?? ""}`]) ||
    (espaco.estado && CENTROIDES.estados[espaco.estado]) ||
    CENTROIDES.paises[espaco.pais];
  if (!base) return null;
  const h = hash32(espaco.nome);
  const dLat = ((h % 1000) / 1000 - 0.5) * 2 * DESLOCAMENTO_ESPACO;
  const dLon = (((h >>> 10) % 1000) / 1000 - 0.5) * 2 * DESLOCAMENTO_ESPACO;
  return {
    lat: arredondar(base.lat + dLat, 5),
    lon: arredondar(base.lon + dLon, 5),
    procedencia: "derivado",
    metodo: "deslocamento-por-espaco",
  };
}

// ---------------------------------------------------------------------------
// Arestas de território, agência e conteúdo
// ---------------------------------------------------------------------------

/**
 * `situado_em`: a entidade no lugar, e a hierarquia do lugar.
 * espaço → município → estado → país. Procedência `ic`: o território vem saneado da
 * fonte; a coordenada é que é derivada, e ela mora na entidade, não na aresta.
 */
function arestasSituadoEm(lugares, porId) {
  const arestas = [];
  const vistas = new Set();
  const push = (de, para) => {
    if (!de || !para || de === para) return;
    const chave = `${de}→${para}`;
    if (vistas.has(chave)) return;
    if (!porId.has(de) || !porId.has(para)) return;
    vistas.add(chave);
    arestas.push({ de, para, relacao: "situado_em", procedencia: "ic", peso: 1 });
  };

  for (const s of lugares.situacoes) push(s.de, s.para);
  for (const e of lugares.espacos.values()) push(e.id, e.municipioId ?? e.estadoId ?? e.paisId);
  for (const m of lugares.municipios.values()) push(m.id, m.estadoId ?? m.paisId);
  for (const uf of lugares.estados.values()) push(uf.id, uf.paisId);
  return arestas;
}

/** Papel legível a partir do vocabulário de `papeis` do CMS. */
function papelDoAgente(entidade) {
  const papeis = Array.isArray(entidade.extra?.papeis) ? entidade.extra.papeis : [];
  return papeis.length ? papeis.join(" e ") : "participante";
}

/**
 * `atua_em` — o papel mora NA ARESTA, nunca como classe (DADO-03). Duas origens:
 *
 *  - do CMS: os conteúdos que declaram agente e os agentes que declaram conteúdo.
 *    Procedência `ic`, papel vindo do campo `papeis`.
 *  - da Enciclopédia: copresença por MUNICÍPIO entre agente e evento que compartilham
 *    ao menos uma linguagem. Procedência `derivado`, papel `artista`.
 *
 * Copresença por ESPAÇO não funciona e isso está medido: espaço só aparece em obra e
 * evento, e o cruzamento agente × evento por espaço dá zero pares. Por município dá.
 */
function arestasAtuaEm(entidades, porId, municipioDaEntidade, fanoutCopresenca) {
  const arestas = [];
  const vistas = new Set();
  const emitir = (de, para, papel, procedencia) => {
    const chave = `${de}→${para}`;
    if (vistas.has(chave)) return;
    if (!porId.has(de) || !porId.has(para) || de === para) return;
    if (!String(papel ?? "").trim()) {
      throw new Error(`aresta atua_em ${de}→${para} sem papel`);
    }
    vistas.add(chave);
    arestas.push({ de, para, relacao: "atua_em", procedencia, peso: 1, papel });
  };

  // --- origem CMS
  for (const e of entidades) {
    if (e.classe === "pessoa" && e.id.startsWith("pessoa:cms:")) {
      const papel = papelDoAgente(e);
      for (const conteudoId of e.extra?.conteudos ?? []) {
        const alvo = `conteudo:cms:${String(conteudoId).split(":").pop()}`;
        emitir(e.id, alvo, papel, "ic");
      }
      continue;
    }
    for (const agenteId of e.extra?.agentes ?? []) {
      const agente = porId.get(`pessoa:cms:${String(agenteId).split(":").pop()}`);
      if (!agente) continue;
      emitir(agente.id, e.id, papelDoAgente(agente), "ic");
    }
  }

  // --- origem Enciclopédia: copresença por município
  const eventosPorMunicipio = new Map();
  for (const e of entidades) {
    if (e.classe !== "evento" || !e.id.startsWith("evento:enc:")) continue;
    const m = municipioDaEntidade.get(e.id);
    if (!m) continue;
    const lista = eventosPorMunicipio.get(m.id);
    if (lista) lista.push(e);
    else eventosPorMunicipio.set(m.id, [e]);
  }
  for (const lista of eventosPorMunicipio.values()) {
    lista.sort((a, b) => a.id.localeCompare(b.id));
  }

  const agentes = entidades
    .filter((e) => ["pessoa", "coletivo"].includes(e.classe) && e.id.includes(":enc:"))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const agente of agentes) {
    const m = municipioDaEntidade.get(agente.id);
    if (!m) continue;
    const candidatos = eventosPorMunicipio.get(m.id) ?? [];
    let emitidos = 0;
    for (const evento of candidatos) {
      if (emitidos >= fanoutCopresenca) break;
      const comuns = agente.linguagens.filter((l) => evento.linguagens.includes(l));
      if (!comuns.length) continue;
      emitir(agente.id, evento.id, "artista", "derivado");
      emitidos++;
    }
  }

  return arestas;
}

/** `realiza`: instituição → evento no mesmo município. Derivado, com teto por instituição. */
function arestasRealiza(entidades, municipioDaEntidade, teto = 5) {
  const eventosPorMunicipio = new Map();
  for (const e of entidades) {
    if (e.classe !== "evento") continue;
    const m = municipioDaEntidade.get(e.id);
    if (!m) continue;
    const lista = eventosPorMunicipio.get(m.id);
    if (lista) lista.push(e);
    else eventosPorMunicipio.set(m.id, [e]);
  }
  for (const lista of eventosPorMunicipio.values()) lista.sort((a, b) => a.id.localeCompare(b.id));

  const arestas = [];
  const instituicoes = entidades
    .filter((e) => e.classe === "instituicao")
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const inst of instituicoes) {
    const m = municipioDaEntidade.get(inst.id);
    if (!m) continue;
    let emitidos = 0;
    for (const evento of eventosPorMunicipio.get(m.id) ?? []) {
      if (emitidos >= teto) break;
      if (evento.id === inst.id) continue;
      arestas.push({
        de: inst.id, para: evento.id, relacao: "realiza",
        procedencia: "derivado", peso: 1,
      });
      emitidos++;
    }
  }
  return arestas;
}

/**
 * `aprofunda` (conteúdo editorial) e `fala_sobre` (mídia): o material que explica a
 * entidade. Exige linguagem E tema compartilhados — só linguagem ligaria tudo a tudo.
 */
function arestasEditoriais(entidades, teto = 5) {
  const alvos = entidades
    .filter((e) => !["conteudo", "midia", "linguagem", "tema", "ocorrencia", "temporada"].includes(e.classe))
    .filter((e) => e.linguagens.length && e.temas.length)
    .sort((a, b) => a.id.localeCompare(b.id));

  const porLinguagem = new Map();
  for (const alvo of alvos) {
    for (const l of alvo.linguagens) {
      const lista = porLinguagem.get(l);
      if (lista) lista.push(alvo);
      else porLinguagem.set(l, [alvo]);
    }
  }

  const arestas = [];
  const fontes = entidades
    .filter((e) => ["conteudo", "midia"].includes(e.classe))
    .filter((e) => e.linguagens.length && e.temas.length)
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const fonte of fontes) {
    const relacao = fonte.classe === "conteudo" ? "aprofunda" : "fala_sobre";
    const vistos = new Set();
    let emitidos = 0;
    for (const l of fonte.linguagens) {
      for (const alvo of porLinguagem.get(l) ?? []) {
        if (emitidos >= teto) break;
        if (alvo.id === fonte.id || vistos.has(alvo.id)) continue;
        if (!alvo.temas.some((t) => fonte.temas.includes(t))) continue;
        vistos.add(alvo.id);
        arestas.push({
          de: fonte.id, para: alvo.id, relacao,
          procedencia: "derivado", peso: 1,
        });
        emitidos++;
      }
      if (emitidos >= teto) break;
    }
  }
  return arestas;
}

// ---------------------------------------------------------------------------
// Personas (DADO-07, D-25) e a trilha autorada do Cenário 1
// ---------------------------------------------------------------------------

const FONTE_AUTORADA = "protótipo Agenda Cultural BR — dado autorado, rotulado como tal na tela";

/** Escolhe ids REAIS do grafo, de forma determinística. Nada de entidade fictícia. */
function escolher(entidades, filtro, quantos) {
  return entidades
    .filter(filtro)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, quantos)
    .map((e) => e.id);
}

function construirPersonas(entidades, ocorrencias, municipioDaEntidade) {
  const noMunicipio = (e, nome) => municipioDaEntidade.get(e.id)?.nome === nome;

  const maria = {
    linguagens: ["musica", "poesia", "literatura"],
    entidades: [
      "termo:enc:80292",
      ...escolher(entidades, (e) => e.classe === "termo" && e.linguagens.includes("musica"), 5),
      ...escolher(entidades, (e) => e.classe === "pessoa" && e.linguagens.includes("musica"), 4),
    ],
  };
  const carlos = {
    linguagens: ["artes-visuais", "teatro", "cultura-popular"],
    entidades: [
      ...escolher(entidades, (e) => noMunicipio(e, "Belém") && e.classe === "evento", 6),
      ...escolher(entidades, (e) => noMunicipio(e, "Belém") && e.classe === "pessoa", 4),
      ...escolher(entidades, (e) => noMunicipio(e, "Belém") && e.classe === "instituicao", 2),
    ],
  };
  const joana = {
    linguagens: ["teatro", "danca", "cinema", "artes-visuais", "literatura"],
    entidades: [
      ...escolher(entidades, (e) => e.classe === "evento" && e.procedencia === "ic" && e.linguagens.includes("teatro"), 5),
      ...escolher(entidades, (e) => e.classe === "midia" && e.linguagens.includes("cinema"), 4),
    ],
  };

  const salvas = ocorrencias
    .filter((o) => o.gratuito)
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((o) => o.id);

  const definicoes = [
    {
      idOrigem: "maria",
      titulo: "Maria",
      resumo: "Ouve rap desde a adolescência e nunca foi ao teatro. É a persona do Cenário 1: a recomendação precisa explicar por que a poesia falada se parece com o que ela já ouve.",
      repertorio: { ...maria, ocorrenciasSalvas: [] },
    },
    {
      idOrigem: "carlos",
      titulo: "Carlos",
      resumo: "Vai passar quatro dias em Belém e quer saber o que a cidade tem de cultura. É a persona do Cenário 2: o repertório é de território, não de gênero.",
      repertorio: { ...carlos, ocorrenciasSalvas: [] },
    },
    {
      idOrigem: "joana",
      titulo: "Joana",
      resumo: "Frequentadora antiga, com repertório largo e agenda cheia. É a persona do Cenário 4: tem ocorrência salva que pode ser alterada para disparar o alerta de mudança.",
      repertorio: { ...joana, ocorrenciasSalvas: salvas },
    },
  ];

  const personas = [];
  const entidadesPersona = [];
  const arestas = [];

  for (const d of definicoes) {
    const id = `pessoa-usuaria:autorado:${d.idOrigem}`;
    const repertorio = {
      id: `repertorio:autorado:${d.idOrigem}`,
      pessoaUsuariaId: id,
      // Linguagens já atravessadas — é daí que sai o indicador de ampliação de
      // repertório do Observatório (fase 5).
      linguagens: [...new Set(d.repertorio.linguagens)].sort(),
      entidades: [...new Set(d.repertorio.entidades)].sort(),
      ocorrenciasSalvas: [...new Set(d.repertorio.ocorrenciasSalvas)].sort(),
      procedencia: "autorado",
    };

    personas.push({
      id, nome: d.titulo, resumo: d.resumo,
      procedencia: "autorado", fonte: FONTE_AUTORADA, repertorio,
    });

    entidadesPersona.push(criarEntidade({
      classe: "pessoa-usuaria", origem: "autorado", idOrigem: d.idOrigem,
      titulo: d.titulo, slug: d.idOrigem, resumo: d.resumo,
      linguagens: repertorio.linguagens, temas: [], acessibilidade: {},
      procedencia: "autorado",
      chaveIdentidade: `pessoa-usuaria|${normalizarTitulo(d.titulo)}||`,
      extra: { mock: true, repertorioId: repertorio.id },
    }));

    entidadesPersona.push(criarEntidade({
      classe: "repertorio", origem: "autorado", idOrigem: d.idOrigem,
      titulo: `Repertório de ${d.titulo}`, slug: `repertorio-${d.idOrigem}`,
      resumo: "Linguagens já atravessadas e ocorrências salvas. Aponta só para ids reais do acervo.",
      linguagens: repertorio.linguagens, temas: [], acessibilidade: {},
      procedencia: "autorado",
      chaveIdentidade: `repertorio|${d.idOrigem}||`,
      extra: {
        pessoaUsuariaId: id,
        entidades: repertorio.entidades,
        ocorrenciasSalvas: repertorio.ocorrenciasSalvas,
      },
    }));

    arestas.push({
      de: id, para: repertorio.id, relacao: "pertence_a",
      procedencia: "autorado", peso: 1,
    });
    for (const alvo of repertorio.entidades) {
      arestas.push({
        de: repertorio.id, para: alvo, relacao: "dialoga_com",
        procedencia: "autorado", peso: 1,
      });
    }
  }

  return { personas, entidades: entidadesPersona, arestas };
}

/**
 * A ÚNICA coisa autorada nas arestas do grafo, e o porquê está medido:
 *
 * `Rap` é linguagem Música e `Slam` é linguagem Literatura. Os dois não compartilham
 * nenhum atributo na fonte, então nenhuma regra derivada os liga — a ponte é
 * conhecimento cultural, não inferência de dado. Inventar uma regra de derivação que
 * fizesse a ligação parecer emergente seria pior que autorar: seria autorar escondido.
 *
 * Modelada como `Trilha` sobre entidades REAIS da Enciclopédia, que é o que
 * `docs/telas.md` já prevê para a tela 7. Cada passo vira uma `semelhante_a` com
 * `procedencia: "autorado"` e motivo escrito por extenso.
 */
const TRILHA_CENARIO_1 = {
  idOrigem: "do-rap-ao-teatro-documentario",
  titulo: "Do rap ao teatro documentário, em 3 passos",
  resumo: "Trilha autorada sobre entidades reais da Enciclopédia. Liga o que a fonte não liga: rap e slam não compartilham nenhum atributo no acervo, e a ponte entre eles é conhecimento cultural, não dado.",
  passos: [
    {
      de: "termo:enc:80292",
      para: "termo:enc:80282",
      motivo: "quem ouve rap costuma chegar à poesia falada pela batida e pela rima — o slam é a poesia dita em voz alta, em disputa",
    },
    {
      de: "termo:enc:80282",
      para: "termo:enc:79963",
      motivo: "do slam ao palco é um passo curto: nos dois a pessoa fala em primeira pessoa sobre a própria vida, e o teatro do oprimido nasceu justamente de pôr o depoimento em cena",
    },
  ],
};

function construirTrilha(porId, entidades) {
  const passos = TRILHA_CENARIO_1.passos.filter((p) => porId.has(p.de) && porId.has(p.para));
  if (passos.length !== TRILHA_CENARIO_1.passos.length) {
    const faltando = TRILHA_CENARIO_1.passos
      .filter((p) => !porId.has(p.de) || !porId.has(p.para))
      .map((p) => `${p.de} → ${p.para}`);
    throw new Error(`trilha do Cenário 1 aponta para entidade inexistente: ${faltando.join(", ")}`);
  }

  // O destino final é um evento REAL, datado e gratuito, escolhido de forma
  // determinística — não um id escrito à mão que apodrece na primeira regeração.
  const destino = entidades
    .filter(
      (e) =>
        e.classe === "evento" &&
        e.procedencia === "ic" &&
        e.linguagens.includes("teatro") &&
        e.extra?.periodo?.inicio &&
        !e.extra?.comIngresso,
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0];

  const passosCompletos = [...passos];
  if (destino) {
    passosCompletos.push({
      de: TRILHA_CENARIO_1.passos[TRILHA_CENARIO_1.passos.length - 1].para,
      para: destino.id,
      // Sem adjetivo que o acervo não sustenta: o evento é um espetáculo de teatro
      // real, com data e entrada gratuita. Chamá-lo de "teatro documentário" seria
      // atribuir ao registro uma classificação que a fonte não deu.
      motivo: "daqui a trilha sai da enciclopédia e vira agenda: um espetáculo de teatro do próprio acervo, com data marcada e entrada gratuita, para o passo seguinte ser sair de casa",
    });
  }

  const idTrilha = `trilha:autorado:${TRILHA_CENARIO_1.idOrigem}`;
  const sequencia = [passosCompletos[0].de, ...passosCompletos.map((p) => p.para)];

  const entidadeTrilha = criarEntidade({
    classe: "trilha", origem: "autorado", idOrigem: TRILHA_CENARIO_1.idOrigem,
    titulo: TRILHA_CENARIO_1.titulo, slug: TRILHA_CENARIO_1.idOrigem,
    resumo: TRILHA_CENARIO_1.resumo,
    linguagens: ["musica", "literatura", "poesia", "teatro"],
    temas: [], acessibilidade: {},
    procedencia: "autorado",
    chaveIdentidade: `trilha|${normalizarTitulo(TRILHA_CENARIO_1.titulo)}||`,
    extra: { passos: sequencia, autoradaPorque: "rap e slam não compartilham atributo na fonte" },
  });

  const arestas = passosCompletos.map((p) => ({
    de: p.de, para: p.para, relacao: "semelhante_a",
    procedencia: "autorado", peso: 3, motivo: p.motivo,
  }));

  for (const alvo of sequencia) {
    arestas.push({
      de: idTrilha, para: alvo, relacao: "contextualiza",
      procedencia: "autorado", peso: 1,
    });
  }

  return { entidade: entidadeTrilha, arestas, sequencia };
}

// ---------------------------------------------------------------------------
// Autoconferência — o gerador confere a si mesmo antes de escrever
// ---------------------------------------------------------------------------

const CLASSES_DE_PAPEL = new Set(["artista", "curador", "produtor", "educador"]);

function falhar(mensagem, exemplo) {
  const detalhe = exemplo === undefined ? "" : `\n  exemplo: ${JSON.stringify(exemplo)}`;
  throw new Error(`autoconferência falhou: ${mensagem}${detalhe}`);
}

/** Percorre todo campo string de um objeto, sem recursão infinita. */
function* textos(valor, caminho = "") {
  if (typeof valor === "string") {
    yield [caminho, valor];
  } else if (Array.isArray(valor)) {
    for (let i = 0; i < valor.length; i++) yield* textos(valor[i], `${caminho}[${i}]`);
  } else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) yield* textos(v, caminho ? `${caminho}.${k}` : k);
  }
}

/**
 * As invariantes da ontologia moram aqui e não num plano: é isto que as mantém
 * valendo nas fases 2 a 6. Qualquer violação aborta com código diferente de zero
 * ANTES de escrever — um grafo inválido nunca chega ao disco.
 */
function conferir(grafo) {
  const { entidades, arestas } = grafo;
  const porId = new Map(entidades.map((e) => [e.id, e]));

  // 1. procedência em toda entidade
  const semProcedencia = entidades.filter((e) => !["ic", "derivado", "autorado"].includes(e.procedencia));
  if (semProcedencia.length) falhar(`${semProcedencia.length} entidades sem procedência válida`, semProcedencia[0].id);

  // 2. fonte em toda entidade `ic`
  const icSemFonte = entidades.filter((e) => e.procedencia === "ic" && !String(e.fonte ?? "").trim());
  if (icSemFonte.length) falhar(`${icSemFonte.length} entidades ic sem fonte`, icSemFonte[0].id);

  // 3. papel nunca é classe (DADO-03)
  const papelComoClasse = entidades.filter((e) => CLASSES_DE_PAPEL.has(e.classe));
  if (papelComoClasse.length) falhar(`${papelComoClasse.length} entidades com classe de papel`, papelComoClasse[0].id);

  // 4. nenhum campo de texto com marcação
  let comMarcacao = 0;
  let exemploMarcacao;
  for (const e of entidades) {
    for (const [campo, texto] of textos(e)) {
      if (texto.includes("<") || texto.includes(">")) {
        comMarcacao++;
        exemploMarcacao ??= `${e.id} · ${campo} · ${texto.slice(0, 120)}`;
      }
    }
  }
  if (comMarcacao) falhar(`${comMarcacao} campos de texto com marcação não saneada`, exemploMarcacao);

  // ids únicos
  if (porId.size !== entidades.length) {
    const vistos = new Set();
    const repetido = entidades.find((e) => (vistos.has(e.id) ? true : (vistos.add(e.id), false)));
    falhar("id duplicado no grafo", repetido?.id);
  }

  // 5. motivo em toda `semelhante_a`
  const semMotivo = arestas.filter((a) => a.relacao === "semelhante_a" && !String(a.motivo ?? "").trim());
  if (semMotivo.length) falhar(`${semMotivo.length} arestas semelhante_a sem motivo`, semMotivo[0]);

  // 6. papel em toda `atua_em`
  const semPapel = arestas.filter((a) => a.relacao === "atua_em" && !String(a.papel ?? "").trim());
  if (semPapel.length) falhar(`${semPapel.length} arestas atua_em sem papel`, semPapel[0]);

  // 7. toda aresta aponta para nós existentes
  const soltas = arestas.filter((a) => !porId.has(a.de) || !porId.has(a.para));
  if (soltas.length) falhar(`${soltas.length} arestas apontando para nó inexistente`, soltas[0]);

  // 8. ocorrência é sempre derivada e sempre tem chave de identidade de 3 segmentos
  const ocorrencias = grafo.ocorrencias ?? [];
  const ocorrenciaNaoDerivada = ocorrencias.filter((o) => o.procedencia !== "derivado");
  if (ocorrenciaNaoDerivada.length) {
    falhar(`${ocorrenciaNaoDerivada.length} ocorrências não marcadas derivado`, ocorrenciaNaoDerivada[0].id);
  }
  const chaveIncompleta = ocorrencias.filter(
    (o) => String(o.chaveIdentidade ?? "").split("|").length < 3,
  );
  if (chaveIncompleta.length) {
    falhar(`${chaveIncompleta.length} ocorrências com chave de identidade incompleta`, chaveIncompleta[0]?.chaveIdentidade);
  }

  // 9. as duplicatas do Cenário 3, entre 35 e 45, todas catalogadas
  const clones = entidades.filter((e) => e.clonadoDe);
  if (clones.length < 35 || clones.length > 45) {
    falhar(`duplicatas fora da faixa de 35 a 45: ${clones.length}`);
  }
  const cloneIncompleto = clones.filter(
    (e) => !e.variacao || e.procedencia !== "autorado" || !porId.has(e.clonadoDe),
  );
  if (cloneIncompleto.length) {
    falhar(`${cloneIncompleto.length} duplicatas sem variação, sem procedência autorado ou órfãs`, cloneIncompleto[0].id);
  }
  const suspeitas = arestas.filter((a) => a.relacao === "duplicata_suspeita");
  if (suspeitas.length < clones.length) {
    falhar(`${clones.length} duplicatas mas só ${suspeitas.length} arestas duplicata_suspeita`);
  }
  const suspeitaSemMotivo = suspeitas.filter((a) => !String(a.motivo ?? "").trim());
  if (suspeitaSemMotivo.length) {
    falhar(`${suspeitaSemMotivo.length} arestas duplicata_suspeita sem motivo`, suspeitaSemMotivo[0]);
  }

  // 10. todo lugar que a TABELA cobre tem coordenada; o que ela não cobre é contado em
  // meta.cobertura.semCoordenada, com os nomes. A distinção importa: ficar sem
  // coordenada porque a tabela não tem a cidade é um limite declarado do protótipo;
  // ficar sem coordenada tendo a cidade na tabela é bug do gerador, e aborta.
  const comLugar = entidades.filter((e) => ["espaco", "territorio"].includes(e.classe));
  const semCoordenada = comLugar.filter((e) => !e.coordenada || typeof e.coordenada.lat !== "number");
  const deveriaTerCoordenada = semCoordenada.filter((e) => {
    const extra = e.extra ?? {};
    const chave = `${e.titulo}|${extra.estado ?? ""}`;
    return Boolean(
      CENTROIDES.municipios[chave] ||
        CENTROIDES.estados[extra.estado ?? e.titulo] ||
        CENTROIDES.paises[extra.pais ?? e.titulo],
    );
  });
  if (deveriaTerCoordenada.length) {
    falhar(
      `${deveriaTerCoordenada.length} lugares sem coordenada apesar de estarem na tabela de centroides`,
      deveriaTerCoordenada[0].id,
    );
  }
  const coordenadaSuspeita = comLugar.filter(
    (e) => e.coordenada && (e.coordenada.procedencia !== "derivado" || !e.coordenada.metodo),
  );
  if (coordenadaSuspeita.length) {
    falhar(`${coordenadaSuspeita.length} coordenadas sem procedência derivado ou sem método (viola D-20)`, coordenadaSuspeita[0].id);
  }

  // 11. exatamente 3 pessoas-usuárias, autoradas, com repertório não vazio
  const usuarias = entidades.filter((e) => e.classe === "pessoa-usuaria");
  if (usuarias.length !== 3) falhar(`esperado 3 pessoas-usuárias, achei ${usuarias.length}`);
  const usuariaInvalida = usuarias.filter((e) => e.procedencia !== "autorado");
  if (usuariaInvalida.length) falhar("pessoa-usuária não marcada autorado", usuariaInvalida[0].id);
  const personas = grafo.personas ?? [];
  const semRepertorio = personas.filter(
    (p) => !p.repertorio || !(p.repertorio.linguagens ?? []).length || !(p.repertorio.entidades ?? []).length,
  );
  if (semRepertorio.length) falhar("persona sem repertório", semRepertorio[0]?.id);
  const repertorioOrfao = personas.flatMap((p) =>
    (p.repertorio?.entidades ?? []).filter((id) => !porId.has(id)),
  );
  if (repertorioOrfao.length) {
    falhar(`${repertorioOrfao.length} ids de repertório não existem no grafo`, repertorioOrfao[0]);
  }

  // (classe, slug) único: sem isto uma rota estática engole a entidade homônima
  const slugsVistos = new Map();
  for (const e of entidades) {
    const chave = `${e.classe}/${e.slug}`;
    if (!e.slug) falhar("entidade sem slug", e.id);
    if (slugsVistos.has(chave)) falhar(`slug repetido dentro da classe: ${chave}`, [slugsVistos.get(chave), e.id]);
    slugsVistos.set(chave, e.id);
  }

  const semProcedenciaAresta = arestas.filter((a) => !["ic", "derivado", "autorado"].includes(a.procedencia));
  if (semProcedenciaAresta.length) {
    falhar(`${semProcedenciaAresta.length} arestas sem procedência válida`, semProcedenciaAresta[0]);
  }

  return grafo;
}

// ---------------------------------------------------------------------------
// Escrita determinística
// ---------------------------------------------------------------------------

function escrever(nome, valor) {
  mkdirSync(SAIDA, { recursive: true });
  writeFileSync(join(SAIDA, nome), `${JSON.stringify(valor, null, 2)}\n`, "utf8");
}

function contar(lista, chave) {
  const out = {};
  for (const item of lista) {
    const k = typeof chave === "function" ? chave(item) : item[chave];
    if (k == null) continue;
    out[k] = (out[k] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function ordenarEntidades(entidades) {
  return [...entidades].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Sob `output: "export"` (D-24) a rota dinâmica é resolvida por slug, e dois nós da
 * mesma classe com o mesmo slug fazem `generateStaticParams` exportar uma página só —
 * a segunda entidade some do produto sem erro nenhum. O acervo tem homônimos reais
 * ("13ª Bienal do Mercosul" em dois registros), então a desambiguação é obrigatória.
 *
 * Regra determinística: o primeiro por id mantém o slug limpo; os demais recebem o
 * identificador de origem como sufixo. Slug vazio vira `{classe}-{idOrigem}`.
 */
function garantirSlugsUnicos(entidades) {
  const vistos = new Map();
  let desambiguados = 0;
  for (const e of entidades) {
    const idOrigem = e.id.split(":").slice(2).join(":");
    if (!e.slug) {
      e.slug = paraSlug(`${e.classe}-${idOrigem}`);
      desambiguados++;
    }
    const chave = `${e.classe}/${e.slug}`;
    if (vistos.has(chave)) {
      e.slug = paraSlug(`${e.slug}-${idOrigem}`);
      desambiguados++;
    }
    vistos.set(`${e.classe}/${e.slug}`, e.id);
  }
  return desambiguados;
}

function ordenarArestas(arestas) {
  return [...arestas].sort(
    (a, b) =>
      a.de.localeCompare(b.de) ||
      a.relacao.localeCompare(b.relacao) ||
      a.para.localeCompare(b.para) ||
      String(a.papel ?? "").localeCompare(String(b.papel ?? "")),
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const vocabulario = construirVocabulario();
  const temas = construirTemas();
  const idsLinguagem = new Set(vocabulario.map((v) => v.id));
  const idsTema = new Set(temas.map((t) => t.id));

  const imagens = publicarImagens();
  const { registros: registrosEnc, relatorio: fontesEnc } = await lerEnciclopedia();

  const lugares = entidadesLugar(registrosEnc, CLASSE_POR_TIPO_ENC);
  const lugaresMaterializados = materializarLugares(lugares);

  const acervo = ordenarEntidades([
    ...entidadesLinguagem(vocabulario),
    ...entidadesTema(temas),
    ...entidadesDoCms("eventos", "evento", idsLinguagem, idsTema, imagens),
    ...entidadesDoCms("conteudos", "conteudo", idsLinguagem, idsTema, imagens),
    ...entidadesDoCms("midias", "midia", idsLinguagem, idsTema, imagens),
    ...entidadesDoCms("publicacoes", "publicacao", idsLinguagem, idsTema, imagens),
    ...entidadesDoCms("formacoes", "formacao", idsLinguagem, idsTema, imagens),
    ...entidadesAgente(imagens),
    ...entidadesDaEnciclopedia(registrosEnc, idsLinguagem, imagens),
    ...lugaresMaterializados.entidades,
  ]);

  /** município de cada entidade, para o motivo de `semelhante_a` e para a copresença. */
  const municipioDaEntidade = new Map();
  for (const s of lugares.situacoes) {
    if (!s.para.startsWith("territorio:")) continue;
    const t = lugares.municipios.get(s.para);
    if (t && !municipioDaEntidade.has(s.de)) municipioDaEntidade.set(s.de, t);
  }

  // Os clones do Cenário 3 entram antes da camada de acontecimentos: cada duplicata
  // precisa ter temporada e ocorrência próprias para o Studio ter o que reconciliar.
  const duplicatas = construirDuplicatas(acervo);
  const comDuplicatas = [...acervo, ...duplicatas.clones];
  const porIdParcial = new Map(comDuplicatas.map((e) => [e.id, e]));

  const agenda = construirAcontecimentos(comDuplicatas, idEspaco);

  const base = ordenarEntidades([
    ...comDuplicatas,
    ...materializarAcontecimentos(agenda.temporadas, agenda.ocorrencias, porIdParcial),
  ]);
  const porIdBase = new Map(base.map((e) => [e.id, e]));

  // As 3 personas e a única trilha autorada, ambas apontando só para ids reais.
  const personas = construirPersonas(base, agenda.ocorrencias, municipioDaEntidade);
  const trilha = construirTrilha(porIdBase, base);

  const entidades = ordenarEntidades([...base, ...personas.entidades, trilha.entidade]);

  const slugsDesambiguados = garantirSlugsUnicos(entidades);

  const porId = new Map(entidades.map((e) => [e.id, e]));
  const porLinguagemId = new Map(entidades.filter((e) => e.classe === "linguagem").map((e) => [e.slug, e]));
  const porTemaId = new Map(entidades.filter((e) => e.classe === "tema").map((e) => [e.slug, e]));

  const elegiveisSemelhanca = entidades.filter((e) => e.linguagens.length || e.temas.length).length;
  const fanoutEfetivo = Math.max(
    1,
    Math.min(FANOUT_SEMELHANTE, Math.floor(ORCAMENTO_SEMELHANTE / Math.max(1, elegiveisSemelhanca))),
  );

  const agentesComMunicipio = entidades.filter(
    (e) => ["pessoa", "coletivo"].includes(e.classe) && municipioDaEntidade.has(e.id),
  ).length;
  const fanoutCopresenca = Math.max(
    1,
    Math.min(FANOUT_COPRESENCA, Math.floor(ORCAMENTO_COPRESENCA / Math.max(1, agentesComMunicipio))),
  );

  const arestas = ordenarArestas([
    ...arestasPertenceA(entidades, porLinguagemId, porTemaId),
    ...arestasSituadoEm(lugares, porId),
    ...arestasOcorreEm(agenda.temporadas, agenda.ocorrencias),
    ...arestasAtuaEm(entidades, porId, municipioDaEntidade, fanoutCopresenca),
    ...arestasRealiza(entidades, municipioDaEntidade),
    ...arestasEditoriais(entidades),
    ...duplicatas.arestas,
    ...personas.arestas,
    ...trilha.arestas,
    ...arestasSemelhanteA(entidades, vocabulario, temas, municipioDaEntidade, fanoutEfetivo),
  ]);

  /** `ocorrencias.json` é arquivo à parte, indexado por evento (DADO-02). */
  const ocorrenciasPorEvento = {};
  for (const o of agenda.ocorrencias) {
    (ocorrenciasPorEvento[o.eventoId] ??= []).push(o);
  }
  for (const lista of Object.values(ocorrenciasPorEvento)) {
    lista.sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id));
  }
  const ocorrenciasIndexadas = Object.fromEntries(
    Object.entries(ocorrenciasPorEvento).sort(([a], [b]) => a.localeCompare(b)),
  );

  conferir({ entidades, arestas, ocorrencias: agenda.ocorrencias, personas: personas.personas });

  const grau = new Map();
  for (const a of arestas) {
    grau.set(a.de, (grau.get(a.de) ?? 0) + 1);
    grau.set(a.para, (grau.get(a.para) ?? 0) + 1);
  }

  // Duas contagens, porque só uma seria enganosa: a declarada é o que o CMS afirma;
  // a total inclui ocorrência e temporada, que herdam a acessibilidade do evento.
  // Publicar só o total inflaria um campo que na fonte está quase vazio.
  const acessibilidadePorDimensao = {};
  const acessibilidadeDeclarada = {};
  for (const d of DIMENSOES_ACESSIBILIDADE) {
    acessibilidadePorDimensao[d] = entidades.filter((e) => e.acessibilidade?.[d]).length;
    acessibilidadeDeclarada[d] = entidades.filter(
      (e) => e.procedencia === "ic" && e.acessibilidade?.[d],
    ).length;
  }

  escrever("vocabulario.json", { linguagens: vocabulario, temas });
  escrever("ocorrencias.json", ocorrenciasIndexadas);
  escrever("personas.json", { personas: personas.personas, trilhas: [trilha.entidade.id] });
  escrever("entidades.json", entidades);
  escrever("arestas.json", arestas);
  escrever("meta.json", {
    // Determinismo: a data é do commit da geração, não do relógio da execução.
    // Um timestamp vivo aqui quebraria a checagem de bytes idênticos.
    geradoEm: "2026-08-22",
    grauHub: GRAU_HUB,
    fanoutSemelhante: FANOUT_SEMELHANTE,
    fanoutEfetivo,
    fontes: {
      cms: ["eventos", "conteudos", "midias", "publicacoes", "formacoes", "agentes"].map(
        (n) => `dados/normalizado/${n}.json`,
      ),
      taxonomia: ["dados/taxonomia/linguagens.json", "dados/taxonomia/temas.json"],
      enciclopedia: fontesEnc,
      imagens: imagens.relatorio.disponivel ? "dados/imagens/" : null,
    },
    totais: {
      entidades: entidades.length,
      arestas: arestas.length,
      linguagens: vocabulario.length,
      temas: temas.length,
      temporadas: agenda.temporadas.length,
      ocorrencias: agenda.ocorrencias.length,
      duplicatas: duplicatas.clones.length,
    },
    porClasse: contar(entidades, "classe"),
    porProcedencia: contar(entidades, "procedencia"),
    porRelacao: contar(arestas, "relacao"),
    porProcedenciaDeAresta: contar(arestas, "procedencia"),
    acessibilidade: acessibilidadeDeclarada,
    acessibilidadeIncluindoDerivadas: acessibilidadePorDimensao,
    // O TAMANHO DO SILÊNCIO, que as duas contagens acima não mostram: elas dizem quantas
    // entidades têm cada recurso, e uma dimensão em zero pode ser «ninguém oferece» ou
    // «ninguém preencheu». Este par separa as duas leituras. Sem ele a ficha de D-43 não
    // tem número que sustente a coluna de «não declarado».
    fichaDeAcessibilidade: {
      declaram: entidades.filter((e) => e.declaraAcessibilidade).length,
      naoDeclaram: entidades.filter((e) => !e.declaraAcessibilidade).length,
      declaramPorClasse: contar(entidades.filter((e) => e.declaraAcessibilidade), "classe"),
    },
    cobertura: {
      imagens: imagens.relatorio,
      entidadesComImagemLocal: entidades.filter((e) => e.imagem).length,
      slugsDesambiguados,
      coordenadas: {
        comCoordenada: entidades.filter((e) => e.coordenada).length,
        porMetodo: contar(entidades.filter((e) => e.coordenada), (e) => e.coordenada.metodo),
        municipiosNaTabela: Object.keys(CENTROIDES.municipios).length,
        paisesNaTabela: Object.keys(CENTROIDES.paises).length,
        aproximados: CENTROIDES.aproximados ?? [],
      },
      semCoordenada: {
        total: lugaresMaterializados.semCoordenada.length,
        nomes: lugaresMaterializados.semCoordenada.slice(0, 200).map((x) => x.nome),
      },
      trilhaAutorada: {
        id: `trilha:autorado:${TRILHA_CENARIO_1.idOrigem}`,
        passos: trilha.sequencia,
        porQue: "rap (Música) e slam (Literatura) não compartilham nenhum atributo na fonte; a ponte é conhecimento cultural e por isso é autorada",
      },
      fanoutCopresenca,
      agenda: {
        ...agenda.cobertura,
        diasMaximosDeVisitacao: DIAS_MAX_VISITACAO,
        variacoesDeDuplicata: [...new Set(duplicatas.clones.map((c) => c.variacao))].sort(),
      },
      linguagensPromovidas: vocabulario.filter((v) => v.promovida).map((v) => v.rotulo),
      aliasDeLinguagem: ALIAS_LINGUAGEM,
    },
    concentradores: (() => {
      const acima = [...grau.entries()]
        .filter(([, g]) => g > GRAU_HUB)
        .sort(([ia, ga], [ib, gb]) => gb - ga || ia.localeCompare(ib));
      return {
        limiar: GRAU_HUB,
        total: acima.length,
        maiores: acima.slice(0, 10).map(([id, g]) => ({ id, grau: g })),
      };
    })(),
  });

  console.log(
    `grafo gerado: ${entidades.length} entidades · ${arestas.length} arestas · ` +
      `${agenda.temporadas.length} temporadas · ${agenda.ocorrencias.length} ocorrências · ` +
      `${duplicatas.clones.length} duplicatas · ${vocabulario.length} linguagens · ` +
      `${temas.length} temas · ${imagens.relatorio.arquivos} imagens`,
  );
}

await main();
