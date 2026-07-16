// ============================================================================
//  RÔDEUR — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : bonus de dégâts du Tueur
//  d'ennemis jurés, DD de camouflage…). Le MJ narre et déclenche ; les jets
//  passent par le service de dés.
//
//  Emplacements de sorts : NON dupliqués ici. Le Rôdeur est un demi-lanceur
//  → voir EMPLACEMENTS_DEMI / TYPE_LANCEUR dans src/data/ressources.js.
//  Styles de combat : NON dupliqués ici. Le Rôdeur utilise un sous-ensemble
//  de STYLES_COMBAT défini dans src/data/classes/guerrier.js (donnée pure).
// ============================================================================

import { STYLES_COMBAT } from "./guerrier.js";

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  STYLES DE COMBAT — sous-ensemble accessible au Rôdeur (niveau 2)
//  Source des définitions : STYLES_COMBAT (guerrier.js).
// ============================================================================
export const STYLES_COMBAT_RODEUR_IDS = ["tir", "defense", "duel", "combat_a_deux_armes"];

export const STYLES_COMBAT_RODEUR = Object.fromEntries(
  STYLES_COMBAT_RODEUR_IDS.map((id) => [id, STYLES_COMBAT[id]])
);

// ============================================================================
//  ENNEMIS JURÉS ET TERRAINS DE PRÉDILECTION
// ============================================================================
export const ENNEMIS_JURES = [
  "aberration", "bete", "celeste", "artificiel", "dragon", "elementaire", "fee",
  "fielon", "geant", "monstruosite", "vase", "plante", "mort_vivant",
  // ou deux races d'humanoïdes (ex. gnolls et orcs)
  "deux_races_d_humanoides",
];

export const TERRAINS_PREDILECTION = [
  "arctique", "cote", "desert", "foret", "prairie", "marais", "montagne", "outreterre",
];

