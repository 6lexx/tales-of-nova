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

/* ════════════════════════════════════════════════════════════
   FIN DE CAMPAGNE
   Déclenchée par le MJ via [FIN|mort|raison] ou [FIN|reussie|raison].
   Le personnage n'est PAS touché : il reste réutilisable ailleurs.
   ════════════════════════════════════════════════════════════ */

export const STATUTS_FIN = {
  mort: 'terminee_mort',
  reussie: 'terminee_reussie',
}

/**
 * Clôt une campagne. Idempotent : une campagne déjà terminée n'est pas re-clôturée
 * (le MJ pourrait réémettre le tag ; on garde la première fin et sa date).
 * @param {string} campaignId
 * @param {'mort'|'reussie'} issue
 * @param {string} raison  Texte narratif du MJ.
 * @returns {Promise<object>} la campagne à jour
 */
export async function terminerCampagne(campaignId, issue, raison = null) {
  const statut = STATUTS_FIN[issue]
  if (!statut) throw new Error(`Issue de campagne inconnue : ${issue}`)

  const { data, error } = await supabase
    .from('campaigns')
    .update({ statut, fin_raison: raison, terminee_le: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('statut', 'en_cours')      // ← garde-fou : ne réécrit pas une fin déjà actée
    .select()
    .maybeSingle()
  if (error) throw error
  if (data) return data

  // Rien mis à jour : soit déjà terminée, soit id inconnu. On relit pour le savoir.
  const { data: existante, error: e2 } = await supabase
    .from('campaigns').select('*').eq('id', campaignId).single()
  if (e2) throw e2
  return existante
}

// Titre lisible dérivé de l'arc (fallback sur le nom du perso).
function titreDepuisArc(arc = {}, perso = {}) {
  const nomAntago = arc?.antagoniste?.nom?.trim()
  if (nomAntago) return `L'ombre de ${nomAntago}`
  return `L'aventure de ${perso?.nom ?? 'Nova'}`
}