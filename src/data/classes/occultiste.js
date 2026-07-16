// ============================================================================
//  OCCULTISTE — Définition canonique de classe (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Consommée par les 4 couches :
//    1. État perso   → savoir quelles capacités/ressources instancier
//    2. Prompt MJ     → décrire au MJ ce que le perso peut faire
//    3. Résolution    → appliquer les modificateurs déterministes (hybride)
//    4. Fiche         → affichage
//
//  Résolution hybride : le champ `effet` de chaque capacité est lisible par
//  machine (le moteur applique les bonus chiffrés : PV temporaires, bonus de
//  dégâts d'explosion occulte…). Le MJ narre et déclenche ; les jets passent
//  par le service de dés.
//
//  Emplacements de sorts : NON dupliqués ici. L'Occultiste utilise la magie de
//  pacte → voir EMPLACEMENTS_PACTE / TYPE_LANCEUR dans src/data/ressources.js
//  (nombre et niveau uniforme, rechargés au repos COURT).
// ============================================================================

// --- Vocabulaire des types de ressource / recharge -------------------------
export const RECHARGE = {
  COURT: "repos_court", // récupéré à un repos court OU long
  LONG: "repos_long",   // récupéré uniquement à un repos long
};

// ============================================================================
//  FAVEURS DU PACTE (niveau 3)
// ============================================================================
export const FAVEURS_DU_PACTE = {
  pacte_de_la_chaine: {
    id: "pacte_de_la_chaine",
    nom: "Pacte de la Chaîne",
    description:
      "Vous apprenez le sort trouver un familier et pouvez le lancer en rituel. Il ne compte pas dans vos sorts connus. Vous pouvez choisir une forme spéciale de familier : diablotin, pseudo-dragon, quasit ou sprite. De plus, quand vous entreprenez l'action Attaquer, vous pouvez renoncer à l'une de vos attaques pour permettre à votre familier d'effectuer une attaque par sa réaction.",
    effet: { type: "familier", sortOffert: "trouver un familier", formes: ["diablotin", "pseudo-dragon", "quasit", "sprite"] },
  },
  pacte_de_la_lame: {
    id: "pacte_de_la_lame",
    nom: "Pacte de la Lame",
    description:
      "Par une action, vous créez une arme de pacte dans votre main libre : n'importe quelle arme de corps à corps, dont vous avez la maîtrise et qui compte comme magique. Elle disparaît si elle s'éloigne de plus de 1,50 m pendant 1 minute, ou si vous la faites disparaître, créez une nouvelle arme de pacte, ou mourez. Vous pouvez aussi transformer une arme magique existante en arme de pacte par un rituel d'une heure.",
    effet: { type: "arme_de_pacte", magique: true, maitriseAutomatique: true },
  },
  pacte_du_grimoire: {
    id: "pacte_du_grimoire",
    nom: "Pacte du Grimoire",
    description:
      "Votre protecteur vous offre un Livre des ombres contenant trois sorts mineurs de votre choix issus de n'importe quelle classe. Vous pouvez les lancer à volonté : ils ne comptent pas dans vos sorts mineurs connus. Si vous perdez le livre, vous pouvez en obtenir un nouveau par une cérémonie de 1 heure lors d'un repos court ou long ; l'ancien est alors détruit.",
    effet: { type: "sorts_mineurs_additionnels", nombre: 3, source: "toutes_classes", horsSortsMineursConnus: true },
  },
};

