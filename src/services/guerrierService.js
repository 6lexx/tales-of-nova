// ============================================================================
//  guerrierService — Couche runtime du Guerrier (SRD 5.1)
// ----------------------------------------------------------------------------
//  Dérive l'état mécanique d'un personnage guerrier à partir de :
//    - ses stats + niveau (colonnes de `characters`)
//    - ses choix persistés dans `characters.fiche.mecanique`
//    - la donnée statique de classe (data/classes/guerrier.js)
//
//  Ne calcule PAS la CA ni les attaques d'arme (dépendent de l'équipement) :
//  tranche suivante. Ici : maîtrise, sauvegardes, compétences, capacités
//  actives, ressources (X/Y), seuil critique, nombre d'attaques, repos.
//
//  L'état persisté vit sous `fiche.mecanique` (clé namespacée) pour ne pas
//  entrer en conflit avec le reste de la fiche.
// ============================================================================

import {
  GUERRIER,
  STYLES_COMBAT,
  CAPACITES,
  RECHARGE,
  bonusMaitrise,
  nombreAttaques,
  capacitesTroncCommun,
  capacitesSousClasse,
  utilisationsMax,
} from "../data/classes/guerrier.js";
import { ARMURES, BONUS_BOUCLIER } from "../data/equipement/armures.js";
import { ARMES } from "../data/equipement/armes.js";

// Compétence → caractéristique (pour les 8 compétences du guerrier)
const CARAC_COMPETENCE = {
  acrobaties: "dexterite",
  dressage: "sagesse",
  athletisme: "force",
  histoire: "intelligence",
  perspicacite: "sagesse",
  intimidation: "charisme",
  perception: "sagesse",
  survie: "sagesse",
};

const LIBELLE_CARAC = {
  force: "FOR",
  dexterite: "DEX",
  constitution: "CON",
  intelligence: "INT",
  sagesse: "SAG",
  charisme: "CHA",
};

/** Modificateur d'une valeur de caractéristique. */
export function modCarac(valeur) {
  return Math.floor(((valeur ?? 10) - 10) / 2);
}

