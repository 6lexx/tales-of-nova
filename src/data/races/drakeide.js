// ============================================================================
//  DRAKÉIDE — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
//
//  Le Drakéide n'a pas de sous-race : il a un CHOIX d'ancêtre draconique, qui
//  détermine le type de dégâts, la forme et la sauvegarde de son Souffle.
//  ATTENTION : cette table est distincte de ANCETRES_DRACONIQUES dans
//  src/data/classes/ensorceleur.js — la Lignée draconique n'a pas de forme de
//  souffle ni de sauvegarde. Les deux ne sont volontairement pas fusionnées.
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  ANCÊTRES DRACONIQUES
//  forme : { type: "ligne", largeur, longueur } | { type: "cone", longueur }
//  (distances en mètres)
// ============================================================================
export const ANCETRES_DRACONIQUES = {
  airain: {
    id: "airain", nom: "Airain", degats: "feu",
    forme: { type: "ligne", largeur: 1.5, longueur: 9 }, sauvegarde: "DEX",
  },
  argent: {
    id: "argent", nom: "Argent", degats: "froid",
    forme: { type: "cone", longueur: 4.5 }, sauvegarde: "CON",
  },
  blanc: {
    id: "blanc", nom: "Blanc", degats: "froid",
    forme: { type: "cone", longueur: 4.5 }, sauvegarde: "CON",
  },
  bleu: {
    id: "bleu", nom: "Bleu", degats: "foudre",
    forme: { type: "ligne", largeur: 1.5, longueur: 9 }, sauvegarde: "DEX",
  },
  bronze: {
    id: "bronze", nom: "Bronze", degats: "foudre",
    forme: { type: "ligne", largeur: 1.5, longueur: 9 }, sauvegarde: "DEX",
  },
  cuivre: {
    id: "cuivre", nom: "Cuivre", degats: "acide",
    forme: { type: "ligne", largeur: 1.5, longueur: 9 }, sauvegarde: "DEX",
  },
  noir: {
    id: "noir", nom: "Noir", degats: "acide",
    forme: { type: "ligne", largeur: 1.5, longueur: 9 }, sauvegarde: "DEX",
  },
  or: {
    id: "or", nom: "Or", degats: "feu",
    forme: { type: "cone", longueur: 4.5 }, sauvegarde: "DEX",
  },
  rouge: {
    id: "rouge", nom: "Rouge", degats: "feu",
    forme: { type: "cone", longueur: 4.5 }, sauvegarde: "DEX",
  },
  vert: {
    id: "vert", nom: "Vert", degats: "poison",
    forme: { type: "cone", longueur: 4.5 }, sauvegarde: "CON",
  },
};

// ============================================================================
//  TRAITS RACIAUX (Drakéide)
// ============================================================================
export const TRAITS = {
  ancetre_draconique: {
    nom: "Ancêtre draconique",
    type: "choix",
    description:
      "Vous descendez d'un type de dragon particulier. Ce choix détermine le type de dégâts de votre Souffle et de votre Résistance aux dégâts.",
    effet: { type: "choix_ancetre_draconique", parmi: Object.keys(ANCETRES_DRACONIQUES) },
  },
  souffle: {
    nom: "Arme de souffle",
    type: "action",
    ressource: { max: 1, recharge: RECHARGE.COURT },
    description:
      "Par une action, vous exhalez une énergie destructrice dont la forme et le type dépendent de votre ancêtre draconique. Chaque créature dans la zone effectue un jet de sauvegarde (DD = 8 + votre modificateur de Constitution + votre bonus de maîtrise), subissant les dégâts complets en cas d'échec et la moitié en cas de réussite. Les dégâts sont de 2d6, et augmentent à 3d6 au niveau 6, 4d6 au niveau 11 et 5d6 au niveau 16. Une utilisation par repos court ou long.",
    effet: {
      type: "souffle",
      ddFormule: "8 + mod_constitution + bonus_maitrise",
      paliers: [
        { niveau: 1, des: "2d6" }, { niveau: 6, des: "3d6" },
        { niveau: 11, des: "4d6" }, { niveau: 16, des: "5d6" },
      ],
      demiDegatsSurReussite: true,
    },
  },
  resistance_aux_degats: {
    nom: "Résistance aux dégâts",
    type: "passif",
    description:
      "Vous bénéficiez de la résistance au type de dégâts associé à votre ancêtre draconique.",
    effet: { type: "resistance", degatsSelonAncetre: true },
  },
};

// ============================================================================
//  SOUS-RACES — aucune (le choix se fait sur l'ancêtre draconique)
// ============================================================================
export const SOUS_RACES = {};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const DRAKEIDE = {
  id: "drakeide",
  nom: "Drakéide",
  source: "SRD 5.1 FR",
  bonusStats: { FOR: 2, CHA: 1 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 180, maxCm: 200 },
  vitesse: 9,
  ageMaturite: 15,
  ageMax: 80,
  langues: ["commun", "draconique"],
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: false,
  // Choix racial obligatoire, hors mécanisme de sous-race.
  choixRequis: [{ cle: "ancetre_draconique", parmi: Object.keys(ANCETRES_DRACONIQUES) }],
  ancetresDraconiques: ANCETRES_DRACONIQUES,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés, clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(_sousRaceId = null) {
  return { ...DRAKEIDE.bonusStats };
}

/** Traits cumulés, enrichis de leur identifiant et de leur origine. */
export function traitsComplets(_sousRaceId = null) {
  return Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
}

/** Liste des sous-races disponibles : [] (le Drakéide choisit un ancêtre). */
export function sousRacesDisponibles() {
  return [];
}

/** Liste des ancêtres draconiques : [{ id, nom, degats, forme, sauvegarde }]. */
export function ancetresDisponibles() {
  return Object.values(ANCETRES_DRACONIQUES);
}

/** Type de dégâts associé à un ancêtre draconique. */
export function degatsAncetre(ancetreId) {
  return ANCETRES_DRACONIQUES[ancetreId]?.degats ?? null;
}

/** Dés du Souffle à un niveau donné (ex. "3d6" au niveau 6). */
export function desSouffle(niveau) {
  let des = null;
  for (const p of TRAITS.souffle.effet.paliers) {
    if (niveau >= p.niveau) des = p.des;
  }
  return des;
}

/**
 * Descriptif complet du Souffle pour un ancêtre et un niveau :
 * { degats, des, forme, sauvegarde, ddFormule }.
 */
export function souffle(ancetreId, niveau) {
  const a = ANCETRES_DRACONIQUES[ancetreId];
  if (!a) return null;
  return {
    degats: a.degats,
    des: desSouffle(niveau),
    forme: a.forme,
    sauvegarde: a.sauvegarde,
    ddFormule: TRAITS.souffle.effet.ddFormule,
  };
}

export default DRAKEIDE;