// ============================================================================
//  MANIFESTATIONS OCCULTES (Eldritch Invocations)
//  `prerequis` : { niveau, pacte, sort } — toute clé absente = pas de condition.
// ============================================================================
export const MANIFESTATIONS = {
  explosion_dechirante: {
    id: "explosion_dechirante", nom: "Explosion déchirante",
    prerequis: { sort: "explosion occulte" },
    description: "Quand vous lancez explosion occulte, vous ajoutez votre modificateur de Charisme aux dégâts infligés en cas de réussite.",
    effet: { type: "bonus_degats_sort", sort: "explosion occulte", formule: "mod_charisme" },
  },
  armure_des_ombres: {
    id: "armure_des_ombres", nom: "Armure des ombres",
    prerequis: {},
    description: "Vous pouvez lancer armure du mage à volonté sur vous-même, sans dépenser d'emplacement de sorts ni de composante matérielle.",
    effet: { type: "sort_a_volonte", sort: "armure du mage", cible: "soi" },
  },
  pas_ascendant: {
    id: "pas_ascendant", nom: "Pas ascendant",
    prerequis: { niveau: 9 },
    description: "Vous pouvez lancer lévitation à volonté sur vous-même, sans dépenser d'emplacement de sorts ni de composante matérielle.",
    effet: { type: "sort_a_volonte", sort: "lévitation", cible: "soi" },
  },
  langage_des_betes: {
    id: "langage_des_betes", nom: "Langage des bêtes",
    prerequis: {},
    description: "Vous pouvez lancer communication avec les animaux à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "communication avec les animaux" },
  },
  influence_enjoleuse: {
    id: "influence_enjoleuse", nom: "Influence enjôleuse",
    prerequis: {},
    description: "Vous gagnez la maîtrise des compétences Tromperie et Persuasion.",
    effet: { type: "competences_additionnelles", competences: ["tromperie", "persuasion"] },
  },
  chuchotements_ensorcelants: {
    id: "chuchotements_ensorcelants", nom: "Chuchotements ensorcelants",
    prerequis: { niveau: 7 },
    description: "Vous pouvez lancer contrainte une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "contrainte", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  livre_des_secrets_anciens: {
    id: "livre_des_secrets_anciens", nom: "Livre des secrets anciens",
    prerequis: { pacte: "pacte_du_grimoire" },
    description: "Vous inscrivez dans votre Livre des ombres deux sorts de rituel de niveau 1 issus de n'importe quelle classe. Vous pouvez les lancer en rituel sans qu'ils comptent dans vos sorts connus, et y ajouter d'autres rituels trouvés en jeu (2 heures et 50 po par niveau du sort, niveau maximal = la moitié de votre niveau d'occultiste arrondie au supérieur).",
    effet: { type: "rituels_additionnels", nombreDepart: 2, niveauDepart: 1, formuleNiveauMax: "ceil(niveau_occultiste / 2)" },
  },
  chaines_de_carceri: {
    id: "chaines_de_carceri", nom: "Chaînes de Carceri",
    prerequis: { niveau: 15, pacte: "pacte_de_la_chaine" },
    description: "Vous pouvez lancer immobilisation de monstre à volonté, sans dépenser d'emplacement de sorts, mais uniquement sur une créature céleste, fiélonne ou élémentaire. Vous devez terminer un repos long avant de pouvoir la relancer ainsi sur la même créature.",
    effet: { type: "sort_a_volonte", sort: "immobilisation de monstre", cibles: ["celeste", "fielon", "elementaire"], limiteParCible: RECHARGE.LONG },
  },
  vision_du_diable: {
    id: "vision_du_diable", nom: "Vision du diable",
    prerequis: {},
    description: "Vous voyez normalement dans les ténèbres, magiques ou non, jusqu'à 36 m.",
    effet: { type: "vision", valeur: "tenebres_magiques_et_non_magiques", portee: 36 },
  },
  parole_terrifiante: {
    id: "parole_terrifiante", nom: "Parole terrifiante",
    prerequis: { niveau: 7 },
    description: "Vous pouvez lancer confusion une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "confusion", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  vision_occulte: {
    id: "vision_occulte", nom: "Vision occulte",
    prerequis: {},
    description: "Vous pouvez lancer détection de la magie à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "détection de la magie" },
  },
  epieu_occulte: {
    id: "epieu_occulte", nom: "Épieu occulte",
    prerequis: { sort: "explosion occulte" },
    description: "Quand vous lancez explosion occulte, sa portée passe à 90 m.",
    effet: { type: "modificateur_sort", sort: "explosion occulte", portee: 90 },
  },
  yeux_du_gardien_des_runes: {
    id: "yeux_du_gardien_des_runes", nom: "Yeux du gardien des runes",
    prerequis: {},
    description: "Vous pouvez lire tous les écrits.",
    effet: { type: "lecture_universelle" },
  },
  vigueur_fielonne: {
    id: "vigueur_fielonne", nom: "Vigueur fiélonne",
    prerequis: {},
    description: "Vous pouvez lancer semblant de vie à volonté sur vous-même, au niveau 1 et sans dépenser d'emplacement de sorts ni de composante matérielle.",
    effet: { type: "sort_a_volonte", sort: "semblant de vie", cible: "soi", niveauSort: 1 },
  },
  regard_des_deux_esprits: {
    id: "regard_des_deux_esprits", nom: "Regard des deux esprits",
    prerequis: {},
    description: "Par une action, vous touchez un humanoïde consentant et percevez ce qu'il perçoit jusqu'à la fin de votre prochain tour. Tant qu'il reste à 18 m ou moins, vous pouvez prolonger l'effet par une action à chacun de vos tours. Pendant ce temps, vous êtes aveugle et sourd à votre propre environnement.",
    effet: { type: "perception_partagee", portee: 18 },
  },
  buveur_de_vie: {
    id: "buveur_de_vie", nom: "Buveur de vie",
    prerequis: { niveau: 12, pacte: "pacte_de_la_lame" },
    description: "Quand vous touchez une créature avec votre arme de pacte, elle subit des dégâts nécrotiques supplémentaires égaux à votre modificateur de Charisme (minimum 1).",
    effet: { type: "degats_bonus_arme", arme: "arme_de_pacte", formule: "max(1, mod_charisme)", degats: "necrotique" },
  },
  masque_aux_mille_visages: {
    id: "masque_aux_mille_visages", nom: "Masque aux mille visages",
    prerequis: {},
    description: "Vous pouvez lancer déguisement à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "déguisement" },
  },
  maitre_des_formes_multiples: {
    id: "maitre_des_formes_multiples", nom: "Maître des formes multiples",
    prerequis: { niveau: 15 },
    description: "Vous pouvez lancer métamorphose partielle à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "métamorphose partielle" },
  },
  sbires_du_chaos: {
    id: "sbires_du_chaos", nom: "Sbires du chaos",
    prerequis: { niveau: 9 },
    description: "Vous pouvez lancer conjuration d'élémentaire une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "conjuration d'élémentaire", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  embourber_l_esprit: {
    id: "embourber_l_esprit", nom: "Embourber l'esprit",
    prerequis: { niveau: 5 },
    description: "Vous pouvez lancer lenteur une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "lenteur", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  visions_brumeuses: {
    id: "visions_brumeuses", nom: "Visions brumeuses",
    prerequis: {},
    description: "Vous pouvez lancer image silencieuse à volonté, sans dépenser d'emplacement de sorts ni de composante matérielle.",
    effet: { type: "sort_a_volonte", sort: "image silencieuse" },
  },
  ne_faire_qu_un_avec_les_ombres: {
    id: "ne_faire_qu_un_avec_les_ombres", nom: "Ne faire qu'un avec les ombres",
    prerequis: { niveau: 5 },
    description: "Quand vous vous trouvez dans une zone de lumière faible ou de ténèbres, vous pouvez utiliser votre action pour devenir invisible jusqu'à ce que vous bougiez ou entrepreniez une action ou une réaction.",
    effet: { type: "invisibilite_conditionnelle", condition: "lumiere_faible_ou_tenebres" },
  },
  bond_d_outre_monde: {
    id: "bond_d_outre_monde", nom: "Bond d'outre-monde",
    prerequis: { niveau: 9 },
    description: "Vous pouvez lancer saut à volonté sur vous-même, sans dépenser d'emplacement de sorts ni de composante matérielle.",
    effet: { type: "sort_a_volonte", sort: "saut", cible: "soi" },
  },
  explosion_repoussante: {
    id: "explosion_repoussante", nom: "Explosion repoussante",
    prerequis: { sort: "explosion occulte" },
    description: "Quand vous touchez une créature avec explosion occulte, vous pouvez la repousser de 3 m en ligne droite.",
    effet: { type: "modificateur_sort", sort: "explosion occulte", pousse: 3 },
  },
  sculpteur_de_chair: {
    id: "sculpteur_de_chair", nom: "Sculpteur de chair",
    prerequis: { niveau: 7 },
    description: "Vous pouvez lancer métamorphose une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "métamorphose", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  signe_de_mauvais_augure: {
    id: "signe_de_mauvais_augure", nom: "Signe de mauvais augure",
    prerequis: { niveau: 5 },
    description: "Vous pouvez lancer sort de malédiction une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "sort de malédiction", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  voleur_des_cinq_destins: {
    id: "voleur_des_cinq_destins", nom: "Voleur des cinq destins",
    prerequis: {},
    description: "Vous pouvez lancer fléau une fois par repos long en utilisant un emplacement de sorts d'occultiste.",
    effet: { type: "sort_offert", sort: "fléau", recharge: RECHARGE.LONG, coutEmplacement: true },
  },
  lame_assoiffee: {
    id: "lame_assoiffee", nom: "Lame assoiffée",
    prerequis: { niveau: 5, pacte: "pacte_de_la_lame" },
    description: "Vous pouvez attaquer deux fois au lieu d'une avec votre arme de pacte quand vous entreprenez l'action Attaquer.",
    effet: { type: "attaques_multiples", arme: "arme_de_pacte", nombre: 2 },
  },
  visions_de_royaumes_lointains: {
    id: "visions_de_royaumes_lointains", nom: "Visions de royaumes lointains",
    prerequis: { niveau: 15 },
    description: "Vous pouvez lancer œil arcanique à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "œil arcanique" },
  },
  voix_du_maitre_des_chaines: {
    id: "voix_du_maitre_des_chaines", nom: "Voix du maître des chaînes",
    prerequis: { pacte: "pacte_de_la_chaine" },
    description: "Vous pouvez communiquer télépathiquement avec votre familier et percevoir par ses sens tant que vous êtes sur le même plan d'existence. De plus, tant que vous percevez par ses sens, vous pouvez également parler par sa voix.",
    effet: { type: "lien_familier", telepathie: true, sensPartages: true, parole: true },
  },
  chuchotements_de_la_tombe: {
    id: "chuchotements_de_la_tombe", nom: "Chuchotements de la tombe",
    prerequis: { niveau: 9 },
    description: "Vous pouvez lancer communication avec les morts à volonté, sans dépenser d'emplacement de sorts.",
    effet: { type: "sort_a_volonte", sort: "communication avec les morts" },
  },
  vision_de_sorciere: {
    id: "vision_de_sorciere", nom: "Vision de sorcière",
    prerequis: { niveau: 15 },
    description: "Vous voyez la véritable forme de tout métamorphe ou de toute créature dissimulée par une magie d'illusion ou de transmutation, tant qu'elle se trouve à 9 m ou moins et dans votre champ de vision.",
    effet: { type: "vision_veritable_partielle", portee: 9 },
  },
};

