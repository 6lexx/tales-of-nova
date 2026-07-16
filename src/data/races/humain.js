// ============================================================================
//  HUMAIN — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
//
//  NOTE SRD : le SRD 5.1 ne contient QUE l'Humain de base (+1 à toutes les
//  caractéristiques, aucun don). L'« Humain variante » (+1 à deux caractéristiques,
//  une compétence et un don au niveau 1) est une option du Manuel des Joueurs,
//  hors SRD. ESPECES dans CharacterCreator.jsx affiche aujourd'hui « Don
//  supplémentaire au niveau 1 » en trait tout en donnant +1 partout : c'est un
//  mélange des deux versions. Ce fichier suit le SRD. Voir remarque de livraison.
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (Humain)
// ============================================================================
export const TRAITS = {
  polyvalence_humaine: {
    nom: "Polyvalence humaine",
    type: "passif",
    description:
      "Chacune de vos valeurs de caractéristique augmente de 1.",
    effet: {
      type: "bonus_caracteristique",
      valeurs: { FOR: 1, DEX: 1, CON: 1, INT: 1, SAG: 1, CHA: 1 },
    },
  },
  langue_supplementaire: {
    nom: "Langue supplémentaire",
    type: "choix",
    description:
      "Vous pouvez parler, lire et écrire une langue supplémentaire de votre choix. Les humains apprennent volontiers la langue de ceux qu'ils côtoient.",
    effet: { type: "langues_additionnelles", nombre: 1 },
  },
};

// ============================================================================
//  SOUS-RACES — aucune au SRD 5.1
// ============================================================================
export const SOUS_RACES = {};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const HUMAIN = {
  id: "humain",
  nom: "Humain",
  source: "SRD 5.1 FR",
  bonusStats: { FOR: 1, DEX: 1, CON: 1, INT: 1, SAG: 1, CHA: 1 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 150, maxCm: 190 },
  vitesse: 9,
  ageMaturite: 18,
  ageMax: 100,
  langues: ["commun"],
  languesAuChoix: 1,
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: false,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés, clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(_sousRaceId = null) {
  return { ...HUMAIN.bonusStats };
}

/** Traits cumulés, enrichis de leur identifiant et de leur origine. */
export function traitsComplets(_sousRaceId = null) {
  return Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
}

/** Liste des sous-races disponibles : [] (aucune au SRD 5.1). */
export function sousRacesDisponibles() {
  return [];
}

export default HUMAIN;