// ============================================================================
//  HALFELIN — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (tronc commun Halfelin)
// ============================================================================
export const TRAITS = {
  chanceux: {
    nom: "Chanceux",
    type: "passif",
    description:
      "Quand vous obtenez un 1 sur le d20 d'un jet d'attaque, d'un test de caractéristique ou d'un jet de sauvegarde, vous pouvez relancer le dé et devez utiliser le nouveau résultat.",
    effet: {
      type: "relance_de",
      declencheur: 1,
      cibles: ["jet_attaque", "test_caracteristique", "jet_sauvegarde"],
      obligatoire: true,
    },
  },
  brave: {
    nom: "Brave",
    type: "passif",
    description: "Vous avez l'avantage aux jets de sauvegarde contre l'état effrayé.",
    effet: { type: "avantage_sauvegarde", contre: ["effroi"] },
  },
  agilite_halfeline: {
    nom: "Agilité halfeline",
    type: "passif",
    description:
      "Vous pouvez traverser l'espace occupé par une créature dont la catégorie de taille est supérieure à la vôtre.",
    effet: { type: "traverse_espace_creature", condition: "taille_superieure" },
  },
};

// ============================================================================
//  SOUS-RACES
// ============================================================================
export const SOUS_RACES = {
  pied_leger: {
    id: "pied_leger",
    nom: "Pied-léger",
    bonusStats: { CHA: 1 },
    traits: {
      discretion_naturelle: {
        nom: "Discrétion naturelle",
        type: "passif",
        description:
          "Vous pouvez tenter de vous cacher même quand vous êtes seulement masqué par une créature dont la catégorie de taille est au moins supérieure d'un cran à la vôtre.",
        effet: { type: "discretion_conditionnelle", condition: "masque_par_creature_plus_grande" },
      },
    },
  },
  robuste: {
    id: "robuste",
    nom: "Robuste",
    bonusStats: { CON: 1 },
    traits: {
      resistance_robuste: {
        nom: "Résistance robuste",
        type: "passif",
        description:
          "Vous avez l'avantage aux jets de sauvegarde contre le poison et la résistance aux dégâts de poison.",
        effet: { type: "resistance", degats: ["poison"], avantageSauvegarde: ["poison"] },
      },
    },
  },
};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const HALFELIN = {
  id: "halfelin",
  nom: "Halfelin",
  source: "SRD 5.1 FR",
  bonusStats: { DEX: 2 },
  bonusLibres: 0,
  taille: { categorie: "P", minCm: 85, maxCm: 100 },
  vitesse: 7.5,
  ageMaturite: 20,
  ageMax: 150,
  langues: ["commun", "halfelin"],
  languesAuChoix: 0,
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: true,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés (race + sous-race), clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(sousRaceId = null) {
  const sr = SOUS_RACES[sousRaceId];
  const out = { ...HALFELIN.bonusStats };
  for (const [cle, val] of Object.entries(sr?.bonusStats ?? {})) {
    out[cle] = (out[cle] ?? 0) + val;
  }
  return out;
}

/** Traits cumulés (race + sous-race), enrichis de leur identifiant et de leur origine. */
export function traitsComplets(sousRaceId = null) {
  const base = Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
  const sr = SOUS_RACES[sousRaceId];
  const sup = Object.entries(sr?.traits ?? {}).map(([id, t]) => ({ id, origine: "sous_race", ...t }));
  return [...base, ...sup];
}

/** Liste des sous-races disponibles : [{ id, nom }]. */
export function sousRacesDisponibles() {
  return Object.values(SOUS_RACES).map(({ id, nom }) => ({ id, nom }));
}

export default HALFELIN;