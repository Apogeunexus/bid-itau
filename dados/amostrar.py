#!/usr/bin/env python3
"""
Monta a amostra curada da Enciclopedia para o prototipo.

Nao e uma amostra aleatoria: cada fatia existe para sustentar um dos cinco cenarios
do RFP. Se um cenario nao tiver dado que o suporte, o prototipo nao demonstra nada.

  Cenario 1 (Maria / primeiro teatro)  -> teatro, poesia, literatura, musica
  Cenario 2 (Carlos / 4 dias em Belem) -> Para, Amazonas, Amapa, Maranhao
  Cenario 3 (duplicatas)               -> instituicoes com espaco declarado
  Cenario 4 (mudanca de horario)       -> eventos com data e espaco
  Cenario 5 ("parecido com a Bienal")  -> bienal, arte contemporanea, coletivos

O tesauro (termos) e os grupos vem inteiros: sao pequenos e formam a espinha da
ontologia.

Uso:  python3 dados/amostrar.py
"""

import json
import time
from pathlib import Path

import coletar_enciclopedia as enc

RAIZ = Path(__file__).resolve().parent
DEST = RAIZ / "amostra"
DEST.mkdir(parents=True, exist_ok=True)
ARQ = DEST / "enciclopedia.jsonl"

# (tipo, expressao_id, termo_de_busca, paginas)  — 20 itens por pagina
FATIAS = [
    # --- Cenario 1: o caminho do rap ao teatro ---
    ("pessoa", 6, "", 4), ("obra", 6, "", 4), ("grupo", 6, "", 2),
    ("pessoa", 4, "", 3), ("obra", 4, "", 3),
    ("pessoa", 5, "", 3), ("pessoa", 3, "", 2),
    ("pessoa", None, "rap", 1), ("pessoa", None, "poesia", 1),
    ("obra", None, "poesia", 1),

    # --- Cenario 2: territorio Norte ---
    ("pessoa", None, "Belém", 2), ("instituicao", None, "Belém", 2),
    ("evento", None, "Belém", 1), ("pessoa", None, "Pará", 2),
    ("pessoa", None, "Amazonas", 1), ("instituicao", None, "Amazonas", 1),
    ("pessoa", None, "Maranhão", 1), ("pessoa", None, "Amapá", 1),

    # --- Cenarios 3 e 4: instituicoes, espacos e eventos datados ---
    ("instituicao", None, "", 5), ("instituicao", None, "teatro", 2),
    ("instituicao", None, "museu", 2), ("instituicao", None, "centro cultural", 2),
    ("evento", 1, "", 4), ("evento", None, "", 3),

    # --- Cenario 5: a vizinhanca da Bienal ---
    ("evento", None, "bienal", 3), ("pessoa", None, "bienal", 1),
    ("pessoa", 1, "", 4), ("obra", 1, "", 4),
    ("grupo", None, "coletivo", 2),

    # --- espinha da ontologia: tesauro e grupos, integrais ---
    ("termo", None, "", 25),
    ("grupo", None, "", 10),
]


def main():
    vistos = set()
    if ARQ.exists():
        for linha in ARQ.read_text(encoding="utf-8").splitlines():
            it = json.loads(linha)
            vistos.add((it["tipo"], it["id"]))

    with ARQ.open("a", encoding="utf-8") as saida:
        for tipo, expr, termo, paginas in FATIAS:
            novos, total = enc.varrer(tipo, expr, "az", termo, vistos, saida, paginas)
            rotulo = f"{tipo}/{enc.EXPRESSOES.get(expr, '-')}/{termo or '-'}"
            print(f"  {rotulo:44} total={str(total):>7}  novos={novos}", flush=True)
            saida.flush()
            time.sleep(0.2)

    print(f"\nAMOSTRA: {len(vistos)} entidades unicas em {ARQ}")


if __name__ == "__main__":
    main()
