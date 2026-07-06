#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_sections.py — Isole la zone races+classes du PDF AideDD (exclut le
chapitre des sorts) et la découpe en chunks. La source (race/classe) est
déduite ensuite par le modèle (extract_features.mjs), car les entêtes de
section ne sont pas extractibles en texte depuis ce PDF.

Sortie : features_sections.json → [{"i": int, "texte": str}]
Usage  : python3 build_sections.py [chemin_pdf] [dossier_sortie]
"""

import json
import re
import sys
from pathlib import Path

import pypdf

MAXLEN = 3200      # taille de chunk (caractères)
OVERLAP = 400      # recouvrement (évite de couper une capacité en deux)

# Marqueur de bloc de sort → début du chapitre Sorts (= fin de la zone utile).
BLOC_SORT = re.compile(r"Temps d.incantation\s*:", re.I)


def nettoyer(txt: str) -> str:
    txt = re.sub(r"WWW\.AIDEDD\.ORG \| RACES, CLASSES et SORTS", " ", txt)
    txt = re.sub(r"\n\s*\d{1,3}\s*\n", "\n", txt)   # numéros de page isolés
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    return txt


def debut_sorts(zone: str) -> int:
    fen = 3000
    for i in range(0, len(zone) - fen, fen):
        if len(BLOC_SORT.findall(zone[i:i + fen])) >= 2:
            return i
    return len(zone)


def chunker(texte: str):
    out, i = [], 0
    while i < len(texte):
        out.append(texte[i:i + MAXLEN])
        i += MAXLEN - OVERLAP
    return out


def main():
    pdf = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("Races-Classes.pdf")
    sortie = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")
    sortie.mkdir(parents=True, exist_ok=True)

    reader = pypdf.PdfReader(str(pdf))
    texte = nettoyer("\n".join((p.extract_text() or "") for p in reader.pages))
    fin = debut_sorts(texte)
    zone = texte[:fin].strip()

    sections = [{"i": i, "texte": ch} for i, ch in enumerate(chunker(zone))]
    (sortie / "features_sections.json").write_text(
        json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Zone races/classes : {len(zone)} chars (coupe @{fin})")
    print(f"Chunks générés     : {len(sections)}")


if __name__ == "__main__":
    main()