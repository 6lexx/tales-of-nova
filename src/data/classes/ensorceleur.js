// ============================================================================
//  ENSORCELEUR — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : CA sans armure, PV max,
//  coûts en points de sorcellerie…). Le MJ narre et déclenche ; les jets
//  passent par le service de dés. Les capacités « narratives » n'ont pas
//  d'`effet` chiffré.
//
//  Emplacements de sorts : NON dupliqués ici. L'Ensorceleur est un lanceur
//  complet → voir EMPLACEMENTS_COMPLET / TYPE_LANCEUR dans src/data/ressources.js.
//  La progression ci-dessous ne porte que ce qui est propre à la classe :
//  sorts mineurs connus, sorts connus, points de sorcellerie, métamagies.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  ANCÊTRES DRACONIQUES (Lignée draconique, niveau 1)
//  couleur → type de dégâts associé
// ============================================================================
export const ANCETRES_DRACONIQUES = {
  airain:  { id: "airain",  nom: "Airain",  degats: "feu" },
  argent:  { id: "argent",  nom: "Argent",  degats: "froid" },
  blanc:   { id: "blanc",   nom: "Blanc",   degats: "froid" },
  bleu:    { id: "bleu",    nom: "Bleu",    degats: "foudre" },
  bronze:  { id: "bronze",  nom: "Bronze",  degats: "foudre" },
  cuivre:  { id: "cuivre",  nom: "Cuivre",  degats: "acide" },
  noir:    { id: "noir",    nom: "Noir",    degats: "acide" },
  or:      { id: "or",      nom: "Or",      degats: "feu" },
  rouge:   { id: "rouge",   nom: "Rouge",   degats: "feu" },
  vert:    { id: "vert",    nom: "Vert",    degats: "poison" },
};

// ============================================================================
//  MÉTAMAGIE (2 options au niveau 3, 3 au niveau 10, 4 au niveau 17)
//  `cout` = points de sorcellerie dépensés à l'usage.
// ============================================================================
export const METAMAGIE = {
  sort_accelere: {
    id: "sort_accelere",
    nom: "Sort accéléré",
    cout: 2,
    description:
      "Quand vous lancez un sort dont le temps d'incantation est de 1 action, vous pouvez le lancer par une action bonus à la place.",
    effet: { type: "metamagie", cout: 2, modifie: "temps_incantation", valeur: "action_bonus" },
  },
  sort_attentif: {
    id: "sort_attentif",
    nom: "Sort attentif",
    cout: 1,
    description:
      "Quand vous lancez un sort qui force d'autres créatures à effectuer un jet de sauvegarde, vous pouvez protéger certaines d'entre elles : choisissez un nombre de créatures égal à votre modificateur de Charisme (minimum 1), elles réussissent automatiquement leur sauvegarde.",
    effet: { type: "metamagie", cout: 1, modifie: "sauvegarde_alliee", formuleCibles: "mod_charisme" },
  },
  sort_discret: {
    id: "sort_discret",
    nom: "Sort discret",
    cout: 1,
    description:
      "Quand vous lancez un sort, vous pouvez le faire sans composante verbale ni somatique.",
    effet: { type: "metamagie", cout: 1, modifie: "composantes", valeur: "sans_verbale_ni_somatique" },
  },
  sort_distant: {
    id: "sort_distant",
    nom: "Sort distant",
    cout: 1,
    description:
      "Quand vous lancez un sort d'une portée d'au moins 1,50 m, vous pouvez doubler cette portée. Si le sort a une portée de contact, vous pouvez la porter à 9 m.",
    effet: { type: "metamagie", cout: 1, modifie: "portee", valeur: "double_ou_9m_si_contact" },
  },
  sort_fortifie: {
    id: "sort_fortifie",
    nom: "Sort fortifié",
    cout: 1,
    description:
      "Quand vous lancez un sort infligeant des dégâts, vous pouvez relancer un nombre de dés de dégâts égal à votre modificateur de Charisme (minimum 1) et devez utiliser les nouveaux résultats. Utilisable même si vous avez déjà appliqué une autre option de métamagie à ce sort.",
    effet: { type: "metamagie", cout: 1, modifie: "degats", relanceDes: "mod_charisme", cumulable: true },
  },
  sort_intensifie: {
    id: "sort_intensifie",
    nom: "Sort intensifié",
    cout: 3,
    description:
      "Quand vous lancez un sort qui force une créature à effectuer un jet de sauvegarde pour résister à ses effets, vous pouvez donner un désavantage à cette créature sur son premier jet de sauvegarde contre le sort.",
    effet: { type: "metamagie", cout: 3, modifie: "sauvegarde_ennemie", valeur: "desavantage" },
  },
  sort_jumeau: {
    id: "sort_jumeau",
    nom: "Sort jumeau",
    cout: "niveau_du_sort",
    description:
      "Quand vous lancez un sort ne pouvant cibler qu'une seule créature et sans portée personnelle, vous pouvez viser une seconde créature à portée avec le même sort. Coût : un nombre de points de sorcellerie égal au niveau du sort (1 point pour un sort mineur).",
    effet: { type: "metamagie", coutFormule: "max(1, niveau_du_sort)", modifie: "cibles", valeur: 2 },
  },
  sort_prolonge: {
    id: "sort_prolonge",
    nom: "Sort prolongé",
    cout: 1,
    description:
      "Quand vous lancez un sort d'une durée de 1 minute ou plus, vous pouvez doubler cette durée, jusqu'à un maximum de 24 heures.",
    effet: { type: "metamagie", cout: 1, modifie: "duree", valeur: "double_max_24h" },
  },
};

