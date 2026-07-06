import { supabase } from '../lib/supabase'

// Quêtes monobloc : titre + description + indices cumulés.
// Révélation = création à la volée (aucune quête pré-insérée en 'masquee').

// Récupère toutes les quêtes d'une campagne, séparées actives / archivées.
export async function listerQuetes(campaignId) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error

  const quetes = data || []
  return {
    actives: quetes.filter((q) => q.statut === 'active'),
    archivees: quetes.filter((q) => q.statut === 'accomplie' || q.statut === 'echouee'),
  }
}

// Liste compacte injectée dans le contexte du MJ (état courant, pour éviter les doublons).
export async function listerQuetesPourContexte(campaignId) {
  const { data, error } = await supabase
    .from('quests')
    .select('titre, type')
    .eq('campaign_id', campaignId)
    .eq('statut', 'active')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

// Crée une quête active (sert aussi à la révélation à la volée).
export async function creerQuete(campaignId, { titre, type = 'secondaire', description = '' }) {
  const { count } = await supabase
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  const { data, error } = await supabase
    .from('quests')
    .insert({
      campaign_id: campaignId,
      titre,
      type,
      description,
      statut: 'active',
      indices: [],
      ordre: count || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Résout un titre vers une quête active de la campagne (insensible à la casse).
async function trouverQueteParTitre(campaignId, titre) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('statut', 'active')
    .ilike('titre', titre)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// Ajoute un indice cumulatif à une quête active.
export async function ajouterIndice(campaignId, titre, indice) {
  const quete = await trouverQueteParTitre(campaignId, titre)
  if (!quete) return null
  const indices = Array.isArray(quete.indices) ? quete.indices : []
  const { data, error } = await supabase
    .from('quests')
    .update({ indices: [...indices, indice] })
    .eq('id', quete.id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Clôt une quête active : statut 'accomplie' ou 'echouee'.
export async function cloreQuete(campaignId, titre, statut) {
  if (statut !== 'accomplie' && statut !== 'echouee') return null
  const quete = await trouverQueteParTitre(campaignId, titre)
  if (!quete) return null
  const { data, error } = await supabase
    .from('quests')
    .update({ statut })
    .eq('id', quete.id)
    .select()
    .single()
  if (error) throw error
  return data
}