// ============================================================================
//  SOUS-CLASSES (Protecteurs d'outre-monde). SRD 5.1 → uniquement le Fiélon.
//  Choix au niveau 1 (comme l'Ensorceleur et le Clerc).
// ============================================================================
export const SOUS_CLASSES = {
  fielon: {
    id: "fielon",
    nom: "Le Fiélon",
    niveauChoix: 1,
    // ATTENTION : clé = NIVEAU DE SORT (et non niveau d'occultiste),
    // contrairement aux sorts de domaine du Clerc ou de serment du Paladin.
    sortsEtendus: {
      1: ["mains brûlantes", "injonction"],
      2: ["cécité/surdité", "rayon ardent"],
      3: ["boule de feu", "nuage nauséabond"],
      4: ["bouclier de feu", "mur de feu"],
      5: ["colonne de flamme", "sanctification"],
    },
    capacites: {
      sorts_etendus: {
        nom: "Sorts étendus",
        niveau: 1,
        type: "passif",
        description:
          "Le Fiélon vous permet de choisir vos sorts parmi une liste élargie : ces sorts comptent comme des sorts d'occultiste, mais ne sont pas automatiquement connus — ils s'ajoutent à la liste dans laquelle vous puisez.",
        effet: { type: "liste_de_sorts_etendue" },
      },
      benediction_du_tenebreux: {
        nom: "Bénédiction du Ténébreux",
        niveau: 1,
        type: "passif",
        description:
          "Quand vous réduisez une créature hostile à 0 point de vie, vous gagnez un nombre de points de vie temporaires égal à votre modificateur de Charisme + votre niveau d'occultiste (minimum 1).",
        effet: {
          type: "pv_temporaires",
          formule: "max(1, mod_charisme + niveau_occultiste)",
          declencheur: "ennemi_reduit_a_zero",
        },
      },
      chance_du_tenebreux: {
        nom: "Chance du Ténébreux",
        niveau: 6,
        type: "special",
        ressource: { max: 1, recharge: RECHARGE.COURT },
        description:
          "Vous pouvez faire appel à votre protecteur pour modifier le destin en votre faveur : quand vous effectuez un test de caractéristique ou un jet de sauvegarde, vous pouvez ajouter 1d10 au résultat. Vous pouvez le faire après avoir lancé le dé, mais avant d'en connaître l'issue.",
        effet: { type: "bonus_jet", des: "1d10", cibles: ["test_caracteristique", "jet_sauvegarde"] },
      },
      resilience_fielonne: {
        nom: "Résilience fiélonne",
        niveau: 10,
        type: "passif",
        description:
          "Vous choisissez un type de dégâts à la fin d'un repos court ou long : vous bénéficiez de la résistance à ce type jusqu'à ce que vous en choisissiez un autre. Les dégâts d'armes magiques ou d'armes argentées ignorent cette résistance.",
        effet: {
          type: "resistance_au_choix",
          moment: RECHARGE.COURT,
          exceptions: ["arme_magique", "arme_argentee"],
        },
      },
      lancer_dans_l_abime: {
        nom: "Lancer dans l'abîme",
        niveau: 14,
        type: "special",
        ressource: { max: 1, recharge: RECHARGE.LONG },
        description:
          "Quand vous touchez une créature avec une attaque, vous pouvez l'envoyer instantanément dans les plans inférieurs. Elle disparaît et effectue un voyage cauchemardesque, puis réapparaît à la fin de votre prochain tour à l'endroit qu'elle occupait (ou au plus proche libre). Si ce n'est pas une créature native des plans inférieurs, elle subit 10d10 dégâts psychiques.",
        effet: {
          type: "bannissement_temporaire",
          degats: { des: "10d10", type: "psychique" },
          exception: "natif_des_plans_inferieurs",
        },
      },
    },
  },
};

