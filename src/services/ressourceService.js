// Économie de ressources du personnage : emplacements de sorts + ressources de classe.
// État courant persisté dans fiche.mecanique.ressources (JSONB), fusion non destructive.
// Les MAX sont recalculés depuis la classe/niveau ; seuls les "actuel" sont stockés.

import { supabase } from '../lib/supabase';
import {
  EMPLACEMENTS_COMPLET, EMPLACEMENTS_DEMI, EMPLACEMENTS_PACTE, TYPE_LANCEUR, RESSOURCES_CLASSE,
} from '../data/ressources';

const NORM = { Mage: 'Magicien', Voleur: 'Roublard' };
const classeCanon = (c) => NORM[c] || c;
const clamp = (n, max) => Math.max(0, Math.min(max, n));

// Emplacements max par niveau de sort → { "1": max, "2": max, ... } (+ pacte : { pacte:{nb,niveau} }).
function emplacementsMax(perso) {
  const classe = classeCanon(perso.classe);
  const type = TYPE_LANCEUR[classe];
  const niv = perso.niveau ?? 1;
  if (!type) return {};
  if (type === 'pacte') {
    const e = EMPLACEMENTS_PACTE[niv];
    return e ? { pacte: { nb: e.nb, niveau: e.niveau } } : {};
  }
  const table = type === 'demi' ? EMPLACEMENTS_DEMI : EMPLACEMENTS_COMPLET;
  const arr = table[niv] || [];
  const out = {};
  arr.forEach((n, i) => { if (n > 0) out[i + 1] = n; });
  return out;
}

function ressourcesClasseMax(perso) {
  const fn = RESSOURCES_CLASSE[classeCanon(perso.classe)];
  return fn ? fn(perso) : [];
}

// Snapshot complet : max recalculés + actuel lu depuis fiche (défaut = max).
export function etatRessources(perso) {
  const stock = perso?.fiche?.mecanique?.ressources ?? {};
  const empMax = emplacementsMax(perso);
  const emplacements = {};
  for (const [k, max] of Object.entries(empMax)) {
    if (k === 'pacte') {
      const actuel = stock.emplacements?.pacte ?? max.nb;
      emplacements.pacte = { ...max, actuel: clamp(actuel, max.nb) };
    } else {
      const actuel = stock.emplacements?.[k] ?? max;
      emplacements[k] = { max, actuel: clamp(actuel, max) };
    }
  }
  const classe = ressourcesClasseMax(perso).map((r) => ({
    ...r,
    actuel: clamp(stock.classe?.[r.cle] ?? r.max, r.max),
  }));
  return { emplacements, classe };
}

// Sérialise l'état (actuel uniquement) pour stockage.
function serialiser(etat) {
  const emplacements = {};
  for (const [k, v] of Object.entries(etat.emplacements)) {
    emplacements[k] = k === 'pacte' ? v.actuel : v.actuel;
  }
  const classe = {};
  etat.classe.forEach((r) => { classe[r.cle] = r.actuel; });
  return { emplacements, classe };
}

async function persister(perso, etat) {
  const fiche = perso.fiche ?? {};
  const mecanique = { ...(fiche.mecanique ?? {}), ressources: serialiser(etat) };
  const { error } = await supabase
    .from('characters').update({ fiche: { ...fiche, mecanique } }).eq('id', perso.id);
  if (error) throw error;
  return { ...perso, fiche: { ...fiche, mecanique } };
}

// Ajuste un emplacement (cle = niveau "1".."9" ou "pacte") d'un delta signé.
export async function ajusterEmplacement(perso, cle, delta) {
  const etat = etatRessources(perso);
  const slot = etat.emplacements[cle];
  if (!slot) return perso;
  const max = cle === 'pacte' ? slot.nb : slot.max;
  slot.actuel = clamp(slot.actuel + delta, max);
  return persister(perso, etat);
}

// Ajuste une ressource de classe d'un delta signé.
export async function ajusterRessource(perso, cle, delta) {
  const etat = etatRessources(perso);
  const r = etat.classe.find((x) => x.cle === cle);
  if (!r) return perso;
  r.actuel = clamp(r.actuel + delta, r.max);
  return persister(perso, etat);
}

async function chargerPerso(characterId) {
  const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single();
  if (error) throw error;
  return data;
}

// Consomme un emplacement de sort du niveau donné (ou pacte). Renvoie le perso à jour.
export async function consommerEmplacement(characterId, niveauSort) {
  const perso = await chargerPerso(characterId);
  const etat = etatRessources(perso);
  const cle = etat.emplacements.pacte ? 'pacte' : String(niveauSort);
  const slot = etat.emplacements[cle];
  if (!slot || slot.actuel <= 0) return perso;
  etat.emplacements[cle].actuel -= 1;
  return persister(perso, etat);
}

// Ajuste une ressource de classe (montant signé, ex. -1 pour dépenser, +1 pour rendre).
export async function consommerRessource(characterId, cle, montant = 1) {
  const perso = await chargerPerso(characterId);
  const etat = etatRessources(perso);
  const r = etat.classe.find((x) => x.cle === cle);
  if (!r) return perso;
  r.actuel = clamp(r.actuel - montant, r.max);
  return persister(perso, etat);
}

// Repos : 'court' restaure recharge='court' + pacte ; 'long' restaure tout + PV au max.
export async function repos(characterId, type = 'long') {
  const perso = await chargerPerso(characterId);
  const etat = etatRessources(perso);
  for (const [k, v] of Object.entries(etat.emplacements)) {
    if (k === 'pacte') v.actuel = v.nb;
    else if (type === 'long') v.actuel = v.max;
  }
  etat.classe.forEach((r) => { if (type === 'long' || r.recharge === 'court') r.actuel = r.max; });

  const majPerso = await persister(perso, etat);
  if (type === 'long' && majPerso.pv_max != null) {
    const { error } = await supabase
      .from('characters').update({ pv_actuels: majPerso.pv_max }).eq('id', characterId);
    if (error) throw error;
    return { ...majPerso, pv_actuels: majPerso.pv_max };
  }
  return majPerso;
}