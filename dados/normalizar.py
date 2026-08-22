#!/usr/bin/env python3
"""
Normaliza o acervo bruto do Itau Cultural no formato do grafo (ontologia).

Le  : dados/bruto/**/*.json   (coletado por coletar.py)
Grava: dados/normalizado/*.json  +  dados/taxonomia/*.json
       dados/inventario/lacunas.json

Principio: nada e inventado. Cada campo carrega procedencia:
  "ic"       -> veio do CMS do Itau Cultural
  "derivado" -> inferido deterministicamente do que veio do IC
  "ausente"  -> nao existe na fonte; precisa de enriquecimento
"""

import json
import glob
import re
import html
import collections
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
BRUTO, NORM = RAIZ / "bruto", RAIZ / "normalizado"
TAXO, INV = RAIZ / "taxonomia", RAIZ / "inventario"
for d in (NORM, TAXO, INV):
    d.mkdir(parents=True, exist_ok=True)

# Listas de conteudo dentro de pageProps, mapeadas para o tipo da ontologia
LISTAS = {
    "schedules": "evento", "agenda": "evento", "exhibitions": "evento",
    "occupations": "evento", "formation": "formacao", "schools": "formacao",
    "noticias": "conteudo", "colunas": "conteudo", "opiniao": "conteudo",
    "entrevistas": "conteudo", "publicacoes": "publicacao", "books": "publicacao",
    "revistaObservatorio": "publicacao", "pesquisas": "pesquisa",
    "videos": "midia", "playlists": "midia", "podcasts": "midia",
    "series": "midia", "icplay": "midia",
    "rumos": "conteudo", "ancestralidades": "conteudo", "mekukradja": "conteudo",
}

# Linguagens artisticas — vocabulario controlado que o proprio IC ja mantem no Rumos
LINGUAGENS_RUMOS = [
    "acervo", "animação", "arquitetura", "arte e tecnologia", "artes visuais",
    "audiovisual", "cidade", "cinema", "circo", "culinária", "cultura popular",
    "curta-metragem", "dança", "dança contemporânea", "documentário", "feminismo",
    "fotografia", "instalação", "jornalismo", "lgbtqia+", "literatura", "memória",
    "música", "oficinas", "patrimônio", "performance", "pesquisa", "poesia", "teatro",
]


def limpar(txt):
    if not txt:
        return ""
    return html.unescape(re.sub(r"<[^>]+>", " ", str(txt))).replace("\xa0", " ").strip()


def carregar():
    """Devolve itens unicos por id, a origem de cada um e o cadastro de pessoas.

    O CMS mantem as pessoas em duas listas distintas: `participants`, embutida em
    cada conteudo, e `columnists`/`featureColumnists`, um cadastro proprio da
    secao de colunas. Sao a mesma entidade e precisam ser unificadas.
    """
    unicos, origens = {}, collections.defaultdict(set)
    pessoas = {}
    for f in glob.glob(str(BRUTO / "**" / "*.json"), recursive=True):
        pp = json.loads(Path(f).read_text(encoding="utf-8")).get("pageProps", {})
        arquivo = Path(f).stem
        for chave in ("columnists", "featureColumnists"):
            for p in (pp.get(chave) or []):
                if isinstance(p, dict) and p.get("id"):
                    alvo = pessoas.setdefault(p["id"], {})
                    for k, v in p.items():
                        if v not in (None, "", [], {}) or k not in alvo:
                            alvo[k] = v
                    alvo["columnist"] = True
        # paginas de materia trazem o item em "content"
        if isinstance(pp.get("content"), dict) and "id" in pp["content"]:
            it = pp["content"]
            unicos.setdefault(it["id"], it).update(
                {k: v for k, v in it.items() if v not in (None, "", [], {})})
            origens[it["id"]].add(arquivo)
        for chave, tipo in LISTAS.items():
            for it in (pp.get(chave) or []):
                if isinstance(it, dict) and "id" in it:
                    alvo = unicos.setdefault(it["id"], {})
                    for k, v in it.items():
                        if v not in (None, "", [], {}) or k not in alvo:
                            alvo[k] = v
                    alvo.setdefault("_tipo", tipo)
                    origens[it["id"]].add(f"{arquivo}.{chave}")
    return unicos, origens, pessoas


