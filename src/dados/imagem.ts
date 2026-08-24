/**
 * imagem.ts — resolve uma capa quando a entidade não tem foto própria.
 *
 * Descobrir, mapa e agenda compartilham a mesma regra: foto da entidade, senão
 * a de quem a ancora (evento da temporada, passo da trilha, vizinho com capa),
 * senão uma foto da mesma classe e linguagem. Sem isto o feed vira pastilha de
 * marca na maior parte dos cartões.
 */
import { porId, porSlug, slugsPorTipo, vizinhos } from "./grafo";
import type { ClasseEntidade, Entidade } from "./tipos";

export interface CapaResolvida {
  imagem?: string;
  creditoImagem?: string;
}

const CLASSES_DE_CAPA = new Set<ClasseEntidade>([
  "obra",
  "evento",
  "conteudo",
  "espaco",
  "midia",
  "pessoa",
]);

function daEntidade(entidade: Entidade | undefined): CapaResolvida {
  if (!entidade?.imagem) return {};
  return { imagem: entidade.imagem, creditoImagem: entidade.creditoImagem };
}

function idDoExtra(extra: Record<string, unknown> | undefined, chave: string): string | null {
  const valor = extra?.[chave];
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

const reservaPorChave = new Map<string, CapaResolvida>();
const classeVarrida = new Set<ClasseEntidade>();

function varrerReservas(classe: ClasseEntidade): void {
  if (classeVarrida.has(classe)) return;
  classeVarrida.add(classe);
  for (const slug of slugsPorTipo(classe)) {
    const e = porSlug(classe, slug);
    if (!e?.imagem) continue;
    const capa = daEntidade(e);
    if (!reservaPorChave.has(classe)) reservaPorChave.set(classe, capa);
    for (const linguagem of e.linguagens) {
      const chave = `${classe}:${linguagem}`;
      if (!reservaPorChave.has(chave)) reservaPorChave.set(chave, capa);
    }
  }
}

function reservaDaClasse(entidade: Entidade): CapaResolvida {
  varrerReservas(entidade.classe);
  for (const linguagem of entidade.linguagens) {
    const capa = reservaPorChave.get(`${entidade.classe}:${linguagem}`);
    if (capa?.imagem) return capa;
  }
  return reservaPorChave.get(entidade.classe) ?? {};
}

/**
 * Capa para exibir. Ordem: própria → âncora (derivado/evento/espaço/passos da
 * trilha) → vizinho com foto → reserva da mesma classe e linguagem.
 */
export function capaDe(entidade: Entidade): CapaResolvida {
  const propria = daEntidade(entidade);
  if (propria.imagem) return propria;

  const ancora = [
    entidade.derivadoDe,
    idDoExtra(entidade.extra, "eventoId"),
    idDoExtra(entidade.extra, "espacoId"),
  ];
  if (entidade.classe === "trilha") {
    const passos = entidade.extra?.passos;
    if (Array.isArray(passos)) {
      for (let i = passos.length - 1; i >= 0; i -= 1) {
        const id = passos[i];
        if (typeof id === "string") ancora.push(id);
      }
    }
  }
  for (const id of ancora) {
    if (!id || id === entidade.id) continue;
    const foto = daEntidade(porId(id));
    if (foto.imagem) return foto;
  }

  for (const v of vizinhos(entidade.id)) {
    if (v.entidade.id === entidade.id) continue;
    if (!CLASSES_DE_CAPA.has(v.entidade.classe)) continue;
    const foto = daEntidade(v.entidade);
    if (foto.imagem) return foto;
  }
  for (const v of vizinhos(entidade.id)) {
    if (v.entidade.id === entidade.id) continue;
    const foto = daEntidade(v.entidade);
    if (foto.imagem) return foto;
  }

  return reservaDaClasse(entidade);
}
