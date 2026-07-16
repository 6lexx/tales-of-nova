// ============================================================================
//  PALADIN — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : dés de châtiment, réserve
//  de soins, bonus d'aura…). Le MJ narre et déclenche ; les jets passent par
//  le service de dés. Les capacités « narratives » n'ont pas d'`effet` chiffré.
//
//  Emplacements de sorts : NON dupliqués ici. Le Paladin est un demi-lanceur
//  → voir EMPLACEMENTS_DEMI / TYPE_LANCEUR dans src/data/ressources.js.
//  Styles de combat : NON dupliqués ici. Le Paladin utilise un sous-ensemble
//  de STYLES_COMBAT défini dans src/data/classes/guerrier.js (donnée pure).
// ============================================================================

import { STYLES_COMBAT } from "./guerrier.js";

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  STYLES DE COMBAT — sous-ensemble accessible au Paladin (niveau 2)
//  Source des définitions : STYLES_COMBAT (guerrier.js). Ici, seule la liste
//  des identifiants autorisés est propre au Paladin.
// ============================================================================
export const STYLES_COMBAT_PALADIN_IDS = ["defense", "duel", "armes_a_deux_mains", "protection"];

export const STYLES_COMBAT_PALADIN = Object.fromEntries(
  STYLES_COMBAT_PALADIN_IDS.map((id) => [id, STYLES_COMBAT[id]])
);

