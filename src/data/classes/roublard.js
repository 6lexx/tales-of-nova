// ============================================================================
//  ROUBLARD — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : dés d'attaque sournoise,
//  plancher de test, expertise…). Le MJ narre et déclenche ; les jets passent
//  par le service de dés.
//
//  Le Roublard n'est pas lanceur de sorts (le Filou arcanique n'est pas au SRD).
//
//  NOTE D'IDENTIFIANT : `id: "roublard"` = slug du nom canonique stocké en base
//  (`characters.classe` reçoit `classe?.nom` → "Roublard"). CharacterCreator.jsx
//  utilise de son côté la clé d'UI "voleur". Voir la remarque de livraison.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  SOUS-CLASSES (Archétypes de roublard). SRD 5.1 → uniquement Voleur.
// ============================================================================
export const SOUS_CLASSES = {
  voleur: {
    id: "voleur",
    nom: "Voleur",
    niveauChoix: 3,
    capacites: {
      mains_agiles: {
        nom: "Mains agiles",
        niveau: 3,
        type: "passif",
        description:
          "Vous pouvez utiliser l'action bonus accordée par votre Ruse pour effectuer un test de Dextérité (Escamotage), utiliser vos outils de voleur pour désamorcer un piège ou crocheter une serrure, ou entreprendre l'action Utiliser un objet.",
        effet: {
          type: "extension_action_bonus",
          capacite: "ruse",
          ajoute: ["escamotage", "outils_de_voleur", "utiliser_un_objet"],
        },
      },
      grimpeur_emerite: {
        nom: "Grimpeur émérite",
        niveau: 3,
        type: "passif",
        description:
          "Escalader ne vous coûte plus de déplacement supplémentaire. De plus, quand vous effectuez un saut en longueur sans élan, la distance parcourue augmente d'un nombre de mètres égal à votre modificateur de Dextérité.",
        effet: {
          type: "mobilite",
          escaladeSansSurcout: true,
          bonusSautLongueur: "mod_dexterite",
        },
      },
      discretion_supreme: {
        nom: "Discrétion suprême",
        niveau: 9,
        type: "passif",
        description:
          "Vous avez l'avantage à un test de Dextérité (Discrétion) si vous ne vous déplacez pas de plus de la moitié de votre vitesse pendant le tour.",
        effet: { type: "avantage_conditionnel", competence: "discretion", condition: "deplacement_max_demi_vitesse" },
      },
      utilisation_d_objets: {
        nom: "Utilisation d'objets",
        niveau: 13,
        type: "passif",
        description:
          "Vous ignorez les conditions de classe, de race et de niveau requises pour l'usage des objets magiques.",
        effet: { type: "ignore_prerequis_objets_magiques" },
      },
      voleur_insaisissable: {
        nom: "Voleur insaisissable",
        niveau: 17,
        type: "passif",
        description:
          "Vous pouvez jouer deux tours durant le premier round de tout combat : votre tour normal à votre initiative, puis un second tour à votre initiative moins 10.",
        effet: { type: "tour_supplementaire", round: 1, initiativeSecondTour: "initiative - 10" },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Roublard)
// ============================================================================
export const CAPACITES = {
  expertise: {
    nom: "Expertise",
    niveau: 1,
    type: "choix",
    description:
      "Choisissez deux de vos compétences maîtrisées, ou une compétence maîtrisée et vos outils de voleur : votre bonus de maîtrise est doublé pour tout test de caractéristique les utilisant. Au niveau 6, vous choisissez deux options supplémentaires.",
    effet: {
      type: "expertise",
      paliers: [{ niveau: 1, nombre: 2 }, { niveau: 6, nombre: 2 }],
      inclutOutilsDeVoleur: true,
    },
  },
  attaque_sournoise: {
    nom: "Attaque sournoise",
    niveau: 1,
    type: "passif",
    description:
      "Une fois par tour, vous pouvez infliger des dégâts supplémentaires à une créature que vous touchez avec une attaque, si vous avez l'avantage au jet d'attaque. L'attaque doit utiliser une arme de finesse ou à distance. Vous n'avez pas besoin de l'avantage si une autre créature hostile à la cible se trouve à 1,50 m ou moins d'elle, qu'elle n'est pas incapable d'agir et que vous n'avez pas de désavantage au jet d'attaque.",
    effet: {
      type: "degats_bonus_conditionnels",
      de: "d6",
      // Nombre de dés → progression[].desSournoise
      frequence: "une_fois_par_tour",
      conditions: ["avantage", "allie_adjacent_a_la_cible"],
      armes: ["finesse", "a_distance"],
    },
  },
  argot_des_voleurs: {
    nom: "Argot des voleurs",
    niveau: 1,
    type: "passif",
    description:
      "Vous connaissez l'argot des voleurs, mélange de dialecte, de jargon et de code qui vous permet de dissimuler un message dans une conversation apparemment anodine. Seule une autre créature connaissant l'argot le comprend. Il vous faut quatre fois plus de temps pour transmettre ainsi un message.",
    effet: { type: "langue", valeur: "argot_des_voleurs" },
  },
  ruse: {
    nom: "Ruse",
    niveau: 2,
    type: "action_bonus",
    description:
      "Votre vivacité d'esprit et votre agilité vous permettent d'entreprendre l'action Se précipiter, Se désengager ou Se cacher par une action bonus, à chacun de vos tours.",
    effet: { type: "action_bonus_supplementaire", actions: ["se_precipiter", "se_desengager", "se_cacher"] },
  },
  archetype_roublard: {
    nom: "Archétype de roublard",
    niveau: 3,
    type: "choix",
    description: "Vous choisissez l'archétype qui reflète votre spécialisation.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  esquive_instinctive: {
    nom: "Esquive instinctive",
    niveau: 5,
    type: "reaction",
    description:
      "Quand un assaillant que vous pouvez voir vous touche avec une attaque, vous pouvez utiliser votre réaction pour réduire de moitié les dégâts subis.",
    effet: { type: "reduction_degats", facteur: 0.5, condition: "assaillant_visible" },
  },
  evasion: {
    nom: "Évasion",
    niveau: 7,
    type: "passif",
    description:
      "Quand vous êtes soumis à un effet vous autorisant un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, vous n'en subissez aucun en cas de réussite, et seulement la moitié en cas d'échec.",
    effet: { type: "evasion", sauvegarde: "dexterite" },
  },
  fiabilite_a_toute_epreuve: {
    nom: "Fiabilité à toute épreuve",
    niveau: 11,
    type: "passif",
    description:
      "Quand vous effectuez un test de caractéristique vous permettant d'ajouter votre bonus de maîtrise, tout résultat de 9 ou moins sur le d20 est considéré comme un 10.",
    effet: { type: "plancher_de", valeur: 10, condition: "test_avec_maitrise" },
  },
  perception_aveugle: {
    nom: "Perception aveugle",
    niveau: 14,
    type: "passif",
    description:
      "Si vous êtes capable d'entendre, vous connaissez l'emplacement de toute créature cachée ou invisible située à 3 m ou moins de vous.",
    effet: { type: "perception_aveugle", rayon: 3, condition: "capable_d_entendre" },
  },
  esprit_impenetrable: {
    nom: "Esprit impénétrable",
    niveau: 15,
    type: "passif",
    description: "Vous gagnez la maîtrise des jets de sauvegarde de Sagesse.",
    effet: { type: "maitrise_additionnelle", sauvegardes: ["sagesse"] },
  },
  insaisissable: {
    nom: "Insaisissable",
    niveau: 18,
    type: "passif",
    description:
      "Aucun jet d'attaque ne bénéficie de l'avantage contre vous tant que vous n'êtes pas incapable d'agir.",
    effet: { type: "annule_avantage_contre_soi", condition: "pas_incapable_d_agir" },
  },
  coup_de_chance: {
    nom: "Coup de chance",
    niveau: 20,
    type: "special",
    ressource: { max: 1, recharge: RECHARGE.COURT },
    description:
      "Si votre jet d'attaque rate une cible, vous pouvez le transformer en réussite. Si vous ratez un test de caractéristique, vous pouvez considérer le d20 comme un 20. Une fois utilisée, cette capacité doit être rechargée par un repos court ou long.",
    effet: { type: "reussite_forcee", cibles: ["jet_attaque", "test_caracteristique"] },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques      : nombre d'attaques via l'action Attaquer (toujours 1)
//    desSournoise  : nombre de d6 d'Attaque sournoise
//    capacites     : identifiants acquis à ce niveau (tronc commun)
//    asi           : Amélioration de caractéristiques (ou don) disponible
//                    → le Roublard en a SIX (4, 8, 10, 12, 16, 19)
//    archetype     : true → une capacité de la sous-classe est acquise à ce niveau
//    notes         : améliorations signalées à la montée de niveau
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, desSournoise: 1,  asi: false, archetype: false, capacites: ["expertise", "attaque_sournoise", "argot_des_voleurs"], notes: ["Attaque sournoise : 1d6", "Expertise : 2 options"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, desSournoise: 1,  asi: false, archetype: false, capacites: ["ruse"], notes: [] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, desSournoise: 2,  asi: false, archetype: true,  capacites: ["archetype_roublard"], notes: ["Attaque sournoise : 2d6"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, desSournoise: 2,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, desSournoise: 3,  asi: false, archetype: false, capacites: ["esquive_instinctive"], notes: ["Attaque sournoise : 3d6"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, desSournoise: 3,  asi: false, archetype: false, capacites: [], notes: ["Expertise : 2 options supplémentaires"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, desSournoise: 4,  asi: false, archetype: false, capacites: ["evasion"], notes: ["Attaque sournoise : 4d6"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, desSournoise: 4,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, desSournoise: 5,  asi: false, archetype: true,  capacites: [], notes: ["Attaque sournoise : 5d6"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, desSournoise: 5,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, desSournoise: 6,  asi: false, archetype: false, capacites: ["fiabilite_a_toute_epreuve"], notes: ["Attaque sournoise : 6d6"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, desSournoise: 6,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, desSournoise: 7,  asi: false, archetype: true,  capacites: [], notes: ["Attaque sournoise : 7d6"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, desSournoise: 7,  asi: false, archetype: false, capacites: ["perception_aveugle"], notes: [] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, desSournoise: 8,  asi: false, archetype: false, capacites: ["esprit_impenetrable"], notes: ["Attaque sournoise : 8d6"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, desSournoise: 8,  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, desSournoise: 9,  asi: false, archetype: true,  capacites: [], notes: ["Attaque sournoise : 9d6"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, desSournoise: 9,  asi: false, archetype: false, capacites: ["insaisissable"], notes: [] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, desSournoise: 10, asi: true,  archetype: false, capacites: [], notes: ["Attaque sournoise : 10d6"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, desSournoise: 10, asi: false, archetype: false, capacites: ["coup_de_chance"], notes: [] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const ROUBLARD = {
  id: "roublard",
  nom: "Roublard",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["dexterite"],
  sauvegardes: ["dexterite", "intelligence"],
  maitrises: {
    armures: ["legere"],
    armes: ["simples", "arbalete_poing", "epee_longue", "rapiere", "epee_courte"],
    outils: ["outils_de_voleur"],
  },
  competences: {
    nombre: 4,
    liste: ["acrobaties", "athletisme", "discretion", "escamotage", "intimidation", "investigation", "perception", "perspicacite", "persuasion", "representation", "tromperie"],
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

/** Nombre de d6 d'Attaque sournoise à un niveau donné. */
export function desAttaqueSournoise(niveau) {
  return ligne(niveau).desSournoise;
}

/** Formule d'Attaque sournoise prête à jeter (ex. "5d6"). */
export function formuleAttaqueSournoise(niveau) {
  return `${desAttaqueSournoise(niveau)}d6`;
}

/** Nombre total d'options bénéficiant de l'Expertise à un niveau donné. */
export function nombreExpertises(niveau) {
  return CAPACITES.expertise.effet.paliers
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

export default ROUBLARD;