// ============================================================================
//  INDEX DES RACES — agrège les définitions de src/data/races/*.js
// ----------------------------------------------------------------------------
//  Clé = `id` de la race, qui correspond aux ids déjà utilisés par ESPECES
//  dans CharacterCreator.jsx (dont "orc" pour le Demi-orc et "demi-elfe").
//  Aucune table de correspondance : on réutilise les ids existants.
//
//  NOM DE FICHIER ≠ IDENTIFIANT — ne pas « aligner » l'un sur l'autre :
//    • fichiers : demi_elfe.js / demi_orc.js (underscore, convention du projet,
//      cf. objets_communs.js) ;
//    • ids      : "demi-elfe" (tiret) et "orc", imposés par ESPECES et donc par
//      ce qui est déjà en base.
//  Renommer un id casserait la résolution des espèces ; renommer un fichier
//  casserait ces imports. Les deux sont volontairement décorrélés.
// ============================================================================

import NAIN, * as nain from "./nain.js";
import ELFE, * as elfe from "./elfe.js";
import HALFELIN, * as halfelin from "./halfelin.js";
import HUMAIN, * as humain from "./humain.js";
import DRAKEIDE, * as drakeide from "./drakeide.js";
import GNOME, * as gnome from "./gnome.js";
import DEMI_ELFE, * as demiElfe from "./demi_elfe.js";
import DEMI_ORC, * as demiOrc from "./demi_orc.js";
import TIEFFELIN, * as tieffelin from "./tieffelin.js";

/** Définition racine de chaque race, par id. */
export const RACES = {
  [NAIN.id]: NAIN,
  [ELFE.id]: ELFE,
  [HALFELIN.id]: HALFELIN,
  [HUMAIN.id]: HUMAIN,
  [DRAKEIDE.id]: DRAKEIDE,
  [GNOME.id]: GNOME,
  [DEMI_ELFE.id]: DEMI_ELFE,
  [DEMI_ORC.id]: DEMI_ORC,
  [TIEFFELIN.id]: TIEFFELIN,
};

/** Module complet (helpers inclus) de chaque race, par id. */
export const RACES_MODULES = {
  [NAIN.id]: nain,
  [ELFE.id]: elfe,
  [HALFELIN.id]: halfelin,
  [HUMAIN.id]: humain,
  [DRAKEIDE.id]: drakeide,
  [GNOME.id]: gnome,
  [DEMI_ELFE.id]: demiElfe,
  [DEMI_ORC.id]: demiOrc,
  [TIEFFELIN.id]: tieffelin,
};

/** Définition racine d'une race, ou null. */
export const race = (raceId) => RACES[raceId] ?? null;

/**
 * Bonus de caractéristiques cumulés (race + sous-race + bonus libres éventuels),
 * clés FOR/DEX/CON/INT/SAG/CHA.
 */
export function bonusStatsComplets(raceId, sousRaceId = null, bonusLibresChoisis = []) {
  const m = RACES_MODULES[raceId];
  if (!m) return {};
  return m.bonusStatsComplets(sousRaceId, bonusLibresChoisis);
}

/** Traits cumulés (race + sous-race), chacun enrichi de `id` et `origine`. */
export function traitsComplets(raceId, sousRaceId = null) {
  const m = RACES_MODULES[raceId];
  if (!m) return [];
  return m.traitsComplets(sousRaceId);
}

/** Sous-races disponibles pour une race : [{ id, nom }]. */
export function sousRacesDisponibles(raceId) {
  const m = RACES_MODULES[raceId];
  if (!m) return [];
  return m.sousRacesDisponibles();
}

/** Vitesse effective (l'Elfe des bois surcharge la vitesse de base). */
export function vitesse(raceId, sousRaceId = null) {
  const m = RACES_MODULES[raceId];
  if (!m) return null;
  return typeof m.vitesse === "function" ? m.vitesse(sousRaceId) : RACES[raceId]?.vitesse ?? null;
}

/** Sorts raciaux disponibles à un niveau donné (Drow, Gnome des forêts, Tieffelin). */
export function sortsRaciaux(raceId, sousRaceId, niveau) {
  const m = RACES_MODULES[raceId];
  if (typeof m?.sortsRaciaux !== "function") return [];
  return m.sortsRaciaux(sousRaceId, niveau);
}

/**
 * Descriptif du souffle si la race en possède un, sinon null (seul le Drakéide
 * au SRD 5.1). Détecté par capacité du module, pas par test d'identifiant :
 * une race qui exporterait `souffle()` serait prise en charge sans y revenir.
 * → { degats, des, forme, sauvegarde, ddFormule }
 */