// ============================================================================
//  CAPACITÉS DE CLASSE (tronc commun Occultiste)
// ============================================================================
export const CAPACITES = {
  protecteur_outre_monde: {
    nom: "Protecteur d'outre-monde",
    niveau: 1,
    type: "choix",
    description:
      "Vous avez scellé un pacte avec une entité d'outre-monde qui façonne vos pouvoirs dès le niveau 1.",
    effet: { type: "choix_sous_classe", parmi: Object.keys(SOUS_CLASSES) },
  },
  magie_de_pacte: {
    nom: "Magie de pacte",
    niveau: 1,
    type: "passif",
    description:
      "Vos recherches et la magie que votre protecteur vous octroie vous confèrent des sorts. Vous lancez des sorts d'occultiste en utilisant le Charisme. DD de sauvegarde = 8 + bonus de maîtrise + mod. de Charisme ; bonus d'attaque des sorts = bonus de maîtrise + mod. de Charisme. Vos emplacements de sorts sont tous du même niveau et se rechargent à la fin d'un repos court ou long. Vous connaissez un nombre limité de sorts mineurs et de sorts (voir progression) ; à chaque montée de niveau, vous pouvez remplacer un sort connu par un autre de la liste d'occultiste. Vous pouvez utiliser un focaliseur arcanique comme focalisateur d'incantation.",
    effet: {
      type: "incantation",
      caracteristique: "charisme",
      typeLanceur: "pacte", // → EMPLACEMENTS_PACTE dans src/data/ressources.js
      ddFormule: "8 + bonus_maitrise + mod_charisme",
      attaqueFormule: "bonus_maitrise + mod_charisme",
      focaliseur: "focaliseur_arcanique",
      rituels: false,
      preparation: "sorts_connus",
      rechargeEmplacements: RECHARGE.COURT,
    },
  },
  manifestations_occultes: {
    nom: "Manifestations occultes",
    niveau: 2,
    type: "choix",
    description:
      "Vous glanez des fragments de savoir interdit qui vous octroient des capacités permanentes. Vous en choisissez deux au niveau 2 ; leur nombre augmente aux niveaux 5, 7, 9, 12, 15 et 18. À chaque montée de niveau, vous pouvez remplacer une manifestation par une autre dont vous remplissez les prérequis.",
    effet: {
      type: "choix_manifestations",
      parmi: Object.keys(MANIFESTATIONS),
      // Le nombre connu est porté par progression[].manifestations
    },
  },
  faveur_du_pacte: {
    nom: "Faveur du pacte",
    niveau: 3,
    type: "choix",
    description:
      "Votre protecteur vous octroie un don : Pacte de la Chaîne, Pacte de la Lame ou Pacte du Grimoire.",
    effet: { type: "choix_faveur_pacte", parmi: Object.keys(FAVEURS_DU_PACTE) },
  },
  arcanum_mystique: {
    nom: "Arcanum mystique",
    niveau: 11,
    type: "passif",
    description:
      "Votre protecteur vous accorde un secret magique appelé arcanum : choisissez un sort d'occultiste de niveau 6. Vous pouvez le lancer une fois sans dépenser d'emplacement de sorts, et devez terminer un repos long pour le relancer. Vous obtenez un arcanum de niveau 7 au niveau 13, de niveau 8 au niveau 15 et de niveau 9 au niveau 17. Chacun est récupéré à un repos long.",
    effet: {
      type: "arcanum",
      paliers: [
        { niveau: 11, niveauSort: 6 }, { niveau: 13, niveauSort: 7 },
        { niveau: 15, niveauSort: 8 }, { niveau: 17, niveauSort: 9 },
      ],
      utilisationsParArcanum: 1,
      recharge: RECHARGE.LONG,
    },
  },
  maitre_occulte: {
    nom: "Maître occulte",
    niveau: 20,
    type: "special",
    ressource: { max: 1, recharge: RECHARGE.LONG },
    description:
      "Vous pouvez faire appel à votre protecteur pour récupérer tous vos emplacements de sorts dépensés. Une fois cette capacité utilisée, vous devez terminer un repos long avant de pouvoir la réutiliser.",
    effet: { type: "recuperation_totale_emplacements" },
  },
};

