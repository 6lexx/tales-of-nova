// État de combat, stocké dans game_sessions.etat.combat.
// Le joueur figure dans l'ordre d'initiative ; ses PV restent characters.pv_actuels
// (dégâts joueur via [PV]). Les ennemis ont leurs PV suivis ici.

import { supabase } from '../lib/supabase';

const mod = (v) => Math.floor(((v ?? 10) - 10) / 2);
const d20 = () => 1 + Math.floor(Math.random() * 20);
const VIDE = { actif: false, round: 0, tour: 0, ordre: [] };

async function lire(sessionId) {
  const { data, error } = await supabase.from('game_sessions').select('etat').eq('id', sessionId).single();
  if (error) throw error;
  const etat = data?.etat ?? {};
  return { etat, combat: etat.combat ?? { ...VIDE } };
}
async function sauver(sessionId, etat, combat) {
  const { error } = await supabase.from('game_sessions').update({ etat: { ...etat, combat } }).eq('id', sessionId);
  if (error) throw error;
  return combat;
}
const caPerso = (p) => p?.fiche?.mecanique?.ca ?? (10 + mod(p?.dexterite));
const trier = (ordre) => [...ordre].sort((a, b) => (b.init - a.init) || (a.type === 'perso' ? -1 : 1));
const trouve = (ordre, cible) => {
  const c = (cible || '').trim().toLowerCase();
  return ordre.find((x) => x.type === 'ennemi' && x.nom.toLowerCase() === c)
    || ordre.find((x) => x.type === 'ennemi' && x.nom.toLowerCase().includes(c));
};

export async function chargerCombat(sessionId) {
  const { combat } = await lire(sessionId);
  return combat;
}

export async function demarrer(sessionId, characterId) {
  const { data: p } = await supabase.from('characters').select('*').eq('id', characterId).single();
  const { etat } = await lire(sessionId);
  const joueur = { id: 'perso', type: 'perso', nom: p?.nom ?? 'Vous', init: d20() + mod(p?.dexterite), ca: caPerso(p) };
  return sauver(sessionId, etat, { actif: true, round: 1, tour: 0, ordre: [joueur] });
}

export async function ajouterEnnemi(sessionId, { nom, pv, ca, init }) {
  const { etat, combat } = await lire(sessionId);
  if (!combat.actif || !nom) return combat;
  const e = {
    id: 'e' + Date.now().toString(36) + Math.floor(Math.random() * 999),
    type: 'ennemi', nom, pvMax: pv || 1, pv: pv || 1, ca: ca || 10,
    init: init ?? d20(), statut: 'actif',
  };
  return sauver(sessionId, etat, { ...combat, ordre: trier([...combat.ordre, e]) });
}

export async function degats(sessionId, cible, n) {
  const { etat, combat } = await lire(sessionId);
  const e = trouve(combat.ordre, cible);
  if (!e) return combat;
  const ordre = combat.ordre.map((x) => {
    if (x.id !== e.id) return x;
    const pv = Math.max(0, x.pv - (n || 0));
    return { ...x, pv, statut: pv <= 0 ? 'mort' : x.statut };
  });
  return sauver(sessionId, etat, { ...combat, ordre });
}

export async function soin(sessionId, cible, n) {
  const { etat, combat } = await lire(sessionId);
  const e = trouve(combat.ordre, cible);
  if (!e) return combat;
  const ordre = combat.ordre.map((x) => (x.id === e.id
    ? { ...x, pv: Math.min(x.pvMax, x.pv + (n || 0)), statut: 'actif' } : x));
  return sauver(sessionId, etat, { ...combat, ordre });
}

export async function retirer(sessionId, nom) {
  const { etat, combat } = await lire(sessionId);
  const e = trouve(combat.ordre, nom);
  if (!e) return combat;
  const ordre = combat.ordre.filter((x) => x.id !== e.id);
  return sauver(sessionId, etat, { ...combat, ordre, tour: Math.min(combat.tour, Math.max(0, ordre.length - 1)) });
}

export async function tourSuivant(sessionId) {
  const { etat, combat } = await lire(sessionId);
  if (!combat.actif || !combat.ordre.length) return combat;
  let tour = combat.tour + 1;
  let round = combat.round;
  if (tour >= combat.ordre.length) { tour = 0; round += 1; }
  return sauver(sessionId, etat, { ...combat, tour, round });
}

export async function terminer(sessionId) {
  const { etat } = await lire(sessionId);
  return sauver(sessionId, etat, { ...VIDE });
}