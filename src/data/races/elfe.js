// ============================================================================
//  ELFE — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
//
//  FIDÈLE AU SRD : l'Elfe de base est DEX +2 uniquement. Le +1 INT appartient
//  au Haut-elfe, le +1 SAG à l'Elfe des bois, le +1 CHA à l'Elfe noir.
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (tronc commun Elfe)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Habitué aux forêts crépusculaires et au ciel nocturne, vous bénéficiez d'une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — uniquement en nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  sens_aiguises: {
    nom: "Sens aiguisés",
    type: "passif",
    description: "Vous maîtrisez la compétence Perception.",
    effet: { type: "maitrise_additionnelle", competences: ["perception"] },
  },
  ascendance_feerique: {
    nom: "Ascendance féerique",
    type: "passif",
    description:
      "Vous avez l'avantage aux jets de sauvegarde contre l'état charmé, et la magie ne peut pas vous endormir.",
    effet: {
      type: "ascendance_feerique",
      avantageSauvegarde: ["charme"],
      immunite: ["sommeil_magique"],
    },
  },
  transe: {
    nom: "Transe",
    type: "passif",
    description:
      "Les elfes n'ont pas besoin de dormir. Ils méditent profondément, à demi conscients, pendant 4 heures par jour. Après une telle méditation, vous bénéficiez des mêmes avantages qu'un humain après 8 heures de sommeil.",
    effet: { type: "repos_long_reduit", heures: 4 },
  },
};

// ============================================================================
//  SOUS-RACES
// ============================================================================
export const SOUS_RACES = {
  haut_elfe: {
    id: "haut_elfe",
    nom: "Haut-elfe",
    bonusStats: { INT: 1 },
    traits: {
      entrainement_elfique_aux_armes: {
        nom: "Entraînement elfique aux armes",
        type: "passif",
        description: "Vous maîtrisez l'épée longue, l'épée courte, l'arc court et l'arc long.",
        effet: {
          type: "maitrise_additionnelle",
          armes: ["epee_longue", "epee_courte", "arc_court", "arc_long"],
        },
      },
      sort_mineur: {
        nom: "Sort mineur",
        type: "choix",
        description:
          "Vous connaissez un sort mineur de votre choix issu de la liste de sorts de magicien. L'Intelligence est votre caractéristique d'incantation pour ce sort.",
        effet: {
          type: "sorts_mineurs_additionnels",
          nombre: 1,
          source: "magicien",
          caracteristique: "INT",
        },
      },
      langue_supplementaire: {
        nom: "Langue supplémentaire",
        type: "choix",
        description: "Vous pouvez parler, lire et écrire une langue supplémentaire de votre choix.",
        effet: { type: "langues_additionnelles", nombre: 1 },
      },
    },
  },
  elfe_des_bois: {
    id: "elfe_des_bois",
    nom: "Elfe des bois",
    bonusStats: { SAG: 1 },
    traits: {
      entrainement_elfique_aux_armes: {
        nom: "Entraînement elfique aux armes",
        type: "passif",
        description: "Vous maîtrisez l'épée longue, l'épée courte, l'arc court et l'arc long.",
        effet: {
          type: "maitrise_additionnelle",
          armes: ["epee_longue", "epee_courte", "arc_court", "arc_long"],
        },
      },
      pieds_legers: {
        nom: "Pieds légers",
        type: "passif",
        description: "Votre vitesse de base passe à 10,50 m.",
        effet: { type: "vitesse", valeur: 10.5 },
      },
      cachette_naturelle: {
        nom: "Cachette naturelle",
        type: "passif",
        description:
          "Vous pouvez tenter de vous cacher même si vous n'êtes que légèrement obscurci par un feuillage, une pluie battante, de la neige, de la brume ou tout autre phénomène naturel.",
        effet: { type: "discretion_conditionnelle", condition: "obscurcissement_naturel_leger" },
      },
    },
  },
  elfe_noir: {
    id: "elfe_noir",
    nom: "Elfe noir (Drow)",
    bonusStats: { CHA: 1 },
    traits: {
      vision_dans_le_noir_superieure: {
        nom: "Vision dans le noir supérieure",
        type: "passif",
        description: "Votre vision dans le noir a une portée de 36 m au lieu de 18 m.",
        effet: { type: "vision_dans_le_noir", portee: 36, remplace: "vision_dans_le_noir" },
      },
      sensibilite_au_soleil: {
        nom: "Sensibilité au soleil",
        type: "passif",
        description:
          "Vous avez un désavantage aux jets d'attaque et aux tests de Sagesse (Perception) reposant sur la vue quand vous, votre cible ou ce que vous tentez de percevoir se trouve en pleine lumière du soleil.",
        effet: {
          type: "desavantage_conditionnel",
          jets: ["attaque", "perception_visuelle"],
          condition: "lumiere_du_soleil_directe",
        },
      },
      magie_drow: {
        nom: "Magie drow",
        type: "special",
        description:
          "Vous connaissez le sort mineur lumières. Au niveau 3, vous pouvez lancer lueurs féeriques une fois par repos long ; au niveau 5, vous pouvez lancer ténèbres une fois par repos long. Le Charisme est votre caractéristique d'incantation pour ces sorts.",
        effet: {
          type: "sorts_raciaux",
          caracteristique: "CHA",
          sorts: [
            { sort: "lumières", niveau: 1, usage: "a_volonte" },
            { sort: "lueurs féeriques", niveau: 3, usage: 1, recharge: RECHARGE.LONG },
            { sort: "ténèbres", niveau: 5, usage: 1, recharge: RECHARGE.LONG },
          ],
        },
      },
      entrainement_drow_aux_armes: {
        nom: "Entraînement drow aux armes",
        type: "passif",
        description: "Vous maîtrisez la rapière, l'épée courte et l'arbalète de poing.",
        effet: {
          type: "maitrise_additionnelle",
          armes: ["rapiere", "epee_courte", "arbalete_de_poing"],
        },
      },
    },
  },
};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const ELFE = {
  id: "elfe",
  nom: "Elfe",
  source: "SRD 5.1 FR",
  bonusStats: { DEX: 2 },
  bonusLibres: 0,
  taille: { categorie: "M", minCm: 150, maxCm: 190 },
  vitesse: 9,
  ageMaturite: 100,
  ageMax: 750,
  langues: ["commun", "elfique"],
  languesAuChoix: 0, // le Haut-elfe en gagne une via sa sous-race
  traits: TRAITS,
  sousRaces: SOUS_RACES,
  sousRaceRequise: true,
};

