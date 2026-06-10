import { supabase } from '../lib/supabase'

// =====================================================================
//  CODEX — encyclopédie débloquable
// =====================================================================
// Débloqué via le tag MJ [CODEX: cat:pnj | cle:"padhrane" | titre:"Padhrane"
//  | resume:"..." | detail:1]. Ré-appeler le tag avec un detail supérieur
// enrichit l'entrée (upgrade progressif de la connaissance).

const CATEGORIES = ['pnj', 'lieu', 'faction', 'divinite', 'creature', 'evenement', 'objet']

export async function getCodex(campaignId, categorie = null) {
  let q = supabase
    .from('codex_entries')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('decouvert', true)
    .order('categorie')
    .order('titre')
  if (categorie) q = q.eq('categorie', categorie)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

// Regroupe par catégorie pour l'affichage onglets/sections.
export async function getCodexGrouped(campaignId) {
  const all = await getCodex(campaignId)
  const grouped = {}
  for (const cat of CATEGORIES) grouped[cat] = []
  for (const e of all) (grouped[e.categorie] ??= []).push(e)
  return grouped
}

// Débloque ou enrichit une entrée. Idempotent grâce à uq_codex_entry.
// N'écrase un résumé existant que si le nouveau detail est supérieur.
export async function unlockEntry({
  campaignId, categorie, cle, titre,
  resume = null, sourceTable = null, sourceId = null, detail = 1,
}) {
  const { data: existing } = await supabase
    .from('codex_entries')
    .select('id, niveau_detail')
    .eq('campaign_id', campaignId)
    .eq('categorie', categorie)
    .eq('cle', cle)
    .maybeSingle()

  if (existing) {
    if (detail <= existing.niveau_detail) return existing // rien de neuf
    const { data, error } = await supabase
      .from('codex_entries')
      .update({ titre, resume, niveau_detail: detail })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('codex_entries')
    .insert({
      campaign_id: campaignId,
      categorie, cle, titre, resume,
      source_table: sourceTable, source_id: sourceId,
      niveau_detail: detail,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export { CATEGORIES as CODEX_CATEGORIES }
