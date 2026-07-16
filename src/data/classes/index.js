// ============================================================================
//  INDEX DES CLASSES — src/data/classes/index.js
// ----------------------------------------------------------------------------
//  Point d'entrée unique pour aller d'un identifiant de classe à sa définition.
//  Les modules de classe ne peuvent pas être importés dynamiquement côté client :
//  ce fichier est le seul endroit qui les liste.
//
//  DEUX IDENTIFIANTS COEXISTENT — ce n'est pas un oubli :
//
//    • `id`  : celui porté par les fichiers de classe eux-mêmes
//              ("guerrier", "magicien", "roublard", "rodeur"…).
//    • `nom` : le nom canonique ("Guerrier", "Magicien", "Roublard", "Rôdeur").
//              C'est ce qui est écrit en base (`characters.classe` reçoit
//              `classe?.nom` — CharacterCreator.jsx L319/L374) et c'est aussi la
//              clé de RESSOURCES_CLASSE / TYPE_LANCEUR dans src/data/ressources.js.
//
//  ATTENTION : les ids d'UI de CLASSES dans CharacterCreator.jsx ne sont PAS
//  alignés sur les ids des fichiers de classe — L72 porte `id: "mage"` et L73
//  `id: "voleur"`, là où les fichiers portent "magicien" et "roublard".
//  Conséquence concrète : `classeParId(id.classe)` renvoie `undefined` pour ces
//  deux classes tant que les ids d'UI n'ont pas été renommés. Depuis le
//  créateur, utiliser `classeParNom(classe?.nom)` — le `nom` est le seul
//  identifiant commun à l'UI, aux fichiers de classe, à ressources.js et à la base.
//
//  Aucune table de correspondance n'est introduite ici : ce serait masquer la
//  divergence au lieu de la résoudre. Le jour où les ids d'UI sont renommés,
//  `classeParId` devient utilisable depuis le créateur sans toucher ce fichier.
// ============================================================================

import BARBARE from "./barbare.js";
import BARDE from "./barde.js";
import CLERC from "./clerc.js";
import DRUIDE from "./druide.js";
import ENSORCELEUR from "./ensorceleur.js";
import GUERRIER from "./guerrier.js";
import MAGICIEN from "./magicien.js";
import MOINE from "./moine.js";
import OCCULTISTE from "./occultiste.js";
import PALADIN from "./paladin.js";
import RODEUR from "./rodeur.js";
import ROUBLARD from "./roublard.js";

/** Définition racine de chaque classe, par `id` de fichier de classe. */
export const CLASSES_DATA = {
  [BARBARE.id]: BARBARE,
  [BARDE.id]: BARDE,
  [CLERC.id]: CLERC,
  [DRUIDE.id]: DRUIDE,
  [ENSORCELEUR.id]: ENSORCELEUR,
  [GUERRIER.id]: GUERRIER,
  [MAGICIEN.id]: MAGICIEN,
  [MOINE.id]: MOINE,
  [OCCULTISTE.id]: OCCULTISTE,
  [PALADIN.id]: PALADIN,
  [RODEUR.id]: RODEUR,
  [ROUBLARD.id]: ROUBLARD,
};

/** Définition racine de chaque classe, par nom canonique (= clé en base). */
export const CLASSES_PAR_NOM = Object.fromEntries(
  Object.values(CLASSES_DATA).map((c) => [c.nom, c])
);

/**
 * Définition de classe par id de fichier ("guerrier", "magicien", "roublard"…).
 * Renvoie null pour les ids d'UI "mage"/"voleur" — voir l'en-tête.
 */
export function classeParId(classeId) {
  return CLASSES_DATA[classeId] ?? null;
}

/** Définition de classe par nom canonique ("Guerrier", "Rôdeur"…) — tel que stocké en base. */
export function classeParNom(nom) {
  return CLASSES_PAR_NOM[nom] ?? null;
}

/** Maîtrises d'une classe depuis son nom canonique : { armures, armes, outils }. */
export function maitrisesClasse(nom) {
  return CLASSES_PAR_NOM[nom]?.maitrises ?? { armures: [], armes: [], outils: [] };
}

/** Liste des 12 classes, triée par nom : [{ id, nom }]. */
export function listeClasses() {
  return Object.values(CLASSES_DATA)
    .map(({ id, nom }) => ({ id, nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export default CLASSES_DATA;