export function souffle(raceId, ancetreId, niveau) {
  const m = RACES_MODULES[raceId];
  if (typeof m?.souffle !== "function" || !ancetreId) return null;
  return m.souffle(ancetreId, niveau);
}

/** Nom lisible d'un ancêtre draconique ("or" → "Or"), ou null. */
export function nomAncetre(raceId, ancetreId) {
  return RACES[raceId]?.ancetresDraconiques?.[ancetreId]?.nom ?? null;
}

/**
 * Choix raciaux à présenter au joueur, dérivés des traits `type: "choix"` et
 * de `choixRequis`. Retourne une liste normalisée :
 *   { cle, label, nature, options?, nombre? }
 * nature ∈ "ancetre_draconique" | "outils" | "competences" | "langues" | "sorts_mineurs"
 */
export function choixRaciaux(raceId, sousRaceId = null) {
  const def = RACES[raceId];
  if (!def) return [];
  const out = [];

  for (const c of def.choixRequis ?? []) {
    if (c.cle === "ancetre_draconique") {
      out.push({
        cle: "ancetre_draconique",
        label: "Ancêtre draconique",
        nature: "ancetre_draconique",
        options: Object.values(def.ancetresDraconiques ?? {}).map((a) => ({
          id: a.id,
          nom: a.nom,
          detail: `${a.degats} · ${a.forme.type === "cone" ? `cône ${a.forme.longueur} m` : `ligne ${a.forme.longueur} m`} · sauv. ${a.sauvegarde}`,
        })),
      });
    }
  }

  for (const t of traitsComplets(raceId, sousRaceId)) {
    const e = t.effet ?? {};
    if (e.type === "outils_additionnels") {
      out.push({
        cle: `outils:${t.id}`,
        label: t.nom,
        nature: "outils",
        nombre: e.nombre ?? 1,
        options: (e.parmi ?? []).map((o) => ({ id: o, nom: libelleOutil(o) })),
      });
    }
    if (e.type === "competences_additionnelles" && e.nombre) {
      out.push({ cle: `competences:${t.id}`, label: t.nom, nature: "competences", nombre: e.nombre });
    }
    if (e.type === "langues_additionnelles" && e.nombre) {
      out.push({ cle: `langues:${t.id}`, label: t.nom, nature: "langues", nombre: e.nombre });
    }
    if (e.type === "sorts_mineurs_additionnels" && e.source) {
      out.push({
        cle: `sort_mineur:${t.id}`,
        label: t.nom,
        nature: "sorts_mineurs",
        nombre: e.nombre ?? 1,
        source: e.source,
        caracteristique: e.caracteristique ?? null,
      });
    }
  }
  return out;
}

/** Nombre de compétences supplémentaires accordées par la race (Polyvalence du Demi-elfe). */
export function competencesRaciales(raceId, sousRaceId = null) {
  return choixRaciaux(raceId, sousRaceId)
    .filter((c) => c.nature === "competences")
    .reduce((n, c) => n + c.nombre, 0);
}

/**
 * Nombre de langues supplémentaires au choix accordées par la race.
 * Source unique : les traits `langues_additionnelles` (Humain, Demi-elfe,
 * Haut-elfe). Il n'y a volontairement pas de champ `languesAuChoix` sur la
 * racine : il aurait porté la même information une seconde fois.
 */
export function languesRaciales(raceId, sousRaceId = null) {
  return choixRaciaux(raceId, sousRaceId)
    .filter((c) => c.nature === "langues")
    .reduce((n, c) => n + c.nombre, 0);
}

/**
 * Maîtrises accordées par la race (armes / armures / compétences / outils),
 * agrégées depuis les traits `maitrise_additionnelle`.
 */
export function maitrisesRaciales(raceId, sousRaceId = null) {
  const out = { armes: [], armures: [], competences: [], outils: [] };
  for (const t of traitsComplets(raceId, sousRaceId)) {
    const e = t.effet ?? {};
    if (e.type !== "maitrise_additionnelle") continue;
    for (const cle of ["armes", "armures", "competences", "outils"]) {
      for (const v of e[cle] ?? []) if (!out[cle].includes(v)) out[cle].push(v);
    }
  }
  return out;
}

/** Libellé lisible d'un identifiant d'outil (les outils n'ont pas de catalogue). */
function libelleOutil(refOutil) {
  return refOutil
    .replace(/^outils_de_/, "Outils de ")
    .replace(/^materiel_de_/, "Matériel de ")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export default RACES;