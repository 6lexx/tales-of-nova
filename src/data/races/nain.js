// ============================================================================
//  NAIN — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Même contrat que src/data/classes/*.js :
//    1. État perso   → savoir quels traits/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes
//    4. Fiche         → affichage
//
//  CONVENTIONS (arbitrées) :
//    - `bonusStats` utilise les clés FOR/DEX/CON/INT/SAG/CHA, comme ESPECES
//      dans CharacterCreator.jsx (c'est ce qui est déjà calculé et stocké).
//    - Les sous-races sont identifiées par `id` (snake_case), pas par libellé.
//      `SUB_RACES` dans CharacterCreator.jsx stocke aujourd'hui des libellés
//      ("Nain des collines") — voir la remarque de livraison.
//    - FIDÈLE AU SRD : le Nain de base est CON +2 uniquement. Le +2 FOR
//      appartient au Nain des montagnes, le +1 SAG au Nain des collines.
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (tronc commun Nain)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Habitué à la vie souterraine, vous avez une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — sans distinguer les couleurs dans le noir, uniquement des nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  resistance_naine: {
    nom: "Résistance naine",
    type: "passif",
    description:
      "Vous avez l'avantage aux jets de sauvegarde contre le poison et la résistance aux dégâts de poison.",
    effet: {
      type: "resistance",
      degats: ["poison"],
      avantageSauvegarde: ["poison"],
    },
  },
  entrainement_nain_au_combat: {
    nom: "Entraînement nain au combat",
    type: "passif",
    description:
      "Vous maîtrisez la hache d'armes, la hachette, le marteau léger et le marteau de guerre.",
    effet: {
      type: "maitrise_additionnelle",
      armes: ["hache_armes", "hachette", "marteau_leger", "marteau_guerre"],
    },
  },
  maitrise_des_outils: {
    nom: "Maîtrise des outils",
    type: "choix",
    description:
      "Vous maîtrisez les outils d'artisan de votre choix : outils de forgeron, matériel de brasseur ou outils de maçon.",
    effet: {
      type: "outils_additionnels",
      nombre: 1,
      parmi: ["outils_de_forgeron", "materiel_de_brasseur", "outils_de_macon"],
    },
  },
  connaissance_de_la_pierre: {
    nom: "Connaissance de la pierre",
    type: "passif",
    description:
      "Quand vous effectuez un test d'Intelligence (Histoire) lié à l'origine d'un travail de maçonnerie, vous êtes considéré comme maîtrisant la compétence Histoire et vous ajoutez le double de votre bonus de maîtrise au test, au lieu de votre bonus normal.",
    effet: {
      type: "double_maitrise",
      competence: "histoire",
      condition: "origine_travail_de_maconnerie",
      maitriseImplicite: true,
    },
  },
};

// ============================================================================
//  SOUS-RACES
// ============================================================================
export const SOUS_RACES = {
  nain_des_collines: {
    id: "nain_des_collines",
    nom: "Nain des collines",
    bonusStats: { SAG: 1 },
    traits: {
      robustesse_naine: {
        nom: "Robustesse naine",
        type: "passif",
        description:
          "Votre maximum de points de vie augmente de 1, et il augmente de 1 supplémentaire à chaque fois que vous gagnez un niveau.",
        effet: { type: "pv_max_bonus", formule: "niveau_total" },
      },
    },
  },
  nain_des_montagnes: {
    id: "nain_des_montagnes",
    nom: "Nain des montagnes",
    bonusStats: { FOR: 2 },
    traits: {
      entrainement_nain_a_l_armure: {
        nom: "Entraînement nain à l'armure",
        type: "passif",
        description: "Vous maîtrisez les armures légères et intermédiaires.",
        effet: { type: "maitrise_additionnelle", armures: ["legere", "intermediaire"] },
      },
    },
  },
};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const NAIN = {
  id: "nain",
  nom: "Nain",
  source: "SRD 5.1 FR",
  bonusStats: { CON: 2 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 120, maxCm: 150 },
  vitesse: 7.5,
  // La vitesse du Nain n'est pas réduite par le port d'une armure lourde.
  vitesseNonReduiteParArmureLourde: true,
  ageMaturite: 50,
  ageMax: 350,
  langues: ["commun", "nain"],
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
  const out = { ...NAIN.bonusStats };
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

export default NAIN;