// ============================================================================
//  PROGRESSION 1-20
//    attaques       : nombre d'attaques via l'action Attaquer (toujours 1 ;
//                     Lame assoiffée passe à 2 via une manifestation, pas la table)
//    sortsMineurs   : sorts mineurs connus
//    sortsConnus    : sorts connus
//    manifestations : nombre de Manifestations occultes connues
//    arcanumMax     : niveau du plus haut arcanum obtenu (null avant le niveau 11)
//    capacites      : identifiants acquis à ce niveau (tronc commun)
//    asi            : Amélioration de caractéristiques (ou don) disponible
//    archetype      : true → une capacité de la sous-classe est acquise à ce niveau
//    notes          : améliorations signalées à la montée de niveau
//  Emplacements de sorts → EMPLACEMENTS_PACTE (src/data/ressources.js)
// ============================================================================
export const PROGRESSION = [
  { niveau: 1,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 2,  manifestations: 0, arcanumMax: null, asi: false, archetype: true,  capacites: ["protecteur_outre_monde", "magie_de_pacte"], notes: ["Sorts mineurs : 2", "Sorts connus : 2"] },
  { niveau: 2,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 3,  manifestations: 2, arcanumMax: null, asi: false, archetype: false, capacites: ["manifestations_occultes"], notes: ["Manifestations : 2", "Sorts connus : 3"] },
  { niveau: 3,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 2, sortsConnus: 4,  manifestations: 2, arcanumMax: null, asi: false, archetype: false, capacites: ["faveur_du_pacte"], notes: ["Sorts connus : 4"] },
  { niveau: 4,  bonusMaitrise: 2, attaques: 1, sortsMineurs: 3, sortsConnus: 5,  manifestations: 2, arcanumMax: null, asi: true,  archetype: false, capacites: [], notes: ["Sorts mineurs : 3", "Sorts connus : 5"] },
  { niveau: 5,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 6,  manifestations: 3, arcanumMax: null, asi: false, archetype: false, capacites: [], notes: ["Manifestations : 3", "Sorts connus : 6"] },
  { niveau: 6,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 7,  manifestations: 3, arcanumMax: null, asi: false, archetype: true,  capacites: [], notes: ["Sorts connus : 7"] },
  { niveau: 7,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 8,  manifestations: 4, arcanumMax: null, asi: false, archetype: false, capacites: [], notes: ["Manifestations : 4", "Sorts connus : 8"] },
  { niveau: 8,  bonusMaitrise: 3, attaques: 1, sortsMineurs: 3, sortsConnus: 9,  manifestations: 4, arcanumMax: null, asi: true,  archetype: false, capacites: [], notes: ["Sorts connus : 9"] },
  { niveau: 9,  bonusMaitrise: 4, attaques: 1, sortsMineurs: 3, sortsConnus: 10, manifestations: 5, arcanumMax: null, asi: false, archetype: false, capacites: [], notes: ["Manifestations : 5", "Sorts connus : 10"] },
  { niveau: 10, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 10, manifestations: 5, arcanumMax: null, asi: false, archetype: true,  capacites: [], notes: ["Sorts mineurs : 4"] },
  { niveau: 11, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 11, manifestations: 5, arcanumMax: 6,    asi: false, archetype: false, capacites: ["arcanum_mystique"], notes: ["Arcanum mystique : niveau 6", "Sorts connus : 11"] },
  { niveau: 12, bonusMaitrise: 4, attaques: 1, sortsMineurs: 4, sortsConnus: 11, manifestations: 6, arcanumMax: 6,    asi: true,  archetype: false, capacites: [], notes: ["Manifestations : 6"] },
  { niveau: 13, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 12, manifestations: 6, arcanumMax: 7,    asi: false, archetype: false, capacites: [], notes: ["Arcanum mystique : niveau 7", "Sorts connus : 12"] },
  { niveau: 14, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 12, manifestations: 6, arcanumMax: 7,    asi: false, archetype: true,  capacites: [], notes: [] },
  { niveau: 15, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 13, manifestations: 7, arcanumMax: 8,    asi: false, archetype: false, capacites: [], notes: ["Arcanum mystique : niveau 8", "Manifestations : 7", "Sorts connus : 13"] },
  { niveau: 16, bonusMaitrise: 5, attaques: 1, sortsMineurs: 4, sortsConnus: 13, manifestations: 7, arcanumMax: 8,    asi: true,  archetype: false, capacites: [], notes: [] },
  { niveau: 17, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 14, manifestations: 7, arcanumMax: 9,    asi: false, archetype: false, capacites: [], notes: ["Arcanum mystique : niveau 9", "Sorts connus : 14"] },
  { niveau: 18, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 14, manifestations: 8, arcanumMax: 9,    asi: false, archetype: false, capacites: [], notes: ["Manifestations : 8"] },
  { niveau: 19, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 15, manifestations: 8, arcanumMax: 9,    asi: true,  archetype: false, capacites: [], notes: ["Sorts connus : 15"] },
  { niveau: 20, bonusMaitrise: 6, attaques: 1, sortsMineurs: 4, sortsConnus: 15, manifestations: 8, arcanumMax: 9,    asi: false, archetype: false, capacites: ["maitre_occulte"], notes: [] },
];

