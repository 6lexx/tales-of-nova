// ============================================================================
//  GNOME — Définition canonique de race (SRD 5.1 FR, millésime 2014)
// ----------------------------------------------------------------------------
//  Donnée statique et pure : aucune dépendance, aucun effet de bord.
//  Conventions : voir src/data/races/nain.js (clés FOR/DEX/CON…, ids de sous-race).
// ============================================================================

export const RECHARGE = {
  COURT: "repos_court",
  LONG: "repos_long",
};

// ============================================================================
//  TRAITS RACIAUX (tronc commun Gnome)
// ============================================================================
export const TRAITS = {
  vision_dans_le_noir: {
    nom: "Vision dans le noir",
    type: "passif",
    description:
      "Habitué à la vie souterraine, vous bénéficiez d'une vision supérieure dans le noir et la pénombre. Vous voyez dans la lumière faible à 18 m comme s'il s'agissait de lumière vive, et dans les ténèbres comme s'il s'agissait de lumière faible — uniquement en nuances de gris.",
    effet: { type: "vision_dans_le_noir", portee: 18 },
  },
  ruse_gnome: {
    nom: "Ruse gnome",
    type: "passif",
    description:
      "Vous avez l'avantage à tous les jets de sauvegarde d'Intelligence, de Sagesse et de Charisme contre la magie.",
    effet: {
      type: "avantage_sauvegarde",
      caracteristiques: ["INT", "SAG", "CHA"],
      condition: "contre_la_magie",
    },
  },
};

// ============================================================================
//  SOUS-RACES
// ============================================================================
export const SOUS_RACES = {
  gnome_des_forets: {
    id: "gnome_des_forets",
    nom: "Gnome des forêts",
    bonusStats: { DEX: 1 },
    traits: {
      illusionniste_ne: {
        nom: "Illusionniste né",
        type: "passif",
        description:
          "Vous connaissez le sort mineur illusion mineure. L'Intelligence est votre caractéristique d'incantation pour ce sort.",
        effet: {
          type: "sorts_raciaux",
          caracteristique: "INT",
          sorts: [{ sort: "illusion mineure", niveau: 1, usage: "a_volonte" }],
        },
      },
      communication_avec_les_petits_animaux: {
        nom: "Communication avec les petits animaux",
        type: "passif",
        description:
          "Grâce à des sons et des gestes, vous pouvez communiquer des idées simples aux bêtes de taille P ou inférieure.",
        effet: { type: "communication_animale", tailleMax: "P", complexite: "idees_simples" },
      },
    },
  },
  gnome_des_roches: {
    id: "gnome_des_roches",
    nom: "Gnome des roches",
    bonusStats: { CON: 1 },
    traits: {
      connaissance_de_l_artificier: {
        nom: "Connaissance de l'artificier",
        type: "passif",
        description:
          "Quand vous effectuez un test d'Intelligence (Histoire) lié à un objet magique, alchimique ou technologique, vous ajoutez le double de votre bonus de maîtrise au test, au lieu de votre bonus normal.",
        effet: {
          type: "double_maitrise",
          competence: "histoire",
          condition: "objet_magique_alchimique_ou_technologique",
          maitriseImplicite: true,
        },
      },
      bricoleur: {
        nom: "Bricoleur",
        type: "special",
        description:
          "Vous maîtrisez les outils de bricoleur. Avec ces outils, vous pouvez consacrer 1 heure et 10 po de matériaux à la construction d'un appareil mécanique de taille TP (CA 5, 1 PV). L'appareil cesse de fonctionner après 24 heures, à moins d'y consacrer 1 heure de réparation, ou si vous le démontez pour en récupérer les matériaux. Vous ne pouvez avoir que trois appareils actifs à la fois. Options : boîte à musique, briquet mécanique, jouet mécanique.",
        effet: {
          type: "bricolage",
          outils: ["outils_de_bricoleur"],
          cout: { heures: 1, po: 10 },
          appareilsMax: 3,
          dureeVie: "24 heures",
          options: ["boite_a_musique", "briquet_mecanique", "jouet_mecanique"],
        },
      },
    },
  },
};

// ============================================================================
//  RACE — objet racine
// ============================================================================
export const GNOME = {
  id: "gnome",
  nom: "Gnome",
  source: "SRD 5.1 FR",
  bonusStats: { INT: 2 },
  bonusLibres: 0,
  taille: { categorie: "P", minCm: 90, maxCm: 120 },
  vitesse: 7.5,
  ageMaturite: 40,
  ageMax: 500,
  langues: ["commun", "gnome"],
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
  const out = { ...GNOME.bonusStats };
  for (const [cle, val] of Object.entries(sr?.bonusStats ?? {})) {
    out[cle] = (out[cle] ?? 0) + val;
  }
  return out;
}

/** Traits cumulés (race + sous-race), enrichis de leur identifiant et de leur origine. */
export function traitsComplets(sousRaceId = null) {
  const base = Object.entries(TRAITS).map(([id, t]) => ({ id, origine: "race", ...t }));
  const sr = SOUS_RACES[sousRaceId];
  const sup = Object.entries(sr?.traits ?? {}).map(([id, t]) => ({ id, origine: "sous_race", ...t }));
  return [...base, ...sup];
}

/** Sorts raciaux d'une sous-race (Illusionniste né). */
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

export default GNOME;