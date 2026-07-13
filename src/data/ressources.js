// Données SRD 5.1 : emplacements de sorts (par type de lanceur) et ressources de classe.
// Clés de classe = nom canonique stocké (Magicien, Roublard, Rôdeur…).

/* ── Emplacements de sorts par niveau de personnage ── */

// Lanceur complet : slots[niveau] = [n1..n9]
export const EMPLACEMENTS_COMPLET = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
  6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Demi-lanceur (Paladin, Rôdeur) : pas de sorts au niveau 1
export const EMPLACEMENTS_DEMI = {
  1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2],
  6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2], 10: [4, 3, 2],
  11: [4, 3, 3], 12: [4, 3, 3], 13: [4, 3, 3, 1], 14: [4, 3, 3, 1], 15: [4, 3, 3, 2],
  16: [4, 3, 3, 2], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1], 19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2],
};

// Magie de pacte (Occultiste) : { nb, niveau } — se rechargent au repos COURT
export const EMPLACEMENTS_PACTE = {
  1: { nb: 1, niveau: 1 }, 2: { nb: 2, niveau: 1 }, 3: { nb: 2, niveau: 2 }, 4: { nb: 2, niveau: 2 },
  5: { nb: 2, niveau: 3 }, 6: { nb: 2, niveau: 3 }, 7: { nb: 2, niveau: 4 }, 8: { nb: 2, niveau: 4 },
  9: { nb: 2, niveau: 5 }, 10: { nb: 2, niveau: 5 }, 11: { nb: 3, niveau: 5 }, 12: { nb: 3, niveau: 5 },
  13: { nb: 3, niveau: 5 }, 14: { nb: 3, niveau: 5 }, 15: { nb: 3, niveau: 5 }, 16: { nb: 3, niveau: 5 },
  17: { nb: 4, niveau: 5 }, 18: { nb: 4, niveau: 5 }, 19: { nb: 4, niveau: 5 }, 20: { nb: 4, niveau: 5 },
};

// Type de lanceur par classe (nom canonique)
export const TYPE_LANCEUR = {
  Magicien: 'complet', Clerc: 'complet', Druide: 'complet', Ensorceleur: 'complet', Barde: 'complet',
  Paladin: 'demi', 'Rôdeur': 'demi',
  Occultiste: 'pacte',
};

/* ── Ressources de classe ──
   Chaque entrée : (perso) => { cle, label, max, recharge } | null
   recharge : 'court' (repos court ou long) | 'long' */
const mod = (v) => Math.floor(((v ?? 10) - 10) / 2);
const PB = (n) => [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6][Math.min(20, Math.max(1, n || 1)) - 1];
const rageMax = (n) => (n >= 20 ? 99 : n >= 17 ? 6 : n >= 12 ? 5 : n >= 6 ? 4 : n >= 3 ? 3 : 2);

export const RESSOURCES_CLASSE = {
  Barbare: (p) => [{ cle: 'rage', label: 'Rage', max: rageMax(p.niveau), recharge: 'long' }],
  Guerrier: (p) => [
    { cle: 'second_souffle', label: 'Second souffle', max: 1, recharge: 'court' },
    { cle: 'fougue', label: 'Fougue', max: p.niveau >= 17 ? 2 : 1, recharge: 'court' },
    ...(p.niveau >= 9 ? [{ cle: 'indomptable', label: 'Indomptable', max: p.niveau >= 17 ? 3 : p.niveau >= 13 ? 2 : 1, recharge: 'long' }] : []),
  ],
  Moine: (p) => (p.niveau >= 2 ? [{ cle: 'ki', label: 'Points de ki', max: p.niveau, recharge: 'court' }] : []),
  Ensorceleur: (p) => (p.niveau >= 2 ? [{ cle: 'sorcellerie', label: 'Points de sorcellerie', max: p.niveau, recharge: 'long' }] : []),
  Barde: (p) => [{ cle: 'inspiration', label: 'Inspiration bardique', max: Math.max(1, mod(p.charisme)), recharge: p.niveau >= 5 ? 'court' : 'long' }],
  Clerc: (p) => [{ cle: 'conduit_divin', label: 'Conduit divin', max: p.niveau >= 18 ? 3 : p.niveau >= 6 ? 2 : 1, recharge: 'court' }],
  Druide: (p) => [{ cle: 'forme_sauvage', label: 'Forme sauvage', max: 2, recharge: 'court' }],
  Paladin: (p) => [
    { cle: 'imposition_mains', label: 'Imposition des mains', max: 5 * p.niveau, recharge: 'long' },
    { cle: 'sens_divin', label: 'Sens divin', max: 1 + mod(p.charisme), recharge: 'long' },
  ],
  'Rôdeur': () => [],
  Roublard: () => [],
  Magicien: (p) => (p.niveau >= 1 ? [{ cle: 'recup_arcanique', label: 'Récupération arcanique', max: 1, recharge: 'long' }] : []),
  Occultiste: () => [],
};

export const _helpers = { mod, PB };