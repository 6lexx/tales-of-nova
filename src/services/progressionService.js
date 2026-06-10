import { supabase } from '../lib/supabase'

// =====================================================================
//  PROGRESSION — MILESTONE
// =====================================================================
// Le MJ propose un palier via le tag [PALIER: niveau:X | raison:"..."].
// On l'enregistre non appliqué ; le joueur valide via l'écran de level-up,
// ce qui met à jour characters.level.

export async function proposeMilestone(characterId, toLevel, raison, campaignId = null) {
  const { data: char, error: e1 } = await supabase
    .from('characters')
    .select('level')
    .eq('id', characterId)
    .single()
  if (e1) throw e1

  const { data, error } = await supabase
    .from('level_milestones')
    .insert({
      character_id: characterId,
      campaign_id: campaignId,
      from_level: char.level,
      to_level: toLevel,
      raison,
      applique: false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPendingMilestone(characterId) {
  const { data, error } = await supabase
    .from('level_milestones')
    .select('*')
    .eq('character_id', characterId)
    .eq('applique', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data // null si aucun palier en attente
}

// Applique le palier : monte le perso de niveau et marque le palier validé.
// choices = { hp_gagnes, nouveaux_sorts, nouvelles_capacites... } à câbler
// avec ta logique de classe dans CharacterCreator/levelup.
export async function applyMilestone(milestoneId, characterId, toLevel, choices = {}) {
  const { error: e1 } = await supabase
    .from('characters')
    .update({ level: toLevel, ...choices })
    .eq('id', characterId)
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from('level_milestones')
    .update({ applique: true })
    .eq('id', milestoneId)
  if (e2) throw e2
}

// =====================================================================
//  RECAPS DE SESSION (auto, en fin de session)
// =====================================================================

export async function getRecaps(campaignId) {
  const { data, error } = await supabase
    .from('session_recaps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function getLastRecap(campaignId) {
  const { data, error } = await supabase
    .from('session_recaps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// Génère le recap via Claude à partir des messages de la session,
// puis le persiste. À appeler à la clôture d'une session.
// `invokeClaude` = ta fonction qui appelle l'edge function "mj"
// (passée en argument pour ne pas coupler ce service à claudeService).
export async function generateRecap({ campaignId, sessionId, invokeClaude }) {
  const { data: msgs, error: e1 } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at')
  if (e1) throw e1
  if (!msgs?.length) return null

  const transcript = msgs
    .map((m) => `${m.role === 'user' ? 'JOUEUR' : 'MJ'}: ${m.content}`)
    .join('\n')

  const system =
    'Tu résumes une session de jeu de rôle. Réponds UNIQUEMENT en JSON valide, ' +
    'sans backticks ni texte autour, au format : ' +
    '{"titre": string, "recit": string (2-4 phrases, ton "previously on..."), ' +
    '"evenements": string[], "revelations": string[], "fils_ouverts": string[]}.'

  const raw = await invokeClaude({
    system,
    messages: [{ role: 'user', content: transcript }],
  })

  let parsed
  try {
    parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim())
  } catch {
    parsed = { titre: null, recit: String(raw).slice(0, 800),
               evenements: [], revelations: [], fils_ouverts: [] }
  }

  const { data, error } = await supabase
    .from('session_recaps')
    .upsert(
      {
        campaign_id: campaignId,
        session_id: sessionId,
        titre: parsed.titre,
        recit: parsed.recit,
        evenements: parsed.evenements ?? [],
        revelations: parsed.revelations ?? [],
        fils_ouverts: parsed.fils_ouverts ?? [],
      },
      { onConflict: 'session_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}
