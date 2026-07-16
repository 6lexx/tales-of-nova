// Préférences utilisateur — profiles.preferences (JSONB) + profiles.pseudo.
//
// Les défauts vivent ICI, pas en base : la colonne est à '{}' et toute lecture
// doit tolérer un objet vide ou partiel. Aucune migration de données à prévoir
// quand une préférence apparaît ou disparaît.

import { supabase } from '../lib/supabase'

export const PREFERENCES_DEFAUT = {
  affichage: { tailleTexte: 'M', densite: 'aere' },
  narration: { longueur: 'standard' },
}

// Valeurs admises. Une valeur inconnue (préférence retirée, JSONB bricolé à la
// main) retombe sur le défaut plutôt que de casser l'affichage.
export const VALEURS = {
  tailleTexte: ['S', 'M', 'L'],
  densite: ['compact', 'aere'],
  longueur: ['concis', 'standard', 'immersif'],
}

const valide = (cle, v) => (VALEURS[cle].includes(v) ? v : null)

/**
 * Complète un objet partiel avec les défauts, section par section.
 * Un spread à plat ne suffirait pas : { affichage: { tailleTexte: 'L' } }
 * effacerait `densite`.
 */
export function fusionner(prefs) {
  const p = prefs ?? {}
  const a = p.affichage ?? {}
  const n = p.narration ?? {}
  return {
    affichage: {
      tailleTexte: valide('tailleTexte', a.tailleTexte) ?? PREFERENCES_DEFAUT.affichage.tailleTexte,
      densite: valide('densite', a.densite) ?? PREFERENCES_DEFAUT.affichage.densite,
    },
    narration: {
      longueur: valide('longueur', n.longueur) ?? PREFERENCES_DEFAUT.narration.longueur,
    },
  }
}

/* ── Valeurs d'affichage ───────────────────────────────────────────
   Source UNIQUE, lue par Game.jsx (le fil) et Profil.jsx (l'aperçu).
   Si l'aperçu et le fil tiraient chacun leurs constantes, le premier
   mentirait au premier écart.
   Les défauts (M / aere) reprennent exactement les valeurs actuelles de
   Game.jsx : un compte qui n'a rien réglé ne voit aucun changement.
   ───────────────────────────────────────────────────────────────── */

export const TAILLE_NARRATION = { S: 13.5, M: 15, L: 17 }

export const DENSITE_JOURNAL = {
  compact: { gap: 8, padding: '10px 14px' },
  aere: { gap: 16, padding: '14px 18px' },
}

/** Préférences complètes (défauts inclus) d'un utilisateur. */
export async function chargerPreferences(userId) {
  const { data, error } = await supabase
    .from('profiles').select('preferences').eq('id', userId).single()
  if (error) throw error
  return fusionner(data?.preferences)
}

/**
 * Écrit un patch partiel sans rien détruire.
 * ex. sauverPreferences(id, { affichage: { tailleTexte: 'L' } })
 * `densite` et `narration.longueur` sont conservées.
 */
export async function sauverPreferences(userId, patch = {}) {
  const actuelles = await chargerPreferences(userId)
  const nouvelles = {
    affichage: { ...actuelles.affichage, ...(patch.affichage ?? {}) },
    narration: { ...actuelles.narration, ...(patch.narration ?? {}) },
  }
  const { error } = await supabase
    .from('profiles').update({ preferences: fusionner(nouvelles) }).eq('id', userId)
  if (error) throw error
  return fusionner(nouvelles)
}

/* ── Compte ────────────────────────────────────────────────────────
   `pseudo` est une COLONNE, pas une préférence : elle ne passe pas par
   le JSONB. Même table, même policy « own profile », d'où sa place ici.
   ───────────────────────────────────────────────────────────────── */

export async function chargerPseudo(userId) {
  const { data, error } = await supabase
    .from('profiles').select('pseudo').eq('id', userId).single()
  if (error) throw error
  return data?.pseudo ?? null
}

export async function sauverPseudo(userId, pseudo) {
  const v = (pseudo ?? '').trim()
  const { error } = await supabase
    .from('profiles').update({ pseudo: v || null }).eq('id', userId)
  if (error) throw error
  return v || null
}