// ============================================================================
//  DRUIDE — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bornes chiffrées : FP de forme sauvage,
//  durée, niveaux d'emplacements récupérés…). Le MJ narre et déclenche ;
//  les jets passent par le service de dés.
//
//  Emplacements de sorts : NON dupliqués ici. Le Druide est un lanceur complet
//  → voir EMPLACEMENTS_COMPLET / TYPE_LANCEUR dans src/data/ressources.js.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// Forme sauvage « illimitée » au niveau 20 (Archidruide).
export const FORMES_ILLIMITEES = 99;

// ============================================================================
//  TERRAINS DE PRÉDILECTION (Cercle de la Terre, niveau 2)
//  Le terrain choisi détermine la table de sorts de cercle.
// ============================================================================
export const TERRAINS = {
  arctique:   { id: "arctique",   nom: "Arctique" },
  cote:       { id: "cote",       nom: "Côte" },
  desert:     { id: "desert",     nom: "Désert" },
  foret:      { id: "foret",      nom: "Forêt" },
  marais:     { id: "marais",     nom: "Marais" },
  montagne:   { id: "montagne",   nom: "Montagne" },
  prairie:    { id: "prairie",    nom: "Prairie" },
  outreterre: { id: "outreterre", nom: "Outreterre" },
};

// ============================================================================
//  SORTS DE CERCLE (Cercle de la Terre) — clé externe = terrain,
//  clé interne = NIVEAU DE DRUIDE d'acquisition (3, 5, 7, 9).
//  Noms FR en clair, à résoudre côté base de sorts.
// ============================================================================
export const SORTS_DE_CERCLE = {
  arctique: {
    3: ["immobilisation de personne", "croissance d'épines"],
    5: ["tempête de grêle", "lenteur"],
    7: ["liberté de mouvement", "tempête de glace"],
    9: ["communion avec la nature", "cône de froid"],
  },
  cote: {
    3: ["image miroir", "pas brumeux"],
    5: ["respiration aquatique", "marche sur l'onde"],
    7: ["contrôle de l'eau", "liberté de mouvement"],
    9: ["conjuration d'élémentaire", "scrutation"],
  },
  desert: {
    3: ["flou", "silence"],
    5: ["création de nourriture et d'eau", "protection contre l'énergie"],
    7: ["flétrissement", "terrain hallucinatoire"],
    9: ["fléau d'insectes", "mur de pierre"],
  },
  foret: {
    3: ["peau d'écorce", "pattes d'araignée"],
    5: ["appel de la foudre", "croissance végétale"],
    7: ["divination", "liberté de mouvement"],
    9: ["communion avec la nature", "passage par les arbres"],
  },
  marais: {
    3: ["ténèbres", "flèche acide"],
    5: ["marche sur l'onde", "nuage nauséabond"],
    7: ["liberté de mouvement", "localisation de créature"],
    9: ["fléau d'insectes", "scrutation"],
  },
  montagne: {
    3: ["pattes d'araignée", "croissance d'épines"],
    5: ["éclair", "fusion dans la pierre"],
    7: ["façonnage de la pierre", "peau de pierre"],
    9: ["passe-muraille", "mur de pierre"],
  },
  prairie: {
    3: ["invisibilité", "passage sans trace"],
    5: ["lumière du jour", "hâte"],
    7: ["divination", "liberté de mouvement"],
    9: ["rêve", "fléau d'insectes"],
  },
  outreterre: {
    3: ["pattes d'araignée", "toile d'araignée"],
    5: ["état gazeux", "nuage nauséabond"],
    7: ["invisibilité suprême", "façonnage de la pierre"],
    9: ["nuage mortel", "fléau d'insectes"],
  },
};

