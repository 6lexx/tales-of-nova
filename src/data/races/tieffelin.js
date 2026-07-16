// ============================================================================
//  TIEFFELIN — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (Tieffelin)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Grâce à votre héritage infernal, vous bénéficiez d'une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — uniquement en nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  resistance_infernale: {
    nom: "Résistance infernale",
    type: "passif",
    description: "Vous bénéficiez de la résistance aux dégâts de feu.",
    effet: { type: "resistance", degats: ["feu"] },
  },
  legs_infernal: {
    nom: "Legs infernal",
    type: "special",
    description:
      "Vous connaissez le sort mineur thaumaturgie. Au niveau 3, vous pouvez lancer châtiment infernal en tant que sort de niveau 2, une fois par repos long. Au niveau 5, vous pouvez lancer ténèbres une fois par repos long. Le Charisme est votre caractéristique d'incantation pour ces sorts.",
    effet: {
      type: "sorts_raciaux",
      caracteristique: "CHA",
      sorts: [
        { sort: "thaumaturgie", niveau: 1, usage: "a_volonte" },
        { sort: "châtiment infernal", niveau: 3, usage: 1, recharge: RECHARGE.LONG, niveauSort: 2 },
        { sort: "ténèbres", niveau: 5, usage: 1, recharge: RECHARGE.LONG },
      ],
    },
  },
};

// ============================================================================
//  SOUS-RACES — aucune au SRD 5.1
// ============================================================================
export const SOUS_RACES = {};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const TIEFFELIN = {
  id: "tieffelin",
  nom: "Tieffelin",
  source: "SRD 5.1 FR",
  bonusStats: { INT: 1, CHA: 2 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 150, maxCm: 190 },
  vitesse: 9,
  ageMaturite: 18,
  ageMax: 100,
  langues: ["commun", "infernal"],
  languesAuChoix: 0,
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: false,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés, clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(_sousRaceId = null) {
  return { ...TIEFFELIN.bonusStats };
}

/** Traits cumulés, enrichis de leur identifiant et de leur origine. */
export function traitsComplets(_sousRaceId = null) {
  return Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
}

/** Sorts raciaux (Legs infernal) disponibles à un niveau donné. */
export function sortsRaciaux(_sousRaceId, niveau) {
  return TRAITS.legs_infernal.effet.sorts.filter((s) => niveau >= s.niveau);
}

/** Liste des sous-races disponibles : [] (aucune au SRD 5.1). */
export function sousRacesDisponibles() {
  return [];
}

export default TIEFFELIN;