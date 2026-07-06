// ============================================================================
//  GUERRIER — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : CA, attaque, dégâts,
//  critique…). Le MJ narre et déclenche ; les jets passent par le service de
//  dés. Les capacités « narratives » n'ont pas d'`effet` chiffré.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  STYLES DE COMBAT (choisis au niveau 1 ; Champion en octroie un 2e au niv. 10)
// ============================================================================
export const STYLES_COMBAT = {
  tir: {
    id: "tir",
    nom: "Tir",
    description:
      "Vous gagnez un bonus de +2 aux jets d'attaque avec les armes à distance.",
    effet: { type: "bonus_attaque", valeur: 2, condition: "arme_distance" },
  },
  defense: {
    id: "defense",
    nom: "Défense",
    description: "Tant que vous portez une armure, vous gagnez +1 à la CA.",
    effet: { type: "bonus_ca", valeur: 1, condition: "port_armure" },
  },
  duel: {
    id: "duel",
    nom: "Duel",
    description:
      "Quand vous maniez une arme de mêlée à une main sans autre arme, vous gagnez +2 aux dégâts avec cette arme.",
    effet: { type: "bonus_degats", valeur: 2, condition: "arme_melee_une_main_seule" },
  },
  armes_a_deux_mains: {
    id: "armes_a_deux_mains",
    nom: "Armes à deux mains",
    description:
      "Avec une arme de mêlée à deux mains ou polyvalente maniée à deux mains, vous pouvez relancer tout dé de dégâts qui donne 1 ou 2 (nouveau résultat conservé).",
    effet: {
      type: "relance_des_degats",
      seuil: 2,
      condition: "arme_deux_mains_ou_polyvalente",
    },
  },
  protection: {
    id: "protection",
    nom: "Protection",
    description:
      "Quand une créature que vous voyez attaque une cible à 1,50 m de vous (autre que vous), vous pouvez utiliser votre réaction pour imposer le désavantage à ce jet d'attaque. Nécessite un bouclier.",
    effet: { type: "reaction_desavantage_attaque", condition: "bouclier" },
  },
  combat_a_deux_armes: {
    id: "combat_a_deux_armes",
    nom: "Combat à deux armes",
    description:
      "Quand vous combattez à deux armes, vous ajoutez votre modificateur de caractéristique aux dégâts de la seconde attaque.",
    effet: { type: "mod_degats_seconde_attaque", condition: "combat_deux_armes" },
  },
};