// ============================================================================
//  COÛTS DE CONVERSION (Source de magie, niveau 2)
//  Créer un emplacement de sorts : coût en points de sorcellerie par niveau.
//  Conversion inverse (emplacement → points) : points = niveau de l'emplacement.
// ============================================================================
export const COUT_CREATION_EMPLACEMENT = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

// ============================================================================
//  SOUS-CLASSES (Origines magiques). SRD 5.1 → uniquement Lignée draconique.
//  Choix au niveau 1 (contrairement au Guerrier/Moine : niveau 3).
// ============================================================================
export const SOUS_CLASSES = {
  lignee_draconique: {
    id: "lignee_draconique",
    nom: "Lignée draconique",
    niveauChoix: 1,
    capacites: {
      ancetre_draconique: {
        nom: "Ancêtre draconique",
        niveau: 1,
        type: "choix",
        description:
          "Vous choisissez un type de dragon comme ancêtre. Le type de dégâts associé est utilisé par certaines de vos capacités. Vous pouvez parler, lire et écrire le draconique. De plus, quand vous effectuez un test de Charisme en interagissant avec des dragons, votre bonus de maîtrise est doublé.",
        effet: {
          type: "choix_ancetre_draconique",
          parmi: Object.keys(ANCETRES_DRACONIQUES),
          langue: "draconique",
          doubleMaitrise: { caracteristique: "charisme", condition: "interaction_dragon" },
        },
      },
      resilience_draconique: {
        nom: "Résilience draconique",
        niveau: 1,
        type: "passif",
        description:
          "Votre maximum de points de vie augmente de 1 par niveau d'ensorceleur. De plus, quand vous ne portez pas d'armure, votre CA est égale à 13 + votre modificateur de Dextérité.",
        effet: {
          type: "resilience_draconique",
          pvMaxBonusFormule: "niveau_ensorceleur",
          caSansArmure: { formule: "13 + mod_dexterite", condition: "sans_armure" },
        },
      },
      affinite_elementaire: {
        nom: "Affinité élémentaire",
        niveau: 6,
        type: "passif",
        description:
          "Quand vous lancez un sort infligeant des dégâts du type associé à votre ancêtre draconique, vous ajoutez votre modificateur de Charisme à un jet de dégâts de ce sort. Vous pouvez en outre dépenser 1 point de sorcellerie pour gagner la résistance à ce type de dégâts pendant 1 heure.",
        effet: {
          type: "affinite_elementaire",
          bonusDegats: "mod_charisme",
          condition: "degats_type_ancetre",
          option: { coutSorcellerie: 1, effet: "resistance_type_ancetre", duree: "1 heure" },
        },
      },
      ailes_de_dragon: {
        nom: "Ailes de dragon",
        niveau: 14,
        type: "action_bonus",
        description:
          "Par une action bonus, des ailes draconiques jaillissent de votre dos et vous octroient une vitesse de vol égale à votre vitesse actuelle. Elles durent jusqu'à ce que vous les fassiez disparaître (action bonus). Vous ne pouvez pas les faire apparaître si vous portez une armure non adaptée.",
        effet: { type: "vitesse_vol", formule: "vitesse_actuelle", condition: "armure_adaptee" },
      },
      presence_draconique: {
        nom: "Présence draconique",
        niveau: 18,
        type: "action",
        description:
          "Par une action et en dépensant 5 points de sorcellerie, vous dégagez une aura de terreur ou de majesté dans un rayon de 18 m pendant 1 minute (concentration). Chaque créature hostile entrant dans l'aura ou y débutant son tour doit réussir un jet de sauvegarde de Sagesse ou être charmée (majesté) ou effrayée (terreur) tant que l'aura persiste.",
        effet: {
          type: "cout_sorcellerie",
          sorcellerie: 5,
          rayon: 18,
          sauvegarde: "sagesse",
          etats: ["charme", "effroi"],
          concentration: true,
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Ensorceleur)
// ============================================================================
export const CAPACITES = {
  incantation: {
    nom: "Incantation",
    niveau: 1,
    type: "passif",
    description:
      "Votre magie est innée : vous lancez des sorts d'ensorceleur en utilisant le Charisme. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Charisme ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Charisme. Vous pouvez utiliser un focaliseur arcanique comme focalisateur d'incantation. Vous connaissez un nombre limité de sorts mineurs et de sorts (voir progression) ; à chaque montée de niveau, vous pouvez remplacer un sort connu par un autre de la liste d'ensorceleur.",
    effet: {
      type: "incantation",
      caracteristique: "charisme",
      typeLanceur: "complet", // → EMPLACEMENTS_COMPLET dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_charisme",
      attaqueFormule: "bonus_maitrise + mod_charisme",
      focaliseur: "focaliseur_arcanique",
      rituels: false,
      preparation: "sorts_connus",
    },
  },
  origine_magique: {
    nom: "Origine magique",
    niveau: 1,
    type: "choix",
    description:
      "Vous choisissez l'origine de votre magie innée, qui façonne vos pouvoirs dès le niveau 1.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  source_de_magie: {
    nom: "Source de magie",
    niveau: 2,
    type: "special",
    ressource: { formuleMax: "niveau", recharge: RECHARGE.LONG },
    description:
      "Vous disposez d'un réservoir de points de sorcellerie égal à votre niveau d'ensorceleur, récupérés à un repos long. Par une action bonus, vous pouvez convertir des points de sorcellerie en emplacement de sorts (coûts : 2 pour un niveau 1, 3 pour un niveau 2, 5 pour un niveau 3, 6 pour un niveau 4, 7 pour un niveau 5) ou sacrifier un emplacement de sorts pour gagner un nombre de points égal à son niveau. Ces emplacements créés disparaissent à la fin d'un repos long.",
    effet: {
      type: "ressource_sorcellerie",
      coutCreationEmplacement: COUT_CREATION_EMPLACEMENT,
      conversionEmplacementVersPoints: "niveau_emplacement",
    },
  },
  metamagie: {
    nom: "Métamagie",
    niveau: 3,
    type: "choix",
    description:
      "Vous apprenez à tordre vos sorts. Vous choisissez 2 options de métamagie (3 au niveau 10, 4 au niveau 17). Vous ne pouvez utiliser qu'une seule option de métamagie par sort lancé, sauf mention contraire.",
    effet: {
      type: "choix_metamagie",
      parmi: Object.keys(METAMAGIE),
      paliers: [
        { niveau: 3, nombre: 2 },
        { niveau: 10, nombre: 3 },
        { niveau: 17, nombre: 4 },
      ],
    },
  },
  restauration_sorcellerie: {
    nom: "Restauration de sorcellerie",
    niveau: 20,
    type: "passif",
    ressource: { max: 1, recharge: RECHARGE.COURT },
    description:
      "Vous récupérez 4 points de sorcellerie dépensés quand vous terminez un repos court.",
    effet: { type: "regain_sorcellerie", valeur: 4, declencheur: "repos_court" },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques        : nombre d'attaques via l'action Attaquer (toujours 1)
//    sortsMineurs    : sorts mineurs connus
//    sortsConnus     : sorts de niveau 1+ connus
//    sorcellerie     : points de sorcellerie max (= niveau à partir du niv. 2)
//    metamagies      : nombre d'options de métamagie connues
//    capacites       : identifiants acquis à ce niveau (tronc commun)
//    asi             : Amélioration de caractéristiques (ou don) disponible
//    archetype       : true → une capacité de la sous-classe est acquise à ce niveau
//    notes           : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_COMPLET (src/data/ressources.js)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 4, sortsConnus: 2,  sorcellerie: 0,  metamagies: 0, asi: false, archetype: true,  capacites: ["incantation", "origine_magique"], notes: ["Sorts mineurs : 4", "Sorts connus : 2"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 4, sortsConnus: 3,  sorcellerie: 2,  metamagies: 0, asi: false, archetype: false, capacites: ["source_de_magie"], notes: ["Sorcellerie : 2 points", "Sorts connus : 3"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 4, sortsConnus: 4,  sorcellerie: 3,  metamagies: 2, asi: false, archetype: false, capacites: ["metamagie"], notes: ["Métamagie : 2 options", "Sorcellerie : 3 points", "Sorts connus : 4"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 5, sortsConnus: 5,  sorcellerie: 4,  metamagies: 2, asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 5", "Sorcellerie : 4 points", "Sorts connus : 5"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 5, sortsConnus: 6,  sorcellerie: 5,  metamagies: 2, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 5 points", "Sorts connus : 6"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 5, sortsConnus: 7,  sorcellerie: 6,  metamagies: 2, asi: false, archetype: true,  capacites: [], notes: ["Sorcellerie : 6 points", "Sorts connus : 7"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 5, sortsConnus: 8,  sorcellerie: 7,  metamagies: 2, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 7 points", "Sorts connus : 8"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 5, sortsConnus: 9,  sorcellerie: 8,  metamagies: 2, asi: true,  archetype: false, capacites: [], notes: ["Sorcellerie : 8 points", "Sorts connus : 9"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, sortsConnus: 10, sorcellerie: 9,  metamagies: 2, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 9 points", "Sorts connus : 10"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 6, sortsConnus: 11, sorcellerie: 10, metamagies: 3, asi: false, archetype: false, capacites: [], notes: ["Sorts mineurs : 6", "Métamagie : 3 options", "Sorcellerie : 10 points", "Sorts connus : 11"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 6, sortsConnus: 12, sorcellerie: 11, metamagies: 3, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 11 points", "Sorts connus : 12"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 6, sortsConnus: 12, sorcellerie: 12, metamagies: 3, asi: true,  archetype: false, capacites: [], notes: ["Sorcellerie : 12 points"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 6, sortsConnus: 13, sorcellerie: 13, metamagies: 3, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 13 points", "Sorts connus : 13"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 6, sortsConnus: 13, sorcellerie: 14, metamagies: 3, asi: false, archetype: true,  capacites: [], notes: ["Sorcellerie : 14 points"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 6, sortsConnus: 14, sorcellerie: 15, metamagies: 3, asi: false, archetype: false, capacites: [], notes: ["Sorcellerie : 15 points", "Sorts connus : 14"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 6, sortsConnus: 14, sorcellerie: 16, metamagies: 3, asi: true,  archetype: false, capacites: [], notes: ["Sorcellerie : 16 points"] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 6, sortsConnus: 15, sorcellerie: 17, metamagies: 4, asi: false, archetype: false, capacites: [], notes: ["Métamagie : 4 options", "Sorcellerie : 17 points", "Sorts connus : 15"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 6, sortsConnus: 15, sorcellerie: 18, metamagies: 4, asi: false, archetype: true,  capacites: [], notes: ["Sorcellerie : 18 points"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 6, sortsConnus: 15, sorcellerie: 19, metamagies: 4, asi: true,  archetype: false, capacites: [], notes: ["Sorcellerie : 19 points"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 6, sortsConnus: 15, sorcellerie: 20, metamagies: 4, asi: false, archetype: false, capacites: ["restauration_sorcellerie"], notes: ["Sorcellerie : 20 points"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const ENSORCELEUR = {
  id: "ensorceleur",
  nom: "Ensorceleur",
  source: "SRD 5.1 FR",
  deVie: 6, // d6
  pvNiveau1: 6, // + modificateur de Constitution
  caracteristiquesPrincipales: ["charisme"],
  sauvegardes: ["constitution", "charisme"],
  maitrises: {
    armures: [],
    armes: ["dague", "flechette", "fronde", "baton", "arbalete_legere"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["arcanes", "escamotage", "intimidation", "perspicacite", "persuasion", "religion"],
  },
  incantation: {
    caracteristique: "charisme",
    typeLanceur: "complet",
    focaliseur: "focaliseur_arcanique",
    rituels: false,
  },
  metamagie: METAMAGIE,
  ancetresDraconiques: ANCETRES_DRACONIQUES,
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

/** Nombre de sorts (niveau 1+) connus à un niveau donné. */
export function sortsConnus(niveau) {
  return ligne(niveau).sortsConnus;
}

/** Points de sorcellerie max à un niveau donné (0 au niveau 1). */
export function pointsSorcellerie(niveau) {
  return ligne(niveau).sorcellerie;
}

/** Nombre d'options de métamagie connues à un niveau donné. */
export function nombreMetamagies(niveau) {
  return ligne(niveau).metamagies;
}

/** Coût en points de sorcellerie pour créer un emplacement de sorts (1-5). */
export function coutCreationEmplacement(niveauEmplacement) {
  return COUT_CREATION_EMPLACEMENT[niveauEmplacement] ?? null;
}

/** Type de dégâts associé à un ancêtre draconique. */
export function degatsAncetre(ancetreId) {
  return ANCETRES_DRACONIQUES[ancetreId]?.degats ?? null;
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
 * Gère `ressource.max` (+ `ameliorations`) et `ressource.formuleMax` ("niveau").
 * Note : pour `source_de_magie`, formuleMax "niveau" → 0 point au niveau 1
 * (la capacité n'est acquise qu'au niveau 2), cohérent avec progression.sorcellerie.
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (cap.ressource.formuleMax === "niveau") return niveau >= cap.niveau ? niveau : 0;
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default ENSORCELEUR;