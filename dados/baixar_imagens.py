#!/usr/bin/env python3
"""
Baixa as imagens referenciadas pela amostra e pelo acervo normalizado.

As imagens vivem em dois hosts publicos:
  - midias-publicas.enciclopedia.itaucultural.org.br  (Enciclopedia)
  - s3.sa-east-1.amazonaws.com/prd.editor.fundacaoitau.org.br  (CMS do site)

O nome do arquivo local e o hash da URL, e um indice mapeia hash -> URL de origem,
para que o prototipo funcione offline sem perder a procedencia.

Uso:  python3 dados/baixar_imagens.py [--limite N]
Retomavel: pula o que ja existe em disco.
"""

import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
DEST = RAIZ / "imagens"
DEST.mkdir(parents=True, exist_ok=True)
INDICE = DEST / "indice.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def urls_da_amostra():
    saida = []
    amostra = RAIZ / "amostra" / "enciclopedia.jsonl"
    if amostra.exists():
        for linha in amostra.read_text(encoding="utf-8").splitlines():
            it = json.loads(linha)
            if it.get("imagem"):
                saida.append((it["imagem"], f"enc:{it['tipo']}:{it['id']}"))
    for arq in (RAIZ / "normalizado").glob("*.json"):
        for it in json.loads(arq.read_text(encoding="utf-8")):
            if isinstance(it, dict) and it.get("imagem"):
                saida.append((it["imagem"], it.get("id", arq.stem)))
    return saida


# Acima disso, a imagem e reduzida: o prototipo nao precisa de resolucao de impressao,
# e sem isso o acervo local passa de 400 MB.
LIMITE_BYTES = 400_000
LARGURA_MAX = 1600


def encolher(arq):
    """Reduz imagens grandes usando sips (nativo do macOS). Nunca amplia."""
    try:
        if arq.stat().st_size < LIMITE_BYTES:
            return
        larg = subprocess.run(["sips", "-g", "pixelWidth", str(arq)],
                              capture_output=True, text=True).stdout
        larg = int(larg.split("pixelWidth:")[1].split()[0])
        if larg > LARGURA_MAX:
            subprocess.run(["sips", "-Z", str(LARGURA_MAX), str(arq), "--out", str(arq)],
                           capture_output=True)
        antes = arq.stat().st_size
        tmp = arq.with_suffix(arq.suffix + ".tmp")
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "72",
                        str(arq), "--out", str(tmp)], capture_output=True)
        if tmp.exists() and tmp.stat().st_size < antes:
            tmp.replace(arq)
        else:
            tmp.unlink(missing_ok=True)
    except (ValueError, IndexError, OSError):
        pass


def nome_local(url):
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    ext = ".jpg"
    for e in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"):
        if e in url.lower():
            ext = e
            break
    return h + ext


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite", type=int, default=1200)
    args = ap.parse_args()

    indice = json.loads(INDICE.read_text()) if INDICE.exists() else {}
    pares, vistas = [], set()
    for url, dono in urls_da_amostra():
        if url not in vistas:
            vistas.add(url)
            pares.append((url, dono))
    pares = pares[:args.limite]
    print(f"{len(pares)} imagens a considerar", flush=True)

    baixadas = falhas = puladas = 0
    for i, (url, dono) in enumerate(pares, 1):
        alvo = DEST / nome_local(url)
        if alvo.exists() and alvo.stat().st_size > 0:
            puladas += 1
        else:
            r = subprocess.run(
                ["curl", "-sS", "-L", "-m", "40", "-A", UA, "-o", str(alvo), url],
                capture_output=True)
            if r.returncode == 0 and alvo.exists() and alvo.stat().st_size > 500:
                encolher(alvo)
                baixadas += 1
            else:
                alvo.unlink(missing_ok=True)
                falhas += 1
                continue
            time.sleep(0.1)
        indice[alvo.name] = {"url": url, "dono": dono}
        if i % 100 == 0:
            INDICE.write_text(json.dumps(indice, ensure_ascii=False, indent=1))
            print(f"  {i}/{len(pares)}  baixadas={baixadas} puladas={puladas} falhas={falhas}",
                  flush=True)

    INDICE.write_text(json.dumps(indice, ensure_ascii=False, indent=1))
    tam = sum(f.stat().st_size for f in DEST.glob("*") if f.is_file())
    print(f"\nOK. baixadas={baixadas} puladas={puladas} falhas={falhas} "
          f"| {len(indice)} no indice | {tam/1e6:.1f} MB", flush=True)


if __name__ == "__main__":
    main()