def main():
    unicos, origens, pessoas = carregar()

    agentes, papeis = {}, collections.defaultdict(set)
    for pid, p in pessoas.items():
        agentes[pid] = {
            "id": f"agente:{pid}",
            "nome": (p.get("name") or "").strip(),
            "bio": limpar(p.get("bio")) or limpar(p.get("description")),
            "imagem": p.get("image") or None,
            "ativo": p.get("active", True),
            "_procedencia": {"nome": "ic", "bio": "ic",
                             "obras": "ausente", "territorio": "ausente"},
        }
        papeis[pid].add("colunista")
    linguagens = collections.Counter()
    temas = collections.Counter()
    entidades = collections.defaultdict(list)
    lacunas = collections.Counter()

    ling_set = set(LINGUAGENS_RUMOS)

    for iid, it in unicos.items():
        tipo = it.get("_tipo", "conteudo")

        # --- agentes (hoje o CMS so tem colunistas/autores) ---
        for p in (it.get("participants") or []):
            if isinstance(p, dict) and p.get("id"):
                a = agentes.setdefault(p["id"], {
                    "id": f"agente:{p['id']}",
                    "nome": p.get("name", "").strip(),
                    "bio": limpar(p.get("bio")),
                    "imagem": p.get("image") or None,
                    "ativo": p.get("active", True),
                    "_procedencia": {"nome": "ic", "bio": "ic",
                                     "obras": "ausente", "territorio": "ausente"},
                })
                papeis[p["id"]].add("colunista" if p.get("columnist") else "participante")
                a.setdefault("_conteudos", []).append(iid)

        # --- vocabulario ---
        tags = [t.strip().lower() for t in (it.get("tags") or []) if isinstance(t, str)]
        for t in tags:
            (linguagens if t in ling_set else temas)[t] += 1

        # --- entidade normalizada ---
        ent = {
            "id": f"{tipo}:{iid}",
            "tipo": tipo,
            "titulo": it.get("title", "").strip(),
            "resumo": limpar(it.get("shortDescription")),
            "slug": it.get("slug"),
            "publicadoEm": it.get("publishedAt"),
            "atualizadoEm": it.get("updatedDate"),
            "imagem": it.get("image") or None,
            "imagemAlt": None if it.get("image_description") in (None, "", "N/A")
                         else it.get("image_description"),
            "creditoImagem": None if it.get("rights") in (None, "", "N/A") else it.get("rights"),
            "categoria": (it.get("mainCategory") or {}).get("name") if isinstance(
                it.get("mainCategory"), dict) else it.get("category"),
            "linguagens": [t for t in tags if t in ling_set],
            "temas": [t for t in tags if t not in ling_set],
            # As 8 dimensoes vem inteiras ou nao vem. Filtrar os `false` apagaria a
            # diferenca entre "a instituicao declarou que nao tem audiodescricao" e
            # "a instituicao nao disse nada" — e e essa distincao que a ficha de
            # acessibilidade precisa mostrar. Ausencia nao e negacao.
            "acessibilidade": dict(it["accessibility"])
                              if isinstance(it.get("accessibility"), dict)
                              and it["accessibility"] else None,
            "agentes": [f"agente:{p['id']}" for p in (it.get("participants") or [])
                        if isinstance(p, dict) and p.get("id")],
            "_origem": sorted(origens.get(iid, []))[:3],
        }

        if tipo == "evento":
            ini, fim = it.get("initDate") or it.get("startDate"), it.get("endDate")
            ent["periodo"] = {"inicio": ini, "fim": fim,
                              "horaInicio": it.get("initHour"), "horaFim": it.get("endHour")}
            ent["ocorrencias"] = it.get("schedules") or []
            ent["presencial"] = it.get("presential")
            ent["online"] = it.get("online")
            ent["comIngresso"] = it.get("ticket")
            ent["esgotado"] = it.get("soldOut")
            ent["espaco"] = None          # nao existe na fonte
            ent["territorio"] = None      # nao existe na fonte
            ent["preco"] = None           # nao existe na fonte
            if not ent["ocorrencias"]:
                lacunas["evento_sem_ocorrencia"] += 1
            if not ini:
                lacunas["evento_sem_data"] += 1
            lacunas["evento_sem_espaco"] += 1
            lacunas["evento_sem_territorio"] += 1
            lacunas["evento_sem_preco"] += 1

        if not ent["agentes"]:
            lacunas[f"{tipo}_sem_agente"] += 1
        if not ent["linguagens"]:
            lacunas[f"{tipo}_sem_linguagem"] += 1
        if not ent["imagemAlt"]:
            lacunas[f"{tipo}_sem_alt_text"] += 1

        entidades[tipo].append(ent)

    for aid, a in agentes.items():
        a["papeis"] = sorted(papeis[aid])
        a["_conteudos"] = sorted(set(a.get("_conteudos", [])))

    # ---- gravacao ----
    PLURAL = {"conteudo": "conteudos", "midia": "midias", "evento": "eventos",
              "formacao": "formacoes", "publicacao": "publicacoes",
              "pesquisa": "pesquisas"}
    for tipo, lst in entidades.items():
        lst.sort(key=lambda e: (e.get("publicadoEm") or ""), reverse=True)
        (NORM / f"{PLURAL.get(tipo, tipo + 's')}.json").write_text(
            json.dumps(lst, ensure_ascii=False, indent=1), encoding="utf-8")

    (NORM / "agentes.json").write_text(
        json.dumps(sorted(agentes.values(), key=lambda a: a["nome"]),
                   ensure_ascii=False, indent=1), encoding="utf-8")

    (TAXO / "linguagens.json").write_text(json.dumps({
        "fonte": "Rumos Itau Cultural (expressions) + tags do CMS",
        "controlado": LINGUAGENS_RUMOS,
        "usoNoAcervo": linguagens.most_common(),
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    (TAXO / "temas.json").write_text(json.dumps({
        "fonte": "tags livres do CMS (sem vocabulario controlado)",
        "total": len(temas),
        "uso": temas.most_common(),
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    (INV / "lacunas.json").write_text(
        json.dumps(dict(lacunas.most_common()), ensure_ascii=False, indent=1),
        encoding="utf-8")

    print("=== ENTIDADES NORMALIZADAS ===")
    for t, l in sorted(entidades.items(), key=lambda x: -len(x[1])):
        print(f"  {t:12} {len(l):5}")
    print(f"  {'agente':12} {len(agentes):5}")
    print(f"\n=== VOCABULARIO ===")
    print(f"  linguagens controladas em uso: {len(linguagens)}/29")
    print(f"  temas livres: {len(temas)}")
    print(f"\n=== LACUNAS ===")
    for k, v in lacunas.most_common():
        print(f"  {k:34} {v:5}")


if __name__ == "__main__":
    main()
