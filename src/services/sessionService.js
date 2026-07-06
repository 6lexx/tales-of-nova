import { supabase } from '../lib/supabase'

// Indique si une campagne existe déjà pour ce personnage (lecture seule, ne crée rien).
export async function campagneExistePour(characterId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('character_id', characterId)
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

// Récupère ou crée une session pour un personnage donné
export async function getOrCreateSession(characterId) {
  const { data: { user } } = await supabase.auth.getUser()

  // Cherche d'abord une campagne existante pour ce perso
  let { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Crée la campagne si elle n'existe pas
  if (!campaign) {
    const { data: newCampaign, error } = await supabase
      .from('campaigns')
      .insert({ user_id: user.id, character_id: characterId, titre: 'Nouvelle aventure' })
      .select()
      .single()
    if (error) throw error
    campaign = newCampaign
  }

  // Cherche une session ouverte
  let { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Crée la session si elle n'existe pas
  if (!session) {
    const { data: newSession, error } = await supabase
      .from('game_sessions')
      .insert({ user_id: user.id, campaign_id: campaign.id, etat: {} })
      .select()
      .single()
    if (error) throw error
    session = newSession
  }

  return session
}

// Charge les messages d'une session (les 50 derniers)
export async function loadMessages(sessionId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) throw error
  return data
}

// Sauvegarde un message en base
export async function saveMessage(sessionId, role, content) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, user_id: user.id, role, content })
  if (error) throw error
}

// Met à jour le résumé et le lieu de la session
export async function updateSession(sessionId, patch) {
  const { error } = await supabase
    .from('game_sessions')
    .update(patch)
    .eq('id', sessionId)
  if (error) throw error
}

// Liste toutes les campagnes de l'utilisateur avec perso + dernière session
export async function listCampagnes() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, titre, created_at,
      characters ( id, nom, espece, classe, niveau, pv_actuels, pv_max ),
      game_sessions ( id, resume, lieu_actuel, created_at )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map((c) => {
    const sessions = Array.isArray(c.game_sessions) ? c.game_sessions : []
    const derniere = sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
    return { ...c, derniere_session: derniere, game_sessions: undefined }
  })
}