#!/usr/bin/env python3
"""
Coletor da Enciclopedia Itau Cultural.

A Enciclopedia (enciclopedia.itaucultural.org.br) e uma aplicacao Rails separada do
site principal, e e onde vivem as entidades que faltam no CMS: pessoa, grupo, obra,
evento, instituicao e termo — com territorio, espaco e datas.

A busca (/busca) e paginada em 20 itens e limita o resultado a 10.000 registros por
consulta. Para cobrir tudo, fatiamos em tres niveis:

  1. tipo x expressao, ordenado A-Z
  2. se a fatia bateu no teto, repete ordenado Z-A (cobre ate 20.000)
  3. se ainda bateu, subdivide por letra inicial no termo de busca

A deduplicacao e por (tipo, id), entao sobreposicao entre fatias e inofensiva.

Uso:  python3 dados/coletar_enciclopedia.py [--limite-paginas N]
Retomavel: relanca e ele pula as fatias ja concluidas.
"""

import argparse
import html
import json
import re
import string
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

BASE = "https://enciclopedia.itaucultural.org.br"
RAIZ = Path(__file__).resolve().parent
DEST = RAIZ / "bruto" / "enciclopedia"
DEST.mkdir(parents=True, exist_ok=True)
ARQ_ITENS = DEST / "itens.jsonl"
ARQ_ESTADO = DEST / "estado.json"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
PAUSA = 0.3          # cortesia
POR_PAGINA = 20
TETO = 10_000        # limite do buscador
MAX_PAGINAS = TETO // POR_PAGINA   # 500

# a rota no plural nao mapeia para o singular por regra simples
# (instituicoes -> instituicao, nao "instituicoe")
TIPO_DA_ROTA = {
    "pessoas": "pessoa", "obras": "obra", "grupos": "grupo", "eventos": "evento",
    "instituicoes": "instituicao", "termos": "termo", "midias": "midia",
}

TIPOS_COM_EXPRESSAO = ["pessoa", "obra", "evento"]
TIPOS_SIMPLES = ["grupo", "instituicao", "termo"]

EXPRESSOES = {
    1: "Artes visuais", 2: "Cinema", 3: "Dança", 4: "Literatura", 5: "Música",
    6: "Teatro", 7: "Arquitetura", 8: "Gestão cultural", 9: "Cultura popular",
    10: "Rádio e TV", 11: "Arte e Tecnologia", 12: "Circo",
}


def buscar(url, tentativas=3):
    for n in range(tentativas):
        r = subprocess.run(
            ["curl", "-sS", "-L", "-m", "40", "-A", UA,
             "-H", "Accept-Language: pt-BR,pt;q=0.9", url],
            capture_output=True)
        if r.returncode == 0 and r.stdout:
            return r.stdout.decode("utf-8", "ignore")
        time.sleep(2 * (n + 1))
    return ""


def limpar(t):
    return html.unescape(re.sub(r"<[^>]+>", " ", t or "")).replace("\xa0", " ")


def texto(t):
    return re.sub(r"\s+", " ", limpar(t)).strip()


def total_de(pagina_html):
    m = re.search(r'total-items[^>]*>(.*?)</', pagina_html, re.S)
    if not m:
        return None
    n = re.sub(r"[^\d]", "", texto(m.group(1)))
    return int(n) if n else 0


# O bloco `detail-info` e polimorfico — e nao pelo tipo da entidade, mas linha a linha:
#   "<strong>data</strong> Pais / Estado / Cidade - Espaco"   -> territorio
#   "<h3>autor</h3> <strong>ano</strong> tecnica"             -> autoria e tecnica
#   "<em>Fragmentos de um Espaco, 1984c.</em>"                -> legenda de obra
# Uma obra pode ter territorio (onde esta o acervo) e uma pessoa pode nao ter. Por isso
# o teste e de conteudo: o primeiro segmento precisa ser um pais do vocabulario fechado.
# Sem esse teste, "Oleo sobre tela" e "Ziraldo" acabam no campo `pais`.

