// ============================================================================
//  MOINE — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : CA, dé d'arts martiaux,
//  vitesse, immunités…). Le MJ narre et déclenche ; les jets passent par le
//  service de dés. Les capacités « narratives » n'ont pas d'`effet` chiffré.
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  SOUS-CLASSES (Traditions monastiques). SRD 5.1 → Voie de la Main Ouverte.
//  Chaque capacité indique le niveau où elle est acquise.
// ============================================================================
export const SOUS_CLASSES = {
  main_ouverte: {
    id: "main_ouverte",
    nom: "Voie de la Main Ouverte",
    niveauChoix: 3,
    capacites: {
      technique_main_ouverte: {
        nom: "Technique de la Main Ouverte",
        niveau: 3,
        type: "passif",
        description:
          "Quand vous touchez une créature avec une attaque de Rafale de coups, vous pouvez lui imposer l'un des effets suivants : elle doit réussir un jet de sauvegarde de Dextérité ou être renversée ; elle doit réussir un jet de Force ou être repoussée de 4,50 m ; elle ne peut pas effectuer de réactions jusqu'à la fin de votre prochain tour.",
        effet: { type: "option_rafale", options: ["renverser", "repousser", "priver_reaction"] },
      },
      integrite_corps: {
        nom: "Intégrité totale",
        niveau: 6,
        type: "action",
        ressource: { max: 1, recharge: RECHARGE.LONG },
        description:
          "Par une action, vous récupérez un nombre de points de vie égal à trois fois votre niveau de moine. Une fois par repos long.",
        effet: { type: "soin", formule: "3 * niveau_moine" },
      },
      tranquillite: {
        nom: "Tranquillité",
        niveau: 11,
        type: "passif",
        description:
          "À la fin d'un repos long, vous bénéficiez d'un effet équivalent au sort sanctuaire jusqu'au début de votre prochain repos long (DD 8 + mod. Sagesse + bonus de maîtrise). L'effet prend fin si vous attaquez ou lancez un sort.",
        effet: { type: "sanctuaire_permanent" },
      },
      paume_vibratoire: {
        nom: "Paume vibratoire",
        niveau: 17,
        type: "action",
        ressource: { max: 1, recharge: RECHARGE.COURT },
        description:
          "Par une action et en dépensant 3 points de ki, vous instaurez des vibrations mortelles dans le corps d'une créature. Vous pouvez ensuite, jusqu'à un certain délai, mettre fin à ces vibrations : la cible effectue un jet de sauvegarde de Constitution ou tombe à 0 PV (10d10 dégâts nécrotiques en cas de réussite).",
        effet: { type: "cout_ki", ki: 3 },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Moine)
// ============================================================================
export const CAPACITES = {
  defense_sans_armure: {
    nom: "Défense sans armure",
    niveau: 1,
    type: "passif",
    description:
      "Tant que vous ne portez ni armure ni bouclier, votre CA est égale à 10 + votre modificateur de Dextérité + votre modificateur de Sagesse.",
    effet: { type: "ca_sans_armure", formule: "10 + mod_dexterite + mod_sagesse", condition: "sans_armure_ni_bouclier" },
  },
  arts_martiaux: {
    nom: "Arts martiaux",
    niveau: 1,
    type: "passif",
    description:
      "Vos frappes à mains nues et vos armes de moine (armes simples de mêlée sans propriété à deux mains ni lourde) profitent de : utiliser la Dextérité au lieu de la Force pour l'attaque et les dégâts ; un dé d'arts martiaux à la place des dégâts normaux (d4, puis d6 au niv. 5, d8 au niv. 11, d10 au niv. 17) ; une frappe à mains nues en action bonus après une attaque à mains nues ou avec une arme de moine.",
    effet: {
      type: "arts_martiaux",
      caracteristique: "dexterite",
      desParNiveau: { 1: "d4", 5: "d6", 11: "d8", 17: "d10" },
      attaqueBonusMainsNues: true,
    },
  },
  ki: {
    nom: "Ki",
    niveau: 2,
    type: "special",
    ressource: { formuleMax: "niveau", recharge: RECHARGE.COURT },
    description:
      "Vous disposez d'un nombre de points de ki égal à votre niveau de moine, récupérés à un repos court ou long. Vous pouvez les dépenser pour Rafale de coups (1 ki : deux frappes à mains nues en action bonus), Défense patiente (1 ki : Esquive en action bonus) et Pas du vent (1 ki : Se désengager ou Foncer en action bonus, saut doublé). DD de ki = 8 + mod. Sagesse + bonus de maîtrise.",
    effet: { type: "ressource_ki", ddFormule: "8 + mod_sagesse + bonus_maitrise" },
  },
  deplacement_sans_armure: {
    nom: "Déplacement sans armure",
    niveau: 2,
    type: "passif",
    description:
      "Tant que vous ne portez ni armure ni bouclier, votre vitesse augmente (+3 m au niv. 2, +4,50 m au niv. 6, +6 m au niv. 10, +7,50 m au niv. 14, +9 m au niv. 18). À partir du niveau 9, vous pouvez vous déplacer le long des surfaces verticales et sur les liquides sans tomber.",
    effet: {
      type: "bonus_vitesse",
      condition: "sans_armure_ni_bouclier",
      paliers: [
        { niveau: 2, bonus: 3 }, { niveau: 6, bonus: 4.5 }, { niveau: 10, bonus: 6 },
        { niveau: 14, bonus: 7.5 }, { niveau: 18, bonus: 9 },
      ],
    },
  },
  tradition_monastique: {
    nom: "Tradition monastique",
    niveau: 3,
    type: "choix",
    description: "Vous vous engagez dans une tradition monastique qui façonne votre pratique du ki.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  deviation_projectiles: {
    nom: "Déviation de projectiles",
    niveau: 3,
    type: "reaction",
    description:
      "Quand vous êtes touché par une attaque d'arme à distance, vous pouvez utiliser votre réaction pour réduire les dégâts de 1d10 + votre modificateur de Dextérité + votre niveau de moine. Si les dégâts tombent à 0 et que le projectile est petit, vous pouvez le rattraper et le relancer (1 ki : comme une arme de moine).",
    effet: { type: "reduction_degats", formule: "1d10 + mod_dexterite + niveau_moine", condition: "attaque_distance" },
  },
  chute_ralentie: {
    nom: "Chute ralentie",
    niveau: 4,
    type: "reaction",
    description:
      "Quand vous chutez, vous pouvez utiliser votre réaction pour réduire les dégâts de chute d'un montant égal à cinq fois votre niveau de moine.",
    effet: { type: "reduction_degats_chute", formule: "5 * niveau_moine" },
  },
  attaque_supplementaire: {
    nom: "Attaque supplémentaire",
    niveau: 5,
    type: "passif",
    description: "Quand vous entreprenez l'action Attaquer, vous pouvez attaquer deux fois au lieu d'une.",
    effet: { type: "attaques_multiples" },
  },
  frappe_etourdissante: {
    nom: "Frappe étourdissante",
    niveau: 5,
    type: "special",
    description:
      "Quand vous touchez une créature avec une attaque de mêlée, vous pouvez dépenser 1 point de ki pour tenter de l'étourdir : elle effectue un jet de sauvegarde de Constitution (DD de ki) ou est étourdie jusqu'à la fin de votre prochain tour.",
    effet: { type: "cout_ki", ki: 1, sauvegarde: "constitution" },
  },
  coups_de_ki: {
    nom: "Coups de ki",
    niveau: 6,
    type: "passif",
    description: "Vos frappes à mains nues comptent comme magiques pour surmonter la résistance et l'immunité aux attaques et aux dégâts non magiques.",
    effet: { type: "attaques_magiques" },
  },
  evasion: {
    nom: "Évasion",
    niveau: 7,
    type: "passif",
    description:
      "Quand vous êtes soumis à un effet autorisant un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, vous n'en subissez aucun en cas de réussite et la moitié en cas d'échec.",
    effet: { type: "evasion" },
  },
  immobilite_esprit: {
    nom: "Immobilité de l'esprit",
    niveau: 7,
    type: "action",
    description: "Par une action, vous pouvez mettre fin à un effet qui vous rend charmé ou effrayé.",
    effet: { type: "fin_etat", valeur: ["charme", "effroi"] },
  },
  purete_du_corps: {
    nom: "Pureté du corps",
    niveau: 10,
    type: "passif",
    description: "Votre maîtrise du ki vous rend immunisé aux maladies et au poison.",
    effet: { type: "immunite", valeur: ["poison", "maladie"] },
  },
  langue_soleil_lune: {
    nom: "Langue du soleil et de la lune",
    niveau: 13,
    type: "passif",
    description: "Vous comprenez toutes les langues parlées et pouvez vous faire comprendre de toute créature qui comprend au moins une langue.",
    effet: null,
  },
  ame_de_diamant: {
    nom: "Âme de diamant",
    niveau: 14,
    type: "passif",
    description:
      "Vous maîtrisez tous les jets de sauvegarde. De plus, quand vous ratez un jet de sauvegarde, vous pouvez dépenser 1 point de ki pour le relancer et devez utiliser le nouveau résultat.",
    effet: { type: "maitrise_toutes_sauvegardes" },
  },
  corps_intemporel: {
    nom: "Corps intemporel",
    niveau: 15,
    type: "passif",
    description: "Le ki soutient votre corps : vous ne subissez plus les affres de la vieillesse et ne pouvez pas être vieilli magiquement. Vous n'avez plus besoin de nourriture ni d'eau.",
    effet: null,
  },
  corps_vide: {
    nom: "Corps vide",
    niveau: 18,
    type: "action",
    description:
      "Par une action, en dépensant 4 points de ki, vous devenez invisible pendant 1 minute et bénéficiez de la résistance à tous les dégâts sauf de force. En dépensant 8 points de ki, vous pouvez lancer projection astrale sans composantes.",
    effet: { type: "cout_ki", ki: 4 },
  },
  perfection_de_soi: {
    nom: "Perfection de soi",
    niveau: 20,
    type: "passif",
    description: "Quand vous entamez un combat sans point de ki, vous en récupérez 4.",
    effet: { type: "regain_ki_combat", valeur: 4 },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques  : nombre d'attaques via l'action Attaquer
//    capacites : identifiants acquis à ce niveau (tronc commun)
//    asi       : Amélioration de caractéristiques (ou don) disponible
//    archetype : true → une capacité de la sous-classe est acquise à ce niveau
//    notes     : améliorations signalées à la montée de niveau (ki, dé d'arts martiaux, vitesse)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["defense_sans_armure", "arts_martiaux"], notes: ["Dé d'arts martiaux : d4"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: false, capacites: ["ki", "deplacement_sans_armure"], notes: ["Ki : 2 points", "Déplacement : +3 m"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, asi: false, archetype: true,  capacites: ["tradition_monastique", "deviation_projectiles"], notes: ["Ki : 3 points"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, asi: true,  archetype: false, capacites: ["chute_ralentie"], notes: ["Ki : 4 points"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: false, capacites: ["attaque_supplementaire", "frappe_etourdissante"], notes: ["Dé d'arts martiaux : d6", "Ki : 5 points"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: true,  capacites: ["coups_de_ki"], notes: ["Ki : 6 points", "Déplacement : +4,50 m"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 2, asi: false, archetype: false, capacites: ["evasion", "immobilite_esprit"], notes: ["Ki : 7 points"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Ki : 8 points"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 2, asi: false, archetype: false, capacites: [], notes: ["Ki : 9 points", "Déplacement le long des murs/liquides"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 2, asi: false, archetype: false, capacites: ["purete_du_corps"], notes: ["Ki : 10 points", "Déplacement : +6 m"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Dé d'arts martiaux : d8", "Ki : 11 points"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Ki : 12 points"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 2, asi: false, archetype: false, capacites: ["langue_soleil_lune"], notes: ["Ki : 13 points"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 2, asi: true,  archetype: false, capacites: ["ame_de_diamant"], notes: ["Ki : 14 points", "Déplacement : +7,50 m"] },
  { niveau: 15, bonusMaitrise: 5, attaques: 2, asi: false, archetype: false, capacites: ["corps_intemporel"], notes: ["Ki : 15 points"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Ki : 16 points"] },
  { niveau: 17, bonusMaitrise: 6, attaques: 2, asi: false, archetype: true,  capacites: [], notes: ["Dé d'arts martiaux : d10", "Ki : 17 points"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 2, asi: false, archetype: false, capacites: ["corps_vide"], notes: ["Ki : 18 points", "Déplacement : +9 m"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 2, asi: true,  archetype: false, capacites: [], notes: ["Ki : 19 points"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 2, asi: false, archetype: false, capacites: ["perfection_de_soi"], notes: ["Ki : 20 points"] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const MOINE = {
  id: "moine",
  nom: "Moine",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["dexterite", "sagesse"],
  sauvegardes: ["force", "dexterite"],
  maitrises: {
    armures: [],
    armes: ["simples", "epees_courtes"],
    outils: ["un_outil_artisan_ou_instrument_au_choix"],
  },
  competences: {
    nombre: 2,
    liste: ["acrobaties", "athletisme", "histoire", "perspicacite", "religion", "discretion"],
  },
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

/** Dé d'arts martiaux (chaîne "d4"/"d6"/"d8"/"d10") pour un niveau donné. */
export function desArtsMartiaux(niveau) {
  const paliers = CAPACITES.arts_martiaux.effet.desParNiveau;
  let de = "d4";
  for (const [seuil, valeur] of Object.entries(paliers)) {
    if (niveau >= Number(seuil)) de = valeur;
  }
  return de;
}

/** Bonus de vitesse (en mètres) accordé par Déplacement sans armure à un niveau donné. */
export function bonusDeplacement(niveau) {
  let bonus = 0;
  for (const p of CAPACITES.deplacement_sans_armure.effet.paliers) {
    if (niveau >= p.niveau) bonus = p.bonus;
  }
  return bonus;
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
 * Utilisations max d'une ressource à un niveau donné.
 * Gère `ressource.max` (+ `ameliorations`) et `ressource.formuleMax` ("niveau").
 */
export function utilisationsMax(capaciteId, niveau) {
  const cap = CAPACITES[capaciteId];
  if (!cap?.ressource) return 0;
  if (cap.ressource.formuleMax === "niveau") return niveau;
  let max = cap.ressource.max ?? 0;
  for (const amel of cap.ressource.ameliorations ?? []) {
    if (niveau >= amel.niveau) max = amel.max;
  }
  return max;
}

export default MOINE;