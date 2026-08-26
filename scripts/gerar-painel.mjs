#!/usr/bin/env node
/**
 * gerar-painel.mjs — o dado do painel de monitoramento das seis sessões.
 *
 * Lê `.planning/estado/S*.md`, cruza com o `git log`, e escreve o bloco de dados dentro de
 * `.planning/monitor.html`, entre os marcadores. A sessão de controle roda isto a cada
 * varredura e republica a página; o link não muda.
 *
 * NENHUM NÚMERO É DIGITADO. Progresso sai da contagem de linhas com hash nos arquivos de
 * estado; frescor sai do `git log` por pasta; árvore suja sai do `git status`. Um número
 * escrito à mão aqui passaria a mentir na primeira varredura seguinte — o mesmo defeito que
 * o Observatório do produto existe para não ter.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const RAIZ = process.cwd();
const PLAN = join(RAIZ, ".planning");

/** O catálogo das 64 tarefas. Fonte: `.planning/TAREFAS.md`. Ordem e dependência são fixas. */
const CATALOGO = {
  S7: { nome: "Studio · Produtor", onda: 1, pasta: "src/app/(bastidor)/studio", inicio: 0, tarefas: [
    "contrato e seed", "P2 identidade", "P5 grade de ocorrências", "P3 obra e elenco",
    "P4 espaço e temporada", "P6 ficha de acessibilidade", "P7 comercial e classificação",
    "P8 revisão e envio", "P1 painel", "E1 alteração · E2 duplicata", "suíte e medidas"] },
  S3: { nome: "Moderação", onda: 1, pasta: "src/app/(bastidor)/moderacao", inicio: 1, tarefas: [
    "separação de território", "M1 fila", "M2 ficha do item", "M9 histórico",
    "integração com a S7", "M3 revisão da IA", "M8 escopo e escalonamento",
    "M5 elenco · M6 reconciliação", "M4 similaridade", "M7 duplicatas", "suíte e medidas"] },
  S2: { nome: "Gestor · Observatório", onda: 2, pasta: "src/app/(bastidor)/observatorio", inicio: 0, tarefas: [
    "recorte do DTO", "G1 público", "G3 impacto cultural", "G5 procedência",
    "G6 ausência declarada", "G4 território", "G2 KPIs de produto", "G7 exportação",
    "G8 leitura da moderação", "suíte e medidas"] },
  S1: { nome: "Admin", onda: 2, pasta: "src/app/(bastidor)/admin", inicio: 1, tarefas: [
    "folha admin.css", "dados admin.ts", "A2 motor", "A3 territórios", "A6 observabilidade",
    "A1 papéis e escopos", "A7 auditoria", "A4 vocabulário · A5 limites da IA",
    "A8 titulares · A9 governança", "A10 desempenho da moderação", "suíte e medidas"] },
  S5: { nome: "Editor · Curador", onda: 2, pasta: "src/app/(bastidor)/redacao", inicio: 2, tarefas: [
    "reancorar redacao.ts", "E1 trilha", "E3 arestas de sentido", "E9 assinaturas",
    "E2 destaque", "E4 tesauro", "E5 redação editorial", "E7 motor editorial",
    "E6 especiais · E8 calendário", "suíte e medidas"] },
  S6: { nome: "Organização", onda: 2, pasta: "src/app/(bastidor)/studio", inicio: 11, tarefas: [
    "ler o que a S7 deixou", "O2 espaços", "O1 ficha da instituição", "O7 equipe e alçadas",
    "O5 mídia", "O3 programa", "O4 formação", "O6 editais", "O8 integração",
    "O9 alcance · O10 conformidade", "suíte e medidas"] },
};

/** As cinco dependências entre sessões. Fonte: `.planning/GANTT.md` §3. */
const DEPENDENCIAS = [
  { de: "S7", tarefaDe: 1, para: "S3", tarefaPara: 5, o_que: "armazém do produtor", duro: false },
  { de: "S7", tarefaDe: 1, para: "S1", tarefaPara: 6, o_que: "tipos-acesso.ts", duro: false },
  { de: "S3", tarefaDe: 1, para: "S5", tarefaPara: 1, o_que: "split de redacao.ts", duro: false },
  { de: "S7", tarefaDe: 11, para: "S6", tarefaPara: 1, o_que: "a pasta (bastidor)/studio", duro: true },
];