PAISES = {
    "Brasil", "Portugal", "Espanha", "França", "Itália", "Alemanha", "Holanda",
    "Países Baixos", "Bélgica", "Suíça", "Áustria", "Reino Unido", "Inglaterra",
    "Irlanda", "Escócia", "Dinamarca", "Suécia", "Noruega", "Finlândia", "Islândia",
    "Polônia", "Rússia", "Ucrânia", "Hungria", "Tchecoslováquia", "República Tcheca",
    "Romênia", "Bulgária", "Grécia", "Turquia", "Sérvia", "Croácia", "Eslovênia",
    "Lituânia", "Letônia", "Estônia", "Estados Unidos", "Canadá", "México", "Cuba",
    "Argentina", "Uruguai", "Paraguai", "Chile", "Bolívia", "Peru", "Equador",
    "Colômbia", "Venezuela", "Guiana", "Suriname", "Guiana Francesa", "Panamá",
    "Costa Rica", "Nicarágua", "Honduras", "Guatemala", "El Salvador", "Belize",
    "Haiti", "República Dominicana", "Porto Rico", "Jamaica", "Trinidad e Tobago",
    "Japão", "China", "Coreia do Sul", "Coreia do Norte", "Índia", "Paquistão",
    "Indonésia", "Filipinas", "Tailândia", "Vietnã", "Israel", "Líbano", "Síria",
    "Egito", "Marrocos", "Argélia", "Tunísia", "Nigéria", "Gana", "Senegal", "Mali",
    "Angola", "Moçambique", "Cabo Verde", "Guiné-Bissau", "São Tomé e Príncipe",
    "África do Sul", "Quênia", "Etiópia", "Congo", "Camarões", "Benin", "Togo",
    "Austrália", "Nova Zelândia", "Líbia", "Irã", "Iraque", "Armênia", "Geórgia",
}


def analisar_detalhe(bloco, tipo):
    """Le `detail-info` conforme o tipo. Devolve (locais, detalhe_bruto).

    `locais` so e preenchido para tipos que de fato carregam territorio, e o `pais`
    precisa estar no vocabulario fechado — caso contrario a entrada inteira vira
    detalhe bruto, preservada mas nao promovida a territorio.
    """
    m = re.search(r'detail-info[^>]*>(.*?)</div>', bloco, re.S)
    if not m:
        return [], None
    cru = m.group(1)
    bruto = texto(cru) or None

    saidas = []
    for linha in re.split(r"<br\s*/?>", cru):
        data = re.search(r"<strong>(.*?)</strong>", linha, re.S)
        resto = texto(re.sub(r"<strong>.*?</strong>", "", linha, flags=re.S))
        if not resto:
            continue
        territorio, espaco = resto, None
        if " - " in resto:
            territorio, espaco = resto.split(" - ", 1)
        partes = [x.strip() for x in territorio.split("/") if x.strip()]
        if not partes or partes[0] not in PAISES:
            continue
        saidas.append({
            "data": texto(data.group(1)) if data else None,
            "pais": partes[0],
            "estado": partes[1] if len(partes) > 1 else None,
            "cidade": partes[2] if len(partes) > 2 else None,
            "espaco": espaco.strip() if espaco else None,
        })
    return saidas, bruto


def analisar_pagina(pagina_html):
    itens = []
    for bloco in re.findall(r'<article class="row no-gutters">(.*?)</article>',
                            pagina_html, re.S):
        link = re.search(r'<h2[^>]*>\s*<a href="/([a-z]+)/(\d+)-([^"]*)"[^>]*>(.*?)</a>',
                         bloco, re.S)
        if not link:
            continue
        rota, ident, slug, titulo = link.groups()
        tipo = TIPO_DA_ROTA.get(rota, rota)
        locais, detalhe = analisar_detalhe(bloco, tipo)
        kicker = re.search(r'indexing kicker[^>]*>(.*?)</div>', bloco, re.S)
        img = re.search(r'<img[^>]*src="([^"]+)"', bloco)
        legenda = re.search(r'list-content.*?subtitle[^>]*>(.*?)</div>', bloco, re.S)
        linguagens = []
        if kicker:
            linguagens = [x.strip() for x in re.split(r"\se\s|,", texto(kicker.group(1)))
                          if x.strip()]
        itens.append({
            "tipo": tipo,
            "rota": rota,
            "id": int(ident),
            "slug": slug,
            "url": f"{BASE}/{rota}/{ident}-{slug}",
            "titulo": texto(titulo),
            "linguagens": linguagens,
            "locais": locais,
            "detalhe": detalhe,
            "imagem": img.group(1) if img else None,
            "creditoImagem": texto(legenda.group(1)) if legenda else None,
        })
    return itens