// ============================================================================
//  CLASSE — objet racine
// ============================================================================
export const OCCULTISTE = {
  id: "occultiste",
  nom: "Occultiste",
  source: "SRD 5.1 FR",
  deVie: 8, // d8
  pvNiveau1: 8, // + modificateur de Constitution
  caracteristiquesPrincipales: ["charisme"],
  sauvegardes: ["sagesse", "charisme"],
  maitrises: {
    armures: ["legeres"],
    armes: ["simples"],
    outils: [],
  },
  competences: {
    nombre: 2,
    liste: ["arcanes", "tromperie", "histoire", "intimidation", "investigation", "nature", "religion"],
  },
  incantation: {
    caracteristique: "charisme",
    typeLanceur: "pacte",
    focaliseur: "focaliseur_arcanique",
    rituels: false,
    rechargeEmplacements: RECHARGE.COURT,
  },
  faveursDuPacte: FAVEURS_DU_PACTE,
  manifestations: MANIFESTATIONS,
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

/** Nombre de sorts connus à un niveau donné. */
export function sortsConnus(niveau) {
  return ligne(niveau).sortsConnus;
}

/** Nombre de Manifestations occultes connues à un niveau donné. */
export function nombreManifestations(niveau) {
  return ligne(niveau).manifestations;
}

/** Niveaux d'arcanum obtenus jusqu'à un niveau donné (ex. [6, 7] au niveau 13). */
export function arcanumsObtenus(niveau) {
  return CAPACITES.arcanum_mystique.effet.paliers
    .filter((p) => niveau >= p.niveau)
    .map((p) => p.niveauSort);
}

/**
 * Manifestations occultes disponibles à un niveau donné, pour une faveur du
 * pacte et une liste de sorts connus. Filtre sur `prerequis` (niveau / pacte / sort).
 */
export function manifestationsDisponibles(niveau, faveurPacteId = null, sortsConnusIds = []) {
  return Object.values(MANIFESTATIONS).filter((m) => {
    const p = m.prerequis ?? {};
    if (p.niveau && niveau < p.niveau) return false;
    if (p.pacte && p.pacte !== faveurPacteId) return false;
    if (p.sort && !sortsConnusIds.includes(p.sort)) return false;
    return true;
  });
}

/** Sorts étendus de la sous-classe, aplatis (toutes les listes de niveaux de sort). */
export function sortsEtendus(sousClasseId) {
  const table = SOUS_CLASSES[sousClasseId]?.sortsEtendus;
  if (!table) return [];
  return Object.values(table).flat();
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

export default OCCULTISTE;