// ============================================================================
//  SOUS-CLASSES (Archétypes martiaux). SRD 5.1 → uniquement Champion.
//  Chaque capacité indique le niveau où elle est acquise.
// ============================================================================
export const SOUS_CLASSES = {
  champion: {
    id: "champion",
    nom: "Champion",
    niveauChoix: 3,
    capacites: {
      critique_ameliore: {
        nom: "Critique amélioré",
        niveau: 3,
        type: "passif",
        description: "Vos attaques d'arme infligent un coup critique sur un 19 ou un 20.",
        effet: { type: "seuil_critique", valeur: 19 },
      },
      athlete_remarquable: {
        nom: "Athlète remarquable",
        niveau: 7,
        type: "passif",
        description:
          "Ajoutez la moitié de votre bonus de maîtrise (arrondi au supérieur) à tout test de Force, Dextérité ou Constitution ne bénéficiant pas déjà de votre maîtrise. Votre saut en longueur avec élan gagne un nombre de mètres égal à votre modificateur de Force.",
        effet: { type: "demi_maitrise", caracteristiques: ["force", "dexterite", "constitution"] },
      },
      style_combat_supplementaire: {
        nom: "Style de combat supplémentaire",
        niveau: 10,
        type: "passif",
        description: "Vous choisissez un second style de combat.",
        effet: { type: "style_combat_additionnel" },
      },
      critique_superieur: {
        nom: "Critique supérieur",
        niveau: 15,
        type: "passif",
        description: "Vos attaques d'arme infligent un coup critique sur un 18, 19 ou 20.",
        effet: { type: "seuil_critique", valeur: 18 },
      },
      survivant: {
        nom: "Survivant",
        niveau: 18,
        type: "passif",
        description:
          "Au début de chacun de vos tours, si vos PV sont au maximum à la moitié ou moins (sans être à 0), vous récupérez 5 + votre modificateur de Constitution PV.",
        effet: {
          type: "regen_debut_tour",
          formule: "5 + mod_constitution",
          condition: "pv_inferieur_ou_egal_moitie",
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Guerrier)
// ============================================================================
export const CAPACITES = {
  style_combat: {
    nom: "Style de combat",
    niveau: 1,
    type: "choix",
    description:
      "Vous adoptez un style de combat parmi la liste (Tir, Défense, Duel, Armes à deux mains, Protection, Combat à deux armes).",
    effet: { type: "choix_style_combat", parmi: Object.keys(STYLES_COMBAT) },
  },
  second_souffle: {
    nom: "Second souffle",
    niveau: 1,
    type: "action_bonus",
    ressource: { max: 1, recharge: RECHARGE.COURT },
    description:
      "Par une action bonus, vous récupérez 1d10 + votre niveau de guerrier points de vie. Une fois par repos court ou long.",
    effet: { type: "soin", formule: "1d10 + niveau_guerrier" },
  },
  fougue: {
    nom: "Fougue",
    niveau: 2,
    type: "special",
    ressource: {
      max: 1,
      recharge: RECHARGE.COURT,
      ameliorations: [{ niveau: 17, max: 2 }],
    },
    description:
      "À votre tour, vous pouvez effectuer une action supplémentaire (en plus de votre action normale et d'une éventuelle action bonus). Une utilisation par repos court ou long (deux à partir du niveau 17).",
    effet: { type: "action_supplementaire" },
  },
  archetype_martial: {
    nom: "Archétype martial",
    niveau: 3,
    type: "choix",
    description: "Vous choisissez un archétype martial qui façonne votre approche du combat.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  attaque_supplementaire: {
    nom: "Attaque supplémentaire",
    niveau: 5,
    type: "passif",
    description:
      "Quand vous entreprenez l'action Attaquer, vous pouvez attaquer deux fois au lieu d'une (trois fois au niveau 11, quatre fois au niveau 20).",
    // Le nombre total d'attaques est porté par progression[].attaques
    effet: { type: "attaques_multiples" },
  },
  indomptable: {
    nom: "Indomptable",
    niveau: 9,
    type: "special",
    ressource: {
      max: 1,
      recharge: RECHARGE.LONG,
      ameliorations: [
        { niveau: 13, max: 2 },
        { niveau: 17, max: 3 },
      ],
    },
    description:
      "Quand vous ratez un jet de sauvegarde, vous pouvez le relancer et devez utiliser le nouveau résultat. Utilisations par repos long : 1 (niv. 9), 2 (niv. 13), 3 (niv. 17).",
    effet: { type: "relance_sauvegarde_ratee" },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques  : nombre d'attaques via l'action Attaquer
//    capacites : identifiants acquis à ce niveau (tronc commun)
//    asi       : Amélioration de caractéristiques (ou don) disponible
//    archetype : true → une capacité de la sous-classe est acquise à ce niveau
//    notes     : améliorations de ressources signalées à la montée de niveau
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["style_combat", "second_souffle"], notes: [] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["fougue"], notes: [] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: true,  capacites: ["archetype_martial"], notes: [] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: false, capacites: ["attaque_supplementaire"], notes: [] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 2, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 2, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 2, asi: false, archetype: false, capacites: ["indomptable"], notes: [] },
  { niveau: 10, bonusMaitrise: 4, attaques: 2, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 11, bonusMaitrise: 4, attaques: 3, asi: false, archetype: false, capacites: [], notes: ["Attaque supplémentaire : 3 attaques"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 3, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 3, asi: false, archetype: false, capacites: [], notes: ["Indomptable : 2 utilisations"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 3, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 15, bonusMaitrise: 5, attaques: 3, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 16, bonusMaitrise: 5, attaques: 3, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 3, asi: false, archetype: false, capacites: [], notes: ["Fougue : 2 utilisations", "Indomptable : 3 utilisations"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 3, asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 19, bonusMaitrise: 6, attaques: 3, asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 20, bonusMaitrise: 6, attaques: 4, asi: false, archetype: false, capacites: [], notes: ["Attaque supplémentaire : 4 attaques"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const GUERRIER = {
  id: "guerrier",
  nom: "Guerrier",
  source: "SRD 5.1 FR",
  deVie: 10, // d10
  pvNiveau1: 10, // + modificateur de Constitution
  caracteristiquesPrincipales: ["force", "dexterite"],
  sauvegardes: ["force", "constitution"],
  maitrises: {
    armures: ["legeres", "intermediaires", "lourdes", "boucliers"],
    armes: ["simples", "de_guerre"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: [
      "acrobaties",
      "dressage",
      "athletisme",
      "histoire",
      "perspicacite",
      "intimidation",
      "perception",
      "survie",
    ],
  },
  styleCombat: STYLES_COMBAT,
  capacites: CAPACITES,
  sousClasses: SOUS_CLASSES,
  progression: PROGRESSION,
};

// ============================================================================
//  HELPERS PURS (dérivés de la donnée statique — aucun état runtime)
// ============================================================================

/** Bonus de maîtrise pour un niveau donné (1-20). */
export function bonusMaitrise(niveau) {
  return PROGRESSION[Math.max(1, Math.min(20, niveau)) - 1].bonusMaitrise;
}

/** Nombre d'attaques via l'action Attaquer à un niveau donné. */
export function nombreAttaques(niveau) {
  return PROGRESSION[Math.max(1, Math.min(20, niveau)) - 1].attaques;
}

/**
 * Liste des capacités de tronc commun acquises jusqu'à un niveau (inclus).
 * Retourne les définitions enrichies de leur niveau d'acquisition.
 */
export function capacitesTroncCommun(niveau) {
  const out = [];
  for (const ligne of PROGRESSION) {
    if (ligne.niveau > niveau) break;
    for (const id of ligne.capacites) {
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
 * Utilisations max d'une ressource à un niveau donné, en tenant compte
 * des paliers d'amélioration (`ressource.ameliorations`).
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  let max = cap.ressource.max;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default GUERRIER;