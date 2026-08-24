/**
 * rotas.ts — a única tabela classe → endereço.
 *
 * MORAVA COPIADA EM DEZ ARQUIVOS, cada um jurando espelhar o outro. As classes
 * sem rota (conteúdo, mídia, formação, publicação, termo) saíam do app — o
 * cartão ia para o site do Itaú Cultural, a busca dizia «sem página própria».
 * Uma tabela só: quem ganha página ganha destino, e o cliente pode importar
 * isto porque não alcança o grafo (DP-F).
 */
import type { ClasseEntidade } from "./tipos";

export const ROTA_POR_CLASSE: Partial<Record<ClasseEntidade, string>> = {
  evento: "/evento",
  pessoa: "/artista",
  coletivo: "/artista",
  obra: "/obra",
  instituicao: "/produtor",
  espaco: "/produtor",
  trilha: "/trilha",
  territorio: "/cidade",
  conteudo: "/materia",
  publicacao: "/materia",
  formacao: "/cursos",
  midia: "/play",
  termo: "/verbete",
};

export function rotaDaEntidade(classe: ClasseEntidade, slug: string): string | null {
  const base = ROTA_POR_CLASSE[classe];
  return base ? `${base}/${slug}/` : null;
}
