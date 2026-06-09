import { supabase } from '../lib/supabase'

export async function listCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, nom, espece, classe, sous_classe, niveau, pv_actuels, pv_max')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createCharacter(perso) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('characters')
    .insert({ ...perso, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCharacter(id) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}