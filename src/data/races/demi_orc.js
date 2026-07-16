// ============================================================================
//  DEMI-ORC — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
//
//  NOTE D'IDENTIFIANT : `id: "orc"` — c'est la clé déjà utilisée par ESPECES
//  dans CharacterCreator.jsx pour le Demi-orc. Le nom canonique reste "Demi-orc".
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (Demi-orc)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Grâce à votre sang orc, vous bénéficiez d'une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — uniquement en nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  menacant: {
    nom: "Menaçant",
    type: "passif",
    description: "Vous maîtrisez la compétence Intimidation.",
    effet: { type: "maitrise_additionnelle", competences: ["intimidation"] },
  },
  endurance_implacable: {
    nom: "Endurance implacable",
    type: "special",
    ressource: { max: 1, recharge: RECHARGE.LONG },
    description:
      "Quand vous tombez à 0 point de vie sans être tué sur le coup, vous pouvez à la place vous retrouver à 1 point de vie. Vous ne pouvez pas réutiliser ce trait avant d'avoir terminé un repos long.",
    effet: { type: "survie_a_zero_pv", pvRestants: 1, automatique: true },
  },
  attaques_sauvages: {
    nom: "Attaques sauvages",
    type: "passif",
    description:
      "Quand vous obtenez un coup critique avec une attaque d'arme de corps à corps, vous pouvez lancer un dé de dégâts supplémentaire de l'arme et l'ajouter aux dégâts additionnels du coup critique.",
    effet: { type: "des_critique_supplementaires", des: 1, condition: "attaque_melee" },
  },
};

// ============================================================================
//  SOUS-RACES — aucune au SRD 5.1
// ============================================================================
export const SOUS_RACES = {};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const DEMI_ORC = {
  id: "orc", // aligné sur l'id déjà utilisé dans ESPECES (CharacterCreator.jsx)
  nom: "Demi-orc",
  source: "SRD 5.1 FR",
  bonusStats: { FOR: 2, CON: 1 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 150, maxCm: 200 },
  vitesse: 9,
  ageMaturite: 14,
  ageMax: 75,
  langues: ["commun", "orc"],
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: false,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés, clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(_sousRaceId = null) {
  return { ...DEMI_ORC.bonusStats };
}

/** Traits cumulés, enrichis de leur identifiant et de leur origine. */
export function traitsComplets(_sousRaceId = null) {
  return Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
}

/** Liste des sous-races disponibles : [] (aucune au SRD 5.1). */
export function sousRacesDisponibles() {
  return [];
}

/** Utilisations max d'une ressource raciale (Endurance implacable). */
export function utilisationsMax(traitId) {
  return TRAITS[traitId]?.ressource?.max ?? 0;
}

export default DEMI_ORC;