// Orchestration de la création d'une campagne depuis la page de paramétrage.
// Génère l'arc (arcService) puis crée campaigns(avec arc) + game_sessions.
// NB : insertion de la quête immédiate + accroche dérivée de l'arc → étape 4.

import { supabase } from '../lib/supabase'
import { getCharacter } from './characterService'
import { genererArcCampagne } from './arcService'

/**
 * Crée une nouvelle campagne complète pour un personnage.
 * @param {string} characterId
 * @param {object} options  Options de la page « Nouvelle campagne ».
 * @returns {Promise<{campagne: object, session: object, arc: object}>}
 */
export async function demarrerNouvelleCampagne(characterId, options = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Session expirée — reconnecte-toi.')

  // 1. Personnage complet (identité + historique généré) → matière première de l'arc.
  const perso = await getCharacter(characterId)
  if (!perso) throw new Error('Personnage introuvable.')

  // 2. Génération de la bible d'arc via le relais mj.
  const arc = await genererArcCampagne(perso, options)

  // 3. Création de la campagne, arc embarqué.
  const { data: campagne, error: eCamp } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      character_id: characterId,
      titre: titreDepuisArc(arc, perso),
      ton: options.ton || arc.ton || null,
      arc,
    })
    .select()
    .single()
  if (eCamp) throw eCamp

  // 4. Session de jeu rattachée.
  const { data: session, error: eSess } = await supabase
    .from('game_sessions')
    .insert({ user_id: user.id, campaign_id: campagne.id, etat: {} })
    .select()
    .single()
  if (eSess) throw eSess

  return { campagne, session, arc }
}

// Titre lisible dérivé de l'arc (fallback sur le nom du perso).
function titreDepuisArc(arc = {}, perso = {}) {
  const nomAntago = arc?.antagoniste?.nom?.trim()
  if (nomAntago) return `L'ombre de ${nomAntago}`
  return `L'aventure de ${perso?.nom ?? 'Nova'}`
}