// ============================================================================
//  HELPERS PURS
// ============================================================================

/** Bonus de caractéristiques cumulés (race + sous-race), clés FOR/DEX/CON/INT/SAG/CHA. */
export function bonusStatsComplets(sousRaceId = null) {
  const sr = SOUS_RACES[sousRaceId];
  const out = { ...ELFE.bonusStats };
  for (const [cle, val] of Object.entries(sr?.bonusStats ?? {})) {
    out[cle] = (out[cle] ?? 0) + val;
  }
  return out;
}

/**
 * Traits cumulés (race + sous-race). Un trait de sous-race portant
 * `effet.remplace` évince le trait de race homonyme (cas du Drow).
 */
export function traitsComplets(sousRaceId = null) {
  const sr = SOUS_RACES[sousRaceId];
  const sup = Object.entries(sr?.traits ?? {}).map(([id, t]) => ({ id, origine: "sous_race", ...t }));
  const remplaces = new Set(sup.map((t) => t.effet?.remplace).filter(Boolean));
  const base = Object.entries(TRAITS)
    .filter(([id]) => !remplaces.has(id))
    .map(([id, t]) => ({ id, origine: "race", ...t }));
  return [...base, ...sup];
}

/** Vitesse effective : l'Elfe des bois porte la vitesse à 10,50 m. */
export function vitesse(sousRaceId = null) {
  const t = Object.values(SOUS_RACES[sousRaceId]?.traits ?? {});
  const surcharge = t.find((x) => x.effet?.type === "vitesse");
  return surcharge?.effet?.valeur ?? ELFE.vitesse;
}

/** Sorts raciaux disponibles à un niveau donné (Magie drow). */
export function sortsRaciaux(sousRaceId, niveau) {
  const t = Object.values(SOUS_RACES[sousRaceId]?.traits ?? {});
  const magie = t.find((x) => x.effet?.type === "sorts_raciaux");
  if (!magie) return [];
  return magie.effet.sorts.filter((s) => niveau >= s.niveau);
}

/** Liste des sous-races disponibles : [{ id, nom }]. */
export function sousRacesDisponibles() {
  return Object.values(SOUS_RACES).map(({ id, nom }) => ({ id, nom }));
}

export default ELFE;