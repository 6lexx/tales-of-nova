// Génère une trame de fond pour un personnage en appelant l'edge function "mj".
// Sortie JSON structurée : 6 champs d'histoire + 4 champs de personnalité.

import { supabase } from '../lib/supabase'

const CLES_HISTOIRE = ['origine', 'declencheur', 'motivation', 'lien', 'secret', 'faille']
const CLES_PERSO = ['trait', 'ideal', 'lienPerso', 'defaut']

export async function genererHistoire({ identite = {}, themes = [], histoire = {}, personnalite = {} }) {
  const system = `Tu es le Maître du Jeu d'une partie de D&D 5e en français.
On te demande une trame de fond cohérente et évocatrice (ton sombre-fantasy) pour un personnage joueur.
Tu réponds UNIQUEMENT par un objet JSON valide, sans aucun texte autour ni balise Markdown.
Schéma exact (toutes les valeurs sont des chaînes de 1 à 2 phrases) :
{
  "origine": "", "declencheur": "", "motivation": "", "lien": "", "secret": "", "faille": "",
  "trait": "", "ideal": "", "lienPerso": "", "defaut": ""
}
Règles :
- Respecte et prolonge les champs déjà remplis fournis (ne les contredis jamais).
- Priorise les thèmes narratifs fournis.
- "lien" = un PNJ encore vivant rattaché au passé ; "lienPerso" = l'attache morale du personnage (registre trait/idéal/lien/défaut).
- Reste cohérent avec l'espèce, la classe, l'historique et l'alignement.`

  const contexte = {
    nom: identite.nom || null,
    espece: identite.espece || null,
    classe: identite.classe || null,
    historique: identite.historique || null,
    alignement: identite.alignement || null,
    themes_prioritaires: themes,
    champs_deja_remplis: { ...histoire, ...personnalite },
  }

  const messages = [{
    role: 'user',
    content: `Génère la trame en JSON pour ce personnage :\n${JSON.stringify(contexte, null, 2)}`,
  }]

  const { data, error } = await supabase.functions.invoke('mj', {
    body: { messages, system, max_tokens: 1500 },
  })

  if (error) {
    let detail = error.message
    try { detail = JSON.stringify(await error.context.json()) } catch { /* noop */ }
    throw new Error(detail)
  }
  if (data?.error) throw new Error(JSON.stringify(data.error))

  const obj = extraireJSON(data.texte)
  const histoireOut = {}
  CLES_HISTOIRE.forEach((k) => { if (obj[k]) histoireOut[k] = obj[k] })
  const persoOut = {}
  CLES_PERSO.forEach((k) => { if (obj[k]) persoOut[k] = obj[k] })
  return { histoire: histoireOut, personnalite: persoOut }
}

function extraireJSON(texte = '') {
  const nettoye = texte.replace(/```json|```/g, '').trim()
  const debut = nettoye.indexOf('{')
  const fin = nettoye.lastIndexOf('}')
  if (debut === -1 || fin === -1) throw new Error('Réponse de l’IA illisible (JSON introuvable).')
  return JSON.parse(nettoye.slice(debut, fin + 1))
}