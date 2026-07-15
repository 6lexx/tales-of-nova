import { supabase } from '../lib/supabase'

// Indique si une campagne EN COURS existe déjà pour ce personnage (lecture seule, ne crée rien).
// Une campagne terminée (mort ou réussite) ne bloque plus le personnage : il peut repartir
// pour une nouvelle aventure. C'est ce filtre qui rend le perso réutilisable.
export async function campagneExistePour(characterId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('character_id', characterId)
    .eq('statut', 'en_cours')
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

// Campagne (métadonnées) par son id — sert au verrou de lecture seule et aux archives.
export async function getCampagne(campaignId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, titre, statut, fin_raison, terminee_le, created_at, character_id')
    .eq('id', campaignId)
    .single()
  if (error) throw error
  return data
}

// Erreur typée : aucune campagne en cours pour ce personnage. Le front doit
// rediriger vers le paramétrage (/campagne/nouvelle/:id), pas créer une coquille.
export class PasDeCampagneError extends Error {
  constructor(characterId) {
    super("Aucune campagne en cours pour ce personnage.")
    this.name = 'PasDeCampagneError'
    this.characterId = characterId
  }
}

// Récupère la session de la campagne EN COURS d'un personnage.
// /!\ Ne crée plus de campagne au vol : l'ancienne version en fabriquait une
// titrée « Nouvelle aventure » SANS arc. Après une fin de campagne, tout retour
// sur /jeu/:id aurait produit une coquille vide. On lève PasDeCampagneError et
// c'est au front de renvoyer vers /campagne/nouvelle/:id.
export async function getOrCreateSession(characterId) {
  const { data: { user } } = await supabase.auth.getUser()

  // Campagne EN COURS uniquement : une campagne terminée ne se rouvre pas ici.
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('character_id', characterId)
    .eq('statut', 'en_cours')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!campaign) throw new PasDeCampagneError(characterId)

  // Cherche une session ouverte
  let { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
// `statut` remonte tel quel : c'est Campagnes.jsx qui sépare en cours / terminées.
export async function listCampagnes() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, titre, created_at, statut, fin_raison, terminee_le,
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