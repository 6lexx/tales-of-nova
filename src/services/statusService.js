import { supabase } from '../lib/supabase'
import { CONDITIONS } from '../data/conditions'

// =====================================================================
//  CONDITIONS
// =====================================================================

export async function getConditions(characterId) {
  const { data, error } = await supabase
    .from('character_conditions')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at')
  if (error) throw error
  // enrichit avec la table de référence pour l'affichage
  return (data ?? []).map((c) => ({
    ...c,
    ref: CONDITIONS[c.condition_key] ?? { label: c.condition_key, effets: [] },
  }))
}

export async function addCondition(characterId, conditionKey, opts = {}) {
  const { campaignId = null, source = null, dureeType = 'indeterminee',
          dureeValeur = null, note = null } = opts
  const { data, error } = await supabase
    .from('character_conditions')
    .upsert(
      {
        character_id: characterId,
        campaign_id: campaignId,
        condition_key: conditionKey,
        source,
        duree_type: dureeType,
        duree_valeur: dureeValeur,
        note,
      },
      { onConflict: 'character_id,condition_key' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeCondition(characterId, conditionKey) {
  const { error } = await supabase
    .from('character_conditions')
    .delete()
    .eq('character_id', characterId)
    .eq('condition_key', conditionKey)
  if (error) throw error
}

// =====================================================================
//  RESSOURCES & REPOS
// =====================================================================

export async function getResources(characterId) {
  const { data, error } = await supabase
    .from('character_resources')
    .select('*')
    .eq('character_id', characterId)
    .order('type')
  if (error) throw error
  return data ?? []
}

export async function spendResource(characterId, resourceKey, amount = 1) {
  const { data: row, error: e1 } = await supabase
    .from('character_resources')
    .select('current_value')
    .eq('character_id', characterId)
    .eq('resource_key', resourceKey)
    .single()
  if (e1) throw e1
  const next = Math.max(0, row.current_value - amount) // trigger re-clamp de toute façon
  const { data, error } = await supabase
    .from('character_resources')
    .update({ current_value: next })
    .eq('character_id', characterId)
    .eq('resource_key', resourceKey)
    .select()
    .single()
  if (error) throw error
  return data
}

// Repos : restaure les ressources selon leur règle de recharge.
// court  -> recharge in ('court')
// long   -> recharge in ('court','long','aube')  (le repos long restaure tout)
export async function applyRest(characterId, type = 'long') {
  const rechargeable = type === 'court' ? ['court'] : ['court', 'long', 'aube']
  const { data: rows, error: e1 } = await supabase
    .from('character_resources')
    .select('id, resource_key, max_value, recharge, type')
    .eq('character_id', characterId)
    .in('recharge', rechargeable)
  if (e1) throw e1

  // Repos court : seuls "court" se restaurent ; les dés de vie ne se
  // restaurent qu'au repos long (règle 5e). On les exclut ici.
  const toRestore = (rows ?? []).filter(
    (r) => !(type === 'court' && r.type === 'hit_dice')
  )

  const updates = toRestore.map((r) =>
    supabase
      .from('character_resources')
      .update({ current_value: r.max_value })
      .eq('id', r.id)
  )
  await Promise.all(updates)

  return { type, restored: toRestore.map((r) => r.resource_key) }
}
