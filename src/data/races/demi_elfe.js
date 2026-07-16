// ============================================================================
//  DEMI-ELFE — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
//
//  Le Demi-elfe est la seule race à `bonusLibres` : +2 CHA fixe, puis +1 à deux
//  caractéristiques différentes au choix (hors Charisme). ESPECES dans
//  CharacterCreator.jsx porte déjà `bonusLibres: 2` pour cette race.
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (Demi-elfe)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Grâce à votre sang elfique, vous bénéficiez d'une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — uniquement en nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  ascendance_feerique: {
    nom: "Ascendance féerique",
    type: "passif",
    description:
      "Vous avez l'avantage aux jets de sauvegarde contre l'état charmé, et la magie ne peut pas vous endormir.",
    effet: {
      type: "ascendance_feerique",
      avantageSauvegarde: ["charme"],
      immunite: ["sommeil_magique"],
    },
  },
  polyvalence: {
    nom: "Polyvalence",
    type: "choix",
    description: "Vous maîtrisez deux compétences de votre choix.",
    effet: { type: "competences_additionnelles", nombre: 2, parmi: "toutes" },
  },
  langue_supplementaire: {
    nom: "Langue supplémentaire",
    type: "choix",
    description:
      "Vous parlez, lisez et écrivez le commun, l'elfique et une langue supplémentaire de votre choix.",
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
export const DEMI_ELFE = {
  id: "demi-elfe", // aligné sur l'id déjà utilisé dans ESPECES (CharacterCreator.jsx)
  nom: "Demi-elfe",
  source: "SRD 5.1 FR",
  bonusStats: { CHA: 2 },
  bonusLibres: 2,
  // Le +1 libre ne peut pas être placé en Charisme, et pas deux fois
  // sur la même caractéristique.
  bonusLibresContraintes: { exclut: ["CHA"], maxParCaracteristique: 1 },
  taille: { categorie: "M", minCm: 150, maxCm: 190 },
  vitesse: 9,
  ageMaturite: 20,
  ageMax: 180,
  langues: ["commun", "elfique"],
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: false,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/**
 * Bonus de caractéristiques cumulés, clés FOR/DEX/CON/INT/SAG/CHA.
 * `bonusLibresChoisis` est un tableau de clés (ex. ["DEX", "CON"]) ;
 * les entrées invalides (Charisme, doublons, surplus) sont ignorées.
 */
export function bonusStatsComplets(_sousRaceId = null, bonusLibresChoisis = []) {
  const out = { ...DEMI_ELFE.bonusStats };
  const { exclut, maxParCaracteristique } = DEMI_ELFE.bonusLibresContraintes;
  const vus = new Set();
  let restants = DEMI_ELFE.bonusLibres;
  for (const cle of bonusLibresChoisis) {
    if (restants <= 0) break;
    if (exclut.includes(cle)) continue;
    if (maxParCaracteristique === 1 && vus.has(cle)) continue;
    vus.add(cle);
    out[cle] = (out[cle] ?? 0) + 1;
    restants -= 1;
  }
  return out;
}

/** Caractéristiques éligibles au +1 libre. */
export function caracteristiquesLibresDisponibles() {
  return ["FOR", "DEX", "CON", "INT", "SAG", "CHA"].filter(
    (c) => !DEMI_ELFE.bonusLibresContraintes.exclut.includes(c)
  );
}

/** Traits cumulés, enrichis de leur identifiant et de leur origine. */
export function traitsComplets(_sousRaceId = null) {
  return Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
}

/** Liste des sous-races disponibles : [] (aucune au SRD 5.1). */
export function sousRacesDisponibles() {
  return [];
}

export default DEMI_ELFE;