def url_fatia(tipo, expressao, ordem, q, pagina):
    p = {"q": q or "", "tipo": tipo, "ordem": ordem, "p": pagina}
    s = urllib.parse.urlencode(p)
    if expressao:
        s += f"&expressao_ids%5B%5D={expressao}"
    return f"{BASE}/busca?{s}"


def varrer(tipo, expressao, ordem, q, vistos, saida, limite_paginas):
    """Percorre uma fatia. Devolve (novos, total_declarado)."""
    novos, total, pagina = 0, None, 1
    while pagina <= min(MAX_PAGINAS, limite_paginas):
        pag = buscar(url_fatia(tipo, expressao, ordem, q, pagina))
        if not pag:
            break
        if total is None:
            total = total_de(pag)
        itens = analisar_pagina(pag)
        if not itens:
            break
        for it in itens:
            chave = (it["tipo"], it["id"])
            if chave not in vistos:
                vistos.add(chave)
                saida.write(json.dumps(it, ensure_ascii=False) + "\n")
                novos += 1
        if len(itens) < POR_PAGINA:
            break
        pagina += 1
        time.sleep(PAUSA)
    return novos, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite-paginas", type=int, default=MAX_PAGINAS)
    ap.add_argument("--profundo", action="store_true",
                    help="subdivide fatias no teto por letra inicial (caro)")
    args = ap.parse_args()

    vistos, feitas = set(), set()
    if ARQ_ITENS.exists():
        for linha in ARQ_ITENS.read_text(encoding="utf-8").splitlines():
            try:
                it = json.loads(linha)
                vistos.add((it["tipo"], it["id"]))
            except Exception:
                pass
    if ARQ_ESTADO.exists():
        feitas = set(map(tuple, json.loads(ARQ_ESTADO.read_text())["fatias"]))
    print(f"retomando com {len(vistos)} itens e {len(feitas)} fatias concluidas\n", flush=True)

    fatias = ([(t, e) for t in TIPOS_COM_EXPRESSAO for e in EXPRESSOES]
              + [(t, None) for t in TIPOS_COM_EXPRESSAO]
              + [(t, None) for t in TIPOS_SIMPLES])

    with ARQ_ITENS.open("a", encoding="utf-8") as saida:
        for tipo, expr in fatias:
            marca = (tipo, expr or 0, "az")
            rotulo = f"{tipo}/{EXPRESSOES.get(expr, 'sem-expressao')}"
            if marca in feitas:
                print(f"  ...  {rotulo:34} ja feita", flush=True)
                continue

            novos, total = varrer(tipo, expr, "az", "", vistos, saida, args.limite_paginas)
            print(f"  A-Z  {rotulo:34} total={str(total):>7}  novos={novos}", flush=True)

            if total and total >= TETO:
                n2, _ = varrer(tipo, expr, "za", "", vistos, saida, args.limite_paginas)
                print(f"  Z-A  {rotulo:34} {'':>13}  novos={n2}", flush=True)
                for letra in (string.ascii_lowercase if args.profundo else ""):
                    n3, t3 = varrer(tipo, expr, "az", letra, vistos, saida,
                                    args.limite_paginas)
                    if n3:
                        print(f"   q={letra} {rotulo:33} total={str(t3):>7}  novos={n3}",
                              flush=True)

            feitas.add(marca)
            ARQ_ESTADO.write_text(json.dumps({"fatias": sorted(feitas)},
                                             ensure_ascii=False), encoding="utf-8")
            saida.flush()

    print(f"\nCONCLUIDO. {len(vistos)} entidades unicas em {ARQ_ITENS}", flush=True)


if __name__ == "__main__":
    main()
