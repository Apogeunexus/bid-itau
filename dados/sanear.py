#!/usr/bin/env python3
"""
Saneia o campo territorial dos itens ja coletados da Enciclopedia.

Motivo: a primeira versao do parser tratava `detail-info` como territorio para todos
os tipos. Mas o bloco e polimorfico — em `obra` ele traz autor, ano e tecnica; em
`termo`, legenda de obra. Resultado: ~24% das entradas tinham tecnica ou nome de
artista no campo `pais`.

Este script reprocessa o que ja esta em disco, sem precisar rastrear de novo:

  - tipos sem territorio (obra, termo, midia) -> `locais` vira `detalhe` bruto
  - tipos com territorio                      -> entradas cujo `pais` nao esta no
                                                 vocabulario fechado sao rebaixadas
                                                 para `detalhe`, nao apagadas

Nada e descartado: o que nao vira territorio vira detalhe, preservado.
E idempotente — rodar duas vezes nao muda nada.

Uso:  python3 dados/sanear.py
"""

import json
from pathlib import Path

import coletar_enciclopedia as enc

RAIZ = Path(__file__).resolve().parent
ALVOS = [RAIZ / "amostra" / "enciclopedia.jsonl",
         RAIZ / "bruto" / "enciclopedia" / "itens.jsonl"]


def parte_legivel(local):
    """Remonta uma entrada de local rejeitada como texto, sem perder informacao."""
    pedacos = [local.get(k) for k in ("data", "pais", "estado", "cidade", "espaco")]
    return " · ".join(p for p in pedacos if p)


def recuperar(trecho):
    """Uma passagem anterior rebaixou territorio valido a texto. Se os pedacos
    separados por ' · ' contiverem um pais do vocabulario, remonta o local."""
    partes = [x.strip() for x in trecho.split(" · ") if x.strip()]
    for i, parte in enumerate(partes):
        if parte in enc.PAISES:
            resto = partes[i + 1:]
            return {
                "data": partes[0] if i > 0 else None,
                "pais": parte,
                "estado": resto[0] if len(resto) > 0 else None,
                "cidade": resto[1] if len(resto) > 1 else None,
                "espaco": resto[2] if len(resto) > 2 else None,
            }
    return None


def sanear(item):
    locais, detalhes = [], []

    for l in (item.get("locais") or []):
        (locais if l.get("pais") in enc.PAISES else detalhes).append(
            l if l.get("pais") in enc.PAISES else parte_legivel(l))

    for trecho in (item.get("detalhe") or "").split(" | "):
        if not trecho.strip():
            continue
        recuperado = recuperar(trecho)
        if recuperado:
            locais.append(recuperado)
        else:
            detalhes.append(trecho.strip())

    vistos, unicos = set(), []
    for l in locais:
        chave = (l["pais"], l.get("estado"), l.get("cidade"), l.get("espaco"), l.get("data"))
        if chave not in vistos:
            vistos.add(chave)
            unicos.append(l)

    item["locais"] = unicos
    item["detalhe"] = " | ".join(dict.fromkeys(d for d in detalhes if d)) or None
    return item


def main():
    for arq in ALVOS:
        if not arq.exists():
            print(f"  (ausente) {arq}")
            continue
        linhas = arq.read_text(encoding="utf-8").splitlines()
        antes_locais = depois_locais = 0
        saida = []
        for linha in linhas:
            if not linha.strip():
                continue
            it = json.loads(linha)
            antes_locais += len(it.get("locais") or [])
            it = sanear(it)
            depois_locais += len(it["locais"])
            saida.append(json.dumps(it, ensure_ascii=False))
        arq.write_text("\n".join(saida) + "\n", encoding="utf-8")
        rejeitadas = antes_locais - depois_locais
        pct = 100 * rejeitadas // antes_locais if antes_locais else 0
        print(f"  {arq.name:20} {len(saida):>6} itens | "
              f"locais {antes_locais} -> {depois_locais} "
              f"({rejeitadas} rebaixados a detalhe, {pct}%)")


if __name__ == "__main__":
    main()
