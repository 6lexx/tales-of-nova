// ============================================================================
//  Catalogue des ARMURES (SRD 5.1 FR)
// ----------------------------------------------------------------------------
//  categorie : "legere" (+ mod DEX complet) | "intermediaire" (+ DEX max 2)
//              | "lourde" (aucun DEX)
//  ca        : valeur de base ; le bouclier (+2) est géré à part
// ============================================================================

export const ARMURES = {
  // Légères
  matelassee:      { ref: "matelassee",      nom: "Armure matelassée",     categorie: "legere",        ca: 11, discretionDesavantage: true },
  cuir:            { ref: "cuir",            nom: "Armure de cuir",        categorie: "legere",        ca: 11 },
  cuir_cloute:     { ref: "cuir_cloute",     nom: "Armure de cuir clouté", categorie: "legere",        ca: 12 },
  // Intermédiaires (DEX plafonné à +2)
  peau:            { ref: "peau",            nom: "Armure de peau",        categorie: "intermediaire", ca: 12 },
  chemise_mailles: { ref: "chemise_mailles", nom: "Chemise de mailles",    categorie: "intermediaire", ca: 13 },
  ecailles:        { ref: "ecailles",        nom: "Armure d'écailles",     categorie: "intermediaire", ca: 14, discretionDesavantage: true },
  cuirasse:        { ref: "cuirasse",        nom: "Cuirasse",              categorie: "intermediaire", ca: 14 },
  demi_plate:      { ref: "demi_plate",      nom: "Demi-plate",            categorie: "intermediaire", ca: 15, discretionDesavantage: true },
  // Lourdes (aucun DEX)
  broigne:         { ref: "broigne",         nom: "Broigne",               categorie: "lourde",        ca: 14, discretionDesavantage: true },
  cotte_mailles:   { ref: "cotte_mailles",   nom: "Cotte de mailles",      categorie: "lourde",        ca: 16, forceMin: 13, discretionDesavantage: true },
  clibanion:       { ref: "clibanion",       nom: "Clibanion",             categorie: "lourde",        ca: 17, forceMin: 15, discretionDesavantage: true },
  harnois:         { ref: "harnois",         nom: "Harnois",               categorie: "lourde",        ca: 18, forceMin: 15, discretionDesavantage: true },
};

export const BONUS_BOUCLIER = 2;

export default ARMURES;