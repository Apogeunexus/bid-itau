#!/usr/bin/env python3
"""
Coletor do acervo digital do Itau Cultural.

Baixa o conteudo publico do site (www.itaucultural.org.br), que e um Next.js,
usando o endpoint /_next/data/<buildId>/<rota>.json — mesma fonte que a propria
pagina consome. Organiza tudo em dados/bruto/.

Uso:  python3 dados/coletar.py
"""

import json
import os
import re
import sys
import time
import subprocess
from pathlib import Path

BASE = "https://www.itaucultural.org.br"
RAIZ = Path(__file__).resolve().parent
BRUTO = RAIZ / "bruto"
TAXO = RAIZ / "taxonomia"
INV = RAIZ / "inventario"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")
PAUSA = 0.25  # cortesia com o servidor

for d in (BRUTO / "secoes", BRUTO / "subcategorias", BRUTO / "materias", TAXO, INV):
    d.mkdir(parents=True, exist_ok=True)


class ErroHTTP(Exception):
    pass


def buscar(url, binario=False):
    """Usa curl como transporte: a instalacao local do Python nao tem
    a cadeia de certificados configurada."""
    r = subprocess.run(
        ["curl", "-sS", "-L", "-m", "30", "-A", UA, "-w", "\n%{http_code}", url],
        capture_output=True)
    if r.returncode != 0:
        raise ErroHTTP(f"curl rc={r.returncode}")
    corpo, _, codigo = r.stdout.rpartition(b"\n")
    codigo = codigo.decode().strip()
    if codigo != "200":
        raise ErroHTTP(f"HTTP {codigo}")
    return corpo if binario else corpo.decode("utf-8", "ignore")


def descobrir_build_id():
    html = buscar(BASE + "/agenda")
    m = re.search(r'"buildId":"([^"]+)"', html)
    if not m:
        sys.exit("Nao consegui achar o buildId — o site pode ter mudado.")
    return m.group(1)


def rotas_do_sitemap():
    xml = buscar(BASE + "/sitemap.xml")
    locs = re.findall(r"<loc>([^<]*)</loc>", xml)
    rotas = []
    for u in locs:
        r = re.sub(r"^https?://[^/]+", "", u).strip()
        if r in ("", "/"):
            r = "/"
        rotas.append(r)
    return sorted(set(rotas))


def nome_arquivo(rota):
    s = rota.strip("/").replace("/", "__")
    return (s or "home") + ".json"


def baixar_rota(build_id, rota, destino):
    alvo = "" if rota == "/" else rota
    url = f"{BASE}/_next/data/{build_id}{alvo}.json"
    try:
        txt = buscar(url)
        obj = json.loads(txt)
    except (ErroHTTP, json.JSONDecodeError) as e:
        return None, str(e)
    (destino / nome_arquivo(rota)).write_text(
        json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    return obj, None


SECOES = [
    "/", "/agenda", "/noticias", "/colunas", "/opiniao", "/entrevista",
    "/videos", "/playlists", "/podcasts", "/series", "/publicacoes",
    "/ic-play", "/rumos", "/escola", "/biblioteca", "/enciclopedia",
    "/mostras-e-exposicoes/exposicoes", "/mostras-e-exposicoes/exposicoes-virtuais",
    "/mostras-e-exposicoes/ocupacao", "/espaco-olavo-setubal",
    "/espaco-olavo-setubal/AboutSpace", "/espaco-olavo-setubal/Collection",
    "/espaco-olavo-setubal/PhotosAndVideos",
    "/observatorio/conteudos", "/observatorio/formacoes",
    "/observatorio/pesquisas", "/observatorio/publicacoes",
    "/ancestralidade", "/arte-e-acesso", "/mekukradja",
    "/quem-somos", "/newsletter",
]


def main():
    build_id = descobrir_build_id()
    print(f"buildId: {build_id}\n")
    relatorio = {"buildId": build_id, "secoes": {}, "subcategorias": {},
                 "materias": {}, "falhas": []}

    # 1. secoes principais
    print("== SECOES ==")
    subrotas = set()
    for rota in SECOES:
        obj, err = baixar_rota(build_id, rota, BRUTO / "secoes")
        if err:
            relatorio["falhas"].append({"rota": rota, "erro": err})
            print(f"  x {rota}  ({err})")
        else:
            pp = obj.get("pageProps", {})
            tamanhos = {k: len(v) for k, v in pp.items() if isinstance(v, list)}
            relatorio["secoes"][rota] = tamanhos
            print(f"  ok {rota}  {tamanhos}")
            # coleta subcategorias declaradas
            base = rota.rstrip("/")
            for s in pp.get("subcategories", []) or []:
                if isinstance(s, dict) and s.get("slug"):
                    subrotas.add(f"{base}/{s['slug']}")
        time.sleep(PAUSA)

    # 2. subcategorias
    print(f"\n== SUBCATEGORIAS ({len(subrotas)}) ==")
    for rota in sorted(subrotas):
        obj, err = baixar_rota(build_id, rota, BRUTO / "subcategorias")
        if err:
            relatorio["falhas"].append({"rota": rota, "erro": err})
            print(f"  x {rota}  ({err})")
        else:
            pp = obj.get("pageProps", {})
            relatorio["subcategorias"][rota] = {
                k: len(v) for k, v in pp.items() if isinstance(v, list)}
            print(f"  ok {rota}")
        time.sleep(PAUSA)

    # 3. materias individuais (rotas de slug na raiz + secoes)
    print("\n== MATERIAS ==")
    todas = rotas_do_sitemap()
    (INV / "rotas-sitemap.txt").write_text("\n".join(todas), encoding="utf-8")
    conhecidas = set(SECOES) | subrotas
    materias = [r for r in todas
                if r not in conhecidas
                and not r.startswith(("/error", "/health", "/busca", "/agenda-nao"))]
    print(f"  {len(materias)} rotas de conteudo")
    for i, rota in enumerate(materias, 1):
        obj, err = baixar_rota(build_id, rota, BRUTO / "materias")
        if err:
            relatorio["falhas"].append({"rota": rota, "erro": err})
        else:
            relatorio["materias"][rota] = True
        if i % 25 == 0:
            print(f"  ... {i}/{len(materias)}")
        time.sleep(PAUSA)

    (INV / "relatorio-coleta.json").write_text(
        json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"\nOK. secoes={len(relatorio['secoes'])} "
          f"subcategorias={len(relatorio['subcategorias'])} "
          f"materias={len(relatorio['materias'])} "
          f"falhas={len(relatorio['falhas'])}")


if __name__ == "__main__":
    main()
