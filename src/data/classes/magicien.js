// ============================================================================
//  MAGICIEN — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : sorts préparés, niveaux
//  d'emplacements récupérés, bonus de dégâts…). Le MJ narre et déclenche ;
//  les jets passent par le service de dés. Les capacités « narratives » n'ont
//  pas d'`effet` chiffré.
//
//  Emplacements de sorts : NON dupliqués ici. Le Magicien est un lanceur
//  complet → voir EMPLACEMENTS_COMPLET / TYPE_LANCEUR dans src/data/ressources.js.
//  La progression ci-dessous ne porte que ce qui est propre à la classe :
//  sorts mineurs connus et taille du grimoire.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  SOUS-CLASSES (Traditions arcaniques). SRD 5.1 → uniquement École d'évocation.
//  Choix au niveau 2 (contrairement au Guerrier/Moine/Paladin : niveau 3).
// ============================================================================
export const SOUS_CLASSES = {
  ecole_evocation: {
    id: "ecole_evocation",
    nom: "École d'évocation",
    niveauChoix: 2,
    capacites: {
      erudit_evocation: {
        nom: "Érudit de l'évocation",
        niveau: 2,
        type: "passif",
        description:
          "Le temps et l'or que vous devez dépenser pour copier un sort d'évocation dans votre grimoire sont divisés par deux.",
        effet: { type: "reduction_copie_grimoire", ecole: "evocation", facteur: 0.5 },
      },
      sculpter_les_sorts: {
        nom: "Sculpter les sorts",
        niveau: 2,
        type: "passif",
        description:
          "Quand vous lancez un sort d'évocation affectant d'autres créatures que vous voyez, vous pouvez en protéger certaines : choisissez un nombre de créatures égal à 1 + le niveau du sort. Elles réussissent automatiquement leur jet de sauvegarde contre le sort et ne subissent aucun dégât si elles en auraient subi la moitié en cas de réussite.",
        effet: {
          type: "protection_allies",
          ecole: "evocation",
          formuleCibles: "1 + niveau_du_sort",
          effetCible: "sauvegarde_reussie_et_aucun_degat",
        },
      },
      sorts_mineurs_puissants: {
        nom: "Sorts mineurs puissants",
        niveau: 6,
        type: "passif",
        description:
          "Vos sorts mineurs infligeant des dégâts affectent même les créatures qui réussissent leur jet de sauvegarde : elles subissent la moitié des dégâts du sort, mais aucun autre effet.",
        effet: { type: "demi_degats_sur_reussite", cible: "sorts_mineurs" },
      },
      evocation_renforcee: {
        nom: "Évocation renforcée",
        niveau: 10,
        type: "passif",
        description:
          "Vous ajoutez votre modificateur d'Intelligence à un jet de dégâts de tout sort d'évocation de magicien que vous lancez.",
        effet: { type: "bonus_degats_sort", ecole: "evocation", formule: "mod_intelligence" },
      },
      surpuissance: {
        nom: "Surpuissance",
        niveau: 14,
        type: "special",
        description:
          "Quand vous lancez un sort de magicien de niveau 1 à 5 infligeant des dégâts, vous pouvez infliger le maximum de dégâts possible. La première utilisation après un repos long est sans conséquence ; chaque utilisation supplémentaire avant un repos long vous inflige 2d12 dégâts nécrotiques par niveau du sort, immédiatement après l'avoir lancé. Cette pénalité augmente de 1d12 à chaque utilisation supplémentaire.",
        effet: {
          type: "degats_maximises",
          niveauxSorts: [1, 5],
          coutPremiereUtilisation: null,
          coutSuivantes: { formule: "2d12 * niveau_du_sort", degats: "necrotique", incrementDes: 1 },
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Magicien)
// ============================================================================
export const CAPACITES = {
  incantation: {
    nom: "Incantation",
    niveau: 1,
    type: "passif",
    description:
      "Vous lancez des sorts de magicien en utilisant l'Intelligence. DD de sauvegarde = 8 + bonus de maîtrise + mod. d'Intelligence ; bonus d'attaque des sorts = bonus de maîtrise + mod. d'Intelligence. Vous préparez chaque jour, après un repos long, un nombre de sorts de votre grimoire égal à votre modificateur d'Intelligence + votre niveau de magicien (minimum 1). Vous pouvez lancer en rituel tout sort de votre grimoire portant la mention rituel, sans le préparer. Vous pouvez utiliser un focaliseur arcanique comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "intelligence",
      typeLanceur: "complet", // → EMPLACEMENTS_COMPLET dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_intelligence",
      attaqueFormule: "bonus_maitrise + mod_intelligence",
      focaliseur: "focaliseur_arcanique",
      rituels: true,
      preparation: "sorts_prepares",
      formulePreparation: "max(1, mod_intelligence + niveau_magicien)",
    },
  },
  grimoire: {
    nom: "Grimoire",
    niveau: 1,
    type: "passif",
    description:
      "Votre grimoire contient 6 sorts de magicien de niveau 1 au départ. À chaque montée de niveau, vous y ajoutez 2 nouveaux sorts de magicien de niveau égal ou inférieur à celui des emplacements dont vous disposez. Vous pouvez également y copier des sorts trouvés en jeu : 2 heures et 50 po par niveau du sort.",
    effet: {
      type: "grimoire",
      sortsDepart: 6,
      sortsParNiveau: 2,
      copie: { heuresParNiveau: 2, poParNiveau: 50 },
    },
  },
  recuperation_arcanique: {
    nom: "Récupération arcanique",
    niveau: 1,
    type: "special",
    ressource: { max: 1, recharge: RECHARGE.LONG },
    description:
      "Une fois par jour, quand vous terminez un repos court, vous pouvez récupérer des emplacements de sorts dépensés dont le total des niveaux est égal ou inférieur à la moitié de votre niveau de magicien (arrondi au supérieur), aucun de niveau 6 ou plus.",
    effet: {
      type: "recuperation_emplacements",
      formuleTotalNiveaux: "ceil(niveau_magicien / 2)",
      niveauMaxEmplacement: 5,
      declencheur: "repos_court",
    },
  },
  tradition_arcanique: {
    nom: "Tradition arcanique",
    niveau: 2,
    type: "choix",
    description:
      "Vous choisissez une école de magie qui façonne votre pratique arcanique.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  maitrise_des_sorts: {
    nom: "Maîtrise des sorts",
    niveau: 18,
    type: "passif",
    description:
      "Choisissez un sort de niveau 1 et un sort de niveau 2 de votre grimoire. Vous pouvez les lancer à leur niveau le plus bas sans dépenser d'emplacement de sorts, à condition de les avoir préparés. Pour les lancer à un niveau supérieur, vous devez dépenser un emplacement. À chaque repos long, vous pouvez changer ces deux sorts.",
    effet: {
      type: "sorts_a_volonte",
      niveaux: [1, 2],
      condition: "sort_prepare",
      changement: "repos_long",
    },
  },
  signature_de_sorts: {
    nom: "Signature de sorts",
    niveau: 20,
    type: "passif",
    description:
      "Choisissez deux sorts de niveau 3 de votre grimoire : ils sont toujours préparés, ne comptent pas dans le nombre de sorts préparés, et vous pouvez lancer chacun d'eux une fois au niveau 3 sans dépenser d'emplacement de sorts. Ces utilisations gratuites sont récupérées à un repos court ou long.",
    effet: {
      type: "sorts_signature",
      niveau: 3,
      nombre: 2,
      utilisationsGratuites: 1,
      recharge: RECHARGE.COURT,
      toujoursPrepares: true,
    },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques     : nombre d'attaques via l'action Attaquer (toujours 1)
//    sortsMineurs : sorts mineurs connus
//    grimoire     : total cumulé de sorts inscrits au grimoire (6 puis +2/niveau)
//    capacites    : identifiants acquis à ce niveau (tronc commun)
//    asi          : Amélioration de caractéristiques (ou don) disponible
//    archetype    : true → une capacité de la sous-classe est acquise à ce niveau
//    notes        : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_COMPLET (src/data/ressources.js)
//  Sorts préparés → mod. Intelligence + niveau (dépend de la fiche, pas de la table)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, grimoire: 6,  asi: false, archetype: false, capacites: ["incantation", "grimoire", "recuperation_arcanique"], notes: ["Sorts mineurs : 3", "Grimoire : 6 sorts"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, grimoire: 8,  asi: false, archetype: true,  capacites: ["tradition_arcanique"], notes: ["Grimoire : +2 sorts"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, grimoire: 10, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 4, grimoire: 12, asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 4", "Grimoire : +2 sorts"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, grimoire: 14, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, grimoire: 16, asi: false, archetype: true,  capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, grimoire: 18, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, grimoire: 20, asi: true,  archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, grimoire: 22, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, grimoire: 24, asi: false, archetype: true,  capacites: [], notes: ["Sorts mineurs : 5", "Grimoire : +2 sorts"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, grimoire: 26, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, grimoire: 28, asi: true,  archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, grimoire: 30, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, grimoire: 32, asi: false, archetype: true,  capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, grimoire: 34, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, grimoire: 36, asi: true,  archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, grimoire: 38, asi: false, archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, grimoire: 40, asi: false, archetype: false, capacites: ["maitrise_des_sorts"], notes: ["Grimoire : +2 sorts"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, grimoire: 42, asi: true,  archetype: false, capacites: [], notes: ["Grimoire : +2 sorts"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, grimoire: 44, asi: false, archetype: false, capacites: ["signature_de_sorts"], notes: ["Grimoire : +2 sorts"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const MAGICIEN = {
  id: "magicien",
  nom: "Magicien",
  source: "SRD 5.1 FR",
  deVie: 6, // d6
  pvNiveau1: 6, // + modificateur de Constitution
  caracteristiquesPrincipales: ["intelligence"],
  sauvegardes: ["intelligence", "sagesse"],
  maitrises: {
    armures: [],
    armes: ["dague", "flechette", "fronde", "baton", "arbalete_legere"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["arcanes", "histoire", "investigation", "medecine", "perspicacite", "religion"],
  },
  incantation: {
    caracteristique: "intelligence",
    typeLanceur: "complet",
    focaliseur: "focaliseur_arcanique",
    rituels: true,
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

/** Nombre de sorts mineurs connus à un niveau donné. */
export function sortsMineursConnus(niveau) {
  return ligne(niveau).sortsMineurs;
}

/** Nombre de sorts inscrits au grimoire à un niveau donné (progression normale). */
export function tailleGrimoire(niveau) {
  return ligne(niveau).grimoire;
}

/** Nombre de sorts préparés : mod. Intelligence + niveau de magicien, min 1. */
export function sortsPrepares(niveau, modIntelligence) {
  return Math.max(1, modIntelligence + Math.max(1, Math.min(20, niveau)));
}

/**
 * Récupération arcanique : total des niveaux d'emplacements récupérables
 * à un niveau donné (aucun emplacement de niveau 6 ou plus).
 */
export function totalRecuperationArcanique(niveau) {
  return Math.ceil(Math.max(1, Math.min(20, niveau)) / 2);
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
 * Gère `ressource.max` (+ `ameliorations`).
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (niveau < cap.niveau) return 0;
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default MAGICIEN;