/** Formate un modificateur signé : 3 → "+3", -1 → "-1". */
export function signe(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// ----------------------------------------------------------------------------
//  Initialisation / mise à jour de l'état persisté (fiche.mecanique)
// ----------------------------------------------------------------------------
/**
 * Construit/rafraîchit `fiche.mecanique` pour un guerrier.
 * Fusionne dans la fiche existante sans écraser le reste.
 * Les ressources déjà consommées sont préservées (clampées au nouveau max).
 *
 * @param {object} perso  Ligne `characters` (niveau, fiche, sous_classe…)
 * @param {object} choix  { styleCombat, styleCombat2, sousClasse, competences[] }
 * @returns {object} nouvelle fiche complète (jsonb prêt à persister)
 */
export function initFicheGuerrier(perso = {}, choix = {}) {
  const niveau = perso.niveau ?? 1;
  const fiche = { ...(perso.fiche ?? {}) };
  const anc = fiche.mecanique ?? {};

  // Ressources : recalcul du max au niveau, conservation de l'actuel
  const ressources = {};
  for (const [id, cap] of Object.entries(CAPACITES)) {
    if (!cap.ressource) continue;
    const max = utilisationsMax(id, niveau);
    const actuel = anc.ressources?.[id]?.actuel;
    ressources[id] = {
      actuel: actuel == null ? max : Math.min(actuel, max),
      max,
    };
  }

  fiche.mecanique = {
    classe: "guerrier",
    styleCombat: choix.styleCombat ?? anc.styleCombat ?? null,
    styleCombat2: choix.styleCombat2 ?? anc.styleCombat2 ?? null, // Champion niv.10
    sousClasse: choix.sousClasse ?? anc.sousClasse ?? perso.sous_classe ?? null,
    competences: choix.competences ?? anc.competences ?? [],
    ressources,
  };
  return fiche;
}

// ----------------------------------------------------------------------------
//  Dérivation de l'état mécanique (snapshot lisible : prompt + fiche)
// ----------------------------------------------------------------------------
/**
 * Snapshot mécanique dérivé, recalculé à la volée (pas de cache périmé).
 * @param {object} perso Ligne `characters`
 */
export function etatMecanique(perso = {}) {
  const niveau = perso.niveau ?? 1;
  const meca = perso.fiche?.mecanique ?? {};
  const sousClasse = meca.sousClasse ?? perso.sous_classe ?? null;
  const pb = bonusMaitrise(niveau);

  // Sauvegardes : maîtrise en Force et Constitution
  const sauvegardes = {};
  for (const c of Object.keys(LIBELLE_CARAC)) {
    const maitrise = GUERRIER.sauvegardes.includes(c);
    sauvegardes[c] = {
      bonus: modCarac(perso[c]) + (maitrise ? pb : 0),
      maitrise,
    };
  }

  // Compétences (les 8 du guerrier ; maîtrise selon les choix)
  const competences = {};
  for (const [comp, carac] of Object.entries(CARAC_COMPETENCE)) {
    const maitrise = (meca.competences ?? []).includes(comp);
    competences[comp] = {
      carac,
      bonus: modCarac(perso[carac]) + (maitrise ? pb : 0),
      maitrise,
    };
  }

  // Capacités actives (tronc commun + sous-classe), ressources rattachées
  const capacites = [
    ...capacitesTroncCommun(niveau),
    ...capacitesSousClasse(sousClasse, niveau),
  ].map((cap) => {
    const res = meca.ressources?.[cap.id];
    return res ? { ...cap, ressource: { ...res } } : cap;
  });

  // Seuil critique : plus bas seuil accordé par la sous-classe (sinon 20)
  let seuilCritique = 20;
  for (const cap of capacitesSousClasse(sousClasse, niveau)) {
    if (cap.effet?.type === "seuil_critique") {
      seuilCritique = Math.min(seuilCritique, cap.effet.valeur);
    }
  }

  // Style(s) de combat résolus
  const styles = [meca.styleCombat, meca.styleCombat2]
    .filter(Boolean)
    .map((id) => STYLES_COMBAT[id])
    .filter(Boolean);

  const styleIds = styles.map((s) => s.id);

  return {
    niveau,
    bonusMaitrise: pb,
    initiative: modCarac(perso.dexterite),
    nombreAttaques: nombreAttaques(niveau),
    seuilCritique,
    sauvegardes,
    competences,
    styles,
    capacites,
    ca: calculerCA(perso, styleIds),
    attaques: calculerAttaques(perso, pb, styleIds, seuilCritique),
  };
}

// ----------------------------------------------------------------------------
//  Classe d'armure (dépend de l'équipement porté)
// ----------------------------------------------------------------------------
/**
 * @returns {{ valeur:number, detail:string, alerteForce?:string }}
 */
export function calculerCA(perso = {}, styleIds = []) {
  const equip = perso.fiche?.mecanique?.equipement ?? {};
  const modDex = modCarac(perso.dexterite);
  const armure = equip.armure ? ARMURES[equip.armure] : null;
  const bouclier = !!equip.bouclier;
  const defense = styleIds.includes("defense");

  let valeur;
  let detail;
  if (!armure) {
    valeur = 10 + modDex;
    detail = `10 ${signe(modDex)} (DEX)`;
  } else {
    let dexApplique = 0;
    if (armure.categorie === "legere") dexApplique = modDex;
    else if (armure.categorie === "intermediaire") dexApplique = Math.min(modDex, 2);
    valeur = armure.ca + dexApplique;
    detail = `${armure.nom} (${armure.ca})`;
    if (armure.categorie !== "lourde") detail += ` ${signe(dexApplique)} (DEX)`;
  }
  if (bouclier) {
    valeur += BONUS_BOUCLIER;
    detail += ` + ${BONUS_BOUCLIER} (bouclier)`;
  }
  if (defense && armure) {
    valeur += 1;
    detail += " + 1 (Défense)";
  }

  const out = { valeur, detail };
  if (armure?.forceMin && (perso.force ?? 10) < armure.forceMin) {
    out.alerteForce = `Force ${perso.force} < ${armure.forceMin} requise : vitesse réduite de 3 m.`;
  }
  return out;
}

// ----------------------------------------------------------------------------
//  Attaques d'arme (dépend de l'équipement porté)
// ----------------------------------------------------------------------------
/**
 * Génère une ligne d'attaque par arme équipée (le guerrier maîtrise toutes
 * les armes → bonus de maîtrise toujours appliqué). Applique les styles de
 * combat pertinents. Le jet du d20 reste au joueur (résolution hybride).
 */
export function calculerAttaques(perso = {}, pb = 2, styleIds = [], seuilCritique = 20) {
  const equip = perso.fiche?.mecanique?.equipement ?? {};
  const modForce = modCarac(perso.force);
  const modDex = modCarac(perso.dexterite);
  const critText = seuilCritique >= 20 ? "20" : `${seuilCritique}-20`;

  const armesEquipees = (equip.armes ?? [])
    .map((a) => ({ arme: ARMES[a.ref], main: a.main }))
    .filter((a) => a.arme);

  // À mains nues par défaut si rien d'équipé
  if (armesEquipees.length === 0) {
    return [
      {
        nom: "À mains nues",
        bonusAttaque: modForce + pb,
        degats: `${Math.max(1, 1 + modForce)} contondant`,
        portee: "corps_a_corps",
        critique: critText,
        notes: [],
      },
    ];
  }

  const uneSeuleArme = armesEquipees.length === 1;

  return armesEquipees.map(({ arme, main }) => {
    const distance = arme.portee === "distance";
    const props = arme.proprietes ?? {};
    // Caractéristique d'attaque : DEX à distance, FOR en mêlée, meilleure si finesse
    let modCaracAtt = distance ? modDex : modForce;
    if (props.finesse) modCaracAtt = Math.max(modForce, modDex);

    let bonusAttaque = modCaracAtt + pb;
    let modDegats = modCaracAtt;
    const notes = [];

    // Style Tir : +2 attaque à distance
    if (distance && styleIds.includes("tir")) bonusAttaque += 2;

    // Style Duel : +2 dégâts, une seule arme de mêlée à une main
    const deuxMains = props.deuxMains || main === "deux_mains";
    if (
      styleIds.includes("duel") &&
      !distance &&
      uneSeuleArme &&
      !deuxMains
    ) {
      modDegats += 2;
      notes.push("Duel : +2 dégâts inclus");
    }

    // Style Armes à deux mains : relance des 1 et 2 sur les dés de dégâts
    if (styleIds.includes("armes_a_deux_mains") && deuxMains) {
      notes.push("Relance les 1-2 aux dégâts");
    }

    // Dé de dégâts : version polyvalente si maniée à deux mains
    const de = props.polyvalente && main === "deux_mains" ? props.polyvalente : arme.dm;
    const degats = `${de}${signe(modDegats)} ${arme.typeDegats}`;

    if (props.allonge) notes.push("Allonge (3 m)");
    if (props.lancer) notes.push(`Lancer ${props.lancer[0]}/${props.lancer[1]} m`);
    if (props.munitions) notes.push(`Portée ${props.munitions[0]}/${props.munitions[1]} m`);

    return {
      nom: arme.nom,
      bonusAttaque,
      degats,
      portee: arme.portee,
      critique: critText,
      notes,
    };
  });
}

// ----------------------------------------------------------------------------
//  Ressources : consommation / recharge (branché sur le système [REPOS])
// ----------------------------------------------------------------------------
/**
 * Consomme 1 utilisation d'une ressource. Retourne la nouvelle fiche.
 * Renvoie la fiche inchangée si indisponible.
 */
export function consommerRessource(fiche = {}, capaciteId) {
  const res = fiche.mecanique?.ressources?.[capaciteId];
  if (!res || res.actuel <= 0) return fiche;
  return {
    ...fiche,
    mecanique: {
      ...fiche.mecanique,
      ressources: {
        ...fiche.mecanique.ressources,
        [capaciteId]: { ...res, actuel: res.actuel - 1 },
      },
    },
  };
}

/**
 * Recharge les ressources selon le type de repos.
 *  - "repos_court" : recharge les ressources à recharge COURT
 *  - "repos_long"  : recharge tout (COURT + LONG)
 * Retourne la nouvelle fiche.
 */
export function rechargerRepos(fiche = {}, typeRepos) {
  const ancRes = fiche.mecanique?.ressources ?? {};
  const ressources = {};
  for (const [id, res] of Object.entries(ancRes)) {
    const rechargeCap = CAPACITES[id]?.ressource?.recharge;
    const doitRecharger =
      typeRepos === RECHARGE.LONG || rechargeCap === RECHARGE.COURT;
    ressources[id] = doitRecharger ? { ...res, actuel: res.max } : { ...res };
  }
  return { ...fiche, mecanique: { ...fiche.mecanique, ressources } };
}

export default {
  modCarac,
  signe,
  initFicheGuerrier,
  etatMecanique,
  calculerCA,
  calculerAttaques,
  consommerRessource,
  rechargerRepos,
};