// ============================================================================
//  BARBARE — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : CA sans armure, bonus de
//  dégâts de rage, dés de critique brutal…). Le MJ narre et déclenche ; les
//  jets passent par le service de dés. Les capacités « narratives » n'ont pas
//  d'`effet` chiffré.
//
//  Le Barbare n'est pas lanceur de sorts.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// Nombre de rages « illimité » au niveau 20. Valeur alignée sur
// RESSOURCES_CLASSE.Barbare (src/data/ressources.js), qui renvoie 99.
export const RAGES_ILLIMITEES = 99;

// ============================================================================
//  SOUS-CLASSES (Voies primitives). SRD 5.1 → uniquement Voie du Berserker.
//  Chaque capacité indique le niveau où elle est acquise.
// ============================================================================
export const SOUS_CLASSES = {
  berserker: {
    id: "berserker",
    nom: "Voie du Berserker",
    niveauChoix: 3,
    capacites: {
      frenesie: {
        nom: "Frénésie",
        niveau: 3,
        type: "special",
        description:
          "Vous pouvez entrer en frénésie quand vous entrez en rage. Pendant la durée de la rage, vous pouvez effectuer une attaque d'arme de mêlée par une action bonus à chacun de vos tours. Quand votre rage prend fin, vous subissez un niveau d'épuisement.",
        effet: {
          type: "attaque_bonus_melee",
          condition: "rage_active",
          cout: { epuisement: 1, quand: "fin_de_rage" },
        },
      },
      fureur_insensible: {
        nom: "Fureur insensible",
        niveau: 6,
        type: "passif",
        description:
          "Vous ne pouvez plus être charmé ni effrayé pendant votre rage. Si vous l'étiez déjà en entrant en rage, l'effet est suspendu pour la durée.",
        effet: { type: "immunite_conditionnelle", valeur: ["charme", "effroi"], condition: "rage_active" },
      },
      presence_menacante: {
        nom: "Présence menaçante",
        niveau: 10,
        type: "action",
        description:
          "Par une action, vous terrifiez une créature que vous voyez à 9 m ou moins : elle doit réussir un jet de sauvegarde de Sagesse (DD 8 + bonus de maîtrise + mod. de Charisme) ou être effrayée jusqu'à la fin de votre prochain tour. Vous pouvez prolonger l'effet tour après tour en utilisant votre action, jusqu'à ce que vous perdiez la cible de vue ou qu'elle sorte de portée.",
        effet: {
          type: "effroi_cible",
          rayon: 9,
          sauvegarde: "sagesse",
          ddFormule: "8 + bonus_maitrise + mod_charisme",
        },
      },
      represailles: {
        nom: "Représailles",
        niveau: 14,
        type: "reaction",
        description:
          "Quand vous subissez des dégâts d'une créature située à 1,50 m ou moins de vous, vous pouvez utiliser votre réaction pour effectuer une attaque d'arme de mêlée contre elle.",
        effet: { type: "attaque_reaction_melee", portee: 1.5 },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Barbare)
// ============================================================================
export const CAPACITES = {
  rage: {
    nom: "Rage",
    niveau: 1,
    type: "action_bonus",
    // Le nombre d'utilisations est porté par progression[].rages
    ressource: { formuleMax: "table_progression", recharge: RECHARGE.LONG },
    description:
      "Par une action bonus, vous entrez en rage pendant 1 minute. Tant que vous êtes en rage et que vous ne portez pas d'armure lourde : vous avez l'avantage aux tests et jets de sauvegarde de Force ; vous ajoutez un bonus aux dégâts de vos attaques d'arme de mêlée basées sur la Force ; vous bénéficiez de la résistance aux dégâts contondants, perforants et tranchants. Vous ne pouvez pas lancer ni vous concentrer sur un sort en rage. La rage prend fin prématurément si vous n'avez ni attaqué une créature hostile ni subi de dégâts depuis votre dernier tour, ou si vous y mettez fin par une action bonus.",
    effet: {
      type: "rage",
      duree: "1 minute",
      condition: "pas_armure_lourde",
      avantage: { tests: ["force"], sauvegardes: ["force"] },
      resistances: ["contondant", "perforant", "tranchant"],
      // bonusDegats → progression[].bonusRage
      bonusDegats: "table_progression",
      interdit: ["incantation", "concentration"],
    },
  },
  defense_sans_armure: {
    nom: "Défense sans armure",
    niveau: 1,
    type: "passif",
    description:
      "Tant que vous ne portez pas d'armure, votre CA est égale à 10 + votre modificateur de Dextérité + votre modificateur de Constitution. Vous pouvez utiliser un bouclier et conserver ce bénéfice.",
    effet: {
      type: "ca_sans_armure",
      formule: "10 + mod_dexterite + mod_constitution",
      condition: "sans_armure",
      bouclierAutorise: true,
    },
  },
  attaque_temeraire: {
    nom: "Attaque téméraire",
    niveau: 2,
    type: "special",
    description:
      "Au premier de vos jets d'attaque de votre tour, vous pouvez décider d'attaquer témérairement : vous avez l'avantage à toutes vos attaques d'arme de mêlée basées sur la Force ce tour-ci, mais les jets d'attaque contre vous ont l'avantage jusqu'à votre prochain tour.",
    effet: { type: "attaque_temeraire", avantageSoi: true, avantageContreSoi: true },
  },
  perception_du_danger: {
    nom: "Perception du danger",
    niveau: 2,
    type: "passif",
    description:
      "Vous avez l'avantage aux jets de sauvegarde de Dextérité contre les effets que vous pouvez voir (pièges, sorts…). Vous devez pour cela ne pas être aveuglé, assourdi ni incapable d'agir.",
    effet: { type: "avantage_sauvegarde", caracteristique: "dexterite", condition: "effet_visible" },
  },
  voie_primitive: {
    nom: "Voie primitive",
    niveau: 3,
    type: "choix",
    description: "Vous choisissez la voie primitive qui façonne la nature de votre rage.",
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
  deplacement_rapide: {
    nom: "Déplacement rapide",
    niveau: 5,
    type: "passif",
    description: "Votre vitesse augmente de 3 m tant que vous ne portez pas d'armure lourde.",
    effet: { type: "bonus_vitesse", valeur: 3, condition: "pas_armure_lourde" },
  },
  instinct_sauvage: {
    nom: "Instinct sauvage",
    niveau: 7,
    type: "passif",
    description:
      "Vous avez l'avantage aux jets d'initiative. De plus, si vous êtes surpris au début d'un combat et que vous n'êtes pas incapable d'agir, vous pouvez agir normalement à votre premier tour, à condition d'entrer en rage avant toute autre action.",
    effet: { type: "avantage_initiative", ignoreSurprise: { condition: "entrer_en_rage" } },
  },
  critique_brutal: {
    nom: "Critique brutal",
    niveau: 9,
    type: "passif",
    description:
      "Vous pouvez lancer un dé de dégâts d'arme supplémentaire quand vous déterminez les dégâts d'un coup critique effectué avec une attaque de mêlée. Ce nombre passe à deux dés au niveau 13 et à trois dés au niveau 17.",
    effet: {
      type: "des_critique_supplementaires",
      paliers: [{ niveau: 9, des: 1 }, { niveau: 13, des: 2 }, { niveau: 17, des: 3 }],
      condition: "attaque_melee",
    },
  },
  rage_implacable: {
    nom: "Rage implacable",
    niveau: 11,
    type: "passif",
    description:
      "Votre rage vous permet de résister à la mort : si vos points de vie tombent à 0 alors que vous êtes en rage et que vous ne mourez pas sur le coup, vous pouvez effectuer un jet de sauvegarde de Constitution DD 10. En cas de réussite, vous tombez à 1 PV à la place. Chaque utilisation supplémentaire entre deux repos longs augmente le DD de 5 ; le DD revient à 10 après un repos court ou long.",
    effet: {
      type: "survie_a_zero_pv",
      sauvegarde: "constitution",
      ddBase: 10,
      ddIncrement: 5,
      reinitialisation: RECHARGE.COURT,
      condition: "rage_active",
    },
  },
  rage_persistante: {
    nom: "Rage persistante",
    niveau: 15,
    type: "passif",
    description:
      "Votre rage est si intense qu'elle ne prend fin prématurément que si vous tombez inconscient ou si vous décidez d'y mettre fin.",
    effet: { type: "rage_persistante" },
  },
  puissance_indomptable: {
    nom: "Puissance indomptable",
    niveau: 18,
    type: "passif",
    description:
      "Si le total d'un test de Force que vous effectuez est inférieur à votre valeur de Force, vous pouvez utiliser cette valeur à la place du total.",
    effet: { type: "plancher_test", caracteristique: "force" },
  },
  champion_primitif: {
    nom: "Champion primitif",
    niveau: 20,
    type: "passif",
    description:
      "Vous incarnez la puissance des étendues sauvages : vos valeurs de Force et de Constitution augmentent de 4, et leur maximum passe à 24.",
    effet: {
      type: "bonus_caracteristique",
      caracteristiques: ["force", "constitution"],
      valeur: 4,
      nouveauMaximum: 24,
    },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques   : nombre d'attaques via l'action Attaquer
//    rages      : utilisations de Rage par repos long (99 = illimité au niv. 20)
//    bonusRage  : bonus aux dégâts pendant la rage
//    capacites  : identifiants acquis à ce niveau (tronc commun)
//    asi        : Amélioration de caractéristiques (ou don) disponible
//    archetype  : true → une capacité de la sous-classe est acquise à ce niveau
//    notes      : améliorations signalées à la montée de niveau
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, rages: 2, bonusRage: 2, asi: false, archetype: false, capacites: ["rage", "defense_sans_armure"], notes: ["Rage : 2 utilisations", "Dégâts de rage : +2"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, rages: 2, bonusRage: 2, asi: false, archetype: false, capacites: ["attaque_temeraire", "perception_du_danger"], notes: [] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, rages: 3, bonusRage: 2, asi: false, archetype: true,  capacites: ["voie_primitive"], notes: ["Rage : 3 utilisations"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, rages: 3, bonusRage: 2, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 2, rages: 3, bonusRage: 2, asi: false, archetype: false, capacites: ["attaque_supplementaire", "deplacement_rapide"], notes: [] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 2, rages: 4, bonusRage: 2, asi: false, archetype: true,  capacites: [], notes: ["Rage : 4 utilisations"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 2, rages: 4, bonusRage: 2, asi: false, archetype: false, capacites: ["instinct_sauvage"], notes: [] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 2, rages: 4, bonusRage: 2, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 2, rages: 4, bonusRage: 3, asi: false, archetype: false, capacites: ["critique_brutal"], notes: ["Dégâts de rage : +3", "Critique brutal : 1 dé"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 2, rages: 4, bonusRage: 3, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 11, bonusMaitrise: 4, attaques: 2, rages: 4, bonusRage: 3, asi: false, archetype: false, capacites: ["rage_implacable"], notes: [] },
  { niveau: 12, bonusMaitrise: 4, attaques: 2, rages: 5, bonusRage: 3, asi: true,  archetype: false, capacites: [], notes: ["Rage : 5 utilisations"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 2, rages: 5, bonusRage: 3, asi: false, archetype: false, capacites: [], notes: ["Critique brutal : 2 dés"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 2, rages: 5, bonusRage: 3, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 15, bonusMaitrise: 5, attaques: 2, rages: 5, bonusRage: 3, asi: false, archetype: false, capacites: ["rage_persistante"], notes: [] },
  { niveau: 16, bonusMaitrise: 5, attaques: 2, rages: 5, bonusRage: 4, asi: true,  archetype: false, capacites: [], notes: ["Dégâts de rage : +4"] },
  { niveau: 17, bonusMaitrise: 6, attaques: 2, rages: 6, bonusRage: 4, asi: false, archetype: false, capacites: [], notes: ["Rage : 6 utilisations", "Critique brutal : 3 dés"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 2, rages: 6, bonusRage: 4, asi: false, archetype: false, capacites: ["puissance_indomptable"], notes: [] },
  { niveau: 19, bonusMaitrise: 6, attaques: 2, rages: 6, bonusRage: 4, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 20, bonusMaitrise: 6, attaques: 2, rages: RAGES_ILLIMITEES, bonusRage: 4, asi: false, archetype: false, capacites: ["champion_primitif"], notes: ["Rage : illimitée"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const BARBARE = {
  id: "barbare",
  nom: "Barbare",
  source: "SRD 5.1 FR",
  deVie: 12, // d12
  pvNiveau1: 12, // + modificateur de Constitution
  caracteristiquesPrincipales: ["force"],
  sauvegardes: ["force", "constitution"],
  maitrises: {
    armures: ["legeres", "intermediaires", "boucliers"],
    armes: ["simples", "de_guerre"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["dressage", "athletisme", "intimidation", "nature", "perception", "survie"],
  },
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

/** Utilisations de Rage par repos long (RAGES_ILLIMITEES au niveau 20). */
export function usagesRage(niveau) {
  return ligne(niveau).rages;
}

/** Bonus aux dégâts pendant la rage à un niveau donné. */
export function bonusDegatsRage(niveau) {
  return ligne(niveau).bonusRage;
}

/** Dés de dégâts supplémentaires de Critique brutal (0 avant le niveau 9). */
export function desCritiqueBrutal(niveau) {
  let des = 0;
  for (const p of CAPACITES.critique_brutal.effet.paliers) {
    if (niveau >= p.niveau) des = p.des;
  }
  return des;
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
 * Utilisations max d'une ressource à un niveau donné.
 * Gère `ressource.max` (+ `ameliorations`) et `formuleMax: "table_progression"`
 * (Rage → progression[].rages).
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (niveau < cap.niveau) return 0;
  if (cap.ressource.formuleMax === "table_progression") return usagesRage(niveau);
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default BARBARE;