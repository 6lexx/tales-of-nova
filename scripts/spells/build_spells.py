#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_spells.py — Normalise le JSON de sorts (EN, full-PHB) vers le schéma de
la table `spells` (Supabase). Filtre au SRD 5.1, traduit les champs structurés
en FR, laisse nom/description/aux_niveaux_superieurs en EN (provisoire → passe
de traduction ultérieure via la fonction mj).

Entrée : spells_original.json (liste d'objets)
Sorties : spells_srd.json  (tableau de lignes, colonnes = table spells)
          seed_spells.sql   (upsert idempotent sur slug)

Usage : python3 build_spells.py [chemin_entree] [dossier_sortie]
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

# ============================================================================
#  Filtre SRD — liste d'EXCLUSION (sorts PHB hors SRD 5.1).
#  ⚠ Best-effort : à vérifier contre l'index officiel du SRD 5.1 avant
#  hébergement public. Éditer librement.
# ============================================================================
EXCLUSIONS_NON_SRD = {
    "chromatic orb", "hex", "hunter's mark", "compelled duel", "divine favor",
    "ensnaring strike", "searing smite", "wrathful smite", "branding smite",
    "blinding smite", "staggering smite", "banishing smite",
    "cordon of arrows", "hail of thorns", "lightning arrow", "swift quiver",
    "conjure barrage", "conjure volley", "grasping vine", "elemental weapon",
    "friends", "arcane gate", "power word heal", "guardian of nature",
}

# ============================================================================
#  Tables de correspondance FR (champs structurés — sûrs et canoniques)
# ============================================================================
ECOLES = {
    "abjuration": "Abjuration", "conjuration": "Invocation",
    "divination": "Divination", "enchantment": "Enchantement",
    "evocation": "Évocation", "illusion": "Illusion",
    "necromancy": "Nécromancie", "transmutation": "Transmutation",
}
CLASSES = {
    "sorcerer": "Ensorceleur", "wizard": "Magicien", "ranger": "Rôdeur",
    "bard": "Barde", "druid": "Druide", "cleric": "Clerc",
    "warlock": "Occultiste", "paladin": "Paladin", "fighter": "Guerrier",
    "rogue": "Roublard",
}
NIVEAUX = {"cantrip": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
           "6": 6, "7": 7, "8": 8, "9": 9}

# Entrées corrompues à la source (level/school illisibles) → valeurs canoniques SRD.
REPARATIONS = {
    "control weather": {"niveau": 8, "ecole": "Transmutation"},
}


def slugify(nom: str) -> str:
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def pieds_en_metres(pieds: int) -> str:
    m = pieds * 0.3  # convention D&D : 5 pieds = 1,50 m
    txt = f"{m:.2f}".rstrip("0").rstrip(".").replace(".", ",")
    unite = "mètre" if m <= 1 else "mètres"
    return f"{txt} {unite}"


def traduire_portee(portee: str) -> str:
    if not portee:
        return None
    p = portee.strip()
    bas = p.lower()
    if bas == "self":
        return "Personnelle"
    if bas == "touch":
        return "Contact"
    if bas in ("sight", "unlimited", "special"):
        return {"sight": "Vue", "unlimited": "Illimitée", "special": "Spéciale"}[bas]

    # "Self (30-foot radius)" / "Self (60-foot line)" ...
    forme = {
        "radius": "de rayon", "cone": "en cône", "line": "de long (ligne)",
        "cube": "(cube)", "sphere": "(sphère)", "square": "(carré)",
        "hemisphere": "(hémisphère)", "cylinder": "(cylindre)",
    }

    def repl_foot(m):
        pieds = int(m.group(1))
        suite = (m.group(2) or "").strip().lower()
        base = pieds_en_metres(pieds)
        return f"{base} {forme.get(suite, '')}".strip()

    p2 = re.sub(r"(\d+)[- ]foot(?:[- ]?(\w+))?", repl_foot, p, flags=re.I)
    p2 = re.sub(r"(\d+)\s*feet", lambda m: pieds_en_metres(int(m.group(1))), p2, flags=re.I)
    p2 = p2.replace("Self", "Personnelle").replace("radius", "de rayon")
    return p2


def traduire_temps(t: str) -> str:
    if not t:
        return None
    r = t
    r = re.sub(r"\bbonus action\b", "action bonus", r, flags=re.I)
    r = re.sub(r"\breaction\b", "réaction", r, flags=re.I)
    r = re.sub(r"\bminutes?\b", lambda m: "minute" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    r = re.sub(r"\bhours?\b", lambda m: "heure" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    return r


def traduire_duree(d: str) -> str:
    if not d:
        return None
    r = d
    r = re.sub(r"Concentration, up to", "Concentration, jusqu'à", r, flags=re.I)
    r = re.sub(r"\bInstantaneous\b", "Instantanée", r, flags=re.I)
    r = re.sub(r"\bUntil dispelled\b", "Jusqu'à dissipation", r, flags=re.I)
    r = re.sub(r"\bminutes?\b", lambda m: "minute" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    r = re.sub(r"\bhours?\b", lambda m: "heure" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    r = re.sub(r"\bdays?\b", lambda m: "jour" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    r = re.sub(r"\brounds?\b", lambda m: "round" + ("s" if m.group(0).endswith("s") else ""), r, flags=re.I)
    return r


def separer_niveaux_superieurs(desc: str):
    """Détache le paragraphe 'At Higher Levels' de la description."""
    if not desc:
        return desc, None
    m = re.search(r"(\*{0,3}At Higher Levels\.?\*{0,3}\s*)", desc, flags=re.I)
    if not m:
        return desc.strip(), None
    principal = desc[: m.start()].strip()
    superieur = desc[m.end():].strip()
    return principal, (superieur or None)


def normaliser(sort: dict):
    nom_en = (sort.get("name") or "").strip()
    if nom_en.lower() in EXCLUSIONS_NON_SRD:
        return None, "non-SRD"

    rep = REPARATIONS.get(nom_en.lower(), {})
    niveau = NIVEAUX.get(str(sort.get("level", "")).lower())
    if niveau is None:
        niveau = rep.get("niveau")
    if niveau is None:
        return None, "niveau invalide"

    comp = sort.get("components") or {}
    duree_en = sort.get("duration") or ""
    desc, aux = separer_niveaux_superieurs(sort.get("description") or "")

    classes_fr = [CLASSES.get(c.lower(), c.capitalize()) for c in (sort.get("classes") or [])]

    ligne = {
        "slug": slugify(nom_en),
        "nom": nom_en,                       # provisoire (EN) → traduction FR ultérieure
        "nom_en": nom_en,
        "niveau": niveau,
        "ecole": ECOLES.get((sort.get("school") or "").lower()) or rep.get("ecole"),
        "temps_incantation": traduire_temps(sort.get("casting_time")),
        "portee": traduire_portee(sort.get("range")),
        "composantes": comp.get("raw"),
        "duree": traduire_duree(duree_en),
        "concentration": duree_en.lower().startswith("concentration"),
        "rituel": bool(sort.get("ritual")),
        "classes": classes_fr,
        "description": desc or "—",
        "aux_niveaux_superieurs": aux,
        "source": "SRD 5.1",
    }
    return ligne, None


def sql_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, list):
        elems = ", ".join("'" + str(x).replace("'", "''") + "'" for x in v)
        return f"ARRAY[{elems}]::text[]"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    entree = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("spells_original.json")
    sortie = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")
    sortie.mkdir(parents=True, exist_ok=True)

    data = json.loads(entree.read_text(encoding="utf-8"))
    lignes, exclus, invalides = [], [], []
    for s in data:
        ligne, err = normaliser(s)
        if ligne:
            lignes.append(ligne)
        elif err == "non-SRD":
            exclus.append(s.get("name"))
        else:
            invalides.append(s.get("name"))

    # tri stable : niveau puis nom
    lignes.sort(key=lambda l: (l["niveau"], l["nom_en"]))

    # 1) JSON
    (sortie / "spells_srd.json").write_text(
        json.dumps(lignes, ensure_ascii=False, indent=2), encoding="utf-8")

    # 2) SQL upsert idempotent sur slug
    cols = ["slug", "nom", "nom_en", "niveau", "ecole", "temps_incantation",
            "portee", "composantes", "duree", "concentration", "rituel",
            "classes", "description", "aux_niveaux_superieurs", "source"]
    out = ["-- Seed idempotent de la table `spells` (SRD 5.1, champs structurés FR)",
           "-- Généré par build_spells.py — nom/description à traduire (passe FR).",
           "begin;"]
    for l in lignes:
        vals = ", ".join(sql_val(l[c]) for c in cols)
        out.append(
            f"insert into spells ({', '.join(cols)}) values ({vals})\n"
            f"on conflict (slug) do update set " +
            ", ".join(f"{c} = excluded.{c}" for c in cols if c != "slug") + ";"
        )
    out.append("commit;")
    (sortie / "seed_spells.sql").write_text("\n".join(out), encoding="utf-8")

    print(f"Retenus (SRD)   : {len(lignes)}")
    print(f"Exclus (non-SRD): {len(exclus)} → {', '.join(filter(None, exclus))}")
    print(f"Invalides       : {len(invalides)} → {', '.join(filter(None, invalides))}")


if __name__ == "__main__":
    main()