// ============================================================================
//  SOUS-CLASSES (Serments sacrés). SRD 5.1 → uniquement Serment de Dévotion.
//  Chaque capacité indique le niveau où elle est acquise.
// ============================================================================
export const SOUS_CLASSES = {
  serment_devotion: {
    id: "serment_devotion",
    nom: "Serment de Dévotion",
    niveauChoix: 3,
    // Sorts de serment : toujours préparés, ne comptent pas dans le nombre de
    // sorts préparés (slugs à résoudre côté base de sorts).
    sortsSerment: {
      3:  ["protection contre le mal et le bien", "sanctuaire"],
      5:  ["alignement d'arme", "restauration partielle"],
      9:  ["dissipation de la magie", "don des langues"],
      13: ["liberté de mouvement", "gardien de la foi"],
      17: ["colonne de flamme", "communion"],
    },
    capacites: {
      sorts_de_serment: {
        nom: "Sorts de serment",
        niveau: 3,
        type: "passif",
        description:
          "Vous gagnez des sorts de serment aux niveaux 3, 5, 9, 13 et 17. Ils sont toujours préparés et ne comptent pas dans le nombre de sorts que vous pouvez préparer.",
        effet: { type: "sorts_toujours_prepares", parPalier: true },
      },
      arme_sacree: {
        nom: "Conduit divin : Arme sacrée",
        niveau: 3,
        type: "action",
        description:
          "Par une action, vous imprégnez une arme que vous tenez d'énergie positive pendant 1 minute : vous ajoutez votre modificateur de Charisme (minimum +1) aux jets d'attaque effectués avec elle, et elle émet une lumière vive dans un rayon de 6 m et une lumière faible sur 6 m de plus. Si l'arme n'est pas déjà magique, elle le devient pour la durée. L'effet prend fin si vous lâchez l'arme ou si vous êtes incapable d'agir.",
        effet: {
          type: "conduit_divin",
          bonusAttaque: "max(1, mod_charisme)",
          duree: "1 minute",
          lumiere: { vive: 6, faible: 6 },
        },
      },
      renvoi_des_impies: {
        nom: "Conduit divin : Renvoi des impies",
        niveau: 3,
        type: "action",
        description:
          "Par une action, vous présentez votre symbole sacré et prononcez une prière : chaque fiélon ou mort-vivant qui vous voit ou vous entend dans un rayon de 9 m doit réussir un jet de sauvegarde de Sagesse (DD de sorts) ou être renvoyé pendant 1 minute, ou jusqu'à ce qu'il subisse des dégâts. Une créature renvoyée doit fuir vous et vos alliés au plus loin.",
        effet: {
          type: "conduit_divin",
          rayon: 9,
          sauvegarde: "sagesse",
          cibles: ["fielon", "mort_vivant"],
          duree: "1 minute",
        },
      },
      aura_de_devotion: {
        nom: "Aura de dévotion",
        niveau: 7,
        type: "passif",
        description:
          "Vous et les créatures amies dans un rayon de 3 m autour de vous ne pouvez pas être charmés tant que vous n'êtes pas incapable d'agir. Le rayon passe à 9 m au niveau 18.",
        effet: {
          type: "aura_immunite",
          etat: "charme",
          rayon: 3,
          paliers: [{ niveau: 18, rayon: 9 }],
        },
      },
      purete_desprit: {
        nom: "Pureté d'esprit",
        niveau: 15,
        type: "passif",
        description:
          "Vous bénéficiez en permanence des effets du sort protection contre le mal et le bien vis-à-vis des créatures célestes, élémentaires, fées, fiélons et morts-vivants.",
        effet: { type: "protection_permanente", contre: ["celeste", "elementaire", "fee", "fielon", "mort_vivant"] },
      },
      sainte_nimbe: {
        nom: "Sainte Nimbe",
        niveau: 20,
        type: "action",
        ressource: { max: 1, recharge: RECHARGE.LONG },
        description:
          "Par une action, vous vous entourez d'une lumière solaire pendant 1 minute : lumière vive dans un rayon de 9 m et lumière faible sur 9 m de plus. Les ennemis dans la lumière vive subissent 10 dégâts radiants quand ils y débutent leur tour. Pendant la durée, vous avez l'avantage aux jets de sauvegarde contre les sorts lancés par des fiélons ou des morts-vivants. Une fois par repos long.",
        effet: {
          type: "aura_degats",
          degats: { valeur: 10, type: "radiant" },
          rayon: 9,
          duree: "1 minute",
          avantageSauvegarde: { contre: "sorts_fielon_ou_mort_vivant" },
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Paladin)
// ============================================================================
export const CAPACITES = {
  sens_divin: {
    nom: "Sens divin",
    niveau: 1,
    type: "action",
    ressource: { formuleMax: "1 + mod_charisme", recharge: RECHARGE.LONG },
    description:
      "Par une action, vous détectez jusqu'à la fin de votre prochain tour la présence de toute créature céleste, fiélonne ou morte-vivante non totalement à couvert dans un rayon de 18 m, ainsi que tout lieu ou objet consacré ou profané. Utilisations par repos long : 1 + votre modificateur de Charisme.",
    effet: {
      type: "detection",
      rayon: 18,
      cibles: ["celeste", "fielon", "mort_vivant", "lieu_consacre", "lieu_profane"],
    },
  },
  imposition_des_mains: {
    nom: "Imposition des mains",
    niveau: 1,
    type: "action",
    ressource: { formuleMax: "5 * niveau", recharge: RECHARGE.LONG },
    description:
      "Vous disposez d'une réserve de soins égale à 5 × votre niveau de paladin, rechargée à un repos long. Par une action, vous touchez une créature et puisez dans la réserve pour lui rendre un nombre de PV à concurrence du total restant. Vous pouvez aussi dépenser 5 points de la réserve pour guérir une maladie ou neutraliser un poison affectant la cible. Cette capacité n'a aucun effet sur les morts-vivants et les créatures artificielles.",
    effet: {
      type: "reserve_soins",
      formuleMax: "5 * niveau_paladin",
      coutGuerison: 5,
      exclusions: ["mort_vivant", "artificiel"],
    },
  },
  style_combat: {
    nom: "Style de combat",
    niveau: 2,
    type: "choix",
    description:
      "Vous adoptez un style de combat parmi la liste accessible au Paladin (Défense, Duel, Armes à deux mains, Protection).",
    effet: { type: "choix_style_combat", parmi: STYLES_COMBAT_PALADIN_IDS },
  },
  incantation: {
    nom: "Incantation",
    niveau: 2,
    type: "passif",
    description:
      "Vous puisez la magie divine dans la force de votre serment. Vous lancez des sorts de paladin en utilisant le Charisme. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Charisme ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Charisme. Vous préparez chaque jour, après un repos long, un nombre de sorts égal à votre modificateur de Charisme + la moitié de votre niveau de paladin (arrondi à l'inférieur), minimum 1. Vous pouvez utiliser un symbole sacré comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "charisme",
      typeLanceur: "demi", // → EMPLACEMENTS_DEMI dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_charisme",
      attaqueFormule: "bonus_maitrise + mod_charisme",
      focaliseur: "symbole_sacre",
      rituels: false,
      preparation: "sorts_prepares",
      formulePreparation: "max(1, mod_charisme + floor(niveau_paladin / 2))",
    },
  },
  chatiment_divin: {
    nom: "Châtiment divin",
    niveau: 2,
    type: "special",
    description:
      "Quand vous touchez une créature avec une attaque d'arme de mêlée, vous pouvez dépenser un emplacement de sorts pour infliger des dégâts radiants supplémentaires : 2d8 pour un emplacement de niveau 1, +1d8 par niveau d'emplacement au-delà, jusqu'à un maximum de 5d8. Ces dégâts augmentent de 1d8 si la cible est un mort-vivant ou un fiélon.",
    effet: {
      type: "chatiment",
      degats: "radiant",
      desBase: 2, // 2d8 pour un emplacement de niveau 1
      desParNiveauSup: 1,
      desMax: 5,
      bonusContre: { cibles: ["mort_vivant", "fielon"], des: 1 },
      de: "d8",
      coutEmplacement: true,
    },
  },
  sante_divine: {
    nom: "Santé divine",
    niveau: 3,
    type: "passif",
    description: "La magie divine qui coule en vous vous rend immunisé aux maladies.",
    effet: { type: "immunite", valeur: ["maladie"] },
  },
  serment_sacre: {
    nom: "Serment sacré",
    niveau: 3,
    type: "choix",
    description:
      "Vous prêtez le serment qui vous lie en tant que paladin et qui façonne vos pouvoirs sacrés.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  conduit_divin: {
    nom: "Conduit divin",
    niveau: 3,
    type: "special",
    ressource: { max: 1, recharge: RECHARGE.COURT },
    description:
      "Votre serment vous octroie des options de Conduit divin. Vous en utilisez une par repos court ou long. DD des effets = 8 + bonus de maîtrise + mod. de Charisme.",
    effet: { type: "conduit_divin", ddFormule: "8 + bonus_maitrise + mod_charisme" },
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
  aura_de_protection: {
    nom: "Aura de protection",
    niveau: 6,
    type: "passif",
    description:
      "Tant que vous n'êtes pas incapable d'agir, vous et les créatures amies dans un rayon de 3 m autour de vous ajoutez votre modificateur de Charisme (minimum +1) à vos jets de sauvegarde. Le rayon passe à 9 m au niveau 18.",
    effet: {
      type: "aura_bonus_sauvegarde",
      formule: "max(1, mod_charisme)",
      rayon: 3,
      paliers: [{ niveau: 18, rayon: 9 }],
    },
  },
  aura_de_courage: {
    nom: "Aura de courage",
    niveau: 10,
    type: "passif",
    description:
      "Tant que vous n'êtes pas incapable d'agir, vous et les créatures amies dans un rayon de 3 m autour de vous ne pouvez pas être effrayés. Le rayon passe à 9 m au niveau 18.",
    effet: {
      type: "aura_immunite",
      etat: "effroi",
      rayon: 3,
      paliers: [{ niveau: 18, rayon: 9 }],
    },
  },
  chatiment_divin_ameliore: {
    nom: "Châtiment divin amélioré",
    niveau: 11,
    type: "passif",
    description:
      "Vous êtes si empli d'énergie sacrée que toutes vos attaques d'arme de mêlée infligent 1d8 dégâts radiants supplémentaires, sans dépenser d'emplacement de sorts. Ces dégâts se cumulent avec ceux de Châtiment divin.",
    effet: { type: "degats_bonus_melee", des: "1d8", degats: "radiant" },
  },
  toucher_purificateur: {
    nom: "Toucher purificateur",
    niveau: 14,
    type: "action",
    ressource: { formuleMax: "max(1, mod_charisme)", recharge: RECHARGE.LONG },
    description:
      "Par une action, vous pouvez mettre fin à un sort affectant votre personne ou une créature consentante que vous touchez. Utilisations par repos long : votre modificateur de Charisme (minimum 1).",
    effet: { type: "dissipation_ciblee" },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques  : nombre d'attaques via l'action Attaquer
//    capacites : identifiants acquis à ce niveau (tronc commun)
//    asi       : Amélioration de caractéristiques (ou don) disponible
//    archetype : true → une capacité de la sous-classe est acquise à ce niveau
//    notes     : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_DEMI (src/data/ressources.js)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["sens_divin", "imposition_des_mains"], notes: ["Imposition des mains : 5 PV"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["style_combat", "incantation", "chatiment_divin"], notes: ["Imposition des mains : 10 PV"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: true,  capacites: ["sante_divine", "serment_sacre", "conduit_divin"], notes: ["Imposition des mains : 15 PV", "Sorts de serment : niveau 1"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, asi: true,  archetype: false, capacites: [], notes: ["Imposition des mains : 20 PV"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: true,  capacites: ["attaque_supplementaire"], notes: ["Imposition des mains : 25 PV", "Sorts de serment : niveau 2"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: false, capacites: ["aura_de_protection"], notes: ["Imposition des mains : 30 PV"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 35 PV"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Imposition des mains : 40 PV"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 45 PV", "Sorts de serment : niveau 3"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 2, asi: false, archetype: false, capacites: ["aura_de_courage"], notes: ["Imposition des mains : 50 PV"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 2, asi: false, archetype: false, capacites: ["chatiment_divin_ameliore"], notes: ["Imposition des mains : 55 PV"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Imposition des mains : 60 PV"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 65 PV", "Sorts de serment : niveau 4"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 2, asi: false, archetype: false, capacites: ["toucher_purificateur"], notes: ["Imposition des mains : 70 PV"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 75 PV"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Imposition des mains : 80 PV"] },
  { niveau: 17, bonusMaitrise: 6, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 85 PV", "Sorts de serment : niveau 5"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 2, asi: false, archetype: false, capacites: [], notes: ["Imposition des mains : 90 PV", "Auras : rayon porté à 9 m"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Imposition des mains : 95 PV"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Imposition des mains : 100 PV"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const PALADIN = {
  id: "paladin",
  nom: "Paladin",
  source: "SRD 5.1 FR",
  deVie: 10, // d10
  pvNiveau1: 10, // + modificateur de Constitution
  caracteristiquesPrincipales: ["force", "charisme"],
  sauvegardes: ["sagesse", "charisme"],
  maitrises: {
    armures: ["legere", "intermediaire", "lourde", "bouclier"],
    armes: ["simples", "de_guerre"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["athletisme", "intimidation", "medecine", "perspicacite", "persuasion", "religion"],
  },
  incantation: {
    caracteristique: "charisme",
    typeLanceur: "demi",
    focaliseur: "symbole_sacre",
    rituels: false,
    niveauMin: 2,
  },
  styleCombat: STYLES_COMBAT_PALADIN,
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

/** Réserve de soins d'Imposition des mains à un niveau donné. */
export function reserveImpositionMains(niveau) {
  return 5 * Math.max(1, Math.min(20, niveau));
}

/** Nombre de sorts préparés : mod. Charisme + niveau/2 (arrondi inférieur), min 1. */
export function sortsPrepares(niveau, modCharisme) {
  if (niveau < 2) return 0;
  return Math.max(1, modCharisme + Math.floor(niveau / 2));
}

/**
 * Dés de Châtiment divin pour un emplacement donné.
 * `contreMortVivantOuFielon` ajoute 1d8 (cumul plafonné à 6d8).
 * Retourne un nombre de d8.
 */
export function desChatimentDivin(niveauEmplacement, contreMortVivantOuFielon = false) {
  const e = CAPACITES.chatiment_divin.effet;
  const base = Math.min(e.desMax, e.desBase + (Math.max(1, niveauEmplacement) - 1) * e.desParNiveauSup);
  return base + (contreMortVivantOuFielon ? e.bonusContre.des : 0);
}

/** Rayon (en mètres) des auras de paladin à un niveau donné : 3 m, 9 m à partir du niveau 18. */
export function rayonAura(niveau) {
  return niveau >= 18 ? 9 : 3;
}

/** Sorts de serment acquis jusqu'à un niveau (inclus), pour une sous-classe donnée. */
export function sortsSerment(sousClasseId, niveau) {
  const table = SOUS_CLASSES[sousClasseId]?.sortsSerment;
  if (!table) return [];
  return Object.entries(table)
    .filter(([palier]) => Number(palier) <= niveau)
    .flatMap(([, sorts]) => sorts);
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
 * Gère `ressource.max` (+ `ameliorations`) et les `formuleMax` du Paladin :
 *   "5 * niveau"          → Imposition des mains
 *   "1 + mod_charisme"    → Sens divin
 *   "max(1, mod_charisme)"→ Toucher purificateur
 * `modCharisme` est requis pour les deux dernières.
 */
export function utilisationsMax(capaciteId, niveau, modCharisme = 0) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (niveau < cap.niveau) return 0;
  switch (cap.ressource.formuleMax) {
    case "5 * niveau":
      return reserveImpositionMains(niveau);
    case "1 + mod_charisme":
      return 1 + modCharisme;
    case "max(1, mod_charisme)":
      return Math.max(1, modCharisme);
    default:
      break;
  }
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default PALADIN;