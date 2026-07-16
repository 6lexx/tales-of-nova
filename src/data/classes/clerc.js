// ============================================================================
//  CLERC — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : sorts préparés, seuil de
//  FP de destruction, bonus de soins…). Le MJ narre et déclenche ; les jets
//  passent par le service de dés. Les capacités « narratives » n'ont pas
//  d'`effet` chiffré.
//
//  Emplacements de sorts : NON dupliqués ici. Le Clerc est un lanceur complet
//  → voir EMPLACEMENTS_COMPLET / TYPE_LANCEUR dans src/data/ressources.js.
//  La progression ci-dessous ne porte que ce qui est propre à la classe :
//  sorts mineurs connus, usages de Conduit divin, FP de Destruction des
//  morts-vivants.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  SOUS-CLASSES (Domaines divins). SRD 5.1 → uniquement Domaine de la Vie.
//  Choix au niveau 1 (comme l'Ensorceleur).
// ============================================================================
export const SOUS_CLASSES = {
  domaine_vie: {
    id: "domaine_vie",
    nom: "Domaine de la Vie",
    niveauChoix: 1,
    // Sorts de domaine : toujours préparés, ne comptent pas dans le nombre de
    // sorts préparés (clé = niveau de clerc, noms FR à résoudre côté base de sorts).
    sortsDomaine: {
      1: ["bénédiction", "soin des blessures"],
      3: ["arme spirituelle", "restauration partielle"],
      5: ["esprits gardiens", "rappel à la vie"],
      7: ["gardien de la foi", "protection contre la mort"],
      9: ["guérison de groupe", "restauration supérieure"],
    },
    capacites: {
      sorts_de_domaine: {
        nom: "Sorts de domaine",
        niveau: 1,
        type: "passif",
        description:
          "Vous gagnez des sorts de domaine aux niveaux 1, 3, 5, 7 et 9. Ils sont toujours préparés et ne comptent pas dans le nombre de sorts que vous pouvez préparer.",
        effet: { type: "sorts_toujours_prepares", parPalier: true },
      },
      maitrise_supplementaire: {
        nom: "Maîtrise supplémentaire",
        niveau: 1,
        type: "passif",
        description: "Vous gagnez la maîtrise des armures lourdes.",
        effet: { type: "maitrise_additionnelle", armures: ["lourde"] },
      },
      disciple_de_la_vie: {
        nom: "Disciple de la vie",
        niveau: 1,
        type: "passif",
        description:
          "Vos sorts de soins sont plus efficaces : quand vous rendez des points de vie à une créature avec un sort de niveau 1 ou supérieur, elle récupère 2 PV supplémentaires + le niveau du sort.",
        effet: {
          type: "bonus_soins",
          formule: "2 + niveau_du_sort",
          condition: "sort_de_soin_niveau_1_ou_plus",
        },
      },
      preservation_de_la_vie: {
        nom: "Conduit divin : Préservation de la vie",
        niveau: 2,
        type: "action",
        description:
          "Par une action, vous présentez votre symbole sacré et invoquez une énergie curative capable de restaurer un nombre de points de vie égal à 5 × votre niveau de clerc. Répartissez-les entre les créatures de votre choix dans un rayon de 9 m ; vous ne pouvez pas porter une créature au-delà de la moitié de son maximum de points de vie. Sans effet sur les morts-vivants et les créatures artificielles.",
        effet: {
          type: "conduit_divin",
          soinsFormule: "5 * niveau_clerc",
          rayon: 9,
          plafondParCible: "moitie_pv_max",
          exclusions: ["mort_vivant", "artificiel"],
        },
      },
      guerisseur_beni: {
        nom: "Guérisseur béni",
        niveau: 6,
        type: "passif",
        description:
          "Les sorts de soins que vous lancez sur autrui vous soignent aussi : quand vous lancez un sort de niveau 1 ou supérieur qui rend des PV à une autre créature, vous récupérez 2 PV + le niveau du sort.",
        effet: {
          type: "soins_reflechis",
          formule: "2 + niveau_du_sort",
          condition: "sort_de_soin_sur_autrui",
        },
      },
      frappe_divine: {
        nom: "Frappe divine",
        niveau: 8,
        type: "passif",
        description:
          "Une fois par tour, quand vous touchez une créature avec une attaque d'arme, vous pouvez infliger 1d8 dégâts radiants supplémentaires. Ces dégâts passent à 2d8 au niveau 14.",
        effet: {
          type: "degats_bonus_arme",
          des: "1d8",
          degats: "radiant",
          frequence: "une_fois_par_tour",
          paliers: [{ niveau: 14, des: "2d8" }],
        },
      },
      guerison_supreme: {
        nom: "Guérison suprême",
        niveau: 17,
        type: "passif",
        description:
          "Quand vous lanceriez normalement un ou plusieurs dés pour rendre des points de vie avec un sort, vous obtenez à la place le résultat maximal de chaque dé.",
        effet: { type: "soins_maximises" },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Clerc)
// ============================================================================
export const CAPACITES = {
  incantation: {
    nom: "Incantation",
    niveau: 1,
    type: "passif",
    description:
      "Vous lancez des sorts de clerc en utilisant la Sagesse. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Sagesse ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Sagesse. Vous préparez chaque jour, après un repos long, un nombre de sorts de la liste de clerc égal à votre modificateur de Sagesse + votre niveau de clerc (minimum 1). Vous pouvez lancer en rituel tout sort de clerc préparé portant la mention rituel. Vous pouvez utiliser un symbole sacré comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "sagesse",
      typeLanceur: "complet", // → EMPLACEMENTS_COMPLET dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_sagesse",
      attaqueFormule: "bonus_maitrise + mod_sagesse",
      focaliseur: "symbole_sacre",
      rituels: true,
      preparation: "sorts_prepares",
      formulePreparation: "max(1, mod_sagesse + niveau_clerc)",
    },
  },
  domaine_divin: {
    nom: "Domaine divin",
    niveau: 1,
    type: "choix",
    description:
      "Vous choisissez le domaine de votre divinité, qui façonne vos pouvoirs dès le niveau 1.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  conduit_divin: {
    nom: "Conduit divin",
    niveau: 2,
    type: "special",
    ressource: {
      max: 1,
      recharge: RECHARGE.COURT,
      ameliorations: [
        { niveau: 6, max: 2 },
        { niveau: 18, max: 3 },
      ],
    },
    description:
      "Vous canalisez l'énergie divine de votre divinité. Vous disposez de l'option Renvoi des morts-vivants et des options accordées par votre domaine. Utilisations par repos court ou long : 1 (niv. 2), 2 (niv. 6), 3 (niv. 18). DD des effets = 8 + bonus de maîtrise + mod. de Sagesse.",
    effet: { type: "conduit_divin", ddFormule: "8 + bonus_maitrise + mod_sagesse" },
  },
  renvoi_morts_vivants: {
    nom: "Conduit divin : Renvoi des morts-vivants",
    niveau: 2,
    type: "action",
    description:
      "Par une action, vous présentez votre symbole sacré et prononcez une prière : chaque mort-vivant qui vous voit ou vous entend dans un rayon de 9 m doit réussir un jet de sauvegarde de Sagesse ou être renvoyé pendant 1 minute, ou jusqu'à ce qu'il subisse des dégâts. Une créature renvoyée doit fuir vous et vos alliés au plus loin, et ne peut pas effectuer de réaction.",
    effet: {
      type: "conduit_divin",
      rayon: 9,
      sauvegarde: "sagesse",
      cibles: ["mort_vivant"],
      duree: "1 minute",
    },
  },
  destruction_morts_vivants: {
    nom: "Destruction des morts-vivants",
    niveau: 5,
    type: "passif",
    description:
      "Quand un mort-vivant rate son jet de sauvegarde contre votre Renvoi des morts-vivants, il est instantanément détruit si son facteur de puissance est inférieur ou égal à un seuil : 1/2 (niv. 5), 1 (niv. 8), 2 (niv. 11), 3 (niv. 14), 4 (niv. 17).",
    effet: {
      type: "destruction_renvoi",
      paliers: [
        { niveau: 5, fp: 0.5 }, { niveau: 8, fp: 1 }, { niveau: 11, fp: 2 },
        { niveau: 14, fp: 3 }, { niveau: 17, fp: 4 },
      ],
    },
  },
  intervention_divine: {
    nom: "Intervention divine",
    niveau: 10,
    type: "action",
    ressource: { max: 1, recharge: RECHARGE.LONG },
    description:
      "Par une action, vous implorez l'aide de votre divinité. Lancez un dé à 100 faces : si le résultat est inférieur ou égal à votre niveau de clerc, la divinité intervient de la manière qu'elle juge appropriée. En cas de réussite, vous ne pouvez pas réutiliser cette capacité avant 7 jours ; en cas d'échec, vous pouvez réessayer après un repos long. Au niveau 20, l'intervention réussit automatiquement.",
    effet: {
      type: "intervention_divine",
      seuil: "niveau_clerc",
      de: "d100",
      delaiApresReussite: "7 jours",
      automatique: { niveau: 20 },
    },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques      : nombre d'attaques via l'action Attaquer (toujours 1)
//    sortsMineurs  : sorts mineurs connus
//    conduitDivin  : utilisations de Conduit divin par repos court ou long
//    destructionFP : FP maximal détruit par Destruction des morts-vivants (null avant niv. 5)
//    capacites     : identifiants acquis à ce niveau (tronc commun)
//    asi           : Amélioration de caractéristiques (ou don) disponible
//    archetype     : true → une capacité de la sous-classe est acquise à ce niveau
//    notes         : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_COMPLET (src/data/ressources.js)
//  Sorts préparés → mod. Sagesse + niveau (dépend de la fiche, pas de la table)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, conduitDivin: 0, destructionFP: null, asi: false, archetype: true,  capacites: ["incantation", "domaine_divin"], notes: ["Sorts mineurs : 3", "Sorts de domaine : niveau 1"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, conduitDivin: 1, destructionFP: null, asi: false, archetype: true,  capacites: ["conduit_divin", "renvoi_morts_vivants"], notes: ["Conduit divin : 1 utilisation"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, conduitDivin: 1, destructionFP: null, asi: false, archetype: false, capacites: [], notes: ["Sorts de domaine : niveau 2"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 4, conduitDivin: 1, destructionFP: null, asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 4"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, conduitDivin: 1, destructionFP: 0.5,  asi: false, archetype: false, capacites: ["destruction_morts_vivants"], notes: ["Destruction des morts-vivants : FP 1/2", "Sorts de domaine : niveau 3"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, conduitDivin: 2, destructionFP: 0.5,  asi: false, archetype: true,  capacites: [], notes: ["Conduit divin : 2 utilisations"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, conduitDivin: 2, destructionFP: 0.5,  asi: false, archetype: false, capacites: [], notes: ["Sorts de domaine : niveau 4"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 4, conduitDivin: 2, destructionFP: 1,    asi: true,  archetype: true,  capacites: [], notes: ["Destruction des morts-vivants : FP 1"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, conduitDivin: 2, destructionFP: 1,    asi: false, archetype: false, capacites: [], notes: ["Sorts de domaine : niveau 5"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 1,    asi: false, archetype: false, capacites: ["intervention_divine"], notes: ["Sorts mineurs : 5"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 2,    asi: false, archetype: false, capacites: [], notes: ["Destruction des morts-vivants : FP 2"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 2,    asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 2,    asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 3,    asi: false, archetype: false, capacites: [], notes: ["Destruction des morts-vivants : FP 3", "Frappe divine : 2d8 (Domaine de la Vie)"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 3,    asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 3,    asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, conduitDivin: 2, destructionFP: 4,    asi: false, archetype: true,  capacites: [], notes: ["Destruction des morts-vivants : FP 4"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, conduitDivin: 3, destructionFP: 4,    asi: false, archetype: false, capacites: [], notes: ["Conduit divin : 3 utilisations"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, conduitDivin: 3, destructionFP: 4,    asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 5, conduitDivin: 3, destructionFP: 4,    asi: false, archetype: false, capacites: [], notes: ["Intervention divine : réussite automatique"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const CLERC = {
  id: "clerc",
  nom: "Clerc",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["sagesse"],
  sauvegardes: ["sagesse", "charisme"],
  maitrises: {
    armures: ["legere", "intermediaire", "bouclier"], // + lourdes via Domaine de la Vie
    armes: ["simples"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["histoire", "medecine", "perspicacite", "persuasion", "religion"],
  },
  incantation: {
    caracteristique: "sagesse",
    typeLanceur: "complet",
    focaliseur: "symbole_sacre",
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

/** Utilisations de Conduit divin par repos court ou long à un niveau donné. */
export function usagesConduitDivin(niveau) {
  return ligne(niveau).conduitDivin;
}

/** FP maximal détruit par Destruction des morts-vivants (null avant le niveau 5). */
export function fpDestructionMortsVivants(niveau) {
  return ligne(niveau).destructionFP;
}

/** Nombre de sorts préparés : mod. Sagesse + niveau de clerc, min 1. */
export function sortsPrepares(niveau, modSagesse) {
  return Math.max(1, modSagesse + Math.max(1, Math.min(20, niveau)));
}

/** Sorts de domaine acquis jusqu'à un niveau (inclus), pour une sous-classe donnée. */
export function sortsDomaine(sousClasseId, niveau) {
  const table = SOUS_CLASSES[sousClasseId]?.sortsDomaine;
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
 * Utilisations max d'une ressource à un niveau donné,
 * en tenant compte des paliers d'amélioration (`ressource.ameliorations`).
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

export default CLERC;