// ============================================================================
//  SOUS-CLASSES (Cercles druidiques). SRD 5.1 → uniquement Cercle de la Terre.
//  Choix au niveau 2 (comme le Magicien).
// ============================================================================
export const SOUS_CLASSES = {
  cercle_terre: {
    id: "cercle_terre",
    nom: "Cercle de la Terre",
    niveauChoix: 2,
    sortsDeCercle: SORTS_DE_CERCLE,
    capacites: {
      sort_mineur_supplementaire: {
        nom: "Sort mineur supplémentaire",
        niveau: 2,
        type: "choix",
        description: "Vous apprenez un sort mineur de druide supplémentaire de votre choix.",
        effet: { type: "sorts_mineurs_additionnels", nombre: 1 },
      },
      recuperation_naturelle: {
        nom: "Récupération naturelle",
        niveau: 2,
        type: "special",
        ressource: { max: 1, recharge: RECHARGE.LONG },
        description:
          "Une fois par jour, quand vous terminez un repos court, vous pouvez récupérer des emplacements de sorts dépensés dont le total des niveaux est égal ou inférieur à la moitié de votre niveau de druide (arrondi au supérieur), aucun de niveau 6 ou plus.",
        effet: {
          type: "recuperation_emplacements",
          formuleTotalNiveaux: "ceil(niveau_druide / 2)",
          niveauMaxEmplacement: 5,
          declencheur: "repos_court",
        },
      },
      sorts_de_cercle: {
        nom: "Sorts de cercle",
        niveau: 3,
        type: "choix",
        description:
          "Votre lien mystique avec un type de terrain vous octroie des sorts aux niveaux 3, 5, 7 et 9. Choisissez votre terrain de prédilection au niveau 2 ; ces sorts sont toujours préparés et ne comptent pas dans le nombre de sorts que vous pouvez préparer.",
        effet: {
          type: "sorts_toujours_prepares",
          parPalier: true,
          choixTerrain: { niveau: 2, parmi: Object.keys(TERRAINS) },
        },
      },
      deplacement_facilite: {
        nom: "Déplacement facilité",
        niveau: 6,
        type: "passif",
        description:
          "Vous traversez sans coût de déplacement supplémentaire les terrains difficiles non magiques. Vous traversez également sans encombre ni dégâts la végétation magiquement créée ou manipulée qui entraverait votre progression.",
        effet: { type: "ignore_terrain_difficile", inclutVegetationMagique: true },
      },
      defense_de_la_nature: {
        nom: "Défense de la nature",
        niveau: 10,
        type: "passif",
        description:
          "Vous ne pouvez pas être charmé ni effrayé par une créature élémentaire ou une fée, et vous êtes immunisé au poison et aux maladies.",
        effet: {
          type: "immunite",
          valeur: ["poison", "maladie"],
          conditionnelles: { etats: ["charme", "effroi"], sources: ["elementaire", "fee"] },
        },
      },
      sanctuaire_naturel: {
        nom: "Sanctuaire naturel",
        niveau: 14,
        type: "passif",
        description:
          "Quand une bête ou une plante vous attaque, elle doit réussir un jet de sauvegarde de Sagesse (DD de vos sorts de druide) ou choisir une autre cible ; en l'absence d'autre cible, son attaque échoue automatiquement. En cas de réussite, elle est immunisée à cet effet pendant 24 heures.",
        effet: {
          type: "dissuasion_attaque",
          cibles: ["bete", "plante"],
          sauvegarde: "sagesse",
          ddFormule: "8 + bonus_maitrise + mod_sagesse",
          immuniteApresReussite: "24 heures",
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Druide)
// ============================================================================
export const CAPACITES = {
  druidique: {
    nom: "Druidique",
    niveau: 1,
    type: "passif",
    description:
      "Vous connaissez le druidique, langue secrète des druides. Vous pouvez le parler et laisser des messages cachés : quiconque le connaît les repère automatiquement, les autres doivent réussir un test de Sagesse (Perception) DD 15 pour en remarquer la présence, sans pouvoir les déchiffrer sans magie.",
    effet: { type: "langue", valeur: "druidique", ddDetection: 15 },
  },
  incantation: {
    nom: "Incantation",
    niveau: 1,
    type: "passif",
    description:
      "Vous puisez la magie divine dans la nature. Vous lancez des sorts de druide en utilisant la Sagesse. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Sagesse ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Sagesse. Vous préparez chaque jour, après un repos long, un nombre de sorts de la liste de druide égal à votre modificateur de Sagesse + votre niveau de druide (minimum 1). Vous pouvez lancer en rituel tout sort de druide préparé portant la mention rituel. Vous pouvez utiliser un focaliseur druidique comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "sagesse",
      typeLanceur: "complet", // → EMPLACEMENTS_COMPLET dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_sagesse",
      attaqueFormule: "bonus_maitrise + mod_sagesse",
      focaliseur: "focaliseur_druidique",
      rituels: true,
      preparation: "sorts_prepares",
      formulePreparation: "max(1, mod_sagesse + niveau_druide)",
    },
  },
  forme_sauvage: {
    nom: "Forme sauvage",
    niveau: 2,
    type: "action",
    ressource: {
      max: 2,
      recharge: RECHARGE.COURT,
      ameliorations: [{ niveau: 20, max: FORMES_ILLIMITEES }],
    },
    description:
      "Par une action, vous prenez la forme d'une bête que vous avez déjà vue. Vous pouvez le faire deux fois par repos court ou long. Vous restez sous cette forme un nombre d'heures égal à la moitié de votre niveau de druide (arrondi à l'inférieur), ou jusqu'à ce que vous tombiez à 0 PV, que vous mouriez, ou que vous repreniez votre forme normale par une action bonus. Le FP maximal de la bête et ses modes de déplacement autorisés dépendent de votre niveau.",
    effet: {
      type: "forme_sauvage",
      formuleDuree: "floor(niveau_druide / 2) heures",
      paliers: [
        { niveau: 2, fp: 0.25, interdits: ["vol", "nage"] },
        { niveau: 4, fp: 0.5,  interdits: ["vol"] },
        { niveau: 8, fp: 1,    interdits: [] },
      ],
    },
  },
  cercle_druidique: {
    nom: "Cercle druidique",
    niveau: 2,
    type: "choix",
    description: "Vous rejoignez un cercle druidique qui façonne votre pratique.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  corps_intemporel: {
    nom: "Corps intemporel",
    niveau: 18,
    type: "passif",
    description:
      "La magie primordiale ralentit votre vieillissement : pour 10 ans écoulés, votre corps ne vieillit que d'un an.",
    effet: { type: "vieillissement_ralenti", facteur: 10 },
  },
  sorts_bestiaux: {
    nom: "Sorts bestiaux",
    niveau: 18,
    type: "passif",
    description:
      "Vous pouvez lancer nombre de vos sorts de druide sous n'importe quelle forme sauvage, en accomplissant les composantes verbales et somatiques d'un sort sous forme de bête, mais sans pouvoir fournir de composantes matérielles.",
    effet: { type: "incantation_en_forme_sauvage", composantesMaterielles: false },
  },
  archidruide: {
    nom: "Archidruide",
    niveau: 20,
    type: "passif",
    description:
      "Vous pouvez utiliser votre Forme sauvage un nombre illimité de fois. De plus, vous pouvez ignorer les composantes verbales et somatiques de vos sorts de druide, ainsi que les composantes matérielles sans coût en po et non consommées par le sort. Ceci vaut sous votre forme normale comme sous forme de bête.",
    effet: {
      type: "archidruide",
      formeSauvageIllimitee: true,
      ignoreComposantes: ["verbale", "somatique", "materielle_sans_cout"],
    },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques     : nombre d'attaques via l'action Attaquer (toujours 1)
//    sortsMineurs : sorts mineurs connus (hors bonus du Cercle de la Terre)
//    formesSauvages : utilisations de Forme sauvage par repos court ou long
//    formeFP      : FP maximal de la bête (null avant le niveau 2)
//    formeInterdits : modes de déplacement interdits à la bête choisie
//    capacites    : identifiants acquis à ce niveau (tronc commun)
//    asi          : Amélioration de caractéristiques (ou don) disponible
//    archetype    : true → une capacité de la sous-classe est acquise à ce niveau
//    notes        : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_COMPLET (src/data/ressources.js)
//  Sorts préparés → mod. Sagesse + niveau (dépend de la fiche, pas de la table)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, formesSauvages: 0, formeFP: null, formeInterdits: [],              asi: false, archetype: false, capacites: ["druidique", "incantation"], notes: ["Sorts mineurs : 2"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, formesSauvages: 2, formeFP: 0.25, formeInterdits: ["vol", "nage"], asi: false, archetype: true,  capacites: ["forme_sauvage", "cercle_druidique"], notes: ["Forme sauvage : FP 1/4, ni vol ni nage"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, formesSauvages: 2, formeFP: 0.25, formeInterdits: ["vol", "nage"], asi: false, archetype: true,  capacites: [], notes: ["Sorts de cercle : niveau 2"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 0.5,  formeInterdits: ["vol"],         asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 3", "Forme sauvage : FP 1/2, pas de vol"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 0.5,  formeInterdits: ["vol"],         asi: false, archetype: true,  capacites: [], notes: ["Sorts de cercle : niveau 3"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 0.5,  formeInterdits: ["vol"],         asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 0.5,  formeInterdits: ["vol"],         asi: false, archetype: true,  capacites: [], notes: ["Sorts de cercle : niveau 4"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: true,  archetype: false, capacites: [], notes: ["Forme sauvage : FP 1, aucune restriction"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 3, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: true,  capacites: [], notes: ["Sorts de cercle : niveau 5"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: true,  capacites: [], notes: ["Sorts mineurs : 4"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: false, capacites: [], notes: [] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: false, archetype: false, capacites: ["corps_intemporel", "sorts_bestiaux"], notes: [] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, formesSauvages: 2, formeFP: 1,    formeInterdits: [],              asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, formesSauvages: FORMES_ILLIMITEES, formeFP: 1, formeInterdits: [], asi: false, archetype: false, capacites: ["archidruide"], notes: ["Forme sauvage : illimitée"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const DRUIDE = {
  id: "druide",
  nom: "Druide",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["sagesse"],
  sauvegardes: ["intelligence", "sagesse"],
  maitrises: {
    // Les druides ne portent ni armure ni bouclier en métal (interdit de tradition).
    armures: ["legere", "intermediaire", "bouclier"],
    armes: ["baton", "dague", "flechette", "javeline", "masse_armes", "gourdin", "cimeterre", "serpe", "fronde", "epieu"],
    outils: ["kit_d_herboriste"],
  },
  competences: {
    nombre: 2,
    liste: ["arcanes", "dressage", "medecine", "nature", "perception", "perspicacite", "religion", "survie"],
  },
  incantation: {
    caracteristique: "sagesse",
    typeLanceur: "complet",
    focaliseur: "focaliseur_druidique",
    rituels: true,
  },
  terrains: TERRAINS,
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

/** Nombre de sorts mineurs connus (hors bonus du Cercle de la Terre). */
export function sortsMineursConnus(niveau) {
  return ligne(niveau).sortsMineurs;
}

/** Nombre de sorts préparés : mod. Sagesse + niveau de druide, min 1. */
export function sortsPrepares(niveau, modSagesse) {
  return Math.max(1, modSagesse + Math.max(1, Math.min(20, niveau)));
}

/** Utilisations de Forme sauvage (FORMES_ILLIMITEES au niveau 20). */
export function usagesFormeSauvage(niveau) {
  return ligne(niveau).formesSauvages;
}

/** Limites de Forme sauvage : { fp, interdits, dureeHeures } — fp null avant le niveau 2. */
export function limitesFormeSauvage(niveau) {
  const l = ligne(niveau);
  return {
    fp: l.formeFP,
    interdits: l.formeInterdits,
    dureeHeures: Math.floor(Math.max(1, Math.min(20, niveau)) / 2),
  };
}

/**
 * Récupération naturelle : total des niveaux d'emplacements récupérables
 * (aucun emplacement de niveau 6 ou plus). Cercle de la Terre uniquement.
 */
export function totalRecuperationNaturelle(niveau) {
  return Math.ceil(Math.max(1, Math.min(20, niveau)) / 2);
}

/** Sorts de cercle acquis jusqu'à un niveau (inclus), pour un terrain donné. */
export function sortsDeCercle(terrainId, niveau) {
  const table = SORTS_DE_CERCLE[terrainId];
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
    if (niveau >= amel.niveau && amel.max != null) max = amel.max;
  }
  return max;
}

export default DRUIDE;