// ============================================================================
//  BARDE — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : dé d'inspiration, dé de
//  chant de repos, demi-maîtrise…). Le MJ narre et déclenche ; les jets
//  passent par le service de dés. Les capacités « narratives » n'ont pas
//  d'`effet` chiffré.
//
//  Emplacements de sorts : NON dupliqués ici. Le Barde est un lanceur complet
//  → voir EMPLACEMENTS_COMPLET / TYPE_LANCEUR dans src/data/ressources.js.
//  La progression ci-dessous ne porte que ce qui est propre à la classe :
//  sorts mineurs connus, sorts connus, dé d'inspiration, dé de chant de repos.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  SOUS-CLASSES (Collèges bardiques). SRD 5.1 → uniquement Collège du Savoir.
//  Chaque capacité indique le niveau où elle est acquise.
// ============================================================================
export const SOUS_CLASSES = {
  college_savoir: {
    id: "college_savoir",
    nom: "Collège du Savoir",
    niveauChoix: 3,
    capacites: {
      maitrises_supplementaires: {
        nom: "Maîtrises supplémentaires",
        niveau: 3,
        type: "choix",
        description: "Vous gagnez la maîtrise de trois compétences de votre choix.",
        effet: { type: "competences_additionnelles", nombre: 3, parmi: "toutes" },
      },
      paroles_acerees: {
        nom: "Paroles acérées",
        niveau: 3,
        type: "reaction",
        description:
          "Quand une créature située à 18 m ou moins que vous pouvez voir effectue un jet d'attaque, un jet de dégâts ou un test de caractéristique, vous pouvez utiliser votre réaction et dépenser une utilisation d'Inspiration bardique : lancez le dé d'inspiration et soustrayez le résultat au jet de la créature. Vous pouvez le faire après avoir vu le jet, mais avant d'en connaître l'issue. La créature est immunisée si elle ne vous entend pas ou si elle est immunisée au charme.",
        effet: {
          type: "malus_jet_ennemi",
          coutInspiration: 1,
          portee: 18,
          cibles: ["jet_attaque", "jet_degats", "test_caracteristique"],
        },
      },
      secrets_magiques_supplementaires: {
        nom: "Secrets magiques supplémentaires",
        niveau: 6,
        type: "choix",
        description:
          "Vous apprenez deux sorts de votre choix issus de n'importe quelle classe, de niveau égal ou inférieur à celui des emplacements dont vous disposez (ou des sorts mineurs). Ils comptent comme des sorts de barde et ne comptent pas dans le nombre de sorts connus.",
        effet: { type: "sorts_additionnels", nombre: 2, source: "toutes_classes", horsSortsConnus: true },
      },
      aptitude_irresistible: {
        nom: "Aptitude irrésistible",
        niveau: 14,
        type: "special",
        description:
          "Quand vous effectuez un test de caractéristique, vous pouvez dépenser une utilisation d'Inspiration bardique : lancez le dé d'inspiration et ajoutez le résultat au test. Vous pouvez le faire après avoir lancé le dé, mais avant que le MJ n'annonce l'issue.",
        effet: { type: "bonus_test_soi", coutInspiration: 1 },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Barde)
// ============================================================================
export const CAPACITES = {
  incantation: {
    nom: "Incantation",
    niveau: 1,
    type: "passif",
    description:
      "Vous lancez des sorts de barde en utilisant le Charisme. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Charisme ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Charisme. Vous connaissez un nombre limité de sorts mineurs et de sorts (voir progression) ; à chaque montée de niveau, vous pouvez remplacer un sort connu par un autre de la liste de barde. Vous pouvez lancer en rituel tout sort de barde connu portant la mention rituel. Vous pouvez utiliser un instrument de musique comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "charisme",
      typeLanceur: "complet", // → EMPLACEMENTS_COMPLET dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_charisme",
      attaqueFormule: "bonus_maitrise + mod_charisme",
      focaliseur: "instrument_de_musique",
      rituels: true,
      preparation: "sorts_connus",
    },
  },
  inspiration_bardique: {
    nom: "Inspiration bardique",
    niveau: 1,
    type: "action_bonus",
    // Recharge : repos long jusqu'au niveau 4, repos court à partir du niveau 5
    // (Source d'inspiration). Aligné sur RESSOURCES_CLASSE.Barde (ressources.js).
    ressource: {
      formuleMax: "max(1, mod_charisme)",
      recharge: RECHARGE.LONG,
      ameliorations: [{ niveau: 5, recharge: RECHARGE.COURT }],
    },
    description:
      "Par une action bonus, vous inspirez une autre créature à 18 m ou moins qui peut vous entendre : elle gagne un dé d'inspiration bardique (d6, puis d8 au niv. 5, d10 au niv. 10, d12 au niv. 15). Dans les 10 minutes qui suivent, elle peut lancer ce dé et ajouter le résultat à un test de caractéristique, un jet d'attaque ou un jet de sauvegarde, après avoir vu le jet mais avant d'en connaître l'issue. Utilisations : votre modificateur de Charisme (minimum 1).",
    effet: {
      type: "inspiration",
      portee: 18,
      duree: "10 minutes",
      desParNiveau: { 1: "d6", 5: "d8", 10: "d10", 15: "d12" },
      applicable: ["test_caracteristique", "jet_attaque", "jet_sauvegarde"],
    },
  },
  touche_a_tout: {
    nom: "Touche-à-tout",
    niveau: 2,
    type: "passif",
    description:
      "Vous ajoutez la moitié de votre bonus de maîtrise (arrondi à l'inférieur) à tout test de caractéristique ne bénéficiant pas déjà de votre bonus de maîtrise.",
    effet: { type: "demi_maitrise", arrondi: "inferieur", caracteristiques: "toutes" },
  },
  chant_de_repos: {
    nom: "Chant de repos",
    niveau: 2,
    type: "passif",
    description:
      "Si vous ou des créatures amies passez un repos court en écoutant votre musique ou votre récit, chacune récupère 1d6 PV supplémentaires à la fin du repos, à condition d'avoir déjà dépensé au moins un dé de vie. Le dé passe à d8 au niveau 9, d10 au niveau 13, d12 au niveau 17.",
    effet: {
      type: "soin_repos_court",
      desParNiveau: { 2: "1d6", 9: "1d8", 13: "1d10", 17: "1d12" },
      condition: "au_moins_un_de_de_vie_depense",
    },
  },
  college_bardique: {
    nom: "Collège bardique",
    niveau: 3,
    type: "choix",
    description: "Vous rejoignez un collège bardique qui façonne votre art.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  expertise: {
    nom: "Expertise",
    niveau: 3,
    type: "choix",
    description:
      "Choisissez deux de vos compétences maîtrisées : votre bonus de maîtrise est doublé pour tout test de caractéristique les utilisant. Au niveau 10, vous choisissez deux compétences maîtrisées supplémentaires.",
    effet: {
      type: "expertise",
      nombre: 2,
      paliers: [{ niveau: 3, nombre: 2 }, { niveau: 10, nombre: 2 }],
    },
  },
  source_dinspiration: {
    nom: "Source d'inspiration",
    niveau: 5,
    type: "passif",
    description:
      "Vous récupérez vos utilisations dépensées d'Inspiration bardique à la fin d'un repos court ou long, et non plus seulement à un repos long.",
    effet: { type: "changement_recharge", capacite: "inspiration_bardique", recharge: RECHARGE.COURT },
  },
  contre_charme: {
    nom: "Contre-charme",
    niveau: 6,
    type: "action",
    description:
      "Par une action, vous entamez une prestation qui dure jusqu'à la fin de votre prochain tour. Pendant ce temps, vous et les créatures amies à 9 m ou moins qui vous entendent avez l'avantage aux jets de sauvegarde contre les états charmé et effrayé. La prestation prend fin prématurément si vous êtes incapable d'agir, réduit au silence ou si vous y mettez fin volontairement.",
    effet: {
      type: "aura_avantage_sauvegarde",
      rayon: 9,
      contre: ["charme", "effroi"],
      duree: "jusqu_a_fin_prochain_tour",
    },
  },
  secrets_magiques: {
    nom: "Secrets magiques",
    niveau: 10,
    type: "choix",
    description:
      "Choisissez deux sorts de n'importe quelle classe, de niveau égal ou inférieur à celui des emplacements dont vous disposez (ou des sorts mineurs). Ils comptent comme des sorts de barde et sont inclus dans votre nombre de sorts connus. Vous en apprenez deux de plus au niveau 14 et deux de plus au niveau 18.",
    effet: {
      type: "sorts_additionnels",
      source: "toutes_classes",
      horsSortsConnus: false, // déjà comptés dans progression[].sortsConnus
      paliers: [{ niveau: 10, nombre: 2 }, { niveau: 14, nombre: 2 }, { niveau: 18, nombre: 2 }],
    },
  },
  inspiration_superieure: {
    nom: "Inspiration supérieure",
    niveau: 20,
    type: "passif",
    description:
      "Quand vous effectuez un jet d'initiative et qu'il ne vous reste aucune utilisation d'Inspiration bardique, vous en récupérez une.",
    effet: { type: "regain_inspiration_initiative", valeur: 1 },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques     : nombre d'attaques via l'action Attaquer (toujours 1)
//    sortsMineurs : sorts mineurs connus
//    sortsConnus  : sorts de niveau 1+ connus (Secrets magiques inclus)
//    deInspiration: dé d'Inspiration bardique
//    deChantRepos : dé de Chant de repos (null avant le niveau 2)
//    capacites    : identifiants acquis à ce niveau (tronc commun)
//    asi          : Amélioration de caractéristiques (ou don) disponible
//    archetype    : true → une capacité de la sous-classe est acquise à ce niveau
//    notes        : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_COMPLET (src/data/ressources.js)
//  Utilisations d'Inspiration → mod. Charisme (dépend de la fiche, pas de la table)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 4,  deInspiration: "d6",  deChantRepos: null,   asi: false, archetype: false, capacites: ["incantation", "inspiration_bardique"], notes: ["Sorts mineurs : 2", "Sorts connus : 4", "Inspiration : d6"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 5,  deInspiration: "d6",  deChantRepos: "1d6",  asi: false, archetype: false, capacites: ["touche_a_tout", "chant_de_repos"], notes: ["Sorts connus : 5", "Chant de repos : 1d6"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 6,  deInspiration: "d6",  deChantRepos: "1d6",  asi: false, archetype: true,  capacites: ["college_bardique", "expertise"], notes: ["Sorts connus : 6", "Expertise : 2 compétences"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, sortsConnus: 7,  deInspiration: "d6",  deChantRepos: "1d6",  asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 3", "Sorts connus : 7"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 8,  deInspiration: "d8",  deChantRepos: "1d6",  asi: false, archetype: false, capacites: ["source_dinspiration"], notes: ["Inspiration : d8", "Inspiration rechargée au repos court", "Sorts connus : 8"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 9,  deInspiration: "d8",  deChantRepos: "1d6",  asi: false, archetype: true,  capacites: ["contre_charme"], notes: ["Sorts connus : 9"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 10, deInspiration: "d8",  deChantRepos: "1d6",  asi: false, archetype: false, capacites: [], notes: ["Sorts connus : 10"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 11, deInspiration: "d8",  deChantRepos: "1d6",  asi: true,  archetype: false, capacites: [], notes: ["Sorts connus : 11"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 3, sortsConnus: 12, deInspiration: "d8",  deChantRepos: "1d8",  asi: false, archetype: false, capacites: [], notes: ["Chant de repos : 1d8", "Sorts connus : 12"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 14, deInspiration: "d10", deChantRepos: "1d8",  asi: false, archetype: false, capacites: ["secrets_magiques"], notes: ["Sorts mineurs : 4", "Inspiration : d10", "Expertise : 2 compétences", "Secrets magiques : 2 sorts"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 15, deInspiration: "d10", deChantRepos: "1d8",  asi: false, archetype: false, capacites: [], notes: ["Sorts connus : 15"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 15, deInspiration: "d10", deChantRepos: "1d8",  asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 16, deInspiration: "d10", deChantRepos: "1d10", asi: false, archetype: false, capacites: [], notes: ["Chant de repos : 1d10", "Sorts connus : 16"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 18, deInspiration: "d10", deChantRepos: "1d10", asi: false, archetype: true,  capacites: [], notes: ["Secrets magiques : 2 sorts"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 19, deInspiration: "d12", deChantRepos: "1d10", asi: false, archetype: false, capacites: [], notes: ["Inspiration : d12", "Sorts connus : 19"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 19, deInspiration: "d12", deChantRepos: "1d10", asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 20, deInspiration: "d12", deChantRepos: "1d12", asi: false, archetype: false, capacites: [], notes: ["Chant de repos : 1d12", "Sorts connus : 20"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 22, deInspiration: "d12", deChantRepos: "1d12", asi: false, archetype: false, capacites: [], notes: ["Secrets magiques : 2 sorts"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 22, deInspiration: "d12", deChantRepos: "1d12", asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 22, deInspiration: "d12", deChantRepos: "1d12", asi: false, archetype: false, capacites: ["inspiration_superieure"], notes: [] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const BARDE = {
  id: "barde",
  nom: "Barde",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["charisme"],
  sauvegardes: ["dexterite", "charisme"],
  maitrises: {
    armures: ["legeres"],
    armes: ["simples", "arbalete_de_poing", "epee_longue", "rapiere", "epee_courte"],
    outils: ["trois_instruments_de_musique_au_choix"],
  },
  competences: {
    nombre: 3,
    liste: "toutes", // le Barde choisit trois compétences parmi toutes
  },
  incantation: {
    caracteristique: "charisme",
    typeLanceur: "complet",
    focaliseur: "instrument_de_musique",
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

/** Nombre de sorts (niveau 1+) connus à un niveau donné, Secrets magiques inclus. */
export function sortsConnus(niveau) {
  return ligne(niveau).sortsConnus;
}

/** Dé d'Inspiration bardique ("d6"/"d8"/"d10"/"d12") à un niveau donné. */
export function deInspiration(niveau) {
  return ligne(niveau).deInspiration;
}

/** Dé de Chant de repos ("1d6"…"1d12"), null avant le niveau 2. */
export function deChantRepos(niveau) {
  return ligne(niveau).deChantRepos;
}

/** Utilisations d'Inspiration bardique : mod. Charisme, minimum 1. */
export function usagesInspiration(modCharisme) {
  return Math.max(1, modCharisme);
}

/** Recharge de l'Inspiration bardique : repos long avant le niveau 5, court ensuite. */
export function rechargeInspiration(niveau) {
  return niveau >= 5 ? RECHARGE.COURT : RECHARGE.LONG;
}

/** Nombre total de compétences bénéficiant de l'Expertise à un niveau donné. */
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
 * Utilisations max d'une ressource à un niveau donné.
 * Gère `ressource.max` (+ `ameliorations`) et `formuleMax: "max(1, mod_charisme)"`
 * (Inspiration bardique). `modCharisme` est requis dans ce cas.
 */
export function utilisationsMax(capaciteId, niveau, modCharisme = 0) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (niveau < cap.niveau) return 0;
  if (cap.ressource.formuleMax === "max(1, mod_charisme)") return usagesInspiration(modCharisme);
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau && amel.max != null) max = amel.max;
  }
  return max;
}

export default BARDE;