function git(cmd, padrao = "") {
  try { return execSync(`git ${cmd}`, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore","pipe","ignore"] }).trim(); }
  catch { return padrao; }
}

/** Lê um `estado/S<n>.md`. O que ele não declara volta vazio — nunca deduzido. */
function lerEstado(id) {
  let bruto;
  try { bruto = readFileSync(join(PLAN, "estado", `${id}.md`), "utf8"); }
  catch { return { sessao: null, estado: "aguardando", entregas: [], bloqueios: [], pedidos: [] }; }

  const campo = (nome) => (bruto.match(new RegExp(`^${nome}:\\s*(.+)$`, "m"))?.[1] ?? "").trim();
  const sessao = campo("sessão");

  // Linhas da tabela de entregas: | # | tarefa | commit | quando | nota |
  const entregas = [];
  const secao = bruto.split(/^##\s+Entregas\s*$/m)[1]?.split(/^##\s/m)[0] ?? "";
  for (const linha of secao.split("\n")) {
    const c = linha.split("|").map((x) => x.trim());
    if (c.length < 7) continue;
    const n = Number(c[1]);
    // O hash chega cru, entre crases, ou em DUPLA quando a tarefa saiu em dois commits
    // («24a8002 · 2f6baa4»). Nenhuma dessas formas pode virar «entrega sem hash no git»,
    // que é o alarme mais sério do painel — falso alarme aqui é pior que alarme nenhum,
    // porque ensina a ignorar o indicador. Fica o primeiro hash reconhecível.
    const commit = (c[3].replace(/`/g, "").match(/[0-9a-f]{7,40}/) ?? [""])[0];
    if (!Number.isInteger(n) || !commit || /^-+$/.test(commit)) continue;
    entregas.push({ n, tarefa: c[2], commit, quando: c[4], nota: c[5] || null });
  }

  /**
   * Uma seção vira uma lista de ITENS, não de linhas.
   *
   * As sessões escrevem pedido com cabeçalho `### PEDIDO-NN`, tabela e justificativa —
   * dezenas de linhas para um pedido só. Contar linha dava 33 pedidos onde havia 5, e o
   * painel passava a alarmar sobre um número que não existe. O item é o cabeçalho `###`
   * quando há um; onde não há, cada marcador de lista vale um.
   */
  const lista = (titulo) => {
    const s = bruto.split(new RegExp(`^##\\s+${titulo}\\s*$`, "m"))[1]?.split(/^##\s/m)[0] ?? "";
    const cabecalhos = [...s.matchAll(/^###\s+(.+)$/gm)].map((m) => m[1].trim());
    if (cabecalhos.length) return cabecalhos;
    return s.split("\n").filter((l) => /^\s*[-*]\s/.test(l))
            .map((l) => l.replace(/^\s*[-*]\s*(\[.\]\s*)?/, "").trim())
            .filter((l) => l && l !== "—");
  };

  return {
    sessao: sessao && sessao !== "—" ? sessao : null,
    estado: campo("estado") || "aguardando",
    entregas,
    bloqueios: lista("Bloqueios"),
    pedidos: lista("Pedidos de contrato"),
  };
}

const sessoes = [];
let concluidas = 0, divergencias = 0;

for (const [id, cat] of Object.entries(CATALOGO)) {
  const e = lerEstado(id);
  const porNumero = new Map(e.entregas.map((x) => [x.n, x]));
  concluidas += e.entregas.length;

  // Frescor: o último commit que tocou a pasta da sessão.
  const ultimo = git(`log -1 --format=%h|%cr|%ct -- "${cat.pasta}"`).split("|");
  const commitDaPasta = ultimo[0] || null;
  const frescor = ultimo[1] || null;
  const idade = ultimo[2] ? Math.round((Date.now() / 1000 - Number(ultimo[2])) / 60) : null;

  // Divergência: entrega declarada cujo hash o git não conhece.
  const semGit = e.entregas.filter((x) => !git(`cat-file -t ${x.commit}`)).length;
  divergencias += semGit;

  const tarefas = cat.tarefas.map((rot, i) => {
    const n = i + 1;
    const feita = porNumero.get(n);
    const atual = !feita && e.estado === "rodando" && n === e.entregas.length + 1;
    return {
      n, rot, inicio: cat.inicio + i,
      estado: feita ? "entregue" : atual ? "rodando" : e.estado === "bloqueada" ? "bloqueada" : "aguardando",
      commit: feita?.commit ?? null, nota: feita?.nota ?? null, quando: feita?.quando ?? null,
    };
  });

  sessoes.push({
    id, nome: cat.nome, onda: cat.onda, pasta: cat.pasta,
    sessaoNome: e.sessao, estado: e.estado,
    feitas: e.entregas.length, total: cat.tarefas.length,
    commit: commitDaPasta, frescor, idadeMin: idade,
    bloqueios: e.bloqueios, pedidos: e.pedidos,
    tarefas,
  });
}

const sujos = Number(git("status --short", "").split("\n").filter(Boolean).length);
const s7 = sessoes.find((s) => s.id === "S7");

const dados = {
  varredura: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
  kpi: {
    concluidas, totalTarefas: Object.values(CATALOGO).reduce((a, c) => a + c.tarefas.length, 0),
    ativas: sessoes.filter((s) => s.estado === "rodando").length,
    bloqueadas: sessoes.filter((s) => s.estado === "aguardando" || s.estado === "bloqueada").length,
    divergencias, sujos,
    folgaS6: s7 ? s7.total - s7.feitas : null,
    pedidos: sessoes.reduce((a, s) => a + s.pedidos.length, 0),
  },
  dependencias: DEPENDENCIAS,
  sessoes,
  notas: sessoes.flatMap((s) => s.tarefas.filter((t) => t.nota)
    .map((t) => ({ sessao: s.id, n: t.n, rot: t.rot, nota: t.nota, quando: t.quando }))),
};

writeFileSync(join(PLAN, "painel.json"), JSON.stringify(dados, null, 2) + "\n");

// Reescreve o bloco de dados dentro do HTML, entre os marcadores.
const alvo = join(PLAN, "monitor.html");
try {
  const html = readFileSync(alvo, "utf8");
  const novo = html.replace(
    /(\/\* DADOS:INICIO \*\/)[\s\S]*?(\/\* DADOS:FIM \*\/)/,
    `$1\nconst DADOS = ${JSON.stringify(dados, null, 2)};\n$2`
  );
  writeFileSync(alvo, novo);
  console.log(`painel.json + monitor.html · ${concluidas}/${dados.kpi.totalTarefas} tarefas · ${sujos} arquivos sujos · ${divergencias} divergência(s)`);
} catch {
  console.log(`painel.json escrito · ${concluidas}/${dados.kpi.totalTarefas} tarefas · monitor.html ainda não existe`);
}
