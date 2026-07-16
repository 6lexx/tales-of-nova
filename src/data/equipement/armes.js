// ============================================================================
//  Catalogue des ARMES (SRD 5.1 FR)
// ----------------------------------------------------------------------------
//  categorie   : "simple" | "guerre"
//  portee      : "corps_a_corps" | "distance"
//  dm          : dé de dégâts de base (ex. "1d8")
//  typeDegats  : "tranchant" | "perforant" | "contondant"
//  proprietes  : { finesse, legere, lourde, allonge, deuxMains, chargement,
//                  speciale, polyvalente:"1d10", lancer:[court,long],
//                  munitions:[court,long] }
//  Sous-ensemble pratique (toutes les armes de guerre + armes simples usuelles).
//  Extensible : ajouter une entrée suffit.
// ============================================================================

export const ARMES = {
  // --- Armes simples (usuelles) -------------------------------------------
  dague:            { ref: "dague",            nom: "Dague",              categorie: "simple", portee: "corps_a_corps", dm: "1d4",  typeDegats: "perforant",  proprietes: { finesse: true, legere: true, lancer: [6, 18] } },
  hachette:         { ref: "hachette",         nom: "Hachette",           categorie: "simple", portee: "corps_a_corps", dm: "1d6",  typeDegats: "tranchant",  proprietes: { legere: true, lancer: [6, 18] } },
  javeline:         { ref: "javeline",         nom: "Javeline",           categorie: "simple", portee: "corps_a_corps", dm: "1d6",  typeDegats: "perforant",  proprietes: { lancer: [9, 36] } },
  masse_armes:      { ref: "masse_armes",      nom: "Masse d'armes",      categorie: "simple", portee: "corps_a_corps", dm: "1d6",  typeDegats: "contondant" },
  baton:            { ref: "baton",            nom: "Bâton",              categorie: "simple", portee: "corps_a_corps", dm: "1d6",  typeDegats: "contondant", proprietes: { polyvalente: "1d8" } },
  epieu:            { ref: "epieu",            nom: "Épieu",              categorie: "simple", portee: "corps_a_corps", dm: "1d6",  typeDegats: "perforant",  proprietes: { polyvalente: "1d8", lancer: [6, 18] } },
  gourdin:          { ref: "gourdin",          nom: "Gourdin",            categorie: "simple", portee: "corps_a_corps", dm: "1d4",  typeDegats: "contondant", proprietes: { legere: true } },
  marteau_leger:    { ref: "marteau_leger",    nom: "Marteau léger",      categorie: "simple", portee: "corps_a_corps", dm: "1d4",  typeDegats: "contondant", proprietes: { legere: true, lancer: [6, 18] } },
  serpe:            { ref: "serpe",            nom: "Serpe",              categorie: "simple", portee: "corps_a_corps", dm: "1d4",  typeDegats: "tranchant",  proprietes: { legere: true } },
  arbalete_legere:  { ref: "arbalete_legere",  nom: "Arbalète légère",    categorie: "simple", portee: "distance",       dm: "1d8",  typeDegats: "perforant",  proprietes: { deuxMains: true, chargement: true, munitions: [24, 96] } },
  arc_court:        { ref: "arc_court",        nom: "Arc court",          categorie: "simple", portee: "distance",       dm: "1d6",  typeDegats: "perforant",  proprietes: { deuxMains: true, munitions: [24, 96] } },
  flechette:        { ref: "flechette",        nom: "Fléchette",          categorie: "simple", portee: "distance",       dm: "1d4",  typeDegats: "perforant",  proprietes: { finesse: true, lancer: [6, 18] } },
  fronde:           { ref: "fronde",           nom: "Fronde",             categorie: "simple", portee: "distance",       dm: "1d4",  typeDegats: "contondant", proprietes: { munitions: [9, 36] } },

  // --- Armes de guerre (mêlée) --------------------------------------------
  hache_armes:      { ref: "hache_armes",      nom: "Hache d'armes",      categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "tranchant",  proprietes: { polyvalente: "1d10" } },
  fleau:            { ref: "fleau",            nom: "Fléau",              categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "contondant" },
  glaive:           { ref: "glaive",           nom: "Glaive",             categorie: "guerre", portee: "corps_a_corps", dm: "1d10", typeDegats: "tranchant",  proprietes: { lourde: true, allonge: true, deuxMains: true } },
  grande_hache:     { ref: "grande_hache",     nom: "Grande hache",       categorie: "guerre", portee: "corps_a_corps", dm: "1d12", typeDegats: "tranchant",  proprietes: { lourde: true, deuxMains: true } },
  epee_deux_mains:  { ref: "epee_deux_mains",  nom: "Épée à deux mains",  categorie: "guerre", portee: "corps_a_corps", dm: "2d6",  typeDegats: "tranchant",  proprietes: { lourde: true, deuxMains: true } },
  hallebarde:       { ref: "hallebarde",       nom: "Hallebarde",         categorie: "guerre", portee: "corps_a_corps", dm: "1d10", typeDegats: "tranchant",  proprietes: { lourde: true, allonge: true, deuxMains: true } },
  lance_cavalerie:  { ref: "lance_cavalerie",  nom: "Lance de cavalerie", categorie: "guerre", portee: "corps_a_corps", dm: "1d12", typeDegats: "perforant",  proprietes: { allonge: true, speciale: true } },
  epee_longue:      { ref: "epee_longue",      nom: "Épée longue",        categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "tranchant",  proprietes: { polyvalente: "1d10" } },
  maillet:          { ref: "maillet",          nom: "Maillet",            categorie: "guerre", portee: "corps_a_corps", dm: "2d6",  typeDegats: "contondant", proprietes: { lourde: true, deuxMains: true } },
  morgenstern:      { ref: "morgenstern",      nom: "Morgenstern",        categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "perforant" },
  pique:            { ref: "pique",            nom: "Pique",              categorie: "guerre", portee: "corps_a_corps", dm: "1d10", typeDegats: "perforant",  proprietes: { lourde: true, allonge: true, deuxMains: true } },
  rapiere:          { ref: "rapiere",          nom: "Rapière",            categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "perforant",  proprietes: { finesse: true } },
  cimeterre:        { ref: "cimeterre",        nom: "Cimeterre",          categorie: "guerre", portee: "corps_a_corps", dm: "1d6",  typeDegats: "tranchant",  proprietes: { finesse: true, legere: true } },
  epee_courte:      { ref: "epee_courte",      nom: "Épée courte",        categorie: "guerre", portee: "corps_a_corps", dm: "1d6",  typeDegats: "perforant",  proprietes: { finesse: true, legere: true } },
  trident:          { ref: "trident",          nom: "Trident",            categorie: "guerre", portee: "corps_a_corps", dm: "1d6",  typeDegats: "perforant",  proprietes: { polyvalente: "1d8", lancer: [6, 18] } },
  pic_guerre:       { ref: "pic_guerre",       nom: "Pic de guerre",      categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "perforant" },
  marteau_guerre:   { ref: "marteau_guerre",   nom: "Marteau de guerre",  categorie: "guerre", portee: "corps_a_corps", dm: "1d8",  typeDegats: "contondant", proprietes: { polyvalente: "1d10" } },
  fouet:            { ref: "fouet",            nom: "Fouet",              categorie: "guerre", portee: "corps_a_corps", dm: "1d4",  typeDegats: "tranchant",  proprietes: { finesse: true, allonge: true } },

  // --- Armes de guerre (distance) -----------------------------------------
  arbalete_poing:   { ref: "arbalete_poing",   nom: "Arbalète de poing",  categorie: "guerre", portee: "distance",       dm: "1d6",  typeDegats: "perforant",  proprietes: { legere: true, chargement: true, munitions: [9, 36] } },
  arbalete_lourde:  { ref: "arbalete_lourde",  nom: "Arbalète lourde",    categorie: "guerre", portee: "distance",       dm: "1d10", typeDegats: "perforant",  proprietes: { lourde: true, deuxMains: true, chargement: true, munitions: [30, 120] } },
  arc_long:         { ref: "arc_long",         nom: "Arc long",           categorie: "guerre", portee: "distance",       dm: "1d8",  typeDegats: "perforant",  proprietes: { lourde: true, deuxMains: true, munitions: [45, 180] } },
};

export default ARMES;