// ============================================================================
//  SOUS-CLASSES (Archétypes de rôdeur). SRD 5.1 → uniquement Chasseur.
//  Chaque palier est un CHOIX entre plusieurs options.
// ============================================================================
export const SOUS_CLASSES = {
  chasseur: {
    id: "chasseur",
    nom: "Chasseur",
    niveauChoix: 3,
    capacites: {
      proie_du_chasseur: {
        nom: "Proie du chasseur",
        niveau: 3,
        type: "choix",
        description: "Vous choisissez l'une des options suivantes.",
        options: {
          tueur_de_colosses: {
            nom: "Tueur de colosses",
            description:
              "Une fois par tour, quand vous touchez une créature dont les points de vie ne sont pas au maximum avec une attaque d'arme, elle subit 1d8 dégâts supplémentaires.",
            effet: { type: "degats_bonus_arme", des: "1d8", condition: "cible_blessee", frequence: "une_fois_par_tour" },
          },
          tueur_de_geants: {
            nom: "Tueur de géants",
            description:
              "Quand une créature de taille G ou supérieure située à 1,50 m ou moins vous touche ou vous rate avec une attaque, vous pouvez utiliser votre réaction pour l'attaquer immédiatement après son attaque, à condition de la voir. Si vous la touchez, elle subit 2d8 dégâts supplémentaires. Une fois par tour.",
            effet: { type: "attaque_reaction", cible: "taille_G_ou_plus", degatsBonus: "2d8", frequence: "une_fois_par_tour" },
          },
          tueur_de_horde: {
            nom: "Tueur de horde",
            description:
              "Une fois à chacun de vos tours, quand vous effectuez une attaque d'arme, vous pouvez effectuer une seconde attaque contre une créature différente située à 1,50 m ou moins de la cible initiale et à portée de votre arme.",
            effet: { type: "attaque_supplementaire_conditionnelle", condition: "seconde_cible_adjacente", frequence: "une_fois_par_tour" },
          },
        },
      },
      tactique_de_defense: {
        nom: "Tactique de défense",
        niveau: 7,
        type: "choix",
        description: "Vous choisissez l'une des options suivantes.",
        options: {
          echapper_a_la_horde: {
            nom: "Échapper à la horde",
            description: "Les attaques d'opportunité effectuées contre vous subissent un désavantage.",
            effet: { type: "desavantage_contre_soi", cible: "attaque_d_opportunite" },
          },
          defense_multiattaque: {
            nom: "Défense multiattaque",
            description:
              "Quand une créature vous touche avec une attaque, vous bénéficiez d'un bonus de +4 à votre CA contre toutes les autres attaques de cette créature durant le même tour.",
            effet: { type: "bonus_ca_conditionnel", valeur: 4, condition: "apres_premiere_attaque_touchee" },
          },
          volonte_d_acier: {
            nom: "Volonté d'acier",
            description: "Vous avez l'avantage aux jets de sauvegarde contre l'état effrayé.",
            effet: { type: "avantage_sauvegarde", contre: ["effroi"] },
          },
        },
      },
      attaques_multiples: {
        nom: "Attaques multiples",
        niveau: 11,
        type: "choix",
        description: "Vous choisissez l'une des options suivantes.",
        options: {
          salve: {
            nom: "Salve",
            description:
              "Par une action, vous effectuez une attaque à distance contre toutes les créatures de votre choix dans un rayon de 3 m autour d'un point situé à portée de votre arme. Vous devez disposer de munitions pour chaque cible et effectuez un jet d'attaque distinct par créature.",
            effet: { type: "attaque_de_zone_a_distance", rayon: 3 },
          },
          attaque_tourbillonnante: {
            nom: "Attaque tourbillonnante",
            description:
              "Par une action, vous effectuez une attaque de mêlée contre toutes les créatures de votre choix situées à 1,50 m ou moins de vous, avec un jet d'attaque distinct par créature.",
            effet: { type: "attaque_de_zone_melee", portee: 1.5 },
          },
        },
      },
      tactique_de_superiorite: {
        nom: "Tactique de supériorité",
        niveau: 15,
        type: "choix",
        description: "Vous choisissez l'une des options suivantes.",
        options: {
          evasion: {
            nom: "Évasion",
            description:
              "Quand vous êtes soumis à un effet vous autorisant un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, vous n'en subissez aucun en cas de réussite, et seulement la moitié en cas d'échec.",
            effet: { type: "evasion", sauvegarde: "dexterite" },
          },
          resister_a_la_maree: {
            nom: "Résister à la marée",
            description:
              "Quand une créature hostile située à 1,50 m ou moins vous rate avec une attaque de mêlée, vous pouvez utiliser votre réaction pour la forcer à répéter la même attaque contre une autre créature (autre que vous) de votre choix.",
            effet: { type: "redirection_attaque", declencheur: "attaque_melee_ratee" },
          },
          esquive_instinctive: {
            nom: "Esquive instinctive",
            description:
              "Quand un assaillant que vous pouvez voir vous touche avec une attaque, vous pouvez utiliser votre réaction pour réduire de moitié les dégâts subis.",
            effet: { type: "reduction_degats", facteur: 0.5, condition: "assaillant_visible" },
          },
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Rôdeur)
// ============================================================================
export const CAPACITES = {
  ennemi_jure: {
    nom: "Ennemi juré",
    niveau: 1,
    type: "choix",
    description:
      "Vous choisissez un type de créature comme ennemi juré, ou deux races d'humanoïdes. Vous avez l'avantage aux tests de Sagesse (Survie) pour pister vos ennemis jurés et aux tests d'Intelligence pour vous rappeler des informations à leur sujet. Vous apprenez également une langue parlée par vos proies. Vous choisissez un ennemi juré supplémentaire (et une langue) aux niveaux 6 et 14.",
    effet: {
      type: "ennemi_jure",
      parmi: ENNEMIS_JURES,
      paliers: [{ niveau: 1, nombre: 1 }, { niveau: 6, nombre: 1 }, { niveau: 14, nombre: 1 }],
      avantage: { competences: ["survie"], tests: ["intelligence"] },
    },
  },
  explorateur_ne: {
    nom: "Explorateur né",
    niveau: 1,
    type: "choix",
    description:
      "Vous choisissez un type de terrain de prédilection. Votre bonus de maîtrise est doublé pour les tests d'Intelligence et de Sagesse liés à ce terrain que vous effectuez avec une compétence maîtrisée. En voyage dans ce terrain : le terrain difficile ne ralentit pas votre groupe, vous ne pouvez pas vous perdre sauf par magie, vous restez alerte au danger même en vous consacrant à une autre activité, vous vous déplacez furtivement seul à vitesse normale, vous trouvez deux fois plus de nourriture en cherchant, et vous notez le nombre exact et la nature des créatures en pistant. Vous choisissez un terrain supplémentaire aux niveaux 6 et 10.",
    effet: {
      type: "explorateur_ne",
      parmi: TERRAINS_PREDILECTION,
      paliers: [{ niveau: 1, nombre: 1 }, { niveau: 6, nombre: 1 }, { niveau: 10, nombre: 1 }],
      doubleMaitrise: { caracteristiques: ["intelligence", "sagesse"], condition: "terrain_de_predilection" },
    },
  },
  style_combat: {
    nom: "Style de combat",
    niveau: 2,
    type: "choix",
    description:
      "Vous adoptez un style de combat parmi la liste accessible au Rôdeur (Tir, Défense, Duel, Combat à deux armes).",
    effet: { type: "choix_style_combat", parmi: STYLES_COMBAT_RODEUR_IDS },
  },
  incantation: {
    nom: "Incantation",
    niveau: 2,
    type: "passif",
    description:
      "Vous apprenez à canaliser la magie de la nature. Vous lancez des sorts de rôdeur en utilisant la Sagesse. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Sagesse ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Sagesse. Vous connaissez un nombre limité de sorts (voir progression) ; à chaque montée de niveau, vous pouvez remplacer un sort connu par un autre de la liste de rôdeur. Le Rôdeur ne connaît pas de sorts mineurs et n'utilise pas de focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "sagesse",
      typeLanceur: "demi", // → EMPLACEMENTS_DEMI dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_sagesse",
      attaqueFormule: "bonus_maitrise + mod_sagesse",
      focaliseur: null, // sacoche à composantes
      rituels: false,
      preparation: "sorts_connus",
      sortsMineurs: false,
    },
  },
  conscience_primitive: {
    nom: "Conscience primitive",
    niveau: 3,
    type: "action",
    description:
      "Par une action, vous pouvez dépenser un emplacement de sorts pour détecter la présence de certains types de créatures — aberrations, célestes, dragons, élémentaires, fées, fiélons, morts-vivants — dans un rayon de 1,5 km (ou 10 km en terrain de prédilection). Vous n'apprenez ni leur nombre, ni leur emplacement, ni leur nature exacte.",
    effet: {
      type: "detection",
      coutEmplacement: 1,
      rayon: 1500,
      rayonTerrainPredilection: 10000,
      cibles: ["aberration", "celeste", "dragon", "elementaire", "fee", "fielon", "mort_vivant"],
    },
  },
  archetype_rodeur: {
    nom: "Archétype de rôdeur",
    niveau: 3,
    type: "choix",
    description: "Vous choisissez l'archétype qui reflète votre approche de la traque.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  attaque_supplementaire: {
    nom: "Attaque supplémentaire",
    niveau: 5,
    type: "passif",
    description:
      "Quand vous entreprenez l'action Attaquer, vous pouvez attaquer deux fois au lieu d'une.",
    // Le nombre total d'attaques est porté par progression[].attaques
    effet: { type: "attaques_multiples" },
  },
  deplacement_facilite: {
    nom: "Déplacement facilité",
    niveau: 8,
    type: "passif",
    description:
      "Vous traversez sans coût de déplacement supplémentaire les terrains difficiles non magiques. Vous traversez également sans encombre ni dégâts la végétation magiquement créée ou manipulée qui entraverait votre progression.",
    effet: { type: "ignore_terrain_difficile", inclutVegetationMagique: true },
  },
  camouflage_naturel: {
    nom: "Camouflage naturel",
    niveau: 10,
    type: "special",
    description:
      "Vous pouvez passer une minute à vous camoufler : vous devez avoir accès à de la boue, de la terre, des plantes, de la suie ou d'autres matériaux naturels. Une fois camouflé, vous bénéficiez d'un bonus de +10 aux tests de Dextérité (Discrétion) tant que vous restez immobile et silencieux. Le camouflage se dissipe dès que vous bougez ou entreprenez une action.",
    effet: { type: "bonus_competence", competence: "discretion", valeur: 10, condition: "immobile_et_silencieux" },
  },
  disparition: {
    nom: "Disparition",
    niveau: 14,
    type: "passif",
    description:
      "Vous pouvez entreprendre l'action Se cacher par une action bonus. De plus, on ne peut plus vous pister par des moyens non magiques, à moins que vous ne laissiez volontairement des traces.",
    effet: { type: "action_bonus_supplementaire", actions: ["se_cacher"], impistable: "non_magique" },
  },
  sens_sauvages: {
    nom: "Sens sauvages",
    niveau: 18,
    type: "passif",
    description:
      "Vous percevez l'emplacement de toute créature invisible située à 9 m ou moins de vous, à condition qu'elle ne soit pas cachée et que vous ne soyez ni aveuglé ni assourdi. Vous n'avez pas de désavantage aux jets d'attaque contre des créatures que vous ne voyez pas.",
    effet: { type: "perception_aveugle", rayon: 9, annuleDesavantageAttaque: true },
  },
  tueur_d_ennemis_jures: {
    nom: "Tueur d'ennemis jurés",
    niveau: 20,
    type: "passif",
    ressource: { max: 1, recharge: "par_tour" },
    description:
      "Une fois à chacun de vos tours, vous pouvez ajouter votre modificateur de Sagesse au jet d'attaque ou au jet de dégâts d'une attaque effectuée contre l'un de vos ennemis jurés.",
    effet: {
      type: "bonus_attaque_ou_degats",
      formule: "mod_sagesse",
      cible: "ennemi_jure",
      frequence: "une_fois_par_tour",
    },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques    : nombre d'attaques via l'action Attaquer
//    sortsConnus : sorts de rôdeur connus (0 au niveau 1 — pas de sorts mineurs)
//    capacites   : identifiants acquis à ce niveau (tronc commun)
//    asi         : Amélioration de caractéristiques (ou don) disponible
//    archetype   : true → une capacité de la sous-classe est acquise à ce niveau
//    notes       : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_DEMI (src/data/ressources.js)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsConnus: 0,  asi: false, archetype: false, capacites: ["ennemi_jure", "explorateur_ne"], notes: ["Ennemi juré : 1", "Terrain de prédilection : 1"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsConnus: 2,  asi: false, archetype: false, capacites: ["style_combat", "incantation"], notes: ["Sorts connus : 2"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsConnus: 3,  asi: false, archetype: true,  capacites: ["conscience_primitive", "archetype_rodeur"], notes: ["Sorts connus : 3"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsConnus: 3,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 2, sortsConnus: 4,  asi: false, archetype: false, capacites: ["attaque_supplementaire"], notes: ["Sorts connus : 4"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 2, sortsConnus: 4,  asi: false, archetype: false, capacites: [], notes: ["Ennemi juré : +1", "Terrain de prédilection : +1"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 2, sortsConnus: 5,  asi: false, archetype: true,  capacites: [], notes: ["Sorts connus : 5"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 2, sortsConnus: 5,  asi: true,  archetype: false, capacites: ["deplacement_facilite"], notes: [] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 2, sortsConnus: 6,  asi: false, archetype: false, capacites: [], notes: ["Sorts connus : 6"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 2, sortsConnus: 6,  asi: false, archetype: false, capacites: ["camouflage_naturel"], notes: ["Terrain de prédilection : +1"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 2, sortsConnus: 7,  asi: false, archetype: true,  capacites: [], notes: ["Sorts connus : 7"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 2, sortsConnus: 7,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 2, sortsConnus: 8,  asi: false, archetype: false, capacites: [], notes: ["Sorts connus : 8"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 2, sortsConnus: 8,  asi: false, archetype: false, capacites: ["disparition"], notes: ["Ennemi juré : +1"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 2, sortsConnus: 9,  asi: false, archetype: true,  capacites: [], notes: ["Sorts connus : 9"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 2, sortsConnus: 9,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 2, sortsConnus: 10, asi: false, archetype: false, capacites: [], notes: ["Sorts connus : 10"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 2, sortsConnus: 10, asi: false, archetype: false, capacites: ["sens_sauvages"], notes: [] },
  { niveau: 19, bonusMaitrise: 6, attaques: 2, sortsConnus: 11, asi: true,  archetype: false, capacites: [], notes: ["Sorts connus : 11"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 2, sortsConnus: 11, asi: false, archetype: false, capacites: ["tueur_d_ennemis_jures"], notes: [] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const RODEUR = {
  id: "rodeur",
  nom: "Rôdeur",
  source: "SRD 5.1 FR",
  deVie: 10, // d10
  pvNiveau1: 10, // + modificateur de Constitution
  caracteristiquesPrincipales: ["dexterite", "sagesse"],
  sauvegardes: ["force", "dexterite"],
  maitrises: {
    armures: ["legeres", "intermediaires", "boucliers"],
    armes: ["simples", "de_guerre"],
    outils: [],
  },
  competences: {
    nombre: 3,
    liste: ["dressage", "athletisme", "perspicacite", "investigation", "nature", "perception", "discretion", "survie"],
  },
  incantation: {
    caracteristique: "sagesse",
    typeLanceur: "demi",
    focaliseur: null,
    rituels: false,
    niveauMin: 2,
  },
  styleCombat: STYLES_COMBAT_RODEUR,
  ennemisJures: ENNEMIS_JURES,
  terrainsPredilection: TERRAINS_PREDILECTION,
  capacites: CAPACITES,
  sousClasses: SOUS_CLASSES,
  progression: PROGRESSION,
};

// ============================================================================
//  HELPERS PURS (dérivés de la donnée statique — aucun état runtime)
// ============================================================================

const ligne = (niveau) => PROGRESSION[Math.max(1, Math.min(20, niveau)) - 1];

/** Bonus de maîtrise pour un niveau donné (1-20). */
export function bonusMaitrise(niveau) {
  return ligne(niveau).bonusMaitrise;
}

/** Nombre d'attaques via l'action Attaquer à un niveau donné. */
export function nombreAttaques(niveau) {
  return ligne(niveau).attaques;
}

/** Nombre de sorts connus à un niveau donné (0 au niveau 1). */
export function sortsConnus(niveau) {
  return ligne(niveau).sortsConnus;
}

/** Nombre total d'ennemis jurés choisis à un niveau donné. */
export function nombreEnnemisJures(niveau) {
  return CAPACITES.ennemi_jure.effet.paliers
    .filter((p) => niveau >= p.niveau)
    .reduce((total, p) => total + p.nombre, 0);
}

/** Nombre total de terrains de prédilection choisis à un niveau donné. */
export function nombreTerrainsPredilection(niveau) {
  return CAPACITES.explorateur_ne.effet.paliers
    .filter((p) => niveau >= p.niveau)
    .reduce((total, p) => total + p.nombre, 0);
}

/**
 * Liste des capacités de tronc commun acquises jusqu'à un niveau (inclus).
 * Retourne les définitions enrichies de leur niveau d'acquisition.
 */
export function capacitesTroncCommun(niveau) {
  const out = [];
  for (const l of PROGRESSION) {
    if (l.niveau > niveau) break;
    for (const id of l.capacites) {
      if (CAPACITES[id]) out.push({ id, ...CAPACITES[id] });
    }
  }
  return out;
}

/** Capacités de sous-classe acquises jusqu'à un niveau (inclus). */
export function capacitesSousClasse(sousClasseId, niveau) {
  const sc = SOUS_CLASSES[sousClasseId];
  if (!sc) return [];
  return Object.entries(sc.capacites)
    .filter(([, cap]) => cap.niveau <= niveau)
    .map(([id, cap]) => ({ id, ...cap }));
}

/**
 * Options disponibles pour un palier de choix de l'archétype
 * (Proie du chasseur, Tactique de défense, Attaques multiples, Tactique de supériorité).
 */
export function optionsArchetype(sousClasseId, capaciteId) {
  const cap = SOUS_CLASSES[sousClasseId]?.capacites?.[capaciteId];
  if (!cap?.options) return [];
  return Object.entries(cap.options).map(([id, opt]) => ({ id, ...opt }));
}

/**
 * Utilisations max d'une ressource à un niveau donné,
 * en tenant compte des paliers d'amélioration (`ressource.ameliorations`).
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (niveau < cap.niveau) return 0;
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau && amel.max != null) max = amel.max;
  }
  return max;
}

export default RODEUR;